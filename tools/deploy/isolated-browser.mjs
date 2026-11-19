// Only isolated/local fixture callers opt into the CI browser service.
// Production public smoke keeps its existing launch path.
export function isolatedBrowserEndpoint(value) {
 const url=new URL(value);
 if(url.protocol!=='ws:'||url.hostname!=='127.0.0.1'||!url.port||url.username||url.password)
  throw Error('ISOLATED_BROWSER_MUST_BE_LOOPBACK');
 return url.href;
}
export function launchIsolatedBrowser(chromium,env=process.env) {
 if(env.ISOLATED_BROWSER_WS)return chromium.connect(isolatedBrowserEndpoint(env.ISOLATED_BROWSER_WS));
 return chromium.launch({headless:true,...(env.PLAYWRIGHT_CHANNEL?{channel:env.PLAYWRIGHT_CHANNEL}:{})});
}
