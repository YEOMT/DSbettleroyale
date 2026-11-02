import {defineConfig} from 'vite';
import {fileURLToPath} from 'node:url';
const repo=fileURLToPath(new URL('../../',import.meta.url));
export default defineConfig({root:'apps/client',base:process.env.PAGES_BUILD==='1'?'/DSbettleroyale/':'/',build:{outDir:'../../dist/client',emptyOutDir:true},server:{host:process.env.LAN_HOST||'127.0.0.1',port:5173,strictPort:true,fs:{allow:[repo]},proxy:{'/ws':{target:'ws://127.0.0.1:8080',ws:true},'/version':'http://127.0.0.1:8080','/healthz':'http://127.0.0.1:8080'}}});

