// Flight model (web/flight_model.js): closed-form checks. node tests/flight_model_test.js
const F = require('../web/flight_model.js');
let bad = 0; const chk = (m, c) => { console.log(c ? 'ok   ' : 'FAIL ', m); if (!c) bad++; };
const S = F.SHIP, A = S.a100, d2 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const rng = seed => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const P0 = { p: { x: 0, y: 0 }, v: { x: 0, y: 0 }, psi: 0 };

// ---- constants ----
chk('100 percent drive is 1 g (9.81 m/s2)', Math.abs(A - 1 * 9.80665) < 1e-9);
chk('redline 3 g for 30 s, emergency 6 g for 5 s, default spin 5.6e-4 rad/s2 (flips use the maneuver presets)', Math.abs(S.aRedline / 9.80665 - 3) < 1e-9 && S.redlineT === 30 && Math.abs(S.aEmergency / 9.80665 - 6) < 1e-9 && S.emergencyT === 5 && S.alpha === 5.6e-4);
chk('thrust 108 MN at 100 percent on 11,000 t (about 1,375 kg/s of water at Isp 8000 s: a 250 t tank is about 3 minutes of 1 g)', Math.abs(S.mass * A / 1e6 - 107.9) < 0.5 && Math.abs(S.mass * A / (S.isp * 9.80665) - 1375) < 10);

// ---- rotation: flip time 2 sqrt(theta / alpha) ----
{ const T = F.rotTime(Math.PI); chk(`180 degree flip: ${T.toFixed(1)} s = 2 sqrt(pi / alpha) = ${(2 * Math.sqrt(Math.PI / S.alpha)).toFixed(1)} s (about 150)`, Math.abs(T - 2 * Math.sqrt(Math.PI / S.alpha)) < 1e-9 && Math.abs(T - 150) < 1);
  chk('90 degree turn about 106 s', Math.abs(F.rotTime(Math.PI / 2) - 106) < 1);
  chk('rotation time scales with the square root of the angle', Math.abs(F.rotTime(4 * 0.3) / F.rotTime(0.3) - 2) < 1e-9);
  let s = { psi: 0, w: 0 }, t = 0; while (t < 400) { s = F.slew(s.psi, s.w, Math.PI, 0.5); t += 0.5; if (Math.abs(s.psi - Math.PI) < 1e-9 || Math.abs(Math.abs(s.psi) - Math.PI) < 1e-9) break; }
  chk(`the rotation limiter flips 180 degrees in ${t.toFixed(1)} s and comes to rest on the target`, Math.abs(t - T) <= 0.5 && Math.abs(s.w) < 1e-9);
  let q = { psi: 0, w: 0 }, peak = 0; for (let i = 0; i < 300; i++) { q = F.slew(q.psi, q.w, Math.PI, 0.5); peak = Math.max(peak, Math.abs(q.w)); }
  chk(`peak spin ${peak.toFixed(4)} rad/s stays under omegaMax and equals alpha T / 2`, peak <= S.omegaMax + 1e-12 && Math.abs(peak - S.alpha * T / 2) < 1e-4);
  const r0 = F.slew(0, 0.03, 0.1, 400); chk('a ship already spinning toward a near target overshoots, brakes, and comes back to rest on it', Math.abs(r0.psi - 0.1) < 1e-9 && r0.w === 0);
  let g = F.step({ p: { x: 0, y: 0 }, v: { x: 0, y: 0 }, psi: 0, w: 0 }, { thrust: 1, psiTarget: 0 }, 60);
  chk('the integrator burns 100 percent for 60 s: v = a t, x = a t2 / 2', Math.abs(g.v.x - A * 60) < 1e-6 && Math.abs(g.p.x - 0.5 * A * 3600) < 1e-3);
  let f = { p: { x: 0, y: 0 }, v: { x: 10, y: 0 }, psi: 0, w: 0 }; for (let i = 0; i < 300; i++) f = F.step(f, { thrust: 0, psiTarget: Math.PI }, 0.5);
  chk('during the flip (free fall) velocity does not change and the ship drifts v t', Math.abs(f.v.x - 10) < 1e-9 && Math.abs(f.p.x - 1500) < 1e-6 && Math.abs(Math.abs(f.psi) - Math.PI) < 1e-9);
  const gim = F.step({ p: { x: 0, y: 0 }, v: { x: 0, y: 0 }, psi: 0, w: 0 }, { thrust: 1, psiTarget: 0.2 }, 20).psi, rcs = F.step({ p: { x: 0, y: 0 }, v: { x: 0, y: 0 }, psi: 0, w: 0 }, { thrust: 0, psiTarget: 0.2 }, 20).psi;
  chk('gimbals turn the ship faster, but only while the drive burns', gim > rcs * 1.5); }

