import {loadDictionary} from './core/dictionary.js';
import {unscramble, exactAnagrams, findWords, wordleSearch} from './core/engine.js';
import {sanitizeLetters, sanitizePattern} from './core/filters.js';

const $=id=>document.getElementById(id);

// Theme controls are shared by the homepage, tools, guides and writing pages.
// Keep this setup independent from tool-specific DOM so the toggle works even
// on pages that do not render the result workspace.
const toggle=$('themeToggle');
const savedTheme=localStorage.getItem('lt-theme');
if(savedTheme==='dark'||savedTheme==='light'){
  document.documentElement.dataset.theme=savedTheme;
}
function syncThemeButton(){
  if(toggle) toggle.textContent=document.documentElement.dataset.theme==='dark'?'Light mode':'Dark mode';
}
syncThemeButton();
if(toggle){
  toggle.addEventListener('click',()=>{
    const next=document.documentElement.dataset.theme==='dark'?'light':'dark';
    document.documentElement.dataset.theme=next;
    localStorage.setItem('lt-theme',next);
    syncThemeButton();
  });
}

const state={wordsByLength:new Map(),ready:false,results:[],visible:100};
const resultList=$('results'),count=$('resultCount'),message=$('resultMessage'),showMore=$('showMoreButton'),copy=$('copyButton');
function clean(v,w=false){return(w?sanitizeLetters(v):sanitizePattern(v)).toLowerCase()}
function setResults(items,label){state.results=items;state.visible=100;if(message)message.textContent=items.length?label:'No matches found. Try broader filters.';render()}
function render(){
  if(!resultList||!count||!showMore||!copy)return;
  resultList.textContent='';
  const f=document.createDocumentFragment();
  for(const item of state.results.slice(0,state.visible)){
    const li=document.createElement('li');li.className='word-result';li.innerHTML=`<strong>${item.word}</strong><span class="score">${item.meta || `${item.word.length} letters · ${item.score} pts`}</span>`;f.append(li)
  }
  resultList.append(f);count.textContent=state.results.length.toLocaleString();showMore.hidden=state.visible>=state.results.length;copy.disabled=!state.results.length
}
function ready(){if(state.ready)return true;if(message)message.textContent='The dictionary is still loading.';return false}
const bind=(id,fn)=>{const el=$(id);if(el)el.addEventListener('submit',fn)};

bind('unscramblerForm',e=>{e.preventDefault();if(!ready())return;const letters=clean($('unscrambleLetters').value,true);if(letters.length<2)return setResults([],'Enter at least two letters.');setResults(unscramble({letters,wordsByLength:state.wordsByLength,minLength:Number($('unscrambleMin').value),sort:$('unscrambleSort').value}),`Words made from ${letters.toUpperCase()}.`)});
bind('anagramForm',e=>{e.preventDefault();if(!ready())return;const letters=clean($('anagramLetters').value,true);if(letters.length<2)return setResults([],'Enter at least two letters.');setResults(exactAnagrams({letters,wordsByLength:state.wordsByLength,sort:$('anagramSort').value}),`Exact anagrams of ${letters.toUpperCase()}.`)});
bind('finderForm',e=>{e.preventDefault();if(!ready())return;setResults(findWords({wordsByLength:state.wordsByLength,length:Number($('finderLength').value)||0,pattern:clean($('finderPattern').value,true),starts:clean($('finderStarts').value),contains:clean($('finderContains').value),ends:clean($('finderEnds').value),excluded:clean($('finderExcluded').value),sort:'alpha'}),'Words matching your filters.')});
bind('wordleForm',e=>{e.preventDefault();if(!ready())return;setResults(wordleSearch({wordsByLength:state.wordsByLength,greens:clean($('wordleGreens').value,true),yellows:clean($('wordleYellows').value),grays:clean($('wordleGrays').value)}),'Five-letter candidates.')});
bind('crosswordForm',e=>{e.preventDefault();if(!ready())return;const length=Number($('crosswordLength').value)||0;let pattern=clean($('crosswordPattern').value,true);if(!pattern&&length)pattern='?'.repeat(length);if(pattern&&length&&pattern.length!==length)return setResults([],'The pattern length must match the answer length.');setResults(findWords({wordsByLength:state.wordsByLength,length:length||pattern.length,pattern,excluded:clean($('crosswordExcluded').value),sort:'alpha'}),'Possible crossword answers.');});
bind('scrabbleForm',e=>{e.preventDefault();if(!ready())return;const letters=clean($('scrabbleLetters').value,true);if(letters.length<2)return setResults([],'Enter at least two rack letters.');const filters={starts:clean($('scrabbleStarts').value),contains:clean($('scrabbleContains').value),ends:clean($('scrabbleEnds').value)};setResults(unscramble({letters,wordsByLength:state.wordsByLength,minLength:Number($('scrabbleMin').value)||2,filters,sort:$('scrabbleSort').value}),`Playable words from ${letters.toUpperCase()}, ranked by Scrabble tile value.`);});
bind('randomForm',e=>{e.preventDefault();if(!ready())return;const length=Number($('randomLength').value)||0;const countWanted=Math.min(50,Math.max(1,Number($('randomCount').value)||10));const starts=clean($('randomStarts').value);const contains=clean($('randomContains').value);const pool=[];const lengths=length?[length]:[...state.wordsByLength.keys()];for(const len of lengths){for(const word of state.wordsByLength.get(len)||[]){if(starts&&!word.startsWith(starts))continue;if(contains&&!word.includes(contains))continue;if(word.length<2||word.length>15)continue;pool.push(word)}}for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]]}const items=pool.slice(0,countWanted).map(word=>({word,score:0,meta:`${word.length} letters · random pick`}));setResults(items,`Generated ${items.length} random word${items.length===1?'':'s'} from ${pool.length.toLocaleString()} matching entries.`);});
bind('rhymeForm',e=>{e.preventDefault();if(!ready())return;const source=clean($('rhymeWord').value);if(source.length<3)return setResults([],'Enter a word with at least three letters.');const depth=Math.min(source.length,Math.max(2,Number($('rhymeDepth').value)||3));const ending=source.slice(-depth);const maxLength=Number($('rhymeMaxLength').value)||0;const items=[];for(const [len,words] of state.wordsByLength){if(maxLength&&len>maxLength)continue;for(const word of words){if(word===source||!word.endsWith(ending))continue;items.push({word,score:0,meta:`${word.length} letters · ends in ${ending.toUpperCase()}`});if(items.length>=5000)break}if(items.length>=5000)break}items.sort((a,b)=>Math.abs(a.word.length-source.length)-Math.abs(b.word.length-source.length)||a.word.localeCompare(b.word));setResults(items,`Words sharing the ending ${ending.toUpperCase()} with ${source.toUpperCase()}.`);});

if(showMore)showMore.addEventListener('click',()=>{state.visible+=100;render()});
if(copy)copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(state.results.map(x=>x.word).join('\n'));copy.textContent='Copied';setTimeout(()=>copy.textContent='Copy all',1200)}catch{if(message)message.textContent='Copy failed. Select the words manually.'}});

// Only tool pages need the large dictionary. Homepage and content pages should
// not fetch it just to support shared navigation/theme behavior.
if(message){
  try{
    const d=await loadDictionary('/words.txt');state.wordsByLength=d.wordsByLength;state.ready=true;message.textContent=`${d.total.toLocaleString()} words ready. Enter your clues and search.`
  }catch(err){
    message.textContent='Dictionary unavailable. Please refresh the page.';console.error(err)
  }
}
