import { chromium } from 'playwright';
import { html, scripts, sourceUnits } from './source.mjs';
export async function openBaseline() {
  const browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHANNEL ? {channel: process.env.PLAYWRIGHT_CHANNEL} : {}) });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  // No production Firebase or third-party requests are permitted in the reference harness.
  await context.route('**/*', route => route.abort());
  const page = await context.newPage();
  const errors=[];
  page.on('pageerror', e => errors.push(e.message));
  const expose = sourceUnits().filter(u=>u.script===1&&(u.node.type==='FunctionDeclaration'||u.node.type==='VariableDeclaration')).flatMap(u=>u.node.id?[u.name]:u.node.declarations.map(d=>d.id.name));
  const instrumented = scripts[1].replace('        brInit();', `        brInit(); window.__baseline={${expose.join(',')}};`);
  await page.setContent(html.replace(scripts[1],instrumented).replace(/<script\b[^>]*\bsrc=[^>]*>[\s\S]*?<\/script>/g, ''), { waitUntil: 'domcontentloaded' });
  return { browser, context, page, errors };
}
if (process.argv.includes('--probe')) {
  const b=await openBaseline();
  console.log(JSON.stringify({errors:b.errors, state:await b.page.evaluate(()=>({roster:EMOJI_DB.length,rework:Object.keys(BRRework.defs).length,progression:!!window.brProgression, keys:Object.keys(window).filter(k=>k.startsWith('br')||k.startsWith('BR'))}))},null,2));
  await b.browser.close();
}
