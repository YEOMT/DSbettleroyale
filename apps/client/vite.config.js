import {defineConfig} from 'vite';
import {readFileSync} from 'node:fs';
const gameVersion='v'+JSON.parse(readFileSync(new URL('../../package.json',import.meta.url))).version.split('.')[0];
import {fileURLToPath} from 'node:url';
const repo=fileURLToPath(new URL('../../',import.meta.url));
export default defineConfig({define:{__GAME_VERSION__:JSON.stringify(gameVersion)},plugins:[{name:'game-version',transformIndexHtml:html=>html.replaceAll('%GAME_VERSION%',gameVersion)}],root:'apps/client',base:process.env.PAGES_BUILD==='1'?'/DSbettleroyale/':'/',build:{outDir:'../../dist/client',emptyOutDir:true},server:{host:process.env.LAN_HOST||'127.0.0.1',port:5173,strictPort:true,fs:{allow:[repo]},proxy:{'/ws':{target:'ws://127.0.0.1:8080',ws:true},'/version':'http://127.0.0.1:8080','/healthz':'http://127.0.0.1:8080'}}});

