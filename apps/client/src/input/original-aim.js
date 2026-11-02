// Generated from v32.1 by tools/baseline/aim.mjs. Presentation intent only.
export function installAim(scope){
scope.brResolveAimHelp = function brResolveAimHelp(kind,raw,power=1,tap=false,force=false) {
            const dir=scope.brNormalizeAimVector(raw.x,raw.y),out={x:dir.x,y:dir.y,rawX:dir.x,rawY:dir.y,assist:null};
            if(scope.BRMP.aimHelpEnabled===false)return out;
            const c=scope.brAimHelpContext(kind,power);if(!c||c.profile.name==='none'||scope.brReworkClientState(c.self)?.channel)return out;
            const cfg=c.profile,angle=Math.atan2(dir.y,dir.x),isTap=kind==='attack'&&tap,cone=(isTap?cfg.tap:cfg.cone)*Math.PI/180;
            const candidates=scope.brAimHelpCandidates(c,force).map(e=>scope.brAimHelpTarget(c,e)).filter(Boolean);
            // An intended crate/body already intersecting the manual ray always wins.
            if(candidates.some(t=>scope.brAimHelpContact(c,t,angle)!==null&&scope.brAimHelpClear(c,t,angle)))return out;
            let best=null;const held=scope.BRMP.aimHelpHeld?.[kind];
            for(const t of candidates){const delta=scope.brAimHelpAngle(t.angle,angle),error=Math.abs(delta);if(error>cone||!scope.brAimHelpClear(c,t))continue;
                if(!isTap&&cfg.slow&&Math.abs(t.vx*-Math.sin(angle)+t.vy*Math.cos(angle))>.8)continue;
                const score=error+(t.distance/Math.max(1,cfg.range))*.015-(held?.id===t.id&&c.now-held.at<140?.012:0);
                if(!best||score<best.score||score===best.score&&t.id<best.t.id)best={t,delta,error,score};
            }
            if(!best){if(scope.BRMP.aimHelpHeld)delete scope.BRMP.aimHelpHeld[kind];return out;}
            const t=best.t,edge=t.box?Math.asin(Math.min(.99,t.r/Math.max(1,t.distance))):Math.asin(Math.min(.99,(t.r+cfg.width)/Math.max(1,t.distance)));
            const need=Math.max(0,best.error-edge+.005),turn=isTap?best.delta:Math.sign(best.delta)*Math.min(cfg.max*Math.PI/180,need*cfg.gain);
            if(Math.abs(turn)<.0001)return out;
            const proposed=angle+turn;if(!scope.brAimHelpClear(c,t,proposed))return out;
            out.x=Math.cos(proposed);out.y=Math.sin(proposed);out.assist={mode:isTap?'tap':'drag',id:t.id,life:t.life};
            (scope.BRMP.aimHelpHeld||(scope.BRMP.aimHelpHeld={}))[kind]={id:t.id,at:c.now};return out;
        };
scope.brAimHelpContact = function brAimHelpContact(c,t,angle) {
            const dir={x:Math.cos(angle),y:Math.sin(angle)},end={x:c.origin.x+dir.x*c.profile.range,y:c.origin.y+dir.y*c.profile.range},spec=c.profile.spec;
            if(c.profile.basic.close&&c.profile.kind==='attack'){
                if(t.box)return scope.brCrateSectorTouches(t.box,c.origin,dir,c.profile.range,spec.halfAngle||1.2)?Math.max(0,(t.distance-t.r)/Math.max(1,c.profile.range)):null;
                return scope.brSectorTouches(c.origin,{pos:{x:t.x,y:t.y},radius:t.r},dir,c.profile.range,spec.halfAngle||1.2,1)?Math.max(0,(t.distance-t.r)/Math.max(1,c.profile.range)):null;
            }
            if(t.box)return scope.brCrateSweepTime(t.box,c.origin,end,c.profile.width);
            return scope.combatSegmentCircleTime(c.origin.x-t.x,c.origin.y-t.y,end.x-c.origin.x,end.y-c.origin.y,t.r+c.profile.width);
        };
scope.brAimHelpClear = function brAimHelpClear(c,t,angle=t.angle) {
            const length=Math.min(c.profile.range,t.distance),dir={x:Math.cos(angle),y:Math.sin(angle)},to={x:c.origin.x+dir.x*length,y:c.origin.y+dir.y*length};
            const wall=scope.combatTraceWalls(c.origin,to,c.profile.basic.close&&c.profile.kind==='attack'?0:c.profile.width,c.walls);
            const hit=scope.brAimHelpContact(c,t,angle),limit=hit===null?Math.max(0,(t.distance-t.r)/Math.max(1,length)):Math.min(1,hit*c.profile.range/Math.max(1,length));
            if(wall&&wall.t<limit-.001)return false;
            for(const b of c.boxes){if((c.host?b.hp:b[3])<=0||b===t.box)continue;const time=scope.brCrateSweepTime(b,c.origin,to,c.profile.width);if(time!==null&&time<limit-.001)return false;}
            return true;
        };
scope.brCrateSweepTime = function brCrateSweepTime(box,from,to,radius=0) {
            if(!Number.isFinite(radius)||radius<0)return null;
            const h=scope.brCrateHalf(box),x=from.x-scope.brCrateX(box),y=from.y-scope.brCrateY(box),dx=to.x-from.x,dy=to.y-from.y;
            // Square Minkowski-summed with the projectile/dash circle. Merely enlarging
            // an AABB would falsely hit the four outside corner squares.
            let hit=scope.combatSegmentBoxTime(x,y,dx,dy,h+radius,h);
            const include=t=>{if(t!==null&&(hit===null||t<hit))hit=t;};
            include(scope.combatSegmentBoxTime(x,y,dx,dy,h,h+radius));
            if(radius>0)for(let sx=-1;sx<=1;sx+=2)for(let sy=-1;sy<=1;sy+=2)
                include(scope.combatSegmentCircleTime(x-sx*h,y-sy*h,dx,dy,radius));
            return hit;
        };
scope.brCrateSectorTouches = function brCrateSectorTouches(box,origin,aim,range,halfAngle) {
            if(!Number.isFinite(range)||range<=0||!Number.isFinite(halfAngle))return false;
            const h=scope.brCrateHalf(box),x=scope.brCrateX(box)-origin.x,y=scope.brCrateY(box)-origin.y;
            if(Math.max(0,Math.abs(x)-h)**2+Math.max(0,Math.abs(y)-h)**2>range*range+1e-8)return false;
            const a=scope.brNormalizeAimVector(aim.x,aim.y),half=Math.max(0,Math.min(Math.PI,halfAngle)),cos=Math.cos(half),eps=1e-8;
            const inAngle=(px,py)=>{const d=Math.hypot(px,py);return d<=eps||(px*a.x+py*a.y)>=d*cos-eps;};
            const minX=x-h,maxX=x+h,minY=y-h,maxY=y+h,r2=range*range;
            if(minX<=0&&maxX>=0&&minY<=0&&maxY>=0)return true;
            // Corners inside the sector; radial edges through the square; circular arc
            // against square sides. This also covers arc-only intersections and tangency.
            for(let sx=-1;sx<=1;sx+=2)for(let sy=-1;sy<=1;sy+=2){const px=x+sx*h,py=y+sy*h;if(px*px+py*py<=r2+eps&&inAngle(px,py))return true;}
            for(let s=-1;s<=1;s+=2){const c=Math.cos(s*half),sn=Math.sin(s*half),vx=(a.x*c-a.y*sn)*range,vy=(a.x*sn+a.y*c)*range;
                if(scope.combatSegmentBoxTime(-x,-y,vx,vy,h,h)!==null)return true;}
            for(let s=-1;s<=1;s+=2){
                const px=x+s*h,yy=r2-px*px;
                if(yy>=-eps){const q=Math.sqrt(Math.max(0,yy));for(let t=-1;t<=1;t+=2){const py=t*q;if(py>=minY-eps&&py<=maxY+eps&&inAngle(px,py))return true;}}
                const py=y+s*h,xx=r2-py*py;
                if(xx>=-eps){const q=Math.sqrt(Math.max(0,xx));for(let t=-1;t<=1;t+=2){const px=t*q;if(px>=minX-eps&&px<=maxX+eps&&inAngle(px,py))return true;}}
            }
            return false;
        };
scope.brSectorTouches = function brSectorTouches(origin,target,aim,range,halfAngle,radiusScale=1) {
            const dx=target.pos.x-origin.x,dy=target.pos.y-origin.y,d2=dx*dx+dy*dy;
            const r=Math.max(0,Number(target.radius||0)*radiusScale),reach=range+r;
            if(d2>reach*reach)return false;
            if(d2<=r*r)return true;
            const dist=Math.sqrt(d2),dot=(dx*aim.x+dy*aim.y)/dist;
            if(dot>=Math.cos(halfAngle))return true;
            const side=dx*aim.y-dy*aim.x,angle=side>0?-halfAngle:halfAngle,c=Math.cos(angle),s=Math.sin(angle);
            const ex=aim.x*c-aim.y*s,ey=aim.x*s+aim.y*c,t=Math.max(0,Math.min(range,dx*ex+dy*ey));
            return (dx-ex*t)**2+(dy-ey*t)**2<=r*r;
        };
scope.brCrateHalf = function brCrateHalf(box) {
            const h=Number(Array.isArray(box)?box[5]:box?.halfSize);
            return Number.isFinite(h)&&h>0?h:scope.BR_CRATE_HALF;
        };
scope.brCrateX = function brCrateX(box){return Number(Array.isArray(box)?box[1]:box.pos.x);};
scope.brCrateY = function brCrateY(box){return Number(Array.isArray(box)?box[2]:box.pos.y);};
scope.brAimHelpAngle = function brAimHelpAngle(a,b){return Math.atan2(Math.sin(a-b),Math.cos(a-b));};
scope.brTrainPower = function brTrainPower(distance,scale=1){return .18+.82*Math.max(0,Math.min(1,(distance-80)/(1480*scale-80)));};
}
