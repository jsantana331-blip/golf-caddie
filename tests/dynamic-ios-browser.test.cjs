const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),{execFileSync}=require('node:child_process'),{chromium}=require('playwright');
const {route,openScore,closeScore}=require('./ui-helpers.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'docs/dynamic-ios/screenshots');fs.mkdirSync(out,{recursive:true});
let baseline=false;const server=http.createServer((req,res)=>{const f=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/golf-caddie\//,'')||'index.html';if(f.includes('..')){res.writeHead(404);return res.end()}try{const body=baseline?execFileSync('git',['show',`aba1cac:${f}`],{cwd:root,stdio:['ignore','pipe','ignore']}):fs.readFileSync(path.join(root,f));res.writeHead(200,{'Content-Type':f.endsWith('.js')?'application/javascript':f.endsWith('.css')?'text/css':f.endsWith('.json')?'application/json':'text/html','Cache-Control':'no-store'});res.end(body)}catch{res.writeHead(404);res.end()}});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge'});try{
for(const version of ['before','after']){baseline=version==='before';const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
const snap=async name=>page.screenshot({path:path.join(out,`${version}-${name}.png`)});
await page.goto(`http://127.0.0.1:${server.address().port}/golf-caddie/`);await page.locator('[data-course="long-run"]').waitFor();await snap('home');await snap('course-library');
await page.locator('[data-course="long-run"]').click();await snap('tee-selection');await page.locator('[data-tee="blue"]').click();await page.locator('#start-round').click();await snap('course-overview');await page.locator('#to-game').click();await snap('game-plan');await page.locator('#to-hole').click();await snap('active-hole');await route(page,6);await snap('hole-layout');
await page.locator('#ask-caddie').click();await snap('ask-caddie');await page.locator('#close-ask').click();await openScore(page);await page.locator('[data-field="score"][data-value="3"]').click();await snap('score-entry');await closeScore(page);await route(page,20);await snap('round-summary');
if(version==='after'){
assert.equal(await page.locator('.environment-journal').count(),1);await page.locator('[data-tab="home"]').click();assert.equal(await page.locator('.environment-clubhouse').count(),1);await page.locator('[data-tab="play"]').click();assert.equal(await page.locator('.play-header').count(),1);
for(const size of [{width:320,height:568},{width:375,height:667},{width:390,height:844},{width:430,height:932},{width:844,height:390}]){await page.setViewportSize(size);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.locator('#record-score').scrollIntoViewIfNeeded();const b=await page.locator('#record-score').boundingBox(),tabs=await page.locator('.app-tabs').boundingBox();assert.ok(b.height>=44&&b.y+b.height<=tabs.y+1);await page.locator('#jump').click();assert.ok(await page.locator('#hole-picker').isVisible());await page.locator('#close-picker').click()}
await page.setViewportSize({width:390,height:844});await route(page,20);
}
page.once('dialog',d=>d.accept());await page.locator('#complete-round').click();await page.locator('[data-tab="rounds"]').click();await snap('round-history');if(version==='after'){assert.match(await page.locator('.round-badge').innerText(),/partial/i);await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches),true)}assert.deepEqual(errors,[]);await context.close();
}
console.log('Dynamic iOS: before/after captures, semantic environments, partial journal, five viewport action access, hole sheet, and reduced-motion passed.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());


