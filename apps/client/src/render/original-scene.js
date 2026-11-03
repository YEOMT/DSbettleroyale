// Display-only functions from the final v32.1 renderer.
export function createScene(session){const BRMP=session,brEl=id=>document.getElementById(id),brSetText=(e,t)=>{if(e)e.textContent=t;},brCaptureMode=()=>BRMP.roomMeta?.mode==='team-capture';
function brDrawStudentWall(cc,r) {
            var kind=r[5]||'wall';cc.save();cc.translate(r[0],r[1]);cc.rotate(r[4]||0);cc.lineWidth=3;
            if(kind==='crate') {
                cc.fillStyle='#7c4a24';cc.strokeStyle='#d6a15f';cc.fillRect(-r[2]/2,-r[3]/2,r[2],r[3]);cc.strokeRect(-r[2]/2,-r[3]/2,r[2],r[3]);
                cc.strokeStyle='rgba(255,224,170,.5)';cc.lineWidth=4;cc.beginPath();cc.moveTo(-r[2]*.35,-r[3]*.35);cc.lineTo(r[2]*.35,r[3]*.35);
                cc.moveTo(r[2]*.35,-r[3]*.35);cc.lineTo(-r[2]*.35,r[3]*.35);cc.stroke();
            } else if(kind==='rock') {
                cc.fillStyle='#475569';cc.strokeStyle='#94a3b8';cc.beginPath();cc.roundRect(-r[2]/2,-r[3]/2,r[2],r[3],Math.min(20,r[3]*.4));cc.fill();cc.stroke();
            } else {
                cc.fillStyle='#344157';cc.strokeStyle='#71809a';cc.fillRect(-r[2]/2,-r[3]/2,r[2],r[3]);cc.strokeRect(-r[2]/2,-r[3]/2,r[2],r[3]);
            }
            cc.restore();
        }
function brRingPaintBoundary(p,r,zoom=1){
            if(r.stale||r.calibrated===false)p.dashedCircle(r.cx,r.cy,r.radius,'#fbbf24',.60,2/zoom);
            else p.circle(r.cx,r.cy,r.radius,'#ff607d',.88,2/zoom);
        }
function brRingPaintSelf(p,self,r,zoom=1){
            if(!r||!self?.row?.[7]||Math.abs(Math.hypot(self.x-r.cx,self.y-r.cy)-r.radius)>100)return;
            p.circle(self.x,self.y,2.5/zoom,brRingOutside(self.x,self.y,r)?'#fb7185':'#f8fafc',.9);
        }
function brRingPaintPreview(painter,r,zoom=1) {
            if(!Number.isFinite(r.previewRadius)||r.previewRadius<0||r.previewRadius>=r.radius-.01)return;
            const radius=Math.max(0,r.previewRadius),width=2/Math.max(.01,zoom),count=Math.min(96,Math.max(16,Math.ceil(radius*zoom/9)));
            if(radius<1/zoom){painter.circle(r.cx,r.cy,3/zoom,'#fbbf24',.85,1.5/zoom);return;}
            for(let i=0;i<count;i++){const a=i*Math.PI*2/count;painter.arc(r.cx,r.cy,radius,a,a+Math.PI*2/count*.56,'#fbbf24',r.compressInMs>0?.72:.95,width);}
        }
function brRingOutside(x,y,r) {
            if(!r||![x,y,r.cx,r.cy,r.radius].every(Number.isFinite))return false;
            // A collapsed ring has no safe point, even at its exact centre.
            return r.radius<=0||Math.hypot(x-r.cx,y-r.cy)>r.radius+1e-7;
        }
function brUpdateRingHud(self,view,now=performance.now()) {
            if(brCaptureMode()){brEl('br-zone-status').style.display='none';return;}brEl('br-zone-status').style.display='';
            const r=view._ring;if(!r)return;
            const el=brEl('br-zone-status'),arrow=brEl('br-zone-arrow'),alive=!!self?.row?.[7];
            const outside=alive&&brRingOutside(self.x,self.y,r),near=alive&&Math.abs(Math.hypot(self.x-r.cx,self.y-r.cy)-r.radius)<160;
            const hit=BRMP.ringSelf?.hit,confirmed=now<Number(BRMP.ringDamageNoticeUntil||0);
            let text='',detail='',kind='normal';
            if(r.stale){kind='sync';text=r.selfUncertain?'경계 위치 동기화 중':'연결 지연 · 위험구역 위치 확인 중';detail='이동·피해 정보가 늦을 수 있습니다';}
            else if(!r.running){kind='sync';text='호스트 일시정지';detail='위험구역 시간도 함께 멈췄습니다';}
            else if(!r.calibrated){kind='sync';text='위험구역 시간 맞추는 중';}
            else if(outside){kind='danger';text=confirmed?'위험구역 피해 확인':'위험구역 밖 · 안쪽으로 이동';detail='캐릭터 중심 기준 · 진입 후 0.3초 유예';}
            else if(confirmed&&hit){kind='danger';text='직전 위험구역 피해 확인';detail='현재 위치와 피해 발생 시점은 다를 수 있습니다';}
            else if(r.compressLeftMs>0){kind='warn';text=r.compressInMs>0?'위험구역 압축까지 '+(r.compressInMs/1000).toFixed(1)+'초':'위험구역 압축 중';detail='주황 점선: 이번 압축이 끝날 경계';}
            else if(r.startInMs>0){text='위험구역 수축까지 '+Math.ceil(r.startInMs/1000)+'초';}
            else if(r.radius<=r.minRadius+.01){text=r.radius<=0?'안전구역 소멸':'위험구역 경계 고정';}
            else {text='위험구역 수축 중';if(near){kind='warn';detail='경계 주의 · 캐릭터 중심 기준';}}
            el.className='br-zone-status '+kind;brSetText(brEl('br-zone-text'),text);brSetText(brEl('br-zone-detail'),detail);
            arrow.hidden=!outside||r.radius<=0;
            if(!arrow.hidden)arrow.style.transform='rotate('+(Math.atan2(r.cy-self.y,r.cx-self.x)*180/Math.PI+90)+'deg)';
        }
function brDrawDangerFill(cc,x,y,radius,worldRadius) {
            if(radius>=worldRadius)return;
            cc.save();cc.fillStyle='rgba(192,38,72,.28)';cc.beginPath();
            cc.arc(x,y,worldRadius,0,Math.PI*2);cc.arc(x,y,Math.max(0,radius),0,Math.PI*2,true);cc.fill('evenodd');cc.restore();
        }
function brGraphicsResolution(w,h,limit){
            // Logical camera coordinates stay fixed; only the physical pixel backing changes.
            return Math.max(.7,Math.min(window.devicePixelRatio||1,limit,Math.sqrt(4800000/Math.max(1,w*h))));
        }
function hostWall(ctx,w){const draw=function(ctx){
                ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.angle);
                if(this.kind === 'crate') {
                    ctx.fillStyle='#7c4a24'; ctx.strokeStyle='#d6a15f'; ctx.lineWidth=4;
                    ctx.beginPath(); ctx.roundRect(-this.w/2,-this.h/2,this.w,this.h,8); ctx.fill(); ctx.stroke();
                    ctx.strokeStyle='rgba(255,224,170,.48)'; ctx.lineWidth=5;
                    ctx.beginPath(); ctx.moveTo(-this.w*.36,-this.h*.36); ctx.lineTo(this.w*.36,this.h*.36);
                    ctx.moveTo(this.w*.36,-this.h*.36); ctx.lineTo(-this.w*.36,this.h*.36); ctx.stroke();
                } else if(this.kind === 'rock') {
                    ctx.fillStyle='#475569'; ctx.strokeStyle='#94a3b8'; ctx.lineWidth=3;
                    ctx.beginPath(); ctx.roundRect(-this.w/2,-this.h/2,this.w,this.h,Math.min(24,this.h*.42)); ctx.fill(); ctx.stroke();
                    ctx.fillStyle='rgba(226,232,240,.14)'; ctx.beginPath();ctx.ellipse(-this.w*.12,-this.h*.16,this.w*.24,this.h*.16,-.18,0,Math.PI*2);ctx.fill();
                } else {
                    ctx.fillStyle = '#334155'; ctx.strokeStyle = '#64748b'; ctx.lineWidth = 2;
                    ctx.beginPath(); ctx.roundRect(-this.w/2, -this.h/2, this.w, this.h, 5); ctx.fill(); ctx.stroke();
                    ctx.fillStyle = '#1e293b'; ctx.fillRect(-this.w/2, -this.h/2 - 10, this.w, 10);
                }
                ctx.restore();
            };draw.call(w,ctx);}
return {hostWall,wall:brDrawStudentWall,boundary:brRingPaintBoundary,self:brRingPaintSelf,preview:brRingPaintPreview,ringHud:brUpdateRingHud,dangerFill:brDrawDangerFill,resolution:brGraphicsResolution};}
