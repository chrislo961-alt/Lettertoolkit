function initPhase44(){
  if(document.documentElement.dataset.phase44Init==='1')return;
  document.documentElement.dataset.phase44Init='1';
  const path=location.pathname.replace(/\/$/,'')||'/';
  const names={
    '/word-unscrambler':'Word Unscrambler','/word-generator-from-words':'Word Generator From Words','/anagram-solver':'Anagram Solver','/word-finder':'Word Finder','/5-letter-words':'5 Letter Word Finder','/crossword-solver':'Crossword Solver','/wordle-helper':'Wordle Solver','/scrabble-helper':'Scrabble Helper','/random-word-generator':'Random Word Generator','/rhyme-finder':'Rhyme Finder','/word-lists':'Word Lists','/guides':'Guides','/writer':'Writer','/cv-builder':'CV Builder','/application-builder':'Application Builder'
  };
  const wordToolRoutes=new Set(['/word-unscrambler','/word-generator-from-words','/anagram-solver','/word-finder','/5-letter-words','/crossword-solver','/wordle-helper','/scrabble-helper','/random-word-generator','/rhyme-finder']);
  const core=names[path];
  if(core&&path!=='/'){
    const main=document.querySelector('main');
    const hasHub=wordToolRoutes.has(path);
    const crumbs=[{name:'Home',item:'https://lettertoolkit.com/'}];
    if(path==='/word-lists')crumbs.push({name:'Word Lists',item:'https://lettertoolkit.com/word-lists/'});
    else if(hasHub){crumbs.push({name:'Word Lists',item:'https://lettertoolkit.com/word-lists/'});crumbs.push({name:core,item:`https://lettertoolkit.com${path}/`});}
    else crumbs.push({name:core,item:`https://lettertoolkit.com${path}/`});
    if(main&&!document.querySelector('.site-breadcrumb')){
      const nav=document.createElement('nav');nav.className='site-breadcrumb';nav.setAttribute('aria-label','Breadcrumb');
      nav.innerHTML='<ol>'+crumbs.map((crumb,index)=>index===crumbs.length-1?`<li aria-current="page">${crumb.name}</li>`:`<li><a href="${new URL(crumb.item).pathname}">${crumb.name}</a></li>`).join('')+'</ol>';
      main.insertAdjacentElement('afterbegin',nav);
    }
    if(!document.querySelector('script[data-breadcrumb-schema]')){
      const data={"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":crumbs.map((crumb,index)=>({"@type":"ListItem","position":index+1,"name":crumb.name,"item":crumb.item}))};
      const s=document.createElement('script');s.type='application/ld+json';s.dataset.breadcrumbSchema='1';s.textContent=JSON.stringify(data);document.head.appendChild(s);
    }
  }
  if(path==='/'){
    const tools=document.querySelector('#tools .section-heading');
    if(tools&&!document.querySelector('.home-route-links'))tools.insertAdjacentHTML('beforeend','<div class="home-route-links" aria-label="Popular word tool paths"><a href="/word-generator-from-words/">Generate words from a word</a><a href="/word-unscrambler/">Make words from letters</a><a href="/5-letter-words/">Find 5-letter words</a><a href="/crossword-solver/">Solve a pattern</a><a href="/random-word-generator/">Generate random words</a><a href="/scrabble-helper/">Score a rack</a><a href="/word-lists/">Browse word lists</a></div>');
  }
  if(path==='/random-word-generator'||path==='/word-unscrambler'){
    const main=document.querySelector('main');
    if(main&&!document.querySelector('.words-from-words-route')){
      const section=document.createElement('section');section.className='content-section shell tool-copy words-from-words-route';
      section.innerHTML='<div class="section-heading"><p class="eyebrow">Related search</p><h2>Want to generate words from another word?</h2><p class="lead">Use the <a href="/word-generator-from-words/" data-growth-link="words-from-words">Word Generator From Words</a> when you already have a word or phrase and want to discover words hidden in its letters.</p></div>';
      main.append(section);
    }
  }
  document.addEventListener('click',event=>{
    const link=event.target.closest?.('[data-growth-link]');
    if(!link||typeof window.gtag!=='function')return;
    window.gtag('event','growth_path_click',{from:path,to:link.getAttribute('href')||'',path_id:link.getAttribute('data-growth-link')||''});
  });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initPhase44,{once:true});else initPhase44();