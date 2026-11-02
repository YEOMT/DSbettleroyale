import {runLoad} from './run.mjs';
for(const players of [26,30]){const result=await runLoad({players,seconds:600,recoverOverload:true});if(!result.pass)process.exitCode=1;}
