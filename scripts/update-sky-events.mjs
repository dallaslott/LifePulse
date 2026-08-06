import { readFile, writeFile } from 'node:fs/promises';

const OUTPUT_PATH = new URL('../sky-events.json', import.meta.url);
const NASA_BASE = 'https://eclipse.gsfc.nasa.gov/SKYCAL/';
const NASA_CALENDAR_URL = NASA_BASE + 'SKYCAL.html';
const IMO_CALENDAR_URL = 'https://www.imo.net/resources/calendar/meteor-shower-calendar-archive/';
const now = new Date();
const startYear = Number(process.env.SKY_START_YEAR || now.getUTCFullYear() - 1);
const endYear = Number(process.env.SKY_END_YEAR || now.getUTCFullYear() + 2);

const EVENT_TYPES = {
  1: { type: 'season', title: 'March Equinox', icon: '🌱', viewing: 'Season marker' },
  2: { type: 'season', title: 'June Solstice', icon: '☀️', viewing: 'Season marker' },
  3: { type: 'season', title: 'September Equinox', icon: '🍂', viewing: 'Season marker' },
  4: { type: 'season', title: 'December Solstice', icon: '❄️', viewing: 'Season marker' },
  35: { type: 'planet-visibility', title: 'Mercury Greatest Eastern Elongation', icon: '☿', viewing: 'Look low in the western sky shortly after sunset.' },
  36: { type: 'planet-visibility', title: 'Mercury Greatest Western Elongation', icon: '☿', viewing: 'Look low in the eastern sky shortly before sunrise.' },
  37: { type: 'planet-visibility', title: 'Venus Greatest Eastern Elongation', icon: '♀', viewing: 'Look west after sunset.' },
  38: { type: 'planet-visibility', title: 'Venus Greatest Western Elongation', icon: '♀', viewing: 'Look east before sunrise.' },
  41: { type: 'planetary-opposition', title: 'Mars At Opposition', icon: '♂', viewing: 'Visible most of the night and near its brightest.' },
  42: { type: 'planetary-opposition', title: 'Jupiter At Opposition', icon: '♃', viewing: 'Visible most of the night and near its brightest.' },
  43: { type: 'planetary-opposition', title: 'Saturn At Opposition', icon: '♄', viewing: 'Visible most of the night and near its brightest.' },
  44: { type: 'planetary-opposition', title: 'Uranus At Opposition', icon: '⛢', viewing: 'Best viewed with binoculars or a telescope.' },
  45: { type: 'planetary-opposition', title: 'Neptune At Opposition', icon: '♆', viewing: 'A telescope and a finder chart are recommended.' },
  103: { type: 'planetary-conjunction', title: 'Mercury And Venus Conjunction', icon: '✨', viewing: 'Look near the horizon in twilight.' },
  104: { type: 'planetary-conjunction', title: 'Mercury And Mars Conjunction', icon: '✨', viewing: 'Look near the horizon in twilight.' },
  105: { type: 'planetary-conjunction', title: 'Mercury And Jupiter Conjunction', icon: '✨', viewing: 'Look near the horizon in twilight.' },
  106: { type: 'planetary-conjunction', title: 'Mercury And Saturn Conjunction', icon: '✨', viewing: 'Look near the horizon in twilight.' },
  107: { type: 'planetary-conjunction', title: 'Venus And Mars Conjunction', icon: '✨', viewing: 'Look for the bright pair in morning or evening twilight.' },
  108: { type: 'planetary-conjunction', title: 'Venus And Jupiter Conjunction', icon: '✨', viewing: 'Look for the two bright planets together in twilight.' },
  109: { type: 'planetary-conjunction', title: 'Venus And Saturn Conjunction', icon: '✨', viewing: 'Look for the pair in morning or evening twilight.' },
  110: { type: 'planetary-conjunction', title: 'Mars And Jupiter Conjunction', icon: '✨', viewing: 'Look for the pair before dawn or after dusk.' },
  111: { type: 'planetary-conjunction', title: 'Mars And Saturn Conjunction', icon: '✨', viewing: 'Look for the pair before dawn or after dusk.' },
  112: { type: 'planetary-conjunction', title: 'Jupiter And Saturn Conjunction', icon: '✨', viewing: 'Look for the two outer planets together.' },
  120: { type: 'meteor-shower', title: 'Quadrantids', icon: '☄️', viewing: 'Best after midnight through dawn; the sharp peak can last only a few hours.', parent: 'Asteroid 2003 EH1', hemisphere: 'Northern Hemisphere favored' },
  121: { type: 'meteor-shower', title: 'Lyrids', icon: '☄️', viewing: 'Best from late evening through dawn under a dark sky.', parent: 'Comet C/1861 G1 Thatcher', hemisphere: 'Both hemispheres; northern favored' },
  122: { type: 'meteor-shower', title: 'Eta Aquariids', icon: '☄️', viewing: 'Best in the hours before dawn.', parent: 'Halley\'s Comet', hemisphere: 'Southern Hemisphere favored' },
  123: { type: 'meteor-shower', title: 'Southern Delta Aquariids', icon: '☄️', viewing: 'Best after midnight through dawn.', parent: 'Comet 96P/Machholz complex', hemisphere: 'Southern Hemisphere favored' },
  124: { type: 'meteor-shower', title: 'Perseids', icon: '☄️', viewing: 'Best from late evening through dawn from a dark location.', parent: 'Comet 109P/Swift-Tuttle', hemisphere: 'Northern Hemisphere favored' },
  125: { type: 'meteor-shower', title: 'Orionids', icon: '☄️', viewing: 'Best after midnight through dawn.', parent: 'Halley\'s Comet', hemisphere: 'Both hemispheres' },
  126: { type: 'meteor-shower', title: 'Southern Taurids', icon: '☄️', viewing: 'Best from late evening through dawn; watch for bright fireballs.', parent: 'Comet 2P/Encke complex', hemisphere: 'Both hemispheres' },
  127: { type: 'meteor-shower', title: 'Northern Taurids', icon: '☄️', viewing: 'Best from late evening through dawn; watch for bright fireballs.', parent: 'Comet 2P/Encke complex', hemisphere: 'Both hemispheres' },
  128: { type: 'meteor-shower', title: 'Leonids', icon: '☄️', viewing: 'Best after midnight through dawn.', parent: 'Comet 55P/Tempel-Tuttle', hemisphere: 'Both hemispheres' },
  129: { type: 'meteor-shower', title: 'Geminids', icon: '☄️', viewing: 'Visible from evening through dawn; a dark site gives the best rates.', parent: 'Asteroid 3200 Phaethon', hemisphere: 'Both hemispheres' },
  130: { type: 'meteor-shower', title: 'Ursids', icon: '☄️', viewing: 'Best after midnight through dawn.', parent: 'Comet 8P/Tuttle', hemisphere: 'Northern Hemisphere favored' }
};

