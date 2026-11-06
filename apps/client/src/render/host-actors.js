// Original host body sizes, HP/name/level policy, late-game accents and capture name LOD.
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
 for(const [index,a]of view.actors.entries()){
  if(a.clone)continue;let fade=1;if(!a.alive){if(!r.deaths.has(a.id))r.deaths.set(a.id,now+750);fade=Math.max(0,(r.deaths.get(a.id)-now)/750);if(!fade)continue;}else r.deaths.delete(a.id);
  const raw=lite?(a.humanControlled?8:6)/z:a.radius,rad=raw*(a.alive?1:.45+.55*fade),color=a.team?r.paint.brTeamKillColor(a.team):({S:'#ff0033',A:'#fbbf24',B:'#3b82f6',C:'#22c55e',F:'#9ca3af'}[a.tier]||'#fff'),alpha=fade*(a.flags&32?.30:1),lastFew=!capture&&alive.length<=5&&auto&&a.alive&&!view.presentation?.gameOver,weight=r.paint.brGraphicsProfile().glow*(r.session.reducedMotion?.8:1);
  if(lastFew&&weight){const col={S:'#ff477e',A:'#facc15',B:'#60a5fa',C:'#4ade80',F:'#e2e8f0'}[a.tier]||'#fff';r.image(brGlowCanvas(col),a.x,a.y,rad*(alive.length<=3?5.4:4.3)/2,'glow-'+a.id,0,weight*(.77+.13*Math.sin(view.renderTick*.055+index)));for(let j=0;j<(alive.length<=3?2:1);j++){const angle=view.renderTick*.025+index+j*Math.PI;fg.arc(a.x,a.y,rad*1.62,angle,angle+.9,'#fff',weight*.37,2);fg.circle(a.x+Math.cos(angle)*rad*1.88,a.y+Math.sin(angle)*rad*1.88,3,'#fff',weight*.65);}}
  p.circle(a.x,a.y,rad,a.team?'#111a27':'#111111',alpha);if(!a.team)p.circle(a.x,a.y,rad,color,alpha,lite?2/z:4);
  const hit=r.session.hitStates?.get(a.id),ratio=hit?Math.max(0,(hit.until-now)/hit.duration):0;r.actorBody(r.paint.brGetEmojiSprite(a.emoji),a,a.x,a.y,rad*(lite?1.1:1),'actor-'+a.id,z,now,alpha,ratio*(hit?.squash||0));if(a.team)p.circle(a.x,a.y,rad,color,alpha,(capture?3.25:4.75)/Math.max(.05,z));
  if(!a.alive)continue;if(ratio)fg.circle(a.x,a.y,rad,'#fff',ratio*(hit.flash||.3));if(a.flags&64){p.circle(a.x,a.y,rad*(1.37+.05*Math.sin(view.renderTick*.15+index)),'#ff8a32',.82,lite?3/z:5);p.circle(a.x,a.y,rad*1.61,'#fbbf24',.38,lite?2/z:3);}
  const bw=lite?19/z:raw*2,bh=capture?Math.max(8,2/z):lite?4/z:8,y=a.y+raw+(lite?4/z:12),pct=Math.max(0,a.hp/a.maxHp);p.rect(a.x-bw/2,y,bw,bh,'#4b1620',1);p.rect(a.x-bw/2,y,bw*pct,bh,pct>.35?'#4ade80':'#fb4b63',1);
  r.level(a,a.x,a.y-raw-Math.max(58/z,auto?64:52),z,now);r.paint.brPaintReworkStatus(fg,a.x,a.y,raw,z,a.rw,a.statusTick??view.renderTick,a.maxHp);
  if(!lite||a.humanControlled){const name=lite?Array.from(a.name).slice(0,7).join(''):a.name+(a.kills>0?' [⚔️'+a.kills+']':''),size=capture?Math.max(30,10/z):lite?Math.max(10,10/z):auto?34:30,labelY=a.y-raw-(capture?10/z:lite?7/z:auto?35:25),width=Array.from(name).length*size*.72,height=size*1.15;
   if(!capture||!names.some(b=>Math.abs(a.x-b.x)<(width+b.w)/2+2/z&&Math.abs(labelY-b.y)<(height+b.h)/2+2/z)){r.text(name,a.x,labelY,size,'#fff','host-name-'+a.id,true);names.push({x:a.x,y:labelY,w:width,h:height});}}
 }
}
