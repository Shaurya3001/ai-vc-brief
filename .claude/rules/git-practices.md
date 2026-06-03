# Git practices
- Commit message format: `<type>(<scope>): <subject>` — e.g. `feat(ui): dark theme redesign`.
- One concern per commit. Never bundle a feature and a bug fix.
- Never force-push to main.
- Branch naming: `feat/<slug>`, `fix/<description>`, `chore/<description>`.
- Run `node scripts/validate.mjs` before any commit touching `/data/`.