// ---- stop: v^2 / 2a ----
{ const v = 80, pl = F.plan({ p: { x: 0, y: 0 }, v: { x: v, y: 0 }, psi: 0 }, [{ p: { x: 30000, y: 0 }, kind: 'stop' }], { cruise: v }), br = pl.segs.find(x => x.kind === 'brake');
  const d = 0.5 * v * v / A;
  chk(`stop from 80 m/s: brake ${br.dur.toFixed(1)} s = v/a, over ${(d / 1000).toFixed(2)} km = v2/2a`, Math.abs(br.dur - v / A) < 1e-6 && Math.abs(F.len(F.stateAt(pl, br.t0 + br.dur).p) - 30000) < 1);
  const e = F.stateAt(pl, pl.stats.time + 5); chk('...and it ends at rest on the stop point', d2(e.p, { x: 30000, y: 0 }) < 2 && F.len(e.v) < 1e-6);
  chk('the brake starts v2/2a short of the point', Math.abs((30000 - F.stateAt(pl, br.t0).p.x) - d) < 2);
  chk('the flip comes before the brake and takes the flip time', pl.segs.filter(x => x.kind === 'rotate').some(x => Math.abs(x.dur - F.rotTime(Math.PI)) < 1e-6)); }

// ---- the prototype route: three clicks, 250 km ----
{ const wps = [{ p: { x: 90000, y: 30000 }, kind: 'turn' }, { p: { x: 140000, y: 110000 }, kind: 'turn' }, { p: { x: 70000, y: 150000 }, kind: 'stop' }];
  const pl = F.plan({ p: { x: 10000, y: 20000 }, v: { x: 0, y: 0 }, psi: 0 }, wps, { cruise: 80 });
  chk(`prototype route: ${Math.round(pl.stats.time)} s, dv ${pl.stats.dv.toFixed(0)} m/s, ${pl.stats.propT.toFixed(1)} t (1 g drive: 3233 s; the prototype's 0.15 g gave 3279 s; same dv and water)`, Math.abs(pl.stats.time - 3233) < 20 && Math.abs(pl.stats.dv - 344) < 5 && Math.abs(pl.stats.propT - 48.1) < 1);
  chk('...no warnings', pl.warn.length === 0);
  const e = F.stateAt(pl, pl.stats.time + 1); chk(`arrival tolerance: ends ${d2(e.p, wps[2].p).toFixed(2)} m from the stop at rest`, d2(e.p, wps[2].p) < 5 && F.len(e.v) < 0.01);
  chk('waypoint times are increasing and the last is the end', pl.wpT.length === 3 && pl.wpT[0] < pl.wpT[1] && pl.wpT[1] < pl.wpT[2] && Math.abs(pl.wpT[2] - pl.stats.time) < 1e-6);
  chk('the corners are cut by less than 1.5 km at 80 m/s', pl.cuts.length === 2 && pl.cuts.every(c => c.cut < 1500));
  const r = F.runPlan(pl, 0.5); chk(`the integrator flies the same plan to the same place (${d2(r.p, e.p).toFixed(3)} m apart)`, d2(r.p, e.p) < 1 && F.len(r.v) < 0.01);
  // phases
  const kinds = new Set(pl.segs.map(x => x.kind)); chk('phases: rotate, burn, coast, turnburn, brake', ['rotate', 'burn', 'coast', 'turnburn', 'brake'].every(k => kinds.has(k)));
  chk('quiet phases never push: coast and rotate have zero thrust, burns 100 percent', pl.segs.every(x => (x.kind === 'coast' || x.kind === 'rotate') ? x.thrust === 0 : x.thrust === 1));
  chk('delta-v is the sum of the burns', Math.abs(pl.segs.reduce((q, x) => q + F.len(x.acc) * x.dur, 0) - pl.stats.dv) < 1e-6);
  chk('propellant by the rocket equation, Isp 8000 s (water: this is generic mass)', Math.abs(pl.stats.propKg - 11e6 * (1 - Math.exp(-pl.stats.dv / (8000 * 9.80665)))) < 1e-6);
  chk('thrust is down: the burn direction is the heading', pl.segs.filter(x => x.thrust > 0).every(x => Math.abs(Math.atan2(x.acc.y, x.acc.x) - x.psi0) < 1e-9)); }

