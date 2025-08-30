import { readFileSync, writeFileSync, existsSync } from 'fs';
import { basename } from 'path';

function usage() {
  console.log('Usage: node scripts/import_text_to_news.mjs <path-to-text> [title] [date(YYYY-MM-DD)]');
}

const [, , filePath, titleArg, dateArg] = process.argv;
if (!filePath) { usage(); process.exit(1); }

const txt = readFileSync(filePath, 'utf8');
const name = basename(filePath).replace(/\.[^.]+$/, '');

function toJpDateFromIso(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return '';
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

// Derive title & date
let title = titleArg || '';
if (!title) {
  const firstLine = (txt.split(/\r?\n/).find(l => l.trim().length > 0) || '').trim();
  title = firstLine.length > 40 ? firstLine.slice(0, 38) + '…' : firstLine || '今日の転職・キャリアニュース ハイライト';
}
let isoDate = dateArg || new Date().toISOString().slice(0, 10);
const jpDate = toJpDateFromIso(isoDate);

// Simple HTML body
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const paragraphs = txt.split(/\r?\n\r?\n/).map(p => `<p>${esc(p).replace(/\r?\n/g, '<br>')}</p>`).join('\n');

const id = `dyn-${name}`;
const item = {
  id,
  title,
  category: '市場動向',
  categoryClass: 'market',
  date: jpDate,
  author: 'Career Horizon編集部',
  readTimeMin: 5,
  tags: ['ハイライト'],
  fullContent: paragraphs,
  source: '編集部',
  organization: 'Career Horizon',
  period: jpDate,
  sampleSize: '',
  reliability: '中程度',
  updateFrequency: '日次',
  sourceUrl: ''
};

let db = { lastUpdated: new Date().toISOString(), items: [] };
if (existsSync('data/news.json')) {
  try { db = JSON.parse(readFileSync('data/news.json', 'utf8')); } catch {}
}
db.items = (db.items || []).filter(x => x.id !== id);
db.items.unshift(item);
db.lastUpdated = new Date().toISOString();
writeFileSync('data/news.json', JSON.stringify(db, null, 2));
console.log('Imported as', id, '-> data/news.json (items:', db.items.length, ')');

