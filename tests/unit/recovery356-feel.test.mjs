import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parse} from 'acorn';
import {Sprite,Texture} from 'pixi.js';
import {AttackPoses,poseEnvelope,poseFamily} from '../../apps/client/src/render/attack-pose.js';

const actor=(id='a',abilityId='emoji-025',lifeSeq=2)=>({id,abilityId,lifeSeq,alive:true,radius:32,x:40,y:80});
const shot=(id='a',seq=1,tick=10)=>({type:'SHOT_SPAWN',serverTick:tick,data:{owner:id,life:2,actionKind:'skill',actionSeq:seq,dx:1,dy:0}});
const hit=(id='a',tick=11,level=3)=>({type:'FX',serverTick:tick,data:{kind:'hit',sourceId:'b',targetId:id,amount:30,impactLevel:level,dx:-1,dy:0,geometry:{confirmed:true,targetLife:2,lifeSeq:2,castId:'hit-'+tick,ordinal:0}}});
const wall=(id='a',tick=12,castId='wall-1')=>({type:'FX',serverTick:tick,data:{kind:'impact',style:'heavy-wall',sourceId:'b',targetId:id,dx:1,dy:0,geometry:{confirmed:true,stage:'wall',profile:'fist',lifeSeq:2,targetLife:2,castId}}});
const sample=(poses,a,dt=30,zoom=1,low=false,host=false)=>poses.sample(a,zoom,10+dt*.06,1000+dt,false,low,host);
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);

test('G01/G03/G04: confirmed HP hurt and an executing attack retain separate bounded channels',()=>{
 const poses=new AttackPoses(),a=actor(),b=actor('b','emoji-042'),before=structuredClone([a,b]);
 poses.accept(shot(),[a,b],1000);const attack=poses.active.get('a');
 poses.accept(hit(),[a,b],1017);assert.equal(poses.active.get('a'),attack);assert.equal(poses.active.get('a').family,'heavy');assert.equal(poses.hurts.get('a').family,'hit');
 const composed=sample(poses,a,45);assert.ok(composed.hurt);assert.equal(composed.wall,false);assert.equal(composed.axisX,-1);assert.equal(composed.axisY,0);
 assert.notDeepEqual(poseEnvelope('heavy',.3),poseEnvelope('hit',.3));assert.ok(poseEnvelope('wall',.55).shift<0,'wall bounce goes away from contact');
 assert.deepEqual([a,b],before,'no coordinate/radius/HP/velocity mutation');
 assert.equal(sample(poses,a,350),null);assert.equal(poses.active.size,0);assert.equal(poses.hurts.size,0);
 const miss=new AttackPoses();miss.accept(shot(),[a,b],1000);assert.ok(sample(miss,a));assert.equal(miss.hurts.size,0);
 for(const e of [{...hit(),data:{...hit().data,geometry:{...hit().data.geometry,confirmed:false}}},{...shot(),type:'COMMAND_RESULT'}]){const p=new AttackPoses();p.accept(e,[a,b],1000);assert.equal(sample(p,a),null);}
});

test('G02: heavy +20% stroke stays within 205ms; fast cuts finish inside110ms, ranged/field identities remain distinct',()=>{
 const heavy=new AttackPoses(),a=actor();heavy.accept(shot(),[a],1000);
 const first=sample(heavy,a,0),out=sample(heavy,a,205*.18);assert.ok(out.x>9.59&&out.x<=9.6);assert.ok(out.squash<0);assert.ok(first===out,'one output object reused per actor');
 assert.equal(sample(heavy,a,206),null);
 for(const id of ['emoji-131','emoji-001']){const p=new AttackPoses(),a=actor('a',id),e=shot();e.data.actionKind='attack';p.accept(e,[a],1000);sample(p,a,0);assert.equal(sample(p,a,111),null);}
 const ids=['emoji-025','emoji-131','emoji-023','emoji-003','emoji-024','emoji-152','emoji-147'];
 assert.deepEqual(ids.map(id=>poseFamily(id,'skill')),['heavy','burst','recoil','burst','orbit','field','travel']);
});

