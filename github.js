'use strict';
// Keeps a GitHub repository in step with the MUD's code and content, using only the GitHub REST API (no git needed on the server).
// Every sync is ONE commit for all changed files (added, changed or deleted). Secrets and player data are never uploaded (see EXCLUDE).
// Triggers: the area builder (a few seconds after a save), a periodic check for edited files, `github sync` (wizard) and `node tools/github_sync.js`.
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const load = require('./config');
const ROOT = __dirname, STATE = path.join(ROOT, 'data', 'github-sync.json');
const INCLUDE = ['*.js', '*.json', '*.md', '.gitignore', 'public/**', 'tools/**', 'data/custom/**'];
const EXCLUDE = ['data/players/**', 'data/bots.json', 'data/builder.key', 'data/config.json', 'data/github-sync.json', 'node_modules/**', '.git/**', '*.log', '*.zip'];
const BINARY = /\.(wav|png|jpe?g|gif|ico|woff2?)$/i;
const rx = (g) => new RegExp('^' + g.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*\*/g, '\u0000').replace(/\*/g, '[^/]*').replace(/\u0000/g, '.*') + '$');
const INC = INCLUDE.map(rx), EXC = EXCLUDE.map(rx), wanted = (p) => INC.some((r) => r.test(p)) && !EXC.some((r) => r.test(p));
let cfg = null, running = false, deb = null, tick = null, pendingReason = '', lastError = '', st = { files: {}, lastSync: null, lastCommit: null, lastFiles: 0 };
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), 'github:', ...a);
try { st = { ...st, ...JSON.parse(fs.readFileSync(STATE, 'utf8')) }; } catch (e) { /* first run */ }
const saveState = () => { try { fs.mkdirSync(path.dirname(STATE), { recursive: true }); fs.writeFileSync(STATE, JSON.stringify(st)); } catch (e) { log('could not save state:', e.message); } };
const on = () => !!(cfg && cfg.token && /^[\w.-]+\/[\w.-]+$/.test(cfg.repo));
const blobSha = (buf) => crypto.createHash('sha1').update('blob ' + buf.length + '\0').update(buf).digest('hex'); // same hash git uses, so we can compare with GitHub

function scan() { // every tracked file -> { sha, buf }
  const out = {};
  const walk = (dir, rel) => { for (const e of fs.readdirSync(dir, { withFileTypes: true })) { const r = rel ? rel + '/' + e.name : e.name;
    if (e.isDirectory()) { if (['node_modules', '.git'].includes(e.name) || r === 'data/players') continue; walk(path.join(dir, e.name), r); }
    else if (e.isFile() && wanted(r)) { const buf = fs.readFileSync(path.join(dir, e.name)); out[r] = { sha: blobSha(buf), buf }; } } };
  walk(ROOT, ''); return out;
}
function pending() { // how many local files differ from the last sync (no network needed)
  const local = scan(), prev = st.files || {}; let n = 0; for (const p of Object.keys(local)) if (prev[p] !== local[p].sha) n++; for (const p of Object.keys(prev)) if (!local[p]) n++; return n;
}

