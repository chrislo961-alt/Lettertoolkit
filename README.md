# LetterToolkit 6.16 – Final Application Package

Adds the final step around sending an application.

## New
- AI-generated email subject
- AI-generated recruiter/hiring-manager email
- recipient/company field
- copy email
- download a complete application package
- final readiness checklist
- email data is saved in local drafts
- all previous Application Builder features remain

## Worker
Adds:
`application_email`

## Install
Replace:
- `/application-builder/index.html`
- `worker/src/index.js`

Then deploy from the `worker` folder in this ZIP:
`npx.cmd wrangler deploy`

Commit/push the site changes.
