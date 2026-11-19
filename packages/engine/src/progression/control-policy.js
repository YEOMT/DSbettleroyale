// Shared authority/preview policy. The cast freezes controlTier at launch;
// acquiring CONTROL later never upgrades an already flying projectile.
export function stunFrames(base, multiplier = 1, cap, controlTier = 0) {
    if (!(base > 0)) return 0;
    const legacyCap = cap ?? Math.max(base, base * 1.35);
    // Long stuns (including spotlight's 180f / 216f) retain their kit cap.
    const limit = controlTier > 0 && base < 180 ? Math.max(180, legacyCap) : legacyCap;
    return Math.round(Math.min(limit, base * multiplier));
}
