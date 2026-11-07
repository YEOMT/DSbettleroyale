import {hostAssetsReady} from './host-projectile.js';
import {captureScene,captureFrameCost} from './capture-scene.js';
import {createHostCanvas} from './host-canvas.js';
import {hostEffects} from './host-effects.js';
import {screenEffects} from './screen-effects.js';
import {drawHostActors} from './host-actors.js';
import {drawRoster10Scene,clearRoster10Scene,roster10Kinds} from './roster10-scene.js';
import {createFx} from './original-fx.js';
import {effectLife} from '../presentation/effect-life.js';
import {createScene} from './original-scene.js';
import {StudentCamera} from './viewport.js';
import {AttackPoses} from './attack-pose.js';
import {HostCamera} from './camera.js';
import {manifest} from '../../../../packages/content/src/manifest.js';
import {ObjectiveArrows} from './objectives.js';
import {drawFallback} from './fallback-effects.js';
import {drawProjectile} from './projectile.js';
import {aimGuide,paintGuide} from './aim-guide.js';
import {Application,Container,Graphics,Sprite,Texture,Text} from 'pixi.js';
import {createPainters} from './original-painters.js';
export class Renderer{
 constructor(canvas,timeline,session){this.camera=new HostCamera();this.studentCamera=new StudentCamera();this.poses=new AttackPoses();this.objectives=new ObjectiveArrows();this.canvas=canvas;this.timeline=timeline;this.session=session;this.paint=createPainters(session);this.scene=createScene(session);this.hostTracks=new Map();this.hostCanvas=createHostCanvas(this);this.canvasFx=createFx(session);this.wallImages=new Map();this.deaths=new Map();this.textures=new Map();this.sprites=new Map();this.labels=new Map();this.tracks=new Map();this.frameTimes=[];this.enabled=false;this.teacher=false;this.cam={x:0,y:0};this.last=performance.now();this.ready=this.init();}
 async init(){
  await hostAssetsReady;
  if(new URLSearchParams(location.search).get('renderer')!=='canvas')try{this.app=new Application();await this.app.init({canvas:this.canvas,width:innerWidth,height:innerHeight,background:'#07101d',antialias:this.paint.brGraphicsProfile().antialias,resolution:this.scene.resolution(innerWidth,innerHeight,this.paint.brGraphicsProfile().dpr),autoDensity:true,autoStart:false});this.world=new Container();this.base=new Graphics();this.smoke=new Graphics();this.g=new Graphics();this.world.addChild(this.base,this.smoke,this.g);this.fg=new Graphics();this.world.addChild(this.fg);this.app.stage.addChild(this.world);this.screen=new Graphics();this.app.stage.addChild(this.screen);this.pixi=true;}catch(error){console.warn('Canvas fallback:',error.message);this.useCanvas(error);}
  if(this.pixi)this.canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();this.useCanvas(new Error('WEBGL_CONTEXT_LOST'));this.resize();},{once:true});
  if(!this.pixi)this.ctx=this.canvas.getContext('2d');this.resize();addEventListener('resize',()=>this.resize());visualViewport?.addEventListener('resize',()=>this.resize());requestAnimationFrame(t=>this.frame(t));
 }
 useCanvas(error){
  clearRoster10Scene(this);const old=this.canvas,fresh=old.cloneNode(false);old.replaceWith(fresh);this.canvas=fresh;this.pixi=false;
  this.poses.clear();this.studentCamera.reset();this.camera.reset();this.cameraPose=null;this.controls?.neutral();this.lastRenderError=String(error?.message||error);this.ctx=fresh.getContext('2d');
  try{this.app?.destroy(false,{children:true});}catch{/* Init may have failed before creating a renderer. */}
  this.app=null;this.world=this.base=this.smoke=this.g=this.fg=this.screen=this.worldMask=this.smokeMap=this.maskBoundary=null;for(const t of this.textures.values())if(!t.destroyed)t.destroy(true);this.sprites.clear();this.labels.clear();this.textures.clear();
 }
 resize(){this.hudInsets=null;if(!this.ctx&&!this.pixi)return;const dpr=this.scene.resolution(innerWidth,innerHeight,this.paint.brGraphicsProfile().dpr);if(this.app)this.app.renderer.resize(innerWidth,innerHeight,dpr);else{this.canvas.width=innerWidth*dpr;this.canvas.height=innerHeight*dpr;this.dpr=dpr;}}
 texture(source){let texture=this.textures.get(source);if(!texture){texture=Texture.from(source);this.textures.set(source,texture);}return texture;}
 image(source,x,y,r,key,rotation=0,alpha=1,squash=0){if(this.pixi){const texture=this.texture(source);let sprite=this.sprites.get(key);if(!sprite){sprite=new Sprite(texture);sprite.anchor.set(.5);this.sprites.set(key,sprite);this.world.addChild(sprite);}sprite.texture=texture;sprite.visible=true;sprite.position.set(x,y);sprite.width=r*2*(1+squash*.55);sprite.height=r*2*(1-squash);sprite.rotation=rotation;sprite.alpha=alpha;}else{const c=this.ctx;c.save();c.globalAlpha=alpha;c.translate(x,y);c.rotate(rotation);c.drawImage(source,-r*(1+squash*.65),-r*(1-squash),r*2*(1+squash*.65),r*2*(1-squash));c.restore();}}
 glyph(emoji,x,y,r,key,squash=0,alpha=1){this.image(this.paint.brGetEmojiSprite(emoji),x,y,r,key,0,alpha,squash);}
 actorBody(source,a,x,y,rad,key,zoom,now,alpha=1,hit=0){
  const pose=this.poses.sample(a,zoom,this.poseTick,now,this.session.reducedMotion,this.session.roomMeta?.graphicsPreset==='low');
  const squash=this.session.reducedMotion?0:hit>0?Math.max(hit,pose?.squash||0):pose?.squash||0;
  if(!this.pixi&&!pose&&!squash&&alpha===1){this.ctx.drawImage(source,x-rad,y-rad,2*rad,2*rad);return;}
  this.image(source,x+(pose?.x||0),y+(pose?.y||0),rad,key,pose?.rotation||0,alpha,squash);
 }
 hostInsets(){
  if(this.hudInsets)return this.hudInsets;
  const rect=id=>document.getElementById(id)?.getBoundingClientRect();
  const top=Math.max(32,...['hud-overlay','br-tk-host-bar','br-music-controls'].map(id=>rect(id)?.bottom||0));
  this.hudInsets={top:top+12,bottom:Math.max(28,innerHeight-(rect('br-host-live')?.top||innerHeight)+8)};
  return this.hudInsets;
 }
 reset(){this.hostLayoutActors=null;clearRoster10Scene(this);this.hostInfoSources?.clear();this.hostLayouts?.clear();this.smokeMap=null;this.base?.clear();this.smoke?.clear();this.g?.clear();this.fg?.clear();this.screen?.clear();this.actorIds?.clear();this.renderBlocked=false;this.hostNameLabels.clear();this.hostTracks.clear();this.session.capturePerf=null;this.session.captureAutoBalanced=false;this.session.captureDecorReduced=false;this.session.captureHostFPS=this.session.captureHostQuality==='balanced'?30:60;this.lastRendered=0;this.studentCamera.reset();this.poses.clear();this.cameraPose=null;this.hudInsets=null;this.drawAt=null;this.deaths.clear();this.wallImages.clear();this.camera.reset();this.cam={x:0,y:0};this.objectives.hide();this.seenFx=new Set();this.session.hitStates=new Map();this.session.sustainFeedbackAt=new Map();this.session.hitConfirm=null;this.session.killConfirm=null;this.session.studentShake=null;this.session.damageFlash=null;for(const s of this.sprites.values())s.destroy();this.sprites.clear();for(const l of this.labels.values())l.destroy();this.labels.clear();this.tracks.clear();this.hpTrails?.clear();for(const t of this.textures.values())t.destroy(true);this.textures.clear();this.session.nameSpriteCache?.clear();this.paint.BR_ACTOR_EMOJI_CACHE.clear();this.paint.BR_LEVEL_TEXTURES.clear();this.paint.brBulletSources.clear();}
 feedback(view,now){this.session.playerId=view.self?.id;this.seenFx??=new Set();for(const f of view.effects){if(!f.id||this.seenFx.has(f.id))continue;this.seenFx.add(f.id);if(f.kind==='hit')this.paint.brRegisterHitFeedback(f.targetId,f.amount,f.x,f.y,f.sourceId,f.style,true,f.impactLevel,f.geometry||{});if(f.kind==='elimination'&&f.sourceId===view.self?.id)this.session.killConfirm={until:now+240,duration:240,heavy:true,confirmed:true,elimination:true};}while(this.seenFx.size>600)this.seenFx.delete(this.seenFx.values().next().value);}
 name(a,x,y,zoom,own){const source=this.paint.brGetNameSprite(a.name,own?'#fde68a':'#f8fafc',own),width=Math.min(156,source._labelW||136)/zoom,height=28/zoom,key='name-'+a.id;if(this.pixi){this.image(source,x,y,1,key);const sprite=this.sprites.get(key);sprite.width=width;sprite.height=height;}else this.ctx.drawImage(source,x-width/2,y-height/2,width,height);}
 text(text,x,y,size,color,key,stableSize=false){if(this.pixi){let label=this.labels.get(key);if(!label){label=new Text({text,style:{fontFamily:'sans-serif',fontSize:size,fill:color,stroke:{color:'#06101e',width:3},fontWeight:'bold'}});label.anchor.set(.5);this.labels.set(key,label);this.world.addChild(label);}if(label.text!==text)label.text=text;
  // Camera zoom changes the displayed size continuously. Reuse the glyph
  // raster within 2%; position and exact displayed font size still update now.
  const ratio=size/label.style.fontSize;if(!stableSize||ratio<.98||ratio>1.02){if(label.style.fontSize!==size)label.style.fontSize=size;}label.scale.set(size/label.style.fontSize);
  if(label.style.fill!==color)label.style.fill=color;label.visible=true;label.position.set(x,y);}else{const c=this.ctx;c.font=`bold ${size}px sans-serif`;c.textAlign='center';c.textBaseline='middle';c.lineWidth=3;c.strokeStyle='#06101e';c.strokeText(text,x,y);c.fillStyle=color;c.fillText(text,x,y);}}
 level(a,x,y,zoom,now){let track=this.tracks.get(a.id);if(!track){track={};this.tracks.set(a.id,track);}if(!this.pixi){this.paint.brLevelCanvasDraw(this.ctx,track,a.level,a.lifeSeq,x,y,zoom,this.teacher);return;}const pose=this.paint.brLevelPose(track,a.level,a.lifeSeq,now,true),source=this.paint.brLevelCanvas(a.level);if(!pose||!source)return;const key='level-'+a.id,texture=this.texture(source);let s=this.sprites.get(key);if(!s){s=new Sprite(texture);s.anchor.set(.5);this.sprites.set(key,s);this.world.addChild(s);}s.texture=texture;s.position.set(x,y);const k=(this.teacher?.8:1)*pose.scale/zoom;s.width=source._levelW*k;s.height=source._levelH*k;s.alpha=pose.alpha;s.visible=true;}
 frame(now){
  const gap=now-this.last;this.last=now;
  const captureHost=this.teacher&&this.session.roomMeta?.mode==='team-capture';
  const fps=this.session.captureHostFPS||(this.session.captureHostQuality==='balanced'?30:60);
  if(this.enabled&&!this.renderBlocked&&!document.hidden&&(!captureHost||now-(this.lastRendered||0)>=1000/fps-1)){
   this.lastRendered=now;this.frameTimes.push(gap);if(this.frameTimes.length>1800)this.frameTimes.shift();
   try{
    const view=this.timeline.frame(now),map=this.timeline.static;
    if(view&&map&&(!view.capture||map.boundary)){
     const started=performance.now(),balanced=this.session.captureAutoBalanced;this.draw(view,now);
     if(this.teacher&&view.capture){captureFrameCost(this.session,performance.now()-started);if(balanced!==this.session.captureAutoBalanced)this.resize();}
    }
   }catch(error){
    if(this.pixi){try{this.useCanvas(error);this.resize();}catch(fallbackError){this.reportFault(fallbackError);}}
    else this.reportFault(error);
   }
  }
  requestAnimationFrame(t=>this.frame(t));
 }
 reportFault(error){
  this.renderBlocked=true;this.lastRenderError=error?.name||'RENDER_ERROR';
  document.dispatchEvent(new Event('dsbr-render-fault'));
 }
 draw(view,now){
  this.hostLayouts?.clear();this.hostLayoutActors=this.teacher?view.actors:null;this.feedback(view,now);const map=this.timeline.static,self=view.actors.find(a=>a.id===view.self?.id),w=innerWidth,h=innerHeight;
  const dt=Math.max(0,now-(this.drawAt??now-1000/60));this.drawAt=now;this.poseTick=view.renderTick;
  const pose=this.teacher?this.camera.update(view,map,w,h,!!this.focus,dt,this.hostInsets()):this.studentCamera.update(self,this.controls?.lastMove,w,h,dt);
  const zoom=pose.zoom;this.cam={x:pose.x,y:pose.y};this.cameraPose=pose;
  if(this.teacher&&!view.capture&&pose.lod!=='performance'&&!this.session.reducedMotion){const e=view.hostEffects||{};this.cam.x-=(Math.random()-.5)*(e.shakeAmount||0)+(e.cameraKick?.x||0);this.cam.y-=(Math.random()-.5)*(e.shakeAmount||0)+(e.cameraKick?.y||0);}
  const aiming=this.controls?.gestures.size||this.controls?.mousePoint;
  const shake=this.session.studentShake,ratio=shake&&!aiming&&!this.session.reducedMotion?Math.max(0,(shake.until-now)/shake.duration):0;if(ratio){this.cam.x-=Math.sin(now*.17+shake.seed)*shake.strength*ratio/zoom;this.cam.y-=Math.sin(now*.23+shake.seed*1.7)*shake.strength*.55*ratio/zoom;}
  let p;if(this.pixi){this.base.clear();this.g.clear();this.fg.clear();for(const s of this.sprites.values())s.visible=false;for(const s of this.labels.values())s.visible=false;this.world.position.set(pose.screenX-this.cam.x*zoom,pose.screenY-this.cam.y*zoom);this.world.scale.set(zoom);p=this.paint.brCombatPainter(this.g,true);}
  else{const c=this.ctx;c.setTransform(this.dpr,0,0,this.dpr,0,0);c.fillStyle=this.teacher?'#101a30':'#07101d';c.fillRect(0,0,w,h);c.translate(pose.screenX,pose.screenY);c.scale(zoom,zoom);c.translate(-this.cam.x,-this.cam.y);p=this.paint.brCombatPainter(c,false);}
  if(this.pixi){this.app.renderer.background.color=this.teacher?'#101a30':'#07101d';if(map.boundary){this.worldMask??=new Graphics();if(!this.worldMask.parent)this.world.addChild(this.worldMask);const b=map.boundary;if(this.maskBoundary!==b){this.worldMask.clear().rect(b.minX,b.minY,b.maxX-b.minX,b.maxY-b.minY).fill(0xffffff);this.maskBoundary=b;}this.world.mask=this.worldMask;}else this.world.mask=null;}else{this.ctx.save();if(map.boundary){const b=map.boundary;this.ctx.beginPath();this.ctx.rect(b.minX,b.minY,b.maxX-b.minX,b.maxY-b.minY);this.ctx.clip();}else if(!this.teacher){this.ctx.beginPath();this.ctx.arc(0,0,map.worldRadius,0,Math.PI*2);this.ctx.clip();}}
  const foreground=this.pixi?this.paint.brCombatPainter(this.fg,true):p;
  const base=this.pixi?this.paint.brCombatPainter(this.base,true):p;
  if(map.boundary){const b=map.boundary;base.rect(b.minX,b.minY,b.maxX-b.minX,b.maxY-b.minY,this.teacher?'#142437':'#17233a',1);}else base.circle(0,0,map.worldRadius,this.teacher?'#1e293b':'#17233a',1);
  const halfW=w/zoom/2+220,halfH=h/zoom/2+220,grid=view.capture&&this.teacher?240:this.teacher?(pose.lod==='performance'?400:200):160;if(!(this.teacher&&view.capture&&!this.pixi)){for(let x=Math.floor((this.cam.x-halfW)/grid)*grid;x<this.cam.x+halfW;x+=grid)base.line(x,this.cam.y-halfH,x,this.cam.y+halfH,'#6b8bb8',.15,1);for(let y=Math.floor((this.cam.y-halfH)/grid)*grid;y<this.cam.y+halfH;y+=grid)base.line(this.cam.x-halfW,y,this.cam.x+halfW,y,'#6b8bb8',.15,1);
  }
  if(this.pixi){if(this.smokeMap!==map){this.smokeMap=map;this.smoke.clear();const painter=this.paint.brCombatPainter(this.smoke,true);for(const s of map.smokes)this.paint.brPaintSmoke(painter,s.x,s.y,s.radius,3);}}
  else for(const s of map.smokes)this.paint.brPaintSmoke(p,s.x,s.y,s.radius,3);
  if(!view.capture&&view.ring){const ring=view.ring;if(this.pixi&&ring.radius<map.worldRadius)this.g.circle(ring.cx,ring.cy,map.worldRadius).fill({color:0xc02648,alpha:.28}).circle(ring.cx,ring.cy,Math.max(0,ring.radius)).cut();else if(!this.pixi)this.scene.dangerFill(this.ctx,ring.cx,ring.cy,ring.radius,map.worldRadius);}
  for(const [i,wall]of map.walls.entries()){const angle=view.movingWalls?.find(r=>r[0]===i)?.[1]??wall.angle;if(!this.pixi){if(this.teacher)this.scene.hostWall(this.ctx,{...wall,angle});else this.scene.wall(this.ctx,[wall.x,wall.y,wall.w,wall.h,angle,wall.kind]);}else{const key=[wall.kind,wall.w,wall.h].join(':');let source=this.wallImages.get(key);if(!source){source=document.createElement('canvas');source.width=Math.ceil(wall.w+8);source.height=Math.ceil(wall.h+8);const c=source.getContext('2d');c.translate(source.width/2,source.height/2);this.scene.wall(c,[0,0,wall.w,wall.h,0,wall.kind]);this.wallImages.set(key,source);}this.image(source,wall.x,wall.y,1,'wall-'+i,angle);const sprite=this.sprites.get('wall-'+i);sprite.width=source.width;sprite.height=source.height;}}

  for(const b of view.farm?.b||[])this.paint.brPaintCrate(p,b);
  for(const d of view.farm?.x||[]){const heal=d[4]===2,radius=heal?28:d[4]?26:20,x=d[1],y=d[2];if(heal){p.circle(x,y,radius,'#dcfce7',1);p.circle(x,y,radius,'#22c55e',1,2);p.rect(x-4,y-13,8,26,'#16a34a',1);p.rect(x-13,y-4,26,8,'#16a34a',1);}else{const points=[[x,y-radius],[x+radius,y],[x,y+radius],[x-radius,y]];p.polygon(points,d[4]?'#c4b5fd':'#67e8f9',1);p.polygon(points,'#ecfeff',1,2);}if(zoom>.20)this.text(heal?'HP 20%':'XP ×'+d[3],x,y+radius+15,17,heal?'#bbf7d0':'#ecfeff','drop-'+d[0]);}
  const supply=view.farm?.s;if(supply){p.circle(supply[0],supply[1],52,'#164e63',1);p[supply[2]?'circle':'dashedCircle'](supply[0],supply[1],52,'#67e8f9',1,4);if(zoom>.20){this.text(supply[2]?'📦':'↓',supply[0],supply[1],36,'#164e63','supply');this.text('SUPPLY +2 XP',supply[0],supply[1]+73,19,'#cffafe','supply-label');}}

  if(view.capture&&map.captureMap)captureScene(this,view,map,zoom);

  for(const z of view.zones||[])this.paint.brPaintGround(p,z.x,z.y,z.radius,z.color,z.type,zoom,false,z.meta);
  for(const [i,t]of (view.turrets||[]).entries()){if(this.pixi&&this.teacher){p.circle(t.x,t.y,23,t.golden?'#fbbf24':'#64748b',1);p.circle(t.x,t.y,24,'#fff',1,2);}else{const radius=Math.max(15,5/zoom);p.rect(t.x-radius*.8,t.y+radius*.45,radius*1.6,radius*.38,t.golden?'#fbbf24':'#94a3b8',1);this.glyph(t.emoji||'🗼',t.x,t.y,radius,'turret-'+i);}}
  if(this.teacher&&!this.pixi&&pose.lod!=='performance'&&!view.capture)hostEffects(this.ctx,view.hostEffects,'ground');
  drawRoster10Scene(this,p,view,zoom);
  const rw=view.shots.filter(s=>!s.native&&!roster10Kinds.has(s.kind));
  this.paint.brPaintReworkEntities(p,rw,view.renderTick,zoom,(emoji,x,y,diameter,id)=>this.glyph(emoji,x,y,diameter/2,'rw-'+id));
  for(const shot of view.shots.filter(s=>s.native))drawProjectile(this,p,shot,zoom);
  this.aimGuide=null;
  if(!this.teacher&&self?.alive&&this.controls?.enabled){
   const logical=this.timeline.predicted,c=this.controls;
   const show=(kind,raw,power,tap)=>{
    if(logical.stunned>0||logical.rw?.locks?.[kind])return;
    const aim=c.assist.resolve(kind,raw,power,tap).aim;
    const guide=aimGuide(logical,kind,{aim,power},map,this.timeline.kernel,this.timeline.collisionWalls(view),view.actors,view.shots);
    if(guide){this.aimGuide=guide;paintGuide(foreground,logical,guide,zoom);}
   };
   for(const [kind,g] of c.gestures)show(kind,c.gestureAim(kind,g),g.power,kind==='attack'&&!g.moved&&now-g.at<=220);
   if(!c.gestures.size&&c.mousePoint){const mouse=c.cursorAim();if(mouse)show('skill',mouse.direction,c.cursorPower(logical.aimProfiles?.skill,mouse),false);}
  }
  if(!this.teacher&&self?.alive){const speed=Math.hypot(self.vx||0,self.vy||0);if(speed>3.2){const ux=self.vx/speed,uy=self.vy/speed;for(let i=0;i<3;i++){const side=(i-1)*42/zoom,phase=((now*.12+i*29)%52)/zoom,x=self.x-ux*(58/zoom+phase)-uy*side,y=self.y-uy*(58/zoom+phase)+ux*side;p.line(x,y,x-ux*(24+i*3)/zoom,y-uy*(24+i*3)/zoom,'#bfdbfe',Math.min(.42,(speed-3)*.065),Math.max(1.5,2.2/zoom),'round');}}}
  if(this.teacher){if(this.pixi)drawHostActors(this,p,foreground,view,pose,now);else this.hostCanvas(view,pose,now);}
  for(const a of (this.teacher?[]:view.actors)){let death=1;if(!a.alive){if(!this.deaths.has(a.id))this.deaths.set(a.id,now+750);death=Math.max(0,(this.deaths.get(a.id)-now)/750);if(death<=0)continue;}else this.deaths.delete(a.id);const color=a.team?this.paint.brTeamKillColor(a.team):({S:'#ff3859',A:'#facc15',B:'#60a5fa',C:'#34d399',F:'#cbd5e1'}[a.tier]);
   const hit=this.session.hitStates?.get(a.id),hitRatio=hit?Math.max(0,(hit.until-now)/hit.duration):0;if(hit&&!hitRatio)this.session.hitStates.delete(a.id);const own=a.id===self?.id&&!this.teacher,scale=a.alive?1:.42+.58*death,rad=a.radius*scale;
   if(own&&a.alive&&!a.team)p.dashedCircle(a.x,a.y,Math.max(rad*1.4,26/zoom),'#fde047',.7,2/zoom);
   p.circle(a.x,a.y,a.team?rad:rad-1.5,'#060c18',(a.team?.82:.78)*death);
   if(!a.team)p.circle(a.x,a.y,rad-1.5,own?'#fde047':color,death,own?6:3);
   if(a.alive&&a.flags&64)p.circle(a.x,a.y,rad*(1.42+.05*Math.sin(now*.01)),'#ff8a32',.84,Math.max(3,5/zoom));
   if(a.alive&&a.flags&24)p.circle(a.x,a.y,rad*1.36,a.flags&16?'#fbbf24':'#67e8f9',.78,Math.max(2,4/zoom));
   if(this.session.roomMeta?.graphicsPreset!=='low'&&!a.team)p.circle(a.x,a.y,rad*1.04,'#fff',own?.42:.24,Math.max(.7/zoom,1.1));
   this.actorBody(this.paint.brGetEmojiSprite(a.emoji),a,a.x,a.y,rad,'actor-'+a.id,zoom,now,(a.flags&32?.42:1)*death,hitRatio*(hit?.squash||0));
   if(a.team)p.circle(a.x,a.y,rad,color,death,(this.teacher?3.25:4.75)/Math.max(.05,zoom));if(own&&a.team&&a.alive)p.circle(a.x,a.y,rad+9/zoom,'#fde047',1,1.5/zoom);
   if(!a.alive)continue;if(hitRatio)foreground.circle(a.x,a.y,rad*1.08,'#fff',hitRatio*hit.flash);
   const hpw=Math.max(a.radius*1.65,64/zoom),hpKey=a.id+':'+a.lifeSeq;this.hpTrails??=new Map();let hp=this.hpTrails.get(hpKey);if(!hp)hp={value:a.hp,at:now,hold:now};if(hp.current>a.hp)hp.hold=now+250;if(now>hp.hold)hp.value+=(a.hp-hp.value)*(1-Math.exp(-(now-hp.at)/430));hp.current=a.hp;hp.at=now;hp.value=Math.max(a.hp,hp.value);this.hpTrails.set(hpKey,hp);p.rect(a.x-hpw/2,a.y+a.radius+15/zoom,hpw,8/zoom,'#1f2937',1);p.rect(a.x-hpw/2,a.y+a.radius+15/zoom,hpw*hp.value/a.maxHp,8/zoom,'#ef4444',1);p.rect(a.x-hpw/2,a.y+a.radius+15/zoom,hpw*a.hp/a.maxHp,8/zoom,a.hp/a.maxHp>.35?'#34d399':'#fb4b63',1);
   this.name(a,a.x,a.y-a.radius-26/zoom,zoom,a.id===self?.id);this.level(a,a.x,a.y-a.radius-(a.stunned||a.rw?.capture?70:52)/zoom,zoom,now);
   this.paint.brPaintReworkStatus(p,a.x,a.y,a.radius,zoom,a.rw,a.statusTick??view.renderTick,a.maxHp);
  }
  for(const fx of view.effects){const age=view.renderTick-(fx.displayTick??fx.tick),alpha=Math.max(0,1-age/Math.max(6,effectLife(fx)*.06));const row=['',fx.kind,fx.x,fx.y,fx.dx,fx.dy,fx.size,fx.color,fx.amount,0,fx.style,0,fx.impactLevel,fx.geometry];if(!this.paint.brPaintAttack(foreground,row,alpha,zoom)){if(this.pixi)drawFallback(this,foreground,fx,alpha,zoom);else this.canvasFx(this.ctx,row,age/0.06,effectLife(fx),zoom);}}
  if(this.teacher&&!this.pixi&&pose.lod!=='performance'&&!view.capture)hostEffects(this.ctx,view.hostEffects,'over');
  if(!view.capture&&view.ring){const ring={...view.ring,calibrated:true,running:!this.timeline.paused,stale:now-(this.timeline.samples.at(-1)?.at||now)>750};this.scene.boundary(foreground,ring,zoom);this.scene.preview(foreground,ring,zoom);if(self&&!this.teacher){const displaySelf={...self,row:{7:self.alive}};this.scene.self(foreground,displaySelf,ring,zoom);this.scene.ringHud(displaySelf,{_ring:ring},now);}}
  if(!this.teacher&&self?.alive)this.objectives.draw(map.captureMap,view.capture,this.cam,w,h,zoom,this.paint.brTeamKillColor);else this.objectives.hide();
  const ids=this.actorIds??=new Set();ids.clear();for(const a of view.actors)ids.add(a.id);
  for(const map of [this.tracks,this.deaths,this.hostTracks])for(const id of map.keys())if(!ids.has(id))map.delete(id);
  if(this.pixi){for(const [key,s]of this.sprites){const prefix=['actor-','name-','level-','glow-','host-info-name-'].find(p=>key.startsWith(p));if(prefix&&!ids.has(key.slice(prefix.length))){s.destroy();this.sprites.delete(key);}}
   for(const [key,l]of this.labels)if(key.startsWith('host-name-')&&!ids.has(key.slice(10))){l.destroy();this.labels.delete(key);}}
  for(const [id,entry]of this.hostInfoSources||[])if(!ids.has(id)){const t=this.textures.get(entry.source);if(t){t.destroy(true);this.textures.delete(entry.source);}this.hostInfoSources.delete(id);}
  for(const key of this.hpTrails?.keys()||[])if(!view.actors.some(a=>key===a.id+':'+a.lifeSeq))this.hpTrails.delete(key);
  for(const [id,track]of this.tracks)if(!view.actors.some(a=>a.id===id&&a.alive))this.paint.brLevelPose(track,0,0,now,false);
  const hit=this.session.killConfirm||this.session.hitConfirm;if(hit&&now<hit.until){const ratio=Math.min(1,(hit.until-now)/hit.duration),r=(hit.heavy?19:14)*(1+(1-ratio)*.35)/zoom,col=hit.elimination?'#fb7185':hit.heavy?'#fde047':'#fff';for(let i=0;i<4;i++){const a=Math.PI/4+i*Math.PI/2;foreground.line(this.cam.x+Math.cos(a)*r*.42,this.cam.y+Math.sin(a)*r*.42,this.cam.x+Math.cos(a)*r,this.cam.y+Math.sin(a)*r,col,Math.min(1,ratio*1.7),(hit.heavy?4:3)/zoom,'round');}if(hit.elimination)this.text('K.O.',this.cam.x,this.cam.y+32/zoom,18/zoom,'#ffe4e6','ko');}
  if(!this.pixi)this.ctx.restore();if(view.capture&&map.boundary){const b=map.boundary;foreground.rect(b.minX,b.minY,b.maxX-b.minX,b.maxY-b.minY,'#b1c3d2',this.pixi?.7:1,12);}
  screenEffects(this,view,pose,self,w,h,now);
  if(this.pixi){this.world.setChildIndex(this.fg,this.world.children.length-1);this.app.render();for(const [key,l]of this.labels)if(!l.visible&&(key.startsWith('fx-')||key.startsWith('drop-'))){l.destroy();this.labels.delete(key);}for(const [key,s]of this.sprites)if(!s.visible&&(key.startsWith('shot-')||key.startsWith('rw-'))){s.destroy();this.sprites.delete(key);}}
 }
}
