// Six fixed landmarks, one link clock and four pad clocks. No independent timers.
const hazards=new Set(['zone','poison','fire','radiation','gravity']);
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function initEscape(w){
 if(w.session.roomMeta.mode!=='solo')return;
 const g=w.game,points=[];
 const clear=(p,r)=>!g.checkWallCollision(p,r)&&!g.blocksCoverEntry?.(p,r)&&!g.farmBoxes.some(b=>dist(p,b.pos)<r+(b.radius||60))&&!g.participants.some(a=>dist(p,a.pos)<r+a.radius+50)&&!g.smokes.some(s=>dist(p,s.pos)<r+s.radius);
 // Bounded deterministic map scan; never consumes the combat RNG stream.
 for(let band=0;band<7&&points.length<6;band++)for(let i=0;i<72&&points.length<6;i++){
  const angle=(i*29%72)*Math.PI/36+(g.mapIndex||0)*.3,r=g.worldRadius*(.35+band*.045),p=new w.Vec2(Math.cos(angle)*r,Math.sin(angle)*r);
  if(points.some(q=>dist(p,q)<420)||!clear(p,150))continue;
  let exits=0;for(let d=0;d<8;d++){const a=d*Math.PI/4;let ok=true;for(let n=1;n<=4;n++)if(!clear(new w.Vec2(p.x+Math.cos(a)*n*55,p.y+Math.sin(a)*n*55),85)){ok=false;break;}if(ok)exits++;}
  const cover=g.walls.some(w=>dist(p,w.pos||w)<Math.hypot(w.w,w.h)/2+550);
  if(exits>=2&&cover)points.push({x:p.x,y:p.y});
 }
 if(points.length!==6)throw Error('ESCAPE_PLACEMENT_FAILED');
 g.escapeMap={portal:{a:points[0],b:points[1],radius:64},pads:points.slice(2).map((p,i)=>({...p,id:i,radius:58}))};
 g.escape={revision:1,nextReadyAt:0,blocked:false,pads:[0,0,0,0]};
 g.escapeBlocks=(p,r)=>points.some(q=>dist(p,q)<r+150);
}
function safe(w,p,r){const g=w.game,ring=g.ringGeometry;return (!ring||Math.hypot(p.x-ring.cx,p.y-ring.cy)+r<ring.radius)&&!g.checkWallCollision(p,r)&&!g.farmBoxes.some(b=>dist(p,b.pos)<r+(b.radius||60))&&!g.zones.some(z=>dist(p,z.pos)<r+z.radius)&&!(g.rw?.entities||[]).some(e=>!e.dead&&hazards.has(e.kind)&&dist(p,e.pos)<r+(e.radius||e.range||0));}
export function updateEscape(w,publish){
 const g=w.game,s=g.escape,map=g.escapeMap;if(!s)return;
 let changed=false;const tick=g.frame,blocked=!safe(w,map.portal.b,100);
 if(s.blocked!==blocked){s.blocked=blocked;changed=true;}
 if(s.nextReadyAt&&tick>=s.nextReadyAt){s.nextReadyAt=0;changed=true;}
 for(let i=0;i<4;i++)if(s.pads[i]&&tick>=s.pads[i]){s.pads[i]=0;changed=true;}
 for(const p of g.participants){
  if(p.escapeLife!==p.lifeSeq){p.escapeLife=p.lifeSeq;p.escapePadMask=0;p.escapeBoostUntil=0;}
  if(!p.alive||p.isClone||!p.remoteId){p.escapeBoostUntil=0;p.escapePadMask=0;continue;}
  let mask=0,enter=0;for(let i=0;i<4;i++)if(dist(p.pos,map.pads[i])<=map.pads[i].radius){mask|=1<<i;if(!(p.escapePadMask&(1<<i))&&!s.pads[i])enter|=1<<i;}
  const portal=!s.nextReadyAt&&!s.blocked&&dist(p.pos,map.portal.a)<=map.portal.radius;
  if(!portal&&!enter){p.escapePadMask=mask;continue;}
  const locks=w.BRRework?.inputLocks(p,g),valid=!locks?.move&&!p.stunned&&!p.playerDash&&!p.dashFrames&&Number(p.spawnProtectionUntilFrame||0)<=tick;
  if(valid&&portal&&safe(w,map.portal.b,p.radius+12)){
   p.pos=new w.Vec2(map.portal.b.x,map.portal.b.y);p.vel=new w.Vec2(0,0);p.warpSeq=(p.warpSeq||0)+1;g.spatialDirty=true;g.rebuildSpatialGrid();s.nextReadyAt=tick+1200;changed=true;mask=enter=0;
  }
  if(valid)for(let i=0;i<4;i++)if(enter&(1<<i)){s.pads[i]=tick+900;p.escapeBoostUntil=tick+180;changed=true;}p.escapePadMask=mask;
 }
 if(changed){s.revision++;publish({...s,pads:s.pads.slice()});}
}
