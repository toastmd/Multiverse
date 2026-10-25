'use strict';
const D = require('./driver');
const { GameObject } = D;
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const cap = (s) => String(s).replace(/^(\u27e6#[0-9a-fA-F]{6}\|)?([\s\S])/, (m, a, b) => (a || '') + b.toUpperCase()); // capitalises the first real letter even when it is inside a colour token
const TOKEN = /\u27e6(#[0-9a-fA-F]{6})\|([^\u27e7]*)\u27e7/g; // item colours travel as \u27e6#rrggbb|text\u27e7 and the client paints them
const RAINBOW = ['#ff5a4a', '#ffb347', '#ffe066', '#7be07a', '#19e3ff', '#7aa2ff', '#c77dff', '#ff7ad9', '#ffd34a'];
const rainbow = (w) => [...w].map((ch, i) => `\u27e6${RAINBOW[i % RAINBOW.length]}|${ch}\u27e7`).join('');
D.stripColor = (s) => String(s).replace(TOKEN, '$2');
D.rainbow = rainbow;
D.colorFor = (def) => { // the colour of an item by what it is: wood brown, healing red, mana blue, ...
  if (!def || def.short && /\u27e6/.test(def.short)) return ''; const n = `${def.id || ''} ${def.name || ''}`.toLowerCase(), t = def.type;
  if (def.legend) return '#ff7ad9'; if (/apple/.test(n)) return '#ff5a4a'; if (def.smoke || /cigar/.test(n)) return '#9c6b3a';
  if (t === 'potion') { if (/steak|jerky|chili|stew|feast|banquet|chowder|noodle|trout|whiskey|sarsaparilla|coffee|cola/.test(n)) return /whiskey/.test(n) ? '#d49a3a' : '#b5833f'; if (/lemon/.test(n)) return '#7be07a'; if (/energy/.test(n)) return '#e8ff4a'; if (/shake/.test(n)) return '#ff9ac8'; if (/burger|hot ?dog|chili ?dog|nugget|fries|sandwich/.test(n)) return '#e0a45a'; if (/holy/.test(n)) return '#fff3b0';
    return def.heal ? '#ff5a4a' : '#5aa0ff'; } // healing (and stims, which also restore mana) red, mana blue
  if (/staff|stick|club|bat\b|wood|branch|bow\b|cane|driver|hockey|oak|plank|paddle|lance|spear|rod\b|handle|cudgel|truncheon/.test(n)) return '#b5833f';
  if (t === 'weapon') return /gun|revolver|rifle|pistol|injector|cannon|blaster|shotgun|nail/.test(n) ? '#9aa7b3' : '#cfd8dc';
  if (t === 'armor') return /leather|hide|jerkin|vest|boots|cap\b|skin|fur|hoodie/.test(n) ? '#c89b5a' : /robe|cloak|coat|suit|blazer|cloth|silk|wool|scarf/.test(n) ? '#b39ddb' : '#9fb2c0';
  if (t === 'cyber') return '#19e3ff'; if (t === 'treasure') return '#ffd34a'; if (/ore|iron|steel|metal|scrap/.test(n)) return '#a0a8b0'; if (/herb|leaf|bloom|moss|weed/.test(n)) return '#6fdc6f'; if (/fish|trout|bass|eel/.test(n)) return '#6fb7ff'; if (/bone|tooth|fang|skull/.test(n)) return '#ece6d2'; if (/gem|amber|crystal/.test(n)) return '#ffb347';
  return '';
};
D.cn = (def, text) => { const c = D.colorFor(def); return c ? `\u27e6${c}|${text}\u27e7` : text; };
const DIRS = { n: 'north', s: 'south', e: 'east', w: 'west', u: 'up', d: 'down', ne: 'northeast', nw: 'northwest', se: 'southeast', sw: 'southwest', in: 'in', out: 'out' }; // `in` and `out` are for doorways; `out` also leaves a dead-end room by its only exit
const NOBODY = { id: 0, name: 'something', enemy: null, msg() {}, the() { return 'something'; }, info() { return { id: 0, name: '?', hp: 0, max: 1, lvl: 1, k: 'p', icon: '' }; } };
const art = (n) => (/^[aeiou]/i.test(n) ? 'an ' : 'a ') + n;
// Dice pools: roll n six-sided dice; a 5 or 6 is a "hit". More than half ones with no hits is a fumble.
const roll = (n) => { n = Math.max(1, Math.round(n)); let h = 0, ones = 0; for (let i = 0; i < n; i++) { const d = rnd(1, 6); if (d >= 5) h++; else if (d === 1) ones++; } return { h, f: h === 0 && ones * 2 > n }; };
const KP_DEFAULT = { Numpad1: 'southwest', Numpad2: 'south', Numpad3: 'southeast', Numpad4: 'west', Numpad5: 'look', Numpad6: 'east', Numpad7: 'northwest', Numpad8: 'north', Numpad9: 'northeast', Numpad0: 'get all', NumpadDecimal: 'heal', NumpadAdd: 'down', NumpadSubtract: 'up', NumpadMultiply: 'out', NumpadDivide: 'kill', NumpadEnter: '' };
const KP_OLD = { Numpad8: 'north', Numpad2: 'south', Numpad4: 'west', Numpad6: 'east', Numpad9: 'up', Numpad3: 'down', Numpad5: 'look', Numpad0: 'inventory', Numpad1: 'flee', Numpad7: 'score', NumpadAdd: 'spells', NumpadSubtract: 'quests', NumpadDivide: 'who', NumpadMultiply: 'bag', NumpadDecimal: 'recall', NumpadEnter: '' };
D.kpFromRec = (rec) => { const m = rec.kpMap && typeof rec.kpMap === 'object' ? rec.kpMap : {}; return rec.kpVer !== 2 && Object.keys(KP_OLD).every((k) => m[k] === undefined || m[k] === KP_OLD[k]) ? {} : m; }; // players who never changed the old keypad get the new defaults; custom keypads are kept
D.AREA_LABEL = { town: 'Ashfall Junction (Old West)', forest: 'Whisperwood (Fantasy)', crypt: 'Barrow Crypts (Fantasy)', marsh: 'Sunken Marsh (Fantasy)', road: 'Redrock Trail (Old West)', mines: 'Silverado Mines (Old West)', dunes: 'Sunscorch Dunes (Fantasy)', frost: 'Frostpeak Station (Sci-fi)', ember: 'Ember Wastes (Sci-fi)', citadel: 'Shattered Citadel (Fantasy)', cit: 'Shattered Citadel (Fantasy)', abyss: 'The Abyss (Sci-fi)', modern: 'Modern District (Modern)', cave: 'The Mammoth Caverns (Prehistoric)', buck: 'Buckstars Coffee Shop (Modern)', manor: 'Golden Years Manor (Modern)', castle: 'Castle Frankenstein (Horror)', sea: "Poseidon's Realm (Fantasy)", hades: 'Hades (Fantasy)', pluto: 'Pluto (Sci-fi)', mars: 'Mars (Sci-fi)', grounds: 'The Proving Grounds (Bots)', prime: 'The Primeval Rift (Prehistoric)', hollow: 'Nightfall Hollow (Fantasy)', bank: 'Dry Gulch Bank (Old West)', gulch: 'Tombstone Gulch (Old West)', thorn: 'Thornwild Court (Fantasy)', aurora: 'Starship Aurora (Sci-fi)', reach: 'The Drowned Reach (Fantasy)', rail: 'Brimstone Rail Yard (Old West)' };
const need = (lvl) => lvl * lvl * 50; // xp required to leave this level
// weapon styles: what you wield decides how a hit reads (clubs bash, guns shoot, blades slash, spears stab)
const STYLES = { bash: { re: /club|bat\b|mace|hammer|staff|stick|cudgel|baton|truncheon|wrench|pipe|extinguisher|putter|crowbar|tire ?iron|maul|flail|bone|pike\b.*tusk|tusk/, noun: 'swing', set: [[0.05, 'tap', 'taps', ' lightly'], [0.15, 'bash', 'bashes', ''], [0.3, 'bash', 'bashes', ' hard'], [0.5, 'smash', 'smashes', ''], [9, 'pulverize', 'pulverizes', '']] },
  shoot: { re: /gun|revolver|pistol|rifle|shotgun|blaster|cannon|carbine|derringer|musket|launcher|injector|stapler|colt|winchester|repeater|six-?shooter/, noun: 'shot', set: [[0.05, 'graze', 'grazes', ''], [0.15, 'shoot', 'shoots', ''], [0.3, 'shoot', 'shoots', ' hard'], [0.5, 'blast', 'blasts', ''], [9, 'blow away', 'blows away', '']] },
  slash: { re: /sword|blade|saber|sabre|katana|axe|scimitar|cutlass|knife|dagger|machete|claw|scalpel|letter ?opener|sickle|shiv|razor|cleaver|moonblade/, noun: 'slash', set: [[0.05, 'nick', 'nicks', ''], [0.15, 'slash', 'slashes', ''], [0.3, 'slash', 'slashes', ' hard'], [0.5, 'slice', 'slices', ''], [9, 'cleave', 'cleaves', '']] },
  stab: { re: /spear|lance|pike|rapier|stake|trident|javelin|dart|pick/, noun: 'thrust', set: [[0.05, 'prick', 'pricks', ''], [0.15, 'stab', 'stabs', ''], [0.3, 'stab', 'stabs', ' hard'], [0.5, 'impale', 'impales', ''], [9, 'skewer', 'skewers', '']] } };
const styleOf = (who) => { const w = who.equip && who.equip.weapon; if (!w) return null; const n = `${w.name || ''} ${(w.def && w.def.id) || ''}`.toLowerCase(); for (const k of ['shoot', 'stab', 'slash', 'bash']) if (STYLES[k].re.test(n)) return STYLES[k]; return null; };
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
    D.ensureShopkeeper(this); for (const [id, n] of Object.entries(D.Q.NPCS)) if (n.room === this.path && !this.inv.some((o) => o.npcId === id)) new Npc(id, n).move(this);
  }
  fx(evt) { for (const o of this.inv) if (o.isPlayer) o.send({ t: 'fight', ...evt }); }
  look(p, full) { // brief mode (`brief on`) leaves out only the long description when you move: the room name, exits, items, resources and who is here still show
    p.msg(this.name, 'rname'); if (!(p.brief && !full)) p.msg(this.long, 'text'); if (this.def.light) p.msg(this.def.light, 'brightlight'); if (this.path === 'town/square' && D.events) for (const t of D.events.decor()) p.msg(t, 'event'); if (D.taxi) { if (D.taxi.here(this.path)) p.msg(`\u{1F695} A yellow taxi idles at the curb with its door open: \`enter taxi\` (${D.taxi.FARE} credits). It leaves in ${Math.max(0, Math.ceil((D.taxi.T.until - Date.now()) / 1000))} seconds.`, 'event'); if (this.def.taxi) p.msg(D.taxi.status(), 'items'); }
    const exs = Object.entries(this.exits); p.msg(exs.length ? 'Exits' : 'Exits (none)', 'exits'); // one line per exit: the direction and the name of the room that way
    for (const [d, to] of exs) { const r = D.rooms.get(to); p.msg(`${DIRS[d]}: ${r ? r.name : 'unknown'}`, 'exits'); } p.msg(`Ground: ${this.terrain}.`, 'exits'); if (this.def.shop || this.def.exchange) p.msg("Type 'list' or 'sell'", 'shophint');
    const things = this.inv.filter((o) => !o.isLiving && !o.isNpc).map((o) => o.short);
    if (things.length) p.msg('You see: ' + things.join(', ') + '.', 'items');
    const nodes = Object.entries(this.nodes).filter(([, n]) => n > 0).map(([r, n]) => `${r} x${n}`);
    if (nodes.length) p.msg('Resources here: ' + nodes.join(', ') + (this.def.forge ? ', a working forge' : '') + '.', 'items'); else if (this.def.forge) p.msg('A working forge is here.', 'items');
    if (this.def.board) p.msg('A quest board hangs here. Type `board` to read it.', 'items');
    for (const o of this.inv) if (o.isNpc) p.msg(`${o.name} is here. (talk ${o.ids[1]})`, 'living');
    if (this.def.autoTalk && D.autoTalk && !p.isBot) setTimeout(() => D.autoTalk(p, this.def.autoTalk), 400); // a new runner is greeted with the quest offer
    const npc = this.inv.find((o) => o.isNpc); if (npc && p.sendPortrait) p.sendPortrait(npc.name, npc.npcId);
    for (const o of this.inv) if (o.isLiving && o !== p) p.msg(o.isPlayer ? `${o.name} is here.` : `${cap(o.short)} (level ${o.level}) is here${o.enemy ? ', fighting' : ''}.`, 'living');
  }
}

class Npc extends GameObject {
  constructor(id, def) { super(); this.npcId = id; this.def = def; this.isNpc = true; this.name = def.name; this.short = def.name; this.long = def.long; this.ids = [id, ...def.name.toLowerCase().split(' ')]; }
}

class Item extends GameObject {
  get short() { const s = this._short; return /\u27e6/.test(s) ? s : D.cn(this.def, s); } // coloured by D.colorFor unless it already carries its own colours
  set short(v) { this._short = v; }
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
  atkPool() { return 5 + Math.floor(this.level * 0.5) + Math.floor(this.dex / 4) + this.fxVal('pool') + Math.floor(this.fxVal('crit') * 10) + (this.cyberVal ? this.cyberVal('pool') : 0) + Math.floor((this.remort || 0) / 4) + (this.isPlayer && D.brawn(this) ? 1 + Math.floor(this.level / 10) : 0); }
  defPool() { return 2 + Math.floor(this.level * 0.25) + Math.floor(this.dex / 6) + Math.floor(this.ac() / 5) + Math.floor(this.fxVal('evade') * 20) + Math.floor((this.remort || 0) / 4); }
  hurt(d) { // Luck: a player may spend a Luck point to halve a blow that would kill them
    if (this.isPlayer && d >= this.hp && this.luck > 0) { this.luck--; d = Math.floor(d / 2); this.msg('Luck holds! You ride out the blow, halving the damage.', 'win'); }
    this.hp -= d; return d;
  }
  fxVal(k) { return this.fx.reduce((s, e) => s + (e[k] || 0), 0); }
  addFx(e) { e.max = e.ticks; this.fx = this.fx.filter((x) => !(x.k === e.k && x.n === e.n)); this.fx.push(e); } // max: the full duration, so the ENHANCEMENTS bar can drain from full
  weapon() { return this.equip.weapon ? this.equip.weapon.dmg : this.natDmg || [1, 3]; }
  info() { return { id: this.id, name: cap(this.name), hp: Math.max(0, this.hp), max: this.maxhp, lvl: this.level, k: this.isPlayer ? 'p' : 'm', icon: this.icon, mp: this.isPlayer ? '' : (D.mobPic ? D.mobPic(this.mobId) : '') }; } // mp: this monster's picture file, if you supplied one
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
    if (this.enemy) { const bw = this.isPlayer ? D.brawn(this) : null; for (let i = 0, n = bw ? bw.atk : 1; i < n && this.enemy && this.enemy.hp > 0 && this.enemy.env === this.env; i++) this.fight(this.enemy); return; } // the brawn classes strike several times a round
    if (this.hp < this.maxhp && this.beats++ % 2 === 0) this.hp = Math.min(this.maxhp, this.hp + 1 + Math.floor(this.con / 6) + (this.env && (this.env.def.inn || this.env.def.camp) ? 5 : 0) + (this.isPlayer && D.brawn(this) ? 2 + Math.floor(this.level / 5) : 0));
    this.idle();
  }
  idle() {}
  fight(t) {
    const a = roll(this.atkPool()), d = roll(t.defPool()), net = a.h - d.h, hit = net > 0 && !a.f;
    let dmg = 0, crit = false, vi = 0, smash = false;
    if (hit) { // net hits add damage; six or more net hits is a critical
      const [lo, hi] = this.weapon(); dmg = rnd(lo, hi) + Math.floor(this.str / 5) + this.fxVal('atk') + (this.cyberVal ? this.cyberVal('dmg') : 0);
      dmg = Math.floor(dmg * (1 + 0.06 * Math.min(net - 1, 8))); crit = net >= 6; if (crit) dmg = Math.floor(dmg * 1.4);
      dmg = Math.max(1, dmg - rnd(0, Math.floor(t.ac() * 0.6)));
      const bw = this.isPlayer ? D.brawn(this) : null, tb = t.isPlayer ? D.brawn(t) : null; // Juggernaut and Titan: Brute Force, Hulking, Thick Skin
      if (bw) { dmg = Math.round(dmg * bw.dmg); if (Math.random() < bw.extra) { dmg += Math.round(dmg * (bw.xlo + Math.random() * (bw.xhi - bw.xlo))); smash = true; if (bw.stun && t.addFx && Math.random() < bw.stun) t.addFx({ k: 'stun', n: 'stun', ticks: 2, src: this }); } }
      if (tb) dmg = Math.max(1, Math.round(dmg * (1 - tb.dr)));
      vi = VERBS.findIndex((v) => dmg / t.maxhp < v[0]); dmg = t.hurt(dmg);
      if (bw && bw.steal) this.hp = Math.min(this.maxhp, this.hp + Math.round(dmg * bw.steal));
    }
    if (!t.enemy && t.hp > 0) t.engage(this);
    if (t.isPlayer && t.autoheal && t.hp > 0) t.autoHealCheck(); if (t.isPlayer && t.autoflee && t.hp > 0) t.autoFleeCheck();
    const sty = styleOf(this), [, v2, v3, adv] = (sty ? sty.set : VERBS)[vi] || [], c = (crit ? ' Critical hit!' : '') + (smash ? ' SMASH!' : '');
    if (hit) {
      this.msg(`You ${v2} ${t.the()}${adv}.${c} (${dmg})`, 'combat');
      t.msg(`${cap(this.the())} ${v3} you${adv}.${c} (${dmg})`, 'hurt');
      this.env.tell(`${cap(this.the())} ${v3} ${t.the()}${adv}.`, [this, t], 'combat2');
    } else if (a.f) {
      this.msg(`You fumble your attack on ${t.the()}!`, 'miss'); t.msg(`${cap(this.the())} fumbles the attack.`, 'miss');
    } else {
      const sn = styleOf(this); this.msg(sn ? `Your ${sn.noun} misses ${t.the()}.` : `You miss ${t.the()}.`, 'miss'); t.msg(sn ? `${cap(this.the())}'s ${sn.noun} misses you.` : `${cap(this.the())} misses you.`, 'miss');
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
    if ((this.def.boss || this.def.guard) && !(env.peaceUntil > Date.now())) { // only bosses (and a boss's own bodyguards) start fights; `peace` quiets a room for a while
      const t = env.inv.find((o) => o.isPlayer);
      if (t) { env.tell(`${cap(this.the())} attacks ${t.name}!`, null, 'combat2'); this.engage(t); return this.fight(t); }
    }
    if (this.def.wander && Math.random() < 0.025) { // wanderers drift slowly
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
    if (killer.isPlayer) { for (const m of mates) { D.qEvent(m, 'kill', this.mobId); D.tutEvent(m, 'kill'); if (this.def.evkind && D.events) D.events.onKill(m, this); if (this.def.rest) m.msg(`${cap(this.the())} lets out a long, slow sigh, smiles, and fades away. Finally at rest.`, 'win'); } if (this.def.boss) { D.gossip(`${killer.name} has slain ${this.name}!`); D.tweet(`${killer.name} has slain ${this.name}!`, 'boss'); } }
    if (this.bounty && D.bounty) D.bounty.claim(this, killer, mates);
    this.destroy(); // the room refills at its next 30-minute reset
  }
}

class Player extends Living {
  constructor(name, cls = 'barbarian') {
    super(); this.isPlayer = true; this.name = name; this.short = name; this.ids = [name.toLowerCase()];
    this.cls = D.K.CLASSES[cls] ? cls : 'barbarian'; this.gender = 'nonbinary'; this.bounty = 0; this.bounties = 0; this.mute = {}; this.evk = {}; this.primeUntil = 0; this.primeReady = 0; this.title = ''; this.autokill = false; this.fwd = { on: false }; this.architect = false; this.milestones = []; this.email = ''; this.emailHidden = false; this.brief = false; this.keepBag = {}; this.gag = false; this.triggers = []; this.tut = { off: false, seen: false, step: 0, done: {} }; this.team = null; this.autoflee = false; this.aliases = {}; this.kpOn = true; this.kpMap = { ...KP_DEFAULT }; this.notify = true; this.skills = {}; this.bag = {}; this.bagMode = 'loot'; this.tools = {}; this.remort = 0; this.luck = 3; this.cyber = []; this.xp = 0; this.gold = 25; this.quests = {}; this.qdone = new Set(); this.qp = 0; this.gos = true; this.visited = new Set(); this.wiz = false; this.send = () => {};
    this.recalc(); this.hp = this.maxhp; this.mp = this.maxmp; D.ensureKit(this);
  }
  klass() { return D.K.CLASSES[this.cls] || D.K.CLASSES.barbarian; }
  cyberVal(k) { return this.cyber.reduce((s, id) => s + (((D.W.items[id] || {}).bonus || {})[k] || 0), 0) + Object.values(this.equip).reduce((s, i) => s + ((((i && i.def) || {}).bonus || {})[k] || 0), 0); } // chrome plus equipped gear bonuses
  auraMax() { return +(6 + 0.03 * Math.max(0, this.level - 1) + (this.remort || 0)).toFixed(2); } // 6.0, a little more with every level, and a full point for every remort
  aura() { return Math.max(0, +(this.auraMax() - this.cyber.reduce((s, id) => s + ((D.W.items[id] || {}).aura || 0), 0)).toFixed(2)); } // chrome erodes aura, and aura powers magic
  maxLuck() { return Math.round((3 + Math.floor(this.level / 10) + Math.floor(this.cyberVal('will') / 2)) * (D.primeOn(this) ? 1.5 : 1)); }
  xpNeed(l) { return Math.round(need(l) * (1 + 0.1 * this.remort)); } // each remort makes levelling 10% slower
  attrs() { const k = this.klass(), L = this.level; return { Brawn: this.str, Reflex: this.dex, Grit: this.con, Mind: 6 + Math.floor(L * 0.6) + Math.floor(k.mpl / 3) + this.cyberVal('mind'), Will: 6 + Math.floor(L * 0.5) + k.rg * 2 + this.cyberVal('will'), Charm: 6 + Math.floor(L * 0.4) + (this.cls === 'bard' ? 4 : 0) + this.cyberVal('charm') }; }
  cap() { return this.cls === 'scavenger' ? 30 : 15; }
  recalc() {
    const k = this.klass(), L = this.level; this.icon = k.icon;
    this.str = 10 + Math.floor(L * 0.8) + k.str + this.cyberVal('str'); this.dex = 10 + Math.floor(L * 0.5) + k.dex + this.cyberVal('dex'); this.con = 10 + Math.floor(L * 0.7) + k.con + this.cyberVal('con');
    const rm = 1 + 0.04 * (this.remort || 0), pm = D.primeOn(this) ? 1.5 : 1; // PRIME: +50% to the vitals while it burns // each remort adds 4% to maximum health and mana
    this.maxhp = Math.round((30 + L * k.hpl + this.con * 2 + this.cyberVal('hp')) * rm * pm); this.maxmp = Math.round((15 + L * k.mpl + this.cyberVal('mp') + this.cyberVal('mind') * 4) * clamp(this.aura() / 6, 0.15, 1) * rm * pm); this.mp = Math.min(this.mp || 0, this.maxmp);
    this.long = `${[D.preTitle(this), this.name].filter(Boolean).join(' ')}${this.title ? ', ' + this.title : ''}, a level ${L} ${D.genderLabel(this.gender)} ${k.name}.`;
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
  keepCounts() { const o = {}; for (const it of this.inv) if (it.kept) o[it.itemId] = (o[it.itemId] || 0) + 1; return o; }
  sendMutes() { this.send({ t: 'mutes', mute: this.mute, title: this.title, email: this.email, eh: this.emailHidden }); }
  sendTriggers() { this.send({ t: 'triggers', list: this.triggers }); }
  sendTut(auto) { const open = !!auto && !this.tut.seen && !this.tut.off && this.level <= 5; if (open) this.tut.seen = true; this.send({ t: 'tut', off: this.tut.off, step: this.tut.step, done: this.tut.done, open }); }
  sendKeypad() { this.send({ t: 'keypad', on: this.kpOn, map: this.kpMap }); }
  autoHealCheck() { // autoheal: drink or eat the best healing item at 40% health or less; ignored when you have nothing to heal with
    if (!this.autoheal || this.hp <= 0 || this.hp > this.maxhp * 0.4 || Date.now() - (this.healTry || 0) < 1500) return;
    const has = this.inv.some((i) => i.type === 'potion' && i.def.heal > 0 && !i.def.smoke) || Object.keys(this.bag).some((id) => this.bag[id] > 0 && D.W.items[id] && D.W.items[id].type === 'potion' && D.W.items[id].heal > 0 && !D.W.items[id].smoke); if (!has) return;
    this.healTry = Date.now(); this.msg('Autoheal: you are at 40% health or less!', 'win'); D.command(this, 'quaff');
  }
  autoFleeCheck() { // autoflee: run when health drops to 30% or below
    if (!this.autoflee || !this.enemy || this.hp <= 0 || this.hp > this.maxhp * 0.3 || Date.now() - (this.fleeTry || 0) < 900) return;
    this.fleeTry = Date.now(); this.msg('Autoflee: you are at 30% health or less!', 'hurt'); D.command(this, 'flee');
  }
  sendSpells() {
    this.send({ t: 'spells', cls: this.klass().name, level: this.level, list: D.spellsOf(this).map(({ k, n, lvl, mp, i, c, d, school, rem }) => ({ k, n, lvl, mp, i, c, d, school, rem })) });
  }
  msg(m, c = 'text') { if (c === 'miss' && this.gag) return; (this.recent || (this.recent = [])).push(D.stripColor(String(m)).slice(0, 200)); if (this.recent.length > 14) this.recent.shift(); this.send({ t: 'text', m, c }); } // recent: the last lines this player saw, attached to bug reports // `gag on` hides misses and fumbles
  gainXp(n) {
    this.xp += n; this.msg(`You gain ${n} experience.`, 'sys');
    while (this.level < D.MAXLV && this.xp >= this.xpNeed(this.level)) { this.level++; this.recalc(); D.announce(`${this.name} has gained a level and is now level ${this.level}!`, this.level % 10 === 0 ? 'milestone' : 'level'); this.hp = this.maxhp; this.mp = this.maxmp; this.luck = this.maxLuck(); this.send({ t: 'sound', k: 'levelup' }); this.msg(`*** You reach level ${this.level}! You feel stronger. ***`, 'win');
      for (const s of D.spellsOf(this)) if (s.lvl === this.level) this.msg(`New ability unlocked: ${s.n} (${s.d})`, 'win'); this.sendSpells(); }
  }
  die(killer) {
    if (D.deaths) D.deaths.record(this, killer); // the death tally (deaths.js)
    if (!this.isBot) D.announce(`${this.name} (level ${this.level} ${this.klass().name}) ${killer && killer !== D.NOBODY && killer.name ? `was slain by ${killer.name}` : 'has died'}${this.env ? ` in ${this.env.name}` : ''}.`, 'deaths', 'deathmsg'); // the deaths channel
    this.send({ t: 'sound', k: this.gender === 'male' ? 'deathm' : this.gender === 'female' ? 'deathf' : (Math.random() < 0.5 ? 'deathm' : 'deathf') }); this.msg('You have died. Your vision fades to static...', 'hurt'); this.lastDeath = this.env.path; this.deaths = (this.deaths || 0) + 1; D.taunt(this);
    this.env.tell(`${this.name} has been slain by ${killer.the()}!`, this, 'combat');
    this.xp = Math.floor(this.xp * 0.9); this.hp = Math.ceil(this.maxhp / 2); this.enemy = null; killer.enemy = null; this.fx = [];
    this.move(D.rooms.get(D.W.start)); this.msg('You wake in Ashfall, bruised but alive.', 'sys');
    this.env.look(this); D.pushMaps();
  }
  enter(room, quiet) {
    this.move(room); this.visited.add(room.path); D.qEvent(this, 'visit', room.path); if (room.def.sfx) { if (this._sfx !== room.path) { this._sfx = room.path; this.send({ t: 'sound', k: room.def.sfx }); } } else this._sfx = null; /* door chimes, saloon din */ if (!quiet) room.look(this);
    D.pushMaps(); this.sendStats();
  }
  sendStats() {
    const w = this.equip.weapon;
    this.send({ t: 'stats', name: this.name, ic: this.klass().icon, rm: this.remort, ck: this.cls, gd: this.gender, pic: D.playerPic ? D.playerPic(this) : '', gold: this.gold, qp: this.qp, lk: this.luck, mlk: this.maxLuck(), aura: this.aura(), amax: this.auraMax(), up: Math.floor((Date.now() - D.startedAt) / 1000), aq: !!this.anyQuest, pro: (this.remort || 0) >= 1, pa: Math.max(0, Math.ceil(((this.primeUntil || 0) - Date.now()) / 1000)), pc: Math.max(0, Math.ceil(((this.primeReady || 0) - Date.now()) / 1000)), bpts: this.bounty || 0, cls: this.klass().name, mp: this.mp, mmp: this.maxmp, fx: this.fx.filter((e) => e.k !== 'hot' || e.ticks > 0).map((e) => ({ n: e.n, k: e.k, t: e.ticks, m: e.max || e.ticks })), level: this.level, hp: this.hp, max: this.maxhp, xp: this.xp, lo: this.level > 1 ? this.xpNeed(this.level - 1) : 0, hi: this.xpNeed(this.level), ac: this.ac(), wpn: w ? w.name : 'bare hands', wiz: this.wiz });
  }
  heart_beat() {
    if (this.primeUntil && Date.now() >= this.primeUntil) { this.primeUntil = 0; this.recalc(); this.hp = Math.min(this.hp, this.maxhp); this.mp = Math.min(this.mp, this.maxmp); this.msg('PRIME fades.', 'sys'); this.sendStats(); }
    super.heart_beat(); if (this.enemy) this.autoHealCheck(); this.autoFleeCheck(); if ((this.lt = (this.lt || 0) + 1) % 45 === 0 && this.luck < this.maxLuck()) this.luck++;
    if (this.mp < this.maxmp) this.mp = Math.min(this.maxmp, this.mp + 1 + Math.floor(this.level * 0.3) + this.klass().rg + (this.env && (this.env.def.inn || this.env.def.camp) ? 3 : 0));
    this.sendStats(); if (Object.keys(this.quests).length && (this.qt = (this.qt || 0) + 1) % 3 === 0) this.sendQuests();
  }
  toRec() {
    return { fwd: this.fwd, architect: !!this.architect, milestones: this.milestones, autokill: this.autokill, evk: this.evk, brief: this.brief, email: this.email, emailHidden: this.emailHidden, keepBag: this.keepBag, keep: this.keepCounts(), seen: Date.now(), mute: this.mute, title: this.title, bounty: this.bounty, bounties: this.bounties, gag: this.gag, triggers: this.triggers, tut: this.tut, autoflee: this.autoflee, autoheal: this.autoheal, anyQuest: !!this.anyQuest, primeUntil: this.primeUntil || 0, primeReady: this.primeReady || 0, aliases: this.aliases, kpOn: this.kpOn, kpSet: !!this.kpSet, kpMap: this.kpMap, kpVer: 2, notify: this.notify, bag: this.bag, bagMode: this.bagMode, tools: this.tools, skills: this.skills, remort: this.remort, gender: this.gender, luck: this.luck, cyber: this.cyber, qp: this.qp, quests: this.quests, qdone: [...this.qdone], gos: this.gos, gold: this.gold, cls: this.cls, mp: this.mp, level: this.level, xp: this.xp, hp: this.hp, wiz: this.wiz, room: this.env && this.env.path, visited: [...this.visited],
      inv: this.inv.map((i) => i.itemId), ups: this.inv.map((i) => i.up || 0), equip: Object.entries(this.equip).map(([s, i]) => [s, i.itemId, this.inv.indexOf(i)]) };
  }
  load(rec) {
    Object.assign(this, { primeUntil: +rec.primeUntil || 0, primeReady: +rec.primeReady || 0, evk: Object.fromEntries(Object.entries(rec.evk && typeof rec.evk === 'object' ? rec.evk : {}).filter(([k, v]) => /^[a-z]{3,12}$/.test(k) && Number.isFinite(v)).map(([k, v]) => [k, Math.min(1e6, Math.max(0, v | 0))])), title: D.cleanTitle(rec.title), fwd: rec.fwd && typeof rec.fwd === 'object' ? { on: !!rec.fwd.on, email: String(rec.fwd.email || ''), pending: rec.fwd.pending || null } : { on: false }, architect: !!rec.architect, milestones: (Array.isArray(rec.milestones) ? rec.milestones : []).filter((a) => typeof a === 'string').slice(0, 40), autokill: !!rec.autokill, brief: !!rec.brief, email: D.cleanEmail(rec.email), emailHidden: !!rec.emailHidden, keepBag: Object.fromEntries(Object.keys(rec.keepBag || {}).filter((id) => D.W.items[id]).map((id) => [id, 1])), mute: { bounty: !!(rec.mute || {}).bounty, levels: !!(rec.mute || {}).levels, quests: !!(rec.mute || {}).quests, weather: !!(rec.mute || {}).weather, taunts: !!(rec.mute || {}).taunts, deaths: !!(rec.mute || {}).deaths }, bounty: Math.max(0, rec.bounty | 0), bounties: Math.max(0, rec.bounties | 0), gag: !!rec.gag, autoflee: !!rec.autoflee, autoheal: !!rec.autoheal, anyQuest: !!rec.anyQuest, kpOn: rec.kpSet ? !!rec.kpOn : true, kpSet: !!rec.kpSet, notify: rec.notify !== false, bagMode: ['loot', 'overflow', 'off'].includes(rec.bagMode) ? rec.bagMode : 'loot', skills: rec.skills && typeof rec.skills === 'object' ? rec.skills : {}, remort: Math.max(0, Math.min(40, rec.remort | 0)), gender: ['male', 'female', 'nonbinary'].includes(rec.gender) ? rec.gender : 'nonbinary', cyber: (rec.cyber || []).filter((id) => D.W.items[id]), luck: rec.luck ?? 3, cls: D.K.CLASSES[rec.cls] ? rec.cls : 'barbarian', level: rec.level || 1, xp: rec.xp || 0, gold: rec.gold ?? 25, quests: rec.quests || {}, qdone: new Set(rec.qdone || []), qp: rec.qp ?? (rec.qdone || []).reduce((s, id) => s + ((D.qDef(id) || { rew: {} }).rew.qp || 0), 0), gos: rec.gos !== false, wiz: !!rec.wiz, visited: new Set(rec.visited || []) }); this.recalc(); this.hp = clamp(rec.hp || this.maxhp, 1, this.maxhp); this.mp = clamp(rec.mp ?? this.maxmp, 0, this.maxmp);
    this.aliases = {}; for (const [k, v] of Object.entries(rec.aliases || {})) if (/^[a-z][a-z0-9_]{0,11}$/.test(k) && typeof v === 'string' && v.length <= 200) this.aliases[k] = v;
    this.triggers = D.cleanTriggers(rec.triggers); const tu = rec.tut || {}; this.tut = { off: !!tu.off, seen: !!tu.seen, step: Math.max(0, Math.min(30, tu.step | 0)), done: Object.fromEntries(Object.keys(tu.done || {}).filter((k) => /^[a-z]{2,12}$/.test(k)).map((k) => [k, 1])) };
    this.kpMap = { ...KP_DEFAULT }; for (const [k, v] of Object.entries(D.kpFromRec(rec))) if (k in KP_DEFAULT && typeof v === 'string') this.kpMap[k] = v.slice(0, 100);
    this.bag = {}; for (const [id, n] of Object.entries(rec.bag || {})) if (D.W.items[id] && n > 0 && D.bagUsed(this) + n <= D.bagCap(this)) this.bag[id] = Math.floor(n);
    this.tools = {}; for (const [id, t] of Object.entries(rec.tools || {})) if (D.T && D.T.TOOLS[id]) this.tools[id] = { uses: Math.max(0, t.uses | 0) }; D.ensureKit(this);
    for (const id of rec.inv || []) if (D.W.items[id]) D.cloneItem(id).move(this);
    for (const [id, n] of Object.entries(rec.keep || {})) { let c = n | 0; for (const it of this.inv) if (c > 0 && it.itemId === id) { it.kept = true; c--; } } // items marked with `keep`
    (rec.ups || []).forEach((u, i) => { if (u && this.inv[i]) { this.inv[i].up = Math.min(10, u | 0); D.applyUp(this.inv[i]); } }); // weapon upgrades
    for (const [slot, id, idx] of rec.equip || []) { const used = Object.values(this.equip), it = (this.inv[idx] && this.inv[idx].itemId === id && !used.includes(this.inv[idx]) ? this.inv[idx] : null) || this.inv.find((i) => i.itemId === id && !used.includes(i)); if (it) this.equip[slot] = it; }
  }
}

// ---- factories, map payloads, world loader ----
D.upDmg = (it, up) => { const l = it.def.lvl || 1; return [it.def.dmg[0] + up * Math.max(1, Math.round(l * 0.2)), it.def.dmg[1] + up * Math.max(1, Math.round(l * 0.32))]; }; // each upgrade adds damage in proportion to the weapon's level
D.applyUp = (it) => { const up = it.up || 0; it.dmg = up ? D.upDmg(it, up) : it.def.dmg; it.name = up ? `${it.def.name} +${up}` : it.def.name; it.short = (it.def.short || art(it.def.name)) + (up ? ` +${up}` : ''); };
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
  const z = p.env.z, rooms = [], shown = new Set([...p.visited, ...[...D.rooms.values()].filter((r) => r.area === p.env.area && r.z === z && !r.def.hidden).map((r) => r.path)]); // the whole map of the area you are in, plus anywhere you have been
  for (const path of shown) {
    const r = D.rooms.get(path); if (!r || r.z !== z) continue;
    rooms.push({ p: path, x: r.x, y: r.y, n: r.name, t: r.terrain, ex: Object.entries(r.exits).map(([d, to]) => ({ d, to })) });
  }
  const others = [...D.players.values()].filter((o) => o !== p && o.env).map((o) => o.env.path);
  const mobs = p.env.inv.filter((o) => o.isLiving && !o.isPlayer).length;
  return { t: 'map', z, rooms, me: p.env.path, ra: p.env.area, rn: p.env.name, wx: D.weatherFor ? D.weatherFor(p) : '', rp: D.roomPic ? D.roomPic(p.env.path) : '', ap: D.areaPic ? D.areaPic(p.env.area) : '', others, mobs, area: D.AREA_LABEL[p.env.area] || cap(p.env.area) };
};
D.pushMaps = () => { for (const p of D.players.values()) if (p.env) p.send(D.mapFor(p)); };
// ---- bag of holding and bound tools: automatic for every character, never droppable or sellable, saved with the player ----
D.bagCap = (p) => 60 + 20 * (p.remort || 0); // each remort adds room
D.bagUsed = (p) => Object.entries(p.bag).reduce((a, [id, c]) => a + (D.W.items[id] && D.W.items[id].type === 'material' ? 0 : c), 0); // gathered materials do not count: carry as many as you like
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
D.tutQuest = (p) => { const q = D.qDef('q_tutorial'); if (!q || p.qdone.has(q.id) || p.quests[q.id]) return; p.quests[q.id] = { prog: [] }; p.msg('New quest: "Welcome to the Multiverse". Finish the newbie tutorial (type `tutorial`) for quest points, credits, stims and XP.', 'win'); p.sendQuests(); };
D.tutFinish = (p) => { const q = D.qDef('q_tutorial'); if (!q || p.qdone.has(q.id)) return; D.tutQuest(p); D.qEvent(p, 'tutorial', 'finish'); if (D.qReady(p, q)) D.qComplete(p, q); };
D.tutMsg = (p, m) => { if (m.finish) { if (Object.keys(p.tut.done).length >= 6 || p.qdone.has('q_tutorial')) { p.tut.off = true; D.tutFinish(p); } else { p.msg('Try a few more of the tutorial buttons first (look, score, the fountain, the board...), then finish.', 'sys'); return p.send({ t: 'tut', off: false, step: p.tut.step, done: p.tut.done, open: true }); } } if (m.reset) { p.tut = { off: false, seen: true, step: 0, done: {} }; } if (m.off !== undefined) p.tut.off = !!m.off; if (m.step !== undefined) p.tut.step = Math.max(0, Math.min(30, m.step | 0)); p.send({ t: 'tut', off: p.tut.off, step: p.tut.step, done: p.tut.done, open: !!m.open }); };
D.teamMsg = (t, text, cls = 'team') => { for (const n of t.members) { const m = D.players.get(n); if (m) m.msg(text, cls); } };
D.teamHere = (p) => { const t = p.team; if (!t) return [p]; const here = t.members.map((n) => D.players.get(n)).filter((m) => m && m.env === p.env && m.hp > 0); return here.includes(p) ? here : [p, ...here]; };
D.teamLeave = (p, why) => { // leave a team (or drop off it when disconnecting); the team disbands when one member is left
  const t = p.team; if (!t) return; t.members = t.members.filter((n) => n !== p.name); p.team = null; if (why !== 'disconnected') p.msg('You leave the team.', 'team');
  if (t.members.length <= 1) { for (const n of t.members) { const o = D.players.get(n); if (o) { o.team = null; o.msg('Your team has disbanded.', 'team'); } } return; }
  if (t.leader === p.name) t.leader = t.members[0]; D.teamMsg(t, `${p.name} ${why === 'disconnected' ? 'went offline and left' : 'left'} the team. ${t.leader} leads.`);
};
D.cleanTitle = (t) => String(t || '').replace(/[\u0000-\u001f\u007f<>]/g, '').replace(/\(?\s*administrator\s*\)?/gi, '').replace(/\s+/g, ' ').trim().slice(0, 40); // titles cannot imitate the (Administrator) pre-title
const PRE = Object.fromEntries(Object.entries(require('./config')().preTitles).map(([k, v]) => [k.toLowerCase(), v]));
D.preTitle = (p) => PRE[String(p.name).toLowerCase()] || (p.wiz ? '(Administrator)' : p.architect ? '(Architect)' : ''); // e.g. Joe gets (Administrator) before the name
D.genderLabel = (g) => (g === 'nonbinary' ? 'other' : g);
D.setMute = (p, m) => { const k = { bounty: 'bounty', bounties: 'bounty', level: 'levels', levels: 'levels', quest: 'quests', quests: 'quests', weather: 'weather', taunts: 'taunts', taunt: 'taunts', deaths: 'deaths', death: 'deaths' }[String(m.key)]; if (!k) return; p.mute[k] = !!m.on; p.sendMutes(); if (k === 'weather') p.send({ t: 'wx', k: D.weatherFor ? D.weatherFor(p) : '' }); }; // muting weather stops its animation and sounds at once
D.brawn = (p) => { // the passive bonuses of the brawn classes (no spells): Juggernaut, and its remort class the Titan, which grows with every remort
  if (!p || (p.cls !== 'juggernaut' && p.cls !== 'titan')) return null; const L = p.level, T = p.cls === 'titan', R = T ? (p.remort || 0) : 0;
  return { dmg: 1.10 + L * 0.002 + (T ? 0.05 + 0.04 * R + (R >= 40 ? 0.25 : 0) : 0), extra: Math.min(0.6, 0.12 + L * 0.004 + (T ? 0.01 * R : 0)), xlo: 0.5, xhi: R >= 5 ? 1.3 : 1.0, stun: R >= 10 ? 0.15 : 0, dr: Math.min(0.5, 0.06 + L * 0.003 + (T ? 0.005 * R + (R >= 20 ? 0.05 : 0) : 0)), steal: R >= 30 ? 0.04 : 0, atk: T ? (R >= 20 ? 6 : R >= 15 ? 5 : R >= 10 ? 4 : 3) : 2 }; // attacks per round: Juggernaut 2; Titan 3 from Remort 1, 4 at 10, 5 at 15, 6 at 20
};
D.startedAt = Date.now(); // for `uptime`
D.MAXLV = 100; // the level cap (remort levels still stop at 40)
D.fancyName = (n) => (/^grog$/i.test(n) ? ['#ff9a1f', '#e25f00', '#cc5500', '#ff9a1f'].map((c, i) => `\u27e6${c}|${'GROG'[i]}\u27e7`).join('') : n); // GROG: capitals in alternating orange, dark orange and burnt orange
D.primeOn = (p) => Date.now() < (p.primeUntil || 0);
D.touchMilestone = (p, area) => { // touching a milestone attunes you and opens the travel window
  p.send({ t: 'sound', k: 'milestone' });
  if (D.tutEvent) D.tutEvent(p, 'touch'); const first = !p.milestones.includes(area); if (first) p.milestones.push(area); const m = (D.W.milestones || []).find((x) => x.area === area);
  p.msg(first ? `You lay a hand on the milestone. It hums, warm as skin, and the sigil of ${m ? m.name : area} burns itself into your mind. You are now attuned to this place.` : 'You touch the milestone. It hums, remembering you.', 'win'); D.sendMilestones(p);
};
D.sendMilestones = (p) => { // the travel window: every milestone, whether you are attuned, and (when you stand at one) a Travel button
  const here = p.env.inv.find((o) => o.def && o.def.ms), L = require('./lib'); p.send({ t: 'milestone', here: here ? here.def.ms : '', items: (D.W.milestones || []).map((m) => ({ area: m.area, name: m.name, levels: m.levels, room: (D.rooms.get(m.room) || {}).name || '', ok: p.milestones.includes(m.area) })) });
};
D.cleanEmail = (s) => { s = String(s || '').trim().slice(0, 100); return /^[^\s@<>"',;]{1,64}@[a-z0-9.-]+\.[a-z]{2,}$/i.test(s) ? s : ''; };
D.setEmail = (p, text) => { const t = String(text || '').trim(); const oldEmail = p.email; const fwdCheck = () => { if (p.fwd && (p.fwd.on || p.fwd.pending) && p.email !== (p.fwd.email || (p.fwd.pending && p.fwd.pending.email))) { p.fwd = { on: false }; p.msg('Mudmail forwarding was switched off because your email changed. Type `mail forward on` to confirm the new address.', 'sys'); } }; if (!t) { p.email = ''; fwdCheck(); p.sendMutes(); return p.msg('Your email is cleared.', 'win'); } const e = D.cleanEmail(t); if (!e) return p.msg('That does not look like an email address.', 'hurt'); p.email = e; fwdCheck(); p.sendMutes(); p.msg(`Your email is now ${e}. ${p.emailHidden ? 'It is hidden from finger.' : 'Anyone can see it with `finger ' + p.name + '` (type `email hide` to hide it).'}`, 'win'); };
D.hideEmail = (p, hide) => { p.emailHidden = !!hide; p.sendMutes(); p.msg(p.emailHidden ? 'Your email is hidden from finger.' : 'Your email is shown to anyone who fingers you.', 'sys'); };
D.setTitle = (p, text) => { const t = D.cleanTitle(text); p.title = t; p.sendMutes(); p.msg(t ? `Your title is now: ${t}` : 'Your title is cleared.', 'win'); };
D.give = (p, id, how) => { // where a new item goes: loot-like items go to the bag first (bag mode "loot"), otherwise the pack, overflowing to the bag
  const def = D.W.items[id], mat = def.type === 'material', room = mat ? Infinity : D.bagCap(p) - D.bagUsed(p), lootish = how === 'loot' && def.type !== 'fixture'; // with bag auto loot on, everything a monster drops goes straight in the bag
  if (lootish && p.bagMode === 'loot' && room > 0) { p.bag[id] = (p.bag[id] || 0) + 1; return 'bag'; }
  if (p.inv.length < p.cap() && !(mat && p.bagMode === 'loot')) { D.cloneItem(id).move(p); return 'pack'; }
  if ((p.bagMode !== 'off' || mat) && room > 0) { p.bag[id] = (p.bag[id] || 0) + 1; return 'bag'; }
  D.cloneItem(id).move(p.env); return 'floor';
};
D.takeFloor = (p, it) => { // picking up an item from the floor
  if (!it.itemId) return false;
  const room = it.type === 'material' ? Infinity : D.bagCap(p) - D.bagUsed(p), lootish = ['material', 'weapon', 'armor'].includes(it.type);
  if ((lootish && p.bagMode === 'loot' && room > 0) || (p.inv.length >= p.cap() && (p.bagMode !== 'off' || it.type === 'material') && room > 0)) { p.bag[it.itemId] = (p.bag[it.itemId] || 0) + 1; it.destroy(); return 'bag'; }
  if (p.inv.length < p.cap()) { it.move(p); return 'pack'; }
  return false;
};
// ---- shopkeepers: every shop, exchange and clinic has someone behind the counter (they cannot be fought) ----
const AREA_GENRE = { town: 'west', road: 'west', mines: 'west', gulch: 'west', bank: 'west', rail: 'west', forest: 'fantasy', crypt: 'fantasy', marsh: 'fantasy', dunes: 'fantasy', citadel: 'fantasy', cit: 'fantasy', thorn: 'fantasy', reach: 'fantasy', hollow: 'fantasy', castle: 'fantasy', sea: 'fantasy', hades: 'fantasy', pluto: 'scifi', frost: 'scifi', ember: 'scifi', abyss: 'scifi', aurora: 'scifi', mars: 'scifi', grounds: 'scifi', prime: 'stone', cave: 'stone' };
const SHOPKEEPERS = { west: [['Dusty Pete', 'a dusty old trader with a corncob pipe and sleeve garters'], ['Widow Mae', 'a sharp-eyed widow in a black bonnet who counts change twice'], ['Cactus Jack', 'a leathery old-timer with a bandana and a grin full of gold'], ['Honest Abe', 'a rumpled clerk in a green eyeshade who swears he is honest'], ['Silas the Peddler', 'a bent peddler with a pack that never seems to empty']],
  fantasy: [['Merchant Orlo', 'a round merchant in a velvet cap with rings on every finger'], ['Dame Hesper', 'a tall, calm trader in a hooded traveling cloak'], ['Old Fenwick', 'a gnarled old shopkeeper with spectacles on a chain'], ['Brindle the Trader', 'a cheerful halfling trader perched on a tall stool'], ['Quillon the Fence', 'a quick-eyed dealer who asks no questions']],
  scifi: [['Vendor-Bot 7', 'a dented vending droid with a flickering screen face'], ['Trader Zix', 'a six-armed trader in a patched jumpsuit, juggling inventory'], ['Quartermaster Nova', 'a brisk quartermaster in a crisp silver uniform'], ['Dealer K-9', 'a gruff cyborg dealer with a chrome jaw and a tablet'], ['Supply Officer Tam', 'a tired supply officer with a stylus behind each ear']],
  stone: [['Trader Gronk', 'a hairy trader wrapped in furs, bartering with bones and shells'], ['Uga the Barterer', 'a shaggy cave barterer with a pile of shiny rocks']],
  modern: [['Cashier Dana', 'a friendly cashier with a name tag and a pen behind her ear'], ['Clerk Marcus', 'a bored clerk in a branded polo, scanning one-handed'], ['Manager Priya', 'a brisk store manager with a lanyard and a clipboard'], ['Cashier Leo', 'a young cashier with earbuds in and a very big smile'], ['Stock Clerk Ben', 'a patient stock clerk pushing a cart of boxes']] };
D.ensureShopkeeper = (room) => { // registers a shopkeeper NPC for a shop, exchange or clinic that has no NPC yet
  const d = room.def; if (!d || d.hidden || !(d.shop || d.exchange || d.clinic) || !D.Q || !D.Q.NPCS) return; if (Object.values(D.Q.NPCS).some((n) => n.room === room.path)) return;
  const pool = SHOPKEEPERS[AREA_GENRE[room.area] || 'modern']; let h = 0; for (const ch of room.path) h = (h * 31 + ch.charCodeAt(0)) >>> 0; const [name, look] = pool[h % pool.length];
  D.Q.NPCS['shk_' + room.path.replace(/\W/g, '_')] = { name, room: room.path, hi: d.clinic ? `Welcome to ${room.name}. Type 'list' to see the implants, and 'install <name>' (or 'install <number>') to get one fitted.` : `Welcome to ${room.name}! Type 'list' to see what I have for sale, or 'sell' to sell me your things. Take your time.`, long: `${name}, ${look}, stands behind the counter. ${name} is here to serve, not to fight.` };
};
const MUTEKEY = { bounty: 'bounty', level: 'levels', milestone: 'levels', quest: 'quests', taunts: 'taunts', deaths: 'deaths' }; // players can mute these announcement types
const TAGS = { bounty: '[bounty] ', deaths: '[death] ' }; // channel tags in front of announcements (other announcements keep the megaphone)
D.announce = (text, kind, cls = 'announce') => { if (D.tweet) D.tweet(text, kind); for (const p of D.players.values()) if (!(p.mute && p.mute[MUTEKEY[kind]])) p.msg((TAGS[kind] || '📣 ') + text, cls); if (D.bridge && D.bridge.wantsAnnouncements()) D.bridge.out((TAGS[kind] || '📣 ') + text); }; // mud-wide announcements
D.presence = (p, kind) => { // everyone online hears when a player logs in or out (players can mute it with `notify off`)
  const who = `${p.name} (${p.remort ? `Remort ${p.remort}, ` : ''}L${p.level} ${p.klass().name})`, text = `${who} has logged ${kind === 'in' ? 'in' : 'out'}.`;
  for (const o of D.players.values()) if (o !== p && !o.isBot && o.notify !== false) o.msg('🔔 ' + text, 'notify');
  if (D.bridge && D.bridge.wantsPresence()) D.bridge.out('🔔 ' + text);
};
Object.assign(D, { Room, Item, Living, Monster, Player, Npc });
module.exports = D;
