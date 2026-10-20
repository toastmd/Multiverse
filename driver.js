'use strict';
// The "driver": object registry, heart_beat scheduler, call_out, periodic reset().
// Game rules live in the "mudlib" (lib.js, world.js, commands.js) and can be hot-reloaded.
const D = { objects: new Map(), hb: new Set(), rooms: new Map(), players: new Map(), tick: 2000, resetEvery: 60000 };
let nextId = 1;

D.log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
D.fresh = (file) => { delete require.cache[require.resolve(file)]; return require(file); };

class GameObject {
  constructor() {
    this.id = nextId++; this.env = null; this.inv = [];
    this.name = 'thing'; this.short = 'a thing'; this.long = 'You see nothing special.';
    this.ids = []; this.actions = {};
    D.objects.set(this.id, this);
  }
  move(dest) {
    if (this.env) this.env.inv = this.env.inv.filter((o) => o !== this);
    this.env = dest || null;
    if (dest) dest.inv.push(this);
  }
  destroy() {
    this.move(null); D.hb.delete(this);
    for (const o of [...this.inv]) o.destroy();
    D.objects.delete(this.id);
  }
  isId(w) {
    w = w.toLowerCase(); const n = this.name.toLowerCase();
    return this.ids.includes(w) || n === w || n.split(' ').includes(w);
  }
}

D.GameObject = GameObject;
D.heartBeat = (o, on = true) => (on ? D.hb.add(o) : D.hb.delete(o));
D.callOut = (fn, ms) => setTimeout(() => { try { fn(); } catch (e) { D.log(e.stack); } }, ms);
D.start = () => {
  setInterval(() => { for (const o of [...D.hb]) try { o.heart_beat && o.heart_beat(); } catch (e) { D.log('heart_beat', e.stack); } }, D.tick);
  setInterval(() => { for (const r of D.rooms.values()) try { r.reset(); } catch (e) { D.log('reset', e.stack); } }, D.resetEvery);
};

module.exports = D;
