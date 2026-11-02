const links={ready:'https://www.dropbox.com/scl/fi/uh3w61oauudkb79kogl44/BR-Ready.mp3?rlkey=mii9oxram8d7oda6k0g9j5x36&raw=1',start:'https://www.dropbox.com/scl/fi/acuk8jzd3cyz8j3qdpin4/BR-Start.mp3?rlkey=nkms6a7rvpm45sxuzsasf6tj6&raw=1',final:'https://www.dropbox.com/scl/fi/945izg1kyv4cmu07x6w6d/BR-Final.mp3?rlkey=wyx84e89smyfbxipmvqicg4uu&raw=1'};
export class GameAudio{
 constructor(){this.enabled=false;this.effects=true;this.volume=.25;this.audio=new Audio();this.audio.preload='none';this.audio.addEventListener('ended',()=>{if(this.stage==='start')this.play('final');});this.seen=new Set();}
 play(stage){if(stage===this.stage&&this.audio.src)return;this.stage=stage;this.audio.pause();this.audio.src=links[stage]||'';this.audio.loop=stage==='ready'||stage==='final';this.audio.volume=this.volume;if(this.enabled&&links[stage])this.audio.play().catch(()=>{});}
 phase(phase){if(['LOBBY','QUIZ','DRAFT'].includes(phase))this.play('ready');else if(phase==='BATTLE')this.play('start');else{this.audio.pause();this.stage='';}}
 toggle(){this.enabled=!this.enabled;if(this.enabled)this.audio.play().catch(()=>{});else this.audio.pause();return this.enabled;}
 effect(event,selfId){if(!this.effects||this.seen.has(event.eventId)||event.type!=='FX'||event.data.kind!=='hit')return;this.seen.add(event.eventId);if(this.seen.size>500)this.seen.delete(this.seen.values().next().value);if(event.data.sourceId!==selfId&&event.data.targetId!==selfId)return;
  try{this.ctx??=new AudioContext();const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.connect(g);g.connect(this.ctx.destination);o.frequency.value=event.data.targetId===selfId?130:420;g.gain.setValueAtTime(.04,this.ctx.currentTime);g.gain.exponentialRampToValueAtTime(.001,this.ctx.currentTime+.07);o.start();o.stop(this.ctx.currentTime+.08);}catch{}
 }
}
