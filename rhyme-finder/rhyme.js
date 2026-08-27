import {loadDictionary} from '../core/dictionary.js';

const $=id=>document.getElementById(id);
const form=$('rhymeForm'),results=$('results'),count=$('resultCount'),message=$('resultMessage'),showMore=$('showMoreButton'),copy=$('copyButton');
const state={wordsByLength:new Map(),ready:false,items:[],visible:100};
const clean=value=>String(value||'').toLowerCase().replace(/[^a-z]/g,'').slice(0,20);

const toggle=$('themeToggle');
const savedTheme=localStorage.getItem('lt-theme');
if(savedTheme==='dark'||savedTheme==='light')document.documentElement.dataset.theme=savedTheme;
function syncTheme(){if(toggle)toggle.textContent=document.documentElement.dataset.theme==='dark'?'Light mode':'Dark mode'}
syncTheme();
toggle?.addEventListener('click',()=>{const next=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=next;localStorage.setItem('lt-theme',next);syncTheme();});

function sharedSuffix(a,b){
  let n=0,limit=Math.min(a.length,b.length);
  while(n<limit&&a[a.length-1-n]===b[b.length-1-n])n++;
  return n;
}
function strength(match){return match>=5?'Strong spelling rhyme':match>=4?'Medium spelling rhyme':'Broad spelling rhyme'}
function render(){
  if(!results||!count||!showMore||!copy)return;
  results.textContent='';
  const frag=document.createDocumentFragment();
  for(const item of state.items.slice(0,state.visible)){
    const li=document.createElement('li');li.className='word-result';
    li.innerHTML=`<strong>${item.word}</strong><span class="score">${strength(item.match)} · ${item.match}-letter ending · ${item.word.length} letters</span>`;
    frag.append(li);
  }
  results.append(frag);count.textContent=state.items.length.toLocaleString();showMore.hidden=state.visible>=state.items.length;copy.disabled=!state.items.length;
}
function setItems(items,label){state.items=items;state.visible=100;message.textContent=items.length?label:'No spelling-rhyme matches found. Try a broader match depth.';render();}

const params=new URLSearchParams(location.search);
const restore={rhymeWord:'word',rhymeDepth:'depth',rhymeMinLength:'min',rhymeMaxLength:'max',rhymeSort:'sort'};
for(const [id,key] of Object.entries(restore)){const value=params.get(key);if($(id)&&value!==null)$(id).value=value;}
function currentUrl(){
  const url=new URL(location.href);url.search='';
  const values={word:$('rhymeWord')?.value||'',depth:$('rhymeDepth')?.value||'3',min:$('rhymeMinLength')?.value||'0',max:$('rhymeMaxLength')?.value||'0',sort:$('rhymeSort')?.value||'strong'};
  for(const [key,value] of Object.entries(values)){if(value&&!(key==='depth'&&value==='3')&&!(key==='min'&&value==='0')&&!(key==='max'&&value==='0')&&!(key==='sort'&&value==='strong'))url.searchParams.set(key,value);}
  return url.toString();
}
$('rhymeShare')?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(currentUrl());$('rhymeShare').textContent='Link copied';setTimeout(()=>$('rhymeShare').textContent='Copy search link',1200)}catch{message.textContent='Could not copy the link. Copy the browser address instead.'}});
$('rhymeClear')?.addEventListener('click',()=>{$('rhymeWord').value='';$('rhymeDepth').value='3';$('rhymeMinLength').value='0';$('rhymeMaxLength').value='0';$('rhymeSort').value='strong';history.replaceState(null,'',location.pathname);state.items=[];state.visible=100;render();message.textContent='Filters cleared. Enter a word to explore spelling rhymes.';$('rhymeWord')?.focus();});
showMore?.addEventListener('click',()=>{state.visible+=100;render();});
copy?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(state.items.map(x=>x.word).join('\n'));copy.textContent='Copied';setTimeout(()=>copy.textContent='Copy all',1200)}catch{message.textContent='Copy failed. Select the words manually.'}});

form?.addEventListener('submit',e=>{
  e.preventDefault();if(!state.ready){message.textContent='The dictionary is still loading.';return;}
  const source=clean($('rhymeWord')?.value);if(source.length<2){setItems([],'Enter at least two letters.');return;}
  const depth=Math.max(2,Math.min(source.length,Number($('rhymeDepth')?.value)||3));
  const minLength=Number($('rhymeMinLength')?.value)||0,maxLength=Number($('rhymeMaxLength')?.value)||0,sort=$('rhymeSort')?.value||'strong';
  if(maxLength&&minLength&&maxLength<minLength){setItems([],'Maximum length must be at least the minimum length.');return;}
  const items=[];
  for(const [len,words] of state.wordsByLength){
    if(minLength&&len<minLength)continue;if(maxLength&&len>maxLength)continue;
    for(const word of words){
      if(word===source)continue;
      const match=sharedSuffix(source,word);if(match<depth)continue;
      items.push({word,match,distance:Math.abs(word.length-source.length)});
    }
  }
  items.sort((a,b)=>sort==='alpha'?a.word.localeCompare(b.word):sort==='close'?a.distance-b.distance||b.match-a.match||a.word.localeCompare(b.word):b.match-a.match||a.distance-b.distance||a.word.localeCompare(b.word));
  setItems(items,`Spelling rhymes for ${source.toUpperCase()}, requiring at least ${depth} matching ending letters. Stronger ending matches are ranked first unless you choose another sort.`);
});

try{
  const d=await loadDictionary('/words.txt');state.wordsByLength=d.wordsByLength;state.ready=true;message.textContent=`${d.total.toLocaleString()} words ready. Enter a word to explore spelling rhymes.`;if(location.search)form?.requestSubmit();
}catch(err){message.textContent='Dictionary unavailable. Please refresh the page.';console.error(err);}
