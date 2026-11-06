import {PROTOCOL_VERSION} from '../../../../packages/protocol/src/index.js';
// Shared objects are serialized once per generated snapshot, not once per recipient.
// The wire format remains ordinary strict JSON; this introduces no lossy coordinate quantization.
export function snapshotEncoder(teacher,snapshotSeq,serverNow){
 const json=value=>Buffer.from(JSON.stringify(value));
 const actors=new Map(teacher.actors.map(a=>[a.id,json(a)])),shots=new Map(teacher.shots.map(s=>[s.id,json(s)]));
 const {actors:ignoredActors,shots:ignoredShots,farm:ignoredFarm,hostEffects:ignoredHostEffects,turrets:ignoredTurrets,...common}=teacher;
 const prefix=Buffer.from(',"payload":{'+JSON.stringify({...common,snapshotSeq,serverNow}).slice(1,-1)+',"actors":['),comma=Buffer.from(','),shotsKey=Buffer.from('],"shots":['),farmKey=Buffer.from('],"farm":');
 return (view,scope)=>{
  const chunks=[Buffer.from(JSON.stringify({type:'SNAPSHOT',protocolVersion:PROTOCOL_VERSION,...scope}).slice(0,-1)),prefix];
  const rows=(values,cache)=>{for(let i=0;i<values.length;i++){if(i)chunks.push(comma);chunks.push(cache.get(values[i].id)??json(values[i]));}};
  rows(view.actors,actors);chunks.push(shotsKey);rows(view.shots,shots);chunks.push(farmKey,json(view.farm));
  for(const key of ['hostEffects','turrets','self'])if(view[key])chunks.push(Buffer.from(',"'+key+'":'),json(view[key]));
  chunks.push(Buffer.from('}}'));return Buffer.concat(chunks);
 };
}
