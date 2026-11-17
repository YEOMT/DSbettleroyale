import test from 'node:test';import assert from 'node:assert/strict';
import {observeCaptureLayout} from '../../apps/client/src/ui/capture-layout.js';
test('capture layout observer does not write during delivery; coalesces and cancels on exit',()=>{
 const saved={ResizeObserver:globalThis.ResizeObserver,document:globalThis.document,requestAnimationFrame:globalThis.requestAnimationFrame,cancelAnimationFrame:globalThis.cancelAnimationFrame};let callback,hidden=false,next=0,dispatches=0,writes=0;const pending=new Map(),style=new Map();
 globalThis.ResizeObserver=class{constructor(cb){callback=cb;}observe(){}};
 globalThis.requestAnimationFrame=cb=>{pending.set(++next,cb);return next;};globalThis.cancelAnimationFrame=id=>pending.delete(id);
 globalThis.document={body:{style:{getPropertyValue:k=>style.get(k),setProperty:(k,v)=>{writes++;style.set(k,v);}}},dispatchEvent(){dispatches++;}};
 const flush=()=>{const frames=[...pending.values()];pending.clear();for(const f of frames)f();};
 try{const element={classList:{contains:()=>hidden},getBoundingClientRect:()=>({bottom:132.2})},watch=observeCaptureLayout(element);
 callback();callback();assert.equal(writes,0);assert.equal(pending.size,1);flush();assert.equal(style.get('--br-cap-bottom'),'133px');assert.equal(writes,1);assert.equal(dispatches,1);
 callback();watch.cancel();hidden=true;flush();assert.equal(pending.size,0);assert.equal(writes,1);callback();assert.equal(pending.size,0);
 hidden=false;callback();flush();assert.equal(writes,1,'unchanged geometry is not rewritten');assert.equal(dispatches,2);
 }finally{Object.assign(globalThis,saved);}
});
