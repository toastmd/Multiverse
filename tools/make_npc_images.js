// Generates one random-looking but stable SVG portrait per quest NPC into public/img/npc/. Run: node tools/make_npc_images.js
const fs = require('fs'), path = require('path'), P = require('../public/portrait.js');
const NPC = { // id: [gender, accessories]
  torv: ['male', ['scar', 'cybereye']], elara: ['female', ['cross', 'headband']], brann: ['male', ['goggles', 'beard']], mara: ['female', ['headband']], hale: ['male', ['helmet']], pell: ['male', ['glasses']],
  fenwick: ['male', ['hood', 'beard']], aldous: ['male', ['hood', 'glasses']], barnaby: ['male', ['hat', 'beard']], greta: ['female', ['scar']], durn: ['male', ['helmet', 'lamp', 'beard']],
  rashid: ['male', ['turban', 'beard']], ulf: ['male', ['hood', 'beard', 'visor']], sael: ['female', ['goggles', 'flame']], voss: ['female', ['helmet', 'scar']], watcher: ['nonbinary', ['glow', 'faceglow']] };
const dir = path.join(__dirname, '..', 'public', 'img', 'npc'); fs.mkdirSync(dir, { recursive: true });
for (const [id, [gender, acc]] of Object.entries(NPC)) fs.writeFileSync(path.join(dir, id + '.svg'), P.svg({ seed: 'npc-' + id, gender, acc, label: id + ' portrait' }));
console.log('wrote', Object.keys(NPC).length, 'portraits to', dir);
