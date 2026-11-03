import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import {execFileSync} from 'node:child_process';
import {verifyPages} from './verify-pages.mjs';
const action=process.argv[2],target=process.env.TARGET,sha=process.env.RELEASE_SHA,root=process.env.DEPLOY_STATE_DIR,host=process.env.DEPLOY_HOST,user=process.env.DEPLOY_USER;
if(!['staging','production'].includes(target)||!/^[/a-zA-Z0-9_.-]+$/.test(root||'')||!root.startsWith('/')||!/^[-a-zA-Z0-9.]+$/.test(host||'')||!/^[-a-zA-Z0-9_]+$/.test(user||'')||!sha?.match(/^[a-f0-9]{40}$/)||!process.env.SSH_KEY||!process.env.KNOWN_HOSTS)throw Error('BLOCKED_CONFIGURATION');
const sshDir=path.join(os.homedir(),'.ssh');fs.mkdirSync(sshDir,{recursive:true,mode:0o700});fs.writeFileSync(sshDir+'/release-key',process.env.SSH_KEY,{mode:0o600});fs.writeFileSync(sshDir+'/release-hosts',process.env.KNOWN_HOSTS,{mode:0o600});
const opts=['-i',sshDir+'/release-key','-o','IdentitiesOnly=yes','-o','BatchMode=yes','-o','StrictHostKeyChecking=yes','-o','UserKnownHostsFile='+sshDir+'/release-hosts','-o','ConnectTimeout=15'];
const remote=user+'@'+host,bundle='artifacts/candidate',q=s=>"'"+s.replaceAll("'","'\\''")+"'";
const ssh=command=>execFileSync('ssh',[...opts,remote,command],{encoding:'utf8',timeout:900000,maxBuffer:4e6});
const scp=(from,to)=>execFileSync('scp',[...opts,'-r',from,to],{stdio:'inherit',timeout:600000});
const folder=root+'/releases/'+sha;
const command=verb=>ssh(`DEPLOY_STATE_DIR=${q(root)} bash ${q(folder+'/ops/deploy/install-release.sh')} ${q(target)} ${q(verb)} ${q(sha)}`);
const status=()=>JSON.parse(command('status'));
async function smoke(version,config){
 fs.writeFileSync('artifacts/expected-release.json',JSON.stringify(version));
 execFileSync(process.execPath,['tools/deploy/smoke.mjs'],{stdio:'inherit',timeout:45000,env:{...process.env,RELEASE_FILE:'artifacts/expected-release.json',PUBLIC_HTTP_API_URL:config.http,PUBLIC_WSS_URL:config.ws,CLIENT_ORIGIN:target==='production'?'https://yeomt.github.io':config.http}});
}
if(action==='upload'){
 ssh(`test -f ${q(root+'/config.json')} && mkdir -p ${q(root+'/incoming/'+sha)}`);
 // Upload into a temporary location; never overwrite an already retained release.
 scp(bundle+'/.',remote+':'+root+'/incoming/'+sha+'/');
 ssh(`if test -d ${q(folder)}; then cmp ${q(folder+'/manifest.json')} ${q(root+'/incoming/'+sha+'/manifest.json')}; else mv ${q(root+'/incoming/'+sha)} ${q(folder)}; fi`);
}else if(action==='download'){
 fs.mkdirSync(bundle,{recursive:true});scp(remote+':'+folder+'/.',bundle+'/');
}else if(action==='stage'){
 console.log(command(process.env.RELEASE_MODE==='rollback'?'rollback':'stage'));
 const s=status();fs.writeFileSync('artifacts/transaction.json',JSON.stringify(s));
 if(target==='production'){for(const [remoteDir,localDir]of [['pages-previous','previous-pages'],['pages-publish','publish-pages']]){fs.mkdirSync('artifacts/'+localDir,{recursive:true});scp(remote+':'+root+'/production/'+remoteDir+'/.','artifacts/'+localDir+'/');}}
 const m=JSON.parse(fs.readFileSync(bundle+'/manifest.json'));await smoke(m.fingerprint,m.targets[target]);
}else if(action==='publishing'){console.log(command('publishing'));
}else if(action==='commit'){
 const m=JSON.parse(fs.readFileSync(bundle+'/manifest.json'));await smoke(m.fingerprint,m.targets[target]);
 if(target==='production')await verifyPages(m.targets.pages.http,bundle+'/pages');
 console.log(command('commit'));
 await smoke(m.fingerprint,m.targets[target]);
 // Read existing secret over authenticated SSH into child memory only, never outputs/artifacts.
 const secret=ssh('python3 -c '+q(`import sys,json;sys.path.insert(0,${JSON.stringify(folder+'/ops/tools/deploy')});from host import env_values;c=json.load(open(${JSON.stringify(root+'/config.json')}));print(env_values(c[${JSON.stringify(target)}]['env'])['HOST_AUTH_SECRET'])`)).trim();
 execFileSync(process.execPath,['tools/deploy/browser-smoke.mjs'],{stdio:'inherit',timeout:120000,env:{...process.env,SMOKE_URL:target==='production'?m.targets.pages.http:m.targets.staging.http,SMOKE_HOST_SECRET:secret}});
 console.log(command('verified'));
 if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,`DEPLOYED_VERIFIED: ${target} ${sha}\n\n${m.targets[target].http}\nPrevious: ${status().previous?.releaseId||'none (first staging)'}\n`);
}else if(action==='restore'){
 console.log(command('restore'));const s=status();fs.writeFileSync('artifacts/transaction.json',JSON.stringify(s));
 if(s.phase==='ROLLBACK_STAGED'&&target==='production'){fs.mkdirSync('artifacts/previous-pages',{recursive:true});scp(remote+':'+root+'/production/pages-previous/.','artifacts/previous-pages/');}
 if(process.env.GITHUB_OUTPUT)fs.appendFileSync(process.env.GITHUB_OUTPUT,`pages=${s.phase==='ROLLBACK_STAGED'&&target==='production'}\n`);
}else if(action==='finish-rollback'){
 const s=status();if(s.phase==='ROLLBACK_STAGED'){
  const m=JSON.parse(fs.readFileSync(bundle+'/manifest.json'));
  if(s.previous)await smoke(s.previous.version,m.targets[target]);
  if(target==='production')try{await verifyPages(m.targets.pages.http,'artifacts/previous-pages');}catch(e){command('rollback-failed');throw e;}
  console.log(command('finish-rollback'));
 }
}else throw Error('INVALID_REMOTE_ACTION');
