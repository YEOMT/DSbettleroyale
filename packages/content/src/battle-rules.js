// Room-local drawing policy; never mutate the shared roster or normal odds.
export const DRAW_RULES=Object.freeze({normal:'일반 대전','f-only':'F급 구렁텅이 대전','s-only':'S급 천상계 대전'});
export const drawTier=rule=>rule==='f-only'?'F':rule==='s-only'?'S':null;
export const validDrawRule=rule=>Object.hasOwn(DRAW_RULES,rule);
export const abilityAllowed=(ability,mode,rule='normal')=>!!ability&&validDrawRule(rule)&&!(mode==='solo'&&ability.teamOnly)&&(!drawTier(rule)||ability.t===drawTier(rule));
export const drawRuleText=rule=>DRAW_RULES[rule]||DRAW_RULES.normal;
export const drawRuleOdds=(rule,normal)=>drawTier(rule)?drawTier(rule)+'급만 등장':normal;
