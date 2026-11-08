import fs from 'node:fs';
import path from 'node:path';import {createRequire} from 'node:module';
const WebSocket=createRequire(path.resolve(process.env.DEPLOY_RUNTIME||'package.json'))('ws');
const expected=JSON.parse(fs.readFileSync(process.env.RELEASE_FILE||'dist/release.json','utf8'));
const base=process.env.PUBLIC_HTTP_API_URL,wsUrl=process.env.PUBLIC_WSS_URL,origin=process.env.CLIENT_ORIGIN;
if(!base||!wsUrl||!origin)throw Error('PUBLIC_HTTP_API_URL, PUBLIC_WSS_URL and CLIENT_ORIGIN required');
for(const endpoint of ['/healthz','/version']){const r=await fetch(base+endpoint,{signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error('HTTP_'+r.status);const value=await r.json();if(endpoint==='/version')for(const k of ['buildId','contentHash','engineRevision','protocolVersion'])if(value[k]!==expected[k])throw Error('VERSION_MISMATCH '+k);}
await new Promise((resolve,reject)=>{const ws=new WebSocket(wsUrl,{origin}),timer=setTimeout(()=>{ws.terminate();reject(Error('WSS_TIMEOUT'));},10000);ws.on('error',reject);ws.on('open',()=>ws.send(JSON.stringify({type:'HELLO',protocolVersion:expected.protocolVersion,payload:{protocolVersion:expected.protocolVersion,contentHash:expected.contentHash,engineRevision:expected.engineRevision,buildId:expected.buildId}})));ws.on('message',raw=>{const m=JSON.parse(raw);clearTimeout(timer);ws.close();if(m.type!=='WELCOME')reject(Error('WSS_HANDSHAKE_'+m.type));else resolve();});});
console.log('HTTP health, exact paired version and real WS/WSS HELLO verified:',expected.buildId);
