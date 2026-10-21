'use strict';
// One unique legendary item per boss: either boosted equipment or a priceless treasure. A boss drops its item rarely;
// the finder is announced to the whole MUD, and legendary items sell for their FULL value (normal gear sells for 40%).
const CHANCE = 0.25;
const LEGENDS = {
  warlord:        { id: 'oathblade', name: "Gravewarden's Oathblade", type: 'weapon', dmg: [24, 38], lvl: 8, value: 40000, bonus: { pool: 1, str: 3 }, long: 'A black greatsword that hums with the vow of a skeleton who refused to die. Far deadlier than any blade of its level.' },
  hydra:          { id: 'hydraheart', name: 'Heart of the Nine-Headed Mother', type: 'treasure', value: 90000, long: 'A pulsing, fist-sized emerald heart that still beats. Collectors in every world pay fortunes for it.' },
  outlaw_captain: { id: 'peacemaker', name: "Red Jack's Golden Peacemaker", type: 'weapon', dmg: [40, 60], lvl: 16, value: 150000, bonus: { pool: 2, dmg: 6 }, long: "The gold-plated six-shooter of the Redrock outlaw boss. Six notches on the grip, and it has never once misfired." },
  delver_king:    { id: 'motherlode', name: 'The Motherlode Nugget', type: 'treasure', value: 220000, long: 'A single nugget of pure gold the size of a loaf of bread, pulled from the deepest seam of the Silverado Mines.' },
  pharaoh:        { id: 'sunaegis', name: "Pharaoh's Sunheart Aegis", type: 'armor', slot: 'body', ac: 24, lvl: 24, value: 350000, bonus: { hp: 80, ac: 4 }, long: 'A breastplate of beaten sun-gold, still warm to the touch. It hardens the body and drinks in the desert light.' },
  frost_giant:    { id: 'cryobulwark', name: 'Cryo-Core Bulwark', type: 'armor', slot: 'shield', ac: 18, lvl: 30, value: 500000, bonus: { hp: 60, mp: 60 }, long: 'A shield built around a stolen cryo-reactor core. Cold, humming, and nearly impossible to break.' },
  magma_titan:    { id: 'furnacestar', name: 'Heart of the Furnace Star', type: 'treasure', value: 800000, long: 'A captured sliver of a dying star, sealed in a lattice of obsidian. Worth more than most towns.' },
  dread_marshal:  { id: 'dreadcrown', name: 'Crown of the Dread Marshal', type: 'armor', slot: 'head', ac: 20, lvl: 38, value: 1200000, bonus: { pool: 2, will: 4, ac: 3 }, long: 'The iron crown of the undead commander of the Citadel. Whoever wears it commands attention, and obedience.' },
  bank_manager:     { id: 'pocketwatch', name: "Crane's Golden Pocketwatch", type: 'treasure', value: 260000, long: 'The pocketwatch of Bank Manager Ebenezer Crane, solid gold and always exactly on time. Collectors across the multiverse want it.' },
  tyrant_rex:       { id: 'tyranttooth', name: "Rex's Tyrant Tooth Spear", type: 'weapon', dmg: [70, 100], lvl: 28, value: 520000, bonus: { pool: 3, dmg: 10 }, long: 'A spear tipped with a tooth as long as a forearm, torn from the jaw of the Tyrant of the Rift.' },
  vampire_count:    { id: 'crimsondusk', name: 'Cloak of Crimson Dusk', type: 'armor', slot: 'body', ac: 34, lvl: 37, value: 950000, bonus: { hp: 160, mp: 90 }, long: 'The blood-red cloak of Count Vladislav Morrow. It never wrinkles, never fades and always seems to be night.' },
  archdemon:        { id: 'infernalcrown', name: 'Infernal Crown of Malphas', type: 'armor', slot: 'head', ac: 22, lvl: 39, value: 1400000, bonus: { hp: 200, mp: 120, pool: 2 }, long: 'A crown of black iron and living flame, taken from the brow of the Archdemon. It whispers offers.' },
  mm_manager:       { id: 'pricegun', name: 'Price Gun of Doom', type: 'weapon', dmg: [44, 64], lvl: 16, value: 380000, bonus: { pool: 2, dmg: 6 }, long: 'The manager\'s own price gun. Every shot marks a target down, 50% off.' },
  trailer_king:     { id: 'lawnchair', name: "Earl's Golden Lawn Chair", type: 'treasure', value: 240000, long: 'A solid gold folding lawn chair that has hosted a hundred barbecues. Collectors across the multiverse want it.' },
  dalton:           { id: 'marshalstetson', name: "Spectral Marshal's Stetson", type: 'armor', slot: 'head', ac: 14, lvl: 14, value: 180000, bonus: { hp: 70, pool: 1 }, long: "The ten-gallon hat of Ghost Marshal Dalton, faintly translucent. The last lawman of the Gulch watches over its wearer." },
  thorn_queen:      { id: 'everbloom', name: "Queen Mab's Everbloom", type: 'treasure', value: 320000, long: 'A single flower that never wilts, plucked from the crown of the Thorn Queen. Every fey court in the multiverse would pay a ransom for it.' },
  helix:            { id: 'plasmaheart', name: 'Helix Plasma Cutter', type: 'weapon', dmg: [80, 120], lvl: 26, value: 600000, bonus: { pool: 2, dmg: 10 }, long: "The ship mind's own cutting tool, still calm and polite when it fires." },
  leviathan:        { id: 'tidalmail', name: "Leviathan's Tidal Mail", type: 'armor', slot: 'body', ac: 30, lvl: 31, value: 900000, bonus: { hp: 140, mp: 70 }, long: 'Armor grown from the scales of the Leviathan, shimmering like deep water and just as heavy to pierce.' },
  brimstone_express: { id: 'enginebreaker', name: 'Engine-Breaker Sledge', type: 'weapon', dmg: [100, 150], lvl: 36, value: 1500000, bonus: { dmg: 14, str: 6 }, long: 'A sledgehammer forged from the cowcatcher of the Brimstone Express. It has stopped a train, and it can stop you.' },
  voidlord:       { id: 'multiversekey', name: 'The Multiverse Key', type: 'treasure', value: 2500000, long: 'A key that fits the lock of every world. No one knows what it opens, and every collector in the multiverse wants it.' },
};
module.exports = (items, mobs) => {
  for (const [boss, L] of Object.entries(LEGENDS)) {
    if (!mobs[boss]) continue; const { id, name, ...rest } = L;
    items[id] = { name, ids: [id, ...name.toLowerCase().replace(/[^a-z ]/g, '').split(' ').filter((w) => w.length > 2)], ...rest, legend: true };
    mobs[boss].legend = { item: id, chance: CHANCE };
  }
};
module.exports.LEGENDS = LEGENDS; module.exports.CHANCE = CHANCE;
