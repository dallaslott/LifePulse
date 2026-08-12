import { readFile, writeFile } from 'node:fs/promises';

const DATA_PATH = new URL('../place-economic-data.json', import.meta.url);
const force = process.argv.includes('--force');
const today = new Date().toISOString().slice(0, 10);
const censusKey = String(process.env.CENSUS_API_KEY || '').trim();
const beaKey = String(process.env.BEA_API_KEY || '').trim();

const STATE_NAMES = {
  '01':'Alabama','02':'Alaska','04':'Arizona','05':'Arkansas','06':'California','08':'Colorado','09':'Connecticut','10':'Delaware','11':'District of Columbia','12':'Florida','13':'Georgia','15':'Hawaii','16':'Idaho','17':'Illinois','18':'Indiana','19':'Iowa','20':'Kansas','21':'Kentucky','22':'Louisiana','23':'Maine','24':'Maryland','25':'Massachusetts','26':'Michigan','27':'Minnesota','28':'Mississippi','29':'Missouri','30':'Montana','31':'Nebraska','32':'Nevada','33':'New Hampshire','34':'New Jersey','35':'New Mexico','36':'New York','37':'North Carolina','38':'North Dakota','39':'Ohio','40':'Oklahoma','41':'Oregon','42':'Pennsylvania','44':'Rhode Island','45':'South Carolina','46':'South Dakota','47':'Tennessee','48':'Texas','49':'Utah','50':'Vermont','51':'Virginia','53':'Washington','54':'West Virginia','55':'Wisconsin','56':'Wyoming','72':'Puerto Rico'
};

function normalize(value) {
  return String(value || '')
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim();
}

function normalizePlaceName(value) {
  return normalize(String(value || '').replace(/,.*$/, '').replace(/\s+(city|town|village|borough|municipality|cdp)$/i, ''));
}

function placeKey(state, name) { return `${normalize(state)}|${normalizePlaceName(name)}`; }
function countyKey(state, name) {
  const clean = String(name || '').replace(/\s+(county|parish|borough|census area|municipality)$/i, '');
  return `${normalize(state)}|${normalize(clean)}`;
}

async function fetchJson(url, timeoutMs = 60000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      cache: 'no-store',
      headers: { Accept: 'application/json', 'User-Agent': 'LifePulse-Official-Data-Updater/1.0' },
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('json')) throw new Error('Expected JSON response');
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

function nextReviewDate(days = 32) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function rowsToObjects(payload) {
  if (!Array.isArray(payload) || payload.length < 2) return [];
  const headers = payload[0];
  return payload.slice(1).map(row => Object.fromEntries(headers.map((header, index) => [header, row[index]])));
}

async function fetchCensusDataset(year, path, variable) {
  const params = new URLSearchParams({ get: `NAME,${variable}`, for: 'place:*', in: 'state:*', key: censusKey });
  const payload = await fetchJson(`https://api.census.gov/data/${path}?${params}`);
  return rowsToObjects(payload).map(row => ({
    year,
    name: String(row.NAME || '').split(',')[0],
    state: STATE_NAMES[String(row.state).padStart(2, '0')] || String(row.NAME || '').split(',').slice(-1)[0]?.trim() || '',
    stateFips: String(row.state || '').padStart(2, '0'),
    placeFips: String(row.place || '').padStart(5, '0'),
    population: Number(row[variable])
  })).filter(row => row.name && Number.isFinite(row.population) && row.population >= 0);
}

async function refreshCensus(data, notes) {
  if (!censusKey) {
    notes.push('Census retained (CENSUS_API_KEY unavailable)');
    return;
  }
  const currentYear = new Date().getUTCFullYear();
  const latestAcsCandidates = [currentYear - 1, currentYear - 2].map(year => [year, `${year}/acs/acs5`, 'B01003_001E']);
  const datasets = [
    [2000, '2000/dec/sf1', 'P001001'],
    [2010, '2010/dec/sf1', 'P001001'],
    [2020, '2020/dec/pl', 'P1_001N'],
    ...latestAcsCandidates
  ];
  const settled = await Promise.allSettled(datasets.map(args => fetchCensusDataset(...args)));
  const places = { ...(data.places || {}) };
  let successful = 0;
  settled.forEach((result, index) => {
    const year = datasets[index][0];
    if (result.status !== 'fulfilled') {
      notes.push(`Census ${year} retained (${result.reason?.message || 'request failed'})`);
      return;
    }
    successful += 1;
    for (const row of result.value) {
      const key = placeKey(row.state, row.name);
      const existing = places[key] || { name: row.name.replace(/\s+(city|town|village|borough|municipality|CDP)$/i, ''), state: row.state, stateFips: row.stateFips, placeFips: row.placeFips, series: {} };
      existing.series[String(year)] = row.population;
      existing.stateFips = row.stateFips;
      existing.placeFips = row.placeFips;
      places[key] = existing;
    }
    notes.push(`Census ${year}: ${result.value.length.toLocaleString()} places`);
  });
  if (successful) {
    data.places = places;
    data.populationLatestYear = Math.max(...datasets.filter((_, index) => settled[index].status === 'fulfilled').map(item => item[0]));
  }
}

