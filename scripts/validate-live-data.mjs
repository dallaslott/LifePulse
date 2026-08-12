import { readFile } from 'node:fs/promises';

async function readJson(url) {
  const text = await readFile(url, 'utf8');
  return JSON.parse(text.replace(/^\uFEFF/, ''));
}

const data = await readJson(new URL('../live-data.json', import.meta.url));
const version = await readJson(new URL('../version.json', import.meta.url));
const sports = await readJson(new URL('../sports-data-v4.json', import.meta.url));
const sky = await readJson(new URL('../sky-events.json', import.meta.url));
const costs = await readJson(new URL('../cost-of-living-data.json', import.meta.url));
const placeEconomy = await readJson(new URL('../place-economic-data.json', import.meta.url));
const errors = [];
const now = Date.now();
const APP_RELEASE_MAJOR = 5;
const requiredComponents = ['horoscope', 'astronomy', 'worldPopulation', 'gasPrice', 'leapSeconds', 'globalTemperature', 'atmosphericCO2', 'popCultureEpisodes', 'populationHistory', 'civic', 'sports'];
const currentYear = new Date().getUTCFullYear();

function latestSeriesYear(series) {
  return Math.max(...Object.keys(series || {}).map(Number).filter(Number.isFinite));
}

function requireRecentYear(label, year, maxLagYears) {
  if (!Number.isFinite(year) || year < currentYear - maxLagYears) errors.push(`${label} latest year ${Number.isFinite(year) ? year : 'missing'} is too old for ${currentYear}.`);
}

function requireReviewDate(label, value, overdueGraceDays = 2) {
  const parsed = Date.parse(`${value || ''}T23:59:59Z`);
  if (!Number.isFinite(parsed)) {
    errors.push(`${label} next-review date is missing or invalid.`);
    return;
  }
  if (parsed < now - overdueGraceDays * 86400000) errors.push(`${label} review is overdue since ${value}.`);
}

if (Number(data.schemaVersion) < 4) errors.push(`Expected data schema 4+, received ${data.schemaVersion}.`);
if (Object.keys(data?.horoscope?.signs || {}).length !== 12) errors.push('Daily horoscope must contain all 12 signs.');
if (!data?.astronomy?.moon?.nextFullMoon || !data?.astronomy?.eclipses?.nextSolar?.date) errors.push('Astronomy snapshot is incomplete.');
if (!Number.isFinite(Number(data?.current?.worldPopulation?.value))) errors.push('Current world population is missing.');
if (!Number.isFinite(Number(data?.current?.gasPrice?.value))) errors.push('Current gas price is missing.');
const worldPopulationValue = Number(data?.current?.worldPopulation?.value);
const gasPriceValue = Number(data?.current?.gasPrice?.value);
if (Number.isFinite(worldPopulationValue) && (worldPopulationValue < 7_000_000_000 || worldPopulationValue > 10_000_000_000)) errors.push(`Current world population is implausible: ${worldPopulationValue}.`);
if (Number.isFinite(gasPriceValue) && (gasPriceValue < 1 || gasPriceValue > 15)) errors.push(`Current U.S. gas price is implausible: ${gasPriceValue}.`);
if (Date.parse(data?.updatedAt || '') < now - 3 * 86400000) errors.push(`live-data.json is older than three days: ${data?.updatedAt || 'missing'}.`);
if (!Array.isArray(data?.reference?.leapSeconds?.events) || data.reference.leapSeconds.events.length < 27) errors.push('Leap-second history is incomplete.');
if (Object.keys(data?.reference?.populationHistory?.series || {}).length < 40) errors.push('World Bank population history is incomplete.');
if (Object.keys(data?.reference?.climate?.series || {}).length < 100) errors.push('NASA climate history is incomplete.');
if (Object.keys(data?.reference?.atmosphericCO2?.series || {}).length < 60) errors.push('NOAA atmospheric CO2 history is incomplete.');
if (!Number.isFinite(Number(data?.reference?.popCultureEpisodes?.simpsons?.count)) || !Number.isFinite(Number(data?.reference?.popCultureEpisodes?.snl?.count))) errors.push('Pop-culture episode references are incomplete.');
requireRecentYear('World Bank population history', Number(data?.reference?.populationHistory?.latestYear), 2);
requireRecentYear('NASA global temperature history', Number(data?.reference?.climate?.latestYear), 2);
const latestCo2Date = Date.parse(data?.reference?.atmosphericCO2?.latestDate || '');
if (!Number.isFinite(latestCo2Date) || now - latestCo2Date > 120 * 86400000) errors.push(`NOAA atmospheric CO2 latest observation is too old: ${data?.reference?.atmosphericCO2?.latestDate || 'missing'}.`);
for (const sign of Object.values(data?.horoscope?.signs || {})) {
  if (sign?.date !== data.targetDate) errors.push(`Horoscope reading for ${sign?.sign || 'unknown sign'} is dated ${sign?.date || 'missing'} instead of ${data.targetDate}.`);
}

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
const expectedLiveComponentSources = {
  atmosphericCO2: /NOAA/i,
  globalTemperature: /NASA/i,
  populationHistory: /World Bank/i,
  leapSeconds: /IERS/i,
  civic: /USA\.gov|USAGov/i
};
for (const [key, pattern] of Object.entries(expectedLiveComponentSources)) {
  if (!pattern.test(String(data?.components?.[key]?.source || ''))) errors.push(`${key} source is not the expected authoritative provider.`);
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
  requireReviewDate(`${eventKey} future schedule`, scheduleChecks[eventKey]);
}
requireReviewDate('Gaming Console Eras', sports?.technologyReview?.consoleEras?.nextReview);

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
requireReviewDate('Sky calendar', sky?.updatePolicy?.nextReview);
for (let index = 0; index < skyEvents.length; index += 1) {
  if (!Number.isFinite(Date.parse(skyEvents[index].date))) errors.push('Sky event has an invalid date: ' + (skyEvents[index].id || index) + '.');
  if (index && Date.parse(skyEvents[index - 1].date) > Date.parse(skyEvents[index].date)) errors.push('Sky events are not sorted chronologically.');
}

