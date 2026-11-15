/* Scripted captains for the balance harness (sim/balance_hunt.js). Copied from tools/balance_bot.js (so this harness
 * does not move when tools/ does) and extended for the 60-missile magazine:
 *   camper    passive: never moves, never tasks an analyst, waits for a vent to mark a ship hostile, locks, fires.
 *   pingfire  passive-patient: like the camper, then pings the lock to hurry the solution.
 *   pinger    aggressive: redline at the nearest contact, pings everything, locks on thin odds, fires tight, coilgun in range.
 *   reader    the original competent bot (written for unlimited ammunition: fires whenever the hit chance is over 35%).
 *   steady    the competent bot for the magazine era: reader, plus ammunition discipline (a stricter hit-chance gate when
 *             the magazine runs short of the ships still alive), the coilgun to finish a hull at close range, and Fenwick on the injured (E.treat).
 *   random    presses buttons with no plan.
 * Every bot takes (s, k, r, mem): hunt state, step counter, a seeded random function and a scratch object.
 * Deterministic for a given seed. No DOM. */
(function (root) {
  'use strict';
  const req = n => (typeof require !== 'undefined' ? require(n) : null);
  const E = root.HuntRT || (typeof process !== 'undefined' && process.env.HUNT_ENGINE ? require(process.env.HUNT_ENGINE) : req('../web/hunt_rt_engine.js'));
  const CONES = [0, 2, 4, 6, 9, 12];
  const EXP = (typeof process !== 'undefined' && process.env.BOT_OPT) ? JSON.parse(process.env.BOT_OPT) : {};   // exploration only: BOT_OPT='{"homing":true,"stand":40}'
  const live = s => s.an.filter(a => a.kind === 'real' && a.state !== 'disabled');
  const incoming = s => (s.inc || []).length > 0;
  const anyAware = s => s.an.some(a => a.kind === 'real' && a.aware && a.state !== 'disabled');
  const dist = (s, a) => { const p = E.displayPos(s, a); return Math.hypot(p.x - s.player.x, p.y - s.player.y); };
  function sinkCare(s, cautious) {
    if (s.vent.on) { if (!s.vent.forced && s.sink.h < (cautious ? 0.25 : 0.3)) E.stopVent(s); if (cautious && !s.vent.forced && (incoming(s) || anyAware(s)) && s.sink.h < 0.7) E.stopVent(s); return; }
    if (cautious) { if (s.sink.h > 0.92 || (s.sink.h > 0.7 && !anyAware(s) && !incoming(s))) E.startVent(s); }
    else if (s.sink.h > 0.85) E.startVent(s);
  }
  function bestCone(s, a, r, leads = [null], homing = false) { let best = null; const f0 = E.fanInfo(s, a, null); for (const lf of leads) { const L = lf == null ? null : f0.bestL * lf; for (const c of CONES) { const d = E.dmgEst(s, a, L, c, 'he', 100, r, homing); if (!best || d.exp > best.exp) best = { c, L, exp: d.exp, p: d.p }; } } return best; }
  const fireReady = (s, a) => a.state === 'locked' && (a.solve || 0) >= 1 && !a.stale;
  const rawFire = (s, a, L, c, homing) => E.fire(s, a, L, c, 'he', !!homing);

  function reader(s, k, r, mem, opt) {
    opt = opt || {};
    sinkCare(s, true);
    if (opt.treat && E.treat && s.crew) for (const k in s.crew) if (s.crew[k].inj && s.crew[k].treatUntil == null) { E.treat(s, k); break; }   // Fenwick sees to the hurt, one at a time
    if (s.hull < 15 && !s.spool) { E.retreat(s); return; }
    if (opt.discipline && !s.spool && s.mag && s.mag.total < s.mag.perSalvo && live(s).length && !s.volleys.length) { E.retreat(s); return; }   // dry magazine with warships left: break contact rather than stand and be shot
    if (incoming(s)) { const v = s.inc[0]; if (mem.dodge !== v) { mem.dodge = v; const dx = v.aim.x - v.from.x, dy = v.aim.y - v.from.y, d = Math.hypot(dx, dy) || 1, sg = r() < 0.5 ? 1 : -1; E.setRoute(s, [{ x: s.player.x - dy / d * 14 * sg, y: s.player.y + dx / d * 14 * sg, speed: 'v4' }]); } }
    else if (mem.dodge && s.posture !== 'route') { mem.dodge = null; E.setSpeed(s, 'v2'); }
    for (const a of s.an) if (a.state === 'open') { const c = E.classify(s, a); if (a.idStatus === 'hostile' || (c.n >= 2 && c.post.real > 0.9)) E.lockContact(s, a.id); else if (c.n >= 2 && c.post.real < 0.04 && c.p > 0.9) E.dismissContact(s, a.id); }
    const locked = s.an.filter(a => a.state === 'locked'), open = s.an.filter(a => a.state === 'open' && a.idStatus !== 'plan');
    const need = locked.filter(a => !fireReady(s, a) || E.trackState(s, a).state !== 'lock');
    const focus = open.map(a => ({ a, c: E.classify(s, a) })).sort((x, y) => (y.c.post.real - x.c.post.real) || (x.c.n - y.c.n))[0];
    s.analysts.forEach((w, i) => {
      let want = null;
      if (need.length && (i === 0 || !focus)) want = need[i % need.length].id;
      else if (focus) want = focus.a.id; else if (locked.length) want = locked[i % locked.length].id;
      if (w.task !== want) { if (w.task != null) E.assign(s, w.id, w.task); if (want != null) E.assign(s, w.id, want); }
    });
    if (!incoming(s) && !mem.dodge) { const tg = locked.filter(a => a.anchor).sort((x, y) => dist(s, x) - dist(s, y))[0];
      if (tg && dist(s, tg) > (opt.stand || 55)) { if (s.posture !== 'close' || s.orderId !== tg.id) { E.setOrder(s, 'close', tg.id); E.setSpeed(s, 'v2'); } }
      else if (s.posture === 'close') E.setOrder(s, 'still', null); }
    for (const a of locked) {
      if (a.stale) { E.refreshSolution(s, a.id); continue; }
      if (opt.coil && a.anchor && E.closeInfo(s, a).d <= E.P.closeRange && ['lock', 'track'].includes(E.trackState(s, a).state)) E.fireClose(s, a.id);
      if (fireReady(s, a) && !s.vent.on) {
        const st = E.trackState(s, a).state; if (st === 'last') continue;
        const hm = !!opt.homing && !a.aware, b = bestCone(s, a, r, [0.8, 0.9, 1.0], hm);
        let gate = 0.35;
        if (opt.discipline) {   // ammunition discipline: the fewer salvos per surviving ship, the surer the shot must be
          const salvos = s.mag ? Math.floor(s.mag.byKind.he / s.mag.perSalvo) : 99, ships = Math.max(1, live(s).length), per = salvos / ships;
          gate = per >= 4 ? 0.35 : per >= 3 ? 0.5 : per >= 2 ? 0.6 : 0.7;
        }
        if (b.p > gate) rawFire(s, a.id, b.L, b.c, hm);
      }
    }
  }
  const BOTS = {
    camper(s, k, r) {
      sinkCare(s, false);
      if (incoming(s)) E.goQuiet(s);
      for (const a of s.an) if (a.state === 'open' && a.idStatus === 'hostile') E.lockContact(s, a.id);
      for (const a of s.an) if (a.state === 'locked') { if (a.stale) E.refreshSolution(s, a.id); else if (fireReady(s, a)) E.fire(s, a.id, null, 0); }
    },
    pingfire(s, k, r) {
      sinkCare(s, false);
      if (incoming(s)) E.goQuiet(s);
      for (const a of s.an) if (a.state === 'open' && a.idStatus === 'hostile') E.lockContact(s, a.id);
      for (const a of s.an) if (a.state === 'locked') {
        if ((a.solve || 0) < 1 || a.stale) E.pingContact(s, a.id);
        if (a.stale && s.t >= s.pingCd) E.refreshSolution(s, a.id);
        if (fireReady(s, a)) E.fire(s, a.id, null, 0);
      }
    },
    pinger(s, k, r) {
      sinkCare(s, false);
      const open = s.an.filter(a => ['open', 'locked'].includes(a.state));
      const tgt = open.filter(a => a.state === 'locked')[0] || open.sort((x, y) => dist(s, x) - dist(s, y))[0];
      if (tgt && (s.orderId !== tgt.id || s.posture !== 'close')) E.setOrder(s, 'close', tgt.id);
      if (tgt) E.setSpeed(s, s.sink.h > 0.8 ? 'v4' : 'ab');
      if (tgt) E.pingContact(s, tgt.id);
      for (const a of s.an) if (a.state === 'open') { const c = E.classify(s, a); if (a.idStatus === 'hostile' || (c.n >= 2 && c.post.real > 0.45)) E.lockContact(s, a.id); else if (c.n >= 2 && c.post.real < 0.1) E.dismissContact(s, a.id); }
      for (const a of s.an) if (a.state === 'locked') { if (a.stale) E.refreshSolution(s, a.id); if (fireReady(s, a)) E.fire(s, a.id, null, 0); if (a.anchor && E.closeInfo(s, a).d <= E.P.closeRange) E.fireClose(s, a.id); }
    },
    reader: (s, k, r, mem) => reader(s, k, r, mem, {}),
    steady: (s, k, r, mem) => reader(s, k, r, mem, Object.assign({ discipline: true, coil: true, treat: true }, EXP)),
    random(s, k, r) {
      if (s.sink.h > 0.9 && !s.vent.on) E.startVent(s); else if (s.vent.on && r() < 0.05) E.stopVent(s);
      if (r() < 0.02) { const a = s.an[Math.floor(r() * s.an.length)]; if (a.state === 'open') r() < 0.5 ? E.lockContact(s, a.id) : E.dismissContact(s, a.id); }
      if (r() < 0.05) { const w = s.analysts[Math.floor(r() * 3)], a = s.an[Math.floor(r() * s.an.length)]; E.assign(s, w.id, a.id); }
      if (r() < 0.02) { const a = s.an[Math.floor(r() * s.an.length)]; E.pingContact(s, a.id); }
      if (r() < 0.02) { const m = ['still', 'evade', 'close', 'separate'][Math.floor(r() * 4)], a = s.an[Math.floor(r() * s.an.length)]; E.setOrder(s, m, a.id); E.setSpeed(s, ['v1', 'v2', 'v3', 'v4', 'v5'][Math.floor(r() * 5)]); }
      if (r() < 0.01) E.goQuiet(s);
      for (const a of s.an) if (a.state === 'locked') { if (a.stale && r() < 0.1) E.refreshSolution(s, a.id); if (fireReady(s, a) && r() < 0.1) E.fire(s, a.id, a.anchor.spd * (2 + 6 * r()), Math.floor(r() * 25)); }
    }
  };
  function mkRand(seed) { let a = (seed * 2654435761) >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const API = { BOTS, mkRand, reader, helpers: { live, incoming, anyAware, dist, sinkCare, bestCone, fireReady } };
  root.HuntBots = API; if (typeof module !== 'undefined') module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
