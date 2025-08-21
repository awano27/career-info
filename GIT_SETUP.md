# GitHub Pages デプロイ手順

## 📋 前提条件
- Gitがインストールされていること
- GitHubアカウントを持っていること
- `awano27/career-info` リポジトリが作成済みであること

## 🚀 手順

### 1. コマンドプロンプトまたはPowerShellを開く

### 2. プロジェクトディレクトリに移動
```bash
cd C:\Users\yoshitaka\career-info
```

### 3. Gitリポジトリを初期化
```bash
git init
```

### 4. すべてのファイルをステージングエリアに追加
```bash
git add .
```

### 5. 初回コミットを作成
```bash
git commit -m "Initial commit: Career Horizon website

🚀 Features:
- KPI dashboard with interactive charts
- News page with modal functionality
- Sophisticated adult-oriented design
- Responsive layout for all devices

🎨 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### 6. GitHubリモートリポジトリを設定
```bash
git remote add origin https://github.com/awano27/career-info.git
```

### 7. mainブランチに名前を変更（必要に応じて）
```bash
git branch -M main
```

### 8. GitHubにプッシュ
```bash
git push -u origin main
```

## 🌐 GitHub Pages設定

### 1. GitHubリポジトリページにアクセス
https://github.com/awano27/career-info

### 2. Settings → Pages に移動
https://github.com/awano27/career-info/settings/pages

### 3. Source設定
- **Source**: Deploy from a branch
- **Branch**: main
- **Folder**: / (root)

### 4. Save をクリック

### 5. 数分後にサイトが公開されます
https://awano27.github.io/career-info/

## 📁 現在のファイル一覧

```
career-info/
├── index.html          # KPI指標ダッシュボードページ（メインページ）
├── news.html           # 転職ニュースページ
├── style.css           # 統一CSSスタイル
├── dashboard.js        # ダッシュボード用JavaScript
├── news.js             # ニュースページ用JavaScript
├── docs/
│   └── requirements.html # 要件定義書
├── README.md           # プロジェクト説明
├── .gitignore          # Git無視ファイル設定
└── GIT_SETUP.md        # この手順書
```

## 🔄 今後の更新手順

ファイルを更新した後：

```bash
git add .
git commit -m "Update: 変更内容の説明"
git push
```

## ⚠️ 注意事項

1. **メインページ**: `index.html` がGitHub Pagesのホームページとして表示されます
2. **Chart.js**: CDNから読み込まれるため、インターネット接続が必要です
3. **フォント**: Google Fontsから読み込まれます
4. **デプロイ時間**: プッシュ後、サイト反映まで1-5分程度かかる場合があります

## 🎯 完了後の確認

✅ https://awano27.github.io/career-info/ でダッシュボードが表示される
✅ https://awano27.github.io/career-info/news.html でニュースページが表示される
✅ チャートが正常に表示される
✅ ニュース記事のモーダルが動作する
✅ レスポンシブデザインが機能する