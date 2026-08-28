#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const retired = 'generate-seo-pages.js';
const deprecatedSlugs = [
  'words-with-q',
  'words-with-x',
  'words-with-z',
  '5-letter-words-containing-q',
  'words-ending-in-ing',
  'words-ending-in-ed',
  'words-ending-in-ly',
  'words-ending-in-er',
  'words-ending-in-tion',
];

const generatorFiles = fs.readdirSync(root)
  .filter(name => /^generate-.*\.js$/.test(name))
  .sort();

const failures = [];

for (const name of generatorFiles) {
  const source = fs.readFileSync(path.join(root, name), 'utf8');

  for (const slug of deprecatedSlugs) {
    if (source.includes(slug)) {
      failures.push(`${name} references deprecated route slug: ${slug}`);
    }
  }

  if (name !== retired && source.includes('sitemap.xml') && /writeFile(?:Sync)?|appendFile(?:Sync)?/.test(source)) {
    failures.push(`${name} appears able to write root sitemap.xml; generators must target child sitemaps only`);
  }
}

const retiredPath = path.join(root, retired);
if (!fs.existsSync(retiredPath)) {
  failures.push(`${retired} sentinel is missing`);
} else {
  const source = fs.readFileSync(retiredPath, 'utf8');
  if (!source.includes('RETIRED GENERATOR')) failures.push(`${retired} is missing its retired marker`);
  if (!source.includes('process.exitCode = 1')) failures.push(`${retired} must fail closed when invoked`);
  if (/require\(['"]fs['"]\)|from ['"](?:node:)?fs['"]|writeFile(?:Sync)?|appendFile(?:Sync)?|mkdirSync|renameSync|rmSync|unlinkSync/.test(source)) {
    failures.push(`${retired} must remain non-writing`);
  }
}

if (failures.length) {
  console.error('Generator safety check failed:\n- ' + failures.join('\n- '));
  process.exit(1);
}

console.log(`Generator safety OK: checked ${generatorFiles.length} top-level generators.`);
