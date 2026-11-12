import fs from 'node:fs';import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {characterShards,verifyCharacterShard} from './character-shards.mjs';
const plan=JSON.parse(fs.readFileSync('artifacts/check-plan.json')),results=[],start=Date.now();
function run(args,env={}){const t=Date.now(),r=spawnSync(process.execPath,args,{stdio:'inherit',windowsHide:true,env:{...process.env,...env},timeout:Math.max(1,540000-(t-start))});results.push({command:args.join(' '),ms:Date.now()-t,status:r.error?.code==='ETIMEDOUT'?'TIMEOUT':r.error?'INFRA_FAILURE':r.status===0?'PASS':'FAIL'});if(r.status!==0)throw Error(results.at(-1).status);}
try{
 if(plan.browser)run(['node_modules/@playwright/test/cli.js','test']);
 if(plan.representative)for(const renderer of ['canvas','pixi'])run(['tests/fidelity/visuals.mjs'],{FIDELITY_RENDERER:renderer,FIDELITY_QUICK:'1'});
 if(process.env.CI_CHARACTER_REPORTS){
  const shards=characterShards(plan.characters);
  if(!shards.length)throw Error('UNEXPECTED_CHARACTER_SHARDS');
  for(const shard of shards){
   const dir='characters-'+process.env.GITHUB_SHA+'-'+shard.key;
   const report=JSON.parse(fs.readFileSync(path.join(process.env.CI_CHARACTER_REPORTS,dir,'all77.json')));
   results.push(verifyCharacterShard(shard,report));
  }
 }else if(plan.characters?.length)for(const renderer of ['canvas','pixi'])run(['tests/fidelity-v33-2/all77.mjs',renderer,'balanced'],{FIDELITY_CHARACTERS:plan.characters.join(',')});
 if(plan.layout){run(['tests/releaseops/layout.mjs']);run(['tests/combat/resource-lifetime.mjs']);}
 if(plan.audio)run(['tests/releaseops/audio.mjs']);
 if(plan.load)run(['tools/load/run.mjs','--players=26','--seconds=30']);
}finally{fs.writeFileSync('artifacts/targeted-results.json',JSON.stringify({ms:Date.now()-start,results,notRun:plan.notRun},null,2));}
