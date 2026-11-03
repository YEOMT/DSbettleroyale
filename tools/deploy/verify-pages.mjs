import fs from 'node:fs';import {createHash} from 'node:crypto';
export async function verifyPages(url,dir){
 const get=async p=>{const r=await fetch(new URL(p,url),{cache:'no-store',signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('PUBLIC_ASSET_'+r.status);return Buffer.from(await r.arrayBuffer());};
 const expected=fs.readFileSync(dir+'/index.html'),actual=await get('index.html?releasecheck='+Date.now());
 if(!expected.equals(actual))throw Error('PAGES_INDEX_MISMATCH');
 if(fs.existsSync(dir+'/version.json')){
  const local=JSON.parse(fs.readFileSync(dir+'/version.json')),remote=JSON.parse(await get('version.json?releasecheck='+Date.now()));
  for(const k of ['buildId','contentHash','engineRevision','protocolVersion'])if(local[k]!==remote[k])throw Error('PAGES_VERSION_MISMATCH');
 }
 for(const match of expected.toString().matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)){
  const asset=match[1],base=new URL(url).pathname,p=asset.startsWith(base)?asset.slice(base.length):asset.replace(/^\.\//,'');
  // The initial legacy/Firebase page can reference pinned CDN scripts. Its exact
  // archived HTML and CDN availability are verified; do not invent local copies.
  if(/^https?:/.test(asset)&&new URL(asset).origin!==new URL(url).origin){await get(asset);continue;}
  const hash=b=>createHash('sha256').update(b).digest('hex');if(hash(await get(asset))!==hash(fs.readFileSync(dir+'/'+p)))throw Error('PAGES_ASSET_MISMATCH');
 }
 console.log('PAGES_PAIR_VERIFIED');
}
if(process.argv[1]?.endsWith('verify-pages.mjs'))await verifyPages(process.argv[2],process.argv[3]);
