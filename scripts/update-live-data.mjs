import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import * as Astronomy from 'astronomy-engine';

const OUTPUT_PATH = new URL('../live-data.json', import.meta.url);
const VERSION_PATH = new URL('../version.json', import.meta.url);
const SPORTS_PATH = new URL('../sports-data-v4.json', import.meta.url);
const ORBITAL_OBJECTS_URL = 'https://ourworldindata.org/grapher/space-objects-by-orbit.csv?v=1&csvType=full&useColumnShortNames=false';
const ACTIVE_SATELLITES_URL = 'https://planet4589.org/space/stats/out/stat001.txt';
const PRIMARY_URL = 'https://api.freeastroapi.com/api/v2/horoscope/daily/sign';
const LEGACY_URL = 'https://freehoroscopeapi.com/api/v1/get-horoscope/daily';
const PREVIOUS_DATA_URL = process.env.PREVIOUS_DATA_URL || 'https://dallaslott.github.io/LifePulse/live-data.json';
const PRIMARY_API_KEY = String(process.env.FREE_ASTRO_API_KEY || '').trim();
const TARGET_DATE = process.env.LIFEPULSE_DATE || new Date().toISOString().slice(0, 10);
const DATA_SCHEMA_VERSION = 4;
const APP_RELEASE_MAJOR = 5;
const GITHUB_RUN_NUMBER = String(process.env.GITHUB_RUN_NUMBER || '').trim();
const GITHUB_RUN_ATTEMPT = String(process.env.GITHUB_RUN_ATTEMPT || '1').trim();
const RELEASE_VERSION = GITHUB_RUN_NUMBER
  ? `${APP_RELEASE_MAJOR}.${GITHUB_RUN_NUMBER}.${GITHUB_RUN_ATTEMPT}`
  : `${APP_RELEASE_MAJOR}.local.${TARGET_DATE.replaceAll('-', '')}`;
const WORLD_POPULATION_URL = 'https://www.worldometers.info/world-population/';
const AAA_GAS_URL = 'https://gasprices.aaa.com/aaa-gas-cost-calculator/';
const EIA_GAS_URL = 'https://api.eia.gov/v2/petroleum/pri/gnd/data/';
const EIA_API_KEY = String(process.env.EIA_API_KEY || '').trim();
const IERS_BULLETIN_C_URL = 'https://datacenter.iers.org/data/latestVersion/bulletinC.txt';
const WORLD_BANK_POPULATION_URL = 'https://api.worldbank.org/v2/country/WLD/indicator/SP.POP.TOTL?format=json&per_page=20000&date=1960:2100';
const WORLD_BANK_LIFE_EXPECTANCY_URL = 'https://api.worldbank.org/v2/country/WLD/indicator/SP.DYN.LE00.IN?format=json&per_page=20000&date=1960:2100';
const WORLD_BANK_URBAN_SHARE_URL = 'https://api.worldbank.org/v2/country/WLD/indicator/SP.URB.TOTL.IN.ZS?format=json&per_page=20000&date=1960:2100';
const NASA_GISTEMP_URL = 'https://data.giss.nasa.gov/gistemp/tabledata_v4/GLB.Ts+dSST.csv';
const NOAA_CO2_URL = 'https://gml.noaa.gov/webdata/ccgg/trends/co2/co2_annmean_mlo.txt';
const NOAA_CO2_MONTHLY_URL = 'https://gml.noaa.gov/webdata/ccgg/trends/co2/co2_mm_mlo.txt';
const NOAA_CO2_FALLBACK_ANCHORS = {
  1958: 315.2, 1960: 316.9, 1970: 325.7, 1980: 338.8, 1990: 354.4,
  2000: 369.6, 2010: 389.9, 2020: 414.2, 2021: 416.5, 2022: 418.6,
  2023: 421.1, 2024: 424.6, 2025: 427.4, 2026: 431.44
};
const USAGOV_PRESIDENT_URL = 'https://www.usa.gov/presidents';
const WIKIDATA_SIMPSONS_URL = 'https://www.wikidata.org/wiki/Special:EntityData/Q886.json';
const WIKIDATA_SNL_URL = 'https://www.wikidata.org/wiki/Special:EntityData/Q23831.json';
const SIGNS = [
  'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
  'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'
];

function cleanText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function hashText(value) {
  return createHash('sha256').update(cleanText(value).toLowerCase()).digest('hex');
}

async function readLocalData() {
  try {
    return JSON.parse(await readFile(OUTPUT_PATH, 'utf8'));
  } catch {
    return null;
  }
}

