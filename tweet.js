'use strict';
// Posts important MUD announcements (legendary finds, boss kills, remorts, level milestones) to X/Twitter with hashtags such as #game and #Multiverse.
// Uses the X API v2 (POST /2/tweets) with OAuth 1.0a user-context signing; needs your own developer keys (see README).
const crypto = require('crypto'), D = require('./lib'), load = require('./config');
let cfg = null, last = 0, timer = null, sent = 0, lastErr = ''; const queue = [];
const conf = () => (cfg = cfg || load().twitter);
const enabled = () => { const c = conf(); return !!(c.apiKey && c.apiSecret && c.accessToken && c.accessSecret); };
const KIND_TAGS = { legend: '#loot', boss: '#bossfight', remort: '#rebirth', milestone: '#levelup', level: '#levelup', quest: '#quest' };
const enc = (s) => encodeURIComponent(s).replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
function authHeader(method, url, c) { // OAuth 1.0a HMAC-SHA1 (a JSON body is not part of the signature)
  const p = { oauth_consumer_key: c.apiKey, oauth_nonce: crypto.randomBytes(16).toString('hex'), oauth_signature_method: 'HMAC-SHA1', oauth_timestamp: String(Math.floor(Date.now() / 1000)), oauth_token: c.accessToken, oauth_version: '1.0' };
  const base = [method, enc(url), enc(Object.keys(p).sort().map((k) => `${enc(k)}=${enc(p[k])}`).join('&'))].join('&');
  p.oauth_signature = crypto.createHmac('sha1', `${enc(c.apiSecret)}&${enc(c.accessSecret)}`).update(base).digest('base64');
  return 'OAuth ' + Object.keys(p).sort().map((k) => `${enc(k)}="${enc(p[k])}"`).join(', ');
}
function compose(text, kind) { // clean text + hashtags, at most 280 characters
  const tags = [...conf().hashtags, ...(KIND_TAGS[kind] ? [KIND_TAGS[kind]] : [])].filter((t, i, a) => a.indexOf(t) === i).slice(0, 4).join(' ');
  const clean = String(text).replace(/[\u2605\u{1F4E3}]/gu, '').replace(/\s+/g, ' ').trim(), room = 280 - tags.length - 1;
  return `${clean.length > room ? clean.slice(0, room - 1) + '\u2026' : clean} ${tags}`;
}
async function send(text) {
  const c = conf(), url = c.apiBase + '/2/tweets'; if (c.dryRun) return D.log('twitter (dry run):', text);
  const r = await fetch(url, { method: 'POST', headers: { Authorization: authHeader('POST', url, c), 'Content-Type': 'application/json' }, body: JSON.stringify({ text }), signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error(`X API HTTP ${r.status} ${(await r.text()).slice(0, 120)}`);
}
function pump() {
  if (timer || !queue.length) return; const wait = Math.max(0, last + conf().minIntervalSeconds * 1000 - Date.now());
  timer = setTimeout(async () => { timer = null; const t = queue.shift(); last = Date.now(); try { await send(t); sent++; lastErr = ''; } catch (e) { lastErr = e.message; D.log('twitter failed:', e.message); } pump(); }, wait);
}
function post(text, kind) { if (!enabled() || !(conf().events.includes(kind) || kind === 'test')) return; queue.push(compose(text, kind)); if (queue.length > 10) queue.shift(); pump(); }
module.exports = { post, enabled, compose, status: () => ({ configured: enabled(), events: enabled() ? conf().events : [], hashtags: enabled() ? conf().hashtags : [], sent, queued: queue.length, dryRun: enabled() && !!conf().dryRun, lastError: lastErr }) };
