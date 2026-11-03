// Display-only actor loops from final v32.1 GameWorld.draw/drawHostLite/brCaptureCanvasFrame.
import {manifest} from '../../../../packages/content/src/manifest.js';
export function createHostCanvas(renderer){
const r=renderer,BR_ACTOR_EMOJI_CACHE=r.paint.BR_ACTOR_EMOJI_CACHE,TEAM_NEUTRAL_FILL='#111827',brTeamKillColor=r.paint.brTeamKillColor,brCombatPainter=r.paint.brCombatPainter,brPaintReworkStatus=r.paint.brPaintReworkStatus,brLevelCanvasDraw=r.paint.brLevelCanvasDraw;
const TEAM_SUPPORT_SUBS = new Set(manifest.roster.map(a=>a.ability).filter(a=>a.teamOnly).map(a=>a.sub));
const BR_ACTOR_EMOJI_STYLE='native-v2';
const window={BRMP:Object.assign(Object.create(r.session),{isRespawnMode:()=>['team-capture','team-respawn'].includes(r.session.roomMeta?.mode)}),BRRework:{wirePlayer:p=>p.rw},brCombatVisual:{emojiSprite:r.paint.brGetEmojiSprite}};
function isTeamSupportAbility(ability) {
            return !!ability && ability.teamOnly === true && TEAM_SUPPORT_SUBS.has(ability.sub);
        }
function drawTeamShapePath(ctx,team,x,y,r) { ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2); }
function brTeamBorderWidth(zoom,overview=false){return (overview?3.25:4.75)/Math.max(.05,zoom);}
function brActorEmojiCanvas(glyph,size=128){
            size=size>=512?512:size>=256?256:128;
            const key=BR_ACTOR_EMOJI_STYLE+'|'+size+'|'+String(glyph||'•');
            let canvas=BR_ACTOR_EMOJI_CACHE.get(key);if(canvas)return canvas;
            canvas=document.createElement('canvas');canvas.width=canvas.height=size;
            const ctx=canvas.getContext('2d');
            ctx.font=Math.round(size*.75)+'px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
            ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(glyph||'•'),size*.5,size*.53);
            BR_ACTOR_EMOJI_CACHE.set(key,canvas);return canvas;
        }
