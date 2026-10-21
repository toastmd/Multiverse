'use strict';
// Loads areas created with the grid builder (data/custom/*.json) into the world. Called from world.js on every (re)load.
const fs = require('fs'), path = require('path');
const DIR = path.join(__dirname, 'data', 'custom'), OPP = { n: 's', s: 'n', e: 'w', w: 'e', u: 'd', d: 'u', ne: 'sw', sw: 'ne', nw: 'se', se: 'nw', in: 'out', out: 'in' };

const genMob = (id, m) => { // same stat curve as the built-in monsters
  const lv = Math.max(1, Math.min(40, +m.level || 1)), b = m.boss ? 1 : 0, k = b ? 1.5 : 1;
  return { name: String(m.name).slice(0, 40), ids: [id], icon: String(m.icon || '👾').slice(0, 4), level: lv, boss: !!b,
    hp: Math.round(12 * lv ** 1.5 * Math.min(1, 0.3 + lv * 0.05) * (1 + Math.max(0, lv - 24) * 0.06) * (b ? 2.5 : 1)), str: 8 + lv, dex: 8 + Math.floor(lv * 0.8), con: 8 + lv,
    dmg: [Math.round((2 + lv * 1.1) * k), Math.round((5 + lv * 2) * k)], ac: Math.floor(lv * 0.9) + (b ? 3 : 0), xp: Math.round(10 * lv * (b ? 8 : 1)),
    aggro: m.aggro ?? lv >= 6, wander: !!m.wander, gold: [lv * 3 * (b ? 4 : 1), lv * 8 * (b ? 4 : 1)],
    drops: [[lv < 8 ? 'potion' : lv < 18 ? 'strong' : lv < 28 ? 'greater' : lv < 36 ? 'superior' : 'grand', 0.2], [lv < 14 ? 'mana1' : lv < 24 ? 'mana2' : lv < 34 ? 'mana3' : 'mana4', 0.1]] };
};

module.exports = (rooms, mobs, items) => {
  if (!fs.existsSync(DIR)) return;
  for (const f of fs.readdirSync(DIR).filter((x) => x.endsWith('.json'))) {
    let a; try { a = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')); } catch (e) { console.log('bad custom area', f, e.message); continue; }
    const aid = String(a.id || '').replace(/[^a-z0-9_]/g, ''); if (!aid) continue; const o = a.origin || { x: 30, y: 30, z: 0 }, own = {};
    for (const [id, m] of Object.entries(a.mobs || {})) { own[id] = `${aid}_${id}`; mobs[own[id]] = genMob(own[id], m); }
    const full = (id) => `${aid}/${id}`, mine = new Set((a.rooms || []).map((r) => r.id));
    for (const r of a.rooms || []) {
      const def = { name: r.name, area: aid, x: o.x + r.gx, y: o.y + r.gy, z: (o.z || 0) + (r.gz || 0), long: r.long || 'An unfinished room.', terrain: r.terrain || a.terrain || 'dirt', exits: {}, custom: true,
        mobs: (r.mobs || []).map((m) => own[m] || m).filter((m) => mobs[m]), items: (r.items || []).filter((i) => items[i]) };
      for (const k of ['safe', 'camp', 'inn', 'healer', 'forge']) if (r.flags && r.flags[k]) def[k] = true;
      if (r.res && Object.keys(r.res).length) def.res = r.res;
      if (r.shop && r.shop.length) def.shop = { stock: r.shop.filter((i) => items[i]) };
      for (const [d, to] of Object.entries(r.exits || {})) if (OPP[d] && mine.has(to)) def.exits[d] = full(to);
      rooms[full(r.id)] = def;
    }
    for (const r of a.rooms || []) { // make internal exits two-way, then attach external links in both directions
      const def = rooms[full(r.id)];
      for (const [d, to] of Object.entries(def.exits)) if (!rooms[to].exits[OPP[d]]) rooms[to].exits[OPP[d]] = full(r.id);
      for (const [d, to] of Object.entries(r.ext || {})) if (OPP[d] && rooms[to]) { def.exits[d] = to; if (!rooms[to].exits[OPP[d]]) rooms[to].exits[OPP[d]] = full(r.id); }
    }
  }
};
