// Dashboard JavaScript for KPI Charts and Interactions

// Mobile Navigation
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenu = document.getElementById('mobile-menu');
    const navMenu = document.querySelector('.nav-menu');

    if (mobileMenu) {
        mobileMenu.addEventListener('click', function() {
            navMenu.classList.toggle('active');
        });
    }

    // Initialize Charts
    initializeCharts();
    
    // Add animation to KPI cards
    animateKPICards();
});

// Chart Initialization
function initializeCharts() {
    // Wait for Chart.js to load
    if (typeof Chart === 'undefined') {
        setTimeout(initializeCharts, 100);
        return;
    }

    // Job Ratio Trend Chart
    const jobRatioCtx = document.getElementById('jobRatioChart');
    if (jobRatioCtx) {
        new Chart(jobRatioCtx, {
            type: 'line',
            data: {
                labels: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月'],
                datasets: [{
                    label: '有効求人倍率',
                    data: [1.15, 1.18, 1.22, 1.25, 1.23, 1.26, 1.28, 1.28],
                    borderColor: '#337ab7',
                    backgroundColor: 'rgba(51, 122, 183, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: 'white',
                        bodyColor: 'white'
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: false,
                        min: 1.0,
                        max: 1.4,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    }
                }
            }
        });
    }

    // Salary by Industry Chart
    const salaryCtx = document.getElementById('salaryChart');
    if (salaryCtx) {
        new Chart(salaryCtx, {
            type: 'bar',
            data: {
                labels: ['IT・通信', '金融・保険', '製造業', '商社', '建設・不動産', 'コンサル'],
                datasets: [{
                    label: '平均年収（万円）',
                    data: [580, 520, 480, 510, 450, 650],
                    backgroundColor: [
                        '#337ab7',
                        '#5cb85c',
                        '#f0ad4e',
                        '#d9534f',
                        '#2e6da4',
                        '#5bc0de'
                    ],
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 700
                    }
                }
            }
        });
    }

    // Regional Job Count Chart
    const regionCtx = document.getElementById('regionChart');
    if (regionCtx) {
        new Chart(regionCtx, {
            type: 'doughnut',
            data: {
                labels: ['関東', '関西', '中部', '九州', '東北', 'その他'],
                datasets: [{
                    data: [45, 25, 12, 8, 5, 5],
                    backgroundColor: [
                        '#337ab7',
                        '#5cb85c',
                        '#f0ad4e',
                        '#d9534f',
                        '#2e6da4',
                        '#5bc0de'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                }
            }
        });
    }

    // Age Group Success Rate Chart
    const ageCtx = document.getElementById('ageChart');
    if (ageCtx) {
        new Chart(ageCtx, {
            type: 'radar',
            data: {
                labels: ['20代前半', '20代後半', '30代前半', '30代後半', '40代前半', '40代後半'],
                datasets: [{
                    label: '転職成功率（%）',
                    data: [75, 82, 78, 65, 55, 45],
                    borderColor: '#337ab7',
                    backgroundColor: 'rgba(51, 122, 183, 0.2)',
                    borderWidth: 2,
                    pointBackgroundColor: '#337ab7',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            stepSize: 20
                        }
                    }
                }
            }
        });
    }
}

// Animate KPI Cards
function animateKPICards() {
    const kpiCards = document.querySelectorAll('.kpi-card');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.classList.add('fade-in');
                    animateKPIValue(entry.target.querySelector('.kpi-value'));
                }, index * 100);
            }
        });
    }, {
        threshold: 0.1
    });

    kpiCards.forEach(card => {
        observer.observe(card);
    });
}

// Animate KPI Values (Counter Effect)
function animateKPIValue(element) {
    if (!element) return;
    
    const text = element.textContent;
    const numMatch = text.match(/[\d,]+/);
    
    if (numMatch) {
        const finalValue = parseInt(numMatch[0].replace(/,/g, ''));
        const suffix = text.replace(numMatch[0], '');
        let currentValue = 0;
        const increment = finalValue / 30;
        const duration = 1000;
        const stepTime = duration / 30;

        const timer = setInterval(() => {
            currentValue += increment;
            if (currentValue >= finalValue) {
                currentValue = finalValue;
                clearInterval(timer);
            }
            
            const displayValue = Math.floor(currentValue).toLocaleString();
            element.textContent = displayValue + suffix;
        }, stepTime);
    }
}

