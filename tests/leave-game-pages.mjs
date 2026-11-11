// Complete the real WebSocket close handshake while Vite and the authority are
// still alive. Killing Chromium first can reset the proxy's TCP stream mid-write.
export async function leaveGamePages(browser,url){
 const pages=browser.contexts().flatMap(context=>context.pages()).filter(page=>page.url().startsWith(url+'/'));
 console.log('[fixture teardown] closing game WebSockets on',pages.length,'pages');
 await Promise.all(pages.map(page=>page.evaluate(async()=>{
  const {net}=await import('/src/main.js'),ws=net.ws;
  if(!ws||ws.readyState===WebSocket.CLOSED)return;
  await new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>reject(Error('fixture WebSocket close handshake timed out')),5000);
   ws.addEventListener('close',event=>{
    clearTimeout(timer);
    if(!event.wasClean){reject(Error('unclean fixture WebSocket close '+event.code));return;}
    resolve();
   },{once:true});
   net.leave();
  });
 })));
}
