// One current map and one viewport-sized grid, never a full-map render texture.
// Coordinates and line widths remain in world units; the existing world/canvas
// transform applies camera motion and zoom without rebuilding the geometry.
export class StaticFloor {
 constructor(){this.stats={floorBuilds:0,gridBuilds:0,outlineBuilds:0};this.reset();}
 reset(){this.floorKey=this.gridKey=this.outlineKey=null;this.floorPath=this.verticalPath=this.horizontalPath=this.outlinePath=null;}
 floor(renderer,map,teacher){
  const b=map.boundary,color=b?(teacher?'#142437':'#17233a'):(teacher?'#1e293b':'#17233a');
  if(!renderer.pixi){const p=renderer.paint.brCombatPainter(renderer.ctx,false);if(b)p.rect(b.minX,b.minY,b.maxX-b.minX,b.maxY-b.minY,color,1);else p.circle(0,0,map.worldRadius,color,1);return;}
  const key=b?['rect',b.minX,b.minY,b.maxX,b.maxY,color].join(':'):['circle',map.worldRadius,color].join(':');
  if(this.floorKey!==key){
   this.floorKey=key;this.stats.floorBuilds++;
   if(renderer.pixi){const p=renderer.paint.brCombatPainter(renderer.base,true);renderer.base.clear();if(b)p.rect(b.minX,b.minY,b.maxX-b.minX,b.maxY-b.minY,color,1);else p.circle(0,0,map.worldRadius,color,1);}
  }
 }
 grid(renderer,cam,w,h,zoom,spacing,visible=true){
  if(renderer.pixi)renderer.grid.visible=visible;
  if(!visible)return;
  // Extra 220 world units matches the old view padding; round outward to cells.
  // Subpixel movement changes only the existing camera transform.
  const halfW=w/zoom/2+220,halfH=h/zoom/2+220;
  const left=Math.floor((cam.x-halfW)/spacing)*spacing,right=Math.ceil((cam.x+halfW)/spacing)*spacing;
  const top=Math.floor((cam.y-halfH)/spacing)*spacing,bottom=Math.ceil((cam.y+halfH)/spacing)*spacing;
  if(!renderer.pixi){const p=renderer.paint.brCombatPainter(renderer.ctx,false);for(let x=Math.floor((cam.x-halfW)/spacing)*spacing;x<cam.x+halfW;x+=spacing)p.line(x,cam.y-halfH,x,cam.y+halfH,'#6b8bb8',.15,1);for(let y=Math.floor((cam.y-halfH)/spacing)*spacing;y<cam.y+halfH;y+=spacing)p.line(cam.x-halfW,y,cam.x+halfW,y,'#6b8bb8',.15,1);return;}
  const key=[left,right,top,bottom,spacing].join(':');
  if(this.gridKey!==key){
   this.gridKey=key;this.stats.gridBuilds++;
   if(renderer.pixi){const p=renderer.paint.brCombatPainter(renderer.grid,true);renderer.grid.clear();for(let x=left;x<right;x+=spacing)p.line(x,top,x,bottom,'#6b8bb8',.15,1);for(let y=top;y<bottom;y+=spacing)p.line(left,y,right,y,'#6b8bb8',.15,1);}
  }
 }
 outline(renderer,map,visible){
  if(renderer.pixi)renderer.mapOutline.visible=visible;
  if(!visible)return;
  const b=map.boundary,key=[b.minX,b.minY,b.maxX,b.maxY].join(':');
  if(!renderer.pixi){renderer.paint.brCombatPainter(renderer.ctx,false).rect(b.minX,b.minY,b.maxX-b.minX,b.maxY-b.minY,'#b1c3d2',1,12);return;}
  if(this.outlineKey!==key){this.outlineKey=key;this.stats.outlineBuilds++;
   if(renderer.pixi){renderer.mapOutline.clear();renderer.paint.brCombatPainter(renderer.mapOutline,true).rect(b.minX,b.minY,b.maxX-b.minX,b.maxY-b.minY,'#b1c3d2',.7,12);}
  }
 }
}
