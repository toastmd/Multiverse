'use strict';
// Bounty system: now and then a quest giver marks a monster as WANTED. The first player (or team) to kill it collects credits at once and
// bounty points, which count toward the achievements leaderboard. Up to three bounties are active; each lasts 40 minutes.
const D = require('./lib');
const NICK = ['Black Bart', 'Dusty', 'One-Eye', 'Crooked Mags', 'Red Tom', 'Ironjaw', 'Slippery Sal', 'Mad Moll', 'Stonefist', 'Quickdraw Quinn', 'Gravel', 'Ghost', 'Sharkskin', 'Bad News', 'Hollow Pete', 'Silverfang', 'Coyote', 'Rattlesnake Ray', 'Twice-Hanged Hank', 'Iron Nell', 'Scarface', 'Whisper', 'Bonecrusher', 'Lucky Lou', 'Vex', 'Old Grudge'];
const LINES = ['{p} has posted a bounty:', '{p} wants this one dead:', 'WANTED by {p}:', '{p} is paying well for this one:'];
const MAX = 3, LIFE = 40 * 60 * 1000, active = []; let timer = null, first = null;
const where = (b) => `${b.room.name} (${D.AREA_LABEL[b.room.area] || b.room.area})`;
function post(force) {
  if (active.length >= MAX) return null; const real = [...D.players.values()].filter((p) => !p.isBot); if (!real.length) return null;
  const lv = real[D.rnd(0, real.length - 1)].level, cands = [];
  for (const room of D.rooms.values()) { if (room.def.safe) continue; for (const id of new Set(room.def.mobs || [])) { const d = D.W.mobs[id]; if (d && !d.boss && d.level >= lv - 3 && d.level <= lv + 6 && !active.some((a) => a.mobId === id)) cands.push([room, id]); } }
  if (!cands.length) return null; const [room, id] = cands[D.rnd(0, cands.length - 1)], m = D.cloneMob(id), nick = NICK[D.rnd(0, NICK.length - 1)], npcs = Object.values(D.Q.NPCS), poster = npcs[D.rnd(0, npcs.length - 1)].name;
  m.name = `${nick} the ${m.name}`; m.short = m.name; m.ids = [...new Set([...m.ids, 'wanted', ...nick.toLowerCase().split(/[ -]+/), ...D.W.mobs[id].name.toLowerCase().split(' ')])]; m.maxhp = m.hp = Math.round(m.maxhp * 1.8); m.xp *= 2; m.long = `${m.name}, WANTED. A bounty hangs over this one's head.`;
  const b = { mob: m, mobId: id, room, poster, reward: Math.round(m.level * 45 + 150), bp: Math.max(1, Math.ceil(m.level / 8)), until: Date.now() + LIFE }; m.bounty = b; m.move(room); active.push(b);
  b.timer = setTimeout(() => { const i = active.indexOf(b); if (i < 0) return; active.splice(i, 1); if (D.objects.has(m.id)) { m.destroy(); D.announce(`The bounty on ${m.name} has expired. The trail went cold.`, 'bounty'); } }, LIFE);
  D.announce(`${LINES[D.rnd(0, LINES.length - 1)].replace('{p}', poster)} ${m.name} (level ${m.level}), last seen at ${where(b)}. Reward: ${b.reward} credits and ${b.bp} bounty point${b.bp > 1 ? 's' : ''}. Type \`bounties\` for the list.`, 'bounty'); return b;
}
function claim(m, killer, mates) { // called from Monster.die for a bounty target
  const b = m.bounty, i = active.indexOf(b); if (i >= 0) active.splice(i, 1); clearTimeout(b.timer); if (!killer.isPlayer) return D.announce(`The bounty on ${m.name} was settled by someone else.`, 'bounty');
  const n = mates.length, share = 1 + 0.1 * (n - 1);
  for (const p of mates) { const got = Math.round(b.reward * share / n); p.gold += got; p.bounty = (p.bounty || 0) + b.bp; p.bounties = (p.bounties || 0) + 1; p.msg(`*** BOUNTY COLLECTED: ${m.name}! +${got} credits and +${b.bp} bounty point${b.bp > 1 ? 's' : ''} (total ${p.bounty}). ***`, 'win'); p.send({ t: 'sound', k: 'quest' }); }
  D.announce(`${killer.name}${n > 1 ? ' and their team' : ''} collected the bounty on ${m.name}: +${b.bp} bounty point${b.bp > 1 ? 's' : ''} and ${b.reward} credits (posted by ${b.poster})!`, 'bounty');
}
const list = () => active.map((b) => ({ name: b.mob.name, level: b.mob.level, where: where(b), poster: b.poster, reward: b.reward, bp: b.bp, mins: Math.max(1, Math.ceil((b.until - Date.now()) / 60000)) }));
function start() { first = setTimeout(() => post(), 60000); timer = setInterval(() => { if (active.length < MAX && Math.random() < 0.4) post(); }, 90000); }
function stop() { clearTimeout(first); clearInterval(timer); for (const b of active) clearTimeout(b.timer); active.length = 0; }
module.exports = { start, stop, post, claim, list };
