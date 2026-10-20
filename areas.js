'use strict';
// Content for levels 8-40: gear tiers, potions, shops, the Temple of the Dawn, and eight new areas.
// Called from world.js (hot-reloadable with `update`). Monster stats are generated from level.
module.exports = (items, mobs, rooms) => {
  const OPP = { n: 's', s: 'n', e: 'w', w: 'e', u: 'd', d: 'u' };
  const R = (id, area, x, y, z, name, long, mob = [], extra = {}) => { rooms[id] = { name, area, x, y, z, long, exits: {}, mobs: mob, ...extra }; };
  const L = (a, d, b) => { rooms[a].exits[d] = b; rooms[b].exits[OPP[d]] = a; };

  // ---- gear tiers: [id, name, level req, dmg lo, dmg hi, armor, price] (void gear is drop-only) ----
  const TIERS = [['iron', 'scrap', 5, 4, 9, 3, 100], ['steel', 'carbon', 10, 8, 15, 5, 350], ['mithril', 'nano-weave', 16, 14, 24, 8, 1000], ['runed', 'runed', 22, 20, 34, 11, 2500],
    ['adamant', 'smartsteel', 28, 28, 46, 14, 6000], ['dragon', 'dragonscale', 33, 36, 58, 17, 12000], ['void', 'voidforged', 38, 46, 72, 20, 0]];
  for (const [k, nm, lvl, lo, hi, a, pr] of TIERS) {
    const g = (s, name, slot, ac, v) => { items[k + s] = { name: `${nm} ${name}`, ids: [k + s], type: 'armor', slot, ac, lvl, value: Math.round(pr * v), long: `A ${nm} ${name}, made for level ${lvl} and up.` }; };
    items[k + 'sword'] = { name: `${nm} blade`, ids: [k + 'sword'], type: 'weapon', dmg: [lo, hi], lvl, value: pr, long: `A ${nm} blade, made for level ${lvl} and up.` };
    g('mail', 'vest', 'body', a, 1.2); g('helm', 'helmet', 'head', Math.ceil(a / 2), 0.5); g('shield', 'riot shield', 'shield', Math.round(a * 0.7), 0.6); g('boots', 'boots', 'feet', Math.ceil(a * 0.4), 0.4);
  }
  // ---- potions and materials ----
  const pot = (id, name, o) => { items[id] = { name, ids: [id], type: 'potion', long: 'A stoppered vial.', ...o }; };
  pot('strong', 'strong stim', { heal: 120, value: 60 }); pot('greater', 'military stim', { heal: 320, value: 160 });
  pot('superior', 'trauma kit', { heal: 700, value: 350 }); pot('grand', 'revive kit', { heal: 1500, value: 800 });
  pot('mana1', 'blue cell', { mana: 40, value: 20 }); pot('mana2', 'azure cell', { mana: 120, value: 60 });
  pot('mana3', 'cobalt cell', { mana: 300, value: 150 }); pot('mana4', 'sapphire cell', { mana: 650, value: 330 });
  // cooked meals (Cooking tradeskill): heal and give a timed buff
  const meal = (id, name, heal, value, buff, long) => { items[id] = { name, ids: [id], type: 'potion', heal, value, buff, long }; };
  meal('noodles', 'noodle bowl', 40, 12, null, 'Fish and herbs over hot noodles.'); meal('fishstew', 'fish stew', 90, 30, { ac: 2, ticks: 30 }, 'Thick, warming, and a little armoring.');
  meal('pearlchowder', 'pearl chowder', 200, 90, { ac: 4, regen: 3, ticks: 40 }, 'Rich chowder with a pearl-dusted crust.'); meal('huntersfeast', "hunter's feast", 400, 200, { atk: 10, ticks: 40 }, 'A feast for people who hit things.');
  meal('banquet', 'frontier banquet', 900, 500, { atk: 20, ac: 8, regen: 8, ticks: 40 }, 'The best meal in the multiverse, and the most expensive to make.');
  items.mithril = { name: 'mithril ore', ids: ['mithril'], type: 'material', value: 100, long: 'Silver-blue metal, light as a feather.' };
  items.scale = { name: 'dragon scale', ids: ['scale'], type: 'material', value: 200, long: 'Hard as steel, warm to the touch.' };
  // ---- cyberware: installed at the Chrome Clinic. Each piece costs Aura (6.0 max); less Aura means a smaller mana pool. ----
  const cy = (id, name, lvl, aura, value, bonus, long) => { items[id] = { name, ids: [id], type: 'cyber', lvl, aura, value, bonus, long }; };
  cy('dermal', 'dermal plating', 1, 0.5, 120, { ac: 3 }, 'Subdermal armor mesh.'); cy('smartlink', 'smartlink', 3, 0.3, 220, { pool: 1, dmg: 2 }, 'Links your eye to your weapon.');
  cy('reflex1', 'wired reflexes', 5, 0.6, 320, { pool: 2 }, 'Spinal boosters for faster reactions.'); cy('neuralbuf', 'neural buffer', 6, 0.4, 420, { mp: 30 }, 'Stores extra spell energy.');
  cy('muscle', 'muscle weave', 8, 0.6, 520, { str: 3, dmg: 3 }, 'Synthetic fibers over your own muscle.'); cy('bonelace', 'bone lacing', 10, 0.7, 760, { hp: 60, ac: 2 }, 'Reinforced skeleton.');
  cy('reflex2', 'synaptic booster', 16, 1, 2500, { pool: 4 }, 'Military-grade nerve acceleration.'); cy('dermal2', 'plated dermis', 16, 1, 2600, { ac: 8 }, 'Dense ceramic plating under the skin.');
  cy('organs', 'hardened organs', 18, 1, 3200, { hp: 150 }, 'Cloned, hardened internals.'); cy('cannon', 'cyberarm cannon', 20, 1.2, 4000, { dmg: 8 }, 'A weapon mount in your forearm.');
  cy('adrenal', 'adrenal pump', 30, 1.5, 12000, { pool: 6, hp: 250 }, 'An artificial heart that never panics.'); cy('mindamp', 'mind amplifier', 30, 1, 15000, { mp: 200 }, 'Cranial spell-capacitor.');
  cy('titan', 'titan frame', 34, 1.8, 20000, { ac: 16, str: 8, dmg: 15 }, 'Full skeletal and muscular overhaul.');
  const V = { sword: 0, cap: 0, jerkin: 0, shield: 0, boots: 0, dagger: 20, axe: 40, blade: 400, mail: 150, potion: 15, salve: 10, grilled: 6, tonic: 40, herb: 5, bloom: 25, ore: 10,
    silver: 40, fish: 6, pearl: 50, pick: 40, helm: 35, buckler: 50, pendant: 80, silverblade: 400, silvermail: 500 };
  for (const [k, v] of Object.entries(V)) if (items[k]) items[k].value = v;

  // ---- monster generator: level -> hp, damage, armor, xp, gold, drops ----
  const M = (id, name, icon, lv, o = {}) => {
    const b = o.boss ? 1 : 0, m = b ? 1.5 : 1, t = TIERS.filter((x) => x[2] <= lv && lv - x[2] < 10 && x[0] !== 'void').pop(), nt = TIERS.find((x) => x[2] > lv && x[0] !== 'void');
    const heal = lv < 8 ? 'potion' : lv < 18 ? 'strong' : lv < 28 ? 'greater' : lv < 36 ? 'superior' : 'grand', mana = lv < 14 ? 'mana1' : lv < 24 ? 'mana2' : lv < 34 ? 'mana3' : 'mana4';
    const drops = [[heal, 0.2], [mana, 0.1], ...(t ? ['sword', 'mail', 'helm', 'shield', 'boots'].map((s) => [t[0] + s, b ? 0.35 : 0.05]) : []),
      ...(b && nt ? [[nt[0] + 'sword', 0.4], [nt[0] + 'mail', 0.4]] : []), ...(lv >= 12 ? [['mithril', 0.1]] : []), ...(lv >= 28 ? [['scale', 0.15]] : []), ...(o.drops || [])];
    mobs[id] = { name, ids: o.ids || [], icon, level: lv, hp: Math.round(12 * lv ** 1.5 * Math.min(1, 0.3 + lv * 0.05) * (1 + Math.max(0, lv - 24) * 0.06) * (b ? 2.5 : 1)), str: 8 + lv, dex: 8 + Math.floor(lv * 0.8), con: 8 + lv,
      dmg: [Math.round((2 + lv * 1.1) * m), Math.round((5 + lv * 2) * m)], ac: Math.floor(lv * 0.9) + (b ? 3 : 0), xp: Math.round(10 * lv * (b ? 8 : 1)),
      boss: !!b, aggro: o.aggro ?? lv >= 6, wander: !!o.wander, gold: [lv * 3 * (b ? 4 : 1), lv * 8 * (b ? 4 : 1)], drops };
  };

  // ---- Ashfall: temple, armory, east gate, shops ----
  R('town/temple', 'town', -1, -1, 0, 'Temple of the Dawn', 'Pale light streams through tall windows onto a worn altar. A priestess smiles at every newcomer. Type `pray` to be healed and refreshed. It is free for adventurers up to level 15.', [], { safe: true, healer: true });
  R('town/armory', 'town', 1, 1, 0, 'Ironbound Armory', 'Racks of mail and shields line the walls. The armorer will sell you protection, and buy your spare gear. Try `list`.', [], { safe: true, shop: { stock: ['ironmail', 'ironhelm', 'ironshield', 'ironboots', 'steelmail', 'steelhelm', 'steelshield', 'steelboots'] } });
  R('town/eastgate', 'town', 2, 0, 0, 'East Gate', 'A wide arch opens onto the Redrock Trail. Merchants and soldiers argue in the shade.', [], { safe: true });
  L('town/inn', 'n', 'town/temple'); L('town/gate', 'w', 'town/temple'); L('town/smithy', 'e', 'town/armory'); L('town/market', 's', 'town/armory'); L('town/market', 'e', 'town/eastgate');
  Object.assign(rooms['town/market'], { name: 'Market Row', safe: true, shop: { stock: ['potion', 'strong', 'mana1', 'mana2', 'salve'] }, long: 'Stalls crowd both sides of the lane. An apothecary sells potions and vials. Try `list`, `buy`, `sell`.' });
  delete rooms['town/market'].items;
  Object.assign(rooms['town/smithy'], { shop: { stock: ['dagger', 'axe', 'ironsword', 'steelsword'] }, long: 'The forge ticks as it cools. Brann sells blades at the counter. A free rack by the door holds plain starter gear for newcomers. Try `list`.' });
  rooms['town/smithy'].safe = true; rooms['town/square'].safe = true; rooms['town/gate'].safe = true;
  rooms['town/quarry'].mobs = ['rat'];

  R('town/clinic', 'town', -2, 0, 0, 'Chrome Clinic', 'A neon-lit ripperdoc clinic behind the Silver Spur Saloon. Surgical chairs, humming coolers, and a doctor who asks no questions. Type `list` for cyberware, `install <name>` to buy and fit it, `uninstall <name>` to remove it for a 50% refund. Chrome costs Aura, and less Aura means a smaller mana pool.', [], { safe: true, clinic: { stock: ['dermal', 'smartlink', 'reflex1', 'neuralbuf', 'muscle', 'bonelace', 'reflex2', 'dermal2', 'organs', 'cannon', 'adrenal', 'mindamp', 'titan'] } });
  L('town/inn', 'w', 'town/clinic');
  // ---- Neural implant series: expensive, small attribute boosts. Install in order (Mk I, II, ...); each upgrade trades in the old one for 50%. ----
  const LINES = [['brawn', 'Brawn', 'str'], ['reflex', 'Reflex', 'dex'], ['grit', 'Grit', 'con'], ['mind', 'Mind', 'mind'], ['will', 'Will', 'will'], ['charm', 'Charm', 'charm']];
  const ROM = ['I', 'II', 'III', 'IV', 'V'], IV = [2000, 8000, 30000, 100000, 300000], IA = [0.1, 0.15, 0.2, 0.25, 0.3], IL = [1, 12, 24, 36, 40], IMPLANTS = [];
  for (const [line, nm, key] of LINES) for (let t = 0; t < 5; t++) {
    const id = `imp_${line}${t + 1}`; IMPLANTS.push(id);
    items[id] = { name: `${nm} implant Mk ${ROM[t]}`, ids: [id], type: 'cyber', lvl: IL[t], aura: IA[t], value: IV[t], bonus: { [key]: t + 1 }, line, tier: t + 1, long: `A neural implant that raises your ${nm} by ${t + 1}.` };
  }
  R('town/implant_lab', 'town', -3, 0, 0, 'Neural Implant Lab', 'A sterile white lab behind the clinic. Sealed trays of neural implants gleam under cold light, each priced like a small house. Type `list` to see the series. Install Mk I first, then upgrade in order: the old implant is traded in for half its price. Each costs a little Aura.', [], { safe: true, clinic: { stock: IMPLANTS } });
  L('town/clinic', 'w', 'town/implant_lab');
  R('town/salvage_exchange', 'town', 2, 1, 0, 'Salvage Exchange', 'A cramped trading post of crates, scales and sorting bins, run by a salvager who buys anything you can dig, pick or catch. Gathered materials sell here for 60% of their value (other shops pay 40%), and the basics are on sale for crafters. Type `list`, `sell materials`, `buy`.', [], { safe: true, exchange: true, shop: { stock: ['herb', 'bloom', 'ore', 'silver', 'fish', 'pearl'] } });
  L('town/armory', 'e', 'town/salvage_exchange');
  R('town/hall_of_rebirth', 'town', -2, -1, 0, 'Hall of Rebirth', 'A round chamber of white stone and humming cables, lit from below by a pool of slow, glowing water. At level 40 you may step into the pool and be reborn. Type `remort` for details.', [], { safe: true, rebirth: true });
  L('town/temple', 'w', 'town/hall_of_rebirth');

  // ---- Redrock Trail (levels 12-16) ----
  R('road/mile1', 'road', 3, 0, 0, 'Redrock Trail, First Mile', 'A rutted road with burned-out wagons in the ditch.', ['bandit', 'bandit'], { res: { herb: 2 } });
  R('road/mile2', 'road', 4, 0, 0, 'Redrock Trail, Second Mile', 'Dry grass, crows and long shadows. Someone is watching from the rocks.', ['highwayman', 'highwayman']);
  R('road/fork', 'road', 5, 0, 0, 'The Crossroads', 'A signpost points north to the Frostpeak Pass and east to the Sunscorch Dunes. A bandit chief holds this junction.', ['outlaw_captain']);
  M('bandit', 'road bandit', '🦹', 12, { wander: true }); M('highwayman', 'highwayman', '🤠', 14, { wander: true }); M('outlaw_captain', 'outlaw captain', '🏴‍☠️', 16, { boss: 1, ids: ['captain'] });
  L('town/eastgate', 'e', 'road/mile1'); L('road/mile1', 'e', 'road/mile2'); L('road/mile2', 'e', 'road/fork');

  // ---- Sunken Marsh (levels 8-13): east of the forest stream ----
  R('marsh/edge', 'marsh', 2, -3, 0, 'Marsh Edge', 'The forest gives way to black water and drifting mist.', ['bog_lurker', 'bog_lurker'], { res: { herb: 3 } });
  R('marsh/reeds', 'marsh', 3, -3, 0, 'Whispering Reeds', 'Tall reeds hide things that ripple the water.', ['leech', 'crocodile'], { res: { fish: 4 } });
  R('marsh/mire', 'marsh', 3, -4, 0, 'Stinking Mire', 'Each step sinks to the knee. Bubbles of foul gas rise around you.', ['crocodile', 'crocodile']);
  R('marsh/hut', 'marsh', 4, -3, 0, 'Hag\'s Hut', 'A hut on stilts, hung with bones and drying herbs.', ['marsh_hag'], { res: { herb: 4 } });
  R('marsh/den', 'marsh', 4, -4, 0, 'Hydra Den', 'A sinkhole of churned mud. Something very large coils at the center.', ['hydra']);
  M('bog_lurker', 'bog lurker', '🐸', 8); M('leech', 'giant leech', '🪱', 9); M('crocodile', 'crocodile', '🐊', 10); M('marsh_hag', 'marsh hag', '🧙‍♀️', 11, { ids: ['hag'] }); M('hydra', 'swamp hydra', '🐉', 13, { boss: 1, ids: ['hydra'] });
  L('forest/stream', 'e', 'marsh/edge'); L('marsh/edge', 'e', 'marsh/reeds'); L('marsh/reeds', 'n', 'marsh/mire'); L('marsh/reeds', 'e', 'marsh/hut'); L('marsh/hut', 'n', 'marsh/den'); L('marsh/mire', 'e', 'marsh/den');

  // ---- Silverado Mines (levels 12-17): below the Old Quarry ----
  R('mines/entry', 'mines', 1, -1, -1, 'Mine Entrance', 'Rusted rails lead into a timbered tunnel.', ['cave_spider'], { res: { ore: 3 } });
  R('mines/tunnel', 'mines', 2, -1, -1, 'Collapsed Tunnel', 'Webs hang thick across the beams.', ['cave_spider', 'cave_spider']);
  R('mines/shaft', 'mines', 2, 0, -1, 'Lift Shaft', 'A rusted cage hangs over a black drop.', ['kobold', 'dwarf_zombie']);
  R('mines/forge', 'mines', 3, 0, -1, 'Abandoned Forge', 'A dwarven forge, cold for a century. The anvil still rings when struck.', ['rock_golem'], { forge: true, res: { ore: 4 } });
  R('mines/vault', 'mines', 3, 1, -1, 'Delver\'s Vault', 'Silver veins glitter in the walls. A crowned figure guards them.', ['delver_king'], { res: { ore: 3 } });
  M('cave_spider', 'cave spider', '🕷️', 12); M('kobold', 'kobold sapper', '🦎', 13); M('dwarf_zombie', 'dwarf zombie', '🧟‍♂️', 14); M('rock_golem', 'rock golem', '🗿', 15); M('delver_king', 'Delver King', '👑', 17, { boss: 1, ids: ['king', 'delver'] });
  L('town/quarry', 'd', 'mines/entry'); L('mines/entry', 'e', 'mines/tunnel'); L('mines/tunnel', 's', 'mines/shaft'); L('mines/shaft', 'e', 'mines/forge'); L('mines/forge', 's', 'mines/vault');

  // ---- Sunscorch Dunes (levels 18-24): east of the crossroads ----
  R('dunes/oasis', 'dunes', 6, 0, 0, 'Dune Bazaar', 'A walled oasis of tents and fountains. Traders sell gear for travelers heading deeper. Try `list`.', [], { safe: true, res: { fish: 3, herb: 2 }, shop: { stock: ['mithrilsword', 'mithrilmail', 'mithrilhelm', 'mithrilshield', 'mithrilboots', 'runedsword', 'runedmail', 'runedhelm', 'runedshield', 'runedboots', 'greater', 'mana3'] } });
  R('dunes/sands', 'dunes', 7, 0, 0, 'Burning Sands', 'Heat shimmers over endless dunes.', ['scorpion', 'scorpion']);
  R('dunes/obelisk', 'dunes', 7, 1, 0, 'Black Obelisk', 'A monolith whispers in a forgotten tongue.', ['sand_wraith', 'sand_wraith']);
  R('dunes/ruins', 'dunes', 8, 0, 0, 'Sunken Ruins', 'Half-buried columns frame a stair that leads down.', ['mummy', 'sphinx']);
  R('dunes/tomb', 'dunes', 8, 0, -1, 'Pharaoh\'s Tomb', 'Gold glints in the dark. The sarcophagus lid is already moving.', ['pharaoh']);
  M('scorpion', 'giant scorpion', '🦂', 18); M('sand_wraith', 'sand wraith', '👻', 20); M('mummy', 'ancient mummy', '⚱️', 21); M('sphinx', 'sphinx', '🦁', 22); M('pharaoh', 'undying pharaoh', '👁️', 24, { boss: 1, ids: ['pharaoh'] });
  L('road/fork', 'e', 'dunes/oasis'); L('dunes/oasis', 'e', 'dunes/sands'); L('dunes/sands', 's', 'dunes/obelisk'); L('dunes/sands', 'e', 'dunes/ruins'); L('dunes/ruins', 'd', 'dunes/tomb');

  // ---- Frostpeak (levels 24-30): north of the crossroads ----
  R('frost/lodge', 'frost', 5, -1, 0, 'Frostpeak Lodge', 'A fire roars in a stone lodge. Mountaineers outfit those with the nerve for the pass. Try `list`.', [], { safe: true, shop: { stock: ['adamantsword', 'adamantmail', 'adamanthelm', 'adamantshield', 'adamantboots', 'dragonsword', 'dragonmail', 'dragonhelm', 'dragonshield', 'dragonboots', 'superior', 'grand', 'mana4'] } });
  R('frost/pass', 'frost', 5, -2, 0, 'Frostpeak Pass', 'Wind howls through a narrow, icy gap.', ['ice_wolf', 'ice_wolf']);
  R('frost/ledge', 'frost', 5, -3, 0, 'Frozen Ledge', 'A sheer drop on one side, an ice cave on the other.', ['yeti']);
  R('frost/cave', 'frost', 6, -3, 0, 'Crystal Cave', 'Blue crystals hum with cold light.', ['frost_wraith', 'ice_golem'], { res: { ore: 3 } });
  R('frost/hall', 'frost', 5, -4, 0, 'Hall of the Frost Giant', 'Icicles hang like spears over a throne carved from a glacier.', ['frost_giant']);
  M('ice_wolf', 'ice wolf', '🐺', 24); M('yeti', 'yeti', '🦍', 26); M('frost_wraith', 'frost wraith', '❄️', 27); M('ice_golem', 'ice golem', '🧊', 28); M('frost_giant', 'frost giant', '🏔️', 30, { boss: 1, ids: ['giant'] });
  L('road/fork', 'n', 'frost/lodge'); L('frost/lodge', 'n', 'frost/pass'); L('frost/pass', 'n', 'frost/ledge'); L('frost/ledge', 'e', 'frost/cave'); L('frost/ledge', 'n', 'frost/hall');

  // ---- Ember Wastes (levels 30-34): beyond the Crystal Cave ----
  R('ember/gate', 'ember', 7, -3, 0, 'Ember Gate', 'Black rock and hot wind. The ground glows red beyond.', ['fire_imp', 'fire_imp']);
  R('ember/ash', 'ember', 8, -3, 0, 'Ashfields', 'Ankle-deep ash, and burning things that hunt in it.', ['cinder_hound', 'cinder_hound']);
  R('ember/lava', 'ember', 8, -2, 0, 'River of Fire', 'A river of lava crawls past. Elementals walk in it.', ['magma_elemental']);
  R('ember/temple', 'ember', 9, -3, 0, 'Forge-Temple', 'A temple of black iron. Its forge still burns.', ['salamander'], { forge: true, res: { ore: 3 } });
  R('ember/caldera', 'ember', 9, -4, 0, 'The Caldera', 'The mouth of a volcano. The Titan rises from the magma.', ['magma_titan']);
  M('fire_imp', 'fire imp', '👹', 30); M('cinder_hound', 'cinder hound', '🔥', 31); M('magma_elemental', 'magma elemental', '🌋', 32); M('salamander', 'lava salamander', '🦎', 33); M('magma_titan', 'Magma Titan', '🌋', 34, { boss: 1, ids: ['titan'] });
  L('frost/cave', 'e', 'ember/gate'); L('ember/gate', 'e', 'ember/ash'); L('ember/ash', 's', 'ember/lava'); L('ember/ash', 'e', 'ember/temple'); L('ember/temple', 'n', 'ember/caldera');

  // ---- Shattered Citadel (levels 35-38) ----
  R('cit/gate', 'citadel', 9, -5, 0, 'Citadel Gate', 'A broken fortress of black stone. Banners of a dead kingdom snap in the wind.', ['cursed_knight', 'cursed_knight']);
  R('cit/hall', 'citadel', 9, -6, 0, 'Hall of Banners', 'Torn banners hang over rows of empty armor.', ['gargoyle', 'cursed_knight']);
  R('cit/library', 'citadel', 8, -6, 0, 'Ruined Library', 'Shelves of burned books. A wraith turns pages that are no longer there.', ['wraith_lord']);
  R('cit/barracks', 'citadel', 10, -6, 0, 'Haunted Barracks', 'Cots in neat rows. Armor stands guard over them.', ['gargoyle', 'wraith_lord']);
  R('cit/throne', 'citadel', 9, -7, 0, 'Throne of the Dread Marshal', 'A cold throne. A stair spirals down into the dark behind it.', ['dread_marshal']);
  M('cursed_knight', 'cursed knight', '⚔️', 35); M('gargoyle', 'gargoyle', '🦇', 36); M('wraith_lord', 'wraith lord', '☠️', 37); M('dread_marshal', 'Dread Marshal', '🛡️', 38, { boss: 1, ids: ['marshal'] });
  L('ember/caldera', 'n', 'cit/gate'); L('cit/gate', 'n', 'cit/hall'); L('cit/hall', 'w', 'cit/library'); L('cit/hall', 'e', 'cit/barracks'); L('cit/hall', 'n', 'cit/throne');

  // ---- The Abyss (levels 39-40) ----
  R('abyss/stair', 'abyss', 9, -7, -1, 'The Black Stair', 'Stairs wind down into a place that was never meant to be seen.', ['void_stalker', 'void_stalker']);
  R('abyss/rift', 'abyss', 10, -7, -1, 'The Rift', 'Space tears and mends. Something huge moves behind it.', ['void_horror']);
  R('abyss/core', 'abyss', 10, -8, -1, 'Heart of the Void', 'There is no floor, only a will that wants everything to end.', ['voidlord']);
  M('void_stalker', 'void stalker', '🕳️', 39); M('void_horror', 'void horror', '🐙', 40);
  M('voidlord', 'the Voidlord', '👾', 40, { boss: 1, ids: ['voidlord', 'lord'], drops: [['voidsword', 1], ['voidmail', 1], ['voidhelm', 1], ['voidshield', 1], ['voidboots', 1], ['grand', 1]] });
  mobs.voidlord.hp = 16000; mobs.voidlord.xp = 6000;
  L('cit/throne', 'd', 'abyss/stair'); L('abyss/stair', 'e', 'abyss/rift'); L('abyss/rift', 'n', 'abyss/core');
  // ---- setting names for monsters; old words stay targetable (kill bandit) ----
  const REN = { rat: 'mutant rat', wolf: 'feral wolf', bandit: 'road ganger', highwayman: 'highway raider', outlaw_captain: 'gang warlord', leech: 'slag leech', cave_spider: 'drill spider', kobold: 'scrap kobold',
    dwarf_zombie: 'dead-shift miner', rock_golem: 'excavator golem', scorpion: 'chrome scorpion', mummy: 'wired mummy', cursed_knight: 'revenant guard' };
  for (const [id, nm] of Object.entries(REN)) if (mobs[id]) { mobs[id].ids = [...(mobs[id].ids || []), ...mobs[id].name.split(' ')]; mobs[id].name = nm; }

  // ---- +10 rooms per area, grown from an anchor room; one safe camp per area (regen bonus, quest giver) ----
  const slug = (n) => n.toLowerCase().replace(/[^a-z ]/g, '').trim().replace(/ +/g, '_');
  const DV = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] }, at = {};
  for (const [id, r] of Object.entries(rooms)) at[`${r.x},${r.y},${r.z || 0}`] = id;
  const EXT = [
    { area: 'town', pre: 'town', anchor: 'town/implant_lab', safe: 1, camp: 'x', pool: [], names: ["Adventurers' Guild", 'Cobbler Lane', "Cooper's Yard", "Baker's Row", 'Chapel Garden', 'Watchtower', 'Old Well', 'Stables', "Alchemist's Tower", 'Back Alley'],
      frags: ['Smoke curls from nearby chimneys.', 'Townsfolk hurry past with their errands.', 'Lanterns sway gently overhead.', 'The cobbles are worn smooth by generations of boots.'] },
    { area: 'forest', pre: 'forest', anchor: 'forest/thicket', camp: "Hermit's Clearing", pool: ['rat', 'goblin', 'wolf'], res: { herb: 3 }, names: ['Mossy Hollow', 'Fern Dell', "Hunter's Blind", 'Fallen Giant', 'Twilight Glade', 'Spider Grove', 'Owl Roost', "Hermit's Clearing", 'Hollow Oak', 'Thornwall'],
      frags: ['Pines crowd close overhead.', 'Something rustles in the undergrowth.', 'Pale light falls in shafts through the branches.', 'The air smells of damp earth and resin.'] },
    { area: 'crypt', pre: 'crypt', anchor: 'crypt/cells', camp: 'Reliquary', pool: ['skeleton', 'ghoul'], res: { ore: 2 }, names: ['Collapsed Vault', 'Weeping Chamber', 'Bone Gallery', 'Sealed Passage', 'Embalming Room', 'Altar of Ash', 'Flooded Crypt', 'Ghoul Warren', 'Reliquary', 'Shadowed Nave'],
      frags: ['The air is cold and tastes of dust.', 'Old bones crunch underfoot.', 'Torches here burned out centuries ago.', 'Something shuffles just out of sight.'] },
    { area: 'marsh', pre: 'marsh', anchor: 'marsh/mire', camp: 'Sunken Boat', pool: ['bog_lurker', 'leech', 'crocodile', 'marsh_hag'], res: { herb: 3, fish: 3 }, names: ['Sunken Boat', 'Frog Pond', 'Rotting Pier', 'Fungus Grotto', 'Peat Bog', 'Heron Rookery', 'Witch Lights', 'Drowned Chapel', 'Muddy Causeway', 'Leech Pool'],
      frags: ['Mist clings to the black water.', 'Insects whine in clouds around your head.', 'The ground squelches with each step.', 'Bubbles break the surface of the muck.'] },
    { area: 'road', pre: 'road', anchor: 'road/mile2', camp: 'Abandoned Inn', pool: ['bandit', 'highwayman'], res: { herb: 2 }, names: ['Burnt Wagon', 'Dry Wash', 'Watch Hill', 'Abandoned Inn', 'Bandit Camp', 'Old Milestone', "Shepherd's Rest", 'Ambush Gully', 'Toll Bridge', 'Hanging Tree'],
      frags: ['Dust hangs over the old road.', 'Crows watch from the rocks.', 'The wind carries a smell of woodsmoke.', 'Hoofprints and wheel ruts cross the dirt.'] },
    { area: 'mines', pre: 'mines', anchor: 'mines/vault', camp: "Foreman's Office", pool: ['cave_spider', 'kobold', 'dwarf_zombie', 'rock_golem'], res: { ore: 4 }, names: ['Ore Cart Track', 'Flooded Drift', 'Timber Cavern', 'Crystal Seam', "Foreman's Office", 'Dripping Gallery', 'Narrow Crawl', 'Smelter Hall', 'Collapsed Stope', 'Echoing Chamber'],
      frags: ['Water drips somewhere in the dark.', 'Rotten timbers groan overhead.', 'Pick marks scar every wall.', 'The air is close and smells of iron.'] },
    { area: 'dunes', pre: 'dunes', anchor: 'dunes/obelisk', camp: 'Nomad Camp', pool: ['scorpion', 'sand_wraith', 'mummy', 'sphinx'], res: { herb: 2 }, names: ['Cracked Dune', 'Dry Well', 'Caravan Graveyard', 'Scorched Mesa', 'Sand Pit', 'Nomad Camp', 'Whispering Dune', 'Broken Statue', 'Salt Flat', 'Mirage Gate'],
      frags: ['Heat shimmers off the endless sand.', 'The sun hammers down without mercy.', 'Windblown sand hisses across the ground.', 'Bleached bones lie half-buried nearby.'] },
    { area: 'frost', pre: 'frost', anchor: 'frost/cave', camp: "Hermit's Igloo", pool: ['ice_wolf', 'yeti', 'frost_wraith', 'ice_golem'], res: { ore: 3 }, names: ['Snowdrift Hollow', 'Frozen Waterfall', 'Avalanche Slope', 'Ice Bridge', "Hermit's Igloo", 'Glacier Crack', 'Wind-Scoured Peak', 'Frozen Camp', 'Crystal Chasm', 'Blizzard Gap'],
      frags: ['A bitter wind bites through your clothes.', 'Ice creaks and groans underfoot.', 'Snow swirls in blinding sheets.', 'Your breath freezes in the air.'] },
    { area: 'ember', pre: 'ember', anchor: 'ember/lava', camp: 'Scorched Camp', pool: ['fire_imp', 'cinder_hound', 'magma_elemental', 'salamander'], res: { ore: 3 }, names: ['Sulfur Vent', 'Obsidian Field', 'Lava Tube', 'Scorched Camp', 'Basalt Steps', 'Smoking Crater', 'Ash Dune', 'Geyser Basin', 'Molten Pool', 'Charred Grove'],
      frags: ['Sulfur stings your eyes and throat.', 'The ground is hot through your boots.', 'Ash drifts down like grey snow.', 'Far-off rumbling shakes loose pebbles.'] },
    { area: 'citadel', pre: 'cit', anchor: 'cit/library', camp: 'Guard Post', pool: ['cursed_knight', 'gargoyle', 'wraith_lord'], res: { ore: 2 }, names: ['Armory Ruins', 'Collapsed Rampart', 'Chapel of Bells', 'Dungeon Stair', 'Banquet Hall', 'War Room', 'Cursed Gallery', 'Watchtower Top', 'Guard Post', 'Crypt Gate'],
      frags: ['Cold light slants through broken windows.', 'Rusted armor lies where its owners fell.', 'Whispers echo along the black stone.', 'A faint, mournful bell tolls somewhere.'] },
    { area: 'abyss', pre: 'abyss', anchor: 'abyss/core', camp: 'Dream Fragment', pool: ['void_stalker', 'void_horror'], names: ['Whispering Void', 'Fractured Stair', 'Maw of Stars', 'Weeping Chasm', 'Echo Chamber', 'Shadow Bridge', 'Dream Fragment', 'Eye of Silence', 'Hollow Throne', 'Edge of Nothing'],
      frags: ['Gravity feels like a suggestion here.', 'Something vast watches without eyes.', 'The air hums at the edge of hearing.', 'Colors drift where no light should be.'] },
  ];
  EXT.push(EXT.shift()); // the town grows last, so it cannot crowd the forest and other areas out of the grid
  const mobFor = (pool, i) => (pool.length ? (i % 3 === 1 ? [pool[i % pool.length], pool[(i + 1) % pool.length]] : i % 3 === 2 ? [pool[(i + 1) % pool.length]] : [pool[i % pool.length]]) : []);
  for (const a of EXT) {
    const made = [a.anchor];
    a.names.forEach((nm, i) => {
      const id = `${a.pre}/${slug(nm)}`, order = ['n', 'e', 's', 'w'].map((_, k) => ['n', 'e', 's', 'w'][(k + i) % 4]);
      for (let pi = 0; pi < made.length; pi++) {
        const par = made[(pi + i * 3) % made.length], P = rooms[par], pz = P.z || 0;
        for (const d of order) {
          if (P.exits[d]) continue;
          const x = P.x + DV[d][0], y = P.y + DV[d][1], key = `${x},${y},${pz}`; if (at[key]) continue;
          const camp = nm === a.camp, safe = camp || a.safe, n1 = a.frags.length, f1 = a.frags[i % n1], f2 = a.frags[(i + 1 + Math.floor(i / n1)) % n1 === i % n1 ? (i + 2) % n1 : (i + 1 + Math.floor(i / n1)) % n1];
          R(id, a.area, x, y, pz, nm, `${f1} ${f2}${camp && a.area !== 'town' ? ' A small camp here offers safe rest.' : ''}`, safe ? [] : mobFor(a.pool, i),
            { ...(safe ? { safe: true } : {}), ...(camp && a.area !== 'town' ? { camp: true } : {}), ...(!safe && a.res && i % 3 === 0 ? { res: a.res } : {}), ...(nm === "Adventurers' Guild" ? { board: true } : {}) });
          at[key] = id; L(par, d, id); made.push(id);
          for (const dd of Object.keys(DV)) { // link neighbours in the same area to form loops
            const nid = at[`${x + DV[dd][0]},${y + DV[dd][1]},${pz}`]; if (!nid || nid === par || rooms[nid].area !== a.area) continue;
            if (!rooms[id].exits[dd] && !rooms[nid].exits[OPP[dd]]) L(id, dd, nid);
          }
          return;
        }
      }
    });
  }
  // ---- expanded descriptions (descs.js) ----
  delete require.cache[require.resolve('./descs')];
  const DESCS = require('./descs');
  for (const [id, text] of Object.entries(DESCS)) if (rooms[id]) rooms[id].long = text;
  // ---- terrain: area default plus per-room overrides. Terrains are grass, dirt, stone, concrete and metal (drawn as textures on the map). ----
  const AREA_TERRAIN = { town: 'concrete', forest: 'grass', crypt: 'stone', marsh: 'dirt', road: 'concrete', mines: 'stone', dunes: 'dirt', frost: 'stone', ember: 'stone', citadel: 'stone', abyss: 'metal' };
  const TERRAIN = {
    'town/smithy': 'metal', 'town/armory': 'metal', 'town/clinic': 'metal', 'town/implant_lab': 'metal', 'town/salvage_exchange': 'metal', 'town/watchtower': 'metal', 'town/temple': 'stone', 'town/hall_of_rebirth': 'stone', 'town/quarry': 'stone',
    'town/old_well': 'stone', 'town/alchemists_tower': 'stone', 'town/chapel_garden': 'grass', 'town/stables': 'dirt', 'town/coopers_yard': 'dirt',
    'forest/path': 'dirt', 'forest/ruins': 'stone', 'forest/hunters_blind': 'dirt', 'forest/fallen_giant': 'dirt', 'forest/owl_roost': 'dirt', 'forest/hollow_oak': 'dirt', 'forest/thornwall': 'dirt',
    'crypt/embalming_room': 'concrete', 'marsh/edge': 'grass', 'marsh/reeds': 'grass', 'marsh/frog_pond': 'grass', 'marsh/heron_rookery': 'grass', 'marsh/sunken_boat': 'metal', 'marsh/drowned_chapel': 'stone',
    'road/dry_wash': 'dirt', 'road/ambush_gully': 'dirt', 'road/watch_hill': 'dirt', 'road/hanging_tree': 'dirt', 'road/bandit_camp': 'dirt', 'road/shepherds_rest': 'stone', 'road/toll_bridge': 'metal',
    'mines/ore_cart_track': 'metal', 'mines/forge': 'metal', 'mines/smelter_hall': 'metal', 'mines/narrow_crawl': 'dirt', 'mines/collapsed_stope': 'dirt', 'mines/timber_cavern': 'dirt', 'mines/foremans_office': 'concrete',
    'dunes/oasis': 'grass', 'dunes/caravan_graveyard': 'metal', 'dunes/ruins': 'stone', 'dunes/tomb': 'stone', 'dunes/obelisk': 'stone', 'dunes/broken_statue': 'stone', 'dunes/mirage_gate': 'stone', 'dunes/dry_well': 'stone',
    'frost/lodge': 'concrete', 'frost/frozen_camp': 'metal', 'frost/snowdrift_hollow': 'dirt', 'ember/temple': 'metal', 'ember/scorched_camp': 'dirt', 'ember/ash': 'dirt', 'ember/ash_dune': 'dirt', 'ember/charred_grove': 'dirt',
    'cit/armory_ruins': 'metal', 'cit/war_room': 'metal', 'cit/banquet_hall': 'concrete', 'cit/guard_post': 'concrete', 'cit/barracks': 'concrete', 'abyss/dream_fragment': 'concrete',
  };
  for (const [id, r] of Object.entries(rooms)) if (!r.terrain) r.terrain = TERRAIN[id] || AREA_TERRAIN[r.area] || 'concrete';
};
