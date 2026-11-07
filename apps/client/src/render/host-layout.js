// Host-only CSS-pixel layout. No values flow back to actor physics or aiming.
const inkCache=new WeakMap();
export function hostDisplayRadius(radius,zoom,width=1366,height=768){return Math.max(radius,(width<1000||height<650?12:14)/Math.max(.01,zoom));}
export function hostInk(source,square=false){
 let pair=inkCache.get(source);if(!pair){pair={};inkCache.set(source,pair);}const key=square?'square':'tight';if(pair[key])return pair[key];
 const w=source.width,h=source.height,data=source.getContext('2d',{willReadFrequently:true}).getImageData(0,0,w,h).data;let x0=w,y0=h,x1=-1,y1=-1;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(data[(y*w+x)*4+3]){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
 if(x1<0)return source;const iw=x1-x0+1,ih=y1-y0+1,size=Math.max(iw,ih),c=document.createElement('canvas');c.width=square?size:iw;c.height=square?size:ih;
 c.getContext('2d').drawImage(source,x0,y0,iw,ih,(c.width-iw)/2,(c.height-ih)/2,iw,ih);c._hostInk={x:(c.width-iw)/2,y:(c.height-ih)/2,width:iw,height:ih};pair[key]=c;return c;
}
export function hostInfoLayout(x,y,radius,zoom,levelWidth,levelHeight,nameWidth,nameHeight,inkRadiusY=radius){
 const z=Math.max(.01,zoom),levelBottom=y-inkRadiusY-5/z,levelTop=levelBottom-levelHeight/z,nameBottom=levelTop-3/z;
 return {diameter:radius*z*2,level:{x,y:levelBottom-levelHeight/(2*z),w:levelWidth/z,h:levelHeight/z,top:levelTop,bottom:levelBottom},name:{x,y:nameBottom-nameHeight/(2*z),w:nameWidth/z,h:nameHeight/z,top:nameBottom-nameHeight/z,bottom:nameBottom},hp:{x:x-radius,y:y+radius+4/z,w:radius*2,h:4/z}};
}
function nameSource(r,a,lite){
 r.hostInfoSources??=new Map();const text=Array.from(a.name||'').slice(0,15).join('')+(a.kills>0?' [⚔'+a.kills+']':'');let entry=r.hostInfoSources.get(a.id);
 if(entry?.text===text)return entry.source;
 if(entry){const t=r.textures.get(entry.source);if(t){t.destroy(true);r.textures.delete(entry.source);}}
 const c=document.createElement('canvas'),q=c.getContext('2d'),font='bold 24px sans-serif';q.font=font;c.width=Math.ceil(q.measureText(text).width)+12;c.height=44;q.font=font;q.textAlign='center';q.textBaseline='middle';q.lineJoin='round';q.lineWidth=4;q.strokeStyle='#06101e';q.fillStyle='#fff';q.strokeText(text,c.width/2,22);q.fillText(text,c.width/2,22);
 const source=hostInk(c);r.hostInfoSources.set(a.id,{text,source});return source;
}
function stamp(r,source,box,key,alpha=1){
 if(r.pixi){r.image(source,box.x,box.y,1,key,0,alpha);const sprite=r.sprites.get(key);sprite.width=box.w;sprite.height=box.h;}
 else{r.ctx.save();r.ctx.globalAlpha*=alpha;r.ctx.drawImage(source,box.x-box.w/2,box.y-box.h/2,box.w,box.h);r.ctx.restore();}
}
export function drawHostInfo(r,p,a,rad,z,now,frame,names,lite=false){
 let track=r.tracks.get(a.id);if(!track){track={};r.tracks.set(a.id,track);}const pose=r.paint.brLevelPose(track,a.level,a.lifeSeq,now,true),raw=r.paint.brLevelCanvas(a.level),level=raw&&hostInk(raw),name=nameSource(r,a,lite);
 const k=(pose?.scale||1)*.4,lh=level?level.height*k:0,lw=level?level.width*k:0;
 const body=hostInk(r.paint.brGetEmojiSprite(a.emoji),true),inkRadiusY=rad*(body._hostInk?.height||body.height)/body.height;
 const layout=hostInfoLayout(a.x,a.y,rad,z,lw,lh,name.width/2,name.height/2,inkRadiusY);
 if(level&&pose)stamp(r,level,layout.level,'level-'+a.id,pose.alpha);
 const box=layout.name,overlaps=b=>Math.abs(box.x-b.x)<(box.w+b.w)/2+2/z&&Math.abs(box.y-b.y)<(box.h+b.h)/2+2/z;
 // In a packed overview, drop names before they cover another body/level/HP.
 // These are display-only bounds; no camera zoom or actor coordinates change.
 const overlap=names.some(overlaps)||(r.hostLayoutActors||[]).some(other=>{
  if(!other.alive||other.id===a.id||other.clone)return false;
  const rr=hostDisplayRadius(other.radius,z,innerWidth,innerHeight),body=hostInk(r.paint.brGetEmojiSprite(other.emoji),true),ink=rr*(body._hostInk?.height||body.height)/body.height,raw=r.paint.brLevelCanvas(other.level),level=raw&&hostInk(raw),scale=(r.tracks.get(other.id)?._levelVisual?.scale||1)*.4;
  const top=Math.min(other.y-rr,other.y-ink-5/z-(level?.height||0)*scale/z),bottom=other.y+rr+8/z;
  return overlaps({x:other.x,y:(top+bottom)/2,w:Math.max(rr*2,(level?.width||0)*scale/z),h:bottom-top});
 });
 if(!overlap){stamp(r,name,box,'host-info-name-'+a.id);names.push(box);}
 const hp=layout.hp,pct=Math.max(0,Math.min(1,a.hp/Math.max(1,a.maxHp)));p.rect(hp.x,hp.y,hp.w,hp.h,'#4b1620',1);p.rect(hp.x,hp.y,hp.w*pct,hp.h,pct>.35?'#4ade80':'#fb4b63',1);
 r.paint.brPaintReworkStatus(p,a.x,a.y,rad,z,a.rw,a.statusTick??frame,a.maxHp,true);
 // Bounded instrumentation also gives accessibility/debug tools actual bounds.
 layout.nameVisible=!overlap;layout.levelGapCss=5;layout.nameGapCss=3;layout.inkRadiusY=inkRadiusY;r.hostLayouts??=new Map();r.hostLayouts.set(a.id,layout);
}