function normal(ctx,autoBroadcast,teamMode){this.participants.forEach(p => {
                    if(!p.alive) {
                        const remaining=Number(p.deathVisualUntilAt||0)-performance.now();
                        if(remaining>0) {
                            const ratio=Math.max(0,Math.min(1,remaining/750));
                            ctx.save();ctx.translate(p.pos.x,p.pos.y);ctx.scale(.45+.55*ratio,.45+.55*ratio);ctx.globalAlpha=ratio;
                            ctx.drawImage(p.cacheCanvas,-p.radius,-p.radius,p.radius*2,p.radius*2);
                            ctx.strokeStyle='#fb4b63';ctx.lineWidth=5;ctx.beginPath();ctx.arc(0,0,p.radius*(1.05+(1-ratio)*.75),0,Math.PI*2);ctx.stroke();ctx.restore();
                        }
                        return;
                    }
                    if (p.invisible) ctx.globalAlpha = 0.3;
                    
                    let tr = p.radius;
                    if(this.finalPhase&&p.finalPhaseBoosted) {
                        const glowCol=p.ability.t==='S'?'#ff477e':p.ability.t==='A'?'#facc15':p.ability.t==='B'?'#60a5fa':p.ability.t==='C'?'#4ade80':'#e2e8f0';
                        const pulse=1+Math.sin(this.frame*0.16+p.id)*0.07;
                        ctx.save();
                        // 바닥에서 퍼지는 부드러운 광원
                        const aura=ctx.createRadialGradient(p.pos.x,p.pos.y,tr*0.20,p.pos.x,p.pos.y,tr*2.25);
                        aura.addColorStop(0,'rgba(255,255,255,0.18)');
                        aura.addColorStop(0.35,glowCol+'42');
                        aura.addColorStop(1,glowCol+'00');
                        ctx.globalAlpha=0.95; ctx.fillStyle=aura; ctx.beginPath(); ctx.arc(p.pos.x,p.pos.y,tr*2.25,0,Math.PI*2); ctx.fill();
                        // 이중 광원 링
                        ctx.globalAlpha=0.72; ctx.strokeStyle=glowCol; ctx.lineWidth=5; ctx.shadowColor=glowCol; ctx.shadowBlur=32;
                        ctx.beginPath(); ctx.arc(p.pos.x,p.pos.y,tr*1.34*pulse,0,Math.PI*2); ctx.stroke();
                        ctx.globalAlpha=0.30; ctx.lineWidth=10; ctx.beginPath(); ctx.arc(p.pos.x,p.pos.y,tr*1.58/pulse,0,Math.PI*2); ctx.stroke();
                        // 회전하는 영역 파편/빛점
                        ctx.globalAlpha=0.90; ctx.fillStyle=glowCol; ctx.shadowBlur=20;
                        for(let gi=0;gi<5;gi++) {
                            const ga=this.frame*0.035*(gi%2?1:-1)+gi*Math.PI*2/5+p.id;
                            const gr=tr*(1.72+(gi%2)*0.18);
                            ctx.beginPath(); ctx.arc(p.pos.x+Math.cos(ga)*gr,p.pos.y+Math.sin(ga)*gr,3.5+(gi%2)*1.5,0,Math.PI*2); ctx.fill();
                        }
                        ctx.globalAlpha=0.40; ctx.strokeStyle='#ffffff'; ctx.lineWidth=2; ctx.shadowBlur=12;
                        const arcA=this.frame*0.025+p.id;
                        ctx.beginPath(); ctx.arc(p.pos.x,p.pos.y,tr*1.88,arcA,arcA+1.25); ctx.stroke();
                        ctx.beginPath(); ctx.arc(p.pos.x,p.pos.y,tr*1.88,arcA+Math.PI,arcA+Math.PI+1.25); ctx.stroke();
                        ctx.restore();
                    }

                    // Circular body fill shares the collision radius.
                    // 다른 이펙트의 원형 path가 팀 테두리를 덮어쓰던 버그를 차단한다.
                    drawTeamShapePath(ctx,p.team,p.pos.x,p.pos.y,tr);
                    ctx.fillStyle = p.team>0 ? TEAM_NEUTRAL_FILL : '#111';
                    ctx.fill();
                    // Team identity is drawn by the final colored circular rim.
                    
                    // ✨ 피격 플래시 (Hit Flash) 연출
                    const hitFlash=Math.max(0,Number(p.flashUntilFrame||0)-this.frame);
                    if (hitFlash > 0) {
                        ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1,hitFlash/6)})`;
                        ctx.fill();
                    }
                    
                    // v22.2: 팀전 지원가는 전투 중에도 역할이 보이도록 항상 작은 지원 마커를 표시.
                    if(teamMode>0 && isTeamSupportAbility(p.ability)) {
                        const healSubs=new Set(['TEAM_SANCTUARY','TEAM_MEDIC','TEAM_BLOOM','TEAM_TONIC','TEAM_CLOVER','TEAM_BANDAGE']);
                        const guardSubs=new Set(['TEAM_GUARD','TEAM_BARRIER','TEAM_BELL']);
                        const hasteSubs=new Set(['TEAM_HASTE_A','TEAM_RALLY','TEAM_BUGLE']);
                        const roleMark = healSubs.has(p.ability.sub) ? '♥'
                            : guardSubs.has(p.ability.sub) ? '◆'
                            : hasteSubs.has(p.ability.sub) ? '»' : '+';
                        ctx.save();
                        ctx.globalAlpha=0.82;
                        ctx.font=`bold ${Math.max(12,tr*0.34)}px sans-serif`;
                        ctx.textAlign='center'; ctx.textBaseline='middle';
                        ctx.fillStyle=guardSubs.has(p.ability.sub)?'#bfdbfe':hasteSubs.has(p.ability.sub)?'#fde68a':'#bbf7d0';
                        ctx.shadowColor=ctx.fillStyle; ctx.shadowBlur=6;
                        ctx.fillText(roleMark,p.pos.x,p.pos.y-tr*1.48);
                        ctx.restore();
                    }

                    if(teamMode>0 && p.ability.tankRole) {
                        ctx.save();
                        ctx.globalAlpha=0.86;
                        ctx.font=`bold ${Math.max(12,tr*0.32)}px sans-serif`;
                        ctx.textAlign='center'; ctx.textBaseline='middle';
                        ctx.fillStyle='#dbeafe'; ctx.shadowColor='#60a5fa'; ctx.shadowBlur=6;
                        ctx.fillText('🛡',p.pos.x,p.pos.y-tr*1.48);
                        ctx.restore();
                    }

                    if(p.supportPulseFrames > 0) {
                        ctx.save();
                        const ratio=p.supportPulseFrames/82;
                        const pulse=1+Math.sin(this.frame*0.22+p.id)*0.06;
                        const col=p.supportPulseKind==='GUARD'?'#60a5fa'
                            :p.supportPulseKind==='RALLY'?'#facc15'
                            :p.supportPulseKind==='HASTE'?'#a78bfa'
                            :p.supportPulseKind==='SANCTUARY'?'#fde68a'
                            :'#4ade80';
                        ctx.globalAlpha=Math.max(0.16,0.48*ratio);
                        ctx.strokeStyle=col; ctx.lineWidth=5;
                        ctx.shadowColor=col; ctx.shadowBlur=12;
                        ctx.beginPath(); ctx.arc(p.pos.x,p.pos.y,tr*1.55*pulse,0,Math.PI*2); ctx.stroke();
                        ctx.restore();
                    }

                    if(p.teamGuardFrames > 0 && !this.isVisualPerformanceMode()) {
                        ctx.save();
                        ctx.globalAlpha=0.34+Math.sin(this.frame*0.12+p.id)*0.06;
                        ctx.strokeStyle='#93c5fd'; ctx.lineWidth=4;
                        ctx.beginPath(); ctx.arc(p.pos.x,p.pos.y,tr*1.22,0,Math.PI*2); ctx.stroke();
                        ctx.restore();
                    }

                    if(p.frenzyFrames > 0 && !this.isVisualPerformanceMode()) {
                        ctx.save();
                        const auraR = tr * (1.28 + Math.sin(this.frame*0.18)*0.05);
                        ctx.globalAlpha = 0.34;
                        ctx.strokeStyle = '#ff1744'; ctx.lineWidth = 7;
                        ctx.beginPath(); ctx.arc(p.pos.x,p.pos.y,auraR,0,Math.PI*2); ctx.stroke();
                        ctx.restore();
                    }

                    let borderCol = '#9ca3af'; 
                    if(p.ability.t === 'S') borderCol = '#ff0033';
                    else if(p.ability.t === 'A') borderCol = '#fbbf24';
                    else if(p.ability.t === 'B') borderCol = '#3b82f6';
                    else if(p.ability.t === 'C') borderCol = '#22c55e';
                    
                    // Restore the circular body path after optional support effects.
                    drawTeamShapePath(ctx,p.team,p.pos.x,p.pos.y,tr);
                    if(p.team>0)borderCol=brTeamKillColor(p.team);
                    ctx.strokeStyle=borderCol; ctx.lineWidth=p.team>0?brTeamBorderWidth(this.zoom):4;
                    if(this.finalPhase&&p.finalPhaseBoosted){ctx.shadowColor=borderCol;ctx.shadowBlur=18;ctx.lineWidth=5;}
                    ctx.stroke(); ctx.shadowBlur=0;
                    ctx.drawImage(p.cacheCanvas,p.pos.x-tr,p.pos.y-tr,tr*2,tr*2);
                    if(p.team>0){drawTeamShapePath(ctx,p.team,p.pos.x,p.pos.y,tr);ctx.strokeStyle=brTeamKillColor(p.team);ctx.lineWidth=brTeamBorderWidth(this.zoom);ctx.stroke();}
                    ctx.globalAlpha = 1.0; 

                    brLevelCanvasDraw(ctx,p,p.run?.level,p.lifeSeq,p.pos.x,p.pos.y-tr-Math.max(58/this.zoom,autoBroadcast?64:52),this.zoom);
                    brPaintReworkStatus(brCombatPainter(ctx,false),p.pos.x,p.pos.y,tr,this.zoom,window.BRRework?.wirePlayer(p,this),this.frame,p.maxHp);
                    let hpPct = Math.max(0, p.hp/p.maxHp);
                    let barW = p.radius * (autoBroadcast?2.35:2),barH=autoBroadcast?11:8,barY=p.pos.y-p.radius-(autoBroadcast?16:12);
                    ctx.fillStyle='#4b1620'; ctx.fillRect(p.pos.x-barW/2,barY,barW,barH);
                    ctx.fillStyle=hpPct>.35?'#4ade80':'#fb4b63'; ctx.fillRect(p.pos.x-barW/2,barY,barW*hpPct,barH);
                    if(autoBroadcast){ctx.strokeStyle='rgba(255,255,255,.82)';ctx.lineWidth=2;ctx.strokeRect(p.pos.x-barW/2,barY,barW,barH);}
                    
                    ctx.fillStyle='#fff'; ctx.font=`900 ${autoBroadcast?34:30}px sans-serif`; ctx.textAlign = 'center';
                    if(autoBroadcast){ctx.shadowColor='rgba(0,0,0,.95)';ctx.shadowBlur=8;}
                    let label = p.name; if(p.kills > 0) label += ` [⚔️${p.kills}]`;
                    ctx.fillText(label,p.pos.x,p.pos.y-p.radius-(autoBroadcast?35:25));ctx.shadowBlur=0;
                });}
function lite(ctx,scale,cx,cy){const tierColor={S:'#ff3859',A:'#facc15',B:'#60a5fa',C:'#34d399',F:'#cbd5e1'};for(const p of this.participants) {
                    if(p.id===999)continue;
                    const x=cx+(p.pos.x||0)*scale,y=cy+(p.pos.y||0)*scale,r=p.humanControlled?7:5;
                    if(!p.alive) {
                        const fade=Math.max(0,Math.min(1,(Number(p.deathVisualUntilAt||0)-performance.now())/750));
                        if(fade>0){ctx.globalAlpha=fade;ctx.strokeStyle='#fb4b63';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,3+8*(1-fade),0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;}
                        continue;
                    }
                    ctx.fillStyle=window.BRMP?.isRespawnMode()?'#111827':tierColor[p.ability?.t]||'#fff';ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
                    ctx.strokeStyle='rgba(5,12,24,.9)';ctx.lineWidth=2;if(!window.BRMP?.isRespawnMode())ctx.stroke();
                    ctx.drawImage(window.brCombatVisual.emojiSprite(p.ability?.e||'👤'),x-r*1.4,y-r*1.4,r*2.8,r*2.8);
                    if(p.team>0){ctx.strokeStyle=brTeamKillColor(p.team);ctx.lineWidth=3.25;ctx.beginPath();ctx.arc(x,y,r*1.5,0,Math.PI*2);ctx.stroke();}
                    if(p.humanControlled){
                        const label=Array.from(String(p.name||'')).slice(0,7).join('');
                        ctx.font='800 10px sans-serif';ctx.textAlign='center';ctx.lineJoin='round';ctx.lineWidth=3;
                        const labelY=y-r-(p.stunned>0?16:5);ctx.strokeStyle='rgba(3,8,18,.96)';ctx.strokeText(label,x,labelY);ctx.fillStyle='#f8fafc';ctx.fillText(label,x,labelY);
                    }
                    const hp=Math.max(0,p.hp/Math.max(1,p.maxHp)),barW=p.humanControlled?19:15,barY=y+r+3;
                    ctx.fillStyle='rgba(8,17,32,.96)';ctx.fillRect(x-barW/2-1,barY-1,barW+2,5);
                    ctx.fillStyle=hp>.35?'#4ade80':'#fb4b63';ctx.fillRect(x-barW/2,barY,barW*hp,3);
                    brLevelCanvasDraw(ctx,p,p.run?.level,p.lifeSeq,x,y-r-34,1,true);
                    brPaintReworkStatus(brCombatPainter(ctx,false),x,y,r,1,window.BRRework?.wirePlayer(p,this),this.frame,p.maxHp);
                }}
function capture(ctx,g){const painter=brCombatPainter(ctx,false);for(const p of g.participants){if(p.id===999||!p.alive)continue;const r=p.radius;painter.circle(p.pos.x,p.pos.y,r,'#101623',1);ctx.drawImage(brActorEmojiCanvas(p.ability.e),p.pos.x-r,p.pos.y-r,r*2,r*2);painter.circle(p.pos.x,p.pos.y,r,brTeamKillColor(p.team),1,brTeamBorderWidth(g.zoom,true));painter.rect(p.pos.x-r,p.pos.y+r+12,r*2,8,'#57202d',1);painter.rect(p.pos.x-r,p.pos.y+r+12,r*2*p.hp/p.maxHp,8,'#4ade80',1);ctx.fillStyle='#f8fafc';ctx.font='bold 30px sans-serif';ctx.textAlign='center';ctx.fillText(p.name,p.pos.x,p.pos.y-r-20);brLevelCanvasDraw(ctx,p,p.run?.level,p.lifeSeq,p.pos.x,p.pos.y-r-55/g.zoom,g.zoom,true);brPaintReworkStatus(painter,p.pos.x,p.pos.y,r,g.zoom,window.BRRework.wirePlayer(p,g),g.frame,p.maxHp);}}
return (view,pose,now)=>{const participants=view.actors.map(a=>{let p=r.hostTracks.get(a.id);if(!p){p={};r.hostTracks.set(a.id,p);}Object.assign(p,a,a.visual,{id:a.visual?.id||0,pos:{x:a.x,y:a.y},ability:manifest.roster.find(q=>q.id===a.abilityId).ability,run:{level:a.level},invisible:!!(a.flags&32),finalPhaseBoosted:!!(a.flags&64)});p.cacheCanvas=brActorEmojiCanvas(a.emoji,r.paint.brGraphicsProfile().source);if(a.alive)p.deathVisualUntilAt=0;else if(!p.deathVisualUntilAt)p.deathVisualUntilAt=now+750;return p;});const g={participants,frame:view.renderTick,zoom:pose.zoom,finalPhase:view.presentation?.finalPhase,isVisualPerformanceMode:()=>pose.mode==='performance'},ctx=r.ctx;ctx.save();if(view.capture)capture(ctx,g);else if(pose.mode==='performance')(ctx.scale(1/pose.zoom,1/pose.zoom),lite.call(g,ctx,pose.zoom,0,0));else normal.call(g,ctx,pose.mode==='broadcast',r.session.roomMeta?.mode==='solo'?0:1);ctx.restore();};
}
