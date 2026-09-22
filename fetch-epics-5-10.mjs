import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

const root = process.cwd();
const require = createRequire(path.join(root, 'dev/bangme-fe/package.json'));
const { chromium } = require('playwright');

const project = 'ITVT Sound Fans';
const team = 'ITVT Sound Fans Team';
const outFile = path.join(root, 'dev/bangme-fe/epics-5-10-hierarchy.json');
const endpoint = 'http://127.0.0.1:9222';
const fields = [
  'System.Id', 'System.WorkItemType', 'System.Title', 'System.State', 'System.AssignedTo',
  'System.Description', 'Microsoft.VSTS.Common.AcceptanceCriteria',
  'Microsoft.VSTS.Common.StackRank', 'Microsoft.VSTS.Common.BacklogPriority',
  'Microsoft.VSTS.Common.Priority', 'System.AreaPath', 'System.IterationPath'
];

function htmlToText(v, max = 500) {
  if (!v) return '';
  return String(v).replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ').trim().slice(0, max);
}
function idFromUrl(url) { const m = String(url || '').match(/\/(\d+)$/); return m ? Number(m[1]) : null; }
function assignedTo(v) { return !v ? null : (typeof v === 'string' ? v : { displayName: v.displayName, uniqueName: v.uniqueName, id: v.id }); }
function summarize(wi) {
  const f = wi.fields || {};
  return {
    id: wi.id,
    rev: wi.rev,
    url: wi.url,
    workItemType: f['System.WorkItemType'] || null,
    title: f['System.Title'] || null,
    state: f['System.State'] || null,
    assignedTo: assignedTo(f['System.AssignedTo']),
    areaPath: f['System.AreaPath'] || null,
    iterationPath: f['System.IterationPath'] || null,
    stackRank: f['Microsoft.VSTS.Common.StackRank'] ?? null,
    backlogPriority: f['Microsoft.VSTS.Common.BacklogPriority'] ?? null,
    priority: f['Microsoft.VSTS.Common.Priority'] ?? null,
    descriptionSnippet: htmlToText(f['System.Description']),
    acceptanceCriteriaSnippet: htmlToText(f['Microsoft.VSTS.Common.AcceptanceCriteria']),
    relations: (wi.relations || []).map(r => ({ rel: r.rel, url: r.url, id: idFromUrl(r.url), attributes: r.attributes || {} }))
  };
}

