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

    // Register annotation plugin if available
    try {
        if (typeof window !== 'undefined') {
            const plugin = window['ChartAnnotation'] || window['chartjs-plugin-annotation'];
            if (plugin) Chart.register(plugin);
        }
    } catch (e) {
        console.warn('Annotation plugin registration failed:', e);
    }

    fetchKPIData().then((kpi) => {
    // Job Ratio Trend Chart
    const jobRatioCtx = document.getElementById('jobRatioChart');
    if (jobRatioCtx) {
        // Controls: moving average toggle and MoM badge
        const container = jobRatioCtx.closest('.chart-container');
        const titleEl = container.querySelector('h3');
        const controls = document.createElement('div');
        controls.className = 'chart-controls';
        controls.innerHTML = `
            <label><input type="checkbox" id="maToggle"> 移動平均(3ヶ月)</label>
            <label><input type="checkbox" id="yoyToggle"> 前年ライン</label>
            <label><input type="checkbox" id="annoToggle" checked> 注釈</label>
            <label>期間:
              <select id="periodSelect">
                <option value="all">全期間</option>
                <option value="6">直近6ヶ月</option>
              </select>
            </label>
        `;
        titleEl.insertAdjacentElement('afterend', controls);
        const jobBadgeWrap = document.createElement('div');
        jobBadgeWrap.className = 'controls-right';
        controls.appendChild(jobBadgeWrap);

        const fullLabels = (kpi.metrics?.jobRatio?.months) || ['1月','2月','3月','4月','5月','6月','7月','8月'];
        const fullValues = (kpi.metrics?.jobRatio?.values) || [1.15,1.18,1.22,1.25,1.23,1.26,1.28,1.28];
        const fullPrev = (kpi.metrics?.jobRatio?.prevYearValues) || [];
        const sliceByPeriod = (per) => {
            if (per === '6' && fullValues.length > 6) {
                const start = fullValues.length - 6;
                return {
                    labels: fullLabels.slice(start),
                    values: fullValues.slice(start),
                    prev: fullPrev.length === fullValues.length ? fullPrev.slice(start) : []
                };
            }
            return { labels: fullLabels.slice(), values: fullValues.slice(), prev: fullPrev.slice() };
        };
        let { labels, values, prev: prevYear } = sliceByPeriod('all');

        const mom = (values[values.length - 1] - values[values.length - 2]);
        const badge = document.createElement('span');
        badge.className = 'metric-badge' + (mom < 0 ? ' negative' : '');
        badge.textContent = `前月比 ${mom >= 0 ? '+' : ''}${mom.toFixed(2)}`;
        badge.id = 'job-mom-badge';
        jobBadgeWrap.appendChild(badge);
        const badge2 = document.createElement('span');
        badge2.id = 'job-yoy-badge';
        jobBadgeWrap.appendChild(badge2);
        const updateJobBadges = (vals, prev) => {
            const b1 = document.getElementById('job-mom-badge');
            if (vals.length >= 2) {
                const m = vals[vals.length-1] - vals[vals.length-2];
                b1.classList.toggle('negative', m < 0);
                b1.textContent = `前月比 ${m>=0?'+':''}${m.toFixed(2)}`;
                b1.style.display = '';
            } else {
                b1.style.display = 'none';
            }
            const b2 = document.getElementById('job-yoy-badge');
            if (prev && prev.length === vals.length && prev.length>0) {
                const y = vals[vals.length-1] - prev[prev.length-1];
                b2.className = 'metric-badge' + (y < 0 ? ' negative' : '');
                b2.textContent = `前年比 ${y>=0?'+':''}${y.toFixed(2)}`;
                b2.style.display = '';
            } else {
                b2.style.display = 'none';
            }
        };
        updateJobBadges(values, prevYear);

        const jobChart = new Chart(jobRatioCtx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: '有効求人倍率',
                    data: values,
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
                    },
                    annotation: {
                        annotations: {
                            threshold: {
                                type: 'line',
                                yMin: 1.20, yMax: 1.20,
                                borderColor: '#ef4444',
                                borderWidth: 1,
                                borderDash: [4,4],
                                label: {
                                    enabled: true,
                                    content: '目安 1.20',
                                    position: 'start',
                                    backgroundColor: 'rgba(239,68,68,0.1)',
                                    color: '#ef4444'
                                },
                                display: true
                            },
                            latest: {
                                type: 'line',
                                xMin: labels[labels.length - 1],
                                xMax: labels[labels.length - 1],
                                borderColor: '#10b981',
                                borderWidth: 1,
                                label: {
                                    enabled: true,
                                    content: '最新',
                                    backgroundColor: 'rgba(16,185,129,0.1)',
                                    color: '#0f5132'
                                },
                                display: true
                            }
                        }
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

        // Moving average toggle
        const maToggle = controls.querySelector('#maToggle');
        maToggle.addEventListener('change', () => {
            const existing = jobChart.data.datasets.find(d => d._isMA);
            if (maToggle.checked) {
                if (!existing) {
                    const ma = movingAverage(values, 3);
                    jobChart.data.datasets.push({
                        label: '移動平均(3ヶ月)',
                        data: ma,
                        borderColor: '#5cb85c',
                        backgroundColor: 'rgba(92, 184, 92, 0.08)',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.3,
                        pointRadius: 0,
                        _isMA: true
                    });
                }
            } else if (existing) {
                jobChart.data.datasets = jobChart.data.datasets.filter(d => !d._isMA);
            }
            jobChart.update();
        });

        // YoY overlay toggle
        const yoyToggle = controls.querySelector('#yoyToggle');
        yoyToggle.addEventListener('change', () => {
            const idx = jobChart.data.datasets.findIndex(d => d._isYOY);
            if (yoyToggle.checked && prevYear.length === values.length) {
                if (idx === -1) {
                    jobChart.data.datasets.push({
                        label: '前年比',
                        data: prevYear,
                        borderColor: '#9ca3af',
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.3,
                        pointRadius: 0,
                        borderDash: [6,4],
                        _isYOY: true
                    });
                }
            } else if (idx !== -1) {
                jobChart.data.datasets.splice(idx, 1);
            }
            jobChart.update();
        });

        // Annotation toggle
        const annoToggle = controls.querySelector('#annoToggle');
        annoToggle.addEventListener('change', () => {
            const ann = jobChart.options.plugins && jobChart.options.plugins.annotation && jobChart.options.plugins.annotation.annotations;
            if (ann) {
                Object.values(ann).forEach(a => { a.display = annoToggle.checked; });
                jobChart.update();
            }
        });

        // Period select
        const periodSelect = controls.querySelector('#periodSelect');
        periodSelect.addEventListener('change', () => {
            const per = periodSelect.value;
            const sliced = sliceByPeriod(per);
            labels = sliced.labels; values = sliced.values; prevYear = sliced.prev;
            jobChart.data.labels = labels;
            jobChart.data.datasets[0].data = values;
            // Update MA if present
            const maDs = jobChart.data.datasets.find(d => d._isMA);
            if (maDs) maDs.data = movingAverage(values, 3);
            // Update YoY if present
            const yoyDs = jobChart.data.datasets.find(d => d._isYOY);
            if (yoyDs && prevYear.length === values.length) yoyDs.data = prevYear;
            // Update latest annotation X
            const ann = jobChart.options.plugins && jobChart.options.plugins.annotation && jobChart.options.plugins.annotation.annotations;
            if (ann && ann.latest) {
                ann.latest.xMin = labels[labels.length - 1];
                ann.latest.xMax = labels[labels.length - 1];
            }
            jobChart.update();
            updateJobBadges(values, prevYear);
        });
    }

    // Salary by Industry Chart
    const salaryCtx = document.getElementById('salaryChart');
    if (salaryCtx) {
        const container = salaryCtx.closest('.chart-container');
        const titleEl = container.querySelector('h3');
        const controls = document.createElement('div');
        controls.className = 'chart-controls';
        controls.innerHTML = `<span class="muted">表示対象:</span>`;
        titleEl.insertAdjacentElement('afterend', controls);
        const salaryBadgeWrap = document.createElement('div');
        salaryBadgeWrap.className = 'controls-right';
        controls.appendChild(salaryBadgeWrap);

        const salaryList = (kpi.metrics?.salaryByIndustry) || [];
        const industries = salaryList.map(s => s.industry);
        const dataMap = Object.fromEntries(salaryList.map(s => [s.industry, s.avg]));
        const prevMap = Object.fromEntries(salaryList.filter(s=>typeof s.prev!=="undefined").map(s => [s.industry, s.prev]));
        industries.forEach(name => {
            const id = 'ind-' + name;
            const label = document.createElement('label');
            label.innerHTML = `<input type="checkbox" checked data-ind="${name}"> ${name}`;
            controls.appendChild(label);
        });

        const buildSeries = () => {
            const selected = Array.from(controls.querySelectorAll('input[type=checkbox]:checked')).map(i=>i.dataset.ind);
            const labels = selected;
            const values = selected.map(n => dataMap[n]);
            return { labels, values };
        };

        const initial = buildSeries();
        const yoyBadge = document.createElement('span');
        yoyBadge.className = 'metric-badge';
        salaryBadgeWrap.appendChild(yoyBadge);
        const updateYoyBadge = () => {
            const selected = Array.from(controls.querySelectorAll('input[type=checkbox]:checked')).map(i=>i.dataset.ind);
            const diffs = selected
                .filter(n => typeof prevMap[n] !== 'undefined')
                .map(n => dataMap[n] - prevMap[n]);
            if (diffs.length) {
                const avg = diffs.reduce((a,b)=>a+b,0) / diffs.length;
                yoyBadge.classList.toggle('negative', avg < 0);
                yoyBadge.textContent = `前年比 ${avg>=0?'+':''}${Math.round(avg)}万円`;
                yoyBadge.style.display = '';
            } else {
                yoyBadge.style.display = 'none';
            }
        };
        updateYoyBadge();
        const salaryChart = new Chart(salaryCtx, {
            type: 'bar',
            data: {
                labels: initial.labels,
                datasets: [{
                    label: '平均年収（万円）',
                    data: initial.values,
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
                    },
                    annotation: {
                        annotations: {
                            avgLine: {
                                type: 'line',
                                yMin: avg(initial.values), yMax: avg(initial.values),
                                borderColor: '#6b7280',
                                borderWidth: 1,
                                borderDash: [6, 4],
                                label: {
                                    enabled: true,
                                    content: '平均',
                                    backgroundColor: 'rgba(107,114,128,0.1)',
                                    color: '#374151'
                                },
                                display: true
                            },
                            medianLine: {
                                type: 'line',
                                yMin: median(initial.values), yMax: median(initial.values),
                                borderColor: '#0ea5e9',
                                borderWidth: 1,
                                borderDash: [4, 4],
                                label: {
                                    enabled: true,
                                    content: '中央値',
                                    backgroundColor: 'rgba(14,165,233,0.1)',
                                    color: '#075985'
                                },
                                display: false
                            }
                        }
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

        // トグルを追加（平均/中央値）
        const avgToggle = document.createElement('label');
        avgToggle.innerHTML = `<input type="checkbox" id="avgToggle" checked> 平均ライン`;
        const medToggle = document.createElement('label');
        medToggle.innerHTML = `<input type="checkbox" id="medianToggle"> 中央値ライン`;
        controls.appendChild(avgToggle);
        controls.appendChild(medToggle);

        controls.addEventListener('change', () => {
            const next = buildSeries();
            salaryChart.data.labels = next.labels;
            salaryChart.data.datasets[0].data = next.values;
            const a = salaryChart.options.plugins && salaryChart.options.plugins.annotation && salaryChart.options.plugins.annotation.annotations;
            if (a) {
                a.avgLine.yMin = avg(next.values);
                a.avgLine.yMax = a.avgLine.yMin;
                a.medianLine.yMin = median(next.values);
                a.medianLine.yMax = a.medianLine.yMin;
                const avgOn = controls.querySelector('#avgToggle')?.checked;
                const medOn = controls.querySelector('#medianToggle')?.checked;
                a.avgLine.display = !!avgOn;
                a.medianLine.display = !!medOn;
            }
            salaryChart.update();
            updateYoyBadge();
        });
    }

    // Regional Job Count Chart
    const regionCtx = document.getElementById('regionChart');
    if (regionCtx) {
        const container = regionCtx.closest('.chart-container');
        const titleEl = container.querySelector('h3');
        const controls = document.createElement('div');
        controls.className = 'chart-controls';
        controls.innerHTML = `
            <label>表示数:
              <select id="regionCount">
                <option value="all">全て</option>
                <option value="3">上位3</option>
                <option value="5">上位5</option>
              </select>
            </label>`;
        titleEl.insertAdjacentElement('afterend', controls);
        const regionBadgeWrap = document.createElement('div');
        regionBadgeWrap.className = 'controls-right';
        controls.appendChild(regionBadgeWrap);

        const allRaw = ((kpi.metrics?.regionJobShare) || []);
        const all = allRaw.map(r => ({ label: r.region, val: r.share, prev: r.prev }));
        const yoyBadge = document.createElement('span');
        yoyBadge.className = 'metric-badge';
        regionBadgeWrap.appendChild(yoyBadge);

        const build = (count) => {
            let list = [...all].sort((a,b)=>b.val-a.val);
            if (count !== 'all') list = list.slice(0, Number(count));
            return {
                labels: list.map(x=>x.label),
                values: list.map(x=>x.val)
            };
        };
        const initial = build('all');
        const updateYoyBadge = (labelsSel) => {
            const diffs = labelsSel
                .map(name => {
                    const item = all.find(x=>x.label===name);
                    if (!item || typeof item.prev === 'undefined') return null;
                    return (item.val - item.prev);
                })
                .filter(v => v !== null);
            if (diffs.length) {
                const avg = diffs.reduce((a,b)=>a+b,0) / diffs.length;
                yoyBadge.classList.toggle('negative', avg < 0);
                yoyBadge.textContent = `前年比 ${avg>=0?'+':''}${avg.toFixed(1)}pt`;
                yoyBadge.style.display = '';
            } else {
                yoyBadge.style.display = 'none';
            }
        };
        updateYoyBadge(initial.labels);

        const regionChart = new Chart(regionCtx, {
            type: 'doughnut',
            data: {
                labels: initial.labels,
                datasets: [{
                    data: initial.values,
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

        // Center overlay label (top region)
        const overlay = document.createElement('div');
        overlay.className = 'chart-center-overlay';
        container.appendChild(overlay);
        const updateOverlay = (labelsSel, valuesSel) => {
            let topIdx = 0;
            for (let i=1; i<valuesSel.length; i++) if (valuesSel[i] > valuesSel[topIdx]) topIdx = i;
            const name = labelsSel[topIdx] || '';
            const val = valuesSel[topIdx] || 0;
            overlay.textContent = `トップ: ${name} ${val}%`;
        };
        updateOverlay(initial.labels, initial.values);

        controls.querySelector('#regionCount').addEventListener('change', (e) => {
            const next = build(e.target.value);
            regionChart.data.labels = next.labels;
            regionChart.data.datasets[0].data = next.values;
            regionChart.update();
            updateYoyBadge(next.labels);
            updateOverlay(next.labels, next.values);
        });
    }

    // Age Group Success Rate Chart
    const ageCtx = document.getElementById('ageChart');
    if (ageCtx) {
        const container = ageCtx.closest('.chart-container');
        const titleEl = container.querySelector('h3');
        const controls = document.createElement('div');
        controls.className = 'chart-controls';
        controls.innerHTML = `<span class="muted">年代を選択:</span>`;
        titleEl.insertAdjacentElement('afterend', controls);
        const ageBadgeWrap = document.createElement('div');
        ageBadgeWrap.className = 'controls-right';
        controls.appendChild(ageBadgeWrap);

        const ageList = (kpi.metrics?.successRateByAge) || [];
        const labels = ageList.map(a => a.age);
        const values = ageList.map(a => a.rate);
        const prevValues = ageList.map(a => a.prev);
        const yoyBadge = document.createElement('span');
        yoyBadge.className = 'metric-badge';
        ageBadgeWrap.appendChild(yoyBadge);
        labels.forEach((lbl, idx) => {
            const label = document.createElement('label');
            label.innerHTML = `<input type="checkbox" checked data-idx="${idx}"> ${lbl}`;
            controls.appendChild(label);
        });

        const build = () => {
            const idxs = Array.from(controls.querySelectorAll('input[type=checkbox]:checked')).map(i=>Number(i.dataset.idx));
            return {
                labels: idxs.map(i=>labels[i]),
                values: idxs.map(i=>values[i])
            };
        };
        const initial = build();
        const updateYoyBadge = (idxsSel) => {
            const diffs = idxsSel
                .filter(i => typeof prevValues[i] !== 'undefined')
                .map(i => values[i] - prevValues[i]);
            if (diffs.length) {
                const avg = diffs.reduce((a,b)=>a+b,0) / diffs.length;
                yoyBadge.classList.toggle('negative', avg < 0);
                yoyBadge.textContent = `前年比 ${avg>=0?'+':''}${avg.toFixed(1)}pt`;
                yoyBadge.style.display = '';
            } else {
                yoyBadge.style.display = 'none';
            }
        };
        updateYoyBadge(labels.map((_,i)=>i));

        // Min/Max badges
        const statsBadge = document.createElement('span');
        statsBadge.className = 'metric-badge';
        ageBadgeWrap.appendChild(statsBadge);
        const updateStats = (idxsSel) => {
            const vals = idxsSel.map(i => values[i]);
            if (!vals.length) { statsBadge.style.display='none'; return; }
            const mn = Math.min(...vals), mx = Math.max(...vals);
            statsBadge.textContent = `範囲 ${mn}–${mx}%`;
            statsBadge.style.display='';
        };
        updateStats(labels.map((_,i)=>i));

        const ageChart = new Chart(ageCtx, {
            type: 'radar',
            data: {
                labels: initial.labels,
                datasets: [{
                    label: '転職成功率（%）',
                    data: initial.values,
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

        controls.addEventListener('change', () => {
            const next = build();
            ageChart.data.labels = next.labels;
            ageChart.data.datasets[0].data = next.values;
            ageChart.update();
            const idxsSel = Array.from(controls.querySelectorAll('input[type=checkbox]:checked')).map(i=>Number(i.dataset.idx));
            updateYoyBadge(idxsSel);
            updateStats(idxsSel);
        });
    }
    }).catch(err => {
        console.warn('KPI data load failed:', err);
    });
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
    const numMatch = text.match(/[\d.,]+/);
    
    if (numMatch) {
        const raw = numMatch[0];
        const cleaned = raw.replace(/,/g, '');
        const finalValue = parseFloat(cleaned);
        const suffix = text.replace(raw, '');
        const decimals = (cleaned.split('.')[1] || '').length;
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
            
            const displayValue = Number(currentValue)
                .toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
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

// Simple moving average of period p
function movingAverage(arr, p) {
    const out = [];
    for (let i = 0; i < arr.length; i++) {
        const start = Math.max(0, i - p + 1);
        const slice = arr.slice(start, i + 1);
        const avg = slice.reduce((a,b)=>a+b,0) / slice.length;
        out.push(Number(avg.toFixed(2)));
    }
    return out;
}

function avg(arr) {
    if (!arr || !arr.length) return 0;
    return arr.reduce((a,b)=>a+b,0)/arr.length;
}

function median(arr) {
    if (!arr || !arr.length) return 0;
    const a = arr.slice().sort((x,y)=>x-y);
    const mid = Math.floor(a.length/2);
    if (a.length % 2 === 0) return (a[mid-1] + a[mid]) / 2;
    return a[mid];
}

// Fetch KPI data from local JSON (with fallback)
function fetchKPIData() {
    // If running from file://, fetch may be blocked; return default data
    const isFile = typeof location !== 'undefined' && location.protocol === 'file:';
    if (isFile) {
        return Promise.resolve(defaultKpiData());
    }
    return fetch('data/kpi.json', { cache: 'no-cache' })
        .then(r => {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.json();
        })
        .catch(() => defaultKpiData());
}

function defaultKpiData() {
    return {
        lastUpdated: '2025-08-21',
        sources: [{ name: '厚生労働省', url: 'https://www.mhlw.go.jp/' }],
        metrics: {
            jobRatio: {
                months: ['1月','2月','3月','4月','5月','6月','7月','8月'],
                values: [1.15, 1.18, 1.22, 1.25, 1.23, 1.26, 1.28, 1.28],
                prevYearValues: [1.10, 1.12, 1.15, 1.18, 1.17, 1.19, 1.22, 1.24]
            },
            salaryByIndustry: [
                { industry: 'IT・通信', avg: 580, prev: 560 },
                { industry: '金融・保険', avg: 520, prev: 505 },
                { industry: '製造業', avg: 480, prev: 470 },
                { industry: '商社', avg: 510, prev: 500 },
                { industry: '建設・不動産', avg: 450, prev: 445 },
                { industry: 'コンサル', avg: 650, prev: 620 }
            ],
            regionJobShare: [
                { region: '関東', share: 45, prev: 44 },
                { region: '関西', share: 25, prev: 24 },
                { region: '中部', share: 12, prev: 12 },
                { region: '九州', share: 8, prev: 8 },
                { region: '東北', share: 5, prev: 6 },
                { region: 'その他', share: 5, prev: 6 }
            ],
            successRateByAge: [
                { age: '20代前半', rate: 75, prev: 74 },
                { age: '20代後半', rate: 82, prev: 80 },
                { age: '30代前半', rate: 78, prev: 77 },
                { age: '30代後半', rate: 65, prev: 66 },
                { age: '40代前半', rate: 55, prev: 54 },
                { age: '40代後半', rate: 45, prev: 46 }
            ]
        }
    };
}

// Dashboard Source Display Function
function showDashboardSource() {
    const modal = document.getElementById('sourceModal');
    const modalTitle = document.getElementById('sourceModalTitle');
    const modalBody = document.getElementById('sourceModalBody');
    
    modalTitle.textContent = '📄 ページソース';
    modalBody.innerHTML = `
      <div class="source-info">
        <h4>参照URL</h4>
        <ul>
          <li><a href="https://cdn.jsdelivr.net/npm/chart.js" target="_blank">https://cdn.jsdelivr.net/npm/chart.js</a></li>
          <li><a href="https://cdn.jsdelivr.net/npm/chartjs-plugin-annotation@3.0.1/dist/chartjs-plugin-annotation.min.js" target="_blank">chartjs-plugin-annotation</a></li>
          <li><a href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" target="_blank">Google Fonts (Inter)</a></li>
          <li><a href="https://fonts.gstatic.com" target="_blank">https://fonts.gstatic.com</a></li>
          <li><a href="data/kpi.json" target="_blank">data/kpi.json</a></li>
        </ul>
      </div>
    `;
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    setupDashFocusTrap(modal);
}

function closeSourceModal() {
    const modal = document.getElementById('sourceModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    removeDashFocusTrap();
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('sourceModal');
    if (event.target === modal) {
        closeSourceModal();
    }
}

// Close modal on ESC
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const modal = document.getElementById('sourceModal');
        if (modal && modal.style.display === 'block') {
            closeSourceModal();
        }
    }
});

// Focus trap for dashboard source modal
let dashFocusTrapHandler = null;
function setupDashFocusTrap(modal) {
    const selectors = 'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])';
    const focusables = Array.from(modal.querySelectorAll(selectors)).filter(el => !el.hasAttribute('disabled'));
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    dashFocusTrapHandler = function(e) {
        if (e.key !== 'Tab') return;
        if (e.shiftKey) {
            if (document.activeElement === first) { e.preventDefault(); last.focus(); }
        } else {
            if (document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
    };
    document.addEventListener('keydown', dashFocusTrapHandler);
}
function removeDashFocusTrap() {
    if (dashFocusTrapHandler) {
        document.removeEventListener('keydown', dashFocusTrapHandler);
        dashFocusTrapHandler = null;
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
