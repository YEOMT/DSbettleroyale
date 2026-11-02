import {sourceUnits} from './source.mjs';
for(const name of process.argv.slice(2).filter(s=>!s.startsWith('--'))){
 const u=sourceUnits().find(u=>u.name===name);
 if(!u){console.log('missing',name);continue;}
 if(process.argv.includes('--methods')&&u.node.type==='ClassDeclaration')for(const m of u.node.body.body)console.log(m.key.name,m.loc.start.line,m.end-m.start);
 else console.log(u.code);
}
