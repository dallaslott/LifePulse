import { readFile, writeFile } from 'node:fs/promises';

const DATA_PATH = new URL('../cost-of-living-data.json', import.meta.url);
const force = process.argv.includes('--force');
const today = new Date().toISOString().slice(0, 10);
const censusKey = String(process.env.CENSUS_API_KEY || '').trim();

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

function nextReviewDate(days = 32) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
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

async function fetchLatestCensusRent() {
  if (!censusKey) throw new Error('CENSUS_API_KEY unavailable');
  const currentYear = new Date().getUTCFullYear();
  const errors = [];
  for (const year of [currentYear - 1, currentYear - 2]) {
    try {
      const text = await fetchText(`https://api.census.gov/data/${year}/acs/acs1?get=NAME,B25064_001E&for=us:*&key=${encodeURIComponent(censusKey)}`);
      const payload = JSON.parse(text);
      const value = Number(payload?.[1]?.[1]);
      if (Number.isFinite(value)) return { year, value };
      errors.push(`${year}: missing value`);
    } catch (error) {
      errors.push(`${year}: ${error.message}`);
    }
  }
  throw new Error(`no recent ACS rent release (${errors.join('; ')})`);
}

async function fetchBlsAveragePriceBasket(startYear = 1980, endYear = new Date().getUTCFullYear()) {
  const series = {
    bread: 'APU0000702111',
    groundBeef: 'APU0000703112',
    eggs: 'APU0000708111',
    milk: 'APU0000709112',
    gasoline: 'APU000074714'
  };
  const annual = Object.fromEntries(Object.keys(series).map(key => [key, {}]));
  for (let from = startYear; from <= endYear; from += 10) {
    const through = Math.min(endYear, from + 9);
    const response = await fetch('https://api.bls.gov/publicAPI/v2/timeseries/data/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'User-Agent': 'LifePulse-Cost-Updater/1.0' },
      body: JSON.stringify({ seriesid: Object.values(series), startyear: String(from), endyear: String(through), annualaverage: true })
    });
    if (!response.ok) throw new Error(`BLS HTTP ${response.status}`);
    const payload = await response.json();
    if (payload?.status !== 'REQUEST_SUCCEEDED') throw new Error(payload?.message?.join('; ') || 'BLS request failed');
    const keyById = Object.fromEntries(Object.entries(series).map(([key, id]) => [id, key]));
    for (const result of payload?.Results?.series || []) {
      const key = keyById[result.seriesID];
      if (!key) continue;
      const buckets = new Map();
      for (const point of result.data || []) {
        if (!/^M\d{2}$/.test(point.period || '')) continue;
        const value = Number(point.value);
        const year = Number(point.year);
        if (!Number.isFinite(value) || !Number.isFinite(year)) continue;
        if (!buckets.has(year)) buckets.set(year, []);
        buckets.get(year).push(value);
      }
      for (const [year, values] of buckets) annual[key][year] = values.reduce((sum, value) => sum + value, 0) / values.length;
    }
  }
  const basket = {};
  for (let year = startYear; year <= endYear; year += 1) {
    const values = Object.keys(series).map(key => annual[key][year]).filter(Number.isFinite);
    if (values.length >= 4) basket[year] = Number(values.reduce((sum, value) => sum + value, 0).toFixed(2));
  }
  return { basket, components: annual };
}

const data = JSON.parse((await readFile(DATA_PATH, 'utf8')).replace(/^\uFEFF/, ''));
if (!force && data.nextReview && today < data.nextReview && Object.keys(data?.metrics?.groceryBasket?.series || {}).length) {
  console.log(`Cost-of-living review is not due until ${data.nextReview}.`);
  process.exit(0);
}

const results = await Promise.allSettled([
  fetchText('https://fred.stlouisfed.org/graph/fredgraph.csv?id=MSPUS'),
  fetchText('https://fred.stlouisfed.org/graph/fredgraph.csv?id=MEHOINUSA646N'),
  fetchLatestCensusRent(),
  fetchText('https://www.the-numbers.com/market/'),
  fetchBlsAveragePriceBasket()
]);

const notes = [];
if (results[0].status === 'fulfilled') {
  data.metrics.homePrice.series = { ...data.metrics.homePrice.series, ...parseFredCsv(results[0].value) };
  const currentYear = new Date().getUTCFullYear();
  data.metrics.homePrice.preliminaryYears = Array.from(new Set([...(data.metrics.homePrice.preliminaryYears || []), currentYear])).sort();
  data.metrics.homePrice.estimatedYears = (data.metrics.homePrice.estimatedYears || []).filter(year => Number(year) !== currentYear);
  notes.push(`home through ${latestYear(data.metrics.homePrice.series)}`);
} else notes.push(`home retained (${results[0].reason.message})`);

if (results[1].status === 'fulfilled') {
  data.metrics.income.series = { ...data.metrics.income.series, ...parseFredCsv(results[1].value) };
  notes.push(`income through ${latestYear(data.metrics.income.series)}`);
} else notes.push(`income retained (${results[1].reason.message})`);

if (results[2].status === 'fulfilled') {
  const { year, value } = results[2].value;
  data.metrics.rent.series[year] = value;
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
  data.metrics.movieTicket.estimatedYears = Object.keys(data.metrics.movieTicket.series || {}).map(Number).filter(year => year >= 2020).sort();
  notes.push(`movie tickets through ${latestYear(data.metrics.movieTicket.series)}`);
} else notes.push(`movie tickets retained (${results[3].reason.message})`);

if (results[4].status === 'fulfilled') {
  data.metrics.groceryBasket = data.metrics.groceryBasket || {
    label: 'Everyday Grocery + Gas Basket', icon: '&#128722;', group: 'everyday', unit: 'currency2', coverageStart: 1980,
    source: 'U.S. Bureau of Labor Statistics average price series', sourceUrl: 'https://www.bls.gov/cpi/factsheets/average-prices.htm', series: {}
  };
  data.metrics.groceryBasket.series = results[4].value.basket;
  data.metrics.groceryBasket.components = results[4].value.components;
  notes.push(`BLS basket through ${latestYear(data.metrics.groceryBasket.series)}`);
} else notes.push(`BLS basket retained (${results[4].reason.message})`);

data.updatedAt = new Date().toISOString();
const sourceFailure = results.some(result => result.status === 'rejected');
data.nextReview = nextReviewDate(sourceFailure ? 7 : 32);
data.lastRefreshNotes = notes;
await writeFile(DATA_PATH, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
console.log(`Updated cost-of-living dataset: ${notes.join('; ')}. Next review ${data.nextReview}.`);


