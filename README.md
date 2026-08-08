# LetterToolkit 6.7 – CV + Application Suite

This release creates two separate user-facing tools:

- `/cv-builder/`
- `/application-builder/`

## CV Builder
More compact hero and workflow so the tool starts higher on the screen.
Includes a direct "Create application" handoff.

## Application Builder
Dedicated job-application page for users who only need an application.
Flow:
1. Upload or paste CV/background
2. Paste job advertisement
3. Choose language and tone
4. Generate application
5. Edit, copy, download

The Application Builder can receive CV data from the CV Builder through localStorage.

## Worker
Adds a new action:
`job_application`

Replace:
- `worker/src/index.js`
- `worker/wrangler.toml`

Then deploy from your existing working Worker folder:

```powershell
npx.cmd wrangler deploy
```

Your existing Cloudflare `OPENAI_API_KEY` secret remains attached.

## GitHub/site install
Copy these folders into the repository root:
- `cv-builder`
- `application-builder`

Replace the existing `cv-builder` folder.
Add the new `application-builder` folder.

For SEO, add `/application-builder/` to your sitemap when you next update the main site sitemap.