// Update KPI Data (for future real-time updates)
function updateKPIData() {
    // This function can be used to fetch real-time data
    // and update the dashboard values
    console.log('Updating KPI data...');
    
    // Example: Fetch data from API and update charts
    // fetchKPIData().then(data => {
    //     updateCharts(data);
    // });
}

// Utility function to format numbers
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// Dashboard Source Display Function
function showDashboardSource() {
    const modal = document.getElementById('sourceModal');
    const modalTitle = document.getElementById('sourceModalTitle');
    const modalBody = document.getElementById('sourceModalBody');
    
    modalTitle.textContent = '📊 ダッシュボード ソース情報';
    modalBody.innerHTML = `
        <div class="source-info">
            <h4>🌐 KPI指標ダッシュボードについて</h4>
            <p>このダッシュボードは、転職市場のKPI（重要業績評価指標）をリアルタイムで表示するWebアプリケーションです。</p>
            
            <h4>📊 表示されているKPI指標</h4>
            <ul>
                <li><strong>有効求人倍率</strong> - 求人数と求職者数の比率</li>
                <li><strong>平均年収</strong> - 転職市場における平均年収</li>
                <li><strong>転職成功率</strong> - 転職活動における成功率</li>
                <li><strong>新規求人数</strong> - 月間新規求人数</li>
            </ul>
            
            <h4>📈 使用チャートライブラリ</h4>
            <ul>
                <li><strong>Chart.js</strong> - インタラクティブなグラフ表示</li>
                <li>線グラフ - 求人倍率の推移</li>
                <li>棒グラフ - 業界別平均年収</li>
                <li>ドーナツグラフ - 地域別求人数</li>
                <li>レーダーチャート - 年代別転職成功率</li>
            </ul>
            
            <h4>💡 技術的特徴</h4>
            <ul>
                <li>レスポンシブ グリッドレイアウト</li>
                <li>CSS Grid & Flexbox</li>
                <li>インタラクションアニメーション</li>
                <li>数値カウンターアニメーション</li>
                <li>Intersection Observer API</li>
            </ul>
            
            <div style="margin-top: 1rem; padding: 1rem; background: #f0f9ff; border-left: 3px solid #0ea5e9; border-radius: 4px;">
                <h4>🔍 ソースコードを見る方法</h4>
                <p><strong>完全なHTMLソース:</strong></p>
                <ul>
                    <li><kbd>Ctrl+U</kbd> (Windows) または <kbd>Cmd+Option+U</kbd> (Mac)</li>
                    <li>右クリック → 「ページのソースを表示」</li>
                </ul>
                <p><strong>開発者ツールでチャートを調査:</strong></p>
                <ul>
                    <li><kbd>F12</kbd> → Elements タブでHTML構造を確認</li>
                    <li>Console タブで Chart.js のログを確認</li>
                    <li>Network タブでChart.js CDNの読み込みを確認</li>
                </ul>
            </div>
            
            <div style="margin-top: 1rem; padding: 1rem; background: #f9fafb; border: 1px solid #d1d5db; border-radius: 4px;">
                <h4>📁 関連ファイル</h4>
                <ul>
                    <li><code>index.html</code> - メインのダッシュボードページ</li>
                    <li><code>dashboard.js</code> - チャート初期化とアニメーション</li>
                    <li><code>style.css</code> - KPIカードとチャートのスタイリング</li>
                </ul>
            </div>
        </div>
    `;
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeSourceModal() {
    const modal = document.getElementById('sourceModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('sourceModal');
    if (event.target === modal) {
        closeSourceModal();
    }
}

// Export functions for potential module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeCharts,
        animateKPICards,
        updateKPIData,
        formatNumber,
        showDashboardSource,
        closeSourceModal
    };
}