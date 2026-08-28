document.addEventListener('DOMContentLoaded',()=>{
  const path=location.pathname.replace(/\/$/,'')||'/';
  const names={
    '/word-unscrambler':'Word Unscrambler','/anagram-solver':'Anagram Solver','/word-finder':'Word Finder','/5-letter-words':'5 Letter Word Finder','/crossword-solver':'Crossword Solver','/wordle-helper':'Wordle Solver','/scrabble-helper':'Scrabble Helper','/random-word-generator':'Random Word Generator','/rhyme-finder':'Rhyme Finder','/word-lists':'Word Lists','/guides':'Guides','/writer':'Writer','/cv-builder':'CV Builder','/application-builder':'Application Builder'
  };
  const core=names[path];
  if(core&&path!=='/'){
    const main=document.querySelector('main');
    if(main&&!document.querySelector('.site-breadcrumb')){
      const nav=document.createElement('nav');nav.className='site-breadcrumb';nav.setAttribute('aria-label','Breadcrumb');
      nav.innerHTML=`<ol><li><a href="/">Home</a></li>${path==='/word-lists'?'<li aria-current="page">Word Lists</li>':`<li><a href="/word-lists/">Word Tools</a></li><li aria-current="page">${core}</li>`}</ol>`;
      main.insertAdjacentElement('afterbegin',nav);
    }
    if(!document.querySelector('script[data-breadcrumb-schema]')){
      const data={"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://lettertoolkit.com/"},{"@type":"ListItem","position":2,"name":core,"item":`https://lettertoolkit.com${path}/`} ]};
      const s=document.createElement('script');s.type='application/ld+json';s.dataset.breadcrumbSchema='1';s.textContent=JSON.stringify(data);document.head.appendChild(s);
    }
  }
  if(path==='/'){
    const tools=document.querySelector('#tools .section-heading');
    if(tools&&!document.querySelector('.home-route-links'))tools.insertAdjacentHTML('beforeend','<div class="home-route-links" aria-label="Popular word tool paths"><a href="/word-unscrambler/">Unscramble letters</a><a href="/5-letter-words/">Find 5-letter words</a><a href="/crossword-solver/">Solve a pattern</a><a href="/scrabble-helper/">Score a rack</a><a href="/word-lists/">Browse word lists</a></div>');
  }
});