import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parse} from 'acorn';
import {Container,Sprite,Texture} from 'pixi.js';
import {TransientSprites} from '../../apps/client/src/render/transient-sprites.js';

// Exercise the actual renderer method without its browser-only module startup.
const source=fs.readFileSync('apps/client/src/render/renderer.js','utf8');
const node=parse(source,{ecmaVersion:'latest',sourceType:'module'}).body.find(n=>n.type==='ExportNamedDeclaration'&&n.declaration?.id?.name==='Renderer').declaration;
const image=node.body.body.find(n=>n.key.name==='image');
const ImageMethod=new Function('Sprite','return class {'+source.slice(image.start,image.end)+'}')(Sprite);
function renderer(){const r=new ImageMethod();r.pixi=true;r.texture=()=>Texture.EMPTY;r.sprites=new Map();r.world=new Container();r.transientSprites=new TransientSprites();return r;}
const state=s=>({x:s.x,y:s.y,rotation:s.rotation,alpha:s.alpha,width:s.width,height:s.height,skewX:s.skew.x,skewY:s.skew.y,anchorX:s.anchor.x,anchorY:s.anchor.y,tint:s.tint,blendMode:s.blendMode});

test('retired projectile is detached and drops texture references; reused image has identical transform and order',()=>{
 const r=renderer(),fresh=renderer();
 r.image({},6,8,12,'shot-old',1,.4,.2,{axisX:.6,axisY:.8});
 const old=r.sprites.get('shot-old'),retiredTexture=new Texture({source:Texture.EMPTY.source});old.texture=retiredTexture;old.tint=0xff0000;old.blendMode='add';
 r.transientSprites.release(old);r.sprites.delete('shot-old');
 assert.equal(old.parent,null);assert.equal(old.visible,false);assert.equal(old.texture,Texture.EMPTY);assert.equal(retiredTexture.destroyed,false);
 r.image({},1,2,4,'actor-stays');
 r.image({},20,40,7,'rw-next',.3,.8,0);
 fresh.image({},20,40,7,'rw-next',.3,.8,0);
 assert.equal(r.sprites.get('rw-next'),old);assert.equal(r.world.children.at(-1),old);
 assert.deepEqual(state(old),state(fresh.sprites.get('rw-next')));
 assert.equal(r.transientSprites.size,0);
 r.world.destroy({children:true});fresh.world.destroy({children:true});retiredTexture.destroy();
});

test('reserve is bounded independently of active projectile count and fully clears across five rematches',()=>{
 const pool=new TransientSprites();
 for(let round=0;round<5;round++){
  const active=Array.from({length:150},()=>pool.take(Texture.EMPTY));
  assert.equal(active.length,150);assert.equal(new Set(active).size,150);
  for(const sprite of active)pool.release(sprite);
  assert.equal(pool.size,64);assert.equal(active.filter(s=>s.destroyed).length,86);
  assert.ok(pool.free.every(s=>s.parent===null&&s.texture===Texture.EMPTY));
  pool.clear();assert.equal(pool.size,0);assert.ok(active.every(s=>s.destroyed));
 }
});

test('same 12000 shot lifecycle workload eliminates allocation churn without capping active sprites',()=>{
 function run(pooled){
  const r=renderer();if(!pooled)r.transientSprites=null;
  const seen=new WeakSet();let created=0,peak=0,previous=[];
  const start=performance.now(),cpu=process.cpuUsage();
  for(let frame=0;frame<200;frame++){
   const current=[];
   for(let i=0;i<60;i++){
    const key='shot-'+frame+'-'+i;
    r.image({},frame+i,i*2,8,key,i*.01,.9,.1,{axisX:1,axisY:0});
    const sprite=r.sprites.get(key);if(!seen.has(sprite)){seen.add(sprite);created++;}current.push(key);
   }
   peak=Math.max(peak,r.sprites.size);
   for(const key of previous){const sprite=r.sprites.get(key);pooled?r.transientSprites.release(sprite):sprite.destroy();r.sprites.delete(key);}
   previous=current;
  }
  for(const key of previous){const sprite=r.sprites.get(key);pooled?r.transientSprites.release(sprite):sprite.destroy();r.sprites.delete(key);}
  const elapsedCpu=process.cpuUsage(cpu),result={created,peak,retained:r.transientSprites?.size||0,ms:performance.now()-start,cpuMs:(elapsedCpu.user+elapsedCpu.system)/1000};
  r.transientSprites?.clear();r.world.destroy({children:true});return result;
 }
 const before=run(false),after=run(true);
 assert.equal(before.created,12000);assert.equal(after.created,120);
 assert.equal(before.peak,120);assert.equal(after.peak,120);assert.equal(after.retained,64);
 // Timing is evidence only: no speed assertion or selective rerun on shared CI.
 console.log('SMOOTH358_SPRITE_CHURN '+JSON.stringify({before,after,scope:'real Pixi Sprite allocation/transform; no GPU render; not classroom FPS'}));
});
