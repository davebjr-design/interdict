// Interdict hunt engine (pure logic, no DOM). Turn = 1 minute. Rules mirror sim/anomalies_v2.py + sim/cone_density.py.
const HuntEngine = (() => {
  const P = { N: 8, nreal: 2, nlure: 3, D: 0.7, base: 0.045, draw: 0.02, stages: 3, chase: 4, chasemult: 2.5, bait: 0.5, rescan: 5, engage: 2, squeezeAfter: 8, squeezeRamp: 0.04, probeHazard: 0.12, trackGlow: 0.10, missileSpeed: 8, alongStretch: 1.5, arena: 40 };
  const POSTURE = { still: { haz: 0.8, rate: 1.0, label: 'Stay still', tip: 'Hunter finds you at 0.8x speed. Reads at normal speed.' }, evade: { haz: 0.5, rate: 0.8, label: 'Evasion pattern', tip: 'Hunter finds you at 0.5x speed, but your reads are 20% slower.' }, close: { haz: 1.5, rate: 1.4, label: 'Close on a point', tip: 'Hunter finds you at 1.5x speed, but your reads are 40% faster.' } };
  const SETTINGS = { 1: 'Quick', 2: 'Standard', 3: 'Thorough' };
  function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function gauss(r) { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  function newHunt(seed, opts = {}) {
    const r = rng(seed); const kinds = [];
    for (let i = 0; i < P.nreal; i++) kinds.push('real'); for (let i = 0; i < P.nlure; i++) kinds.push('lure'); while (kinds.length < P.N) kinds.push('ghost');
    for (let i = kinds.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [kinds[i], kinds[j]] = [kinds[j], kinds[i]]; }
    const lureMean = opts.lureMean ?? -(0.1 + 0.7 * r());       // strong lure ~ -0.1, weak ~ -0.8
    const tempo = opts.tempo ?? (0.7 + 0.8 * r());              // enemy tempo 0.7..1.5
    const grids = ['none', 'light', 'heavy'];
    const an = kinds.map((k, i) => {
      let x0, y0; do { x0 = 6 + r() * 28; y0 = 6 + r() * 28; } while (Math.hypot(x0 - 20, y0 - 20) < 9); const hd = Math.atan2(20 - y0, 20 - x0) + (r() - 0.5) * 2.0;
      const v = k === 'ghost' ? 0.3 + 0.4 * r() : 1.0 + 1.2 * r();
      return { id: i, kind: k, x0, y0, hd, v, vx: v * Math.cos(hd), vy: v * Math.sin(hd), ev: 0, state: 'open', lock: 0, track: 0, grid: grids[Math.floor(r() * 3)], flutter: null, age: 0, anchor: null };
    });
    return { r, seed, t: 0, stage: 0, an, lureMean, tempo, log: [], beats: 0, over: null, disabled: 0, pellFlip: {}, player: { x: P.arena / 2, y: P.arena / 2 }, shots: 0, reload: 0 };
  }
  function beat(s, text, kind = 'info') { s.beats++; s.log.push({ t: s.t, text, kind }); }
  function hazardRoll(s, mult, posture, active, extra = 0) {
    const sq = s.t > P.squeezeAfter ? 1 + P.squeezeRamp * (s.t - P.squeezeAfter) : 1;
    const p = (P.base * s.tempo * mult * POSTURE[posture].haz * sq) + P.draw * active + extra;
    if (s.r() < p) { s.stage++; const lines = ['Hunter\'s bearing just shifted. Probably hostile. Definitely rude, arriving unannounced.', 'Hunter is within sprint range. Heat on their side is climbing.', 'Hunter has a solution on us.']; beat(s, lines[Math.min(s.stage - 1, 2)], 'danger'); if (s.stage >= P.stages) s.over = 'found'; return true; } return false;
  }
  function flutterRead(a, r) {  // grid read with ~76% accuracy
    const order = ['none', 'light', 'heavy']; let k = order.indexOf(a.grid);
    if (r() > 0.76) k = (k + (r() < 0.5 ? 1 : 2)) % 3; return order[k];
  }
  function step(s, o) {  // o: {study:[ids], T, posture, probe:id|null, pell:bool}
    if (s.over) return;
    s.t++; const posture = o.posture || 'still'; const slots = 2 + (o.pell ? 1 : 0);
    const study = (o.study || []).filter(i => s.an[i].state === 'open' || s.an[i].state === 'locked').slice(0, slots);
    if (o.probe != null && s.an[o.probe].state === 'open' && !study.includes(o.probe)) study.push(o.probe);
    const probeOn = o.probe != null && s.an[o.probe]?.state === 'open';
    s.an.forEach(a => { a.age++; });
    if (!study.length) beat(s, 'Nobody is studying anything. Pell: "Riveting. I will narrate the void."', 'quiet');
    const trackN = study.filter(i => s.an[i].state === 'locked').length;
    hazardRoll(s, 1, posture, study.length, (probeOn ? P.probeHazard : 0) + P.trackGlow * trackN);
    if (s.over) return;
    study.forEach((id, idx) => {
      const a = s.an[id]; if (a.state === 'locked') { a.track++; a.age = 0; scan(s, a); beat(s, `Tracking contact ${id + 1}: heading now good to about ${(a.anchor.hs * 57.3).toFixed(0)} degrees.`, 'info'); return; } if (a.state !== 'open') return;
      let mean = P.D * POSTURE[posture].rate * (a.kind === 'real' ? 1 : a.kind === 'lure' ? s.lureMean : -1);
      let flipped = false; if (o.pell && idx === study.length - 1 && s.r() < 0.10) { mean = -mean; flipped = true; }
      if (probeOn && id === o.probe) mean = (a.kind === 'real' ? 2.2 : a.kind === 'lure' ? -1.0 : -2.2);
      a.ev += mean + gauss(s.r); a.age = 0; if (flipped) s.pellFlip[id] = true;
      if (!a.flutter && Math.abs(a.ev) > 1) a.flutter = flutterRead(a, s.r);
      const T = o.T || 2;
      if (a.ev >= T) {
        a.lock = a.ev;
        if (a.kind === 'real') { a.state = 'locked'; a.track = 0; scan(s, a); beat(s, `Contact ${id + 1} looks like a real ship. Locked. Abara wants a firing plan.`, 'good'); }
        else {  // false rule-in: chase
          beat(s, `Contact ${id + 1} ruled in... and it is ${a.kind === 'lure' ? 'a lure' : 'static'}. Chasing it burns four minutes.`, 'bad');
          for (let c = 0; c < P.chase && !s.over; c++) { s.t++; hazardRoll(s, P.chasemult, posture, 0); }
          if (!s.over && a.kind === 'lure' && s.r() < P.bait) { s.stage++; beat(s, 'It was bait. The hunter moved up.', 'danger'); if (s.stage >= P.stages) s.over = 'found'; }
          a.state = 'out';
        }
      } else if (a.ev <= -T) { a.state = 'out'; beat(s, `Contact ${id + 1} ruled out${s.pellFlip[id] ? ' (Pell: "that one might have been my fault.")' : ''}.`, 'info'); }
    });
    if (s.over) return;
    const open = s.an.filter(a => a.state === 'open').length, locked = s.an.filter(a => a.state === 'locked').length;
    if (!open && !locked && s.disabled < P.nreal) { s.t += P.rescan; beat(s, 'Everything is ruled out and the ships are still out there. Rescanning costs five minutes.', 'bad'); s.an.forEach(a => { if (a.state === 'out') { a.state = 'open'; a.ev = 0; a.flutter = null; } }); for (let i = 0; i < P.rescan; i++) { if (s.over) break; hazardRoll(s, 0.5, posture, 0); } }
  }
  function truePos(a, t) { return { x: a.x0 + a.vx * t, y: a.y0 + a.vy * t }; }
  function scan(s, a) {  // (re)anchor a locked ship: position known well, heading and speed known to a track-dependent error
    const hs = Math.max(0.05, 0.6 - 0.12 * a.track), ss = Math.max(0.06, 0.45 - 0.09 * a.track), p = truePos(a, s.t);
    a.anchor = { x: p.x + gauss(s.r) * 0.4, y: p.y + gauss(s.r) * 0.4, t: s.t, hdg: a.hd + gauss(s.r) * hs, spd: a.v * (1 + gauss(s.r) * ss), hs, ss };
  }
  function estAt(a, tau) { const q = a.anchor; return { x: q.x + Math.cos(q.hdg) * q.spd * tau, y: q.y + Math.sin(q.hdg) * q.spd * tau }; }
  function spreadAt(a, tau) { const q = a.anchor; return { along: Math.max(0.4, q.spd * tau * q.ss), cross: Math.max(0.4, q.spd * tau * q.hs) }; }
  // Where the shot should go: iterate flight time (it depends on where you aim). Returns progress L (km along the est. path from the anchor).
  function fanInfo(s, a, L) {
    const q = a.anchor, pl = s.player; let tau = (s.t - q.t) + P.engage + 2, aim;
    if (L == null) { for (let i = 0; i < 6; i++) { aim = estAt(a, tau); const tf = Math.hypot(aim.x - pl.x, aim.y - pl.y) / P.missileSpeed; tau = (s.t - q.t) + P.engage + tf; } L = q.spd * tau; }
    aim = { x: q.x + Math.cos(q.hdg) * L, y: q.y + Math.sin(q.hdg) * L };
    const tf = Math.hypot(aim.x - pl.x, aim.y - pl.y) / P.missileSpeed, tauImp = (s.t - q.t) + P.engage + tf, sp = spreadAt(a, tauImp);
    return { L, aim, tf, tauImp, along: sp.along, cross: sp.cross, bestL: q.spd * tauImp, dir: q.hdg, anchor: q };
  }
  function sigmaFor(s, a) { const f = fanInfo(s, a); return Math.max(f.along, f.cross); }
  const GRID = { none: [0, 0.6], light: [1, 0.6], heavy: [3, 0.7] };
  function intercept(a, cone) { const [ch, pk] = GRID[a.grid], win = 1 + Math.min(1, cone / 4); return Math.min(0.9, ch * win * pk / 4); }
  function volleyHits(aim, cone, tx, ty, a, r, dir) {  // 4 missiles scattered around aim; elongated along the path
    const cd = Math.cos(dir), sd = Math.sin(dir), pi = intercept(a, cone);
    for (let k = 0; k < 4; k++) { const al = gauss(r) * cone * P.alongStretch, cr = gauss(r) * cone; const ax = aim.x + al * cd - cr * sd, ay = aim.y + al * sd + cr * cd; if (Math.hypot(ax - tx, ay - ty) < 3 && r() >= pi) return true; }
    return false;
  }
  // Player's expected hit chance from their own picture (est. path with its uncertainty), not from the hidden truth.
  function hitProb(s, a, L, cone, M = 800, r = Math.random) {
    const f = fanInfo(s, a, L), cd = Math.cos(f.dir), sd = Math.sin(f.dir), m = estAt(a, f.tauImp); let n = 0;
    for (let i = 0; i < M; i++) { const al = gauss(r) * f.along, cr = gauss(r) * f.cross; if (volleyHits(f.aim, cone, m.x + al * cd - cr * sd, m.y + al * sd + cr * cd, a, r, f.dir)) n++; }
    return n / M;
  }
  function fire(s, id, L, cone) {
    const a = s.an[id]; if (s.over || a.state !== 'locked') return;
    s.t += P.engage; s.shots++; s.an.forEach(x => x.age += P.engage);
    for (let i = 0; i < P.engage && !s.over; i++) hazardRoll(s, 0.4, 'still', 0);
    if (s.over) return;
    const f = fanInfo(s, a, L), t = truePos(a, s.t + f.tf);    // judged against where the ship really is when the missiles land
    const hit = volleyHits(f.aim, cone, t.x, t.y, a, s.r, f.dir);
    if (hit) { a.state = 'disabled'; s.disabled++; beat(s, `Contact ${id + 1} is crippled. Nobody dies; the reactor just remembers it has feelings.`, 'good'); if (s.disabled >= P.nreal) s.over = 'win'; }
    else if (s.r() < 0.6) { s.stage++; beat(s, 'The volley missed, and the launch lit us up. The hunter noticed.', 'danger'); if (s.stage >= P.stages) s.over = 'found'; }
    else beat(s, 'The volley missed. Quiet launch; the hunter did not notice. Refit the aim and try again.', 'bad');
  }
  function retreat(s) { if (s.over) return; s.over = s.disabled ? 'breach' : 'breach0'; beat(s, 'You break contact and Breach out while you still can.', 'bad'); }
  return { P, POSTURE, SETTINGS, newHunt, step, fire, hitProb, sigmaFor, fanInfo, truePos, estAt, spreadAt, retreat };
})();
if (typeof module !== 'undefined') module.exports = HuntEngine;
