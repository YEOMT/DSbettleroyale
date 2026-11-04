import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';import assert from 'node:assert/strict';
import {createWorld,stepWorld,getVisibleState,getStaticState,applyCommand,destroyWorld} from '../../packages/engine/src/index.js';
import {Timeline} from '../../apps/client/src/presentation/timeline.js';
const w=createWorld(undefined,{},'motion-comparison',[{id:'one',name:'One',abilityId:'emoji-000'},{id:'two',name:'Two',abilityId:'emoji-023'}]),[a,b]=w.game.participants,frames=[];
w.game.walls=[];w.game.smokes=[];w.brFarm.dispose(w.game);a.pos=new w.Vec2(200,300);b.pos=new w.Vec2(500,410);w.game.projectiles=[];b.basicCooldown=0;
const map=getStaticState(w);
try{for(let tick=1;tick<=240;tick++){
 const input=(p,x)=>({type:'INPUT',playerId:p.remoteId,lifeSeq:p.lifeSeq,move:{x,y:0},aim:{x:1,y:0},seq:tick,clientTick:tick});
 const local=input(a,tick<=45?1:0);applyCommand(w,local);applyCommand(w,input(b,tick<=90?1:0));
 if(tick===15)applyCommand(w,{type:'ACTION',kind:'attack',seq:1,playerId:b.remoteId,lifeSeq:b.lifeSeq,aim:{x:-1,y:0}});
 stepWorld(w);frames.push({tick,local,s:tick%3===0?{...getVisibleState(w,'one'),snapshotSeq:tick/3}:null});
}}finally{destroyWorld(w);}
function replay(Type){
 const t=new Type();t.setStatic(map);const rows=[],shots=new Map();let jumps=[],remote=[],idle=[];
 for(const {tick,local,s} of frames){const now=tick*1000/60;t.predict(local);if(s)t.accept(s,now);const v=t.frame(now);if(!v)continue;
  const self=v.actors.find(a=>a.id==='one'),other=v.actors.find(a=>a.id==='two');if(!self||!other)continue;
  if(tick>160)idle.push(self.x);if(tick>10&&tick<80)remote.push(other.x);
  for(const q of v.shots){const last=shots.get(q.id);if(last&&last.tick===tick-1)jumps.push(Math.hypot(q.x-last.x,q.y-last.y));shots.set(q.id,{tick,x:q.x,y:q.y});}
  rows.push({tick,x:self.x});
 }
 assert.ok(jumps.length>0);return {idleSpan:Math.max(...idle)-Math.min(...idle),maxRemoteStep:Math.max(...remote.slice(1).map((x,i)=>Math.abs(x-remote[i]))),maxShotStep:Math.max(...jumps),firstMovementTick:rows.find(r=>r.x>rows[0].x+.05)?.tick};
}
const after=replay(Timeline);assert.ok(after.idleSpan<.05);const result={after};
if(process.argv[2]){
 const original=await import(pathToFileURL(path.resolve(process.argv[2],'apps/client/src/presentation/timeline.js')).href);
 result.before=replay(original.Timeline);for(const k of Object.keys(after))assert.ok(after[k]<=result.before[k]+.01,k);
}
fs.mkdirSync('artifacts/combat',{recursive:true});fs.writeFileSync('artifacts/combat/motion.json',JSON.stringify(result,null,2));console.log(result);
