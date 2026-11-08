'use strict';
// Four goddesses a player can vow to (`vow`): Seraphina (Good), Elyndra (Neutrality), Morgath (Evil) and Lagatha (Lag, chaotic). Each gives a small permanent blessing.
// Change a vow later for a fee. The goddess shows in `finger` and `score`; pictures are in public/img/deities.
const D = require('./lib');
const DEITIES = {
  seraphina: { name: 'Seraphina', title: 'Goddess of Good', align: 'Good', domains: 'healing, justice, protection, light', symbol: 'a golden sun', personality: 'Compassionate but unwavering against evil.', blessing: '+6% maximum health', gender: 'goddess' },
  elyndra: { name: 'Elyndra', title: 'Goddess of Neutrality', align: 'Neutral', domains: 'balance, fate, nature, equilibrium', symbol: 'silver scales', personality: 'Neither good nor evil; preserves the balance of existence.', blessing: '+2 luck points and a better defense as you level', gender: 'goddess' },
  morgath: { name: 'Morgath', title: 'Goddess of Evil', align: 'Evil', domains: 'destruction, domination, corruption, darkness', symbol: 'a black skull crowned in flame', personality: 'Ruthless, manipulative, and hungry for power.', blessing: '+6% damage in combat', gender: 'goddess' },
  lagatha: { name: 'Lagatha', title: 'Goddess of Lag', align: 'Chaotic', domains: 'lag, latency, disconnections, freezes', symbol: 'a glitched hourglass', personality: 'Unpredictable and mischievous. She strikes without warning!', blessing: 'each landed blow has a 5% chance to freeze your enemy in place for three rounds', gender: 'goddess' },
};
const LEGACY = { aurelia: 'seraphina', nyxara: 'elyndra', kharn: 'morgath', ruugh: 'lagatha' }; // the first draft's deity names
D.DEITIES = DEITIES; D.legacyDeity = LEGACY; D.deityLine = (p) => (p.deity && DEITIES[p.deity] ? `${DEITIES[p.deity].name}, ${DEITIES[p.deity].title}` : 'none');
D.showDeityPic = (p, id) => p.send && p.send({ t: 'img', url: id && DEITIES[id] ? `/img/deities/${id}.jpg` : '/img/deities/goddesses.jpg', title: id && DEITIES[id] ? `${DEITIES[id].name}, ${DEITIES[id].title}` : 'The four goddesses: Seraphina, Elyndra, Morgath and Lagatha' });
const sheet = (d) => `${d.name}, ${d.title} (${d.align}). Domains: ${d.domains}. Symbol: ${d.symbol}. ${d.personality} Blessing: ${d.blessing}.`;
D.vow = (p, a) => {
  const w = a.trim().toLowerCase(), cur = p.deity && DEITIES[p.deity], pick = (s) => { s = LEGACY[s] || s; return DEITIES[s] ? s : Object.keys(DEITIES).find((k) => DEITIES[k].name.toLowerCase() === s); };
  if (!w) { p.msg(`THE GODDESSES: ${cur ? `you have vowed to ${cur.name}, ${cur.title}.` : 'you have not vowed to any of them yet.'}`, 'rname'); for (const [k, d] of Object.entries(DEITIES)) p.msg(`  ${k.padEnd(10)} ${d.name}, ${d.title} (${d.align}): ${d.blessing}`, k === p.deity ? 'win' : 'items'); p.msg('Swear with `vow <name>` (your first vow is free; changing it later costs credits). `vow lore <name>` tells you more. `vow forsake` drops your vow.', 'sys'); return D.showDeityPic(p, ''); }
  if (w.startsWith('lore ')) { const id = pick(w.slice(5).trim()); if (!id) return p.msg('Which goddess? ' + Object.keys(DEITIES).join(', '), 'sys'); p.msg(sheet(DEITIES[id]), 'text'); return D.showDeityPic(p, id); }
  if (w === 'forsake') { if (!p.deity) return p.msg('You have not vowed to anyone.', 'sys'); p.msg(`You forsake ${cur.name}. The blessing leaves you.`, 'sys'); p.deity = ''; p.recalc(); return p.sendStats(); }
  const id = pick(w); if (!id) return p.msg('Which goddess? ' + Object.keys(DEITIES).join(', '), 'sys'); if (p.deity === id) return p.msg(`You have already vowed to ${DEITIES[id].name}.`, 'sys');
  const fee = p.deity ? Math.max(5000, p.level * 1000) : 0; if (fee && p.gold < fee) return p.msg(`Changing your vow costs ${fee} credits as an offering.`, 'sys');
  p.gold -= fee; p.deity = id; p.recalc(); p.msg(`*** You vow yourself to ${DEITIES[id].name}, ${DEITIES[id].title}! *** Blessing: ${DEITIES[id].blessing}.${fee ? ` (-${fee} credits)` : ''}`, 'win'); D.showDeityPic(p, id); p.send({ t: 'sound', k: 'skill' }); p.sendStats();
};
module.exports = DEITIES;
