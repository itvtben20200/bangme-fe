const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ORG = 'ITVT';
const PROJECT = 'ITVT Sound Fans';
const projectEnc = encodeURIComponent(PROJECT).replace(/%20/g, '%20');
const base = `https://dev.azure.com/${ORG}/${projectEnc}`;
const outPath = path.join(__dirname, 'epics-5-10-hierarchy.json');

function stripHtml(s) {
  if (!s) return '';
  return String(s).replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
}
function person(v) {
  if (!v) return null;
  if (typeof v === 'string') return v;
  return v.displayName || v.uniqueName || v.id || null;
}
function pickFields(w) {
  const f = w.fields || {};
  const rels = w.relations || [];
  const children = rels.filter(r => r.rel === 'System.LinkTypes.Hierarchy-Forward').map(r => Number(String(r.url).split('/').pop())).filter(Boolean);
  const parents = rels.filter(r => r.rel === 'System.LinkTypes.Hierarchy-Reverse').map(r => Number(String(r.url).split('/').pop())).filter(Boolean);
  return {
    id: w.id,
    title: f['System.Title'] || '',
    workItemType: f['System.WorkItemType'] || '',
    state: f['System.State'] || '',
    assignedTo: person(f['System.AssignedTo']),
    description: stripHtml(f['System.Description'] || ''),
    acceptanceCriteria: stripHtml(f['Microsoft.VSTS.Common.AcceptanceCriteria'] || ''),
    parentId: parents[0] || f['System.Parent'] || null,
    childIds: children,
    children: []
  };
}
async function main() {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  let context = browser.contexts()[0];
  if (!context) throw new Error('No Chromium CDP context found.');
  let page = context.pages().find(p => p.url().startsWith('https://dev.azure.com/')) || context.pages()[0];
  if (!page) page = await context.newPage();
  if (!page.url().startsWith(base)) await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 60000 });

  async function azFetch(url, options = {}) {
    return await page.evaluate(async ({url, options}) => {
      const res = await fetch(url, { credentials: 'include', ...options, headers: { 'Accept': 'application/json', ...(options.headers || {}) }});
      const text = await res.text();
      let json = null;
      try { json = text ? JSON.parse(text) : null; } catch {}
      return { ok: res.ok, status: res.status, statusText: res.statusText, url: res.url, text, json };
    }, { url, options });
  }
  async function getJson(url) {
    const r = await azFetch(url);
    if (!r.ok) throw new Error(`GET ${url} failed ${r.status} ${r.statusText}: ${r.text.slice(0,500)}`);
    return r.json;
  }
  async function postJson(url, body) {
    const r = await azFetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error(`POST ${url} failed ${r.status} ${r.statusText}: ${r.text.slice(0,800)}`);
    return r.json;
  }

  // Resolve default/team-scoped backlog work items. Try current/default team routes and keep all successes for ambiguity reporting.
  const candidates = [];
  const projectInfo = await getJson(`${base}/_apis/projects/${projectEnc}?api-version=7.1`).catch(() => null);
  const defaultTeamName = projectInfo && projectInfo.defaultTeam ? projectInfo.defaultTeam.name : PROJECT + ' Team';
  const routeTeams = Array.from(new Set([PROJECT, defaultTeamName, 'ITVT Sound Fans Team'].filter(Boolean)));
  for (const team of routeTeams) {
    const teamEnc = encodeURIComponent(team).replace(/%20/g, '%20');
    const url = `${base}/${teamEnc}/_apis/work/backlogs/Microsoft.EpicCategory/workItems?api-version=7.1-preview.1`;
    try {
      const j = await getJson(url);
      const ids = (j.workItems || []).map(x => Number(x.id || String(x.url).split('/').pop())).filter(Boolean);
      if (ids.length) candidates.push({ team, ids, source: url });
    } catch (e) {}
  }
  // Fallback: WIQL query sorted by Stack Rank / Backlog Priority, if backlog API is unavailable.
  let epicIds = [];
  let source = '';
  let ambiguous = false;
  if (candidates.length) {
    const sigs = Array.from(new Set(candidates.map(c => c.ids.join(','))));
    ambiguous = sigs.length > 1;
    epicIds = candidates[0].ids;
    source = candidates[0].source;
  } else {
    const wiql = `SELECT [System.Id] FROM WorkItems WHERE [System.TeamProject] = @project AND [System.WorkItemType] = 'Epic' AND [System.State] <> 'Removed' ORDER BY [Microsoft.VSTS.Common.BacklogPriority] ASC, [Microsoft.VSTS.Common.StackRank] ASC`;
    const j = await postJson(`${base}/_apis/wit/wiql?api-version=7.1`, { query: wiql });
    epicIds = (j.workItems || []).map(x => x.id);
    source = 'WIQL BacklogPriority/StackRank fallback';
  }

  async function getWorkItems(ids) {
    const map = new Map();
    const fields = [
      'System.Id','System.Title','System.WorkItemType','System.State','System.AssignedTo','System.Description','System.Parent','Microsoft.VSTS.Common.AcceptanceCriteria'
    ];
    for (let i = 0; i < ids.length; i += 200) {
      const chunk = ids.slice(i, i + 200);
      const j = await postJson(`${base}/_apis/wit/workitemsbatch?api-version=7.1`, { ids: chunk, fields, '$expand': 'Relations', errorPolicy: 'Omit' });
      for (const w of (j.value || [])) map.set(w.id, w);
    }
    return map;
  }

  const visibleMap = await getWorkItems(epicIds);
  const visibleEpics = epicIds.map((id, idx) => {
    const w = visibleMap.get(id); const f = w ? w.fields || {} : {};
    return { ordinal: idx + 1, id, title: f['System.Title'] || '', workItemType: f['System.WorkItemType'] || '', state: f['System.State'] || '' };
  });

  if (ambiguous) {
    const result = { ambiguity: 'Multiple team backlog API routes returned different Epic orders; hierarchy file was not updated.', candidates: candidates.map(c => ({team:c.team, source:c.source, epics:c.ids.map((id,idx)=>{const w=visibleMap.get(id); const f=w?w.fields||{}:{}; return {ordinal:idx+1,id,title:f['System.Title']||'',state:f['System.State']||''};})})) };
    console.log(JSON.stringify(result, null, 2));
    await browser.close();
    return;
  }

  const selectedEpicIds = epicIds.slice(4, 10);
  if (selectedEpicIds.length < 6) throw new Error(`Only ${epicIds.length} epics found; cannot select ordinals 5-10.`);

  const allIds = new Set(selectedEpicIds);
  const raw = new Map();
  const queue = [...selectedEpicIds];
  while (queue.length) {
    const batchIds = queue.splice(0, 200).filter(id => !raw.has(id));
    if (!batchIds.length) continue;
    const got = await getWorkItems(batchIds);
    for (const [id, w] of got) {
      raw.set(id, w);
      const p = pickFields(w);
      for (const cid of p.childIds) {
        if (!allIds.has(cid)) { allIds.add(cid); queue.push(cid); }
      }
    }
  }
  // Ensure any child ids referenced by newly fetched items are fetched.
  const missing = [...allIds].filter(id => !raw.has(id));
  if (missing.length) {
    const got = await getWorkItems(missing);
    for (const [id,w] of got) raw.set(id,w);
  }
  const nodes = new Map([...raw.values()].map(w => [w.id, pickFields(w)]));
  for (const node of nodes.values()) {
    node.children = node.childIds.map(id => nodes.get(id)).filter(Boolean);
  }
  const hierarchy = selectedEpicIds.map(id => nodes.get(id)).filter(Boolean);
  const output = { project: PROJECT, source, ordinalEpics: [5,6,7,8,9,10], generatedAt: new Date().toISOString(), visibleEpicOrder: visibleEpics, hierarchy };
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf8');

  function printNode(n, indent = '') {
    const childCount = n.children.length;
    console.log(`${indent}- ${n.id} | ${n.workItemType} | ${n.state} | ${n.title} (${childCount} children)`);
    for (const c of n.children) printNode(c, indent + '  ');
  }
  console.log(`Saved ${outPath}`);
  console.log(`Source: ${source}`);
  for (const n of hierarchy) printNode(n);
  await browser.close();
}
main().catch(err => { console.error(err && err.stack || err); process.exit(1); });
