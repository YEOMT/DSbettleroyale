// v32.1 brCaptureArrowPosition and brCaptureObjectiveArrows, adapted to received WS state.
function position(point,cam,w,h,zoom,top=100,bottom=h-180){
 const dx=(point.x-cam.x)*zoom,dy=(point.y-cam.y)*zoom,r=point.radius*zoom;
 const nearX=Math.max(0,Math.abs(dx)-w/2),nearY=Math.max(0,Math.abs(dy)-h/2);
 if(nearX*nearX+nearY*nearY<=r*r)return null;
 top=Math.min(h*.45,top);bottom=Math.max(h*.55,bottom);
 const cx=w/2,cy=Math.max(top,Math.min(bottom,h/2)),left=38,right=w-38;
 const tx=Math.abs(dx)<1e-6?Infinity:(dx>0?right-cx:left-cx)/dx;
 const ty=Math.abs(dy)<1e-6?Infinity:(dy>0?bottom-cy:top-cy)/dy,t=Math.max(0,Math.min(tx,ty));
 return {x:cx+dx*t,y:cy+dy*t,angle:Math.atan2(dy,dx)};
}
export class ObjectiveArrows{
 hide(){if(this.root)this.root.hidden=true;}
 draw(map,packet,cam,w,h,zoom,color){
  if(!map||!packet){this.hide();return;}
  if(!this.root){this.root=document.createElement('div');this.root.id='br-capture-arrows';this.root.setAttribute('aria-hidden','true');document.getElementById('br-student-battle').append(this.root);this.nodes=map.points.map(()=>{const el=document.createElement('div'),arrow=document.createElement('span'),label=document.createElement('b');el.className='br-objective-arrow';arrow.textContent='➜';el.append(arrow,label);this.root.append(el);return {el,arrow,label,key:''};});}
  this.root.hidden=false;const key=w+'|'+h+'|'+packet.n;if(this.layoutKey!==key){this.layoutKey=key;this.top=Math.max(100,(document.getElementById('br-capture-scoreboard')?.getBoundingClientRect().bottom||80)+24);}
  const positions=[];for(const [i,z]of map.points.entries()){const node=this.nodes[i],pos=position(z,cam,w,h,zoom,this.top,h-(h>w?190:160));node.el.hidden=!pos;if(!pos)continue;
   for(const prior of positions)if(Math.hypot(pos.x-prior.x,pos.y-prior.y)<44)pos.y=Math.max(this.top,Math.min(h-160,pos.y+(pos.y<h/2?44:-44)));positions.push(pos);
   const enabled=!!(packet.am&(1<<i)),row=packet.z[i],col=!enabled?'#94a3b8':row[0]==='scoring'?color(row[1]):'#f8fafc',text=!enabled?'🔒 '+z.id:z.id+(i===1?' ×1.5':''),state=text+'|'+col;
   if(node.key!==state){node.key=state;node.label.textContent=text;node.el.style.color=col;}
   node.el.style.transform='translate('+pos.x.toFixed(1)+'px,'+pos.y.toFixed(1)+'px) translate(-50%,-50%)';node.arrow.style.transform='rotate('+pos.angle+'rad)';
  }
 }
}
