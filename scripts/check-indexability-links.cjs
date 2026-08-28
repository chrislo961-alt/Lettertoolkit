#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const site = 'https://lettertoolkit.com';
const ignoredDirs = new Set(['.git', '.github', 'node_modules', 'frontend', 'functions']);
const aliasPaths = new Set([
  '/crossword-answer-finder/','/word-generator/','/words-with-q/','/words-with-x/','/words-with-z/',
  '/5-letter-words-containing-q/','/words-ending-in-ing/','/words-ending-in-ed/','/words-ending-in-ly/',
  '/words-ending-in-er/','/words-ending-in-tion/'
]);

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, {withFileTypes:true})) {
    if (ignoredDirs.has(ent.name)) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full, out);
    else if (ent.isFile() && ent.name === 'index.html') out.push(full);
  }
  return out;
}
function routeFor(file) {
  const rel = path.relative(root, file).replace(/\\/g,'/');
  if (rel === 'index.html') return '/';
  return '/' + rel.replace(/\/index\.html$/, '') + '/';
}
function normalizeInternal(href, baseRoute) {
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return null;
  try {
    const u = new URL(href, site + baseRoute);
    if (u.origin !== site) return null;
    let p = u.pathname.replace(/\/index\.html$/, '/');
    if (!path.extname(p) && !p.endsWith('/')) p += '/';
    return p;
  } catch { return null; }
}
function matchAll(re, text) { return [...text.matchAll(re)]; }

const pages = new Map();
for (const file of walk(root)) {
  const html = fs.readFileSync(file,'utf8');
  const route = routeFor(file);
  const noindex = /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(html) || /<meta[^>]+content=["'][^"']*noindex[^"']*["'][^>]+name=["']robots["']/i.test(html);
  const canonicalMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i) || html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i);
  const canonical = canonicalMatch ? canonicalMatch[1] : null;
  const hrefs = matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi, html).map(m=>m[1]);
  const links = hrefs.map(h=>normalizeInternal(h, route)).filter(Boolean);
  pages.set(route,{file,html,noindex,canonical,links});
}

const sitemapFiles = ['sitemap-static.xml','sitemap-tools.xml','sitemap-guides.xml','sitemap-word-lists.xml','sitemap-words.xml'];
const sitemapRoutes = new Set();
for (const sm of sitemapFiles) {
  const fp = path.join(root, sm);
  if (!fs.existsSync(fp)) continue;
  const xml = fs.readFileSync(fp,'utf8');
  for (const m of matchAll(/<loc>https:\/\/lettertoolkit\.com([^<]*)<\/loc>/g, xml)) sitemapRoutes.add(m[1] || '/');
}

const failures=[]; const warnings=[];
const inbound = new Map([...pages.keys()].map(r=>[r,0]));
for (const [route,p] of pages) {
  for (const target of p.links) {
    if (aliasPaths.has(target)) warnings.push(`Internal link uses retired alias: ${route} -> ${target}`);
    if (pages.has(target)) inbound.set(target,(inbound.get(target)||0)+1);
    else if (!target.startsWith('/assets/') && !target.startsWith('/icons/') && !target.startsWith('/api/')) {
      const candidate = path.join(root,target.replace(/^\//,'').replace(/\/$/,'') ,'index.html');
      if (!fs.existsSync(candidate)) warnings.push(`Internal HTML link target not found in repo: ${route} -> ${target}`);
    }
  }
  if (!p.noindex) {
    const expected = site + route;
    if (!p.canonical) failures.push(`Indexable page missing canonical: ${route}`);
    else if (p.canonical !== expected) warnings.push(`Non-self canonical: ${route} -> ${p.canonical}`);
  }
}
for (const route of sitemapRoutes) {
  const p = pages.get(route);
  if (!p) failures.push(`Sitemap URL has no index.html: ${route}`);
  else if (p.noindex) failures.push(`Noindex URL present in sitemap: ${route}`);
}
for (const [route,p] of pages) {
  if (!p.noindex && !sitemapRoutes.has(route) && route !== '/404/') warnings.push(`Indexable page missing from child sitemaps: ${route}`);
}

// Crawl depth from homepage using crawlable internal hrefs.
const depth = new Map([['/',0]]); const q=['/'];
while(q.length){ const cur=q.shift(); const d=depth.get(cur); const p=pages.get(cur); if(!p) continue; for(const t of p.links){ if(pages.has(t)&&!depth.has(t)){depth.set(t,d+1);q.push(t);} } }
for (const [route,p] of pages) {
  if (p.noindex) continue;
  const inb=inbound.get(route)||0;
  if (route !== '/' && inb === 0) warnings.push(`Orphan indexable page: ${route}`);
  else if (route !== '/' && inb === 1) warnings.push(`Near-orphan indexable page (1 inbound): ${route}`);
  if (!depth.has(route)) warnings.push(`Not crawl-reachable from homepage: ${route}`);
  else if (depth.get(route) > 4) warnings.push(`Deep indexable page (${depth.get(route)} clicks): ${route}`);
}

const summary = {
  htmlPages: pages.size,
  indexablePages: [...pages.values()].filter(p=>!p.noindex).length,
  sitemapUrls: sitemapRoutes.size,
  orphanPages: warnings.filter(x=>x.startsWith('Orphan ')).length,
  nearOrphans: warnings.filter(x=>x.startsWith('Near-orphan')).length,
  unreachable: warnings.filter(x=>x.startsWith('Not crawl')).length,
  deepPages: warnings.filter(x=>x.startsWith('Deep ')).length,
  aliasLinks: warnings.filter(x=>x.includes('retired alias')).length,
  missingSitemap: warnings.filter(x=>x.includes('missing from child sitemaps')).length
};
console.log('Indexability/link audit summary:', JSON.stringify(summary,null,2));
if (warnings.length) console.log('\nWARNINGS\n- '+warnings.join('\n- '));
if (failures.length) { console.error('\nFAILURES\n- '+failures.join('\n- ')); process.exit(1); }
