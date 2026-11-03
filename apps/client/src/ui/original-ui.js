import {display} from '../../../../packages/content/src/display.js';
// Original final v32.1 DOM renderers. Receives authoritative server results/boards only.
import {manifest} from '../../../../packages/content/src/manifest.js';
import {captureHud} from './battle.js';
export function createOriginalUI(session,screen){
const BRMP=session,brEl=id=>document.getElementById(id),brSetText=(e,v)=>{if(e)e.textContent=String(v??'');},brShow=screen,brNetDebug=null;
const BR_ROSTER_VERSION=display.rosterVersion,EMOJI_DB=manifest.roster.map(r=>r.ability),BR_ROSTER_INDEX=new Map(EMOJI_DB.map((a,i)=>[a.id,i])),BR_ROSTER_HISTORY=manifest.history,BR_LEGACY_ROSTER=manifest.retired;
const BR_TEAM_LABELS=['개인','BLUE','RED','GREEN','YELLOW'],BR_CAPTURE_RULES=manifest.capture,BR_DEFAULT_QUESTIONS=manifest.questions,BR_PHASES=['lobby','quiz','draft','battle','results'];
const brLegacyAbility=index=>manifest.history['emoji86-player-v9']?.[index],brRespawnMode=mode=>['team-capture','team-respawn'].includes(mode),brRingKey=()=>BRMP.matchKey,brCaptureHUD=(packet,host)=>captureHud(packet,host);
function brRenderResults(result) {
            if(!result)return;
            if(brNetDebug)brNetDebug.finish(result);
            brTKResetUI();
            if(result.mode==='team-capture'){brCaptureRenderResults(result);return;}
            if(result.mode==='team-respawn'){brTKRenderResults(result);return;}
            brEl('br-tk-result-teams').classList.add('br-hidden');brEl('br-tk-fun-awards').classList.add('br-hidden');
            brEl('br-awards').classList.remove('br-tk-awards');brEl('br-ranking').classList.remove('br-tk-records');brSetText(brEl('br-ranking-title'),'전체 순위');
            brShow('br-results');
            var rows=Array.isArray(result.players)?result.players:Object.values(result.players||{});
            var winner=rows.find(function(r){return String(r.id)===String(result.winnerId);})||rows[0];
            var win=brEl('br-result-winner'),winnerAbility=brResultAbility(winner,result.rosterVersion);
            if(Number(result.teamWinner||0)>0) {
                win.innerHTML='<div class="br-big-emoji">'+(winner?brEscape(winnerAbility.e):'🏆')+'</div><h1 style="margin:5px 0;color:#fde68a">'+
                    brEscape(BR_TEAM_LABELS[Number(result.teamWinner)]||('팀 '+result.teamWinner))+' 우승!</h1><p class="br-small">우승팀 에이스 · '+brEscape(winner?winner.name:'-')+'</p>';
            } else {
                win.innerHTML='<div class="br-big-emoji">'+(winner?brEscape(winnerAbility.e):'🏆')+'</div><h1 style="margin:5px 0;color:#fde68a">'+
                    brEscape(winner?winner.name:'-')+' 우승!</h1><p class="br-small">'+(winner?winner.tier+'급 · '+brEscape(winnerAbility.n):'')+'</p>';
            }
            var awardBox=brEl('br-awards');awardBox.innerHTML='';
            var awards=Array.isArray(result.awards)?result.awards:Object.values(result.awards||{});
            awards.forEach(function(a){
                var p=rows.find(function(r){return String(r.id)===String(a.id);});
                var div=document.createElement('div');div.className='br-award';
                div.innerHTML='<div class="br-award-icon">'+a.icon+'</div><div class="br-small">'+brEscape(a.label)+'</div><b style="display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+
                    brEscape(p?p.name:'-')+'</b><span class="br-small">'+brEscape(a.detail)+'</span>';
                awardBox.appendChild(div);
            });
            var list=brEl('br-ranking');list.innerHTML='';
            rows.sort(function(a,b){return Number(a.rank)-Number(b.rank);}).forEach(function(r){
                var a=brResultAbility(r,result.rosterVersion), row=document.createElement('div');
                row.className='br-rank '+(Number(r.rank)===1?'top1':'');
                var badge=Number(r.rank)===1?'🥇':Number(r.rank)===2?'🥈':Number(r.rank)===3?'🥉':String(r.rank);
                row.innerHTML='<div class="br-rank-num">'+badge+'</div><div style="font-size:29px">'+brEscape(a.e)+'</div>'+
                    '<div><b>'+brEscape(r.name)+'</b><div class="br-small">'+brEscape(a.t)+'급 · '+brEscape(a.n)+(r.team?' · '+brEscape(BR_TEAM_LABELS[r.team]||('팀 '+r.team)):'')+'</div></div>'+
                    '<b style="color:#fb7185">⚔ '+Number(r.kills||0)+'</b><span class="br-small br-hide-mobile">💥 '+Number(r.damage||0)+'</span>'+
                    '<span class="br-small br-hide-mobile">'+(brRespawnMode(result.mode)?'☠ '+Number(r.deaths||0):brFormatTime(Number(r.survival||0)))+'</span>';
                list.appendChild(row);
            });
            brEl('br-host-result-actions').classList.toggle('br-hidden',BRMP.role!=='host');
            brEl('br-results-home').classList.toggle('br-hidden',BRMP.role==='host');
        }

function brTKRenderResults(result) {
            brShow('br-results');
            const rows=Array.isArray(result.players)?result.players:Object.values(result.players||{}),teams=Array.isArray(result.teams)?result.teams:Object.values(result.teams||{});
            const win=brEl('br-result-winner'),meta=brTKTeamMeta(result.teamWinner);
            const first=teams.find(function(t){return t.team===Number(result.teamWinner);});
            win.innerHTML='<div class="br-small" style="letter-spacing:.15em">TEAM RESULT</div><div class="br-big-emoji">🏆</div><h1 style="margin:5px 0;color:'+meta.color+'">'+(result.teamWinner?meta.name+' WINS':'공동 1위 · 경기 종료')+'</h1><p class="br-small">'+(first?first.score+' KILLS · ':'')+(result.suddenDeath?'SUDDEN DEATH · ':'')+brFormatTime(Number(result.duration||0))+'</p>';
            const teamBox=brEl('br-tk-result-teams');teamBox.classList.remove('br-hidden');
            teamBox.innerHTML=teams.map(function(t){const tm=brTKTeamMeta(t.team),medal=t.rank===1?'🥇':t.rank===2?'🥈':t.rank===3?'🥉':t.rank+'.';return '<div class="br-tk-team-result" style="--tk-color:'+tm.color+'"><b>'+medal+' '+tm.name+'</b><strong>'+Number(t.score||0)+'</strong> KILLS'+(teams.length===2?'<span class="br-small" style="float:right">'+(Number(result.teamWinner)===t.team?'WIN':result.teamWinner?'LOSE':'TIE')+'</span>':'')+'</div>';}).join('');
            const renderAwards=function(el,awards){el.innerHTML=(Array.isArray(awards)?awards:Object.values(awards||{})).map(function(a){const p=rows.find(function(r){return r.id===a.id;});return '<div class="br-award"><div class="br-award-icon">'+brEscape(a.icon)+'</div><div class="br-small">'+brEscape(a.label)+'</div><b style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+brEscape(p?p.name:'해당 없음')+'</b><span class="br-small">'+brEscape(a.detail)+'</span></div>';}).join('');};
            brEl('br-awards').classList.add('br-tk-awards');renderAwards(brEl('br-awards'),result.awards);
            brEl('br-tk-fun-awards').classList.remove('br-hidden');renderAwards(brEl('br-tk-fun-awards'),result.funAwards);
            brSetText(brEl('br-ranking-title'),'개인 전체 기록');const list=brEl('br-ranking');list.classList.add('br-tk-records');
            list.innerHTML='<table><thead><tr><th>순위</th><th>이름</th><th>Team</th><th>Character</th><th>K</th><th>D</th><th>Damage</th><th>Best Streak</th><th>Quiz 정답</th><th>Reroll</th></tr></thead><tbody>'+rows.slice().sort(function(a,b){return a.rank-b.rank;}).map(function(r){const a=brResultAbility(r,result.rosterVersion),tm=brTKTeamMeta(r.team);return '<tr><td>'+r.rank+'</td><td><b>'+brEscape(r.name)+'</b></td><td style="color:'+tm.color+'">'+tm.name+'</td><td>'+brEscape(a.e)+' '+brEscape(a.n)+' <span class="br-small">'+brEscape(r.tier)+'급</span></td><td><b>'+r.kills+'</b></td><td>'+r.deaths+'</td><td>'+Number(r.damage||0).toLocaleString()+'</td><td>'+r.bestStreak+'</td><td>'+r.quizCorrect+'</td><td>'+r.rerollCount+'</td></tr>';}).join('')+'</tbody></table>';
            brEl('br-host-result-actions').classList.toggle('br-hidden',BRMP.role!=='host');brEl('br-results-home').classList.toggle('br-hidden',BRMP.role==='host');
        }

function brCaptureRenderResults(result){brShow('br-results');const rows=Array.isArray(result.players)?result.players:Object.values(result.players||{}),teams=Array.isArray(result.teams)?result.teams:Object.values(result.teams||{}),winners=result.tiedTeams||[result.teamWinner];
            brEl('br-result-winner').innerHTML='<div class="br-small">CAPTURE RESULT</div><div class="br-big-emoji">🚩</div><h1 class="br-cap-winner-name">'+(winners.length>1?'공동 1위 · 무승부':brTKTeamMeta(winners[0]).name+' 승리')+'</h1><p>'+winners.map(t=>'<b style="color:'+brTKTeamMeta(t).color+'">'+brTKTeamMeta(t).name+'</b>').join(' · ')+' · '+brFormatTime(Math.ceil(result.duration))+'</p>';
            const box=brEl('br-tk-result-teams');box.classList.remove('br-hidden');box.innerHTML=teams.map(t=>'<div class="br-tk-team-result" style="--tk-color:'+brTKTeamMeta(t.team).color+'"><b>'+t.rank+' · '+brTKTeamMeta(t.team).name+'</b><strong>'+brCapturePercent(t.score)+'%</strong></div>').join('');
            brEl('br-tk-fun-awards').classList.add('br-hidden');brEl('br-awards').classList.add('br-tk-awards');brEl('br-awards').innerHTML=(result.awards||[]).map(a=>{const players=(a.ids||[]).map(id=>rows.find(r=>r.id===id)).filter(Boolean);return '<div class="br-award'+(a.key==='capture'?' br-cap-main-award':'')+'"><div class="br-award-icon">'+({capture:'🚩',combat:'⚔️',support:'🛡️'}[a.key])+'</div><b>'+brEscape(a.label)+'</b><p>'+ (players.length?players.map(p=>brEscape(p.name)).join(' · '):'해당 기록 없음')+'</p><strong class="br-cap-award-value">'+(players.length?(a.key==='capture'?'획득 점령 포인트 '+Number(players[0].points||0).toFixed(3):a.key==='combat'?'거점 '+players[0].pointKills+' 처치 · '+players[0].pointAssists+' 도움':'실제 아군 지원 '+Math.floor(Number(players[0].heal||0)+Number(players[0].shield||0))+' HP'):'')+'</strong><small>'+({capture:'실제 점령 기여 · 동률 공동 수상',combat:'거점 처치 + 5초 이내 실피해 도움',support:'아군 실제 회복 + 보호막 실제 흡수'}[a.key])+'</small></div>';}).join('');
            brSetText(brEl('br-ranking-title'),'개인 점령 기여와 경기 기록');const list=brEl('br-ranking');list.classList.add('br-tk-records');list.innerHTML='<table><thead><tr><th>순위</th><th>이름</th><th>팀</th><th>사용 이모지</th><th>점령 기여</th><th>K / D / A</th><th>Damage</th><th>거점 K / A</th><th>득점 참여</th><th>회복 / 보호</th><th>퀴즈 / 리롤</th></tr></thead><tbody>'+rows.map(r=>'<tr><td>'+r.rank+'</td><td>'+brEscape(r.name)+'</td><td style="color:'+brTKTeamMeta(r.team).color+'">'+brTKTeamMeta(r.team).name+'</td><td class="br-used-emojis">'+brCaptureHistoryHTML(r,result.rosterVersion)+'</td><td><b>'+Number(r.points||0).toFixed(3)+'%p</b></td><td>'+r.kills+' / '+r.deaths+' / '+Number(r.assists||0)+'</td><td>'+Math.round(r.damageDealt||0).toLocaleString()+'</td><td>'+Number(r.pointKills||0)+' / '+Number(r.pointAssists||0)+'</td><td>'+brFormatTime(Math.floor(r.scoringSeconds||0))+'</td><td>'+Math.floor(r.heal||0)+' / '+Math.floor(r.shield||0)+'</td><td>'+r.quizCorrect+' / '+r.rerollCount+'</td></tr>').join('')+'</tbody></table>';
            brEl('br-host-result-actions').classList.toggle('br-hidden',BRMP.role!=='host');brEl('br-results-home').classList.toggle('br-hidden',BRMP.role==='host');}

function brTKRenderBoard(board) {
            if(board?.capture)return brCaptureRenderBoard(board);
            if(!BRMP.tkBoardOpen||!board)return;
            const signature=String(board.matchKey)+':'+board.revision;
            if(BRMP.tkPanelRendered===signature)return;BRMP.tkPanelRendered=signature;
            brEl('br-tk-team-ranking').innerHTML=board.teams.map(function(t){const meta=brTKTeamMeta(t.team);return '<div class="br-tk-team-row"><b>'+t.rank+'</b><b style="color:'+meta.color+'">'+meta.dot+' '+meta.name+(board.suddenDeath&&board.contenders.includes(t.team)?' · SD':'')+'</b><b>'+t.score+' K</b></div>';}).join('');
            brEl('br-tk-personal-ranking').innerHTML=board.players.map(function(p){const meta=brTKTeamMeta(p.team);return '<div class="br-tk-player-row'+(p.id===String(BRMP.playerId)?' is-self':'')+'"><b>'+p.rank+'</b><span class="br-tk-name"><b style="color:'+meta.color+'">'+meta.dot+'</b> '+brEscape(p.name)+'</span><span>'+p.kills+' K / '+p.deaths+' D<small>'+p.damage.toLocaleString()+' DMG</small></span></div>';}).join('');
        }

function brCaptureRenderBoard(board){if(!BRMP.tkBoardOpen)return;const key='capture:'+board.matchKey+':'+board.revision;if(BRMP.tkPanelRendered===key)return;BRMP.tkPanelRendered=key;
            brEl('br-tk-team-ranking').innerHTML=board.teams.map(t=>{const tm=brTKTeamMeta(t.team);return '<div class="br-tk-team-row"><b>'+t.rank+'</b><b style="color:'+tm.color+'">'+tm.dot+' '+tm.name+'</b><b>'+brCapturePercent(t.score)+'%</b></div>';}).join('');
            brEl('br-tk-personal-ranking').innerHTML=board.players.map(p=>'<div class="br-tk-player-row'+(p.id===String(BRMP.playerId)?' is-self':'')+'"><b>'+p.rank+'</b><span class="br-tk-name" style="color:'+brTKTeamMeta(p.team).color+'">'+brEscape(p.name)+'</span><span><b>'+brCapturePercent(p.points||0)+'%p</b><small>'+p.kills+' K / '+p.deaths+' D / '+Number(p.assists||0)+' A · 거점 '+Number(p.pointKills||0)+' K / '+Number(p.pointAssists||0)+' A</small></span></div>').join('');}

function brTKRenderLive(board,isHost) {
            if(board?.capture)return brCaptureRenderLive(board,isHost);
            if(!board||board.matchKey!==brRingKey())return;
            BRMP.tkClientBoard=board;
            const marker=String(board.matchKey)+':'+board.revision+':'+(isHost?'h':'s');
            if(BRMP.tkRendered===marker)return;
            BRMP.tkRendered=marker;
            if(isHost) {
                brEl('br-tk-host-bar').classList.remove('br-hidden');brEl('game-screen').classList.add('br-tk-host');
                brEl('br-tk-host-scores').innerHTML=brTKScoreHTML(board.teams,false);
                brSetText(brEl('br-tk-host-clock'),board.suddenDeath?'SUDDEN DEATH':brFormatTime(board.clock));
                brEl('br-tk-host-clock').classList.toggle('br-tk-sudden',!!board.suddenDeath);
                const top=board.players[0],streak=board.players.slice().sort(function(a,b){return b.streak-a.streak||b.kills-a.kills||brTKStable(a,b);})[0];
                brSetText(brEl('br-tk-host-top'),top?'TOP KILLER · '+top.name+' '+top.kills+' K':'TOP KILLER · —');
                brSetText(brEl('br-tk-host-streak'),streak&&streak.streak?'🔥 '+streak.name+' · '+streak.streak+' 연속 처치':'연속 처치 · —');
            } else {
                brEl('br-tk-student-tools').classList.remove('br-hidden');brEl('br-tk-student-scores').innerHTML=brTKScoreHTML(board.teams,true);
                brEl('br-tk-student-feed').innerHTML=(board.feed||[]).slice(0,3).map(function(e){return '<div><span style="color:'+brTKTeamMeta(e.killerTeam).color+'">'+brTKTeamMeta(e.killerTeam).dot+' '+brEscape(e.killerName)+'</span> → <span style="color:'+brTKTeamMeta(e.victimTeam).color+'">'+brTKTeamMeta(e.victimTeam).dot+' '+brEscape(e.victimName)+'</span></div>';}).join('');
            }
            if(BRMP.tkBoardOpen)brTKRenderBoard(board);
        }

function brCaptureRenderLive(board,isHost){if(!board||board.matchKey!==brRingKey())return;BRMP.tkClientBoard=board;brEl('br-tk-host-bar').classList.add('br-hidden');brEl('br-tk-student-scores').innerHTML='';
            if(!isHost){brEl('br-tk-student-tools').classList.remove('br-hidden');brEl('br-tk-student-feed').innerHTML=(board.feed||[]).slice(0,2).map(e=>'<div><span style="color:'+brTKTeamMeta(e.killerTeam).color+'">'+brEscape(e.killerName)+'</span> → <span style="color:'+brTKTeamMeta(e.victimTeam).color+'">'+brEscape(e.victimName)+'</span></div>').join('');}
            if(BRMP.tkBoardOpen)brCaptureRenderBoard(board);if(BRMP.captureState)brCaptureHUD(BRMP.captureState,isHost);}

function brTKTeamMeta(team) {
            return [{name:'TEAM',short:'T',color:'#cbd5e1',dot:'⚪'},{name:'BLUE',short:'B',color:'#3b82f6',dot:'🔵'},
                {name:'RED',short:'R',color:'#ef4444',dot:'🔴'},{name:'GREEN',short:'G',color:'#22c55e',dot:'🟢'},
                {name:'YELLOW',short:'Y',color:'#eab308',dot:'🟡'}][Number(team)]||{name:'TEAM',short:'T',color:'#cbd5e1',dot:'⚪'};
        }

function brTKScoreHTML(teams,short) {
            return teams.slice().sort(function(a,b){return a.team-b.team;}).map(function(t){const meta=brTKTeamMeta(t.team);return '<span style="color:'+meta.color+'">'+(short?meta.short:meta.name)+' <b>'+Number(t.score||0)+'</b></span>';}).join('');
        }

function brCaptureHistoryHTML(row,rosterVersion=BR_ROSTER_VERSION){const ids=Array.isArray(row.usedAbilities)?row.usedAbilities:[];return ids.map(id=>{const a=brResultAbility({abilityId:id,rosterVersion:row.rosterVersion||rosterVersion},row.rosterVersion||rosterVersion);return a?'<span title="'+brEscape(a.n)+'">'+brEscape(a.e)+'</span>':'?';}).join(' → ')||'—';}

function brCapturePercent(n){return (n>=100-1e-8?100:Math.floor((Math.max(0,n)+BR_CAPTURE_RULES.epsilon)*10)/10).toFixed(1);}

function brResultAbility(record,resultVersion) {
            record=record||{};
            var version=record.rosterVersion||resultVersion,index=record.abilityIndex==null||record.abilityIndex===''?-1:Number(record.abilityIndex);
            var history=BR_ROSTER_HISTORY[version],ability=null,id=record.abilityId;
            if(version===BR_ROSTER_VERSION){
                if(id&&BR_ROSTER_INDEX.has(id))ability=EMOJI_DB[BR_ROSTER_INDEX.get(id)];
                else if(!id&&Number.isInteger(index)&&index>=0)ability=EMOJI_DB[index]||null;
            }else if(history){
                ability=id?history.find(function(a){return a.id===id;}):Number.isInteger(index)&&index>=0?history[index]:null;
            }
            if(!ability&&id)ability=BR_LEGACY_ROSTER.find(function(a){return a.id===id;});
            if(!ability&&!version&&Number.isInteger(index)&&index>=0)ability=brLegacyAbility(index);
            return {id:id||ability?.id||'',t:record.tier||ability?.t||'?',n:record.abilityName||ability?.n||'이전 캐릭터',e:record.abilityEmoji||ability?.e||'❔'};
        }

function brTKResetUI() {
            brEl('br-capture-scoreboard')?.classList.add('br-hidden');document.body?.classList.remove('br-capture-host','br-capture-student');BRMP.captureHUDKey='';
            BRMP.tkBoardOpen=false;BRMP.tkRendered='';BRMP.tkPanelRendered='';BRMP.tkClientBoard=null;BRMP.tkBoardSent={};
            ['br-tk-host-bar','br-tk-student-tools','br-tk-leaderboard'].forEach(function(id){const el=brEl(id);if(el)el.classList.add('br-hidden');});
            const host=brEl('game-screen');if(host)host.classList.remove('br-tk-host');
            const feed=brEl('br-tk-student-feed');if(feed)feed.innerHTML='';
            ['br-tk-student-rank','br-tk-host-rank'].forEach(function(id){const el=brEl(id);if(el)el.setAttribute('aria-expanded','false');});
        }

function brLoadPlayPrefs(){
            let p={};try{p=JSON.parse(localStorage.getItem('br_play_prefs_v1')||'{}')||{};}catch(_){}
            BRMP.soundMuted=!!p.muted;BRMP.aimHelpEnabled=p.aimHelp!==false;
            BRMP.reducedMotion=typeof p.reduceMotion==='boolean'?p.reduceMotion:!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
            brRenderPlayPrefs();
        }

function brRenderPlayPrefs(){
            brSetText(brEl('br-pref-aim'),BRMP.aimHelpEnabled===false?'조준 도움 끔':'조준 도움 켬');brEl('br-pref-aim').setAttribute('aria-pressed',String(BRMP.aimHelpEnabled!==false));
            brSetText(brEl('br-pref-sound'),BRMP.soundMuted?'효과음 끔':'효과음 켬');
            brEl('br-pref-sound').setAttribute('aria-pressed',String(!!BRMP.soundMuted));
            brSetText(brEl('br-pref-motion'),BRMP.reducedMotion?'흔들림 줄임':'흔들림 기본');
            brEl('br-pref-motion').setAttribute('aria-pressed',String(!!BRMP.reducedMotion));
        }

function brSavePlayPrefs(){try{localStorage.setItem('br_play_prefs_v1',JSON.stringify({muted:!!BRMP.soundMuted,reduceMotion:!!BRMP.reducedMotion,aimHelp:BRMP.aimHelpEnabled!==false}));}catch(_){}brRenderPlayPrefs();}

function brSetHostStage(phase) {
            var idx=BR_PHASES.indexOf(phase);
            Array.prototype.forEach.call(document.querySelectorAll('#br-host-stages .br-stage-item'),function(node){
                var n=BR_PHASES.indexOf(node.getAttribute('data-stage'));
                node.classList.toggle('active',n===idx); node.classList.toggle('done',n<idx);
            });
        }

function brRenderQuizImport(result,fileName,isDefault) {
            var status=brEl('br-quiz-file-status'),preview=brEl('br-quiz-preview');if(!status||!preview)return;
            status.className='br-file-status';preview.innerHTML='';
            if(isDefault) {
                status.textContent='기본 퀴즈 '+BR_DEFAULT_QUESTIONS.length+'문제를 사용합니다.';
                status.classList.add('ok');return;
            }
            var valid=result&&result.questions?result.questions.length:0,errorCount=result&&result.errors?result.errors.length:0;
            status.textContent=(fileName?fileName+' · ':'')+valid+'문제 불러오기 완료 · '+errorCount+'줄 형식 오류'+(valid<4?' · 최소 4문제가 필요합니다.':'');
            status.classList.add(valid<4?'error':(errorCount?'warn':'ok'));
            (result.questions||[]).slice(0,3).forEach(function(row,index){
                var line=document.createElement('div');line.innerHTML='<b>미리보기 '+(index+1)+'</b> · '+brEscape(row.join(' · '));preview.appendChild(line);
            });
            (result.errors||[]).slice(0,4).forEach(function(error){
                var line=document.createElement('div');line.style.color='#fda4af';line.textContent=(error.line?error.line+'번째 줄: ':'')+error.message;preview.appendChild(line);
            });
            if(errorCount>4){var more=document.createElement('div');more.textContent='외 '+(errorCount-4)+'개 오류';preview.appendChild(more);}
        }

function brValidateQuestionText(text) {
            var lines=String(text||'').replace(/^\uFEFF/,'').split(/\r\n|\n|\r/),questions=[],errors=[],nonEmpty=0;
            lines.forEach(function(raw,lineIndex){
                var line=String(raw||'').trim();if(!line)return;
                nonEmpty++;
                if(questions.length>=500){errors.push({line:lineIndex+1,message:'최대 500문제까지만 불러올 수 있습니다.'});return;}
                var parts=line.split('|').map(function(value){return String(value||'').trim();});
                if(parts.length!==5){errors.push({line:lineIndex+1,message:'항목 수 오류 · 문제, 정답, 오답 3개가 필요합니다.'});return;}
                if(parts.some(function(value){return !brNormalizeQuizText(value);})){
                    errors.push({line:lineIndex+1,message:'빈 항목이 있습니다.'});return;
                }
                var optionKeys=parts.slice(1).map(brNormalizeQuizText);
                if(new Set(optionKeys).size!==4){errors.push({line:lineIndex+1,message:'정답과 오답 보기는 서로 달라야 합니다.'});return;}
                if(!brPrepareQuizQuestion(parts,questions.length)){
                    errors.push({line:lineIndex+1,message:'문제 형식을 읽을 수 없습니다.'});return;
                }
                questions.push(parts);
            });
            return {questions:questions,errors:errors,total:nonEmpty};
        }

function brEscape(v) {
            return String(v == null ? '' : v).replace(/[&<>"']/g,function(c){
                return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
            });
        }

function brFormatTime(totalSec) {
            totalSec=Math.max(0,Math.ceil(totalSec||0));
            return String(Math.floor(totalSec/60)).padStart(2,'0')+':'+String(totalSec%60).padStart(2,'0');
        }

function brTKStable(a,b){return String(a.id).localeCompare(String(b.id));}
function brNormalizeQuizText(value) {
            var text=String(value==null?'':value);
            try{text=text.normalize('NFKC');}catch(e){}
            return text.replace(/[\u200B-\u200D\uFEFF]/g,'').replace(/\s+/g,' ').trim().toLocaleLowerCase('ko-KR');
        }
function brQuizHash(value) {
            var text=brNormalizeQuizText(value),h=2166136261>>>0;
            for(var i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}
            return (h>>>0).toString(36);
        }
function brPrepareQuizQuestion(raw,index) {
            var prompt='',values=[];
            if(Array.isArray(raw)){prompt=raw[0];values=raw.slice(1,5);}
            else if(raw&&typeof raw==='object'&&Object.prototype.hasOwnProperty.call(raw,'0')){
                prompt=raw[0];values=[raw[1],raw[2],raw[3],raw[4]];
            }
            else if(raw&&typeof raw==='object'){
                prompt=raw.prompt||raw.word||'';
                values=Array.isArray(raw.options)?raw.options.slice(0,4):[raw.answer,raw.wrong1,raw.wrong2,raw.wrong3];
            }
            prompt=String(prompt==null?'':prompt).trim();
            var correctText=String(values[0]==null?'':values[0]).trim(),correctNorm=brNormalizeQuizText(correctText);
            var qid='q-'+index+'-'+brQuizHash(prompt+'|'+correctNorm),seen=new Set(),answers=[];
            values.forEach(function(value,optionIndex){
                var text=String(value==null?'':value).trim(),normalized=brNormalizeQuizText(text);
                if(!normalized||seen.has(normalized))return;
                seen.add(normalized);
                answers.push({id:qid+(optionIndex===0?':answer':':choice-'+optionIndex),text:text,normalized:normalized,isCorrect:normalized===correctNorm});
            });
            if(!prompt||!correctNorm||answers.length<2)return null;
            return {id:qid,prompt:prompt,correctId:qid+':answer',correctNormalized:correctNorm,answers:answers};
        }
const brAbilityCategory=a=>display.cards[a.id]?.category||'기타',brEffectiveBasicText=a=>display.cards[a.id]?.basic||'',brEffectiveSkillText=a=>display.cards[a.id]?.skill||'',brPassiveText=a=>display.cards[a.id]?.passive||'',brReworkDefinition=a=>manifest.reworkDefinitions[a.id];
BRMP.encyclopediaRank='ALL';BRMP.encyclopediaRole='ALL';
function brRenderEncyclopediaFilters() {
            var rankBox=brEl('br-rank-filters'),roleBox=brEl('br-role-filters');rankBox.innerHTML='';roleBox.innerHTML='';
            var rankLabel=document.createElement('span');rankLabel.className='br-filter-label';rankLabel.textContent='RANK';rankBox.appendChild(rankLabel);
            [['ALL','ALL'],['S','S'],['A','A'],['B','B'],['C','C'],['F','F']].forEach(function(item){rankBox.appendChild(brEncyclopediaFilterButton(item[0],item[1],'rank'));});
            var roleLabel=document.createElement('span');roleLabel.className='br-filter-label';roleLabel.textContent='역할';roleBox.appendChild(roleLabel);
            roleBox.appendChild(brEncyclopediaFilterButton('ALL','ALL','role'));
            Array.from(new Set(EMOJI_DB.map(function(ability){return brAbilityCategory(ability);}))).forEach(function(role){roleBox.appendChild(brEncyclopediaFilterButton(role,role,'role'));});
        }
function brEncyclopediaFilterButton(label,value,kind) {
            var button=document.createElement('button');button.type='button';button.className='br-filter-btn';button.textContent=label;button.dataset.value=value;
            var active=kind==='rank'?BRMP.encyclopediaRank===value:BRMP.encyclopediaRole===value;button.classList.toggle('active',active);
            button.addEventListener('click',function(){if(kind==='rank')BRMP.encyclopediaRank=value;else BRMP.encyclopediaRole=value;brRenderEncyclopedia();});return button;
        }
function brRenderEncyclopedia() {
            brRenderEncyclopediaFilters();
            var list=EMOJI_DB.filter(function(ability){return (BRMP.encyclopediaRank==='ALL'||ability.t===BRMP.encyclopediaRank)&&(BRMP.encyclopediaRole==='ALL'||brAbilityCategory(ability)===BRMP.encyclopediaRole);});
            brEl('br-encyclopedia-count').textContent='현재 조건 '+list.length+'명 · 전체 '+EMOJI_DB.length+'명';
            var grid=brEl('br-encyclopedia-grid');grid.innerHTML='';var fragment=document.createDocumentFragment();
            list.forEach(function(ability){
                var card=document.createElement('article');card.className='br-character-card';card.dataset.characterId=ability.id;
                card.innerHTML='<div class="br-character-top"><div class="br-character-emoji">'+brEscape(ability.e)+'</div><div><h3 class="br-character-name">'+brEscape(ability.n)+'</h3><div class="br-character-meta">'+brEscape(ability.t)+' Rank · '+brEscape(brAbilityCategory(ability))+(ability.teamOnly?'<span class="br-team-only">팀전 전용</span>':'')+'</div></div></div>'+
                    '<p class="br-character-style">'+brEscape(brReworkDefinition(ability)?.concept||brReworkDefinition(ability)?.description||ability.concept||ability.desc||'')+'</p><div class="br-character-kit"><span><b>일반 공격</b> · '+brEscape(brEffectiveBasicText(ability))+'</span><span><b>Skill</b> · '+brEscape(brEffectiveSkillText(ability)+(brPassiveText(ability)?' · '+brPassiveText(ability):''))+'</span></div>';
                fragment.appendChild(card);
            });
            grid.appendChild(fragment);BRMP.encyclopediaBuilt=true;
        }
return {catalog:brRenderEncyclopedia,results:brRenderResults,board:brTKRenderBoard,live:brTKRenderLive,reset:brTKResetUI,loadPrefs:brLoadPlayPrefs,savePrefs:brSavePlayPrefs,stage:brSetHostStage,quizImport:brRenderQuizImport,validateQuiz:brValidateQuestionText,team:brTKTeamMeta};
}
