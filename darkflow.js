'use strict';
// DARKFLOW SUPPORT: lets the Darkflow client (a WebSocket / telnet MUD client with GMCP panels) play MULTIVERSE MUD.
//   - WebSocket on the game port, any path except /ws (Darkflow opens ws://host:port/): text frames are commands in and ANSI text out,
//     binary frames carry GMCP ("Package.Name {json}").
//   - Plain telnet (default port 4242, TELNET_PORT=0 turns it off) with GMCP negotiation (option 201), so Darkflow's /proxy bridge,
//     which is what an https-hosted Darkflow uses, and ordinary telnet clients work too.
// A "conn" here looks exactly like the browser client's connection to the rest of the game: send(object) in, a Player on the other end.
// The adapter turns the game's JSON messages into ANSI text and GMCP: Char.Vitals/Status/Worth/Items/Defences/Enemy, Room.Info/Players,
// Comm.Channel.Text and Darkwind.Room.Image, and runs a text login (name, password, class, gender) before handing over to the game.
const crypto = require('crypto');
const D = require('./driver');

const ESC = '\x1b[', RESET = ESC + '0m', TOKEN = /⟦(#[0-9a-fA-F]{6})\|([^⟧]*)⟧/g;
const rgb = (h) => `38;2;${parseInt(h.slice(1, 3), 16)};${parseInt(h.slice(3, 5), 16)};${parseInt(h.slice(5, 7), 16)}`;
const fg = (h) => `${ESC}${rgb(h)}m`;
// colours by message class, chosen for a dark terminal (the browser client styles these with its own CSS)
const CLASS_COLOR = { sys: '#9fb8c8', win: '#7be07a', hurt: '#ff6b5e', rname: '#ffd34a', items: '#c9b8ff', quest: '#ffb347', event: '#ffb86b', social: '#ff9ecf', team: '#6fd6b0', task: '#e0c26b', miss: '#7d7d86', chat: '#d6b3ff', say: '#8fd3f4', gossip: '#c7a6e8', spellfx: '#19e3ff', spell: '#19e3ff', weather: '#7ec8ff', combat: '#f0c9a8', auction: '#ffe066', skillup: '#e3f988', mail: '#ffb347', living: '#e0a98a', exits: '#7be0a0', bot: '#9ab6d6', unobtainium: '#ff7ad9', skull: '#ff6b5e', shophint: '#ff8a5e', planting: '#8bc34a', notify: '#8cefff', game: '#19e3ff', brand: '#ffb347', brightlight: '#ffffff', voiddesc: '#6e6e78', announce: '#ffd34a', wanted: '#ff9a2e', taunt: '#5fe06a', deathmsg: '#ff9a9a', qrew: '#d9c38a', ck: '#5fe06a', oacc: '#7be07a', ok: '#7be07a', cr: '#ffd34a', gw: '#ffb347', gs: '#19e3ff', gp: '#a0e06a', ytp: '#ffffff', die: '#9a9a9a' };
const BOLD = new Set(['rname', 'brand', 'brightlight', 'win']);
const GAME_NAME = 'MULTIVERSE MUD';

// stable numeric room ids for Darkflow's map (it treats non-numeric exit values as "blocked")
const roomNum = (path) => String(parseInt(crypto.createHash('sha1').update(String(path)).digest('hex').slice(0, 12), 16));
D.dfRoomNum = roomNum;
const AREAS = (D.AREA_LABEL || {});
const DIRS = { north: 'north', south: 'south', east: 'east', west: 'west', up: 'up', down: 'down', northeast: 'northeast', northwest: 'northwest', southeast: 'southeast', southwest: 'southwest', n: 'north', s: 'south', e: 'east', w: 'west', u: 'up', d: 'down', ne: 'northeast', nw: 'northwest', se: 'southeast', sw: 'southwest' };

function ansi(text, cls) {
  const col = CLASS_COLOR[cls], base = col ? (BOLD.has(cls) ? ESC + '1m' : '') + fg(col) : '';
  let s = String(text).replace(TOKEN, (m, h, t) => fg(h) + t + RESET + base);
  s = s.replace(/\u27e6#[0-9a-fA-F]{6}\|/g, '').replace(/\u27e7/g, ''); // an unclosed or stray colour token must never show
  s = s.replace(/\r?\n/g, '\r\n' + base);
  return base ? base + s + RESET : s;
}

// `tx` is the transport: { text(str), gmcp(str), close(), host, publicUrl }. Returns the conn the game talks to; feed it with onText / onGmcp.
function create(tx, ip, deps) {
  const c = { ip, player: null, closed: false, state: 'name', tmp: {}, last: {}, client: {}, df: true };
  const out = (s) => tx.text(s);
  const line = (s, cls) => out(ansi(s, cls) + '\r\n');
  const gm = (pkg, data) => { try { tx.gmcp(data === undefined ? pkg : pkg + ' ' + JSON.stringify(data)); } catch (e) { /* closed */ } };
  const gmOnce = (pkg, data) => { const j = JSON.stringify(data); if (c.last[pkg] === j) return; c.last[pkg] = j; gm(pkg, data); }; // only sends when something changed
  c.gm = gm;
  const prompt = (s) => out(ansi(s, 'rname'));
  const classes = () => Object.entries(D.K.CLASSES).filter(([, v]) => !v.remort).map(([k, v]) => ({ k, name: v.name, icon: v.icon, desc: v.desc }));

  c.banner = () => {
    out('\r\n' + fg('#ffb347') + ESC + '1m' + '  M U L T I V E R S E   M U D' + RESET + '\r\n');
    line('  A world of Old West towns, dragons, starships and dinosaurs. Playing through Darkflow.', 'sys');
    line('  New here? Type any name (3 to 12 letters) and pick a password: the character is created for you.', 'sys');
    out('\r\n'); prompt('Name: ');
  };

  // ---- text login: name, password, then class and gender for a new character ----
  const NEWCHAR = (n) => !!(deps.exists && deps.exists(n));
  const loginErr = (m) => { line(m, 'hurt'); c.state = 'name'; c.tmp = {}; prompt('Name: '); };
  c.onLine = (raw) => {
    const s = String(raw).replace(/[\r\n]+$/, '');
    if (c.player) { // in the game
      let l = s.slice(0, 300);
      if (/^score\s*$/i.test(l)) l = 'score text'; // the graphical score sheet is a browser window; Darkflow gets the text version
      return D.command(c.player, l);
    }
    const t = s.trim();
    if (c.state === 'name') {
      if (!/^[A-Za-z]{3,12}$/.test(t)) return loginErr('Names are 3 to 12 letters.');
      c.tmp = { name: t }; c.state = 'pass';
      return prompt(NEWCHAR(t) ? `Welcome back, ${t}. Password: ` : `New character ${t}. Choose a password (4+ characters): `);
    }
    if (c.state === 'pass') {
      if (t.length < 4 && s.length < 4) return loginErr('Passwords need at least 4 characters.');
      c.tmp.pass = s;
      if (NEWCHAR(c.tmp.name)) return c.finish();
      c.state = 'cls'; const list = classes();
      line('\r\nChoose a class (type the number or the name):', 'sys'); list.forEach((k, i) => line(`  ${String(i + 1).padStart(2)}. ${k.name}${k.desc ? ' - ' + String(k.desc).split(/(?<=[.!?])\s/)[0].slice(0, 110) : ''}`, 'items'));
      return prompt('Class: ');
    }
    if (c.state === 'cls') {
      const list = classes(), n = parseInt(t, 10);
      const pick = (n >= 1 && n <= list.length ? list[n - 1] : list.find((k) => k.k === t.toLowerCase() || k.name.toLowerCase() === t.toLowerCase()));
      if (!pick) { line('Pick one of the numbers or names above.', 'hurt'); return prompt('Class: '); }
      c.tmp.cls = pick.k; c.state = 'gender'; return prompt('Gender (male, female or nonbinary): ');
    }
    if (c.state === 'gender') {
      const g = { m: 'male', male: 'male', f: 'female', female: 'female', n: 'nonbinary', nb: 'nonbinary', nonbinary: 'nonbinary' }[t.toLowerCase()];
      if (!g) { line('Type male, female or nonbinary.', 'hurt'); return prompt('Gender: '); }
      c.tmp.gender = g; return c.finish();
    }
  };
  c.finish = () => { const m = { name: c.tmp.name, pass: c.tmp.pass, cls: c.tmp.cls, gender: c.tmp.gender }; c.state = 'game'; c.tmp = {}; deps.login(c, m); };

  // ---- GMCP from Darkflow ----
  c.onGmcp = (pkg, data) => {
    if (pkg === 'Core.Hello') { c.client = data && typeof data === 'object' ? data : {}; }
    else if (pkg === 'Core.Ping') gm('Core.Ping');
    else if (pkg === 'Comm.Channel.Players') gm('Comm.Channel.Players', [...D.players.values()].filter((p) => !p.isBot || true).map((p) => ({ name: p.name, fullname: p.name })));
    else if (pkg === 'Comm.Channel.Enable') { /* every channel is already on */ }
    else if (pkg === 'Darkwind.Client.RefreshMedia') { if (c.player) { c.last = {}; try { c.player.sendStats(); c.player.send(D.mapFor(c.player)); } catch (e) { /* not ready */ } } }
    else if (pkg === 'Core.Supports.Set' || pkg === 'Core.Supports.Add') c.supports = data;
  };
  const hello = () => {
    gm('Core.Hello', { client: GAME_NAME, version: D.build ? D.build() : '1', server: GAME_NAME, id: 'multiverse-mud' });
    gm('Core.Supports.Set', ['Char 1', 'Char.Vitals 1', 'Char.Status 1', 'Char.Worth 1', 'Char.Enemy 1', 'Char.Items 1', 'Char.Defences 1', 'Room 1', 'Comm 1', 'Comm.Channel 1', 'Darkwind.Room.Image 1', 'Darkwind.Char.Avatar 1', 'Darkwind.Quests 1']);
    gm('Comm.Channel.List', [{ name: 'gossip', caption: 'Gossip', command: 'gossip' }, { name: 'say', caption: 'Say', command: 'say' }, { name: 'chat', caption: 'Chat', command: 'chat' }, { name: 'team', caption: 'Group', command: 'gt' }]);
  };

  // ---- the game's JSON messages -> ANSI and GMCP ----
  const pctWord = (p) => (p >= 100 ? 'unhurt' : p >= 75 ? 'scratched' : p >= 50 ? 'wounded' : p >= 25 ? 'badly wounded' : p > 0 ? 'near death' : 'dead');
  function stats(o) {
    const p = c.player; if (!p) return;
    const pctLv = o.hi > o.lo ? Math.max(0, Math.min(100, Math.round(100 * (o.xp - o.lo) / (o.hi - o.lo)))) : 0;
    gmOnce('Char.Vitals', { hp: o.hp, maxhp: o.max, sp: o.mp || 0, maxsp: o.mmp || 0, level_pct: pctLv });
    gmOnce('Char.Status', { name: o.name, fullname: o.name, class: o.cls, level: o.level, xp: o.xp, nl: Math.max(0, (o.hi || 0) - (o.xp || 0)), gender: o.gd, align: p.align || 'neutral', title: o.rt || '', gold: o.gold });
    gmOnce('Char.Worth', { gold: o.gold, bank: p.bank || 0 });
    if (tx.publicUrl && o.pic) gmOnce('Darkwind.Char.Avatar', { url: `${tx.publicUrl}/${String(o.pic).replace(/^\//, '')}`, name: o.name });
    const fx = (o.fx || []).map((e) => ({ name: String(e.n), kind: e.neg ? 'debuff' : 'buff', duration: Math.round((e.m || 0) * 2), remaining: Math.round((e.t || 0) * 2) }));
    gmOnce('Char.Defences.List', fx);
    const items = p.inv.map((it, i) => ({ id: String(it.id || it.uid || i), name: D.stripColor(it.short || it.name || 'something'), attrib: Object.values(p.equip || {}).includes(it) ? (it.def && it.def.slot === 'weapon' ? 'l' : 'w') : '' }));
    gmOnce('Char.Items.List', { location: 'inv', items });
  }
  function room(o) {
    const p = c.player; if (!p || !p.env) return;
    const me = (o.rooms || []).find((r) => r.p === o.me) || {}, ex = {};
    for (const e of me.ex || []) { const d = DIRS[e.d] || e.d; ex[d] = roomNum(e.to); }
    gmOnce('Room.Info', { num: roomNum(o.me), name: o.rn || p.env.name, area: o.area || o.ra, environment: me.t || p.env.terrain || '', coords: { x: me.x || 0, y: me.y || 0, z: o.z || 0 }, exits: ex });
    gmOnce('Room.Players', p.env.inv.filter((x) => x.isPlayer && x !== p).map((x) => ({ name: x.name, fullname: x.name })));
    if (o.rp && tx.publicUrl) gmOnce('Darkwind.Room.Image', { url: `${tx.publicUrl}/img/rooms/${o.rp}`, name: o.rn || '' });
    else if (o.ap && tx.publicUrl) gmOnce('Darkwind.Room.Image', { url: `${tx.publicUrl}/img/areas/${o.ap}`, name: o.area || '' });
  }
  function fight(e) {
    const p = c.player; if (!p || !e.a || !e.b) return;
    const meA = e.a.k === 'p' && e.a.name.toLowerCase() === p.name.toLowerCase(), meB = e.b.k === 'p' && e.b.name.toLowerCase() === p.name.toLowerCase();
    if (!meA && !meB) return; const foe = meA ? e.b : e.a; if (foe.k === 'p' && foe.name === p.name) return;
    if (e.dead && foe.hp <= 0) return gm('Char.Enemy', { enemy_name: '' });
    const pct = foe.max ? Math.round(100 * foe.hp / foe.max) : 0;
    gm('Char.Enemy', { enemy_name: D.stripColor(foe.name), enemy_curhp: foe.hp, enemy_maxhp: foe.max, enemy_hp_string: pctWord(pct), enemy_is_npc: foe.k === 'm' ? 1 : 0, level: foe.lvl });
  }
  const whoText = (o) => { line('Players online:', 'rname'); for (const w of o.list || []) line(`  ${String(w.name).padEnd(14)} ${String(w.cn || '').padEnd(14)} level ${w.lv}${w.rm ? ' remort ' + w.rm : ''}${w.bot ? ' [bot]' : ''}${w.ld ? ' [linkdead]' : ''}`, 'sys'); };

  c.send = (o) => {
    if (c.closed || !o) return;
    switch (o.t) {
      case 'text': {
        line(o.m, o.c);
        if (o.c === 'gossip' || o.c === 'chat' || o.c === 'say' || o.c === 'team') { const plain = D.stripColor(o.m), who = (plain.match(/^(?:\[[^\]]*\]\s*)?([A-Za-z]{3,12})\b/) || [])[1] || ''; gm('Comm.Channel.Text', { channel: o.c === 'team' ? 'team' : o.c, talker: who, text: plain }); }
        break;
      }
      case 'err': if (c.player) line(String(o.m || ''), 'hurt'); else loginErr(String(o.m || 'Login failed.')); break;
      case 'ok': hello(); c.state = 'game'; line(`Connected to ${GAME_NAME} as ${o.name}.`, 'win'); break;
      case 'stats': stats(o); break;
      case 'map': room(o); break;
      case 'fight': fight(o); break;
      case 'who': whoText(o); break;
      case 'quests': { gmOnce('Darkwind.Quests.List', (o.list || []).map((q) => { const cur = (q.obj || []).reduce((a, x) => a + Math.min(x.c, x.n), 0), tot = (q.obj || []).reduce((a, x) => a + x.n, 0); return { name: q.name, status: q.ready ? 'Ready to turn in' : 'Started', current: cur, total: tot, objectives: (q.obj || []).map((x) => ({ name: D.stripColor(x.t), current: x.c, required: x.n, status: x.c >= x.n ? 'finished' : 'started' })) }; })); break; }
      case 'quit': setTimeout(() => tx.close(), 150); break;
      default: break; // sounds, tutorial, mail windows and the browser-only panels have no Darkflow equivalent
    }
  };
  c.close = () => { if (c.closed) return; c.closed = true; try { tx.close(); } catch (e) { /* closing */ } };
  return c;
}

// ---- plain telnet transport (with GMCP, option 201) ----
const IAC = 255, DONT = 254, DO = 253, WONT = 252, WILL = 251, SB = 250, SE = 240, GMCP = 201, ECHO = 1, SGA = 3;
function telnet(socket, ip, deps, publicUrl) {
  const esc = (b) => { const o = []; for (const x of b) { o.push(x); if (x === IAC) o.push(IAC); } return Buffer.from(o); };
  let gmcpOn = false, buf = [], st = 0, sb = [], gmcpFrames = [];
  const tx = {
    publicUrl,
    text: (s) => { if (!socket.destroyed) socket.write(String(s)); },
    gmcp: (s) => { if (gmcpOn && !socket.destroyed) socket.write(Buffer.concat([Buffer.from([IAC, SB, GMCP]), esc(Buffer.from(s, 'utf8')), Buffer.from([IAC, SE])])); },
    close: () => { try { socket.end(); } catch (e) { /* closed */ } },
  };
  const c = create(tx, ip, deps);
  socket.write(Buffer.from([IAC, WILL, GMCP, IAC, WILL, SGA]));
  setImmediate(() => c.banner());
  let rl = 0; const rt = setInterval(() => (rl = 0), 1000); rt.unref && rt.unref();
  socket.on('data', (d) => {
    let text = [];
    for (const b of d) {
      if (st === 0) { if (b === IAC) st = 1; else text.push(b); }
      else if (st === 1) { if (b === IAC) { text.push(IAC); st = 0; } else if (b === SB) { st = 4; sb = []; } else if (b === DO || b === DONT || b === WILL || b === WONT) { c._neg = b; st = 2; } else st = 0; }
      else if (st === 2) { if (c._neg === DO && b === GMCP) { gmcpOn = true; } else if (c._neg === WILL && b !== GMCP && b !== SGA && b !== 31 && b !== 24) socket.write(Buffer.from([IAC, DONT, b])); st = 0; }
      else if (st === 4) { if (b === IAC) st = 5; else sb.push(b); }
      else if (st === 5) { if (b === SE) { if (sb[0] === GMCP) gmcpFrames.push(Buffer.from(sb.slice(1)).toString('utf8')); st = 0; } else if (b === IAC) { sb.push(IAC); st = 4; } else st = 0; }
    }
    for (const f of gmcpFrames.splice(0)) { const i = f.indexOf(' '), pkg = i < 0 ? f : f.slice(0, i); let data; try { data = i < 0 ? undefined : JSON.parse(f.slice(i + 1)); } catch (e) { data = f.slice(i + 1); } c.onGmcp(pkg, data); }
    if (text.length) { buf.push(...text); let s = Buffer.from(buf).toString('utf8'); const parts = s.split(/\r\n|\n|\r\0?/); const rest = parts.pop(); buf = [...Buffer.from(rest, 'utf8')]; for (const l of parts) { if (++rl > 40) continue; c.onLine(l.replace(/\0/g, '')); } }
  });
  return c;
}

module.exports = { create, telnet, ansi, roomNum };
