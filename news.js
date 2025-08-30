// News Page JavaScript for Filtering and Interactions

document.addEventListener('DOMContentLoaded', function() {
    // Initialize mobile navigation
    initializeMobileNav();
    
    // Initialize news filtering
    initializeNewsFiltering();
    
    // Initialize load more functionality
    initializeLoadMore();
    
    // Initialize newsletter signup
    initializeNewsletter();

    // Initialize search
    initializeSearch();

    // Enhance cards with tags/reliability and add tag filters
    enhanceNewsCards();
    initializeTagFilters();
    // Delegate handlers for dynamically added cards
    initializeDelegatedHandlers();

    // Inject structured data (JSON-LD) dynamically
    injectStructuredData();

    // Load dynamic news from data/news.json (if present)
    fetchDynamicNews();
    
    // Add fade-in animation to news cards
    animateNewsCards();
});

// Mobile Navigation
function initializeMobileNav() {
    const mobileMenu = document.getElementById('mobile-menu');
    const navMenu = document.querySelector('.nav-menu');

    if (mobileMenu && navMenu) {
        mobileMenu.addEventListener('click', function() {
            navMenu.classList.toggle('active');
        });

        // Close mobile menu when clicking on a link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
            });
        });
    }
}

// News Category Filtering
function initializeNewsFiltering() {
    const categoryButtons = document.querySelectorAll('.category-btn');
    const newsCards = document.querySelectorAll('.news-card');

    categoryButtons.forEach(button => {
        button.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            
            // Update active button
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Filter news cards
            filterNewsCards(category, newsCards);
        });
    });
}

// Filter news cards based on category
function filterNewsCards(category, newsCards) {
    newsCards.forEach(card => {
        const cardCategory = card.getAttribute('data-category');
        
        if (category === 'all' || cardCategory === category) {
            card.style.display = 'block';
            card.classList.add('fade-in');
        } else {
            card.style.display = 'none';
            card.classList.remove('fade-in');
        }
    });
    
    // Re-animate visible cards
    setTimeout(() => {
        animateNewsCards();
    }, 100);
}

// Load More Functionality
function initializeLoadMore() {
    const loadMoreBtn = document.querySelector('.load-more-btn');
    
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', function() {
            this.textContent = '読み込み中...';
            this.disabled = true;
            
            // Simulate loading delay
            setTimeout(() => {
                loadMoreNews();
                this.textContent = 'さらに記事を読み込む';
                this.disabled = false;
            }, 1500);
        });
    }
}

// Load more news articles
function loadMoreNews() {
    const newsGrid = document.querySelector('.news-grid');
    const additionalNews = generateAdditionalNews();
    
    additionalNews.forEach(newsHTML => {
        const newsCard = document.createElement('div');
        newsCard.innerHTML = newsHTML;
        newsCard.firstElementChild.classList.add('fade-in');
        newsGrid.appendChild(newsCard.firstElementChild);
    });
}

// Generate additional news articles
function generateAdditionalNews() {
    const additionalArticles = [
        {
            category: 'industry',
            categoryClass: 'industry',
            date: '2025年8月13日',
            emoji: '🤖',
            title: 'AI導入により変化する職場環境：新たなスキルへの需要',
            content: 'AI技術の普及により、従来の業務が自動化される一方で、AI運用や管理に関する新しいスキルセットが求められています。'
        },
        {
            category: 'market',
            categoryClass: 'market',
            date: '2025年8月12日',
            emoji: '📊',
            title: '副業解禁が転職市場に与える影響を分析',
            content: '大手企業の副業解禁により、転職以外のキャリア選択肢が増加。市場全体の動向に変化が見られています。'
        },
        {
            category: 'expert',
            categoryClass: 'expert',
            date: '2025年8月11日',
            emoji: '💡',
            title: 'ジョブ型雇用時代の自己PR戦略',
            content: '専門性重視のジョブ型雇用が広がる中、効果的な自己PRの方法について人事コンサルタントが解説します。'
        }
    ];

    return additionalArticles.map(article => `
        <article class="news-card" data-category="${article.category}">
            <div class="news-image">
                <div class="placeholder-image">${article.emoji}</div>
            </div>
            <div class="news-content">
                <div class="news-meta">
                    <span class="category-tag ${article.categoryClass}">${article.category === 'industry' ? '業界トレンド' : article.category === 'market' ? '市場動向' : '専門家コラム'}</span>
                    <span class="news-date">${article.date}</span>
                </div>
                <h3>${article.title}</h3>
                <p>${article.content}</p>
                <a href="#" class="read-more">続きを読む →</a>
            </div>
        </article>
    `);
}

