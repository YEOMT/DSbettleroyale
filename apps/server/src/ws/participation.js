import {getParticipation,isPermanentlyEliminated} from '../../../../packages/engine/src/index.js';
export const combatRecipient=(room,member)=>member.role==='host'||!isPermanentlyEliminated(room.world,member.id);
export function stopEliminatedCombat(room,member){
 if(member.combatStopped||combatRecipient(room,member))return false;
 member.combatStopped=true;
 // Already-numbered reliable messages drain normally. Only the replaceable
 // old snapshot can be removed without introducing a cursor gap.
 if(member.peer){member.peer.pendingSnapshot=null;member.peer.send('PARTICIPATION_STATE',getParticipation(room.world,member.id),{reliable:true});}
 return true;
}
