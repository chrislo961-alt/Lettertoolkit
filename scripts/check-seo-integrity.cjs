#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const origin = 'https://lettertoolkit.com';
const childSitemaps = [
  'sitemap-static.xml',
  'sitemap-tools.xml',
  'sitemap-guides.xml',
  'sitemap-word-lists.xml',
  'sitemap-words.xml',
];
const edgeManagedRoutes = new Set(['/cv-builder/']);
const retiredAliases = new Set([
  '/crossword-answer-finder/',
  '/word-generator/',
  '/words-with-q/',
  '/words-with-x/',
  '/words-with-z/',
  '/5-letter-words-containing-q/',
  '/words-ending-in-ing/',
  '/words-ending-in-ed/',
  '/words-ending-in-ly/',
  '/words-ending-in-er/',
  '/words-ending-in-tion/',
]);

function routeToFile(route) {
  return route === '/'
    ? path.join(root, 'index.html')
    : path.join(root, route.replace(/^\//, '').replace(/\/$/, ''), 'index.html');
}

function match(html, pattern) {
  return html.match(pattern)?.[1]?.trim() || null;
}

function normalizeInternal(href, baseRoute) {
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return null;
  try {
    const url = new URL(href, origin + baseRoute);
    if (url.origin !== origin) return null;
    let pathname = url.pathname.replace(/\/index\.html$/, '/');
    if (!path.extname(pathname) && !pathname.endsWith('/')) pathname += '/';
    return pathname;
  } catch {
    return null;
  }
}

const failures = [];
const warnings = [];

const indexXml = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
for (const file of childSitemaps) {
  if (!indexXml.includes(`${origin}/${file}`)) failures.push(`sitemap.xml missing child sitemap: ${file}`);
  if (!fs.existsSync(path.join(root, file))) failures.push(`Missing child sitemap file: ${file}`);
}

const sitemapRoutes = [];
for (const file of childSitemaps) {
  const filePath = path.join(root, file);
  if (!fs.existsSync(filePath)) continue;
  const xml = fs.readFileSync(filePath, 'utf8');
  for (const result of xml.matchAll(/<loc>(https:\/\/lettertoolkit\.com[^<]*)<\/loc>/g)) {
    const url = new URL(result[1]);
    sitemapRoutes.push(url.pathname.endsWith('/') || path.extname(url.pathname) ? url.pathname : `${url.pathname}/`);
  }
}

const uniqueRoutes = new Set(sitemapRoutes);
if (uniqueRoutes.size !== sitemapRoutes.length) failures.push('Duplicate URL found across child sitemaps');
if (sitemapRoutes.length < 80) failures.push(`Curated sitemap unexpectedly small: ${sitemapRoutes.length} URLs`);

const canonicalOwners = new Map();
for (const route of uniqueRoutes) {
  const file = routeToFile(route);
  if (!fs.existsSync(file)) {
    failures.push(`Sitemap route missing index.html: ${route}`);
    continue;
  }

  const html = fs.readFileSync(file, 'utf8');
  const robots = match(html, /<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)["']/i)
    || match(html, /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']robots["']/i)
    || '';
  if (/noindex/i.test(robots)) failures.push(`Sitemap route is noindex: ${route}`);

  const title = match(html, /<title>([^<]+)<\/title>/i);
  if (!title) failures.push(`Missing title: ${route}`);

  const description = match(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
    || match(html, /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
  if (!description) warnings.push(`Missing meta description: ${route}`);

  const h1Count = (html.match(/<h1\b[^>]*>/gi) || []).length;
  if (!edgeManagedRoutes.has(route) && h1Count !== 1) failures.push(`Expected exactly one H1 on ${route}, found ${h1Count}`);

  const canonical = match(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)
    || match(html, /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i);
  if (!edgeManagedRoutes.has(route)) {
    const expected = origin + route;
    if (!canonical) failures.push(`Missing canonical: ${route}`);
    else if (canonical !== expected) failures.push(`Non-self canonical: ${route} -> ${canonical}`);
  }
  if (canonical) {
    const owners = canonicalOwners.get(canonical) || [];
    owners.push(route);
    canonicalOwners.set(canonical, owners);
  }

  for (const result of html.matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)) {
    const target = normalizeInternal(result[1], route);
    if (!target) continue;
    if (retiredAliases.has(target)) failures.push(`Internal link points at retired alias: ${route} -> ${target}`);
  }
}

for (const [canonical, routes] of canonicalOwners) {
  if (routes.length > 1) failures.push(`Canonical collision: ${canonical} used by ${routes.join(', ')}`);
}

const robotsPath = path.join(root, 'robots.txt');
if (!fs.existsSync(robotsPath)) failures.push('robots.txt missing');
else {
  const robots = fs.readFileSync(robotsPath, 'utf8');
  if (!robots.includes(`Sitemap: ${origin}/sitemap.xml`)) failures.push('robots.txt missing canonical sitemap declaration');
}

console.log(`SEO integrity gate: ${sitemapRoutes.length} sitemap URLs checked across ${childSitemaps.length} child sitemaps.`);
if (warnings.length) console.log(`\nWARNINGS\n- ${warnings.join('\n- ')}`);
if (failures.length) {
  console.error(`\nFAILURES\n- ${failures.join('\n- ')}`);
  process.exit(1);
}
console.log('SEO integrity gate passed.');
