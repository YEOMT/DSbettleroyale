import test from 'node:test';import assert from 'node:assert/strict';
import {createRuleContext} from '../../packages/engine/src/index.js';
import {manifest} from '../../packages/content/src/manifest.js';
import {display} from '../../packages/content/src/display.js';
import {currentCard} from '../../tools/content/cards.mjs';
import {applyRosterText,reviewedTextIds} from '../../packages/engine/src/world/roster-text.js';
const deleted=['emoji-048','emoji-065','emoji-073','emoji-076'];
test('84 active IDs have reviewed current text, exact generated cards and authority facts',()=>{
 const r=createRuleContext(),ids=r.EMOJI_DB.map(a=>a.id);assert.equal(ids.length,84);assert.equal(new Set(ids).size,84);
 for(const group of [reviewedTextIds,Object.keys(display.cards),manifest.roster.map(a=>a.id)])assert.deepEqual([...group].sort(),[...ids].sort());
 for(const id of deleted){assert.ok(!ids.includes(id));assert.equal(display.cards[id],undefined);assert.equal(r.BRRework.defs[id],undefined);assert.ok(!r.BR_V32_NATIVE_SKILLS.has(id));}
 for(const a of r.EMOJI_DB){
  const card=currentCard(r,a);assert.deepEqual(display.cards[a.id],card,a.id+' generated card');
  assert.ok(card.concept&&card.basic&&card.skill&&card.label,a.id+' complete prose');assert.doesNotMatch(card.label,/^고유 스킬$/);
  assert.equal(card.facts.basic.close,r.brBasicCombatProfile(a).close);
  assert.ok(card.facts.skill.cooldownFrames>0);assert.ok(card.facts.skill.aimRange>=0);
  const p=new r.Participant(1,'Audit',a,new r.Vec2(0,0));r.brInitRun(p);
  assert.deepEqual(card.facts.eligibleAugments,Object.keys(r.brProgression.catalog).filter(id=>r.brProgression.eligible(p,id)),a.id+' actual eligibility');
 }
 assert.deepEqual(r.BR_TIER_CHANCES,[['S',.1],['A',.2],['B',.25],['C',.3],['F',.15]]);
});
test('reviewed text pass changes only declared prose keys, never numeric or identity fields',()=>{
 const r=createRuleContext(),textKeys=new Set(['concept','desc','description','basicSummary','skillSummary','skillLabel','skillDesc']);
 const project=value=>Array.isArray(value)?value.map(project):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).filter(([k,v])=>!textKeys.has(k)&&typeof v!=='function').map(([k,v])=>[k,project(v)])):value;
 const before=project({roster:r.EMOJI_DB,defs:r.BRRework.defs});
 for(const a of r.EMOJI_DB){a.concept='stale';a.desc='stale';a.basicSummary='stale';a.skillSummary='stale';}
 applyRosterText(r);assert.deepEqual(project({roster:r.EMOJI_DB,defs:r.BRRework.defs}),before);
});
test('known stale concepts, duplicate basic tags and two reworks match the current kit',()=>{
 assert.doesNotMatch(display.cards['emoji-089'].concept,/원반/);assert.match(display.cards['emoji-089'].concept,/농구/);
 assert.doesNotMatch(display.cards['emoji-122'].concept,/화분/);assert.match(display.cards['emoji-122'].concept,/통조림/);
 assert.doesNotMatch(display.cards['emoji-127'].concept,/폭탄/);assert.match(display.cards['emoji-127'].skill,/넉백이 45% 증가/);
 assert.match(display.cards['emoji-034'].skill,/반사|직선/);assert.equal(display.cards['emoji-034'].facts.skill.cooldownFrames,945);
 assert.match(display.cards['emoji-070'].basic,/×1.5/);assert.match(display.cards['emoji-070'].skill,/5초/);assert.equal(display.cards['emoji-070'].facts.skill.durationFrames,300);
 assert.equal((display.cards['emoji-013'].basic.match(/흡혈/g)||[]).length,1);
 assert.equal((display.cards['emoji-063'].basic.match(/3발/g)||[]).length,1);
 assert.doesNotMatch(display.cards['emoji-003'].skill,/기본 피해 160|여섯 발/);
 assert.equal(display.cards['emoji-003'].facts.skill.damageCoefficient,11.55);assert.equal(display.cards['emoji-003'].facts.skill.finalDamageCoefficient,17.85);
 assert.match(display.cards['emoji-089'].skill,/피해 계수 43.26/);
 assert.doesNotMatch(display.cards['emoji-102'].skill,/전장 전체/);assert.match(display.cards['emoji-099'].skill,/전장 전체/);
});
