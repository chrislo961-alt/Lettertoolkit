import {loadDictionary as fetchDictionary} from './core/dictionary.js';
import {unscramble, sortResults} from './core/engine.js';
import {sanitizeLetters, sanitizePattern} from './core/filters.js';
const state = {
  wordsByLength: new Map(), results: [], filtered: [], activeLength: 0,
  visible: 120, ready: false, favorites: new Set(), liveTimer: null
};

const ids = ['unscrambleForm','letters','minLength','sortBy','startsWith','contains','endsWith','solveButton','dictionaryStatus','message','resultsPanel','resultCount','results','lengthTabs','copyButton','showMoreButton','liveSearch','themeToggle','favoritesOnly','clearButton'];
const el = Object.fromEntries(ids.map(id => [id, document.getElementById(id)]));

function setMessage(text,type=''){ el.message.textContent=text; el.message.className=`message ${type}`.trim(); }
const sanitize = sanitizeLetters;

async function loadDictionary(){
  try{
    const dictionary = await fetchDictionary('./words.txt');
    state.wordsByLength = dictionary.wordsByLength;
    state.ready = true;
    el.solveButton.disabled = false;
    const total = dictionary.total;
    el.dictionaryStatus.textContent = `${total.toLocaleString()} words ready`;
    el.dictionaryStatus.classList.add('ready');
    scheduleLiveSearch();
  }catch(error){
    el.dictionaryStatus.textContent='Dictionary unavailable';
    setMessage('The dictionary could not be loaded. Refresh the page or check that words.txt was uploaded.', 'error');
    console.error(error);
  }
}

function getFilters(){
  return {
    starts: sanitizePattern(el.startsWith.value),
    contains: sanitizePattern(el.contains.value),
    ends: sanitizePattern(el.endsWith.value)
  };
}

function solve({silent=false}={}){
  const clean = sanitize(el.letters.value);
  el.letters.value = clean.toUpperCase();
  if(clean.length < 2){
    if(!silent) setMessage('Enter at least two letters.','error');
    el.resultsPanel.hidden=true;
    return;
  }

  const min = Number(el.minLength.value);
  const filters = getFilters();
  const found = unscramble({letters:clean,wordsByLength:state.wordsByLength,minLength:min,filters,sort:el.sortBy.value});

  state.results=found;
  state.activeLength=0;
  state.visible=120;
  renderTabs();
  renderResults();
  el.resultsPanel.hidden=false;
  setMessage(found.length ? `Built from ${clean.toUpperCase()}.` : 'No matches found. Adjust the filters or add a wildcard.');
}

function renderTabs(){
  const source = el.favoritesOnly.checked ? state.results.filter(x=>state.favorites.has(x.word)) : state.results;
  const counts=new Map();
  for(const item of source) counts.set(item.word.length,(counts.get(item.word.length)||0)+1);
  el.lengthTabs.textContent='';
  const options=[[0,`All (${source.length})`],...[...counts.entries()].sort((a,b)=>b[0]-a[0]).map(([len,count])=>[len,`${len} letters (${count})`])];
  for(const [len,label] of options){
    const button=document.createElement('button');
    button.type='button'; button.role='tab'; button.textContent=label;
    button.className=len===state.activeLength?'active':'';
    button.setAttribute('aria-selected',String(len===state.activeLength));
    button.addEventListener('click',()=>{state.activeLength=len;state.visible=120;renderTabs();renderResults();});
    el.lengthTabs.append(button);
  }
}

function toggleFavorite(word){
  if(state.favorites.has(word)) state.favorites.delete(word); else state.favorites.add(word);
  localStorage.setItem('wu-favorites', JSON.stringify([...state.favorites]));
  renderTabs(); renderResults();
}

