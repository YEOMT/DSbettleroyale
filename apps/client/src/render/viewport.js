// World framing always uses the logical camera. Screen-space decoration is drawn afterwards.
export function screenToWorld(clientX,clientY,rect,pose,width,height){
 if(!rect?.width||!rect.height||!(pose?.zoom>0))return null;
 const x=(clientX-rect.left)*width/rect.width,y=(clientY-rect.top)*height/rect.height;
 return {x:pose.x+(x-pose.screenX)/pose.zoom,y:pose.y+(y-pose.screenY)/pose.zoom};
}
export class StudentCamera{
 reset(){this.life=null;this.leadX=this.leadY=0;}
 constructor(){this.reset();}
 update(actor,move,width,height,dt){
  const life=actor&&[actor.id,actor.lifeSeq,actor.warpSeq,actor.alive].join(':');
  if(this.life!==life||dt>250)this.reset();
  this.life=life;
  // Follow the displayed body directly. Filter only the small anticipatory look.
  const k=-Math.expm1(-Math.min(80,Math.max(0,dt))/100);
  this.leadX+=((move?.x||0)*36-this.leadX)*k;
  this.leadY+=((move?.y||0)*36-this.leadY)*k;
  return {x:(actor?.x||0)+this.leadX,y:(actor?.y||0)+this.leadY,zoom:Math.max(width,height)/1800,screenX:width/2,screenY:height/2,mode:'student'};
 }
}
