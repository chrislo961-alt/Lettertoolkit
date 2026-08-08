# LetterToolkit 6.8 – Production CV + Application Suite

This release focuses on completeness instead of adding more unrelated features.

## CV Builder
- Compact tool-first layout
- TXT / HTML / PDF / DOCX import
- Two-stage AI import for complex multi-page CVs
- Extracts all employment history and education
- Languages and certifications included
- Import Review before data is applied
- Confidence indicators on extracted fields
- Existing AI tailoring, design and export remain
- Direct handoff to Application Builder

## Application Builder
- Dedicated page for job applications
- CV/background + job advertisement + tone + language
- AI-generated application
- Edit, copy and download
- Can receive data directly from CV Builder

## Worker
- Existing improve_cv
- existing cover_letter
- existing job_application
- improved import_cv:
  1. complete factual document extraction
  2. second AI pass to validate and normalize the structure
- no database storage
- 6 MB frontend upload limit
- Worker request protection
- CORS restricted to LetterToolkit
- 90-second upstream timeout guard
- keeps the existing Cloudflare OPENAI_API_KEY secret

## Install
You can copy the extracted package into the repository root and replace matching files.

For the website:
- replace `cv-builder`
- replace/add `application-builder`

For the AI Worker:
- use `worker/src/index.js`
- use `worker/wrangler.toml`

Then from the Worker folder run:

```powershell
npx.cmd wrangler deploy
```

No new API secret is required.
