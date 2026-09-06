/* global Chart */

const KRW = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'KRW',
  maximumFractionDigits: 0,
});

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const CHART_COLORS = {
  coupang: '#ff6b35',
  eats: '#00c9a7',
  categories: [
    '#ff6b35', '#00c9a7', '#38bdf8', '#a78bfa',
    '#f472b6', '#fbbf24', '#34d399', '#fb923c',
  ],
  grid: '#2a3548',
  text: '#8b9cb3',
};

let charts = {};

function formatKRW(amount) {
  return KRW.format(amount ?? 0);
}

function channelLabel(channel) {
  if (channel === 'coupang-eats' || channel === 'coupangEats' || channel === 'eats') {
    return 'Coupang Eats';
  }
  if (channel === 'coupang') return 'Coupang';
  return channel;
}

function channelClass(channel) {
  if (channel === 'coupang-eats' || channel === 'coupangEats' || channel === 'eats') {
    return 'eats';
  }
  return 'coupang';
}

/**
 * Normalize honest LIVE schema (byMonth/top50/byChannel/meta)
 * and Ship UI schema (monthly/topPurchases/totals) into one view model.
 * Does not invent spend — missing months stay zero.
 */
function normalizeRollups(meta, rollups, ordersPayload) {
  const r = rollups ?? {};
  const metaObj = meta ?? r.meta ?? {};
  const orders = Array.isArray(ordersPayload)
    ? ordersPayload
    : (ordersPayload?.orders ?? []);

  // --- byChannel ---
  let byChannelArr = [];
  if (Array.isArray(r.byChannel) && r.byChannel.length) {
    byChannelArr = r.byChannel.map((c) => ({
      channel: c.channel ?? (c.label === 'Coupang Eats' ? 'coupang-eats' : 'coupang'),
      label: c.label ?? channelLabel(c.channel),
      amount: c.amount ?? c.krw ?? 0,
      count: c.count ?? 0,
    }));
  } else if (r.byChannel && typeof r.byChannel === 'object') {
    const bc = r.byChannel;
    byChannelArr = [
      {
        channel: 'coupang',
        label: 'Coupang',
        amount: bc.coupang?.krw ?? bc.coupang?.amount ?? 0,
        count: bc.coupang?.count ?? 0,
      },
      {
        channel: 'coupang-eats',
        label: 'Coupang Eats',
        amount: bc.eats?.krw ?? bc.coupangEats?.krw ?? bc.eats?.amount ?? 0,
        count: bc.eats?.count ?? bc.coupangEats?.count ?? 0,
      },
    ];
  }

  // --- totals ---
  let totals = r.totals ? { ...r.totals } : null;
  if (!totals) {
    const coupang = byChannelArr.find((c) => channelClass(c.channel) === 'coupang')?.amount ?? 0;
    const eats = byChannelArr.find((c) => channelClass(c.channel) === 'eats')?.amount ?? 0;
    const all = metaObj.totalKrw ?? (coupang + eats);
    totals = { all, coupang, coupangEats: eats };
  }

  // --- monthly / byMonth ---
  let monthly = Array.isArray(r.monthly) ? r.monthly.slice() : [];
  if (!monthly.length && r.byMonth && typeof r.byMonth === 'object') {
    monthly = Object.keys(r.byMonth)
      .sort()
      .map((month) => {
        const row = r.byMonth[month] || {};
        return {
          month,
          coupang: row.coupang ?? 0,
          coupangEats: row.eats ?? row.coupangEats ?? 0,
          all: (row.coupang ?? 0) + (row.eats ?? row.coupangEats ?? 0),
          counts: { coupang: row.count ?? 0, coupangEats: 0 },
        };
      });
  }

  // --- top50 / topPurchases ---
  // ALWAYS remap field names — live JSON uses amountKrw/label/purchasedAt
  function mapPurchase(p) {
    return {
      name: p.name ?? p.label ?? p.title ?? p.item ?? 'Unknown',
      date: p.date ?? p.purchasedAt ?? null,
      amount: p.amount ?? p.amountKrw ?? 0,
      channel: p.channel === 'eats' ? 'coupang-eats' : (p.channel ?? 'coupang'),
    };
  }
  let topPurchases = [];
  if (Array.isArray(r.topPurchases) && r.topPurchases.length) {
    topPurchases = r.topPurchases.map(mapPurchase);
  } else if (Array.isArray(r.top50) && r.top50.length) {
    topPurchases = r.top50.map(mapPurchase);
  } else if (orders.length) {
    topPurchases = orders
      .slice()
      .sort((a, b) => (b.amountKrw ?? b.amount ?? 0) - (a.amountKrw ?? a.amount ?? 0))
      .slice(0, 50)
      .map(mapPurchase);
  }

  // --- byCategory ---
  let byCategory = Array.isArray(r.byCategory) ? r.byCategory.slice() : [];
  byCategory = byCategory.map((c) => ({
    label: c.label ?? c.category ?? 'Other',
    amount: c.amount ?? c.krw ?? 0,
    count: c.count ?? 0,
  }));

  // --- insights ---
  let insights = Array.isArray(r.insights) ? r.insights.slice() : [];
  if (!insights.length) {
    const missing = metaObj.monthsMissing ?? r.monthsMissing ?? [];
    const present = metaObj.monthsPresent ?? [];
    if (metaObj.dateMin && metaObj.dateMax) {
      insights.push(`Dated window ${metaObj.dateMin} → ${metaObj.dateMax} (honest LIVE).`);
    }
    if (present.length) insights.push(`Months with spend: ${present.join(', ')}.`);
    if (missing.length) {
      insights.push(`${missing.length} months missing — gaps shown, not invented: ${missing.join(', ')}.`);
    }
    if (metaObj.orderCount != null) insights.push(`${metaObj.orderCount} orders in export.`);
  }

  return {
    meta: metaObj,
    totals,
    monthly,
    byChannel: byChannelArr,
    topPurchases,
    byCategory,
    insights,
  };
}

