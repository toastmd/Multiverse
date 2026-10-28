'use strict';
// The farming engine: till, plant, harvest, plots, milk and shear. Four tradeskills (tilling, planting, milking, shearing; see tradeskills.js).
// Everything happens at Sunny Acres Farm (farm.js). Plots grow in real time, even while you are logged out.
const D = require('./lib');
const { rnd } = D;
const { CROPS, FARM_SKILLS, REWARD_LEVEL, BAN_MS } = require('./farmdata');
const mmss = (ms) => `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, '0')}`;
const lvl = (p, id) => (p.skills[id] ? p.skills[id].lvl : 1);
const nm = (id) => (D.W.items[id] || {}).name || id;
const crop = (q) => { q = String(q || '').trim().toLowerCase(); return q ? CROPS.find((c) => c[0] === q || c[1] === q || c[0].startsWith(q) || c[1].includes(q)) : null; };

function farm(p) { // the player's farm state: plots (they grow with your tilling skill), the ban and the reward flag
  if (!p.farm) p.farm = { plots: [], ban: 0, reward: false };
  const want = 4 + Math.floor(lvl(p, 'tilling') / 5); while (p.farm.plots.length < want) p.farm.plots.push({ s: 0 });
  return p.farm;
}
D.farmBlocked = (p) => { // killing the farmer, a cow or a sheep: no farming (and no market) for an hour
  const f = p.farm; if (f && f.ban > Date.now()) { p.msg(`The farm hands will not let you near the farm after what you did. Come back in ${mmss(f.ban - Date.now())}.`, 'hurt'); return true; } return false;
};
const learn = (p, id) => { if (!p.skills[id]) { p.skills[id] = { lvl: 1, xp: 0 }; p.msg(`${D.T.SKILLS[id].icon} You pick up ${D.T.SKILLS[id].name}! (a tradeskill: type \`tradeskills ${id}\`)`, 'win'); } };
const start = (p, skill, where) => { // common checks; returns false if the action cannot happen
  if (p.enemy) { p.msg('You cannot concentrate while fighting!', 'hurt'); return false; }
  if (p.env.area !== 'farm') { p.msg('That is farm work: Sunny Acres Farm is out of town: type `farm` in Ashfall Square.', 'sys'); return false; }
  if (D.farmBlocked(p)) return false; if (where === 'field' && !p.env.def.field) { p.msg('That needs a vegetable field: the fields are south of the market (Vegetable Field, Corn Rows).', 'sys'); return false; }
  learn(p, skill); return true;
};
const cool = (p, k, ms) => { const now = Date.now(); if ((p.cd[k] || 0) > now) { p.msg('Give it a moment.'); return false; } p.cd[k] = now + ms; return true; };
const xp = (p, skill, n) => { D.toolUse(p, skill); D.skillGain(p, skill, Math.round(n * (1 + 0.1 * D.toolTier(p, skill)))); };

D.farmReward = (p) => { // all four farm skills at 20: denim overalls and a golden hoe
  const f = farm(p); if (f.reward || !FARM_SKILLS.every((s) => lvl(p, s) >= REWARD_LEVEL && p.skills[s])) return; f.reward = true;
  D.give(p, 'denimoveralls', 'normal'); D.give(p, 'goldenhoe', 'normal');
  p.msg('*** MASTER FARMER! *** You have reached level 20 in tilling, planting, milking and shearing. The old farmer tips his hat and hands you a pair of denim overalls and a golden hoe, and says: "Best hands I ever saw on this land." Wear the overalls and wield the hoe: they work at any level.', 'win');
  D.announce(`${p.name} has become a Master Farmer at Sunny Acres Farm!`, 'quest');
};

