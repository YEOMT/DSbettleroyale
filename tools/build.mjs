import {build as buildClient} from 'vite';
import {build as bundle} from 'esbuild';
import fs from 'node:fs';
await buildClient({configFile:'apps/client/vite.config.js'});
await bundle({entryPoints:['apps/server/src/main.js'],outfile:'dist/server/main.js',bundle:true,platform:'node',target:'node24',format:'esm',packages:'external',sourcemap:true});
fs.writeFileSync('dist/server/package.json',JSON.stringify({type:'module'}));
console.log('Client and server built. Root legacy index.html was not changed.');
