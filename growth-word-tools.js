document.addEventListener('DOMContentLoaded',()=>{
  const form=document.querySelector('#unscramblerForm');
  const input=document.querySelector('#unscrambleLetters');
  if(!form||!input)return;
  document.querySelectorAll('[data-unscramble-example]').forEach(button=>{
    button.addEventListener('click',()=>{
      input.value=button.getAttribute('data-unscramble-example')||'';
      input.focus();
      form.requestSubmit();
    });
  });
  const count=document.querySelector('#resultCount');
  const message=document.querySelector('#resultMessage');
  const pulse=document.querySelector('#resultPulse');
  if(!count||!pulse)return;
  const refresh=()=>{
    const n=Number.parseInt(count.textContent||'0',10)||0;
    const letters=(input.value||'').trim().toUpperCase();
    if(!letters){pulse.textContent='Try an example above or enter your own rack.';return;}
    pulse.innerHTML=n>0?`<strong>${n}</strong> candidates found for <strong>${letters.replace(/[<>&]/g,'')}</strong>. Narrow with length or letter filters if needed.`:(message?.textContent||'No matches yet.');
  };
  new MutationObserver(refresh).observe(count,{childList:true,subtree:true,characterData:true});
  form.addEventListener('submit',()=>setTimeout(refresh,0));
  refresh();
});
