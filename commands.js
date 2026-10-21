'use strict';
const D = require('./lib'); require('./magic'); require('./quest'); require('./trade');
const { cap, DIRS } = D;
const FULL = Object.fromEntries(Object.entries(DIRS).map(([k, v]) => [v, k]));
const ALIAS = { l: 'look', i: 'inventory', inv: 'inventory', eq: 'inventory', equipment: 'inventory', k: 'kill', attack: 'kill', take: 'get', sc: 'score', chat: 'gossip', gos: 'gossip', journal: 'quests', q: 'quests', contracts: 'quests', jobs: 'quests', runs: 'quests', chrome: 'cyber', trades: 'tradeskills', tradeskill: 'tradeskills', eat: 'quaff', rc: 'recall', run: 'speedwalk', cmds: 'commands', cmd: 'commands', bj: 'blackjack', cards: 'blackjack', bounty: 'bounties', wanted: 'bounties', top: 'leaderboard', lb: 'leaderboard', achievements: 'leaderboard', af: 'autoflee', aliases: 'alias', '?': 'help', unwield: 'remove', c: 'cast', spell: 'spells', abilities: 'spells', skills: 'spells', unwear: 'remove' };

const find = (list, w) => w && list.find((o) => o.isId(w.trim()));
// legendary items sell for their full value (everything else 40%, materials 60% at the Salvage Exchange)
const priceOf = (p, def) => { const v = Math.floor((def.value || 0) * (def.legend ? 1 : def.type === 'material' && p.env.def.exchange ? 0.6 : 0.4)); return def.type === 'material' ? Math.max(1, v) : v; }; // every gathered material sells for at least 1 credit
const UPMAX = 10, upCost = (def, up) => Math.round((1000 + 300 * (def.lvl || 1)) * 1.75 ** up), upSpent = (i) => { let n = 0; for (let k = 0; k < (i.up || 0); k++) n += upCost(i.def, k); return n; }; // weapon upgrades: +1 to +10, each costs 1.75x the last
const sellPrice = (p, i) => priceOf(p, i.def) + Math.round(0.35 * upSpent(i)); // a shop pays back 35% of what you spent on upgrades
const BOUND = /^(bag|holding|bag of holding|tools?|fishing pole|pole|mining pick|herbalist|sickle|hammer|alembic|skillet|crowbar)$/i;
const bagFind = (p, w) => { w = w.toLowerCase(); return Object.keys(p.bag).find((id) => { const d = D.W.items[id], n = d.name.toLowerCase(); return id === w || n === w || n.split(' ').includes(w) || (d.ids || []).includes(w); }); };
const worn = (p, it) => Object.values(p.equip).includes(it);
const scoreData = (p) => { // everything the graphical score window shows
  const k = p.klass(), w = p.equip.weapon, worn = new Set(Object.values(p.equip)), mats = {}; let goods = 0;
  for (const [id, c] of Object.entries(p.bag)) { const d = D.W.items[id]; if (!d) continue; if (d.type === 'material') mats[d.name] = (mats[d.name] || 0) + c; goods += priceOf(p, d) * c; }
  for (const it of p.inv) { if (it.type === 'material') mats[it.name] = (mats[it.name] || 0) + 1; if (!worn.has(it)) goods += sellPrice(p, it); }
  return { name: p.name, pre: D.preTitle(p), title: p.title || '', cls: k.name, ic: k.icon, ck: p.cls, gl: D.genderLabel(p.gender), rm: p.remort || 0, wiz: !!p.wiz, pic: D.playerPic(p), level: p.level, xp: p.xp, lo: p.level > 1 ? p.xpNeed(p.level - 1) : 0, hi: p.xpNeed(p.level),
    hp: p.hp, mhp: p.maxhp, mp: p.mp, mmp: p.maxmp, stam: p.cls === 'scavenger', luck: p.luck, mluck: p.maxLuck(), aura: p.aura(), attrs: p.attrs(), atk: p.atkPool(), def: p.defPool(), ac: p.ac(), wpn: w ? { n: w.name, a: w.def.dmg[0], b: w.def.dmg[1] } : null,
    gold: p.gold, goods, bounty: p.bounty || 0, bounties: p.bounties || 0, qp: p.qp, qpt: D.qpTotal(), qa: Object.keys(p.quests).length, qd: p.qdone.size, qt: D.Q.QUESTS.length, pack: p.inv.length, cap: p.cap(), bag: D.bagUsed(p), bcap: D.bagCap(p), deaths: p.deaths || 0,
    skills: Object.entries(p.skills).map(([id, s]) => ({ n: D.T.SKILLS[id].name, i: D.T.SKILLS[id].icon || '', l: s.lvl })), chrome: p.cyber.map((id) => D.W.items[id].name), mats, equip: Object.fromEntries(Object.entries(p.equip).map(([sl, i]) => [sl, i.name])) };
};
const questCard = (p, q) => { // one quest as the pop-up shows it
  const st = D.qState(p, q), g = D.Q.NPCS[q.giver], r = D.rooms.get(g.room), pre = q.after && !p.qdone.has(q.after) ? ((D.qDef(q.after) || {}).name || '') : '';
  return { id: q.id, name: q.name, lvl: q.min, text: q.text, st, xp: D.qXp(p, q), gold: q.rew.gold || 0, qp: q.rew.qp || 0, items: (q.rew.items || []).map((id) => (D.W.items[id] ? D.W.items[id].name : id)), reqs: q.obj.map((o, i) => ({ t: D.objText(o), cur: st === 'active' || st === 'ready' ? D.qCur(p, q, i) : 0, need: D.qNeed(o) })), giver: g.name, gid: q.giver, where: r ? r.name : '', here: p.env.inv.some((o) => o.npcId === q.giver), after: pre, rep: !!q.repeat };
};
D.sendOffer = (p) => { // the quest pop-up: from `talk <npc>` (that NPC's quests) or `board` (every quest open to you). Accept buttons send `accept <id>`; it refreshes after each one.
  const o = p.offer; if (!o) return; let quests, title, who, hi = '', pic = '';
  if (o.kind === 'npc') { const n = p.env.inv.find((x) => x.isNpc && x.npcId === o.npc); if (!n) { p.offer = null; return p.send({ t: 'offer', close: 1 }); } quests = D.Q.QUESTS.filter((q) => q.giver === o.npc && D.qState(p, q) !== 'done'); title = n.name; who = n.name; hi = n.def.hi || ''; pic = (D.portraitFor && D.portraitFor(o.npc)) || ''; }
  else { quests = D.Q.QUESTS.filter((q) => D.qState(p, q) === 'avail'); title = 'Contract board'; who = "Adventurers' Guild contracts"; hi = 'Every contract open to you right now. Talk to the giver to hand a finished one in.'; }
  if (!quests.length) { p.offer = null; return p.send({ t: 'offer', close: 1 }); }
  p.send({ t: 'offer', title, who, hi, pic, board: o.kind === 'board', quests: quests.map((q) => questCard(p, q)) });
};
const label = (p, it) => it.short + (worn(p, it) ? (it.type === 'weapon' ? ' (wielded)' : ' (worn)') : '');
const health = (o) => { const r = o.hp / o.maxhp; return r > 0.9 ? 'in perfect health' : r > 0.6 ? 'lightly wounded' : r > 0.3 ? 'badly hurt' : 'near death'; };

function walkSteps(p, steps, label) { // walks single steps one at a time; typing another command, a fight or a blocked exit stops it (speedwalk and the map's click-to-run use this)
  if (p.enemy) return p.msg('You cannot run while fighting.', 'hurt'); const tok = {}; let i = 0; p.swTok = tok;
  p.msg(`${label} (${steps.length} step${steps.length > 1 ? 's' : ''}). Type speedwalk stop to cancel.`, 'sys');
  const step = () => {
    if (p.swTok !== tok || p.gone) return; if (p.enemy) { p.swTok = null; return p.msg(`Interrupted by a fight after ${i} step${i === 1 ? '' : 's'}.`, 'hurt'); }
    if (i >= steps.length) { p.swTok = null; return p.msg('You arrive.', 'win'); }
    const before = p.env; p.swRunning = true; try { D.command(p, steps[i]); } finally { p.swRunning = false; }
    if (p.env === before) { p.swTok = null; return p.msg(`Stopped at step ${i + 1} (${steps[i]}): you could not go that way.`, 'hurt'); } i++; D.callOut(step, 250);
  };
  step();
}
D.pathDirs = (from, to) => { // the list of single directions from one room to another (locked doors and portals are not used), or null
  const prev = { [from]: null }, q = [from]; while (q.length) { const c = q.shift(); for (const [d, n] of Object.entries(D.rooms.get(c).exits)) { const r = D.rooms.get(n); if (!r || n in prev || (r.def.locked && !r.unlocked)) continue; prev[n] = [c, d]; if (n === to) { const out = []; let k = n; while (prev[k]) { out.unshift(prev[k][1]); k = prev[k][0]; } return out; } q.push(n); } } return null;
};
function go(p, d) {
  let to = p.env.exits[d]; if (!to && d === 'out') { const ex = Object.entries(p.env.exits); if (ex.length === 1) [d, to] = ex[0]; } // `out` leaves a room that has only one way out
  if (!to) return p.msg(d === 'out' ? 'There is no single way out of here: pick a direction.' : 'You cannot go that way.');
  if (p.enemy) return p.msg('You are fighting! Try to flee.', 'hurt');
  if (p.bj) D.blackjack.forfeit(p);
  const dest = D.rooms.get(to); if (!dest) return p.msg('The way is blocked.');
  if (dest.def.locked && !dest.unlocked) return p.msg('The vault door is locked tight. You need the bank vault key (the Bank Manager carries it), then `unlock vault`.');
  p.env.tell(`${p.name} leaves ${DIRS[d]}.`, p); p.enter(dest, true); dest.tell(`${p.name} arrives.`, p); dest.look(p);
}

