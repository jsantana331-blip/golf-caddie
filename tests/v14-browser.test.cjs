const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),{execFileSync}=require('node:child_process');
const {chromium}=require('playwright');
const {route,openScore,closeScore,act}=require('./ui-helpers.cjs');
const M=require('../memory.js'),player=require('../data/player.json'),course=require('../data/courses/nevel-meade.json');
const root=path.resolve(__dirname,'..'),baseline=process.env.CAPTURE_BASELINE;
const server=http.createServer((req,res)=>{
 const file=new URL(req.url,'http://localhost').pathname.replace(/^\/golf-caddie\//,'')||'index.html';
 if(file.includes('..')){res.writeHead(404);res.end();return}
 try{const body=baseline?execFileSync('git',['show',`${baseline}:${file}`],{cwd:root,stdio:['ignore','pipe','ignore']}):fs.readFileSync(path.join(root,file));res.writeHead(200,{'Content-Type':file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.json')?'application/json':'text/html','Cache-Control':'no-store'});res.end(body)}catch{res.writeHead(404);res.end()}
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${server.address().port}/golf-caddie/`;
 const browser=await chromium.launch({channel:'msedge'});
 try{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const errors=[];context.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));
 const page=await context.newPage();page.setDefaultTimeout(10000);await page.goto(url);await page.locator('[data-course]').waitFor();
 const key='caddie:/golf-caddie/:memory:v1.3',saved=()=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
 const capture=async name=>{if(process.env.REVIEW_SCREENSHOT)await page.screenshot({path:process.env.REVIEW_SCREENSHOT.replace('.png','-'+name+'.png')})};
 // Identical fixture supplies honest before/after screenshots, including an active round.
 const mem=M.empty();mem.active=M.create(M.courseRound(course,'blue',player),player,'visual-test');mem.active.activeHole=3;
 for(let n=1;n<=3;n++)mem.active.results[n]={score:5,tee:'Fairway',gir:false,putts:2,penalties:0,note:n===3?'Favor the safe side next time':''};
 await page.evaluate(({key,mem})=>localStorage.setItem(key,JSON.stringify(mem)),{key,mem});await page.reload();await page.locator('#resume-round').waitFor();await capture('home');
 await page.locator('#resume-round').click();await capture('hole');
 if(baseline){
  await openScore(page);await capture('score');await closeScore(page);await page.locator('#open-summary').click();await capture('summary');await context.close();return;
 }
 assert.equal(await page.locator('.tracker').count(),0);await openScore(page);await capture('score');await closeScore(page);await act(page,'#open-summary');await capture('summary');
 const original=await saved();
 for(const tab of ['home','rounds','play','home','play']){
  await act(page,`[data-tab="${tab}"]`);assert.equal(await page.locator('[aria-current="page"]').getAttribute('data-tab'),tab);assert.deepEqual(await saved(),original);
 }
 assert.equal(await page.locator('h1').innerText(),'Hole 3');
 assert.deepEqual(await page.locator('#jump option').allTextContents(),Array.from({length:18},(_,i)=>'Hole '+(i+1)));
 await route(page,15);assert.equal(await page.locator('.active-context').innerText(),'Preview · playing Hole 3');assert.match(await page.locator('#ask-caddie').innerText(),/playing Hole 3/);assert.equal(await page.locator('h1').evaluate(el=>getComputedStyle(el).position),'absolute');await act(page,'[data-tab="rounds"]');await act(page,'[data-tab="play"]');assert.equal(await page.locator('h1').innerText(),'Hole 3');assert.equal((await saved()).active.activeHole,3);
 // Explicit saving behavior, invalid numbers, close/Escape, focus restoration and modal containment.
 await openScore(page);assert.match(await page.locator('#score-sheet').innerText(),/Valid entries save immediately/);
 await page.locator('[data-field="score"][data-value="7"]').click();await page.locator('#score').fill('0');
 const valid=(await saved()).active.results[3].score;assert.equal(valid,7);
 await page.locator('#score-done').click();assert.equal(await page.locator('#score-sheet[open]').count(),1);assert.equal((await saved()).active.results[3].score,7);
 await page.locator('#score').focus();await page.locator('#score').press('ControlOrMeta+A');await page.locator('#score').press('-');assert.equal((await saved()).active.results[3].score,7);
 await page.locator('#score').fill('2.5');assert.equal((await saved()).active.results[3].score,7);
 await page.locator('#score').fill('12');assert.equal((await saved()).active.results[3].score,12);
 await page.locator('#note').fill('Saved from the score sheet');await page.keyboard.press('Escape');assert.equal(await page.locator('#score-sheet').count(),0);assert.equal((await saved()).active.results[3].note,'Saved from the score sheet');assert.equal(await page.locator('#record-score').evaluate(el=>el===document.activeElement),true);
 await openScore(page);await page.locator('#score').fill('');assert.equal((await saved()).active.results[3].score,undefined);await page.locator('#close-score').click();await openScore(page);assert.equal(await page.locator('[data-field="score"][aria-pressed="true"]').count(),0);await closeScore(page);
 for(const size of [{width:320,height:568},{width:375,height:667},{width:390,height:844},{width:430,height:932},{width:844,height:390},{width:390,height:400}]){
  await page.setViewportSize(size);await route(page,4);
  for(const sel of ['#record-score','#ask-caddie']){const box=await page.locator(sel).boundingBox();assert.ok(box.width>=44&&box.height>=44);if(size.height>=568)assert.ok(box.y+box.height<size.height-60,JSON.stringify({size,sel,box}))}
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await openScore(page);
  const box=await page.locator('#score-sheet').boundingBox();assert.ok(box.x>=0&&box.y>=0&&box.x+box.width<=size.width+1&&box.y+box.height<=size.height+1,JSON.stringify({size,box}));
  const done=await page.locator('#score-done').boundingBox();assert.ok(done.y>=box.y&&done.y+done.height<=box.y+box.height);
  assert.equal(await page.locator('.content').evaluate(el=>getComputedStyle(el).overflowY),'hidden');
  await page.locator('#note').focus();await page.locator('#note').fill('Keyboard and scroll test');await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>!!document.activeElement.closest('#score-sheet')),true);
  await closeScore(page);
 }
 await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.locator('#record-score').evaluate(el=>getComputedStyle(el).transitionDuration),'0s');
 // Par 3 fields remain N/A and there are no duplicate fields under the sheet.
 const par3=course.tees[0].holes.find(h=>h.par===3);await route(page,par3.n+1);await openScore(page);assert.equal(await page.locator('[data-field="tee"]').count(),0);assert.equal(await page.locator('#note').count(),1);assert.match(await page.locator('.na').innerText(),/N\/A/);await closeScore(page);
 // Empty Play is actionable; the current history remains independent.
 await act(page,'[data-tab="home"]');const before=await saved();await page.reload();await page.locator('#resume-round').waitFor();assert.deepEqual(await saved(),before);assert.equal(await page.locator('[aria-current="page"]').getAttribute('data-tab'),'home');
 await page.evaluate(k=>localStorage.removeItem(k),key);await page.reload();await page.locator('[data-course]').waitFor();await act(page,'[data-tab="play"]');assert.equal(await page.locator('#choose-course').innerText(),'Start Round');await page.locator('#choose-course').click();assert.equal(await page.locator('[data-course]').count(),1);
 assert.deepEqual(errors,[]);await context.close();console.log('V1.4 tabs, current-hole isolation, scoring sheet validity/persistence/focus, mobile layouts, keyboard viewport, reduced motion, par 3 and Home relaunch passed');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());
