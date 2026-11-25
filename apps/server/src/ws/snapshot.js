import {PROTOCOL_VERSION} from '../../../../packages/protocol/src/index.js';
// The live transport replaces private profiles with a revision using
// Peer.selfState before encoding; reliable PROFILE_STATE owns those values.
const selfKey=Buffer.from(',"self":');
const announcementBlocks=new WeakMap();
// Shared objects are serialized once per generated snapshot, not once per recipient.
// The wire format remains ordinary strict JSON; this introduces no lossy coordinate quantization.
export function snapshotEncoder(teacher,snapshotSeq,serverNow){
 const json=value=>Buffer.from(JSON.stringify(value));
 // Interest-filtered farm arrays share immutable tuples from this prepared
 // frame. Encode each tuple once across recipients; never retain it between
 // snapshots, so pickups, damage, new lives and rematches need no invalidation.
 const farmRows=new WeakMap();
 const farmJson=farm=>{
  if(!farm||typeof farm!=='object'||Array.isArray(farm))return json(farm);
  const fields=[];
  for(const key of Object.keys(farm)){
   const value=farm[key];let encoded;
   if((key==='b'||key==='x')&&Array.isArray(value))encoded='['+Array.from(value,row=>{
    if(!row||typeof row!=='object')return JSON.stringify(row)??'null';
    let text=farmRows.get(row);if(text===undefined){text=JSON.stringify(row)??'null';farmRows.set(row,text);}return text;
   }).join(',')+']';
   else encoded=JSON.stringify(value);
   if(encoded!==undefined)fields.push(JSON.stringify(key)+':'+encoded);
  }
  return Buffer.from('{'+fields.join(',')+'}');
 };
 const actors=new Map(teacher.actors.map(a=>[a.id,json(a)])),shots=new Map(teacher.shots.map(s=>[s.id,json(s)]));
 const {actors:ignoredActors,shots:ignoredShots,farm:ignoredFarm,hostEffects:ignoredHostEffects,turrets:ignoredTurrets,announcements,...common}=teacher;
 let announcementBlock=announcements&&announcementBlocks.get(announcements);
 if(announcements&&!announcementBlock){
  announcementBlock=Buffer.from(',"announcements":'+JSON.stringify(announcements));
  announcementBlocks.set(announcements,announcementBlock);
 }
 const prefix=Buffer.from(',"payload":{'+JSON.stringify({...common,snapshotSeq,serverNow}).slice(1,-1)+',"actors":['),comma=Buffer.from(','),shotsKey=Buffer.from('],"shots":['),farmKey=Buffer.from('],"farm":');
 return (view,scope,deliveredAnnouncement=0)=>{
  const chunks=[Buffer.from(JSON.stringify({type:'SNAPSHOT',protocolVersion:PROTOCOL_VERSION,...scope}).slice(0,-1)),prefix];
  const rows=(values,cache)=>{for(let i=0;i<values.length;i++){if(i)chunks.push(comma);chunks.push(cache.get(values[i].id)??json(values[i]));}};
  rows(view.actors,actors);chunks.push(shotsKey);rows(view.shots,shots);chunks.push(farmKey,farmJson(view.farm));
  for(const key of ['hostEffects','turrets'])if(view[key])chunks.push(Buffer.from(',"'+key+'":'),json(view[key]));
  if(announcementBlock&&announcements.seq>deliveredAnnouncement)chunks.push(announcementBlock);
  if(view.self)chunks.push(selfKey,json(view.self));
  chunks.push(Buffer.from('}}'));return Buffer.concat(chunks);
 };
}
