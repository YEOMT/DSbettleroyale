import {drawRuleText} from '../../../../packages/content/src/battle-rules.js';
import {manifest} from '../../../../packages/content/src/manifest.js';
import {QuizClock} from './quiz-clock.js';
const $=id=>document.getElementById(id);
function node(tag,text,cls){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=String(text);return e;}
export function deathCauseText(c){
 if(!c)return '원인 정보 없음';
 const kind={zone:'자기장',dot:'지속 피해',reflection:'반사 피해',environment:'환경 피해',wall:'벽 충돌',unknown:'원인 정보 없음'}[c.kind];
 const a=manifest.roster.find(a=>a.id===c.ability);
 return (kind||[a?.name,c.skill].filter(Boolean).join(' ')||'공격')+(c.sourceName?' · '+c.sourceName:'');
}
function recordsCard(s,mode,final=false){
 const card=node('section',undefined,'br-personal-card');
 card.append(node('div',(s.emoji||s.abilityEmoji||'')+' '+s.name,'br-personal-name'));
 card.append(node('small',manifest.roster.find(a=>a.id===s.abilityId)?.name||s.abilityName||''));
 card.append(node('p',mode==='solo'?(s.rank?String(s.rank)+'위':'순위 확정 대기'):(final?'팀 '+s.team+' 경기 결과':'개인 탈락 · 팀 경기 진행 중')));
 card.append(node('strong','처치 '+s.kills+' · 도달 Lv.'+s.level));
 if(final&&s.points!==undefined)card.append(node('p','점령 기여 '+Number(s.points).toFixed(3)+'%p'+(s.assists!==undefined?' · 도움 '+s.assists:'')));
 if(!final)card.append(node('p',deathCauseText(s.cause),'br-personal-cause'),node('small','탈락 당시 기록 · 남아 있는 공격의 추가 기록은 최종 결과에 반영됩니다.'));
 return card;
}
export class ResultFlow{
 constructor(ui){this.ui=ui;this.clock=new QuizClock();this.presentationId='';this.fanfareId='';
  for(const id of ['br-eliminated','br-victory']){const e=node('section',undefined,'br-screen br-hidden br-post-battle');e.id=id;$('br-app').append(e);}
 }
 reset(matchId){if(this.matchId===matchId)return;this.matchId=matchId;this.clock.reset();this.presentationId='';this.fanfareId='';this.resultId='';for(const id of ['br-eliminated','br-victory'])$(id).replaceChildren();}
 eliminated(participation){
  const ui=this.ui;if(ui.room?.phase!=='BATTLE'||participation.state!=='eliminated')return;
  ui.stopBattle();const s=participation.summary,card=$('br-eliminated');card.replaceChildren(node('h1','이번 경기에서 탈락했어요'));
  if(s)card.append(recordsCard(s,ui.room.config.mode));
  card.append(node('p','교실 화면에서 이어서 관전하세요.'),node('p','결과와 같은 방 재경기를 기다리고 있어요.'),node('small',drawRuleText(ui.room.config.drawRule)));
  ui.screen('br-eliminated');
 }
 accept(room){
  this.reset(room.matchId);const p=room.resultPresentation;
  if(!p){this.presentationId='';this.clock.reset();return this.showResults(room);}
  this.presentationId=p.id;
  const serverNow=Math.max(room.serverTime,performance.now()+(this.ui.net.serverWallOffset??-Infinity));
  this.clock.accept({phase:'QUIZ',matchId:room.matchId,quizEndsAt:p.showResultsAt,serverTime:serverNow,config:{quizSeconds:3.5}});
  if(!this.clock.remaining())return this.showResults(room);
  const card=$('br-victory');card.replaceChildren(node('div',p.emoji,'br-winner-emoji'),node('h1','최후의 생존자!'),node('h2',p.winnerName),node('p',drawRuleText(room.config.drawRule)));
  this.ui.screen('br-victory');$('br-rematch-room').disabled=true;
  // A late restore/hidden tab never starts an old melody. One current ID only.
  if(this.fanfareId!==p.id){this.fanfareId=p.id;let played=false;try{played=sessionStorage.getItem('dsbr-result-sound')===p.id;sessionStorage.setItem('dsbr-result-sound',p.id);}catch{}if(!played&&room.self.role==='host'&&serverNow-p.startedAt<1000&&!document.hidden)this.ui.audio.victory();}
 }
 advance(){const room=this.ui.room;if(room?.phase==='RESULTS'&&this.presentationId&&!this.clock.remaining())this.showResults(room);}
 showResults(room){
  this.presentationId='';this.ui.screen('br-results');$('br-rematch-room').disabled=!!this.ui.rematchPending;
  if(this.resultId!==room.result?.resultId){this.resultId=room.result?.resultId;this.ui.results(room.result);}
 }
 decorate(result){
  const room=this.ui.room,host=room.self.role==='host';let head=$('br-personal-result');if(!head){head=node('section');head.id='br-personal-result';$('br-results').prepend(head);}
  head.replaceChildren(node('h2',drawRuleText(result.drawRule)));
  const own=result.players?.find(p=>p.id===room.self.id);
  if(!host&&own){head.append(recordsCard(own,result.mode,true));if(result.mode!=='solo')head.append(node('p',result.teamWinner?result.teamWinner===own.team?'우리 팀 승리':'경기 종료 · 팀 '+result.teamWinner+' 승리':'경기 종료 · 팀 결과는 아래 기록을 확인하세요.'));}
  // All original awards/team panels remain. Missing statistics stay unavailable.
  const rows=result.players||[],table=node('table'),titles=table.createTHead().insertRow(),body=table.createTBody();
  const columns=[['rank','순위'],['name','이름'],['team','팀'],['abilityId','캐릭터'],['level','레벨'],['kills','처치'],['deaths','사망'],['damage','피해량'],['damageDealt','누적 피해량'],['taken','받은 피해'],['points','점령 기여'],['assists','도움'],['pointKills','거점 처치'],['pointAssists','거점 도움'],['scoringSeconds','득점 참여'],['heal','회복'],['shield','보호'],['quizCorrect','퀴즈 정답'],['rerollCount','리롤'],['survival','생존 시간']].filter(([key])=>(key!=='damageDealt'||!rows.some(r=>r.damage!==undefined))&&rows.some(r=>r[key]!==undefined&&r[key]!==null));
  for(const [,title]of columns)titles.append(node('th',title));
  for(const r of rows){const row=body.insertRow();for(const [key]of columns){let value=r[key];if(key==='abilityId')value=(r.usedAbilities||r.abilityHistory||r.emojiHistory||[r.abilityId]).map(a=>{const item=manifest.roster.find(c=>c.id===(typeof a==='string'?a:a.abilityId));return item?item.emoji+' '+item.name:'';}).join(' · ');row.insertCell().textContent=value===undefined||value===null?'—':typeof value==='number'&&!Number.isInteger(value)?value.toFixed(1):String(value);}}
  $('br-ranking').classList.add('br-tk-records');$('br-ranking').replaceChildren(table);
 }
}
