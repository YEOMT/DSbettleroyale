import {Application,Container,Graphics,Sprite,Texture,Text} from 'pixi.js';
import {createPainters} from './original-painters.js';
export class Renderer{
 constructor(canvas,timeline,session){this.canvas=canvas;this.timeline=timeline;this.session=session;this.paint=createPainters(session);this.textures=new Map();this.sprites=new Map();this.labels=new Map();this.tracks=new Map();this.frameTimes=[];this.enabled=false;this.teacher=false;this.cam={x:0,y:0};this.last=performance.now();this.init();}
 async init(){
  if(new URLSearchParams(location.search).get('renderer')!=='canvas')try{this.app=new Application();await this.app.init({canvas:this.canvas,width:innerWidth,height:innerHeight,background:'#0a1424',antialias:true,resolution:Math.min(2,devicePixelRatio),autoDensity:true,autoStart:false});this.world=new Container();this.g=new Graphics();this.world.addChild(this.g);this.app.stage.addChild(this.world);this.pixi=true;}catch(error){console.warn('Canvas fallback:',error.message);this.app?.destroy();this.app=null;}
  if(!this.pixi)this.ctx=this.canvas.getContext('2d');this.resize();addEventListener('resize',()=>this.resize());requestAnimationFrame(t=>this.frame(t));
 }
 resize(){const dpr=this.session.roomMeta?.graphicsPreset==='low'?1:Math.min(2,devicePixelRatio);if(this.app)this.app.renderer.resize(innerWidth,innerHeight,dpr);else{this.canvas.width=innerWidth*dpr;this.canvas.height=innerHeight*dpr;this.dpr=dpr;}}
 glyph(emoji,x,y,r,key){const source=this.paint.brActorEmojiCanvas(emoji);if(this.pixi){let s=this.sprites.get(key);if(!s){let t=this.textures.get(source);if(!t){t=Texture.from(source);this.textures.set(source,t);}s=new Sprite(t);s.anchor.set(.5);this.sprites.set(key,s);this.world.addChild(s);}if(s._emoji!==emoji){s.texture=Texture.from(source);s._emoji=emoji;}s.visible=true;s.position.set(x,y);s.width=s.height=r*2;}else this.ctx.drawImage(source,x-r,y-r,r*2,r*2);}
 text(text,x,y,size,color,key){if(this.pixi){let label=this.labels.get(key);if(!label){label=new Text({text,style:{fontFamily:'sans-serif',fontSize:size,fill:color,stroke:{color:'#06101e',width:3},fontWeight:'bold'}});label.anchor.set(.5);this.labels.set(key,label);this.world.addChild(label);}label.text=text;label.style.fontSize=size;label.style.fill=color;label.visible=true;label.position.set(x,y);}else{const c=this.ctx;c.font=`bold ${size}px sans-serif`;c.textAlign='center';c.textBaseline='middle';c.lineWidth=3;c.strokeStyle='#06101e';c.strokeText(text,x,y);c.fillStyle=color;c.fillText(text,x,y);}}
 level(a,x,y,zoom,now){let track=this.tracks.get(a.id);if(!track){track={};this.tracks.set(a.id,track);}if(!this.pixi){this.paint.brLevelCanvasDraw(this.ctx,track,a.level,a.lifeSeq,x,y,zoom,this.teacher);return;}const pose=this.paint.brLevelPose(track,a.level,a.lifeSeq,now,true),source=this.paint.brLevelCanvas(a.level);if(!pose||!source)return;const key='level-'+a.id;let s=this.sprites.get(key);if(!s){s=new Sprite(Texture.from(source));s.anchor.set(.5);this.sprites.set(key,s);this.world.addChild(s);}s.texture=Texture.from(source);s.position.set(x,y);const k=(this.teacher?.8:1)*pose.scale/zoom;s.width=source._levelW*k;s.height=source._levelH*k;s.alpha=pose.alpha;s.visible=true;}
 frame(now){const gap=now-this.last;this.last=now;if(this.enabled&&!document.hidden){this.frameTimes.push(gap);if(this.frameTimes.length>1800)this.frameTimes.shift();const view=this.timeline.frame(now);if(view&&this.timeline.static)this.draw(view,now);}requestAnimationFrame(t=>this.frame(t));}
 draw(view,now){
  const map=this.timeline.static,self=view.actors.find(a=>a.id===view.self?.id),w=innerWidth,h=innerHeight;
  const span=map.boundary?Math.max(map.boundary.maxX-map.boundary.minX,(map.boundary.maxY-map.boundary.minY)*w/h):map.worldRadius*2.15;
  const focused=this.teacher&&this.focus?view.actors.filter(a=>a.alive).sort((a,b)=>b.kills-a.kills)[0]:null;
  const zoom=this.teacher&&!focused?Math.min(w/span,h/(map.boundary?map.boundary.maxY-map.boundary.minY:map.worldRadius*2.15)):Math.min(w,h)/(focused?2800:1600);
  if(focused)this.cam={x:focused.x,y:focused.y};else if(this.teacher)this.cam={x:0,y:0};else if(self)this.cam={x:self.x,y:self.y};
  let p;if(this.pixi){this.g.clear();for(const s of this.sprites.values())s.visible=false;for(const s of this.labels.values())s.visible=false;this.world.position.set(w/2-this.cam.x*zoom,h/2-this.cam.y*zoom);this.world.scale.set(zoom);p=this.paint.brCombatPainter(this.g,true);}
  else{const c=this.ctx;c.setTransform(this.dpr,0,0,this.dpr,0,0);c.fillStyle='#0a1424';c.fillRect(0,0,w,h);c.translate(w/2,h/2);c.scale(zoom,zoom);c.translate(-this.cam.x,-this.cam.y);p=this.paint.brCombatPainter(c,false);}
  if(map.boundary){const b=map.boundary;p.rect(b.minX,b.minY,b.maxX-b.minX,b.maxY-b.minY,'#111e30',1);}else p.circle(0,0,map.worldRadius,'#111e30',1);
  for(const s of map.smokes)this.paint.brPaintSmoke(p,s.x,s.y,s.radius,3/zoom);
  for(const wall of map.walls){const hw=wall.w/2,hh=wall.h/2,co=Math.cos(wall.angle),si=Math.sin(wall.angle);p.polygon([[-hw,-hh],[hw,-hh],[hw,hh],[-hw,hh]].map(([x,y])=>[wall.x+x*co-y*si,wall.y+x*si+y*co]),wall.kind==='rock'?'#49576a':'#33465b',1,0);}
  for(const b of view.farm?.b||[])this.paint.brPaintCrate(p,b);
  for(const drop of view.farm?.x||[])p.circle(drop[1],drop[2],drop[4]===2?21:14,drop[4]===2?'#4ade80':'#67e8f9',1);
  if(view.capture&&map.captureMap){for(const [i,z]of map.captureMap.points.entries()){const enabled=!!(view.capture.am&(1<<i)),team=view.capture.z[i][1],color=enabled?(team?this.paint.brTeamKillColor(team):'#b1c1db'):'#475569';p.circle(z.x,z.y,z.radius,color,.1);p.circle(z.x,z.y,z.radius,color,.8,5/zoom);this.text(z.id+(i===1?' ×1.5':''),z.x,z.y,25/zoom,color,'point-'+i);}}
  else if(view.ring)p.circle(view.ring.cx,view.ring.cy,view.ring.radius,'#ef4444',.9,4/zoom);
  for(const z of view.zones||[])this.paint.brPaintGround(p,z.x,z.y,z.radius,z.color,z.type,zoom,false);
  const rw=view.shots.filter(s=>!s.native&&s.kind!=='preview');let glyphId=0;
  this.paint.brPaintReworkEntities(p,rw,view.renderTick,zoom,(emoji,x,y,r)=>this.glyph(emoji,x,y,r,'rw-'+glyphId++));
  for(const shot of view.shots.filter(s=>s.native)){if(shot.emoji)this.glyph(shot.emoji,shot.x,shot.y,shot.radius,'shot-'+shot.id);else p.circle(shot.x,shot.y,shot.radius,shot.color||'#f8fafc',1);}
  for(const shot of view.shots.filter(s=>s.kind==='preview'))p.circle(shot.x,shot.y,shot.radius,'#fff',.45,2/zoom);
  for(const a of view.actors){if(!a.alive)continue;const color=a.team?this.paint.brTeamKillColor(a.team):({S:'#ff3859',A:'#facc15',B:'#60a5fa',C:'#34d399',F:'#cbd5e1'}[a.tier]);
   p.circle(a.x,a.y,a.radius,'#111827',1);this.glyph(a.emoji,a.x,a.y,a.radius,'actor-'+a.id);p.circle(a.x,a.y,a.radius,color,1,(this.teacher?2:3)/zoom);
   const hpw=a.radius*2;p.rect(a.x-a.radius,a.y+a.radius+9/zoom,hpw,5/zoom,'#522637',1);p.rect(a.x-a.radius,a.y+a.radius+9/zoom,hpw*a.hp/a.maxHp,5/zoom,'#4ade80',1);
   this.text(a.name,a.x,a.y-a.radius-14/zoom,(this.teacher?10:13)/zoom,'#fff','name-'+a.id);this.level(a,a.x,a.y-a.radius-32/zoom,zoom,now);
   this.paint.brPaintReworkStatus(p,a.x,a.y,a.radius,zoom,a.rw,view.renderTick,a.maxHp);
  }
  for(const fx of view.effects){const age=view.renderTick-fx.tick,alpha=Math.max(0,1-age/Math.max(6,(fx.geometry?.displayMs||400)*.06));const row=['',fx.kind,fx.x,fx.y,fx.dx,fx.dy,fx.size,fx.color,fx.amount,0,fx.style,0,fx.impactLevel,fx.geometry];if(!this.paint.brPaintAttack(p,row,alpha,zoom)&&fx.kind==='impact')p.circle(fx.x,fx.y,Math.max(1,fx.size||30),fx.color||'#fff',alpha*.6,3/zoom);}
  if(!this.teacher&&self&&map.captureMap){for(const z of map.captureMap.points){const dx=(z.x-self.x)*zoom,dy=(z.y-self.y)*zoom;if(Math.abs(dx)<w*.42&&Math.abs(dy)<h*.38)continue;const k=Math.min(w*.42/Math.max(1,Math.abs(dx)),h*.32/Math.max(1,Math.abs(dy))),x=self.x+dx*k/zoom,y=self.y+dy*k/zoom;this.text('➤ '+z.id,x,y,18/zoom,'#fde68a','arrow-'+z.id);}}
  for(const [id,track]of this.tracks)if(!view.actors.some(a=>a.id===id&&a.alive))this.paint.brLevelPose(track,0,0,now,false);
  if(this.pixi){this.app.render();for(const [key,s]of this.sprites)if(!s.visible&&key.startsWith('shot-')){s.destroy();this.sprites.delete(key);}}
 }
}
