// Remaining v32.1 brDrawStudentFx primitives, shared by Canvas and Pixi.
export function drawFallback(r,p,f,alpha,z){
 const x=f.x,y=f.y,size=Math.max(8,f.size||24),progress=1-alpha,color=f.color||'#fff',angle=Math.atan2(f.dy||0,f.dx||1),ux=Math.cos(angle),uy=Math.sin(angle);
 if(f.kind==='muzzle'){p.arc(x,y,size*(.22+.62*progress),angle-.82,angle+.82,color,alpha,Math.max(2,(7*alpha+2)/z));p.polygon([[x,y],[x+ux*size*.8*alpha-uy*size*.19*alpha,y+uy*size*.8*alpha+ux*size*.19*alpha],[x+ux*size*.8*alpha+uy*size*.19*alpha,y+uy*size*.8*alpha-ux*size*.19*alpha]],color,alpha*.55);}
 else if(f.kind==='elimination'){p.circle(x,y,size*(.52+.45*progress)*(.35+.65*alpha),'#fff',alpha,Math.max(2,5/z));r.text('ELIMINATED',x,y-size*.72-progress*7,Math.max(18,24/z),color,'fx-'+f.id);}
 else if(f.kind==='impact'){p.circle(x,y,size*(.24+.72*progress),progress<.24?'#fff':color,alpha,Math.max(2,(9*alpha+2)/z));const rays=/melee|dash|teleport|body|punch|smash/.test(f.style||'')?6:4;for(let i=0;i<rays;i++){const a=angle+i*Math.PI*2/rays,inner=size*(.18+.15*progress),outer=size*(.48+.42*progress);p.line(x+Math.cos(a)*inner,y+Math.sin(a)*inner,x+Math.cos(a)*outer,y+Math.sin(a)*outer,color,alpha*.92,Math.max(2,(6*alpha+1)/z));}}
 else if(f.kind==='explosion'){const skill=(f.style||'').startsWith('skill-');p.circle(x,y,size*(.4+.6*Math.min(1,progress*2.8)),color,alpha*(skill?.32:.15));p.circle(x,y,size*(.22+.78*progress),color,alpha,Math.max(2,((skill?13:8)*alpha+2)/z));p.circle(x,y,size*(.12+.52*progress),'#fff',alpha*.85,Math.max(1,(skill?6:3)/z));}
}
