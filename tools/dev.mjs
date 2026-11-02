import {createServer} from 'vite';
import {createGameServer} from '../apps/server/src/main.js';
const server=await createGameServer(),client=await createServer({configFile:'apps/client/vite.config.js'});await client.listen();
console.log('Local game: http://127.0.0.1:5173 — teacher password: local-teacher (development only)');
const close=async()=>{await client.close();await server.close();process.exit(0);};process.once('SIGINT',close);process.once('SIGTERM',close);
