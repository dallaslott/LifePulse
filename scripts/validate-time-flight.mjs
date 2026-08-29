import { readFileSync, statSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const controller = readFileSync(resolve(root, 'time-flight.js'), 'utf8');
const index = readFileSync(resolve(root, 'index.html'), 'utf8');
const serviceWorker = readFileSync(resolve(root, 'sw.js'), 'utf8');
const errors = [];
const assert = (condition, message) => { if (!condition) errors.push(message); };

const events = controller.split(/\r?\n/).filter(line => line.includes("{ date:'")).map(line => ({
  date: line.match(/date:'([^']+)'/)?.[1],
  image: line.match(/image:'([^']+)'/)?.[1],
  source: line.match(/source:'([^']+)'/)?.[1]
}));

assert(events.length >= 70, `Expected at least 70 curated events; found ${events.length}.`);
assert(events.every(event => /^\d{4}-\d{2}-\d{2}$/.test(event.date || '')), 'Every event must use a complete ISO date.');
assert(events.every(event => /^https:\/\//.test(event.source || '')), 'Every event must include an HTTPS credit source.');

let maximumGap = 0;
for (let index = 1; index < events.length; index += 1) {
  const previous = Date.parse(`${events[index - 1].date}T12:00:00Z`);
  const current = Date.parse(`${events[index].date}T12:00:00Z`);
  assert(current > previous, `Timeline order fails at ${events[index].date}.`);
  maximumGap = Math.max(maximumGap, (current - previous) / (365.2425 * 86400000));
}
assert(maximumGap <= 4.25, `Maximum timeline gap is ${maximumGap.toFixed(2)} years.`);

const uniqueImages = [...new Set(events.map(event => event.image).filter(Boolean))];
for (const image of uniqueImages) {
  const file = resolve(root, 'assets', 'time-flight', image);
  assert(existsSync(file), `Missing local image: ${image}`);
  if (existsSync(file)) assert(statSync(file).size > 10000, `Image appears incomplete: ${image}`);
  assert(serviceWorker.includes(`./assets/time-flight/${image}`), `Service worker does not cache: ${image}`);
}

const requiredIds = [
  'time-flight-overlay', 'time-flight-launch-btn', 'time-flight-image', 'time-flight-loader',
  'time-flight-quick', 'time-flight-full', 'time-flight-history', 'time-flight-resume', 'time-flight-replay',
  'time-flight-on-this-date', 'time-flight-finish', 'time-flight-pause', 'time-flight-credits-list',
  'time-flight-navigation', 'time-flight-year-scrubber', 'time-flight-decade-labels'
];
for (const id of requiredIds) assert(index.includes(`id="${id}"`), `Missing interface control: ${id}`);

if (errors.length) {
  console.error(`Time Flight validation failed:\n- ${errors.join('\n- ')}`);
  process.exit(1);
}

console.log(`Time Flight verified: ${events.length} events, ${uniqueImages.length} local images, maximum gap ${maximumGap.toFixed(2)} years.`);
