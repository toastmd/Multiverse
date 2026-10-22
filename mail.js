'use strict';
// Mudmail: private mail between players (online or not), kept in data/mail/<name>.json. Players can forward their mudmail to a personal email address:
// `mail forward on` sends a 6-digit confirmation code to the email on their profile, `mail verify <code>` turns it on, and then each new mudmail is also emailed
// (through the SMTP settings in data/config.json). Emails wait in data/mail/outbox.json and are retried, so nothing is lost while the mail server is down or not yet set up.
const fs = require('fs'), path = require('path'), crypto = require('crypto'), D = require('./lib'), smtp = require('./smtp');
const DIR = path.join(__dirname, 'data', 'mail'), OUT = path.join(DIR, 'outbox.json'), MAXBOX = 100, MAXBODY = 2000, MAXSUBJ = 60;
const clean = (s) => String(s || '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').trim(), key = (n) => String(n).toLowerCase(), cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const rd = (f, d) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { return d; } }, wr = (f, o) => { try { fs.mkdirSync(DIR, { recursive: true }); fs.writeFileSync(f, JSON.stringify(o)); } catch (e) { D.log('mail: could not save', e.message); } };
const boxes = new Map(), boxFile = (n) => path.join(DIR, key(n) + '.json'), box = (n) => { if (!boxes.has(key(n))) boxes.set(key(n), rd(boxFile(n), { inbox: [], seq: 0, block: [] })); return boxes.get(key(n)); }, saveBox = (n) => wr(boxFile(n), box(n));
let outbox = rd(OUT, []), timer = null, busy = false; const stamps = new Map(), fwdDay = new Map();
const rec = (n) => { const p = D.players.get(cap(key(n))) || [...D.players.values()].find((o) => key(o.name) === key(n)); return p || (D.fingerRec ? D.fingerRec(key(n)) : null); }; // an online player or the saved record
const exists = (n) => /^[A-Za-z]{3,12}$/.test(n) && !!rec(n);
const config = () => { try { return require('./config')().smtp || {}; } catch (e) { return {}; } }, emailOn = () => { const c = config(); return !!(c.host && c.from); };
const when = (t) => new Date(t).toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
// ---------------- email outbox ----------------
function enqueue(to, subject, text) { outbox.push({ id: crypto.randomBytes(4).toString('hex'), to, subject, text, tries: 0, next: 0 }); wr(OUT, outbox); setTimeout(flush, 200); }
async function flush() {
  if (busy || !outbox.length || !emailOn()) return; busy = true; const cfg = config();
  try { for (const m of [...outbox]) { if (m.next > Date.now()) continue; try { await smtp.send(cfg, m); outbox = outbox.filter((x) => x !== m); } catch (e) { m.tries++; m.next = Date.now() + Math.min(3600000, 60000 * 2 ** m.tries); m.err = e.message; D.log(`mail: email to ${m.to} failed (${e.message}), try ${m.tries}`); if (m.tries >= 8) outbox = outbox.filter((x) => x !== m); } } }
  finally { busy = false; wr(OUT, outbox); }
}
// ---------------- delivery ----------------
const view = (b) => b.inbox.slice().sort((x, y) => y.id - x.id); // newest first; the numbers players type are positions in this list
function sync(p) { if (!p || p.isBot || !p.send) return; const b = box(p.name), f = p.fwd || {}; p.send({ t: 'mail', unread: b.inbox.filter((m) => !m.read).length, inbox: view(b).map((m, i) => ({ n: i + 1, id: m.id, from: m.from, subj: m.subj, t: m.t, read: !!m.read })), fwd: { on: !!f.on, pending: !!f.pending, email: p.email || '' }, email: emailOn() }); }
function deliver(from, to, subj, body) {
  const b = box(to); b.seq++; const m = { id: b.seq, from, to: cap(key(to)), subj, body, t: Date.now(), read: false }; b.inbox.push(m);
  if (b.inbox.length > MAXBOX) { const i = b.inbox.findIndex((x) => x.read); b.inbox.splice(i >= 0 ? i : 0, 1); } saveBox(to);
  const p = D.players.get(cap(key(to))); if (p) { p.msg(`\u2709 New mudmail from ${from}: "${subj}". Type \`mail\` to read it.`, 'mail'); p.send({ t: 'mailnew', from, subj }); sync(p); }
  const r = rec(to); if (r && r.fwd && r.fwd.on && r.email && r.email === r.fwd.email) { // forwarding on: also email it (at most 50 a day)
    const day = new Date().toISOString().slice(0, 10) + key(to), n = (fwdDay.get(day) || 0) + 1; fwdDay.set(day, n);
    if (n <= 50) enqueue(r.email, `[MULTIVERSE MUD] ${subj} (mudmail from ${from})`, `Mudmail for ${m.to} from ${from}\nSent ${when(m.t)}\nSubject: ${subj}\n\n${body}\n\n--\nYou get this because you turned on mudmail forwarding in MULTIVERSE MUD. Type "mail forward off" in the game to stop it.`);
  }
  return m;
}
function sendFrom(p, to, subj, body) { // the mail command and the compose window
  to = clean(to).replace(/[^A-Za-z]/g, ''); subj = clean(subj).slice(0, MAXSUBJ) || '(no subject)'; body = clean(body).slice(0, MAXBODY);
  if (!to) return p.msg('Who is it for? `mail send <player> <subject> = <message>`', 'sys'); if (!exists(to)) return p.msg(`Nobody called "${to}" has played here.`, 'sys'); if (!body) return p.msg('The message is empty.', 'sys');
  const now = Date.now(), mine = (stamps.get(p.name) || []).filter((t) => now - t < 300000); if (mine.length >= 10) return p.msg('Slow down: at most 10 mudmails every 5 minutes.', 'sys');
  const target = box(to); if (target.block.includes(key(p.name))) return p.msg(`${cap(key(to))} is not accepting mudmail from you.`, 'sys'); mine.push(now); stamps.set(p.name, mine);
  deliver(p.name, to, subj, body); p.msg(`Mudmail sent to ${cap(key(to))}: "${subj}".`, 'win'); p.send({ t: 'mailsent', to: cap(key(to)) });
}
// ---------------- forwarding ----------------
function fwdStart(p) {
  if (!p.email) return p.msg('Forwarding needs your personal email: type `email you@example.com` first.', 'sys');
  const code = String(crypto.randomInt(100000, 1000000)); p.fwd = { on: false, pending: { code, email: p.email, exp: Date.now() + 1800000, tries: 0 } };
  enqueue(p.email, 'MULTIVERSE MUD: confirm mudmail forwarding', `Hello ${p.name},\n\nYour confirmation code for forwarding mudmail to this address is ${code}.\nIn the game type: mail verify ${code}\n\nIt works for 30 minutes. If you did not ask for this, ignore this email.`);
  p.msg(emailOn() ? `A confirmation code was emailed to ${p.email}. Type \`mail verify <code>\` within 30 minutes.` : `Saved. This server has no email service set up yet, so the confirmation code will be sent as soon as the administrator configures SMTP. Then type \`mail verify <code>\`.`, 'win'); sync(p);
}
function fwdVerify(p, code) {
  const f = p.fwd && p.fwd.pending; if (!f) return p.msg('Nothing to confirm: start with `mail forward on`.', 'sys'); if (Date.now() > f.exp) { p.fwd = { on: false }; return p.msg('That code expired. Type `mail forward on` for a new one.', 'sys'); }
  if (++f.tries > 5) { p.fwd = { on: false }; return p.msg('Too many wrong codes. Type `mail forward on` to start again.', 'hurt'); }
  if (String(code).trim() !== f.code) return p.msg('That code is not right.', 'hurt'); if (f.email !== p.email) { p.fwd = { on: false }; return p.msg('Your email changed since the code was sent. Start again with `mail forward on`.', 'sys'); }
  p.fwd = { on: true, email: p.email }; p.msg(`Mudmail forwarding is ON: every mudmail you get is also emailed to ${p.email}. \`mail forward off\` stops it.`, 'win'); sync(p);
}
// ---------------- the mail command ----------------
function listText(p) { const v = view(box(p.name)); p.msg(`Mudmail (${v.filter((m) => !m.read).length} unread of ${v.length}):`, 'rname'); if (!v.length) p.msg('  Your inbox is empty. `mail <player>` writes one.', 'sys'); v.slice(0, 20).forEach((m, i) => p.msg(`  ${String(i + 1).padStart(2)} ${m.read ? ' ' : '*'} ${m.from.padEnd(12)} ${m.subj}  (${when(m.t)})`, m.read ? 'sys' : 'win')); p.msg('Read: `mail read <n>`. Write: `mail <player>` (opens the compose window) or `mail send <player> <subject> = <message>`. Reply: `mail reply <n> = <message>`. Delete: `mail delete <n|read|all>`. Email forwarding: `mail forward on`. Block someone: `mail block <player>`.', 'sys'); }
function command(p, a) {
  const m = a.trim().match(/^(\S*)\s*([\s\S]*)$/), sub = (m[1] || '').toLowerCase(), arg = (m[2] || '').trim(), b = box(p.name), v = view(b), num = (s) => { const n = parseInt(s, 10); return n >= 1 && v[n - 1] ? v[n - 1] : null; };
  if (!sub || sub === 'inbox' || sub === 'list') { listText(p); p.send({ t: 'mailopen' }); return sync(p); }
  if (sub === 'read') { const x = num(arg); if (!x) return p.msg('No such mudmail. `mail` lists them.', 'sys'); x.read = true; saveBox(p.name); p.msg(`Mudmail ${arg} from ${x.from}, ${when(x.t)}`, 'rname'); p.msg(`Subject: ${x.subj}`, 'items'); for (const l of x.body.split('\n')) p.msg('  ' + l, 'text'); p.msg('`mail reply ' + arg + ' = <message>` answers it, `mail delete ' + arg + '` removes it.', 'sys'); p.send({ t: 'mailmsg', id: x.id, from: x.from, subj: x.subj, body: x.body, at: x.t }); return sync(p); }
  if (sub === 'send') { const mm = arg.match(/^(\S+)\s+([\s\S]*?)\s*=\s*([\s\S]+)$/); if (!mm) return p.msg('Usage: mail send <player> <subject> = <message>', 'sys'); return sendFrom(p, mm[1], mm[2], mm[3]); }
  if (sub === 'reply') { const mm = arg.match(/^(\d+)\s*=\s*([\s\S]+)$/), x = mm && num(mm[1]); if (!x) return p.msg('Usage: mail reply <n> = <message>', 'sys'); return sendFrom(p, x.from, /^re:/i.test(x.subj) ? x.subj : 'Re: ' + x.subj, mm[2]); }
  if (sub === 'delete' || sub === 'del' || sub === 'rm') { let gone = 0; if (/^all$/i.test(arg)) { gone = b.inbox.length; b.inbox = []; } else if (/^read$/i.test(arg)) { const n = b.inbox.length; b.inbox = b.inbox.filter((x) => !x.read); gone = n - b.inbox.length; } else { const x = num(arg); if (!x) return p.msg('Usage: mail delete <n|read|all>', 'sys'); b.inbox = b.inbox.filter((y) => y !== x); gone = 1; } saveBox(p.name); p.msg(`${gone} mudmail deleted.`, 'sys'); return sync(p); }
  if (sub === 'forward' || sub === 'fwd') {
    if (/^on$/i.test(arg)) return fwdStart(p); if (/^off$/i.test(arg)) { p.fwd = { on: false }; p.msg('Mudmail forwarding is OFF.', 'win'); return sync(p); }
    const f = p.fwd || {}; return p.msg(f.on ? `Mudmail forwarding is ON (to ${p.email}). \`mail forward off\` stops it.` : f.pending ? `Waiting for your confirmation code: \`mail verify <code>\`.` : `Mudmail forwarding is off. \`mail forward on\` emails every new mudmail to your personal email (set it with \`email you@example.com\`; you confirm it with a code).${emailOn() ? '' : ' (This server has no email service configured yet, so nothing can be sent until the administrator sets up SMTP.)'}`, 'sys');
  }
  if (sub === 'verify') return fwdVerify(p, arg);
  if (sub === 'block') { const n = key(arg); if (!/^[a-z]{3,12}$/.test(n)) return p.msg('Usage: mail block <player>', 'sys'); if (!b.block.includes(n)) b.block.push(n); saveBox(p.name); return p.msg(`${cap(n)} can no longer send you mudmail. \`mail unblock ${n}\` undoes it.`, 'sys'); }
  if (sub === 'unblock') { const n = key(arg); b.block = b.block.filter((x) => x !== n); saveBox(p.name); return p.msg(`${cap(n)} can send you mudmail again.`, 'sys'); }
  if (sub === 'compose' || sub === 'new') return p.send({ t: 'mailcompose', to: arg });
  // `mail <player>` opens the compose window; `mail <player> <subject> = <message>` sends straight away
  const mm = (sub + ' ' + arg).match(/^(\S+)\s+([\s\S]*?)\s*=\s*([\s\S]+)$/); if (mm) return sendFrom(p, mm[1], mm[2], mm[3]);
  if (!arg) { if (!exists(sub)) return p.msg(`Nobody called "${sub}" has played here. Type \`mail\` for your inbox.`, 'sys'); return p.send({ t: 'mailcompose', to: cap(key(sub)) }); }
  p.msg('Usage: mail <player> <subject> = <message>. Type `help mail` for everything.', 'sys');
}
const start = () => { timer = setInterval(flush, 60000); setTimeout(flush, 20000); }, stop = () => { clearInterval(timer); };
const purge = (n) => { boxes.delete(key(n)); try { fs.unlinkSync(boxFile(n)); } catch (e) { /* no mailbox */ } }; // used when a character is deleted
module.exports = { purge, command, sendFrom, sync, deliver, start, stop, flush, enqueue, exists, unread: (n) => box(n).inbox.filter((m) => !m.read).length, state: () => ({ outbox: outbox.length }) };
