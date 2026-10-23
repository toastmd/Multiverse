'use strict';
// Builds the administrator's web page (public/admin/index.html): every admin command with examples, and everything an admin can do.
// The command text comes from helpdocs.js so the page and `help <command>` never disagree.  node tools/build_admin.js
const fs = require('fs'), path = require('path'), { H } = require('../helpdocs');
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const md = (s) => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>');
const GROUPS = [
  ['Moderation: keeping the game friendly', 'Tools for dealing with trouble, from a quiet word to a permanent ban. Use the lightest one that works.', [
    ['silence', 'Ten minutes with no tells, gossips or shouts. The player can still play, fight and read, so it is a cooling-off period, not a punishment. Only works on someone who is online. Administrators and the resident bots cannot be silenced.', 'Silence Troublemaker\n> Troublemaker is silenced for 10 minutes.\n(they see: An administrator has silenced you for about 10 more minute(s): no tells, gossips or shouts.)'],
    ['unsilence', 'Ends a silence early.', 'unsilence Troublemaker\n> Troublemaker is no longer silenced.'],
    ['ban', 'Blocks an IP address from logging in, and disconnects everyone on it right now. Give a player name (their last login address is used) or an address. Refused for the local machine (127.0.0.1 / ::1, which would lock out everyone playing on the host) and for any address an Administrator is using. Bans are saved in data/bans.json and survive restarts. If the game runs behind a reverse proxy, start it with TRUST_PROXY=1 so the real visitor address (X-Forwarded-For) is used; without it every visitor looks like the proxy.', 'ban Troublemaker\n> Banned 203.0.113.9 (Troublemaker\'s address). Anyone on it is disconnected and cannot log in.\nban 198.51.100.4\n> Banned 198.51.100.4.'],
    ['bans', 'Lists every banned address with who banned it and when.', 'bans\n> Banned addresses:\n>   203.0.113.9 (Troublemaker) banned by Joe on 2026-10-21 20:54'],
    ['unban', 'Lifts a ban, by address or by the player whose address it was.', 'unban 203.0.113.9\n> Unbanned 203.0.113.9.\nunban Troublemaker'],
    ['purge', 'Permanently deletes a player\'s character (save file and mudmail), online or offline. They are disconnected and may register the name again from scratch. Refuses Administrators (take the role away first with admin remove) and yourself (use deleteme). This cannot be undone: there is no backup unless you keep one (see Backups below).', 'purge Troublemaker\n> Troublemaker has been purged: character, mudmail and all.'],
  ]],
  ['Roles: who can do what', 'There are three ranks. Players play. Architects may also use the area builder. Administrators (wizards) have everything on this page. The first account created on a brand-new server is an Administrator automatically.', [
    ['admin', 'Make someone an Administrator or remove the rank. Works for offline players. You cannot remove yourself, and there must always be at least one Administrator.', 'admin list\n> Administrators: Joe. Architects: Ben.\nadmin add ben\nadmin remove ben'],
    ['architect', 'Give or take away the builder rank (Architect). Architects get the grid area builder but none of the other admin powers.', 'architect add ben\n> Ben is now an Architect.\narchitect list'],
    ['builder', 'Shows the link and private key of the GUI area builder (also at the address printed when the server starts). Architects and Administrators only. Areas you build get a milestone automatically and can be synced to GitHub.', 'builder\n> Area builder: http://localhost:4000/builder.html   key: ********'],
  ]],
  ['World: testing and running', 'Everything for looking around the game as a builder or tester.', [
    ['goto', 'Teleports you to any room by its id (area/room). Handy for testing a boss or checking a new area.', 'goto modern/t10_c\n> (you arrive in the CEO\'s Office)\ngoto cave/throne\ngoto town/square'],
    ['clone', 'Creates any item in your pack by its id.', 'clone goldenparachute\nclone mammothsteak\nclone ironsword'],
    ['events', 'Shows the holiday calendar. As an Administrator you can also force an event on for 7 days to test it (it spawns its creatures and decorations at once): `events start halloween|thanksgiving|easter|christmas|newyear|july4|pirate|pi` (Talk Like a Pirate Day and Pi Day run one day, the rest seven), and end it with `events stop`. The calendar events turn themselves on and off by the server\'s date; a forced event is saved so it survives restarts.', 'events\nevents start easter\nevents stop'],
    ['update', 'Reloads the world data (rooms, mobs, items, quests) without restarting. Players are not disconnected.', 'update'],
    ['shutdown', 'Saves everyone and stops the server after a countdown; `shutdown cancel` stops it.', 'shutdown confirm\nshutdown cancel'],
  ]],
  ['Integrations', 'Optional services. The game runs fine with none of them; set them up in data/config.json (see below).', [
    ['discord', 'Shows whether the Discord bridge is connected.', 'discord'],
    ['github', 'Shows the GitHub sync status (builder saves, ideas and bugs).', 'github'],
    ['tweet', 'Shows the X/Twitter status; `tweet test` posts a test message.', 'tweet\ntweet test'],
  ]],
];
const extraBounty = 'bounty post  (administrators: post a bounty right now; only one bounty is ever active, so it says so if one already is)';
const rows = GROUPS.map(([title, intro, cmds]) => `<section><h2>${esc(title)}</h2><p>${md(intro)}</p>${cmds.map(([k, note, ex]) => { const d = H[k]; return `<article id="${k}"><h3><code>${esc(d ? d[0] : k)}</code></h3><p>${esc(note)}</p><pre>${esc(ex)}</pre></article>`; }).join('')}</section>`).join('\n');
const page = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>MULTIVERSE MUD Administrator Guide</title><link rel="icon" href="data:,">
<style>:root{color-scheme:dark}body{margin:0;background:#0b0a12;color:#e8e4d6;font:16px/1.55 Georgia,"Iowan Old Style",serif}header{background:linear-gradient(90deg,#3a1d0a,#0a3a2a,#0a2a4a);padding:26px 4vw;border-bottom:2px solid #ffb34766}h1{margin:0;font-size:30px;letter-spacing:.06em}header p{margin:6px 0 0;color:#cfc8b5}main{max-width:980px;margin:0 auto;padding:10px 4vw 60px}nav{display:flex;flex-wrap:wrap;gap:8px;margin:18px 0}nav a{color:#ffd9a0;border:1px solid #ffb34744;border-radius:20px;padding:3px 12px;text-decoration:none;font-size:14px}h2{margin:34px 0 6px;color:#ffb347;border-bottom:1px solid #ffffff22;padding-bottom:4px}h3{margin:0 0 4px}article{background:#14121e;border:1px solid #ffffff1c;border-left:4px solid #19e3ff;border-radius:8px;padding:12px 16px;margin:12px 0}code{background:#000a;border-radius:4px;padding:1px 6px;color:#9be7ff;font:14px ui-monospace,Menlo,monospace}pre{background:#000b;border:1px solid #ffffff18;border-radius:6px;padding:10px 12px;overflow:auto;color:#cfe8d0;font:13.5px/1.45 ui-monospace,Menlo,monospace;margin:8px 0 0}table{border-collapse:collapse;width:100%;margin:8px 0}td,th{border:1px solid #ffffff22;padding:6px 10px;text-align:left;vertical-align:top}th{background:#1b1830;color:#ffd9a0}li{margin:4px 0}.warn{border-left-color:#ff5a4a}small{color:#a8a290}a{color:#9be7ff}footer{color:#8a8576;padding:20px 4vw;text-align:center;font-size:13px}</style></head><body>
<header><h1>MULTIVERSE MUD: Administrator Guide</h1><p>Every admin command and everything an Administrator can do, with examples. Type <code>help &lt;command&gt;</code> in the game for the same text. This page is generated from the game's own help (<code>node tools/build_admin.js</code>).</p></header><main>
<nav>${GROUPS.map(([t]) => `<a href="#${t.split(':')[0].toLowerCase().replace(/\W+/g, '-')}">${esc(t.split(':')[0])}</a>`).join('')}<a href="#config">Configuration</a><a href="#ops">Running the server</a><a href="#recipes">Recipes</a><a href="#players">Player self-service</a><a href="/guide/">Player's Guide</a></nav>
<p>Admin commands only work when you are logged in as an Administrator; anyone else who types them just gets "What?". Commands are typed in the game's command line like any other. Where a player's name is needed, capitalization does not matter.</p>
${rows.replace(/<section><h2>([^<]*)<\/h2>/g, (m, t) => `<section id="${t.split(':')[0].toLowerCase().replace(/\W+/g, '-')}"><h2>${t}</h2>`)}
<section><h2>Also for administrators</h2><article><h3><code>bounty post</code></h3><p>Posts a bounty immediately. Only one bounty is active at a time (the next one appears about 30 seconds after one is collected or expires), so this says so when one is already up.</p><pre>bounty post\n> Bounty posted.</pre></article>
<article><h3><code>who</code>, <code>finger &lt;player&gt;</code>, <code>deaths</code>, <code>leaderboard</code></h3><p>Normal commands that help moderation: who is online, a player's details (class, level, email if they made it visible), the death tally with killers, and the top-10 board.</p><pre>finger troublemaker\ndeaths 30\ndeaths top</pre></article>
<article class="warn"><h3>Bug and idea reports</h3><p>Players' <code>idea</code> and <code>bug</code> commands are filed on GitHub (as markdown plus an issue assigned to the repository owner) when GitHub is configured, and queued in data/reports/ with automatic retry when it is not.</p></article></section>
<section id="config"><h2>Configuration: data/config.json</h2><p>Never synced to GitHub. Every block is optional.</p><pre>{
  "giphy":   { "apiKey": "...", "rating": "pg", "cooldownSeconds": 6 },   gossip GIFs
  "discord": { "webhookUrl": "..." },                                      MUD -> Discord
  "github":  { "token": "...", "repo": "owner/Repo", "branch": "main", "assignee": "owner" },
  "pixabay": { "apiKey": "..." },                                          art fetching tool
  "smtp":    { "host": "smtp.example.com", "port": 587, "secure": false, "user": "...", "pass": "...", "from": "mud@example.com", "fromName": "MULTIVERSE MUD" },
  "resetMinutes": 30                                                       room reset interval
}</pre><p>Environment variables: <code>PORT</code> (default 4000), <code>TRUST_PROXY=1</code> (use X-Forwarded-For for ban addresses), <code>SMTP_*</code> (override the smtp block), <code>GIPHY_API_KEY</code>, <code>GITHUB_TOKEN</code>.</p></section>
<section id="ops"><h2>Running the server</h2><table><tr><th>Task</th><th>How</th></tr>
<tr><td>Start</td><td><code>node server.js</code> (or <code>PORT=4100 node server.js</code>). No npm packages to install.</td></tr>
<tr><td>Stop safely</td><td><code>shutdown confirm</code> in the game (saves everyone), or Ctrl-C.</td></tr>
<tr><td>Where data lives</td><td><code>data/players/&lt;name&gt;.json</code> characters (password hashes inside), <code>data/mail/</code> mudmail, <code>data/deaths.json</code>, <code>data/bans.json</code>, <code>data/bots.json</code>, <code>data/reports/</code>, <code>data/config.json</code>.</td></tr>
<tr><td id="backups">Backups</td><td>Copy the <code>data/</code> folder while the server is stopped (or any time; characters save every minute). A purged or deleted character exists nowhere else.</td></tr>
<tr><td>Rebuild the Player's Guide</td><td><code>node tools/build_guide.js</code> (also includes a map of every room in each area).</td></tr>
<tr><td>Rebuild this page</td><td><code>node tools/build_admin.js</code></td></tr>
<tr><td>Check the world</td><td><code>node tools/check_world.js</code>: every room reachable, no broken exits (understands portals and the elevator).</td></tr>
<tr><td>Update room-picture lists</td><td><code>node tools/list_rooms.js</code></td></tr></table></section>
<section id="recipes"><h2>Recipes</h2>
<article><h3>A player is spamming gossip</h3><pre>silence Spammer        (10 minutes, they can still play)
silence Spammer        (again, if they come back and do it again)
ban Spammer            (if it keeps happening)</pre></article>
<article><h3>Someone keeps coming back after a ban</h3><p>The ban is by IP address. A new account from the same address still cannot log in. If they use a different network, ban that address too (<code>bans</code> shows what you have).</p></article>
<article><h3>Removing an account for good</h3><pre>purge Troublemaker     (character and mudmail gone, name free again)
ban Troublemaker       (do this BEFORE purge: the address comes from their saved record)</pre></article>
<article><h3>Handing over the keys</h3><pre>admin add ben
admin list
admin remove joe       (only works while someone else is an Administrator)</pre></article>
<article><h3>Testing a boss</h3><pre>goto modern/t10_c      the CEO's office, 4 aggressive monsters
clone goldenparachute  check the unique item
goto cave/throne       Grog the Great</pre></article></section>
<section id="players"><h2>Things players can do that you should know about</h2><table><tr><th>Command</th><th>What it does</th></tr>
<tr><td><code>deleteme</code> / <code>deleteme confirm</code></td><td>A player permanently deletes their own character (they must confirm within two minutes). The only Administrator cannot do it.</td></tr>
<tr><td><code>suicide</code> / <code>help suicide</code></td><td>Shows crisis-line information for the US, Canada, UK, Ireland, Australia, New Zealand, South Africa and elsewhere; the bottom points to <code>help deleteme</code>.</td></tr>
<tr><td><code>changeclass</code></td><td>In the Hall of Many Faces (north of the Adventurers' Guild): change class for credits. Gender changes are free.</td></tr>
<tr><td><code>mute taunts|deaths|bounties|levels|quests|weather</code></td><td>Players switch announcement channels off. Deaths and taunts are on their own channels.</td></tr>
<tr><td>Settings: Visual combat</td><td>A pop-up in the middle of the screen during fights; off shows combat messages in the main window.</td></tr></table></section>
</main><footer>MULTIVERSE MUD. Administrator Guide. Anyone can read this page, and it contains no passwords or keys.</footer></body></html>`;
fs.mkdirSync(path.join(__dirname, '..', 'public', 'admin'), { recursive: true }); fs.writeFileSync(path.join(__dirname, '..', 'public', 'admin', 'index.html'), page); console.log('admin page: public/admin/index.html,', page.length, 'bytes');
