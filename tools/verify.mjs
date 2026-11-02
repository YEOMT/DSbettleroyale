import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
function run(args){const result=spawnSync(process.execPath,args,{stdio:'inherit',windowsHide:true});if(result.error)throw result.error;if(result.status!==0)process.exit(result.status||1);}
run(['tools/check-boundaries.mjs']);
const tests=['unit','parity','integration'].flatMap(dir=>fs.readdirSync('tests/'+dir).filter(f=>f.endsWith('.test.mjs')).map(f=>'tests/'+dir+'/'+f));
run(['--test','--test-concurrency=1',...tests]);run(['tools/build.mjs']);
console.log('VERIFY PASSED: boundaries, unit/parity, actual loopback WS integration, client/server build. Browser, load and public deployment are separate checks.');
