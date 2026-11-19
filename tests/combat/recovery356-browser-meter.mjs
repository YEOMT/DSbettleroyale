// Opt-in measurement wrappers return the original method result unchanged.
export async function installBodyMeter(page){
 await page.evaluate(()=>{
  const renderer=window.auditApp.renderer;window.bodyMeter={};
  for(const [owner,key,label]of [[renderer.poses,'sample','poseSample'],[renderer.poses,'snapshot','poseSnapshot'],[renderer.poses,'accept','poseAccept'],[renderer,'image','image'],[renderer,'actorBody','actorBody']]){
   const original=owner[key],row=bodyMeter[label]={calls:0,ms:0,max:0};
   owner[key]=function(...args){const start=performance.now();try{return original.apply(this,args);}finally{const ms=performance.now()-start;row.calls++;row.ms+=ms;row.max=Math.max(row.max,ms);}};
  }
 });
}
export async function bodyMeterBoundary(pages,reset=false){
 for(const page of pages)if(!await page.evaluate(()=>!!window.bodyMeter))await installBodyMeter(page);
 return Promise.all(pages.map(page=>page.evaluate(reset=>{
 const value=structuredClone(window.bodyMeter);if(reset)for(const row of Object.values(window.bodyMeter)){row.calls=row.ms=row.max=0;}return value;
},reset)));}
