const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');

const root = path.join(__dirname, '..');
const output = process.env.V16_SCREENSHOTS;
const base = process.env.V16_BASELINE || '819c454';
const originPath = '/golf-caddie/';
const mime = { '.css': 'text/css', '.js': 'application/javascript', '.json': 'application/json', '.png': 'image/png' };
const baselineFiles = new Map();
const pairs = new Map();
let baseline = false;

const server = http.createServer((request, response) => {
  const filename = decodeURIComponent(new URL(request.url, 'http://localhost').pathname)
    .slice(originPath.length) || 'index.html';
  if (!/^[\w./-]+$/.test(filename) || filename.split('/').includes('..')) {
    response.writeHead(404).end();
    return;
  }
  try {
    if (baseline && !baselineFiles.has(filename)) {
      baselineFiles.set(filename, execFileSync('git', ['show', base + ':' + filename], { cwd: root }));
    }
    const body = baseline ? baselineFiles.get(filename) : fs.readFileSync(path.join(root, filename));
    response.writeHead(200, { 'Content-Type': mime[path.extname(filename)] || 'text/html', 'Cache-Control': 'no-store' }).end(body);
  } catch {
    response.writeHead(404).end();
  }
});

async function capture(page, name) {
  if (!output) return;
  if (!pairs.has(name)) pairs.set(name, []);
  pairs.get(name).push((await page.screenshot({ animations: 'disabled' })).toString('base64'));
}

async function navigate(page, selector) {
  await page.locator(selector).click();
  await page.locator('.content').evaluate(el => { el.scrollTop = 0; });
}

async function assertDock(page) {
  for (const viewport of [
    { width: 320, height: 568 }, { width: 375, height: 667 },
    { width: 390, height: 844 }, { width: 430, height: 932 },
    { width: 844, height: 390 }
  ]) {
    await page.setViewportSize(viewport);
    await page.waitForFunction(height =>
      Math.abs(document.querySelector('.app-footer').getBoundingClientRect().bottom - height) <= 1,
    viewport.height);
    await page.locator('.content').evaluate(el => { el.scrollTop = 0; });
    const score = await page.locator('#record-score').boundingBox();
    const tabs = await page.locator('.app-tabs').boundingBox();
    const footer = await page.locator('.app-footer').boundingBox();
    assert.ok(score.height >= 44 && score.width >= 44);
    assert.ok(Math.abs((score.y + score.height / 2) - (tabs.y + tabs.height / 2)) <= 1);
    assert.ok(score.x >= tabs.x + tabs.width);
    assert.ok(Math.abs(footer.y + footer.height - viewport.height) <= 1);
    assert.ok(footer.height <= 58);
    assert.ok(await page.locator('[data-tab]').evaluateAll(tabs => tabs.every(tab => tab.offsetHeight >= 44)));
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.locator('#record-score').click();
    await page.locator('#score-done').click();
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForFunction(() => document.querySelector('.app-footer').getBoundingClientRect().bottom === 844);
}

async function assertStandaloneFooter(page) {
  const edges = await page.evaluate(() => {
    const viewport = window.visualViewport;
    const bottom = () => document.querySelector('.app-footer').getBoundingClientRect().bottom;
    const simulate = (height, offsetTop, scale) => {
      Object.defineProperties(viewport, {
        height: { value: height, configurable: true },
        offsetTop: { value: offsetTop, configurable: true },
        scale: { value: scale, configurable: true }
      });
      viewport.dispatchEvent(new Event('resize'));
      return bottom();
    };
    try {
      const shorter = simulate(innerHeight - 64, 4, 1);
      const taller = simulate(innerHeight + 48, 0, 1);
      const zoomed = simulate(innerHeight / 2, 0, 2);
      const standalone = document.documentElement.classList.contains('standalone');
      return { shorter, taller, zoomed, layout: innerHeight, standalone };
    } finally {
      for (const property of ['height', 'offsetTop', 'scale']) delete viewport[property];
      viewport.dispatchEvent(new Event('resize'));
    }
  });
  assert.equal(edges.standalone, true);
  assert.equal(edges.shorter, edges.layout);
  assert.equal(edges.taller, edges.layout);
  assert.equal(edges.zoomed, edges.layout);
}

async function assertTouchNavigation(context, page) {
  const session = await context.newCDPSession(page);
  const box = await page.locator('.recommendation').boundingBox();
  const y = Math.round(box.y + box.height / 2);
  const left = Math.round(box.x + 34);
  const right = Math.round(box.x + box.width - 34);
  async function drag(from, to) {
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: from, y }] });
    for (let step = 1; step <= 5; step++) {
      const x = Math.round(from + (to - from) * step / 5);
      await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] });
    }
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  }
  try {
    await drag(right, left);
    await page.locator('#jump').filter({ hasText: 'Hole 2' }).waitFor({ timeout: 4000 });
    await drag(left, right);
    await page.locator('#jump').filter({ hasText: 'Hole 1' }).waitFor({ timeout: 4000 });
  } finally {
    await session.detach();
  }
}

