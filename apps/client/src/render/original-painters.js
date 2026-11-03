// Original v32.1 Canvas/Pixi painter implementation; no combat execution.
export function createPainters(session){const __visualScope={BRMP:session,game:null,brPlaySfx:()=>{}};
__visualScope.brTeamKillColor = function brTeamKillColor(team){return __visualScope.BR_TEAM_KILL_COLORS[Number(team)]||__visualScope.BR_TEAM_KILL_COLORS[0];};

__visualScope.brCombatPainter = function brCombatPainter(target,pixi) {
            const cached=target._brCombatPainter;if(cached)return cached;
            function style(color,alpha,width){return {color:color||'#ffffff',alpha:Math.max(0,Math.min(1,alpha)),width,cap:'butt',join:'round'};}
            const painter={pixi:!!pixi,
                rect(x,y,w,h,color,alpha,width=0){
                    if(pixi){target.rect(x,y,w,h);width?target.stroke(style(color,alpha,width)):target.fill({color,alpha});return;}
                    target.save();target.globalAlpha=alpha;
                    if(width){target.strokeStyle=color;target.lineWidth=width;target.strokeRect(x,y,w,h);}
                    else{target.fillStyle=color;target.fillRect(x,y,w,h);}target.restore();
                },
                line(x,y,ex,ey,color,alpha,width,cap='butt'){
                    if(pixi){target.moveTo(x,y).lineTo(ex,ey).stroke({...style(color,alpha,width),cap});return;}
                    target.save();target.globalAlpha=alpha;target.strokeStyle=color;target.lineWidth=width;target.lineCap=cap;
                    target.beginPath();target.moveTo(x,y);target.lineTo(ex,ey);target.stroke();target.restore();
                },
                circle(x,y,r,color,alpha,width=0){
                    if(!(r>0))return;
                    if(pixi){target.circle(x,y,r);width?target.stroke(style(color,alpha,width)):target.fill({color,alpha});return;}
                    target.save();target.globalAlpha=alpha;target.beginPath();target.arc(x,y,r,0,Math.PI*2);
                    if(width){target.strokeStyle=color;target.lineWidth=width;target.stroke();}else{target.fillStyle=color;target.fill();}target.restore();
                },
                sector(x,y,r,angle,half,color,alpha,width=0){
                    if(!(r>0))return;
                    if(pixi){target.moveTo(x,y).arc(x,y,r,angle-half,angle+half).closePath();width?target.stroke(style(color,alpha,width)):target.fill({color,alpha});return;}
                    target.save();target.globalAlpha=alpha;target.beginPath();target.moveTo(x,y);target.arc(x,y,r,angle-half,angle+half);target.closePath();
                    if(width){target.strokeStyle=color;target.lineWidth=width;target.stroke();}else{target.fillStyle=color;target.fill();}target.restore();
                },
                arc(x,y,r,a,b,color,alpha,width){
                    if(!(r>0))return;
                    if(pixi){target.moveTo(x+Math.cos(a)*r,y+Math.sin(a)*r).arc(x,y,r,a,b).stroke(style(color,alpha,width));return;}
                    target.save();target.globalAlpha=alpha;target.strokeStyle=color;target.lineWidth=width;target.beginPath();target.arc(x,y,r,a,b);target.stroke();target.restore();
                },
                polygon(points,color,alpha,width=0){
                    if(!points?.length)return;
                    if(pixi){target.moveTo(points[0][0],points[0][1]);for(let i=1;i<points.length;i++)target.lineTo(points[i][0],points[i][1]);target.closePath();width?target.stroke(style(color,alpha,width)):target.fill({color,alpha});return;}
                    target.save();target.globalAlpha=alpha;target.beginPath();target.moveTo(points[0][0],points[0][1]);for(let i=1;i<points.length;i++)target.lineTo(points[i][0],points[i][1]);target.closePath();
                    if(width){target.strokeStyle=color;target.lineWidth=width;target.stroke();}else{target.fillStyle=color;target.fill();}target.restore();
                },
                ellipse(x,y,rx,ry,color,alpha,width=0){
                    if(pixi){target.ellipse(x,y,rx,ry);width?target.stroke(style(color,alpha,width)):target.fill({color,alpha});return;}
                    target.save();target.globalAlpha=alpha;target.beginPath();target.ellipse(x,y,rx,ry,0,0,Math.PI*2);
                    if(width){target.strokeStyle=color;target.lineWidth=width;target.stroke();}else{target.fillStyle=color;target.fill();}target.restore();
                },
                dashedCircle(x,y,r,color,alpha,width){
                    // A fixed 24 segments, not a particle system or a per-pixel dash loop.
                    for(let i=0;i<24;i++){const a=i*Math.PI/12;painter.arc(x,y,r,a,a+Math.PI/20,color,alpha,width);}
                }
            };
            target._brCombatPainter=painter;return painter;
        };

__visualScope.brValidRunLevel = function brValidRunLevel(value){return Number.isInteger(value)&&value>=1&&value<=__visualScope.BR_RUN_MAX_LEVEL?value:0;};

__visualScope.brLevelCanvas = function brLevelCanvas(level){
            if(!__visualScope.brValidRunLevel(level))return null;
            const glow=__visualScope.brGraphicsProfile().id!=='low'&&__visualScope.brGraphicsProfile().glow>0,key=level+'|'+Number(glow);let c=__visualScope.BR_LEVEL_TEXTURES.get(key);if(c)return c;
            const size=[0,12,12,13,14,15,16][level],weight=[0,700,700,800,900,900,900][level];c=document.createElement('canvas');c.width=128;c.height=52;c._levelW=64;c._levelH=26;c._levelSize=size;
            const q=c.getContext('2d');q.scale(2,2);q.font=weight+' '+size+'px sans-serif';q.textAlign='center';q.textBaseline='middle';q.lineJoin='round';q.lineWidth=3;
            q.strokeStyle=level===6?'#9a4b08':'#07111f';if(glow&&level>=5){q.shadowColor='#fbbf24';q.shadowBlur=3;}q.strokeText('LV.'+level,32,13);q.shadowBlur=0;
            q.fillStyle=['','#b8c3d3','#fff8e7','#67e8f9','#c4b5fd','#facc15','#fff4ce'][level];
            if(level===6){const grad=q.createLinearGradient(0,5,0,21);grad.addColorStop(0,'#ffffff');grad.addColorStop(1,'#fbbf24');q.fillStyle=grad;}
            q.fillText('LV.'+level,32,13);__visualScope.BR_LEVEL_TEXTURES.set(key,c);return c;
        };

__visualScope.brLevelPose = function brLevelPose(track,level,life,now=performance.now(),visible=true){
            const low=__visualScope.brGraphicsProfile().glow<=0,quiet=low||!!__visualScope.BRMP?.reducedMotion,old=track._levelVisual;
            if(!visible||!__visualScope.brValidRunLevel(level)){track._levelVisual=null;return null;}
            const continuous=old&&old.life===life&&now-old.seen<250;
            let pulse=continuous?old.pulse:0;if(continuous&&level>old.level&&!quiet)pulse=now;
            const v=old||{};v.level=level;v.life=life;v.seen=now;v.pulse=pulse;track._levelVisual=v;
            const t=pulse?(now-pulse)/180:2;v.scale=!quiet&&t>=0&&t<1?1+.10*Math.sin(t*Math.PI):1;
            v.alpha=!quiet&&level===6?.94+.06*Math.sin(now*Math.PI*2/2500):1;return v;
        };

__visualScope.brLevelCanvasDraw = function brLevelCanvasDraw(ctx,track,level,life,x,y,zoom=1,compact=false,visible=true){
            const pose=__visualScope.brLevelPose(track,level,life,performance.now(),visible);if(!pose)return;const c=__visualScope.brLevelCanvas(level),size=compact?([0,10,10,11,11,12,13][level]/c._levelSize):1,k=size*pose.scale/Math.max(.05,zoom),w=c._levelW*k,h=c._levelH*k;ctx.save();ctx.globalAlpha*=pose.alpha;ctx.drawImage(c,x-w/2,y-h/2,w,h);ctx.restore();
        };

__visualScope.brPaintReworkStatus = function brPaintReworkStatus(p,x,y,r,zoom,state,frame,maxHp=1) {
            if(!state)return;zoom=Math.max(.05,zoom);
            if(state.stunEnd>frame){
                const ry=3.6/zoom,rx=12/zoom,cy=y-r-6/zoom;
                p.ellipse(x,cy,rx,ry,'#fef08a',.78,1.2/zoom);
                for(let i=0;i<3;i++){const a=frame*.12+i*Math.PI*2/3;p.circle(x+Math.cos(a)*rx,cy+Math.sin(a)*ry,2.1/zoom,'#fde047',1);}
            }
            if(state.shield>0){const w=Math.max(r*1.65,48/zoom),h=3/zoom,by=y+r+26/zoom;
                p.rect(x-w/2,by,w,h,'#0c3045',.96);p.rect(x-w/2,by,w*Math.min(1,state.shield/Math.max(1,maxHp*.6)),h,'#67e8f9',1);
                p.line(x-w/2,by-1/zoom,x-w/2,by+5/zoom,'#cffafe',1,1.3/zoom);
            }
            let ix=x+r+7/zoom,iy=y-r*.35;
            if(state.bleed>0){p.circle(ix,iy,4/zoom,'#f43f5e',1);p.line(ix,iy-7/zoom,ix,iy-2/zoom,'#fecdd3',1,2/zoom);iy+=12/zoom;}
            if(state.mark>0){p.circle(ix,iy,5/zoom,'#fbbf24',.9,1.5/zoom);p.line(ix-7/zoom,iy,ix+7/zoom,iy,'#fde68a',1,1/zoom);iy+=12/zoom;}
            if(state.slow<.99){p.line(x-8/zoom,y+r+8/zoom,x+8/zoom,y+r+8/zoom,'#93c5fd',.8,2/zoom);}
            const buffs=Array.isArray(state.buffs)?state.buffs.filter(b=>b.end>frame):[],has=kind=>buffs.some(b=>b.kind===kind);
            if(has('damageReduction'))p.arc(x,y,r*1.12,-Math.PI*.75,Math.PI*.75,'#94a3b8',.8,2/zoom);
            if(has('basicHaste')||has('teamBasicHaste')||has('teamSkillHaste'))p.arc(x,y,r*.90,-Math.PI*.8,-Math.PI*.2,'#fde68a',.78,1.6/zoom);
            if(has('counterImmediate')||has('counterDeferred'))p.arc(x,y,r*1.05,-Math.PI*.45,Math.PI*.45,'#cbd5e1',.85,2/zoom);
            if(has('regen')){p.line(x-r*.35,y-r*.15,x+r*.35,y-r*.15,'#86efac',.85,3/zoom);p.line(x,y-r*.5,x,y+r*.2,'#86efac',.85,3/zoom);}
        };

__visualScope.brBulletForm = function brBulletForm(style){return /homing/.test(style)?'diamond':/boomerang/.test(style)?'disc':/sniper|pierce|heavy/.test(style)?'capsule':'circle';};

__visualScope.brBulletCanvas = function brBulletCanvas(style,color='#ffffff'){
            const form=__visualScope.brBulletForm(style),key=form+'|'+color;let image=__visualScope.brBulletSources.get(key);if(image)return image;
            image=document.createElement('canvas');image.width=image.height=64;const c=image.getContext('2d');c.translate(32,32);c.fillStyle=color;c.strokeStyle='#f8fafc';c.lineWidth=2;
            c.beginPath();if(form==='diamond'){c.moveTo(30,0);c.lineTo(0,30);c.lineTo(-30,0);c.lineTo(0,-30);c.closePath();}
            else if(form==='capsule'){c.moveTo(-18,-12);c.lineTo(18,-12);c.arc(18,0,12,-Math.PI/2,Math.PI/2);c.lineTo(-18,12);c.arc(-18,0,12,Math.PI/2,Math.PI*1.5);}
            else c.arc(0,0,30,0,Math.PI*2);
            c.fill();c.stroke();if(form==='disc'){c.beginPath();c.arc(0,0,17,0,Math.PI*1.55);c.strokeStyle='#0f172a';c.lineWidth=5;c.stroke();}
            __visualScope.brBulletSources.set(key,image);return image;
        };

__visualScope.brPaintReworkEntities = function brPaintReworkEntities(p,entities,frame,zoom=1,glyph=null) {
            zoom=Math.max(.05,zoom);const stroke=Math.max(1,1.5/zoom);
            for(const e of entities||[]){
                if(!e||(e.displayFrame??frame)>e.end+1)continue;
                const x=e.x,y=e.y,col=e.color||'#a5b4fc',kind=String(e.kind||''),dx=Number(e.dx||0),dy=Number(e.dy||0),length=Number(e.length||e.range||0),width=Number(e.width||0),r=Math.max(1,Number(e.radius||12));
                const ex=Number.isFinite(e.endX)?e.endX:x+dx*length,ey=Number.isFinite(e.endY)?e.endY:y+dy*length;
                const age=Math.max(0,(e.displayFrame??frame)-e.start),span=Math.max(1,e.end-e.start),progress=Math.min(1,age/span);
                if(kind==='transit'){const alpha=Math.max(0,1-progress);p.line(x,y,ex,ey,col,.72*alpha,Math.max(stroke,width));p.circle(ex,ey,Math.max(stroke*1.2,2/zoom),col,.50*alpha);
                } else if(kind==='channel'||kind==='beam'){
                    const half=width*.5,nx=-dy*half,ny=dx*half,points=[[x+nx,y+ny],[ex+nx,ey+ny],[ex-nx,ey-ny],[x-nx,y-ny]];
                    p.polygon(points,col,.34);p.polygon(points,col,.94,stroke*1.15);p.line(x,y,ex,ey,'#ede9fe',.82,Math.max(stroke,width*.16));
                } else if(kind==='marker'||kind==='warning'||kind==='telegraph') {
                    if(e.shape==='rect'||e.shape==='line'){
                        const half=width*.5,nx=-dy*half,ny=dx*half,points=[[x+nx,y+ny],[ex+nx,ey+ny],[ex-nx,ey-ny],[x-nx,y-ny]];
                        p.polygon(points,col,.10);p.polygon(points,col,.85,stroke);
                        p.line(x,y,ex,ey,col,.30,stroke);
                    }else {p.circle(x,y,r,col,.08);p.dashedCircle(x,y,r,col,.90,stroke);p.arc(x,y,r*.92,-Math.PI/2,-Math.PI/2+Math.PI*2*progress,col,.70,stroke);}
                } else if(kind==='turret'){
                    const team=e.team>0?__visualScope.brTeamKillColor(e.team):col;
                    p.circle(x,y,r,'#172033',1);p.circle(x,y,r,team,1,stroke*1.4);
                    p.line(x,y,x+dx*r*1.2,y+dy*r*1.2,e.nextHeavy===1?'#fbbf24':'#cbd5e1',1,Math.max(4,r*.20));
                    const bw=Math.max(r*1.7,35/zoom),hp=Math.max(0,Math.min(1,Number(e.hp)/Math.max(1,e.maxHp)));
                    p.rect(x-bw/2,y+r+5/zoom,bw,4/zoom,'#4b1620',1);p.rect(x-bw/2,y+r+5/zoom,bw*hp,4/zoom,'#4ade80',1);
                    p.arc(x,y,r+5/zoom,-Math.PI/2,-Math.PI/2+Math.PI*2*(1-progress),team,.7,1.5/zoom);
                } else if(kind==='capture'||kind==='tether') {
                    p.line(Number.isFinite(e.fx)?e.fx:x,Number.isFinite(e.fy)?e.fy:y,x,y,col,.85,Math.max(2/zoom,width||2));p.circle(x,y,r,col,.65,stroke);
                } else if(kind==='lob'){
                    p.ellipse(x,y,Math.max(10,r*.5),Math.max(4,r*.16),'#020617',.35);
                    const lift=Math.max(0,Number(e.height||0));p.line(x,y,x,y-lift,col,.25,stroke);p.circle(x,y-lift,Math.max(9/zoom,Math.min(23,r*.16)),col,.65);
                    if(glyph&&e.emoji)glyph(e.emoji,x,y-lift,r*2.66,e.id);
                } else if(kind==='projectile'||kind==='hook'||kind==='boomerang'||kind==='bomb'){
                    const tail=Math.max(r*1.3,Math.min(90,Number(e.speed||14)*2));
                    p.line(x-dx*tail,y-dy*tail,x,y,col,.46,Math.max(stroke,r*.35));
                    if(kind==='hook'){p.arc(x,y,r,Math.atan2(dy,dx)-Math.PI*.8,Math.atan2(dy,dx)+Math.PI*.8,col,1,stroke*1.7);}
                    else{p.circle(x,y,r,col,.93);p.circle(x,y,r,'#fff',.70,stroke*1.15);}
                    if(glyph&&e.emoji)glyph(e.emoji,x,y,r*2.66,e.id);
                } else if(kind==='dash'||kind==='leap'){
                    const half=Math.max(width*.5,r*.65);p.line(x-dx*half*.75,y-dy*half*.75,x,y,col,.6,Math.max(stroke,half*.24));
                    p.line(x-dx*half*.55-dy*half,y-dy*half*.55+dx*half,x-dy*half,y+dx*half,col,.7,stroke);
                    p.line(x-dx*half*.55+dy*half,y-dy*half*.55-dx*half,x+dy*half,y-dx*half,col,.7,stroke);
                } else if(kind==='orbit'){
                    p.circle(x,y,r,col,.13,stroke);
                    const count=Math.max(1,Math.min(8,Number(e.count||4)));
                    for(let i=0;i<count;i++){const a=age*.09+i*Math.PI*2/count,sx=x+Math.cos(a)*r,sy=y+Math.sin(a)*r;p.line(sx-Math.sin(a)*13,sy+Math.cos(a)*13,sx+Math.sin(a)*13,sy-Math.cos(a)*13,col,.95,Math.max(stroke,4));}
                } else if(kind==='trap'||kind==='pin-trap'){
                    p.circle(x,y,r,col,frame<Number(e.armAt||0)?.06:.13);if(frame<Number(e.armAt||0))p.dashedCircle(x,y,r,col,.55,stroke);else p.circle(x,y,r,col,.85,stroke);p.line(x-r*.45,y+r*.3,x,y-r*.45,col,1,stroke*1.4);p.line(x,y-r*.45,x+r*.45,y+r*.3,col,1,stroke*1.4);
                } else if(!['schedule','scheduled','sequence','volley','buff','recast'].includes(kind)){
                    if(e.maxRadius>r)p.dashedCircle(x,y,e.maxRadius,col,.28,stroke);
                    if(e.pullRadius>r)p.dashedCircle(x,y,e.pullRadius,col,.48,stroke);
                    if(e.collapseRadius>0)p.dashedCircle(x,y,e.collapseRadius,'#f0abfc',.64,stroke);
                    p.circle(x,y,r,col,.15);p.circle(x,y,r,col,.83,stroke);p.circle(x,y,Math.min(3/zoom,r*.12),col,.78);
                    if(kind!=='gravity')p.arc(x,y,r,-Math.PI/2,-Math.PI/2+Math.PI*2*(1-progress),col,.92,stroke*1.35);
                    if(kind==='gravity'){p.arc(x,y,r*.6,age*.04,age*.04+Math.PI*1.3,'#ddd6fe',.75,stroke*1.8);}
                }
            }
        };

__visualScope.brPaintGround = function brPaintGround(p,x,y,radius,color,type,zoom=1,friendly=false,meta=null){
            if(type==='pull'){__visualScope.brPaintGravity(p,x,y,radius,meta,zoom);return;}
            const z=Math.max(.05,zoom),c=color||'#fb7185';
            p.circle(x,y,radius,c,.14);
            if(friendly)p.dashedCircle(x,y,radius,c,.78,1.8/z);else p.circle(x,y,radius,c,.86,1.8/z);
            p.circle(x,y,Math.min(radius*.12,3/z),c,.8);
            for(let i=0;i<4;i++){const a=i*Math.PI/2,dx=Math.cos(a),dy=Math.sin(a),inner=Math.max(0,radius-Math.min(8/z,radius*.12));p.line(x+dx*inner,y+dy*inner,x+dx*radius,y+dy*radius,c,.8,1.4/z);}
        };

__visualScope.brPaintAttack = function brPaintAttack(p,r,alpha,zoom=1) {
            const type=r[1],geo=r[13]||{},x=Number(r[2]),y=Number(r[3]);
            const ax=Number(r[4])||0,ay=Number(r[5])||0,mag=Math.hypot(ax,ay),dx=mag>.0001?ax/mag:1,dy=mag>.0001?ay/mag:0,length=Math.max(0,Number(r[6])||0),color=r[7]||'#ffffff';
            const z=Math.max(.18,zoom),line=2/z,angle=Math.atan2(dy,dx),ex=x+dx*length,ey=y+dy*length;
            if(type==='hit'&&geo.shape==='contact'){
                const level=geo.periodic?1:Math.max(1,Math.min(4,Math.round(Number(r[12])||1))),shield=Number(geo.absorbed||0)>0,col=shield?'#67e8f9':color;
                const span=[0,10,18,28,38][level],a=alpha*alpha,px=-dy,py=dx;
                // Impact primitives show contact only; these rings never represent damage range.
                if(level===1){p.circle(x,y,2.5/z,'#ffffff',a*.85);p.line(x-dx*span/z,y-dy*span/z,x,y,col,a*.8,1.8/z);if(shield)p.circle(x,y,6/z,col,a*.7,1/z);return true;}
                p.line(x-dx*span/z,y-dy*span/z,x+dx*span*.35/z,y+dy*span*.35/z,col,a,Math.max(2,level+1)/z,'round');
                p.line(x-px*span*.48/z,y-py*span*.48/z,x+px*span*.48/z,y+py*span*.48/z,'#ffffff',a,Math.max(1.5,level*.75)/z);
                p.circle(x,y,(span*.35+span*.65*(1-alpha))/z,col,a*.72,(level>=3?2.5:1.5)/z);
                p.circle(x,y,(level>=3?4:2.8)/z,'#ffffff',a*.70);
                if(level===4){p.line(x-dx*span*.55/z-px*span*.38/z,y-dy*span*.55/z-py*span*.38/z,x+dx*span*.12/z+px*span*.38/z,y+dy*span*.12/z+py*span*.38/z,'#ffffff',a*.75,2/z);}
                return true;
            }
            if(type==='cast-start'){
                const radius=Math.max(1,Number(geo.radius||length)),a=alpha*(geo.windup?.7:.46);
                if(['rect','line','dash','cone'].includes(geo.shape)){
                    if(geo.shape==='cone'){p.sector(x,y,length,angle,geo.halfAngle||.5,color,a*.12);p.arc(x,y,length,angle-(geo.halfAngle||.5),angle+(geo.halfAngle||.5),color,a,1.8/z);}
                    else {const half=Math.max(5,Number(geo.width||10)/2),nx=-dy*half,ny=dx*half;const pts=[[x+nx,y+ny],[ex+nx,ey+ny],[ex-nx,ey-ny],[x-nx,y-ny]];p.polygon(pts,color,a*.10);p.polygon(pts,color,a,1.6/z);}
                }else{p.circle(x,y,radius,color,a*.08);p.dashedCircle(x,y,radius,color,a,1.8/z);if(geo.harmless){p.line(x-10,y,x+10,y,color,a,3/z);p.line(x,y-10,x,y+10,color,a,3/z);}}
                return true;
            }
            if(type==='transit'){
                const points=geo.points||[];
                for(let i=2;i<points.length;i+=2)p.line(points[i-2],points[i-1],points[i],points[i+1],color,alpha*.64,Math.max(1.4/z,Math.min(5/z,Number(geo.width||2))));
                return true;
            }
            if(type==='shot'){
                // This is a muzzle flash, not a guessed full-length damaging projectile.
                p.circle(x,y,Math.max(3/z,Math.min(16/z,Number(r[8]||6))),color,alpha*.5,1.5/z);
                return true;
            }
            if(type==='gravity-preview'){__visualScope.brPaintGravity(p,x,y,length,geo,zoom,alpha*.6);return true;}
            if(type==='laser') {
                const width=Math.max(.5,Number(geo.width??r[8])||6),tether=geo.part==='tether';
                p.line(x,y,ex,ey,color,alpha*(tether?.70:.52),width);
                p.line(x,y,ex,ey,'#ffffff',alpha*.84,Math.max(.5,width*.14));
                return true;
            }
            if(type==='dash') {
                if(length<.01)return true;
                const width=Math.max(1,Number(geo.width??r[8])||24),h=width*.5,px=-dy*h,py=dx*h;
                p.line(x,y,ex,ey,color,alpha*(geo.harmless?.05:.12),width,'round');
                p.line(x+px,y+py,ex+px,ey+py,color,alpha*.7,line);
                p.line(x-px,y-py,ex-px,ey-py,color,alpha*.7,line);
                p.arc(x,y,h,angle+Math.PI/2,angle+Math.PI*1.5,color,alpha*.7,line);
                p.arc(ex,ey,h,angle-Math.PI/2,angle+Math.PI/2,color,alpha*.7,line);
                p.line(x,y,ex,ey,'#ffffff',alpha*.65,Math.min(width*.12,3/z));
                return true;
            }
            if(type==='heal'&&geo.shape==='heal') {
                const radius=length*(.8+.2*(1-alpha)),arm=Math.max(9/z,length*.22);
                p.circle(x,y,radius,color,alpha*.58,2/z);
                p.line(x-arm,y,x+arm,y,color,alpha*.95,5/z);p.line(x,y-arm,x,y+arm,color,alpha*.95,5/z);
                return true;
            }
            if(type==='teleport'&&geo.shape==='blink') {
                const radius=length*(.7+.3*(1-alpha));
                p.arc(x,y,radius,angle-.7,angle+1.2,color,alpha*.85,3/z);
                p.arc(x,y,radius,angle+Math.PI-.7,angle+Math.PI+1.2,color,alpha*.85,3/z);
                p.line(x-dx*radius*.6,y-dy*radius*.6,x+dx*radius*.6,y+dy*radius*.6,'#ffffff',alpha*.55,2/z);
                return true;
            }
            if(type==='swing'&&geo.shape==='front-impact') {
                const width=Math.max(1,Number(geo.width)||60),half=width*.5,nx=-dy*half,ny=dx*half;
                const points=[[x+nx,y+ny],[ex+nx,ey+ny],[ex-nx,ey-ny],[x-nx,y-ny]];
                p.polygon(points,color,alpha*.185);p.polygon(points,color,alpha*.82,2.35/z);
                const hammer=geo.part==='hammer',tx=Number.isFinite(geo.targetX)?geo.targetX:ex,ty=Number.isFinite(geo.targetY)?geo.targetY:ey;
                if(hammer){
                    const reach=Math.min(width*.38,42),head=Math.min(width*.16,18);
                    p.line(x,y,tx,ty,color,alpha*.8,Math.max(4/z,width*.075));
                    p.polygon([[tx-dy*reach-dx*head,ty+dx*reach-dy*head],[tx+dy*reach-dx*head,ty-dx*reach-dy*head],[tx+dy*reach+dx*head,ty-dx*reach+dy*head],[tx-dy*reach+dx*head,ty+dx*reach+dy*head]],'#fff7ed',alpha*.95);
                    p.line(tx-dy*width*.42,ty+dx*width*.42,tx+dy*width*.42,ty-dx*width*.42,'#ffffff',alpha*.9,3/z);
                }else{
                    const progress=Math.min(1,(1-alpha)*2.5),sx=x+dx*length*progress,sy=y+dy*length*progress;
                    p.line(sx+nx*.94,sy+ny*.94,sx-nx*.94,sy-ny*.94,'#ffffff',alpha*.9,4/z);
                    for(const lane of [-.55,0,.55]){const bx=x+nx*lane,by=y+ny*lane;p.line(bx,by,sx+nx*lane,sy+ny*lane,color,alpha*.55,2/z);}
                    p.line(ex-dx*16-dy*12,ey-dy*16+dx*12,ex,ey,color,alpha*.8,2/z);
                    p.line(ex-dx*16+dy*12,ey-dy*16-dx*12,ex,ey,color,alpha*.8,2/z);
                }
                return true;
            }
            if(type==='swing') {
                if(geo.shape==='target-strike') {
                    // A lock-on follow-up hits one target; do not depict it as a large AoE cone.
                    const tx=Number(geo.targetX),ty=Number(geo.targetY),a=Math.max(12,Math.min(32,Number(geo.targetRadius)||22));
                    p.line(x,y,tx,ty,color,alpha*.45,line);
                    p.line(tx-dy*a-dx*a*.3,ty+dx*a-dy*a*.3,tx+dy*a+dx*a*.3,ty-dx*a+dy*a*.3,'#ffffff',alpha,4/z);
                    p.line(tx-dy*a*.7+dx*a*.25,ty+dx*a*.7+dy*a*.25,tx+dy*a*.7-dx*a*.25,ty-dx*a*.7-dy*a*.25,color,alpha*.9,3/z);
                    return true;
                }
                const half=Math.max(.01,Math.min(Math.PI,Number(geo.halfAngle??r[8])||Math.PI*.48));
                p.sector(x,y,length,angle,half,color,alpha*.155);
                p.sector(x,y,length,angle,half,color,alpha*.70,line*1.175);
                p.arc(x,y,Math.max(0,length-line),angle-half,angle+half,'#ffffff',alpha,3.45/z);
                p.arc(x,y,length*.77,angle-half*.86,angle+half*.86,color,alpha*.75,3/z);
                if(geo.basic){
                    const style=geo.part||String(r[10]||''),tip=length*.92,inner=length*.50;
                    if(/claw|scissor/.test(style)){
                        for(const sign of [-1,1])p.line(x+dx*inner-dy*length*.13*sign,y+dy*inner+dx*length*.13*sign,x+dx*tip+dy*length*.11*sign,y+dy*tip-dx*length*.11*sign,'#ffffff',alpha*.8,2/z);
                    }else if(/punch|hammer|heavy/.test(style)){
                        p.line(x+dx*inner,y+dy*inner,x+dx*tip,y+dy*tip,'#ffffff',alpha*.75,4/z);
                        p.arc(x+dx*length*.72,y+dy*length*.72,length*.16,angle-.9,angle+.9,color,alpha*.9,3/z);
                    }else p.line(x+dx*length*.55,y+dy*length*.55,x+dx*tip,y+dy*tip,'#ffffff',alpha*.55,2/z);
                }
                return true;
            }
            if(type==='impact'&&/^(basic-|body-check)|melee|punch|uppercut|smash/i.test(String(r[10]||''))) {
                // The confirmed contact point, with a directional line and short white core.
                const span=Math.max(16,Math.min(length*.42,68)),perpX=-dy,perpY=dx,progress=1-alpha;
                p.circle(x,y,span*(.22+.36*progress),'#ffffff',alpha*.23);
                p.line(x-dx*span*.68,y-dy*span*.68,x+dx*span*.25,y+dy*span*.25,color,alpha*.87,Math.max(2/z,5*alpha/z));
                p.line(x+perpX*span*.35-dx*span*.1,y+perpY*span*.35-dy*span*.1,
                    x-perpX*span*.35+dx*span*.1,y-perpY*span*.35+dy*span*.1,'#ffffff',alpha*.94,Math.max(1.5/z,4*alpha/z));
                p.circle(x,y,span*(.42+.40*progress),color,alpha*.66,Math.max(1.2/z,2.5/z));
                return true;
            }
            if(type==='hit'&&p.pixi) {
                const span=Math.max(13,Math.min(length*.38,42));
                p.line(x-dx*span,y-dy*span,x+dx*span*.16,y+dy*span*.16,color,alpha*.9,Math.max(2/z,5*alpha/z));
                p.circle(x,y,span*.5,'#ffffff',alpha*.43);
                return true;
            }
            if(type==='explosion'&&geo.shape==='circle') {
                // The danger boundary is visible at full size from the first frame.
                const age=(1-alpha)*Number(geo.displayMs||700),tail=age>85;
                p.circle(x,y,length,color,alpha*(tail?.035:.14));
                if(tail)p.dashedCircle(x,y,length,color,alpha*.42,1.6/z);else p.circle(x,y,length,color,alpha*.95,2.9/z);
                if(geo.controlRadius>length)p.dashedCircle(x,y,geo.controlRadius,'#bae6fd',alpha*.65,1.5/z);
                p.circle(x,y,length*(.22+.60*(1-alpha)),'#ffffff',alpha*.7,2/z);
                return true;
            }
            if(type==='explosion'&&geo.shape==='dynamite-impact') {
                const progress=1-alpha,inner=Math.min(length,Math.max(0,Number(geo.innerRadius)||0));
                const flash=Math.max(0,1-progress/.15),trace=Math.max(0,1-progress);
                p.circle(x,y,length,'#fb923c',trace*.11+flash*.17);
                if(progress*Number(geo.displayMs||760)>90)p.dashedCircle(x,y,length,'#ffedd5',trace*.44,2/z);else p.circle(x,y,length,'#ffedd5',trace*.90,Math.max(2/z,(3+flash*4)/z));
                p.circle(x,y,inner,'#fbbf24',trace*.12+flash*.18);
                p.circle(x,y,inner,'#fff7ed',trace*.70,Math.max(1.5/z,3/z));
                p.circle(x,y,length*(.13+.87*Math.min(1,progress*4.5)),'#ffffff',trace*(.33+flash*.55),Math.max(1.5/z,(2+flash*5)/z));
                return true;
            }
            return false;
        };

__visualScope.brPaintGravity = function brPaintGravity(p,x,y,core,meta,zoom=1,alpha=1) {
            const z=Math.max(.18,zoom),pull=Number(meta?.pull)||core*2,burst=Number(meta?.burst)||core*1.10;
            p.circle(x,y,core,'#581c87',alpha*.22);
            p.circle(x,y,core,'#e879f9',alpha*.85,3/z);
            p.dashedCircle(x,y,pull,'#c4b5fd',alpha*.65,2/z);
            p.dashedCircle(x,y,burst,'#fbbf24',alpha*(meta?.soon?.92:.35),(meta?.soon?3:1.5)/z);
            p.circle(x,y,Math.min(core*.16,23/z),'#10051f',alpha*.90);
            for(let i=0;i<6;i++){
                const a=i*Math.PI/3,c=Math.cos(a),s=Math.sin(a),r=(pull+burst)*.5,tip=r-15/z;
                p.line(x+c*(r+13/z),y+s*(r+13/z),x+c*tip,y+s*tip,'#c4b5fd',alpha*.7,2/z);
                p.line(x+c*tip,y+s*tip,x+c*(tip+9/z)-s*7/z,y+s*(tip+9/z)+c*7/z,'#c4b5fd',alpha*.7,2/z);
                p.line(x+c*tip,y+s*tip,x+c*(tip+9/z)+s*7/z,y+s*(tip+9/z)-c*7/z,'#c4b5fd',alpha*.7,2/z);
            }
        };

__visualScope.brPaintSmoke = function brPaintSmoke(p,x,y,r,lineWidth=3) {
            if(!(r>0))return;
            p.circle(x,y,r,'#9ca3af',.18);
            p.circle(x-r*.17,y-r*.12,r*.56,'#d1d5db',.10);
            p.circle(x+r*.28,y+r*.20,r*.39,'#e5e7eb',.065);
            // One quiet, fixed rim, no animation or opaque overlay above combat objects.
            p.circle(x,y,r,'#94a3b8',.48,lineWidth);
        };

__visualScope.brGraphicsPreset = function brGraphicsPreset(value){return Object.prototype.hasOwnProperty.call(__visualScope.BR_GRAPHICS_PROFILES,value)?value:'balanced';};

__visualScope.brGraphicsProfile = function brGraphicsProfile(){return __visualScope.BR_GRAPHICS_PROFILES[__visualScope.brGraphicsPreset(__visualScope.brCaptureMode()&&__visualScope.BRMP?.role==='host'?(__visualScope.BRMP.captureAutoBalanced?'balanced':__visualScope.BRMP.captureHostQuality||'high'):__visualScope.BRMP?.roomMeta?.graphicsPreset)];};

__visualScope.brActorEmojiCanvas = function brActorEmojiCanvas(glyph,size=128){
            size=size>=512?512:size>=256?256:128;
            const key=__visualScope.BR_ACTOR_EMOJI_STYLE+'|'+size+'|'+String(glyph||'•');
            let canvas=__visualScope.BR_ACTOR_EMOJI_CACHE.get(key);if(canvas)return canvas;
            canvas=document.createElement('canvas');canvas.width=canvas.height=size;
            const ctx=canvas.getContext('2d');
            ctx.font=Math.round(size*.75)+'px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
            ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(glyph||'•'),size*.5,size*.53);
            __visualScope.BR_ACTOR_EMOJI_CACHE.set(key,canvas);return canvas;
        };

