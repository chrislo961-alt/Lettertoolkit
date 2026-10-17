#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const origin = 'https://lettertoolkit.com';
const failures = [];
const warnings = [];
const uniqueFailures = new Set();
function fail(message) { uniqueFailures.add(message); }

function decodeEntities(value) {
  return value.replace(/&(?:amp|quot|apos|lt|gt|#\d+|#x[\da-f]+);/gi, entity => {
    const named = { '&amp;': '&', '&quot;': '"', '&apos;': "'", '&lt;': '<', '&gt;': '>' };
    if (named[entity.toLowerCase()]) return named[entity.toLowerCase()];
    const hex = /^&#x/i.test(entity);
    const number = parseInt(entity.slice(hex ? 3 : 2, -1), hex ? 16 : 10);
    return number <= 0x10ffff ? String.fromCodePoint(number) : entity;
  });
}

function attributes(tag) {
  const result = {};
  const body = tag.replace(/^<\/?[\w:-]+/, '').replace(/\/?\s*>$/, '');
  for (const match of body.matchAll(/([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>]+)))?/g)) {
    result[match[1].toLowerCase()] = decodeEntities(match[2] ?? match[3] ?? match[4] ?? '');
  }
  return result;
}

function parseHtml(html) {
  // JavaScript strings, templates and editable document examples are not source-page links.
  const source = html.replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style|textarea|template)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '');
  const links = [];
  const ids = new Set();
  let robots = '';
  let canonical = null;
  let ignoredTag = null;
  let ignoredDepth = 0;
  for (const match of source.matchAll(/<\/?([a-z][\w:-]*)\b(?:[^>"']|"[^"]*"|'[^']*')*>/gi)) {
    const tag = match[1].toLowerCase();
    const closing = /^<\//.test(match[0]);
    if (ignoredDepth) {
      if (tag === ignoredTag) ignoredDepth += closing ? -1 : 1;
      continue;
    }
    if (closing) continue;
    const attrs = attributes(match[0]);
    if (attrs.id) ids.add(attrs.id);
    if (tag === 'a' && attrs.name) ids.add(attrs.name);
    if ('contenteditable' in attrs && attrs.contenteditable.toLowerCase() !== 'false') {
      ignoredTag = tag;
      ignoredDepth = 1;
      continue;
    }
    if (tag === 'a' && 'href' in attrs) links.push(attrs.href);
    if (tag === 'meta' && /^(robots|googlebot)$/i.test(attrs.name || '')) robots += ' ' + (attrs.content || '');
    if (tag === 'link' && (attrs.rel || '').toLowerCase().split(/\s+/).includes('canonical')) canonical = attrs.href || null;
  }
  return { links, ids, robots, canonical };
}

function locations(xml) {
  return [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map(match => decodeEntities(match[1]));
}

// Read the published sitemap index, not abandoned child sitemap files still in the repository.
const indexXml = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
const childFiles = [];
const sitemapRoutes = new Set();
const routesBySitemap = new Map();
for (const location of locations(indexXml)) {
  const url = new URL(location);
  if (url.origin !== origin || !/^\/sitemap-[^/]+\.xml$/.test(url.pathname) || url.search || url.hash) {
    fail('Invalid child sitemap location: ' + location);
    continue;
  }
  const filename = url.pathname.slice(1);
  if (childFiles.includes(filename)) { fail('Duplicate child sitemap: ' + filename); continue; }
  childFiles.push(filename);
  const file = path.join(root, filename);
  if (!fs.existsSync(file)) { fail('Missing active child sitemap: ' + filename); continue; }
  const routes = new Set();
  for (const location of locations(fs.readFileSync(file, 'utf8'))) {
    const url = new URL(location);
    if (url.origin !== origin || url.search || url.hash || !url.pathname.endsWith('/')) {
      fail('Non-canonical sitemap URL: ' + location);
      continue;
    }
    if (sitemapRoutes.has(url.pathname)) fail('Duplicate URL in active sitemaps: ' + location);
    sitemapRoutes.add(url.pathname);
    routes.add(url.pathname);
  }
  routesBySitemap.set(filename, routes);
}
if (!childFiles.length || !sitemapRoutes.size) fail('The active sitemap tree is empty');

// Read retired routes and aliases from the actual edge policy to avoid a second stale list.
const middleware = fs.readFileSync(path.join(root, 'functions', '_middleware.js'), 'utf8');
const retiredBlock = middleware.match(/const retiredCareerRoutes = new Set\(\[([\s\S]*?)\]\);/)?.[1];
const redirectBlock = middleware.match(/const permanentRouteRedirects = new Map\(\[([\s\S]*?)\]\);/)?.[1];
if (!retiredBlock || !redirectBlock) fail('Cannot read the middleware retirement/redirect policy');
const normalizeRoute = pathname => pathname.replace(/\/index\.html$/, '/').replace(/\/?$/, '/');
const retiredRoutes = new Set([...String(retiredBlock || '').matchAll(/'([^']+)'/g)].map(match => normalizeRoute(match[1])));
const redirectRoutes = new Set([...String(redirectBlock || '').matchAll(/\[\s*'([^']+)'\s*,/g)].map(match => normalizeRoute(match[1])));
function runtimeNoindex(route) {
  if (route === '/5-letter-words/') return false;
  return route === '/frontend/' || route === '/word/' || route === '/high-scoring-5-letter-words/'
    || /^\/word\/[^/]+\/$/i.test(route)
    || /^\/\d+-letter-words(?:-[^/]+)?\/$/i.test(route)
    || /^\/words-(?:that-)?(?:start|end|contain)[^/]*\/$/i.test(route)
    || /^\/words-with-[^/]+\/$/i.test(route)
    || /^\/5-letter-(?:palindromes|words-(?:containing|ending|starting|with|without)[^/]*)\/$/i.test(route);
}

const parsedFiles = new Map();
function findFile(pathname) {
  let decoded;
  try { decoded = decodeURIComponent(pathname); } catch { return null; }
  const candidate = path.resolve(root, '.' + decoded);
  if (candidate !== root && !candidate.startsWith(root + path.sep)) return null;
  if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  const index = path.join(candidate, 'index.html');
  return fs.existsSync(index) && fs.statSync(index).isFile() ? index : null;
}
function readPage(file) {
  if (!parsedFiles.has(file)) parsedFiles.set(file, parseHtml(fs.readFileSync(file, 'utf8')));
  return parsedFiles.get(file);
}
function routeForFile(file) {
  const relative = path.relative(root, file).split(path.sep).join('/');
  if (relative === 'index.html') return '/';
  return relative.endsWith('/index.html') ? '/' + relative.slice(0, -10) : '/' + relative;
}

const pages = new Map();
for (const route of sitemapRoutes) {
  const file = findFile(route);
  if (!file) { fail('Sitemap URL has no HTML file: ' + route); continue; }
  const page = readPage(file);
  pages.set(route, page);
  if (/noindex/i.test(page.robots) || runtimeNoindex(route) || retiredRoutes.has(route) || redirectRoutes.has(route)) {
    fail('Active sitemap URL is excluded by source or runtime policy: ' + route);
  }
  if (page.canonical !== origin + route) fail('Sitemap URL must have a self canonical: ' + route + ' -> ' + page.canonical);
}

const graph = new Map([...pages.keys()].map(route => [route, new Set()]));
const inbound = new Map([...pages.keys()].map(route => [route, new Set()]));
let anchorCount = 0;
let brokenPaths = 0;
let brokenFragments = 0;
for (const [route, page] of pages) {
  for (const href of page.links) {
    if (!href || /^(?:mailto|tel|javascript|data|blob):/i.test(href)) continue;
    let url;
    try { url = new URL(href, origin + route); } catch { fail('Invalid internal href on ' + route + ': ' + href); continue; }
    if (url.origin !== origin) continue;
    anchorCount += 1;
    const normalized = normalizeRoute(url.pathname);
    if (retiredRoutes.has(normalized) || redirectRoutes.has(normalized)) {
      fail('Internal link points at a retired route or redirect: ' + route + ' -> ' + href);
      continue;
    }
    const file = findFile(url.pathname);
    if (!file) {
      brokenPaths += 1;
      fail('Internal link target does not exist: ' + route + ' -> ' + href);
      continue;
    }
    // Real downloads (for example LICENSES.md) do not need an invented index.html.
    if (!/\.html?$/i.test(file)) continue;
    const target = routeForFile(file);
    if (pages.has(target)) {
      graph.get(route).add(target);
      if (target !== route) inbound.get(target).add(route);
    }
    if (url.hash) {
      let fragment;
      try { fragment = decodeURIComponent(url.hash.slice(1)); } catch { fragment = url.hash.slice(1); }
      if (!readPage(file).ids.has(fragment)) {
        brokenFragments += 1;
        fail('Internal fragment target does not exist: ' + route + ' -> ' + href);
      }
    }
  }
}

const depth = new Map(pages.has('/') ? [['/', 0]] : []);
const queue = pages.has('/') ? ['/'] : [];
for (let position = 0; position < queue.length; position += 1) {
  const route = queue[position];
  for (const target of graph.get(route)) {
    if (!depth.has(target)) { depth.set(target, depth.get(route) + 1); queue.push(target); }
  }
}
const orphans = [];
const unreachable = [];
const nearOrphans = [];
for (const route of pages.keys()) {
  const sources = inbound.get(route);
  if (route !== '/' && !sources.size) { orphans.push(route); fail('Curated page has no incoming source HTML link: ' + route); }
  else if (route !== '/' && sources.size === 1) { nearOrphans.push(route); warnings.push('One incoming source page: ' + route + ' <- ' + [...sources][0]); }
  if (!depth.has(route)) { unreachable.push(route); fail('Curated page is not reachable from the homepage in source HTML: ' + route); }
  else if (depth.get(route) > 4) warnings.push('Deep curated page (' + depth.get(route) + ' clicks): ' + route);
}

for (const [filename, hub] of [['sitemap-tools.xml', '/tools/'], ['sitemap-guides.xml', '/guides/']]) {
  const routes = routesBySitemap.get(filename);
  if (!routes) { fail('Active sitemap is missing the curated directory: ' + filename); continue; }
  for (const route of routes) {
    if (route !== hub && !graph.get(hub)?.has(route)) fail('Directory is missing a static HTML link: ' + hub + ' -> ' + route);
  }
}

const summary = {
  activeChildSitemaps: childFiles.length,
  curatedSitemapUrls: sitemapRoutes.size,
  curatedHtmlPages: pages.size,
  internalSourceAnchors: anchorCount,
  orphanPages: orphans.length,
  nearOrphans: nearOrphans.length,
  unreachablePages: unreachable.length,
  maximumDepth: depth.size ? Math.max(...depth.values()) : null,
  brokenPaths,
  brokenFragments
};
console.log('Curated source HTML link audit (middleware and browser-injected links excluded): ' + JSON.stringify(summary, null, 2));
if (warnings.length) console.log('\nWARNINGS\n- ' + warnings.join('\n- '));
failures.push(...uniqueFailures);
if (failures.length) {
  console.error('\nFAILURES\n- ' + failures.join('\n- '));
  process.exit(1);
}
console.log('Curated source HTML link audit passed.');
