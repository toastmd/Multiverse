'use strict';
// World definitions. Edit this file while the server runs, then type `update` as a wizard.
// Coordinates: x grows east, y grows south, z is the floor (0 ground, -1 below).

const items = {
  sword:   { name: 'rusty blade', ids: ['sword'], type: 'weapon', dmg: [2, 6], long: 'A pitted blade, still sharp where it counts.' },
  dagger:  { name: 'mono-dagger', ids: ['dagger'], type: 'weapon', dmg: [1, 5], long: 'Quick and mean.' },
  axe:     { name: 'fire axe', ids: ['axe'], type: 'weapon', dmg: [3, 8], long: 'A woodsman\'s axe, balanced for a fighter.' },
  blade:   { name: 'bone blade', ids: ['blade'], type: 'weapon', dmg: [5, 11], long: 'Carved from the rib of something enormous. It hums.' },
  cap:     { name: 'bike helmet', ids: ['cap'], type: 'armor', slot: 'head', ac: 1, long: 'Stiff with old sweat.' },
  jerkin:  { name: 'padded vest', ids: ['jerkin', 'armor'], type: 'armor', slot: 'body', ac: 2, long: 'Quilted cloth, better than nothing.' },
  mail:    { name: 'chain hauberk', ids: ['hauberk', 'mail'], type: 'armor', slot: 'body', ac: 4, long: 'Rings of grey iron, cold to the touch.' },
  shield:  { name: 'scrap shield', ids: ['shield'], type: 'armor', slot: 'shield', ac: 2, long: 'Oak boards bound with an iron rim.' },
  boots:   { name: 'worn boots', short: 'a pair of worn boots', ids: ['boots'], type: 'armor', slot: 'feet', ac: 1, long: 'Resoled more than once.' },
  potion:  { name: 'red stim', ids: ['potion', 'stim'], type: 'potion', heal: 35, long: 'A stim syringe of thick red liquid that smells of cloves.' },
  // class starter weapons
  staff:   { name: 'focus staff', ids: ['staff'], type: 'weapon', dmg: [1, 4], long: 'A gnarled staff humming faintly.' },
  bonewand: { name: 'bone fetish', ids: ['wand'], type: 'weapon', dmg: [1, 4], long: 'A finger bone bound in silver wire.' },
  revolver: { name: 'old revolver', ids: ['revolver', 'gun'], type: 'weapon', dmg: [3, 6], long: 'Six chambers and a scratched grip.' },
  pestle:  { name: 'chem injector', ids: ['pestle'], type: 'weapon', dmg: [1, 3], long: 'Stained with a hundred experiments.' },
  wrench:  { name: 'heavy wrench', ids: ['wrench'], type: 'weapon', dmg: [2, 5], long: 'Good for bolts and skulls.' },
  mace:    { name: 'stun baton', ids: ['mace', 'baton'], type: 'weapon', dmg: [2, 5], long: 'Blessed, or at least polished.' },
  sickle:  { name: 'totem sickle', ids: ['sickle'], type: 'weapon', dmg: [2, 5], long: 'Cuts mistletoe and worse.' },
  lute:    { name: 'battered guitar', ids: ['lute', 'guitar'], type: 'weapon', dmg: [1, 4], long: 'It has been used as a club more than once.' },
  scrapknife: { name: 'scrap knife', ids: ['knife'], type: 'weapon', dmg: [2, 4], long: 'Sharpened scrap with a leather grip.' },
  cyberdeck: { name: 'cyberdeck', ids: ['deck'], type: 'weapon', dmg: [1, 4], long: 'A scuffed deck wired to a datajack. It also makes a decent club.' },
  dclaws:  { name: 'dragon claws', short: 'dragon claws', ids: ['claws', 'dclaws'], type: 'weapon', dmg: [3, 8], long: 'Curved talons that grow where your fingernails used to be.' },
  parm:    { name: 'plasma arm', ids: ['arm', 'parm'], type: 'weapon', dmg: [3, 8], long: 'A forearm cannon that doubles as a club.' },
  cards:   { name: 'marked cards', short: 'marked cards', ids: ['cards', 'deck'], type: 'weapon', dmg: [3, 8], long: 'A deck of razor-edged cards. Nobody ever finds the ace.' },
  cutlass: { name: 'rusty cutlass', ids: ['cutlass'], type: 'weapon', dmg: [3, 8], long: 'A curved blade that has seen a lot of salt water.' },
  scalpel: { name: 'surgical scalpel', ids: ['scalpel'], type: 'weapon', dmg: [3, 8], long: 'A gleaming scalpel with a monofilament edge.' },
  sixgun:  { name: 'worn six-shooter', ids: ['sixgun', 'revolver', 'gun'], type: 'weapon', dmg: [3, 8], long: 'A six-shooter with a lot of notches.' },
  fclaws:  { name: 'feral claws', short: 'feral claws', ids: ['claws', 'fclaws'], type: 'weapon', dmg: [3, 8], long: 'Claws that appear whenever you will them to.' },
  // gathered materials and crafted goods
  herb:    { name: 'wild herb', ids: ['herb'], type: 'material', long: 'A bundle of aromatic leaves.' },
  bloom:   { name: 'moonbloom', ids: ['bloom'], type: 'material', long: 'A pale flower that glows faintly at night.' },
  ore:     { name: 'iron ore', ids: ['ore'], type: 'material', long: 'A rusty lump heavy with iron.' },
  silver:  { name: 'silver nugget', ids: ['silver', 'nugget'], type: 'material', long: 'Bright and surprisingly heavy.' },
  fish:    { name: 'river trout', ids: ['fish', 'trout'], type: 'material', long: 'Silver-flanked and fresh.' },
  pearl:   { name: 'river pearl', ids: ['pearl'], type: 'material', long: 'A small, lustrous pearl.' },
  salve:   { name: 'herbal medkit', ids: ['salve'], type: 'potion', heal: 28, long: 'Green paste in a clay pot.' },
  grilled: { name: 'grilled trout', ids: ['grilled'], type: 'potion', heal: 22, long: 'Charred and smelling wonderful.' },
  tonic:   { name: 'moonbloom tonic', ids: ['tonic'], type: 'potion', heal: 60, long: 'Glows faintly blue in the vial.' },
  pick:    { name: 'miner\'s pick', ids: ['pick'], type: 'weapon', dmg: [3, 7], long: 'A tool that doubles as a weapon.' },
  helm:    { name: 'iron helm', ids: ['helm'], type: 'armor', slot: 'head', ac: 2, long: 'Plain and solid.' },
  buckler: { name: 'iron buckler', ids: ['buckler'], type: 'armor', slot: 'shield', ac: 3, long: 'A small round shield.' },
  pendant: { name: 'pearl pendant', ids: ['pendant'], type: 'armor', slot: 'neck', ac: 2, long: 'A river pearl in an iron setting.' },
  silverblade: { name: 'silver blade', ids: ['silverblade', 'blade2'], type: 'weapon', dmg: [7, 13], long: 'Bright as moonlight, balanced like a dream.' },
  silvermail: { name: 'silver mail', ids: ['silvermail'], type: 'armor', slot: 'body', ac: 6, long: 'Finely linked silver rings.' },
  fountain: {
    name: 'stone fountain', ids: ['fountain'], fixed: true, long: 'A worn stone basin of clean, softly glowing water. Locals say it heals any traveler. Type `drink fountain` to be fully restored.',
    actions: { drink: (p) => { const hp = p.maxhp - p.hp, mp = p.maxmp - p.mp; p.hp = p.maxhp; p.mp = p.maxmp; if (p.tutEvent) p.tutEvent('fountain'); p.msg(hp || mp ? `You drink the cool, glowing water. Warmth floods through you: you are fully restored (health +${hp}, ${p.cls === 'scavenger' ? 'stamina' : 'mana'} +${mp}).` : 'You drink the cool water. You are already at full health and mana.', 'win'); if (p.sendStats) p.sendStats(); return true; } },
  },
};