__visualScope.brCrateHalf = function brCrateHalf(box) {
            const h=Number(Array.isArray(box)?box[5]:box?.halfSize);
            return Number.isFinite(h)&&h>0?h:__visualScope.BR_CRATE_HALF;
        };

__visualScope.brPaintCrate = function brPaintCrate(p,b,flash=0) {
            const x=b[1],y=b[2],h=__visualScope.brCrateHalf(b),d=h*2,heal=b[4]==='heal',border=heal?'#22c55e':'#f5c96b';
            p.rect(x-h,y-h,d,d,heal?'#ecfdf5':'#593b24',1);
            p.rect(x-h+1.5,y-h+1.5,d-3,d-3,border,1,3);
            if(heal){p.rect(x-h*.16,y-h*.70,h*.32,h*1.40,'#16a34a',1);p.rect(x-h*.70,y-h*.16,h*1.40,h*.32,'#16a34a',1);}
            else {
                p.line(x-h*.78,y-h*.78,x+h*.78,y+h*.78,'#a67638',1,5);
                p.line(x+h*.78,y-h*.78,x-h*.78,y+h*.78,'#a67638',1,5);
                p.rect(x-h*.48,y-h*.25,h*.96,h*.50,'#382515',.94);
                // Vector XP lettering stays crisp and identical in Canvas and Pixi.
                const z=h/48,w=3*z,col='#fff0b3';
                p.line(x-17*z,y-8*z,x-6*z,y+8*z,col,1,w);p.line(x-6*z,y-8*z,x-17*z,y+8*z,col,1,w);
                p.line(x+4*z,y+9*z,x+4*z,y-9*z,col,1,w);p.line(x+4*z,y-8*z,x+17*z,y-8*z,col,1,w);
                p.line(x+17*z,y-8*z,x+17*z,y,col,1,w);p.line(x+17*z,y,x+4*z,y,col,1,w);
            }
            if(flash>0){
                const strength=Math.max(0,Math.min(1,flash));
                p.rect(x-h+3,y-h+3,d-6,d-6,'#ffffff',strength*.28);
                p.line(x-h*.30,y-h*.58,x+h*.10,y-h*.08,'#fff7dc',strength,2.5);
                p.line(x+h*.10,y-h*.08,x+h*.40,y+h*.46,'#fff7dc',strength,2.5);
            }
            if(b[3]<100){p.rect(x-h,y-h-12,d,6,'#172033',1);p.rect(x-h,y-h-12,d*Math.max(0,Math.min(100,b[3]))/100,6,heal?'#4ade80':'#fbbf24',1);}
        };

