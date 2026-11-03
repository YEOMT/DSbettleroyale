// Test harness only. Fixture controls use private IPC, never a production HTTP/WS route.
import {createGameServer} from '../../apps/server/src/main.js';
import {manifest} from '../../packages/content/src/manifest.js';
import {sourceHash} from '../build-id.mjs';
const source=sourceHash();
const app=await createGameServer({port:0,hostSecret:'test-host'});
process.send({ready:true,port:app.address.port});
process.on('message',async m=>{try{let value;const room=[...app.manager.rooms.values()][0];
 if(m.type==='fixture-origin'){app.config.origins.push(m.origin);value=true;}
 if(m.type==='fixture-draft'){room.students().forEach((p,i)=>p.draft.abilityId=manifest.roster[(i+m.round*m.players)%77].id);value=true;}
 if(m.type==='fixture-growth'){for(const p of room.world.game.participants)room.world.brProgression.awardXP(p,20,0);value=true;}
 if(m.type==='status')value={...app.metrics.report(app.manager),sourceHash:source,phase:room?.phase,connected:room?.students().filter(p=>p.connected).length,fault:room?.lastFault,paused:!!room?.safePaused,eventLedgerBytes:[...room.members.values()].reduce((n,p)=>n+p.eventBytes,0)};
 if(m.type==='close'){await app.close();value={rooms:app.manager.rooms.size,tokens:app.manager.tokens.size,peers:app.peers.size};process.send({id:m.id,value});process.disconnect();return;}
 process.send({id:m.id,value});
 }catch(e){process.send({id:m.id,error:e.message});}});
process.on('disconnect',()=>app.close().catch(()=>{}));