function extractBeaRows(payload) {
  const results = payload?.BEAAPI?.Results;
  const candidates = Array.isArray(results) ? results : [results];
  for (const result of candidates) {
    if (Array.isArray(result?.Data) && result.Data.length) return result.Data;
  }
  const error = candidates.find(result => result?.Error)?.Error || payload?.BEAAPI?.Error;
  const message = error?.APIErrorDescription || error?.ErrorDetail?.Description || error?.Description || error?.APIErrorCode;
  throw new Error(message ? `BEA: ${message}` : 'BEA county-income response was empty');
}

async function fetchBeaCounties() {
  const params = new URLSearchParams({
    UserID: beaKey,
    method: 'GetData',
    datasetname: 'Regional',
    TableName: 'CAINC1',
    LineCode: '3',
    GeoFIPS: 'COUNTY',
    Year: 'ALL',
    ResultFormat: 'JSON'
  });
  return extractBeaRows(await fetchJson(`https://apps.bea.gov/api/data?${params}`, 180000));
}

async function refreshBea(data, notes) {
  if (!beaKey) {
    notes.push('BEA retained (BEA_API_KEY unavailable)');
    return;
  }
  const counties = { ...(data.counties || {}) };
  const rows = await fetchBeaCounties();
  let latestYear = 0;
  for (const row of rows) {
    const geoName = String(row.GeoName || '').replace(/\s*\*+$/, '');
    const geoDigits = String(row.GeoFips || row.GeoFIPS || '').replace(/\D/g, '').slice(0, 5);
    if (geoDigits.length !== 5 || geoDigits.endsWith('000') || !geoName.includes(',')) continue;
    const [rawCounty, stateAbbr] = geoName.split(',').map(item => item.trim());
    const stateFips = geoDigits.slice(0, 2);
    const state = STATE_NAMES[stateFips] || stateAbbr || '';
    const year = Number(row.TimePeriod);
    const value = Number(String(row.DataValue || '').replaceAll(',', ''));
    if (!rawCounty || !state || !Number.isFinite(year) || !Number.isFinite(value)) continue;
    const key = countyKey(state, rawCounty);
    const entry = counties[key] || { name: rawCounty, state, stateFips, countyFips: geoDigits, series: {} };
    entry.series[String(year)] = Math.round(value);
    counties[key] = entry;
    latestYear = Math.max(latestYear, year);
  }
  if (!Object.keys(counties).length || !latestYear) throw new Error('BEA returned no usable county-income rows');
  data.counties = counties;
  data.incomeLatestYear = latestYear || data.incomeLatestYear;
  notes.push(`BEA county income: ${Object.keys(counties).length.toLocaleString()} counties through ${latestYear}`);
}

const data = JSON.parse((await readFile(DATA_PATH, 'utf8')).replace(/^\uFEFF/, ''));
if (!force && data.nextReview && today < data.nextReview && Object.keys(data.places || {}).length) {
  console.log(`Place and economic review is not due until ${data.nextReview}.`);
  process.exit(0);
}

const notes = [];
await refreshCensus(data, notes);
try {
  await refreshBea(data, notes);
} catch (error) {
  notes.push(`BEA retained (${error.message})`);
}
data.updatedAt = new Date().toISOString();
data.nextReview = nextReviewDate(notes.some(note => note.includes('retained')) ? 7 : 32);
data.lastRefreshNotes = notes;
await writeFile(DATA_PATH, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
console.log(`Updated place/economic dataset: ${notes.join('; ')}. Next review ${data.nextReview}.`);
