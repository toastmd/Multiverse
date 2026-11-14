// Small helpers for the guide: nav toggle, table filters, map layers and zoom.
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var m = $('#menu'); if (m) m.onclick = function () { $('#nav').classList.toggle('open'); };
  $$('.flt').forEach(function (inp) {
    inp.addEventListener('input', function () { var q = inp.value.toLowerCase(), t = document.getElementById(inp.getAttribute('data-for')); if (!t) return; $$('tbody tr', t).forEach(function (tr) { tr.style.display = tr.textContent.toLowerCase().indexOf(q) < 0 ? 'none' : ''; }); });
  });
  var zoom = 1;
  function applyZoom() { $$('.mapbox svg').forEach(function (s) { var vb = s.viewBox.baseVal; s.style.width = Math.round(vb.width * zoom) + 'px'; s.style.height = Math.round(vb.height * zoom) + 'px'; }); }
  $$('[data-zoom]').forEach(function (b) { b.onclick = function () { var z = +b.getAttribute('data-zoom'); zoom = z === 0 ? 1 : Math.max(0.4, Math.min(2.4, zoom * (z > 0 ? 1.25 : 0.8))); applyZoom(); }; });
  $$('[data-layer]').forEach(function (b) { b.onclick = function () { var u = b.getAttribute('data-layer') === 'under'; $('#map-surface').hidden = u; $('#map-under').hidden = !u; $$('[data-layer]').forEach(function (x) { x.classList.toggle('on', x === b); }); applyZoom(); }; });
  function fit() { zoom = 1; applyZoom(); }
  if ($('.mapbox')) fit();
})();
// ===== 2026 redesign: depth, tilt, reveal, particles =====
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  // scroll progress + back-to-top
  var bar = document.createElement('div'); bar.id = 'prog'; document.body.appendChild(bar);
  var up = document.createElement('button'); up.id = 'up'; up.setAttribute('aria-label', 'Back to top'); up.innerHTML = '&#8593;'; up.onclick = function () { window.scrollTo({ top: 0, behavior: 'smooth' }); }; document.body.appendChild(up);
  function onScroll() { var h = document.documentElement, m = h.scrollHeight - h.clientHeight; bar.style.width = (m > 0 ? 100 * h.scrollTop / m : 0) + '%'; up.classList.toggle('on', h.scrollTop > 500); }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  // hero: wrap for a 3D tilt that follows the pointer, with parallax on the picture
  var hero = $('.hero');
  if (hero && !calm) {
    var inner = document.createElement('div'); inner.className = 'hin'; while (hero.firstChild) inner.appendChild(hero.firstChild); hero.appendChild(inner);
    hero.addEventListener('pointermove', function (e) { var r = hero.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; hero.style.setProperty('--ry', (x * 9).toFixed(2) + 'deg'); hero.style.setProperty('--rx', (-y * 7).toFixed(2) + 'deg'); hero.style.setProperty('--px', (-x * 22).toFixed(1) + 'px'); hero.style.setProperty('--py', (-y * 14).toFixed(1) + 'px'); hero.style.setProperty('--mx', (x * 100 + 50) + '%'); hero.style.setProperty('--my', (y * 100 + 50) + '%'); inner.style.setProperty('--rx', hero.style.getPropertyValue('--rx')); inner.style.setProperty('--ry', hero.style.getPropertyValue('--ry')); });
    hero.addEventListener('pointerleave', function () { ['--rx', '--ry', '--px', '--py'].forEach(function (k) { hero.style.removeProperty(k); inner.style.removeProperty(k); }); });
  } else if (hero) { var i2 = document.createElement('div'); i2.className = 'hin'; while (hero.firstChild) i2.appendChild(hero.firstChild); hero.appendChild(i2); }
  // cards: 3D tilt with a moving highlight
  if (!calm && matchMedia('(hover:hover)').matches) $$('.card').forEach(function (c) {
    c.addEventListener('pointermove', function (e) { var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height; c.style.setProperty('--ry', ((x - .5) * 14).toFixed(2) + 'deg'); c.style.setProperty('--rx', ((.5 - y) * 12).toFixed(2) + 'deg'); c.style.setProperty('--gx', (x * 100) + '%'); c.style.setProperty('--gy', (y * 100) + '%'); });
    c.addEventListener('pointerleave', function () { c.style.setProperty('--ry', '0deg'); c.style.setProperty('--rx', '0deg'); });
  });
  // scroll reveal, staggered
  var tg = $$('article h2, article .card, article .tw, article .area, article .agrp, article > p, article .cards > *, article .chips');
  if ('IntersectionObserver' in window && !calm) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { threshold: .08, rootMargin: '0px 0px -40px 0px' });
    tg.forEach(function (t, i) { t.classList.add('rv'); t.style.setProperty('--d', Math.min(i % 6, 5) * 70 + 'ms'); io.observe(t); });
  }
  // depth particles: a drifting 3D starfield that shifts with the pointer and the scroll
  if (calm) return;
  var cv = document.createElement('canvas'); cv.id = 'fx'; document.body.insertBefore(cv, document.body.firstChild); var g = cv.getContext('2d'), W = 0, H = 0, S = [], mx = 0, my = 0, sy = 0;
  function size() { W = cv.width = innerWidth; H = cv.height = innerHeight; var n = Math.min(120, Math.round(W * H / 14000)); S = []; for (var i = 0; i < n; i++) S.push({ x: Math.random() * W, y: Math.random() * H, z: Math.random() * .9 + .1, h: [32, 150, 190, 270][i % 4], p: Math.random() * 6.28 }); }
  addEventListener('resize', size); size();
  addEventListener('pointermove', function (e) { mx = e.clientX / W - .5; my = e.clientY / H - .5; }, { passive: true }); addEventListener('scroll', function () { sy = scrollY; }, { passive: true });
  (function frame(t) {
    g.clearRect(0, 0, W, H);
    for (var i = 0; i < S.length; i++) { var s = S[i], x = (s.x - mx * 60 * s.z + t * .004 * s.z) % W, y = ((s.y - sy * .25 * s.z - my * 40 * s.z) % H + H) % H; if (x < 0) x += W; var r = 1 + 2.6 * s.z, a = .25 + .5 * s.z * (.6 + .4 * Math.sin(t / 900 + s.p)); g.beginPath(); g.fillStyle = 'hsla(' + s.h + ',90%,70%,' + a.toFixed(2) + ')'; g.shadowColor = 'hsla(' + s.h + ',100%,65%,.9)'; g.shadowBlur = 8 * s.z; g.arc(x, y, r, 0, 6.283); g.fill(); }
    requestAnimationFrame(frame);
  })(0);
})();