async function fetchJson(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        'User-Agent': 'LifePulse-GitHub-Pages-Updater/3.0',
        ...(options.headers || {})
      },
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`Request failed with HTTP ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchText(url, timeoutMs = 20000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        Accept: 'text/csv,text/plain,text/html,application/xhtml+xml',
        'User-Agent': 'LifePulse-GitHub-Pages-Updater/3.0'
      },
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`Request failed with HTTP ${response.status}`);
    return await response.text();
  } finally {
    clearTimeout(timeoutId);
  }
}

async function readPreviousData() {
  const local = await readLocalData();
  try {
    const separator = PREVIOUS_DATA_URL.includes('?') ? '&' : '?';
    const remote = await fetchJson(`${PREVIOUS_DATA_URL}${separator}v=${Date.now()}`);
    if (remote?.horoscope?.signs && Object.keys(remote.horoscope.signs).length) return remote;
  } catch (error) {
    console.warn(`Previous published feed unavailable: ${error.message}`);
  }
  return local || {
    schemaVersion: 3,
    updatedAt: null,
    lastAttemptAt: null,
    status: 'stale',
    horoscope: { period: 'daily', signs: {} }
  };
}

function validateReading(reading, sign) {
  if (!reading.text) throw new Error(`No horoscope text returned for ${sign}`);
  if (reading.date !== TARGET_DATE) throw new Error(`Provider returned ${reading.date || 'no date'} for ${sign}; expected ${TARGET_DATE}`);
  if (String(reading.sign || '').toLowerCase() !== sign) throw new Error(`Provider returned the wrong sign for ${sign}`);
  if (reading.text.length < 80) throw new Error(`Reading for ${sign} is too short to publish`);
  return reading;
}

function isRepeatedAcrossDates(reading, previousReading) {
  if (!previousReading?.text || !previousReading?.date || previousReading.date === reading.date) return false;
  return hashText(previousReading.text) === hashText(reading.text);
}

async function fetchPrimaryReading(sign, previousReading) {
  if (!PRIMARY_API_KEY) throw new Error('FREE_ASTRO_API_KEY is not configured');
  const body = new URLSearchParams({ sign, date: TARGET_DATE, tz_str: 'America/Chicago', lang: 'en' });
  const payload = await fetchJson(`${PRIMARY_URL}?${body.toString()}`, { headers: { 'x-api-key': PRIMARY_API_KEY } });
  const data = payload?.data || {};
  const reading = validateReading({
    sign: String(data.sign || sign).toLowerCase(),
    date: data.date || payload?.meta?.settings?.date_resolved,
    text: cleanText(data?.content?.text),
    generatedAt: payload?.meta?.generated_at || null,
    source: 'FreeAstroAPI',
    sourceUrl: 'https://www.freeastroapi.com/',
    provider: 'freeastroapi-v2',
    quality: 'date-specific',
    theme: data?.content?.theme || null,
    keywords: Array.isArray(data?.content?.keywords) ? data.content.keywords : [],
    scores: data?.scores || null,
    lucky: data?.lucky || null
  }, sign);
  if (isRepeatedAcrossDates(reading, previousReading)) throw new Error(`Primary provider repeated the previous dated reading for ${sign}`);
  return reading;
}

async function fetchLegacyReading(sign, previousReading) {
  const payload = await fetchJson(`${LEGACY_URL}?sign=${encodeURIComponent(sign)}&v=${Date.now()}`);
  const data = payload?.data || {};
  const reading = validateReading({
    sign: String(data.sign || sign).toLowerCase(), date: data.date || TARGET_DATE,
    text: cleanText(data.horoscope), generatedAt: null,
    source: 'Free Horoscope API', sourceUrl: 'https://freehoroscopeapi.com/',
    provider: 'freehoroscopeapi-legacy', quality: 'generic-daily',
    theme: null, keywords: [], scores: null, lucky: null
  }, sign);
  if (isRepeatedAcrossDates(reading, previousReading)) throw new Error(`Legacy provider repeated the previous dated reading for ${sign}`);
  return reading;
}

function retainPreviousReading(previousReading) {
  if (!previousReading?.text || !previousReading?.date) return null;
  const ageMs = Date.parse(`${TARGET_DATE}T12:00:00Z`) - Date.parse(`${previousReading.date}T12:00:00Z`);
  if (!Number.isFinite(ageMs) || ageMs < 0 || ageMs > 7 * 86400000) return null;
  return { ...previousReading, stale: true, quality: 'previous-reading' };
}

function phaseName(angle) {
  const names = ['New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'];
  return names[Math.round((((angle % 360) + 360) % 360) / 45) % 8];
}

function eclipseKindName(kind) {
  const value = String(kind || '').toLowerCase();
  if (value.includes('annular')) return 'Annular';
  if (value.includes('total')) return 'Total';
  if (value.includes('penumbral')) return 'Penumbral';
  return 'Partial';
}

function astroIso(value) {
  const date = value?.date instanceof Date ? value.date : value instanceof Date ? value : null;
  return date && Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function apparentLongitude(body, date) {
  return Astronomy.Ecliptic(Astronomy.GeoVector(body, date, true)).elon;
}

function signedAngleDelta(start, end) {
  return ((end - start + 540) % 360) - 180;
}

function retrogradeSnapshot(now) {
  const planets = [
    ['Mercury', Astronomy.Body.Mercury], ['Venus', Astronomy.Body.Venus],
    ['Mars', Astronomy.Body.Mars], ['Jupiter', Astronomy.Body.Jupiter],
    ['Saturn', Astronomy.Body.Saturn], ['Uranus', Astronomy.Body.Uranus],
    ['Neptune', Astronomy.Body.Neptune], ['Pluto', Astronomy.Body.Pluto]
  ];
  const before = new Date(now.getTime() - 12 * 3600000);
  const after = new Date(now.getTime() + 12 * 3600000);
  return planets.map(([planet, body]) => ({
    planet,
    retrograde: signedAngleDelta(apparentLongitude(body, before), apparentLongitude(body, after)) < 0
  }));
}

function buildAstronomySnapshot(now) {
  const angle = Astronomy.MoonPhase(now);
  const solar = Astronomy.SearchGlobalSolarEclipse(now);
  const lunar = Astronomy.SearchLunarEclipse(now);
  const nextNew = Astronomy.SearchMoonPhase(0, now, 35);
  const nextFull = Astronomy.SearchMoonPhase(180, now, 35);
  const previousFull = Astronomy.SearchMoonPhase(180, now, -35);
  return {
    calculatedAt: now.toISOString(),
    source: 'Astronomy Engine',
    sourceUrl: 'https://github.com/cosinekitty/astronomy',
    moon: {
      phase: phaseName(angle),
      angleDegrees: Number(angle.toFixed(3)),
      illuminationPercent: Number((((1 - Math.cos(angle * Math.PI / 180)) / 2) * 100).toFixed(1)),
      nextNewMoon: astroIso(nextNew),
      previousFullMoon: astroIso(previousFull),
      nextFullMoon: astroIso(nextFull)
    },
    eclipses: {
      nextSolar: {
        date: astroIso(solar.peak), type: eclipseKindName(solar.kind),
        latitude: Number.isFinite(solar.latitude) ? Number(solar.latitude.toFixed(3)) : null,
        longitude: Number.isFinite(solar.longitude) ? Number(solar.longitude.toFixed(3)) : null
      },
      nextLunar: {
        date: astroIso(lunar.peak), type: eclipseKindName(lunar.kind),
        obscurationPercent: Number.isFinite(lunar.obscuration) ? Number((lunar.obscuration * 100).toFixed(1)) : null
      }
    },
    retrogrades: retrogradeSnapshot(now)
  };
}

function parseWorldPopulation(html) {
  const match = String(html || '').match(/The current world population is[\s\S]{0,250}?([0-9][0-9,]{8,})/i);
  if (!match) throw new Error('World population could not be parsed');
  return { value: Number(match[1].replace(/,/g, '')), asOf: TARGET_DATE, source: 'Worldometer', sourceUrl: WORLD_POPULATION_URL };
}

function parseAaaGasAverage(html) {
  const text = String(html || '');
  const match = text.match(/Today.?s AAA National Average\s*\$([0-9]+\.[0-9]{2,4})[\s\S]{0,180}?Price as of\s*([0-9/]{6,10})/i)
    || text.match(/National Average[\s\S]{0,100}?\$([0-9]+\.[0-9]{2,4})[\s\S]{0,180}?Price as of\s*([0-9/]{6,10})/i);
  if (!match) throw new Error('AAA gas average could not be parsed');
  return { value: Number(match[1]), asOf: match[2], unit: 'USD per gallon', source: 'AAA', sourceUrl: AAA_GAS_URL };
}

function retainRecentSnapshot(value, previousUpdatedAt, maxAgeDays = 14) {
  if (!value || !previousUpdatedAt) return null;
  const age = Date.now() - Date.parse(previousUpdatedAt);
  return Number.isFinite(age) && age >= 0 && age <= maxAgeDays * 86400000 ? { ...value, stale: true } : null;
}

function isReasonableCurrentComparison(key, value) {
  const numeric = Number(value?.value);
  if (!Number.isFinite(numeric)) return false;
  if (key === 'worldPopulation') return numeric >= 7_000_000_000 && numeric <= 10_000_000_000;
  if (key === 'gasPrice') return numeric >= 1 && numeric <= 15;
  return true;
}

const LEAP_SECOND_HISTORY = [
  '1972-06-30','1972-12-31','1973-12-31','1974-12-31','1975-12-31','1976-12-31',
  '1977-12-31','1978-12-31','1979-12-31','1981-06-30','1982-06-30','1983-06-30',
  '1985-06-30','1987-12-31','1989-12-31','1990-12-31','1992-06-30','1993-06-30',
  '1994-06-30','1995-12-31','1997-06-30','1998-12-31','2005-12-31','2008-12-31',
  '2012-06-30','2015-06-30','2016-12-31'
];

function addDaysIso(value, days) {
  const date = new Date(value);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

function componentRecord({ status = 'live', asOf = null, fetchedAt, expiresInDays = 2, source, sourceUrl, fallbackUsed = false, coverageEnd = null, note = '' }) {
  return { status, asOf, fetchedAt, expiresAt: addDaysIso(fetchedAt, expiresInDays), source, sourceUrl, fallbackUsed: Boolean(fallbackUsed), coverageEnd, note };
}

function parseBulletinDate(text) {
  const match = String(text || '').match(/Paris,\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/i);
  if (!match) return null;
  const parsed = new Date(`${match[2]} ${match[1]}, ${match[3]} 12:00:00 UTC`);
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : null;
}

function parseAnnouncedLeapDate(text) {
  const match = String(text || '').match(/(?<!NO\s)leap second will be introduced at the end of\s+([A-Za-z]+)\s+(\d{4})/i);
  if (!match) return null;
  const monthIndex = new Date(`${match[1]} 1, 2000 12:00:00 UTC`).getUTCMonth();
  if (!Number.isInteger(monthIndex)) return null;
  return new Date(Date.UTC(Number(match[2]), monthIndex + 1, 0, 23, 59, 59)).toISOString().slice(0, 10);
}

async function buildLeapSecondReference(previous) {
  try {
    const text = await fetchText(IERS_BULLETIN_C_URL);
    const bulletinNumber = Number(text.match(/Bulletin C\s+(\d+)/i)?.[1] || 0) || null;
    const nextAnnounced = parseAnnouncedLeapDate(text);
    const noLeapMatch = text.match(/NO leap second will be introduced at the end of\s+([A-Za-z]+\s+\d{4})/i);
    const utcTai = Number(text.match(/UTC-TAI\s*=\s*(-?\d+)\s*s/i)?.[1] || -37);
    return {
      value: {
        events: LEAP_SECOND_HISTORY,
        lastEvent: LEAP_SECOND_HISTORY.at(-1),
        nextAnnounced,
        announcement: nextAnnounced ? `Leap second announced for ${nextAnnounced}.` : noLeapMatch ? `No leap second announced for the end of ${noLeapMatch[1]}.` : 'No new leap second is currently announced.',
        bulletinNumber,
        bulletinDate: parseBulletinDate(text),
        utcTaiSeconds: utcTai,
        source: 'IERS Bulletin C',
        sourceUrl: IERS_BULLETIN_C_URL
      },
      fallbackUsed: false
    };
  } catch (error) {
    const retained = previous?.reference?.leapSeconds;
    return {
      value: retained || {
        events: LEAP_SECOND_HISTORY,
        lastEvent: LEAP_SECOND_HISTORY.at(-1),
        nextAnnounced: null,
        announcement: 'No additional leap second is included after 12/31/2016.',
        bulletinNumber: null,
        bulletinDate: null,
        utcTaiSeconds: -37,
        source: 'IERS historical record fallback',
        sourceUrl: IERS_BULLETIN_C_URL
      },
      fallbackUsed: true,
      error: error.message
    };
  }
}

async function buildPopulationHistory(previous) {
  try {
    const payload = await fetchJson(WORLD_BANK_POPULATION_URL);
    const rows = Array.isArray(payload?.[1]) ? payload[1] : [];
    const series = {};
    rows.forEach(row => {
      const year = Number(row?.date);
      if (row?.value == null || row.value === '') return;
      const value = Number(row?.value);
      if (Number.isInteger(year) && Number.isFinite(value)) series[year] = value;
    });
    if (Object.keys(series).length < 50) throw new Error('World Bank population history was incomplete');
    const latestYear = Math.max(...Object.keys(series).map(Number));
    return { value: { series, latestYear, latestValue: series[latestYear], source: 'World Bank', sourceUrl: WORLD_BANK_POPULATION_URL }, fallbackUsed: false };
  } catch (error) {
    return { value: previous?.reference?.populationHistory || null, fallbackUsed: true, error: error.message };
  }
}

async function buildWorldBankIndicatorReference(previous, referenceKey, url, label) {
  try {
    const payload = await fetchJson(url);
    const rows = Array.isArray(payload?.[1]) ? payload[1] : [];
    const series = {};
    rows.forEach(row => {
      const year = Number(row?.date);
      const value = Number(row?.value);
      if (Number.isInteger(year) && Number.isFinite(value)) series[year] = value;
    });
    if (Object.keys(series).length < 50) throw new Error(`${label} history was incomplete`);
    const latestYear = Math.max(...Object.keys(series).map(Number));
    return {
      value: { series, latestYear, latestValue: series[latestYear], source: 'World Bank', sourceUrl: url },
      fallbackUsed: false
    };
  } catch (error) {
    return { value: previous?.reference?.[referenceKey] || null, fallbackUsed: true, error: error.message };
  }
}

async function buildClimateReference(previous) {
  try {
    const csv = await fetchText(NASA_GISTEMP_URL);
    const rows = csv.split(/\r?\n/).slice(2);
    const series = {};
    rows.forEach(line => {
      const columns = line.split(',');
      const year = Number(columns[0]);
      const anomaly = Number(columns[13]);
      if (Number.isInteger(year) && Number.isFinite(anomaly)) series[year] = { anomalyC: anomaly, estimatedAbsoluteC: Number((14 + anomaly).toFixed(2)) };
    });
    if (Object.keys(series).length < 100) throw new Error('NASA GISTEMP history was incomplete');
    const latestYear = Math.max(...Object.keys(series).map(Number));
    return {
      value: {
        series,
        latestYear,
        latestAnomalyC: series[latestYear].anomalyC,
        latestEstimatedAbsoluteC: series[latestYear].estimatedAbsoluteC,
        baselineNote: 'Absolute values are an approachable estimate using 14.0 C plus NASA\'s 1951-1980 anomaly.',
        source: 'NASA GISTEMP v4',
        sourceUrl: NASA_GISTEMP_URL
      },
      fallbackUsed: false
    };
  } catch (error) {
    return { value: previous?.reference?.climate || null, fallbackUsed: true, error: error.message };
  }
}

async function buildAtmosphericCO2Reference(previous) {
  try {
    const [text, monthlyText] = await Promise.all([fetchText(NOAA_CO2_URL), fetchText(NOAA_CO2_MONTHLY_URL)]);
    const series = {};
    text.split(/\r?\n/).forEach(line => {
      if (!/^\s*\d{4}\s+/.test(line)) return;
      const columns = line.trim().split(/\s+/);
      const year = Number(columns[0]);
      const value = Number(columns[1]);
      if (Number.isInteger(year) && Number.isFinite(value) && value > 250) series[year] = value;
    });
    if (Object.keys(series).length < 60) throw new Error('NOAA Mauna Loa CO2 history was incomplete');
    const latestYear = Math.max(...Object.keys(series).map(Number));
    let latestValue = series[latestYear];
    let latestDate = `${latestYear}-12-31`;
    monthlyText.split(/\r?\n/).forEach(line => {
      if (!/^\s*\d{4}\s+\d{1,2}\s+/.test(line)) return;
      const columns = line.trim().split(/\s+/);
      const year = Number(columns[0]);
      const month = Number(columns[1]);
      const value = Number(columns[3]);
      if (Number.isInteger(year) && Number.isInteger(month) && Number.isFinite(value) && value > 250) {
        latestValue = value;
        latestDate = `${year}-${String(month).padStart(2, '0')}-01`;
      }
    });
    return {
      value: {
        series,
        latestYear,
        latestValue,
        latestDate,
        unit: 'ppm',
        source: 'NOAA Global Monitoring Laboratory - Mauna Loa',
        sourceUrl: NOAA_CO2_URL
      },
      fallbackUsed: false
    };
  } catch (error) {
    if (previous?.reference?.atmosphericCO2) {
      return { value: previous.reference.atmosphericCO2, fallbackUsed: true, error: error.message };
    }
    const anchorYears = Object.keys(NOAA_CO2_FALLBACK_ANCHORS).map(Number).sort((a, b) => a - b);
    const series = {};
    for (let year = anchorYears[0]; year <= anchorYears[anchorYears.length - 1]; year += 1) {
      const upperIndex = anchorYears.findIndex(anchorYear => anchorYear >= year);
      const upperYear = anchorYears[Math.max(0, upperIndex)];
      const lowerYear = anchorYears[Math.max(0, upperIndex - 1)];
      const lowerValue = NOAA_CO2_FALLBACK_ANCHORS[lowerYear];
      const upperValue = NOAA_CO2_FALLBACK_ANCHORS[upperYear];
      const ratio = upperYear === lowerYear ? 0 : (year - lowerYear) / (upperYear - lowerYear);
      series[year] = Number((lowerValue + (upperValue - lowerValue) * ratio).toFixed(2));
    }
    const latestYear = anchorYears[anchorYears.length - 1];
    return {
      value: {
        series,
        latestYear,
        latestValue: NOAA_CO2_FALLBACK_ANCHORS[latestYear],
        latestDate: '2026-06-01',
        unit: 'ppm',
        source: 'NOAA Mauna Loa embedded fallback',
        sourceUrl: NOAA_CO2_URL
      },
      fallbackUsed: true,
      error: error.message
    };
  }
}

async function buildOrbitalObjectsReference(previous) {
  try {
    const csv = await fetchText(ORBITAL_OBJECTS_URL);
    const series = {};
    csv.split(/\r?\n/).slice(1).forEach(line => {
      const columns = line.trim().split(',');
      const year = Number(columns[1]);
      const value = Number(columns[2]);
      if (!Number.isInteger(year) || !Number.isFinite(value)) return;
      series[year] = (series[year] || 0) + value;
    });
    const years = Object.keys(series).map(Number).sort((a, b) => a - b);
    if (years.length < 60) throw new Error('Orbital-object history was incomplete');
    const latestYear = years.at(-1);
    return {
      value: {
        series,
        latestYear,
        latestValue: series[latestYear],
        definition: 'Payloads and rocket bodies still in orbit; loose debris is excluded.',
        source: 'United States Space Force via Our World in Data',
        sourceUrl: 'https://ourworldindata.org/grapher/space-objects-by-orbit'
      },
      fallbackUsed: false
    };
  } catch (error) {
    return { value: previous?.reference?.orbitalObjects || null, fallbackUsed: true, error: error.message };
  }
}

async function buildActiveSatellitesReference(previous) {
  try {
    const text = await fetchText(ACTIVE_SATELLITES_URL);
    const series = {};
    const monthlySeries = {};
    let latestDate = null;
    let latestValue = null;
    text.split(/\r?\n/).forEach(line => {
      const columns = line.trim().split(/\s+/);
      if (columns.length < 16 || columns[0] === '#') return;
      const fractionalYear = Number(columns[1]);
      const activePayloads = Number(columns[2]);
      if (!Number.isFinite(fractionalYear) || !Number.isFinite(activePayloads)) return;
      const year = Math.floor(fractionalYear);
      series[year] = Math.round(activePayloads);
      const monthNumber = ({ Jan:1, Feb:2, Mar:3, Apr:4, May:5, Jun:6, Jul:7, Aug:8, Sep:9, Oct:10, Nov:11, Dec:12 })[columns[13]];
      const day = Number(columns[14]);
      if (Number.isInteger(monthNumber) && Number.isInteger(day)) {
        latestDate = `${columns[12]}-${String(monthNumber).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        monthlySeries[`${columns[12]}-${String(monthNumber).padStart(2, '0')}`] = Math.round(activePayloads);
      }
      latestValue = Math.round(activePayloads);
    });
    const years = Object.keys(series).map(Number).sort((a, b) => a - b);
    if (years.length < 60 || !Number.isFinite(latestValue)) throw new Error('Active-satellite history was incomplete');
    const latestYear = years.at(-1);
    return {
      value: {
        series,
        monthlySeries,
        latestYear,
        latestValue,
        latestDate,
        definition: 'Active satellite payloads still operating in Earth orbit.',
        source: "Jonathan McDowell's General Catalog of Artificial Space Objects",
        sourceUrl: 'https://planet4589.org/space/stats/active.html'
      },
      fallbackUsed: false
    };
  } catch (error) {
    return { value: previous?.reference?.activeSatellites || null, fallbackUsed: true, error: error.message };
  }
}

