import {createMovementKernel,predictMovement} from '../../../../packages/engine/src/movement/prediction.js';
export class Timeline{
 constructor(){this.kernel=createMovementKernel();this.reset();this.metrics={accepted:0,discarded:0,corrections:[],arrivalGaps:[],sourceGaps:[],holds:0,interpolated:0};}
 reset(){this.samples=[];this.history=[];this.predicted=null;this.lastSeq=0;this.renderTick=0;this.lifeKey='';this.effects=[];this.terminals=new Map();this.offset={x:0,y:0};}
 setStatic(data){this.static=data;this.walls=(data.walls||[]).map(w=>({...w,pos:{x:w.x,y:w.y},width:w.w,height:w.h}));}
 accept(s,now=performance.now()){
  if(s.snapshotSeq<=this.lastSeq){this.metrics.discarded++;return false;}this.lastSeq=s.snapshotSeq;this.metrics.accepted++;
  const prev=this.samples.at(-1);if(prev){this.metrics.arrivalGaps.push(now-prev.at);this.metrics.sourceGaps.push((s.serverTick-prev.state.serverTick)*1000/60);}
  this.samples.push({at:now,state:s});if(this.samples.length>40)this.samples.shift();
  for(const key of ['arrivalGaps','sourceGaps','corrections'])if(this.metrics[key].length>1200)this.metrics[key].splice(0,this.metrics[key].length-1200);
  if(s.self){const key=s.self.lifeSeq+':'+s.self.warpSeq;if(key!==this.lifeKey){this.history=[];this.offset={x:0,y:0};this.lifeKey=key;}
   const before=this.predicted;this.history=this.history.filter(i=>i.seq>s.self.lastAppliedSeq);
   let corrected={...s.self};for(const input of this.history.slice(-12))corrected=predictMovement(this.kernel,corrected,input,this.collisionWalls(s),this.static);
   if(before&&key===this.lifeKey){const distance=Math.hypot(before.x-corrected.x,before.y-corrected.y);this.metrics.corrections.push(distance);this.offset=distance<50?{x:before.x-corrected.x,y:before.y-corrected.y}:{x:0,y:0};}
   this.predicted=corrected;
  }return true;
 }
 collisionWalls(s=this.samples.at(-1)?.state){return (this.walls||[]).concat((s?.farm?.b||[]).filter(b=>b[3]>0).map(b=>({pos:{x:b[1],y:b[2]},width:2*b[5],height:2*b[5],angle:0})));}
 predict(input){if(!this.predicted)return;this.history.push(input);if(this.history.length>120)this.history.shift();this.predicted=predictMovement(this.kernel,this.predicted,input,this.collisionWalls(),this.static);}
 event(e){if(e.type==='SHOT_END')this.terminals.set(e.data.id,{...e.data,tick:e.serverTick});else if(e.type==='FX')this.effects.push({...e.data,tick:e.serverTick});if(this.effects.length>300)this.effects.splice(0,this.effects.length-300);if(this.terminals.size>2048)this.terminals.delete(this.terminals.keys().next().value);}
 frame(now=performance.now()){
  const last=this.samples.at(-1);if(!last)return null;
  this.renderTick=Math.max(this.renderTick,last.state.serverTick+Math.min(150,now-last.at)*.06-4.5);
  let left=this.samples[0],right=last;for(let i=1;i<this.samples.length;i++)if(this.samples[i].state.serverTick>=this.renderTick){left=this.samples[i-1];right=this.samples[i];break;}
  const span=right.state.serverTick-left.state.serverTick,alpha=span?Math.max(0,Math.min(1,(this.renderTick-left.state.serverTick)/span)):1;
  const actors=right.state.actors.map(a=>{const old=left.state.actors.find(p=>p.id===a.id&&p.lifeSeq===a.lifeSeq&&p.warpSeq===a.warpSeq);if(!old)return a;return {...a,x:old.x+(a.x-old.x)*alpha,y:old.y+(a.y-old.y)*alpha};});
  if(now-last.at>150)this.metrics.holds++;else this.metrics.interpolated++;
  if(this.predicted){const index=actors.findIndex(a=>a.id===this.predicted.id);this.offset.x*=.8;this.offset.y*=.8;const self={...this.predicted,x:this.predicted.x+this.offset.x,y:this.predicted.y+this.offset.y};if(index>=0)actors[index]=self;else actors.push(self);}
  const shots=right.state.shots.filter(s=>!this.terminals.has(s.id)||this.terminals.get(s.id).tick>this.renderTick).map(s=>{const old=left.state.shots.find(p=>p.id===s.id);return old?{...s,x:old.x+(s.x-old.x)*alpha,y:old.y+(s.y-old.y)*alpha}:s;});
  this.effects=this.effects.filter(e=>this.renderTick-e.tick<30);return {...right.state,actors,shots,renderTick:this.renderTick,effects:this.effects.filter(e=>e.tick<=this.renderTick)};
 }
}
