// Frozen scenes differ from an authoritative overload pause. This local
// timer controller is never reachable through a production HTTP/WS message.
export function freezeableFixture(app,room){
 let frozen=false;
 Object.defineProperty(room,'fixtureFrozen',{get:()=>frozen,set(value){frozen=!!value;frozen?app.simulation.suspend():app.simulation.resume();}});
 return room;
}
