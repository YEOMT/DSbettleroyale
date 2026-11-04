import assert from 'node:assert/strict';
import {createPainters} from '../../apps/client/src/render/original-painters.js';
// Inspector of actual painter commands: a missing target must never become (0,0).
const painter=createPainters({}),lines=[],sink={line(...args){lines.push(args.slice(0,4));}};
const row=(kind,geo)=>['',kind,840,320,1,0,40,'#fff',0,0,'',0,0,geo];
painter.brPaintAttack(sink,row('swing',{shape:'target-strike',targetX:null,targetY:null}),1,1);
assert.deepEqual(lines[0],[840,320,880,320]);lines.length=0;
painter.brPaintAttack(sink,row('transit',{points:[840,320,null,null,870,320,880,320]}),1,1);
assert.deepEqual(lines,[[870,320,880,320]]);
console.log('Nullable endpoint, split path and valid terminal segment PASS');
