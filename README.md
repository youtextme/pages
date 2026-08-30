# Research Briefings (GitHub Pages)

Public, checkable research snapshots — not a blog, not an agent dashboard.

**Live site:** https://youtextme.github.io/pages/

## Live briefing URLs

| Brief | URL |
|-------|-----|
| Homepage | https://youtextme.github.io/pages/ |
| Coupang discounts | https://youtextme.github.io/pages/briefs/coupang-discounts.html |
| Korea Instagram × India | https://youtextme.github.io/pages/briefs/korea-instagram-india.html |
| Einstein relativity | https://youtextme.github.io/pages/briefs/einstein-relativity.html |
| Hyderabad tech salaries | https://youtextme.github.io/pages/briefs/hyderabad-tech-salaries.html |
| Helio City Instagram | https://youtextme.github.io/pages/briefs/helio-city-instagram.html |

## How to add a new briefing

1. **Create a JSON file** in `briefs/` (copy an existing file as a template).

Required fields:

```json
{
  "id": "slug-here",
  "title": "Human title",
  "topic": "Used by taste function",
  "audience": "Used by taste function",
  "asOf": "2026-08-30",
  "governingThought": "One sentence a reader can repeat.",
  "takeaways": ["Max 3 quantified, linked claims"],
  "meceMap": ["Section 1", "Section 2"],
  "sections": [
    {
      "id": "anchor",
      "title": "Section title",
      "blocks": [
        { "type": "paragraph", "text": "Markdown links [label](https://url) supported." },
        { "type": "list", "items": ["bullet"] },
        { "type": "table", "headers": ["A", "B"], "rows": [["1", "2"]] },
        { "type": "callout", "title": "Note", "text": "Highlighted box." }
      ]
    }
  ],
  "sources": [{ "label": "Source name", "url": "https://..." }]
}
```

2. **Mark unverified claims** inline with `[unverified]` — they render highlighted, never silently.

3. **Build the site:**

```bash
node scripts/build.mjs
```

Output lands in `docs/` (GitHub Pages root).

4. **Commit** both `briefs/your-slug.json` and generated `docs/` files.

5. **Push to `main`** — GitHub Actions rebuilds and deploys Pages automatically.

## Site engine

| Piece | Location |
|-------|----------|
| Brief source | `briefs/*.json` |
| Taste function `{topic, audience} → fonts, palette, density, hero}` | `scripts/taste.mjs` |
| HTML generator | `scripts/template.mjs` + `scripts/build.mjs` |
| Shared CSS | `assets/base.css` |
| Published output | `docs/` |

Every briefing page includes:

- **Scan layer (above the fold):** governing thought, audience, ≤3 takeaways, MECE map, as-of date
- **Deep dive:** 3–7 MECE sections
- **Sources:** live URLs at bottom
- **Per-topic taste:** no house purple-gradient theme

## GitHub Pages

- **Source:** `/docs` on `main`
- **Workflow:** `.github/workflows/pages.yml` rebuilds on push
- **Custom domain:** not configured (default `youtextme.github.io/pages`)

## Kill criteria (do not publish if violated)

- Invented handles, people, or prices
- Missing `asOf` date
- Scan layer without quantified takeaways
- Dead links left unmarked
- Personal voice (“I found…”)
