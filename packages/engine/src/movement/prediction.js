import {captureClamp} from './capture-boundary.js';
import {install,initializers} from './geometry.js';
// Only the original movement/wall intersection subset is shared with the browser.
export function createMovementKernel(){const scope={brCaptureMode:()=>!!scope.boundary,brCaptureBoundaryHit(from,to,r=0){const b=scope.boundary;if(!b)return null;let hit=null;for(const [axis,lo,hi]of [['x',b.minX+r,b.maxX-r],['y',b.minY+r,b.maxY-r]]){const d=to[axis]-from[axis];if(Math.abs(d)<1e-10)continue;const edge=d>0?hi:lo;if(d>0?to[axis]<=edge:to[axis]>=edge)continue;const t=Math.max(0,(edge-from[axis])/d);if(t>1||hit&&t>=hit.t)continue;hit={t,nx:axis==='x'?(d>0?-1:1):0,ny:axis==='y'?(d>0?-1:1):0,depth:0,boundary:true};}return hit;}};install(scope);for(const [,init]of initializers)init(scope);return scope;}
export function predictMovement(kernel,state,input,walls,arena){
 const next={...state};if(!state.alive)return next;
 let dx=input.move.x,dy=input.move.y;const amount=Math.min(1,Math.hypot(dx,dy)),length=Math.hypot(dx,dy)||1;
 kernel.boundary=arena?.boundary;
 const locked=state.stunned>1||state.rw?.locks?.move;
 const speed=state.moveSpeed*(.24+.76*amount),response=amount>.05?.78:.48;
 let vx=locked?state.vx:state.vx*(1-response)+(amount>.05?dx/length*speed:0)*response,vy=locked?state.vy:state.vy*(1-response)+(amount>.05?dy/length*speed:0)*response;
 const dash=state.dash||state.rw?.motion;
 if(dash){vx=dash.dx*Math.min(dash.speed,dash.remaining);vy=dash.dy*Math.min(dash.speed,dash.remaining);}
 // Captures/leaps are owned by the authoritative forced-motion entity; only its documented target is followed.
 if(state.rw?.capture){const c=state.rw.capture,x=c.toX-state.x,y=c.toY-state.y,n=Math.hypot(x,y)||1,d=Math.min(n,c.speed);vx=x/n*d;vy=y/n*d;}
 if(state.rw?.channel){vx=0;vy=0;}
 const moved=kernel.combatMoveCircle({x:state.x,y:state.y},{x:vx,y:vy},state.radius,state.phaseWalls?(arena?.boundary?.blocks||[]):walls,!!dash);
 Object.assign(next,{x:moved.x,y:moved.y,vx:moved.vx,vy:moved.vy,stunned:Math.max(0,(state.stunned||0)-1)});
 if(arena?.boundary){const b=arena.boundary,p=state.radius+4,{x,y}=captureClamp(b,next,p,kernel);if(x!==next.x)next.vx=0;if(y!==next.y)next.vy=0;next.x=x;next.y=y;}
 else if(arena){const r=arena.worldRadius-state.radius-4,n=Math.hypot(next.x,next.y);if(n>r){const nx=next.x/n,ny=next.y/n,out=next.vx*nx+next.vy*ny;next.x=nx*r;next.y=ny*r;if(out>0){next.vx-=nx*out;next.vy-=ny*out;}}}
 if(dash){const remaining=Math.max(0,dash.remaining-Math.hypot(next.x-state.x,next.y-state.y));if(state.dash)next.dash={...dash,remaining};else next.rw={...next.rw,motion:{...dash,remaining}};}
 else{next.vx*=.92;next.vy*=.92;}
 return next;
}
