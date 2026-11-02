import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleFlight} from '../../apps/client/src/presentation/flight.js';
test('authoritative corner path is not interpolated through the reflecting wall',()=>{
 const shot={id:'bounce',kind:'projectile',x:50,y:50,curved:true,turn:1,path:[0,0,0,0,5,50,0,1,10,50,50,1]};
 const p=sampleFlight(shot,{...shot,x:0,y:0,turn:0},10,7,0);assert.equal(p.x,50);assert.equal(p.y,20);const held=sampleFlight(shot,null,10,15);assert.equal(held.x,50);assert.equal(held.y,50);
});
test('straight native/RW extrapolation obeys remaining range and bounded horizon',()=>{
 const n=sampleFlight({kind:'projectile',native:true,x:0,y:0,dx:20,dy:0,rangeRemaining:25,remaining:10},null,10,20);assert.equal(n.x,25);
 const rw=sampleFlight({kind:'projectile',x:0,y:0,dx:0,dy:1,speed:30,remaining:500},null,10,50);assert.equal(rw.y,180);
});