function wikidataEpisodeCount(payload, entityId) {
  const claims = payload?.entities?.[entityId]?.claims?.P1113 || [];
  const values = claims.map(claim => Number(claim?.mainsnak?.datavalue?.value?.amount)).filter(Number.isFinite);
  return values.length ? Math.max(...values) : null;
}

async function buildPopCultureReference(previous) {
  const fallback = previous?.reference?.popCultureEpisodes || {
    simpsons: { count: 808, premiere: '1989-12-17', title: 'The Simpsons' },
    snl: { count: 1000, premiere: '1975-10-11', title: 'Saturday Night Live' }
  };
  try {
    const [simpsonsPayload, snlPayload] = await Promise.all([fetchJson(WIKIDATA_SIMPSONS_URL), fetchJson(WIKIDATA_SNL_URL)]);
    const simpsonsCount = wikidataEpisodeCount(simpsonsPayload, 'Q886');
    const snlCount = wikidataEpisodeCount(snlPayload, 'Q23831');
    if (!Number.isFinite(simpsonsCount) || !Number.isFinite(snlCount)) throw new Error('Wikidata episode counts were incomplete');
    return {
      value: {
        simpsons: { count: simpsonsCount, premiere: '1989-12-17', title: 'The Simpsons' },
        snl: { count: snlCount, premiere: '1975-10-11', title: 'Saturday Night Live' },
        source: 'Wikidata',
        sourceUrl: 'https://www.wikidata.org/'
      },
      fallbackUsed: false
    };
  } catch (error) {
    return { value: fallback, fallbackUsed: true, error: error.message };
  }
}

