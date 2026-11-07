'use strict';
// The worlds are separate. No exit leads from one area into another: everything starts at Ashfall Square, which has one great gate for each kind of world
// (oldwest, fantasy, future, modern, prehistoric). Each gate is a gateway room with an exit to every area of that kind, and every area has just one way back to its gate.
// Ashfall's own streets and Buckstars (down from the Square) stay as they were. Ships, the escape pod, portals and the milestone taxi tour are parked unless config `world.connectedTravel` is true.
const GATES = {
  oldwest: { name: 'The Frontier Gate', areas: ['road', 'mines', 'gulch', 'bank', 'rail', 'farm'], long: 'A tall gate of weathered timber and iron under a creaking sign: THE FRONTIER. Beyond it dust devils skip along the old trail, and the smell of whiskey, cattle and gun oil drifts in on the wind. Type the name of a place to go there. Out leads back to Ashfall Square. A safe place.' },
  fantasy: { name: 'The Fantasy Gate', areas: ['blimble', 'forest', 'crypt', 'marsh', 'dunes', 'citadel', 'thorn', 'reach', 'hollow', 'castle', 'cloud', 'sea', 'hades'], long: 'A great arch of living white stone wreathed in glowing vines. Through it you glimpse enchanted woods, crumbling citadels, sunken seas and castles in the clouds. Type the name of a land to go there (blimble is the best place for new runners). Out leads back to Ashfall Square. A safe place.' },
  future: { name: 'The Future Gate', areas: ['frost', 'ember', 'abyss', 'aurora', 'mars', 'pluto', 'grounds', 'exterminus'], long: 'A smooth gate of brushed steel with a ring of cold blue light and a sliding door that whispers open. Through it: frozen stations, burning wastes, derelict starships and the red dust of other worlds. Type the name of a world to go there (grounds is the safe place to train). Out leads back to Ashfall Square. A safe place.' },
  modern: { name: 'The Modern Gate', areas: ['modern', 'brogym', 'cinema', 'manor'], long: 'A glass revolving door with a neon sign: MODERN LIFE. Beyond it you hear traffic, a distant siren and the beep of a cash register. Type the name of a place to go there. Out leads back to Ashfall Square. A safe place.' },
  prehistoric: { name: 'The Prehistoric Gate', areas: ['prime', 'cave'], long: 'A rough gate of mammoth tusks and lashed logs, hung with bones and feathers. A warm, wet wind brings the roar of something very large. Type the name of a place to go there. Out leads back to Ashfall Square. A safe place.' },
};
const ENTRY = { road: 'road/mile1', mines: 'mines/entry', gulch: 'gulch/a', bank: 'bank/a', rail: 'rail/a', farm: 'farm/gate', blimble: 'blimble/0_0', forest: 'forest/path', crypt: 'crypt/entry', marsh: 'marsh/edge', dunes: 'dunes/oasis', citadel: 'cit/gate', thorn: 'thorn/a', reach: 'reach/a', hollow: 'hollow/chapel', castle: 'castle/g_0_0', cloud: 'cloud/0_0', sea: 'sea/0_0', hades: 'hades/0_0', frost: 'frost/lodge', ember: 'ember/caldera', abyss: 'abyss/stair', aurora: 'aurora/a', mars: 'mars/0_0', pluto: 'pluto/0_0', grounds: 'grounds/gate', exterminus: 'exterminus/0_0', modern: 'modern/gate', brogym: 'brogym/2_0', cinema: 'cinema/2_0', manor: 'manor/0_0', prime: 'prime/landing', cave: 'cave/mouth' };
const strip = (r, re) => { if (r && r.long) r.long = r.long.replace(re, '').replace(/\s{2,}/g, ' ').trim(); };
module.exports = (rooms, items) => {
  const genreOf = {}; for (const [g, d] of Object.entries(GATES)) for (const a of d.areas) genreOf[a] = g;
  const entryOf = {}; for (const [a, path] of Object.entries(ENTRY)) { if (!rooms[path]) throw new Error(`hub: no entry room ${path} for ${a}`); entryOf[a] = path; }
  const keep = (a, b) => (a === 'town' && b === 'buck') || (a === 'buck' && b === 'town'); // Buckstars is Ashfall's own basement cafe
  const links = []; for (const [path, r] of Object.entries(rooms)) for (const [d, to] of Object.entries(r.exits || {})) { const t = rooms[to]; if (t && t.area !== r.area && !keep(r.area, t.area)) links.push([path, d, to]); }
  // 1. cut every link between areas
  for (const [path, d] of links) delete rooms[path].exits[d];
  // 2. the gateway rooms
  let gx = 0; for (const [g, def] of Object.entries(GATES)) {
    rooms['gates/' + g] = { name: def.name, area: 'gates', x: gx++ * 2, y: 0, z: 0, terrain: 'stone', safe: true, camp: true, mobs: [], items: [], long: def.long, exits: { out: 'town/square' } };
    for (const a of def.areas) rooms['gates/' + g].exits[a] = entryOf[a];
    rooms['town/square'].exits[g] = 'gates/' + g;
  }
  // 3. every area has one way back to its gate: `out` from its entrance room (or `gateway` if `out` is already used there)
  for (const a of Object.keys(entryOf)) { const e = rooms[entryOf[a]], gate = 'gates/' + genreOf[a]; if (!Object.values(e.exits).includes(gate)) e.exits[e.exits.out ? 'gateway' : 'out'] = gate; }
  // 4. text that pointed at the old connections
  const sq = rooms['town/square']; strip(sq, /\s*[^.]*(?:footprints leads off to Blimble|Farm Gate|type `farm`|type `blimble`)[^.]*\./i); sq.long += ' Five great gates stand around the square, one for each kind of world: `oldwest`, `fantasy`, `future`, `modern` and `prehistoric`. Each leads to a gateway with a way into every land of that kind.';
  for (const k of ['farm/windmill', 'modern/plz', 'aurora/m', 'dunes/mirage_gate', 'prime/landing']) strip(rooms[k], /\s*[^.]*(?:magic beanstalk|beanstalk as thick|MULTIVERSE CINEMA|escape pod|`enter portal`|enter portal)[^.]*\./gi);
  const fix = (k, re, to) => { if (rooms[k]) rooms[k].long = rooms[k].long.replace(re, to); }; fix('cloud/0_0', /\(down: back to Sunny Acres Farm\.\)/, '(out: back to the Fantasy Gate.)'); fix('exterminus/0_0', /\(in: the escape pod, back to the Aurora\.\)/, '(out: back to the Future Gate.)'); fix('blimble/0_0', /\(out: back to Ashfall\.\)/, '(out: back to the Fantasy Gate.)');
  // 5. no vehicles, pods or portals between worlds
  if (!require('./config')().world.connectedTravel) { delete rooms['aurora/pod']; if (rooms['aurora/m']) delete rooms['aurora/m'].exits.in; for (const r of Object.values(rooms)) if (r.items) r.items = r.items.filter((i) => i !== 'portal' && i !== 'portal_back'); }
  return { genreOf, entryOf };
};
module.exports.GATES = GATES; module.exports.ENTRY = ENTRY;
