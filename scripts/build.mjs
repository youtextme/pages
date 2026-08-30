import { readdir, readFile, mkdir, writeFile, cp } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderBriefingPage, renderIndexPage } from './template.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const briefsDir = join(root, 'briefs');
const docsDir = join(root, 'docs');
const assetsSrc = join(root, 'assets');
const assetsDest = join(docsDir, 'assets');

async function loadBriefs() {
  const files = (await readdir(briefsDir)).filter((f) => f.endsWith('.json'));
  const briefs = [];
  for (const file of files) {
    const raw = await readFile(join(briefsDir, file), 'utf8');
    briefs.push(JSON.parse(raw));
  }
  briefs.sort((a, b) => new Date(b.asOf) - new Date(a.asOf));
  return briefs;
}

async function build() {
  const briefs = await loadBriefs();
  await mkdir(join(docsDir, 'briefs'), { recursive: true });
  await mkdir(assetsDest, { recursive: true });

  await cp(assetsSrc, assetsDest, { recursive: true });

  await writeFile(join(docsDir, 'index.html'), renderIndexPage(briefs), 'utf8');

  for (const brief of briefs) {
    const html = renderBriefingPage(brief, '../');
    await writeFile(join(docsDir, 'briefs', `${brief.id}.html`), html, 'utf8');
  }

  console.log(`Built ${briefs.length} briefings → docs/`);
  for (const b of briefs) {
    console.log(`  • ${b.id}.html`);
  }
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