function decadeStart(year) {
  return Math.floor((year - 1) / 10) * 10 + 1;
}

function julianToIso(julianDay) {
  return new Date((julianDay - 2440587.5) * 86400000).toISOString();
}

async function fetchText(url) {
  const response = await fetch(url, { headers: { 'user-agent': 'LifePulse annual sky calendar updater' } });
  if (!response.ok) throw new Error(url + ' returned ' + response.status);
  return response.text();
}

async function readPrevious() {
  try { return JSON.parse(await readFile(OUTPUT_PATH, 'utf8')); }
  catch { return null; }
}

const previous = await readPrevious();
const nextReview = previous?.updatePolicy?.nextReview ? new Date(previous.updatePolicy.nextReview + 'T00:00:00Z') : null;
if (process.env.GITHUB_EVENT_NAME === 'schedule' && nextReview && nextReview > now) {
  console.log('Sky calendar remains current through ' + previous.coverage.endYear + '; next annual review is ' + previous.updatePolicy.nextReview + '.');
  process.exit(0);
}

const decades = [...new Set(Array.from({ length: endYear - startYear + 1 }, (_, index) => decadeStart(startYear + index)))];
const sourceFiles = decades.map(year => NASA_BASE + 'jc' + year + '.js');
const rows = [];
for (const sourceUrl of sourceFiles) {
  const text = await fetchText(sourceUrl);
  const pattern = /new Array\(\s*([\d.]+),\s*(\d+),\s*(-?\d+)\s*\)/g;
  for (const match of text.matchAll(pattern)) {
    const code = Number(match[2]);
    if (!EVENT_TYPES[code]) continue;
    const date = new Date(julianToIso(Number(match[1])));
    const year = date.getUTCFullYear();
    if (year < startYear || year > endYear) continue;
    const definition = EVENT_TYPES[code];
    const value = Number(match[3]);
    const detail = definition.type === 'meteor-shower'
      ? 'Peak rate up to ' + value + ' meteors per hour under ideal dark skies.'
      : definition.type === 'planet-visibility' && value
        ? 'Greatest elongation about ' + Math.abs(value / 10).toFixed(1) + ' degrees from the Sun.'
        : definition.viewing;
    rows.push({
      id: year + '-' + code + '-' + date.toISOString().slice(0, 10),
      code,
      type: definition.type,
      title: definition.title,
      icon: definition.icon,
      date: date.toISOString(),
      detail,
      viewing: definition.viewing,
      idealRate: definition.type === 'meteor-shower' ? value : null,
      parent: definition.parent || null,
      hemisphere: definition.hemisphere || 'Global',
      source: 'NASA GSFC Sky Events Calendar',
      sourceUrl: NASA_CALENDAR_URL + '?cal=' + year
    });
  }
}
const supplementalPeaks = {
  draconids: { title: 'Draconids', monthDay: '10-08', overrides: { 2026: '10-07', 2027: '10-07' }, rate: 10, parent: 'Comet 21P/Giacobini-Zinner', hemisphere: 'Northern Hemisphere favored', viewing: 'Best in the evening from a dark northern location; the exact peak can vary.' },
  alphaCapricornids: { title: 'Alpha Capricornids', monthDay: '07-30', overrides: { 2026: '07-31', 2027: '07-29' }, rate: 5, parent: 'Comet 169P/NEAT', hemisphere: 'Both hemispheres', viewing: 'Best from late evening through dawn; known for occasional bright fireballs.' }
};
for (let year = startYear; year <= endYear; year += 1) {
  Object.entries(supplementalPeaks).forEach(([key, event]) => {
    const monthDay = event.overrides[year] || event.monthDay;
    const date = new Date(year + '-' + monthDay + 'T12:00:00.000Z');
    rows.push({
      id: year + '-imo-' + key,
      code: 'IMO-' + key,
      type: 'meteor-shower',
      title: event.title,
      icon: '☄️',
      date: date.toISOString(),
      detail: 'Peak rate near ' + event.rate + ' meteors per hour under ideal dark skies; exact timing can vary.',
      viewing: event.viewing,
      idealRate: event.rate,
      parent: event.parent,
      hemisphere: event.hemisphere,
      datePrecision: 'annual-window',
      source: 'International Meteor Organization',
      sourceUrl: IMO_CALENDAR_URL
    });
  });
}

rows.sort((a, b) => a.date.localeCompare(b.date));

const baseOutput = {
  schemaVersion: 1,
  coverage: { startYear, endYear },
  updatePolicy: {
    cadence: 'Annual reconciliation with NASA decade data; checked on each scheduled workflow run and only committed when event content changes.',
    nextReview: (endYear - 1) + '-07-15'
  },
  sources: [
    { name: 'NASA GSFC Sky Events Calendar', url: NASA_CALENDAR_URL, role: 'Calculated event dates and times through 2100.' },
    { name: 'International Meteor Organization', url: IMO_CALENDAR_URL, role: 'Annual meteor-shower observing guidance and visibility context.' }
  ],
  sourceFiles,
  events: rows
};

const previousComparable = previous ? JSON.stringify({ ...previous, generatedAt: undefined }) : '';
const nextComparable = JSON.stringify(baseOutput);
const output = previousComparable === nextComparable
  ? previous
  : { ...baseOutput, generatedAt: new Date().toISOString() };

await writeFile(OUTPUT_PATH, JSON.stringify(output, null, 2) + '\n', 'utf8');
console.log('Prepared ' + rows.length + ' sky events for ' + startYear + '-' + endYear + '.');
