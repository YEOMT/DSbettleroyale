import {createServer} from 'vite';
import {chromium,webkit} from 'playwright';
import {createGameServer} from '../../apps/server/src/main.js';
import {connect} from '../integration/client.mjs';
import {getTeacherState,getVisibleState,getStaticState} from '../../packages/engine/src/index.js';
import {snapshotEncoder} from '../../apps/server/src/ws/snapshot.js';
export const delay=ms=>new Promise(r=>setTimeout(r,ms));
export async function auditHarness({players=20,mode='solo',renderer='canvas',quality='balanced',viewport={width:1366,height:768},audio=false,browserArgs=[],studentContext={},browserEngine='chromium'}={}){
 const app=await createGameServer({port:0,hostSecret:'test-host'}),target='http://127.0.0.1:'+app.address.port;
 const vite=await createServer({configFile:'apps/client/vite.config.js',server:{watch:null,hmr:false,port:0,strictPort:false,proxy:{'/ws':{target:target.replace('http:','ws:'),ws:true},'/version':target,'/healthz':target}}});await vite.listen();
 const url='http://127.0.0.1:'+vite.httpServer.address().port;app.config.origins.push(url);
 const browser=await (browserEngine==='webkit'?webkit:chromium).launch({headless:true,args:browserArgs,...(browserEngine==='chromium'&&process.env.PLAYWRIGHT_CHANNEL?{channel:process.env.PLAYWRIGHT_CHANNEL}:{})}),contexts=[],errors=[],clients=[];
 const video=process.env.COMBAT_VIDEO_DIR?{recordVideo:{dir:process.env.COMBAT_VIDEO_DIR,size:viewport}}:{};
 async function page(options={}){const context=await browser.newContext({viewport,deviceScaleFactor:1,...video,...options});if(!audio)await context.route(/dropbox/,r=>r.abort());contexts.push(context);const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto(url+'/?renderer='+renderer);return p;}
 const host=await page();await host.locator('#ws-host-secret').fill('test-host');await host.locator('#br-create-btn').click();await host.locator('#br-host-room').waitFor();const code=(await host.locator('#br-room-code').textContent()).trim(),room=app.manager.rooms.get(code);
 const student=await page(studentContext);await student.locator('#br-join-code').fill(code);await student.locator('#br-player-name').fill('Audit Student');await student.locator('#br-join-btn').click();await student.locator('#br-student-wait').waitFor();
 for(let i=1;i<players;i++)clients.push(await(await connect(app)).join(code,'Audit '+i));
 const command=(type,payload={})=>host.evaluate(async({type,payload})=>(await import('/src/main.js')).net.command(type,payload),{type,payload});
 await command('CONFIGURE',{mode,teamCount:2,graphicsPreset:quality,quizText:'Audit | Correct | Wrong 1 | Wrong 2 | Wrong 3'});
 async function battle(){await command('START_QUIZ');await command('BEGIN_DRAFT');await command('START_BATTLE');for(const p of [host,student])await p.waitForFunction(async()=>{const a=await import('/src/main.js');return a.renderer.enabled&&!!a.timeline.samples.length&&!!(a.renderer.ctx||a.renderer.pixi);});room.safePaused=true;}
 function publish(){const w=room.world,teacher=getTeacherState(w),encode=snapshotEncoder(teacher,++room.snapshotSeq,performance.now());for(const m of room.members.values())if(m.connected)m.peer.snapshot(encode(m.role==='host'?teacher:getVisibleState(w,m.id,undefined,teacher),m.peer.scope()));}
 function staticState(){room.static=getStaticState(room.world);for(const m of room.members.values())m.peer?.send('STATIC_STATE',room.static);}
 return {app,vite,browser,contexts,host,student,clients,room,url,errors,command,battle,publish,staticState,async close(){await browser.close();for(const c of clients)await c.close();await vite.close();await app.close();}};
}
