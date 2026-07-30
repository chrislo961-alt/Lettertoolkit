'use strict';

const LETTER_SCORES = Object.freeze({a:1,b:3,c:3,d:2,e:1,f:4,g:2,h:4,i:1,j:8,k:5,l:1,m:3,n:1,o:1,p:3,q:10,r:1,s:1,t:1,u:1,v:4,w:4,x:8,y:4,z:10});
const state = { wordsByLength: new Map(), results: [], filtered: [], activeLength: 0, visible: 120, ready: false };

const el = Object.fromEntries(['unscrambleForm','letters','minLength','sortBy','solveButton','dictionaryStatus','message','resultsPanel','resultCount','results','lengthTabs','copyButton','showMoreButton'].map(id => [id, document.getElementById(id)]));

function countLetters(value){
  const counts = new Uint8Array(26); let wildcards = 0;
  for(const char of value.toLowerCase()){
    if(char === '?') wildcards++;
    else { const code = char.charCodeAt(0)-97; if(code>=0 && code<26) counts[code]++; }
  }
  return {counts,wildcards};
}

function canBuild(word, rack){
  const needed = new Uint8Array(26); let missing = 0;
  for(let i=0;i<word.length;i++){
    const idx = word.charCodeAt(i)-97;
    needed[idx]++;
    if(needed[idx] > rack.counts[idx]) missing++;
    if(missing > rack.wildcards) return false;
  }
  return true;
}

function scoreWord(word){ return [...word].reduce((sum,ch)=>sum+(LETTER_SCORES[ch]||0),0); }
function setMessage(text,type=''){ el.message.textContent=text; el.message.className=`message ${type}`.trim(); }

async function loadDictionary(){
  try{
    const response = await fetch('words.txt');
    if(!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    for(const raw of text.split(/\r?\n/)){
      const word = raw.trim().toLowerCase();
      if(!word) continue;
      if(!state.wordsByLength.has(word.length)) state.wordsByLength.set(word.length,[]);
      state.wordsByLength.get(word.length).push(word);
    }
    state.ready = true;
    el.solveButton.disabled = false;
    const total = [...state.wordsByLength.values()].reduce((n,list)=>n+list.length,0);
    el.dictionaryStatus.textContent = `${total.toLocaleString()} words ready`;
    el.dictionaryStatus.classList.add('ready');
  }catch(error){
    el.dictionaryStatus.textContent='Dictionary unavailable';
    setMessage('The dictionary could not be loaded. Refresh the page or check that words.txt was uploaded.', 'error');
    console.error(error);
  }
}

function sortResults(items){
  const mode = el.sortBy.value;
  return items.sort((a,b)=> mode==='alpha' ? a.word.localeCompare(b.word) : mode==='score' ? b.score-a.score || b.word.length-a.word.length || a.word.localeCompare(b.word) : b.word.length-a.word.length || b.score-a.score || a.word.localeCompare(b.word));
}

function solve(){
  const clean = el.letters.value.toLowerCase().replace(/[^a-z?]/g,'').slice(0,15);
  el.letters.value = clean.toUpperCase();
  if(clean.length < 2){ setMessage('Enter at least two letters.','error'); el.resultsPanel.hidden=true; return; }
  const rack = countLetters(clean); const min = Number(el.minLength.value); const max = clean.length; const found=[];
  for(let len=min;len<=max;len++){
    const list=state.wordsByLength.get(len)||[];
    for(const word of list) if(canBuild(word,rack)) found.push({word,score:scoreWord(word)});
  }
  state.results=sortResults(found); state.activeLength=0; state.visible=120;
  renderTabs(); renderResults();
  el.resultsPanel.hidden=false;
  setMessage(found.length ? `Built from ${clean.toUpperCase()}.` : 'No matches found. Try a shorter minimum length or add a wildcard.');
}

function renderTabs(){
  const counts=new Map(); for(const item of state.results) counts.set(item.word.length,(counts.get(item.word.length)||0)+1);
  el.lengthTabs.textContent='';
  const options=[[0,`All (${state.results.length})`],...[...counts.entries()].sort((a,b)=>b[0]-a[0]).map(([len,count])=>[len,`${len} letters (${count})`])];
  for(const [len,label] of options){
    const button=document.createElement('button'); button.type='button'; button.role='tab'; button.textContent=label; button.className=len===state.activeLength?'active':''; button.setAttribute('aria-selected',String(len===state.activeLength));
    button.addEventListener('click',()=>{state.activeLength=len;state.visible=120;renderTabs();renderResults();});
    el.lengthTabs.append(button);
  }
}

function renderResults(){
  state.filtered = state.activeLength ? state.results.filter(x=>x.word.length===state.activeLength) : state.results;
  const visible=state.filtered.slice(0,state.visible); el.results.textContent='';
  const frag=document.createDocumentFragment();
  for(const item of visible){
    const li=document.createElement('li'); li.className='word-result';
    const word=document.createElement('strong'); word.textContent=item.word;
    const score=document.createElement('span'); score.className='score'; score.textContent=`${item.score} pts`;
    li.append(word,score); frag.append(li);
  }
  el.results.append(frag); el.resultCount.textContent=state.filtered.length.toLocaleString();
  el.showMoreButton.hidden=state.visible>=state.filtered.length;
  el.copyButton.disabled=state.filtered.length===0;
}

el.unscrambleForm.addEventListener('submit',event=>{event.preventDefault();if(state.ready)solve();});
el.letters.addEventListener('input',()=>{el.letters.value=el.letters.value.replace(/[^a-zA-Z?]/g,'').slice(0,15);});
el.sortBy.addEventListener('change',()=>{if(state.results.length){state.results=sortResults(state.results);renderResults();}});
el.minLength.addEventListener('change',()=>{if(el.letters.value.length>=2&&state.ready)solve();});
el.showMoreButton.addEventListener('click',()=>{state.visible+=120;renderResults();});
el.copyButton.addEventListener('click',async()=>{
  try{await navigator.clipboard.writeText(state.filtered.map(x=>x.word).join('\n'));const old=el.copyButton.textContent;el.copyButton.textContent='Copied';setTimeout(()=>el.copyButton.textContent=old,1400);}catch{setMessage('Copy failed. Select and copy the words manually.','error');}
});

loadDictionary();
