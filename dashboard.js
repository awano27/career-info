// Dashboard script: fetch KPI JSON and render cards + charts

document.addEventListener('DOMContentLoaded', () => {
  initializeMobileNav();
  loadKpiData();
});

function initializeMobileNav() {
  const mobileMenu = document.getElementById('mobile-menu');
  const navMenu = document.querySelector('.nav-menu');
  if (!mobileMenu || !navMenu) return;
  mobileMenu.addEventListener('click', () => navMenu.classList.toggle('active'));
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => navMenu.classList.remove('active'));
  });
}

async function loadKpiData() {
  try {
    const res = await fetch('data/kpi.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error('kpi.json fetch failed');
    const data = await res.json();
    renderDashboard(data);
  } catch (e) {
    console.error(e);
  }
}

function renderDashboard(kpi) {
  try { updateLastUpdated(kpi.lastUpdated); } catch(_) {}
  try { renderDataSources(kpi.sources || []); } catch(_) {}
  try { renderKpiCards(kpi.metrics || {}); } catch(_) {}
  try { renderCharts(kpi.metrics || {}); } catch(_) {}
}

function updateLastUpdated(iso) {
  const el = document.querySelector('.update-time');
  if (!el || !iso) return;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  const jp = m ? `${m[1]}年${parseInt(m[2],10)}月${parseInt(m[3],10)}日` : iso;
  el.textContent = `最終更新: ${jp}`;
}

function renderDataSources(list) {
  const ul = document.getElementById('dataSourceList');
  if (!ul) return;
  ul.innerHTML = '';
  list.forEach(s => {
    const li = document.createElement('li');
    if (s.url) {
      li.innerHTML = `<a href="${s.url}" target="_blank" rel="noopener">${escapeHtml(s.name || s.url)}</a>`;
    } else {
      li.textContent = s.name || '';
    }
    ul.appendChild(li);
  });
}

function renderKpiCards(metrics) {
  const cards = document.querySelectorAll('.kpi-card');
  if (cards.length < 4) return;

  // 1) 有効求人倍率（最新値、前月比/前年比）
  const jr = metrics.jobRatio || {};
  const jrVals = jr.values || [];
  const jrPrevYear = jr.prevYearValues || [];
  const latest = last(jrVals);
  const prev = jrVals.length >= 2 ? jrVals[jrVals.length - 2] : null;
  const yoy = jrPrevYear.length === jrVals.length ? latest - last(jrPrevYear) : null;
  setKpi(cards[0], formatRatio(latest), changeText(prev != null ? latest - prev : null, yoy));

  // 2) 平均年収（業界平均の平均値）
  const sal = Array.isArray(metrics.salaryByIndustry) ? metrics.salaryByIndustry : [];
  const salAvg = average(sal.map(x => x.avg)).toFixed(0);
  const salPrev = average(sal.map(x => x.prev)).toFixed(0);
  setKpi(cards[1], `${num(salAvg)} 万円`, diffText(salAvg - salPrev));

  // 3) 転職成功率（年代平均）
  const sr = Array.isArray(metrics.successRateByAge) ? metrics.successRateByAge : [];
  const srAvg = average(sr.map(x => x.rate)).toFixed(1);
  const srPrev = average(sr.map(x => x.prev)).toFixed(1);
  setKpi(cards[2], `${num(srAvg)} %`, diffText(srAvg - srPrev));

  // 4) 新規求人数（データ未提供 → 代理で「関東シェア」を表示）
  const rg = Array.isArray(metrics.regionJobShare) ? metrics.regionJobShare : [];
  const kanto = rg.find(x => x.region === '関東');
  const kantoPrev = kanto ? kanto.prev : null;
  const kantoShare = kanto ? kanto.share : null;
  setKpi(cards[3], kantoShare != null ? `${num(kantoShare)} %` : '—', kantoPrev != null ? diffText(kantoShare - kantoPrev) : '—');
}

function setKpi(card, valueText, changeText) {
  if (!card) return;
  const val = card.querySelector('.kpi-value');
  const ch = card.querySelector('.kpi-change');
  if (val) val.textContent = valueText != null ? String(valueText) : '—';
  if (ch) ch.textContent = changeText != null ? String(changeText) : '—';
}

function renderCharts(m) {
  const jr = m.jobRatio || {};
  const labels = jr.months || [];
  const ctx1 = getCtx('jobRatioChart');
  if (ctx1) new Chart(ctx1, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: '求人倍率', data: jr.values || [], borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.15)', fill: true, tension: 0.25 },
        { label: '前年同月', data: jr.prevYearValues || [], borderColor: '#94a3b8', borderDash: [6,4], tension: 0.25 }
      ]
    },
    options: baseLineOptions('倍率')
  });

  const sal = Array.isArray(m.salaryByIndustry) ? m.salaryByIndustry : [];
  const ctx2 = getCtx('salaryChart');
  if (ctx2) new Chart(ctx2, {
    type: 'bar',
    data: {
      labels: sal.map(x => x.industry),
      datasets: [
        { label: '平均年収(万円)', data: sal.map(x => x.avg), backgroundColor: 'rgba(16,185,129,0.6)' },
        { label: '前年(万円)', data: sal.map(x => x.prev), backgroundColor: 'rgba(148,163,184,0.5)' }
      ]
    },
    options: baseBarOptions('万円')
  });

  const rg = Array.isArray(m.regionJobShare) ? m.regionJobShare : [];
  const ctx3 = getCtx('regionChart');
  if (ctx3) new Chart(ctx3, {
    type: 'doughnut',
    data: {
      labels: rg.map(x => x.region),
      datasets: [{
        data: rg.map(x => x.share),
        backgroundColor: ['#60a5fa','#34d399','#f472b6','#f59e0b','#a78bfa','#94a3b8']
      }]
    },
    options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
  });

  const sr = Array.isArray(m.successRateByAge) ? m.successRateByAge : [];
  const ctx4 = getCtx('ageChart');
  if (ctx4) new Chart(ctx4, {
    type: 'radar',
    data: {
      labels: sr.map(x => x.age),
      datasets: [
        { label: '成功率(%)', data: sr.map(x => x.rate), backgroundColor: 'rgba(59,130,246,0.15)', borderColor: '#3b82f6' },
        { label: '前年(%)', data: sr.map(x => x.prev), backgroundColor: 'rgba(148,163,184,0.15)', borderColor: '#94a3b8' }
      ]
    },
    options: { responsive: true, scales: { r: { ticks: { display: false }, angleLines: { color: '#e5e7eb' } } } }
  });
}

