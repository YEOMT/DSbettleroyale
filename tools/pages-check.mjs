import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
const root=path.resolve('dist/client'),base='/DSbettleroyale/';
const server=http.createServer((req,res)=>{const u=new URL(req.url,'http://localhost');if(!u.pathname.startsWith(base)){res.writeHead(404).end();return;}const relative=decodeURIComponent(u.pathname.slice(base.length))||'index.html',file=path.resolve(root,relative);if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404).end();return;}const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'};res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHANNEL?{channel:process.env.PLAYWRIGHT_CHANNEL}:{})});
try{const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>errors.push(r.url()));await page.goto(`http://127.0.0.1:${server.address().port}${base}?room=123456&netdebug=1&renderer=canvas`);await page.waitForSelector('#ws-host-secret');assert.equal(await page.locator('#br-join-code').inputValue(),'123456');assert.equal(await page.locator('meta[name=br-build]').getAttribute('content'),JSON.parse(fs.readFileSync('dist/release.json')).buildId);await page.waitForTimeout(300);assert.deepEqual(errors,[]);console.log('PAGES_BASE_PASS: exact repository case, built assets, QR/query room and netdebug query load under /DSbettleroyale/.');}finally{await browser.close();await new Promise(r=>server.close(r));}