D.farm = {
  till(p, a) {
    if (!start(p, 'tilling', 'field')) return; const f = farm(p), free = f.plots.map((x, i) => (x.s === 0 ? i : -1)).filter((i) => i >= 0), all = /\ball\b/.test(a);
    if (!free.length) return p.msg(f.plots.some((x) => x.s === 1) ? 'Every plot is already tilled: `plant <crop>` your seeds.' : 'Every plot is planted and growing. `plots` shows how they are doing; `harvest` when they are ripe.');
    const n = all ? free.length : 1; if (!cool(p, 'till', 1500 * n)) return;
    for (const i of free.slice(0, n)) { f.plots[i].s = 1; xp(p, 'tilling', 14); }
    p.msg(`\u{1F69C} You swing your hoe and turn the soil of ${n > 1 ? `${n} plots` : `plot ${free[0] + 1}`}. Ready for seeds (\`plant <crop>\`).`, 'win'); p.env.tell(`${p.name} works the soil with a hoe.`, p);
  },
  plant(p, a) {
    if (!start(p, 'planting', 'field')) return; const f = farm(p), q = a.trim().replace(/\ball\b/, '').trim(), all = /\ball\b/.test(a), c = crop(q);
    if (!c) { p.msg('Plant what? Crops: ' + CROPS.map(([id, , l]) => `${id} (planting ${l})`).join(', ') + '. Example: `plant carrot` or `plant carrot all`. Buy seeds at the Farmer\'s Market.', 'sys'); return; }
    if (lvl(p, 'planting') < c[2]) return p.msg(`${c[1]} needs Planting level ${c[2]} (yours is ${lvl(p, 'planting')}).`);
    const tilled = f.plots.map((x, i) => (x.s === 1 ? i : -1)).filter((i) => i >= 0); if (!tilled.length) return p.msg(f.plots.some((x) => x.s === 0) ? 'Nothing to plant in yet: `till` the soil first.' : 'Every plot already has a crop growing.');
    const seeds = D.itemCount(p, 'seeds_' + c[0]); if (!seeds) return p.msg(`You have no ${c[0]} seeds. The Farmer's Market sells them (\`list\`).`);
    const n = Math.min(all ? 99 : 1, tilled.length, seeds); if (!cool(p, 'plant', 1200 * n)) return; const t = D.toolTier(p, 'planting'), grow = Math.round(c[3] * 1000 * (1 - 0.04 * (t - 1)));
    for (const i of tilled.slice(0, n)) { f.plots[i] = { s: 2, crop: c[0], at: Date.now() + grow }; D.itemTake(p, 'seeds_' + c[0], 1); xp(p, 'planting', 10 + Math.floor(c[2] * 0.5)); }
    p.msg(`\u{1F331} You plant ${n} plot${n > 1 ? 's' : ''} of ${c[0]}. Ripe in ${mmss(grow)}.`, 'win');
  },
  harvest(p) {
    if (!start(p, 'planting', 'field')) return; const f = farm(p), now = Date.now(), ripe = f.plots.map((x, i) => (x.s === 2 && x.at <= now ? i : -1)).filter((i) => i >= 0);
    if (!ripe.length) { const g = f.plots.filter((x) => x.s === 2); return p.msg(g.length ? `Nothing is ripe yet. The next crop is ready in ${mmss(Math.min(...g.map((x) => x.at)) - now)}.` : 'You have nothing planted. `till`, then `plant <crop>`.'); }
    if (!cool(p, 'harvest', 1000 * ripe.length)) return; const t = D.toolTier(p, 'planting'), got = {};
    for (const i of ripe) { const c = CROPS.find((x) => x[0] === f.plots[i].crop), n = rnd(2, 3) + Math.floor(lvl(p, 'planting') / 15) + (Math.random() < 0.1 * t ? 1 : 0); for (let k = 0; k < n; k++) D.give(p, 'crop_' + c[0], 'loot'); got[c[0]] = (got[c[0]] || 0) + n; f.plots[i] = { s: 0 }; xp(p, 'planting', 12 + Math.floor(c[2] * 0.6)); }
    p.msg(`\u{1F955} You harvest ${Object.entries(got).map(([id, n]) => `${n} ${nm('crop_' + id)}`).join(', ')}. The plots are bare again (till them for the next crop). Sell it all to the old farmer at the Farmer's Market.`, 'win');
  },
  plots(p) {
    const f = farm(p), now = Date.now(); p.msg(`\u{1F33E} Your plots (${f.plots.length}; more with Tilling skill). Tilling ${lvl(p, 'tilling')}, Planting ${lvl(p, 'planting')}, Milking ${lvl(p, 'milking')}, Shearing ${lvl(p, 'shearing')}:`, 'rname');
    f.plots.forEach((x, i) => p.msg(`  plot ${String(i + 1).padStart(2)}: ${x.s === 0 ? 'bare ground (till it)' : x.s === 1 ? 'tilled, ready for seeds' : x.at <= now ? `${x.crop}: RIPE, harvest it!` : `${x.crop}, ripe in ${mmss(x.at - now)}`}`, x.s === 2 && x.at <= now ? 'win' : 'sys'));
    if (f.ban > now) p.msg(`The farm is closed to you for another ${mmss(f.ban - now)}.`, 'hurt');
    if (!f.reward) p.msg(`Reach level ${REWARD_LEVEL} in all four farming skills for the master farmer's reward: denim overalls and a golden hoe.`, 'sys');
  },
  milk(p, a) { D.farm.animal(p, a, 'milk', 'milking', 'cow', 25000, 'fresh milk'); },
  shear(p, a) { D.farm.animal(p, a, 'shear', 'shearing', 'sheep', 40000, 'wool'); },
  animal(p, a, flag, skill, noun, gap, good) {
    if (!start(p, skill, null)) return; const q = a.trim().toLowerCase().replace(/^the\s+/, ''), pool = p.env.inv.filter((o) => o.isLiving && !o.isPlayer && o.def && o.def[flag]);
    const now = Date.now(), key = '_' + flag, match = q ? pool.filter((o) => (o.def.ids || []).includes(q) || o.name.toLowerCase().includes(q)) : pool, an = match.find((o) => ((o[key] || {})[p.name] || 0) <= now) || match[0]; if (!an) return p.msg(`There is no ${noun} here to ${flag}. ${noun === 'cow' ? 'Cows are in the Red Barn and the Cow Stalls.' : 'Sheep graze in the two pastures.'}`);
    const done = (an[key] = an[key] || {}); if ((done[p.name] || 0) > now) return p.msg(`${D.cap(an.the())} has nothing more to give you right now. Try another ${noun}.`);
    if (!cool(p, flag, 1500)) return; const t = D.toolTier(p, skill), n = rnd(1, 2) + Math.floor(lvl(p, skill) / 15) + (Math.random() < 0.1 * t ? 1 : 0), id = flag === 'milk' ? 'milk' : 'wool';
    for (let k = 0; k < n; k++) D.give(p, id, 'loot'); done[p.name] = now + gap - 2000 * (t - 1);
    p.msg(flag === 'milk' ? `\u{1F95B} You pull up a stool, set your bucket under ${an.the()} and milk: ${n} ${n > 1 ? 'pails of ' : 'pail of '}fresh milk.` : `\u2702\uFE0F You shear ${an.the()} with long, careful strokes: ${n} fleece${n > 1 ? 's' : ''} of wool, and a very relieved sheep.`, 'win'); xp(p, skill, 14);
  },
  punish(p, mob) { // you killed the farmer, a cow or a sheep
    const f = farm(p); f.ban = Date.now() + BAN_MS; p.msg(`\u26A0\uFE0F The farm hands saw that. You are banned from farming for ONE HOUR (no tilling, planting, harvesting, milking, shearing or the market), and your plots keep growing without you.`, 'hurt');
  },
};
