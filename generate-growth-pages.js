#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = __dirname;
const site = 'https://lettertoolkit.com';
const words = [...new Set(fs.readFileSync(path.join(root, 'words.txt'), 'utf8')
  .split(/\r?\n/).map(w => w.trim().toLowerCase()).filter(w => /^[a-z]{2,15}$/.test(w)))];
const five = words.filter(w => w.length === 5).sort();
const letters = 'abcdefghijklmnopqrstuvwxyz';
const vowels = new Set('aeiou');
const scoreMap = {a:1,b:3,c:3,d:2,e:1,f:4,g:2,h:4,i:1,j:8,k:5,l:1,m:3,n:1,o:1,p:3,q:10,r:1,s:1,t:1,u:1,v:4,w:4,x:8,y:4,z:10};
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const score = w => [...w].reduce((n,c) => n + (scoreMap[c] || 0), 0);
const vowelCount = w => [...w].filter(c => vowels.has(c)).length;
const hasDouble = w => /(.)\1/.test(w);
const unique = w => new Set(w).size === w.length;

const patterns = [
  ...['st','cr','br','tr','ch','sh','cl','sp','gr','fl'].map(value => ({kind:'starts', value, slug:`5-letter-words-starting-with-${value}`, title:`5 Letter Words Starting With ${value.toUpperCase()}`})),
  ...['er','ly','le','se','te','nd','ch','sh','ck','nt'].map(value => ({kind:'ends', value, slug:`5-letter-words-ending-in-${value}`, title:`5 Letter Words Ending in ${value.toUpperCase()}`})),
  ...['ou','ea','ai','ie','oo','ar','or','th','ch','qu'].map(value => ({kind:'contains', value, slug:`5-letter-words-containing-${value}`, title:`5 Letter Words Containing ${value.toUpperCase()}`}))
];

const themes = [
  {slug:'5-letter-words-with-double-letters', title:'5 Letter Words With Double Letters', label:'adjacent repeated letters', test:hasDouble, tip:'Double letters can be easy to overlook because a puzzle may confirm the letter before it confirms the repetition.'},
  {slug:'5-letter-words-with-no-repeated-letters', title:'5 Letter Words With No Repeated Letters', label:'five different letters', test:unique, tip:'Words with five different letters are useful when your goal is to test as much new information as possible.'},
  {slug:'5-letter-words-with-3-vowels', title:'5 Letter Words With 3 Vowels', label:'exactly three vowels', test:w=>vowelCount(w)===3, tip:'Vowel-rich words can help reveal the basic shape of an unknown word early.'},
  {slug:'5-letter-words-with-4-vowels', title:'5 Letter Words With 4 Vowels', label:'exactly four vowels', test:w=>vowelCount(w)===4, tip:'Four-vowel words are uncommon and useful when a clue points toward an unusually open sound pattern.'},
  {slug:'5-letter-words-without-aeiou', title:'5 Letter Words Without A E I O U', label:'no standard A, E, I, O or U', test:w=>vowelCount(w)===0, tip:'These words usually rely on Y, or come from less common parts of a broad English word list.'},
  {slug:'5-letter-words-with-q', title:'5 Letter Words With Q', label:'the letter Q', test:w=>w.includes('q'), tip:'Q is a high-value tile, but the valid result depends on the dictionary used by your game.'},
  {slug:'high-scoring-5-letter-words', title:'High-Scoring 5 Letter Words', label:'a base Scrabble-style score of 15 or more', test:w=>score(w)>=15, sort:(a,b)=>score(b)-score(a)||a.localeCompare(b), tip:'Base tile scores do not include board bonuses. Placement and hooks can matter more than raw value.'},
  {slug:'5-letter-palindromes', title:'5 Letter Palindromes', label:'the same spelling forward and backward', test:w=>w===[...w].reverse().join(''), tip:'Palindromes are memorable symmetry examples, but broad dictionaries may include rare entries.'},
  {slug:'5-letter-words-starting-and-ending-with-s', title:'5 Letter Words Starting and Ending With S', label:'S in the first and last position', test:w=>w.startsWith('s')&&w.endsWith('s'), tip:'Combining a known beginning and ending is much more precise than searching for either clue alone.'},
  {slug:'5-letter-words-with-y-as-the-only-vowel', title:'5 Letter Words With Y as the Only Vowel', label:'Y but no A, E, I, O or U', test:w=>w.includes('y')&&vowelCount(w)===0, tip:'Whether Y is treated as a vowel depends on context, but this pattern is useful in word puzzles.'}
];

