// Original Canvas fallback effects, no simulation or local damage decisions.
export function createFx(session){const BRMP=Object.create(session);BRMP.drawFx=new Map();const brClamp=(n,a,b)=>Math.max(a,Math.min(b,n)),brStudentVisualDetail=()=>session.roomMeta?.graphicsPreset!=='low',brPaintAttack=()=>false,brCombatPainter=()=>null;
function brDrawStudentFx(cc,now,zoom,onScreen) {
            var fxMap=BRMP.drawFx;if(!fxMap)return;
            fxMap.forEach(function(fx,id){
                var age=now-fx.start;
                if(age>=fx.life){fxMap.delete(id);return;}
                var r=fx.row,type=String(r[1]||'hit'),x=Number(r[2]||0),y=Number(r[3]||0);
                if(!brStudentVisualDetail()&&!r[13]?.shape&&['spark','particle'].includes(type))return;
                if(!r[13]?.confirmed&&(type==='hit'||type==='impact')&&r[9]){var target=BRMP.drawPlayers&&BRMP.drawPlayers.get(String(r[9]));if(target){x=target.x;y=target.y;}}
                var dx=Number(r[4]||0),dy=Number(r[5]||0),mag=Math.hypot(dx,dy)||1;dx/=mag;dy/=mag;
                var size=Math.max(8,Number(r[6]||24)),color=r[7]||'#fff',p=brClamp(age/fx.life,0,1),alpha=1-p;
                if(!onScreen(x,y,Math.max(size,Number(r[13]?.pull||0))+180))return;
                if(brPaintAttack(brCombatPainter(cc,false),r,alpha,zoom))return;
                cc.save();cc.lineCap='round';cc.lineJoin='round';cc.globalAlpha=alpha;
                if(type==='muzzle') {
                    cc.translate(x,y);cc.rotate(Math.atan2(dy,dx));
                    cc.strokeStyle=color;cc.lineWidth=Math.max(2,(7*(1-p)+2)/zoom);cc.beginPath();cc.arc(0,0,size*(.22+.62*p),-.82,.82);cc.stroke();
                    cc.globalAlpha=alpha*.9;cc.fillStyle='#ffffff';cc.beginPath();cc.moveTo(size*(.10+.16*p),0);cc.lineTo(size*(.72+.18*p),-size*.22*(1-p));cc.lineTo(size*(.72+.18*p),size*.22*(1-p));cc.closePath();cc.fill();
                } else if(type==='hit') {
                    var hitAmount=Number(r[8]||0),hitLevel=Number(r[12]||0)||(hitAmount>=40?3:hitAmount>=25?2:hitAmount>=12?1:0);
                    var cp=brContactProgress(age,r[10],hitLevel),contactAlpha=1-cp,rot=Math.atan2(dy,dx);
                    cc.translate(x,y);cc.rotate(rot);
                    if(contactAlpha>0) {
                        cc.globalAlpha=contactAlpha;cc.strokeStyle=color;cc.lineWidth=Math.max(2,5/zoom);
                        cc.beginPath();cc.moveTo(-size*(1.05-cp*.35),0);cc.lineTo(-size*.18,0);cc.stroke();
                        var mark=size*(.42+.18*cp);cc.strokeStyle=cp<.30?'#ffffff':color;cc.lineWidth=Math.max(2,(6*(1-cp)+2)/zoom);
                        cc.beginPath();cc.moveTo(-mark,-mark);cc.lineTo(mark,mark);cc.moveTo(-mark,mark);cc.lineTo(mark,-mark);cc.stroke();
                        cc.globalAlpha=contactAlpha*.75;cc.beginPath();cc.arc(0,0,size*(.45+cp*.75),0,Math.PI*2);cc.stroke();
                    }
                    // Damage text retains its readable lifetime after the short contact clears.
                    cc.rotate(-rot);cc.globalAlpha=Math.min(1,alpha*1.55);cc.fillStyle=hitLevel>=2?'#fde047':'#ff8b82';
                    cc.strokeStyle='rgba(5,10,20,.96)';cc.lineWidth=Math.max(2,4/zoom);
                    cc.font='1000 '+Math.max(20,(hitLevel>=2?30:25)/zoom)+'px sans-serif';cc.textAlign='center';cc.textBaseline='middle';
                    var damageY=-size-22/zoom-age*.052/zoom,damageText=(hitLevel>=3?'CRITICAL ':'')+'-'+Math.max(1,Math.round(hitAmount));
                    cc.strokeText(damageText,0,damageY);cc.fillText(damageText,0,damageY);
                } else if(type==='elimination') {
                    cc.translate(x,y);var shrink=.35+.65*alpha;
                    cc.scale(shrink,shrink);cc.strokeStyle='#ffffff';cc.lineWidth=Math.max(2,5/zoom);
                    cc.beginPath();cc.arc(0,0,size*(.52+.45*p),0,Math.PI*2);cc.stroke();
                    cc.globalAlpha=Math.min(1,alpha*1.5);cc.fillStyle=color;cc.font='1000 '+Math.max(18,24/zoom)+'px sans-serif';cc.textAlign='center';cc.textBaseline='middle';
                    cc.fillText('ELIMINATED',0,-size*.72-age*.018/zoom);
                } else if(type==='impact') {
                    var impactStyle=String(r[10]||''),impactR=size*(.24+.72*p);
                    cc.strokeStyle=p<.24?'#ffffff':color;cc.lineWidth=Math.max(2,(9*(1-p)+2)/zoom);
                    cc.beginPath();cc.arc(x,y,impactR,0,Math.PI*2);cc.stroke();
                    cc.translate(x,y);cc.rotate(Math.atan2(dy,dx));
                    var rays=/melee|dash|teleport|body|punch|smash/.test(impactStyle)?6:4;
                    cc.strokeStyle=color;cc.lineWidth=Math.max(2,(6*(1-p)+1)/zoom);cc.globalAlpha=alpha*.92;
                    for(var ri=0;ri<rays;ri++){
                        var ra=ri*Math.PI*2/rays,inner=size*(.18+.15*p),outer=size*(.48+.42*p);
                        cc.beginPath();cc.moveTo(Math.cos(ra)*inner,Math.sin(ra)*inner);cc.lineTo(Math.cos(ra)*outer,Math.sin(ra)*outer);cc.stroke();
                    }
                } else if(type==='laser') {
                    brDrawBeam(cc,x,y,dx,dy,size,Number(r[8]||6),color,alpha);
                } else if(type==='explosion') {
                    var skillBlast=String(r[10]||'').indexOf('skill-')===0;
                    cc.globalAlpha=alpha*(skillBlast?.32:.15);cc.fillStyle=color;cc.beginPath();cc.arc(x,y,size*(.40+.60*Math.min(1,p*2.8)),0,Math.PI*2);cc.fill();
                    cc.globalAlpha=alpha;cc.strokeStyle=color;cc.lineWidth=Math.max(2,((skillBlast?13:8)*(1-p)+2)/zoom);
                    cc.beginPath();cc.arc(x,y,size*(.22+.78*p),0,Math.PI*2);cc.stroke();
                    cc.globalAlpha=alpha*.85;cc.strokeStyle='#ffffff';cc.lineWidth=Math.max(1,(skillBlast?6:3)/zoom);cc.beginPath();cc.arc(x,y,size*(.12+.52*p),0,Math.PI*2);cc.stroke();
                    if(skillBlast){cc.beginPath();for(var ray=0;ray<6;ray++){var rayAngle=ray*Math.PI/3;cc.moveTo(x+Math.cos(rayAngle)*size*.45,y+Math.sin(rayAngle)*size*.45);cc.lineTo(x+Math.cos(rayAngle)*size*(.60+p*.36),y+Math.sin(rayAngle)*size*(.60+p*.36));}cc.stroke();}
                } else if(type==='shot') {
                    // A remote basic projectile can live for less than one per-player network
                    // snapshot. Draw one bounded moving cue from the authoritative fire event;
                    // it never participates in collision or damage.
                    var shotR=Math.max(Number(r[8]||5)*1.08,3/zoom),travel=size*(.18+.82*Math.min(1,p*1.35));
                    var hx=x+dx*travel,hy=y+dy*travel,tail=Math.min(size*.42,Math.max(24/zoom,size*.24));
                    cc.globalAlpha=alpha*.64;cc.strokeStyle=color;cc.lineWidth=Math.max(1.2/zoom,shotR*.46);
                    cc.beginPath();cc.moveTo(hx-dx*tail,hy-dy*tail);cc.lineTo(hx,hy);cc.stroke();
                    cc.globalAlpha=alpha*.94;cc.fillStyle=color;cc.beginPath();cc.arc(hx,hy,shotR,0,Math.PI*2);cc.fill();
                    cc.strokeStyle='#ffffff';cc.lineWidth=Math.max(.8/zoom,shotR*.14);cc.stroke();
                } else if(type==='teleport') {
                    var teleLen=Number(r[6]||0),tx=x+dx*teleLen,ty=y+dy*teleLen,arrival=Math.max(50,Number(r[8]||110)),blinkStyle=String(r[10]||'');
                    // One disappearing portal, one narrow seam and one arriving strike.
                    cc.strokeStyle=color;cc.lineWidth=Math.max(2,(7*(1-p)+1)/zoom);
                    cc.beginPath();cc.ellipse(x,y,Math.max(4,50*(1-p)),72*(1-p)+5,Math.atan2(dy,dx),0,Math.PI*2);cc.stroke();
                    cc.globalAlpha=alpha*.42;cc.lineWidth=Math.max(2,6*(1-p)/zoom);cc.beginPath();cc.moveTo(x,y);cc.lineTo(tx,ty);cc.stroke();
                    cc.globalAlpha=alpha*.24;cc.fillStyle=color;cc.beginPath();cc.arc(tx,ty,arrival*(.64+.36*p),0,Math.PI*2);cc.fill();
                    cc.globalAlpha=alpha;cc.strokeStyle=color;cc.lineWidth=Math.max(2,6/zoom);cc.beginPath();cc.arc(tx,ty,arrival*(.54+.46*p),0,Math.PI*2);cc.stroke();
                    cc.translate(tx,ty);cc.rotate(Math.atan2(dy,dx)+Math.PI/4);cc.strokeStyle='#ffffff';cc.lineWidth=Math.max(3,(12*(1-p)+2)/zoom);
                    var slash=arrival*(.70+.30*p);cc.beginPath();cc.moveTo(-slash,-slash*.25);cc.lineTo(slash,slash*.25);
                    if(!/lava|thunder/.test(blinkStyle)){cc.moveTo(-slash*.25,slash);cc.lineTo(slash*.25,-slash);}cc.stroke();
                }
                cc.restore();
            });
        }
function brContactProgress(age,style,level) {
            // Hold only the contact drawing's bright peak for 30ms. Actors and
            // prediction keep advancing, so the cue cannot delay input or hits.
            var melee=/melee|dash|teleport|orbit|pull|punch|smash|uppercut|combo|lunge|tank|^basic-(?:slash|scissor|soul|hammer)$/i.test(String(style||''));
            var hold=melee&&!BRMP.reducedMotion?30:0,life=150+Math.min(3,Math.max(0,Number(level||0)))*15;
            var progress=brClamp((age-hold)/life,0,1);
            return progress;
        }
function brDrawBeam(cc,x,y,dx,dy,length,width,color,alpha) {
            // Width is in world units, just like the damage geometry; zoom scales both together.
            cc.save();cc.lineCap='butt';cc.beginPath();cc.moveTo(x,y);cc.lineTo(x+dx*length,y+dy*length);
            cc.globalAlpha=alpha*.65;cc.strokeStyle=color||'#ffffff';cc.lineWidth=Math.max(.5,width);cc.stroke();
            cc.globalAlpha=alpha*.9;cc.strokeStyle='#ffffff';cc.lineWidth=Math.max(.5,width*.16);cc.stroke();cc.restore();
        }
function brFxLife(type) {
            return type==='elimination'?750:type==='hit'?720:type==='impact'?360:type==='teleport'?500:type==='explosion'?700:
                type==='dash'?440:type==='swing'?250:type==='laser'?280:type==='shot'?220:type==='muzzle'?210:320;
        }
return (cc,row,age,life,zoom)=>{BRMP.drawFx.clear();BRMP.drawFx.set(row[0],{row,start:0,life});brDrawStudentFx(cc,age,zoom,()=>true);};}
