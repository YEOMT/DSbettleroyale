import {poseFamily} from '../render/attack-pose.js';
import {screenToWorld} from '../render/viewport.js';
import {AimAssist} from './aim.js';
const tickMs=1000/60;
const movementKeys=new Set(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright']);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export class Controls{
 constructor(net,timeline){this.net=net;this.timeline=timeline;this.assist=new AimAssist(timeline);this.move={x:0,y:0};this.aim={x:1,y:0};this.lastDirection={...this.aim};this.keys=new Set();this.actions={attack:0,skill:0};this.sounds=new Map();this.seq=0;this.clientTick=0;this.batch=[];this.enabled=false;this.gestures=new Map();this.lastFire={};this.bind();this.timer=setInterval(()=>this.tick(),tickMs);}
 bind(){
  addEventListener('keydown',e=>{if(!this.enabled||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;if([' ','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))e.preventDefault();if(movementKeys.has(e.key.toLowerCase())&&!this.keys.has(e.key.toLowerCase())){this.keys.add(e.key.toLowerCase());this.mousePoint=null;const direction=this.rememberMove();if(!this.gestures.size)this.aim=direction;this.tick(true);}if(!e.repeat){if(e.code==='Space'||e.key==='Enter')this.fire('attack',{tap:true});if(['q','e','shift'].includes(e.key.toLowerCase()))this.fire('skill');}});
  addEventListener('focusin',e=>{if(/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))this.neutral();});
  addEventListener('keyup',e=>{if(this.keys.delete(e.key.toLowerCase())){this.rememberMove();this.tick(true);}});addEventListener('blur',()=>this.neutral());document.addEventListener('visibilitychange',()=>{if(document.hidden)this.neutral();});
  const stick=document.getElementById('br-joystick'),knob=document.getElementById('br-joystick-knob');this.stick=stick;this.stickKnob=knob;this.pointer=null;
  const move=e=>{if(e.pointerId!==this.pointer)return;const r=stick.getBoundingClientRect(),x=(e.clientX-r.left-r.width/2)/(r.width*.31),y=(e.clientY-r.top-r.height/2)/(r.height*.31),length=Math.max(1,Math.hypot(x,y));this.move={x:x/length,y:y/length};this.mousePoint=null;this.rememberMove();this.tick(true);knob.style.transform=`translate(${this.move.x*r.width*.31}px,${this.move.y*r.height*.31}px)`;};
  stick.addEventListener('pointerdown',e=>{if(!this.enabled||this.pointer!==null||e.button>0)return;this.pointer=e.pointerId;try{stick.setPointerCapture(e.pointerId);}catch{this.pointer=null;return;}move(e);e.preventDefault();});stick.addEventListener('pointermove',move);
  for(const type of ['pointerup','pointercancel','lostpointercapture'])stick.addEventListener(type,e=>{if(e.pointerId===this.pointer){this.pointer=null;this.move={x:0,y:0};this.tick(true);knob.style.transform='';}});
  for(const kind of ['attack','skill']){const el=document.getElementById('br-'+kind),knob=el.querySelector('.br-aim-knob');
   const update=e=>{const g=this.gestures.get(kind);if(!g||g.id!==e.pointerId)return;const x=e.clientX-g.x,y=e.clientY-g.y,n=Math.hypot(x,y),extent=Math.max(el.clientWidth,el.clientHeight),train=kind==='skill'&&this.timeline.predicted?.abilityId==='emoji-019';if(n>10){g.aim={x:x/n,y:y/n};g.moved=true;}g.power=train?(g.moved?.18+.82*clamp((n-10)/Math.max(1,extent*.92-10),0,1):this.assist.trainPower(220,(this.timeline.predicted?.aimProfiles?.skill?.range||1480)/1480)):g.moved?clamp(n/(extent*.92),.18,1):1;if(knob)knob.style.transform=`translate(${g.aim.x*Math.min(extent*.56,n)}px,${g.aim.y*Math.min(extent*.56,n)}px)`;};
   const clear=e=>{const g=this.gestures.get(kind);if(!g||g.id!==e.pointerId)return;this.gestures.delete(kind);el.classList.remove('aiming');if(knob)knob.style.transform='';};
   el.addEventListener('pointerdown',e=>{if(!this.enabled||e.button>0||this.gestures.has(kind))return;e.preventDefault();try{el.setPointerCapture(e.pointerId);}catch{return;}const initial=kind==='attack'?this.rememberMove():this.aim;this.mousePoint=null;this.gestures.set(kind,{x:e.clientX,y:e.clientY,id:e.pointerId,aim:{...initial},power:1,moved:false,at:performance.now()});el.classList.add('aiming');update(e);});
   el.addEventListener('pointermove',update);el.addEventListener('pointerup',e=>{const g=this.gestures.get(kind);if(!g||g.id!==e.pointerId)return;update(e);this.fire(kind,{aim:this.gestureAim(kind,g),power:g.power,tap:kind==='attack'&&!g.moved&&performance.now()-g.at<=220});clear(e);});for(const type of ['pointercancel','lostpointercapture'])el.addEventListener(type,e=>{if(this.gestures.get(kind)?.id===e.pointerId){clear(e);this.aim=this.lastDirection;}});
   el.addEventListener('contextmenu',e=>e.preventDefault());
  }
  addEventListener('pointermove',e=>{
   if(e.pointerType!=='mouse'||e.sourceCapabilities?.firesTouchEvents||!this.enabled||this.gestures.size||this.pointer!==null)return;
   if(e.target!==this.renderer?.canvas){if(this.mousePoint)this.aim=this.lastDirection;this.mousePoint=null;return;}
   this.mousePoint={x:e.clientX,y:e.clientY,canvas:e.target};
   const mouse=this.cursorAim();if(mouse)this.aim=mouse.direction;
  });
  addEventListener('pointerout',e=>{if(e.target===this.renderer?.canvas&&e.pointerType==='mouse'){this.mousePoint=null;this.aim=this.lastDirection;}});
 }
 movement(){
  let {x,y}=this.move;
  if(this.keys.size){
   x=Number(this.keys.has('d')||this.keys.has('arrowright'))-Number(this.keys.has('a')||this.keys.has('arrowleft'));
   y=Number(this.keys.has('s')||this.keys.has('arrowdown'))-Number(this.keys.has('w')||this.keys.has('arrowup'));
  }
  const n=Math.max(1,Math.hypot(x,y));return {x:x/n,y:y/n};
 }
 rememberMove(move=this.movement()){
  const length=Math.hypot(move.x,move.y);if(length>.05)this.lastDirection={x:move.x/length,y:move.y/length};
  return this.lastDirection;
 }
 gestureAim(kind,g){return g.moved||kind==='skill'?g.aim:this.rememberMove();}
 cursorAim(){
  const point=this.mousePoint,r=this.renderer,self=this.timeline.predicted;
  if(!point||point.canvas!==r?.canvas||!self)return null;
  const world=screenToWorld(point.x,point.y,r.canvas.getBoundingClientRect(),r.cameraPose,innerWidth,innerHeight);
  if(!world)return null;
  const x=world.x-self.x,y=world.y-self.y,distance=Math.hypot(x,y);
  return distance>4?{direction:{x:x/distance,y:y/distance},distance}:null;
 }
 cursorPower(profile,mouse){
  return mouse&&profile&&profile.range>profile.rangeMin? .18+.82*clamp((mouse.distance-profile.rangeMin)/(profile.range-profile.rangeMin),0,1):1;
 }
 fire(kind,{aim,power,tap=false}={}){
  const self=this.timeline.predicted;if(!this.enabled||this.net.restoring||!self?.alive||self.stunned>0||self.rw?.locks?.[kind])return;
  const gesture=this.gestures.get(kind),mouse=!aim&&!gesture?this.cursorAim():null;
  aim??=gesture?this.gestureAim(kind,gesture):mouse?.direction||(kind==='attack'?this.rememberMove():this.aim);
  const profile=self.aimProfiles?.[kind];power??=gesture?.power??this.cursorPower(profile,mouse);
  const cooldown=kind==='attack'?self.basicCooldown:self.cooldown,now=performance.now();if((cooldown>0&&!(kind==='skill'&&self.rw?.recast))||now-(this.lastFire[kind]??-Infinity)<100)return;
  this.aim=aim;const helped=this.assist.resolve(kind,aim,power,tap);this.lastFire[kind]=now;const seq=++this.actions[kind];this.timeline.preview(kind,seq,helped.aim,power);this.sounds.set(kind,{life:self.lifeSeq,seq,expires:now+2200,onShot:kind==='skill'&&poseFamily(self.abilityId,kind)==='recoil',sound:kind==='skill'?'skill':self.visualProfiles?.attack?.close?'melee':'shoot',weight:['heavy','recoil'].includes(poseFamily(self.abilityId,kind))?3:poseFamily(self.abilityId,kind)==='quick'?1:2});const sent=this.lastAction={kind,seq,life:self.lifeSeq,epoch:this.net.scope.connectionEpoch,state:'sent'};
  this.net.command('ACTION',{kind,seq,...helped,aimPower:power,castId:kind==='skill'?self.rw?.recast?.id||'':''}).then(()=>{sent.state='queued';}).catch(error=>{
   sent.state='rejected';sent.reason=error.message;if(this.sounds.get(kind)?.seq===seq)this.sounds.delete(kind);
   if(sent.life===this.net.lifeSeq&&sent.epoch===this.net.scope.connectionEpoch)this.timeline.cancelPreview(kind,seq);
  });
 }
 confirmShot(e){
  if(e.type!=='SHOT_SPAWN')return;
  const d=e.data,p=this.sounds.get(d.actionKind);
  if(!p?.onShot||d.owner!==this.timeline.predicted?.id||p.seq!==d.actionSeq||p.life!==d.life)return;
  this.sounds.delete(d.actionKind);
  if(!document.hidden&&performance.now()<p.expires)this.audio?.action(p.sound,p.weight);
 }
 confirmSounds(self){
  for(const [kind,pending] of this.sounds){
   const fired=self.actions?.[kind==='attack'?'firedAttack':'firedSkill'];
   if(self.alive&&self.lifeSeq===pending.life&&performance.now()<pending.expires&&
    ((self.actions?.[kind]||0)<pending.seq||pending.onShot&&fired===pending.seq))continue;
   this.sounds.delete(kind);
   if(!pending.onShot&&self.alive&&self.lifeSeq===pending.life&&!document.hidden&&fired===pending.seq)this.audio?.action(pending.sound,pending.weight);
  }
 }
 clearBlockedGestures(self){
  for(const [kind,g] of this.gestures){
   if(self.alive&&!self.stunned&&!self.rw?.locks?.[kind])continue;
   const el=document.getElementById('br-'+kind);
   this.gestures.delete(kind);el.classList.remove('aiming');const knob=el.querySelector('.br-aim-knob');if(knob)knob.style.transform='';
   try{if(el.hasPointerCapture(g.id))el.releasePointerCapture(g.id);}catch{/* Scene was detached. */}
  }
 }
 neutral(send=true){const release=(el,id)=>{try{if(id!=null&&el?.hasPointerCapture(id))el.releasePointerCapture(id);}catch{/* detached element */}};
  const pointer=this.pointer;this.pointer=null;release(this.stick,pointer);if(this.stickKnob)this.stickKnob.style.transform='';
  for(const [kind,g] of [...this.gestures])release(document.getElementById('br-'+kind),g.id);
  this.mousePoint=null;this.aim=this.lastDirection;this.keys.clear();this.move={x:0,y:0};this.gestures.clear();document.querySelectorAll('.aiming').forEach(e=>e.classList.remove('aiming'));document.querySelectorAll('.br-aim-knob').forEach(e=>e.style.transform='');this.batch=[];if(send&&this.enabled&&this.net.session&&!this.net.restoring)this.sendSample({x:0,y:0},true);}
 sendSample(move,flush=false){this.sampleAt=performance.now();this.lastMove=move;const c={seq:++this.seq,clientTick:++this.clientTick,move,aim:this.aim,aimPower:1,aspect:clamp(innerWidth/innerHeight,.2,5)};const channel=this.timeline.predicted?.rw?.channel;if(channel)c.steer={castId:channel.id};this.timeline.predict(c);this.batch.push(c);if(flush||this.batch.length>=2)this.net.send('INPUT_BATCH',{commands:this.batch.splice(0,4)});}
 tick(edgeOnly=false){if(!this.enabled||document.hidden||this.net.restoring||!this.timeline.predicted||!this.net.session||this.net.ws?.readyState!==1)return;const move=this.movement(),direction=this.rememberMove(move),gesture=[...this.gestures.values()].find(g=>g.moved);
  this.aim=gesture?.aim||(this.mousePoint?this.cursorAim()?.direction:null)||(Math.hypot(move.x,move.y)>.05?direction:this.aim);
  const old=this.lastMove||{x:0,y:0};
  const edge=((Math.hypot(old.x,old.y)>.05)!==(Math.hypot(move.x,move.y)>.05)||old.x*move.x+old.y*move.y<0);
  const now=performance.now();
  // Borrow at most one normal input step for an edge when a busy browser delays
  // the interval. The interval cannot step again inside the borrowed tick.
  if(now<(this.nextRegularAt||0))return;
  if(edgeOnly&&(!edge||now-(this.sampleAt??-Infinity)<tickMs))return;
  if(edgeOnly)this.nextRegularAt=now+tickMs;
  this.sendSample(move,edge);}
 syncFloor(f){if(!f)return;this.restoreFloor=f;this.seq=Math.max(this.seq,f.move);this.clientTick=Math.max(this.clientTick,f.tick);for(const kind of ['attack','skill'])this.actions[kind]=Math.max(this.actions[kind],f[kind]);}
 reset(){this.neutral(false);this.nextRegularAt=0;this.sampleAt=-Infinity;this.sounds.clear();this.lastDirection=this.aim={x:1,y:0};this.lastAction=null;this.lastMove={x:0,y:0};this.seq=0;this.clientTick=0;this.actions={attack:0,skill:0};this.lastFire={};}
}
