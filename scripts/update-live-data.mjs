import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const OUTPUT_PATH = new URL('../live-data.json', import.meta.url);
const PRIMARY_URL = 'https://api.freeastroapi.com/api/v2/horoscope/daily/sign';
const LEGACY_URL = 'https://freehoroscopeapi.com/api/v1/get-horoscope/daily';
const PREVIOUS_DATA_URL = process.env.PREVIOUS_DATA_URL || 'https://dallaslott.github.io/LifePulse/live-data.json';
const PRIMARY_API_KEY = String(process.env.FREE_ASTRO_API_KEY || '').trim();
const TARGET_DATE = process.env.LIFEPULSE_DATE || new Date().toISOString().slice(0, 10);
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
        'User-Agent': 'LifePulse-GitHub-Pages-Updater/2.0',
        ...(options.headers || {})
      },
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`Request failed with HTTP ${response.status}`);
    }

    return await response.json();
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
    schemaVersion: 2,
    updatedAt: null,
    lastAttemptAt: null,
    status: 'stale',
    horoscope: { period: 'daily', signs: {} }
  };
}

function validateReading(reading, sign) {
  if (!reading.text) throw new Error(`No horoscope text returned for ${sign}`);
  if (reading.date !== TARGET_DATE) {
    throw new Error(`Provider returned ${reading.date || 'no date'} for ${sign}; expected ${TARGET_DATE}`);
  }
  if (String(reading.sign || '').toLowerCase() !== sign) {
    throw new Error(`Provider returned the wrong sign for ${sign}`);
  }
  if (reading.text.length < 80) throw new Error(`Reading for ${sign} is too short to publish`);
  return reading;
}

function isRepeatedAcrossDates(reading, previousReading) {
  if (!previousReading?.text || !previousReading?.date || previousReading.date === reading.date) return false;
  return hashText(previousReading.text) === hashText(reading.text);
}

async function fetchPrimaryReading(sign, previousReading) {
  if (!PRIMARY_API_KEY) throw new Error('FREE_ASTRO_API_KEY is not configured');

  const body = new URLSearchParams({
    sign,
    date: TARGET_DATE,
    tz_str: 'America/Chicago',
    lang: 'en'
  });
  const payload = await fetchJson(PRIMARY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'x-api-key': PRIMARY_API_KEY
    },
    body
  });
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

  if (isRepeatedAcrossDates(reading, previousReading)) {
    throw new Error(`Primary provider repeated the previous dated reading for ${sign}`);
  }
  return reading;
}

async function fetchLegacyReading(sign, previousReading) {
  const payload = await fetchJson(`${LEGACY_URL}?sign=${encodeURIComponent(sign)}&v=${Date.now()}`);
  const data = payload?.data || {};
  const reading = validateReading({
    sign: String(data.sign || sign).toLowerCase(),
    date: data.date || TARGET_DATE,
    text: cleanText(data.horoscope),
    generatedAt: null,
    source: 'Free Horoscope API',
    sourceUrl: 'https://freehoroscopeapi.com/',
    provider: 'freehoroscopeapi-legacy',
    quality: 'generic-daily',
    theme: null,
    keywords: [],
    scores: null,
    lucky: null
  }, sign);

  if (isRepeatedAcrossDates(reading, previousReading)) {
    throw new Error(`Legacy provider repeated the previous dated reading for ${sign}`);
  }
  return reading;
}

function retainPreviousReading(previousReading) {
  if (!previousReading?.text || !previousReading?.date) return null;
  const ageMs = Date.parse(`${TARGET_DATE}T12:00:00Z`) - Date.parse(`${previousReading.date}T12:00:00Z`);
  if (!Number.isFinite(ageMs) || ageMs < 0 || ageMs > 7 * 86400000) return null;
  return {
    ...previousReading,
    stale: true,
    quality: 'previous-reading'
  };
}

const previous = await readPreviousData();
const previousSigns = previous?.horoscope?.signs || {};
const signs = {};
const failures = [];
const providerCounts = {};

await Promise.all(SIGNS.map(async (sign) => {
  const errors = [];
  let reading = null;

  try {
    reading = await fetchPrimaryReading(sign, previousSigns[sign]);
  } catch (error) {
    errors.push(`primary: ${error.message}`);
  }

  if (!reading) {
    try {
      reading = await fetchLegacyReading(sign, previousSigns[sign]);
    } catch (error) {
      errors.push(`legacy: ${error.message}`);
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
}));

if (!Object.keys(signs).length) {
  throw new Error('No current or recent horoscope readings are available.');
}

const now = new Date().toISOString();
const freshCount = Object.values(signs).filter(reading => !reading.stale).length;
const primaryCount = providerCounts['freeastroapi-v2'] || 0;
const legacyCount = providerCounts['freehoroscopeapi-legacy'] || 0;
const previousCount = Object.values(signs).filter(reading => reading.stale).length;
const output = {
  schemaVersion: 2,
  updatedAt: freshCount ? now : previous.updatedAt || null,
  lastAttemptAt: now,
  targetDate: TARGET_DATE,
  status: primaryCount === SIGNS.length
    ? 'live'
    : freshCount === SIGNS.length
      ? 'legacy'
      : freshCount
        ? 'partial'
        : 'previous',
  horoscope: {
    period: 'daily',
    source: primaryCount === SIGNS.length
      ? 'FreeAstroAPI'
      : primaryCount
        ? 'Multiple daily horoscope sources'
        : legacyCount
          ? 'Free Horoscope API'
          : 'Previous successful feed',
    signs
  },
  refresh: {
    requested: SIGNS.length,
    succeeded: Object.keys(signs).length,
    fresh: freshCount,
    primary: primaryCount,
    legacy: legacyCount,
    previous: previousCount,
    primaryConfigured: Boolean(PRIMARY_API_KEY),
    failures
  }
};

await writeFile(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
console.log(`Prepared ${Object.keys(signs).length} readings: ${primaryCount} primary, ${legacyCount} legacy, ${previousCount} previous.`);
if (!PRIMARY_API_KEY) console.warn('FREE_ASTRO_API_KEY is not configured; the legacy provider was used.');