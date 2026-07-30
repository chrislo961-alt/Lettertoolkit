export async function loadDictionary(url='words.txt'){
  const response = await fetch(url);
  if(!response.ok) throw new Error(`Dictionary request failed: HTTP ${response.status}`);
  const wordsByLength = new Map();
  let total = 0;
  const text = await response.text();
  for(const raw of text.split(/\r?\n/)){
    const word = raw.trim().toLowerCase();
    if(!word) continue;
    if(!wordsByLength.has(word.length)) wordsByLength.set(word.length,[]);
    wordsByLength.get(word.length).push(word);
    total++;
  }
  return {wordsByLength,total};
}
