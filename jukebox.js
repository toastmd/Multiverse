'use strict';
// The saloon jukebox: a shared playlist of YouTube videos that players add at a jukebox in any saloon. Everybody can open the Jukebox panel anywhere and
// listen (the panel plays the list on shuffle). `jukebox`, `jukebox add <youtube link>`, `jukebox remove <number>`.
const fs = require('fs'), path = require('path'), https = require('https'), D = require('./lib');
const FILE = path.join(__dirname, 'data', 'jukebox.json'), MAX = 150, PER_PLAYER = 6;
let list = []; try { list = JSON.parse(fs.readFileSync(FILE, 'utf8')).filter((s) => /^[A-Za-z0-9_-]{11}$/.test(s.id)); } catch (e) { list = []; }
const save = () => { try { fs.mkdirSync(path.dirname(FILE), { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(list)); } catch (e) { /* not worth crashing for */ } };
const parseId = (s) => { s = String(s || '').trim(); let m = s.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/|v\/)|music\.youtube\.com\/watch\?(?:.*&)?v=)([A-Za-z0-9_-]{11})/); if (m) return m[1]; return /^[A-Za-z0-9_-]{11}$/.test(s) ? s : null; };
function info(id) { // ask YouTube's oEmbed for the title; resolves {ok:false} for a video that is private, removed or cannot be embedded, and {ok:true, title:''} if YouTube cannot be reached
  return new Promise((res) => { const req = https.get({ host: 'www.youtube.com', path: '/oembed?format=json&url=' + encodeURIComponent('https://www.youtube.com/watch?v=' + id), timeout: 5000 }, (r) => { let b = ''; r.on('data', (d) => { b += d; if (b.length > 20000) r.destroy(); }); r.on('end', () => { if (r.statusCode === 200) { try { const j = JSON.parse(b); return res({ ok: true, title: String(j.title || '').slice(0, 120), author: String(j.author_name || '').slice(0, 60) }); } catch (e) { return res({ ok: true, title: '' }); } } if ([400, 401, 403, 404].includes(r.statusCode)) return res({ ok: false }); res({ ok: true, title: '' }); }); }); req.on('timeout', () => { req.destroy(); res({ ok: true, title: '' }); }); req.on('error', () => res({ ok: true, title: '' })); });
}
const msgFor = (p, open) => ({ t: 'jukebox', open: !!open, list: list.map((s, i) => ({ n: i + 1, id: s.id, title: s.title, author: s.author, by: s.by, mine: s.by === p.name || !!p.wiz || !!p.architect })), here: !!(p.env && p.env.inv.some((o) => o.def && o.def.jukebox)) });
const push = (p, open) => { if (p.send && !p.isBot) p.send(msgFor(p, open)); };
const pushAll = () => { for (const p of D.players.values()) push(p); };
async function add(p, arg) {
  if (!p.env.inv.some((o) => o.def && o.def.jukebox)) return p.msg('Songs are added at a jukebox: find one in a saloon (the Silver Spur in Ashfall has one). You can listen from anywhere with the Jukebox window.', 'sys');
  if (D.isSilenced && D.isSilenced(p.name)) return p.msg('You have been silenced.'); const id = parseId(arg); if (!id) return p.msg('Give me a YouTube link, for example `jukebox add https://www.youtube.com/watch?v=dQw4w9WgXcQ`.', 'sys');
  if (list.some((s) => s.id === id)) return p.msg('That song is already in the jukebox.', 'sys'); if (list.length >= MAX) return p.msg('The jukebox is full (150 songs). Ask a staff member to clear some.', 'sys');
  if (list.filter((s) => s.by === p.name).length >= PER_PLAYER && !p.wiz) return p.msg(`You can have ${PER_PLAYER} songs in the jukebox at once. Remove one first (\`jukebox remove <number>\`).`, 'sys');
  if ((p.cd.juke || 0) > Date.now()) return p.msg('The jukebox is still warming up. Try again in a few seconds.', 'sys'); p.cd.juke = Date.now() + 15000; p.msg('You feed a coin into the jukebox and punch in the code...', 'sys');
  const i = await info(id); if (!i.ok) return p.msg('The jukebox rejects it: that video is private, removed or cannot be embedded.', 'hurt'); if (list.some((s) => s.id === id)) return;
  list.push({ id, title: i.title || `YouTube video ${id}`, author: i.author || '', by: p.name, at: Date.now() }); save(); pushAll(); p.msg(`Added to the jukebox: "${list[list.length - 1].title}" (${list.length} songs). It plays on shuffle in the Jukebox window.`, 'win'); if (p.env) p.env.tell(`${p.name} drops a coin in the jukebox and picks "${list[list.length - 1].title}".`, p, 'sys');
}
function remove(p, arg) {
  const n = parseInt(arg, 10), s = list[n - 1]; if (!s) return p.msg('Remove which song? Use its number from `jukebox`.', 'sys'); if (s.by !== p.name && !p.wiz && !p.architect) return p.msg('You can only remove songs you added.', 'sys');
  list.splice(n - 1, 1); save(); pushAll(); p.msg(`Removed "${s.title}" from the jukebox.`, 'win');
}
function command(p, a) {
  const m = a.trim().match(/^(\w+)\s*(.*)$/), sub = m ? m[1].toLowerCase() : '', rest = m ? m[2] : '';
  if (sub === 'add') return add(p, rest); if (sub === 'remove' || sub === 'del' || sub === 'delete') return remove(p, rest);
  if (sub === 'clear') { if (!p.wiz) return p.msg('Only administrators can clear the jukebox.', 'sys'); list = []; save(); pushAll(); return p.msg('The jukebox is empty.', 'win'); }
  push(p, true); p.msg(`JUKEBOX: ${list.length} song${list.length === 1 ? '' : 's'} on shuffle. The Jukebox window is open (tick it in the Windows menu any time).`, 'rname');
  list.slice(0, 12).forEach((s, i) => p.msg(`  ${String(i + 1).padStart(2)}. ${s.title}  (added by ${s.by})`, 'items')); if (list.length > 12) p.msg(`  ...and ${list.length - 12} more.`, 'sys');
  p.msg('Add songs at a saloon jukebox: `jukebox add <youtube link>`. Remove yours with `jukebox remove <number>`.', 'sys');
}
D.jukebox = { list: () => list, push, pushAll, command, parseId };
module.exports = D.jukebox;
