// Dashboard JavaScript (clean UTF-8) for KPI Charts and Interactions

document.addEventListener('DOMContentLoaded', () => {
  const mobileMenu = document.getElementById('mobile-menu');
  const navMenu = document.querySelector('.nav-menu');
  if (mobileMenu && navMenu) {
    mobileMenu.addEventListener('click', () => navMenu.classList.toggle('active'));
    document.querySelectorAll('.nav-link').forEach(a => a.addEventListener('click', () => navMenu.classList.remove('active')));
  }
  initializeCharts();
  animateKPICards();
});

function initializeCharts() {
  if (typeof Chart === 'undefined') { setTimeout(initializeCharts, 100); return; }
  try { const p = window['ChartAnnotation'] || window['chartjs-plugin-annotation']; if (p) Chart.register(p); } catch {}

  fetchKPIData().then(kpi => {
    try {
      const updateEl = document.querySelector('.update-time');
      if (updateEl && kpi.lastUpdated) {
        const srcNames = (kpi.sources || []).map(s => s.name).join(' / ');
        updateEl.textContent = `最終更新: ${kpi.lastUpdated}` + (srcNames ? ` ・ 出典: ${srcNames}` : '');
        const list = document.getElementById('dataSourceList');
        if (list) {
          list.innerHTML = '';
          (kpi.sources || []).forEach(s => {
            const li = document.createElement('li');
            li.innerHTML = s.url ? `<a href="${s.url}" target="_blank" rel="noopener">${s.name}</a>` : `${s.name}`;
            list.appendChild(li);
          });
          if (!kpi.sources || kpi.sources.length === 0) {
            const li = document.createElement('li'); li.textContent = 'データソースの情報は現在準備中です'; list.appendChild(li);
          }
        }
      }
    } catch {}

    // KPI summary for turnover (national average)
    try { updateTurnoverKpi(kpi); } catch {}
    // KPI cards (4枚) の更新
    try { updateKpiCards(kpi); } catch {}

    buildJobRatioChart(kpi);
    buildSalaryChart(kpi);
    buildRegionChart(kpi);
    buildAgeChart(kpi);
    buildTurnoverRegionChart(kpi);
    buildTurnoverMap(kpi);
  }).catch(err => console.warn('KPI data load failed:', err));
}

