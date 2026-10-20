'use strict';
// Auction house: players put equipment or treasure up for auction, anyone can bid in steps of 100, and Auctioneer Quincy Pike calls the bids.
// When bidding goes quiet he says "going once", waits 5 seconds, "going twice", waits 5 more, then the item is SOLD: the winner pays and gets the item, the seller gets the credits.
const D = require('./lib');
const K = Math.max(0.01, +process.env.AUCTION_TIME_SCALE || 1), TYPES = ['weapon', 'armor', 'treasure'], INC = 100, IDLE = 20000 * K, PAUSE = 5000 * K, MAXQ = 6, AUC = 'Auctioneer Quincy Pike';
let cur = null; const queue = [];
const say = (t) => { for (const p of D.players.values()) if (!p.auctionOff) p.msg(t, 'auction'); };
const call = (t) => say(`${AUC}: "${t}"`), money = (n) => n.toLocaleString('en-US');
const desc = (d) => (d.type === 'weapon' ? `damage ${d.dmg[0]}-${d.dmg[1]}, level ${d.lvl || 1}` : d.type === 'armor' ? `${d.slot} armor ${d.ac}, level ${d.lvl || 1}` : 'a treasure for collectors') + (d.bonus ? ', bonuses ' + Object.entries(d.bonus).map(([k, v]) => `+${v} ${k}`).join(' ') : '');
const giveItem = (name, defId) => { const p = D.players.get(name); if (p) { const where = D.give(p, defId, 'normal'); return where; } return D.creditOffline(name, { bag: defId }) ? 'bag' : null; };
const credit = (name, gold) => { const p = D.players.get(name); if (p) p.gold += gold; else D.creditOffline(name, { gold }); };
const nextBid = (a) => (a.bid ? a.bid.amount + INC : a.open);
const arm = (a) => { clearTimeout(a.timer); a.timer = setTimeout(() => once(a), IDLE); };
function start(a) {
  cur = a; const d = D.W.items[a.defId];
  say(`${AUC}: "Ladies and gentlemen! ${a.seller} offers ${d.legend ? 'the LEGENDARY ' : ''}${d.name}: ${desc(d)}. Opening bid is ${money(a.open)} credits. Do I hear ${money(a.open)}?"  (type \`bid\` to bid)`); arm(a);
}
function once(a) { if (cur !== a) return; call(`${a.bid ? `${money(a.bid.amount)} credits from ${a.bid.name}` : `Nobody has bid on the ${D.W.items[a.defId].name}`}... going once!`); a.timer = setTimeout(() => twice(a), PAUSE); }
function twice(a) { if (cur !== a) return; call(`${a.bid ? `${money(a.bid.amount)} credits to ${a.bid.name}` : 'Last chance, no bids'}... going twice!`); a.timer = setTimeout(() => close(a), PAUSE); }
function close(a) {
  if (cur !== a) return; const d = D.W.items[a.defId];
  if (!a.bid) { call(`No bids. The ${d.name} goes back to ${a.seller}.`); giveItem(a.seller, a.defId); const s = D.players.get(a.seller); if (s) s.msg(`Your ${d.name} did not sell and is back in your possession.`, 'sys'); return finish(); }
  const w = D.players.get(a.bid.name);
  if (!w || w.gold < a.bid.amount) { call(`${a.bid.name} cannot cover ${money(a.bid.amount)} credits! That bid is void.`); a.history.pop(); a.bid = a.history[a.history.length - 1] || null; call(`The bidding returns to ${a.bid ? money(a.bid.amount) : 'the opening bid'}. Do I hear ${money(nextBid(a))}?`); return arm(a); }
  w.gold -= a.bid.amount; credit(a.seller, a.bid.amount); const where = giveItem(w.name, a.defId);
  call(`SOLD! The ${d.name} goes to ${w.name} for ${money(a.bid.amount)} credits!`); w.msg(`*** You won the auction: ${d.name} for ${money(a.bid.amount)} credits${where === 'floor' ? ' (your pack is full: it is on the floor)' : where === 'bag' ? ' (it went into your bag)' : ''}. ***`, 'win');
  const s = D.players.get(a.seller); if (s) s.msg(`Your ${d.name} sold for ${money(a.bid.amount)} credits.`, 'win'); finish();
}
function finish() { clearTimeout(cur && cur.timer); cur = null; if (queue.length) setTimeout(() => { if (!cur && queue.length) start(queue.shift()); }, 4000); }
function bid(p, arg) {
  if (!cur) return p.msg('No auction is running. Start one with `auction <item>`.', 'sys'); if (cur.seller === p.name) return p.msg('You cannot bid on your own item.');
  if (cur.bid && cur.bid.name === p.name && !arg.trim()) return p.msg(`You already hold the high bid (${money(cur.bid.amount)}).`);
  const want = arg.trim() ? Number(arg.trim().replace(/,/g, '')) : nextBid(cur), min = nextBid(cur);
  if (!Number.isInteger(want) || want <= 0) return p.msg('Bid a number of credits, like `bid 500`, or just `bid` to raise by 100.');
  if (want % INC) return p.msg(`Bids go up in steps of ${INC} credits.`); if (want < min) return p.msg(`The next bid must be at least ${money(min)} credits.`);
  if (want > p.gold) return p.msg(`You only have ${money(p.gold)} credits. You cannot bid more than you have.`, 'hurt');
  if (cur.bid && cur.bid.name === p.name) return p.msg('You already hold the high bid.');
  cur.bid = { name: p.name, amount: want }; cur.history.push(cur.bid); call(`${p.name} bids ${money(want)} credits! The latest bid is ${money(want)}. Do I hear ${money(want + INC)}?`); arm(cur);
}
function takeFromPlayer(p, q) { // returns the item definition id, removing one copy from the pack or bag
  const match = (o) => o.isId(q) || o.name.toLowerCase().includes(q), it = p.inv.find((o) => match(o) && !Object.values(p.equip).includes(o) && !o.kept);
  if (it) { if (!TYPES.includes(it.type)) return { err: 'Only equipment and treasure can be auctioned.' }; const id = it.itemId; it.destroy(); return { id }; }
  const bagId = Object.keys(p.bag).find((id) => { const d = D.W.items[id]; return d && TYPES.includes(d.type) && (id === q || (d.ids || []).includes(q) || d.name.toLowerCase().includes(q)); });
  if (bagId) { p.bag[bagId]--; if (p.bag[bagId] <= 0) delete p.bag[bagId]; return { id: bagId }; }
  if (p.inv.some((o) => match(o) && o.kept)) return { err: 'That is marked to keep. Type `unkeep` first.' };
  if (p.inv.some(match)) return { err: 'Unequip it first, or it is not equipment or treasure.' }; return { err: "You don't have that." };
}
function status(p) {
  if (!cur) return p.msg('No auction is running. `auction <item> [opening bid]` starts one.', 'sys'); const d = D.W.items[cur.defId];
  p.msg(`Now: ${d.name} (${desc(d)}), offered by ${cur.seller}. ${cur.bid ? `High bid ${money(cur.bid.amount)} by ${cur.bid.name}.` : `Opening bid ${money(cur.open)}, no bids yet.`} Next bid: ${money(nextBid(cur))}.`, 'auction');
  queue.forEach((a, i) => p.msg(`  Next up ${i + 1}: ${D.W.items[a.defId].name} from ${a.seller} (opens at ${money(a.open)})`, 'auction'));
}
function cmd(p, a) {
  a = a.trim(); const low = a.toLowerCase();
  if (!a) return status(p); if (low === 'on' || low === 'off') { p.auctionOff = low === 'off'; return p.msg(`Auction announcements are ${p.auctionOff ? 'OFF' : 'ON'}.`, 'sys'); }
  if (low === 'cancel') { const mine = cur && cur.seller === p.name && !cur.bid ? cur : null, qi = queue.findIndex((x) => x.seller === p.name);
    if (mine) { call(`${p.name} has withdrawn the ${D.W.items[mine.defId].name}.`); giveItem(p.name, mine.defId); finish(); return; } if (qi >= 0) { const x = queue.splice(qi, 1)[0]; giveItem(p.name, x.defId); return p.msg('Your queued auction is cancelled and the item is back with you.', 'sys'); }
    return p.msg(cur && cur.seller === p.name ? 'It already has bids, so it cannot be withdrawn.' : 'You have nothing to cancel.'); }
  const m = a.match(/^(.*?)(?:\s+(\d[\d,]*))?$/), q = m[1].trim().toLowerCase(), open = m[2] ? Number(m[2].replace(/,/g, '')) : INC;
  if (!q) return p.msg('Auction what? `auction <item> [opening bid]`'); if (open % INC || open < INC || open > 100000000) return p.msg(`The opening bid must be a multiple of ${INC} credits (at most 100,000,000).`);
  if ([cur, ...queue].filter((x) => x && x.seller === p.name).length >= 2) return p.msg('You can have at most 2 items up for auction at a time.'); if (queue.length >= MAXQ) return p.msg('The auction queue is full. Try again soon.');
  const r = takeFromPlayer(p, q); if (r.err) return p.msg(r.err); const au = { seller: p.name, defId: r.id, open, bid: null, history: [], timer: null }, d = D.W.items[r.id];
  p.msg(`You hand the ${d.name} to the auctioneer (opening bid ${money(open)}).`, 'win');
  if (!cur) start(au); else { queue.push(au); p.msg(`There is an auction in progress. Yours is number ${queue.length} in the queue.`, 'sys'); }
}
function onDrop(p) { // a high bidder who leaves loses their bids
  if (!cur || !cur.history.some((h) => h.name === p.name)) return; const was = cur.bid && cur.bid.name === p.name; cur.history = cur.history.filter((h) => h.name !== p.name); cur.bid = cur.history[cur.history.length - 1] || null;
  if (was) { call(`${p.name} has left the room. The high bid falls to ${cur.bid ? money(cur.bid.amount) : 'the opening bid'}.`); arm(cur); }
}
function halt() { for (const a of [cur, ...queue]) if (a) { clearTimeout(a.timer); giveItem(a.seller, a.defId); } cur = null; queue.length = 0; } // server shutdown: everything goes back to its owner
module.exports = { cmd, bid, status, onDrop, halt, state: () => ({ cur, queue }) };
