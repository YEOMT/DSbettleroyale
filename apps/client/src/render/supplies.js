export const supplyTypes = {
    attack: {icon: '🔥', name: '광폭', color: '#fb923c'},
    haste: {icon: '🌪️', name: '질풍', color: '#67e8f9'},
    guard: {icon: '🛡️', name: '철벽', color: '#c4b5fd'}
};

export function drawSupply(renderer, painter, row, zoom, solo) {
    if (!row) return;
    const [x, y, landed, kind] = row;
    const type = supplyTypes[kind];
    const color = type?.color || '#67e8f9';
    const radius = solo ? 65 : 52;
    const key = type ? 'combat-supply' : 'supply';
    painter.circle(x, y, radius, '#164e63', landed || !solo ? 1 : .33);
    painter[landed ? 'circle' : 'dashedCircle'](x, y, radius, color, 1, 4);
    if (solo) renderer.glyph(type?.icon || (landed ? '📦' : '↓'), x, y, Math.max(22.5, 6 / zoom), key);
    else if (zoom > .2) renderer.text(landed ? '📦' : '↓', x, y, 36, '#164e63', key);
    if (zoom > .2) renderer.text(type ? type.name + (landed ? ' 보급' : ' 접근') : 'SUPPLY +2 XP',
        x, y + radius + 21, 19, color, key + '-label');
}
