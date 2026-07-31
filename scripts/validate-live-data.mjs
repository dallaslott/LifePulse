import { readFile } from 'node:fs/promises';

async function readJson(url) {
  const text = await readFile(url, 'utf8');
  return JSON.parse(text.replace(/^\uFEFF/, ''));
}

const data = await readJson(new URL('../live-data.json', import.meta.url));
const version = await readJson(new URL('../version.json', import.meta.url));
const sports = await readJson(new URL('../sports-data-v4.json', import.meta.url));
const errors = [];
const now = Date.now();
const requiredComponents = ['horoscope', 'astronomy', 'worldPopulation', 'gasPrice', 'leapSeconds', 'globalTemperature', 'populationHistory', 'civic', 'sports'];

if (Number(data.schemaVersion) < 4) errors.push(`Expected data schema 4+, received ${data.schemaVersion}.`);
if (Object.keys(data?.horoscope?.signs || {}).length !== 12) errors.push('Daily horoscope must contain all 12 signs.');
if (!data?.astronomy?.moon?.nextFullMoon || !data?.astronomy?.eclipses?.nextSolar?.date) errors.push('Astronomy snapshot is incomplete.');
if (!Number.isFinite(Number(data?.current?.worldPopulation?.value))) errors.push('Current world population is missing.');
if (!Number.isFinite(Number(data?.current?.gasPrice?.value))) errors.push('Current gas price is missing.');
if (!Array.isArray(data?.reference?.leapSeconds?.events) || data.reference.leapSeconds.events.length < 27) errors.push('Leap-second history is incomplete.');
if (Object.keys(data?.reference?.populationHistory?.series || {}).length < 40) errors.push('World Bank population history is incomplete.');
if (Object.keys(data?.reference?.climate?.series || {}).length < 100) errors.push('NASA climate history is incomplete.');

for (const key of requiredComponents) {
  const component = data?.components?.[key];
  if (!component) {
    errors.push(`Component registry is missing ${key}.`);
    continue;
  }
  if (component.status === 'unavailable') errors.push(`${key} is unavailable.`);
  const expires = Date.parse(component.expiresAt || '');
  if (Number.isFinite(expires) && expires < now) errors.push(`${key} expired at ${component.expiresAt}.`);
}

const futureSchedule = [
  ...(sports.summerOlympicsDates || []),
  ...(sports.winterOlympicsDates || []),
  ...(sports.worldCupDates || [])
].some(value => Date.parse(value) > now);
if (!futureSchedule) errors.push('Sports schedules contain no future event.');
if (!version?.contentHash || Number(version?.dataSchemaVersion) !== Number(data.schemaVersion)) errors.push('version.json does not match live-data.json.');
const releasePattern = new RegExp(`^${Number(data.schemaVersion)}\\.(?:\\d+\\.\\d+|local\\.\\d{8})$`);
if (!releasePattern.test(String(version?.releaseVersion || ''))) errors.push(`version.json has an invalid release version: ${version?.releaseVersion || 'missing'}.`);

if (errors.length) {
  console.error(errors.map(error => `- ${error}`).join('\n'));
  process.exit(1);
}
console.log(`Validated release v${version.releaseVersion}: schema ${data.schemaVersion}, ${requiredComponents.length} registered components, 12 horoscope signs, reference histories, and future sports coverage.`);
