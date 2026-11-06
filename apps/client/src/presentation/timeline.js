import {effectLife} from './effect-life.js';
import {shotKey,previewShots,previewCue,terminalPoints} from './previews.js';
import {createMovementKernel,predictMovement} from '../../../../packages/engine/src/movement/prediction.js';
import {sampleFlight} from './flight.js';
export class Timeline{
 constructor(){this.kernel=createMovementKernel();this.reset();this.metrics={accepted:0,discarded:0,corrections:[],arrivalGaps:[],sourceGaps:[],holds:0,interpolated:0};}
 reset(){this.static=null;this.walls=[];this.samples=[];this.history=[];this.predicted=null;this.lastSeq=0;this.renderTick=0;this.lifeKey='';this.effects=[];this.terminals=new Map();this.spawns=new Map();this.previews=new Map();this.pendingInputs=new Map();this.offset={x:0,y:0};this.correctedAt=0;}
 displayOffset(now){const k=.8**(Math.max(0,now-this.correctedAt)*.06);return {x:this.offset.x*k,y:this.offset.y*k};}
 setStatic(data){this.static=data;this.walls=(data.walls||[]).map(w=>({...w,pos:{x:w.x,y:w.y},width:w.w,height:w.h}));}
 accept(s,now=performance.now()){
  if(s.snapshotSeq<=this.lastSeq){this.metrics.discarded++;return false;}this.lastSeq=s.snapshotSeq;this.metrics.accepted++;
  const prev=this.samples.at(-1);if(prev){this.metrics.arrivalGaps.push(now-prev.at);this.metrics.sourceGaps.push((s.serverTick-prev.state.serverTick)*1000/60);}
  for(const q of s.shots){const spawn=this.spawns.get(q.id);if(spawn)spawn.seenInSnapshot=true;}
  this.samples.push({at:now,state:s});if(this.samples.length>40)this.samples.shift();
  for(const key of ['arrivalGaps','sourceGaps','corrections'])if(this.metrics[key].length>1200)this.metrics[key].splice(0,this.metrics[key].length-1200);
  for(const [index,angle]of s.movingWalls||[]){if(this.static?.walls[index])this.static.walls[index].angle=angle;if(this.walls?.[index])this.walls[index].angle=angle;}
  if(s.self){const key=s.self.lifeSeq+':'+s.self.warpSeq,changed=key!==this.lifeKey||s.self.alive!==this.predicted?.alive;if(changed){this.history=[];this.offset={x:0,y:0};this.lifeKey=key;this.previews.clear();this.pendingInputs.clear();this.effects=this.effects.filter(f=>!f.preview);}
   const before=this.predicted;this.history=this.history.filter(i=>i.seq>s.self.lastAppliedSeq&&i.clientTick>s.self.lastAppliedClientTick+(s.self.heldTicks||0));
   let corrected={...s.self};for(const input of this.history.slice(-12))corrected=predictMovement(this.kernel,corrected,input,this.collisionWalls(s),this.static);
   if(before&&!changed){const distance=Math.hypot(before.x-corrected.x,before.y-corrected.y);this.metrics.corrections.push(distance);
    const previous=this.displayOffset(now),x=previous.x+before.x-corrected.x,y=previous.y+before.y-corrected.y;
    // The server already moved the attacker. Show its melee step on this ACK.
    const step=s.self.visualProfiles?.attack?.step>0&&s.self.actions?.firedAttack>before.actions?.firedAttack;
    this.offset=!step&&distance<50&&Math.hypot(x,y)<50?{x,y}:{x:0,y:0};
    this.correctedAt=now;}
   for(const [key,q]of this.pendingInputs){const resolved=s.self.actions?.[q.kind]||0,fired=s.self.actions?.[q.kind==='attack'?'firedAttack':'firedSkill']||0;if(!s.self.alive||s.self.stunned>0||resolved>=q.seq&&fired!==q.seq)this.cancelPreview(q.kind,q.seq);else if(resolved>=q.seq||now>q.until)this.pendingInputs.delete(key);}
   this.predicted=corrected;
   for(const [id,q]of this.previews){const resolved=s.self.actions?.[q.actionKind]||0,fired=s.self.actions?.[q.actionKind==='attack'?'firedAttack':'firedSkill']||0;if(!s.self.alive||s.self.stunned>0||resolved>=q.actionSeq&&fired!==q.actionSeq)this.cancelPreview(q.actionKind,q.actionSeq);}
  }return true;
 }
 collisionWalls(s=this.samples.at(-1)?.state){return (this.walls||[]).concat((s?.farm?.b||[]).filter(b=>b[3]>0).map(b=>({x:b[1],y:b[2],w:2*b[5],h:2*b[5],angle:0})));}
 predict(input){if(!this.predicted)return;this.history.push(input);if(this.history.length>120)this.history.shift();this.predicted=predictMovement(this.kernel,this.predicted,input,this.collisionWalls(),this.static);}
 preview(kind,seq,aim,power=1){const self=this.predicted;if(!self)return;const now=performance.now();this.pendingInputs.set(kind+':'+seq,{kind,seq,until:now+3000});for(const q of previewShots(self,kind,seq,aim,now,power))this.previews.set(shotKey(q),q);const cue=previewCue(self,kind,seq,aim,this.renderTick);if(cue)this.effects.push(cue);}
 cancelPreview(kind,seq){this.pendingInputs.delete(kind+':'+seq);for(const [id,q]of this.previews)if(q.actionKind===kind&&q.actionSeq===seq)this.previews.delete(id);this.effects=this.effects.filter(f=>!f.preview||f.actionKind!==kind||f.actionSeq!==seq);}
 event(e,now=performance.now()){const d=e.data;if(e.type==='SHOT_SPAWN'){this.spawns.set(d.id,{...d,tick:e.serverTick,seenInSnapshot:false});}else if(e.type==='SHOT_END')this.terminals.set(d.id,{...d,tick:e.serverTick});else if(e.type==='FX'){if(d.sourceId===this.predicted?.id&&d.geometry?.seq)this.effects=this.effects.filter(f=>!f.preview||f.actionKind!==d.geometry.kind||f.actionSeq!==d.geometry.seq);this.effects.push({...d,id:e.eventId,tick:e.serverTick,receivedAt:now});}if(this.effects.length>300)this.effects.splice(0,this.effects.length-300);for(const map of [this.terminals,this.spawns])while(map.size>2048)map.delete(map.keys().next().value);}
 frame(now=performance.now()){
  const last=this.samples.at(-1);if(!last)return null;
  this.renderTick=Math.max(this.renderTick,last.state.serverTick+Math.min(150,now-last.at)*.06-4.5);
  let left=this.samples[0],right=last;for(let i=1;i<this.samples.length;i++)if(this.samples[i].state.serverTick>=this.renderTick){left=this.samples[i-1];right=this.samples[i];break;}
  const span=right.state.serverTick-left.state.serverTick,alpha=span?Math.max(0,Math.min(1,(this.renderTick-left.state.serverTick)/span)):1;
  const priorActors=new Map(left.state.actors.map(a=>[a.id,a])),priorShots=new Map(left.state.shots.map(q=>[q.id,q]));
  const actors=right.state.actors.flatMap(a=>{const row=priorActors.get(a.id),old=row?.lifeSeq===a.lifeSeq&&row?.warpSeq===a.warpSeq?row:null,past=this.renderTick<right.state.serverTick,base=past?old:a;if(!base)return [];return [{...base,x:old?old.x+(a.x-old.x)*alpha:a.x,y:old?old.y+(a.y-old.y)*alpha:a.y,statusTick:this.renderTick}];});
  if(now-last.at>150)this.metrics.holds++;else this.metrics.interpolated++;
  if(this.predicted){const index=actors.findIndex(a=>a.id===this.predicted.id);const offset=this.displayOffset(now);const self={...this.predicted,x:this.predicted.x+offset.x,y:this.predicted.y+offset.y,statusTick:last.state.serverTick};if(index>=0)actors[index]=self;else actors.push(self);}
  const selfId=this.predicted?.id,shots=[],residuals=[];
  for(const row of right.state.shots){const target=row.owner===selfId?last.state.serverTick:this.renderTick,end=this.terminals.get(row.id);if(end&&end.tick<=target)continue;if(row.kind==='transit'&&this.terminals.has(row.terminal)&&this.spawns.has(row.terminal))continue;if(row.start>target)continue;shots.push(sampleFlight(row,priorShots.get(row.id),right.state.serverTick,target,left.state.serverTick));}
  const visibleIds=new Set(shots.map(s=>s.id));
  const currentOwners=this.spawns.size?new Map(last.state.actors.map(a=>[a.id,a])):null;
  for(const [id,born]of this.spawns){
   const owner=currentOwners.get(born.owner);
   if(owner&&owner.lifeSeq!==born.life){this.spawns.delete(id);this.terminals.delete(id);continue;}
   const end=this.terminals.get(id),target=born.owner===selfId?Math.max(this.renderTick,last.state.serverTick):this.renderTick;
   if(target-born.tick>120&&!end||end&&target-end.tick>30){this.spawns.delete(id);if(end)this.terminals.delete(id);continue;}
   if(visibleIds.has(id)||born.tick>target)continue;
   if(!end||target<end.tick){if(!end&&born.seenInSnapshot||born.type==='ORBIT'||born.kind==='orbit'||!end&&target-born.tick>4.5)continue;const source=end?{...born,...end,path:end.path}:born;if(end&&!end.path?.length&&(end.curved||end.turn))continue;shots.push(sampleFlight(source,born,end?.tick??born.tick,target,born.tick));}
   else if(born.type!=='ORBIT'&&target-end.tick<12&&['projectile','hook','lob','bomb',undefined].includes(born.kind)){const points=terminalPoints(end,born);if(points.length>=4)residuals.push({kind:'transit',tick:end.tick,x:end.x,y:end.y,color:end.color,geometry:{points,width:Math.min(5,end.radius*.4),displayMs:200},terminal:id});}
  }
  for(const [id,end] of this.terminals)if(this.renderTick-end.tick>30)this.terminals.delete(id);
  const handed=new Set(shots.filter(q=>['projectile','hook','lob','bomb'].includes(q.kind)).map(shotKey));
  for(const [id,q]of this.previews){const ended=[...this.terminals.values()].some(e=>shotKey(e)===id);if(handed.has(id)||ended||now>q.expires){this.previews.delete(id);continue;}if(now<q.bornAt)continue;const ticks=Math.min((now-q.bornAt)*.06,q.rangeRemaining/Math.max(1,Math.hypot(q.dx,q.dy)));shots.push({...q,x:q.x+q.dx*ticks,y:q.y+q.dy*ticks});}
  this.effects=this.effects.filter(e=>{
   if(!actors.every(a=>(a.id!==e.targetId||e.geometry?.targetLife==null||a.lifeSeq===e.geometry.targetLife)&&(a.id!==e.sourceId||e.geometry?.lifeSeq==null||a.lifeSeq===e.geometry.lifeSeq)))return false;
   // A busy first paint must not discard a newly received confirmed contact.
   // Only its display clock is adjusted, once; server tick/position and all
   // attack/warning timings remain authoritative. Old/replayed FX never renew.
   if(e.kind==='hit'&&e.geometry?.confirmed&&!e.geometry.periodic&&e.firstVisibleAt==null&&e.tick<=this.renderTick&&this.renderTick-e.tick<=45&&now-e.receivedAt<=240){
    e.firstVisibleAt=now;e.displayTick=Math.max(e.tick,this.renderTick-2);
   }
   return this.renderTick-(e.displayTick??e.tick)<effectLife(e)*.06&&(e.firstVisibleAt==null||now-e.firstVisibleAt<effectLife(e));
  });return {...right.state,actors,shots,renderTick:this.renderTick,effects:this.effects.filter(e=>e.tick<=this.renderTick).concat(residuals)};
 }
}
