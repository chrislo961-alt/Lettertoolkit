# LetterToolkit CV Builder v2

This is a local-first prototype for a CV/resume builder.

## Included
- Start from scratch
- Local autosave
- TXT / HTML import
- PDF / DOCX file selection UX (reliable parsing intentionally not faked)
- Job-ad keyword analysis in the browser
- Local profile improvement helper
- Cover letter draft generator
- English / Swedish / Norwegian
- 3 preview styles
- PDF via browser print
- TXT / HTML / JSON export

## Not yet included
- Real AI rewriting
- Robust PDF/DOCX parsing
- True DOCX export
- LinkedIn API import

Those require a secure production backend/API route.

## Production architecture recommendation
- Frontend: static page on Cloudflare Pages
- Backend: Cloudflare Worker / serverless function
- AI: server-side model call only
- File parsing: server-side or vetted client-side libraries
- Privacy: explicit retention policy and automatic deletion