async function loadData() {
  const [meta, orders, rollups] = await Promise.all([
    fetch('data/META.json').then((r) => r.json()),
    fetch('data/orders-12mo.json').then((r) => r.json()),
    fetch('data/rollups-12mo.json').then((r) => r.json()),
  ]);
  const view = normalizeRollups(meta, rollups, orders);
  return { meta: view.meta, orders, rollups: view };
}

function renderHero(rollups, meta) {
  const totals = rollups.totals ?? {};
  document.getElementById('total-spend').textContent = formatKRW(totals.all);
  document.getElementById('coupang-spend').textContent = formatKRW(totals.coupang);
  document.getElementById('eats-spend').textContent = formatKRW(totals.coupangEats);

  const orderCount = meta.orderCount ?? (rollups.topPurchases?.length ?? 0);
  document.getElementById('order-count').textContent =
    orderCount === 0 ? 'No orders yet' : `${orderCount} orders`;

  const coupangPct = totals.all > 0
    ? Math.round((totals.coupang / totals.all) * 100)
    : 0;
  const eatsPct = totals.all > 0
    ? Math.round((totals.coupangEats / totals.all) * 100)
    : 0;
  document.getElementById('coupang-pct').textContent =
    totals.all > 0 ? `${coupangPct}% of total` : '—';
  document.getElementById('eats-pct').textContent =
    totals.all > 0 ? `${eatsPct}% of total` : '—';
}

function renderStatusBanner(meta) {
  const banner = document.getElementById('status-banner');
  if (!meta.coverageNote || meta.coverageNote === 'complete') {
    banner.hidden = true;
    return;
  }
  banner.hidden = false;
  document.getElementById('status-text').textContent = meta.coverageNote;
}

function buildMonthlyLabels(monthly) {
  if (!monthly.length) {
    const now = new Date();
    const labels = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push(`${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}`);
    }
    return labels;
  }
  return monthly.map((m) => {
    const [y, mo] = (m.month ?? '').split('-');
    const idx = parseInt(mo, 10) - 1;
    return `${MONTH_LABELS[idx] ?? mo} ${y}`;
  });
}

function chartDefaults() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: CHART_COLORS.text, font: { family: "'DM Sans', sans-serif" } },
      },
    },
    scales: {
      x: {
        ticks: { color: CHART_COLORS.text, maxRotation: 45 },
        grid: { color: CHART_COLORS.grid },
      },
      y: {
        ticks: {
          color: CHART_COLORS.text,
          callback: (v) => `₩${(v / 1000).toFixed(0)}k`,
        },
        grid: { color: CHART_COLORS.grid },
      },
    },
  };
}

function renderMonthlyChart(rollups) {
  const ctx = document.getElementById('chart-monthly');
  const monthly = rollups.monthly ?? [];
  const labels = buildMonthlyLabels(monthly);

  const coupangData = monthly.length
    ? monthly.map((m) => m.coupang ?? 0)
    : labels.map(() => 0);
  const eatsData = monthly.length
    ? monthly.map((m) => m.coupangEats ?? 0)
    : labels.map(() => 0);

  if (charts.monthly) charts.monthly.destroy();
  charts.monthly = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Coupang',
          data: coupangData,
          backgroundColor: CHART_COLORS.coupang,
          borderRadius: 4,
        },
        {
          label: 'Coupang Eats',
          data: eatsData,
          backgroundColor: CHART_COLORS.eats,
          borderRadius: 4,
        },
      ],
    },
    options: {
      ...chartDefaults(),
      scales: {
        ...chartDefaults().scales,
        x: { ...chartDefaults().scales.x, stacked: true },
        y: { ...chartDefaults().scales.y, stacked: true },
      },
    },
  });
}

