'use strict';
const D = require('./driver');
const { GameObject } = D;
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const cap = (s) => s[0].toUpperCase() + s.slice(1);
const DIRS = { n: 'north', s: 'south', e: 'east', w: 'west', u: 'up', d: 'down' };
const NOBODY = { id: 0, name: 'something', enemy: null, msg() {}, the() { return 'something'; }, info() { return { id: 0, name: '?', hp: 0, max: 1, lvl: 1, k: 'p', icon: '' }; } };
const art = (n) => (/^[aeiou]/i.test(n) ? 'an ' : 'a ') + n;
// Dice pools: roll n six-sided dice; a 5 or 6 is a "hit". More than half ones with no hits is a fumble.
const roll = (n) => { n = Math.max(1, Math.round(n)); let h = 0, ones = 0; for (let i = 0; i < n; i++) { const d = rnd(1, 6); if (d >= 5) h++; else if (d === 1) ones++; } return { h, f: h === 0 && ones * 2 > n }; };
const KP_DEFAULT = { Numpad8: 'north', Numpad2: 'south', Numpad4: 'west', Numpad6: 'east', Numpad9: 'up', Numpad3: 'down', Numpad5: 'look', Numpad0: 'inventory', Numpad1: 'flee', Numpad7: 'score', NumpadAdd: 'spells', NumpadSubtract: 'quests', NumpadDivide: 'who', NumpadMultiply: 'bag', NumpadDecimal: 'recall', NumpadEnter: '' };
D.AREA_LABEL = { town: 'Ashfall Junction (Old West)', forest: 'Whisperwood (Fantasy)', crypt: 'Barrow Crypts (Fantasy)', marsh: 'Sunken Marsh (Fantasy)', road: 'Redrock Trail (Old West)', mines: 'Silverado Mines (Old West)', dunes: 'Sunscorch Dunes (Fantasy)', frost: 'Frostpeak Station (Sci-fi)', ember: 'Ember Wastes (Sci-fi)', citadel: 'Shattered Citadel (Fantasy)', cit: 'Shattered Citadel (Fantasy)', abyss: 'The Abyss (Sci-fi)', gulch: 'Tombstone Gulch (Old West)', thorn: 'Thornwild Court (Fantasy)', aurora: 'Starship Aurora (Sci-fi)', reach: 'The Drowned Reach (Fantasy)', rail: 'Brimstone Rail Yard (Old West)' };
const need = (lvl) => lvl * lvl * 50; // xp required to leave this level
const VERBS = [[0.05, 'scratch', 'scratches', ' lightly'], [0.15, 'hit', 'hits', ''], [0.3, 'hit', 'hits', ' hard'],
  [0.5, 'smash', 'smashes', ''], [9, 'devastate', 'devastates', '']];
Object.assign(D, { rnd, cap, DIRS, need, NOBODY, roll, KP_DEFAULT });

class Room extends GameObject {
  constructor(path, def) { super(); this.path = path; this.configure(def); }
  configure(def) {
    this.def = def; this.name = this.short = def.name; this.long = def.long; this.exits = def.exits || {};
    this.area = def.area; this.terrain = def.terrain || 'concrete'; this.x = def.x; this.y = def.y; this.z = def.z || 0; this.nodes = { ...(def.res || {}) };
  }
  reset() { // LPMud-style reset(): respawn missing monsters and floor items, refill resource nodes
    this.nodes = { ...(this.def.res || {}) };
    const have = (key, id) => this.inv.some((o) => o[key] === id);
    const count = (key, id) => this.inv.filter((o) => o[key] === id).length;
    const want = (list) => list.reduce((m, id) => (m[id] = (m[id] || 0) + 1, m), {});
    const homed = (id) => { let c = 0; for (const o of D.objects.values()) if (o.mobId === id && o.home === this) c++; return c; }; // wanderers still count toward their home room
    for (const [id, n] of Object.entries(want(this.def.mobs || []))) for (let i = homed(id); i < n; i++) { const m = D.cloneMob(id); m.home = this; m.move(this); }
    for (const [id, n] of Object.entries(want(this.def.items || []))) for (let i = count('itemId', id); i < n; i++) D.cloneItem(id).move(this);
    for (const [id, n] of Object.entries(D.Q.NPCS)) if (n.room === this.path && !this.inv.some((o) => o.npcId === id)) new Npc(id, n).move(this);
  }
  fx(evt) { for (const o of this.inv) if (o.isPlayer) o.send({ t: 'fight', ...evt }); }
  look(p) {
    p.msg(this.name, 'rname'); p.msg(this.long, 'text');
    const ex = Object.keys(this.exits).map((d) => DIRS[d]).join(', ');
    p.msg(`Exits: ${ex || 'none'}. Ground: ${this.terrain}.`, 'exits');
    const things = this.inv.filter((o) => !o.isLiving && !o.isNpc).map((o) => o.short);
    if (things.length) p.msg('You see: ' + things.join(', ') + '.', 'items');
    const nodes = Object.entries(this.nodes).filter(([, n]) => n > 0).map(([r, n]) => `${r} x${n}`);
    if (nodes.length) p.msg('Resources here: ' + nodes.join(', ') + (this.def.forge ? ', a working forge' : '') + '.', 'items'); else if (this.def.forge) p.msg('A working forge is here.', 'items');
    if (this.def.board) p.msg('A quest board hangs here. Type `board` to read it.', 'items');
    for (const o of this.inv) if (o.isNpc) p.msg(`${o.name} is here. (talk ${o.ids[1]})`, 'living');
    const npc = this.inv.find((o) => o.isNpc); if (npc && p.sendPortrait) p.sendPortrait(npc.name, npc.npcId);
    for (const o of this.inv) if (o.isLiving && o !== p) p.msg(o.isPlayer ? `${o.name} is here.` : `${cap(o.short)} (level ${o.level}) is here${o.enemy ? ', fighting' : ''}.`, 'living');
  }
}