function buildJobRatioChart(kpi) {
  const el = document.getElementById('jobRatioChart'); if (!el) return;
  const months = (kpi.metrics?.jobRatio?.months) || ['1月','2月','3月','4月','5月','6月','7月','8月'];
  const values = (kpi.metrics?.jobRatio?.values) || [1.15,1.18,1.22,1.25,1.23,1.26,1.28,1.28];
  const prevYear = (kpi.metrics?.jobRatio?.prevYearValues) || [];

  const container = el.closest('.chart-container');
  const titleEl = container?.querySelector('h3');
  const controls = document.createElement('div'); controls.className = 'chart-controls';
  controls.innerHTML = `
    <label><input type="checkbox" id="maToggle"> 移動平均（3ヶ月）</label>
    <label><input type="checkbox" id="yoyToggle"> 前年ライン</label>
    <label><input type="checkbox" id="annoToggle" checked> 注釈</label>
    <label>期間:
      <select id="periodSelect">
        <option value="all">全期間</option>
        <option value="6">直近6ヶ月</option>
      </select>
    </label>`;
  titleEl?.insertAdjacentElement('afterend', controls);

  let labels = months.slice(); let data = values.slice(); let prev = prevYear.slice();
  const badgeWrap = document.createElement('div'); badgeWrap.className = 'controls-right'; controls.appendChild(badgeWrap);
  const momBadge = document.createElement('span'); momBadge.className = 'metric-badge'; momBadge.id = 'job-mom-badge'; badgeWrap.appendChild(momBadge);
  const yoyBadge = document.createElement('span'); yoyBadge.className = 'metric-badge'; yoyBadge.id = 'job-yoy-badge'; badgeWrap.appendChild(yoyBadge);
  function last(arr){ return (arr && arr.length) ? arr[arr.length - 1] : undefined; }
  function updateBadges(vals, prevVals){
    if (vals.length >= 2) { const m = vals[vals.length - 1] - vals[vals.length - 2]; momBadge.classList.toggle('negative', m < 0); momBadge.textContent = `前月比${m>=0?'+':''}${m.toFixed(2)}`; momBadge.style.display=''; } else momBadge.style.display='none';
    if (prevVals.length === vals.length && vals.length){ const y = vals[vals.length - 1] - prevVals[prevVals.length - 1]; yoyBadge.classList.toggle('negative', y < 0); yoyBadge.textContent = `前年比${y>=0?'+':''}${y.toFixed(2)}`; yoyBadge.style.display=''; } else yoyBadge.style.display='none';
  }
  updateBadges(data, prev);

  const chart = new Chart(el, { type: 'line', data: { labels, datasets: [{ label: '有効求人倍率', data, borderColor: '#337ab7', backgroundColor: 'rgba(51,122,183,.1)', borderWidth: 3, fill: true, tension: .4 }] }, options: {
    responsive:true, maintainAspectRatio:false, interaction:{intersect:false}, plugins:{ legend:{display:false}, tooltip:{backgroundColor:'rgba(0,0,0,.8)',titleColor:'#fff',bodyColor:'#fff'}, annotation:{ annotations:{ threshold:{ type:'line', yMin:1.20, yMax:1.20, borderColor:'#ef4444', borderWidth:1, borderDash:[4,4], label:{enabled:true, content:'目標 1.20', backgroundColor:'rgba(239,68,68,.08)', color:'#ef4444'}, display:true }, latest:{ type:'line', xMin:labels[labels.length - 1], xMax:labels[labels.length - 1], borderColor:'#10b981', borderWidth:1, label:{enabled:true, content:'最新', backgroundColor:'rgba(16,185,129,.08)', color:'#0f5132'}, display:true } } } }, scales:{ x:{ grid:{display:false}}, y:{ beginAtZero:false, min:1.0, max:1.4 } } } });

  controls.querySelector('#maToggle')?.addEventListener('change', e => {
    const ex = chart.data.datasets.find(d => d._isMA);
    if (e.target.checked && !ex) chart.data.datasets.push({ label:'移動平均（3ヶ月）', data:movingAverage(data,3), borderColor:'#5cb85c', backgroundColor:'rgba(92,184,92,.08)', borderWidth:2, fill:false, tension:.3, pointRadius:0, _isMA:true });
    if (!e.target.checked && ex) chart.data.datasets = chart.data.datasets.filter(d=>!d._isMA);
    chart.update();
  });
  controls.querySelector('#yoyToggle')?.addEventListener('change', e => {
    const idx = chart.data.datasets.findIndex(d=>d._isYOY);
    if (e.target.checked && prev.length === data.length && idx === -1) chart.data.datasets.push({ label:'前年', data:prev, borderColor:'#9ca3af', backgroundColor:'transparent', borderWidth:2, fill:false, tension:.3, pointRadius:0, borderDash:[6,4], _isYOY:true });
    if (!e.target.checked && idx !== -1) chart.data.datasets.splice(idx,1);
    chart.update();
  });
  controls.querySelector('#annoToggle')?.addEventListener('change', e => {
    const ann = chart.options.plugins?.annotation?.annotations; if (!ann) return; Object.values(ann).forEach(a => a.display = e.target.checked); chart.update();
  });
  controls.querySelector('#periodSelect')?.addEventListener('change', e => {
    const per = e.target.value; const srcL = months, srcV = values, srcP = prevYear;
    if (per === '6' && srcV.length > 6) { const st = srcV.length - 6; labels = srcL.slice(st); data = srcV.slice(st); prev = srcP.length===srcV.length?srcP.slice(st):[]; } else { labels = srcL.slice(); data = srcV.slice(); prev = srcP.slice(); }
    chart.data.labels = labels; chart.data.datasets[0].data = data; const maDs = chart.data.datasets.find(d=>d._isMA); if (maDs) maDs.data = movingAverage(data,3); const yoyDs = chart.data.datasets.find(d=>d._isYOY); if (yoyDs && prev.length===data.length) yoyDs.data = prev; const ann = chart.options.plugins?.annotation?.annotations; if (ann?.latest){ const lastLabel = labels[labels.length - 1]; ann.latest.xMin = lastLabel; ann.latest.xMax = lastLabel;} chart.update(); updateBadges(data, prev);
  });
}

