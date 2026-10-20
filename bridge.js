'use strict';
// Discord bridge for the gossip channel.
//  MUD -> Discord: every gossip line is posted through a channel webhook (shown under the player's name).
//  Discord -> MUD: a bot polls the channel and relays human messages into gossip (needs the Message Content intent).
// Bot and webhook messages are ignored on the way in, so nothing echoes back.
const D = require('./lib');
const load = require('./config');
let cfg = null, timer = null, lastId = null, busy = false, warned = false, sending = false, lastErr = '', sent = 0, received = 0;
const queue = [], sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clean = (s, n = 1900) => String(s).replace(/@/g, '@\u200b').replace(/\s+/g, ' ').trim().slice(0, n); // no pings from the MUD
const outOn = () => !!(cfg && cfg.webhookUrl), inOn = () => !!(cfg && cfg.botToken && cfg.channelId);

async function post(payload, tries = 0) {
  const r = await fetch(cfg.webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  if (r.status === 429 && tries < 3) { const j = await r.json().catch(() => ({})); await sleep(Math.min(10, j.retry_after || 1) * 1000); return post(payload, tries + 1); }
  if (!r.ok && r.status !== 204) throw new Error('webhook HTTP ' + r.status);
}
async function drain() { // one message every ~0.6s keeps us inside Discord's webhook rate limit
  if (sending) return; sending = true;
  try { while (queue.length) { const m = queue.shift(); try { await post(m); sent++; lastErr = ''; } catch (e) { lastErr = e.message; D.log('discord out failed:', e.message); } await sleep(600); } } finally { sending = false; }
}
function out(text, who) {
  if (!outOn() || !text) return;
  const p = { content: clean(text), allowed_mentions: { parse: [] } };
  if (who) p.username = (clean(who, 60).replace(/discord|clyde/gi, 'user') + ' (MULTIVERSE MUD)').slice(0, 80); else p.username = 'MULTIVERSE MUD';
  if (queue.length > 200) queue.shift(); queue.push(p); drain();
}
async function poll() {
  if (busy) return; busy = true;
  try {
    const r = await fetch(`${cfg.apiBase}/channels/${cfg.channelId}/messages?limit=50${lastId && lastId !== '0' ? '&after=' + lastId : ''}`, { headers: { Authorization: 'Bot ' + cfg.botToken } });
    if (r.status === 429) { const j = await r.json().catch(() => ({})); await sleep(Math.min(10, j.retry_after || 2) * 1000); return; }
    if (!r.ok) { lastErr = 'channel HTTP ' + r.status; if (!warned) { D.log('discord in failed:', lastErr, '(check the bot token, channel id, and View Channel / Read Message History permissions)'); warned = true; } return; }
    const msgs = (await r.json()).sort((a, b) => (BigInt(a.id) < BigInt(b.id) ? -1 : 1));
    if (lastId === null) { lastId = msgs.length ? msgs[msgs.length - 1].id : '0'; return; } // first look: just remember where the channel is
    for (const m of msgs) {
      lastId = m.id; if ((m.author && m.author.bot) || m.webhook_id) continue;
      if (!m.content) { if (!warned) { D.log('discord in: message had no text. Enable the Message Content intent for the bot in the Discord developer portal.'); warned = true; } continue; }
      const name = (m.member && m.member.nick) || (m.author && (m.author.global_name || m.author.username)) || 'someone';
      D.gossip(`[Discord] ${clean(name, 32)}: ${clean(m.content, 300)}`, { source: 'discord' }); received++;
    }
    lastErr = '';
  } catch (e) { lastErr = e.message; } finally { busy = false; }
}
function start() {
  cfg = load().discord; if (!outOn() && !inOn()) return D.log('discord bridge: not configured (set DISCORD_WEBHOOK_URL, and DISCORD_BOT_TOKEN + DISCORD_CHANNEL_ID for two-way)');
  D.log(`discord bridge: MUD -> Discord ${outOn() ? 'on' : 'off'}, Discord -> MUD ${inOn() ? 'on' : 'off'}${cfg.announcements ? ', announcements on' : ''}${cfg.presence ? ', logins on' : ''}`);
  if (inOn()) { poll(); timer = setInterval(poll, cfg.pollSeconds * 1000); }
}
const status = () => ({ configured: outOn() || inOn(), out: outOn(), in: inOn(), announcements: !!(cfg && cfg.announcements), presence: !!(cfg && cfg.presence), sent, received, queued: queue.length, lastError: lastErr });
const stop = () => { clearInterval(timer); };
module.exports = { start, stop, out, status, wantsAnnouncements: () => !!(cfg && cfg.announcements && outOn()), wantsPresence: () => !!(cfg && cfg.presence && outOn()) };
