import {AimAssist} from './aim.js';
const movementKeys=new Set(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright']);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export class Controls{
 constructor(net,timeline){this.net=net;this.timeline=timeline;this.assist=new AimAssist(timeline);this.move={x:0,y:0};this.aim={x:1,y:0};this.keys=new Set();this.actions={attack:0,skill:0};this.seq=0;this.clientTick=0;this.batch=[];this.enabled=false;this.gestures=new Map();this.lastFire={};this.bind();this.timer=setInterval(()=>this.tick(),1000/60);}
 bind(){
  addEventListener('keydown',e=>{if(!this.enabled||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;if([' ','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))e.preventDefault();if(movementKeys.has(e.key.toLowerCase()))this.keys.add(e.key.toLowerCase());if(!e.repeat){if(e.code==='Space'||e.key==='Enter')this.fire('attack',{tap:true});if(['q','e','shift'].includes(e.key.toLowerCase()))this.fire('skill');}});
  addEventListener('focusin',e=>{if(/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))this.neutral();});
  addEventListener('keyup',e=>this.keys.delete(e.key.toLowerCase()));addEventListener('blur',()=>this.neutral());document.addEventListener('visibilitychange',()=>{if(document.hidden)this.neutral();});
  const stick=document.getElementById('br-joystick'),knob=document.getElementById('br-joystick-knob');this.stick=stick;this.stickKnob=knob;this.pointer=null;
  const move=e=>{if(e.pointerId!==this.pointer)return;const r=stick.getBoundingClientRect(),x=(e.clientX-r.left-r.width/2)/(r.width*.31),y=(e.clientY-r.top-r.height/2)/(r.height*.31),length=Math.max(1,Math.hypot(x,y));this.move={x:x/length,y:y/length};knob.style.transform=`translate(${this.move.x*r.width*.31}px,${this.move.y*r.height*.31}px)`;};
  stick.addEventListener('pointerdown',e=>{if(!this.enabled||this.pointer!==null||e.button>0)return;this.pointer=e.pointerId;try{stick.setPointerCapture(e.pointerId);}catch{this.pointer=null;return;}move(e);e.preventDefault();});stick.addEventListener('pointermove',move);
  for(const type of ['pointerup','pointercancel','lostpointercapture'])stick.addEventListener(type,e=>{if(e.pointerId===this.pointer){this.pointer=null;this.move={x:0,y:0};knob.style.transform='';}});
  for(const kind of ['attack','skill']){const el=document.getElementById('br-'+kind),knob=el.querySelector('.br-aim-knob');
   const update=e=>{const g=this.gestures.get(kind);if(!g||g.id!==e.pointerId)return;const x=e.clientX-g.x,y=e.clientY-g.y,n=Math.hypot(x,y),extent=Math.max(el.clientWidth,el.clientHeight),train=kind==='skill'&&this.timeline.predicted?.abilityId==='emoji-019';if(n>10){g.aim={x:x/n,y:y/n};g.moved=true;}g.power=train?(g.moved?.18+.82*clamp((n-10)/Math.max(1,extent*.92-10),0,1):this.assist.trainPower(220,(this.timeline.predicted?.aimProfiles?.skill?.range||1480)/1480)):g.moved?clamp(n/(extent*.92),.18,1):1;this.aim=g.aim;if(knob)knob.style.transform=`translate(${g.aim.x*Math.min(extent*.56,n)}px,${g.aim.y*Math.min(extent*.56,n)}px)`;};
   const clear=e=>{const g=this.gestures.get(kind);if(!g||g.id!==e.pointerId)return;this.gestures.delete(kind);el.classList.remove('aiming');if(knob)knob.style.transform='';};
   el.addEventListener('pointerdown',e=>{if(!this.enabled||e.button>0||this.gestures.has(kind))return;e.preventDefault();try{el.setPointerCapture(e.pointerId);}catch{return;}if(kind==='attack'&&Math.hypot(this.move.x,this.move.y)>.05)this.aim={...this.move};this.gestures.set(kind,{x:e.clientX,y:e.clientY,id:e.pointerId,aim:{...this.aim},power:1,moved:false,at:performance.now()});el.classList.add('aiming');update(e);});
   el.addEventListener('pointermove',update);el.addEventListener('pointerup',e=>{const g=this.gestures.get(kind);if(!g||g.id!==e.pointerId)return;update(e);this.fire(kind,{aim:g.aim,power:g.power,tap:kind==='attack'&&!g.moved&&performance.now()-g.at<=220});clear(e);});for(const type of ['pointercancel','lostpointercapture'])el.addEventListener(type,clear);
   el.addEventListener('contextmenu',e=>e.preventDefault());
  }
  addEventListener('pointermove',e=>{if(e.target!==this.renderer?.canvas||e.pointerType!=='mouse'||!this.enabled)return;const {cameraPose:pose,cam}=this.renderer||{},self=this.timeline.predicted;if(!pose||!self)return;const rect=e.currentTarget.getBoundingClientRect(),x=((e.clientX-rect.left)*innerWidth/rect.width-pose.screenX)/pose.zoom+cam.x-self.x,y=((e.clientY-rect.top)*innerHeight/rect.height-pose.screenY)/pose.zoom+cam.y-self.y,n=Math.hypot(x,y);if(n>4){this.aim={x:x/n,y:y/n};this.mouseAim=true;this.mouseDistance=n;}});
 }
 fire(kind,{aim=this.aim,power,tap=false}={}){
  const self=this.timeline.predicted;if(!this.enabled||this.net.restoring||!self?.alive||self.stunned>0||self.rw?.locks?.[kind])return;
  const profile=self.aimProfiles?.[kind];power??=(this.mouseAim && profile && profile.range>profile.rangeMin) ? .18+.82*clamp((this.mouseDistance-profile.rangeMin)/(profile.range-profile.rangeMin),0,1) : 1;
  const cooldown=kind==='attack'?self.basicCooldown:self.cooldown,now=performance.now();if((cooldown>0&&!(kind==='skill'&&self.rw?.recast))||now-(this.lastFire[kind]??-Infinity)<100)return;
  const helped=this.assist.resolve(kind,aim,power,tap);this.lastFire[kind]=now;this.mouseAim=false;const seq=++this.actions[kind];this.timeline.preview(kind,seq,helped.aim,power);this.audio?.action(kind==='skill'?'skill':self.visualProfiles?.attack?.close?'melee':'shoot');const sent=this.lastAction={kind,seq,life:self.lifeSeq,epoch:this.net.scope.connectionEpoch,state:'sent'};
  this.net.command('ACTION',{kind,seq,...helped,aimPower:power,castId:kind==='skill'?self.rw?.recast?.id||'':''}).then(()=>{sent.state='queued';}).catch(error=>{
   sent.state='rejected';sent.reason=error.message;
   if(sent.life===this.net.lifeSeq&&sent.epoch===this.net.scope.connectionEpoch)this.timeline.cancelPreview(kind,seq);
  });
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
  this.mouseAim=false;this.keys.clear();this.move={x:0,y:0};this.gestures.clear();document.querySelectorAll('.aiming').forEach(e=>e.classList.remove('aiming'));document.querySelectorAll('.br-aim-knob').forEach(e=>e.style.transform='');this.batch=[];if(send&&this.enabled&&this.net.session&&!this.net.restoring)this.sendSample({x:0,y:0},true);}
 sendSample(move,flush=false){this.lastMove=move;const c={seq:++this.seq,clientTick:++this.clientTick,move,aim:this.aim,aimPower:1,aspect:clamp(innerWidth/innerHeight,.2,5)};const channel=this.timeline.predicted?.rw?.channel;if(channel)c.steer={castId:channel.id};this.timeline.predict(c);this.batch.push(c);if(flush||this.batch.length>=2)this.net.send('INPUT_BATCH',{commands:this.batch.splice(0,4)});}
 tick(){if(!this.enabled||document.hidden||this.net.restoring||!this.timeline.predicted||!this.net.session||this.net.ws?.readyState!==1)return;let x=this.move.x,y=this.move.y;if(this.keys.size){x=Number(this.keys.has('d')||this.keys.has('arrowright'))-Number(this.keys.has('a')||this.keys.has('arrowleft'));y=Number(this.keys.has('s')||this.keys.has('arrowdown'))-Number(this.keys.has('w')||this.keys.has('arrowup'));}const n=Math.max(1,Math.hypot(x,y)),move={x:x/n,y:y/n};if(!this.mouseAim&&!this.gestures.size&&Math.hypot(x,y)>.05)this.aim={...move};this.sendSample(move);}
 syncFloor(f){if(!f)return;this.restoreFloor=f;this.seq=Math.max(this.seq,f.move);this.clientTick=Math.max(this.clientTick,f.tick);for(const kind of ['attack','skill'])this.actions[kind]=Math.max(this.actions[kind],f[kind]);}
 reset(){this.neutral(false);this.lastAction=null;this.lastMove={x:0,y:0};this.seq=0;this.clientTick=0;this.actions={attack:0,skill:0};this.lastFire={};}
}