// Newsletter Signup
function initializeNewsletter() {
    const newsletterForm = document.querySelector('.newsletter-form');
    const newsletterInput = document.querySelector('.newsletter-input');
    const newsletterBtn = document.querySelector('.newsletter-btn');

    if (newsletterBtn && newsletterInput) {
        newsletterBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const email = newsletterInput.value.trim();
            
            if (validateEmail(email)) {
                handleNewsletterSignup(email);
            } else {
                showMessage('有効なメールアドレスを入力してください', 'error');
            }
        });

        newsletterInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                newsletterBtn.click();
            }
        });
    }
}

// Handle newsletter signup
function handleNewsletterSignup(email) {
    const newsletterBtn = document.querySelector('.newsletter-btn');
    const originalText = newsletterBtn.textContent;
    
    newsletterBtn.textContent = '登録中...';
    newsletterBtn.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
        showMessage('ニュースレターの登録が完了しました！', 'success');
        document.querySelector('.newsletter-input').value = '';
        newsletterBtn.textContent = originalText;
        newsletterBtn.disabled = false;
    }, 1500);
}

// Validate email format
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Show message to user
function showMessage(message, type) {
    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${type}`;
    messageDiv.textContent = message;
    
    // Style the message
    Object.assign(messageDiv.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '1rem 1.5rem',
        borderRadius: '8px',
        color: 'white',
        fontWeight: '600',
        zIndex: '9999',
        transform: 'translateX(100%)',
        transition: 'transform 0.3s ease',
        backgroundColor: type === 'success' ? '#10b981' : '#ef4444'
    });
    
    document.body.appendChild(messageDiv);
    
    // Animate in
    setTimeout(() => {
        messageDiv.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        messageDiv.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(messageDiv);
        }, 300);
    }, 3000);
}

// Animate news cards on scroll
function animateNewsCards() {
    const newsCards = document.querySelectorAll('.news-card:not(.animated)');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.classList.add('fade-in', 'animated');
                }, index * 100);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '50px'
    });

    newsCards.forEach(card => {
        observer.observe(card);
    });
}

// Search functionality (for future implementation)
function initializeSearch() {
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        const debounced = debounce((e) => {
            const query = (e.target.value || '').trim().toLowerCase();
            searchNews(query);
        }, 200);
        searchInput.addEventListener('input', debounced);
        // Enterキーで明示的に確定
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                searchNews((searchInput.value || '').trim().toLowerCase());
            }
        });
    }
}

// Search news articles
function searchNews(query) {
    const newsCards = document.querySelectorAll('.news-card');
    const resultEl = document.getElementById('search-result');
    let count = 0;

    const escapeReg = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const highlight = (el, q) => {
        const titleEl = el.querySelector('h3');
        if (!titleEl) return;
        if (!titleEl.dataset.originalTitle) {
            titleEl.dataset.originalTitle = titleEl.innerHTML;
        }
        if (!q) {
            titleEl.innerHTML = titleEl.dataset.originalTitle;
            return;
        }
        const re = new RegExp(`(${escapeReg(q)})`, 'ig');
        titleEl.innerHTML = titleEl.dataset.originalTitle.replace(re, '<mark>$1</mark>');
    };

    newsCards.forEach(card => {
        const h3 = card.querySelector('h3');
        const p = card.querySelector('p');
        const title = (h3 ? h3.textContent : '').toLowerCase();
        const content = (p ? p.textContent : '').toLowerCase();

        const match = !query || title.includes(query) || content.includes(query);
        card.style.display = match ? 'block' : 'none';
        if (match) {
            count++;
        }
        highlight(card, query);
    });

    if (resultEl) {
        if (!query) {
            resultEl.textContent = '';
        } else {
            resultEl.textContent = `${count} 件ヒット`;
        }
    }
}

// Utility function to debounce search
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Modal Functions
function openFullArticle(event, articleId) {
    event.preventDefault();
    const modal = document.getElementById('articleModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    const articles = getArticleData();
    const article = articles[articleId];
    
    if (article) {
        modalTitle.textContent = article.title;
        const mainHtml = `
            <div class="article-meta">
                <span class="category-tag ${article.categoryClass}">${article.category}</span>
                <span class="article-date">${article.date}</span>
            </div>
            <div class="article-content">
                ${article.fullContent}
            </div>
        `;
        // Related articles (same category)
        const related = Object.entries(articles)
          .filter(([id, a]) => id !== articleId && a.categoryClass === article.categoryClass)
          .slice(0, 3);
        const relatedHtml = related.length ? `
          <div class="related-articles">
            <h4>関連記事</h4>
            <div class="related-list">
              ${related.map(([id, a]) => `<a href="#" onclick="openFullArticle(event, '${id}')">${a.title}</a>`).join('')}
            </div>
          </div>
        ` : '';

        modalBody.innerHTML = mainHtml + relatedHtml;
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        const closeBtn = modal.querySelector('.close');
        if (closeBtn) closeBtn.focus();
        setupArticleFocusTrap(modal);
    }
}

function showSource(event, articleId) {
    event.preventDefault();
    const modal = document.getElementById('articleModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    const articles = getArticleData();
    const article = articles[articleId];
    
    if (article) {
        modalTitle.textContent = 'ソース情報';
        modalBody.innerHTML = `
            <h4>${article.title}</h4>
            <div class="source-info">
                <h4>📊 データソース</h4>
                <p><strong>出典:</strong> ${article.source}</p>
                <p><strong>調査機関:</strong> ${article.organization}</p>
                <p><strong>調査期間:</strong> ${article.period}</p>
                <p><strong>サンプル数:</strong> ${article.sampleSize}</p>
            </div>
            <div class="source-info">
                <h4>🔍 信頼性情報</h4>
                <p><strong>信頼度:</strong> ${article.reliability}</p>
                <p><strong>更新頻度:</strong> ${article.updateFrequency}</p>
                <p><strong>関連リンク:</strong> <a href="${article.sourceUrl}" target="_blank">${article.sourceUrl}</a></p>
            </div>
        `;
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        const closeBtn = modal.querySelector('.close');
        if (closeBtn) closeBtn.focus();
        setupArticleFocusTrap(modal);
    }
}

function closeModal() {
    const modal = document.getElementById('articleModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    removeArticleFocusTrap();
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('articleModal');
    if (event.target === modal) {
        closeModal();
    }
}

// Close modal on ESC
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const modal = document.getElementById('articleModal');
        if (modal && modal.style.display === 'block') {
            closeModal();
        }
    }
});

// Focus trap for article modal
let articleFocusTrapHandler = null;
function setupArticleFocusTrap(modal) {
    const selectors = 'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])';
    const focusables = Array.from(modal.querySelectorAll(selectors)).filter(el => !el.hasAttribute('disabled'));
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    articleFocusTrapHandler = function(e) {
        if (e.key !== 'Tab') return;
        if (e.shiftKey) {
            if (document.activeElement === first) { e.preventDefault(); last.focus(); }
        } else {
            if (document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
    };
    document.addEventListener('keydown', articleFocusTrapHandler);
}
function removeArticleFocusTrap() {
    if (articleFocusTrapHandler) {
        document.removeEventListener('keydown', articleFocusTrapHandler);
        articleFocusTrapHandler = null;
    }
}

// -------- Dynamic news (data/news.json) --------
let __dynamicNews = {};
async function fetchDynamicNews() {
    try {
        const res = await fetch('data/news.json', { cache: 'no-cache' });
        if (!res.ok) return;
        const data = await res.json();
        const items = Array.isArray(data.items) ? data.items : [];
        if (!items.length) return;
        const grid = document.querySelector('.news-grid');
        if (!grid) return;
        const frag = document.createDocumentFragment();
        items.forEach(item => {
            __dynamicNews[item.id] = item;
            const art = document.createElement('article');
            art.className = 'news-card';
            art.setAttribute('data-category', item.categoryClass || 'market');
            art.innerHTML = `
              <div class="news-image"><div class="placeholder-image">📰</div></div>
              <div class="news-content">
                <div class="news-meta">
                  <span class="category-tag ${item.categoryClass || 'market'}">${item.category || ''}</span>
                  <span class="news-date">${item.date || ''}</span>
                </div>
                <h3>${item.title}</h3>
                <p>${(item.fullContent || '').replace(/<[^>]+>/g,' ').slice(0,140)}...</p>
                <div class="news-actions">
                  <a href="#" class="read-more" onclick="openDynamicArticle(event, '${item.id}')">続きを読む →</a>
                  ${item.sourceUrl ? `<a class="source-btn" href="${item.sourceUrl}" target="_blank">出典リンク</a>` : ''}
                </div>
              </div>`;
            frag.appendChild(art);
        });
        grid.prepend(frag);
        // Rebuild JSON-LD to include dynamic items
        injectStructuredData();
    } catch (e) {
        // ignore
    }
}

function openDynamicArticle(event, id) {
    event.preventDefault();
    const item = __dynamicNews[id];
    if (!item) return;
    const modal = document.getElementById('articleModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    modalTitle.textContent = item.title;
    modalBody.innerHTML = `
      <div class="article-meta">
        <span class="category-tag ${item.categoryClass || ''}">${item.category || ''}</span>
        <span class="article-date">${item.date || ''}</span>
      </div>
      <div class="article-content">${item.fullContent || ''}</div>
      ${item.sourceUrl ? `<div class="source-info" style="margin-top:1rem;">出典: <a href="${item.sourceUrl}" target="_blank">${item.organization || item.source || item.sourceUrl}</a></div>` : ''}
    `;
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    const closeBtn = modal.querySelector('.close');
    if (closeBtn) closeBtn.focus();
    setupArticleFocusTrap(modal);
}

// Article data with full content and source information
function getArticleData() {
    return {
        article1: {
            title: '2025年転職市場レポート：IT人材不足が深刻化',
            category: '市場動向',
            categoryClass: 'market',
            date: '2025年8月21日',
            author: 'Career Horizon編集部',
            readTimeMin: 6,
            tags: ['AI','IT人材','レポート'],
            fullContent: `
                <p>最新の調査によると、2025年のIT業界における人材不足はさらに深刻化しており、特にAI・機械学習エンジニアの求人倍率が3.2倍に達しています。</p>
                <p>企業は高額な報酬と柔軟な働き方を提示して人材確保に努めており、年収1000万円を超える求人も珍しくなくなっています。</p>
                <h4>主な要因</h4>
                <ul>
                    <li>DX推進による技術者需要の急増</li>
                    <li>AI・データサイエンス分野の拡大</li>
                    <li>新卒採用だけでは追いつかない人材不足</li>
                </ul>
                <h4>今後の展望</h4>
                <p>この傾向は2026年まで続くと予想され、企業は人材獲得競争が一層激化するでしょう。リスキリング支援やインターンシップの拡充など、新たな取り組みも増加しています。</p>
            `,
            source: 'IT人材白書',
            organization: '情報処理推進機構（IPA）',
            period: '2024年12月〜2025年2月',
            sampleSize: '5,000社、15,000名',
            reliability: '★★★★★（非常に高い）',
            updateFrequency: '年次更新',
            sourceUrl: 'https://www.ipa.go.jp/jinzai/'
        },
        article2: {
            title: 'リモートワーク定着で地方移住転職が増加',
            category: '業界トレンド',
            categoryClass: 'industry',
            date: '2025年8月20日',
            author: 'Career Horizon編集部',
            readTimeMin: 5,
            tags: ['リモートワーク','地方移住'],
            fullContent: `
                <p>コロナ禍で始まったリモートワークが定着し、東京の企業に勤務しながら地方に移住する転職者が30%増加しています。</p>
                <p>特に北海道、沖縄、長野県への移住が人気で、IT系職種を中心に多くの転職者が生活拠点を変えています。</p>
                <h4>人気の移住先TOP5</h4>
                <ol>
                    <li>北海道札幌市</li>
                    <li>沖縄県那覇市</li>
                    <li>長野県軽井沢町</li>
                    <li>福岡県福岡市</li>
                    <li>静岡県熱海市</li>
                </ol>
            `,
            source: '情報通信白書（テレワーク関連）',
            organization: '総務省',
            period: '2025年1月〜7月',
            sampleSize: '移住転職者2,500名',
            reliability: '★★★★☆（高い）',
            updateFrequency: '半年更新',
            sourceUrl: 'https://www.soumu.go.jp/johotsusintokei/whitepaper/'
        },
        article3: {
            title: '30代未経験からデータサイエンティストに転職成功',
            category: '成功事例',
            categoryClass: 'success',
            date: '2025年8月19日',
            author: 'Career Horizon編集部',
            readTimeMin: 7,
            tags: ['データサイエンス','学習','ポートフォリオ'],
            fullContent: `
                <p>営業職から独学でプログラミングを学び、データサイエンティストへの転職を成功させた田中さん（32歳）の体験談をご紹介します。</p>
                <h4>転職までのステップ</h4>
                <ol>
                    <li>オンライン学習プラットフォームでPython学習開始</li>
                    <li>統計学とデータ分析の基礎を習得</li>
                    <li>Kaggleコンペティションに参加してポートフォリオ作成</li>
                    <li>専門エージェントに登録して転職活動開始</li>
                </ol>
                <p>学習期間は約1年間。働きながらの学習は大変でしたが、明確な目標があったため継続できました。</p>
            `,
            source: '編集部オリジナル',
            organization: 'Career Horizon編集部',
            period: '2025年8月',
            sampleSize: '成功者インタビュー1名',
            reliability: '★★★☆☆（中程度）',
            updateFrequency: '随時更新',
            sourceUrl: ''
        },
        article4: {
            title: '転職活動で重要な「ポータブルスキル」とは',
            category: '専門家コラム',
            categoryClass: 'expert',
            date: '2025年8月18日',
            author: 'キャリアコンサルタント',
            readTimeMin: 5,
            tags: ['ポータブルスキル','コミュニケーション','問題解決'],
            fullContent: `
                <p>キャリアコンサルタントが解説する、業界を問わず活用できるポータブルスキルの重要性と身につけ方について詳しくご説明します。</p>
                <h4>主要なポータブルスキル</h4>
                <ul>
                    <li><strong>コミュニケーション力:</strong> 相手に応じた適切な伝え方</li>
                    <li><strong>問題解決力:</strong> 課題を発見し解決策を見つける力</li>
                    <li><strong>プロジェクト管理力:</strong> 計画立案から実行までのマネジメント</li>
                    <li><strong>学習力:</strong> 新しい知識・スキルを継続的に習得する力</li>
                </ul>
                <p>これらのスキルは業界や職種が変わっても活用でき、転職時の大きなアピールポイントになります。</p>
            `,
            source: 'キャリア開発関連資料',
            organization: '日本キャリア開発協会（JCDA）',
            period: '2025年3月〜7月',
            sampleSize: 'キャリア専門家200名',
            reliability: '★★★★★（非常に高い）',
            updateFrequency: '年次更新',
            sourceUrl: 'https://www.jcda.jp/'
        }
    };
}

// Merge static + dynamic for JSON-LD
function getAllArticles() {
    const staticItems = getArticleData();
    const dynPairs = Object.entries(__dynamicNews || {}).map(([id, a]) => [id, a]);
    const merged = { ...staticItems };
    dynPairs.forEach(([id, a]) => { merged[id] = a; });
    return merged;
}

// Enhance existing cards with reliability and tags for top articles
function enhanceNewsCards() {
    const articles = getArticleData();
    const anchors = document.querySelectorAll('.news-card .read-more[onclick^="openFullArticle"]');
    anchors.forEach(a => {
        const m = a.getAttribute('onclick').match(/openFullArticle\(event,\s*'([^']+)'\)/);
        if (!m) return;
        const id = m[1];
        const data = articles[id];
        if (!data) return;
        const card = a.closest('.news-card');
        const meta = card.querySelector('.news-meta');
        // reliability stars
        const starCount = (data.reliability.match(/★/g) || []).length;
        const rel = document.createElement('span');
        rel.className = 'reliability';
        rel.title = data.reliability;
        rel.textContent = '★'.repeat(starCount);
        rel.style.marginLeft = '8px';
        if (meta) meta.appendChild(rel);

        // author / read time
        const info = document.createElement('div');
        info.className = 'extra-meta muted';
        info.style.marginTop = '4px';
        info.textContent = `${data.author} ・ 約${data.readTimeMin}分で読了`;
        const content = card.querySelector('.news-content');
        if (content) content.insertBefore(info, content.querySelector('h3'));

        // tags
        if (Array.isArray(data.tags) && data.tags.length) {
            const tagWrap = document.createElement('div');
            tagWrap.className = 'tag-chips';
            tagWrap.style.marginTop = '6px';
            data.tags.forEach(t => {
                const chip = document.createElement('span');
                chip.className = 'tag-chip';
                chip.textContent = `#${t}`;
                chip.addEventListener('click', () => {
                    const input = document.querySelector('.search-input');
                    if (input) {
                        input.value = t;
                        searchNews(t.toLowerCase());
                    }
                });
                tagWrap.appendChild(chip);
            });
            const content2 = card.querySelector('.news-content');
            content2.appendChild(tagWrap);
            card.setAttribute('data-tags', data.tags.join(','));
        }
        // source strip
        if (data.sourceUrl) {
            const src = document.createElement('div');
            src.className = 'source-strip';
            src.innerHTML = `出典: <a href="${data.sourceUrl}" target="_blank">${data.organization || data.source}</a>`;
            const content3 = card.querySelector('.news-content');
            content3.appendChild(src);
        } else {
            const src = document.createElement('div');
            src.className = 'source-strip muted';
            src.textContent = `出典: ${data.organization || data.source}`;
            const content3 = card.querySelector('.news-content');
            content3.appendChild(src);
        }
    });
}

