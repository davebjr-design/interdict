'use strict';
/* Passive CIC monitors (read-only wall screens) painted from the live hunt: annunciator, helm/nav, power, stores and life support, crew, probes.
   window.PS.ctx = { S, E, A, Y, ann } is set by the page each tick; PS.make(name) -> { c, paint(nowMs) } (a 1024x768 canvas, same as LS).
   Every lamp on the annunciator is a real function: the 32 Annunciator tiles (engine state and station-model calls) plus the SHIPSYS lamps. */
(function (root) {
  const W = 1024, H = 768, F = 'monospace', C = { bg: '#06121a', pan: '#0b222c', line: '#1d4a58', txt: '#bfe6dc', dim: '#5f8a85', amb: '#f0ab3a', red: '#ff4a3d', grn: '#3fd38a', cya: '#3ddbd0', blu: '#4aa8ff' };
  const ctx = { S: null, E: null, A: null, Y: null, ann: null };
  const LAMP = { off: ['#0a1215', '#26363a'], normal: ['#0e3a2a', '#3fd38a'], advisory: ['#0c3b44', '#3ddbd0'], caution: ['#5a3d08', '#f0ab3a'], warning: ['#6a1410', '#ff4a3d'] };
  const hdr = (g, t, sub, col) => { g.fillStyle = C.bg; g.fillRect(0, 0, W, H); g.fillStyle = C.pan; g.fillRect(0, 0, W, 64); g.fillStyle = col || C.cya; g.fillRect(0, 62, W, 3); g.font = 'bold 34px ' + F; g.textAlign = 'left'; g.fillText(t, 24, 44); g.fillStyle = C.dim; g.font = '22px ' + F; g.textAlign = 'right'; g.fillText(sub || '', W - 24, 42); g.textAlign = 'left'; };
  const bar = (g, x, y, w, h, f, col, label, val) => { f = Math.max(0, Math.min(1, f)); g.fillStyle = '#0a1a22'; g.fillRect(x, y, w, h); g.fillStyle = col; g.fillRect(x, y, w * f, h); g.strokeStyle = C.line; g.lineWidth = 2; g.strokeRect(x, y, w, h); if (label) { g.fillStyle = C.txt; g.font = 'bold 20px ' + F; g.textAlign = 'left'; g.fillText(label, x + 8, y + h / 2 + 7); } if (val != null) { g.textAlign = 'right'; g.fillText(val, x + w - 8, y + h / 2 + 7); g.textAlign = 'left'; } };
  const txt = (g, s, x, y, sz, col, al) => { g.font = (sz >= 28 ? 'bold ' : '') + sz + 'px ' + F; g.fillStyle = col || C.txt; g.textAlign = al || 'left'; g.fillText(s, x, y); g.textAlign = 'left'; };
  const KMGM = x => x;
  const P = {
    annun(g, t) {
      const { S, A, Y, ann } = ctx; hdr(g, 'ANNUNCIATOR', 'ALL SHIP SYSTEMS', C.red);
      const groups = [['sen', 'SENSORS'], ['fc', 'FIRE CTL'], ['wpn', 'WEAPONS'], ['helm', 'HELM'], ['eng', 'ENG/THERM'], ['dmg', 'DAMAGE'], ['com', 'COMMS'], ['sys', 'SHIP SYS']];
      const TL = (root.Annunciator && root.Annunciator.TILES) || [], sys = Y ? root.SHIPSYS.lamps(Y, S) : [], cols = {};
      TL.forEach(tl => (cols[tl.st] = cols[tl.st] || []).push({ id: tl.id, label: tl.label, st: ann && ann.lamps[tl.id] ? ann.lamps[tl.id].state : 'off', flash: ann && ann.lamps[tl.id] && ann.lamps[tl.id].flash, why: ann && ann.lamps[tl.id] ? ann.lamps[tl.id].why : tl.tip }));
      cols.sys = sys.map(l => ({ id: l.id, label: l.label, st: l.state, flash: l.state === 'warning', why: l.why }));
      const cw = 122, x0 = 24; let worst = null, rank = { off: 0, normal: 1, advisory: 2, caution: 3, warning: 4 };
      groups.forEach(([k, nm], c) => { const x = x0 + c * (cw + 3); txt(g, nm, x + cw / 2, 100, 17, C.dim, 'center');
        const rh = Math.min(84, 536 / Math.max(1, (cols[k] || []).length)); (cols[k] || []).forEach((l, r) => { const y = 114 + r * rh, col = LAMP[l.st] || LAMP.off, on = l.st !== 'off' && (!l.flash || Math.floor(t * 2.5) % 2 === 0); g.fillStyle = on ? col[0] : LAMP.off[0]; g.fillRect(x, y, cw, rh - 8); g.strokeStyle = on ? col[1] : C.line; g.lineWidth = on && l.st !== 'normal' ? 4 : 2; g.strokeRect(x + 1, y + 1, cw - 2, rh - 10);
          g.fillStyle = on ? col[1] : LAMP.off[1]; g.font = 'bold 17px ' + F; g.textAlign = 'center'; const parts = l.label.split(' '); parts.slice(0, 2).forEach((p, i) => g.fillText(p, x + cw / 2, y + rh * .42 + i * 20 - (parts.length < 2 ? 8 : 0))); g.textAlign = 'left';
          if (l.st !== 'off' && l.st !== 'normal' && (!worst || rank[l.st] > rank[worst.st])) worst = { st: l.st, label: l.label, why: l.why }; }); });
      g.fillStyle = C.pan; g.fillRect(0, 656, W, 112); g.strokeStyle = worst ? LAMP[worst.st][1] : C.line; g.lineWidth = 3; g.strokeRect(1, 656, W - 2, 111);
      const m = ann && ann.master; txt(g, 'MASTER', 30, 692, 18, C.dim); [['WARNING', m && m.warning, C.red], ['CAUTION', m && m.caution, C.amb]].forEach(([n, mm, col], i) => { const lit = mm && mm.lit && (!mm.flash || Math.floor(t * 2.5) % 2 === 0); g.fillStyle = lit ? col : '#17252a'; g.fillRect(30 + i * 150, 704, 140, 44); g.fillStyle = lit ? '#000' : C.dim; g.font = 'bold 19px ' + F; g.textAlign = 'center'; g.fillText(n, 100 + i * 150, 733); g.textAlign = 'left'; });
      txt(g, worst ? worst.label + ': ' + worst.why : 'ALL SYSTEMS NORMAL', 350, 722, 21, worst ? LAMP[worst.st][1] : C.grn); },
    helm(g, t) {
      const { S, E } = ctx; hdr(g, 'HELM / NAVIGATION', 'S' + (S.speed || '') + '  T+' + S.t.toFixed(1) + ' min', C.blu);
      const vx = S.vel ? S.vel.vx : 0, vy = S.vel ? S.vel.vy : 0, spd = Math.hypot(vx, vy), hd = ((S.hdg || 0) * 180 / Math.PI % 360 + 360) % 360, SP = S.shipP || { tank: 250000, mass: 11e6, isp: 8000 };
      const m0 = SP.mass - (SP.tank / 1000 - (S.water || 0)) * 1000;   // current mass: the dry hull plus the water still aboard
      const dvAvail = SP.isp * 9.80665 * Math.log(m0 / Math.max(1, m0 - (S.water || 0) * 1000)) / 1000;
      txt(g, 'SPEED', 30, 110, 20, C.dim); txt(g, spd.toFixed(2), 30, 170, 64, C.txt); txt(g, 'km/min', 250, 170, 22, C.dim);
      txt(g, 'HEADING', 30, 226, 20, C.dim); txt(g, hd.toFixed(0).padStart(3, '0') + '°', 30, 286, 64, C.txt);
      txt(g, 'DRIVE', 330, 110, 20, C.dim); txt(g, ((S.thrust || 0) * 100).toFixed(0) + '%', 330, 170, 64, S.thrust > 1 ? C.amb : C.txt);
      txt(g, 'LOAD', 330, 226, 20, C.dim); txt(g, (S.gNow || 0).toFixed(3) + ' g', 330, 286, 48, C.txt);
      txt(g, 'MODE', 600, 110, 20, C.dim); txt(g, String((S.nav && S.nav.mode) || '—').toUpperCase(), 600, 150, 30, C.cya); txt(g, 'PHASE', 600, 196, 20, C.dim); txt(g, String(S.phase || 'coast').toUpperCase(), 600, 236, 30, C.cya);
      const br = S.brace || 'free', bc = br === 'secure' ? C.grn : br === 'bracing' ? C.amb : (S.unsecure ? C.red : C.dim); txt(g, 'CREW BRACE', 600, 282, 20, C.dim); txt(g, br.toUpperCase(), 800, 282, 26, bc);
      bar(g, 30, 322, 480, 40, (S.water || 0) / (SP.tank / 1000), C.blu, 'DRIVE WATER', (S.water || 0).toFixed(0) + ' / ' + (SP.tank / 1000) + ' t'); g.fillStyle = C.red; g.fillRect(30 + 480 * 20 / 250 - 1, 316, 3, 52); txt(g, 'reserve 20 t', 30 + 480 * 20 / 250 + 6, 394, 16, C.red);
      txt(g, 'DELTA-V LEFT', 540, 346, 20, C.dim); txt(g, dvAvail.toFixed(2) + ' km/s', 540, 392, 36, dvAvail < .4 ? C.amb : C.txt);
      let info = null; try { info = E.planInfo(S); } catch (e) { }
      g.fillStyle = '#05100f'; g.fillRect(30, 420, 964, 330); g.strokeStyle = C.line; g.lineWidth = 2; g.strokeRect(30, 420, 964, 330);
      if (info && info.path && info.path.length > 1) { const xs = info.path.map(p => p.x), ys = info.path.map(p => p.y), x0 = Math.min(...xs, S.player.x) - 3, x1 = Math.max(...xs, S.player.x) + 3, y0 = Math.min(...ys, S.player.y) - 3, y1 = Math.max(...ys, S.player.y) + 3, k = Math.min(940 / (x1 - x0), 306 / (y1 - y0)), X = x => 44 + (x - x0) * k, Y = y => 740 - (y - y0) * k;
        g.strokeStyle = C.cya; g.lineWidth = 3; g.beginPath(); info.path.forEach((p, i) => i ? g.lineTo(X(p.x), Y(p.y)) : g.moveTo(X(p.x), Y(p.y))); g.stroke(); g.fillStyle = C.grn; g.beginPath(); g.arc(X(S.player.x), Y(S.player.y), 8, 0, 7); g.fill();
        (info.wps || []).forEach(w => { g.strokeStyle = C.amb; g.lineWidth = 2; g.strokeRect(X(w.x) - 7, Y(w.y) - 7, 14, 14); });
        txt(g, 'PLAN  Δv ' + (info.dv || 0).toFixed(2) + ' km/s   burn ' + ((info.propT || 0)).toFixed(0) + ' t water   peak ' + (info.peakG || 0).toFixed(2) + ' g' + (info.warn && info.warn.length ? '   ⚠ ' + info.warn[0] : ''), 44, 446, 18, C.txt); }
      else { txt(g, 'NO ACTIVE PLAN: holding on station', 60, 590, 28, C.dim); g.fillStyle = C.grn; g.beginPath(); g.arc(512, 640, 8, 0, 7); g.fill(); } },
    power(g, t) {
      const { S, Y } = ctx; hdr(g, 'POWER / ENGINEERING', 'FUSION PODS · FISSION PLANT · BUS', C.amb); if (!Y) return;
      txt(g, 'FUSION PODS (D-He3)', 30, 100, 20, C.dim); Y.pods.forEach((v, i) => bar(g, 30, 112 + i * 46, 470, 38, v / 100, v > 100 ? C.red : C.amb, 'POD ' + (i + 1), v.toFixed(0) + '%'));
      txt(g, 'FISSION PLANT', 30, 330, 20, C.dim); bar(g, 30, 342, 470, 38, S.hull < 15 ? .4 : 1, C.grn, 'STANDING', '450 MWt / ' + window.SHIPSYS.FISSION_MW + ' MWe');
      txt(g, 'BUS  ' + Y.bus.load.toFixed(0) + ' MW of ' + Y.bus.cap.toFixed(0) + ' MW', 540, 100, 24, Y.bus.load > Y.bus.cap ? C.amb : C.txt);
      Y.bus.parts.forEach(([n, v], i) => bar(g, 540, 116 + i * 40, 450, 32, v / 25, n === 'POINT DEFENCE' && v > 4 ? C.amb : C.cya, n, v.toFixed(1)));
      txt(g, 'FUSION CASSETTES', 30, 436, 20, C.dim); for (let i = 0; i < 8; i++) { const f = Math.max(0, Math.min(1, Y.cass - i)); g.fillStyle = '#0a1a22'; g.fillRect(30 + i * 62, 450, 54, 120); g.strokeStyle = C.line; g.lineWidth = 2; g.strokeRect(30 + i * 62, 450, 54, 120); g.fillStyle = Y.cass <= 2 ? C.amb : C.grn; g.fillRect(30 + i * 62, 450 + 120 * (1 - f), 54, 120 * f); }
      txt(g, Y.cass.toFixed(1) + ' of 8   (one per 21 min at 100% drive)', 30, 604, 20, C.txt);
      txt(g, 'BREACH DRIVE', 540, 440, 20, C.dim); txt(g, S.spool ? 'SPOOLING  ' + Math.max(0, (S.spool.at - S.t) * 60).toFixed(0) + ' s' : 'READY (1 cassette per jump)', 540, 480, 26, S.spool ? C.red : C.grn);
      txt(g, 'LITHIUM LOOP', 540, 534, 20, C.dim); txt(g, Y.liK.toFixed(0) + ' K', 540, 580, 40, Y.liK > 850 ? C.amb : C.txt);
      txt(g, 'derived from hunt state, display only', 30, 750, 16, C.dim); },
    stores(g, t) {
      const { S, Y } = ctx; hdr(g, 'STORES / LIFE SUPPORT', 'WATER · AIR · MAGAZINE', C.grn); if (!Y) return;
      const SP = S.shipP || { tank: 250000 }, tank = SP.tank / 1000;
      txt(g, 'WATER TANKS', 30, 100, 20, C.dim); for (let i = 0; i < 4; i++) { const lo = i * tank / 4, f = Math.max(0, Math.min(1, ((S.water || 0) - lo) / (tank / 4))); bar(g, 30 + i * 120, 112, 112, 150, 0, C.blu); g.fillStyle = C.blu; g.fillRect(30 + i * 120, 112 + 150 * (1 - f), 112, 150 * f); g.strokeStyle = C.line; g.lineWidth = 2; g.strokeRect(30 + i * 120, 112, 112, 150); txt(g, 'T' + (i + 1), 86 + i * 120, 284, 18, C.dim, 'center'); }
      txt(g, (S.water || 0).toFixed(0) + ' t drive + 20 t crew reserve (locked)', 30, 318, 20, C.txt);
      txt(g, 'CABIN ATMOSPHERE', 540, 100, 20, C.dim); bar(g, 540, 112, 450, 40, Y.press / 101.3, Y.press < 95 ? C.amb : C.grn, 'PRESSURE', Y.press.toFixed(0) + ' kPa'); bar(g, 540, 160, 450, 40, Y.o2 / 21, Y.o2 < 19 ? C.amb : C.grn, 'OXYGEN', Y.o2.toFixed(1) + ' %'); bar(g, 540, 208, 450, 40, Y.co2 / 5000, Y.co2 > 1500 ? C.amb : C.grn, 'CO2', Y.co2.toFixed(0) + ' ppm'); txt(g, 'leak ' + Y.leakKpaMin.toFixed(2) + ' kPa/min  ·  souls aboard ' + window.SHIPSYS.SOULS, 540, 282, 20, C.txt);
      const m = S.mag || { total: 0, max: 60, byKind: {} }; txt(g, 'MAGAZINE  ' + m.total + ' / ' + m.max, 30, 380, 26, C.txt); Object.entries(m.byKind || {}).forEach(([k, v], i) => bar(g, 30, 400 + i * 48, 470, 40, v / (m.max || 60), k === 'he' ? C.red : k === 'emp' ? C.cya : C.amb, k.toUpperCase(), String(v)));
      txt(g, 'HEAT SINK', 540, 380, 20, C.dim); bar(g, 540, 392, 450, 40, S.sink.h, S.sink.h > .8 ? C.red : C.amb, 'SINK', (S.sink.h * 100).toFixed(0) + '%'); txt(g, S.vent && S.vent.on ? 'FINS OUT: venting' : 'FINS STOWED', 540, 470, 24, S.vent && S.vent.on ? C.red : C.grn);
      txt(g, 'HULL INTEGRITY', 540, 520, 20, C.dim); bar(g, 540, 532, 450, 40, S.hull / 100, S.hull < 40 ? C.red : S.hull < 70 ? C.amb : C.grn, 'HULL', S.hull.toFixed(0) + '%');
      txt(g, 'derived values display only', 30, 750, 16, C.dim); },
    crew(g, t) {
      const { S, A } = ctx; hdr(g, 'CREW / STATIONS', 'OFFICERS · AUTONOMY · CONDITION', C.cya); const M = A && A.model, au = (M && M.autonomy) || {};
      const rows = [['Quill', 'SENSORS', 'sensors'], ['Abara', 'FIRE · WEAPONS · HELM', 'fire'], ['Castellan', 'ENGINEERING', 'engineering'], ['Dace', 'THERMAL', 'thermal'], ['Fenwick', 'DAMAGE CONTROL', 'damage'], ['Pell', 'COMMS', 'comms']];
      rows.forEach(([n, st, k], i) => { const y = 92 + i * 92, c = S.crew[n], inj = c && c.inj, stun = c && c.stunUntil != null && c.stunUntil > S.t, col = stun ? C.red : inj ? C.amb : C.grn; g.fillStyle = C.pan; g.fillRect(24, y, 976, 82); g.fillStyle = col; g.fillRect(24, y, 10, 82);
        txt(g, n.toUpperCase(), 52, y + 36, 30, C.txt); txt(g, st, 52, y + 68, 18, C.dim); txt(g, (au[k] || 'auto').toUpperCase(), 520, y + 36, 24, C.cya); txt(g, stun ? 'STUNNED' : inj ? (c.treatUntil != null ? 'INJURED: BEING TREATED' : 'INJURED') : n === 'Pell' ? (S.pell ? 'ABOARD' : 'ABSENT') : 'FIT FOR DUTY', 520, y + 68, 20, col); });
      const br = S.brace || 'free'; txt(g, 'CREW STATE', 760, 128, 18, C.dim); txt(g, br.toUpperCase(), 760, 164, 28, br === 'secure' ? C.grn : br === 'bracing' ? C.amb : C.dim); txt(g, 'LOAD ' + (S.gNow || 0).toFixed(2) + ' g', 760, 206, 22, C.txt); txt(g, S.unsecure ? 'UNSECURE UNDER LOAD' : 'secure or at rest', 760, 240, 18, S.unsecure ? C.red : C.dim);
      txt(g, 'SOULS ABOARD ' + window.SHIPSYS.SOULS + ' (24 crew racks · 6 officer racks · CO)', 30, 750, 18, C.dim); },
    probes(g, t) {
      const { S } = ctx; hdr(g, 'PROBES / DATA LINKS', 'LASER · RADIO · SALVO PROBES', C.blu);
      (S.pset || []).forEach((p, i) => { const y = 92 + i * 160, left = p.state === 'out' || p.state === 'deployed' ? Math.max(0, p.endurance - (S.t - (p.t0 || 0))) : p.endurance; g.fillStyle = C.pan; g.fillRect(24, y, 976, 146); g.strokeStyle = p.state === 'lost' ? C.red : C.line; g.lineWidth = 2; g.strokeRect(24, y, 976, 146);
        txt(g, 'SET ' + p.id + '  ' + (p.name || p.key), 44, y + 40, 28, C.txt); txt(g, String(p.state).toUpperCase(), 760, y + 40, 26, p.state === 'rack' ? C.dim : p.state === 'lost' ? C.red : C.grn); txt(g, 'LINK: ' + (p.link || '—') + (p.state !== 'rack' ? (p.linkOk ? ' OK' : ' BROKEN') : ''), 44, y + 80, 22, p.state !== 'rack' && !p.linkOk ? C.amb : C.cya); bar(g, 44, y + 96, 700, 32, left / (p.endurance || 1), C.blu, 'BATTERY', left.toFixed(1) + ' / ' + p.endurance + ' min'); });
      const n = (S.probes || []).length; txt(g, 'PROBE MISSILES IN FLIGHT: ' + n, 44, 470, 26, n ? C.amb : C.dim);
      txt(g, 'MAGAZINE ' + (S.mag ? S.mag.total : 0) + ' / ' + (S.mag ? S.mag.max : 0), 44, 520, 22, C.txt); txt(g, 'PD ' + String(S.pd || 'armed').toUpperCase(), 44, 560, 22, S.pd === 'active' ? C.red : C.grn); }
  };

  // ---- Command view: the round overview scope and the six station tiles (docs/command_experience.md)
  const SIZE = { overview: [768, 768], tiles: [1536, 256] };
  const TILES = [['Quill', 'SENSORS', 'sensors'], ['Abara', 'TAC / HELM', 'fire'], ['Castellan', 'ENGINEERING', 'engineering'], ['Dace', 'THERMAL', 'thermal'], ['Fenwick', 'DAMAGE CTL', 'damage'], ['Pell', 'SHIP AI', 'comms']];
  const POST = { silent: 'SILENT RUN', cruise: 'CRUISE', combat: 'COMBAT', evade: 'EVADE' };
  const relOf = a => { const { S, E } = ctx, p = a.idStatus === 'plan' ? E.truePos(a, S.t) : E.displayPos(S, a), me = S.player; return { x: p.x - me.x, y: p.y - me.y, rng: Math.hypot(p.x - me.x, p.y - me.y) }; };
  const cstyle = (a, S) => { const foe = (S.inc || []).some(v => v.id === a.id && v.foe !== false && v.seen !== false); if (a.state === 'disabled') return ['#5f8a85', 'DEAD', 0]; if (a.kind === 'friend' && (a.idStatus === 'plan' || a.idStatus === 'confirmed')) return ['#4aa8ff', 'ALLY', 0]; if (a.idStatus === 'hostile' || foe) return [C.red, foe ? 'FIRING' : 'HOSTILE', 5]; if (a.state === 'locked') return [C.cya, 'LOCKED', 4]; if (a.stage > 0 || a.known) return [C.amb, 'TRACK', 3]; return ['#8aa6a0', 'SUSPECT', 1]; };
  P.overview = function (g, t) {
    const { S, E, Y } = ctx, cx = 384, cy = 384, R = 300; g.clearRect(0, 0, 768, 768);
    g.fillStyle = '#04101a'; g.beginPath(); g.arc(cx, cy, 372, 0, 7); g.fill(); g.strokeStyle = C.line; g.lineWidth = 4; g.beginPath(); g.arc(cx, cy, 372, 0, 7); g.stroke();
    // ring gauges: four arcs outside the scope (speed, heat, hull, power)
    const rungs = ['v1', 'v2', 'v3', 'v4', 'v5', 'ab'], sp = Math.max(0, rungs.indexOf(S.speed)) / 5, heat = S.sink ? S.sink.h : 0, hull = (S.hull == null ? 100 : S.hull) / 100, pw = Y && Y.bus ? Y.bus.load / Math.max(1, Y.bus.cap) : 0;
    [['SPEED', sp, C.cya, 0], ['HEAT', heat, heat > .8 ? C.red : C.amb, 1], ['HULL', hull, hull < .4 ? C.red : hull < .7 ? C.amb : C.grn, 2], ['POWER', Math.min(1, pw), pw > 1 ? C.red : C.blu, 3]].forEach(([nm, f, col, q]) => { const a0 = -Math.PI / 2 + q * Math.PI / 2 + .12, span = Math.PI / 2 - .24; g.lineWidth = 16; g.strokeStyle = '#0d2530'; g.beginPath(); g.arc(cx, cy, 346, a0, a0 + span); g.stroke(); g.strokeStyle = col; g.beginPath(); g.arc(cx, cy, 346, a0, a0 + span * Math.max(.01, Math.min(1, f))); g.stroke();
      const am = a0 + span / 2; g.fillStyle = C.dim; g.font = 'bold 17px ' + F; g.textAlign = 'center'; g.fillText(nm, cx + Math.cos(am) * 318, cy + Math.sin(am) * 318 + 6); });
    // scope
    g.save(); g.beginPath(); g.arc(cx, cy, R, 0, 7); g.clip(); g.fillStyle = '#03121a'; g.fillRect(0, 0, 768, 768);
    const live = (S.an || []).filter(a => a.state !== 'out'), maxR = Math.max(30, ...live.map(a => relOf(a).rng)) * 1.15, k = R / maxR;
    g.strokeStyle = 'rgba(61,219,208,.22)'; g.lineWidth = 1.5; g.fillStyle = 'rgba(95,138,133,.9)'; g.font = '15px ' + F; for (let i = 1; i <= 3; i++) { g.beginPath(); g.arc(cx, cy, R * i / 3, 0, 7); g.stroke(); g.textAlign = 'left'; g.fillText(Math.round(maxR * i / 3), cx + 6, cy - R * i / 3 + 16); }
    for (let d = 0; d < 360; d += 30) { const a = (d - 90) * Math.PI / 180; g.beginPath(); g.moveTo(cx + Math.cos(a) * R * .93, cy + Math.sin(a) * R * .93); g.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); g.stroke(); }
    const sw = (t * .5) % (2 * Math.PI); const gr = g.createConicGradient ? g.createConicGradient(sw, cx, cy) : null; if (gr) { gr.addColorStop(0, 'rgba(61,219,208,.18)'); gr.addColorStop(.12, 'rgba(61,219,208,0)'); gr.addColorStop(1, 'rgba(61,219,208,0)'); g.fillStyle = gr; g.fillRect(0, 0, 768, 768); }
    const sel = root.LS && root.LS.ctx ? root.LS.ctx.sel : null;
    live.forEach(a => { const r = relOf(a), [col, lab, tier] = cstyle(a, S), x = cx + r.x * k, y = cy - r.y * k, rr = tier >= 4 ? 11 : 8; g.strokeStyle = col; g.fillStyle = col; g.lineWidth = 3; g.beginPath(); g.moveTo(x, y - rr); g.lineTo(x + rr, y); g.lineTo(x, y + rr); g.lineTo(x - rr, y); g.closePath(); if (tier >= 3) g.fill(); else { if (tier === 1) g.setLineDash([3, 3]); g.stroke(); g.setLineDash([]); }
      if (tier >= 5) { g.globalAlpha = .55; g.beginPath(); g.arc(x, y, rr * 1.8 + 2 * Math.sin(t * 8), 0, 7); g.stroke(); g.globalAlpha = 1; } if (sel === a.id) { g.strokeStyle = '#fff'; g.lineWidth = 2; g.strokeRect(x - 17, y - 17, 34, 34); } g.fillStyle = col; g.font = 'bold 16px ' + F; g.textAlign = 'left'; g.fillText('S' + (a.id + 1), x + 14, y - 10); });
    const hd = S.hdg || 0; g.strokeStyle = '#ffffff'; g.fillStyle = '#ffffff'; g.lineWidth = 2; g.beginPath(); g.moveTo(cx + Math.sin(hd) * 20, cy - Math.cos(hd) * 20); g.lineTo(cx - Math.sin(hd + 2.5) * 12, cy + Math.cos(hd + 2.5) * 12); g.lineTo(cx - Math.sin(hd - 2.5) * 12, cy + Math.cos(hd - 2.5) * 12); g.closePath(); g.fill();
    g.restore();
    // posture, incoming and the top threats
    g.textAlign = 'center'; g.fillStyle = C.txt; g.font = 'bold 22px ' + F; g.fillText((POST[root.POSTURE ? root.POSTURE.current : 'cruise'] || 'CRUISE'), cx, 40);
    const inc = (S.inc || []).filter(v => v.seen !== false && v.foe !== false); if (inc.length && Math.floor(t * 3) % 2 === 0) { g.fillStyle = C.red; g.font = 'bold 26px ' + F; g.fillText('INCOMING x' + inc.length, cx, cy - 120); }
    const thr = live.map(a => ({ a, s: cstyle(a, S), r: relOf(a).rng })).sort((p, q) => q.s[2] - p.s[2] || p.r - q.r).slice(0, 5);
    g.textAlign = 'center'; g.font = '16px ' + F; thr.forEach((o, i) => { g.fillStyle = o.s[0]; g.fillText('S' + (o.a.id + 1) + ' ' + o.s[1] + ' ' + o.r.toFixed(0), cx, 596 + i * 18); });
    const tc = root.CTL && root.CTL.topCall && root.CTL.topCall(); g.textAlign = 'center'; if (tc) { g.fillStyle = Math.floor(t * 2) % 2 ? C.amb : C.txt; g.font = 'bold 19px ' + F; g.fillText(String(tc.officer).toUpperCase() + ' CALLING', cx, 712); } else { g.fillStyle = C.dim; g.font = '18px ' + F; g.fillText('NO CALLS WAITING', cx, 712); }
    g.textAlign = 'left';
  };
  P.tiles = function (g, t) {
    const { S, A } = ctx, tc = root.CTL && root.CTL.topCall && root.CTL.topCall(); g.clearRect(0, 0, 1536, 256);
    TILES.forEach(([nm, role, stn], i) => { const x = i * 256 + 6, w = 244, c = S.crew && S.crew[nm], hurt = c && c.inj, down = c && A && A.stunned && A.stunned(stn), calling = tc && tc.officer === nm, mode = A && A.model && A.model.autonomy[stn] || 'auto', ko = c && c.ko;
      g.fillStyle = ko ? '#1a1a1a' : down ? '#2a0e0c' : calling ? '#2e2308' : '#0b222c'; g.fillRect(x, 6, w, 244); g.strokeStyle = ko || down ? C.red : calling && Math.floor(t * 2.5) % 2 ? C.amb : hurt ? C.amb : C.line; g.lineWidth = 4; g.strokeRect(x, 6, w, 244);
      g.fillStyle = ko ? C.dim : C.txt; g.font = 'bold 36px ' + F; g.textAlign = 'left'; g.fillText(nm.toUpperCase(), x + 14, 52); g.fillStyle = C.dim; g.font = '20px ' + F; g.fillText(role, x + 14, 82);
      g.fillStyle = mode === 'hands-on' ? C.cya : mode === 'supervised' ? C.amb : C.grn; g.font = 'bold 22px ' + F; g.fillText(String(mode).toUpperCase(), x + 14, 130);
      const stt = ko ? 'KNOCKED OUT' : down ? 'STUNNED' : hurt ? 'HURT' : calling ? 'CALLING' : 'STANDING BY'; g.fillStyle = ko || down ? C.red : hurt || calling ? C.amb : C.dim; g.font = '22px ' + F; g.fillText(stt, x + 14, 176);
      g.fillStyle = C.dim; g.font = '16px ' + F; g.fillText('F' + (i + 1), x + 14, 232); });
  };
  const SZ = n => SIZE[n] || [W, H];
  function make(name) { const c = document.createElement('canvas'), [cw, ch] = SZ(name); c.width = cw; c.height = ch; const g = c.getContext('2d'); const o = { name, c, paint(now) { if (!ctx.S) { g.fillStyle = C.bg; g.fillRect(0, 0, cw, ch); return; } try { P[name](g, (now || performance.now()) / 1000); } catch (e) { g.fillStyle = '#400'; g.fillRect(0, 0, cw, ch); g.fillStyle = '#fff'; g.font = '20px monospace'; g.fillText(name + ' ' + e.message, 20, 60); if (!o.warned) { o.warned = 1; console.error('passive ' + name, e); } } } }; return o; }
  root.PS = { ctx, make, NAMES: Object.keys(P), W, H };
})(typeof window !== 'undefined' ? window : globalThis);
