// Shared Canvas/Pixi primitives. Radius always comes from authority; no filters,
// textures, random particles or persistent per-shot renderer resources.
export function overdriveShot(p,q,zoom){
 const z=Math.max(.18,zoom),r=Math.max(3,Number(q.radius)||3),x=q.x,y=q.y;
 if(!/^crayon-[0-3]$/.test(q.style||''))return false;
 const n=Number(q.style.at(-1)),c=q.color||q.trailColor,u=Math.hypot(q.dx,q.dy)||1,dx=q.dx/u,dy=q.dy/u;
 p.line(x-dx*r*2,y-dy*r*2,x,y,c,.65,Math.max(1/z,r*(n===0?.75:.3)));
 p.circle(x,y,r,c,.95);p.circle(x,y,r,'#fff',.8,1.5/z);
 // One to four white notches are legible without color discrimination.
 for(let i=0;i<=n;i++){const a=i*Math.PI*2/(n+1);p.line(x+Math.cos(a)*r*.4,y+Math.sin(a)*r*.4,x+Math.cos(a)*r*.8,y+Math.sin(a)*r*.8,'#fff',.95,2/z);}
 return true;
}
export function overdriveEffect(p,r,alpha,zoom){
 const style=r[10]||'',g=r[13]||{},x=r[2],y=r[3],z=Math.max(.18,zoom),a=alpha*alpha;
 if(!g.confirmed)return false;
 if(style.startsWith('overdrive-')){
  const radius=r[6]*(1.12-.12*alpha),color=r[7];
  if(style==='overdrive-wide')p.arc(x,y,radius,Math.atan2(r[5]||0,r[4]||1)-1.6,Math.atan2(r[5]||0,r[4]||1)+1.6,color,a,4/z);
  else if(style==='overdrive-rapid'){
   for(const side of [-1,1]){
    p.line(x+side*radius*.7,y-radius*.6,x+side*radius*.35,y-radius*.05,color,a,3/z);
    p.line(x+side*radius*.35,y-radius*.05,x+side*radius*.7,y+radius*.05,'#fff',a,2/z);
    p.line(x+side*radius*.7,y+radius*.05,x+side*radius*.35,y+radius*.6,color,a,3/z);
   }
  }else {p.circle(x,y,radius,color,a,3/z);p.circle(x,y,radius*.78,'#fff',a*.7,1.5/z);}
  return true;
 }
 if(style==='pan-contact'||style==='goblin-first'||style.startsWith('crayon-')||style==='apple-split'){
  const radius=Math.min(36,r[6]),color=r[7];p.circle(x,y,radius*(1.1-.25*alpha),color,a,2/z);
  const n=style==='apple-split'?8:style==='pan-contact'?3:4;
  for(let i=0;i<n;i++){const angle=i*Math.PI*2/n,dx=Math.cos(angle),dy=Math.sin(angle);p.line(x+dx*radius*.3,y+dy*radius*.3,x+dx*radius*.85,y+dy*radius*.85,'#fff',a,2/z);}
  return true;
 }
 return false;
}

export function giantOutline(p,q,zoom){if(q.giant>1&&q.actionKind==='attack'){const z=Math.max(.18,zoom);p.circle(q.x,q.y,q.radius,'#fff',.92,Math.max(1.2/z,Math.min(3/z,q.radius*.1)));}}
