let round,idx=0,key,state,exactScoreHole=null;
let player,courses=[],catalog,memory,lastStored=null,locked=false,unavailable=false,preview=false,historical=false,screenMode='library',saveError='';
const app=document.querySelector('#app');
let scoreSheet=null,scoreHole=null;
const tabIcons={home:'M3 10 12 3l9 7M5 9v12h5v-7h4v7h5V9',play:'M6 21V3l13 4-13 5',rounds:'M5 3h14v18H5zM8 8h8M8 12h8M8 16h5'};
const esc=s=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const fact=v=>v===null||v===undefined||v===''?'Unknown':typeof v==='boolean'?(v?'Yes':'No'):v;
let storageOK=true;
function saveMemory(next=memory){
 try{
  if(locked)throw Error('Saved data could not be read. It has been left untouched.');
  if(localStorage.getItem(key)!==lastStored)throw Error('Round memory changed in another tab. Reload before making more changes.');
  const text=JSON.stringify(next);localStorage.setItem(key,text);lastStored=text;memory=next;storageOK=true;saveError='';return true;
 }catch(e){storageOK=false;saveError=e.message||'Unable to save on this device.';return false}
 finally{updateStatus()}
}
function persist(){if(!preview&&!historical)saveMemory();updateStatus()}
function updateStatus(){
 const el=document.querySelector('#save-status');if(el)el.textContent=storageOK?'Saved on this device':'Unable to save on this device. Keep this page open.';
 const warning=document.querySelector('#storage-warning');if(warning){warning.hidden=storageOK;warning.textContent=saveError||'Unable to save on this device. Keep this page open; results are not durable.'}
}
async function loadJSON(file){const r=await fetch(file,{cache:'no-store'});if(!r.ok)throw Error('Data unavailable: '+file);return r.json()}
async function init(){
 try{
  [player,catalog]=await Promise.all([loadJSON('./data/player.json'),loadJSON('./data/courses/index.json')]);
  courses=await Promise.all(catalog.courses.map(c=>loadJSON('./data/courses/'+c.file)));
  key='caddie:'+location.pathname+':memory:v1.3';memory=CaddieMemory.empty();
  let raw;
  try{raw=localStorage.getItem(key);lastStored=raw}catch{unavailable=true;storageOK=false}
  if(!unavailable){
   try{
    if(raw)memory=CaddieMemory.validate(JSON.parse(raw));
    else{
     for(const entry of catalog.courses.filter(c=>c.legacyRoundId)){
      const legacyKey='caddie:'+location.pathname+':results:v1.1:'+entry.legacyRoundId;
      const legacy=localStorage.getItem(legacyKey);
      if(legacy){memory=CaddieMemory.migrate(JSON.parse(legacy),CaddieMemory.courseRound(courses.find(c=>c.id===entry.id),entry.legacyTeeId,player),player,legacyKey);saveMemory();break}
     }
    }
   }catch(e){locked=true;storageOK=false;saveError=e.message}
  }
  showLibrary();
 }catch(e){app.innerHTML='<section class="loading"><div class="mark">C</div><h1>Caddie</h1><p>Course library unavailable. Reconnect once, then reopen.</p></section>';console.error(e)}
}
function pages(){return historical?[{type:'summary'}]:[{type:'course'},{type:'game'},...round.holes.map(h=>({type:'hole',h})),{type:'summary'}]}
function appTabs(){
 const selected=historical||screenMode==='history'?'rounds':screenMode==='round'||screenMode==='empty-play'?'play':'home';
 return `<nav class="app-tabs" aria-label="App navigation">${[['home','Home'],['play','Play'],['rounds','Rounds']].map(([id,label])=>`<button data-tab="${id}" ${selected===id?'aria-current="page"':''}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${tabIcons[id]}"/></svg><span>${label}</span></button>`).join('')}</nav>`;
}
function bindTabs(){document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{
 if(memory.active&&!saveMemory())return;
 if(b.dataset.tab==='home')showLibrary();else if(b.dataset.tab==='rounds')showHistory();else showPlay();
})}
function showPlay(){
 if(memory.active)return resumeRound();
 historical=false;preview=false;screenMode='empty-play';
 shell('<div class="eyebrow">PLAY</div><h1>Your next round awaits</h1><p class="intro">Choose a course to put your caddie to work.</p><button id="choose-course" class="primary flow-action">Start Round</button>');
 document.querySelector('#choose-course').onclick=showLibrary;
}
function shell(body){app.innerHTML=`<section class="screen"><div class="content"><p id="storage-warning" class="storage-warning" role="status" hidden></p>${body}</div>${appTabs()}</section>`;bindTabs();updateStatus()}

