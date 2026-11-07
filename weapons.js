'use strict';
// Weapon types, one- and two-handed weapons, weapon skills (1-100, kept through remorts) and dual wielding.
const D = require('./lib');
const TYPES = { sword: 'Swords', club: 'Clubs', blowgun: 'Blowguns', firearm: 'Firearms', energy: 'Energy weapons', axe: 'Axes', unarmed: 'Unarmed (knuckles)', trident: 'Tridents', staff: 'Staves', spear: 'Spears', polearm: 'Polearms', flail: 'Flails', bow: 'Bows', crossbow: 'Crossbows', explosive: 'Explosives', hammer: 'Hammers', mace: 'Maces', dagger: 'Daggers', shuriken: 'Shuriken', sling: 'Slings', boomerang: 'Boomerangs', wand: 'Wands', shield: 'Shields' };
const BASE = { dagger: 0.9, shuriken: 0.85, blowgun: 0.9, sling: 0.95, wand: 0.9, unarmed: 0.85, club: 1, sword: 1, axe: 1.05, mace: 1.05, hammer: 1.1, flail: 1.05, spear: 1.05, trident: 1.05, staff: 1, polearm: 1.1, bow: 1.1, crossbow: 1.15, firearm: 1.1, energy: 1.15, explosive: 1.25, boomerang: 0.95 }; // the base damage of each weapon class
const RULES = [[/shuriken|throwing star/, 'shuriken'], [/boomerang/, 'boomerang'], [/crossbow/, 'crossbow'], [/blowgun|blow gun/, 'blowgun'], [/\bsling\b/, 'sling'], [/longbow|shortbow|\bbow\b/, 'bow'], [/trident/, 'trident'], [/halberd|glaive|\bpike\b|poleaxe|pole-axe|naginata|bardiche|scythe|voulge/, 'polearm'], [/spear|javelin|harpoon|\blance\b/, 'spear'], [/flail|morning ?star|nunchaku/, 'flail'], [/\bmace\b|scepter/, 'mace'], [/hammer|maul\b|sledge|mallet|gavel/, 'hammer'], [/\baxe\b|hatchet|tomahawk|pickaxe|\bhoe\b/, 'axe'], [/knuckle|brass |cestus|gauntlet|\bfist\b/, 'unarmed'], [/grenade|bomb|dynamite|explosive|petard/, 'explosive'], [/laser|plasma|energy|beam|blaster|pulse|disintegrat|cryo|zero-point|\bion\b|photon|phaser|\bray\b|tesla/, 'energy'], [/\bgun\b|pistol|revolver|rifle|shotgun|carbine|musket|cannon|derringer|blunderbuss|gatling|launcher|rocket|firearm|\bcolt\b|winchester/, 'firearm'], [/dagger|knife|dirk|stiletto|scalpel|shiv|kukri|kunai|bowie|razor|switchblade|bone saw|\bsaw\b/, 'dagger'], [/sword|blade|sabre|saber|rapier|cutlass|katana|scimitar|claymore|foil|machete|cleaver/, 'sword'], [/staff|quarterstaff|\bcane\b|crook/, 'staff'], [/\bwand\b|\brod\b/, 'wand']];
const TWO = /two-handed|greatsword|great ?axe|claymore|\bmaul\b|sledge|halberd|glaive|\bpike\b|poleaxe|scythe|naginata|quarterstaff|crossbow|longbow|\bbow\b|rifle|shotgun|carbine|musket|cannon|gatling|launcher|disintegrator|barbell|\blance\b|battle ?axe|war ?hammer|great ?hammer|\bstaff\b|giant|colossal/;
const nm = (d) => `${d.name || ''} ${(d.ids || []).join(' ')}`.toLowerCase();
D.WTYPES = TYPES;
D.wtype = (x) => { const d = x && x.def ? x.def : x; if (!d) return null; if (d.wtype) return d.wtype; if (d.slot === 'shield') return (d.wtype = 'shield'); if (d.type !== 'weapon') return null; const n = nm(d), r = RULES.find(([re]) => re.test(n)); return (d.wtype = r ? r[1] : 'club'); };
D.hands = (x) => { const d = x && x.def ? x.def : x; if (!d || d.type !== 'weapon') return 0; if (d.hands) return d.hands; const t = D.wtype(d); return (d.hands = TWO.test(nm(d)) || ['polearm', 'staff', 'bow', 'crossbow'].includes(t) ? 2 : 1); };
const wneed = (l) => Math.round(8 + 2.2 * l); // hits to go from level l to l+1
D.wlvl = (p, t) => ((p.wskill && p.wskill[t]) || { lvl: 1 }).lvl;
D.wxp = (p, t, n = 1) => { if (!p.isPlayer || !TYPES[t]) return; p.wskill = p.wskill || {}; const k = (p.wskill[t] = p.wskill[t] || { lvl: 1, xp: 0 }); if (k.lvl >= 100) return; k.xp += n; while (k.lvl < 100 && k.xp >= wneed(k.lvl)) { k.xp -= wneed(k.lvl); k.lvl++; p.msg(`*** Your ${TYPES[t]} skill rises to level ${k.lvl}! ***`, 'skillup'); if (p.send) p.send({ t: 'sound', k: 'skill' }); } };
D.wskillMod = (p, t) => 1 + 0.006 * (D.wlvl(p, t) - 1); // +0.6% damage per skill level: x1.59 at level 100
D.wmod = (p, item, hand) => { const t = item ? D.wtype(item) : 'unarmed', b = BASE[t] || 1, two = item && D.hands(item) === 2 ? 1.15 : 1, off = hand === 'off' && !D.brawn(p) ? 0.8 : 1; return b * D.wskillMod(p, t) * two * off; };
D.wskillHit = (p, hand) => { const it = hand === 'off' ? p.equip.offhand : p.equip.weapon, t = it ? D.wtype(it) : 'unarmed'; D.wxp(p, t, 1); if (it && t === 'explosive' && Math.random() < 0.08) { for (const [s, i] of Object.entries(p.equip)) if (i === it) delete p.equip[s]; p.msg(`That was the last of your ${it.name}: it is used up!`, 'sys'); it.destroy(); } };
D.equipAc = (p) => Object.entries(p.equip).reduce((a, [s, i]) => a + (i.ac || 0) * (s === 'shield' ? D.wskillMod(p, 'shield') : 1), 0) + (D.mountAc ? D.mountAc(p) : 0);
D.fixHands = (p, quiet) => { // a two-handed weapon leaves no hand for a shield, or (except for Juggernauts and Titans) a second weapon
  const w = p.equip.weapon, two = w && D.hands(w) === 2, brawn = D.brawn(p), moved = [];
  if (two && p.equip.shield) { moved.push(p.equip.shield); delete p.equip.shield; }
  if (p.equip.offhand && (!w || (!brawn && (two || D.hands(p.equip.offhand) === 2)))) { moved.push(p.equip.offhand); delete p.equip.offhand; }
  if (moved.length && !quiet) p.msg(`Your hands are full: ${moved.map((i) => i.short).join(' and ')} went back in your pack.`, 'sys');
};
D.weaponSkills = (p) => { p.msg('WEAPON SKILLS (1 to 100: +0.6% damage per level; they never reset, even when you remort)', 'rname'); for (const t of Object.keys(TYPES)) { const k = (p.wskill && p.wskill[t]) || { lvl: 1, xp: 0 }, n = k.lvl >= 100 ? '' : `  (${k.xp}/${wneed(k.lvl)} to next)`; p.msg(`  ${TYPES[t].padEnd(20)} level ${String(k.lvl).padStart(3)}${n}`, k.lvl > 1 ? 'items' : 'sys'); } };
module.exports = { TYPES, BASE, commands: (find) => ({
  wield(p, a) {
    const arg = a.trim(); const m = arg.match(/^(.+?)\s+(?:in\s+)?(?:the\s+)?(off-?hand|left|second)$/i); if (m) return module.exports.commands(find).dual(p, m[1]);
    const it = find(p.inv, arg); if (!it || it.type !== 'weapon') return p.msg('You cannot wield that.'); if (it.def.lvl > p.level) return p.msg(`You need level ${it.def.lvl} to wield that.`);
    if (p.equip.offhand === it) delete p.equip.offhand; p.equip.weapon = it; const two = D.hands(it) === 2; D.fixHands(p, false); p.recalc();
    p.msg(`You wield ${it.short}${two ? ' in both hands' : ''}. (${TYPES[D.wtype(it)]}: your skill is ${D.wlvl(p, D.wtype(it))}${p.equip.offhand ? '; dual wielding' : ''})`);
  },
  dual(p, a) { // dual <weapon>: a second weapon in the other hand (an extra attack every round)
    const it = find(p.inv, a.trim()); if (!it || it.type !== 'weapon') return p.msg('Dual wield what? (a weapon in your pack: `dual <weapon>`)'); if (it.def.lvl > p.level) return p.msg(`You need level ${it.def.lvl} to wield that.`);
    if (!p.equip.weapon) return p.msg('Wield a main weapon first, then `dual <second weapon>`.'); if (p.equip.weapon === it) return p.msg('That is already your main weapon.');
    const brawn = D.brawn(p); if (!brawn && D.hands(it) === 2) return p.msg('A two-handed weapon takes both hands: only Juggernauts and Titans can dual wield them.'); if (!brawn && D.hands(p.equip.weapon) === 2) return p.msg('Your main weapon needs both hands. Wield a one-handed weapon first.');
    delete p.equip.shield; p.equip.offhand = it; p.msg(`You also wield ${it.short} in your off-hand: an extra attack every round (off-hand blows do ${brawn ? 'full' : '80%'} damage).`, 'win');
  },
  wear(p, a) {
    const it = find(p.inv, a); if (!it || it.type !== 'armor') return p.msg('You cannot wear that.'); if (it.def.lvl > p.level) return p.msg(`You need level ${it.def.lvl} to wear that.`);
    if (it.slot === 'shield') { if (p.equip.weapon && D.hands(p.equip.weapon) === 2) return p.msg('Your weapon needs both hands. Wield a one-handed weapon to use a shield.'); if (p.equip.offhand) { p.msg(`You put away ${p.equip.offhand.short} to hold the shield.`, 'sys'); delete p.equip.offhand; } }
    p.equip[it.slot] = it; p.recalc(); p.msg(`You wear ${it.short}.`);
  },
  remove(p, a) { const e = Object.entries(p.equip).find(([, i]) => i.isId(a || '')); if (!e) return p.msg('You are not using that.'); delete p.equip[e[0]]; if (e[0] === 'weapon') D.fixHands(p, true); p.recalc(); p.msg(`You remove ${e[1].short}.`); },
  weaponskills(p) { D.weaponSkills(p); },
}) };
D.cleanWskill = (raw) => { const out = {}; for (const t of Object.keys(TYPES)) { const k = raw && raw[t]; if (k && typeof k === 'object') out[t] = { lvl: Math.max(1, Math.min(100, k.lvl | 0)), xp: Math.max(0, k.xp | 0) }; } return out; };
