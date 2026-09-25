const CACHE='caddie-v1.3.1-chatgpt-handoff-1';
const SHELL=['./','./index.html','./styles.css','./results.js','./app.js','./manifest.json','./memory.js','./caddie-context.js','./external-coach.js','./handoff.js','./data/player.json','./data/courses/index.json','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install',e=>e.waitUntil((async()=>{const response=await fetch('./data/courses/index.json',{cache:'no-store'});if(!response.ok)throw Error('Course library unavailable');const library=await response.json();const cache=await caches.open(CACHE);await cache.addAll([...SHELL,...library.courses.map(c=>'./data/courses/'+c.file)]);await self.skipWaiting()})()));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('caddie-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;
 e.respondWith(fetch(e.request).then(r=>{if(r.ok){const copy=r.clone();e.waitUntil(caches.open(CACHE).then(c=>c.put(e.request,copy)))}return r}).catch(async()=>{
  const cached=await caches.match(e.request);if(cached)return cached;
  if(e.request.mode==='navigate')return caches.match('./index.html');
  return Response.error();
 }));
});