function listFor(spec) {
  let list;
  if (spec.test) list = five.filter(spec.test);
  else if (spec.kind === 'starts') list = five.filter(w => w.startsWith(spec.value));
  else if (spec.kind === 'ends') list = five.filter(w => w.endsWith(spec.value));
  else list = five.filter(w => w.includes(spec.value));
  return list.sort(spec.sort || ((a,b)=>a.localeCompare(b)));
}

function nav() {
  return `<header class="site-header"><div class="shell header-inner"><a class="brand" href="/"><span class="brand-mark">LT</span><span>LetterToolkit</span></a><nav aria-label="Primary navigation"><a href="/5-letter-words/">5 Letter Words</a><a href="/word-finder/">Word Finder</a><a href="/word-lists/">Word Lists</a><a href="/guides/">Guides</a><button class="theme-toggle" id="themeToggle" type="button">Dark mode</button></nav></div></header>`;
}
function foot() {
  return `<footer><div class="shell footer-inner"><div><strong>LetterToolkit</strong><p>Independent browser-based word tools and practical guides.</p></div><div class="footer-links"><a href="/word-lists/">Word Lists</a><a href="/about/">About</a><a href="/contact/">Contact</a><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a></div></div></footer>`;
}
function head({title, description, slug, schema=''}) {
  const url = `${site}/${slug}/`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} | LetterToolkit</title><meta name="description" content="${esc(description)}"><link rel="canonical" href="${url}"><meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1"><meta property="og:type" content="website"><meta property="og:site_name" content="LetterToolkit"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${site}/assets/og-image.svg"><meta name="twitter:card" content="summary_large_image"><link href="/assets/favicon.svg" rel="icon" type="image/svg+xml"><link href="/site.webmanifest" rel="manifest"><link href="/styles.css?v=7.0" rel="stylesheet"><link href="/growth.css?v=7.0" rel="stylesheet">${schema?`<script type="application/ld+json">${schema}</script>`:''}<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9212084765206199" crossorigin="anonymous"></script></head>`;
}
function crumbs(current, slug) {
  return JSON.stringify({'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[
    {'@type':'ListItem',position:1,name:'Home',item:`${site}/`},
    {'@type':'ListItem',position:2,name:'5 Letter Words',item:`${site}/5-letter-words/`},
    {'@type':'ListItem',position:3,name:current,item:`${site}/${slug}/`}
  ]});
}
function examples(list, n=120) {
  return list.slice(0,n).map(w=>`<li class="seo-word">${esc(w)}</li>`).join('');
}
function related(spec) {
  const pool = spec.kind ? patterns : themes;
  return pool.filter(x=>x.slug!==spec.slug).slice(0,8).map(x=>`<a href="/${x.slug}/">${esc(x.title)}</a>`).join('');
}
function landing(spec) {
  const list = listFor(spec);
  const description = `${spec.title}: browse ${list.length.toLocaleString('en-US')} matching words, filter the list instantly, and refine the result with the free five-letter word finder.`;
  const clue = spec.label || `${spec.kind === 'starts' ? 'the beginning' : spec.kind === 'ends' ? 'the ending' : 'the sequence'} ${spec.value.toUpperCase()}`;
  const tip = spec.tip || `Use this list when you know ${clue}. Add known positions and excluded letters in the finder to reduce the candidates further.`;
  const faq = {'@context':'https://schema.org','@type':'FAQPage',mainEntity:[
    {'@type':'Question',name:`How many matches are on this page?`,acceptedAnswer:{'@type':'Answer',text:`The current LetterToolkit dictionary contains ${list.length.toLocaleString('en-US')} five-letter words matching ${clue}. Dictionary coverage varies by publisher and game.`}},
    {'@type':'Question',name:'Can I add more clues?',acceptedAnswer:{'@type':'Answer',text:'Yes. Use the five-letter finder to combine fixed positions, required letters and excluded letters.'}}
  ]};
  const schema = JSON.stringify([JSON.parse(crumbs(spec.title,spec.slug)), faq]);
  return `${head({title:spec.title,description,slug:spec.slug,schema})}<body>${nav()}<main id="main"><section class="tool-hero shell compact-hero"><p class="eyebrow">Five-letter word list</p><h1>${esc(spec.title)}</h1><p>${esc(description)}</p></section><section class="seo-list-layout shell"><div class="seo-list-card"><div class="seo-list-heading"><div><p class="kicker">Verified from our shared list</p><h2>${list.length.toLocaleString('en-US')} matches</h2></div><a class="primary-link" href="/5-letter-words/#finder">Add more clues</a></div><label class="seo-filter-label">Filter these results<input class="local-list-filter" type="search" placeholder="Type letters"></label><p class="message local-list-message">Showing ${Math.min(120,list.length)} of ${list.length.toLocaleString('en-US')} words.</p><ul class="seo-word-grid local-word-list">${examples(list)}</ul><script type="application/json" class="local-word-data">${JSON.stringify(list)}</script><button class="show-more local-show-more" type="button">Show more</button></div><aside class="seo-side-card"><p class="kicker">Related searches</p><h2>Keep narrowing</h2><div class="related-links">${related(spec)}</div></aside></section><section class="content-section shell tool-copy"><div class="section-heading"><p class="eyebrow">How to use this list</p><h2>Turn one clue into a smaller answer set</h2><p class="lead">${esc(tip)}</p></div><div class="steps-grid"><article><span>1</span><h3>Start with the pattern</h3><p>Confirm that every candidate has exactly five letters and matches ${esc(clue)}.</p></article><article><span>2</span><h3>Remove impossible words</h3><p>Exclude letters already ruled out and check repeated letters carefully.</p></article><article><span>3</span><h3>Verify the final answer</h3><p>Use crossing letters, clue meaning or the official list for your game.</p></article></div><div class="faq-list mini-faq"><details open><summary>Why can another word list show a different total?</summary><p>Dictionaries differ in their treatment of regional, archaic, technical and inflected words.</p></details><details><summary>Can I combine this with position clues?</summary><p>Yes. Open the five-letter finder and enter known letters in their exact positions.</p></details></div></section></main>${foot()}<script src="/growth.js?v=7.0"></script><script src="/theme.js?v=4.1.0"></script><script src="/integrations.js?v=4.1.0"></script></body></html>`;
}