async function buildCivicReference(previous) {
  try {
    const html = await fetchText(USAGOV_PRESIDENT_URL);
    const plain = html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');
    const match = plain.match(/current president of the United States is\s+([^\.]+)\./i);
    if (!match?.[1]) throw new Error('Current president could not be parsed from USAGov');
    const sworn = plain.match(/sworn into office on\s+([A-Za-z]+\s+\d{1,2},\s+\d{4})/i)?.[1] || null;
    return { value: { currentPresident: cleanText(match[1]), termStarted: sworn ? new Date(`${sworn} 12:00:00 UTC`).toISOString().slice(0, 10) : null, source: 'USAGov', sourceUrl: USAGOV_PRESIDENT_URL }, fallbackUsed: false };
  } catch (error) {
    return { value: previous?.reference?.civic || null, fallbackUsed: true, error: error.message };
  }
}

async function buildSportsCoverage() {
  try {
    const sportsText = await readFile(SPORTS_PATH, 'utf8');
    const payload = JSON.parse(sportsText.replace(/^\uFEFF/, ''));
    const maxDate = values => values.filter(Boolean).sort().at(-1) || null;
    return {
      value: {
        version: payload.version || null,
        resultCoverage: {
          nfl: maxDate((payload.superBowls || []).map(item => item.date)),
          mlb: maxDate((payload.worldSeries || []).map(item => item.date)),
          nba: maxDate((payload.nbaFinals || []).map(item => item.date))
        },
        scheduleCoverage: {
          summerOlympics: maxDate(payload.summerOlympicsDates || []),
          winterOlympics: maxDate(payload.winterOlympicsDates || []),
          worldCup: maxDate(payload.worldCupDates || [])
        },
        championshipRefresh: payload.championshipRefresh || null,
        source: 'LifePulse validated sports dataset',
        sourceUrl: 'sports-data-v4.json'
      },
      fallbackUsed: false
    };
  } catch (error) {
    return { value: null, fallbackUsed: true, error: error.message };
  }
}

