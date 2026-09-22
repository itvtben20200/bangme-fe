import path from 'node:path';
import { createRequire } from 'node:module';
const root = process.cwd();
const require = createRequire(path.join(root, 'dev/bangme-fe/package.json'));
const { chromium } = require('playwright');
const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
try {
  const context = browser.contexts()[0];
  const pages = context.pages();
  console.log('pages:', pages.map(p => p.url()).join('\n'));
  let page = pages.find(p => /dev\.azure\.com|visualstudio\.com/i.test(p.url())) || pages[0];
  let orgs = new Set();
  for (const p of pages) {
    const u = p.url();
    let m = u.match(/^https:\/\/dev\.azure\.com\/([^\/]+)/i); if (m) orgs.add(decodeURIComponent(m[1]));
    m = u.match(/^https:\/\/([^.\/]+)\.visualstudio\.com\//i); if (m) orgs.add(decodeURIComponent(m[1]));
  }
  async function rawFetch(url, init = {}) {
    return await page.evaluate(async ({url, init}) => {
      const res = await fetch(url, Object.assign({ credentials: 'include' }, init, { headers: Object.assign({Accept:'application/json'}, init.headers||{}) }));
      const text = await res.text();
      let data; try { data = JSON.parse(text); } catch { data = text; }
      return { ok: res.ok, status: res.status, url: res.url, data: typeof data === 'string' ? data.slice(0,500) : data };
    }, {url, init});
  }
  if (!orgs.size) orgs.add('itvt');
  for (const org of orgs) {
    const base = `https://dev.azure.com/${encodeURIComponent(org)}`;
    console.log('\nORG', org);
    const projects = await rawFetch(`${base}/_apis/projects?api-version=7.1`);
    console.log('projects', projects.status, JSON.stringify(projects.data).slice(0,2000));
    const proj = 'ITVT Sound Fans'; const team = 'ITVT Sound Fans Team';
    for (const url of [
      `${base}/${encodeURIComponent(proj)}/_apis/wit/wiql?api-version=7.1`,
      `${base}/${encodeURIComponent(proj)}/${encodeURIComponent(team)}/_apis/work/backlogs?api-version=7.1-preview.1`,
      `${base}/${encodeURIComponent(proj)}/${encodeURIComponent(team)}/_apis/work/backlogs/Microsoft.EpicCategory/workItems?api-version=7.1-preview.1`,
      `${base}/${encodeURIComponent(proj)}/_apis/work/teamsettings/teamfieldvalues?api-version=7.1-preview.1`
    ]) {
      const init = url.includes('/wiql') ? {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({query:`SELECT [System.Id], [System.Title], [System.WorkItemType], [System.State] FROM WorkItems WHERE [System.TeamProject] = '${proj}' AND [System.WorkItemType] = 'Epic' ORDER BY [System.Id] ASC`})} : {};
      const r = await rawFetch(url, init);
      console.log('URL', url, 'STATUS', r.status, JSON.stringify(r.data).slice(0,3000));
    }
  }
} finally { await browser.close().catch(()=>{}); }
