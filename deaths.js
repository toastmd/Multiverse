'use strict';
// Death tally: every player death is logged with the time, the player and the NPC that killed them, and counted per killer. Saved in data/deaths.json.
const fs = require('fs'), path = require('path'), D = require('./lib');
const FILE = path.join(__dirname, 'data', 'deaths.json'), MAXLOG = 1000; let db = { log: [], tally: {} }, timer = null;
try { const j = JSON.parse(fs.readFileSync(FILE, 'utf8')); db = { log: j.log || [], tally: j.tally || {} }; } catch (e) { /* no deaths recorded yet */ }
const save = () => { clearTimeout(timer); timer = setTimeout(() => { try { fs.mkdirSync(path.dirname(FILE), { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(db)); } catch (e) { D.log('deaths save failed:', e.message); } }, 1000); };
const stamp = (t) => new Date(t).toISOString().slice(0, 16).replace('T', ' ') + ' UTC', cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
function record(p, killer) { // called when a player dies; killer is the monster or NPC that landed the blow
  const by = killer && killer !== D.NOBODY && killer.name ? cap(killer.name) : 'Unknown causes', e = { t: Date.now(), who: p.name, by, lvl: (killer && killer.level) || 0, boss: !!(killer && killer.def && killer.def.boss), where: (p.env && p.env.name) || '' };
  db.log.push(e); if (db.log.length > MAXLOG) db.log.shift(); db.tally[by] = (db.tally[by] || 0) + 1; save(); return e;
}
function cmd(p, a) { // deaths | deaths 30 | deaths <player> | deaths top
  a = a.trim(); const top = /^(top|tally)$/i.test(a), n = Math.min(50, Math.max(1, parseInt(a, 10) || 15)), who = !top && a && !/^\d+$/.test(a) ? a.toLowerCase() : '';
  const rows = db.log.filter((e) => !who || e.who.toLowerCase().startsWith(who)), total = Object.values(db.tally).reduce((s, v) => s + v, 0);
  if (!top) {
    p.msg(who ? `Deaths of players matching "${a}" (most recent first):` : `Recent player deaths (most recent first, ${rows.length} of ${db.log.length} logged):`, 'rname');
    if (!rows.length) p.msg(who ? 'No deaths recorded for that player.' : 'Nobody has died yet. Give it time.', 'sys');
    rows.slice(-n).reverse().forEach((e) => p.msg(`${stamp(e.t)}  ${e.who} was killed by ${e.by}${e.lvl ? ` (level ${e.lvl})` : ''}${e.where ? ` in ${e.where}` : ''}${e.boss ? ' [boss]' : ''}`, 'sys'));
  }
  const tally = Object.entries(db.tally).sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0]));
  p.msg(`Deadliest NPCs (${total} death${total === 1 ? '' : 's'} in all):`, 'rname'); if (!tally.length) p.msg('  none yet', 'sys');
  tally.slice(0, top ? 25 : 8).forEach(([name, c], i) => p.msg(`  ${String(i + 1).padStart(2)}. ${name}: ${c}`, 'sys'));
  if (!top) p.msg('`deaths 30` shows more, `deaths <player>` filters by player, `deaths top` shows only the tally.', 'sys');
}
module.exports = { record, cmd, stamp, state: () => db, flush: () => { clearTimeout(timer); try { fs.mkdirSync(path.dirname(FILE), { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(db)); } catch (e) { /* best effort */ } } };
