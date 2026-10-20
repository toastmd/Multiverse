'use strict';
// `idea <text>` and `bug <text>`: player suggestions and bug reports. Each one is saved locally (data/reports/) and filed on GitHub as a markdown file in
// ideas/ or bugs/ of the repository, plus a GitHub issue assigned to the repository owner (toastmd), so it lands on their to-do list. If GitHub cannot be
// reached the report stays queued locally and is retried every 5 minutes. Players are rate limited so the channel cannot be flooded.
const fs = require('fs'), path = require('path'), D = require('./lib'), github = require('./github');
const DIR = path.join(__dirname, 'data', 'reports'), IDX = path.join(DIR, 'index.json'), QUEUE = path.join(DIR, 'pending.json');
const KINDS = { idea: { dir: 'ideas', label: 'idea', word: 'Idea' }, bug: { dir: 'bugs', label: 'bug', word: 'Bug' } };
const MIN = 8, MAX = 1500, GAP = 30000, PER_HOUR = 8, PER_DAY = 200; let idx = { idea: 0, bug: 0 }, queue = [], timer = null, busy = false; const stamps = new Map(); let daily = { day: '', n: 0 };
const readJson = (f, d) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { return d; } }, writeJson = (f, o) => { try { fs.mkdirSync(DIR, { recursive: true }); fs.writeFileSync(f, JSON.stringify(o, null, 1)); } catch (e) { D.log('reports: could not save', e.message); } };
idx = { ...idx, ...readJson(IDX, {}) }; queue = readJson(QUEUE, []);
const clean = (s) => String(s || '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').replace(/@(?=\w)/g, '@\u200b').trim(); // no control characters; no accidental @mentions that would ping people on GitHub
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'report', iso = (d) => d.toISOString().replace(/\.\d+Z$/, 'Z');
function make(kind, p, text) { // the markdown file and the issue text for one report
  const K = KINDS[kind], n = ++idx[kind], now = new Date(), owner = ((github.status().repo || 'toastmd/Multiverse').split('/')[0]) || 'toastmd', t = clean(text).slice(0, MAX), title = (t.split(/[.!?\n]/)[0] || t).slice(0, 70).trim() || K.word, room = p.env ? `${p.env.path} (${p.env.name})` : 'unknown';
  const name = `${K.dir}/${iso(now).replace(/[-:]/g, '').replace('T', '-').slice(0, 15)}-${slug(p.name)}-${slug(title).slice(0, 24)}-${n}.md`, build = D.build ? D.build() : 'unknown';
  const recent = kind === 'bug' && p.recent && p.recent.length ? `\n## What the player last saw\n\n\`\`\`\n${p.recent.slice(-12).map((l) => clean(l).slice(0, 180)).join('\n').replace(/```/g, "'''")}\n\`\`\`\n` : '';
  const md = `---\ntype: ${kind}\nnumber: ${n}\nreported-by: ${clean(p.name)}\ncharacter: level ${p.level} ${p.klass().name}${p.remort ? ` (remort ${p.remort})` : ''}\nroom: ${room}\nreported: ${iso(now)}\nclient-build: ${build}\nassignee: ${owner}\nstatus: open\n---\n\n# ${K.word} #${n}: ${title}\n\n${t}\n${recent}`;
  return { kind, n, name, title: `${K.word} #${n}: ${title}`, md, labels: [K.label, 'from-game'], reporter: p.name, queued: Date.now() };
}
async function deliver(rec) { // file the markdown (once) and open the issue (once); each step is remembered so a retry never duplicates
  const errors = [];
  if (!rec.fileUrl) { try { rec.fileUrl = await github.putFile(rec.name, rec.md, `${KINDS[rec.kind].word} #${rec.n} from ${rec.reporter}`); } catch (e) { errors.push('file: ' + e.message); } }
  if (rec.fileUrl && !rec.issueUrl && !rec.issueGaveUp) { try { rec.issueUrl = await github.createIssue({ title: rec.title, body: `${rec.md.split('---').slice(2).join('---').trim()}\n\n---\nReported in game by **${clean(rec.reporter)}**. File: ${rec.fileUrl}`, labels: rec.labels }); } catch (e) { errors.push('issue: ' + e.message); if (/^(403|404|410|401)/.test(e.status || '') || [401, 403, 404, 410].includes(e.status)) rec.issueGaveUp = e.message; } }
  rec.errors = errors; return !!rec.fileUrl && (!!rec.issueUrl || !!rec.issueGaveUp);
}
async function flush() { // try everything still queued
  if (busy || !queue.length || !github.enabled()) return; busy = true;
  try { for (const rec of [...queue]) { const done = await deliver(rec); if (done) { queue = queue.filter((r) => r !== rec); const p = D.players.get(rec.reporter); if (p) p.msg(`Your ${rec.kind} #${rec.n} reached GitHub: ${rec.fileUrl}${rec.issueUrl ? ` (issue: ${rec.issueUrl})` : rec.issueGaveUp ? ' (the file is filed; the GitHub token cannot open issues yet)' : ''}`, 'win'); } else break; } }
  finally { busy = false; writeJson(QUEUE, queue); }
}
function submit(p, kind, text) { // the idea / bug command
  const K = KINDS[kind], t = clean(text);
  if (t.length < MIN) return p.msg(`Usage: ${kind} <${kind === 'bug' ? 'what went wrong, and what you were doing' : 'your idea'}>  (at least ${MIN} characters, up to ${MAX}). It is filed on GitHub for the developer (toastmd).`, 'sys');
  const now = Date.now(), mine = (stamps.get(p.name) || []).filter((x) => now - x < 3600000), today = new Date().toISOString().slice(0, 10); if (daily.day !== today) daily = { day: today, n: 0 };
  if (mine.length && now - mine[mine.length - 1] < GAP) return p.msg(`Please wait ${Math.ceil((GAP - (now - mine[mine.length - 1])) / 1000)} seconds before sending another.`, 'sys');
  if (mine.length >= PER_HOUR || daily.n >= PER_DAY) return p.msg('That is a lot of reports for now. Please try again a bit later.', 'sys');
  mine.push(now); stamps.set(p.name, mine); daily.n++;
  const rec = make(kind, p, t); writeJson(IDX, idx); try { fs.mkdirSync(path.join(DIR, K.dir), { recursive: true }); fs.writeFileSync(path.join(DIR, rec.name), rec.md); } catch (e) { /* the queue below still holds it */ }
  p.msg(`Thank you! Your ${kind} #${rec.n} is recorded${github.enabled() ? ' and is being filed on GitHub for toastmd' : ' (GitHub is not set up on this server yet, so it is saved for the developer)'}.`, 'win');
  queue.push(rec); writeJson(QUEUE, queue);
  if (github.enabled()) deliver(rec).then((done) => { if (done) { queue = queue.filter((r) => r !== rec); writeJson(QUEUE, queue); p.msg(`Filed on GitHub as ${rec.name}${rec.issueUrl ? ` and issue ${rec.issueUrl}, assigned to toastmd` : rec.issueGaveUp ? ' (the issue could not be opened: the GitHub token needs Issues permission)' : ''}.`, 'win'); } else { writeJson(QUEUE, queue); p.msg(`Saved. GitHub did not answer (${(rec.errors || []).join('; ').slice(0, 120)}); it will be retried automatically.`, 'sys'); } }).catch((e) => D.log('reports:', e.message));
}
const start = () => { timer = setInterval(flush, 300000); setTimeout(flush, 15000); }, stop = () => { clearInterval(timer); };
module.exports = { submit, start, stop, flush, state: () => ({ idx, queue: queue.length }), _make: make };
