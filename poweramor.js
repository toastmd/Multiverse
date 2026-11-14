'use strict';
// POWER ARMOR: a body-slot suit that loads itself into every Titan's pack when the Titan reaches Remort 20 (and for any Titan already at Remort 20 or more the next time they log in or remort).
const D = require('./lib');
module.exports = (items) => {
  items.power_armor = { name: 'Power Armor', ids: ['power', 'armor', 'powerarmor', 'suit'], type: 'armor', slot: 'body', ac: 400, lvl: 1, value: 250000000, bonus: { hp: 9000, mp: 1500, dmg: 220, pool: 14 }, long: 'A hulking suit of hydraulic plate, servos and reactor core, built for a Titan and no one else. It hums as you stand in it, and the floor feels thinner. Loaded automatically at Remort 20.' };
};
D.grantPowerArmor = (p) => {
  if (!p || p.cls !== 'titan' || (p.remort || 0) < 20 || p.powerArmor || !D.W.items.power_armor) return; p.powerArmor = true; D.give(p, 'power_armor', 'normal');
  p.msg('*** POWER ARMOR ONLINE: a Titan at Remort 20 earns the armor built for Titans. It has been loaded into your pack: `wear power armor`. ***', 'win'); p.send({ t: 'sound', k: 'levelup' });
};
