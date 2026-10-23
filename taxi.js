'use strict';
// The milestone taxi: a yellow cab that tours every milestone, stays 30 seconds at each, and takes passengers for 30 credits a boarding.
// Riding on to the next stop is free; stepping out and boarding again costs another 30. The cab is the room town/taxi_cab (hidden from the maps).
const D = require('./driver');
const FARE = 30, STAY = 30000, DRIVE = 8000, CAB = 'town/taxi_cab';
const T = { i: 0, phase: 'stay', until: 0, route: [], timer: null };
const routeOf = () => (D.W && D.W.milestones ? D.W.milestones.map((m) => m.room).filter((r) => D.rooms.get(r)) : []);
const cab = () => D.rooms.get(CAB);
const stop = () => T.route[T.i] || null;
const label = (path) => { const r = D.rooms.get(path); return r ? `${r.name} (${(D.AREA_LABEL && D.AREA_LABEL[r.area]) || r.area})` : path; };
const inCab = () => (cab() ? cab().inv.filter((o) => o.isPlayer) : []);
const tellCab = (t, c = 'sys') => inCab().forEach((o) => o.msg(t, c));
function apply() { const c = cab(); if (!c) return; if (T.phase === 'stay' && stop()) c.exits.out = stop(); else delete c.exits.out; } // the door only opens at a stop
function depart() {
  const from = D.rooms.get(stop()); T.phase = 'drive'; T.until = Date.now() + DRIVE; apply();
  if (from) from.tell('\u{1F695} The yellow taxi pulls away from the curb and drives off.', null, 'sys');
  tellCab(`\u{1F695} The taxi pulls away. Next stop: ${label(T.route[(T.i + 1) % T.route.length])}.`, 'sys');
}
function arrive() {
  T.i = (T.i + 1) % T.route.length; T.phase = 'stay'; T.until = Date.now() + STAY; apply(); const to = D.rooms.get(stop());
  if (to) to.tell('\u{1F695} A yellow taxi pulls up and stops. (`enter taxi`: 30 credits)', null, 'event');
  tellCab(`\u{1F695} The taxi stops at ${label(stop())}. Type \`out\` to step out (it waits 30 seconds); stay in to ride on for free.`, 'win');
}
function tick() {
  if (!D.rooms.size || !cab()) return; if (!T.route.length || T.route.length !== routeOf().length) { T.route = routeOf(); if (T.i >= T.route.length) T.i = 0; if (!T.until) T.until = Date.now() + STAY; }
  apply(); if (!T.route.length) return; if (Date.now() < T.until) return; if (T.phase === 'stay') depart(); else arrive();
}
const here = (path) => T.phase === 'stay' && stop() === path;
const secs = () => Math.max(0, Math.ceil((T.until - Date.now()) / 1000));
function status() { return T.phase === 'stay' ? `The taxi is stopped at ${label(stop())} and leaves in ${secs()} seconds. Next stop: ${label(T.route[(T.i + 1) % T.route.length])}.` : `The taxi is on the road and arrives at ${label(T.route[(T.i + 1) % T.route.length])} in about ${secs()} seconds.`; }
function board(p) {
  if (!here(p.env.path)) return p.msg(T.phase === 'stay' ? `No taxi is here. ${status()}` : `No taxi is here right now. ${status()}`, 'sys');
  if (p.enemy) return p.msg('You are in a fight! Try to flee first.', 'hurt'); if (p.gold < FARE) return p.msg(`The fare is ${FARE} credits and you have ${p.gold}.`, 'sys');
  p.gold -= FARE; const from = p.env; p.msg(`You pay the driver ${FARE} credits and climb into the taxi.`, 'win'); from.tell(`${p.name} climbs into the taxi.`, p, 'sys'); p.enter(cab(), true); p.env.look(p); if (p.sendStats) p.sendStats();
}
function leave(p) { // `out` works through the cab's exit; this is `taxi out`
  if (p.env.path !== CAB) return p.msg('You are not in the taxi.', 'sys'); if (T.phase !== 'stay') return p.msg('The taxi is moving! Wait for the next stop.', 'sys'); D.command(p, 'out');
}
const start = () => { if (!T.timer) { T.timer = setInterval(() => { try { tick(); } catch (e) { D.log('taxi', e.stack); } }, 1000); if (T.timer.unref) T.timer.unref(); } };
const stopTimer = () => { clearInterval(T.timer); T.timer = null; };
module.exports = { T, tick, start, stop: stopTimer, here, status, board, leave, label, FARE, STAY, DRIVE, CAB };
