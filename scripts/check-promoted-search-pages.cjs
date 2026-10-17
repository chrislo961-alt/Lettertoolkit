#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const site = 'https://lettertoolkit.com';
// Protect the current text-tool focus. Programmatic word lists intentionally remain noindex.
const promotedRoutes = [
  '/',
  '/tools/',
  '/word-counter/',
  '/text-analyzer/',
  '/character-counter/',
  '/text-cleaner/',
  '/word-frequency-counter/'
];
const failures = [];
const sitemapUrls = new Set();
const indexXml = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
const childLocations = [...indexXml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map(match => match[1]);
for (const location of childLocations) {
  const url = new URL(location);
  if (url.origin !== site || !/^\/sitemap-[^/]+\.xml$/.test(url.pathname) || url.search || url.hash) {
    failures.push('Invalid active child sitemap: ' + location);
    continue;
  }
  const file = path.join(root, url.pathname.slice(1));
  if (!fs.existsSync(file)) { failures.push('Missing active child sitemap: ' + location); continue; }
  const xml = fs.readFileSync(file, 'utf8');
  for (const match of xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)) sitemapUrls.add(match[1]);
}
if (!childLocations.length) failures.push('The active sitemap index is empty');

for (const route of promotedRoutes) {
  const file = path.join(root, route.replace(/^\//, ''), 'index.html');
  if (!fs.existsSync(file)) { failures.push(route + ': page is missing'); continue; }
  const html = fs.readFileSync(file, 'utf8');
  const robotsTags = [...html.matchAll(/<meta\b[^>]*>/gi)]
    .map(match => match[0])
    .filter(tag => /\bname=["'](?:robots|googlebot)["']/i.test(tag));
  if (robotsTags.some(tag => /\bcontent=["'][^"']*noindex/i.test(tag))) {
    failures.push(route + ': promoted page is noindex');
  }
  const canonical = (html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)
    || html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i) || [])[1];
  if (canonical !== site + route) failures.push(route + ': expected self-canonical ' + site + route + ', found ' + (canonical || 'none'));
  if (!sitemapUrls.has(site + route)) failures.push(route + ': promoted page is missing from the active sitemap tree');
}

if (failures.length) {
  console.error('Promoted text-tool checks failed:\n- ' + failures.join('\n- '));
  process.exit(1);
}
console.log('Promoted text-tool checks passed for ' + promotedRoutes.length + ' current routes across ' + childLocations.length + ' active child sitemaps.');
