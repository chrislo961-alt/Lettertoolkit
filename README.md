# LetterToolkit 6.14 – Application Builder Pro

Focuses on making the dedicated job application page a polished product.

## New on Application Builder
- word count and character count
- visible tone indicator
- alternate versions:
  - Shorter
  - Warmer
  - More direct
- AI Review application
- application score 0–100
- recruiter-style feedback
- improved application version
- one-click "Use improved version"
- existing CV handoff, upload, language and tone controls remain

## Worker
Adds:
- `rewrite_application`
- `review_application`

## Install
Copy/replace in the repository:
- `application-builder/index.html`
- `cv-builder/index.html` may remain unchanged if already on 6.13
- `worker/src/index.js`

Deploy from the `worker` folder in THIS new ZIP:
`npx.cmd wrangler deploy`

Then commit/push the changed site files.
