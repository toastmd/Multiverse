'use strict';
// NPCs and quests. Objectives: ['kill', mobId, n] | ['get', itemId, n] (consumed on turn-in) | ['visit', roomId] | ['talk', npcId]
// Edit and type `update` as a wizard to reload.
const N = (name, room, hi, long) => ({ name, room, hi, long });
const NPCS = {
  torv: N('Fixer Torv', 'town/adventurers_guild', 'Another hopeful. Good. The board needs fewer unfinished contracts.', 'A scarred veteran who runs the Adventurers\' Guild and knows every job in Ashfall. Type `board` to see open quests.'),
  elara: N('Doc Elara', 'town/temple', 'The dawn keeps you, traveler.', 'A gentle priestess in white. She tends the temple and hates the walking dead.'),
  brann: N('Brann the Smith', 'town/smithy', 'Mind the sparks.', 'A broad man with forearms like logs.'),
  mara: N('Mara the Innkeeper', 'town/inn', 'Sit, sit. Can I get you something warm?', 'Mara runs the Silver Spur Saloon with an iron hand and a soft heart.'),
  hale: N('Captain Hale', 'town/gate', 'Keep your sword close, friend. The roads are not what they were.', 'The weary captain of Ashfall\'s gate guard.'),
  pell: N('Old Pell', 'town/market', 'Potions, tonics, remedies! Fresh as of last Tuesday!', 'A cheerful apothecary with stained fingers.'),
  fenwick: N('Old Fenwick', 'forest/hermits_clearing', 'The wood speaks, if you listen.', 'A hermit herbalist with moss in his beard.'),
  aldous: N('Brother Aldous', 'crypt/reliquary', 'I keep the old bones company. The new bones I could do without.', 'A thin, pale priest who guards the crypt\'s last quiet corner.'),
  barnaby: N('Old Barnaby', 'marsh/sunken_boat', 'Careful where you put your feet. The marsh puts back what it takes.', 'A fisherman who has lived on a wrecked boat for thirty years.'),
  greta: N('Greta of the Inn', 'road/abandoned_inn', 'Not many stop here anymore. Bandits, mostly.', 'A tough woman who refuses to abandon her family\'s inn.'),
  durn: N('Foreman Durn', 'mines/foremans_office', 'This was a good mine once. Now it is a grave with a payroll.', 'A stout dwarf with a soot-black beard.'),
  rashid: N('Sheikh Rashid', 'dunes/nomad_camp', 'Peace upon you, stranger. The sand remembers everything.', 'The dignified leader of a nomad band.'),
  ulf: N('Hermit Ulf', 'frost/hermits_igloo', 'You came up here on purpose? Then you are either brave or foolish. Maybe both.', 'A bearded hermit wrapped in furs.'),
  sael: N('Pyromancer Sael', 'ember/scorched_camp', 'The fire is not the enemy. What lives in it is.', 'A soot-streaked mage who studies the Wastes.'),
  voss: N('Sergeant Voss', 'cit/guard_post', 'Still holding the post. Somebody has to.', 'The last living soldier of the Citadel garrison.'),
  watcher: N('The Watcher', 'abyss/dream_fragment', 'You should not be here. And yet you are the first who might end it.', 'A figure of drifting light that watches the Void.'),
};

// Quest points (qp): awarded once per quest, on first completion. Default scales with level; boss quests are set below.
const BOSS_QP = { q_warlord: 5, q_barn4: 5, q_greta3: 6, q_durn4: 7, q_rash3: 10, q_ulf3: 12, q_sael3: 14, q_voss3: 16, q_watch2: 25 };

