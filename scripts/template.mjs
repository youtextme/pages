import { deriveTaste } from './taste.mjs';

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderInline(text) {
  let out = escapeHtml(text);
  out = out.replace(/\[unverified\]/gi, '<span class="unverified">[unverified]</span>');
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(
    /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
    '<a href="$2" rel="noopener noreferrer">$1</a>'
  );
  return out;
}

function renderParagraph(text) {
  return `<p>${renderInline(text)}</p>`;
}

function renderList(items) {
  return `<ul>${items.map((item) => `<li>${renderInline(item)}</li>`).join('')}</ul>`;
}

function renderTable(table) {
  const head = table.headers.map((h) => `<th>${renderInline(h)}</th>`).join('');
  const rows = table.rows
    .map((row) => `<tr>${row.map((cell) => `<td>${renderInline(cell)}</td>`).join('')}</tr>`)
    .join('');
  return `<div class="table-wrap"><table><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div>`;
}

function renderBlock(block) {
  switch (block.type) {
    case 'paragraph':
      return renderParagraph(block.text);
    case 'list':
      return renderList(block.items);
    case 'table':
      return renderTable(block);
    case 'callout':
      return `<aside class="callout"><strong>${renderInline(block.title || 'Note')}</strong>${renderParagraph(block.text)}</aside>`;
    default:
      return renderParagraph(JSON.stringify(block));
  }
}

function renderSection(section) {
  const blocks = (section.blocks || []).map(renderBlock).join('\n');
  return `<section class="deep-section" id="${escapeHtml(section.id)}">
    <h2>${renderInline(section.title)}</h2>
    ${blocks}
  </section>`;
}

export function renderBriefingPage(brief, basePath = '../') {
  const taste = deriveTaste({ topic: brief.topic, audience: brief.audience });
  const { palette: p, fonts, density, hero, googleFonts } = taste;
  const densityClass = density === 'compact' ? 'density-compact' : density === 'spacious' ? 'density-spacious' : 'density-balanced';
  const asOf = new Date(brief.asOf).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });

  const takeaways = brief.takeaways
    .slice(0, 3)
    .map((t, i) => `<li><span class="takeaway-num">${i + 1}</span><span>${renderInline(t)}</span></li>`)
    .join('');

  const mece = brief.meceMap.map((m) => `<li>${renderInline(m)}</li>`).join('');
  const sections = brief.sections.map(renderSection).join('\n');
  const sources = brief.sources
    .map((s) => `<li><a href="${escapeHtml(s.url)}" rel="noopener noreferrer">${renderInline(s.label)}</a></li>`)
    .join('');

  const fontLink = googleFonts ? `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="${googleFonts}" rel="stylesheet">` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(brief.title)} · Research Briefings</title>
  <meta name="description" content="${escapeHtml(brief.governingThought)}">
  ${fontLink}
  <link rel="stylesheet" href="${basePath}assets/base.css">
  <style>
    :root {
      --bg: ${p.bg};
      --surface: ${p.surface};
      --text: ${p.text};
      --muted: ${p.muted};
      --accent: ${p.accent};
      --border: ${p.border};
      --highlight: ${p.highlight};
      --font-heading: ${fonts.heading};
      --font-body: ${fonts.body};
      --font-mono: ${fonts.mono || '"IBM Plex Mono", monospace'};
    }
  </style>
</head>
<body class="brief-page taste-${taste.id} hero-${hero} ${densityClass}">
  <header class="site-header">
    <a class="back" href="${basePath}index.html">← All briefings</a>
  </header>
  <main>
    <article class="brief">
      <header class="scan-layer">
        <p class="eyebrow">Research briefing · as of ${asOf} UTC</p>
        <h1>${escapeHtml(brief.title)}</h1>
        <p class="governing-thought">${renderInline(brief.governingThought)}</p>
        <div class="scan-meta">
          <div><strong>For</strong> ${renderInline(brief.audience)}</div>
          <div><strong>Topic</strong> ${renderInline(brief.topic)}</div>
        </div>
        <ol class="takeaways">${takeaways}</ol>
        <nav class="mece-map" aria-label="Brief map">
          <strong>Rest of this page</strong>
          <ol>${mece}</ol>
        </nav>
        <p class="as-of-stamp">Verified snapshot: ${asOf} UTC</p>
      </header>
      <div class="deep-dive">
        ${sections}
      </div>
      <footer class="sources">
        <h2>Sources</h2>
        <ol>${sources}</ol>
      </footer>
    </article>
  </main>
</body>
</html>`;
}

export function renderIndexPage(briefs) {
  const cards = briefs
    .map((b) => {
      const asOf = new Date(b.asOf).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
      });
      return `<li class="brief-card">
        <a href="briefs/${escapeHtml(b.id)}.html">
          <span class="card-date">As of ${asOf}</span>
          <span class="card-title">${escapeHtml(b.title)}</span>
          <span class="card-audience">${escapeHtml(b.audience)}</span>
          <span class="card-thought">${escapeInline(b.governingThought)}</span>
        </a>
      </li>`;
    })
    .join('\n');

  function escapeInline(str) {
    return escapeHtml(str).replace(
      /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
      '$1'
    );
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Research Briefings</title>
  <meta name="description" content="Checkable research briefings with dated snapshots, linked sources, and scan-first structure.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="assets/base.css">
  <style>
    :root {
      --bg: #0b0d10;
      --surface: #141820;
      --text: #f3f4f6;
      --muted: #9ca3af;
      --accent: #38bdf8;
      --border: #243041;
      --highlight: #1e293b;
      --font-heading: "Instrument Sans", system-ui, sans-serif;
      --font-body: "Instrument Sans", system-ui, sans-serif;
    }
  </style>
</head>
<body class="index-page">
  <main class="index-shell">
    <header class="index-hero">
      <p class="eyebrow">Public research artifacts</p>
      <h1>Research Briefings</h1>
      <p class="lede">Each page is a dated, source-linked snapshot. Scan the governing thought and three takeaways in ten seconds, then dive.</p>
    </header>
    <ol class="brief-index">${cards}</ol>
  </main>
</body>
</html>`;
}