const C = {
  look(p, a) {
    if (!a) return p.env.look(p, true);
    const t = find(p.env.inv, a.replace(/^at\s+/, '')) || find(p.inv, a.replace(/^at\s+/, ''));
    if (!t) return p.msg("You don't see that here.");
    p.msg(t.long); if (t.isLiving) p.msg(`${cap(t.the())} is ${health(t)}.`);
  },
  go: (p, a) => go(p, FULL[a] || a),
  kill(p, a) {
    let t;
    if (!a.trim()) { // autokill on: a bare `kill` attacks the first monster in the room
      if (!p.autokill) return p.msg('Kill what? (Type `autokill on` and a bare `kill` attacks the first monster in the room.)');
      t = p.env.inv.find((o) => o.isLiving && !o.isPlayer && o.hp > 0); if (!t) return p.msg('There is nothing here to kill.');
    } else t = find(p.env.inv.filter((o) => o.isLiving && o !== p), a);
    if (!t) return p.msg('No such target here.');
    if (t.isPlayer) return p.msg('Player combat is disabled.'); if (!p.engage(t)) return p.msg('The innkeeper glares. No fighting here.');
    p.sendPortrait(t.name, 'mob_' + t.mobId); p.msg(`You attack ${t.the()}!`, 'combat'); p.env.tell(`${p.name} attacks ${t.the()}!`, p, 'combat2'); if (!t.enemy) t.engage(p); p.fight(t);
  },
  flee(p) {
    if (!p.enemy) return p.msg('You are not fighting.');
    const exits = Object.entries(p.env.exits); if (Math.random() < 0.35 || !exits.length) return p.msg('You fail to get away!', 'hurt');
    const [d] = exits[D.rnd(0, exits.length - 1)]; p.enemy = null; p.msg('You flee in panic!', 'sys'); go(p, d);
  },
  get(p, a) {
    if (!a) return p.msg('Get what?');
    const list = a === 'all' ? p.env.inv.filter((o) => !o.isLiving && !o.isNpc && !o.fixed) : [find(p.env.inv.filter((o) => !o.isLiving && !o.isNpc), a)];
    if (!list[0]) return p.msg(a === 'all' ? 'Nothing to take.' : "You don't see that here.");
    for (const it of list) { if (it.fixed) { p.msg("You can't take that."); continue; } const where = D.takeFloor(p, it); if (!where) return p.msg('Your pack and bag of holding are full.'); p.msg(`You take ${it.short}${where === 'bag' ? ' (into your bag of holding)' : ''}.`); }
  },
  drop(p, a) {
    const it = find(p.inv, a); if (!it && BOUND.test(a.trim())) return p.msg('Your bag of holding and tools are bound to you: they cannot be dropped or sold.', 'sys'); if (!it) return p.msg("You don't have that.");
    if (worn(p, it)) { for (const k of Object.keys(p.equip)) if (p.equip[k] === it) delete p.equip[k]; }
    it.move(p.env); p.msg(`You drop ${it.short}.`);
  },
  inventory(p) { // every equipment slot and what is in it, then the pack. `eq` and `equipment` do the same.
    const SL = [['weapon', 'Weapon (wielded)'], ['head', 'Head'], ['body', 'Body'], ['shield', 'Shield'], ['feet', 'Feet']];
    p.msg(`Equipment (armor class ${p.ac()}):`, 'rname');
    for (const [s, name] of SL) { const it = p.equip[s]; p.msg(`  ${name.padEnd(17)}: ${it ? it.name + (s === 'weapon' ? ` (damage ${it.dmg[0]}-${it.dmg[1]})` : it.def.ac ? ` (armor ${it.def.ac})` : '') + (it.kept ? ' [kept]' : '') : '(nothing)'}`, it ? 'items' : 'sys'); }
    for (const [s, it] of Object.entries(p.equip)) if (!SL.some(([k]) => k === s)) p.msg(`  ${s.padEnd(17)}: ${it.name}`, 'items');
    const pack = p.inv.filter((i) => !worn(p, i)), groups = new Map(); for (const it of pack) { const key = it.itemId + (it.kept ? '*' : ''); const g = groups.get(key) || { it, n: 0 }; g.n++; groups.set(key, g); }
    p.msg(`Pack (${pack.length} carried, ${p.inv.length}/${p.cap()} with what you wear):`, 'rname'); p.msg(groups.size ? '  ' + [...groups.values()].map((g) => `${g.it.short}${g.n > 1 ? ' x' + g.n : ''}${g.it.kept ? ' [kept]' : ''}`).join(', ') + '.' : '  nothing.', 'items');
    p.msg(`Credits: ${p.gold}. Bag of holding: ${D.bagUsed(p)}/${D.bagCap(p)} (type \`bag\`). Tools: type \`tools\`. [kept] items are protected from sell and salvage (\`keep\`, \`unkeep\`).`, 'sys');
  },
  keep(p, a) { // keep <item>: protect it from sell, rsell, salvage and auction; keep (no argument) lists what is kept
    const q = a.trim().toLowerCase(), bagMatch = (id) => { const d = D.W.items[id], n = d.name.toLowerCase(); return n === q || n.includes(q) || (d.ids || []).includes(q); };
    if (!q || q === 'list') { const k = p.inv.filter((i) => i.kept).map((i) => i.short), b = Object.keys(p.keepBag).filter((id) => D.W.items[id]).map((id) => D.W.items[id].name + ' (bag)'); return p.msg(k.length || b.length ? `Marked to keep (never sold or salvaged): ${[...k, ...b].join(', ')}.` : 'Nothing is marked to keep. Type `keep <item>` to protect an item from sell and salvage.', 'sys'); }
    const it = p.inv.find((i) => i.isId(q) && !i.kept && !worn(p, i)) || p.inv.find((i) => i.isId(q) && !i.kept); if (it) { it.kept = true; return p.msg(`You mark ${it.short} to keep. It will not be sold, salvaged or auctioned until you \`unkeep\` it.`, 'win'); }
    const id = Object.keys(p.bag).find((i) => D.W.items[i] && bagMatch(i) && !p.keepBag[i]); if (id) { p.keepBag[id] = 1; return p.msg(`You mark all your ${D.W.items[id].name} in the bag to keep.`, 'win'); }
    p.msg(p.inv.some((i) => i.isId(q) && i.kept) ? 'That is already marked to keep.' : "You don't have that.");
  },
  unkeep(p, a) { // unkeep <item> | unkeep all
    const q = a.trim().toLowerCase(); if (!q) return p.msg('Unkeep what? Type `keep` to see what is marked.');
    if (q === 'all') { let n = 0; for (const i of p.inv) if (i.kept) { i.kept = false; n++; } n += Object.keys(p.keepBag).length; p.keepBag = {}; return p.msg(n ? `${n} item${n === 1 ? '' : 's'} can be sold or salvaged again.` : 'Nothing was marked to keep.', 'sys'); }
    const it = p.inv.find((i) => i.isId(q) && i.kept); if (it) { it.kept = false; return p.msg(`${cap(it.short)} can be sold or salvaged again.`, 'sys'); }
    const id = Object.keys(p.keepBag).find((i) => { const d = D.W.items[i]; return d && (d.name.toLowerCase().includes(q) || (d.ids || []).includes(q)); }); if (id) { delete p.keepBag[id]; return p.msg(`Your ${D.W.items[id].name} in the bag can be sold or salvaged again.`, 'sys'); }
    p.msg("You aren't keeping that.");
  },
  autokill(p, a) { // autokill on | off: a bare `kill` attacks the first monster in the room
    const v = a.trim().toLowerCase(); if (v === 'on') p.autokill = true; else if (v === 'off') p.autokill = false; else if (v) return p.msg('Usage: autokill on | autokill off');
    p.msg(v ? (p.autokill ? 'Autokill is ON: typing `kill` by itself attacks the first monster in the room.' : 'Autokill is OFF: `kill` needs a target again.') : `Autokill is ${p.autokill ? 'ON' : 'OFF'}. Type \`autokill on\` or \`autokill off\`.`, 'sys');
  },
  check(p, a) { // check <item>: weapon class or armor class of a piece of equipment
    const q = a.trim().toLowerCase(); if (!q) return p.msg('Check what? Type `check <item>` to see a weapon\'s weapon class or an armor\'s armor class.');
    const inst = p.inv.find((i) => i.isId(q)) || p.env.inv.find((o) => !o.isLiving && !o.isNpc && o.isId && o.isId(q)); let def = inst && inst.def, name = inst && inst.name;
    if (!def) { const id = Object.keys(p.bag).find((i) => { const d = D.W.items[i]; return d && (d.name.toLowerCase().includes(q) || (d.ids || []).includes(q)); }); if (id) { def = D.W.items[id]; name = def.name; } }
    if (!def) return p.msg("You don't have that, and it isn't here.");
    if (def.type !== 'weapon' && def.type !== 'armor') return p.msg("This isn't a piece of equipment.");
    const lvl = def.lvl || 1, need = lvl > p.level ? ` You need level ${lvl} to use it (you are level ${p.level}).` : ` Requires level ${lvl}.`, using = inst && Object.values(p.equip).includes(inst), bonus = def.bonus ? ` Bonus: ${[def.bonus.pool ? `+${def.bonus.pool} attack dice` : '', def.bonus.dmg ? `+${def.bonus.dmg} damage` : ''].filter(Boolean).join(', ')}.` : '', f1 = (n) => (n > 0 ? '+' : '') + n.toFixed(1).replace(/\.0$/, '');
    if (def.type === 'weapon') {
      const dm = (inst && inst.dmg) || def.dmg, avg = (dm[0] + dm[1]) / 2, cur = p.equip.weapon, ca = cur ? (cur.dmg[0] + cur.dmg[1]) / 2 : 0, up = inst && inst.up ? ` Upgraded +${inst.up} of ${UPMAX}.` : '';
      p.msg(`${cap(name)}: weapon class ${dm[0]}-${dm[1]} damage (average ${avg}).${up}${need}${bonus}${using ? ' You are wielding it.' : cur ? ` Compared with your ${cur.name} (${cur.dmg[0]}-${cur.dmg[1]}): ${f1(avg - ca)} average damage.` : ' You are wielding nothing.'}`, 'items');
    } else {
      const slot = def.slot || 'body', cur = p.equip[slot];
      p.msg(`${cap(name)}: armor class ${def.ac || 0}, worn on the ${slot}.${need}${bonus}${using ? ' You are wearing it.' : cur ? ` Compared with your ${cur.name} (armor ${cur.def.ac || 0}): ${f1((def.ac || 0) - (cur.def.ac || 0))} armor class.` : ` Nothing is worn on your ${slot}.`}`, 'items');
    }
  },
  idea(p, a) { require('./reports').submit(p, 'idea', a); },
  bug(p, a) { require('./reports').submit(p, 'bug', a); },
  brief(p, a) { // brief on | brief off: moving shows only the room name and exits
    const v = a.trim().toLowerCase(); if (v === 'on') p.brief = true; else if (v === 'off') p.brief = false; else if (v) return p.msg('Usage: brief on | brief off');
    p.msg(v ? (p.brief ? 'Brief mode is ON: moving leaves out the long room description (the room name, exits, items, resources and who is here still show). Type `look` for the full description.' : 'Brief mode is OFF: you see full room descriptions again.') : `Brief mode is ${p.brief ? 'ON' : 'OFF'}. Type \`brief on\` or \`brief off\`.`, 'sys');
  },
  email(p, a) { // email <address> | email clear | email hide | email show
    const v = a.trim(); if (!v) return p.msg(p.email ? `Your email is ${p.email}, ${p.emailHidden ? 'hidden from finger' : 'shown to anyone who fingers you'}. \`email clear\` removes it, \`email hide\` or \`email show\` controls finger.` : 'You have no email set. Type `email you@example.com`. Anyone can see it with `finger <you>` unless you type `email hide`.');
    if (/^clear$/i.test(v)) return D.setEmail(p, ''); if (/^hide$/i.test(v)) return D.hideEmail(p, true); if (/^show$/i.test(v)) return D.hideEmail(p, false); D.setEmail(p, v);
  },
  finger(p, a) { // finger <name>: name, level, picture and email (if they set one and did not hide it)
    const q = (a.trim() || p.name).toLowerCase(), all = [...D.players.values()], on = all.find((o) => o.name.toLowerCase() === q) || all.find((o) => o.name.toLowerCase().startsWith(q));
    let d; if (on) d = { name: on.name, pre: D.preTitle(on), title: on.title || '', lv: on.level, rm: on.remort || 0, cn: on.klass().name, ic: on.klass().icon, gl: D.genderLabel(on.gender), pic: D.playerPic(on), email: on.emailHidden ? '' : on.email, hid: !!(on.email && on.emailHidden), online: true, bot: !!on.isBot };
    else { const r = /^[a-z]{2,16}$/i.test(q) ? D.fingerRec(q) : null; if (!r) return p.msg(`Nobody called "${a.trim()}" has played here.`); const k = D.K.CLASSES[r.cls] || D.K.CLASSES.barbarian; d = { name: r.name, pre: D.preTitle({ name: r.name }), title: D.cleanTitle(r.title), lv: r.level || 1, rm: r.remort || 0, cn: k.name, ic: k.icon, gl: D.genderLabel(r.gender), pic: D.playerPic({ name: r.name, cls: r.cls, gender: r.gender }), email: r.emailHidden ? '' : D.cleanEmail(r.email), hid: !!(r.email && r.emailHidden), online: false, seen: r.seen || 0 }; }
    const seen = d.online ? 'online now' : d.seen ? `last seen ${new Date(d.seen).toISOString().slice(0, 16).replace('T', ' ')} UTC` : 'not online';
    p.msg(`Finger: ${[d.pre, d.name].filter(Boolean).join(' ')}${d.title ? ', ' + d.title : ''}`, 'rname'); p.msg(`  Level ${d.lv}${d.rm ? ` (Remort ${d.rm})` : ''} ${d.cn} (${d.gl}), ${seen}.`, 'sys'); p.msg(`  Email: ${d.email || (d.hid ? 'hidden' : 'none given')}`, 'sys'); p.send({ t: 'finger', d });
  },
  wield(p, a) { const it = find(p.inv, a); if (!it || it.type !== 'weapon') return p.msg('You cannot wield that.'); if (it.def.lvl > p.level) return p.msg(`You need level ${it.def.lvl} to wield that.`); p.equip.weapon = it; p.msg(`You wield ${it.short}.`); },
  wear(p, a) { const it = find(p.inv, a); if (!it || it.type !== 'armor') return p.msg('You cannot wear that.'); if (it.def.lvl > p.level) return p.msg(`You need level ${it.def.lvl} to wear that.`); p.equip[it.slot] = it; p.msg(`You wear ${it.short}.`); },
  remove(p, a) { const e = Object.entries(p.equip).find(([, i]) => i.isId(a || '')); if (!e) return p.msg('You are not using that.'); delete p.equip[e[0]]; p.msg(`You remove ${e[1].short}.`); },
  quaff(p, a) {
    let it;
    if (!a.trim()) { // eat / quaff / the HEAL button with no item: the healing item that fits best (pack first, then the bag)
      const need = p.maxhp - p.hp; if (need <= 0) return p.msg('You are already at full health.');
      const cands = [...p.inv.filter((i) => i.type === 'potion' && !i.def.smoke && (i.def.heal || 0) > 0).map((i) => ({ h: i.def.heal, it: i })), ...Object.keys(p.bag).filter((id) => D.W.items[id] && D.W.items[id].type === 'potion' && !D.W.items[id].smoke && (D.W.items[id].heal || 0) > 0 && p.bag[id] > 0).map((id) => ({ h: D.W.items[id].heal, id }))];
      if (!cands.length) return p.msg(p.inv.some((i) => i.def.smoke) ? 'You have nothing to eat or drink that heals, but you do have cigarillos: type `smoke`.' : 'You have nothing to eat or drink that heals.');
      const fit = cands.filter((c) => c.h >= need).sort((x, y) => x.h - y.h)[0] || cands.sort((x, y) => y.h - x.h)[0];
      if (fit.it) it = fit.it; else { p.bag[fit.id]--; if (p.bag[fit.id] <= 0) delete p.bag[fit.id]; it = D.cloneItem(fit.id); }
    } else { it = find(p.inv.filter((i) => i.type === 'potion'), a); if (!it) return p.msg('You have nothing to drink.'); if (it.def.smoke) return C.smoke(p, a); }
    const h = Math.min(it.def.heal || 0, p.maxhp - p.hp), m = Math.min(it.def.mana || 0, p.maxmp - p.mp); p.hp += h; p.mp += m;
    p.msg(`You quaff ${it.short}${h ? ` and recover ${h} hit points` : ''}${m ? ` and ${m} ${p.cls === 'scavenger' ? 'stamina' : 'mana'}` : ''}.`, 'win'); it.destroy();
    if (it.def.buff) { p.addFx({ k: 'buff', n: it.name, ...it.def.buff, src: p }); p.msg(`The ${it.name} gives you a boost for a while.`, 'win'); }
  },
  smoke(p, a) { // smoke [item]: light a cigarillo (dropped by Old West bosses) to heal
    const q = a.trim().toLowerCase(), pool = p.inv.filter((i) => i.def.smoke); let it = q ? find(pool, q) : pool[0];
    if (!it) { const id = Object.keys(p.bag).find((i) => D.W.items[i] && D.W.items[i].smoke && p.bag[i] > 0 && (!q || (D.W.items[i].ids || []).includes(q))); if (id) { p.bag[id]--; if (p.bag[id] <= 0) delete p.bag[id]; it = D.cloneItem(id); } }
    if (!it) return p.msg('You have nothing to smoke. The bosses of the Old West sometimes carry cigarillos.');
    if (p.hp >= p.maxhp) { if (!pool.includes(it)) { p.bag[it.itemId] = (p.bag[it.itemId] || 0) + 1; it.destroy(); } return p.msg('You are in perfect health. Save it for later.'); }
    const h = Math.min(it.def.heal || 0, p.maxhp - p.hp); p.hp += h; it.destroy(); p.msg(`You light ${it.short} and take a long, slow drag. Smoke curls into the air, the aches fade and you recover ${h} hit points. (Ironic, we know.)`, 'win'); p.env.tell(`${p.name} lights a cigarillo and exhales a thin cloud of smoke.`, p);
  },
  enter(p, a) { // enter portal / enter <doorway object>
    for (const o of p.env.inv) if (o.actions && o.actions.enter && o.actions.enter(p, a, o)) return;
    p.msg(p.env.inv.some((o) => o.actions && o.actions.enter) ? 'Enter what?' : 'There is nothing here to enter.');
  },
  upgrade(p, a) { // upgrade [weapon] [confirm]: +1 damage tier per upgrade, at a forge, for a lot of credits
    const args = a.trim().split(/\s+/).filter(Boolean), confirm = args.length && args[args.length - 1].toLowerCase() === 'confirm', q = (confirm ? args.slice(0, -1) : args).join(' ').toLowerCase();
    const it = q ? p.inv.find((i) => i.type === 'weapon' && i.isId(q)) : p.equip.weapon; if (!it) return p.msg(q ? "You don't have that weapon." : 'You are not wielding a weapon. `upgrade <weapon>` names one from your pack.');
    const up = it.up || 0; if (up >= UPMAX) return p.msg(`${cap(it.name)} is fully upgraded (+${UPMAX}).`, 'sys');
    const cost = upCost(it.def, up), nd = D.upDmg(it, up + 1), now = it.dmg;
    if (!p.env.def.forge) return p.msg(`Upgrades are done at a forge (Brann's Smithy, south of Ashfall Square). ${cap(it.name)} would cost ${cost.toLocaleString('en-US')} credits to go from +${up} to +${up + 1} (damage ${now[0]}-${now[1]} to ${nd[0]}-${nd[1]}).`, 'sys');
    if (!confirm) return p.msg(`Upgrade ${it.name} from +${up} to +${up + 1}? Damage ${now[0]}-${now[1]} becomes ${nd[0]}-${nd[1]} for ${cost.toLocaleString('en-US')} credits (you have ${p.gold.toLocaleString('en-US')}; each upgrade costs 1.75 times the last, up to +${UPMAX}). Type \`upgrade ${q ? q + ' ' : ''}confirm\` to do it.`, 'sys');
    if (p.gold < cost) return p.msg(`You need ${cost.toLocaleString('en-US')} credits for that upgrade and you have ${p.gold.toLocaleString('en-US')}.`, 'hurt');
    p.gold -= cost; it.up = up + 1; D.applyUp(it); p.msg(`Brann's hammer rings, and the blade comes back brighter. ${cap(it.name)}: damage ${it.dmg[0]}-${it.dmg[1]}. (${cost.toLocaleString('en-US')} credits.)`, 'win'); p.sendStats && p.sendStats();
  },
  runto(p, a) { // runto <room id>: used by the map (click a room to run there)
    const to = a.trim(), dest = D.rooms.get(to); if (!dest) return p.msg('No such room.'); if (to === p.env.path) return p.msg('You are already here.', 'sys'); if (dest.area !== p.env.area) return p.msg('That room is in another area. Use the exits, `travel` or `recall`.', 'sys'); if (p.visited && p.visited.has && !p.visited.has(to)) return p.msg('You have not explored that room yet.', 'sys');
    const steps = D.pathDirs(p.env.path, to); if (!steps) return p.msg('You cannot find a way there from here.'); if (steps.length > 80) return p.msg('That is too far to run in one go.'); walkSteps(p, steps, `Running to ${dest.name}`);
  },
  list(p) {
    if (p.env.def.clinic) return C.clinicList(p);
    const sh = p.env.def.shop; if (!sh) return p.msg('There is no shop here.');
    p.msg(`${p.env.name}. You have ${p.gold} credits.`, 'rname'); p.msg(p.env.def.exchange ? 'The Exchange pays 60% of value for gathered materials. Type `sell materials`.' : 'We also buy gathered materials (ore, herbs, fish...). Type `sell materials`.', 'sys');
    for (const id of sh.stock) { const d = D.W.items[id]; const st = d.dmg ? `damage ${d.dmg[0]}-${d.dmg[1]}` : d.ac ? `armor ${d.ac}` : d.heal ? `heals ${d.heal}` : d.mana ? `restores ${d.mana} mana` : '';
      p.msg(`  ${d.name.padEnd(22)} ${String(d.value).padStart(6)}c  ${st}${d.lvl ? ` (level ${d.lvl})` : ''}`, p.gold >= d.value ? 'spell' : 'sys'); }
  },
  buy(p, a) {
    const sh = p.env.def.shop; if (!sh) return p.msg('There is no shop here.');
    const m = a.trim().match(/^(\d+)\s+(.+)$/), n = m ? Math.min(+m[1], 20) : 1, w = (m ? m[2] : a).trim().toLowerCase(); if (!w) return p.msg('Buy what? (see `list`)');
    const id = sh.stock.find((i) => { const d = D.W.items[i]; return i === w || d.name.toLowerCase() === w || d.name.toLowerCase().split(' ').includes(w) || (d.ids || []).includes(w); });
    if (!id) return p.msg("That isn't for sale here."); const d = D.W.items[id]; let bought = 0;
    for (let i = 0; i < n; i++) { if (p.gold < d.value) { p.msg('You cannot afford that.'); break; } if (p.inv.length >= p.cap() && (p.bagMode === 'off' || D.bagUsed(p) >= D.bagCap(p))) { p.msg('Your pack and bag are full.'); break; } p.gold -= d.value; D.give(p, id, 'normal'); bought++; }
    if (bought) p.msg(`You buy ${bought} x ${d.name} for ${bought * d.value} credits.`, 'win');
  },
  sell(p, a) {
    if (!p.env.def.shop) return p.msg('Nobody here will buy your things.');
    const arg = a.trim(), sellable = (i) => !worn(p, i) && !i.kept && sellPrice(p, i) > 0, whole = arg === 'all' || arg === 'materials';
    const items = arg === 'all' ? p.inv.filter((i) => sellable(i) && i.type !== 'potion') : arg === 'materials' ? p.inv.filter((i) => i.type === 'material' && !i.kept) : whole ? [] : [find(p.inv, arg)];
    let total = 0, n = 0;
    if (!whole && !items[0]) return p.msg(BOUND.test(arg) ? 'Your bag of holding and tools are bound to you: they cannot be dropped or sold.' : "You don't have that.");
    for (const it of items) { if (worn(p, it)) { p.msg('Unequip that first.'); continue; } if (it.kept) { p.msg(`${cap(it.short)} is marked to keep. Type \`unkeep\` first.`); continue; } const pr = sellPrice(p, it); if (!pr) { p.msg(`The shopkeeper has no interest in ${it.short}.`); continue; } total += pr; n++; it.destroy(); }
    if (whole) for (const [id, c] of Object.entries(p.bag)) { const d = D.W.items[id]; if (!d) { delete p.bag[id]; continue; } if ((arg === 'materials' && d.type !== 'material') || d.type === 'potion' || p.keepBag[id]) continue; const pr = priceOf(p, d); if (pr > 0) { total += pr * c; n += c; delete p.bag[id]; } } // the bag sells too
    if (whole && !n) return p.msg(arg === 'materials' ? 'You have no gathered materials to sell (pack or bag).' : 'Nothing worth selling.');
    if (n) { p.gold += total; p.msg(`You sell ${n} item${n > 1 ? 's' : ''} for ${total} credits.${p.env.def.exchange ? ' (The Exchange pays 60% for materials.)' : ''}`, 'win'); }
  },
  value(p, a) { const it = find(p.inv, a); if (!it) return p.msg("You don't have that."); p.msg(`${cap(it.short)} is worth ${sellPrice(p, it)} credits to a shopkeeper here${it.type === 'material' && !p.env.def.exchange ? ' (the Salvage Exchange in Ashfall pays 50% more for materials)' : ''}.`); },
  tools: (p) => D.toolsList(p),
  bag(p, a) {
    const [sub, ...rest] = a.trim().split(/\s+/), arg = rest.join(' ').trim(), room = () => D.bagCap(p) - D.bagUsed(p);
    if (!sub || sub === 'list') {
      p.msg(`Bag of holding: ${D.bagUsed(p)}/${D.bagCap(p)} items (base 60, +20 for each of your ${p.remort || 0} remorts). Mode: ${p.bagMode}.`, 'rname');
      const groups = { Materials: [], 'Weapons and armor': [], Other: [] };
      for (const [id, c] of Object.entries(p.bag)) { const d = D.W.items[id]; groups[d.type === 'material' ? 'Materials' : ['weapon', 'armor'].includes(d.type) ? 'Weapons and armor' : 'Other'].push(`${c} ${d.name}`); }
      for (const [g, l] of Object.entries(groups)) if (l.length) p.msg(`${g}: ${l.join(', ')}.`, 'items');
      if (!D.bagUsed(p)) p.msg('It is empty. Gathered materials and looted gear go in automatically.', 'sys');
      return p.msg('Commands: bag put <item|all|materials|gear>, bag get <item> [n|all], bag sell [materials|all], bag auto loot|overflow|off. Crafting and salvaging use bag contents. The bag is bound to you and cannot be dropped or sold.', 'sys');
    }
    if (sub === 'auto') { if (!['loot', 'overflow', 'off'].includes(arg)) return p.msg(`Bag mode is "${p.bagMode}". Use: bag auto loot (gathered materials and looted gear go straight in), overflow (only when your pack is full) or off.`); p.bagMode = arg; return p.msg(`Bag mode: ${arg}.`, 'win'); }
    if (sub === 'put') {
      const movable = (i) => !worn(p, i) && i.type !== 'potion', items = arg === 'all' ? p.inv.filter(movable) : arg === 'materials' ? p.inv.filter((i) => i.type === 'material') : arg === 'gear' ? p.inv.filter((i) => movable(i) && ['weapon', 'armor'].includes(i.type)) : [find(p.inv, arg)];
      if (!arg || !items[0]) return p.msg(arg ? "You don't have that." : 'Put what? (an item, or all, materials, gear)');
      let n = 0; for (const it of items) { if (worn(p, it)) { p.msg('Unequip that first.'); continue; } if (room() <= 0) { p.msg('Your bag of holding is full.'); break; } p.bag[it.itemId] = (p.bag[it.itemId] || 0) + 1; it.destroy(); n++; }
      return n && p.msg(`You put ${n} item${n > 1 ? 's' : ''} into your bag of holding (${D.bagUsed(p)}/${D.bagCap(p)}).`, 'win');
    }
    if (sub === 'get' || sub === 'take') {
      const m = arg.match(/^(.*?)(?:\s+(\d+|all))?$/), id = bagFind(p, (m[1] || '').trim()); if (!id) return p.msg("That isn't in your bag.");
      let n = m[2] === 'all' ? p.bag[id] : Math.min(+m[2] || 1, p.bag[id]), got = 0;
      while (n-- > 0 && p.inv.length < p.cap()) { D.cloneItem(id).move(p); p.bag[id]--; got++; } if (p.bag[id] <= 0) delete p.bag[id];
      return p.msg(got ? `You take ${got} ${D.W.items[id].name} out of the bag.` : 'Your pack is full.', got ? 'win' : 'sys');
    }
    if (sub === 'sell') return C.sell(p, arg === 'materials' ? 'materials' : 'all');
    p.msg('Try: bag, bag put, bag get, bag sell, bag auto.');
  },
  recall(p) {
    if (p.enemy) return p.msg('You cannot recall while you are fighting!', 'hurt');
    if (p.fx.some((e) => e.k === 'stun')) return p.msg('You are stunned!');
    const dest = D.rooms.get(D.W.start); if (p.env === dest) return p.msg('You are already at the starting square.');
    p.env.tell(`${p.name} vanishes in a flash of light.`, p); p.msg('The world blurs, and you find yourself back where you began.', 'sys');
    p.enter(dest, true); dest.tell(`${p.name} appears in a flash of light.`, p); dest.look(p);
  },
  tradeskills: (p, a) => D.tradeSkills(p, a), learn: (p, a) => D.learnSkill(p, a), unlearn: (p, a) => D.unlearnSkill(p, a),
  forage(p) { if (p.skills.foraging) return D.tradeGather(p, 'foraging'); if (p.cls === 'scavenger') return D.cast(p, 'forage'); D.tradeGather(p, 'foraging'); },
  mine(p) { if (p.skills.mining) return D.tradeGather(p, 'mining'); if (p.cls === 'scavenger') return D.cast(p, 'prospect'); D.tradeGather(p, 'mining'); },
  fish(p) { if (p.skills.fishing) return D.tradeGather(p, 'fishing'); if (p.cls === 'scavenger') return D.cast(p, 'cast_line'); D.tradeGather(p, 'fishing'); },
  smith: (p, a) => D.tradeCraft(p, 'smithing', a), brew: (p, a) => D.tradeCraft(p, 'brewing', a), cook: (p, a) => D.tradeCraft(p, 'cooking', a), salvage: (p, a) => D.salvage(p, a),
  pray(p) {
    if (!p.env.def.healer) return p.msg('There is no healer here. The Temple of the Dawn clinic in Ashfall will heal you.');
    const cost = p.level <= 15 ? 0 : (p.level - 15) * 10; if (p.gold < cost) return p.msg(`The doc asks for ${cost} credits. You have ${p.gold}.`);
    p.gold -= cost; p.hp = p.maxhp; p.mp = p.maxmp; p.luck = p.maxLuck(); p.fx = p.fx.filter((e) => e.k === 'buff' || e.k === 'summon');
    p.msg(`Warm light and a clean-smelling mist wash over you. You are fully healed and refreshed, and your Luck is restored.${cost ? ` (paid ${cost} credits)` : ''}`, 'win');
  },
  talk(p, a) {
    const npcs = p.env.inv.filter((o) => o.isNpc), n = a.trim() ? npcs.find((o) => o.isId(a.trim())) : npcs[0];
    if (!n) return p.msg(npcs.length ? "They aren't here." : 'There is nobody to talk to here.');
    p.sendPortrait(n.name, n.npcId); p.msg(`${n.name} says: "${n.def.hi || 'Well met, traveler.'}"`, 'say'); D.qEvent(p, 'talk', n.npcId); let any = false;
    for (const q of D.Q.QUESTS.filter((x) => x.giver === n.npcId)) {
      const st = D.qState(p, q);
      if (st === 'ready') { D.qComplete(p, q); any = true; }
      else if (st === 'active') { p.msg(`"${q.name}" is still in progress: ${q.obj.map((o, i) => `${D.objText(o)} (${D.qCur(p, q, i)}/${D.qNeed(o)})`).join('; ')}.`, 'quest'); any = true; }
      else if (st === 'avail') { p.msg(`Quest available: ${q.name} (level ${q.min}, ${D.qXp(p, q)} XP, ${q.rew.qp} quest point${q.rew.qp > 1 ? 's' : ''})  [accept ${q.id}]`, 'quest'); p.msg(`  "${q.text}"`, 'say'); any = true; }
    }
    if (!any) p.msg('"I have nothing more for you right now."', 'say');
    p.offer = { kind: 'npc', npc: n.npcId }; D.sendOffer(p); // a pop-up with an Accept button for each quest
  },
  accept(p, a) {
    const key = a.trim().toLowerCase(), q = D.Q.QUESTS.find((x) => p.env.inv.some((o) => o.npcId === x.giver) && (x.id === key || x.id === 'q_' + key || x.name.toLowerCase().startsWith(key)));
    if (!key || !q) return p.msg("Nobody here offers that. Try `talk <person>` to see what they have.");
    const st = D.qState(p, q); if (st !== 'avail') return p.msg(st === 'done' ? 'You have already done that.' : st === 'locked' ? 'You are not ready for that quest yet.' : 'You already accepted it.');
    p.quests[q.id] = { prog: [] }; p.msg(`Quest accepted: ${q.name}`, 'win'); for (const o of q.obj) p.msg(`  - ${D.objText(o)}`, 'quest'); p.sendQuests(); D.sendOffer(p);
  },
  quests(p, a) {
    if (/^all|board$/.test(a.trim())) return C.board(p, '');
    const act = D.Q.QUESTS.filter((q) => p.quests[q.id]); p.msg(`Quest points: ${p.qp}/${D.qpTotal()}  (${p.qdone.size}/${D.Q.QUESTS.length} quests done)`, 'win'); p.msg(act.length ? 'Your quests:' : "You have no active quests. Type `board` at the Adventurers' Guild, or talk to people.", 'rname');
    for (const q of act) { p.msg(`${q.name}${D.qReady(p, q) ? ' (ready to turn in)' : ''}  [${D.Q.NPCS[q.giver].name}]`, 'quest'); q.obj.forEach((o, i) => p.msg(`   ${D.objText(o)}: ${D.qCur(p, q, i)}/${D.qNeed(o)}`, 'combat2')); }
  },
  board(p) {
    p.msg('Open quests for you (quest points in brackets):', 'rname'); let n = 0;
    for (const q of D.Q.QUESTS) if (D.qState(p, q) === 'avail') { n++; const g = D.Q.NPCS[q.giver], r = D.rooms.get(g.room); p.msg(`  ${q.name} (level ${q.min}, ${D.qXp(p, q)} XP, ${q.rew.qp} QP): ${g.name}, ${r ? r.name : g.room}`, 'quest'); }
    if (!n) p.msg('  Nothing right now. Reach a higher level or finish your current quests.', 'sys');
    p.offer = { kind: 'board' }; D.sendOffer(p); // the same list as a pop-up (Accept works for quests whose giver is in this room)
  },
  abandon(p, a) {
    const q = D.Q.QUESTS.find((x) => p.quests[x.id] && (x.id === a.trim() || x.id === 'q_' + a.trim() || x.name.toLowerCase().startsWith(a.trim().toLowerCase())));
    if (!q || !a.trim()) return p.msg('Abandon which quest? (see `quests`)'); delete p.quests[q.id]; p.msg(`You abandon "${q.name}".`, 'sys'); p.sendQuests();
  },
  gossip(p, a) {
    a = a.trim(); if (a === 'off') { p.gos = false; return p.msg('Gossip channel off.', 'sys'); } if (a === 'on') { p.gos = true; return p.msg('Gossip channel on.', 'sys'); }
    if (a === 'history') { p.msg('Recent gossip:', 'rname'); return D.gosLog.slice(-15).forEach((l) => p.msg('[gossip] ' + l, 'gossip')); }
    if (!a) return p.msg('Gossip what? (gossip <message>, gossip on|off|history)'); if (p.gos === false) return p.msg('Turn the channel on first: gossip on');
    const YT = /(?:https?:\/\/)?(?:www\.|m\.|music\.)?(?:youtube\.com\/(?:watch\?(?:[^\s&]*&)*v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{11})[^\s]*/i; let yt = null; const ym = a.match(YT); // a YouTube link in gossip shows the video to everyone
    if (ym) { const wait = (p.ytAt || 0) + 10000 - Date.now(); if (wait > 0) return p.msg(`Videos need a short breather: try again in ${Math.ceil(wait / 1000)}s.`, 'sys'); p.ytAt = Date.now(); yt = ym[1]; a = a.replace(ym[0], '[YouTube video]').trim(); }
    const gos = (text, o) => D.gossip(text, { ...o, yt, msg: yt ? `${o.msg !== undefined ? o.msg : text} https://youtu.be/${yt}` : o.msg });
    const G = require('./giphy'), { msg, q } = G.parse(a); // "gossip hi ;wave" adds a GIPHY GIF for "wave"
    if (q === null) return gos(`${p.name} gossips: ${a}`, { from: p.name, msg: a });
    if (!q) return p.msg('Add a search after the semicolon, e.g. gossip ;hi  or  gossip good game ;applause');
    if (!G.enabled()) { p.msg('GIFs are not set up on this server yet (the owner needs a GIPHY_API_KEY). Sending your words only.', 'sys'); return msg ? gos(`${p.name} gossips: ${msg}`, { from: p.name, msg }) : undefined; }
    const wait = (p.gifAt || 0) + G.cooldown() - Date.now(); if (wait > 0) return p.msg(`GIFs need a short breather: try again in ${Math.ceil(wait / 1000)}s.`, 'sys'); p.gifAt = Date.now();
    return G.search(q).then((g) => {
      const said = msg ? `${p.name} gossips: ${msg}  ;${q}` : `${p.name} gossips a GIF: ${q}`;
      if (!g) { p.msg(`GIPHY found nothing for "${q}".`, 'sys'); return msg ? gos(`${p.name} gossips: ${msg}`, { from: p.name, msg }) : undefined; }
      gos(said, { from: p.name, msg: `${msg ? msg + ' ' : ''}${g.url}`, gif: { url: g.url, title: g.title, q } });
    }).catch((e) => { D.log('giphy failed:', e.message); p.msg('GIPHY did not answer. Try again in a moment.', 'sys'); });
  },
  clinicList(p) {
    p.msg(`${p.env.name}. You have ${p.gold} credits. Aura ${p.aura().toFixed(1)}/6.0`, 'rname');
    for (const id of p.env.def.clinic.stock) { const d = D.W.items[id], b = Object.entries(d.bonus).map(([k, v]) => `+${v} ${k}`).join(' '), have = p.cyber.includes(id);
      p.msg(`  ${d.name.padEnd(18)} ${String(d.value).padStart(6)}c  aura -${d.aura.toFixed(1)}  ${b}  (level ${d.lvl})${d.tier > 1 ? `  upgrade of Mk ${['I', 'II', 'III', 'IV'][d.tier - 2]}` : ''}${have ? '  [installed]' : ''}`, have ? 'sys' : p.gold >= d.value && p.level >= d.lvl ? 'spell' : 'sys'); }
  },
  install(p, a) {
    const cl = p.env.def.clinic; if (!cl) return p.msg('You need a ripperdoc. Try the Chrome Clinic or the Neural Implant Lab in Ashfall.');
    const w = a.trim().toLowerCase(), id = cl.stock.find((i) => { const d = D.W.items[i]; return i === w || d.name.toLowerCase() === w || d.name.toLowerCase().split(' ').join('') === w.split(' ').join('') || (!/^mk|^[ivx]+$/.test(w) && d.name.toLowerCase().split(' ').includes(w) && !d.line); });
    if (!w || !id) return p.msg('Install what? Use the full name, e.g. `install brawn implant mk i` (see `list`).'); const d = D.W.items[id];
    if (p.cyber.includes(id)) return p.msg('You already have that installed.'); if (p.level < d.lvl) return p.msg(`That needs level ${d.lvl}.`);
    let old = null;
    if (d.line) { // implant series: upgrade in order, trading in the previous Mark for half its price
      old = p.cyber.map((i) => D.W.items[i]).find((x) => x.line === d.line);
      if (old && old.tier >= d.tier) return p.msg(`You already have an equal or better ${d.line} implant.`);
      if (d.tier > 1 && !(old && old.tier === d.tier - 1)) return p.msg(`Mk ${['I', 'II', 'III', 'IV', 'V'][d.tier - 1]} must be installed after Mk ${['I', 'II', 'III', 'IV', 'V'][d.tier - 2]}.`);
    }
    const refund = old ? Math.floor(old.value / 2) : 0, freeAura = p.aura() + (old ? old.aura : 0);
    if (p.gold + refund < d.value) return p.msg(`You cannot afford the surgery (${d.value} credits${refund ? `, minus ${refund} for trading in your old implant` : ''}).`);
    if (freeAura < d.aura) return p.msg(`Your aura (${p.aura().toFixed(1)}) cannot take another ${d.aura.toFixed(1)} of chrome. Uninstall something first.`);
    if (old) p.cyber = p.cyber.filter((i) => D.W.items[i] !== old); p.gold += refund - d.value; p.cyber.push(id); p.recalc();
    p.msg(`The doc fits your ${d.name}${old ? ` (trading in ${old.name} for ${refund} credits)` : ''}. Aura is now ${p.aura().toFixed(1)}/6.0. Max mana is ${p.maxmp}.`, 'win'); p.sendStats();
  },
  uninstall(p, a) {
    const cl = p.env.def.clinic; if (!cl) return p.msg('You need a ripperdoc for that.');
    const w = a.trim().toLowerCase(), id = p.cyber.find((i) => { const d = D.W.items[i]; return i === w || d.name === w || d.name.split(' ').includes(w); });
    if (!w || !id) return p.msg('Uninstall what? (see `cyber`)'); const d = D.W.items[id];
    p.cyber = p.cyber.filter((i) => i !== id); p.gold += Math.floor(d.value / 2); p.recalc(); p.hp = Math.min(p.hp, p.maxhp);
    p.msg(`The doc removes your ${d.name} and pays you ${Math.floor(d.value / 2)} credits. Aura is now ${p.aura().toFixed(1)}/6.0.`, 'win'); p.sendStats();
  },
  cyber(p) { p.msg(`Aura ${p.aura().toFixed(1)}/6.0. ` + (p.cyber.length ? 'Installed chrome: ' + p.cyber.map((id) => { const d = D.W.items[id]; return `${d.name} (${Object.entries(d.bonus).map(([k, v]) => `+${v} ${k}`).join(' ')})`; }).join(', ') + '.' : 'You have no chrome installed.')); },
  luck(p) { p.msg(`Luck ${p.luck}/${p.maxLuck()}. A point of Luck saves you from a killing blow (halving it) automatically, or you can \`push\` to add six dice to your next two attacks. Luck returns slowly, on level-up, and at the clinic or inn.`); },
  push(p) { if (p.luck < 1) return p.msg('You have no Luck left.'); p.luck--; p.addFx({ k: 'buff', n: 'Pushed', ticks: 2, pool: 6, src: p }); p.msg('You push your luck: +6 attack dice for your next two rounds!', 'win'); p.sendStats(); },
  remort(p, a) {
    if (!p.env.def.rebirth) return p.msg('Remorting is done at the Hall of Rebirth in Ashfall, west of the Temple of the Dawn.');
    const R = p.remort || 0, opts = Object.entries(D.K.CLASSES).filter(([, k]) => k.remort);
    if (R >= 40) return p.msg('You have reached Remort 40, the pinnacle. There is nothing left to be reborn into.', 'win');
    if (p.level < 40) return p.msg(`Only level 40 adventurers can remort. You are level ${p.level}.`);
    const args = a.trim().toLowerCase().split(/\s+/), confirm = args[0] === 'confirm', key = confirm ? args[1] : args[0];
    const pick = opts.find(([k, c]) => key && (k === key || c.name.toLowerCase() === key));
    if (!pick) {
      p.msg(`The pool shimmers. You are ${R ? `Remort ${R}` : 'ready to remort'}. Becoming Remort ${R + 1} resets you to level 1 in a new, more powerful class.`, 'rname');
      p.msg('You keep: your name, gender, credits, items (you will need to re-equip them as you level), chrome and implants, contracts and quest points.', 'sys');
      p.msg('You gain: +4% max health and mana and +3% spell power per remort, +1 attack and defense die every 4 remorts, and a remort class. Levelling gets 10% slower per remort.', 'sys');
      for (const [k, c] of opts) p.msg(`  ${c.icon} ${k}: ${c.desc}`, 'spell');
      return p.msg('Type `remort <class>` to preview, then `remort confirm <class>` to be reborn.');
    }
    if (!confirm) return p.msg(`${pick[1].icon} ${pick[1].name}: ${pick[1].desc} Type \`remort confirm ${pick[0]}\` to become Remort ${R + 1}. You will return to level 1.`, 'win');
    D.remort(p, pick[0]);
  },
  notify(p, a) { a = a.trim(); if (a === 'on' || a === 'off') p.notify = a === 'on'; p.msg(`Login and logout notices are ${p.notify ? 'on' : 'off'}. Use: notify on | notify off`, 'sys'); },
  shutdown(p, a) { // wizard only: save everyone and stop the server
    if (!p.wiz) return C.huh(p); a = a.trim().toLowerCase();
    if (a === 'cancel') return p.msg(D.cancelShutdown(p.name) ? 'Shutdown cancelled.' : 'No shutdown is pending.', 'sys');
    if (a !== 'confirm') return p.msg('This saves every player and STOPS the game server. Type `shutdown confirm` to start a 5 second countdown (everyone is told), or `shutdown cancel` to abort one.', 'hurt');
    if (!D.shutdown(p.name, 5)) return p.msg('A shutdown is already under way.', 'sys');
    p.msg('Shutdown started. Type `shutdown cancel` within 5 seconds to stop it.', 'hurt');
  },
  discord(p, a) {
    if (!p.wiz) return C.huh(p); const s = D.bridge ? D.bridge.status() : { configured: false };
    if (a.trim() === 'test') { if (!s.out) return p.msg('The Discord webhook is not configured.'); D.bridge.out(`Test message from ${p.name}`, p.name); return p.msg('Sent a test message to Discord.', 'win'); }
    p.msg(s.configured ? `Discord bridge: MUD to Discord ${s.out ? 'on' : 'off'}, Discord to MUD ${s.in ? 'on' : 'off'}${s.announcements ? ', announcements on' : ''}${s.presence ? ', logins on' : ''}. Sent ${s.sent}, received ${s.received}, queued ${s.queued}.${s.lastError ? ' Last error: ' + s.lastError : ''}` : 'Discord bridge is not configured (set DISCORD_WEBHOOK_URL, and DISCORD_BOT_TOKEN + DISCORD_CHANNEL_ID, or data/config.json).', 'sys');
  },
  async github(p, a) {
    if (!p.wiz) return C.huh(p); const G = require('./github'), s = G.status();
    if (a.trim() === 'sync') { if (!s.configured) return p.msg('GitHub sync is not configured (set GITHUB_TOKEN and GITHUB_REPO, or data/config.json).'); p.msg('Syncing to GitHub...', 'sys');
      try { const r = await G.sync(`Manual sync by ${p.name}`); p.msg(r.skipped ? 'A sync is already running.' : r.changed ? `Pushed ${r.changed} file(s) in commit ${r.commit.slice(0, 7)}.` : 'GitHub is already up to date.', 'win'); } catch (e) { p.msg('Sync failed: ' + e.message, 'hurt'); } return; }
    p.msg(s.configured ? `GitHub sync: ${s.repo}@${s.branch}. ${s.pending} file(s) waiting to be pushed. Last sync ${s.lastSync || 'never'}${s.lastCommit ? ' (' + s.lastCommit.slice(0, 7) + ', ' + s.lastFiles + ' files)' : ''}.${s.lastError ? ' Last error: ' + s.lastError : ''} Type \`github sync\` to push now.` : 'GitHub sync is not configured (set GITHUB_TOKEN and GITHUB_REPO=owner/name, or data/config.json).', 'sys');
  },
  cast: (p, a) => D.cast(p, a),
  spells: (p) => D.spellbook(p),
  craft(p, a) {
    const recipes = D.K.RECIPES, key = a.toLowerCase().trim().replace(/\s+/g, '_');
    if (p.cls !== 'scavenger') return p.msg('Only Prospectors know how to craft.');
    const r = key && recipes.find((x) => x.k === key || x.k.startsWith(key));
    if (!r) { p.msg('Recipes (craft <name>):', 'rname'); for (const x of recipes) { const sp = D.spellsOf(p).find((s) => s.kind === 'craft' && s.tier === x.tier); p.msg(`  ${sp.lvl <= p.level ? '' : '🔒 lvl ' + sp.lvl + ' '}${x.k}: ${Object.entries(x.need).map(([i, n]) => n + ' ' + D.W.items[i].name).join(' + ')}`, sp.lvl <= p.level ? 'spell' : 'sys'); } return; }
    const sp = D.spellsOf(p).find((s) => s.kind === 'craft' && s.tier === r.tier); D.cast(p, `${sp.k} ${r.k}`);
  },
  class(p) { const k = p.klass(); p.msg(`${k.icon} ${k.name}: ${k.desc}`, 'rname'); p.msg(`Level ${p.level}. HP ${p.hp}/${p.maxhp}, ${p.cls === 'scavenger' ? 'stamina' : 'mana'} ${p.mp}/${p.maxmp}. Type 'spells' for your abilities.`); },
  rest(p) { if (!p.env.def.inn) return p.msg('You can only rest properly at the inn.'); p.hp = p.maxhp; p.mp = p.maxmp; p.luck = p.maxLuck(); p.msg('You sit by the fire and rest. You feel renewed.', 'win'); },
  score(p, a) { // a graphical character sheet (the client opens a window); `score text` prints the text version
    if (a.trim().toLowerCase() === 'text') return C.scoretext(p);
    p.send({ t: 'score', d: scoreData(p) }); p.msg('Your character sheet is open. (Type `score text` for the text version.)', 'sys');
  },
  scoretext(p) {
    const n = (v) => Math.round(v).toLocaleString('en-US'), k = p.klass(), at = p.attrs(), worn = new Set(Object.values(p.equip));
    const mats = {}, cons = {}; let goods = 0;
    for (const [id, c] of Object.entries(p.bag)) { const d = D.W.items[id]; if (!d) continue; if (d.type === 'material') mats[d.name] = (mats[d.name] || 0) + c; goods += priceOf(p, d) * c; } // the bag counts too
    for (const it of p.inv) { // materials (ore, herbs, fish...) and consumables are counted by name
      if (it.type === 'material') mats[it.name] = (mats[it.name] || 0) + 1; else if (it.type === 'potion') cons[it.name] = (cons[it.name] || 0) + 1;
      if (!worn.has(it)) goods += sellPrice(p, it);
    }
    const list = (o) => Object.entries(o).map(([name, c]) => `${c} ${name}`).join(', ') || 'none', w = p.equip.weapon;
    p.msg(`${[D.preTitle(p), p.name].filter(Boolean).join(' ')}${p.title ? ', ' + p.title : ''}: ${p.remort ? `Remort ${p.remort} ` : ''}${D.genderLabel(p.gender)} ${k.name}${p.wiz ? ' (wizard)' : ''}`, 'rname');
    const need = p.xpNeed(p.level);
    p.msg(p.level < 40 ? `Level ${p.level}. Experience ${n(p.xp)} of ${n(need)}: ${n(Math.max(0, need - p.xp))} more XP for level ${p.level + 1}.`
      : `Level 40 (maximum). Experience ${n(p.xp)}. ${(p.remort || 0) < 40 ? 'Remort at the Hall of Rebirth to start again.' : 'You have reached Remort 40, the pinnacle.'}`);
    p.msg(`Vitals: HP ${n(p.hp)}/${n(p.maxhp)}, ${p.cls === 'scavenger' ? 'Stamina' : 'Mana'} ${n(p.mp)}/${n(p.maxmp)}, Luck ${p.luck}/${p.maxLuck()}, Aura ${p.aura().toFixed(1)}/6.0.`);
    p.msg(`Wealth: ${n(p.gold)} credits${goods ? ` (plus about ${n(goods)} in goods you could sell)` : ''}.`, 'items');
    p.msg(`Materials (pack and bag): ${list(mats)}.`, 'items'); p.msg(`Consumables: ${list(cons)}.`, 'items');
    p.msg(`Attributes: ${Object.entries(at).map(([a, v]) => `${a} ${v}`).join(', ')}.`, 'sys');
    p.msg(`Combat: attack ${p.atkPool()}d6, defense ${p.defPool()}d6 (a 5 or 6 is a hit), armor class ${p.ac()}, weapon ${w ? `${w.name} (${w.def.dmg[0]}-${w.def.dmg[1]})` : 'bare hands'}.`, 'sys');
    p.msg(`Chrome: ${p.cyber.map((id) => D.W.items[id].name).join(', ') || 'none'}.`, 'sys');
    p.msg(`Tradeskills: ${Object.entries(p.skills).map(([id, k]) => `${D.T.SKILLS[id].name} ${k.lvl}`).join(', ') || 'none learned (type `tradeskills`)'}.`, 'sys');
    p.msg(`Contracts: ${Object.keys(p.quests).length} active, ${p.qdone.size}/${D.Q.QUESTS.length} done. Quest points ${p.qp}/${D.qpTotal()}. Bounty points ${p.bounty || 0}. Pack ${p.inv.length}/${p.cap()} items. Bag of holding ${D.bagUsed(p)}/${D.bagCap(p)}.`, 'sys');
  },
  say(p, a) { if (!a) return p.msg('Say what?'); p.msg(`You say: ${a}`, 'say'); p.env.tell(`${p.name} says: ${a}`, p, 'say'); },
  tell(p, a) {
    const m = a.match(/^(\S+)\s+(.+)$/); if (!m) return p.msg('Tell whom what?');
    const t = D.players.get(cap(m[1].toLowerCase())); if (!t) return p.msg('Nobody by that name is online.');
    t.msg(`${p.name} tells you: ${m[2]}`, 'chat'); p.msg(`You tell ${t.name}: ${m[2]}`, 'chat');
  },
  shout(p, a) { if (!a) return p.msg('Shout what?'); for (const o of D.players.values()) o.msg(`[chat] ${p.name}: ${a}`, 'chat'); },
  who(p) { // one player per line: name, title, class and gender
    const all = [...D.players.values()];
    p.send({ t: 'who', list: all.map((o) => ({ name: o.name, pre: D.preTitle(o), title: o.title || '', cls: o.cls, cn: o.klass().name, g: o.gender, gl: D.genderLabel(o.gender), lv: o.level, rm: o.remort || 0, bot: !!o.isBot, ic: o.klass().icon, pic: D.playerPic(o) })) });
    p.msg(`Players online (${all.length}):`, 'rname');
    for (const o of all) p.msg([[D.preTitle(o), o.name].filter(Boolean).join(' '), o.title || '', `${o.klass().name} (${o.remort ? `Remort ${o.remort}, ` : ''}level ${o.level})`, D.genderLabel(o.gender), o.isBot ? 'bot' : ''].filter(Boolean).join(' | '), 'sys');
  },
  leaderboard(p, a) { // top 10 achievements: level, quests completed, tradeskills raised
    const all = D.leaderboard(true), top = all.slice(0, 10), me = all.find((r) => r.name === p.name);
    p.send({ t: 'board', list: top, me, total: all.length }); if (a.trim() === 'window') return;
    p.msg('Top 10 achievements (score = level x100, plus quests x250, plus tradeskill levels raised x40, plus bounty points x40; a remort counts as 40 levels):', 'rname');
    top.forEach((r) => p.msg(`${String(r.rank).padStart(2)}. ${r.name.padEnd(12)} ${r.rm ? `R${r.rm} ` : ''}L${r.lv} ${r.cn.padEnd(12)} quests ${String(r.q).padStart(2)}  skills +${String(r.t).padStart(3)}  bounty ${String(r.b).padStart(3)}  score ${r.score}`, r.name === p.name ? 'win' : 'sys'));
    if (me && me.rank > 10) p.msg(`You are ranked #${me.rank} of ${all.length} with ${me.score} points.`, 'sys');
  },
  // ---- teams: kills split XP and credits between teammates standing in the same room (+10% for each extra member, up to 5 players) ----
  team(p, a) {
    const m = a.trim().match(/^(\S*)\s*(.*)$/), sub = (m[1] || '').toLowerCase(), arg = m[2].trim(), t = p.team;
    const who = (n) => { n = n.toLowerCase(); const all = [...D.players.values()].filter((o) => !o.isBot); return all.find((o) => o.name.toLowerCase() === n) || all.find((o) => o.name.toLowerCase().startsWith(n)); };
    if (!sub || sub === 'list' || sub === 'status') {
      if (!t) return p.msg('You are not on a team. `team invite <player>` starts one. A team splits the XP and credits of every kill among members in the same room, with a 10% bonus per extra member (up to 5 players). Chat with `tc <message>`.', 'sys');
      p.msg(`Team (${t.members.length}/5), led by ${t.leader}:`, 'rname'); for (const n of t.members) { const o = D.players.get(n); p.msg(o ? `  ${n}${n === t.leader ? ' (leader)' : ''}: level ${o.level} ${o.klass().name}, HP ${o.hp}/${o.maxhp}, in ${o.env.name}` : `  ${n}: offline`, 'sys'); } return;
    }
    if (sub === 'invite') {
      const o = who(arg); if (!arg) return p.msg('Invite whom? team invite <player>'); if (!o) return p.msg('No such player online.'); if (o === p) return p.msg('You cannot invite yourself.'); if (o.team) return p.msg(`${o.name} is already on a team.`);
      if (t && t.leader !== p.name) return p.msg('Only the team leader can invite.'); if (t && t.members.length >= 5) return p.msg('Your team is full (5 players).');
      D.invites = D.invites || new Map(); D.invites.set(o.name, { from: p.name, at: Date.now() }); p.msg(`You invite ${o.name} to your team.`, 'team'); o.send({ t: 'invite', from: p.name, secs: 90, size: t ? t.members.length : 1 }); return o.msg(`${p.name} invites you to join their team. Click Accept in the pop-up, or type \`team accept\` (or \`team decline\`) within 90 seconds.`, 'team');
    }
    if (sub === 'accept' || sub === 'join') {
      const inv = D.invites && D.invites.get(p.name); if (!inv || Date.now() - inv.at > 90000) return p.msg('You have no pending team invitation.'); D.invites.delete(p.name);
      const lead = D.players.get(inv.from); if (!lead) return p.msg('The inviter is no longer online.'); if (p.team) return p.msg('Leave your current team first: team leave');
      if (!lead.team) lead.team = { leader: lead.name, members: [lead.name] }; if (lead.team.members.length >= 5) return p.msg('That team is full.');
      lead.team.members.push(p.name); p.team = lead.team; D.teamMsg(p.team, `${p.name} joined the team. Kills now split XP and credits among teammates in the same room.`); return;
    }
    if (sub === 'decline') { if (D.invites) D.invites.delete(p.name); return p.msg('Invitation declined.', 'sys'); }
    if (sub === 'leave' || sub === 'quit') return t ? D.teamLeave(p) : p.msg('You are not on a team.');
    if (sub === 'kick' || sub === 'lead') {
      if (!t) return p.msg('You are not on a team.'); if (t.leader !== p.name) return p.msg('Only the team leader can do that.'); const o = who(arg); if (!o || o.team !== t || o === p) return p.msg('That player is not on your team.');
      if (sub === 'lead') { t.leader = o.name; return D.teamMsg(t, `${o.name} is now the team leader.`); } D.teamMsg(t, `${o.name} was removed from the team.`); return D.teamLeave(o);
    }
    p.msg('Team commands: team, team invite <player>, team accept, team decline, team leave, team kick <player>, team lead <player>. Chat: tc <message>.', 'sys');
  },
  tc(p, a) { if (!p.team) return p.msg('You are not on a team. See `team`.'); if (!a.trim()) return p.msg('Team chat what? tc <message>'); D.teamMsg(p.team, `[team] ${p.name}: ${a.trim()}`); },
  bounties(p, a) { // the wanted list; wizards can post one with `bounties post`
    if (a.trim() === 'post' && p.wiz) { const b = D.bounty.post(true); return p.msg(b ? 'Bounty posted.' : 'Could not post a bounty (three already active, or no suitable target).', 'sys'); }
    const l = D.bounty.list(); p.msg(`Bounty points: ${p.bounty || 0} (${p.bounties || 0} collected). Kill a wanted monster for instant credits and bounty points, which count toward the leaderboard.`, 'rname');
    if (!l.length) return p.msg('No bounties are posted right now. The quest givers post new ones every so often.', 'sys');
    l.forEach((b, i) => p.msg(`  ${i + 1}. ${b.name} (level ${b.level}) at ${b.where}: ${b.reward} credits + ${b.bp} bounty point${b.bp > 1 ? 's' : ''}, posted by ${b.poster}, ${b.mins} min left`, 'quest'));
  },
  // ---- bank robbery: rob stationary people, kill the manager for the vault key, unlock and loot the vault ----
  rob(p, a) {
    const arg = a.trim(); if (!arg) return p.msg('Rob whom? (rob teller, rob customer, rob vault)'); if (/^(the )?vault$/i.test(arg)) return C.loot(p, 'vault');
    const people = p.env.inv.filter((o) => o.isLiving && o.def && o.def.robbable), t = find(people, arg);
    if (!t) return p.msg(people.length ? 'Nobody here by that name to rob.' : 'There is nobody worth robbing here. Try the bank in Dry Gulch, east of the Rattlesnake Saloon.');
    if (Date.now() - (t.robbedAt || 0) < 300000) return p.msg(`${cap(t.the())} has nothing left. You already cleaned them out.`);
    const odds = 0.7 + (p.cls === 'thief' ? 0.15 : p.cls === 'gunslinger' ? 0.1 : 0);
    if (Math.random() > odds) { p.msg(`${cap(t.the())} screams and slaps the alarm! Bank guards come running!`, 'hurt'); if (p.env.inv.filter((o) => o.mobId === 'bank_guard').length < 5) { const g = D.cloneMob('bank_guard'); g.move(p.env); g.engage && g.engage(p); p.env.tell('A bank guard bursts in with his gun drawn!', p, 'combat2'); } return; }
    const got = D.rnd(...t.def.robbable.gold); p.gold += got; t.robbedAt = Date.now(); p.msg(`You stick up ${t.the()} and take ${got} credits. They tremble and say nothing.`, 'win'); p.env.tell(`${p.name} sticks up ${t.the()}!`, p, 'combat2'); D.qEvent(p, 'rob', 'any');
  },
  unlock(p, a) {
    const arg = a.trim().toLowerCase(); if (arg && !/^(the )?(vault|door)$/.test(arg)) return p.msg('Unlock what? (unlock vault)');
    const vr = [p.env, ...Object.values(p.env.exits).map((x) => D.rooms.get(x))].find((r) => r && r.def.vault); if (!vr) return p.msg('There is no vault door here.'); if (vr.unlocked) return p.msg('The vault is already open.');
    if (!D.itemCount(p, 'vaultkey')) return p.msg('The vault door is locked tight. You need the bank vault key, which the Bank Manager carries.');
    D.itemTake(p, 'vaultkey', 1); vr.unlocked = true; vr.vaultGold = D.rnd(3500, 9500); clearTimeout(vr.relock); // the vault holds a different sum every time
    vr.relock = setTimeout(() => { vr.unlocked = false; vr.vaultGold = 0; vr.tell('The vault door swings shut and the bolts slam home.', [], 'sys'); }, 300000);
    p.msg('You turn the heavy brass key. With a groan of steel, the vault door swings open!', 'win'); p.env.tell(`${p.name} unlocks the vault door with a brass key.`, p, 'win');
  },
  loot(p, a) {
    if (!/^(the )?vault$/i.test(a.trim())) return p.msg('Loot what? (loot vault)'); const r = p.env; if (!r.def.vault) return p.msg('There is no vault here. The bank vault is in Dry Gulch.');
    if (!r.unlocked) return p.msg('The vault is locked.'); if (!r.vaultGold) return p.msg('The vault has been cleaned out. Come back after the next job.');
    const total = r.vaultGold; r.vaultGold = 0; const mates = D.teamHere(p), n = mates.length, share = 1 + 0.1 * (n - 1);
    for (const m of mates) { const got = Math.round(total * share / n); m.gold += got; m.msg(`*** You load your sacks with ${got} credits from the vault! ***`, 'win'); D.qEvent(m, 'vault', 'loot'); }
    D.announce(`${p.name}${n > 1 ? ' and their team' : ''} cracked the Dry Gulch bank vault and escaped with ${total} credits!`, 'robbery');
  },
  // ---- remote sell: all unworn weapons and armor, from anywhere, for 90% of the shop price (10% finder's fee) ----
  rsell(p, a) {
    const sellable = (d) => d && (d.type === 'weapon' || d.type === 'armor') && !d.legend && priceOf(p, d) > 0, rows = [];
    for (const it of p.inv) if (!worn(p, it) && !it.kept && sellable(it.def)) rows.push({ name: it.name, price: priceOf(p, it.def), it });
    for (const [id, c] of Object.entries(p.bag)) { const d = D.W.items[id]; if (sellable(d) && !p.keepBag[id]) rows.push({ name: `${d.name}${c > 1 ? ' x' + c : ''}`, price: priceOf(p, d) * c, id }); }
    if (!rows.length) return p.msg('You have no unworn weapons or armor to sell. (Legendary items are never sold by rsell.)', 'sys');
    const gross = rows.reduce((s, r) => s + r.price, 0), fee = Math.floor(gross * 0.1), net = gross - fee;
    if (a.trim().toLowerCase() === 'list') { rows.slice(0, 30).forEach((r) => p.msg(`  ${r.name.padEnd(28)} ${r.price}c`, 'sys')); if (rows.length > 30) p.msg(`  ...and ${rows.length - 30} more`, 'sys'); return p.msg(`rsell would sell ${rows.length} stack${rows.length > 1 ? 's' : ''} for ${gross} credits, minus a 10% finder's fee of ${fee}: you would receive ${net}. Type \`rsell\` to do it.`, 'win'); }
    for (const r of rows) { if (r.it) r.it.destroy(); else delete p.bag[r.id]; }
    p.gold += net; p.msg(`You sell ${rows.length} stack${rows.length > 1 ? 's' : ''} of unworn gear remotely for ${gross} credits. Finder's fee (10%): ${fee}. You receive ${net} credits. (Worn and legendary items are never sold.)`, 'win');
  },
  auction(p, a) { D.auction.cmd(p, a); }, bid(p, a) { D.auction.bid(p, a); }, auctions(p) { D.auction.status(p); },
  title(p, a) { // set your own title, shown on the who list (the special pre-title for admins cannot be copied)
    a = a.trim(); if (!a) return p.msg(p.title ? `Your title: ${p.title}. Change it with \`title <text>\` (up to 40 characters) or \`title clear\`.` : 'You have no title. Set one with `title <text>` (up to 40 characters), for example: title the Unlucky.', 'sys');
    if (/^(clear|none|off)$/i.test(a)) return D.setTitle(p, ''); if (!D.cleanTitle(a)) return p.msg('That title is not allowed.'); D.setTitle(p, a);
  },
  mute(p, a) { // mute bounty, level-up and quest-completion announcements
    const NAMES = { bounty: 'bounty announcements', levels: 'level-up announcements', quests: 'quest completion announcements', weather: 'weather events' }, KEY = { bounty: 'bounty', bounties: 'bounty', level: 'levels', levels: 'levels', quest: 'quests', quests: 'quests', weather: 'weather' };
    const [w, v] = a.trim().toLowerCase().split(/\s+/), k = KEY[w];
    if (!k) { p.msg('Muted announcements (mute <bounties|levels|quests|weather> [on|off]):', 'rname'); return Object.entries(NAMES).forEach(([key, label]) => p.msg(`  ${label}: ${p.mute[key] ? 'MUTED' : 'shown'}`, 'sys')); }
    const on = v === 'on' ? true : v === 'off' ? false : !p.mute[k]; D.setMute(p, { key: k, on }); p.msg(`${NAMES[k]}: ${on ? 'muted' : 'shown'}.`, 'win');
  },
  blackjack(p, a) { const w = a.trim().toLowerCase(); if (w === 'hit') return D.blackjack.hit(p); if (w === 'stand') return D.blackjack.stand(p); if (w === 'rules') return p.msg('Blackjack: a game costs 1000 credits. Get closer to 21 than the dealer without going over. Dealer stands on 17. Win pays 1:1, blackjack pays 3:2, a tie returns your stake. Play at any saloon.', 'sys'); D.blackjack.play(p); },
  speedwalk(p, a) { // speedwalk n,n,e,e,d : walk a whole route (counts like 3n work; up to 60 steps; also ne nw se sw in out)
    const arg = a.trim(); if (/^(stop|cancel)$/i.test(arg)) { if (p.swTok) { p.swTok = null; return p.msg('Speedwalk stopped.', 'sys'); } return p.msg('You are not speedwalking.', 'sys'); }
    const MAP = { n: 'n', north: 'n', s: 's', south: 's', e: 'e', east: 'e', w: 'w', west: 'w', u: 'u', up: 'u', d: 'd', down: 'd', ne: 'ne', northeast: 'ne', nw: 'nw', northwest: 'nw', se: 'se', southeast: 'se', sw: 'sw', southwest: 'sw', in: 'in', out: 'out' }, steps = []; let bad = !arg;
    for (const t of arg.toLowerCase().split(/[\s,;]+/).filter(Boolean)) { const m = t.match(/^(\d{1,2})?([a-z]+?)(\d{1,2})?$/); if (!m || !MAP[m[2]]) { bad = true; break; } for (let i = 0; i < (+m[1] || +m[3] || 1); i++) steps.push(MAP[m[2]]); }
    if (bad || !steps.length || steps.length > 60) return p.msg('Usage: speedwalk n,n,n,e,e,e,d  (directions n s e w u d ne nw se sw in out, counts like 3n, at most 60 steps). `speedwalk stop` cancels. The Directions page of the guide lists ready-made routes.', 'sys');
    walkSteps(p, steps, `Speedwalking ${steps.join(',')}`);
  },
  commands(p, a) { require('./cmdlist')(p, a); },
  deaths(p, a) { D.deaths.cmd(p, a); },
  weather(p, a) { require('./weather').cmd(p, a); },
  gag(p, a) { a = a.trim().toLowerCase(); if (a === 'on' || a === 'off') p.gag = a === 'on'; p.msg(`Combat gag is ${p.gag ? 'ON: misses and fumbles are hidden' : 'OFF'}. Use: gag on | gag off`, p.gag ? 'win' : 'sys'); },
  socials(p) { p.msg('Feelings: ' + SOCIALS.list().join(', ') + '. Use one alone (smile) or aim it at someone (smile bob).', 'social'); },
  triggers(p) { p.msg(p.triggers.length ? 'Your triggers (set them in settings or with `trigger add <text> => <command>`):\n' + p.triggers.map((t, i) => `  ${i + 1}. ${t.on ? '[on] ' : '[off]'} when you see "${t.pat}" ${t.cmd ? 'run: ' + t.cmd : ''}${t.hl ? ' (highlight)' : ''}`).join('\n') : 'You have no triggers. Add one in settings, or: trigger add <text> => <command>   e.g. trigger add You are hungry => eat bread', 'sys'); },
  trigger(p, a) {
    const m = a.trim().match(/^(add|del|on|off)\s+(.*)$/i); if (!m) return C.triggers(p); const op = m[1].toLowerCase(), r = m[2].trim();
    if (op === 'add') { const [pat, cmd] = r.split(/\s*=>\s*/); if (!pat) return p.msg('Usage: trigger add <text> => <command>'); if (p.triggers.length >= 30) return p.msg('You can have at most 30 triggers.'); p.triggers = D.cleanTriggers([...p.triggers, { pat, cmd: cmd || '', hl: !cmd, on: true }]); p.sendTriggers(); return p.msg(`Trigger added: when you see "${pat}"${cmd ? ' run: ' + cmd : ' it is highlighted'}.`, 'win'); }
    const i = parseInt(r, 10) - 1; if (!p.triggers[i]) return p.msg('No such trigger number. See `triggers`.');
    if (op === 'del') p.triggers.splice(i, 1); else p.triggers[i].on = op === 'on'; p.sendTriggers(); p.msg(op === 'del' ? 'Trigger deleted.' : `Trigger ${i + 1} is ${op}.`, 'win');
  },
  tutorial(p, a) { a = a.trim().toLowerCase(); D.tutMsg(p, a === 'off' ? { off: true } : a === 'reset' ? { reset: true, open: true } : { off: false, open: true }); p.msg(a === 'off' ? 'Tutorial turned off. Type `tutorial` to bring it back.' : 'Opening the newbie tutorial...', 'sys'); },
  travel(p, a) { // walk to a landmark along safe rooms (used by the tutorial buttons)
    const key = a.trim().toLowerCase(); if (!key) return p.msg('Travel where? ' + Object.keys(PLACES).join(', '), 'sys'); const hit = PLACES[key] ? key : Object.keys(PLACES).find((k) => k.startsWith(key)); if (!hit) return p.msg('Unknown place. Try: ' + Object.keys(PLACES).join(', '));
    if (p.enemy) return p.msg('You cannot travel while fighting.'); const steps = route(p.env.path, PLACES[hit]); if (!steps) return p.msg('There is no safe walking route from here. Try `recall` first.'); if (!steps.length) return p.msg('You are already there.');
    p.msg(`You set off for the ${hit}...`, 'sys'); let i = 0; const step = () => { if (p.gone || p.enemy) return; if (i >= steps.length) return p.msg('You have arrived.', 'win'); D.command(p, steps[i++]); D.callOut(step, 300); }; step();
  },
  twitter(p, a) { // wizard: status, or `twitter test` to post a test message
    if (!p.wiz) return C.huh(p); const T = require('./tweet'), s = T.status(); if (a.trim() === 'test') { if (!s.configured) return p.msg('Twitter is not configured.'); T.post(`Test post from ${p.name} on MULTIVERSE MUD`, 'test'); return p.msg('Test post queued.', 'win'); }
    p.msg(s.configured ? `Twitter: posting ${s.events.join(', ')} with ${s.hashtags.join(' ')}. Sent ${s.sent}, queued ${s.queued}${s.dryRun ? ' (DRY RUN)' : ''}.${s.lastError ? ' Last error: ' + s.lastError : ''}` : 'Twitter is not configured (set TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN and TWITTER_ACCESS_SECRET, or data/config.json).', 'sys');
  },
  autoflee(p, a) { a = a.trim().toLowerCase(); if (a === 'on' || a === 'off') p.autoflee = a === 'on'; p.msg(`Autoflee is ${p.autoflee ? 'ON: you will try to flee when your health drops to 30% or below' : 'OFF'}. Use: autoflee on | autoflee off`, p.autoflee ? 'win' : 'sys'); },
  alias(p, a) {
    const m = a.trim().match(/^(\S+)\s*(.*)$/);
    if (!m) { const l = Object.entries(p.aliases); return p.msg(l.length ? 'Your aliases:\n' + l.map(([k, v]) => `  ${k} = ${v}`).join('\n') : 'You have no aliases. Example: alias g get all', 'sys'); }
    const name = m[1].toLowerCase(), body = m[2].trim();
    if (!body) return p.msg(p.aliases[name] ? `${name} = ${p.aliases[name]}` : `No alias called "${name}".`, 'sys');
    if (!/^[a-z][a-z0-9_]{0,11}$/.test(name)) return p.msg('Alias names are 1 to 12 letters, digits or underscores, starting with a letter.');
    if (Object.hasOwn(C, name) || Object.hasOwn(ALIAS, name) || DIRS[name] || FULL[name] || SOCIALS.SOC[name]) return p.msg(`"${name}" is already a game command. Pick another name.`);
    if (/^(un)?alias\b/i.test(body)) return p.msg('An alias cannot create or remove aliases.'); if (body.length > 200) return p.msg('That alias is too long (200 characters).');
    if (!(name in p.aliases) && Object.keys(p.aliases).length >= 50) return p.msg('You can have at most 50 aliases.');
    p.aliases[name] = body; p.msg(`Alias set: ${name} = ${body}  (separate several commands with ;)`, 'win');
  },
  unalias(p, a) { const n = a.trim().toLowerCase(); if (!Object.hasOwn(p.aliases, n)) return p.msg(`No alias called "${n}".`); delete p.aliases[n]; p.msg(`Alias "${n}" removed.`, 'sys'); },
  keypad(p, a) {
    const t = a.trim().toLowerCase(), m = t.match(/^(\S+)\s*(.*)$/);
    if (!m || t === 'list') { p.msg(`Keypad controls are ${p.kpOn ? 'ON' : 'OFF'} (keypad on | off | reset). Num Lock must be on.`, 'rname'); p.msg(Object.entries(p.kpMap).map(([k, v]) => `${KPN[k]} = ${v || '(nothing)'}`).join(', ') + '.', 'sys'); return p.msg('Change a key: keypad <key> <command>, e.g. keypad 5 look. Use keypad <key> none to clear it. Keys: 0-9 + - * / . enter. Separate several commands with ;', 'sys'); }
    D.kp(p, m[1] === 'on' ? { on: true } : m[1] === 'off' ? { on: false } : m[1] === 'reset' ? { reset: true } : { name: m[1], cmd: m[2] });
  },
  gender(p, a) {
    let g = a.trim().toLowerCase(); if (!g) return p.msg(`You are ${D.genderLabel(p.gender)}. Change it with: gender male | female | other`);
    if (g === 'other') g = 'nonbinary'; if (!['male', 'female', 'nonbinary'].includes(g)) return p.msg('Choose male, female or other.'); p.gender = g; p.recalc(); p.sendStats(); p.msg(`You are now ${D.genderLabel(g)}.`, 'sys');
  },
  help(p, a) { // help | help <command> | help <class ability>
    const q = (a || '').trim().toLowerCase().split(/\s+/)[0] || '';
    if (!q) { p.msg('Move: n s e w u d, speedwalk n,n,e (sw), travel. Look: look [thing], check <item>. Fight: kill <mob> (autokill on), flee, cast. Items: get, drop, wield, wear, remove, quaff/eat, inventory (eq), keep, unkeep, salvage all. Shops: list, buy, sell. Talk: say, tell, gossip, team. Misc: brief, finger, email, idea, bug, deaths, weather, score, commands.', 'sys'); return p.msg('Type `help <command>` for detailed help on any command (for example `help kill` or `help eq`), `help <ability>` for a class ability, and `commands` for the full list. The Player\'s Guide website has everything in detail.', 'win'); }
    const { H, WIZ } = require('./helpdocs'), DIRW = { n: 1, s: 1, e: 1, w: 1, u: 1, d: 1, north: 1, south: 1, east: 1, west: 1, up: 1, down: 1 }, name = ALIAS[q] || (DIRW[q] ? 'go' : q), doc = H[name];
    if (doc && (!WIZ.has(name) || p.wiz)) {
      const als = Object.entries(ALIAS).filter(([, v]) => v === name).map(([k]) => k); p.msg(`HELP: ${name}${als.length ? `   (also: ${als.join(', ')})` : ''}`, 'rname'); p.msg(`Usage: ${doc[0]}`, 'items'); p.msg(doc[1]);
      if (doc[2].length) p.msg('Examples: ' + doc[2].join('   |   '), 'sys'); if (doc[3].length) p.msg('See also: ' + doc[3].join(', '), 'sys'); return;
    }
    const w = (a || '').trim().toLowerCase(), sp = D.spellsOf(p).find((s) => s.k === w || s.n.toLowerCase() === w) || D.spellsOf(p).find((s) => s.n.toLowerCase().startsWith(w));
    if (sp) return p.msg(`${sp.n}: level ${sp.lvl} ${p.klass().name} ability, ${sp.mp} ${p.cls === 'scavenger' ? 'stamina' : 'mana'}${sp.cd ? `, ${sp.cd} round cooldown` : ''}. ${sp.d} Use it with \`cast ${sp.n.toLowerCase()}\` or just type its name.${sp.lvl > p.level ? ` (You unlock it at level ${sp.lvl}.)` : ''}`, 'win');
    if (require('./socials').SOC[q]) return p.msg(`${cap(q)} is a social (a feeling). Type \`${q}\` alone, or aim it: \`${q} <player>\`. \`socials\` lists them all.`, 'sys');
    p.msg(`There is no help for "${(a || '').trim()}". Type \`commands\` to see everything you can use.`);
  },
  save(p) { D.savePlayer(p); p.msg('Saved.', 'sys'); },
  quit(p) { D.savePlayer(p); p.msg('Farewell, traveler.', 'sys'); p.send({ t: 'quit' }); if (p.conn) p.conn.close(); },
  // ---- wizard commands ----
  update(p) { if (!p.wiz) return C.huh(p); try { D.loadWorld(); for (const o of D.players.values()) { o.recalc(); o.sendSpells(); } p.msg('World and classes reloaded.', 'sys'); D.pushMaps(); } catch (e) { p.msg('Error: ' + e.message, 'hurt'); } },
  goto(p, a) { if (!p.wiz) return C.huh(p); const r = D.rooms.get(a); if (!r) return p.msg('Rooms: ' + [...D.rooms.keys()].join(', ')); p.enemy = null; p.enter(r); },
  clone(p, a) { if (!p.wiz) return C.huh(p); if (!D.W.items[a]) return p.msg('Items: ' + Object.keys(D.W.items).join(', ')); D.cloneItem(a).move(p); p.msg('Cloned.'); },
  huh: (p) => p.msg('What?'),
};

D.remort = (p, cls) => { // reset to level 1 as a remort class, keeping the things that cost real effort
  p.equip = {}; p.cls = cls; p.level = 1; p.xp = 0; p.remort = (p.remort || 0) + 1; p.fx = []; p.cd = {}; p.enemy = null;
  const kit = D.cloneItem(p.klass().kit); kit.move(p); p.equip.weapon = kit;
  p.recalc(); p.hp = p.maxhp; p.mp = p.maxmp; p.luck = p.maxLuck();
  p.send({ t: 'sound', k: 'levelup' }); D.announce(`${p.name} has remorted and is now Remort ${p.remort}, a level 1 ${p.klass().name}!`);
  p.msg(`*** You are reborn! You are now Remort ${p.remort}, a ${p.klass().name}. Your equipment is in your pack; wear what you can as you level. ***`, 'win');
  p.sendSpells(); p.sendStats(); p.env.look(p);
};

const SOCIALS = require('./socials');
const PLACES = { square: 'town/square', guild: 'town/adventurers_guild', smithy: 'town/smithy', market: 'town/market', armory: 'town/armory', temple: 'town/temple', saloon: 'town/inn', clinic: 'town/clinic', gate: 'town/gate', exchange: 'town/salvage_exchange', rebirth: 'town/hall_of_rebirth', forest: 'forest/path' };
const route = (from, to) => { // shortest walk that stays on safe rooms until the last step
  if (from === to) return []; const prev = { [from]: null }, q = [from];
  while (q.length) { const c = q.shift(); for (const [d, n] of Object.entries(D.rooms.get(c).exits)) { const nr = D.rooms.get(n); if (!nr || n in prev || (n !== to && !nr.def.safe)) continue; prev[n] = [c, d]; if (n === to) { const out = []; let x = n; while (prev[x]) { out.unshift(prev[x][1]); x = prev[x][0]; } return out; } q.push(n); } }
  return null;
};
const TUTV = { look: 'look', score: 'score', spells: 'spells', board: 'board', talk: 'talk', buy: 'buy', wield: 'wield', wear: 'wield', recall: 'recall', gossip: 'gossip', team: 'team', learn: 'learn', travel: 'travel', quests: 'quests', tradeskills: 'tradeskills', list: 'list' };
D.commandNames = () => Object.keys(C).filter((k) => k !== 'huh'); // used by the `commands` listing
const KPN = { Numpad0: '0', Numpad1: '1', Numpad2: '2', Numpad3: '3', Numpad4: '4', Numpad5: '5', Numpad6: '6', Numpad7: '7', Numpad8: '8', Numpad9: '9', NumpadAdd: '+', NumpadSubtract: '-', NumpadMultiply: '*', NumpadDivide: '/', NumpadDecimal: '.', NumpadEnter: 'enter' };
const KPCODE = Object.fromEntries([...Object.entries(KPN).map(([c, n]) => [n, c]), ['plus', 'NumpadAdd'], ['add', 'NumpadAdd'], ['minus', 'NumpadSubtract'], ['star', 'NumpadMultiply'], ['times', 'NumpadMultiply'], ['slash', 'NumpadDivide'], ['dot', 'NumpadDecimal'], ['decimal', 'NumpadDecimal'], ['return', 'NumpadEnter']]);
D.kp = (p, m) => { // keypad settings, saved in the player's profile; used by the browser client and the keypad command
  if (m.on !== undefined) p.kpOn = !!m.on; else if (m.reset) p.kpMap = { ...D.KP_DEFAULT };
  else { const code = D.KP_DEFAULT[m.code] !== undefined ? m.code : KPCODE[String(m.name || '').toLowerCase()]; if (!code) return p.msg('Unknown keypad key. Keys: 0-9 + - * / . enter'); let c = String(m.cmd || '').replace(/[\u0000-\u001f]/g, '').trim().slice(0, 100); if (/^(none|off|nothing|-)$/i.test(c)) c = ''; p.kpMap[code] = c; p.msg(`Keypad ${KPN[code]} ${c ? '= ' + c : 'cleared'}.`, 'win'); }
  if (m.on !== undefined) p.msg(`Keypad controls ${p.kpOn ? 'ON' : 'OFF'}.`, 'win'); if (m.reset) p.msg('Keypad reset to the defaults.', 'win'); p.sendKeypad();
};
const runAlias = (p, name, rest) => { // player aliases: "alias g get all" then "g" runs "get all"; ; separates commands
  if ((p._ad || 0) >= 3) return; p._ad = (p._ad || 0) + 1;
  try { const segs = p.aliases[name].split(';').map((s) => s.trim()).filter(Boolean).slice(0, 8); segs.forEach((s, i) => D.command(p, i === segs.length - 1 && rest ? `${s} ${rest}` : s)); } finally { p._ad--; }
};
D.command = (p, line) => {
  const m = line.trim().match(/^(\S+)\s*(.*)$/); if (!m) return;
  let v = m[1].toLowerCase(), a = m[2];
  if (p.swTok && !p.swRunning && v !== 'speedwalk' && v !== 'run') { p.swTok = null; p.msg('Speedwalk cancelled.', 'sys'); } // typing anything else interrupts a speedwalk
  if (p.bj && (v === 'hit' || v === 'stand')) return D.blackjack[v](p); // answering the dealer in a blackjack hand
  if (v[0] === "'") { a = line.trim().slice(1); v = 'say'; }
  if (p.aliases && Object.hasOwn(p.aliases, v)) return runAlias(p, v, a);
  v = ALIAS[v] || v;
  if (DIRS[v]) return go(p, v); if (FULL[v]) return go(p, FULL[v]);
  if (Object.hasOwn(C, v) && v !== 'huh') { if (TUTV[v]) D.tutEvent(p, TUTV[v]); return C[v](p, a); }
  if (D.spellsOf(p).some((s) => s.k === v)) return D.cast(p, v + ' ' + a);
  for (const o of [...p.inv, ...p.env.inv]) if (o.actions && o.actions[v] && o.actions[v](p, a, o)) return; // add_action-style item verbs
  if (SOCIALS.handle(p, v, a, find)) return;
  p.msg("What? (type 'help')");
};
