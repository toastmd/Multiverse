'use strict';
// Tradeskills any character can learn at any time with `learn <skill>` (free, no trainer). `tradeskills` lists them all.
// Skills level 1-50 by use. Edit and `update` as a wizard to reload.

// Smithing: every gear tier from the shops can be forged once your skill and materials allow it.
const TIERS = [['iron', 8, { ore: 1 }], ['steel', 16, { ore: 1, silver: 1 }], ['mithril', 26, { mithril: 1, ore: 1 }], ['runed', 34, { mithril: 1, silver: 1 }], ['adamant', 42, { mithril: 2, silver: 1 }], ['dragon', 48, { scale: 1, mithril: 1 }]];
const PIECES = [['sword', 3, 0], ['boots', 2, 1], ['helm', 2, 1], ['shield', 3, 2], ['mail', 5, 3]]; // piece, material multiplier, extra skill level
const smithing = [
  { k: 'scrap_knife', lvl: 1, need: { ore: 1 }, out: 'scrapknife' }, { k: 'miners_pick', lvl: 3, need: { ore: 2 }, out: 'pick' },
  { k: 'bike_helmet_plate', lvl: 4, need: { ore: 2 }, out: 'helm' }, { k: 'iron_buckler', lvl: 6, need: { ore: 3 }, out: 'buckler' },
];
for (const [tier, lvl, mats] of TIERS) for (const [piece, mult, bump] of PIECES) {
  const need = {}; for (const [m, n] of Object.entries(mats)) need[m] = n * mult * 2; // two of each unit: crafting costs real materials
  smithing.push({ k: `${tier}_${piece}`, lvl: lvl + bump, need, out: tier + piece });
}

const SKILLS = {
  foraging: { name: 'Foraging', icon: '🌿', kind: 'gather', verb: 'forage', res: 'herb', nodeName: 'plants worth foraging', desc: 'Gather wild herbs and, with practice, rare moonblooms from rooms with plant life.',
    loot: [{ id: 'herb', w: 10, min: 1 }, { id: 'bloom', w: 2, min: 8, rare: 1 }] },
  mining: { name: 'Mining', icon: '⛏️', kind: 'gather', verb: 'mine', res: 'ore', nodeName: 'ore vein', desc: 'Dig iron ore from ore veins. Higher skill finds silver, then mithril.',
    loot: [{ id: 'ore', w: 10, min: 1 }, { id: 'silver', w: 2, min: 10, rare: 1 }, { id: 'mithril', w: 1, min: 25, rare: 1 }] },
  fishing: { name: 'Fishing', icon: '🎣', kind: 'gather', verb: 'fish', res: 'fish', nodeName: 'fishing spot', desc: 'Catch river trout, and with practice the occasional pearl, in rooms with water.',
    loot: [{ id: 'fish', w: 10, min: 1 }, { id: 'pearl', w: 1, min: 12, rare: 1 }] },
  smithing: { name: 'Smithing', icon: '🔨', kind: 'craft', verb: 'smith', forge: true, desc: 'Forge tools and every tier of weapon and armor from ore, silver, mithril and dragon scale. Needs a forge (Brann\'s Smithy, the mines, the Ember temple).', recipes: smithing },
  brewing: { name: 'Brewing', icon: '🧪', kind: 'craft', verb: 'brew', desc: 'Brew stims, trauma kits and mana cells from herbs, blooms, silver and pearls.', recipes: [
    { k: 'red_stim', lvl: 1, need: { herb: 2 }, out: 'potion' }, { k: 'medkit', lvl: 2, need: { herb: 3 }, out: 'salve' }, { k: 'blue_cell', lvl: 4, need: { herb: 1, ore: 1 }, out: 'mana1' },
    { k: 'tonic', lvl: 6, need: { bloom: 1, herb: 1 }, out: 'tonic' }, { k: 'strong_stim', lvl: 12, need: { herb: 4, bloom: 2 }, out: 'strong' }, { k: 'azure_cell', lvl: 16, need: { ore: 2, bloom: 1, herb: 2 }, out: 'mana2' },
    { k: 'military_stim', lvl: 22, need: { herb: 6, bloom: 4 }, out: 'greater' }, { k: 'cobalt_cell', lvl: 28, need: { silver: 2, bloom: 3 }, out: 'mana3' }, { k: 'trauma_kit', lvl: 34, need: { bloom: 6, pearl: 2 }, out: 'superior' },
    { k: 'sapphire_cell', lvl: 40, need: { silver: 4, pearl: 3, bloom: 4 }, out: 'mana4' }, { k: 'revive_kit', lvl: 44, need: { bloom: 10, pearl: 4, mithril: 2 }, out: 'grand' }] },
  cooking: { name: 'Cooking', icon: '🍲', kind: 'craft', verb: 'cook', hearth: true, desc: 'Cook meals that heal and give a timed buff. Needs a hearth: an inn, camp, forge or any safe room.', recipes: [
    { k: 'grilled_trout', lvl: 1, need: { fish: 1 }, out: 'grilled' }, { k: 'noodle_bowl', lvl: 5, need: { fish: 1, herb: 1 }, out: 'noodles' }, { k: 'fish_stew', lvl: 12, need: { fish: 2, herb: 2 }, out: 'fishstew' },
    { k: 'pearl_chowder', lvl: 22, need: { fish: 3, pearl: 1 }, out: 'pearlchowder' }, { k: 'hunters_feast', lvl: 32, need: { fish: 4, herb: 4, bloom: 2 }, out: 'huntersfeast' },
    { k: 'frontier_banquet', lvl: 44, need: { fish: 6, bloom: 4, pearl: 2 }, out: 'banquet' }] },
  tilling: { name: 'Tilling', icon: '\u{1F69C}', kind: 'farm', verb: 'till', how: 'In a vegetable field at Sunny Acres Farm (type `farm` in Ashfall Square), `till` turns bare ground into plots ready for seeds (`till all` does every plot). More tilling skill gives you more plots: 4, plus 1 for every 5 levels.', desc: 'Turn bare ground into plots ready for seeds. More skill, more plots.' },
  planting: { name: 'Planting', icon: '\u{1F331}', kind: 'farm', verb: 'plant', how: '`plant <crop>` (or `plant <crop> all`) sows seeds in your tilled plots; `harvest` collects ripe crops; `plots` shows how they are growing. Carrot, potato, lettuce, corn, tomato, pumpkin, strawberry and watermelon unlock as your Planting rises. Seeds are sold at the Farmer\'s Market.', desc: 'Sow seeds, watch them grow and harvest vegetables from carrots to watermelons.' },
  milking: { name: 'Milking', icon: '\u{1F95B}', kind: 'farm', verb: 'milk', how: '`milk cow` in the Red Barn or the Cow Stalls. Every cow gives milk into your bucket every half a minute or so. Sell the milk to the old farmer.', desc: 'Milk the dairy cows in the barn into your bucket.' },
  shearing: { name: 'Shearing', icon: '\u2702\uFE0F', kind: 'farm', verb: 'shear', how: '`shear sheep` in the two pastures. Every sheep gives a fleece of wool about every forty seconds. Sell the wool to the old farmer.', desc: 'Shear the woolly sheep in the pastures.' },
  salvaging: { name: 'Salvaging', icon: '♻️', kind: 'salvage', verb: 'salvage', desc: 'Break unwanted weapons and armor down into ore, silver, mithril and scale. Higher skill recovers more.' },
};

