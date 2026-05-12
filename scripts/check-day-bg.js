import { chromium } from 'playwright';
import path from 'path';

async function check(targetUrl) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const isFile = !/^https?:\/\//.test(targetUrl);
  const url = isFile ? 'file://' + path.resolve(process.cwd(), targetUrl) : targetUrl;
  await page.goto(url, { waitUntil: 'load', timeout: 60000 });
  try {
    // Try to click Week view
    const weekBtn = page.locator('text=Тиждень');
    if (await weekBtn.count() > 0) await weekBtn.first().click();
  } catch (e) {}

  const selector = '.calendar-container-scaling, .calendar, body';
  const container = await page.$('.calendar-container-scaling') || await page.$('.calendar') || await page.$('body');
  const results = await page.evaluate((sel) => {
    const root = document.querySelector(sel.split(',')[0].trim()) || document.body;
    const els = Array.from(root.querySelectorAll('*'));
    const withBg = els
      .map((el, i) => ({ tag: el.tagName.toLowerCase(), bgInline: el.getAttribute('style') || '', computedBg: window.getComputedStyle(el).backgroundColor, class: el.className }))
      .filter(x => (x.bgInline && x.bgInline.toLowerCase().includes('background')) || (x.computedBg && x.computedBg !== '' && x.computedBg !== 'rgba(0, 0, 0, 0)' && x.computedBg !== 'transparent'))
    return withBg.slice(0,200);
  }, selector);

  console.log('Found', results.length, 'elements with background (sample up to 200):');
  results.forEach((r, idx) => {
    console.log(`#${idx+1}`, r.tag, 'class=' + (r.class || '—'), 'computedBg=' + r.computedBg, 'inlineStyle=' + (r.bgInline || '—'));
  });

  await page.screenshot({ path: path.join(process.cwd(), 'exports', 'check-bg-snapshot.png'), fullPage: true });
  console.log('Saved fullpage snapshot to exports/check-bg-snapshot.png');
  await browser.close();
}

const url = process.argv[2] || 'http://localhost:3000';
check(url).catch(e => { console.error(e); process.exit(1); });
