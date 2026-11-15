/* Flight model: Newtonian flight for every ship in every mission (docs/maneuver_model.md, docs/mechanics_flight.md). Pure functions, no DOM, no engine import.
 *   SI units throughout (metres, seconds, radians, kg). The engine converts at its boundary (1 km = 1000 m, 1 game minute = 60 s of fiction).
 *
 *   Flight.plan(start {p:{x,y}, v:{x,y}, psi, omega}, waypoints [{p, kind:'turn'|'stop', cruise?, thrust?}], opts {cruise, thrust, ship}) -> plan
 *   Flight.stateAt(plan, tau)        state {p, v, psi, w, kind, thrust, g} at tau seconds into the plan (past its end the ship coasts on)
 *   Flight.step(state, cmd, dt)      the integrator: one step of constant thrust along the heading plus a bang-bang rotation (used by tests and by anything that flies by hand)
 *   Flight.rotTime(theta)            time-optimal rest-to-rest rotation: 2 sqrt(theta / alpha)
 *   Flight.stopDistance(v, a)        v^2 / 2a
 *
 * Model: state = position, velocity, heading psi (the drive points along psi: thrust is "down", toward the engines, while a burn runs), spin rate w.
 *   The ship cannot change direction instantly: it rotates (RCS couple, alpha) while coasting, then burns along the new heading. Gimbals steer only while burning (a bonus rotation rate;
 *   the planner ignores it, so a plan is conservative). A plan is a list of segments with constant acceleration (burn, turnburn, brake) or none (coast, rotate), so a position at any time is closed form.
 * Waypoints: 'turn' = change velocity to head for the next point at the cruise speed (delta-v turn and burn); 'stop' = flip, burn, come to rest on the point.
 * Phases: rotate (flip or turn, coasting, quiet), burn (accelerate to cruise), turnburn (change velocity at a corner), coast (silent run), brake (retrograde burn). */
