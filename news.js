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
        searchInput.addEventListener('input', function(e) {
            const query = e.target.value.toLowerCase();
            searchNews(query);
        });
    }
}

// Search news articles
function searchNews(query) {
    const newsCards = document.querySelectorAll('.news-card');
    
    newsCards.forEach(card => {
        const title = card.querySelector('h3').textContent.toLowerCase();
        const content = card.querySelector('p').textContent.toLowerCase();
        
        if (title.includes(query) || content.includes(query)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
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
        modalBody.innerHTML = `
            <div class="article-meta">
                <span class="category-tag ${article.categoryClass}">${article.category}</span>
                <span class="article-date">${article.date}</span>
            </div>
            <div class="article-content">
                ${article.fullContent}
            </div>
        `;
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
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
    }
}

function closeModal() {
    const modal = document.getElementById('articleModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('articleModal');
    if (event.target === modal) {
        closeModal();
    }
}

// Article data with full content and source information
function getArticleData() {
    return {
        article1: {
            title: '2025年転職市場レポート：IT人材不足が深刻化',
            category: '市場動向',
            categoryClass: 'market',
            date: '2025年8月21日',
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
            source: 'IT人材白書2025',
            organization: '情報処理推進機構（IPA）',
            period: '2024年12月〜2025年2月',
            sampleSize: '5,000社、15,000名',
            reliability: '★★★★★（非常に高い）',
            updateFrequency: '年次更新',
            sourceUrl: 'https://www.ipa.go.jp/jinzai/report/'
        },
        article2: {
            title: 'リモートワーク定着で地方移住転職が増加',
            category: '業界トレンド',
            categoryClass: 'industry',
            date: '2025年8月20日',
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
            source: '地方移住転職動向調査',
            organization: '日本人材マネジメント協会',
            period: '2025年1月〜7月',
            sampleSize: '移住転職者2,500名',
            reliability: '★★★★☆（高い）',
            updateFrequency: '半年更新',
            sourceUrl: 'https://www.jshrm.org/research/'
        },
        article3: {
            title: '30代未経験からデータサイエンティストに転職成功',
            category: '成功事例',
            categoryClass: 'success',
            date: '2025年8月19日',
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
            source: '転職成功事例インタビュー',
            organization: 'Career Horizon編集部',
            period: '2025年8月',
            sampleSize: '成功者インタビュー1名',
            reliability: '★★★☆☆（中程度）',
            updateFrequency: '随時更新',
            sourceUrl: 'https://career-horizon.com/interview/'
        },
        article4: {
            title: '転職活動で重要な「ポータブルスキル」とは',
            category: '専門家コラム',
            categoryClass: 'expert',
            date: '2025年8月18日',
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
            source: '人材開発白書',
            organization: '日本キャリア開発協会',
            period: '2025年3月〜7月',
            sampleSize: 'キャリア専門家200名',
            reliability: '★★★★★（非常に高い）',
            updateFrequency: '年次更新',
            sourceUrl: 'https://www.jcda.org/research/'
        }
    };
}

// HTML Source Display Functions
function showHTMLSource(event) {
    event.preventDefault();
    const modal = document.getElementById('articleModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    modalTitle.textContent = 'HTMLソースコード';
    modalBody.innerHTML = `
        <div class="source-info">
            <h4>📄 このページのHTMLソース</h4>
            <p>ページの一部のHTMLソースコードを表示しています。</p>
            <div style="background: #f8f9fa; padding: 1rem; border-radius: 4px; margin: 1rem 0; max-height: 400px; overflow-y: auto;">
                <pre style="font-family: 'Monaco', 'Courier New', monospace; font-size: 0.8rem; line-height: 1.4; margin: 0; white-space: pre-wrap;">${escapeHtml(getNewsCardHTML())}</pre>
            </div>
            <div style="margin-top: 1rem; padding: 1rem; background: #e7f3ff; border-left: 3px solid #3b82f6; border-radius: 4px;">
                <h4>🔗 完全なソースコード</h4>
                <p>完全なHTMLソースコードを見るには:</p>
                <ul>
                    <li>ブラウザで <strong>Ctrl+U</strong> (Windows) または <strong>Cmd+Option+U</strong> (Mac)</li>
                    <li>右クリック → <strong>「ページのソースを表示」</strong></li>
                    <li>開発者ツール (<strong>F12</strong>) → <strong>Elements</strong>タブ</li>
                </ul>
            </div>
        </div>
    `;
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function showPageSource() {
    const modal = document.getElementById('articleModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    modalTitle.textContent = '📄 ページソースコード情報';
    modalBody.innerHTML = `
        <div class="source-info">
            <h4>🌐 このWebサイトについて</h4>
            <p>この転職情報サイトは、HTML、CSS、JavaScriptで構築されています。</p>
            
            <h4>🛠️ 使用技術</h4>
            <ul>
                <li><strong>HTML5</strong> - セマンティックなマークアップ</li>
                <li><strong>CSS3</strong> - モダンなスタイリング（Grid、Flexbox、CSS Variables）</li>
                <li><strong>JavaScript ES6+</strong> - インタラクティブ機能</li>
                <li><strong>Chart.js</strong> - データ可視化ライブラリ</li>
                <li><strong>Inter Font</strong> - Google Fonts</li>
            </ul>
            
            <h4>📁 ファイル構成</h4>
            <ul>
                <li><code>index.html</code> - KPI指標ダッシュボード</li>
                <li><code>news.html</code> - 転職ニュースページ（現在のページ）</li>
                <li><code>style.css</code> - 統一CSSスタイル</li>
                <li><code>news.js</code> - ニュースページ用JavaScript</li>
                <li><code>dashboard.js</code> - ダッシュボード用JavaScript</li>
            </ul>
            
            <div style="margin-top: 1rem; padding: 1rem; background: #f0f9ff; border-left: 3px solid #0ea5e9; border-radius: 4px;">
                <h4>🔍 ソースコードを見る方法</h4>
                <p><strong>完全なHTMLソース:</strong></p>
                <ul>
                    <li><kbd>Ctrl+U</kbd> (Windows) または <kbd>Cmd+Option+U</kbd> (Mac)</li>
                    <li>右クリック → 「ページのソースを表示」</li>
                </ul>
                <p><strong>開発者ツール:</strong></p>
                <ul>
                    <li><kbd>F12</kbd> または 右クリック → 「検証」</li>
                    <li>Elements タブでHTML構造を確認</li>
                    <li>Console タブでJavaScriptのログを確認</li>
                </ul>
            </div>
            
            <div style="margin-top: 1rem; padding: 1rem; background: #f9fafb; border: 1px solid #d1d5db; border-radius: 4px;">
                <h4>⭐ このサイトの特徴</h4>
                <ul>
                    <li>レスポンシブデザイン（PC、タブレット、スマートフォン対応）</li>
                    <li>モダンで洗練された大人向けデザイン</li>
                    <li>インタラクティブなチャートとグラフ</li>
                    <li>モーダルウィンドウによる詳細表示</li>
                    <li>カテゴリ別フィルタリング機能</li>
                    <li>ニュースレター登録フォーム</li>
                </ul>
            </div>
        </div>
    `;
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
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
        showPageSource
    };
}