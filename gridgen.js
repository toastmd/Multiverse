'use strict';
// Builds a cols x rows grid of rooms for a big area: names and descriptions come from distance bands (zones) away from the start room (0,0),
// monsters from each zone's pool, with hand-made special rooms. Used by Poseidon's Realm, Hades and Pluto.
module.exports = (rooms, S) => {
  const used = new Set(), zoneOf = (d) => S.zones.find((z) => d <= z[0]) || S.zones[S.zones.length - 1];
  for (let y = 0; y < S.rows; y++) for (let x = 0; x < S.cols; x++) {
    const d = x + y, z = zoneOf(d), key = `${x}_${y}`, sp = S.specials[key], zi = S.zones.indexOf(z); let name = sp ? sp[0] : '', n = 0;
    while (!name || used.has(name)) { name = `${z[4][(x * 3 + y * 7 + n) % z[4].length]} ${z[5][(x * 7 + y * 3 + Math.floor(n / 3)) % z[5].length]}`; n++; if (n > 80) name += ` ${n}`; } used.add(name);
    const pool = z[3], mm = sp && sp[3] ? sp[3] : (d === 0 ? [] : [pool[(x + y) % pool.length], pool[(x * 2 + y + 1) % pool.length]].slice(0, ((x * 5 + y * 3) % 3) ? 2 : 1));
    rooms[`${S.area}/${key}`] = { name, area: S.area, x, y, z: S.z, long: sp ? sp[1] : `${name}. ${z[6]}`, exits: {}, mobs: mm, terrain: z[2], ...(S.indoor ? { indoor: true } : {}), ...(sp ? sp[2] : {}), _zone: zi };
  }
  for (let y = 0; y < S.rows; y++) for (let x = 0; x < S.cols; x++) { const r = rooms[`${S.area}/${x}_${y}`]; if (x < S.cols - 1) { r.exits.e = `${S.area}/${x + 1}_${y}`; rooms[`${S.area}/${x + 1}_${y}`].exits.w = `${S.area}/${x}_${y}`; } if (y < S.rows - 1) { r.exits.s = `${S.area}/${x}_${y + 1}`; rooms[`${S.area}/${x}_${y + 1}`].exits.n = `${S.area}/${x}_${y}`; } }
  for (const r of Object.values(rooms)) if (r.area === S.area) delete r._zone;
};
