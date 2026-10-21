'use strict';
// Quest engine and the gossip channel. Quest data lives in quests.js.
const D = require('./lib');

const iname = (id) => (D.W.items[id] || {}).name || id, mname = (id) => (D.W.mobs[id] || {}).name || id;
const need = (o) => (o[0] === 'kill' || o[0] === 'get' || o[0] === 'rob' ? o[2] : 1);
D.objText = (o) => o[0] === 'kill' ? `Kill ${mname(o[1])} x${o[2]}` : o[0] === 'get' ? `Bring ${iname(o[1])} x${o[2]}`
  : o[0] === 'visit' ? `Visit ${(D.rooms.get(o[1]) || {}).name || o[1]}` : o[0] === 'rob' ? `Rob ${o[2]} people at the bank (rob <person>)` : o[0] === 'vault' ? 'Unlock and loot the bank vault' : o[0] === 'tutorial' ? 'Finish the newbie tutorial' : `Talk to ${(D.Q.NPCS[o[1]] || {}).name || o[1]}`;
D.qNeed = need;
D.qDef = (id) => D.Q.QUESTS.find((q) => q.id === id);
D.qCur = (p, q, i) => { const o = q.obj[i]; return o[0] === 'get' ? Math.min(o[2], D.itemCount(p, o[1])) : Math.min(need(o), (p.quests[q.id].prog[i]) || 0); };
D.qReady = (p, q) => q.obj.every((o, i) => D.qCur(p, q, i) >= need(o));
D.qState = (p, q) => p.qdone.has(q.id) && !q.repeat ? 'done' : p.quests[q.id] ? (D.qReady(p, q) ? 'ready' : 'active') : (p.level >= q.min && (!q.after || p.qdone.has(q.after)) ? 'avail' : 'locked');

D.qEvent = (p, type, key) => { // progress kill/visit/talk objectives
  for (const q of D.Q.QUESTS) {
    const st = p.quests[q.id]; if (!st) continue; let hit = false;
    q.obj.forEach((o, i) => {
      if (o[0] !== type || o[1] !== key || type === 'get' || (st.prog[i] || 0) >= need(o)) return;
      st.prog[i] = (st.prog[i] || 0) + 1; hit = true; p.msg(`Quest "${q.name}": ${D.objText(o)} (${D.qCur(p, q, i)}/${need(o)})`, 'quest');
    });
    if (hit && D.qReady(p, q)) p.msg(`Quest "${q.name}" is complete! Return to ${D.Q.NPCS[q.giver].name}.`, 'win');
    if (hit) p.sendQuests();
  }
};

D.qXp = (p, q) => Math.round(q.rew.xp * (1 + 0.1 * (p.remort || 0))); // remorts need more XP, so quest XP grows with them
D.qComplete = (p, q) => {
  for (const o of q.obj) if (o[0] === 'get') D.itemTake(p, o[1], o[2]);
  const first = !p.qdone.has(q.id); if (!first && !q.repeat) { delete p.quests[q.id]; return; } // a quest is rewarded once, unless it is repeatable (then only the quest points are once)
  delete p.quests[q.id]; p.qdone.add(q.id);
  const r = q.rew, xp = D.qXp(p, q), parts = [];
  if (first && r.qp) { p.qp += r.qp; parts.push(`${r.qp} quest point${r.qp > 1 ? 's' : ''}`); } // quest points are awarded once per quest
  if (r.gold) { p.gold += r.gold; parts.push(`${r.gold} credits`); }
  for (const id of r.items || []) { D.give(p, id, 'normal'); parts.push(D.W.items[id].name); }
  p.msg(`*** Contract complete: ${q.name} ***  Reward: ${xp} XP${parts.length ? ', ' + parts.join(', ') : ''}.`, 'win');
  p.send({ t: 'sound', k: 'quest' }); D.announce(`${p.name} has completed the contract "${q.name}"!`, 'quest'); p.gainXp(xp); p.sendQuests();
};

D.qpTotal = () => D.Q.QUESTS.reduce((s, q) => s + (q.rew.qp || 0), 0);
D.taunt = (p) => { // a random NPC taunts the fallen player to the whole MUD
  const ids = Object.keys(D.Q.NPCS), id = ids[D.rnd(0, ids.length - 1)], pool = D.Q.TAUNTS[id] || D.Q.TAUNTS._;
  D.announce(`${D.Q.NPCS[id].name} taunts: "${pool[D.rnd(0, pool.length - 1)].replace(/\{name\}/g, p.name)}"`, undefined, 'taunt');
};
D.gosLog = [];
D.gossip = (text, o = {}) => { // o.from + o.msg: a player's own words (shown under their name in Discord). o.source 'discord': came from Discord, so never send it back.
  D.gosLog.push(text); if (D.gosLog.length > 30) D.gosLog.shift(); for (const p of D.players.values()) if (p.gos !== false) p.msg('[gossip] ' + text, 'gossip');
  if (o.gif) for (const p of D.players.values()) if (p.gos !== false) p.send({ t: 'gif', url: o.gif.url, alt: o.gif.title, q: o.gif.q });
  if (o.yt) for (const p of D.players.values()) if (p.gos !== false) p.send({ t: 'yt', id: o.yt, from: o.from });
  if (o.from && D.onGossip) D.onGossip(o.from, o.msg !== undefined ? o.msg : text); // bots answer players here
  if (D.bridge && !o.source) D.bridge.out(o.msg !== undefined ? o.msg : text, o.from);
};
