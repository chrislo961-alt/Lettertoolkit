import {loadDictionary} from '../core/dictionary.js';
import {findWords} from '../core/engine.js';

const $=id=>document.getElementById(id);
const form=$('crosswordForm');
if(form){
  const results=$('results'),count=$('resultCount'),message=$('resultMessage'),showMore=$('showMoreButton'),copy=$('copyButton');
  let wordsByLength=new Map(),ready=false,items=[],visible=100;
  const clean=v=>(v||'').toLowerCase().replace(/[^a-z?]/g,'').slice(0,15);
  function render(){
    results.textContent='';
    for(const item of items.slice(0,visible)){
      const li=document.createElement('li');li.className='word-result';li.innerHTML=`<strong>${item.word}</strong><span class="score">${item.word.length} letters · ${item.score} pts</span>`;results.appendChild(li);
    }
    count.textContent=items.length.toLocaleString();showMore.hidden=visible>=items.length;copy.disabled=!items.length;
  }
  const params=new URLSearchParams(location.search);
  const restore={crosswordLength:'length',crosswordPattern:'pattern',crosswordStarts:'starts',crosswordEnds:'ends',crosswordRequired:'required',crosswordExcluded:'excluded',crosswordSort:'sort'};
  for(const [id,key] of Object.entries(restore)){const el=$(id),value=params.get(key);if(el&&value!==null)el.value=value;}
  function currentUrl(){
    const url=new URL(location.href);url.search='';
    const values={length:$('crosswordLength').value,pattern:$('crosswordPattern').value,starts:$('crosswordStarts').value,ends:$('crosswordEnds').value,required:$('crosswordRequired').value,excluded:$('crosswordExcluded').value,sort:$('crosswordSort').value};
    for(const [key,value] of Object.entries(values)){if(value&&!(key==='sort'&&value==='alpha'))url.searchParams.set(key,value);}
    return url.toString();
  }
  form.addEventListener('submit',e=>{
    e.preventDefault();e.stopImmediatePropagation();
    if(!ready){message.textContent='The dictionary is still loading.';return;}
    const length=Number($('crosswordLength').value)||0;let pattern=clean($('crosswordPattern').value);
    if(!pattern&&length)pattern='?'.repeat(length);
    if(pattern&&length&&pattern.length!==length){items=[];message.textContent='Pattern length must match the answer length.';render();return;}
    const starts=clean($('crosswordStarts').value).replace(/\?/g,''),ends=clean($('crosswordEnds').value).replace(/\?/g,''),required=clean($('crosswordRequired').value).replace(/\?/g,''),excluded=clean($('crosswordExcluded').value).replace(/\?/g,''),sort=$('crosswordSort').value||'alpha';
    items=findWords({wordsByLength,length:length||pattern.length,pattern,starts,ends,required,excluded,sort});visible=100;
    const parts=[];if(length)parts.push(`${length} letters`);if(pattern&&/[a-z]/.test(pattern))parts.push(`pattern ${pattern.toUpperCase()}`);if(starts)parts.push(`starting ${starts.toUpperCase()}`);if(ends)parts.push(`ending ${ends.toUpperCase()}`);if(required)parts.push(`including ${required.toUpperCase()}`);
    message.textContent=items.length?`Possible crossword answers matching ${parts.length?parts.join(', '):'your filters'}.`:'No matches found. Recheck the crossings or remove a filter.';render();
  },true);
  $('crosswordClear')?.addEventListener('click',()=>{['crosswordPattern','crosswordStarts','crosswordEnds','crosswordRequired','crosswordExcluded'].forEach(id=>$(id).value='');$('crosswordLength').value='7';$('crosswordSort').value='alpha';history.replaceState(null,'',location.pathname);items=[];visible=100;message.textContent='Filters cleared. Enter the answer pattern and search.';render();$('crosswordPattern').focus();});
  $('crosswordShare')?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(currentUrl());$('crosswordShare').textContent='Link copied';setTimeout(()=>$('crosswordShare').textContent='Copy search link',1200)}catch{message.textContent='Could not copy the link. Copy the browser address instead.'}});
  showMore.addEventListener('click',e=>{e.stopImmediatePropagation();visible+=100;render();},true);
  copy.addEventListener('click',async e=>{e.stopImmediatePropagation();try{await navigator.clipboard.writeText(items.map(x=>x.word).join('\n'));copy.textContent='Copied';setTimeout(()=>copy.textContent='Copy all',1200)}catch{message.textContent='Copy failed. Select the words manually.'}},true);
  try{const d=await loadDictionary('../words.txt');wordsByLength=d.wordsByLength;ready=true;message.textContent=`${d.total.toLocaleString()} words ready. Enter the answer pattern and search.`;if(location.search)form.requestSubmit();}catch(err){message.textContent='Dictionary unavailable. Please refresh the page.';console.error(err)}
}
