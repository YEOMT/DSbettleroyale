import {manifest} from '../../../../packages/content/src/manifest.js';
const abilities=new Map(manifest.roster.map(a=>[a.id,a.ability]));
// CSS pixels, milliseconds, radians. These values only transform the emoji bitmap.
const poses={
 heavy:[190,8,.15,.18],slash:[135,5,.12,.10],quick:[85,2.8,.085,.075],
 recoil:[160,-8,-.13,.12],burst:[80,0,-.025,.045],orbit:[100,0,.065,.035],
 field:[130,0,0,.065],travel:[95,1.4,.045,.05],hit:[100,2,.024,.07]
};
// A short forceful stroke, then a separately timed return. No actor/world data
// is written, and no render pause or velocity is added to the input path.
const lerp=(a,b,t)=>a+(b-a)*t;
export function poseEnvelope(family,u){
 if(u<0||u>=1)return {shift:0,squash:0};
 if(family==='heavy')return u<.18?{shift:1-(1-u/.18)**3,squash:-.55*u/.18}:
  u<.43?{shift:lerp(1,.65,(u-.18)/.25),squash:lerp(-.55,1,(u-.18)/.25)}:
  u<.72?{shift:lerp(.65,-.16,(u-.43)/.29),squash:lerp(1,-.2,(u-.43)/.29)}:
  {shift:-.16*((1-u)/.28)**2,squash:-.2*((1-u)/.28)**2};
 if(family==='recoil')return {shift:u<.12?u/.12:((1-u)/.88)**2,squash:Math.sin(Math.PI*u)*(1-u)};
 if(family==='slash'||family==='quick')return {shift:u<.16?u/.16:((1-u)/.84)**2,squash:Math.sin(Math.PI*u)*(1-u)};
 const wave=Math.min(1,(u+.08)/.26)*(1-u)**2;return {shift:wave,squash:wave};
}
export function poseFamily(abilityId,kind,style=''){
 const a=abilities.get(abilityId);
 if(!a)return 'quick';
 if(kind==='skill'){
  if(['SNIPE','AIMED_SHOT','GIANT_FIREBALL'].includes(a.sub)||/^skill-(sniper|heavy|bomber)$/.test(style))return 'recoil';
  if(a.type==='ORBIT')return 'orbit';
  if(['ZONE','BUFF','TURRET','AREA','PULL'].includes(a.type))return 'field';
  if(['TELEPORT','DASH'].includes(a.type))return 'travel';
 }
 if(/hammer|punch/.test(style)||/HAMMER|PUNCH|^TANK_/.test(a.sub))return 'heavy';
 if(/scissor/.test(style)||a.sub==='SCISSOR_DASH')return 'quick';
 if(/slash|soul/.test(style)||['MELEE','TELEPORT','DASH','PULL','ORBIT'].includes(a.type))return 'slash';
 return 'burst';
}
export class AttackPoses{
 constructor(){this.clear();}
 clear(){this.active=new Map();this.fired=new Map();this.contacts=new Map();}
 snapshot(s,previousTick,now){
  // Some placed fields and travel skills exist only in the public snapshot.
  // Never start a new animation just because an old entity re-enters interest.
  if(previousTick==null)return;
  for(const q of s.shots){
   if(!['gravity','dash','leap','channel'].includes(q.kind)||q.start<=previousTick||q.start>s.serverTick||s.serverTick-q.start>8)continue;
   this.accept({type:'SHOT_SPAWN',data:q,serverTick:q.start},s.actors,now);
  }
 }
 accept(event,actors,now){
  const d=event.data,g=d.geometry,shot=event.type==='SHOT_SPAWN',fx=event.type==='FX';
  const hit=fx&&d.kind==='hit'&&g?.confirmed;
  if(!shot&&!hit&&!(fx&&['attack','skill'].includes(g?.kind)&&g.seq))return;
  if(hit&&g.periodic)return;
  if(hit){
   const source=actors.find(p=>p.id===d.sourceId),old=this.contacts.get(d.sourceId);
   const family=source&&poseFamily(source.abilityId,'attack',d.style);
   if(source?.alive&&source.lifeSeq===g.lifeSeq&&['heavy','slash','quick'].includes(family)&&
    (!old||old.life!==source.lifeSeq||now-old.born>=85)){
    this.contacts.set(source.id,{life:source.lifeSeq,born:now,tick:event.serverTick});
    if(this.contacts.size>96)this.contacts.delete(this.contacts.keys().next().value);
   }
  }
  const id=shot?d.owner:hit?d.targetId:d.sourceId,actor=actors.find(p=>p.id===id),life=shot?d.life:hit?g.targetLife:g.lifeSeq;
  if(!actor?.alive||actor.lifeSeq!==life)return;
  const dx=d.dx||0,dy=d.dy||0,length=Math.hypot(dx,dy);
  const kind=shot?d.actionKind:g.kind,seq=shot?d.actionSeq:g.seq;
  if(!hit){
   if(!['skill','attack'].includes(kind)||!seq)return;
   const key=id+'/'+kind,last=this.fired.get(key);
   if(last?.life===life&&seq<=last.seq)return;
   this.fired.set(key,{seq,life});
   if(this.fired.size>192)this.fired.delete(this.fired.keys().next().value);
  }
  const family=hit?'hit':poseFamily(actor.abilityId,kind,d.style);
  const entry={family,kind,seq,life,id,dx:length?dx/length:0,dy:length?dy/length:0,born:now,tick:event.serverTick,level:d.impactLevel||1};
  this.active.set(id,entry);
  if(this.active.size>96)this.active.delete(this.active.keys().next().value);
 }
 sample(actor,zoom,tick,now,reduced,low){
  const contact=this.contacts.get(actor.id);let compression=0;
  if(contact){const t=(now-contact.born)/100;
   if(!actor.alive||contact.life!==actor.lifeSeq||t>=1)this.contacts.delete(actor.id);
   else if(tick>=contact.tick&&!reduced)compression=.12*Math.sin(Math.PI*Math.max(0,t));}
  const s=this.active.get(actor.id);if(!s)return compression?{x:0,y:0,rotation:0,squash:compression}:null;
  let [ms,px,tilt,squash]=poses[s.family];
  if(s.family==='hit'){const level=Math.max(1,Math.min(4,s.level));ms=[0,75,95,125,150][level];px=[0,1.5,2.5,4,5][level];squash=[0,.05,.09,.14,.18][level];}
  const age=(tick-s.tick)*1000/60;
  if(age<0)return null; // The interpolated row can still belong to the previous life.
  if(!actor.alive||actor.lifeSeq!==s.life||now-s.born>ms+240){this.active.delete(actor.id);this.contacts.delete(actor.id);return null;}
  if(reduced)return null;
  // The render clock chooses the first eligible frame. A busy first paint can
  // consume the whole short pose before that frame; bound its visible recovery
  // by wall time, without ever restarting an action or replaying a stale hit.
  s.shownAt??=now-Math.min(age,ms*.25);
  const u=Math.max(0,(now-s.shownAt)/ms);
  if(u>=1){this.active.delete(actor.id);return null;}
  const wave=poseEnvelope(s.family,u),size=Math.min(Math.abs(px),actor.radius*zoom*.30)*Math.sign(px);
  // Low quality keeps the same readable body/contact signal, without adding objects.
  return {x:s.dx*size*wave.shift/zoom,y:s.dy*size*wave.shift/zoom,rotation:tilt*(s.dx||1)*wave.shift,squash:squash*wave.squash+compression};
 }
}
