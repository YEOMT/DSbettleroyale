export const shotKey=s=>[s.owner,s.life,s.actionKind,s.actionSeq,s.ordinal??0].join(':');
export function previewShots(self,kind,seq,aim,now,power=1){
 const v=self.visualProfiles?.[kind];if(!v)return [];
 const count=v.close?0:v.count||0,range=kind==='skill'&&self.aimProfiles?.skill?.distance?v.range*power:v.range;
 return Array.from({length:count},(_,ordinal)=>{const angle=Math.atan2(aim.y,aim.x)+(v.radial?ordinal:ordinal-(count-1)/2)*(v.spread||0),dx=Math.cos(angle),dy=Math.sin(angle),delay=(v.windup||0)+(v.interval||0)*ordinal;
 const q={owner:self.id,life:self.lifeSeq,actionKind:kind,actionSeq:seq,ordinal,kind:'projectile',native:true,preview:true,x:self.x+dx*self.radius*(v.offset||0),y:self.y+dy*self.radius*(v.offset||0),dx:dx*v.speed,dy:dy*v.speed,radius:ordinal===count-1&&v.finalRadius||v.radius,color:v.color,emoji:kind==='attack'?null:v.emoji,style:v.style,rotation:0,rangeRemaining:range,at:now,bornAt:now+delay*1000/60,expires:now+delay*1000/60+500};q.id='preview:'+shotKey(q);return q;});
}
export function previewCue(self,kind,seq,aim,tick){
 const v=self.visualProfiles?.[kind];if(!v)return null;
 const spec=v.spec||{},melee=kind==='attack'&&v.close;
 return {kind:melee?'swing':kind==='attack'?'muzzle':'cast-start',x:self.x,y:self.y,dx:aim.x,dy:aim.y,size:melee?Math.max(self.radius,v.range-v.step):kind==='attack'?70:spec.range||spec.radius,color:v.color,amount:v.halfAngle,style:melee?'basic-'+v.style:v.style,sourceId:self.id,tick,preview:true,actionKind:kind,actionSeq:seq,geometry:melee?{shape:'sector',halfAngle:v.halfAngle,basic:true,part:v.style,preview:true}:{...spec,windup:v.windup>0,displayMs:Math.max(220,(v.windup||0)*1000/60)}};
}
export function terminalPoints(end,born){
 if(end.trace?.length>=4)return end.trace;
 if(end.path?.length>=8){const points=[];for(let i=0;i<end.path.length;i+=4)points.push(end.path[i+1],end.path[i+2]);points.push(end.x,end.y);return points;}
 // Curves/turns without recorded samples must never become a wall-crossing chord.
 return !end.curved&&!end.turn&&born?[born.x,born.y,end.x,end.y]:[];
}
