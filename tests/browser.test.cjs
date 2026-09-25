const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const {chromium}=require('playwright');
const round=require('./fixtures/v1-round.json');
const root=path.resolve(__dirname,'..');
const oldAssets=['index.html','app.js','results.js','styles.css','service-worker.js','manifest.json','data/current-round.json','icons/icon-192.png','icons/icon-512.png'];
const assets=[...oldAssets.filter(f=>f!=='data/current-round.json'),'memory.js','caddie-context.js','handoff.js','external-coach.js','data/player.json','data/courses/index.json','data/courses/nevel-meade.json'];
const baselineRef=process.env.UPGRADE_BASELINE||'903da2e';
const baselineFiles=baselineRef==='903da2e'?oldAssets:baselineRef==='a587a77'?assets.filter(f=>f!=='external-coach.js'):assets;
const baselineAssets=Object.fromEntries(baselineFiles.map(file=>[file,execFileSync('git',['show',`${baselineRef}:${file}`],{cwd:root})]));
let baseline=false;
const server=http.createServer((req,res)=>{
 const file=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/golf-caddie\//,'')||'index.html';
 if(!(baseline?baselineFiles:assets).includes(file)){res.writeHead(404);res.end();return;}
 try{
  const body=baseline?baselineAssets[file]:fs.readFileSync(path.join(root,file));
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
 await page.goto(url);
 const chooseCourse=async()=>{await page.locator('[data-course="nevel-meade"]').click();await page.locator('[data-tee="blue"]').click();};
 await chooseCourse();await page.locator('#start-round').click();await page.locator('#jump').selectOption('0');
 await page.evaluate(()=>navigator.serviceWorker.ready);
 await page.reload();await page.locator('#resume-round').click();await page.locator('#jump').waitFor();await page.locator('#jump').selectOption('0');
 assert.equal(await page.locator('#jump option').count(),21);
 assert.deepEqual(await page.locator('.summaryrow b').allTextContents(),['Scottish-inspired links-style','Bentgrass greens & fairways','Yes · Full-service','Yes','Unknown']);
 assert.ok(!(await page.locator('.content').innerText()).includes(round.mission));
 assert.deepEqual(await page.locator('.metric b').allTextContents(),['Blue','6253','72','70.1','124','4 / 10 / 4']);
 if(process.env.REVIEW_SCREENSHOT)await page.screenshot({path:process.env.REVIEW_SCREENSHOT.replace('.png','-course.png')});
 await page.locator('#jump').selectOption('1');
 assert.deepEqual(await page.locator('h2').allTextContents(),['Scoring Mission','Off the Tee','Into the Green','After a Miss','Today’s Focus','Your club distances']);
 assert.equal(await page.locator('.club').count(),12);
 assert.ok((await page.locator('.content').innerText()).includes('60°'));
 if(process.env.REVIEW_SCREENSHOT)await page.screenshot({path:process.env.REVIEW_SCREENSHOT.replace('.png','-game.png')});
 const legacyKey='caddie:/golf-caddie/:arp';
 await page.evaluate(k=>localStorage.setItem(k,JSON.stringify({1:'A'})),legacyKey);
 const key='caddie:/golf-caddie/:memory:v1.3';
 const oldKey='caddie:/golf-caddie/:results:v1.1:'+round.id;
 const saved=()=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)).active,key);
 const tap=(field,value)=>page.locator(`[data-field="${field}"][data-value="${value}"]`).click();
 await page.locator('#jump').selectOption('2');
 await tap('putts',3);await page.locator('#putts').fill('4');await tap('putts',3);
 assert.equal((await saved()).results[1].putts,undefined);
 await tap('penalties',2);await page.locator('#penalties').fill('3');await tap('penalties',2);
 assert.equal((await saved()).results[1].penalties,undefined);
 assert.equal(await page.locator('#score').count(),0);
 assert.deepEqual(await page.locator('[data-field="score"][data-value]').allTextContents(),['3','4','5','6','7+']);
 await tap('score',4);assert.equal((await saved()).results[1].score,4);assert.equal(await page.locator('#score').count(),0);
 await tap('score',7);assert.equal((await saved()).results[1].score,7);await page.locator('#score').fill('12');
 assert.equal((await saved()).results[1].score,12);
 assert.equal(await page.locator('[data-score-plus]').getAttribute('aria-pressed'),'true');
 await page.reload();await page.locator('#resume-round').click();await page.locator('#score').waitFor();assert.equal(await page.locator('#score').inputValue(),'12');
 await tap('score',7);assert.equal((await saved()).results[1].score,undefined);assert.equal(await page.locator('#score').count(),0);
 await tap('score',7);await page.locator('#score').fill('1');assert.equal((await saved()).results[1].score,1);
 await page.reload();await page.locator('#resume-round').click();await page.locator('#score').waitFor();assert.equal(await page.locator('#score').inputValue(),'1');
 await tap('score',5);assert.equal((await saved()).results[1].score,5);assert.equal(await page.locator('#score').count(),0);
 await tap('score',5);assert.equal((await saved()).results[1].score,undefined);
 for(const h of round.holes){
  await page.locator('#jump').selectOption(String(h.n+1));
  assert.equal(await page.locator('h1').innerText(),`Hole ${h.n}`);
  assert.equal(await page.locator('.hero .strategy').innerText(),h.advice);
  assert.equal(await page.locator('.recommended-club').textContent(),h.teeClub);
  assert.equal(await page.locator('.target').innerText(),h.target);
  assert.deepEqual(await page.locator('.reference dd').allTextContents(),[h.danger,h.expected]);
  assert.ok((await page.locator('.active-context').innerText()).startsWith('Playing Hole '));
  assert.equal(await page.locator('.hole-distance span').innerText(),`Par ${h.par} · HCP ${h.hcp}`);
  assert.equal(await page.locator('.hole-distance b').innerText(),`${h.yards} yd`);
  assert.equal(await page.locator('#score').count(),0);
  await tap('score',h.par+3);await page.locator('#score').fill('15');
  assert.equal((await saved()).results[h.n].score,15);
  await tap('score',h.par+(h.n%3)-1);
  assert.equal(await page.locator('#score').count(),0);
  if(h.par===3){assert.equal(await page.locator('[data-field="tee"]').count(),0);assert.match(await page.locator('.na').innerText(),/N\/A/);}
  else await tap('tee',h.n%2?'Fairway':'Left');
  await tap('gir',h.n%2===1);
  await tap('putts',2);await tap('penalties',0);
  await page.locator('#note').fill(`Hole ${h.n} <safe> & sound`);
 }
 const expected=(await saved()).results;
 await page.reload();await page.locator('#resume-round').click();await page.locator('#jump').waitFor();
 assert.equal(await page.locator('#jump').inputValue(),'19');
 assert.deepEqual((await saved()).results,expected);
 await page.close();page=await context.newPage();await page.goto(url);await page.locator('#resume-round').click();await page.locator('#jump').waitFor();
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
 assert.equal(await page.locator('script').count(),6);
 await context.grantPermissions(['clipboard-read','clipboard-write']);
 await page.locator('#copy-coach').click();await page.getByText('Copied',{exact:true}).waitFor();
 const clipboard=(await page.evaluate(()=>navigator.clipboard.readText())).replace(/\r\n/g,'\n');
 assert.equal(clipboard,require('../caddie-context.js').full(await saved()));
 assert.equal((clipboard.match(/^Hole \d+ \|/gm)||[]).length,18);
 assert.equal(await page.locator('#back-active').count(),1);
 // A rejected clipboard call must expose the complete report for manual copying.
 await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw Error('Denied')}}}));
 await page.locator('#copy-coach').click();await page.locator('#copy-fallback').waitFor({state:'visible'});
 assert.equal(await page.locator('#coach-text').inputValue(),clipboard);
 await page.locator('#select-report').click();
 assert.equal(await page.locator('#coach-text').evaluate(el=>el.selectionEnd-el.selectionStart),clipboard.length);
 await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:undefined}));
 await page.locator('#copy-coach').click();assert.equal(await page.locator('#coach-text').inputValue(),clipboard);
 await page.reload();await page.locator('#resume-round').click();await page.locator('#jump').waitFor();
 for(const size of [{width:320,height:568},{width:390,height:844},{width:844,height:390},{width:390,height:400},{width:1280,height:800}]){
  await page.setViewportSize(size);
  for(const index of ['0','1','2','20']){
   await page.locator('#jump').selectOption(index);
   assert.equal(await page.locator('.card').count(),0);
   for(const control of await page.locator('.nav button,.nav select').all()){
    const box=await control.boundingBox();assert.ok(box.width>=44&&box.height>=44,JSON.stringify(box));
   }
   if(index==='2'){
    const sizes=await page.evaluate(()=>({club:parseFloat(getComputedStyle(document.querySelector('.recommended-club')).fontSize),tracker:parseFloat(getComputedStyle(document.querySelector('.tracker h2')).fontSize)}));
    assert.ok(sizes.club>=sizes.tracker*2);
   }
   const layout=await page.evaluate(()=>{const nav=document.querySelector('.nav').getBoundingClientRect(),c=document.querySelector('.content');c.scrollTop=c.scrollHeight;return {navBottom:nav.bottom,navTop:nav.top,width:document.documentElement.scrollWidth,inner:innerWidth,scroll:c.scrollTop,overflow:c.scrollHeight>c.clientHeight};});
   assert.ok(layout.navBottom<=size.height+1&&layout.navTop>=0,JSON.stringify(layout));assert.ok(layout.width<=layout.inner);
   if(layout.overflow)assert.ok(layout.scroll>0);
  }
 }
 // Check the actual palette for small-text contrast, including selected controls.
 const contrast=await page.evaluate(()=>{
  const css=getComputedStyle(document.documentElement);
  const luminance=hex=>{const rgb=hex.trim().slice(1).match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722};
  const ratio=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
  return ['--ink','--green','--muted','--earth'].map(name=>ratio(css.getPropertyValue(name),css.getPropertyValue('--cream'))).concat(ratio(css.getPropertyValue('--green'),css.getPropertyValue('--paper')),ratio(css.getPropertyValue('--ink'),'#e7e9e0'));
 });
 assert.ok(contrast.every(value=>value>=4.5),JSON.stringify(contrast));
 await page.setViewportSize({width:390,height:844});await page.locator('#jump').selectOption('2');
 for(const control of await page.locator('.choices button').all()){
  const box=await control.boundingBox();assert.ok(box.width>=44&&box.height>=48,JSON.stringify(box));
 }
 // Simulate nonzero portrait and landscape safe-area padding; actual iOS inset values require device acceptance.
 for(const insets of [[47,0,34,0],[0,47,21,47]]){
  const style=await page.addStyleTag({content:`body { padding: ${insets.map(n=>n+'px').join(' ')}; }`});
  const box=await page.locator('.nav').boundingBox();
  assert.ok(box.y+box.height<=844-insets[2]+1&&box.x>=insets[3]&&box.x+box.width<=390-insets[1]+1);
  await style.evaluate(el=>el.remove());
 }

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
 await context.setOffline(true);await page.reload();await page.locator('#resume-round').click();await page.locator('#jump').waitFor();
 assert.deepEqual((await saved()).results,expected);
 await page.locator('#jump').selectOption('20');assert.equal(await page.locator('tbody tr').count(),18);
  await context.setOffline(false);
 await page.locator('[data-hole="1"]').click();
 await tap('score',7);await page.locator('#score').fill('12');
 await tap('putts',3);await page.locator('#putts').fill('4');
 await tap('penalties',2);await page.locator('#penalties').fill('3');
 await page.locator('#jump').selectOption('20');
 assert.deepEqual(await page.locator('.metric b').allTextContents(),['80','+8','44','36']);
 assert.deepEqual(await page.locator('.summaryrow b').allTextContents(),['6 / 14','9 / 18','38','3']);
 await page.locator('.content').evaluate(el=>el.scrollTop=0);
 if(process.env.REVIEW_SCREENSHOT)await page.screenshot({path:process.env.REVIEW_SCREENSHOT});
 await page.locator('#exit-home').click();await chooseCourse();
 page.once('dialog',dialog=>dialog.dismiss());await page.locator('#start-round').click();
 assert.equal(Object.keys((await saved()).results).length,18);
 page.once('dialog',dialog=>dialog.accept());await page.locator('#start-round').click();
 assert.deepEqual((await saved()).results,{});assert.equal(await page.locator('#jump').inputValue(),'0');
 await page.locator('#jump').selectOption('2');await tap('score',3);
 await page.locator('#jump').selectOption('20');
 assert.deepEqual(await page.locator('.metric b').allTextContents(),['3','-1','3 (1/9 holes)','—']);
 // Migrate V1.1 results while the saved page is a look-ahead hole, not the active hole.
 const firstEight=Object.fromEntries(round.holes.slice(0,8).map(h=>[h.n,{score:h.par}]));
 await page.evaluate(({key,oldKey,results})=>{localStorage.removeItem(key);localStorage.setItem(oldKey,JSON.stringify({version:1,startedAt:'2026-09-19',results,page:15}));},{key,oldKey,results:firstEight});
 await page.reload();await page.locator('#resume-round').click();await page.locator('#jump').waitFor();
 assert.equal(await page.locator('#jump').inputValue(),'9');
 await page.locator('#open-summary').click();assert.equal(await page.locator('#back-active').innerText(),'Back to Hole 8');
 if(process.env.REVIEW_SCREENSHOT)await page.screenshot({path:process.env.REVIEW_SCREENSHOT.replace('.png','-partial.png')});
 await page.locator('#copy-coach').click();await page.getByText('Copied',{exact:true}).waitFor();
 assert.equal((await page.evaluate(()=>navigator.clipboard.readText())).replace(/\r\n/g,'\n'),require('../caddie-context.js').full(await saved()));
 await page.reload();await page.locator('#resume-round').click();await page.locator('#open-summary').click();await page.locator('#back-active').waitFor();assert.equal((await saved()).activeHole,8);
 await page.locator('#back-active').click();assert.equal(await page.locator('#jump').inputValue(),'9');
 if(process.env.REVIEW_SCREENSHOT)await page.screenshot({path:process.env.REVIEW_SCREENSHOT.replace('.png','-hole.png')});
 // Every hole offers a direct summary action; browsing never changes activeHole.
 for(const h of round.holes){await page.locator('#jump').selectOption(String(h.n+1));await page.locator('#open-summary').click();assert.equal(await page.locator('#back-active').innerText(),'Back to Hole 8');}
 await page.locator('[data-hole="1"]').click();await tap('score',6);
 await page.locator('#open-summary').click();assert.equal(await page.locator('#back-active').innerText(),'Back to Hole 8');
 await page.locator('#back-active').click();await page.locator('#next').click();assert.equal((await saved()).activeHole,9);
 await page.locator('#next').click();assert.equal((await saved()).activeHole,9); // Unscored nine: viewing ten is only browsing.
 await page.locator('#jump').selectOption('15');await page.locator('#next').click();assert.equal((await saved()).activeHole,9);
 await page.locator('#open-summary').click();await page.locator('#back-active').click();
 await tap('score',4);await swipe('.hero',-120);assert.equal((await saved()).activeHole,10);
 await page.close();page=await context.newPage();await page.goto(url);await page.locator('#resume-round').click();await page.locator('#jump').waitFor();
 assert.equal((await saved()).activeHole,10);
 await context.setOffline(true);await page.reload();await page.locator('#resume-round').click();await page.locator('#open-summary').click();
 assert.equal(await page.locator('#back-active').innerText(),'Back to Hole 10');
 await page.locator('#copy-coach').click();await page.getByText('Copied',{exact:true}).waitFor();
 assert.ok((await page.evaluate(()=>navigator.clipboard.readText())).includes('Round status: In Progress'));
 await page.locator('#back-active').click();assert.equal(await page.locator('#jump').inputValue(),'11');
 await tap('tee','Left');assert.equal((await saved()).activeHole,10);
 await page.locator('#jump').selectOption('15');await tap('tee','Right');assert.equal((await saved()).activeHole,14);
 await page.locator('#open-summary').click();await page.locator('#exit-home').click();await chooseCourse();page.once('dialog',dialog=>dialog.accept());await page.locator('#start-round').click();
 assert.equal((await saved()).activeHole,1);
 await context.close();
 console.log('Clipboard success/failure/unavailable, partial export, migration, active-hole browsing/progression and offline persistence passed');
 console.log('Mobile UI: 18 holes, all tracking, grouped toggles, persistence, summaries, layouts, swipe protection and offline reload passed');
 // Install the production worker first, then exercise an online update and offline relaunch.
 baseline=true;
 const upgrade=await browser.newContext();await upgrade.setOffline(false);const old=await upgrade.newPage();old.on('pageerror',e=>errors.push(e.message));await old.goto(url);
 await old.evaluate(()=>navigator.serviceWorker.ready);await old.reload();
 if(baselineRef!=='903da2e'){await old.locator('[data-course]').click();await old.locator('[data-tee]').click();await old.locator('#to-game').click();await old.locator('#start-round').click();}
 await old.locator('#jump').selectOption('9');await old.locator('[data-field="score"][data-value="3"]').click();
 await old.evaluate(()=>caches.open('unrelated-cache'));
 baseline=false;
 await old.evaluate(async()=>{
  const previous=navigator.serviceWorker.controller;
  const changed=new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));
  const registration=await navigator.serviceWorker.getRegistration();await registration.update();
  if(navigator.serviceWorker.controller===previous)await changed;
 });
 await old.waitForFunction(()=>navigator.serviceWorker.controller?.state==='activated');
 await old.reload();await old.locator('#resume-round').click();await old.locator('#jump').waitFor();
 assert.ok((await old.evaluate(()=>caches.keys())).includes('unrelated-cache'));
 await upgrade.setOffline(true);await old.reload();await old.locator('#resume-round').click();await old.locator('#jump').waitFor();
 assert.equal(await old.locator('#jump option').count(),21);
 assert.equal(await old.locator('#jump').inputValue(),'9');
 assert.equal(await old.locator('[data-field="score"][data-value="3"]').getAttribute('aria-pressed'),'true');
 const upgraded=await old.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);assert.equal(upgraded.active.results[8].score,3);assert.equal(upgraded.active.activeHole,8);
 if(baselineRef==='903da2e')assert.equal(await old.evaluate(k=>JSON.parse(localStorage.getItem(k)).results[8].score,oldKey),3);
 await old.locator('#jump').selectOption('20');await old.locator('#copy-coach').waitFor();
 assert.ok((await old.evaluate(()=>caches.keys())).includes('caddie-v1.3.2-round-navigation-1'));
  await upgrade.close();
 const blocked=await browser.newContext();
 await blocked.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new Error('Storage blocked');}}));
 const unavailable=await blocked.newPage();await unavailable.goto(url);await unavailable.locator('[data-course]').click();await unavailable.locator('[data-tee]').click();await unavailable.locator('#start-round').click();await unavailable.locator('#to-game').click();await unavailable.locator('#to-hole').click();
 await unavailable.locator('[data-field="score"][data-value="4"]').click();
 assert.match(await unavailable.locator('#save-status').innerText(),/Unable to save/);
 await unavailable.locator('#jump').selectOption('20');assert.equal(await unavailable.locator('.metric b').first().innerText(),'4');
 await blocked.close();assert.deepEqual(errors,[]);
 console.log('Production service-worker upgrade, unrelated cache preservation and offline V1.1 shell passed; no page errors');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.close());
