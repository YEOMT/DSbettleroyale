// Fixed, authoritative 20-player scene isolates submission cost from server jitter.
// Frame timings have no GPU fence; screenshots/readback run after all timing blocks.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {auditHarness} from '../fidelity-v33-2/harness.mjs';
import {stepWorld,applyCommand} from '../../packages/engine/src/index.js';
const [label='candidate',mode='team-capture',role='host',scene='concentrated']=process.argv.slice(2);
assert.match(label,/^[\w-]+$/);assert.ok(['solo','team-capture'].includes(mode));
assert.ok(['host','student'].includes(role));assert.ok(['concentrated','normal'].includes(scene));
const out='artifacts/v35-2/render';fs.mkdirSync(out,{recursive:true});
const started=performance.now(),h=await auditHarness({players:20,mode,quality:'balanced',renderer:'pixi',viewport:{width:844,height:640}});
const report={label,mode,role,scene,scope:'frozen actual authority snapshot; one foreground rendering surface; 20 real WS participants plus host; same physical PC; not continuous gameplay',bundle:process.env.CLASSROOM_BUNDLE==='1',cases:[]};
try{
 h.room.matchId='render-fixture-35-2';h.room.round++;h.room.revision++;h.app.manager.changed(h.room);
 await h.host.waitForFunction(()=>auditApp.ui.room.matchId==='render-fixture-35-2');
 await h.command('START_QUIZ');await h.command('BEGIN_DRAFT');
 const kits=scene==='concentrated'?['emoji-152','emoji-153','emoji-028','emoji-014','emoji-024']:['emoji-003','emoji-034','emoji-070','emoji-141'];
 h.room.students().forEach((m,i)=>m.draft.abilityId=kits[i%kits.length]);h.room.fixtureFrozen=true;
 await h.command('START_BATTLE');const w=h.room.world,g=w.game;
 for(const [i,a]of g.participants.entries()){
  a.pos=new w.Vec2((i%5-2)*(scene==='concentrated'?140:640),(Math.floor(i/5)-1.5)*(scene==='concentrated'?140:650));
  a.vel=new w.Vec2(0,0);a.spawnProtectionUntilFrame=0;
 }
 g.rebuildSpatialGrid();
 if(scene==='concentrated'){
  for(const a of g.participants)assert.equal(applyCommand(w,{type:'ACTION',kind:'skill',seq:1,playerId:a.remoteId,lifeSeq:a.lifeSeq,aim:{x:1,y:0},aimPower:1}).accepted,true,a.ability.id);
  for(let i=0;i<6;i++)stepWorld(w);
  assert.ok(g.participants.every(a=>a.abilityUses>0),'all twenty casts applied');
 }
 h.publish();
 const page=role==='host'?h.host:h.student,other=role==='host'?h.student:h.host;
 await other.evaluate(()=>{auditApp.renderer.enabled=false;});
 await page.waitForFunction(({scene})=>auditApp.renderer.pixi&&auditApp.renderer.enabled&&auditApp.timeline.samples.at(-1)?.state.actors.length>0&&(scene!=='concentrated'||auditApp.timeline.samples.at(-1)?.state.shots.some(s=>s.kind==='spotlight')),{scene});
 await page.bringToFront();
 report.measurement=await page.evaluate(async role=>{
  const {renderer:r,timeline}=auditApp;r.enabled=false;
  const draw=r.draw.bind(r),view=timeline.frame(),gl=r.app.renderer.gl,frame=()=>new Promise(requestAnimationFrame),fixedAt=performance.now();
  const stats=values=>{const s=values.slice().sort((a,b)=>a-b),q=p=>s[Math.min(s.length-1,Math.floor(s.length*p))]||0;return {sampleCount:s.length,p50:q(.5),p95:q(.95),p99:q(.99),over50:s.filter(n=>n>50).length,over100:s.filter(n=>n>100).length,over200:s.filter(n=>n>200).length};};
  const resources=()=>({sprites:r.sprites.size,labels:r.labels.size,textures:r.textures.size,graphics:r.world.children.filter(c=>!!c.context).length,children:r.world.children.length,texturePixels:[...r.textures.values()].reduce((sum,t)=>sum+t.width*t.height,0),pose:r.poses.active.size+r.poses.fired.size+r.poses.contacts.size});
  for(let i=0;i<12;i++){await frame();draw(view,fixedAt);}
  const start=resources(),blocks=[],render=r.app.render.bind(r.app);let submitted;
  r.app.render=()=>{submitted=performance.now();return render();};
  try{for(let b=0;b<3;b++){
   const raf=[],drawGap=[],prepare=[],submit=[],total=[],time=[],windowStart=performance.now();let previousFrame=await frame(),previousDraw;
   for(let i=0;i<36;i++){
    const tick=await frame(),at=performance.now();draw(view,fixedAt);const end=performance.now();
    raf.push(tick-previousFrame);previousFrame=tick;if(previousDraw!==undefined)drawGap.push(at-previousDraw);previousDraw=at;
    prepare.push(submitted-at);submit.push(end-submitted);total.push(end-at);time.push(at);
   }
   blocks.push({scope:'one independent 36-paint window; CPU submit is not GPU completion',windowStart,windowEnd:performance.now(),raf:stats(raf),drawGap:stats(drawGap),prepare:stats(prepare),submit:stats(submit),total:stats(total),resources:resources()});
  }}finally{r.app.render=render;}
  const calls={},saved={};for(const key of ['drawElements','drawArrays','bufferSubData','texImage2D','texSubImage2D']){
   saved[key]=gl[key];calls[key]={count:0,bytes:0};gl[key]=function(...args){calls[key].count++;if(key==='bufferSubData')calls[key].bytes+=args[2]?.byteLength||0;return saved[key].apply(this,args);};
  }
  try{draw(view,fixedAt);}finally{for(const key in saved)gl[key]=saved[key];}
  const layers={};for(const name of ['base','grid','smoke','danger','crateLayer','g','fg','screen']){
   const c=r[name]?.context,geometry=c?._gpuData?.[r.app.renderer.uid];if(geometry)layers[name]={indices:geometry.geometryData.indices.length,instructions:c.instructions.length};
  }
  // Pixel parity checks restore full-world circle construction only, leaving
  // positions, camera, time, all text and all world state unchanged.
  const pixels=()=>{const a=new Uint8Array(gl.drawingBufferWidth*gl.drawingBufferHeight*4);gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,a);return a;};
  const screen=pixels(),restore=[];
  for(const layer of [r.g,r.fg]){
   const circle=layer.circle,stroke=layer.stroke;let scaled=false;
   layer.circle=function(x,y,rad){const m=this.context.getTransform();scaled=m.a>1&&!m.b&&!m.c&&m.a===m.d;if(!scaled)return circle.call(this,x,y,rad);this.save().resetTransform();circle.call(this,x*m.a+m.tx,y*m.a+m.ty,rad*m.a);return this.restore();};
   layer.stroke=function(style){return stroke.call(this,scaled&&style?.join==='miter'?{...style,join:'round'}:style);};
   restore.push(()=>{layer.circle=circle;layer.stroke=stroke;});
  }
  let reference;try{draw(view,fixedAt);reference=pixels();}finally{for(const reset of restore)reset();draw(view,fixedAt);}
  let delta=0,pixelsOver16=0;for(let i=0;i<screen.length;i+=4){let mx=0;for(let c=0;c<3;c++){const d=Math.abs(screen[i+c]-reference[i+c]);delta+=d;mx=Math.max(mx,d);}if(mx>16)pixelsOver16++;}
  const extensions=gl.getExtension('WEBGL_debug_renderer_info'),gpu=extensions?gl.getParameter(extensions.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER);
  return {role,browser:navigator.userAgent,gpu,dpr:r.app.renderer.resolution,quality:r.session.roomMeta.graphicsPreset,viewport:[innerWidth,innerHeight],visibility:document.visibilityState,actors:view.actors.length,shots:view.shots.length,shotKinds:view.shots.reduce((a,s)=>(a[s.kind]=(a[s.kind]||0)+1,a),{}),zones:view.zones.length,counts:calls,layers,start,end:resources(),blocks,parity:{scope:'full-world circle reference including unchanged v35.1 host body tessellation; readback outside timing',meanChannelDiff:delta/(screen.length*.75),pixelsOver16,totalPixels:screen.length/4},fallback:r.lastRenderError||null};
 },role);
 assert.equal(report.measurement.fallback,null);assert.deepEqual(report.measurement.start,report.measurement.end,'fixed scene resources stable');
 const parity=report.measurement.parity;assert.ok(parity.meanChannelDiff<.35&&parity.pixelsOver16<parity.totalPixels*.006,JSON.stringify(parity));
 // Screenshots are outside timing; hide synthetic join codes before artifact storage.
 await page.addStyleTag({content:'#br-live-room,#br-student-room-pill,#br-room-code{visibility:hidden!important}'});
 await page.screenshot({path:out+'/'+label+'-'+mode+'-'+role+'-'+scene+'.png'});
 await h.command('END');await h.command('REMATCH');
 await page.waitForFunction(()=>auditApp.ui.room.phase==='LOBBY'&&auditApp.renderer.sprites.size===0&&auditApp.renderer.labels.size===0&&auditApp.renderer.textures.size===0);
 report.clean=await page.evaluate(()=>({sprites:auditApp.renderer.sprites.size,labels:auditApp.renderer.labels.size,textures:auditApp.renderer.textures.size,poses:auditApp.renderer.poses.active.size+auditApp.renderer.poses.fired.size+auditApp.renderer.poses.contacts.size}));
 assert.deepEqual(h.errors,[]);report.status='PASS';
}catch(error){report.status='FAIL';report.error=error.stack;throw error;}
finally{report.elapsedMs=performance.now()-started;fs.writeFileSync(out+'/'+label+'-'+mode+'-'+role+'-'+scene+'.json',JSON.stringify(report,null,2)+'\n');await h.close();console.log(label,mode,role,scene,report.status,report.elapsedMs);}