class Npc extends GameObject {
  constructor(id, def) { super(); this.npcId = id; this.def = def; this.isNpc = true; this.name = def.name; this.short = def.name; this.long = def.long; this.ids = [id, ...def.name.toLowerCase().split(' ')]; }
}

class Item extends GameObject {
  constructor(id, def) {
    super(); this.itemId = id; this.def = def; this.name = def.name; this.ids = def.ids || [];
    this.short = def.short || art(def.name); this.long = def.long || ''; this.type = def.type; this.dmg = def.dmg; this.ac = def.ac || 0;
    this.slot = def.slot; this.fixed = !!def.fixed; this.actions = def.actions || {};
    if (this.fixed) this.short = def.short || art(def.name);
  }
}

class Living extends GameObject {
  constructor() {
    super(); this.isLiving = true; this.level = 1; this.str = 10; this.dex = 10; this.con = 10;
    this.hp = 30; this.maxhp = 30; this.enemy = null; this.equip = {}; this.icon = '❔'; this.beats = 0; this.fx = []; this.cd = {};
    D.heartBeat(this);
  }
  msg() {}
  the() { return this.isPlayer || /^(the |[A-Z])/.test(this.name) ? this.name : 'the ' + this.name; }
  ac() { return Object.values(this.equip).reduce((a, i) => a + i.ac, 0) + (this.natAc || 0) + this.fxVal('ac') + (this.cyberVal ? this.cyberVal('ac') : 0); }
  atkPool() { return 5 + Math.floor(this.level * 0.5) + Math.floor(this.dex / 4) + this.fxVal('pool') + Math.floor(this.fxVal('crit') * 10) + (this.cyberVal ? this.cyberVal('pool') : 0) + Math.floor((this.remort || 0) / 4); }
  defPool() { return 2 + Math.floor(this.level * 0.25) + Math.floor(this.dex / 6) + Math.floor(this.ac() / 5) + Math.floor(this.fxVal('evade') * 20) + Math.floor((this.remort || 0) / 4); }
  hurt(d) { // Luck: a player may spend a Luck point to halve a blow that would kill them
    if (this.isPlayer && d >= this.hp && this.luck > 0) { this.luck--; d = Math.floor(d / 2); this.msg('Luck holds! You ride out the blow, halving the damage.', 'win'); }
    this.hp -= d; return d;
  }
  fxVal(k) { return this.fx.reduce((s, e) => s + (e[k] || 0), 0); }
  addFx(e) { this.fx = this.fx.filter((x) => !(x.k === e.k && x.n === e.n)); this.fx.push(e); }
  weapon() { return this.equip.weapon ? this.equip.weapon.dmg : this.natDmg || [1, 3]; }
  info() { return { id: this.id, name: cap(this.name), hp: Math.max(0, this.hp), max: this.maxhp, lvl: this.level, k: this.isPlayer ? 'p' : 'm', icon: this.icon }; }
  engage(t) { if (this.env.def.safe) return false; this.enemy = t; if (t.isPlayer && this.mobId) t.sendPortrait(this.name, 'mob_' + this.mobId); return true; }
  tickFx() { // damage/heal over time, summons, expiry. Returns false if this object died.
    for (const e of [...this.fx]) {
      const src = e.src && D.objects.has(e.src.id) ? e.src : NOBODY;
      if (e.k === 'dot') {
        const d = rnd(...e.dmg); this.hp -= d;
        if (this.env) this.env.fx({ a: src.info(), b: this.info(), dmg: d, hit: true, spell: { n: e.n, i: '☠️', c: '#8fd14f' } });
        this.msg(`${e.n} burns you. (${d})`, 'hurt');
        if (this.hp <= 0) { this.die(src); return false; }
      } else if (e.k === 'hot') this.hp = Math.min(this.maxhp, this.hp + e.heal);
      else if (e.k === 'buff' && e.regen) this.hp = Math.min(this.maxhp, this.hp + e.regen);
      else if (e.k === 'summon' && this.enemy && this.enemy.env === this.env && this.enemy.hp > 0) {
        const t = this.enemy, d = Math.max(1, Math.round(rnd(...e.sdmg) * (e.mul || 1)) + Math.floor(this.level / 2) - rnd(0, Math.floor(t.ac() / 2))); t.hp -= d;
        this.env.fx({ a: this.info(), b: t.info(), dmg: d, hit: true, spell: { n: e.n, i: e.i, c: '#cfd8dc' } });
        this.msg(`Your ${e.n} strikes ${t.the()}. (${d})`, 'spell'); if (t.hp <= 0) t.die(this);
      }
      if (--e.ticks <= 0) { this.fx = this.fx.filter((x) => x !== e); if (e.k === 'buff' || e.k === 'summon') this.msg(`${e.n} fades.`, 'sys'); }
    }
    return true;
  }
  heart_beat() {
    if (!this.env || !D.objects.has(this.id)) return; // destroyed earlier in this same tick
    const stunned = this.fx.some((e) => e.k === 'stun');
    if (!this.tickFx()) return;
    if (this.enemy && (this.enemy.env !== this.env || this.enemy.hp <= 0)) this.enemy = null;
    if (stunned) { this.msg('You are stunned and cannot act!', 'hurt'); return; }
    if (this.enemy) return this.fight(this.enemy);
    if (this.hp < this.maxhp && this.beats++ % 2 === 0) this.hp = Math.min(this.maxhp, this.hp + 1 + Math.floor(this.con / 6) + (this.env && (this.env.def.inn || this.env.def.camp) ? 5 : 0));
    this.idle();
  }
  idle() {}
  fight(t) {
    const a = roll(this.atkPool()), d = roll(t.defPool()), net = a.h - d.h, hit = net > 0 && !a.f;
    let dmg = 0, crit = false, vi = 0;
    if (hit) { // net hits add damage; six or more net hits is a critical
      const [lo, hi] = this.weapon(); dmg = rnd(lo, hi) + Math.floor(this.str / 5) + this.fxVal('atk') + (this.cyberVal ? this.cyberVal('dmg') : 0);
      dmg = Math.floor(dmg * (1 + 0.06 * Math.min(net - 1, 8))); crit = net >= 6; if (crit) dmg = Math.floor(dmg * 1.4);
      dmg = Math.max(1, dmg - rnd(0, Math.floor(t.ac() * 0.6))); vi = VERBS.findIndex((v) => dmg / t.maxhp < v[0]);
      dmg = t.hurt(dmg);
    }
    if (!t.enemy && t.hp > 0) t.engage(this);
    if (t.isPlayer && t.autoflee && t.hp > 0) t.autoFleeCheck();
    const [, v2, v3, adv] = VERBS[vi] || [], c = crit ? ' Critical hit!' : '';
    if (hit) {
      this.msg(`You ${v2} ${t.the()}${adv}.${c} (${dmg})`, 'combat');
      t.msg(`${cap(this.the())} ${v3} you${adv}.${c} (${dmg})`, 'hurt');
      this.env.tell(`${cap(this.the())} ${v3} ${t.the()}${adv}.`, [this, t], 'combat2');
    } else if (a.f) {
      this.msg(`You fumble your attack on ${t.the()}!`, 'miss'); t.msg(`${cap(this.the())} fumbles the attack.`, 'miss');
    } else {
      this.msg(`You miss ${t.the()}.`, 'miss'); t.msg(`${cap(this.the())} misses you.`, 'miss');
    }
    this.env.fx({ a: this.info(), b: t.info(), dmg, hit, crit });
    if (t.hp <= 0) t.die(this);
  }
}
Room.prototype.tell = function (msg, except, c = 'text') {
  const ex = Array.isArray(except) ? except : [except];
  for (const o of this.inv) if (o.isPlayer && !ex.includes(o)) o.msg(msg, c);
};

