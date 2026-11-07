'use strict';
// Daily login rewards: log in at least 24 hours after your last reward and it is paid automatically (experience and credits). Log in again within 48 hours of the
// last reward and the streak grows, and so does the reward: up to day 30, with a double bonus on every 7th day. Miss a whole extra day and the streak starts again.
const D = require('./lib'), DAY = 24 * 3600 * 1000;
function reward(p, n) { // what day n of a streak pays a character of this level
  const bonus = n % 7 === 0, k = Math.min(n, 30) - 1, inc = Math.max(50, p.xpNeed(p.level) - p.xpNeed(Math.max(0, p.level - 1)));
  return { gold: Math.round((100 + 20 * p.level) * (1 + 0.15 * k) * (bonus ? 2 : 1)), xp: Math.round(inc * (0.05 + 0.015 * k) * (bonus ? 1.5 : 1)), bonus };
}
const due = (p) => !p.dailyAt || Date.now() - p.dailyAt >= DAY;
function claim(p) {
  if (!due(p) || p.isBot) return false; const since = Date.now() - (p.dailyAt || 0), streak = !p.dailyAt || since >= 2 * DAY ? 1 : (p.dailyStreak || 0) + 1, broke = p.dailyAt && since >= 2 * DAY && (p.dailyStreak || 0) > 1;
  p.dailyStreak = streak; p.dailyAt = Date.now(); const r = reward(p, streak); p.gold += r.gold;
  p.msg(`*** DAILY REWARD: day ${streak}${r.bonus ? ' (BONUS DAY: double!)' : ''} ***`, 'win'); if (broke) p.msg('(Your previous streak ended because you missed a day. A new one starts today.)', 'sys');
  p.msg(`You receive ${r.gold.toLocaleString('en-US')} credits and ${r.xp.toLocaleString('en-US')} experience. Log in again within 48 hours of now to keep the streak: day ${streak + 1} pays about ${Math.round(reward(p, streak + 1).gold).toLocaleString('en-US')} credits and ${Math.round(reward(p, streak + 1).xp).toLocaleString('en-US')} experience.`, 'win');
  p.send({ t: 'sound', k: 'quest' }); p.gainXp(r.xp); p.sendStats(); return true;
}
function status(p) {
  const left = (p.dailyAt || 0) + DAY - Date.now(), n = p.dailyStreak || 0; p.msg(`Daily reward: ${n ? `a streak of ${n} day${n === 1 ? '' : 's'}` : 'no streak yet'}.`, 'rname');
  if (due(p)) return p.msg('Your reward is ready: type `daily` to collect it now (it is paid automatically when you log in).', 'win');
  p.msg(`Next reward in ${D.dur(left)}. Log in within 48 hours of your last reward to keep the streak.`, 'sys'); const next = (p.dailyStreak || 0) + 1;
  const days = [next, next + 1, next + 2]; const bonus = Math.ceil(next / 7) * 7; if (!days.includes(bonus)) days.push(bonus);
  for (const d of days) { const r = reward(p, d); p.msg(`  Day ${d}: ${r.gold.toLocaleString('en-US')} credits and ${r.xp.toLocaleString('en-US')} experience${r.bonus ? '  (bonus day)' : ''}`, 'items'); }
}
setInterval(() => { for (const p of D.players.values()) if (!p.isBot && !p.ld && p.send && due(p)) claim(p); }, 10 * 60 * 1000).unref(); // players who stay logged in for days are paid too
D.daily = { reward, due, claim, status, DAY };
module.exports = D.daily;
