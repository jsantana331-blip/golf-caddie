const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const {chromium}=require('playwright');
const round=require('../data/current-round.json');
const root=path.resolve(__dirname,'..');
const assets=['index.html','app.js','results.js','styles.css','service-worker.js','manifest.json','data/current-round.json','icons/icon-192.png','icons/icon-512.png'];
let baseline=false;
const server=http.createServer((req,res)=>{
 const file=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/golf-caddie\//,'')||'index.html';
 if(!assets.includes(file)){res.writeHead(404);res.end();return;}
 try{
  const body=baseline?execFileSync('git',['show',`5d1bf91:${file}`],{cwd:root}):fs.readFileSync(path.join(root,file));
  res.writeHead(200,{'Content-Type':file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.json')?'application/json':file.endsWith('.png')?'image/png':'text/html','Cache-Control':'no-store'});res.end(body);
 }catch{res.writeHead(404);res.end();}
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const url=`http://127.0.0.1:${server.address().port}/golf-caddie/`;
 const browser=await chromium.launch(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{channel:'msedge'});
 try{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const errors=[];
 context.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));
 let page=await context.newPage();
 await page.goto(url);await page.locator('#jump').waitFor();
 await page.evaluate(()=>navigator.serviceWorker.ready);
 await page.reload();await page.locator('#jump').waitFor();
 assert.equal(await page.locator('#jump option').count(),21);
 assert.equal(await page.locator('.summaryrow b').allTextContents().then(v=>v.filter(x=>x==='Unknown').length),5);
 assert.ok(!(await page.locator('.content').innerText()).includes(round.mission));
 assert.deepEqual(await page.locator('.metric b').allTextContents(),['Blue','6253','72','70.1','124','4 / 10 / 4']);
 await page.locator('#jump').selectOption('1');
 assert.deepEqual(await page.locator('h2').allTextContents(),['Scoring Mission','Off the Tee','Into the Green','After a Miss','Today’s Focus','Your club distances']);
 assert.equal(await page.locator('.club').count(),12);
 assert.ok((await page.locator('.content').innerText()).includes('60°'));
 const legacyKey='caddie:/golf-caddie/:arp';
 await page.evaluate(k=>localStorage.setItem(k,JSON.stringify({1:'A'})),legacyKey);
 const key='caddie:/golf-caddie/:results:v1.1:'+round.id;
 const saved=()=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
 const tap=(field,value)=>page.locator(`[data-field="${field}"][data-value="${value}"]`).click();
 await page.locator('#jump').selectOption('2');
 await tap('putts',3);await page.locator('#putts').fill('4');await tap('putts',3);
 assert.equal((await saved()).results[1].putts,undefined);
 await tap('penalties',2);await page.locator('#penalties').fill('3');await tap('penalties',2);
 assert.equal((await saved()).results[1].penalties,undefined);
 await tap('score',4);await page.locator('#score').fill('5');
 assert.equal(await page.locator('[data-field="score"][data-value="4"]').getAttribute('aria-pressed'),'false');
 assert.equal(await page.locator('[data-field="score"][data-value="5"]').getAttribute('aria-pressed'),'true');
 await tap('score',5);assert.equal((await saved()).results[1].score,undefined);
 await page.locator('#score').fill('12');assert.equal((await saved()).results[1].score,12);
 await page.locator('#score').fill('');
 for(const h of round.holes){
  await page.locator('#jump').selectOption(String(h.n+1));
  assert.equal(await page.locator('h1').innerText(),`Par ${h.par} · ${h.yards} yd`);
  assert.equal(await page.locator('.hero .strategy').innerText(),h.advice);
  await tap('score',h.par+(h.n%3)-1);
  if(h.par===3){assert.equal(await page.locator('[data-field="tee"]').count(),0);assert.match(await page.locator('.na').innerText(),/N\/A/);}
  else await tap('tee',h.n%2?'Fairway':'Left');
  await tap('gir',h.n%2===1);
  await tap('putts',2);await tap('penalties',0);
  await page.locator('#note').fill(`Hole ${h.n} <safe> & sound`);
 }
 const expected=(await saved()).results;
 await page.reload();await page.locator('#jump').waitFor();
 assert.equal(await page.locator('#jump').inputValue(),'19');
 assert.deepEqual((await saved()).results,expected);
 await page.close();page=await context.newPage();await page.goto(url);await page.locator('#jump').waitFor();
 assert.deepEqual((await saved()).results,expected);
 assert.equal(await page.evaluate(k=>localStorage.getItem(k),legacyKey),'{"1":"A"}');
 await page.locator('#jump').selectOption('20');
 assert.deepEqual(await page.locator('.metric b').allTextContents(),['72','E','36','36']);
 assert.deepEqual(await page.locator('.summaryrow b').allTextContents(),['6 / 14','9 / 18','36','0']);
 assert.equal(await page.locator('tbody tr').count(),18);
 for(const h of round.holes){
  const cells=await page.locator('tbody tr').nth(h.n-1).locator('td').allTextContents();
  assert.deepEqual(cells,[String(h.par),String(expected[h.n].score),h.par===3?'N/A':expected[h.n].tee,h.n%2?'Yes':'No','2','0',`Hole ${h.n} <safe> & sound`]);
 }
 assert.equal(await page.locator('script').count(),2);
 for(const size of [{width:320,height:568},{width:390,height:844},{width:844,height:390},{width:390,height:400}]){
  await page.setViewportSize(size);
  for(const index of ['0','1','2','20']){
   await page.locator('#jump').selectOption(index);
   const layout=await page.evaluate(()=>{const nav=document.querySelector('.nav').getBoundingClientRect(),c=document.querySelector('.content');c.scrollTop=c.scrollHeight;return {navBottom:nav.bottom,navTop:nav.top,width:document.documentElement.scrollWidth,inner:innerWidth,scroll:c.scrollTop,overflow:c.scrollHeight>c.clientHeight};});
   assert.ok(layout.navBottom<=size.height+1&&layout.navTop>=0,JSON.stringify(layout));assert.ok(layout.width<=layout.inner);
   if(layout.overflow)assert.ok(layout.scroll>0);
  }
 }
 await page.setViewportSize({width:390,height:844});await page.locator('#jump').selectOption('2');
 const swipe=async(selector,dx,dy=0)=>page.locator(selector).evaluate((el,{dx,dy})=>{
  const touch=(x,y)=>new Touch({identifier:1,target:el,clientX:x,clientY:y});
  el.dispatchEvent(new TouchEvent('touchstart',{bubbles:true,touches:[touch(200,200)]}));
  el.dispatchEvent(new TouchEvent('touchend',{bubbles:true,changedTouches:[touch(200+dx,200+dy)]}));
 },{dx,dy});
 await swipe('#note',-120);assert.equal(await page.locator('#jump').inputValue(),'2');
 await swipe('.hero',-120,150);assert.equal(await page.locator('#jump').inputValue(),'2');
 await swipe('.hero',-120);assert.equal(await page.locator('#jump').inputValue(),'3');
 await page.locator('#prev').click();assert.equal(await page.locator('#jump').inputValue(),'2');
 await page.locator('#next').click();assert.equal(await page.locator('#jump').inputValue(),'3');
 await context.setOffline(true);await page.reload();await page.locator('#jump').waitFor();
 assert.deepEqual((await saved()).results,expected);
 await page.locator('#jump').selectOption('20');assert.equal(await page.locator('tbody tr').count(),18);
  await context.setOffline(false);
 await page.locator('[data-hole="1"]').click();
 await page.locator('#score').fill('12');
 await tap('putts',3);await page.locator('#putts').fill('4');
 await tap('penalties',2);await page.locator('#penalties').fill('3');
 await page.locator('#jump').selectOption('20');
 assert.deepEqual(await page.locator('.metric b').allTextContents(),['80','+8','44','36']);
 assert.deepEqual(await page.locator('.summaryrow b').allTextContents(),['6 / 14','9 / 18','38','3']);
 await page.locator('.content').evaluate(el=>el.scrollTop=0);
 if(process.env.REVIEW_SCREENSHOT)await page.screenshot({path:process.env.REVIEW_SCREENSHOT});
 page.once('dialog',dialog=>dialog.dismiss());await page.locator('#new-round').click();
 assert.equal(Object.keys((await saved()).results).length,18);
 page.once('dialog',dialog=>dialog.accept());await page.locator('#new-round').click();
 assert.deepEqual((await saved()).results,{});assert.equal(await page.locator('#jump').inputValue(),'0');
 await page.locator('#jump').selectOption('2');await tap('score',3);
 await page.locator('#jump').selectOption('20');
 assert.deepEqual(await page.locator('.metric b').allTextContents(),['3','-1','3 (1/9 holes)','—']);
 await context.close();
 console.log('Mobile UI: 18 holes, all tracking, grouped toggles, persistence, summaries, layouts, swipe protection and offline reload passed');
 // Install the production worker first, then exercise an online update and offline relaunch.
 baseline=true;
 const upgrade=await browser.newContext();const old=await upgrade.newPage();old.on('pageerror',e=>errors.push(e.message));await old.goto(url);
 await old.evaluate(()=>navigator.serviceWorker.ready);await old.reload();
 await old.evaluate(()=>caches.open('unrelated-cache'));
 baseline=false;
 await old.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();await r.update();});
 await old.waitForFunction(async()=>{const keys=await caches.keys();return keys.includes('caddie-v1.1-round-results-2')&&!keys.includes('caddie-v1.1');});
 await old.reload();await old.locator('#jump').waitFor();
 assert.ok((await old.evaluate(()=>caches.keys())).includes('unrelated-cache'));
 await upgrade.setOffline(true);await old.reload();await old.locator('#jump').waitFor();
 assert.equal(await old.locator('#jump option').count(),21);
  await upgrade.close();
 const blocked=await browser.newContext();
 await blocked.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new Error('Storage blocked');}}));
 const unavailable=await blocked.newPage();await unavailable.goto(url);await unavailable.locator('#jump').selectOption('2');
 await unavailable.locator('[data-field="score"][data-value="4"]').click();
 assert.match(await unavailable.locator('#save-status').innerText(),/Unable to save/);
 await unavailable.locator('#jump').selectOption('20');assert.equal(await unavailable.locator('.metric b').first().innerText(),'4');
 await blocked.close();assert.deepEqual(errors,[]);
 console.log('Production service-worker upgrade, unrelated cache preservation and offline V1.1 shell passed; no page errors');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.close());
