import assert from 'node:assert/strict';import {auditHarness} from '../fidelity-v33-2/harness.mjs';
const h=await auditHarness({players:2});
try{
 await h.battle();
 const result=await h.host.evaluate(async()=>{
  const {createOriginalAudio}=await import('/src/audio/original-audio.js'),OriginalAudio=window.Audio,stored=localStorage.getItem('br_bgm_host_v1');let deny=false,plays=0,now=1000,c;
  class Media extends EventTarget{duration=2;readyState=4;networkState=1;currentTime=0;paused=true;error=null;src='';volume=0;play(){plays++;if(deny)return Promise.reject(new DOMException('Fixture autoplay denied','NotAllowedError'));this.paused=false;return Promise.resolve();}pause(){this.paused=true;}load(){this.onloadedmetadata?.();}}
  const settle=async()=>{await Promise.resolve();await Promise.resolve();await Promise.resolve();};
  try{
   window.Audio=Media;localStorage.removeItem('br_bgm_host_v1');const session={role:'host',roomCode:'fixture',roomMeta:{phase:'lobby',matchRound:1,battleStartedAt:1000}};c=createOriginalAudio(session,()=>now);c.sync(session.roomMeta);await settle();const stages=[c.state.stage];
   c.state.pref.volume=37;c.save();const volume=JSON.parse(localStorage.getItem('br_bgm_host_v1')).volume;
   c.toggle();const muted=!c.state.pref.enabled;c.toggle();await settle();const enabled=c.state.pref.enabled;
   deny=true;c.pause(true);c.pause(false);await settle();const blocked=c.state.blocked,error=c.state.lastPlayError?.name,before=plays;
   c.toggle();await settle();const retryKeptEnabled=c.state.pref.enabled&&plays>before;
   deny=false;c.toggle();await settle();const recovered=!c.state.blocked;
   session.roomMeta.phase='battle';c.sync(session.roomMeta);await settle();stages.push(c.state.stage);c.state.audio.onended();await settle();stages.push(c.state.stage);
   session.roomMeta.phase='results';c.sync(session.roomMeta);stages.push(c.state.stage);session.roomMeta.phase='lobby';session.roomMeta.matchRound=2;c.sync(session.roomMeta);await settle();stages.push(c.state.stage);
   return {volume,muted,enabled,blocked,error,retryKeptEnabled,recovered,stages};
  }finally{c?.stop();window.Audio=OriginalAudio;if(stored===null)localStorage.removeItem('br_bgm_host_v1');else localStorage.setItem('br_bgm_host_v1',stored);}
 });
 assert.equal(result.volume,37);for(const key of ['muted','enabled','blocked','retryKeptEnabled','recovered'])assert.equal(result[key],true,key);assert.equal(result.error,'NotAllowedError');assert.deepEqual(result.stages,['ready','start','final','results','ready']);
 const synth=await h.student.evaluate(async()=>{
  const m=await import('/src/main.js');m.audio.controller.ensure();const s=m.renderer.session,ac=s.audioCtx;await ac.resume();
  const create=ac.createOscillator.bind(ac),muted=s.soundMuted,tones=[];let ended=0;s.soundMuted=false;
  ac.createOscillator=()=>{const o=create(),set=o.frequency.setValueAtTime.bind(o.frequency);o.frequency.setValueAtTime=(v,t)=>{tones.push(v);return set(v,t);};o.addEventListener('ended',()=>ended++);return o;};
  try{for(const level of [1,2,3])m.audio.controller.sfx('melee',level);m.audio.controller.sfx('skill',3);await new Promise(r=>setTimeout(r,240));return {tones,ended};}
  finally{ac.createOscillator=create;s.soundMuted=muted;}
 });
 assert.deepEqual(synth.tones,[270,190,130,155]);assert.equal(synth.ended,4,'short action voices must end');
 await h.command('END');await h.command('REMATCH');assert.deepEqual(h.errors,[]);
}finally{await h.close();}
