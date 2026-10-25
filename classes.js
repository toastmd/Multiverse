'use strict';
// Classes, spells and recipes. Edit while the server runs, then `update` as a wizard.
// hpl/mpl: hit/mana points per level. rg: extra mana regen per heartbeat. str/dex/con: stat offsets. kit: starting weapon.
// Spell kinds: dmg (aoe, hits, exec, crit, stun, drain, dot) | heal (hot) | buff | summon | escape | gather | craft
const S = (k, n, lvl, mp, kind, i, c, d, o = {}) => ({ k, n, lvl, mp, kind, i, c, d, ...o });

const CLASSES = {
  magician:    { name: 'Mage',     icon: '🧙', hpl: 9,  mpl: 12, rg: 2, str: -2, dex: 0,  con: -2, kit: 'staff',    desc: 'A wizard channeling raw mana through staff and spellbook. Fragile, but the strongest bolts, fire and frost in the multiverse. (Fantasy)' },
  thief:       { name: 'Rogue',  icon: '🥷', hpl: 11, mpl: 6,  rg: 1, str: 0,  dex: 4,  con: -1, kit: 'dagger',   desc: 'A shadow-walking cutthroat: crits, poisons and dirty tricks. Hard to hit, hard to find. (Fantasy)' },
  alchemist:   { name: 'Alchemist',      icon: '⚗️', hpl: 10, mpl: 9,  rg: 1, str: -1, dex: 1,  con: 0,  kit: 'pestle',   desc: 'A brewer of acids, bombs, tonics and elixirs. Heals and hurts. (Fantasy)' },
  gunslinger:  { name: 'Gunslinger',       icon: '🤠', hpl: 11, mpl: 6,  rg: 1, str: 0,  dex: 3,  con: 0,  kit: 'revolver', desc: 'An Old West pistol-and-rifle specialist: rapid shots, stuns and a deadly crit rate. (Old West)' },
  barbarian:   { name: 'Space Marine',  icon: '🧔', hpl: 16, mpl: 5,  rg: 1, str: 4,  dex: 0,  con: 3,  kit: 'axe',      desc: 'A heavily augmented warrior from the star-cities with a huge health pool. Rage, cleave and brute force. (Sci-fi)' },
  juggernaut:  { name: 'Juggernaut', icon: '\u{1F4AA}', brawn: true, hpl: 21, mpl: 2, rg: 4, str: 6, dex: -1, con: 6, kit: 'axe', desc: 'All brawn: a hulking wall of muscle with the biggest health pool and the hardest hits in the multiverse. No spells, only quick heals. Brute Force randomly makes a blow hit far harder, and Thick Skin shrugs off a share of every hit you take. (Any era)' },
  titan:       { name: 'Titan', icon: '\u{1F5FF}', remort: true, brawn: true, pwr: 1, hpl: 28, mpl: 3, rg: 5, str: 9, dex: 0, con: 8, kit: 'axe', desc: 'The reborn Juggernaut: a walking mountain with no spells and a bigger bonus for every remort. Brute Force hits harder and more often, Thick Skin grows, and at the high remorts it stuns, drains life and doubles its fury. (Remort class)' },
  engineer:    { name: 'Engineer',       icon: '👷', hpl: 11, mpl: 8,  rg: 1, str: 0,  dex: 1,  con: 1,  kit: 'wrench',   desc: 'A sci-fi engineer: turrets, gadgets, deployables and a powered combat suit. (Sci-fi)' },
  necromancer: { name: 'Necromancer', icon: '🧛', hpl: 9,  mpl: 11, rg: 2, str: -2, dex: 0,  con: -1, kit: 'bonewand', desc: 'A death-magic specialist. Drains life, curses foes and binds the restless dead. (Fantasy)' },
  cleric:      { name: 'Preacher', icon: '👼', hpl: 12, mpl: 10, rg: 2, str: 1,  dex: -1, con: 2,  kit: 'mace',     desc: 'A frontier preacher and doctor with a bible, a medical bag and a sturdy constitution. The reliable support. (Old West)' },
  druid:       { name: 'Druid', icon: '🧝', hpl: 12, mpl: 10, rg: 2, str: 0,  dex: 1,  con: 1,  kit: 'sickle',   desc: 'A wild-spirit druid bonded to the forest: thorns, regrowth and a wolf companion. (Fantasy)' },
  bard:        { name: 'Musician',  icon: '🧑‍🎤', hpl: 10, mpl: 9,  rg: 2, str: -1, dex: 2,  con: 0,  kit: 'lute',     desc: 'A saloon musician: songs, tall tales and a piano that wound, soothe, buff and put foes to sleep. (Old West)' },
  wirewalker:  { name: 'Hacker',   icon: '🔌', hpl: 9,  mpl: 12, rg: 2, str: -2, dex: 1,  con: -2, kit: 'cyberdeck', desc: 'A sci-fi netrunner. Burns targets with hostile code, crashes systems and hijacks drones. (Sci-fi)' },
  scavenger:   { name: 'Prospector',    icon: '🧑‍🌾', hpl: 13, mpl: 6,  rg: 2, str: 1,  dex: 1,  con: 2,  kit: 'scrapknife', desc: 'A prospector and trailblazer, not a fighter: botany, mining, fishing and crafting skills. Carries more. (Old West)' },
};

// ---- Remort classes: unlocked only by remorting at level 40. pwr multiplies spell power; remort classes also start with more health. ----
Object.assign(CLASSES, {
  dragon:       { name: 'Dragon',       icon: '🐉', remort: true, pwr: 1.4, hpl: 15, mpl: 10, rg: 3, str: 4, dex: 0, con: 3, kit: 'dclaws', desc: 'An awakened wyrm in human shape. Breath weapons, scales and sheer draconic power. (Remort class)' },
  android:      { name: 'Android',      icon: '🤖', remort: true, pwr: 1.4, hpl: 12, mpl: 11, rg: 3, str: 1, dex: 3, con: 1, kit: 'parm',   desc: 'A self-aware combat frame. Precision weapons, nanite repair and overcharged systems. (Remort class)' },
  gambler:      { name: 'Gambler',      icon: '\u{1F0CF}', remort: true, pwr: 1.4, hpl: 12, mpl: 10, rg: 3, str: 0, dex: 4, con: 1, kit: 'cards',   desc: 'A card sharp who bets everything on luck, loaded dice and a hidden ace. Big crits, tricks and a royal flush. (Remort class)' },
  ripperdoc:    { name: 'Ripperdoc',    icon: '\u{1FA7A}', remort: true, pwr: 1.4, hpl: 13, mpl: 11, rg: 3, str: 1, dex: 2, con: 2, kit: 'scalpel', desc: 'A back-alley cyber-surgeon: scalpels, grafts and stims. Cuts, heals and rebuilds, often in the same breath. (Remort class)' },
  outlaw:       { name: 'Outlaw',       icon: '\u{1F920}', remort: true, pwr: 1.4, hpl: 14, mpl: 8,  rg: 2, str: 3, dex: 3, con: 2, kit: 'sixgun',  desc: 'A wanted gunfighter with a price on their head: quick draws, lassos, dynamite and one last stand. (Remort class)' },
  pirate:       { name: 'Pirate',       icon: '\u2620\uFE0F', remort: true, pwr: 1.4, hpl: 14, mpl: 8, rg: 2, str: 3, dex: 3, con: 2, kit: 'cutlass', desc: 'A sea-raider with a cutlass, a ship\'s cannon and a very loud parrot. Boarding parties, broadsides and plunder. (Remort class)' },
  shapeshifter: { name: 'Shapeshifter', icon: '🐺', remort: true, pwr: 1.4, hpl: 14, mpl: 9,  rg: 2, str: 3, dex: 3, con: 2, kit: 'fclaws', desc: 'A changer who wears beast forms like coats. Claws, packs, regeneration and mist. (Remort class)' },
});

