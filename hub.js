'use strict';
// One big grid per realm. The worlds are separate: no exit leads from one area into another. Ashfall Square has one exit for each realm (oldwest, fantasy, future, modern, prehistoric); each leads
// into a single big grid map that flows from area to area (the old areas are regions of it, joined end to end by short trails), and the way back is `out` from the first room. (The farm
// keeps its own exit at the Square, and Buckstars is still down the stairs.) Ships, the escape pod, portals and the milestone taxi are parked unless config `world.connectedTravel` is true.
const REALMS = {
  oldwest: { label: 'the Old West', trail: 'Dusty Trail', blurb: 'The trail runs on between the regions of the frontier.', areas: ['gulch', 'road', 'mines', 'bank', 'rail'] },
  fantasy: { label: 'the Fantasy Realm', trail: 'Winding Path', blurb: 'A path winds on from one land to the next.', areas: ['blimble', 'forest', 'crypt', 'marsh', 'thorn', 'dunes', 'castle', 'hollow', 'citadel', 'reach', 'sea', 'atlantis', 'camelot', 'otherworld', 'hades', 'olympus', 'asgard', 'cloud'] },
  future: { label: 'the Future', trail: 'Service Walkway', blurb: 'A long walkway of grated metal links one sector to the next.', areas: ['grounds', 'aurora', 'frost', 'ember', 'mars', 'abyss', 'exterminus', 'pluto'] },
  modern: { label: 'the Modern World', trail: 'City Block', blurb: 'The street runs on between one part of the city and the next.', areas: ['modern', 'cinema', 'brogym', 'manor', 'stripclub', 'wrestling'] },
  prehistoric: { label: 'the Prehistoric Age', trail: 'Game Trail', blurb: 'A game trail winds through the ferns between the regions.', areas: ['prime', 'cave'] },
};
const ENTRY = { gulch: 'gulch/a', road: 'road/mile1', mines: 'mines/entry', bank: 'bank/a', rail: 'rail/a', blimble: 'blimble/0_0', forest: 'forest/path', crypt: 'crypt/entry', marsh: 'marsh/edge', thorn: 'thorn/a', dunes: 'dunes/oasis', castle: 'castle/g_0_0', hollow: 'hollow/chapel', citadel: 'cit/gate', reach: 'reach/a', sea: 'sea/0_0', atlantis: 'atlantis/0_0', camelot: 'camelot/0_0', otherworld: 'otherworld/0_0', olympus: 'olympus/0_0', asgard: 'asgard/0_0', hades: 'hades/0_0', cloud: 'cloud/0_0', grounds: 'grounds/gate', aurora: 'aurora/a', frost: 'frost/lodge', ember: 'ember/caldera', mars: 'mars/0_0', abyss: 'abyss/stair', exterminus: 'exterminus/0_0', pluto: 'pluto/0_0', modern: 'modern/gate', cinema: 'cinema/2_0', brogym: 'brogym/2_0', manor: 'manor/0_0', stripclub: 'stripclub/0_0', wrestling: 'wrestling/0_0', prime: 'prime/landing', cave: 'cave/mouth' };
const strip = (r, re) => { if (r && r.long) r.long = r.long.replace(re, '').replace(/\s{2,}/g, ' ').trim(); };
module.exports = (rooms, items) => {
  const keep = (a, b) => ['town', 'buck', 'farm'].includes(a) && ['town', 'buck', 'farm'].includes(b); // Buckstars and the farm stay hung off Ashfall Square
  const links = []; for (const [path, r] of Object.entries(rooms)) for (const [d, to] of Object.entries(r.exits || {})) { const t = rooms[to]; if (t && t.area !== r.area && !keep(r.area, t.area)) links.push([path, d]); }
  for (const [path, d] of links) delete rooms[path].exits[d]; // 1. cut every link between areas
  rooms['town/square'].exits.farm = 'farm/gate'; rooms['farm/gate'].exits.out = 'town/square'; // the farm exit is back at the Square
  const byArea = {}; for (const [path, r] of Object.entries(rooms)) (byArea[r.area] = byArea[r.area] || []).push(path);
  const GAP = [[2, 'e', 'w']];
  for (const [rid, R] of Object.entries(REALMS)) { // 2. lay each realm's areas end to end in one grid
    const occ = new Set(), cell = (x, y, z) => `${x},${y},${z}`; let prev = null, first = true;
    for (const a of R.areas) {
      const paths = byArea[a]; if (!paths || !rooms[ENTRY[a]]) throw new Error(`hub: area ${a} missing (${ENTRY[a]})`); const z0 = rooms[ENTRY[a]].z || 0;
      const flat = paths.filter((p) => (rooms[p].z || 0) === z0), cy = flat.reduce((s, p) => s + rooms[p].y, 0) / flat.length;
      let ox = 0, oy = 0, trail = [], bJoin = null;
      if (prev) {
        const aJoin = prev.flat.filter((p) => !rooms[p].exits.e).sort((p, q) => rooms[q].x - rooms[p].x || Math.abs(rooms[p].y - prev.cy) - Math.abs(rooms[q].y - prev.cy))[0];
        bJoin = flat.filter((p) => !rooms[p].exits.w).sort((p, q) => rooms[p].x - rooms[q].x || Math.abs(rooms[p].y - cy) - Math.abs(rooms[q].y - cy))[0];
        const A = rooms[aJoin]; let k = 1;
        for (; k < 40; k++) { ox = A.x + k + 1 - rooms[bJoin].x; oy = A.y - rooms[bJoin].y; if (paths.every((p) => !occ.has(cell(rooms[p].x + ox, rooms[p].y + oy, (rooms[p].z || 0) - z0)))) break; }
        for (let i = 1; i <= k; i++) { const key = `${rid}/trail_${a}_${i}`; trail.push(key); rooms[key] = { name: R.trail, area: prev.area, x: A.x + i, y: A.y, z: 0, terrain: A.terrain || 'concrete', mobs: [], items: [], exits: {}, long: `${R.blurb} (${prev.area === a ? '' : ''}Behind you is ${prev.label}, ahead is ${a === 'cit' ? 'the citadel' : ''}the next land.)` }; }
        prev.trailNext = { aJoin, trail, bJoin };
      }
      const shiftZ = (z) => (z || 0) - z0, label = require('./lib').AREA_LABEL ? (require('./lib').AREA_LABEL[a] || a) : a;
      for (const p of paths) { const r = rooms[p]; r.x += ox; r.y += oy; r.z = shiftZ(r.z); r.realm = rid; occ.add(cell(r.x, r.y, r.z)); }
      for (const t of trail) { rooms[t].realm = rid; rooms[t].long = rooms[t].long.replace(/\(.*\)$/, '').trim(); }
      if (prev) { // join: previous area's east edge -> the trail -> this area's west edge
        const { aJoin, trail: tr, bJoin: bj } = prev.trailNext; const chain = [aJoin, ...tr, bj]; for (let i = 0; i < chain.length - 1; i++) { rooms[chain[i]].exits.e = chain[i + 1]; rooms[chain[i + 1]].exits.w = chain[i]; }
        for (const t of tr) occ.add(cell(rooms[t].x, rooms[t].y, 0));
      }
      const flat2 = paths.filter((p) => rooms[p].z === 0); prev = { area: a, label, flat: flat2, cy: flat2.reduce((s, p) => s + rooms[p].y, 0) / flat2.length };
      if (first) { first = false; const e = rooms[ENTRY[a]]; e.exits[e.exits.out ? 'gateway' : 'out'] = 'town/square'; rooms['town/square'].exits[rid] = ENTRY[a]; }
    }
  }
  for (const a of Object.keys(byArea)) if (!['town', 'buck', 'farm'].includes(a) && !Object.values(REALMS).some((R) => R.areas.includes(a))) throw new Error('hub: area not in any realm: ' + a);
  // 3. text that pointed at the old connections
  const sq = rooms['town/square']; strip(sq, /\s*[^.]*(?:footprints leads off to Blimble|Farm Gate|type `farm`|type `blimble`)[^.]*\./i);
  sq.long += ' Five great gates stand around the square, one for each realm: `oldwest`, `fantasy`, `future`, `modern` and `prehistoric`. Each opens onto one big map that flows from land to land; `out` from where you entered leads back here. The farm is at the Sunny Acres gate (`farm`).';
  for (const k of ['farm/windmill', 'modern/plz', 'aurora/m', 'dunes/mirage_gate', 'prime/landing']) strip(rooms[k], /\s*[^.]*(?:magic beanstalk|beanstalk as thick|MULTIVERSE CINEMA|escape pod|mysterious portal|`enter portal`|enter portal)[^.]*\./gi);
  const fix = (k, re, to) => { if (rooms[k]) rooms[k].long = rooms[k].long.replace(re, to); };
  fix('cloud/0_0', /\(down: back to Sunny Acres Farm\.\)/, ''); fix('exterminus/0_0', /\(in: the escape pod, back to the Aurora\.\)/, ''); fix('blimble/0_0', /\(out: back to Ashfall\.\)/, '(out: back to Ashfall Square.)'); fix('atlantis/0_0', /\(out: back toward Poseidon's Realm\.\)/, ''); fix('stripclub/0_0', /\(out: back to the street\.\)/, ''); fix('wrestling/0_0', /\(out: back to the street\.\)/, '');
  // 4. no vehicles, pods or portals between worlds
  if (!require('./config')().world.connectedTravel) { delete rooms['aurora/pod']; if (rooms['aurora/m']) delete rooms['aurora/m'].exits.in; for (const r of Object.values(rooms)) if (r.items) r.items = r.items.filter((i) => i !== 'portal' && i !== 'portal_back'); }
  return { REALMS };
};
module.exports.REALMS = REALMS; module.exports.ENTRY = ENTRY;
