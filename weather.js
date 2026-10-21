'use strict';
// Weather by area. Old West areas get rain, dust devils and tornadoes; the Modern district gets rain and snow; sci-fi areas get electrical storms and EMPs.
// Weather is atmosphere (messages plus an animated overlay on the room picture): it never hurts anyone. Players indoors only hear it muffled; `mute weather on` hides it.
const D = require('./lib');
const GENRE = { town: 'west', road: 'west', gulch: 'west', rail: 'west', bank: 'west', mines: 'west', modern: 'modern', frost: 'scifi', ember: 'scifi', aurora: 'scifi', abyss: 'scifi' };
const KINDS = { west: [['rain', 5], ['dust', 3], ['tornado', 2]], modern: [['rain', 55], ['snow', 45]], scifi: [['storm', 6], ['emp', 4]] };
const LEN = { rain: [90, 200], dust: [45, 90], tornado: [40, 70], snow: [90, 200], storm: [60, 140], emp: [15, 25] }; // seconds
const TXT = {
  west: {
    rain: { name: 'rain', start: 'Dark clouds roll in over the plains and rain begins to drum on the boardwalks.', amb: ['Rain hammers the dusty street into mud.', 'Water pours off the eaves of every building.', 'A rumble of thunder rolls across the plains.'], end: 'The rain slows to a drizzle and stops. There is mud everywhere.', mute: 'You hear rain drumming on the roof.' },
    dust: { name: 'dust devil', start: 'A dust devil spins up out of the dry ground and wanders through the street.', amb: ['The dust devil whips grit into your eyes.', 'Tumbleweeds tumble past in the whirling wind.', 'A hat blows off somebody and does not come back.'], end: 'The dust devil collapses into a puff of sand.', mute: 'Something rattles the shutters: a dust devil, maybe.' },
    tornado: { name: 'tornado', start: 'A TORNADO drops from the clouds in the distance! A howling funnel of wind is tearing across the land. Take cover indoors!', amb: ['The tornado roars across the plains, tearing up fences and wagons.', 'Debris whirls through the air. This is no place to be outside.', 'A howling funnel rips the roof off a shed nearby.'], end: 'The tornado lifts back into the clouds and the wind dies down.', mute: 'A terrible roar shakes the walls: a tornado is outside!' },
  },
  modern: {
    rain: { name: 'rain', start: 'Rain starts pouring down on the asphalt, hissing on car roofs and gurgling in the gutters.', amb: ['Rain sheets off the parking lot.', 'Headlights smear across the wet pavement.', 'Water drips from every awning.'], end: 'The rain tapers off and leaves the street shining.', mute: 'Rain patters against the windows.' },
    snow: { name: 'snow', start: 'Snow begins to fall, dusting the cars, signs and rooftops in white.', amb: ['Fat snowflakes drift past the streetlights.', 'Snow squeaks underfoot and hides the lane lines.', 'A snowplow rumbles somewhere in the distance.'], end: 'The snow thins out and stops, and the world goes quiet.', mute: 'You see snow falling outside.' },
  },
  scifi: {
    storm: { name: 'electrical storm', start: 'An electrical storm crackles overhead, blue-white arcs dancing between the clouds and the ground!', amb: ['A bolt of lightning splits the sky with a crack of ozone.', 'Static electricity makes your hair stand on end.', 'Thunder shakes the ground.'], end: 'The electrical storm sputters out, leaving the air smelling of ozone.', mute: 'You hear thunder and a crackle of static outside.' },
    emp: { name: 'electromagnetic pulse', start: 'An ELECTROMAGNETIC PULSE rolls over the area! Every light flickers and your gear hums with static!', amb: ['Screens glitch and your equipment crackles with static.', 'A second ripple of electromagnetic noise washes past.'], end: 'The electromagnetic pulse fades and the lights steady.', mute: 'The lights flicker for a second: some kind of electromagnetic pulse.' },
  },
};
const state = {}; let timer = null; const rnd = (a, b) => a + Math.random() * (b - a);
const indoor = (r) => !r || r.z < 0 || (r.def && r.def.indoor) || /saloon|store|office|lab\b|clinic|hall\b|lobby|vault|restroom|trailer \d|\binn\b|armory|smithy|temple|guild|arcade|books|aisle|multi-mart:|multi-mart entrance|stockroom|bank|crypt|mine|cave|cavern|tunnel|burger barn|\bhut\b|techhut|dollar|corridor|cages|counting|galley|med bay|engineering|quarters|bridge|hatch|exchange|alchemist|stable|parlor|church|roundhouse|ticket|station\b|habitat|food court|chrome|implant|rebirth|car\b/i.test(r.name); // under a roof: you only hear the weather (an EMP reaches everywhere)
const pick = (g) => { const list = KINDS[g], tot = list.reduce((s, x) => s + x[1], 0); let r = Math.random() * tot; for (const [k, w] of list) { if ((r -= w) <= 0) return k; } return list[0][0]; };
const players = (area) => [...D.players.values()].filter((p) => !p.isBot && p.env && p.env.area === area);
const say = (area, text, muff, all) => { for (const p of players(area)) { if (p.mute && p.mute.weather) continue; const t = indoor(p.env) && !all ? muff : text; if (t) p.msg(t, 'weather'); } };
const push = (area) => { for (const p of players(area)) p.send({ t: 'wx', k: D.weatherFor(p) }); };
function begin(area, kind) { const g = GENRE[area], t = TXT[g][kind], s = (state[area] = { kind, until: Date.now() + rnd(...LEN[kind]) * 1000, amb: Date.now() + rnd(25, 45) * 1000 }); say(area, t.start, t.mute, kind === 'emp'); push(area); return s; }
function end(area) { const s = state[area]; if (!s) return; const t = TXT[GENRE[area]][s.kind]; delete state[area]; say(area, t.end, '', s.kind === 'emp'); push(area); }
function tick() {
  for (const area of Object.keys(GENRE)) {
    const s = state[area], now = Date.now();
    if (s) { if (now > s.until) end(area); else if (now > s.amb) { const t = TXT[GENRE[area]][s.kind]; s.amb = now + rnd(25, 45) * 1000; for (const p of players(area)) if (!(p.mute && p.mute.weather) && (!indoor(p.env) || s.kind === 'emp')) p.msg(t.amb[Math.floor(Math.random() * t.amb.length)], 'weather'); } }
    else if (Math.random() < 0.04 && players(area).length) begin(area, pick(GENRE[area]));
  }
}
D.weatherFor = (p) => { if (!p || !p.env || (p.mute && p.mute.weather)) return ''; const s = state[p.env.area]; return s && (!indoor(p.env) || s.kind === 'emp') ? s.kind : ''; };
function cmd(p, a) { // weather: what it is like where you are. Wizards can start or stop weather: weather <kind> | weather clear
  const area = p.env.area, g = GENRE[area], s = state[area], arg = a.trim().toLowerCase();
  if (arg && p.wiz) { if (!g) return p.msg('No weather happens in this area.'); if (arg === 'clear') { end(area); return p.msg('Weather cleared.', 'sys'); } const kind = Object.keys(TXT[g]).find((k) => k === arg || TXT[g][k].name.startsWith(arg)); if (!kind) return p.msg(`Weather here: ${Object.keys(TXT[g]).join(', ')}, or clear.`); if (s) end(area); begin(area, kind); return p.msg(`Started ${TXT[g][kind].name}.`, 'sys'); }
  if (!g) return p.msg('The weather never seems to change here. (Weather happens in the Old West, Modern and sci-fi areas.)', 'sys');
  if (p.mute && p.mute.weather) return p.msg('Weather messages are muted (type `mute weather off` to see them again).', 'sys');
  p.msg(s ? `${indoor(p.env) && s.kind !== 'emp' ? 'Outside, ' : ''}there is ${/^[aeiou]/.test(TXT[g][s.kind].name) ? 'an' : 'a'} ${TXT[g][s.kind].name} in this area right now.${indoor(p.env) && s.kind !== 'emp' ? ' You are indoors.' : ''}` : 'The weather is calm and clear.', 'weather');
}
const start = () => { timer = setInterval(tick, 15000); }, stop = () => { clearInterval(timer); };
module.exports = { start, stop, tick, cmd, state: () => state, begin, end, indoor, GENRE, TXT };
