import fs from 'node:fs';
import assert from 'node:assert/strict';
import {auditHarness,delay} from '../fidelity-v33-2/harness.mjs';
import {applyCommand} from '../../packages/engine/src/index.js';
const label=process.argv[2]||'candidate',data=[];
for(const focus of [false,true]){
 const h=await auditHarness({players:6,renderer:'canvas',quality:'balanced',mode:'solo',browserArgs:['--disable-accelerated-2d-canvas']});
 try{
  h.room.matchId='late-feel-fixed';h.app.manager.changed(h.room);await delay(60);
  await h.command('START_QUIZ');await h.command('BEGIN_DRAFT');const ids=['emoji-024','emoji-003','emoji-023','emoji-029','emoji-013','emoji-025'];
  h.room.students().forEach((m,i)=>m.draft.abilityId=ids[i]);await h.command('START_BATTLE');
  await h.host.waitForFunction(async()=>!!(await import('/src/main.js')).renderer.cameraPose);
  if(focus)await h.host.locator('#br-focus-toggle').click();
  const w=h.room.world,actors=w.game.participants;w.brFarm.dispose(w.game);w.game.walls=[];w.game.smokes=[];w.game.zones=[];h.staticState();
  for(const [i,p] of actors.entries())p.pos=new w.Vec2((i-2)*270,(i%2)*85);
  await h.host.evaluate(async()=>{
   const {renderer:r}=await import('/src/main.js'),draw=r.draw.bind(r);let previous=0;
   window.trace=[];r.draw=(v,now)=>{const start=performance.now();draw(v,now);const p=r.cameraPose;
    const ids=r.camera.pair&&[r.camera.pair.first,r.camera.pair.second],subjects=v.actors.filter(a=>a.alive&&!a.clone&&(!ids||ids.includes(a.id)));
    const outside=subjects.some(a=>Math.abs((a.x-p.x)*p.zoom)>innerWidth/2||p.screenY+(a.y-p.y)*p.zoom<0||p.screenY+(a.y-p.y)*p.zoom>innerHeight);
    trace.push({outside,n:v.actors.filter(a=>a.alive&&!a.clone).length,mode:p.mode,pair:r.camera.pair?.key||null,zoom:p.zoom,x:p.x,y:p.y,gap:previous?now-previous:null,cpu:performance.now()-start,objects:[r.sprites.size,r.textures.size]});previous=now;};
  });
  let seq=100;const fire=()=>{seq++;for(const [i,p] of actors.entries()){if(!p.alive)continue;const other=actors[(i+1)%actors.length];
   const dx=other.pos.x-p.pos.x,dy=other.pos.y-p.pos.y,n=Math.hypot(dx,dy)||1;
   for(const kind of ['attack','skill'])applyCommand(w,{type:'ACTION',kind,seq,aim:{x:dx/n,y:dy/n},playerId:p.remoteId,lifeSeq:p.lifeSeq});
  }};
  const timer=setInterval(fire,300);try{for(let n=6;n>=1;n--){
   for(const p of actors.slice(n)){p.alive=false;p.hp=0;}
   await delay(n===6?1400:700);
   assert.equal(h.room.phase,n===1?'RESULTS':'BATTLE');
  }}finally{clearInterval(timer);}
  const rows=await h.host.evaluate(()=>trace),m=h.app.metrics.report(h.app.manager);
  const late=rows.filter(r=>r.n<=5&&r.gap),stat=(key,q)=>late.map(r=>r[key]).sort((a,b)=>a-b)[Math.ceil(late.length*q)-1];
  for(const n of [6,5,4,3,2])assert.ok(rows.some(r=>r.n===n),'missing live '+n);
  assert.ok(late.length);assert.deepEqual(h.errors,[]);
  const foc=late.filter(r=>r.pair);const switches=foc.reduce((n,r,i)=>n+(i>0&&r.pair!==foc[i-1].pair?1:0),0);
  const spans=[];let segment=null;
  for(const row of late){if(row.pair&&row.pair===segment?.key)segment.ms+=row.gap;else if(row.pair){segment={key:row.pair,ms:row.gap};spans.push(segment);}else segment=null;}
  data.push({focus,retainedMs:spans.map(s=>Math.round(s.ms)),outsideMs:Math.round(late.reduce((n,r)=>n+(r.outside?r.gap:0),0)),frames:late.length,raf:[.5,.95,.99].map(q=>stat('gap',q)),over33:late.filter(r=>r.gap>33.3).length,over50:late.filter(r=>r.gap>50).length,drawP95:stat('cpu',.95),switches,focusFrames:foc.length,stepP95:m.stepCpu.p95,snapshotP95:m.snapshotGap.p95,overloads:m.overloads,bytes:m.sentBytes,bytesPerSecond:Math.round(m.sentBytes/(m.uptimeMs/1000)),ended:h.room.phase});
 }finally{await h.close();}
}
fs.mkdirSync('artifacts/combat',{recursive:true});fs.writeFileSync('artifacts/combat/late-live-'+label+'.json',JSON.stringify(data,null,2));console.log(data);
