// Presentation only. v32.1 GameWorld.draw / drawHostLite / brPixiHostFrame /
// brCaptureViewPort are the reference. One update per displayed frame, as in v32.1.
export class HostCamera{
 constructor(){this.reset();}
 reset(){this.x=0;this.y=0;this.zoom=.5;this.mode='performance';this.target=null;}
 update(view,map,w,h,focusPlayer=false,override,dt=1000/60){
  const alive=view.actors.filter(p=>p.alive&&!p.clone),state=view.presentation||{};
  this.mode=view.capture?'capture':override||(alive.length<=5?'broadcast':alive.length<=12?'normal':'performance');
  let screenX=w/2,screenY=h/2;
  if(this.mode==='capture'){
   const b=map.boundary,top=Math.min(126,h*.22),bottom=48,pad=24;
   this.x=this.y=0;this.zoom=Math.min((w-pad*2)/(b.maxX-b.minX),(h-top-bottom)/(b.maxY-b.minY));screenY=top+(h-top-bottom)/2;
   this.target={x:0,y:0,zoom:this.zoom};
  }else if(this.mode==='performance'){
   this.x=this.y=0;this.zoom=Math.min(w,h)/(map.worldRadius*2+180);this.target={x:0,y:0,zoom:this.zoom};
  }else{
   const auto=this.mode==='broadcast';let x=0,y=0,target=.4;
   if(alive.length){let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
    for(const p of alive){minX=Math.min(minX,p.x);maxX=Math.max(maxX,p.x);minY=Math.min(minY,p.y);maxY=Math.max(maxY,p.y);}
    x=(minX+maxX)/2;y=(minY+maxY)/2;const margin=auto?(alive.length<=2?230:290):400;
    target=Math.min(auto?(alive.length<=2?1.78:1.55):1.5,Math.max(.22,Math.min(w/(maxX-minX+margin),h/(maxY-minY+margin))));
   }
   if(focusPlayer&&alive.length){const p=alive.find(p=>p.humanControlled)||alive[0];x=p.x;y=p.y;target=1.12;}
   if(state.eventFocusFrames>0&&state.eventFocusPos&&!state.gameOver&&!auto){x=x*.72+state.eventFocusPos.x*.28;y=y*.72+state.eventFocusPos.y*.28;target=Math.min(1.58,target*1.08);}
   if(state.finalPhase&&!state.gameOver)target=Math.min(1.6,target*1.06);
   const frames=Math.max(0,Math.min(80,dt))*60/1000,ease=1-(1-(auto?.032:.05))**frames;this.x+=(x-this.x)*ease;this.y+=(y-this.y)*ease;
   if(state.gameOver)target=Math.min(1.5,target*1.5);this.zoom+=(target-this.zoom)*(1-(1-(auto?.022:.03))**frames);this.target={x,y,zoom:target};
  }
  return {x:this.x,y:this.y,zoom:this.zoom,screenX,screenY,mode:this.mode,target:this.target};
 }
}
