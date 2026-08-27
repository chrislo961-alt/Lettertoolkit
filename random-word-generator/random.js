import {loadDictionary} from '../core/dictionary.js';
import {scoreWord} from '../core/score.js';

const $=id=>document.getElementById(id);
const form=$('randomForm'),results=$('results'),count=$('resultCount'),message=$('resultMessage'),copy=$('copyButton');
const state={wordsByLength:new Map(),results:[]};
const clean=v=>String(v||'').toLowerCase().replace(/[^a-z]/g,'').slice(0,15);
const params=new URLSearchParams(location.search);
const restore={randomMinLength:'min',randomMaxLength:'max',randomCount:'count',randomStarts:'starts',randomContains:'contains',randomEnds:'ends',randomRequired:'required',randomExcluded:'excluded',randomSort:'sort'};
for(const [id,key] of Object.entries(restore)){const el=$(id),v=params.get(key);if(el&&v!==null)el.value=v;}
function render(items){state.results=items;results.textContent='';const frag=document.createDocumentFragment();for(const word of items){const li=document.createElement('li');li.className='word-result';li.innerHTML=`<strong>${word}</strong><span class="score">${word.length} letters · ${scoreWord(word)} pts</span>`;frag.appendChild(li);}results.appendChild(frag);count.textContent=items.length.toLocaleString();copy.disabled=!items.length;}
function currentUrl(){const url=new URL(location.href);url.search='';const values={min:$('randomMinLength')?.value||'',max:$('randomMaxLength')?.value||'',count:$('randomCount')?.value||'',starts:$('randomStarts')?.value||'',contains:$('randomContains')?.value||'',ends:$('randomEnds')?.value||'',required:$('randomRequired')?.value||'',excluded:$('randomExcluded')?.value||'',sort:$('randomSort')?.value||'random'};for(const [k,v] of Object.entries(values)){if(v&&!(k==='sort'&&v==='random'))url.searchParams.set(k,v);}return url.toString();}
function getPool(){
  const min=Math.max(2,Number($('randomMinLength')?.value)||2),max=Math.min(15,Number($('randomMaxLength')?.value)||15);if(max<min)throw new Error('Maximum length must be at least the minimum length.');
  const starts=clean($('randomStarts')?.value),contains=clean($('randomContains')?.value),ends=clean($('randomEnds')?.value),required=[...new Set(clean($('randomRequired')?.value))],excluded=new Set(clean($('randomExcluded')?.value));
  const pool=[];for(let len=min;len<=max;len++){for(const word of state.wordsByLength.get(len)||[]){if(starts&&!word.startsWith(starts))continue;if(contains&&!word.includes(contains))continue;if(ends&&!word.endsWith(ends))continue;if(required.some(ch=>!word.includes(ch)))continue;if([...word].some(ch=>excluded.has(ch)))continue;pool.push(word);}}
  return pool;
}
function generate(){
  try{const pool=getPool();const wanted=Math.min(100,Math.max(1,Number($('randomCount')?.value)||10));const sort=$('randomSort')?.value||'random';let items=[...pool];if(sort==='random'){for(let i=items.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[items[i],items[j]]=[items[j],items[i]];}}else if(sort==='alpha')items.sort((a,b)=>a.localeCompare(b));else if(sort==='short')items.sort((a,b)=>a.length-b.length||a.localeCompare(b));else if(sort==='long')items.sort((a,b)=>b.length-a.length||a.localeCompare(b));items=items.slice(0,wanted);render(items);message.textContent=pool.length?`Generated ${items.length} unique word${items.length===1?'':'s'} from ${pool.length.toLocaleString()} matching entries.`:'No words match those filters. Try broader settings.';}catch(err){render([]);message.textContent=err.message||'Could not generate words.';}
}
form?.addEventListener('submit',e=>{e.preventDefault();generate();});
$('randomShare')?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(currentUrl());$('randomShare').textContent='Link copied';setTimeout(()=>$('randomShare').textContent='Copy search link',1200);}catch{message.textContent='Could not copy the link. Copy the browser address instead.';}});
$('randomClear')?.addEventListener('click',()=>{for(const id of Object.keys(restore)){const el=$(id);if(el)el.value='';}$('randomMinLength').value='2';$('randomMaxLength').value='15';$('randomCount').value='10';$('randomSort').value='random';history.replaceState(null,'',location.pathname);render([]);message.textContent='Filters cleared. Choose your options and generate a list.';$('randomStarts')?.focus();});
copy?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(state.results.join('\n'));copy.textContent='Copied';setTimeout(()=>copy.textContent='Copy all',1200);}catch{message.textContent='Copy failed. Select the words manually.';}});
try{const d=await loadDictionary('/words.txt');state.wordsByLength=d.wordsByLength;message.textContent=`${d.total.toLocaleString()} words ready. Choose your options and generate a list.`;if(location.search)generate();}catch(err){message.textContent='Dictionary unavailable. Please refresh the page.';console.error(err);}
