import Parser from 'rss-parser';
import { writeFileSync, mkdirSync, existsSync } from 'fs';

const parser = new Parser({
  timeout: 20000,
  requestOptions: {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123 Safari/537.36 CareerInfoBot/1.0'
    }
  }
});

// Feeds focusing on career/転職/就職/雇用 関連（RSS/Atom）
const feeds = [
  // 公式/公共
  { url: 'https://www.mhlw.go.jp/stf/news.rdf', org: '厚生労働省', defCat: '市場動向', defClass: 'market' },
  { url: 'https://www.mhlw.go.jp/stf/kinkyu.rdf', org: '厚生労働省（緊急）', defCat: '市場動向', defClass: 'market' },
  { url: 'https://www3.nhk.or.jp/rss/news/cat5.xml', org: 'NHK 経済', defCat: '市場動向', defClass: 'market' },
  { url: 'https://www3.nhk.or.jp/rss/news/cat0.xml', org: 'NHK 主要', defCat: '市場動向', defClass: 'market' },
  // 経済一般
  { url: 'https://www.asahi.com/rss/asahi/business.rdf', org: '朝日新聞 経済', defCat: '市場動向', defClass: 'market' },
  { url: 'https://rss.asahi.com/rss/asahi/newsheadlines.rdf', org: '朝日新聞 速報', defCat: '市場動向', defClass: 'market' },
  { url: 'https://toyokeizai.net/list/feed/rss', org: '東洋経済', defCat: '業界トレンド', defClass: 'industry' },
  { url: 'https://news.yahoo.co.jp/rss/topics/top-picks.xml', org: 'Yahoo!ニュース ピックアップ', defCat: '市場動向', defClass: 'market' },
  { url: 'https://news.yahoo.co.jp/rss/topics/business.xml', org: 'Yahoo!ニュース 経済', defCat: '市場動向', defClass: 'market' },
  { url: 'https://news.yahoo.co.jp/rss/topics/domestic.xml', org: 'Yahoo!ニュース 国内', defCat: '市場動向', defClass: 'market' },
  { url: 'https://news.yahoo.co.jp/rss/topics/world.xml', org: 'Yahoo!ニュース 国際', defCat: '市場動向', defClass: 'market' },
  { url: 'https://news.yahoo.co.jp/rss/topics/science.xml', org: 'Yahoo!ニュース 科学', defCat: '市場動向', defClass: 'market' },
  { url: 'https://news.livedoor.com/topics/rss/eco.xml', org: 'livedoor 経済', defCat: '市場動向', defClass: 'market' },
  { url: 'https://news.livedoor.com/topics/rss/top.xml', org: 'livedoor トップ', defCat: '市場動向', defClass: 'market' },
  // 省庁
  { url: 'https://www.fsa.go.jp/fsaNewsListAll_rss2.xml', org: '金融庁 新着', defCat: '市場動向', defClass: 'market' },
  { url: 'https://www.fsa.go.jp/fsaProcurementList_rss2.xml', org: '金融庁 調達', defCat: '市場動向', defClass: 'market' },
  // HR/キャリア系メディア（公開RSS）
  { url: 'https://hrnote.jp/feed/', org: 'HR NOTE', defCat: '専門家コラム', defClass: 'expert' },
  // bizSPA! はRSSのXMLが安定せず除外
  // { url: 'https://bizspa.jp/feed/', org: 'bizSPA!フレッシュ', defCat: '業界トレンド', defClass: 'industry' },
  { url: 'https://news.careerconnection.jp/feed/', org: 'キャリコネニュース', defCat: '業界トレンド', defClass: 'industry' },
  { url: 'https://goworkship.com/magazine/feed/', org: 'Workship MAGAZINE', defCat: '専門家コラム', defClass: 'expert' },
  { url: 'https://jinjibu.jp/rss/?mode=news&type=1', org: '日本の人事部（企業人事）', defCat: '業界トレンド', defClass: 'industry' },
  { url: 'https://jinjibu.jp/rss/?mode=news&type=2', org: '日本の人事部（人事サービス）', defCat: '業界トレンド', defClass: 'industry' },
  { url: 'https://thebridge.jp/feed', org: 'BRIDGE（スタートアップ）', defCat: '業界トレンド', defClass: 'industry' },
  // メタ系（カテゴリRSS）
  { url: 'https://b.hatena.ne.jp/hotentry/economics.rss', org: 'はてな 経済ホット', defCat: '市場動向', defClass: 'market' },
  { url: 'https://www.jiji.com/rss/ranking.rdf', org: '時事通信（ランキング）', defCat: '市場動向', defClass: 'market' },
  // ダイヤモンド、はてな（ビジネス）RSSは形式/可用性が不安定なため除外
  // プレス
  { url: 'https://prtimes.jp/index.rdf', org: 'PR TIMES', defCat: '業界トレンド', defClass: 'industry' }
];

