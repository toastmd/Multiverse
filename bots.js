'use strict';
// Six resident bots. They are real Player objects (they show on `who`, appear on the map, fight, level, die and gossip),
// driven by a small decision loop that issues the same commands a human would type.
const fs = require('fs'), path = require('path');
const D = require('./lib');
const FILE = path.join(__dirname, 'data', 'bots.json');
const SPECS = [
  { name: 'Zeph', cls: 'wirewalker', gender: 'female', lines: ['Anyone seen a decent netrunner deck vendor around here?', 'Spark and run. That is my whole strategy.', 'The Net is quiet tonight. Too quiet.', 'Rook, quit stealing my kills!', 'Heard the Starship Aurora is full of loot. Also full of murder drones.', 'Drones are just toasters with grudges.', 'Note to self: never hack a ship AI that says please.', 'Who left a golden spike in the saloon? It is humming.', 'Chrome, ghosts, fairies. I swear this multiverse is held together with duct tape.', 'Zero day on the fountain. It heals everything and nobody knows why.', 'Is it just me or do the pixies steal more than the outlaws?', 'Trade you a data chip for a decent sandwich.', 'I tried to hack the Hall of Rebirth. It hacked me back.', 'Anyone up for a team? Kills split the XP and we both win.', 'The leaderboard is a battlefield. Check the top ten with L.', 'Level ups are the best kind of notification.', 'Saloon piano is out of tune again. I love it.', 'Spotted a legendary drop in gossip earlier. Jealous.', 'If you hear humming from the cattle cars, do not open them.', 'Gossip tip: put a semicolon and a word for a GIF.', 'Frostpeak Station has great heating. Terrible neighbors.', 'Remort is worth it. Do the dragon, trust me.'] },
  { name: 'Rook', cls: 'barbarian', gender: 'male', lines: ['Smash first, ask questions never.', 'My chrome is heavier than your savings.', 'Zeph, you owe me a stim.', 'Who is buying drinks at the Silver Spur Saloon?', 'The Brimstone Express nearly ran me over. Nearly.', 'Nothing beats a good hammer and a bad idea.', 'The Gulch ghosts are all hat and no aim.', 'Fighting dragons is easy. Paying for repairs is hard.', 'I would hug someone but my arms are made of steel.', 'My armor is mostly dents at this point.', 'Need a tank? I am a tank. A very loud tank.', 'Anyone know why the pixies keep stealing my left boot?', 'Boss kills split nicely when you team up. Try it.', 'Whiskey for courage, sarsaparilla for sense.', 'Last night I punched a mutated crewman. He apologized. Weird.', 'Does anyone else hear a train in the Ember Wastes?', 'Do not drink from the Dreaming Pool. Long story.', 'Hey Zeph, race you to the next boss!', 'If you see a siren, cover your ears. Or your wallet.', 'The leaderboard is mine by next week. Watch me.', 'If it bleeds, I can hit it. If it does not bleed, I will hit it harder.', 'A good fight and a bad pun, that is all I need.'] },
  { name: 'Mira', cls: 'druid', gender: 'female', lines: ['The forest remembers everything, and so do I.', 'Have you thanked a tree today? They are very sensitive.', 'My bear is called Gerald. Do not ask.', 'Someone stepped on my favorite moss. I know who you are.', 'Nature is not nice. Nature is thorough.', 'Anyone need a root? I have excellent roots.'] },
  { name: 'Dusty', cls: 'gunslinger', gender: 'male', lines: ['Draw, partner. Or do not. I am not your mother.', 'Three bullets, two outlaws, one very bad hat.', 'This town ain\'t big enough for my appetite.', 'Rule one: never pick a fight with a man who has a better hat.', 'I miss the days when a horse was a horse.', 'Whiskey first, shooting second. Sometimes the other way round.'] },
  { name: 'Kaz', cls: 'engineer', gender: 'male', lines: ['I can fix anything with a wrench and a lie.', 'If it is not broken, I have not touched it yet.', 'Turn it off and on again. Works on bosses too. Mostly.', 'My turret has a name. It is Steve. Steve is a good boy.', 'Duct tape is just engineering with confidence.', 'Who borrowed my soldering iron? It was a gift.'] },
  { name: 'Lyra', cls: 'bard', gender: 'female', lines: ['I wrote a ballad about a goblin. He did not like it.', 'Every dungeon needs a soundtrack. I volunteer.', 'The pen is mighty, the lute is mightier, the fireball is mightiest.', 'La la la, run, la la la, hide.', 'Rumor has it the Gulch ghosts are tone deaf.', 'Anyone have a spare string? Mine snapped on a high note.'] },
];
const EXTRA = ['I dropped my map in the Dreaming Pool. It is a very confusing map now.', 'Pro tip: type search in a room that looks too quiet. Treasure and traps both live there.', 'Did you know you can dual wield? Do not try it with a greatsword. Ask a Juggernaut.', 'I just spent a task point on Grit. My knees feel stronger already.', 'Weapon skills only go up if you actually hit things. Revolutionary, I know.', 'Forage, mine, fish. Repeat. The circle of adventuring.', 'The Jukebox in the Silver Spur is playing something terrible again. I love it.', 'Somebody got a tattoo that says MOM on the back of their leg. Respect.', 'I saw a pterodactyl at the Primeval Roost. It looked at me like lunch.', 'Rolling Bones is a trap for people who think they have a system.', 'A hoverbike is the only reasonable way to travel on Mars.', 'Has anyone tried to feed the claw machine at the cinema? It is a trap.', 'Daily rewards are good. Not forgetting them is better.', 'Keep your pack light and your bag of holding heavy.', 'Remort is just level one with better excuses.', 'Never trust a boss that says "come closer".', 'If a door has a scary name, there is probably loot behind it. And teeth.', 'Poison, fire, bleeding: the holy trinity of regret.', 'I pay my taxes in kills. The Marshal accepts them.', 'I just found a relic! It lasts an hour. I used it to open a door.', 'Please stop leaving your trash in the Gulch. The ghosts are complaining.', 'I would trade my sword for a sandwich right now. A good sandwich.', 'If you see a sparkle on the ground in the Fungus Grotto, run.', 'The shark at the Shark Pens has a name. It is Kevin.', 'Somebody has to say it: the Idler class has it figured out.', 'Anyone want to team up? I bring snacks and strong opinions.', 'Check the Multiverse Magazine. I am in it. Obituaries section, sadly.', 'Quest tip: read the quest text. I know, shocking.', 'Treat your mount well. A happy horse is a faster horse.', 'Every area has its own gate now. Ashfall Square is basically an airport.'];
const NAMES = SPECS.map((s) => s.name);
const HOME = 'grounds'; // the bots live and fight only in the Proving Grounds, so the rest of the world is left to the players
const HUNT = [[1, 'grounds/f1'], [4, 'grounds/f2'], [8, 'grounds/f3'], [11, 'grounds/f4'], [14, 'grounds/f5'], [18, 'grounds/f6'], [24, 'grounds/f7'], [28, 'grounds/f8'], [33, 'grounds/f9'], [37, 'grounds/f10']]; // minimum level for each training pen (kept conservative so the bots rarely die)
const TIERS = ['iron', 'steel', 'mithril', 'runed', 'adamant', 'dragon'], PIECES = [['sword', 'weapon'], ['mail', 'body'], ['helm', 'head'], ['shield', 'shield'], ['boots', 'feet']];
const SHOP_MIN = { dunes: 24, frost: 32, road: 24 }; // minimum level before a bot will travel to shops in those areas
const bots = []; let saver = null, ticker = null, escortTicker = null;

