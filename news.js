'use strict';
// The Multiverse Magazine: an in-game news magazine on the rack in Ashfall Square (`get magazine`, then `read magazine`).
// The game logs quest completions, logins, level-ups, deaths and tradeskill mastery; the magazine publishes a new issue every 30 minutes.
const fs = require('fs'), path = require('path'), D = require('./lib');
const FILE = path.join(__dirname, 'data', 'news.json'), ISSUE_MS = 30 * 60 * 1000, KEEP_MS = 48 * 3600 * 1000, SKILL_OVER = 25; // tradeskill masters: levels OVER 25
let ev = []; try { ev = JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch (e) { ev = []; }
let dirty = false, cache = { no: -1, text: null, at: 0 };
const save = () => { if (!dirty) return; dirty = false; try { fs.mkdirSync(path.dirname(FILE), { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(ev.slice(-3000))); } catch (e) { /* the news is not worth crashing for */ } };
setInterval(save, 60000).unref(); process.on('exit', save);
const log = (kind, p, data = {}) => { // kind: quest, login, new, level, death, skill
  if (!p || p.isBot) return; ev.push({ t: Date.now(), k: kind, n: p.name, c: p.klass ? p.klass().name : '', l: p.level, ...data }); const cut = Date.now() - KEEP_MS; if (ev.length > 4000 || (ev[0] && ev[0].t < cut)) ev = ev.filter((e) => e.t >= cut).slice(-3000); dirty = true;
};
const hm = (t) => new Date(t).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
const dayAgo = (e, h) => e.t >= Date.now() - h * 3600 * 1000;
function masters() { // state, not events: everyone with a tradeskill above 25
  const out = []; const dir = path.join(__dirname, 'data', 'players'); const seen = new Set(); const row = (name, skills) => { const hi = Object.entries(skills || {}).filter(([, k]) => k && k.lvl > SKILL_OVER).map(([id, k]) => [(D.T.SKILLS[id] || { name: id }).name, k.lvl]).sort((a, b) => b[1] - a[1]); if (hi.length) out.push({ name, hi }); seen.add(name.toLowerCase()); };
  for (const p of D.players.values()) if (!p.isBot) row(p.name, p.skills);
  try { for (const f of fs.readdirSync(dir)) { if (!f.endsWith('.json')) continue; try { const r = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); if (r.name && !seen.has(r.name.toLowerCase())) row(r.name, r.skills); } catch (e) { /* skip */ } } } catch (e) { /* none yet */ }
  return out.sort((a, b) => b.hi[0][1] - a.hi[0][1] || a.name.localeCompare(b.name)).slice(0, 15);
}
function build(no) {
  const L = [], H = (t) => L.push(['rname', `== ${t} ==`]), P = (t, c = 'items') => L.push([c, t]);
  const quests = ev.filter((e) => e.k === 'quest' && dayAgo(e, 24)).slice(-12).reverse(), levels = {}, deaths = ev.filter((e) => e.k === 'death' && dayAgo(e, 24)).slice(-10).reverse(), fresh = ev.filter((e) => e.k === 'new' && dayAgo(e, 24)).slice(-8).reverse();
  for (const e of ev) if (e.k === 'level' && dayAgo(e, 24)) levels[e.n] = Math.max(levels[e.n] || 0, e.lv);
  const logins = {}; for (const e of ev) if (e.k === 'login' && dayAgo(e, 12)) logins[e.n] = e; const lg = Object.values(logins).sort((a, b) => b.t - a.t).slice(0, 12);
  let board = []; try { board = (D.leaderboard ? D.leaderboard(true) : []).filter((r) => !r.bot).slice(0, 3); } catch (e) { board = []; }
  P(`   M U L T I V E R S E   M A G A Z I N E`, 'rname'); P(`   Issue #${no}   ·   published ${hm(no * ISSUE_MS)}   ·   free to read`, 'sys');
  H('FRONT PAGE'); P(board.length ? `The leaders of the multiverse: ${board.map((r, i) => `${i + 1}. ${r.name} (L${r.lv} ${r.cn}, ${r.score.toLocaleString('en-US')} pts)`).join(', ')}.` : 'The multiverse is quiet. Be the first name in the magazine.'); P(`${[...D.players.values()].filter((p) => !p.isBot).length} adventurers are in the world as this issue goes to press.`);
  H('CONTRACTS COMPLETED'); if (quests.length) for (const e of quests) P(`  * ${e.n} completed "${e.q}" (${hm(e.t)})`); else P('  Nobody has finished a contract in the last day. The board is full.', 'sys');
  H('NEW FACES AND RETURNING HEROES'); if (fresh.length) for (const e of fresh) P(`  * NEW: ${e.n} the ${e.c} arrived in Ashfall (${hm(e.t)}). Say hello!`); if (lg.length) for (const e of lg.filter((x) => !fresh.some((f) => f.n === x.n))) P(`  * ${e.n} (L${e.l} ${e.c}) logged in at ${hm(e.t)}`); if (!fresh.length && !lg.length) P('  A quiet few hours at the gate.', 'sys');
  H('LEVEL-UPS'); const lv = Object.entries(levels).sort((a, b) => b[1] - a[1]).slice(0, 12); if (lv.length) for (const [n, l] of lv) P(`  * ${n} reached level ${l}`); else P('  Nobody has gained a level in the last day.', 'sys');
  H('OBITUARIES'); if (deaths.length) for (const e of deaths) P(`  * ${e.n} (L${e.l} ${e.c}) ${e.by ? `was slain by ${e.by}` : 'died'}${e.where ? ` in ${e.where}` : ''} (${hm(e.t)})`); else P('  Nobody has died in the last day. Suspicious.', 'sys');
  H(`TRADESKILL MASTERS (over level ${SKILL_OVER})`); const m = masters(); if (m.length) for (const r of m) P(`  * ${r.name}: ${r.hi.map(([s, l]) => `${s} ${l}`).join(', ')}`); else P(`  No adventurer has a tradeskill above level ${SKILL_OVER} yet. Go gather something.`, 'sys');
  P(`The next issue is published at ${hm((no + 1) * ISSUE_MS)}.`, 'sys'); return L;
}
function issue() { const no = Math.floor(Date.now() / ISSUE_MS); if (cache.no !== no) cache = { no, lines: build(no), at: Date.now() }; return cache; }
D.news = { log, issue, read(p) { const i = issue(); for (const [c, t] of i.lines) p.msg(t, c); }, events: () => ev, masters };
module.exports = D.news;
