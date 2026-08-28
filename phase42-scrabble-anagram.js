function initPhase42(){
  if(document.documentElement.dataset.phase42Init==='1')return;
  document.documentElement.dataset.phase42Init='1';
  const path=location.pathname.replace(/\/$/,'');
  const add=(target,html)=>target?.insertAdjacentHTML('afterend',html);
  const setMeta=(title,description)=>{document.title=title;const meta=document.querySelector('meta[name="description"]');if(meta)meta.setAttribute('content',description);};
  const track=(name,params={})=>{if(typeof window.gtag==='function')window.gtag('event',name,params);};

  if(path==='/scrabble-helper'){
    setMeta('Scrabble Word Finder – Rack Solver, Blanks & Scores | LetterToolkit','Find words from Scrabble rack letters and blank tiles. Rank by tile score, filter by length and board-friendly letter rules, and explore high-scoring word lists.');
    const workspace=document.querySelector('.workspace');
    add(workspace,`<section class="rack-bridge"><div class="rack-card"><p class="eyebrow">Rack-to-score workflow</p><h2>Find playable rack words, then narrow for the board</h2><p>Use this tool when you can play some or all rack tiles. For a puzzle that requires every supplied letter exactly once, switch to Exact Anagrams.</p><div class="rack-grid"><article><h3>Try a rack</h3><p>Load a realistic rack, including a blank tile.</p><div class="rack-examples"><button data-scrabble-rack="RETINAS">RETINAS</button><button data-scrabble-rack="RET?NAS">RET?NAS</button><button data-scrabble-rack="AEIRST?">AEIRST?</button></div></article><article><h3>Useful scoring paths</h3><p>Explore existing lists when you care about structure or tile value.</p><div class="rack-links"><a href="/high-scoring-5-letter-words/">High-scoring 5-letter words</a><a href="/5-letter-words-with-q/">5-letter words with Q</a><a href="/words-containing-z/">Words with Z</a></div></article><article><h3>Need every tile used?</h3><p>Anagram Solver is stricter: same letters, same counts, full rack length.</p><div class="rack-links"><a href="/anagram-solver/">Exact Anagram Solver</a><a href="/word-unscrambler/">General Unscrambler</a></div></article></div><div class="rack-insight" id="scrabbleInsight"><strong>Tip:</strong> rank by tile score first, then use starts/contains/ends to match the board.</div><div class="rack-actions"><a href="/anagram-solver/">Use every tile exactly</a><a class="secondary" href="/word-unscrambler/">Find broader rack words</a></div></div></section>`);
    document.querySelectorAll('[data-scrabble-rack]').forEach(btn=>btn.addEventListener('click',()=>{const input=document.querySelector('#scrabbleLetters'),form=document.querySelector('#scrabbleForm');if(input)input.value=btn.dataset.scrabbleRack||'';form?.requestSubmit();track('scrabble_example',{rack_length:(btn.dataset.scrabbleRack||'').length,has_blank:(btn.dataset.scrabbleRack||'').includes('?')});}));
    const form=document.querySelector('#scrabbleForm'),count=document.querySelector('#resultCount'),insight=document.querySelector('#scrabbleInsight');
    form?.addEventListener('submit',()=>setTimeout(()=>{if(!insight||!count)return;const rack=document.querySelector('#scrabbleLetters')?.value||'';const n=Number((count.textContent||'0').replace(/[^0-9]/g,''))||0;insight.innerHTML=`<strong>${n.toLocaleString()} candidate${n===1?'':'s'}</strong> from a ${rack.length}-tile rack${rack.includes('?')?' with a blank':''}. Use board filters next if the list is still broad.`;track('scrabble_results',{rack_length:rack.length,result_count:n,has_blank:rack.includes('?')});},0));
  }

  if(path==='/anagram-solver'){
    setMeta('Anagram Solver – Exact Anagrams Using Every Letter | LetterToolkit','Find exact single-word anagrams that use every supplied letter once. Preserve duplicate letters, use ? wildcards, add filters and compare with broader rack-word tools.');
    const form=document.querySelector('#anagramForm');
    if(form&&!document.querySelector('#anagramSharePhase42')){
      const button=document.createElement('button');button.type='button';button.id='anagramSharePhase42';button.className='secondary-button phase42-share';button.textContent='Copy search link';form.appendChild(button);
      const restore=new URLSearchParams(location.search);const map={letters:'anagramLetters',starts:'anagramStarts',contains:'anagramContains',ends:'anagramEnds',sort:'anagramSort',original:'anagramIncludeOriginal'};
      for(const [key,id] of Object.entries(map)){const el=document.getElementById(id),value=restore.get(key);if(!el||value===null)continue;if(el.type==='checkbox')el.checked=value==='1';else el.value=value;}
      const submitWhenDictionaryReady=()=>{
        if(!location.search||!document.querySelector('#anagramLetters')?.value)return;
        const message=document.querySelector('#resultMessage');
        const readyNow=/words ready/i.test(message?.textContent||'');
        if(readyNow){form.requestSubmit();return;}
        if(!message)return;
        const observer=new MutationObserver(()=>{if(/words ready/i.test(message.textContent||'')){observer.disconnect();form.requestSubmit();}});
        observer.observe(message,{childList:true,subtree:true,characterData:true});
        setTimeout(()=>observer.disconnect(),10000);
      };
      submitWhenDictionaryReady();
      button.addEventListener('click',async()=>{const url=new URL(location.href);url.search='';const values={letters:document.querySelector('#anagramLetters')?.value||'',starts:document.querySelector('#anagramStarts')?.value||'',contains:document.querySelector('#anagramContains')?.value||'',ends:document.querySelector('#anagramEnds')?.value||'',sort:document.querySelector('#anagramSort')?.value||'alpha',original:document.querySelector('#anagramIncludeOriginal')?.checked?'1':''};for(const [key,value] of Object.entries(values)){if(value&&!(key==='sort'&&value==='alpha'))url.searchParams.set(key,value);}try{await navigator.clipboard.writeText(url.toString());button.textContent='Link copied';setTimeout(()=>button.textContent='Copy search link',1200);}catch{history.replaceState(null,'',url.toString());}track('anagram_share',{letter_count:values.letters.length,has_wildcard:values.letters.includes('?')});});
    }
    const workspace=document.querySelector('.workspace');
    add(workspace,`<section class="rack-bridge"><div class="rack-card"><p class="eyebrow">Exact anagram workflow</p><h2>Every supplied letter must be accounted for</h2><p>This solver is intentionally stricter than a word unscrambler. Exact anagrams preserve rack length and duplicate-letter counts.</p><div class="rack-grid"><article><h3>Try an exact set</h3><p>Load a classic anagram pair or a wildcard example.</p><div class="rack-examples"><button data-anagram-letters="SILENT">SILENT</button><button data-anagram-letters="LISTEN">LISTEN</button><button data-anagram-letters="TRA?N">TRA?N</button></div></article><article><h3>Broader search</h3><p>If shorter words are allowed, an exact solver is the wrong constraint.</p><div class="rack-links"><a href="/word-unscrambler/">Word Unscrambler</a><a href="/scrabble-helper/">Scrabble rack words</a></div></article><article><h3>Pattern instead of letters?</h3><p>Use fixed-position tools when you know where letters belong.</p><div class="rack-links"><a href="/word-finder/">Word Finder</a><a href="/crossword-solver/">Crossword Solver</a></div></article></div><div class="rack-insight"><span class="exact-badge">Exact = same length + same letter counts</span></div><div class="rack-actions"><a href="/word-unscrambler/">Allow shorter words</a><a class="secondary" href="/guides/anagram-guide/">Anagram strategy guide</a></div></div></section>`);
    document.querySelectorAll('[data-anagram-letters]').forEach(btn=>btn.addEventListener('click',()=>{const input=document.querySelector('#anagramLetters');if(input)input.value=btn.dataset.anagramLetters||'';document.querySelector('#anagramForm')?.requestSubmit();track('anagram_example',{letter_count:(btn.dataset.anagramLetters||'').length,has_wildcard:(btn.dataset.anagramLetters||'').includes('?')});}));
  }

  document.querySelectorAll('.rack-links a,.rack-actions a').forEach(a=>a.addEventListener('click',()=>track('rack_cluster_click',{from:path,to:a.getAttribute('href')||''})));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initPhase42,{once:true});else initPhase42();