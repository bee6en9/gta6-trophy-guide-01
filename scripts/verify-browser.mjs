import assert from 'node:assert/strict';
import { readFileSync, statSync, readdirSync } from 'node:fs';
import { chromium } from '../.tools/node_modules/playwright/index.mjs';
import { trophyData } from '../app/data/trophies.js';

const data = JSON.parse(readFileSync('app/data/trophies.json', 'utf8'));
assert.deepEqual(trophyData, data, 'Static module must mirror the JSON exactly');
const expectedNames = [
  'Vice Got a Price!', 'Just Like Paradise', 'Paradise Lost', 'T**s Ass Drug Money',
  'Vice City, Baby!', 'Top Of The World, Ma', 'You Gotta Know When to Get Off', 'Trust',
  'Break the Bank', 'Family Matters', 'DWNFALL', 'Hi-Jacked', 'Snow Storm', 'A Long Road',
  'Cunning Stunts', 'Master of None', 'The Shootist', 'Top Fun', 'Earn Cash, Not Kudos',
  'Baited My Tackle', 'Stick Fiddler', 'Road to Rehabilitation', 'This Was No Boat Accident',
  'The Lone Rider', 'Strangers & Freaks', 'Supply & Demand', 'Spin On This!',
  'Positive Mental Attitude', 'Fair Game', "Don't Touch My Deck", 'You WAiNKer!',
  'One Last Thing', 'Hot Together', 'Retail Therapy', 'Whip It Good', 'Gunslinger',
  'Catch Me If You Can', 'Challenging Tank', 'Sneakthief', 'Maximum Withdrawal',
  'A Classic Blitz Play', 'The Goodtime State', 'Pest Control', 'In The Beginning…',
  'Capital Offense', 'Let’s Go Bowling', 'Personal Best', 'Actions Speak Louder',
  'Bad Luck, I Guess', 'The Truth Is Out There', 'Ten Pin', 'Dime on the Dollar',
  'Treat Yo Self', 'Little Boxes', 'On the Spot'
];
assert.deepEqual(data.trophies.map(t => t.name), expectedNames);
assert.equal(data.trophies.filter(t => t.hidden).length, 28);
assert.deepEqual(['platinum','gold','silver','bronze'].map(grade => data.trophies.filter(t => t.grade === grade).length), [1,2,6,46]);
for (const t of data.trophies) {
  assert.ok(t.guide.trim() && t.description.trim());
  assert.ok(t.sources.length && t.sources.every(s => s.name.trim() && s.url.trim()));
  assert.equal(t.sources[0].url, 'data/trophies.json#trophy-' + t.id);
  assert.ok(['story','missable','collectibles','activities','online'].includes(t.kind));
  assert.ok(t.stage >= 1 && t.stage <= 5);
  assert.equal(t.missable, false);
}
assert.equal(data.trophies[0].guide, 'Earn the other 54 trophies.');

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, acceptDownloads: true });
const page = await context.newPage();
const errors = [];
const external = [];
const failures = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
page.on('request', request => { if (!request.url().startsWith('http://localhost:8080/') && !request.url().startsWith('data:')) external.push(request.url()); });
page.on('response', response => { if (response.status() >= 400) failures.push(response.url() + ' ' + response.status()); });
await page.goto('http://localhost:8080/', { waitUntil: 'networkidle' });
assert.equal(await page.locator('.trophy-row').count(), 55);
await page.locator('#trophy-2 .earned-box').check();
await page.reload({ waitUntil: 'networkidle' });
assert.equal(await page.locator('#trophy-2 .earned-box').isChecked(), true);
assert.equal(await page.locator('#earned-count').innerText(), '1/55');
await page.locator('[data-kind=missable]').click();
assert.match(await page.locator('.empty-state').innerText(), /No confirmed permanent missables/);
await page.locator('[data-kind=all]').click();
await page.locator('#spoilers').check();
assert.equal(await page.locator('#trophy-3 h3').innerText(), 'Hidden trophy — earn it to reveal');
assert.equal(await page.locator('#trophy-2 h3').innerText(), 'Just Like Paradise');
await page.locator('#trophy-3 .trophy-open').click();
assert.doesNotMatch(await page.locator('#guide').innerText(), /Paradise Lost|Complete Chapter 1/);
await page.locator('#search').fill('Paradise Lost');
assert.equal(await page.locator('.trophy-row').count(), 0, 'Search must not leak concealed titles');
await page.locator('#search').fill('');
await page.reload({ waitUntil: 'networkidle' });
assert.equal(await page.locator('#spoilers').isChecked(), true);
const downloadEvent = page.waitForEvent('download');
await page.locator('#export').click();
const download = await downloadEvent;
const stream = await download.createReadStream();
const chunks = [];
for await (const chunk of stream) chunks.push(chunk);
const exported = Buffer.concat(chunks);
assert.deepEqual(JSON.parse(exported.toString()).earned, [2]);
await page.locator('#trophy-2 .earned-box').uncheck();
await page.locator('#import').setInputFiles({ name: 'leonida-progress.json', mimeType: 'application/json', buffer: exported });
await page.waitForFunction(() => document.getElementById('earned-count').textContent === '1/55');
await page.reload({ waitUntil: 'networkidle' });
assert.equal(await page.locator('#trophy-2 .earned-box').isChecked(), true);
await page.locator('#import').setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{"earned":[999]}') });
await page.waitForFunction(() => document.getElementById('notice').textContent.startsWith('Import failed'));
assert.equal(await page.locator('#earned-count').innerText(), '1/55');
await page.locator('#spoilers').uncheck();
await page.locator('#grade').selectOption('silver');
assert.equal(await page.locator('.trophy-row').count(), 6);
await page.locator('#grade').selectOption('all');
await page.locator('#hide-earned').check();
assert.equal(await page.locator('.trophy-row').count(), 54);
await page.locator('#hide-earned').uncheck();
await page.locator('#roadmap-toggle').click();
assert.equal(await page.locator('.plan-card').count(), 5);
await page.locator('.step').nth(3).click();
assert.equal(await page.locator('.trophy-row').count(), data.trophies.filter(t => t.stage === 4).length);
await page.locator('[data-kind=online]').click();
assert.match(await page.locator('.empty-state').innerText(), /No online trophies/);

