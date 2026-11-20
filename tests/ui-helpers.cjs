// Shared public navigation for V1.5 and baseline screenshots of earlier releases.
async function closeScore(page){if(await page.locator('#score-sheet').count())await page.locator('#close-score').click()}
async function openScore(page){if(!await page.locator('#score-sheet').count())await page.locator('#record-score').click()}
async function act(page,selector){await closeScore(page);await page.locator(selector).click()}
async function route(page,index){
 await closeScore(page);const n=Number(index);
 if(n>=2&&n<=19){
  if(!await page.locator('#jump').count()){
   await page.locator('#round-menu').click();await page.locator('[data-section]').filter({hasText:'Current Hole'}).click();
  }
  if(await page.locator('#jump').evaluate(el=>el.tagName==='SELECT'))await page.locator('#jump').selectOption(String(n));
  else{await page.locator('#jump').click();await page.locator(`[data-view-hole="${n-1}"]`).click();}
 }else{await page.locator('#round-menu').click();await page.locator(`[data-section="${n}"]`).click()}
}
async function swipe(page, selector, dx, dy = 0, startX = 160) {
  await page.locator(selector).evaluate((el, { dx, dy, startX }) => {
    const touch = (x, y) => new Touch({ identifier: 1, target: el, clientX: x, clientY: y });
    el.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, touches: [touch(startX, 140)] }));
    const end = touch(startX + dx, 140 + dy);
    el.dispatchEvent(new TouchEvent('touchmove', { bubbles: true, touches: [end] }));
    el.dispatchEvent(new TouchEvent('touchend', { bubbles: true, changedTouches: [end] }));
  }, { dx, dy, startX });
  await page.locator('.swipe-active').waitFor({ state: 'detached' });
}
async function swipeHole(page, direction) {await closeScore(page);await swipe(page,'.recommendation',direction === 'next' ? -110 : 110)}
module.exports={closeScore,openScore,act,route,swipe,swipeHole};