const mobs = {
  rat:      { name: 'giant rat', icon: '🐀', level: 1, hp: 12, str: 6, dex: 12, con: 6, dmg: [1, 3], ac: 0, xp: 12, wander: true },
  goblin:   { name: 'goblin', icon: '👺', level: 2, hp: 24, str: 9, dex: 11, con: 8, dmg: [2, 5], ac: 1, xp: 28, wander: true, drops: [['dagger', 0.3], ['potion', 0.2]] },
  wolf:     { name: 'grey wolf', icon: '🐺', level: 3, hp: 34, str: 11, dex: 14, con: 10, dmg: [3, 7], ac: 1, xp: 45, aggro: true },
  skeleton: { name: 'skeleton', icon: '💀', level: 4, hp: 46, str: 12, dex: 10, con: 10, dmg: [4, 8], ac: 2, xp: 65, aggro: true, drops: [['mail', 0.2], ['axe', 0.2]] },
  ghoul:    { name: 'ghoul', icon: '🧟', level: 5, hp: 66, str: 14, dex: 9, con: 12, dmg: [5, 10], ac: 2, xp: 95, aggro: true, drops: [['potion', 0.5]] },
  warlord:  { boss: true, name: 'skeleton warlord', ids: ['warlord'], icon: '☠️', level: 8, hp: 190, str: 18, dex: 10, con: 16, dmg: [8, 16], ac: 4, xp: 420, aggro: true, drops: [['blade', 1]] },
};

