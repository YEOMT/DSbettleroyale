const base=process.env.ADMIN_URL||'http://127.0.0.1:8080',secret=process.env.ADMIN_SECRET,timeout=Number(process.env.DRAIN_TIMEOUT_MS||600000);
if(!secret)throw Error('ADMIN_SECRET required');
const headers={Authorization:'Bearer '+secret},post=async path=>{const r=await fetch(base+path,{method:'POST',headers,signal:AbortSignal.timeout(5000)});if(!r.ok)throw Error('ADMIN_HTTP_'+r.status);return r.json();};
let sealed=false;
try{
 await post('/admin/drain');const end=Date.now()+timeout;
 while(Date.now()<end){const r=await fetch(base+'/admin/status',{headers,signal:AbortSignal.timeout(5000)});if(!r.ok)throw Error('STATUS_HTTP_'+r.status);const s=await r.json();console.log(JSON.stringify({draining:s.draining,protectedRooms:s.protectedRooms}));
  if(s.protectedRooms===0){await post('/admin/seal');sealed=true;console.log('DRAIN_SEALED');break;}await new Promise(r=>setTimeout(r,2000));
 }
 if(!sealed)throw Error('DRAIN_TIMEOUT: release cancelled; no match terminated');
}finally{if(!sealed)await post('/admin/undrain');}