function initializeTagFilters() {
    const container = document.getElementById('tag-filters');
    if (!container) return;
    const articles = getArticleData();
    const set = new Set();
    Object.values(articles).forEach(a => (a.tags || []).forEach(t => set.add(t)));
    if (set.size === 0) return;
    container.innerHTML = '<div class="muted" style="margin-bottom:6px;">タグから探す</div>';
    set.forEach(tag => {
        const btn = document.createElement('button');
        btn.className = 'tag-btn';
        btn.type = 'button';
        btn.textContent = `#${tag}`;
        btn.addEventListener('click', () => {
            const input = document.querySelector('.search-input');
            if (input) {
                input.value = tag;
                searchNews(tag.toLowerCase());
            }
        });
        container.appendChild(btn);
    });
}

// HTML Source Display Functions
function showHTMLSource(event) {
    event.preventDefault();
    const modal = document.getElementById('articleModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    modalTitle.textContent = 'HTMLソース（抜粋）';
    modalBody.innerHTML = `
      <div class="source-info">
        <div style="background: #f8f9fa; padding: 1rem; border-radius: 4px; margin: 0; max-height: 400px; overflow-y: auto;">
          <pre style="font-family: 'Monaco', 'Courier New', monospace; font-size: 0.8rem; line-height: 1.4; margin: 0; white-space: pre-wrap;">${escapeHtml(getNewsCardHTML())}</pre>
        </div>
      </div>
    `;
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    setupArticleFocusTrap(modal);
}

function showPageSource() {
    const modal = document.getElementById('articleModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    modalTitle.textContent = '📄 ページソース';
    modalBody.innerHTML = `
      <div class="source-info">
        <h4>参照URL</h4>
        <ul>
          <li><a href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" target="_blank">Google Fonts (Inter)</a></li>
          <li><a href="https://fonts.gstatic.com" target="_blank">https://fonts.gstatic.com</a></li>
          <li><a href="rss.xml" target="_blank">RSS: rss.xml</a></li>
          <li><a href="style.css" target="_blank">style.css</a></li>
          <li><a href="news.js" target="_blank">news.js</a></li>
        </ul>
      </div>
    `;
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    setupArticleFocusTrap(modal);
}

// Get sample HTML for news card
function getNewsCardHTML() {
    return `<article class="news-card" data-category="market">
    <div class="news-image">
        <div class="placeholder-image">📊</div>
    </div>
    <div class="news-content">
        <div class="news-meta">
            <span class="category-tag market">市場動向</span>
            <span class="news-date">2025年8月21日</span>
        </div>
        <h3>2025年転職市場レポート：IT人材不足が深刻化</h3>
        <p>最新の調査によると、2025年のIT業界における人材不足は
        さらに深刻化しており、特にAI・機械学習エンジニアの求人倍率が
        3.2倍に達しています。</p>
        <div class="news-actions">
            <a href="#" class="read-more">続きを読む →</a>
            <button class="source-btn">データソース</button>
            <button class="source-btn">HTMLソース</button>
        </div>
    </div>
</article>`;
}

// Escape HTML for display
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

// Export functions for potential module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeMobileNav,
        initializeNewsFiltering,
        initializeLoadMore,
        initializeNewsletter,
        validateEmail,
        searchNews,
        openFullArticle,
        showSource,
        closeModal,
        showHTMLSource,
        showPageSource,
        showAllSources,
        injectStructuredData
    };
}