__visualScope.brCaptureMode = function brCaptureMode(){return __visualScope.BRMP?.roomMeta?.mode==='team-capture';};

__visualScope.brEl = function brEl(id) {const old=__visualScope.brElementCache.get(id);if(old&&old.isConnected)return old;const el=document.getElementById(id);if(el)__visualScope.brElementCache.set(id,el);return el;};

__visualScope.brClamp = function brClamp(v,a,b) { return Math.max(a,Math.min(b,v)); };

__visualScope.brEmojiSourceSize = function brEmojiSourceSize(preset){return __visualScope.BR_GRAPHICS_PROFILES[__visualScope.brGraphicsPreset(preset)].source;};

__visualScope.brGetEmojiSprite = function brGetEmojiSprite(text) {
            return __visualScope.brActorEmojiCanvas(text,__visualScope.brEmojiSourceSize(__visualScope.BRMP?.roomMeta?.graphicsPreset));
        };

__visualScope.brGetNameSprite = function brGetNameSprite(text,color,bold) {
            var key=String(text)+'|'+String(color)+'|'+(bold?'1':'0');__visualScope.BRMP.nameSpriteCache=__visualScope.BRMP.nameSpriteCache||new Map();
            if(__visualScope.BRMP.nameSpriteCache.has(key))return __visualScope.BRMP.nameSpriteCache.get(key);
            var sprite=document.createElement('canvas'),sc=sprite.getContext('2d'),font=(bold?'900 ':'700 ')+'18px sans-serif';
            sc.font=font;
            // Tight bounds prevent short Korean names from being squeezed out of a fixed 220px bitmap.
            var labelWidth=Math.min(260,Math.max(26,Math.ceil(sc.measureText(String(text)).width)+14));
            sprite.width=labelWidth*2;sprite.height=64;sprite._labelW=labelWidth;sprite._labelH=32;
            sc=sprite.getContext('2d');sc.scale(2,2);sc.font=font;sc.textAlign='center';sc.textBaseline='middle';
            sc.lineWidth=3;sc.strokeStyle='rgba(2,6,15,.92)';sc.strokeText(String(text),labelWidth/2,16);sc.fillStyle=color;sc.fillText(String(text),labelWidth/2,16);
            __visualScope.BRMP.nameSpriteCache.set(key,sprite);return sprite;
        };

