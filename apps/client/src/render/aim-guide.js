// The server derives both ends of the power interval from the ability's actual
// brAimSpec (including modifiers). The current distance profiles are affine.
function clampPoint(point,map,pad){
 const b=map?.boundary;
 if(b)return {x:Math.max(b.minX+pad,Math.min(b.maxX-pad,point.x)),y:Math.max(b.minY+pad,Math.min(b.maxY-pad,point.y))};
 const length=Math.hypot(point.x,point.y),limit=map?.worldRadius-pad;
 return length>limit?{x:point.x*limit/length,y:point.y*limit/length}:point;
}
export function aimGuide(actor,kind,gesture,map,kernel,walls,visible=[],objects=[]){
 const profile=actor.aimProfiles?.[kind],spec=profile?.spec;
 if(!spec)return null;
 const fraction=Math.max(0,Math.min(1,(gesture.power-.18)/.82));
 const range=profile.rangeMin+(profile.range-profile.rangeMin)*fraction;
 const {x:dx,y:dy}=gesture.aim;
 if(spec.shape==='circle')return {...spec,range,x:actor.x,y:actor.y,dx,dy};
 let x=actor.x+dx*range,y=actor.y+dy*range;
 if(spec.clipRope&&kernel){
  kernel.boundary=map?.boundary;const wall=kernel.combatTraceWalls(actor,{x,y},5,walls||[],[]);let t=wall?.t??1;
  for(const other of visible){if(!other.alive||other.id===actor.id)continue;const at=kernel.combatSegmentCircleTime(actor.x-other.x,actor.y-other.y,x-actor.x,y-actor.y,other.radius+6);if(at!==null)t=Math.min(t,at);}
  for(const other of objects){if(!['turret','mushroom'].includes(other.kind)||other.hp<=0)continue;const at=kernel.combatSegmentCircleTime(actor.x-other.x,actor.y-other.y,x-actor.x,y-actor.y,other.radius+5);if(at!==null)t=Math.min(t,at);}
  return {...spec,range:range*t,x:actor.x+(x-actor.x)*t,y:actor.y+(y-actor.y)*t,dx,dy};
 }
 const pad=actor.radius+4;
 if(spec.train&&map){
  let edge=range;
  if(map.boundary){const b=map.boundary;
   for(const [v,f,lo,hi] of [[dx,actor.x,b.minX+pad,b.maxX-pad],[dy,actor.y,b.minY+pad,b.maxY-pad]])if(v!==0)edge=Math.min(edge,((v>0?hi:lo)-f)/v);
  }else{const dot=actor.x*dx+actor.y*dy,r=map.worldRadius-pad;edge=Math.min(edge,-dot+Math.sqrt(Math.max(0,dot*dot+r*r-actor.x**2-actor.y**2)));}
  x=actor.x+dx*Math.max(0,edge);y=actor.y+dy*Math.max(0,edge);
 }
 if(spec.teleport||spec.dash||spec.shape==='target'){
  if(spec.clipPath&&kernel){
   const radius=spec.collisionRadius??actor.radius,from={x:actor.x,y:actor.y};({x,y}=clampPoint({x,y},map,radius+4));kernel.boundary=map?.boundary;
   const wall=kernel.combatTraceWalls(from,{x,y},radius,walls||[],[]);let t=wall?Math.max(0,wall.t-.0001):1;
   if(spec.clipBodies)for(const other of visible){if(!other.alive||other.id===actor.id)continue;const at=kernel.combatSegmentCircleTime(actor.x-other.x,actor.y-other.y,x-actor.x,y-actor.y,radius+other.radius+(spec.bodyPadding??1));if(at!==null)t=Math.min(t,Math.max(0,at-.0001));}
   return {...spec,range,x:actor.x+(x-actor.x)*t,y:actor.y+(y-actor.y)*t,dx,dy};
  }
  ({x,y}=clampPoint({x,y},map,pad));
  if(kernel&&(spec.teleport||spec.dash||spec.rework&&spec.shape==='target')&&!spec.phases){
   const from=spec.teleport||spec.shape==='target'?{x,y}:actor;
   kernel.boundary=map?.boundary;
   const point=kernel.combatMoveCircle(from,{x:x-from.x,y:y-from.y},actor.radius,walls||[],!!spec.dash);
   x=point.x;y=point.y;
   // A rework target resolves penetration at the destination, not along its
   // entire ray. Use only public actors; the server resolves again on release.
   if(spec.rework&&spec.shape==='target')for(let pass=0;pass<4;pass++){
    let moved=false;
    for(const other of visible){
     if(!other.alive||other.id===actor.id)continue;
     const vx=x-other.x,vy=y-other.y,length=Math.hypot(vx,vy),need=actor.radius+other.radius+5;
     if(length>=need)continue;
     x=other.x+(length>.01?vx/length:Math.cos(pass*2.3))*need;
     y=other.y+(length>.01?vy/length:Math.sin(pass*2.3))*need;moved=true;
    }
    if(!moved)break;
    ({x,y}=kernel.combatMoveCircle({x,y},{x:0,y:0},actor.radius,walls||[],false));
   }
   ({x,y}=clampPoint({x,y},map,pad));
  }
 }
 // A non-teleport airborne target can cross ordinary cover, but cannot leave
 // the X arena through its solid terrain sides. Match the authoritative leap.
 if(spec.shape==='target'&&spec.teleport===false&&kernel&&map?.boundary?.blocks?.length){
  const length=Math.hypot(x-actor.x,y-actor.y),hit=kernel.combatTraceWalls(actor,{x,y},pad,map.boundary.blocks,[]);
  if(hit&&length>0){const t=Math.max(0,length*hit.t-.01)/length;x=actor.x+(x-actor.x)*t;y=actor.y+(y-actor.y)*t;}
 }
 return {...spec,range,x,y,dx,dy};
}
export function paintGuide(p,a,g,z){
 const col='#baf4ff',stroke=Math.max(1.3,2/z),r=g.impactRadius||g.radius;
 if(g.shape==='circle'||g.shape==='circleDir')p.dashedCircle(a.x,a.y,g.radius||g.range,col,.75,stroke);
 if(g.shape==='cone'){
  const angle=Math.atan2(g.dy,g.dx),spread=g.halfAngle||0;
  for(const side of [-1,1])p.line(a.x,a.y,a.x+Math.cos(angle+side*spread)*g.range,a.y+Math.sin(angle+side*spread)*g.range,col,.48,stroke);
  p.arc(a.x,a.y,g.range,angle-spread,angle+spread,col,.6,stroke);
 }
 if(g.shape==='target'||g.teleport||g.dash){
  p.dashedCircle(g.x,g.y,Math.max(3/z,r||g.width/2||6),col,.8,stroke);
  for(const radius of new Set([g.pullRadius,g.burstRadius,g.maxRadius]))if(radius>0&&radius!==r)p.dashedCircle(g.x,g.y,radius,col,.46,stroke);
  if(g.width>0&&g.dash)for(const side of [-1,1]){
   const x=-side*g.dy*g.width/2,y=side*g.dx*g.width/2;p.line(a.x+x,a.y+y,g.x+x,g.y+y,col,.48,stroke);
  }
 }else if(g.width&&['rect','line'].includes(g.shape)){
  for(const side of [-1,1]){const x=-side*g.dy*g.width/2,y=side*g.dx*g.width/2;p.line(a.x+x,a.y+y,g.x+x,g.y+y,col,.45,stroke);}
 }
 if(g.shape==='circle')return; // A self-centred skill has no remote landing point.
 p.line(a.x,a.y,g.x,g.y,col,.62,stroke);
 for(const side of [-1,1])p.line(g.x,g.y,g.x-(g.dx*11-side*g.dy*6)/z,g.y-(g.dy*11+side*g.dx*6)/z,col,.8,stroke);
}
