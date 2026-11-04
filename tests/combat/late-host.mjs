import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {snapshotEncoder} from '../../apps/server/src/ws/snapshot.js';
import {auditHarness} from '../fidelity-v33-2/harness.mjs';
const label=process.argv[2]||'after',dir=fileURLToPath(new URL('../../artifacts/combat',import.meta.url)),fixture=fileURLToPath(new URL('./fixtures/late-host.json',import.meta.url));
fs.mkdirSync(dir,{recursive:true});
const h=await auditHarness({players:6,renderer:'canvas',mode:'solo',browserArgs:['--disable-accelerated-2d-canvas']});
try{
 await h.battle();
 const initial=fs.existsSync(fixture)?JSON.parse(fs.readFileSync(fixture)):await h.host.evaluate(async()=>{
  const {timeline}=await import('/src/main.js');return {view:timeline.frame(),map:timeline.static};
 });
 if(!fs.existsSync(fixture))fs.writeFileSync(fixture,JSON.stringify(initial));
 // Send the same recorded public scene on a real WS, at the normal snapshot cadence.
 // No active classroom or measurement of simulation capacity is involved.
 // Fixed accumulated public FX records, shared by both runs, including the network feed.
 const fx=initial.view.hostEffects,at=i=>({x:(i*73%800)-400,y:(i*53%480)-240});
 fx.particles=Array.from({length:160},(_,i)=>({pos:at(i),size:3+i%7,color:'#fde68a',life:12+i%20,maxLife:32}));
 fx.rings=Array.from({length:12},(_,i)=>({pos:at(i),radius:30+i*2,color:'#38bdf8',lineWidth:3,life:12,maxLife:24}));
 fx.texts=Array.from({length:16},(_,i)=>({pos:at(i),text:'-'+(10+i),size:20,color:'#ffffff',life:12,maxLife:24}));
 initial.view.shots=Array.from({length:36},(_,i)=>({native:true,kind:'projectile',id:'fixture'+i,owner:initial.view.actors[i%6].id,x:i*12-200,y:i%9*25,radius:10,dx:5,dy:1,color:'#abcdef',style:'standard',actionKind:'attack'}));
 const replay=structuredClone(initial.view),peer=h.room.host.peer;
 const timer=setInterval(()=>{replay.serverTick+=3;const encode=snapshotEncoder(replay,++h.room.snapshotSeq,performance.now());peer.snapshot(encode(replay,peer.scope()));},50);
 let rows;try{rows=await h.host.evaluate(async({view,map})=>{
  const {renderer:r,timeline,net}=await import('/src/main.js');r.enabled=false;
  const receive=net.receive.bind(net),messages=[];net.receive=m=>{const start=performance.now();receive(m);messages.push(performance.now()-start);if(messages.length>128)messages.shift();};timeline.setStatic(map);
  view.presentation.finalPhase=true;view.actors.forEach((a,i)=>{a.x=(i-2)*110;a.y=(i%2)*130;a.visual.id=i+1;a.flags|=64;});
  view.shots=Array.from({length:36},(_,i)=>({native:true,kind:'projectile',id:'fixture'+i,owner:view.actors[i%6].id,x:i*12-200,y:i%9*25,radius:10,dx:5,dy:1,color:'#abcdef',style:'standard',actionKind:'attack'}));
  let gradients=0,nameDraws=0;const fill=r.ctx.fillText.bind(r.ctx);r.ctx.fillText=(...args)=>{nameDraws++;return fill(...args);};const gradient=r.ctx.createRadialGradient.bind(r.ctx);
  r.ctx.createRadialGradient=(...args)=>{gradients++;return gradient(...args);};
  const next=()=>new Promise(resolve=>requestAnimationFrame(resolve)),out=[];
  for(let pass=0;pass<2;pass++)for(const n of [6,5,4,3,2,1]){
   view.actors.forEach((a,i)=>a.alive=i<n);const gaps=[],draw=[],camera=[],timelineCost=[],baseline=gradients,textStart=nameDraws;let last=await next();
   for(let i=0;i<35;i++){const now=await next();gaps.push(now-last);last=now;const tt=performance.now();timeline.frame(now);timelineCost.push(performance.now()-tt);view.renderTick++;const t=performance.now();r.draw(view,now);draw.push(performance.now()-t);camera.push(r.cameraPose.zoom);}
   out.push({pass,n,gaps,draw,camera,gradients:gradients-baseline,textDraws:nameDraws-textStart,timelineCost,messages:[...messages],objects:{actors:view.actors.length,shots:view.shots.length,particles:view.hostEffects.particles.length,texts:view.hostEffects.texts.length,sprites:r.sprites.size,textures:r.textures.size},snapshotGaps:timeline.metrics.arrivalGaps.slice(-35)});
  }return out;
 },initial);}finally{clearInterval(timer);}
 fs.writeFileSync(dir+'/host-'+label+'.json',JSON.stringify(rows));
 console.log('Measured',label,rows.length,'segments; same replay fixture, actual Canvas draws and RAF.');
}finally{await h.close();}
