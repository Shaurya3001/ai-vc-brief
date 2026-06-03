# Research log

## Architecture notes
- Static SPA: index.html + /data/*.json. Zero build step.
- Offline fallback: embedded JSON script tags in index.html mirror /data/*.json
- Pipeline: scripts/weekly-update.mjs uses Anthropic API + web search → writes /data → GitHub Actions opens PR
- Validation: scripts/validate.mjs checks taxonomy/schema compliance

## Data model
- entries.json: atomic events (one section, one or more geo tags, status: new/updated/stale)
- sources.json: primary documents registry (referenced by id from entries)
- taxonomy.json: authoritative list of sections, subtags, geographies, source types

## 8 sections across 4 clusters
- stack: technology, infrastructure
- market: capital, companies, adoption
- environment: policy, talent
- synthesis: theses
