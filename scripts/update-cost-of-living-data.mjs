import { readFile, writeFile } from 'node:fs/promises';

const DATA_PATH = new URL('../cost-of-living-data.json', import.meta.url);
const force = process.argv.includes('--force');
const today = new Date().toISOString().slice(0, 10);

async function fetchText(url, timeoutMs = 20000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      cache: 'no-store',
      headers: { Accept: 'text/plain,text/csv,text/html,application/json', 'User-Agent': 'LifePulse-Cost-Updater/1.0' },
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.text();
  } finally {
    clearTimeout(timer);
  }
}

function nextReviewDate(days = null) {
  const date = new Date();
  if (Number.isFinite(days)) date.setUTCDate(date.getUTCDate() + days);
  else date.setUTCFullYear(date.getUTCFullYear() + 1);
  return date.toISOString().slice(0, 10);
}

function parseFredCsv(text) {
  const lines = text.trim().split(/\r?\n/).slice(1);
  const byYear = new Map();
  for (const line of lines) {
    const [date, raw] = line.split(',');
    const value = Number(raw);
    const year = Number(String(date).slice(0, 4));
    if (!Number.isFinite(year) || !Number.isFinite(value)) continue;
    if (!byYear.has(year)) byYear.set(year, []);
    byYear.get(year).push(value);
  }
  return Object.fromEntries([...byYear].map(([year, values]) => [year, Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)]));
}

function latestYear(series) {
  return Math.max(...Object.keys(series || {}).map(Number).filter(Number.isFinite));
}

const data = JSON.parse((await readFile(DATA_PATH, 'utf8')).replace(/^\uFEFF/, ''));
if (!force && data.nextReview && today < data.nextReview) {
  console.log(`Cost-of-living review is not due until ${data.nextReview}.`);
  process.exit(0);
}

const results = await Promise.allSettled([
  fetchText('https://fred.stlouisfed.org/graph/fredgraph.csv?id=MSPUS'),
  fetchText('https://fred.stlouisfed.org/graph/fredgraph.csv?id=MEHOINUSA646N'),
  fetchText(`https://api.census.gov/data/${new Date().getUTCFullYear() - 1}/acs/acs1?get=NAME,B25064_001E&for=us:*`),
  fetchText('https://www.the-numbers.com/market/')
]);

const notes = [];
if (results[0].status === 'fulfilled') {
  data.metrics.homePrice.series = { ...data.metrics.homePrice.series, ...parseFredCsv(results[0].value) };
  notes.push(`home through ${latestYear(data.metrics.homePrice.series)}`);
} else notes.push(`home retained (${results[0].reason.message})`);

if (results[1].status === 'fulfilled') {
  data.metrics.income.series = { ...data.metrics.income.series, ...parseFredCsv(results[1].value) };
  notes.push(`income through ${latestYear(data.metrics.income.series)}`);
} else notes.push(`income retained (${results[1].reason.message})`);

if (results[2].status === 'fulfilled') {
  const payload = JSON.parse(results[2].value);
  const value = Number(payload?.[1]?.[1]);
  const year = new Date().getUTCFullYear() - 1;
  if (Number.isFinite(value)) data.metrics.rent.series[year] = value;
  notes.push(`rent through ${year}`);
} else notes.push(`rent retained (${results[2].reason.message})`);

if (results[3].status === 'fulfilled') {
  const html = results[3].value;
  const rows = html.match(/<tr[\s\S]*?<\/tr>/gi) || [];
  for (const row of rows) {
    const yearMatch = row.match(/market\/(20\d{2})/i);
    const prices = [...row.matchAll(/\$([0-9,]+(?:\.[0-9]{2})?)/g)].map(match => Number(match[1].replaceAll(',', '')));
    const ticketPrice = prices[prices.length - 1];
    if (yearMatch && Number.isFinite(ticketPrice) && ticketPrice < 100) data.metrics.movieTicket.series[Number(yearMatch[1])] = ticketPrice;
  }
  notes.push(`movie tickets through ${latestYear(data.metrics.movieTicket.series)}`);
} else notes.push(`movie tickets retained (${results[3].reason.message})`);

data.updatedAt = new Date().toISOString();
const sourceFailure = results.some(result => result.status === 'rejected');
data.nextReview = nextReviewDate(sourceFailure ? 30 : null);
data.lastRefreshNotes = notes;
await writeFile(DATA_PATH, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
console.log(`Updated cost-of-living dataset: ${notes.join('; ')}. Next review ${data.nextReview}.`);


