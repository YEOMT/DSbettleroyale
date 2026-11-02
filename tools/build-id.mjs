import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
export function sourceHash(){const hash=createHash('sha256');function walk(dir){for(const name of fs.readdirSync(dir).sort()){const file=path.join(dir,name);if(fs.statSync(file).isDirectory())walk(file);else{hash.update(file.replaceAll('\\','/'));hash.update(fs.readFileSync(file,'utf8').replaceAll('\r\n','\n'));}}}walk('apps');walk('packages');return hash.digest('hex');}
export function buildId(){const id=process.env.BUILD_ID||'v33-'+sourceHash().slice(0,16);if(!/^[a-zA-Z0-9_.-]{1,100}$/.test(id))throw Error('INVALID_BUILD_ID');return id;}
