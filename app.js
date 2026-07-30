import {loadDictionary} from './core/dictionary.js';
import {unscramble, exactAnagrams, findWords, wordleSearch} from './core/engine.js';
import {sanitizeLetters, sanitizePattern} from './core/filters.js';

const state={wordsByLength:new Map(),ready:false,results:[],visible:100};
const $=id=>document.getElementById(id);
const resultList=$('results'), count=$('resultCount'), message=$('resultMessage'), showMore=$('showMoreButton'), copy=$('copyButton');

function clean(value,wildcards=false){return (wildcards?sanitizeLetters(value):sanitizePattern(value)).toLowerCase();}
function setResults(items,label){state.results=items;state.visible=100;message.textContent=items.length?label:'No matches found. Try broader filters.';render();}
function render(){const visible=state.results.slice(0,state.visible);resultList.textContent='';const frag=document.createDocumentFragment();for(const item of visible){const li=document.createElement('li');li.className='word-result';const word=document.createElement('strong');word.textContent=item.word;const meta=document.createElement('span');meta.className='score';meta.textContent=`${item.word.length} letters · ${item.score} pts`;li.append(word,meta);frag.append(li);}resultList.append(frag);count.textContent=state.results.length.toLocaleString();showMore.hidden=state.visible>=state.results.length;copy.disabled=!state.results.length;}
function requireReady(){if(state.ready)return true;message.textContent='The dictionary is still loading.';return false;}

for(const tab of document.querySelectorAll('.tool-tab')) tab.addEventListener('click',()=>{document.querySelectorAll('.tool-tab').forEach(x=>x.classList.toggle('active',x===tab));document.querySelectorAll('.tool-pane').forEach(x=>x.classList.toggle('active',x.dataset.pane===tab.dataset.tool));history.replaceState(null,'',`#${tab.dataset.tool}`);});

$('unscramblerForm').addEventListener('submit',e=>{e.preventDefault();if(!requireReady())return;const letters=clean($('unscrambleLetters').value,true);if(letters.length<2)return setResults([],'Enter at least two letters.');setResults(unscramble({letters,wordsByLength:state.wordsByLength,minLength:Number($('unscrambleMin').value),sort:$('unscrambleSort').value}),`Words made from ${letters.toUpperCase()}.`);});
$('anagramForm').addEventListener('submit',e=>{e.preventDefault();if(!requireReady())return;const letters=clean($('anagramLetters').value,true);if(letters.length<2)return setResults([],'Enter at least two letters.');setResults(exactAnagrams({letters,wordsByLength:state.wordsByLength,sort:$('anagramSort').value}),`Exact anagrams of ${letters.toUpperCase()}.`);});
$('finderForm').addEventListener('submit',e=>{e.preventDefault();if(!requireReady())return;setResults(findWords({wordsByLength:state.wordsByLength,length:Number($('finderLength').value)||0,pattern:clean($('finderPattern').value,true),starts:clean($('finderStarts').value),contains:clean($('finderContains').value),ends:clean($('finderEnds').value),excluded:clean($('finderExcluded').value),sort:'alpha'}),'Words matching your filters.');});
$('wordleForm').addEventListener('submit',e=>{e.preventDefault();if(!requireReady())return;setResults(wordleSearch({wordsByLength:state.wordsByLength,greens:clean($('wordleGreens').value,true),yellows:clean($('wordleYellows').value),grays:clean($('wordleGrays').value)}),'Five-letter candidates.');});
showMore.addEventListener('click',()=>{state.visible+=100;render();});
copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(state.results.map(x=>x.word).join('\n'));copy.textContent='Copied';setTimeout(()=>copy.textContent='Copy all',1200);}catch{message.textContent='Copy failed. Select the words manually.';}});
$('themeToggle').addEventListener('click',()=>{const dark=document.documentElement.dataset.theme!=='dark';document.documentElement.dataset.theme=dark?'dark':'light';localStorage.setItem('wt-theme',dark?'dark':'light');$('themeToggle').textContent=dark?'Light mode':'Dark mode';});
if(localStorage.getItem('wt-theme')==='dark'){document.documentElement.dataset.theme='dark';$('themeToggle').textContent='Light mode';}

const hash=location.hash.slice(1);const initial=document.querySelector(`.tool-tab[data-tool="${hash}"]`);if(initial)initial.click();
try{const dictionary=await loadDictionary('./words.txt');state.wordsByLength=dictionary.wordsByLength;state.ready=true;$('dictionaryStatus').textContent=`${dictionary.total.toLocaleString()} words ready`;$('dictionaryStatus').classList.add('ready');}catch(error){$('dictionaryStatus').textContent='Dictionary unavailable';message.textContent='words.txt could not be loaded.';console.error(error);}