async function fetchEiaGasAverage() {
  if (!EIA_API_KEY) throw new Error('EIA_API_KEY is not configured');
  const url = new URL(EIA_GAS_URL);
  url.searchParams.set('api_key', EIA_API_KEY);
  url.searchParams.set('frequency', 'weekly');
  url.searchParams.append('data[0]', 'value');
  url.searchParams.append('facets[series][]', 'EMM_EPM0_PTE_NUS_DPG');
  url.searchParams.append('sort[0][column]', 'period');
  url.searchParams.append('sort[0][direction]', 'desc');
  url.searchParams.set('offset', '0');
  url.searchParams.set('length', '1');
  const payload = await fetchJson(url.toString());
  const row = payload?.response?.data?.[0];
  const value = Number(row?.value);
  if (!Number.isFinite(value)) throw new Error('EIA gas response contained no national price');
  return { value, asOf: row.period, unit: 'USD per gallon', source: 'U.S. Energy Information Administration', sourceUrl: 'https://www.eia.gov/petroleum/gasdiesel/' };
}
async function buildCurrentComparisons(previous) {
  const result = {};
  const errors = [];
  const jobs = [
    ['worldPopulation', async () => parseWorldPopulation(await fetchText(WORLD_POPULATION_URL))],
    ['gasPrice', async () => {
      try {
        return await fetchEiaGasAverage();
      } catch (eiaError) {
        const aaa = parseAaaGasAverage(await fetchText(AAA_GAS_URL));
        return { ...aaa, fallbackFrom: 'EIA', fallbackReason: eiaError.message };
      }
    }]
  ];
  await Promise.all(jobs.map(async ([key, loader]) => {
    try {
      const loaded = await loader();
      if (!isReasonableCurrentComparison(key, loaded)) throw new Error(`${key} value failed the plausibility check`);
      result[key] = loaded;
    } catch (error) {
      const retained = retainRecentSnapshot(previous?.current?.[key], previous?.updatedAt);
      if (retained) result[key] = retained;
      errors.push({ feed: key, message: error.message, retainedPrevious: Boolean(retained) });
    }
  }));
  return { result, errors };
}
const previous = await readPreviousData();
const previousSigns = previous?.horoscope?.signs || {};
const signs = {};
const failures = [];
const providerCounts = {};
const providerErrors = [];
let primaryQuotaUnavailable = false;
const calculationTime = new Date();
const astronomy = buildAstronomySnapshot(calculationTime);
const currentComparisons = await buildCurrentComparisons(previous);
const [
  leapSecondReference,
  populationHistoryReference,
  lifeExpectancyReference,
  urbanPopulationShareReference,
  climateReference,
  atmosphericCO2Reference,
  orbitalObjectsReference,
  activeSatellitesReference,
  popCultureReference,
  civicReference,
  sportsCoverageReference
] = await Promise.all([
  buildLeapSecondReference(previous),
  buildPopulationHistory(previous),
  buildWorldBankIndicatorReference(previous, 'lifeExpectancy', WORLD_BANK_LIFE_EXPECTANCY_URL, 'World life-expectancy'),
  buildWorldBankIndicatorReference(previous, 'urbanPopulationShare', WORLD_BANK_URBAN_SHARE_URL, 'World urban-population share'),
  buildClimateReference(previous),
  buildAtmosphericCO2Reference(previous),
  buildOrbitalObjectsReference(previous),
  buildActiveSatellitesReference(previous),
  buildPopCultureReference(previous),
  buildCivicReference(previous),
  buildSportsCoverage()
]);

