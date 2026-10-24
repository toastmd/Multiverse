'use strict';
// Rolling Bones: a solo dice game at the saloons. Bet 10 to 1,000 credits, call the roll of two dice, and the bones decide.
const D = require('./lib');
const MIN = 10, MAX = 1000, FACE = ['\u2680', '\u2681', '\u2682', '\u2683', '\u2684', '\u2685'];
const BETS = {
  low: { name: 'Low (total 2 to 6)', pay: 1.25, win: (a, b) => a + b <= 6 }, high: { name: 'High (total 8 to 12)', pay: 1.25, win: (a, b) => a + b >= 8 },
  seven: { name: 'Seven (total exactly 7)', pay: 4.5, win: (a, b) => a + b === 7 }, doubles: { name: 'Doubles (both dice the same)', pay: 4.5, win: (a, b) => a === b },
  snake: { name: 'Snake eyes (1 and 1)', pay: 30, win: (a, b) => a === 1 && b === 1 }, boxcars: { name: 'Boxcars (6 and 6)', pay: 30, win: (a, b) => a === 6 && b === 6 },
};
const rules = (p) => { p.msg('ROLLING BONES: a dice game for one. Type `bones <bet> <call>`; for example `bones 100 high`.', 'rname'); p.msg(`Bet ${MIN} to ${MAX} credits. Two dice are rolled and you win if your call comes in:`, 'sys'); for (const [k, b] of Object.entries(BETS)) p.msg(`  ${k.padEnd(8)} ${b.name.padEnd(32)} pays ${b.pay}:1`, 'items'); p.msg('A win returns your bet plus the winnings. A loss costs the bet. (Low and High lose on a seven.)', 'sys'); };
function roll(p, a) {
  if (!p.env.def.saloon) return p.msg('Rolling Bones is played at the saloons: the Silver Spur in Ashfall, the Rattlesnake Saloon, the Lucky Strike, the Silver Dollar and the Brimstone Saloon Car.', 'sys');
  const m = a.trim().toLowerCase().match(/^(\d+)\s+(\w+)$/); if (!m) return rules(p);
  if (p.enemy) return p.msg('Not while you are fighting.', 'sys'); const bet = parseInt(m[1], 10), b = BETS[m[2] === 'snakeeyes' ? 'snake' : m[2]];
  if (!b) return p.msg(`Call one of: ${Object.keys(BETS).join(', ')}.`, 'sys'); if (bet < MIN || bet > MAX) return p.msg(`Bets run from ${MIN} to ${MAX} credits.`, 'sys'); if (p.gold < bet) return p.msg(`You only have ${p.gold} credits.`, 'sys');
  const x = 1 + Math.floor(Math.random() * 6), y = 1 + Math.floor(Math.random() * 6); p.gold -= bet;
  p.msg(`\u{1F3B2} You bet ${bet} on ${m[2] === 'snakeeyes' ? 'snake' : m[2]} and shake the bones... ${FACE[x - 1]} ${FACE[y - 1]}  (${x} + ${y} = ${x + y})`, 'game');
  if (b.win(x, y)) { const win = Math.floor(bet * b.pay); p.gold += bet + win; p.msg(`${b.name.split(' (')[0]}! You win ${win} credits.`, 'win'); } else p.msg(`No luck: you lose ${bet} credits.`, 'hurt');
  if (p.sendStats) p.sendStats();
}
module.exports = { roll, rules, BETS, MIN, MAX };
