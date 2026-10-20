'use strict';
// Tradeskill engine: learning, gathering, crafting and salvaging. Skill data lives in tradeskills.js.
const D = require('./lib');
const { rnd } = D;
const need = (l) => 25 * l; // skill xp to leave a level
const SALV = { iron: { ore: 2 }, steel: { ore: 3, silver: 1 }, mithril: { mithril: 2, ore: 1 }, runed: { mithril: 2, silver: 2 }, adamant: { mithril: 3, silver: 2 }, dragon: { scale: 3, mithril: 2 }, void: { scale: 4, mithril: 4 } };
const PIECE_F = { sword: 1, mail: 1.5, helm: 0.6, shield: 0.8, boots: 0.6 }, TIER_ORDER = Object.keys(SALV);
const nm = (id) => (D.W.items[id] || {}).name || id, listOf = (o) => Object.entries(o).map(([i, n]) => `${n} ${nm(i)}`).join(', ');
const findSkill = (w) => { w = String(w || '').trim().toLowerCase(); return w && Object.keys(D.T.SKILLS).find((k) => k === w || D.T.SKILLS[k].name.toLowerCase() === w || D.T.SKILLS[k].verb === w || k.startsWith(w)); };

D.skillGain = (p, id, xp) => {
  const k = p.skills[id], s = D.T.SKILLS[id]; if (p.cls === 'scavenger') xp = Math.ceil(xp * 1.5); k.xp += xp;
  while (k.lvl < D.T.MAX && k.xp >= need(k.lvl)) { k.xp -= need(k.lvl); k.lvl++; p.msg(`*** Your ${s.name} skill rises to level ${k.lvl}! ***`, 'win'); p.send({ t: 'sound', k: 'skill' }); }
};
const gate = (p, id) => { if (p.skills[id]) return true; p.msg(`You have not learned ${D.T.SKILLS[id].name}. Type \`learn ${id}\` (it is free, any time).`); return false; };

D.tradeSkills = (p, arg) => {
  const S = D.T.SKILLS, id = findSkill(arg);
  if (arg && arg.trim() && !id) return p.msg('No such tradeskill. Type `tradeskills` for the list.');
  if (id) { // details for one skill
    const s = S[id], k = p.skills[id]; p.msg(`${s.icon} ${s.name}${k ? `: level ${k.lvl}/${D.T.MAX}, ${k.xp}/${need(k.lvl)} xp` : ': not learned (type `learn ' + id + '`)'}`, 'rname'); p.msg(s.desc, 'text');
    if (s.kind === 'gather') { p.msg(`Command: ${s.verb}. Works in rooms with ${s.nodeName}. Finds:`, 'sys'); for (const l of s.loot) p.msg(`  ${nm(l.id)}${l.min > 1 ? ` (from skill level ${l.min})` : ''}`, k && k.lvl >= l.min ? 'spell' : 'sys'); }
    else if (s.kind === 'salvage') p.msg('Command: salvage <item> or salvage all (everything unworn, not kept and not legendary).', 'sys');
    else { p.msg(`Command: ${s.verb} <recipe>. Recipes:`, 'sys'); for (const r of s.recipes) if (D.W.items[r.out]) p.msg(`  ${k && k.lvl >= r.lvl ? '✔' : '🔒'} lvl ${String(r.lvl).padStart(2)}  ${r.k}: ${listOf(r.need)} -> ${nm(r.out)}`, k && k.lvl >= r.lvl ? 'spell' : 'sys'); }
    return;
  }
  p.msg('Tradeskills: every character can learn any of these, at any time, for free. Type `learn <skill>`.', 'rname');
  for (const [i, s] of Object.entries(S)) { const k = p.skills[i];
    p.msg(`${s.icon} ${s.name}  [${k ? `learned, level ${k.lvl}/${D.T.MAX}` : 'not learned'}]  command: ${s.verb}`, k ? 'win' : 'spell'); p.msg('    ' + s.desc, 'sys'); }
  p.msg('`tradeskills <name>` shows details and recipes. Prospectors learn tradeskills 50% faster. Sell gathered materials at any shop; the Salvage Exchange pays the most.', 'sys');
};
D.learnSkill = (p, a) => {
  if (!a.trim()) return D.tradeSkills(p); const id = findSkill(a); if (!id) return p.msg('No such tradeskill. Type `tradeskills` for the list.');
  if (p.skills[id]) return p.msg(`You already know ${D.T.SKILLS[id].name} (level ${p.skills[id].lvl}).`);
  p.skills[id] = { lvl: 1, xp: 0 }; const s = D.T.SKILLS[id];
  p.msg(`${s.icon} You learn ${s.name}! Use \`${s.verb}\`${s.kind === 'craft' ? ' <recipe>' : s.kind === 'salvage' ? ' <item>' : ''}. Type \`tradeskills ${id}\` for details.`, 'win');
};
D.unlearnSkill = (p, a) => { const id = findSkill(a); if (!id || !p.skills[id]) return p.msg('You have not learned that.'); delete p.skills[id]; p.msg(`You set aside ${D.T.SKILLS[id].name}. Its progress is lost.`, 'sys'); };

