import test from 'node:test';import assert from 'node:assert/strict';
import {launchIsolatedBrowser,isolatedBrowserEndpoint} from '../../tools/deploy/isolated-browser.mjs';
test('isolated browser remote connection stays on unauthenticated runner loopback',async()=>{
 for(const endpoint of ['ws://example.com:99/a','wss://127.0.0.1:99/a','ws://user:secret@127.0.0.1:99/a','ws://127.0.0.1/a'])assert.throws(()=>isolatedBrowserEndpoint(endpoint));
 const endpoint='ws://127.0.0.1:31245/browser';let seen;
 const result=await launchIsolatedBrowser({connect:async value=>{seen=value;return 'connected';},launch:()=>assert.fail('must use the preinstalled browser')},{ISOLATED_BROWSER_WS:endpoint});
 assert.equal(seen,endpoint);assert.equal(result,'connected');
});
test('local browser launch and channel behavior are preserved',async()=>{
 let opts;await launchIsolatedBrowser({launch:async value=>{opts=value;}},{PLAYWRIGHT_CHANNEL:'msedge'});assert.deepEqual(opts,{headless:true,channel:'msedge'});
});
