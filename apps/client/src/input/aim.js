import {installAim} from './original-aim.js';
// Candidates come exclusively from this student's visible snapshot. The server validates
// target life, angle limits, cover and original manual-ray priority again at application.
export class AimAssist{
 constructor(timeline){this.timeline=timeline;this.enabled=true;this.scope={...timeline.kernel,BRMP:{},BR_CRATE_HALF:48,BR_AIM_HELP:{tapMs:220},brRingKey:()=>'',brReworkClientState:self=>self.rw};installAim(this.scope);this.scope.brAimHelpContext=()=>this.context;this.scope.brAimHelpCandidates=()=>this.targets;this.scope.brAimHelpTarget=(c,t)=>t;}
 resolve(kind,raw,power=1,tap=false){const out={aim:raw,rawAim:raw},self=this.timeline.predicted,last=this.timeline.samples.at(-1);if(!this.enabled||!self||!last||performance.now()-last.at>450)return out;
  const spec=self.aimProfiles?.[kind];if(!spec)return out;const profile={...spec,range:spec.rangeMin+(spec.range-spec.rangeMin)*(power-.18)/.82};profile.spec={...spec.spec,range:profile.range};
  const view=last.state,now=performance.now(),aspect=globalThis.innerWidth/globalThis.innerHeight||1,bounds={hw:aspect>=1?900:900*aspect,hh:aspect>=1?900/aspect:900};this.context={self,host:false,origin:{x:self.x,y:self.y},team:self.team,profile,walls:this.timeline.walls||[],boxes:view.farm?.b||[],now};
  const targets=[];const add=(id,life,x,y,r,vx,vy,box)=>{const distance=Math.hypot(x-self.x,y-self.y);if(distance-r>profile.range||Math.abs(x-self.x)>bounds.hw||Math.abs(y-self.y)>bounds.hh)return;targets.push({id,life,x,y,r,vx:vx||0,vy:vy||0,box,distance,angle:Math.atan2(y-self.y,x-self.x)});};
  for(const a of view.actors)if(a.alive&&a.id!==self.id&&(!self.team||a.team!==self.team))add('p:'+a.id,a.lifeSeq,a.x,a.y,a.radius,a.vx,a.vy);
  for(const t of view.shots)if(t.kind==='turret'&&t.hp>0&&t.owner!==self.id&&(!self.team||t.team!==self.team))add('t:'+t.id,t.life,t.x,t.y,t.radius,0,0);
  if(kind==='attack')for(const b of this.context.boxes)if(b[3]>0)add('c:'+b[0],0,b[1],b[2],b[5],0,0,b);
  this.targets=targets;const help=this.scope.brResolveAimHelp(kind,raw,power,tap,true);return {...out,aim:{x:help.x,y:help.y},...(help.assist?{assist:help.assist}:{})};
 }
 trainPower(distance,scale=1){return this.scope.brTrainPower(distance,scale);}
}
