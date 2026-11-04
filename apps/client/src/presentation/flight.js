// Sample only authoritative path segments. Curved shots never invent a future turn.
export function sampleFlight(shot,older,sourceTick,targetTick,olderTick=sourceTick){
 if(older&&shot.type==='ORBIT'&&shot.ownerWarp!==older.ownerWarp)return shot;
 const path=shot.path||[];
 for(let i=4;i<path.length;i+=4){const a=path[i-4],b=path[i];if(targetTick>=a&&targetTick<=b){const t=b>a?(targetTick-a)/(b-a):1;return {...shot,x:path[i-3]+(path[i+1]-path[i-3])*t,y:path[i-2]+(path[i+2]-path[i-2])*t};}}
 if(older&&targetTick<sourceTick){const t=Math.max(0,Math.min(1,(targetTick-olderTick)/Math.max(1,sourceTick-olderTick)));if(shot.turn!==older.turn||shot.phase!==older.phase)return {...shot,x:older.x,y:older.y};return {...shot,x:older.x+(shot.x-older.x)*t,y:older.y+(shot.y-older.y)*t};}
 if(shot.curved||!['projectile','hook','bullet'].includes(shot.kind))return shot;
 const ticks=Math.max(0,Math.min(6,targetTick-sourceTick)),vx=shot.native?shot.dx:shot.dx*(shot.speed||0),vy=shot.native?shot.dy:shot.dy*(shot.speed||0),speed=Math.hypot(vx,vy)||1;
 const remaining=shot.native?(shot.rangeRemaining??shot.remaining*speed):shot.remaining;
 const duration=Math.min(ticks,Number.isFinite(remaining)?remaining/speed:ticks);
 return {...shot,x:shot.x+vx*duration,y:shot.y+vy*duration};
}
