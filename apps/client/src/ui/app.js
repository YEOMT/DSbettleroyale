import {actionHud,captureHud,resultRecords} from './battle.js';
import {AugmentUI} from './augments.js';
import QRCode from 'qrcode';
import {skillDescription} from './descriptions.js';
import {manifest} from '../../../../packages/content/src/manifest.js';
const $=id=>document.getElementById(id),text=(id,value)=>{const e=$(id);if(e)e.textContent=String(value??'');},show=(id,visible=true)=>$(id)?.classList.toggle('br-hidden',!visible);
function button(label,handler,cls='br-btn br-btn-primary'){const e=document.createElement('button');e.type='button';e.className=cls;e.textContent=label;e.onclick=handler;return e;}
export class AppUI{
 constructor(net,timeline,renderer,controls,audio){Object.assign(this,{net,timeline,renderer,controls,audio});this.boundQuiz='';this.offerId='';this.respawnId='';this.room=null;
  this.banner=document.createElement('div');this.banner.className='ws-connection br-hidden';document.body.append(this.banner);this.bind();this.augments=new AugmentUI(net,message=>this.toast(message));
  for(const type of ['room_state','full_state','snapshot','private_state','error','status','ended','event','overload','leaderboard'])net.addEventListener(type,e=>this.receive(type,e.detail));
  net.addEventListener('static_state',e=>timeline.setStatic(e.detail));net.addEventListener('reset',()=>{timeline.reset();renderer.reset();controls.reset();this.augments?.reset();this.offerId='';});
  net.addEventListener('maintenance',e=>this.toast(e.detail.message));
  setInterval(()=>this.clock(),100);
 }
 toast(message){text('br-toast',message);$('br-toast').classList.add('show');clearTimeout(this.toastTimer);this.toastTimer=setTimeout(()=>$('br-toast').classList.remove('show'),3500);}
 async run(fn){try{await fn();}catch(e){this.toast(e.message);}}
 async ensure(){if(this.net.ws?.readyState!==1)await this.net.connect();}
 bind(){
  const hostCard=$('br-create-btn').parentElement,auth=document.createElement('div');auth.className='ws-auth';const label=document.createElement('label');label.className='br-label';label.htmlFor='ws-host-secret';label.textContent='교사 비밀번호';const input=document.createElement('input');input.id='ws-host-secret';input.type='password';input.className='br-input';input.autocomplete='current-password';auth.append(label,input);hostCard.insertBefore(auth,$('br-create-btn'));
  $('br-create-btn').onclick=()=>this.run(async()=>{await this.ensure();await this.net.authenticate(input.value);input.value='';this.net.send('CREATE',{name:'선생님'},false);});
  $('br-join-btn').onclick=()=>this.run(async()=>{await this.ensure();this.net.send('JOIN',{code:$('br-join-code').value.trim(),name:$('br-player-name').value.trim()},false);});
  $('br-player-name').placeholder='닉네임을 입력하세요';
  const query=new URLSearchParams(location.search),code=query.get('room')||query.get('join');if(/^\d{6}$/.test(code||'')){$('br-join-code').value=code;text('br-invite-room','ROOM '+code+' · 초대받은 방');$('br-invite-room').style.display='block';}
  $('br-question-bank').value=manifest.questions.map(q=>q.join(' | ')).join('\n');
  $('br-start-quiz').onclick=()=>this.run(async()=>{await this.net.command('CONFIGURE',this.config());await this.net.command('START_QUIZ');});
  $('br-skip-to-draft').onclick=()=>this.run(()=>this.net.command('BEGIN_DRAFT'));
  $('br-start-battle').onclick=()=>this.run(()=>this.net.command('START_BATTLE'));
  $('br-force-end').onclick=()=>this.run(()=>this.net.command('END'));
  $('br-rematch-room').onclick=()=>this.run(()=>this.net.command('REMATCH'));
  for(const id of ['br-close-room','br-finish-room','br-results-home'])$(id).onclick=()=>this.run(async()=>{if(this.room?.self.role==='host')await this.net.command('CLOSE_ROOM');this.net.leave();location.reload();});
  $('br-reroll-btn').onclick=()=>this.run(()=>this.net.command('DRAFT_REROLL',{draftRevision:this.room.self.draft.revision}));
  $('br-ready-btn').onclick=()=>this.run(()=>this.net.command('DRAFT_CONFIRM',{draftRevision:this.room.self.draft.revision}));
  $('br-copy-link').onclick=()=>this.run(async()=>{await navigator.clipboard.writeText($('br-join-link').value);this.toast('참가 링크를 복사했습니다.');});
  $('br-quiz-file').onchange=()=>this.run(async()=>{const file=$('br-quiz-file').files[0];if(!file)return;if(file.size>200000)throw Error('문제 파일은 200 KB 이하여야 합니다.');const value=await file.text();await this.net.command('CONFIGURE',{quizText:value});$('br-question-bank').value=value;text('br-quiz-file-status',file.name+' · 서버 검증 완료');});
  $('br-quiz-default').onclick=()=>{$('br-question-bank').value=manifest.questions.map(q=>q.join(' | ')).join('\n');text('br-quiz-file-status','기본 퀴즈 54문제');};
  $('br-open-encyclopedia').onclick=()=>this.encyclopedia();$('br-close-encyclopedia').onclick=()=>show('br-encyclopedia',false);
  $('br-run-ready').onclick=()=>show('br-run-panel');$('br-run-later').onclick=()=>show('br-run-panel',false);
  $('br-tk-keep').onclick=()=>this.run(()=>this.net.command('RESPAWN',{kind:'keep'}));$('br-tk-reroll').onclick=()=>this.run(()=>this.net.command('RESPAWN',{kind:'reroll'}));
  $('br-pref-music').onclick=()=>text('br-pref-music',this.audio.toggle()?'음악 켬':'음악 끔');$('br-music-volume').oninput=e=>{this.audio.volume=Number(e.target.value)/100;this.audio.audio.volume=this.audio.volume;};
  $('br-pref-sound').onclick=()=>{this.audio.effects=!this.audio.effects;text('br-pref-sound',this.audio.effects?'효과음 켬':'효과음 끔');};
  $('br-pref-motion').onclick=()=>{this.renderer.session.reducedMotion=!this.renderer.session.reducedMotion;text('br-pref-motion',this.renderer.session.reducedMotion?'흔들림 줄임':'흔들림 기본');};
  $('br-pref-aim').onclick=()=>{this.controls.assist.enabled=!this.controls.assist.enabled;text('br-pref-aim',this.controls.assist.enabled?'약한 조준 보정 켬':'조준 보정 끔');};
  $('br-focus-toggle').onclick=()=>{this.renderer.focus=!this.renderer.focus;text('br-focus-toggle',this.renderer.focus?'카메라: 전투 집중':'카메라: 전체');};
  for(const id of ['br-tk-host-rank','br-tk-student-rank'])$(id).onclick=()=>show('br-tk-leaderboard');$('br-tk-close-rank').onclick=()=>show('br-tk-leaderboard',false);
  $('br-rank-filters').replaceChildren(...['전체','S','A','B','C','F'].map(rank=>button(rank,()=>{this.rank=rank;this.encyclopedia();},'br-btn br-btn-ghost')));
  $('br-role-filters').replaceChildren(...['전체',...new Set(manifest.roster.map(a=>a.ability.category))].filter(Boolean).map(role=>button(role,()=>{this.roleFilter=role;this.encyclopedia();},'br-btn br-btn-ghost')));
  if(new URLSearchParams(location.search).has('netdebug')){const panel=document.createElement('details');panel.className='ws-debug';const summary=document.createElement('summary');summary.textContent='네트워크 진단';const copy=button('진단 복사',()=>navigator.clipboard.writeText(JSON.stringify(this.diagnostics(),null,2)));this.debug=document.createElement('pre');panel.append(summary,copy,this.debug);document.body.append(panel);}
 }
 config(){return {mapIndex:$('br-map').value==='random'?-1:Number($('br-map').value),mode:$('br-mode').value,teamCount:Number($('br-team-count').value),matchSeconds:Number($('br-match-seconds').value),quizSeconds:Number($('br-quiz-seconds').value),graphicsPreset:$('br-graphics-preset').value,quizText:$('br-question-bank').value};}
 receive(type,p){
  if(type==='room_state')this.renderRoom(p);
  if(type==='leaderboard'){for(const [key,rows]of [['br-tk-team-ranking',p.teams],['br-tk-personal-ranking',p.players]])$(key).replaceChildren(...(rows||[]).map(r=>{const e=document.createElement('div');e.className='ws-teacher-row';e.textContent=r.name?`${r.rank||''} ${r.name} · ${r.kills||0}K / ${r.deaths||0}D / ${r.assists||0}A · ${Number(r.points||0).toFixed(3)}%p`:`팀 ${r.team} · ${Number(r.score||0).toFixed(2)}%`;return e;}));}
  if(type==='full_state'){if(p.static)this.timeline.setStatic(p.static);this.renderRoom(p.room);if(p.self)this.self(p.self);}
  if(type==='snapshot'){if(!this.timeline.accept(p))return;if(p.self)this.self(p.self);this.lastView=p;this.battleHud(p);}
  if(type==='private_state'&&p)this.self(p);
  if(type==='event'){this.timeline.event(p);this.audio.effect(p,this.net.session?.playerId);}
  if(type==='error')this.toast(p.code);
  if(type==='ended'){this.banner.textContent=p||'연결이 종료되었습니다. 다시 참가하세요.';this.banner.classList.remove('br-hidden');this.controls.enabled=false;}
  if(type==='status'){this.banner.textContent=p.connected?'':'연결 복구 중 · 서버에서 경기는 계속됩니다';this.banner.classList.toggle('br-hidden',p.connected);}
  if(type==='overload'){this.banner.replaceChildren();this.banner.classList.toggle('br-hidden',!p.paused);if(p.paused){this.banner.append('서버 처리 지연으로 안전 일시정지되었습니다. ');if(this.room?.self.role==='host')this.banner.append(button('계속',()=>this.run(()=>this.net.command('CONTINUE'))));}}
 }
 screen(id){document.querySelectorAll('.br-screen').forEach(e=>e.classList.add('br-hidden'));show('br-student-battle',id==='br-student-battle');show('br-host-live',id==='br-student-battle'&&this.room?.self.role==='host');show(id);show('br-app',id!=='br-student-battle');}
 renderRoom(room){
  const changed=!this.room||this.room.phase!==room.phase||this.room.matchId!==room.matchId;this.room=room;this.roomAt=performance.now();this.renderer.session.roomMeta=room.config;
  const host=room.self.role==='host';this.renderer.teacher=host;this.renderer.enabled=room.phase==='BATTLE';this.controls.enabled=!host&&room.phase==='BATTLE';show('br-music-controls');
  show('br-tk-host-bar',host&&room.phase==='BATTLE');show('br-tk-student-bar',!host&&room.phase==='BATTLE'&&room.config.mode==='team-capture');if(room.phase!=='BATTLE'){show('br-tk-leaderboard',false);captureHud(null);}
  if(changed){this.audio.phase(room.phase);if(room.phase!=='BATTLE'){this.timeline.reset();this.controls.reset();}}
  if(room.phase==='RESULTS'){this.screen('br-results');this.results(room.result);return;}
  if(room.phase==='BATTLE'){this.screen('br-student-battle');$('br-live-room').querySelector('[data-room-digits]').textContent=room.code;for(const id of ['br-attack','br-skill','br-joystick'])show(id,!host);return;}
  if(host){this.screen('br-host-room');text('br-room-code',room.code);show('br-host-settings',room.phase==='LOBBY');show('br-start-quiz',room.phase==='LOBBY');show('br-skip-to-draft',room.phase==='QUIZ');show('br-start-battle',room.phase==='DRAFT');
   text('br-host-phase-title',{LOBBY:'학생 입장 대기',QUIZ:'퀴즈 진행 중',DRAFT:'이모지 선택 중'}[room.phase]);text('br-host-summary',`참가자 ${room.players.length}명 · 준비 완료 ${room.players.filter(p=>p.ready).length}명`);
   $('br-host-roster').replaceChildren(...room.players.map(p=>{const row=document.createElement('div');row.className='ws-teacher-row';const name=document.createElement('b');name.className='name';name.textContent=p.name;const score=document.createElement('span');score.textContent=`${p.connected?'🟢':'⚪'} ${p.team?'팀 '+p.team+' · ':''}${p.score} 정답 ${p.ready?'✅':''}`;row.append(name,score,button('퇴장',()=>this.run(()=>this.net.command('KICK',{playerId:p.id})),'br-btn br-btn-danger'));return row;}));
   const join=new URL(location.href);join.search='';join.searchParams.set('room',room.code);$('br-join-link').value=join.href;if(this.qrCode!==room.code){this.qrCode=room.code;const canvas=document.createElement('canvas');$('br-qr').replaceChildren(canvas);QRCode.toCanvas(canvas,join.href,{width:180,margin:1}).catch(()=>{});}return;
  }
  text('br-student-room-pill','ROOM '+room.code);text('br-self-summary',room.self.name+' · '+(room.self.team?'팀 '+room.self.team:'개인전'));
  if(room.phase==='LOBBY')this.screen('br-student-wait');
  if(room.phase==='QUIZ'){this.screen('br-quiz');text('br-quiz-room','ROOM '+room.code);this.quiz(room.self.quiz);}
  if(room.phase==='DRAFT'){this.screen('br-draft');const d=room.self.draft,a=manifest.roster.find(a=>a.id===d?.abilityId);if(!a){this.toast('배정 복구를 기다리는 중입니다.');return;}
   text('br-draft-room','ROOM '+room.code);text('br-draft-emoji',a.emoji);text('br-draft-tier',a.tier);$('br-draft-tier').className='br-tier br-tier-'+a.tier;text('br-draft-name',a.name);text('br-draft-desc',a.ability.desc);text('br-draft-skill',`${a.ability.basicSummary} · ${skillDescription(a)}`);text('br-reroll-count',d.rerolls);text('br-draw-odds','S 10% · A 20% · B 25% · C 30% · F 15%');$('br-reroll-btn').disabled=d.ready||d.rerolls===0;$('br-ready-btn').disabled=d.ready;show('br-draft-wait',d.ready);
  }
 }
 quiz(q){if(!q?.question)return;this.quizUnlock=performance.now()+q.lockRemainingMs;text('br-quiz-score',q.score);text('br-quiz-rerolls',Math.floor(q.score/this.room.config.rerollEvery));text('br-quiz-progress','문제 '+q.attempt);text('br-quiz-word',q.question.prompt);
  if(this.boundQuiz!==q.question.id){this.boundQuiz=q.question.id;$('br-quiz-choices').replaceChildren(...q.question.answers.map(a=>button(a.text,()=>this.run(async()=>{const r=await this.net.command('QUIZ_ANSWER',{questionId:q.question.id,attemptId:q.question.attemptId,answerId:a.id});text('br-quiz-feedback',r.correct?'CORRECT!':'TRY AGAIN · 1.5초 뒤 다시 선택');this.quizUnlock=performance.now()+r.lockMs;}),'br-btn br-choice')));}
 }
 self(s){this.selfState=s;this.net.lifeSeq=s.lifeSeq;text('br-battle-self',s.emoji+' '+s.name);text('br-battle-status',`HP ${Math.ceil(s.hp)} / ${Math.round(s.maxHp)}`);$('br-battle-hp').style.width=Math.max(0,s.hp/s.maxHp*100)+'%';
  text('br-attack-cd',s.basicCooldown>0?(s.basicCooldown/60).toFixed(1):'✓');text('br-skill-cd',s.cooldown>0?(s.cooldown/60).toFixed(1):'✓');
  actionHud(s);this.augments.render(s);
  const q=s.respawn;show('br-tk-quiz',!s.alive&&!!q);show('br-respawn',!s.alive&&!q);if(!s.alive&&q){text('br-tk-progress',q.correct+' / 3 CORRECT');text('br-tk-quiz-tokens','🔄 ×'+q.tokens);text('br-tk-word',q.question?.prompt||'부활할 이모지를 선택하세요.');show('br-tk-choice',q.correct>=3);$('br-tk-reroll').disabled=q.tokens<=0;
   if(this.respawnId!==q.question?.id){this.respawnId=q.question?.id;$('br-tk-options').replaceChildren(...(q.question?.answers||[]).map(a=>button(a.text,()=>this.run(async()=>{const r=await this.net.command('RESPAWN',{kind:'answer',questionId:q.question.id,answerId:a.id});text('br-tk-feedback',r.message||'');}))));}}
 }
 battleHud(v){text('br-battle-time',Math.floor(v.simTime/60000)+':'+String(Math.floor(v.simTime/1000)%60).padStart(2,'0'));text('br-battle-alive',v.aliveCount+'명');text('br-battle-mode',this.room?.config.mode==='team-capture'?'팀 점령전':this.room?.config.mode==='team-elim'?'팀 생존전':'개인전');text('br-zone-text',v.capture?v.capture.ph==='FEVER'?'FEVER ×2':v.capture.ph==='OPENING'?'A · C 활성':'A · B · C 활성':v.ring?'안전구역 '+Math.round(v.ring.radius):'');
  captureHud(v.capture,this.renderer.teacher);
 }
 results(result){if(!result)return;const rows=result.players||[],winner=rows[0],card=manifest.roster.find(a=>a.id===winner?.abilityId);text('br-result-winner',result.mode==='team-capture'?(result.tiedTeams?.length>1?'공동 1위 · 무승부':'팀 '+result.teamWinner+' 승리'):`🏆 ${card?.emoji||winner?.emoji||''} ${winner?.name||'경기 종료'}`);
  $('br-ranking').replaceChildren(...rows.map((p,i)=>{const row=document.createElement('div');row.className='ws-result-row';for(const value of [p.rank||i+1,p.name,`${p.kills||0} K / ${p.deaths||0} D`,result.mode==='team-capture'?Number(p.points||0).toFixed(3)+'%p':Math.round(p.damage||0)+' DMG']){const e=document.createElement('span');e.textContent=value;row.append(e);}return row;}));
  resultRecords(result,manifest.roster);
  $('br-awards').replaceChildren(...(result.awards||[]).map(a=>{const e=document.createElement('div');e.className='br-award';e.textContent='🏅 '+a.label+' · '+(a.ids||[a.id]).map(id=>rows.find(p=>p.id===id)?.name||'').join(' · ');return e;}));show('br-host-result-actions',this.room.self.role==='host');
 }
 encyclopedia(){show('br-encyclopedia');text('br-encyclopedia-count','활성 캐릭터 77종');$('br-encyclopedia-grid').className='br-character-grid';$('br-encyclopedia-grid').replaceChildren(...manifest.roster.filter(a=>(!this.rank||this.rank==='전체'||a.tier===this.rank)&&(!this.roleFilter||this.roleFilter==='전체'||a.ability.category===this.roleFilter)).map(a=>{const e=document.createElement('article');e.className='ws-ency-card';const emoji=document.createElement('div');emoji.className='emoji';emoji.textContent=a.emoji;const title=document.createElement('b');title.textContent=a.tier+' · '+a.name;const info=document.createElement('p');info.textContent=`HP ${Math.round(a.maxHp)} · ${a.basic.close?'근접':'원거리'} · ${a.ability.basicSummary} · ${a.ability.skillSummary}`;e.append(emoji,title,info);return e;}));}
 clock(){if(this.room?.phase==='QUIZ'){const left=Math.max(0,Math.ceil((this.room.quizRemainingMs-(performance.now()-this.roomAt))/1000));text('br-host-clock',left+'초');text('br-quiz-timer',left);for(const b of $('br-quiz-choices').children)b.disabled=performance.now()<this.quizUnlock;}if(this.debug)this.debug.textContent=JSON.stringify(this.diagnostics(),null,2);}
 diagnostics(){const stats=a=>{const n=a.slice().sort((a,b)=>a-b);return {count:n.length,avg:n.reduce((a,b)=>a+b,0)/(n.length||1),p95:n[Math.floor(n.length*.95)]||0,max:n.at(-1)||0};};return {판정:'로컬 계측 · 실제 교실 미검증',renderer:this.renderer.pixi?'Pixi 8.20.1':'Canvas',frameMs:stats(this.renderer.frameTimes),appRttMs:this.net.clock.rtt,clockUncertaintyMs:this.net.clock.uncertainty,acceptedTickGapMs:stats(this.timeline.metrics.sourceGaps),arrivalGapMs:stats(this.timeline.metrics.arrivalGaps),selfCorrectionWorldUnits:stats(this.timeline.metrics.corrections),holdFrames:this.timeline.metrics.holds,viewport:[innerWidth,innerHeight],DPR:devicePixelRatio,quality:this.room?.config.graphicsPreset};}
}




