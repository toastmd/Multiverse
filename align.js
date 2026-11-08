'use strict';
// NPC and monster alignment from their names, on a sliding scale: angelic, saintly, good, neutral, bad, evil, demonic.
// Robbers, wraiths, mummies, undead and the like are evil, demons and devils are demonic; animals, angels, Olympians, Atlanteans and bank guards are good; everything else that fights you is evil.
const D = require('./lib');
const SCALE = ['angelic', 'saintly', 'good', 'neutral', 'bad', 'evil', 'demonic'];
const RULES = [
  [6, /demon|devil|fiend|balor|\bimp\b|hellhound|succubus|incubus|abyssal|infernal|nyx\b|brimstone/i],
  [0, /angel|seraph|cherub|archon|unicorn/i],
  [1, /saint|priest|monk|cleric|healer|nurse|doctor|friar|chaplain|paladin|hestia|brigid|elder\b|lady of the lake|baldr/i],
  [5, /wraith|mummy|mummies|robber|bandit|outlaw|zombie|ghoul|skeleton|vampire|lich|necromancer|revenant|spectre|specter|ghost|banshee|draugr|undead|shade|lost soul|reaper|thief|pirate|raider|assassin|marauder|cultist|witch|hag\b|cailleach|fury|gorgon|exterminator|robot|cyborg|drone|plutonian|hel\b|loki|cronus|mordred|morgan|balor|fomorian|child of the night|night wraith|hexed|gloom|grimbold|shadowpaw|mummy/i],
  [2, /\b(rat|mouse|wolf|bear|deer|stag|dog|cat|horse|sheep|cow|pig|boar|eagle|hawk|owl|bird|duck|heron|fox|rabbit|snake|lizard|frog|toad|fish|crab|shark|dolphin|whale|seal|kelpie|raptor|pterodactyl|stegosaurus|triceratops|trike|brontosaurus|dinosaur|mammoth|saber|bat|spider|scorpion|beetle|ant|bee|wasp|crocodile|alligator|gator|puca|pixie|brownie|leprechaun|unicorn|sheep|goat|donkey|mule|ox|bull|chicken|hen|rooster|turkey|pony|centaur|nymph|satyr|olympian|zeus|hera|apollo|artemis|aphrodite|hephaestus|hermes|demeter|dionysus|ares|atlantean|atlas|bank guard|bank teller|teller|cashier|blimble|villager|farmer)\b|olympian|atlantean|bank guard|bank teller|\bguard\b of atlantis|royal guard of atlantis|odysseus|achilles|heracles|perseus|orpheus|atalanta|ragnar|lagertha|sigurd|beowulf|brynhildr|leif|cu chulainn|c\u00FA chulainn|fionn|oisin|niamh|arthur|merlin|lancelot|guinevere|galahad|percival|thor\b|odin|frigg|freya|freyr|heimdall|tyr\b|bragi|njord|dagda|lugh|nuada|aengus|manann/i],
  [3, /patron|dancer|fan|wrestler|valet|referee|announcer|manager|roller|barista|clerk|teen|moviegoer|critic|bartender|innkeeper|shopkeeper|trader|keeper|vendor|merchant|usher|mechanic|dealer|reporter|nurse|attendant|salesman|salesperson|commuter|tourist|passenger|gambler|cook|baker|lamplighter|tinker/i],
  [4, /bouncer|heel|brute|scalper|thug|brawler|berserker|giant|minotaur|cyclops|ogre|troll|chimera|goblin|kobold|orc|bruiser|enforcer|mercenary|gladiator|lunatic|drunk|jobber|valkyrie|guardian|golem|elemental|harpy|centipede/i],
];
D.alignOf = (def, isNpc) => {
  if (def.alignIdx != null) return def.alignIdx; const n = `${def.name || ''} ${(def.ids || []).join(' ')}`; let a = null;
  for (const [i, re] of RULES) if (re.test(n)) { a = i; break; }
  if (a == null) a = isNpc ? 3 : 5; // everything else that fights you is evil; a talk-to NPC with no clue in the name is neutral
  return (def.alignIdx = a);
};
D.alignName = (def, isNpc) => SCALE[D.alignOf(def, isNpc)];
D.alignVs = (p, t) => { // good players hit the evil harder, evil players hit the good harder (+5%)
  if (!t || !t.def || t.isPlayer) return 1; const a = D.alignOf(t.def, false); if (p.align === 'good' && a >= 5) return 1.05; if (p.align === 'evil' && a <= 2) return 1.05; return 1;
};
D.ALIGN_SCALE = SCALE;
module.exports = D.alignOf;
