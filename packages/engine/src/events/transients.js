// Extracted from v32.1. Room-scoped bindings; see docs/source-map.json.
export function install(__brScope){
__brScope.SwingEffect = class SwingEffect {
            constructor(owner, pos, dir, size, style='slash', halfAngle=Math.PI*.48) {
                this.owner = owner;
                this.pos = new __brScope.Vec2(pos.x, pos.y);
                this.dir = Math.atan2(dir.y, dir.x);
                this.size = size;
                this.style = style;this.halfAngle=halfAngle;
                this.life = owner?.ability?.t === 'S' ? 18 : (owner?.ability?.t === 'A' ? 16 : 13);
                this.maxLife = this.life;
                this.tier = owner?.ability?.t || 'C';
            }
            update() { this.life--; }
            
        };

__brScope.Wall = class Wall {
            constructor(x, y, w, h, angle=0, kind='wall') {
                this.x = x; this.y = y; this.w = w; this.h = h; this.angle = angle; this.kind = kind;
                // ✨ 장애물이 천천히 회전하도록 난수 기반의 회전 속도 부여
                this.spinSpeed = (__brScope.rand() - 0.5) * 0.015; 
                this.minX = x - w/2; this.maxX = x + w/2; this.minY = y - h/2; this.maxY = y + h/2;
            }
            update() {
                // ✨ 매 프레임마다 벽의 각도 갱신
                this.angle += this.spinSpeed;
            }
            
        };

__brScope.SmokeCover = class SmokeCover {
            constructor(x,y,radius,seed=0) {
                this.pos=new __brScope.Vec2(x,y); this.x=x; this.y=y; this.radius=radius; this.seed=seed; this.phase=seed*.31;
            }
            contains(pos,padding=0) { return __brScope.brSmokeContains(this,pos,padding); }
            update() {}
            
        };

__brScope.Particle = class Particle {
            constructor(pos, vel, color, life, size) {
                this.pos = pos; this.vel = vel; this.color = color; this.life = life; this.maxLife = life; this.size = size;
            }
            update() { 
                this.pos = this.pos.add(this.vel); 
                this.vel = this.vel.mult(0.92); // 공기 저항
                this.size *= 0.96; // ✨ 타격감: 파편이 점점 작아지는 디테일 추가
                this.life--; 
            }
            
        };

__brScope.ImpactRing = class ImpactRing {
            constructor(pos, startRadius, maxRadius, color, life=18, lineWidth=6) {
                this.pos = new __brScope.Vec2(pos.x, pos.y);
                this.radius = startRadius;
                this.startRadius = startRadius;
                this.maxRadius = maxRadius;
                this.color = color;
                this.life = life;
                this.maxLife = life;
                this.lineWidth = lineWidth;
            }
            update() {
                const progress = 1 - this.life / this.maxLife;
                this.radius = this.startRadius + (this.maxRadius - this.startRadius) * (1 - Math.pow(1-progress, 2));
                this.life--;
            }
            
        };

__brScope.SignatureEffect = class SignatureEffect {
            constructor(owner) {
                this.owner=owner; this.life=26; this.maxLife=26;
                this.angle=__brScope.rand()*Math.PI*2;
                this.type=owner?.ability?.type || __brScope.ABILITY_TYPES.BUFF;
                this.color=({S:'#ff335f',A:'#fbbf24',B:'#60a5fa',C:'#4ade80',F:'#cbd5e1'})[owner?.ability?.t] || '#fff';
            }
            update(){ this.life--; this.angle+=0.12; }
            
        };

__brScope.ConfettiParticle = class ConfettiParticle {
            constructor(cx, cy) {
                // 화면 하단에서 넓게 분사
                this.pos = new __brScope.Vec2(cx + (__brScope.rand()-0.5)*1280, cy + (__brScope.rand()*100));
                let angle = (__brScope.rand() * -Math.PI); // 위로 솟구치는 각도
                let speed = 15 + __brScope.rand() * 35;
                this.vel = new __brScope.Vec2(Math.cos(angle)*speed, Math.sin(angle)*speed);
                this.color = `hsl(${__brScope.rand()*360}, 100%, 50%)`; // 무지개색
                this.size = 8 + __brScope.rand() * 12;
                this.spin = (__brScope.rand() - 0.5) * 0.5;
                this.angle = __brScope.rand() * Math.PI * 2;
            }
            update() {
                this.pos = this.pos.add(this.vel);
                this.vel.y += 0.4; // 중력
                this.vel.x *= 0.98; // 공기 저항
                this.angle += this.spin; // 빙글빙글 회전
            }
            
        };
}
export const initializers=[

];
