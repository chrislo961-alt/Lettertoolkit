# LetterToolkit 4.0 SEO Edition

Static website prepared for Cloudflare Pages. No build command is required.

## Included
- Unique titles, meta descriptions, canonical URLs, Open Graph, and Twitter metadata
- WebSite, Organization, WebPage, WebApplication, FAQ, and breadcrumb structured data
- Updated sitemap and robots file
- Contact, Terms, expanded Privacy, and custom 404 pages
- Publish-safe Google Analytics and AdSense integration scaffolding
- Reserved ad placements that do not load ads until you add an approved publisher ID

## Publish
Upload every file and folder to the root of the GitHub repository and commit to `main`. Cloudflare Pages will deploy automatically.

## Search Console
1. Add `lettertoolkit.com` as a domain property.
2. Complete DNS verification in Cloudflare.
3. Submit `https://lettertoolkit.com/sitemap.xml`.
4. Inspect and request indexing for the home page and major tool pages.

## Google Analytics 4
Open `site-config.js` and add your measurement ID:

```js
googleAnalyticsId: "G-XXXXXXXXXX"
```

The included loader only activates analytics when `lt-analytics-consent` is set to `granted`. Use a consent solution appropriate for the locations where you serve visitors before enabling analytics.

## Google AdSense
Apply using the live domain. After approval:
1. Add your publisher value in `site-config.js`, such as `ca-pub-1234567890123456`.
2. Replace each visual `.ad-slot` placeholder with the exact ad-unit markup supplied in your AdSense account, or enable Auto ads.
3. Publish the `ads.txt` line supplied by AdSense at `/ads.txt`. Do not invent this value before approval.
4. Configure a suitable consent management platform for visitors where consent is required.

## Contact email
The pages currently use `hello@lettertoolkit.com`. Create that mailbox/forwarder or replace it throughout the project.

## Important
Spelling-based rhyme results are not a pronunciation dictionary. Word validity also varies between games and publishers.


## 4.0.1 hotfix
- The homepage now opens directly on Word Unscrambler.
- Shared assets use cache-busting query strings.
- Dictionary loading works from both `/` and tool subpages.
- The tool navigation no longer shows a visible scrollbar.
