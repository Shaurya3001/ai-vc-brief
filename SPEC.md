# The AI Brief — buildable spec

A structured, self-updating intelligence brief on the AI economy across the US,
Canada, and India, built for venture investors. This document is the contract the
site, the data, and the update pipeline all conform to.

## 1. Organizing principle (the MECE rule)

Two axes.

- **Primary axis — section by fact type.** Eight sections grouped into four
  clusters. Every fact is filed by *what kind of thing it is* and cross-referenced,
  never duplicated. A funding round is a transaction (Capital); the startup that
  raised it is an entity (Companies); the chip it builds is an asset
  (Infrastructure). One canonical home per fact. If you can't decide where
  something goes, the taxonomy has an overlap to fix.
- **Cross-cutting axis — geography overlay.** Every entry is tagged
  `US` / `Canada` / `India` / `Global`. The Countries view pivots the same dataset;
  there are no separate per-country content stores.

### Clusters and sections

| Cluster | Section | Owns (fact type) | Cadence |
|---|---|---|---|
| The stack | Technology & capability | model/research capability | daily |
| The stack | Infrastructure & compute | physical substrate (chips, DC, power) | weekly |
| The market | Capital & funding | transactions (rounds, funds, exits) | daily |
| The market | Companies & landscape | entities, sector maps | weekly |
| The market | Market & adoption | demand (spend, revenue, pilots) | weekly |
| The environment | Policy, regulation & geopolitics | rules (law, trade, immigration) | event |
| The environment | Talent & people | people (founders, hires, pipelines) | weekly |
| Synthesis | Theses & open questions | editorial (white space, debates, calls) | monthly |

Sub-tags per section are enumerated in `data/taxonomy.json` and are the
second-level filing dimension.

## 2. The atomic entry schema

One record = one development. The whole system (site, country pivot, this-week
digest, source links) is built on this object.

```jsonc
{
  "id": "2026-06-02-large-late-stage-round",   // date + slug, unique
  "title": "concise headline",                  // string
  "date": "2026-06-02",                          // event date, YYYY-MM-DD
  "added": "2026-06-02T09:00:00Z",               // when it entered the brief (drives "this week")
  "section": "capital",                          // one of the 8 section ids
  "subtag": "rounds",                            // a sub-tag id valid for that section
  "geography": ["US"],                           // subset of US|Canada|India|Global
  "status": "new",                               // new | updated | stale
  "summary": "2-3 sentences, neutral, specific.",
  "why_it_matters": "1-2 sentences, the VC so-what.",
  "sources": ["src-..."]                         // references into the source registry
}
```

Optional: `"sample": true` marks seed placeholders (auto-removed once real content
is written).

### Source registry record

Primary documents are stored once and referenced by id, so a report linked from
five entries lives in one place (no link rot, no duplication).

```jsonc
{
  "id": "src-2026-06-01-sample-co-1",
  "title": "Q2 venture funding report",
  "publisher": "Sample Data Co.",
  "type": "filing|press|research|blog|analysis|data|gov",
  "date": "2026-06-01",
  "url": "https://...",
  "archive_url": ""                              // optional archived copy
}
```

## 3. Architecture

```
GitHub Actions (weekly cron)
        │  runs
        ▼
scripts/weekly-update.mjs ── Anthropic API (Claude + web search)
        │  writes
        ▼
data/entries.json + data/sources.json   ←── single source of truth (git = changelog)
        │  read by
        ▼
index.html (static SPA)  ──►  GitHub Pages / Vercel / Netlify
```

Why static + JSON: zero backend to maintain, free hosting, git history *is* the
changelog, and the data layer is trivially DB-backable later (swap JSON files for
an Airtable/Postgres export step) without touching the site.

## 4. Update pipeline contract

`weekly-update.mjs`, per section:

1. Prompt Claude (with web search) for ≤ N notable developments from the last 7
   days across US / Canada / India + globally significant items.
2. Require JSON-only output in the schema above, each item carrying a real
   primary-source URL.
3. Validate: geography ∈ taxonomy, subtag ∈ section, date well-formed.
4. Dedupe against existing entries by normalized title.
5. Register sources (dedupe by URL), convert to id references.
6. Age entries: `new` → `stale` after `STALE_AFTER_DAYS`.
7. Write `entries.json` + `sources.json`; the workflow opens a PR.

Tunables (top of the script): `MODEL`, `MAX_ENTRIES_PER_SECTION`, web-search
`max_uses`, `STALE_AFTER_DAYS`.

### Human-in-the-loop
Default is a PR per week for a quick review before publish. Switch to direct-commit
for fully hands-off operation (see README). For a VC-facing product, a short review
is worth keeping at least early on.

## 5. Editorial vs. aggregator

The architecture supports both:

- **Editorial product** — heavier `why_it_matters` and a maintained Theses section
  in your voice. Higher value, higher touch. Keep the PR review.
- **Structured aggregator** — lean summaries, automation-first, lighter synthesis.
  Lower differentiation, near-zero touch. Direct-commit is fine.

The only thing that changes is how much weight the Synthesis cluster carries and
whether you review before publish.

## 6. Sensible extensions

- **Email digest:** a second Action that renders the week's `new` entries to an
  email/Slack post.
- **Backfill:** a one-off run with a wider date window to seed real history.
- **Watchlist entities:** add a `companies.json` registry and link entries to it
  for entity profile pages.
- **DB backend:** replace JSON files with an Airtable/Notion/Postgres export step;
  the site contract (the schema) stays identical.
