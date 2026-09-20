/* Local, versioned round results. No network services are required. */
const RoundResults = (() => {
 const validInt=(v,min=0)=>Number.isSafeInteger(v)&&v>=min;
 function clean(raw,holes){
  const results={};
  for(const h of holes){
   const r=raw?.[h.n]; if(!r||typeof r!=="object")continue;
   const v={};
   for(const field of ['score','putts','penalties'])if(validInt(r[field],field==='score'?1:0))v[field]=r[field];
   if(h.par!==3&&['Fairway','Left','Right','Trouble'].includes(r.tee))v.tee=r.tee;
   if(typeof r.gir==='boolean')v.gir=r.gir;
   if(typeof r.note==='string')v.note=r.note.slice(0,240);
   results[h.n]=v;
  }
  return results;
 }
 function stats(holes,results){
  const scored=holes.filter(h=>validInt(results[h.n]?.score,1));
  const sum=field=>holes.reduce((n,h)=>n+(results[h.n]?.[field]??0),0);
  const count=field=>holes.filter(h=>results[h.n]?.[field]!==undefined).length;
  const eligible=holes.filter(h=>h.par!==3);
  return {played:scored.length,score:sum('score'),relative:scored.reduce((n,h)=>n+results[h.n].score-h.par,0),
   putts:sum('putts'),puttsRecorded:count('putts'),penalties:sum('penalties'),penaltiesRecorded:count('penalties'),
   gir:holes.filter(h=>results[h.n]?.gir===true).length,girRecorded:count('gir'),
   fairways:eligible.filter(h=>results[h.n]?.tee==='Fairway').length,eligible:eligible.length,
   teeRecorded:eligible.filter(h=>results[h.n]?.tee!==undefined).length};
 }
 function relativeLabel(s){return !s.played?'—':s.relative===0?'E':s.relative>0?'+'+s.relative:String(s.relative)}
 function totalLabel(holes,results){const s=stats(holes,results);return s.played?`${s.score}${s.played<holes.length?' ('+s.played+'/'+holes.length+' holes)':''}`:'—'}
 function hasResult(r){return r&&Object.entries(r).some(([k,v])=>k==='note'?v.trim().length>0:v!==undefined)}
 function activeHole(holes,results,saved){
  if(holes.some(h=>h.n===saved))return saved;
  return holes.filter(h=>hasResult(results[h.n])).at(-1)?.n??holes[0].n;
 }
 function afterEntry(holes,active,hole,before,after){
  // A new result on a later unscored hole is play; editing past scores is not.
  return holes.findIndex(h=>h.n===hole)>holes.findIndex(h=>h.n===active)&&!validInt(before?.score,1)&&hasResult(after)?hole:active;
 }
 function afterAdvance(holes,results,active,viewed){
  const i=holes.findIndex(h=>h.n===viewed);
  return viewed===active&&validInt(results[viewed]?.score,1)&&holes[i+1]?holes[i+1].n:active;
 }
 function coachReport(round,raw){
  const results=clean(raw,round.holes),s=stats(round.holes,results);
  const show=v=>v===null||v===undefined||v===''?'Unknown':String(v);
  const lines=[
   'Caddie — Golf Coach Round Export',
   `Course: ${show(round.course)}`,`Location: ${show(round.location)}`,`Tee: ${show(round.tee)}`,
   `Course yardage: ${show(round.totalYards)} yd | Rating: ${show(round.rating)} | Slope: ${show(round.slope)}`,
   `Round status: ${s.played===round.holes.length?'Complete':'In Progress'}`,
   `Holes completed (score recorded): ${s.played}/${round.holes.length}`,
   `Score for completed holes: ${s.played?s.score:'—'}`,
   `Relative to par for completed holes: ${relativeLabel(s)}`,
   `Front nine: ${totalLabel(round.holes.slice(0,9),results)} | Back nine: ${totalLabel(round.holes.slice(9),results)}`,
   `Fairways hit / eligible fairways: ${s.fairways}/${s.eligible} (${s.teeRecorded} tee results recorded)`,
   `GIR: ${s.gir}/${round.holes.length} (${s.girRecorded} results recorded)`,
   `Total putts: ${s.putts} (${s.puttsRecorded} holes recorded)`,
   `Penalty strokes: ${s.penalties} (${s.penaltiesRecorded} holes recorded)`,
   '', 'Hole-by-hole results (— = not recorded):'
  ];
  for(const h of round.holes){const r=results[h.n]||{};
   lines.push(`Hole ${h.n} | Par ${h.par} | ${h.yards} yd | Score ${r.score??'—'} | Tee ${h.par===3?'N/A':r.tee??'—'} | GIR ${r.gir===undefined?'—':r.gir?'Yes':'No'} | Putts ${r.putts??'—'} | Penalties ${r.penalties??'—'}`);
   if(r.note)lines.push('  Note: '+r.note.replace(/\r?\n/g,'\n  '));
  }
  lines.push('', 'Analyze this round as my golf coach. Identify the biggest scoring patterns, strengths, mistakes, course-management issues, and likely opportunities to lower my handicap. Use my notes and hole-level results as context. Give me specific coaching feedback and prioritize what I should work on in my next practice session.');
  return lines.join('\n');
 }
 return {clean,stats,relativeLabel,totalLabel,activeHole,afterEntry,afterAdvance,coachReport};
})();
if(typeof module!=='undefined')module.exports=RoundResults;
