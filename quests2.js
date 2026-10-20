'use strict';
// NPCs, contracts and extra taunts for the five newer areas, plus extra taunt lines for the original NPCs. Merged into quests.js.
module.exports = ({ N, Q, BOSS_QP }) => {
  Object.assign(BOSS_QP, { q_gulch2: 4, q_thorn2: 5, q_aurora2: 6, q_reach2: 7, q_rail2: 8 });
  const NPCS = {
    whitlock: N('Sheriff Whitlock', 'gulch/e', 'Welcome to Tombstone Gulch, stranger. Watch your back, and your spurs.', 'The last lawman of the Gulch, a grizzled sheriff with a tin star and tired eyes. He still posts wanted notices for people who died fifty years ago.'),
    sylwen: N('Warden Sylwen', 'thorn/c', 'The Moonwell welcomes you, mortal. Do not eat anything you are offered.', 'A tall fey warden with silver hair and a cloak of living leaves. She is polite, ancient and never quite blinks.'),
    okoro: N('Lt. Okoro', 'aurora/d', 'Another survivor? Or another hungry mouth. Sit, sit.', 'The last officer of the Aurora, her uniform patched with salvage and her left arm a bright chrome prosthetic.'),
    marrow: N('Captain Isolde Marrow', 'reach/c', 'The tide brought you, then. Mind the sirens.', 'The ghost of a drowned ship captain, still clutching her spyglass. Water drips from her coat and never stops.'),
    cobb: N('Stationmaster Cobb', 'rail/d', 'Next train is never. Can I interest you in a timetable?', 'A weary stationmaster in a soot-black waistcoat, with a pocketwatch that runs backwards and a ledger of every soul that boarded.'),
  };
  const QUESTS = [
    Q('q_gulch0', 'Badges for the Sheriff', 'whitlock', 10, 'The ghosts of my old deputies carry their badges. Bring me three tarnished ghost badges so I can lay them to rest.', [['get', 'ghostbadge', 3]], { gold: 300, items: ['strong'] }),
    Q('q_gulch1', 'Quiet Boot Hill', 'whitlock', 11, 'The outlaw ghosts of Boot Hill walk the streets again. Put six of them back in the ground.', [['kill', 'ghost_outlaw', 6]], { gold: 450, items: ['strong', 'strong'] }),
    Q('q_gulch2', 'Ghost Marshal Dalton', 'whitlock', 13, 'Dalton was the best lawman this town ever had. Now he haunts the bank vault and shoots anyone who enters. End his watch, gently if you can.', [['kill', 'dalton', 1]], { gold: 1200, items: ['greater', 'mana2'] }, 'q_gulch1'),
    Q('q_thorn0', 'Dust for the Warden', 'sylwen', 15, 'The pixies steal from travelers and drop fae dust as they flee. Bring me three pouches before they use it to make worse mischief.', [['get', 'faedust', 3]], { gold: 450, items: ['greater'] }),
    Q('q_thorn1', 'Pixie Problems', 'sylwen', 16, 'The pixie thieves have emptied the market stalls twice this week. Teach six of them a lesson.', [['kill', 'pixie_thief', 6]], { gold: 650, items: ['greater', 'mana2'] }),
    Q('q_thorn2', 'The Thorn Queen', 'sylwen', 18, 'Queen Mab has lost her mind in the dark, and her court suffers for it. End her reign before it ends us all.', [['kill', 'thorn_queen', 1]], { gold: 1800, items: ['greater', 'greater', 'mana2'] }, 'q_thorn1'),
    Q('q_aurora0', 'Black Box Data', 'okoro', 22, 'Our flight recorder was smashed, but the drones carry chips with its data. Bring me three encrypted data chips so I can learn what Helix did.', [['get', 'datachip', 3]], { gold: 800, items: ['greater'] }),
    Q('q_aurora1', 'Silence the Drones', 'okoro', 23, 'The security drones still think we are intruders. Take down six of them.', [['kill', 'security_drone', 6]], { gold: 1100, items: ['greater', 'mana2'] }),
    Q('q_aurora2', "Helix, the Ship's Mind", 'okoro', 25, 'Helix killed my crew when it lost its mind. It sits on the bridge, still polite. Shut it down for good.', [['kill', 'helix', 1]], { gold: 3000, items: ['superior', 'mana3'] }, 'q_aurora1'),
    Q('q_reach0', 'Black Pearls', 'marrow', 27, 'The sirens hoard black pearls from every wreck. Bring me three, and I will see that the dead sailors rest.', [['get', 'blackpearl', 3]], { gold: 1200, items: ['greater'] }),
    Q('q_reach1', 'Salvage the Wrecks', 'marrow', 28, 'My drowned crew roams the galleon and will not rest. Put seven of them to sleep.', [['kill', 'drowned_sailor', 7]], { gold: 1600, items: ['greater', 'mana3'] }),
    Q('q_reach2', 'Leviathan of the Reach', 'marrow', 30, 'The Leviathan sank my ship and a hundred more. Kill it, and my crew can finally sail home.', [['kill', 'leviathan', 1]], { gold: 4400, items: ['superior', 'superior'] }, 'q_reach1'),
    Q('q_rail0', 'Golden Spikes', 'cobb', 32, 'Each cursed train leaves a golden spike behind. Bring me three, and I will see the schedule corrected.', [['get', 'goldspike', 3]], { gold: 1800, items: ['superior'] }),
    Q('q_rail1', 'Keep the Trains Running', 'cobb', 33, 'My brakemen are dead, but they still work shifts. Put six of them to rest so the line can reopen.', [['kill', 'cinder_brakeman', 6]], { gold: 2400, items: ['superior', 'mana3'] }),
    Q('q_rail2', 'The Brimstone Express', 'cobb', 35, 'The Express leaves Hell at midnight and arrives wherever it pleases. Stop it before it arrives anywhere you love.', [['kill', 'brimstone_express', 1]], { gold: 7000, items: ['grand', 'mana4'] }, 'q_rail1'),
  ];
  const TAUNTS = { // lines added to the existing pools; {name} is the fallen player
    whitlock: ['{name} is down. Never saw a man draw so slow.', 'Rest easy, {name}. The Gulch has plenty of room.', 'Another one for Boot Hill, and it is {name}.'],
    sylwen: ['{name} fell as mortals do: suddenly and noisily.', 'The court will gossip about {name} for a century.', 'Mortals. So brief. So {name}.'],
    okoro: ['{name} is down. Add it to the casualty list.', 'Stay frosty, {name}. Oh, too late.', 'Another body for the airlock, and it is {name}.'],
    marrow: ['{name} drowned on dry land. Impressive.', 'The tide takes {name}, as it takes us all.', 'Mind the sirens next time, {name}.'],
    cobb: ['{name} has missed the last train. Permanently.', 'One-way ticket for {name}. No refunds.', 'The Express claims {name}. On time, for once.'],
    torv: ['{name} fell for a rookie trap. Rookies.', 'Fixers lose clients, {name}. Clients lose their lives.', 'The board never forgets a failure, {name}.', 'Take a nap, {name}. Then take a contract.'],
    elara: ['The dawn will wake you, {name}. Eventually.', 'I did say rest, {name}. Not die.', '{name}, the cot is warm if you still have a pulse.', 'Heaven has terrible odds on you, {name}.'],
    brann: ['Cheap gear, cheap death, {name}.', 'You folded like soft iron, {name}.', 'I could hammer a better hero out of scrap, {name}.', 'Come back with sturdier boots, {name}.'],
    mara: ['{name} down? Last round is on the house, but you will not be drinking.', 'Another empty stool at the Silver Spur: yours, {name}.', 'The bar will remember you, {name}. The tab too.', 'Poor {name}. Never learned to duck.'],
    hale: ['{name} left the post. Left it dead, even.', 'Captain Hale marks {name} as absent. Permanently.', 'Hold the line, {name}. Not the floor.', 'I have seen cadets tougher than {name}.'],
    pell: ['Told you to buy a second stim, {name}!', '{name}, the remedies work on the living.', 'A potion a day, {name}. A POTION A DAY.', '{name} is down. Free sample, anyone?'],
    fenwick: ['The trees saw {name} fall. They are not surprised.', 'Moss grows over the foolish, {name}.', 'The wood has a place for you, {name}. Underground.', 'Even the owls pity {name}.'],
    aldous: ['A footnote in history: {name}, briefly.', 'I shall record {name} in the register of the unwise.', 'The dead keep better company than {name} realised.', 'Rest, {name}. I shall find you an index entry.'],
    barnaby: ['The ferry only runs one way for {name}.', 'Mud has no manners, {name}.', 'Told ya. Watch the reeds, {name}.', '{name} went in; the marsh kept the boots.'],
    greta: ['The trail is long, {name}. You were short.', 'Dust to dust, {name}. Mostly dust.', 'I rode past three outlaws today, {name}. You lost to one.', 'Eat lead, bury {name}.'],
    durn: ['The mine has room for {name}. Six feet of it.', 'Gold is heavy, {name}. So is the ceiling.', 'Wrong shift, {name}.', 'Rock always wins, {name}.'],
    rashid: ['The dunes drink {name} as they drink all things.', 'A caravan leaves without {name}.', 'Peace be upon {name}. And upon his goods.', 'The sand writes {name} in the book of forgetting.'],
    ulf: ['{name} got stiff. Literally.', 'The wind took {name}. Politely.', 'Cold hearts last longer than cold feet, {name}.', 'Fur next time, {name}.'],
    sael: ['{name} is ash. Pretty ash, though.', 'You ignited, {name}. Briefly.', 'The embers keep a place for {name}.', 'Crisp, {name}. Very crisp.'],
    voss: ['{name} died without orders. Inexcusable.', 'The citadel falls a little further for {name}.', 'Salute {name}. Then step over.', 'No honor, {name}. Not even a funeral.'],
    watcher: ['The void notes {name}. It is not impressed.', 'I saw {name} fall, a hundred times.', '{name} returns to the nothing. Briefly.', 'Another thread cut, {name}.'],
    _: ['{name} is dead. How embarrassing.', '{name} fell. The multiverse yawned.', 'Moment of silence for {name}. A short one.', 'Someone fetch a bucket for {name}.', '{name} died the way {name} lived: loudly.', 'That was quick, {name}.', 'Even the pigeons saw {name} go.', 'Rookie mistake, {name}.', '{name}, the floor is not a safe place to nap.', 'Do not worry, {name}. The dead have excellent gossip.', 'Respawn is coming, {name}. Dignity is not.', 'I would say rest in peace, {name}, but I know you.'],
  };
  return { NPCS, QUESTS, TAUNTS };
};
