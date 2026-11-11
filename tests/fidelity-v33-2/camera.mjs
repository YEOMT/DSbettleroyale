import assert from 'node:assert/strict';
import fs from 'node:fs';
import {auditHarness,delay} from './harness.mjs';
import {openBaseline} from '../../tools/baseline/browser.mjs';
import {selectCases} from './selection.mjs';
const renderers=selectCases(['canvas','pixi'],process.argv[2],'RENDERER'),widths=selectCases(['1920','1366','1024'],process.argv[3],'VIEWPORT');
if(process.argv.length>4)throw Error('UNEXPECTED_ARGUMENT');
const viewports=widths.map(width=>({width:Number(width),height:width==='1920'?1080:768}));
fs.mkdirSync('artifacts/fidelity-v33-2',{recursive:true});const report=[];
for(const renderer of renderers){
 const h=await auditHarness({renderer}),ref=await openBaseline();
 try{
  await h.battle();const w=h.room.world;w.game.projectiles=[];w.BRRework.clearWorld(w.game);w.brFarm.dispose(w.game);w.game.smokes=[];w.game.walls=[];
  if(renderer==='pixi')await ref.page.addScriptTag({path:'node_modules/pixi.js/dist/pixi.min.js'});
  await ref.page.evaluate(async renderer=>{
   const m=__baseline.BRMP;Object.assign(m,{active:true,role:'host',backend:'firebase',roomMeta:{mode:'solo',phase:'battle',mapIndex:0,graphicsPreset:'balanced'},focusPlayer:false});
   // Compare the same CSS viewport, independent of the legacy Canvas raster LOD.
   // Its resize listener otherwise asynchronously applies .52/.76/.92 backing sizes.
   removeEventListener('resize',resizeGameCanvas);
   document.getElementById('br-app').style.display='none';document.getElementById('game-screen').classList.remove('hidden');document.getElementById('game-screen').style.cssText='position:fixed;inset:0';
   const list=Array.from({length:20},(_,i)=>new Participant(i+1,'Audit '+i,EMOJI_DB[0],new Vec2(0,0),0));for(const p of list){p.humanControlled=true;p.alive=true;}
   game=new GameWorld(list);game.walls=[];game.smokes=[];game.zones=[];game.projectiles=[];brFarm.dispose(game);game.finalPhase=false;game.lookAt=new Vec2(0,0);game.zoom=.5;canvas.width=innerWidth;canvas.height=innerHeight;game.refreshAliveCache();
   if(renderer==='pixi')brPixiHostStart();
  },renderer);
  if(renderer==='pixi'){await ref.page.waitForFunction(()=>!!brPixiHost);const missing=await ref.page.evaluate(()=>{const missing=[];for(let i=0;i<20;i++){try{brPixiHostFrame(game,'normal');return missing;}catch(e){const name=/^(\w+) is not defined$/.exec(e.message)?.[1];if(!name||!__baseline[name])throw e;missing.push(name);globalThis[name]=__baseline[name];}}throw Error('Too many missing legacy bindings');});report.push({legacyPixiMissingGlobalBindings:missing,note:'Reference has these unresolved IIFE helpers; exposed solely to exercise the original Pixi camera. Production original falls back to Canvas.'});}
  for(const viewport of viewports){
   await h.host.setViewportSize(viewport);await ref.page.setViewportSize(viewport);
   for(const scenario of ['auto','normal','broadcast','focus','capture']){
    const capture=scenario==='capture';if(capture){const sample=(await import('../../packages/engine/src/index.js')).createWorld(undefined,{mode:'team-capture',teamCount:2},'camera-map',w.game.participants.map(p=>({id:p.remoteId,name:p.name,abilityId:p.ability.id,team:1})));w.game.capture=sample.game.capture;w.game.boundary=sample.game.boundary;}else{w.game.capture=null;w.game.boundary=null;}
    h.staticState();
    await h.host.evaluate(async scenario=>{const {renderer:r}=await import('/src/main.js');r.enabled=false;r.camera.reset();r.focus=scenario==='focus'||scenario==='broadcast';},scenario);
    await ref.page.evaluate(({scenario,viewport})=>{game.lookAt=new Vec2(0,0);game.zoom=.5;canvas.width=viewport.width;canvas.height=viewport.height;game.capture=null;game.boundary=null;__baseline.BRMP.focusPlayer=scenario==='focus';game.getHostBroadcastMode=()=>scenario==='focus'?'normal':['normal','broadcast'].includes(scenario)?scenario:game.aliveRealPlayers.length<=5?'broadcast':game.aliveRealPlayers.length<=12?'normal':'performance';}, {scenario,viewport});
    const trace=[];
    for(const count of [20,10,4,2,1]){
     for(const [i,p]of w.game.participants.entries()){p.alive=i<count;p.pos.x=(i%5-2)*count*28+130;p.pos.y=(Math.floor(i/5)-1.5)*count*24-75;p.vel.x=p.vel.y=0;}w.game.frame+=3;h.publish();await delay(85);
     const received=await h.host.evaluate(async()=>{const a=await import('/src/main.js');return {view:a.timeline.samples.at(-1).state,map:a.timeline.static};});
     const current=await h.host.evaluate(async({view,map})=>{const {renderer:r}=await import('/src/main.js');const rows=[],start=r.drawAt??performance.now(),live=view.actors.filter(a=>a.alive);
      if(r.focus&&live.length>=2)r.camera.observe({type:'FX',serverTick:view.serverTick,data:{kind:'hit',sourceId:live[0].id,targetId:live[1].id}});
      for(let n=0;n<60;n++){r.draw({...view,renderTick:view.serverTick+n,effects:[]},start+(n+1)*1000/60);const p=r.cameraPose;rows.push({...p,pair:r.camera.pair?[r.camera.pair.first,r.camera.pair.second]:null});}return rows;},received);
     const original=await ref.page.evaluate(({view,map,renderer})=>{
      for(const [i,p]of game.participants.entries()){const a=view.actors[i];p.alive=a.alive;p.pos=new Vec2(a.x,a.y);p.vel=new Vec2(0,0);p.name=a.name;p.ability=EMOJI_DB.find(e=>e.id===a.abilityId);p.cacheCanvas=new Participant(p.id,p.name,p.ability,p.pos,p.team).cacheCanvas;p.radius=a.radius;p.team=a.team;p.hp=a.hp;p.maxHp=a.maxHp;}game.worldRadius=map.worldRadius;game.capture=view.capture?{map:map.captureMap,active:view.capture.a,points:map.captureMap.points.map((p,i)=>({...p,enabled:!!(view.capture.am&(1<<i)),state:view.capture.z[i][0],team:view.capture.z[i][1],counts:[0,...view.capture.z[i][2]]}))}:null;game.boundary=map.boundary;game.refreshAliveCache();const mode=game.capture?'capture':game.getHostBroadcastMode(),out=[];
      for(let n=0;n<60;n++){let pose;if(renderer==='pixi'){brPixiHostFrame(game,mode);pose={x:game.lookAt.x,y:game.lookAt.y,zoom:brPixiHost.world.scale.x,screenX:brPixiHost.world.x+game.lookAt.x*game.zoom,screenY:brPixiHost.world.y+game.lookAt.y*game.zoom};}
       else if(mode==='performance'){let first;const arc=ctx.arc;ctx.arc=function(x,y,r,...rest){first??={x,y,r};return arc.call(this,x,y,r,...rest);};try{game.drawHostLite();}finally{ctx.arc=arc;}pose={x:0,y:0,zoom:first.r/game.worldRadius,screenX:first.x,screenY:first.y};}
       else{game.draw();pose={x:game.lookAt.x,y:game.lookAt.y,zoom:game.zoom,screenX:canvas.width/2,screenY:game.capture?Math.min(126,canvas.height*.22)+(canvas.height-Math.min(126,canvas.height*.22)-48)/2:canvas.height/2};}out.push(pose);
      }return out;
     },{...received,renderer});
     // v34 frames the actual capture boundary within the visible HUD insets.
     // Keep the legacy trace for comparison and check all four corners on every frame.
     const insets=await h.host.evaluate(()=>auditApp.renderer.hostInsets());
     for(const [n,p] of current.entries()){
      assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.zoom>0&&Number.isFinite(p.zoom));
      if(capture){
       const b=received.map.boundary, width=viewport.width-insets.left-insets.right-48, height=viewport.height-insets.top-insets.bottom;
       assert.equal(p.x,(b.minX+b.maxX)/2);assert.equal(p.y,(b.minY+b.maxY)/2);
       assert.equal(p.zoom,Math.min(width/(b.maxX-b.minX),height/(b.maxY-b.minY)));
       assert.equal(p.screenX,insets.left+24+width/2);assert.equal(p.screenY,insets.top+height/2);
       continue;
      }
      const subjects=received.view.actors.filter(a=>a.alive&&!a.clone&&(!p.pair||p.pair.includes(a.id)));
      for(const a of subjects){const x=p.screenX+(a.x-p.x)*p.zoom,y=p.screenY+(a.y-p.y)*p.zoom;
       assert.ok(x>=24&&x<=viewport.width-24&&y>=30&&y<=viewport.height-24,'subject outside safe frame');}
     }
     trace.push({count,first:current[0],last:current.at(-1),originalFirst:original[0],originalLast:original.at(-1)});
     if(count===2&&['auto','capture'].includes(scenario)){
      // Camera trace advances synchronously. Let the real 750ms death paint expire
      // before paired stills, without advancing the tested camera a 61st frame.
      await delay(800);await h.host.evaluate(async view=>{const {renderer:r}=await import('/src/main.js'),update=r.camera.update,pose=r.cameraPose;r.camera.update=()=>pose;try{r.draw({...view,renderTick:view.serverTick,effects:[]},performance.now());}finally{r.camera.update=update;}},received.view);
      // Canvas and Pixi have different canvas elements. Capture the visible render
      // surface, excluding unrelated HUD placeholders in this camera-only fixture.
      for(const [page,suffix]of [[h.host,'ws'],[ref.page,'original']]){const style=await page.addStyleTag({content:'body * {visibility:hidden!important} canvas {visibility:visible!important}'});await page.screenshot({path:`artifacts/fidelity-v33-2/camera-${renderer}-${viewport.width}-${scenario}-${suffix}.png`});await style.evaluate(e=>e.remove());}
     }
    }
    if(scenario==='auto')assert.ok(trace.at(-1).last.zoom>trace[0].last.zoom*2,'late survivors cannot stay fixed at whole-map scale');
    report.push({renderer,viewport,scenario,frames:300,trace,pass:true});console.log('camera',renderer,viewport.width,scenario,'PASS');
   }
  }
  assert.deepEqual(h.errors,[]);assert.deepEqual(ref.errors,[]);
 }finally{fs.writeFileSync('artifacts/fidelity-v33-2/camera.json',JSON.stringify(report,null,2));await h.close();await ref.browser.close();}
}
assert.equal(report.filter(r=>r.pass).length,renderers.length*viewports.length*5,'all selected camera policies completed');
