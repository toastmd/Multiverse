'use strict';
// The Void (future realm; 100 rooms in a 10 x 10 grid; "level 250+": a player's level plus Remort count must reach 250, so level 200 and Remort 50). The rooms are written in dark gray.
// Every monster is a "void" and every one is built tough. Entering the gate starts an automatic 30-minute contract to kill all of the voids for a great reward.
const D = require('./lib');
module.exports = (items, mobs, rooms) => {
  const { item, gear, mob } = require('./gen')(items, mobs);
  gear('vd_blade', 'voidglass blade', 'weapon', 250, 160000000, 'A blade of dark glass that reflects nothing, including you.'); gear('vd_scythe', 'null scythe', 'weapon', 248, 150000000, 'A scythe with an edge that is simply an absence.'); gear('vd_staff', 'event-horizon staff', 'weapon', 250, 170000000, 'A staff topped with a tiny black hole. It pulls at your sleeves.');
  gear('vd_plate', 'umbral carapace', 'body', 248, 140000000, 'Armor that is a hole in the shape of armor.'); gear('vd_helm', 'hollow crown', 'head', 245, 120000000, 'A crown with nothing in the middle. Wearing it is oddly restful.'); gear('vd_cloak', 'shroud of silence', 'cloak', 242, 110000000, 'A cloak that swallows sound.'); gear('vd_boots', 'treads of nowhere', 'feet', 240, 105000000, 'Boots that leave no footprints and no memory of footprints.'); gear('vd_gloves', 'grasp of the dark', 'hands', 244, 112000000, 'Gloves of cold, dense shadow.'); gear('vd_legs', 'greaves of absence', 'legs', 243, 110000000, 'Greaves you can only see from the corner of your eye.'); gear('vd_mask', 'faceless mask', 'face', 241, 106000000, 'A smooth gray mask with no features at all.');
  gear('vd_amulet', 'heart of the void', 'neck', 249, 180000000, 'A small black sphere. It is very heavy, and very quiet.', { bonus: { hp: 6000, mp: 3500 } }); gear('vd_ring', 'singularity band', 'ring', 246, 150000000, 'A ring around a point that is not there.', { bonus: { hp: 5000, mp: 2800 } }); gear('vd_belt', 'belt of entropy', 'belt', 243, 108000000, 'A belt that is slowly coming undone, forever.', { bonus: { hp: 4500, dmg: 160 } }); gear('vd_shield', 'aegis of nothing', 'shield', 247, 130000000, 'A round shield of perfect black. Attacks seem to fall into it.');
  item('vd_elixir', 'void elixir', 'potion', { heal: 90000, mana: 36000, value: 400000, long: 'A cold, dark draught. Drinking it feels like being forgiven by nothing.' }); item('vd_shard', 'void shard', 'treasure', { value: 450000, long: 'A shard of something that is not there.' }); item('vd_pearl', 'null pearl', 'treasure', { value: 600000, long: 'A perfectly black pearl of condensed nothing.' });
  const R = (id, name, icon, lv, ids, drops, big) => mob(id, name, icon, lv, { ids, big, drops: [['vd_elixir', 0.08], ['vd_shard', 0.14], ['vd_pearl', 0.08], ...drops], aggro: true });
  R('vd_crawler', 'void crawler', '\u{1F577}️', 250, ['crawler', 'void'], [['vd_boots', 0.05], ['vd_mask', 0.05]], 1.4); R('vd_stalker', 'void stalker', '\u{1F47E}', 250, ['stalker', 'void'], [['vd_cloak', 0.05], ['vd_gloves', 0.05]], 1.6); R('vd_maw', 'void maw', '\u{1F573}️', 250, ['maw', 'void'], [['vd_legs', 0.05], ['vd_belt', 0.04]], 1.9);
  R('vd_knight', 'void knight', '\u{1F5E1}️', 250, ['knight', 'void'], [['vd_plate', 0.04], ['vd_shield', 0.04]], 2.0); R('vd_seer', 'void seer', '\u{1F441}️', 250, ['seer', 'void'], [['vd_staff', 0.03], ['vd_ring', 0.04]], 1.8); R('vd_hulk', 'void hulk', '\u{1F311}', 250, ['hulk', 'void'], [['vd_scythe', 0.03], ['vd_helm', 0.04]], 2.3);
  mob('vd_sovereign', 'Nihil, the Void Sovereign', '⚫', 250, { boss: 1, big: 4.0, ids: ['nihil', 'sovereign', 'void'], drops: [['vd_elixir', 0.95], ['vd_shard', 0.9], ['vd_pearl', 0.9], ['vd_blade', 0.45], ['vd_amulet', 0.4], ['vd_helm', 0.3]] });
  const P = ['vd_crawler', 'vd_stalker', 'vd_maw'];
  const Z = [[4, 'The Threshold', 'stone', ['vd_crawler', 'vd_stalker'], ['Gray', 'Silent', 'Dim', 'Fading', 'Cold'], ['Edge', 'Drift', 'Shallows', 'Hush', 'Fog'], 'Gray nothing. The floor is there because you expect it to be. The edge of the universe, where light gives up.'],
    [8, 'The Hollow Reaches', 'stone', ['vd_stalker', 'vd_maw', 'vd_knight', 'vd_crawler'], ['Hollow', 'Empty', 'Echoless', 'Lightless', 'Muffled'], ['Gulf', 'Expanse', 'Void-Field', 'Silence', 'Nowhere'], 'A dark gray expanse with no walls and no sound. Things move at the edge of your sight, and stop when you look.'],
    [13, 'The Umbral Deep', 'stone', ['vd_maw', 'vd_knight', 'vd_seer', 'vd_hulk'], ['Crushing', 'Starving', 'Sinking', 'Drowned', 'Lightless'], ['Abyss', 'Throat', 'Well', 'Maw-Field', 'Dark Spiral'], 'The dark thickens until it feels like water. Pale shapes with too many limbs drift by, and every one of them knows you are here.'],
    [18, 'The Heart of Nothing', 'stone', ['vd_seer', 'vd_hulk', 'vd_knight', 'vd_maw'], ['Final', 'Unmade', 'Ending', 'Null', 'Absolute'], ['Core', 'Singularity', 'Silence', 'End', 'Zero'], 'The center of the void, where even the dark is gone. The only thing left is the pull toward the one place everything falls.']];
  require('./gridgen')(rooms, { area: 'void', cols: 10, rows: 10, z: 320, zones: Z, specials: {
    '0_2': ['The Warden\'s Threshold', 'A small platform of pale gray stone floating in the nothing, with a single lantern whose light only reaches the edge of the stone. Veyra, Warden of the Threshold, a tall figure in a hooded gray robe with a face you can never quite remember, waits. "Only the strongest may cross: your level plus your remorts must reach 250. Beyond this stone the voids hunt, and the moment you step past, the contract begins: kill every void within thirty minutes, or be forgotten." A safe place.', { safe: true, camp: true, minEff: 250, voidgate: true, shop: { stock: ['vd_elixir', 'vd_cloak', 'vd_boots', 'vd_mask', 'vd_belt', 'vd_gloves'] } }],
    '9_9': ['The Throne of Nothing', 'There is a throne here, made of the lack of anything. Nihil, the Void Sovereign, a vast black shape with a ring of cold fire around it, turns toward you: "I am what is left when everything is done. I was here before the first star, and I will be here after the last."', {}, ['vd_sovereign', 'vd_hulk', 'vd_seer']],
  } });
  for (const r of Object.values(rooms)) if (r.area === 'void') { r.dim = true; if (r.mobs && !r.safe) r.void = true; } // dim: room descriptions are dark gray
  return { post: () => {} };
};
// Entering the Void's first room past the gate starts the automatic contract: 30 minutes to kill every void.
const QID = 'q_void', LIMIT = 30 * 60 * 1000;
D.voidMin = 250; D.effLevel = (p) => (p.level || 1) + (p.remort || 0);
D.voidArrive = (p, room) => {
  if (!room.def.void || p.quests[QID] || (p.qdone && p.qdone.has(QID))) return; const q = D.qDef && D.qDef(QID); if (!q) return;
  p.quests[QID] = { prog: [], dl: Date.now() + LIMIT, warn: 0 };
  p.msg('*** THE VOID CONTRACT: Kill every void (the crawlers, stalkers, maws, knights, seers and hulks, and Nihil, the Sovereign) within 30 minutes or be forgotten. ***', 'win'); for (const o of q.obj) p.msg(`  - ${D.objText(o)}`, 'quest'); p.send({ t: 'sound', k: 'quest' }); p.sendQuests();
};
D.voidBlock = (p, dest) => dest.def.minEff && D.effLevel(p) < dest.def.minEff ? `A cold gray hand pushes you back. Veyra's voice: "Not yet. Your level plus your remorts must reach ${dest.def.minEff} to cross; yours is ${D.effLevel(p)}."` : '';
D.voidCheck = (p, q) => { // called after kill progress: finish automatically
  if (!q || q.id !== QID || !p.quests[QID]) return; if (D.qReady(p, q)) { D.qComplete(p, q); p.msg('The Void falls silent. You are remembered.', 'win'); }
};
setInterval(() => {
  for (const p of D.players.values()) { const st = p.quests && p.quests[QID]; if (!st || !st.dl) continue; const left = st.dl - Date.now();
    if (left <= 0) { delete p.quests[QID]; p.msg('*** Time is up. The Void forgets you: the contract is lost. Cross the threshold again to take it up anew. ***', 'hurt'); p.sendQuests(); if (p.env && p.env.def.void) { const g = D.rooms.get('void/0_2'); if (g) { p.move(g); p.env.look(p); } } continue; }
    for (const m of [20, 10, 5, 1]) if (left <= m * 60000 && !st['w' + m]) { st['w' + m] = 1; p.msg(`Void contract: ${m} minute${m > 1 ? 's' : ''} left.`, 'quest'); } }
}, 15000).unref();
