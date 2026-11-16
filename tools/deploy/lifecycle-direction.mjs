// Choose a short open keyboard path from already-public geometry. This is a
// smoke-test intention, not client prediction or a weaker movement assertion.
const axes={a:{x:-1,y:0},d:{x:1,y:0},w:{x:0,y:-1},s:{x:0,y:1}},opposite={a:'d',d:'a',w:'s',s:'w'};
export function movementDirection(self,scene={}){
 const horizontal=self.x>0?'a':'d',vertical=self.y>0?'w':'s';
 const first=Math.abs(self.x)>Math.abs(self.y)?horizontal:vertical,second=first===horizontal?vertical:horizontal;
 const radius=self.radius||32,angles=new Map(scene.movingWalls||[]);
 const walls=(scene.static?.walls||[]).map((w,i)=>({...w,angle:angles.get(i)??w.angle})).concat(scene.dynamicWalls?.walls||[],(scene.farm?.b||[]).filter(b=>b[3]>0).map(b=>({x:b[1],y:b[2],w:b[5]*2,h:b[5]*2})));
 const blocked=(x,y)=>{
  const map=scene.static,r=map?.worldRadius,c=map?.center||{x:0,y:0};if(r&&Math.hypot(x-c.x,y-c.y)>r-radius)return true;
  if(walls.some(w=>{const a=w.angle||0,dx=x-w.x,dy=y-w.y,lx=dx*Math.cos(a)+dy*Math.sin(a),ly=-dx*Math.sin(a)+dy*Math.cos(a);return Math.hypot(Math.max(0,Math.abs(lx)-w.w/2),Math.max(0,Math.abs(ly)-w.h/2))<radius+.5;}))return true;
  return (scene.actors||[]).some(a=>a.id!==self.id&&a.alive&&Math.hypot(x-a.x,y-a.y)<radius+(a.radius||32)+.5);
 };
 for(const key of [first,second,opposite[second],opposite[first]]){
  const d=axes[key];let clear=true;for(let n=2;n<=40;n+=2)if(blocked(self.x+d.x*n,self.y+d.y*n)){clear=false;break;}
  if(clear)return {key,preferred:first,openPath:true};
 }
 // Missing geometry or no clear cardinal path never turns the test into PASS.
 // The original distance>12, identity and 8s authority wait remain mandatory.
 return {key:first,preferred:first,openPath:false};
}