function libraryLink(){return '<button id="library" class="text-control">Home</button>'}
function activeRoundDetails(){
 const r=memory.active;if(!r)return '';
 const stats=RoundResults.stats(r.config.holes,r.results);
 return `<p class="intro">${esc(r.config.course)} · ${esc(r.config.tee)}<br>Hole ${r.activeHole}${stats.played?' · '+RoundResults.relativeLabel(stats):''}</p>`;
}
function exitHome(){if(saveMemory())showLibrary()}
function showLibrary(){
 screenMode='library';preview=false;historical=false;
 shell(`<div class="brand"><span class="brand-mark" aria-hidden="true">C</span><span>Caddie</span></div><h1>Where are we playing?</h1>${memory.active?`<button id="resume-round" class="primary library-resume">Resume Round</button>${activeRoundDetails()}`:''}<h2 class="intro">${memory.active?'Start a new round':'Start Round'}</h2><div class="library-list">${courses.map(c=>{const t=c.tees.find(t=>t.id===memory.preferences.tees[c.id])||c.tees[0];return `<button class="course-choice" data-course="${esc(c.id)}"><strong>${esc(c.course)}</strong><span>${esc(c.location)}</span><span>${esc(t.name)} · ${t.totalYards.toLocaleString()} yd · ${esc(t.rating??'Unknown')} / ${esc(t.slope??'Unknown')}</span></button>`}).join('')}</div>`);
 document.querySelector('#resume-round')?.addEventListener('click',resumeRound);
 document.querySelectorAll('[data-course]').forEach(b=>b.onclick=()=>showTees(courses.find(c=>c.id===b.dataset.course)));

}
function showTees(course){
 screenMode='tees';shell(`${libraryLink()}<div class="eyebrow">SELECT TEE</div><h1>${esc(course.course)}</h1><p class="intro">Choose the tee for this round.</p><div class="library-list">${course.tees.map(t=>`<button class="course-choice" data-tee="${esc(t.id)}"><strong>${esc(t.name)}${memory.preferences.tees[course.id]===t.id?' · Last played':''}</strong><span>${t.totalYards.toLocaleString()} yd · Rating ${esc(t.rating??'Unknown')} · Slope ${esc(t.slope??'Unknown')}</span></button>`).join('')}</div>`);
 document.querySelector('#library').onclick=showLibrary;
 document.querySelectorAll('[data-tee]').forEach(b=>b.onclick=()=>{
  round=CaddieMemory.courseRound(course,b.dataset.tee,player);state=CaddieMemory.create(round,player,'preview');preview=true;historical=false;screenMode='setup';idx=0;
  memory.preferences.tees[course.id]=b.dataset.tee;saveMemory();showStart();
 });
}
function showStart(){
 shell(`${libraryLink()}<div class="eyebrow">ROUND SETUP</div><h1>${esc(round.course)}</h1><p class="intro">${esc(round.tee)} · ${round.totalYards.toLocaleString()} yd · Rating ${esc(round.rating??'Unknown')} · Slope ${esc(round.slope??'Unknown')}</p><div class="start-actions">${memory.active?`<h2>Active round</h2>${activeRoundDetails()}<button id="resume-round" class="primary">Resume Round</button><p>Starting a new round requires confirmation before replacing this round.</p>`:''}<button id="start-round" class="${memory.active?'secondary':'primary'}">${memory.active?'Start New Round':'Start Round'}</button></div>`);
 document.querySelector('#library').onclick=showLibrary;
 document.querySelector('#resume-round')?.addEventListener('click',resumeRound);
 document.querySelector('#start-round').onclick=startRound;
}
function resumeRound(){
 if(!memory.active)return showLibrary();state=memory.active;round=state.config;preview=false;historical=false;screenMode='round';exactScoreHole=null;idx=round.holes.findIndex(h=>h.n===state.activeHole)+2;render();
}
function startRound(){
 if(locked){alert('Saved round memory cannot be read. No data has been replaced.');return}
 const scored=memory.active&&RoundResults.stats(memory.active.config.holes,memory.active.results).played===memory.active.config.holes.length;
 if(memory.active&&!confirm(scored?'Save the completed scorecard in Round History and start a new round?':'Start a new round? This will replace the incomplete active round. Cancel to keep it. Completed Round History is kept.'))return;
 const next=scored?CaddieMemory.complete(memory):CaddieMemory.clone(memory);next.active=CaddieMemory.create(round,player,crypto.randomUUID());next.active.page=0;
 if(saveMemory(next)||(unavailable&&!memory.active)){memory=next;state=memory.active;round=state.config;preview=false;historical=false;screenMode='round';exactScoreHole=null;idx=0;render()}
 else alert('The new round could not be saved. Your current round has been kept.');
}
function showHistory(){
 screenMode='history';historical=false;preview=false;shell(`<div class="eyebrow">ROUND MEMORY</div><h1>Recent rounds</h1><div class="library-list">${memory.history.length?memory.history.map(r=>`<button class="course-choice" data-history="${esc(r.id)}"><strong>${esc(r.config.course)} · ${esc(r.config.tee)}</strong><span class="history-score">${r.totals.score} · ${RoundResults.relativeLabel(r.totals)}</span><span>${esc(new Date(r.startedAt).toLocaleDateString())}</span></button>`).join(''):'<p class="intro">Completed rounds will stay here on this device.</p>'}</div>`);
 document.querySelectorAll('[data-history]').forEach(b=>b.onclick=()=>openHistory(b.dataset.history));
}
function openHistory(id){state=memory.history.find(r=>r.id===id);if(!state)return;round=state.config;historical=true;preview=false;screenMode='round';idx=0;render()}
function finishRound(){
 try{
  const next=CaddieMemory.complete(memory);
  if(!confirm('Finish this round and save it permanently in local Round History? The saved scorecard will be read-only.'))return;
  if(!saveMemory(next))throw Error('Could not save Round History. Your active round is still available; keep this page open and try again.');
  showLibrary();
 }catch(e){alert(e.message)}
}
function metric(label,value){return `<div class="metric"><b>${esc(value)}</b><span>${esc(label)}</span></div>`}
function choices(field,label,values,r){return `<fieldset><legend>${label}</legend><div class="choices">${values.map(([v,text])=>`<button type="button" data-field="${field}" data-value="${v}" ${field==='score'&&String(text).endsWith('+')?'data-score-plus="true"':''} aria-pressed="${r[field]===v}" class="${r[field]===v?'active':''}">${text}</button>`).join('')}</div></fieldset>`}
function counter(field,label,r,min){return `<div class="exact"><label for="${field}">${label}</label><button type="button" data-step="-1" data-field="${field}" aria-label="Decrease ${label}">−</button><input id="${field}" data-number="${field}" type="number" inputmode="numeric" min="${min}" step="1" value="${r[field]??''}" placeholder="—"><button type="button" data-step="1" data-field="${field}" aria-label="Increase ${label}">+</button></div>`}
function tracker(h){const r=state.results[h.n]||{},max=h.par+3;
 const exact=exactScoreHole===h.n||(r.score!==undefined&&(r.score<h.par-1||r.score>=max));
 return `<div class="tracker">${choices('score','Score',Array.from({length:5},(_,i)=>h.par-1+i).map(v=>[v,v===max?v+'+':String(v)]),{...r,score:r.score>=max?max:r.score})}${exact?counter('score','Score (any total)',r,1):''}${h.par===3?'<p class="na">Tee shot · N/A (par 3)</p>':choices('tee','Tee shot',['Fairway','Left','Right','Trouble'].map(v=>[v,v]),r)}${choices('gir','Green in regulation',[[true,'Yes'],[false,'No']],r)}${choices('putts','Putts',[[0,'0'],[1,'1'],[2,'2'],[3,'3+']],{...r,putts:r.putts>=3?3:r.putts})}${r.putts>=3?counter('putts','Exact putts',r,3):''}${choices('penalties','Penalty strokes',[[0,'0'],[1,'1'],[2,'2+']],{...r,penalties:r.penalties>=2?2:r.penalties})}${r.penalties>=2?counter('penalties','Exact penalties',r,2):''}<label for="note">Note <span class="muted">(optional)</span></label><textarea id="note" maxlength="240" rows="2" placeholder="Anything to remember?">${esc(r.note||'')}</textarea><p id="save-status" role="status"></p><p class="muted">Valid entries save immediately. Blank fields stay unrecorded.</p></div>`;
}
function totalLabel(holes){return RoundResults.totalLabel(holes,state.results)}
// Presentation copy only: preserve the complete strategy in snapshots and exports.
function recommendation(h){
 const original='Driver toward center-left. A good one may leave around 175 yards. Go for it only from a clean lie with a clear line; otherwise set up a wedge. 3H can finish among the staggered bunkers.';
 return h.advice===original?'A good driver toward center-left may leave around 175 yards. Go for it only from a clean lie with a clear line; otherwise set up a wedge. 3H can finish among the staggered bunkers.':h.advice||h.plan;
}
function summary(){const s=RoundResults.stats(round.holes,state.results),rel=RoundResults.relativeLabel(s);
 return `<div class="eyebrow">ROUND SUMMARY</div><h1>Your round</h1><p>${esc(round.course)} · ${esc(round.tee)} tees</p><section class="round-totals"><p class="eyebrow">${s.played}/${round.holes.length} holes scored</p><div class="totals">${metric(s.played===round.holes.length?'Total score':'Score so far',s.played?s.score:'—')}${metric('Relative to par · scored holes',s.played?rel:'—')}${metric('Front nine',totalLabel(round.holes.slice(0,9)))}${metric('Back nine',totalLabel(round.holes.slice(9)))}</div></section><div class="summary-actions">${!historical?`<button id="back-active" class="primary">Back to Hole ${state.activeHole}</button>`:''}<button id="copy-coach" class="secondary">Copy for Golf Coach</button><p id="copy-status" role="status" aria-live="polite"></p><div id="copy-fallback" hidden><label for="coach-text">Golf Coach report</label><textarea id="coach-text" readonly rows="8"></textarea><button id="select-report" class="secondary">Select report text</button><p>Touch and hold the selected text, choose Copy, then paste into your Golf Coach project.</p></div></div><section class="round-stats"><div class="stat"><div class="summaryrow"><span>Fairways hit / eligible</span><b>${s.fairways} / ${s.eligible}</b></div><p class="muted">${s.teeRecorded}/${s.eligible} tee results recorded</p></div><div class="stat"><div class="summaryrow"><span>GIR</span><b>${s.gir} / ${round.holes.length}</b></div><p class="muted">${s.girRecorded}/${round.holes.length} GIR results recorded</p></div><div class="stat"><div class="summaryrow"><span>Putts recorded</span><b>${s.putts}</b></div><p class="muted">${s.puttsRecorded}/${round.holes.length} holes recorded</p></div><div class="stat"><div class="summaryrow"><span>Penalty strokes recorded</span><b>${s.penalties}</b></div><p class="muted">${s.penaltiesRecorded}/${round.holes.length} holes recorded</p></div></section><section class="scorecard-section"><h2>Scorecard</h2><p>${historical?'Saved round · read-only.':'Tap a hole to edit.'} Use this for manual entry into TheGrint. Swipe the table sideways for all columns. — means not recorded.</p><div class="scorecard" tabindex="0" role="region" aria-label="${round.holes.length}-hole scorecard"><table><thead><tr>${['Hole','Par','Score','Tee','GIR','Putts','Pen.','Note'].map(v=>`<th scope="col">${v}</th>`).join('')}</tr></thead><tbody>${round.holes.map(h=>{const r=state.results[h.n]||{};return `<tr><th scope="row">${historical?h.n:`<button data-hole="${h.n}">${h.n}</button>`}</th><td>${h.par}</td><td>${r.score??'—'}</td><td>${h.par===3?'N/A':r.tee??'—'}</td><td>${r.gir===undefined?'—':r.gir?'Yes':'No'}</td><td>${r.putts??'—'}</td><td>${r.penalties??'—'}</td><td class="note-cell">${esc(r.note||'—')}</td></tr>`}).join('')}</tbody></table></div></section><section class="new-round-section">${historical?'<button id="history-list" class="secondary">Back to Round History</button>':`<button id="complete-round" class="primary">Finish Round</button><p class="muted">Record all ${round.holes.length} scores to finalize. Putts, GIR and notes may remain unrecorded.</p>`}${!historical?'<button id="exit-home" class="secondary">Exit to Home</button>':''}<p class="muted">Round History stays on this device. Clearing browser data removes it.</p></section>`;
}
function render(){const ps=pages(),p=ps[idx];let body='';
 if(p.type==='course'){
 const par=round.holes.reduce((n,h)=>n+h.par,0);
 body=`<div class="eyebrow">CADDIE / COURSE OVERVIEW</div><header class="course-heading"><h1>${esc(round.course)}</h1><p class="location">${esc(fact(round.location))}</p></header><div class="course-primary">${metric('Tee',fact(round.tee))}${metric('Yards',fact(round.totalYards))}${metric('Par',par)}</div><div class="course-secondary">${metric('Rating',fact(round.rating))}${metric('Slope',fact(round.slope))}${metric('Par 3 / 4 / 5',[3,4,5].map(p=>round.holes.filter(h=>h.par===p).length).join(' / '))}</div><section class="course-facts" aria-label="Course information">${[['Course style / type',round.courseStyle],['Grass type',round.grassType],['Driving range',round.drivingRange],['Practice green',round.practiceGreen],['Weather / forecast',round.weather]].map(([l,v])=>`<div class="summaryrow"><span>${l}</span><b>${esc(fact(v))}</b></div>`).join('')}</section>`;
 }else if(p.type==='game')body=`<div class="eyebrow">BEFORE THE FIRST TEE</div><h1>Game Plan</h1><section class="mission"><h2>Scoring Mission</h2><p class="strategy">${esc(round.mission)}</p></section><div class="briefing">${round.gamePlan.map(([title,text])=>`<section><h2>${esc(title)}</h2><p>${esc(text)}</p></section>`).join('')}</div><section class="club-distances"><h2>Your club distances</h2><div class="clubgrid">${state.player.clubs.map(([c,y])=>`<div class="club"><b>${esc(c)}</b><span>${y} yd</span></div>`).join('')}</div></section>`;
 else if(p.type==='hole'){const h=p.h;body=`<h1 class="sr-only">Hole ${h.n}</h1><section class="hero recommendation" aria-label="Caddie recommendation"><p class="eyebrow">TEE SHOT</p><h2 class="recommended-club">${esc(h.teeClub)}</h2><p class="target"><span class="target-label">Target</span><span class="target-value">${esc(h.target)}</span></p><p class="strategy">${esc(recommendation(h))}</p></section><div class="hole-actions"><button id="ask-caddie" class="ask-control">${CaddieHandoff.mark}<span><strong>Ask Caddie</strong><small>${h.n===state.activeHole?'Take this hole to ChatGPT':'ChatGPT · playing Hole '+state.activeHole}</small></span><span class="ask-arrow" aria-hidden="true">↗</span></button><button id="record-score" class="primary">${state.results[h.n]?.score!==undefined?'Score '+state.results[h.n].score+' · Edit':'Record Score'}</button></div>`}
 else body=summary();
 if(p.type==='course')body+='<button id="to-game" class="primary flow-action">Game Plan →</button>';
 if(p.type==='game')body+=`<button id="to-hole" class="primary flow-action">Go to Hole ${state.activeHole} →</button>`;
 body='<p id="storage-warning" class="storage-warning" role="status" hidden></p>'+body;
 const toolbar=!historical?`<div class="round-toolbar"><span class="active-context">${p.type==='hole'?(p.h.n===state.activeHole?'On course':'Preview · playing Hole '+state.activeHole):'Playing Hole '+state.activeHole}</span><button id="open-summary" class="text-control">Summary</button><button id="round-menu" class="text-control" aria-label="Round menu">•••</button></div>`:'';
 const holes=p.type==='hole'?`<nav class="hole-nav" aria-label="Hole navigation"><button id="prev" ${idx===2?'disabled':''} aria-label="Previous hole">‹</button><label><span class="sr-only">Choose hole</span><select id="jump">${round.holes.map((h,i)=>`<option value="${i+2}" ${idx===i+2?'selected':''}>Hole ${h.n}</option>`).join('')}</select></label><button id="next" ${idx===round.holes.length+1?'disabled':''} aria-label="Next hole">›</button><div class="hole-distance"><b>${p.h.yards}<small> yd</small></b><span>Par ${p.h.par} · HCP ${p.h.hcp}</span></div></nav>`:'';
 app.innerHTML=`<section class="screen screen-${p.type}"><div class="content">${toolbar}${holes}${body}</div>${appTabs()}</section>`;
 const scorecard=document.querySelector('.scorecard-section'),stats=document.querySelector('.round-stats');if(scorecard&&stats)stats.before(scorecard);
 document.querySelector('#prev')?.addEventListener('click',()=>go(-1));document.querySelector('#next')?.addEventListener('click',()=>go(1));document.querySelector('#jump')?.addEventListener('change',e=>navigate(Number(e.target.value)));
 document.querySelector('#round-menu')?.addEventListener('click',showRoundMenu);
 document.querySelector('#record-score')?.addEventListener('click',()=>showScore(p.h));
 bindTabs();
 document.querySelectorAll('[data-hole]').forEach(b=>b.onclick=()=>navigate(round.holes.findIndex(h=>h.n===Number(b.dataset.hole))+2));
 const openSummary=document.querySelector('#open-summary');if(openSummary)openSummary.onclick=()=>navigate(pages().length-1);
 const back=document.querySelector('#back-active');if(back)back.onclick=()=>navigate(round.holes.findIndex(h=>h.n===state.activeHole)+2);
 const copy=document.querySelector('#copy-coach');if(copy)copy.onclick=copyForCoach;
 document.querySelector('#exit-home')?.addEventListener('click',exitHome);
 document.querySelector('#library')?.addEventListener('click',showLibrary);
 document.querySelector('#to-game')?.addEventListener('click',()=>navigate(1));
 document.querySelector('#to-hole')?.addEventListener('click',()=>navigate(round.holes.findIndex(h=>h.n===state.activeHole)+2));
 document.querySelector('#resume-round')?.addEventListener('click',resumeRound);
 document.querySelector('#complete-round')?.addEventListener('click',finishRound);
 document.querySelector('#history-list')?.addEventListener('click',showHistory);
 document.querySelector('#ask-caddie')?.addEventListener('click',()=>CaddieHandoff.show(memory.active,event=>{const destination=[memory.active,...memory.history].find(r=>r?.id===event.roundId);if(!destination)return false;destination.events.push({...event,order:destination.events.length+1});return saveMemory()}));
 updateStatus();
}
async function copyForCoach(){
 const button=document.querySelector('#copy-coach'),status=document.querySelector('#copy-status');
 const text=CaddieContext.full(state);
 button.disabled=true;status.textContent='Copying…';
 try{
  if(!navigator.clipboard?.writeText)throw Error('Clipboard unavailable');
  await navigator.clipboard.writeText(text);
  if(!button.isConnected)return;
  status.textContent='Copied';document.querySelector('#copy-fallback').hidden=true;
 }catch{
  if(!button.isConnected)return;
  status.textContent='Select and copy the report below.';
  const box=document.querySelector('#copy-fallback'),input=document.querySelector('#coach-text');
  box.hidden=false;input.value=text;
  const select=()=>{input.focus();input.select();input.setSelectionRange(0,input.value.length)};
  document.querySelector('#select-report').onclick=select;select();
 }finally{button.disabled=false}
}
function redraw(){
 if(!scoreSheet)return;
 const pane=scoreSheet.querySelector('.sheet-body'),y=pane.scrollTop,focused=document.activeElement;
 const selector=focused?.dataset.value!==undefined?`[data-field="${focused.dataset.field}"][data-value="${focused.dataset.value}"]`:focused?.dataset.step?`[data-field="${focused.dataset.field}"][data-step="${focused.dataset.step}"]`:null;
 pane.innerHTML=tracker(scoreHole);bindTracker(scoreHole);updateStatus();
 if(selector)pane.querySelector(selector)?.focus({preventScroll:true});pane.scrollTop=y;
}
function closeScore(){
 if(!scoreSheet)return;scoreSheet.close();scoreSheet.remove();scoreSheet=null;scoreHole=null;
 const y=document.querySelector('.content').scrollTop;render();document.querySelector('.content').scrollTop=y;document.querySelector('#record-score')?.focus({preventScroll:true});
}
function showScore(h){
 scoreHole=h;exactScoreHole=null;scoreSheet=document.createElement('dialog');scoreSheet.id='score-sheet';scoreSheet.className='bottom-sheet';scoreSheet.setAttribute('aria-labelledby','score-title');
 scoreSheet.innerHTML=`<header class="sheet-heading"><h2 id="score-title">Hole ${h.n} · Record score</h2><button id="close-score" aria-label="Close score entry">×</button></header><div class="sheet-body">${tracker(h)}</div><footer class="sheet-footer"><button id="score-done" class="primary">Done</button></footer>`;
 document.body.append(scoreSheet);scoreSheet.showModal();bindTracker(h);updateStatus();
 document.querySelector('#close-score').onclick=closeScore;scoreSheet.addEventListener('cancel',e=>{e.preventDefault();closeScore()});
 document.querySelector('#score-done').onclick=()=>{for(const input of scoreSheet.querySelectorAll('input'))if(!input.reportValidity())return;closeScore()};
}
function showRoundMenu(){
 const dialog=document.createElement('dialog');dialog.className='bottom-sheet';dialog.id='round-sheet';dialog.setAttribute('aria-labelledby','round-title');
 dialog.innerHTML=`<header class="sheet-heading"><h2 id="round-title">Your round</h2><button id="close-round-menu" aria-label="Close round menu">×</button></header><div class="sheet-body menu-items"><button data-section="0">Course Overview</button><button data-section="1">Game Plan</button><button data-section="${round.holes.findIndex(h=>h.n===state.activeHole)+2}">Current Hole ${state.activeHole}</button><button data-section="${pages().length-1}">Round Summary</button><button id="menu-home">Exit to Home</button></div>`;
 const close=()=>{dialog.close();dialog.remove()};document.body.append(dialog);dialog.showModal();
 dialog.querySelector('#close-round-menu').onclick=close;dialog.addEventListener('cancel',e=>{e.preventDefault();close()});
 dialog.querySelectorAll('[data-section]').forEach(b=>b.onclick=()=>{close();navigate(Number(b.dataset.section))});dialog.querySelector('#menu-home').onclick=()=>{close();exitHome()};
}

