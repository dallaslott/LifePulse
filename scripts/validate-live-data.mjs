import { readFile } from 'node:fs/promises';

async function readJson(url) {
  const text = await readFile(url, 'utf8');
  return JSON.parse(text.replace(/^\uFEFF/, ''));
}

const data = await readJson(new URL('../live-data.json', import.meta.url));
const version = await readJson(new URL('../version.json', import.meta.url));
const sports = await readJson(new URL('../sports-data-v4.json', import.meta.url));
const sky = await readJson(new URL('../sky-events.json', import.meta.url));
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
for (const [eventLabel, dates, locations] of [
  ['Summer Olympics', sports.summerOlympicsDates || [], sports.summerOlympicsLocations || {}],
  ['Winter Olympics', sports.winterOlympicsDates || [], sports.winterOlympicsLocations || {}],
  ['FIFA World Cup', sports.worldCupDates || [], sports.worldCupLocations || {}]
]) {
  for (const date of dates) {
    if (!String(locations[date] || '').trim()) errors.push(`${eventLabel} location is missing for ${date}.`);
  }
}
const scheduleChecks = sports?.scheduleRefresh?.nextCheck || {};
for (const eventKey of ['summerOlympics', 'winterOlympics', 'worldCup']) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(scheduleChecks[eventKey] || ''))) errors.push(`${eventKey} future schedule check date is missing.`);
}
if (!/^\d{4}-\d{2}-\d{2}$/.test(String(sports?.technologyReview?.consoleEras?.nextReview || ''))) errors.push('Gaming Console Eras next-review date is missing.');

const championshipChecks = sports?.championshipRefresh?.checkAfter || {};
for (const league of ['nfl', 'nba', 'mlb']) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(championshipChecks[league] || ''))) errors.push(`Sports championship check date is missing for ${league.toUpperCase()}.`);
}
const latestNFLYear = Math.max(...(sports.superBowls || []).map(entry => new Date(`${entry.date}T12:00:00Z`).getUTCFullYear()));
const latestNBAYear = Math.max(...(sports.nbaFinals || []).map(entry => Number(entry.year)));
const latestMLBYear = Math.max(...(sports.worldSeries || []).map(entry => Number(entry.year)));
const expectedChampionshipChecks = {
  nfl: `${latestNFLYear + 1}-02-15`,
  nba: `${latestNBAYear + 1}-06-24`,
  mlb: `${latestMLBYear + 1}-11-06`
};
for (const league of ['nfl', 'nba', 'mlb']) {
  if (championshipChecks[league] !== expectedChampionshipChecks[league]) errors.push(`${league.toUpperCase()} next championship check should be ${expectedChampionshipChecks[league]}, received ${championshipChecks[league] || 'missing'}.`);
}
const skyEvents = Array.isArray(sky?.events) ? sky.events : [];
const skyCoverageEnd = Number(sky?.coverage?.endYear || 0);
const requiredSkyCoverage = new Date().getUTCFullYear() + 1;
if (Number(sky?.schemaVersion) < 1) errors.push('Sky-event schema is missing.');
if (skyCoverageEnd < requiredSkyCoverage) errors.push('Sky-event coverage must extend through at least ' + requiredSkyCoverage + '.');
if (skyEvents.filter(event => event.type === 'meteor-shower').length < 10) errors.push('Sky calendar does not contain enough meteor-shower peaks.');
if (!skyEvents.some(event => event.type === 'meteor-shower' && Date.parse(event.date) > now)) errors.push('Sky calendar contains no future meteor shower.');
if (!skyEvents.some(event => ['planetary-conjunction', 'planetary-opposition', 'planet-visibility'].includes(event.type) && Date.parse(event.date) > now)) errors.push('Sky calendar contains no future visible planetary event.');
if (new Set(skyEvents.map(event => event.id)).size !== skyEvents.length) errors.push('Sky calendar contains duplicate event identifiers.');
if (!/^\d{4}-\d{2}-\d{2}$/.test(String(sky?.updatePolicy?.nextReview || ''))) errors.push('Sky calendar next-review date is missing.');
for (let index = 0; index < skyEvents.length; index += 1) {
  if (!Number.isFinite(Date.parse(skyEvents[index].date))) errors.push('Sky event has an invalid date: ' + (skyEvents[index].id || index) + '.');
  if (index && Date.parse(skyEvents[index - 1].date) > Date.parse(skyEvents[index].date)) errors.push('Sky events are not sorted chronologically.');
}

if (!version?.contentHash || Number(version?.dataSchemaVersion) !== Number(data.schemaVersion)) errors.push('version.json does not match live-data.json.');
const releasePattern = new RegExp(`^${Number(data.schemaVersion)}\\.(?:\\d+\\.\\d+|local\\.\\d{8})$`);
if (!releasePattern.test(String(version?.releaseVersion || ''))) errors.push(`version.json has an invalid release version: ${version?.releaseVersion || 'missing'}.`);

if (errors.length) {
  console.error(errors.map(error => `- ${error}`).join('\n'));
  process.exit(1);
}
console.log('Validated release v' + version.releaseVersion + ': schema ' + data.schemaVersion + ', ' + requiredComponents.length + ' registered components, 12 horoscope signs, reference histories, future sports coverage, and ' + skyEvents.length + ' maintained sky events.');




