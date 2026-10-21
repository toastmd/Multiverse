'use strict';
// Two resident bots. They are real Player objects (they show on `who`, appear on the map, fight, level, die and gossip),
// driven by a small decision loop that issues the same commands a human would type.
const fs = require('fs'), path = require('path');
const D = require('./lib');
const FILE = path.join(__dirname, 'data', 'bots.json');
const SPECS = [
  { name: 'Zeph', cls: 'wirewalker', gender: 'female', lines: ['Anyone seen a decent netrunner deck vendor around here?', 'Spark and run. That is my whole strategy.', 'The Net is quiet tonight. Too quiet.', 'Rook, quit stealing my kills!', 'Heard the Starship Aurora is full of loot. Also full of murder drones.', 'Drones are just toasters with grudges.', 'Note to self: never hack a ship AI that says please.', 'Who left a golden spike in the saloon? It is humming.', 'Chrome, ghosts, fairies. I swear this multiverse is held together with duct tape.', 'Zero day on the fountain. It heals everything and nobody knows why.', 'Is it just me or do the pixies steal more than the outlaws?', 'Trade you a data chip for a decent sandwich.', 'I tried to hack the Hall of Rebirth. It hacked me back.', 'Anyone up for a team? Kills split the XP and we both win.', 'The leaderboard is a battlefield. Check the top ten with L.', 'Level ups are the best kind of notification.', 'Saloon piano is out of tune again. I love it.', 'Spotted a legendary drop in gossip earlier. Jealous.', 'If you hear humming from the cattle cars, do not open them.', 'Gossip tip: put a semicolon and a word for a GIF.', 'Frostpeak Station has great heating. Terrible neighbors.', 'Remort is worth it. Do the dragon, trust me.'] },
  { name: 'Rook', cls: 'barbarian', gender: 'male', lines: ['Smash first, ask questions never.', 'My chrome is heavier than your savings.', 'Zeph, you owe me a stim.', 'Who is buying drinks at the Silver Spur Saloon?', 'The Brimstone Express nearly ran me over. Nearly.', 'Nothing beats a good hammer and a bad idea.', 'The Gulch ghosts are all hat and no aim.', 'Fighting dragons is easy. Paying for repairs is hard.', 'I would hug someone but my arms are made of steel.', 'My armor is mostly dents at this point.', 'Need a tank? I am a tank. A very loud tank.', 'Anyone know why the pixies keep stealing my left boot?', 'Boss kills split nicely when you team up. Try it.', 'Whiskey for courage, sarsaparilla for sense.', 'Last night I punched a mutated crewman. He apologized. Weird.', 'Does anyone else hear a train in the Ember Wastes?', 'Do not drink from the Dreaming Pool. Long story.', 'Hey Zeph, race you to the next boss!', 'If you see a siren, cover your ears. Or your wallet.', 'The leaderboard is mine by next week. Watch me.', 'If it bleeds, I can hit it. If it does not bleed, I will hit it harder.', 'A good fight and a bad pun, that is all I need.'] },
];
const NAMES = SPECS.map((s) => s.name);
const HOME = 'grounds'; // the bots live and fight only in the Proving Grounds, so the rest of the world is left to the players
const HUNT = [[1, 'grounds/f1'], [4, 'grounds/f2'], [8, 'grounds/f3'], [11, 'grounds/f4'], [14, 'grounds/f5'], [18, 'grounds/f6'], [24, 'grounds/f7'], [28, 'grounds/f8'], [33, 'grounds/f9'], [37, 'grounds/f10']]; // minimum level for each training pen (kept conservative so the bots rarely die)
const TIERS = ['iron', 'steel', 'mithril', 'runed', 'adamant', 'dragon'], PIECES = [['sword', 'weapon'], ['mail', 'body'], ['helm', 'head'], ['shield', 'shield'], ['boots', 'feet']];
const SHOP_MIN = { dunes: 24, frost: 32, road: 24 }; // minimum level before a bot will travel to shops in those areas
const bots = []; let saver = null, ticker = null;

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
function think(bot) {
  const p = bot.p, now = Date.now(); if (!p.env) return; bot.tick++; walker = p;
  if (D.rooms.get('grounds/yard') && p.env.area !== HOME) return sendHome(bot);
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
  if (now > bot.nextChat) { bot.nextChat = now + 150000 + Math.random() * 270000; return D.command(p, 'gossip ' + pickLine(bot)); }
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
const pickLine = (bot) => { let l; do { l = bot.spec.lines[D.rnd(0, bot.spec.lines.length - 1)]; } while (l === bot.lastLine && bot.spec.lines.length > 1); bot.lastLine = l; return l; };
const REPLIES = [
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
function onGossip(from, msg) {
  const sp = D.players.get(from); if (!sp || sp.isBot || !bots.length || Date.now() - lastReply < 12000) return;
  const named = bots.find((b) => new RegExp('\\b' + b.spec.name + '\\b', 'i').test(msg)), hit = REPLIES.find(([re]) => re.test(msg));
  if (!named && !(hit && Math.random() < 0.6) && Math.random() > 0.12) return;
  const bot = named || bots[D.rnd(0, bots.length - 1)], pool = hit ? hit[1] : ['Interesting, {name}.', 'Is that right, {name}?', 'Ha, {name}. Tell me more.', 'I was just thinking the same, {name}.'];
  lastReply = Date.now(); setTimeout(() => { try { if (bot.p && !bot.p.gone) D.command(bot.p, 'gossip ' + pool[D.rnd(0, pool.length - 1)].replace(/\{name\}/g, from)); } catch (e) { D.log('bot reply error', e.message); } }, 3000 + Math.random() * 5000);
}
function save() {
  const o = {}; for (const b of bots) o[b.spec.name] = b.p.toRec();
  try { fs.mkdirSync(path.dirname(FILE), { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(o)); } catch (e) { D.log('bot save failed', e.message); }
}
function start() {
  let saved = {}; try { saved = JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch (e) { /* first run */ }
  for (const s of SPECS) spawn(s, saved[s.name]);
  D.onGossip = onGossip; ticker = setInterval(() => { for (const b of bots) try { think(b); } catch (e) { D.log('bot error', b.spec.name, e.stack); } }, 9000);
  saver = setInterval(save, 60000); D.log(`bots online: ${NAMES.join(', ')}`);
}
function stop() { D.onGossip = null; clearInterval(ticker); clearInterval(saver); for (const b of bots) { D.players.delete(b.spec.name); b.p.destroy(); } bots.length = 0; }

module.exports = { NAMES, start, save, stop, think, spawn, bots };
