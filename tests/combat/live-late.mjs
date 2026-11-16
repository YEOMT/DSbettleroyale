import fs from 'node:fs';
import assert from 'node:assert/strict';
import {auditHarness,delay} from '../fidelity-v33-2/harness.mjs';
import {applyCommand} from '../../packages/engine/src/index.js';
const label=process.argv[2]||'candidate',data=[];
if(process.env.LATE_PLAYERS==='20')await lateCohort20(label);
else {
for(const focus of [false,true]){
 const h=await auditHarness({players:6,renderer:'canvas',quality:'balanced',mode:'solo',browserArgs:['--disable-accelerated-2d-canvas']});
 try{
  h.room.matchId='late-feel-fixed';h.room.round++;h.room.revision++;h.app.manager.changed(h.room);
  for(const page of [h.host,h.student])await page.waitForFunction(()=>auditApp.ui.room.matchId==='late-feel-fixed');
  await h.command('START_QUIZ');await h.command('BEGIN_DRAFT');const ids=['emoji-024','emoji-003','emoji-023','emoji-029','emoji-013','emoji-025'];
  h.room.students().forEach((m,i)=>m.draft.abilityId=ids[i]);await h.command('START_BATTLE');
  await h.host.waitForFunction(async()=>!!(await import('/src/main.js')).renderer.cameraPose);
  const toggle=h.host.locator('#br-focus-toggle');
  if(label!=='base'){assert.ok(await toggle.isVisible());assert.match(await toggle.textContent(),/전체 관전/);}
  if(focus)await toggle.click();
  if(label!=='base'&&focus)assert.match(await toggle.textContent(),/전투 집중/);
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

}

// Optional focused cohort regression. The historical six-player test above is
// unchanged. Synthetic deaths select the late population, never disconnect it.
async function lateCohort20(label){
 const renderer=process.env.LATE_RENDERER||'canvas';assert.ok(['canvas','pixi'].includes(renderer));
 const started=performance.now(),out='artifacts/combat/late20-'+label+'-'+renderer+'.json';
 const report={label,renderer,participants:20,browserSurfaces:2,drawSurfaces:2,seed:'late-cohort-20',scope:'short 20-connected death-transition fixture; normal60Hz simulation and input; fixed authoritative deaths, not naturalelimination or longload',bundle:process.env.CLASSROOM_BUNDLE==='1',stages:[]};
 const h=await auditHarness({players:20,renderer,quality:'balanced',mode:'solo',viewport:{width:844,height:640},browserArgs:[...(renderer==='canvas'?['--disable-accelerated-2d-canvas']:[]),...(process.env.LATE_SOFTWARE_GPU==='1'?['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']:[])]});
 for(const c of h.clients)c.onMessage=m=>{if(['SNAPSHOT','PRIVATE_STATE'].includes(m.type))c.messages=c.messages.filter(x=>x.type!==m.type||x===m);};
 let timer;
 const stats=a=>{const v=a.filter(Number.isFinite).sort((a,b)=>a-b),q=p=>v[Math.min(v.length-1,Math.floor(v.length*p))]??null;return {n:v.length,p50:q(.5),p95:q(.95),p99:q(.99),max:v.at(-1)??null,over50:v.filter(n=>n>50).length,over100:v.filter(n=>n>100).length,over200:v.filter(n=>n>200).length};};
 try{
  h.room.matchId=report.seed;h.room.round++;h.room.revision++;h.app.manager.changed(h.room);
  await h.host.waitForFunction(seed=>auditApp.ui.room.matchId===seed,report.seed);
  await h.command('START_QUIZ');await h.command('BEGIN_DRAFT');
  const kits=['emoji-024','emoji-003','emoji-023','emoji-029','emoji-013','emoji-025'];
  h.room.students().forEach((m,i)=>m.draft.abilityId=kits[i%kits.length]);
  h.room.fixtureFrozen=true;await h.command('START_BATTLE');
  const w=h.room.world,actors=w.game.participants,students=h.room.students(),identity=students.map(m=>m.id);
  // Wide outward-facing circle: valid attacks retain their real damage and
  // cooldown, without artificial invulnerability/HP maintenance during phases.
  for(const [i,a]of actors.entries()){
   const angle=i*Math.PI*2/20;a.pos=new w.Vec2(Math.cos(angle)*1600,Math.sin(angle)*1600);a.vel=new w.Vec2(0,0);
  }
  w.game.rebuildSpatialGrid();h.publish();
  for(const page of [h.host,h.student]){
   await page.waitForFunction(()=>auditApp.renderer.enabled&&auditApp.renderer.cameraPose);
   await page.evaluate(()=>{
    const {renderer:r}=auditApp,draw=r.draw.bind(r),frame=r.frame.bind(r);let priorDraw=0,priorRaf=0,submitAt=0;
    window.late20={rows:[],raf:[],stage:20,at:performance.now()};
    const add=(list,item)=>{if(list.length>=512)list.splice(0,64);list.push(item);};
    r.frame=t=>{if(priorRaf)add(late20.raf,{stage:late20.stage,gap:t-priorRaf});priorRaf=t;return frame(t);};
    if(r.pixi){const render=r.app.render.bind(r.app);r.app.render=()=>{submitAt=performance.now();return render();};}
    r.draw=(v,t)=>{
     const at=performance.now();draw(v,t);const end=performance.now(),pose=r.cameraPose;
     add(late20.rows,{stage:late20.stage,n:v.actors.filter(a=>a.alive&&!a.clone).length,selfAlive:r.teacher?null:!!r.timeline.predicted?.alive,
      mode:pose.mode,lod:pose.lod??null,tick:r.timeline.samples.at(-1)?.state.serverTick??null,
      gap:priorDraw?at-priorDraw:null,cpu:end-at,prepare:r.pixi?submitAt-at:end-at,submit:r.pixi?end-submitAt:null,
      resources:{sprites:r.sprites.size,textures:r.textures.size,labels:r.labels.size}});priorDraw=at;
    };
   });
  }
  report.environment=await h.host.evaluate(()=>({browser:navigator.userAgent,visibility:document.visibilityState,dpr:devicePixelRatio,viewport:[innerWidth,innerHeight],gpu:(()=>{const gl=auditApp.renderer.app?.renderer.gl;if(!gl)return'Canvas';const e=gl.getExtension('WEBGL_debug_renderer_info');return e?gl.getParameter(e.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER);})()}));
  h.room.fixtureFrozen=false;let seq=100;
  timer=setInterval(()=>{seq++;for(const a of actors){if(!a.alive)continue;const n=Math.hypot(a.pos.x,a.pos.y)||1,aim={x:a.pos.x/n,y:a.pos.y/n};for(const kind of ['attack','skill'])applyCommand(w,{type:'ACTION',kind,seq,aim,playerId:a.remoteId,lifeSeq:a.lifeSeq});}},300);
  for(const count of [20,6,5,3]){
   for(const page of [h.host,h.student])await page.evaluate(n=>{late20.stage=n;late20.rows=[];late20.raf=[];late20.at=performance.now();},count);
   for(const a of actors.slice(0,20-count)){a.alive=false;a.hp=0;}
   const start=performance.now(),tickBefore=w.game.frame;
   await delay(1800);
   assert.equal(h.room.phase,'BATTLE');assert.equal(actors.filter(a=>a.alive).length,count,'fixture alive population');
   assert.deepEqual(h.room.students().map(m=>m.id),identity);assert.equal(h.room.students().filter(m=>m.connected).length,20,'dead students retain connections');
   const screens=[];
   for(const [i,page]of [h.host,h.student].entries()){
    const raw=await page.evaluate(()=>({rows:late20.rows,raf:late20.raf,windowStart:late20.at,windowEnd:performance.now(),phase:auditApp.ui.room.phase,ready:auditApp.net.ws.readyState}));
    const rows=raw.rows.filter(r=>r.stage===count);
    assert.ok(rows.length>0,'actual draw at population '+count);assert.equal(raw.ready,1);assert.equal(raw.phase,'BATTLE');
    assert.ok(rows.some(r=>r.tick>tickBefore),'new authoritative data reaches '+(i?'student':'host'));
    if(i===0)assert.ok(rows.some(r=>r.n===count),'host shows actual survivor count '+count);
    else assert.ok(rows.some(r=>r.selfAlive===(count===20)),'real student browser changes to dead spectator');
    screens.push({role:i?'student-dead-after20':'host',windowStart:raw.windowStart,windowEnd:raw.windowEnd,observations:rows.length,
     aliveValues:[...new Set(rows.map(r=>r.n))],selfAliveValues:[...new Set(rows.map(r=>r.selfAlive))],cameraModes:[...new Set(rows.map(r=>r.mode))],lod:[...new Set(rows.map(r=>r.lod))],
     firstAuthorityTick:rows[0]?.tick,lastAuthorityTick:rows.at(-1)?.tick,drawGap:stats(rows.map(r=>r.gap)),cpuDraw:stats(rows.map(r=>r.cpu)),prepare:stats(rows.map(r=>r.prepare)),submit:stats(rows.map(r=>r.submit)),raf:stats(raw.raf.map(r=>r.gap)),resources:rows.at(-1)?.resources});
   }
   const m=h.app.metrics.report(h.app.manager);
   report.stages.push({alive:count,dead:20-count,connectedStudents:20,hostConnected:h.room.host?.connected??null,elapsedMs:performance.now()-start,authorityStart:tickBefore,authorityEnd:w.game.frame,screens,server:{step:m.stepCpu,snapshot:m.snapshotCpu,snapshotGap:m.snapshotGap,overloads:m.overloads,memory:m.memory,sentBytes:m.sentBytes,cpuSharedServerAndFixtureProcess:process.cpuUsage()}});
   assert.equal(m.overloads,0,'no authority overload');
  }
  clearInterval(timer);timer=null;for(const a of actors.slice(0,19)){a.alive=false;a.hp=0;}
  await h.host.waitForFunction(()=>auditApp.ui.room.phase==='RESULTS',null,{timeout:8000});await h.student.waitForFunction(()=>auditApp.ui.room.phase==='RESULTS',null,{timeout:8000});
  assert.equal(h.room.students().filter(m=>m.connected).length,20);assert.deepEqual(h.errors,[]);
  report.end={phase:h.room.phase,alive:actors.filter(a=>a.alive).length,connectedStudents:20,actualStudentResults:true};report.status='PASS';
 }catch(error){report.status='FAIL';report.error=error.stack;report.failureState={phase:h.room.phase,connectedStudents:h.room.students().filter(m=>m.connected).length,alive:h.room.world?.game.participants.filter(a=>a.alive).length,metrics:h.app.metrics.report(h.app.manager)};throw error;}
 finally{clearInterval(timer);report.elapsedMs=performance.now()-started;fs.mkdirSync('artifacts/combat',{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2));await h.close();console.log('late20',label,renderer,report.status,report.elapsedMs);}
}
