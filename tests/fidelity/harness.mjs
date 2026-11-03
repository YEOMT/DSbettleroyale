import {createServer} from 'vite';
import {chromium} from 'playwright';
import {createGameServer} from '../../apps/server/src/main.js';
import {connect} from '../integration/client.mjs';
import {getTeacherState,getVisibleState,getStaticState} from '../../packages/engine/src/index.js';
import {snapshotEncoder} from '../../apps/server/src/ws/snapshot.js';
export const delay=ms=>new Promise(r=>setTimeout(r,ms));
export async function openFidelity({renderer='canvas',touch=false}={}){
 const app=await createGameServer({port:0,hostSecret:'test-host'}),target='http://127.0.0.1:'+app.address.port;
 const vite=await createServer({configFile:'apps/client/vite.config.js',server:{watch:null,hmr:false,port:0,strictPort:false,proxy:{'/ws':{target:target.replace('http:','ws:'),ws:true},'/version':target,'/healthz':target}}});await vite.listen();
 const url='http://127.0.0.1:'+vite.httpServer.address().port;app.config.origins.push(url);
 const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHANNEL?{channel:process.env.PLAYWRIGHT_CHANNEL}:{}),...(process.env.FIDELITY_SOFTWARE_GL?{args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}:{})}),host=await(await connect(app)).host(),pages=[],contexts=[],errors=[];
 const room=app.manager.rooms.get(host.room.code);
 for(let i=0;i<2;i++){const context=await browser.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1,hasTouch:touch}),page=await context.newPage();contexts.push(context);pages.push(page);page.on('pageerror',e=>errors.push(e.message));await page.goto(url+'/?room='+room.code+'&renderer='+renderer);await page.locator('#br-player-name').fill('Fidelity'+i);await page.locator('#br-join-btn').click();await page.locator('#br-student-wait').waitFor();}
 await host.command('CONFIGURE',{mode:'team-capture',teamCount:2,quizText:'Fixture | Correct | Wrong1 | Wrong2 | Wrong3'});await host.command('START_QUIZ');await host.command('BEGIN_DRAFT');await host.command('START_BATTLE');
 for(const page of pages){await page.locator('#br-student-battle').waitFor();await page.waitForFunction(async()=>{const m=await import('/src/main.js');return !!m.timeline.predicted&&!!m.timeline.static&&!!(m.renderer.ctx||m.renderer.pixi);});await page.evaluate(async()=>{const m=await import('/src/main.js');window.fidelity={app:m,status:[],frames:[],received:[]};m.net.addEventListener('snapshot',e=>{fidelity.received.push(e.detail);if(fidelity.received.length>1200)fidelity.received.shift();});const original=m.renderer.paint.brPaintReworkStatus;m.renderer.paint.brPaintReworkStatus=(p,x,y,r,z,s,t,hp)=>{let stars=0;const circle=p.circle;p.circle=(...args)=>{if(args[3]==='#fde047')stars++;return circle.apply(p,args);};try{return original(p,x,y,r,z,s,t,hp);}finally{p.circle=circle;fidelity.status.push({stars,t,source:s?.sourceTick,stunEnd:s?.stunEnd,x,y});if(fidelity.status.length>10000)fidelity.status.splice(0,2000);}};});}
 const students=room.students(),players=students.map(s=>room.world.byId.get(s.id));
 function publish(){const w=room.world,teacher=getTeacherState(w),encode=snapshotEncoder(teacher,++room.snapshotSeq,performance.now());for(const m of room.members.values())if(m.connected)m.peer.snapshot(encode(m.role==='host'?teacher:getVisibleState(w,m.id,undefined,teacher),m.peer.scope()));}
 function staticState(){room.static=getStaticState(room.world);for(const m of room.members.values())m.peer?.send('STATIC_STATE',room.static);}
 return {app,vite,browser,host,room,players,students,pages,contexts,url,errors,publish,staticState,async close(){await browser.close();await host.close();await vite.close();await app.close();}};
}
