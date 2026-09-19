const assert = require('node:assert/strict');
const fs = require('node:fs');
const {execFileSync} = require('node:child_process');
const round = require('../data/current-round.json');
const original = JSON.parse(execFileSync('git', ['show', '5d1bf91:data/current-round.json'], {encoding:'utf8'}));
for (const key of ['course','location','tee','totalYards','rating','slope','mission','swingCue','clubs']) assert.deepEqual(round[key], original[key], key);
assert.equal(round.holes.reduce((sum,h)=>sum+h.yards,0),round.totalYards);
assert.deepEqual(round.holes.map(h=>h.n),Array.from({length:18},(_,i)=>i+1));
for (const h of round.holes) {
 const old=original.holes[h.n-1];
 for (const key of ['n','par','yards','hcp','teeClub','target']) assert.deepEqual(h[key],old[key],`hole ${h.n}: ${key}`);
 if(h.n!==1)assert.equal(h.plan,old.plan);
 if(![1,9,18].includes(h.n))assert.equal(h.danger,old.danger);
 assert.ok(h.advice && h.expected);
 assert.ok(!/corridor|Smooth.*finish.*swing/i.test(h.advice+h.plan+h.danger));
}
for(const file of execFileSync('git',['ls-files'],{encoding:'utf8'}).trim().split(/\r?\n/).filter(f=>/\.(js|cjs|json|html|css|md)$/.test(f))){
 const text=new TextDecoder('utf-8',{fatal:true}).decode(fs.readFileSync(file));
 assert.ok(!/[\u00c2\u00c3\u00e2][\u0080-\u00bf\u2000-\u2122]|\ufffd|[\u0080-\u009f]/u.test(text),`Encoding: ${file}`);
}
console.log('Original course facts, 18 holes, club distances, strategy and UTF-8 checks passed');
