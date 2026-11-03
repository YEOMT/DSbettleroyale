export function trustedRun(run,repo,sha,workflow){
 if(!/^[a-f0-9]{40}$/.test(sha)||run.repository?.full_name!==repo||run.head_repository?.full_name!==repo||run.head_branch!=='main'||run.head_sha!==sha||run.conclusion!=='success'||run.path!==workflow||!['push','workflow_run'].includes(run.event))throw Error('UNTRUSTED_ARTIFACT_RUN');
 return true;
}
export async function github(path){const r=await fetch('https://api.github.com'+path,{headers:{Authorization:'Bearer '+process.env.GITHUB_TOKEN,Accept:'application/vnd.github+json'},signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('GITHUB_'+r.status);return r.json();}
