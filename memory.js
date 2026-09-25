/* Portable local round records. Course/player snapshots preserve historical facts. */
const CaddieMemory = (() => {
 const R=typeof module!=='undefined'?require('./results.js'):RoundResults;
 const clone=value=>JSON.parse(JSON.stringify(value));
 const empty=()=>({schemaVersion:3,active:null,history:[],preferences:{tees:{}},migrations:[]});
 function courseRound(course,teeId,player){
  const tee=course.tees.find(t=>t.id===teeId);
  if(!tee||!Array.isArray(tee.holes)||!tee.holes.length)throw Error('Course tee unavailable');
  const {tees,...facts}=course;
  return {...clone(facts),...clone(tee),id:course.id,courseId:course.id,teeId:tee.id,tee:tee.name,
   weather:null,gamePlan:clone(tee.gamePlan||course.gamePlan||[]),mission:tee.mission||course.mission||''};
 }
 function create(config,player,id,time=new Date().toISOString()){
  return {schemaVersion:1,id,courseId:config.courseId,teeId:config.teeId,startedAt:time,
   config:clone(config),player:clone(player),results:{},activeHole:config.holes[0].n,page:2,events:[],completionOrder:[]};
 }
 function validate(saved){
  if(!saved||saved.schemaVersion!==3||!('active' in saved)||!Array.isArray(saved.history)||!saved.preferences?.tees||!Array.isArray(saved.migrations))throw Error('Unrecognized round memory; saved data has been left untouched.');
  for(const r of [saved.active,...saved.history].filter(Boolean)){
   if(r.schemaVersion!==1||typeof r.id!=='string'||typeof r.courseId!=='string'||typeof r.teeId!=='string'||!Array.isArray(r.config?.holes)||!r.config.holes.length||!Array.isArray(r.player?.clubs)||!r.results||typeof r.results!=='object'||!Array.isArray(r.events)||!Array.isArray(r.completionOrder)||!r.config.holes.some(h=>h.n===r.activeHole))throw Error('Unreadable round memory; saved data has been left untouched.');
   const clean=R.clean(r.results,r.config.holes);
   for(const [n,result] of Object.entries(r.results)){
    if(!result||typeof result!=='object'||!clean[n]||Object.entries(result).some(([field,value])=>clean[n][field]!==value))throw Error('Invalid scorecard; saved data has been left untouched.');
   }
   if(saved.history.includes(r)&&(!r.completedAt||!r.totals||r.config.holes.some(h=>!Number.isSafeInteger(r.results[h.n]?.score)||r.results[h.n].score<1)))throw Error('Unreadable round history; saved data has been left untouched.');
  }
  return saved;
 }
 function migrate(raw,config,player,legacyKey){
  const store=empty();
  if(!raw)return store;
  if(raw.version!==1||typeof raw.results!=='object'||raw.results===null)throw Error('Unrecognized legacy scorecard; saved data has been left untouched.');
  const r=create(config,player,'legacy:'+legacyKey,typeof raw.startedAt==='string'?raw.startedAt:new Date().toISOString());
  r.results=R.clean(raw.results,config.holes);
  r.activeHole=R.activeHole(config.holes,r.results,raw.activeHole);
  r.page=Number.isInteger(raw.page)?Math.max(0,Math.min(config.holes.length+2,raw.page)):2;
  r.completionOrder=config.holes.filter(h=>r.results[h.n]?.score!==undefined).map(h=>h.n);
  store.active=r;store.preferences.tees[config.courseId]=config.teeId;store.migrations.push(legacyKey);
  return store;
 }
 function trackCompletion(record,hole,before,after){
  if(before?.score===undefined&&after.score!==undefined&&!record.completionOrder.includes(hole))record.completionOrder.push(hole);
  if(after.score===undefined)record.completionOrder=record.completionOrder.filter(n=>n!==hole);
 }
 function complete(store,time=new Date().toISOString()){
  const r=store.active;
  if(!r||r.config.holes.some(h=>!Number.isSafeInteger(r.results[h.n]?.score)||r.results[h.n].score<1))throw Error('Record a score for every hole before completing this round.');
  const saved=clone(r),holes=saved.config.holes;
  saved.completedAt=time;saved.totals={...R.stats(holes,saved.results),front:R.stats(holes.slice(0,9),saved.results).score,back:R.stats(holes.slice(9),saved.results).score};
  const next=clone(store);next.history.unshift(saved);next.active=null;return next;
 }
 function event(record,time=new Date().toISOString()){
  const scored=record.config.holes.filter(h=>record.results[h.n]?.score!==undefined),s=R.stats(scored,record.results);
  return {roundId:record.id,hole:record.activeHole,timestamp:time,order:record.events.length+1,score:s.score,relative:s.relative,holesCompleted:s.played};
 }
 return {clone,empty,courseRound,create,validate,migrate,trackCompletion,complete,event};
})();
if(typeof module!=='undefined')module.exports=CaddieMemory;
