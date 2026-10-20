// One-off sync of the MUD's code and content to GitHub:  GITHUB_TOKEN=... GITHUB_REPO=owner/name node tools/github_sync.js
const g = require('../github');
if (!g.configure()) { console.error('Not configured: set GITHUB_TOKEN and GITHUB_REPO=owner/name (or fill in data/config.json, see config.example.json).'); process.exit(1); }
g.sync(process.argv[2] || 'Manual sync').then((r) => { console.log(r.changed ? `Pushed ${r.changed} file(s) in commit ${r.commit}` : 'Already up to date.'); process.exit(0); }).catch((e) => { console.error('Sync failed:', e.message); process.exit(1); });