function syncChoices(){
 document.querySelectorAll('[data-value]').forEach(b=>{
  const input=document.querySelector('[data-number="'+b.dataset.field+'"]');if(!input)return;
  const value=Number(input.value),choice=Number(b.dataset.value);
  const selected=input.value!==''&&(b.dataset.scorePlus?value>=choice:b.dataset.field==='putts'&&choice===3?value>=3:b.dataset.field==='penalties'&&choice===2?value>=2:value===choice);
  b.setAttribute('aria-pressed',String(selected));b.classList.toggle('active',selected);
 });
}
function validScoreInputs(){for(const input of scoreSheet.querySelectorAll('input'))if(!input.reportValidity())return false;return true}
function bindTracker(h){
 const result=()=>state.results[h.n]||(state.results[h.n]={});
 let before={...(state.results[h.n]||{})};
 const saveResult=()=>{state.activeHole=RoundResults.afterEntry(round.holes,state.activeHole,h.n,before,result());CaddieMemory.trackCompletion(state,h.n,before,result());before={...result()};persist();const label=document.querySelector('.active-context');if(label)label.textContent=h.n===state.activeHole?'On course':'Preview · playing Hole '+state.activeHole};
 document.querySelectorAll('[data-value]').forEach(b=>b.onclick=()=>{if(!validScoreInputs())return;const f=b.dataset.field;const v=f==='tee'?b.dataset.value:f==='gir'?b.dataset.value==='true':Number(b.dataset.value);const r=result();if(b.getAttribute('aria-pressed')==='true'){delete r[f];if(f==='score')exactScoreHole=null}else{r[f]=v;if(f==='score')exactScoreHole=b.dataset.scorePlus?h.n:null}saveResult();redraw()});
 document.querySelectorAll('[data-step]').forEach(b=>b.onclick=()=>{if(!validScoreInputs())return;const f=b.dataset.field,r=result(),min=f==='score'?1:f==='putts'?3:2;r[f]=Math.max(min,(r[f]??(f==='score'?h.par:min))+Number(b.dataset.step));saveResult();redraw()});
 document.querySelectorAll('[data-number]').forEach(input=>input.oninput=()=>{const r=result(),v=Number(input.value);if(input.validity.badInput){input.setCustomValidity('Enter a whole number');input.reportValidity();return}if(input.value===''){delete r[input.dataset.number];input.setCustomValidity('')}else if(Number.isSafeInteger(v)&&v>=Number(input.min)){r[input.dataset.number]=v;input.setCustomValidity('')}else {input.setCustomValidity('Enter a whole number of at least '+input.min);input.reportValidity();return}saveResult();syncChoices()});
 document.querySelector('#note').oninput=e=>{result().note=e.target.value;saveResult()};
}
function navigate(n){if(historical)return;exactScoreHole=null;idx=n;state.page=idx;persist();render()}
function go(d){if(!round||screenMode!=='round'||historical||document.querySelector('dialog[open]'))return;
 const p=pages()[idx];if(p.type!=='hole')return;
 if(d===1)state.activeHole=RoundResults.afterAdvance(round.holes,state.results,state.activeHole,p.h.n);
 navigate(Math.max(2,Math.min(round.holes.length+1,idx+d)));
}
// Use explicit hole controls; horizontal page gestures compete with iOS and scorecard scrolling.
function fitViewport(){
 const viewport=window.visualViewport;if(!viewport)return;
 document.documentElement.style.setProperty('--visual-height',viewport.height+'px');
 document.documentElement.style.setProperty('--keyboard-bottom',Math.max(0,innerHeight-viewport.height-viewport.offsetTop)+'px');
 if(document.activeElement?.matches('dialog input,dialog textarea'))document.activeElement.scrollIntoView({block:'nearest'});
}
window.visualViewport?.addEventListener('resize',fitViewport);window.visualViewport?.addEventListener('scroll',fitViewport);fitViewport();
if('serviceWorker'in navigator)navigator.serviceWorker.register('./service-worker.js',{updateViaCache:'none'}).catch(console.error);
init();
