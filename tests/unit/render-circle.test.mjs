import test from 'node:test';
import assert from 'node:assert/strict';
import {Graphics} from 'pixi.js';
import {captureCircle} from '../../apps/client/src/render/capture-circle.js';
const bounds=g=>{const b=g.getBounds();return [b.minX,b.minY,b.maxX,b.maxY];};
test('display-sized capture circle retains exact warning boundary, width and next shape transform',()=>{
 for(const detail of [1,.6,.05])for(const width of [0,40]){
  const g=new Graphics(),reference=new Graphics();
  captureCircle(g,-100,200,550,detail,{color:'#93c5fd',alpha:.85},{color:'#93c5fd',alpha:.85,width});
  reference.circle(-100,200,550).fill({color:'#93c5fd',alpha:.85});if(width)reference.stroke({color:'#93c5fd',alpha:.85,width});
  assert.deepEqual(bounds(g),bounds(reference));
  const style=g.context.instructions[width?1:0].data.style;
  assert.equal(style.color,0x93c5fd);assert.equal(style.alpha,.85);if(width)assert.equal(style.width,width);
  g.rect(1000,1200,150,70).fill('#fff');reference.rect(1000,1200,150,70).fill('#fff');
  assert.deepEqual(bounds(g),bounds(reference),'a warning circle cannot rescale the following attack/HP geometry');
  const m=g.context.getTransform();assert.deepEqual([m.a,m.b,m.c,m.d,m.tx,m.ty],[1,0,0,1,0,0]);
  g.destroy();reference.destroy();
 }
});
