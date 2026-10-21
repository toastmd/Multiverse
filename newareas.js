'use strict';
// Five extra areas for MULTIVERSE MUD, each ~14 rooms with its own monsters, boss, shop, NPC (see quests2.js), treasure drops and a unique boss item (legends.js).
//   Tombstone Gulch (Old West ghost town, L10-14) from the Redrock Trail   Thornwild Court (fantasy fey realm, L15-19) from the Sunken Marsh
//   Starship Aurora (sci-fi crash site, L22-26) from the Sunscorch Dunes   The Drowned Reach (fantasy sunken kingdom, L27-31) from Frostpeak
//   Brimstone Rail Yard (Old West hellish depot, L32-36) from the Ember Wastes
module.exports = (items, mobs, rooms) => {
  const OPP = { n: 's', s: 'n', e: 'w', w: 'e', u: 'd', d: 'u', ne: 'sw', sw: 'ne', nw: 'se', se: 'nw', in: 'out', out: 'in' }, link = (a, d, b) => { rooms[a].exits[d] = b; rooms[b].exits[OPP[d]] = a; };
  const item = (id, name, type, o) => { items[id] = { name, ids: [id, ...name.toLowerCase().replace(/[^a-z ]/g, '').split(' ').filter((w) => w.length > 2)], type, long: `${name}.`, ...o }; };
  const gear = (id, name, slot, lv, value, long) => { // level-scaled weapons and armor for the shops
    if (slot === 'weapon') item(id, name, 'weapon', { dmg: [Math.round(lv * 2.4), Math.round(lv * 4)], lvl: lv, value, long });
    else item(id, name, 'armor', { slot, ac: Math.max(2, Math.round(lv * { body: 0.55, head: 0.3, shield: 0.35, feet: 0.25 }[slot])), lvl: lv, value, long });
  };
  const mob = (id, name, icon, lv, o = {}) => {
    const b = o.boss ? 1 : 0, m = b ? 1.5 : 1, heal = lv < 18 ? 'strong' : lv < 28 ? 'greater' : lv < 36 ? 'superior' : 'grand', mana = lv < 24 ? 'mana2' : lv < 34 ? 'mana3' : 'mana4';
    mobs[id] = { name, ids: o.ids || [], icon, level: lv, hp: Math.round(12 * lv ** 1.5 * Math.min(1, 0.3 + lv * 0.05) * (1 + Math.max(0, lv - 24) * 0.06) * (b ? 2.5 : 1)), str: 8 + lv, dex: 8 + Math.floor(lv * 0.8), con: 8 + lv,
      dmg: [Math.round((2 + lv * 1.1) * m), Math.round((5 + lv * 2) * m)], ac: Math.floor(lv * 0.9) + (b ? 3 : 0), xp: Math.round(10 * lv * (b ? 8 : 1)), boss: !!b, aggro: true, wander: false, gold: [lv * 3 * (b ? 4 : 1), lv * 8 * (b ? 4 : 1)],
      drops: [[heal, 0.2], [mana, 0.1], ...(o.trophy ? [[o.trophy, b ? 1 : 0.3]] : []), ...(o.drops || [])] };
  };
  // Build an area from a text grid: neighbours in the grid are joined by exits. defs: key -> [name, description, monsters, extras]
  const build = (id, area, z, x0, y0, grid, defs, anchors, entryDir) => {
    const at = {}, rows = grid.map((r) => r.split(' '));
    rows.forEach((row, y) => row.forEach((k, x) => { if (k === '.') return; const d = defs[k]; if (!d) throw new Error(`${id}: no room ${k}`); const path = `${id}/${k}`; at[`${x},${y}`] = path;
      rooms[path] = { name: d[0], area, x: x0 + x, y: y0 + y, z, long: d[1], exits: {}, mobs: d[2] || [], ...(d[3] || {}) }; }));
    for (const [pos, path] of Object.entries(at)) { const [x, y] = pos.split(',').map(Number); if (at[`${x + 1},${y}`]) link(path, 'e', at[`${x + 1},${y}`]); if (at[`${x},${y + 1}`]) link(path, 's', at[`${x},${y + 1}`]); }
    const anchor = anchors.find((a) => rooms[a]); const dir = (entryDir ? [entryDir] : ['n', 'e', 's', 'w', 'u', 'd']).find((d) => !rooms[anchor].exits[d] && !rooms[`${id}/a`].exits[OPP[d]]); // the way back into the area must not overwrite one of its own exits if (!dir) throw new Error(`${id}: no free exit on ${anchor}`);
    link(anchor, dir, `${id}/a`); return `${id}/a`;
  };

  // ============ 1. Tombstone Gulch (Old West ghost town, levels 10-14) ============
  item('ghostbadge', 'tarnished ghost badge', 'treasure', { value: 380, long: 'A dented tin lawman badge that is cold to the touch. Collectors pay well.' });
  gear('gulchrifle', 'Gulch Repeater', 'weapon', 11, 900, 'A lever-action rifle with a worn walnut stock. Reliable, loud and much loved.'); gear('dusterbody', 'Dust Duster', 'body', 11, 700, 'A long canvas duster that turns away dust, bullets and gossip.');
  gear('gulchhat', 'Ten-Gallon Hat', 'head', 11, 420, 'A broad, sweat-stained hat.'); gear('spurboots', 'Silver Spur Boots', 'feet', 11, 380, 'Polished boots with jingling spurs.');
  mob('ghost_outlaw', 'ghost outlaw', '\u{1F47B}', 10, { ids: ['ghost', 'outlaw'], trophy: 'ghostbadge' }); mob('dust_devil', 'dust devil', '\u{1F32A}\uFE0F', 11, { ids: ['dust', 'devil'] }); mob('skeleton_deputy', 'skeleton deputy', '\u{1F480}', 12, { ids: ['skeleton', 'deputy'], trophy: 'ghostbadge' });
  mob('bone_rattler', 'bone rattler', '\u{1F40D}', 12, { ids: ['bone', 'rattler', 'snake'] }); mob('dalton', 'Ghost Marshal Dalton', '\u{1F920}', 14, { boss: 1, ids: ['dalton', 'marshal', 'ghost'], trophy: 'ghostbadge' });
  build('gulch', 'gulch', 20, 0, 0, ['a b c d e', '. f g h l', 'i j k . o', 'm . n . .'], {
    a: ['Gulch Gate', 'A sagging arch of bleached timber marks the way into Tombstone Gulch. A weathered signpost reads POP. 0 (MOSTLY), and dust devils spin in the street beyond.', ['dust_devil']],
    b: ['Main Street', 'A wide dirt street lined with sagging false-front buildings. Faded signs and shuttered windows watch as pale shapes in dusters drift between the hitching posts.', ['ghost_outlaw', 'ghost_outlaw']],
    c: ['Silver Dollar Saloon', 'Batwing doors, a long mahogany bar and a piano that plays itself on cold nights. The barkeep is the one living soul in the Gulch and sells drinks to anyone with coin. A safe place to rest.', [], { safe: true, camp: true, shop: { stock: ['whiskey', 'sarsaparilla', 'steak'] } }],
    d: ["Undertaker's Parlor", 'Coffins stand upright along the walls, most of them open and empty. A skeletal deputy polishes a badge behind the counter, waiting for customers.', ['skeleton_deputy']],
    e: ["Sheriff's Office", "A stone jailhouse with a rack of old rifles and a cell that never held anyone for long. Sheriff Whitlock keeps the board of wanted posters up to date. A safe place.", [], { safe: true }],
    f: ['Gulch General Store', 'Shelves of canned beans, rope, powder and boots crowd the narrow store. The owner left in a hurry, but a lockbox of goods is still for sale on the counter. Try `list`.', [], { safe: true, shop: { stock: ['gulchrifle', 'dusterbody', 'gulchhat', 'spurboots', 'greater', 'mana2'] } }],
    g: ['Dusty Crossroads', 'Four streets meet in a swirl of red dust. A cracked water trough and a hanging lantern stand at the center, and shadows shift in the corners of your vision.', ['ghost_outlaw', 'dust_devil']],
    h: ['Bank of Tombstone', 'Marble counters, brass cages and a vault door standing open. Skeletal guards in sleeve garters still watch the teller windows, loyal long after the money was gone.', ['skeleton_deputy', 'skeleton_deputy']],
    i: ['Church of Ashes', 'A white-board chapel burned to its frame, with the pews still in neat rows. A rattlesnake the length of a man coils on the altar, and the bell tolls once without a rope.', ['bone_rattler']],
    j: ['Boot Hill Cemetery', 'Wooden crosses lean in the dirt, each with a name and a date scratched in. Many of the graves are open from the inside, and the dead who climbed out are not friendly.', ['ghost_outlaw', 'bone_rattler']],
    k: ['Gallows Yard', 'A gallows with three empty nooses creaks in the wind. A dozen ghostly outlaws loiter beneath it, as if still waiting to be hanged.', ['ghost_outlaw', 'ghost_outlaw']],
    l: ['Abandoned Stable', 'Stalls full of old straw and rotting tack. Ghostly horses neigh somewhere above, and rattlers nest among the bales. At the back a staircase leads down to the bank vault.', ['dust_devil', 'bone_rattler']],
    m: ['Dry Well', 'A stone well ringed with bleached bones. The rope is long gone, and a bone rattler guards whatever is down there.', ['bone_rattler'], { res: { ore: 2 } }],
    n: ['Gold Rush Alley', 'A narrow alley of claim offices and assay shops. Gold dust glitters in the cracks of the boardwalk, and ghosts of prospectors still sweep for it.', ['ghost_outlaw', 'skeleton_deputy'], { res: { ore: 2, silver: 1 } }],
    o: ['The Vault', 'A cold steel vault lined with empty strongboxes. At the far end, Ghost Marshal Dalton waits on a chair of stacked crates, the last lawman of the Gulch and the first to rise.', ['dalton']],
  }, ['road/old_milestone', 'road/shepherds_rest', 'road/ambush_gully', 'road/dry_wash']);

  // ============ 2. Thornwild Court (fantasy fey realm, levels 15-19) ============
  item('faedust', 'pouch of fae dust', 'treasure', { value: 520, long: 'A velvet pouch of glittering dust that smells of rain and honey. Alchemists pay dearly for it.' });
  gear('thornrapier', 'Briarthorn Rapier', 'weapon', 16, 1600, 'A slim rapier whose guard is a living briar that never stops blooming.'); gear('mosscloak', 'Mossweave Cloak', 'body', 16, 1200, 'A cloak woven from living moss. It is always cool and always damp.');
  gear('vinecirclet', 'Vine Circlet', 'head', 16, 760, 'A circlet of green vines that sprout tiny flowers.'); gear('fernboots', 'Fernstep Boots', 'feet', 16, 640, 'Soft boots that make no sound on leaves.');
  mob('pixie_thief', 'pixie thief', '\u{1F9DA}', 15, { ids: ['pixie', 'thief'], trophy: 'faedust' }); mob('bramble_beast', 'bramble beast', '\u{1F33F}', 16, { ids: ['bramble', 'beast'] }); mob('fey_hound', 'fey hound', '\u{1F43A}', 17, { ids: ['fey', 'hound'], trophy: 'faedust' });
  mob('satyr_trickster', 'satyr trickster', '\u{1F410}', 18, { ids: ['satyr', 'trickster'], trophy: 'faedust' }); mob('thorn_queen', 'Thorn Queen Mab', '\u{1F9DD}', 19, { boss: 1, ids: ['mab', 'queen', 'thorn'], trophy: 'faedust' });
  build('thorn', 'thorn', 21, 0, 0, ['a b c d e', 'f g h i j', 'k . l m n'], {
    a: ['Briar Gate', 'A tunnel of living thorns marks the border of Thornwild Court. The air is sweet and slightly wrong, and every petal seems to turn to watch you pass.', ['bramble_beast']],
    b: ['Mushroom Ring', 'A perfect circle of red-capped mushrooms glows softly in the gloom. Small shapes dart between the stalks, giggling, and your coin purse feels lighter already.', ['pixie_thief', 'pixie_thief']],
    c: ['Moonwell', 'A silver pool in a ring of white stones, fed by a spring of liquid moonlight. Its water mends wounds, and the fey wardens who tend it will not harm a guest. A safe place to rest.', [], { safe: true, camp: true, healer: true }],
    d: ['Pixie Market', 'A market of acorn-cap stalls and spiderweb awnings, where fey traders sell finery spun from moss, dew and moonlight. Prices are high, and the trade is honest. Try `list`.', [], { safe: true, shop: { stock: ['thornrapier', 'mosscloak', 'vinecirclet', 'fernboots', 'greater', 'mana2'] } }],
    e: ['Thistle Bridge', 'A narrow footbridge of woven thistle over a stream that flows uphill. A fey hound the size of a pony sits at the far end, grinning with too many teeth.', ['fey_hound']],
    f: ['Hedge Maze', 'Tall hedges twist in on themselves, their paths rearranging whenever you look away. Giggling echoes from every direction, and bramble beasts patrol the corners.', ['bramble_beast', 'pixie_thief']],
    g: ['Dreaming Pool', 'A still pool that shows the faces of those who dream beneath it. Fey hounds lap at the water and fall into twitching sleep, only to wake and hunt again.', ['fey_hound', 'fey_hound'], { res: { fish: 2, herb: 2 } }],
    h: ['Fae Library', 'Shelves of living wood hold books that rewrite themselves as you watch. A satyr in spectacles reads aloud a tale that is, you realize with horror, about you.', ['satyr_trickster']],
    i: ['Glowing Grove', 'Lanterns of cold green fire hang among the trees, and tiny winged shapes dance in the glow. They are far less innocent than they look.', ['pixie_thief', 'fey_hound']],
    j: ['Nightshade Garden', 'Rows of black flowers nod in unfelt wind, their sweet scent making your head swim. Bramble beasts tend the beds like gardeners, and they do not like visitors.', ['bramble_beast', 'bramble_beast'], { res: { herb: 4 } }],
    k: ['Hollow Oak', 'A giant oak, hollow as a cathedral, with a spiral stair of roots leading up to a hidden door. A satyr plays pipes in the branches, daring you to come closer.', ['satyr_trickster']],
    l: ['Toadstool Hall', 'A banquet hall grown from enormous toadstools, the table laid for a feast that never ends. Fey hounds guard the dishes, and the satyr host never stops smiling.', ['fey_hound', 'satyr_trickster']],
    m: ['Sunlit Glade', 'A rare patch of golden light in the endless twilight, thick with wildflowers and bees the size of thumbs. A fine place for herb gathering, if you can ignore the watching eyes.', ['pixie_thief', 'bramble_beast'], { res: { herb: 4, bloom: 2 } }],
    n: ['Court of Thorns', 'A throne of woven thorns in a hall of petals and bone. Thorn Queen Mab sits upon it, beautiful and cold, her crown of briars dripping dew like blood.', ['thorn_queen']],
  }, ['marsh/muddy_causeway', 'marsh/hut', 'marsh/sunken_boat']);

  // ============ 3. Starship Aurora (sci-fi crash site, levels 22-26) ============
  item('datachip', 'encrypted data chip', 'treasure', { value: 780, long: 'A scorched chip from the ship\'s black box. Data brokers pay well for it.' });
  gear('plasmacutter', 'Aurora Plasma Cutter', 'weapon', 24, 3600, 'A salvage tool turned weapon: a handheld plasma blade that hums angrily.'); gear('hullplate', 'Hull-Plate Vest', 'body', 24, 2700, 'A vest of salvaged armor plating, still warm from the reactor.');
  gear('flightvisor', 'Flight Crew Helmet', 'head', 24, 1500, 'A flight helmet with a cracked but functional visor.'); gear('magboots', 'Mag Boots', 'feet', 24, 1300, 'Magnetic boots that grip any metal floor.');
  mob('security_drone', 'security drone', '\u{1F916}', 22, { ids: ['security', 'drone'], trophy: 'datachip' }); mob('mutated_crew', 'mutated crewman', '\u{1F9DF}', 23, { ids: ['mutated', 'crew', 'crewman'] }); mob('xeno_scuttler', 'xeno scuttler', '\u{1F47E}', 24, { ids: ['xeno', 'scuttler'], trophy: 'datachip' });
  mob('repair_bot', 'rogue repair bot', '\u{1F9BE}', 25, { ids: ['rogue', 'repair', 'bot'], trophy: 'datachip' }); mob('helix', "Helix, the Ship's Mind", '\u{1F9E0}', 26, { boss: 1, ids: ['helix', 'ai', 'mind'], trophy: 'datachip' });
  build('aurora', 'aurora', 22, 0, 0, ['a b c d', 'e f g h', 'i j k l', 'm . n o'], {
    a: ['Breach Hatch', 'A jagged tear in the hull of the crashed starship Aurora, edges melted by re-entry. Cold light spills from inside, and sparks fall from a dangling cable.', ['security_drone']],
    b: ['Cargo Bay', 'Crushed crates and loose containers cover the deck, spilling alien plants and spare parts. Something that used to be a crewman crawls between the stacks.', ['mutated_crew', 'security_drone']],
    c: ['Corridor Alpha', 'Emergency lights strobe along a bent corridor. Claw marks cover the walls at head height, and a skittering sound moves in the ceiling vents.', ['xeno_scuttler']],
    d: ['Galley', "The ship's galley, restored by survivors into a makeshift camp with a working stove and a stack of ration packs. The survivors trade with anyone who is not infected. A safe place to rest.", [], { safe: true, camp: true, shop: { stock: ['steak', 'whiskey', 'greater', 'mana2'] } }],
    e: ['Crew Quarters', 'Rows of bunks, some torn open, with personal effects scattered across the floor. A mutated crewman sits on a bunk, humming a lullaby in a voice that is no longer his.', ['mutated_crew']],
    f: ['Med Bay', 'A sterile bay of cracked scanners and dead monitors. The medic bot is still working and will patch up anyone who asks politely. A safe place.', [], { safe: true, healer: true }],
    g: ['Engineering', 'A cavernous room of humming coils and exposed conduits. A rogue repair bot weaves between them, welding whatever it finds, including your boots.', ['repair_bot'], { forge: true, res: { ore: 3 } }],
    h: ['Quartermaster Locker', 'Rows of lockers, still sealed, and a vending kiosk that runs on salvage tokens. A surviving quartermaster sells equipment from the ship\'s armory. Try `list`.', [], { safe: true, shop: { stock: ['plasmacutter', 'hullplate', 'flightvisor', 'magboots', 'superior', 'mana3'] } }],
    i: ['Hydroponics', 'Rows of grow-lamps cast purple light over a jungle of mutated plants. Scuttlers nest in the roots, and every leaf is too large and too wet.', ['xeno_scuttler', 'xeno_scuttler'], { res: { herb: 4, bloom: 2 } }],
    j: ['Corridor Beta', 'A long corridor of flickering panels and wall scars where something dragged a console off the wall. A drone floats at the far end, scanning.', ['security_drone', 'repair_bot']],
    k: ['Observation Deck', 'A wide window looks out on a dead alien sky. The glass is cracked, and a mutated crew gathers beneath it, singing to the stars.', ['mutated_crew', 'mutated_crew']],
    l: ['Reactor Core', 'A cathedral of humming blue light, the ship reactor rattling in its housing. Repair bots guard it jealously, and the heat is enough to melt your resolve.', ['repair_bot', 'repair_bot']],
    m: ['Escape Pod Bay', 'Empty pod cradles line the wall, one hatch still sealed with a frozen skeleton inside. A scuttler hisses from the open pod.', ['xeno_scuttler']],
    n: ['AI Core Antechamber', 'A security door covered in warnings and scorch marks. Drones patrol the antechamber in tight loops. The ship mind watches through every camera.', ['security_drone', 'repair_bot']],
    o: ["Bridge", "The command bridge, half-melted, its consoles flickering. Helix, the ship's mind, speaks from every speaker at once, calm and polite and utterly insane.", ['helix']],
  }, ['dunes/sand_pit', 'dunes/oasis', 'dunes/obelisk']);

  // ============ 4. The Drowned Reach (fantasy sunken kingdom, levels 27-31) ============
  item('blackpearl', 'black pearl', 'treasure', { value: 1300, long: 'A perfect black pearl the size of a plum, cold as the deep sea.' });
  gear('reeftrident', 'Reef Trident', 'weapon', 28, 5200, 'A three-pronged trident of coral steel that never dries.'); gear('sirenmail', 'Siren Scale Mail', 'body', 28, 3800, 'Mail of overlapping scales from a siren queen. It shimmers as if still wet.');
  gear('pearlcrown', 'Pearl Circlet', 'head', 28, 2100, 'A circlet of matched pearls that glows faintly.'); gear('tidalshield', 'Tidal Shield', 'shield', 28, 2400, 'A round shield of coral that dampens blows like a wave.');
  mob('drowned_sailor', 'drowned sailor', '\u{1F9DF}', 27, { ids: ['drowned', 'sailor'], trophy: 'blackpearl' }); mob('coral_golem', 'coral golem', '\u{1FAB8}', 28, { ids: ['coral', 'golem'] }); mob('siren', 'siren', '\u{1F9DC}', 29, { ids: ['siren'], trophy: 'blackpearl' });
  mob('king_crab', 'armored king crab', '\u{1F980}', 29, { ids: ['king', 'crab'] }); mob('leviathan', 'Leviathan of the Reach', '\u{1F409}', 31, { boss: 1, ids: ['leviathan'], trophy: 'blackpearl' });
  build('reach', 'reach', 23, 0, 0, ['a b c d e', 'f g h i j', 'k l m n .'], {
    a: ['Ice Hole', 'A hole in the frozen lake opens onto a spiral of glowing water. The deep calls, and cold fingers of current tug at your boots.', ['drowned_sailor']],
    b: ['Sunken Stair', 'A great marble staircase descends beneath the waves, each step crusted with barnacles. Air bubbles, shimmering and strangely breathable, cling to you as you descend.', ['drowned_sailor', 'coral_golem']],
    c: ['Tidal Chapel', 'A tiny chapel in an air-bubble, the pews full of seaweed and the altar glowing with pale light. The ghost of a ship captain keeps watch. A safe place to rest.', [], { safe: true, camp: true, healer: true }],
    d: ['Pearl Market', 'A market of coral stalls and glowing jellyfish lanterns, where sea-folk and shipwreck survivors trade pearls, brine and sunken salvage. Try `list`.', [], { safe: true, shop: { stock: ['reeftrident', 'sirenmail', 'pearlcrown', 'tidalshield', 'superior', 'mana3'] } }],
    e: ['Whale Bone Arch', 'A towering arch of whale ribs, grown over with pink coral. A siren lounges on the topmost rib, humming a tune that drags at your will.', ['siren']],
    f: ['Kelp Forest', 'Towering kelp sways in the current, shot through with shafts of green light. Crabs the size of boulders prowl the roots, and sailors long dead drift in the stalks.', ['king_crab', 'drowned_sailor'], { res: { herb: 3, fish: 4 } }],
    g: ['Shipwreck Galleon', 'A great galleon lies on its side, its masts snapped and its hold full of treasure. The crew still man their stations, forever drowned and forever angry.', ['drowned_sailor', 'drowned_sailor']],
    h: ['Drowned Library', 'Shelves of sodden books and glass spheres full of captured sunlight. A coral golem shelves volumes endlessly, forbidding anyone to read them.', ['coral_golem']],
    i: ['Coral Hall', 'A great hall of living coral in red, pink and gold. Sirens sing from alcoves, and coral golems stand like statues until you try to cross.', ['siren', 'coral_golem']],
    j: ["Siren's Rock", 'A rock above the waterline, strewn with the wrecks of ships that followed the song. Two sirens sing here, sweet and terrible.', ['siren', 'siren']],
    k: ['Pearl Grotto', 'A quiet cave glittering with pearl-bearing oysters. A king crab guards the beds, claws clacking, and its shell gleams like armor.', ['king_crab'], { res: { pearl: 3, fish: 3 } }],
    l: ['Abyssal Trench', 'The floor falls away into black water, and the pressure presses at your ears. Pale lights drift in the dark, and the crabs here are the size of carts.', ['king_crab', 'coral_golem']],
    m: ['Trident Hall', 'A hall of tridents mounted on pillars, each one humming in the current. Sirens and drowned sailors guard the way to the throne.', ['siren', 'drowned_sailor']],
    n: ['Coral Throne', 'A throne of coral and bone in a cavern of shifting light. The Leviathan of the Reach coils around it, vast and ancient, with eyes like drowned moons.', ['leviathan']],
  }, ['frost/frozen_waterfall', 'frost/crystal_chasm', 'frost/ice_bridge']);

  // ============ 5. Brimstone Rail Yard (Old West hellish depot, levels 32-36) ============
  item('goldspike', 'cursed golden spike', 'treasure', { value: 2100, long: 'A railroad spike of pure gold, hot to the touch. It hums with a faint rumbling, like a train a long way off.' });
  gear('hellrevolver', 'Hellfire Revolver', 'weapon', 34, 8200, 'A six-shooter whose cylinder glows red. It smells of sulfur and old gunpowder.'); gear('conductorcoat', "Conductor's Brimstone Coat", 'body', 34, 6000, 'A black conductor coat lined with ember cloth. Always warm.');
  gear('engineercap', "Engineer's Iron Cap", 'head', 34, 3400, 'A heavy cap of black iron, still warm from the boiler.'); gear('cowcatcher', 'Cowcatcher Shield', 'shield', 34, 3800, 'A shield cut from the front of a locomotive. Nothing gets past it.');
  mob('cinder_brakeman', 'cinder brakeman', '\u{1F9DF}', 32, { ids: ['cinder', 'brakeman'], trophy: 'goldspike' }); mob('imp_conductor', 'imp conductor', '\u{1F47F}', 33, { ids: ['imp', 'conductor'], trophy: 'goldspike' }); mob('coal_demon', 'coal demon', '\u{1F479}', 34, { ids: ['coal', 'demon'] });
  mob('steam_wraith', 'steam wraith', '\u{1F4A8}', 35, { ids: ['steam', 'wraith'], trophy: 'goldspike' }); mob('brimstone_express', 'The Brimstone Express', '\u{1F682}', 36, { boss: 1, ids: ['brimstone', 'express', 'train', 'engine'], trophy: 'goldspike' });
  build('rail', 'rail', 24, 0, 0, ['a b c d e', 'f g h i j', 'k l m . n'], {
    a: ['Depot Gate', 'A rusted iron gate and a station sign that reads HELLS TERMINUS: ALL ABOARD. Black smoke belches from a chimney far inside, and the rails glow faintly.', ['cinder_brakeman']],
    b: ['Ticket Office', 'A brass-barred ticket window with a long queue of the dead. An imp conductor in a tiny cap punches tickets with a claw, and every ticket is one way.', ['imp_conductor']],
    c: ['Brimstone Saloon Car', 'A railway dining car converted into a saloon, with a bar of polished boiler plate and a piano played by skeletal hands. The drinks are cold, the stew is hot and the bartender is a demon. A safe place to rest.', [], { safe: true, camp: true, shop: { stock: ['whiskey', 'sarsaparilla', 'steak', 'hellrevolver', 'conductorcoat', 'engineercap', 'cowcatcher', 'superior', 'mana3'] } }],
    d: ["Stationmaster's Office", 'A tidy office of timetables, brass instruments and a roll-top desk. Stationmaster Cobb has kept the only honest schedule in Hell. A safe place.', [], { safe: true }],
    e: ['Telegraph Hut', 'A tiny hut where a telegraph key chatters by itself in a language of dots and screams. A steam wraith drifts up from the boiler pipe, listening.', ['steam_wraith']],
    f: ['Coal Yard', 'A mountain of glowing coal hunched in a rusty yard. Brakemen shovel endlessly into carts, and coal demons rise from the slag when strangers appear.', ['cinder_brakeman', 'coal_demon'], { res: { ore: 4 } }],
    g: ['Switching Yard', 'A web of rails and switches under a sky the color of old rust. Imp conductors throw the levers, and every set of rails leads somewhere worse.', ['imp_conductor', 'imp_conductor']],
    h: ['Roundhouse', 'A circular engine house with the cold shells of locomotives lined up like sleeping beasts. A great forge glows at the center, still hungry for iron.', ['coal_demon'], { forge: true, res: { ore: 3 } }],
    i: ['Water Tower', 'A tall water tower dripping black, boiling water. Steam wraiths gather in the mist around its base, whispering of long-ago crashes.', ['steam_wraith', 'cinder_brakeman']],
    j: ['Cattle Cars', 'A long train of rusted stock cars with their doors chained shut. Things knock from inside, patient and hungry, and coal demons ride the rooftops.', ['coal_demon', 'imp_conductor']],
    k: ['Boxcar Boneyard', 'Hundreds of wrecked boxcars stacked like bones. A steam wraith drifts among them, and every car holds a memory of a different crash.', ['steam_wraith']],
    l: ['Turntable', 'A great iron turntable that spins by itself, grinding slowly. Coal demons stand on the ring, and the engines they turn to face you are never the same twice.', ['coal_demon', 'coal_demon']],
    m: ['Signal Tower', 'A tall tower of black iron with lanterns of every color. Imp conductors flip the signals while steam wraiths whistle in the wind.', ['imp_conductor', 'steam_wraith']],
    n: ['Hellmouth Tunnel', 'A tunnel mouth ringed with fangs of black stone, rails curving into the fire within. A thunder of wheels rises from the dark, and the Brimstone Express comes thundering out.', ['brimstone_express']],
  }, ['ember/basalt_steps', 'ember/smoking_crater', 'ember/obsidian_field']);

  // ============ 6. Dry Gulch Bank (Old West, levels 15-17): stick up the customers, kill the manager, take his key, crack the vault ============
  item('vaultkey', 'bank vault key', 'key', { value: 0, long: 'A heavy brass key with a bank crest. It opens the Dry Gulch bank vault. Type `unlock vault` next to the vault door.' });
  mob('bank_guard', 'bank guard', '\u{1F46E}', 16, { ids: ['bank', 'guard'] }); mob('bank_manager', 'Bank Manager Ebenezer Crane', '\u{1F9D0}', 17, { boss: 1, ids: ['ebenezer', 'crane', 'manager', 'bank'], drops: [['vaultkey', 1]] });
  const still = (id, name, icon, lv, gold) => { mob(id, name, icon, lv, { ids: name.split(' ') }); Object.assign(mobs[id], { aggro: false, robbable: { gold }, hp: Math.round(mobs[id].hp * 0.5), xp: Math.round(mobs[id].xp * 0.3) }); }; // stationary people you can `rob`
  still('bank_teller', 'bank teller', '\u{1F9D1}', 8, [250, 600]); still('wealthy_customer', 'wealthy customer', '\u{1F911}', 10, [700, 1500]); still('bank_clerk', 'bank clerk', '\u{1F9D1}', 8, [350, 800]);
  build('bank', 'bank', 25, 0, 0, ['a b c', '. d e', '. f .'], {
    a: ['Bank Lobby', 'Marble floors, brass lamps and a high ceiling. Tellers and wealthy customers stand frozen behind velvet ropes while armed guards watch the door. A sign reads: DRY GULCH SAVINGS & TRUST. DEPOSITS INSURED BY THE SHERIFF.', ['bank_guard', 'bank_guard', 'bank_teller', 'wealthy_customer']],
    b: ['Teller Cages', 'A row of brass-barred cages, each with a nervous clerk and a ledger. Cash drawers rattle with every breath. Try `rob teller` if you are feeling bold.', ['bank_teller', 'bank_clerk', 'bank_teller']],
    c: ["Manager's Office", 'A mahogany desk, a leather chair and a safe behind a painting. Bank Manager Ebenezer Crane sits here guarding the vault key on a chain around his neck. To the south, the vault door.', ['bank_manager']],
    d: ['Vault Corridor', 'A narrow tiled corridor ending in a round steel door the size of a wagon wheel: the vault. Guards pace in front of it. The door needs the manager\'s brass key (`unlock vault`).', ['bank_guard', 'bank_guard']],
    e: ['The Vault', 'A cold steel room lined with strongboxes, stacked bills and bars of gold. The sum on hand changes every day. Type `loot vault` to fill your sacks.', [], { locked: true, vault: true }],
    f: ['Counting Room', 'Long tables, green lamps and adding machines. Clerks count piles of cash with sweaty hands, and a guard stands in the corner.', ['bank_clerk', 'bank_clerk', 'bank_guard']],
  }, ['road/abandoned_inn', 'road/hanging_tree', 'road/toll_bridge']);
};
