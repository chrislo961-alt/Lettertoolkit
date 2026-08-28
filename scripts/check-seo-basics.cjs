#!/usr/bin/env node
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const routes=['/','/word-unscrambler/','/anagram-solver/','/word-finder/','/5-letter-words/','/crossword-solver/','/wordle-helper/','/scrabble-helper/','/random-word-generator/','/rhyme-finder/','/word-lists/'];
const failures=[],titles=new Map();
for(const route of routes){
  const file=route==='/'?path.join(root,'index.html'):path.join(root,route.slice(1),'index.html');
  if(!fs.existsSync(file)){failures.push(`${route}: missing index.html`);continue;}
  const html=fs.readFileSync(file,'utf8');
  const title=(html.match(/<title>([^<]+)<\/title>/i)||[])[1]?.trim();
  const canonical=(html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)||html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i)||[])[1];
  const h1=(html.match(/<h1\b[^>]*>/gi)||[]).length;
  if(!title)failures.push(`${route}: missing title`);else{const arr=titles.get(title)||[];arr.push(route);titles.set(title,arr);}
  const expected='https://lettertoolkit.com'+route;
  if(!canonical)failures.push(`${route}: missing canonical`);else if(canonical!==expected)failures.push(`${route}: canonical ${canonical} != ${expected}`);
  if(h1!==1)failures.push(`${route}: expected 1 H1, found ${h1}`);
}
for(const [title,routesForTitle] of titles){if(routesForTitle.length>1)failures.push(`Duplicate title: ${title} -> ${routesForTitle.join(', ')}`);}
console.log(`SEO basics audit: ${routes.length} flagship routes checked`);
if(failures.length){console.error('\nFAILURES\n- '+failures.join('\n- '));process.exit(1);}
console.log('SEO basics audit passed.');