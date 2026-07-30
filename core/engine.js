import {scoreWord} from './score.js';
import {matchesFilters} from './filters.js';

function countLetters(value){
  const counts = new Uint8Array(26); let wildcards = 0;
  for(const char of value.toLowerCase()){
    if(char === '?') wildcards++;
    else { const code = char.charCodeAt(0)-97; if(code>=0 && code<26) counts[code]++; }
  }
  return {counts,wildcards};
}
function canBuild(word,rack){
  const needed = new Uint8Array(26); let missing = 0;
  for(let i=0;i<word.length;i++){
    const idx = word.charCodeAt(i)-97;
    needed[idx]++;
    if(needed[idx] > rack.counts[idx]) missing++;
    if(missing > rack.wildcards) return false;
  }
  return true;
}
export function sortResults(items,mode='length'){
  return items.sort((a,b)=> mode==='alpha'
    ? a.word.localeCompare(b.word)
    : mode==='score'
      ? b.score-a.score || b.word.length-a.word.length || a.word.localeCompare(b.word)
      : b.word.length-a.word.length || b.score-a.score || a.word.localeCompare(b.word));
}
export function unscramble({letters,wordsByLength,minLength=2,filters={},sort='length'}){
  const rack = countLetters(letters); const found=[];
  for(let len=minLength;len<=letters.length;len++){
    for(const word of wordsByLength.get(len)||[]){
      if(matchesFilters(word,filters) && canBuild(word,rack)) found.push({word,score:scoreWord(word)});
    }
  }
  return sortResults(found,sort);
}
export function exactAnagrams({letters,wordsByLength,sort='score'}){
  return sortResults(unscramble({letters,wordsByLength,minLength:letters.length,sort}).filter(x=>x.word.length===letters.length),sort);
}
export function findByPattern({wordsByLength,length,starts='',contains='',ends='',sort='alpha'}){
  const items=(wordsByLength.get(Number(length))||[]).filter(word=>matchesFilters(word,{starts,contains,ends})).map(word=>({word,score:scoreWord(word)}));
  return sortResults(items,sort);
}
