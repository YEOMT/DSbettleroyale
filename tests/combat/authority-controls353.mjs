// Deterministic authority comparison. Only the explicitly added display metadata
// is excluded from equality; intents, every event and state still compare exactly.
import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';import {createHash} from 'node:crypto';import assert from 'node:assert/strict';
import * as candidate from '../../packages/engine/src/index.js';import {manifest} from '../../packages/content/src/manifest.js';
const baseline=await import(pathToFileURL(path.resolve(process.argv[2],'packages/engine/src/index.js'))),started=performance.now();
const strip=(k,v)=>k==='recastTarget'?undefined:v;
const digest=v=>createHash('sha256').update(JSON.stringify(v,strip)).digest('hex');
function scenario(engine,id){
 const events=[],results=[],states=[],w=engine.createWorld(undefined,{},'combat353-fixed',[{id:'a',abilityId:id},{id:'b',abilityId:'emoji-114'},{id:'c',abilityId:'emoji-114'}],e=>events.push(e));
 try{w.brFarm.dispose(w.game);w.game.walls=[];w.game.smokes=[];w.byId.get('a').pos=new w.Vec2(0,0);w.byId.get('b').pos=new w.Vec2(140,20);w.byId.get('c').pos=new w.Vec2(-500,600);w.game.rebuildSpatialGrid();
  for(let tick=1;tick<=120;tick++){
   const p=w.byId.get('a');results.push(engine.applyCommand(w,{type:'INPUT',playerId:'a',lifeSeq:p.lifeSeq,seq:tick,clientTick:tick,move:{x:tick<12?.2:0,y:0},aim:{x:1,y:0}}));
   if([1,40,80].includes(tick))for(const kind of ['attack','skill'])results.push(engine.applyCommand(w,{type:'ACTION',playerId:'a',lifeSeq:p.lifeSeq,seq:tick,kind,aim:{x:1,y:0},aimPower:1,castId:p.rw?.recast?.ctx.castId||''}));
   engine.stepWorld(w);if(tick%3===0)states.push(engine.getTeacherState(w),engine.getPrivateSelfState(w,'a'));
  }
  const rawBytes=Buffer.byteLength(JSON.stringify({states,events}));
  const normalized=events.map(e=>{if(e.type==='FX'&&e.data?.geometry?.confirmed&&e.data.style?.startsWith('rw:')){const {kind,seq,...geometry}=e.data.geometry;return {...e,data:{...e.data,geometry}};}return e;});
  return {hash:digest({results,states,events:normalized}),rawBytes,events:events.length,shots:events.filter(e=>e.type==='SHOT_SPAWN').length};
 }finally{engine.destroyWorld(w);}
}
const rows=[];for(const a of manifest.roster){const before=scenario(baseline,a.id),after=scenario(candidate,a.id);assert.equal(after.hash,before.hash,a.id+' authority divergence');rows.push({id:a.id,...after,metadataBytes:after.rawBytes-before.rawBytes});}
fs.mkdirSync('artifacts/v35-3',{recursive:true});const report={status:'PASS',ms:performance.now()-started,roster:rows.length,seed:'combat353-fixed',ticksPerKit:120,exceptions:['self.recastTarget (owner-only return geometry)','confirmed rw FX geometry.kind/seq (existing action identity)'],rows};fs.writeFileSync('artifacts/v35-3/authority.json',JSON.stringify(report,null,2));console.log(JSON.stringify({status:report.status,ms:report.ms,roster:rows.length,metadataBytes:rows.reduce((n,r)=>n+r.metadataBytes,0)}));
