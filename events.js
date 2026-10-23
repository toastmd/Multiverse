'use strict';
// Holiday events: each runs for 7 days around its date (the server's local date). Halloween: trick-or-treat. Thanksgiving: wild turkeys with a kill counter.
// Easter: bunnies with a kill counter and hidden eggs that sell. Christmas: ugly sweaters, Christmas hats and rogue reindeer with a kill counter.
// New Year: party hats, champagne to drink and fireworks. Fourth of July: fireworks. Administrators can force one with `event start <name>`.
const fs = require('fs'), path = require('path'), D = require('./driver');
const DAY = 864e5, FILE = path.join(__dirname, 'data', 'events.json');
const easter = (y) => { const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451), mo = Math.floor((h + l - 7 * m + 114) / 31), da = ((h + l - 7 * m + 114) % 31) + 1; return new Date(y, mo - 1, da); };
const nthThursday = (y, mo, n) => { const d = new Date(y, mo, 1); d.setDate(1 + ((4 - d.getDay() + 7) % 7) + 7 * (n - 1)); return d; };
const EV = {
  halloween: { name: 'Halloween', icon: '\u{1F383}', date: (y) => new Date(y, 9, 31), what: 'Trick-or-treat! Type `trickortreat` in town for candy, costumes and the odd prank.' },
  thanksgiving: { name: 'Thanksgiving', icon: '\u{1F983}', date: (y) => nthThursday(y, 10, 4), what: 'Wild turkeys roam the world. Hunt them and watch your turkey kill counter for rewards.' },
  easter: { name: 'Easter', icon: '\u{1F430}', date: easter, what: 'Bunnies hop about (with a bunny kill counter) and painted eggs are hidden on the ground. Pick up eggs and sell them.' },
  christmas: { name: 'Christmas', icon: '\u{1F384}', date: (y) => new Date(y, 11, 25), what: 'Rogue reindeer to hunt (with a reindeer kill counter) for Christmas hats and ugly sweaters.' },
  newyear: { name: "New Year's", icon: '\u{1F389}', date: (y) => new Date(y, 0, 1), what: 'Party hats and champagne in Ashfall Square, and fireworks over the world.' },
  pirate: { name: 'Talk Like a Pirate Day', icon: '\u{1F3F4}\u200D\u2620\uFE0F', date: (y) => new Date(y, 8, 19), days: 1, what: 'For the whole day every character talks like a pirate: what you say, shout, gossip and text comes out in pirate speak. Arr!' },
  pi: { name: 'Pi Day', icon: '\u{1F967}', date: (y) => new Date(y, 2, 14), days: 1, what: 'Pies (cherry, strawberry, blueberry and apple) turn up all over the world. Pick them up and eat them: they heal and restore mana.' },
  july4: { name: 'Fourth of July', icon: '\u{1F386}', date: (y) => new Date(y, 6, 4), what: 'Fireworks over the whole world, all week. Type `fireworks` to launch your own.' },
};
const windowOf = (id, y) => { const c = EV[id].date(y); if (EV[id].days === 1) { const d0 = new Date(c.getFullYear(), c.getMonth(), c.getDate()).getTime(); return [d0, d0 + DAY]; } /* a single-day event */ const s = new Date(c.getFullYear(), c.getMonth(), c.getDate() - 3).getTime(); return [s, s + 7 * DAY]; }; // 3 days before the date to 3 days after = 7 days
let forced = null; try { forced = JSON.parse(fs.readFileSync(FILE, 'utf8')); if (!forced || forced.until < Date.now()) forced = null; } catch (e) { forced = null; }
const saveForced = () => { try { fs.mkdirSync(path.dirname(FILE), { recursive: true }); if (forced) fs.writeFileSync(FILE, JSON.stringify(forced)); else if (fs.existsSync(FILE)) fs.unlinkSync(FILE); } catch (e) { /* not fatal */ } };
const nowMs = () => (D.eventClock ? D.eventClock() : Date.now());
function active(t = nowMs()) { const out = new Set(); if (forced && forced.until > t) out.add(forced.id); const y = new Date(t).getFullYear(); for (const id of Object.keys(EV)) for (const yy of [y - 1, y, y + 1]) { const [s, e] = windowOf(id, yy); if (t >= s && t < e) out.add(id); } return [...out]; }
function nextWindow(id, t = nowMs()) { const y = new Date(t).getFullYear(); for (const yy of [y - 1, y, y + 1, y + 2]) { const w = windowOf(id, yy); if (w[1] > t) return w; } return windowOf(id, y + 1); }
const fmt = (ms) => new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
// ---- items ----
function items(it) {
  const food = (id, name, fx, v, long) => { it[id] = { name, ids: [id, ...name.toLowerCase().replace(/[^a-z ]/g, '').split(' ').filter((w) => w.length > 2)], type: 'potion', long, value: v, ...fx }; };
  const trea = (id, name, v, long) => { it[id] = { name, ids: [id, ...name.toLowerCase().replace(/[^a-z ]/g, '').split(' ').filter((w) => w.length > 2)], type: 'treasure', long, value: v }; };
  const hat = (id, name, ac, long, bonus) => { it[id] = { name, ids: [id, ...name.toLowerCase().replace(/[^a-z ]/g, '').split(' ').filter((w) => w.length > 2)], type: 'armor', slot: 'head', ac, lvl: 1, value: 60, long, ...(bonus ? { bonus } : {}) }; };
  food('candycorn', 'candy corn', { heal: 40 }, 4, 'A little handful of candy corn: yellow, orange and white. Does not taste like corn.'); food('chocbar', 'chocolate bar', { heal: 90, mana: 20 }, 6, 'A fun-size chocolate bar.'); food('lollipop', 'swirly lollipop', { mana: 55 }, 5, 'A giant swirly lollipop on a stick.'); food('popcornball', 'popcorn ball', { heal: 70 }, 5, 'A sticky popcorn ball wrapped in orange wax paper.'); food('toffeeapple', 'toffee apple', { heal: 110 }, 8, 'A red apple coated in hard toffee.');
  hat('witchhat', 'pointy witch hat', 3, 'A tall, floppy black witch hat with a buckle.', { mp: 25 }); hat('pumpkinhelm', 'jack-o\'-lantern helm', 5, 'A hollowed pumpkin with a grin, worn like a helm. It smells like pie.', { hp: 30 });
  food('turkeyleg', 'roast turkey leg', { heal: 120 }, 12, 'A giant roast turkey leg, greasy and perfect.'); food('cranberry', 'cranberry sauce', { mana: 60 }, 6, 'A quivering can-shaped slab of cranberry sauce.'); food('pumpkinpie', 'pumpkin pie', { heal: 150, mana: 50 }, 14, 'A slice of pumpkin pie with a cloud of whipped cream.'); food('turkeydinner', 'Thanksgiving dinner', { heal: 420, mana: 120 }, 40, 'A full Thanksgiving dinner on a paper plate: turkey, stuffing, potatoes, gravy and pie.');
  hat('pilgrimhat', 'buckled pilgrim hat', 5, 'A tall black pilgrim hat with a gold buckle.', { hp: 40 });
  for (const [id, n, l] of [['pie_cherry', 'cherry pie', 'A cherry pie with a lattice crust and a little pi symbol cut into the top.'], ['pie_strawberry', 'strawberry pie', 'A strawberry pie, glazed and glistening, with pi cut into the crust.'], ['pie_blueberry', 'blueberry pie', 'A blueberry pie, still warm, with a purple-stained crust and a pi cut in the top.'], ['pie_apple', 'apple pie', 'A classic apple pie with a golden crust, cinnamon, and a pi symbol on top. 3.14159265...']]) food(id, n, { heal: 140, mana: 40 }, 15, l);
  trea('egg_plain', 'painted egg', 40, 'A hard-boiled egg painted in pastel stripes.'); trea('egg_gold', 'golden egg', 200, 'A heavy egg gilded in real gold leaf.'); trea('egg_rainbow', 'rainbow egg', 600, 'A shimmering egg that changes color in every light.');
  food('jellybeans', 'jelly beans', { mana: 45 }, 5, 'A bag of jelly beans in every color, some of them a bit strange.'); food('chocbunny', 'chocolate bunny', { heal: 100, mana: 25 }, 8, 'A hollow chocolate bunny with a pink ribbon.'); hat('bunnyears', 'floppy bunny ears', 4, 'A headband of floppy white bunny ears.', { mp: 30 });
  food('cookie', 'Christmas cookie', { heal: 80 }, 6, 'A frosted sugar cookie shaped like a star.'); food('eggnog', 'eggnog', { heal: 60, mana: 60 }, 8, 'A mug of thick, nutmeg-dusted eggnog.'); trea('antler', 'reindeer antler', 90, 'A big branching antler, shed by a very angry reindeer.');
  it.candycane = { name: 'giant candy cane', ids: ['candycane', 'candy', 'cane', 'giant'], type: 'weapon', dmg: [8, 14], lvl: 6, value: 300, long: 'A six-foot candy cane with a hooked handle. It bashes.' };
  it.uglysweater = { name: 'ugly Christmas sweater', ids: ['uglysweater', 'ugly', 'christmas', 'sweater'], type: 'armor', slot: 'body', ac: 6, lvl: 1, value: 120, bonus: { hp: 50 }, long: 'A lumpy red-and-green sweater with a light-up reindeer, knitted bells and a collar that itches. It is the ugliest thing you have ever owned. It is also warm.' };
  hat('xmashat', 'Santa hat', 4, 'A red Santa hat with a white pompom.', { mp: 30 });
  hat('partyhat', 'sparkly party hat', 3, 'A cone-shaped party hat with sequins and an elastic strap.', { mp: 20 }); food('champagne', 'bottle of champagne', { heal: 120, mana: 120 }, 15, 'A cold bottle of champagne with a wire cage and a cork ready to fly. Type `drink champagne`.'); trea('noisemaker', 'party noisemaker', 20, 'A party horn that unrolls when you blow it.');
}
// ---- spawning ----
const SPAWN = {
  turkey: { ev: 'thanksgiving', name: 'wild turkey', ids: ['turkey', 'wild', 'gobbler'], icon: '\u{1F983}', label: 'Turkey', plural: 'turkeys', drops: [['turkeyleg', 0.5], ['cranberry', 0.3], ['pumpkinpie', 0.12], ['pilgrimhat', 0.03]] },
  bunny: { ev: 'easter', name: 'hopping bunny', ids: ['bunny', 'rabbit', 'hopping'], icon: '\u{1F430}', label: 'Bunny', plural: 'bunnies', drops: [['jellybeans', 0.4], ['chocbunny', 0.25], ['egg_plain', 0.5], ['egg_gold', 0.12], ['bunnyears', 0.03]] },
  reindeer: { ev: 'christmas', name: 'rogue reindeer', ids: ['reindeer', 'rogue', 'deer'], icon: '\u{1F98C}', label: 'Reindeer', plural: 'reindeer', drops: [['cookie', 0.4], ['eggnog', 0.3], ['antler', 0.3], ['candycane', 0.07], ['uglysweater', 0.04], ['xmashat', 0.04]] },
};
const MILE = { 5: { gold: 150 }, 10: { gold: 300 }, 25: { gold: 1000 }, 50: { gold: 3000 }, 100: { gold: 10000 } };
const PRIZE = { turkey: { 5: 'turkeydinner', 10: 'pilgrimhat', 25: 'turkeydinner' }, bunny: { 5: 'chocbunny', 10: 'bunnyears', 25: 'egg_rainbow' }, reindeer: { 5: 'xmashat', 10: 'uglysweater', 25: 'candycane' } };
const eligible = () => [...D.rooms.values()].filter((r) => !r.def.safe && !['grounds', 'town', 'buck'].includes(r.area) && r.inv.some((o) => o.isLiving && !o.isPlayer && !o.def.boss && !o.def.evkind));
function spawnOne(kind) {
  let rs = eligible(); if (!rs.length) return false; const low = rs.filter((r) => { const m = r.inv.find((o) => o.isLiving && !o.isPlayer && !o.def.boss); return m && m.level <= 16; }); if (low.length && Math.random() < 0.75) rs = low; /* most appear where newer players hunt */ const room = rs[Math.floor(Math.random() * rs.length)], base = room.inv.filter((o) => o.isLiving && !o.isPlayer && !o.def.boss && !o.def.evkind)[0], T = SPAWN[kind];
  const id = `ev_${kind}_${base.mobId}`; if (!D.W.mobs[id]) { const b = base.def; D.W.mobs[id] = { name: T.name, ids: T.ids, icon: T.icon, level: b.level, hp: Math.max(8, Math.round(b.hp * 0.8)), str: b.str, dex: b.dex + 2, con: b.con, dmg: b.dmg, ac: b.ac, xp: Math.round((b.xp || 10) * 1.6) + 10, gold: b.gold, drops: T.drops, aggro: false, wander: true, evkind: kind }; }
  const m = D.cloneMob(id); m.evAt = Date.now(); m.move(room); return true;
}
const living = (kind) => [...D.objects.values()].filter((o) => o.def && o.def.evkind === kind && o.env);
const EGGS = [['egg_plain', 70], ['egg_gold', 25], ['egg_rainbow', 5]];
function sweep(t) { // remove what belongs to events that are over
  const act = active(t); for (const [kind, T] of Object.entries(SPAWN)) if (!act.includes(T.ev)) for (const m of living(kind)) m.destroy();
  for (const o of [...D.objects.values()]) if (o.evAt && (Date.now() - o.evAt > 90 * 60000 || (/^egg_/.test(o.itemId || '') && !act.includes('easter')) || (/^pie_/.test(o.itemId || '') && !act.includes('pi')))) { if (!o.isLiving) o.destroy(); }
}
let lastShow = 0, lastActive = '', timer = null;
function tick() {
  const t = nowMs(), act = active(t), key = act.join(','), online = [...D.players.values()].filter((p) => !p.isBot).length;
  if (key !== lastActive) { for (const id of act) if (!lastActive.split(',').includes(id)) D.announce(`${EV[id].icon} ${EV[id].name} ${EV[id].days === 1 ? 'is here (today only)' : 'week has begun (7 days)'}! ${EV[id].what} Type \`events\` for details.`, 'events', 'announce'); for (const id of lastActive.split(',').filter(Boolean)) if (!act.includes(id)) D.announce(`${EV[id].icon} ${EV[id].name}${EV[id].days === 1 ? '' : ' week'} is over. See you next year!`, 'events', 'announce'); lastActive = key; sweep(t); }
  if (!online) return;
  for (const [kind, T] of Object.entries(SPAWN)) if (act.includes(T.ev)) { const want = Math.min(24, 6 + online * 3), have = living(kind).length; for (let i = 0; i < Math.min(3, want - have); i++) spawnOne(kind); for (const m of living(kind)) if (Date.now() - (m.evAt || 0) > 40 * 60000 && !m.enemy) m.destroy(); }
  if (act.includes('easter')) { const have = [...D.objects.values()].filter((o) => o.evAt && /^egg_/.test(o.itemId || '') && o.env).length; const rs = [...D.rooms.values()].filter((r) => !r.def.indoor && r.area !== 'grounds'); for (let i = 0; i < Math.min(4, 30 - have); i++) { let roll = Math.random() * 100, id = 'egg_plain'; for (const [e, w] of EGGS) { if (roll < w) { id = e; break; } roll -= w; } const e = D.cloneItem(id); e.evAt = Date.now(); e.move(rs[Math.floor(Math.random() * rs.length)]); } }
  if (act.includes('pi')) { const have = [...D.objects.values()].filter((o) => o.evAt && /^pie_/.test(o.itemId || '') && o.env).length; const rs = [...D.rooms.values()].filter((r) => !r.def.indoor && r.area !== 'grounds' && !r.def.hidden); for (let i = 0; i < Math.min(4, 24 - have); i++) { const id = ['pie_cherry', 'pie_strawberry', 'pie_blueberry', 'pie_apple'][Math.floor(Math.random() * 4)], e = D.cloneItem(id); e.evAt = Date.now(); e.move(rs[Math.floor(Math.random() * rs.length)]); } }
  if (act.includes('newyear')) { const sq = D.rooms.get('town/square'); if (sq) { const cnt = (id) => sq.inv.filter((o) => o.itemId === id).length; for (const [id, max] of [['champagne', 6], ['partyhat', 3], ['noisemaker', 3]]) for (let i = cnt(id); i < max; i++) { const e = D.cloneItem(id); e.move(sq); } } }
  if ((act.includes('july4') || act.includes('newyear')) && Date.now() - lastShow > 20 * 60000) { lastShow = Date.now(); D.fireworks(null, 9, `${EV[act.includes('july4') ? 'july4' : 'newyear'].icon} Fireworks light up the whole sky!`); }
}
const start = () => { if (!timer) { timer = setInterval(() => { try { tick(); } catch (e) { D.log('events', e.stack); } }, 15000); if (timer.unref) timer.unref(); setTimeout(() => { try { tick(); } catch (e) { /* first tick */ } }, 3000).unref?.(); } };
const stop = () => { clearInterval(timer); timer = null; };
// ---- fireworks (the client paints the effect) ----
D.fireworks = (p, secs = 8, text) => { const to = p ? [p, ...(p.env ? p.env.inv.filter((o) => o.isPlayer && o !== p) : [])] : [...D.players.values()]; for (const o of to) { if (o.isBot) continue; if (text) o.msg(text, 'event'); o.send({ t: 'fx', k: 'fireworks', secs }); } };
// ---- kills, trick-or-treat, display ----
const give = (p, id) => { const it = D.cloneItem(id); it.move(p); return it; };
function onKill(p, mob) {
  const kind = mob.def.evkind, T = SPAWN[kind]; if (!T || !p.isPlayer) return; p.evk = p.evk || {}; const n = (p.evk[kind] = (p.evk[kind] || 0) + 1);
  p.msg(`${T.icon} ${T.label} kill counter: ${n}`, 'event'); const m = MILE[n]; if (m) { p.gold += m.gold; let extra = ''; const id = PRIZE[kind] && PRIZE[kind][n]; if (id) extra = ` and ${give(p, id).short}`; p.msg(`${T.icon} ${n} ${T.plural}! Reward: ${m.gold} credits${extra}.`, 'win'); if (n >= 50) D.gossip(`${p.name} has hunted ${n} ${T.plural}!`); }
}
const DOORS = ['a crooked house with a jack-o\'-lantern on the porch', 'a tall brick house with cobwebs on the door', 'a cozy cottage with a bowl of candy on the step', 'a creaky mansion with a flickering porch light', 'a little house with plastic skeletons on the lawn'];
function trick(p) {
  const act = active(); if (!act.includes('halloween')) return p.msg('Trick-or-treating is only on during Halloween week. Type `events` to see when.', 'sys');
  if (!(p.env.def.safe || p.env.area === 'town' || p.env.def.indoor === false && p.env.terrain === 'concrete')) return p.msg('There are no houses to knock on here. Try the town (Ashfall Square and the streets around it).', 'sys');
  if (Date.now() - (p._tt || 0) < 30000) return p.msg('The neighborhood is out of candy for a moment. Try again in a few seconds.', 'sys'); p._tt = Date.now(); p.evk = p.evk || {}; p.evk.treats = (p.evk.treats || 0) + 1;
  const door = DOORS[Math.floor(Math.random() * DOORS.length)], r = Math.random(); p.msg(`\u{1F383} You knock on the door of ${door}. "Trick or treat!"`, 'event');
  if (r < 0.62) { const c = ['candycorn', 'chocbar', 'lollipop', 'popcornball', 'toffeeapple'][Math.floor(Math.random() * 5)], it = give(p, c), g = Math.random() < 0.3 ? 5 + Math.floor(Math.random() * 20) : 0; p.gold += g; p.msg(`The door opens and you get a treat: ${it.short}${g ? ` and ${g} credits` : ''}! Happy Halloween!`, 'win'); }
  else if (r < 0.92) { const T = ['A skeleton leaps out and yells BOO! You jump so high you lose 3 credits out of your pocket.', 'A bucket of green slime falls on your head. It is just pudding. It is also gone, with your last bit of dignity.', 'The door creaks open on nothing at all. A cold wind blows out your candle, and you could swear someone giggled.', 'A witch cackles, hands you a rubber chicken and slams the door. It squeaks.', 'A ghost in a bedsheet pops out and says: "Boo-hoo, I have no candy." You feel a little bad for the ghost.']; const i = Math.floor(Math.random() * T.length); if (i === 0) p.gold = Math.max(0, p.gold - 3); p.msg(`TRICK! ${T[i]}`, 'hurt'); }
  else { const c = Math.random() < 0.5 ? 'witchhat' : 'pumpkinhelm', it = give(p, c); p.msg(`The old lady at the door smiles: "You look like you could use a costume." She hands you ${it.short}! A rare treat!`, 'win'); }
  if (p.sendStats) p.sendStats();
}
// ---- Talk Like a Pirate Day: everything players say, shout, gossip or text comes out in pirate ----
const PIR = { hello: 'ahoy', hi: 'ahoy', hey: 'ahoy', yes: 'aye', yeah: 'aye', yep: 'aye', yup: 'aye', ok: 'aye', okay: 'aye', no: 'nay', nope: 'nay', you: 'ye', your: 'yer', "you're": 'ye be', yours: 'yers', my: 'me', mine: 'me own', "i'm": 'I be', im: 'I be', friend: 'matey', friends: 'mateys', buddy: 'matey', dude: 'matey', guys: 'mateys', mate: 'matey', the: "th'", of: "o'", is: 'be', are: 'be', am: 'be', for: 'fer', and: "an'", with: "wit'", money: 'doubloons', credits: 'doubloons', gold: 'booty', treasure: 'booty', stop: 'avast', thanks: 'thank ye', please: 'if it pleases ye', sorry: "beggin' yer pardon", bye: 'fair winds', goodbye: 'fair winds', where: 'whar', there: 'thar', boss: "cap'n", sir: "cap'n", girl: 'lass', woman: 'lass', boy: 'lad', man: 'lad', wow: 'shiver me timbers', lol: 'har har', haha: 'har har', over: "o'er", food: 'grub', drink: 'grog', beer: 'grog', ship: 'vessel', yes: 'aye' };
const FLOURISH = ['arr!', 'yo ho ho!', 'savvy?', 'har har!', 'arrr!', 'me hearties!'];
function pirate(text) {
  const out = String(text).replace(/[A-Za-z']+/g, (w) => { const l = w.toLowerCase(); let r = PIR[l]; if (!r && /^[a-z]{4,}ing$/.test(l)) r = l.slice(0, -3) + "in'"; if (!r) return w; return w[0] === w[0].toUpperCase() && w.length > 1 && w[1] === w[1].toLowerCase() ? r[0].toUpperCase() + r.slice(1) : w === w.toUpperCase() && w.length > 1 ? r.toUpperCase() : r; });
  if (out.length > 10 && Math.random() < 0.5) return out.replace(/[.!?]*\s*$/, '') + ', ' + FLOURISH[Math.floor(Math.random() * FLOURISH.length)];
  return out;
}
const decor = () => { const a = active(), t = []; if (a.includes('pirate')) t.push('\u{1F3F4}\u200D\u2620\uFE0F Jolly Roger flags flap from every rooftop, and every voice ye hear sounds suspiciously like a pirate. (`events`)'); if (a.includes('pi')) t.push('\u{1F967} A banner reads HAPPY PI DAY 3.14159... and pies have been left cooling in odd corners of the world. (`events`)'); if (a.includes('halloween')) t.push('\u{1F383} Jack-o\'-lanterns grin from every window and cobwebs hang from the saloon sign. Every door is open for `trickortreat`.'); if (a.includes('thanksgiving')) t.push('\u{1F983} A hand-lettered banner reads HAPPY THANKSGIVING. Wild turkeys gobble in the wilds beyond the gate. (`events`)'); if (a.includes('easter')) t.push('\u{1F430} Pastel bunting hangs from every building and painted eggs are hidden all over the world. Bunnies hop in the wilds. (`events`)'); if (a.includes('christmas')) t.push('\u{1F384} A towering Christmas tree stands beside the fountain, hung with lights and tin stars. Rogue reindeer roam the wilds. (`events`)'); if (a.includes('newyear')) t.push('\u{1F389} Streamers and a banner reading HAPPY NEW YEAR! Tables of champagne and party hats are set up around the fountain. (`events`)'); if (a.includes('july4')) t.push('\u{1F386} Red, white and blue bunting hangs everywhere and a crate of fireworks sits by the fountain: type `fireworks`.'); return t; };
function report(p) {
  const a = active(), t = nowMs(); p.msg('Holiday events (each lasts 7 days):', 'rname');
  for (const [id, e] of Object.entries(EV)) { const [s, en] = nextWindow(id, t), on = a.includes(id), days = Math.ceil((s - t) / DAY); p.msg(`  ${e.icon} ${e.name.padEnd(15)} ${fmt(s)} to ${fmt(en - 1)}  ${on ? '** ON NOW **' : days > 0 ? `starts in ${days} day${days > 1 ? 's' : ''}` : ''}`, on ? 'win' : 'sys'); if (on) p.msg(`      ${e.what}`, 'items'); }
  const k = p.evk || {}; p.msg(`Your counters: turkeys ${k.turkey || 0}, bunnies ${k.bunny || 0}, reindeer ${k.reindeer || 0}, trick-or-treats ${k.treats || 0}. Milestone rewards at 5, 10, 25, 50 and 100 kills.`, 'sys');
}
function admin(p, a) {
  const [sub, id] = a.trim().toLowerCase().split(/\s+/); if (sub === 'stop') { forced = null; saveForced(); tick(); return p.msg('The forced event is stopped (events that are on by the calendar stay on).', 'win'); }
  if (sub === 'start') { if (!EV[id]) return p.msg(`Events: ${Object.keys(EV).join(', ')}`, 'sys'); forced = { id, until: Date.now() + (EV[id].days || 7) * DAY }; saveForced(); tick(); return p.msg(`${EV[id].name} is on for ${EV[id].days === 1 ? '1 day' : '7 days'} from now.`, 'win'); }
  p.msg('Usage: events start <halloween|thanksgiving|easter|christmas|newyear|july4|pirate|pi>   |   event stop', 'sys');
}
module.exports = { pirate, EV, active, nextWindow, windowOf, items, start, stop, tick, onKill, trick, decor, report, admin, easter, SPAWN, spawnOne, sweep };
