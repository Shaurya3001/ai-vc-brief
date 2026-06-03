# Project context

The AI Brief — a live, structured intelligence wiki on the AI economy across the US, Canada, and India, built for venture investors. Eight thematic sections (capital, companies, technology, infrastructure, adoption, policy, talent, theses) fed by a Claude-powered weekly pipeline. No backend, no build step: the site is a single `index.html` over three JSON files in `/data/`.

## Stack
- Language: Vanilla JS (ES2020+), no framework
- Hosting: GitHub Pages or Vercel (static)
- Database: None — `/data/entries.json`, `/data/sources.json`, `/data/taxonomy.json`
- Deploy: `git push` → GitHub Actions auto-deploys
- Critical deps: None (zero npm deps for the site itself); Node 18+ for the pipeline script only

## Code style
- All JS lives in `index.html`; keep it in one file unless it grows past ~800 lines.
- Dummy data stays in `/data/` — never inline.
- CSS custom properties for every color and spacing token.
- No inline styles in HTML. No CSS frameworks.
- The embedded JSON blocks in `index.html` (fallback for offline) must stay in sync with `/data/*.json`.

## Do's and don'ts
- Run `node scripts/validate.mjs` after any `/data/` edit.
- Never introduce a build step or npm dependencies for the site.
- Never fake a deploy — only claim live when the URL is confirmed.
- Ask before adding any dependency to the pipeline script.
- Preserve the MECE invariant: one canonical section per entry, geography is an overlay tag only.

## Workflow orchestration
1. Plan mode for any task with 3+ steps or touching multiple views.
2. Use subagents for pipeline research, backfill runs, and code review.
3. After ANY correction, update `tasks/lessons.md`.
4. Never mark done without showing the rendered output (screenshot or `python3 -m http.server` confirmation).

## Task management
- Plan first → `tasks/todo.md`. Confirm. Track progress. Capture lessons.

## Core principles
- Simplicity first. The site should work with zero JS frameworks.
- No laziness. If the bars look wrong, fix the data, not the label.
- Minimal impact. A CSS change must not affect layout of another view.

## Linked rules
- @rules/planning.md
- @rules/git-practices.md
- @rules/code-quality.md
- @rules/session-persistence.md

## Adversarial framing
Lead with the strongest counterargument. Calibrated confidence only. Never claim a view renders correctly without proof.
