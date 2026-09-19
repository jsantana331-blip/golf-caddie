const assert=require('node:assert/strict');
const {clean,stats}=require('../results.js');
const round=require('../data/current-round.json');
assert.equal(round.holes.length,18);
assert.equal(round.holes.reduce((s,h)=>s+h.par,0),72);
const all=Object.fromEntries(round.holes.map(h=>[h.n,{score:h.par,tee:'Fairway',gir:true,putts:2,penalties:0}]));
const results=clean(all,round.holes),s=stats(round.holes,results);
assert.deepEqual(s,{played:18,score:72,relative:0,putts:36,puttsRecorded:18,penalties:0,penaltiesRecorded:18,gir:18,girRecorded:18,fairways:14,eligible:14,teeRecorded:14});
assert.equal(results[5].tee,undefined);
assert.equal(stats(round.holes,{}).played,0);
const partial=stats(round.holes,{1:{score:12,putts:4,penalties:3,tee:'Trouble',gir:false}});
assert.equal(partial.score,12);assert.equal(partial.relative,8);assert.equal(partial.putts,4);assert.equal(partial.penalties,3);assert.equal(partial.girRecorded,1);
assert.deepEqual(clean({1:'A',2:{score:-1,gir:'false',putts:2.5},3:{score:5,note:'<script>'}},round.holes),{2:{},3:{score:5,note:'<script>'}});
console.log('Round calculation and validation tests passed');

// Partial rounds must subtract par only for holes with a recorded score.
const mixed=clean({1:{score:3,putts:1,penalties:0,gir:true,tee:'Fairway'},5:{score:4,tee:'Left'},10:{score:7,putts:4,penalties:3,gir:false},18:{putts:0,penalties:0}},round.holes);
assert.equal(stats(round.holes.slice(0,9),mixed).score,7);
assert.equal(stats(round.holes.slice(9),mixed).score,7);
assert.equal(stats(round.holes,mixed).score,14);
assert.equal(stats(round.holes,mixed).relative,3);
assert.equal(stats(round.holes,mixed).played,3);
assert.equal(stats(round.holes,mixed).puttsRecorded,3);
assert.equal(stats(round.holes,mixed).penalties,3);
assert.equal(stats(round.holes,mixed).teeRecorded,1);
for(const h of round.holes.filter(h=>h.par===3))assert.equal(clean({[h.n]:{tee:'Fairway'}},round.holes)[h.n].tee,undefined);
assert.deepEqual(clean(null,round.holes),{});
assert.equal(clean({1:{note:'x'.repeat(300)}},round.holes)[1].note.length,240);
console.log('Front/back, partial relative-to-par, missing versus zero and all par-3 tests passed');
