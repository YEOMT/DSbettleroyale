// Host-only readable bodies and tightly grouped info; combat coordinates stay intact.
import {hostDisplayRadius,hostInk,drawHostInfo} from './host-layout.js';
const BR_GLOW_TEXTURE_CACHE=new Map();
function brGlowCanvas(color){
            let canvas=BR_GLOW_TEXTURE_CACHE.get(color);if(canvas)return canvas;
            canvas=document.createElement('canvas');canvas.width=canvas.height=128;
            const ctx=canvas.getContext('2d'),gradient=ctx.createRadialGradient(64,64,8,64,64,64);
            gradient.addColorStop(0,color+'48');gradient.addColorStop(.42,color+'24');gradient.addColorStop(1,color+'00');
            ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);BR_GLOW_TEXTURE_CACHE.set(color,canvas);return canvas;
        }
export function drawHostActors(r,p,fg,view,pose,now){
 const z=pose.zoom,lite=pose.lod==='performance',auto=pose.lod==='broadcast',capture=!!view.capture,alive=view.actors.filter(a=>a.alive&&!a.clone),names=[];
 // Pixi chooses circle tessellation from the submitted radius. An overview
 // body can span hundreds of world units but only 12 screen pixels. Build at
 // device-pixel scale, then restore its exact world position and stroke width.
 const detail=Math.min(1,z*r.app.renderer.resolution);
 const bodyCircle=(x,y,radius,color,alpha,width=0)=>{
  const g=r.g.save().scaleTransform(1/detail).circle(x*detail,y*detail,radius*detail);
  // Adjacent segments of this closed, convex circle are nearly collinear.
  // A miter keeps a continuous border without a round fan at each vertex.
  if(width)g.stroke({color,alpha,width,join:'miter'});else g.fill({color,alpha});
  g.restore();
 };
 for(const [index,a]of view.actors.entries()){
  if(a.clone)continue;let fade=1;if(!a.alive){if(!r.deaths.has(a.id))r.deaths.set(a.id,now+750);fade=Math.max(0,(r.deaths.get(a.id)-now)/750);if(!fade)continue;}else r.deaths.delete(a.id);
  const raw=hostDisplayRadius(a.radius,z,innerWidth,innerHeight),rad=raw*(a.alive?1:.45+.55*fade),color=a.team?r.paint.brTeamKillColor(a.team):({S:'#ff0033',A:'#fbbf24',B:'#3b82f6',C:'#22c55e',F:'#9ca3af'}[a.tier]||'#fff'),alpha=fade*(a.flags&32?.30:1),lastFew=!capture&&alive.length<=5&&auto&&a.alive&&!view.presentation?.gameOver,weight=r.paint.brGraphicsProfile().glow*(r.session.reducedMotion?.8:1);
  if(lastFew&&weight){const col={S:'#ff477e',A:'#facc15',B:'#60a5fa',C:'#4ade80',F:'#e2e8f0'}[a.tier]||'#fff';r.image(brGlowCanvas(col),a.x,a.y,rad*(alive.length<=3?5.4:4.3)/2,'glow-'+a.id,0,weight*(.77+.13*Math.sin(view.renderTick*.055+index)));for(let j=0;j<(alive.length<=3?2:1);j++){const angle=view.renderTick*.025+index+j*Math.PI;fg.arc(a.x,a.y,rad*1.62,angle,angle+.9,'#fff',weight*.37,2);fg.circle(a.x+Math.cos(angle)*rad*1.88,a.y+Math.sin(angle)*rad*1.88,3,'#fff',weight*.65);}}
  bodyCircle(a.x,a.y,rad,a.team?'#111a27':'#111111',alpha);if(!a.team)bodyCircle(a.x,a.y,rad,color,alpha,lite?2/z:4);
  const hit=r.session.hitStates?.get(a.id),ratio=hit?Math.max(0,(hit.until-now)/hit.duration):0;r.actorBody(hostInk(r.paint.brGetEmojiSprite(a.emoji),true),a,a.x,a.y,rad,'actor-'+a.id,z,now,alpha,ratio*(hit?.squash||0));if(a.team)bodyCircle(a.x,a.y,rad,color,alpha,(capture?3.25:4.75)/Math.max(.05,z));
  if(!a.alive)continue;if(ratio)fg.circle(a.x,a.y,rad,'#fff',ratio*(hit.flash||.3));if(a.flags&64){p.circle(a.x,a.y,rad*(1.37+.05*Math.sin(view.renderTick*.15+index)),'#ff8a32',.82,lite?3/z:5);p.circle(a.x,a.y,rad*1.61,'#fbbf24',.38,lite?2/z:3);}
  drawHostInfo(r,fg,a,raw,z,now,view.renderTick,names,lite);
 }
}
