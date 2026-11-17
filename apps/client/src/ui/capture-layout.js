import {writeProperty} from './dom-write.js';

// ResizeObserver only requests a measurement. Writing dependent HUD layout
// inside its delivery can cause another same-cycle notification in WebKit.
// One pending frame per app-level scoreboard, cancelled on leaving battle.
export function observeCaptureLayout(element){
 let frame=null;
 const cancel=()=>{if(frame!==null)cancelAnimationFrame(frame);frame=null;};
 const observer=new ResizeObserver(()=>{
  if(frame!==null||element.classList.contains('br-hidden'))return;
  frame=requestAnimationFrame(()=>{
   frame=null;if(element.classList.contains('br-hidden'))return;
   writeProperty(document.body,'--br-cap-bottom',Math.ceil(element.getBoundingClientRect().bottom)+'px');
   document.dispatchEvent(new Event('dsbr-hud-layout'));
  });
 });
 observer.observe(element);return {observer,cancel};
}
