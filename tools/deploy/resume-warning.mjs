// Explicit, single-candidate first-transition exception. Never enabled by isolated CI.
import {requiredControls} from './validation.mjs';
export const initialRelease='db3ce3bb10d96f3b2a2d7cc14a0b645afbad10e6';
export const initialCandidateRun='42475042049';
export const resumeControls=['resumeMove','resumeAttack','resumeSkill'];
export function warningRequested({requested,releaseId,candidateRunId,target,url}){
 if(!requested)return false;
 if(releaseId!==initialRelease||String(candidateRunId)!==initialCandidateRun||target!=='production'||url!=='https://yeomt.github.io/DSbettleroyale/')throw Error('INITIAL_WARNING_SCOPE_MISMATCH');
 return true;
}
export async function checkResume({attempt,allowed,controls,warnings,diagnostics}){
 try{return await attempt();}catch(error){
  // Only the known authoritative wait failure inside post-resume controls is waived.
  // Identity assertions, browser failures, version/overload and reconnect itself stay fatal.
  if(!allowed||error.code!=='AUTHORITATIVE_STATE_TIMEOUT'||!resumeControls.includes(error.check))throw error;
  const failedCheck=error.check;
  for(const name of resumeControls)if(controls[name]!==true)controls[name]=name===failedCheck?'WARNING':'NOT_RUN';
  warnings.push({code:'POST_RESUME_CONTROL_TIMEOUT',failedCheck,stage:error.stage,diagnostics:await diagnostics()});
 }
}
export function validatePublicSmoke(report,{releaseId,allowed=false}){
 if(report.buildId!==releaseId||!['PASS','DEGRADED_RELEASE'].includes(report.status))throw Error('INVALID_PUBLIC_SMOKE');
 const degraded=report.status==='DEGRADED_RELEASE',warnings=report.warnings;
 if(!Array.isArray(warnings)||(degraded?(!allowed||warnings.length!==1||warnings[0].code!=='POST_RESUME_CONTROL_TIMEOUT'||!resumeControls.includes(warnings[0].failedCheck)):warnings.length!==0))throw Error('UNAPPROVED_PUBLIC_WARNING');
 for(const name of requiredControls){
  const value=report.controls?.[name];
  if(degraded&&resumeControls.includes(name)){
   if(name===warnings[0].failedCheck?value!=='WARNING':![true,'NOT_RUN'].includes(value))throw Error('INVALID_RESUME_RESULT');
  }else if(value!==true)throw Error('REQUIRED_PUBLIC_CONTROL_FAILED:'+name);
 }
 return report.status;
}
