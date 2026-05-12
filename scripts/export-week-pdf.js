import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

async function exportPdf(targetUrl, shrink = 0.92) {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1200, height: 1600 } });
  const page = await context.newPage();

  // increase viewport to improve print/render quality
  try { await page.setViewportSize({ width: 1600, height: 2200 }); } catch (e) {}

  const isFile = !/^https?:\/\//.test(targetUrl);
  let url = targetUrl;
  if (isFile) url = 'file://' + path.resolve(process.cwd(), targetUrl);

  // Force 2-column layout for the main week grid
  await page.evaluate(() => {
    const mainCalendarContainer = document.querySelector('.calendar-container-scaling') || document.querySelector('.calendar');
    if (mainCalendarContainer) {
      mainCalendarContainer.style.gridTemplateColumns = 'repeat(2, minmax(0, 1fr)) !important';
      mainCalendarContainer.style.maxWidth = 'unset !important';
    }
  });
  
  // give app time to render week layout and then normalize some styles for crisp print
  await page.waitForTimeout(700); // Increased delay
  await page.addStyleTag({ content: `
    html, body { -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; }
    .calendar-container-scaling, .calendar { transform: none !important; }
    * { image-rendering: -webkit-optimize-contrast; }
    /* Ensure any potentially conflicting grid classes are overridden */
    .grid[class*="grid-cols-"] {
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      max-width: unset !important;
    }
  `});

  // Adjust grid columns for elements that use 3-column layout to avoid overflow in the last column
  try {
    const changed = await page.evaluate(() => {
      const nodes = Array.from(document.querySelectorAll('.grid[class*="grid-cols-"]'));
      let modified = 0;
      nodes.forEach(n => {
        try {
          const el = n;
          
          // Force 2-column layout for the main week grid
          if (el.classList.contains('w-full')) {
             el.style.display = 'grid';
             el.style.gridTemplateColumns = 'repeat(2, minmax(0, 1fr)) !important';
             el.style.maxWidth = 'unset !important';
          }

          const children = Array.from(el.children).filter(c => c.offsetParent !== null);
          if (children.length < 3) return;
          const last = children[children.length - 1];
          
          el.style.lineHeight = '1.2';
          el.style.alignItems = 'start';
          el.style.height = 'auto';
          const gap = 4;
          const containerWidth = el.clientWidth || el.getBoundingClientRect().width;
          
          // Shrink last column to give space to the rest of the grid
          const lastScroll = last.scrollWidth;
          const desiredLast = Math.min(lastScroll + 4, Math.floor(containerWidth * 0.75)); // Increased max share for last column
          const remaining = Math.max(containerWidth - desiredLast - gap*2, 50); // Reduced min remaining width
          const firstWidth = Math.max(30, Math.floor(remaining * 0.3)); // Reduced min width for first
          const secondWidth = Math.max(20, remaining - firstWidth); // Reduced min width for second
          
          el.style.gridTemplateColumns = `${firstWidth}px ${secondWidth}px ${desiredLast}px`;
          el.style.gap = `${gap}px`;

          // If still overflows, shrink font size of the last column content
          let fs = 100;
          while (last.scrollWidth > (desiredLast + 2) && fs > 50) { // Lowered min font size
            fs -= 5;
            last.style.fontSize = `${fs}%`;
          }

          // Final check: if after all adjustments, content still overflows vertically, try to adjust line-height for this event
          if (el.scrollHeight > el.clientHeight) {
            let currentLineHeight = parseFloat(el.style.lineHeight) || 1.2;
            while (el.scrollHeight > el.clientHeight && currentLineHeight > 0.9) {
              currentLineHeight -= 0.05;
              el.style.lineHeight = `${currentLineHeight}`;
            }
          }

          modified++;
        } catch (e) {}
      });
      return modified;
    });
    if (changed) console.log('Adjusted', changed, '3-column grids for export');
  } catch (e) { console.warn('Grid adjust failed', e); }

  // Wait for calendar container
  const containerSelector = '.calendar-container-scaling, .calendar, #root, main';
  let container = null;
  for (const sel of containerSelector.split(',')) {
    const s = sel.trim();
    try {
      if (await page.$(s)) { container = s; break; }
    } catch(e){}
  }

  if (!container) container = 'body';

  // Read app background color to preserve it in print
  let appBg = await page.evaluate(() => {
    try {
      const root = document.querySelector('body > div');
      if (root) {
        const cs = window.getComputedStyle(root);
        return cs.backgroundColor || null;
      }
    } catch (e) {}
    return null;
  });
  if (!appBg) appBg = 'transparent';

  // Inject proportional print styles (shrink controls font-size percent)
  const fontPercent = Math.round(shrink * 100);
  await page.addStyleTag({ content: `
    @page { size: A4 portrait; margin: 6mm; }
    html, body { width: 210mm; height: 297mm; }
    * { box-sizing: border-box; }
    @media print {
      body { -webkit-print-color-adjust: exact; color-adjust: exact; }
    }
    /* Preserve app background */
    body, html, .calendar-container-scaling { background: ${appBg} !important; }
    /* Print-specific compacting rules to keep all events on one A4 portrait page */
    .calendar-container-scaling, .calendar, #root, main {
      width: 210mm !important;
      max-width: 210mm !important;
      margin: 0 auto !important;
    }
    /* proportional text shrink */
    .calendar-container-scaling, .calendar, html, body { font-size: ${fontPercent}% !important; line-height: 1.05 !important; }
    /* moderate padding/margin reduction for higher density */
    .calendar-container-scaling * , .calendar * { margin:0 !important; padding:2px !important; }
    /* reduce card heights and spacings a bit */
    .grid, .card, .event, .card-content, .card-body, .day-card { padding:3px 5px !important; }
    /* compact headers and badges */
    .header, .badge, .tag, .chip { font-size: 0.82em !important; padding:2px 4px !important; }
    .calendar { overflow: visible !important; }
    img, svg { max-width: 100% !important; height: auto !important; }

    /* Hide floating/side UI that overlaps in print (mini calendar, sticky sidebars, admin overlays) */
    .sticky, .fixed, .top-4.z-20, .absolute.scale-50, .absolute.top-0.left-0, .absolute.top-0.right-0, [class*="mini"], .miniCalendar { display: none !important; }
    /* Also hide elements specifically used for preacher table/scaling */
    .absolute[style*="scale-50"], .w-[200%], .h-[200%] { display: none !important; }

    /* Ensure event block and day background colors (including inline styles) are printed */
    .calendar .event, .calendar .card, .calendar .day-card, .calendar-container-scaling .card { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    /* For elements that use inline background-color (e.g. day wrappers using WEEKDAY_COLORS), ensure print preserves them */
    .calendar-container-scaling [style*="background"], .calendar [style*="background"], [style*="background-color"] { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; background-clip: border-box !important; }
  `});

  // Compute scale to fit container into printable A4 area (width and height)
  const printableWidthPx = 794; // A4 width at 96dpi
  const printableHeightPx = 1122; // A4 height at 96dpi
  // Instead of applying transforms or embedding a screenshot, inject compact print CSS
  // that only reduces fonts, paddings and spacing so the whole week fits on one A4 portrait.
  await page.addStyleTag({ content: `
    @media print {
      html, body { width:210mm; height:297mm; }
      .calendar-container-scaling, .calendar, #root, main { width:210mm !important; max-width:210mm !important; }
      /* Force 2 columns for week view in print */
      .grid[class*="grid-cols-"] {
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      }
      /* aggressive but proportional font reduction */
      html, body, .calendar-container-scaling, .calendar { font-size: 10px !important; }
      /* reduce most padding/margins inside cards */
      .calendar-container-scaling * , .calendar * { margin:0 !important; padding:1px !important; line-height:1.2 !important; }
      /* reduce card heights and spacings */
      .grid, .card, .event, .card-content, .card-body, .day-card { padding:2px 3px !important; margin-bottom: 2px !important; height: auto !important; min-height: 0 !important; }
      /* compact headers and badges */
      .header, .badge, .tag, .chip { font-size: 8px !important; padding:1px 3px !important; }
      .calendar { overflow: visible !important; }
      img, svg { max-width: 100% !important; height: auto !important; }
    }
  `});

  // Wait a bit for styles to apply and for events to be present
  await page.waitForTimeout(1200);

  // Inject computed background-color for visible day/event blocks to guarantee print preserves fills
  try {
    await page.evaluate(() => {
      function isVisible(el) {
        const rect = el.getBoundingClientRect();
        return rect.width > 20 && rect.height > 10 && getComputedStyle(el).visibility !== 'hidden' && getComputedStyle(el).display !== 'none';
      }

      const container = document.querySelector('.calendar-container-scaling') || document.querySelector('.calendar') || document.querySelector('main') || document.body;
      const candidates = Array.from(container.querySelectorAll('*'));
      let applied = 0;
      candidates.forEach(el => {
        try {
          if (!isVisible(el)) return;
          const cs = window.getComputedStyle(el);
          const bg = cs.backgroundColor;
          // Skip fully transparent backgrounds
          if (!bg || bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') return;
          // Only set when computed background is non-default (avoid body/root)
          if (bg && bg !== 'rgb(255, 255, 255)' && bg !== 'rgba(255, 255, 255, 0)' ) {
            // Apply computed background as inline style to ensure printBackground preserves it
            el.style.setProperty('background-color', bg, 'important');
            el.style.setProperty('-webkit-print-color-adjust', 'exact', 'important');
            el.style.setProperty('print-color-adjust', 'exact', 'important');
            applied++;
          }
        } catch (e) {}
      });
      return applied;
    }).then(count => console.log('Applied inline backgrounds to', count, 'elements'));
  } catch (e) {
    console.warn('Failed to inject computed backgrounds', e);
  }

  const outDir = path.join(process.cwd(), 'exports');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'week-calendar-A4.pdf');

  await page.emulateMedia({ media: 'print' });
  await page.pdf({ path: outPath, format: 'A4', printBackground: true });

  await browser.close();
  console.log('Saved PDF to', outPath);
}

const argvUrl = process.argv[2] || 'http://localhost:3000';
// Optional shrink factor: pass as third argument, e.g. `node scripts/export-week-pdf.js http://localhost:3000 0.92`
const shrinkArg = parseFloat(process.argv[3]);
const SHRINK = (typeof shrinkArg === 'number' && !isNaN(shrinkArg)) ? shrinkArg : 0.92;

exportPdf(argvUrl, SHRINK).catch(err => { console.error(err); process.exit(1); });