__visualScope.brSelfDamageCue = function brSelfDamageCue(damage,level,periodic,geometry,now=performance.now()) {
            const fatal=__visualScope.BRMP.drawPlayers?.get(String(__visualScope.BRMP.playerId))?.row?.[7]===0&&!(__visualScope.BRMP.damageFlash&&now<__visualScope.BRMP.damageFlash.until);
            if(!(damage>0)||!fatal&&now-Number(__visualScope.BRMP.lastHurtPulseAt??-1000)<(periodic?200:120))return false;
            __visualScope.BRMP.lastHurtPulseAt=now;const duration=[0,90,100,115,125][level],alpha=[0,.20,.25,.30,.36][level];
            __visualScope.BRMP.damageFlash={until:now+duration,duration,alpha,level};
            const el=__visualScope.brEl('br-hurt-edge');if(!el)return true;
            const animation=(__visualScope.BRMP.hurtPulseSeq=(__visualScope.BRMP.hurtPulseSeq||0)+1)%2?'br-hurt-a':'br-hurt-b';
            el.style.setProperty('--hurt-anim',animation);el.style.setProperty('--hurt-ms',duration+'ms');el.style.setProperty('--hurt-alpha',String(alpha));
            const dx=-Number(geometry.hitDX||0),dy=-Number(geometry.hitDY||0),mag=Math.hypot(dx,dy);
            if(mag>.001){el.style.setProperty('--hurt-x',(dx/mag*76).toFixed(1)+'px');el.style.setProperty('--hurt-y',(dy/mag*76).toFixed(1)+'px');el.style.setProperty('--hurt-angle',(Math.atan2(dy,dx)+Math.PI/4)+'rad');el.style.setProperty('--hurt-dir-anim',animation);}
            else el.style.setProperty('--hurt-dir-anim','none');
            return true;
        };

