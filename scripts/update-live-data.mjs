import { readFile, writeFile } from 'node:fs/promises';

const OUTPUT_PATH = new URL('../live-data.json', import.meta.url);
const HOROSCOPE_URL = 'https://freehoroscopeapi.com/api/v1/get-horoscope/daily';
const SIGNS = [
  'aries',
  'taurus',
  'gemini',
  'cancer',
  'leo',
  'virgo',
  'libra',
  'scorpio',
  'sagittarius',
  'capricorn',
  'aquarius',
  'pisces'
];

async function readPreviousData() {
  try {
    return JSON.parse(await readFile(OUTPUT_PATH, 'utf8'));
  } catch {
    return {
      schemaVersion: 1,
      updatedAt: null,
      lastAttemptAt: null,
      horoscope: {
        period: 'daily',
        source: 'Free Horoscope API',
        signs: {}
      }
    };
  }
}

async function fetchJson(url, timeoutMs = 12000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'LifePulse-GitHub-Pages-Updater/1.0'
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

function normalizeReading(payload, sign) {
  const data = payload?.data;
  const text = String(data?.horoscope || '').replace(/\s+/g, ' ').trim();

  if (!text) {
    throw new Error(`No horoscope text returned for ${sign}`);
  }

  return {
    sign: data?.sign || sign[0].toUpperCase() + sign.slice(1),
    date: data?.date || new Date().toISOString().slice(0, 10),
    text
  };
}

const previous = await readPreviousData();
const results = await Promise.allSettled(
  SIGNS.map(async (sign) => {
    const url = `${HOROSCOPE_URL}?sign=${encodeURIComponent(sign)}`;
    return [sign, normalizeReading(await fetchJson(url), sign)];
  })
);

const freshSigns = {};
const failures = [];

for (let index = 0; index < results.length; index += 1) {
  const result = results[index];
  const sign = SIGNS[index];

  if (result.status === 'fulfilled') {
    const [key, reading] = result.value;
    freshSigns[key] = reading;
  } else {
    failures.push(sign);
  }
}

const previousSigns = previous?.horoscope?.signs || {};
const mergedSigns = { ...previousSigns, ...freshSigns };
const now = new Date().toISOString();
const output = {
  schemaVersion: 1,
  updatedAt: Object.keys(freshSigns).length ? now : previous.updatedAt || null,
  lastAttemptAt: now,
  status: Object.keys(freshSigns).length === SIGNS.length
    ? 'live'
    : Object.keys(freshSigns).length
      ? 'partial'
      : 'stale',
  horoscope: {
    period: 'daily',
    source: 'Free Horoscope API',
    sourceUrl: 'https://freehoroscopeapi.com/',
    signs: mergedSigns
  },
  refresh: {
    requested: SIGNS.length,
    succeeded: Object.keys(freshSigns).length,
    failedSigns: failures
  }
};

if (!Object.keys(mergedSigns).length) {
  throw new Error('No horoscope readings are available; preserving the existing live-data file.');
}

await writeFile(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
console.log(`Updated ${Object.keys(freshSigns).length} of ${SIGNS.length} horoscope readings.`);

