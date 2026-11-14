'use strict';
// The finger sheet: Name, Class/Gender, Level/Deity, Leaderboard/Age, Best kill/Best team kill, Arch foe, On since, Idle and Mail, laid out in two clean columns.
const D = require('./lib');
D.ageYWDH = (ms) => { let h = Math.max(0, Math.floor(ms / 3600000)); const y = Math.floor(h / 8760); h -= y * 8760; const w = Math.floor(h / 168); h -= w * 168; const d = Math.floor(h / 24); h -= d * 24; const u = (n, s) => `${n} ${s}${n === 1 ? '' : 's'}`; return `${u(y, 'year')}, ${u(w, 'week')}, ${u(d, 'day')}, ${u(h, 'hour')}`; };
D.fingerExtra = (d, on, rec) => { // fills d.lines (plain text, padded to columns) from an online player or a saved record
  const src = on || rec || {}, mail = require('./mail'), W = 38, row = (a, b) => (b == null ? a : a.padEnd(Math.max(W, a.length + 2)) + b), when = (t) => new Date(t).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
  let rank = 0; try { const i = D.leaderboard(true).findIndex((r) => r.name.toLowerCase() === d.name.toLowerCase()); rank = i >= 0 ? i + 1 : 0; } catch (e) { rank = 0; }
  const bk = src.bestKill, bt = src.bestTeam, dt = src.deity && D.DEITIES && D.DEITIES[src.deity], unread = mail.unread(d.name), total = mail.total ? mail.total(d.name) : unread;
  const idle = on ? (on.isBot ? 'a resident bot (always about)' : D.dur(Date.now() - ((on.prevCmd && Date.now() - on.lastCmd < 1500 ? on.prevCmd : on.lastCmd) || on.loginAt || Date.now()))) : 'not online', at = on ? on.loginAt : d.seen;
  d.lines = [`Name: ${/^grog$/i.test(d.name) ? 'GROG' : d.name}`, `Class: ${d.cn}${d.rm ? ` (Remort ${d.rm})` : ''}`, `Gender: ${String(d.gl || '').replace(/^./, (c) => c.toUpperCase())}`, `Level: ${d.lv}`, `Deity:  ${dt ? `${dt.name}, ${dt.title}` : 'none'}`, `Leaderboard: ${rank || 'unranked'}`,
    `Best kill: ${bk ? `${bk.name} (level ${bk.level})` : 'none yet'}`, `Best team kill: ${bt ? `${bt.name} (level ${bt.level})` : 'none yet'}`, ...(src.archFoe ? [`Arch foe: ${src.archFoe}`] : []), ...((src.scars || []).length ? [`Scars: ${src.scars.length} (${src.scars.slice(-3).map((s) => `${s.kind} on the ${s.part}`).join('; ')}${src.scars.length > 3 ? '; ...' : ''})`] : []), `${on ? 'On since' : 'Last on'}: ${at ? when(at) : 'unknown'}`, `Idle: ${idle}`,
    `Mail: ${d.fwd ? (d.email ? `forwarding to ${d.email}` : 'forwarding on') : 'no forwarding'}; ${unread} unread, ${Math.max(0, total - unread)} read`, `Age: ${D.ageYWDH(Date.now() - d.born)}`];
};
module.exports = D.fingerExtra;