function buildSalaryChart(kpi){
  const el = document.getElementById('salaryChart'); if (!el) return;
  const list = (kpi.metrics?.salaryByIndustry)||[];
  const industries = list.map(s=>s.industry); const dataMap = Object.fromEntries(list.map(s=>[s.industry,s.avg])); const prevMap = Object.fromEntries(list.filter(s=>typeof s.prev!=="undefined").map(s=>[s.industry,s.prev]));
  const container = el.closest('.chart-container'); const titleEl = container?.querySelector('h3');
  const controls = document.createElement('div'); controls.className='chart-controls'; controls.innerHTML = `<span class="muted">表示対象:</span>`; titleEl?.insertAdjacentElement('afterend', controls);
  const right = document.createElement('div'); right.className='controls-right'; controls.appendChild(right);
  industries.forEach(name=>{ const l=document.createElement('label'); l.innerHTML=`<input type="checkbox" checked data-ind="${name}"> ${name}`; controls.appendChild(l); });
  const yoyBadge = document.createElement('span'); yoyBadge.className='metric-badge'; right.appendChild(yoyBadge);
  const buildSeries=()=>{ const sel=Array.from(controls.querySelectorAll('input[type=checkbox]:checked')).map(i=>i.dataset.ind); return { labels: sel, values: sel.map(n=>dataMap[n])}; };
  const initial = buildSeries(); updateSalaryYoy();
  const chart = new Chart(el,{type:'bar',data:{labels:initial.labels,datasets:[{label:'平均年収（万円）',data:initial.values,backgroundColor:['#337ab7','#5cb85c','#f0ad4e','#d9534f','#2e6da4','#5bc0de'],borderRadius:6}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},annotation:{annotations:{avgLine:{type:'line',yMin:avg(initial.values),yMax:avg(initial.values),borderColor:'#6b7280',borderWidth:1,borderDash:[6,4],label:{enabled:true,content:'平均',backgroundColor:'rgba(107,114,128,.08)',color:'#374151'},display:true},medianLine:{type:'line',yMin:median(initial.values),yMax:median(initial.values),borderColor:'#0ea5e9',borderWidth:1,borderDash:[4,4],label:{enabled:true,content:'中央値',backgroundColor:'rgba(14,165,233,.08)',color:'#075985'},display:false}}}},scales:{y:{beginAtZero:true,max:700}}});
  const avgToggle=document.createElement('label'); avgToggle.innerHTML='<input type="checkbox" id="avgToggle" checked> 平均ライン'; const medToggle=document.createElement('label'); medToggle.innerHTML='<input type="checkbox" id="medianToggle"> 中央値ライン'; controls.appendChild(avgToggle); controls.appendChild(medToggle);
  controls.addEventListener('change',()=>{ const next=buildSeries(); chart.data.labels=next.labels; chart.data.datasets[0].data=next.values; const a=chart.options.plugins?.annotation?.annotations; if(a){ a.avgLine.yMin=a.avgLine.yMax=avg(next.values); a.medianLine.yMin=a.medianLine.yMax=median(next.values); a.avgLine.display=controls.querySelector('#avgToggle')?.checked; a.medianLine.display=controls.querySelector('#medianToggle')?.checked; } chart.update(); updateSalaryYoy(); });
  function updateSalaryYoy(){ const sel=Array.from(controls.querySelectorAll('input[type=checkbox]:checked')).map(i=>i.dataset.ind); const diffs=sel.filter(n=>typeof prevMap[n]!=='undefined').map(n=>dataMap[n]-prevMap[n]); if(diffs.length){ const av=diffs.reduce((a,b)=>a+b,0)/diffs.length; yoyBadge.classList.toggle('negative', av<0); yoyBadge.textContent=`前年比${av>=0?'+':''}${Math.round(av)}万円`; yoyBadge.style.display=''; } else { yoyBadge.style.display='none'; } }
}