class Monster extends Living {
  constructor(id, def) {
    super(); this.mobId = id; this.def = def; this.name = def.name; this.short = /^(the |[A-Z])/.test(def.name) ? def.name : art(def.name); this.ids = def.ids || [];
    Object.assign(this, { level: def.level, str: def.str, dex: def.dex, con: def.con, hp: def.hp, maxhp: def.hp, natDmg: def.dmg, natAc: def.ac, xp: def.xp, icon: def.icon });
    this.long = `A ${def.name}. It looks ready to fight.`;
  }
  idle() {
    const env = this.env; if (!env || env.def.safe) return;
    if (this.def.aggro) {
      const t = env.inv.find((o) => o.isPlayer);
      if (t) { env.tell(`${cap(this.the())} attacks ${t.name}!`, null, 'combat2'); this.engage(t); return this.fight(t); }
    }
    if (this.def.wander && Math.random() < 0.12) {
      const opts = Object.values(env.exits).map((p) => D.rooms.get(p)).filter((r) => r && r.area === env.area && !r.def.safe);
      if (opts.length) { env.tell(`${cap(this.the())} wanders off.`); this.move(opts[rnd(0, opts.length - 1)]); this.env.tell(`${cap(this.short)} wanders in.`); D.pushMaps(); }
    }
  }
  die(killer) {
    killer = killer && D.objects.has(killer.id) ? killer : NOBODY;
    this.env.tell(`${cap(this.the())} dies.`, killer, 'combat'); killer.msg(`You have slain ${this.the()}!`, 'win');
    if (killer.isPlayer && this.def.legend && Math.random() < this.def.legend.chance) D.legendFound(killer, this, this.def.legend.item);
    for (const [id, p] of this.def.drops || []) if (Math.random() < p) { const it = D.cloneItem(id); it.move(this.env); killer.msg(`${cap(this.the())} dropped ${it.short}.`, 'items'); }
    this.env.fx({ a: killer.info(), b: { ...this.info(), hp: 0 }, dmg: 0, hit: false, dead: true });
    const g = rnd(...(this.def.gold || [this.level * 2, this.level * 5]));
    const mates = killer.isPlayer ? D.teamHere(killer) : [killer], n = mates.length, share = 1 + 0.1 * (n - 1); // a team splits credits and XP (with a 10% bonus per extra member) among members in the room
    if (killer.isPlayer) for (const m of mates) { const got = Math.round(g * share / n * (1 + 0.02 * m.cyberVal('charm'))); m.gold += got; m.msg(n > 1 ? `You loot ${got} credits (your share of the team's loot).` : `You loot ${got} credits.`, 'items'); } // Charm implants improve loot
    killer.enemy = null; for (const m of mates) { if (m.enemy === this) m.enemy = null; if (m.gainXp) m.gainXp(Math.max(1, Math.round(this.xp * share / n))); }
    if (killer.isPlayer) { for (const m of mates) { D.qEvent(m, 'kill', this.mobId); D.tutEvent(m, 'kill'); } if (this.def.boss) { D.gossip(`${killer.name} has slain ${this.name}!`); D.tweet(`${killer.name} has slain ${this.name}!`, 'boss'); } }
    if (this.bounty && D.bounty) D.bounty.claim(this, killer, mates);
    const room = this.env; this.destroy(); D.callOut(() => room.reset(), 20000);
  }
}

