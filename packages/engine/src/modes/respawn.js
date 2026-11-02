// Extracted from v32.1. Room-scoped bindings; see docs/source-map.json.
export function install(__brScope){
__brScope.brTKBalancedTeams = function brTKBalancedTeams(entries,teamCount) {
            var tc=Math.max(2,Math.min(4,Number(teamCount)||2)), counts=Array(tc+1).fill(0), teams={};
            var order=entries.slice().sort(function(a,b){return Number(a.joinedAt||0)-Number(b.joinedAt||0)||String(a._id).localeCompare(String(b._id));});
            function smallest(){var t=1;for(var i=2;i<=tc;i++)if(counts[i]<counts[t])t=i;return t;}
            order.forEach(function(p){var t=Number(p.team||0);if(t>=1&&t<=tc&&Number.isInteger(t)){teams[p._id]=t;counts[t]++;}});
            order.forEach(function(p){if(!teams[p._id]){var t=smallest();teams[p._id]=t;counts[t]++;}});
            for(var guard=0;guard<order.length;guard++){
                var low=smallest(),high=1;for(var t=2;t<=tc;t++)if(counts[t]>counts[high])high=t;
                if(counts[high]-counts[low]<=1)break;
                var mover=order.slice().reverse().find(function(p){return teams[p._id]===high;});
                teams[mover._id]=low;counts[high]--;counts[low]++;
            }
            return teams;
        };

__brScope.brRespawnPlayer = function brRespawnPlayer(p,reroll) {
            if(!__brScope.session.respawnMode||!p||p.alive||!p.tkQuiz||p.tkQuiz.correct<__brScope.brTeamKillRules().quizNeeded)return false;
            if(reroll&&p.tkTokens<=0)return false;
            var captureSpot=__brScope.brCaptureMode()?__brScope.brCaptureSpawn(__brScope.game,{...p,radius:Math.max(p.radius,107)},__brScope.game.participants.filter(q=>q!==p&&q.alive)):null;if(__brScope.brCaptureMode()&&!captureSpot)return false;
            // Old-life actors must not inherit a rerolled character or new run buffs.
            // Their posthumous effects remain valid during the quiz, then end here.
            for(var shot of __brScope.game.projectiles||[])if(shot.owner===p)shot.life=0;
            for(var zone of __brScope.game.zones||[])if(zone.owner===p)zone.duration=0;
            for(var turret of __brScope.game.turrets||[])if(turret.owner===p)turret.life=0;
            if(reroll){
                p.tkTokens--;p.tkStats.rerollCount++;
                __brScope.brTeamKillResetBody(p,__brScope.brAbilityIndex(__brScope.session.roomMeta.mode,p.abilityIndex,null,__brScope.random),false);
                __brScope.game.maxBodyRadius=Math.max(__brScope.game.maxBodyRadius,p.radius);
                __brScope.session.wireParticipants=null;__brScope.session.wireRoster=null;__brScope.session.wireHumans=null;__brScope.session.staticSent={};
            }
            var spot=captureSpot||__brScope.brTeamKillSpawnPoint(p);p.pos=spot;p.lastPos=new __brScope.Vec2(spot.x,spot.y);
            p.alive=true;p.hp=p.maxHp;p.vel=new __brScope.Vec2(0,0);p.eliminationSeq=0;
            p.deathFrame=null;p.deathVisualUntilFrame=null;p.deathVisualUntilAt=null;p.respawnAtFrame=null;
            p.spawnProtectionUntilFrame=__brScope.game.frame+__brScope.brTeamKillRules().protectionFrames;
            p.tkStats.lifeStartedFrame=__brScope.game.frame;p.tkStats.streak=0;p.tkQuiz.correct=0;p.tkQuiz.question=null;p.tkQuiz.lockUntil=0;p.tkQuiz.revision++;
            p.basicCooldown=0;p.cooldown=0;p.basicCooldownMax=__brScope.brBasicAttackFrames(p.ability);p.skillCooldownMax=Math.max(1,Number(p.maxCooldown||1));
            var input=__brScope.session.inputs[p.remoteId]||{};
            p.lastRemoteAttack=Math.max(Number(p.lastRemoteAttack||0),Number(input.attackSeq||0));p.lastRemoteSkill=Math.max(Number(p.lastRemoteSkill||0),Number(input.skillSeq||0));
            p.resolvedAttackSeq=p.lastRemoteAttack;p.resolvedSkillSeq=p.lastRemoteSkill;p.pendingAttack=null;p.pendingSkill=null;
            p.warpSeq=Number(p.warpSeq||0)+1;
            if(p.run){p.run.lastDamageFrame=__brScope.game.frame;p.run.revision++;}
            if(Array.isArray(__brScope.game.deadParticipants))__brScope.game.deadParticipants=__brScope.game.deadParticipants.filter(function(dead){return dead!==p;});
            if(__brScope.game.capture)__brScope.BRCapture.record(__brScope.game.capture,p);
            __brScope.game.addText(p.pos,'♻️ RESPAWN','#a7f3d0',45,28);
            return true;
        };

__brScope.brTeamKillRules = function brTeamKillRules(){return __brScope.BR_TEAM_KILL_RULES||{protectionFrames:108,tokenCap:2,quizNeeded:3,wrongLockMs:1200};};

__brScope.brTeamKillInit = function brTeamKillInit(p,rec){
            p.tkStats={quizCorrect:Math.max(0,Math.floor(Number(rec.quizScore||0))),rerollCount:0,streak:0,bestStreak:0,lateKills:0,totalLifeFrames:0,completedLives:0,longestLifeFrames:0,shortestLifeFrames:0,lifeStartedFrame:0};
            p.tkTokens=__brScope.brClamp(Math.floor(Number(rec.rerolls||0)),0,__brScope.brTeamKillRules().tokenCap);
            p.tkQuiz={correct:0,question:null,questionSeq:0,lockUntil:0,revision:1,ack:null,seen:new Set(),bank:null,index:0};
            p.spawnProtectionUntilFrame=0;
        };

__brScope.brTeamKillResetBody = function brTeamKillResetBody(p,index,dying){
            var oldRevision=Number(p.run?.revision||0),oldOfferSeq=Number(p.run?.offerSeq||0),keep={};
            // Keep the Participant identity so projectile owners and renderer references
            // continue crediting the same match statistics after each short run.
            ['id','name','team','remoteId','sessionId','matchKey','rosterVersion','kills','deaths','damageDealt','damageTaken','abilityUses','survivalFrames','killTimes','rapidKillCount','lastKillFrame','placement','tkStats','tkTokens','tkQuiz','lifeSeq','warpSeq','lastInputSeq','lastRemoteAttack','lastRemoteSkill','resolvedAttackSeq','resolvedSkillSeq','firedAttackSeq','firedSkillSeq','_farmDropDeathSeq','deathFrame','deathVisualUntilFrame','deathVisualUntilAt','eliminationSeq','lastDeathCause'].forEach(function(k){if(Object.prototype.hasOwnProperty.call(p,k))keep[k]=p[k];});
            var fresh=new __brScope.Participant(p.id,p.name,__brScope.EMOJI_DB[index],new __brScope.Vec2(p.pos.x,p.pos.y),p.team);
            Object.keys(p).forEach(function(k){delete p[k];});Object.assign(p,fresh,keep);
            p.abilityIndex=index;p.abilityId=__brScope.EMOJI_DB[index].id;p.rosterVersion=__brScope.BR_ROSTER_VERSION;p.applyPlayerInput=__brScope.brApplyPlayerInput;
            p.maxSkillUses=-1;p.skillUsesLeft=-1;p.lastAimDir=new __brScope.Vec2(1,0);p.basicCooldown=0;p.cooldown=0;
            p.basicCooldownMax=__brScope.brBasicAttackFrames(p.ability);p.skillCooldownMax=Math.max(1,Number(p.maxCooldown||1));
            p.alive=false;p.hp=0;p.pendingAttack=null;p.pendingSkill=null;p.spawnProtectionUntilFrame=0;
            __brScope.brInitRun(p);p.run.revision=oldRevision+1;p.run.offerSeq=oldOfferSeq;p.run.lastDamageFrame=__brScope.game.frame;
            p.run.rng=__brScope.brHashRandom(p.run.matchKey+'|build|'+p.remoteId+'|life|'+p.lifeSeq);
        };

__brScope.brTeamKillDeath = function brTeamKillDeath(p){
            if(!p.tkStats)__brScope.brTeamKillInit(p,{});
            var stats=p.tkStats,life=Math.max(0,Number(p.deathFrame??__brScope.game.frame)-Number(stats.lifeStartedFrame||0));
            stats.totalLifeFrames+=life;stats.completedLives++;stats.longestLifeFrames=Math.max(stats.longestLifeFrames,life);
            stats.shortestLifeFrames=stats.completedLives===1?life:Math.min(stats.shortestLifeFrames,life);stats.streak=0;
            p.lifeSeq=Number(p.lifeSeq||0)+1;
            // recordElimination has already emitted the XP bundle at the old run level.
            __brScope.brTeamKillResetBody(p,p.abilityIndex,true);
            p.tkQuiz.correct=0;p.tkQuiz.lockUntil=0;p.tkQuiz.question=null;p.tkQuiz.ack=null;p.tkQuiz.seen=new Set();p.tkQuiz.revision++;
            __brScope.brTeamKillNextQuestion(p);
        };

__brScope.brTeamKillNextQuestion = function brTeamKillNextQuestion(p){
            var q=p.tkQuiz;
            if(!q.bank){
                var raw=__brScope.session.roomMeta.quizBank,bank=Array.isArray(raw)?raw:(raw&&typeof raw==='object'?Object.keys(raw).sort(function(a,b){return Number(a)-Number(b);}).map(function(k){return raw[k];}):__brScope.BR_DEFAULT_QUESTIONS);
                q.bank=bank.map(__brScope.brPrepareQuizQuestion).filter(Boolean);
                if(!q.bank.length)q.bank=__brScope.BR_DEFAULT_QUESTIONS.map(__brScope.brPrepareQuizQuestion).filter(Boolean);
                q.bank=__brScope.brShuffle(q.bank);q.index=0;
            }
            if(q.index>=q.bank.length){q.bank=__brScope.brShuffle(q.bank);q.index=0;}
            var source=q.bank[q.index++],questionId=__brScope.brUid('lifeq')+'-'+(++q.questionSeq),answers=__brScope.brShuffle(source.answers).map(function(answer){return {id:__brScope.brUid('option'),text:answer.text,correct:answer.isCorrect};});
            q.question={id:questionId,prompt:source.prompt,answers:answers};q.revision++;
        };

__brScope.brTeamKillSelf = function brTeamKillSelf(p){
            var q=p.tkQuiz;if(!q)return null;
            return {matchKey:__brScope.brRunMatchKey(),lifeSeq:Number(p.lifeSeq||0),alive:!!p.alive,correct:q.correct,needed:__brScope.brTeamKillRules().quizNeeded,tokens:p.tkTokens,totalCorrect:p.tkStats.quizCorrect,rerollCount:p.tkStats.rerollCount,
                question:!p.alive&&q.question?{id:q.question.id,prompt:q.question.prompt,answers:q.question.answers.map(function(a){return {id:a.id,text:a.text};})}:null,
                lockUntil:q.lockUntil,hostAt:__brScope.brNow(),ack:q.ack,revision:q.revision,protectionFrames:Math.max(0,Number(p.spawnProtectionUntilFrame||0)-__brScope.game.frame)};
        };

__brScope.brTeamKillProcessInput = function brTeamKillProcessInput(p,input){
            var request=input.tkRequest,q=p.tkQuiz;if(String(input.sessionId||'')!==String(p.sessionId||''))return;
            if(!request||!q||!request.id||request.matchKey!==__brScope.brRunMatchKey()||Number(request.lifeSeq)!==Number(p.lifeSeq||0))return;
            if(q.seen.has(request.id))return;
            q.seen.add(request.id);if(q.seen.size>80)q.seen.delete(q.seen.values().next().value);
            var accepted=false,message='',now=__brScope.brNow();
            if(p.alive)message='이미 부활했습니다.';
            else if(request.kind==='answer'){
                if(q.correct>=__brScope.brTeamKillRules().quizNeeded)message='KEEP 또는 REROLL을 선택하세요.';
                else if(now<q.lockUntil)message='잠시 후 다시 선택하세요.';
                else if(!q.question||request.questionId!==q.question.id)message='새 문제를 확인하세요.';
                else{
                    var answer=q.question.answers.find(function(a){return a.id===request.answerId;});
                    if(!answer)message='보기를 다시 선택하세요.';
                    else if(answer.correct){
                        accepted=true;q.correct++;p.tkStats.quizCorrect++;
                        if(p.tkStats.quizCorrect%__brScope.brTeamKillRules().quizNeeded===0)p.tkTokens=Math.min(__brScope.brTeamKillRules().tokenCap,p.tkTokens+1);
                        q.lockUntil=0;message='CORRECT!';
                        if(q.correct<__brScope.brTeamKillRules().quizNeeded)__brScope.brTeamKillNextQuestion(p);else q.question=null;
                    }else{q.lockUntil=now+__brScope.brTeamKillRules().wrongLockMs;message='TRY AGAIN · 오답은 정답 수에 포함되지 않습니다.';}
                }
            }else if(request.kind==='keep'||request.kind==='reroll'){
                if(q.correct<__brScope.brTeamKillRules().quizNeeded)message='정답 3개가 필요합니다.';
                else if(request.kind==='reroll'&&p.tkTokens<=0)message='리롤권이 없습니다. KEEP으로 부활하세요.';
                else {accepted=__brScope.brRespawnPlayer(p,request.kind==='reroll');message=accepted?'RESPAWN!':'부활을 다시 선택하세요.';}
            }
            q.ack={id:request.id,accepted:accepted,message:message};q.revision++;
        };

__brScope.brTeamKillSpawnPoint = function brTeamKillSpawnPoint(p){
            if(__brScope.brCaptureMode())return __brScope.brCaptureSpawn(__brScope.game,p);
            var center=__brScope.game.center||new __brScope.Vec2(0,0),radius=Math.max(140,Number(__brScope.game.mapRadius||__brScope.game.worldRadius)-p.radius-65),tc=Math.max(2,Number(__brScope.session.roomMeta.teamCount||2));
            var angle=-Math.PI/2+(Number(p.team||1)-1)*Math.PI*2/tc,candidates=[],best=null,bestScore=-Infinity;
            for(var i=0;i<52;i++){
                var theta=i<16?angle+(i-7.5)*.12:__brScope.random()*Math.PI*2,dist=radius*(i<16?.62+__brScope.random()*.24:.18+Math.sqrt(__brScope.random())*.70);
                var spot=center.add(new __brScope.Vec2(Math.cos(theta)*dist,Math.sin(theta)*dist));
                if(__brScope.game.checkWallCollision&&__brScope.game.checkWallCollision(spot,p.radius+22))continue;
                var score=0,nearestEnemy=radius*2,nearestAlly=radius,enemyCount=0,blocked=false;
                for(var other of __brScope.game.participants){
                    if(!other.alive||other===p||other.id===999)continue;
                    var d=spot.dist(other.pos);if(d<p.radius+other.radius+18){blocked=true;break;}
                    if(other.team===p.team)nearestAlly=Math.min(nearestAlly,d);
                    else{nearestEnemy=Math.min(nearestEnemy,d);if(d<440)enemyCount++;}
                }
                if(blocked)continue;
                score=Math.min(1100,nearestEnemy)*1.5-enemyCount*350-Math.min(900,nearestAlly)*.12;
                for(var z of __brScope.game.zones||[]){if(z.duration<=0||!z.pos||(z.owner&&z.owner.team===p.team))continue;var zd=spot.dist(z.pos)-Number(z.radius||0)-p.radius;score-=zd<55?2200:zd<200?500:0;}
                for(var smoke of __brScope.game.smokes||[]){var sx=Number(smoke.x??smoke.pos?.x??0),sy=Number(smoke.y??smoke.pos?.y??0);if(Math.hypot(spot.x-sx,spot.y-sy)<Number(smoke.radius||0)+p.radius)score-=90;}
                if(score>bestScore){best=spot;bestScore=score;}
            }
            return best||__brScope.game.findSafePointNear(center,radius*.65,p.radius+24,[])||__brScope.game.findSafeMapPoint(30,radius,p.radius+24);
        };

__brScope.brTKTeamMeta = function brTKTeamMeta(team) {
            return [{name:'TEAM',short:'T',color:'#cbd5e1',dot:'⚪'},{name:'BLUE',short:'B',color:'#3b82f6',dot:'🔵'},
                {name:'RED',short:'R',color:'#ef4444',dot:'🔴'},{name:'GREEN',short:'G',color:'#22c55e',dot:'🟢'},
                {name:'YELLOW',short:'Y',color:'#eab308',dot:'🟡'}][Number(team)]||{name:'TEAM',short:'T',color:'#cbd5e1',dot:'⚪'};
        };

__brScope.brTKId = function brTKId(p){return String(p.remoteId||('player-'+p.id));};

__brScope.brTKStable = function brTKStable(a,b){return String(a.id).localeCompare(String(b.id));};

__brScope.brTKState = function brTKState(g) {
            if(!g.tkMatch) {
                const count=__brScope.brClamp(Number(__brScope.session.roomMeta?.teamCount||2),2,4),scores={};
                for(let t=1;t<=count;t++)scores[t]=0;
                g.tkMatch={scores:scores,kills:{},feed:[],eventSeq:0,revision:0,board:null,boardAt:-Infinity,
                    suddenDeath:false,contenders:[],winner:0,winningEvent:0,closed:false};
            }
            return g.tkMatch;
        };

__brScope.brTKTeams = function brTKTeams(m) {
            const rows=Object.keys(m.scores).map(function(t){return {team:Number(t),score:Number(m.scores[t]||0)};});
            rows.sort(function(a,b){return b.score-a.score||a.team-b.team;});
            rows.forEach(function(r,i){r.rank=i&&r.score===rows[i-1].score?rows[i-1].rank:i+1;});
            return rows;
        };

__brScope.brTKAdvanceTime = function brTKAdvanceTime(g,m) {
            if(m.closed||m.suddenDeath||__brScope.brNow()<Number(__brScope.session.roomMeta?.battleEndsAt||Infinity))return;
            const teams=__brScope.brTKTeams(m),top=teams.length?teams[0].score:0;
            m.contenders=teams.filter(function(t){return t.score===top;}).map(function(t){return t.team;});
            if(m.contenders.length===1){m.winner=m.contenders[0];m.closed=true;}
            else m.suddenDeath=true;
            m.boardAt=-Infinity;
        };

__brScope.brTKRecordKill = function brTKRecordKill(attacker,victim,g) {
            if(g.capture)return __brScope.brCaptureRecordKill(attacker,victim,g);
            if(!__brScope.session.respawnMode||!attacker||!victim||attacker===victim||attacker.id===999||victim.id===999||!attacker.team||attacker.team===victim.team)return false;
            const m=__brScope.brTKState(g);__brScope.brTKAdvanceTime(g,m);
            if(m.closed||!Object.prototype.hasOwnProperty.call(m.scores,attacker.team))return false;
            const eventKey=__brScope.brTKId(victim)+':'+Number(victim.lifeSeq||0)+':'+Number(victim.deathFrame??g.frame);
            if(victim._tkKillEvent===eventKey)return false;victim._tkKillEvent=eventKey;
            const id=__brScope.brTKId(attacker),stats=attacker.tkStats||(attacker.tkStats={});
            m.kills[id]=Number(m.kills[id]||0)+1;m.scores[attacker.team]++;attacker.kills=m.kills[id];
            stats.streak=attacker.alive?Number(stats.streak||0)+1:0;stats.bestStreak=Math.max(Number(stats.bestStreak||0),stats.streak);
            const duration=Math.max(1,Number(__brScope.session.roomMeta?.matchSeconds||360))*1000;
            if(m.suddenDeath||Number(__brScope.session.roomMeta?.battleEndsAt||0)-__brScope.brNow()<=Math.min(60000,duration*.2))stats.lateKills=Number(stats.lateKills||0)+1;
            attacker.lastKillFrame=g.frame;if(Array.isArray(attacker.killTimes))attacker.killTimes.push(g.frame);
            const event={seq:++m.eventSeq,frame:g.frame,killer:id,killerName:attacker.name,killerTeam:Number(attacker.team),victim:__brScope.brTKId(victim),victimName:victim.name,victimTeam:Number(victim.team)};
            m.feed.unshift(event);if(m.feed.length>4)m.feed.length=4;
            g.pushCombatEvent(__brScope.brTKTeamMeta(attacker.team).dot+' '+attacker.name+' → '+__brScope.brTKTeamMeta(victim.team).dot+' '+victim.name,'#f8fafc',1,null);
            if(m.suddenDeath&&m.contenders.includes(Number(attacker.team))){m.winner=Number(attacker.team);m.winningEvent=event.seq;m.closed=true;m.boardAt=-Infinity;}
            return true;
        };

__brScope.brTKPersonalRows = function brTKPersonalRows(g) {
            const m=__brScope.brTKState(g);
            return g.participants.filter(function(p){return p.id!==999;}).map(function(p){
                const s=p.tkStats||{},openFrames=p.alive?Math.max(0,g.frame-Number(s.lifeStartedFrame||0)):0;
                const lives=Number(s.completedLives||0)+(p.alive?1:0),total=Number(s.totalLifeFrames||0)+openFrames;
                return {id:__brScope.brTKId(p),name:p.name,team:Number(p.team||0),kills:Number(m.kills[__brScope.brTKId(p)]||0),deaths:Number(p.deaths||0),damage:Math.round(p.damageDealt||0),
                    streak:Number(s.streak||0),bestStreak:Number(s.bestStreak||0),lateKills:Number(s.lateKills||0),quizCorrect:Number(s.quizCorrect||0),rerollCount:Number(s.rerollCount||0),
                    lifeTotal:Math.round(total/60),lifeAverage:lives?total/lives/60:0,longestLife:Math.max(Number(s.longestLifeFrames||0),openFrames)/60,
                    shortestLife:Number(s.completedLives||0)>0?Number(s.shortestLifeFrames||0)/60:0,
                    completedLifeAverage:Number(s.completedLives||0)>0?Number(s.totalLifeFrames||0)/Number(s.completedLives)/60:0,completedLives:Number(s.completedLives||0),
                    abilityIndex:Number(p.abilityIndex||0),abilityId:p.ability.id,abilityName:p.ability.n,abilityEmoji:p.ability.e,tier:p.ability.t,
                    lastDeathCause:p.lastDeathCause||null,level:Number(p.run?.level||1),alive:!!p.alive,lastKillFrame:Number(p.lastKillFrame||0)};
            }).sort(function(a,b){return b.kills-a.kills||a.deaths-b.deaths||b.damage-a.damage||__brScope.brTKStable(a,b);}).map(function(r,i){r.rank=i+1;return r;});
        };

__brScope.brTKBuildBoard = function brTKBuildBoard(force) {
            if(__brScope.game?.capture)return __brScope.brCaptureBoard(force);
            const m=__brScope.brTKState(__brScope.game),now=__brScope.brNow();
            if(!force&&m.board&&now-m.boardAt<500)return m.board;
            const rows=__brScope.brTKPersonalRows(__brScope.game);
            m.boardAt=now;m.board={matchKey:__brScope.brRingKey(),revision:++m.revision,at:now,clock:Math.max(0,Math.ceil((Number(__brScope.session.roomMeta.battleEndsAt||0)-now)/1000)),
                suddenDeath:m.suddenDeath,contenders:m.contenders.slice(),teams:__brScope.brTKTeams(m),
                players:rows.map(function(r){return {id:r.id,name:r.name,team:r.team,kills:r.kills,deaths:r.deaths,damage:r.damage,streak:r.streak,rank:r.rank};}),
                feed:m.feed.filter(function(e){return __brScope.game.frame-e.frame<600;})};
            return m.board;
        };

__brScope.brCaptureTeams = function brCaptureTeams(c){const teams=c.s.map((score,i)=>({team:i+1,score})).sort((a,b)=>b.score-a.score||a.team-b.team);teams.forEach((t,i)=>t.rank=i&&Math.abs(t.score-teams[i-1].score)<=1e-8?teams[i-1].rank:i+1);return teams;};

__brScope.brCaptureRows = function brCaptureRows(){const c=__brScope.game.capture,rows=__brScope.brTKPersonalRows(__brScope.game).map(p=>{const body=__brScope.game.participants.find(q=>__brScope.brTKId(q)===p.id),r=__brScope.BRCapture.record(c,body);return {...p,...r,damage:Math.round(r.damageDealt),taken:Math.round(r.damageTaken),usedAbilities:r.usedAbilities.slice()};});
            return rows.sort((a,b)=>b.points-a.points||(b.kills+b.assists)-(a.kills+a.assists)||b.damageDealt-a.damageDealt||a.deaths-b.deaths||a.id.localeCompare(b.id)).map((r,i)=>({...r,rank:i+1}));};

__brScope.brCaptureBoard = function brCaptureBoard(force){const c=__brScope.game.capture,now=__brScope.brNow();if(!force&&c.board&&now-c.boardAt<500)return c.board;c.boardAt=now;
            const packet={s:c.scores.slice(1)};return c.board={capture:1,matchKey:c.key,revision:++c.boardSeq||(c.boardSeq=1),at:now,clock:Math.max(0,Math.ceil(c.seconds-c.active)),teams:__brScope.brCaptureTeams(packet),players:__brScope.brCaptureRows(),feed:__brScope.brTKState(__brScope.game).feed.filter(e=>__brScope.game.frame-e.frame<600),suddenDeath:false,contenders:[]};};

__brScope.brCaptureRecordKill = function brCaptureRecordKill(attacker,victim,g){if(!attacker||!victim||attacker===victim||attacker.id===999||victim.id===999||!attacker.team||attacker.team===victim.team||g.capture.finalized)return false;
            const eventKey=__brScope.brTKId(victim)+':'+Number(victim.lifeSeq||0)+':'+Number(victim.deathFrame??g.frame);if(victim._tkKillEvent===eventKey)return false;victim._tkKillEvent=eventKey;
            const m=__brScope.brTKState(g),id=__brScope.brTKId(attacker),stats=attacker.tkStats||(attacker.tkStats={});m.kills[id]=Number(m.kills[id]||0)+1;attacker.kills=m.kills[id];stats.streak=attacker.alive?Number(stats.streak||0)+1:0;stats.bestStreak=Math.max(Number(stats.bestStreak||0),stats.streak);attacker.lastKillFrame=g.frame;
            __brScope.BRCapture.kill(g,attacker,victim);const event={seq:++m.eventSeq,frame:g.frame,killer:id,killerName:attacker.name,killerTeam:Number(attacker.team),victim:__brScope.brTKId(victim),victimName:victim.name,victimTeam:Number(victim.team)};m.feed.unshift(event);if(m.feed.length>4)m.feed.length=4;
            g.pushCombatEvent(__brScope.brTKTeamMeta(attacker.team).dot+' '+attacker.name+' → '+__brScope.brTKTeamMeta(victim.team).dot+' '+victim.name,'#f8fafc',1,null);return true;};

__brScope.brCaptureResults = function brCaptureResults(){const c=__brScope.game.capture;if(!c.finalized)__brScope.BRCapture.finish(c,'manual');const rows=__brScope.brCaptureRows(),teams=__brScope.brCaptureTeams({s:c.scores.slice(1)});return {matchKey:c.key,rosterVersion:__brScope.BR_ROSTER_VERSION,captureVersion:__brScope.BR_CAPTURE_RULES.version,mapRevision:c.map.revision,mode:'team-capture',teamWinner:c.winners.length===1?c.winners[0]:0,tiedTeams:c.winners.slice(),teams,players:rows,awards:__brScope.BRCapture.awards(c),duration:c.active,reason:c.reason,createdAt:__brScope.brNow()};};
}
export const initializers=[

];
