'use strict';
// Starships that fly between two places: the Tharsis (Frostpeak Station and Mars) and the Crimson Fang (the Martian Fleet Dock and Pluto).
// `launch` in the cockpit or on the bridge sends the ship; an empty ship returns home after a few minutes.
const D = require('./lib');
const SHIPS = {
  tharsis: { name: 'Tharsis', rooms: ['frost/ship_ramp', 'frost/ship_deck', 'frost/ship_cockpit'], ramp: 'frost/ship_ramp', docks: { frost: 'frost/lodge', mars: 'mars/0_0' }, home: 'frost', ports: { frost: 'Frostpeak Station', mars: 'the Martian Landing Pad' }, pilot: 'the autopilot' },
  fang: { name: 'Crimson Fang', rooms: ['mars/fang_ramp', 'mars/fang_deck', 'mars/fang_bridge'], ramp: 'mars/fang_ramp', docks: { mars: 'mars/fleet', pluto: 'pluto/0_0' }, home: 'mars', ports: { mars: 'the Martian Fleet Dock', pluto: 'the Pluto Beachhead' }, pilot: 'Helmsman Zorp' },
};
const state = Object.fromEntries(Object.entries(SHIPS).map(([id, c]) => [id, { at: c.home, flying: false, empty: 0 }]));
const aboard = (id) => [...D.players.values()].filter((p) => p.env && SHIPS[id].rooms.includes(p.env.path));
function dock(id, where) { // put the ship at one of its two ports: the port room's `in` leads to the ramp, and the ramp's `out` leads to the port
  const c = SHIPS[id], ramp = D.rooms.get(c.ramp), dest = D.rooms.get(c.docks[where]); if (!ramp || !dest) return;
  for (const r of Object.values(c.docks)) { const x = D.rooms.get(r); if (x && x.exits.in === c.ramp) delete x.exits.in; } dest.exits.in = c.ramp; ramp.exits.out = c.docks[where]; state[id].at = where; state[id].flying = false;
}
function launch(p) {
  const con = p.env.inv.find((o) => o.def && o.def.launchTo); if (!con) return p.msg('The launch console is in the cockpit of the Tharsis (at Frostpeak Station) or on the bridge of the Crimson Fang (at the Martian Fleet Dock): `in`, then find the console.', 'sys');
  const id = con.def.shipId || 'tharsis', c = SHIPS[id], st = state[id]; if (st.flying) return p.msg(`The ${c.name} is already in flight.`, 'sys');
  const ports = Object.keys(c.docks), from = st.at, to = ports.find((k) => k !== from), crew = aboard(id); st.flying = true; st.empty = 0;
  for (const r of Object.values(c.docks)) { const x = D.rooms.get(r); if (x && x.exits.in === c.ramp) delete x.exits.in; } D.rooms.get(c.ramp).exits.out = undefined; delete D.rooms.get(c.ramp).exits.out;
  for (const o of crew) { o.msg(`${c.pilot === 'the autopilot' ? 'The autopilot' : c.pilot} announces: "All hands, brace for launch to ${c.ports[to]}!" Engines roar and the ship shakes.`, 'win'); o.send({ t: 'sound', k: 'skill' }); }
  setTimeout(() => { for (const o of aboard(id)) o.msg(`You feel the pull of acceleration, then weightlessness... ${to === 'pluto' ? 'Pluto glitters ahead: a frozen grey world with a blue-lit war across its face.' : to === 'mars' ? 'Mars grows ahead: a red world with canyons like scars.' : 'The stars slide past.'}`, 'sys'); }, 3000);
  setTimeout(() => { dock(id, to); for (const o of aboard(id)) o.msg(`The ${c.name} touches down at ${c.ports[to]}. The ramp lowers: type \`out\` to disembark.`, 'win'); }, 8000);
}
setInterval(() => { for (const [id, c] of Object.entries(SHIPS)) { const st = state[id]; if (st.flying) continue; dock(id, st.at); if (st.at !== c.home && !aboard(id).length) { st.empty = st.empty || Date.now(); if (Date.now() - st.empty > 180000) { dock(id, c.home); st.empty = 0; } } else st.empty = 0; } }, 30000).unref();
D.ships = { SHIPS, state, dock, launch }; D.shipDock = (where) => dock('tharsis', where);
module.exports = { SHIPS, state, dock, launch };
