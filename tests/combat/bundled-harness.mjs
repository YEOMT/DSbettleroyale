// Test-only observer for the normal minified Vite build. No observer is shipped
// by tools/build.mjs. The static bridge keeps existing browser assertions intact.
import fs from 'node:fs';
import path from 'node:path';
import {build,preview} from 'vite';
export async function bundledHarness(target) {
 const release=JSON.parse(fs.readFileSync('dist/release.json','utf8'));
 const outDir=path.resolve('artifacts/classroom-client');
 await build({configFile:'apps/client/vite.config.js',base:'/',
  // Production Pages connects directly to the configured authority endpoint.
  // Do not put the test runner's Vite WS proxy (also running all virtual
  // clients/Playwright RPC) between the real browser and server transport.
  define:{__DSBR_BUILD_ID__:JSON.stringify(release.buildId),'import.meta.env.VITE_PUBLIC_WSS_URL':JSON.stringify(target.replace('http:','ws:')+'/ws')},
  build:{outDir,emptyOutDir:true},plugins:[{
   name:'private-classroom-observer',transform(code,id){
    if(id.replaceAll('\\','/').endsWith('/apps/client/src/main.js'))
     return code+'\nwindow.auditApp={net,timeline,renderer,controls,ui,audio};\n';
   }
  }]});
 const server=await preview({configFile:'apps/client/vite.config.js',base:'/',build:{outDir},
  preview:{host:'127.0.0.1',port:0,strictPort:false,proxy:{
   '/version':target,'/healthz':target,
   '/src/main.js':{target,bypass(req,res){res.setHeader('Content-Type','text/javascript');res.end('export const {net,timeline,renderer,controls,ui,audio}=window.auditApp;');return false;}}
  }}});
 return {httpServer:server.httpServer,close:()=>server.close(),release};
}