const SPELLS = {
  juggernaut: [ // no spells: only quick heals (the class's power is its passive bonuses: Brute Force, Thick Skin, Hulking)
    S('second_wind', 'Second Wind', 1, 2, 'heal', '\u{1F4A8}', '#7be0a0', 'Catch your breath and shrug off the pain.', { heal: [18, 28], cd: 4 }),
    S('shrug_it_off', 'Shrug It Off', 10, 5, 'heal', '\u{1F4AA}', '#7be0a0', 'Roll your shoulders and let the wounds close.', { heal: [60, 90], cd: 6 }),
    S('unbreakable', 'Unbreakable', 25, 10, 'heal', '\u{1F6E1}\uFE0F', '#7be0a0', 'Plant your feet. Nothing is getting through.', { heal: [160, 230], cd: 8 }),
  ],
  titan: [
    S('second_wind', 'Second Wind', 1, 2, 'heal', '\u{1F4A8}', '#7be0a0', 'Catch your breath and shrug off the pain.', { heal: [30, 44], cd: 4 }),
    S('shrug_it_off', 'Shrug It Off', 8, 5, 'heal', '\u{1F4AA}', '#7be0a0', 'Roll your shoulders and let the wounds close.', { heal: [90, 130], cd: 6 }),
    S('unbreakable', 'Unbreakable', 20, 10, 'heal', '\u{1F6E1}\uFE0F', '#7be0a0', 'Plant your feet. Nothing is getting through.', { heal: [220, 300], cd: 8 }),
    S('mountain_heart', 'Heart of the Mountain', 35, 14, 'heal', '\u26F0\uFE0F', '#7be0a0', 'A mountain does not fall.', { heal: [380, 520], cd: 10 }),
  ],
  magician: [
    S('magic_missile', 'Magic Missile', 1, 4, 'dmg', '✨', '#b69cff', 'Unerring bolts of force.', { dmg: [5, 9] }),
    S('frost_bolt', 'Frost Bolt', 2, 7, 'dmg', '❄️', '#7fd6ff', 'Chills and stuns the target for a turn.', { dmg: [6, 10], stun: 1 }),
    S('fireball', 'Fireball', 4, 14, 'dmg', '🔥', '#ff7a3c', 'Burns every enemy in the room.', { dmg: [9, 15], aoe: 1 }),
    S('arcane_shield', 'Arcane Shield', 6, 12, 'buff', '🛡️', '#9fb8ff', 'Raises armor for a while.', { ticks: 14, ac: 4 }),
    S('chain_lightning', 'Chain Lightning', 8, 22, 'dmg', '⚡', '#ffe66b', 'Arcs through all enemies.', { dmg: [16, 24], aoe: 1 }),
    S('meteor', 'Meteor', 10, 35, 'dmg', '☄️', '#ff5a36', 'Calls a meteor on one target.', { dmg: [45, 60], cd: 8 }),
  ],
  thief: [
    S('backstab', 'Backstab', 1, 3, 'dmg', '🗡️', '#d9d9d9', 'A cheap shot with a high crit chance.', { dmg: [6, 10], crit: 0.4 }),
    S('poison_blade', 'Poison Blade', 2, 6, 'dmg', '☠️', '#8fd14f', 'A nick that keeps on hurting.', { dmg: [2, 4], dot: { dmg: [3, 5], ticks: 5 } }),
    S('smoke_bomb', 'Smoke Bomb', 4, 8, 'escape', '💨', '#aab', 'Vanish in smoke and slip away.'),
    S('shadowstep', 'Shadowstep', 6, 10, 'buff', '👤', '#7b6fb0', 'Harder to hit, better crits.', { ticks: 10, evade: 0.2, crit: 0.2 }),
    S('assassinate', 'Assassinate', 8, 18, 'dmg', '🔪', '#e5603f', 'Double damage on wounded foes.', { dmg: [14, 22], exec: 1 }),
    S('death_blossom', 'Death Blossom', 10, 28, 'dmg', '🌸', '#ff7fb0', 'A whirl of blades hits everyone.', { dmg: [18, 26], aoe: 1 }),
  ],
  alchemist: [
    S('acid_flask', 'Acid Flask', 1, 4, 'dmg', '🧪', '#b6e04a', 'Hurls corrosive acid.', { dmg: [5, 9] }),
    S('healing_draught', 'Healing Draught', 2, 8, 'heal', '🍶', '#ff8fa3', 'Brew and drink a restorative.', { heal: [18, 26] }),
    S('fire_bomb', 'Fire Bomb', 4, 14, 'dmg', '💣', '#ff7a3c', 'Explodes in the room.', { dmg: [8, 14], aoe: 1 }),
    S('stoneskin', 'Stoneskin Elixir', 6, 10, 'buff', '🪨', '#a8a08a', 'Skin hardens like rock.', { ticks: 14, ac: 5 }),
    S('quicksilver', 'Quicksilver Tonic', 8, 14, 'buff', '🥈', '#cfd8dc', 'Faster, stronger and slippery.', { ticks: 12, atk: 4, evade: 0.1 }),
    S('philosophers_fire', "Philosopher's Fire", 10, 34, 'dmg', '🜂', '#ffb347', 'Liquid flame that sticks and burns.', { dmg: [36, 48], dot: { dmg: [5, 8], ticks: 5 }, cd: 8 }),
  ],
  gunslinger: [
    S('quick_shot', 'Quick Shot', 1, 3, 'dmg', '🔫', '#ffd27f', 'A fast, accurate shot.', { dmg: [5, 9] }),
    S('fan_hammer', 'Fan the Hammer', 2, 8, 'dmg', '💥', '#ffb347', 'Three rapid shots.', { dmg: [3, 6], hits: 3 }),
    S('trick_shot', 'Trick Shot', 4, 9, 'dmg', '🎯', '#ff6b6b', 'Ricochet that stuns.', { dmg: [6, 9], stun: 1 }),
    S('dead_eye', 'Dead Eye', 6, 10, 'buff', '👁️', '#ffd27f', 'Steady aim for critical hits.', { ticks: 10, crit: 0.3, atk: 3 }),
    S('dynamite', 'Dynamite', 8, 18, 'dmg', '🧨', '#ff5a36', 'Lit fuse, big bang.', { dmg: [14, 20], aoe: 1 }),
    S('high_noon', 'High Noon', 10, 32, 'dmg', '🌅', '#ffcf6b', 'Six shots, no mercy.', { dmg: [5, 9], hits: 6, cd: 8 }),
  ],
  barbarian: [
    S('rage', 'Rage', 1, 4, 'buff', '😡', '#ff5a36', 'Hit harder, guard less.', { ticks: 12, atk: 3, ac: -1 }),
    S('cleave', 'Cleave', 2, 6, 'dmg', '🪓', '#d9d9d9', 'Sweeping axe blow.', { dmg: [5, 9], aoe: 1 }),
    S('bone_crusher', 'Bone Crusher', 4, 9, 'dmg', '💥', '#ffb347', 'A crushing, stunning strike.', { dmg: [8, 13], stun: 1 }),
    S('war_cry', 'War Cry', 6, 10, 'buff', '📣', '#ffd27f', 'Roar to harden and heal.', { ticks: 12, ac: 3, atk: 2, heal: [8, 12] }),
    S('whirlwind', 'Whirlwind', 8, 16, 'dmg', '🌪️', '#cfd8dc', 'Spin and hit all around.', { dmg: [14, 20], aoe: 1 }),
    S('unstoppable', 'Unstoppable', 10, 28, 'buff', '🦬', '#ff7a3c', 'Nothing can stop you.', { ticks: 12, atk: 6, ac: 4, regen: 4, heal: [25, 35] }),
  ],
  engineer: [
    S('arc_welder', 'Arc Welder', 1, 4, 'dmg', '🔧', '#7fd6ff', 'Sparks from a welding rig.', { dmg: [5, 9] }),
    S('turret', 'Auto-Turret', 2, 10, 'summon', '🗼', '#cfd8dc', 'Deploys a gun turret.', { ticks: 8, sdmg: [3, 6], sname: 'Auto-turret' }),
    S('repair_kit', 'Repair Kit', 4, 9, 'heal', '🧰', '#7be0a0', 'Patch yourself up.', { heal: [18, 26] }),
    S('tesla_coil', 'Tesla Coil', 6, 16, 'dmg', '⚡', '#ffe66b', 'Shocks all enemies.', { dmg: [11, 17], aoe: 1 }),
    S('rocket_barrage', 'Rocket Barrage', 8, 22, 'dmg', '🚀', '#ff7a3c', 'Three rockets.', { dmg: [8, 13], hits: 3 }),
    S('mecha_suit', 'Mecha Suit', 10, 30, 'buff', '🤖', '#9fb8ff', 'Powered armor.', { ticks: 14, ac: 6, atk: 5 }),
  ],
  necromancer: [
    S('death_touch', 'Death Touch', 1, 4, 'dmg', '💀', '#b69cff', 'A withering touch.', { dmg: [5, 9] }),
    S('life_drain', 'Life Drain', 2, 8, 'dmg', '🩸', '#ff4d6d', 'Steal life from the target.', { dmg: [6, 10], drain: 0.6 }),
    S('raise_skeleton', 'Raise Skeleton', 4, 14, 'summon', '💀', '#cfd8dc', 'A skeleton fights for you.', { ticks: 10, sdmg: [4, 8], sname: 'Risen skeleton' }),
    S('curse', 'Curse', 6, 10, 'dmg', '😈', '#8fd14f', 'Rotting curse.', { dmg: [1, 2], dot: { dmg: [4, 6], ticks: 6 } }),
    S('corpse_burst', 'Corpse Burst', 8, 20, 'dmg', '☣️', '#b6e04a', 'Detonates unlife around you.', { dmg: [14, 20], aoe: 1 }),
    S('soul_harvest', 'Soul Harvest', 10, 32, 'dmg', '👻', '#7b6fb0', 'Reap souls from all foes.', { dmg: [14, 22], aoe: 1, drain: 0.4 }),
  ],
  cleric: [
    S('smite', 'Smite', 1, 4, 'dmg', '✝️', '#ffe9a8', 'Holy strike.', { dmg: [5, 9] }),
    S('heal', 'Heal', 2, 8, 'heal', '💚', '#7be0a0', 'Restore hit points.', { heal: [20, 30] }),
    S('bless', 'Bless', 4, 9, 'buff', '🙏', '#ffe9a8', 'Favored by the gods.', { ticks: 14, atk: 2, ac: 2 }),
    S('holy_light', 'Holy Light', 6, 14, 'dmg', '☀️', '#fff3a8', 'Radiant burst.', { dmg: [18, 26] }),
    S('divine_shield', 'Divine Shield', 8, 18, 'buff', '⛨', '#fff3a8', 'Nearly impervious for a short time.', { ticks: 8, ac: 8 }),
    S('radiance', 'Radiance', 10, 30, 'dmg', '🌟', '#fff3a8', 'Scorches every enemy.', { dmg: [20, 30], aoe: 1 }),
  ],
  druid: [
    S('thorn_lash', 'Thorn Lash', 1, 4, 'dmg', '🌿', '#7be0a0', 'Whip of thorns.', { dmg: [5, 9] }),
    S('regrowth', 'Regrowth', 2, 9, 'heal', '🌱', '#7be0a0', 'Heal now and over time.', { heal: [6, 10], hot: 6, ticks: 5 }),
    S('entangle', 'Entangle', 4, 9, 'dmg', '🌳', '#5fa86a', 'Roots hold the target.', { dmg: [3, 5], stun: 2 }),
    S('summon_wolf', 'Summon Wolf', 6, 14, 'summon', '🐺', '#cfd8dc', 'A wolf fights beside you.', { ticks: 10, sdmg: [5, 9], sname: 'Spirit wolf' }),
    S('barkskin', 'Barkskin', 8, 12, 'buff', '🪵', '#a88b5f', 'Bark armor that mends you.', { ticks: 14, ac: 5, regen: 3 }),
    S('wrath_of_nature', 'Wrath of Nature', 10, 32, 'dmg', '🌩️', '#7fd6ff', 'The wild strikes all foes.', { dmg: [18, 28], aoe: 1 }),
  ],
  bard: [
    S('vicious_mockery', 'Vicious Mockery', 1, 3, 'dmg', '🎭', '#ff9ec7', 'Words that cut.', { dmg: [4, 8] }),
    S('song_of_rest', 'Song of Rest', 2, 8, 'heal', '🎶', '#9fd0e8', 'Soothing heal over time.', { heal: [5, 7], hot: 6, ticks: 5 }),
    S('dissonance', 'Dissonance', 4, 12, 'dmg', '🔔', '#ffd27f', 'A painful chord for everyone.', { dmg: [8, 12], aoe: 1 }),
    S('battle_hymn', 'Battle Hymn', 6, 10, 'buff', '🎺', '#ffd27f', 'Inspires attack and defense.', { ticks: 14, atk: 3, ac: 2, crit: 0.1 }),
    S('lullaby', 'Lullaby', 8, 14, 'dmg', '💤', '#9fb8ff', 'Puts the target to sleep.', { dmg: [1, 2], stun: 3 }),
    S('crescendo', 'Crescendo', 10, 30, 'dmg', '🎼', '#ff9ec7', 'A shattering finale.', { dmg: [38, 52], cd: 8 }),
  ],
  scavenger: [ // gathering/crafting "spells". Cost stamina (mana). Gathering needs a resource node in the room.
    S('forage', 'Forage', 1, 3, 'gather', '🌿', '#7be0a0', 'Botany: gather herbs.', { school: 'Botany', res: 'herb', yield: [1, 2], loot: [['herb', 1]] }),
    S('harvest_bloom', 'Harvest Bloom', 3, 5, 'gather', '🌸', '#ff9ec7', 'Botany: herbs, sometimes rare blooms.', { school: 'Botany', res: 'herb', yield: [1, 2], loot: [['herb', 3], ['bloom', 2]] }),
    S('green_thumb', 'Green Thumb', 6, 8, 'gather', '🌳', '#5fa86a', 'Botany: a rich harvest.', { school: 'Botany', res: 'herb', yield: [2, 3], loot: [['herb', 2], ['bloom', 2]] }),
    S('prospect', 'Prospect', 1, 3, 'gather', '⛏️', '#cfd8dc', 'Mining: chip out ore.', { school: 'Mining', res: 'ore', yield: [1, 2], loot: [['ore', 1]] }),
    S('pickaxe_strike', 'Pickaxe Strike', 3, 5, 'gather', '⚒️', '#aab', 'Mining: more ore, a chance at silver.', { school: 'Mining', res: 'ore', yield: [1, 3], loot: [['ore', 3], ['silver', 1]] }),
    S('deep_vein', 'Deep Vein', 6, 8, 'gather', '💎', '#9fd0e8', 'Mining: tap a rich vein.', { school: 'Mining', res: 'ore', yield: [2, 3], loot: [['ore', 2], ['silver', 2]] }),
    S('cast_line', 'Cast Line', 1, 3, 'gather', '🎣', '#7fd6ff', 'Fishing: catch a fish.', { school: 'Fishing', res: 'fish', yield: [1, 1], loot: [['fish', 1]] }),
    S('deep_cast', 'Deep Cast', 3, 5, 'gather', '🐟', '#7fd6ff', 'Fishing: bigger catches, a chance at pearls.', { school: 'Fishing', res: 'fish', yield: [1, 2], loot: [['fish', 3], ['pearl', 1]] }),
    S('net_haul', 'Net Haul', 6, 8, 'gather', '🕸️', '#9fd0e8', 'Fishing: haul in a netful.', { school: 'Fishing', res: 'fish', yield: [2, 4], loot: [['fish', 1]] }),
    S('field_craft', 'Field Craft', 1, 2, 'craft', '🧵', '#e9b44c', 'Crafting: basic salves, food and tools. Use: cast field_craft <recipe>', { school: 'Crafting', tier: 1, cd: 1 }),
    S('forge_work', 'Forge Work', 3, 4, 'craft', '🔨', '#ff7a3c', 'Crafting: iron gear (needs a forge).', { school: 'Crafting', tier: 2, forge: 1, cd: 1 }),
    S('alchemy_brew', 'Alchemy Brew', 5, 4, 'craft', '⚗️', '#b6e04a', 'Crafting: tonics and charms.', { school: 'Crafting', tier: 3, cd: 1 }),
    S('master_craft', 'Master Craft', 8, 6, 'craft', '👑', '#ffd27f', 'Crafting: silver weapons and armor (needs a forge).', { school: 'Crafting', tier: 4, forge: 1, cd: 1 }),
  ],
};

