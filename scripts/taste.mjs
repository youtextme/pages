/**
 * Derives visual taste from topic + audience.
 * Returns CSS custom properties and layout hints — no house theme.
 */
export function deriveTaste({ topic, audience }) {
  const key = `${topic}::${audience}`.toLowerCase();

  if (key.includes('shopper') || key.includes('discount') || key.includes('coupang')) {
    return {
      id: 'proof-locker',
      fonts: {
        heading: '"IBM Plex Mono", ui-monospace, monospace',
        body: '"IBM Plex Sans", system-ui, sans-serif',
      },
      palette: {
        bg: '#f4f6f8',
        surface: '#ffffff',
        text: '#0f172a',
        muted: '#475569',
        accent: '#0d9488',
        border: '#cbd5e1',
        highlight: '#ecfdf5',
      },
      density: 'compact',
      hero: 'ledger',
      googleFonts:
        'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500;700&family=IBM+Plex+Sans:wght@400;500;600&display=swap',
    };
  }

  if (key.includes('instagram') && (key.includes('india') || key.includes('korea'))) {
    return {
      id: 'field-notes',
      fonts: {
        heading: '"Source Serif 4", Georgia, serif',
        body: '"DM Sans", system-ui, sans-serif',
      },
      palette: {
        bg: '#faf9f7',
        surface: '#ffffff',
        text: '#1c1917',
        muted: '#57534e',
        accent: '#b45309',
        border: '#e7e5e4',
        highlight: '#fff7ed',
      },
      density: 'balanced',
      hero: 'dossier',
      googleFonts:
        'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Source+Serif+4:opsz,wght@8..60,600;8..60,700&display=swap',
    };
  }

  if (key.includes('relativity') || key.includes('einstein') || key.includes('physics')) {
    return {
      id: 'textbook-calm',
      fonts: {
        heading: '"Libre Baskerville", Georgia, serif',
        body: '"Source Sans 3", system-ui, sans-serif',
      },
      palette: {
        bg: '#f8f7f4',
        surface: '#ffffff',
        text: '#1a1a1a',
        muted: '#4a4a4a',
        accent: '#1e3a5f',
        border: '#d4d0c8',
        highlight: '#eef2f7',
      },
      density: 'spacious',
      hero: 'chapter',
      googleFonts:
        'https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@700&family=Source+Sans+3:wght@400;600&display=swap',
    };
  }

  if (key.includes('salary') || key.includes('job') || key.includes('hyderabad') || key.includes('tech')) {
    return {
      id: 'intel-brief',
      fonts: {
        heading: '"IBM Plex Sans Condensed", system-ui, sans-serif',
        body: '"IBM Plex Sans", system-ui, sans-serif',
      },
      palette: {
        bg: '#eef1f4',
        surface: '#ffffff',
        text: '#111827',
        muted: '#4b5563',
        accent: '#991b1b',
        border: '#d1d5db',
        highlight: '#fef2f2',
      },
      density: 'compact',
      hero: 'briefing',
      googleFonts:
        'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Condensed:wght@600;700&family=IBM+Plex+Sans:wght@400;500;600&display=swap',
    };
  }

  if (key.includes('helio') || key.includes('location')) {
    return {
      id: 'method-report',
      fonts: {
        heading: '"Noto Sans KR", system-ui, sans-serif',
        body: '"Noto Sans KR", system-ui, sans-serif',
        mono: '"JetBrains Mono", ui-monospace, monospace',
      },
      palette: {
        bg: '#f5f5f4',
        surface: '#ffffff',
        text: '#18181b',
        muted: '#52525b',
        accent: '#0369a1',
        border: '#d4d4d8',
        highlight: '#f0f9ff',
      },
      density: 'balanced',
      hero: 'method',
      googleFonts:
        'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500&family=Noto+Sans+KR:wght@400;500;700&display=swap',
    };
  }

  return {
    id: 'default',
    fonts: {
      heading: 'system-ui, sans-serif',
      body: 'system-ui, sans-serif',
    },
    palette: {
      bg: '#fafafa',
      surface: '#ffffff',
      text: '#171717',
      muted: '#525252',
      accent: '#2563eb',
      border: '#e5e5e5',
      highlight: '#eff6ff',
    },
    density: 'balanced',
    hero: 'default',
    googleFonts: null,
  };
}
