let round,idx=0,key,state;
const app=document.querySelector('#app');
const esc=s=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const fact=v=>v===null||v===undefined||v===''?'Unknown':typeof v==='boolean'?(v?'Yes':'No'):v;
let storageOK=true;
function persist(){try{localStorage.setItem(key,JSON.stringify(state));storageOK=true}catch{storageOK=false} updateStatus()}
function updateStatus(){const el=document.querySelector('#save-status');if(el)el.textContent=storageOK?'Saved on this device':'Unable to save on this device. Keep this page open.'}
async function init(){
 try{
  const response=await fetch('./data/current-round.json',{cache:'no-store'});if(!response.ok)throw Error('Round unavailable');round=await response.json();
  key='caddie:'+location.pathname+':results:v1.1:'+round.id;
  state={version:1,startedAt:new Date().toISOString(),results:{},page:0};
  try{const raw=JSON.parse(localStorage.getItem(key)||'null');if(raw?.version===1){state.results=RoundResults.clean(raw.results,round.holes);state.startedAt=typeof raw.startedAt==='string'?raw.startedAt:state.startedAt;state.page=Number.isInteger(raw.page)?raw.page:0}}catch{storageOK=false}
  idx=Math.max(0,Math.min(round.holes.length+2,state.page));render();
 }catch(e){app.innerHTML='<section class="loading"><div class="mark">C</div><h1>Caddie</h1><p>Round data unavailable. Reconnect once, then reopen.</p></section>';console.error(e)}
}
function pages(){return [{type:'course'},{type:'game'},...round.holes.map(h=>({type:'hole',h})),{type:'summary'}]}
function metric(label,value){return `<div class="metric"><b>${esc(value)}</b><span>${esc(label)}</span></div>`}
function choices(field,label,values,r){return `<fieldset><legend>${label}</legend><div class="choices">${values.map(([v,text])=>`<button type="button" data-field="${field}" data-value="${v}" aria-pressed="${r[field]===v}" class="${r[field]===v?'active':''}">${text}</button>`).join('')}</div></fieldset>`}
function counter(field,label,r,min){return `<div class="exact"><label for="${field}">${label}</label><button type="button" data-step="-1" data-field="${field}" aria-label="Decrease ${label}">−</button><input id="${field}" data-number="${field}" type="number" inputmode="numeric" min="${min}" step="1" value="${r[field]??''}" placeholder="—"><button type="button" data-step="1" data-field="${field}" aria-label="Increase ${label}">+</button></div>`}
function tracker(h){const r=state.results[h.n]||{};
 return `<div class="card tracker"><h2>Record result</h2>${choices('score','Score',Array.from({length:5},(_,i)=>h.par-1+i).map(v=>[v,String(v)]),r)}${counter('score','Exact score',r,1)}${h.par===3?'<p class="na">Tee shot · N/A (par 3)</p>':choices('tee','Tee shot',['Fairway','Left','Right','Trouble'].map(v=>[v,v]),r)}${choices('gir','Green in regulation',[[true,'Yes'],[false,'No']],r)}${choices('putts','Putts',[[0,'0'],[1,'1'],[2,'2'],[3,'3+']],{...r,putts:r.putts>=3?3:r.putts})}${r.putts>=3?counter('putts','Exact putts',r,3):''}${choices('penalties','Penalty strokes',[[0,'0'],[1,'1'],[2,'2+']],{...r,penalties:r.penalties>=2?2:r.penalties})}${r.penalties>=2?counter('penalties','Exact penalties',r,2):''}<label for="note">Note <span class="muted">(optional)</span></label><textarea id="note" maxlength="240" rows="2" placeholder="Anything to remember?">${esc(r.note||'')}</textarea><p id="save-status" role="status"></p></div>`;
}
function totalLabel(holes){const s=RoundResults.stats(holes,state.results);return s.played?`${s.score}${s.played<holes.length?' ('+s.played+'/'+holes.length+' holes)':''}`:'—'}
function summary(){const s=RoundResults.stats(round.holes,state.results),rel=s.relative===0?'E':s.relative>0?'+'+s.relative:String(s.relative);
 return `<div class="eyebrow">ROUND SUMMARY</div><h1>Your round</h1><p>${esc(round.course)} · ${esc(round.tee)} tees</p><div class="card hero"><h2>${s.played}/18 holes scored</h2><div class="grid">${metric(s.played===18?'Total score':'Score so far',s.played?s.score:'—')}${metric('Relative to par · scored holes',s.played?rel:'—')}${metric('Front nine',totalLabel(round.holes.slice(0,9)))}${metric('Back nine',totalLabel(round.holes.slice(9)))}</div></div><div class="card"><div class="summaryrow"><span>Fairways hit / eligible</span><b>${s.fairways} / ${s.eligible}</b></div><p class="muted">${s.teeRecorded}/${s.eligible} tee results recorded</p><div class="summaryrow"><span>GIR</span><b>${s.gir} / 18</b></div><p class="muted">${s.girRecorded}/18 GIR results recorded</p><div class="summaryrow"><span>Putts recorded</span><b>${s.putts}</b></div><p class="muted">${s.puttsRecorded}/18 holes recorded</p><div class="summaryrow"><span>Penalty strokes recorded</span><b>${s.penalties}</b></div><p class="muted">${s.penaltiesRecorded}/18 holes recorded</p></div><div class="card"><h2>Scorecard</h2><p>Use this for manual entry into TheGrint. Tap a hole to edit. Swipe the table sideways for all columns. — means not recorded.</p><div class="scorecard" tabindex="0" role="region" aria-label="18-hole scorecard"><table><thead><tr>${['Hole','Par','Score','Tee','GIR','Putts','Pen.','Note'].map(v=>`<th scope="col">${v}</th>`).join('')}</tr></thead><tbody>${round.holes.map(h=>{const r=state.results[h.n]||{};return `<tr><th scope="row"><button data-hole="${h.n}">${h.n}</button></th><td>${h.par}</td><td>${r.score??'—'}</td><td>${h.par===3?'N/A':r.tee??'—'}</td><td>${r.gir===undefined?'—':r.gir?'Yes':'No'}</td><td>${r.putts??'—'}</td><td>${r.penalties??'—'}</td><td class="note-cell">${esc(r.note||'—')}</td></tr>`}).join('')}</tbody></table></div></div><div class="card"><button id="new-round" class="secondary">Start a new round</button><p class="muted">Replaces this device’s current scorecard after confirmation.</p></div>`;
}
function render(){const ps=pages(),p=ps[idx];let body='';
 if(p.type==='course'){
 const par=round.holes.reduce((n,h)=>n+h.par,0);
 body=`<div class="eyebrow">COURSE OVERVIEW</div><div class="card hero"><h1>${esc(round.course)}</h1><p>${esc(fact(round.location))}</p><div class="grid">${[['Tee',round.tee],['Yardage',round.totalYards],['Par',par],['Course rating',round.rating],['Slope',round.slope],['Par 3 / 4 / 5',[3,4,5].map(p=>round.holes.filter(h=>h.par===p).length).join(' / ')]].map(([l,v])=>metric(l,fact(v))).join('')}</div></div><div class="card">${[['Course style / type',round.courseStyle],['Grass type',round.grassType],['Driving range',round.drivingRange],['Practice green',round.practiceGreen],['Weather / forecast',round.weather]].map(([l,v])=>`<div class="summaryrow"><span>${l}</span><b>${esc(fact(v))}</b></div>`).join('')}</div>`;
 }else if(p.type==='game')body=`<div class="eyebrow">TODAY’S STRATEGY</div><h1>Game Plan</h1><div class="card hero"><h2>Scoring Mission</h2><div class="strategy">${esc(round.mission)}</div></div>${round.gamePlan.map(([title,text])=>`<div class="card"><h2>${esc(title)}</h2><p>${esc(text)}</p></div>`).join('')}<div class="card"><h2>Your club distances</h2><div class="clubgrid">${round.clubs.map(([c,y])=>`<div class="club"><b>${esc(c)}</b>${y} yd</div>`).join('')}</div></div>`;
 else if(p.type==='hole'){const h=p.h;body=`<div class="eyebrow">HOLE ${h.n} · HCP ${h.hcp}</div><h1>Par ${h.par} · ${h.yards} yd</h1><div class="card hero"><div class="strategy">${esc(h.advice||h.plan)}</div></div><div class="card reference"><b>${esc(h.teeClub)} · ${esc(h.target)}</b><p>Avoid: ${esc(h.danger.replace(/ corridor/g,''))}</p><p>Expected: ${esc(h.expected||'Unknown')}</p></div>${tracker(h)}`}
 else body=summary();
 const label=p.type==='hole'?'Hole '+p.h.n:p.type==='course'?'Course Overview':p.type==='game'?'Game Plan':'Round Summary';
 app.innerHTML=`<section class="screen"><div class="content">${body}</div><nav class="nav" aria-label="Round navigation"><button id="prev" ${idx===0?'disabled':''} aria-label="Previous page">‹</button><label class="count"><span class="sr-only">Go to page</span><select id="jump">${ps.map((x,i)=>`<option value="${i}" ${i===idx?'selected':''}>${x.type==='hole'?'Hole '+x.h.n:x.type==='course'?'Course Overview':x.type==='game'?'Game Plan':'Round Summary'}</option>`).join('')}</select><span>${idx+1}/${ps.length}</span></label><button id="next" ${idx===ps.length-1?'disabled':''} aria-label="${p.type==='hole'&&p.h.n<18?'Next hole':'Next page'}">›</button></nav></section>`;
 document.querySelector('#prev').onclick=()=>go(-1);document.querySelector('#next').onclick=()=>go(1);document.querySelector('#jump').onchange=e=>navigate(Number(e.target.value));
 document.querySelectorAll('[data-hole]').forEach(b=>b.onclick=()=>navigate(round.holes.findIndex(h=>h.n===Number(b.dataset.hole))+2));
 const reset=document.querySelector('#new-round');if(reset)reset.onclick=()=>{if(confirm('Replace this scorecard with a new round? Record your results in TheGrint first.')){state={version:1,startedAt:new Date().toISOString(),results:{},page:0};navigate(0)}};
 if(p.type==='hole')bindTracker(p.h);updateStatus();
}
function redraw(){const y=document.querySelector('.content').scrollTop;render();document.querySelector('.content').scrollTop=y}
function bindTracker(h){
 const result=()=>state.results[h.n]||(state.results[h.n]={});
 document.querySelectorAll('[data-value]').forEach(b=>b.onclick=()=>{const f=b.dataset.field;const v=f==='tee'?b.dataset.value:f==='gir'?b.dataset.value==='true':Number(b.dataset.value);const r=result();if(r[f]===v)delete r[f];else r[f]=v;persist();redraw()});
 document.querySelectorAll('[data-step]').forEach(b=>b.onclick=()=>{const f=b.dataset.field,r=result(),min=f==='score'?1:f==='putts'?3:2;r[f]=Math.max(min,(r[f]??(f==='score'?h.par:min))+Number(b.dataset.step));persist();redraw()});
 document.querySelectorAll('[data-number]').forEach(input=>input.oninput=()=>{const r=result(),v=Number(input.value);if(input.value===''){delete r[input.dataset.number];input.setCustomValidity('')}else if(Number.isSafeInteger(v)&&v>=Number(input.min)){r[input.dataset.number]=v;input.setCustomValidity('')}else {input.setCustomValidity('Enter a whole number of at least '+input.min);input.reportValidity();return}persist()});
 document.querySelector('#note').oninput=e=>{result().note=e.target.value;persist()};
}
function navigate(n){idx=n;state.page=idx;persist();render()}
function go(d){if(round)navigate(Math.max(0,Math.min(pages().length-1,idx+d)))}
let gesture=null;
addEventListener('touchstart',e=>{gesture=null;if(e.touches.length!==1||e.target.closest('button,input,textarea,select,label,fieldset,.tracker,.scorecard,.nav'))return;const t=e.touches[0];gesture={x:t.clientX,y:t.clientY}},{passive:true});
addEventListener('touchend',e=>{if(!gesture)return;const t=e.changedTouches[0],dx=t.clientX-gesture.x,dy=t.clientY-gesture.y;gesture=null;if(Math.abs(dx)>80&&Math.abs(dx)>Math.abs(dy)*2)go(dx<0?1:-1)},{passive:true});
addEventListener('touchcancel',()=>gesture=null,{passive:true});
if('serviceWorker'in navigator)navigator.serviceWorker.register('./service-worker.js',{updateViaCache:'none'}).catch(console.error);
init();