// Bound tools: every character has all of them from the start. They cannot be dropped or sold, are saved with the character, and
// improve with use (Mk I to Mk V). Mk uses thresholds are TOOL_TIERS. Effects scale with the Mk number.
const TOOLS = {
  fishingpole: { name: 'Fishing pole', icon: '🎣', skill: 'fishing', desc: 'Faster casts, bigger hauls and better odds at pearls.' },
  miningpick: { name: 'Mining pick', icon: '⛏️', skill: 'mining', desc: 'Faster swings, bigger loads and better odds at silver and mithril.' },
  sickle: { name: "Herbalist's sickle", icon: '🌾', skill: 'foraging', desc: 'Faster harvests, bigger bundles and better odds at moonblooms.' },
  hammer: { name: 'Smithing hammer', icon: '🔨', skill: 'smithing', desc: 'A chance to forge without using up the materials.' },
  alembic: { name: 'Portable alembic', icon: '⚗️', skill: 'brewing', desc: 'A chance to brew a double batch.' },
  skillet: { name: 'Cast-iron skillet', icon: '🍳', skill: 'cooking', desc: 'A chance to cook a double portion.' },
  tillinghoe: { name: 'Tilling hoe', icon: '\u{1F69C}', skill: 'tilling', desc: 'More tilling XP with every Mark.' },
  seedbag: { name: 'Seed bag', icon: '\u{1F331}', skill: 'planting', desc: 'Crops grow a little faster and bonus XP with every Mark.' },
  milkpail: { name: 'Milking bucket', icon: '\u{1FAA3}', skill: 'milking', desc: 'A chance at an extra pail and more XP with every Mark.' },
  shears: { name: 'Sheep shears', icon: '\u2702\uFE0F', skill: 'shearing', desc: 'A chance at an extra fleece and more XP with every Mark.' },
  crowbar: { name: 'Salvage crowbar', icon: '🪛', skill: 'salvaging', desc: 'More materials from every salvage, and a chance at double.' },
};
const TOOL_TIERS = [0, 25, 100, 250, 600]; // uses needed for Mk I, II, III, IV, V

module.exports = { SKILLS, MAX: 50, TOOLS, TOOL_TIERS };
