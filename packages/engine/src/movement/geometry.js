// Extracted from v32.1. Room-scoped bindings; see docs/source-map.json.
export function install(__brScope){
__brScope.seedRandom = function seedRandom(s) {
            let h = 0x811c9dc5;
            for(let i=0; i<s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193);
            __brScope.seedState = h >>> 0;
        };

__brScope.rand = function rand() {
            let t = __brScope.seedState += 0x6D2B79F5;
            t = Math.imul(t ^ t >>> 15, t | 1);
            t ^= t + Math.imul(t ^ t >>> 7, t | 61);
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };

__brScope.randRange = function randRange(min, max) { return min + __brScope.rand() * (max - min); };

__brScope.Vec2 = class Vec2 {
            constructor(x, y) { this.x = x; this.y = y; }
            add(v) { return new Vec2(this.x+v.x, this.y+v.y); }
            sub(v) { return new Vec2(this.x-v.x, this.y-v.y); }
            mult(n) { return new Vec2(this.x*n, this.y*n); }
            mag() { return Math.sqrt(this.x*this.x + this.y*this.y); }
            norm() { let m = this.mag(); return m===0 ? new Vec2(0,0) : this.mult(1/m); }
            dist(v) { return Math.sqrt((this.x-v.x)**2 + (this.y-v.y)**2); }
            rotate(angle) {
                let cos = Math.cos(angle), sin = Math.sin(angle);
                return new Vec2(this.x*cos - this.y*sin, this.x*sin + this.y*cos);
            }
        };

__brScope.brNormalizeAimVector = function brNormalizeAimVector(x,y,fallbackX=1,fallbackY=0) {
            const ax=Number(x??0),ay=Number(y??0),length=Math.hypot(ax,ay);
            if(Number.isFinite(ax)&&Number.isFinite(ay)&&Number.isFinite(length)&&length>.000001)
                return new __brScope.Vec2(ax/length,ay/length);
            const fx=Number(fallbackX??1),fy=Number(fallbackY??0),fallbackLength=Math.hypot(fx,fy);
            if(Number.isFinite(fx)&&Number.isFinite(fy)&&Number.isFinite(fallbackLength)&&fallbackLength>.000001)
                return new __brScope.Vec2(fx/fallbackLength,fy/fallbackLength);
            return new __brScope.Vec2(1,0);
        };

__brScope.combatWallShape = function combatWallShape(w) {
            if(Array.isArray(w)) {
                const row=w;w=row._combatShape||(row._combatShape={});
                w.x=row[0];w.y=row[1];w.w=row[2];w.h=row[3];w.angle=Number(row[4]||0);
            }
            const angle=Number(w.angle||0);
            if(w._contactAngle!==angle){w._contactAngle=angle;w._contactCos=Math.cos(angle);w._contactSin=Math.sin(angle);}
            return w;
        };

__brScope.combatGridKey = function combatGridKey(x,y) { return x*65536+y; };

__brScope.combatWallGrid = function combatWallGrid(walls) {
            if(!walls||walls.length<9)return null;
            let cached=__brScope.combatWallGridCache.get(walls);
            if(cached&&cached.length===walls.length)return cached;
            // Once a classroom map's exact static index is built, every subsequent sweep can
            // reuse it directly instead of re-reading all wall spin flags first.
            for(const wall of walls)if(!Array.isArray(wall)&&Math.abs(Number(wall.spinSpeed||0))>1e-10)return null;
            const cellSize=420,grid=new Map();
            let largeTerrain;
            for(let index=0;index<walls.length;index++) {
                const wall=walls[index],w=__brScope.combatWallShape(wall),c=w._contactCos,s=w._contactSin;
                w._combatWallOrder=index;
                const ex=Math.abs(c)*w.w*.5+Math.abs(s)*w.h*.5,ey=Math.abs(s)*w.w*.5+Math.abs(c)*w.h*.5;
                const minX=Math.floor((w.x-ex)/cellSize),maxX=Math.floor((w.x+ex)/cellSize);
                const minY=Math.floor((w.y-ey)/cellSize),maxY=Math.floor((w.y+ey)/cellSize);
                // The four X sides span hundreds of cells. Keep their bounds
                // once and pass intersecting sides to the same exact sweep.
                if(w.terrain && (maxX-minX+1)*(maxY-minY+1)>64){
                    (largeTerrain??=[]).push({wall,minX:w.x-ex,maxX:w.x+ex,minY:w.y-ey,maxY:w.y+ey});
                    continue;
                }
                for(let x=minX;x<=maxX;x++)for(let y=minY;y<=maxY;y++) {
                    const key=__brScope.combatGridKey(x,y);let bucket=grid.get(key);
                    if(!bucket){bucket=[];grid.set(key,bucket);}bucket.push(wall);
                }
            }
            cached={length:walls.length,cellSize,grid,largeTerrain};__brScope.combatWallGridCache.set(walls,cached);return cached;
        };

__brScope.combatWallCandidates = function combatWallCandidates(walls,minX,minY,maxX,maxY,out=[]) {
            const indexed=__brScope.combatWallGrid(walls);if(!indexed)return walls;
            out.length=0;const cs=indexed.cellSize,seq=++__brScope.combatWallQuerySeq;
            if(indexed.largeTerrain)for(const entry of indexed.largeTerrain){
                if(maxX>=entry.minX && minX<=entry.maxX && maxY>=entry.minY && minY<=entry.maxY)out.push(entry.wall);
            }
            for(let x=Math.floor(minX/cs);x<=Math.floor(maxX/cs);x++)for(let y=Math.floor(minY/cs);y<=Math.floor(maxY/cs);y++) {
                const bucket=indexed.grid.get(__brScope.combatGridKey(x,y));if(!bucket)continue;
                for(const wall of bucket){const w=__brScope.combatWallShape(wall);if(w._combatWallQuery===seq)continue;w._combatWallQuery=seq;out.push(wall);}
            }
            if(out.length>1)out.sort((a,b)=>__brScope.combatWallShape(a)._combatWallOrder-__brScope.combatWallShape(b)._combatWallOrder);
            return out;
        };

__brScope.combatWallContact = function combatWallContact(x,y,r,wall) {
            const w=__brScope.combatWallShape(wall),c=w._contactCos,s=w._contactSin;
            const dx=x-w.x,dy=y-w.y,lx=dx*c+dy*s,ly=-dx*s+dy*c,hx=w.w/2,hy=w.h/2;
            const ox=lx-Math.max(-hx,Math.min(hx,lx)),oy=ly-Math.max(-hy,Math.min(hy,ly)),d=Math.hypot(ox,oy);
            if(d>=r)return null;
            let nx,ny,depth;
            if(d>1e-8){nx=ox/d;ny=oy/d;depth=r-d;}
            else if(hx-Math.abs(lx)<hy-Math.abs(ly)){nx=lx<0?-1:1;ny=0;depth=r+hx-Math.abs(lx);}
            else {nx=0;ny=ly<0?-1:1;depth=r+hy-Math.abs(ly);}
            return {nx:nx*c-ny*s,ny:nx*s+ny*c,depth,wall};
        };

__brScope.combatSegmentCircleTime = function combatSegmentCircleTime(x,y,dx,dy,r) {
            const c=x*x+y*y-r*r;if(c<=0)return 0;
            const a=dx*dx+dy*dy;if(a<1e-12)return null;
            const b=x*dx+y*dy,disc=b*b-a*c;if(b>=0||disc<0)return null;
            const t=(-b-Math.sqrt(disc))/a;return t>=0&&t<=1?t:null;
        };

__brScope.combatSegmentBoxTime = function combatSegmentBoxTime(x,y,dx,dy,hx,hy) {
            let enter=0,exit=1;
            // Scalar slab test: identical geometry without allocating two nested arrays on
            // every exact wall sweep (the hottest projectile-stress path).
            if(Math.abs(dx)<1e-12){if(Math.abs(x)>hx)return null;}
            else {
                const ax=(-hx-x)/dx,bx=(hx-x)/dx;
                enter=Math.max(enter,Math.min(ax,bx));exit=Math.min(exit,Math.max(ax,bx));
                if(enter>exit)return null;
            }
            if(Math.abs(dy)<1e-12){if(Math.abs(y)>hy)return null;}
            else {
                const ay=(-hy-y)/dy,by=(hy-y)/dy;
                enter=Math.max(enter,Math.min(ay,by));exit=Math.min(exit,Math.max(ay,by));
                if(enter>exit)return null;
            }
            return enter;
        };

__brScope.combatTraceWalls = function combatTraceWalls(from,to,r,walls,scratch=[]) {
            let best=__brScope.brCaptureMode()?__brScope.brCaptureBoundaryHit(from,to,r):null;const vx=to.x-from.x,vy=to.y-from.y;
            const candidates=__brScope.combatWallCandidates(walls,Math.min(from.x,to.x)-r,Math.min(from.y,to.y)-r,Math.max(from.x,to.x)+r,Math.max(from.y,to.y)+r,scratch);
            for(const wall of candidates) {
                const w=__brScope.combatWallShape(wall),c=w._contactCos,s=w._contactSin,hx=w.w/2,hy=w.h/2;
                const x=(from.x-w.x)*c+(from.y-w.y)*s,y=-(from.x-w.x)*s+(from.y-w.y)*c,dx=vx*c+vy*s,dy=-vx*s+vy*c;
                if(Math.min(x,x+dx)>hx+r||Math.max(x,x+dx)<-hx-r||Math.min(y,y+dy)>hy+r||Math.max(y,y+dy)<-hy-r)continue;
                let t=null;
                const include=v=>{if(v!==null&&(t===null||v<t))t=v;};
                include(__brScope.combatSegmentBoxTime(x,y,dx,dy,hx+r,hy));include(__brScope.combatSegmentBoxTime(x,y,dx,dy,hx,hy+r));
                for(const sx of [-1,1])for(const sy of [-1,1])include(__brScope.combatSegmentCircleTime(x-sx*hx,y-sy*hy,dx,dy,r));
                if(t===null||(best&&t>=best.t))continue;
                const hit=__brScope.combatWallContact(from.x+vx*t,from.y+vy*t,r+.001,wall);
                if(!hit)continue;
                if(t<1e-8&&vx*hit.nx+vy*hit.ny>=-1e-8)continue;
                best={...hit,t};
            }
            return best;
        };

__brScope.combatMoveCircle = function combatMoveCircle(pos,vel,r,walls,stopOnWall=false,reuse=null) {
            const out=reuse||{x:0,y:0,vx:0,vy:0,hit:null,_wallCandidates:[]};
            out.x=pos.x;out.y=pos.y;out.vx=vel.x;out.vy=vel.y;out.hit=null;
            const wallCandidates=out._wallCandidates||(out._wallCandidates=[]);
            const traceEnd=out._traceEnd||(out._traceEnd={x:0,y:0});
            // Resolve full penetration (including a centre inside cover), then slide along contact normals.
            for(let pass=0;pass<4;pass++) {
                let changed=false;
                const candidates=__brScope.combatWallCandidates(walls,out.x-r,out.y-r,out.x+r,out.y+r,wallCandidates);
                for(const w of candidates){const h=__brScope.combatWallContact(out.x,out.y,r,w);if(!h)continue;
                    out.x+=h.nx*(h.depth+.001);out.y+=h.ny*(h.depth+.001);out.hit=h;changed=true;
                    const vn=out.vx*h.nx+out.vy*h.ny;if(vn<0){out.vx-=h.nx*vn;out.vy-=h.ny*vn;}}
                if(!changed)break;
            }
            let dx=out.vx,dy=out.vy;
            for(let pass=0;pass<4&&Math.hypot(dx,dy)>1e-7;pass++) {
                traceEnd.x=out.x+dx;traceEnd.y=out.y+dy;
                const h=__brScope.combatTraceWalls(out,traceEnd,r,walls,wallCandidates);
                if(!h){out.x+=dx;out.y+=dy;break;}
                out.hit=h;out.x+=dx*h.t+h.nx*.001;out.y+=dy*h.t+h.ny*.001;
                if(stopOnWall){out.vx=0;out.vy=0;break;}
                dx*=1-h.t;dy*=1-h.t;
                const vn=out.vx*h.nx+out.vy*h.ny;if(vn<0){out.vx-=h.nx*vn;out.vy-=h.ny*vn;}
                const dn=dx*h.nx+dy*h.ny;if(dn<0){dx-=h.nx*dn;dy-=h.ny*dn;}
            }
            return out;
        };
}
export const initializers=[
[72,__brScope=>{ __brScope.seedState = 1;;}],
[79,__brScope=>{ __brScope.combatWallGridCache = new WeakMap();;}],
[80,__brScope=>{ __brScope.combatWallQuerySeq = 0;;}]
];
