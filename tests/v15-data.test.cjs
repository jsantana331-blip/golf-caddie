const assert=require('node:assert/strict'),fs=require('node:fs'),{execFileSync}=require('node:child_process');
const M=require('../memory.js'),S=require('../strategy.js'),L=require('../hole-layout.js'),C=require('../caddie-context.js');
const course=require('../data/courses/long-run.json'),player=require('../data/player.json');
const expected={blue:[425,520,422,369,162,371,525,149,401,458,528,219,371,447,447,345,157,537],white:[418,507,409,357,154,336,506,134,392,434,500,209,364,425,433,341,149,511],yellow:[368,468,374,292,143,290,453,130,342,382,427,186,279,400,372,321,141,436],red:[354,399,346,283,121,276,453,126,320,350,418,160,279,323,315,267,132,426],orange:[249,306,256,235,100,207,260,72,242,227,310,79,190,241,243,188,105,315]};
const top=[5,1,7,15,11,13,3,17,9,2,10,8,12,6,4,18,16,14],lower=[5,3,7,13,15,11,1,17,9,8,4,10,14,12,2,16,18,6];
const printed={blue:[3344,3509,6853,72.3,128],white:[3213,3366,6579,70.9,124],yellow:[2860,2944,5804,67.3,117],red:[2678,2670,5348,65.2,107],orange:[1927,1948,3875,null,null]};
assert.deepEqual(course.tees.map(t=>t.id),Object.keys(expected));assert.equal(course.verification.date,'2026-10-29');
for(const t of course.tees){
 assert.deepEqual(t.holes.map(h=>h.yards),expected[t.id]);assert.deepEqual([t.frontYards,t.backYards,t.totalYards,t.rating,t.slope],printed[t.id]);
 assert.deepEqual(t.holes.map(h=>h.par),[4,5,4,4,3,4,5,3,4,4,5,3,4,4,4,4,3,5]);assert.deepEqual(t.holes.map(h=>h.hcp),['red','orange'].includes(t.id)?lower:top);
 assert.equal(t.holes.reduce((sum,h)=>sum+h.par,0),72);assert.equal(new Set(t.holes.map(h=>h.hcp)).size,18);
 if(t.playable===false){assert.equal(t.id,'orange');assert.equal(t.holes.slice(9).reduce((n,h)=>n+h.yards,0),1898);assert.throws(()=>M.courseRound(course,t.id,player),/unavailable/);continue;}
 assert.equal(t.holes.slice(0,9).reduce((n,h)=>n+h.yards,0),t.frontYards);assert.equal(t.holes.slice(9).reduce((n,h)=>n+h.yards,0),t.backYards);assert.equal(t.frontYards+t.backYards,t.totalYards);
 const config=M.courseRound(course,t.id,player);for(const h of config.holes){assert.ok(h.teeClub&&h.target&&h.advice&&h.danger&&h.safestMiss&&h.expected);assert.ok(h.advice.split(/[.!?]+/).filter(v=>v.trim()).length<=3);if(![9,18].includes(h.n))assert.equal(h.danger,'Specific hazards unverified; check the tee view and current local markers.');}
 const store=M.empty();store.active=M.create(config,player,t.id);store.active.results={1:{score:5,note:'Only scored hole'},2:{putts:0,gir:false}};
 const saved=M.complete(store);assert.equal(saved.history[0].status,'partial');assert.equal(saved.history[0].totals.relative,1);assert.equal(saved.history[0].results[2].score,undefined);assert.equal(saved.history[0].results[2].putts,0);assert.equal(saved.history[0].results[2].gir,false);assert.equal(saved.history[0].results[3],undefined);M.validate(saved);
 assert.match(C.full(saved.history[0]),/Round status: Finished — Partial/);assert.match(C.full(saved.history[0]),/Hole 3 .*Score —/);
 const next=M.clone(saved);next.active=M.create(config,player,'second');const cancelled=M.cancel(next);assert.equal(cancelled.active,null);assert.deepEqual(cancelled.history,saved.history);assert.notEqual(next.active,null);
 const legacy=M.clone(saved);delete legacy.history[0].status;assert.throws(()=>M.validate(legacy),/history/);saved.history[0].status='complete';assert.throws(()=>M.validate(saved),/history/);
}
assert.equal(course.tees.find(t=>t.id==='yellow').ratings[1].rating,73);assert.equal(course.tees.find(t=>t.id==='red').ratings[1].slope,122);
assert.equal(S.forHole({n:5,par:3,yards:162},player).teeClub,'7i');assert.equal(S.forHole({n:5,par:3,yards:121},player).teeClub,'PW');
const changed=structuredClone(player);changed.clubs=changed.clubs.map(([c,y])=>[c,y-20]);assert.notDeepEqual(S.forHole({n:1,par:4,yards:425},changed),S.forHole({n:1,par:4,yards:425},player));
const source={verified:true,url:'https://example.invalid/synthetic-fixture',verifiedAt:'2026-10-29',license:'TEST FIXTURE ONLY',attribution:'SYNTHETIC TEST — not course geometry',redistributionAllowed:true};
const g={source,courseId:'test',teeId:'test',hole:1,tee:[50,90],fairway:[[40,85],[40,20],[60,20],[60,85]],green:[[40,20],[50,10],[60,20]],description:'Synthetic test layout'};
assert.equal(L.valid(g),true);assert.match(L.render(g),/<svg/);assert.doesNotMatch(L.render(g),/layout-target/);
assert.match(L.render({...g,target:{position:[50,40],source}}),/layout-target/);assert.equal(L.valid({...g,target:{position:[50,40]}}),false);
for(const bad of [{...g,source:{...source,redistributionAllowed:false}},{...g,source:{...source,verified:false}},{...g,tee:[Infinity,0]},{...g,fairway:[['bad',1],[0,1],[2,3]]}]){assert.equal(L.valid(bad),false);assert.doesNotMatch(L.render(bad),/<svg/);}
assert.match(L.render({...g,description:'<script>bad</script>'}),/&lt;script&gt;/);assert.equal(L.find({schemaVersion:1,holes:[g]},'test','other',1),undefined);
assert.equal(L.find({schemaVersion:1,holes:{}},'test','test',1),undefined);
assert.equal(L.find({schemaVersion:1,holes:[null]},'test','test',1),undefined);
assert.equal(S.forHole({n:9,par:4,yards:360},player).target,'Widest visible landing area');
const production=require('../data/layouts/index.json');assert.deepEqual(production.holes,[]);assert.doesNotMatch(C.live(M.create(M.courseRound(course,'blue',player),player,'layout-independent')),/fairway.*points|<svg/);
assert.equal(fs.readFileSync('data/courses/nevel-meade.json','utf8').replace(/\r\n/g,'\n'),execFileSync('git',['show','85e3710:data/courses/nevel-meade.json'],{encoding:'utf8'}).replace(/\r\n/g,'\n'));
console.log('V1.5 official scorecard transcription/totals, Orange quarantine, tee-specific planning, partial history/cancel/export, legacy validation and licensed-geometry guards passed');
