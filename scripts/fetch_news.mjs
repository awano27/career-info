import Parser from 'rss-parser';
import { writeFileSync, mkdirSync, existsSync } from 'fs';

const parser = new Parser({ timeout: 20000 });

// Curated feeds (official/neutral)
const feeds = [
  { url: 'https://www.mhlw.go.jp/stf/news.rdf', category: '市場動向', categoryClass: 'market', org: '厚生労働省' },
  // Add more feeds here as needed
];

function jpDate(date) {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${y}年${m}月${day}日`;
}

function toId(prefix, idx) {
  return `${prefix}${String(idx).padStart(4, '0')}`;
}

async function fetchAll() {
  const all = [];
  for (const feed of feeds) {
    try {
      const res = await parser.parseURL(feed.url);
      const items = (res.items || []).slice(0, 10).map((it, i) => ({
        id: toId('dyn', all.length + i + 1),
        title: it.title || '無題',
        category: feed.category,
        categoryClass: feed.categoryClass,
        date: jpDate(it.isoDate || it.pubDate),
        author: feed.org,
        readTimeMin: 3,
        tags: [],
        fullContent: `<p>${(it.contentSnippet || it.content || '').toString().substring(0, 300)}...</p>`,
        source: feed.org,
        organization: feed.org,
        period: jpDate(it.isoDate || it.pubDate),
        sampleSize: '',
        reliability: '高い',
        updateFrequency: '随時',
        sourceUrl: it.link || feed.url
      }));
      all.push(...items);
    } catch (e) {
      console.error('Feed error', feed.url, e.message);
    }
  }
  return all.slice(0, 20);
}

const list = await fetchAll();
if (!existsSync('data')) mkdirSync('data');
writeFileSync('data/news.json', JSON.stringify({ lastUpdated: new Date().toISOString(), items: list }, null, 2));
console.log('Wrote data/news.json with', list.length, 'items');

