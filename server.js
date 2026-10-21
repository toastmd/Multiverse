'use strict';
// MULTIVERSE MUD server. No npm packages needed: HTTP static files + a small WebSocket implementation.
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const D = require('./driver'); require('./lib'); require('./commands'); const bots = require('./bots'), bridge = require('./bridge'), github = require('./github'), bounty = require('./bounty'), auction = require('./auction'); D.blackjack = require('./blackjack'); D.deaths = require('./deaths'); const weather = require('./weather'); const reports = require('./reports'); D.mail = require('./mail'); D.bridge = bridge; D.bounty = bounty; D.auction = auction;
const PORT = +process.env.PORT || 4000, HOST = process.env.HOST || '0.0.0.0';
const PUB = path.join(__dirname, 'public'), DATA = path.join(__dirname, 'data', 'players');
fs.mkdirSync(DATA, { recursive: true });

D.loadWorld(); { const rm = Number(require('./config')().resetMinutes); if (rm > 0) D.resetEvery = rm * 60000; } D.start();
D.portraitFor = (id) => { if (!/^[a-z0-9_]+$/.test(id)) return null; if (id.startsWith('mob_')) { const f = D.mobPic(id.slice(4)); return f ? `/img/mob/${f}` : null; } for (const ext of ['jpg', 'svg']) if (fs.existsSync(path.join(PUB, 'img', 'npc', `${id}.${ext}`))) return `/img/npc/${id}.${ext}`; return null; }; // generated portraits first, old SVGs as a fallback

