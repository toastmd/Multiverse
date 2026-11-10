'use strict';
// The future is dangerous: every future area (except the Proving Grounds and Sol and Mercury, which have their own levels) is raised to levels around 200, so only high-remort heroes can take them on.
// Monsters get their new levels, the gear they drop and the shops sell is scaled to match, and the quests that hunt them are scaled too.
const NEW = { aurora: [185, 190], frost: [186, 191], ember: [188, 193], mars: [189, 194], abyss: [192, 196], exterminus: [194, 198], pluto: [196, 200] }; // new level range of each area
module.exports = (items, mobs, rooms) => {
  const mobArea = {}; for (const a of ['pluto', 'exterminus', 'abyss', 'mars', 'ember', 'frost', 'aurora']) for (const r of Object.values(rooms)) if (r.area === a || (r.area || '').startsWith(a)) for (const m of r.mobs || []) if (!mobArea[m] && mobs[m]) mobArea[m] = a;
  const span = {}; for (const [m, a] of Object.entries(mobArea)) { const lv = mobs[m].level; span[a] = span[a] || [lv, lv]; span[a] = [Math.min(span[a][0], lv), Math.max(span[a][1], lv)]; }
  const factor = {}; let n = 0; for (const [m, a] of Object.entries(mobArea)) { const [lo, hi] = span[a], [nlo, nhi] = NEW[a], old = mobs[m].level, lv = hi > lo ? Math.round(nlo + (old - lo) / (hi - lo) * (nhi - nlo)) : Math.round((nlo + nhi) / 2); factor[m] = lv / Math.max(1, old); mobs[m].level = lv; mobs[m].oldLevel = old; n++; }
  // gear: whatever these monsters drop and these shops sell grows with them
  const itemF = {}; const note = (id, f) => { const d = items[id]; if (!d || itemF[id] || !(d.type === 'weapon' || d.type === 'armor')) return; itemF[id] = f; };
  for (const [m, f] of Object.entries(factor)) for (const [id] of mobs[m].drops || []) note(id, f);
  for (const r of Object.values(rooms)) { const a = Object.keys(NEW).find((k) => (r.area || '').startsWith(k)); if (a && r.shop && r.shop.stock) { const f = ((NEW[a][0] + NEW[a][1]) / 2) / Math.max(1, (span[a] ? (span[a][0] + span[a][1]) / 2 : 30)); for (const id of r.shop.stock) note(id, f); } }
  let scaled = 0; for (const [id, f0] of Object.entries(itemF)) { const d = items[id]; if (d._scaled || f0 < 1.5) continue; const f = Math.min(f0, 200 / Math.max(1, d.lvl || 1)); if (f < 1.2) continue; d._scaled = true; d.lvl = Math.min(200, Math.round((d.lvl || 1) * f)); if (d.dmg) d.dmg = [Math.round(d.dmg[0] * f), Math.round(d.dmg[1] * f)]; if (d.ac) d.ac = Math.round(d.ac * f); if (d.value) d.value = Math.round(d.value * f * f); if (d.bonus) for (const k of Object.keys(d.bonus)) d.bonus[k] = Math.round(d.bonus[k] * f); scaled++; }
  return { factor, mobsChanged: n, itemsScaled: scaled, post: () => {} };
};
module.exports.NEW = NEW;