class Player extends Living {
  constructor(name, cls = 'barbarian') {
    super(); this.isPlayer = true; this.name = name; this.short = name; this.ids = [name.toLowerCase()];
    this.cls = D.K.CLASSES[cls] ? cls : 'barbarian'; this.gender = 'nonbinary'; this.bounty = 0; this.bounties = 0; this.gag = false; this.triggers = []; this.tut = { off: false, seen: false, step: 0, done: {} }; this.team = null; this.autoflee = false; this.aliases = {}; this.kpOn = false; this.kpMap = { ...KP_DEFAULT }; this.notify = true; this.skills = {}; this.bag = {}; this.bagMode = 'loot'; this.tools = {}; this.remort = 0; this.luck = 3; this.cyber = []; this.xp = 0; this.gold = 25; this.quests = {}; this.qdone = new Set(); this.qp = 0; this.gos = true; this.visited = new Set(); this.wiz = false; this.send = () => {};
    this.recalc(); this.hp = this.maxhp; this.mp = this.maxmp; D.ensureKit(this);
  }
  klass() { return D.K.CLASSES[this.cls] || D.K.CLASSES.barbarian; }
  cyberVal(k) { return this.cyber.reduce((s, id) => s + (((D.W.items[id] || {}).bonus || {})[k] || 0), 0) + Object.values(this.equip).reduce((s, i) => s + ((((i && i.def) || {}).bonus || {})[k] || 0), 0); } // chrome plus equipped gear bonuses
  aura() { return Math.max(0, +(6 - this.cyber.reduce((s, id) => s + ((D.W.items[id] || {}).aura || 0), 0)).toFixed(2)); } // chrome erodes aura, and aura powers magic
  maxLuck() { return 3 + Math.floor(this.level / 10) + Math.floor(this.cyberVal('will') / 2); }
  xpNeed(l) { return Math.round(need(l) * (1 + 0.1 * this.remort)); } // each remort makes levelling 10% slower
  attrs() { const k = this.klass(), L = this.level; return { Brawn: this.str, Reflex: this.dex, Grit: this.con, Mind: 6 + Math.floor(L * 0.6) + Math.floor(k.mpl / 3) + this.cyberVal('mind'), Will: 6 + Math.floor(L * 0.5) + k.rg * 2 + this.cyberVal('will'), Charm: 6 + Math.floor(L * 0.4) + (this.cls === 'bard' ? 4 : 0) + this.cyberVal('charm') }; }
  cap() { return this.cls === 'scavenger' ? 30 : 15; }
  recalc() {
    const k = this.klass(), L = this.level; this.icon = k.icon;
    this.str = 10 + Math.floor(L * 0.8) + k.str + this.cyberVal('str'); this.dex = 10 + Math.floor(L * 0.5) + k.dex + this.cyberVal('dex'); this.con = 10 + Math.floor(L * 0.7) + k.con + this.cyberVal('con');
    const rm = 1 + 0.04 * (this.remort || 0); // each remort adds 4% to maximum health and mana
    this.maxhp = Math.round((30 + L * k.hpl + this.con * 2 + this.cyberVal('hp')) * rm); this.maxmp = Math.round((15 + L * k.mpl + this.cyberVal('mp') + this.cyberVal('mind') * 4) * clamp(this.aura() / 6, 0.15, 1) * rm); this.mp = Math.min(this.mp || 0, this.maxmp);
    this.long = `${this.name}, a level ${L} ${this.gender === 'nonbinary' ? 'nonbinary' : this.gender} ${k.name}.`;
  }
  sendQuests() {
    const list = D.Q.QUESTS.filter((q) => this.quests[q.id]).map((q) => { // only accepted quests, with everything the quest window needs
      const g = D.Q.NPCS[q.giver] || {}, room = D.rooms.get(g.room), r = q.rew;
      return { id: q.id, name: q.name, ready: D.qReady(this, q), giver: g.name || '', where: room ? room.name : '', text: q.text, min: q.min,
        rew: { xp: D.qXp(this, q), credits: r.gold || 0, qp: r.qp || 0, items: (r.items || []).map((i) => (D.W.items[i] || {}).name || i) },
        obj: q.obj.map((o, i) => ({ t: D.objText(o), c: D.qCur(this, q, i), n: D.qNeed(o) })) };
    });
    this.send({ t: 'quests', list });
  }
  sendPortrait(name, id) { this.send({ t: 'portrait', name, img: D.portraitFor ? D.portraitFor(id) : null }); }
  pron() { return this.gender === 'male' ? { s: 'he', o: 'him', p: 'his' } : this.gender === 'female' ? { s: 'she', o: 'her', p: 'her' } : { s: 'they', o: 'them', p: 'their' }; }
  tutEvent(key) { D.tutEvent(this, key); }
  sendTriggers() { this.send({ t: 'triggers', list: this.triggers }); }
  sendTut(auto) { const open = !!auto && !this.tut.seen && !this.tut.off && this.level <= 5; if (open) this.tut.seen = true; this.send({ t: 'tut', off: this.tut.off, step: this.tut.step, done: this.tut.done, open }); }
  sendKeypad() { this.send({ t: 'keypad', on: this.kpOn, map: this.kpMap }); }
  autoFleeCheck() { // autoflee: run when health drops to 30% or below
    if (!this.autoflee || !this.enemy || this.hp <= 0 || this.hp > this.maxhp * 0.3 || Date.now() - (this.fleeTry || 0) < 900) return;
    this.fleeTry = Date.now(); this.msg('Autoflee: you are at 30% health or less!', 'hurt'); D.command(this, 'flee');
  }
  sendSpells() {
    this.send({ t: 'spells', cls: this.klass().name, level: this.level, list: (D.K.SPELLS[this.cls] || []).map(({ k, n, lvl, mp, i, c, d, school }) => ({ k, n, lvl, mp, i, c, d, school })) });
  }
  msg(m, c = 'text') { if (c === 'miss' && this.gag) return; this.send({ t: 'text', m, c }); } // `gag on` hides misses and fumbles
  gainXp(n) {
    this.xp += n; this.msg(`You gain ${n} experience.`, 'sys');
    while (this.level < 40 && this.xp >= this.xpNeed(this.level)) { this.level++; this.recalc(); D.announce(`${this.name} has gained a level and is now level ${this.level}!`, this.level % 10 === 0 ? 'milestone' : 'level'); this.hp = this.maxhp; this.mp = this.maxmp; this.luck = this.maxLuck(); this.send({ t: 'sound', k: 'levelup' }); this.msg(`*** You reach level ${this.level}! You feel stronger. ***`, 'win');
      for (const s of D.K.SPELLS[this.cls] || []) if (s.lvl === this.level) this.msg(`New ability unlocked: ${s.n} (${s.d})`, 'win'); this.sendSpells(); }
  }
  die(killer) {
    this.send({ t: 'sound', k: 'death' }); this.msg('You have died. Your vision fades to static...', 'hurt'); this.lastDeath = this.env.path; this.deaths = (this.deaths || 0) + 1; D.taunt(this);
    this.env.tell(`${this.name} has been slain by ${killer.the()}!`, this, 'combat');
    this.xp = Math.floor(this.xp * 0.9); this.hp = Math.ceil(this.maxhp / 2); this.enemy = null; killer.enemy = null; this.fx = [];
    this.move(D.rooms.get(D.W.start)); this.msg('You wake in Ashfall, bruised but alive.', 'sys');
    this.env.look(this); D.pushMaps();
  }
  enter(room, quiet) {
    this.move(room); this.visited.add(room.path); D.qEvent(this, 'visit', room.path); if (!quiet) room.look(this);
    D.pushMaps(); this.sendStats();
  }
  sendStats() {
    const w = this.equip.weapon;
    this.send({ t: 'stats', name: this.name, ic: this.klass().icon, rm: this.remort, ck: this.cls, gd: this.gender, gold: this.gold, qp: this.qp, lk: this.luck, mlk: this.maxLuck(), aura: this.aura(), cls: this.klass().name, mp: this.mp, mmp: this.maxmp, fx: this.fx.filter((e) => e.k !== 'hot' || e.ticks > 0).map((e) => ({ n: e.n, k: e.k, t: e.ticks })), level: this.level, hp: this.hp, max: this.maxhp, xp: this.xp, lo: this.level > 1 ? this.xpNeed(this.level - 1) : 0, hi: this.xpNeed(this.level), ac: this.ac(), wpn: w ? w.name : 'bare hands', wiz: this.wiz });
  }
  heart_beat() {
    super.heart_beat(); this.autoFleeCheck(); if ((this.lt = (this.lt || 0) + 1) % 45 === 0 && this.luck < this.maxLuck()) this.luck++;
    if (this.mp < this.maxmp) this.mp = Math.min(this.maxmp, this.mp + 1 + Math.floor(this.level * 0.3) + this.klass().rg + (this.env && (this.env.def.inn || this.env.def.camp) ? 3 : 0));
    this.sendStats(); if (Object.keys(this.quests).length && (this.qt = (this.qt || 0) + 1) % 3 === 0) this.sendQuests();
  }
  toRec() {
    return { bounty: this.bounty, bounties: this.bounties, gag: this.gag, triggers: this.triggers, tut: this.tut, autoflee: this.autoflee, aliases: this.aliases, kpOn: this.kpOn, kpMap: this.kpMap, notify: this.notify, bag: this.bag, bagMode: this.bagMode, tools: this.tools, skills: this.skills, remort: this.remort, gender: this.gender, luck: this.luck, cyber: this.cyber, qp: this.qp, quests: this.quests, qdone: [...this.qdone], gos: this.gos, gold: this.gold, cls: this.cls, mp: this.mp, level: this.level, xp: this.xp, hp: this.hp, wiz: this.wiz, room: this.env && this.env.path, visited: [...this.visited],
      inv: this.inv.map((i) => i.itemId), equip: Object.entries(this.equip).map(([s, i]) => [s, i.itemId]) };
  }
  load(rec) {
    Object.assign(this, { bounty: Math.max(0, rec.bounty | 0), bounties: Math.max(0, rec.bounties | 0), gag: !!rec.gag, autoflee: !!rec.autoflee, kpOn: !!rec.kpOn, notify: rec.notify !== false, bagMode: ['loot', 'overflow', 'off'].includes(rec.bagMode) ? rec.bagMode : 'loot', skills: rec.skills && typeof rec.skills === 'object' ? rec.skills : {}, remort: Math.max(0, Math.min(40, rec.remort | 0)), gender: ['male', 'female', 'nonbinary'].includes(rec.gender) ? rec.gender : 'nonbinary', cyber: (rec.cyber || []).filter((id) => D.W.items[id]), luck: rec.luck ?? 3, cls: D.K.CLASSES[rec.cls] ? rec.cls : 'barbarian', level: rec.level || 1, xp: rec.xp || 0, gold: rec.gold ?? 25, quests: rec.quests || {}, qdone: new Set(rec.qdone || []), qp: rec.qp ?? (rec.qdone || []).reduce((s, id) => s + ((D.qDef(id) || { rew: {} }).rew.qp || 0), 0), gos: rec.gos !== false, wiz: !!rec.wiz, visited: new Set(rec.visited || []) }); this.recalc(); this.hp = clamp(rec.hp || this.maxhp, 1, this.maxhp); this.mp = clamp(rec.mp ?? this.maxmp, 0, this.maxmp);
    this.aliases = {}; for (const [k, v] of Object.entries(rec.aliases || {})) if (/^[a-z][a-z0-9_]{0,11}$/.test(k) && typeof v === 'string' && v.length <= 200) this.aliases[k] = v;
    this.triggers = D.cleanTriggers(rec.triggers); const tu = rec.tut || {}; this.tut = { off: !!tu.off, seen: !!tu.seen, step: Math.max(0, Math.min(30, tu.step | 0)), done: Object.fromEntries(Object.keys(tu.done || {}).filter((k) => /^[a-z]{2,12}$/.test(k)).map((k) => [k, 1])) };
    this.kpMap = { ...KP_DEFAULT }; for (const [k, v] of Object.entries(rec.kpMap || {})) if (k in KP_DEFAULT && typeof v === 'string') this.kpMap[k] = v.slice(0, 100);
    this.bag = {}; for (const [id, n] of Object.entries(rec.bag || {})) if (D.W.items[id] && n > 0 && D.bagUsed(this) + n <= D.bagCap(this)) this.bag[id] = Math.floor(n);
    this.tools = {}; for (const [id, t] of Object.entries(rec.tools || {})) if (D.T && D.T.TOOLS[id]) this.tools[id] = { uses: Math.max(0, t.uses | 0) }; D.ensureKit(this);
    for (const id of rec.inv || []) if (D.W.items[id]) D.cloneItem(id).move(this);
    for (const [slot, id] of rec.equip || []) { const it = this.inv.find((i) => i.itemId === id && !Object.values(this.equip).includes(i)); if (it) this.equip[slot] = it; }
  }
}

