/* Pure SVG renderer. Geometry stays outside round snapshots and coaching context. */
const HoleLayout=(()=>{
 const esc=s=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
 const point=p=>Array.isArray(p)&&p.length===2&&p.every(n=>Number.isFinite(n)&&n>=0&&n<=100);
 const polygon=p=>Array.isArray(p)&&p.length>=3&&p.every(point);
 const source=s=>s&&s.verified===true&&/^https:\/\//.test(s.url||'')&&/^\d{4}-\d{2}-\d{2}$/.test(s.verifiedAt||'')&&typeof s.attribution==='string'&&s.attribution.length>0&&s.redistributionAllowed===true&&typeof s.license==='string'&&s.license.length>0;
 function valid(g){return !!(g&&source(g.source)&&point(g.tee)&&polygon(g.fairway)&&polygon(g.green)&&['bunkers','water','trees'].every(k=>g[k]===undefined||(Array.isArray(g[k])&&g[k].every(polygon)))&&(!g.target||(point(g.target.position)&&source(g.target.source))));}
 // Sketches are a separate evidence class. They never pass the verified-geometry
 // validator and cannot contain measured distances, bunkers or target zones.
 function schematicValid(g){
  return !!(g&&g.kind==='schematic'&&g.precision==='illustrative'&&g.originalArtwork===true&&
   typeof g.courseId==='string'&&Array.isArray(g.teeIds)&&g.teeIds.every(t=>typeof t==='string')&&
   Number.isInteger(g.hole)&&g.hole>0&&Array.isArray(g.route)&&g.route.length>=2&&g.route.length<=8&&g.route.every(point)&&
   Math.hypot(g.route[0][0]-g.route.at(-1)[0],g.route[0][1]-g.route.at(-1)[1])>10&&
   ['open','tree-lined','wooded'].includes(g.treeContext)&&Array.isArray(g.water)&&g.water.every(point)&&
   g.target===undefined&&g.bunkers===undefined&&g.distances===undefined&&
   g.source?.referenceReviewed===true&&/^https:\/\//.test(g.source.url||'')&&
   typeof g.source.attribution==='string'&&typeof g.source.routingEvidence==='string'&&typeof g.uncertainty==='string');
 }
 function find(data,courseId,teeId,hole){
  if(data?.schemaVersion!==1)return undefined;
  const verified=Array.isArray(data.holes)?data.holes.find(g=>g?.courseId===courseId&&g.teeId===teeId&&g.hole===hole&&valid(g)):undefined;
  if(verified)return verified;
  return Array.isArray(data.schematics)?data.schematics.find(g=>schematicValid(g)&&g.courseId===courseId&&g.teeIds.includes(teeId)&&g.hole===hole):undefined;
 }
 function schematic(g){
  const points=g.route.map(([x,y])=>[x+30,y]);
  // Smooth the coarse route anchors. The constant ribbon width is a visual
  // convention, not a claim about actual fairway boundaries.
  const fmt=n=>Number(n.toFixed(2));
  let d=`M ${points[0].join(' ')}`;
  for(let i=0;i<points.length-1;i++){
   const a=points[Math.max(0,i-1)],b=points[i],c=points[i+1],e=points[Math.min(points.length-1,i+2)];
   d+=` C ${fmt(b[0]+(c[0]-a[0])/6)} ${fmt(b[1]+(c[1]-a[1])/6)} ${fmt(c[0]-(e[0]-b[0])/6)} ${fmt(c[1]-(e[1]-b[1])/6)} ${c.join(' ')}`;
  }
  const tee=points[0],green=points.at(-1);
  const trees=g.treeContext==='open'?'':`<path d="M 47 87 Q 39 56 47 22 L 55 20 Q 49 57 55 88 Z M 109 88 Q 118 55 109 21 L 117 22 Q 127 57 117 87 Z" fill="#54785b" opacity="${g.treeContext==='wooded'?'.17':'.1'}"/>`;
  const water=g.water.map(([x,y])=>`<path class="layout-water sketch-water" d="M ${fmt(x+26)} ${fmt(y-6)} q 7 -3 10 3 q 2 5 -3 10 q -8 3 -11 -4 q -2 -5 4 -9 Z"/>`).join('');
  return `<figure class="hole-layout hole-sketch" data-layout-kind="schematic"><svg viewBox="0 0 160 100" role="img" aria-label="${esc(`Approximate scorecard sketch. ${g.source.routingEvidence} ${g.uncertainty} Tee area is shared across tees. Not to scale.`)}"><rect width="160" height="100" rx="5" fill="#eef3e9"/>${trees}<path d="${d}" fill="none" stroke="#8fac86" stroke-width="14" stroke-linecap="round" stroke-dasharray="1 1.5"/><path class="sketch-fairway" d="${d}" fill="none" stroke="#b4cba8" stroke-width="12.5" stroke-linecap="round"/>${water}<ellipse cx="${green[0]}" cy="${green[1]}" rx="7.5" ry="5.2" fill="#91af87"/><ellipse class="layout-green" cx="${green[0]}" cy="${green[1]}" rx="6.5" ry="4.2"/><rect class="layout-tee" x="${fmt(tee[0]-2.2)}" y="${fmt(tee[1]-1)}" width="4.4" height="2" rx=".6"/><text x="${fmt(green[0]+10)}" y="${fmt(green[1]+1)}" class="sketch-label">Green area</text><text x="${tee[0]}" y="${fmt(tee[1]+5)}" text-anchor="middle" class="sketch-label">Tee area</text></svg><figcaption><strong>Scorecard sketch</strong> · Approximate, not to scale. Tee area shared across tees${g.water.length?'; water edge illustrative':''}.</figcaption></figure>`;
 }
 function render(g){
  if(schematicValid(g))return schematic(g);
  if(!valid(g))return '<p class="layout-unavailable"><span aria-hidden="true">◌</span> Hole layout not yet verified</p>';
  const shape=(points,kind)=>`<polygon class="layout-${kind}" points="${points.map(p=>p.join(',')).join(' ')}"/>`;
  return `<figure class="hole-layout"><svg viewBox="0 0 100 100" role="img" aria-label="${esc(g.description||'Verified overhead hole layout')}">${(g.trees||[]).map(p=>shape(p,'trees')).join('')}${shape(g.fairway,'fairway')}${(g.water||[]).map(p=>shape(p,'water')).join('')}${(g.bunkers||[]).map(p=>shape(p,'bunker')).join('')}${shape(g.green,'green')}<circle class="layout-tee" cx="${g.tee[0]}" cy="${g.tee[1]}" r="1.8"/>${g.target?`<circle class="layout-target" cx="${g.target.position[0]}" cy="${g.target.position[1]}" r="3"/>`:''}</svg><figcaption>${esc(g.source.attribution)} · Simplified, not to scale</figcaption></figure>`;
 }
 return {valid,schematicValid,find,render};
})();
if(typeof module!=='undefined')module.exports=HoleLayout;