// ---- grid area builder API (builder.html). Protected by a key that is printed in the server log. ----
const CUSTOM = path.join(__dirname, 'data', 'custom'); fs.mkdirSync(CUSTOM, { recursive: true });
const KEYFILE = path.join(__dirname, 'data', 'builder.key');
const BKEY = process.env.BUILDER_KEY || (fs.existsSync(KEYFILE) ? fs.readFileSync(KEYFILE, 'utf8').trim() : (() => { const k = crypto.randomBytes(5).toString('hex'); fs.writeFileSync(KEYFILE, k); return k; })());
const RESERVED = new Set(['town', 'forest', 'crypt', 'marsh', 'road', 'mines', 'dunes', 'frost', 'ember', 'cit', 'citadel', 'abyss', 'custom']);
const TERRAINS = ['grass', 'dirt', 'stone', 'concrete', 'metal'], DIRS = ['n', 's', 'e', 'w', 'u', 'd'], FLAGS = ['safe', 'camp', 'inn', 'healer', 'forge'];
function cleanArea(a) { // validate and rebuild the area from known fields only
  const w = [], id = String(a.id || '').toLowerCase();
  if (!/^[a-z][a-z0-9_]{1,20}$/.test(id) || RESERVED.has(id)) throw new Error('Area id must be 2-21 chars (a-z, 0-9, _), start with a letter, and not be a built-in area name.');
  if (!Array.isArray(a.rooms) || !a.rooms.length || a.rooms.length > 200) throw new Error('An area needs 1 to 200 rooms.');
  const o = a.origin || {}, out = { id, terrain: TERRAINS.includes(a.terrain) ? a.terrain : 'dirt', name: String(a.name || id).slice(0, 60), origin: { x: Math.trunc(o.x) || 0, y: Math.trunc(o.y) || 0, z: Math.trunc(o.z) || 0 }, mobs: {}, rooms: [] };
  for (const [mid, m] of Object.entries(a.mobs || {}).slice(0, 30)) { if (!/^[a-z][a-z0-9_]{0,20}$/.test(mid) || !m.name) continue; out.mobs[mid] = { name: String(m.name).slice(0, 40), icon: String(m.icon || '👾').slice(0, 4), level: Math.max(1, Math.min(40, Math.trunc(m.level) || 1)), boss: !!m.boss, aggro: m.aggro !== false, wander: !!m.wander }; }
  const ids = new Set(), pos = new Set(), ok = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
  for (const r of a.rooms) {
    if (!/^[a-z][a-z0-9_]{0,24}$/.test(r.id || '') || ids.has(r.id)) throw new Error(`Room id "${r.id}" is invalid or duplicated.`);
    if (!ok(r.gx, -100, 100) || !ok(r.gy, -100, 100) || !ok(r.gz || 0, -5, 5)) throw new Error(`Room "${r.id}" has bad grid coordinates.`);
    if (pos.has(`${r.gx},${r.gy},${r.gz || 0}`)) throw new Error(`Two rooms share the cell ${r.gx},${r.gy}.`);
    ids.add(r.id); pos.add(`${r.gx},${r.gy},${r.gz || 0}`);
    const room = { id: r.id, name: String(r.name || r.id).slice(0, 60), long: String(r.long || '').slice(0, 1500), gx: r.gx, gy: r.gy, gz: r.gz || 0, flags: {}, exits: {}, ext: {}, mobs: [], items: [], res: {}, shop: [] };
    if (TERRAINS.includes(r.terrain)) room.terrain = r.terrain;
    if (room.long.length < 20) w.push(`Room "${room.name}" has a very short description.`);
    for (const f of FLAGS) if (r.flags && r.flags[f]) room.flags[f] = true;
    room.mobs = (r.mobs || []).slice(0, 12).map(String); room.items = (r.items || []).slice(0, 12).map(String); room.shop = (r.shop || []).slice(0, 20).map(String);
    for (const k of ['herb', 'ore', 'fish']) if (r.res && ok(+r.res[k], 1, 9)) room.res[k] = +r.res[k];
    for (const d of DIRS) { if (r.exits && r.exits[d]) room.exits[d] = String(r.exits[d]); if (r.ext && r.ext[d]) room.ext[d] = String(r.ext[d]); }
    out.rooms.push(room);
  }
  for (const r of out.rooms) {
    for (const [d, to] of Object.entries(r.exits)) if (!ids.has(to)) { delete r.exits[d]; w.push(`Removed exit ${d} from "${r.id}" to unknown room "${to}".`); }
    for (const [d, to] of Object.entries(r.ext)) { const t = D.rooms.get(to), opp = { n: 's', s: 'n', e: 'w', w: 'e', u: 'd', d: 'u' }[d];
      if (!t) { delete r.ext[d]; w.push(`External link ${d} from "${r.id}" to unknown room "${to}" was dropped.`); } else if (t.exits[opp] && !t.def.custom) w.push(`${to} already has an exit ${opp}; the link from "${r.id}" is one-way.`); }
    for (const m of r.mobs) if (!out.mobs[m] && !D.W.mobs[m]) w.push(`Room "${r.id}" lists unknown monster "${m}" (ignored).`);
  }
  return { out, w };
}
function readBody(req, cb) { let b = ''; req.on('data', (c) => { b += c; if (b.length > 1e6) req.destroy(); }); req.on('end', () => cb(b)); }
function api(req, res) {
  const u = new URL(req.url, 'http://x'), send = (code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(obj)); };
  if (req.headers['x-key'] !== BKEY) return send(401, { error: 'Wrong builder key (see the server log).' });
  const name = (u.searchParams.get('name') || '').toLowerCase().replace(/[^a-z0-9_]/g, '');
  try {
    if (u.pathname === '/api/world' && req.method === 'GET') {
      const rs = [...D.rooms.values()];
      return send(200, { mobs: Object.entries(D.W.mobs).map(([id, m]) => ({ id, name: m.name, level: m.level })), items: Object.entries(D.W.items).map(([id, i]) => ({ id, name: i.name, type: i.type })),
        rooms: rs.map((r) => ({ id: r.path, name: r.name, area: r.area, x: r.x, y: r.y, z: r.z })), custom: fs.readdirSync(CUSTOM).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5)), suggest: { x: Math.max(...rs.map((r) => r.x)) + 4, y: 0, z: 0 } });
    }
    if (u.pathname === '/api/area' && req.method === 'GET') { const f = path.join(CUSTOM, name + '.json'); return fs.existsSync(f) ? send(200, JSON.parse(fs.readFileSync(f, 'utf8'))) : send(404, { error: 'No such area.' }); }
    if (u.pathname === '/api/area' && req.method === 'POST') return readBody(req, (body) => {
      try { const { out, w } = cleanArea(JSON.parse(body)); fs.writeFileSync(path.join(CUSTOM, out.id + '.json'), JSON.stringify(out, null, 1)); D.loadWorld(); D.pushMaps(); D.log(`builder: saved area ${out.id} (${out.rooms.length} rooms)`); github.touch(`Area builder: saved area ${out.id} (${out.rooms.length} rooms)`); send(200, { ok: true, rooms: out.rooms.length, warnings: w }); }
      catch (e) { send(400, { error: e.message }); }
    });
    if (u.pathname === '/api/area' && req.method === 'DELETE') { const f = path.join(CUSTOM, name + '.json'); if (!fs.existsSync(f)) return send(404, { error: 'No such area.' }); fs.unlinkSync(f); D.loadWorld(); D.pushMaps(); github.touch(`Area builder: deleted area ${name}`); return send(200, { ok: true }); }
  } catch (e) { return send(500, { error: e.message }); }
  send(404, { error: 'Unknown API call.' });
}
const file = (name) => path.join(DATA, name.toLowerCase() + '.json');
// ---- achievements leaderboard: level (a remort counts as 40 more levels), quests completed and tradeskill levels raised ----
const ach = (r) => { const lvl = (r.remort || 0) * 40 + (r.level || 1), q = (r.qdone || []).length, t = Object.values(r.skills || {}).reduce((s, k) => s + Math.max(0, ((k && k.lvl) || 1) - 1), 0); const b = r.bounty || 0; return { lvl, q, t, b, score: lvl * 100 + q * 250 + t * 40 + b * 40 }; };
let boardCache = { at: 0, rows: [] };
D.leaderboard = (force) => {
  if (!force && Date.now() - boardCache.at < 15000) return boardCache.rows; const rows = new Map();
  try { for (const f of fs.readdirSync(DATA)) { if (!f.endsWith('.json')) continue; try { const r = JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8')); if (r.name) rows.set(r.name.toLowerCase(), { name: r.name, rec: r }); } catch (e) { /* skip a damaged file */ } } } catch (e) { /* no players yet */ }
  for (const p of D.players.values()) rows.set(p.name.toLowerCase(), { name: p.name, rec: { ...(p.rec || {}), ...p.toRec(), level: p.level, remort: p.remort }, live: p });
  const out = [...rows.values()].map(({ name, rec, live }) => { const k = D.K.CLASSES[rec.cls] || { name: '?' }; return { name, cls: rec.cls, cn: k.name, g: rec.gender || 'nonbinary', rm: rec.remort || 0, lv: rec.level || 1, bot: !!(live && live.isBot), on: !!live, ...ach(rec) }; }).sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  out.forEach((r, i) => { r.rank = i + 1; }); boardCache = { at: Date.now(), rows: out }; return out;
};
D.creditOffline = (name, o) => { // add credits or an item to a saved character who is not online (auction proceeds and returned items)
  try { const f = file(name); if (!fs.existsSync(f)) return false; const r = JSON.parse(fs.readFileSync(f, 'utf8')); if (o.gold) r.gold = (r.gold || 0) + o.gold; if (o.bag) { r.bag = r.bag || {}; r.bag[o.bag] = (r.bag[o.bag] || 0) + 1; } fs.writeFileSync(f, JSON.stringify(r)); return true; } catch (e) { D.log('creditOffline', e.message); return false; }
};
D.build = () => { try { const t = fs.statSync(path.join(PUB, 'index.html')); return t.mtime.toISOString().slice(0, 16).replace(/[-:T]/g, '') + '-' + t.size.toString(36); } catch (e) { return 'unknown'; } }; // identifies the version of public/index.html the server has right now
let areaPics = {}, areaAt = 0; // default room picture per area: public/img/areas/<area id>.jpg
D.areaPic = (area) => { if (Date.now() - areaAt > 30000) { areaAt = Date.now(); try { areaPics = Object.fromEntries(fs.readdirSync(path.join(PUB, 'img', 'areas')).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).map((f) => [f.replace(/\.[^.]+$/, ''), f])); } catch (e) { areaPics = {}; } } return areaPics[area === 'cit' ? 'citadel' : area] || ''; };
let people = {}, peopleAt = 0; // custom pictures for particular players (public/img/people/<name>.jpg, e.g. zeph.jpg); everyone else gets the class + gender portrait
D.playerPic = (p) => { if (Date.now() - peopleAt > 30000) { peopleAt = Date.now(); try { people = Object.fromEntries(fs.readdirSync(path.join(PUB, 'img', 'people')).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).map((f) => [f.replace(/\.[^.]+$/, '').toLowerCase(), f])); } catch (e) { people = {}; } } const f = people[String(p.name || '').toLowerCase()]; return f ? `img/people/${f}` : `img/player/${p.cls}-${{ male: 'm', female: 'f' }[p.gender] || 'n'}.jpg`; };
D.listRoles = () => { const admins = [], architects = []; for (const f of fs.readdirSync(DATA)) { if (!f.endsWith('.json')) continue; const n = f.slice(0, -5); let r; try { r = JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8')); } catch (e) { continue; } const on = D.players.get(n[0].toUpperCase() + n.slice(1)), w = on ? !!on.wiz : !!r.wiz, a = on ? !!on.architect : !!r.architect, nm = n[0].toUpperCase() + n.slice(1); if (w) admins.push(nm); if (a) architects.push(nm); } return { admins, architects }; };
D.setRole = (name, role, on) => { // role: 'wiz' (administrator) or 'architect' (builder). Works for players who are offline too.
  const key = role === 'wiz' ? 'wiz' : 'architect', p = D.players.get(name), f = file(name); if (!p && !fs.existsSync(f)) return 'none';
  if (key === 'wiz' && !on) { const l = D.listRoles(); if (l.admins.length <= 1 && l.admins.includes(name)) return 'last'; }
  if (p) { p[key] = !!on; D.savePlayer(p); p.recalc(); p.sendStats(); p.msg(on ? (key === 'wiz' ? 'You have been made an Administrator (wizard). `commands` shows your new commands; `help wizard` explains them.' : 'You have been made an Architect! Type `builder` for the area builder, and `help builder` for how to use it.') : `Your ${key === 'wiz' ? 'Administrator' : 'Architect'} status was removed.`, 'win'); }
  else { const rec = JSON.parse(fs.readFileSync(f, 'utf8')); rec[key] = !!on; fs.writeFileSync(f, JSON.stringify(rec)); }
  return 'ok';
};
D.builderInfo = () => ({ url: `http://localhost:${PORT}/builder.html`, key: BKEY });
D.fingerRec = (name) => { try { return JSON.parse(fs.readFileSync(path.join(DATA, name.toLowerCase() + '.json'), 'utf8')); } catch (e) { return null; } };
let mobPics = {}, mobAt = 0; // monster pictures in public/img/mob/<mob id>.jpg are shown in the combat view (rescanned every 30 seconds)
D.mobPic = (id) => { if (Date.now() - mobAt > 30000) { mobAt = Date.now(); try { mobPics = Object.fromEntries(fs.readdirSync(path.join(PUB, 'img', 'mob')).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).map((f) => [f.replace(/\.[^.]+$/, ''), f])); } catch (e) { mobPics = {}; } } return mobPics[id] || ''; };
let picMap = {}, picAt = 0; // which rooms have a picture in public/img/rooms (rescanned every 30 seconds, so you can drop images in while the game runs)
D.roomPic = (id) => { if (Date.now() - picAt > 30000) { picAt = Date.now(); try { picMap = Object.fromEntries(fs.readdirSync(path.join(PUB, 'img', 'rooms')).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).map((f) => [f.replace(/\.[^.]+$/, ''), f])); } catch (e) { picMap = {}; } } return picMap[id.replace('/', '-')] || ''; };
const hash = (pw, salt) => crypto.scryptSync(pw, salt, 32).toString('hex');

D.savePlayer = (p) => {
  if (!p.rec) return;
  fs.writeFileSync(file(p.name), JSON.stringify({ ...p.rec, ...p.toRec() }));
};
function drop(p, silent) { // disconnect cleanup; silent when the same player simply reconnects
  if (!p || p.gone) return; p.gone = true; if (p.team) D.teamLeave(p, 'disconnected'); try { auction.onDrop(p); } catch (e) { D.log('auction', e.message); } D.savePlayer(p); if (!silent && !p.isBot) D.presence(p, 'out');
  if (p.env) p.env.tell(`${p.name} fades from the world.`, p, 'sys');
  D.players.delete(p.name); p.destroy(); D.pushMaps();
}
setInterval(() => D.players.forEach(D.savePlayer), 60000);

function login(conn, m) {
  const raw = String(m.name || '').trim(), pass = String(m.pass || '');
  if (!/^[A-Za-z]{3,12}$/.test(raw)) return conn.send({ t: 'err', m: 'Names are 3 to 12 letters.' });
  if (pass.length < 4) return conn.send({ t: 'err', m: 'Passwords need at least 4 characters.' });
  const name = raw[0].toUpperCase() + raw.slice(1).toLowerCase(); let rec, fresh = false;
  if (bots.NAMES.includes(name)) return conn.send({ t: 'err', m: 'That name belongs to a resident bot. Pick another.' });
  if (fs.existsSync(file(name))) {
    rec = JSON.parse(fs.readFileSync(file(name), 'utf8'));
    if (!crypto.timingSafeEqual(Buffer.from(hash(pass, rec.salt)), Buffer.from(rec.hash))) return conn.send({ t: 'err', m: 'Wrong password.' });
  } else {
    const salt = crypto.randomBytes(16).toString('hex'); fresh = true;
    rec = { salt, hash: hash(pass, salt), wiz: fs.readdirSync(DATA).length === 0 }; // first account becomes a wizard
  }
  const old = D.players.get(name); if (old) { const oc = old.conn; drop(old, true); oc && oc.close(); }
  const cls = D.K.CLASSES[m.cls] && !D.K.CLASSES[m.cls].remort ? m.cls : 'barbarian'; /* remort classes cannot be picked at creation */ const p = new D.Player(name, fresh ? cls : rec.cls); if (fresh) p.gender = ['male', 'female', 'nonbinary'].includes(m.gender) ? m.gender : 'nonbinary'; p.rec = { salt: rec.salt, hash: rec.hash }; p.conn = conn; conn.player = p;
  p.send = (o) => conn.send(o); if (!fresh) p.load(rec); else { p.wiz = rec.wiz; const kit = D.cloneItem(p.klass().kit); kit.move(p); p.equip.weapon = kit; D.cloneItem('potion').move(p); }
  D.players.set(name, p); D.savePlayer(p); conn.send({ t: 'ok', name, v: D.build() }); p.sendSpells(); p.sendKeypad(); p.sendTriggers(); p.sendMutes(); p.sendTut(true); p.send({ t: 'sound', k: 'login' }); D.tutQuest(p); D.mail.sync(p); { const un = D.mail.unread(name); if (un) p.msg(`\u2709 You have ${un} unread mudmail${un > 1 ? 's' : ''}. Type \`mail\` to read ${un > 1 ? 'them' : 'it'}.`, 'mail'); }
  p.msg(fresh ? `Welcome to MULTIVERSE MUD, ${name}. Type 'help' for commands. The Dawn Clinic (the Temple, north of the inn) patches up new runners for free: type pray. The Chrome Clinic, west of the inn, sells cyberware.` : `Welcome back, ${name}.`, 'sys');
  const room = D.rooms.get(rec.room) || D.rooms.get(D.W.start);
  const startArea = D.rooms.get(D.W.start).area; for (const r of D.rooms.values()) if (r.area === startArea) p.visited.add(r.path); // the first area (Ashfall) is fully mapped from the start
  p.enter(room); room.tell(`${name} enters the world.`, p, 'sys'); if (!old) D.presence(p, 'in');
}

// ---- minimal RFC 6455 WebSocket ----
function ws(req, socket) {
  const key = req.headers['sec-websocket-key']; if (!key) return socket.destroy();
  const acc = crypto.createHash('sha1').update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
  socket.write(`HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${acc}\r\n\r\n`);
  const c = { buf: Buffer.alloc(0), player: null, count: 0, closed: false };
  setImmediate(() => c.send({ t: 'classes', list: Object.entries(D.K.CLASSES).filter(([, v]) => !v.remort).map(([k, v]) => ({ k, name: v.name, icon: v.icon, desc: v.desc })) }));
  c.raw = (op, pl) => {
    if (c.closed) return; const n = pl.length;
    const h = n < 126 ? Buffer.from([0x80 | op, n]) : n < 65536 ? Buffer.from([0x80 | op, 126, n >> 8, n & 255]) : (() => { const b = Buffer.alloc(10); b[0] = 0x80 | op; b[1] = 127; b.writeBigUInt64BE(BigInt(n), 2); return b; })();
    socket.write(Buffer.concat([h, pl]));
  };
  c.send = (o) => c.raw(1, Buffer.from(JSON.stringify(o)));
  c.close = () => { if (c.closed) return; c.raw(8, Buffer.alloc(0)); c.closed = true; socket.end(); };
  const t = setInterval(() => (c.count = 0), 1000);
  socket.on('close', () => { clearInterval(t); c.closed = true; drop(c.player); });
  socket.on('error', () => socket.destroy());
  socket.on('data', (d) => {
    c.buf = Buffer.concat([c.buf, d]);
    for (;;) {
      const b = c.buf; if (b.length < 2) return;
      const op = b[0] & 15, masked = b[1] & 128; let len = b[1] & 127, off = 2;
      if (len === 126) { if (b.length < 4) return; len = b.readUInt16BE(2); off = 4; } else if (len === 127) { if (b.length < 10) return; len = Number(b.readBigUInt64BE(2)); off = 10; }
      if (len > 65536) return socket.destroy();
      const end = off + (masked ? 4 : 0) + len; if (b.length < end) return;
      let pl = Buffer.from(b.subarray(off + (masked ? 4 : 0), end));
      if (masked) { const k = b.subarray(off, off + 4); for (let i = 0; i < pl.length; i++) pl[i] ^= k[i & 3]; }
      c.buf = b.subarray(end);
      if (op === 8) return c.close(); if (op === 9) { c.raw(10, pl); continue; } if (op !== 1) continue;
      if (++c.count > 25) continue; let m; try { m = JSON.parse(pl.toString('utf8')); } catch { continue; }
      try {
        if (m.t === 'login' && !c.player) login(c, m);
        else if (m.t === 'cmd' && c.player) D.command(c.player, String(m.line || '').slice(0, 300));
        else if (m.t === 'kp' && c.player) D.kp(c.player, m);
        else if (m.t === 'tr' && c.player) D.setTriggers(c.player, m);
        else if (m.t === 'mute' && c.player) D.setMute(c.player, m);
        else if (m.t === 'title' && c.player) D.setTitle(c.player, String(m.text || ''));
        else if (m.t === 'mailsend' && c.player) D.mail.sendFrom(c.player, String(m.to || ''), String(m.subj || ''), String(m.body || ''));
        else if (m.t === 'email' && c.player) D.setEmail(c.player, String(m.text || ''));
        else if (m.t === 'emailhide' && c.player) D.hideEmail(c.player, !!m.hide);
        else if (m.t === 'tut' && c.player) D.tutMsg(c.player, m);
      } catch (e) { D.log('command error', e.stack); }
    }
  });
}

const TYPES = { '.svg': 'image/svg+xml', '.json': 'application/json', '.wav': 'audio/wav', '.txt': 'text/plain; charset=utf-8', '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  if (req.url.startsWith('/api/')) return api(req, res);
  const url = req.url.split('?')[0]; let f = path.join(PUB, url === '/' ? 'index.html' : path.normalize(url));
  if (f.startsWith(PUB) && fs.existsSync(f) && fs.statSync(f).isDirectory()) { if (!url.endsWith('/')) { res.writeHead(301, { Location: url + '/' }); return res.end(); } f = path.join(f, 'index.html'); } // /guide/ serves the player guide
  if (!f.startsWith(PUB) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('Not found'); }
  const st = fs.statSync(f), type = TYPES[path.extname(f)] || 'application/octet-stream';
  if (f === path.join(PUB, 'index.html')) { // the game page: never cached, and stamped with its build so the client can tell if it is stale
    const html = fs.readFileSync(f, 'utf8').split('__BUILD__').join(D.build()); res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' }); return res.end(html);
  }
  const lm = new Date(Math.floor(st.mtimeMs / 1000) * 1000); // everything else: always revalidate, so new pictures and scripts show up straight away
  if (req.headers['if-modified-since'] && new Date(req.headers['if-modified-since']) >= lm) { res.writeHead(304, { 'Cache-Control': 'no-cache' }); return res.end(); }
  res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-cache', 'Last-Modified': lm.toUTCString() }); fs.createReadStream(f).pipe(res);
});
server.on('upgrade', (req, socket) => (req.url === '/ws' ? ws(req, socket) : socket.destroy()));
server.listen(PORT, HOST, () => { D.log(`MULTIVERSE MUD listening on http://${HOST}:${PORT}  (${D.rooms.size} rooms)`); D.log(`Area builder: http://localhost:${PORT}/builder.html   builder key: ${BKEY}`); bots.start(); bridge.start(); github.start(); bounty.start(); weather.start(); reports.start(); D.mail.start(); });
// ---- shutdown: saves every player, tells them, closes connections and stops the process ----
let stopTimer = null, halting = false;
function halt(why) {
  if (halting) return; halting = true; clearTimeout(stopTimer); D.log(`shutting down: ${why}`); let saved = 0, failed = 0;
  try { auction.halt(); } catch (e) { D.log('auction halt', e.message); }
  for (const p of [...D.players.values()]) { if (p.isBot) continue; try { p.msg('*** The game is shutting down. Your character has been saved. Goodbye! ***', 'hurt'); D.savePlayer(p); saved++; } catch (e) { failed++; D.log('save failed for', p.name, e.message); } }
  try { bots.save(); } catch (e) { D.log('bot save failed', e.message); }
  try { bridge.stop(); github.stop(); bounty.stop(); weather.stop(); reports.stop(); D.mail.stop(); D.deaths.flush(); } catch (e) { /* stopping anyway */ }
  D.log(`saved ${saved} player${saved === 1 ? '' : 's'}${failed ? `, ${failed} FAILED` : ''}; goodbye`);
  setTimeout(() => { for (const p of D.players.values()) try { p.conn && p.conn.close(); } catch (e) { /* closing anyway */ } try { server.close(); } catch (e) { /* closing anyway */ } setTimeout(() => process.exit(failed ? 1 : 0), 300); }, 500);
}
D.shutdown = (by, secs = 5) => { if (stopTimer || halting) return false; D.announce(`${by} is shutting the game down in ${secs} seconds. All characters are being saved.`); stopTimer = setTimeout(() => halt(`shutdown ordered by ${by}`), secs * 1000); return true; };
D.cancelShutdown = (by) => { if (!stopTimer || halting) return false; clearTimeout(stopTimer); stopTimer = null; D.announce(`${by} cancelled the shutdown. The game stays up.`); return true; };
process.on('SIGINT', () => halt('SIGINT')); process.on('SIGTERM', () => halt('SIGTERM'));
