# LetterToolkit CV Builder v3

This package has two parts:

- `frontend/` — static CV Builder UI
- `worker/` — Cloudflare Worker AI backend

## What v3 adds

- Secure server-side AI calls
- AI CV tailoring against a pasted job ad
- AI cover letter generation
- English / Swedish / Norwegian
- Local autosave and PDF/TXT/JSON export
- No API key in browser code

## Important

This is production architecture starter code, not legal/privacy advice.

The Worker deliberately tells the model not to invent qualifications, dates, employers, achievements, certifications, or metrics. Users must still review every generated claim before using it.

Do not send unnecessary sensitive personal information to the AI endpoint.

## 1. Deploy the Worker

Install Node.js first if needed.

Open a terminal in `worker/`:

```bash
npm install
npx wrangler login
npx wrangler secret put OPENAI_API_KEY
npm run deploy
```

Cloudflare will give you a Worker URL similar to:

`https://lettertoolkit-cv-ai.<your-subdomain>.workers.dev`

Cloudflare secrets are encrypted bindings and are the correct place for API keys. Do not put the key in `wrangler.toml` or frontend JavaScript.

## 2. Connect the frontend

Open:

`frontend/index.html`

Find:

```js
const WORKER_URL = "https://YOUR-WORKER.YOUR-SUBDOMAIN.workers.dev";
```

Replace it with your real Worker URL.

Then upload `frontend/index.html` into your LetterToolkit project at:

`/cv-builder/index.html`

## 3. Optional custom API domain

Later you can map the Worker to something like:

`https://api.lettertoolkit.com`

Then set:

```js
const WORKER_URL = "https://api.lettertoolkit.com";
```

## 4. OpenAI model

`wrangler.toml` currently sets:

`OPENAI_MODEL = "gpt-5"`

You can change that environment variable later without exposing anything to users.

The Worker uses the OpenAI Responses API at `/v1/responses`.

## 5. Before public launch

Recommended next steps:

- Restrict CORS to `https://lettertoolkit.com` instead of `*`
- Add rate limiting / Turnstile
- Add request-size limits
- Add clear privacy/retention disclosures
- Decide whether requests are logged at all
- Add robust PDF/DOCX parsing
- Add true DOCX generation
- Add explicit delete/retention handling if you ever store CV data

## Privacy default

This starter does not intentionally persist CV payloads in a database. The Worker receives text, forwards it to the AI provider, returns the result, and does not write the CV to KV/D1/R2.