// Death taunts: a random NPC shouts one at the fallen player ({name} is replaced). `_` is the fallback pool.
const TAUNTS = {
  torv: ['{name} went down like a sack of scrap. The board is still open, if you can walk.', 'Another contract left unfinished by {name}. Typical.'],
  elara: ['Oh, {name}. I do patch the living, you know. Try staying that way.', '{name} fell again. The clinic has a cot with your name on it.'],
  brann: ['Ha! {name} got flattened. Should have bought the good armor.', 'I forged better than that, {name}. You just did not duck.'],
  mara: ['{name} is dead? Well, the drinks are on someone else tonight.', 'Poor {name}. Never tipped me, never ducked.'],
  hale: ['{name} could not hold the line. Pathetic.', 'Down goes {name}. Try armor next time.'],
  pell: ['{name} dead again? My stims are not magic, you know!', 'Should have bought two potions, {name}. Always buy two.'],
  fenwick: ['The wood remembers {name}, and it is laughing.', '{name} fell. The ferns will grow well this year.'],
  aldous: ['Rest, {name}. Though I suspect you will not rest long.', '{name} joins the quiet crowd. Briefly.'],
  barnaby: ['Marsh got {name}. Told ya to watch yer feet.', '{name} swallowed the mud. Happens to the best of us. Mostly the worst.'],
  greta: ['Hah! The road ate {name} alive.', '{name} dead on the Redrock Trail. I told you to avoid it.'],
  durn: ['{name} got buried. Typical surface-dweller.', 'Rock does not forgive, {name}. Neither do I.'],
  rashid: ['The sand takes {name}. The sand takes everyone eventually.', 'Peace upon {name}. Mostly pieces.'],
  ulf: ['{name} froze. Knew you would.', 'Cold got {name}. I did warn you. Loudly.'],
  sael: ['{name} burned out. I would say I am surprised.', 'Another crispy adventurer: {name}. Add it to my notes.'],
  voss: ['{name} fell on duty. Worse, no one saw it.', 'Dead again, {name}? I would salute, but I am laughing.'],
  watcher: ['{name} is gone. The Void keeps count.', 'I saw it coming, {name}. I always do.'],
  _: ['{name} is dead. How embarrassing.'],
};

