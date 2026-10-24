'use strict';
// Builds the MULTIVERSE MUD player guide (public/guide/) from the live game data, so it never goes out of date.
// Run: node tools/build_guide.js   (the server serves the result at /guide/)
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), OUT = path.join(ROOT, 'public', 'guide'), IMG = path.join(OUT, 'img');
process.chdir(ROOT);
const D = require('../lib'); require('../commands'); D.loadWorld();
const art = require('./make_art'), PORT = require('../public/portrait.js');
fs.mkdirSync(IMG, { recursive: true });

const CATALOG = [...D.rooms.values()].filter((r) => !r.def.custom && !r.def.hidden); // built-in rooms only (the taxi cab is hidden)
const ROOM = Object.fromEntries(CATALOG.map((r) => [r.path, r]));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const nm = (id) => (D.W.items[id] || {}).name || id, cap = (s) => s[0].toUpperCase() + s.slice(1), num = (n) => Math.round(n).toLocaleString('en-US');
const writeImg = (name, svg) => { if (fs.existsSync(path.join(IMG, name.replace(/\.svg$/, '.jpg')))) return; fs.writeFileSync(path.join(IMG, name), svg); }; // rendered JPEGs (tools/render_art.py) win over the old SVG art
const AREAS = { // display name, level band blurb, short description
  town: ['Ashfall Junction', 'Safe hub · Old West', 'An Old West boom town where the roads between worlds meet: the Silver Spur Saloon, shops, temple, Chrome Clinic, guild and the Hall of Rebirth. Almost every room here is safe from combat.'],
  forest: ['Whisperwood', 'Levels 1 to 7 · Fantasy', 'An enchanted forest of goblins, wolves and herbs. The classic first hunting ground, with a safe camp for resting.'],
  crypt: ['Barrow Crypts', 'Levels 4 to 9 · Fantasy', 'Skeletons, ghouls and a warlord beneath the fallen chapel. Stone corridors and a quiet reliquary.'],
  marsh: ['Sunken Marsh', 'Levels 8 to 13 · Fantasy', 'A fetid marsh east of the forest stream: leeches, crocodiles, a hag and a hydra. Great for fish and herbs.'],
  road: ['Redrock Trail', 'Levels 12 to 16 · Old West', 'Outlaw country east of Ashfall, with the town of Dry Gulch and its Rattlesnake Saloon. Outlaws and Red Jack Calloway guard the crossroads to the Dunes and Frostpeak.'],
  mines: ['Silverado Mines', 'Levels 12 to 17 · Old West', 'A gold-rush mining camp reached from the Old Quarry, with the Lucky Strike Saloon. Cave spiders, claim jumpers and a golem-guarded forge. Best place for ore and silver.'],
  dunes: ['Sunscorch Dunes', 'Levels 18 to 24 · Fantasy', 'A desert of mummies and sphinxes with the Dune Bazaar, a wraith obelisk, ruins and the pharaoh\'s tomb below.'],
  frost: ['Frostpeak Station', 'Levels 24 to 30 · Sci-fi', 'A research outpost on an ice moon: cryo-beasts, a snowbound pass and the Cryo Titan\'s hall. Gear up at the station hangar.'],
  ember: ['Ember Wastes', 'Levels 30 to 34 · Sci-fi', 'A volcanic colony world of ash, lava and plasma creatures, ending at the Magma Titan\'s caldera.'],
  citadel: ['Shattered Citadel', 'Levels 35 to 38 · Fantasy', 'A fallen castle ruled by the undead Dread Marshal. Its throne hides the stair to the Abyss.'],
  abyss: ['The Abyss', 'Levels 39 to 40 · Sci-fi', 'The void between the worlds: stalkers, horrors and the Voidlord, the final boss.'],
  gulch: ['Tombstone Gulch', 'Levels 10 to 14 · Old West', 'A ghost town off the Redrock Trail, with the Silver Dollar Saloon, a general store and Sheriff Whitlock. Ghost outlaws, skeleton deputies and Ghost Marshal Dalton in the bank vault.'],
  thorn: ['Thornwild Court', 'Levels 15 to 19 · Fantasy', 'A fey realm of briars and mushrooms beyond the marsh causeway, with the Moonwell, the Pixie Market and Warden Sylwen. Pixie thieves, fey hounds and Thorn Queen Mab.'],
  aurora: ['Starship Aurora', 'Levels 22 to 26 · Sci-fi', 'A crashed starship in the Sunscorch Dunes, with a survivors galley, a med bay and a quartermaster. Security drones, mutated crew and the ship mind Helix on the bridge.'],
  reach: ['The Drowned Reach', 'Levels 27 to 31 · Fantasy', 'A sunken kingdom beneath the frozen waterfall, with the Tidal Chapel, the Pearl Market and Captain Marrow. Drowned sailors, sirens and the Leviathan of the Reach.'],
  rail: ['Brimstone Rail Yard', 'Levels 32 to 36 · Old West', 'A hellish railroad depot past the Basalt Steps, with the Brimstone Saloon Car and Stationmaster Cobb. Coal demons, imp conductors and the Brimstone Express itself.'],
  bank: ['Dry Gulch Bank', 'Levels 15 to 17 · Old West', 'A frontier bank beside the Rattlesnake Saloon. Hold up tellers and customers, kill Bank Manager Ebenezer Crane for the vault key, then unlock and loot the vault. The Bank Robbery contract from Slick Sam can be repeated.'],
  modern: ['Modern District', 'Levels 10 to 16 · Modern', 'Step up through the arch in Ashfall Square into a modern strip: the Multi-Mart superstore with departments, Westfield Shopping Center, Sunset Acres Trailer Park, burgers, hot dogs, soda and two gas stations with restrooms, plus Meridian Tower, an eleven-level office building (a basement and ten floors, reached by elevator) whose top-floor CEO is guarded by three bodyguards. Modern gear, shoppers, stockers, trailer park brawlers and corporate zombies.'],
  grounds: ['The Proving Grounds', 'Levels 1 to 40 · Bots', 'A fenced training field behind a little gate in the Ashfall back alley (type in). The resident adventurers Zeph and Rook train here so they stay out of everyone else\'s way, and it is full of monsters from every level. You are welcome to visit.'],
  prime: ['The Primeval Rift', 'Levels 21 to 28 · Prehistoric', 'Step into the mysterious portal at the Mirage Gate in the Sunscorch Dunes (enter portal) and you arrive in a prehistoric valley of tree ferns, tar pits and dinosaurs: raptors, pterosaurs, triceratops, stegosaurs, allosaurs, a spinosaur and Rex the Tyrant. Dr. Mara Quill runs the camp at the landing.'],
  mars: ['Mars', 'Levels 30 to 40 · Sci-fi', 'Reached by the starship Tharsis, docked beside Frostpeak Station (go in, north twice, then launch in the cockpit). A 100-room red planet of little green Martians with ray guns, laid out in a 10 by 10 grid: dust flats and craters near the landing pad, then a canyon of snipers, a Martian city of saucer pilots and officers, and the Overlord\'s citadel at the far corner. Commander Reyes at the landing pad gives the quests; the Martian Overlord Zorgblat carries the unique Death Ray Gun.'],
  manor: ['Golden Years Manor', 'Levels 12 to 18 · Modern', 'A haunted retirement community at the end of Commerce Avenue (in). Its restless residents are undead and ghosts: zombie grandmas, bingo-calling ghosts, walker wraiths, denture biters and the Queen of Bingo herself, Matriarch Edna, in the Memory Care Wing. Nurse Dolores asks you to put them to rest.'],
  buck: ['Buckstars Coffee Shop', 'Levels 1 to 4 · Modern · the newbie area', 'The starting area for new runners: a 30-room Buckstars Coffee Shop, reached with down from Ashfall Square. Everything you would find in a coffee shop (order counter, espresso bar, pastry case, condiment bar, couches, restrooms, back rooms, drive-thru, dumpster alley) with caffeinated zombies, jittery baristas, ice machine imps and, in the Roasting Room, a level 4 boss: Overcaffeinated Brenda, the store manager. Shift Supervisor Sam gives the quest, and Barista Bree sells coffee, pastries, an apron and a tamper club.'],
  cave: ['The Mammoth Caverns', 'Levels 26 to 33 · Prehistoric', 'A three-level cave system under the Primeval Rift, entered with in from Stegosaur Valley: the painted upper caves of the Mammoth Clan, dripping tunnels with crystals, creepers and a mammoth graveyard, and the deep throne cavern of Grog the Great, a very large caveman with a very large club. Elder Ugga keeps the fire at the cave mouth.'],
  hollow: ['Nightfall Hollow', 'Levels 33 to 39 · Fantasy', 'Past the Shattered Citadel\'s crypt gate (type in) lies a cursed village under a sky with no stars: vampires in their manor, werewolves in the woods, witches at the crossroads and demons at the Brimstone Gate. Father Aldric runs the hunters\' chapel.'],
};
const AREA_COL = { town: '#ffd34a', forest: '#4fe36a', crypt: '#a66bff', marsh: '#19e3b8', road: '#ff9a3c', mines: '#c47a4a', dunes: '#ff5a7a', frost: '#7fd6ff', ember: '#ff4a1f', citadel: '#d8d8ff', abyss: '#ff4fd8', gulch: '#d9a066', thorn: '#c58bff', aurora: '#ff6a6a', reach: '#3fd0e0', rail: '#ff7a2f', bank: '#f0c060', modern: '#5ab0ff', grounds: '#d0a060', prime: '#7bd66a', cave: '#c8a06a', buck: '#3fbf7f', mars: '#ff6b3d', manor: '#b0a8c8', hollow: '#b04040' };
const GENRE = { town: 'west', road: 'west', mines: 'west', gulch: 'west', rail: 'west', bank: 'west', modern: 'modern', grounds: 'west', prime: 'prehistoric', cave: 'prehistoric', buck: 'modern', mars: 'scifi', manor: 'modern', hollow: 'fantasy', forest: 'fantasy', crypt: 'fantasy', marsh: 'fantasy', dunes: 'fantasy', citadel: 'fantasy', thorn: 'fantasy', reach: 'fantasy', frost: 'scifi', ember: 'scifi', abyss: 'scifi', aurora: 'scifi' }; // each area's genre styles its section of the guide
const ORDER = Object.keys(AREAS), TERR = ['grass', 'dirt', 'stone', 'concrete', 'metal'];

