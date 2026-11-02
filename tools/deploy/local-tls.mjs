import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
const caddy=process.env.CADDY_BIN||'.local-tools/caddy/caddy.exe',root=path.resolve('.local-tools/caddy/tls-test');fs.mkdirSync(root,{recursive:true});
const config=path.join(root,'Caddyfile');fs.writeFileSync(config,'{\n admin off\n skip_install_trust\n auto_https disable_redirects\n}\nhttps://localhost:8443 {\n tls internal\n reverse_proxy 127.0.0.1:18080\n}\n');
const env={...process.env,NODE_ENV:'production',HOST:'127.0.0.1',PORT:'18080',ALLOWED_ORIGINS:'https://localhost:8443',HOST_AUTH_SECRET:'local-tls-fixture-teacher-32-characters',ADMIN_SECRET:'local-tls-fixture-admin-32-characters'};
const server=spawn(process.execPath,['dist/server/main.js'],{env,stdio:'ignore',windowsHide:true}),proxy=spawn(path.resolve(caddy),['run','--config',config,'--adapter','caddyfile'],{env:{...process.env,XDG_DATA_HOME:root,XDG_CONFIG_HOME:root},stdio:'ignore',windowsHide:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),ca=path.join(root,'caddy/pki/authorities/local/root.crt');
try{
 for(let i=0;i<60&&!fs.existsSync(ca);i++)await sleep(250);if(!fs.existsSync(ca))throw Error('Caddy local CA was not generated');await sleep(1000);
 const smoke=spawn(process.execPath,['tools/deploy/smoke.mjs'],{stdio:'inherit',windowsHide:true,env:{...process.env,NODE_EXTRA_CA_CERTS:ca,PUBLIC_HTTP_API_URL:'https://localhost:8443',PUBLIC_WSS_URL:'wss://localhost:8443/ws',CLIENT_ORIGIN:'https://localhost:8443'}});
 const code=await new Promise((resolve,reject)=>{smoke.once('exit',resolve);smoke.once('error',reject);});if(code!==0)throw Error('LOCAL_TLS_SMOKE_FAILED');
 console.log('LOCAL_CADDY_TLS_PASS: trusted test CA only in the smoke child process; no OS trust-store installation; not a public deployment.');
}finally{server.kill();proxy.kill();}
