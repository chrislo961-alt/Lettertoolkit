#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = __dirname;
const wordsPath = path.join(root, 'words.txt');
const words = fs.readFileSync(wordsPath, 'utf8').split(/\r?\n/).map(w => w.trim().toLowerCase()).filter(w => /^[a-z]+$/.test(w));
const today = new Date().toISOString().slice(0,10);
const publisherId = 'ca-pub-9212084765206199';

const specs = [
  {slug:'5-letter-words', title:'5 Letter Words', description:'Browse 5 letter words, filter the list instantly, and find useful words for Wordle, crosswords, anagrams, and word games.', type:'length', value:'5', intro:'Explore words with exactly five letters. Use the search box to narrow the list, or open Word Finder for more advanced filters.'},
  {slug:'6-letter-words', title:'6 Letter Words', description:'Browse 6 letter words and filter a large English word list for puzzles, anagrams, crosswords, and word games.', type:'length', value:'6', intro:'Explore words with exactly six letters. Search within the list or use Word Finder to combine length, pattern, beginning, ending, and exclusion filters.'},
  {slug:'7-letter-words', title:'7 Letter Words', description:'Browse 7 letter words and quickly filter an English word list for Scrabble-style games, crosswords, and anagrams.', type:'length', value:'7', intro:'Explore words with exactly seven letters. Seven-letter words are especially useful when solving anagrams and word-game racks.'},
  ...'abcdefghijklmnopqrstuvwxyz'.split('').map(letter => ({slug:`words-that-start-with-${letter}`, title:`Words That Start With ${letter.toUpperCase()}`, description:`Browse English words that start with ${letter.toUpperCase()}. Filter the list instantly for word games, writing, crosswords, and vocabulary searches.`, type:'starts', value:letter, intro:`Find words beginning with the letter ${letter.toUpperCase()}. Search within the list or use Word Finder to add length, ending, pattern, and excluded-letter filters.`})),
  ...['ing','ed','ly','tion','er','ness','ment','able'].map(suffix => ({slug:`words-that-end-with-${suffix}`, title:`Words That End With ${suffix.toUpperCase()}`, description:`Browse English words that end with ${suffix}. Filter the list instantly for writing, word games, crosswords, and vocabulary searches.`, type:'ends', value:suffix, intro:`Find words ending in “${suffix}”. Use the filter below to search within the results or open Word Finder for more precise clues.`})),
  ...['q','x','z'].map(fragment => ({slug:`words-containing-${fragment}`, title:`Words Containing ${fragment.toUpperCase()}`, description:`Browse English words containing the letter ${fragment.toUpperCase()}. Filter the list for word games, crosswords, and vocabulary searches.`, type:'contains', value:fragment, intro:`Find words containing the letter ${fragment.toUpperCase()} anywhere in the word. These lists can be especially useful for difficult word-game tiles.`}))
];

