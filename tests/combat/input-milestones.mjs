// Test-only: times on each process use its own monotonic clock. Keep a
// maximum of eight synthetic actions, and never retain raw WS envelopes.
export async function measureActions(page,member,world){
 const server=new Map(),key=(kind,seq)=>kind+':'+seq;
 const received=data=>{
  const m=JSON.parse(data);
  if(m.type!=='ACTION'||server.size>=8)return;
  const k=key(m.payload.kind,m.payload.seq);
  if(!server.has(k))server.set(k,{kind:m.payload.kind,seq:m.payload.seq,arrival:performance.now()});
 };
 member.peer.socket.prependListener('message',received);
 const update=world.game.update.bind(world.game),p=world.byId.get(member.id);
 world.game.update=()=>{
  const local=world.session.inputs[member.id];
  for(const s of server.values())if(s.appliedMs==null&&local?.[s.kind+'Seq']===s.seq)s.appliedMs=performance.now()-s.arrival;
  update();
  for(const s of server.values())if(s.firedMs==null&&p[s.kind==='attack'?'firedAttackSeq':'firedSkillSeq']===s.seq){
   s.firedMs=performance.now()-s.arrival;s.fireTick=world.game.frame;
  }
 };
 await page.evaluate(()=>{
  const {net,renderer:r,timeline}=mod,rows=[],input={};window.actionMilestones=rows;
  for(const type of ['pointerdown','pointerup','keydown'])addEventListener(type,e=>{
   const kind=type==='keydown'&&e.key==='q'?'skill':e.target.closest?.('#br-attack')?'attack':null;
   if(!kind||!e.isTrusted)return;
   if(type==='pointerup'&&input[kind])input[kind].release=performance.now();
   else input[kind]={down:performance.now()};
  },true);
  const command=net.command.bind(net);
  net.command=(type,payload)=>{
   const promise=command(type,payload),gesture=input[payload.kind];
   if(type==='ACTION'&&gesture&&rows.length<8){
    const row={kind:payload.kind,seq:payload.seq,down:gesture.down,holdMs:(gesture.release??gesture.down)-gesture.down,
     downToSendMs:performance.now()-gesture.down};rows.push(row);
    promise.then(()=>row.downToAcceptedAckMs=performance.now()-row.down,()=>row.rejected=true);
   }
   return promise;
  };
  net.addEventListener('event',e=>{
   const ev=e.detail;if(ev.type!=='SHOT_SPAWN'||ev.data.owner!==timeline.predicted?.id||!['projectile','hook','lob','bomb'].includes(ev.data.kind))return;
   const row=rows.find(x=>x.kind===ev.data.actionKind&&x.seq===ev.data.actionSeq);
   if(row&&row.downToSpawnMs==null)row.downToSpawnMs=performance.now()-row.down;
  });
  const draw=r.draw.bind(r);
  r.draw=(view,now)=>{
   draw(view,now);
   for(const row of rows){
    const kind=row.kind==='attack'?'firedAttack':'firedSkill';
    if(timeline.predicted?.actions?.[kind]===row.seq&&row.downToAuthorityDrawMs==null)row.downToAuthorityDrawMs=performance.now()-row.down;
    for(const shot of view.shots){
     if(shot.owner!==timeline.predicted?.id||shot.actionKind!==row.kind||shot.actionSeq!==row.seq)continue;
     const key=shot.preview?'downToPreviewDrawMs':['projectile','hook','lob','bomb'].includes(shot.kind)?'downToShotDrawMs':'downToAuthorityCueDrawMs';
     if(row[key]==null)row[key]=performance.now()-row.down;
    }
   }
  };
 });
 return async()=>{
  member.peer.socket.off('message',received);world.game.update=update;
  const browser=await page.evaluate(()=>actionMilestones.map(({down,...row})=>row));
  return {browser,server:[...server.values()].map(({arrival,...row})=>row)};
 };
}