// Event delegation for dynamically added/readable content
function initializeDelegatedHandlers() {
    const grid = document.querySelector('.news-grid');
    if (!grid) return;
    grid.addEventListener('click', function(e) {
        const link = e.target.closest('a.read-more');
        if (link && grid.contains(link)) {
            // If inline onclick is present (top articles), defer to it
            if (link.getAttribute('onclick')) return;
            e.preventDefault();
            const card = link.closest('.news-card');
            if (!card) return;
            const modal = document.getElementById('articleModal');
            const modalTitle = document.getElementById('modalTitle');
            const modalBody = document.getElementById('modalBody');
            const title = (card.querySelector('h3')?.textContent) || '記事';
            const p = card.querySelector('p');
            const content = p ? p.outerHTML : '';
            modalTitle.textContent = title;
            modalBody.innerHTML = `<div class="article-content">${content}</div>`;
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
            const closeBtn = modal.querySelector('.close');
            if (closeBtn) closeBtn.focus();
            setupArticleFocusTrap(modal);
        }
    });
}

// Helpers to build/inject/show JSON-LD
function buildStructuredData() {
    const base = (location && location.origin && location.pathname)
      ? location.origin + location.pathname
      : 'https://awano27.github.io/career-info/news.html';
    const articles = getAllArticles();
    const toISO = (jp) => {
        const m = /^(\d{4})年\s*(\d{1,2})月\s*(\d{1,2})日$/.exec(jp);
        if (!m) return jp;
        const y = m[1];
        const mo = String(m[2]).padStart(2, '0');
        const d = String(m[3]).padStart(2, '0');
        return `${y}-${mo}-${d}`;
    };
    const stripHtml = (html) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

    const graph = Object.entries(articles).map(([id, a]) => {
        const url = `${base}#${id}`;
        const isOrg = (a.author || '').includes('編集部');
        const author = isOrg
          ? { '@type': 'Organization', name: a.author }
          : { '@type': 'Person', name: a.author };
        const desc = a.fullContent ? stripHtml(a.fullContent).slice(0, 180) : undefined;
        const obj = {
            '@type': 'NewsArticle',
            headline: a.title,
            datePublished: toISO(a.date || ''),
            dateModified: toISO(a.date || ''),
            articleSection: a.category,
            author,
            publisher: { '@type': 'Organization', name: 'Career Horizon' },
            keywords: Array.isArray(a.tags) ? a.tags : undefined,
            url,
            mainEntityOfPage: { '@type': 'WebPage', '@id': url }
        };
        if (a.sourceUrl) {
            obj.isBasedOn = { '@type': 'WebPage', url: a.sourceUrl };
            obj.citation = a.sourceUrl;
        }
        if (desc) obj.description = desc;
        return obj;
    });
    return { '@context': 'https://schema.org', '@graph': graph };
}

