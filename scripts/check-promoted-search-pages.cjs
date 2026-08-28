#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const site = 'https://lettertoolkit.com';
const promotedRoutes = [
  '/words-that-start-with-a/',
  '/6-letter-words/',
  '/random-word-generator/',
  '/words-that-end-with-in/'
];
const sitemapFiles = [
  'sitemap-static.xml',
  'sitemap-tools.xml',
  'sitemap-guides.xml',
  'sitemap-word-lists.xml',
  'sitemap-words.xml'
];
const sitemapText = sitemapFiles
  .filter(file => fs.existsSync(path.join(root, file)))
  .map(file => fs.readFileSync(path.join(root, file), 'utf8'))
  .join('\n');
const failures = [];

for (const route of promotedRoutes) {
  const file = path.join(root, route.replace(/^\//, ''), 'index.html');
  if (!fs.existsSync(file)) {
    failures.push(`${route}: page is missing`);
    continue;
  }
  const html = fs.readFileSync(file, 'utf8');
  if (/noindex/i.test((html.match(/<meta[^>]+name=["']robots["'][^>]*>/i) || [''])[0])) {
    failures.push(`${route}: promoted page is noindex`);
  }
  const canonical = (html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i) || html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i) || [])[1];
  if (canonical !== site + route) {
    failures.push(`${route}: expected self-canonical ${site + route}, found ${canonical || 'none'}`);
  }
  if (!sitemapText.includes(`<loc>${site + route}</loc>`)) {
    failures.push(`${route}: promoted page is missing from child sitemaps`);
  }
}

if (failures.length) {
  console.error('Promoted search page checks failed:\n- ' + failures.join('\n- '));
  process.exit(1);
}
console.log(`Promoted search page checks passed for ${promotedRoutes.length} routes.`);
