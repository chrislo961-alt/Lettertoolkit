#!/usr/bin/env node

/**
 * RETIRED GENERATOR
 *
 * Word Explorer pages are already materialized in the repository. This legacy
 * generator also mutated the root sitemap.xml as if it were a urlset, while the
 * current production architecture uses sitemap.xml as a sitemap index.
 *
 * Keeping this filename as a fail-closed sentinel prevents an old command from
 * corrupting the sitemap index or overwriting curated Word Explorer files.
 */

console.error([
  'generate-word-explorer.js is retired and intentionally does not write files.',
  'Word Explorer pages remain in the repository and sitemap-words.xml.',
  'If Word Explorer generation is revived, it must own only /word/ routes and sitemap-words.xml.'
].join('\n'));

process.exitCode = 1;
