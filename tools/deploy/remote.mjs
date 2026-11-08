import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {verifyPages} from './verify-pages.mjs';
import {createHash} from 'node:crypto';
const action=process.argv[2],target=process.env.TARGET,sha=process.env.RELEASE_SHA,root=process.env.DEPLOY_STATE_DIR,host=process.env.DEPLOY_HOST,user=process.env.DEPLOY_USER;
if(!['staging','production'].includes(target)||!/^[/a-zA-Z0-9_.-]+$/.test(root||'')||!root.startsWith('/')||!/^[-a-zA-Z0-9.]+$/.test(host||'')||!/^[-a-zA-Z0-9_]+$/.test(user||'')||!sha?.match(/^[a-f0-9]{40}$/)||!process.env.SSH_KEY||!process.env.KNOWN_HOSTS)throw Error('BLOCKED_CONFIGURATION');
const sshDir=path.join(os.homedir(),'.ssh');fs.mkdirSync(sshDir,{recursive:true,mode:0o700});fs.writeFileSync(sshDir+'/release-key',process.env.SSH_KEY,{mode:0o600});fs.writeFileSync(sshDir+'/release-hosts',process.env.KNOWN_HOSTS,{mode:0o600});
const opts=['-i',sshDir+'/release-key','-o','IdentitiesOnly=yes','-o','BatchMode=yes','-o','StrictHostKeyChecking=yes','-o','UserKnownHostsFile='+sshDir+'/release-hosts','-o','ConnectTimeout=15'];
const remote=user+'@'+host,bundle='artifacts/candidate',q=s=>"'"+s.replaceAll("'","'\\''")+"'";
const ssh=command=>execFileSync('ssh',[...opts,remote,command],{encoding:'utf8',timeout:900000,maxBuffer:4e6});
const scp=(from,to)=>execFileSync('scp',[...opts,'-r',from,to],{stdio:'inherit',timeout:600000});
const folder=root+'/releases/'+sha;
const controller=process.env.CONTROLLER_SHA;
if(controller&&!/^[a-f0-9]{40}$/.test(controller))throw Error('INVALID_CONTROLLER_SHA');
const command=(verb,...args)=>ssh(controller?`python3 ${q(root+'/controllers/'+controller+'/host.py')} ${q(root)} ${q(target)} ${q(verb)} ${q(sha)} ${args.map(q).join(' ')}`:`DEPLOY_STATE_DIR=${q(root)} bash ${q(folder+'/ops/deploy/install-release.sh')} ${q(target)} ${q(verb)} ${q(sha)}`);
const status=()=>JSON.parse(command('status'));
async function smoke(version,config){
 fs.writeFileSync('artifacts/expected-release.json',JSON.stringify(version));
 execFileSync(process.execPath,[fileURLToPath(new URL('./smoke.mjs',import.meta.url))],{stdio:'inherit',timeout:45000,env:{...process.env,DEPLOY_RUNTIME:path.resolve(bundle+'/ops/package.json'),RELEASE_FILE:'artifacts/expected-release.json',PUBLIC_HTTP_API_URL:config.http,PUBLIC_WSS_URL:config.ws,CLIENT_ORIGIN:target==='production'?'https://yeomt.github.io':config.http}});
}
if(action==='upload'){
 ssh(`test -f ${q(root+'/config.json')} && mkdir -p ${q(root+'/incoming/'+sha)}`);
 // Upload into a temporary location; never overwrite an already retained release.
 scp(bundle+'/.',remote+':'+root+'/incoming/'+sha+'/');
 ssh(`if test -d ${q(folder)}; then cmp ${q(folder+'/manifest.json')} ${q(root+'/incoming/'+sha+'/manifest.json')}; else mv ${q(root+'/incoming/'+sha)} ${q(folder)}; fi`);
 if(controller){
  const repo=fileURLToPath(new URL('../../',import.meta.url)),source=fileURLToPath(new URL('./host.py',import.meta.url));
  if(execFileSync('git',['-C',repo,'rev-parse','HEAD'],{encoding:'utf8'}).trim()!==controller||execFileSync('git',['-C',repo,'status','--porcelain','--','tools/deploy'],{encoding:'utf8'}).trim())throw Error('UNTRUSTED_CONTROLLER_CHECKOUT');
  const data=fs.readFileSync(source),digest=createHash('sha256').update(data).digest('hex'),local='artifacts/controller';fs.mkdirSync(local,{recursive:true});fs.writeFileSync(local+'/host.py',data);fs.writeFileSync(local+'/controller.json',JSON.stringify({sourceSha:controller,hostSha256:digest}));
  const incoming=root+'/incoming/controller-'+controller,dest=root+'/controllers/'+controller;ssh(`mkdir -p ${q(incoming)} ${q(root+'/controllers')}`);scp(local+'/.',remote+':'+incoming+'/');
  ssh('python3 -c '+q(`import pathlib,hashlib,json; p=pathlib.Path(${JSON.stringify(incoming)}); d=pathlib.Path(${JSON.stringify(dest)}); m=json.loads((p/'controller.json').read_text()); assert m['sourceSha']==${JSON.stringify(controller)} and hashlib.sha256((p/'host.py').read_bytes()).hexdigest()==m['hostSha256']; assert not d.exists() or ((d/'controller.json').read_bytes()==(p/'controller.json').read_bytes() and hashlib.sha256((d/'host.py').read_bytes()).hexdigest()==m['hostSha256']); p.rename(d) if not d.exists() else None`));
 }
}else if(action==='download'){
 fs.mkdirSync(bundle,{recursive:true});scp(remote+':'+folder+'/.',bundle+'/');
}else if(action==='record-validation'){
 if(!controller)throw Error('TRUSTED_CONTROLLER_REQUIRED');
 const proof='artifacts/verified-validation.json';if(!fs.existsSync(proof))throw Error('MISSING_VERIFIED_VALIDATION');
 const incoming=root+'/incoming/validation-'+sha+'.json';scp(proof,remote+':'+incoming);console.log(command('record-validation',incoming));
}else if(action==='preflight'){console.log(command('preflight'));
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
 execFileSync(process.execPath,[fileURLToPath(new URL('./browser-smoke.mjs',import.meta.url))],{stdio:'inherit',timeout:180000,env:{...process.env,DEPLOY_RUNTIME:path.resolve(bundle+'/ops/package.json'),SMOKE_URL:target==='production'?m.targets.pages.http:m.targets.staging.http,SMOKE_HOST_SECRET:secret}});
 console.log(command('verified'));
 if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,`DEPLOYED_VERIFIED: ${target} ${sha}\n\n${m.targets[target].http}\nPrevious: ${status().previous?.releaseId||'none (first staging)'}\n`);
}else if(action==='restore'){
 const before=status();if(!before||before.release!==sha){if(before&&!['DEPLOYED_VERIFIED','ROLLED_BACK','DEFERRED'].includes(before.phase))throw Error('OTHER_TRANSACTION_ACTIVE');if(process.env.GITHUB_OUTPUT)fs.appendFileSync(process.env.GITHUB_OUTPUT,'pages=false\n');console.log('No transaction for this release; existing pair preserved.');process.exit(0);}
 console.log(command('restore'));const s=status();fs.writeFileSync('artifacts/transaction.json',JSON.stringify(s));
 if(s.phase==='ROLLBACK_STAGED'&&target==='production'){fs.mkdirSync('artifacts/previous-pages',{recursive:true});scp(remote+':'+root+'/production/pages-previous/.','artifacts/previous-pages/');}
 if(process.env.GITHUB_OUTPUT)fs.appendFileSync(process.env.GITHUB_OUTPUT,`pages=${s.phase==='ROLLBACK_STAGED'&&target==='production'}\n`);
}else if(action==='finish-rollback'){
 const s=status();if(s?.release===sha&&s.phase==='ROLLBACK_STAGED'){
  const m=JSON.parse(fs.readFileSync(bundle+'/manifest.json'));
  if(s.previous)await smoke(s.previous.version,m.targets[target]);
  if(target==='production')try{await verifyPages(m.targets.pages.http,'artifacts/previous-pages');}catch(e){command('rollback-failed');throw e;}
  console.log(command('finish-rollback'));
 }
}else throw Error('INVALID_REMOTE_ACTION');
