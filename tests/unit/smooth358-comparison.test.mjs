import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parse} from 'yaml';

test('v35.8 compares both full populations for five matches with the observed production SHA',()=>{
 const workflow=parse(fs.readFileSync('.github/workflows/smooth358.yml','utf8'));
 const job=workflow.jobs.paired;
 assert.deepEqual(job.strategy.matrix.include.map(x=>x.players),[20,30]);
 assert.equal(job.steps.find(x=>x.env?.SMOOTH358).env.POLISH_ROUNDS,'5');
 assert.equal(job.steps.find(x=>x.env?.SMOOTH358).env.OVERDRIVE357,'1');
 const pair=fs.readFileSync('tools/ci/recovery356-pair.mjs','utf8');
 assert.ok(pair.includes("smooth358?'5585c8ca5f262d51e3732fb2115bab6e660fefd5'"));
 for(const key of ['hostGapP99','studentGapP99','secondStudentGapP99'])assert.ok(pair.includes(key));
 assert.equal(workflow.permissions.contents,'read');
});
