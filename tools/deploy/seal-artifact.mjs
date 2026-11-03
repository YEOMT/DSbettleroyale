import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';import {execFileSync} from 'node:child_process';
const root='artifacts/candidate',m=JSON.parse(fs.readFileSync(root+'/manifest.json'));
if(m.sourceDirty)throw Error('DIRTY_FIXTURE_NOT_DEPLOYABLE');
for(const target of ['production','staging'])m.images[target]=execFileSync('docker',['image','inspect','--format','{{.Id}}',`dsbr-${target}:${m.releaseId}`],{encoding:'utf8'}).trim();
if([...m.checks.quick.results,...m.checks.targeted.results].some(r=>r.status!=='PASS'))throw Error('REQUIRED_CHECK_FAILED');
m.checks.status='PASS';m.checks.variantSmoke=JSON.parse(fs.readFileSync('artifacts/variant-smoke.json'));
if(m.checks.variantSmoke.length!==3||m.checks.variantSmoke.some(r=>r.status!=='PASS'||r.buildId!==m.releaseId)||new Set(m.checks.variantSmoke.map(r=>r.name)).size!==3)throw Error('VARIANT_SMOKE_INCOMPLETE');
function walk(dir){for(const item of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,item.name);if(item.isSymbolicLink())throw Error('SYMLINK_ARTIFACT');if(item.isDirectory())walk(p);else if(p!==path.join(root,'manifest.json'))m.checksums[path.relative(root,p).replaceAll('\\','/')]=createHash('sha256').update(fs.readFileSync(p)).digest('hex');}}
walk(root);fs.writeFileSync(root+'/manifest.json',JSON.stringify(m,null,2));
