// A rendering opportunity can block in the browser compositor after our draw
// has returned (notably software WebGL). Re-arming rAF immediately can then
// starve socket/input tasks. Give the task queues a turn before the next rAF;
// there is no timer, frame cap, skipped draw or change to animation duration.
export class FrameTurn{
 constructor(ready,channel=new MessageChannel()){
  this.channel=channel;this.ready=ready;this.serial=0;this.pending=null;
  channel.port1.onmessage=event=>{
   if(event.data!==this.pending)return;
   this.pending=null;this.ready();
  };
 }
 request(){if(this.pending==null){this.pending=++this.serial;this.channel.port2.postMessage(this.pending);}}
 cancel(){this.pending=null;}
}