async function assertSwipeMotion(page) {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  try {
    for (const [distance, expected, elapsed] of [[-30, 'Hole 1', 300], [-50, 'Hole 2', 25], [-125, 'Hole 2', 300]]) {
      const surface = page.locator('.hole-stage > .content').first();
      await surface.evaluate((el, { distance, elapsed }) => {
        const touch = x => new Touch({ identifier: 1, target: el, clientX: x, clientY: 250 });
        for (const [type, x, timeStamp] of [['touchstart', 200, 100], ['touchmove', 200 + distance, 100 + elapsed]]) {
          const event = new TouchEvent(type, { bubbles: true, touches: [touch(x)] });
          Object.defineProperty(event, 'timeStamp', { value: timeStamp });
          el.dispatchEvent(event);
        }
      }, { distance, elapsed });
      assert.equal(await surface.evaluate(el => new DOMMatrixReadOnly(getComputedStyle(el).transform).m41), distance);
      const preview = page.locator('.hole-preview');
      assert.equal(await preview.getAttribute('aria-hidden'), 'true');
      assert.equal(await preview.locator('h1').innerText(), 'Hole 2');
      assert.equal(await page.locator('#jump').count(), 1);
      await surface.evaluate((el, { distance, elapsed }) => {
        const end = new Touch({ identifier: 1, target: el, clientX: 200 + distance, clientY: 250 });
        const event = new TouchEvent('touchend', { bubbles: true, changedTouches: [end] });
        Object.defineProperty(event, 'timeStamp', { value: 105 + elapsed });
        el.dispatchEvent(event);
      }, { distance, elapsed });
      await page.locator('.swipe-active').waitFor({ state: 'detached' });
      assert.equal(await page.locator('#jump').innerText(), expected);
      if (expected === 'Hole 2') await page.locator('#jump').press('ArrowLeft');
    }
  } finally {
    await page.emulateMedia({ reducedMotion: 'reduce' });
  }
}

