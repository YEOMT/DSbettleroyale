import fs from 'node:fs';
import {WebSocket,WebSocketServer} from 'ws';
import {createGameServer} from '../../apps/server/src/main.js';
import {connect,TestClient} from '../../tests/integration/client.mjs';
import {Samples} from '../../apps/server/src/diagnostics/metrics.js';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
// Application message scheduling over real TCP/WebSocket, preserving each direction's FIFO order.
// This is not OS packet loss, a mobile radio, or a classroom benchmark.
const app=await createGameServer({port:0,hostSecret:'test-host'}),proxy=new WebSocketServer({host:'127.0.0.1',port:0}),links=new Set();
let profile={rtt:40,jitter:0},blockedUntil=0,randomState=1;
const random=()=>((randomState=(Math.imul(1664525,randomState)+1013904223)>>>0)/4294967296);
proxy.on('connection',client=>{
 const upstream=new WebSocket(`ws://127.0.0.1:${app.address.port}/ws`,{origin:'http://localhost:5173'}),link={client,upstream,timers:new Set(),closed:false};links.add(link);
 let incoming=[],opened=false,upDue=0,downDue=0;
 function send(target,data,up){const now=performance.now(),j=(random()*2-1)*profile.jitter,at=Math.max(now+Math.max(0,profile.rtt/2+j),up?upDue:Math.max(downDue,blockedUntil));if(up)upDue=at;else downDue=at;const timer=setTimeout(()=>{link.timers.delete(timer);if(target.readyState===1)target.send(data,{binary:false});},Math.max(0,at-now));link.timers.add(timer);}
 client.on('message',d=>opened?send(upstream,d,true):incoming.push(d));upstream.once('open',()=>{opened=true;for(const d of incoming)send(upstream,d,true);incoming=[];});upstream.on('message',d=>send(client,d,false));
 const close=()=>{if(link.closed)return;link.closed=true;for(const timer of link.timers)clearTimeout(timer);client.terminate();upstream.terminate();links.delete(link);};client.on('close',close);upstream.on('close',close);client.on('error',()=>{});upstream.on('error',()=>{});
});
await new Promise(r=>proxy.once('listening',r));const clients=[],report={kind:'26 clients; application FIFO delay over real WebSocket; 3-second profile windows; no OS shaping',profiles:[],stalls:[],trace:[],pass:false};
let inputTimer;
try{
 const host=await(await connect(app)).host();for(let i=0;i<26;i++){const c=await new TestClient(`ws://127.0.0.1:${proxy.address().port}`).open();await c.join(host.room.code,'Net'+i);c.seq=0;clients.push(c);}
 await host.command('CONFIGURE',{mode:'team-capture'});await host.command('START_QUIZ');await host.command('BEGIN_DRAFT');await host.command('START_BATTLE');await clients[0].phase('BATTLE');
 let tick=0;inputTimer=setInterval(()=>{tick++;for(const [i,c]of clients.entries())if(c.ws.readyState===1&&c.snapshot)c.send('INPUT_BATCH',{commands:[{seq:++c.seq,clientTick:tick,move:{x:Math.cos(i+tick*.03),y:Math.sin(i+tick*.03)},aim:{x:1,y:0}}]});},1000/30);
 clients[0].onMessage=m=>{if(m.type==='SNAPSHOT'){report.trace.push({arrival:performance.now(),source:m.payload.serverNow,tick:m.payload.serverTick});if(report.trace.length>2500)report.trace.shift();}};
 for(const rtt of [40,100,250])for(const jitter of [0,20,60]){
  profile={rtt,jitter};const gaps=new Samples(),pings=new Samples();let at=performance.now();const before=report.trace.length;for(let i=0;i<6;i++){const sent=performance.now();clients[0].send('PING',{clientTime:sent},false);const m=await clients[0].next('PONG',p=>p.clientTime===sent);pings.add(performance.now()-m.payload.clientTime);await sleep(Math.max(0,500-(performance.now()-sent)));}
  const trace=report.trace.slice(before);for(let i=1;i<trace.length;i++)gaps.add(trace[i].arrival-trace[i-1].arrival);
  report.profiles.push({...profile,elapsedMs:performance.now()-at,appRtt:pings.report(),arrivalGap:gaps.report(),connected:clients.filter(c=>c.ws.readyState===1).length});
 }
 for(const stall of [300,500,1500]){const start=performance.now(),tick=clients[0].snapshot.serverTick;blockedUntil=start+stall;await sleep(stall+600);report.stalls.push({stall,elapsedMs:performance.now()-start,advancedTicks:clients[0].snapshot.serverTick-tick});}
 // Use one identical received trace for all presentation-delay candidates.
 report.presentationCandidates=[50,75,100].map(delay=>{let bracket=0,total=0;const trace=report.trace;for(let i=1;i<trace.length;i++){const now=trace[i].arrival,target=now-profile.rtt/2-delay,received=trace.slice(0,i+1);if(received.some(x=>x.source<=target)&&received.some(x=>x.source>=target))bracket++;total++;}return {delayMs:delay,bracketRate:bracket/Math.max(1,total),samples:total};});
 report.pass=report.profiles.every(p=>p.connected===26&&p.arrivalGap.count>20)&&report.stalls.every(s=>s.advancedTicks>0);report.server=app.metrics.report(app.manager);
}catch(e){report.failure=e.stack;}finally{clearInterval(inputTimer);for(const l of links){l.client.terminate();l.upstream.terminate();for(const timer of l.timers)clearTimeout(timer);}await new Promise(r=>proxy.close(r));await app.close();fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/network-lab.json',JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({pass:report.pass,profiles:report.profiles.length,stalls:report.stalls.length,candidates:report.presentationCandidates,failure:report.failure}));process.exitCode=report.pass?0:1;

