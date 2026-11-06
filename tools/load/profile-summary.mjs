import fs from 'node:fs';
import path from 'node:path';
const dir=process.argv[2],report=[];
for(const name of fs.readdirSync(dir).filter(n=>n.endsWith('.cpuprofile'))){
 const profile=JSON.parse(fs.readFileSync(path.join(dir,name))),nodes=new Map(profile.nodes.map(n=>[n.id,n])),totals=new Map();let total=0;
 for(let i=0;i<profile.samples.length;i++){
  const n=nodes.get(profile.samples[i]),time=profile.timeDeltas[i]||0;total+=time;
  let url=n.callFrame.url.replaceAll('\\','/');const cut=url.indexOf('/packages/');const app=url.indexOf('/apps/');if(cut>=0)url=url.slice(cut+1);else if(app>=0)url=url.slice(app+1);else if(url.startsWith('file:'))url=url.slice(url.lastIndexOf('/')+1);
  const key=(n.callFrame.functionName||'(anonymous)')+' '+url+':'+(n.callFrame.lineNumber+1);totals.set(key,(totals.get(key)||0)+time);
 }
 report.push({file:name,durationSeconds:total/1e6,top:[...totals].sort((a,b)=>b[1]-a[1]).slice(0,45).map(([fn,micros])=>({fn,ms:micros/1000,percent:micros/total*100}))});
}
console.log(JSON.stringify(report,null,2));
