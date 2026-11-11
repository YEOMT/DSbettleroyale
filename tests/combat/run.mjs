import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
const renderer=process.argv[2],suite=process.argv[3]||'recovery';
const pixiRole=process.env.COMBAT_PIXI_ROLE||'';
const recoveryPart=process.env.COMBAT_RECOVERY_PART||'';
if(!['recovery','continuous','touch'].includes(suite))throw Error('INVALID_SUITE');
if(!['canvas','pixi'].includes(renderer))throw Error('INVALID_RENDERER');
if(pixiRole&&(renderer!=='pixi'||suite!=='continuous'||!['attacker','opponent','host'].includes(pixiRole)))throw Error('INVALID_PIXI_ROLE');
if(recoveryPart&&(renderer!=='pixi'||suite!=='recovery'||!['controls','roster'].includes(recoveryPart)))throw Error('INVALID_RECOVERY_PART');
const started=Date.now(),steps=[];
fs.mkdirSync('artifacts/combat',{recursive:true});
function run(args,env={}){
 const t=Date.now(),result=spawnSync(process.execPath,args,{stdio:'inherit',windowsHide:true,env:{...process.env,...env},timeout:Math.max(1,540000-(t-started))});
 const status=result.error?.code==='ETIMEDOUT'?'TIMEOUT':result.error?'INFRA_FAILURE':result.status===0?'PASS':'FAIL';
 steps.push({args,ms:Date.now()-t,status});
 if(status!=='PASS')throw Error(status+' '+args.join(' '));
}
try{
 if(suite==='continuous'){
  if(!pixiRole||pixiRole==='attacker')for(const file of ['escape','capture-x','upgrade-roster','v34-broadcast','v34-roster'])run(['tests/combat/'+file+'.mjs',renderer]);
  if(!pixiRole||pixiRole==='attacker')run(['tests/combat/live-control.mjs',renderer]);
  // Software-GPU readback/encoding can stall all Pixi surfaces past the short
  // effect lifetime. Keep every live assertion; record Canvas in CI. Hardware
  // Pixi video remains available by running live-feel with COMBAT_VIDEO_DIR.
  run(['tests/combat/live-feel.mjs',renderer],{COMBAT_VIDEO_DIR:renderer==='canvas'?'artifacts/mobile-impact/canvas':'',COMBAT_LABEL:'candidate'});
  if(renderer==='canvas')run(['tests/combat/live-late.mjs','candidate']);
  // Optional classroom comparison on one isolated runner. The marker adds
  // coverage; the usual host, attacker and opponent checks always run.
  if(pixiRole==='host' && process.env.GITHUB_EVENT_NAME==='pull_request'){
   const event=JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH));
   if(event.pull_request?.body?.includes('[classroom-compare]'))run(['tests/combat/classroom-compare.mjs']);
  }
 }else if(suite==='touch'){
  run(['tests/combat/mobile-touch.mjs',renderer]);
  if(renderer==='canvas')run(['tests/combat/mobile-touch.mjs','canvas','webkit']);
 }else{
  if(renderer==='canvas'){run(['tests/combat/classroom-rematch.mjs']);run(['tests/combat/classroom-ui.mjs']);}
  if(recoveryPart!=='roster'){
   run(['tests/combat/classroom-aim.mjs',renderer]);
   run(['tests/combat/session.mjs',renderer]);
   run(['tests/combat/aim.mjs',renderer]);
   if(renderer==='pixi')run(['tests/combat/host-end-delivery.mjs']);
  }
  if(renderer==='canvas'){run(['tests/combat/safe-pause.mjs']);run(['tests/combat/origin-contract.mjs']);run(['tests/combat/motion.mjs']);run(['tests/releaseops/audio.mjs']);}
  if(recoveryPart!=='controls')run(['tests/fidelity-v33-2/all77.mjs',renderer,'balanced'],{FIDELITY_CHARACTERS:'emoji-006,emoji-012,emoji-066,emoji-085,emoji-132'});
 }
}finally{const part=pixiRole||recoveryPart;fs.writeFileSync('artifacts/combat/jobs-'+suite+'-'+renderer+(part?'-'+part:'')+'.json',JSON.stringify({ms:Date.now()-started,steps},null,2));}
