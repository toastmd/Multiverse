'use strict';
// Spell engine. Spell data lives in classes.js; this file turns it into game effects.
const D = require('./lib');
const { rnd } = D;

D.spellsOf = (p) => D.K.SPELLS[p.cls] || [];
D.findSpell = (p, w) => {
  w = String(w || '').toLowerCase().replace(/\s+/g, '_'); if (!w) return null;
  const l = D.spellsOf(p);
  return l.find((s) => s.k === w || s.n.toLowerCase().replace(/[\s']+/g, '_') === w) || l.find((s) => s.k.startsWith(w));
};
D.spellbook = (p) => {
  const list = D.spellsOf(p); let school = null;
  p.msg(`${p.klass().name} abilities (mana ${p.mp}/${p.maxmp}). Use: cast <name> [target]`, 'rname');
  for (const s of list) {
    if (s.school && s.school !== school) { school = s.school; p.msg(`-- ${school} --`, 'sys'); }
    p.msg(`${s.lvl <= p.level ? s.i : '🔒'} ${s.k}  (lvl ${s.lvl}, ${s.mp} mp)  ${s.d}`, s.lvl <= p.level ? 'spell' : 'sys');
  }
};

const foes = (p) => p.env.inv.filter((o) => o.isLiving && !o.isPlayer);
const pick = (p, rest) => {
  const t = rest ? foes(p).find((o) => o.isId(rest)) : (p.enemy && p.enemy.env === p.env ? p.enemy : foes(p)[0]);
  if (!t) p.msg(rest ? "You don't see that here." : 'There is nothing to target.'); return t;
};
const mult = (p) => (1 + Math.max(0, p.level - 10) * 0.12) * (p.klass().pwr || 1) * (1 + 0.03 * (p.remort || 0)); // levels 10-40, remort classes (pwr) and each remort add power
const power = (p, sp, r) => Math.round((rnd(r[0], r[1]) + Math.floor(p.level * (sp.sc ?? 1))) * mult(p)) + p.fxVal('atk');
const evt = (p, t, sp, o) => p.env.fx({ a: p.info(), b: t.info(), hit: true, crit: false, dmg: 0, spell: { n: sp.n, i: sp.i, c: sp.c }, ...o });

const KIND = {
  dmg(p, sp, rest) {
    if (p.env.def.safe) return p.msg('Violence is not welcome here.'), false;
    const ts = sp.aoe ? foes(p) : [pick(p, rest)]; if (!ts[0]) return sp.aoe ? (p.msg('There is nothing to hit.'), false) : false;
    p.msg(`${sp.i} You cast ${sp.n}!`, 'spell'); p.env.tell(`${p.name} casts ${sp.n}!`, p, 'combat2');
    for (const t of ts) {
      let total = 0, crits = 0;
      for (let h = 0; h < (sp.hits || 1) && t.hp > 0; h++) {
        let d = power(p, sp, sp.dmg); if (sp.exec && t.hp < t.maxhp * 0.35) d *= 2;
        const crit = Math.random() < (sp.crit || 0) + p.fxVal('crit') * 0.5; if (crit) { d = Math.floor(d * 1.8); crits++; }
        d = Math.max(1, d - rnd(0, Math.floor(t.ac() / 2))); d = Math.max(1, Math.round(d * (1 - Math.min(0.25, D.roll(t.defPool()).h * 0.025)))); // target resists with a dice pool
        t.hp -= d; total += d;
        if (!p.enemy) p.enemy = t; if (!t.enemy && t.hp > 0) t.engage(p); evt(p, t, sp, { dmg: d, crit });
      }
      p.msg(`  ${sp.n} hits ${t.the()} for ${total}${crits ? ' (critical!)' : ''}.`, 'spell');
      if (sp.drain && total) { const h = Math.min(p.maxhp - p.hp, Math.floor(total * sp.drain)); p.hp += h; if (h) p.msg(`  You drain ${h} life.`, 'win'); }
      if (t.hp > 0 && sp.stun) { t.addFx({ k: 'stun', n: 'stun', ticks: sp.stun, src: p }); p.msg(`  ${D.cap(t.the())} is stunned!`, 'win'); }
      if (t.hp > 0 && sp.dot) t.addFx({ k: 'dot', n: sp.n, dmg: sp.dot.dmg.map((v) => Math.round(v * mult(p))), ticks: sp.dot.ticks, src: p });
      if (t.hp <= 0) t.die(p);
    }
  },
  heal(p, sp) {
    const h = Math.min(p.maxhp - p.hp, sp.heal ? Math.round((rnd(...sp.heal) + p.level * 2) * mult(p)) : 0); p.hp += h;
    if (sp.hot) p.addFx({ k: 'hot', n: sp.n, heal: Math.round((sp.hot + Math.floor(p.level / 2)) * mult(p)), ticks: sp.ticks });
    p.msg(`${sp.i} You cast ${sp.n} and recover ${h} hit points${sp.hot ? ', and will keep healing' : ''}.`, 'win');
    p.env.fx({ a: p.info(), b: p.info(), heal: h, spell: { n: sp.n, i: sp.i, c: sp.c } }); p.env.tell(`${p.name} casts ${sp.n}.`, p, 'combat2');
  },
  buff(p, sp) {
    p.addFx({ k: 'buff', n: sp.n, ticks: sp.ticks, ac: sp.ac && Math.round(sp.ac * mult(p)), atk: sp.atk && Math.round(sp.atk * mult(p)), crit: sp.crit, evade: sp.evade, regen: sp.regen && Math.round(sp.regen * mult(p)), src: p });
    if (sp.heal) p.hp = Math.min(p.maxhp, p.hp + Math.round(rnd(...sp.heal) * mult(p)));
    p.msg(`${sp.i} You cast ${sp.n}. ${sp.d}`, 'spell'); p.env.tell(`${p.name} casts ${sp.n}.`, p, 'combat2');
    p.env.fx({ a: p.info(), b: p.info(), buff: true, spell: { n: sp.n, i: sp.i, c: sp.c } });
  },
  summon(p, sp) {
    p.addFx({ k: 'summon', n: sp.sname, ticks: sp.ticks, sdmg: sp.sdmg, mul: mult(p), i: sp.i, src: p });
    p.msg(`${sp.i} You summon ${sp.sname}. It will fight for ${sp.ticks} rounds.`, 'spell'); p.env.tell(`${p.name} summons ${sp.sname}!`, p, 'combat2');
    p.env.fx({ a: p.info(), b: p.info(), buff: true, spell: { n: sp.sname, i: sp.i, c: sp.c } });
  },
  escape(p, sp) {
    const ex = Object.values(p.env.exits); if (!ex.length) return p.msg('There is nowhere to go.'), false;
    p.msg(`${sp.i} You vanish in a cloud of smoke!`, 'spell'); p.env.tell(`${p.name} vanishes in smoke.`, p); p.enemy = null;
    const dest = D.rooms.get(ex[rnd(0, ex.length - 1)]); p.enter(dest, true); dest.tell(`${p.name} appears out of smoke.`, p); dest.look(p);
  },
  gather(p, sp) {
    if (p.enemy) return p.msg('You cannot concentrate while fighting!', 'hurt'), false;
    const nodes = p.env.nodes || {};
    if (!(nodes[sp.res] > 0)) return p.msg(`There is no ${sp.res === 'fish' ? 'fishing spot' : sp.res + ' left'} here.`), false;
    const total = sp.loot.reduce((s, [, w]) => s + w, 0), got = {};
    const skill = { herb: 'foraging', ore: 'mining', fish: 'fishing' }[sp.res], tier = D.toolTier ? D.toolTier(p, skill) : 1; let bagged = 0;
    for (let n = rnd(...sp.yield) + (p.level >= 10 ? 1 : 0) + (Math.random() < 0.1 * tier ? 1 : 0); n > 0; n--) { // your tool adds a chance of extra finds
      let r = Math.random() * total, id = sp.loot[0][0]; for (const [i, w] of sp.loot) { if ((r -= w) < 0) { id = i; break; } }
      if (D.give(p, id, 'loot') === 'bag') bagged++; got[id] = (got[id] || 0) + 1;
    }
    nodes[sp.res]--; p.msg(`${sp.i} ${sp.n}: you gather ${Object.entries(got).map(([i, n]) => `${n} ${D.W.items[i].name}`).join(', ') || 'nothing'}${bagged ? ` (${bagged} into your bag of holding)` : ''}.`, 'win'); if (D.toolUse) D.toolUse(p, skill);
  },
  craft(p, sp, rest) {
    const recipes = D.K.RECIPES.filter((r) => r.tier === sp.tier), key = rest.toLowerCase().replace(/\s+/g, '_');
    const show = () => { p.msg(`${sp.n} recipes:`, 'rname'); for (const r of recipes) p.msg(`  ${r.k}: ${Object.entries(r.need).map(([i, n]) => `${n} ${D.W.items[i].name}`).join(' + ')} -> ${D.W.items[r.out].name}`, 'spell'); };
    if (!key) return show(), false;
    const r = recipes.find((x) => x.k === key || x.k.startsWith(key)); if (!r) return show(), p.msg('No such recipe.'), false;
    if (sp.forge && !p.env.def.forge) return p.msg('You need a forge for that. Try Brann\'s Smithy in Ashfall.'), false;
    const have = (id) => ({ length: D.itemCount(p, id) });
    for (const [id, n] of Object.entries(r.need)) if (have(id).length < n) return p.msg(`You need ${n} ${D.W.items[id].name} (you have ${have(id).length}).`), false;
    for (const [id, n] of Object.entries(r.need)) D.itemTake(p, id, n);
    D.give(p, r.out, 'normal'); p.msg(`${sp.i} You craft ${D.W.items[r.out].name}!`, 'win'); return true;
  },
};

D.cast = (p, arg) => {
  const m = String(arg || '').trim().split(/\s+/);
  if (!m[0]) return D.spellbook(p);
  const sp = D.findSpell(p, m[0]); if (!sp) return p.msg("You don't know that. Type 'spells' to see your abilities.");
  if (sp.lvl > p.level) return p.msg(`${sp.n} unlocks at level ${sp.lvl}.`);
  const now = Date.now(); if ((p.cd[sp.k] || 0) > now) return p.msg(`${sp.n} is not ready (${Math.ceil((p.cd[sp.k] - now) / 1000)}s).`);
  if (p.mp < sp.mp) return p.msg(`Not enough ${p.cls === 'scavenger' ? 'stamina' : 'mana'}: ${sp.n} costs ${sp.mp}.`);
  if (p.fx.some((e) => e.k === 'stun')) return p.msg('You are stunned!');
  if (KIND[sp.kind](p, sp, m.slice(1).join(' ')) === false) return;
  p.mp -= sp.mp; p.cd[sp.k] = now + (sp.cd ?? 3) * 1000; p.sendStats();
};