__visualScope.brRegisterHitFeedback = function brRegisterHitFeedback(targetId,amount,x,y,sourceId,style,confirmed,impactLevel,geometry={}) {
            if(!confirmed)return;
            const now=performance.now(),damage=Math.max(0,Number(amount||0)),key=String(targetId||''),periodic=!!geometry.periodic;
            let level=Number(impactLevel)>0?__visualScope.brClamp(Math.round(impactLevel),1,4):(window.BRCombatFeel?.impact(damage,Number(geometry.absorbed||0),null,geometry,style)||1);
            if(periodic)level=1;
            const clocks=__visualScope.BRMP.sustainFeedbackAt||(__visualScope.BRMP.sustainFeedbackAt=new Map());
            const last=Number(clocks.get(key)??-10000),gap=periodic?140:level===1?85:0;
            if(gap&&now-last<gap)return;clocks.set(key,now);
            const profile=periodic?{duration:70,squash:.025,flash:.20}:__visualScope.BR_HIT_PROFILES[level],map=__visualScope.BRMP.hitStates||(__visualScope.BRMP.hitStates=new Map());let hit=map.get(key);
            // A tiny rapid hit must not erase a heavy impact that is still returning to neutral.
            if(!hit||hit.until<=now||hit.level<=level){if(!hit){hit={};map.set(key,hit);}Object.assign(hit,{until:now+profile.duration,duration:profile.duration,level,squash:profile.squash,flash:profile.flash,dx:0,dy:0});}
            const victim=key===String(__visualScope.BRMP.playerId),owner=String(sourceId)===String(__visualScope.BRMP.playerId);
            if(victim){__visualScope.brSelfDamageCue(damage,level,periodic,geometry,now);if(now-Number(__visualScope.BRMP.lastHurtSfxAt??-1000)>(level===1?110:70)){__visualScope.BRMP.lastHurtSfxAt=now;__visualScope.brPlaySfx(damage<=0&&Number(geometry.absorbed)>0?'shield':'hurt',level);}}
            if(owner){__visualScope.BRMP.hitConfirm={until:now+(periodic?90:100+level*15),duration:periodic?90:100+level*15,amount:damage,heavy:level>=3,level,confirmed:true};if(now-Number(__visualScope.BRMP.lastHitSfxAt??-1000)>(level===1?110:70)){__visualScope.BRMP.lastHitSfxAt=now;__visualScope.brPlaySfx(damage<=0&&Number(geometry.absorbed)>0?'shield':'hit',level);}}
            if((victim||owner)&&level===4&&!periodic&&!__visualScope.BRMP.reducedMotion&&now-Number(__visualScope.BRMP.lastMajorImpulseAt??-1000)>180){
                __visualScope.BRMP.lastMajorImpulseAt=now;__visualScope.BRMP.studentShake={until:now+85,duration:85,strength:victim?1.5:1.0,seed:now%997};
                if(navigator.vibrate)try{navigator.vibrate(victim?12:8);}catch(_){}
            }
        };

