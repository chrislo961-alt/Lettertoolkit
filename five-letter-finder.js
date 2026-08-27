(()=>{
  const form=document.getElementById('fiveFinder'); if(!form)return;
  const words=window.LETTERTOOLKIT_FIVE||[];
  const boxes=[...form.querySelectorAll('.position-inputs input')];
  const result=document.getElementById('fiveResults'), count=document.getElementById('fiveCount'), message=document.getElementById('fiveMessage'), more=document.getElementById('fiveMore');
  let matches=words, shown=80;
  const clean=v=>(v||'').toLowerCase().replace(/[^a-z]/g,'');
  const counts=v=>[...v].reduce((o,c)=>(o[c]=(o[c]||0)+1,o),{});
  const hasCounts=(word,required)=>{const wc=counts(word);return Object.entries(counts(required)).every(([c,n])=>(wc[c]||0)>=n)};
  const tileValues={a:1,b:3,c:3,d:2,e:1,f:4,g:2,h:4,i:1,j:8,k:5,l:1,m:3,n:1,o:1,p:3,q:10,r:1,s:1,t:1,u:1,v:4,w:4,x:8,y:4,z:10};
  const letterScore=word=>[...word].reduce((sum,c)=>sum+(tileValues[c]||0),0);
  const render=()=>{
    const visible=matches.slice(0,shown);
    result.textContent='';
    for(const w of visible){
      const li=document.createElement('li'); li.className='seo-word';
      const label=document.createElement('span'); label.className='word-label'; label.textContent=w;
      const score=document.createElement('span'); score.className='word-score'; score.textContent=`${letterScore(w)} pts`; score.title='Standard English Scrabble-style letter value before board bonuses';
      li.append(label,score); result.append(li);
    }
    count.textContent=matches.length.toLocaleString('en-US');
    message.textContent=`Showing ${visible.length.toLocaleString('en-US')} of ${matches.length.toLocaleString('en-US')} matching words. Scores use standard English tile values and do not determine game validity.`;
    more.hidden=visible.length>=matches.length;
  };
  form.addEventListener('submit',e=>{e.preventDefault();const positions=boxes.map(x=>clean(x.value));const starts=clean(document.getElementById('fiveStarts').value),ends=clean(document.getElementById('fiveEnds').value),required=clean(document.getElementById('fiveContains').value),excluded=clean(document.getElementById('fiveExclude').value);matches=words.filter(w=>positions.every((c,i)=>!c||w[i]===c)&&(!starts||w.startsWith(starts))&&(!ends||w.endsWith(ends))&&(!required||hasCounts(w,required))&&(!excluded||![...excluded].some(c=>w.includes(c))));shown=80;render()});
  form.addEventListener('reset',()=>setTimeout(()=>{matches=words;shown=80;render()},0));
  boxes.forEach((box,i)=>box.addEventListener('input',()=>{box.value=clean(box.value).slice(0,1).toUpperCase();if(box.value&&boxes[i+1])boxes[i+1].focus()}));
  more.addEventListener('click',()=>{shown+=160;render()});
  document.getElementById('fiveCopy').addEventListener('click',async e=>{try{await navigator.clipboard.writeText(matches.join('\n'));e.currentTarget.textContent='Copied';setTimeout(()=>e.currentTarget.textContent='Copy results',1200)}catch{message.textContent='Copy failed. Select the words manually.'}});
  render();
})();
