const form=document.getElementById('sourceForm');
const sourceInput=document.getElementById('sourceLetters');
const minInput=document.getElementById('minLength');
const sortInput=document.getElementById('sortOrder');
const resultsEl=document.getElementById('results');
const countEl=document.getElementById('resultCount');
const messageEl=document.getElementById('resultMessage');
const moreButton=document.getElementById('showMoreButton');
const copyButton=document.getElementById('copyButton');
const clearButton=document.getElementById('clearButton');
let dictionary=[];
let matches=[];
let shown=120;

const clean=value=>value.toLowerCase().replace(/[^a-z]/g,'');
const counts=value=>{const map=new Map();for(const ch of value)map.set(ch,(map.get(ch)||0)+1);return map};
const canBuild=(word,available)=>{const used=new Map();for(const ch of word){const next=(used.get(ch)||0)+1;if(next>(available.get(ch)||0))return false;used.set(ch,next)}return true};
const render=()=>{const visible=matches.slice(0,shown);resultsEl.innerHTML=visible.map(word=>`<li>${word}</li>`).join('');countEl.textContent=matches.length.toLocaleString('en-US');copyButton.disabled=!matches.length;moreButton.hidden=shown>=matches.length;if(matches.length)messageEl.textContent=`Showing ${visible.length.toLocaleString('en-US')} of ${matches.length.toLocaleString('en-US')} words you can make.`};

async function loadDictionary(){if(dictionary.length)return true;messageEl.textContent='Loading the word list…';try{const response=await fetch('../words.txt');if(!response.ok)throw new Error('Dictionary unavailable');dictionary=(await response.text()).split(/\r?\n/).map(clean).filter(word=>/^[a-z]+$/.test(word));return true}catch{messageEl.textContent='The dictionary could not load. Please try again.';return false}}

form.addEventListener('submit',async event=>{event.preventDefault();const source=clean(sourceInput.value);if(source.length<2){matches=[];shown=120;render();messageEl.textContent='Enter at least two letters from a word or phrase.';return}if(!await loadDictionary())return;const available=counts(source);const minLength=Number(minInput.value)||3;matches=dictionary.filter(word=>word.length>=minLength&&word.length<=source.length&&canBuild(word,available));if(sortInput.value==='alpha')matches.sort((a,b)=>a.localeCompare(b));else matches.sort((a,b)=>b.length-a.length||a.localeCompare(b));shown=120;render();if(!matches.length)messageEl.textContent='No dictionary words matched those letters. Try a longer source or a smaller minimum length.';});

moreButton.addEventListener('click',()=>{shown+=200;render()});
clearButton.addEventListener('click',()=>{sourceInput.value='';minInput.value='3';sortInput.value='long';matches=[];shown=120;resultsEl.innerHTML='';countEl.textContent='0';messageEl.textContent='Enter a word or phrase to generate words from its letters.';moreButton.hidden=true;copyButton.disabled=true;sourceInput.focus()});
copyButton.addEventListener('click',async()=>{if(!matches.length)return;try{await navigator.clipboard.writeText(matches.join('\n'));const old=copyButton.textContent;copyButton.textContent='Copied';setTimeout(()=>copyButton.textContent=old,1200)}catch{messageEl.textContent='Copy failed. Select the words manually.'}});
