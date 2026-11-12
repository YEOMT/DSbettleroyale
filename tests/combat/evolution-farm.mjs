import assert from 'node:assert/strict';
import fs from 'node:fs';
import {auditHarness} from '../fidelity-v33-2/harness.mjs';

// Isolate drawing cost on the same received scene and actual Pixi renderer.
// GPU synchronization is confined to the experiment. Live frame and network
// results are measured separately by classroom-compare on the same CI runner.
const h=await auditHarness({players:20,renderer:'pixi',quality:'low',viewport:{width:844,height:640}});
try{
 await h.battle();const results=[];
 for(const [role,page] of [['host',h.host],['student',h.student]]){
  const rows=await page.evaluate(async()=>{
   const {renderer:r,timeline}=await import('/src/main.js');
   const draw=r.draw.bind(r);
   const view=timeline.frame(),batch=r.drawCrates.bind(r),paint=r.paint.brPaintCrate.bind(r.paint),samples=[];
   if(!r.pixi||!view.farm.b.length)throw Error('actual farm/Pixi scene required');
   const original=(p,rows)=>{for(const b of rows)r.paint.brPaintCrate(p,b);};
   let builds=0;r.draw=()=>{};r.paint.brPaintCrate=(...args)=>{builds++;return paint(...args);};
   try{
    for(const mode of ['vectors','cache','cache','vectors']){
     const method=mode==='cache'?batch:original,prep=[];
     r.crateLayer.visible=mode==='cache';r.drawCrates=(p,rows)=>{const at=performance.now();method(p,rows);prep.push(performance.now()-at);};
     draw(view,performance.now());r.app.renderer.gl.finish();builds=0;prep.length=0;
     const times=[];for(let i=0;i<12;i++){
      await new Promise(requestAnimationFrame);const start=performance.now();draw(view,start);r.app.renderer.gl.finish();times.push(performance.now()-start);
     }
     times.sort((a,b)=>a-b);prep.sort((a,b)=>a-b);samples.push({mode,prepareMedian:prep[6],crates:view.farm.b.length,builds,drawMedian:times[6],drawP95:times[11]});
    }
   }finally{r.crateLayer.visible=true;r.draw=draw;r.drawCrates=batch;r.paint.brPaintCrate=paint;}
   return samples;
  });
  for(const row of rows)assert.equal(row.builds,row.mode==='cache'?0:12*row.crates,role+' '+row.mode);
  results.push({role,rows});
 }
 await h.command('END');await h.command('REMATCH');
 for(const page of [h.host,h.student])await page.waitForFunction(()=>!auditApp.renderer.crateRows&&auditApp.renderer.crateLayer.context.instructions.length===0&&auditApp.renderer.textures.size===0);
 fs.mkdirSync('artifacts/v35',{recursive:true});fs.writeFileSync('artifacts/v35/farm-draw.json',JSON.stringify(results,null,2));
 console.log('20-player Pixi crate cache',JSON.stringify(results));
}finally{await h.close();}
