# Word Unscrambler v3

A static, privacy-friendly word unscrambler designed for Cloudflare Pages.

## Deploy

Upload all files to the root of the GitHub repository. Cloudflare Pages will redeploy automatically. No build command is required; the output directory is the repository root.

## Local test

Run `python -m http.server 8000` in this folder, then open `http://localhost:8000`.

## Before using a custom domain

Replace the Pages URL in `index.html`, `robots.txt`, and `sitemap.xml` with the final HTTPS domain.

## Main features

- 350,000+ alphabetic English entries
- wildcard support using `?`
- length filters and result tabs
- Scrabble-style point values
- fully client-side search
- responsive and accessible interface
- basic technical SEO and structured data
