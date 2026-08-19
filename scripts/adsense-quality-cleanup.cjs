const fs = require('fs');
const path = require('path');

const root = process.cwd();
const htmlFiles = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && entry.name === 'index.html') htmlFiles.push(full);
  }
}

walk(root);

function rel(file) {
  return path.relative(root, file).replace(/\\/g, '/');
}

function isProgrammaticLowValue(relPath) {
  if (/^word\/[^/]+\/index\.html$/i.test(relPath)) return true;
  if (/^\d+-letter-words(?:-[^/]+)?\/index\.html$/i.test(relPath)) return true;
  if (/^words-(?:that-)?(?:start|end|contain)[^/]*\/index\.html$/i.test(relPath)) return true;
  return false;
}

let touched = 0;
let pruned = 0;

for (const file of htmlFiles) {
  const relative = rel(file);
  let html = fs.readFileSync(file, 'utf8');
  const before = html;

  // Remove legacy cross-domain branding/canonicals left from the former site.
  html = html.replaceAll('https://wordunscramble.eu', 'https://lettertoolkit.com');
  html = html.replaceAll('WordUnscramble.eu', 'LetterToolkit');

  if (isProgrammaticLowValue(relative)) {
    pruned += 1;

    if (/<meta[^>]+name=["']robots["'][^>]*>/i.test(html)) {
      html = html.replace(/<meta[^>]+name=["']robots["'][^>]*>/i, '<meta name="robots" content="noindex,follow">');
    } else {
      html = html.replace(/<\/head>/i, '<meta name="robots" content="noindex,follow"></head>');
    }

    // Do not monetize thin/generated pages while they are excluded from search.
    html = html.replace(/<meta[^>]+name=["']google-adsense-account["'][^>]*>\s*/gi, '');
    html = html.replace(/<script\s+async\s+src=["']https:\/\/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js\?client=ca-pub-9212084765206199["'][^>]*><\/script>\s*/gi, '');
  }

  if (html !== before) {
    fs.writeFileSync(file, html);
    touched += 1;
  }
}

const curated = [
  '/',
  '/about/',
  '/contact/',
  '/privacy/',
  '/terms/',
  '/guides/',
  '/guides/anagram-guide/',
  '/guides/crossword-solving-tips/',
  '/guides/five-letter-word-strategy/',
  '/guides/how-to-unscramble-words/',
  '/guides/rhyme-finding-guide/',
  '/guides/scrabble-word-finding/',
  '/guides/using-word-tools-responsibly/',
  '/guides/word-finder-patterns/',
  '/guides/wordle-strategy/',
  '/word-unscrambler/',
  '/anagram-solver/',
  '/word-finder/',
  '/wordle-helper/',
  '/crossword-answer-finder/',
  '/crossword-solver/',
  '/scrabble-helper/',
  '/rhyme-finder/',
  '/random-word-generator/',
  '/word-generator/',
  '/word-lists/',
  '/word/',
  '/writer/',
  '/cv-builder/',
  '/application-builder/',
  '/cover-letter/',
  '/cv-examples/',
  '/cv-template/',
  '/how-to-write-a-cv/',
  '/how-to-write-a-job-application/',
  '/interview-questions/',
  '/job-application-examples/'
];

const unique = [...new Set(curated)].filter((url) => {
  if (url === '/') return fs.existsSync(path.join(root, 'index.html'));
  return fs.existsSync(path.join(root, url.replace(/^\//, ''), 'index.html'));
});

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${unique.map((u) => `  <url><loc>https://lettertoolkit.com${u}</loc></url>`).join('\n')}\n</urlset>\n`;
fs.writeFileSync(path.join(root, 'sitemap.xml'), sitemap);

console.log(`Touched ${touched} HTML files.`);
console.log(`Marked ${pruned} programmatic pages noindex and removed AdSense from them.`);
console.log(`Sitemap now contains ${unique.length} curated URLs.`);