const KEYWORDS = [
  '転職','就職','採用','求人','雇用','キャリア','働き方','副業',
  '年収','賃金','給料','昇給','失業','雇用統計','労働市場','人材',
  '育成','学び直し','リスキリング','内定','新卒','中途','雇い止め',
  '早期退職','希望退職','人員削減','人員整理','レイオフ','解雇'
];

function jpDate(date) {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${y}年${m}月${day}日`;
}

function stableId(link, date) {
  const base = (link || '').replace(/https?:\/\//,'').replace(/[^a-zA-Z0-9]+/g,'-').slice(0,60);
  const d = (date || '').toString().slice(0,10).replace(/[^0-9]/g,'');
  return `dyn-${d}-${base || 'item'}`;
}

function pickCategory(text, defCat, defClass) {
  const t = (text || '').toLowerCase();
  const has = (w) => t.includes(w.toLowerCase());
  if (['年収','賃金','給料','雇用統計','失業','労働市場'].some(has)) return { cat: '市場動向', cls: 'market' };
  if (['採用','求人','新卒','中途','人材'].some(has)) return { cat: '業界トレンド', cls: 'industry' };
  if (['働き方','副業','キャリア','リスキリング','学び直し'].some(has)) return { cat: '専門家コラム', cls: 'expert' };
  return { cat: defCat, cls: defClass };
}

function isRelevant(title, content) {
  const text = `${title || ''}\n${content || ''}`;
  const low = text.toLowerCase();
  return KEYWORDS.some(k => low.includes(k.toLowerCase()));
}

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#039;'}[m]));
}

async function parseWithRetry(url, tries = 2) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    try {
      return await parser.parseURL(url);
    } catch (e) {
      lastErr = e;
      await new Promise(r => setTimeout(r, 500 * (i + 1)));
    }
  }
  throw lastErr;
}

async function fetchAll() {
  const all = [];
  for (const feed of feeds) {
    try {
      const res = await parseWithRetry(feed.url, 2);
      const entries = (res.items || []).slice(0, 20);
      for (const it of entries) {
        const title = it.title || '';
        const content = (it.contentSnippet || it.content || '').toString();
        if (!isRelevant(title, content)) continue;
        const when = it.isoDate || it.pubDate;
        const jp = jpDate(when);
        const { cat, cls } = pickCategory(`${title}\n${content}`, feed.defCat, feed.defClass);
        const link = it.link || feed.url;
        all.push({
          id: stableId(link, when),
          title: title || '無題',
          category: cat,
          categoryClass: cls,
          date: jp,
          author: feed.org,
          readTimeMin: 3,
          tags: KEYWORDS.filter(k => (title+content).includes(k)).slice(0,5),
          fullContent: `<p>${escapeHtml(content).slice(0, 300)}...</p>`,
          source: feed.org,
          organization: feed.org,
          period: jp,
          sampleSize: '',
          reliability: '中程度',
          updateFrequency: '随時',
          sourceUrl: link
        });
      }
    } catch (e) {
      console.error('Feed error', feed.url, e?.message || e);
    }
  }
  // de-duplicate by sourceUrl
  const uniq = [];
  const seen = new Set();
  for (const it of all) {
    const key = it.sourceUrl || it.id;
    if (seen.has(key)) continue;
    seen.add(key);
    uniq.push(it);
  }
  // sort desc by date text fallback (not perfect)
  uniq.sort((a,b) => (b.id > a.id ? 1 : -1));
  return uniq.slice(0, 40);
}

const items = await fetchAll();
if (!existsSync('data')) mkdirSync('data');
writeFileSync('data/news.json', JSON.stringify({ lastUpdated: new Date().toISOString(), items }, null, 2));
console.log('Wrote data/news.json with', items.length, 'items');
