document.addEventListener('DOMContentLoaded',()=>{
  const form=document.querySelector('#unscramblerForm');
  const input=document.querySelector('#unscrambleLetters');
  if(!form||!input)return;
  const track=(event,params={})=>{
    if(typeof window.gtag==='function') window.gtag('event',event,params);
  };
  document.querySelectorAll('[data-unscramble-example]').forEach(button=>{
    button.addEventListener('click',()=>{
      const example=button.getAttribute('data-unscramble-example')||'';
      input.value=example;
      input.focus();
      track('unscrambler_example',{example_length:example.length});
      form.requestSubmit();
    });
  });
  document.querySelectorAll('.growth-path a').forEach(link=>{
    link.addEventListener('click',()=>track('growth_path_click',{destination:link.getAttribute('href')||'',label:(link.textContent||'').trim()}));
  });
  const count=document.querySelector('#resultCount');
  const message=document.querySelector('#resultMessage');
  const pulse=document.querySelector('#resultPulse');
  if(!count||!pulse)return;
  let lastReported='';
  const refresh=()=>{
    const n=Number.parseInt(count.textContent||'0',10)||0;
    const letters=(input.value||'').trim().toUpperCase();
    if(!letters){pulse.textContent='Try an example above or enter your own rack.';return;}
    pulse.innerHTML=n>0?`<strong>${n}</strong> candidates found for <strong>${letters.replace(/[<>&]/g,'')}</strong>. Narrow with length or letter filters if needed.`:(message?.textContent||'No matches yet.');
    const signature=`${letters}:${n}`;
    if(signature!==lastReported){
      lastReported=signature;
      track('unscrambler_results',{rack_length:letters.length,result_count:n,has_wildcard:letters.includes('?')});
    }
  };
  new MutationObserver(refresh).observe(count,{childList:true,subtree:true,characterData:true});
  form.addEventListener('submit',()=>{
    const letters=(input.value||'').trim();
    track('unscrambler_search',{rack_length:letters.length,has_wildcard:letters.includes('?')});
    setTimeout(refresh,0);
  });
  refresh();
});