// route text from the starting square: "north, north, east"
const DIRN = { portal: 'enter portal', n: 'north', s: 'south', e: 'east', w: 'west', u: 'up', d: 'down', ne: 'northeast', nw: 'northwest', se: 'southeast', sw: 'southwest', in: 'in', out: 'out' };
function route(to, from = 'town/square') {
  if (from === to) return 'you start here'; const prev = { [from]: null }, q = [from];
  while (q.length) { const c = q.shift(); for (const [d, n] of [...Object.entries(ROOM[c].exits), ...((ROOM[c].def || ROOM[c]).items || []).map((i) => D.W.items[i] && (D.W.items[i].portal || D.W.items[i].launchTo) && [D.W.items[i].launchTo ? 'launch' : 'portal', D.W.items[i].portal || D.W.items[i].launchTo]).filter(Boolean), ...(((ROOM[c].def || ROOM[c]).items || []).some((i) => D.W.items[i] && D.W.items[i].elevator) ? (D.W.tower || []).map((f) => ['elevator ' + f.key, f.room]) : [])]) if (ROOM[n] && !(n in prev)) { prev[n] = [c, d]; if (n === to) { const out = []; let k = n; while (prev[k]) { out.unshift(DIRN[prev[k][1]] || prev[k][1]); k = prev[k][0]; } return out.join(', '); } q.push(n); } }
  return 'unknown';
}

