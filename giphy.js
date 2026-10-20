'use strict';
// GIPHY gossip GIFs: "gossip ;hi" or "gossip hello there ;wave" searches GIPHY for the words after the semicolon and shows the GIF in everyone's gossip window.
const load = require('./config');
let cfg = null; const cache = new Map(), TTL = 10 * 60 * 1000;
const OK_URL = /^https:\/\/media[0-9]*\.giphy\.com\//; // only GIPHY's own media hosts are ever sent to browsers
const conf = () => (cfg = cfg || load().giphy);
const enabled = () => !!conf().apiKey;
const clean = (q) => String(q).replace(/[^\p{L}\p{N} '!?,.\-_]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 40);
function parse(text) { // "hello ;wave" -> { msg: 'hello', q: 'wave' }; no semicolon -> q null
  const i = text.indexOf(';'); if (i < 0) return { msg: text.trim(), q: null };
  return { msg: text.slice(0, i).trim(), q: clean(text.slice(i + 1)) };
}
async function search(q) { // returns { url, title } or null when nothing matched
  const c = conf(), key = q.toLowerCase(), hit = cache.get(key);
  if (hit && Date.now() - hit.t < TTL) return pick(hit.list);
  const u = `${c.apiBase}/v1/gifs/search?api_key=${encodeURIComponent(c.apiKey)}&q=${encodeURIComponent(q)}&limit=15&rating=${encodeURIComponent(c.rating)}&lang=en`;
  const r = await fetch(u, { signal: AbortSignal.timeout(5000) }); if (!r.ok) throw new Error('GIPHY HTTP ' + r.status);
  const j = await r.json(), list = (j.data || []).map((d) => ({ url: d.images && ((d.images.fixed_height || d.images.downsized || {}).url), title: String(d.title || q).slice(0, 80) })).filter((d) => d.url && OK_URL.test(d.url));
  cache.set(key, { t: Date.now(), list }); if (cache.size > 200) cache.delete(cache.keys().next().value); return pick(list);
}
const pick = (l) => (l.length ? l[Math.floor(Math.random() * l.length)] : null);
module.exports = { parse, search, enabled, cooldown: () => conf().cooldownSeconds * 1000, OK_URL };