function matches(word, spec) {
  if (spec.type === 'length') return word.length === Number(spec.value);
  if (spec.type === 'starts') return word.startsWith(spec.value);
  if (spec.type === 'ends') return word.endsWith(spec.value);
  if (spec.type === 'contains') return word.includes(spec.value);
  return false;
}
function esc(s){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function pageHtml(spec, list) {
  const url = `https://lettertoolkit.com/${spec.slug}/`;
  const initial = list.slice(0,120);
  const wordItems = initial.map(w=>`<li class="seo-word">${esc(w)}</li>`).join('');
  const related = relatedLinks(spec).map(x=>`<a href="/${x.slug}/">${esc(x.title)}</a>`).join('');
  const ld = JSON.stringify([
    {'@context':'https://schema.org','@type':'CollectionPage',name:spec.title,description:spec.description,url,isPartOf:{'@type':'WebSite',name:'LetterToolkit',url:'https://lettertoolkit.com/'},inLanguage:'en'},
    {'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Home',item:'https://lettertoolkit.com/'},{'@type':'ListItem',position:2,name:'Word Lists',item:'https://lettertoolkit.com/word-lists/'},{'@type':'ListItem',position:3,name:spec.title,item:url}]},
    {'@context':'https://schema.org','@type':'FAQPage',mainEntity:[
      {'@type':'Question',name:`How many ${spec.title.toLowerCase()} are in this list?`,acceptedAnswer:{'@type':'Answer',text:`The current LetterToolkit dictionary contains ${list.length.toLocaleString('en-US')} matching words. Word lists can differ between dictionaries and games.`}},
      {'@type':'Question',name:'Can I filter these words?',acceptedAnswer:{'@type':'Answer',text:'Yes. Type in the filter box to narrow the list. For multiple constraints, use the LetterToolkit Word Finder.'}}
    ]}
  ]);
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(spec.title)} | LetterToolkit</title><meta name="description" content="${esc(spec.description)}"><link rel="canonical" href="${url}"><meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"><meta property="og:type" content="website"><meta property="og:site_name" content="LetterToolkit"><meta property="og:title" content="${esc(spec.title)} | LetterToolkit"><meta property="og:description" content="${esc(spec.description)}"><meta property="og:url" content="${url}"><meta property="og:image" content="https://lettertoolkit.com/assets/og-image.svg"><meta name="twitter:card" content="summary_large_image"><link href="/assets/favicon.svg" rel="icon" type="image/svg+xml"><link href="/site.webmanifest" rel="manifest"><link href="/styles.css?v=4.1.0" rel="stylesheet"><link as="fetch" crossorigin href="/words.txt" rel="preload"><script type="application/ld+json">${ld}</script><script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}" crossorigin="anonymous"></script></head>
<body><a class="skip-link" href="#main">Skip to content</a><header class="site-header"><div class="shell header-inner"><a class="brand" href="/"><span class="brand-mark">LT</span><span>LetterToolkit</span></a><nav aria-label="Primary navigation"><a href="/word-lists/">Word Lists</a><a href="/word-finder/">Word Finder</a><a href="/about/">About</a><button class="theme-toggle" id="themeToggle" type="button">Dark mode</button></nav></div></header>
<main id="main"><section class="tool-hero shell"><p class="eyebrow">Word lists</p><h1>${esc(spec.title)}</h1><p>${esc(spec.intro)}</p></section><div class="ad-slot shell"><span>Advertisement</span></div>
<section class="seo-list-layout shell" data-seo-type="${spec.type}" data-seo-value="${spec.value}"><div class="seo-list-card"><div class="seo-list-heading"><div><p class="kicker">Dictionary results</p><h2><span id="seoCount">${list.length.toLocaleString('en-US')}</span> words</h2></div><a class="secondary-link" href="/word-finder/">Advanced finder</a></div><label class="seo-filter-label" for="seoFilter">Filter this list<input id="seoFilter" type="search" placeholder="Type letters or a word"></label><p class="message" id="seoMessage">Showing the first ${Math.min(120,list.length).toLocaleString('en-US')} words. The full list loads in your browser.</p><ul class="seo-word-grid" id="seoWords">${wordItems}</ul><button class="show-more" id="seoShowMore" type="button">Show more</button></div>
<aside class="seo-side-card"><p class="kicker">Related searches</p><h2>Keep exploring</h2><div class="related-links">${related}</div><p>Need several clues at once? Try the <a href="/word-finder/">Word Finder</a>.</p></aside></section>
<section class="content-section shell tool-copy"><div class="section-heading"><p class="eyebrow">About this list</p><h2>Useful words, easy filtering</h2></div><div class="steps-grid"><article><span>1</span><h3>Browse</h3><p>Scan an alphabetized list built from the shared LetterToolkit dictionary.</p></article><article><span>2</span><h3>Filter</h3><p>Type any letters to narrow the results instantly in your browser.</p></article><article><span>3</span><h3>Refine</h3><p>Use Word Finder when you need exact length, pattern, start, end, or exclusion rules.</p></article></div><div class="faq-list mini-faq"><details open><summary>How many words are included?</summary><p>This page currently matches ${list.length.toLocaleString('en-US')} words in the LetterToolkit dictionary.</p></details><details><summary>Are all words valid in every game?</summary><p>No. Dictionaries and game rules differ. Check unusual words against the official word list for the game you are playing.</p></details></div></section></main>
<footer><div class="shell footer-inner"><div><strong>LetterToolkit</strong><p>Free browser-based word tools.</p></div><div class="footer-links"><a href="/word-lists/">Word Lists</a><a href="/about/">About</a><a href="/contact/">Contact</a><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a></div></div></footer><script src="/seo-browser.js?v=4.1.0" type="module"></script><script src="/theme.js?v=4.1.0"></script><script src="/site-config.js?v=4.1.0"></script><script src="/integrations.js?v=4.1.0"></script></body></html>`;
}
function relatedLinks(spec){
  if(spec.type==='length') return specs.filter(x=>x.type==='length'&&x.slug!==spec.slug).slice(0,4).concat(specs.filter(x=>x.type==='starts').slice(0,4));
  if(spec.type==='starts') {
    const idx='abcdefghijklmnopqrstuvwxyz'.indexOf(spec.value); const letters='abcdefghijklmnopqrstuvwxyz';
    return [letters[(idx+25)%26],letters[(idx+1)%26]].map(l=>specs.find(x=>x.slug===`words-that-start-with-${l}`)).concat(specs.filter(x=>x.type==='length'));
  }
  return specs.filter(x=>x.type===spec.type&&x.slug!==spec.slug).slice(0,5).concat(specs.filter(x=>x.type==='length').slice(0,2));
}
function hubHtml(){
  const groups = [
    ['Words by length', specs.filter(x=>x.type==='length')],
    ['Words that start with', specs.filter(x=>x.type==='starts')],
    ['Words that end with', specs.filter(x=>x.type==='ends')],
    ['Words containing', specs.filter(x=>x.type==='contains')]
  ];
  const cards=groups.map(([name,items])=>`<section class="word-list-group"><h2>${name}</h2><div class="related-links">${items.map(x=>`<a href="/${x.slug}/">${esc(x.title)}</a>`).join('')}</div></section>`).join('');
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Word Lists by Length, Beginning, Ending, and Letters | LetterToolkit</title><meta name="description" content="Browse English word lists by length, starting letter, ending, and contained letters. Filter every list instantly with LetterToolkit."><link rel="canonical" href="https://lettertoolkit.com/word-lists/"><meta name="robots" content="index,follow"><link href="/assets/favicon.svg" rel="icon" type="image/svg+xml"><link href="/styles.css?v=4.1.0" rel="stylesheet"><script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}" crossorigin="anonymous"></script></head><body><header class="site-header"><div class="shell header-inner"><a class="brand" href="/"><span class="brand-mark">LT</span><span>LetterToolkit</span></a><nav><a href="/word-finder/">Word Finder</a><a href="/about/">About</a><button class="theme-toggle" id="themeToggle" type="button">Dark mode</button></nav></div></header><main><section class="tool-hero shell"><p class="eyebrow">Browse the dictionary</p><h1>Word Lists</h1><p>Explore useful word lists by length, first letter, ending, and contained letters. Each page includes instant browser-based filtering.</p></section><div class="ad-slot shell"><span>Advertisement</span></div><section class="shell word-list-hub">${cards}</section></main><footer><div class="shell footer-inner"><div><strong>LetterToolkit</strong><p>Free browser-based word tools.</p></div><div class="footer-links"><a href="/about/">About</a><a href="/contact/">Contact</a><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a></div></div></footer><script src="/theme.js?v=4.1.0"></script><script src="/site-config.js?v=4.1.0"></script><script src="/integrations.js?v=4.1.0"></script></body></html>`;
}

