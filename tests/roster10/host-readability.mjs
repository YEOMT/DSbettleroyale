// Fixed-scene layout/cache measurement. This is not a mobile or continuous-FPS verdict.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {auditHarness} from '../fidelity-v33-2/harness.mjs';
const started=performance.now(),out='artifacts/roster10/host',report={status:'RUNNING',scenes:[],physicalMobile:'NOT_RUN'};
fs.mkdirSync(out,{recursive:true});
try{
 for(const renderer of ['canvas','pixi'])for(const mode of ['solo','team-elim','team-capture']){
  const h=await auditHarness({players:30,renderer,mode,quality:'balanced'});
  try{
   await h.battle();await h.host.waitForFunction(async()=>!!(await import('/src/main.js')).renderer.cameraPose);
   await h.host.evaluate(async()=>{const {renderer:r,timeline:t}=await import('/src/main.js');r.enabled=false;window.hostFixture=t.frame();});
   const cdp=await h.host.context().newCDPSession(h.host);
   for(const size of [{width:1366,height:768,dpr:1},{width:1366,height:768,dpr:2},{width:1920,height:1080,dpr:1},{width:768,height:1024,dpr:2}]){
    await cdp.send('Emulation.setDeviceMetricsOverride',{width:size.width,height:size.height,deviceScaleFactor:size.dpr,mobile:false});
    const rows=await h.host.evaluate(async({size,renderer,mode})=>{
     const {renderer:r}=await import('/src/main.js'),base=window.hostFixture,rows=[];r.resize();
     if(renderer==='pixi'&&!r.pixi)throw new Error('Pixi unavailable: '+r.lastRenderError);
     for(const quality of ['low','balanced','high'])for(const focus of [false,true])for(const count of [30,13,12,6,5,3,1]){
      r.session.roomMeta.graphicsPreset=quality;r.focus=focus;r.camera.reset();r.resize();
      const view={...base,effects:[],shots:[],hostEffects:null,actors:base.actors.map((a,i)=>({...a,alive:i<count,level:1+i%6,x:((i%6)-2.5)*230,y:(Math.floor(i/6)-2)*230,rw:{...a.rw,stunEnd:base.renderTick+100,shield:40,mark:1,bleed:1}}))};
      const at=performance.now();for(let k=0;k<3;k++)r.draw(view,at+k*17);
      const z=r.cameraPose.zoom,layouts=[...r.hostLayouts],values=[];
      for(const [id,l]of layouts){const a=view.actors.find(a=>a.id===id),source=r.paint.brGetEmojiSprite(a.emoji);let gap=l.levelGapCss,nameGap=l.nameGapCss,diameter=l.diameter;
       if(r.pixi){const b=r.sprites.get('actor-'+id),level=r.sprites.get('level-'+id),name=r.sprites.get('host-info-name-'+id);if(!b?.visible||!level?.visible)throw new Error('missing rendered host body/level');
        const canvas=b.texture.source.resource,ctx=canvas.getContext('2d'),pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;let minY=canvas.height,maxY=-1,minX=canvas.width,maxX=-1;
        for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++)if(pixels[(y*canvas.width+x)*4+3]){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}
        const top=b.y-b.height/2+minY/canvas.height*b.height;gap=(top-(level.y+level.height/2))*z;diameter=Math.max((maxX-minX+1)/canvas.width*b.width,(maxY-minY+1)/canvas.height*b.height)*z;
        if(l.nameVisible){if(!name?.visible)throw new Error('visible name has no sprite');nameGap=((level.y-level.height/2)-(name.y+name.height/2))*z;}
       }
       values.push({id,diameter,gap,nameGap,nameVisible:l.nameVisible,hpGap:(l.hp.y-a.y-l.diameter/2/z)*z,actualRadius:a.radius});
      }
      rows.push({renderer,mode,...size,quality,focus,count,lod:r.cameraPose.lod,zoom:z,values,textureCount:r.textures.size,textCount:r.labels.size,errors:r.lastRenderError||null});
     }
     return rows;
    },{size,renderer,mode});
    for(const row of rows){assert.equal(row.errors,null);assert.equal(row.values.length,row.count);for(const v of row.values){assert.ok(v.diameter>=(size.width<1000?24:28)-.2,JSON.stringify({row,v}));assert.ok(v.gap>=4&&v.gap<=6,JSON.stringify({row,v}));if(v.nameVisible)assert.ok(v.nameGap>=2&&v.nameGap<=4,JSON.stringify({row,v}));assert.ok(Math.abs(v.hpGap-4)<.01);}}
    report.scenes.push(...rows);
    if(size.width===1366&&size.dpr===1){
     await h.host.evaluate(async()=>{const {renderer:r}=await import('/src/main.js');r.focus=false;r.camera.reset();const b=window.hostFixture;r.draw({...b,effects:[],shots:[],hostEffects:null,actors:b.actors.map((a,i)=>({...a,alive:true,level:1+i%6,x:((i%6)-2.5)*230,y:(Math.floor(i/6)-2)*230}))},performance.now());});
     await h.host.screenshot({path:out+'/'+renderer+'-'+mode+'.png'});
    }
   }
   const cache=await h.host.evaluate(async()=>{
    const {renderer:r}=await import('/src/main.js'),base=window.hostFixture,at=performance.now(),view={...base,effects:[],shots:[],actors:base.actors.map(a=>({...a,alive:true}))};r.camera.reset();r.draw(view,at);
    const before={textures:r.textures.size,texts:r.labels.size,info:r.hostInfoSources.size},original=r.camera.update.bind(r.camera);let tick=0;
    r.camera.update=(...args)=>({...original(...args),zoom:.2+Math.sin(++tick*.1)*.05});
    for(let i=0;i<50;i++)r.draw(view,at+17*(i+1));r.camera.update=original;
    const after={textures:r.textures.size,texts:r.labels.size,info:r.hostInfoSources.size},sources=[...r.textures.values()].map(t=>t.source);r.reset();
    return {before,after,reset:{textures:r.textures.size,texts:r.labels.size,info:r.hostInfoSources.size,layouts:r.hostLayouts.size,rings:r.roster10Rings.size},unreleased:sources.filter(s=>!s.destroyed).length};
   });
   assert.deepEqual(cache.after,cache.before,'zoom regenerated glyphs/labels');assert.equal(cache.unreleased,0);for(const n of Object.values(cache.reset))assert.equal(n,0);assert.deepEqual(h.errors,[]);
   report.scenes.push({renderer,mode,cache});console.log('PASS',renderer,mode);
  }finally{await h.close();}
 }
 report.status='PASS';
}catch(error){report.status='FAIL';report.error=error.stack;throw error;}
finally{report.ms=performance.now()-started;fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify({status:report.status,ms:report.ms,scenes:report.scenes.length}));}
