import {runLoad} from './run.mjs';
let passed=true;
for(const players of [20,26,30]){const r=await runLoad({players,seconds:600});passed&&=r.pass;if(!r.pass)break;}
process.exitCode=passed?0:1;
