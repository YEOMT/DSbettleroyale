// Status expiry never outruns confirmed simulation progress, even when the
// movement display extrapolates or the socket/SAFE_PAUSED clock stops.
export const effectTick=(renderTick,serverTick)=>Math.min(renderTick,serverTick);
export function remainingEffect(end,tick,span=180){
 const frames=Math.max(0,Number(end)-Number(tick));
 return {active:frames>0,soon:frames>0&&frames<=60,frames,ratio:Math.min(1,frames/Math.max(1,span))};
}