const rooms = {
  // ---- Ashfall (town) ----
  'town/square': { name: 'Ashfall Square', area: 'town', x: 0, y: 0, exits: { n: 'town/gate', s: 'town/smithy', e: 'town/market', w: 'town/inn' }, items: ['fountain'],
    long: 'Cobbles worn smooth by a thousand carts ring a stone fountain. Chimney smoke hangs low over Ashfall, and lanterns sway above the doors.' },
  'town/gate': { name: 'North Gate', area: 'town', x: 0, y: -1, exits: { s: 'town/square', n: 'forest/path', e: 'town/quarry' },
    long: 'A squat gatehouse of black stone. A bored guard nods you through toward the Whisperwood to the north.' },
  'town/market': { name: 'Market Row', area: 'town', x: 1, y: 0, exits: { w: 'town/square' }, items: ['potion', 'potion'],
    long: 'Stalls crowd both sides of the lane, most of them shuttered. One vendor still sells red potions from a crate.' },
  'town/inn': { name: 'The Silver Spur Saloon', area: 'town', x: -1, y: 0, exits: { e: 'town/square' }, safe: true, inn: true,
    long: 'A warm, smoky taproom. Nobody fights here. You can rest by the fire and mend faster than anywhere else in Ashfall.' },
  'town/smithy': { name: 'Brann\'s Smithy', area: 'town', x: 0, y: 1, exits: { n: 'town/square' }, items: ['sword', 'cap', 'jerkin', 'shield', 'boots'],
    long: 'The forge ticks as it cools. Brann left a rack of spare gear by the door for anyone brave enough to need it.' },
  'town/quarry': { name: 'Old Quarry', area: 'town', x: 1, y: -1, exits: { w: 'town/gate' }, mobs: ['rat'], res: { ore: 4 },
    long: 'A shallow pit of broken grey stone beside the road. Iron-rusted seams run through the rock face, safe enough for a pick.' },
  // ---- Whisperwood ----
  'forest/path': { name: 'Forest Path', area: 'forest', x: 0, y: -2, exits: { s: 'town/gate', n: 'forest/clearing', w: 'forest/pond' }, mobs: ['rat', 'rat'],
    long: 'A rutted track under black pines. Something skitters in the undergrowth.' },
  'forest/pond': { name: 'Reed Pond', area: 'forest', x: -1, y: -2, exits: { e: 'forest/path' }, mobs: ['rat'], res: { fish: 4, herb: 2 },
    long: 'A still pond ringed with reeds, a short walk off the road. Trout flicker beneath the lily pads.' },
  'forest/clearing': { name: 'Moonlit Clearing', area: 'forest', x: 0, y: -3, exits: { s: 'forest/path', n: 'forest/deep', e: 'forest/stream', w: 'forest/thicket' }, mobs: ['goblin'],
    long: 'Pale light spills through a gap in the canopy. Four trails meet here, trampled by many feet.' },
  'forest/thicket': { name: 'Bramble Thicket', area: 'forest', x: -1, y: -3, exits: { e: 'forest/clearing' }, mobs: ['goblin', 'goblin'],
    long: 'Thorns snag at your sleeves. Crude goblin totems hang from the branches.' },
  'forest/stream': { name: 'Cold Stream', area: 'forest', x: 1, y: -3, exits: { w: 'forest/clearing' }, mobs: ['wolf'],
    long: 'A glassy stream runs over mossy stones. Wolf tracks pad down to the water.' },
  'forest/deep': { name: 'Deep Wood', area: 'forest', x: 0, y: -4, exits: { s: 'forest/clearing', n: 'forest/ruins' }, mobs: ['wolf', 'wolf'],
    long: 'The trees crowd close and the air smells of wet stone. The path climbs toward old ruins.' },
  'forest/ruins': { name: 'Fallen Chapel', area: 'forest', x: 0, y: -5, exits: { s: 'forest/deep', d: 'crypt/entry' },
    long: 'A roofless chapel. A stair behind the broken altar descends into the dark.' },
  // ---- The Crypt (z = -1) ----
  'crypt/entry': { name: 'Crypt Stairs', area: 'crypt', x: 0, y: -5, z: -1, exits: { u: 'forest/ruins', s: 'crypt/hall' }, mobs: ['skeleton'],
    long: 'Cold air rises from below. Bones lie scattered at the foot of the stairs.' },
  'crypt/hall': { name: 'Hall of Urns', area: 'crypt', x: 0, y: -4, z: -1, exits: { n: 'crypt/entry', e: 'crypt/bones', w: 'crypt/cells', s: 'crypt/throne' }, mobs: ['skeleton'],
    long: 'Rows of sealed urns line the walls. Several lids have been pushed aside from the inside.' },
  'crypt/bones': { name: 'Ossuary', area: 'crypt', x: 1, y: -4, z: -1, exits: { w: 'crypt/hall' }, mobs: ['ghoul'],
    long: 'Skulls are stacked to the ceiling in patient, horrible rows.' },
  'crypt/cells': { name: 'Burial Cells', area: 'crypt', x: -1, y: -4, z: -1, exits: { e: 'crypt/hall' }, mobs: ['ghoul'],
    long: 'Narrow stone cells, each with a slab and a name worn away by time.' },
  'crypt/throne': { name: 'Warlord\'s Throne', area: 'crypt', x: 0, y: -3, z: -1, exits: { n: 'crypt/hall' }, mobs: ['warlord'],
    long: 'A throne of fused bone dominates the chamber. Its occupant is already rising.' },
};

