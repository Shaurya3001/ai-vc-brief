# Code quality
- All colors and spacing as CSS custom properties in `:root` — no magic numbers inline.
- No inline styles in HTML elements.
- No CSS frameworks, no npm deps for the site.
- Accessibility: all interactive controls must have aria-labels.
- Validate data integrity: `node scripts/validate.mjs` after every `/data/` edit.
- Never claim a view renders correctly without running it in a browser.
