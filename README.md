# The AI Brief — VC intelligence wiki (US · Canada · India)

A live, structured intelligence brief on the AI economy for venture investors.
Static site + JSON data layer + a weekly Claude-powered update pipeline.

## What's in here

```
index.html                     The site (vanilla JS, no build step). Renders from /data.
data/
  taxonomy.json                8 sections, clusters, sub-tags, geographies — drives UI + validation.
  sources.json                 Source registry: each primary document stored once.
  entries.json                 The content. Atomic entries in the schema. Ships with sample data.
scripts/
  weekly-update.mjs            Calls Claude + web search, drafts the week's entries, writes /data.
.github/workflows/
  weekly-update.yml            Weekly cron → runs the script → opens a PR.
SPEC.md                        The full buildable spec (schema, taxonomy, architecture).
```

## Run it locally

The site fetches `./data/*.json`, so use a local server (opening the file directly
falls back to embedded sample data, which is fine for a quick look):

```bash
cd ai-vc-wiki
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy (pick one — all free tiers work)

The site is fully static, so hosting is trivial.

- **GitHub Pages (simplest):** push this folder to a repo, then Settings → Pages →
  Build from branch → `main` / root. Done. Each merge republishes automatically.
- **Vercel / Netlify / Cloudflare Pages:** import the repo, no build command,
  output directory = repo root.

## Turn on the weekly auto-update

1. Get an API key from the Anthropic Console.
2. In your repo: Settings → Secrets and variables → Actions → New repository secret,
   name `ANTHROPIC_API_KEY`.
3. That's it. The workflow runs every Monday 06:00 UTC (and on demand from the
   Actions tab). It drafts the week's entries and opens a **pull request** so you
   can glance at the new items before they publish. Merge to go live.

### Want it fully hands-off?
Replace the PR step in `.github/workflows/weekly-update.yml` with a direct commit:

```yaml
      - run: |
          git config user.name "ai-brief-bot"
          git config user.email "bot@users.noreply.github.com"
          git add data && git commit -m "weekly update" && git push || echo "no changes"
```

I'd keep the PR step at least at the start — a credibility-sensitive VC product
benefits from a 60-second human glance before anything goes out.

## Cost

The job makes ~8 API calls (one per section) with a few web searches each, once a
week. That's a small number of requests per run — order of cents to low single
dollars weekly depending on model and search volume. Tune `MAX_ENTRIES_PER_SECTION`
and the web-search `max_uses` in `scripts/weekly-update.mjs` to control it.

## Editing content by hand

Add or edit objects in `data/entries.json` (follow the schema in `SPEC.md`) and add
their primary documents to `data/sources.json`. The site picks them up on reload.
The sample entries (`"sample": true`) disappear automatically the first time the
pipeline writes real content, or you can delete them yourself.

## What you need to do vs. what's built

Built and ready: the site, the data schema + seed, the update script, the workflow.
Yours (one-time, ~10 min): create the repo, enable Pages/host, add the API-key
secret. I can't enter credentials or stand up hosting accounts for you — those are
account actions you control.

## A model-string note

`scripts/weekly-update.mjs` uses `claude-sonnet-4-6` and a web-search tool version
string. Model names and tool versions move; if a call 404s, check the current
strings at https://docs.claude.com and update the constants at the top of the script.
