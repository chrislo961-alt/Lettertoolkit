#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const retired = new Set(['generate-seo-pages.js', 'generate-word-explorer.js']);
const deprecatedRoutes = [
  '/words-with-q/',
  '/words-with-x/',
  '/words-with-z/',
  '/5-letter-words-containing-q/',
  '/words-ending-in-ing/',
  '/words-ending-in-ed/',
  '/words-ending-in-ly/',
  '/words-ending-in-er/',
  '/words-ending-in-tion/',
];

const generatorFiles = fs.readdirSync(root)
  .filter(name => /^generate-.*\.js$/.test(name))
  .sort();

const failures = [];

for (const name of generatorFiles) {
  const source = fs.readFileSync(path.join(root, name), 'utf8');

  for (const route of deprecatedRoutes) {
    const bare = route.replace(/^\//, '').replace(/\/$/, '');
    const quotedOrPath = [
      `'${bare}'`, `"${bare}"`, `'/${bare}/'`, `"/${bare}/"`,
      `\`${bare}\``, `\`/${bare}/\``
    ];
    if (quotedOrPath.some(token => source.includes(token))) {
      failures.push(`${name} references deprecated route: ${route}`);
    }
  }

  if (!retired.has(name) && name !== 'generate-growth-pages.js') {
    const writesRootSitemap = /(?:writeFileSync|writeFile|appendFileSync|appendFile)\s*\([^\n]*sitemap\.xml/.test(source) ||
      /path\.join\([^\n]*['"]sitemap\.xml['"]/.test(source);
    if (writesRootSitemap) {
      failures.push(`${name} appears able to write root sitemap.xml; generators must target child sitemaps only`);
    }
  }
}

for (const name of retired) {
  const retiredPath = path.join(root, name);
  if (!fs.existsSync(retiredPath)) {
    failures.push(`${name} sentinel is missing`);
    continue;
  }
  const source = fs.readFileSync(retiredPath, 'utf8');
  if (!source.includes('RETIRED GENERATOR')) failures.push(`${name} is missing its retired marker`);
  if (!source.includes('process.exitCode = 1')) failures.push(`${name} must fail closed when invoked`);
  if (/require\(['"]fs['"]\)|from ['"](?:node:)?fs['"]|writeFile(?:Sync)?|appendFile(?:Sync)?|mkdirSync|renameSync|rmSync|unlinkSync/.test(source)) {
    failures.push(`${name} must remain non-writing`);
  }
}

const growthPath = path.join(root, 'generate-growth-pages.js');
if (fs.existsSync(growthPath)) {
  const source = fs.readFileSync(growthPath, 'utf8');
  if (!source.includes('<sitemapindex')) {
    failures.push('generate-growth-pages.js may write root sitemap.xml only as a sitemap index');
  }
}

if (failures.length) {
  console.error('Generator safety check failed:\n- ' + failures.join('\n- '));
  process.exit(1);
}

console.log(`Generator safety OK: checked ${generatorFiles.length} top-level generators.`);
