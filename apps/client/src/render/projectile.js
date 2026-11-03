// v32.1 brDrawProjectileGlyph geometry with the same cached sources for Pixi.
export function drawProjectile(renderer,p,q,zoom){
 const paint=renderer.paint,size=paint.brStudentProjectileVisualSize(q.radius),detail=renderer.session.roomMeta.graphicsPreset!=='low',alpha=q.preview?.85:1,style=q.style||'skill',color=q.trailColor||q.color||'#fff',emphasis=q.actionKind==='skill';
 if(!renderer.pixi){paint.brDrawProjectileGlyph(renderer.ctx,q.x,q.y,q.dx,q.dy,size,q.emoji,color,style,zoom,alpha,q.rotation||0,detail,emphasis);return;}
 const z=Math.max(.18,zoom),speed=Math.hypot(q.dx,q.dy)||1,ux=q.dx/speed,uy=q.dy/speed,r=Math.max(3/z,size),tail=Math.min(['sniper','skill-sniper'].includes(style)?100:62,Math.max(speed*3.2,speed>=14?18/z:0))*(detail?1:.6);
 p.line(q.x-ux*tail,q.y-uy*tail,q.x,q.y,color,alpha*.52,Math.max(1.2/z,r*.50),'round');
 if(detail&&['sniper','heavy'].includes(style))p.line(q.x-ux*tail,q.y-uy*tail,q.x,q.y,'#fff',alpha*(style==='sniper'?.78:.52),Math.max(.7/z,r*.14),'round');
 if(emphasis)p.circle(q.x,q.y,r*1.42,'#fff',alpha*.72,Math.max(.8/z,r*.13));else if(detail&&['bomber','heavy'].includes(style))p.circle(q.x,q.y,r*1.30,style==='bomber'?'#fde68a':'#fff',alpha*.56,Math.max(.7/z,r*.12));
 renderer.image(q.emoji?paint.brGetEmojiSprite(q.emoji):paint.brBulletCanvas(style,color),q.x,q.y,q.emoji?Math.max(r,3.5/z)*1.33:r*32/30,'shot-'+q.id,q.emoji?q.rotation||0:Math.atan2(q.dy,q.dx),alpha);
}
