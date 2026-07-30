# Word Tools Platform 2.0.1

A static, browser-based suite containing Word Unscrambler, Anagram Solver, Word Finder, and Wordle Helper.

## Deploy
Upload the contents of this folder to the root of the GitHub repository connected to Cloudflare Pages. No build command is required.

## Test
Serve the folder over HTTP (not `file://`) because the app loads JavaScript modules and `words.txt` with `fetch()`.
