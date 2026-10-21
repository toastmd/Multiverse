'use strict';
// Guide pages: World (map, areas, bestiary, NPCs and quests).
module.exports = (L) => {
  const { GENRE, D, esc, nm, cap, num, art, table, pill, h2, card, imgTag, emit, route, ROOM, CATALOG, AREAS, ORDER, TERR, mapSvg, LEGEND, rooms0, roomsU, featuresOf } = L;
  const hops = (to) => { const r = route(to); return r === 'you start here' ? 0 : r.split(', ').length; };
  const entry = (a) => CATALOG.filter((r) => r.area === a).map((r) => [r.path, hops(r.path)]).sort((x, y) => x[1] - y[1])[0][0];

  // ---------------- full map ----------------
  const surface = mapSvg(rooms0, { title: 'Surface map', areaLabels: true }), under = mapSvg(roomsU, { title: 'Underground map', areaLabels: true });
  emit('map', 'Full Map', 'All 171 rooms of the world. Hover a room for its name, terrain and features. Use the zoom buttons or scroll.', `
<p>The <b>surface</b> holds Ashfall and most areas; the <b>underground</b> holds the crypt, the mines, the pharaoh's tomb and the Abyss. Rooms are drawn with their terrain, and paths take the terrain of the room they leave. In the game, Ashfall is mapped from the start and other areas fill in as you explore.</p>${LEGEND}
<div class="maptools"><button data-layer="surface" class="on">Surface</button><button data-layer="under">Underground</button><span>Zoom</span><button data-zoom="-1">−</button><button data-zoom="0">100%</button><button data-zoom="1">+</button></div>
<div class="mapbox" id="map-surface">${surface}</div><div class="mapbox" id="map-under" hidden>${under}</div>
${h2('Terrain')}<div class="cards small">${TERR.map((t) => card(imgTag(`terrain-${t}.svg`, t), cap(t), `<p class="m">${[...new Set(CATALOG.filter((r) => r.terrain === t).map((r) => AREAS[r.area][0]))].join(', ')}</p><p class="m">${CATALOG.filter((r) => r.terrain === t).length} rooms</p>`)).join('')}</div>
${h2('Room index')}<p>The five newer areas (Tombstone Gulch, Thornwild Court, Starship Aurora, The Drowned Reach and Brimstone Rail Yard) branch off from existing rooms and have their own maps on the <a href="areas.html">Areas</a> page.</p>${table(['Room', 'Area', 'Floor', 'Terrain', 'Features'], CATALOG.map((r) => [`<b>${esc(r.name)}</b> <code>${r.path}</code>`, AREAS[r.area][0], r.z === 0 ? 'surface' : r.z >= 20 ? 'separate realm' : 'underground', r.terrain, featuresOf(r).map((f) => `<span class="bd" style="background:${f[1]}" title="${esc(f[2])}">${f[0]}</span>`).join(' ')]), { filter: 'rooms' })}`);

  // ---------------- areas ----------------
  const monsOf = (a) => [...new Set(CATALOG.filter((r) => r.area === a).flatMap((r) => r.def.mobs || []))].map((id) => D.W.mobs[id]).filter(Boolean);
  const npcsOf = (a) => Object.values(D.Q.NPCS).filter((n) => ROOM[n.room] && ROOM[n.room].area === a);
  emit('areas', 'Areas', 'Eleven regions across three genres (Old West, fantasy and sci-fi), from the safe frontier town to the Abyss. Each shows its level range, terrain, monsters, resources and how to get there.', `
<p class="genrekey"><span class="gtag g-west">Old West</span><span class="gtag g-fantasy">Fantasy</span><span class="gtag g-scifi">Sci-fi</span><span class="gtag g-modern">Modern</span> Each area is styled for its genre.</p>
<div class="chips">${ORDER.map((a) => `<a class="g-${GENRE[a]}" href="#${a}">${AREAS[a][0]}</a>`).join('')}</div>
${ORDER.map((a) => { const rs = CATALOG.filter((r) => r.area === a), ms = monsOf(a), lv = ms.map((m) => m.level), terr = {}; for (const r of rs) terr[r.terrain] = (terr[r.terrain] || 0) + 1;
    const res = {}; for (const r of rs) for (const [k, n] of Object.entries(r.def.res || {})) res[k] = (res[k] || 0) + n; const zs = [...new Set(rs.map((r) => r.z))].sort((x, y) => y - x);
    const maps = zs.map((z) => `<div class="mini">${zs.length > 1 ? `<small>${z === 0 ? 'Surface' : z >= 20 ? 'Realm map' : 'Underground'}</small>` : ''}${mapSvg(rs.filter((r) => r.z === z), { tile: 38, gap: 22, title: AREAS[a][0] })}</div>`).join('');
    return `<section class="area g-${GENRE[a]}" id="${a}"><div class="ahead">${imgTag(`area-${a}.svg`, AREAS[a][0])}<div><h2>${AREAS[a][0]}</h2><p>${pill(AREAS[a][1], 'a')} ${pill(rs.length + ' rooms', 'b')} ${pill(zs.length > 1 ? 'two floors' : 'one floor', 'b')}</p><p>${AREAS[a][2]}</p></div></div>
<div class="facts"><div><b>Getting there</b>${a === 'town' ? 'You start here.' : route(entry(a)) + ' from the starting square'}</div><div><b>Terrain</b>${Object.entries(terr).map(([t, n]) => `${t} (${n})`).join(', ')}</div><div><b>Resources</b>${Object.entries(res).map(([k, n]) => `${k} ×${n}`).join(', ') || 'none'}</div><div><b>Monsters</b>${ms.length ? ms.sort((x, y) => x.level - y.level).map((m) => `${m.icon} ${esc(m.name)} (${m.level}${m.boss ? ', boss' : ''})`).join(', ') : 'none: safe area'}</div><div><b>Quest givers</b>${npcsOf(a).map((n) => esc(n.name)).join(', ') || 'none'}</div></div>${maps}</section>`; }).join('')}`);

  // ---------------- bestiary ----------------
  const areaOf = (id) => ORDER.filter((a) => CATALOG.some((r) => r.area === a && (r.def.mobs || []).includes(id)));
  const dropText = (m) => { const g = {}, gear = []; for (const [id, p] of m.drops || []) { const d = D.W.items[id]; if (!d) continue; if (d.type === 'weapon' || d.type === 'armor') gear.push(Math.round(p * 100)); else g[d.name] = Math.round(p * 100); } const out = Object.entries(g).map(([n, p]) => `${n} ${p}%`); if (gear.length) out.push(`gear ×${gear.length} (${Math.max(...gear)}% each)`); return out.join(', ') || '-'; };
  emit('bestiary', 'Bestiary', 'Every monster in the game, by area, with level, health, damage, XP and drops.', ORDER.filter((a) => monsOf(a).length).map((a) => { const list = [...new Set(CATALOG.filter((r) => r.area === a).flatMap((r) => r.def.mobs || []))].filter((id) => areaOf(id)[0] === a).map((id) => [id, D.W.mobs[id]]).filter(([, m]) => m).sort((x, y) => x[1].level - y[1].level);
    return list.length ? `<div class="agrp g-${GENRE[a]}">${h2(AREAS[a][0], 'b-' + a)}${table(['', 'Monster', 'Level', 'Health', 'Damage', 'Armor', 'XP', 'Credits', 'Behavior', 'Drops'], list.map(([id, m]) => [`<span class="emo">${m.icon}</span>`, `<b>${esc(m.name)}</b>${m.boss ? ' ' + pill('BOSS', 'r') : ''}${areaOf(id).length > 1 ? `<br><small>also in ${areaOf(id).slice(1).map((x) => AREAS[x][0]).join(', ')}</small>` : ''}`, m.level, num(m.hp), `${m.dmg[0]}-${m.dmg[1]}`, m.ac, num(m.xp), `${num((m.gold || [m.level * 2, m.level * 5])[0])}-${num((m.gold || [m.level * 2, m.level * 5])[1])}`, [m.aggro ? 'aggressive' : 'passive', m.wander ? 'wanders' : ''].filter(Boolean).join(', '), dropText(m)]))}</div>` : ''; }).join(''));

  // ---------------- npcs and quests ----------------
  const QS = D.Q.QUESTS, reqText = (q) => q.obj.map((o) => D.objText(o)).join('; ');
  emit('npcs-quests', 'NPCs and Quests', `${Object.keys(D.Q.NPCS).length} NPCs give ${D.Q.QUESTS.length} contracts. Finish them for XP, credits, gear and quest points.`, `
<p>Take contracts at the <b>Adventurers' Guild</b> board (<code>board</code>), talk to a giver (<code>talk &lt;name&gt;</code>), <code>accept</code> a quest, and turn it in by talking to the giver again. Quest points (QP) are awarded <b>once</b> per quest. The quest window shows your accepted contracts.</p>
${h2('The NPCs')}<div class="cards">${Object.entries(D.Q.NPCS).map(([id, n]) => { const r = ROOM[n.room]; return card(`<img src="../img/npc/${id}.jpg" alt="${esc(n.name)}" loading="lazy">`, esc(n.name), `<p class="m">${esc(n.long)}</p><p class="m">${pill(r ? r.name : n.room, 'b')} ${`<span class="gtag g-${r ? GENRE[r.area] : 'west'}">${r ? AREAS[r.area][0] : ''}</span>`}</p><p class="m">${QS.filter((q) => q.giver === id).map((q) => esc(q.name)).join(' · ')}</p>`); }).join('')}</div>
${h2('All contracts')}<p>Contract XP grows with the contract's level: about one level's worth of XP at that level, times 2.5 for boss contracts, 1 for kill contracts, 0.7 for fetch contracts, 0.5 for visit and talk contracts, plus 25% for follow-ups. Each remort adds 10%. Quest points are separate and awarded once per contract.</p>${table(['Quest', 'Giver', 'Min level', 'Requirements', 'Reward', 'Quest points', 'Needs first'], QS.map((q) => [`<b>${esc(q.name)}</b>`, esc(D.Q.NPCS[q.giver].name), q.min, esc(reqText(q)), `${num(q.rew.xp)} XP, ${num(q.rew.gold || 0)}c${(q.rew.items || []).length ? ', ' + q.rew.items.map(nm).join(', ') : ''}`, q.rew.qp, q.after ? esc(QS.find((x) => x.id === q.after).name) : '-']), { filter: 'quests' })}
<p>All ${QS.length} quests together are worth <b>${QS.reduce((s, q) => s + q.rew.qp, 0)}</b> quest points.</p>`);

  // ---------------- directions: routes from Ashfall Square to every area and its notable places ----------------
  const LET = { north: 'n', south: 's', east: 'e', west: 'w', up: 'u', down: 'd', northeast: 'ne', northwest: 'nw', southeast: 'se', southwest: 'sw', in: 'in', out: 'out' };
  const steps = (path) => { const r = route(path); return r === 'you start here' ? [] : r.split(', '); };
  const words = (st) => { if (!st.length) return 'You are already there'; const out = []; for (let i = 0; i < st.length;) { let j = i; while (j < st.length && st[j] === st[i]) j++; out.push(j - i > 1 ? `${j - i} x ${st[i]}` : st[i]); i = j; } return out.join(', '); };
  const comp = (st) => { const out = []; for (let i = 0; i < st.length;) { let j = i; while (j < st.length && st[j] === st[i]) j++; out.push((j - i > 1 ? j - i : '') + LET[st[i]]); i = j; } return out.join(','); };
  const swalk = (st) => { const segs = [[]]; for (const t of st) { if (t === 'enter portal') segs.push([]); else segs[segs.length - 1].push(t); } return segs.map((a) => (a.length ? `<code>speedwalk ${comp(a)}</code>` : '')).filter(Boolean).join(' then <code>enter portal</code> then '); }; // portals cannot be speedwalked, so the route is split around them
  const dir = (path) => { const st = steps(path); return [words(st), st.length ? swalk(st) : '', st.length]; };
  const KIND = (r) => { const d = r.def, k = []; if (d.shop || d.clinic) k.push(d.exchange ? 'shop (best for materials)' : 'shop'); if (d.camp) k.push('safe camp'); if (d.healer) k.push('healer'); if (d.forge) k.push('forge'); if (d.rebirth) k.push('remort hall'); if (d.inn) k.push('inn'); if (d.saloon) k.push('saloon and blackjack');
    for (const id of d.mobs || []) { const m = D.W.mobs[id]; if (m && m.boss && !k.includes('boss: ' + m.name)) k.push('boss: ' + m.name); } if (d.vault) k.push('bank vault'); return k; };
  const HUB = ['town/adventurers_guild', 'town/smithy', 'town/market', 'town/armory', 'town/inn', 'town/temple', 'town/clinic', 'town/implant_lab', 'town/salvage_exchange', 'town/hall_of_rebirth', 'town/gate', 'town/eastgate', 'town/quarry'];
  const sections = ORDER.map((a) => {
    const rs = CATALOG.filter((r) => r.area === a), pick = (a === 'town' ? HUB.map((p) => ROOM[p]).filter(Boolean).map((r) => rs.find((x) => x.path === r.path) || r) : rs.filter((r) => KIND(r).length)), en = rs.map((r) => [r.path, steps(r.path).length]).sort((x, y) => x[1] - y[1])[0][0];
    const [w, c, n] = dir(en), lv = AREAS[a][1];
    const place = (r) => { const [pw, pc, pn] = dir(r.path); const kinds = a === 'town' ? [] : KIND(r); return [`<b>${esc(r.name)}</b>${kinds.length ? '<br><small>' + esc(kinds.join(', ')) + '</small>' : ''}`, esc(pw), pc, String(pn)]; };
    return `<section class="area g-${GENRE[a]}" id="${a}"><h2>${AREAS[a][0]}</h2><p>${pill(lv, 'a')} ${pill(n ? n + ' steps' : 'you start here', 'b')}</p>${a === 'town' ? '<p>Ashfall Square is where every new character starts, and <code>recall</code> brings you back from anywhere.</p>' : `<div class="facts"><div><b>Entrance (${esc(rs.find((r) => r.path === en).name)})</b>${esc(w)}</div><div><b>Speedwalk</b>${c}</div></div>`}
${table(['Place', 'Directions from Ashfall Square', 'Speedwalk', 'Steps'], pick.slice(0, 40).map(place))}</section>`;
  }).join('');
  emit('directions', 'Directions', 'Routes from Ashfall Square to every area and its shops, camps and bosses, with ready-to-paste speedwalk commands.', `
<p>Every route starts in <b>Ashfall Square</b> (where you begin, and where <code>recall</code> takes you). Directions are in words, and as a <b>speedwalk</b> command you can paste into the game: it walks the whole route one step at a time (<code>3n</code> means three steps north). It stops if you cannot go that way or a fight starts, and typing anything else cancels it. Monsters live along many routes, so check the level range first. For town landmarks, <code>travel &lt;place&gt;</code> walks safe rooms only.</p>
<div class="chips">${ORDER.map((a) => `<a class="g-${GENRE[a]}" href="#${a}">${AREAS[a][0]}</a>`).join('')}</div>
${sections}`);
};
