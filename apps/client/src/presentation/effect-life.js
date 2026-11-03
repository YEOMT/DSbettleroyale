// v32.1 brFxLife, with an authoritative explicit display duration when provided.
export function effectLife(f){return f.geometry?.displayMs||({elimination:750,hit:720,impact:360,teleport:500,explosion:700,dash:440,swing:250,laser:280,shot:220,muzzle:210}[f.kind]||320);}
