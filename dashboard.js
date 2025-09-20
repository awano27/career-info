(() => {
  const STORAGE_KEY = 'careerHorizon:dashboardFilters';
  let dashboardData = null;
  let charts = { jobRatio: null, regionRatio: null, salary: null, success: null };
  let filters = { industry: 'all', region: 'all', experience: 'all' };

  document.addEventListener('DOMContentLoaded', () => {
    restoreFilters();
    wireFilterForm();
    loadKpi();
  });

  async function loadKpi(){
    try {
      const res = await fetch('data/kpi.json', { cache: 'no-cache' });
      if(!res.ok) throw new Error(`HTTP ${res.status}`);
      dashboardData = await res.json();
      populateSources();
      populateDefinitions();
      renderDashboard();
    } catch (err) {
      console.error(err);
      const updated = document.getElementById('lastUpdated');
      if(updated) updated.textContent = '取得に失敗しました';
    }
  }

  function restoreFilters(){
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if(saved){ filters = { ...filters, ...saved }; }
    } catch (_) {}
    const industry = document.getElementById('filter-industry');
    const region = document.getElementById('filter-region');
    const experience = document.getElementById('filter-experience');
    if(industry) industry.value = filters.industry;
    if(region) region.value = filters.region;
    if(experience) experience.value = filters.experience;
  }

  function saveFilters(){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  }

  function wireFilterForm(){
    const form = document.getElementById('dashboard-filters');
    if(!form) return;
    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      filters.industry = form.industry.value;
      filters.region = form.region.value;
      filters.experience = form.experience.value;
      saveFilters();
      renderDashboard();
    });
    const reset = document.getElementById('reset-filters');
    if(reset){
      reset.addEventListener('click', () => {
        filters = { industry: 'all', region: 'all', experience: 'all' };
        saveFilters();
        restoreFilters();
        renderDashboard();
      });
    }
  }

  function populateSources(){
    if(!dashboardData) return;
    const list = document.getElementById('dataSourceList');
    const updated = document.getElementById('lastUpdated');
    if(updated && dashboardData.lastUpdated){
      updated.textContent = formatDate(dashboardData.lastUpdated);
    }
    if(list){
      list.innerHTML = '';
      dashboardData.sources.forEach(src => {
        const li = document.createElement('li');
        if(src.url){
          li.innerHTML = `<a href="${src.url}" target="_blank" rel="noopener">${escapeHtml(src.name)}</a>`;
        } else {
          li.textContent = escapeHtml(src.name || '');
        }
        list.appendChild(li);
      });
    }
  }

  function populateDefinitions(){
    const trigger = document.querySelector('[data-modal-trigger="definition-modal"]');
    if(!trigger || !dashboardData) return;
    trigger.addEventListener('click', () => openDefinitionModal());
    document.querySelectorAll('.info-button[data-definition]').forEach(btn => {
      btn.addEventListener('click', () => openDefinitionModal(btn.dataset.definition, btn));
    });
  }

  function openDefinitionModal(key, focusEl){
    if(!dashboardData) return;
    const modal = document.getElementById('definition-modal');
    const body = document.getElementById('definition-body');
    if(!modal || !body) return;
    const defs = dashboardData.definitions || {};
    if(key){
      const def = defs[key];
      if(!def) return;
      body.innerHTML = renderDefinition(def);
    } else {
      body.innerHTML = Object.values(defs).map(renderDefinition).join('');
    }
    window.CareerSite?.openModal(modal, focusEl);
  }

  function renderDefinition(def){
    const actions = Array.isArray(def.recommendedActions) ? def.recommendedActions.map(a => `<li>${escapeHtml(a)}</li>`).join('') : '';
    return `<section class="definition-block">
      <h4>${escapeHtml(def.title)} <small>(${escapeHtml(def.unit || '')})</small></h4>
      <p>${escapeHtml(def.description || '')}</p>
      <p><strong>算出方法:</strong> ${escapeHtml(def.calculation || 'N/A')}</p>
      ${actions ? `<ul>${actions}</ul>` : ''}
    </section>`;
  }

  function renderDashboard(){
    if(!dashboardData) return;
    renderKpis();
    renderCharts();
  }

  function renderKpis(){
    updateJobRatioCard();
    updateUnemploymentCard();
    updateSalaryCard();
    updateSuccessCard();
    updateNewOpeningsCard();
  }

  function updateJobRatioCard(){
    const card = document.querySelector('.kpi-card[data-metric="jobRatio"]');
    if(!card) return;
    const series = selectJobSeries(filters.industry);
    if(!series) return;
    const latest = last(series.values);
    const prev = series.values[series.values.length - 2] ?? null;
    const yoy = last(series.prevYear);
    setText(card, 'value', latest != null ? `${latest.toFixed(2)} 倍` : '--');
    setText(card, 'change', changeLabel('前月比', latest, prev));
    setText(card, 'note', yoy != null ? `前年同月比 ${(latest - yoy).toFixed(2)}` : '前年同月比 --');
  }

  function updateUnemploymentCard(){
    const card = document.querySelector('.kpi-card[data-metric="unemploymentRate"]');
    if(!card) return;
    const data = dashboardData.metrics?.unemploymentRate;
    if(!data) return;
    const latest = last(data.values);
    const prev = data.values[data.values.length - 2] ?? null;
    const yoy = data.prevYear ? last(data.prevYear) : null;
    setText(card, 'value', latest != null ? `${latest.toFixed(1)} %` : '--');
    setText(card, 'change', changeLabel('前月比', latest, prev));
    setText(card, 'note', yoy != null ? `前年同月比 ${(latest - yoy).toFixed(1)} pt` : '前年同月比 --');
  }

  function updateSalaryCard(){
    const card = document.querySelector('.kpi-card[data-metric="salaryMedian"]');
    if(!card) return;
    const industries = dashboardData.metrics?.salaryMedian?.industries || [];
    const match = industries.find(item => item.key === filters.industry) || industries.find(item => item.key === 'it') || industries[0];
    if(!match) return;
    const expKey = filters.experience !== 'all' ? filters.experience : null;
    const value = expKey && match.experience ? match.experience[expKey] : match.median;
    const prev = match.prev;
    setText(card, 'value', value != null ? `${formatNumber(value)} 万円` : '--');
    setText(card, 'change', changeLabel('前年比', value, prev));
    setText(card, 'note', match.p75 ? `P75: ${formatNumber(match.p75)} 万円` : 'P75 --');
  }

  function updateSuccessCard(){
    const card = document.querySelector('.kpi-card[data-metric="successRate"]');
    if(!card) return;
    const exp = dashboardData.metrics?.successRate?.experience || [];
    const match = exp.find(item => item.key === filters.experience) || exp.find(item => item.key === 'all');
    if(!match) return;
    setText(card, 'value', `${match.rate.toFixed(0)} %`);
    setText(card, 'change', changeLabel('前年比', match.rate, match.prev, 1));
    setText(card, 'note', match.notes || '');
  }

  function updateNewOpeningsCard(){
    const card = document.querySelector('.kpi-card[data-metric="newOpenings"]');
    if(!card) return;
    const regions = dashboardData.metrics?.newOpenings?.regions || [];
    const match = regions.find(item => item.key === filters.region) || regions.find(item => item.key === 'kanto') || regions[0];
    if(!match) return;
    const current = match.openings?.current ?? null;
    const prev = match.openings?.prev4w ?? null;
    setText(card, 'value', current != null ? `${formatNumber(current)} 件/週` : '--');
    setText(card, 'change', changeLabel('4週平均比', current, prev));
    setText(card, 'note', `地域: ${match.region}`);
  }

  function renderCharts(){
    renderJobRatioChart();
    renderRegionRatioChart();
    renderSalaryChart();
    renderSuccessChart();
  }

  function renderJobRatioChart(){
    const ctx = getCanvas('jobRatioChart');
    if(!ctx || !dashboardData) return;
    const job = dashboardData.metrics?.jobRatio;
    if(!job) return;
    const labels = job.months.map(formatMonth);
    const datasets = [];
    const selected = selectJobSeries(filters.industry);
    if(selected){
      datasets.push({
        label: `${selected.name}`,
        data: selected.values,
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37,99,235,0.18)',
        fill: true,
        tension: 0.24
      });
    }
    const overall = selectJobSeries('all');
    if(overall && overall !== selected){
      datasets.push({
        label: '全体平均',
        data: overall.values,
        borderColor: '#0ea5e9',
        borderDash: [6,4],
        fill: false,
        tension: 0.24
      });
    }
    const reference = (job.referenceSeries || []).find(s => s.key === 'doda');
    if(reference){
      datasets.push({
        label: reference.name || 'DODA求人倍率',
        data: reference.values,
        borderColor: '#f97316',
        borderDash: [2,2],
        pointRadius: 2,
        fill: false,
        tension: 0.18
      });
    }
    charts.jobRatio = updateChart(charts.jobRatio, ctx, {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: { legend: { position: 'bottom' } },
        scales: { y: { title: { display: true, text: '倍率' }, suggestedMin: 0.6 } }
      }
    });
  }

  function renderRegionRatioChart(){
    const ctx = getCanvas('regionJobRatioChart');
    if(!ctx || !dashboardData) return;
    const regionData = dashboardData.metrics?.regionJobRatio;
    if(!regionData) return;
    const labels = regionData.months.map(formatMonth);
    const datasets = (regionData.regions || []).map(region => {
      const isActive = filters.region !== 'all' && filters.region === region.key;
      return {
        label: region.name,
        data: region.values,
        borderColor: isActive ? '#22c55e' : '#94a3b8',
        backgroundColor: 'rgba(34,197,94,0.12)',
        borderWidth: isActive ? 3 : 1.5,
        fill: isActive,
        tension: 0.18,
        pointRadius: 0
      };
    });
    charts.regionRatio = updateChart(charts.regionRatio, ctx, {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: { legend: { position: 'bottom' } },
        scales: { y: { title: { display: true, text: '倍率' }, suggestedMin: 0.6 } }
      }
    });
  }

  function renderSalaryChart(){
    const ctx = getCanvas('salaryChart');
    if(!ctx || !dashboardData) return;
    const industries = dashboardData.metrics?.salaryMedian?.industries || [];
    charts.salary = updateChart(charts.salary, ctx, {
      type: 'bar',
      data: {
        labels: industries.map(i => i.industry),
        datasets: [
          { label: '中央値', data: industries.map(i => i.median), backgroundColor: 'rgba(37,99,235,0.65)' },
          { label: '前年比', data: industries.map(i => i.prev), backgroundColor: 'rgba(148,163,184,0.5)' }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
        scales: { y: { title: { display: true, text: '万円' }, beginAtZero: true } }
      }
    });
  }

  function renderSuccessChart(){
    const ctx = getCanvas('ageChart');
    if(!ctx || !dashboardData) return;
    const age = dashboardData.metrics?.successRate?.byAge || [];
    charts.success = updateChart(charts.success, ctx, {
      type: 'radar',
      data: {
        labels: age.map(item => item.age),
        datasets: [
          { label: '現在', data: age.map(item => item.rate), backgroundColor: 'rgba(37,99,235,0.18)', borderColor: '#2563eb' },
          { label: '前年', data: age.map(item => item.prev), backgroundColor: 'rgba(148,163,184,0.12)', borderColor: '#94a3b8' }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { r: { suggestedMin: 40, suggestedMax: 90, ticks: { display: false } } },
        plugins: { legend: { position: 'bottom' } }
      }
    });
  }

  function selectJobSeries(key){
    const series = dashboardData.metrics?.jobRatio?.series || [];
    return series.find(item => item.key === key) || series.find(item => item.key === 'all') || null;
  }

  function updateChart(instance, ctx, config){
    if(instance){
      instance.data = config.data;
      instance.options = config.options;
      instance.update();
      return instance;
    }
    return new Chart(ctx, config);
  }

  function getCanvas(id){
    const canvas = document.getElementById(id);
    return canvas ? canvas.getContext('2d') : null;
  }

  function setText(card, field, value){
    const target = card.querySelector(`[data-field="${field}"]`);
    if(target){ target.textContent = value; }
  }

  function last(arr){
    return Array.isArray(arr) && arr.length ? arr[arr.length - 1] : null;
  }

  function changeLabel(label, current, previous, digits = 2){
    if(current == null || previous == null) return `${label} --`;
    const diff = current - previous;
    const sign = diff > 0 ? '+' : '';
    return `${label} ${sign}${diff.toFixed(digits)}`;
  }

  function formatDate(value){
    if(!value) return '未設定';
    const date = new Date(value);
    if(Number.isNaN(date.getTime())) return value;
    return `${date.getFullYear()}年${date.getMonth()+1}月${date.getDate()}日`;
  }

  function formatMonth(value){
    const parts = value.split('-');
    return `${Number(parts[1])}月`;
  }

  function escapeHtml(text){
    if(text == null) return '';
    return String(text).replace(/[&<>"']/g, (m) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[m]));
  }
})();
