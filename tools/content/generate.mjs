// Current authority content, deliberately independent of legacy HTML extraction.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {createRuleContext} from '../../packages/engine/src/index.js';
import {currentCard} from './cards.mjs';
import {rosterAudit} from './audit-report.mjs';
// Keep baseline serialization for IEEE-754 roundoff (Node/browser), never for
// changed numbers. This avoids changing old content for a one-ULP expression.
function canonicalRoundoff(value,reference){
 if(typeof value==='number'&&typeof reference==='number'&&Math.abs(value-reference)<=1e-12)return reference;
 if(Array.isArray(value))return value.map((x,i)=>canonicalRoundoff(x,reference?.[i]));
 if(value&&typeof value==='object'){const keys=[...Object.keys(reference||{}).filter(k=>Object.hasOwn(value,k)),...Object.keys(value).filter(k=>!reference||!Object.hasOwn(reference,k))];return Object.fromEntries(keys.map(k=>[k,canonicalRoundoff(value[k],reference?.[k])]));}
 return value;
}
export function effectiveContent(){
 const r=createRuleContext(),legacy=JSON.parse(fs.readFileSync('tests/baseline/content.json','utf8'));
 const content={roster:r.EMOJI_DB.map(a=>{const p=new r.Participant(a.id,a.n,a,new r.Vec2(0,0));return {id:a.id,name:a.n,tier:a.t,emoji:a.e,ability:a,maxHp:p.maxHp,radius:p.radius,speed:p.speed,damageMult:p.damageMult,basic:r.brProgressionCombat.basicProfile(a),skill:r.BRRework.defs[a.id]?.skill||r.brGetPlayableSkillInfo(a),timing:p.abilityTiming};}),retired:legacy.retired,history:legacy.history,reworkDefinitions:r.BRRework.defs,augments:r.brProgression.catalog,wanggui:r.BR_WANGGUI,xp:r.BR_RUN_XP,maxLevel:r.BR_RUN_MAX_LEVEL,maxChoices:r.BR_RUN_MAX_CHOICES,pathMaxTier:r.BR_RUN_PATH_MAX_TIER,deathXpCap:r.BR_DEATH_XP_CAP,ring:r.BR_RING_RULES,capture:r.BR_CAPTURE_RULES,respawn:r.BR_TEAM_KILL_RULES,tierChances:r.BR_TIER_CHANCES,questions:r.BR_DEFAULT_QUESTIONS,rosterVersion:r.BR_ROSTER_VERSION,
 balancePolicy:{bcBaseHp:1.06,rangedOutwardPush:.88,initialXp:1.10,soloInitialMultiplier:1.27,xpWave:1.10,healWave:1.15,genieHp:56,genieLifeTicks:1440}};
 // Legacy prose remains an immutable audit reference, never current card input.
 const cards=Object.fromEntries(r.EMOJI_DB.map(a=>[a.id,currentCard(r,a)]));
 const display={rosterVersion:r.BR_ROSTER_VERSION,odds:r.BR_TIER_CHANCES.map(([rank,p])=>rank+' '+Math.round(p*100)+'%').join(' · '),cards};
 return {content:canonicalRoundoff(JSON.parse(JSON.stringify(content)),legacy),display};
}
const {content,display}=effectiveContent(),hash=crypto.createHash('sha256').update(JSON.stringify(content)).digest('hex');
const outputs={
 'packages/content/src/manifest.js':'// Generated from current authority runtime by npm run content:generate; legacy baseline remains immutable.\nexport const contentHash='+JSON.stringify(hash)+';\nexport const manifest='+JSON.stringify(content,null,2)+';\n',
 'packages/content/src/display.js':'// Generated from current authority runtime. Display text only; no client combat.\nexport const display='+JSON.stringify(display,null,2)+';\n',
 'docs/roster86-text-audit.md':rosterAudit(content,display)
};
for(const [file,text]of Object.entries(outputs)){if(process.argv.includes('--check')){if(fs.readFileSync(file,'utf8').replaceAll('\r\n','\n')!==text)throw Error('STALE_GENERATED_CONTENT '+file);}else fs.writeFileSync(file,text);}
console.log(JSON.stringify({roster:content.roster.length,rosterVersion:content.rosterVersion,contentHash:hash,check:process.argv.includes('--check')}));
