import assert from 'node:assert/strict';import {auditHarness} from '../fidelity-v33-2/harness.mjs';
const h=await auditHarness({players:2});
try{
 await h.battle();
 const result=await h.host.evaluate(async()=>{const {audio}=await import('/src/main.js');audio.volume=.37;const volume=audio.volume,enabled=audio.enabled;audio.toggle();const toggled=audio.enabled;audio.toggle();audio.stop();return {volume,enabled,toggled,buffer:audio.history.length};});
 assert.equal(result.volume,.37);assert.notEqual(result.enabled,result.toggled);assert.ok(result.buffer<=160);
 await h.command('END');await h.command('REMATCH');assert.deepEqual(h.errors,[]);
}finally{await h.close();}