const requiredCostMetrics = ['homePrice', 'rent', 'newCar', 'meal', 'movieTicket', 'income', 'disneyTicket', 'tuition', 'minimumWage', 'groceryBasket'];
if (Number(costs?.schemaVersion) < 1) errors.push('Cost-of-living schema is missing.');
for (const key of requiredCostMetrics) {
  const metric = costs?.metrics?.[key];
  if (!metric?.label || !metric?.source || (!metric?.series && !metric?.stepSeries)) errors.push(`Cost-of-living metric is incomplete: ${key}.`);
}
requireReviewDate('Cost-of-living dataset', costs?.nextReview);
const freshnessByCostMetric = { homePrice: 1, rent: 3, newCar: 1, meal: 1, movieTicket: 2, income: 3, disneyTicket: 2, tuition: 3, groceryBasket: 1 };
for (const [key, maxLag] of Object.entries(freshnessByCostMetric)) {
  const metric = costs?.metrics?.[key];
  const latest = latestSeriesYear(metric?.series);
  requireRecentYear(`Cost metric ${key}`, latest, maxLag);
}
if (Number(placeEconomy?.schemaVersion) < 1 || !placeEconomy?.places || !placeEconomy?.counties) errors.push('Place/economic dataset schema is incomplete.');
requireReviewDate('Place/economic dataset', placeEconomy?.nextReview);
if (Object.keys(placeEconomy?.places || {}).length < 25000) errors.push('Official place population dataset has unexpectedly few places.');
if (Object.keys(placeEconomy?.counties || {}).length < 3000) errors.push('Official county income dataset has unexpectedly few counties.');
requireRecentYear('Census place population', Number(placeEconomy?.populationLatestYear), 3);
requireRecentYear('BEA county income', Number(placeEconomy?.incomeLatestYear), 3);
if (!version?.contentHash || Number(version?.dataSchemaVersion) !== Number(data.schemaVersion)) errors.push('version.json does not match live-data.json.');
const releasePattern = new RegExp(`^${APP_RELEASE_MAJOR}\\.(?:\\d+\\.\\d+|local\\.\\d{8})$`);
if (!releasePattern.test(String(version?.releaseVersion || ''))) errors.push(`version.json has an invalid release version: ${version?.releaseVersion || 'missing'}.`);

if (errors.length) {
  console.error(errors.map(error => `- ${error}`).join('\n'));
  process.exit(1);
}
console.log('Validated release v' + version.releaseVersion + ': schema ' + data.schemaVersion + ', ' + requiredComponents.length + ' registered components, 12 horoscope signs, reference histories, future sports coverage, and ' + skyEvents.length + ' maintained sky events.');





