import {createOriginalAudio} from './original-audio.js';
export class GameAudio{
 constructor(session={}){
  this.session=session;this.epochOffset=0;this.controller=createOriginalAudio(session,()=>Date.now()+this.epochOffset);this.seen=new Set();this.history=[];this.watched=new WeakSet();this.effects=true;
  const gesture=()=>this.controller.ensure();addEventListener('pointerdown',gesture,{passive:true});addEventListener('keydown',gesture);
  // v32.1 retries blocked BGM through its explicit music button, not focus/pointerdown.
  document.addEventListener('visibilitychange',()=>{if(this.session.roomMeta?.phase!=='battle')return;this.controller.pause(document.hidden||!!this.gamePaused);if(!document.hidden)this.controller.sync(this.session.roomMeta);});
  addEventListener('focus',()=>{if(!document.hidden&&this.session.roomMeta?.phase==='battle'&&!this.state.blocked)this.controller.catchUp();});
  this.monitor=setInterval(()=>this.observe(),100);
 }
 get state(){return this.controller.state;}
 get audio(){return this.state.audio;}
 get enabled(){return !!this.state.pref?.enabled;}
 get volume(){return (this.state.pref?.volume??25)/100;}
 set volume(value){if(this.state.pref){this.state.pref.volume=Math.max(0,Math.min(100,value*100));if(this.audio)this.audio.volume=this.volume;this.controller.save();}}
 prime(){this.controller.prime();this.observe();}
 sync(room){this.session.role=room.self.role;this.session.roomCode=room.code;this.session.roomMeta={...room.config,phase:room.phase.toLowerCase(),matchRound:room.round,battleStartedAt:room.battleStartedAt||0};if(Number.isFinite(room.serverTime))this.epochOffset=room.serverTime-Date.now();this.controller.sync(this.session.roomMeta);this.observe();}
 pause(paused){this.gamePaused=!!paused;this.controller.pause(paused||document.hidden);}
 toggle(){this.controller.toggle();this.observe();return this.enabled;}
 stop(){this.controller.stop();this.seen.clear();}
 record(type,detail={}){this.history.push({at:performance.now(),type,stage:this.state.stage,...detail});if(this.history.length>160)this.history.shift();}
 observe(){const a=this.audio;if(!a)return;if(!this.watched.has(a)){this.watched.add(a);for(const type of ['loadstart','loadedmetadata','canplay','playing','pause','ended','error','stalled'])a.addEventListener(type,()=>this.record(type,{readyState:a.readyState,networkState:a.networkState,time:a.currentTime,error:a.error?{code:a.error.code,message:a.error.message}:null}));this.record('source',{url:a.currentSrc||a.src});}const signature=this.state.stage+'|'+this.state.blocked+'|'+this.state.status;if(signature!==this.lastStatus){this.lastStatus=signature;this.record('state',{blocked:this.state.blocked,status:this.state.status});}}
 diagnostics(){const a=this.audio;return {role:this.state.role,enabled:this.enabled,volume:this.volume,stage:this.state.stage,blocked:this.state.blocked,status:this.state.status,lastPlayError:this.state.lastPlayError||null,paused:a?.paused,currentTime:a?.currentTime,duration:a&&Number.isFinite(a.duration)?a.duration:null,readyState:a?.readyState,networkState:a?.networkState,error:a?.error?{code:a.error.code,message:a.error.message}:null,history:this.history};}
 effect(event,selfId){if(!this.effects||this.seen.has(event.eventId)||event.type!=='FX')return;this.seen.add(event.eventId);while(this.seen.size>500)this.seen.delete(this.seen.values().next().value);const d=event.data,own=d.sourceId===selfId,hurt=d.targetId===selfId;if(!own&&!hurt)return;
  this.session.soundMuted=!this.effects;
  // Hit/shield audio is emitted by the original brRegisterHitFeedback throttles.
  if(d.kind==='elimination'&&own)this.controller.sfx('elimination',true);

 }
 countdown(id,number,host){
  const key=id? id+':'+number:'';if(this.countdownKey===key)return;this.countdownKey=key;
  if(!id||!host||!this.effects||this.volume<=0||document.hidden)return;
  // No scheduled series: a resumed tab plays only its current number. Reuse audio context.
  const ac=this.controller.ensure();if(!ac||ac.state!=='running')return;
  const osc=ac.createOscillator(),gain=ac.createGain(),at=ac.currentTime;
  osc.type='sine';osc.frequency.setValueAtTime(number===5?880:660,at);gain.gain.setValueAtTime(.15*this.volume,at);gain.gain.exponentialRampToValueAtTime(.001,at+.14);
  osc.connect(gain);gain.connect(ac.destination);osc.onended=()=>{osc.disconnect();gain.disconnect();};osc.start(at);osc.stop(at+.15);
 }
 action(kind,weight=2){if(!this.effects)return;this.controller.ensure();this.controller.sfx(kind,weight);}
}
