import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import YAML from 'yaml';
import {classify} from '../../tools/ci/plan.mjs';import {trustedRun} from '../../tools/deploy/trust.mjs';import {readConfig} from '../../apps/server/src/config.js';
import {parse} from 'acorn';
import {selectCharacters} from '../../tools/ci/characters.mjs';
import {verifyPages} from '../../tools/deploy/verify-pages.mjs';
test('initial legacy restore verifies archived HTML/CDN and blocks a wrong published page',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'dsbr-pages-')),html='<script src="https://cdn.example/pinned.js"></script>',prior=globalThis.fetch;
 try{fs.writeFileSync(dir+'/index.html',html);globalThis.fetch=async url=>new Response(String(url).startsWith('https://cdn.example')?'external library':html);await verifyPages('https://pages.example/repo/',dir);globalThis.fetch=async()=>new Response('wrong release');await assert.rejects(verifyPages('https://pages.example/repo/',dir),/PAGES_INDEX_MISMATCH/);}finally{globalThis.fetch=prior;fs.rmSync(dir,{recursive:true});}
});
test('character selection preserves full default and selects exact changed IDs without weaker assertions',()=>{
 const roster=[{id:'emoji-001'},{id:'emoji-003'}];assert.equal(selectCharacters(roster),roster);assert.deepEqual(selectCharacters(roster,'emoji-003'),[roster[1]]);assert.throws(()=>selectCharacters(roster,'emoji-999'));
 assert.deepEqual(classify(['apps/client/src/render/rework.js'],'+ emoji-003').characters,['emoji-003']);
});
test('release tools parse and never embed credentials in public variant definitions',()=>{
 for(const dir of ['tools/ci','tools/deploy'])for(const f of fs.readdirSync(dir).filter(f=>f.endsWith('.mjs')))parse(fs.readFileSync(dir+'/'+f,'utf8'),{ecmaVersion:'latest',sourceType:'module'});
 const candidate=fs.readFileSync('tools/deploy/candidate.mjs','utf8');assert.doesNotMatch(candidate,/VITE_.*(?:HOST_AUTH_SECRET|ADMIN_SECRET)/);
});
test('CSS/docs fixtures select bounded suites, not deep; ui executable code cannot hide network changes',()=>{
 const css=classify(['apps/client/src/ui/overrides.css'],'+button { margin:2px }');assert.equal(css.risk,'presentation');assert.equal(css.layout,true);assert.equal(css.load,false);assert.deepEqual(css.deep,[]);
 assert.equal(classify(['docs/releaseops-ko.md']).docsOnly,true);
 for(const f of ['apps/client/src/ui/app.js','packages/protocol/src/index.js','packages/engine/src/index.js','package-lock.json','unknown.js']){const p=classify([f]);assert.equal(p.risk,'high');assert.equal(p.common,true);assert.equal(p.browser,true);}
 assert.equal(classify(['apps/client/src/net/connection.js']).load,true);
 assert.equal(classify(['apps/client/src/ui/overrides.css'],'+@import "x.css"').risk,'high');
});
test('release provenance binds repo/event/branch/SHA/workflow and refuses newer heads',()=>{
 const sha='a'.repeat(40),run={repository:{full_name:'owner/repo'},head_repository:{full_name:'owner/repo'},head_branch:'main',head_sha:sha,conclusion:'success',path:'.github/workflows/release.yml',event:'workflow_run'};
 assert.equal(trustedRun(run,'owner/repo',sha,run.path),true);
 for(const patch of [{head_sha:'b'.repeat(40)},{event:'pull_request'},{head_branch:'feature'},{conclusion:'cancelled'},{head_repository:{full_name:'attacker/repo'}},{path:'other.yml'}])assert.throws(()=>trustedRun({...run,...patch},'owner/repo',sha,run.path));
});
test('persisted admission blocks crash/restart until commit, then permits subsequent restart',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'dsbr-admission-')),file=path.join(dir,'state');
 try{assert.equal(readConfig({DRAIN_STATE_FILE:file}).drainOnStart,true);fs.writeFileSync(file,'closed');assert.equal(readConfig({DRAIN_STATE_FILE:file}).drainOnStart,true);fs.writeFileSync(file,'open');assert.equal(readConfig({DRAIN_STATE_FILE:file,DRAIN_ON_START:'false'}).drainOnStart,false);assert.equal(readConfig({DRAIN_STATE_FILE:file,DRAIN_ON_START:'true'}).drainOnStart,true);}finally{fs.rmSync(dir,{recursive:true});}
});
test('workflow gates and bounded selection are explicit; privileged operations never run on PR',()=>{
 const load=n=>YAML.parse(fs.readFileSync('.github/workflows/'+n+'.yml','utf8')),ci=load('ci');
 assert.deepEqual(ci.on.push.branches,['main']);assert.ok(Object.hasOwn(ci.on,'pull_request'));assert.equal(ci.jobs.quick['timeout-minutes'],10);assert.equal(ci.jobs['required-checks'].if,'always()');assert.match(ci.jobs['required-checks'].steps[0].run,/skipped/);
 for(const name of ['release','promote','rollback','recover']){const w=load(name);assert.equal(w.concurrency['cancel-in-progress'],false);assert.equal(w.on.pull_request,undefined);for(const j of Object.values(w.jobs))for(const s of j.steps||[])assert.notEqual(s['continue-on-error'],true);}
 for(const name of ['promote','rollback']){const w=load(name);assert.ok(w.on.workflow_dispatch);assert.match(w.jobs.deploy.if,/PRODUCTION_WS_ENABLED/);assert.ok(w.jobs.deploy.steps.some(s=>s.uses==='actions/deploy-pages@v4'&&s.with.artifact_name==='restore-pages'));assert.match(w.jobs.deploy.steps.find(s=>s.uses==='actions/checkout@v4').with.ref,/inputs.release_id/);assert.match(w.jobs.deploy.steps[0].run,/NOT_TRUSTED_MAIN_ANCESTOR/);}
 assert.ok(Object.hasOwn(load('deep').on,'workflow_dispatch'));
 for(const name of ['promote','rollback','recover'])assert.ok(Object.values(load(name).jobs).every(j=>(j.steps||[]).every(s=>!s.run?.includes('npm ci')&&!s.run?.includes('npm run build'))));
 assert.ok(load('rollback').jobs.deploy.steps.some(s=>s.run==='node tools/deploy/remote.mjs download'));
});