const ROM = ['I', 'II', 'III', 'IV', 'V'];
const toolIdFor = (skill) => Object.keys(D.T.TOOLS).find((t) => D.T.TOOLS[t].skill === skill);
D.toolTier = (p, skill) => { const u = ((p.tools || {})[toolIdFor(skill)] || {}).uses || 0; let t = 1; D.T.TOOL_TIERS.forEach((n, i) => { if (u >= n) t = i + 1; }); return t; };
D.toolUse = (p, skill) => { // every use brings the tool closer to its next Mark
  const id = toolIdFor(skill), tl = D.T.TOOLS[id]; if (!p.tools[id]) p.tools[id] = { uses: 0 };
  const before = D.toolTier(p, skill); p.tools[id].uses++; const after = D.toolTier(p, skill);
  if (after > before) p.msg(`${tl.icon} Your ${tl.name} improves to Mk ${ROM[after - 1]}!`, 'win');
};
D.toolsList = (p) => {
  p.msg('Tools (bound to you: they cannot be dropped or sold, and are saved with your character). They improve with use.', 'rname');
  for (const [id, tl] of Object.entries(D.T.TOOLS)) {
    const u = (p.tools[id] || {}).uses || 0, t = D.toolTier(p, tl.skill), nextAt = D.T.TOOL_TIERS[t], k = p.skills[tl.skill];
    p.msg(`${tl.icon} ${tl.name} Mk ${ROM[t - 1]}  (${u} uses${nextAt !== undefined ? `, ${nextAt - u} more for Mk ${ROM[t]}` : ', maximum'})  for ${D.T.SKILLS[tl.skill].name}${k ? '' : ' (skill not learned yet)'}`, k ? 'spell' : 'sys');
    p.msg(`    ${tl.desc} Bonus at Mk ${ROM[t - 1]}: ${bonusText(tl.skill, t)}.`, 'sys');
  }
};
const bonusText = (skill, t) => {
  const s = D.T.SKILLS[skill], xp = `+${10 * t}% skill XP`;
  if (s.kind === 'gather') return `${Math.round(3000 - Math.max(0, 300 * (t - 1))) / 1000}s between uses, ${10 * t}% chance of an extra find, better rare finds, ${xp}`;
  if (skill === 'smithing') return `${5 * t}% chance to save the materials, ${xp}`;
  if (skill === 'salvaging') return `+${Math.floor(t / 2)} to the main material, ${5 * t}% chance of double, ${xp}`;
  return `${5 * t}% chance of a double batch, ${xp}`;
};

