// Reuse renderer text/sprite caches; six landmarks and a single tiny minimap.
export function escapeScene(r,p,view,map,zoom){
 const layout=map.escapeMap,s=view.escape;if(!layout||!s)return;
 if(r.escapeLayout!==layout){r.escapeLayout=layout;r.escapePoints=[layout.portal.a,layout.portal.b,...layout.pads];r.escapeMiniKey=null;}
 const tick=view.renderTick,points=r.escapePoints;
 for(let i=0;i<6;i++){
  const q=points[i],at=i<2?s.nextReadyAt:s.pads[i-2],blocked=i<2&&s.blocked,seconds=Math.max(0,Math.ceil((at-tick)/60)),color=blocked?'#ef4444':seconds?'#94a3b8':i<2?'#22d3ee':'#a3e635',radius=i<2?64:58;
  p.circle(q.x,q.y,radius,color,.17);p.circle(q.x,q.y,radius,color,1,5);
  p.line(q.x-22,q.y+14,q.x+22,q.y-14,color,1,5);p.line(q.x+22,q.y-14,q.x+3,q.y-14,color,1,5);
  const label=blocked?'출구 차단':seconds?seconds+'초':i===0?'A → B':i===1?'출구 / 역이동 불가':'가속 +30%';
  r.text(label,q.x,q.y+radius+22,20,color,'escape-'+i,1,true);
 }
 if(!r.escapeMini){const c=document.createElement('canvas');c.width=c.height=112;c.className='br-escape-map';c.setAttribute('aria-label','A에서 B로 단방향 포탈과 가속 발판 지도');r.canvas.parentElement.append(c);r.escapeMini=c;}
 const scale=48/map.worldRadius,key=s.revision+':'+Math.round((view.self?.x||0)*scale)+':'+Math.round((view.self?.y||0)*scale);if(r.escapeMiniKey===key)return;r.escapeMiniKey=key;
 const c=r.escapeMini.getContext('2d'),size=112;r.escapeMini.hidden=false;c.clearRect(0,0,size,size);c.fillStyle='#07101de0';c.fillRect(0,0,size,size);c.strokeStyle='#64748b';c.beginPath();c.arc(56,56,49,0,Math.PI*2);c.stroke();
 c.font='bold 11px sans-serif';c.textAlign='center';for(let i=0;i<6;i++){const q=points[i],ready=i<2?!s.blocked&&!s.nextReadyAt:!s.pads[i-2];c.fillStyle=ready?(i<2?'#22d3ee':'#a3e635'):'#94a3b8';c.fillText(i===0?'A→':i===1?'B':'↑',56+q.x*scale,60+q.y*scale);}
 if(view.self){c.fillStyle='#fff';c.beginPath();c.arc(56+view.self.x*scale,56+view.self.y*scale,2.5,0,Math.PI*2);c.fill();}
}