function buildRegionChart(kpi){
  const el=document.getElementById('regionChart'); if(!el) return; const container=el.closest('.chart-container'); const titleEl=container?.querySelector('h3');
  const controls=document.createElement('div'); controls.className='chart-controls'; controls.innerHTML=`<label>表示数:<select id="regionCount"><option value="all">全て</option><option value="3">上位3</option><option value="5">上位5</option></select></label>`; titleEl?.insertAdjacentElement('afterend',controls);
  const right=document.createElement('div'); right.className='controls-right'; controls.appendChild(right);
  const list=(kpi.metrics?.regionJobShare)||[]; const all=list.map(r=>({label:r.region,val:r.share,prev:r.prev}));
  const yoyBadge=document.createElement('span'); yoyBadge.className='metric-badge'; right.appendChild(yoyBadge);
  const overlay=document.createElement('div'); overlay.className='chart-center-overlay'; container?.appendChild(overlay);
  function build(count){ let arr=[...all].sort((a,b)=>b.val-a.val); if(count!=='all') arr=arr.slice(0,Number(count)); return {labels:arr.map(x=>x.label), values:arr.map(x=>x.val)} }
  function updateOverlay(labelsSel, valuesSel){ let idx=0; for(let i=1;i<valuesSel.length;i++) if(valuesSel[i]>valuesSel[idx]) idx=i; overlay.textContent=`トップ ${labelsSel[idx]||''} ${valuesSel[idx]||0}%`; }
  function updateYoy(labelsSel){ const diffs=labelsSel.map(n=>{ const it=all.find(x=>x.label===n); return (it&&typeof it.prev!=='undefined')? (it.val-it.prev):null;}).filter(v=>v!==null); if(diffs.length){ const av=diffs.reduce((a,b)=>a+b,0)/diffs.length; yoyBadge.classList.toggle('negative', av<0); yoyBadge.textContent=`前年比${av>=0?'+':''}${av.toFixed(1)}pt`; yoyBadge.style.display=''; } else yoyBadge.style.display='none'; }
  const initial=build('all'); const chart=new Chart(el,{type:'doughnut',data:{labels:initial.labels,datasets:[{data:initial.values,backgroundColor:['#337ab7','#5cb85c','#f0ad4e','#d9534f','#2e6da4','#5bc0de'],borderWidth:0}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom',labels:{padding:20,usePointStyle:true}}}}});
  updateOverlay(initial.labels, initial.values); updateYoy(initial.labels);
  controls.querySelector('#regionCount')?.addEventListener('change', e=>{ const next=build(e.target.value); chart.data.labels=next.labels; chart.data.datasets[0].data=next.values; chart.update(); updateOverlay(next.labels,next.values); updateYoy(next.labels); });
}

function buildAgeChart(kpi){
  const el=document.getElementById('ageChart'); if(!el) return; const container=el.closest('.chart-container'); const titleEl=container?.querySelector('h3');
  const controls=document.createElement('div'); controls.className='chart-controls'; controls.innerHTML = `<span class="muted">年代を選択</span>`; titleEl?.insertAdjacentElement('afterend',controls);
  const right=document.createElement('div'); right.className='controls-right'; controls.appendChild(right);
  const list=(kpi.metrics?.successRateByAge)||[]; const labels=list.map(a=>a.age); const values=list.map(a=>a.rate); const prev=list.map(a=>a.prev);
  labels.forEach((lbl,idx)=>{ const l=document.createElement('label'); l.innerHTML=`<input type="checkbox" checked data-idx="${idx}"> ${lbl}`; controls.appendChild(l); });
  const yoyBadge=document.createElement('span'); yoyBadge.className='metric-badge'; right.appendChild(yoyBadge);
  const statsBadge=document.createElement('span'); statsBadge.className='metric-badge'; right.appendChild(statsBadge);
  function build(){ const idxs=Array.from(controls.querySelectorAll('input[type=checkbox]:checked')).map(i=>Number(i.dataset.idx)); return { labels: idxs.map(i=>labels[i]), values: idxs.map(i=>values[i]), idxs } }
  function updateYoy(idxs){ const diffs=idxs.filter(i=>typeof prev[i]!=='undefined').map(i=>values[i]-prev[i]); if(diffs.length){ const av=diffs.reduce((a,b)=>a+b,0)/diffs.length; yoyBadge.classList.toggle('negative', av<0); yoyBadge.textContent=`前年比${av>=0?'+':''}${av.toFixed(1)}pt`; yoyBadge.style.display=''; } else yoyBadge.style.display='none'; }
  function updateStats(idxs){ const arr=idxs.map(i=>values[i]); if(!arr.length){ statsBadge.style.display='none'; return;} const mn=Math.min(...arr), mx=Math.max(...arr); statsBadge.textContent=`最小〜最大: ${mn}〜${mx}%`; statsBadge.style.display=''; }
  const initial=build(); updateYoy(initial.idxs); updateStats(initial.idxs);
  const chart=new Chart(el,{type:'radar',data:{labels:initial.labels,datasets:[{label:'転職成功率',data:initial.values,borderColor:'#337ab7',backgroundColor:'rgba(51,122,183,.2)',borderWidth:2,pointBackgroundColor:'#337ab7',pointBorderColor:'#ffffff',pointBorderWidth:2}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{r:{beginAtZero:true,max:100,ticks:{stepSize:20}}}}});
  controls.addEventListener('change',()=>{ const next=build(); chart.data.labels=next.labels; chart.data.datasets[0].data=next.values; chart.update(); updateYoy(next.idxs); updateStats(next.idxs); });
}

function updateTurnoverKpi(kpi){
  const wrap = document.getElementById('kpi-turnover'); if (!wrap) return;
  const list = (kpi.metrics?.turnoverRateByRegion) || [];
  if (!Array.isArray(list) || list.length === 0) return;
  const now = list.map(x => Number(x.rate)).filter(n => !isNaN(n));
  const pm = list.map(x => Number(x.prevMonth)).filter(n => !isNaN(n));
  const py = list.map(x => Number(x.prev)).filter(n => !isNaN(n));
  const nowAvg = avg(now);
  const pmAvg = pm.length ? avg(pm) : null;
  const pyAvg = py.length ? avg(py) : null;
  const val = wrap.querySelector('.kpi-value'); if (val) val.textContent = `${nowAvg.toFixed(1)} %`;
  const ch = wrap.querySelector('.kpi-change');
  const mom = (pmAvg != null) ? (nowAvg - pmAvg) : null;
  const yoy = (pyAvg != null) ? (nowAvg - pyAvg) : null;
  const momTxt = (mom != null) ? `前月比 ${mom>=0?'+':''}${mom.toFixed(2)}pt` : null;
  const yoyTxt = (yoy != null) ? `前年比 ${yoy>=0?'+':''}${yoy.toFixed(2)}pt` : null;
  if (ch) ch.textContent = [momTxt, yoyTxt].filter(Boolean).join(' ｜ ');
  const trend = wrap.querySelector('.kpi-trend');
  if (trend && mom != null) trend.textContent = mom > 0 ? '↗' : (mom < 0 ? '↘' : '→');
}

function updateKpiCards(kpi){
  const cards = document.querySelectorAll('.kpi-grid .kpi-card');
  if (!cards || cards.length < 4) return;

  const metrics = kpi.metrics || {};
  // 1) 有効求人倍率
  const jr = metrics.jobRatio || {};
  const jrVals = Array.isArray(jr.values) ? jr.values : [];
  const jrPrevY = Array.isArray(jr.prevYearValues) ? jr.prevYearValues : [];
  const jrLatest = jrVals.length ? jrVals[jrVals.length - 1] : null;
  const jrPrev = jrVals.length >= 2 ? jrVals[jrVals.length - 2] : null;
  const jrYoy = (jrPrevY.length === jrVals.length && jrLatest != null) ? (jrLatest - jrPrevY[jrPrevY.length - 1]) : null;
  setKpi(cards[0], jrLatest != null ? `${jrLatest.toFixed(2)} 倍` : '—', changeText(diffOrNull(jrLatest, jrPrev), jrYoy));

  // 2) 平均年収（業界平均の平均値）
  const sal = Array.isArray(metrics.salaryByIndustry) ? metrics.salaryByIndustry : [];
  const salAvg = avg(sal.map(x => x.avg));
  const salPrev = avg(sal.map(x => x.prev));
  setKpi(cards[1], isNum(salAvg) ? `${Math.round(salAvg).toLocaleString('ja-JP')} 万円` : '—', diffText(isNum(salAvg) && isNum(salPrev) ? (salAvg - salPrev) : null));

  // 3) 転職成功率（年代平均）
  const sr = Array.isArray(metrics.successRateByAge) ? metrics.successRateByAge : [];
  const srAvg = avg(sr.map(x => x.rate));
  const srPrev = avg(sr.map(x => x.prev));
  setKpi(cards[2], isNum(srAvg) ? `${srAvg.toFixed(1)} %` : '—', diffText(isNum(srAvg) && isNum(srPrev) ? (srAvg - srPrev) : null));

  // 4) 新規求人数（代替: 関東シェア）
  const rg = Array.isArray(metrics.regionJobShare) ? metrics.regionJobShare : [];
  const kanto = rg.find(x => x.region === '関東');
  const kShare = kanto && isNum(kanto.share) ? Number(kanto.share) : null;
  const kPrev = kanto && isNum(kanto.prev) ? Number(kanto.prev) : null;
  setKpi(cards[3], kShare != null ? `${kShare.toFixed(0)} %` : '—', diffText((kShare != null && kPrev != null) ? (kShare - kPrev) : null));

  function isNum(n){ return typeof n === 'number' && !isNaN(n); }
  function diffOrNull(a,b){ return (isNum(a) && isNum(b)) ? (a-b) : null; }
  function setKpi(card, valueText, change){ if(!card) return; const v=card.querySelector('.kpi-value'); const c=card.querySelector('.kpi-change'); if(v) v.textContent = valueText ?? '—'; if(c) c.textContent = change ?? '—'; }
  function diffText(delta){ if(!isNum(delta)) return '—'; const d=delta; const sign=d>0?'+':(d<0?'':'±'); return `前期比 ${sign}${Math.abs(d).toFixed(2)}`; }
  function changeText(mom,yoy){ const a = isNum(mom) ? `前月比 ${mom>=0?'+':''}${mom.toFixed(2)}` : null; const b = isNum(yoy) ? `前年同月比 ${yoy>=0?'+':''}${yoy.toFixed(2)}` : null; return [a,b].filter(Boolean).join(' ｜ ') || '—'; }
}

function buildTurnoverRegionChart(kpi){
  const el = document.getElementById('turnoverRegionChart'); if (!el) return;
  const container = el.closest('.chart-container'); const titleEl = container?.querySelector('h3');
  const controls = document.createElement('div'); controls.className = 'chart-controls';
  controls.innerHTML = `<span class="muted">前年と比較</span>`; titleEl?.insertAdjacentElement('afterend', controls);
  const right = document.createElement('div'); right.className = 'controls-right'; controls.appendChild(right);

  const list = (kpi.metrics?.turnoverRateByRegion) || [];
  if (!Array.isArray(list) || list.length === 0) return;
  const labels = list.map(r => r.region);
  const now = list.map(r => r.rate);
  const prev = list.map(r => r.prev);

  const yoyBadge = document.createElement('span'); yoyBadge.className = 'metric-badge'; right.appendChild(yoyBadge);
  const diff = [];
  for (let i=0;i<labels.length;i++) {
    if (typeof prev[i] !== 'undefined') diff.push(now[i] - prev[i]);
  }
  if (diff.length) {
    const avg = diff.reduce((a,b)=>a+b,0)/diff.length;
    yoyBadge.classList.toggle('negative', avg < 0);
    yoyBadge.textContent = `前年比${avg>=0?'+':''}${avg.toFixed(1)}pt`;
  }

  new Chart(el, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: '離職率(%)', data: now, backgroundColor: 'rgba(217,119,6,0.65)' },
        { label: '前年(%)', data: prev, backgroundColor: 'rgba(148,163,184,0.5)' }
      ]
    },
    options: baseBarOptions('%')
  });
}

async function buildTurnoverMap(kpi){
  const el = document.getElementById('turnoverMap'); if (!el) return;
  const list = (kpi.metrics?.turnoverRateByPrefecture) || null;
  const container = el.closest('.chart-container');
  if (!Array.isArray(list) || list.length === 0) {
    const info = document.createElement('div'); info.className = 'muted'; info.style.marginTop = '8px'; info.textContent = '都道府県別の離職率データは現在準備中です。';
    container?.appendChild(info); return;
  }
  try {
    const res = await fetch('https://cdn.jsdelivr.net/npm/japan-geojson@0.2.0/japan.geojson', { cache: 'force-cache' });
    if (!res.ok) throw new Error('geojson load failed');
    const geo = await res.json();
    const valMap = new Map(list.map(p => [p.pref, Number(p.rate)]));
    const data = geo.features.map(f => {
      const name = f.properties?.name_ja || f.properties?.nam_ja || f.properties?.name || '';
      return { feature: f, value: valMap.get(name) ?? null };
    });
    const values = data.map(d => d.value).filter(v => v != null);
    const min = Math.min(...values), max = Math.max(...values);
    new Chart(el, {
      type: 'choropleth',
      data: { labels: data.map(d => d.feature.properties?.name_ja || ''), datasets: [{ label: '離職率(%)', outline: geo, data }] },
      options: { showOutline: true, showGraticule: false, plugins: { legend: { position: 'bottom' } }, scales: { projection: { axis: 'x', projection: 'mercator' }, color: { quantize: 5, legend: { position: 'bottom' }, interpolator: (t)=> `rgba(217,119,6,${0.2 + 0.8*t})`, domain: [min, max] } } }
    });
  } catch (e) {
    const info = document.createElement('div'); info.className = 'muted'; info.style.marginTop = '8px'; info.textContent = '地図ロードに失敗しました。ネットワークを確認してください。'; container?.appendChild(info);
  }
}

// Utilities & helpers
function movingAverage(arr, p){ const out=[]; for(let i=0;i<arr.length;i++){ const s=Math.max(0,i-p+1); const sl=arr.slice(s,i+1); out.push(Number((sl.reduce((a,b)=>a+b,0)/sl.length).toFixed(2))); } return out; }
function avg(arr){ if(!arr||!arr.length) return 0; return arr.reduce((a,b)=>a+b,0)/arr.length; }
function median(arr){ if(!arr||!arr.length) return 0; const a=arr.slice().sort((x,y)=>x-y); const m=Math.floor(a.length/2); return a.length%2===0? (a[m-1]+a[m])/2 : a[m]; }

function fetchKPIData(){ const isFile = typeof location!=='undefined' && location.protocol==='file:'; if(isFile) return Promise.resolve(defaultKpiData()); return fetch('data/kpi.json',{cache:'no-cache'}).then(r=>{ if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); }).catch(()=>defaultKpiData()); }
function defaultKpiData(){ return { lastUpdated: '2025-08-30', sources:[{name:'厚生労働省',url:'https://www.mhlw.go.jp/'}], metrics:{ jobRatio:{ months:['1月','2月','3月','4月','5月','6月','7月','8月'], values:[1.15,1.18,1.22,1.25,1.23,1.26,1.28,1.28], prevYearValues:[1.10,1.12,1.15,1.18,1.17,1.19,1.22,1.24] }, salaryByIndustry:[ {industry:'IT・通信',avg:580,prev:560}, {industry:'金融・保険',avg:520,prev:505}, {industry:'製造業',avg:480,prev:470}, {industry:'小売・流通',avg:510,prev:500}, {industry:'建設・不動産',avg:450,prev:445}, {industry:'コンサル',avg:650,prev:620} ], regionJobShare:[ {region:'関東',share:45,prev:44}, {region:'関西',share:25,prev:24}, {region:'中部',share:12,prev:12}, {region:'九州',share:8,prev:8}, {region:'東北',share:5,prev:6}, {region:'その他',share:5,prev:6} ], turnoverRateByRegion:[ {region:'関東',rate:11.5,prevMonth:11.4,prev:11.2}, {region:'関西',rate:10.8,prevMonth:10.7,prev:10.6}, {region:'中部',rate:9.7,prevMonth:9.6,prev:9.5}, {region:'九州',rate:8.9,prevMonth:8.9,prev:8.8}, {region:'東北',rate:8.4,prevMonth:8.5,prev:8.6}, {region:'その他',rate:7.9,prevMonth:8.0,prev:8.1} ], successRateByAge:[ {age:'20代前半',rate:75,prev:74}, {age:'20代後半',rate:82,prev:80}, {age:'30代前半',rate:78,prev:77}, {age:'30代後半',rate:65,prev:66}, {age:'40代前半',rate:55,prev:54}, {age:'40代後半',rate:45,prev:46} ] } }; }

