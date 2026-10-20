'use strict';
// MULTIVERSE MUD theme pass, applied after the world is built: some areas are Old West, some fantasy, some sci-fi.
//   Old West: Ashfall Junction (hub), Redrock Trail, Silverado Mines   Fantasy: Whisperwood, Barrow Crypts, Sunken Marsh, Sunscorch Dunes, Shattered Citadel
//   Sci-fi:   Frostpeak Station, Ember Wastes, the Abyss
const DESCS = require('./descs2');
const NEW_NAMES = { 'town/inn': 'Silver Spur Saloon', 'town/clinic': 'Chrome Clinic', 'road/mile1': 'Redrock Trail, First Mile', 'road/mile2': 'Redrock Trail, Second Mile', 'road/abandoned_inn': 'Rattlesnake Saloon', 'road/bandit_camp': 'Outlaw Camp',
  'mines/foremans_office': 'Lucky Strike Saloon', 'frost/lodge': 'Frostpeak Station', 'frost/hall': "The Cryo Titan's Hall", 'frost/hermits_igloo': "Hermit's Habitat", 'frost/frozen_camp': 'Abandoned Research Camp' };
const MOBS = { rat: 'giant rat', wolf: 'dire wolf', bandit: 'outlaw', highwayman: 'stagecoach robber', outlaw_captain: 'Red Jack Calloway', leech: 'giant leech', cave_spider: 'cave spider', kobold: 'claim jumper', dwarf_zombie: 'ghost miner', rock_golem: 'rock golem',
  scorpion: 'giant scorpion', mummy: 'ancient mummy', ice_wolf: 'cryo-wolf', yeti: 'mutant yeti', frost_wraith: 'cryo-wraith', ice_golem: 'cryo-mech', frost_giant: 'Cryo Titan', fire_imp: 'plasma imp', salamander: 'lava salamander', cursed_knight: 'cursed knight' };
const FIX = [[/once the service road for a corporate green belt and now/g, "once a woodcutters' road and now"], [/old machinery/g, 'old moss'], [/a rusted drone lies half-sunk at one edge, its camera eye green with algae/g, 'a rusted suit of armor lies half-sunk at one edge, its visor green with algae'],
  [/Old corporate signage/g, 'An old signpost'], [/old electronics/g, 'old trinkets'], [/by wire and string/g, 'by rope and string'], [/wire long since swallowed/g, 'rails long since swallowed'], [/predate the sprawl/g, 'are older than the kingdom'],
  [/A rusted radio mast stands nearby, its antenna wrapped in vines, still blinking a single faint red light\./g, 'A ruined watchtower stands nearby, its spire wrapped in vines, a single faint red lantern still burning.'], [/sharp as razor wire/g, 'sharp as razors'], [/Old corporate fencing/g, 'Old iron fencing'], [/the Reserve's safe ground/g, "the forest's safe ground"],
  [/the hum of failing machinery, as if the crypt had been wired into the throne/g, 'the hum of failing wards, as if the crypt were bound to the throne'], [/old cables trail out of the stone/g, 'old roots trail out of the stone'], [/an old corporate runoff channel/g, 'an old drainage channel'],
  [/strands of colored wire/g, 'strands of colored thread'], [/its deck patched with scrap/g, 'its deck patched with planks'], [/tire tracks/g, 'cart tracks'], [/neon-lit stalls/g, 'lantern-lit stalls'], [/the bones of vehicles and men/g, 'the bones of wagons and men'],
  [/glinting like chrome/g, 'glinting like polished steel'], [/Old corporate insignias/g, 'Old heraldic crests'], [/Screens flicker with static/g, 'Candles flicker without wind'], [/\bsprawl\b/gi, 'kingdom'], [/\bcorporate\b/gi, 'old'], [/\bneon\b/gi, 'lantern'], [/\bchrome\b/gi, 'steel']];
module.exports = (items, mobs, rooms) => {
  for (const [id, r] of Object.entries(rooms)) { if (DESCS[id]) r.long = DESCS[id]; else if (r.long) for (const [re, to] of FIX) r.long = r.long.replace(re, to); if (NEW_NAMES[id]) r.name = NEW_NAMES[id]; }
  for (const [id, nm] of Object.entries(MOBS)) { const m = mobs[id]; if (!m) continue; m.ids = [...new Set([...(m.ids || [id]), ...m.name.toLowerCase().split(/[ -]+/), ...nm.toLowerCase().split(/[ -]+/)])]; m.name = nm; }
  // saloons: the hub's Silver Spur, Dry Gulch's Rattlesnake and the mines' Lucky Strike all serve food and drink
  const drink = (id, name, long, o) => { items[id] = { name, ids: [id, ...name.split(' ')], type: 'potion', long, ...o }; };
  drink('whiskey', 'shot of whiskey', 'A small glass of amber saloon whiskey. It burns going down, and you feel braver for it.', { heal: 90, value: 25 });
  drink('sarsaparilla', 'sarsaparilla', 'A cold, sweet bottle of sarsaparilla that clears the head.', { mana: 60, value: 30 });
  drink('steak', 'saloon steak dinner', 'A thick steak with beans and cornbread, still sizzling.', { heal: 260, value: 70 });
  drink('chili', 'miners chili', 'A tin cup of thick, fiery miners chili.', { heal: 170, value: 45 });
  for (const [id, stock] of [['town/inn', ['whiskey', 'sarsaparilla', 'steak']], ['road/abandoned_inn', ['whiskey', 'sarsaparilla', 'steak']], ['mines/foremans_office', ['whiskey', 'sarsaparilla', 'chili']]]) if (rooms[id]) rooms[id].shop = { stock };
};
