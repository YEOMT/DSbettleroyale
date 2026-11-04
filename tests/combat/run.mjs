import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
const renderer=process.argv[2];
if(!['canvas','pixi'].includes(renderer))throw Error('INVALID_RENDERER');
const started=Date.now(),steps=[];
fs.mkdirSync('artifacts/combat',{recursive:true});
function run(args,env={}){
 const t=Date.now(),result=spawnSync(process.execPath,args,{stdio:'inherit',windowsHide:true,env:{...process.env,...env},timeout:Math.max(1,540000-(t-started))});
 const status=result.error?.code==='ETIMEDOUT'?'TIMEOUT':result.error?'INFRA_FAILURE':result.status===0?'PASS':'FAIL';
 steps.push({args,ms:Date.now()-t,status});
 if(status!=='PASS')throw Error(status+' '+args.join(' '));
}
try{
 run(['tests/combat/session.mjs',renderer]);
 run(['tests/combat/aim.mjs',renderer]);
 if(renderer==='canvas'){run(['tests/combat/origin-contract.mjs']);run(['tests/combat/motion.mjs']);run(['tests/releaseops/audio.mjs']);}
 run(['tests/fidelity-v33-2/all77.mjs',renderer,'balanced'],{FIDELITY_CHARACTERS:'emoji-006,emoji-012,emoji-066,emoji-085,emoji-132'});
}finally{fs.writeFileSync('artifacts/combat/jobs-'+renderer+'.json',JSON.stringify({ms:Date.now()-started,steps},null,2));}