function hub() {
  const description = `Find five-letter words using exact positions, starting letters, endings, required letters and exclusions. Search ${five.length.toLocaleString('en-US')} dictionary entries instantly.`;
  const groups = [
    ['Popular beginnings', patterns.filter(x=>x.kind==='starts')],
    ['Popular endings', patterns.filter(x=>x.kind==='ends')],
    ['Letter combinations', patterns.filter(x=>x.kind==='contains')],
    ['Useful themed lists', themes]
  ];
  const cards = groups.map(([title,items])=>`<section class="finder-link-group"><h2>${title}</h2><div class="related-links">${items.map(x=>`<a href="/${x.slug}/">${esc(x.title)}</a>`).join('')}</div></section>`).join('');
  const schema=JSON.stringify({'@context':'https://schema.org','@type':'WebApplication',name:'Five Letter Word Finder',url:`${site}/5-letter-words/`,applicationCategory:'GameApplication',operatingSystem:'Any',offers:{'@type':'Offer',price:'0',priceCurrency:'USD'},description});
  return `${head({title:'5 Letter Word Finder – Search by Position, Start, End and Letters',description,slug:'5-letter-words',schema})}<body>${nav()}<main id="main"><section class="tool-hero shell"><p class="eyebrow">Fast, flexible word search</p><h1>5 Letter Word Finder</h1><p>${esc(description)} Searches run in your browser and require no account.</p></section><section class="shell five-finder" id="finder"><form class="finder-panel" id="fiveFinder"><div class="finder-heading"><div><p class="kicker">Enter what you know</p><h2>Build your pattern</h2></div><button class="secondary-button" id="finderReset" type="reset">Reset</button></div><fieldset><legend>Known positions</legend><div class="position-inputs" aria-label="Five letter positions">${[1,2,3,4,5].map(n=>`<label><span>${n}</span><input maxlength="1" inputmode="text" pattern="[A-Za-z]" aria-label="Letter in position ${n}"></label>`).join('')}</div></fieldset><div class="finder-fields"><label>Starts with<input id="fiveStarts" maxlength="5" placeholder="ST"></label><label>Ends with<input id="fiveEnds" maxlength="5" placeholder="ER"></label><label>Must contain<input id="fiveContains" maxlength="5" placeholder="AOR"></label><label>Exclude letters<input id="fiveExclude" maxlength="26" placeholder="BCDF"></label></div><button class="primary-button" type="submit">Find matching words</button><p class="finder-note">Required letters respect repeated counts. For example, entering EE requires two Es.</p></form><section class="finder-results" aria-live="polite"><div class="finder-heading"><div><p class="kicker">Results</p><h2><span id="fiveCount">${five.length.toLocaleString('en-US')}</span> words</h2></div><button class="secondary-button" id="fiveCopy" type="button">Copy results</button></div><p id="fiveMessage" class="message">Enter one or more clues, then search.</p><ul id="fiveResults" class="seo-word-grid">${examples(five,80)}</ul><button id="fiveMore" class="show-more" type="button">Show more</button></section></section><section class="content-section shell"><div class="section-heading"><p class="eyebrow">Browse proven search paths</p><h2>Popular five-letter word lists</h2><p class="lead">These pages combine a real result list with practical guidance and links back to the finder.</p></div><div class="finder-groups">${cards}</div></section><section class="content-section shell tool-copy"><div class="section-heading"><p class="eyebrow">A repeatable method</p><h2>How to narrow five-letter words</h2></div><div class="steps-grid"><article><span>1</span><h3>Lock known positions</h3><p>Place confirmed letters in boxes 1–5. Leave unknown boxes empty.</p></article><article><span>2</span><h3>Add required letters</h3><p>Enter letters known to occur elsewhere, including repeats when confirmed.</p></article><article><span>3</span><h3>Exclude carefully</h3><p>Remove ruled-out letters, then use clue meaning or game rules to choose.</p></article></div></section></main>${foot()}<script>window.LETTERTOOLKIT_FIVE=${JSON.stringify(five)};</script><script src="/five-letter-finder.js?v=7.0"></script><script src="/theme.js?v=4.1.0"></script><script src="/integrations.js?v=4.1.0"></script></body></html>`;
}

