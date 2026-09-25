/* External handoff only. Caddie never sends context to ChatGPT over the network. */
const CaddieHandoff = (() => {
 const mark='<svg class="intelligence-mark" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="15" fill="none" stroke="currentColor" stroke-width="1"/><path d="M25 13a9 9 0 1 0 0 14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><circle cx="20" cy="5" r="2" fill="currentColor"/><circle cx="35" cy="20" r="2" fill="currentColor"/><circle cx="20" cy="35" r="2" fill="currentColor"/></svg>';
 function show(record,save){
  const dialog=document.createElement('dialog');dialog.id='ask-sheet';dialog.setAttribute('aria-labelledby','ask-title');
  dialog.innerHTML=`<div class="sheet-heading">${mark}<h2 id="ask-title">ASK CADDIE COACH</h2><button id="close-ask" aria-label="Close Ask Caddie">×</button></div><p>Bring your course, current hole, round performance, notes and club distances with you.</p><p class="muted">Context follows your active Hole ${record.activeHole}, even when you look ahead.</p><div class="sheet-actions"><button id="copy-open" class="primary">COPY CONTEXT &amp; OPEN CHATGPT</button><button id="just-copy" class="secondary">JUST COPY</button></div><p id="ask-status" role="status" aria-live="polite"></p><p>Add your current distance, lie and shot situation after pasting.</p><a id="open-chatgpt" href="${ExternalCoach.url}" target="_blank" rel="noopener noreferrer" hidden>Open ChatGPT</a><p class="muted">Paste into your existing Golf Coach conversation. Caddie cannot select that conversation or paste for you. ChatGPT needs connectivity.</p><div id="ask-fallback" hidden><label for="live-text">Live context</label><textarea id="live-text" readonly rows="7"></textarea><button id="select-context" class="secondary">Select context</button><button id="confirm-copy" class="secondary">I’ve copied it</button><p class="muted">Touch and hold the selected text and choose Copy, then confirm above.</p></div>`;
  document.body.append(dialog);dialog.showModal();
  const find=id=>dialog.querySelector('#'+id),status=find('ask-status');
  let pending=null,busy=false,feedbackTimer,launchPending=false;
  const stopFeedback=()=>{clearTimeout(feedbackTimer);launchPending=false};
  const returned=()=>{if(launchPending&&document.visibilityState==='visible')fallback()};
  document.addEventListener('visibilitychange',returned);
  const close=()=>{stopFeedback();document.removeEventListener('visibilitychange',returned);dialog.close();dialog.remove()};find('close-ask').onclick=close;dialog.addEventListener('cancel',e=>{e.preventDefault();close()});
  function log(event){return save(event)}
  function feedback(saved){status.textContent='✓ Context copied — ask away'+(saved?'':' · Request could not be saved. Keep Caddie open.');find('open-chatgpt').hidden=false}
  let eventSaved=true;
  function fallback(){
   if(!dialog.isConnected)return;
   status.textContent='✓ Context copied. Open ChatGPT and paste into Golf Coach.'+(eventSaved?'':' Request could not be saved. Keep Caddie open.');
   stopFeedback();
  }
  function openExternal(saved){
   eventSaved=saved;launchPending=true;
   status.textContent='✓ Context copied — opening ChatGPT'+(saved?'':' · Request could not be saved. Keep Caddie open.');
   if(!ExternalCoach.launch()){fallback();return}
   // Feedback only: never retry navigation or infer whether the native app opened.
   feedbackTimer=setTimeout(()=>{if(document.visibilityState==='visible')fallback()},1500);
  }
  function select(){const input=find('live-text');input.focus();input.select();input.setSelectionRange(0,input.value.length)}
  find('select-context').onclick=select;
  find('confirm-copy').onclick=()=>{if(!pending)return;const saved=log(pending);pending=null;find('confirm-copy').disabled=true;feedback(saved)};
  async function copy(open){
   if(busy)return;stopFeedback();busy=true;find('copy-open').disabled=true;find('just-copy').disabled=true;pending=null;find('ask-fallback').hidden=true;find('open-chatgpt').hidden=true;
   const context=CaddieContext.live(record),event=CaddieMemory.event(record);
   try{
    if(!navigator.clipboard?.writeText)throw Error('Clipboard unavailable');
    await navigator.clipboard.writeText(context);
    const saved=log(event);
    if(dialog.isConnected){feedback(saved);if(open)openExternal(saved)}
   }catch{
    if(dialog.isConnected){pending=event;status.textContent='Copy was unavailable. Select and copy the context below; your round is unchanged.';find('ask-fallback').hidden=false;find('live-text').value=context;find('confirm-copy').disabled=false;select()}
   }finally{busy=false;if(dialog.isConnected){find('copy-open').disabled=false;find('just-copy').disabled=false}}
  }
  find('just-copy').onclick=()=>copy(false);find('copy-open').onclick=()=>copy(true);
 }
 return {mark,show};
})();
