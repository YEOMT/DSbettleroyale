// Derived only from authoritative capture packets. Fixed small state, no timers.
const names=['','BLUE','RED','GREEN','YELLOW'];
export function captureNotice(s,p){
 if(s.key!==p.k){Object.assign(s,{key:p.k,seq:-1,points:[],lastAt:-Infinity,cooldowns:{},text:'',until:0,leader:0,phase:p.ph,both:0,bothAnnounced:0,near:{},pending:null});}
 if(s.seq===p.q)return p.a<s.until?s.text:'';
 s.seq=p.q;const now=p.a,candidates=[];
 if(p.ph==='FEVER'&&s.phase!=='FEVER')s.pending=['fever','피버 시작 · 득점 ×2'];s.phase=p.ph;
 p.z.forEach((z,i)=>{const team=z[0]==='scoring'?z[1]:0;let held=s.points[i];if(!held||held.team!==team)s.points[i]=held={team,since:now,announced:0};if(team&&now-held.since>=2&&held.announced!==team)candidates.push(['point'+i,'AB'[i]+' · '+names[team]+' 우세·득점 중',()=>held.announced=team]);});
 const both=s.points.length===2&&s.points[0].team&&s.points[0].team===s.points[1].team&&s.points.every(x=>now-x.since>=2)?s.points[0].team:0;
 if(both!==s.both){s.both=both;s.bothAnnounced=0;}if(both&&s.bothAnnounced!==both)candidates.unshift(['both',names[both]+' A·B 동시 우세·득점',()=>s.bothAnnounced=both]);
 const best=Math.max(...p.s),leaders=p.s.flatMap((n,i)=>Math.abs(n-best)<1e-8?[i+1]:[]),leader=leaders.length===1?leaders[0]:0;
 if(leader&&best>=90&&!s.near?.[leader]){s.near??={};candidates.unshift(['near'+leader,names[leader]+' 승리 임박',()=>s.near[leader]=true]);}
 if(leader&&s.leader&&s.leader!==leader&&best>=50)s.pending=['lead',names[leader]+' 역전'];if(leader)s.leader=leader;
 if(s.pending)candidates.unshift([...s.pending,()=>s.pending=null]);
 if(p.run&&now-s.lastAt>=6)for(const [key,text,accept]of candidates)if(now-(s.cooldowns[key]??-Infinity)>=10){s.cooldowns[key]=now;s.lastAt=now;s.text=text;s.until=now+4;accept?.();break;}
 return now<s.until?s.text:'';
}
