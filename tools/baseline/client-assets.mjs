import fs from 'node:fs';
import {parse} from 'acorn';
import * as walk from 'acorn-walk';
import {analyze} from 'eslint-scope';
import {html,sourceUnits} from './source.mjs';
fs.mkdirSync('apps/client/src/render',{recursive:true});
const styles=[...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m=>m[1]).join('\n');
fs.writeFileSync('apps/client/src/ui/original.css',styles);
const markup=html.slice(html.indexOf('    <div id="br-app">'),html.indexOf('    <script src="https://www.gstatic'));
fs.writeFileSync('apps/client/index.html',`<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="br-build" content="v33.0.0"><title>이모지 클래스 배틀 · v33</title></head><body>${markup}<script type="module" src="/src/main.js"></script></body></html>`);
const units=sourceUnits(),byName=new Map();
for(const u of units){if(u.node.type==='VariableDeclaration')for(const d of u.node.declarations)byName.set(d.id.name,u);else if(u.node.type==='FunctionDeclaration')byName.set(u.name,u);}
const chosen=new Set();
function info(code){const ast=parse(code,{ecmaVersion:'latest',ranges:true,sourceType:'module'}),scopes=analyze(ast,{ecmaVersion:2022,sourceType:'module',optimistic:true});return {ast,refs:scopes.scopes.flatMap(s=>s.references).filter(r=>!r.resolved||r.resolved.scope.type==='module')};}
function add(name){if(['BRMP','game','BRRework'].includes(name))return;const u=byName.get(name);if(!u||chosen.has(u))return;if(u.node.type==='ClassDeclaration')throw Error('Unexpected class '+name);chosen.add(u);for(const r of info(u.code).refs)if(byName.get(r.identifier.name)!==u)add(r.identifier.name);}
for(const n of ['brCombatPainter','brPaintReworkEntities','brPaintReworkStatus','brPaintAttack','brPaintGround','brPaintSmoke','brPaintCrate','brActorEmojiCanvas','brLevelCanvasDraw','brTeamKillColor'])add(n);
function edits(code,list){for(const [a,b,text]of list.sort((a,b)=>b[0]-a[0]))code=code.slice(0,a)+text+code.slice(b);return code;}
const funcs=[],init=[];
for(const u of [...chosen].sort((a,b)=>a.script-b.script||a.index-b.index)){
 const {ast,refs}=info(u.code),changes=[],seen=new Set(),node=ast.body[0],decl=new Set(node.declarations?.map(d=>d.id.start)||[]);
 for(const r of refs){const n=r.identifier;if(seen.has(n.start)||decl.has(n.start))continue;seen.add(n.start);if(byName.has(n.name)){let short=false;walk.ancestor(ast,{Identifier(id,parents){if(id===n){const p=parents.at(-2);short=p?.type==='Property'&&p.shorthand;}}});changes.push([n.start,n.end,(short?n.name+':':'')+'__visualScope.'+n.name]);}}
 if(node.type==='VariableDeclaration'){changes.push([0,node.kind.length,'']);for(const d of node.declarations)changes.push([d.id.start,d.id.end,'__visualScope.'+d.id.name]);init.push(edits(u.code,changes));}
 else funcs.push('__visualScope.'+node.id.name+' = '+edits(u.code,changes)+';');
}
fs.writeFileSync('apps/client/src/render/original-painters.js',`// Original v32.1 Canvas/Pixi painter implementation; no combat execution.\nexport function createPainters(session){const __visualScope={BRMP:session,game:null};\n${funcs.join('\n\n')}\n${init.join('\n')}\nreturn __visualScope;}\n`.replace(/window\.BRMP/g,'__visualScope.BRMP'));
console.log('Preserved original HTML/CSS and',chosen.size,'painter units');