async function exercise(browser, url) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
    reducedMotion: 'reduce', serviceWorkers: baseline ? 'block' : 'allow' });
  if (!baseline) await context.addInitScript(() => Object.defineProperty(navigator, 'standalone', { value: true }));
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto(url);
    await page.locator('[data-course="long-run"]').waitFor();
    await capture(page, 'course-library');
    await page.locator('[data-course="long-run"]').click();
    await page.locator('[data-tee="blue"]').click();
    await page.locator('#start-round').click();
    await capture(page, 'course-overview');
    await navigate(page, '#to-game');
    await capture(page, 'game-plan');
    await navigate(page, '#to-hole');
    await capture(page, 'current-hole');
    if (!baseline) {
      assert.equal(await page.locator('h1').innerText(), 'Hole 1');
      assert.match(await page.locator('.active-context').innerText(), /Long Run.*Blue/);
      assert.ok(await page.locator('.target-value').isVisible());
      const current = page.locator('.tab-track button[aria-current]');
      assert.equal(await current.innerText(), 'Play');
      assert.notEqual(await current.evaluate(el => getComputedStyle(el).backgroundColor), 'rgba(0, 0, 0, 0)');
      const ask = await page.locator('#ask-caddie').boundingBox();
      const score = await page.locator('#record-score').boundingBox();
      assert.ok(ask.y + ask.height < score.y);
      await assertDock(page);
      await assertStandaloneFooter(page);
      await assertTouchNavigation(context, page);
      await assertSwipeMotion(page);
    }
    await page.locator('#expand-layout').click();
    await capture(page, 'hole-diagram');
    await page.keyboard.press('Escape');
    await page.locator('#ask-caddie').click();
    await capture(page, 'ask-caddie');
    await page.keyboard.press('Escape');
    if (!baseline) assert.equal(await page.locator('#ask-caddie').evaluate(el => document.activeElement === el), true);
    await page.locator('#record-score').click();
    await page.locator('[data-field="score"][data-value="5"]').click();
    await capture(page, 'score-entry');
    await page.locator('#score-done').click();
    if (!baseline) {
      assert.equal(await page.locator('h1').innerText(), 'Hole 2');
      assert.equal(await page.locator('.content').evaluate(el => el.scrollTop), 0);
      await page.locator('#record-score').click();
      await page.locator('#score-done').click();
      assert.equal(await page.locator('h1').innerText(), 'Hole 2');
    }
    await navigate(page, '[data-tab="home"]');
    await capture(page, 'home');
    await navigate(page, '[data-tab="play"]');
    if (!baseline) {
      await page.evaluate(async () => {
        await navigator.serviceWorker.ready;
        if (!navigator.serviceWorker.controller) {
          await new Promise(resolve => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }));
        }
      });
      await context.setOffline(true);
      await page.reload();
      await page.locator('#resume-round').click();
      assert.equal(await page.locator('h1').innerText(), 'Hole 2');
      await page.locator('#jump').press('ArrowLeft');
      assert.equal(await page.locator('#record-score').innerText(), 'Score 5 · Edit');
      await page.locator('#record-score').click();
      await page.locator('#score-done').click();
      assert.equal(await page.locator('h1').innerText(), 'Hole 2');
      assert.ok(await page.locator('.hole-layout svg').isVisible());
      assert.equal(await page.locator('.play-header progress').getAttribute('value'), '1');
    }
    await navigate(page, '#open-summary');
    await capture(page, 'round-summary');
    page.once('dialog', dialog => dialog.accept());
    await page.locator('#complete-round').click();
    await navigate(page, '[data-tab="rounds"]');
    assert.match(await page.locator('.round-badge').innerText(), /partial/i);
    await capture(page, 'round-history');
    if (!baseline) {
      await navigate(page, '[data-tab="home"]');
      await page.locator('[data-course="long-run"]').click();
      await page.locator('[data-tee="blue"]').click();
      await page.locator('#start-round').click();
      await navigate(page, '#to-game');
      await navigate(page, '#to-hole');
      await page.locator('#jump').click();
      await page.locator('[data-view-hole="18"]').click();
      await page.locator('#record-score').click();
      await page.locator('[data-field="score"]').first().click();
      await page.locator('#score-done').click();
      assert.equal(await page.locator('h1').innerText(), 'Hole 18');
      assert.match(await page.locator('#record-score').innerText(), /^Score /);
    }
    assert.deepEqual(errors, []);
  } finally {
    await context.close();
  }
}

async function writeComparisons(browser) {
  fs.mkdirSync(output, { recursive: true });
  const page = await browser.newPage({ viewport: { width: 830, height: 930 } });
  try {
    for (const [name, screenshots] of pairs) {
      await page.setContent(`<style>
        body { margin:16px; color:#202522; background:#eee9df; font:16px system-ui }
        h1 { margin:0 0 8px; font-size:20px; text-transform:capitalize }
        main { display:grid; grid-template-columns:390px 390px; gap:16px }
        figure { margin:0 } figcaption { margin-bottom:6px; font-weight:600 }
        img { display:block; width:390px; height:844px }
      </style><h1>${name.replaceAll('-', ' ')}</h1><main>${screenshots.map((image, index) =>
        `<figure><figcaption>${index === 0 ? 'Before · main' : 'After · V1.6'}</figcaption><img src="data:image/png;base64,${image}"></figure>`).join('')}</main>`);
      await page.screenshot({ path: path.join(output, name + '.png') });
    }
  } finally {
    await page.close();
  }
}

async function run() {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ channel: 'msedge' });
  try {
    const url = 'http://127.0.0.1:' + server.address().port + originPath;
    if (output) {
      baseline = true;
      await exercise(browser, url);
      baseline = false;
    }
    await exercise(browser, url);
    if (output) await writeComparisons(browser);
    console.log('Compact standalone footer, viewport and zoom stability, score entry, offline reload, and partial history passed.');
  } finally {
    await browser.close();
  }
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => server.close());