// Quest XP grows with quest level: one level's worth of XP at the quest's level, scaled by the kind of quest (boss x2.5, kill x1, fetch x0.7, visit/talk x0.5, follow-ups +25%).
const XPGAP = (l) => 50 * (2 * l - 1), XPKIND = (id, obj) => (BOSS_QP[id] ? 2.5 : obj.some((o) => o[0] === 'kill') ? 1 : obj.some((o) => o[0] === 'get') ? 0.7 : 0.5);
const Q = (id, name, giver, min, text, obj, rew, after) => ({ id, name, giver, min, text, obj, rew: { ...rew, xp: Math.round(XPGAP(min) * XPKIND(id, obj) * (after ? 1.25 : 1)), qp: rew.qp ?? BOSS_QP[id] ?? Math.max(1, Math.ceil(min / 4)) }, after });
const QUESTS = [
  // Ashfall
  Q('q_first', 'First Steps', 'torv', 1, 'Meet Doc Elara at the Dawn Clinic (the Temple of the Dawn), just north of the inn. She patches up new runners for free.', [['talk', 'elara']], { xp: 40, gold: 20 }),
  Q('q_rats', 'Rat Trouble', 'hale', 1, 'Giant rats are swarming the forest path north of the gate. Kill four.', [['kill', 'rat', 4]], { xp: 90, gold: 40, items: ['potion'] }, 'q_first'),
  Q('q_herbs', 'Herbs for the Inn', 'mara', 1, 'Bring me three wild herbs for my stew. You will find them in the Whisperwood (Prospectors can forage).', [['get', 'herb', 3]], { xp: 70, gold: 30, items: ['salve'] }),
  Q('q_trout', "Pell's Fish Pie", 'pell', 3, 'Two river trout for my famous fish pie. Try the Reed Pond off the forest path.', [['get', 'fish', 2]], { xp: 150, gold: 70, items: ['mana1', 'mana1'] }),
  Q('q_goblins', 'Goblin Menace', 'torv', 3, 'Goblins in the Moonlit Clearing and Bramble Thicket are raiding travelers. Kill five.', [['kill', 'goblin', 5]], { xp: 250, gold: 100 }, 'q_rats'),
  Q('q_wolves', 'Wolves at the Stream', 'hale', 5, 'Grey wolves have taken sheep and a shepherd. Kill four.', [['kill', 'wolf', 4]], { xp: 420, gold: 160, items: ['ironsword'] }, 'q_goblins'),
  Q('q_dead', 'The Restless Dead', 'elara', 6, 'The dead stir beneath the Fallen Chapel. Destroy five skeletons.', [['kill', 'skeleton', 5]], { xp: 600, gold: 220 }, 'q_wolves'),
  Q('q_warlord', 'Warlord of the Crypt', 'elara', 8, 'The Skeleton Warlord commands the crypt. End him.', [['kill', 'warlord', 1]], { xp: 1600, gold: 600, items: ['steelmail'] }, 'q_dead'),
  Q('q_scout_marsh', 'Scout the Marsh', 'torv', 8, 'Reach the Hag\'s Hut in the Sunken Marsh and report what you see.', [['visit', 'marsh/hut']], { xp: 700, gold: 250 }),
  Q('q_scout_dunes', 'Scout the Dunes', 'torv', 18, 'Reach the Sunken Ruins in the Sunscorch Dunes.', [['visit', 'dunes/ruins']], { xp: 2500, gold: 800 }),
  Q('q_scout_frost', 'Scout Frostpeak', 'torv', 24, 'Climb to the Hall of the Frost Giant. Look, then leave.', [['visit', 'frost/hall']], { xp: 4500, gold: 1500 }),
  Q('q_scout_abyss', 'Into the Dark', 'torv', 36, 'The Abyss lies below the Dread Marshal\'s throne. Descend to the Black Stair.', [['visit', 'abyss/stair']], { xp: 9000, gold: 4000 }),
  // Whisperwood and the Crypt
  Q('q_fen1', "Fenwick's Herbs", 'fenwick', 2, 'My garden needs five wild herbs from the wood.', [['get', 'herb', 5]], { xp: 120, gold: 50 }),
  Q('q_fen2', 'Thicket Goblins', 'fenwick', 4, 'Goblins trample my herb beds. Kill six.', [['kill', 'goblin', 6]], { xp: 300, gold: 120 }, 'q_fen1'),
  Q('q_ald1', 'Bones and Dust', 'aldous', 4, 'Skeletons walk my quiet halls. Put six to rest.', [['kill', 'skeleton', 6]], { xp: 350, gold: 140 }),
  Q('q_ald2', 'Ghoul Hunt', 'aldous', 6, 'The ghouls in the Ossuary and Burial Cells must be silenced. Kill four.', [['kill', 'ghoul', 4]], { xp: 700, gold: 280, items: ['strong'] }, 'q_ald1'),
  // Sunken Marsh
  Q('q_barn1', 'Leech Plague', 'barnaby', 8, 'Giant leeches foul my fishing water. Kill six.', [['kill', 'leech', 6]], { xp: 800, gold: 300 }),
  Q('q_barn2', 'Catch of the Day', 'barnaby', 8, 'Bring me four fresh trout and I will pay well.', [['get', 'fish', 4]], { xp: 600, gold: 250 }),
  Q('q_barn3', "The Hag's Bargain", 'barnaby', 10, 'The marsh hag in her hut curses the water. Kill her.', [['kill', 'marsh_hag', 1]], { xp: 1200, gold: 500 }, 'q_barn1'),
  Q('q_barn4', 'Hydra Hunter', 'barnaby', 12, 'A hydra nests in the sinkhole east of the hut. Slay it.', [['kill', 'hydra', 1]], { xp: 2500, gold: 1000, items: ['steelshield'] }, 'q_barn3'),
  // Redrock Trail
  Q('q_greta1', 'Clear the Road', 'greta', 12, 'Bandits strangle the Redrock Trail. Kill six.', [['kill', 'bandit', 6]], { xp: 1200, gold: 450 }),
  Q('q_greta2', 'Highway Justice', 'greta', 14, 'The highwaymen are worse. Kill five.', [['kill', 'highwayman', 5]], { xp: 1800, gold: 700 }, 'q_greta1'),
  Q('q_greta3', "Captain's Bounty", 'greta', 16, 'Their captain holds the crossroads. Take him down.', [['kill', 'outlaw_captain', 1]], { xp: 3500, gold: 1500, items: ['mithrilhelm'] }, 'q_greta2'),
  // Silverado Mines
  Q('q_durn1', 'Spiders in the Dark', 'durn', 12, 'Cave spiders have claimed my tunnels. Kill six.', [['kill', 'cave_spider', 6]], { xp: 1100, gold: 400 }),
  Q('q_durn2', 'Ore for the Forge', 'durn', 12, 'Bring me six lumps of iron ore and I will pay for them.', [['get', 'ore', 6]], { xp: 700, gold: 350 }),
  Q('q_durn3', 'Stone Giants', 'durn', 15, 'The rock golems still guard the old forge. Smash three.', [['kill', 'rock_golem', 3]], { xp: 2400, gold: 900 }, 'q_durn1'),
  Q('q_durn4', 'The King Below', 'durn', 17, 'The Delver King sits on the silver. End his reign.', [['kill', 'delver_king', 1]], { xp: 5000, gold: 2000, items: ['mithrilmail'] }, 'q_durn3'),
  // Sunscorch Dunes
  Q('q_rash1', 'Scorpion Stingers', 'rashid', 18, 'Giant scorpions threaten our caravans. Kill six.', [['kill', 'scorpion', 6]], { xp: 3000, gold: 1200 }),
  Q('q_rash2', 'Wraith Whispers', 'rashid', 20, 'Sand wraiths haunt the Black Obelisk. Destroy five.', [['kill', 'sand_wraith', 5]], { xp: 4000, gold: 1600 }, 'q_rash1'),
  Q('q_rash3', 'The Sleeping King', 'rashid', 24, 'The undying pharaoh wakes. Return him to the dust.', [['kill', 'pharaoh', 1]], { xp: 9000, gold: 4000, items: ['runedsword'] }, 'q_rash2'),
  // Frostpeak
  Q('q_ulf1', 'Wolf Pack', 'ulf', 24, 'Ice wolves hunt the pass. Kill six.', [['kill', 'ice_wolf', 6]], { xp: 6000, gold: 2200 }),
  Q('q_ulf2', 'Yeti Fur', 'ulf', 26, 'Yetis raid my stores. Kill four.', [['kill', 'yeti', 4]], { xp: 7500, gold: 3000 }, 'q_ulf1'),
  Q('q_ulf3', "Giant's Fall", 'ulf', 29, 'The frost giant keeps the winter alive. Fell him.', [['kill', 'frost_giant', 1]], { xp: 14000, gold: 6000, items: ['adamantsword'] }, 'q_ulf2'),
  // Ember Wastes
  Q('q_sael1', 'Imp Infestation', 'sael', 30, 'Fire imps pester my experiments. Kill eight.', [['kill', 'fire_imp', 8]], { xp: 9000, gold: 4000 }),
  Q('q_sael2', 'Magma Cores', 'sael', 32, 'I need magma elementals destroyed. Kill four.', [['kill', 'magma_elemental', 4]], { xp: 11000, gold: 5000 }, 'q_sael1'),
  Q('q_sael3', 'Titan Down', 'sael', 33, 'The Magma Titan stirs in the Caldera. Stop it.', [['kill', 'magma_titan', 1]], { xp: 22000, gold: 9000, items: ['dragonmail'] }, 'q_sael2'),
  // Shattered Citadel
  Q('q_voss1', 'Cursed Armor', 'voss', 35, 'My comrades walk as cursed knights. Free eight of them.', [['kill', 'cursed_knight', 8]], { xp: 16000, gold: 8000 }),
  Q('q_voss2', 'Gargoyle Cull', 'voss', 36, 'The gargoyles circle our walls. Kill six.', [['kill', 'gargoyle', 6]], { xp: 18000, gold: 9000 }, 'q_voss1'),
  Q('q_voss3', 'The Dread Marshal', 'voss', 38, 'Our commander rules the dead. End his watch.', [['kill', 'dread_marshal', 1]], { xp: 40000, gold: 20000, items: ['dragonsword'] }, 'q_voss2'),
  // The Abyss
  Q('q_watch1', 'Void Stalkers', 'watcher', 39, 'The stalkers feed on all that passes. Destroy eight.', [['kill', 'void_stalker', 8]], { xp: 30000, gold: 15000 }),
  Q('q_watch2', 'End of Everything', 'watcher', 40, 'The Voidlord waits at the Heart of the Void. End it.', [['kill', 'voidlord', 1]], { xp: 100000, gold: 50000, items: ['grand', 'grand', 'grand'] }, 'q_watch1'),
];

// ---- newer areas, their NPCs and contracts, and extra taunts ----
{ const X = require('./quests2')({ N, Q, BOSS_QP }); Object.assign(NPCS, X.NPCS); QUESTS.push(...X.QUESTS); for (const [k, v] of Object.entries(X.TAUNTS)) TAUNTS[k] = [...(TAUNTS[k] || []), ...v]; }

module.exports = { NPCS, QUESTS, TAUNTS };
