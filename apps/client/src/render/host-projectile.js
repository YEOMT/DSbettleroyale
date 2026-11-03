// Original Canvas projectile draw and generated textures. No physics/update methods.
const imgSlash=new Image(),imgFireball=new Image(),imgIceShard=new Image(),imgLightning=new Image(),imgStar=new Image();
function initOtherImages() {
            // 붉은 검기 (S급 Melee 및 Orbit)
            const c2 = document.createElement('canvas'); c2.width = 100; c2.height = 200; const ctx2 = c2.getContext('2d');
            ctx2.fillStyle = 'rgba(255, 50, 50, 0.9)';
            ctx2.shadowColor = '#ff0000'; ctx2.shadowBlur = 15;
            ctx2.beginPath(); ctx2.arc(0, 100, 90, -Math.PI/2, Math.PI/2); ctx2.arc(0, 100, 60, Math.PI/2, -Math.PI/2, true);
            ctx2.closePath(); ctx2.fill();
            imgSlash.src = c2.toDataURL();

            // 거대 화염구 (nuke)
            const c3 = document.createElement('canvas'); c3.width = 100; c3.height = 100; const ctx3 = c3.getContext('2d');
            ctx3.translate(50, 50);
            let grad = ctx3.createRadialGradient(-10, 0, 5, 0, 0, 40);
            grad.addColorStop(0, '#ffffff'); grad.addColorStop(0.3, '#ffcc00'); grad.addColorStop(0.7, '#ff3300'); grad.addColorStop(1, 'rgba(255,0,0,0)');
            ctx3.fillStyle = grad;
            ctx3.beginPath(); ctx3.arc(0, 0, 40, 0, Math.PI*2); ctx3.fill();
            ctx3.fillStyle = 'rgba(255, 50, 0, 0.6)';
            ctx3.beginPath(); ctx3.moveTo(10, -35); ctx3.lineTo(-45, 0); ctx3.lineTo(10, 35); ctx3.fill();
            imgFireball.src = c3.toDataURL();

            // 얼음 조각 (Ice)
            const c4 = document.createElement('canvas'); c4.width = 40; c4.height = 40; const ctx4 = c4.getContext('2d');
            ctx4.fillStyle = '#00ffff'; ctx4.shadowColor = '#0088ff'; ctx4.shadowBlur = 10;
            ctx4.beginPath(); ctx4.moveTo(0, 20); ctx4.lineTo(40, 10); ctx4.lineTo(40, 30); ctx4.closePath(); ctx4.fill();
            imgIceShard.src = c4.toDataURL();

            // 번개 투사체 (Lightning)
            const c5 = document.createElement('canvas'); c5.width = 40; c5.height = 40; const ctx5 = c5.getContext('2d');
            ctx5.strokeStyle = '#ffff00'; ctx5.lineWidth = 4; ctx5.shadowColor = '#ffaa00'; ctx5.shadowBlur = 8;
            ctx5.beginPath(); ctx5.moveTo(5, 20); ctx5.lineTo(20, 5); ctx5.lineTo(15, 35); ctx5.lineTo(35, 15); ctx5.stroke();
            imgLightning.src = c5.toDataURL();

            // 빛의 별 (Star)
            const c6 = document.createElement('canvas'); c6.width = 40; c6.height = 40; const ctx6 = c6.getContext('2d');
            ctx6.fillStyle = '#ffff00'; ctx6.translate(20,20);
            ctx6.beginPath();
            for(let i=0; i<5; i++) {
                ctx6.lineTo(Math.cos(-Math.PI/2 + i*Math.PI*2/5)*20, Math.sin(-Math.PI/2 + i*Math.PI*2/5)*20);
                ctx6.lineTo(Math.cos(-Math.PI/2 + Math.PI/5 + i*Math.PI*2/5)*8, Math.sin(-Math.PI/2 + Math.PI/5 + i*Math.PI*2/5)*8);
            }
            ctx6.closePath(); ctx6.fill();
            imgStar.src = c6.toDataURL();
        }
