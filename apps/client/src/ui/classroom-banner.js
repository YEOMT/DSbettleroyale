import {classroomName} from '../../../../packages/protocol/src/player-name.js';
const supplyNames = {attack: '🔥 광폭', haste: '🌪️ 질풍', guard: '🛡️ 철벽'};
const hudSelectors = '#hud-overlay .hud-box,#br-tk-host-bar,#br-host-live,#br-music-controls,#br-capture-scoreboard,.br-battle-hud,.br-play-prefs,.br-escape-map,.br-capture-map,#br-joystick,#br-attack,#br-skill,#br-host-feed';

export function announcementText(event, players) {
    const label = players.find(player => player.id === event.playerId)?.name || '학생';
    const name = classroomName(label) || '학생';
    const supply = supplyNames[event.supply];
    switch (event.kind) {
        case 'awakening': return '👑 ' + name + ' F급 완전체 각성!';
        case 'first-blood': return 'FIRST BLOOD! · ' + name;
        case 'streak': return ({
            3: name + ' is on a killing spree!!', 5: name + ' is unstoppable!!',
            7: name + ' is legendary!!', 10: 'Who can stop ' + name + '?!'
        })[event.kills] || '';
        case 'supply-incoming': return supply ? supply + ' 보급 접근!' : '';
        case 'supply-claimed': return supply ? name + ' 획득: ' + supply + '!' : '';
        case 'final-three': return '🔥 FINAL 3 BURNING!';
        case 'compression': return '⚠️ 위험구역 압축 임박';
        default: return '';
    }
}

// Position a single line between occupied HUD rows. Layout reads occur only
// when a message first appears or the visible HUD/viewport changes size.
export function positionBanner(element) {
    const viewport = window.visualViewport;
    const width = viewport?.width || innerWidth, height = viewport?.height || innerHeight;
    const x = viewport?.offsetLeft || 0, y = viewport?.offsetTop || 0;
    const obstacles = Array.from(document.querySelectorAll(hudSelectors), node => node.getBoundingClientRect())
        .filter(rect => rect.width && rect.height);
    for (const preferred of [352,232,168]) {
        const span = Math.min(preferred,width-16);
        for (const left of [x+(width-span)/2,x+8,x+width-span-8]) {
            const occupied = obstacles.filter(rect => rect.right > left-4 && rect.left < left+span+4)
                .sort((a,b) => a.top-b.top);
            let top = y+8;
            for (const rect of occupied) {
                if (rect.bottom+5 <= top) continue;
                if (rect.top >= top+37) break;
                top = rect.bottom+5;
            }
            if (top+32 > y+height-4) continue;
            Object.assign(element.style,{left:left+'px',top:top+'px',width:span+'px'});
            return true;
        }
    }
    return false;
}

export class ClassroomBanner {
    constructor(element, sound, place=positionBanner, allowMotion=()=>false) {
        this.element = element;
        this.sound = sound;
        this.place = place;
        this.allowMotion = allowMotion;
        this.reset();
    }
    reset(cursor=0) {
        this.animation?.cancel();
        this.animation = null;
        this.cursor = cursor;
        this.current = null;
        this.pending = [];
        this.element.hidden = true;
        this.element.textContent = '';
    }
    accept(block,frame,players,now,objectiveNotice) {
        if (!block || block.seq <= this.cursor) return;
        for (const event of block.events) {
            if (event.seq <= this.cursor || frame-event.frame >= 120) continue;
            const text = announcementText(event,players);
            if (text) this.pending.push({seq:event.seq,priority:event.priority,text,received:now});
        }
        this.cursor = block.seq;
        this.pending.sort((a,b) => b.priority-a.priority || a.seq-b.seq);
        while (this.pending.length>3) {
            const lowest = this.pending.at(-1).priority;
            this.pending.splice(this.pending.findIndex(item => item.priority === lowest),1);
        }
        this.advance(now,objectiveNotice);
    }
    advance(now,objectiveNotice) {
        if (!this.current && !this.pending.length) return;
        if (objectiveNotice) {
            this.current = null;
            this.element.hidden = true;
            return;
        }
        while (this.pending.length && now-this.pending[0].received>6000) this.pending.shift();
        if (this.current && now<this.current.until && (this.pending[0]?.priority??0)<=this.current.priority) return;
        this.current = this.pending.shift() || null;
        if (!this.current) { this.element.hidden = true; this.element.textContent=''; return; }
        this.current.until = now+2000;
        this.element.textContent = this.current.text;
        this.element.hidden = !this.place(this.element);
        this.animation?.cancel();
        this.animation = !this.element.hidden && this.allowMotion()
            ? this.element.animate?.([{opacity:1,offset:0},{opacity:1,offset:.88},{opacity:0}],{duration:2000})
            : null;
        if (this.current.priority>=3 && !this.element.hidden) this.sound();
    }
}
