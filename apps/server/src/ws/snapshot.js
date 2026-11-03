import {PROTOCOL_VERSION} from '../../../../packages/protocol/src/index.js';
// Shared objects are serialized once per generated snapshot, not once per recipient.
// The wire format remains ordinary strict JSON; this introduces no lossy coordinate quantization.
export function snapshotEncoder(teacher,snapshotSeq,serverNow){
 const actors=new Map(teacher.actors.map(a=>[a.id,JSON.stringify(a)])),shots=new Map(teacher.shots.map(s=>[s.id,JSON.stringify(s)]));
 const {actors:ignoredActors,shots:ignoredShots,farm:ignoredFarm,hostEffects:ignoredHostEffects,turrets:ignoredTurrets,...common}=teacher;
 const prefix=JSON.stringify({...common,snapshotSeq,serverNow}).slice(1,-1);
 return (view,scope)=>{
  const header=JSON.stringify({type:'SNAPSHOT',protocolVersion:PROTOCOL_VERSION,...scope}).slice(0,-1);
  const actorJson=view.actors.map(a=>actors.get(a.id)??JSON.stringify(a)).join(','),shotJson=view.shots.map(s=>shots.get(s.id)??JSON.stringify(s)).join(',');
  return header+',"payload":{'+prefix+',"actors":['+actorJson+'],"shots":['+shotJson+'],"farm":'+JSON.stringify(view.farm)+(view.hostEffects?',"hostEffects":'+JSON.stringify(view.hostEffects):'')+(view.turrets?',"turrets":'+JSON.stringify(view.turrets):'')+(view.self?',"self":'+JSON.stringify(view.self):'')+'}}';
 };
}
