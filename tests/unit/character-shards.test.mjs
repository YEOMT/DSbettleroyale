import assert from 'node:assert/strict';
import test from 'node:test';
import {characterShards,verifyCharacterShard} from '../../tools/ci/character-shards.mjs';

test('large targeted rosters require each selected ability once on each renderer',()=>{
 const ids=['emoji-000','emoji-002','emoji-023','emoji-028','emoji-153'];
 assert.deepEqual(characterShards(ids.slice(0,4)),[]);
 const shards=characterShards(ids);
 assert.equal(shards.length,4);
 for(const renderer of ['canvas','pixi'])assert.deepEqual(shards.filter(s=>s.renderer===renderer).flatMap(s=>s.ids.split(',')),ids);
 const shard=shards.at(-1),row={renderer:'pixi',quality:'balanced',id:ids.at(-1),status:'PASS',finitePositions:true,rwStatusRaster:'PASS',frames:15,actions:['attack','skill']};
 const valid={ms:100,renderers:['pixi'],qualities:['balanced'],characters:[row.id],expectedCases:1,cases:[row]};
 assert.equal(verifyCharacterShard(shard,valid).status,'PASS');
 for(const bad of [{cases:[]},{cases:[row,row]},{characters:['emoji-152']},{renderers:['canvas']},{cases:[{...row,rwStatusRaster:'FAIL'}]}])
  assert.throws(()=>verifyCharacterShard(shard,{...valid,...bad}),/INCOMPLETE_CHARACTER_SHARD/);
});