SPELLS.wirewalker = [
  S('spark', 'Spark', 1, 4, 'dmg', '⚡', '#19e3ff', 'A jolt of hostile code fried straight into the target.', { dmg: [5, 9] }),
  S('static_burst', 'Static Burst', 2, 7, 'dmg', '📡', '#7fd6ff', 'Scrambles the target\'s senses and stuns it for a turn.', { dmg: [6, 10], stun: 1 }),
  S('logic_bomb', 'Logic Bomb', 4, 10, 'dmg', '💣', '#ff4fd8', 'A hidden payload that keeps burning.', { dmg: [3, 5], dot: { dmg: [4, 6], ticks: 5 } }),
  S('firewall', 'Firewall', 6, 12, 'buff', '🧱', '#19e3ff', 'Wraps you in hardened code.', { ticks: 14, ac: 4 }),
  S('drone_swarm', 'Drone Swarm', 8, 16, 'summon', '🛸', '#cfd8dc', 'Hijacks nearby drones to attack for you.', { ticks: 10, sdmg: [5, 9], sname: 'Hijacked drones' }),
  S('overclock', 'Overclock', 10, 14, 'buff', '🔌', '#ffd27f', 'Push your gear past its limits.', { ticks: 12, atk: 4, evade: 0.1, crit: 0.1 }),
];

