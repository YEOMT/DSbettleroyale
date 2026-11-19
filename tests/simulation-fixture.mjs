// Frozen scenes differ from an authoritative overload pause. This local
// timer controller is never reachable through a production HTTP/WS message.
export function freezeableFixture(app,room){
 let frozen=false;
 Object.defineProperty(room,'fixtureFrozen',{get:()=>frozen,set(value){frozen=!!value;frozen?app.simulation.suspend():app.simulation.resume();}});
 return room;
}

// Direct engine steps bypass SimulationRunner's peer batch. Keep each manual
// authority step atomic on the wire too: a hit and the simultaneous attack
// must not become separate browser tasks with a slow GPU paint between them.
// This is the existing production EVENT_BATCH path, with every event/cursor.
export function batchFixture(room,step){
 const peers=[];for(const m of room.members.values())if(m.connected&&m.peer){peers.push(m.peer);m.peer.beginBatch();}
 try{return step();}finally{for(const peer of peers)peer.endBatch();}
}