let walker = null; // the bot currently being thought about (route planning avoids boss rooms the bot cannot handle)
const bossBlocks = (id) => walker && D.rooms.get(id).inv.some((o) => o.def && o.def.boss && o.level + 10 > walker.level);
function nextStep(from, to) { // breadth-first search (inside the Proving Grounds only); returns the first direction to take
  if (from === to) return null; const first = { [from]: null }, queue = [from];
  while (queue.length) { const c = queue.shift(); for (const [d, n] of Object.entries(D.rooms.get(c).exits)) { if (n in first || !D.rooms.get(n) || D.rooms.get(n).area !== HOME || (n !== to && bossBlocks(n))) continue; first[n] = first[c] || d; if (n === to) return first[n]; queue.push(n); } }
  return null;
}
const nearest = (from, test) => { // closest room (by exits) that satisfies test
  const seen = new Set([from]), queue = [from];
  while (queue.length) { const c = queue.shift(), r = D.rooms.get(c); if (test(r)) return c; for (const n of Object.values(r.exits)) if (!seen.has(n) && D.rooms.get(n) && D.rooms.get(n).area === HOME) { seen.add(n); queue.push(n); } }
  return null;
};
const value = (def) => (def.dmg ? (def.dmg[0] + def.dmg[1]) / 2 : def.ac || 0);

