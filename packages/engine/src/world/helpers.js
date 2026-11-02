// Extracted from v32.1. Room-scoped bindings; see docs/source-map.json.
export function install(__brScope){
__brScope.brNow = function brNow(){return __brScope.now();};

__brScope.brClamp = function brClamp(v,a,b) { return Math.max(a,Math.min(b,v)); };

__brScope.brShuffle = function brShuffle(arr, randomFn) {
            var out=arr.slice(), rnd=randomFn||__brScope.random;
            for(var i=out.length-1;i>0;i--){var j=Math.floor(rnd()*(i+1));var t=out[i];out[i]=out[j];out[j]=t;}
            return out;
        };

__brScope.brNormalizeQuizText = function brNormalizeQuizText(value) {
            var text=String(value==null?'':value);
            try{text=text.normalize('NFKC');}catch(e){}
            return text.replace(/[\u200B-\u200D\uFEFF]/g,'').replace(/\s+/g,' ').trim().toLocaleLowerCase('ko-KR');
        };

__brScope.brQuizHash = function brQuizHash(value) {
            var text=__brScope.brNormalizeQuizText(value),h=2166136261>>>0;
            for(var i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}
            return (h>>>0).toString(36);
        };

__brScope.brPrepareQuizQuestion = function brPrepareQuizQuestion(raw,index) {
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
            var correctText=String(values[0]==null?'':values[0]).trim(),correctNorm=__brScope.brNormalizeQuizText(correctText);
            var qid='q-'+index+'-'+__brScope.brQuizHash(prompt+'|'+correctNorm),seen=new Set(),answers=[];
            values.forEach(function(value,optionIndex){
                var text=String(value==null?'':value).trim(),normalized=__brScope.brNormalizeQuizText(text);
                if(!normalized||seen.has(normalized))return;
                seen.add(normalized);
                answers.push({id:qid+(optionIndex===0?':answer':':choice-'+optionIndex),text:text,normalized:normalized,isCorrect:normalized===correctNorm});
            });
            if(!prompt||!correctNorm||answers.length<2)return null;
            return {id:qid,prompt:prompt,correctId:qid+':answer',correctNormalized:correctNorm,answers:answers};
        };

__brScope.brHashRandom = function brHashRandom(seedText) {
            var h=2166136261>>>0;
            for(var i=0;i<seedText.length;i++){h^=seedText.charCodeAt(i);h=Math.imul(h,16777619);}
            return function(){h+=0x6D2B79F5;var t=h;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};
        };

__brScope.brUid = function brUid(prefix){return prefix+":"+(++__brScope.idSequence);};

__brScope.brValidateQuestionText = function brValidateQuestionText(text) {
            var lines=String(text||'').replace(/^\uFEFF/,'').split(/\r\n|\n|\r/),questions=[],errors=[],nonEmpty=0;
            lines.forEach(function(raw,lineIndex){
                var line=String(raw||'').trim();if(!line)return;
                nonEmpty++;
                if(questions.length>=500){errors.push({line:lineIndex+1,message:'최대 500문제까지만 불러올 수 있습니다.'});return;}
                var parts=line.split('|').map(function(value){return String(value||'').trim();});
                if(parts.length!==5){errors.push({line:lineIndex+1,message:'항목 수 오류 · 문제, 정답, 오답 3개가 필요합니다.'});return;}
                if(parts.some(function(value){return !__brScope.brNormalizeQuizText(value);})){
                    errors.push({line:lineIndex+1,message:'빈 항목이 있습니다.'});return;
                }
                var optionKeys=parts.slice(1).map(__brScope.brNormalizeQuizText);
                if(new Set(optionKeys).size!==4){errors.push({line:lineIndex+1,message:'정답과 오답 보기는 서로 달라야 합니다.'});return;}
                if(!__brScope.brPrepareQuizQuestion(parts,questions.length)){
                    errors.push({line:lineIndex+1,message:'문제 형식을 읽을 수 없습니다.'});return;
                }
                questions.push(parts);
            });
            return {questions:questions,errors:errors,total:nonEmpty};
        };

__brScope.brRollTier = function brRollTier(rnd) {
            var r=Number((rnd||__brScope.random)());
            if(!Number.isFinite(r)||r<0||r>=1)throw new Error('등급 추첨 난수가 잘못되었습니다.');
            var cumulative=0;
            for(var i=0;i<__brScope.BR_TIER_CHANCES.length;i++){
                cumulative+=__brScope.BR_TIER_CHANCES[i][1];
                if(r<Math.round(cumulative*100)/100||i===__brScope.BR_TIER_CHANCES.length-1)return __brScope.BR_TIER_CHANCES[i][0];
            }
        };

__brScope.brAbilityIndex = function brAbilityIndex(mode, excludeIndex, unusedEmojiSet, rnd) {
            rnd=rnd||__brScope.random;
            // Select the rank before a character. Exclusion never changes that rank's odds.
            var tier=__brScope.brRollTier(rnd),pool=[];
            for(var i=0;i<__brScope.EMOJI_DB.length;i++){
                var a=__brScope.EMOJI_DB[i];
                if(a.t!==tier||(mode==='solo'&&a.teamOnly))continue;
                pool.push(i);
            }
            if(!pool.length)throw new Error('추첨 가능한 '+tier+'급 캐릭터가 없습니다. 로스터 설정을 확인하세요.');
            if(pool.length>1&&pool.indexOf(excludeIndex)>=0)pool=pool.filter(function(i){return i!==excludeIndex;});
            var choice=Number(rnd());
            if(!Number.isFinite(choice)||choice<0||choice>=1)throw new Error('캐릭터 추첨 난수가 잘못되었습니다.');
            return pool[Math.floor(choice*pool.length)];
        };

__brScope.brCapturePacket = function brCapturePacket(g){const c=g.capture;return {v:__brScope.BR_CAPTURE_RULES.version,k:c.key,m:c.map.revision,n:c.count,q:(c.wireSeq=Number(c.wireSeq||0)+1),f:g.frame,a:c.active,t:c.seconds,ph:c.phase,am:c.activeMask,fv:c.fever,h:__brScope.now(),p:Number(c.hostAt||__brScope.now()),run:!(g.paused||g.ringSuspended||g.isGameOver),s:c.scores.slice(1),r:c.rates.slice(1),z:c.points.map(z=>[z.state,z.team,z.counts.slice(1),z.rate]),w:c.winners.slice(),end:c.reason};};
}
export const initializers=[
[1007,__brScope=>{ __brScope.BR_TIER_COLOR = {S:'#ff3859',A:'#facc15',B:'#60a5fa',C:'#34d399',F:'#cbd5e1'};;}],
[1009,__brScope=>{ __brScope.BR_TIER_CHANCES=Object.freeze([['S',.10],['A',.20],['B',.25],['C',.30],['F',.15]]);;}],
[1010,__brScope=>{ __brScope.BR_DEFAULT_QUESTIONS = [
            ['rent','v. 빌리다','v. 빌려주다','v. 구매하다','v. 돌려주다'],
            ['develop','v. 발전시키다, 성장하다','v. 감소시키다','v. 보호하다','v. 예측하다'],
            ['upload','v. ~을 전송하다, 업로드하다','v. ~을 내려받다, 다운로드하다','v. ~을 삭제하다','v. ~을 인쇄하다'],
            ['method','n. 방법, 방식','n. 결과, 성과','n. 태도, 자세','n. 양, 액수'],
            ['purchase','n. 구매, 구매품','n. 대여, 임대','n. 판매, 매출','n. 교환, 교환품'],
            ['recommend','v. 추천하다, 권하다','v. 피하다','v. 분석하다','v. 확인하다'],
            ['trace','n. 흔적, 자취','n. 증상, 징후','n. 상징, 기호','n. 물건, 물체'],
            ['analyze','v. 분석하다','v. 예측하다','v. 포함하다','v. 나타나다'],
            ['predict','v. 예측하다','v. 추천하다','v. 상징하다','v. 구부리다'],
            ['amount','n. 양, 액수','n. 방법, 방식','n. 산업, 공업','n. 존경, 경의'],
            ['communication','n. 통신, 의사소통','n. 사회','n. 데이터베이스','n. 경기력, 성과'],
            ['flu','n. 독감, 유행성 감기','n. 범죄','n. 증상, 징후','n. 산업, 공업'],
            ['influence','v. 영향을 주다','v. 피하다','v. 포함하다','v. 확인하다'],
            ['avoid','v. 피하다','v. 발전시키다','v. 나타내다','v. 추천하다'],
            ['spread','n. 확산, 전파','n. 흔적, 자취','n. 구매, 구매품','n. 충실, 충성'],
            ['symptom','n. 증상, 징후','n. 독감, 유행성 감기','n. 태도, 자세','n. 상징, 기호'],
            ['database','n. 데이터베이스','n. 통신, 의사소통','n. 산업, 공업','n. 시대, 왕조'],
            ['improve','v. 향상하다, 향상시키다','v. 피하다','v. 구부리다','v. 나타나다'],
            ['include','v. 포함하다','v. 분석하다','v. 예측하다','v. 추천하다'],
            ['performance','n. 경기력, 성과','n. 행동','n. 방법, 방식','n. 통신, 의사소통'],
            ['focus on','~에 주력하다','역할을 하다','~할 것 같다','~에게 …을 상기시키다'],
            ['crime','n. 범죄','n. 정의, 공정','n. 사회','n. 충실, 충성'],
            ['identify','v. 확인하다, 알아보다','v. 분석하다','v. 예측하다','v. 추천하다'],
            ['industry','n. 산업, 공업','n. 사회','n. 데이터베이스','n. 시대, 왕조'],
            ['play a role','역할을 하다','~에 주력하다','~할 것 같다','특히, 특별히'],
            ['be likely to','~할 것 같다','역할을 하다','~에 주력하다','~에도 불구하고'],
            ['dynasty','n. 시대, 왕조','n. 산업, 공업','n. 사회','n. 정의, 공정'],
            ['carp','n. 잉어','n. 대나무','n. 연꽃','n. 물건, 물체'],
            ['bamboo','n. 대나무','n. 잉어','n. 연꽃','n. 민화'],
            ['lotus flower','연꽃','대나무','잉어','민화'],
            ['object','n. 물건, 물체','n. 상징, 기호','n. 방법, 방식','n. 흔적, 자취'],
            ['symbol','n. 상징, 기호','n. 물건, 물체','n. 태도, 자세','n. 충실, 충성'],
            ['loyalty','n. 충실, 충성','n. 존경, 경의','n. 정의, 공정','n. 행동'],
            ['appear','v. 나타나다, 출현하다','v. 꽃을 피우다','v. 구부러지다','v. 포함하다'],
            ['folk painting','민화','연꽃','시대, 왕조','상징, 기호'],
            ['represent','v. 나타내다, 상징하다','v. 포함하다','v. 피하다','v. 분석하다'],
            ['disappointed','a. 실망한','a. 얼어붙은','a. 아픈, 병든','a. 상징적인'],
            ['frozen','a. 얼어붙은','a. 실망한','a. 아픈, 병든','a. 상징적인'],
            ['ill','a. 아픈, 병든','a. 얼어붙은','a. 실망한','a. 상징적인'],
            ['respect','n. 존경, 경의','n. 충실, 충성','n. 정의, 공정','n. 태도, 자세'],
            ['once upon a time','옛날 옛날에','이런 이유 때문에','특히, 특별히','~에도 불구하고'],
            ['symbolic','a. 상징적인','a. 실망한','a. 얼어붙은','a. 아픈, 병든'],
            ['symbolize','v. 상징하다','v. 분석하다','v. 포함하다','v. 예측하다'],
            ['bend','v. 굽다, 구부러지다','v. 꽃을 피우다','v. 나타나다','v. 피하다'],
            ['bloom','v. 꽃을 피우다, 꽃이 피다','v. 굽다, 구부러지다','v. 나타나다','v. 분석하다'],
            ['for this reason','이런 이유 때문에','옛날 옛날에','특히, 특별히','~에도 불구하고'],
            ['despite','prep. ~에도 불구하고','이런 이유 때문에','특히, 특별히','옛날 옛날에'],
            ['justice','n. 정의, 공정','n. 범죄','n. 충실, 충성','n. 존경, 경의'],
            ['thus','ad. 그러므로, 따라서','특히, 특별히','~에도 불구하고','옛날 옛날에'],
            ['attitude','n. 태도, 자세','n. 행동','n. 경기력, 성과','n. 방법, 방식'],
            ['behavior','n. 행동','n. 태도, 자세','n. 통신, 의사소통','n. 경기력, 성과'],
            ['remind ~ of','~에게 …을 상기시키다','~에 주력하다','역할을 하다','~할 것 같다'],
            ['in particular','특히, 특별히','그러므로, 따라서','~에도 불구하고','옛날 옛날에'],
            ['society','n. 사회','n. 산업, 공업','n. 시대, 왕조','n. 통신, 의사소통']
        ];;}],
[1435,__brScope=>{ __brScope.BR_AIM_HELP=Object.freeze({searchMs:80,freshMs:450,tapMs:220,
            ranged:Object.freeze({cone:12,max:4,gain:.30,tap:35}),
            melee:Object.freeze({cone:25,max:10,gain:.40,tap:50}),
            precision:Object.freeze({cone:8,max:2.5,gain:.25,tap:0}),
            skill:Object.freeze({cone:10,max:3,gain:.30,tap:0})});;}]
];
