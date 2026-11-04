import fs from 'node:fs';
const dir='artifacts/combat',out='docs/evidence/combat';fs.mkdirSync(out,{recursive:true});
const summary={},traces={};
for(const name of ['reference','candidate']){
 const rows=JSON.parse(fs.readFileSync(dir+'/host-'+name+'.json'));
 const values=rows.filter(r=>r.n<=5);
 const stats=key=>{const v=values.flatMap(r=>r[key]).sort((a,b)=>a-b);return Object.fromEntries([.5,.95,.99].map(p=>['p'+Math.round(100*p),+v[Math.floor(v.length*p)].toFixed(2)]));};
 const gaps=values.flatMap(r=>r.gaps);
 summary[name]={frames:gaps.length,raf:stats('gaps'),draw:stats('draw'),timeline:stats('timelineCost'),receive:stats('messages'),snapshot:stats('snapshotGaps'),over33:gaps.filter(n=>n>33.3).length,over50:gaps.filter(n=>n>50).length,gradients:values.reduce((n,r)=>n+r.gradients,0),textDraws:values.reduce((n,r)=>n+r.textDraws,0),objects:values[0].objects};
 traces[name]=rows;
}
fs.writeFileSync(out+'/host-summary.json',JSON.stringify(summary,null,2)+'\n');
const points=(rows,key,top,scale)=>rows.flatMap(r=>r[key]).map((v,i)=>[60+i*2,top+140-v*scale].map(n=>n.toFixed(2)).join(',')).join(' ');
let paths='';
for(const [name,color] of [['reference','#cc7043'],['candidate','#277eb6']])for(const [key,top,scale]of [['gaps',40,2.5],['draw',230,12]])paths+='<polyline fill="none" stroke="'+color+'" stroke-opacity=".75" stroke-width="1.2" points="'+points(traces[name],key,top,scale)+'"/>';
const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 940 420"><title>Canvas host replay frame timing</title><rect width="940" height="420" fill="#fff"/><g font-family="sans-serif" font-size="14" fill="#263547"><text x="60" y="22">Canvas host replay · 6→5→4→3→2→1 twice · 35 frames per segment</text><text x="60" y="50">RAF interval (ms)</text><text x="60" y="240">Draw CPU submission (ms)</text><text x="60" y="402" fill="#cc7043">Reference</text><text x="150" y="402" fill="#277eb6">Candidate</text></g>'+[0,16.7,33.3,50].map(n=>'<path d="M60 '+(180-n*2.5)+'H900" stroke="#ddd"/><text x="12" y="'+(183-n*2.5)+'" font-size="12">'+n+'</text>').join('')+[0,4,8].map(n=>'<path d="M60 '+(370-n*12)+'H900" stroke="#ddd"/><text x="12" y="'+(373-n*12)+'" font-size="12">'+n+'</text>').join('')+paths+'</svg>';
fs.writeFileSync(out+'/host-time.svg',svg+'\n');
