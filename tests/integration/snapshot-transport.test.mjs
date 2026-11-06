import test from 'node:test';
import assert from 'node:assert/strict';
import {createGameServer} from '../../apps/server/src/main.js';
import {getTeacherState,getVisibleState} from '../../packages/engine/src/index.js';
import {snapshotEncoder} from '../../apps/server/src/ws/snapshot.js';
import {connect} from './client.mjs';
test('UTF-8 buffer sends remain exact JSON text with private scopes, with or without a compression offer',async t=>{
 const app=await createGameServer({port:0,hostSecret:'test-host'});t.after(()=>app.close());const host=await(await connect(app)).host();
 const compressed=await(await connect(app)).join(host.room.code,'합성🙂'),plain=await(await connect(app,{perMessageDeflate:false})).join(host.room.code,'Plain Synthetic');
 assert.equal(compressed.ws.extensions,'');assert.equal(plain.ws.extensions,'');
 await host.command('START_QUIZ');await host.command('BEGIN_DRAFT');await host.command('START_BATTLE');await compressed.next('SNAPSHOT');await plain.next('SNAPSHOT');const room=app.manager.rooms.get(host.room.code);room.safePaused=true;
 const teacher=getTeacherState(room.world),encode=snapshotEncoder(teacher,9000,123.456789);
 for(const client of [compressed,plain]){
  const member=room.members.get(client.session.playerId),view=getVisibleState(room.world,member.id,undefined,teacher);
  view.self.probe='한글🙂"\\'.repeat(2048);const raw=encode(view,member.peer.scope()),expected=JSON.parse(raw);let binary;
  client.ws.once('message',(_,isBinary)=>{binary=isBinary;});member.peer.snapshot(raw);const received=await client.next('SNAPSHOT',s=>s.snapshotSeq===9000);
  assert.deepEqual(received,expected);assert.equal(binary,false);assert.equal(received.payload.self.id,member.id);assert.equal(received.payload.actors.some(a=>'run'in a),false);
 }
 await compressed.close();await plain.close();await host.close();
});