__visualScope.brDrawProjectileGlyph = function brDrawProjectileGlyph(cc,x,y,vx,vy,size,emoji,color,style,zoom,alpha,rotation,detail=false,emphasis=false) {
            zoom=Math.max(.18,Number(zoom||1));
            var speed=Math.hypot(vx,vy)||1,ux=vx/speed,uy=vy/speed,r=Math.max(3/zoom,Number(size||7)),opacity=alpha==null?1:alpha;
            var fastFloor=speed>=14?18/zoom:0,tail=Math.min(style==='sniper'||style==='skill-sniper'?100:62,Math.max(speed*3.2,fastFloor))*(detail?1:.6);
            cc.save();cc.lineCap='round';cc.globalAlpha=opacity*.52;cc.strokeStyle=color;cc.lineWidth=Math.max(1.2/zoom,r*.50);
            cc.beginPath();cc.moveTo(x-ux*tail,y-uy*tail);cc.lineTo(x,y);cc.stroke();cc.globalAlpha=opacity;
            if(detail&&(style==='sniper'||style==='heavy')) {
                // One thin core makes deliberate, heavy shots distinct without particles.
                cc.globalAlpha=opacity*(style==='sniper'?.78:.52);cc.strokeStyle='#ffffff';cc.lineWidth=Math.max(.7/zoom,r*.14);
                cc.beginPath();cc.moveTo(x-ux*tail,y-uy*tail);cc.lineTo(x,y);cc.stroke();cc.globalAlpha=opacity;
            }
            if(emphasis) {
                // Skill projectiles keep one stable ring even when optional detail is reduced.
                cc.globalAlpha=opacity*.72;cc.strokeStyle='#ffffff';cc.lineWidth=Math.max(.8/zoom,r*.13);
                cc.beginPath();cc.arc(x,y,r*1.42,0,Math.PI*2);cc.stroke();cc.globalAlpha=opacity;
            } else if(detail&&(style==='bomber'||style==='heavy')) {
                cc.globalAlpha=opacity*.56;cc.strokeStyle=style==='bomber'?'#fde68a':'#ffffff';cc.lineWidth=Math.max(.7/zoom,r*.12);
                cc.beginPath();cc.arc(x,y,r*1.30,0,Math.PI*2);cc.stroke();cc.globalAlpha=opacity;
            }
            if(emoji) {
                // Rasterize once, then draw the emoji itself at the hitbox diameter (sprite has transparent padding).
                var glyphRadius=Math.max(r,3.5/zoom)*1.33;cc.translate(x,y);if(rotation)cc.rotate(rotation);
                cc.drawImage(__visualScope.brGetEmojiSprite(emoji),-glyphRadius,-glyphRadius,glyphRadius*2,glyphRadius*2);
            } else {
                cc.save();cc.translate(x,y);cc.rotate(Math.atan2(vy,vx));const source=__visualScope.brBulletCanvas(style,color),extent=r*32/30;cc.drawImage(source,-extent,-extent,extent*2,extent*2);cc.restore();
            }
            cc.restore();
        };

