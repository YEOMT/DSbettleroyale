// Reuse renderer text/sprite caches; six landmarks and a single tiny minimap.
import {supplyTypes} from './supplies.js';
import {mirrorMiniState,drawMiniMirrors} from './roster10-scene.js';
function portalRoute(a,b){
 const length=Math.hypot(b.x-a.x,b.y-a.y),dx=(b.x-a.x)/length,dy=(b.y-a.y)/length,segments=[];
 for(let t=70;t<length-70;t+=60)segments.push({x:a.x+t*dx,y:a.y+t*dy,arrow:segments.length%5===2});
 return {dx,dy,segments};
}
function sameDrop(a,b){return a===b||!!(a&&b&&a[0]===b[0]&&a[1]===b[1]&&a[2]===b[2]&&a[3]===b[3]);}
export function escapeScene(r,p,view,map,zoom){
 const layout=map.escapeMap,s=view.escape;if(!layout||!s)return;
 if(r.escapeLayout!==layout){r.escapeLayout=layout;r.escapePoints=[layout.portal.a,layout.portal.b,...layout.pads];r.portalRoute=portalRoute(layout.portal.a,layout.portal.b);r.escapeMiniKey=null;}
 const tick=view.renderTick,points=r.escapePoints;
 const {dx,dy,segments}=r.portalRoute,dim=s.blocked||s.nextReadyAt>tick,alpha=dim?.055:.13;
 const halfW=innerWidth/(2*zoom)+80,halfH=innerHeight/(2*zoom)+80;
 for(const q of segments){
  if(Math.abs(q.x-r.cam.x)>halfW||Math.abs(q.y-r.cam.y)>halfH)continue;
  p.line(q.x,q.y,q.x+dx*28,q.y+dy*28,'#67e8f9',alpha,2/zoom);
  if(q.arrow){for(const sign of [-1,1])p.line(q.x+dx*28,q.y+dy*28,q.x+dx*13-dy*9*sign,q.y+dy*13+dx*9*sign,'#a5f3fc',alpha,3/zoom);}
 }
 for(let i=0;i<6;i++){
  const q=points[i],at=i<2?s.nextReadyAt:s.pads[i-2],blocked=i<2&&s.blocked,seconds=Math.max(0,Math.ceil((at-tick)/60)),color=blocked?'#ef4444':seconds?'#94a3b8':i<2?'#22d3ee':'#a3e635',radius=i<2?64:58;
  const ink=i===1&&!dim?'#c084fc':color;
  p.circle(q.x,q.y,radius,ink,.17);p.circle(q.x,q.y,radius,ink,1,5);
  if(i===0){
   for(let arm=0;arm<3;arm++)for(let n=0;n<8;n++){
    const angle=arm*Math.PI*2/3+n*.29,next=angle+.29,rad=54-n*5;
    p.line(q.x+Math.cos(angle)*rad,q.y+Math.sin(angle)*rad,q.x+Math.cos(next)*(rad-5),q.y+Math.sin(next)*(rad-5),ink,.85,5);
   }
  }else if(i===1){p.circle(q.x,q.y,43,ink,.75,3);p.circle(q.x,q.y,73,ink,.28,3);}
  else{p.line(q.x-22,q.y+14,q.x+22,q.y-14,color,1,5);p.line(q.x+22,q.y-14,q.x+3,q.y-14,color,1,5);}
  const name=i===0?'입구 A':i===1?'출구 B / 역이동 불가':'가속 +30%';
  const label=blocked?name+' · 출구 차단':seconds?(i<2?name+' · ':'')+seconds+'초':name;
  r.text(label,q.x,q.y+radius+22,20,ink,'escape-'+i,true);
 }
 if(!r.escapeMini){const c=document.createElement('canvas');c.width=c.height=112;c.className='br-escape-map';c.setAttribute('aria-label','A에서 B로 단방향 포탈과 가속 발판 지도');r.canvas.parentElement.append(c);r.escapeMini=c;}
 const scale=48/map.worldRadius, xp=view.farm?.s, combat=view.farm?.c;
 const mirrors=mirrorMiniState(r),key=s.revision+':'+Math.round((view.self?.x||0)*scale)+':'+Math.round((view.self?.y||0)*scale)+mirrors.key;
 if(r.escapeMiniKey===key&&sameDrop(r.escapeMini.xp,xp)&&sameDrop(r.escapeMini.combat,combat))return;
 r.escapeMiniKey=key;r.escapeMini.xp=xp;r.escapeMini.combat=combat;
 const c=r.escapeMini.getContext('2d'),size=112;r.escapeMini.hidden=false;c.clearRect(0,0,size,size);c.fillStyle='#07101de0';c.fillRect(0,0,size,size);c.strokeStyle='#64748b';c.beginPath();c.arc(56,56,49,0,Math.PI*2);c.stroke();
 const a=points[0],b=points[1],mx=56+(a.x+b.x)*scale/2,my=56+(a.y+b.y)*scale/2;
 c.strokeStyle=dim?'#64748b':'#67e8f9';c.beginPath();c.moveTo(56+a.x*scale,56+a.y*scale);c.lineTo(56+b.x*scale,56+b.y*scale);
 c.moveTo(mx-dx*4-dy*3,my-dy*4+dx*3);c.lineTo(mx,my);c.lineTo(mx-dx*4+dy*3,my-dy*4-dx*3);c.stroke();
 c.font='bold 11px sans-serif';c.textAlign='center';for(let i=0;i<6;i++){const q=points[i],ready=i<2?!s.blocked&&!s.nextReadyAt:!s.pads[i-2];c.fillStyle=ready?(i===0?'#22d3ee':i===1?'#c084fc':'#a3e635'):'#94a3b8';c.fillText(i===0?'A':i===1?'B':'↑',56+q.x*scale,60+q.y*scale);}
 drawMiniMirrors(c,mirrors.rows,x=>56+x*scale,y=>56+y*scale);
 if(xp)c.fillText('📦',56+xp[0]*scale,60+xp[1]*scale);
 if(combat)c.fillText(supplyTypes[combat[3]].icon,56+combat[0]*scale,60+combat[1]*scale);
 if(view.self){c.fillStyle='#fff';c.beginPath();c.arc(56+view.self.x*scale,56+view.self.y*scale,2.5,0,Math.PI*2);c.fill();}
}