// ---------- layout ----------
const NAV = [['Getting Started', [['how-to-play', 'How to Play'], ['interface', 'Interface and Controls'], ['commands', 'Commands'], ['faq', 'FAQ']]],
  ['Characters', [['classes', 'Classes'], ['remorting', 'Remorting'], ['experience', 'Experience and Levels'], ['combat', 'Attributes and Combat'], ['cyberware', 'Cyberware and Implants']]],
  ['Magic and Skills', [['spells', 'Spells'], ['tradeskills', 'Tradeskills'], ['tools-bag', 'Tools and Bag of Holding']]],
  ['Items', [['materials', 'Materials'], ['gear', 'Weapons and Armor'], ['consumables', 'Potions and Meals'], ['shops', 'Shops']]],
  ['Games', [['games', 'Blackjack and Rolling Bones']]],
  ['World', [['map', 'Full Map'], ['areas', 'Areas'], ['directions', 'Directions'], ['bestiary', 'Bestiary'], ['npcs-quests', 'NPCs and Quests']]]];
const BLURB = { games: 'Blackjack and Rolling Bones: how to play', directions: 'Routes from Ashfall Square', 'how-to-play': 'Your first ten minutes', interface: 'Every panel and key', commands: 'Everything you can type', faq: 'Quick answers', classes: '12 classes, 7 remort classes', remorting: 'Be reborn up to 40 times', experience: 'XP tables, levels 1 to 40', combat: 'Dice pools, Luck and Aura', cyberware: 'Chrome and neural implants', spells: 'Every ability, every class', tradeskills: 'Seven crafts anyone can learn', 'tools-bag': 'Bound tools and the Bag of Holding', materials: 'What to gather and where', gear: 'Seven tiers of gear', consumables: 'Stims, cells and meals', shops: 'What each shop sells', map: 'All 171 rooms, with terrain', areas: 'Eleven regions to explore', bestiary: 'Every monster', 'npcs-quests': 'Contracts and who gives them' };
const THEME = { 'how-to-play': 'howto', 'tools-bag': 'toolsbag', 'npcs-quests': 'npcs' };
function page(id, title, intro, body) {
  const nav = NAV.map(([g, items]) => `<div class="ng"><h4>${g}</h4>${items.map(([i, t]) => `<a href="${i}.html"${i === id ? ' class="on"' : ''}>${t}</a>`).join('')}</div>`).join('');
  const grp = (NAV.find(([, items]) => items.some(([i]) => i === id)) || [''])[0];
  const th = THEME[id] || id;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} · MULTIVERSE MUD Guide</title><link rel="icon" href="data:,"><link rel="stylesheet" href="guide.css"></head><body>