test('G05/G06: pure shield/DOT never create HP hurt; real reflection is life scoped and bounded',()=>{
 const poses=new AttackPoses(),a=actor(),b=actor('b','emoji-042'),e=hit();
 poses.accept({...e,data:{...e.data,amount:0,geometry:{...e.data.geometry,absorbed:30}}},[a,b],1000);
 assert.equal(poses.hurts.size,0);assert.equal(sample(poses,a),null);
 for(let i=0;i<20;i++)poses.accept({...hit('a',10+i),data:{...hit('a',10+i).data,geometry:{...hit('a',10+i).data.geometry,periodic:true}}},[a,b],1000+i*500);
 assert.equal(poses.hurts.size,0);
 const reflection={type:'SHOT_TURN',serverTick:10,data:{id:'returned-shot',owner:'a',life:2,returned:true,dx:-1,dy:0}};
 poses.accept(reflection,[a,b],1000);const entry=poses.hurts.get('a');assert.equal(entry.family,'reflection');assert.equal(sample(poses,a,30).reflection,true);
 poses.accept(reflection,[a,b],1050);assert.equal(poses.hurts.get('a'),entry);assert.equal(entry.born,1000);
 assert.equal(poses.sample({...a,lifeSeq:3},1,12,1050,false,false),null);
 poses.accept({...reflection,data:{...reflection.data,id:'same-contact-other-ordinal'}},[a,b],1400);assert.equal(poses.hurts.size,0,'same authoritative tick cannot replay after expiry');
 const p=new AttackPoses();p.accept({...reflection,data:{...reflection.data,returned:false}},[a,b],1000);assert.equal(p.hurts.size,0);
});

test('G06: burst HP hits coalesce without restarting an envelope or erasing a heavy hit',()=>{
 const poses=new AttackPoses(),a=actor(),b=actor('b');poses.accept(hit('a',10,4),[a,b],1000);sample(poses,a,0);const initial=poses.hurts.get('a');
 for(let n=1;n<30;n++)poses.accept(hit('a',10+n,1),[a,b],1000+n*4);
 assert.equal(poses.hurts.get('a'),initial);assert.equal(initial.born,1000);assert.equal(initial.level,4);
 assert.equal(sample(poses,a,161),null,'hits did not extend the160ms body reaction');
 const p=new AttackPoses();p.accept(hit('a',10,1),[a,b],1000);sample(p,a,0);const weak=p.hurts.get('a');p.accept(hit('a',11,4),[a,b],1020);assert.equal(p.hurts.get('a'),weak);assert.equal(weak.born,1000);assert.equal(weak.level,4);
});

test('G07/G08: one real heavy-wall per cast; proximity/unconfirmed/ordinary impacts do not generate rebound',()=>{
 const poses=new AttackPoses(),a=actor(),b=actor('b'),before=structuredClone(a);
 for(const patch of [{geometry:{...wall().data.geometry,confirmed:false}},{style:'wall-near'},{geometry:{...wall().data.geometry,profile:'ordinary'}}])poses.accept({...wall(),data:{...wall().data,...patch}},[a,b],1000);
 assert.equal(poses.walls.size,0);poses.accept(wall(),[a,b],1000);sample(poses,a,34);const entry=poses.walls.get('a');
 poses.accept(wall('a',14),[a,b],1040);assert.equal(poses.walls.get('a'),entry);
 for(let dt=35;dt<175;dt+=5){const p=sample(poses,a,dt,.4);if(p){assert.ok(p.wall);assert.ok(Math.hypot(p.x,p.y)*.4<=4);}}
 assert.equal(sample(poses,a,220),null);poses.accept(wall('a',18),[a,b],1240);assert.equal(poses.walls.size,0,'duplicate cast does not restart after expiry');assert.deepEqual(a,before);
});

test('G08/G09: actual authority impulse only; low removes only the tiny offset, rotations and CSS bounds are stable',()=>{
 const poses=new AttackPoses(),a={...actor(),rw:{life:2,sourceTick:10,impulseEnd:26,impulseX:12,impulseY:0}},before=structuredClone(a);
 const high={...sample(poses,a,30)},low={...sample(poses,a,30,1,true)},overview={...sample(poses,a,30,1/4,false,true)};
 assert.ok(high.impulse&&low.impulse);assert.ok(Math.abs(high.rotation)<=.10);assert.ok(Math.hypot(high.x,high.y)<=2);assert.equal(low.x,0);assert.equal(low.y,0);assert.ok(low.squash>0);
 assert.ok(Math.hypot(overview.x,overview.y)/4<=2);assert.ok(Math.abs(overview.rotation)<Math.abs(high.rotation));assert.deepEqual(a,before);
 assert.equal(poses.sample(a,1,27,1300,false,false),null);assert.equal(sample(poses,{...a,rw:{...a.rw,impulseEnd:10}}),null);assert.equal(sample(poses,{...a,rw:{...a.rw,life:1}}),null);
});

