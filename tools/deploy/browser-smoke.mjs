import {chromium} from 'playwright';
const url=process.env.SMOKE_URL,secret=process.env.SMOKE_HOST_SECRET;
if(!url||!secret)throw Error('BLOCKED_CONFIGURATION');
const start=Date.now(),browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHANNEL?{channel:process.env.PLAYWRIGHT_CHANNEL}:{})}),contexts=[],pages=[],errors=[];
try{
 for(let i=0;i<3;i++){const c=await browser.newContext();contexts.push(c);await c.route(/dropbox/,r=>r.abort());const p=await c.newPage();pages.push(p);p.on('pageerror',e=>errors.push(e.message));await p.goto(url);}
 const [host,a,b]=pages;await host.locator('#ws-host-secret').fill(secret);await host.locator('#br-create-btn').click();await host.locator('#br-host-room').waitFor();const code=(await host.locator('#br-room-code').innerText()).trim();
 for(const [p,i]of [[a,1],[b,2]]){await p.locator('#br-join-code').fill(code);await p.locator('#br-player-name').fill('Release check '+i);await p.locator('#br-join-btn').click();await p.locator('#br-student-wait').waitFor();}
 await host.locator('#br-start-quiz').click();await a.locator('#br-quiz').waitFor();await host.locator('#br-skip-to-draft').click();await a.locator('#br-draft').waitFor();await a.locator('#br-ready-btn').click();await b.locator('#br-ready-btn').click();await host.locator('#br-start-battle').click();await a.locator('#br-student-battle').waitFor();await a.locator('#br-attack').click();await host.locator('#br-force-end').click();await a.locator('#br-results').waitFor();await host.locator('#br-rematch-room').click();await a.locator('#br-student-wait').waitFor();await host.locator('#br-close-room').click();
 if(errors.length)throw Error('BROWSER_CONSOLE_ERRORS');console.log(JSON.stringify({status:'PASS',ms:Date.now()-start,scope:'public teacher + two headless students; one short solo lifecycle; audio/physical-classroom NOT_RUN'}));
}finally{
 const host=pages[0];if(host)try{if(await host.locator('#br-force-end').isVisible())await host.locator('#br-force-end').click();if(await host.locator('#br-finish-room').isVisible())await host.locator('#br-finish-room').click();else if(await host.locator('#br-close-room').isVisible())await host.locator('#br-close-room').click();}catch{}
 for(const c of contexts)await c.close();await browser.close();
}
