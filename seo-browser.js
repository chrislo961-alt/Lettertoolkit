import {scoreWord} from './core/score.js';
const root=document.querySelector('[data-seo-type]');
if(root){
  const type=root.dataset.seoType,value=root.dataset.seoValue.toLowerCase();
  const listEl=document.getElementById('seoWords'),filterEl=document.getElementById('seoFilter'),countEl=document.getElementById('seoCount'),messageEl=document.getElementById('seoMessage'),moreEl=document.getElementById('seoShowMore');
  const lengthValue=Number(value);
  const curated=Array.from(listEl?.querySelectorAll('.seo-word')||[]).map(el=>el.textContent.trim().toLowerCase()).filter(w=>/^[a-z]+$/.test(w));
  const supportsModes=(type==='length'&&lengthValue>=6&&lengthValue<=15)||root.dataset.commonMode==='true';
  const supportsBrowseControls=['starts','ends','contains'].includes(type);
  let all=[],filtered=[],shown=120,mode=supportsModes&&curated.length?'common':'full',browseLength=0,browseSort='alpha',fullReady=!supportsModes;
  const match=w=>type==='length'?w.length===lengthValue:type==='starts'?w.startsWith(value):type==='ends'?w.endsWith(value):w.includes(value);

  const sharedStyle=document.createElement('style');
  sharedStyle.textContent='.seo-word{display:flex;align-items:center;justify-content:space-between;gap:10px}.seo-word-score{flex:0 0 auto;font-size:.78rem;font-weight:850;color:var(--muted);background:var(--surface-2);border:1px solid var(--line);border-radius:999px;padding:3px 7px}.seo-copy-row{display:flex;justify-content:flex-end;margin-top:12px}.seo-copy-button{min-height:40px;border:1px solid var(--line);border-radius:12px;background:var(--surface);color:var(--text);padding:8px 12px;font:inherit;font-weight:800;cursor:pointer}.seo-copy-button:disabled{opacity:.55;cursor:not-allowed}';
  document.head.appendChild(sharedStyle);

  const copyRow=document.createElement('div');copyRow.className='seo-copy-row';copyRow.innerHTML='<button class="seo-copy-button" id="seoCopyVisible" type="button">Copy visible words</button>';moreEl?.insertAdjacentElement('beforebegin',copyRow);
  const copyButton=document.getElementById('seoCopyVisible');
  let modeNote=null,fullModeInput=null;

  if(supportsModes&&curated.length){
    const style=document.createElement('style');style.textContent='.seo-dictionary-mode{margin:18px 0 4px;padding:14px 16px;border:1px solid var(--line);border-radius:16px;background:var(--surface-2)}.seo-dictionary-mode legend{padding:0 6px;font-weight:850}.seo-mode-options{display:flex;gap:10px;flex-wrap:wrap}.seo-mode-options label{display:flex;align-items:center;gap:8px;background:var(--surface);border:1px solid var(--line);border-radius:999px;padding:8px 12px;font-weight:800;cursor:pointer}.seo-mode-options label:has(input:disabled){opacity:.6;cursor:wait}.seo-mode-note{margin:10px 0 0;color:var(--muted);font-size:.9rem}@media(max-width:560px){.seo-mode-options{display:grid;grid-template-columns:1fr}.seo-mode-options label{border-radius:12px}}';document.head.appendChild(style);
    const field=document.createElement('fieldset');field.className='seo-dictionary-mode';field.innerHTML='<legend>Dictionary view</legend><div class="seo-mode-options"><label><input type="radio" name="seoDictionaryMode" value="common" checked> Common words</label><label><input type="radio" name="seoDictionaryMode" value="full" disabled> Full dictionary</label></div><p class="seo-mode-note">Loading the full dictionary… Common words are ready now.</p>';
    filterEl.closest('.seo-filter-label')?.insertAdjacentElement('afterend',field);
    modeNote=field.querySelector('.seo-mode-note');fullModeInput=field.querySelector('input[value="full"]');
    field.addEventListener('change',e=>{if(e.target.name==='seoDictionaryMode'&&!e.target.disabled){mode=e.target.value;shown=120;render();}});
  }

  if(supportsBrowseControls){
    const style=document.createElement('style');style.textContent='.seo-browse-controls{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:16px 0 4px}.seo-browse-controls label{display:grid;gap:7px;font-weight:800;font-size:.88rem;color:var(--muted)}.seo-browse-controls select{width:100%;min-height:46px;border:1px solid var(--line);border-radius:12px;padding:0 12px;background:var(--surface);color:var(--text);font:inherit;font-weight:750}@media(max-width:560px){.seo-browse-controls{grid-template-columns:1fr}}';document.head.appendChild(style);
    const controls=document.createElement('div');controls.className='seo-browse-controls';controls.innerHTML='<label>Word length<select id="seoLengthFilter"><option value="0">Any length</option>'+Array.from({length:14},(_,i)=>i+2).map(n=>`<option value="${n}">${n} letters</option>`).join('')+'</select></label><label>Sort results<select id="seoSortFilter"><option value="alpha">A–Z</option><option value="score">Highest tile score</option><option value="short">Shortest first</option><option value="long">Longest first</option></select></label>';
    const anchor=document.querySelector('.seo-dictionary-mode')||filterEl.closest('.seo-filter-label');anchor?.insertAdjacentElement('afterend',controls);
    controls.querySelector('#seoLengthFilter')?.addEventListener('change',e=>{browseLength=Number(e.target.value)||0;shown=120;render();});controls.querySelector('#seoSortFilter')?.addEventListener('change',e=>{browseSort=e.target.value;shown=120;render();});
  }

  const sortWords=words=>browseSort==='score'?[...words].sort((a,b)=>scoreWord(b)-scoreWord(a)||a.localeCompare(b)):browseSort==='short'?[...words].sort((a,b)=>a.length-b.length||a.localeCompare(b)):browseSort==='long'?[...words].sort((a,b)=>b.length-a.length||a.localeCompare(b)):[...words].sort((a,b)=>a.localeCompare(b));
  function render(){
    const source=mode==='common'?curated:all,q=filterEl.value.trim().toLowerCase();let next=q?source.filter(w=>w.includes(q)):[...source];if(supportsBrowseControls&&browseLength)next=next.filter(w=>w.length===browseLength);filtered=sortWords(next);const visible=filtered.slice(0,shown);
    listEl.innerHTML=visible.map(w=>`<li class="seo-word"><span>${w}</span><span class="seo-word-score" title="Tile score">${scoreWord(w)} pts</span></li>`).join('');countEl.textContent=filtered.length.toLocaleString('en-US');
    if(copyButton)copyButton.disabled=!visible.length;
    if(mode==='common')messageEl.textContent=filtered.length?(q?'Showing common matching words. Try Full dictionary for rarer entries.':'Showing curated common words with tile scores. Switch to Full dictionary for every matching entry.'):'No common words matched. Switch to Full dictionary to search rare and specialist entries.';
    else messageEl.textContent=filtered.length?`Showing ${visible.length.toLocaleString('en-US')} of ${filtered.length.toLocaleString('en-US')} matching words${browseLength?` with ${browseLength} letters`:''}.`:'No words match these filters. Try another length or clear the text filter.';
    moreEl.hidden=mode==='common'||visible.length>=filtered.length;
  }

  copyButton?.addEventListener('click',async()=>{const visible=filtered.slice(0,shown);if(!visible.length)return;try{await navigator.clipboard.writeText(visible.join('\n'));const old=copyButton.textContent;copyButton.textContent='Copied';setTimeout(()=>{copyButton.textContent=old;},1200);}catch{messageEl.textContent='Copy failed. Select the words manually.';}});
  fetch('/words.txt').then(r=>{if(!r.ok)throw new Error('Dictionary unavailable');return r.text();}).then(text=>{
    all=text.split(/\r?\n/).map(w=>w.trim().toLowerCase()).filter(w=>/^[a-z]+$/.test(w)&&match(w));shown=120;fullReady=true;
    if(fullModeInput){fullModeInput.disabled=false;if(modeNote)modeNote.textContent='Common words shows familiar examples first. Full dictionary includes rare and specialist entries too.';}
    render();
  }).catch(()=>{
    if(supportsModes&&curated.length){mode='common';document.querySelectorAll('input[name="seoDictionaryMode"]').forEach(input=>{input.checked=input.value==='common';if(input.value==='full')input.disabled=true;});if(modeNote)modeNote.textContent='Full dictionary is unavailable right now. Common words are still available.';render();messageEl.textContent='The full dictionary could not load, so the curated common words are shown instead.';}
    else{messageEl.textContent='The full list could not load. The words shown below are still available.';moreEl.hidden=true;if(copyButton)copyButton.disabled=!curated.length;}
  });
  filterEl.addEventListener('input',()=>{shown=120;render();});moreEl.addEventListener('click',()=>{shown+=200;render();});if(supportsModes&&curated.length)render();
}
