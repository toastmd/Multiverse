// Procedural SVG portraits. Works in the browser (window.SPPortrait) and in Node (require). All art is generated here, no third-party images.
(function (root) {
  const rng = (seed) => { let s = 2166136261; for (const ch of String(seed)) s = Math.imul(s ^ ch.charCodeAt(0), 16777619) >>> 0; return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296); };
  const SKIN = ['#f3d2b3', '#e4b48a', '#cf9567', '#ad704a', '#82502f', '#5d3a24'], HAIR = ['#17171c', '#3a2a1f', '#6b4a2b', '#c9a14a', '#b03a2e', '#d9d9e2', '#2d6cdf', '#8a2dbd', '#19c7e3'];
  const CLS = { // accent color, clothing, accessories for generic player portraits
    magician: ['#9a6bff', ['hood', 'cybereye']], thief: ['#4a4a5a', ['mask', 'hood']], alchemist: ['#8fd14f', ['goggles']], gunslinger: ['#d08a3c', ['hat']], barbarian: ['#d94a3a', ['scar', 'cyberjaw']],
    engineer: ['#e0a02e', ['helmet', 'lamp']], necromancer: ['#6a3fa0', ['hood', 'faceglow']], cleric: ['#f0f0f0', ['cross', 'headband']], druid: ['#4fa86a', ['leaf']], bard: ['#ff4fd8', ['headband', 'visor']],
    wirewalker: ['#19e3ff', ['visor', 'antenna']], dragon: ['#ff7a1a', ['horns', 'flame']], android: ['#9fb8ff', ['visor', 'cyberjaw', 'antenna']], shapeshifter: ['#7be0a0', ['leaf', 'scar']], scavenger: ['#a88b5f', ['goggles', 'scar']] };
  const ACC = {
    visor: (c) => `<rect x="66" y="88" width="68" height="14" rx="7" fill="#0a0a14" stroke="${c}" stroke-width="2"/><rect x="70" y="92" width="60" height="4" rx="2" fill="${c}" opacity=".85"/>`,
    cybereye: (c) => `<circle cx="116" cy="95" r="8" fill="#050510" stroke="${c}" stroke-width="2"/><circle cx="116" cy="95" r="3.5" fill="${c}"/>`,
    eyepatch: () => `<path d="M60 76 L140 100" stroke="#111" stroke-width="3"/><ellipse cx="116" cy="95" rx="11" ry="9" fill="#111"/>`,
    scar: () => `<path d="M82 78 L96 112" stroke="#8a3a3a" stroke-width="3" stroke-linecap="round"/><path d="M79 90 L90 92 M84 100 L95 102" stroke="#8a3a3a" stroke-width="1.5"/>`,
    goggles: (c) => `<circle cx="84" cy="94" r="13" fill="#0e0e18" stroke="${c}" stroke-width="3"/><circle cx="116" cy="94" r="13" fill="#0e0e18" stroke="${c}" stroke-width="3"/><path d="M97 94 H103" stroke="${c}" stroke-width="3"/><circle cx="84" cy="94" r="5" fill="${c}" opacity=".6"/><circle cx="116" cy="94" r="5" fill="${c}" opacity=".6"/>`,
    glasses: () => `<circle cx="84" cy="94" r="12" fill="none" stroke="#222" stroke-width="2"/><circle cx="116" cy="94" r="12" fill="none" stroke="#222" stroke-width="2"/><path d="M96 94 H104" stroke="#222" stroke-width="2"/>`,
    mask: () => `<path d="M62 100 Q100 142 138 100 L138 122 Q100 156 62 122 Z" fill="#14141c"/>`,
    hood: (c) => `<path d="M48 120 Q40 40 100 28 Q160 40 152 120 L138 90 Q100 62 62 90 Z" fill="${c}" opacity=".95"/>`,
    hat: (c) => `<ellipse cx="100" cy="62" rx="60" ry="10" fill="#2a2018"/><path d="M68 62 Q70 30 100 28 Q130 30 132 62 Z" fill="#3a2c1e"/><rect x="70" y="54" width="60" height="6" fill="${c}"/>`,
    helmet: (c) => `<path d="M56 86 Q56 30 100 28 Q144 30 144 86 Z" fill="${c}"/><rect x="52" y="82" width="96" height="9" rx="4" fill="#222"/>`,
    lamp: () => `<circle cx="100" cy="46" r="9" fill="#fff7c2"/><circle cx="100" cy="46" r="15" fill="#fff7c2" opacity=".25"/>`,
    turban: (c) => `<path d="M54 84 Q56 34 100 30 Q144 34 146 84 Q100 66 54 84 Z" fill="${c}"/><path d="M60 70 Q100 54 140 70" stroke="#fff" stroke-opacity=".3" fill="none"/>`,
    headband: (c) => `<rect x="54" y="68" width="92" height="9" rx="4" fill="${c}"/>`,
    cross: () => `<rect x="94" y="30" width="12" height="34" fill="#e53a3a"/><rect x="83" y="41" width="34" height="12" fill="#e53a3a"/>`,
    antenna: (c) => `<path d="M138 70 L158 26" stroke="${c}" stroke-width="3"/><circle cx="158" cy="26" r="5" fill="${c}"/>`,
    faceglow: (c) => `<ellipse cx="84" cy="94" rx="8" ry="5" fill="${c}"/><ellipse cx="116" cy="94" rx="8" ry="5" fill="${c}"/>`,
    cyberjaw: (c) => `<path d="M64 120 Q100 168 136 120 L128 124 Q100 152 72 124 Z" fill="#2c2c36" stroke="${c}" stroke-width="2"/>`,
    leaf: () => `<path d="M52 74 Q70 40 98 56 Q82 76 52 74 Z" fill="#4fa86a"/><path d="M148 74 Q130 40 102 56 Q118 76 148 74 Z" fill="#3b8a53"/>`,
    beard: (hc) => `<path d="M62 106 Q64 168 100 170 Q136 168 138 106 Q122 134 100 134 Q78 134 62 106 Z" fill="${hc}"/>`,
    horns: (c) => `<path d="M58 62 Q40 30 56 8 Q60 40 74 56 Z M142 62 Q160 30 144 8 Q140 40 126 56 Z" fill="${c}"/>`,
    flame: () => `<path d="M64 60 Q72 20 100 6 Q128 20 136 60 Q118 44 100 48 Q82 44 64 60 Z" fill="#ff7a1a"/><path d="M80 56 Q100 24 120 56 Q100 46 80 56 Z" fill="#ffd34a"/>`,
    glow: (c) => `<ellipse cx="100" cy="100" rx="46" ry="54" fill="${c}" opacity=".18"/><ellipse cx="100" cy="100" rx="30" ry="38" fill="${c}" opacity=".35"/>`,
  };
  function svg(o) {
    o = o || {}; const R = rng(o.seed || (o.cls || 'x') + (o.gender || '')), pick = (a) => a[Math.floor(R() * a.length)];
    const g = o.gender || 'nonbinary', cl = CLS[o.cls], accent = o.accent || (cl ? cl[0] : pick(['#19e3ff', '#ff4fd8', '#ffd34a', '#7be0a0', '#ff7a3c', '#9a6bff']));
    const skin = o.skin || pick(SKIN), hair = o.hair || pick(HAIR), acc = o.acc || (cl ? cl[1] : []), style = o.style ?? Math.floor(R() * 3);
    const jaw = g === 'male' ? 'M58 96 Q58 150 100 156 Q142 150 142 96' : g === 'female' ? 'M62 96 Q64 144 100 154 Q136 144 138 96' : 'M60 96 Q60 148 100 155 Q140 148 140 96';
    const cloth = o.cloth || (cl ? cl[0] : accent), neon = accent;
    let back = '', front = '';
    if (g === 'female') { back = `<path d="M52 92 Q40 170 62 196 L138 196 Q160 170 148 92 Q100 40 52 92 Z" fill="${hair}"/>`; front = style === 1 ? `<path d="M56 86 Q100 46 144 86 L144 70 Q100 24 56 70 Z" fill="${hair}"/>` : `<path d="M56 88 Q76 52 100 56 Q76 70 70 98 Z M144 88 Q124 52 100 56 Q124 70 130 98 Z" fill="${hair}"/>`; }
    else if (g === 'male') { front = style === 0 ? `<path d="M56 90 Q54 38 100 34 Q146 38 144 90 Q132 56 100 58 Q68 56 56 90 Z" fill="${hair}"/>` : style === 1 ? `<path d="M58 80 Q60 40 100 38 Q140 40 142 80 L100 62 Z" fill="${hair}"/>` : `<path d="M56 88 Q56 44 100 40 Q146 44 144 88 L132 68 Q100 52 68 68 Z" fill="${hair}"/>`; }
    else { back = `<path d="M60 90 Q54 130 66 150 L80 120 Z" fill="${hair}"/>`; front = `<path d="M54 90 Q50 40 100 36 Q140 38 146 74 Q120 52 90 62 Q64 70 54 90 Z" fill="${hair}"/><path d="M48 84 L60 84 L60 92 L48 92 Z" fill="${neon}"/>`; }
    const shoulders = g === 'male' ? 'M20 240 Q24 176 100 168 Q176 176 180 240 Z' : g === 'female' ? 'M34 240 Q36 182 100 172 Q164 182 166 240 Z' : 'M28 240 Q30 178 100 170 Q170 178 172 240 Z';
    let body = `<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0a0a14"/><stop offset="1" stop-color="#1a0f2a"/></linearGradient></defs><rect width="200" height="240" fill="url(#bg)"/>`;
    for (let i = 0; i < 6; i++) body += `<path d="M0 ${30 + i * 36} H200" stroke="${neon}" stroke-opacity=".10"/>`;
    body += `<circle cx="100" cy="100" r="86" fill="${neon}" opacity=".10"/>${back}<path d="${shoulders}" fill="${cloth}"/><path d="M78 176 L100 206 L122 176 Z" fill="#111" opacity=".5"/><rect x="88" y="140" width="24" height="36" fill="${skin}"/>`;
    body += `<path d="${jaw} L142 80 Q140 42 100 40 Q60 42 58 80 Z" fill="${skin}"/>`;
    const eyes = acc.includes('goggles') || acc.includes('visor') ? '' : `<ellipse cx="84" cy="94" rx="5" ry="3.5" fill="#111"/><ellipse cx="116" cy="94" rx="5" ry="3.5" fill="#111"/>`;
    body += `${eyes}<path d="M90 128 Q100 134 110 128" stroke="#7a3a3a" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M100 98 L96 114 L104 114" stroke="#000" stroke-opacity=".25" fill="none"/>`;
    body += front + acc.map((a) => (ACC[a] ? ACC[a](a === 'beard' ? hair : neon) : '')).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 240" role="img" aria-label="${o.label || 'portrait'}">${body}</svg>`;
  }
  const api = { svg, CLS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.SPPortrait = api;
})(typeof window !== 'undefined' ? window : globalThis);
