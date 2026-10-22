'use strict';
// The Hall of Many Faces: the room where you change class (for a fee that grows with your level). Changing gender is free here (and anywhere, with `gender`).
module.exports = (items, mobs, rooms) => {
  rooms['town/hall_of_faces'] = { name: 'Hall of Many Faces', area: 'town', x: -3, y: -2, z: 0, safe: true, indoor: true, faces: true, terrain: 'stone', mobs: [], exits: { s: 'town/adventurers_guild' },
    long: 'A round hall of tall silver mirrors, each showing you as someone else: a gunslinger, a mage, a machine, a beast. A stooped old woman in a cloak of sewn-together masks polishes a mirror and watches you. "Change your class? It costs, dearie: type `changeclass` for the price list. A new face for your gender? That is free: `gender male|female|other`."' };
  rooms['town/adventurers_guild'].exits.n = 'town/hall_of_faces';
};
