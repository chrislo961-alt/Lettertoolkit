# Word Tools Platform 1.0

A modular static word-tool platform for Cloudflare Pages.

## Core modules
- `core/dictionary.js` loads and indexes the dictionary.
- `core/engine.js` provides unscrambling, exact anagrams, pattern search, and sorting.
- `core/filters.js` contains validation and reusable filters.
- `core/score.js` contains word scoring.

Upload the contents of this folder to the root of the GitHub repository. Cloudflare Pages deploys automatically from `main`.
