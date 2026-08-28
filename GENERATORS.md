# Generator ownership and safety

LetterToolkit uses focused generators only. Broad site-wide regeneration is intentionally disabled because many production pages are curated and have distinct canonical/search intent.

## Active generators

- `generate-growth-pages.js` — owns the focused five-letter finder/growth pages it explicitly lists.
- `generate-word-explorer.js` — owns `/word/`, the selected `/word/<term>/` explorer pages, `word-explorer.js`, and its report/sitemap output.
- `generate-writer-seo.js` — owns the Writer SEO landing pages it explicitly lists plus its Writer report/sitemap entries.

Active generators must only write routes they explicitly own. Do not expand them into catch-all word-list generation without reviewing canonical intent, redirect policy, sitemap placement, and CI coverage.

## Retired generator

- `generate-seo-pages.js` — retired. It previously generated broad word-list routes and directly mutated the root `sitemap.xml`. It now exits without writing files.

The filename is intentionally retained as a fail-safe so old commands cannot silently recreate deprecated pages.

## Canonical route policy

The following legacy families must not be generated as production HTML:

- `/words-with-q/`, `/words-with-x/`, `/words-with-z/`
- `/5-letter-words-containing-q/`
- `/words-ending-in-ing/`, `/words-ending-in-ed/`, `/words-ending-in-ly/`, `/words-ending-in-er/`, `/words-ending-in-tion/`

They are permanent aliases handled by Cloudflare Pages middleware. Their canonical destinations are the current `words-containing-*`, `5-letter-words-with-q`, and `words-that-end-with-*` routes.

## Sitemap policy

The root `sitemap.xml` is a sitemap index and must not be rewritten by content generators. Focused generators may update the appropriate child sitemap only when that generator owns those routes.

## CI guard

`scripts/check-generator-safety.cjs` verifies that:

1. the retired broad generator remains a non-writing sentinel;
2. top-level generators do not contain deprecated route families;
3. active generators do not write directly to root `sitemap.xml`.

If a future architecture intentionally changes these rules, update the generator, redirect policy, sitemap structure, tests, and this document together.
