import {createMovementKernel,predictMovement} from '../../../../packages/engine/src/movement/prediction.js';
import {sampleFlight} from './flight.js';
export class Timeline{
 constructor(){this.kernel=createMovementKernel();this.reset();this.metrics={accepted:0,discarded:0,corrections:[],arrivalGaps:[],sourceGaps:[],holds:0,interpolated:0};}
 reset(){this.samples=[];this.history=[];this.predicted=null;this.lastSeq=0;this.renderTick=0;this.lifeKey='';this.effects=[];this.terminals=new Map();this.spawns=new Map();this.previews=new Map();this.offset={x:0,y:0};}
 setStatic(data){this.static=data;this.walls=(data.walls||[]).map(w=>({...w,pos:{x:w.x,y:w.y},width:w.w,height:w.h}));}
 accept(s,now=performance.now()){
  if(s.snapshotSeq<=this.lastSeq){this.metrics.discarded++;return false;}this.lastSeq=s.snapshotSeq;this.metrics.accepted++;
  const prev=this.samples.at(-1);if(prev){this.metrics.arrivalGaps.push(now-prev.at);this.metrics.sourceGaps.push((s.serverTick-prev.state.serverTick)*1000/60);}
  this.samples.push({at:now,state:s});if(this.samples.length>40)this.samples.shift();
  for(const key of ['arrivalGaps','sourceGaps','corrections'])if(this.metrics[key].length>1200)this.metrics[key].splice(0,this.metrics[key].length-1200);
  for(const [index,angle]of s.movingWalls||[]){if(this.static?.walls[index])this.static.walls[index].angle=angle;if(this.walls?.[index])this.walls[index].angle=angle;}
  if(s.self){const key=s.self.lifeSeq+':'+s.self.warpSeq,changed=key!==this.lifeKey;if(changed){this.history=[];this.offset={x:0,y:0};this.lifeKey=key;this.previews.clear();}
   const before=this.predicted;this.history=this.history.filter(i=>i.seq>s.self.lastAppliedSeq&&i.clientTick>s.self.lastAppliedClientTick+(s.self.heldTicks||0));
   let corrected={...s.self};for(const input of this.history.slice(-12))corrected=predictMovement(this.kernel,corrected,input,this.collisionWalls(s),this.static);
   if(before&&!changed){const distance=Math.hypot(before.x-corrected.x,before.y-corrected.y);this.metrics.corrections.push(distance);this.offset=distance<50?{x:before.x-corrected.x,y:before.y-corrected.y}:{x:0,y:0};}
   this.predicted=corrected;
  }return true;
 }
 collisionWalls(s=this.samples.at(-1)?.state){return (this.walls||[]).concat((s?.farm?.b||[]).filter(b=>b[3]>0).map(b=>({pos:{x:b[1],y:b[2]},width:2*b[5],height:2*b[5],angle:0})));}
 predict(input){if(!this.predicted)return;this.history.push(input);if(this.history.length>120)this.history.shift();this.predicted=predictMovement(this.kernel,this.predicted,input,this.collisionWalls(),this.static);}
 preview(kind,seq,aim){const s=this.predicted;if(!s)return;const id=s.id+':'+s.lifeSeq+':'+kind+':'+seq+':0';this.previews.set(id,{id,owner:s.id,life:s.lifeSeq,kind:'preview',actionKind:kind,actionSeq:seq,ordinal:0,x:s.x+aim.x*s.radius,y:s.y+aim.y*s.radius,dx:aim.x,dy:aim.y,radius:kind==='attack'?10:20,color:'#ffffff',at:performance.now()});}
 event(e){const d=e.data;if(e.type==='SHOT_SPAWN'){this.spawns.set(d.id,{...d,tick:e.serverTick});this.previews.delete(d.owner+':'+d.life+':'+d.actionKind+':'+d.actionSeq+':'+d.ordinal);}else if(e.type==='SHOT_END')this.terminals.set(d.id,{...d,tick:e.serverTick});else if(e.type==='FX')this.effects.push({...d,tick:e.serverTick});if(this.effects.length>300)this.effects.splice(0,this.effects.length-300);for(const map of [this.terminals,this.spawns])while(map.size>2048)map.delete(map.keys().next().value);}
 frame(now=performance.now()){
  const last=this.samples.at(-1);if(!last)return null;
  this.renderTick=Math.max(this.renderTick,last.state.serverTick+Math.min(150,now-last.at)*.06-4.5);
  let left=this.samples[0],right=last;for(let i=1;i<this.samples.length;i++)if(this.samples[i].state.serverTick>=this.renderTick){left=this.samples[i-1];right=this.samples[i];break;}
  const span=right.state.serverTick-left.state.serverTick,alpha=span?Math.max(0,Math.min(1,(this.renderTick-left.state.serverTick)/span)):1;
  const actors=right.state.actors.flatMap(a=>{const old=left.state.actors.find(p=>p.id===a.id&&p.lifeSeq===a.lifeSeq&&p.warpSeq===a.warpSeq),past=this.renderTick<right.state.serverTick,base=past?old:a;if(!base)return [];return [{...base,x:old?old.x+(a.x-old.x)*alpha:a.x,y:old?old.y+(a.y-old.y)*alpha:a.y,statusTick:this.renderTick}];});
  if(now-last.at>150)this.metrics.holds++;else this.metrics.interpolated++;
  if(this.predicted){const index=actors.findIndex(a=>a.id===this.predicted.id);this.offset.x*=.8;this.offset.y*=.8;const self={...this.predicted,x:this.predicted.x+this.offset.x,y:this.predicted.y+this.offset.y,statusTick:last.state.serverTick};if(index>=0)actors[index]=self;else actors.push(self);}
  const shots=right.state.shots.filter(s=>!this.terminals.has(s.id)||this.terminals.get(s.id).tick>this.renderTick).map(s=>sampleFlight(s,left.state.shots.find(p=>p.id===s.id),right.state.serverTick,this.renderTick,left.state.serverTick));
  const visibleIds=new Set(shots.map(s=>s.id));
  for(const [id,born]of this.spawns){const end=this.terminals.get(id);if(this.renderTick-born.tick>120||end&&this.renderTick-end.tick>30){this.spawns.delete(id);continue;}
   if(visibleIds.has(id)||born.tick>this.renderTick)continue;
   if(end){if(end.tick>this.renderTick){const t=Math.max(0,Math.min(1,(this.renderTick-born.tick)/Math.max(1,end.tick-born.tick)));shots.push({...born,x:born.x+(end.x-born.x)*t,y:born.y+(end.y-born.y)*t});}else if(this.renderTick-end.tick<12)shots.push({...born,kind:'transit',x:born.x,y:born.y,endX:end.x,endY:end.y,tx:end.x,ty:end.y,length:Math.hypot(end.x-born.x,end.y-born.y),start:born.tick,end:end.tick+12,native:false});}
  }
  for(const [id,p]of this.previews){if(now-p.at>180){this.previews.delete(id);continue;}shots.push(p);}
  this.effects=this.effects.filter(e=>this.renderTick-e.tick<30);return {...right.state,actors,shots,renderTick:this.renderTick,effects:this.effects.filter(e=>e.tick<=this.renderTick)};
 }
}
