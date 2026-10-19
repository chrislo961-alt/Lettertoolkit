# LetterToolkit

[LetterToolkit](https://lettertoolkit.com/) provides free tools to count, analyze, clean and format text, alongside word and letter utilities. Core text calculations run in the browser.

## Tools and reference material

- [Word Counter](https://lettertoolkit.com/word-counter/) — words, characters, sentences and paragraphs.
- [Text Analyzer](https://lettertoolkit.com/text-analyzer/) — text length, reading time and word frequency.
- [Text Cleaner](https://lettertoolkit.com/text-cleaner/) — spacing and pasted-text cleanup.
- [All tools](https://lettertoolkit.com/tools/).
- [Word-count examples and reusable test](https://lettertoolkit.com/guides/how-word-counting-works/#word-count-test) — checked examples that explain punctuation and language limitations.
- [Methodology](https://lettertoolkit.com/how-it-works/) and [editorial policy](https://lettertoolkit.com/editorial-policy/).

The word-count reference includes a downloadable text sample with an expected count of 15. It can be reused in teaching, writing guidance and software testing. It describes LetterToolkit's counting rule; a school, publisher or submission system may use a different one.

## Site and deployment

The production site uses Cloudflare Pages with static files at the repository root and route/header handling in `functions/_middleware.js`. The `main` branch is the production source. Pull-request checks validate the Cloudflare preview, tools, redirects and curated SEO surface before publication.

The active sitemap index is `sitemap.xml`, containing `sitemap-static.xml`, `sitemap-tools.xml` and `sitemap-guides.xml`. Generated or retired routes are deliberately excluded; do not restore legacy sitemap inventories or old CV/application positioning.

## IndexNow

`indexnow.config.json` and the matching public root `.txt` file configure [IndexNow](https://www.indexnow.org/documentation). The key is a public ownership-verification value, not an account credential.

The **IndexNow changed URLs** GitHub Actions workflow selects new, changed and removed URLs from each production commit range. It waits for the successful Cloudflare Pages check for that exact commit and verifies the live key and affected routes before notifying IndexNow. If another push arrives first, the earlier run keeps its original baseline and checks the newer production commit so an intervening README edit cannot discard a pending page update. README-only, workflow-only and sitemap-date-only edits do not independently trigger submissions. There is no recurring unchanged-URL submission or historical sitemap backfill.

HTTP `200` means the notification was received. HTTP `202` means key validation is pending. Neither confirms that a URL is indexed or that rankings will improve. Responses and submitted URLs appear in the workflow logs and summary.

Run the focused checks with Node 22 or newer:

```sh
node --test scripts/indexnow.test.mjs
node scripts/indexnow.mjs --dry-run
node scripts/check-seo-integrity.cjs
node scripts/check-indexability-links.cjs
```

The local dry run defaults to the current commit's first-parent change. To inspect another range, use `--base <commit> --head <commit>`. Pull requests only perform a dry run. A manual production run verifies the selected commit before submitting and should be used to retry a failed notification, not to repeatedly resubmit unchanged content.