D.tradeGather = (p, id) => {
  const s = D.T.SKILLS[id]; if (!gate(p, id)) return; const k = p.skills[id], t = D.toolTier(p, id);
  if (p.enemy) return p.msg('You cannot concentrate while fighting!', 'hurt');
  const now = Date.now(); if ((p.cd['t_' + id] || 0) > now) return p.msg('Give it a moment.');
  const nodes = p.env.nodes || {}; if (!(nodes[s.res] > 0)) return p.msg(`There are no ${s.nodeName} here.`);
  p.cd['t_' + id] = now + Math.max(1800, 3000 - 300 * (t - 1)); const got = {}; let xp = 4, bagged = 0, floor = 0;
  let n = rnd(1, 1 + Math.floor(k.lvl / 12)) + (p.cls === 'scavenger' ? 1 : 0) + (Math.random() < 0.1 * t ? 1 : 0);
  const pool = s.loot.filter((l) => k.lvl >= l.min).map((l) => [l.id, l.w + (l.rare ? Math.floor(k.lvl / 4) + 2 * (t - 1) : 0), l.rare]), total = pool.reduce((a, e) => a + e[1], 0);
  for (; n > 0; n--) {
    let r = Math.random() * total, pick = pool[0]; for (const e of pool) { if ((r -= e[1]) < 0) { pick = e; break; } }
    const where = D.give(p, pick[0], 'loot'); if (where === 'bag') bagged++; if (where === 'floor') floor++; got[pick[0]] = (got[pick[0]] || 0) + 1; if (pick[2]) xp += 6;
  }
  nodes[s.res]--; p.msg(`${s.icon} ${s.name}: you gather ${listOf(got) || 'nothing'}${bagged ? ` (${bagged} into your bag of holding)` : ''}${floor ? ` (${floor} fell to the ground: pack and bag are full)` : ''}.`, 'win');
  D.toolUse(p, id); D.skillGain(p, id, Math.round(xp * (1 + 0.1 * t)));
};

