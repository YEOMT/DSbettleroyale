import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createGameServer} from '../../apps/server/src/main.js';
import {connect} from './client.mjs';
test('authenticated drain timeout does not finish quiz or replace process; seal is atomic',async t=>{
 const app=await createGameServer({port:0,hostSecret:'test-host',adminSecret:'test-admin'});t.after(()=>app.close());const host=await(await connect(app)).host();await(await connect(app)).join(host.room.code,'A');await(await connect(app)).join(host.room.code,'B');await host.command('START_QUIZ');
 const base=`http://127.0.0.1:${app.address.port}`,headers={Authorization:'Bearer test-admin'};
 assert.equal((await fetch(base+'/admin/drain',{method:'POST'})).status,401);
 const child=spawn(process.execPath,['tools/deploy/drain.mjs'],{windowsHide:true,env:{...process.env,ADMIN_URL:base,ADMIN_SECRET:'test-admin',DRAIN_TIMEOUT_MS:'50'},stdio:'ignore'});const status=await new Promise(r=>child.once('exit',r));assert.equal(status,1);assert.equal(app.manager.draining,false);assert.equal(app.manager.rooms.get(host.room.code).phase,'QUIZ');
 await fetch(base+'/admin/drain',{method:'POST',headers});assert.equal((await fetch(base+'/admin/seal',{method:'POST',headers})).status,409);
 assert.equal((await host.command('BEGIN_DRAFT')).accepted,true);assert.equal((await host.command('START_BATTLE')).accepted,true);await host.command('END');assert.equal((await fetch(base+'/admin/seal',{method:'POST',headers})).status,200);
 assert.equal((await host.command('REMATCH')).accepted,true);assert.equal((await host.command('START_QUIZ')).reason,'SERVER_DRAINING');
 assert.equal((await host.command('CLOSE_ROOM')).accepted,true);await new Promise(r=>setTimeout(r,20));assert.equal(app.manager.rooms.size,0);assert.equal(app.manager.tokens.size,0);
});
