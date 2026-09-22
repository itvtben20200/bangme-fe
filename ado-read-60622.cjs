const { chromium } = require('@playwright/test');
(async () => {
  const targetUrl = 'https://dev.azure.com/ITVT/ITVT%20Sound%20Fans/_workitems/edit/60622';
  const phrase = 'Reviewed against the current SoundFans codebase';
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0] || await browser.newContext();
  let pages = context.pages();
  let page = pages.find(p => /dev\.azure\.com\/ITVT/i.test(p.url())) || pages[0] || await context.newPage();
  if (!/dev\.azure\.com\/ITVT/i.test(page.url()) || !/60622/.test(page.url())) {
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  } else {
    await page.bringToFront();
  }
  try { await page.waitForLoadState('networkidle', { timeout: 15000 }); } catch {}
  // If a backlog URL is open without the work item dialog, go directly to the read-only edit URL.
  if (!/workitems\/edit\/60622/i.test(page.url()) && !/60622/.test(await page.title().catch(() => ''))) {
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    try { await page.waitForLoadState('networkidle', { timeout: 15000 }); } catch {}
  }
  await page.waitForTimeout(3000);

  const api = await page.evaluate(async (phrase) => {
    const wiUrl = 'https://dev.azure.com/ITVT/ITVT%20Sound%20Fans/_apis/wit/workitems/60622?api-version=7.1';
    const commentsUrl = 'https://dev.azure.com/ITVT/ITVT%20Sound%20Fans/_apis/wit/workItems/60622/comments?api-version=7.1-preview.4&$top=200';
    const out = { ok: false, state: null, title: null, hasComment: null, wiStatus: null, commentsStatus: null, error: null };
    try {
      const wiResp = await fetch(wiUrl, { credentials: 'include' });
      out.wiStatus = wiResp.status;
      if (wiResp.ok) {
        const wi = await wiResp.json();
        out.state = wi.fields && wi.fields['System.State'];
        out.title = wi.fields && wi.fields['System.Title'];
      }
      const cResp = await fetch(commentsUrl, { credentials: 'include' });
      out.commentsStatus = cResp.status;
      if (cResp.ok) {
        const cj = await cResp.json();
        const arr = cj.comments || cj.value || [];
        const strip = s => String(s || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
        out.hasComment = arr.some(c => strip(c.text || c.renderedText || c.content).startsWith(phrase));
      }
      out.ok = !!out.state;
    } catch (e) { out.error = String(e && e.message || e); }
    return out;
  }, phrase);

  let domState = null;
  if (!api.state) {
    domState = await page.evaluate(() => {
      const norm = s => (s || '').replace(/\s+/g, ' ').trim();
      const labels = Array.from(document.querySelectorAll('*')).filter(el => norm(el.textContent) === 'State' || /(^|\s)State(\s|$)/.test(norm(el.getAttribute('aria-label'))));
      for (const lab of labels) {
        let root = lab.closest('.work-item-form-control, .field-control, .bolt-formitem, .workitemcontrol') || lab.parentElement;
        for (let i = 0; root && i < 4; i++, root = root.parentElement) {
          const input = root.querySelector('input[aria-label], input, [role="combobox"], [aria-expanded], .bolt-dropdown-expandable-text, .field-control-text');
          const val = input && (input.value || input.getAttribute('aria-label') || norm(input.textContent));
          if (val && !/^State$/i.test(val)) return norm(val.replace(/^State\s*/i, ''));
        }
      }
      const txt = norm(document.body.innerText);
      const m = txt.match(/State\s+(New|Active|Resolved|Closed|Removed|Done|Committed|Approved|In Progress)/i);
      return m ? m[1] : null;
    });
  }

  const url = page.url();
  const title = await page.title();
  console.log(JSON.stringify({
    state: api.state || domState || null,
    discussionContainsReviewedComment: api.hasComment,
    url,
    title,
    workItemTitle: api.title,
    apiStatus: { workItem: api.wiStatus, comments: api.commentsStatus },
    apiError: api.error
  }, null, 2));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
