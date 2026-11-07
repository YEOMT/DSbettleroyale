// Runs only in the benchmark page. Bounded samples, no production telemetry upload.
export async function installBrowserTelemetry(){
 const a=await import('/src/main.js'),r=a.renderer,t=a.timeline;
 const stats={},wire={types:{},cursorDrops:{},scopeDrops:{},status:[]};let previous=0,mutations=0,styleUpdates=0,textBuilds=0,frames=0,shots=0,fx=0;
 const receive=a.net.receive.bind(a.net);a.net.receive=m=>{wire.types[m.type]=(wire.types[m.type]||0)+1;if(m.eventSeq&&m.eventSeq<=a.net.cursor)wire.cursorDrops[m.type]=(wire.cursorDrops[m.type]||0)+1;if(m.matchId&&m.matchId!==a.net.scope.matchId||m.connectionEpoch<a.net.scope.connectionEpoch)wire.scopeDrops[m.type]=(wire.scopeDrops[m.type]||0)+1;return receive(m);};
 a.net.addEventListener('status',e=>{wire.status.push(e.detail);if(wire.status.length>30)wire.status.shift();});
 const add=(key,value)=>{const s=stats[key]||=( {values:new Float64Array(4096),count:0,total:0,max:0});s.values[s.count++%4096]=value;s.total+=value;s.max=Math.max(s.max,value);};
 const summary=s=>{if(!s)return {count:0,p95:0,max:0};const v=Array.from(s.values.subarray(0,Math.min(s.count,4096))).sort((x,y)=>x-y);return {count:s.count,mean:s.total/s.count,p50:v[Math.floor((v.length-1)*.5)],p95:v[Math.floor((v.length-1)*.95)],p99:v[Math.floor((v.length-1)*.99)],max:s.max,over33:v.filter(x=>x>33.3).length/v.length,over50:v.filter(x=>x>50).length/v.length};};
 const wrap=(object,key,label)=>{const fn=object[key].bind(object);object[key]=(...args)=>{const start=performance.now();try{return fn(...args);}finally{add(label,performance.now()-start);}};};
 wrap(t,'frame','timelineMs');wrap(t,'accept','acceptMs');wrap(a.net,'receive','receiveMs');wrap(a.ui,'self','selfHudMs');wrap(a.ui,'battleHud','battleHudMs');wrap(a.ui,'clock','clockHudMs');
 const gl=r.pixi?r.app.renderer.gl:null,gpu=gl?.getExtension('EXT_disjoint_timer_query_webgl2'),queries=[];
 const seenStyles=new WeakSet(),draw=r.draw.bind(r);r.draw=(v,now)=>{if(previous)add('frameGapMs',now-previous);previous=now;frames++;shots+=v.shots.length;fx+=v.effects.length;
  if(gpu)while(queries.length&&gl.getQueryParameter(queries[0],gl.QUERY_RESULT_AVAILABLE)){const q=queries.shift();if(!gl.getParameter(gpu.GPU_DISJOINT_EXT))add('gpuMs',gl.getQueryParameter(q,gl.QUERY_RESULT)/1e6);gl.deleteQuery(q);}
  const query=gpu&&frames%30===0&&queries.length<4?gl.createQuery():null;if(query)gl.beginQuery(gpu.TIME_ELAPSED_EXT,query);
  const start=performance.now();draw(v,now);add('drawMs',performance.now()-start);if(query){gl.endQuery(gpu.TIME_ELAPSED_EXT);queries.push(query);}
  for(const l of r.labels.values())if(!seenStyles.has(l.style)){seenStyles.add(l.style);l.style.on('update',()=>styleUpdates++);}};
 if(r.pixi){
  wrap(r.app,'render','submitMs');
  const system=r.app.renderer.canvasText;if(system?.getTexture)wrap(system,'getTexture','textTextureMs');
  if(system?.getTexture){const get=system.getTexture.bind(system);system.getTexture=(...args)=>{textBuilds++;return get(...args);};}
 }
 const observer=new MutationObserver(rows=>{mutations+=rows.length;});observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['style','class','aria-disabled']});
 let longTasks;try{longTasks=new PerformanceObserver(list=>{for(const x of list.getEntries())add('longTaskMs',x.duration);});longTasks.observe({type:'longtask',buffered:false});}catch{/* WebKit does not expose Long Tasks. */}
 a.net.addEventListener('snapshot',e=>{add('snapshotSourceGapMs',(e.detail.serverTick-(window._perfLastTick||e.detail.serverTick))*1000/60);window._perfLastTick=e.detail.serverTick;});
 let pending=false,ticks=0;
 const autopilot=setInterval(async()=>{if(r.teacher||pending||a.ui.room?.phase!=='BATTLE'||!t.predicted?.alive)return;
  const self=t.predicted,actors=t.samples.at(-1)?.state.actors||[],target=actors.find(p=>p.alive&&p.id!==self.id&&(!self.team||p.team!==self.team));ticks++;
  const radius=window.tabletProbe?.dense?180:Math.max(180,(t.samples.at(-1)?.state.aliveCount||0)*20),angle=ticks*.035,tx=Math.cos(angle)*radius,ty=Math.sin(angle)*radius,dx=tx-self.x,dy=ty-self.y,dist=Math.hypot(dx,dy)||1;
  a.controls.move={x:dx/dist,y:dy/dist};const ax=(target?.x||0)-self.x,ay=(target?.y||0)-self.y,n=Math.hypot(ax,ay)||1;a.controls.aim={x:ax/n,y:ay/n};a.controls.fire(ticks%7?'attack':'skill');
  if(self.run?.offer){pending=true;try{await a.net.command('AUGMENT_CHOOSE',{offerId:self.run.offer.id,augmentId:self.run.offer.cards[0].id});}finally{pending=false;}}
 },100);
 let requestedQuality;const setQuality=value=>{requestedQuality=value;r.session.roomMeta.graphicsPreset=value;if(r.teacher){r.session.captureHostQuality=value;r.session.captureAutoBalanced=false;r.session.captureDecorReduced=false;r.session.capturePerf=null;r.session.captureHostFPS=value==='balanced'?30:60;}r.resize();};
 a.net.addEventListener('room_state',()=>{if(requestedQuality)setQuality(requestedQuality);});
 window.tabletProbe={sample(){const result={stats:Object.fromEntries(Object.entries(stats).map(([k,v])=>[k,summary(v)])),frames,shots,fx,mutations,styleUpdates,textBuilds,
  renderer:r.pixi?'pixi':'canvas',quality:r.session.roomMeta?.graphicsPreset,profile:r.paint.brGraphicsProfile(),resolution:r.pixi?r.app.renderer.resolution:r.dpr,backing:[r.canvas.width,r.canvas.height],antialias:r.pixi?r.app.renderer.gl?.getContextAttributes()?.antialias:null,
  gpuTimerAvailable:!!gpu,captureHostFPS:r.session.captureHostFPS,captureAutoBalanced:!!r.session.captureAutoBalanced,heap:performance.memory?.usedJSHeapSize,domNodes:document.getElementsByTagName('*').length,
  caches:{sprites:r.sprites.size,textures:r.textures.size,labels:r.labels.size,tracks:r.tracks.size,deaths:r.deaths.size,hpTrails:r.hpTrails?.size||0,names:r.session.nameSpriteCache?.size||0,emoji:r.paint.BR_ACTOR_EMOJI_CACHE.size,levels:r.paint.BR_LEVEL_TEXTURES.size,children:r.world?.children.length||0,texturePixels:[...r.textures.values()].reduce((n,x)=>n+x.width*x.height,0),geometryInstructions:r.g?.context.instructions.length||0,staticSmokeInstructions:r.smoke?.context.instructions.length||0},
  roster10:{rings:r.roster10Rings?.size||0,visible:r.roster10Visible?.size||0},
  rafGapMs:r.frameTimes.slice(-4096),
  timeline:{samples:t.samples.length,spawns:t.spawns.size,terminals:t.terminals.size,effects:t.effects.length,history:t.history.length,previews:t.previews.size},
  net:{rtt:a.net.clock.rtt,outboundBytes:a.net.ws?.bufferedAmount||0,arrival:t.metrics.arrivalGaps.slice(-100),source:t.metrics.sourceGaps.slice(-100),pending:a.net.pending.size,wire:structuredClone(wire)},camera:r.cameraPose,
  actualAlive:t.samples.at(-1)?.state.aliveCount,simTime:t.samples.at(-1)?.state.simTime,blocked:r.renderBlocked,error:r.lastRenderError||null,phase:a.ui.room?.phase};
  for(const key of Object.keys(stats))delete stats[key];frames=shots=fx=mutations=styleUpdates=textBuilds=0;return result;},
  quality:setQuality,
  close(){clearInterval(autopilot);observer.disconnect();longTasks?.disconnect();for(const q of queries)gl.deleteQuery(q);}};
}