test('G10/G12: changed life, absent/dead actor, reduced motion and room clear release all channels',()=>{
 const poses=new AttackPoses(),a=actor(),b=actor('b');for(const e of [shot(),hit(),wall()])poses.accept(e,[a,b],1000);
 assert.equal(poses.sample(a,1,12,1040,true,false),null);assert.equal(poses.sample({...a,lifeSeq:3},1,12,1040,false,false),null);
 assert.deepEqual([poses.active.size,poses.hurts.size,poses.walls.size],[0,0,0]);
 for(const e of [shot(),hit(),wall()])poses.accept(e,[a,b],1300);
 poses.snapshot({actors:[],shots:[],serverTick:40},37,1500);assert.equal(poses.active.size+poses.hurts.size+poses.walls.size+poses.contacts.size+poses.outputs.size,0);
 poses.clear();for(const map of [poses.active,poses.hurts,poses.walls,poses.contacts,poses.outputs,poses.fired,poses.hurtLedger,poses.wallLedger,poses.contactLedger])assert.equal(map.size,0);
});

test('G06/G10: malformed/duplicated events cannot grow presentation state beyond classroom caps',()=>{
 const poses=new AttackPoses();for(let i=0;i<400;i++){const a=actor('a'+i),actors=[a];poses.accept(shot(a.id),actors,1000);poses.accept(hit(a.id),actors,1000);poses.accept(wall(a.id),actors,1000);sample(poses,a);}
 for(const map of [poses.active,poses.hurts,poses.walls,poses.outputs,poses.hurtLedger,poses.wallLedger])assert.ok(map.size<=96);
 assert.ok(poses.fired.size<=192);
});

test('G11: actual Renderer.image Canvas and Pixi use the same oriented affine coefficients and neutralize cache skew',()=>{
 // Extract the production method to avoid initializing browser-only asset Image
 // globals; execute it against real Pixi Sprite transforms and a Canvas spy.
 const source=fs.readFileSync('apps/client/src/render/renderer.js','utf8'),ast=parse(source,{ecmaVersion:'latest',sourceType:'module'});
 const renderer=ast.body.find(n=>n.type==='ExportNamedDeclaration'&&n.declaration?.id?.name==='Renderer').declaration;
 const method=renderer.body.body.find(n=>n.key.name==='image'),ImageMethod=new Function('Sprite','return class {'+source.slice(method.start,method.end)+'}')(Sprite);
 const canvas=Object.assign(new ImageMethod(),{pixi:false,ctx:{save(){this.matrix=[1,0,0,1,0,0];this.transforms=0;},restore(){},translate(){},rotate(a){this.rotation=a;},transform(...a){this.matrix=a;this.transforms++;},drawImage(source,x,y,w,h){this.destination={x,y,w,h};}}});
 const pixi=Object.assign(new ImageMethod(),{pixi:true,texture:()=>Texture.EMPTY,sprites:new Map(),world:{addChild(){}}});
 for(const axis of [{axisX:1,axisY:0},{axisX:0,axisY:1},{axisX:Math.SQRT1_2,axisY:Math.SQRT1_2}]){
  canvas.image({},4,9,32,'actor',.08,1,.18,axis);pixi.image({},4,9,32,'actor',.08,1,.18,axis);
  const s=pixi.sprites.get('actor');s.updateLocalTransform();const m=s.localTransform,[ma,mb,mc,md]=canvas.ctx.matrix,{x,y,w,h}=canvas.ctx.destination,a=ma*w/64,b=mb*w/64,c=mc*h/64,d=md*h/64,co=Math.cos(.08),si=Math.sin(.08);
  close(m.a/64,co*a-si*b);close(m.b/64,si*a+co*b);close(m.c/64,co*c-si*d);close(m.d/64,si*c+co*d);close(m.tx,4);close(m.ty,9);
  close(x,-w/2);close(y,-h/2);assert.equal(canvas.ctx.transforms,axis.axisX&&axis.axisY?1:0,'only oblique axes submit a Canvas transform');
 }
 canvas.image({},4,9,32,'actor');assert.equal(canvas.ctx.transforms,0);assert.deepEqual(canvas.ctx.destination,{x:-32,y:-32,w:64,h:64});
 pixi.image({},4,9,32,'actor');const s=pixi.sprites.get('actor');assert.equal(pixi.sprites.size,1);assert.equal(s.skew.x,0);assert.equal(s.skew.y,0);assert.equal(s.width,64);assert.equal(s.height,64);
 s.destroy();
});
