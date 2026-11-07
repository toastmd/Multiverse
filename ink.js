'use strict';
// Ink & Iron: a tattoo and branding parlor in Ashfall (`ink` from Market Row). `tattoo <place> <what you want>` and `brand <place> <what you want>`, on your shoulder, back, leg or chest.
// `tattoo remove <place>` / `brand remove <place>` pays to have one taken off. Others see your markings when they look at you; `marks` lists yours.
const D = require('./lib');
const PLACES = ['shoulder', 'back', 'leg', 'chest'];
const price = (p, kind) => (kind === 'brand' ? 400 + 50 * p.level : 300 + 40 * p.level), removal = (p, kind) => Math.round(price(p, kind) * 1.5);
const clean = (s) => String(s || '').replace(/[\u27e6\u27e7\u0000-\u001f]/g, '').replace(/\s+/g, ' ').trim().slice(0, 70);
D.cleanMarks = (raw) => { const out = {}; if (raw && typeof raw === 'object') for (const pl of PLACES) { const m = raw[pl]; if (m && typeof m === 'object') { const o = {}; if (m.tattoo) o.tattoo = clean(m.tattoo); if (m.brand) o.brand = clean(m.brand); if (o.tattoo || o.brand) out[pl] = o; } } return out; };
const lines = (marks) => PLACES.filter((pl) => marks && marks[pl]).map((pl) => { const m = marks[pl], bits = []; if (m.tattoo) bits.push(`a tattoo of ${m.tattoo}`); if (m.brand) bits.push(`a brand of ${m.brand}`); return `on the ${pl}: ${bits.join(' and ')}`; });
D.ink = {
  PLACES, lines, price, removal,
  menu(p) { p.msg('INK & IRON: tattoos and brands', 'rname'); p.msg(`  Tattoo ${price(p, 'tattoo')} credits, brand ${price(p, 'brand')} credits; removing one costs half as much again (${removal(p, 'tattoo')} / ${removal(p, 'brand')}). One tattoo and one brand per place.`, 'items'); p.msg(`  Places: ${PLACES.join(', ')}.`, 'items'); p.msg('  `tattoo shoulder a coiled dragon`   `brand chest a lightning bolt`   `tattoo remove back`   `marks`', 'sys'); },
  apply(p, kind, a) {
    if (!p.env.def.parlor) return p.msg('You need a tattoo and branding parlor: Ink & Iron, off Market Row in Ashfall (type `ink` there).', 'sys'); a = a.trim(); if (!a || a === 'list') return D.ink.menu(p);
    const rm = a.match(/^(?:remove|erase|cover)\s+(\w+)$/i); p.marks = p.marks || {};
    if (rm) { const pl = rm[1].toLowerCase(); if (!PLACES.includes(pl)) return p.msg(`Where? ${PLACES.join(', ')}.`, 'sys'); const m = p.marks[pl]; if (!m || !m[kind]) return p.msg(`You have no ${kind} on your ${pl}.`, 'sys'); const c = removal(p, kind); if (p.gold < c) return p.msg(`Removing it costs ${c} credits.`, 'sys'); p.gold -= c; delete m[kind]; if (!m.tattoo && !m.brand) delete p.marks[pl]; p.msg(`The artist ${kind === 'brand' ? 'cuts away and heals' : 'lasers off'} your ${kind} on the ${pl}. (-${c} credits)`, 'win'); return p.sendStats(); }
    const m = a.match(/^(\w+)\s+(.+)$/); if (!m || !PLACES.includes(m[1].toLowerCase())) return p.msg(`Say where and what: \`${kind} shoulder a coiled dragon\` (places: ${PLACES.join(', ')}).`, 'sys');
    const pl = m[1].toLowerCase(), d = clean(m[2]); if (d.length < 3) return p.msg('Describe it in a few words.', 'sys'); if (/https?:|www\./i.test(d)) return p.msg('No web addresses on skin, please.', 'sys'); if (p.marks[pl] && p.marks[pl][kind]) return p.msg(`You already have a ${kind} on your ${pl}: remove it first (\`${kind} remove ${pl}\`).`, 'sys');
    const c = price(p, kind); if (p.gold < c) return p.msg(`A ${kind} costs ${c} credits.`, 'sys'); p.gold -= c; (p.marks[pl] = p.marks[pl] || {})[kind] = d;
    p.msg(kind === 'brand' ? `The branding iron hisses on your ${pl}: a brand of ${d}. (-${c} credits)` : `The needle buzzes on your ${pl}: a tattoo of ${d}. (-${c} credits)`, 'win'); p.env.tell(`${p.name} gets ${kind === 'brand' ? 'branded' : 'inked'}: ${d}.`, p, 'sys'); p.sendStats();
  },
  show(p, t) { const l = lines(t.marks); if (!l.length) return p.msg(t === p ? 'You have no tattoos or brands. (Ink & Iron, off Market Row in Ashfall.)' : `${t.name} has no visible tattoos or brands.`, 'sys'); p.msg(`${t === p ? 'Your' : t.name + "'s"} markings:`, 'rname'); for (const x of l) p.msg('  ' + x, 'items'); },
};
module.exports = (items, mobs, rooms) => {
  const anchor = rooms['town/market']; const taken = new Set(Object.values(rooms).filter((r) => r.area === 'town' && (r.z || 0) === (anchor.z || 0)).map((r) => r.x + ',' + r.y)); let pos = null;
  for (const [dx, dy] of [[0, -1], [1, -1], [-1, -1], [1, 0], [-1, 0], [0, 1], [1, 1], [-1, 1], [0, -2], [2, 0], [-2, 0], [0, 2]]) { const k = anchor.x + dx + ',' + (anchor.y + dy); if (!taken.has(k)) { pos = { x: anchor.x + dx, y: anchor.y + dy }; break; } }
  rooms['town/ink'] = { name: 'Ink & Iron Tattoo and Branding Parlor', area: 'town', x: pos.x, y: pos.y, z: anchor.z || 0, terrain: 'concrete', safe: true, indoor: true, parlor: true, exits: { out: 'town/market' }, mobs: [], items: [], long: 'A narrow parlor of flash-art sheets, humming needles and a rack of branding irons glowing in a little forge. Every wall is covered in designs: dragons, anchors, roses, skulls, lightning bolts and one very bad spelling of MOM. Inker Dax will ink or brand you with whatever you describe, on your shoulder, back, leg or chest: `tattoo` and `brand` show prices. A safe place.' };
  rooms['town/market'].exits.ink = 'town/ink'; return { post: () => { if (!rooms['town/market'].long.includes('Ink & Iron')) rooms['town/market'].long += ' A hand-painted sign points down an alley to INK & IRON, Tattoos and Branding (type `ink`).'; } };
};
