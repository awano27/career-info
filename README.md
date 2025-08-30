# Career Horizon — 転職市場向けインサイトサイト

Career Horizon は、転職市場のKPIダッシュボードとニュースを提供する静的Webサイトです。求職者・キャリア支援者・採用担当者が、最新データを直感的なチャートと要点整理で把握できることを目的としています。

## 主な機能
- KPIダッシュボード: 有効求人倍率、平均年収、地域シェア、年代別成功率など（移動平均・前月比/前年比バッジ、注釈表示）。
- ニュース一覧: カテゴリ/タグでフィルタ、モーダルで詳細、JSON-LD（NewsArticle）自動生成。
- 出典明示: 最終更新日時とデータソースを画面上に表示。`data/*.json` を参照します。

## ディレクトリ構成
```
career-info/
├─ index.html         # ダッシュボード
├─ news.html          # ニュース
├─ style.css          # 共通スタイル
├─ dashboard.js       # ダッシュボード用JS
├─ news.js            # ニュース用JS
├─ data/              # kpi.json / news.json / CSV
├─ scripts/           # fetch_news.mjs / import_text_to_news.mjs
└─ docs/              # 要件・ソース一覧
```

## 使い方（ローカル）
- 依存インストール: `npm ci`
- ニュース更新: `node scripts/fetch_news.mjs`
- テキストから追加: `node scripts/import_text_to_news.mjs path.txt "タイトル" 2025-08-30`
- プレビュー: `python -m http.server 8080` を実行し、`http://localhost:8080` で `index.html` / `news.html` を開く。

## 技術スタック / 運用
- HTML5 / CSS3 / JavaScript(ESM), Chart.js, chartjs-plugin-annotation
- GitHub Pages（配信）+ GitHub Actions（毎日 03:00 UTC ≈ 12:00 JST で `data/news.json` を更新）

## ライセンス
MIT License

注: 表示されるKPI/ニュースは一部サンプルを含みます。実運用時は各公式ソースをご確認ください。

