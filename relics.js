'use strict';
// Relics: special unique items that sometimes drop from a boss and last ONE HOUR: Sword of Speed (double hits), Ring of Invincibility (no damage taken), Amulet of Strength
// (doubled strength), Helmet of Intellect (doubled intelligence), Cloak of Regeneration (heals 50 hit points every round). The whole MUD hears when one is found.
const D = require('./lib');
const HOUR = 3600 * 1000, CHANCE = 0.12, IDS = ['relic_speed', 'relic_invincible', 'relic_strength', 'relic_intellect', 'relic_regen'];
module.exports = (items) => {
  const gold = (t) => `\u27e6#ffd34a|${t}\u27e7`;
  const R = (id, name, ids, o, long) => { items[id] = { name, short: `the ${gold(name)}`, ids: [id, 'relic', ...ids], lvl: 0, value: 0, relic: o.relic, ...o, long: `${long} A RELIC: it crumbles to dust one hour after it was found.` }; };
  R('relic_speed', 'Sword of Speed', ['sword', 'speed', 'swordofspeed'], { type: 'weapon', dmg: [40, 70], relic: 'speed', wtype: 'sword', hands: 1 }, 'A slim silver sword that blurs when it moves. Every swing is two. Wielding it doubles the number of hits you land each round.');
  R('relic_invincible', 'Ring of Invincibility', ['ring', 'invincibility', 'ringofinvincibility'], { type: 'armor', slot: 'ring', ac: 0, relic: 'invincible' }, 'A plain gold ring that hums. While it is on your finger, no blow can hurt you: you take no damage at all.');
  R('relic_strength', 'Amulet of Strength', ['amulet', 'strength', 'amuletofstrength'], { type: 'armor', slot: 'neck', ac: 0, relic: 'strength' }, 'A heavy bronze amulet carved with a flexing fist. While worn, your strength is doubled.');
  R('relic_intellect', 'Helmet of Intellect', ['helmet', 'helm', 'intellect', 'helmetofintellect'], { type: 'armor', slot: 'head', ac: 6, relic: 'intellect' }, 'A silver helmet etched with tiny equations. While worn, your intelligence is doubled: double the mana, and spells hit half again as hard.');
  R('relic_regen', 'Cloak of Regeneration', ['cloak', 'regeneration', 'cloakofregeneration'], { type: 'armor', slot: 'cloak', ac: 2, relic: 'regen' }, 'A green cloak that knits itself back together after every tear, and does the same for you: it heals 50 hit points every round.');
  return {};
};
const live = (it) => it && it.def && it.exp > Date.now();
D.relicOn = (p, fx) => !!p.equip && Object.values(p.equip).some((i) => i && i.def && i.def.relic === fx && live(i));
D.applyRelic = (it) => { if (it.rl && it.def.dmg) { const lv = Math.max(1, it.rl); it.dmg = [Math.round(lv * 2.6), Math.round(lv * 4.2)]; } };
D.relics = {
  roll(killer, mob) { if (!killer.isPlayer || !mob.def || !mob.def.boss || Math.random() >= CHANCE) return; D.relics.found(killer, mob); },
  found(p, mob) {
    const id = IDS[D.rnd(0, IDS.length - 1)], it = D.cloneItem(id); it.exp = Date.now() + HOUR; it.rl = Math.max(1, mob.level || 1); D.applyRelic(it); (p.inv.length < p.cap() ? it : it).move(p.inv.length < p.cap() ? p : p.env);
    p.msg(`*** RELIC FOUND: the ${it.def.name}! ${it.def.long.split('.')[0]}. It lasts for ONE HOUR: use it now. ***`, 'win'); for (const o of D.players.values()) o.send({ t: 'sound', k: 'legend' });
    D.announce(`\u2605 ${p.name} has found the ${it.def.name}, dropped by ${mob.the()}! It will last for one hour.`, 'legend');
  },
  sweep(p) { for (const it of [...p.inv]) if (it.exp && it.exp <= Date.now()) { for (const [s, i] of Object.entries(p.equip)) if (i === it) delete p.equip[s]; p.msg(`Your ${it.def.name} crumbles to dust: its hour is up.`, 'hurt'); it.destroy(); p.recalc(); } },
  left: (it) => (it.exp ? Math.max(0, Math.ceil((it.exp - Date.now()) / 60000)) : 0), IDS,
};
setInterval(() => { for (const p of D.players.values()) if (!p.isBot) D.relics.sweep(p); }, 30000).unref();