(function (root) {
  'use strict';
  const G0 = 9.80665;
  const SHIP = {   // the 140 m hull: about 11,000 t, 100 percent drive 0.15 g, redline 0.4 g for about 3 minutes, emergency 2.5 g for about 9 seconds, RCS spin 5.6e-4 rad/s2 (a 180 degree flip is about 150 s)
    mass: 11e6, a100: 0.15 * G0, aRedline: 0.4 * G0, aEmergency: 2.5 * G0, redlineT: 180, emergencyT: 9,
    alpha: 5.6e-4, alphaGimbal: 5e-3, omegaMax: 0.05, isp: 8000, tank: 250e3 };
  const TAU = 2 * Math.PI, EPS = 1e-9;
  const wrap = x => { x = (x + Math.PI) % TAU; if (x < 0) x += TAU; return x - Math.PI; };
  const len = v => Math.hypot(v.x, v.y), sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y }), add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y }), mul = (a, k) => ({ x: a.x * k, y: a.y * k });
  const unit = v => { const l = len(v); return l > EPS ? { x: v.x / l, y: v.y / l } : { x: 1, y: 0 }; }, ang = v => Math.atan2(v.y, v.x), dir = psi => ({ x: Math.cos(psi), y: Math.sin(psi) }), dot = (a, b) => a.x * b.x + a.y * b.y;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // ---- rotation ----
  function rotTime(dth, S = SHIP) {   // rest to rest, bang-bang: accelerate half way, decelerate half way (rate-limited at omegaMax)
    dth = Math.abs(dth); if (dth < EPS) return 0; const tr = 2 * Math.sqrt(dth / S.alpha), w = S.alpha * tr / 2;
    return w <= S.omegaMax ? tr : dth / S.omegaMax + S.omegaMax / S.alpha;
  }
  function rotAt(dth, T, tau, S = SHIP) {   // heading change (signed) and rate after tau seconds of a rest-to-rest rotation of dth radians that takes T seconds
    const sg = dth < 0 ? -1 : 1, d = Math.abs(dth); tau = clamp(tau, 0, T); if (d < EPS || T < EPS) return { a: dth, w: 0 };
    const a = S.alpha, tr = 2 * Math.sqrt(d / a);
    if (a * tr / 2 <= S.omegaMax + 1e-12) { const half = T / 2; return tau < half ? { a: sg * 0.5 * a * tau * tau, w: sg * a * tau } : { a: sg * (d - 0.5 * a * (T - tau) ** 2), w: sg * a * (T - tau) }; }
    const ta = S.omegaMax / a, da = 0.5 * S.omegaMax * ta;   // trapezoid: accelerate, hold omegaMax, decelerate
    if (tau < ta) return { a: sg * 0.5 * a * tau * tau, w: sg * a * tau };
    if (tau < T - ta) return { a: sg * (da + S.omegaMax * (tau - ta)), w: sg * S.omegaMax };
    return { a: sg * (d - 0.5 * a * (T - tau) ** 2), w: sg * a * (T - tau) };
  }
  function slewPhases(x, w, alpha, wmax) {   // the time-optimal bang-bang rotation from error x (signed, radians) and rate w to rest on the target: [{ dur, acc }] (signed rad/s2)
    const ph = [], sg = x >= 0 ? 1 : -1, xa = Math.abs(x), wt = w * sg;
    if (xa < 1e-10 && Math.abs(w) < 1e-10) return ph;
    if (xa - wt * Math.abs(wt) / (2 * alpha) < -1e-12) {   // cannot stop in time: brake first, then come back from rest
      const T = Math.abs(w) / alpha, s2 = w < 0 ? -1 : 1; ph.push({ dur: T, acc: -s2 * alpha }); return ph.concat(slewPhases(x - (w * T - s2 * 0.5 * alpha * T * T), 0, alpha, wmax));
    }
    const wp = Math.sqrt(alpha * xa + wt * wt / 2);
    if (wp > wmax) { const d1 = (wmax * wmax - wt * wt) / (2 * alpha), d3 = wmax * wmax / (2 * alpha); ph.push({ dur: (wmax - wt) / alpha, acc: sg * alpha }, { dur: Math.max(0, (xa - d1 - d3) / wmax), acc: 0 }, { dur: wmax / alpha, acc: -sg * alpha }); }
    else ph.push({ dur: (wp - wt) / alpha, acc: sg * alpha }, { dur: wp / alpha, acc: -sg * alpha });
    return ph;
  }
  function slew(psi, w, target, dt, S = SHIP, alpha = S.alpha) {   // the rotation limiter: turn toward a target heading for dt seconds with the time-optimal bang-bang law. Returns { psi, w, left } (left: seconds still to go)
    const ph = slewPhases(wrap(target - psi), w, alpha, S.omegaMax); let t = dt, tot = 0; for (const q of ph) tot += q.dur;
    for (const q of ph) { const d = Math.min(q.dur, t); psi += w * d + 0.5 * q.acc * d * d; w += q.acc * d; t -= d; if (t <= 0) break; }
    if (t > 0) return { psi: wrap(target), w: 0, left: 0 };
    return { psi: wrap(psi), w, left: Math.max(0, tot - dt) };
  }

  // ---- integrator ----
  function step(st, cmd, dt, S = SHIP) {   // st {p, v, psi, w}; cmd { thrust: fraction of 100 percent (0 = coast), psiTarget: heading to slew to (absent: no torque, the spin carries on) }. Returns a new state
    const n = Math.max(1, Math.ceil(dt / 0.5)), h = dt / n, f = cmd.thrust || 0, A = S.a100 * f;
    let p = { ...st.p }, v = { ...st.v }, psi = st.psi, w = st.w || 0;
    for (let i = 0; i < n; i++) {
      const alpha = S.alpha + (f > 0 ? S.alphaGimbal * Math.min(1, f) : 0);   // gimbals add torque only while the drive burns
      let psi2 = psi, w2 = w; if (cmd.psiTarget != null) { const r = slew(psi, w, cmd.psiTarget, h, S, alpha); psi2 = r.psi; w2 = r.w; } else psi2 = wrap(psi + w * h);
      const a = mul(dir(psi + wrap(psi2 - psi) / 2), A);
      p = add(add(p, mul(v, h)), mul(a, 0.5 * h * h)); v = add(v, mul(a, h)); psi = psi2; w = w2;
    }
    return { p, v, psi, w };
  }

  // ---- plan evaluation ----
  function segState(sg, tau, S) {
    tau = clamp(tau, 0, sg.dur); const p = add(add(sg.p0, mul(sg.v0, tau)), mul(sg.acc, 0.5 * tau * tau)), v = add(sg.v0, mul(sg.acc, tau));
    let psi = sg.psi0, w = 0;
    if (sg.kind === 'rotate') { if (sg.settle) { const wl = sg.w0, sgn = wl < 0 ? -1 : 1, t = Math.min(tau, sg.dur); psi = wrap(sg.psi0 + wl * t - sgn * 0.5 * S.alpha * t * t); w = wl - sgn * S.alpha * t; } else { const r = rotAt(sg.dth, sg.dur, tau, S); psi = wrap(sg.psi0 + r.a); w = r.w; } }
    return { p, v, psi, w, kind: sg.kind, thrust: sg.thrust || 0, g: (sg.thrust || 0) * S.a100 / G0, acc: sg.acc };
  }
  function stateAt(pl, tau) {
    const S = pl.ship, segs = pl.segs;
    if (!segs.length || tau <= 0) { const sg = segs[0]; return sg && tau <= 0 ? segState(sg, 0, S) : { p: { ...pl.start.p }, v: { ...pl.start.v }, psi: pl.start.psi, w: 0, kind: 'coast', thrust: 0, g: 0, acc: { x: 0, y: 0 } }; }
    const last = segs[segs.length - 1];
    if (tau >= last.t0 + last.dur) { const e = segState(last, last.dur, S), d = tau - (last.t0 + last.dur); return { p: add(e.p, mul(e.v, d)), v: e.v, psi: e.psi, w: 0, kind: len(e.v) < 1e-6 ? 'idle' : 'coast', thrust: 0, g: 0, acc: { x: 0, y: 0 } }; }
    let lo = 0, hi = segs.length - 1; while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (segs[mid].t0 <= tau) lo = mid; else hi = mid - 1; }
    const s = segState(segs[lo], tau - segs[lo].t0, S); s.i = lo; return s;
  }

  // ---- the planner ----
  const propellant = (dv, S = SHIP) => S.mass * (1 - Math.exp(-dv / (S.isp * G0)));   // kg, rocket equation
  function plan(start, wps, opts = {}) {
    const S = Object.assign({}, SHIP, opts.ship), cruise0 = opts.cruise || 80, thr0 = opts.thrust != null ? opts.thrust : 1, Aof = f => S.a100 * f;
    const st = { t: 0, p: { ...start.p }, v: { ...start.v }, psi: start.psi || 0 }, segs = [], warn = [], wpT = [], Dist = [];
    let dvTot = 0, peak = 0;
    const push = (kind, dur, extra) => segs.push(Object.assign({ kind, t0: st.t, dur, p0: { ...st.p }, v0: { ...st.v }, psi0: st.psi, acc: { x: 0, y: 0 }, thrust: 0 }, extra));
    const coast = d => { if (!(d > 1e-6)) return; push('coast', d); st.p = add(st.p, mul(st.v, d)); st.t += d; };
    const rotDur = psiT => rotTime(wrap(psiT - st.psi), S);
    const rotateTo = psiT => { const dth = wrap(psiT - st.psi), T = rotTime(dth, S); if (T < 1e-6) { st.psi = wrap(psiT); return; } push('rotate', T, { dth }); st.p = add(st.p, mul(st.v, T)); st.psi = wrap(st.psi + dth); st.t += T; };
    const burn = (psi, T, f, kind) => { if (!(T > 1e-6)) return; const a = mul(dir(psi), Aof(f)); st.psi = wrap(psi); push(kind, T, { acc: a, thrust: f }); st.p = add(add(st.p, mul(st.v, T)), mul(a, 0.5 * T * T)); st.v = add(st.v, mul(a, T)); st.t += T; dvTot += Aof(f) * T; peak = Math.max(peak, f); if (kind !== 'brake' && T > S.redlineT && f * S.a100 >= S.aRedline - 1e-9) warn.push(`a redline burn of ${Math.round(T)} s is past the ${S.redlineT} s limit`); };
    // a spin left over from before (a replan in the middle of a rotation): brake it first
    if (Math.abs(start.omega || 0) > 1e-7) { const w0 = start.omega, sgn = w0 < 0 ? -1 : 1, T = Math.abs(w0) / S.alpha; push('rotate', T, { settle: true, w0, dth: sgn * w0 * w0 / (2 * S.alpha) }); st.p = add(st.p, mul(st.v, T)); st.psi = wrap(st.psi + sgn * w0 * w0 / (2 * S.alpha)); st.t += T; }
    const aligned = (q, c) => len(sub(st.v, mul(unit(sub(q, st.p)), c))) < Math.max(0.3, 0.005 * c);
    function alignBurn(q, c, f, kind) {   // change velocity to c along the line to q (aim from where the burn ends), after rotating to the burn direction
      const A = Aof(f); let dvv = sub(mul(unit(sub(q, st.p)), c), st.v);
      for (let it = 0; it < 14; it++) {
        const d = ang(dvv), rt = rotDur(d), T = len(dvv) / A, pb = add(st.p, mul(st.v, rt)), pe = add(add(pb, mul(st.v, T)), mul(dir(d), 0.5 * A * T * T)), nv = sub(mul(unit(sub(q, pe)), c), st.v);
        if (len(sub(nv, dvv)) < 1e-3) { dvv = nv; break; } dvv = nv;
      }
      if (len(dvv) < 0.05) return; rotateTo(ang(dvv)); burn(ang(dvv), len(dvv) / A, f, kind);
    }
    const rtFlip = rotTime(Math.PI, S);
    for (let i = 0; i < wps.length; i++) {
      const w = wps[i], next = wps[i + 1], c0 = w.cruise || cruise0, f = w.thrust != null ? w.thrust : thr0, A = Aof(f);
      if (len(sub(w.p, st.p)) < 1 && len(st.v) < 0.5) { wpT.push(st.t); continue; }   // already there
      if (w.kind === 'stop') {
        const D0 = len(sub(w.p, st.p)), vfeas = A * (-rtFlip + Math.sqrt(rtFlip * rtFlip + 4 * D0 / A)) / 2;   // peak speed of accelerate, flip, brake that fits in D0
        let c = c0; if (len(st.v) < c0 * 0.5 && vfeas < c0) { c = Math.max(vfeas * 0.97, 0.5); warn.push(`stop ${i + 1}: leg is short for ${Math.round(c0)} m/s (flip ${Math.round(rtFlip)} s); peak speed cut to ${Math.round(c)} m/s`); }
        { const u = unit(sub(w.p, st.p)), vs0 = len(st.v), cross = Math.abs(st.v.x * u.y - st.v.y * u.x), ok = vs0 > 1 && dot(st.v, u) > 0 && cross < 0.03 && vs0 >= 0.5 * c && vs0 <= c * 1.02; if (!ok && !aligned(w.p, c)) alignBurn(w.p, c, f, 'burn'); }   // already inbound along the line at a sensible speed: coast on; otherwise aim the velocity
        const vs = len(st.v);
        if (vs < 0.3) { st.v = { x: 0, y: 0 }; wpT.push(st.t); continue; }
        const dv_ = unit(st.v), retro = ang(mul(dv_, -1)), rt = rotDur(retro), db = vs * vs / (2 * A), along = dot(sub(w.p, st.p), dv_), tc = (along - db) / vs - rt;
        if (tc < 0) warn.push(`stop ${i + 1}: leg is ${Math.round(-tc * vs)} m too short for the flip and brake; the ship overshoots`);
        coast(Math.max(0, tc)); rotateTo(retro); burn(retro, vs / A, f, 'brake'); st.v = Math.abs(len(st.v)) < 1e-3 ? { x: 0, y: 0 } : st.v; wpT.push(st.t); continue;
      }
      // turn: head for the corner at cruise speed, then change velocity for the next point
      if (!aligned(w.p, c0)) alignBurn(w.p, c0, f, 'burn');
      if (!next) { const sp = Math.max(len(st.v), 0.1), d = dot(sub(w.p, st.p), unit(st.v)); coast(Math.max(0, d / sp)); wpT.push(st.t); continue; }
      const vin = { ...st.v }, sp = len(vin), din = unit(vin), cN = next.cruise || c0; let s = 0, dvv = sub(mul(unit(sub(next.p, w.p)), cN), vin), T, d;
      for (let it = 0; it < 80; it++) {   // fixed point: the burn is centred on the corner (s metres before it) and ends aimed at the next point
        T = len(dvv) / A; d = ang(dvv); const pb = sub(w.p, mul(din, s)), pe = add(add(pb, mul(vin, T)), mul(dir(d), 0.5 * A * T * T)), nd = sub(mul(unit(sub(next.p, pe)), cN), vin), ns = sp * T / 2;
        const done = len(sub(nd, dvv)) < 1e-4 && Math.abs(ns - s) < 0.01; dvv = nd; s = ns; if (done) break;
      }
      T = len(dvv) / A; d = ang(dvv);
      if (len(dvv) < 0.05) { const dd = dot(sub(w.p, st.p), din); coast(Math.max(0, dd / sp)); wpT.push(st.t); continue; }   // the next leg is straight on
      const pb = sub(w.p, mul(din, s)), rt = rotDur(d), Lc = dot(sub(pb, st.p), din), tc = Lc / sp - rt;
      if (tc < 0) warn.push(`turn ${i + 1}: leg is ${Math.round(-tc * sp)} m too short for the ${Math.round(rt)} s rotation; the ship cuts the corner late`);
      coast(Math.max(0, tc)); rotateTo(d); const t0 = st.t; burn(d, T, f, 'turnburn'); wpT.push(t0 + T / 2); Dist.push({ i, cut: len(sub(w.p, stateAt({ segs, ship: S, start: { p: start.p, v: start.v, psi: start.psi } }, t0 + T / 2).p)) });
    }
    const dvm = dvTot, prop = propellant(dvm, S);
    return { segs, warn, wpT, ship: S, start: { p: { ...start.p }, v: { ...start.v }, psi: start.psi || 0, omega: start.omega || 0 }, cuts: Dist, end: { t: st.t, p: st.p, v: st.v, psi: st.psi }, stats: { time: st.t, dv: dvm, propKg: prop, propT: prop / 1000, peakThrust: peak, peakG: peak * S.a100 / G0 } };
  }
  function hold(start, opts = {}) {   // all stop: flip to retrograde, burn, rest where the braking ends. A ship under 0.3 m/s is simply at rest
    const S = Object.assign({}, SHIP, opts.ship), A = S.a100 * (opts.thrust != null ? opts.thrust : 1), vs = len(start.v), w0 = start.omega || 0;
    if (vs < 0.3) return plan({ p: start.p, v: { x: 0, y: 0 }, psi: start.psi, omega: w0 }, [], opts);
    const u = unit(start.v), sgn = w0 < 0 ? -1 : 1, ts = Math.abs(w0) > 1e-7 ? Math.abs(w0) / S.alpha : 0, psiS = wrap((start.psi || 0) + (ts ? sgn * w0 * w0 / (2 * S.alpha) : 0)), rt = rotTime(wrap(ang(mul(u, -1)) - psiS), S);
    return plan(start, [{ p: add(start.p, add(mul(start.v, ts + rt), mul(u, vs * vs / (2 * A)))), kind: 'stop', cruise: vs }], opts);
  }
  function replan(pl, tau, wps, opts) {   // a new plan from where this one has got to (an order, a hit, a new waypoint)
    const s = stateAt(pl, tau); return plan({ p: s.p, v: s.v, psi: s.psi, omega: s.w }, wps, Object.assign({ ship: pl.ship }, opts));
  }
  function sample(pl, dt = 2) {   // path points for drawing: [{t, p, v, psi, kind, thrust}]
    const out = []; for (const sg of pl.segs) { const n = Math.max(2, Math.ceil(sg.dur / dt)); for (let k = (out.length ? 1 : 0); k <= n; k++) { const t = sg.t0 + sg.dur * k / n, q = stateAt(pl, Math.min(t, sg.t0 + sg.dur - 1e-9)); out.push({ t, p: q.p, v: q.v, psi: q.psi, kind: sg.kind, thrust: sg.thrust }); } } return out;
  }
  function runPlan(pl, dt = 0.5) {   // fly a plan through the integrator (rotation limiter and all) and return the final state: the check that the closed form and the physics agree
    let s = { p: { ...pl.start.p }, v: { ...pl.start.v }, psi: pl.start.psi, w: 0 }, t = 0; const S = pl.ship;
    for (const sg of pl.segs) { const end = sg.t0 + sg.dur; while (t < end - 1e-9) { const h = Math.min(dt, end - t); s = step(s, sg.kind === 'rotate' ? { thrust: 0, psiTarget: wrap(sg.psi0 + sg.dth) } : { thrust: sg.thrust, psiTarget: sg.psi0 }, h, S); t += h; } }
    return s;
  }
  const API = { SHIP, G0, plan, hold, replan, stateAt, step, slew, rotTime, rotAt, sample, runPlan, propellant, wrap, stopDistance: (v, a) => v * v / (2 * a), unit, len, ang };
  root.Flight = API; if (typeof module !== 'undefined') module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
