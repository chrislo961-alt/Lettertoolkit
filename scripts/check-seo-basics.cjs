#!/usr/bin/env node
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const ignored=new Set(['.git','.github','node_modules','frontend','functions']);
const pages=[];
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(ignored.has(e.name))continue;const f=path.join(dir,e.name);if(e.isDirectory())walk(f);else if(e.isFile()&&e.name==='index.html')pages.push(f);}}
walk(root);
const failures=[],titles=new Map();
for(const file of pages){const html=fs.readFileSync(file,'utf8');const rel=path.relative(root,file).replace(/\\/g,'/');const route=rel==='index.html'?'/':'/'+rel.replace(/\/index\.html$/,'')+'/';const noindex=/noindex/i.test((html.match(/<meta[^>]+name=["']robots["'][^>]*>/i)||[''])[0]);if(noindex)continue;const title=(html.match(/<title>([^<]+)<\/title>/i)||[])[1]?.trim();const canonical=(html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)||html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i)||[])[1];const h1=(html.match(/<h1\b[^>]*>/gi)||[]).length;if(!title)failures.push(`${route}: missing title`);else{const arr=titles.get(title)||[];arr.push(route);titles.set(title,arr);}if(!canonical)failures.push(`${route}: missing canonical`);if(h1!==1)failures.push(`${route}: expected 1 H1, found ${h1}`);}
for(const [title,routes] of titles){if(routes.length>1)failures.push(`Duplicate title: ${title} -> ${routes.join(', ')}`);}
console.log(`SEO basics audit: ${pages.length} HTML pages checked`);if(failures.length){console.error('\nFAILURES\n- '+failures.join('\n- '));process.exit(1);}console.log('SEO basics audit passed.');