const shots = JSON.parse(readFileSync('shots.json', 'utf8'));
for (const shot of shots) {
  await page.setViewportSize(shot.viewport);
  await page.goto('http://localhost:8080' + shot.path, { waitUntil: 'networkidle' });
  assert.ok((await page.locator('#guide').innerText()).length > 100);
  if (shot.path.includes('cover')) {
    assert.equal(await page.locator('#earned-count').innerText(), '14/55');
    assert.equal(await page.locator('.guide-sources a').count(), 1);
  }
  if (shot.path.includes('roadmap')) assert.equal(await page.locator('#roadmap-plan').isVisible(), true);
  if (shot.path.includes('detail')) {
    assert.equal(await page.locator('#spoilers').isChecked(), true);
    assert.equal(await page.locator('#trophy-7 h3').innerText(), 'Hidden trophy — earn it to reveal');
  }
  await page.screenshot({ path: 'screenshots/' + shot.file, type: 'jpeg', quality: 85, fullPage: false });
  assert.ok(statSync('screenshots/' + shot.file).size <= 262144);
  console.log('Captured', shot.file, '1280×800', statSync('screenshots/' + shot.file).size, 'bytes');
}
assert.equal(readdirSync('screenshots').filter(name => /\.jpg$/.test(name)).length, 3);
await page.goto('http://localhost:8080/?shot=filters', { waitUntil: 'networkidle' });
assert.match(await page.locator('.empty-state').innerText(), /No confirmed permanent missables/);
await page.goto('http://localhost:8080/', { waitUntil: 'networkidle' });
assert.equal(await page.locator('#earned-count').innerText(), '1/55', 'Screenshot state must not overwrite personal progress');
await context.route('**/*', async route => {
  const url = route.request().url();
  if (!url.startsWith('http://localhost:8080/')) return route.abort();
  return route.continue();
});
await page.reload({ waitUntil: 'networkidle' });
assert.equal(await page.locator('.trophy-row').count(), 55);
await page.setViewportSize({ width: 390, height: 844 });
assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Mobile layout must not overflow');
assert.deepEqual(errors, [], 'Browser console and page errors');
assert.deepEqual(external, [], 'No requests outside the app');
assert.deepEqual(failures, [], 'No failed local asset requests');
console.log('PASS: data mirror, 55 exact names, grades, 28 flags, sources, persistence, filters, spoilers, export/import, invalid import, roadmap, isolated presets, mobile layout.');
console.log('PASS: zero console errors; zero external requests; all local assets loaded successfully.');
await browser.close();