// resource nodes (refill on every reset) and the forge
const res = { 'forest/path': { herb: 3 }, 'forest/clearing': { herb: 4 }, 'forest/thicket': { herb: 3 }, 'forest/stream': { fish: 5, herb: 2 },
  'forest/deep': { herb: 3 }, 'forest/ruins': { ore: 2 }, 'crypt/entry': { ore: 2 }, 'crypt/bones': { ore: 3 }, 'crypt/cells': { ore: 3 } };
for (const [p, r] of Object.entries(res)) rooms[p].res = r;
rooms['town/smithy'].forge = true; rooms['town/smithy'].long += ' The forge is still hot enough to work metal.';

delete require.cache[require.resolve('./areas')]; require('./areas')(items, mobs, rooms); delete require.cache[require.resolve('./newareas')]; require('./newareas')(items, mobs, rooms); delete require.cache[require.resolve('./modern')]; require('./modern')(items, mobs, rooms); delete require.cache[require.resolve('./newworld')]; const newworld = require('./newworld')(items, mobs, rooms); delete require.cache[require.resolve('./mars')]; const mars = require('./mars')(items, mobs, rooms); delete require.cache[require.resolve('./manor')]; const manor = require('./manor')(items, mobs, rooms); require('./events').items(items); if (rooms['town/hall_of_rebirth']) rooms['town/hall_of_rebirth'].light = 'A BLINDING SHAFT of golden light pours down from the vaulted ceiling, so bright it hums, pushing every shadow back to the walls. You cannot look straight at it, and you cannot stop looking.'; delete require.cache[require.resolve('./buck')]; const buck = require('./buck')(items, mobs, rooms); delete require.cache[require.resolve('./faces')]; require('./faces')(items, mobs, rooms); delete require.cache[require.resolve('./cave')]; const cave = require('./cave')(items, mobs, rooms); delete require.cache[require.resolve('./tower')]; const tower = require('./tower')(items, mobs, rooms); delete require.cache[require.resolve('./legends')]; require('./legends')(items, mobs); delete require.cache[require.resolve('./retheme')]; require('./retheme')(items, mobs, rooms); newworld.post(); cave.post(); tower.post(); buck.post(); mars.post(); manor.post();
for (const id of ['potion', 'strong', 'greater', 'superior', 'grand']) if (items[id] && items[id].heal && !items[id].mana) items[id].mana = Math.round(items[id].heal * 0.5); // stims heal HP and restore mana // // levels 8-40, shops, temple

