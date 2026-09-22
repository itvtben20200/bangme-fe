const { chromium } = require('@playwright/test');
(async () => {
  const targetUrl = 'https://dev.azure.com/ITVT/ITVT%20Sound%20Fans/_workitems/edit/60622';
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0] || await browser.newContext();
  let page = context.pages().find(p => /dev\.azure\.com\/ITVT/i.test(p.url()) && /60622|workitems\/edit/i.test(p.url())) || context.pages()[0] || await context.newPage();
  if (!/dev\.azure\.com\/ITVT/i.test(page.url()) || !/60622/.test(page.url())) {
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  } else {
    await page.bringToFront();
  }
  try { await page.waitForLoadState('networkidle', { timeout: 15000 }); } catch {}
  await page.waitForTimeout(1500);

  const result = await page.evaluate(() => {
    const kw = /(State|Discussion|Add comment|Save)/i;
    const structural = 'textarea,[contenteditable="true"],[contenteditable=""],[role="combobox"],input,button,[aria-label],[title],[placeholder]';
    const norm = s => String(s || '').replace(/\s+/g, ' ').trim();
    const clip = (s, n) => { s = norm(s); return s.length > n ? s.slice(0, n - 1) + '…' : s; };
    const get = (el, name) => el.getAttribute(name);
    const labelish = el => norm([get(el,'role'), get(el,'aria-label'), get(el,'title'), get(el,'placeholder'), get(el,'value'), get(el,'id'), get(el,'class'), el.tagName].join(' '));
    const nearby = el => {
      let cur = el;
      for (let i = 0; cur && i < 6; i++, cur = cur.parentElement) {
        const s = labelish(cur) + ' ' + clip(cur.innerText || cur.textContent, 300);
        if (kw.test(s)) return true;
        if ((/work-item-form-control|field-control|discussion|comment|combo|dropdown|bolt-formitem/i).test(get(cur,'class') || '')) {
          if (kw.test(s)) return true;
        }
      }
      return false;
    };
    const candidates = new Set();
    document.querySelectorAll(structural).forEach(el => {
      const own = labelish(el) + ' ' + clip(el.innerText || el.textContent, 160);
      if (kw.test(own) || nearby(el)) candidates.add(el);
    });
    document.querySelectorAll('label,div,span,h1,h2,h3,h4,button,a').forEach(el => {
      const ownText = clip(el.innerText || el.textContent, 120);
      const ownMeta = labelish(el);
      if ((kw.test(ownText) || kw.test(ownMeta)) && norm(ownText).length <= 120) candidates.add(el);
    });
    return Array.from(candidates).slice(0, 120).map((el, i) => ({
      i,
      role: get(el,'role'),
      ariaLabel: get(el,'aria-label'),
      title: get(el,'title'),
      placeholder: get(el,'placeholder'),
      value: 'value' in el ? clip(el.value, 120) : null,
      text: clip(el.innerText || el.textContent, 160),
      contenteditable: get(el,'contenteditable'),
      class: clip(get(el,'class'), 160),
      id: get(el,'id'),
      tag: el.tagName.toLowerCase(),
      outerHTML: clip(el.outerHTML, 260)
    }));
  });

  console.log(JSON.stringify({ url: page.url(), count: result.length, elements: result }, null, 0));
  await browser.close();
})().catch(e => { console.error(e && e.stack || e); process.exit(1); });
