import {test,expect} from '@playwright/test';
for(const mode of ['solo','team-elim','team-capture'])test(`${mode}: original screens, quiz, draft, server battle, results, rematch`,async({browser},testInfo)=>{
 const hc=await browser.newContext(),ac=await browser.newContext(),bc=await browser.newContext({viewport:{width:680,height:480}});
 const host=await hc.newPage(),a=await ac.newPage(),b=await bc.newPage(),errors=[];
 for(const page of [host,a,b])page.on('pageerror',e=>errors.push(e.message));
 await host.goto('/');await host.locator('#ws-host-secret').fill('test-host');await host.locator('#br-create-btn').click();
 await expect(host.locator('#br-host-room')).toBeVisible();await expect(host.locator('#br-room-code')).toHaveText(/^[1-9]\d{5}$/);const code=await host.locator('#br-room-code').innerText();
 for(const [page,name]of [[a,'학생A'],[b,'학생B']]){await page.goto('/?room='+code+'&netdebug=1');await page.locator('#br-player-name').fill(name);await page.locator('#br-join-btn').click();await expect(page.locator('#br-student-wait')).toBeVisible();}
 await host.locator('#br-mode').selectOption(mode);await host.locator('#br-question-bank').evaluate(e=>e.value='단어 | 정답 | 오답1 | 오답2 | 오답3');await host.locator('#br-start-quiz').click();
 await expect(a.locator('#br-quiz')).toBeVisible();await a.getByRole('button',{name:'정답',exact:true}).click();await expect(a.locator('#br-quiz-score')).toHaveText('1');
 await host.locator('#br-skip-to-draft').click();await expect(a.locator('#br-draft')).toBeVisible();await expect(a.locator('#br-draft-name')).not.toHaveText('뽑는 중…');await a.locator('#br-ready-btn').click();await b.locator('#br-ready-btn').click();await host.locator('#br-start-battle').click();
 await expect(a.locator('#br-student-battle')).toBeVisible();await expect(a.locator('#br-battle-status')).toContainText('HP');await a.keyboard.down('d');await a.waitForTimeout(400);await a.keyboard.up('d');await a.locator('#br-attack').click();await a.waitForTimeout(300);
 if(mode==='team-capture'){const camera=host.locator('#br-focus-toggle');await expect(camera).toBeVisible();await expect(camera).toBeDisabled();await expect(camera).toHaveText(/점령전 고정/);}
 await a.screenshot({path:testInfo.outputPath(mode+'-student.png')});await host.screenshot({path:testInfo.outputPath(mode+'-teacher.png')});
 await host.locator('#br-force-end').click();await expect(a.locator('#br-results')).toBeVisible();await expect(a.locator(mode==='team-capture'?'#br-ranking tbody tr':'#br-ranking .br-rank')).toHaveCount(2);await host.locator('#br-rematch-room').click();await expect(a.locator('#br-student-wait')).toBeVisible();
 expect(errors).toEqual([]);await hc.close();await ac.close();await bc.close();
});
