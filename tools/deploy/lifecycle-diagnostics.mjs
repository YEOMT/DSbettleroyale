// Bounded allow-list only: synthetic role aliases, numeric game data, no names/tokens/IDs.
const numeric=v=>Number.isFinite(v)?v:null;
export function record(state,kind,data){
 const row={ms:Date.now()-state.started,kind,...data};state.trace.push(row);
 if(state.trace.length>120)state.trace.shift();
}
export function authority(state,source){
 const s=state.self;
 return {source,epoch:numeric(state.epoch),inputEpoch:numeric(state.inputEpoch),full:state.full,self:s?{x:numeric(s.x),y:numeric(s.y),alive:s.alive===true,stunned:numeric(s.stunned),cooldown:numeric(s.cooldown),basicCooldown:numeric(s.basicCooldown),actions:Object.fromEntries(['attack','skill','firedAttack','firedSkill'].map(k=>[k,numeric(s.actions?.[k])]))}:null};
}
export function sent(state,message){
 if(message.type!=='INPUT_BATCH')return;
 state.inputEpoch=message.connectionEpoch;state.inputBatches++;
 if(Date.now()-(state.lastInputRecord||0)<250)return;
 state.lastInputRecord=Date.now();
 record(state,'INPUT_BATCH',{epoch:numeric(message.connectionEpoch),batches:state.inputBatches,commands:(message.payload?.commands||[]).slice(0,4).map(c=>({seq:numeric(c.seq),clientTick:numeric(c.clientTick),move:{x:numeric(c.move?.x),y:numeric(c.move?.y)},aim:{x:numeric(c.aim?.x),y:numeric(c.aim?.y)}}))});
}
export function browserInput(state,event){
 if(!['keydown','keyup','pointerdown','pointerup','pointercancel','blur','focus','visibilitychange'].includes(event.type))return;
 const key=['w','a','s','d','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key)?event.key:null;
 const target=['br-attack','br-skill','battle'].includes(event.target)?event.target:'battle';
 record(state,'browser-input',{type:event.type,key,target,trusted:event.trusted===true,hidden:event.hidden===true});
}
export function diagnostic(states){
 return states.map((s,i)=>({role:['teacher','student-a','student-b'][i],...authority(s,'latest'),inputBatches:s.inputBatches,trace:s.trace.map(x=>({...x}))}));
}
