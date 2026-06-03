#!/usr/bin/env node
/**
 * weekly-update.mjs — the "Claude updates the brief" job.
 *
 * For each section in taxonomy.json it asks Claude (with web search) for the
 * week's notable developments across the US, Canada and India, drafted in the
 * site's entry schema. It then validates, dedupes against existing entries,
 * registers any new sources, ages old entries, and writes the data files back.
 *
 * Run: ANTHROPIC_API_KEY=sk-... node scripts/weekly-update.mjs
 * (GitHub Actions runs this on a weekly cron — see .github/workflows/weekly-update.yml)
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATA = join(ROOT, "data");

// --- config ---------------------------------------------------------------
const API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-4-6";
// Web search is a server-side tool. Confirm the current version string at
// https://docs.claude.com — bump this if the API has moved on.
const WEB_SEARCH_TOOL = { type: "web_search_20260209", name: "web_search", max_uses: 6 };
const MARKETS = ["United States", "Canada", "India"];
const STALE_AFTER_DAYS = 21;          // entries older than this get marked "stale"
const MAX_ENTRIES_PER_SECTION = 4;    // keep the weekly brief tight

if (!API_KEY) { console.error("Missing ANTHROPIC_API_KEY"); process.exit(1); }

const tax = JSON.parse(readFileSync(join(DATA, "taxonomy.json"), "utf8"));
const entriesDoc = JSON.parse(readFileSync(join(DATA, "entries.json"), "utf8"));
const sourcesDoc = JSON.parse(readFileSync(join(DATA, "sources.json"), "utf8"));

const now = new Date();
const iso = now.toISOString();
const today = iso.slice(0, 10);
const weekAgo = new Date(now.getTime() - 7 * 864e5).toISOString().slice(0, 10);

// --- helpers ---------------------------------------------------------------
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);
const norm = s => (s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const validGeo = g => tax.geographies.includes(g);

function registerSource(s) {
  if (!s || !s.url) return null;
  const existing = sourcesDoc.sources.find(x => x.url === s.url);
  if (existing) return existing.id;
  const id = "src-" + today + "-" + slug(s.publisher || s.title || "source") + "-" + (sourcesDoc.sources.length + 1);
  sourcesDoc.sources.push({
    id, title: s.title || "Untitled", publisher: s.publisher || "",
    type: tax.source_types.includes(s.type) ? s.type : "press",
    date: s.date || today, url: s.url, archive_url: s.archive_url || ""
  });
  return id;
}

async function draftSection(section) {
  const subtags = section.subtags.map(t => t.id).join(", ");
  const system =
`You are a research analyst maintaining a venture-capital intelligence brief on the AI economy.
Today is ${today}. Cover only genuinely notable developments from roughly ${weekAgo} to ${today}.
Use web search to verify facts and capture a real primary-source URL for each item.
Focus on the section "${section.label}" (${section.blurb}) across these markets: ${MARKETS.join(", ")}, plus globally significant items.
Return at most ${MAX_ENTRIES_PER_SECTION} of the most decision-relevant items.

Output ONLY a JSON array (no prose, no markdown fences). Each element:
{
  "title": "concise headline",
  "date": "YYYY-MM-DD",
  "geography": ["US" | "Canada" | "India" | "Global", ...],
  "subtag": one of [${subtags}],
  "summary": "2-3 sentences, neutral, specific",
  "why_it_matters": "1-2 sentences written for a VC: the so-what",
  "sources": [{"title":"","publisher":"","type":"filing|press|research|blog|analysis|data|gov","date":"YYYY-MM-DD","url":"https://..."}]
}
If nothing material happened this week in this section, return [].`;

  const body = {
    model: MODEL, max_tokens: 3000,
    system,
    tools: [WEB_SEARCH_TOOL],
    messages: [{ role: "user", content: `Draft this week's "${section.label}" entries.` }]
  };

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": API_KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify(body)
  });
  if (!res.ok) { console.error(`  ! ${section.id}: API ${res.status} ${await res.text()}`); return []; }
  const data = await res.json();
  const text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("\n");
  const start = text.indexOf("["), end = text.lastIndexOf("]");
  if (start === -1 || end === -1) { console.error(`  ! ${section.id}: no JSON array in response`); return []; }
  let arr;
  try { arr = JSON.parse(text.slice(start, end + 1)); }
  catch (e) { console.error(`  ! ${section.id}: JSON parse failed`); return []; }
  return Array.isArray(arr) ? arr : [];
}

function ingest(section, drafts) {
  const existingTitles = new Set(entriesDoc.entries.map(e => norm(e.title)));
  let added = 0;
  for (const d of drafts) {
    if (!d || !d.title || !d.summary) continue;
    if (existingTitles.has(norm(d.title))) continue;            // dedupe
    const geos = (Array.isArray(d.geography) ? d.geography : []).filter(validGeo);
    const subtag = section.subtags.find(t => t.id === d.subtag) ? d.subtag : section.subtags[0].id;
    const sourceIds = (Array.isArray(d.sources) ? d.sources : []).map(registerSource).filter(Boolean);
    const date = /^\d{4}-\d{2}-\d{2}$/.test(d.date) ? d.date : today;
    entriesDoc.entries.push({
      id: `${date}-${slug(d.title)}`,
      title: d.title.trim(),
      date, added: iso,
      section: section.id, subtag,
      geography: geos.length ? geos : ["Global"],
      status: "new",
      summary: d.summary.trim(),
      why_it_matters: (d.why_it_matters || "").trim(),
      sources: sourceIds
    });
    existingTitles.add(norm(d.title));
    added++;
  }
  return added;
}

function ageEntries() {
  const cutoff = new Date(now.getTime() - STALE_AFTER_DAYS * 864e5);
  for (const e of entriesDoc.entries) {
    if (e.sample) continue;
    const when = new Date(e.added || e.date);
    if (e.status === "new" && when < cutoff) e.status = "stale";
  }
}

// --- run -------------------------------------------------------------------
console.log(`Drafting weekly brief for ${weekAgo} → ${today}`);
let total = 0;
for (const section of tax.sections) {
  process.stdout.write(`  • ${section.label} … `);
  const drafts = await draftSection(section);
  const n = ingest(section, drafts);
  total += n;
  console.log(`${n} new`);
}
ageEntries();

// drop the seed placeholders once real content exists
if (total > 0) entriesDoc.entries = entriesDoc.entries.filter(e => !e.sample);

entriesDoc.entries.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
writeFileSync(join(DATA, "entries.json"), JSON.stringify(entriesDoc, null, 2) + "\n");
writeFileSync(join(DATA, "sources.json"), JSON.stringify(sourcesDoc, null, 2) + "\n");
console.log(`Done. ${total} new entries, ${entriesDoc.entries.length} total, ${sourcesDoc.sources.length} sources.`);