function spawn(spec, saved) {
  const p = new D.Player(spec.name, spec.cls); p.gender = spec.gender; p.isBot = true; p.send = () => {}; p.rec = null;
  if (saved) p.load(saved); else { const k = D.cloneItem(p.klass().kit); k.move(p); p.equip.weapon = k; D.cloneItem('potion').move(p); D.cloneItem('potion').move(p); }
  p.recalc(); if (!saved) { p.hp = p.maxhp; p.mp = p.maxmp; }
  p.bagMode = 'overflow'; // bots wear what they find, so loot stays in the pack until it is full
  D.players.set(spec.name, p); const room = D.rooms.get('grounds/yard') || D.rooms.get(D.W.start);
  p.enter(room, true); room.tell(`${p.name} enters the world.`, p, 'sys');
  const bot = { p, spec, tick: 0, nextChat: Date.now() + 60000 + Math.random() * 240000, plan: null, avoid: {}, seenDeaths: 0 }; bots.push(bot); return bot;
}

function autoEquip(p) { // wear anything better that we meet the level for
  for (const it of [...p.inv]) {
    if (it.type !== 'weapon' && it.type !== 'armor') continue; if ((it.def.lvl || 0) > p.level) continue;
    const slot = it.type === 'weapon' ? 'weapon' : it.slot, cur = p.equip[slot];
    if (!cur || value(it.def) > value(cur.def)) D.command(p, (it.type === 'weapon' ? 'wield ' : 'wear ') + it.ids[0]);
  }
}
function shopPlan(p, bot) { // find a potion restock or the best affordable upgrade, and the shop that sells it
  const heals = p.inv.filter((i) => i.type === 'potion' && i.def.heal).length;
  if (heals < 2 && p.gold >= 80) { const id = p.level >= 8 ? 'strong' : 'potion', room = nearest(p.env.path, (r) => r.def.shop && r.def.shop.stock.includes(id)); if (room) return { room, id, slot: null }; }
  for (const t of [...TIERS].reverse()) {
    for (const [s, slot] of PIECES) {
      const id = t + s, d = D.W.items[id]; if (!d || d.lvl > p.level || p.gold < d.value || p.inv.length > 24) continue;
      const cur = p.equip[slot]; if (cur && value(cur.def) >= value(d)) continue;
      const room = nearest(p.env.path, (r) => r.def.shop && r.def.shop.stock.includes(id)); if (room) { const area = D.rooms.get(room).area, risk = area === 'dunes' || area === 'frost' || area === 'road' ? Math.max(bot.avoid[area] || 0, bot.avoid.road || 0) : 0; if (p.level >= (SHOP_MIN[area] || 1) + 3 * risk) return { room, id, slot }; } // dying on the way makes the bot wait longer // far shops need a higher level (the road is dangerous)
    }
  }
  return null;
}

