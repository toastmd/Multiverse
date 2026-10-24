'use strict';
// Spell flavor: what a spell looks like when you cast it, chosen from its NAME. Magic Missile fires glowing missiles, Fireball hurls a huge ball of fire
// that engulfs the target, and so on. Damage spells get a cast line and a hit line ({t} is the target); other spells get one line about you.
const DMG = [ // [name pattern, cast line, hit line]
  [/fan the hammer/, 'You slap the hammer back, fanning the revolver: six shots roar out at {t}!', 'The bullets stitch across {t}'],
  [/breath/, 'You draw a huge breath and exhale a torrent of dragonfire at {t}!', 'The dragonfire washes over {t} and scorches everything'],
  [/magnum opus/, 'You hurl your masterwork: a blinding blend of every reagent at {t}!', 'The magnum opus erupts around {t}'],
  [/arc welder/, 'A blinding arc of welding fire jumps from your torch to {t}!', 'The arc melts into {t} with a shower of sparks'],
  [/army of the dead/, 'Your risen dead claw out of the ground and surge toward {t}!', 'The horde swarms over {t}'],
  [/ancient fury/, 'Ancient dragon fury rises in you and bursts out toward {t}!', 'The fury smashes into {t}'],
  [/magic missile/, 'Three glowing magical missiles streak from your fingertips toward {t}!', 'The missiles slam into {t} in a burst of arcane sparks'],
  [/arcane barrage/, 'You throw both hands forward and a volley of arcane bolts hammers toward {t}!', 'The barrage pounds {t} from every side'],
  [/fireball|fire bomb|firebomb/, 'You hurl a huge ball of roaring fire at {t}!', 'The fireball explodes, engulfing {t} in a roaring blaze'],
  [/philosopher/, 'You fling a flask of liquid fire at {t}!', 'The alchemical fire splashes over {t} and will not go out'],
  [/meteor|comet|skyfall|starfall/, 'You point at the sky and a blazing meteor screams down toward {t}!', 'The meteor smashes into {t} and the ground shakes'],
  [/chain lightning/, 'Forked lightning leaps from your hand and arcs toward {t}!', 'The lightning chains through {t}, crackling and jumping'],
  [/lightning|thunder|tesla|static|spark|shock|overcharge/, 'Crackling lightning leaps from your hands toward {t}!', 'The bolt of lightning blasts {t} and leaves it smoking'],
  [/frost|blizzard|ice|freez|cryo/, 'Shards of frost howl from your hands at {t}!', 'Ice crystals hammer {t} and rime its skin with frost'],
  [/disintegrate|oblivion|annihilate|extinction|voidrot|singularity|total blackout|black spike|paradox/, 'A beam of pure nothing lances from your palm at {t}!', '{t} comes apart in a shower of glittering motes'],
  [/cataclysm|armageddon|ragnarok|devastat|ruination|worldquake|worldbreak|earthshatter|apocalypse|godslayer|twilight/, 'The sky cracks and the earth groans as you unleash ruin upon {t}!', 'The world shudders and {t} is flattened'],
  [/acid/, 'You fling a flask of acid at {t}!', 'The acid splashes over {t}, hissing and eating through everything'],
  [/poison blade|venom|plague|poison|blight|toxic/, 'You spray a hissing cloud of green venom at {t}!', 'The poison sinks into {t}, which turns green and shudders'],
  [/backstab/, 'You slip behind {t} and drive your blade into its back!', 'The knife sinks deep into {t}'],
  [/assassinate/, 'You vanish, reappear at the shoulder of {t} and strike a killing blow!', 'The blade finds the gap and {t} reels'],
  [/death blossom/, 'You spin in a whirl of knives that blossom around {t}!', 'A flower of blades opens through {t}'],
  [/eviscerate|bonesaw|scalpel|surgical|organ harvest/, 'You close on {t} with a flash of surgical steel!', 'The cut is quick and clean and {t} staggers'],
  [/night'?s end/, 'Darkness folds over {t} as you strike from the shadows!', 'The night closes over {t} and the blow lands'],
  [/slash|cleave|blade|cutlass|stab|cut\b|rend|whirlwind|thousand cuts/, 'You slash viciously at {t}!', 'The blow bites deep into {t}'],
  [/gatling|chain gun|burst|barrage/, 'You open up with a roaring gatling: a hail of bullets chews toward {t}!', 'The bullets chew into {t}'],
  [/high noon|gunfight|judgment day|last stand|quick draw|royal flush/, 'You draw faster than the eye can follow and fire at {t}!', 'The shots hit {t} dead center'],
  [/quick shot|trick shot|fan the hammer|piercing|pistol|shot\b|round/, 'You fire at {t}, the revolver bucking in your hand!', 'The bullet punches into {t}'],
  [/cannon shot|broadside|orbital cannon|cannon/, 'A cannon roars and an iron ball whistles toward {t}!', 'The cannonball crashes into {t}'],
  [/rocket|missile pod/, 'Rockets scream off your shoulder toward {t} trailing smoke!', 'The rockets detonate against {t}'],
  [/laser|beam|orbital strike/, 'A fierce beam of red laser burns across at {t}!', 'The beam cuts through {t} and leaves a glowing line'],
  [/emp pulse|system crash|logic bomb|brute force|overclock|firewall breach|chrome overload/, 'You jack in and fire a burst of hostile code at {t}!', 'Sparks spit from {t} as the code rips through it'],
  [/dynamite/, 'You light a short fuse and lob dynamite at {t}!', 'BOOM! The dynamite blows {t} off its feet'],
  [/smoke out|smoke bomb/, 'You hurl a hissing smoke canister at {t}!', 'Choking smoke boils around {t}'],
  [/corpse burst/, 'You point at a corpse and it swells and bursts toward {t}!', 'The burst sprays {t} with bone and gore'],
  [/bone spear/, 'A spear of bone grows from your fist and you hurl it at {t}!', 'The bone spear skewers {t}'],
  [/life drain|soul harvest|death touch|curse|drain/, 'Dark energy flows from your hands toward {t}!', 'You wrench the life out of {t}'],
  [/inferno|fire breath|cataclysm breath|ember|moonfire|flame|hellfire|wraithfire|abyssfire|cinder|fire|burn|rekindle/, 'Flames roar from your hands toward {t}!', 'The fire engulfs {t}'],
  [/smite|wrath of heaven|holy light|radiance|verdict|heaven/, 'Holy light blazes down from above onto {t}!', 'The radiance sears {t}'],
  [/wrath of nature|cataclysmic storm|tempest|cyclone|maelstrom|storm/, 'A raging storm whirls up around {t}!', 'Wind and lightning batter {t}'],
  [/thorn|lash|entangle|vine/, 'Thorned vines whip out of the ground toward {t}!', 'The vines lash and bind {t}'],
  [/wing buffet|tail sweep/, 'You whip your great body around at {t}!', 'The blow sweeps {t} aside'],
  [/claws|bite|pounce|savage|frenzy|apex|predator/, 'You lunge at {t} with savage claws and teeth!', 'You tear into {t}'],
  [/bone crusher|crusher|brute|bash|smash|hammer|pistol whip|keelhaul|onslaught|gauntlet/, 'You swing with crushing force at {t}!', 'The blow crunches into {t}'],
  [/vicious mockery|dissonance|lullaby|crescendo|symphony|grand finale|requiem/, 'You strike a harsh, ringing note aimed straight at {t}!', 'The sound wave slams into {t}'],
  [/spell|card flick|wild card|double down|ace in the sleeve|all in|loaded dice/, 'You flick a razor-edged card across the room at {t}!', 'The card thunks into {t}'],
  [/lasso/, 'You whirl your lasso and it snaps around {t}!', 'You yank hard and {t} crashes down'],
  [/bounty hunt|plunder/, 'You close in on {t} like a hunter on a bounty!', 'You rough up {t} and take what you can'],
  [/kraken/, 'The sea itself answers: a huge tentacle erupts out of nowhere toward {t}!', 'The tentacle crushes {t}'],
  [/afterimage|resurgence|eclipse|supernova|quasar|ascend|transcend/, 'Reborn power surges and a flare of white-hot energy leaps at {t}!', 'The flare detonates on {t}'],
];
const HEAL = [
  [/healing draught/, 'You quaff a bubbling draught and warmth spreads through you.'], [/elixir of life/, 'You drink the Elixir of Life and vigor floods through you.'],
  [/greater heal|heal\b|holy|divine intervention/, 'Soft golden light washes over you, knitting your wounds.'], [/regrowth|regenerate|rejuvenation/, 'Green shoots curl around your wounds and close them.'],
  [/repair kit|nano|nanite|suture|repair/, 'A swarm of tiny nanites crawls over your wounds and seals them.'], [/stim shot|revival protocol/, 'You jab a stim into your arm and the world sharpens.'],
  [/song of rest|requiem/, 'You hum a soothing melody and your aches fade away.'], [/grog/, 'You take a long swig of grog. Ahh.'], [/cyber|graft/, 'Chrome hums as your body repairs itself.'],
];
const SELF = [ // buffs, stealth, forms, summons
  [/overcharge/, 'Your systems whine and overload with raw power.'], [/godslayer/, 'You raise your hand: a power that has felled gods fills you.'],
  [/arcane shield|divine shield|shield|ward|barrier|sanctuary|firewall|matrix/, 'A shimmering shield of light snaps into place around you.'], [/stoneskin|barkskin|stone hide|dragonscale|skin|hide|armor/, 'Your skin hardens like stone.'],
  [/rage|berserk|blood fury|savage|fury|unstoppable/, 'Red fury floods your vision and you roar.'], [/war cry|battle hymn|hymn of valor|dragon'?s roar|yo ho ho|roar/, 'You let out a thunderous cry that rallies your spirit.'],
  [/bullet time|quicksilver|tonic|overclock|adrenal|haste|dead eye|target lock|lucky streak|outlaw's luck|bluff|jailbreak|bless/, 'The world slows and your senses sharpen.'],
  [/shadowstep|shadow dance|smoke|mist form|vanish/, 'You melt into the shadows and shift like smoke.'], [/transmute|cyber graft|philosopher/, 'Your gear shimmers as it changes.'],
  [/mecha suit/, 'Armor plating whirs and locks over you as a mecha suit.'], [/form|wyrm|beast|chimera|apotheosis|immortal|transcend|ascend|eternity|timeless/, 'Your body shifts, swells and changes into something far mightier.'],
  [/raise skeleton/, 'Bones claw up out of the ground and clatter together into a skeleton servant.'], [/raise wraith/, 'A pale wraith coils up out of the ground and bows to you.'],
  [/summon wolf|wolf pack/, 'A howl answers you: a wolf bounds out of the brush at your side.'], [/summon bear/, 'The ground shakes and a huge bear lumbers to your side.'],
  [/turret|auto-turret/, 'You slap down a turret that whirs to life.'], [/drone/, 'Drones buzz out of your pack and swarm around you.'], [/boarding party/, 'A boarding party of pirates swings in on ropes and joins you.'], [/parrot/, 'A screeching parrot dive-bombs into the fight.'], [/house enforcer/, 'A big man in a sharp suit steps out of nowhere and cracks his knuckles.'],
];
const clean = (s) => s.replace(/\s+/g, ' ');
const low = (sp) => String(sp.n || sp.k).toLowerCase();
function dmg(sp) { const n = low(sp), r = DMG.find(([re]) => re.test(n)); return r ? { cast: r[1], hit: r[2] } : { cast: `You unleash ${sp.n} at {t}!`, hit: `${sp.n} strikes {t}` }; }
function heal(sp) { const n = low(sp), r = HEAL.find(([re]) => re.test(n)); return r ? r[1] : `You cast ${sp.n}, and restoring light flows through you.`; }
function self(sp) { const n = low(sp), r = SELF.find(([re]) => re.test(n)); return r ? r[1] : `Power surges through you as you cast ${sp.n}.`; }
module.exports = { dmg, heal, self, castLine: (sp, t) => clean(dmg(sp).cast.replace(/\{t\}/g, t)), hitLine: (sp, t) => clean(dmg(sp).hit.replace(/\{t\}/g, t)) };
