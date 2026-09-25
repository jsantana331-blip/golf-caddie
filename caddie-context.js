/* Pure context generation, independent of UI, clipboard and external services. */
const CaddieContext = (() => {
 const R=typeof module!=='undefined'?require('./results.js'):RoundResults;
 const request=`LIVE REQUEST

I am currently playing the hole identified above.

Act as my live golf caddie using my player profile, club distances, course/hole strategy, round performance, recent holes and notes as context.

I will describe the current shot situation next, including whatever distance, lie, wind, pin, obstruction or other information is relevant.

Keep the recommendation concise enough for live play.

Respond primarily as:

CLUB → TARGET → INTENDED SHOT → SAFEST MISS

Then give only the brief reasoning necessary to make the decision.

Prioritize expected score and avoiding doubles over hero shots.`;
 function playerLines(player){
  const lines=['PLAYER'];
  for(const [key,value] of Object.entries(player.profile||{}))if(value!==null&&value!=='')lines.push(`${key}: ${value}`);
  if(player.handicap!==null&&player.handicap!==undefined)lines.push('Handicap: '+player.handicap);
  lines.push('Stock yardages: '+player.clubs.map(([club,yards])=>`${club} ${yards} yd`).join(' · '));
  if(player.tendencies?.length)lines.push('Established tendencies: '+player.tendencies.join('; '));
  return lines;
 }
 function live(record){
  const round=record.config,results=R.clean(record.results,round.holes),h=round.holes.find(h=>h.n===record.activeHole);
  if(!h)throw Error('Current hole unavailable');
  const scored=round.holes.filter(h=>results[h.n]?.score!==undefined),s=R.stats(scored,results);
  const lines=['CADDIE COACH — LIVE ROUND','',`Current: Hole ${h.n} · Par ${h.par} · ${h.yards} yd`,
   `Course: ${round.course}`,`Tee: ${round.tee}`,`Round: ${R.relativeLabel(s)} through ${s.played}`,'','HOLE PLAN'];
  for(const [label,field] of [['Tee','teeClub'],['Target','target'],['Avoid','danger'],['Expected','expected'],['Plan','advice']]){const value=field==='advice'?(h.advice||h.plan):h[field];if(value)lines.push(`${label}: ${value}`);}
  lines.push('','ROUND SO FAR (completed holes only)',`Score: ${s.played?s.score:'—'} · ${R.relativeLabel(s)}`,
   `FIR: ${s.fairways}/${s.eligible} (${s.teeRecorded} recorded)`,`GIR: ${s.gir}/${s.played} (${s.girRecorded} recorded)`,
   `Putts: ${s.putts} (${s.puttsRecorded} holes recorded)`,`Penalties: ${s.penalties} (${s.penaltiesRecorded} holes recorded)`);
  const recent=[...new Set([...(record.completionOrder||[]),...scored.map(h=>h.n).filter(n=>!record.completionOrder?.includes(n))])].filter(n=>results[n]?.score!==undefined).slice(-3);
  if(recent.length){lines.push('','RECENT');for(const n of recent){const r=results[n],hole=round.holes.find(h=>h.n===n),delta=r.score-hole.par;
   const name=({'0':'Par','1':'Bogey','2':'Double','-1':'Birdie','-2':'Eagle'})[delta]??(delta>0?'+'+delta:String(delta));
   lines.push(`H${n} — ${name} (${r.score}) · Tee ${hole.par===3?'N/A':r.tee??'unrecorded'} · ${r.gir===undefined?'GIR unrecorded':r.gir?'GIR':'No GIR'} · ${r.putts??'—'} putts · ${r.penalties??'—'} penalties`);
  }}
  const notes=round.holes.filter(h=>results[h.n]?.note?.trim());
  if(notes.length)lines.push('','ROUND NOTES',...notes.map(h=>`H${h.n} — ${results[h.n].note.trim()}`));
  lines.push('',...playerLines(record.player),'',request);return lines.join('\n');
 }
 function full(record){
  const base=R.coachReport(record.config,record.results),last=base.lastIndexOf('\n\n');
  const events=record.events||[],extra=[`Round ID: ${record.id}`,`Started: ${record.startedAt}`];
  if(record.completedAt)extra.push('Finalized: '+record.completedAt);
  extra.push(...playerLines(record.player),`Ask Caddie requests: ${events.length}`,`Ask Caddie holes: ${events.length?events.map(e=>'H'+e.hole).join(', '):'None'}`);
  return base.slice(0,last)+'\n\n'+extra.join('\n')+base.slice(last);
 }
 return {live,full,playerLines,request};
})();
if(typeof module!=='undefined')module.exports=CaddieContext;