function renderCategoryChart(rollups) {
  const ctx = document.getElementById('chart-category');
  const categories = rollups.byCategory ?? [];

  const labels = categories.length
    ? categories.map((c) => c.label ?? c.category)
    : ['No data'];
  const data = categories.length
    ? categories.map((c) => c.amount ?? 0)
    : [1];
  const colors = categories.length
    ? CHART_COLORS.categories.slice(0, categories.length)
    : ['#2a3548'];

  if (charts.category) charts.category.destroy();
  charts.category = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        borderColor: '#121820',
        borderWidth: 2,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: { color: CHART_COLORS.text, font: { family: "'DM Sans', sans-serif", size: 11 } },
        },
      },
    },
  });
}

function renderChannelChart(rollups) {
  const ctx = document.getElementById('chart-channel');
  const channels = rollups.byChannel ?? [
    { label: 'Coupang', amount: 0 },
    { label: 'Coupang Eats', amount: 0 },
  ];

  if (charts.channel) charts.channel.destroy();
  charts.channel = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: channels.map((c) => c.label ?? channelLabel(c.channel)),
      datasets: [{
        label: 'Spend (₩)',
        data: channels.map((c) => c.amount ?? 0),
        backgroundColor: [CHART_COLORS.coupang, CHART_COLORS.eats],
        borderRadius: 6,
      }],
    },
    options: {
      ...chartDefaults(),
      indexAxis: 'y',
      plugins: { legend: { display: false } },
    },
  });
}

function renderTopPurchases(rollups) {
  const tbody = document.getElementById('top-purchases-body');
  const purchases = (rollups.topPurchases ?? []).slice(0, 50);

  if (!purchases.length) {
    tbody.innerHTML =
      '<tr class="empty-row"><td colspan="5">No purchases loaded — awaiting live Gmail export.</td></tr>';
    return;
  }

  tbody.innerHTML = purchases
    .map((p, i) => {
      const ch = p.channel ?? 'coupang';
      const date = p.date
        ? new Date(p.date).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
          })
        : '—';
      return `<tr>
        <td>${i + 1}</td>
        <td>${escapeHtml(p.name ?? p.item ?? 'Unknown')}</td>
        <td>${date}</td>
        <td class="amount">${formatKRW(p.amount)}</td>
        <td><span class="channel-badge ${channelClass(ch)}">${channelLabel(ch)}</span></td>
      </tr>`;
    })
    .join('');
}

function renderCategories(rollups) {
  const grid = document.getElementById('category-grid');
  const categories = rollups.byCategory ?? [];

  if (!categories.length) {
    grid.innerHTML =
      '<p style="color:var(--muted);font-style:italic;margin:0">No category breakdown yet.</p>';
    return;
  }

  grid.innerHTML = categories
    .map((c) => `<div class="category-item">
      <div class="cat-label">${escapeHtml(c.label ?? c.category)}</div>
      <div class="cat-amount">${formatKRW(c.amount)}</div>
      <div class="cat-count">${c.count ?? 0} orders</div>
    </div>`)
    .join('');
}

function renderInsights(rollups) {
  const list = document.getElementById('insights-list');
  const insights = rollups.insights ?? [];

  list.innerHTML = insights
    .map((text) => `<li>${escapeHtml(text)}</li>`)
    .join('');
}

function renderFooter(meta) {
  const stamp = meta.generatedAt || meta.exportedAt;
  const generated = stamp
    ? new Date(stamp).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
    : 'not yet generated';
  document.getElementById('footer-generated').textContent = `Data as of: ${generated}`;
  document.getElementById('footer-source').textContent = `Source: ${meta.dataSource ?? 'unknown'}`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

async function init() {
  try {
    const { meta, rollups } = await loadData();
    renderStatusBanner(meta);
    renderHero(rollups, meta);
    renderMonthlyChart(rollups);
    renderCategoryChart(rollups);
    renderChannelChart(rollups);
    renderTopPurchases(rollups);
    renderCategories(rollups);
    renderInsights(rollups);
    renderFooter(meta);
  } catch (err) {
    console.error('Failed to load dashboard data:', err);
    document.getElementById('status-banner').hidden = false;
    document.getElementById('status-text').textContent =
      'Failed to load data files. Check that data/*.json are present.';
  }
}

document.addEventListener('DOMContentLoaded', init);
