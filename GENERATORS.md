# Generator ownership and safety

LetterToolkit uses focused generators only. Broad site-wide regeneration is intentionally disabled because many production pages are curated and have distinct canonical/search intent.

## Active generators

- `generate-growth-pages.js` — owns the focused five-letter finder/growth pages it explicitly lists and is the only generator allowed to rebuild the five child sitemaps plus the root sitemap index.
- `generate-writer-seo.js` — owns the Writer SEO landing pages it explicitly lists plus its Writer report/sitemap entries.

Active generators must only write routes they explicitly own. Do not expand them into catch-all word-list generation without reviewing canonical intent, redirect policy, sitemap placement, and CI coverage.

## Retired generators

- `generate-seo-pages.js` — retired. It previously generated broad word-list routes and directly mutated the root sitemap.
- `generate-word-explorer.js` — retired. Word Explorer pages remain materialized in the repository, but the old generator treated the root sitemap index as a urlset and could corrupt it when rerun.

The filenames are intentionally retained as fail-closed sentinels so old commands cannot silently recreate deprecated pages, overwrite curated files, or damage sitemap structure.

## Canonical route policy

The following legacy families must not be generated as production HTML:

- `/words-with-q/`, `/words-with-x/`, `/words-with-z/`
- `/5-letter-words-containing-q/`
- `/words-ending-in-ing/`, `/words-ending-in-ed/`, `/words-ending-in-ly/`, `/words-ending-in-er/`, `/words-ending-in-tion/`

They are permanent aliases handled by Cloudflare Pages middleware. Their canonical destinations are the current `words-containing-*`, `5-letter-words-with-q`, and `words-that-end-with-*` routes.

## Sitemap policy

The root `sitemap.xml` is a sitemap index. `generate-growth-pages.js` is the single designated sitemap builder and must emit that root file only as `<sitemapindex>`. Other generators may update only their appropriate child sitemap when they own those routes.

## CI guard

`scripts/check-generator-safety.cjs` verifies that:

1. retired generators remain non-writing sentinels;
2. top-level generators do not contain deprecated route definitions;
3. only the designated sitemap builder may write root `sitemap.xml`;
4. the designated sitemap builder still emits a sitemap index.

`.github/workflows/production-smoke.yml` verifies representative production routes, redirects, canonical markup, robots.txt, and sitemap structure from GitHub Actions where public DNS is available.

If a future architecture intentionally changes these rules, update the generator, redirect policy, sitemap structure, tests, and this document together.
