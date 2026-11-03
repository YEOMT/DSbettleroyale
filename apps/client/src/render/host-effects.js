// Original draw methods; only server-produced display records enter these functions.
const ABILITY_TYPES={MELEE:'MELEE',ORBIT:'ORBIT',PROJ:'PROJ',LASER:'LASER',ZONE:'ZONE',PULL:'PULL',TURRET:'TURRET',DASH:'DASH',TELEPORT:'TELEPORT'};
const Particle=function(ctx) {
                ctx.globalAlpha = this.life / this.maxLife; ctx.fillStyle = this.color;
                ctx.beginPath(); ctx.arc(this.pos.x, this.pos.y, this.size, 0, Math.PI*2); ctx.fill();
                ctx.globalAlpha = 1.0;
            };
const ImpactRing=function(ctx) {
                if(this.life <= 0) return;
                ctx.save();
                ctx.globalAlpha = Math.max(0, this.life / this.maxLife);
                ctx.strokeStyle = this.color;
                ctx.lineWidth = Math.max(1, this.lineWidth * (this.life / this.maxLife));
                ctx.beginPath(); ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI*2); ctx.stroke();
                ctx.restore();
            };
const SignatureEffect=function(ctx) {
                if(this.life<=0 || !this.owner?.alive) return;
                const progress=1-this.life/this.maxLife;
                const alpha=Math.sin(Math.min(1,progress*1.8)*Math.PI)*0.88;
                const r=this.owner.radius*(1.08+progress*0.68);
                ctx.save(); ctx.translate(this.owner.pos.x,this.owner.pos.y); ctx.rotate(this.angle);
                ctx.globalAlpha=Math.max(0,alpha); ctx.strokeStyle=this.color; ctx.fillStyle=this.color;
                ctx.shadowColor=this.color; ctx.shadowBlur=14; ctx.lineCap='round';

                if(this.type===ABILITY_TYPES.MELEE || this.type===ABILITY_TYPES.ORBIT) {
                    ctx.lineWidth=5;
                    for(let i=0;i<3;i++){ ctx.rotate(Math.PI*2/3); ctx.beginPath(); ctx.arc(0,0,r,-0.72,0.72); ctx.stroke(); }
                } else if(this.type===ABILITY_TYPES.PROJ || this.type===ABILITY_TYPES.LASER) {
                    ctx.lineWidth=4; ctx.beginPath(); ctx.arc(0,0,r*0.72,0,Math.PI*2); ctx.stroke();
                    for(let i=0;i<4;i++){ ctx.rotate(Math.PI/2); ctx.beginPath(); ctx.moveTo(r*0.72,0); ctx.lineTo(r*1.08,-r*0.18); ctx.lineTo(r*1.08,r*0.18); ctx.closePath(); ctx.stroke(); }
                } else if(this.type===ABILITY_TYPES.ZONE || this.type===ABILITY_TYPES.PULL || this.type===ABILITY_TYPES.TURRET) {
                    ctx.lineWidth=3.5; ctx.beginPath(); ctx.arc(0,0,r*0.62,0,Math.PI*2); ctx.stroke();
                    ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2); ctx.stroke();
                    ctx.beginPath();
                    for(let i=0;i<6;i++){ const a=-Math.PI/2+i*Math.PI/3, x=Math.cos(a)*r*0.82, y=Math.sin(a)*r*0.82; if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y); }
                    ctx.closePath(); ctx.stroke();
                } else if(this.type===ABILITY_TYPES.DASH || this.type===ABILITY_TYPES.TELEPORT) {
                    ctx.lineWidth=5;
                    for(let i=-1;i<=1;i++){ ctx.beginPath(); ctx.moveTo(-r*1.25,i*r*0.28); ctx.lineTo(-r*0.22,i*r*0.16); ctx.stroke(); }
                    ctx.beginPath(); ctx.arc(0,0,r*0.62,-1.0,1.0); ctx.stroke();
                } else {
                    ctx.lineWidth=3.5; ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2); ctx.stroke();
                    for(let i=0;i<5;i++){ const a=i*Math.PI*2/5; ctx.beginPath(); ctx.arc(Math.cos(a)*r*0.82,Math.sin(a)*r*0.82,5,0,Math.PI*2); ctx.fill(); }
                }
                ctx.restore();
            };
export function hostEffects(ctx,data,layer){if(!data)return;if(layer==='ground'){for(const q of data.rings)ImpactRing.call(q,ctx);for(const q of data.signatures)SignatureEffect.call(q,ctx);}else{for(const q of data.particles)Particle.call(q,ctx);for(const t of data.texts){ctx.save();ctx.globalAlpha=Math.max(0,Math.min(1,t.life/Math.max(1,t.maxLife*.45)));ctx.fillStyle=t.color;ctx.font='900 '+(t.size||28)+'px sans-serif';ctx.textAlign='center';ctx.shadowColor='rgba(0,0,0,0.75)';ctx.shadowBlur=6;ctx.fillText(t.text,t.pos.x,t.pos.y);ctx.restore();}}}