function getCtx(id) {
  const el = document.getElementById(id);
  return el ? el.getContext('2d') : null;
}

function baseLineOptions(unit) {
  return {
    responsive: true,
    interaction: { mode: 'index', intersect: false },
    plugins: { legend: { position: 'bottom' } },
    scales: { y: { ticks: { callback: v => `${v} ${unit}` } } }
  };
}
function baseBarOptions(unit) {
  return {
    responsive: true,
    plugins: { legend: { position: 'bottom' } },
    scales: { y: { beginAtZero: true, ticks: { callback: v => `${v} ${unit}` } } }
  };
}

// helpers
function last(arr) { return Array.isArray(arr) && arr.length ? arr[arr.length - 1] : null; }
function average(arr) {
  const nums = arr.map(Number).filter(n => !isNaN(n));
  if (!nums.length) return 0;
  return nums.reduce((a,b) => a + b, 0) / nums.length;
}
function num(n) { return (typeof n === 'number' ? n : parseFloat(n)).toLocaleString('ja-JP'); }
function formatRatio(v) { return v != null ? `${v.toFixed(2)} 倍` : '—'; }
function diffText(delta) {
  const d = typeof delta === 'number' ? delta : parseFloat(delta);
  if (isNaN(d)) return '—';
  const sign = d > 0 ? '+' : (d < 0 ? '' : '±');
  return `前期比 ${sign}${Math.abs(d).toFixed(2)}`;
}
function changeText(mom, yoy) {
  const m = (typeof mom === 'number') ? `前月比 ${mom>=0?'+':''}${mom.toFixed(2)}` : null;
  const y = (typeof yoy === 'number') ? `前年同月比 ${yoy>=0?'+':''}${yoy.toFixed(2)}` : null;
  return [m, y].filter(Boolean).join(' ｜ ');
}
function escapeHtml(text) {
  if (text == null) return '';
  return String(text).replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#039;'}[m]));
}

