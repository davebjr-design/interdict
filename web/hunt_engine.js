// Interdict hunt engine (pure logic, no DOM). Turn = 1 minute. Rules mirror sim/anomalies_v2.py + sim/cone_density.py.
const HuntEngine = (() => {
  const P = { N: 8, nreal: 2, nlure: 3, D: 0.7, base: 0.045, draw: 0.02, stages: 3, chase: 4, chasemult: 2.5, bait: 0.5, rescan: 5, engage: 2, squeezeAfter: 8, squeezeRamp: 0.04, probeHazard: 0.12, trackGlow: 0.10, arena: 40 };
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
    const an = kinds.map((k, i) => ({ id: i, kind: k, x: r() * P.arena, y: r() * P.arena, ev: 0, state: 'open', lock: 0, track: 0, grid: grids[Math.floor(r() * 3)], flutter: null, age: 0 }));
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
      const a = s.an[id]; if (a.state === 'locked') { a.track++; a.age = 0; beat(s, `Tracking contact ${id + 1}: the Fan tightens to about ${sigmaFor(a).toFixed(1)} km.`, 'info'); return; } if (a.state !== 'open') return;
      let mean = P.D * POSTURE[posture].rate * (a.kind === 'real' ? 1 : a.kind === 'lure' ? s.lureMean : -1);
      let flipped = false; if (o.pell && idx === study.length - 1 && s.r() < 0.10) { mean = -mean; flipped = true; }
      if (probeOn && id === o.probe) mean = (a.kind === 'real' ? 2.2 : a.kind === 'lure' ? -1.0 : -2.2);
      a.ev += mean + gauss(s.r); a.age = 0; if (flipped) s.pellFlip[id] = true;
      if (!a.flutter && Math.abs(a.ev) > 1) a.flutter = flutterRead(a, s.r);
      const T = o.T || 2;
      if (a.ev >= T) {
        a.lock = a.ev;
        if (a.kind === 'real') { a.state = 'locked'; a.track = 0; beat(s, `Contact ${id + 1} looks like a real ship. Locked. Abara wants a firing plan.`, 'good'); }
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
  function sigmaFor(a) { return Math.max(1.0, 9.5 - 2.0 * a.track) + 0.35 * (a.age || 0); }  // sharper lock, tighter Fan (T1 ~7.5, T2 ~5, T3 ~2.5)
  const GRID = { none: [0, 0.6], light: [1, 0.6], heavy: [3, 0.7] };
  function hitProb(a, cone, M = 4000, r = Math.random) {
    const sg = sigmaFor(a), [ch, pk] = GRID[a.grid], win = 1 + Math.min(1, cone / 4); let any = 0;
    for (let m = 0; m < M; m++) {
      const tx = gauss(r) * sg, ty = gauss(r) * sg; let hit = false;
      for (let k = 0; k < 4 && !hit; k++) { const ax = gauss(r) * cone, ay = gauss(r) * cone; if (Math.hypot(ax - tx, ay - ty) < 3 && r() >= Math.min(0.9, ch * win * pk / 4)) hit = true; }
      if (hit) any++;
    } return any / M;
  }
  function fire(s, id, cone) {
    const a = s.an[id]; if (s.over || a.state !== 'locked') return;
    s.t += P.engage; s.shots++; s.an.forEach(x => x.age += P.engage);
    for (let i = 0; i < P.engage && !s.over; i++) hazardRoll(s, 0.4, 'still', 0);
    if (s.over) return;
    const hit = s.r() < hitProb(a, cone, 1500, s.r);
    if (hit) { a.state = 'disabled'; s.disabled++; beat(s, `Contact ${id + 1} is crippled. Nobody dies; the reactor just remembers it has feelings.`, 'good'); if (s.disabled >= P.nreal) s.over = 'win'; }
    else if (s.r() < 0.6) { s.stage++; beat(s, 'The volley missed, and the launch lit us up. The hunter noticed.', 'danger'); if (s.stage >= P.stages) s.over = 'found'; }
    else beat(s, 'The volley missed. Quiet launch; the hunter did not notice. Refit the cone and try again.', 'bad');
  }
  function retreat(s) { if (s.over) return; s.over = s.disabled ? 'breach' : 'breach0'; beat(s, 'You break contact and Breach out while you still can.', 'bad'); }
  return { P, POSTURE, SETTINGS, newHunt, step, fire, hitProb, sigmaFor, retreat };
})();
if (typeof module !== 'undefined') module.exports = HuntEngine;
