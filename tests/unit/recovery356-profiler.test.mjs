import test from 'node:test';import assert from 'node:assert/strict';
import {recovery356Profile} from '../combat/recovery356-profiler.mjs';
test('private diagnostic is opt-in and separates CPU/retained allocations',async()=>{
 const prior=process.env.RECOVERY356_PROFILE;delete process.env.RECOVERY356_PROFILE;
 try{
  await assert.rejects(recovery356Profile('diagnostic-356-start'),/DIAGNOSTIC_ONLY/);
  process.env.RECOVERY356_PROFILE='1';const before=await recovery356Profile('diagnostic-356-start');
  assert.ok(before.memory.rss>0);await assert.rejects(recovery356Profile('diagnostic-356-start'),/PROFILE_ALREADY_ACTIVE/);
  const end=performance.now()+60;let sum=0;while(performance.now()<end)sum+=Math.sqrt(sum+2);
  const result=await recovery356Profile('diagnostic-356-stop');assert.ok(Number.isFinite(sum));assert.ok(result.cpuSamples>0);assert.ok(result.cpuTop.length>0);assert.ok(result.memory.rss>0);assert.ok(result.heapSpaces.length>0);
  await assert.rejects(recovery356Profile('diagnostic-356-stop'),/PROFILE_NOT_ACTIVE/);
 }finally{if(prior===undefined)delete process.env.RECOVERY356_PROFILE;else process.env.RECOVERY356_PROFILE=prior;}
});
