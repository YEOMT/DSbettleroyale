// Same display fixture on base/candidate; alpha ink is measured from actual draw calls.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {auditHarness} from '../fidelity-v33-2/harness.mjs';
const label=process.argv[2]||'candidate',baseline=label==='baseline',out='artifacts/roster10/host-'+label,started=performance.now(),report={label,rows:[],physicalMobile:'NOT_RUN'};
fs.mkdirSync(out,{recursive:true});
try{for(const renderer of ['canvas','pixi'])for(const mode of (process.env.HOST_MODES||'solo,team-elim,team-capture').split(',')){
 const h=await auditHarness({players:30,renderer,mode,quality:'balanced'});
 try{
  await h.battle();await h.host.waitForFunction(async()=>!!(await import('/src/main.js')).renderer.cameraPose);
  for(const count of [30,6,5]){
   const result=await h.host.evaluate(async({count,baseline})=>{
    const {renderer:r,timeline:t}=await import('/src/main.js');r.enabled=false;r.camera.reset();const raw=t.frame(),view={...raw,effects:[],shots:[],hostEffects:null,actors:raw.actors.map((a,i)=>({...a,name:'Player '+i,emoji:'🤠',radius:20,level:6,alive:i<count,flags:0,stunned:0,rw:{},x:((i%6)-2.5)*230,y:(Math.floor(i/6)-2)*230}))},a=view.actors[0],inkCache=new Map();
    const ink=source=>{if(inkCache.has(source))return inkCache.get(source);const w=source.width,h=source.height,data=source.getContext('2d').getImageData(0,0,w,h).data;let x0=w,y0=h,x1=-1,y1=-1;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(data[(y*w+x)*4+3]){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}const bounds={x:x0,y:y0,w:x1-x0+1,h:y1-y0+1};inkCache.set(source,bounds);return bounds;};
    const draws=[];let draw;if(!r.pixi){draw=r.ctx.drawImage;r.ctx.drawImage=function(source,...args){draws.push({source,args,m:this.getTransform()});return draw.call(this,source,...args);};}
    try{r.draw(view,performance.now());}finally{if(draw)r.ctx.drawImage=draw;}
    const z=r.cameraPose.zoom;
    function pixiBounds(s){const source=s.texture.source.resource,b=ink(source);return {top:(s.y-s.height/2+b.y/source.height*s.height)*z,bottom:(s.y-s.height/2+(b.y+b.h)/source.height*s.height)*z,width:b.w/source.width*s.width*z,height:b.h/source.height*s.height*z};}
    function canvasBounds(source){const call=draws.find(q=>q.source===source);if(!call)throw Error('missing actual Canvas draw');const b=ink(source),q=call.args,[x,y,w,h]=q.length===4?q:q.slice(4),m=call.m,point=(px,py)=>({x:(m.a*px+m.c*py+m.e)/r.dpr,y:(m.b*px+m.d*py+m.f)/r.dpr}),lo=point(x+b.x/source.width*w,y+b.y/source.height*h),hi=point(x+(b.x+b.w)/source.width*w,y+(b.y+b.h)/source.height*h);return {top:lo.y,bottom:hi.y,width:hi.x-lo.x,height:hi.y-lo.y};}
    let body,level,name;if(r.pixi){body=pixiBounds(r.sprites.get('actor-'+a.id));level=pixiBounds(r.sprites.get('level-'+a.id));if(!baseline&&r.hostLayouts.get(a.id).nameVisible)name=pixiBounds(r.sprites.get('host-info-name-'+a.id));}
    else{body=canvasBounds(r.hostTracks.get(a.id).cacheCanvas);const raw=r.paint.brLevelCanvas(a.level),source=baseline?raw:(await import('/src/render/host-layout.js')).hostInk(raw);level=canvasBounds(source);if(!baseline&&r.hostLayouts.get(a.id).nameVisible)name=canvasBounds(r.hostInfoSources.get(a.id).source);}
    return {count,zoom:z,diameter:Math.max(body.width,body.height),levelGap:body.top-level.bottom,nameGap:name?level.top-name.bottom:null,visibleNames:r.hostLayouts?[...r.hostLayouts.values()].filter(l=>l.nameVisible).length:null,textures:r.textures.size,texts:r.labels.size,error:r.lastRenderError||null};
   },{count,baseline});
   if(!baseline){assert.ok(result.diameter>=27.8);assert.ok(result.levelGap>=4&&result.levelGap<=6,JSON.stringify(result));if(result.nameGap!==null)assert.ok(result.nameGap>=2&&result.nameGap<=4);assert.equal(result.error,null);}
   report.rows.push({renderer,mode,...result});await h.host.screenshot({path:out+'/'+renderer+'-'+mode+'-'+count+'.png'});
  }
  if(!baseline){
   const cache=await h.host.evaluate(async()=>{
    const {renderer:r,timeline:t}=await import('/src/main.js'),base=t.frame(),now=performance.now(),view={...base,hostEffects:null,effects:[],shots:[],actors:base.actors.map(a=>({...a,alive:true,name:'Cache',emoji:'🤠',level:6}))};r.draw(view,now);
    const counts={canvas:0,texture:0,text:0},create=document.createElement,texture=r.texture,text=r.text,update=r.camera.update;let tick=0;
    // Warm each visible glyph once, including names first revealed by zoom-in.
    r.camera.update=function(...args){return {...update.apply(this,args),zoom:.2+Math.sin(++tick*.1)*.05};};for(let i=0;i<50;i++)r.draw(view,now+17*(i+1));tick=0;
    document.createElement=function(tag,...args){if(tag==='canvas')counts.canvas++;return create.call(this,tag,...args);};r.texture=function(source){if(!this.textures.has(source))counts.texture++;return texture.call(this,source);};r.text=function(value,x,y,size,color,key,...args){if(this.pixi&&!this.labels.has(key))counts.text++;return text.call(this,value,x,y,size,color,key,...args);};r.camera.update=function(...args){return {...update.apply(this,args),zoom:.2+Math.sin(++tick*.1)*.05};};
    try{for(let i=0;i<50;i++)r.draw(view,now+17*(i+1));}finally{document.createElement=create;r.texture=texture;r.text=text;r.camera.update=update;}
    // Scoped persistent objects are rendered by both paths, then retired with no survivor.
    const id='fixture-ring',end=base.renderTick+300,shots=[{kind:'decoy',id:'fixture-decoy',x:0,y:0,radius:20,emoji:'🤡',name:'Decoy',hp:20,maxHp:30,end},{kind:'grapple',id:'fixture-grapple',x:90,y:0,fx:10,fy:0,tx:90,ty:0,radius:5,end},{kind:'mushroom',id:'fixture-mushroom',x:0,y:80,radius:26,armAt:0,hp:20,maxHp:20,end},{kind:'poison',id:'fixture-poison',x:80,y:80,radius:90,end}],dynamicWalls={revision:1,rings:[{id,x:0,y:0,radius:260,end}],walls:[]};
    r.draw({...view,shots,dynamicWalls},now+1000);const visible=[...r.roster10Visible],entry=r.roster10Rings.get(id),graphic=entry.graphic;
    r.draw({...view,shots,dynamicWalls},now+1017);const reused=r.roster10Rings.get(id)===entry;
    r.draw({...view,shots:[],dynamicWalls:{revision:2,rings:[],walls:[]}},now+1034);
    const retired={rings:r.roster10Rings.size,visible:r.roster10Visible.size,sprites:[...r.sprites.keys()].filter(k=>k.startsWith('rw-')).length,destroyed:!graphic||graphic.destroyed};
    r.draw({...view,shots,dynamicWalls},now+1051);const owned=r.roster10Rings.get(id).graphic;r.reset();
    return {counts,visible,reused,retired,reset:{rings:r.roster10Rings.size,visible:r.roster10Visible.size,destroyed:!owned||owned.destroyed}};
   });
   assert.deepEqual(cache.counts,{canvas:0,texture:0,text:0},'zoom created new display resources');assert.equal(cache.reused,true);assert.equal(cache.visible.length,5);assert.deepEqual(cache.retired,{rings:0,visible:0,sprites:0,destroyed:true});assert.deepEqual(cache.reset,{rings:0,visible:0,destroyed:true});report.rows.push({renderer,mode,cache});
  }
  assert.deepEqual(h.errors,[]);
 }finally{await h.close();}
}report.status=baseline?'MEASURED':'PASS';}catch(error){report.status='FAIL';report.error=error.stack;throw error;}
finally{report.ms=performance.now()-started;fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));}