rooms['town/taxi_cab'] = { name: 'The Milestone Taxi', area: 'town', x: 0, y: 0, z: -99, hidden: true, taxi: true, safe: true, indoor: true, terrain: 'metal', mobs: [], exits: {}, long: 'A yellow taxi with cracked vinyl seats, a dashboard hula girl and a meter that has stopped. A little sign on the partition reads: MILESTONE TAXI. 30 CREDITS A BOARDING. IT STOPS AT EVERY MILESTONE FOR 30 SECONDS: STEP OUT, TOUCH THE MILESTONE, AND BOARD AGAIN. The driver hums and does not turn around.' };
items.implantsign = { name: 'sign', short: 'a readable sign', ids: ['sign', 'notice', 'instructions', 'implantsign'], type: 'fixture', fixed: true, long: 'A laminated sign bolted to the wall, in clear block letters:\n  HOW TO GET AN IMPLANT\n  1. Type `list` to see every implant for sale: the name, the price in credits, how much AURA it uses, what it gives you and the level you need.\n  2. Type `install <name>` to buy and fit one (use the full name, for example `install brawn implant mk i`). You pay the listed price and the implant works at once.\n  3. AURA: you start with 6.0 and every implant uses some. If you do not have enough left you cannot fit another. Less aura also means a smaller mana pool.\n  4. UPGRADES come in Marks (Mk I, Mk II...). Fit them in order; each new Mark trades in the old one for half its price.\n  5. Type `cyber` to see what you have. `uninstall <name>` removes one and pays you half its price.\n  More help: `help implants`.' };
for (const r of ['town/implant_lab', 'town/clinic']) if (rooms[r]) rooms[r].items = [...(rooms[r].items || []), 'implantsign'];
delete require.cache[require.resolve('./milestones')]; const MS = require('./milestones')(items, rooms); // after every area exists, so each gets a milestone
delete require.cache[require.resolve('./custom')]; require('./custom')(rooms, mobs, items, MS); // areas made with the grid builder

module.exports = { items, mobs, rooms, start: 'town/square', milestones: MS, tower: tower.floors };