const browser = await chromium.connectOverCDP(endpoint);
try {
  const context = browser.contexts()[0] || await browser.newContext();
  let pages = context.pages();
  let urls = pages.map(p => p.url()).filter(Boolean);
  let org = null;
  for (const u of urls) {
    let m = u.match(/^https:\/\/dev\.azure\.com\/([^\/]+)/i);
    if (m) { org = decodeURIComponent(m[1]); break; }
    m = u.match(/^https:\/\/([^.\/]+)\.visualstudio\.com\//i);
    if (m) { org = decodeURIComponent(m[1]); break; }
  }
  let page = pages.find(p => /dev\.azure\.com|visualstudio\.com/i.test(p.url())) || pages[0] || await context.newPage();
  if (!org) {
    await page.goto('https://dev.azure.com/', { waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => {});
    const links = await page.evaluate(() => Array.from(document.querySelectorAll('a[href]')).map(a => a.href)).catch(() => []);
    urls = [page.url(), ...links];
    for (const u of urls) {
      const m = u.match(/^https:\/\/dev\.azure\.com\/([^\/]+)/i) || u.match(/^https:\/\/([^.\/]+)\.visualstudio\.com\//i);
      if (m) { org = decodeURIComponent(m[1]); break; }
    }
  }
  if (!org) throw new Error('Could not infer Azure DevOps organization from existing authenticated browser pages. Open the project backlog in the CDP browser and retry.');

  const base = `https://dev.azure.com/${encodeURIComponent(org)}`;
  await page.goto(`${base}/${encodeURIComponent(project)}/`, { waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => {});

  async function azFetch(url, init = {}) {
    return await page.evaluate(async ({ url, init }) => {
      const headers = Object.assign({ 'Accept': 'application/json;api-version=7.1', 'Content-Type': 'application/json' }, init.headers || {});
      const res = await fetch(url, Object.assign({}, init, { headers, credentials: 'include' }));
      const text = await res.text();
      let data; try { data = text ? JSON.parse(text) : null; } catch { data = text; }
      if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}: ${typeof data === 'string' ? data.slice(0, 800) : JSON.stringify(data).slice(0, 800)}`);
      return data;
    }, { url, init });
  }

  let orderSource = '', orderField = '', orderedEpicIds = [];
  const projectEnc = encodeURIComponent(project);
  const teamEnc = encodeURIComponent(team);
  const backlogUrl = `${base}/${projectEnc}/${teamEnc}/_apis/work/backlogs/Microsoft.EpicCategory/workItems?api-version=7.1-preview.1`;
  try {
    const backlog = await azFetch(backlogUrl);
    orderedEpicIds = (backlog.workItems || []).map(x => x.target?.id || x.id || idFromUrl(x.target?.url || x.url)).filter(Boolean);
    orderSource = 'team backlog API';
    orderField = 'Azure Boards team backlog order (Microsoft.EpicCategory)';
  } catch (e) {
    const wiqls = [
      { field: 'Microsoft.VSTS.Common.StackRank', q: `SELECT [System.Id] FROM WorkItems WHERE [System.TeamProject] = '${project.replace(/'/g, "''")}' AND [System.WorkItemType] = 'Epic' AND [System.State] <> 'Removed' ORDER BY [Microsoft.VSTS.Common.StackRank] ASC` },
      { field: 'Microsoft.VSTS.Common.BacklogPriority', q: `SELECT [System.Id] FROM WorkItems WHERE [System.TeamProject] = '${project.replace(/'/g, "''")}' AND [System.WorkItemType] = 'Epic' AND [System.State] <> 'Removed' ORDER BY [Microsoft.VSTS.Common.BacklogPriority] ASC` },
      { field: 'System.Id', q: `SELECT [System.Id] FROM WorkItems WHERE [System.TeamProject] = '${project.replace(/'/g, "''")}' AND [System.WorkItemType] = 'Epic' AND [System.State] <> 'Removed' ORDER BY [System.Id] ASC` }
    ];
    let lastErr = e;
    for (const w of wiqls) {
      try {
        const result = await azFetch(`${base}/${projectEnc}/_apis/wit/wiql?api-version=7.1`, { method: 'POST', body: JSON.stringify({ query: w.q }) });
        orderedEpicIds = (result.workItems || []).map(x => x.id).filter(Boolean);
        orderSource = 'WIQL fallback'; orderField = w.field; lastErr = null; break;
      } catch (err) { lastErr = err; }
    }
    if (lastErr) throw lastErr;
  }
  if (orderedEpicIds.length < 10) console.warn(`Only ${orderedEpicIds.length} epics found in ordered list.`);
  const selectedEpicIds = orderedEpicIds.slice(4, 10);
  if (!selectedEpicIds.length) throw new Error('No epics found for ordinal range 5-10.');

  const all = new Map();
  async function fetchBatch(ids) {
    const unique = [...new Set(ids.filter(Boolean).map(Number).filter(id => !all.has(id)))];
    for (let i = 0; i < unique.length; i += 200) {
      const batchIds = unique.slice(i, i + 200);
      if (!batchIds.length) continue;
      const data = await azFetch(`${base}/${projectEnc}/_apis/wit/workitemsbatch?api-version=7.1`, {
        method: 'POST',
        body: JSON.stringify({ ids: batchIds, fields, '$expand': 'Relations', errorPolicy: 'Omit' })
      });
      for (const wi of data.value || []) all.set(wi.id, wi);
    }
  }
  await fetchBatch(selectedEpicIds);
  let frontier = selectedEpicIds;
  for (let depth = 0; depth < 20; depth++) {
    const next = [];
    for (const id of frontier) {
      const wi = all.get(id); if (!wi) continue;
      for (const r of wi.relations || []) {
        if (r.rel === 'System.LinkTypes.Hierarchy-Forward') {
          const cid = idFromUrl(r.url); if (cid && !all.has(cid)) next.push(cid);
        }
      }
    }
    if (!next.length) break;
    await fetchBatch(next);
    frontier = next;
  }

  function build(id, seen = new Set()) {
    const wi = all.get(id);
    if (!wi) return { id, missing: true, children: [] };
    const node = summarize(wi);
    node.duplicateAlreadyProcessed = (id === 44227 || ((node.title || '').trim().toLowerCase() === 'log in' && node.workItemType === 'Epic'));
    if (seen.has(id)) { node.cycle = true; node.children = []; return node; }
    const nextSeen = new Set(seen); nextSeen.add(id);
    node.children = (wi.relations || [])
      .filter(r => r.rel === 'System.LinkTypes.Hierarchy-Forward')
      .map(r => idFromUrl(r.url)).filter(Boolean)
      .map(cid => build(cid, nextSeen));
    node.childCount = node.children.length;
    node.totalDescendantCount = node.children.reduce((n, c) => n + 1 + (c.totalDescendantCount || 0), 0);
    return node;
  }
  const epics = selectedEpicIds.map((id, idx) => ({ ordinal: idx + 5, ...build(id) }));
  const result = { generatedAt: new Date().toISOString(), organization: org, project, team, ordinalRange: [5, 10], orderSource, orderField, fullOrderedEpicIds: orderedEpicIds, selectedEpicIds, epics };
  await fs.writeFile(outFile, JSON.stringify(result, null, 2), 'utf8');

  function line(node, indent = '') {
    const dup = node.duplicateAlreadyProcessed ? ' [DUPLICATE already-processed 44227 Log in]' : '';
    const cc = `children:${node.childCount || 0}, descendants:${node.totalDescendantCount || 0}`;
    let s = `${indent}- ${node.ordinal ? node.ordinal + '. ' : ''}${node.id} ${node.title || '(missing title)'} (${node.workItemType || 'unknown'}${node.state ? ', ' + node.state : ''}) ${cc}${dup}`;
    for (const ch of node.children || []) s += `\n${line(ch, indent + '  ')}`;
    return s;
  }
  console.log(`Saved ${outFile}`);
  console.log(`Ordering: ${orderSource}; field/source: ${orderField}`);
  console.log(epics.map(e => line(e)).join('\n'));
} finally {
  await browser.close().catch(() => {});
}