SPELLS.dragon = [
  S('ember_bite', 'Ember Bite', 1, 4, 'dmg', '🔥', '#ff7a1a', 'A bite wreathed in flame.', { dmg: [8, 13] }),
  S('tail_sweep', 'Tail Sweep', 2, 8, 'dmg', '🐉', '#ffb347', 'A crushing sweep that stuns everything near you.', { dmg: [7, 11], aoe: 1, stun: 1 }),
  S('fire_breath', 'Fire Breath', 4, 14, 'dmg', '🌋', '#ff5a36', 'Breathe fire over every enemy.', { dmg: [12, 18], aoe: 1 }),
  S('dragonscale', 'Dragonscale', 6, 12, 'buff', '🛡️', '#ffd27f', 'Your scales harden.', { ticks: 16, ac: 6, atk: 3 }),
  S('wing_buffet', 'Wing Buffet', 8, 16, 'dmg', '🌪️', '#cfd8dc', 'A hurricane of wings that stuns all foes.', { dmg: [18, 26], aoe: 1, stun: 1 }),
  S('dragons_roar', "Dragon's Roar", 10, 18, 'buff', '📣', '#ff7a1a', 'A roar that heals and empowers you.', { ticks: 14, atk: 8, crit: 0.15, heal: [30, 50] }),
];
SPELLS.android = [
  S('laser_burst', 'Laser Burst', 1, 4, 'dmg', '🔴', '#ff4f4f', 'A focused laser pulse.', { dmg: [8, 13] }),
  S('overcharge', 'Overcharge', 2, 8, 'buff', '⚡', '#ffe66b', 'Run your systems hot.', { ticks: 12, atk: 4, crit: 0.1 }),
  S('repair_nanites', 'Repair Nanites', 4, 10, 'heal', '🧬', '#7be0a0', 'Nanites knit your frame back together.', { heal: [26, 36] }),
  S('missile_pod', 'Missile Pod', 6, 14, 'dmg', '🚀', '#ff7a3c', 'Three micro-missiles.', { dmg: [6, 10], hits: 3 }),
  S('shield_matrix', 'Shield Matrix', 8, 14, 'buff', '🔷', '#9fb8ff', 'A projected energy shield.', { ticks: 14, ac: 8, evade: 0.1 }),
  S('emp_pulse', 'EMP Pulse', 10, 18, 'dmg', '📡', '#7fd6ff', 'Stuns every enemy in range.', { dmg: [14, 20], aoe: 1, stun: 1 }),
];
SPELLS.shapeshifter = [
  S('rending_claws', 'Rending Claws', 1, 4, 'dmg', '🐾', '#7be0a0', 'Slashing claws.', { dmg: [8, 13] }),
  S('beast_form', 'Beast Form', 2, 8, 'buff', '🐺', '#a88b5f', 'Take a stronger shape.', { ticks: 14, atk: 5, ac: 2 }),
  S('pounce', 'Pounce', 4, 10, 'dmg', '🐆', '#ffb347', 'A leap that stuns the target.', { dmg: [12, 18], stun: 1 }),
  S('regenerate', 'Regenerate', 6, 12, 'heal', '🌿', '#7be0a0', 'Heal now and keep healing.', { heal: [10, 14], hot: 10, ticks: 6 }),
  S('wolf_pack', 'Wolf Pack', 8, 16, 'summon', '🐺', '#cfd8dc', 'Call a pack to fight beside you.', { ticks: 12, sdmg: [10, 16], sname: 'Wolf pack' }),
  S('mist_form', 'Mist Form', 10, 14, 'buff', '🌫️', '#9fb8ff', 'Become hard to hit.', { ticks: 12, evade: 0.25, ac: 4 }),
];

// ---- high-level abilities (levels 15, 22, 30, 40). Power scales up by +12% per level past 10 in magic.js ----
const push = (c, ...l) => SPELLS[c].push(...l);
push('magician', S('arcane_barrage', 'Arcane Barrage', 15, 45, 'dmg', '🔮', '#b69cff', 'Four rapid arcane bolts.', { dmg: [12, 18], hits: 4 }),
  S('blizzard', 'Blizzard', 22, 60, 'dmg', '🌨️', '#7fd6ff', 'Freezing storm that stuns all foes.', { dmg: [30, 45], aoe: 1, stun: 1 }),
  S('disintegrate', 'Disintegrate', 30, 90, 'dmg', '💠', '#e0a8ff', 'Unravels one target.', { dmg: [110, 150], cd: 8 }),
  S('cataclysm', 'Cataclysm', 40, 140, 'dmg', '🌌', '#ff6bd6', 'Reality itself breaks around your foes.', { dmg: [140, 190], aoe: 1, cd: 10 }));
