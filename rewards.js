'use strict';
// Bounty rewards: for every ten bounty points a player has earned: +10 bag slots, +2 levels in every tradeskill, +2 levels in every weapon skill and one task point.
const D = require('./lib');
D.bountyRewards = (p, retro) => {
  const tiers = Math.floor((p.bounty || 0) / 10); let n = 0; p.skills = p.skills || {}; p.wskill = p.wskill || {}; p.tp = p.tp || { pts: 0 };
  while ((p.bountyTier || 0) < tiers) {
    p.bountyTier = (p.bountyTier || 0) + 1; n++; p.bagBonus = (p.bagBonus || 0) + 10;
    for (const id of Object.keys(D.T.SKILLS)) { const k = (p.skills[id] = p.skills[id] || { lvl: 1, xp: 0 }); k.lvl = Math.min(D.T.MAX, (k.lvl || 1) + 2); }
    for (const t of Object.keys(D.WTYPES)) { const k = (p.wskill[t] = p.wskill[t] || { lvl: 1, xp: 0 }); k.lvl = Math.min(100, (k.lvl || 1) + 2); }
    p.tp.pts = (p.tp.pts || 0) + 1;
  }
  if (n) { p.msg(`*** BOUNTY MILESTONE${n > 1 ? ' x' + n : ''}${retro ? ' (earned so far)' : ''}! *** Every 10 bounty points pays: +${10 * n} bag slots, +${2 * n} levels in every tradeskill and every weapon skill, and +${n} task point${n > 1 ? 's' : ''}.`, 'win'); p.recalc(); if (p.sendStats) p.sendStats(); }
};
module.exports = D.bountyRewards;
