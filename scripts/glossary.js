(() => {
  let terms = [];
  let faq = [];

  document.addEventListener('DOMContentLoaded', () => {
    fetchGlossary();
    const search = document.getElementById('glossary-search');
    if(search){
      search.addEventListener('input', () => renderTerms(search.value.trim()));
    }
  });

  async function fetchGlossary(){
    try {
      const res = await fetch('data/glossary.json', { cache: 'no-cache' });
      if(!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      terms = Array.isArray(data.terms) ? data.terms : [];
      faq = Array.isArray(data.faq) ? data.faq : [];
      terms.sort((a, b) => (a.term || '').localeCompare(b.term || '', 'ja'));
      renderTerms('');
      renderFaq();
      injectJsonLd();
    } catch (err){
      console.error(err);
      renderTerms('');
    }
  }

  function renderTerms(query){
    const container = document.getElementById('glossary-list');
    if(!container) return;
    const lower = (query || '').toLowerCase();
    const filtered = terms.filter(term => {
      if(!lower) return true;
      const haystack = `${term.term || ''} ${term.reading || ''} ${term.definition || ''}`.toLowerCase();
      return haystack.includes(lower);
    });
    if(!filtered.length){
      container.innerHTML = '<p class="muted">該当する用語が見つかりませんでした。</p>';
      return;
    }
    container.innerHTML = filtered.map(item => `
      <details class="glossary-item">
        <summary><span class="glossary-term">${escape(item.term)}</span> <span class="small-text">${escape(item.reading || '')}</span></summary>
        <p>${escape(item.definition || '')}</p>
        <p class="small-text">カテゴリー: ${escape(item.category || '---')}</p>
      </details>
    `).join('');
  }

  function renderFaq(){
    const container = document.getElementById('faq-list');
    if(!container) return;
    if(!faq.length){
      container.innerHTML = '<p class="muted">FAQ は現在準備中です。</p>';
      return;
    }
    container.innerHTML = faq.map(item => `
      <details open>
        <summary>Q. ${escape(item.question)}</summary>
        <p>A. ${escape(item.answer)}</p>
      </details>
    `).join('');
  }

  function injectJsonLd(){
    const target = document.getElementById('faq-jsonld');
    if(!target) return;
    const entities = faq.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer }
    }));
    target.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: entities });
  }

  function escape(text){
    if(text == null) return '';
    return String(text).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }
})();