push('thief', S('eviscerate', 'Eviscerate', 15, 30, 'dmg', '🩸', '#e5603f', 'Brutal strike, great on wounded foes.', { dmg: [35, 50], exec: 1, crit: 0.3 }),
  S('venom_storm', 'Venom Storm', 22, 45, 'dmg', '🐍', '#8fd14f', 'Poison daggers for everyone.', { dmg: [10, 15], aoe: 1, dot: { dmg: [8, 12], ticks: 6 } }),
  S('shadow_dance', 'Shadow Dance', 30, 50, 'buff', '🌑', '#7b6fb0', 'Untouchable and lethal.', { ticks: 12, evade: 0.35, crit: 0.35, atk: 10 }),
  S('nights_end', "Night's End", 40, 110, 'dmg', '🌙', '#9a8cff', 'One perfect cut.', { dmg: [130, 180], exec: 1, crit: 0.5, cd: 10 }));
push('alchemist', S('transmute_armor', 'Transmute Armor', 15, 40, 'buff', '🥇', '#ffd27f', 'Turn your skin to gold.', { ticks: 16, ac: 12, atk: 6 }),
  S('elixir_of_life', 'Elixir of Life', 22, 55, 'heal', '💖', '#ff8fa3', 'A powerful restorative.', { heal: [90, 130] }),
  S('plague_flask', 'Plague Flask', 30, 80, 'dmg', '☣️', '#b6e04a', 'A cloud of contagion.', { dmg: [20, 30], aoe: 1, dot: { dmg: [10, 14], ticks: 6 } }),
  S('magnum_opus', 'Magnum Opus', 40, 130, 'dmg', '⚗️', '#ffb347', 'Your life work, released.', { dmg: [120, 170], aoe: 1, cd: 10 }));
push('gunslinger', S('gatling_burst', 'Gatling Burst', 15, 35, 'dmg', '🔫', '#ffd27f', 'Eight shots in a blink.', { dmg: [6, 10], hits: 8 }),
  S('piercing_round', 'Piercing Round', 22, 40, 'dmg', '🎯', '#ff6b6b', 'Armor-piercing, stunning shot.', { dmg: [50, 70], stun: 1 }),
  S('bullet_time', 'Bullet Time', 30, 55, 'buff', '⏱️', '#cfd8dc', 'Slow the world down.', { ticks: 12, evade: 0.3, crit: 0.3, atk: 12 }),
  S('judgment_day', 'Judgment Day', 40, 110, 'dmg', '⚖️', '#ffcf6b', 'Five rounds into every foe.', { dmg: [20, 28], hits: 5, aoe: 1, cd: 10 }));
push('barbarian', S('blood_fury', 'Blood Fury', 15, 30, 'buff', '🩸', '#ff5a36', 'Fury that heals.', { ticks: 14, atk: 12, regen: 6, heal: [40, 60] }),
  S('earthshatter', 'Earthshatter', 22, 40, 'dmg', '🌋', '#ffb347', 'Shakes the ground, stunning all.', { dmg: [30, 45], aoe: 1, stun: 1 }),
  S('berserk', 'Berserk', 30, 60, 'buff', '👹', '#ff3b3b', 'Overwhelming power.', { ticks: 14, atk: 20, ac: 8, regen: 8 }),
  S('ragnarok', 'Ragnarok', 40, 100, 'dmg', '⚔️', '#ff7a3c', 'The end of the world, delivered by axe.', { dmg: [150, 210], aoe: 1, cd: 10 }));
push('engineer', S('flame_turret', 'Flame Turret', 15, 45, 'summon', '🔥', '#ff7a3c', 'A turret that roasts enemies.', { ticks: 10, sdmg: [12, 20], sname: 'Flame turret' }),
  S('chain_gun', 'Chain Gun', 22, 50, 'dmg', '🔫', '#ffd27f', 'Six-barrel suppression.', { dmg: [14, 20], hits: 6 }),
  S('nano_repair', 'Nano Repair', 30, 70, 'heal', '🧬', '#7be0a0', 'Swarm of repair machines.', { heal: [100, 140] }),
  S('orbital_strike', 'Orbital Strike', 40, 130, 'dmg', '🛰️', '#7fd6ff', 'Fire from orbit.', { dmg: [200, 260], cd: 10 }));
push('necromancer', S('bone_spear', 'Bone Spear', 15, 40, 'dmg', '🦴', '#e0e0d0', 'Hurls a lance of bone.', { dmg: [40, 55] }),
  S('raise_wraith', 'Raise Wraith', 22, 60, 'summon', '👻', '#9a8cff', 'A wraith fights for you.', { ticks: 12, sdmg: [18, 28], sname: 'Raised wraith' }),
  S('plague', 'Plague', 30, 75, 'dmg', '🦠', '#8fd14f', 'Rotting sickness for all.', { dmg: [8, 12], aoe: 1, dot: { dmg: [8, 12], ticks: 6 } }),
  S('army_of_the_dead', 'Army of the Dead', 40, 140, 'dmg', '⚰️', '#b69cff', 'The grave empties around your foes.', { dmg: [130, 180], aoe: 1, drain: 0.3, cd: 10 }));
push('cleric', S('greater_heal', 'Greater Heal', 15, 40, 'heal', '💞', '#7be0a0', 'A mighty healing.', { heal: [80, 120] }),
  S('sanctuary', 'Sanctuary', 22, 55, 'buff', '⛪', '#fff3a8', 'Holy ground protects you.', { ticks: 10, ac: 20, regen: 8 }),
  S('wrath_of_heaven', 'Wrath of Heaven', 30, 80, 'dmg', '🌩️', '#fff3a8', 'Lightning from above.', { dmg: [100, 140] }),
  S('divine_intervention', 'Divine Intervention', 40, 140, 'heal', '👼', '#ffffff', 'The gods mend you.', { heal: [250, 350], cd: 10 }));
push('druid', S('moonfire', 'Moonfire', 15, 35, 'dmg', '🌙', '#b6c8ff', 'Silver flame that lingers.', { dmg: [30, 45], dot: { dmg: [8, 12], ticks: 5 } }),
  S('rejuvenation', 'Rejuvenation', 22, 55, 'heal', '🌿', '#7be0a0', 'Heals now and keeps healing.', { heal: [30, 40], hot: 15, ticks: 6 }),
  S('summon_bear', 'Summon Bear', 30, 80, 'summon', '🐻', '#a88b5f', 'A great bear fights beside you.', { ticks: 12, sdmg: [22, 34], sname: 'Spirit bear' }),
  S('cataclysmic_storm', 'Cataclysmic Storm', 40, 130, 'dmg', '🌪️', '#7fd6ff', 'Nature ends your enemies.', { dmg: [140, 190], aoe: 1, cd: 10 }));
push('bard', S('hymn_of_valor', 'Hymn of Valor', 15, 40, 'buff', '🎵', '#ffd27f', 'Sing of heroes.', { ticks: 16, atk: 10, ac: 8, crit: 0.15 }),
  S('symphony_of_pain', 'Symphony of Pain', 22, 55, 'dmg', '🎻', '#ff9ec7', 'A deafening chord for all.', { dmg: [35, 50], aoe: 1 }),
  S('requiem', 'Requiem', 30, 70, 'heal', '🕯️', '#9fd0e8', 'A song that mends.', { heal: [90, 130], hot: 10, ticks: 5 }),
  S('grand_finale', 'Grand Finale', 40, 130, 'dmg', '🎆', '#ff9ec7', 'The performance of a lifetime.', { dmg: [150, 200], aoe: 1, cd: 10 }));
push('wirewalker', S('brute_force', 'Brute Force', 15, 45, 'dmg', '🔨', '#19e3ff', 'Four hammering code strikes.', { dmg: [12, 18], hits: 4 }),
  S('system_crash', 'System Crash', 22, 60, 'dmg', '💥', '#7fd6ff', 'Crashes every enemy system and stuns them.', { dmg: [30, 45], aoe: 1, stun: 1 }),
  S('black_spike', 'Black Spike', 30, 90, 'dmg', '🕷️', '#ff4fd8', 'A lethal neural spike.', { dmg: [110, 150], cd: 8 }),
  S('total_blackout', 'Total Blackout', 40, 140, 'dmg', '🌑', '#9a8cff', 'Everything electrical near your foes dies at once.', { dmg: [140, 190], aoe: 1, cd: 10 }));
