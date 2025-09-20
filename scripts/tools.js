(() => {
  let kpiData = null;

  document.addEventListener('DOMContentLoaded', () => {
    fetchKpi();
    wireSalaryForm();
    wireSkillForm();
    wireNegotiationForm();
  });

  async function fetchKpi(){
    try {
      const res = await fetch('data/kpi.json', { cache: 'no-cache' });
      if(res.ok){
        kpiData = await res.json();
      }
    } catch (err){
      console.warn('kpi.json を取得できませんでした', err);
    }
  }

  function wireSalaryForm(){
    const form = document.getElementById('salary-form');
    const resultText = document.getElementById('salary-result');
    const detailList = document.getElementById('salary-details');
    const benchmark = document.getElementById('salary-benchmark');
    const exportBtn = document.getElementById('salary-export');
    if(!form || !resultText || !detailList || !benchmark) return;

    form.addEventListener('submit', ev => {
      ev.preventDefault();
      const current = Number(form.current.value || 0);
      const increase = Number(form.increase.value || 0) / 100;
      const regionSelect = form.region;
      const coef = Number(regionSelect.options[regionSelect.selectedIndex].dataset.coef || 1);
      const industryKey = form.industry.value;
      if(current <= 0){
        resultText.textContent = '入力値を確認してください';
        detailList.innerHTML = '';
        return;
      }
      const baseTarget = current * (1 + increase);
      const localized = Math.round(baseTarget * coef);
      const lower = Math.round(localized * 0.9);
      const upper = Math.round(localized * 1.1);
      resultText.textContent = `${localized.toLocaleString('ja-JP')} 万円`;
      detailList.innerHTML = `
        <li>推奨レンジ: ${lower.toLocaleString('ja-JP')} 〜 ${upper.toLocaleString('ja-JP')} 万円</li>
        <li>上げ幅: ${(increase * 100).toFixed(1)}% / 地域係数: ${coef.toFixed(2)}</li>
      `;
      const industry = getIndustryData(industryKey);
      if(industry){
        benchmark.textContent = `業種中央値 ${industry.median} 万円 / P75 ${industry.p75} 万円 / 前年比 +${industry.median - industry.prev} 万円`;
      } else {
        benchmark.textContent = '参考データを取得できませんでした。';
      }
      form.dataset.lastResult = JSON.stringify({ current, increase, coef, industryKey, localized, lower, upper });
    });

    if(exportBtn){
      exportBtn.addEventListener('click', () => {
        const raw = form.dataset.lastResult;
        if(!raw){
          alert('先にシミュレーションを実行してください。');
          return;
        }
        const data = JSON.parse(raw);
        const industry = getIndustryData(data.industryKey);
        const html = `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><title>年収シミュレーター結果</title><style>body{font-family:'Inter','Segoe UI',sans-serif;padding:32px;line-height:1.6;}h1{font-size:20px;}ul{padding-left:1.2rem;}li{margin-bottom:6px;}</style></head><body><h1>年収ターゲット・シミュレーター結果</h1><p>計算日時: ${new Date().toLocaleString()}</p><ul><li>現在の年収: ${data.current} 万円</li><li>希望上げ幅: ${(data.increase*100).toFixed(1)}%</li><li>地域係数: ${data.coef.toFixed(2)}</li><li>推奨レンジ: ${data.lower} 〜 ${data.upper} 万円</li><li>ターゲット値: ${data.localized} 万円</li>${industry ? `<li>業界中央値: ${industry.median} 万円 / P75: ${industry.p75} 万円</li>` : ''}</ul><p>この結果を PDF 化する場合はブラウザの印刷ダイアログから "PDF に保存" を選択してください。</p><script>window.print();</script></body></html>`;
        const win = window.open('', '_blank');
        if(win){
          win.document.write(html);
          win.document.close();
        }
      });
    }
  }

  function getIndustryData(key){
    if(!kpiData || !kpiData.metrics?.salaryMedian?.industries) return null;
    return kpiData.metrics.salaryMedian.industries.find(ind => ind.key === key) || null;
  }

  function wireSkillForm(){
    const form = document.getElementById('skill-form');
    const summary = document.getElementById('skill-summary');
    const suggestions = document.getElementById('skill-suggestions');
    const links = document.getElementById('skill-links');
    if(!form || !summary || !suggestions || !links) return;

    const RESOURCES = {
      data: { label: 'データ分析 / SQL', recommend: 'DataCamp 無料 SQL 講座, Udemy 「実践データ分析」', missing: 'SQL・Tableau に強みを伸ばすと市場価値が高まります。' },
      python: { label: 'Python / 機械学習', recommend: 'Coursera 「Machine Learning Specialization」', missing: 'Python × AI の案件が増加中。ハンズオンで実績を作りましょう。' },
      project: { label: 'プロジェクトマネジメント', recommend: 'PMBOK 第 7 版ガイド, PMI-ACP', missing: 'マネジメント経験が不足している場合はスコープ管理の実績を整理しましょう。' },
      frontend: { label: 'フロントエンド開発', recommend: 'Frontend Masters, React 公式チュートリアル', missing: 'UI 実装力が加わるとプロダクト職の幅が広がります。' },
      cloud: { label: 'クラウド設計', recommend: 'AWS Skill Builder, Azure Fundamentals', missing: 'クラウドアーキテクト人材の需要が高い領域です。' },
      communication: { label: 'ビジネスコミュニケーション', recommend: 'Udemy 「1 on 1 コーチング実践」', missing: '顧客折衝・利害調整力を示せると評価が上がります。' },
      english: { label: '英語 / グローバル対応', recommend: 'Bizmates, Duolingo', missing: '海外案件・外資への応募ではビジネス英語が差別化ポイントになります。' },
      security: { label: 'セキュリティ基礎', recommend: 'IPA セキュリティキャンプ資料', missing: 'ゼロトラストや脆弱性対応の基礎知識を補うと信頼性が上がります。' }
    };

    form.addEventListener('submit', ev => {
      ev.preventDefault();
      const checked = Array.from(form.querySelectorAll('input[type="checkbox"]:checked')).map(c => c.value);
      if(!checked.length){
        summary.textContent = 'スキルを選択してください。';
        suggestions.innerHTML = '';
        links.textContent = '';
        return;
      }
      const missing = Object.keys(RESOURCES).filter(key => !checked.includes(key));
      const strengths = checked.map(key => RESOURCES[key]?.label || key);
      summary.textContent = `保有スキル: ${strengths.join(' / ')}`;
      suggestions.innerHTML = missing.slice(0, 3).map(key => `<li>${RESOURCES[key]?.missing || `${key} を補強しましょう。`}</li>`).join('') || '<li>主要スキルは十分に揃っています。実績を資料化しましょう。</li>';
      links.textContent = '推奨リソース: ' + checked.concat(missing.slice(0,1)).map(key => RESOURCES[key]?.recommend).filter(Boolean).join(' / ');
    });
  }

  function wireNegotiationForm(){
    const form = document.getElementById('negotiation-form');
    const output = document.getElementById('negotiation-output');
    const copyBtn = document.getElementById('negotiation-copy');
    if(!form || !output || !copyBtn) return;

    form.addEventListener('submit', ev => {
      ev.preventDefault();
      const role = form['negotiation-role'].value;
      const fact = form['negotiation-fact'].value.trim();
      const request = form['negotiation-request'].value.trim();
      const fallback = form['negotiation-fallback'].value.trim();
      const roleLabel = getRoleLabel(role);
      output.value = `【挨拶】\nお時間をいただきありがとうございます。本オファーについて前向きに検討しており、条件のご相談ができればと思っています。\n\n【実績・根拠】\n${fact || '直近の成果をここに記載（例: ARR 120% / 解約率 -1.2pt）'}\n\n【希望条件】\n${request || '例: 基本給 650 万円, リモート 80%'}\n\n【相手へのメリット】\n${roleLabel} の観点で、私の強みがどのように貢献できるかを説明します。\n\n【代替案】\n${fallback || '例: 住宅補助 3 万円 / RSU 付与'}\n\n【クロージング】\n初年度は上記条件でご検討いただき、半年後のレビューで成果に応じた見直しを行う形はいかがでしょうか。`;
      output.focus();
      output.select();
    });

    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(output.value || '');
        copyBtn.textContent = 'コピーしました';
        setTimeout(() => { copyBtn.textContent = 'クリップボードにコピー'; }, 2000);
      } catch (err){
        console.warn('コピーに失敗しました', err);
      }
    });
  }

  function getRoleLabel(role){
    switch(role){
      case 'recruiter': return '採用担当として、採用計画や予算の視点';
      case 'agency': return 'エージェントとして、候補者の市場価値や競合案件の視点';
      case 'manager': return '入社予定上長として、チーム課題と期待役割の視点';
      default: return '相手の立場';
    }
  }
})();
