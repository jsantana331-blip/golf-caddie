/* Pure SVG renderer. Geometry stays outside round snapshots and coaching context. */
const HoleLayout=(()=>{
 const esc=s=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
 const point=p=>Array.isArray(p)&&p.length===2&&p.every(n=>Number.isFinite(n)&&n>=0&&n<=100);
 const polygon=p=>Array.isArray(p)&&p.length>=3&&p.every(point);
 const source=s=>s&&s.verified===true&&/^https:\/\//.test(s.url||'')&&/^\d{4}-\d{2}-\d{2}$/.test(s.verifiedAt||'')&&typeof s.attribution==='string'&&s.attribution.length>0&&s.redistributionAllowed===true&&typeof s.license==='string'&&s.license.length>0;
 function valid(g){return !!(g&&source(g.source)&&point(g.tee)&&polygon(g.fairway)&&polygon(g.green)&&['bunkers','water','trees'].every(k=>g[k]===undefined||(Array.isArray(g[k])&&g[k].every(polygon)))&&(!g.target||(point(g.target.position)&&source(g.target.source))));}
 function find(data,courseId,teeId,hole){return data?.schemaVersion===1&&Array.isArray(data.holes)?data.holes.find(g=>g?.courseId===courseId&&g.teeId===teeId&&g.hole===hole&&valid(g)):undefined;}
 function render(g){
  if(!valid(g))return '<p class="layout-unavailable"><span aria-hidden="true">◌</span> Hole layout not yet verified</p>';
  const shape=(points,kind)=>`<polygon class="layout-${kind}" points="${points.map(p=>p.join(',')).join(' ')}"/>`;
  return `<figure class="hole-layout"><svg viewBox="0 0 100 100" role="img" aria-label="${esc(g.description||'Verified overhead hole layout')}">${(g.trees||[]).map(p=>shape(p,'trees')).join('')}${shape(g.fairway,'fairway')}${(g.water||[]).map(p=>shape(p,'water')).join('')}${(g.bunkers||[]).map(p=>shape(p,'bunker')).join('')}${shape(g.green,'green')}<circle class="layout-tee" cx="${g.tee[0]}" cy="${g.tee[1]}" r="1.8"/>${g.target?`<circle class="layout-target" cx="${g.target.position[0]}" cy="${g.target.position[1]}" r="3"/>`:''}</svg><figcaption>${esc(g.source.attribution)} · Simplified, not to scale</figcaption></figure>`;
 }
 return {valid,find,render};
})();
if(typeof module!=='undefined')module.exports=HoleLayout;