for (let index = 0; index < SIGNS.length; index += 1) {
  const sign = SIGNS[index];
  const errors = [];
  let reading = null;
  if (!primaryQuotaUnavailable) {
    try {
      reading = await fetchPrimaryReading(sign, previousSigns[sign]);
    } catch (error) {
      errors.push(`primary: ${error.message}`);
      providerErrors.push({ sign, provider: 'primary', message: error.message });
      if (/\b429\b|daily limit|rate limit/i.test(error.message)) primaryQuotaUnavailable = true;
    }
  }
  if (!reading) {
    try {
      reading = await fetchLegacyReading(sign, previousSigns[sign]);
    } catch (error) {
      errors.push(`legacy: ${error.message}`);
      providerErrors.push({ sign, provider: 'legacy', message: error.message });
    }
  }
  if (!reading) reading = retainPreviousReading(previousSigns[sign]);
  if (reading) {
    signs[sign] = reading;
    const provider = reading.provider || 'previous';
    providerCounts[provider] = (providerCounts[provider] || 0) + 1;
  } else {
    failures.push({ sign, errors });
  }
  if (PRIMARY_API_KEY && !primaryQuotaUnavailable && index < SIGNS.length - 1) await new Promise(resolve => setTimeout(resolve, 1100));
}

if (!Object.keys(signs).length) throw new Error('No current or recent horoscope readings are available.');

