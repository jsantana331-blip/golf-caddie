// Shared public navigation for V1.5 and baseline screenshots of earlier releases.
async function closeScore(page){if(await page.locator('#score-sheet').count())await page.locator('#score-done').click()}
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
module.exports={closeScore,openScore,act,route};
