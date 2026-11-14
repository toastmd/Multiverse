'use strict';
// The world map: every room of the world laid out on one page, realm by realm (data for the in-game World Map and the guide's World Map page).
// D.worldMap() returns { total, realms, areas, rooms, edges, w, h }; rooms are [areaIndex, x, y, flags, name] in a fixed order (sorted by path), flags 1 = safe, 2 = shop, 4 = boss.
const D = require('./lib');
const LABEL = { town: 'Ashfall', farm: 'Farm and Homestead', buck: 'Buckstars', oldwest: 'The Old West', fantasy: 'The Fantasy Realm', future: 'The Future', modern: 'The Modern World', prehistoric: 'The Prehistoric Realm' };
const ROWS = [['fantasy'], ['future', 'oldwest'], ['modern', 'prehistoric', 'farm', 'town', 'buck']];
let cache = null, at = 0;
const hue = (s) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
D.worldMap = (force) => {
  if (!force && cache && Date.now() - at < 60000) return cache; const rooms = [...D.rooms.values()].filter((r) => r.area !== 'homes' && r.realm !== 'homes' && (r.z || 0) !== -99).sort((a, b) => (a.path < b.path ? -1 : 1));
  const byRealm = {}; for (const r of rooms) (byRealm[r.realm || r.area] = byRealm[r.realm || r.area] || []).push(r);
  const areaIdx = {}, areas = []; for (const r of rooms) if (!(r.area in areaIdx)) { areaIdx[r.area] = areas.length; areas.push({ k: r.area, label: (D.AREA_LABEL && D.AREA_LABEL[r.area]) || r.area, realm: r.realm || r.area, h: hue(r.area), n: 0 }); }
  const pos = {}, panels = {}; // per realm: the main plane (the most common z) and the other floors in a block to its right
  for (const [k, list] of Object.entries(byRealm)) {
    const zc = {}; for (const r of list) zc[r.z || 0] = (zc[r.z || 0] || 0) + 1; const main = +Object.entries(zc).sort((a, b) => b[1] - a[1])[0][0], m = list.filter((r) => (r.z || 0) === main), f = list.filter((r) => (r.z || 0) !== main), bb = (l) => ({ x0: Math.min(...l.map((r) => r.x)), x1: Math.max(...l.map((r) => r.x)), y0: Math.min(...l.map((r) => r.y)), y1: Math.max(...l.map((r) => r.y)) });
    const mb = bb(m), fb = f.length ? bb(f) : null, W = mb.x1 - mb.x0 + 1 + (fb ? 2 + fb.x1 - fb.x0 + 1 : 0), H = Math.max(mb.y1 - mb.y0 + 1, fb ? fb.y1 - fb.y0 + 1 : 0); panels[k] = { k, W, H, mb, fb, m, f };
  }
  const TITLE = 2, GAP = 3; let y = 0, totalW = 0; const place = [];
  for (const row of ROWS) { const ps = row.filter((k) => panels[k]); let x = 0, rh = 0; for (const k of ps) { place.push({ k, x, y: y + TITLE }); x += panels[k].W + GAP; rh = Math.max(rh, panels[k].H); } totalW = Math.max(totalW, x - GAP); y += TITLE + rh + GAP; }
  const out = [], idx = {}, realms = [];
  for (const pl of place) { const P = panels[pl.k]; realms.push({ k: pl.k, label: LABEL[pl.k] || pl.k, x: pl.x, y: pl.y - TITLE, w: P.W, h: P.H + TITLE, n: P.m.length + P.f.length });
    for (const r of P.m) pos[r.path] = [pl.x + r.x - P.mb.x0, pl.y + r.y - P.mb.y0]; for (const r of P.f) pos[r.path] = [pl.x + (P.mb.x1 - P.mb.x0 + 1) + 2 + r.x - P.fb.x0, pl.y + r.y - P.fb.y0]; }
  rooms.forEach((r, i) => { const p = pos[r.path]; idx[r.path] = i; const boss = (r.def.mobs || []).some((m) => D.W.mobs[m] && D.W.mobs[m].boss); areas[areaIdx[r.area]].n++; out.push([areaIdx[r.area], p[0], p[1], (r.def.safe ? 1 : 0) | (r.def.shop ? 2 : 0) | (boss ? 4 : 0), r.name]); });
  const edges = []; for (const r of rooms) for (const [d, to] of Object.entries(r.exits)) { if (!/^(n|s|e|w|ne|nw|se|sw)$/.test(d)) continue; const a = idx[r.path], b = idx[to]; if (b == null || a > b) continue; const pa = pos[r.path], pb = pos[to]; if (Math.abs(pa[0] - pb[0]) <= 1.01 && Math.abs(pa[1] - pb[1]) <= 1.01) edges.push([a, b]); }
  cache = { total: rooms.length, realms, areas, rooms: out, edges, w: totalW, h: y - GAP, order: rooms.map((r) => r.path), idx }; at = Date.now(); return cache;
};
D.worldMapPublic = () => { const d = D.worldMap(); return { total: d.total, realms: d.realms, areas: d.areas, rooms: d.rooms, edges: d.edges, w: d.w, h: d.h }; };
D.worldMapShow = (p) => { const d = D.worldMap(), ex = []; for (const pth of p.explored || []) if (d.idx[pth] != null) ex.push(d.idx[pth]); p.send({ t: 'worldmap', pos: p.env ? d.idx[p.env.path] ?? -1 : -1, ex, total: d.total, exn: ex.length }); p.msg(`WORLD MAP: ${d.total.toLocaleString()} rooms in ${d.realms.length} regions and ${d.areas.length} areas. You have explored ${ex.length.toLocaleString()}. (The map window is open: it shows where you are.)`, 'sys'); };
module.exports = D.worldMap;
