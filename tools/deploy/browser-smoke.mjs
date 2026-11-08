import {createRequire} from 'node:module';import path from 'node:path';import {lifecycle} from './lifecycle.mjs';
const {chromium}=createRequire(path.resolve(process.env.DEPLOY_RUNTIME||'package.json'))('playwright');
const url=process.env.SMOKE_URL,secret=process.env.SMOKE_HOST_SECRET,sha=process.env.RELEASE_SHA;
if(!url||!secret||!sha)throw Error('BLOCKED_CONFIGURATION');
const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHANNEL?{channel:process.env.PLAYWRIGHT_CHANNEL}:{})});
try{console.log(JSON.stringify(await lifecycle({browser,urls:[url,url,url],secret,buildId:sha})));}finally{await browser.close();}
