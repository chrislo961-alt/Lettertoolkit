# LetterToolkit 6.13 – AI Review

Adds a controlled AI review workflow.

## New
- AI Review CV button
- CV score (0–100)
- recruiter-style overview
- up to 8 focused suggestions
- current text vs suggested replacement
- Accept / Reject per suggestion
- Accept all
- no CV field is changed until the user accepts
- job advertisement is used for relevance when supplied
- review is returned in the selected language
- AI is explicitly forbidden from inventing facts

## Install
Replace:
- `/cv-builder/index.html`
- the established Worker `/src/index.js`

Then deploy from the established Worker folder:
`npx.cmd wrangler deploy`

Commit and push both changed files.
