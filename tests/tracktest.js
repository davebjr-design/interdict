// Tracking and solution model: solve-time ordering, cold targets losing the track, honest certainty, maneuver penalty.
const E = require('../web/hunt_rt_engine.js'); const P = E.P;
let bad = 0; const chk = (m, c) => { console.log(c ? 'ok  ' : 'FAIL', m); if (!c) bad++; };
function setup(o) {
  const s = E.newHunt(o.seed || 7, { layout: 'center' });
  s.an.forEach(a => { a.state = 'out'; });
  const a = s.an.find(x => x.kind === 'real') || s.an[0]; a.kind = 'real'; a.load = E.LOADOUTS[1]; a.sink = { h: 0.3 }; a.sil = o.sil || 1; a.state = 'open'; a.ventOk = 1e9; a.hpMax = a.hp = 70; a.aware = false; a.know = 0;
  s.bodies = []; s.player = { x: 120, y: 120 }; s.posture = 'still'; s.speed = 'v1';
  const ang = o.ang ?? 0, d = o.d || 40; a.x0 = 120 + Math.cos(ang) * d; a.y0 = 120 + Math.sin(ang) * d;
  const sp = o.v ?? 0, hd = o.hd ?? Math.PI / 2; a.vx = sp * Math.cos(hd); a.vy = sp * Math.sin(hd); a.v = sp; a.legs = null;
  if (o.back) s.bodies.push({ kind: 'star', x: 120 + Math.cos(ang) * (d + 40), y: 120 + Math.sin(ang) * (d + 40), r: 12, halo: 70 });
  s.sink.h = 0.05; return { s, a };
}
function run(o) {   // returns real seconds to a ready solution (or Infinity), plus certainty and error traces over 6 game minutes
  const { s, a } = setup(o);
  if (o.pre) { for (const w of s.analysts) w.task = a.id; E.tick(s, o.pre); }
  E.lockContact(s, a.id); for (const w of s.analysts) w.task = a.id;
  const t0 = s.t; let solved = Infinity, minCert = 1, within = 0, n = 0;
  for (let i = 0; i < 120; i++) {
    if (o.man && i && i % Math.round(o.man / 0.05) === 0) E.maneuver(s, a, 1.1, null);
    E.tick(s, 0.05);
    if (a.solve >= 1 && solved === Infinity) solved = (s.t - t0) * P.secPerMin;
    if (a.anchor) { const si = E.solveInfo(s, a); minCert = Math.min(minCert, si.cert); const tp = E.truePos(a, s.t), ep = E.estAt(a, s.t - a.anchor.t), sp = E.spreadAt(a, s.t - a.anchor.t); n++; if (Math.hypot(tp.x - ep.x, tp.y - ep.y) <= 1.5 * Math.max(sp.cross, sp.along)) within++; }
  }
  return { solved, minCert, cover: within / n };
}
const avg = (o, k) => { let t = 0, c = 0; for (let seed = 1; seed <= 12; seed++) { const r = run(Object.assign({ seed }, o))[k]; if (isFinite(r)) { t += r; c++; } } return c ? t / c : Infinity; };
const cases = { back: { v: 0, back: 1, pre: 6 }, still: { v: 0, pre: 6 }, fast: { v: 9, pre: 6 }, man: { v: 4.5, man: 1.5, pre: 6 }, cold: { v: 0, d: 150, sil: 0.7, pre: 6 }, icy: { v: 0, d: 150, sil: 0.3, pre: 6 }, hot: { v: 0, d: 40, pre: 6 } };
const T = {}; for (const [k, o] of Object.entries(cases)) T[k] = avg(o, 'solved'); console.log(JSON.stringify(T, (k, v) => typeof v === 'number' ? Math.round(v) : v));
chk('backlit stationary is the fastest', T.back < T.still);
chk('stationary solves in under 40 s', T.still < 40);
chk('fast target is much slower than stationary', T.fast > 1.8 * T.still);
chk('maneuvering target is slower than stationary', T.man > 1.5 * T.still);
chk('cold far target is slower than a hot near one', T.cold > T.hot * 1.3);
const hotC = avg(cases.hot, 'minCert'), coldC = avg(cases.icy, 'minCert');
chk('hot near target keeps certainty above 85% (' + hotC.toFixed(2) + ')', hotC > 0.85);
chk('cold far target visibly loses certainty (' + coldC.toFixed(2) + ')', coldC < 0.8);
const cov = avg(cases.hot, 'cover'); chk('stated wedge covers the true position at least 80% of the time (' + cov.toFixed(2) + ')', cov >= 0.8);
{ const { s, a } = setup({ v: 4.5 }); E.lockContact(s, a.id); a.solve = 1; E.maneuver(s, a, 1.1, null); chk('a course change costs solution progress', Math.abs(a.solve - (1 - P.manLoss)) < 1e-9);
  const { s: s2, a: a2 } = setup({ v: 0 }); E.lockContact(s2, a2.id); a2.solve = 1; E.maneuver(s2, a2, 1.1, null); chk('a stationary target turning in place costs nothing', a2.solve === 1); }
console.log(bad ? 'FAILED' : 'ALL OK'); process.exit(bad ? 1 : 0);
