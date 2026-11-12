import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';

// Fixed simulation inputs; no browser, socket or wall-clock scheduler contention.
const [a,b,c,out='artifacts/v35-1/server-crossover.json',mode='team-capture']=process.argv.slice(2);
if(!c||!global.gc)throw Error('node --expose-gc tests/combat/smooth-server.mjs <v34> <v35> <candidate> [output] [mode]');
const order=['v34','v35','v35.1','v35.1','v35','v34','v35','v34','v35.1'];
const inputs={v34:a,v35:b,'v35.1':c},players=30;
const ids=['emoji-003','emoji-034','emoji-070','emoji-141','emoji-028','emoji-023'];
const roster=Array.from({length:players},(_,i)=>({id:'s'+i,name:'Synthetic '+i,abilityId:ids[i%ids.length],team:mode==='solo'?0:i%4+1}));
const api={};for(const [k,dir] of Object.entries(inputs)){
 const load=p=>import(pathToFileURL(path.join(path.resolve(dir),p)).href);
 api[k]=Object.assign({},await load('packages/engine/src/index.js'),await load('apps/server/src/ws/snapshot.js'),await load('apps/server/src/ws/presentation-state.js'),await load('apps/server/src/ws/profile-state.js'));
}
function summary(values){
 values.sort((a,b)=>a-b);
 const q=p=>+(values[Math.min(values.length-1,Math.floor(values.length*p))]||0).toFixed(4);
 return {n:values.length,p50:q(.5),p95:q(.95),p99:q(.99),sum:+values.reduce((a,b)=>a+b,0).toFixed(3)};
}
function run(version,ticks){
 const m=api[version],w=m.createWorld(undefined,{mode,mapIndex:0,teamCount:4,matchId:'smooth'},'smooth',roster);
 const scope={roomInstanceId:'bench',matchId:'smooth',connectionEpoch:1},peers=roster.map(()=>({scope:()=>scope,send(){}}));
 const samples={step:[],teacher:[],prepare:[],interestAndPrivate:[],encode:[],payload:[]};
 let bytes=0;
 for(const [i,p] of w.game.participants.entries()){
  p.pos=new w.Vec2((i%6-2)*240,(Math.floor(i/6)-2)*240);p.humanControlled=true;p.spawnProtectionUntilFrame=0;p.cooldown=p.basicCooldown=0;
  w.brProgression.awardXP(p,20,0);
  while(p.run.offer)m.applyCommand(w,{type:'AUGMENT_CHOOSE',playerId:p.remoteId,lifeSeq:p.lifeSeq,offerId:p.run.offer.id,augmentId:p.run.offer.cards[0].id});
 }
 w.game.rebuildSpatialGrid();global.gc();let rssPeak=process.memoryUsage.rss();
 const cpu=process.cpuUsage(),wall=performance.now();
 for(let tick=1;tick<=ticks;tick++){
  let at=performance.now();
  for(let i=0;i<players;i++){const p=roster[i],a=i*Math.PI/15+Math.floor(tick/30)*.3,aim={x:Math.cos(a),y:Math.sin(a)},lifeSeq=w.byId.get(p.id).lifeSeq;
   if(tick%6===1)m.applyCommand(w,{type:'INPUT',playerId:p.id,lifeSeq,seq:tick,clientTick:tick,move:{x:tick%120<60?.18:-.18,y:0},aim});
   if(tick%60===12||tick===22)m.applyCommand(w,{type:'ACTION',playerId:p.id,lifeSeq,seq:tick,kind:tick===22?'skill':'attack',aim,aimPower:1});
  }
  m.stepWorld(w);samples.step.push(performance.now()-at);if(tick%3)continue;
  at=performance.now();const teacher=m.presentationState(w,m.getTeacherState(w));samples.teacher.push(performance.now()-at);
  at=performance.now();const encode=m.snapshotEncoder(teacher,tick/3,tick*1000/60);samples.prepare.push(performance.now()-at);
  let filter=0,encoding=0;
  for(let i=-1;i<players;i++){
   at=performance.now();let view;
   if(i===-1)view=m.getHostVisibleState(teacher);else{view=m.getVisibleState(w,roster[i].id,undefined,teacher);view.self=m.privateProfileState(peers[i],view.self);}
   filter+=performance.now()-at;at=performance.now();
   const encoded=encode(view,scope);encoding+=performance.now()-at;bytes+=encoded.length;samples.payload.push(encoded.length);
  }
  samples.interestAndPrivate.push(filter);samples.encode.push(encoding);if(tick%60===0)rssPeak=Math.max(rssPeak,process.memoryUsage.rss());
 }
 const elapsed=performance.now()-wall,usage=process.cpuUsage(cpu),actions=w.game.participants.filter(p=>p.firedSkillSeq&&p.firedAttackSeq).length;
 assert.equal(actions,players);m.destroyWorld(w);
 return {version,ticks,actions,bytes,rssPeak,cpuMs:(usage.user+usage.system)/1000,elapsedMs:+elapsed.toFixed(3),...Object.fromEntries(Object.entries(samples).map(([k,v])=>[k,summary(v)]))};
}
const rows=[],warmAt=performance.now();let warmupPasses=0;
// Cycle through all three engines through JIT warm-up and short CPU boost.
do{for(const version of Object.keys(api))run(version,90);warmupPasses++;}while(performance.now()-warmAt<5500);
for(const version of order){const row=run(version,360);rows.push(row);console.log(version,row.cpuMs,row.encode.sum,row.interestAndPrivate.sum,row.bytes);}
assert.deepEqual(rows.filter(r=>r.version==='v35').map(r=>r.bytes),rows.filter(r=>r.version==='v35.1').map(r=>r.bytes));
fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify({node:process.version,platform:process.platform,cpus:os.availableParallelism(),mode,players,order,warmupPasses,notes:'CPU includes input, stepping and interest/encode for one host and 30 students at 20Hz. RSS is a shared-process high watermark. No transport or browser.',rows},null,2)+'\n');
