'use strict';
// Day and night: a game day lasts 48 real minutes (config world.dayMinutes). It gets a little darker as the day goes on: brightest at 1 pm, night from 9 pm to 5 am.
// At night, outdoors, you need a light: the `light` spell (spellcasters) or `make torch` (everyone). In the dark you cannot see the room, and you fight at -30%.
const D = require('./lib');
const dayMin = () => { try { return Math.max(4, +((require('./config')().world || {}).dayMinutes) || 48); } catch (e) { return 48; } };
D.gameHour = () => ((Date.now() / 60000) / dayMin() * 24 + 8) % 24;
D.darkness = () => (1 - Math.cos(2 * Math.PI * (D.gameHour() - 13) / 24)) / 2; // 0 at 1 pm, 1 at 1 am
D.isNight = () => D.darkness() >= 0.75;
D.todName = () => { const h = D.gameHour(), d = D.darkness(); if (d >= 0.75) return 'Night'; if (h >= 5 && h < 7) return 'Dawn'; if (h < 12) return 'Morning'; if (h < 17) return 'Afternoon'; return d < 0.5 ? 'Evening' : 'Dusk'; };
D.clockText = () => { const h = D.gameHour(), hh = Math.floor(h), mm = Math.floor((h - hh) * 60), ap = hh >= 12 ? 'PM' : 'AM', h12 = hh % 12 || 12; return `${h12}:${String(mm).padStart(2, '0')} ${ap}`; };
const LIT_AREAS = new Set(['town', 'modern', 'cinema', 'pizza', 'stripclub', 'brogym', 'manor', 'wrestling', 'buck', 'homes']), NATURAL = new Set(['grass', 'dirt', 'stone', 'water']);
D.outdoors = (room) => !!room && !room.def.indoor && !room.def.safe && !room.def.camp && NATURAL.has(room.terrain) && !LIT_AREAS.has(room.area);
D.hasLight = (p) => (p.lightUntil || 0) > Date.now();
D.isDark = (p, room) => !p.isBot && D.isNight() && D.outdoors(room || p.env) && !D.hasLight(p);
D.lightUp = (p, ms, why) => { const now = Date.now(); p.lightUntil = Math.min(now + 3600000, Math.max(p.lightUntil || 0, now) + ms); p.lightMax = Math.max(60000, p.lightUntil - now); p.msg(`${why} You can see again for ${Math.round((p.lightUntil - now) / 60000)} minutes.`, 'win'); p.sendStats && p.sendStats(); if (p.env && D.isNight() && D.outdoors(p.env)) p.env.look(p, true); };
D.makeTorch = (p) => { if ((p.cd.torch || 0) > Date.now()) return p.msg('You have only just made a torch: wait a moment.', 'sys'); p.cd.torch = Date.now() + 15000; D.lightUp(p, 20 * 60000, 'You wrap rags around a stick, dip it in pitch and light it with a spark: a torch (it burns for 20 minutes).'); };
// a dark room hides its description, items and who is in it; fighting in the dark costs 30% of your attack
const Player = D.Player, atk = Player.prototype.atkPool; Player.prototype.atkPool = function () { const v = atk.call(this); return D.isDark(this, this.env) ? Math.round(v * 0.7) : v; };
D.todInfo = () => ({ hr: Math.round(D.gameHour() * 100) / 100, dk: Math.round(D.darkness() * 100) / 100, nm: D.todName(), ck: D.clockText() });
let wasNight = D.isNight(), lastSend = 0;
setInterval(() => {
  const n = D.isNight(), info = D.todInfo();
  for (const p of D.players.values()) { if (p.isBot || !p.send || p.ld) continue; p.send({ t: 'tod', ...info }); if (n !== wasNight) { if (n && D.outdoors(p.env)) p.msg(`\u{1F319} Night falls. The land goes dark. ${D.hasLight(p) ? '' : 'You will need a light: type `light` (spellcasters) or `make torch`.'}`, 'event'); else if (!n && D.outdoors(p.env)) p.msg('\u{1F305} The sky pales: dawn breaks over the land.', 'event'); } if (D.hasLight(p) === false && p.lightUntil) { p.lightUntil = 0; if (D.isNight() && D.outdoors(p.env)) { p.msg('Your light gutters out. It is dark.', 'hurt'); p.sendStats && p.sendStats(); } } }
  wasNight = n;
}, 15000).unref();
module.exports = D.todInfo;
