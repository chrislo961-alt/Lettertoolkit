# LetterToolkit 6.22 – Professional Layout + Application JS Hotfix

This release focuses on presentation and stability.

## Fixed
- Removes the raw JavaScript that was appearing at the bottom of Application Builder.
- Rebuilt the application export HTML so embedded SEO scripts cannot break the page.
- JavaScript syntax for both builder pages was checked before packaging.

## Visual overhaul
- CV Builder and Application Builder are both clearly visible in the top navigation.
- The current tool is visually highlighted.
- CV Builder gets a prominent gold Application Builder callout.
- Application Builder gets a prominent purple CV Builder callout.
- Both pages use the same visual system and cross-linking.
- Both pages include a compact two-tool footer area.

## Install
Replace only:
- `/cv-builder/index.html`
- `/application-builder/index.html`

The Worker is unchanged from 6.21, so NO PowerShell deploy is required for this release.

Commit and push the two HTML files.
