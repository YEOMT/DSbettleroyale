import fs from 'node:fs';import {execFileSync} from 'node:child_process';import {createHash} from 'node:crypto';
const sha=process.env.RELEASE_SHA||execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
if(!/^[a-f0-9]{40}$/.test(sha))throw Error('EXACT_SHA_REQUIRED');
if(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim()!==sha)throw Error('CHECKOUT_SHA_MISMATCH');
const root='artifacts/candidate',pub=process.env.PUBLIC_HTTP_API_URL,stage=process.env.STAGING_HTTP_URL;
const sourceDirty=!!execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim();
if(sourceDirty&&process.env.LOCAL_CANDIDATE_FIXTURE!=='1')throw Error('DIRTY_RELEASE_SOURCE');
for(const url of [pub,stage])if(!url||new URL(url).origin!==url||!url.startsWith('https://'))throw Error('BLOCKED_CONFIGURATION: exact HTTPS origins required');
if(pub===stage)throw Error('STAGING_MUST_HAVE_DISTINCT_ORIGIN');
const release=JSON.parse(fs.readFileSync('dist/release.json'));if(release.buildId!==sha)throw Error('CI_BUILD_ID_MISMATCH');
const targets={production:{http:pub,ws:pub.replace('https:','wss:')+'/ws',base:'/',environment:'production'},staging:{http:stage,ws:stage.replace('https:','wss:')+'/ws',base:'/',environment:'staging'},pages:{http:'https://yeomt.github.io/DSbettleroyale/',ws:pub.replace('https:','wss:')+'/ws',base:'/DSbettleroyale/',environment:'production'}};
fs.mkdirSync(root,{recursive:true});
for(const [name,c]of Object.entries(targets)){
 execFileSync(process.execPath,['tools/build.mjs','--client-only'],{stdio:'inherit',env:{...process.env,BUILD_ID:sha,PAGES_BUILD:name==='pages'?'1':'0',VITE_PUBLIC_WSS_URL:c.ws,VITE_RELEASE_ENV:c.environment}});
 fs.cpSync('dist/client',root+'/'+name+(name==='pages'?'':'/client'),{recursive:true});
 if(name!=='pages'){fs.cpSync('dist/server',root+'/'+name+'/server',{recursive:true});fs.cpSync('node_modules/ws',root+'/'+name+'/ws',{recursive:true});fs.copyFileSync('dist/release.json',root+'/'+name+'/release.json');}
}
fs.cpSync('deploy',root+'/ops/deploy',{recursive:true,filter:p=>!p.endsWith('.env')});fs.cpSync('tools/deploy',root+'/ops/tools/deploy',{recursive:true});
// Deployment/rollback needs no historical npm install: retain the exact small tool runtime.
for(const pkg of ['ws','playwright','playwright-core'])fs.cpSync('node_modules/'+pkg,root+'/ops/node_modules/'+pkg,{recursive:true});
fs.writeFileSync(root+'/manifest.json',JSON.stringify({schema:1,releaseId:sha,sourceSha:sha,sourceDirty,sourceTree:execFileSync('git',['rev-parse','HEAD^{tree}'],{encoding:'utf8'}).trim(),fingerprint:release,targets,images:{},checks:{status:'PENDING',quick:JSON.parse(fs.readFileSync('artifacts/quick-results.json')),targeted:JSON.parse(fs.readFileSync('artifacts/targeted-results.json'))},status:sourceDirty?'LOCAL_FIXTURE_NOT_DEPLOYABLE':'ARTIFACT_READY',previousGoodRelease:null,checksums:{}},null,2));
console.log('Candidate variants built once; server reused from exact main quick artifact.');