for (const spec of specs) {
  const list = words.filter(w=>matches(w,spec)).sort();
  const dir = path.join(root,spec.slug); fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,'index.html'),pageHtml(spec,list));
}
fs.mkdirSync(path.join(root,'word-lists'),{recursive:true});
fs.writeFileSync(path.join(root,'word-lists','index.html'),hubHtml());

const sitemapPath=path.join(root,'sitemap.xml');
let sitemap=fs.readFileSync(sitemapPath,'utf8').replace(/\s*<\/urlset>\s*$/,'');
const newUrls=[{slug:'word-lists',priority:'0.8'},...specs.map(x=>({slug:x.slug,priority:'0.7'}))];
for(const x of newUrls){const loc=`https://lettertoolkit.com/${x.slug}/`; if(!sitemap.includes(`<loc>${loc}</loc>`)) sitemap+=`\n  <url><loc>${loc}</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>${x.priority}</priority></url>`;}
sitemap+='\n</urlset>\n'; fs.writeFileSync(sitemapPath,sitemap);
fs.writeFileSync(path.join(root,'seo-pages-report.json'),JSON.stringify({generatedAt:new Date().toISOString(),pages:specs.length+1,specs:specs.map(s=>({slug:s.slug,title:s.title,count:words.filter(w=>matches(w,s)).length}))},null,2));
console.log(`Generated ${specs.length+1} SEO pages.`);
