export function sanitizeLetters(value,max=15){ return value.toLowerCase().replace(/[^a-z?]/g,'').slice(0,max); }
export function sanitizePattern(value,max=8){ return value.toLowerCase().replace(/[^a-z]/g,'').slice(0,max); }
export function matchesFilters(word,{starts='',contains='',ends=''}){
  return (!starts || word.startsWith(starts)) && (!contains || word.includes(contains)) && (!ends || word.endsWith(ends));
}
