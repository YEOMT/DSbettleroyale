export class Controls{
 constructor(net,timeline){this.net=net;this.timeline=timeline;this.move={x:0,y:0};this.aim={x:1,y:0};this.keys=new Set();this.actions={attack:0,skill:0};this.seq=0;this.clientTick=0;this.batch=[];this.enabled=false;this.held={};this.lastFire={};this.bind();this.timer=setInterval(()=>this.tick(),1000/60);}
 bind(){
  addEventListener('keydown',e=>{if(!this.enabled||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;if([' ','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))e.preventDefault();this.keys.add(e.key.toLowerCase());if(e.code==='Space')this.held.attack=true;if(e.key.toLowerCase()==='e'||e.key==='Shift')this.held.skill=true;});
  addEventListener('keyup',e=>{this.keys.delete(e.key.toLowerCase());if(e.code==='Space')this.held.attack=false;if(e.key.toLowerCase()==='e'||e.key==='Shift')this.held.skill=false;});
  addEventListener('blur',()=>this.neutral());document.addEventListener('visibilitychange',()=>{if(document.hidden)this.neutral();});
  const stick=document.getElementById('br-joystick'),knob=document.getElementById('br-joystick-knob');let pointer=null;
  const move=e=>{if(e.pointerId!==pointer)return;const r=stick.getBoundingClientRect(),x=(e.clientX-r.left-r.width/2)/(r.width*.34),y=(e.clientY-r.top-r.height/2)/(r.height*.34),length=Math.max(1,Math.hypot(x,y));this.move={x:x/length,y:y/length};knob.style.transform=`translate(${this.move.x*r.width*.28}px,${this.move.y*r.height*.28}px)`;};
  stick.addEventListener('pointerdown',e=>{pointer=e.pointerId;stick.setPointerCapture(pointer);move(e);e.preventDefault();});stick.addEventListener('pointermove',move);
  for(const type of ['pointerup','pointercancel'])stick.addEventListener(type,e=>{if(e.pointerId===pointer){pointer=null;this.move={x:0,y:0};knob.style.transform='';}});
  for(const kind of ['attack','skill']){const el=document.getElementById('br-'+kind);let start=null;
   el.addEventListener('pointerdown',e=>{e.preventDefault();el.setPointerCapture(e.pointerId);start={x:e.clientX,y:e.clientY,id:e.pointerId};this.held[kind]=true;this.dragAim=null;if(kind==='attack'&&Math.hypot(this.move.x,this.move.y)>.05)this.aim={...this.move};this.fire(kind);});
   el.addEventListener('pointermove',e=>{if(!start||e.pointerId!==start.id)return;const x=e.clientX-start.x,y=e.clientY-start.y,n=Math.hypot(x,y);if(n>8){this.aim={x:x/n,y:y/n};this.dragAim=kind;}});
   for(const type of ['pointerup','pointercancel'])el.addEventListener(type,()=>{if(kind==='skill'&&this.dragAim)this.fire(kind,true);this.held[kind]=false;this.dragAim=null;start=null;});
  }
  document.getElementById('br-student-canvas').addEventListener('pointermove',e=>{if(e.pointerType!=='mouse'||!this.enabled)return;const x=e.clientX-innerWidth/2,y=e.clientY-innerHeight/2,n=Math.hypot(x,y);if(n>4){this.aim={x:x/n,y:y/n};this.mouseAim=true;}});
 }
 fire(kind,force=false){
  const self=this.timeline.predicted;if(!this.enabled||!self?.alive||self.rw?.locks?.[kind])return;
  const cooldown=kind==='attack'?self.basicCooldown:self.cooldown,now=performance.now();if(!force&&(cooldown>0||now-(this.lastFire[kind]||0)<100))return;
  this.lastFire[kind]=now;const seq=++this.actions[kind];this.net.command('ACTION',{kind,seq,aim:this.aim,aimPower:1,castId:kind==='skill'?self.rw?.recast?.id||'':''}).catch(()=>{});
 }
 neutral(){this.keys.clear();this.move={x:0,y:0};this.held={};this.batch=[];if(this.enabled)this.sendSample({x:0,y:0},true);}
 sendSample(move,flush=false){const c={seq:++this.seq,clientTick:++this.clientTick,move,aim:this.aim,aimPower:1};this.timeline.predict(c);this.batch.push(c);if(flush||this.batch.length>=2){this.net.send('INPUT_BATCH',{commands:this.batch.splice(0,4)});}}
 tick(){if(!this.enabled||document.hidden||!this.net.session||this.net.ws?.readyState!==1)return;let x=this.move.x,y=this.move.y;
  if(this.keys.size){x=Number(this.keys.has('d')||this.keys.has('arrowright'))-Number(this.keys.has('a')||this.keys.has('arrowleft'));y=Number(this.keys.has('s')||this.keys.has('arrowdown'))-Number(this.keys.has('w')||this.keys.has('arrowup'));}
  const n=Math.max(1,Math.hypot(x,y));const move={x:x/n,y:y/n};if(!this.mouseAim&&!this.dragAim&&Math.hypot(x,y)>.05)this.aim={...move};this.sendSample(move);
  for(const kind of ['attack','skill'])if(this.held[kind])this.fire(kind);
 }
 reset(){this.neutral();this.seq=0;this.clientTick=0;this.actions={attack:0,skill:0};}
}
