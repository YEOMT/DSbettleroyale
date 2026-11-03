import fs from 'node:fs';
import assert from 'node:assert/strict';
import {openFidelity,delay} from './harness.mjs';
const h=await openFidelity(),checks=[];fs.mkdirSync('artifacts/fidelity',{recursive:true});
try{
 const w=h.room.world,p=h.players[0];h.room.safePaused=true;
 w.game.frame=600;w.timeMs=10000;for(const q of h.players){q.stunned=0;q.pos=new w.Vec2(q===p?0:200,0);q.vel=new w.Vec2(0,0);}w.game.smokes=[];w.game.walls=[];w.game.rebuildSpatialGrid();h.staticState();
 p.run.offer={id:'fidelity-contract',level:2,cards:['quick','control','wanggui'].map(id=>w.brRunCard(p,id,1))};p.run.pending=1;h.publish();
 await h.pages[0].waitForFunction(()=>fidelity.app.timeline.predicted?.run?.offer?.id==='fidelity-contract');
 const actual=await h.pages[0].evaluate(()=>({cards:[...document.querySelectorAll('#br-run-cards button')].map(b=>b.textContent),stars:fidelity.status.reduce((n,s)=>n+s.stars,0)}));
 for(const card of p.run.offer.cards){const text=actual.cards.find(s=>s.includes(card.name))||'';checks.push({name:'server card '+card.id+' effect/detail reaches real UI',pass:card.effect.split(/\n|\s*·\s*/).every(line=>text.includes(line))&&text.includes(card.detail),expected:{effect:card.effect,detail:card.detail},actual:text});}
 checks.push({name:'inactive stun emits no stars in actual student renderer',pass:actual.stars===0,actualStars:actual.stars});
 await h.pages[0].screenshot({path:'artifacts/fidelity/contract-student.png'});
 fs.writeFileSync('artifacts/fidelity/contract-results.json',JSON.stringify({checks,browserErrors:h.errors},null,2));console.log(JSON.stringify(checks,null,2));assert.equal(checks.filter(c=>!c.pass).length,0,'Fidelity contracts failed');assert.deepEqual(h.errors,[]);
}finally{await h.close();}
