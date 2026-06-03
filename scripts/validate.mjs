#!/usr/bin/env node
/** validate.mjs — check data integrity against the taxonomy and schema. Exits 1 on any problem. */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const DATA = join(dirname(fileURLToPath(import.meta.url)), "..", "data");
const tax = JSON.parse(readFileSync(join(DATA, "taxonomy.json"), "utf8"));
const { entries } = JSON.parse(readFileSync(join(DATA, "entries.json"), "utf8"));
const { sources } = JSON.parse(readFileSync(join(DATA, "sources.json"), "utf8"));

const sectionIds = new Set(tax.sections.map(s => s.id));
const subtagsBySection = Object.fromEntries(tax.sections.map(s => [s.id, new Set(s.subtags.map(t => t.id))]));
const geos = new Set(tax.geographies);
const statuses = new Set(tax.statuses);
const sourceIds = new Set(sources.map(s => s.id));
const sourceTypes = new Set(tax.source_types);

const problems = [];
const ids = new Set();
const DATE = /^\d{4}-\d{2}-\d{2}$/;

for (const e of entries) {
  const at = `entry ${e.id || "(no id)"}`;
  if (!e.id) problems.push(`${at}: missing id`);
  else if (ids.has(e.id)) problems.push(`${at}: duplicate id`); else ids.add(e.id);
  for (const f of ["title", "summary", "why_it_matters"])
    if (!e[f] || !String(e[f]).trim()) problems.push(`${at}: empty ${f}`);
  if (!DATE.test(e.date || "")) problems.push(`${at}: bad date "${e.date}"`);
  if (!sectionIds.has(e.section)) problems.push(`${at}: unknown section "${e.section}"`);
  else if (!subtagsBySection[e.section].has(e.subtag)) problems.push(`${at}: subtag "${e.subtag}" not valid for ${e.section}`);
  if (!Array.isArray(e.geography) || !e.geography.length) problems.push(`${at}: no geography`);
  else for (const g of e.geography) if (!geos.has(g)) problems.push(`${at}: unknown geography "${g}"`);
  if (!statuses.has(e.status)) problems.push(`${at}: unknown status "${e.status}"`);
  for (const sid of e.sources || []) if (!sourceIds.has(sid)) problems.push(`${at}: source ref "${sid}" not in registry`);
}
for (const s of sources)
  if (!sourceTypes.has(s.type)) problems.push(`source ${s.id}: unknown type "${s.type}"`);

if (problems.length) {
  console.error(`✗ ${problems.length} problem(s):\n` + problems.map(p => "  - " + p).join("\n"));
  process.exit(1);
}
console.log(`✓ all clear — ${entries.length} entries, ${sources.length} sources, ${tax.sections.length} sections.`);
