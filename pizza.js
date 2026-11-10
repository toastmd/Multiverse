'use strict';
// Pizza Palace (modern realm; levels 10-16, 15 rooms in a 5 x 3 grid): a full pizza restaurant with a dining room, order counter, soda fountain and sides bar, arcade, kitchen, prep station, brick oven, pantry,
// delivery garage, back alley and a customer to deliver to. Buy pizzas, sodas and sides (they restore health and mana), and do the quest from Chef Luigi: `make pizza`, `bake`, `deliver`.
const D = require('./lib');
const PIZZAS = [['pz_cheese', 'cheese pizza', 220, 30], ['pz_pepperoni', 'pepperoni pizza', 260, 36], ['pz_supreme', 'supreme pizza', 330, 48], ['pz_hawaiian', 'Hawaiian pizza', 280, 42], ['pz_veggie', 'garden veggie pizza', 240, 34], ['pz_meat', 'meat lovers pizza', 380, 56], ['pz_margherita', 'margherita pizza', 250, 38]];
const SODAS = [['pz_cola', 'cola', 90, 8], ['pz_limesoda', 'lemon-lime soda', 90, 8], ['pz_rootbeer', 'root beer', 100, 9], ['pz_orange', 'orange soda', 90, 8], ['pz_icedtea', 'iced tea', 80, 7]];
const SIDES = [['pz_knots', 'garlic knots', 140, 14], ['pz_sticks', 'cheesy breadsticks', 150, 15], ['pz_wings', 'buffalo wings', 190, 22], ['pz_salad', 'caesar salad', 130, 14], ['pz_fries', 'cheesy fries', 170, 18], ['pz_cannoli', 'cannoli', 160, 17]];
module.exports = (items, mobs, rooms) => {
  const { item, gear, mob } = require('./gen')(items, mobs);
  for (const [id, name, heal, value] of [...PIZZAS, ...SODAS, ...SIDES]) item(id, name, 'potion', { heal, mana: heal, value, long: `${name.replace(/^./, (c) => c.toUpperCase())}, hot and fresh from the Pizza Palace. It restores health and mana.` });
  item('pz_dough', 'ball of pizza dough', 'treasure', { value: 3, long: 'A soft ball of pizza dough in a plastic wrap. Ingredient: `make pizza` at the prep station.' }); item('pz_sauce', 'jar of tomato sauce', 'treasure', { value: 3, long: 'A jar of Pizza Palace tomato sauce. Ingredient: `make pizza`.' }); item('pz_cheese_bag', 'bag of mozzarella', 'treasure', { value: 3, long: 'A bag of shredded mozzarella. Ingredient: `make pizza`.' });
  item('pz_raw', 'raw pizza', 'treasure', { value: 5, long: 'A raw pizza on a wooden peel: dough, sauce and cheese. Put it in the brick oven: `bake`.' }); item('pz_hot', 'hot boxed pizza', 'treasure', { value: 10, long: 'A hot, golden pizza in a Pizza Palace box. Deliver it to the customer (`deliver`), and quickly.' });
  gear('pz_chefhat', 'tall chef hat', 'head', 10, 900, 'A tall, floppy white chef hat with a tomato stain.'); gear('pz_cutter', 'giant pizza cutter', 'weapon', 12, 1400, 'A wheel-bladed pizza cutter the size of a hand axe. It cuts everything into eight slices.'); gear('pz_apron', 'greasy pizza apron', 'body', 11, 1100, 'An apron with so many stains it has its own history.');
  const R = (id, name, icon, lv, ids, drops, o = {}) => mob(id, name, icon, lv, { ids, drops: [['pz_cheese', 0.2], ['pz_cola', 0.2], ...drops], aggro: false, ...o });
  R('alley_rat', 'alley rat', '\u{1F400}', 10, ['rat', 'alley'], [['pz_knots', 0.15]]); R('trash_raccoon', 'dumpster raccoon', '\u{1F99D}', 11, ['raccoon', 'dumpster'], [['pz_fries', 0.2]]); R('pz_customer', 'angry customer', '\u{1F620}', 12, ['customer', 'angry'], [['pz_pepperoni', 0.2], ['pz_apron', 0.05]]);
  R('rival_thug', 'rival pizzeria thug', '\u{1F9B9}', 14, ['thug', 'rival'], [['pz_cutter', 0.06], ['pz_supreme', 0.15]]); R('pz_inspector', 'health inspector', '\u{1F4CB}', 13, ['inspector', 'health'], [['pz_chefhat', 0.08], ['pz_salad', 0.2]], { big: 1.2, x: { guard: true } });
  mob('pizza_baron', 'Don Calzone, the Rival Pizza Baron', '\u{1F355}', 16, { boss: 1, big: 1.6, ids: ['don', 'calzone', 'baron', 'rival'], drops: [['pz_meat', 0.95], ['pz_chefhat', 0.5], ['pz_cutter', 0.4]] });
  const shop = (...ids) => ({ safe: true, shop: { stock: ids } });
  require('./gridgen')(rooms, { area: 'pizza', cols: 5, rows: 3, z: 260, indoor: true, zones: [[99, 'Pizza Palace', 'concrete', ['alley_rat'], ['Greasy'], ['Corner'], 'A corner of the Pizza Palace.']], specials: {
    '0_0': ['Pizza Palace Entrance', 'A red-and-white checkered doorway under a giant neon pizza slice that buzzes on and off. The smell of baking dough, garlic and melting cheese hits you like a hug. Maria, the host, waves you toward a table. A safe place.', { safe: true, camp: true }],
    '1_0': ['Dining Room', 'A cheerful dining room of checkered tablecloths, candles in wine bottles, red vinyl booths and a mural of a very happy tomato. Families and teenagers eat and shout. A safe place to rest.', { safe: true, camp: true }],
    '2_0': ['Order Counter', 'A glass counter of steaming pizzas under heat lamps, with a huge menu board and Tony the cashier ringing up orders at lightning speed. `list`, `buy <number>`: pizzas, sodas and sides. A safe place.', shop(...PIZZAS.map((x) => x[0]), ...SODAS.slice(0, 2).map((x) => x[0]), 'pz_knots', 'pz_sticks').shop && { safe: true, shop: { stock: [...PIZZAS.map((x) => x[0]), 'pz_cola', 'pz_limesoda', 'pz_knots', 'pz_sticks'] } }],
    '3_0': ['Soda Fountain and Sides Bar', 'A chrome soda fountain with six flavors, a cooler of iced tea and a warm case of wings, salad, cheesy fries and cannoli. `list`, `buy <number>`. A safe place.', { safe: true, shop: { stock: [...SODAS.map((x) => x[0]), ...SIDES.map((x) => x[0])] } }],
    '4_0': ['Arcade Corner', 'A corner of flashing arcade cabinets, a claw machine full of plush slices and a ticket counter with a very small prize shelf. Teenagers shout at screens.', {}, ['pz_customer', 'pz_customer']],
    '0_1': ['Birthday Party Room', 'A room of balloons, a banner reading HAPPY BIRTHDAY SOMEBODY, an overturned cake and a giant animatronic slice of pizza that is not supposed to be moving.', {}, ['pz_customer', 'rival_thug']],
    '1_1': ['Kitchen Pass', 'The busy hub of the kitchen: a steel pass-through with tickets on a rail, a clock, a bell, and Chef Luigi in a tall hat, shouting happily in two languages. A safe place.', { safe: true }],
    '2_1': ['Prep Station', 'A stainless steel prep table with a flour-dusted board, a rolling pin, ladles of sauce and bins of toppings. This is where pizza begins: `make pizza` (you need a ball of dough, a jar of sauce and a bag of mozzarella from the pantry).', { safe: true, prep: true }],
    '3_1': ['Brick Oven Room', 'A hot, roaring room around a huge domed brick oven with a wood fire in its mouth. A long wooden peel leans against the wall. `bake` puts a raw pizza in the oven. A safe place.', { safe: true, oven: true }],
    '4_1': ['Walk-in Pantry', 'A cold walk-in pantry of cans, sacks of flour and shelves of ingredients. A clipboard says: DOUGH, SAUCE, CHEESE: THREE CREDITS EACH. `list`, `buy <number>`. A safe place.', { safe: true, shop: { stock: ['pz_dough', 'pz_sauce', 'pz_cheese_bag'] } }],
    '0_2': ['Delivery Garage', 'A cramped garage of dented delivery scooters, stacks of flat pizza boxes and Dave the delivery driver, who is always going or just back. A safe place.', { safe: true }],
    '1_2': ['Back Alley', 'A narrow brick alley behind the Pizza Palace, with dumpsters, grease traps and a lot of eyes watching you from the dark.', {}, ['alley_rat', 'alley_rat', 'trash_raccoon']],
    '2_2': ['Dumpster Row', 'A long row of reeking dumpsters. Something big is going through one of them. It looks up.', {}, ['trash_raccoon', 'trash_raccoon', 'alley_rat']],
    '3_2': ["Manager's Office", 'A cramped office of paperwork, rule books and a window onto the kitchen. A man in a sharp suit with a clipboard writes up every violation he can find, and behind the desk, in a pinstripe suit and a fedora, sits Don Calzone, the owner of the rival pizzeria across town, who has come to take over the Palace.', {}, ['pizza_baron', 'pz_inspector']],
    '4_2': ['Delivery Address: 42 Elm Street', 'A small, cluttered apartment, where Hungry Harold, in a bathrobe, has been waiting an hour for a pizza and is starting to wonder if he dreamed ordering. `deliver` hands over a hot boxed pizza. A safe place.', { safe: true, deliver: true }],
  } });
  return { post: () => {} };
};
const have = (p, id) => D.itemCount(p, id);
D.pizza = {
  make(p, a) {
    if (!/^pizza\b/i.test(a.trim()) && a.trim()) return p.msg('Make what? `make pizza` at the prep station.', 'sys'); if (!p.env.def.prep) return p.msg('You need the prep station in the Pizza Palace kitchen.', 'sys');
    if (have(p, 'pz_dough') < 1 || have(p, 'pz_sauce') < 1 || have(p, 'pz_cheese_bag') < 1) return p.msg('You need a ball of dough, a jar of tomato sauce and a bag of mozzarella: buy them at the Walk-in Pantry.', 'sys');
    D.itemTake(p, 'pz_dough', 1); D.itemTake(p, 'pz_sauce', 1); D.itemTake(p, 'pz_cheese_bag', 1); D.give(p, 'pz_raw', 'normal'); p.msg('You spin the dough, ladle the sauce in a perfect spiral and bury it in mozzarella: a raw pizza! Take it to the Brick Oven Room and `bake`.', 'win'); p.env.tell(`${p.name} tosses a pizza into the air.`, p, 'sys'); D.qEvent(p, 'do', 'make_pizza');
  },
  bake(p) {
    if (!p.env.def.oven) return p.msg('You need the brick oven in the Pizza Palace: the Brick Oven Room.', 'sys'); if (have(p, 'pz_raw') < 1) return p.msg('You have no raw pizza to bake. (`make pizza` at the prep station.)', 'sys'); if (p.baking) return p.msg('Your pizza is already in the oven.', 'sys');
    D.itemTake(p, 'pz_raw', 1); p.baking = true; p.msg('You slide the pizza into the roaring brick oven on the long peel. It needs about fifteen seconds...', 'sys');
    setTimeout(() => { p.baking = false; if (p.gone) return; D.give(p, 'pz_hot', 'normal'); p.msg('*** DING! *** The crust is golden, the cheese is bubbling and the pizza is perfect. You slide it into a box. Deliver it to Hungry Harold at 42 Elm Street (`deliver` when you get there), while it is still hot!', 'win'); D.qEvent(p, 'do', 'bake_pizza'); }, 15000);
  },
  deliver(p) {
    if (!p.env.def.deliver) return p.msg('Deliver it to the customer: Hungry Harold, at the end of the Pizza Palace (Delivery Address: 42 Elm Street).', 'sys'); if (have(p, 'pz_hot') < 1) return p.msg('You have no hot boxed pizza. (`make pizza`, then `bake`.)', 'sys');
    D.itemTake(p, 'pz_hot', 1); const tip = 40 + 8 * p.level; p.gold += tip; p.msg(`Harold snatches the box, opens it, sniffs and sighs with joy: "Perfect. Only an hour late." He presses ${tip} credits into your hand as a tip.`, 'win'); p.gainXp(20 * Math.max(1, p.level), true); p.sendStats(); D.qEvent(p, 'do', 'deliver_pizza');
  },
};
module.exports.D = D;
