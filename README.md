# LetterToolkit 6.12 – Language + Clean Preview

Fixes the two issues seen after 6.11.

## Clean preview
- Empty PROFILE / EXPERIENCE / EDUCATION / SKILLS sections are hidden.
- Placeholder text such as "Your profile appears here" is no longer shown in the CV or exported PDF.
- Section headings change with selected CV language.

## Language
- New "Rewrite CV in selected language" button.
- Selecting Norwegian, Swedish or English can rewrite the complete CV through AI.
- Role, profile, experience, education and skills are returned in the selected language.
- CV import now asks the AI to structure descriptive text in the selected language while preserving facts.
- Employer names, dates and factual details must not be invented or altered.

## Install
Replace:
- `/cv-builder/index.html`
- your established Worker `/src/index.js`

Then deploy from the established Worker folder:
`npx.cmd wrangler deploy`

Commit and push both changed files to GitHub.
