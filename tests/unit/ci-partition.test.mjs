import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import YAML from 'yaml';
import {selectCases} from '../fidelity-v33-2/selection.mjs';

const workflow=YAML.parse(fs.readFileSync(new URL('../../.github/workflows/deep.yml',import.meta.url),'utf8'));
const renderers=['canvas','pixi'],qualities=['low','balanced','high'];
const commands=job=>job.steps.flatMap(step=>step.run?[step.run]:[]).join('\n');

test('CI roster partitions cover all six renderer/quality pairs exactly once',()=>{
 const pairs=workflow.jobs.roster.strategy.matrix.include.flatMap(part=>
  selectCases(renderers,part.renderer,'RENDERER').flatMap(renderer=>
   selectCases(qualities,part.quality,'QUALITY').map(quality=>renderer+'/'+quality)));
 assert.equal(pairs.length,6);
 assert.equal(new Set(pairs).size,6);
 assert.deepEqual(pairs.slice().sort(),renderers.flatMap(r=>qualities.map(q=>r+'/'+q)).sort());
 assert.match(commands(workflow.jobs.roster),/all77\.mjs \$\{\{ matrix\.renderer \}\} \$\{\{ matrix\.quality \}\}/);
 assert.equal(pairs.length*77,462);
});

test('CI camera, layout and remaining audits retain the full original case inventory',()=>{
 const camera=workflow.jobs['audit-camera'],layout=workflow.jobs['audit-layout'];
 assert.deepEqual(camera.strategy.matrix.renderer,renderers);
 assert.deepEqual(camera.strategy.matrix.viewport,[1920,1366,1024]);
 assert.equal(camera.strategy.matrix.renderer.length*camera.strategy.matrix.viewport.length*5*5*60,9000);
 assert.match(commands(camera),/camera\.mjs \$\{\{ matrix\.renderer \}\} \$\{\{ matrix\.viewport \}\}/);
 assert.deepEqual(layout.strategy.matrix.renderer,renderers);
 assert.deepEqual(layout.strategy.matrix.mode,['solo','team-elim','team-capture']);
 assert.equal(layout.strategy.matrix.renderer.length*layout.strategy.matrix.mode.length*5,30);
 assert.match(commands(layout),/layout\.mjs \$\{\{ matrix\.renderer \}\} \$\{\{ matrix\.mode \}\}/);
 assert.deepEqual(workflow.jobs.audit.strategy.matrix.suite,['lobby','host-effects','surface','screens','quiz']);
 assert.match(commands(workflow.jobs.audit),/run\.mjs \$\{\{ matrix\.suite \}\}/);
 assert.match(commands(workflow.jobs.verify),/npm run verify/);
 assert.match(commands(workflow.jobs.verify),/npm run test:e2e/);
 assert.match(commands(workflow.jobs.verify),/--players=26 --seconds=20/);
 assert.match(commands(workflow.jobs.fidelity),/npm run test:fidelity/);
 assert.ok(workflow.jobs.fidelity.steps.some(s=>s.run==='node tests/fidelity/visuals.mjs'&&s.env?.FIDELITY_RENDERER==='pixi'));
});

test('partition selectors preserve full local defaults and reject invalid partitions',()=>{
 for(const allowed of [renderers,qualities,['1920','1366','1024'],['solo','team-elim','team-capture']]){
  assert.deepEqual(selectCases(allowed,undefined,'CASE'),allowed);
  assert.deepEqual(selectCases(allowed,'all','CASE'),allowed);
  for(const value of allowed)assert.deepEqual(selectCases(allowed,value,'CASE'),[value]);
  assert.throws(()=>selectCases(allowed,'typo','CASE'),/INVALID_CASE/);
 }
});

test('feature branch commits use PR CI only and the gate requires every suite',()=>{
 assert.ok(Object.hasOwn(workflow.on,'workflow_dispatch'));
 assert.equal(workflow.on.push,undefined);
 assert.equal(workflow.jobs['required-checks'].if,'always()');
 assert.deepEqual(workflow.jobs['required-checks'].needs.slice().sort(),Object.keys(workflow.jobs).filter(k=>k!=='required-checks').sort());
 for(const job of Object.values(workflow.jobs).filter(j=>j.strategy))assert.equal(job.strategy['fail-fast'],false);
});