<header class="top"><a class="logo" href="index.html"><b>MULTIVERSE</b><i>MUD</i><small>Player's Guide</small></a><button id="menu" aria-label="Menu">☰</button><a class="play" href="/">Play now</a></header>
<div class="realms"><span>REALMS</span><a class="rw" href="areas.html">&#129312; Old West</a><a class="rf" href="areas.html">&#128009; Fantasy</a><a class="rs" href="areas.html">&#128640; Sci-fi</a><a class="rm" href="areas.html">&#127980; Modern</a><a class="rp" href="areas.html">&#129430; Prehistoric</a><a class="rd" href="directions.html">Directions</a></div>
<div class="wrap"><nav id="nav">${nav}</nav><main>
<div class="hero"><img src="img/banner-${th}.${fs.existsSync(path.join(IMG, `banner-${th}.jpg`)) ? 'jpg' : 'svg'}" alt=""><div class="ht"><small>${grp}</small><h1>${esc(title)}</h1><p>${intro}</p></div></div>
<article>${body}</article><footer>MULTIVERSE MUD Player's Guide. Generated from the live game data. All art is procedurally generated for this project.</footer></main></div><script src="guide.js"></script></body></html>`;
}
const table = (heads, rows, o = {}) => `${o.filter ? `<input class="flt" data-for="${o.filter}" placeholder="Filter this table...">` : ''}<div class="tw"><table${o.filter ? ` id="${o.filter}"` : ''}><thead><tr>${heads.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
const pill = (t, c = 'a') => `<span class="pill ${c}">${t}</span>`, h2 = (t, id) => `<h2${id ? ` id="${id}"` : ''}>${t}</h2>`;
const card = (img, title, body, href) => `<div class="card">${img ? `<div class="cimg">${img}</div>` : ''}<div class="cb"><h3>${href ? `<a href="${href}">${title}</a>` : title}</h3>${body}</div></div>`;
const imgTag = (f, alt = '') => { const j = f.replace(/\.svg$/, '.jpg'); if (j !== f && fs.existsSync(path.join(IMG, j))) f = j; return `<img src="img/${f}" alt="${esc(alt)}" loading="lazy">`; };

// ---------- full-world SVG map: terrain textures, paths, markers ----------
const NPCROOM = {}; for (const [id, n] of Object.entries(D.Q.NPCS)) (NPCROOM[n.room] = NPCROOM[n.room] || []).push(n.name);
function featuresOf(r) {
  const f = [], d = r.def;
  if (r.path === D.W.start) f.push(['⌂', '#ffd34a', 'Starting square (recall)']);
  if (d.shop && !d.exchange) f.push(['$', '#ffd34a', 'Shop']); if (d.exchange) f.push(['$', '#7be0a0', 'Salvage Exchange (best prices for materials)']); if (d.clinic) f.push(['+', '#ff4fd8', 'Cyberware clinic']);
  if (d.healer) f.push(['+', '#7be0a0', 'Healer: type pray']); if (d.forge) f.push(['F', '#ff7a3c', 'Forge: smithing here']); if (d.camp || d.inn) f.push(['C', '#19e3ff', d.inn ? 'Inn: rest' : 'Camp: safe rest']);
  if (d.rebirth) f.push(['R', '#9a6bff', 'Hall of Rebirth: remort here']); if (NPCROOM[r.path]) f.push(['!', '#ffd34a', 'Quest giver: ' + NPCROOM[r.path].join(', ')]);
  if ((d.mobs || []).some((m) => (D.W.mobs[m] || {}).boss)) f.push(['B', '#ff3b3b', 'Boss monster']);
  if (d.board) f.push(['G', '#ffd34a', 'Guild quest board']);
  return f;
}
let SEQ = 0; // each inline SVG gets its own ids (patterns in a hidden SVG would not resolve for another one)
const PATTERNS = (u) => `<defs>${TERR.map((t) => { const j = fs.existsSync(path.join(IMG, `terrain-${t}.jpg`)); const s = j ? `<image href="img/terrain-${t}.jpg" width="256" height="256"/>` : art.terrain(t).replace(/<svg[^>]*>/, '').replace('</svg>', ''); return `<pattern id="${u}-t-${t}" width="${j ? 256 : 64}" height="${j ? 256 : 64}" patternUnits="userSpaceOnUse" patternTransform="scale(${j ? .42 : .7})">${s}</pattern>`; }).join('')}</defs>`;
function mapSvg(rooms, o = {}) {
  if (!rooms.length) return ''; const u = 'm' + (++SEQ); const T = o.tile || 46, G = o.gap || 26, S = T + G, m = 70, set = new Set(rooms.map((r) => r.path));
  const xs = rooms.map((r) => r.x), ys = rooms.map((r) => r.y), x0 = Math.min(...xs), y0 = Math.min(...ys), W = (Math.max(...xs) - x0) * S + T + m * 2, H = (Math.max(...ys) - y0) * S + T + m * 2 + 14;
  const cx = (r) => m + (r.x - x0) * S + T / 2, cy = (r) => m + (r.y - y0) * S + T / 2 + 6; let paths = '', tiles = '', labels = '';
  const done = new Set();
  for (const r of rooms) for (const [d, to] of Object.entries(r.exits)) { const t = ROOM[to]; if (!t || !set.has(to) || !['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'].includes(d)) continue; const k = [r.path, to].sort().join('|'); if (done.has(k)) continue; done.add(k);
    paths += `<line x1="${cx(r)}" y1="${cy(r)}" x2="${cx(t)}" y2="${cy(t)}" stroke="#000" stroke-width="16" stroke-linecap="round"/><line x1="${cx(r)}" y1="${cy(r)}" x2="${cx(t)}" y2="${cy(t)}" stroke="url(#${u}-t-${r.terrain})" stroke-width="10" stroke-linecap="round"/>`; }
  for (const r of rooms) {
    const x = cx(r) - T / 2, y = cy(r) - T / 2, f = featuresOf(r), ud = (r.exits.u ? '▲' : '') + (r.exits.d ? '▼' : '');
    const tip = `${r.name} (${AREAS[r.area] ? AREAS[r.area][0] : r.area}, ${r.terrain})${f.map((b) => ' · ' + b[2]).join('')}`;
    tiles += `<g><title>${esc(tip)}</title><rect x="${x}" y="${y}" width="${T}" height="${T}" rx="8" fill="url(#${u}-t-${r.terrain})" stroke="${AREA_COL[r.area] || '#000'}" stroke-width="4"/><rect x="${x}" y="${y}" width="${T}" height="${T}" rx="8" fill="url(#${u}-sh)"/>`;
    if (ud) tiles += `<text x="${cx(r)}" y="${cy(r) + 6}" text-anchor="middle" font-size="18" fill="#ffe9a8" stroke="#000" stroke-width="3" paint-order="stroke">${ud}</text>`;
    f.slice(0, 4).forEach(([ch, col], i) => { const bx = x + 9 + (i % 2) * (T - 18), by = y + 9 + Math.floor(i / 2) * (T - 18); tiles += `<circle cx="${bx}" cy="${by}" r="9" fill="${col}" stroke="#000" stroke-width="2"/><text x="${bx}" y="${by + 4.5}" text-anchor="middle" font-size="12" font-weight="800" fill="#000" font-family="sans-serif">${ch}</text>`; });
    tiles += `</g>`; if (o.wrap) { const ws = r.name.split(' '); let l1 = '', l2 = ''; for (const w of ws) { if (!l2 && (l1 + ' ' + w).trim().length <= o.wrap) l1 = (l1 + ' ' + w).trim(); else l2 = (l2 + ' ' + w).trim(); } if (l2.length > o.wrap + 2) l2 = l2.slice(0, o.wrap + 1) + '\u2026'; labels += [l1, l2].filter(Boolean).map((t, i) => `<text x="${cx(r)}" y="${y + T + 12 + i * 11}" text-anchor="middle" font-size="10" fill="#e8e0f4" font-family="sans-serif" stroke="#000" stroke-width="3" paint-order="stroke">${esc(t)}</text>`).join(''); }
    else labels += `<text x="${cx(r)}" y="${y + T + 12}" text-anchor="middle" font-size="9.5" fill="#d8d0e8" font-family="sans-serif" stroke="#000" stroke-width="3" paint-order="stroke">${esc(r.name.length > 14 ? r.name.slice(0, 13) + '…' : r.name)}</text>`;
  }
  let areaLab = ''; if (o.areaLabels) for (const a of ORDER) { const ar = rooms.filter((r) => r.area === a); if (!ar.length) continue; const ax = ar.reduce((s, r) => s + cx(r), 0) / ar.length, ay = Math.min(...ar.map((r) => cy(r))) - T / 2 - 14; areaLab += `<text x="${ax}" y="${ay}" text-anchor="middle" font-size="17" font-weight="800" letter-spacing="2" fill="#ff4fd8" stroke="#000" stroke-width="5" paint-order="stroke" font-family="sans-serif" opacity=".92">${esc(AREAS[a][0].toUpperCase())}</text>`; }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" class="mapsvg" role="img" aria-label="${esc(o.title || 'map')}">${PATTERNS(u)}<defs><linearGradient id="${u}-sh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></linearGradient></defs><rect width="${W}" height="${H}" fill="#07040d"/>${paths}${tiles}${labels}${areaLab}</svg>`;
}
const LEGEND = `<div class="legend">Tile border = area: ${ORDER.map((a) => `<span><b class="bd" style="background:${AREA_COL[a]}"></b>${AREAS[a][0]}</span>`).join('')}</div><div class="legend">${TERR.map((t) => `<span><img src="img/terrain-${t}.jpg" alt="">${cap(t)}</span>`).join('')}<span><b class="bd" style="background:#ffd34a">$</b>Shop</span><span><b class="bd" style="background:#7be0a0">+</b>Healer</span><span><b class="bd" style="background:#ff7a3c">F</b>Forge</span><span><b class="bd" style="background:#19e3ff">C</b>Camp/Inn</span><span><b class="bd" style="background:#ffd34a">!</b>Quest giver</span><span><b class="bd" style="background:#ff3b3b">B</b>Boss</span><span><b class="bd" style="background:#9a6bff">R</b>Rebirth</span><span>▲▼ stairs</span></div>`;
const rooms0 = CATALOG.filter((r) => r.z === 0), roomsU = CATALOG.filter((r) => r.z !== 0);

const pages = {};
const emit = (id, title, intro, body) => { pages[id] = page(id, title, intro, body); };
module.exports = { GENRE, D, art, PORT, CATALOG, ROOM, esc, nm, cap, num, writeImg, AREAS, ORDER, TERR, route, NAV, BLURB, THEME, page, table, pill, h2, card, imgTag, mapSvg, LEGEND, rooms0, roomsU, pages, emit, OUT, IMG, featuresOf };
