import test from 'node:test';
import assert from 'node:assert/strict';
import {hostDisplayRadius,hostInfoLayout} from '../../apps/client/src/render/host-layout.js';
import {createPainters} from '../../apps/client/src/render/original-painters.js';

test('host CSS body minimum is zoom independent; larger actual bodies retain their scale',()=>{
 for(const z of [.02,.08,.2,.5,1,1.5]){
  assert.ok(hostDisplayRadius(18,z,1366,768)*z*2>=28-1e-9);
  assert.ok(hostDisplayRadius(18,z,768,1024)*z*2>=24-1e-9);
  assert.equal(hostDisplayRadius(140,z,1920,1080),Math.max(140,14/z));
 }
 const actor={radius:18};hostDisplayRadius(actor.radius,.03);assert.equal(actor.radius,18);
});

test('movement haste and panda charge have bounded geometry-only cues until server expiry',()=>{
 const paint=createPainters({}),calls=[],p={line:(...args)=>calls.push(['line',...args]),arc:(...args)=>calls.push(['arc',...args])},state={roster10Move:true,slow:1,buffs:[{kind:'moveHaste',end:180},{kind:'pandaNextBasic',end:360}]};
 paint.brPaintReworkStatus(p,0,0,20,.5,state,179,100);assert.equal(calls.filter(c=>c[0]==='line').length,4);assert.equal(calls.filter(c=>c[0]==='arc').length,1);
 calls.length=0;paint.brPaintReworkStatus(p,0,0,20,.5,state,180,100);assert.equal(calls.length,1);assert.equal(calls[0][0],'arc');
 calls.length=0;paint.brPaintReworkStatus(p,0,0,20,.5,state,360,100);assert.equal(calls.length,0);
 paint.brPaintReworkStatus(p,0,0,20,.5,{slow:1,buffs:[{kind:'moveHaste',end:180}]},179,100);assert.equal(calls.length,0,'existing moveHaste visuals remain unchanged');
});

test('host glyph ink, level, name and HP are grouped in CSS pixels through all zoom levels',()=>{
 for(const z of [.03,.1,.5,1.4]){
  const rad=hostDisplayRadius(18,z),ink=rad*.8,l=hostInfoLayout(70,120,rad,z,32,14,70,12,ink);
  assert.ok(Math.abs((120-ink-l.level.bottom)*z-5)<1e-9);
  assert.ok(Math.abs((l.level.top-l.name.bottom)*z-3)<1e-9);
  assert.ok(Math.abs((l.hp.y-120-rad)*z-4)<1e-9);
  assert.equal(l.hp.w,rad*2);assert.equal(l.hp.h*z,4);
 }
});
