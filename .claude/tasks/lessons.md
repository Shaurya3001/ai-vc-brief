# Lessons

## Format
Each entry: `[CATEGORY] Pattern — Rule`

## Entries
- [INVARIANT] Every entry must file in exactly ONE section by fact type — never duplicate across sections; geography is a tag overlay only.
- [DATA] Run `node scripts/validate.mjs` after any edit to `/data/` — catches schema/taxonomy violations before they reach the site.
- [STYLE] No inline styles in HTML — all values go in CSS custom properties.
- [PIPELINE] The embedded JSON fallback in index.html must stay in sync with /data/*.json — they serve different environments (offline vs live).