initOtherImages();
export const hostAssetsReady=Promise.all([imgSlash,imgFireball,imgIceShard,imgLightning,imgStar].map(i=>i.decode()));
export function hostProjectile(r,p,q,zoom){if(r.pixi){const size=Math.max(3,q.radius||7),speed=Math.hypot(q.dx,q.dy)||1,tail=Math.min(62,speed*3.2),color=q.trailColor||q.color||'#fff';p.line(q.x-q.dx/speed*tail,q.y-q.dy/speed*tail,q.x,q.y,color,.6,Math.max(2,size*.55));r.image(q.emoji?r.paint.brGetEmojiSprite(q.emoji):r.paint.brBulletCanvas(q.style,color),q.x,q.y,q.emoji?size*1.33:size*32/30,'shot-'+q.id,q.emoji?q.rotation||0:Math.atan2(q.dy,q.dx));return;}
const game={zoom},window={brCombatVisual:{projectile:r.paint.brDrawProjectileGlyph,emojiSprite:r.paint.brGetEmojiSprite}};const draw=function(ctx){ 
                // Projectile geometry remains authoritative in this.size. Only the host-facing
                // glyph gets a small screen-space floor so a valid shot cannot collapse to a
                // sub-pixel dot when the broadcast camera shows the whole arena.
                const hostZoom=Math.max(.2,Number(game?.zoom||1));
                const visualSize=Math.max(this.size,3/hostZoom);
                const visualSpeed=this.vel?.mag?.()||0;
                if(this.inputKind!=='attack'&&this.type!=='ORBIT'&&visualSpeed>=10) {
                    const ux=this.vel.x/visualSpeed,uy=this.vel.y/visualSpeed,tail=Math.min(70,visualSpeed*3.2);
                    ctx.save();ctx.globalAlpha=.48;ctx.strokeStyle=this.trailColor||this.color||'#ffffff';
                    ctx.lineCap='round';ctx.lineWidth=Math.max(1.2/hostZoom,visualSize*.42);
                    ctx.beginPath();ctx.moveTo(this.pos.x-ux*tail,this.pos.y-uy*tail);ctx.lineTo(this.pos.x,this.pos.y);ctx.stroke();ctx.restore();
                }
                if(this.inputKind==='attack'&&window.brCombatVisual){window.brCombatVisual.projectile(ctx,this.pos.x,this.pos.y,this.vel.x,this.vel.y,this.size,'',this.trailColor||this.color,this.weaponStyle,hostZoom,1,0,false,false);return;}
                if (this.emoji) {
                    ctx.save(); ctx.translate(this.pos.x, this.pos.y);
                    if (this.faceDir) ctx.rotate(Math.atan2(this.vel.y, this.vel.x));
                    else if (this.spinRate) ctx.rotate(this.spinAngle);
                    const glyphRadius=visualSize*1.33;
                    ctx.drawImage(window.brCombatVisual.emojiSprite(this.emoji),-glyphRadius,-glyphRadius,glyphRadius*2,glyphRadius*2);
                    ctx.restore();
                } else if (this.type === 'nuke') {
                    ctx.save(); ctx.translate(this.pos.x, this.pos.y); ctx.rotate(Math.atan2(this.vel.y, this.vel.x));
                    ctx.drawImage(imgFireball, -visualSize*1.5, -visualSize*1.5, visualSize*3, visualSize*3);
                    ctx.restore();
                } else if (this.vfx === 'slash') {
                    // 검성 궤도 전용 이펙트
                    ctx.save(); ctx.translate(this.pos.x, this.pos.y); ctx.rotate(this.orbitAngle || 0); 
                    ctx.drawImage(imgSlash, -visualSize*2, -visualSize*2, visualSize*4, visualSize*4);
                    ctx.restore();
                } else if (this.vfx === 'ice') {
                    ctx.save(); ctx.translate(this.pos.x, this.pos.y); ctx.rotate(Math.atan2(this.vel.y, this.vel.x)); 
                    ctx.drawImage(imgIceShard, -visualSize*1.5, -visualSize*1.5, visualSize*3, visualSize*3);
                    ctx.restore();
                } else if (this.vfx === 'lightning') {
                    ctx.save(); ctx.translate(this.pos.x, this.pos.y); ctx.rotate(Math.atan2(this.vel.y, this.vel.x)); 
                    ctx.drawImage(imgLightning, -visualSize*1.5, -visualSize*1.5, visualSize*3, visualSize*3);
                    ctx.restore();
                } else if (this.vfx === 'star') {
                    ctx.save(); ctx.translate(this.pos.x, this.pos.y); ctx.rotate(this.spinAngle || 0); 
                    ctx.drawImage(imgStar, -visualSize*1.5, -visualSize*1.5, visualSize*3, visualSize*3);
                    ctx.restore();
                } else {
                    ctx.fillStyle=this.color;ctx.beginPath();ctx.arc(this.pos.x,this.pos.y,visualSize,0,Math.PI*2);ctx.fill();
                    ctx.strokeStyle='rgba(255,255,255,.82)';ctx.lineWidth=Math.max(.8/hostZoom,visualSize*.12);ctx.stroke();
                }
            };
const state={...q,size:q.radius,pos:{x:q.x,y:q.y},vel:{x:q.dx,y:q.dy,mag:()=>Math.hypot(q.dx,q.dy)},inputKind:q.actionKind,weaponStyle:q.style,spinRate:q.spin,spinAngle:q.rotation};draw.call(state,r.ctx);}
