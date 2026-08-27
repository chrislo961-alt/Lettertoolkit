(()=>{
  const form=document.getElementById('fiveFinder'); if(!form)return;
  const allWords=window.LETTERTOOLKIT_FIVE||[];
  const allSet=new Set(allWords);
  const boxes=[...form.querySelectorAll('.position-inputs input')];
  const result=document.getElementById('fiveResults'),count=document.getElementById('fiveCount'),message=document.getElementById('fiveMessage'),more=document.getElementById('fiveMore');
  let commonWords=[],commonReady=false,mode='common',matches=[],shown=80;
  const clean=v=>(v||'').toLowerCase().replace(/[^a-z]/g,'');
  const counts=v=>[...v].reduce((o,c)=>(o[c]=(o[c]||0)+1,o),{});
  const hasCounts=(word,required)=>{const wc=counts(word);return Object.entries(counts(required)).every(([c,n])=>(wc[c]||0)>=n)};
  const tileValues={a:1,b:3,c:3,d:2,e:1,f:4,g:2,h:4,i:1,j:8,k:5,l:1,m:3,n:1,o:1,p:3,q:10,r:1,s:1,t:1,u:1,v:4,w:4,x:8,y:4,z:10};
  const letterScore=word=>[...word].reduce((sum,c)=>sum+(tileValues[c]||0),0);

  const modeBox=document.createElement('fieldset');
  modeBox.className='word-mode';
  modeBox.innerHTML='<legend>Word list</legend><div class="word-mode-options"><label><input type="radio" name="fiveWordMode" value="common" checked> Common words</label><label><input type="radio" name="fiveWordMode" value="all"> Full dictionary</label></div><p class="word-mode-note">Common mode prioritizes frequently used English words. Full dictionary includes rare and specialist entries. Neither is an official game dictionary.</p>';
  const fields=form.querySelector('.finder-fields');
  fields.insertAdjacentElement('afterend',modeBox);
  const commonRadio=modeBox.querySelector('input[value="common"]'),allRadio=modeBox.querySelector('input[value="all"]');

  const source=()=>mode==='common'&&commonReady?commonWords:allWords;
  const currentFilters=()=>({positions:boxes.map(x=>clean(x.value)),starts:clean(document.getElementById('fiveStarts').value),ends:clean(document.getElementById('fiveEnds').value),required:clean(document.getElementById('fiveContains').value),excluded:clean(document.getElementById('fiveExclude').value)});
  const applyFilters=()=>{
    const {positions,starts,ends,required,excluded}=currentFilters();
    matches=source().filter(w=>positions.every((c,i)=>!c||w[i]===c)&&(!starts||w.startsWith(starts))&&(!ends||w.endsWith(ends))&&(!required||hasCounts(w,required))&&(!excluded||![...excluded].some(c=>w.includes(c))));
    shown=80;render();
  };
  const render=()=>{
    const visible=matches.slice(0,shown);
    result.textContent='';
    for(const w of visible){
      const li=document.createElement('li');li.className='seo-word';
      const label=document.createElement('span');label.className='word-label';label.textContent=w;
      const score=document.createElement('span');score.className='word-score';score.textContent=`${letterScore(w)} pts`;score.title='Standard English Scrabble-style letter value before board bonuses';
      li.append(label,score);result.append(li);
    }
    count.textContent=matches.length.toLocaleString('en-US');
    const label=mode==='common'&&commonReady?'Common words':'Full dictionary';
    if(!matches.length&&mode==='common'&&commonReady){message.textContent='No common-word matches. Try Full dictionary for rare or specialist entries.';}
    else message.textContent=`${label}: showing ${visible.length.toLocaleString('en-US')} of ${matches.length.toLocaleString('en-US')} matching words. Scores use standard English tile values and do not determine game validity.`;
    more.hidden=visible.length>=matches.length;
  };

  form.addEventListener('submit',e=>{e.preventDefault();applyFilters()});
  form.addEventListener('reset',()=>setTimeout(()=>{mode=commonReady?'common':'all';commonRadio.checked=commonReady;allRadio.checked=!commonReady;applyFilters()},0));
  modeBox.addEventListener('change',e=>{if(e.target.name!=='fiveWordMode')return;mode=e.target.value;applyFilters()});
  boxes.forEach((box,i)=>box.addEventListener('input',()=>{box.value=clean(box.value).slice(0,1).toUpperCase();if(box.value&&boxes[i+1])boxes[i+1].focus()}));
  more.addEventListener('click',()=>{shown+=160;render()});
  document.getElementById('fiveCopy').addEventListener('click',async e=>{try{await navigator.clipboard.writeText(matches.join('\n'));e.currentTarget.textContent='Copied';setTimeout(()=>e.currentTarget.textContent='Copy results',1200)}catch{message.textContent='Copy failed. Select the words manually.'}});

  message.textContent='Loading common-word ranking…';
  fetch('/common-5-letter-words.txt').then(r=>{if(!r.ok)throw new Error('Common list unavailable');return r.text()}).then(text=>{
    const seen=new Set();
    commonWords=text.split(/\r?\n/).map(clean).filter(w=>w.length===5&&allSet.has(w)&&!seen.has(w)&&seen.add(w));
    if(!commonWords.length)throw new Error('Common list empty');
    commonReady=true;mode='common';commonRadio.checked=true;applyFilters();
  }).catch(()=>{commonReady=false;mode='all';commonRadio.checked=false;commonRadio.disabled=true;allRadio.checked=true;applyFilters();message.textContent='Common-word ranking could not load, so the full dictionary is shown.'});
})();
