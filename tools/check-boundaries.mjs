import fs from 'node:fs';
import path from 'node:path';
import {parse} from 'acorn';
import * as walk from 'acorn-walk';
import {parse as parseYaml} from 'yaml';
export function checkBoundaries(){let checked=0;function visit(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,e.name);if(e.isDirectory())visit(file);else if(e.name.endsWith('.js')){
 const ast=parse(fs.readFileSync(file,'utf8'),{ecmaVersion:'latest',sourceType:'module'});checked++;const normalized=file.replaceAll('\\','/'),shared=/^packages\/(engine|content|protocol)\//.test(normalized);
 walk.simple(ast,{ImportDeclaration(n){const value=n.source.value;if(shared&&(/^(node:|ws$|pixi|firebase)/.test(value)||value.includes('/apps/')))throw Error('Forbidden shared import '+file+': '+value);if(normalized.startsWith('apps/client/')&&value.includes('/engine/')&&!value.includes('/movement/'))throw Error('Full engine in client '+file);if(normalized.startsWith('apps/server/')&&value.includes('/client/'))throw Error('Client dependency in server');},Identifier(n){if(shared&&['window','document','WebSocket','PIXI','firebase','eval','Function'].includes(n.name))throw Error('Forbidden engine capability '+file+': '+n.name);}});
 }}}visit('apps');visit('packages');console.log('Import/runtime boundary check:',checked,'modules');}
checkBoundaries();
for(const name of fs.readdirSync('.github/workflows'))parseYaml(fs.readFileSync('.github/workflows/'+name,'utf8'),{uniqueKeys:true});
console.log('CI/release/rollback YAML parsed with unique keys.');
