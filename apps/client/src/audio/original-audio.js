// Generated from the final v32.1 audio functions. No Firebase/network authority code.
export function createOriginalAudio(session,now){
const BRMP=session,brNow=now,brEl=id=>document.getElementById(id),brSetText=(el,v)=>{if(el)el.textContent=String(v??'');},brClamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const BR_BGM_LINKS={
            ready:'https://www.dropbox.com/scl/fi/uh3w61oauudkb79kogl44/BR-Ready.mp3?rlkey=mii9oxram8d7oda6k0g9j5x36&st=8ezavc96&dl=0',
            start:'https://www.dropbox.com/scl/fi/acuk8jzd3cyz8j3qdpin4/BR-Start.mp3?rlkey=nkms6a7rvpm45sxuzsasf6tj6&st=zddb4qgm&dl=0',
            final:'https://www.dropbox.com/scl/fi/945izg1kyv4cmu07x6w6d/BR-Final.mp3?rlkey=wyx84e89smyfbxipmvqicg4uu&st=gig6uyer&dl=0'
        };

function brMusicUrl(link){var u=new URL(link);u.searchParams.delete('dl');u.searchParams.set('raw','1');return u.href;}

var brBgm={generation:0,room:'',match:'',stage:'',audio:null,next:null,fading:null,fadeTimer:null,blocked:false,status:'',role:'',pref:null,
            duration:{start:0,final:0},pausedForGame:false};

function brMusicPref(role){
            var def={enabled:role==='host',volume:role==='host'?25:15},read;
            try{read=JSON.parse(localStorage.getItem('br_bgm_'+role+'_v1')||'null');}catch(_){}
            return {enabled:typeof read?.enabled==='boolean'?read.enabled:def.enabled,volume:brClamp(Number.isFinite(Number(read?.volume))?Number(read.volume):def.volume,0,100)};
        }

function brMusicRole(){var role=BRMP.role;if(role!=='host'&&role!=='student')return false;
            if(brBgm.role!==role){brMusicStop();brBgm.role=role;brBgm.pref=brMusicPref(role);}return true;}

function brMusicSave(){try{localStorage.setItem('br_bgm_'+brBgm.role+'_v1',JSON.stringify(brBgm.pref));}catch(_){}brMusicUi();}

function brMusicUi(){var box=brEl('br-music-controls'),host=BRMP.role==='host',phase=BRMP.roomMeta?.phase,
                visible=!!(BRMP.roomCode&&brBgm.role&&(host?['lobby','quiz','draft','battle'].includes(phase):BRMP.role==='student'&&phase==='lobby'));
            box.classList.toggle('br-hidden',!visible);box.classList.toggle('br-music-host',host);
            document.body.classList.toggle('br-host-music-visible',host&&visible);if(!brBgm.pref)return;
            var button=brEl('br-pref-music');button.textContent=!brBgm.pref.enabled||brBgm.blocked?'음악 켜기':'음악 끄기';
            button.setAttribute('aria-pressed',String(!!brBgm.pref.enabled&&!brBgm.blocked));
            var slider=brEl('br-music-volume');slider.value=String(brBgm.pref.volume);slider.disabled=!brBgm.pref.enabled;
            brSetText(brEl('br-music-status'),brBgm.pref.enabled?brBgm.status:'');}

function brMusicClearFade(){if(brBgm.fadeTimer){clearInterval(brBgm.fadeTimer);brBgm.fadeTimer=null;}
            if(brBgm.fading){brBgm.fading.pause();brBgm.fading.onended=null;brBgm.fading.onerror=null;brBgm.fading.onloadedmetadata=null;brBgm.fading=null;}}

function brMusicRelease(audio){if(!audio)return;audio.pause();audio.onended=null;audio.onerror=null;audio.onloadedmetadata=null;}

function brMusicStop(){brBgm.generation++;brMusicClearFade();brMusicRelease(brBgm.audio);brMusicRelease(brBgm.next);
            brBgm.audio=null;brBgm.next=null;brBgm.stage='';brBgm.room='';brBgm.match='';brBgm.blocked=false;brBgm.status='';brBgm.pausedForGame=false;brMusicUi();}

function brMusicFade(audio,duration){brMusicClearFade();if(!audio)return;
            var token=brBgm.generation,start=performance.now(),volume=Number(audio.volume||0);brBgm.fading=audio;
            brBgm.fadeTimer=setInterval(function(){if(token!==brBgm.generation||brBgm.fading!==audio){brMusicClearFade();return;}
                var left=Math.max(0,1-(performance.now()-start)/duration);audio.volume=volume*left;
                if(left===0)brMusicClearFade();},50);}

function brMusicMedia(stage){if(typeof Audio!=='function'){brBgm.status='이 브라우저에서 음악을 재생할 수 없습니다.';brMusicUi();return null;}
            var audio=stage==='final'&&brBgm.next?brBgm.next:new Audio();if(audio===brBgm.next)brBgm.next=null;
            audio.preload=stage==='ready'?'auto':'metadata';audio.loop=stage!=='start';
            if(!audio.src)audio.src=brMusicUrl(BR_BGM_LINKS[stage]);return audio;}

function brMusicAttempt(audio,token){if(!audio||token!==brBgm.generation||audio!==brBgm.audio||!brBgm.pref?.enabled||document.hidden||brBgm.pausedForGame)return;
            try{audio.volume=brBgm.pref.volume/100;var result=audio.play();if(result&&typeof result.then==='function')result.then(function(){
                if(token!==brBgm.generation||audio!==brBgm.audio){brMusicRelease(audio);return;}brBgm.blocked=false;brBgm.status='';brMusicUi();
            }).catch(function(err){if(token!==brBgm.generation||audio!==brBgm.audio)return;brBgm.blocked=true;
                brBgm.lastPlayError={name:err?.name||'Error',message:err?.message||''};brBgm.status=err?.name==='NotAllowedError'?'눌러서 음악 켜기':'음원 연결을 확인해 주세요';brMusicUi();});
        }catch(err){if(token===brBgm.generation){brBgm.blocked=true;brBgm.status='눌러서 음악 켜기';brMusicUi();}}}

function brMusicPreloadFinal(){if(!brBgm.pref?.enabled||brBgm.next||typeof Audio!=='function')return;
            var next=new Audio();next.preload='metadata';next.loop=true;next.src=brMusicUrl(BR_BGM_LINKS.final);brBgm.next=next;
            next.onloadedmetadata=function(){if(brBgm.next===next&&Number.isFinite(next.duration)&&next.duration>0)brBgm.duration.final=next.duration;};
            next.onerror=function(){if(brBgm.next===next){brMusicRelease(next);brBgm.next=null;}};
            try{next.load();}catch(_){} }

function brMusicPlay(stage,offset=0,waitForEarlyMetadata=false){
            var previous=brBgm.audio;brBgm.generation++;var token=brBgm.generation;brMusicClearFade();
            var audio=brMusicMedia(stage);brBgm.audio=audio;brBgm.stage=stage;brBgm.blocked=false;brBgm.status='';
            if(previous&&previous!==audio){previous.onended=null;previous.onloadedmetadata=null;previous.onerror=null;brMusicFade(previous,550);}
            if(!audio){brMusicUi();return;}
            var pendingSeek=Number.isFinite(offset)&&offset>0?offset:0,started=false;
            function begin(){if(started||token!==brBgm.generation||brBgm.audio!==audio)return;started=true;brMusicAttempt(audio,token);}
            audio.onloadedmetadata=function(){if(token!==brBgm.generation||audio!==brBgm.audio)return;
                if(Number.isFinite(audio.duration)&&audio.duration>0)brBgm.duration[stage]=audio.duration;
                if(stage==='start'&&waitForEarlyMetadata&&audio.duration>0&&pendingSeek>=audio.duration){
                    var elapsed=pendingSeek-audio.duration;brMusicPlay('final',elapsed);return;
                }
                if(pendingSeek>0&&audio.duration>0){try{audio.currentTime=stage==='final'?pendingSeek%audio.duration:Math.min(pendingSeek,Math.max(0,audio.duration-.08));}catch(_){}pendingSeek=0;}
                begin();
            };
            audio.onended=function(){if(token!==brBgm.generation||brBgm.audio!==audio||stage!=='start'||BRMP.roomMeta?.phase!=='battle'||brBgm.match!==brMusicMatch(BRMP.roomMeta))return;
                brMusicPlay('final',0);};
            audio.onerror=function(){if(token!==brBgm.generation||audio!==brBgm.audio)return;brBgm.blocked=true;brBgm.status='음원 연결을 확인해 주세요';brMusicUi();};
            if(stage==='start')brMusicPreloadFinal();
            if(!waitForEarlyMetadata&&pendingSeek===0)begin();else if(audio.readyState>=1)audio.onloadedmetadata();
            else try{audio.load();}catch(_){brBgm.blocked=true;brBgm.status='음원 연결을 확인해 주세요';}
            brMusicUi();
        }

function brMusicMatch(meta){return String(BRMP.roomCode)+'|'+Number(meta?.matchRound||0)+'|'+Number(meta?.battleStartedAt||0);}

function brMusicBattleElapsed(meta){return Math.max(0,(brNow()-Number(meta?.battleStartedAt||brNow()))/1000);}

function brMusicCatchUp(){
            var meta=BRMP.roomMeta,a=brBgm.audio;
            if(meta?.phase!=='battle'||!a||brBgm.match!==brMusicMatch(meta))return false;
            var elapsed=brMusicBattleElapsed(meta),early=brBgm.duration.start;
            if(brBgm.stage==='start'&&early>0&&elapsed>=early){brMusicPlay('final',elapsed-early);return true;}
            if(brBgm.stage==='start'&&elapsed>=2&&!(early>0)){brMusicPlay('start',elapsed,true);return true;}
            var target=brBgm.stage==='final'&&early>0?Math.max(0,elapsed-early):elapsed;
            if(brBgm.stage==='final'&&brBgm.duration.final>0)target%=brBgm.duration.final;
            if(a.readyState>=1&&Math.abs(Number(a.currentTime||0)-target)>2)try{a.currentTime=target;}catch(_){}
            return false;
        }

function brMusicSync(meta,gesture=false){
            if(!brMusicRole()||!meta||!BRMP.roomCode||meta.phase==='closed'){brMusicStop();return;}
            brMusicUi();if(meta.phase==='results'){
                if(brBgm.stage!=='results'){brBgm.generation++;brMusicClearFade();brMusicRelease(brBgm.next);brBgm.next=null;
                    var ending=brBgm.audio;brBgm.audio=null;brBgm.stage='results';if(ending){ending.onended=null;ending.onloadedmetadata=null;ending.onerror=null;brMusicFade(ending,650);}}
                brMusicUi();return;
            }
            if(!brBgm.pref.enabled){if(brBgm.audio||brBgm.next)brMusicStop();brBgm.room=BRMP.roomCode;brMusicUi();return;}
            if(brBgm.room==='pending'&&brBgm.stage==='ready'&&meta.phase!=='battle')brBgm.room=BRMP.roomCode;
            if(brBgm.room&&brBgm.room!==BRMP.roomCode)brMusicStop();
            var freshRoom=!brBgm.room;brBgm.room=BRMP.roomCode;
            if(meta.phase==='battle'){
                var key=brMusicMatch(meta),elapsed=brMusicBattleElapsed(meta);
                if(brBgm.match!==key){brBgm.match=key;
                    if(elapsed>=2&&brBgm.duration.start>0&&elapsed>=brBgm.duration.start)brMusicPlay('final',elapsed-brBgm.duration.start);
                    else brMusicPlay('start',elapsed>=2?elapsed:0,elapsed>=2);
                }else if(gesture&&(brBgm.blocked||brBgm.audio?.paused)){
                    brBgm.blocked=false;if(brBgm.stage==='start'&&elapsed>=2&&brBgm.duration.start>0&&elapsed>=brBgm.duration.start)brMusicPlay('final',elapsed-brBgm.duration.start);
                    else if(brBgm.audio&&!brMusicCatchUp())brMusicAttempt(brBgm.audio,brBgm.generation);
                }
            }else if(['lobby','quiz','draft'].includes(meta.phase)){
                if(brBgm.stage!=='ready'){
                    brBgm.match='';if(brBgm.stage==='results'||freshRoom||brBgm.stage!=='ready')brMusicPlay('ready');
                }else if(gesture&&(brBgm.blocked||brBgm.audio?.paused)){brBgm.blocked=false;brMusicAttempt(brBgm.audio,brBgm.generation);}
            }
            brMusicUi();
        }

function brMusicPrimeHost(){if(brBgm.role!=='host'){brMusicStop();brBgm.role='host';brBgm.pref=brMusicPref('host');} // synchronous room click
            if(brBgm.pref.enabled&&!brBgm.audio){brBgm.room='pending';brMusicPlay('ready');}}

function brMusicSetPause(paused){if(brBgm.pausedForGame===!!paused)return;brBgm.pausedForGame=!!paused;
            if(paused)brBgm.audio?.pause();else if(brBgm.audio&&!brBgm.blocked&&!brMusicCatchUp())brMusicAttempt(brBgm.audio,brBgm.generation);}

function brMusicToggle(){if(!brMusicRole())return;
            if(brBgm.pref.enabled&&brBgm.blocked){brBgm.blocked=false;brBgm.status='';
                if(!brBgm.audio||brBgm.audio.error){var stage=brBgm.stage==='final'?'final':brBgm.stage==='start'?'start':'ready';
                    brMusicPlay(stage,stage==='ready'?0:stage==='final'?Math.max(0,brMusicBattleElapsed(BRMP.roomMeta)-brBgm.duration.start):brMusicBattleElapsed(BRMP.roomMeta),stage==='start');}
                else brMusicSync(BRMP.roomMeta,true);return;}
            brBgm.pref.enabled=!brBgm.pref.enabled;brMusicSave();
            if(!brBgm.pref.enabled){brMusicStop();brMusicUi();return;}
            brBgm.blocked=false;brMusicSync(BRMP.roomMeta,true);}

function brEnsureAudio() {
            try {
                var AC=window.AudioContext||window.webkitAudioContext;if(!AC)return null;
                if(!BRMP.audioCtx)BRMP.audioCtx=new AC();
                if(BRMP.audioCtx.state==='suspended')BRMP.audioCtx.resume().catch(function(){});
                if(!BRMP.audioNoiseBuffer) {
                    var len=Math.max(1,Math.floor(BRMP.audioCtx.sampleRate*.10)),buf=BRMP.audioCtx.createBuffer(1,len,BRMP.audioCtx.sampleRate),ch=buf.getChannelData(0);
                    for(var i=0;i<len;i++)ch[i]=(Math.random()*2-1)*(1-i/len);
                    BRMP.audioNoiseBuffer=buf;
                }
                return BRMP.audioCtx;
            } catch(e){return null;}
        }

const BR_HIT_PROFILES=Object.freeze([
            null,
            Object.freeze({duration:75,squash:.028,flash:.22,span:10,soundMs:48,volume:.045,frequency:640,endFrequency:270}),
            Object.freeze({duration:95,squash:.058,flash:.34,span:18,soundMs:75,volume:.070,frequency:185,endFrequency:75}),
            Object.freeze({duration:120,squash:.090,flash:.46,span:28,soundMs:110,volume:.105,frequency:95,endFrequency:40}),
            Object.freeze({duration:135,squash:.120,flash:.52,span:38,soundMs:145,volume:.125,frequency:70,endFrequency:28})
        ]);

function brPlaySfx(kind,weight) {
            const ac=BRMP.audioCtx;if(!ac||ac.state!=='running'||BRMP.soundMuted)return;
            const impact=kind==='hit'||kind==='hurt'||kind==='shield',level=typeof weight==='number'?brClamp(Math.round(weight),1,4):weight?3:2;
            const profile=BR_HIT_PROFILES[level],heavy=level>=3,now=ac.currentTime;
            // Bound synth voices before allocating any AudioNodes. BGM uses separate media elements.
            if(impact&&now-Number(BRMP.lastImpactAudioTime??-10)<(level===1?.095:.045))return;
            if(impact)BRMP.lastImpactAudioTime=now;
            const span=impact?profile.soundMs/1000:heavy?.16:.10,master=ac.createGain();master.gain.setValueAtTime(.0001,now);
            master.gain.exponentialRampToValueAtTime(impact?profile.volume:heavy?.12:.08,now+.004);master.gain.exponentialRampToValueAtTime(.0001,now+span);master.connect(ac.destination);
            const osc=ac.createOscillator(),gain=ac.createGain();osc.connect(gain);gain.connect(master);
            const tone=kind==='hit'?1.12:kind==='hurt'?.85:1;
            const start=kind==='shield'?980:impact?profile.frequency*tone:kind==='elimination'?420:kind==='skill'?310:kind==='melee'?190:390;
            const end=kind==='shield'?580:impact?profile.endFrequency*tone:kind==='elimination'?680:kind==='skill'?105:kind==='melee'?78:175;
            osc.type=kind==='shield'?'sine':impact?(level===1?'sine':'triangle'):kind==='shoot'?'square':kind==='skill'?'sawtooth':'triangle';
            osc.frequency.setValueAtTime(start,now);osc.frequency.exponentialRampToValueAtTime(end,now+span*.8);
            gain.gain.setValueAtTime(.8,now);gain.gain.exponentialRampToValueAtTime(.001,now+span*.9);
            osc.onended=()=>{osc.disconnect();gain.disconnect();master.disconnect();};osc.start(now);osc.stop(now+span);
            if((impact&&level>=2&&kind!=='shield'||kind==='melee')&&BRMP.audioNoiseBuffer){
                const noise=ac.createBufferSource(),filter=ac.createBiquadFilter(),ng=ac.createGain();noise.buffer=BRMP.audioNoiseBuffer;
                filter.type='lowpass';filter.frequency.value=level===4?550:level===3?850:1300;ng.gain.setValueAtTime(level>=3?.28:.16,now);ng.gain.exponentialRampToValueAtTime(.001,now+Math.min(.085,span*.8));
                noise.connect(filter);filter.connect(ng);ng.connect(master);noise.onended=()=>{noise.disconnect();filter.disconnect();ng.disconnect();};noise.start(now);noise.stop(now+Math.min(.09,span));
            }
        }
return {state:brBgm,urls:BR_BGM_LINKS,url:brMusicUrl,pref:brMusicPref,sync:brMusicSync,prime:brMusicPrimeHost,stop:brMusicStop,toggle:brMusicToggle,pause:brMusicSetPause,catchUp:brMusicCatchUp,ui:brMusicUi,save:brMusicSave,ensure:brEnsureAudio,sfx:brPlaySfx};
}
