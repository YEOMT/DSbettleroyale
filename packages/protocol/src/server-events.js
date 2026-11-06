// Outbound event coalescing only. Every inner envelope retains its original
// scope and reliable cursor; inbound commands keep their existing strict schema.
export const MAX_EVENT_BATCH=64;
export const MAX_EVENT_BATCH_BYTES=32768;
export function eventBatchMessages(message){
 if(message?.type!=='EVENT_BATCH')return null;
 const messages=message.payload?.messages;
 if(!Array.isArray(messages)||!messages.length||messages.length>MAX_EVENT_BATCH||messages.some(m=>m?.type!=='EVENT'||m.protocolVersion!==message.protocolVersion))throw Error('INVALID_EVENT_BATCH');
 return messages;
}