function animateKPICards(){ const kpiCards=document.querySelectorAll('.kpi-card'); const ob=new IntersectionObserver((entries)=>{ entries.forEach((entry,idx)=>{ if(entry.isIntersecting){ setTimeout(()=>{ entry.target.classList.add('fade-in'); animateKPIValue(entry.target.querySelector('.kpi-value')); }, idx*100); } }); },{threshold:.1}); kpiCards.forEach(c=>ob.observe(c)); }
function animateKPIValue(el){ if(!el) return; const text=el.textContent; const m=text.match(/[\d.,]+/); if(!m) return; const raw=m[0]; const cleaned=raw.replace(/,/g,''); const finalValue=parseFloat(cleaned); const suffix=text.replace(raw,''); const decimals=(cleaned.split('.')[1]||'').length; let cur=0; const inc=finalValue/30; const duration=1000; const step=duration/30; const timer=setInterval(()=>{ cur+=inc; if(cur>=finalValue){ cur=finalValue; clearInterval(timer);} const disp=Number(cur).toLocaleString(undefined,{minimumFractionDigits:decimals,maximumFractionDigits:decimals}); el.textContent=disp+suffix; },step); }

// Source modal
function showDashboardSource(){ const modal=document.getElementById('sourceModal'); const t=document.getElementById('sourceModalTitle'); const b=document.getElementById('sourceModalBody'); if(!modal||!t||!b) return; t.textContent='📄 ページソース'; b.innerHTML=`<div class="source-info"><h4>参照URL</h4><ul><li><a href="https://cdn.jsdelivr.net/npm/chart.js" target="_blank">Chart.js</a></li><li><a href="https://cdn.jsdelivr.net/npm/chartjs-plugin-annotation@3.0.1/dist/chartjs-plugin-annotation.min.js" target="_blank">chartjs-plugin-annotation</a></li><li><a href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" target="_blank">Google Fonts (Inter)</a></li><li><a href="data/kpi.json" target="_blank">data/kpi.json</a></li></ul></div>`; modal.style.display='block'; document.body.style.overflow='hidden'; setupDashFocusTrap(modal); }
function closeSourceModal(){ const modal=document.getElementById('sourceModal'); if(modal){ modal.style.display='none'; document.body.style.overflow=''; } }
function setupDashFocusTrap(modal){ const focusable=modal.querySelectorAll('a,button,input,select,textarea,[tabindex]'); const first=focusable[0], last=focusable[focusable.length-1]; modal.addEventListener('keydown',e=>{ if(e.key==='Tab'){ if(e.shiftKey && document.activeElement===first){ e.preventDefault(); last.focus(); } else if(!e.shiftKey && document.activeElement===last){ e.preventDefault(); first.focus(); } } if(e.key==='Escape'){ closeSourceModal(); } }); first?.focus(); }