// ---- arrival tolerance over random plans ----
{ const r = rng(7); let worst = 0, n = 0, speed = 0;
  for (let i = 0; i < 200; i++) { const k = 1 + Math.floor(r() * 3), wps = []; let p = { x: 20000 + r() * 100000, y: 20000 + r() * 100000 };
    const start = { p: { ...p }, v: { x: (r() - 0.5) * 40, y: (r() - 0.5) * 40 }, psi: r() * 6 - 3 };
    for (let j = 0; j < k; j++) { p = { x: p.x + (r() - 0.5) * 120000, y: p.y + (r() - 0.5) * 120000 }; wps.push({ p, kind: j < k - 1 ? 'turn' : 'stop' }); }
    const pl = F.plan(start, wps, { cruise: 30 + r() * 90 }); if (pl.warn.length) continue; n++; globalThis.__w = globalThis.__w || [];  const e = F.stateAt(pl, pl.stats.time + 1); worst = Math.max(worst, d2(e.p, wps[k - 1].p)); speed = Math.max(speed, F.len(e.v)); }
  chk(`${n} random plans without warnings: worst arrival error ${worst.toFixed(2)} m, worst end speed ${speed.toExponential(1)} m/s`, n > 100 && worst < 5 && speed < 1e-3); }

// ---- replan after an interruption ----
{ const wps = [{ p: { x: 60000, y: 0 }, kind: 'turn' }, { p: { x: 60000, y: 60000 }, kind: 'stop' }], pl = F.plan(P0, wps, { cruise: 80 });
  const tau = pl.segs.find(x => x.kind === 'coast').t0 + 200, mid = F.stateAt(pl, tau);
  const np = F.replan(pl, tau, [{ p: { x: 20000, y: 40000 }, kind: 'stop' }], { cruise: 60 }), e = F.stateAt(np, np.stats.time + 1), s0 = F.stateAt(np, 0);
  chk('replan in the middle of a coast starts from the state the old plan had reached', d2(s0.p, mid.p) < 1e-6 && d2(s0.v, mid.v) < 1e-9);
  chk(`...and ends at rest on the new stop (${d2(e.p, { x: 20000, y: 40000 }).toFixed(2)} m)`, d2(e.p, { x: 20000, y: 40000 }) < 5 && F.len(e.v) < 1e-3);
  const rot = pl.segs.find(x => x.kind === 'rotate' && x.t0 > 100), tr = rot.t0 + rot.dur * 0.3, ms = F.stateAt(pl, tr);
  chk('a flip in progress has a spin rate', Math.abs(ms.w) > 1e-3 && ms.kind === 'rotate');
  const np2 = F.replan(pl, tr, [{ p: { x: 5000, y: 5000 }, kind: 'stop' }], { cruise: 50 }), e2 = F.stateAt(np2, np2.stats.time + 1);
  chk('replan during a rotation first settles the spin (no instant stop of the rotation)', np2.segs[0].kind === 'rotate' && np2.segs[0].settle === true && Math.abs(np2.segs[0].dur - Math.abs(ms.w) / S.alpha) < 1e-6);
  chk(`...and still arrives (${d2(e2.p, { x: 5000, y: 5000 }).toFixed(2)} m)`, d2(e2.p, { x: 5000, y: 5000 }) < 5 && F.len(e2.v) < 1e-3);
  const r2 = F.runPlan(np2, 0.5); chk('the integrator agrees on the settled plan too', d2(r2.p, e2.p) < 1 && Math.abs(F.wrap(r2.psi - e2.psi)) < 1e-6); }

