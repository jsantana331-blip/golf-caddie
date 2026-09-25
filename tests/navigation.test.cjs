const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
 const file=new URL(req.url,'http://localhost').pathname.replace(/^\/golf-caddie\//,'')||'index.html';
 if(file.includes('..')){res.writeHead(404);res.end();return}
 try{const body=fs.readFileSync(path.join(root,file));res.writeHead(200,{'Content-Type':file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.json')?'application/json':'text/html','Cache-Control':'no-store'});res.end(body)}catch{res.writeHead(404);res.end()}
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const url=`http://127.0.0.1:${server.address().port}/golf-caddie/`;
 const browser=await chromium.launch(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{channel:'msedge'});
 try{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const errors=[];context.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));
 let page=await context.newPage();await page.goto(url);
 const key='caddie:/golf-caddie/:memory:v1.3';
 const saved=()=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
 const roundData=r=>{const {page,...data}=r;return data}; // Saved view is not round progression.
 const home=async()=>{await page.locator('[data-course]').waitFor();assert.equal(await page.locator('h1').innerText(),'Where are we playing?');assert.equal(await page.locator('#jump').count(),0)};
 const setup=async()=>{await page.locator('[data-course]').click();await page.locator('[data-tee]').click();};
 const tap=(field,value)=>page.locator(`[data-field="${field}"][data-value="${value}"]`).click();
 await home();assert.equal(await page.locator('#resume-round').count(),0);
 await setup();assert.equal((await saved()).active,null);assert.equal(await page.locator('.screen-course').count(),0);
 await page.locator('#start-round').click();await page.locator('.screen-course').waitFor();
 const initial=(await saved()).active;assert.ok(initial.id&&initial.startedAt);assert.equal(initial.activeHole,1);assert.equal(initial.courseId,'nevel-meade');assert.equal(initial.teeId,'blue');
 await page.locator('#to-game').click();await page.locator('.screen-game').waitFor();await page.locator('#to-hole').click();
 assert.equal(await page.locator('h1').innerText(),'Hole 1');assert.equal(await page.locator('#prev').isDisabled(),true);
 for(let n=1;n<=3;n++){
  await tap('score',5);await tap('tee','Fairway');await tap('gir',true);await tap('putts',2);await tap('penalties',0);await page.locator('#note').fill(`Navigation note ${n}`);
  if(n<3)await page.locator('#next').click();
 }
 await context.grantPermissions(['clipboard-read','clipboard-write']);
 await page.locator('#ask-caddie').click();await page.locator('#just-copy').click();await page.getByText('✓ Context copied — ask away',{exact:true}).waitFor();await page.locator('#close-ask').click();
 const played=roundData((await saved()).active);assert.equal(played.activeHole,3);assert.equal(played.events.length,1);
 // Every hole stays in the round domain, with no Home/Library link or deck counter.
 for(let n=1;n<=18;n++){
  await page.locator('#jump').selectOption(String(n+1));
  assert.equal(await page.locator('#library,#exit-home').count(),0);
  assert.doesNotMatch(await page.locator('.nav').innerText(),/\d+\s*\/\s*21|Course Library|Home/);
  await page.locator('#open-summary').click();await page.locator('#back-active').click();assert.equal(await page.locator('h1').innerText(),'Hole 3');
 }
 assert.deepEqual(roundData((await saved()).active),played);
 // Reference screens and footer arrows return to the actual current hole.
 await page.locator('#jump').selectOption('0');await page.locator('#to-game').click();await page.locator('#next').click();assert.equal(await page.locator('h1').innerText(),'Hole 3');
 await page.locator('#open-summary').click();await page.locator('#prev').click();assert.equal(await page.locator('h1').innerText(),'Hole 3');
 assert.deepEqual(roundData((await saved()).active),played);
 // A failed Exit must keep the golfer in the round with a visible save warning.
 await page.locator('#open-summary').click();
 await page.evaluate(()=>{window.originalSet=Storage.prototype.setItem;Storage.prototype.setItem=()=>{throw Error('Quota exceeded')}});
 await page.locator('#exit-home').click();assert.equal(await page.locator('.screen-summary').count(),1);assert.match(await page.locator('#storage-warning').innerText(),/Quota/);
 await page.evaluate(()=>Storage.prototype.setItem=window.originalSet);
 const beforeExit=await saved();await page.locator('#exit-home').click();await home();assert.deepEqual(await saved(),beforeExit);
 assert.match(await page.locator('.intro').first().innerText(),/Nevel Meade Golf Course · Blue\nHole 3 · \+2/);
 if(process.env.REVIEW_SCREENSHOT)await page.screenshot({path:process.env.REVIEW_SCREENSHOT.replace('.png','-home.png')});
 await page.locator('#resume-round').click();assert.equal(await page.locator('h1').innerText(),'Hole 3');assert.deepEqual(roundData((await saved()).active),played);
 // Any saved round view, including a look-ahead hole, launches Home and resumes Hole 3.
 for(const view of ['0','1','2','15','20']){
  await page.locator('#jump').selectOption(view);const before=await saved();await page.reload();await home();assert.deepEqual(await saved(),before);
  await page.locator('#resume-round').click();assert.equal(await page.locator('h1').innerText(),'Hole 3');assert.deepEqual(await saved(),before);
 }
 await page.close();page=await context.newPage();await page.goto(url);await home();await page.locator('#resume-round').click();assert.equal(await page.locator('h1').innerText(),'Hole 3');
 // Browse/cancel replacement, then resume without any record changes.
 await page.locator('#open-summary').click();await page.locator('#exit-home').click();await setup();const protectedRound=(await saved()).active;
 page.once('dialog',d=>d.dismiss());await page.locator('#start-round').click();assert.deepEqual((await saved()).active,protectedRound);await page.locator('#resume-round').click();
 // All remaining lifecycle actions work with networking disabled.
 await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();await home();await context.setOffline(true);await page.reload();await home();await page.locator('#resume-round').click();
 for(const h of played.config.holes){await page.locator('#jump').selectOption(String(h.n+1));if((await saved()).active.results[h.n]?.score!==h.par)await tap('score',h.par)}
 assert.equal((await saved()).history.length,0);assert.ok((await saved()).active);
 await page.locator('#next').click();await page.locator('.screen-summary').waitFor();assert.equal(await page.locator('.totals .metric b').first().innerText(),'72');
 await page.locator('#copy-coach').click();await page.getByText('Copied',{exact:true}).waitFor();
 const report=(await page.evaluate(()=>navigator.clipboard.readText())).replace(/\r\n/g,'\n');assert.match(report,/Navigation note 3/);
 const beforeFinish=(await saved()).active;
 page.once('dialog',d=>d.dismiss());await page.locator('#complete-round').click();assert.deepEqual((await saved()).active,beforeFinish);
 page.once('dialog',d=>d.accept());await page.locator('#complete-round').click();await home();assert.equal(await page.locator('#resume-round').count(),0);
 const completed=await saved();assert.equal(completed.active,null);assert.equal(completed.history.length,1);assert.deepEqual(completed.history[0].results,beforeFinish.results);assert.deepEqual(completed.history[0].events,beforeFinish.events);
 await page.reload();await home();assert.deepEqual(await saved(),completed);await page.locator('#round-history').click();await page.locator('[data-history]').click();
 assert.equal(await page.locator('tbody tr').count(),18);await page.locator('#copy-coach').click();await page.getByText('Copied',{exact:true}).waitFor();assert.match(await page.evaluate(()=>navigator.clipboard.readText()),/Navigation note 3/);
 await page.reload();await home(); // History never becomes the launch route either.
 await setup();await page.locator('#start-round').click();await page.locator('#to-game').click();await page.locator('#to-hole').click();assert.equal(await page.locator('h1').innerText(),'Hole 1');assert.equal((await saved()).history.length,1);
 assert.deepEqual(errors,[]);await context.close();
 console.log('V1.3.2 navigation: Home launch from all views, setup, current-hole resume, complete-state preservation, reference navigation, protected Exit/replacement, offline finish/history/export and relaunch passed');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());
