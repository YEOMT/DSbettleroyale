// Test-only instrumentation installed before app load. Does not alter scheduling.
export function lifetimeProbe(){
 const intervals=new Set(),timeouts=new Set(),frames=new Set(),listeners=new Map();
 const si=window.setInterval.bind(window),ci=window.clearInterval.bind(window),st=window.setTimeout.bind(window),ct=window.clearTimeout.bind(window),raf=window.requestAnimationFrame.bind(window),caf=window.cancelAnimationFrame.bind(window);
 window.setInterval=(fn,ms,...args)=>{const id=si(fn,ms,...args);intervals.add(id);return id;};window.clearInterval=id=>{intervals.delete(id);ci(id);};
 window.setTimeout=(fn,ms,...args)=>{if(typeof fn!=='function')return st(fn,ms,...args);let id;id=st((...a)=>{timeouts.delete(id);fn(...a);},ms,...args);timeouts.add(id);return id;};window.clearTimeout=id=>{timeouts.delete(id);ct(id);};
 window.requestAnimationFrame=fn=>{let id;id=raf(t=>{frames.delete(id);fn(t);});frames.add(id);return id;};window.cancelAnimationFrame=id=>{frames.delete(id);caf(id);};
 for(const target of [window,document]){const add=target.addEventListener.bind(target),remove=target.removeEventListener.bind(target),byType=new Map();listeners.set(target,byType);
  target.addEventListener=(type,fn,opts)=>{const key=type+':'+!!(typeof opts==='boolean'?opts:opts?.capture);let set=byType.get(key);if(!set)byType.set(key,set=new Set());set.add(fn);return add(type,fn,opts);};
  target.removeEventListener=(type,fn,opts)=>{byType.get(type+':'+!!(typeof opts==='boolean'?opts:opts?.capture))?.delete(fn);return remove(type,fn,opts);};
 }
 window.lifetimeCounts=()=>({intervals:intervals.size,timeouts:timeouts.size,raf:frames.size,listeners:[...listeners.values()].flatMap(m=>[...m.values()]).reduce((n,s)=>n+s.size,0)});
}
