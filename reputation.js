'use strict';
// Reputation: every quest you complete earns reputation in the AREA where its quest giver lives (1 point, 3 for a boss quest, +1 for a quest at level 100 or above).
// Reputation pays: extra credits from kills (+1% per point), better prices when you sell (+1% per point, up to +50%) and discounts in shops (0.5% per point, up to 30%).
// The reputation of the area you are standing in counts in full, your reputation everywhere else counts a quarter. Shown in `score`, `reputation` and the leaderboard.
const D = require('./lib');
const TITLES = [[0, 'Stranger'], [3, 'Known'], [8, 'Respected'], [20, 'Trusted'], [40, 'Honored'], [80, 'Revered'], [150, 'Legendary'], [300, 'Mythic']];
D.repTotal = (p) => Object.values(p.rep || {}).reduce((a, b) => a + (b | 0), 0);
D.repTitle = (n) => TITLES.slice().reverse().find(([k]) => n >= k)[1];
D.repEff = (p, area) => { const t = D.repTotal(p), here = (p.rep || {})[area] || 0; return here + 0.25 * (t - here); };
D.repGoldMult = (p, area) => 1 + Math.min(0.5, 0.01 * D.repEff(p, area));
D.repSell = (p) => Math.min(0.5, 0.01 * D.repEff(p, p.env && p.env.area));
D.repDisc = (p) => Math.min(0.3, 0.005 * D.repEff(p, p.env && p.env.area));
D.shopCost = (p, d) => Math.max(1, Math.round((d.value || 0) * (1 - D.repDisc(p))));
D.cleanRep = (raw) => { const o = {}; if (raw && typeof raw === 'object') for (const [k, v] of Object.entries(raw)) if (/^[a-z0-9_]{2,20}$/.test(k) && v > 0) o[k] = Math.min(100000, v | 0); return o; };
D.repGain = (p, q) => {
  const npc = D.Q.NPCS[q.giver], room = npc && D.W.rooms[npc.room], area = room && room.area; if (!area) return; const pts = 1 + ((D.Q.BOSS_QP || {})[q.id] ? 2 : 0) + (q.min >= 100 ? 1 : 0); p.rep = p.rep || {}; const before = D.repTitle(D.repTotal(p));
  p.rep[area] = (p.rep[area] || 0) + pts; const label = (D.AREA_LABEL && D.AREA_LABEL[area]) || area; p.msg(`Reputation: +${pts} in ${label} (${p.rep[area]} there, ${D.repTotal(p)} in all).`, 'quest'); const after = D.repTitle(D.repTotal(p)); if (after !== before) p.msg(`*** You are now ${after}! Better prices, bigger payouts. ***`, 'win');
};
D.repShow = (p) => {
  const t = D.repTotal(p); p.msg(`REPUTATION: ${t} (${D.repTitle(t)})`, 'rname'); const l = Object.entries(p.rep || {}).sort((a, b) => b[1] - a[1]); if (!l.length) p.msg('Complete quests to earn reputation in the areas where their quest givers live.', 'sys'); for (const [a, v] of l.slice(0, 15)) p.msg(`  ${((D.AREA_LABEL && D.AREA_LABEL[a]) || a).padEnd(34)} ${v}`, 'sys');
  const area = p.env && p.env.area; p.msg(`Right here (${(D.AREA_LABEL && D.AREA_LABEL[area]) || area}): +${Math.round((D.repGoldMult(p, area) - 1) * 100)}% credits from kills, +${Math.round(D.repSell(p) * 100)}% when you sell, ${Math.round(D.repDisc(p) * 100)}% off in shops.`, 'win');
};
module.exports = D.repShow;
