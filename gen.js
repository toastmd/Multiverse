'use strict';
// Small shared builders for the newer areas (items, gear and monsters on the same scale as the rest of the game).
// monster stats from level: health grows with level^1.5 and, above level 100, ever faster (x4 health and x2.2 damage at level 200) so remorted heroes at the level cap still have a fight
const statsFor = (lv, b, big = 1) => { const hs = lv > 100 ? 1 + 3 * (lv - 100) / 100 : 1, ds = lv > 100 ? 1 + 1.2 * (lv - 100) / 100 : 1, m = b ? 1.5 : 1; return { hp: Math.round(12 * lv ** 1.5 * Math.min(1, 0.3 + lv * 0.05) * (b ? 2.5 : 1) * big * hs), str: 8 + lv, dex: 8 + Math.floor(lv * 0.8), con: 8 + lv, dmg: [Math.round((2 + lv * 1.1) * m * Math.min(1.5, big) * ds), Math.round((5 + lv * 2) * m * Math.min(1.5, big) * ds)], ac: Math.floor(lv * 0.9) + (b ? 3 : 0), xp: Math.round(10 * lv * (b ? 8 : 1)), gold: [lv * 3 * (b ? 4 : 1), lv * 8 * (b ? 4 : 1)] }; };
module.exports = (items, mobs) => {
  const item = (id, name, type, o) => { items[id] = { name, ids: [id, ...name.toLowerCase().replace(/[^a-z ]/g, '').split(' ').filter((w) => w.length > 2)], type, long: `${name}.`, ...o }; };
  const gear = (id, name, slot, lv, value, long, extra = {}) => { if (slot === 'weapon') item(id, name, 'weapon', { dmg: [Math.round(lv * 2.4), Math.round(lv * 4)], lvl: lv, value, long, ...extra }); else item(id, name, 'armor', { slot, ac: Math.max(2, Math.round(lv * { body: 0.55, head: 0.3, shield: 0.35, feet: 0.25, neck: 0.15, wrist: 0.12, hands: 0.1, legs: 0.3, face: 0.08, belt: 0.2, ring: 0.1, cloak: 0.2 }[slot])), lvl: lv, value, long, ...extra }); };
  const mob = (id, name, icon, lv, o = {}) => { const b = o.boss ? 1 : 0, m = b ? 1.5 : 1, big = o.big || 1;
    mobs[id] = { name, ids: o.ids || name.toLowerCase().split(' '), icon, level: lv, ...statsFor(lv, b, big), boss: !!b, aggro: o.aggro !== false, wander: false, drops: [['greater', 0.1], ['firstaid', 0.08], ...(o.drops || [])], ...(o.x || {}) }; };
  return { item, gear, mob };
};
module.exports.statsFor = statsFor;
