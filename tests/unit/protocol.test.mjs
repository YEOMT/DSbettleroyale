import test from 'node:test';
import assert from 'node:assert/strict';
import {decodeClient,encode,envelope,fingerprint,matchesFingerprint} from '../../packages/protocol/src/index.js';
test('protocol roundtrip, version/content/engine/build match',()=>{const message=envelope('HELLO',fingerprint);assert.deepEqual(decodeClient(encode(message)),message);assert.ok(matchesFingerprint(fingerprint));assert.equal(matchesFingerprint({...fingerprint,contentHash:'old'}),false);});
test('unknown commands, HP/position forgery, null/Infinity and excess inputs fail',()=>{
 for(const message of [envelope('SET_HP',{hp:10000}),envelope('ACTION',{kind:'skill',seq:1,aim:{x:1,y:0},hp:1}),envelope('INPUT_BATCH',{commands:[{seq:1,clientTick:1,move:{x:Infinity,y:0},aim:{x:1,y:0}}]}),envelope('INPUT_BATCH',{commands:Array(5).fill({seq:1,clientTick:1,move:{x:0,y:0},aim:{x:1,y:0}})})])assert.throws(()=>decodeClient(encode(message)));
 assert.throws(()=>decodeClient('{bad'));assert.throws(()=>decodeClient('{}'));
});
