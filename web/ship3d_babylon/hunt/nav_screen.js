/* NAV PLANNER, a live CRT screen (F7): plot a route on the map, set the burn g of each leg and the flip g of each elbow in half-g detents,
 * or press an Auto navigate style (stealth, standard, combat, emergency) and let the navigator fill the numbers in. The screen shows what the
 * route would cost before it is engaged (time, propellant, peak g, strain-line crossings, forecast fatigue). Dave, 2026-11-21. Design: docs/nav_planner.md.
 * Clicks: the map region reports canvas coordinates through CTL.activate(id, {x, y}); every other control is an ordinary region id (nav:style:k, nav:g:v, nav:engage ...). */
(function (root) {
  'use strict';
  const LS = root.LS; if (!LS || !LS.P) return;
  const C = LS.C, W = LS.W, H = LS.H, FONT = 'monospace', MX = 16, MY = 76, MS = 640, PX = 676, PW = 332;
  const N = { draft: [], sel: null, style: 'standard', view: 30, v: null };
  LS.ctx.nav = N;
  const BAND = { quiet: '#3fd38a', firm: '#3ddbd0', combat: '#f0ab3a', emergency: '#ff4a3d' };
  const STYLES = ['stealth', 'standard', 'combat', 'emergency'];
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const toPx = (wx, wy) => ({ x: MX + MS / 2 + (wx - N.v.cx) * N.v.k, y: MY + MS / 2 + (wy - N.v.cy) * N.v.k });
  const toWorld = (x, y) => ({ x: N.v.cx + (x - MX - MS / 2) / N.v.k, y: N.v.cy + (y - MY - MS / 2) / N.v.k });
  const E = () => LS.ctx.E, S = () => LS.ctx.S;
  const weakest = () => { const e = E(), s = S(); if (!e.gState) return 0; const t = e.gState(s).filter(c => !c.ko).map(c => c.tol); return t.length ? Math.min(...t) : 0; };
  const styleDef = k => E().NAV_STYLES[k] || E().NAV_STYLES.standard;
  const gOf = () => { const q = N.sel && N.draft[N.sel.i]; return !q ? null : N.sel.t === 'wp' ? (q.flip != null ? q.flip : styleDef(N.style).flip) : (q.g != null ? q.g : styleDef(N.style).g); };
  const segDist = (px, py, a, b) => { const dx = b.x - a.x, dy = b.y - a.y, l2 = dx * dx + dy * dy || 1, t = clamp(((px - a.x) * dx + (py - a.y) * dy) / l2, 0, 1); return Math.hypot(px - (a.x + t * dx), py - (a.y + t * dy)); };

  LS.P.nav = function (g, t) {
    const s = S(), e = E(); LS.hdr(g, 'NAV PLANNER', C.pas, 'ROUTE · G · AUTO NAVIGATE');
    N.v = { cx: s.player.x, cy: s.player.y, k: MS / (2 * N.view) };
    // ---- map
    g.save(); g.beginPath(); g.rect(MX, MY, MS, MS); g.clip(); g.fillStyle = '#020c0a'; g.fillRect(MX, MY, MS, MS);
    const step = N.view > 50 ? 20 : 10; g.strokeStyle = '#123a33'; g.lineWidth = 1; g.fillStyle = C.dim; g.font = '14px ' + FONT;
    for (let gx = Math.ceil((N.v.cx - N.view) / step) * step; gx <= N.v.cx + N.view; gx += step) { const p = toPx(gx, 0); g.beginPath(); g.moveTo(p.x, MY); g.lineTo(p.x, MY + MS); g.stroke(); g.fillText(gx, p.x + 3, MY + 14); }
    for (let gy = Math.ceil((N.v.cy - N.view) / step) * step; gy <= N.v.cy + N.view; gy += step) { const p = toPx(0, gy); g.beginPath(); g.moveTo(MX, p.y); g.lineTo(MX + MS, p.y); g.stroke(); g.fillText(gy, MX + 4, p.y - 3); }
    // contacts (what the crew believe)
    for (const a of s.an) { if (a.state === 'out') continue; const r = LS.rel(a), p = toPx(r.x, r.y), st = LS.style(a); g.strokeStyle = st.col; g.fillStyle = st.fill === 'solid' || st.fill === 'halo' ? st.col : 'transparent'; g.lineWidth = 2; g.beginPath(); g.arc(p.x, p.y, 7, 0, 7); if (st.fill === 'solid' || st.fill === 'halo') g.fill(); g.stroke(); g.fillStyle = st.col; g.font = '14px ' + FONT; g.fillText('S' + (a.id + 1), p.x + 10, p.y - 6); }
    // the plan the ship is flying
    const pi = s.nav && s.nav.mode === 'route' && e.planInfo ? e.planInfo(s) : null;
    if (pi && pi.path) { g.strokeStyle = C.pas; g.lineWidth = 3; g.setLineDash([]); g.beginPath(); pi.path.forEach((q, i) => { const p = toPx(q.x, q.y); i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y); }); g.stroke(); pi.wps.forEach((w, i) => { const p = toPx(w.x, w.y); g.strokeStyle = C.pas; g.lineWidth = 2; g.strokeRect(p.x - 6, p.y - 6, 12, 12); }); }
    // the draft route and its preview
    const pv = N.draft.length && e.previewRoute ? e.previewRoute(s, N.draft) : null;
    if (pv) { g.strokeStyle = C.amber; g.lineWidth = 3; g.setLineDash([10, 6]); g.beginPath(); pv.path.forEach((q, i) => { const p = toPx(q.x, q.y); i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y); }); g.stroke(); g.setLineDash([]); }
    let prev = { x: s.player.x, y: s.player.y };
    N.draft.forEach((q, i) => { const a = toPx(prev.x, prev.y), b = toPx(q.x, q.y), gg = q.g != null ? q.g : 1, col = BAND[e.gBand(gg)];
      const selLeg = N.sel && N.sel.t === 'leg' && N.sel.i === i, selWp = N.sel && N.sel.t === 'wp' && N.sel.i === i;
      g.strokeStyle = col; g.lineWidth = selLeg ? 7 : 2; g.globalAlpha = selLeg ? 1 : .55; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke(); g.globalAlpha = 1;
      g.fillStyle = '#020c0a'; g.strokeStyle = selWp ? '#fff' : BAND[e.gBand(q.flip != null ? q.flip : 1)]; g.lineWidth = selWp ? 4 : 3; g.beginPath(); g.arc(b.x, b.y, 11, 0, 7); g.fill(); g.stroke();
      g.fillStyle = '#fff'; g.font = 'bold 15px ' + FONT; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(i + 1, b.x, b.y + 1); g.textAlign = 'left';
      g.fillStyle = col; g.font = '13px ' + FONT; g.fillText((gg).toFixed(gg % 1 ? 2 : 0) + 'g', (a.x + b.x) / 2 + 6, (a.y + b.y) / 2 - 6); prev = q; });
    // the ship: heading and velocity
    { const p = toPx(s.player.x, s.player.y), h = s.hdg || 0; g.save(); g.translate(p.x, p.y); g.rotate(h); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(14, 0); g.lineTo(-9, 8); g.lineTo(-9, -8); g.closePath(); g.fill(); g.restore();
      const sp = Math.hypot(s.vel.vx, s.vel.vy) * 1000 / 60; if (sp > 1) { const vx = s.vel.vx / Math.hypot(s.vel.vx, s.vel.vy), vy = s.vel.vy / Math.hypot(s.vel.vx, s.vel.vy), l = Math.min(150, sp * N.v.k * 0.5); g.strokeStyle = '#ffffff90'; g.lineWidth = 2; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x + vx * l, p.y + vy * l); g.stroke(); } }
    g.restore(); g.strokeStyle = C.line; g.lineWidth = 2; g.strokeRect(MX, MY, MS, MS); LS.reg(MX, MY, MS, MS, 'nav:map', 'Click to add a waypoint, a marker to set its flip g, a leg to set its burn g');
    g.fillStyle = C.dim; g.font = '15px ' + FONT; g.fillText('SPAN ' + (2 * N.view).toFixed(0) + ' KM · MAP: ADD · MARKER: FLIP G · LEG: BURN G', MX, MY + MS + 22);
    LS.btn(g, MX + MS - 100, MY + 8, 44, 40, '+', 'nav:zoom+', { fs: 26, col: C.pas }); LS.btn(g, MX + MS - 50, MY + 8, 44, 40, '-', 'nav:zoom-', { fs: 26, col: C.pas });
    // ---- right panel: auto navigate
    g.fillStyle = C.dim; g.font = 'bold 20px ' + FONT; g.fillText('AUTO NAVIGATE', PX, MY + 14);
    STYLES.forEach((k, i) => { const d = styleDef(k); LS.btn(g, PX + (i % 2) * 168, MY + 28 + Math.floor(i / 2) * 62, 160, 54, d.label.toUpperCase(), 'nav:style:' + k, { col: k === 'emergency' ? C.hos : k === 'combat' ? C.amber : k === 'stealth' ? C.sus : C.ok, on: N.style === k, fs: 20 }); });
    // ---- the g slider
    const sy = MY + 176, gv = gOf(), what = !N.sel ? 'SELECT A MARKER OR LEG' : N.sel.t === 'wp' ? 'ELBOW ' + (N.sel.i + 1) + ': FLIP G' : 'LEG ' + (N.sel.i + 1) + ': BURN G';
    g.fillStyle = C.txt; g.font = 'bold 20px ' + FONT; g.fillText(what, PX, sy); g.textAlign = 'right'; g.fillStyle = gv != null ? BAND[e.gBand(gv)] : C.dim; g.font = 'bold 28px ' + FONT; g.fillText(gv != null ? gv.toFixed(gv % 1 ? 2 : 1) + ' g' : '', PX + PW, sy + 2); g.textAlign = 'left';
    const D = e.G_DETENTS, cw = PW / D.length;
    D.forEach((v, i) => { const x = PX + i * cw, on = gv != null && Math.abs(gv - v) < 1e-6, col = BAND[e.gBand(v)]; g.fillStyle = on ? col : col + '30'; g.fillRect(x + 1, sy + 20, cw - 2, 52); if (LS.hov('nav:g:' + v)) { g.strokeStyle = '#fff'; g.lineWidth = 3; g.strokeRect(x + 1, sy + 20, cw - 2, 52); } LS.reg(x, sy + 20, cw, 52, 'nav:g:' + v, v + ' g'); });
    const xAt = v => PX + (D.indexOf(v) + 0.5) * cw; g.fillStyle = C.amber; g.fillRect(xAt(2) - 1, sy + 14, 3, 66); g.font = '13px ' + FONT; g.fillText('2g strain', xAt(2) - 28, sy + 94);
    const tol = weakest(); if (tol) { const x = PX + clamp(D.findIndex(v => v >= tol) < 0 ? D.length : D.findIndex(v => v >= tol), 0, D.length) * cw; g.fillStyle = C.hos; g.fillRect(x - 1, sy + 14, 3, 66); g.fillText('blackout ' + tol.toFixed(1), Math.min(x - 30, PX + PW - 90), sy + 110); }
    g.font = '13px ' + FONT; g.fillStyle = BAND.quiet; g.fillText('QUIET', PX, sy + 130); g.fillStyle = BAND.firm; g.fillText('FIRM', PX + cw * 3.6, sy + 130); g.fillStyle = BAND.combat; g.fillText('COMBAT', PX + cw * 6.6, sy + 130); g.fillStyle = BAND.emergency; g.fillText('EMERGENCY', PX + cw * 9.6, sy + 130);
    // ---- readout
    const ry = sy + 160; g.fillStyle = C.dim; g.font = 'bold 20px ' + FONT; g.fillText(pv ? 'THIS ROUTE' : 'NO ROUTE DRAFTED', PX, ry);
    if (pv) {
      const rows = [['TIME', LS.fmtS(pv.timeSec)], ['PROPELLANT', pv.propT.toFixed(1) + ' t'], ['PEAK G', pv.peakG.toFixed(1)], ['FLIPS', pv.flips.length + (pv.flips.length ? ' · longest ' + Math.round(Math.max(...pv.flips.map(f => f.dur))) + ' s' : '')], ['STRAIN LINE', pv.strainCrossings ? pv.strainCrossings + ' crossing' + (pv.strainCrossings > 1 ? 's' : '') : 'none']];
      rows.forEach(([k, v], i) => { g.fillStyle = C.dim; g.font = '18px ' + FONT; g.fillText(k, PX, ry + 30 + i * 26); g.fillStyle = C.txt; g.textAlign = 'right'; g.fillText(v, PX + PW, ry + 30 + i * 26); g.textAlign = 'left'; });
      const fy = ry + 30 + rows.length * 26 + 6, cur = (e.gState ? e.gState(s) : []).reduce((a, c) => a + c.fat, 0) / 5, fc = clamp(cur + pv.fatigue, 0, 1);
      g.fillStyle = C.dim; g.font = '18px ' + FONT; g.fillText('CREW FATIGUE', PX, fy); g.fillStyle = '#ffffff18'; g.fillRect(PX + 150, fy - 12, PW - 150, 16); g.fillStyle = fc >= .75 ? C.hos : fc >= .5 ? C.amber : C.ok; g.fillRect(PX + 150, fy - 12, (PW - 150) * fc, 16); g.fillStyle = '#fff'; g.fillRect(PX + 150 + (PW - 150) * cur - 1, fy - 14, 3, 20);
      pv.warn.slice(0, 2).forEach((w, i) => { g.fillStyle = C.amber; g.font = '14px ' + FONT; g.fillText(w.slice(0, 44), PX, fy + 28 + i * 18); });
    }
    LS.btn(g, PX, H - 104, 160, 60, 'ENGAGE', 'nav:engage', { col: C.ok, off: !N.draft.length, fs: 24 }); LS.btn(g, PX + 168, H - 104, 80, 60, 'UNDO', 'nav:undo', { col: C.amber, off: !N.draft.length, fs: 18 }); LS.btn(g, PX + 252, H - 104, 80, 60, 'CLEAR', 'nav:clear', { col: C.hos, off: !N.draft.length && !N.sel, fs: 18 });
    g.fillStyle = C.dim; g.font = '14px ' + FONT; g.fillText(s.posture === 'route' ? 'FLYING A PLAN' : 'HOLDING', PX, H - 28);
    LS.scan(g);
  };

  function toast(t, k) { if (root.CTL_TOAST) root.CTL_TOAST(t, k || 'g'); }
  const applyStyle = (q, k) => { const d = styleDef(k); q.g = d.g; q.flip = d.flip; q.speed = d.speed; };
  function act(id, opt) {
    opt = opt || {}; const s = S(), e = E();
    if (id === 'nav:map') {
      if (!N.v || opt.x == null) return { ok: true };
      let best = null, bd = 1e9; const me = toPx(s.player.x, s.player.y); let prev = me;
      N.draft.forEach((q, i) => { const b = toPx(q.x, q.y), d = Math.hypot(opt.x - b.x, opt.y - b.y); if (d < 18 && d < bd) { best = { t: 'wp', i }; bd = d; } prev = b; });
      if (!best) { prev = me; N.draft.forEach((q, i) => { const b = toPx(q.x, q.y), d = segDist(opt.x, opt.y, prev, b); if (d < 12 && d < bd) { best = { t: 'leg', i }; bd = d; } prev = b; }); }
      if (best) { N.sel = best; return { ok: true }; }
      if (N.draft.length >= 8) { toast('Eight waypoints is the limit', 'w'); return { ok: true }; }
      const w = toWorld(opt.x, opt.y), q = { x: clamp(w.x, 8, (e.P && e.P.arena || 240) - 8), y: clamp(w.y, 8, (e.P && e.P.arena || 240) - 8), kind: 'stop' }; applyStyle(q, N.style);
      if (N.draft.length) N.draft[N.draft.length - 1].kind = 'turn'; N.draft.push(q); N.sel = { t: 'wp', i: N.draft.length - 1 }; return { ok: true };
    }
    if (id.startsWith('nav:style:')) { N.style = id.slice(10); N.draft.forEach(q => applyStyle(q, N.style)); toast('AUTO NAVIGATE: ' + styleDef(N.style).label.toUpperCase() + (N.draft.length ? ' (route re-plotted)' : ' (applies to the next waypoint)'), 'g'); return { ok: true }; }
    if (id.startsWith('nav:g:')) { const v = +id.slice(6), q = N.sel && N.draft[N.sel.i]; if (!q) { toast('Click a marker or a leg first', 'w'); return { ok: true }; } if (N.sel.t === 'wp') q.flip = v; else q.g = v; if (v > s.me.gStrain) toast(v + ' g is over the 2 g strain line: every use tires the crew', 'w'); return { ok: true }; }
    if (id === 'nav:zoom+') { N.view = clamp(N.view * 0.7, 8, 120); return { ok: true }; }
    if (id === 'nav:zoom-') { N.view = clamp(N.view / 0.7, 8, 120); return { ok: true }; }
    if (id === 'nav:undo') { N.draft.pop(); if (N.draft.length) N.draft[N.draft.length - 1].kind = 'stop'; N.sel = null; return { ok: true }; }
    if (id === 'nav:clear') { N.draft = []; N.sel = null; return { ok: true }; }
    if (id === 'nav:engage') { if (!N.draft.length) { toast('Nothing plotted', 'w'); return { ok: false }; } if (root.CTL_ORDER) root.CTL_ORDER('helm', 'route', 'Flight plan, ' + N.draft.length + ' waypoint' + (N.draft.length > 1 ? 's' : ''), { pts: N.draft.map(q => Object.assign({}, q)) }); N.draft = []; N.sel = null; return { ok: true }; }
    return { ok: true };
  }
  root.NAVUI = { act, N };
})(typeof window !== 'undefined' ? window : globalThis);
