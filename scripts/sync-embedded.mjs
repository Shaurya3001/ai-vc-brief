import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const entries = readFileSync(join(ROOT, 'data/entries.json'), 'utf8').trim();
const sources = readFileSync(join(ROOT, 'data/sources.json'), 'utf8').trim();

let html = readFileSync(join(ROOT, 'index.html'), 'utf8');

html = html.replace(
  /(<script id="embedded-entries" type="application\/json">)[\s\S]*?(<\/script>)/,
  (_, open, close) => open + '\n' + entries + '\n' + close
);
html = html.replace(
  /(<script id="embedded-sources" type="application\/json">)[\s\S]*?(<\/script>)/,
  (_, open, close) => open + '\n' + sources + '\n' + close
);

writeFileSync(join(ROOT, 'index.html'), html);
console.log('Embedded JSON synced.');
