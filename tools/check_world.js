// Sanity check for the world: every room reachable from Ashfall Square and every exit has a way back. Usage: node tools/check_world.js
const D = require('../lib'); D.loadWorld(); const R = D.W.rooms, OPP = { n: 's', s: 'n', e: 'w', w: 'e', u: 'd', d: 'u' };
const seen = new Set(['town/square']), q = ['town/square']; while (q.length) for (const n of Object.values(R[q.shift()].exits)) if (R[n] && !seen.has(n)) { seen.add(n); q.push(n); }
const lost = Object.keys(R).filter((k) => !seen.has(k)), bad = []; for (const [id, r] of Object.entries(R)) for (const [d, to] of Object.entries(r.exits)) if (!R[to] || R[to].exits[OPP[d]] !== id) bad.push(`${id} ${d} -> ${to}`);
console.log(`${Object.keys(R).length} rooms, ${seen.size} reachable; unreachable: ${lost.join(', ') || 'none'}; broken or one-way exits: ${bad.join('; ') || 'none'}`); process.exit(lost.length || bad.length ? 1 : 0);
