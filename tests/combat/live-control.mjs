// Exercise the normal server loop and renderer, including keyboard edges during a button tap.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {auditHarness,delay} from '../fidelity-v33-2/harness.mjs';
const baseline=process.argv.includes('--baseline'),renderer=process.argv[2]||'canvas';
const h=await auditHarness({players:2,mode:'team-elim',quality:'balanced',renderer,viewport:renderer==='pixi'?{width:800,height:520}:{width:1366,height:768}});
const report={renderer,baseline},time=performance.now();
const percentile=(rows,p)=>rows.slice().sort((a,b)=>a-b)[Math.ceil(p*rows.length)-1]??0;
try{
 // A deterministic fixture is a new match, so advance its round as the real
 // REMATCH transition does. Clients must still reject old/same-round IDs.
 h.room.matchId='feel-control-fixture';h.room.round++;h.room.revision++;h.app.manager.changed(h.room);
 for(const page of [h.host,h.student])await page.waitForFunction(()=>auditApp.ui.room.matchId==='feel-control-fixture');
 await h.command('START_QUIZ');await h.command('BEGIN_DRAFT');
 const [first,second]=h.room.students();first.draft.abilityId='emoji-023';second.draft.abilityId='emoji-025';
 await h.command('START_BATTLE');
 const w=h.room.world,p=w.byId.get(first.id),b=w.byId.get(second.id);
 w.brFarm.dispose(w.game);w.game.walls=[];w.game.smokes=[];p.pos=new w.Vec2(120,80);b.pos=new w.Vec2(390,100);
 h.staticState();const page=h.student;
 for(const screen of [page,h.host]){
  await screen.evaluate(async()=>{window.mod=await import('/src/main.js');});
  await screen.waitForFunction(()=>mod.renderer.cameraPose&&mod.timeline.lastSeq);
 }
 await page.evaluate(()=>{
  const {renderer:r,timeline:t,controls:c,net}=mod;window.measure={edges:[],casts:[],draws:[],frameGaps:[],samples:[],poses:[]};
  let edge=null,last=0;
  for(const type of ['keydown','keyup'])addEventListener(type,e=>{if(e.key==='a'||e.key==='d'){edge={key:e.key,type,at:performance.now(),seq:c.seq};measure.edges.push(edge);}},true);
  const send=c.sendSample.bind(c);c.sendSample=(v,f)=>{send(v,f);if(edge&&edge.predictMs==null){edge.predictMs=performance.now()-edge.at;edge.x=v.x;edge.sentSeq=c.seq;}};
  const command=net.command.bind(net);net.command=(type,data)=>{if(type==='ACTION')measure.casts.push({seq:data.seq,kind:data.kind,raw:data.rawAim,power:data.aimPower});return command(type,data);};
  const draw=r.draw.bind(r);r.draw=(v,now)=>{const s=performance.now();draw(v,now);measure.draws.push(performance.now()-s);if(last)measure.frameGaps.push(now-last);last=now;
   if(edge&&edge.predictMs!=null&&edge.displayMs==null)edge.displayMs=performance.now()-edge.at;
   const self=v.actors.find(a=>a.id===v.self.id);
   measure.samples.push({tick:v.renderTick,x:self.x,logical:t.predicted.x,look:r.cameraPose.x-self.x,err:v.self.x-t.predicted.x});
  };
 });
 // Real mouse motion targeted at the current game canvas, not a constructed browser event.
 await delay(350); // Let join/layout and first-paint work finish before measuring input edges.
 const sampleStart=performance.now(),bytesAtStart=h.app.metrics.sentBytes,applied=[],onApply=w.onInputApplied;
 w.onInputApplied=input=>{onApply?.(input);if(input.playerId===p.remoteId)applied.push({seq:input.seq,x:input.move.x,tick:p.inputAppliedAt});};
 const hit=await page.evaluate(()=>{const c=mod.renderer.canvas,b=c.getBoundingClientRect();for(const fx of [.56,.46,.63])for(const fy of [.46,.56,.36]){
  const x=b.left+fx*b.width,y=b.top+fy*b.height;if(document.elementFromPoint(x,y)===c)return {x,y};
 }throw Error('No visible aiming surface');});await page.mouse.move(hit.x,hit.y);
 const button=await page.locator('#br-attack').boundingBox();
 const edgeShown=()=>page.waitForFunction(()=>Number.isFinite(measure.edges.at(-1)?.displayMs),null,{timeout:8000});
 await page.keyboard.down('d');await edgeShown();await delay(300);
 await page.mouse.move(button.x+button.width/2,button.y+button.height/2);await page.mouse.down();
 await page.keyboard.up('d');await edgeShown();await delay(45);await page.keyboard.down('a');await page.mouse.up();await edgeShown();
 await delay(450);await page.keyboard.up('a');await edgeShown();
 // Delay the student's actual outbound snapshots in order. All commands still reach
 // the unpaused server over its normal connection, with no prediction shortcuts.
 const peer=first.peer,snapshot=peer.snapshot.bind(peer),delays=[15,40,5,35],timers=new Set();let idx=0,due=0;
 peer.snapshot=data=>{const now=performance.now();due=Math.max(now+delays[idx++%delays.length],due+1);
  const timer=setTimeout(()=>{timers.delete(timer);snapshot(data);},due-now);timers.add(timer);
 };await delay(360);await page.keyboard.press('q');
 await delay(650);
 // Confirm drift and pose once actual server velocity has settled.
 const stationary=p.pos.x;await delay(250);report.stationarySpan=Math.abs(p.pos.x-stationary);
 const m=await page.evaluate(()=>({...measure,holds:mod.timeline.metrics.holds,gaps:mod.timeline.metrics.arrivalGaps,corrections:mod.timeline.metrics.corrections,objects:[mod.renderer.textures.size,mod.renderer.sprites.size]}));
 peer.snapshot=snapshot;for(const t of timers)clearTimeout(t);report.jitterSamples=idx;
 report.errors=h.errors.slice();report.edges=m.edges.map(e=>({...e,applied:applied.find(i=>i.seq>=e.sentSeq&&i.x===e.x)}));report.casts=m.casts;report.applied=p.lastAppliedSeq;
 report.fired={attack:p.firedAttackSeq,skill:p.firedSkillSeq};report.raf=[.5,.95,.99].map(q=>percentile(m.frameGaps,q));
 report.longFrameRate=[33.3,50].map(t=>m.frameGaps.filter(g=>g>t).length/Math.max(1,m.frameGaps.length));
 report.drawP95=percentile(m.draws,.95);report.receiveP95=percentile(m.gaps,.95);report.holds=m.holds;report.objects=m.objects;
 report.correctionP95=percentile(m.corrections,.95);report.correctionCount=m.corrections.filter(v=>v>.01).length;report.predictionGapP95=percentile(m.samples.map(s=>Math.abs(s.err)),.95);
 report.peakLead=Math.max(...m.samples.map(s=>Math.abs(s.look)));report.endLead=m.samples.at(-1).look;
 const metrics=h.app.metrics.report(h.app.manager);report.stepP95=metrics.stepCpu.p95;report.snapshotP95=metrics.snapshotGap.p95;report.overloads=metrics.overloads;report.bytes=metrics.sentBytes;report.bytesPerSecond=Math.round((metrics.sentBytes-bytesAtStart)/((performance.now()-sampleStart)/1000));report.elapsedMs=Math.round(performance.now()-time);
 if(!baseline){assert.deepEqual(h.errors,[]);assert.ok(report.fired.attack&&report.fired.skill);assert.ok(m.casts.find(c=>c.kind==='attack').raw.x<-.99);assert.ok(report.stationarySpan<.01);assert.ok(m.edges.every(e=>Number.isFinite(e.displayMs)&&e.sentSeq>e.seq));assert.ok(report.edges.every(e=>e.applied),'server applied each movement edge');}
}finally{
 fs.mkdirSync('artifacts/combat',{recursive:true});fs.writeFileSync('artifacts/combat/control-'+renderer+(baseline?'-base':'')+'.json',JSON.stringify(report,null,2));
 console.log(JSON.stringify(report));await h.close();
}
