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
  const used = new Uint8Array(26); let missing = 0;
  for(const char of word){
    const idx=char.charCodeAt(0)-97;
    used[idx]++;
    if(used[idx] > rack.counts[idx]) missing++;
    if(missing > rack.wildcards) return false;
  }
  return true;
}
export function sortResults(items,mode='length'){
  return [...items].sort((a,b)=> mode==='alpha'
    ? a.word.localeCompare(b.word)
    : mode==='score'
      ? b.score-a.score || b.word.length-a.word.length || a.word.localeCompare(b.word)
      : mode==='short'
        ? a.word.length-b.word.length || a.word.localeCompare(b.word)
        : b.word.length-a.word.length || b.score-a.score || a.word.localeCompare(b.word));
}
export function unscramble({letters,wordsByLength,minLength=2,filters={},sort='length'}){
  const rack=countLetters(letters); const found=[];
  for(let len=minLength;len<=letters.length;len++){
    for(const word of wordsByLength.get(len)||[]){
      if(matchesFilters(word,filters) && canBuild(word,rack)) found.push({word,score:scoreWord(word)});
    }
  }
  return sortResults(found,sort);
}
export function exactAnagrams({letters,wordsByLength,sort='alpha',filters={},includeOriginal=false}){
  const normalized=letters.toLowerCase();
  return sortResults(
    unscramble({letters,wordsByLength,minLength:letters.length,filters,sort})
      .filter(item=>item.word.length===letters.length && (includeOriginal || item.word!==normalized)),
    sort
  );
}
export function findWords({wordsByLength,length=0,starts='',contains='',ends='',pattern='',excluded='',required='',sort='alpha',limit=5000}){
  const lengths=length ? [Number(length)] : [...wordsByLength.keys()].sort((a,b)=>a-b);
  const excludedSet=new Set(excluded.toLowerCase());
  const requiredChars=[...new Set(required.toLowerCase().replace(/[^a-z]/g,''))];
  const normalizedPattern=pattern.toLowerCase().replace(/[^a-z?]/g,'');
  const found=[];
  for(const len of lengths){
    if(normalizedPattern && normalizedPattern.length!==len) continue;
    for(const word of wordsByLength.get(len)||[]){
      if(!matchesFilters(word,{starts,contains,ends})) continue;
      if(excludedSet.size && [...word].some(char=>excludedSet.has(char))) continue;
      if(requiredChars.length && requiredChars.some(char=>!word.includes(char))) continue;
      if(normalizedPattern && [...normalizedPattern].some((char,index)=>char!=='?' && word[index]!==char)) continue;
      found.push({word,score:scoreWord(word)});
      if(found.length>=limit) return sortResults(found,sort);
    }
  }
  return sortResults(found,sort);
}
function wordleFeedback(answer,guess){
  const result=Array(5).fill('gray');
  const remaining={};
  for(let i=0;i<5;i++){
    if(guess[i]===answer[i]) result[i]='green';
    else remaining[answer[i]]=(remaining[answer[i]]||0)+1;
  }
  for(let i=0;i<5;i++){
    if(result[i]==='green') continue;
    const ch=guess[i];
    if((remaining[ch]||0)>0){result[i]='yellow';remaining[ch]--;}
  }
  return result;
}
export function wordleSearch({wordsByLength,greens='',yellows='',grays='',guesses=[],sort='alpha'}){
  let pool=wordsByLength.get(5)||[];
  if(guesses.length){
    const normalized=guesses.map(row=>({
      word:String(row.word||'').toLowerCase().replace(/[^a-z]/g,'').slice(0,5),
      states:Array.isArray(row.states)?row.states.slice(0,5):[]
    })).filter(row=>row.word.length===5&&row.states.length===5);
    pool=pool.filter(candidate=>normalized.every(row=>{
      const actual=wordleFeedback(candidate,row.word);
      return actual.every((state,i)=>state===row.states[i]);
    }));
  }else{
    const pattern=greens.toLowerCase().replace(/[^a-z?]/g,'').padEnd(5,'?').slice(0,5);
    const mustHave=[...new Set(yellows.toLowerCase().replace(/[^a-z]/g,''))];
    const blocked=new Set(grays.toLowerCase().replace(/[^a-z]/g,''));
    pool=pool.filter(word=>{
      for(let i=0;i<5;i++) if(pattern[i]!=='?' && word[i]!==pattern[i]) return false;
      if(mustHave.some(char=>!word.includes(char))) return false;
      for(const char of blocked) if(!mustHave.includes(char) && word.includes(char)) return false;
      return true;
    });
  }
  return sortResults(pool.map(word=>({word,score:scoreWord(word)})),sort);
}
