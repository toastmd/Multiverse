'use strict';
// Bracelets and watches: a new equipment slot, `bracelet`, with wristbands, watches and bangles on sale in shops across the worlds.
// Wearing a watch (or a wrist communicator) also lets you read the exact time with the `time` command.
module.exports = (items, mobs, rooms) => {
  const { gear } = require('./gen')(items, mobs);
  const L = [ // id, name, level, price, shops, description
    ['leatherband', 'leather wristband', 1, 30, ['town/market', 'gulch/f'], 'A plain leather wristband with a brass buckle. Every runner has one.'],
    ['ironcuff', 'iron bracer cuff', 3, 120, ['town/armory'], 'A hinged iron cuff worn on the wrist, scratched from a hundred fights.'],
    ['silverband', 'silver bracelet', 5, 220, ['town/market'], 'A braided silver bracelet that catches the light.'],
    ['digiwatch', 'cheap digital watch', 1, 25, ['modern/dol'], 'A plastic digital watch with a cracked screen that is, to be fair, still right twice a day.'],
    ['quartzwatch', 'quartz wristwatch', 8, 300, ['modern/tec'], 'A neat quartz wristwatch with a steel strap. It ticks very quietly.'],
    ['sportwatch', 'sport watch', 10, 450, ['modern/spo', 'brogym/4_1'], 'A rubber-strapped sport watch with a stopwatch, a heart-rate sensor and far too many buttons.'],
    ['smartwatch', 'smartwatch', 12, 900, ['modern/tec'], 'A glowing smartwatch that counts your steps, nags you to stand up and tells the time.', { bonus: { mp: 12 } }],
    ['vinebraid', 'living-vine bracelet', 14, 1100, ['thorn/d'], 'A bracelet of living vine that grows a tiny new leaf every morning.'],
    ['charmbracelet', 'charm bracelet', 15, 1400, ['manor/0_0'], 'A silver charm bracelet hung with tiny keys, hearts and one very small ghost.'],
    ['pearlbangle', 'pearl bracelet', 18, 1900, ['reach/d'], 'A bracelet of matched sea pearls, cool and smooth.'],
    ['goldbangle', 'gold bangle', 20, 2800, ['dunes/oasis'], 'A heavy gold bangle from the desert markets, engraved with a sun.'],
    ['divewatch', 'dive watch', 25, 4500, ['aurora/h'], 'A chunky steel dive watch, waterproof to a thousand feet, with a rotating bezel.'],
    ['wristcomm', 'wrist communicator', 30, 7000, ['mars/0_0'], 'A Martian wrist communicator with a green screen and a little antenna that wobbles.', { bonus: { mp: 40 } }],
    ['coralcuff', 'coral cuff', 55, 90000, ['sea/0_0'], 'A cuff grown from red coral by the sea folk, humming faintly like a shell.', { bonus: { hp: 100 } }],
    ['soulchain', 'soul-chain bracelet', 85, 280000, ['hades/0_0'], 'A bracelet of black links, each one holding a quiet whisper.', { bonus: { hp: 250, mp: 120 } }],
    ['cryowrist', 'cryo wristband', 95, 450000, ['pluto/0_0'], 'A Plutonian wristband that keeps your pulse cool and your temper cooler.', { bonus: { hp: 300, mp: 150 } }],
  ];
  for (const [id, name, lv, price, shops, long, extra] of L) { gear(id, name, 'bracelet', lv, price, long, extra || {}); items[id].isWatch = /watch|communicator/.test(name); }
  return { post: () => { for (const [id, , , , shops] of L) for (const sh of shops) { const r = rooms[sh]; if (r && r.shop && Array.isArray(r.shop.stock) && !r.shop.stock.includes(id)) r.shop.stock.push(id); } } };
};
