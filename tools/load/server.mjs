// Test harness only. Fixture controls use private IPC, never a production HTTP/WS route.
// Optional exact deploy bundle; fixtures/telemetry remain private IPC wrappers.
const {createGameServer}=await import(process.env.LOAD_BUILT==='1'?'../../dist/server/main.js':'../../apps/server/src/main.js');
import {manifest} from '../../packages/content/src/manifest.js';
import {sourceHash} from '../build-id.mjs';
import {loadTelemetry} from './telemetry.mjs';
const source=sourceHash();
const app=await createGameServer({port:0,hostSecret:'test-host'});
const telemetry=loadTelemetry(app,{onOverload:value=>process.send?.({type:'fixture-overload',value})});
process.send({ready:true,port:app.address.port});
process.on('message',async m=>{try{let value;const room=[...app.manager.rooms.values()][0];
 if(m.type==='fixture-origin'){app.config.origins.push(m.origin);value=true;}
 if(m.type==='fixture-draft'){const ids=m.roster==='new'?[...manifest.roster.filter(a=>Number(a.id.slice(6))>=141),...manifest.roster.filter(a=>Number(a.id.slice(6))<141).slice(0,10)]:manifest.roster;room.students().forEach((p,i)=>p.draft.abilityId=ids[(i+(m.roster==='new'?0:m.round*m.players))%ids.length].id);value=true;}
 if(m.type==='fixture-stability-draft'){
  const ids=m.roster==='new'?['emoji-141','emoji-143','emoji-144','emoji-142','emoji-024','emoji-003']:['emoji-024','emoji-003','emoji-023','emoji-029','emoji-013','emoji-025'];
  room.students().forEach((p,i)=>p.draft.abilityId=ids[i%ids.length]);value=true;
 }
 if(m.type==='fixture-seed'){room.matchId='stability-fixture-'+m.round;app.manager.changed(room);value=true;}
 if(m.type==='fixture-stability'){
  // Keep real attack/cooldown/movement/ring rules running for ten minutes.
  // Only this private IPC fixture extends health and selects the survivor count.
  const g=room.world.game;g._loadAlive=m.alive;
  g.participants.forEach((p,i)=>{p.alive=i<m.alive;p.hp=p.alive?100000:0;if(p.alive)p.maxHp=100000;
   if(m.place){const angle=i*Math.PI*2/(m.dense?Math.min(6,g.participants.length):g.participants.length),radius=m.dense?180:Math.max(180,g.participants.length*20);p.pos.x=Math.cos(angle)*radius;p.pos.y=Math.sin(angle)*radius;}});
  if(!g._loadUpdate){g._loadUpdate=g.update.bind(g);g.update=()=>{g.participants.forEach((p,i)=>{if(i<g._loadAlive&&p.alive)p.hp=p.maxHp;});return g._loadUpdate();};}
  value=true;
 }
 if(m.type==='fixture-growth'){for(const p of room.world.game.participants)room.world.brProgression.awardXP(p,20,0);value=true;}
 if(m.type==='status')value={...app.metrics.report(app.manager),sourceHash:source,phase:room?.phase,connected:room?.students().filter(p=>p.connected).length,fault:room?.lastFault,paused:!!room?.safePaused,eventLedgerBytes:[...(room?.members.values()||[])].reduce((n,p)=>n+p.eventBytes,0),window:telemetry.sample()};
 if(m.type==='close'){telemetry.close();await app.close();value={rooms:app.manager.rooms.size,tokens:app.manager.tokens.size,peers:app.peers.size};process.send({id:m.id,value});process.disconnect();return;}
 process.send({id:m.id,value});
 }catch(e){process.send({id:m.id,error:e.message});}});
process.on('disconnect',()=>app.close().catch(()=>{}));