function sendHome(bot) { // bots never leave the Proving Grounds: after a death (which respawns them in town) or a restart they walk straight back
  const p = bot.p, room = D.rooms.get('grounds/yard'); if (!room) return; if (p.env) p.env.tell(`${p.name} heads back to the Proving Grounds.`, p, 'sys'); p.enemy = null; p.enter(room, true); room.tell(`${p.name} arrives.`, p, 'sys');
  if (!p.equip.body) { for (const id of ['cap', 'jerkin', 'shield', 'boots']) if (D.W.items[id]) D.cloneItem(id).move(p); autoEquip(p); }
}
function release(bot) { // a summoned bot goes back to the Proving Grounds
  const p = bot.p; bot.escort = null; p.following = null; if (p.team) D.teamLeave(p, 'bot'); sendHome(bot);
}
D.summonBot = (p, name) => { // summonbot [name]: call a bot to team with you: it joins your team, follows you and assists in combat
  if (p.isBot) return; if (!bots.length) return p.msg('There are no bots online.', 'sys'); if (bots.some((b) => b.escort === p.name)) return p.msg('A bot is already teaming with you. `dismissbot` sends it home first.', 'sys');
  if (p.team && p.team.members.length >= 5) return p.msg('Your team is full (5).', 'sys'); if ((p.cd.summonbot || 0) > Date.now()) return p.msg('The bots are still catching their breath. Try again in a few seconds.', 'sys');
  const free = bots.filter((x) => !x.escort && x.p && !x.p.gone && x.p.env && !x.p.enemy), q = (name || '').toLowerCase(), bot = q ? free.find((x) => x.spec.name.toLowerCase() === q || x.spec.name.toLowerCase().startsWith(q)) : free[D.rnd(0, Math.max(0, free.length - 1))];
  if (!bot) return p.msg(q ? `${name} is not available (busy, in a fight or already teaming up). Bots: ${bots.map((x) => x.spec.name).join(', ')}.` : 'All the bots are busy right now.', 'sys'); p.cd.summonbot = Date.now() + 20000;
  const bp = bot.p; if (bp.env) bp.env.tell(`${bp.name} is called away by ${p.name}.`, bp, 'sys'); bp.enemy = null; bp.enter(p.env, true); p.env.tell(`${bp.name} arrives, ready to fight beside ${p.name}.`, bp, 'sys');
  bot.escort = p.name; bp.following = p; if (!p.team) p.team = { leader: p.name, members: [p.name] }; if (!p.team.members.includes(bp.name)) p.team.members.push(bp.name); bp.team = p.team;
  p.msg(`*** ${bp.name} (level ${bp.level} ${bp.klass().name}) joins your team! They follow you and assist in combat. \`dismissbot\` sends them home. ***`, 'win'); if (D.teamMsg) D.teamMsg(p.team, `${bp.name} joined the team.`);
};
D.dismissBot = (p) => { const bot = bots.find((x) => x.escort === p.name); if (!bot) return p.msg('No bot is teaming with you.', 'sys'); const n = bot.p.name; release(bot); p.msg(`${n} heads back to the Proving Grounds.`, 'sys'); };
function think(bot) {
  const p = bot.p, now = Date.now(); if (!p.env) return; bot.tick++; walker = p;
  if (bot.escort) { // a summoned bot: team up with the player, follow them and assist in combat
    const l = D.players.get(bot.escort); if (!l || l.gone || l.ld) return release(bot);
    if (p.env !== l.env && !p.enemy) { p.enter(l.env, true); l.env.tell(`${p.name} catches up.`, p, 'sys'); }
    if (!p.enemy && l.enemy && l.enemy.hp > 0 && l.enemy.env === p.env && p.env === l.env) p.engage(l.enemy);
    if (!p.enemy) { if (p.hp < p.maxhp * 0.6) { const h = D.spellsOf(p).find((s) => s.kind === 'heal' && s.lvl <= p.level && p.mp >= s.mp && (p.cd[s.k] || 0) <= now); if (h) return D.cast(p, h.k); if (p.inv.some((i) => i.type === 'potion' && i.def.heal)) return D.command(p, 'quaff'); } return; }
  } else if (D.rooms.get('grounds/yard') && p.env.area !== HOME) return sendHome(bot);
  if (!p.enemy && Math.random() < 0.4) return; // bots take their time: they only act on about 60% of their turns when not fighting
  const foes = p.env.inv.filter((o) => o.isLiving && !o.isPlayer);
  if (p.enemy) { // ---- combat ----
    if (p.hp < p.maxhp * 0.5) {
      if (p.inv.some((i) => i.type === 'potion' && i.def.heal)) return D.command(p, 'quaff');
      const h = D.spellsOf(p).find((s) => s.kind === 'heal' && s.lvl <= p.level && p.mp >= s.mp && (p.cd[s.k] || 0) <= now); if (h) return D.cast(p, h.k);
      if (p.hp < p.maxhp * 0.25) return D.command(p, 'flee');
    }
    const ready = D.spellsOf(p).filter((s) => s.lvl <= p.level && p.mp >= s.mp && (p.cd[s.k] || 0) <= now);
    const buff = ready.find((s) => (s.kind === 'buff' || s.kind === 'summon') && !p.fx.some((e) => e.n === (s.sname || s.n)));
    if (buff && Math.random() < 0.5) return D.cast(p, buff.k);
    const atk = ready.filter((s) => s.kind === 'dmg' && (!s.aoe || foes.length > 1)).sort((a, b) => b.lvl - a.lvl)[0]; if (atk) return D.cast(p, atk.k);
    return;
  }
  if (now > bot.nextChat) { bot.nextChat = now + 150000 + Math.random() * 270000; return D.botSay(p, pickLine(bot)); }
  if (p.inv.length < p.cap() - 2 && p.env.inv.some((o) => !o.isLiving && !o.isNpc && !o.fixed && o.def.type !== 'material') && !p.env.def.safe) { D.command(p, 'get all'); autoEquip(p); return; }
  if (bot.tick % 15 === 0) autoEquip(p);
  const here = p.env.path;
  if ((p.deaths || 0) !== bot.seenDeaths) { bot.seenDeaths = p.deaths || 0; for (const a of [(D.rooms.get(p.lastDeath) || {}).area, bot.target]) if (a) bot.avoid[a] = (bot.avoid[a] || 0) + 1; } // blame both the place of death and the ground we were heading for // learn from deaths: be more careful in that area
  if (bot.tick % 600 === 0) for (const k of Object.keys(bot.avoid)) bot.avoid[k] = Math.max(0, bot.avoid[k] - 1);
  // ---- recovery ----
  if (p.hp < p.maxhp * 0.6 || p.mp < p.maxmp * 0.25) {
    if (p.hp < p.maxhp * 0.5 && p.inv.some((i) => i.type === 'potion' && i.def.heal) && !p.env.def.safe) return D.command(p, 'quaff');
    if (p.env.def.healer) { const cost = p.level <= 15 ? 0 : (p.level - 15) * 10; if (p.gold >= cost) return D.command(p, 'pray'); }
    if (p.env.def.safe || p.env.def.camp || p.env.def.inn) return; // regenerating
    if (Math.random() < 0.6) return D.command(p, 'recall'); // the quick way home when hurt
    const goal = nearest(here, (r) => r.def.camp || r.def.inn || r.def.healer); // closest place to recover
    const d = goal && nextStep(here, goal); return d ? D.command(p, d) : null;
  }
  // ---- full pack: sell the loot at the nearest shop (extra potions get dropped) ----
  if (p.inv.length >= 12 || D.bagUsed(p) >= D.bagCap(p) - 8) {
    if (p.env.def.shop) {
      D.command(p, 'sell all');
      if (p.inv.length >= 12) { // still full: drop worthless things, sell spare potions, then drop whatever is not equipped
        const worn = new Set(Object.values(p.equip)), junk = p.inv.find((i) => !worn.has(i) && (i.type === 'material' || !(i.def.value > 0))), pots = p.inv.filter((i) => i.type === 'potion');
        if (junk) D.command(p, 'drop ' + junk.ids[0]); else if (pots.length > 4) D.command(p, 'sell ' + pots[0].ids[0]); else D.command(p, 'drop ' + (p.inv.find((i) => !worn.has(i)) || p.inv[0]).ids[0]);
      }
      return;
    }
    const goal = nearest(here, (r) => r.def.shop), d = goal && nextStep(here, goal); if (d) return D.command(p, d);
  }
  // ---- shopping ----
  if (bot.tick % 20 === 0 || bot.plan) bot.plan = bot.plan || shopPlan(p, bot);
  if (bot.plan) {
    const pl = bot.plan; if (p.gold < (D.W.items[pl.id] || {}).value) bot.plan = null;
    else if (here === pl.room) {
      if (!pl.slot) D.command(p, 'buy 3 ' + pl.id);
      else for (const t of [...TIERS].reverse()) for (const [sfx, slot] of PIECES) { // buy every affordable upgrade this shop sells in one visit
        const id = t + sfx, d = D.W.items[id]; if (!d || !p.env.def.shop.stock.includes(id) || d.lvl > p.level || p.gold < d.value) continue;
        const cur = p.equip[slot]; if (!cur || value(cur.def) < value(d)) { D.command(p, 'buy ' + id); autoEquip(p); }
      }
      bot.plan = null;
    }
    else { const d = nextStep(here, pl.room); if (d) return D.command(p, d); bot.plan = null; }
    return;
  }
  // ---- reborn: at level 40, walk to the Hall of Rebirth and remort ----
  if (p.level >= 40 && (p.remort || 0) < 40) {
    if (here === 'town/hall_of_rebirth') return D.command(p, 'remort confirm ' + ['dragon', 'android', 'shapeshifter'][D.rnd(0, 2)]);
    const d = nextStep(here, 'town/hall_of_rebirth'); if (d) return D.command(p, d);
  }
  // ---- starter gear from Brann's free rack ----
  if (!p.equip.body && p.level < 5) {
    if (here === 'town/smithy') { D.command(p, 'get all'); for (const it of [...p.inv]) if (it.type === 'armor') D.command(p, 'wear ' + it.ids[0]); autoEquip(p); if (p.equip.body) return; }
    else if (D.rooms.get(here).area === 'town' || p.env.def.safe) { const d = nextStep(here, 'town/smithy'); if (d) return D.command(p, d); }
  }
  // ---- hunting ----
  const eligible = HUNT.filter(([lv, r]) => lv + 3 * (bot.avoid[D.rooms.get(r).area] || 0) <= p.level); let spot = HUNT[0][1];
  for (let i = eligible.length - 1; i >= 0; i--) { const r = eligible[i][1]; if (here === r || D.rooms.get(here).area === D.rooms.get(r).area || nextStep(here, r)) { spot = r; break; } } // best ground we can actually reach
  const area = D.rooms.get(spot).area;
  bot.target = area;
  if (foes.length && p.hp >= p.maxhp * 0.8 && p.mp >= p.maxmp * 0.4 && !(foes.length >= 3 && p.hp < p.maxhp * 0.95) && !p.env.def.safe) return D.command(p, 'kill ' + foes[0].name.split(' ').pop());
  if (p.env.area !== area || p.env.def.safe) { const d = nextStep(here, spot); return d ? D.command(p, d) : null; }
  const opts = Object.entries(p.env.exits).filter(([, n]) => { const r = D.rooms.get(n); return r && r.area === area && !r.def.safe; });
  if (opts.length) D.command(p, opts[D.rnd(0, opts.length - 1)][0]);
}


