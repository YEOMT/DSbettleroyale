import assert from 'node:assert/strict';import {auditHarness} from '../fidelity-v33-2/harness.mjs';
const h=await auditHarness({players:2});
try{for(const viewport of [{width:1366,height:768},{width:390,height:844}]){
 await h.student.setViewportSize(viewport);await h.student.locator('#br-open-encyclopedia').click();await h.student.locator('#br-close-encyclopedia').click();
 const box=await h.student.locator('#br-student-wait').boundingBox();assert.ok(box&&box.width>0&&box.x<viewport.width&&box.y<viewport.height);
}assert.deepEqual(h.errors,[]);}finally{await h.close();}
