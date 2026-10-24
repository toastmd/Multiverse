// Audits the map layout: every compass exit must lead to the room that sits in that direction on the same map level, with no two rooms in one cell
// and a way back. Links between separate map levels (portals, in/out, up/down and the area connectors) are listed, not failed. Usage: node tools/check_layout.js
const D = require('../lib'); D.loadWorld();
const V = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0], ne: [1, -1], nw: [-1, -1], se: [1, 1], sw: [-1, 1] }, bad = [], links = [], cell = {}, oneway = [];
for (const r of D.rooms.values()) { if (r.def.hidden) continue; const k = `${r.area}|${r.z}|${r.x}|${r.y}`; (cell[k] = cell[k] || []).push(r.path);
  for (const [d, to] of Object.entries(r.exits)) { const t = D.rooms.get(to); if (!t) { bad.push(`${r.path} ${d} -> missing room ${to}`); continue; }
    if (V[d]) { if (t.area !== r.area || t.z !== r.z) links.push(`${r.path} ${d} -> ${to} (another map level)`); else if (t.x !== r.x + V[d][0] || t.y !== r.y + V[d][1]) bad.push(`${r.path} ${d} -> ${to}: ${r.x},${r.y} does not step ${d} to ${t.x},${t.y}`); }
    if (!Object.values(t.exits).includes(r.path)) oneway.push(`${r.path} ${d} -> ${to}`); } }
for (const [k, v] of Object.entries(cell)) if (v.length > 1) bad.push(`two rooms in one cell: ${v.join(' + ')}`);
console.log(`rooms: ${D.rooms.size}; layout problems: ${bad.length}; one-way exits: ${oneway.length}; level links: ${links.length}`); for (const l of [...bad, ...oneway.map((x) => 'one-way ' + x)]) console.log('  ' + l); process.exit(bad.length || oneway.length ? 1 : 0);
