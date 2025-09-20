const Dashboard = (() => {
  const STORAGE_KEY = 'careerHorizon:dashboardFilters';
  const BOOKMARK_KEY = 'careerHorizon:bookmarks';
  const QUESTIONS_KEY = 'careerHorizon:questions';
  const SURVEY_KEY = 'careerHorizon:survey';

  let kpiData = null;
  let charts = {
    jobRatio: null,
    salary: null,
    region: null,
    age: null
  };
  let filters = { industry: 'all', region: 'all', experience: 'all' };

  document.addEventListener('DOMContentLoaded', init);

  async function init(){
    restoreFilters();
    wireFilterForm();
    wireCommunityForms();
    await loadKpiData();
  }

  function restoreFilters(){
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if(saved){
        filters = { ...filters, ...saved };
      }
    } catch(e){ /* ignore */ }
    // apply to form inputs if present
    const industry = document.getElementById('filter-industry');
    const region = document.getElementById('filter-region');
    const experience = document.getElementById('filter-experience');
    if(industry && filters.industry) industry.value = filters.industry;
    if(region && filters.region) region.value = filters.region;
    if(experience && filters.experience) experience.value = filters.experience;
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
    const resetBtn = document.getElementById('reset-filters');
    if(resetBtn){
      resetBtn.addEventListener('click', () => {
        filters = { industry: 'all', region: 'all', experience: 'all' };
        saveFilters();
        restoreFilters();
        renderDashboard();
      });
    }
  }

  async function loadKpiData(){
    try {
      const response = await fetch('data/kpi.json', { cache: 'no-cache' });
      if(!response.ok) throw new Error(`kpi.json fetch failed: ${response.status}`);
      kpiData = await response.json();
      populateSources();
      populateDefinitionsButton();
      populateInsights();
      renderDashboard();
    } catch(err){
      console.error(err);
      const lastUpdated = document.getElementById('lastUpdated');
      if(lastUpdated) lastUpdated.textContent = '取得に失敗しました';
    }
  }

  function populateSources(){
    if(!kpiData) return;
    const list = document.getElementById('dataSourceList');
    const updated = document.getElementById('lastUpdated');
    if(updated) updated.textContent = formatDate(kpiData.lastUpdated);
    if(list){
      list.innerHTML = '';
      kpiData.sources.forEach(src => {
        const li = document.createElement('li');
        if(src.url){
          li.innerHTML = `<a href="${src.url}" target="_blank" rel="noopener">${escapeHtml(src.name)}</a>`;
        } else {
          li.textContent = src.name;
        }
        list.appendChild(li);
      });
    }
  }

  function populateDefinitionsButton(){
    const trigger = document.querySelector('[data-modal-trigger="definition-modal"]');
    if(!trigger || !kpiData) return;
    trigger.addEventListener('click', () => {
      const modal = document.getElementById('definition-modal');
      const body = document.getElementById('definition-body');
      if(!modal || !body) return;
      body.innerHTML = Object.entries(kpiData.definitions).map(([key, def]) => {
        const actions = (def.recommendedActions || []).map(a => `<li>${escapeHtml(a)}</li>`).join('');
        return `<section style="margin-bottom:1.5rem;">
          <h4 style="margin-bottom:.5rem;">${escapeHtml(def.title)} <small>(${escapeHtml(def.unit)})</small></h4>
          <p>${escapeHtml(def.description)}</p>
          <p><strong>算出方法:</strong> ${escapeHtml(def.calculation || 'N/A')}</p>
          ${actions ? `<ul>${actions}</ul>` : ''}
        </section>`;
      }).join('');
      window.CareerSite?.openModal(modal, trigger);
    });
    document.querySelectorAll('.info-button[data-definition]').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.definition;
        const modal = document.getElementById('definition-modal');
        const body = document.getElementById('definition-body');
        if(!modal || !body || !kpiData) return;
        const def = kpiData.definitions[key];
        if(!def) return;
        const actions = (def.recommendedActions || []).map(a => `<li>${escapeHtml(a)}</li>`).join('');
        body.innerHTML = `
          <section>
            <h4 style="margin-bottom:.5rem;">${escapeHtml(def.title)} <small>(${escapeHtml(def.unit)})</small></h4>
            <p>${escapeHtml(def.description)}</p>
            <p><strong>算出方法:</strong> ${escapeHtml(def.calculation || 'N/A')}</p>
            ${actions ? `<ul>${actions}</ul>` : ''}
          </section>`;
        window.CareerSite?.openModal(modal, btn);
      });
    });
  }

  function renderDashboard(){
    if(!kpiData) return;
    renderKpis();
    renderCharts();
    populateInsights();
  }

  function renderKpis(){
    const metrics = kpiData.metrics;
    const jobSeries = selectJobSeries(filters.industry);
    const overallSeries = selectJobSeries('all');
    const jobCard = document.querySelector('.kpi-card[data-metric="jobRatio"]');
    if(jobCard && jobSeries && overallSeries){
      const latest = last(jobSeries.values);
      const prev = jobSeries.values[jobSeries.values.length - 2];
      const yoy = last(jobSeries.prevYear);
      const gap = latest - last(overallSeries.values);
      setText(jobCard, 'value', `${latest.toFixed(2)} 倍`);
      setText(jobCard, 'change', `前月比 ${(latest - prev >= 0 ? '+' : '')}${(latest - prev).toFixed(2)} / 前年同月比 ${(latest - yoy >= 0 ? '+' : '')}${(latest - yoy).toFixed(2)}`);
      setText(jobCard, 'note', `全国平均との差: ${(gap >= 0 ? '+' : '')}${gap.toFixed(2)} 倍`);
      setText(jobCard, 'context', filters.industry === 'all' ? '全体平均' : jobSeries.name);
    }

    const salaryCard = document.querySelector('.kpi-card[data-metric="salaryMedian"]');
    const industryData = (metrics.salaryMedian.industries || []).find(item => item.key === filters.industry) || metrics.salaryMedian.industries[0];
    if(salaryCard && industryData){
      const expKey = filters.experience === 'all' ? null : filters.experience;
      const experienceValue = expKey ? industryData.experience?.[expKey] : null;
      const median = experienceValue ?? industryData.median;
      const prev = industryData.prev;
      setText(salaryCard, 'value', `${formatNumber(median)} 万円`);
      setText(salaryCard, 'change', `前年比 ${(median - prev >= 0 ? '+' : '')}${(median - prev).toFixed(0)} 万円`);
      setText(salaryCard, 'note', `P75: ${formatNumber(industryData.p75)} 万円 / 業種: ${industryData.industry}`);
    }

    const successCard = document.querySelector('.kpi-card[data-metric="successRate"]');
    const experienceData = (metrics.successRate.experience || []).find(item => item.key === filters.experience) || (metrics.successRate.experience || []).find(item => item.key === 'all');
    if(successCard && experienceData){
      setText(successCard, 'value', `${experienceData.rate.toFixed(0)} %`);
      setText(successCard, 'change', `前年比 ${(experienceData.rate - experienceData.prev >= 0 ? '+' : '')}${(experienceData.rate - experienceData.prev).toFixed(1)} pt`);
      setText(successCard, 'note', experienceData.notes || '');
    }

    const openingsCard = document.querySelector('.kpi-card[data-metric="newOpenings"]');
    const regionData = (metrics.regionJobShare.regions || []).find(item => item.key === filters.region) || metrics.regionJobShare.regions[0];
    if(openingsCard && regionData){
      const delta = regionData.openings.current - regionData.openings.prev4w;
      setText(openingsCard, 'value', `${formatNumber(regionData.openings.current)} 件/週`);
      setText(openingsCard, 'change', `4週平均比 ${(delta >= 0 ? '+' : '')}${formatNumber(delta)} 件`);
      setText(openingsCard, 'note', `求人シェア ${regionData.share.toFixed(1)} %（前月 ${regionData.prev.toFixed(1)} %）`);
    }
  }

  function renderCharts(){
    const ctxJob = getCanvas('jobRatioChart');
    if(ctxJob){
      const series = selectJobSeries(filters.industry);
      const overall = selectJobSeries('all');
      const labels = kpiData.metrics.jobRatio.months.map(m => formatMonth(m));
      const datasets = [];
      if(series){
        datasets.push({
          label: series.name,
          data: series.values,
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37,99,235,0.15)',
          fill: true,
          tension: 0.25
        });
        datasets.push({
          label: `${series.name}（前年同月）`,
          data: series.prevYear,
          borderColor: '#94a3b8',
          borderDash: [6,4],
          tension: 0.25,
          fill: false
        });
      }
      if(overall && filters.industry !== 'all'){
        datasets.push({
          label: '全体平均',
          data: overall.values,
          borderColor: '#22c55e',
          borderDash: [4,2],
          fill: false,
          tension: 0.25
        });
      }
      charts.jobRatio = updateChart(charts.jobRatio, ctxJob, {
        type: 'line',
        data: { labels, datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: { legend: { position: 'bottom' } },
          scales: { y: { ticks: { callback: (v) => `${v} 倍` } } }
        }
      });
    }

    const ctxSalary = getCanvas('salaryChart');
    if(ctxSalary){
      const industries = kpiData.metrics.salaryMedian.industries;
      charts.salary = updateChart(charts.salary, ctxSalary, {
        type: 'bar',
        data: {
          labels: industries.map(i => i.industry),
          datasets: [
            { label: '中央値（万円）', data: industries.map(i => i.median), backgroundColor: '#0ea5e9' },
            { label: '前年（万円）', data: industries.map(i => i.prev), backgroundColor: '#cbd5f5' }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom' } },
          scales: { y: { beginAtZero: true, ticks: { callback: v => `${v} 万円` } } }
        }
      });
    }

    const ctxRegion = getCanvas('regionChart');
    if(ctxRegion){
      const regions = kpiData.metrics.regionJobShare.regions;
      const selectedKey = filters.region;
      const colors = regions.map(r => r.key === selectedKey ? '#f97316' : '#94a3b8');
      charts.region = updateChart(charts.region, ctxRegion, {
        type: 'doughnut',
        data: {
          labels: regions.map(r => r.region),
          datasets: [{ data: regions.map(r => r.share), backgroundColor: colors }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom' } }
        }
      });
    }

    const ctxAge = getCanvas('ageChart');
    if(ctxAge){
      const age = kpiData.metrics.successRate.byAge;
      charts.age = updateChart(charts.age, ctxAge, {
        type: 'radar',
        data: {
          labels: age.map(item => item.age),
          datasets: [
            { label: '現在', data: age.map(item => item.rate), backgroundColor: 'rgba(59,130,246,0.2)', borderColor: '#2563eb' },
            { label: '前年', data: age.map(item => item.prev), backgroundColor: 'rgba(148,163,184,0.15)', borderColor: '#94a3b8' }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: { r: { suggestedMin: 30, suggestedMax: 90, ticks: { display: false } } },
          plugins: { legend: { position: 'bottom' } }
        }
      });
    }
  }

  function populateInsights(){
    const list = document.getElementById('insight-list');
    if(!list || !kpiData) return;
    list.innerHTML = '';
    (kpiData.insights || []).forEach(insight => {
      const article = document.createElement('article');
      article.className = 'summary-card';
      article.innerHTML = `
        <h3>${escapeHtml(insight.title)}</h3>
        <p>${escapeHtml(insight.summary)}</p>
        <ul class="muted">
          <li><strong>企業側:</strong> ${escapeHtml(insight.employerAction)}</li>
          <li><strong>候補者側:</strong> ${escapeHtml(insight.candidateAction)}</li>
        </ul>`;
      list.appendChild(article);
    });
  }

  function selectJobSeries(key){
    const series = kpiData?.metrics?.jobRatio?.series || [];
    return series.find(s => s.key === key) || series.find(s => s.key === 'all');
  }

  function wireCommunityForms(){
    setupBookmarks();
    setupQuestions();
    setupSurvey();
  }

  function setupBookmarks(){
    const form = document.getElementById('bookmark-form');
    const listElm = document.getElementById('bookmark-list');
    if(!form || !listElm) return;
    renderBookmarkList();
    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const input = form.querySelector('input[name="bookmark"]');
      if(!input) return;
      const text = input.value.trim();
      if(!text) return;
      const list = getBookmarks();
      list.push({ text, createdAt: new Date().toISOString(), filters: { ...filters } });
      localStorage.setItem(BOOKMARK_KEY, JSON.stringify(list));
      input.value = '';
      renderBookmarkList();
    });

    function renderBookmarkList(){
      const list = getBookmarks();
      listElm.innerHTML = '';
      if(!list.length){
        listElm.innerHTML = '<li class="muted">保存した指標はまだありません。</li>';
        return;
      }
      list.forEach((item, index) => {
        const li = document.createElement('li');
        li.textContent = `${item.text}（${formatSavedFilters(item.filters)}）`;
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'ghost-btn';
        removeBtn.textContent = '削除';
        removeBtn.addEventListener('click', () => {
          const list = getBookmarks();
          list.splice(index,1);
          localStorage.setItem(BOOKMARK_KEY, JSON.stringify(list));
          renderBookmarkList();
        });
        li.appendChild(removeBtn);
        listElm.appendChild(li);
      });
    }

    function getBookmarks(){
      try { return JSON.parse(localStorage.getItem(BOOKMARK_KEY)) || []; } catch { return []; }
    }
  }

  function setupQuestions(){
    const form = document.getElementById('question-form');
    const status = document.getElementById('question-status');
    if(!form || !status) return;
    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const textarea = form.querySelector('#question-text');
      const text = textarea?.value.trim();
      if(!text){
        status.textContent = '質問内容を入力してください。';
        return;
      }
      const questions = getStoredList(QUESTIONS_KEY);
      questions.push({ text, createdAt: new Date().toISOString() });
      localStorage.setItem(QUESTIONS_KEY, JSON.stringify(questions));
      textarea.value = '';
      status.textContent = `投稿しました（保存済み ${questions.length} 件）。編集部が確認します。`;
    });
  }

  function setupSurvey(){
    const form = document.getElementById('survey-form');
    const downloadBtn = document.getElementById('download-survey');
    if(form){
      form.addEventListener('submit', (ev) => {
        ev.preventDefault();
        const select = document.getElementById('survey-need');
        if(!select) return;
        const responses = getStoredList(SURVEY_KEY);
        responses.push({ value: select.value, label: select.options[select.selectedIndex].text, createdAt: new Date().toISOString() });
        localStorage.setItem(SURVEY_KEY, JSON.stringify(responses));
        const status = form.nextElementSibling;
        if(status && status.classList.contains('small-text')){
          status.textContent = `保存しました（${responses.length} 件）。「CSV を保存」から書き出せます。`;
        }
      });
    }
    if(downloadBtn){
      downloadBtn.addEventListener('click', () => {
        const responses = getStoredList(SURVEY_KEY);
        if(!responses.length){
          alert('まだ回答がありません');
          return;
        }
        const header = 'timestamp,value,label\n';
        const rows = responses.map(r => `${r.createdAt},${r.value},${r.label}`);
        downloadText('survey_responses.csv', header + rows.join('\n'));
      });
    }
  }

  function getStoredList(key){
    try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; }
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
    if(!canvas) return null;
    return canvas.getContext('2d');
  }

  function setText(card, field, value){
    const el = card.querySelector(`[data-field="${field}"]`);
    if(el) el.textContent = value;
  }

  function formatNumber(n){
    return Number(n || 0).toLocaleString('ja-JP');
  }

  function formatSavedFilters(f){
    return `業種:${f.industry || '全体'} / 地域:${f.region || '全国'} / 経験:${f.experience || '全体'}`;
  }

  function formatDate(iso){
    if(!iso) return '未設定';
    const date = new Date(iso);
    if(Number.isNaN(date.getTime())) return iso;
    return `${date.getFullYear()}年${date.getMonth()+1}月${date.getDate()}日`;
  }

  function formatMonth(value){
    const [year, month] = value.split('-');
    return `${Number(month)}月`;
  }

  function last(arr){
    return Array.isArray(arr) && arr.length ? arr[arr.length - 1] : null;
  }

  function escapeHtml(text){
    if(text == null) return '';
    return String(text).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }

  function downloadText(filename, content){
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return { renderDashboard };
})();
