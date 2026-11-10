'use strict';
// Starship Aurora and Frostpeak Station grow to 50 rooms each: new decks and tunnels attached to the east end of each, filled with the area's own monsters.
module.exports = (items, mobs, rooms) => {
  const attach = (area, key, cols, rows, z, zones, specials) => {
    const own = Object.entries(rooms).filter(([, r]) => r.area === area && (r.z || 0) === z), pool = [...new Set(own.flatMap(([, r]) => r.mobs || []))];
    const edge = own.filter(([, r]) => !(r.exits || {}).e && !/trail_/.test(r.name || '')).sort((a, b) => b[1].x - a[1].x || a[1].y - b[1].y)[0]; if (!edge) throw new Error('futureext: no east edge in ' + area);
    const before = new Set(Object.keys(rooms)); require('./gridgen')(rooms, { area: key, cols, rows, z, indoor: true, zones: zones.map((zz) => [zz[0], zz[1], zz[2], pool.length ? zz[3].filter((m) => pool.includes(m)).length ? zz[3].filter((m) => pool.includes(m)) : pool : pool, zz[4], zz[5], zz[6]]), specials });
    const fresh = Object.keys(rooms).filter((k) => !before.has(k)), ox = edge[1].x + 1, oy = edge[1].y; for (const k of fresh) { rooms[k].area = area; rooms[k].x += ox; rooms[k].y += oy; rooms[k].z = z; }
    const first = rooms[`${key}/0_0`]; const gate = fresh.find((k) => rooms[k].x === ox && rooms[k].y === oy); edge[1].exits.e = gate; rooms[gate].exits.w = edge[0]; return fresh.length;
  };
  const aur = Object.values(rooms).find((r) => r.area === 'aurora'), fro = Object.values(rooms).find((r) => r.area === 'frost');
  attach('aurora', 'aurora2', 7, 5, aur.z || 0, [
    [3, 'Lower Cargo Deck', 'metal', [], ['Dim', 'Rusted', 'Cluttered', 'Flooded', 'Sparking'], ['Cargo Hold', 'Freight Lane', 'Loading Bay', 'Crate Row', 'Service Duct'], 'A cavernous cargo deck of stacked containers and dripping pipes, lit by a few failing emergency lights.'],
    [6, 'Machine Decks', 'metal', [], ['Humming', 'Greasy', 'Rattling', 'Overheated', 'Bent'], ['Machine Shop', 'Pump Room', 'Generator Hall', 'Coolant Loop', 'Maintenance Bay'], 'Decks of silent machinery, half of it still running. Something moves among the pipes.'],
    [8, 'Crew Decks', 'metal', [], ['Abandoned', 'Ransacked', 'Cramped', 'Sealed', 'Overgrown'], ['Berth Corridor', 'Mess Hall', 'Rec Room', 'Gym', 'Barracks'], 'The crew\'s living decks: bunks, lockers and the remains of a hundred last meals, all abandoned in a hurry.'],
    [10, 'Forward Command Decks', 'metal', [], ['Dark', 'Silent', 'Shattered', 'Red-lit', 'Frozen'], ['Command Corridor', 'Navigation Deck', 'Comms Room', 'Armory', 'Officers\' Row'], 'The forward decks, where the officers ran the ship, quiet and wrong, with red emergency lights and the smell of something long dead.'],
  ], { '3_2': ['Crew Mess Hall', 'A big, quiet mess hall of steel tables and bolted chairs, with a working coffee machine somebody stocked and a heat lamp in one corner. A safe place to rest.', { safe: true, camp: true }], '6_4': ['Aft Singularity Chamber', 'A vast, humming chamber at the stern around a tiny, caged black hole. Everything in the room leans toward it, slightly.', {}, null] });
  attach('frost', 'frost2', 8, 4, fro.z || 0, [
    [3, 'Ice Tunnels', 'stone', [], ['Frozen', 'Glittering', 'Narrow', 'Echoing', 'Blue-lit'], ['Tunnel', 'Ice Gallery', 'Crawlway', 'Cavern', 'Drift'], 'A tunnel of blue ice, glittering in the work lights. The wind sighs through cracks in the walls.'],
    [5, 'Lower Laboratories', 'metal', [], ['Frosted', 'Abandoned', 'Sealed', 'Shattered', 'Dripping'], ['Laboratory', 'Cryo Lab', 'Specimen Room', 'Sample Vault', 'Clean Room'], 'The deep laboratories of Frostpeak Station, where the researchers studied something in the ice, then stopped writing reports.'],
    [7, 'Generator Halls', 'metal', [], ['Groaning', 'Humming', 'Frost-rimed', 'Dark', 'Shaking'], ['Generator Hall', 'Turbine Room', 'Fuel Store', 'Heat Exchanger', 'Pump House'], 'Great halls of turbines and steam pipes that keep the station from freezing solid. They are not quite doing their job.'],
    [10, 'Summit Platform', 'stone', [], ['Howling', 'Wind-blasted', 'Windswept', 'Barren', 'Exposed'], ['Summit', 'Ridge', 'Observation Deck', 'Antenna Field', 'Landing Pad'], 'The top of Frostpeak: antenna masts, a wind that tries to push you off, and a view of the whole frozen range.'],
  ], { '3_1': ['Frostpeak Warming Hut', 'A small insulated hut with a stove, hot soup, bunks and a hand-lettered sign: THIS HUT IS A TRUCE. A safe place to rest.', { safe: true, camp: true }], '7_3': ['Frostpeak Summit Observatory', 'A domed observatory on the highest point of the range, its great telescope pointed at something that is not a star.', {}, null] });
  return { post: () => {} };
};
