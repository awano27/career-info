(() => {
  const NEWS_KEY = 'careerHorizon:newsWatchlist';
  const BRIEF_TEMPLATE = `【主要トピック】\n{title}\n\n【要約】\n{summary}\n\n【注目指標】\n{insight}\n\n【次のアクション】\n- 企業側: {employer}\n- 候補者側: {candidate}`;

  const state = {
    category: 'all',
    search: '',
    items: [],
    highlights: [],
    watchlist: [],
    hasCustomBrief: false,
  };

  const ui = {
    briefButton: null,
    briefOutput: null,
    briefStatus: null,
    watchlistStatus: null,
    clearWatchlist: null,
  };

  document.addEventListener('DOMContentLoaded', () => {
    captureUi();
    setBriefAvailability(false, 'データ読み込み中です…');
    loadWatchlist();
    wireFilters();
    wireSearch();
    wireNewsletter();
    wireBriefGenerator();
    wireWatchlistControls();
    fetchNews();
  });

  function captureUi(){
    ui.briefButton = document.getElementById('generate-brief');
    ui.briefOutput = document.getElementById('brief-output');
    ui.briefStatus = document.getElementById('brief-status');
    ui.watchlistStatus = document.getElementById('watchlist-status');
    ui.clearWatchlist = document.getElementById('clear-watchlist');
  }

  function loadWatchlist(){
    try {
      state.watchlist = JSON.parse(localStorage.getItem(NEWS_KEY)) || [];
    } catch {
      state.watchlist = [];
    }
    renderWatchlist();
    updateWatchlistStatus();
  }

  function saveWatchlist(feedback){
    localStorage.setItem(NEWS_KEY, JSON.stringify(state.watchlist));
    renderWatchlist();
    updateWatchlistStatus(feedback);
  }

  function wireFilters(){
    document.querySelectorAll('#category-chips .chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('#category-chips .chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        state.category = chip.dataset.category || 'all';
        renderNews();
      });
    });
  }

  function wireSearch(){
    const input = document.getElementById('news-search-input');
    if(!input) return;
    input.addEventListener('keydown', ev => {
      if(ev.key === 'Enter'){
        state.search = input.value.trim().toLowerCase();
        renderNews();
      } else if(ev.key === 'Escape'){
        input.value = '';
        state.search = '';
        renderNews();
      }
    });
  }

  function wireNewsletter(){
    const form = document.getElementById('news-newsletter');
    const status = document.getElementById('news-newsletter-status');
    if(!form || !status) return;
    form.addEventListener('submit', ev => {
      ev.preventDefault();
      const email = form.querySelector('input[type="email"]').value.trim();
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
        status.textContent = 'メールアドレスの形式をご確認ください。';
        return;
      }
      status.textContent = '登録しました。最新の週次レポートをお届けします。';
      form.reset();
    });
  }

  function wireBriefGenerator(){
    if(!ui.briefButton || !ui.briefOutput) return;
    ui.briefButton.addEventListener('click', () => {
      const list = getFilteredItems();
      if(!list.length){
        ui.briefOutput.value = '該当する記事がありません。カテゴリや検索条件を調整してください。';
        updateBriefStatus('条件に合う記事が見つかりませんでした。');
        return;
      }
      const top = list[0];
      ui.briefOutput.value = buildBrief(top);
      ui.briefOutput.focus();
      state.hasCustomBrief = true;
      updateBriefStatus(`「${top.title || '最新ニュース'}」を元にブリーフを生成しました。`);
    });
  }

  function wireWatchlistControls(){
    if(!ui.clearWatchlist) return;
    ui.clearWatchlist.addEventListener('click', () => {
      state.watchlist = [];
      saveWatchlist('ウォッチリストを空にしました。');
    });
  }

  async function fetchNews(){
    try {
      const res = await fetch('data/news.json', { cache: 'no-cache' });
      if(!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      state.items = Array.isArray(data.items) ? data.items : [];
      state.highlights = Array.isArray(data.highlights) ? data.highlights : [];
      updateMeta(data);
      renderHighlights();
      renderNews();
      injectJsonLd(state.items);
      if(state.items.length){
        setBriefAvailability(true, '最新の記事を元にブリーフを作成できます。');
        if(!state.hasCustomBrief && ui.briefOutput){
          ui.briefOutput.value = buildBrief(state.items[0]);
          updateBriefStatus(`「${state.items[0].title || '最新ニュース'}」のサマリーをプレビュー表示中です。`);
        }
      } else {
        setBriefAvailability(false, '記事データを取得できませんでした。');
        if(ui.briefOutput && !state.hasCustomBrief){
          ui.briefOutput.value = '最新の記事情報が取得できませんでした。';
        }
      }
    } catch (err){
      console.error(err);
      state.items = [];
      renderNews();
      setBriefAvailability(false, 'ニュースデータの取得に失敗しました。再読み込みしてください。');
      if(ui.briefOutput && !state.hasCustomBrief){
        ui.briefOutput.value = 'ニュースデータの取得に失敗しました。再読み込みしてください。';
      }
    }
  }

  function updateMeta(data){
    const updated = document.getElementById('news-lastUpdated');
    if(updated && data.lastUpdated){
      const d = new Date(data.lastUpdated);
      if(!Number.isNaN(d.getTime())){
        updated.textContent = `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日 ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
      }
    }
  }

  function renderHighlights(){
    const container = document.getElementById('editorial-highlights');
    if(!container) return;
    if(!state.highlights.length){
      container.innerHTML = '<article class="summary-card"><h3>ハイライトは準備中です</h3><p class="muted">最新データの取り込み後に更新されます。</p></article>';
      return;
    }
    container.innerHTML = state.highlights.map(h => `
      <article class="summary-card">
        <h3>${escape(h.title)}</h3>
        <p>${escape(h.summary)}</p>
        ${h.link ? `<a class="arrow-link" href="${h.link}" target="_blank" rel="noopener">一次ソースを見る →</a>` : ''}
      </article>
    `).join('');
  }

  function renderNews(){
    const grid = document.getElementById('news-grid');
    if(!grid) return;
    const list = getFilteredItems();
    if(!list.length){
      grid.innerHTML = '<p class="muted">該当する記事が見つかりませんでした。</p>';
      return;
    }
    grid.innerHTML = list.map(renderCard).join('');
    wireCardActions();
  }

  function getFilteredItems(){
    return state.items.filter(item => {
      const categoryOk = state.category === 'all' || (item.categoryClass || '').toLowerCase() === state.category;
      const searchSource = `${item.title || ''} ${item.summary || ''} ${strip(item.fullContent || '')}`.toLowerCase();
      const searchOk = !state.search || searchSource.includes(state.search);
      return categoryOk && searchOk;
    });
  }

  function renderCard(item){
    const tags = (item.tags || []).map(t => `<span class="category-tag">${escape(t)}</span>`).join(' ');
    const summary = item.summary || `${strip(item.fullContent || '').slice(0, 140)}…`;
    const source = item.source || '---';
    return `
      <article class="news-card" data-id="${escape(item.id)}">
        <div class="news-image">📰</div>
        <div class="news-content">
          <div class="news-meta">
            <span>${escape(item.category || 'ニュース')}</span>
            <span class="news-date">${escape(item.date || '')}</span>
          </div>
          <h3>${escape(item.title || 'タイトル未設定')}</h3>
          <p>${escape(summary)}</p>
          <div class="small-text">${tags || '<span class="muted">タグ未設定</span>'}</div>
          <div class="small-text">信頼度: ${escape(item.reliability || '---')} / 出典: ${escape(source)}</div>
          <div class="news-actions">
            <button class="ghost-btn" data-action="read" type="button">続きを読む</button>
            <button class="ghost-btn" data-action="watch" type="button">ウォッチリストに追加</button>
            ${item.sourceUrl ? `<a class="source-btn" href="${item.sourceUrl}" target="_blank" rel="noopener">出典を見る</a>` : ''}
          </div>
        </div>
      </article>
    `;
  }

  function wireCardActions(){
    document.querySelectorAll('.news-card').forEach(card => {
      const id = card.dataset.id;
      card.querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', () => {
          if(btn.dataset.action === 'read') openArticle(id);
          if(btn.dataset.action === 'watch') addToWatchlist(id);
        });
      });
    });
  }

  function openArticle(id){
    const modal = document.getElementById('article-modal');
    const titleEl = document.getElementById('article-modal-title');
    const bodyEl = document.getElementById('article-modal-body');
    if(!modal || !titleEl || !bodyEl) return;
    const item = state.items.find(x => x.id === id);
    if(!item){
      bodyEl.innerHTML = '<p>記事データを取得できませんでした。</p>';
    } else {
      titleEl.textContent = item.title || '記事詳細';
      bodyEl.innerHTML = `
        <p class="small-text">${escape(item.date || '')} / ${escape(item.source || '')}</p>
        <p>${escape(item.summary || '')}</p>
        ${item.editorComment ? `<p><strong>編集部コメント:</strong> ${escape(item.editorComment)}</p>` : ''}
        ${item.actionItems ? `<ul><li><strong>企業側:</strong> ${escape(item.actionItems.employer || '')}</li><li><strong>候補者側:</strong> ${escape(item.actionItems.candidate || '')}</li></ul>` : ''}
        ${item.fullContent || '<p>本文の詳細は準備中です。</p>'}
      `;
    }
    window.CareerSite?.openModal(modal);
  }

  function addToWatchlist(id){
    const item = state.items.find(x => x.id === id);
    if(!item){
      updateWatchlistStatus('記事データを取得できませんでした。');
      return;
    }
    if(state.watchlist.some(w => w.id === id)){
      updateWatchlistStatus('すでにウォッチリストに保存されています。');
      return;
    }
    state.watchlist.push({
      id,
      title: item.title,
      date: item.date,
      source: item.source,
      addedAt: new Date().toISOString(),
    });
    saveWatchlist(`「${item.title || '記事'}」を保存しました。`);
  }

  function renderWatchlist(){
    const list = document.getElementById('watchlist');
    if(!list) return;
    if(!state.watchlist.length){
      list.innerHTML = '<li class="muted">保存された記事はまだありません。</li>';
      return;
    }
    list.innerHTML = state.watchlist.map((item, index) => `
      <li class="bookmark-list-item">
        <div>
          <strong>${escape(item.title || '')}</strong>
          <div class="small-text">${escape(item.date || '')} / ${escape(item.source || '')}</div>
        </div>
        <button class="ghost-btn" data-index="${index}" type="button">削除</button>
      </li>
    `).join('');
    list.querySelectorAll('button[data-index]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.index);
        state.watchlist.splice(idx, 1);
        saveWatchlist('ウォッチリストから削除しました。');
      });
    });
  }

  function updateWatchlistStatus(message){
    if(ui.watchlistStatus){
      if(message){
        ui.watchlistStatus.textContent = message;
      } else if(state.watchlist.length){
        ui.watchlistStatus.textContent = `保存件数: ${state.watchlist.length} 件`;
      } else {
        ui.watchlistStatus.textContent = 'ウォッチリストに追加するとここに表示されます。';
      }
    }
    if(ui.clearWatchlist){
      const disabled = state.watchlist.length === 0;
      ui.clearWatchlist.disabled = disabled;
      ui.clearWatchlist.setAttribute('aria-disabled', String(disabled));
    }
  }

  function setBriefAvailability(enabled, message){
    if(ui.briefButton){
      ui.briefButton.disabled = !enabled;
      ui.briefButton.setAttribute('aria-disabled', String(!enabled));
    }
    if(message) updateBriefStatus(message);
  }

  function updateBriefStatus(message){
    if(ui.briefStatus && message){
      ui.briefStatus.textContent = message;
    }
  }

  function buildBrief(item){
    if(!item) return '最新の記事情報が取得できませんでした。';
    const summary = (item.summary && item.summary.trim()) || `${strip(item.fullContent || '').slice(0, 150)}…`;
    const bits = [];
    if(item.tags?.length) bits.push(item.tags.join(' / '));
    if(item.category) bits.push(`カテゴリ: ${item.category}`);
    if(item.reliability) bits.push(`信頼度: ${item.reliability}`);
    const insight = bits.join(' | ') || '---';
    const employer = item.actionItems?.employer || '採用側の次のアクションを追記してください。';
    const candidate = item.actionItems?.candidate || '候補者向けの示唆を追記してください。';
    const title = `${item.title || '最新ニュース'}（${formatDateLabel(item.date)}）`;
    return BRIEF_TEMPLATE
      .replace('{title}', title)
      .replace('{summary}', summary)
      .replace('{insight}', insight)
      .replace('{employer}', employer)
      .replace('{candidate}', candidate);
  }

  function formatDateLabel(dateLike){
    if(!dateLike) return '';
    const d = new Date(dateLike);
    if(Number.isNaN(d.getTime())) return dateLike;
    return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日`;
  }

  function injectJsonLd(items){
    const target = document.getElementById('news-jsonld');
    if(!target) return;
    const articles = items.slice(0, 10).map(item => ({
      '@type': 'NewsArticle',
      headline: item.title,
      datePublished: item.date,
      author: item.author ? { '@type': 'Person', name: item.author } : undefined,
      publisher: item.source || 'Career Horizon',
      url: item.sourceUrl || 'https://career-horizon.example/news',
      description: item.summary || strip(item.fullContent || '').slice(0, 120)
    }));
    target.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'ItemList', itemListElement: articles });
  }

  function strip(html){
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }

  function escape(text){
    if(text == null) return '';
    return String(text).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }
})();
