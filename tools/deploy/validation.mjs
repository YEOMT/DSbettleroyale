import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';
import {trustedRun} from './trust.mjs';
export const hash=data=>createHash('sha256').update(data).digest('hex');
export const requiredChecks=['bundle','image','http-version','origins','lifecycle-controls'];
export const requiredControls=['lobby','quiz','draft','move','attack','skill','resume','resumeMove','resumeAttack','resumeSkill','results','rematch','closed'];
export function inspectBundle(dir){
 const root=path.resolve(dir),raw=fs.readFileSync(path.join(root,'manifest.json')),m=JSON.parse(raw);
 if(!/^[a-f0-9]{40}$/.test(m.releaseId)||m.sourceSha!==m.releaseId||m.fingerprint?.buildId!==m.releaseId||m.sourceDirty||m.checks?.status!=='PASS'||!/^sha256:[a-f0-9]{64}$/.test(m.images?.production))throw Error('INVALID_CANDIDATE');
 for(const target of ['production','staging','pages'])if(m.checks.variantSmoke?.filter(x=>x.name===target&&x.status==='PASS'&&x.buildId===m.releaseId).length!==1)throw Error('MISSING_VARIANT_CHECK');
 if(!Object.keys(m.checksums||{}).length)throw Error('EMPTY_CHECKSUMS');
 for(const [file,expected]of Object.entries(m.checksums)){
  const p=path.resolve(root,file);if(!p.startsWith(root+path.sep)||!fs.realpathSync(p).startsWith(fs.realpathSync(root)+path.sep)||hash(fs.readFileSync(p))!==expected)throw Error('ARTIFACT_CHECKSUM '+file);
 }
 return {manifest:m,manifestSha256:hash(raw)};
}
export function validateReceipt(receipt,{manifest:m,manifestSha256,repo,candidateRun,run,jobs,runId,toolsSha}){
 trustedRun(candidateRun,repo,m.releaseId,'.github/workflows/release.yml');
 if(candidateRun.status!=='completed'||receipt.oomKilled!==false)throw Error('INCOMPLETE_CANDIDATE_OR_OOM');
 if(run.repository?.full_name!==repo||run.head_repository?.full_name!==repo||run.path!=='.github/workflows/promote.yml'||run.event!=='workflow_dispatch'||run.head_branch!=='main'||run.head_sha!==toolsSha||String(run.id)!==String(runId)||run.status!=='in_progress')throw Error('UNTRUSTED_VALIDATION_WORKFLOW');
 if(jobs.filter(j=>j.name==='isolated'&&j.conclusion==='success').length!==1)throw Error('ISOLATED_JOB_NOT_PASSED');
 if(receipt.schema!==1||receipt.kind!=='github-actions-isolated-docker'||receipt.status!=='PASS'||receipt.repository!==repo||String(receipt.runId)!==String(runId)||receipt.runAttempt!==run.run_attempt||receipt.toolsSha!==toolsSha||String(receipt.candidateRunId)!==String(candidateRun.id)||receipt.releaseId!==m.releaseId||receipt.manifestSha256!==manifestSha256||receipt.imageId!==m.images.production)throw Error('VALIDATION_IDENTITY_MISMATCH');
 for(const key of ['buildId','contentHash','engineRevision','protocolVersion'])if(receipt.fingerprint?.[key]!==m.fingerprint[key])throw Error('VALIDATION_VERSION_MISMATCH');
 for(const name of requiredChecks)if(receipt.checks?.filter(c=>c.name===name&&c.status==='PASS').length!==1)throw Error('INCOMPLETE_ISOLATED_CHECKS');
 for(const name of requiredControls)if(receipt.controls?.[name]!==true)throw Error('INCOMPLETE_CONTROL_CHECKS');
 return true;
}
