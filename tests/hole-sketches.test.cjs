const assert=require('node:assert/strict'),fs=require('node:fs');
const L=require('../hole-layout.js'),data=require('../data/layouts/index.json');
assert.deepEqual(data.holes,[]);assert.equal(data.schematics.length,18);assert.deepEqual(data.schematics.map(g=>g.hole),Array.from({length:18},(_,i)=>i+1));
for(const tee of ['blue','white','yellow','red','orange'])for(let n=1;n<=18;n++){
 const g=L.find(data,'long-run',tee,n);assert.equal(L.schematicValid(g),true);assert.equal(L.valid(g),false);assert.equal(g.precision,'illustrative');assert.equal(g.source.referenceReviewed,true);
 const text=L.render(g);assert.match(text,/data-layout-kind="schematic"/);assert.match(text,/Scorecard sketch/);assert.match(text,/Approximate, not to scale/);assert.match(text,/Tee area shared/);assert.doesNotMatch(text,/layout-unavailable|layout-target|layout-bunker|Verified overhead/);assert.equal(g.target,undefined);assert.equal(g.bunkers,undefined);assert.equal(g.distances,undefined);
}
assert.deepEqual(data.schematics.filter(g=>g.water.length).map(g=>g.hole),[1,9,14,15]);
assert.equal(L.find(data,'nevel-meade','blue',5),undefined);assert.equal(L.find(data,'long-run','unknown',5),undefined);assert.equal(L.find(data,'long-run','blue',19),undefined);
const g=data.schematics[0];for(const invalid of [{...g,precision:'verified'},{...g,originalArtwork:false},{...g,route:[[0,NaN],[50,50]]},{...g,route:[[1,1],[1,1]]},{...g,target:{position:[20,30]}},{...g,bunkers:[]},{...g,distances:{carry:100}},{...g,source:{...g.source,referenceReviewed:false}}]){assert.equal(L.schematicValid(invalid),false);assert.match(L.render(invalid),/not yet verified/);}
assert.match(L.render({...g,source:{...g.source,routingEvidence:'<script>unsafe</script>'}}),/&lt;script&gt;/);
const source={verified:true,url:'https://example.invalid/test',verifiedAt:'2026-10-29',attribution:'TEST ONLY',license:'Test fixture',redistributionAllowed:true},v={courseId:'long-run',teeId:'blue',hole:1,source,tee:[50,90],fairway:[[40,80],[40,20],[60,20]],green:[[40,20],[50,10],[60,20]]};
assert.equal(L.find({...data,holes:[v]},'long-run','blue',1),v);assert.equal(L.valid(v),true);assert.doesNotMatch(L.render(v),/Scorecard sketch/);
const app=fs.readFileSync('app.js','utf8');assert.ok(app.includes('HoleLayout.render(HoleLayout.find(layouts,round.courseId,round.teeId,h.n))'));
console.log('All 18 sketches × five tee identities, honest precision/source labels, unsupported detail rejection, escaping and verified-layout priority passed.');
