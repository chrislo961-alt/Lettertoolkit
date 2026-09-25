const text=document.getElementById('counterText');
const wordCount=document.getElementById('wordCount');
const characterCount=document.getElementById('characterCount');
const characterNoSpaceCount=document.getElementById('characterNoSpaceCount');
const sentenceCount=document.getElementById('sentenceCount');
const paragraphCount=document.getElementById('paragraphCount');
const readingTime=document.getElementById('readingTime');
const speakingTime=document.getElementById('speakingTime');
const note=document.getElementById('counterNote');
const clearButton=document.getElementById('clearButton');
const sampleButton=document.getElementById('sampleButton');

function countWords(value){
  return value.match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu)?.length||0;
}
function countSentences(value){
  const trimmed=value.trim();
  if(!trimmed)return 0;
  const matches=trimmed.match(/[^.!?]+(?:[.!?]+|$)/g)||[];
  return matches.filter(part=>/[\p{L}\p{N}]/u.test(part)).length;
}
function countParagraphs(value){
  const trimmed=value.trim();
  if(!trimmed)return 0;
  return trimmed.split(/\n\s*\n+/).filter(part=>part.trim()).length;
}
function duration(words,rate){
  if(!words)return '0 min';
  const minutes=words/rate;
  if(minutes<1)return '< 1 min';
  return `${Math.ceil(minutes)} min`;
}
function update(){
  const value=text.value;
  const words=countWords(value);
  const chars=Array.from(value).length;
  const noSpace=Array.from(value.replace(/\s/g,'')).length;
  const sentences=countSentences(value);
  const paragraphs=countParagraphs(value);
  wordCount.textContent=words.toLocaleString();
  characterCount.textContent=chars.toLocaleString();
  characterNoSpaceCount.textContent=noSpace.toLocaleString();
  sentenceCount.textContent=sentences.toLocaleString();
  paragraphCount.textContent=paragraphs.toLocaleString();
  readingTime.textContent=duration(words,200);
  speakingTime.textContent=duration(words,130);
  note.textContent=words?`${words.toLocaleString()} ${words===1?'word':'words'} across ${paragraphs.toLocaleString()} ${paragraphs===1?'paragraph':'paragraphs'}.`:'Start typing or paste text to see the totals.';
}
text.addEventListener('input',update);
clearButton.addEventListener('click',()=>{text.value='';update();text.focus();});
sampleButton.addEventListener('click',()=>{text.value='How many words is this sentence? LetterToolkit counts the text instantly in your browser. Add another paragraph to see the paragraph count change.\n\nThis short example also shows estimated reading and speaking time.';update();text.focus();});
update();
