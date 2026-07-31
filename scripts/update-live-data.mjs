import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import * as Astronomy from 'astronomy-engine';

const OUTPUT_PATH = new URL('../live-data.json', import.meta.url);
const PRIMARY_URL = 'https://api.freeastroapi.com/api/v2/horoscope/daily/sign';
const LEGACY_URL = 'https://freehoroscopeapi.com/api/v1/get-horoscope/daily';
const PREVIOUS_DATA_URL = process.env.PREVIOUS_DATA_URL || 'https://dallaslott.github.io/LifePulse/live-data.json';
const PRIMARY_API_KEY = String(process.env.FREE_ASTRO_API_KEY || '').trim();
const TARGET_DATE = process.env.LIFEPULSE_DATE || new Date().toISOString().slice(0, 10);
const WORLD_POPULATION_URL = 'https://www.worldometers.info/world-population/';
const AAA_GAS_URL = 'https://gasprices.aaa.com/aaa-gas-cost-calculator/';
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
        Accept: 'text/html,application/xhtml+xml',
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

async function buildCurrentComparisons(previous) {
  const result = {};
  const errors = [];
  const jobs = [
    ['worldPopulation', WORLD_POPULATION_URL, parseWorldPopulation],
    ['gasPrice', AAA_GAS_URL, parseAaaGasAverage]
  ];
  await Promise.all(jobs.map(async ([key, url, parser]) => {
    try {
      result[key] = parser(await fetchText(url));
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
const calculationTime = new Date();
const astronomy = buildAstronomySnapshot(calculationTime);
const currentComparisons = await buildCurrentComparisons(previous);

for (let index = 0; index < SIGNS.length; index += 1) {
  const sign = SIGNS[index];
  const errors = [];
  let reading = null;
  try {
    reading = await fetchPrimaryReading(sign, previousSigns[sign]);
  } catch (error) {
    errors.push(`primary: ${error.message}`);
    providerErrors.push({ sign, provider: 'primary', message: error.message });
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
  if (PRIMARY_API_KEY && index < SIGNS.length - 1) await new Promise(resolve => setTimeout(resolve, 1100));
}

if (!Object.keys(signs).length) throw new Error('No current or recent horoscope readings are available.');

const now = new Date().toISOString();
const freshCount = Object.values(signs).filter(reading => !reading.stale).length;
const primaryCount = providerCounts['freeastroapi-v2'] || 0;
const legacyCount = providerCounts['freehoroscopeapi-legacy'] || 0;
const previousCount = Object.values(signs).filter(reading => reading.stale).length;
const output = {
  schemaVersion: 3,
  updatedAt: now,
  lastAttemptAt: now,
  targetDate: TARGET_DATE,
  status: primaryCount === SIGNS.length ? 'live' : freshCount === SIGNS.length ? 'legacy' : freshCount ? 'partial' : 'previous',
  horoscope: {
    period: 'daily',
    source: primaryCount === SIGNS.length ? 'FreeAstroAPI' : primaryCount ? 'Multiple daily horoscope sources' : legacyCount ? 'Free Horoscope API' : 'Previous successful feed',
    signs
  },
  astronomy,
  current: currentComparisons.result,
  refresh: {
    requested: SIGNS.length,
    succeeded: Object.keys(signs).length,
    fresh: freshCount,
    primary: primaryCount,
    legacy: legacyCount,
    previous: previousCount,
    primaryConfigured: Boolean(PRIMARY_API_KEY),
    providerErrors,
    currentDataErrors: currentComparisons.errors,
    failures
  }
};

await writeFile(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
console.log(`Prepared ${Object.keys(signs).length} readings: ${primaryCount} primary, ${legacyCount} legacy, ${previousCount} previous.`);
console.log(`Prepared astronomy snapshot and ${Object.keys(currentComparisons.result).length} current comparison feeds.`);
if (PRIMARY_API_KEY && primaryCount !== SIGNS.length) {
  const primaryErrors = providerErrors.filter(item => item.provider === 'primary');
  console.warn(`Primary provider issues: ${primaryErrors.map(item => `${item.sign}: ${item.message}`).join(' | ')}`);
}
if (!PRIMARY_API_KEY) console.warn('FREE_ASTRO_API_KEY is not configured; the legacy provider was used.');
