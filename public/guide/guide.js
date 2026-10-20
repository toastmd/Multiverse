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
  function fit() { var box = $('.mapbox'); if (!box) return; var s = box.querySelector('svg'), vb = s.viewBox.baseVal; zoom = Math.max(0.5, Math.min(1, (box.clientWidth - 4) / vb.width)); applyZoom(); }
  if ($('.mapbox')) fit();
})();