// ---- sub-1 m/s starts, tiny legs, short legs ----
{ for (const v of [{ x: 0, y: 0 }, { x: 0.3, y: 0.2 }, { x: -0.9, y: 0.1 }, { x: 1e-6, y: 0 }]) { const pl = F.plan({ p: { x: 0, y: 0 }, v, psi: 1 }, [{ p: { x: 8000, y: 3000 }, kind: 'stop' }], { cruise: 60 }), e = F.stateAt(pl, pl.stats.time + 1);
    chk(`start at ${F.len(v).toExponential(1)} m/s: arrives within ${d2(e.p, { x: 8000, y: 3000 }).toFixed(2)} m`, d2(e.p, { x: 8000, y: 3000 }) < 8 && F.len(e.v) < 1e-3 && Number.isFinite(pl.stats.time)); }
  const same = F.plan(P0, [{ p: { x: 0.2, y: 0 }, kind: 'stop' }]); chk('a stop on top of us is a no-op, no NaN', same.segs.length === 0 && same.stats.time === 0 && Number.isFinite(same.stats.dv));
  const sh = F.plan(P0, [{ p: { x: 3000, y: 0 }, kind: 'stop' }], { cruise: 90 }), e = F.stateAt(sh, sh.stats.time + 1);
  chk(`a leg too short for the flip at 90 m/s warns and flies a slower best effort (${sh.warn[0] ? sh.warn[0].slice(0, 60) : 'no warning'}), arriving ${d2(e.p, { x: 3000, y: 0 }).toFixed(1)} m off`, sh.warn.length === 1 && /short/.test(sh.warn[0]) && d2(e.p, { x: 3000, y: 0 }) < 8 && F.len(e.v) < 1e-3 && Math.max(...sh.segs.map(q => F.len(q.v0))) < 85);
  const ov = F.plan({ p: { x: 0, y: 0 }, v: { x: 80, y: 0 }, psi: 0 }, [{ p: { x: 1500, y: 0 }, kind: 'stop' }], { cruise: 80 }), eo = F.stateAt(ov, ov.stats.time + 1);
  chk(`moving at 80 m/s toward a stop 1.5 km away (needs ${(F.stopDistance(80, A) / 1000).toFixed(1)} km braking plus the flip): warns of the overshoot, still comes to rest (${Math.round(eo.p.x - 1500)} m past)`, ov.warn.some(w => /overshoot/.test(w)) && eo.p.x > 1500 && F.len(eo.v) < 1e-3);
  const tl = F.plan(P0, [{ p: { x: 20000, y: 0 }, kind: 'turn' }, { p: { x: 20000, y: 800 }, kind: 'stop' }], { cruise: 80 }); chk('a corner with no room to rotate warns', tl.warn.length >= 1);
  const lowT = F.plan(P0, [{ p: { x: 20000, y: 0 }, kind: 'stop' }], { cruise: 20, thrust: 0.2 }), full = F.plan(P0, [{ p: { x: 20000, y: 0 }, kind: 'stop' }], { cruise: 20 });
  chk('a throttled burn (20 percent) takes five times as long for the same delta-v', Math.abs(lowT.segs.find(q => q.kind === 'burn').dur / full.segs.find(q => q.kind === 'burn').dur - 5) < 1e-6 && Math.abs(lowT.stats.dv - full.stats.dv) < 1e-6 && lowT.stats.peakThrust === 0.2);
  const red = F.plan(P0, [{ p: { x: 90000, y: 0 }, kind: 'stop', thrust: S.aRedline / A }], { cruise: 150 }); chk(`redline thrust 3 g: peak ${red.stats.peakG.toFixed(2)} g, the burn to 150 m/s takes ${red.segs.find(q => q.kind === 'burn').dur.toFixed(0)} s`, Math.abs(red.stats.peakG - 3) < 1e-9 && Math.abs(red.segs.find(q => q.kind === 'burn').dur - 150 / S.aRedline) < 1e-6); }

// ---- a long coast is silent, a stop-only plan from speed, and the speed change ----
{ const pl = F.plan({ p: { x: 0, y: 0 }, v: { x: 60, y: 0 }, psi: 0 }, [{ p: { x: 50000, y: 0 }, kind: 'stop' }], { cruise: 60 }); const co = pl.segs.find(q => q.kind === 'coast'); chk(`coast phase ${Math.round(co.dur)} s long with no thrust, then flip, then brake`, co.dur > 500 && co.thrust === 0 && pl.segs.map(q => q.kind).join() === 'coast,rotate,brake');
  const slow = F.plan({ p: { x: 0, y: 0 }, v: { x: 100, y: 0 }, psi: 0 }, [{ p: { x: 80000, y: 0 }, kind: 'stop', cruise: 20 }], { cruise: 20 }), e = F.stateAt(slow, slow.stats.time + 1);
  chk(`slowing from 100 to 20 m/s takes a flip and a burn first (${slow.segs.slice(0, 2).map(q => q.kind).join(', ')}) and still stops on the point`, slow.segs[0].kind === 'rotate' && d2(e.p, { x: 80000, y: 0 }) < 8 && F.len(e.v) < 1e-3); }

// ---- hold: flip to retrograde and brake in place ----
{ const st = { p: { x: 0, y: 0 }, v: { x: 60, y: 20 }, psi: 0.3 }, h = F.hold(st), e = F.stateAt(h, h.stats.time + 5), sp = Math.hypot(e.v.x, e.v.y);
  chk(`hold from 63 m/s: a flip then a brake, ends at rest (${sp.toFixed(3)} m/s) after ${Math.round(h.stats.time)} s`, h.segs.some(q => q.kind === 'rotate') && h.segs.some(q => q.kind === 'brake') && sp < 0.05);
  chk('hold under 0.3 m/s is no plan at all', F.hold({ p: { x: 0, y: 0 }, v: { x: 0.1, y: 0 }, psi: 0 }).segs.length === 0); }

console.log(bad ? bad + ' FAILED' : 'ALL OK'); process.exit(bad ? 1 : 0);
