# LetterToolkit 6.15 – Application Drafts + Job Match

Adds product-completion features to the dedicated Application Builder.

## New
- local saved drafts (up to 20)
- restore/delete drafts
- AI job-match score before generating
- relevant keyword suggestions
- PDF print/export for application
- Word-compatible document export
- existing alternate versions and AI review remain

## Install
Replace:
- `/application-builder/index.html`
- `worker/src/index.js`

Then from the `worker` folder in this ZIP:
`npx.cmd wrangler deploy`

Commit and push the changed site files.
