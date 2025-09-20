(() => {
  const STORAGE_KEY = 'careerHorizon:companyWatchlist';
  const state = {
    companies: [],
    filters: {
      industry: 'all',
      size: 'all',
      style: 'all',
      kpi: 'salaryMedian',
    },
    watchlist: [],
  };

  document.addEventListener('DOMContentLoaded', () => {
    loadWatchlist();
    wireFilters();
    wireExport();
    fetchCompanies();
  });

  function loadWatchlist(){
    try {
      state.watchlist = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch { state.watchlist = []; }
    renderWatchlist();
    renderComparison();
  }

  function saveWatchlist(){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.watchlist));
    renderWatchlist();
    renderComparison();
  }

  async function fetchCompanies(){
    try {
      const res = await fetch('data/companies.json', { cache: 'no-cache' });
      if(!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      state.companies = Array.isArray(data.companies) ? data.companies : [];
      renderTable();
    } catch (err){
      console.error(err);
      state.companies = [];
      renderTable();
    }
  }

  function wireFilters(){
    const form = document.getElementById('company-filters');
    if(!form) return;
    form.addEventListener('submit', ev => {
      ev.preventDefault();
      state.filters.industry = document.getElementById('company-industry').value;
      state.filters.size = document.getElementById('company-size').value;
      state.filters.style = document.getElementById('company-style').value;
      state.filters.kpi = document.getElementById('company-kpi').value;
      renderTable();
      renderComparison();
    });
    const reset = document.getElementById('company-reset');
    if(reset){
      reset.addEventListener('click', () => {
        state.filters = { industry: 'all', size: 'all', style: 'all', kpi: 'salaryMedian' };
        form.reset();
        renderTable();
        renderComparison();
      });
    }
  }

  function renderTable(){
    const tbody = document.querySelector('#company-table tbody');
    if(!tbody) return;
    const data = getFilteredCompanies();
    if(!data.length){
      tbody.innerHTML = '<tr><td colspan="8">条件に合致する企業がありません。</td></tr>';
      return;
    }
    tbody.innerHTML = data.map(company => `
      <tr data-id="${company.id}">
        <td>${escape(company.name)}</td>
        <td>${escape(company.industryLabel || company.industry)}</td>
        <td>${company.headcount?.toLocaleString('ja-JP') || '---'}</td>
        <td>${company.salaryMedian ? company.salaryMedian.toLocaleString('ja-JP') + ' 万円' : '---'}</td>
        <td>${company.growthRate != null ? company.growthRate + ' %' : '---'}</td>
        <td>${formatWorkstyle(company.workstyle)}</td>
        <td>${escape(company.highlights?.[0] || '注目ポイントを確認してください')}</td>
        <td>
          <button class="ghost-btn" data-action="detail" type="button">詳細</button>
          <button class="ghost-btn" data-action="watch" type="button">比較に追加</button>
        </td>
      </tr>
    `).join('');
    tbody.querySelectorAll('button[data-action="detail"]').forEach(btn => {
      btn.addEventListener('click', () => openDetail(btn.closest('tr').dataset.id));
    });
    tbody.querySelectorAll('button[data-action="watch"]').forEach(btn => {
      btn.addEventListener('click', () => toggleWatchlist(btn.closest('tr').dataset.id));
    });
  }

  function getFilteredCompanies(){
    const headcountMap = { 'under-500': [0, 500], '500-2000': [500, 2000], 'over-2000': [2000, Infinity] };
    return state.companies.filter(company => {
      if(state.filters.industry !== 'all' && company.industry !== state.filters.industry) return false;
      if(state.filters.style !== 'all' && company.workstyle !== state.filters.style) return false;
      if(state.filters.size !== 'all'){
        const range = headcountMap[state.filters.size];
        if(range){
          const count = Number(company.headcount || 0);
          if(count < range[0] || count >= range[1]) return false;
        }
      }
      return true;
    }).sort((a, b) => {
      const key = state.filters.kpi;
      const va = Number(a[key] ?? 0);
      const vb = Number(b[key] ?? 0);
      return vb - va;
    });
  }

  function toggleWatchlist(id){
    if(!id) return;
    const exists = state.watchlist.find(item => item.id === id);
    if(exists){
      state.watchlist = state.watchlist.filter(item => item.id !== id);
    } else {
      const company = state.companies.find(c => c.id === id);
      if(!company) return;
      if(state.watchlist.length >= 3){
        alert('比較は最大 3 社までです。先にウォッチリストを整理してください。');
        return;
      }
      state.watchlist.push({ id: company.id, name: company.name });
    }
    saveWatchlist();
  }

  function renderWatchlist(){
    const container = document.getElementById('company-watchlist');
    if(!container) return;
    if(!state.watchlist.length){
      container.innerHTML = '<p class="muted">ウォッチリストは空です。企業一覧から追加してください。</p>';
      return;
    }
    container.innerHTML = state.watchlist.map(item => `
      <div class="summary-card">
        <div>
          <strong>${escape(item.name)}</strong>
        </div>
        <button class="ghost-btn" data-id="${item.id}" type="button">削除</button>
      </div>
    `).join('');
    container.querySelectorAll('button[data-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.watchlist = state.watchlist.filter(item => item.id !== btn.dataset.id);
        saveWatchlist();
      });
    });
  }

  function renderComparison(){
    const container = document.getElementById('comparison-grid');
    if(!container) return;
    if(!state.watchlist.length){
      container.innerHTML = '<p class="muted">ウォッチリストに企業を追加すると比較表が表示されます。</p>';
      return;
    }
    const selected = state.watchlist.map(item => state.companies.find(c => c.id === item.id)).filter(Boolean);
    container.innerHTML = selected.map(company => `
      <div class="comparison-card">
        <h3>${escape(company.name)}</h3>
        <p class="small-text">${escape(company.industryLabel || company.industry)} / 従業員 ${company.headcount?.toLocaleString('ja-JP') || '---'} 名</p>
        <p>中央値年収: ${company.salaryMedian?.toLocaleString('ja-JP') || '---'} 万円</p>
        <p>売上成長率: ${company.growthRate != null ? company.growthRate + ' %' : '---'}</p>
        <p>離職率: ${company.retention != null ? (100 - company.retention) + ' %' : '---'}</p>
        <p>働き方: ${formatWorkstyle(company.workstyle)}</p>
        <p><strong>福利厚生:</strong> ${escape(company.benefits?.join(' / ') || '---')}</p>
        <p><strong>注目ポイント:</strong> ${escape(company.highlights?.join(' / ') || '---')}</p>
      </div>
    `).join('');
  }

  function openDetail(id){
    const company = state.companies.find(c => c.id === id);
    const modal = document.getElementById('company-modal');
    const title = document.getElementById('company-modal-title');
    const body = document.getElementById('company-modal-body');
    if(!company || !modal || !title || !body) return;
    title.textContent = company.name;
    body.innerHTML = `
      <p class="small-text">業種: ${escape(company.industryLabel || company.industry)} / 本社: ${escape(company.headquarter || '---')}</p>
      <p>従業員数: ${company.headcount?.toLocaleString('ja-JP') || '---'} 名</p>
      <p>中央値年収: ${company.salaryMedian?.toLocaleString('ja-JP') || '---'} 万円 / 売上成長率: ${company.growthRate != null ? company.growthRate + ' %' : '---'}</p>
      <p>リモート比率: ${company.remoteRatio != null ? company.remoteRatio + ' %' : '---'}</p>
      <h4>福利厚生</h4>
      <ul>${(company.benefits || []).map(b => `<li>${escape(b)}</li>`).join('') || '<li>情報未登録</li>'}</ul>
      <h4>面接のポイント</h4>
      <ul>${(company.interviewTips || []).map(t => `<li>${escape(t)}</li>`).join('') || '<li>確認中</li>'}</ul>
      <h4>カルチャー</h4>
      <p>${escape(company.culture || '')}</p>
    `;
    window.CareerSite?.openModal(modal);
  }

  function wireExport(){
    const btn = document.getElementById('watchlist-export');
    if(!btn) return;
    btn.addEventListener('click', () => {
      if(!state.watchlist.length){
        alert('ウォッチリストが空です。');
        return;
      }
      const rows = ['id,name,industry,headcount,salaryMedian,growthRate,remoteRatio'];
      state.watchlist.forEach(item => {
        const company = state.companies.find(c => c.id === item.id);
        if(company){
          rows.push([
            company.id,
            quote(company.name),
            quote(company.industryLabel || company.industry),
            company.headcount,
            company.salaryMedian,
            company.growthRate,
            company.remoteRatio
          ].join(','));
        }
      });
      const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'company_watchlist.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

  function formatWorkstyle(style){
    switch(style){
      case 'remote': return 'リモート中心';
      case 'hybrid': return 'ハイブリッド';
      case 'on-site': return '出社中心';
      default: return '---';
    }
  }

  function escape(text){
    if(text == null) return '';
    return String(text).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }

  function quote(value){
    if(value == null) return '';
    const str = String(value);
    return str.includes(',') ? `"${str.replace(/"/g, '""')}"` : str;
  }
})();
