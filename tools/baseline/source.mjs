import fs from 'node:fs';
import { parse } from 'acorn';
export const html = fs.readFileSync(new URL('../../legacy/v32.1/index.html', import.meta.url), 'utf8');
export const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).filter(s => s.trim());
export function sourceUnits() {
  return scripts.flatMap((source, script) => {
    const ast = parse(source, { ecmaVersion: 'latest', ranges: true, locations: true });
    const body = script === 1 ? ast.body[0].expression.callee.body.body : ast.body;
    return body.map((node, index) => ({ script, index, node, source, code: source.slice(node.start, node.end),
      name: node.id?.name || node.declarations?.map(d => d.id.name).join(',') ||
        node.expression?.callee?.id?.name || node.expression?.left?.property?.name || `statement-${script}-${index}` }));
  });
}
if (process.argv.includes('--inventory')) {
  const units = sourceUnits();
  fs.mkdirSync('artifacts', { recursive: true });
  fs.writeFileSync('artifacts/source-inventory.txt', units.map(u => `${u.script}:${u.index} ${u.node.loc.start.line} ${u.node.type} ${u.name} ${u.code.length}`).join('\n'));
  console.log(`${units.length} source units; artifacts/source-inventory.txt`);
}
