import {manifest} from '../../../../packages/content/src/manifest.js';
const abilities=new Map(manifest.roster.map(a=>[a.id,a.ability]));
// CSS pixels, milliseconds, radians. These values only transform the emoji bitmap.
const poses={
 heavy:[205,9.6,.17,.216],slash:[105,5,.12,.11],quick:[85,2.8,.085,.075],
 recoil:[160,-8,-.13,.12],burst:[100,-1.1,-.025,.05],orbit:[100,0,.065,.035],
 field:[130,0,0,.065],travel:[95,1.4,.045,.05],hit:[100,2,.024,.07],
 wall:[175,3.2,.065,.19],reflection:[110,1.6,.035,.065]
};
// A short forceful stroke, then a separately timed return. No actor/world data
// is written, and no render pause or velocity is added to the input path.
const lerp=(a,b,t)=>a+(b-a)*t;
export function poseEnvelope(family,u,out={shift:0,squash:0}){
 if(u<0||u>=1){out.shift=out.squash=0;return out;}
 if(family==='heavy'){
  if(u<.18){out.shift=1-(1-u/.18)**3;out.squash=-.55*u/.18;}
  else if(u<.43){out.shift=lerp(1,.65,(u-.18)/.25);out.squash=lerp(-.55,1,(u-.18)/.25);}
  else if(u<.72){out.shift=lerp(.65,-.16,(u-.43)/.29);out.squash=lerp(1,-.2,(u-.43)/.29);}
  else{out.shift=-.16*((1-u)/.28)**2;out.squash=-.2*((1-u)/.28)**2;}
 }else if(family==='hit'){
  // Incoming force compresses immediately, then releases once. This is not the
  // attack's anticipatory stretch and cannot delay/cancel an executed attack.
  out.shift=u<.22?1-(1-u/.22)**2:u<.55?lerp(1,-.12,(u-.22)/.33):-.12*((1-u)/.45)**2;
  out.squash=u<.18?.45+.55*u/.18:u<.60?lerp(1,-.12,(u-.18)/.42):-.12*((1-u)/.40)**2;
 }else if(family==='wall'){
  out.shift=u<.28?.35*u/.28:u<.55?lerp(.35,-1,(u-.28)/.27):-(((1-u)/.45)**2);
  out.squash=u<.20?.55+.45*u/.20:u<.58?lerp(1,-.16,(u-.20)/.38):-.16*((1-u)/.42)**2;
 }else if(family==='recoil'||family==='reflection'){
  out.shift=u<.12?u/.12:((1-u)/.88)**2;out.squash=Math.sin(Math.PI*u)*(1-u);
 }else if(family==='slash'||family==='quick'){
  out.shift=u<.16?u/.16:((1-u)/.84)**2;out.squash=Math.sin(Math.PI*u)*(1-u);
 }else{
  const wave=Math.min(1,(u+.08)/.26)*(1-u)**2;out.shift=wave;out.squash=wave;
 }
 return out;
}
export function poseFamily(abilityId,kind,style=''){
 const a=abilities.get(abilityId);
 if(!a)return 'quick';
 if(kind==='skill'){
  const actual=manifest.reworkDefinitions[abilityId]?.skill?.kind;
  if(['sequential-barrage','scissor-volley'].includes(actual))return 'burst';
  if(['spotlight','red-light','mirror','iron-reflect'].includes(actual))return 'field';
  if(actual==='safe-dash')return 'travel';
  if(['emoji-023','emoji-074','emoji-137'].includes(abilityId)||['SNIPE','AIMED_SHOT','GIANT_FIREBALL'].includes(a.sub)||/^skill-(sniper|heavy|bomber)$/.test(style))return 'recoil';
  if(a.type==='ORBIT')return 'orbit';
  if(['ZONE','BUFF','TURRET','AREA','PULL'].includes(a.type))return 'field';
  if(['TELEPORT','DASH'].includes(a.type))return 'travel';
 }
 if(/hammer|punch/.test(style)||/HAMMER|PUNCH|^TANK_/.test(a.sub))return 'heavy';
 if(/scissor/.test(style)||a.sub==='SCISSOR_DASH')return 'quick';
 if(/slash|soul/.test(style)||['MELEE','TELEPORT','DASH','PULL','ORBIT'].includes(a.type))return 'slash';
 return 'burst';
}
const bounded=(map,key,value,cap=96)=>{map.set(key,value);if(map.size>cap)map.delete(map.keys().next().value);};
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const hitDuration=[0,80,105,135,160],hitOffset=[0,1.4,2.2,3.1,4],hitSquash=[0,.06,.105,.15,.19];
const impactProfiles=new Set(['fist','hammer','bowling','train']);
export class AttackPoses{
 constructor(){this.clear();}
 clear(){
  this.active=new Map();this.hurts=new Map();this.walls=new Map();this.fired=new Map();this.contacts=new Map();
  this.hurtLedger=new Map();this.wallLedger=new Map();this.contactLedger=new Map();this.outputs=new Map();
  this.channels=[this.active,this.hurts,this.walls,this.contacts,this.outputs];
 }
 snapshot(s,previousTick,now,onSpawn){
  // Off-screen/dead/life-changed objects cannot retain poses indefinitely. No
  // per-frame actor Map/Set is built; the snapshot's existing array is reused.
  for(const map of this.channels)for(const [id,entry]of map){
   const a=s.actors.find(a=>a.id===id);
   if(!a?.alive||a.lifeSeq!==entry.life||(entry.born!=null&&now-entry.born>1000))map.delete(id);
  }
  if(previousTick==null)return;
  for(const q of s.shots){
   if(!['gravity','dash','safe-dash','leap','channel'].includes(q.kind)||q.start<previousTick||q.start>s.serverTick||s.serverTick-q.start>8)continue;
   const event={type:'SHOT_SPAWN',data:q,serverTick:q.start};this.accept(event,s.actors,now);onSpawn?.(event);
  }
 }
 entry(event,actor,family,life,id,now){
  const d=event.data,g=d.geometry,dx=Number(d.dx)||0,dy=Number(d.dy)||0,length=Math.hypot(dx,dy);
  return {family,life,id,dx:length?dx/length:0,dy:length?dy/length:0,born:now,tick:event.serverTick,
   kind:d.actionKind||g?.kind,seq:d.actionSeq||g?.seq,level:clamp(Math.round(d.impactLevel||1),1,4),
   wave:{shift:0,squash:0},castId:g?.castId||d.id||'',lifeOfSource:g?.lifeSeq};
 }
 accept(event,actors,now){
  const d=event.data;if(!d)return;
  const g=d.geometry,shot=event.type==='SHOT_SPAWN',fx=event.type==='FX';
  const hit=fx&&d.kind==='hit'&&g?.confirmed;
  const wall=fx&&d.style==='heavy-wall'&&g?.confirmed&&g.stage==='wall'&&impactProfiles.has(g.profile);
  const reflect=event.type==='SHOT_TURN'&&d.returned===true||fx&&d.style==='pan-contact'&&g?.confirmed;
  if(!shot&&!hit&&!wall&&!reflect&&!(fx&&['attack','skill'].includes(g?.kind)&&g.seq))return;
  if(hit&&g.periodic)return; // Existing rim/flash still shows DOT; no whole-body tremor.
  if(!hit&&!wall&&!reflect&&fx&&g?.windup)return;
  if(hit){
   const source=actors.find(p=>p.id===d.sourceId),old=this.contacts.get(d.sourceId),last=this.contactLedger.get(d.sourceId);
   const contactKey=[d.targetId,g.targetLife,g.castId,g.projectileId,g.ordinal,event.serverTick].join(':');
   const family=source&&poseFamily(source.abilityId,'attack',d.style);
   if(source?.alive&&source.lifeSeq===g.lifeSeq&&['heavy','slash','quick'].includes(family)&&
    !(last?.life===source.lifeSeq&&(last.key===contactKey||event.serverTick<last.tick))){
    bounded(this.contactLedger,source.id,{life:source.lifeSeq,key:contactKey,tick:event.serverTick});
    if(!old||old.life!==source.lifeSeq||now-old.born>=85)bounded(this.contacts,source.id,{life:source.lifeSeq,born:now,tick:event.serverTick});
   }
   if(!(d.amount>0))return; // Pure shield absorption has its existing rim, never HP hurt.
  }
  const id=shot||event.type==='SHOT_TURN'?d.owner:hit||wall?d.targetId:d.sourceId;
  const actor=actors.find(p=>p.id===id),life=shot||event.type==='SHOT_TURN'?d.life:hit||wall?g.targetLife:g.lifeSeq;
  if(!actor?.alive||actor.lifeSeq!==life||!Number.isFinite(event.serverTick))return;
  if(wall){
   if(!g.castId)return;
   const old=this.wallLedger.get(id);
   if(old?.life===life&&(old.castId===g.castId||event.serverTick<=old.tick))return;
   const entry=this.entry(event,actor,'wall',life,id,now);
   bounded(this.wallLedger,id,{life,castId:g.castId,tick:event.serverTick});bounded(this.walls,id,entry);return;
  }
  if(hit||reflect){
   const old=this.hurtLedger.get(id),key=reflect?(d.id||g.castId):[g.castId,g.projectileId,g.ordinal,event.serverTick,d.sourceId].join(':');
   const level=clamp(Math.round(d.impactLevel||1),1,4),current=this.hurts.get(id);
   if(old?.life===life&&(event.serverTick<=old.tick||key===old.key)){
    if(event.serverTick===old.tick&&hit&&current?.life===life&&current.family==='hit'&&level>current.level&&now-current.born<160)current.level=level;
    return;
   }
   // Coalesce bursts without extending the envelope's lifetime. A stronger
   // actual HP hit may increase the existing compression, never queue another.
   if(current?.life===life&&!(hit&&current.family==='reflection')&&now-current.born<Math.max(160,hitDuration[current.level])){
    if(hit&&current.family==='hit'&&level>current.level)current.level=level;
    bounded(this.hurtLedger,id,{life,key,tick:event.serverTick});return;
   }
   bounded(this.hurtLedger,id,{life,key,tick:event.serverTick});
   bounded(this.hurts,id,this.entry(event,actor,hit?'hit':'reflection',life,id,now));return;
  }
  const kind=shot?d.actionKind:g.kind,seq=shot?d.actionSeq:g.seq;
  if(!['skill','attack'].includes(kind)||!seq)return;
  const key=id+'/'+kind,last=this.fired.get(key);
  if(last?.life===life&&seq<=last.seq)return;
  bounded(this.fired,key,{seq,life},192);
  const family=shot&&['dash','safe-dash','leap'].includes(d.kind)?'travel':poseFamily(actor.abilityId,kind,d.style);
  bounded(this.active,id,{...this.entry(event,actor,family,life,id,now),kind,seq});
 }
 update(map,actor,zoom,tick,now){
  const s=map.get(actor.id);if(!s)return null;
  const profile=poses[s.family],ms=s.family==='hit'?hitDuration[s.level]:profile[0],age=(tick-s.tick)*1000/60;
  if(!actor.alive||actor.lifeSeq!==s.life||(s.shownAt==null?(now-s.born>500||age>750):now-s.shownAt>=ms)){
   map.delete(actor.id);return null;
  }
  if(age<0)return null;
  s.shownAt??=now-Math.min(age,ms*.25);
  const u=Math.max(0,(now-s.shownAt)/ms);if(u>=1){map.delete(actor.id);return null;}
  const wave=poseEnvelope(s.family,u,s.wave),px=s.family==='hit'?hitOffset[s.level]:profile[1];
  s.shift=Math.min(Math.abs(px),actor.radius*zoom*.30)*Math.sign(px)*wave.shift;
  s.squash=(s.family==='hit'?hitSquash[s.level]:profile[3])*wave.squash;
  s.rotation=(s.family==='hit'?.035*s.level:profile[2])*(s.dx||1)*wave.shift;
  return s;
 }
 sample(actor,zoom,tick,now,reduced,low,host=false){
  zoom=Math.max(.05,zoom);
  const a=this.update(this.active,actor,zoom,tick,now),h=this.update(this.hurts,actor,zoom,tick,now),w=this.update(this.walls,actor,zoom,tick,now);
  const contact=this.contacts.get(actor.id);let compression=0;
  if(contact){const t=(now-contact.born)/100;
   if(!actor.alive||contact.life!==actor.lifeSeq||t>=1)this.contacts.delete(actor.id);
   else if(tick>=contact.tick)compression=.12*Math.sin(Math.PI*Math.max(0,t));}
  const rw=actor.rw,force=actor.alive&&rw&&(rw.life==null||rw.life===actor.lifeSeq)&&rw.impulseEnd>Math.max(tick,rw.sourceTick||0)?Math.hypot(rw.impulseX||0,rw.impulseY||0):0;
  const impulse=force>.15?Math.min(1,force/12)*Math.min(1,(rw.impulseEnd-Math.max(tick,rw.sourceTick||0))/6):0;
  if(reduced||!a&&!h&&!w&&!compression&&!impulse){this.outputs.delete(actor.id);return null;}
  let out=this.outputs.get(actor.id);if(!out){out={life:actor.lifeSeq};bounded(this.outputs,actor.id,out);}
  const reaction=w||h,primary=reaction||a,attackWeight=w ? .35 : h ? .65 : 1;
  let x=(a?.dx||0)*(a?.shift||0)*attackWeight+(reaction?.dx||0)*(reaction?.shift||0);
  let y=(a?.dy||0)*(a?.shift||0)*attackWeight+(reaction?.dy||0)*(reaction?.shift||0);
  let rotation=(a?.rotation||0)*attackWeight+(reaction?.rotation||0),squash=(reaction?.squash||0)+(a?.squash||0)*(reaction ? .35 : 1)+compression;
  // Attack stretches along execution; incoming hurt/wall compresses along the
  // contact axis. The emoji itself stays upright except for the small rotation.
  let axisX=primary?.dx||0,axisY=primary?.dy||0;
  if(!reaction){const swap=axisX;axisX=-axisY;axisY=swap;}
  if(!axisX&&!axisY)axisY=1;
  if(impulse){
   const dx=rw.impulseX/force,dy=rw.impulseY/force;
   if(!low){x-=dx*2*impulse;y-=dy*2*impulse;}
   rotation+=clamp(dx*.10*impulse,-.10,.10);
   if(!primary){axisX=-dy;axisY=dx;}squash+=.055*impulse;
  }
  const lod=host&&zoom<.7?.60:1,limit=Math.min(w?4:10,actor.radius*zoom*.30),length=Math.hypot(x,y),scale=length>limit?limit/length:1;
  out.life=actor.lifeSeq;out.x=x*scale*lod/zoom;out.y=y*scale*lod/zoom;out.rotation=clamp(rotation,-.18,.18)*lod;
  out.squash=clamp(squash,-.22,.26)*lod;out.axisX=axisX;out.axisY=axisY;
  out.hurt=h?.family==='hit';out.reflection=h?.family==='reflection';out.wall=!!w;out.impulse=!!impulse;
  return out;
 }
}
