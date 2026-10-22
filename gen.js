'use strict';
// Small shared builders for the newer areas (items, gear and monsters on the same scale as the rest of the game).
module.exports = (items, mobs) => {
  const item = (id, name, type, o) => { items[id] = { name, ids: [id, ...name.toLowerCase().replace(/[^a-z ]/g, '').split(' ').filter((w) => w.length > 2)], type, long: `${name}.`, ...o }; };
  const gear = (id, name, slot, lv, value, long, extra = {}) => { if (slot === 'weapon') item(id, name, 'weapon', { dmg: [Math.round(lv * 2.4), Math.round(lv * 4)], lvl: lv, value, long, ...extra }); else item(id, name, 'armor', { slot, ac: Math.max(2, Math.round(lv * { body: 0.55, head: 0.3, shield: 0.35, feet: 0.25 }[slot])), lvl: lv, value, long, ...extra }); };
  const mob = (id, name, icon, lv, o = {}) => { const b = o.boss ? 1 : 0, m = b ? 1.5 : 1, big = o.big || 1;
    mobs[id] = { name, ids: o.ids || name.toLowerCase().split(' '), icon, level: lv, hp: Math.round(12 * lv ** 1.5 * Math.min(1, 0.3 + lv * 0.05) * (b ? 2.5 : 1) * big), str: 8 + lv, dex: 8 + Math.floor(lv * 0.8), con: 8 + lv, dmg: [Math.round((2 + lv * 1.1) * m * Math.min(1.5, big)), Math.round((5 + lv * 2) * m * Math.min(1.5, big))], ac: Math.floor(lv * 0.9) + (b ? 3 : 0),
      xp: Math.round(10 * lv * (b ? 8 : 1)), boss: !!b, aggro: o.aggro !== false, wander: false, gold: [lv * 3 * (b ? 4 : 1), lv * 8 * (b ? 4 : 1)], drops: [['greater', 0.1], ['firstaid', 0.08], ...(o.drops || [])], ...(o.x || {}) }; };
  return { item, gear, mob };
};
