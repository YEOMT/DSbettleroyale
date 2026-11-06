import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {WebSocketServer} from 'ws';
import {monitorEventLoopDelay} from 'node:perf_hooks';
import {readConfig} from './config.js';
import {RoomManager} from './rooms/room.js';
import {attachConnection,secretMatches} from './ws/handler.js';
import {Metrics} from './diagnostics/metrics.js';
import {fingerprint} from '../../../packages/protocol/src/index.js';
import {attachSimulation} from './simulation/runner.js';
export async function createGameServer(overrides={}){
 const config={...readConfig(),...overrides},manager=new RoomManager(config),metrics=new Metrics(),peers=new Set();
 const eventLoop=monitorEventLoopDelay({resolution:20});eventLoop.enable();
 manager.changed=room=>{for(const member of room.members.values())if(member.connected)member.peer?.send('ROOM_STATE',room.publicState(member));};
 const stopSimulation=attachSimulation(manager,metrics);
 const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://localhost');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
  const origin=req.headers.origin;if(origin&&config.origins.includes(origin)){res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');}
  const json=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
  if(url.pathname==='/healthz')return json(200,{ok:true});
  if(url.pathname==='/version')return json(200,fingerprint);
  if(url.pathname.startsWith('/admin/')){
   if(!secretMatches(req.headers.authorization?.replace(/^Bearer /,''),config.adminSecret))return json(401,{error:'UNAUTHORIZED'});
   if(url.pathname==='/admin/drain'&&req.method==='POST'){manager.draining=true;return json(200,{draining:true,protectedRooms:manager.protectedRooms()});}
   if(url.pathname==='/admin/undrain'&&req.method==='POST'){manager.draining=false;return json(200,{draining:false});}
   if(url.pathname==='/admin/seal'&&req.method==='POST'){
    if(!manager.draining||manager.protectedRooms()!==0)return json(409,{error:'PROTECTED_ROOMS_REMAIN'});
    for(const p of peers)p.send('MAINTENANCE',{message:'서버 업데이트가 진행됩니다. 대기실은 업데이트 후 새로 만들어 주세요.'});
    return json(200,{sealed:true,protectedRooms:0});
   }
   if(url.pathname==='/admin/status')return json(200,{...metrics.report(manager),draining:manager.draining,protectedRooms:manager.protectedRooms(),eventLoopDelayP95Ms:eventLoop.percentile(95)/1e6});
   return json(404,{error:'NOT_FOUND'});
  }
  if(req.method!=='GET'&&req.method!=='HEAD')return json(405,{error:'METHOD_NOT_ALLOWED'});
  let pathname;try{pathname=decodeURIComponent(url.pathname);}catch{return json(400,{error:'BAD_PATH'});}
  const root=path.resolve(config.clientDir),file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(root+path.sep))return json(403,{error:'FORBIDDEN'});
  try{const stat=await fs.promises.stat(file);if(!stat.isFile())return json(404,{error:'NOT_FOUND'});
   const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.mp3':'audio/mpeg'};
   res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':path.extname(file)==='.html'?'no-cache':'public, max-age=31536000, immutable'});if(req.method==='HEAD')res.end();else fs.createReadStream(file).pipe(res);
  }catch{return json(404,{error:'NOT_FOUND'});}
 });
 const wss=new WebSocketServer({noServer:true,maxPayload:config.maxPayload,perMessageDeflate:false});
 server.on('upgrade',(req,socket,head)=>{
  if(req.url!=='/ws'||!config.origins.includes(req.headers.origin)||peers.size>=512){socket.write('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');socket.destroy();return;}
  wss.handleUpgrade(req,socket,head,ws=>wss.emit('connection',ws,req));
 });
 wss.on('connection',(socket,request)=>{const peer=attachConnection(socket,manager,config,metrics,request.socket);peers.add(peer);socket.on('close',()=>peers.delete(peer));});
 const maintenance=setInterval(()=>{manager.sweep();for(const peer of peers)peer.flush();},100);maintenance.unref();
 const heartbeat=setInterval(()=>{for(const peer of peers){if(!peer.alive){peer.socket.terminate();continue;}peer.alive=false;peer.socket.ping();peer.trimEvents();}},15000);heartbeat.unref();
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(config.port,config.host,resolve);});
 return {server,wss,manager,metrics,config,peers,address:server.address(),async close(){stopSimulation();clearInterval(maintenance);clearInterval(heartbeat);eventLoop.disable();manager.close();for(const p of peers)p.socket.terminate();await new Promise(r=>wss.close(r));await new Promise(r=>server.close(r));}};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const app=await createGameServer();console.log(`DSBR ${fingerprint.buildId} listening on http://${app.config.host}:${app.address.port}`);
 const stop=async()=>{await app.close();process.exit(0);};process.once('SIGINT',stop);process.once('SIGTERM',stop);
}
