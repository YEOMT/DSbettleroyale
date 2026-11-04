const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
const finitePoint=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
const opposed=(a,b)=>a.id!==b.id&&(!a.team||a.team!==b.team);
function bounds(points,pad){
 let left=Infinity,right=-Infinity,top=Infinity,bottom=-Infinity;
 for(const p of points){const r=(p.radius||0)+pad;left=Math.min(left,p.x-r);right=Math.max(right,p.x+r);top=Math.min(top,p.y-r);bottom=Math.max(bottom,p.y+r);}
 return {left,right,top,bottom};
}
export class HostCamera{
 constructor(){this.reset();}
 reset(){
  this.x=this.y=this.time=this.nextReview=this.holdUntil=this.allowZoomIn=0;
  this.zoom=.5;this.mode='overview';this.count=0;this.focused=false;this.initial=true;this.target=null;this.pair=null;this.contacts=new Map();
 }
 // Only confirmed public contact points are supplied by the host connection.
 observe(event){
  const d=event.data;
  if(event.type!=='FX'||d.kind!=='hit'||!d.sourceId||!d.targetId||d.sourceId===d.targetId||d.geometry?.periodic)return;
  const key=[d.sourceId,d.targetId].sort().join('/');
  this.contacts.delete(key);this.contacts.set(key,{source:d.sourceId,target:d.targetId,life:d.geometry?.lifeSeq,targetLife:d.geometry?.targetLife,tick:event.serverTick,weight:3+.6*(d.impactLevel||1)});
  if(this.contacts.size>48)this.contacts.delete(this.contacts.keys().next().value);
 }
 choose(view,alive,byId){
  const candidates=new Map(),tick=view.renderTick??view.serverTick;
  const add=(a,b,score,threat)=>{
   if(!a||!b||!opposed(a,b))return;
   const key=[a.id,b.id].sort().join('/'),old=candidates.get(key);
   if(!old||score>old.score)candidates.set(key,{key,first:a.id,life:a.lifeSeq,second:b.id,otherLife:b.lifeSeq,score,threat:threat?.id});
  };
  for(const [key,c] of this.contacts){
   const a=byId.get(c.source),b=byId.get(c.target),age=tick-c.tick;
   if(!a||!b||age>108||c.life!=null&&c.life!==a.lifeSeq||c.targetLife!=null&&c.targetLife!==b.lifeSeq){this.contacts.delete(key);continue;}
   add(a,b,c.weight*(1-.55*Math.max(0,age)/108));
  }
  for(const q of view.shots||[]){
   const owner=byId.get(q.owner);if(!owner||q.preview||q.life!==owner.lifeSeq||!finitePoint(q))continue;
   // Interest evaluation runs at most every 180ms, never all actor pairs per draw.
   let closest=null,gap=500;
   for(const a of alive){if(!opposed(owner,a))continue;const d=Math.hypot(a.x-q.x,a.y-q.y);
    if(d<gap){gap=d;closest=a;}
   }
   if(closest)add(owner,closest,1.6-gap/600,q);
  }
  const current=candidates.get(this.pair?.key);let best=current;
  for(const p of candidates.values())if(!best||p.score>best.score)best=p;
  if(current&&(this.time<this.holdUntil||best.score<current.score*1.25))best=current;
  if(best?.key!==this.pair?.key)this.holdUntil=this.time+1200;
  this.pair=best||null;this.nextReview=this.time+180;
 }
 update(view,map,w,h,focus=false,dt=1000/60,insets={}){
  w=Math.max(1,w);h=Math.max(1,h);const elapsed=clamp(Number.isFinite(dt)?dt:0,0,80);
  this.time+=elapsed;
  const alive=view.actors.filter(p=>p.alive&&!p.clone&&finitePoint(p));
  // LOD is independent of the teacher's chosen camera.
  const lod=alive.length>12?'performance':alive.length<=5?'broadcast':'normal';
  if(view.capture&&map.boundary){
   const b=map.boundary,top=Math.min(126,h*.22),bottom=48;
   this.x=this.y=0;this.zoom=Math.max(.01,Math.min((w-48)/(b.maxX-b.minX),(h-top-bottom)/(b.maxY-b.minY)));
   this.pair=null;this.initial=true;this.target={x:0,y:0,zoom:this.zoom};
   return {...this.target,screenX:w/2,screenY:top+(h-top-bottom)/2,mode:'capture',lod:'capture',target:this.target};
  }
  let subjects=alive;
  if(focus){
   const byId=new Map(alive.map(p=>[p.id,p])),old=this.pair;
   const expired=old&&(!byId.has(old.first)||!byId.has(old.second)||byId.get(old.first).lifeSeq!==old.life||byId.get(old.second).lifeSeq!==old.otherLife);
   if(this.time>=this.nextReview||expired||!this.focused)this.choose(view,alive,byId);
   if(this.pair){
    subjects=[byId.get(this.pair.first),byId.get(this.pair.second)];
    const threat=view.shots?.find(s=>s.id===this.pair.threat);if(finitePoint(threat))subjects.push(threat);
   }
  }else this.pair=null;
  this.focused=focus;
  const mode=this.pair?'combat':'overview',r=Math.max(1,map.worldRadius||1);
  const box=subjects.length?bounds(subjects,this.pair?138:90):{left:-r,right:r,top:-r,bottom:r};
  const top=clamp(insets.top??86,0,h*.32),bottom=clamp(insets.bottom??54,0,h*.22);
  const width=Math.max(1,w-2*Math.min(28,w*.06)),height=Math.max(1,h-top-bottom);
  const screenX=w/2,screenY=top+height/2;
  const x=clamp((box.left+box.right)/2,-r,r),y=clamp((box.top+box.bottom)/2,-r,r);
  const fit=Math.min(width/(box.right-box.left),height/(box.bottom-box.top));
  const zoom=Math.min(this.pair?1.55:1.35,fit*.93);
  if(this.count!==alive.length||this.mode!==mode)this.allowZoomIn=this.time+240;
  this.count=alive.length;this.mode=mode;this.target={x,y,zoom};
  if(this.initial){this.x=x;this.y=y;this.zoom=zoom;this.initial=false;}
  const pan=-Math.expm1(-elapsed/(this.pair?180:230));
  this.x+=(x-this.x)*pan;this.y+=(y-this.y)*pan;
  if(zoom<this.zoom||this.time>=this.allowZoomIn)this.zoom+=(zoom-this.zoom)*-Math.expm1(-elapsed/(zoom<this.zoom?90:430));
  // Keep the subjects inside the usable rectangle even on a newly received warp.
  this.zoom=Math.min(this.zoom,fit);
  const halfX=width/(2*this.zoom),halfY=height/(2*this.zoom);
  this.x=clamp(this.x,box.right-halfX,box.left+halfX);
  this.y=clamp(this.y,box.bottom-halfY,box.top+halfY);
  return {x:this.x,y:this.y,zoom:this.zoom,screenX,screenY,mode,lod,target:this.target};
 }
}
