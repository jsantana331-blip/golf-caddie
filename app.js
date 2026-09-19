
let round, idx=0;
const app=document.querySelector("#app");
const key="caddie:"+location.pathname+":arp";
const saved=JSON.parse(localStorage.getItem(key)||"{}");

async function init(){
  try{
    round=await fetch("./data/current-round.json",{cache:"no-store"}).then(r=>{if(!r.ok)throw Error();return r.json()});
    render();
  }catch(e){app.innerHTML='<section class="loading"><div class="mark">C</div><h1>Caddie</h1><p>Round data unavailable. Reconnect once, then reopen.</p></section>'}
}
function esc(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
function pages(){return [{type:"course"},{type:"game"},...round.holes.map(h=>({type:"hole",h})),{type:"summary"}]}
function render(){
 const ps=pages(),p=ps[idx]; let body="";
 if(p.type==="course"){
   body=`<div class="card hero"><div class="eyebrow">ROUND CADDIE</div><h1>${esc(round.course)}</h1><p>${esc(round.tee)} tees · ${round.totalYards.toLocaleString()} yards</p><div class="grid"><div class="metric"><b>${round.rating}</b><span>Rating</span></div><div class="metric"><b>${round.slope}</b><span>Slope</span></div></div></div><div class="card"><h2>Scoring mission</h2><div class="strategy">${esc(round.mission)}</div></div><div class="card cue">${esc(round.swingCue)}</div>`;
 } else if(p.type==="game"){
   body=`<div class="top"><div><div class="eyebrow">0.5 · GAME PLAN</div><h1>Operating System</h1></div></div><div class="card hero"><h2>Decision rule</h2><div class="strategy">Driver when the corridor supports it. 3H when driver dispersion overlaps trouble. Choose the club that leaves a normal next shot.</div></div><div class="card"><h2>Bag</h2><div class="clubgrid">${round.clubs.map(c=>`<div class="club"><b>${esc(c[0])}</b>${c[1]} yd</div>`).join("")}</div></div>`;
 } else if(p.type==="hole"){
   const h=p.h,sel=saved[h.n]||"";
   body=`<div class="top"><div><div class="eyebrow">HOLE ${h.n} · HCP ${h.hcp}</div><h1>Par ${h.par} · ${h.yards} yd</h1></div><div class="pill">${esc(h.teeClub)}</div></div><div class="card hero"><div class="muted">TARGET</div><h2>${esc(h.target)}</h2><div class="strategy">${esc(h.plan)}</div></div><div class="card danger"><div class="muted">DANGER / MISS</div><b>${esc(h.danger)}</b></div><div class="card cue">${esc(round.swingCue)}</div><div class="arp"><button data-v="A" class="${sel==="A"?"active":""}">A · Attack</button><button data-v="R" class="${sel==="R"?"active":""}">R · Recover</button><button data-v="P" class="${sel==="P"?"active":""}">P · Penalty</button></div>`;
 } else {
   const vals=Object.values(saved),A=vals.filter(v=>v==="A").length,R=vals.filter(v=>v==="R").length,P=vals.filter(v=>v==="P").length,total=A+R+P;
   body=`<div class="eyebrow">ROUND SUMMARY</div><h1>Position Report</h1><div class="card hero"><div class="grid"><div class="metric"><b>${A}</b><span>Attackable</span></div><div class="metric"><b>${total?Math.round(A/total*100):0}%</b><span>Attack rate</span></div></div></div><div class="card"><div class="summaryrow"><span>Recovery</span><b>${R}</b></div><div class="summaryrow"><span>Penalty</span><b>${P}</b></div><div class="summaryrow"><span>Tracked tee shots</span><b>${total}</b></div></div><div class="card"><b>Post-round question</b><p>How often did you arrive at your second shot with a clear view of the green?</p></div>`;
 }
 const label=p.type==="course"?"COURSE":p.type==="game"?"GAME PLAN":p.type==="summary"?"SUMMARY":"HOLE "+p.h.n;
 app.innerHTML=`<section class="screen">${body}<div class="nav"><button id="prev" ${idx===0?"disabled":""}>‹</button><div class="count">${label}<br>${idx+1}/${ps.length}</div><button id="next" ${idx===ps.length-1?"disabled":""}>›</button></div></section>`;
 document.querySelector("#prev").onclick=()=>go(-1); document.querySelector("#next").onclick=()=>go(1);
 document.querySelectorAll(".arp button").forEach(b=>b.onclick=()=>{saved[p.h.n]=b.dataset.v;localStorage.setItem(key,JSON.stringify(saved));render()});
}
function go(d){idx=Math.max(0,Math.min(pages().length-1,idx+d));render()}
let sx=0;addEventListener("touchstart",e=>sx=e.changedTouches[0].clientX,{passive:true});addEventListener("touchend",e=>{const d=e.changedTouches[0].clientX-sx;if(Math.abs(d)>65)go(d<0?1:-1)},{passive:true});
if("serviceWorker"in navigator)navigator.serviceWorker.register("./service-worker.js");
init();