push('dragon', S('inferno', 'Inferno', 15, 50, 'dmg', '♨️', '#ff5a36', 'A sea of fire that keeps burning.', { dmg: [24, 34], aoe: 1, dot: { dmg: [8, 12], ticks: 5 } }),
  S('ancient_fury', 'Ancient Fury', 22, 70, 'dmg', '💢', '#ff7a1a', 'Three savage strikes.', { dmg: [40, 60], hits: 3 }),
  S('wyrm_form', 'Wyrm Form', 30, 90, 'buff', '🐲', '#ffd27f', 'Assume your true form.', { ticks: 16, atk: 24, ac: 14, regen: 14, heal: [80, 120] }),
  S('cataclysm_breath', 'Cataclysm Breath', 40, 140, 'dmg', '☄️', '#ff3b1f', 'The end of the world, exhaled.', { dmg: [200, 260], aoe: 1, cd: 10 }));
push('android', S('drone_wing', 'Drone Wing', 15, 50, 'summon', '🛸', '#cfd8dc', 'A wing of attack drones.', { ticks: 12, sdmg: [16, 26], sname: 'Drone wing' }),
  S('target_lock', 'Target Lock', 22, 60, 'buff', '🎯', '#ff4f4f', 'Lock on, never miss.', { ticks: 14, crit: 0.3, atk: 14 }),
  S('orbital_cannon', 'Orbital Cannon', 30, 90, 'dmg', '🛰️', '#7fd6ff', 'Fire from orbit.', { dmg: [160, 210], cd: 8 }),
  S('singularity', 'Singularity', 40, 140, 'dmg', '🕳️', '#9a8cff', 'A gravity well that crushes and stuns.', { dmg: [210, 270], aoe: 1, stun: 1, cd: 10 }));
push('shapeshifter', S('savage_frenzy', 'Savage Frenzy', 15, 45, 'dmg', '🩸', '#ff4d6d', 'Five frenzied strikes.', { dmg: [10, 15], hits: 5 }),
  S('stone_hide', 'Stone Hide', 22, 55, 'buff', '🪨', '#a8a08a', 'A hide like granite that mends you.', { ticks: 14, ac: 16, regen: 8 }),
  S('chimera_form', 'Chimera Form', 30, 90, 'buff', '🦁', '#ffd27f', 'Wear three beasts at once.', { ticks: 16, atk: 20, ac: 10, crit: 0.2, regen: 10 }),
  S('apex_predator', 'Apex Predator', 40, 140, 'dmg', '🦅', '#ff7a1a', 'Hunt every enemy at once and feed.', { dmg: [190, 250], aoe: 1, drain: 0.3, cd: 10 }));
push('scavenger', S('mithril_lode', 'Mithril Lode', 12, 7, 'gather', '🔷', '#9fd0e8', 'Mining: ore with a chance at mithril.', { school: 'Mining', res: 'ore', yield: [1, 2], loot: [['ore', 2], ['mithril', 2]] }),
  S('grand_harvest', 'Grand Harvest', 14, 9, 'gather', '🌻', '#ffd27f', 'Botany: a huge harvest of herbs and blooms.', { school: 'Botany', res: 'herb', yield: [3, 4], loot: [['herb', 2], ['bloom', 3]] }),
  S('runic_forge', 'Runic Forge', 16, 6, 'craft', '🔱', '#9fd0e8', 'Crafting: mithril gear (needs a forge).', { school: 'Crafting', tier: 5, forge: 1, cd: 1 }),
  S('dragon_forge', 'Dragon Forge', 30, 8, 'craft', '🐲', '#ff7a3c', 'Crafting: dragonscale gear (needs a forge).', { school: 'Crafting', tier: 6, forge: 1, cd: 1 }));

const RECIPES = [
  { k: 'salve', tier: 1, need: { herb: 2 }, out: 'salve' },
  { k: 'grilled_fish', tier: 1, need: { fish: 1 }, out: 'grilled' },
  { k: 'scrap_knife', tier: 1, need: { ore: 1 }, out: 'scrapknife' },
  { k: 'miners_pick', tier: 2, need: { ore: 2 }, out: 'pick' },
  { k: 'iron_helm', tier: 2, need: { ore: 2 }, out: 'helm' },
  { k: 'iron_buckler', tier: 2, need: { ore: 3 }, out: 'buckler' },
  { k: 'tonic', tier: 3, need: { bloom: 1, herb: 1 }, out: 'tonic' },
  { k: 'pearl_pendant', tier: 3, need: { pearl: 1, ore: 1 }, out: 'pendant' },
  { k: 'silver_blade', tier: 4, need: { silver: 3, ore: 1 }, out: 'silverblade' },
  { k: 'silver_mail', tier: 4, need: { silver: 4 }, out: 'silvermail' },
  { k: 'mithril_sword', tier: 5, need: { mithril: 4, ore: 2 }, out: 'mithrilsword' },
  { k: 'mithril_mail', tier: 5, need: { mithril: 6, ore: 2 }, out: 'mithrilmail' },
  { k: 'mithril_helm', tier: 5, need: { mithril: 3 }, out: 'mithrilhelm' },
  { k: 'mithril_shield', tier: 5, need: { mithril: 4 }, out: 'mithrilshield' },
  { k: 'mithril_boots', tier: 5, need: { mithril: 3 }, out: 'mithrilboots' },
  { k: 'dragon_sword', tier: 6, need: { scale: 5, mithril: 3 }, out: 'dragonsword' },
  { k: 'dragon_mail', tier: 6, need: { scale: 8, mithril: 3 }, out: 'dragonmail' },
  { k: 'dragon_helm', tier: 6, need: { scale: 4 }, out: 'dragonhelm' },
  { k: 'dragon_shield', tier: 6, need: { scale: 5 }, out: 'dragonshield' },
  { k: 'dragon_boots', tier: 6, need: { scale: 4 }, out: 'dragonboots' },
];

const ORD = ['Botany', 'Mining', 'Fishing', 'Crafting']; SPELLS.scavenger.sort((a, b) => ORD.indexOf(a.school) - ORD.indexOf(b.school) || a.lvl - b.lvl);

// ---- remort classes added later: Gambler, Ripperdoc, Outlaw ----
const SP = (k, n, lvl, mp, kind, i, c, d, o) => ({ k, n, lvl, mp, kind, i, c, d, ...o });
SPELLS.gambler = [SP('card_flick', 'Card Flick', 1, 4, 'dmg', '\u{1F0CF}', '#ff4f6b', 'A razor-edged playing card thrown at speed.', { dmg: [8, 13] }),
  SP('loaded_dice', 'Loaded Dice', 2, 8, 'dmg', '\u{1F3B2}', '#ffffff', 'Weighted dice that crack a skull and stun.', { dmg: [7, 11], stun: 1 }),
  SP('lucky_streak', 'Lucky Streak', 4, 10, 'buff', '\u{1F340}', '#7be0a0', 'Everything lands your way.', { ticks: 14, crit: 0.2, atk: 4 }),
  SP('double_down', 'Double Down', 6, 12, 'dmg', '\u{2660}\uFE0F', '#cfd8dc', 'Two cards, two hits.', { dmg: [10, 16], hits: 2 }),
  SP('ace_in_the_sleeve', 'Ace in the Sleeve', 8, 16, 'dmg', '\u{1F0A1}', '#ffd27f', 'A hidden ace for a nasty surprise.', { dmg: [20, 30] }),
  SP('bluff', 'Bluff', 10, 16, 'buff', '\u{1F60F}', '#9fb8ff', 'They are no longer sure where you are.', { ticks: 14, ac: 6, evade: 0.15 }),
  SP('wild_card', 'Wild Card', 15, 40, 'dmg', '\u{1F0CF}', '#ff4fd8', 'Anything can happen, and it hurts.', { dmg: [14, 56] }),
  SP('house_enforcer', 'House Enforcer', 22, 60, 'summon', '\u{1F574}\uFE0F', '#cfd8dc', 'The house sends muscle.', { ticks: 12, sdmg: [18, 28], sname: 'House enforcer' }),
  SP('all_in', 'All In', 30, 80, 'dmg', '\u{1F4B0}', '#ffd34a', 'Everything on one hand.', { dmg: [170, 220], cd: 8 }),
  SP('royal_flush', 'Royal Flush', 40, 130, 'dmg', '\u{1F451}', '#ff3b3b', 'Five cards, five wounds.', { dmg: [48, 62], hits: 5, cd: 10 })];
