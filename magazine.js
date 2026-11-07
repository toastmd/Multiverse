'use strict';
// The magazine rack in Ashfall Square: `get magazine` (or `get mag`, or `get magazine from rack`), then `read magazine`. See news.js for the issue itself.
module.exports = (items, mobs, rooms) => {
  items.magazine = { name: 'Multiverse Magazine', short: 'a copy of the Multiverse Magazine', ids: ['magazine', 'mag', 'multiverse'], type: 'treasure', value: 0, mag: true, long: 'The Multiverse Magazine, a glossy news magazine with a lightning bolt on the cover. A new issue comes out every 30 minutes: contracts completed, new faces, level-ups, obituaries and tradeskill masters. Type `read magazine`.' };
  items.magrack = { name: 'magazine rack', short: 'a magazine rack', ids: ['rack', 'magrack', 'magazines', 'magazine rack'], type: 'fixture', fixed: true, rack: true, long: 'A tall wire rack of glossy magazines, all the same: the Multiverse Magazine, free to anyone. Type `get magazine`, then `read magazine`.' };
  return { post: () => { const s = rooms['town/square']; if (!s) return; s.items = [...(s.items || []), 'magrack']; if (!s.long.includes('magazine rack')) s.long += ' A wire magazine rack beside the fountain holds the free Multiverse Magazine: `get magazine`.'; } };
};
