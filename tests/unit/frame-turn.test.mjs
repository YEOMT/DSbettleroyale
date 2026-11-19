import test from 'node:test';
import assert from 'node:assert/strict';
import {FrameTurn} from '../../apps/client/src/render/frame-turn.js';
import {scenes,sceneGroups,selectedScenes} from '../combat/overdrive357-scenes.mjs';
import fs from 'node:fs';
import {parse} from 'yaml';

test('every quality runs all ten identity paths exactly once with the original eight minute budget',()=>{
 const job=parse(fs.readFileSync('.github/workflows/recovery356.yml','utf8')).jobs['overdrive-identity'];
 assert.equal(job['timeout-minutes'],8);
 for(const renderer of ['canvas','pixi'])for(const quality of ['low','balanced','high']){
  const paths=job.strategy.matrix.include.filter(x=>x.renderer===renderer&&x.quality===quality).flatMap(x=>selectedScenes(x.group));
  assert.deepEqual(paths,scenes);
 }
 assert.deepEqual(sceneGroups.first.concat(sceneGroups.second),scenes);
 assert.throws(()=>selectedScenes('missing'));assert.throws(()=>selectedScenes('first','quick'));
});

test('one render task yields to delivery; stopped/replaced rounds cannot rearm a stale frame',()=>{
 const messages=[],calls=[],channel={port1:{},port2:{postMessage:id=>messages.push(id)}};
 const next=()=>channel.port1.onmessage({data:messages.shift()});
 const turn=new FrameTurn(()=>calls.push('frame'),channel);
 turn.request();turn.request();assert.equal(messages.length,1);assert.deepEqual(calls,[]);
 calls.push('RESULTS');turn.cancel();next();assert.deepEqual(calls,['RESULTS']);
 turn.request();turn.cancel();turn.request();assert.equal(messages.length,2);
 next();assert.deepEqual(calls,['RESULTS']);next();assert.deepEqual(calls,['RESULTS','frame']);
 for(let i=0;i<300;i++){turn.request();assert.equal(messages.length,1);next();}
 assert.equal(turn.pending,null);assert.equal(messages.length,0);assert.equal(calls.length,302);
});

test('pending message tasks precede the next render request; unsupported scheduling falls back without a timer',async()=>{
 const tasks=[],messages=[],calls=[],channel={port1:{},port2:{postMessage:id=>messages.push(id)}};
 const turn=new FrameTurn(()=>calls.push('render'),channel,(run,options)=>{assert.equal(options.priority,'background');tasks.push(run);return Promise.resolve();});
 turn.request();turn.request();assert.equal(tasks.length,1);assert.equal(messages.length,0);
 calls.push('socket1','socket2','input');tasks.shift()();assert.deepEqual(calls,['socket1','socket2','input','render']);
 turn.request();turn.cancel();tasks.shift()();assert.equal(calls.length,4);
 const fallback=new FrameTurn(()=>calls.push('fallback'),channel,()=>Promise.reject(Error('unsupported')));
 fallback.request();await Promise.resolve();assert.equal(messages.length,1);channel.port1.onmessage({data:messages.shift()});assert.equal(calls.at(-1),'fallback');
});
