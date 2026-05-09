import { chromium } from 'playwright';

async function run(url='http://localhost:3000'){
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'load' });
  const bg = await page.evaluate(() => {
    const body = document.querySelector('body');
    const root = document.querySelector('.calendar-container-scaling') || document.querySelector('.calendar') || document.body;
    function findFirstNonTransparent(el) {
      const stack = [el];
      while (stack.length) {
        const node = stack.shift();
        try {
          const cs = window.getComputedStyle(node);
          if (cs && cs.backgroundColor && cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent') {
            return { tag: node.tagName, class: node.className, bg: cs.backgroundColor, inline: node.getAttribute('style') };
          }
        } catch (e) {}
        stack.push(...Array.from(node.children));
      }
      return null;
    }
    return {
      bodyBg: window.getComputedStyle(body).backgroundColor,
      rootBg: window.getComputedStyle(root).backgroundColor,
      rootInline: root.getAttribute('style'),
      firstNonTransparent: findFirstNonTransparent(document.body)
    };
  });
  console.log('app background:', bg);
  await browser.close();
}

run(process.argv[2] || 'http://localhost:3000').catch(e=>{console.error(e);process.exit(1)});
