// News page interactions (clean UTF-8)

document.addEventListener('DOMContentLoaded', () => {
  initializeMobileNav();
  initializeNews();
});

function initializeMobileNav(){
  const mobileMenu=document.getElementById('mobile-menu'); const navMenu=document.querySelector('.nav-menu');
  if(mobileMenu&&navMenu){ mobileMenu.addEventListener('click',()=>navMenu.classList.toggle('active')); document.querySelectorAll('.nav-link').forEach(a=>a.addEventListener('click',()=>navMenu.classList.remove('active'))); }
}

let __category='all', __subcategory='all', __items=[];
function initializeNews(){
  wireFilters(); wireSearch(); wireLoadMore(); injectStructuredData(); fetchDynamicNews();
}

function wireFilters(){
  const cats=document.querySelectorAll('.news-categories .category-btn'); const subWrap=document.getElementById('employment-subcategories'); const subs=subWrap? subWrap.querySelectorAll('.subcategory-btn'): [];
  cats.forEach(btn=>btn.addEventListener('click',function(){ __category=this.dataset.category||'all'; cats.forEach(b=>b.classList.remove('active')); this.classList.add('active'); if(__category==='employment'&&subWrap){ subWrap.style.display=''; } else if(subWrap){ subWrap.style.display='none'; __subcategory='all'; subs.forEach(s=>s.classList.remove('active')); subWrap.querySelector('[data-subcategory="all"]').classList.add('active'); } renderNews(); }));
  subs.forEach(btn=>btn.addEventListener('click',function(){ __subcategory=this.dataset.subcategory||'all'; subs.forEach(s=>s.classList.remove('active')); this.classList.add('active'); renderNews(); }));
}

function wireSearch(){
  const input=document.querySelector('.search-input'); const result=document.getElementById('search-result'); if(!input) return;
  input.addEventListener('keydown',e=>{ if(e.key==='Enter'){ renderNews(input.value.trim()); }});
  input.addEventListener('search',()=>{ input.value=''; result.textContent=''; renderNews(); });
}

function wireLoadMore(){ const btn=document.querySelector('.load-more-btn'); if(!btn) return; btn.addEventListener('click',function(){ this.textContent='読み込み中...'; this.disabled=true; setTimeout(()=>{ appendMore(); this.textContent='さらに記事を読み込む'; this.disabled=false; },1000); }); }

function injectStructuredData(){
  // Lightweight site-level JSON-LD example
  const ld = { '@context':'https://schema.org', '@type':'WebSite', name:'Career Horizon', url: location.origin+location.pathname };
  const s = document.createElement('script'); s.type='application/ld+json'; s.textContent=JSON.stringify(ld); document.head.appendChild(s);
}

async function fetchDynamicNews(){
  try {
    const r = await fetch('data/news.json', { cache:'no-cache' });
    if(!r.ok) throw new Error('HTTP '+r.status);
    const db = await r.json();
    __items = Array.isArray(db.items)? db.items : [];
    const up = document.querySelector('.update-time'); if (db.lastUpdated && up) up.textContent = `最終更新: ${new Date(db.lastUpdated).toLocaleString()}`;
    renderNews();
  } catch(e) {
    __items = [];
    renderNews();
  }
}

function renderNews(query=''){
  const grid=document.getElementById('news-grid'); const input=document.querySelector('.search-input'); const result=document.getElementById('search-result'); if(!grid) return;
  const q = (query||'').toLowerCase();
  const filtered = (__items||[]).filter(it=>{
    const catOk = __category==='all' || (it.categoryClass||'').toLowerCase()===__category;
    const subOk = __category!=='employment' || __subcategory==='all' || (it.subcategory||'')===__subcategory;
    const text = `${it.title||''} ${stripTags(it.fullContent||'')}`.toLowerCase();
    const queryOk = !q || text.includes(q);
    return catOk && subOk && queryOk;
  });
  grid.innerHTML = filtered.slice(0,20).map(renderCard).join('');
  if(result){ result.textContent = q? `${filtered.length}件ヒット` : ''; }
  // Reset tag filters area
  const tagsArea=document.getElementById('tag-filters'); tagsArea && (tagsArea.innerHTML='');
}

function renderCard(it){
  const cat = it.category || 'ニュース'; const catClass = it.categoryClass || 'market';
  const date = it.date || '';
  return `
    <article class="news-card" data-category="${catClass}">
      <div class="news-image"><div class="placeholder-image">📰</div></div>
      <div class="news-content">
        <div class="news-meta"><span class="category-tag ${catClass}">${cat}</span><span class="news-date">${date}</span></div>
        <h3>${escapeHtml(it.title||'無題')}</h3>
        <p>${truncate(stripTags(it.fullContent||''), 120)}</p>
        <div class="news-actions">
          <a href="#" class="read-more" onclick="openFullArticle(event, '${it.id||''}')">続きを読む →</a>
          ${it.sourceUrl? `<a class="source-btn" href="${it.sourceUrl}" target="_blank" rel="noopener">出典</a>`:''}
        </div>
      </div>
    </article>`;
}

function appendMore(){
  const grid=document.getElementById('news-grid'); const current=grid.children.length; const more=__items.slice(current, current+10); grid.insertAdjacentHTML('beforeend', more.map(renderCard).join(''));
}

// Modal
function openFullArticle(e, id){ e?.preventDefault(); const item = (__items||[]).find(x=>x.id===id); if(!item) return; const modal=document.getElementById('articleModal'); const t=document.getElementById('modalTitle'); const b=document.getElementById('modalBody'); t.textContent=item.title||'無題'; b.innerHTML=item.fullContent||''; modal.style.display='block'; document.body.style.overflow='hidden'; setupFocusTrap(modal); }
function closeModal(){ const modal=document.getElementById('articleModal'); if(modal){ modal.style.display='none'; document.body.style.overflow=''; }}
function showPageSource(){ openFullArticle(null, null); const t=document.getElementById('modalTitle'); const b=document.getElementById('modalBody'); t.textContent='ページ情報'; b.innerHTML='<p>このページは data/news.json を読み込み、カテゴリ/タグでのフィルタとモーダル表示を提供します。</p>'; document.getElementById('articleModal').style.display='block'; }
function showStructuredData(){ const s = Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map(n=>n.textContent).join('\n'); openFullArticle(null,null); document.getElementById('modalTitle').textContent='構造化データ（JSON-LD）'; document.getElementById('modalBody').innerHTML = `<pre style="white-space:pre-wrap">${escapeHtml(s||'（なし）')}</pre>`; }
function setupFocusTrap(modal){ const f=modal.querySelectorAll('a,button,input,select,textarea,[tabindex]'); const first=f[0], last=f[f.length-1]; modal.addEventListener('keydown',e=>{ if(e.key==='Tab'){ if(e.shiftKey && document.activeElement===first){ e.preventDefault(); last.focus(); } else if(!e.shiftKey && document.activeElement===last){ e.preventDefault(); first.focus(); } } if(e.key==='Escape'){ closeModal(); } }); first?.focus(); }

// Utils
function stripTags(html){ const tmp=document.createElement('div'); tmp.innerHTML=html; return tmp.textContent||tmp.innerText||''; }
function escapeHtml(s){ return (s||'').replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c])); }
function truncate(s,n){ if(!s) return ''; if(s.length<=n) return s; return s.slice(0,n-1)+'…'; }

// expose for onclick
window.openFullArticle = openFullArticle;
window.closeModal = closeModal;
window.showPageSource = showPageSource;
window.showStructuredData = showStructuredData;