function write(rel, content) { const file=path.join(root,rel); fs.mkdirSync(path.dirname(file),{recursive:true}); fs.writeFileSync(file,content); }
for (const spec of [...patterns,...themes]) write(`${spec.slug}/index.html`, landing(spec));
write('5-letter-words/index.html', hub());

// Keep the main product grid connected to the new search hub. The replacement
// is idempotent so the generator can be run safely on future releases.
const homePath = path.join(root,'index.html');
let home = fs.readFileSync(homePath,'utf8');
if (!home.includes('href="/5-letter-words/"')) {
  const marker = '<a class="tool-card" href="/crossword-solver/">';
  const card = '<a class="tool-card" href="/5-letter-words/"><span>NEW</span><h3>5 Letter Word Finder</h3><p>Search by exact position, beginning, ending, required letters and exclusions.</p><b>Find five-letter words →</b></a>';
  home = home.replace(marker, card + marker);
  fs.writeFileSync(homePath,home);
}

function urlsFromDirs() {
  return fs.readdirSync(root,{withFileTypes:true}).filter(x=>x.isDirectory()&&fs.existsSync(path.join(root,x.name,'index.html'))).map(x=>`/${x.name}/`).sort();
}
function isIndexable(route) {
  const file = route === '/' ? path.join(root,'index.html') : path.join(root,route,'index.html');
  if (!fs.existsSync(file)) return false;
  return !/<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(fs.readFileSync(file,'utf8'));
}
const allDirs = urlsFromDirs();
const toolNames = ['word-unscrambler','anagram-solver','word-finder','wordle-helper','crossword-solver','crossword-answer-finder','scrabble-helper','rhyme-finder','random-word-generator','word-generator','writer','cv-builder','application-builder'];
const staticNames = ['','about','contact','privacy','terms','how-it-works'];
const careerNames = ['how-to-write-a-cv','cv-examples','cv-template','how-to-write-a-job-application','job-application-examples','cover-letter','interview-questions'];
const guideDirs = fs.readdirSync(path.join(root,'guides'),{withFileTypes:true}).filter(x=>x.isDirectory()&&fs.existsSync(path.join(root,'guides',x.name,'index.html'))).map(x=>`/guides/${x.name}/`).filter(isIndexable);
const wordDirs = fs.readdirSync(path.join(root,'word'),{withFileTypes:true}).filter(x=>x.isDirectory()&&fs.existsSync(path.join(root,'word',x.name,'index.html'))).map(x=>`/word/${x.name}/`).filter(isIndexable);
const excluded = new Set([...toolNames.map(x=>`/${x}/`),...staticNames.filter(Boolean).map(x=>`/${x}/`),...careerNames.map(x=>`/${x}/`),'/guides/','/frontend/']);
const listDirs = allDirs.filter(x=>!excluded.has(x)&&!x.startsWith('/word/')&&isIndexable(x));
const xml = entries => `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.map(u=>`  <url><loc>${site}${u}</loc></url>`).join('\n')}\n</urlset>\n`;
write('sitemap-static.xml',xml(['/'].concat(staticNames.filter(Boolean).map(x=>`/${x}/`))));
write('sitemap-tools.xml',xml(toolNames.map(x=>`/${x}/`).filter(isIndexable)));
write('sitemap-guides.xml',xml(['/guides/',...guideDirs,...careerNames.map(x=>`/${x}/`).filter(isIndexable)]));
write('sitemap-word-lists.xml',xml(listDirs));
write('sitemap-words.xml',xml(['/word/',...wordDirs].filter(isIndexable)));
write('sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${['static','tools','guides','word-lists','words'].map(n=>`  <sitemap><loc>${site}/sitemap-${n}.xml</loc></sitemap>`).join('\n')}\n</sitemapindex>\n`);
write('growth-pages-report.json',JSON.stringify({generatedAt:new Date().toISOString(),dictionaryFiveLetterWords:five.length,patternPages:patterns.map(x=>({slug:x.slug,count:listFor(x).length})),themePages:themes.map(x=>({slug:x.slug,count:listFor(x).length})),sitemaps:{static:staticNames.length,tools:toolNames.length,guides:guideDirs.length+1,wordLists:listDirs.length,words:wordDirs.length+1}},null,2));
console.log(`Generated ${patterns.length} pattern pages, ${themes.length} themed pages and 5 sitemaps.`);