D.tradeCraft = (p, id, arg) => {
  const s = D.T.SKILLS[id]; if (!gate(p, id)) return; const k = p.skills[id], recs = s.recipes.filter((r) => D.W.items[r.out]), key = String(arg || '').trim().toLowerCase().replace(/[\s']+/g, '_');
  if (!key) { p.msg(`${s.icon} ${s.name} recipes (your level ${k.lvl}). Materials in your bag count. Use: ${s.verb} <recipe>`, 'rname'); for (const r of recs) p.msg(`  ${k.lvl >= r.lvl ? '✔' : '🔒'} lvl ${String(r.lvl).padStart(2)}  ${r.k}: ${listOf(r.need)} -> ${nm(r.out)}`, k.lvl >= r.lvl ? 'spell' : 'sys'); return; }
  const r = recs.find((x) => x.k === key) || recs.find((x) => x.k.startsWith(key)) || recs.find((x) => x.k.includes(key)); if (!r) return p.msg(`No such recipe. Type \`${s.verb}\` to list them.`);
  if (k.lvl < r.lvl) return p.msg(`${r.k} needs ${s.name} level ${r.lvl} (yours is ${k.lvl}).`);
  if (s.forge && !p.env.def.forge) return p.msg('You need a forge for that. Brann\'s Smithy in Ashfall has one.');
  if (s.hearth && !(p.env.def.inn || p.env.def.camp || p.env.def.forge || p.env.def.safe)) return p.msg('You need a hearth to cook: an inn, a camp, a forge or any safe room.');
  for (const [i, n] of Object.entries(r.need)) if (D.itemCount(p, i) < n) return p.msg(`You need ${n} ${nm(i)} (you have ${D.itemCount(p, i)}, counting your bag).`);
  const t = D.toolTier(p, id), saved = id === 'smithing' && Math.random() < 0.05 * t, copies = (id === 'brewing' || id === 'cooking') && Math.random() < 0.05 * t ? 2 : 1;
  if (!saved) for (const [i, n] of Object.entries(r.need)) D.itemTake(p, i, n);
  for (let c = 0; c < copies; c++) D.give(p, r.out, 'normal');
  p.msg(`${s.icon} You make ${nm(r.out)}${copies > 1 ? ' (a double batch from your tool!)' : ''}${saved ? ' (your hammer saved the materials!)' : ''}.`, 'win');
  D.toolUse(p, id); D.skillGain(p, id, Math.round((8 + Math.floor(r.lvl * 0.6)) * (1 + 0.1 * t)));
};

D.salvage = (p, arg) => { // salvage <item> | salvage all (everything unworn, not kept and not legendary)
  if (!gate(p, 'salvaging')) return; const k = p.skills.salvaging, worn = new Set(Object.values(p.equip)), t = D.toolTier(p, 'salvaging');
  const gear = p.inv.filter((i) => (i.type === 'weapon' || i.type === 'armor') && !worn.has(i) && !i.kept), bagGear = Object.keys(p.bag).filter((i) => ['weapon', 'armor'].includes(D.W.items[i].type) && !p.keepBag[i]);
  const one = (it, itemId, def, quiet) => {
    const m = itemId.match(/^(iron|steel|mithril|runed|adamant|dragon|void)(sword|mail|helm|shield|boots)$/), out = {};
    if (m) for (const [mat, n] of Object.entries(SALV[m[1]])) out[mat] = Math.max(1, Math.round(n * PIECE_F[m[2]])); else out.ore = Math.max(1, Math.floor((def.value || 0) / 60));
    const first = Object.keys(out)[0]; out[first] += Math.floor(k.lvl / 15) + (p.cls === 'scavenger' ? 1 : 0) + Math.floor(t / 2);
    const dbl = Math.random() < 0.05 * t; if (dbl) for (const key of Object.keys(out)) out[key] *= 2;
    if (it) it.destroy(); else { p.bag[itemId]--; if (p.bag[itemId] <= 0) delete p.bag[itemId]; }
    for (const [mat, n] of Object.entries(out)) for (let i = 0; i < n; i++) D.give(p, mat, 'loot');
    if (!quiet) p.msg(` You break down ${def.name} and recover ${listOf(out)}${dbl ? ' (double, thanks to your crowbar!)' : ''}.`, 'win'); D.toolUse(p, 'salvaging'); D.skillGain(p, 'salvaging', Math.round((5 + (m ? TIER_ORDER.indexOf(m[1]) * 3 : 0)) * (1 + 0.1 * t)));
    return out;
  };
  const a = arg.trim().toLowerCase();
  if (!a) return p.msg(gear.length || bagGear.length ? 'Salvage which? ' + [...gear.map((i) => i.name), ...bagGear.map((i) => `${nm(i)} (bag x${p.bag[i]})`)].join(', ') + '. (`salvage all` breaks down everything unworn, not marked `keep` and not legendary.)' : 'You have no unworn, unkept weapons or armor (pack or bag) to salvage.');
  if (a === 'all') {
    const list = gear.filter((i) => !i.def.legend), bl = bagGear.filter((i) => !D.W.items[i].legend); if (!list.length && !bl.length) return p.msg('Nothing to salvage: worn, kept and legendary items are skipped.', 'sys');
    const total = {}; let n = 0, mark = 0; const add = (out) => { for (const [mat, c] of Object.entries(out)) total[mat] = (total[mat] || 0) + c; n++; };
    for (const it of list) add(one(it, it.itemId, it.def, true)); for (const id of bl) while (p.bag[id] > 0 && mark++ < 500) add(one(null, id, D.W.items[id], true));
    return p.msg(` You break down ${n} item${n === 1 ? '' : 's'} and recover ${listOf(total)}.`, 'win');
  }
  const it = gear.find((i) => i.isId(a)); let itemId, def;
  if (it) { itemId = it.itemId; def = it.def; } else { itemId = bagGear.find((i) => { const d = D.W.items[i], n = d.name.toLowerCase(); return n === a || n.split(' ').includes(a) || (d.ids || []).includes(a); }); def = itemId && D.W.items[itemId]; }
  if (!itemId) return p.msg(p.inv.some((i) => i.kept && i.isId(a)) ? 'That is marked to keep. Type `unkeep` first.' : "You don't have that (worn items can't be salvaged).");
  one(it, itemId, def, false);
};