function renderResults(){
  let source = el.favoritesOnly.checked ? state.results.filter(x=>state.favorites.has(x.word)) : state.results;
  state.filtered = state.activeLength ? source.filter(x=>x.word.length===state.activeLength) : source;
  const visible=state.filtered.slice(0,state.visible);
  el.results.textContent='';
  const frag=document.createDocumentFragment();

  for(const item of visible){
    const li=document.createElement('li'); li.className='word-result';
    const main=document.createElement('div'); main.className='word-main';
    const word=document.createElement('strong'); word.textContent=item.word;
    const score=document.createElement('span'); score.className='score'; score.textContent=`${item.score} pts`;
    main.append(word,score);
    const fav=document.createElement('button'); fav.type='button'; fav.className='favorite-button';
    fav.setAttribute('aria-label', state.favorites.has(item.word) ? `Remove ${item.word} from favorites` : `Save ${item.word} as favorite`);
    fav.setAttribute('aria-pressed', String(state.favorites.has(item.word)));
    fav.textContent=state.favorites.has(item.word) ? '★' : '☆';
    fav.addEventListener('click',()=>toggleFavorite(item.word));
    li.append(main,fav); frag.append(li);
  }

  el.results.append(frag);
  el.resultCount.textContent=state.filtered.length.toLocaleString();
  el.showMoreButton.hidden=state.visible>=state.filtered.length;
  el.copyButton.disabled=state.filtered.length===0;
}

function scheduleLiveSearch(){
  clearTimeout(state.liveTimer);
  if(!state.ready || !el.liveSearch.checked) return;
  state.liveTimer=setTimeout(()=>{
    if(sanitize(el.letters.value).length>=2) solve({silent:true});
  },250);
}

function clearTool(){
  el.unscrambleForm.reset();
  el.minLength.value='3'; el.sortBy.value='length'; el.liveSearch.checked=true;
  el.resultsPanel.hidden=true; setMessage(''); el.letters.focus();
}

function loadPreferences(){
  try{ state.favorites = new Set(JSON.parse(localStorage.getItem('wu-favorites') || '[]')); }catch{}
  const theme = localStorage.getItem('wu-theme');
  if(theme === 'dark') document.documentElement.dataset.theme='dark';
  el.themeToggle.setAttribute('aria-pressed', String(theme === 'dark'));
  el.themeToggle.textContent = theme === 'dark' ? 'Light mode' : 'Dark mode';
}

function toggleTheme(){
  const dark = document.documentElement.dataset.theme !== 'dark';
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  localStorage.setItem('wu-theme', dark ? 'dark' : 'light');
  el.themeToggle.setAttribute('aria-pressed', String(dark));
  el.themeToggle.textContent = dark ? 'Light mode' : 'Dark mode';
}

el.unscrambleForm.addEventListener('submit',event=>{event.preventDefault();if(state.ready)solve();});
el.letters.addEventListener('input',()=>{el.letters.value=sanitize(el.letters.value).toUpperCase();scheduleLiveSearch();});
for(const field of [el.startsWith,el.contains,el.endsWith]) field.addEventListener('input',()=>{field.value=sanitizePattern(field.value).toUpperCase();scheduleLiveSearch();});
el.sortBy.addEventListener('change',()=>{if(state.results.length){state.results=sortResults(state.results,el.sortBy.value);renderResults();}});
el.minLength.addEventListener('change',()=>{if(el.letters.value.length>=2&&state.ready)solve({silent:true});});
el.liveSearch.addEventListener('change',scheduleLiveSearch);
el.favoritesOnly.addEventListener('change',()=>{state.activeLength=0;renderTabs();renderResults();});
el.showMoreButton.addEventListener('click',()=>{state.visible+=120;renderResults();});
el.clearButton.addEventListener('click',clearTool);
el.themeToggle.addEventListener('click',toggleTheme);
el.copyButton.addEventListener('click',async()=>{
  try{
    await navigator.clipboard.writeText(state.filtered.map(x=>x.word).join('\n'));
    const old=el.copyButton.textContent; el.copyButton.textContent='Copied';
    setTimeout(()=>el.copyButton.textContent=old,1400);
  }catch{setMessage('Copy failed. Select and copy the words manually.','error');}
});

loadPreferences();
loadDictionary();
