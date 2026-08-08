const editor = document.getElementById('editor');
const titleInput = document.getElementById('docTitle');
const saveStatus = document.getElementById('saveStatus');
const fileInput = document.getElementById('fileInput');
const downloadMenu = document.getElementById('downloadMenu');
let saveTimer;
let deferredPrompt;

const STORAGE_KEY='lettertoolkit-writer-v1';

function exec(cmd,value=null){
  editor.focus();
  document.execCommand(cmd,false,value);
  scheduleSave();
  updateStats();
}

document.querySelectorAll('[data-cmd]').forEach(btn=>btn.addEventListener('click',()=>exec(btn.dataset.cmd)));
document.getElementById('blockFormat').addEventListener('change',e=>exec('formatBlock',e.target.value));
document.getElementById('undoBtn').addEventListener('click',()=>exec('undo'));
document.getElementById('redoBtn').addEventListener('click',()=>exec('redo'));

function getPlainText(){return editor.innerText.replace(/\u00a0/g,' ').trim();}
function updateStats(){
  const text=getPlainText();
  const words=text?text.split(/\s+/).filter(Boolean).length:0;
  const chars=text.length;
  const paras=editor.querySelectorAll('p,h1,h2,h3,blockquote,li').length || (text?1:0);
  document.getElementById('wordCount').textContent=words;
  document.getElementById('charCount').textContent=chars;
  document.getElementById('readingTime').textContent=words?Math.max(1,Math.ceil(words/220)):0;
  document.getElementById('sideWords').textContent=words;
  document.getElementById('sideChars').textContent=chars;
  document.getElementById('paragraphCount').textContent=paras;
}
function scheduleSave(){
  saveStatus.textContent='Saving…'; saveStatus.style.color='#b45309';
  clearTimeout(saveTimer); saveTimer=setTimeout(saveDocument,350);
}
function saveDocument(){
  localStorage.setItem(STORAGE_KEY,JSON.stringify({title:titleInput.value,html:editor.innerHTML,theme:document.body.classList.contains('dark')?'dark':'light',updated:Date.now()}));
  saveStatus.textContent='Saved'; saveStatus.style.color='#15803d';
}
function loadDocument(){
  const raw=localStorage.getItem(STORAGE_KEY); if(!raw){updateStats();return;}
  try{const d=JSON.parse(raw); if(d.title) titleInput.value=d.title; if(d.html) editor.innerHTML=d.html; if(d.theme==='dark'){document.body.classList.add('dark');document.getElementById('themeBtn').textContent='Light mode';}}catch{}
  updateStats();
}
editor.addEventListener('input',()=>{scheduleSave();updateStats();});
titleInput.addEventListener('input',scheduleSave);

function sanitizeFilename(name){return (name||'document').trim().replace(/[\\/:*?"<>|]+/g,'-').replace(/\s+/g,' ').slice(0,80)||'document';}
function downloadBlob(blob,filename){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=filename;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},1000);}
function exportFile(type){
  const name=sanitizeFilename(titleInput.value);
  if(type==='txt') downloadBlob(new Blob([getPlainText()],{type:'text/plain;charset=utf-8'}),name+'.txt');
  if(type==='html'){
    const html=`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(titleInput.value)}</title></head><body>${editor.innerHTML}</body></html>`;
    downloadBlob(new Blob([html],{type:'text/html;charset=utf-8'}),name+'.html');
  }
  if(type==='doc'){
    const doc=`<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>${escapeHtml(titleInput.value)}</title></head><body>${editor.innerHTML}</body></html>`;
    downloadBlob(new Blob(['\ufeff',doc],{type:'application/msword'}),name+'.doc');
  }
  if(type==='pdf') window.print();
  downloadMenu.hidden=true;
}
function escapeHtml(s=''){return s.replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}

document.getElementById('downloadBtn').addEventListener('click',()=>downloadMenu.hidden=!downloadMenu.hidden);
downloadMenu.querySelectorAll('[data-export]').forEach(b=>b.addEventListener('click',()=>exportFile(b.dataset.export)));
document.addEventListener('click',e=>{if(!e.target.closest('.menu-wrap'))downloadMenu.hidden=true;});

document.getElementById('newBtn').addEventListener('click',()=>{
  if(!confirm('Start a new document? Your current draft is already saved locally.')) return;
  titleInput.value='Untitled document'; editor.innerHTML='<p><br></p>'; updateStats(); saveDocument(); editor.focus();
});
document.getElementById('openBtn').addEventListener('click',()=>fileInput.click());
fileInput.addEventListener('change',async()=>{
  const file=fileInput.files[0]; if(!file)return; const text=await file.text(); titleInput.value=file.name.replace(/\.[^.]+$/,'');
  if(/\.html?$/i.test(file.name)) editor.innerHTML=text; else editor.innerHTML=text.split(/\n{2,}/).map(p=>`<p>${escapeHtml(p).replace(/\n/g,'<br>')}</p>`).join('');
  updateStats();saveDocument();fileInput.value='';
});

document.getElementById('themeBtn').addEventListener('click',()=>{
  document.body.classList.toggle('dark'); const dark=document.body.classList.contains('dark');
  document.getElementById('themeBtn').textContent=dark?'Light mode':'Dark mode';saveDocument();
});

window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;document.getElementById('installBtn').hidden=false;});
document.getElementById('installBtn').addEventListener('click',async()=>{if(!deferredPrompt)return;deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;document.getElementById('installBtn').hidden=true;});

if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));}
loadDocument();
