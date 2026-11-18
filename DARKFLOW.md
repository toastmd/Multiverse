# Playing MULTIVERSE MUD in Darkflow

[Darkflow](https://github.com/jasona/darkflow) is a WebSocket/telnet MUD client with GMCP panels. MULTIVERSE MUD speaks its protocol directly, so
Darkflow's panels (vitals, status, worth, inventory, buffs, enemy, room, room image, chat and the map) work on this game.

## Connect

Start the MUD (`node server.js`, default port 4000) and Darkflow side by side:

```bash
# the MUD
PORT=4000 node server.js
# Darkflow (in its own folder)
MUD_HOST=localhost MUD_PORT=4000 MUD_WSS=0 npm start      # then open http://localhost:3000
```

Or open Darkflow without those variables and type the host and port in its toolbar, with the protocol set to `ws` (plain) or `wss` (when the MUD is behind TLS).

**Darkflow served over https** cannot open plain `ws://`; either put the MUD behind a TLS proxy (`wss://`) or pick `telnet` in Darkflow's protocol list and use the
MUD's telnet port (default **4242**, change with `TELNET_PORT`, `TELNET_PORT=0` turns it off): Darkflow's own `/proxy` bridges to it.

## How it works

| Transport | Where | Notes |
| --- | --- | --- |
| WebSocket | the game port, path `/` (also `/darkflow`, `/mud`) | text frames = commands in, ANSI text out; binary frames = GMCP |
| Telnet | `TELNET_PORT` (4242) | GMCP option 201; ordinary MUD clients work as well |
| Browser client | `/ws` | unchanged |

Login is a text conversation: name, password, and for a new name the class (number or name) and gender. (Darkflow echoes what you type, so the password is
visible on screen while you type it: use a throw-away password on shared screens.)

GMCP sent to Darkflow: `Core.Hello`, `Core.Supports.Set`, `Core.Ping`, `Char.Vitals`, `Char.Status`, `Char.Worth`, `Char.Items.List`, `Char.Defences.List`,
`Char.Enemy`, `Room.Info` (stable numeric room ids, coordinates and exits, which feeds Darkflow's generic map), `Room.Players`, `Darkwind.Room.Image`, `Darkwind.Char.Avatar` (the class or player portrait), `Darkwind.Quests.List`,
`Comm.Channel.List` and `Comm.Channel.Text` (gossip, say, chat and group). Room pictures use `PUBLIC_URL` (or the address the client connected to) as their base.

Colours are converted to 24-bit ANSI (item colours included); `score` prints the text sheet. Browser-only windows (mail composer, tutorial overlay,
sounds, keypad, the graphical map and combat arena) have no Darkflow equivalent; their text versions still print in the terminal.

Test it: `PORT=4000 node tools/test_darkflow.js` (Node 22+).
