const $=id=>document.getElementById(id),show=(id,on)=>$(id).classList.toggle('br-hidden',!on);
const families={BASIC:'일반 공격',SKILL:'고유 스킬',BODY:'기동 · 체력',SIGNATURE:'고유 강화'},tier=n=>['','I','II','III'][n];
export function validateCard(c){if(!c||!Number.isInteger(c.tier)||c.tier<1||c.tier>3||!['id','name','icon','family','effect','detail'].every(k=>typeof c[k]==='string'&&c[k].trim())||!families[c.family])throw Error('INVALID_AUGMENT_CARD');return c;}
function span(cls,text){const e=document.createElement('span');e.className=cls;e.textContent=text;return e;}
export class AugmentUI{
 constructor(net,notify){this.net=net;this.notify=notify;this.pointers=new Map();this.reset();const cards=$('br-run-cards');
  cards.addEventListener('pointerdown',e=>{const card=e.target.closest('[data-run-path]');if(!card||card.disabled||e.button>0)return;e.preventDefault();e.stopPropagation();this.pointers.set(e.pointerId,{card,key:this.key,path:card.dataset.runPath,x:e.clientX,y:e.clientY,lastY:e.clientY,dragged:false});card.setPointerCapture?.(e.pointerId);});
  cards.addEventListener('pointermove',e=>{const p=this.pointers.get(e.pointerId);if(!p)return;e.preventDefault();e.stopPropagation();if(Math.hypot(e.clientX-p.x,e.clientY-p.y)>8)p.dragged=true;if(p.dragged)$('br-run-panel').scrollTop+=p.lastY-e.clientY;p.lastY=e.clientY;});
  cards.addEventListener('pointerup',e=>{const p=this.pointers.get(e.pointerId);if(!p)return;this.pointers.delete(e.pointerId);e.preventDefault();e.stopPropagation();const r=p.card.getBoundingClientRect();if(!p.dragged&&p.key===this.key&&!p.card.disabled&&e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom)this.choose(p.path);});
  for(const event of ['pointercancel','lostpointercapture'])cards.addEventListener(event,e=>this.pointers.delete(e.pointerId));
  cards.addEventListener('click',e=>{if(e.detail>0||e.pointerType){e.preventDefault();return;}const card=e.target.closest('[data-run-path]');if(card&&!card.disabled)this.choose(card.dataset.runPath);});
  $('br-run-ui').addEventListener('keydown',e=>{if(['Enter',' '].includes(e.key)&&e.target.closest('button'))e.stopPropagation();});
 }
 reset(){this.key='';this.state=null;this.pending=null;this.pointers?.clear();clearTimeout(this.levelTimer);}
 render(s){const run=s.run;if(!run||!s.alive){this.reset();show('br-run-hud',false);show('br-run-ui',false);show('br-run-level-alert',false);return;}
  const scope=run.matchKey+':'+s.lifeSeq;if(this.state?.scope===scope&&run.revision<this.state.revision)return;this.state={scope,revision:run.revision,run,life:s.lifeSeq};
  show('br-run-hud',true);$('br-run-level').textContent='LV.'+run.level;$('br-run-xp-text').textContent=run.level===6?'MAX':`${run.xp} / ${run.required}`;$('br-run-xp-fill').style.width=(run.level===6?100:Math.min(100,run.xp/run.required*100))+'%';
  const bar=$('br-run-xp');bar.setAttribute('aria-valuemax',run.level===6?'1':String(run.required));bar.setAttribute('aria-valuenow',run.level===6?'1':String(run.xp));
  const offer=run.offer,key=offer?scope+':'+offer.id:'';show('br-run-ui',!!offer);show('br-run-ready',!!offer);
  if(key!==this.key){this.key=key;this.pending=null;this.pointers.clear();$('br-run-choice-status').textContent='';show('br-run-panel',!!offer);$('br-run-cards').replaceChildren();
   if(offer){try{if(offer.cards.length!==3||new Set(offer.cards.map(c=>c.id)).size!==3)throw Error('INVALID_AUGMENT_OFFER');offer.cards.forEach(validateCard);}catch(e){$('br-run-choice-status').textContent='강화 정보를 확인할 수 없습니다. 다시 연결해 주세요.';console.error(e.message);return;}
    $('br-run-offer-title').textContent=`LV.${offer.level} · 강화 선택`;show('br-run-level-alert',true);clearTimeout(this.levelTimer);this.levelTimer=setTimeout(()=>show('br-run-level-alert',false),1400);
    $('br-run-cards').replaceChildren(...offer.cards.map(c=>{const b=document.createElement('button');b.type='button';b.className='br-run-card'+(c.tier===3?' is-max-tier':'');b.dataset.runPath=c.id;b.dataset.runOffer=offer.id;const name=span('br-run-card-name',c.icon+' '+c.name+' ');name.append(span('br-run-card-tier',tier(c.tier)));b.append(span('br-run-card-family',families[c.family]),name,...c.effect.split(/\n|\s*·\s*/).filter(Boolean).map(line=>span('br-run-card-effect',line)),span('br-run-card-detail',c.detail));return b;}));
   }
  }
  const chipKey=scope+':'+JSON.stringify(run.chips);if(this.chipKey!==chipKey){this.chipKey=chipKey;$('br-run-owned').replaceChildren(...(run.chips||[]).map(c=>{validateCard(c);const label=`${c.name} ${tier(c.tier)} · ${c.effect} · ${c.detail}`,chip=span('br-run-chip',c.icon+' '+tier(c.tier));chip.title=label;chip.setAttribute('aria-label',label);return chip;}));}
 }
 async choose(id){const st=this.state,offer=st?.run.offer,key=this.key;if(!offer||this.pending||!offer.cards.some(c=>c.id===id)||this.net.scope.matchId!==st.run.matchKey||this.net.lifeSeq!==st.life)return;
  this.pending={key,id};for(const b of $('br-run-cards').children){b.disabled=true;b.classList.toggle('is-selected',b.dataset.runPath===id);}$('br-run-choice-status').textContent='강화 적용 중…';
  try{const result=await this.net.command('AUGMENT_CHOOSE',{offerId:offer.id,augmentId:id});if(this.net.scope.matchId===st.run.matchKey&&this.net.lifeSeq===st.life)this.notify(result.notice||`${offer.cards.find(c=>c.id===id).name} ${tier(offer.cards.find(c=>c.id===id).tier)} 적용`);}catch{if(key===this.key){this.pending=null;for(const b of $('br-run-cards').children)b.disabled=false;$('br-run-choice-status').textContent='적용되지 않았어요. 현재 강화 정보를 확인해 주세요.';}}
 }
}
