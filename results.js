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
 return {clean,stats};
})();
if(typeof module!=='undefined')module.exports=RoundResults;
