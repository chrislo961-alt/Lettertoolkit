import {loadDictionary} from '../core/dictionary.js';
import {unscramble} from '../core/engine.js';
import {sanitizeLetters,sanitizePattern} from '../core/filters.js';

const $=id=>document.getElementById(id);
const form=$('scrabbleForm'),list=$('results'),count=$('resultCount'),message=$('resultMessage'),more=$('showMoreButton'),copy=$('copyButton');
const state={wordsByLength:new Map(),results:[],visible:100,ready:false};
const cleanLetters=v=>sanitizeLetters(v||'',15).toLowerCase();
const clean=v=>sanitizePattern(v||'',15).toLowerCase();

function render(){
  list.textContent='';const frag=document.createDocumentFragment();
  for(const item of state.results.slice(0,state.visible)){
    const li=document.createElement('li');li.className='word-result';
    li.innerHTML=`<strong>${item.word}</strong><span class="score">${item.word.length} letters · ${item.score} pts</span>`;frag.append(li);
  }
  list.append(frag);count.textContent=state.results.length.toLocaleString();more.hidden=state.visible>=state.results.length;copy.disabled=!state.results.length;
}
function run(){
  if(!state.ready){message.textContent='The dictionary is still loading.';return;}
  const letters=cleanLetters($('scrabbleLetters').value);if(letters.length<2){state.results=[];render();message.textContent='Enter at least two rack letters.';return;}
  const min=Number($('scrabbleMin').value)||2,max=Number($('scrabbleMax').value)||0,sort=$('scrabbleSort').value||'score';
  if(max&&max<min){state.results=[];render();message.textContent='Maximum length must be at least the minimum length.';return;}
  const required=[...new Set(clean($('scrabbleRequired').value))],excluded=new Set(clean($('scrabbleExcluded').value));
  let items=unscramble({letters,wordsByLength:state.wordsByLength,minLength:min,filters:{starts:clean($('scrabbleStarts').value),contains:clean($('scrabbleContains').value),ends:clean($('scrabbleEnds').value)},sort,blankScoreZero:true});
  if(max)items=items.filter(item=>item.word.length<=max);
  if(required.length)items=items.filter(item=>required.every(ch=>item.word.includes(ch)));
  if(excluded.size)items=items.filter(item=>![...item.word].some(ch=>excluded.has(ch)));
  state.results=items;state.visible=100;render();
  const blanks=(letters.match(/\?/g)||[]).length;
  message.textContent=`${items.length.toLocaleString()} rack word${items.length===1?'':'s'} found${blanks?` · scores treat ${blanks} blank tile${blanks===1?'':'s'} as 0 points`:''}.`;
}
function currentUrl(){
  const url=new URL(location.href);url.search='';
  const values={rack:$('scrabbleLetters').value,min:$('scrabbleMin').value,max:$('scrabbleMax').value,starts:$('scrabbleStarts').value,contains:$('scrabbleContains').value,ends:$('scrabbleEnds').value,required:$('scrabbleRequired').value,excluded:$('scrabbleExcluded').value,sort:$('scrabbleSort').value};
  for(const [key,value] of Object.entries(values)){if(value&&!(key==='min'&&value==='3')&&!(key==='max'&&value==='0')&&!(key==='sort'&&value==='score'))url.searchParams.set(key,value);}
  return url.toString();
}
const params=new URLSearchParams(location.search);const restore={scrabbleLetters:'rack',scrabbleMin:'min',scrabbleMax:'max',scrabbleStarts:'starts',scrabbleContains:'contains',scrabbleEnds:'ends',scrabbleRequired:'required',scrabbleExcluded:'excluded',scrabbleSort:'sort'};
for(const [id,key] of Object.entries(restore)){const value=params.get(key);if(value!==null&&$(id))$(id).value=value;}
form.addEventListener('submit',e=>{e.preventDefault();run();});
$('scrabbleClear').addEventListener('click',()=>{form.reset();$('scrabbleMin').value='3';$('scrabbleMax').value='0';$('scrabbleSort').value='score';history.replaceState(null,'',location.pathname);state.results=[];state.visible=100;render();message.textContent='Filters cleared. Enter your rack letters and search.';$('scrabbleLetters').focus();});
$('scrabbleShare').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(currentUrl());$('scrabbleShare').textContent='Link copied';setTimeout(()=>$('scrabbleShare').textContent='Copy search link',1200);}catch{message.textContent='Could not copy the link. Copy the browser address instead.';}});
more.addEventListener('click',()=>{state.visible+=100;render();});
copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(state.results.map(x=>x.word).join('\n'));copy.textContent='Copied';setTimeout(()=>copy.textContent='Copy all',1200);}catch{message.textContent='Copy failed. Select the words manually.';}});
try{const d=await loadDictionary('/words.txt');state.wordsByLength=d.wordsByLength;state.ready=true;message.textContent=`${d.total.toLocaleString()} words ready. Enter your rack letters and search.`;if(location.search)run();}catch(err){message.textContent='Dictionary unavailable. Please refresh the page.';console.error(err);}
