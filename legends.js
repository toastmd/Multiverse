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
