'use strict';
// The Bodyguard Agency (Ashfall): `hire bodyguard` rents one for one hour. The bodyguard's level is half yours; it follows you and strikes your enemy every round.
// While one is active you earn 10% less experience and credits. `dismiss bodyguard` sends it home. A bodyguard is not a person: it cannot be hurt.
const D = require('./lib'), { statsFor } = require('./gen'), NAMES = ['Brick', 'Tank', 'Moose', 'Gunther', 'Vince', 'Bruno', 'Duke', 'Rocco', 'Hammer', 'Tiny', 'Boulder', 'Mack'];
const HOUR = 3600 * 1000, cost = (p) => Math.max(1000, p.level * 600);
D.bgOn = (p) => !!(p.bodyguard && p.bodyguard.until > Date.now());
D.bgLevel = (p) => Math.max(1, Math.floor(p.level / 2));
D.cleanBodyguard = (raw) => (raw && typeof raw === 'object' && raw.until > Date.now() ? { name: String(raw.name || 'Brick').replace(/[^A-Za-z ]/g, '').slice(0, 16) || 'Brick', until: +raw.until } : null);
D.bgHire = (p) => {
  if (!p.env.def.bodyguard) return p.msg('Hire bodyguards at the Ironside Bodyguard Agency in Ashfall (off the town streets).', 'sys'); if (D.bgOn(p)) return p.msg(`${p.bodyguard.name} is already guarding you (${Math.ceil((p.bodyguard.until - Date.now()) / 60000)} minutes left).`, 'sys');
  const c = cost(p); if (p.gold < c) return p.msg(`A bodyguard for an hour costs ${c.toLocaleString()} credits (600 per level). You have ${p.gold.toLocaleString()}.`, 'sys'); p.gold -= c; p.bodyguard = { name: NAMES[D.rnd(0, NAMES.length - 1)], until: Date.now() + HOUR };
  p.msg(`*** ${p.bodyguard.name}, a level ${D.bgLevel(p)} bodyguard, is yours for one hour (${c.toLocaleString()} credits)! *** He follows you and strikes your enemies every round. You earn 10% less experience and credits while he is on the job. \`dismiss bodyguard\` sends him away.`, 'win'); p.sendStats(); };
D.bgDismiss = (p) => { if (!D.bgOn(p)) return p.msg('You have no bodyguard.', 'sys'); p.msg(`${p.bodyguard.name} nods, tips his hat and walks away. (No refund.)`, 'sys'); p.bodyguard = null; p.sendStats(); };
D.bgStatus = (p) => { if (!D.bgOn(p)) return p.msg(`You have no bodyguard. The Ironside Bodyguard Agency in Ashfall rents one for an hour (${cost(p).toLocaleString()} credits at your level). \`hire bodyguard\`.`, 'sys'); p.msg(`${p.bodyguard.name}, level ${D.bgLevel(p)} bodyguard: ${Math.ceil((p.bodyguard.until - Date.now()) / 60000)} minutes left. You earn 10% less XP and credits meanwhile. \`dismiss bodyguard\`.`, 'win'); };
D.bgStrike = (p) => {
  if (!D.bgOn(p)) { if (p.bodyguard) { p.msg(`${p.bodyguard.name}'s hour is up, and he leaves.`, 'sys'); p.bodyguard = null; p.sendStats(); } return; } const t = p.enemy; if (!t || t.hp <= 0 || t.env !== p.env) return;
  const st = statsFor(D.bgLevel(p), 0, 1), n = p.bodyguard.name; if (Math.random() < 0.2) return p.msg(`${n} swings at ${t.the()} and misses.`, 'miss');
  let dmg = Math.max(1, D.rnd(st.dmg[0], st.dmg[1]) - D.rnd(0, Math.floor(t.ac() * 0.6))); if (Math.random() < 0.1) dmg = Math.round(dmg * 1.5); dmg = t.hurt(dmg); p.msg(`${n} hammers ${t.the()}. (${dmg})`, 'combat'); p.env.tell(`${n} hammers ${t.the()} for ${p.name}.`, p, 'combat2'); if (t.hp <= 0) t.die(p);
};
const hb = D.Player.prototype.heart_beat; D.Player.prototype.heart_beat = function () { hb.call(this); if (this.bodyguard && !this.isBot && this.env) { try { D.bgStrike(this); } catch (e) { D.log('bodyguard', e.message); } } };
module.exports = (items, mobs, rooms) => { // the agency: a safe room off one of Ashfall's streets
  const town = Object.entries(rooms).filter(([, r]) => r.area === 'town'), occ = (x, y, z) => town.some(([, r]) => r.x === x && r.y === y && (r.z || 0) === z), DIRS = { e: [1, 0, 'w'], w: [-1, 0, 'e'], n: [0, -1, 's'], s: [0, 1, 'n'] };
  for (const [key, r] of town.filter(([k]) => !/taxi/.test(k)).sort((a, b) => Math.abs(a[1].x) + Math.abs(a[1].y) - Math.abs(b[1].x) - Math.abs(b[1].y))) { for (const [d, [dx, dy, back]] of Object.entries(DIRS)) { if ((r.exits || {})[d] || occ(r.x + dx, r.y + dy, r.z || 0)) continue; rooms['town/bodyguard'] = { name: 'Ironside Bodyguard Agency', area: 'town', realm: r.realm || 'town', x: r.x + dx, y: r.y + dy, z: r.z || 0, terrain: 'concrete', indoor: true, safe: true, bodyguard: true, exits: { [back]: key }, long: 'A sleek, dark-paneled office with a wall of framed photos of very large men shaking hands with very small clients. Big Vince Moretti, the agency boss, sits behind a desk the size of a car: "Rough out there? For credits I will rent you a professional for an hour, half your level and loyal to the last. `hire bodyguard`. `dismiss bodyguard` when you are done. Mind, you do not get the full take with a guard on the job: ten percent comes off your experience and credits." A safe place.' }; r.exits[d] = 'town/bodyguard'; return { post: () => {} }; } }
  throw new Error('bodyguard: no free spot off Market Row');
};
module.exports.D = D;
