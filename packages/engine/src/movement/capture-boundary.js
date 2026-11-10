// Shared capture boundary: the four sides use ordinary rotated rectangle walls.
const zero={x:0,y:0};
export function captureContains(b,p,r=0){
 if(p.x<b.minX+r-1e-8||p.x>b.maxX-r+1e-8||p.y<b.minY+r-1e-8||p.y>b.maxY-r+1e-8)return false;
 for(const w of b.blocks||[]){const c=Math.SQRT1_2,s=Math.SQRT1_2,dx=p.x-w.x,dy=p.y-w.y,x=dx*c+dy*s,y=-dx*s+dy*c,ox=Math.max(0,Math.abs(x)-w.w/2),oy=Math.max(0,Math.abs(y)-w.h/2);if(ox===0&&oy===0||ox*ox+oy*oy<r*r-1e-8)return false;}
 return true;
}
export function captureClamp(b,p,r=0,kernel){
 const q={x:Math.max(b.minX+r,Math.min(b.maxX-r,p.x)),y:Math.max(b.minY+r,Math.min(b.maxY-r,p.y))};
 if(b.blocks?.length&&!captureContains(b,q,r)){const moved=kernel.combatMoveCircle(q,zero,r,b.blocks);q.x=Math.max(b.minX+r,Math.min(b.maxX-r,moved.x));q.y=Math.max(b.minY+r,Math.min(b.maxY-r,moved.y));}return q;
}
