// CSS owns pointer gesture arbitration. This narrowly scoped fallback handles
// Safari's separate GestureEvents without canceling clicks or pointer capture.
export function bindBattleTouch(root){
 const prevent=e=>{if(!root.classList.contains('br-hidden')&&e.cancelable)e.preventDefault();};
 const types=['gesturestart','gesturechange','gestureend','touchmove'];
 for(const type of types)root.addEventListener(type,prevent,{passive:false});
 return ()=>{for(const type of types)root.removeEventListener(type,prevent);};
}
