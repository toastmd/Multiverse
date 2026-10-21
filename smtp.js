'use strict';
// A small SMTP client with no dependencies (used to forward mudmail and send confirmation codes). Supports implicit TLS (port 465), STARTTLS (port 587),
// plain servers (for testing), AUTH PLAIN/LOGIN, and UTF-8 messages. Configure it in data/config.json: "smtp": { host, port, secure, user, pass, from }.
const net = require('net'), tls = require('tls'), crypto = require('crypto');
class Talk { // reads SMTP replies (possibly multi-line) from a socket
  constructor(sock) { this.s = sock; this.buf = ''; this.replies = []; this.waiters = []; sock.on('data', (d) => { this.buf += d.toString('utf8'); this.pump(); }); sock.on('error', (e) => this.fail(e)); sock.on('close', () => this.fail(new Error('connection closed'))); }
  fail(e) { this.dead = e; for (const w of this.waiters.splice(0)) w.rej(e); }
  pump() { let nl; this.cur = this.cur || []; while ((nl = this.buf.indexOf('\n')) >= 0) { const line = this.buf.slice(0, nl).replace(/\r$/, ''); this.buf = this.buf.slice(nl + 1); this.cur.push(line); if (/^\d{3}( |$)/.test(line)) { this.replies.push({ code: +line.slice(0, 3), text: this.cur.join('\n') }); this.cur = []; } } while (this.waiters.length && this.replies.length) this.waiters.shift().res(this.replies.shift()); }
  read() { if (this.replies.length) return Promise.resolve(this.replies.shift()); if (this.dead) return Promise.reject(this.dead); return new Promise((res, rej) => this.waiters.push({ res, rej })); }
  async cmd(line, ok) { if (line !== null) this.s.write(line + '\r\n'); const r = await this.read(); if (!ok.includes(r.code)) throw new Error(`SMTP ${r.code}: ${r.text.split('\n').pop().slice(0, 120)}`); return r; }
}
const connect = (cfg) => new Promise((res, rej) => { const s = cfg.secure ? tls.connect({ host: cfg.host, port: cfg.port, servername: cfg.host }) : net.connect({ host: cfg.host, port: cfg.port }); s.setTimeout(25000, () => { s.destroy(); rej(new Error('SMTP timeout')); }); s.once('error', rej); s.once(cfg.secure ? 'secureConnect' : 'connect', () => { s.removeListener('error', rej); res(s); }); });
const b64 = (s) => Buffer.from(s, 'utf8').toString('base64'), wrap = (s) => s.replace(/(.{76})/g, '$1\r\n');
const head = (s) => (/^[\x20-\x7e]*$/.test(s) ? s : `=?UTF-8?B?${b64(s)}?=`);
function build(cfg, { to, subject, text }) { // a UTF-8 text message, body base64 so any character survives
  const id = crypto.randomBytes(8).toString('hex'), dom = (String(cfg.from).split('@')[1] || 'localhost').replace(/[^\w.-]/g, '');
  return [`Date: ${new Date().toUTCString()}`, `From: ${cfg.fromName ? `${head(cfg.fromName)} <${cfg.from}>` : cfg.from}`, `To: ${to}`, `Subject: ${head(String(subject).replace(/[\r\n]+/g, ' ').slice(0, 200))}`, `Message-ID: <${id}@${dom}>`, 'MIME-Version: 1.0', 'Content-Type: text/plain; charset=utf-8', 'Content-Transfer-Encoding: base64', '', wrap(b64(text))].join('\r\n');
}
async function send(cfg, msg) { // resolves when the server accepts the message
  if (!cfg || !cfg.host || !cfg.from) throw new Error('email is not configured on this server');
  let sock = await connect(cfg), t = new Talk(sock); const host = 'multiverse.local';
  try {
    await t.cmd(null, [220]); let ehlo = await t.cmd(`EHLO ${host}`, [250]);
    if (!cfg.secure && /STARTTLS/i.test(ehlo.text) && cfg.starttls !== false) { await t.cmd('STARTTLS', [220]); const up = tls.connect({ socket: sock, servername: cfg.host }); await new Promise((res, rej) => { up.once('secureConnect', res); up.once('error', rej); }); sock = up; t = new Talk(sock); ehlo = await t.cmd(`EHLO ${host}`, [250]); }
    if (cfg.user) { if (/AUTH[^\n]*PLAIN/i.test(ehlo.text)) await t.cmd('AUTH PLAIN ' + b64(`\0${cfg.user}\0${cfg.pass}`), [235]); else { await t.cmd('AUTH LOGIN', [334]); await t.cmd(b64(cfg.user), [334]); await t.cmd(b64(cfg.pass), [235]); } }
    await t.cmd(`MAIL FROM:<${cfg.from}>`, [250]); await t.cmd(`RCPT TO:<${msg.to}>`, [250, 251]); await t.cmd('DATA', [354]);
    const body = build(cfg, msg).replace(/^\./gm, '..'); await t.cmd(body + '\r\n.', [250]); try { await t.cmd('QUIT', [221]); } catch (e) { /* closing anyway */ }
  } finally { sock.destroy(); }
}
module.exports = { send, build };
