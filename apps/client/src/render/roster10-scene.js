import {Graphics} from 'pixi.js';
import {hostDisplayRadius,hostInk} from './host-layout.js';

export const roster10Kinds=new Set(['decoy','grapple','mushroom','poison','ring-wall','red-light-warning','spotlight','mirror']);

export function mirrorMiniState(r){
 const shots=r.timeline.samples.at(-1)?.state.shots;
 if(!r.miniMirrors||r.miniMirrors.shots!==shots){
  const rows=shots?.filter(s=>s.kind==='mirror')||[];
  r.miniMirrors={shots,rows,key:rows.map(s=>s.id).join('|')};
 }
 return r.miniMirrors;
}
export function drawMiniMirrors(c,rows,x,y){
 c.strokeStyle='#e0f2fe';c.lineWidth=2;
 for(const e of rows){const dx=-e.dy*e.length/2,dy=e.dx*e.length/2;c.beginPath();c.moveTo(x(e.x-dx),y(e.y-dy));c.lineTo(x(e.x+dx),y(e.y+dy));c.stroke();}
}
export function clearRoster10Scene(r){
 r.miniMirrors=null;
 for(const entry of r.roster10Rings?.values()||[])if(entry.graphic&&!entry.graphic.destroyed)entry.graphic.destroy();
 r.roster10Rings?.clear();r.roster10Visible?.clear();
}

function rings(r,view){
 const cache=r.roster10Rings??=new Map(),visible=r.roster10Visible;
 for(const entry of cache.values())entry.used=false;
 for(const ring of view.dynamicWalls?.rings||[]){
  if(view.renderTick>=ring.end)continue;let entry=cache.get(ring.id);
  // Ring geometry is immutable for its scoped ID. Camera/DPR changes scale it.
  if(!entry){
   entry={used:true};
   if(r.pixi){entry.graphic=new Graphics().circle(ring.x,ring.y,ring.radius).stroke({color:'#806133',width:24,alpha:1}).circle(ring.x,ring.y,ring.radius-12).stroke({color:'#fde68a',width:2,alpha:1}).circle(ring.x,ring.y,ring.radius+12).stroke({color:'#fbbf24',width:2,alpha:1});r.world.addChildAt(entry.graphic,3);}
   else{entry.path=new Path2D();entry.path.arc(ring.x,ring.y,ring.radius,0,Math.PI*2);entry.inner=new Path2D();entry.inner.arc(ring.x,ring.y,ring.radius-12,0,Math.PI*2);entry.outer=new Path2D();entry.outer.arc(ring.x,ring.y,ring.radius+12,0,Math.PI*2);}
   cache.set(ring.id,entry);
  }
  entry.used=true;visible.add(ring.id);
  if(!r.pixi){const c=r.ctx;c.save();c.strokeStyle='#806133';c.lineWidth=24;c.stroke(entry.path);c.strokeStyle='#fde68a';c.lineWidth=2;c.stroke(entry.inner);c.strokeStyle='#fbbf24';c.stroke(entry.outer);c.restore();}
 }
 for(const [id,entry]of cache)if(!entry.used){entry.graphic?.destroy();cache.delete(id);}
}

function decoy(r,p,e,z){
 const rad=r.teacher?hostDisplayRadius(e.radius,z,innerWidth,innerHeight):e.radius,color=e.team?r.paint.brTeamKillColor(e.team):'#c084fc',source=r.paint.brGetEmojiSprite(e.emoji||'🤡');
 p.circle(e.x,e.y,rad,'#111827',1);r.image(r.teacher?hostInk(source,true):source,e.x,e.y,rad,'rw-decoy-'+e.id);p.circle(e.x,e.y,rad,color,.95,2/z);
 const hp=Math.max(0,Math.min(1,e.hp/Math.max(1,e.maxHp)));p.rect(e.x-rad,e.y+rad+4/z,rad*2,4/z,'#4b1620',1);p.rect(e.x-rad,e.y+rad+4/z,rad*2*hp,4/z,'#4ade80',1);
 if(e.name){const name=r.paint.brGetNameSprite(e.name,'#f8fafc',false),w=Math.min(120,name._labelW||120)/z,h=22/z,y=e.y-rad-13/z;
  if(r.pixi){r.image(name,e.x,y,1,'rw-decoy-name-'+e.id);const sprite=r.sprites.get('rw-decoy-name-'+e.id);sprite.width=w;sprite.height=h;}else r.ctx.drawImage(name,e.x-w/2,y-h/2,w,h);
 }
}

export function drawRoster10Scene(r,p,view,zoom){
 const z=Math.max(.01,zoom),visible=r.roster10Visible??=new Set();visible.clear();rings(r,view);
 for(const e of view.shots){
  if(!roster10Kinds.has(e.kind)||e.kind==='ring-wall'||(e.displayFrame??view.renderTick)>=e.end)continue;
  visible.add(e.id);
  if(e.kind==='spotlight'){
   p.circle(e.x,e.y,e.radius,'#fde68a',.12);p.circle(e.x,e.y,e.radius,'#facc15',.95,3/z);
  }else if(e.kind==='mirror'){
   const tx=-e.dy*e.length/2,ty=e.dx*e.length/2,x1=e.x-tx,y1=e.y-ty,x2=e.x+tx,y2=e.y+ty;
   p.line(x1,y1,x2,y2,'#cbd5e1',.32,e.width);
   p.line(x1+e.dx*12,y1+e.dy*12,x2+e.dx*12,y2+e.dy*12,'#e0f2fe',.95,3/z);
  }else if(e.kind==='red-light-warning'){
   const angle=Math.atan2(e.dy,e.dx),half=e.halfAngle,range=e.length;
   p.sector(e.x,e.y,range,angle,half,e.color,.15);
   p.arc(e.x,e.y,range,angle-half,angle+half,e.color,.95,2/z);
  }else if(e.kind==='decoy')decoy(r,p,e,z);
  else if(e.kind==='grapple'){
   // The moving owner's current endpoint comes from the authoritative snapshot.
   // Never retain the original cast position or connect an invisible decoy owner.
   const x=Number.isFinite(e.tx)?e.tx:e.x,y=Number.isFinite(e.ty)?e.ty:e.y;
   if(Number.isFinite(e.fx)&&Number.isFinite(e.fy))p.line(e.fx,e.fy,x,y,'#e7bd84',.95,Math.max(2/z,4),'round');
   p.arc(x,y,Math.max(5,4/z),-.6,Math.PI*1.45,'#fde68a',1,2/z);
  }else if(e.kind==='mushroom'){
   const armed=(e.displayFrame??view.renderTick)>=e.armAt;
   p.circle(e.x,e.y,e.radius,'#86efac',armed?.14:.06);p.circle(e.x,e.y,e.radius,armed?'#86efac':'#d1d5db',armed?.85:.5,1.5/z);r.glyph(e.emoji||'🍄',e.x,e.y,e.radius,'rw-mushroom-'+e.id,0,armed?1:.65);
   if(e.hp<e.maxHp){p.rect(e.x-e.radius,e.y+e.radius+4/z,e.radius*2,3/z,'#4b1620',1);p.rect(e.x-e.radius,e.y+e.radius+4/z,e.radius*2*Math.max(0,e.hp/e.maxHp),3/z,'#86efac',1);}
  }else if(e.kind==='poison'){
   p.circle(e.x,e.y,e.radius,'#4d7c0f',.18);p.circle(e.x,e.y,e.radius,'#a3e635',.9,2/z);p.circle(e.x,e.y,Math.min(9,e.radius*.12),'#a3e635',.65);
  }
 }
}
