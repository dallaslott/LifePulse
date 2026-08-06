import { readFile, writeFile } from 'node:fs/promises';

const SPORTS_PATH = new URL('../sports-data-v4.json', import.meta.url);
const TARGET_DATE = process.env.LIFEPULSE_DATE || new Date().toISOString().slice(0, 10);

const WIKIMEDIA_API = 'https://en.wikipedia.org/w/api.php';

function romanNumeral(value) {
  const numerals = [[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']];
  let remaining = value;
  return numerals.map(([amount, symbol]) => {
    const count = Math.floor(remaining / amount);
    remaining %= amount;
    return symbol.repeat(count);
  }).join('');
}

function readField(wikitext, field) {
  const escaped = field.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return wikitext.match(new RegExp(`^\\|\\s*${escaped}\\s*=\\s*(.+)$`, 'mi'))?.[1]?.trim() || '';
}

function cleanWikiValue(value) {
  const link = String(value || '').match(/\[\[([^\]]+)\]\]/);
  const selected = link ? link[1].split('|').at(-1) : String(value || '');
  return selected.replace(/<[^>]+>/g, '').replace(/\{\{.*$/g, '').replace(/\s*\([^)]*\)\s*$/g, '').replace(/'{2,}/g, '').trim();
}

function normalizedWikiTarget(value) {
  const link = String(value || '').match(/\[\[([^\]]+)\]\]/);
  return (link?.[1]?.split('|')[0] || '').replace(/ season$/i, '').replace(/_/g, ' ').trim().toLowerCase();
}

function parseChampionshipDate(value, year) {
  const plain = String(value || '').replace(/\{\{.*$/g, '').replace(/[\u2013\u2014]/g, '-').trim();
  const range = plain.match(/([A-Za-z]+)\s+\d{1,2}\s*-\s*(?:([A-Za-z]+)\s+)?(\d{1,2})/);
  const single = plain.match(/([A-Za-z]+)\s+(\d{1,2})(?:,\s*\d{4})?/);
  const month = range ? (range[2] || range[1]) : single?.[1];
  const day = range ? range[3] : single?.[2];
  if (!month || !day) throw new Error(`Could not parse championship date: ${value}`);
  const parsed = new Date(`${month} ${day}, ${year} 12:00:00 UTC`);
  if (Number.isNaN(parsed.getTime())) throw new Error(`Invalid championship date: ${value}`);
  return parsed.toISOString().slice(0, 10);
}

async function fetchWikitext(title) {
  const url = new URL(WIKIMEDIA_API);
  url.searchParams.set('action', 'parse');
  url.searchParams.set('prop', 'wikitext');
  url.searchParams.set('format', 'json');
  url.searchParams.set('formatversion', '2');
  url.searchParams.set('page', title);
  const response = await fetch(url, { headers: { 'User-Agent': 'LifePulse/4 annual sports refresh' } });
  if (!response.ok) throw new Error(`Wikimedia returned HTTP ${response.status} for ${title}`);
  const payload = await response.json();
  if (!payload?.parse?.wikitext) throw new Error(payload?.error?.info || `No wikitext returned for ${title}`);
  return payload.parse.wikitext;
}

function addDays(date, days) {
  const result = new Date(`${date}T12:00:00Z`);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
}

function cleanScheduleLocation(value) {
  return String(value || '')
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, '')
    .replace(/<br\s*\/?>/gi, ', ')
    .replace(/\[\[(?:[^|\]]*\|)?([^\]]+)\]\]/g, '$1')
    .replace(/\{\{(?:flagicon|flagcountry|flag)\|([^}|]+)[^}]*\}\}/gi, '$1')
    .replace(/\{\{[^|{}]+\|/g, '')
    .replace(/[{}]/g, '')
    .replace(/\|/g, ', ')
    .replace(/\s*,\s*,+/g, ', ')
    .replace(/\s+/g, ' ')
    .replace(/^[-*;\s,]+|[-*;\s,]+$/g, '')
    .trim();
}

function parseScheduledStart(value, year) {
  const source = String(value || '').replace(/<!--[\s\S]*?-->/g, '').trim();
  const template = source.match(/\{\{(?:start date|start-date)\|(\d{4})\|(\d{1,2})\|(\d{1,2})/i);
  if (template) {
    const date = new Date(Date.UTC(Number(template[1]), Number(template[2]) - 1, Number(template[3]), 12));
    return date.toISOString().slice(0, 10);
  }
  const written = source.replace(/<[^>]+>/g, '').match(/([A-Za-z]+)\s+(\d{1,2})(?:,|\s)+(\d{4})/);
  if (written) {
    const date = new Date(`${written[1]} ${written[2]}, ${written[3]} 12:00:00 UTC`);
    if (!Number.isNaN(date.getTime())) return date.toISOString().slice(0, 10);
  }
  throw new Error(`No confirmed opening date is available for ${year}.`);
}

async function fetchScheduledEdition(title, year) {
  const wikitext = await fetchWikitext(title);
  const date = parseScheduledStart(readField(wikitext, 'dates') || readField(wikitext, 'date'), year);
  const location = cleanScheduleLocation(readField(wikitext, 'host_city') || readField(wikitext, 'host'));
  if (!location) throw new Error(`${title} does not yet identify a confirmed host.`);
  return { date, location };
}

function sumScoreFields(wikitext, side) {
  const matcher = new RegExp(`^\\|\\s*${side}_(?:qtr\\d+|ot\\d*)\\s*=\\s*(\\d+)\\s*$`, 'gmi');
  return [...wikitext.matchAll(matcher)].reduce((total, match) => total + Number(match[1]), 0);
}

async function fetchNFLChampion(year) {
  const title = `Super Bowl ${romanNumeral(year - 1966)}`;
  const wikitext = await fetchWikitext(title);
  const visitor = cleanWikiValue(readField(wikitext, 'visitor'));
  const home = cleanWikiValue(readField(wikitext, 'home'));
  const visitorScore = sumScoreFields(wikitext, 'visitor');
  const homeScore = sumScoreFields(wikitext, 'home');
  if (!visitor || !home || visitorScore === homeScore) throw new Error(`${title} does not yet contain a completed final score.`);
  const visitorWon = visitorScore > homeScore;
  const conference = cleanWikiValue(readField(wikitext, visitorWon ? 'visitor_conf' : 'home_conf')).toUpperCase();
  if (!['AFC', 'NFC'].includes(conference)) throw new Error(`${title} winner conference is unavailable.`);
  return { date: parseChampionshipDate(readField(wikitext, 'date'), year), conference, team: visitorWon ? visitor : home };
}

async function fetchNBAChampion(year) {
  const title = `${year} NBA Finals`;
  const wikitext = await fetchWikitext(title);
  const team = cleanWikiValue(readField(wikitext, 'champion'));
  const championTarget = normalizedWikiTarget(readField(wikitext, 'champion'));
  const eastTarget = normalizedWikiTarget(readField(wikitext, 'ECF result'));
  const westTarget = normalizedWikiTarget(readField(wikitext, 'WCF result'));
  const conference = championTarget === eastTarget ? 'East' : championTarget === westTarget ? 'West' : '';
  if (!team || !conference) throw new Error(`${title} does not yet identify a validated champion and conference.`);
  return { year, team, conference, date: parseChampionshipDate(readField(wikitext, 'date'), year) };
}

async function fetchMLBChampion(year) {
  const title = `${year} World Series`;
  const wikitext = await fetchWikitext(title);
  const team = cleanWikiValue(readField(wikitext, 'champion'));
  const championTarget = normalizedWikiTarget(readField(wikitext, 'champion'));
  const alTarget = normalizedWikiTarget(readField(wikitext, 'ALCS'));
  const nlTarget = normalizedWikiTarget(readField(wikitext, 'NLCS'));
  const league = championTarget === alTarget ? 'AL' : championTarget === nlTarget ? 'NL' : '';
  if (!team || !league) throw new Error(`${title} does not yet identify a validated champion and league.`);
  return { year, league, team, date: parseChampionshipDate(readField(wikitext, 'date'), year) };
}

const definitions = [
  { key: 'nfl', array: 'superBowls', checkAfter: year => `${year}-02-15`, yearOf: entry => new Date(`${entry.date}T12:00:00Z`).getUTCFullYear(), fetchChampion: fetchNFLChampion },
  { key: 'nba', array: 'nbaFinals', checkAfter: year => `${year}-06-24`, yearOf: entry => Number(entry.year), fetchChampion: fetchNBAChampion },
  { key: 'mlb', array: 'worldSeries', checkAfter: year => `${year}-11-06`, yearOf: entry => Number(entry.year), fetchChampion: fetchMLBChampion }
];

const scheduleDefinitions = [
  { key: 'summerOlympics', dates: 'summerOlympicsDates', locations: 'summerOlympicsLocations', title: year => `${year} Summer Olympics` },
  { key: 'winterOlympics', dates: 'winterOlympicsDates', locations: 'winterOlympicsLocations', title: year => `${year} Winter Olympics` },
  { key: 'worldCup', dates: 'worldCupDates', locations: 'worldCupLocations', title: year => `${year} FIFA World Cup` }
];

const original = (await readFile(SPORTS_PATH, 'utf8')).replace(/^\uFEFF/, '');
const sports = JSON.parse(original);
const initialSnapshot = JSON.stringify(sports);
let championAdded = false;

for (const definition of definitions) {
  const records = Array.isArray(sports[definition.array]) ? sports[definition.array] : [];
  const latestYear = records.reduce((latest, entry) => Math.max(latest, definition.yearOf(entry) || 0), 0);
  const targetYear = latestYear + 1;
  const checkDate = definition.checkAfter(targetYear);
  if (TARGET_DATE < checkDate) {
    console.log(`${definition.key.toUpperCase()} already covered through ${latestYear}; next check ${checkDate}.`);
    continue;
  }
  const champion = await definition.fetchChampion(targetYear);
  if (champion.date > TARGET_DATE) throw new Error(`${definition.key.toUpperCase()} returned a future championship date ${champion.date}.`);
  records.push(champion);
  records.sort((a, b) => String(a.date).localeCompare(String(b.date)));
  sports[definition.array] = records;
  championAdded = true;
  console.log(`Added ${definition.key.toUpperCase()} ${targetYear} champion: ${champion.team}.`);
}

const existingScheduleRefresh = sports.scheduleRefresh || {};
const scheduleNextCheck = { ...(existingScheduleRefresh.nextCheck || {}) };
let scheduleChanged = false;

for (const definition of scheduleDefinitions) {
  const due = scheduleNextCheck[definition.key] || TARGET_DATE;
  if (TARGET_DATE < due) {
    console.log(`${definition.key} schedule is current; next check ${due}.`);
    continue;
  }

  const dates = Array.isArray(sports[definition.dates]) ? sports[definition.dates] : [];
  const latestYear = dates.reduce((latest, value) => Math.max(latest, Number(String(value).slice(0, 4)) || 0), 0);
  const targetYear = latestYear + 4;

  try {
    const edition = await fetchScheduledEdition(definition.title(targetYear), targetYear);
    if (!dates.includes(edition.date)) dates.push(edition.date);
    dates.sort();
    sports[definition.dates] = dates;
    sports[definition.locations] = { ...(sports[definition.locations] || {}), [edition.date]: edition.location };
    scheduleNextCheck[definition.key] = addDays(TARGET_DATE, 365);
    scheduleChanged = true;
    console.log(`Added ${definition.key} ${targetYear}: ${edition.date} - ${edition.location}.`);
  } catch (error) {
    scheduleNextCheck[definition.key] = addDays(TARGET_DATE, 30);
    scheduleChanged = true;
    console.warn(`${definition.key} ${targetYear} is not ready: ${error.message} Next check ${scheduleNextCheck[definition.key]}.`);
  }
}

const consoleReviewDate = sports?.technologyReview?.consoleEras?.nextReview;
if (consoleReviewDate && TARGET_DATE >= consoleReviewDate) {
  console.warn(`Gaming Console Eras curated review is due (scheduled ${consoleReviewDate}).`);
}

sports.scheduleRefresh = {
  source: 'Wikimedia structured tournament pages with official organizer references',
  sourceUrl: WIKIMEDIA_API,
  strategy: 'Check only the next missing edition; retry incomplete schedules after 30 days and completed checks annually.',
  officialSources: {
    olympics: 'https://olympics.com/ioc/olympic-games',
    fifa: 'https://www.fifa.com/en/tournaments/mens/worldcup'
  },
  nextCheck: scheduleNextCheck
};

const checkAfter = {};
for (const definition of definitions) {
  const records = sports[definition.array] || [];
  const latestYear = records.reduce((latest, entry) => Math.max(latest, definition.yearOf(entry) || 0), 0);
  checkAfter[definition.key] = definition.checkAfter(latestYear + 1);
}

sports.championshipRefresh = {
  source: 'Wikimedia championship pages',
  sourceUrl: WIKIMEDIA_API,
  strategy: 'One request per missing league champion after its projected completion date.',
  checkAfter
};
if (championAdded || scheduleChanged) sports.version = TARGET_DATE;

const serialized = `${JSON.stringify(sports, null, 2)}\n`;
if (JSON.stringify(sports) !== initialSnapshot) {
  await writeFile(SPORTS_PATH, serialized, 'utf8');
  console.log('sports-data-v4.json updated.');
} else {
  console.log('No sports-data changes were needed.');
}


