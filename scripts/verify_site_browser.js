const { chromium } = require('C:/Users/22314/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const path = require('path');
const os = require('os');

const BASE = process.env.SITE_URL || 'http://127.0.0.1:8765';
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const OUT = path.join(os.tmpdir(), 'opera-site-browser-verify');

function intersects(a, b) {
  return !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
}

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: EDGE });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const errors = [];
  const failedLocal = [];
  const audioResponses = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => {
    if (response.url().startsWith(BASE) && response.status() >= 400) failedLocal.push(`${response.status()} ${response.url()}`);
    if (/\.mp3(?:\?|$)/i.test(response.url())) audioResponses.push({ url: response.url(), status: response.status(), type: response.headers()['content-type'] || '' });
  });

  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  const home = await page.evaluate(() => {
    const pets = [...document.querySelectorAll('.home-pet')];
    const hero = document.querySelector('.hero-content').getBoundingClientRect();
    const visible = pets.filter(p => getComputedStyle(p).display !== 'none').map(p => p.getBoundingClientRect());
    const rect = r => ({ left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height });
    return { bodyText: document.body.innerText.length, petCount: pets.length, visibleCount: visible.length, hero: rect(hero), pets: visible.map(rect) };
  });
  if (home.petCount !== 4 || home.visibleCount !== 4 || home.bodyText < 500) throw new Error(`Desktop home failed: ${JSON.stringify(home)}`);
  if (home.pets.some(p => intersects(p, home.hero))) throw new Error(`Desktop pet overlaps hero content: ${JSON.stringify(home)}`);
  await page.screenshot({ path: path.join(OUT, 'home-desktop.png'), fullPage: false });

  await page.goto(`${BASE}/pages/live.html`, { waitUntil: 'networkidle' });
  const hub = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('.case-hub-card')];
    return { count: cards.length, tops: [...new Set(cards.map(c => Math.round(c.getBoundingClientRect().top)))] };
  });
  if (hub.count !== 4 || hub.tops.length !== 1) throw new Error(`Case hub desktop layout failed: ${JSON.stringify(hub)}`);
  await page.screenshot({ path: path.join(OUT, 'case-hub-desktop.png'), fullPage: true });

  await page.goto(`${BASE}/pages/cases/yuhua-jinhua.html`, { waitUntil: 'networkidle' });
  const article = await page.evaluate(() => ({ figures: document.querySelectorAll('.case-figure').length, title: document.querySelector('h1')?.textContent, width: document.documentElement.scrollWidth, viewport: innerWidth }));
  if (article.figures !== 11 || article.width > article.viewport) throw new Error(`Article failed: ${JSON.stringify(article)}`);
  await page.screenshot({ path: path.join(OUT, 'case-article.png'), fullPage: true });

  await page.goto(`${BASE}/pages/kids.html`, { waitUntil: 'networkidle' });
  const kids = await page.evaluate(() => ({ tracks: document.querySelectorAll('.audio-track-card').length, buttons: document.querySelectorAll('[data-global-audio]').length }));
  if (kids.tracks !== 4 || kids.buttons !== 4) throw new Error(`Kids audio failed: ${JSON.stringify(kids)}`);

  await page.goto(`${BASE}/pages/red-opera.html`, { waitUntil: 'networkidle' });
  const red = await page.evaluate(() => ({
    audio: document.querySelectorAll('[data-global-audio]').length,
    groups: document.querySelectorAll('.red-audio-group').length,
    width: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
  }));
  if (red.audio !== 14 || red.groups !== 4 || red.width > red.viewport) throw new Error(`Red audio failed: ${JSON.stringify(red)}`);
  const redSources = await page.evaluate(() => [...document.querySelectorAll('[data-global-audio]')].map(button => button.dataset.globalAudio));
  const redMediaChecks = [];
  for (const source of redSources) {
    const result = await page.evaluate(src => new Promise(resolve => {
      const probe = new Audio();
      const finish = (ok, detail) => {
        probe.removeAttribute('src');
        probe.load();
        resolve({ source: src, ok, detail });
      };
      const timer = setTimeout(() => finish(false, 'timeout'), 12000);
      probe.preload = 'metadata';
      probe.addEventListener('loadedmetadata', () => {
        clearTimeout(timer);
        finish(true, Number.isFinite(probe.duration) ? probe.duration : null);
      }, { once: true });
      probe.addEventListener('error', () => {
        clearTimeout(timer);
        finish(false, probe.error?.code || 'media-error');
      }, { once: true });
      probe.src = new URL(src, document.baseURI).href;
      probe.load();
    }), source);
    redMediaChecks.push(result);
  }
  const failedRedMedia = redMediaChecks.filter(item => !item.ok);
  if (failedRedMedia.length) throw new Error(`Red media decode failed: ${JSON.stringify(failedRedMedia)}`);
  await page.click('[data-global-audio]');
  await page.waitForFunction(() => {
    const audio = document.querySelector('#gpAudio');
    return audio && (audio.readyState >= 2 || audio.error);
  }, null, { timeout: 15000 }).catch(() => {});
  const redPlayback = await page.evaluate(() => {
    const audio = document.querySelector('#gpAudio');
    return {
      currentSrc: audio?.currentSrc || '',
      readyState: audio?.readyState,
      networkState: audio?.networkState,
      paused: audio?.paused,
      duration: Number.isFinite(audio?.duration) ? audio.duration : null,
      error: audio?.error ? { code: audio.error.code, message: audio.error.message } : null,
    };
  });
  if (redPlayback.error || redPlayback.readyState < 2) throw new Error(`Red audio playback failed: ${JSON.stringify({ redPlayback, audioResponses })}`);
  await page.screenshot({ path: path.join(OUT, 'red-opera-all-tracks.png'), fullPage: true });

  await page.goto(`${BASE}/pages/characters/sheng.html`, { waitUntil: 'networkidle' });
  const videos = await page.evaluate(() => document.querySelectorAll('.video-card').length);
  if (videos !== 4) throw new Error(`Video cards failed: ${videos}`);
  await page.click('.video-load');
  const frame = await page.getAttribute('.video-frame iframe', 'src');
  if (!frame || !frame.startsWith('https://')) throw new Error(`Video iframe failed: ${frame}`);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  const mobile = await page.evaluate(() => {
    const pets = [...document.querySelectorAll('.home-pet')];
    return { visible: pets.filter(p => getComputedStyle(p).display !== 'none').length, width: document.documentElement.scrollWidth, viewport: innerWidth };
  });
  if (mobile.visible !== 1 || mobile.width > mobile.viewport) throw new Error(`Mobile home failed: ${JSON.stringify(mobile)}`);
  await page.screenshot({ path: path.join(OUT, 'home-mobile.png'), fullPage: false });

  await page.goto(`${BASE}/pages/live.html`, { waitUntil: 'networkidle' });
  const mobileHub = await page.evaluate(() => ({ columns: getComputedStyle(document.querySelector('.case-hub-grid')).gridTemplateColumns, width: document.documentElement.scrollWidth, viewport: innerWidth }));
  if (mobileHub.width > mobileHub.viewport) throw new Error(`Mobile hub overflow: ${JSON.stringify(mobileHub)}`);

  await page.goto(`${BASE}/pages/red-opera.html`, { waitUntil: 'networkidle' });
  const mobileRed = await page.evaluate(() => ({
    audio: document.querySelectorAll('[data-global-audio]').length,
    columns: getComputedStyle(document.querySelector('.audio-catalog')).gridTemplateColumns,
    width: document.documentElement.scrollWidth,
    viewport: innerWidth,
  }));
  if (mobileRed.audio !== 14 || mobileRed.width > mobileRed.viewport) throw new Error(`Mobile red audio failed: ${JSON.stringify(mobileRed)}`);
  await page.screenshot({ path: path.join(OUT, 'red-opera-mobile.png'), fullPage: true });

  if (errors.length || failedLocal.length) throw new Error(`Browser errors=${JSON.stringify(errors)} localFailures=${JSON.stringify(failedLocal)}`);
  console.log(JSON.stringify({ ok: true, out: OUT, home, hub, article, kids, red, redMediaChecks, redPlayback, audioResponses, videos, mobile, mobileHub, mobileRed }, null, 2));
  await browser.close();
})().catch(async error => {
  console.error(error.stack || error.message);
  process.exit(1);
});
