// Isolate the actual renderer from network jitter. Manual frames replay one
// received 20-player view, with unchanged quality, camera, sprites and HUD.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {auditHarness} from '../fidelity-v33-2/harness.mjs';

const [version='working',quality='low',mode='team-capture']=process.argv.slice(2);
assert.match(version,/^[\w-]+$/);
assert.ok(['solo','team-capture'].includes(mode)&&['low','balanced'].includes(quality));
const out='artifacts/v35-1',h=await auditHarness({players:20,mode,quality,renderer:'pixi',viewport:{width:844,height:640}});
fs.mkdirSync(out,{recursive:true});
try{
 h.room.matchId='render-fixture-35-1';h.room.round++;h.room.revision++;h.app.manager.changed(h.room);
 await h.host.waitForFunction(()=>auditApp.ui.room.matchId==='render-fixture-35-1');
 await h.command('START_QUIZ');await h.command('BEGIN_DRAFT');
 h.room.students().forEach((m,i)=>{m.draft.abilityId=['emoji-003','emoji-034','emoji-070','emoji-141'][i%4];});
 h.room.fixtureFrozen=true;await h.command('START_BATTLE');
 const world=h.room.world;
 for(const [i,a] of world.game.participants.entries()){
  a.pos=new world.Vec2((i%5-2)*640,(Math.floor(i/5)-1.5)*650);a.vel=new world.Vec2(0,0);
 }
 world.game.rebuildSpatialGrid();h.publish();
 await h.host.waitForFunction(()=>auditApp.renderer.enabled&&auditApp.renderer.pixi&&auditApp.timeline.samples.at(-1)?.state.actors.some(a=>a.x===-1280&&a.y===-975));
 await h.student.evaluate(()=>{auditApp.renderer.draw=()=>{};});
 const measurements=await h.host.evaluate(async quality=>{
  const {renderer:r,timeline}=auditApp;
  // Capture has a separately selectable host graphics profile.
  r.session.captureHostQuality=quality;r.session.captureAutoBalanced=false;r.resize();
  const draw=r.draw.bind(r),view=timeline.frame(),gl=r.app.renderer.gl;
  const iframe=()=>new Promise(requestAnimationFrame);
  const tracked=['drawElements','drawArrays','bufferData','bufferSubData','texImage2D','texSubImage2D'];
  const summary=values=>{
   const sorted=values.slice().sort((a,b)=>a-b),nth=n=>+sorted[Math.min(sorted.length-1,Math.ceil(n*sorted.length)-1)].toFixed(3);
   return {p50:nth(.5),p95:nth(.95),p99:nth(.99),over50:values.filter(n=>n>50).length,over100:values.filter(n=>n>100).length,over200:values.filter(n=>n>200).length};
  };
  r.draw=()=>{};
  // Keep the scene time fixed, but observe the real browser clock around
  // submission/fence. A fence is never added to the game frame loop.
  const now=performance.now();
  for(let i=0;i<6;i++){await iframe();draw(view,now);gl.finish();}
  const pool=()=>({sprites:r.sprites.size,labels:r.labels.size,textures:r.textures.size,children:r.world.children.length});
  const startPool=pool(),saved={},counts={visibility:0,emojiLookup:0,levelLookup:0},changed=()=>counts.visibility++,calls=[];
  const paths={};
  for(const key of ['base','grid','smoke','danger','crateLayer','g','fg','screen']){
   const layer=r[key],model=layer?.context,geometry=model?._gpuData?.[r.app.renderer.uid];
   if(!geometry)continue;
   paths[key]={indices:geometry.geometryData.indices.length,instructions:model.instructions.length,
    largest:geometry.batches.map((b,i)=>({indices:b.indexSize,shape:model.instructions[i]?.data?.path?.shapePath?.shapePrimitives?.[0]?.shape?.type,
     radius:model.instructions[i]?.data?.path?.shapePath?.shapePrimitives?.[0]?.shape?.radius})).sort((a,b)=>b.indices-a.indices).slice(0,3)};
  }
  for(const child of r.world.children)child.on('visibleChanged',changed);
  for(const key of tracked){counts[key]=0;saved[key]=gl[key];gl[key]=function(...args){
   counts[key]++;const at=performance.now(),result=saved[key].apply(this,args);
   calls.push({key,ms:performance.now()-at,vertices:key==='drawElements'?args[1]:undefined,
    bytes:key==='bufferSubData'?args[2]?.byteLength:undefined});return result;
  };}
  const emoji=r.paint.brGetEmojiSprite,level=r.paint.brLevelCanvas;
  r.paint.brGetEmojiSprite=(...args)=>{counts.emojiLookup++;return emoji(...args);};
  r.paint.brLevelCanvas=(...args)=>{counts.levelLookup++;return level(...args);};
  try{draw(view,now);gl.finish();}finally{
   for(const key of tracked)gl[key]=saved[key];
   for(const child of r.world.children)child.off('visibleChanged',changed);
   r.paint.brGetEmojiSprite=emoji;r.paint.brLevelCanvas=level;
  }
  // Compare screen-space construction, if present, against v35's full
  // world-space circle at the same center, radius, width and fixed frame.
  const pixels=()=>{const data=new Uint8Array(gl.drawingBufferWidth*gl.drawingBufferHeight*4);
   gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,data);return data;};
  const screen=pixels(),circle=r.g.circle,stroke=r.g.stroke,world=r.g;
  let transformed=0,reference,restoreJoin=false;
  world.circle=function(x,y,radius){
   const matrix=this.context.getTransform();
   restoreJoin=matrix.a>1&&!matrix.b&&!matrix.c&&matrix.a===matrix.d;
   if(!restoreJoin)return circle.call(this,x,y,radius);
   const {a,tx,ty}=matrix;transformed++;this.save().resetTransform();
   circle.call(this,x*a+tx,y*a+ty,radius*a);return this.restore();
  };
  world.stroke=function(style){return stroke.call(this,restoreJoin&&style?.join==='miter'?{...style,join:'round'}:style);};
  try{draw(view,now);reference=pixels();}finally{world.circle=circle;world.stroke=stroke;}
  let diff=0,visiblePixels=0;
  for(let i=0;i<screen.length;i+=4){let delta=0;for(let c=0;c<3;c++){const d=Math.abs(screen[i+c]-reference[i+c]);delta=Math.max(d,delta);diff+=d;}
   if(delta>16)visiblePixels++;}
  const parity={meanChannelDiff:diff/(screen.length*.75),visiblePixels,totalPixels:screen.length/4,transformed};
  const blocks=[],pools=[],render=r.app.render.bind(r.app);let submitted;
  r.app.render=()=>{submitted=performance.now();return render();};
  try{
   for(let b=0;b<3;b++){
    const gap=[],prepare=[],submit=[],finish=[],total=[];let previous=await iframe();
    for(let i=0;i<24;i++){
     const frame=await iframe(),start=performance.now();draw(view,now);
     const end=performance.now();gl.finish();const done=performance.now();
     gap.push(frame-previous);previous=frame;prepare.push(submitted-start);submit.push(end-submitted);finish.push(done-end);total.push(done-start);
    }
    pools.push(pool());blocks.push(Object.fromEntries(Object.entries({gap,prepare,submit,finish,total}).map(([k,v])=>[k,summary(v)])));
   }
  }finally{r.app.render=render;r.draw=draw;}
  return {framesPerBlock:24,actors:view.actors.length,shots:view.shots.length,points:view.capture?.z.length||0,
   profile:r.paint.brGraphicsProfile().label,viewport:[innerWidth,innerHeight],dpr:r.app.renderer.resolution,browser:navigator.userAgent,
   counts,calls,paths,parity,startPool,pools,endPool:pool(),blocks,fallback:r.lastRenderError||null};
 },quality);
 assert.equal(measurements.actors,20);assert.equal(measurements.fallback,null);assert.deepEqual(measurements.pools[0],measurements.endPool);
 assert.ok(measurements.parity.meanChannelDiff<.2&&measurements.parity.visiblePixels<measurements.parity.totalPixels*.002,JSON.stringify(measurements.parity));
 await h.host.screenshot({path:out+'/render-'+version+'-'+mode+'-'+quality+'.png'});
 await h.command('END');await h.command('REMATCH');
 await h.host.waitForFunction(()=>auditApp.ui.room.phase==='LOBBY'&&auditApp.renderer.sprites.size===0&&auditApp.renderer.labels.size===0&&auditApp.renderer.textures.size===0);
 const row={version,quality,mode,rematch:true,...measurements};
 fs.writeFileSync(out+'/render-'+version+'-'+mode+'-'+quality+'.json',JSON.stringify(row,null,2)+'\n');
 console.log(version,quality,mode,JSON.stringify(measurements.counts),measurements.blocks.map(b=>[b.gap.p95,b.prepare.p50,b.submit.p50,b.total.p50]));
}finally{await h.close();}
