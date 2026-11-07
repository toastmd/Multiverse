'use strict';
// Task points: every 5 levels you earn a task point, which raises one stat by 1 (up to +50 each). They are saved through every remort.
const D = require('./lib');
const STATS = { brawn: ['Brawn', 'strength: more damage'], reflex: ['Reflex', 'dexterity: hit and dodge more'], grit: ['Grit', 'constitution: more health'], mind: ['Mind', 'intelligence: more mana'], will: ['Will', 'willpower: more luck'], charm: ['Charm', 'charm: better loot shares'] };
const ALIAS = { str: 'brawn', strength: 'brawn', dex: 'reflex', dexterity: 'reflex', con: 'grit', constitution: 'grit', int: 'mind', intelligence: 'mind', willpower: 'will', cha: 'charm', charisma: 'charm' }, CAP = 50;
D.tasks = {
  STATS, CAP, onLevel(p) { if (p.isBot || p.level % 5) return; p.tp = p.tp || { pts: 0 }; p.tp.pts++; p.msg(`*** You earned a TASK POINT (level ${p.level})! Spend it on a stat: type \`task\`. Task points are kept through every remort. ***`, 'task'); },
  show(p) { const t = p.tp || { pts: 0 }; p.msg(`TASK POINTS: ${t.pts || 0} to spend. You earn one every 5 levels, and they (and what you spend them on) are kept through every remort.`, 'task'); for (const [k, [n, d]] of Object.entries(STATS)) p.msg(`  ${k.padEnd(7)} ${n.padEnd(7)} +${t[k] || 0}/${CAP}  (${d})`, 'task'); p.msg('Spend one with `task <stat>` (for example `task brawn`), or several with `task brawn 3`.', 'task'); },
  spend(p, a) {
    const m = a.trim().toLowerCase().match(/^(\w+)(?:\s+(\d+))?$/); if (!m) return D.tasks.show(p); const k = STATS[m[1]] ? m[1] : ALIAS[m[1]]; if (!k) return p.msg('Spend it on brawn, reflex, grit, mind, will or charm.', 'sys');
    p.tp = p.tp || { pts: 0 }; let n = Math.max(1, Math.min(50, parseInt(m[2] || '1', 10))); n = Math.min(n, p.tp.pts || 0, CAP - (p.tp[k] || 0)); if (n <= 0) return p.msg((p.tp.pts || 0) <= 0 ? 'You have no task points to spend.' : `${STATS[k][0]} is already at its limit (+${CAP}).`, 'sys');
    p.tp.pts -= n; p.tp[k] = (p.tp[k] || 0) + n; p.recalc(); p.sendStats(); p.msg(`You put ${n} task point${n > 1 ? 's' : ''} into ${STATS[k][0]}: it is now +${p.tp[k]}. (${p.tp.pts} left)`, 'task');
  },
};
module.exports = D.tasks;
D.cleanTp = (rec) => { // task points: sanitize what was saved; older characters are credited for the levels they already reached (every 5 levels, and 8 per remort)
  const out = { pts: 0 }, tp = rec.tp;
  if (tp && typeof tp === 'object') { out.pts = Math.max(0, Math.min(5000, tp.pts | 0)); for (const k of Object.keys(STATS)) out[k] = Math.max(0, Math.min(CAP, tp[k] | 0)); }
  else out.pts = Math.floor((rec.level | 0) / 5) + 8 * (rec.remort | 0);
  return out;
};