function injectStructuredData() {
    try {
        const head = document.head || document.getElementsByTagName('head')[0];
        if (!head) return;
        const old = document.getElementById('news-jsonld');
        if (old && old.parentNode) old.parentNode.removeChild(old);
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.id = 'news-jsonld';
        script.textContent = JSON.stringify(buildStructuredData());
        head.appendChild(script);
    } catch (_) {}
}

function showStructuredData() {
    const modal = document.getElementById('articleModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    const json = JSON.stringify(buildStructuredData(), null, 2);
    modalTitle.textContent = '構造化データ（JSON-LD）';
    modalBody.innerHTML = `
      <div class="source-info">
        <div style="background:#0b1020;color:#e5e7eb;padding:1rem;border-radius:6px;max-height:60vh;overflow:auto;">
          <pre style="margin:0;white-space:pre;">${escapeHtml(json)}</pre>
        </div>
      </div>
    `;
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    setupArticleFocusTrap(modal);
}

// Aggregate sources
function showAllSources() {
    const modal = document.getElementById('articleModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    const articles = getArticleData();
    const unique = new Map();
    Object.values(articles).forEach(a => {
        if (a.sourceUrl && !unique.has(a.sourceUrl)) {
            unique.set(a.sourceUrl, { title: a.title, org: a.organization || a.source, url: a.sourceUrl });
        }
    });
    const items = Array.from(unique.values());
    modalTitle.textContent = 'データソース一覧';
    modalBody.innerHTML = `
      <div class="source-info">
        <ul>
          ${items.map(i => `<li><a href="${i.url}" target="_blank">${i.org || i.url}</a> — ${i.title}</li>`).join('')}
        </ul>
      </div>
    `;
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    setupArticleFocusTrap(modal);
}