SPELLS.ripperdoc = [SP('scalpel_slash', 'Scalpel Slash', 1, 4, 'dmg', '\u{1F52A}', '#cfd8dc', 'A quick, precise cut.', { dmg: [8, 13] }),
  SP('stim_shot', 'Stim Shot', 2, 8, 'heal', '\u{1F489}', '#7be0a0', 'A syringe of something good.', { heal: [26, 36] }),
  SP('cyber_graft', 'Cyber Graft', 4, 12, 'buff', '\u{1F9BE}', '#7fd6ff', 'Bolt on a little extra.', { ticks: 16, ac: 6, atk: 3 }),
  SP('bonesaw', 'Bonesaw', 6, 14, 'dmg', '\u{1FA9A}', '#e5603f', 'Three fast, ugly cuts.', { dmg: [6, 10], hits: 3 }),
  SP('nano_suture', 'Nano Suture', 8, 16, 'heal', '\u{1F9EC}', '#9fe0a0', 'Nanites stitch you shut.', { heal: [44, 64] }),
  SP('adrenal_rush', 'Adrenal Rush', 10, 18, 'buff', '\u{26A1}', '#ffe66b', 'Pure adrenaline.', { ticks: 14, atk: 8, crit: 0.15, heal: [30, 50] }),
  SP('organ_harvest', 'Organ Harvest', 15, 45, 'dmg', '\u{1FAC0}', '#ff4f4f', 'Take something vital, bleed them for it.', { dmg: [26, 38], dot: { dmg: [8, 12], ticks: 5 } }),
  SP('chrome_overload', 'Chrome Overload', 22, 65, 'dmg', '\u{1F50C}', '#7fd6ff', 'Every implant at once, shocking everyone near.', { dmg: [40, 56], aoe: 1, stun: 1 }),
  SP('revival_protocol', 'Revival Protocol', 30, 90, 'heal', '\u{1F691}', '#7be0a0', 'Clear! Bring yourself back from the edge.', { heal: [220, 300], cd: 8 }),
  SP('surgical_strike', 'Surgical Strike', 40, 130, 'dmg', '\u{1F3AF}', '#ff3b3b', 'One perfect incision.', { dmg: [220, 280], crit: 0.4, cd: 10 })];
SPELLS.outlaw = [SP('pistol_whip', 'Pistol Whip', 1, 4, 'dmg', '\u{1F52B}', '#cfd8dc', 'Hard, fast and rude.', { dmg: [8, 13] }),
  SP('smoke_out', 'Smoke Out', 2, 8, 'dmg', '\u{1F32B}\uFE0F', '#b0bec5', 'Choking smoke that stuns everyone near.', { dmg: [7, 11], aoe: 1, stun: 1 }),
  SP('quick_draw', 'Quick Draw', 4, 12, 'dmg', '\u{1F4A5}', '#ffb347', 'Faster than you can blink.', { dmg: [8, 12], hits: 2 }),
  SP('outlaws_luck', "Outlaw's Luck", 6, 12, 'buff', '\u{1F340}', '#7be0a0', 'The law keeps missing.', { ticks: 14, ac: 5, evade: 0.15, atk: 3 }),
  SP('lasso', 'Lasso', 8, 14, 'dmg', '\u{1FA22}', '#d2a679', 'Rope them in and hold them still.', { dmg: [14, 20], stun: 1 }),
  SP('dynamite_toss', 'Dynamite Toss', 10, 18, 'dmg', '\u{1F9E8}', '#ff5a36', 'Light it, throw it, run.', { dmg: [16, 22], aoe: 1 }),
  SP('bounty_hunt', 'Bounty Hunt', 15, 40, 'dmg', '\u{1F3AF}', '#e5603f', 'Brutal on wounded targets.', { dmg: [30, 46], exec: 1 }),
  SP('jailbreak', 'Jailbreak', 22, 60, 'buff', '\u{1F513}', '#ffd27f', 'Break out stronger than before.', { ticks: 14, atk: 14, ac: 8, heal: [60, 90] }),
  SP('gunfight_at_noon', 'Gunfight at Noon', 30, 80, 'dmg', '\u{1F305}', '#ff7a1a', 'High noon, one shot.', { dmg: [170, 220], crit: 0.3, cd: 8 }),
  SP('last_stand', 'Last Stand', 40, 130, 'dmg', '\u{1F480}', '#ff3b3b', 'Six shots, no regrets.', { dmg: [36, 48], hits: 6, cd: 10 })];
SPELLS.pirate = [SP('cutlass_slash', 'Cutlass Slash', 1, 4, 'dmg', '\u{1F5E1}\uFE0F', '#cfd8dc', 'A quick, salty slash.', { dmg: [8, 13] }),
  SP('swig_of_grog', 'Swig of Grog', 2, 8, 'heal', '\u{1F37A}', '#d2a679', 'Rum fixes everything. Temporarily.', { heal: [24, 34] }),
  SP('cannon_shot', 'Cannon Shot', 4, 12, 'dmg', '\u{1F4A5}', '#ff8a3c', 'A ship\'s cannonball to the chest.', { dmg: [14, 20] }),
  SP('parrot_attack', 'Parrot Attack', 6, 14, 'summon', '\u{1F99C}', '#7be0a0', 'Your parrot goes for the eyes.', { ticks: 12, sdmg: [10, 16], sname: 'Parrot' }),
  SP('keelhaul', 'Keelhaul', 8, 16, 'dmg', '\u2693', '#7fd6ff', 'Dragged under the hull, stunned and soaked.', { dmg: [14, 20], stun: 1 }),
  SP('yo_ho_ho', 'Yo Ho Ho!', 10, 18, 'buff', '\u{1F3F4}\u200D\u2620\uFE0F', '#ffd27f', 'A rousing shanty that heals and empowers.', { ticks: 14, atk: 8, crit: 0.15, heal: [30, 50] }),
  SP('broadside', 'Broadside', 15, 50, 'dmg', '\u{1F6A2}', '#ff5a36', 'Every cannon at once.', { dmg: [26, 36], aoe: 1 }),
  SP('boarding_party', 'Boarding Party', 22, 65, 'summon', '\u{1F3F4}', '#cfd8dc', 'Your crew swarms over the rail.', { ticks: 12, sdmg: [20, 30], sname: 'Boarding party' }),
  SP('plunder', 'Plunder', 30, 80, 'dmg', '\u{1F4B0}', '#ffd34a', 'Take everything that is not nailed down.', { dmg: [170, 220], crit: 0.3, cd: 8 }),
  SP('krakens_wrath', "Kraken's Wrath", 40, 140, 'dmg', '\u{1F419}', '#9a8cff', 'The deep answers your call.', { dmg: [190, 250], aoe: 1, stun: 1, cd: 10 })];
