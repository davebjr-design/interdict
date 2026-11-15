/* Maneuver planner prototype: click waypoints, get the burns, flips and arcs a Newtonian ship would fly.
 *   node sim/maneuver_proto.js [out.svg]
 * 2D, SI units (metres, seconds). Not wired to the engine; docs/maneuver_model.md describes the model.
 *
 * Model: state (position p, velocity v, heading psi). The main engines push along the heading (a = 0.15 g at 100 percent).
 * The heading changes by a rest-to-rest bang-bang rotation (rotTime) while the ship coasts, so velocity does not change in a turn.
 * Waypoints: 'turn' (change the velocity vector to head for the next point at cruise speed) and a final 'stop'.
 * A turn is a "delta-v turn and burn": rotate to face dv = v_out - v_in, burn |dv| / a, coast. A stop is flip, burn, rest. */
(function (root) {
  const SHIP = { mass: 11e6, a: 0.15 * 9.81, alpha: 5.6e-4, omegaMax: 0.05, isp: 8000 };   // kg, m/s2, rad/s2 (RCS couple), rad/s, s
  const rotTime = (dth, S = SHIP) => { dth = Math.abs(dth); const tr = 2 * Math.sqrt(dth / S.alpha); const w = S.alpha * tr / 2; return w <= S.omegaMax ? tr : dth / S.omegaMax + S.omegaMax / S.alpha; };
  const wrap = x => { while (x > Math.PI) x -= 2 * Math.PI; while (x < -Math.PI) x += 2 * Math.PI; return x; };
  const len = v => Math.hypot(v.x, v.y), sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y }), add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y }), mul = (a, k) => ({ x: a.x * k, y: a.y * k }), unit = v => { const l = len(v) || 1; return { x: v.x / l, y: v.y / l }; }, ang = v => Math.atan2(v.y, v.x);

  /* plan(start {p,v,psi}, waypoints [{p, kind: 'turn'|'stop'}], opts {cruise}) -> { segs, path, stats } */
  function plan(start, wps, opts = {}, S = SHIP) {
    const cruise = opts.cruise || 80, A = S.a; let st = { t: 0, p: { ...start.p }, v: { ...start.v }, psi: start.psi };
    const segs = [], warn = [];
    const push = (kind, dur, a0) => { segs.push({ kind, t0: st.t, dur, p0: { ...st.p }, v0: { ...st.v }, psi0: st.psi, acc: a0 ? { ...a0 } : { x: 0, y: 0 } }); };
    const coast = d => { if (d <= 0) return; push('coast', d); st.p = add(st.p, mul(st.v, d)); st.t += d; };
    const rotate = target => { const d = wrap(target - st.psi), dur = rotTime(d); if (dur < 1e-6) return; segs.push({ kind: 'rotate', t0: st.t, dur, p0: { ...st.p }, v0: { ...st.v }, psi0: st.psi, psi1: st.psi + d, acc: { x: 0, y: 0 } }); st.p = add(st.p, mul(st.v, dur)); st.psi = st.psi + d; st.t += dur; };
    const burn = (dir, T, kind = 'burn') => { const a = mul(dir, A); push(kind, T, a); st.p = add(add(st.p, mul(st.v, T)), mul(a, 0.5 * T * T)); st.v = add(st.v, mul(a, T)); st.t += T; };
    const rotDur = target => rotTime(wrap(target - st.psi));
    let dvTotal = 0;
    // from the start: head for waypoint 1 at cruise speed (a stop-only plan is handled by the stop code)
    const first = wps[0];
    for (let i = 0; i < wps.length; i++) {
      const w = wps[i], next = wps[i + 1];
      if (w.kind === 'stop') {
        // brake: flip to retrograde, burn |v| / a, arrive at rest at w.p. Burn displacement along v is |v| T / 2.
        const sp = len(st.v);
        if (sp < 1) { const d = unit(sub(w.p, st.p)); rotate(ang(d)); const D = len(sub(w.p, st.p)); const T = Math.sqrt(D / A); burn(d, T, 'burn'); burn(mul(d, -1), T, 'brake'); dvTotal += 2 * A * T; continue; }
        const T = sp / A, dirV = unit(st.v), retro = ang(mul(dirV, -1)), rt = rotDur(retro);
        // burn starts when the ship is |v| T / 2 short of the stop point; rotation begins rt earlier; aim along the line to w.p
        const toW = sub(w.p, st.p), along = toW.x * dirV.x + toW.y * dirV.y, startAlong = along - sp * T / 2, tc = (startAlong / sp) - rt;
        if (tc < 0) warn.push(`stop ${i + 1}: leg is ${Math.round(-tc * sp)} m too short for the flip and brake; the ship overshoots`);
        coast(Math.max(0, tc)); rotate(retro); burn(mul(dirV, -1), T, 'brake'); dvTotal += sp; continue;
      }
      // turn: speed up (or change velocity) to head for the next point at cruise speed
      const aimFrom = p => unit(sub(next ? next.p : w.p, p));
      // is this the first waypoint reached from rest? then the entry velocity is the start velocity.
      if (i === 0) {
        const d1 = unit(sub(w.p, st.p)), v1 = mul(d1, cruise), dv = sub(v1, st.v), T = len(dv) / A, dir = unit(dv);
        rotate(ang(dir)); burn(dir, T, 'burn'); dvTotal += len(dv);
      }
      // now moving at cruise toward w; the turn burn starts s before the corner so the arc is symmetric about it
      const vin = { ...st.v }, sp = len(vin), din = unit(vin);
      let s = 0, dv, T, dir, p0, vout;
      for (let it = 0; it < 30; it++) {
        const pb = sub(w.p, mul(din, s)), vo = mul(aimFrom(add(pb, mul(vin, 0))), cruise);   // first guess: aim from burn start
        vout = vo; dv = sub(vout, vin); T = len(dv) / A; dir = unit(dv);
        const pend = add(add(pb, mul(vin, T)), mul(mul(dir, A), 0.5 * T * T));
        vout = mul(aimFrom(pend), cruise); dv = sub(vout, vin); T = len(dv) / A; dir = unit(dv);
        const ns = sp * T / 2; if (Math.abs(ns - s) < 0.5) { s = ns; break; } s = ns;
      }
      p0 = sub(w.p, mul(din, s));
      const rt = rotDur(ang(dir)), toP = sub(p0, st.p), tc = (toP.x * din.x + toP.y * din.y) / sp - rt;
      if (tc < 0) warn.push(`turn ${i + 1}: leg is ${Math.round(-tc * sp)} m too short for the rotation; the ship will cut the corner late`);
      coast(Math.max(0, tc)); rotate(ang(dir)); burn(dir, T, 'turnburn'); dvTotal += len(dv);
      w.cut = len(sub(w.p, closestOnPath(segs.slice(-1)[0], w.p)));
    }
    // sample the path
    const path = []; for (const sg of segs) { const n = Math.max(2, Math.ceil(sg.dur / 2)); for (let k = 0; k <= n; k++) { const tt = sg.dur * k / n, p = add(add(sg.p0, mul(sg.v0, tt)), mul(sg.acc, 0.5 * tt * tt)); const psi = sg.kind === 'rotate' ? sg.psi0 + (sg.psi1 - sg.psi0) * rotProfile(tt / sg.dur) : (sg.psi0); path.push({ t: sg.t0 + tt, p, kind: sg.kind, psi }); } }
    const ve = S.isp * 9.81, prop = S.mass * (1 - Math.exp(-dvTotal / ve));
    return { segs, path, warn, stats: { time: st.t, dv: dvTotal, propT: prop / 1000, end: st } };
  }
  const rotProfile = u => u < 0.5 ? 2 * u * u : 1 - 2 * (1 - u) * (1 - u);   // bang-bang angle fraction (accelerate then decelerate)
  function closestOnPath(seg, q) { let best = seg.p0, bd = 1e18; for (let k = 0; k <= 40; k++) { const tt = seg.dur * k / 40, p = add(add(seg.p0, mul(seg.v0, tt)), mul(seg.acc, 0.5 * tt * tt)); const d = len(sub(p, q)); if (d < bd) { bd = d; best = p; } } return best; }

  function svg(res, wps, start) {
    const W = 1300, H = 880, pad = 70, all = res.path.map(q => q.p).concat(wps.map(w => w.p), [start.p]);
    const xs = all.map(p => p.x), ys = all.map(p => p.y), x0 = Math.min(...xs) - 8000, x1 = Math.max(...xs) + 8000, y0 = Math.min(...ys) - 8000, y1 = Math.max(...ys) + 8000;
    const k = Math.min((W - 2 * pad - 330) / (x1 - x0), (H - 2 * pad) / (y1 - y0)), X = x => pad + (x - x0) * k, Y = y => H - pad - (y - y0) * k;
    const col = { burn: '#4aa3ff', turnburn: '#6fd1ff', coast: '#f2c14e', rotate: '#f2c14e', brake: '#ff6a5c' };
    let o = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="Helvetica, Arial, sans-serif"><rect width="${W}" height="${H}" fill="#0c1422"/>`;
    for (let g = Math.ceil(x0 / 20000) * 20000; g < x1; g += 20000) o += `<line x1="${X(g)}" y1="${Y(y0)}" x2="${X(g)}" y2="${Y(y1)}" stroke="#16253b"/><text x="${X(g)}" y="${H - 44}" fill="#5d7694" font-size="12" text-anchor="middle">${g / 1000} km</text>`;
    for (let g = Math.ceil(y0 / 20000) * 20000; g < y1; g += 20000) o += `<line x1="${X(x0)}" y1="${Y(g)}" x2="${X(x1)}" y2="${Y(g)}" stroke="#16253b"/><text x="40" y="${Y(g) + 4}" fill="#5d7694" font-size="12" text-anchor="end">${g / 1000}</text>`;
    // instant-turn baseline
    o += `<polyline fill="none" stroke="#51647d" stroke-dasharray="4 6" stroke-width="2" points="${[start.p].concat(wps.map(w => w.p)).map(p => X(p.x) + ',' + Y(p.y)).join(' ')}"/>`;
    // path by phase
    let cur = null, pts = []; const flush = () => { if (pts.length > 1) o += `<polyline fill="none" stroke="${col[cur]}" stroke-width="${cur === 'rotate' ? 3 : 5}" ${cur === 'rotate' ? 'stroke-dasharray="3 6"' : ''} stroke-linecap="round" points="${pts.join(' ')}"/>`; pts = []; };
    for (const q of res.path) { if (q.kind !== cur) { const last = pts[pts.length - 1]; flush(); cur = q.kind; if (last) pts.push(last); } pts.push(X(q.p.x) + ',' + Y(q.p.y)); } flush();
    // heading ticks every 20 s
    let nextT = 0; for (const q of res.path) if (q.t >= nextT) { nextT = q.t + 25; const a = q.psi, x = X(q.p.x), y = Y(q.p.y), L = 11; o += `<g transform="translate(${x},${y}) rotate(${-a * 180 / Math.PI})"><polygon points="${L},0 ${-L * 0.6},${L * 0.55} ${-L * 0.6},${-L * 0.55}" fill="#e8f1ff" opacity=".85"/></g>`; }
    // phase time labels
    let li = 0; for (const sg of res.segs) if (sg.kind !== 'coast') { li++; const q = res.path.find(z => z.t >= sg.t0 + sg.dur / 2); if (q) o += `<text x="${X(q.p.x) + 14}" y="${Y(q.p.y) - 14 - (li % 3) * 15}" fill="${col[sg.kind]}" font-size="13">${sg.kind === 'rotate' ? 'flip/turn' : sg.kind === 'brake' ? 'brake' : 'burn'} ${Math.round(sg.dur)} s</text>`; }
    wps.forEach((w, i) => { o += `<circle cx="${X(w.p.x)}" cy="${Y(w.p.y)}" r="9" fill="none" stroke="#9affc9" stroke-width="3"/><text x="${X(w.p.x) + 16}" y="${Y(w.p.y) + 34}" fill="#9affc9" font-size="15" font-weight="700">${w.kind === 'stop' ? 'STOP' : 'TURN ' + (i + 1)}</text>`; });
    o += `<circle cx="${X(start.p.x)}" cy="${Y(start.p.y)}" r="7" fill="#fff"/><text x="${X(start.p.x) + 12}" y="${Y(start.p.y) + 20}" fill="#fff" font-size="15">start (at rest)</text>`;
    // side panel
    const px = W - 310; o += `<rect x="${px}" y="60" width="270" height="380" rx="10" fill="#111d30" stroke="#2a3f5e"/>`;
    const L = [['Plan', '#f2a93b', 20], [`time  ${Math.floor(res.stats.time / 60)} min ${Math.round(res.stats.time % 60)} s`, '#cfe0f5', 16], [`delta-v  ${res.stats.dv.toFixed(0)} m/s`, '#cfe0f5', 16], [`propellant  ${res.stats.propT.toFixed(1)} t`, '#cfe0f5', 16], ['(8,000 s specific impulse)', '#7f95b3', 13]];
    L.forEach((l, i) => o += `<text x="${px + 18}" y="${92 + i * 26}" fill="${l[1]}" font-size="${l[2]}" font-weight="${i ? 400 : 700}">${l[0]}</text>`);
    const leg = [['blue: burn (loud, hot)', col.burn], ['yellow dotted: flip or turn, coasting (quiet)', col.coast], ['red: brake burn (loud)', col.brake], ['white arrows: ship heading, every 20 s', '#e8f1ff'], ['grey dashed: what an instant turn would do', '#51647d']];
    leg.forEach((l, i) => o += `<text x="${px + 18}" y="${240 + i * 24}" fill="${l[1]}" font-size="13">${l[0]}</text>`);
    (res.warn.length ? res.warn : ['no warnings']).forEach((w, i) => o += `<text x="${px + 18}" y="${380 + i * 18}" fill="#ff9d84" font-size="12">${w.slice(0, 44)}</text>`);
    o += `<text x="60" y="44" fill="#e6f0ff" font-size="26" font-weight="700">Maneuver plan: three clicks, with inertia</text></svg>`;
    return o;
  }
  const API = { SHIP, plan, rotTime, svg }; root.Maneuver = API; if (typeof module !== 'undefined') module.exports = API;
  if (typeof require !== 'undefined' && require.main === module) {
    const start = { p: { x: 10000, y: 20000 }, v: { x: 0, y: 0 }, psi: 0 };
    const wps = [{ p: { x: 90000, y: 30000 }, kind: 'turn' }, { p: { x: 140000, y: 110000 }, kind: 'turn' }, { p: { x: 70000, y: 150000 }, kind: 'stop' }];
    const res = plan(start, wps, { cruise: 80 });
    console.log('time', res.stats.time.toFixed(0), 's  dv', res.stats.dv.toFixed(0), 'm/s  propellant', res.stats.propT.toFixed(1), 't', res.warn);
    console.log('flip 180 deg RCS only:', rotTime(Math.PI).toFixed(0), 's; stop from 80 m/s:', (80 / SHIP.a).toFixed(0), 's over', (80 * 80 / 2 / SHIP.a / 1000).toFixed(1), 'km');
    require('fs').writeFileSync(process.argv[2] || 'maneuver_proto.svg', svg(res, wps, start));
  }
})(typeof window !== 'undefined' ? window : globalThis);
