// A rendering opportunity can block in the browser compositor after our draw
// has returned (notably software WebGL). Re-arming rAF immediately can then
// starve socket/input tasks. Give the task queues a turn before the next rAF;
// there is no timer, frame cap, skipped draw or change to animation duration.
export class FrameTurn{
 constructor(ready,channel=new MessageChannel(),postTask=globalThis.scheduler?.postTask?.bind(globalThis.scheduler)){
  this.channel=channel;this.ready=ready;this.postTask=postTask;this.serial=0;this.pending=null;
  channel.port1.onmessage=event=>this.deliver(event.data);
 }
 deliver(ticket){if(ticket!==this.pending)return;this.pending=null;this.ready();}
 request(){
  if(this.pending!=null)return;const ticket=this.pending=++this.serial;
  // Prefer pending socket/input tasks over re-arming rendering. A normal
  // posted message alone can still alternate one old WS frame per GPU paint.
  // Browsers without the Scheduling API keep the ordinary task-turn fallback.
  if(this.postTask)this.postTask(()=>this.deliver(ticket),{priority:'background'}).catch(()=>{if(this.pending===ticket)this.channel.port2.postMessage(ticket);});
  else this.channel.port2.postMessage(ticket);
 }
 cancel(){this.pending=null;}
}
