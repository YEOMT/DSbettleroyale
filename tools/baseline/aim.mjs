// Preserve the original client assist solver and exact contact geometry without importing combat.
import fs from 'node:fs';
import {parse} from 'acorn';
import {analyze} from 'eslint-scope';
import {sourceUnits} from './source.mjs';
const names=['brResolveAimHelp','brAimHelpContact','brAimHelpClear','brCrateSweepTime','brCrateSectorTouches','brSectorTouches','brCrateHalf','brCrateX','brCrateY','brAimHelpAngle','brTrainPower'];
let result='// Generated from v32.1 by tools/baseline/aim.mjs. Presentation intent only.\nexport function installAim(scope){\n';
for(const name of names){const u=sourceUnits().find(u=>u.name===name);if(!u)throw Error(name);const ast=parse(u.code,{ecmaVersion:'latest',ranges:true,sourceType:'module'}),refs=analyze(ast,{ecmaVersion:2022,sourceType:'module',optimistic:true}).scopes.flatMap(s=>s.references).filter(r=>!r.resolved||r.resolved.scope.type==='module');let code=u.code;const changes=new Map();for(const r of refs){const n=r.identifier;if(!['Math','Number','Object','Array','String','Boolean','undefined'].includes(n.name))changes.set(n.start,[n.end,'scope.'+n.name]);}for(const [start,[end,replacement]]of [...changes].sort((a,b)=>b[0]-a[0]))code=code.slice(0,start)+replacement+code.slice(end);result+='scope.'+name+' = '+code+';\n';}
result+='}\n';fs.writeFileSync('apps/client/src/input/original-aim.js',result);