async function gh(method, p, body) {
  const r = await fetch(cfg.apiBase + p, { method, headers: { Authorization: 'Bearer ' + cfg.token, Accept: 'application/vnd.github+json', 'User-Agent': 'multiverse-mud', 'X-GitHub-Api-Version': '2022-11-28', 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  const text = await r.text(); let j = {}; try { j = JSON.parse(text); } catch (e) { /* not json */ }
  if (!r.ok) { const e = new Error(`${method} ${p} -> ${r.status} ${j.message || ''}`.trim()); e.status = r.status; throw e; } return j;
}
async function head() { // current commit of the branch; creates the branch (or the whole first commit) if needed
  const R = `/repos/${cfg.repo}`;
  try { return (await gh('GET', `${R}/git/ref/heads/${cfg.branch}`)).object.sha; } catch (e) { if (e.status !== 404 && e.status !== 409) throw e; }
  const def = (await gh('GET', R)).default_branch || 'main'; let base = null;
  try { base = (await gh('GET', `${R}/git/ref/heads/${def}`)).object.sha; } catch (e) { if (e.status !== 404 && e.status !== 409) throw e; }
  if (!base) { // brand-new empty repository: the Contents API can create the first commit
    await gh('PUT', `${R}/contents/README.md`, { message: 'Initialize repository', content: Buffer.from('# MULTIVERSE MUD\n\nCode and content synced automatically from the running game server.\n').toString('base64'), branch: def });
    base = (await gh('GET', `${R}/git/ref/heads/${def}`)).object.sha;
  }
  if (def !== cfg.branch) await gh('POST', `${R}/git/refs`, { ref: `refs/heads/${cfg.branch}`, sha: base });
  return base;
}

async function sync(reason, retry = true) {
  if (!on()) throw new Error('GitHub sync is not configured (set GITHUB_TOKEN and GITHUB_REPO=owner/name, or data/config.json)');
  if (running) return { skipped: 'a sync is already running' }; running = true;
  try {
    const R = `/repos/${cfg.repo}`, local = scan(), h = await head(), commit = await gh('GET', `${R}/git/commits/${h}`);
    const tree = await gh('GET', `${R}/git/trees/${commit.tree.sha}?recursive=1`), remote = {}; for (const e of tree.tree) if (e.type === 'blob') remote[e.path] = e.sha;
    const prev = st.files || {}, changes = [];
    for (const p of Object.keys(local)) if (remote[p] !== local[p].sha) changes.push([remote[p] ? 'M' : 'A', p]);
    for (const p of Object.keys(prev)) if (!local[p] && remote[p]) changes.push(['D', p]);
    if (!changes.length) { st.files = Object.fromEntries(Object.entries(local).map(([p, f]) => [p, f.sha])); st.lastCheck = new Date().toISOString(); saveState(); lastError = ''; return { changed: 0 }; }
    let base = commit.tree.sha, size = 0, batch = [];
    const flush = async () => { if (!batch.length) return; base = (await gh('POST', `${R}/git/trees`, { base_tree: base, tree: batch })).sha; batch = []; size = 0; };
    for (const [op, p] of changes) {
      if (op === 'D') { batch.push({ path: p, mode: '100644', type: 'blob', sha: null }); continue; }
      const buf = local[p].buf; size += buf.length;
      if (BINARY.test(p)) batch.push({ path: p, mode: '100644', type: 'blob', sha: (await gh('POST', `${R}/git/blobs`, { content: buf.toString('base64'), encoding: 'base64' })).sha });
      else batch.push({ path: p, mode: '100644', type: 'blob', content: buf.toString('utf8') });
      if (size > 4e6) await flush();
    }
    await flush();
    const list = changes.slice(0, 25).map(([op, p]) => `${op} ${p}`).join('\n') + (changes.length > 25 ? `\n...and ${changes.length - 25} more` : '');
    const msg = `${reason || 'MUD update'}: ${changes.length} file${changes.length > 1 ? 's' : ''} changed\n\n${list}`;
    const c = await gh('POST', `${R}/git/commits`, { message: msg, tree: base, parents: [h], author: { name: cfg.authorName, email: cfg.authorEmail, date: new Date().toISOString() } });
    try { await gh('PATCH', `${R}/git/refs/heads/${cfg.branch}`, { sha: c.sha }); }
    catch (e) { if (e.status === 422 && retry) { running = false; return sync(reason, false); } throw e; } // someone pushed in between: try once more from the new head
    st.files = Object.fromEntries(Object.entries(local).map(([p, f]) => [p, f.sha])); st.lastSync = new Date().toISOString(); st.lastCommit = c.sha; st.lastFiles = changes.length; saveState(); lastError = '';
    return { changed: changes.length, commit: c.sha, files: changes.map(([op, p]) => op + ' ' + p) };
  } catch (e) { lastError = e.message; throw e; } finally { running = false; }
}
async function run(reason) { try { const r = await sync(reason); if (r.changed) log(`pushed ${r.changed} file(s) to ${cfg.repo}@${cfg.branch} (${r.commit.slice(0, 7)}): ${reason}`); } catch (e) { log('sync failed:', e.message); } }
function touch(reason) { // something changed: push it shortly (changes close together are batched into one commit)
  if (!on()) return; pendingReason = reason || pendingReason || 'MUD update'; clearTimeout(deb); deb = setTimeout(() => { const r = pendingReason; pendingReason = ''; run(r); }, cfg.debounceSeconds * 1000);
}
function configure() { cfg = load().github; return on(); }
function start() {
  if (!configure()) return log('not configured (set GITHUB_TOKEN and GITHUB_REPO=owner/name to sync MUD changes to GitHub)');
  log(`syncing to ${cfg.repo}@${cfg.branch}: changed files are pushed ${cfg.debounceSeconds}s after builder saves, and checked every ${cfg.intervalMinutes} min`);
  tick = setInterval(() => { try { if (pending() > 0) touch('Scheduled sync of edited files'); } catch (e) { log('check failed:', e.message); } }, cfg.intervalMinutes * 60000);
  try { if (pending() > 0) touch('Startup sync'); } catch (e) { log('check failed:', e.message); }
}
const status = () => ({ configured: on(), repo: cfg && cfg.repo, branch: cfg && cfg.branch, lastSync: st.lastSync, lastCommit: st.lastCommit, lastFiles: st.lastFiles, pending: on() ? pending() : 0, running, lastError });
// ---- player reports (see reports.js): a markdown file in ideas/ or bugs/ and an issue assigned to the repository owner ----
const enabled = () => { if (!cfg) configure(); return on(); };
async function putFile(p, content, message) { // create one file with the Contents API (ideas/ and bugs/ are not part of the code sync, which never deletes files it did not upload)
  await head(); const R = `/repos/${cfg.repo}`, j = await gh('PUT', `${R}/contents/${p.split('/').map(encodeURIComponent).join('/')}`, { message, content: Buffer.from(content, 'utf8').toString('base64'), branch: cfg.branch, committer: { name: cfg.authorName, email: cfg.authorEmail } });
  return (j.content && j.content.html_url) || `https://github.com/${cfg.repo}/blob/${cfg.branch}/${p}`;
}
async function createIssue({ title, body, labels }) { // an issue assigned to cfg.assignee (default: the repository owner); an unknown assignee is retried without one
  const R = `/repos/${cfg.repo}`, who = cfg.assignee || cfg.repo.split('/')[0]; let j;
  try { j = await gh('POST', `${R}/issues`, { title, body, labels, assignees: [who] }); }
  catch (e) { if (e.status !== 422) throw e; j = await gh('POST', `${R}/issues`, { title, body, labels }); }
  return j.html_url;
}
module.exports = { enabled, putFile, createIssue, start, touch, sync, status, configure, scan, wanted, stop: () => { clearInterval(tick); clearTimeout(deb); } };
