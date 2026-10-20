'use strict';
// Social feelings: smile, cheer, dance and friends. `smile` shows a message to the room; `smile bob` aims it at someone.
const SOC = { // verb: [third person, preposition]
  smile: ['smiles', 'at'], grin: ['grins', 'at'], laugh: ['laughs', 'at'], giggle: ['giggles', 'at'], chuckle: ['chuckles', 'at'], snicker: ['snickers', 'at'], cackle: ['cackles', 'at'], cheer: ['cheers', 'for'], clap: ['claps', 'for'], applaud: ['applauds', ''],
  dance: ['dances', 'with'], wave: ['waves', 'at'], bow: ['bows', 'to'], curtsy: ['curtsies', 'to'], nod: ['nods', 'at'], shrug: ['shrugs', 'at'], sigh: ['sighs', 'at'], wink: ['winks', 'at'], blush: ['blushes', 'at'], cry: ['cries', 'at'], hug: ['hugs', ''], pat: ['pats', ''], poke: ['pokes', ''],
  highfive: ['high-fives', ''], salute: ['salutes', ''], thank: ['thanks', ''], point: ['points', 'at'], yawn: ['yawns', 'at'], stretch: ['stretches', ''], shiver: ['shivers', ''], facepalm: ['facepalms', ''], flex: ['flexes', 'at'], whistle: ['whistles', 'at'], frown: ['frowns', 'at'], glare: ['glares', 'at'],
  groan: ['groans', 'at'], beam: ['beams', 'at'], bounce: ['bounces', ''], spin: ['spins', ''], sulk: ['sulks', ''], cheerup: ['cheers up', ''], tipover: ['tips over', ''], bonk: ['bonks', ''], hiss: ['hisses', 'at'], howl: ['howls', 'at'], gasp: ['gasps', 'at'], ponder: ['ponders', ''], celebrate: ['celebrates', 'with'], rejoice: ['rejoices', ''],
};
const SOLO = { // custom lines when no target: [you, room]
  dance: ['You dance a little jig.', '{n} dances a little jig.'], cheer: ['You cheer loudly!', '{n} cheers loudly!'], clap: ['You clap your hands.', '{n} claps their hands.'], bow: ['You bow deeply.', '{n} bows deeply.'], flex: ['You flex your muscles.', '{n} flexes their muscles.'],
  spin: ['You spin in a circle.', '{n} spins in a circle.'], cry: ['You burst into tears.', '{n} bursts into tears.'], celebrate: ['You throw your arms up in celebration!', '{n} throws their arms up in celebration!'], howl: ['You howl at the sky.', '{n} howls at the sky.'], shiver: ['You shiver.', '{n} shivers.'],
  ponder: ['You stroke your chin and ponder.', '{n} strokes their chin and ponders.'], facepalm: ['You facepalm.', '{n} facepalms.'], whistle: ['You whistle a cheerful tune.', '{n} whistles a cheerful tune.'], stretch: ['You stretch and yawn.', '{n} stretches and yawns.'], salute: ['You snap off a salute.', '{n} snaps off a salute.'],
  thank: ['You say thanks to everyone.', '{n} says thanks to everyone.'], highfive: ['You hold up a hand for a high five.', '{n} holds up a hand for a high five.'], hug: ['You hug yourself.', '{n} hugs themselves.'], pat: ['You pat yourself on the back.', '{n} pats themselves on the back.'], poke: ['You poke the air.', '{n} pokes the air.'],
};
const phr = (t, pre) => (pre ? `${t} ${pre}` : t);
const you = (v, pre) => { const base = v === 'cheerup' ? 'cheer up' : v === 'tipover' ? 'tip over' : v; return pre ? `${base} ${pre}` : base; };
// Returns true when `v` was a social verb (and handled).
function handle(p, v, a, find) {
  const s = SOC[v]; if (!s) return false; const [third, pre] = s; a = (a || '').trim();
  if (!a) { const so = SOLO[v]; p.msg(so ? so[0] : `You ${you(v, '')}.`, 'social'); p.env.tell((so ? so[1] : `{n} ${third}.`).replace('{n}', p.name), p, 'social'); return true; }
  const t = find(p.env.inv.filter((o) => o.isLiving), a);
  if (!t) { p.msg(`You don't see "${a}" here.`); return true; }
  if (t === p) { p.msg(`You ${you(v, pre)} yourself.`, 'social'); p.env.tell(`${p.name} ${phr(third, pre)} themselves.`, p, 'social'); return true; }
  const tn = t.isPlayer ? t.name : t.the();
  p.msg(`You ${you(v, pre)} ${tn}.`, 'social'); if (t.isPlayer) t.msg(`${p.name} ${phr(third, pre)} you.`, 'social'); p.env.tell(`${p.name} ${phr(third, pre)} ${tn}.`, [p, t], 'social'); return true;
}
module.exports = { SOC, handle, list: () => Object.keys(SOC).sort() };