// ---- every ability gets a one-word command (typed as it is, e.g. `fireball`, `song`), so nothing needs typing with underscores in a fight ----
const ONEWORD_STOP = new Set(['of', 'the', 'a', 'to', 'in', 'and', 'for', 'on', 'at']), ONEWORD_DULL = new Set(['end', 'bolt', 'shot', 'blade', 'strike', 'storm', 'bomb', 'form', 'call', 'touch', 'burst', 'blast', 'wave', 'round']);
const ONEWORD_PICK = { second_wind: 'secondwind', shrug_it_off: 'shrug', mountain_heart: 'mountain', bullet_time: 'bullet', judgment_day: 'judgment', dead_eye: 'deadeye', wrath_of_heaven: 'wrath', army_of_the_dead: 'army', symphony_of_pain: 'symphony', all_in: 'allin', ace_in_the_sleeve: 'ace', quick_draw: 'quickdraw', scalpel_slash: 'scalpel', pistol_whip: 'pistolwhip', forage: 'gather', field_craft: 'fieldcraft', forge_work: 'forgework', master_craft: 'mastercraft', dragon_forge: 'dragonforge', deep_cast: 'deepcast', cast_line: 'castline', philosophers_fire: 'philosopher', nights_end: 'nightsend', transmute_armor: 'transmute', wrath_of_nature: 'wrath', cataclysmic_storm: 'cataclysm' }; // hand-picked words where the automatic choice would be vague
function oneWord() {
  const reserved = new Set(['n', 's', 'e', 'w', 'u', 'd', 'ne', 'nw', 'se', 'sw', 'in', 'out', 'north', 'south', 'east', 'west', 'up', 'down', 'i', 'inv', 'eq', 'equipment', 'k', 'l', 'sc', 'rc', 'run', 'cmds', 'cmd', 'top', 'bj', 'hit', 'stand', 'chat', 'gos', 'take', 'attack', 'say', 'look', 'kill', 'flee', 'get', 'drop', 'quit', 'save', 'push', 'pray', 'rest', 'eat', 'drink', 'wear', 'wield', 'remove', 'list', 'buy', 'sell', 'talk', 'accept', 'quests', 'help', 'who', 'score', 'class', 'luck', 'spells', 'cast', 'tell', 'shout', 'team', 'gossip']);
  try { const h = require('./helpdocs'); for (const k of [...Object.keys(h.H), ...Object.keys(h.T)]) reserved.add(k); } catch (e) { /* helpdocs missing: fine */ }
  try { for (const k of Object.keys(require('./socials').SOC || {})) reserved.add(k); } catch (e) { /* socials missing: fine */ }
  for (const list of Object.values(SPELLS)) {
    const used = new Set();
    for (const s of list) { s.was = s.k; const parts = s.k.split('_').filter((x) => x && !ONEWORD_STOP.has(x));
      const last = parts[parts.length - 1], order = [ONEWORD_DULL.has(last) ? parts[0] : last, ONEWORD_DULL.has(last) ? last : parts[0], ...parts, parts.join('')].filter(Boolean).map((x) => x.replace(/[^a-z0-9]/g, ''));
      let w = ONEWORD_PICK[s.k] && !used.has(ONEWORD_PICK[s.k]) ? ONEWORD_PICK[s.k] : order.find((c) => c && !used.has(c) && !reserved.has(c)); if (!w) { let n = 2; w = order[0] + n; while (used.has(w)) w = order[0] + ++n; } used.add(w); s.k = w; }
  }
}
oneWord();
// ---- remort abilities: every remort level unlocks one new, stronger one-word ability (Remort 1 = the first ... Remort 40 = the last). They are added to your class's own list. ----
const REMORT_NAMES = [['rekindle', 'Rekindle'], ['afterimage', 'Afterimage'], ['resurgence', 'Resurgence'], ['wraithfire', 'Wraithfire'], ['ascendance', 'Ascendance'], ['starfall', 'Starfall'], ['tempest', 'Tempest'], ['onslaught', 'Onslaught'], ['cinderstorm', 'Cinderstorm'], ['transcend', 'Transcendence'],
  ['eclipse', 'Eclipse'], ['maelstrom', 'Maelstrom'], ['flurry', 'Thousand Cuts'], ['blight', 'Rebirth Blight'], ['apotheosis', 'Apotheosis'], ['comet', 'Comet Strike'], ['cyclone', 'Cyclone'], ['gauntlet', 'Gauntlet'], ['hellfire', 'Hellfire'], ['immortal', 'Immortal Form'],
  ['supernova', 'Supernova'], ['quake', 'Worldquake'], ['devastate', 'Devastation'], ['voidrot', 'Voidrot'], ['ascendant', 'Ascendant'], ['oblivion', 'Oblivion'], ['armageddon', 'Armageddon'], ['verdict', 'Final Verdict'], ['abyssfire', 'Abyssfire'], ['eternity', 'Eternity'],
  ['quasar', 'Quasar'], ['ruination', 'Ruination'], ['annihilate', 'Annihilate'], ['skyfall', 'Skyfall'], ['timeless', 'Timeless'], ['extinction', 'Extinction'], ['worldbreak', 'Worldbreaker'], ['twilight', 'Twilight of Worlds'], ['paradox', 'Paradox'], ['godslayer', 'Godslayer']];
const REMORT_ICONS = ['\u{1F525}', '\u2728', '\u26A1', '\u{1F300}', '\u{1F4AB}', '\u2604\uFE0F', '\u{1F30B}', '\u{1F32A}\uFE0F'], REMORT_COLORS = ['#ff9a3c', '#ffd34a', '#7fd6ff', '#c77dff', '#ff5a36', '#7be0a0', '#ff7ad9', '#e9e9e9'];
const REMORT_SPELLS = REMORT_NAMES.map(([k, n], i) => { const r = i + 1, a = Math.round(16 + r * 7.2), b = Math.round(a * 1.32), kind = r % 5, base = { k, n, lvl: Math.min(40, r + 2), mp: Math.min(220, 18 + r * 5), i: REMORT_ICONS[i % 8], c: REMORT_COLORS[i % 8], rem: r, school: 'Rebirth' };
  const d = `A power only the reborn command (Remort ${r}).`;
  if (kind === 1) return { ...base, kind: 'dmg', d, dmg: [a, b], crit: Math.min(0.25, 0.08 + r * 0.004) };
  if (kind === 2) return { ...base, kind: 'dmg', d, dmg: [Math.round(a * 0.8), Math.round(b * 0.8)], aoe: 1, cd: 4 + Math.floor(r / 8) };
  if (kind === 3) return { ...base, kind: 'dmg', d, dmg: [Math.round(a * 0.5), Math.round(b * 0.5)], hits: 3 + Math.floor(r / 15) };
  if (kind === 4) return { ...base, kind: 'dmg', d, dmg: [Math.round(a * 0.7), Math.round(b * 0.7)], dot: { dmg: [Math.round(a * 0.25), Math.round(b * 0.25)], ticks: 5 } };
  return { ...base, kind: 'buff', d, ticks: 14 + Math.floor(r / 10), atk: Math.round(4 + r * 0.9), ac: Math.round(3 + r * 0.6), crit: Math.min(0.35, 0.1 + r * 0.005), regen: Math.round(r / 2), heal: [Math.round(a * 1.6), Math.round(b * 1.6)], cd: 12 };
});
{ const taken = new Set(); for (const l of Object.values(SPELLS)) for (const s of l) taken.add(s.k); for (const s of REMORT_SPELLS) if (taken.has(s.k)) s.k = s.k + 'x'; } // never clash with a class ability
module.exports = { CLASSES, SPELLS, RECIPES, REMORT_SPELLS };
