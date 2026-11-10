'use strict';
// A physical milestone in every area. Touch it to attune yourself; from any milestone you can then travel instantly to any other milestone you have touched.
const LEVELS = { town: 'hub', forest: '1-7', crypt: '4-9', marsh: '8-13', road: '12-16', mines: '12-17', gulch: '10-14', modern: '10-16', bank: '15-17', thorn: '15-19', dunes: '18-24', prime: '21-28', aurora: '185-190', frost: '186-191', reach: '27-31', ember: '188-193', rail: '32-36', hollow: '33-39', citadel: '35-38', abyss: '192-196', cave: '26-33', buck: '1-4', manor: '12-18', mars: '189-194', castle: '31-38', farm: '1-50', brogym: '12-19', blimble: '1-10', pizza: '10-16', jungle: '40-55', sol: '150-200', camelot: '66-78', otherworld: '70-84', olympus: '86-100', asgard: '88-100', atlantis: '62-74', stripclub: '23-32', wrestling: '78-85', cloud: '96-100', cinema: '11-18', exterminus: '194-198', sea: '50-70', hades: '80-100', pluto: '196-200', grounds: 'bots' };
const ORDER = ['town', 'buck', 'forest', 'crypt', 'marsh', 'road', 'mines', 'gulch', 'bank', 'modern', 'thorn', 'dunes', 'prime', 'cave', 'aurora', 'frost', 'reach', 'ember', 'rail', 'hollow', 'citadel', 'abyss', 'grounds', 'manor', 'mars', 'castle', 'sea', 'hades', 'pluto', 'farm', 'brogym', 'blimble', 'cloud', 'cinema', 'exterminus', 'atlantis', 'stripclub', 'wrestling', 'camelot', 'otherworld', 'olympus', 'asgard', 'sol', 'pizza', 'jungle'];
const PREFER = { pizza: 'pizza/0_0', jungle: 'jungle/0_0', sol: 'sol/0_0', camelot: 'camelot/0_0', otherworld: 'otherworld/0_0', olympus: 'olympus/0_0', asgard: 'asgard/0_0', atlantis: 'atlantis/0_0', stripclub: 'stripclub/0_0', wrestling: 'wrestling/0_0', cinema: 'cinema/2_0', exterminus: 'exterminus/0_0', blimble: 'blimble/0_0', cloud: 'cloud/0_0', farm: 'farm/gate', brogym: 'brogym/2_0', sea: 'sea/0_0', hades: 'hades/0_0', pluto: 'pluto/0_0', castle: 'castle/g_0_0', mars: 'mars/0_0', manor: 'manor/0_0', buck: 'buck/0_0', town: 'town/square', forest: 'forest/path', modern: 'modern/gate', prime: 'prime/landing', hollow: 'hollow/chapel', grounds: 'grounds/yard', dunes: 'dunes/oasis', bank: 'bank/a' }; // otherwise: the area's first safe room, else its first room
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
