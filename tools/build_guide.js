'use strict';
// Builds the player guide website into public/guide/. Run: node tools/build_guide.js
const fs = require('fs'), path = require('path');
const L = require('./guide_lib');
require('./guide_pages1')(L); require('./guide_pages2')(L); require('./guide_pages3')(L);
const { D, art, writeImg, ORDER, TERR, NAV, BLURB, THEME, page, h2, card, imgTag, CATALOG, OUT } = L;

for (const t of Object.keys(art.THEMES)) writeImg(`banner-${t}.svg`, art.banner(t));
for (const a of ORDER) writeImg(`area-${a}.svg`, art.landscape(a));
for (const t of TERR) writeImg(`terrain-${t}.svg`, art.terrain(t));

THEME.index = 'home';
const classes = Object.values(D.K.CLASSES), spells = Object.values(D.K.SPELLS).reduce((n, l) => n + l.length, 0);
const stat = (n, t) => `<div><b>${n}</b><span>${t}</span></div>`;
const home = `<div class="cta"><a class="p" href="/">Play now</a><a class="s" href="how-to-play.html">How to play</a></div>
<div class="stats">${stat(classes.filter((c) => !c.remort).length + '+3', 'classes')}${stat(spells, 'abilities')}${stat(CATALOG.length, 'rooms')}${stat(ORDER.length, 'areas')}${stat(Object.keys(D.W.mobs).length, 'monsters')}${stat(D.Q.QUESTS.length, 'contracts')}${stat(Object.keys(D.T.SKILLS).length, 'tradeskills')}${stat('40', 'remorts')}</div>
<p>Welcome to the <b>MULTIVERSE MUD Player's Guide</b>. MULTIVERSE MUD is a browser MUD where fantasy, sci-fi and the Old West collide: hunt monsters, run contracts across a dozen realms, craft and gather, install cyberware, and be reborn up to forty times. This guide is organised by type, so you can find what you need quickly.</p>
${NAV.map(([g, items]) => `${h2(g)}<div class="cards">${items.map(([id, t]) => card(imgTag(`banner-${THEME[id] || id}.svg`, t), t, `<p class="m">${BLURB[id]}</p>`, `${id}.html`)).join('')}</div>`).join('')}`;
L.emit('index', "Player's Guide", 'Everything a new runner needs: how to play, classes, remorting, spells, tradeskills, materials, the full map and more.', home);

for (const [id, html] of Object.entries(L.pages)) fs.writeFileSync(path.join(OUT, id + '.html'), html);
fs.copyFileSync(path.join(__dirname, 'guide_assets', 'guide.css'), path.join(OUT, 'guide.css'));
fs.copyFileSync(path.join(__dirname, 'guide_assets', 'guide.js'), path.join(OUT, 'guide.js'));
const imgs = fs.readdirSync(path.join(OUT, 'img')).length;
console.log(`guide built: ${Object.keys(L.pages).length} pages, ${imgs} images in ${path.relative(process.cwd(), OUT)}`);
process.exit(0);
