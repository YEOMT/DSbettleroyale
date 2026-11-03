import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
// Only inert CSS/Markdown changes can be low risk. JS under ui may send commands.
export function classify(files, diff='') {
 const docs=files.length>0&&files.every(f=>/^(docs\/.*\.md|README\.md)$/.test(f));
 const styles=files.length>0&&files.every(f=>/^apps\/client\/.*\.css$/.test(f))&&!/@import|url\(/.test(diff);
 const areas=new Set();
 for(const f of files){
  if(/audio/.test(f))areas.add('audio');
  if(/render|camera|presentation/.test(f))areas.add('render');
  if(/net\/|input\/|server\/|protocol\//.test(f))areas.add('network');
  if(/engine\/|content\//.test(f))areas.add('rules');
  if(/deploy|workflow|tools\/ci|build|package.*json|vite.config|AGENTS/.test(f))areas.add('releaseops');
 }
 if(!docs&&!styles&&!areas.size)areas.add('shared');
 const characters=[...new Set([...diff.matchAll(/emoji-\d{3}/g)].map(m=>m[0]))];
 return {schema:1,files,docsOnly:docs,risk:docs?'documentation':styles?'presentation':'high',
  areas:[...areas],characters,common:!docs,browser:!docs,layout:styles||areas.has('render')||areas.has('shared'),
  audio:areas.has('audio'),representative:!docs,load:[...areas].some(a=>['network','rules','shared'].includes(a)),
  deep:[],notRun:['all77','full-camera','full-layout','real-time-quiz','600s-load','physical-classroom'],
  reason:docs?'Inert documentation only':styles?'CSS only, no external imports':'Executable/shared changes conservatively retain all quick unit/parity/integration checks'};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const base=process.argv[2]||'origin/main';
 if(!/^[\w./~-]+$/.test(base))throw Error('INVALID_BASE');
 const files=[...new Set((execFileSync('git',['diff','--name-only',base],{encoding:'utf8'})+execFileSync('git',['ls-files','--others','--exclude-standard'],{encoding:'utf8'})).trim().split('\n').filter(Boolean))];
 const diff=execFileSync('git',['diff','--unified=0',base,'--','apps/client','packages'],{encoding:'utf8',maxBuffer:20e6});
 const plan=classify(files,diff);fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/check-plan.json',JSON.stringify(plan,null,2));
 if(process.env.GITHUB_OUTPUT)fs.appendFileSync(process.env.GITHUB_OUTPUT,`docs=${plan.docsOnly}\n`);
 console.log(JSON.stringify(plan,null,2));
}
