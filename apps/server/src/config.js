import fs from 'node:fs';
export function readConfig(env=process.env){
 const production=env.NODE_ENV==='production',host=env.HOST||'127.0.0.1';
 if(production&&!env.HOST_AUTH_SECRET)throw Error('HOST_AUTH_SECRET is required in production');
 if(production&&!env.ALLOWED_ORIGINS)throw Error('ALLOWED_ORIGINS is required in production');
 if(production&&(env.HOST_AUTH_SECRET.length<24||/^(replace-|local-teacher)/.test(env.HOST_AUTH_SECRET)))throw Error('Set a random production teacher secret of at least 24 characters');
 if(production&&(!env.ADMIN_SECRET||env.ADMIN_SECRET.length<24||/^(replace-|local-teacher)/.test(env.ADMIN_SECRET)))throw Error('Set a separate production ADMIN_SECRET of at least 24 characters');
 if(!production&&!['127.0.0.1','localhost','::1'].includes(host)&&(env.ALLOW_LAN!=='true'||!env.HOST_AUTH_SECRET))throw Error('LAN mode requires ALLOW_LAN=true and an explicit HOST_AUTH_SECRET');
 const origins=(env.ALLOWED_ORIGINS||'http://localhost:5173,http://127.0.0.1:5173,http://localhost:8080,http://127.0.0.1:8080').split(',').map(s=>s.trim());
 if(origins.some(o=>{try{const u=new URL(o);return u.origin!==o||production&&u.protocol!=='https:';}catch{return true;}}))throw Error('ALLOWED_ORIGINS must contain exact origins');
 return {production,host,port:Number(env.PORT||8080),origins,hostSecret:env.HOST_AUTH_SECRET||'local-teacher',adminSecret:env.ADMIN_SECRET||env.HOST_AUTH_SECRET||'local-teacher',
  maxPlayers:30,maxActiveBattles:Number(env.MAX_ACTIVE_BATTLES||1),maxRooms:Number(env.MAX_ROOMS||20),roomTtlMs:Number(env.ROOM_TTL_MS||300000),
  resumeGraceMs:Number(env.RESUME_GRACE_MS||60000),drainOnStart:env.DRAIN_ON_START==='true'||!!(env.DRAIN_STATE_FILE&&(!fs.existsSync(env.DRAIN_STATE_FILE)||fs.readFileSync(env.DRAIN_STATE_FILE,'utf8').trim()!=='open')),snapshotHz:20,authTimeoutMs:5000,maxPayload:262144,
  bufferWarn:65536,bufferHard:262144,bufferTimeoutMs:1000,clientDir:env.CLIENT_DIR||'dist/client'};
}
