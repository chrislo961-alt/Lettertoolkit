#!/usr/bin/env node

/**
 * RETIRED GENERATOR
 *
 * This script previously regenerated broad word-list pages and mutated the
 * root sitemap directly. Those responsibilities have since been split across
 * curated pages, focused generators, and sitemap files with CI coverage.
 *
 * Keeping this filename as an explicit sentinel prevents an old command,
 * bookmark, or deployment note from silently recreating deprecated routes or
 * overwriting curated production pages.
 */

console.error([
  'generate-seo-pages.js is retired and intentionally does not write files.',
  'Use the focused generators documented in GENERATORS.md instead.',
  'Do not restore broad route generation without updating redirect, sitemap, and CI policy.'
].join('\n'));

process.exitCode = 1;
