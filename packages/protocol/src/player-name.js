// Public classroom labels use the same alphabet on admission and on display.
export function classroomName(value) {
    if (typeof value !== 'string') return '';
    const normalized = value.normalize('NFC')
        .replace(/[^\p{L}\p{N}\p{M}\p{Extended_Pictographic} _-]/gu, '')
        .trim().replace(/ +/g, ' ');
    return Array.from(normalized).slice(0,24).join('');
}
