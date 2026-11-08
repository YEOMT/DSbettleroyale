import assert from 'node:assert/strict';
function receive(o,m){
 const p=m.payload||{};if(m.type==='EVENT_BATCH'){for(const e of p.messages||[])receive(o,e);return;}
 const self=s=>{if(s)o.self={id:s.id,x:s.x,y:s.y,alive:s.alive,stunned:s.stunned,cooldown:s.cooldown,basicCooldown:s.basicCooldown,actions:s.actions};};
 if(m.connectionEpoch)o.epoch=m.connectionEpoch;
 if(m.type==='SNAPSHOT'){self(p.self);o.actors=(p.actors||[]).map(a=>({id:a.id,x:a.x,y:a.y,alive:a.alive}));}
 if(m.type==='PRIVATE_STATE')self(p);if(m.type==='FULL_STATE'){o.full++;self(p.self);}
 if(['VERSION_MISMATCH','OVERLOAD'].includes(m.type))o.errors.push(m.type);
}
export async function lifecycle({browser,urls,secret,buildId,configureContext=async()=>{}}){
 const started=Date.now(),contexts=[],pages=[],errors=[],controls={},states=[];
 const wait=async(i,fn,ms=30000)=>{for(const end=Date.now()+ms;Date.now()<end;){if(fn(states[i]))return;await new Promise(r=>setTimeout(r,25));}throw Error("AUTHORITATIVE_STATE_TIMEOUT");};
 async function act(page,resumed=false){
  const i=pages.indexOf(page);await wait(i,s=>s.self?.alive&&s.self.stunned<=0&&s.inputEpoch===s.epoch);
  const before={...states[i].self};const key=Math.abs(before.x)>Math.abs(before.y)?(before.x>0?'a':'d'):(before.y>0?'w':'s');
  await page.keyboard.down(key);try{await wait(i,s=>s.self&&Math.hypot(s.self.x-before.x,s.self.y-before.y)>12,8000);}finally{await page.keyboard.up(key);}
  assert.equal(states[i].self.id,before.id);controls[resumed?'resumeMove':'move']=true;
  for(const [kind,field,cd]of [['attack','firedAttack','basicCooldown'],['skill','firedSkill','cooldown']]){
   await wait(i,s=>s.self?.alive&&s.self.stunned<=0&&s.self[cd]<=0,45000);
   const previous=states[i].self.actions?.[field]||0;await page.locator('#br-'+kind).click();
   await wait(i,s=>(s.self?.actions?.[field]||0)>previous,15000);
   controls[resumed?(kind==='attack'?'resumeAttack':'resumeSkill'):kind]=true;
  }return before.id;
 }
 try{
  assert.equal(urls.length,3);
  for(let i=0;i<3;i++){
   const c=await browser.newContext({viewport:{width:1024,height:768}});contexts.push(c);const o={self:null,actors:[],full:0,epoch:0,inputEpoch:0,urls:[],errors:[]};states.push(o);const wire=m=>receive(o,m);wire.open=url=>o.urls.push(url);wire.sent=m=>{if(m.type==='INPUT_BATCH')o.inputEpoch=m.connectionEpoch;};await c.route(/dropbox/,r=>r.abort());const routed=await configureContext(c,i,wire);
   const p=await c.newPage();pages.push(p);if(!routed)p.on("websocket",ws=>{wire.open(ws.url());ws.on("framereceived",e=>wire(JSON.parse(String(e.payload))));ws.on("framesent",e=>wire.sent(JSON.parse(String(e.payload))));});p.on('pageerror',e=>errors.push(e.message.replaceAll(secret,'[redacted]')));await p.goto(urls[i]);await p.locator('#br-create-btn').waitFor();assert.equal(await p.locator('meta[name="br-build"]').getAttribute('content'),buildId);
  }
  const [host,a,b]=pages;await host.locator('#ws-host-secret').fill(secret);await host.locator('#br-create-btn').click();await host.locator('#br-host-room').waitFor();const code=(await host.locator('#br-room-code').innerText()).trim();
  for(const[p,name]of [[a,'Release A'],[b,'Release B']]){await p.locator('#br-join-code').fill(code);await p.locator('#br-player-name').fill(name);await p.locator('#br-join-btn').click();await p.locator('#br-student-wait').waitFor();}controls.lobby=true;
  await host.locator('#br-start-quiz').click();await a.locator('#br-quiz').waitFor();controls.quiz=true;
  await host.locator('#br-skip-to-draft').click();await a.locator('#br-draft').waitFor();await a.locator('#br-ready-btn').click();await b.locator('#br-ready-btn').click();controls.draft=true;
  await host.locator('#br-start-battle').click();await a.locator('#br-student-battle').waitFor();const id=await act(a);await wait(0,s=>s.actors.some(a=>a.id===id&&a.alive));
  const epoch=states[1].epoch,full=states[1].full;await a.reload();await a.locator('#br-student-battle').waitFor();await wait(1,s=>s.full>full&&s.self?.id===id&&s.epoch>epoch);controls.resume=true;assert.equal(await act(a,true),id);
  await host.locator('#br-force-end').click();await a.locator('#br-results').waitFor();controls.results=true;
  await host.locator('#br-rematch-room').click();await a.locator('#br-student-wait').waitFor();await b.locator('#br-student-wait').waitFor();controls.rematch=true;
  for(const o of states){assert.ok(o.urls.length>0&&o.urls.every(u=>u.startsWith('wss://')));assert.deepEqual(o.errors,[]);}
  await host.locator('#br-close-room').click();await host.locator('#br-create-btn').waitFor();controls.closed=true;assert.deepEqual(errors,[]);
  return {status:'PASS',ms:Date.now()-started,controls,teacher:1,students:2,scope:'short real UI + authoritative snapshots; NOT long-term stability'};
 }catch(e){const error=Error(String(e.message).replaceAll(secret,'[redacted]'));error.lifecycle={controls,states,screens:await Promise.all(pages.map(p=>p.evaluate(()=>({screen:document.querySelector('.br-screen:not(.br-hidden)')?.id,toast:document.querySelector('#br-toast')?.textContent,})).catch(()=>({closed:true}))))};throw error;
 }finally{const host=pages[0];if(host)try{if(await host.locator('#br-force-end').isVisible())await host.locator('#br-force-end').click();if(await host.locator('#br-finish-room').isVisible())await host.locator('#br-finish-room').click();else if(await host.locator('#br-close-room').isVisible())await host.locator('#br-close-room').click();}catch{}for(const c of contexts)await c.close();}
}
