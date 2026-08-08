LetterToolkit 6.2 - Homepage + AI CV Builder

This release restores the LetterToolkit homepage from 6.1 and adds the AI CV Builder at /cv-builder/.

Important:
- The CV Builder is connected to the existing Cloudflare Worker:
  https://lettertoolkit-cv-ai.chrislo961.workers.dev
- Do not upload local .secrets or OpenAI API keys to GitHub.
- Replace the repository contents with this package, then commit and push via GitHub Desktop.
- Remove any old folder named "Cv builder" so only /cv-builder/ remains.
