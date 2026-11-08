'use strict';
// The Idler: log in and do nothing. Every minute you spend idle (no commands typed) pays experience and credits, and the longer you stay idle the more each minute pays (up to 30x after
// 7 hours of idling). Any command you type starts the idle clock again. Idlers have minimal stats, but level fast.
const D = require('./lib');
const mult = (m) => Math.min(30, 1 + m / 15);
const IDLE = ['idler', 'idlemaster'], bonus = (p) => 1 + 0.25 * (p.remort || 0); // every remort level adds +25% idle pay (an Idler who remorts becomes an Idle Master)
const pay = (p, m) => ({ xp: Math.round((10 + 2 * p.level) * mult(m) * bonus(p)), gold: Math.round((5 + p.level) * (1 + m / 20) * bonus(p)) });
D.idler = {
  mult, pay,
  tick() {
    for (const p of D.players.values()) {
      if (!IDLE.includes(p.cls) || p.isBot || p.ld || !p.send || p.enemy || !p.lastCmd) continue; const m = Math.floor((Date.now() - p.lastCmd) / 60000); if (m < 1) { p.idleAcc = null; continue; }
      const r = pay(p, m); p.gold += r.gold; p.idleAcc = p.idleAcc || { xp: 0, gold: 0, n: 0 }; p.idleAcc.xp += r.xp; p.idleAcc.gold += r.gold; p.idleAcc.n++; p.gainXp(r.xp, true);
      if (p.idleAcc.n % 5 === 0) { p.msg(`[Idling for ${m} minutes (x${mult(m).toFixed(1)}): +${p.idleAcc.xp.toLocaleString('en-US')} experience and +${p.idleAcc.gold.toLocaleString('en-US')} credits over the last 5 minutes.]`, 'win'); p.idleAcc.xp = 0; p.idleAcc.gold = 0; } p.sendStats();
    }
  },
  status(p) {
    if (!IDLE.includes(p.cls)) return p.msg('Only the Idler and Idle Master classes earn by idling. (They get experience and credits every minute they do nothing.)', 'sys'); const m = Math.floor((Date.now() - (p.prevCmd || p.lastCmd || Date.now())) / 60000), r = pay(p, Math.max(1, m)), n = pay(p, m + 10);
    p.msg(`IDLER: you have been idle for ${m} minute${m === 1 ? '' : 's'}. Each idle minute now pays about ${r.xp.toLocaleString('en-US')} experience and ${r.gold.toLocaleString('en-US')} credits (x${mult(Math.max(1, m)).toFixed(1)}${p.remort ? `, plus your remort bonus x${bonus(p).toFixed(2)}` : ''}); in 10 more minutes, ${n.xp.toLocaleString('en-US')} and ${n.gold.toLocaleString('en-US')}. Typing a command resets the clock.`, 'win');
  },
};
setInterval(() => D.idler.tick(), 60000).unref();
module.exports = D.idler;
