// One-time, reproducible migration tool. Production imports checked-in ES modules,
// never the original HTML, this tool, an interpreter or a browser runtime.
import fs from 'node:fs';
import path from 'node:path';
import {parse} from 'acorn';
import * as walk from 'acorn-walk';
import {analyze} from 'eslint-scope';
import {sourceUnits} from './source.mjs';
const units=sourceUnits();
const byName=new Map();
for(const u of units){
  if(u.node.type==='VariableDeclaration')for(const d of u.node.declarations)byName.set(d.id.name,u);
  else if(u.node.type==='FunctionDeclaration'||u.node.type==='ClassDeclaration'||!byName.has(u.name))byName.set(u.name,u);
}
const replacements={
 brNow:'function brNow(){return room.now();}',
 brUid:'function brUid(prefix){return prefix+":"+(++room.idSequence);}',
 brRunMatchKey:'function brRunMatchKey(){return room.matchId;}',
 brRingKey:'function brRingKey(){return room.matchId;}',
 brCombatTrace:'function brCombatTrace(type,data){room.trace(type,data);}',
 updateHUD:'function updateHUD(){}',
 endGame:'function endGame(winner,options){room.finish(winner,options);}',
 brGraphicsProfile:'function brGraphicsProfile(){return {source:256,preset:"high"};}',
 brPlayerConnected:'function brPlayerConnected(p){return p&&p.connected!==false;}',
 brAimHelpContext:`function brAimHelpContext(kind,power,p,g){if(!p||!g)return null;const a=p.ability,mods=p.run?.mods||{},profile=brAimHelpProfile(a,kind,p.radius,power,mods),bounds=brViewerBounds(p,BRMP.inputs[p.remoteId]);bounds.hw-=BR_VIEW_PAD;bounds.hh-=BR_VIEW_PAD;return {host:true,self:p,g,a,origin:p.pos,radius:p.radius,profile,bounds,now:room.now(),team:p.team,walls:g.walls,boxes:g.farmBoxes||[]};}`,
};
const methodOverrides={
 'GameWorld.isOnlineHost':'isOnlineHost(){return true;}',
 'GameWorld.drawLaser':`drawLaser(from,to,color,width=6,meta={}){const delta=to.sub(from),length=delta.mag(),dir=length>0?delta.norm():new Vec2(1,0);this.emitStudentFx('laser',from,{dx:dir.x,dy:dir.y,size:length,color:color||'#fff',amount:width,sourceId:meta.owner?.remoteId||'',geometry:brFxCommand(meta.owner,'beam',{width,part:meta.part||'tether'})});}`,
};
function edit(code,changes){for(const e of changes.sort((a,b)=>b[0]-a[0]))code=code.slice(0,e[0])+e[2]+code.slice(e[1]);return code;}
function clean(u){
 if(replacements[u.name])return replacements[u.name];
 let code=u.code;
 if(u.node.type==='ClassDeclaration'){
  const edits=[];
  for(const m of u.node.body.body){const name=m.key.name,key=u.name+'.'+name;
   if(methodOverrides[key])edits.push([m.start-u.node.start,m.end-u.node.start,methodOverrides[key]]);
   else if(/^draw/.test(name))edits.push([m.start-u.node.start,m.end-u.node.start,'']);
  }
  code=edit(code,edits);
 }
 if(u.name==='brFarm'){
   const ast=parse(code,{ecmaVersion:'latest'}),edits=[];
   walk.simple(ast,{FunctionDeclaration(n){if(n.id?.name==='drawStudent')edits.push([n.start,n.end,'']);}});
   code=edit(code,edits).replace(/drawStudent\s*,/g,'').replace(/,\s*drawStudent(?=\s*})/g,'');
 }
 return code
 .replace(/this\.cacheCanvas=brActorEmojiCanvas\(ability\.e,brGraphicsProfile\(\)\.source\);/g,'')
 .replace(/document\.hidden/g,'false')
 .replace(/performance\.now\(\)/g,'room.now()')
 .replace(/Date\.now\(\)/g,'room.now()')
 .replace(/Math\.random/g,'room.random')
 .replace(/canvas\.width/g,'0').replace(/canvas\.height/g,'0')
 .replace(/window\.innerWidth/g,'1280').replace(/window\.innerHeight/g,'720')
 .replace(/this\.endTimer = setTimeout\(\(\) => \{ if\(!this\.resultShown\) endGame\(winner\); \}, onlineClass\?1100:1500\);/g,'room.finish(winner);')
 .replace(/['"]firebase['"]/g,"'authority'")
 .replace(/brNow\(\)-Number\(input\._receivedAt\|\|0\)<2600/,'brNow()-Number(input._receivedAt||0)<250');
}
function metadata(code){
 const ast=parse(code,{ecmaVersion:'latest',ranges:true,sourceType:'module'});
 const scopes=analyze(ast,{ecmaVersion:2022,sourceType:'module',optimistic:true,ignoreEval:true});
 const refs=scopes.scopes.flatMap(s=>s.references).filter(r=>!r.resolved||r.resolved.scope.type==='module');
 return {ast,refs};
}
const selected=new Set(),missing=new Set();
function select(name){
 if(name==='BRMP')return;
 const u=byName.get(name);if(!u){if(!['window','room','console','Math','Object','Number','Array','Set','Map','WeakMap','String','Boolean','JSON','Infinity','undefined','Error','Uint8Array','Float32Array','parseInt'].includes(name))missing.add(name);return;}
 if(selected.has(u))return;selected.add(u);
 const code=clean(u),{refs}=metadata(code);
 for(const r of refs){const name=r.identifier.name;if(byName.get(name)!==u)select(name);}
 for(const [,name]of code.matchAll(/window\.(\w+)/g))if(name!=='BRMP')select(name);
}
const roots=['GameWorld','Participant','BRRework','registerSRework','registerOtherReworkedCharacters','registerV29','bridgeNativeCombat','integrateReworkDefinitions','brFarm','brProgression','brProgressionCombat','brApplyPlayerInput','brRespawnPlayer','brTeamKillDeath','brTeamKillProcessInput','brTeamKillSelf','brCaptureResults','brTKPersonalRows','brTKRecordKill','brValidateQuestionText','brPrepareQuizQuestion','brAbilityIndex','BR_TIER_CHANCES','BR_DEFAULT_QUESTIONS','brTKBalancedTeams','brWirePlayer','brRunSnapshot'];
// Preserve the precise roster edits and registration ordering, including name restoration.
for(const u of units.filter(u=>u.script===0&&u.index>=48&&u.index<=60))select(u.name);
select('statement-1-143');
for(const n of [...roots,'seedRandom','brTeamKillInit','brRingInitWorld','brViewerBounds','brViewContains','brViewSegment','brCapturePacket','brTKBuildBoard'])select(n);
// Property assignments are explicit because JavaScript lexical analysis cannot resolve them.
for(const n of ['brProgression','brProgressionCombat','brFarm'])select(n);
function group(u){
 const n=u.name;
 if(u.script===0){
  if(u.index>=304)return 'abilities/'+({304:'rework-core',305:'s-rank',306:'other-ranks',307:'v29',308:'native-bridge',309:'metadata'}[u.index]);
  if(n==='GameWorld')return 'world/world';
  if(n==='Participant')return 'combat/participant';
  if(['Projectile','Turret','Zone'].includes(n))return 'combat/'+n.toLowerCase();
  if(u.index>=221&&u.index<=243)return 'modes/ring';
  if(u.index>=244&&u.index<=259)return 'modes/capture';
  if(n==='brFarm'||u.index>=164&&u.index<=180)return 'farm/resources';
  if(u.index>=72&&u.index<=88)return 'movement/geometry';
  if(u.index>=137&&u.index<=142||n==='ConfettiParticle')return 'events/transients';
  if(u.index>=143&&u.index<=156)return 'visibility/terrain';
  if(u.index>=89&&u.index<=118)return 'collision/contacts';
  if(u.index>=182&&u.index<=201||n==='brRecordDeathCause')return 'combat/status';
  return 'world/rules';
 }
 if(u.index>=137&&u.index<=160)return 'progression/growth';
 if(u.index>=221&&u.index<=229||/^brTK|brCapture(Rows|Results|RecordKill|Teams|Board)/.test(n))return 'modes/respawn';
 if(u.index>=196&&u.index<=210||/^brValidateAim|brAimHelp|brAimAssist/.test(n))return 'combat/player-input';
 if(u.index>=48&&u.index<=75)return 'combat/profiles';
 if(u.index>=234&&u.index<=275)return 'events/wire';
 return 'world/helpers';
}
const groups=new Map(),mapping=[];
for(const u of [...selected].sort((a,b)=>a.script-b.script||a.index-b.index)){
 const code=clean(u),{ast,refs}=metadata(code),edits=[],globalNames=new Set();
 const declarationIds=new Set(ast.body[0].type==='VariableDeclaration'?ast.body[0].declarations.map(d=>d.id.start):[]);
 for(const ref of refs){const id=ref.identifier;if(globalNames.has(id.start))continue;globalNames.add(id.start);
  if(declarationIds.has(id.start))continue;
  let value;if(id.name==='window')value='room';else if(id.name==='BRMP')value='room.session';else if(byName.has(id.name))value='room.'+id.name;
  if(value){let shorthand=false;walk.ancestor(ast,{Identifier(n,anc){if(n===id){const p=anc.at(-2);shorthand=p?.type==='Property'&&p.shorthand;}}});edits.push([id.start,id.end,shorthand?id.name+':'+value:value]);}
 }
 let output;
 if(ast.body[0].type==='VariableDeclaration'){
  const node=ast.body[0];
  for(const d of node.declarations)edits.push([d.id.start,d.id.end,'room.'+d.id.name]);
  edits.push([node.start,node.start+node.kind.length,'']);
  output=edit(code,edits)+';';
 }else if(['FunctionDeclaration','ClassDeclaration'].includes(ast.body[0].type)){
  output='room.'+ast.body[0].id.name+' = '+edit(code,edits)+';';
 }else output=edit(code,edits);
 output=output.replace(/room\.BRMP\b/g,'room.session').replace(/\broom\./g,'__brScope.');
 const key=group(u);if(!groups.has(key))groups.set(key,{declarations:[],initializers:[]});
 const isDecl=/^(FunctionDeclaration|ClassDeclaration)$/.test(ast.body[0].type);
 groups.get(key)[isDecl?'declarations':'initializers'].push({order:u.script*1000+u.index,output});
 mapping.push({original:u.name,script:u.script,line:u.node.loc.start.line,module:key});
}
const imports=[],installs=[],initializers=[];
let index=0;
for(const [key,g]of groups){
 const file='packages/engine/src/'+key+'.js';fs.mkdirSync(path.dirname(file),{recursive:true});
 const text=`// Extracted from v32.1. Room-scoped bindings; see docs/source-map.json.\nexport function install(__brScope){\n${g.declarations.map(d=>d.output).join('\n\n')}\n}\nexport const initializers=[\n${g.initializers.map(i=>`[${i.order},__brScope=>{${i.output}}]`).join(',\n')}\n];\n`;
 fs.writeFileSync(file,text);
 imports.push(`import {install as install${index},initializers as init${index}} from './${key}.js';`);
 installs.push(`install${index}(room);`);initializers.push('...init'+index);index++;
}
fs.writeFileSync('packages/engine/src/registry.js',`${imports.join('\n')}\nexport function installRules(room){${installs.join('\n')}\nfor(const [,init] of [${initializers.join(',')}].sort((a,b)=>a[0]-b[0]))init(room);return room;}\n`);
fs.writeFileSync('docs/source-map.json',JSON.stringify(mapping,null,2)+'\n');
console.log(JSON.stringify({modules:groups.size,units:selected.size,external:[...missing].sort()},null,2));
