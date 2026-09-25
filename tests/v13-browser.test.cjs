const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const M=require('../memory.js'),C=require('../caddie-context.js'),course=require('../data/courses/nevel-meade.json');
const fixture=M.clone(course);fixture.id='test-fixture';fixture.course='TEST FIXTURE — NOT A REAL COURSE';
const short=M.clone(fixture.tees[0]);short.id='short';short.name='Test Short';short.holes=short.holes.map(h=>({...h,yards:h.yards-20,advice:'Fixture advice only'}));short.totalYards-=360;short.rating='65.0';short.slope='100';short.mission='Fixture mission';fixture.tees.push(short);
const root=path.resolve(__dirname,'..'),catalog=require('../data/courses/index.json');
const testCatalog={...catalog,courses:[...catalog.courses,{id:fixture.id,file:'test-fixture.json'}]};
const server=http.createServer((req,res)=>{
 const file=new URL(req.url,'http://localhost').pathname.replace(/^\/golf-caddie\//,'')||'index.html';
 if(file.includes('..')){res.writeHead(404);res.end();return}
 try{const body=file==='data/courses/index.json'?JSON.stringify(testCatalog):file==='data/courses/test-fixture.json'?JSON.stringify(fixture):fs.readFileSync(path.join(root,file));res.writeHead(200,{'Content-Type':file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.json')?'application/json':'text/html','Cache-Control':'no-store'});res.end(body)}catch{res.writeHead(404);res.end()}
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${server.address().port}/golf-caddie/`;
 const browser=await chromium.launch(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{channel:'msedge'});
 try{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const errors=[];context.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));
 let page=await context.newPage();await page.goto(url);await page.locator('[data-course]').first().waitFor();
 const key='caddie:/golf-caddie/:memory:v1.3',saved=()=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
 const choose=async(id='nevel-meade',tee='blue')=>{await page.locator(`[data-course="${id}"]`).click();await page.locator(`[data-tee="${tee}"]`).click();};
 const tap=async(field,value)=>page.locator(`[data-field="${field}"][data-value="${value}"]`).click();
 assert.equal(await page.locator('[data-course]').count(),2);assert.equal(await page.locator('.card').count(),0);
 if(process.env.REVIEW_SCREENSHOT)await page.screenshot({path:process.env.REVIEW_SCREENSHOT.replace('.png','-library.png')});
 await choose();assert.equal(await page.locator('#jump option').count(),2);await page.locator('#to-game').click();await page.locator('#start-round').click();
 const firstId=(await saved()).active.id;assert.equal(await page.locator('h1').innerText(),'Hole 1');
 for(const h of course.tees[0].holes){await page.locator('#jump').selectOption(String(h.n+1));assert.equal(await page.locator('#ask-caddie').innerText(),'ASK CADDIE\n✦')}
 await page.locator('#jump').selectOption('2');await tap('score',5);await tap('tee','Left');await tap('gir',false);await tap('putts',3);await tap('penalties',1);await page.locator('#note').fill('Driver leaked right <safe>');
 await page.locator('#next').click();assert.equal((await saved()).active.activeHole,2);
 await tap('putts',2);await tap('penalties',0); // Unfinished hole metrics must not contaminate live completed-hole metrics.
 await page.locator('#jump').selectOption('15');await page.locator('#ask-caddie').click();
 assert.ok((await page.locator('#ask-sheet').innerText()).includes('active Hole 2'));
 for(const size of [{width:320,height:568},{width:844,height:390},{width:390,height:400},{width:390,height:844}]){
  await page.setViewportSize(size);const box=await page.locator('#ask-sheet').boundingBox();assert.ok(box.x>=0&&box.y>=0&&box.x+box.width<=size.width+1&&box.y+box.height<=size.height+1,JSON.stringify(box));
  for(const id of ['#copy-open','#just-copy','#close-ask']){const target=await page.locator(id).boundingBox();assert.ok(target.height>=44&&target.width>=44)}
 }
 if(process.env.REVIEW_SCREENSHOT)await page.screenshot({path:process.env.REVIEW_SCREENSHOT.replace('.png','-ask.png')});
 await context.grantPermissions(['clipboard-read','clipboard-write']);await page.locator('#just-copy').click();await page.getByText('✓ Context copied — ask away',{exact:true}).waitFor();
 let record=(await saved()).active;assert.equal(record.events.length,1);assert.equal(record.events[0].hole,2);assert.equal(record.events[0].score,5);assert.equal(record.events[0].relative,1);assert.equal(record.events[0].roundId,firstId);
 const text=(await page.evaluate(()=>navigator.clipboard.readText())).replace(/\r\n/g,'\n');assert.equal(text,C.live(record));assert.ok(text.includes('Current: Hole 2'));assert.ok(text.includes('Putts: 3 (1 holes recorded)'));assert.ok(text.includes('FIR: 0/1'));assert.ok(text.includes('Driver leaked right <safe>'));
 // Copy must finish before opening. An open error must not turn a successful copy into a failed handoff.
 await page.evaluate(()=>{window.testOrder=[];Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{window.testOrder.push('copy')}}});window.open=()=>{window.testOrder.push('open');throw Error('Popup blocked')}});
 await page.locator('#copy-open').click();await page.waitForFunction(()=>window.testOrder.length===2);assert.deepEqual(await page.evaluate(()=>window.testOrder),['copy','open']);assert.equal((await saved()).active.events.length,2);assert.equal((await saved()).active.activeHole,2);
 // Installed PWA uses a reliable explicit link, not a popup.
 await page.evaluate(()=>{Object.defineProperty(navigator,'standalone',{configurable:true,value:true});window.testOrder=[]});await page.locator('#copy-open').click();await page.waitForFunction(()=>window.testOrder.length===1);assert.deepEqual(await page.evaluate(()=>window.testOrder),['copy']);assert.equal(await page.locator('#open-chatgpt').isVisible(),true);
 const beforeFail=(await saved()).active;
 await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw Error('Denied')}}}));
 await page.locator('#copy-open').click();await page.locator('#ask-fallback').waitFor({state:'visible'});assert.deepEqual((await saved()).active,beforeFail);assert.equal(await page.locator('#live-text').inputValue(),C.live(beforeFail));
 await page.locator('#select-context').click();assert.equal(await page.locator('#live-text').evaluate(el=>el.selectionEnd-el.selectionStart),(await page.locator('#live-text').inputValue()).length);
 await page.locator('#confirm-copy').click();assert.equal((await saved()).active.events.length,4);assert.equal(await page.locator('#confirm-copy').isDisabled(),true);
 await page.locator('#close-ask').click();assert.equal(await page.locator('#jump').inputValue(),'15');
 // Browsing the library and other tees never replaces an active scorecard.
 const preserved=(await saved()).active;
 await page.locator('#library').click();await choose('test-fixture','short');assert.deepEqual((await saved()).active,preserved);
 assert.deepEqual(await page.locator('.course-primary .metric b').allTextContents(),['Test Short','5893','72']);assert.deepEqual(await page.locator('.course-secondary .metric b').allTextContents(),['65.0','100','4 / 10 / 4']);
 await page.locator('#to-game').click();assert.equal(await page.locator('.mission .strategy').innerText(),'Fixture mission');
 page.once('dialog',d=>d.dismiss());await page.locator('#start-round').click();assert.deepEqual((await saved()).active,preserved);
 await page.locator('#resume-round').click();await page.locator('#open-summary').click();await page.locator('#back-active').click();assert.equal(await page.locator('h1').innerText(),'Hole 2');
 await page.reload();await page.locator('#jump').waitFor();assert.equal((await saved()).active.activeHole,2);
 await page.locator('#open-summary').click();page.once('dialog',d=>{assert.match(d.message(),/every hole/);d.accept()});await page.locator('#complete-round').click();assert.equal((await saved()).history.length,0);
 for(const h of course.tees[0].holes){await page.locator('#jump').selectOption(String(h.n+1));if((await saved()).active.results[h.n]?.score!==h.par)await tap('score',h.par)}
 await page.locator('#open-summary').click();
 // Quota failure must not clear the active round or pretend the archive succeeded.
 await page.evaluate(()=>{window.originalSet=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw Error('Quota exceeded')}});
 let dialogs=0;page.on('dialog',async d=>{dialogs++;await d.accept()});await page.locator('#complete-round').click();page.removeAllListeners('dialog');assert.equal(dialogs,2);assert.ok((await saved()).active);assert.equal((await saved()).history.length,0);
 await page.evaluate(()=>Storage.prototype.setItem=window.originalSet);
 page.once('dialog',d=>d.accept());await page.locator('#complete-round').click();let mem=await saved();assert.equal(mem.active,null);assert.equal(mem.history.length,1);assert.equal(mem.history[0].id,firstId);assert.equal(mem.history[0].events.length,4);assert.equal(mem.history[0].totals.score,72);
 assert.equal(await page.locator('[data-hole]').count(),0);assert.equal(await page.locator('#back-active').count(),0);assert.equal(await page.locator('tbody tr').count(),18);
 await page.locator('#copy-coach').click();await page.getByText('Copied',{exact:true}).waitFor();assert.equal((await page.evaluate(()=>navigator.clipboard.readText())).replace(/\r\n/g,'\n'),C.full(mem.history[0]));
 await page.locator('#history-list').click();assert.equal(await page.locator('[data-history]').count(),1);
 if(process.env.REVIEW_SCREENSHOT)await page.screenshot({path:process.env.REVIEW_SCREENSHOT.replace('.png','-history.png')});
 await page.reload();await page.locator('#round-history').click();await page.locator('[data-history]').click();assert.equal(await page.locator('.totals .metric b').first().innerText(),'72');
 await page.locator('#library').click();await page.locator('[data-course="test-fixture"]').click();assert.match(await page.locator('[data-tee="short"]').innerText(),/Last played/);await page.locator('[data-tee="short"]').click();await page.locator('#to-game').click();await page.locator('#start-round').click();
 mem=await saved();assert.notEqual(mem.active.id,firstId);assert.equal(mem.active.courseId,'test-fixture');assert.equal(mem.active.teeId,'short');assert.deepEqual(mem.active.results,{});assert.equal(mem.history.length,1);assert.equal(mem.history[0].config.totalYards,6253);assert.equal(await page.locator('.hole-distance b').innerText(),'354 yd');
 await tap('score',4);await page.locator('#ask-caddie').click();await page.locator('#just-copy').click();await page.getByText('✓ Context copied — ask away',{exact:true}).waitFor();assert.equal((await saved()).active.events[0].roundId,(await saved()).active.id);
 await page.locator('#close-ask').click();await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();await page.locator('#jump').waitFor();await context.setOffline(true);await page.reload();await page.locator('#jump').waitFor();assert.equal(await page.locator('.hole-distance b').innerText(),'354 yd');
 await page.locator('#library').click();await page.locator('#round-history').click();await page.locator('[data-history]').click();assert.equal(await page.locator('tbody tr').count(),18);await page.locator('#copy-coach').click();await page.getByText('Copied',{exact:true}).waitFor();
 await page.locator('#library').click();await page.locator('#resume-round').click();assert.equal((await saved()).active.results[1].score,4);
 // Conflicting tabs must not silently overwrite newer history/state.
 const disk=await saved();disk.preferences.tees['nevel-meade']='blue';disk.otherTabMarker=true;
 await page.evaluate(({key,disk})=>localStorage.setItem(key,JSON.stringify(disk)),{key,disk});await tap('gir',true);assert.match(await page.locator('#storage-warning').innerText(),/another tab/);assert.equal((await saved()).active.results[1].gir,undefined);
 await context.close();
 // Malformed/newer storage is retained and not replaced by starting a new round.
 const corrupt=await browser.newContext();const broken=await corrupt.newPage();await broken.goto(url);await broken.locator('[data-course]').first().waitFor();await broken.evaluate(k=>localStorage.setItem(k,'{"schemaVersion":99,"valuable":"keep"}'),key);await broken.reload();await broken.locator('[data-course="nevel-meade"]').click();await broken.locator('[data-tee="blue"]').click();await broken.locator('#to-game').click();broken.once('dialog',d=>d.accept());await broken.locator('#start-round').click();assert.equal(await broken.evaluate(k=>localStorage.getItem(k),key),'{"schemaVersion":99,"valuable":"keep"}');await corrupt.close();
 assert.deepEqual(errors,[]);console.log('V1.3 browser: library/tees, protected rounds, Ask copy/open/fallback, events, archival/quota, history/export, offline multi-course, conflict and corrupt-state protection passed');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());