const now = new Date().toISOString();
const freshCount = Object.values(signs).filter(reading => !reading.stale).length;
const primaryCount = providerCounts['freeastroapi-v2'] || 0;
const legacyCount = providerCounts['freehoroscopeapi-legacy'] || 0;
const previousCount = Object.values(signs).filter(reading => reading.stale).length;
const feedStatus = primaryCount === SIGNS.length ? 'live' : freshCount === SIGNS.length ? 'legacy' : freshCount ? 'partial' : 'previous';
const reference = {
  leapSeconds: leapSecondReference.value,
  populationHistory: populationHistoryReference.value,
  lifeExpectancy: lifeExpectancyReference.value,
  urbanPopulationShare: urbanPopulationShareReference.value,
  climate: climateReference.value,
  atmosphericCO2: atmosphericCO2Reference.value,
  orbitalObjects: orbitalObjectsReference.value,
  activeSatellites: activeSatellitesReference.value,
  popCultureEpisodes: popCultureReference.value,
  civic: civicReference.value,
  sportsCoverage: sportsCoverageReference.value
};
const populationCurrent = currentComparisons.result.worldPopulation;
const gasCurrent = currentComparisons.result.gasPrice;
const output = {
  schemaVersion: DATA_SCHEMA_VERSION,
  updatedAt: now,
  lastAttemptAt: now,
  targetDate: TARGET_DATE,
  status: feedStatus,
  horoscope: {
    period: 'daily',
    source: primaryCount === SIGNS.length ? 'FreeAstroAPI' : primaryCount ? 'Multiple daily horoscope sources' : legacyCount ? 'Free Horoscope API' : 'Previous successful feed',
    signs
  },
  astronomy,
  current: currentComparisons.result,
  reference,
  components: {
    horoscope: componentRecord({ status: feedStatus, asOf: TARGET_DATE, fetchedAt: now, expiresInDays: 2, source: primaryCount ? 'FreeAstroAPI' : legacyCount ? 'Free Horoscope API' : 'Previous successful feed', sourceUrl: primaryCount ? 'https://www.freeastroapi.com/' : 'https://freehoroscopeapi.com/', fallbackUsed: primaryCount !== SIGNS.length, note: 'Daily readings for all twelve signs.' }),
    astronomy: componentRecord({ asOf: astronomy.calculatedAt, fetchedAt: now, expiresInDays: 2, source: astronomy.source, sourceUrl: astronomy.sourceUrl, note: 'Moon phases, eclipses, and planetary retrogrades are calculated.' }),
    worldPopulation: componentRecord({ status: populationCurrent ? (populationCurrent.stale ? 'stale' : 'live') : 'unavailable', asOf: populationCurrent?.asOf || null, fetchedAt: now, expiresInDays: 3, source: populationCurrent?.source || 'Worldometer', sourceUrl: populationCurrent?.sourceUrl || WORLD_POPULATION_URL, fallbackUsed: Boolean(populationCurrent?.stale), note: 'Current estimated world population.' }),
    gasPrice: componentRecord({ status: gasCurrent ? (gasCurrent.stale ? 'stale' : 'live') : 'unavailable', asOf: gasCurrent?.asOf || null, fetchedAt: now, expiresInDays: 8, source: gasCurrent?.source || (EIA_API_KEY ? 'U.S. Energy Information Administration' : 'AAA'), sourceUrl: gasCurrent?.sourceUrl || (EIA_API_KEY ? 'https://www.eia.gov/petroleum/gasdiesel/' : AAA_GAS_URL), fallbackUsed: Boolean(gasCurrent?.stale || gasCurrent?.fallbackFrom), note: 'U.S. national regular gasoline average.' }),
    leapSeconds: componentRecord({ status: leapSecondReference.value ? (leapSecondReference.fallbackUsed ? 'fallback' : 'live') : 'unavailable', asOf: leapSecondReference.value?.bulletinDate || null, fetchedAt: now, expiresInDays: 200, source: leapSecondReference.value?.source || 'IERS Bulletin C', sourceUrl: leapSecondReference.value?.sourceUrl || IERS_BULLETIN_C_URL, fallbackUsed: leapSecondReference.fallbackUsed, coverageEnd: leapSecondReference.value?.nextAnnounced || leapSecondReference.value?.lastEvent || null, note: leapSecondReference.value?.announcement || 'Leap-second announcement status.' }),
    globalTemperature: componentRecord({ status: climateReference.value ? (climateReference.fallbackUsed ? 'fallback' : 'live') : 'unavailable', asOf: climateReference.value?.latestYear ? `${climateReference.value.latestYear}-12-31` : null, fetchedAt: now, expiresInDays: 45, source: climateReference.value?.source || 'NASA GISTEMP v4', sourceUrl: climateReference.value?.sourceUrl || NASA_GISTEMP_URL, fallbackUsed: climateReference.fallbackUsed, coverageEnd: climateReference.value?.latestYear || null, note: 'Annual global surface-temperature anomaly series.' }),
    atmosphericCO2: componentRecord({ status: atmosphericCO2Reference.value ? (atmosphericCO2Reference.fallbackUsed ? 'fallback' : 'live') : 'unavailable', asOf: atmosphericCO2Reference.value?.latestDate || (atmosphericCO2Reference.value?.latestYear ? `${atmosphericCO2Reference.value.latestYear}-12-31` : null), fetchedAt: now, expiresInDays: 45, source: atmosphericCO2Reference.value?.source || 'NOAA Global Monitoring Laboratory', sourceUrl: atmosphericCO2Reference.value?.sourceUrl || NOAA_CO2_URL, fallbackUsed: atmosphericCO2Reference.fallbackUsed, coverageEnd: atmosphericCO2Reference.value?.latestDate || atmosphericCO2Reference.value?.latestYear || null, note: 'Annual history plus the latest monthly atmospheric carbon dioxide mean at Mauna Loa.' }),
    orbitalObjects: componentRecord({ status: orbitalObjectsReference.value ? (orbitalObjectsReference.fallbackUsed ? 'fallback' : 'live') : 'unavailable', asOf: orbitalObjectsReference.value?.latestYear ? `${orbitalObjectsReference.value.latestYear}-12-31` : null, fetchedAt: now, expiresInDays: 370, source: orbitalObjectsReference.value?.source || 'United States Space Force via Our World in Data', sourceUrl: orbitalObjectsReference.value?.sourceUrl || ORBITAL_OBJECTS_URL, fallbackUsed: orbitalObjectsReference.fallbackUsed, coverageEnd: orbitalObjectsReference.value?.latestYear || null, note: 'Annual historical count of payloads and rocket bodies still in orbit, excluding loose debris.' }),
    activeSatellites: componentRecord({ status: activeSatellitesReference.value ? (activeSatellitesReference.fallbackUsed ? 'fallback' : 'live') : 'unavailable', asOf: activeSatellitesReference.value?.latestDate || null, fetchedAt: now, expiresInDays: 8, source: activeSatellitesReference.value?.source || "Jonathan McDowell's General Catalog of Artificial Space Objects", sourceUrl: activeSatellitesReference.value?.sourceUrl || ACTIVE_SATELLITES_URL, fallbackUsed: activeSatellitesReference.fallbackUsed, coverageEnd: activeSatellitesReference.value?.latestDate || activeSatellitesReference.value?.latestYear || null, note: 'Historical year-end and latest current counts of active satellite payloads in orbit.' }),
    popCultureEpisodes: componentRecord({ status: popCultureReference.value ? (popCultureReference.fallbackUsed ? 'fallback' : 'live') : 'unavailable', asOf: TARGET_DATE, fetchedAt: now, expiresInDays: 8, source: popCultureReference.value?.source || 'Wikidata episode counts', sourceUrl: popCultureReference.value?.sourceUrl || 'https://www.wikidata.org/', fallbackUsed: popCultureReference.fallbackUsed, note: 'Maintained episode-count references for The Simpsons and Saturday Night Live.' }),
    populationHistory: componentRecord({ status: populationHistoryReference.value ? (populationHistoryReference.fallbackUsed ? 'fallback' : 'live') : 'unavailable', asOf: populationHistoryReference.value?.latestYear ? `${populationHistoryReference.value.latestYear}-12-31` : null, fetchedAt: now, expiresInDays: 45, source: populationHistoryReference.value?.source || 'World Bank', sourceUrl: populationHistoryReference.value?.sourceUrl || WORLD_BANK_POPULATION_URL, fallbackUsed: populationHistoryReference.fallbackUsed, coverageEnd: populationHistoryReference.value?.latestYear || null, note: 'Annual historical world population used for birth-year comparisons.' }),
    lifeExpectancy: componentRecord({ status: lifeExpectancyReference.value ? (lifeExpectancyReference.fallbackUsed ? 'fallback' : 'live') : 'unavailable', asOf: lifeExpectancyReference.value?.latestYear ? `${lifeExpectancyReference.value.latestYear}-12-31` : null, fetchedAt: now, expiresInDays: 45, source: lifeExpectancyReference.value?.source || 'World Bank', sourceUrl: lifeExpectancyReference.value?.sourceUrl || WORLD_BANK_LIFE_EXPECTANCY_URL, fallbackUsed: lifeExpectancyReference.fallbackUsed, coverageEnd: lifeExpectancyReference.value?.latestYear || null, note: 'Annual worldwide life expectancy at birth.' }),
    urbanPopulationShare: componentRecord({ status: urbanPopulationShareReference.value ? (urbanPopulationShareReference.fallbackUsed ? 'fallback' : 'live') : 'unavailable', asOf: urbanPopulationShareReference.value?.latestYear ? `${urbanPopulationShareReference.value.latestYear}-12-31` : null, fetchedAt: now, expiresInDays: 45, source: urbanPopulationShareReference.value?.source || 'World Bank', sourceUrl: urbanPopulationShareReference.value?.sourceUrl || WORLD_BANK_URBAN_SHARE_URL, fallbackUsed: urbanPopulationShareReference.fallbackUsed, coverageEnd: urbanPopulationShareReference.value?.latestYear || null, note: 'Annual worldwide urban share of total population.' }),
    civic: componentRecord({ status: civicReference.value ? (civicReference.fallbackUsed ? 'fallback' : 'live') : 'unavailable', asOf: civicReference.value?.termStarted || TARGET_DATE, fetchedAt: now, expiresInDays: 8, source: civicReference.value?.source || 'USAGov', sourceUrl: civicReference.value?.sourceUrl || USAGOV_PRESIDENT_URL, fallbackUsed: civicReference.fallbackUsed, note: 'Current U.S. president reference.' }),
    sports: componentRecord({ status: sportsCoverageReference.value ? 'validated' : 'unavailable', asOf: TARGET_DATE, fetchedAt: now, expiresInDays: 32, source: sportsCoverageReference.value?.source || 'LifePulse sports dataset', sourceUrl: sportsCoverageReference.value?.sourceUrl || 'sports-data-v4.json', fallbackUsed: sportsCoverageReference.fallbackUsed, coverageEnd: sportsCoverageReference.value?.resultCoverage || null, note: 'Champions are checked once after each projected NFL, NBA, or MLB completion date; coverage monitoring prevents silent gaps.' }),
    historicalWeather: componentRecord({ status: 'on-demand', asOf: null, fetchedAt: now, expiresInDays: 3650, source: 'Open-Meteo Archive API', sourceUrl: 'https://open-meteo.com/en/docs/historical-weather-api', note: 'Fetched in the browser for the saved birthplace and birthday.' }),
    cultureHistory: componentRecord({ status: 'on-demand', asOf: null, fetchedAt: now, expiresInDays: 3650, source: 'Wikimedia APIs', sourceUrl: 'https://www.mediawiki.org/wiki/API:Main_page', note: 'Fetched in the browser only when a relevant card is opened.' }),
    curatedEras: componentRecord({ status: 'curated', asOf: TARGET_DATE, fetchedAt: now, expiresInDays: 3650, source: 'LifePulse editorial definitions', sourceUrl: 'README.md', note: 'Generational and cultural era boundaries are intentionally curated, not live facts.' })
  },
  refresh: {
    requested: SIGNS.length,
    succeeded: Object.keys(signs).length,
    fresh: freshCount,
    primary: primaryCount,
    legacy: legacyCount,
    previous: previousCount,
    primaryConfigured: Boolean(PRIMARY_API_KEY),
    eiaConfigured: Boolean(EIA_API_KEY),
    providerErrors,
    currentDataErrors: currentComparisons.errors,
    referenceErrors: [
      ['leapSeconds', leapSecondReference.error],
      ['populationHistory', populationHistoryReference.error],
      ['lifeExpectancy', lifeExpectancyReference.error],
      ['urbanPopulationShare', urbanPopulationShareReference.error],
      ['climate', climateReference.error],
      ['atmosphericCO2', atmosphericCO2Reference.error],
      ['orbitalObjects', orbitalObjectsReference.error],
      ['activeSatellites', activeSatellitesReference.error],
      ['popCultureEpisodes', popCultureReference.error],
      ['civic', civicReference.error],
      ['sportsCoverage', sportsCoverageReference.error]
    ].filter(([, message]) => message).map(([feed, message]) => ({ feed, message })),
    failures
  }
};

const serialized = `${JSON.stringify(output, null, 2)}\n`;
const contentHash = createHash('sha256').update(serialized).digest('hex');
await writeFile(OUTPUT_PATH, serialized, 'utf8');
await writeFile(VERSION_PATH, `${JSON.stringify({ schemaVersion: 2, releaseVersion: RELEASE_VERSION, updatedAt: now, targetDate: TARGET_DATE, dataSchemaVersion: output.schemaVersion, contentHash }, null, 2)}\n`, 'utf8');
console.log(`Release v${RELEASE_VERSION}.`);
console.log(`Prepared ${Object.keys(signs).length} readings: ${primaryCount} primary, ${legacyCount} legacy, ${previousCount} previous.`);
console.log(`Prepared astronomy snapshot and ${Object.keys(currentComparisons.result).length} current comparison feeds.`);
if (PRIMARY_API_KEY && primaryCount !== SIGNS.length) {
  const primaryErrors = providerErrors.filter(item => item.provider === 'primary');
  console.warn(`Primary provider issues: ${primaryErrors.map(item => `${item.sign}: ${item.message}`).join(' | ')}`);
}
if (!PRIMARY_API_KEY) console.warn('FREE_ASTRO_API_KEY is not configured; the legacy provider was used.');
