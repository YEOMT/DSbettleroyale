import {install,initializers} from './geometry.js';
// Only the original movement/wall intersection subset is shared with the browser.
export function createMovementKernel(){const scope={brCaptureMode:()=>false};install(scope);for(const [,init]of initializers)init(scope);return scope;}
export function predictMovement(kernel,state,input,walls,arena){
 const next={...state};if(!state.alive)return next;
 let dx=input.move.x,dy=input.move.y;const amount=Math.min(1,Math.hypot(dx,dy)),length=Math.hypot(dx,dy)||1;
 if(state.stunned>0||state.rw?.locks?.move){dx=0;dy=0;}
 const speed=state.moveSpeed*(.24+.76*amount),response=amount>.05?.78:.48;
 const vx=state.vx*(1-response)+(amount>.05?dx/length*speed:0)*response,vy=state.vy*(1-response)+(amount>.05?dy/length*speed:0)*response;
 const moved=kernel.combatMoveCircle({x:state.x,y:state.y},{x:vx,y:vy},state.radius,walls,false);
 Object.assign(next,{x:moved.x,y:moved.y,vx:moved.vx*.92,vy:moved.vy*.92});
 if(arena?.boundary){const b=arena.boundary,p=state.radius+4;next.x=Math.max(b.minX+p,Math.min(b.maxX-p,next.x));next.y=Math.max(b.minY+p,Math.min(b.maxY-p,next.y));}
 else if(arena){const r=arena.worldRadius-state.radius-4,n=Math.hypot(next.x,next.y);if(n>r){next.x*=r/n;next.y*=r/n;}}
 return next;
}
