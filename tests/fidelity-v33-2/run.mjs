import {spawnSync} from 'node:child_process';
import {mkdirSync} from 'node:fs';
mkdirSync('artifacts/fidelity-v33-2',{recursive:true});
const names=process.argv.slice(2);for(const name of names.length?names:['lobby','host-effects','camera','layout','surface','screens','quiz','all77']){if(!['lobby','host-effects','camera','layout','surface','screens','quiz','all77','audio'].includes(name))throw Error('UNKNOWN_AUDIT');console.log('AUDIT '+name);const r=spawnSync(process.execPath,['tests/fidelity-v33-2/'+name+'.mjs'],{stdio:'inherit',windowsHide:true});if(r.status!==0)process.exit(r.status||1);}
