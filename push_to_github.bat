@echo off
echo GitHubへのプッシュを開始します...
echo.

REM Gitステータスを確認
echo [1/4] 現在のステータスを確認中...
git status
echo.

REM すべての変更をステージングに追加
echo [2/4] 変更をステージングに追加中...
git add .
echo.

REM コミットを作成
echo [3/4] コミットを作成中...
git commit -m "Update: Color scheme changed to professional blue (#337ab7, #2e6da4)

🎨 Design Updates:
- Changed color palette from brown to professional blue
- Updated all charts colors in dashboard
- Modified buttons and links hover effects
- Applied new accent colors throughout the site

✨ Features Added:
- HTML source code viewer for news articles
- Page source information modal
- Source buttons for each news item

📱 Responsive design maintained
🔍 All interactive elements updated

Co-Authored-By: Claude <noreply@anthropic.com>"

echo.

REM GitHubへプッシュ
echo [4/4] GitHubへプッシュ中...
git push origin main

echo.
echo ✅ プッシュが完了しました！
echo.
echo GitHub Pagesでサイトを確認してください:
echo https://awano27.github.io/career-info/
echo.
pause