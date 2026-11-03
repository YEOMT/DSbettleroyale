// Screen-space effects from the original host/student render paths.
export function screenEffects(r,view,pose,self,w,h,now){
 const outside=!r.teacher&&self?.alive&&!view.capture&&view.ring&&Math.hypot(self.x-view.ring.cx,self.y-view.ring.cy)>view.ring.radius;
 const flash=r.teacher?view.hostEffects?.screenFlashAlpha||0:0;
 if(r.pixi){r.screen.clear();if(flash&&(!view.capture||!r.session.captureDecorReduced))r.screen.rect(0,0,w,h).fill({color:0xffd9cf,alpha:flash});if(outside)r.screen.rect(2.5,2.5,w-5,h-5).stroke({color:0xff4f6e,width:5,alpha:.72});return;}
 const c=r.ctx;c.save();c.setTransform(r.dpr,0,0,r.dpr,0,0);
 if(!r.teacher){if(outside){c.strokeStyle='rgba(255,79,110,'+(.60+.18*Math.sin(now*.006))+')';c.lineWidth=5;c.strokeRect(2.5,2.5,w-5,h-5);const warning=r.paint.brGetNameSprite('자기장 밖 · 안전구역으로!','#ffe3aa',true),width=Math.min(230,w*.66);c.fillStyle='rgba(49,8,23,.90)';c.fillRect((w-width)/2,86,width,28);c.drawImage(warning,(w-width)/2,83,width,35);}const g=c.createRadialGradient(w/2,h/2,Math.min(w,h)*.30,w/2,h/2,Math.hypot(w,h)*.5*1.04);g.addColorStop(0,'rgba(1,5,14,0)');g.addColorStop(.64,'rgba(1,5,14,.04)');g.addColorStop(.88,'rgba(1,5,14,.22)');g.addColorStop(1,'rgba(1,5,14,.52)');c.fillStyle=g;c.fillRect(0,0,w,h);}
 else if(!view.capture&&pose.mode!=='performance'){
  if(view.presentation?.finalPhase&&!view.presentation.gameOver){const a=.045+Math.sin(view.renderTick*.075)*.018,g=c.createRadialGradient(w/2,h/2,Math.min(w,h)*.1,w/2,h/2,Math.max(w,h)*.72);g.addColorStop(0,'rgba(168,85,247,0)');g.addColorStop(.68,`rgba(126,34,206,${a})`);g.addColorStop(1,`rgba(76,29,149,${a*1.8})`);c.fillStyle=g;c.fillRect(0,0,w,h);}
  if(flash){c.fillStyle=`rgba(${view.hostEffects.screenFlashColor},${flash})`;c.fillRect(0,0,w,h);}
  const pulse=view.hostEffects?.vignettePulse||0;if(pulse){const g=c.createRadialGradient(w/2,h/2,Math.min(w,h)*.15,w/2,h/2,Math.max(w,h)*.7);g.addColorStop(0,'rgba(255,0,0,0)');g.addColorStop(1,`rgba(255,30,30,${Math.min(.42,pulse*.35)})`);c.fillStyle=g;c.fillRect(0,0,w,h);}
 }
 c.restore();
}