// ---- factories, map payloads, world loader ----
D.cloneItem = (id) => new Item(id, D.W.items[id]);
D.cloneMob = (id) => new Monster(id, D.W.mobs[id]);
D.loadWorld = () => { // also used by the wizard `update` command to hot-reload world.js and classes.js
  D.K = D.fresh('./classes'); D.Q = D.fresh('./quests'); D.T = D.fresh('./tradeskills'); D.W = D.fresh('./world');
  for (const [path, def] of Object.entries(D.W.rooms)) { const r = D.rooms.get(path); if (r) r.configure(def); else D.rooms.set(path, new Room(path, def)); }
  for (const [path, r] of [...D.rooms]) { // rooms deleted in the builder disappear; anyone inside is moved to the start room
    if (D.W.rooms[path]) continue;
    for (const o of [...r.inv]) { if (o.isPlayer) o.enter(D.rooms.get(D.W.start)); }
    D.rooms.delete(path); r.destroy();
  }
  for (const r of D.rooms.values()) r.reset();
};
D.mapFor = (p) => {
  const z = p.env.z, rooms = [];
  for (const path of p.visited) {
    const r = D.rooms.get(path); if (!r || r.z !== z) continue;
    rooms.push({ p: path, x: r.x, y: r.y, n: r.name, t: r.terrain, ex: Object.entries(r.exits).map(([d, to]) => ({ d, to })) });
  }
  const others = [...D.players.values()].filter((o) => o !== p && o.env).map((o) => o.env.path);
  const mobs = p.env.inv.filter((o) => o.isLiving && !o.isPlayer).length;
  return { t: 'map', z, rooms, me: p.env.path, others, mobs, area: D.AREA_LABEL[p.env.area] || cap(p.env.area) };
};
D.pushMaps = () => { for (const p of D.players.values()) if (p.env) p.send(D.mapFor(p)); };
// ---- bag of holding and bound tools: automatic for every character, never droppable or sellable, saved with the player ----
D.bagCap = (p) => 60 + 20 * (p.remort || 0); // each remort adds room
D.bagUsed = (p) => Object.values(p.bag).reduce((a, b) => a + b, 0);
D.ensureKit = (p) => { if (D.T) for (const id of Object.keys(D.T.TOOLS)) if (!p.tools[id]) p.tools[id] = { uses: 0 }; if (!p.bag) p.bag = {}; };
const isWorn = (p, it) => Object.values(p.equip).includes(it);
D.itemCount = (p, id) => p.inv.filter((i) => i.itemId === id && !isWorn(p, i)).length + (p.bag[id] || 0);
D.itemTake = (p, id, n) => { // take n from the pack first, then the bag; all or nothing
  if (D.itemCount(p, id) < n) return false;
  for (const it of p.inv.filter((i) => i.itemId === id && !isWorn(p, i))) { if (n <= 0) break; it.destroy(); n--; }
  if (n > 0) { p.bag[id] -= n; if (p.bag[id] <= 0) delete p.bag[id]; }
  return true;
};
D.legendFound = (p, mob, id) => { // a boss gave up its unique item: tell the finder and the whole MUD
  const d = D.W.items[id]; D.give(p, id, 'normal'); p.msg(`*** LEGENDARY FIND: ${d.name}! It is worth ${d.value.toLocaleString('en-US')} credits to a buyer. ***`, 'win'); for (const o of D.players.values()) o.send({ t: 'sound', k: 'legend' }); // everyone hears a legendary find
  D.announce(`\u2605 ${p.name} has discovered the legendary ${d.name}, taken from ${mob.the()}!`, 'legend');
};
D.tweet = (text, kind) => { try { require('./tweet').post(text, kind); } catch (e) { D.log('tweet:', e.message); } }; // X/Twitter posting (see tweet.js)
D.cleanTriggers = (list) => (Array.isArray(list) ? list : []).slice(0, 30).map((t) => ({ pat: String((t && t.pat) || '').slice(0, 80), cmd: String((t && t.cmd) || '').replace(/[\u0000-\u001f]/g, '').slice(0, 100), hl: !!(t && t.hl), on: !(t && t.on === false) })).filter((t) => t.pat);
D.setTriggers = (p, m) => { p.triggers = D.cleanTriggers(m.list); p.sendTriggers(); };
D.tutEvent = (p, key) => { if (!p.tut || p.tut.off || p.tut.done[key]) return; p.tut.done[key] = 1; p.send({ t: 'tut', done: p.tut.done }); }; // newbie tutorial progress
D.tutMsg = (p, m) => { if (m.reset) { p.tut = { off: false, seen: true, step: 0, done: {} }; } if (m.off !== undefined) p.tut.off = !!m.off; if (m.step !== undefined) p.tut.step = Math.max(0, Math.min(30, m.step | 0)); p.send({ t: 'tut', off: p.tut.off, step: p.tut.step, done: p.tut.done, open: !!m.open }); };
D.teamMsg = (t, text, cls = 'team') => { for (const n of t.members) { const m = D.players.get(n); if (m) m.msg(text, cls); } };
D.teamHere = (p) => { const t = p.team; if (!t) return [p]; const here = t.members.map((n) => D.players.get(n)).filter((m) => m && m.env === p.env && m.hp > 0); return here.includes(p) ? here : [p, ...here]; };
D.teamLeave = (p, why) => { // leave a team (or drop off it when disconnecting); the team disbands when one member is left
  const t = p.team; if (!t) return; t.members = t.members.filter((n) => n !== p.name); p.team = null; if (why !== 'disconnected') p.msg('You leave the team.', 'team');
  if (t.members.length <= 1) { for (const n of t.members) { const o = D.players.get(n); if (o) { o.team = null; o.msg('Your team has disbanded.', 'team'); } } return; }
  if (t.leader === p.name) t.leader = t.members[0]; D.teamMsg(t, `${p.name} ${why === 'disconnected' ? 'went offline and left' : 'left'} the team. ${t.leader} leads.`);
};
D.give = (p, id, how) => { // where a new item goes: loot-like items go to the bag first (bag mode "loot"), otherwise the pack, overflowing to the bag
  const def = D.W.items[id], room = D.bagCap(p) - D.bagUsed(p), lootish = how === 'loot' && ['material', 'weapon', 'armor'].includes(def.type);
  if (lootish && p.bagMode === 'loot' && room > 0) { p.bag[id] = (p.bag[id] || 0) + 1; return 'bag'; }
  if (p.inv.length < p.cap()) { D.cloneItem(id).move(p); return 'pack'; }
  if (p.bagMode !== 'off' && room > 0) { p.bag[id] = (p.bag[id] || 0) + 1; return 'bag'; }
  D.cloneItem(id).move(p.env); return 'floor';
};
D.takeFloor = (p, it) => { // picking up an item from the floor
  if (!it.itemId) return false;
  const room = D.bagCap(p) - D.bagUsed(p), lootish = ['material', 'weapon', 'armor'].includes(it.type);
  if ((lootish && p.bagMode === 'loot' && room > 0) || (p.inv.length >= p.cap() && p.bagMode !== 'off' && room > 0)) { p.bag[it.itemId] = (p.bag[it.itemId] || 0) + 1; it.destroy(); return 'bag'; }
  if (p.inv.length < p.cap()) { it.move(p); return 'pack'; }
  return false;
};
D.announce = (text, kind) => { if (D.tweet) D.tweet(text, kind); for (const p of D.players.values()) p.msg('📣 ' + text, 'announce'); if (D.bridge && D.bridge.wantsAnnouncements()) D.bridge.out('📣 ' + text); }; // mud-wide announcements
D.presence = (p, kind) => { // everyone online hears when a player logs in or out (players can mute it with `notify off`)
  const who = `${p.name} (${p.remort ? `Remort ${p.remort}, ` : ''}L${p.level} ${p.klass().name})`, text = `${who} has logged ${kind === 'in' ? 'in' : 'out'}.`;
  for (const o of D.players.values()) if (o !== p && !o.isBot && o.notify !== false) o.msg('🔔 ' + text, 'notify');
  if (D.bridge && D.bridge.wantsPresence()) D.bridge.out('🔔 ' + text);
};
Object.assign(D, { Room, Item, Living, Monster, Player, Npc });
module.exports = D;
