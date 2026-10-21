'use strict';
// Settings for the Discord bridge and the GitHub sync. Read from environment variables or data/config.json (never committed: see .gitignore).
const fs = require('fs'), path = require('path');
const FILE = path.join(__dirname, 'data', 'config.json');
const list = (v, d) => (Array.isArray(v) ? v : v ? String(v).split(',').map((x) => x.trim()).filter(Boolean) : d);
const bool = (v, d) => (v === undefined || v === '' ? d : /^(1|true|yes|on)$/i.test(String(v)));
module.exports = () => {
  let f = {}; try { f = JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch (e) { /* no file yet */ }
  const e = process.env, d = f.discord || {}, g = f.github || {};
  return {
    discord: {
      webhookUrl: e.DISCORD_WEBHOOK_URL || d.webhookUrl || '',          // MUD gossip -> Discord (a channel webhook; no bot needed)
      botToken: e.DISCORD_BOT_TOKEN || d.botToken || '',                // Discord -> MUD gossip (needs a bot in the channel)
      channelId: e.DISCORD_CHANNEL_ID || d.channelId || '',
      pollSeconds: Math.max(2, +(e.DISCORD_POLL_SECONDS || d.pollSeconds || 4)),
      announcements: bool(e.DISCORD_ANNOUNCEMENTS, bool(d.announcements, false)), // also post level-ups, contracts and death taunts
      presence: bool(e.DISCORD_PRESENCE, bool(d.presence, false)),                // also post logins and logouts
      apiBase: e.DISCORD_API_BASE || d.apiBase || 'https://discord.com/api/v10',
    },
    twitter: {
      apiKey: e.TWITTER_API_KEY || (f.twitter || {}).apiKey || '', apiSecret: e.TWITTER_API_SECRET || (f.twitter || {}).apiSecret || '',      // from developer.x.com (an app with read and write access)
      accessToken: e.TWITTER_ACCESS_TOKEN || (f.twitter || {}).accessToken || '', accessSecret: e.TWITTER_ACCESS_SECRET || (f.twitter || {}).accessSecret || '',
      events: list(e.TWITTER_EVENTS || (f.twitter || {}).events, ['legend', 'boss', 'remort', 'milestone']),     // legend, boss, remort, milestone (every 10th level), level, quest
      hashtags: list(e.TWITTER_HASHTAGS || (f.twitter || {}).hashtags, ['#game', '#Multiverse']).map((t) => '#' + String(t).replace(/^#/, '')),
      minIntervalSeconds: Math.max(5, +(e.TWITTER_MIN_SECONDS || (f.twitter || {}).minIntervalSeconds || 60)), dryRun: bool(e.TWITTER_DRY_RUN, bool((f.twitter || {}).dryRun, false)), apiBase: e.TWITTER_API_BASE || (f.twitter || {}).apiBase || 'https://api.x.com',
    },
    preTitles: { Joe: '(Administrator)', ...(f.preTitles || {}) }, // account name -> special pre-title shown before the name (register Joe first!)
    pixabay: { apiKey: e.PIXABAY_API_KEY || (f.pixabay || {}).apiKey || '' }, // used by tools/fetch_pixabay.py
    giphy: {
      apiKey: e.GIPHY_API_KEY || (f.giphy || {}).apiKey || '',          // free key from developers.giphy.com
      rating: e.GIPHY_RATING || (f.giphy || {}).rating || 'pg',         // g, pg, pg-13 or r
      cooldownSeconds: Math.max(0, +(e.GIPHY_COOLDOWN || (f.giphy || {}).cooldownSeconds || 6)),
      apiBase: e.GIPHY_API_BASE || (f.giphy || {}).apiBase || 'https://api.giphy.com',
    },
    smtp: { // outgoing email for mudmail forwarding (any SMTP service: your ISP, Gmail with an app password, Mailgun, ...)
      host: e.SMTP_HOST || (f.smtp || {}).host || '', port: +(e.SMTP_PORT || (f.smtp || {}).port || 587), secure: bool(e.SMTP_SECURE, bool((f.smtp || {}).secure, +(e.SMTP_PORT || (f.smtp || {}).port || 587) === 465)),
      user: e.SMTP_USER || (f.smtp || {}).user || '', pass: e.SMTP_PASS || (f.smtp || {}).pass || '', from: e.SMTP_FROM || (f.smtp || {}).from || '', fromName: e.SMTP_FROM_NAME || (f.smtp || {}).fromName || 'MULTIVERSE MUD', starttls: bool(e.SMTP_STARTTLS, bool((f.smtp || {}).starttls, true)),
    },
    github: {
      token: e.GITHUB_TOKEN || g.token || '',                           // fine-grained token with Contents: read and write on one repo
      repo: e.GITHUB_REPO || g.repo || '',                              // owner/name
      branch: e.GITHUB_BRANCH || g.branch || 'main',
      intervalMinutes: Math.max(1, +(e.GITHUB_SYNC_MINUTES || g.intervalMinutes || 5)),
      debounceSeconds: Math.max(2, +(e.GITHUB_DEBOUNCE_SECONDS || g.debounceSeconds || 20)),
      authorName: e.GITHUB_AUTHOR_NAME || g.authorName || 'MULTIVERSE MUD',
      authorEmail: e.GITHUB_AUTHOR_EMAIL || g.authorEmail || 'mud@users.noreply.github.com',
      apiBase: e.GITHUB_API_BASE || g.apiBase || 'https://api.github.com',
      assignee: e.GITHUB_ASSIGNEE || g.assignee || '',                  // who idea and bug reports are assigned to (default: the repository owner)
    },
  };
};
