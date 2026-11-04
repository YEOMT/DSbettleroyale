import {manifest} from '../../../../packages/content/src/manifest.js';
const abilities=new Map(manifest.roster.map(a=>[a.id,a.ability]));
// CSS pixels, milliseconds, radians. These values only transform the emoji bitmap.
const poses={
 heavy:[130,3.5,.07,.12],slash:[100,2.5,.09,.06],quick:[80,1.8,.055,.055],
 recoil:[120,-4,-.10,.10],burst:[80,0,-.025,.045],orbit:[100,0,.065,.035],
 field:[130,0,0,.065],travel:[95,1.4,.045,.05],hit:[100,2,.024,.07]
};
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
 clear(){this.active=new Map();this.fired=new Map();}
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
  const s=this.active.get(actor.id);if(!s)return null;
  const [ms,px,tilt,squash]=poses[s.family],age=(tick-s.tick)*1000/60;
  if(age<0)return null; // The interpolated row can still belong to the previous life.
  if(!actor.alive||actor.lifeSeq!==s.life||now-s.born>ms+240){this.active.delete(actor.id);return null;}
  if(reduced)return null;
  // The render clock chooses the first eligible frame. A busy first paint can
  // consume the whole short pose before that frame; bound its visible recovery
  // by wall time, without ever restarting an action or replaying a stale hit.
  s.shownAt??=now-Math.min(age,ms*.25);
  const u=Math.max(0,(now-s.shownAt)/ms);
  if(u>=1){this.active.delete(actor.id);return null;}
  const attack=Math.min(1,(u+.08)/.26),wave=attack*(1-u)**2;
  const size=Math.min(Math.abs(px),actor.radius*zoom*.15)*(low?.65:1)*Math.sign(px);
  const weight=wave*(s.family==='hit'?Math.min(1,.4+s.level*.15):1);
  return {x:s.dx*size*weight/zoom,y:s.dy*size*weight/zoom,rotation:tilt*(s.dx||1)*weight,squash:squash*weight};
 }
}
