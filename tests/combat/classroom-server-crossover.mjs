import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
// node --expose-gc tests/combat/classroom-server-crossover.mjs <exported-main>
if(!global.gc)throw Error('Run this diagnostic with --expose-gc');
fs.mkdirSync('artifacts/v34',{recursive:true});
const root=process.cwd(),bases={A:path.resolve(process.argv[2]||'artifacts/v34/d28b2d8'),B:root};
const versions={};
for(const [key,base] of Object.entries(bases)){
 const load=p=>import(pathToFileURL(path.join(base,p)).href);
 versions[key]={...await load('packages/engine/src/index.js'),...await load('apps/server/src/ws/snapshot.js')};
}
const cards=['emoji-003','emoji-034','emoji-070','emoji-141'];
const actors=Array.from({length:20},(_,i)=>({id:'p'+i,name:'Synthetic'+i,abilityId:cards[i%4]}));
function run(key,ticks,mode='solo'){
 const api=versions[key],w=api.createWorld(undefined,{mode,mapIndex:0,matchId:'fixed-cross'},'fixed-cross',actors);
 const scope={roomInstanceId:'bench',matchId:'fixed-cross',connectionEpoch:1};
 const p95=a=>[...a].sort((x,y)=>x-y)[Math.floor(a.length*.95)];
 const tickTimes=[],snapshotTimes=[];
 let bytes=0,stepsCpu=0,snapCpu=0,attacks=0,skills=0;
 for(const [i,p]of w.game.participants.entries()){p.pos=new w.Vec2((i%5-2)*330,(Math.floor(i/5)-1.5)*330);p.humanControlled=true;p.spawnProtectionUntilFrame=0;p.cooldown=0;p.basicCooldown=0;}
 w.game.rebuildSpatialGrid();const start=performance.now(),cpu0=process.cpuUsage();
 for(let tick=1;tick<=ticks;tick++){
  const cpu=process.cpuUsage(),t=performance.now();
  for(let i=0;i<20;i++){
   const id=actors[i].id, angle=i*Math.PI/10+Math.floor(tick/30)*.3,aim={x:Math.cos(angle),y:Math.sin(angle)};
   if(tick%6===1)api.applyCommand(w,{type:'INPUT',playerId:id,lifeSeq:0,seq:tick,clientTick:tick,move:{x:tick%120<60?.18:-.18,y:0},aim});
   if(tick%60===12||tick===22)api.applyCommand(w,{type:'ACTION',playerId:id,lifeSeq:0,seq:tick,kind:tick===22?'skill':'attack',aim,aimPower:1});
  }
  api.stepWorld(w);tickTimes.push(performance.now()-t);const c=process.cpuUsage(cpu);stepsCpu+=c.user+c.system;
  if(tick%3===0){
   const scpu=process.cpuUsage(),ts=performance.now(),teacher=api.getTeacherState(w),encode=api.snapshotEncoder(teacher,tick/3,tick*1000/60);
   bytes+=encode(api.getHostVisibleState(teacher),scope).length;
   for(const a of actors){const view=api.getVisibleState(w,a.id,undefined,teacher);delete view.self.aimProfiles;delete view.self.visualProfiles;bytes+=encode(view,scope).length;}
   snapshotTimes.push(performance.now()-ts);const d=process.cpuUsage(scpu);snapCpu+=d.user+d.system;
  }
 }
 for(const p of w.game.participants){if(p.firedAttackSeq)attacks++;if(p.firedSkillSeq)skills++;}
 const total=process.cpuUsage(cpu0),end=performance.now(),used=process.memoryUsage();
 const report={version:key,ticks,stepCpuMs:stepsCpu/1000,snapshotCpuMs:snapCpu/1000,totalCpuMs:(total.user+total.system)/1000,elapsedMs:end-start,stepP95:p95(tickTimes),snapshotP95:p95(snapshotTimes),bytes,attackedPlayers:attacks,skillPlayers:skills,finalFrame:w.game.frame,rss:used.rss,heap:used.heapUsed};
 api.destroyWorld(w);return report;
}
for(const key of ['A','B'])run(key,90);
const rows=[];for(const key of ['A','B','B','A']){global.gc();const row=run(key,270);rows.push(row);console.log(JSON.stringify(row));}
fs.writeFileSync('artifacts/v34/crossover-20.json', JSON.stringify({node:process.version, A:'d28b2d8',B:'working v34',mode:'solo',warmupTicks:90,ticks:270,order:'ABBA',players:20,renderers:0,sockets:0,recipients:21,rows},null,2));
