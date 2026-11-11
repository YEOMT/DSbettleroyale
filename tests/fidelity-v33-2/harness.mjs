import {freezeableFixture} from '../simulation-fixture.mjs';
import {createServer} from 'vite';
import {fork} from 'node:child_process';
import {chromium,webkit} from 'playwright';
import {createGameServer} from '../../apps/server/src/main.js';
import {connect} from '../integration/client.mjs';
import {getTeacherState,getHostVisibleState,getVisibleState,getStaticState} from '../../packages/engine/src/index.js';
import {snapshotEncoder} from '../../apps/server/src/ws/snapshot.js';
export const delay=ms=>new Promise(r=>setTimeout(r,ms));
export async function auditHarness({players=20,mode='solo',renderer='canvas',hostRenderer=renderer,studentRenderer=renderer,quality='balanced',viewport={width:1366,height:768},audio=false,browserArgs=[],studentContext={},browserEngine='chromium',initScript,serverProcess=false}={}){
 let app,rpc,child;
 if(serverProcess){
  child=fork('tools/load/server.mjs',[],{windowsHide:true});const port=await new Promise((resolve,reject)=>{child.once('message',m=>resolve(m.port));child.once('error',reject);});let seq=0;const pending=new Map();
  child.on('message',m=>{const p=pending.get(m.id);if(p){pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(Error(m.error)):p.resolve(m.value);}});
  rpc=(type,args={})=>new Promise((resolve,reject)=>{const id=++seq,timer=setTimeout(()=>{pending.delete(id);reject(Error('IPC_TIMEOUT '+type));},10000);pending.set(id,{resolve,reject,timer});child.send({id,type,...args});});
  app={address:{port},close:()=>rpc('close')};
 }else app=await createGameServer({port:0,hostSecret:'test-host'});
 const target='http://127.0.0.1:'+app.address.port;
 const vite=await createServer({configFile:'apps/client/vite.config.js',server:{watch:null,hmr:false,port:0,strictPort:false,proxy:{'/ws':{target:target.replace('http:','ws:'),ws:true},'/version':target,'/healthz':target}}});await vite.listen();const url='http://127.0.0.1:'+vite.httpServer.address().port;if(rpc)await rpc('fixture-origin',{origin:url});else app.config.origins.push(url);
 const browser=await (browserEngine==='webkit'?webkit:chromium).launch({headless:true,args:browserArgs,...(browserEngine==='chromium'&&process.env.PLAYWRIGHT_CHANNEL?{channel:process.env.PLAYWRIGHT_CHANNEL}:{})}),contexts=[],errors=[],clients=[];
 const video=process.env.COMBAT_VIDEO_DIR?{recordVideo:{dir:process.env.COMBAT_VIDEO_DIR,size:viewport}}:{};
 async function page(options={},record=false,mode=renderer){const context=await browser.newContext({viewport,deviceScaleFactor:1,...(record?video:{}),...options});if(initScript)await context.addInitScript(initScript);if(!audio)await context.route(/dropbox/,r=>r.abort());contexts.push(context);const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto(url+'/?renderer='+mode);await p.evaluate(async()=>{window.auditApp=await import('/src/main.js');});return p;}
 const host=await page({},false,hostRenderer);await host.locator('#ws-host-secret').fill('test-host');await host.locator('#br-create-btn').click();await host.locator('#br-host-room').waitFor();const code=(await host.locator('#br-room-code').textContent()).trim(),room=rpc?{code}:freezeableFixture(app,app.manager.rooms.get(code));
 const student=await page(studentContext,true,studentRenderer);await student.locator('#br-join-code').fill(code);await student.locator('#br-player-name').fill('Audit Student');await student.locator('#br-join-btn').click();await student.locator('#br-student-wait').waitFor();
 for(let i=1;i<players;i++)clients.push(await(await connect(app)).join(code,'Audit '+i));
 const command=async(type,payload={})=>{const result=await host.evaluate(async({type,payload})=>{window.auditApp=await import('/src/main.js');return auditApp.net.command(type,payload);},{type,payload});if(type==='START_QUIZ')await host.waitForFunction(()=>auditApp.ui.room.phase==='QUIZ');return result;};
 await command('CONFIGURE',{mode,teamCount:2,graphicsPreset:quality,quizText:'Audit | Correct | Wrong 1 | Wrong 2 | Wrong 3'});
 async function battle(){await command('START_QUIZ');await command('BEGIN_DRAFT');await command('START_BATTLE');for(const p of [host,student])await p.waitForFunction(()=>auditApp.renderer.enabled&&!!auditApp.timeline.samples.length&&!!(auditApp.renderer.ctx||auditApp.renderer.pixi));room.fixtureFrozen=true;}
 function publish(){const w=room.world,teacher=getTeacherState(w),encode=snapshotEncoder(teacher,++room.snapshotSeq,performance.now());for(const m of room.members.values())if(m.connected){const view=m.role==='host'?getHostVisibleState(teacher):getVisibleState(w,m.id,undefined,teacher);m.peer.snapshot(encode(view.self?{...view,self:m.peer.selfState(view.self)}:view,m.peer.scope(),m.peer.deliveredAnnouncement),teacher.announcements?.seq);}}
 function staticState(){room.static=getStaticState(room.world);for(const m of room.members.values())m.peer?.send('STATIC_STATE',room.static);}
 return {app,rpc,vite,browser,contexts,host,student,clients,room,url,errors,command,battle,publish,staticState,async close(){await browser.close();for(const c of clients)await c.close();await vite.close();await app.close();}};
}