__visualScope.brStudentProjectileVisualSize = function brStudentProjectileVisualSize(size) {
            var radius=Math.max(1,Number(size||7));
            return radius<10?radius*1.22:radius<16?radius*1.14:radius*1.08;
        };

__visualScope.brDrawHitConfirm = function brDrawHitConfirm(cc,w,h,now) {
            var kill=__visualScope.BRMP.killConfirm;if(kill&&now>=kill.until){__visualScope.BRMP.killConfirm=null;kill=null;}
            var hit=kill||__visualScope.BRMP.hitConfirm;if(!hit||now>=hit.until){__visualScope.BRMP.hitConfirm=null;return;}
            var remain=__visualScope.brClamp((hit.until-now)/Math.max(1,Number(hit.duration||105)),0,1),size=(hit.heavy?19:14)*(1+(1-remain)*.35);
            cc.save();cc.translate(w/2,h/2);cc.globalAlpha=Math.min(1,remain*1.7);cc.strokeStyle=hit.elimination?'#fb7185':hit.confirmed?(hit.heavy?'#fde047':'#ffffff'):'rgba(255,255,255,.72)';cc.lineWidth=hit.heavy?4:3;cc.lineCap='round';
            for(var i=0;i<4;i++){var a=Math.PI/4+i*Math.PI/2,inner=size*.42,outer=size;cc.beginPath();cc.moveTo(Math.cos(a)*inner,Math.sin(a)*inner);cc.lineTo(Math.cos(a)*outer,Math.sin(a)*outer);cc.stroke();}
            if(hit.elimination){cc.drawImage(__visualScope.brGetNameSprite('K.O.','#ffe4e6',true),-24,22,48,20);}
            cc.restore();
        };
 __visualScope.BR_RUN_MAX_LEVEL=6, __visualScope.BR_RUN_MAX_CHOICES=__visualScope.BR_RUN_MAX_LEVEL-1, __visualScope.BR_RUN_PATH_MAX_TIER=3, __visualScope.BR_DEATH_XP_CAP=6;
 __visualScope.BR_TEAM_KILL_COLORS = Object.freeze(['#9ca3af','#3b82f6','#ef4444','#22c55e','#eab308']);
 __visualScope.BR_LEVEL_TEXTURES=new Map();
 __visualScope.brBulletSources=new Map();
 __visualScope.BR_GRAPHICS_PROFILES=Object.freeze({
            low:Object.freeze({label:'저사양',dpr:1,source:128,glow:0,antialias:false,finalFps:20}),
            balanced:Object.freeze({label:'균형',dpr:1.5,source:256,glow:.42,antialias:true,finalFps:30}),
            high:Object.freeze({label:'고품질',dpr:2,source:512,glow:.78,antialias:true,finalFps:60})
        });
 __visualScope.BR_ACTOR_EMOJI_STYLE=1,__visualScope.BR_ACTOR_EMOJI_CACHE=new Map();
 __visualScope.BR_CRATE_HALF = 48;
 __visualScope.brElementCache=new Map();
 __visualScope.BR_HIT_PROFILES=Object.freeze([
            null,
            Object.freeze({duration:75,squash:.028,flash:.22,span:10,soundMs:48,volume:.045,frequency:640,endFrequency:270}),
            Object.freeze({duration:95,squash:.058,flash:.34,span:18,soundMs:75,volume:.070,frequency:185,endFrequency:75}),
            Object.freeze({duration:120,squash:.090,flash:.46,span:28,soundMs:110,volume:.105,frequency:95,endFrequency:40}),
            Object.freeze({duration:135,squash:.120,flash:.52,span:38,soundMs:145,volume:.125,frequency:70,endFrequency:28})
        ]);
return __visualScope;}
