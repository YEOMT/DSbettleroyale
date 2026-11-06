// Allocation/lifetime fixture, not a continuous-play performance verdict.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {auditHarness} from '../fidelity-v33-2/harness.mjs';
const label=process.argv[2]||'candidate',baseline=label==='before';
const h=await auditHarness({players:2,renderer:'pixi',mode:'team-capture',quality:'balanced'}),started=performance.now(),report={label};
try{
 await h.battle();const page=h.student;await page.waitForFunction(async()=>{const r=(await import('/src/main.js')).renderer;return r.cameraPose;});
 report.resources=await page.evaluate(async()=>{
  const {renderer:r,timeline:t}=await import('/src/main.js');r.enabled=false;const view=t.frame(),self=view.self,at=performance.now(),counts=()=>({sprites:r.sprites.size,labels:r.labels.size,textures:r.textures.size,tracks:r.tracks.size,deaths:r.deaths.size});
  const before=counts();for(let i=0;i<100;i++)r.draw({...view,farm:{...view.farm,x:[[10000+i,self.x,self.y,1,0]]}},at+i*17);
  r.draw({...view,farm:{...view.farm,x:[]}},at+1701);const after=counts(),retiredDrops=[...r.labels.keys()].filter(k=>k.startsWith('drop-')).length;
  const ownedSources=[...r.textures.values()].map(x=>x.source),levelSources=[...r.sprites].filter(([k])=>k.startsWith('level-')).map(([,s])=>s.texture.source);r.reset();
  return {before,after,retiredDrops,reset:counts(),unreleasedOwnedSources:ownedSources.filter(s=>!s.destroyed).length,unreleasedLevelSources:levelSources.filter(s=>!s.destroyed).length};
 });
 if(!baseline){assert.equal(report.resources.retiredDrops,0,'retired drop labels retained');assert.equal(report.resources.unreleasedOwnedSources,0);assert.equal(report.resources.unreleasedLevelSources,0,'level texture sources survive reset');for(const value of Object.values(report.resources.reset))assert.equal(value,0);}
 assert.deepEqual(h.errors,[]);report.status=baseline?'MEASURED':'PASS';
}finally{report.ms=performance.now()-started;fs.mkdirSync('artifacts/tablet-stability',{recursive:true});fs.writeFileSync('artifacts/tablet-stability/'+label+'-resources.json',JSON.stringify(report,null,2));await h.close();console.log(report);}
