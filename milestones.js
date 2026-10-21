'use strict';
// A physical milestone in every area. Touch it to attune yourself; from any milestone you can then travel instantly to any other milestone you have touched.
const LEVELS = { town: 'hub', forest: '1-7', crypt: '4-9', marsh: '8-13', road: '12-16', mines: '12-17', gulch: '10-14', modern: '10-16', bank: '15-17', thorn: '15-19', dunes: '18-24', prime: '21-28', aurora: '22-26', frost: '24-30', reach: '27-31', ember: '30-34', rail: '32-36', hollow: '33-39', citadel: '35-38', abyss: '39-40', cave: '26-33', grounds: 'bots' };
const ORDER = ['town', 'forest', 'crypt', 'marsh', 'road', 'mines', 'gulch', 'bank', 'modern', 'thorn', 'dunes', 'prime', 'cave', 'aurora', 'frost', 'reach', 'ember', 'rail', 'hollow', 'citadel', 'abyss', 'grounds'];
const PREFER = { town: 'town/square', forest: 'forest/path', modern: 'modern/gate', prime: 'prime/landing', hollow: 'hollow/chapel', grounds: 'grounds/yard', dunes: 'dunes/oasis', bank: 'bank/a' }; // otherwise: the area's first safe room, else its first room
const place = (items, rooms, list, area, name, levels, room) => { // one milestone in one area
  const iid = 'milestone_' + area; items[iid] = { name: 'milestone', short: 'a ' + require('./lib').rainbow('milestone'), ids: ['milestone', 'stone', 'marker', iid], fixed: true, ms: area, long: `A waist-high standing stone, pale and smooth, carved with the sigil of ${name} and humming faintly. A milestone: type \`touch milestone\` to attune yourself to ${name}. Once attuned, you can travel here instantly from any other milestone (\`milestone\`, \`milestones\`).`,
    actions: { touch: (p, a) => { if (a && !/milestone|stone|marker/.test(a.toLowerCase())) return false; require('./lib').touchMilestone(p, area); return true; } } };
  rooms[room].items = [...(rooms[room].items || []), iid]; list.push({ area, room, name, levels });
};
module.exports = (items, rooms) => {
  const list = [], label = (a) => (require('./lib').AREA_LABEL[a] || a).replace(/\s*\([^)]*\)\s*$/, '');
  for (const area of ORDER) {
    const ids = Object.keys(rooms).filter((r) => rooms[r].area === area); if (!ids.length) continue;
    const room = PREFER[area] && rooms[PREFER[area]] ? PREFER[area] : (ids.find((r) => rooms[r].safe) || ids[0]);
    place(items, rooms, list, area, label(area), LEVELS[area] || '', room);
  }
  return list;
};
module.exports.place = place; module.exports.ORDER = ORDER; module.exports.LEVELS = LEVELS;
