/* Stock-distance planning, not a claim about unseen course geography. */
const CaddieStrategy=(()=>{
 function forHole(h,player){
  const clubs=player.clubs.filter(([,y])=>Number.isFinite(y)&&y>0).slice().sort((a,b)=>b[1]-a[1]);
  const closest=distance=>clubs.reduce((a,b)=>Math.abs(b[1]-distance)<Math.abs(a[1]-distance)?b:a);
  const driver=clubs.find(([name])=>name==='Driver')||clubs[0];
  const hybrid=clubs.find(([name])=>name==='3H')||driver;
  let tee,advice,expected;
  if(h.par===3){tee=closest(h.yards);expected='Middle of the green';advice=`Your stock ${tee[0]} is ${tee[1]} yards for this ${h.yards}-yard hole. Check the actual playing distance and favor the middle of the green.`;}
  else if(h.par===5){tee=driver;const remaining=Math.max(0,h.yards-tee[1]);expected=`About ${remaining} yd after a stock ${tee[0]}; verify the next landing area`;advice=`A stock ${tee[0]} leaves about ${remaining} yards on paper. Choose the next landing area from the tee view, then build a comfortable wedge approach; don't cut an unseen corner.`;}
  else{
   tee=h.yards-driver[1]<60?hybrid:driver;
   const remaining=Math.max(0,h.yards-tee[1]),approach=closest(remaining);
   expected=remaining<60?`About ${remaining} yd; partial wedge`:`About ${remaining} yd; near stock ${approach[0]}`;
   advice=`A stock ${tee[0]} leaves about ${remaining} yards${remaining<60?' for a partial wedge':`, near your ${approach[0]}`}. Confirm the landing area first, then favor the middle of the green.`;
  }
  if(h.verifiedHazard)advice+=' '+h.verifiedHazard;
  return {...h,teeClub:tee[0],target:h.verifiedTarget||(h.par===3?'Middle of green':'Widest visible landing area'),advice,plan:advice,danger:h.verifiedHazard||'Specific hazards unverified; check the tee view and current local markers.',expected,safestMiss:h.safestMiss||'Choose the side with the most visible room.'};
 }
 return {forHole};
})();
if(typeof module!=='undefined')module.exports=CaddieStrategy;
