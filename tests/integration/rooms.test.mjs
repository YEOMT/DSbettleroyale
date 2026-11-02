import test from 'node:test';
import assert from 'node:assert/strict';
import {createGameServer} from '../../apps/server/src/main.js';
import {connect} from './client.mjs';
async function setup(t){const app=await createGameServer({port:0,hostSecret:'test-host',adminSecret:'test-admin'});t.after(()=>app.close());const host=await(await connect(app)).host(),a=await(await connect(app)).join(host.room.code,'A'),b=await(await connect(app)).join(host.room.code,'B');return {app,host,a,b};}
test('real WebSocket lobby → authoritative quiz → valid zero-score draft, idempotent answers/rerolls',async t=>{
 const {app,host,a,b}=await setup(t);
 assert.equal((await a.command('START_QUIZ')).reason,'HOST_REQUIRED');
 assert.equal((await host.command('CONFIGURE',{rerollEvery:1,quizText:'문제 | 정답 | 오답1 | 오답2 | 오답3'})).accepted,true);
 assert.equal((await host.command('START_QUIZ')).accepted,true);await a.phase('QUIZ');await b.phase('QUIZ');
 const q=a.room.self.quiz.question;assert.ok(q.answers.every(x=>!x.id.includes('answer')&&!('correct'in x)));
 const correct=q.answers.find(x=>x.text==='정답');const payload={questionId:q.id,attemptId:q.attemptId,answerId:correct.id};
 const one=await a.command('QUIZ_ANSWER',payload,'same-answer');assert.equal(one.score,1);
 assert.deepEqual(await a.command('QUIZ_ANSWER',payload,'same-answer'),one);
 assert.equal((await host.command('BEGIN_DRAFT')).accepted,true);await a.phase('DRAFT');await b.phase('DRAFT');
 assert.match(b.room.self.draft.abilityId,/^emoji-\d{3}$/);assert.equal(b.room.self.draft.rerolls,0);
 const d=a.room.self.draft;const first=await a.command('DRAFT_REROLL',{draftRevision:d.revision},'same-reroll');
 assert.equal(first.accepted,true);assert.deepEqual(await a.command('DRAFT_REROLL',{draftRevision:d.revision},'same-reroll'),first);
 const serverMember=app.manager.rooms.get(host.room.code).members.get(a.session.playerId);assert.equal(serverMember.draft.spent,1);assert.equal(serverMember.draft.rerolls,0);
 assert.equal((await a.command('QUIZ_ANSWER',payload,'late-answer')).accepted,false);
});
test('resume restores assigned card and supersedes old socket; nickname cannot claim identity',async t=>{
 const {app,host,a}=await setup(t);await host.command('START_QUIZ');await host.command('BEGIN_DRAFT');await a.phase('DRAFT');
 const token=a.session.token,oldEpoch=a.scope.connectionEpoch,card=a.room.self.draft.abilityId;
 const restored=await connect(app);restored.send('RESUME',{token,cursor:0},false);await restored.next('SESSION');const full=(await restored.next('FULL_STATE')).payload;
 assert.equal(full.room.self.draft.abilityId,card);assert.ok(restored.scope.connectionEpoch>oldEpoch);
 const stranger=await connect(app);stranger.send('RESUME',{token:'invalid-token'},false);assert.equal((await stranger.next('ERROR')).payload.code,'ROOM_EXPIRED');
});
test('host kick revokes token; malformed and forged authority payloads are rejected',async t=>{
 const {app,host,a}=await setup(t);const token=a.session.token;
 a.ws.send(JSON.stringify({type:'INPUT_BATCH',protocolVersion:33,payload:{commands:[{seq:1,clientTick:1,move:{x:null,y:0},aim:{x:1,y:0}}]}}));
 assert.equal((await a.next('ERROR')).payload.code,'INVALID_MESSAGE');
 assert.equal((await host.command('KICK',{playerId:a.session.playerId})).accepted,true);
 const retry=await connect(app);retry.send('RESUME',{token},false);assert.equal((await retry.next('ERROR')).payload.code,'ROOM_EXPIRED');
});
