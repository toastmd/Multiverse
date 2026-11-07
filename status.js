'use strict';
// Negative enhancements: in combat a landed blow (from a player or a monster) has a small chance to leave bleeding, burning, poisoned, freezing, blinded, charmed, grappled or petrified.
const D = require('./lib');
const DEF = {
  bleeding: { ticks: 6, dot: [0.012, 0.02], verb: 'drains', say: 'is bleeding', msg: 'You are bleeding!' },
  burning: { ticks: 4, dot: [0.025, 0.04], verb: 'sears', say: 'is on fire', msg: 'You are burning!' },
  poisoned: { ticks: 10, dot: [0.008, 0.014], verb: 'sickens', say: 'is poisoned', msg: 'You are poisoned!' },
  freezing: { ticks: 5, pool: -4, skip: 0.25, say: 'is freezing', msg: 'You are freezing: you are slower and clumsier!' },
  blinded: { ticks: 5, pool: -7, say: 'is blinded', msg: 'You are blinded: you can barely see!' },
  charmed: { ticks: 4, skip: 0.5, say: 'is charmed', msg: 'You are charmed: your heart is not in the fight!' },
  grappled: { ticks: 4, grapple: 1, dpool: -3, say: 'is grappled', msg: 'You are grappled: you cannot move or flee!' },
  petrified: { ticks: 3, stun: 1, say: 'is turned to stone', msg: 'You are PETRIFIED: you cannot act!' },
};
const NAMES = Object.keys(DEF);
const BIAS = { dagger: { bleeding: 4 }, axe: { bleeding: 3 }, sword: { bleeding: 2 }, spear: { bleeding: 2 }, trident: { bleeding: 2 }, shuriken: { bleeding: 3, poisoned: 3 }, firearm: { bleeding: 2 }, energy: { burning: 3, freezing: 3, blinded: 2 }, explosive: { burning: 4, blinded: 2 }, blowgun: { poisoned: 6 }, bow: { poisoned: 2 }, crossbow: { poisoned: 2 }, flail: { grappled: 4 }, unarmed: { grappled: 3, charmed: 2 }, wand: { charmed: 3, petrified: 2, freezing: 2 }, hammer: { petrified: 2 }, mace: { petrified: 1 }, boomerang: { blinded: 3 }, sling: { blinded: 2 } };
function apply(src, t, name) {
  const d = DEF[name]; if (!d || !t.addFx || t.hp <= 0) return false; const e = { k: d.dot ? 'dot' : d.stun ? 'stun' : 'status', n: name, status: 1, ticks: d.ticks, src };
  if (d.dot) { const lo = Math.max(1, Math.round(t.maxhp * d.dot[0])), hi = Math.max(lo, Math.round(t.maxhp * d.dot[1])); Object.assign(e, { dmg: [lo, hi], verb: d.verb }); } for (const k of ['pool', 'skip', 'grapple', 'dpool']) if (d[k]) e[k] = d[k];
  t.addFx(e); if (t.msg) t.msg(d.msg, 'hurt'); if (src && src.msg && src !== t) src.msg(`${D.cap(t.the ? t.the() : t.name)} ${d.say}!`, 'win'); return true;
}
function maybe(att, t, hand) { // called after a blow lands
  if (!t || t.hp <= 0 || !t.addFx || t.def && t.def.noStatus) return; let chance = 0.05 + (att.def && att.def.boss ? 0.03 : 0); chance *= 1 - Math.min(0.5, (t.con || 10) / 400); if (Math.random() >= chance) return;
  let pool; if (att.isPlayer) { const w = hand === 'off' ? att.equip.offhand : att.equip.weapon, wt = w ? D.wtype(w) : 'unarmed', b = BIAS[wt] || {}; pool = NAMES.map((n) => [n, 1 + (b[n] || 0)]); } else { const inf = att.def && att.def.inflicts; pool = (inf && inf.length ? inf : NAMES).map((n) => [n, 1]); }
  let r = Math.random() * pool.reduce((s, x) => s + x[1], 0); for (const [n, w] of pool) { if ((r -= w) < 0) return apply(att, t, n); }
}
function cure(p, names) { const before = p.fx.length; p.fx = p.fx.filter((e) => !(e.status && (!names || names.includes(e.n)))); if (before !== p.fx.length && p.msg) p.msg('You feel the affliction pass.', 'win'); }
D.status = { apply, maybe, cure, DEF, NAMES };
module.exports = D.status;