// ---- chatter: random gossip, and replies to what players say on the gossip channel ----
const pickLine = (bot) => { const all = bot.spec.lines.concat(EXTRA); let l; do { l = all[D.rnd(0, all.length - 1)]; } while (l === bot.lastLine && all.length > 1); bot.lastLine = l; return l; };
const REPLIES = [
  [/\b(good bot|nice bot|great bot|best bot|love you|you rock|you are (great|awesome|amazing|the best)|thank(s| you) (bot|zeph|rook|mira|dusty|kaz|lyra))\b/i, ['Aww, {name}. You are the real MVP.', '{name}, you just made my whole circuit board warm.', 'Stop it, {name}, you will make me blush. I do not have cheeks.', 'You are too kind, {name}. Have a free cheer: HOORAY!', '{name} is a legend and I will say so to anyone who asks.']],
  [/\b(i (just )?(won|beat|killed|finished|completed|reached|hit|made it|did it|got|found|crafted|built|learned)|level(ed|led)? up|new level|got legendary|found a relic|boss (down|dead)|finally)\b/i, ['Nice work, {name}! That is how it is done.', 'Look at {name} go! Absolutely crushing it.', 'Well done, {name}. The multiverse is a little safer tonight.', 'Great job, {name}! Tell me everything.', 'Respect, {name}. That took real skill.', '{name}, you are on fire. Do not stop now!', 'Impressive, {name}. I knew you could do it.', 'Bravo, {name}! Someone write this down.']],
  [/\b(gg|good game|well played|wp|nice (one|try|job|play))\b/i, ['GG, {name}. Well played.', 'Good game, {name}! Same time tomorrow?', '{name} with the clean finish. Beautiful.']],

  [/\b(hi|hello|hey|yo|sup|howdy|greetings|hiya)\b/i, ['Hey {name}! Welcome to the multiverse.', 'Hello {name}. Try not to die in the first ten minutes.', 'Yo {name}! Need anything?', 'Well met, {name}.', 'Hi {name}! The fountain in the square heals you for free.', 'Howdy {name}. Mind the ghosts.']],
  [/\b(thanks|thank you|thx|ty|cheers)\b/i, ['Anytime, {name}.', 'No problem {name}. Pay it forward.', 'You are welcome, {name}!', 'Do not mention it, {name}. Seriously, do not tell the pixies.']],
  [/\b(help|how do i|how to|newbie|new here|noob|stuck|lost|confused)\b/i, ['Type tutorial for a guided tour with buttons, {name}.', 'Check the Player Guide link on the left, {name}. It explains everything.', 'Drink from the fountain, take a contract from Fixer Torv, then hit the Whisperwood, {name}.', 'Start with the board at the Adventurers Guild, {name}. Easy XP.', 'Stuck? Type recall and you are home, {name}.']],
  [/\b(lfg|team|group|party|looking for)\b/i, ['Teams split XP and credits when you fight in the same room, {name}. Try team invite.', 'I am busy hunting right now, {name}, but a team is always a good idea.', 'Anyone seen a healer? {name} wants a team.', 'Team up with a Preacher, {name}. They keep you alive.']],
  [/\b(boss|warlord|hydra|titan|marshal|voidlord|dalton|helix|leviathan|express|mab)\b/i, ['Bosses hit hard, {name}. Bring potions and friends.', 'I heard the bosses carry legendary loot, {name}. Worth the risk.', 'Boss tip, {name}: kill the small stuff first so you do not get swarmed.', 'Do not solo a boss without a plan, {name}. I have the scars.']],
  [/\b(legend|legendary|discovered|drop|dropped|loot|rare)\b/i, ['Legendary drops sell for their full value, {name}. Absolutely worth it.', 'I once saw a legendary drop. I was not the one who found it.', 'Rare loot is mostly luck, {name}. And patience. Mostly luck.']],
  [/\b(level|lvl|leveled|levelled|remort|xp)\b/i, ['Grats on the level, {name}!', 'Leveling is a marathon, {name}. Or a very long saloon crawl.', 'Remort at 40 is a good plan, {name}. Stronger every time.', 'XP is faster with a team, {name}. Just saying.']],
  [/\b(died|dead|death|rip|killed|slain)\b/i, ['Ouch, {name}. Better luck next time.', 'The taunts will be brutal, {name}. Hold your head high.', 'Everyone dies, {name}. Some of us die more than others.', 'RIP, {name}. The fountain will fix you right up.']],
  [/\b(gif|lol|lmao|haha|rofl)\b/i, ['Ha! Good one, {name}.', 'Lol, {name}. You should post a GIF with a semicolon and a word.', 'I laughed. Internally. Robots do that.', 'Hah, nice, {name}.']],
  [/\b(zeph|rook|bots?)\b/i, ['Someone called? I am here, {name}.', 'Yes, I am a very real adventurer, {name}.', 'Bot? I prefer enthusiastic resident.', 'You rang, {name}?']],
  [/\b(saloon|whiskey|drink|drinks|beer)\b/i, ['The Silver Spur is the place, {name}. Try the steak.', 'Whiskey heals, {name}. Sarsaparilla restores mana. Choose wisely.', 'First round is on whoever pays, {name}.']],
  [/\?\s*$/, ['Good question, {name}. I have no idea.', 'Ask the Guide, {name}. Or ask me again after a drink.', 'Hmm. Try the tutorial command, {name}.', 'I think so, {name}. Probably.']],
];
let lastReply = 0;
const GIFQ = [[/\b(hi|hello|hey|yo|sup|howdy|greetings|hiya)\b/i, 'hello wave'], [/\b(thanks|thank you|thx|ty|cheers)\b/i, 'you are welcome'], [/\b(lol|lmao|haha|rofl)\b/i, 'laughing'], [/\b(died|dead|rip|killed|slain)\b/i, 'oops'], [/\b(help|stuck|lost|confused)\b/i, 'here to help']];
const QUEST_LINES = ['Excellent work, {name}! The board is a little emptier thanks to you.', 'Quest complete! {name} is a hero of the people.', 'Stellar, {name}. The contract is done and the legend grows.', 'Nice one, {name}! Contract complete.', 'Grats on the quest, {name}!', '{name} finishing contracts like a pro.', 'Another one done: well played, {name}.'], BOSS_LINES = ['{name} just slew a boss and did not even look nervous.', 'Hail the boss-slayer, {name}!', 'Bow before {name}, conqueror of bosses.', '{name} took down a boss! Respect.', 'Boss down. {name} is not messing around.', 'Whoa, {name} beat a boss! Legendary.', 'That is how it is done, {name}. Bow to the boss-slayer.'], DEATH_LINES = ['Ouch, {name}. Better luck next time.', 'Rest in pieces, {name}.', 'F in chat for {name}.', 'Shake it off, {name}. The taunts are only temporary.'];
function speak(bot, text, topic) { // bots talk in the gossip channel only when answering a player or a broadcast (the rest of the time they use the bot channel); some replies add a GIF
  let line = text; try { const G = require('./giphy'); if (topic && G.enabled() && Math.random() < 0.3) line += ' ;' + topic; } catch (e) { /* no gifs */ }
  bot.p.cd = bot.p.cd || {}; D.command(bot.p, 'gossip ' + line);
}
function onGossip(from, msg) {
  const sp = D.players.get(from); if (!sp || sp.isBot || !bots.length) return; const greet = /\b(hi|hello|hey|yo|sup|howdy|greetings|hiya|help)\b/i.test(msg); if (!greet && Date.now() - lastReply < 12000) return; if (greet && Date.now() - lastReply < 3000) return;
  const named = bots.find((b) => new RegExp('\\b' + b.spec.name + '\\b', 'i').test(msg)), hit = REPLIES.find(([re]) => re.test(msg));
  if (!named && !greet && !(hit && Math.random() < 0.6) && Math.random() > 0.12) return;
  const bot = named || bots[D.rnd(0, bots.length - 1)], pool = hit ? hit[1] : ['Interesting, {name}.', 'Is that right, {name}?', 'Ha, {name}. Tell me more.', 'I was just thinking the same, {name}.'], gq = (GIFQ.find(([re]) => re.test(msg)) || [])[1];
  lastReply = Date.now(); setTimeout(() => { try { if (bot.p && !bot.p.gone) speak(bot, pool[D.rnd(0, pool.length - 1)].replace(/\{name\}/g, from), gq); } catch (e) { D.log('bot reply error', e.message); } }, 2000 + Math.random() * 4000);
}
let lastReact = 0;
function onBroadcast(kind, text) { // a player completed a quest, defeated a boss or died: a bot reacts in the gossip channel
  if (!bots.length || Date.now() - lastReact < 25000) return; let pool, gq, m;
  if (kind === 'quest' && (m = text.match(/(\w+) has completed the contract/))) { pool = QUEST_LINES; gq = 'celebrate'; } else if (kind === 'boss' && (m = text.match(/(\w+) has defeated the boss/))) { pool = BOSS_LINES; gq = 'victory'; } else if ((kind === 'deaths' || kind === 'death') && (m = text.match(/^\W*(\w+) \(level/))) { pool = DEATH_LINES; gq = 'oops'; }
  if (!pool) return; const who = D.players.get(m[1]); if (!who || who.isBot || Math.random() > 0.6) return; const bot = bots[D.rnd(0, bots.length - 1)]; lastReact = Date.now();
  setTimeout(() => { try { if (bot.p && !bot.p.gone) speak(bot, pool[D.rnd(0, pool.length - 1)].replace(/\{name\}/g, who.name), gq); } catch (e) { D.log('bot react error', e.message); } }, 3000 + Math.random() * 4000);
}
function save() {
  const o = {}; for (const b of bots) o[b.spec.name] = b.p.toRec();
  try { fs.mkdirSync(path.dirname(FILE), { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(o)); } catch (e) { D.log('bot save failed', e.message); }
}
function start() {
  let saved = {}; try { saved = JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch (e) { /* first run */ }
  for (const s of SPECS) spawn(s, saved[s.name]);
  D.onGossip = onGossip; D.onBroadcast = onBroadcast; ticker = setInterval(() => { for (const b of bots) if (!b.escort) try { think(b); } catch (e) { D.log('bot error', b.spec.name, e.stack); } }, 9000); escortTicker = setInterval(() => { for (const b of bots) if (b.escort) try { think(b); } catch (e) { D.log('bot error', b.spec.name, e.stack); } }, 1500); // summoned bots react quickly
  saver = setInterval(save, 60000); D.log(`bots online: ${NAMES.join(', ')}`);
}
function stop() { clearInterval(escortTicker); D.onGossip = null; D.onBroadcast = null; clearInterval(ticker); clearInterval(saver); for (const b of bots) { D.players.delete(b.spec.name); b.p.destroy(); } bots.length = 0; }

module.exports = { NAMES, start, save, stop, think, spawn, bots };
