'use strict';
// Random goddess blessing: now and then one of the four goddesses smiles on a random online player and grants +40% experience for one hour. Everyone hears about it.
const D = require('./lib'), HOUR = 3600 * 1000, BONUS = 0.4;
let nextAt = Date.now() + (5 + Math.random() * 10) * 60000, last = '';
const left = (p) => Math.max(0, (p.blessUntil || 0) - Date.now());
function grant(p, id) {
  const g = D.DEITIES[id]; p.blessUntil = Date.now() + HOUR; p.blessBy = id; p.sendStats && p.sendStats();
  p.msg(`*** ${g.name}, ${g.title}, smiles upon you! For one hour you gain +${Math.round(BONUS * 100)}% experience from everything. ***`, 'win'); if (p.send) p.send({ t: 'sound', k: 'levelup' }); if (D.showDeityPic) D.showDeityPic(p, id);
  D.announce(`\u2728 ${g.name}, ${g.title}, has blessed ${p.name} with +${Math.round(BONUS * 100)}% experience for one hour!`, 'bless');
}
function tick() {
  if (Date.now() < nextAt) return; const pool = [...D.players.values()].filter((p) => !p.isBot && !p.ld && p.send && !left(p) && p.name !== last);
  nextAt = Date.now() + (30 + Math.random() * 40) * 60000; if (!pool.length) return; const p = pool[D.rnd(0, pool.length - 1)], ids = Object.keys(D.DEITIES); last = p.name; grant(p, ids[D.rnd(0, ids.length - 1)]);
}
setInterval(tick, 60000).unref();
D.blessing = { grant, left, BONUS, status(p) { const l = left(p); if (!l) return p.msg(`No goddess has blessed you right now. Now and then one of them picks a random player online and grants +${Math.round(BONUS * 100)}% experience for an hour.`, 'sys'); p.msg(`${D.DEITIES[p.blessBy].name} has blessed you: +${Math.round(BONUS * 100)}% experience for another ${D.dur(l)}.`, 'win'); } };
module.exports = D.blessing;
