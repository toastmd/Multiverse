// Smoke test for the Darkflow transport: start the server (PORT=4100 node server.js), then run `PORT=4100 node tools/test_darkflow.js`.
// Needs Node 22+ (global WebSocket). Creates a throw-away character, walks a step and prints the text and GMCP frames Darkflow would receive.
const ws = new WebSocket(`ws://localhost:${process.env.PORT || 4100}/`); ws.binaryType = 'arraybuffer'; const T = [], G = [];
const strip = (s) => s.replace(/\x1b\[[0-9;]*m/g, '');
ws.onmessage = (e) => { if (typeof e.data === 'string') T.push(strip(e.data)); else { const t = Buffer.from(e.data).toString(); G.push(t.length > 140 ? t.slice(0, 140) + '...' : t); } };
const send = (s) => ws.send(s); const wait = (ms) => new Promise((r) => setTimeout(r, ms));
ws.onopen = async () => {
  ws.send(Buffer.from('Core.Hello {"client":"Darkflow","version":"1.5.7","width":100,"height":30}'));
  await wait(300); send('Dftest' + Math.random().toString(36).replace(/[^a-z]/g, '').slice(0, 5)); await wait(200); send('secret1'); await wait(200); send('3'); await wait(200); send('female'); await wait(1500);
  send('look'); await wait(400); send('north'); await wait(400); send('score'); await wait(300); send('who'); await wait(300); send('inventory'); await wait(300);
  ws.send(Buffer.from('Core.Ping')); await wait(300);
  console.log('--- TEXT ---\n' + T.join('').slice(0, 3500)); console.log('--- GMCP ---\n' + G.join('\n').slice(0, 3000)); process.exit(0);
};
