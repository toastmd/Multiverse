'use strict';
// Blackjack at the saloons: 1000 credits a game against the dealer. Dealer stands on 17. A natural 21 pays 3:2, a win pays 1:1, a tie returns your stake.
const D = require('./lib');
const COST = 1000, SUITS = ['\u2660', '\u2665', '\u2666', '\u2663'], RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const fresh = () => { const d = []; for (const s of SUITS) for (const r of RANKS) d.push({ r, s }); for (let i = d.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [d[i], d[j]] = [d[j], d[i]]; } return d; };
const val = (h) => { let t = 0, a = 0; for (const c of h) { if (c.r === 'A') { a++; t += 11; } else t += 'JQK'.includes(c.r) || c.r === '10' ? 10 : Number(c.r); } while (t > 21 && a) { t -= 10; a--; } return t; };
const show = (h) => h.map((c) => c.r + c.s).join(' '), say = (p, t, c = 'game') => p.msg(t, c);
function table(p, hideHole) { const g = p.bj; say(p, `Dealer: ${hideHole ? `${g.dealer[0].r}${g.dealer[0].s} [?]` : `${show(g.dealer)} (${val(g.dealer)})`}   You: ${show(g.player)} (${val(g.player)})`); }
function end(p, outcome, pay) { // pay = total credits returned to the player
  p.gold += pay; const how = { blackjack: `BLACKJACK! You win ${pay - COST} credits.`, win: `You win ${pay - COST} credits.`, push: 'Push: your 1,000 credits come back.', lose: `You lose your ${COST} credits.`, bust: `Bust! You lose your ${COST} credits.` }[outcome];
  say(p, how, outcome === 'lose' || outcome === 'bust' ? 'hurt' : 'win'); p.bj = null; if (p.env.def.saloon) say(p, 'Type `blackjack` to play again.', 'sys');
}
function play(p) {
  if (!p.env.def.saloon) return say(p, 'Blackjack is played at the saloons: the Silver Spur in Ashfall, the Rattlesnake Saloon, the Lucky Strike, the Silver Dollar and the Brimstone Saloon Car.', 'sys');
  if (p.bj) { say(p, 'You are in a hand already: `hit` or `stand`.', 'sys'); return table(p, true); }
  if (p.enemy) return say(p, 'Not while you are fighting.', 'sys'); if (p.gold < COST) return say(p, `A game costs ${COST} credits. You have ${p.gold}.`, 'sys');
  p.gold -= COST; const g = (p.bj = { deck: fresh(), player: [], dealer: [] }); g.player.push(g.deck.pop(), g.deck.pop()); g.dealer.push(g.deck.pop(), g.deck.pop());
  say(p, `The dealer takes your ${COST} credits and deals.`); table(p, true);
  if (val(g.player) === 21) { table(p, false); return val(g.dealer) === 21 ? end(p, 'push', COST) : end(p, 'blackjack', COST * 2.5); }
  say(p, 'Type `hit` for another card or `stand` to hold.', 'sys');
}
function hit(p) { const g = p.bj; if (!g) return say(p, 'You are not playing. Type `blackjack` in a saloon.', 'sys'); g.player.push(g.deck.pop()); table(p, true); const v = val(g.player); if (v > 21) { table(p, false); return end(p, 'bust', 0); } if (v === 21) { say(p, 'Twenty-one! You stand.'); stand(p); } }
function stand(p) {
  const g = p.bj; if (!g) return say(p, 'You are not playing. Type `blackjack` in a saloon.', 'sys'); while (val(g.dealer) < 17) g.dealer.push(g.deck.pop());
  table(p, false); const d = val(g.dealer), v = val(g.player); if (d > 21) { say(p, 'The dealer busts!'); return end(p, 'win', COST * 2); } if (v > d) return end(p, 'win', COST * 2); if (v === d) return end(p, 'push', COST); end(p, 'lose', 0);
}
function forfeit(p) { if (p.bj) { p.bj = null; say(p, `You walk away from the table and leave your ${COST} credits behind.`, 'hurt'); } }
module.exports = { cost: COST, play, hit, stand, forfeit, val };
