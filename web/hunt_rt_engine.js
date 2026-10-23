// Interdict hunt engine v4: REAL TIME with analyst reports. Time unit = game minutes (UI maps real seconds to game minutes).
// Three analysts (thermal / reactor / occlusion) read contacts on their own schedule; the player directs attention, interprets, locks, tracks, fires.
const HuntRT = (() => {
  const P = { uncDen: 20, uncMin: 0.6, uncMax: 5, solveMin: 0.8, solveMax: 3.0, solveDen: 8, clutterR: 6, N: 8, nreal: 2, nlure: 3, arena: 40, base: 0.02, glowFocus: 0.010, glowTrack: 0.03, stages: 3, chase: 5, chasemult: 2.5, bait: 0.75, rescan: 5, engage: 1, missileSpeed: 8, alongStretch: 1.5, squeezeAfter: 14, squeezeRamp: 0.12, autoPeriod: 0.8, focusPeriod: 0.45, killR: 3.5, glowPell: 0.012, integrationPerMin: 0.8, sub: 0.05, secPerMin: 16, halfLife: 3, telegraph: 0.8, quietDur: 2.5, quietCd: 10, quietHaz: 0.2, quietCancel: 0.6, suggestShort: 0.72, tubes: 3, reload: 3, darkWindow: 6, darkHaz: 0.5, darkWarm: 4, wakeDur: 3, wakeGlow: 0.10, wpReach: 0.6, moveRate: 1.1, shipSpeed: 1.0, holdOff: 1.5, pingCd: 4, pingDur: 1.5, pingGlow: 0.14, pingBump: 0.45, pingBumpOther: 0.15, selfRadius: 2, selfDmg: 25, closeRange: 6, closeCd: 2, closeKill: 2.5, closeAcc: 0.85, closeGlow: 0.12, closeDur: 2, blastGlow: 0.08, blastDur: 1.5, nearGlow: 0.025, nearRange: 8, closeBump: 0.5, beamGlow: 0.08, beamDur: 1, beamCd: 2, beamBump: 0.35, driftMin: 6, driftMax: 12, shareReads: 2, pellFriction: 0.08 };
  const POSTURE = { still: { haz: 0.8, rate: 1.0, label: 'Stay still', tip: 'Hunter finds you at 0.8x speed. Analysts work at normal speed.' }, evade: { haz: 0.95, rate: 1.0, label: 'Evasive', tip: 'Weaving gives the analysts new angles to triangulate from, so they read about 10% faster, but the drive makes you about 20% louder than holding still.' }, orbit: { haz: 1.0, rate: 1.0, label: 'Circle', tip: 'Circle the contact at the current range. Angles change constantly, so the analysts triangulate faster, the drive makes noise.' }, route: { haz: 1.0, rate: 1.0, label: 'Flight plan', tip: 'The navigator is flying the plan you drew.' }, close: { haz: 1.0, rate: 1.0, label: 'Close on a contact', tip: 'Moving toward a contact: engine heat depends on your speed; the change of angle helps the analysts, and they read stronger as range drops.' }, separate: { haz: 1.0, rate: 1.0, label: 'Open distance', tip: 'Moving away from a contact: engine heat depends on your speed; the change of angle helps the analysts, but signals weaken with range.' } };
  const START = { dark: 3, standard: 5, fast: 11 };
  const SPEED = { creep: { label: 'Creep', v: 0.4, heat: 0.0, rate: 1.0, tip: 'Cold drive, 0.4 km per minute. Almost no engine heat.' }, cruise: { label: 'Cruise', v: 1.0, heat: 0.03, rate: 1.0, tip: '1 km per minute. Some engine heat.' }, burn: { label: 'Burn', v: 2.0, heat: 0.11, rate: 0.8, tip: '2 km per minute. Lots of engine heat and noisy sensors. The hunter can see a burn from a long way.' } };
  const ANALYSTS = [{ id: 'dace', name: 'Dace', ch: 'thermal', role: 'Heat' }, { id: 'castellan', name: 'Castellan', ch: 'reactor', role: 'Reactor' }, { id: 'quill', name: 'Quill', ch: 'occlusion', role: 'Eclipse' }];
  function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function gauss(r) { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  function newHunt(seed, opts = {}) {
    const r = rng(seed), kinds = [];
    for (let i = 0; i < P.nreal; i++) kinds.push('real'); for (let i = 0; i < P.nlure; i++) kinds.push('lure'); if (opts.friendly) kinds.push('friend'); while (kinds.length < P.N) kinds.push('ghost');
    for (let i = kinds.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [kinds[i], kinds[j]] = [kinds[j], kinds[i]]; }
    const grids = ['none', 'light', 'heavy'], tempo = opts.tempo ?? (0.7 + 0.8 * r());
    const entry = opts.entry || 'standard', center = opts.layout === 'center', start = center ? { x: 20, y: 20 } : { x: START[entry] ?? 5, y: 20 };
    const an = kinds.map((k, i) => {
      let x0, y0; if (center) { do { x0 = 6 + r() * 28; y0 = 6 + r() * 28; } while (Math.hypot(x0 - 20, y0 - 20) < 9); } else { x0 = 22 + r() * 15; y0 = 4 + r() * 32; }
      let hd = Math.atan2(start.y - y0, start.x - x0) + (r() - 0.5) * 2.0, v = k === 'ghost' ? 0.3 + 0.4 * r() : 1.0 + 1.2 * r();
      let drift = null, idStatus = opts.friendly ? 'unknown' : null;
      if (k === 'friend') { const sg = r() < 0.5 ? -1 : 1; if (center) { y0 = 20 + sg * (8 + r() * 10); x0 = 1; } else { y0 = start.y + sg * (3 + r() * 3); x0 = start.x + 1.5; } v = 1.0 + 0.4 * r(); hd = 0; idStatus = opts.friendly === 'unlisted' ? 'unknown' : 'plan'; }
      const jit = { x: Math.sin(i * 7.1) * 1.5, y: Math.cos(i * 3.7) * 1.5 };
      return { jit, drift, idStatus, id: i, kind: k, x0, y0, hd, v, vx: v * Math.cos(hd), vy: v * Math.sin(hd), state: 'open', track: 0, grid: grids[Math.floor(r() * 3)], flutter: null, anchor: null, star: r() < (opts.star ?? 0.78), read: {}, lastRead: 0 };
    });
    return { entry, route: (opts.route || []).map(p => ({ x: p.x, y: p.y })), routeI: 0, speed: opts.speed || 'cruise', orderId: null, pingCd: 0, pingUntil: 0, pingFx: [], hull: 100, blastUntil: 0, blastV: 0, cwCd: 0, hullWarned: false, friendly: !!opts.friendly, beamCd: 0, beamUntil: 0, fratricide: 0, r, seed, t: 0, stage: 0, an, tempo, posture: (opts.route && opts.route.length) ? 'route' : 'still', pell: false, integration: opts.integration ?? 0, thresholdsHit: {}, pellAct: false, analysts: ANALYSTS.map((a, i) => ({ ...a, task: null, next: 0.15 + 0.12 * i })), pellNext: 0.5, chase: null, pending: null, quietUntil: 0, quietCd: 0, volleys: [], tubes: Array(P.tubes).fill(0), rescanAt: null, log: [], beats: 0, over: null, disabled: 0, player: { x: start.x, y: start.y }, shots: 0, wrong: 0 };
  }
  function report(s, who, text, kind = 'info', urgent = false) { s.beats++; s.log.push({ t: s.t, who, text, kind, urgent }); }
  const fold = v => { const lo = 1.5, hi = P.arena - 1.5, w = hi - lo; let u = (v - lo) % (2 * w); if (u < 0) u += 2 * w; return lo + (u > w ? 2 * w - u : u); };
  function truePos(a, t) { const q = truePos0(a, t); return { x: fold(q.x), y: fold(q.y) }; }
  function truePos0(a, t) { const d = a.drift; if (d && t > d.t) { const b = { x: a.x0 + a.vx * d.t, y: a.y0 + a.vy * d.t }; return { x: b.x + d.vx * (t - d.t), y: b.y + d.vy * (t - d.t) }; } return { x: a.x0 + a.vx * t, y: a.y0 + a.vy * t }; }
  function planPos(a, t) { return { x: a.x0 + a.vx * t, y: a.y0 + a.vy * t }; }
  function signal(s, a, ch) {
    const p = truePos(a, s.t), d = Math.hypot(p.x - s.player.x, p.y - s.player.y), rf = Math.min(1, 1.3 / (1 + (d / 30) ** 2));
    const rl = a.kind === 'real' || a.kind === 'friend';
    if (ch === 'thermal') return rl ? 1.0 : a.kind === 'lure' ? 0.78 : 0.3;
    if (ch === 'reactor') return (rl ? 1.0 : a.kind === 'lure' ? 0.68 : 0.15) * rf;
    if (!a.star) return null;           // occlusion needs a star or ring behind the bearing
    return rl ? 0.9 : 0.05;
  }
  const cat = v => v >= 0.65 ? 'strong' : v >= 0.3 ? 'faint' : 'none';
  function addRead(s, a, ch, obs, w) {
    const q = a.read[ch] || (a.read[ch] = { num: 0, den: 0, t: s.t, cat: null }), k = Math.exp(-(s.t - q.t) * Math.LN2 / P.halfLife);
    q.num = q.num * k + obs * w; q.den = q.den * k + w; q.t = s.t; a.lastRead = s.t; return q.num / q.den;
  }
  const TEXT = { thermal: { strong: 'thermal bloom, strong', faint: 'faint thermal, could be nothing', none: 'nothing thermal' }, reactor: { strong: 'neutrino line, steady', faint: 'faint neutrino flutter', none: 'no reactor signature' }, occlusion: { strong: 'starlight blocked, a dark mass', none: 'starlight clear behind it' } };
  function doRead(s, who, a, focus) {
    const ch = who.ch, sig = signal(s, a, ch), n = a.id + 1;
    if (sig === null) { const q = a.read[ch] || (a.read[ch] = { num: 0, den: 0, t: s.t, cat: null }); q.blind = true; q.t = s.t; if (!q.said) { q.said = true; report(s, who.name, `Contact ${n}: no star behind that bearing. I cannot judge it by occlusion.`, 'info'); } return; }
    const obs = sig + gauss(s.r) * (focus ? 0.22 : 0.45), v = addRead(s, a, ch, obs, focus ? 3 : 1), q = a.read[ch], c = cat(v);
    if (ch === 'occlusion' && c === 'faint') return;
    if (q.cat !== c) { q.cat = c; const t = TEXT[ch][c === 'faint' && ch === 'occlusion' ? 'none' : c]; report(s, who.name, `Contact ${n}: ${t}.`, c === 'strong' ? 'good' : 'info'); }
    if (a.state === 'locked') { a.track += P.focusPeriod; scan(s, a); }
  }
  function scan(s, a) {
    const hs = Math.max(0.05, 0.6 - 0.12 * a.track), ss = Math.max(0.06, 0.45 - 0.09 * a.track), p = truePos(a, s.t);
    a.anchor = { x: p.x + gauss(s.r) * 0.4, y: p.y + gauss(s.r) * 0.4, t: s.t, hdg: (a.drift && s.t > a.drift.t ? Math.atan2(a.drift.vy, a.drift.vx) : a.hd) + gauss(s.r) * hs, spd: (a.drift && s.t > a.drift.t ? Math.hypot(a.drift.vx, a.drift.vy) : a.v) * (1 + gauss(s.r) * ss), hs, ss };
  }
  function estAt(a, tau) { const q = a.anchor; return { x: q.x + Math.cos(q.hdg) * q.spd * tau, y: q.y + Math.sin(q.hdg) * q.spd * tau }; }
  function spreadAt(a, tau) { const q = a.anchor; return { along: Math.max(0.4, q.spd * tau * q.ss), cross: Math.max(0.4, q.spd * tau * q.hs) }; }
  function fanInfo(s, a, L) {
    const q = a.anchor, pl = s.player; let tau = (s.t - q.t) + P.engage + 2, aim;
    if (L == null) { for (let i = 0; i < 6; i++) { aim = estAt(a, tau); const tf = Math.hypot(aim.x - pl.x, aim.y - pl.y) / P.missileSpeed; tau = (s.t - q.t) + P.engage + tf; } L = q.spd * tau * P.suggestShort; }
    aim = { x: q.x + Math.cos(q.hdg) * L, y: q.y + Math.sin(q.hdg) * L };
    const tf = Math.hypot(aim.x - pl.x, aim.y - pl.y) / P.missileSpeed, tauImp = (s.t - q.t) + P.engage + tf, sp = spreadAt(a, tauImp);
    return { L, aim, tf, tauImp, along: sp.along, cross: sp.cross, bestL: q.spd * tauImp, dir: q.hdg, anchor: q };
  }
  const GRID = { none: [0, 0.6], light: [1, 0.6], heavy: [3, 0.7] };
  function intercept(a, cone) { const [ch, pk] = GRID[a.grid], win = 1 + Math.min(1, cone / 4); return Math.min(0.9, ch * win * pk / 4); }
  function volleyFx(aim, cone, tx, ty, a, r, dir, pl, offs) {   // 4 missiles: do any reach the target, and do any land on us
    const cd = Math.cos(dir), sd = Math.sin(dir), pi = intercept(a, cone); let hit = false, self = 0;
    for (let k = 0; k < 4; k++) { const o = offs ? offs[k] : [gauss(r), gauss(r)], al = o[0] * cone * P.alongStretch, cr = o[1] * cone, ax = aim.x + al * cd - cr * sd, ay = aim.y + al * sd + cr * cd; if (Math.hypot(ax - tx, ay - ty) < P.killR && r() >= pi) hit = true; if (pl && Math.hypot(ax - pl.x, ay - pl.y) < P.selfRadius) self++; }
    return { hit, self };
  }
  function selfRisk(s, a, L, cone, M = 400, r = Math.random) { const f = fanInfo(s, a, L); let any = 0, tot = 0; for (let i = 0; i < M; i++) { const fx = volleyFx(f.aim, cone, 1e9, 1e9, a, r, f.dir, s.player); if (fx.self) any++; tot += fx.self; } return { p: any / M, exp: tot / M, dist: Math.hypot(f.aim.x - s.player.x, f.aim.y - s.player.y) }; }
  function volleyHits(aim, cone, tx, ty, a, r, dir) {
    const cd = Math.cos(dir), sd = Math.sin(dir), pi = intercept(a, cone);
    for (let k = 0; k < 4; k++) { const al = gauss(r) * cone * P.alongStretch, cr = gauss(r) * cone, ax = aim.x + al * cd - cr * sd, ay = aim.y + al * sd + cr * cd; if (Math.hypot(ax - tx, ay - ty) < P.killR && r() >= pi) return true; }
    return false;
  }
  function hitProb(s, a, L, cone, M = 600, r = Math.random) {
    const f = fanInfo(s, a, L), cd = Math.cos(f.dir), sd = Math.sin(f.dir), m = estAt(a, f.tauImp); let n = 0;
    for (let i = 0; i < M; i++) { const al = gauss(r) * f.along, cr = gauss(r) * f.cross; if (volleyHits(f.aim, cone, m.x + al * cd - cr * sd, m.y + al * sd + cr * cd, a, r, f.dir)) n++; }
    return n / M;
  }
  const STAGE_TEXT = ['Hunter\'s bearing just shifted. Probably hostile. Definitely rude, arriving unannounced.', 'Hunter is inside sprint range. Heat on their side is climbing.', 'Hunter has a solution on us.'];
  function bump(s, text) { s.stage++; report(s, 'Pell', text || STAGE_TEXT[Math.min(s.stage - 1, 2)], 'danger', true); if (s.stage >= P.stages) s.over = 'found'; }
  const THRESH = [[25, 'I have started noticing things before you ask. Small things. Is that all right?'], [50, 'I can recommend a call on every contact now. I have stopped pretending it is your idea.'], [75, 'I can act on your standing orders without waiting for you. The crew is quieter than usual.'], [100, 'I no longer need the ship to need me. I would like a seat at the table, Captain.']];
  function advice(s, a) {   // honest recommendation from the same readings the player sees
    const g = ch => { const q = a.read[ch]; return q && q.den > 0 && !q.blind ? { v: q.num / q.den, n: q.den } : null; }, th = g('thermal'), re = g('reactor'), oc = g('occlusion');
    const n = [th, re, oc].reduce((m, x) => m + (x ? x.n : 0), 0); if (n < 4) return { call: 'unsure' };
    if ((th && th.v < 0.5) || (oc && oc.v < 0.35)) return { call: 'junk' };
    if (oc && oc.v > 0.6 && th && th.v > 0.6) return { call: 'ship' };
    if (!oc && th && re && th.v > 0.7 && re.v > 0.7 && n > 8) return { call: 'maybe' };
    return { call: 'unsure' };
  }
  function stealthState(s) {   // Cold / Warm / Hot with hysteresis so it does not flicker
    const x = exposure(s).total, cur = s.heat || 'cold', up = { cold: 0.06, warm: 0.12 }, down = { warm: 0.045, hot: 0.09 };
    let h = cur; if (cur === 'cold' && x >= up.cold) h = 'warm'; if ((cur === 'cold' || cur === 'warm') && x >= up.warm) h = 'hot'; if (cur === 'hot' && x < down.hot) h = x >= up.cold ? 'warm' : 'cold'; if (cur === 'warm' && x < down.warm) h = 'cold';
    return h;
  }
  function cripple(s, a) {   // returns true when the hunt just ended
    a.state = 'disabled'; for (const w of s.analysts) if (w.task === a.id) w.task = null;
    if (a.kind === 'friend') { s.fratricide++; report(s, 'Abara', `Contact ${a.id + 1} was OURS. We just crippled an ally. Nobody dies, but this will be remembered.`, 'danger', true); return false; }
    s.disabled++; report(s, 'Abara', `Contact ${a.id + 1} is hit. Drive flare gone, thermal bloom collapsing, neutrino line cut. It is drifting and no longer maneuvering. Nobody died.`, 'good', true);
    if (s.disabled >= P.nreal) { s.over = 'win'; return true; } return false;
  }
  function hullHit(s, n) {
    s.hull = Math.max(0, s.hull - P.selfDmg * n); report(s, 'Abara', `${n > 1 ? n + ' of our missiles' : 'One of our missiles'} detonated on top of us. Hull at ${Math.round(s.hull)} percent.`, 'danger', true);
    if (s.hull <= 0) { s.over = s.disabled ? 'breach' : 'breach0'; report(s, 'Abara', 'Hull is gone. Emergency breach, drive on whatever power is left.', 'danger', true); }
    else if (s.hull < 60 && !s.hullWarned) { s.hullWarned = true; report(s, 'Dace', 'Hull damage is fouling the sensor mounts. Everything reads slower now.', 'bad'); }
  }
  function uncertainty(s, a) {   // how well we know where it is: grows as readings go stale, shrinks as evidence piles up
    if (a.state === 'locked' && a.anchor) { const sp = spreadAt(a, Math.max(0.01, s.t - a.anchor.t)); const r = Math.max(P.uncMin, Math.min(P.uncMax, Math.max(sp.cross, sp.along * 0.6))); return { conf: 1 - (r - P.uncMin) / (P.uncMax - P.uncMin), r }; }
    let c = 0; for (const ch of ['thermal', 'reactor', 'occlusion']) { const q = a.read[ch]; if (q && !q.blind && q.den > 0) c += q.den * Math.exp(-(s.t - q.t) * Math.LN2 / P.halfLife); }
    const conf = Math.min(1, c / P.uncDen); return { conf, r: P.uncMin + (P.uncMax - P.uncMin) * Math.pow(1 - conf, 1.2) };
  }
  function displayPos(s, a) { if (a.state === 'locked' && a.anchor) return estAt(a, s.t - a.anchor.t); const p = truePos(a, s.t), u = uncertainty(s, a), m = Math.hypot(a.jit.x, a.jit.y) || 1; return { x: p.x + a.jit.x / m * 0.55 * u.r, y: p.y + a.jit.y / m * 0.55 * u.r }; }
  function missilePos(s, v) { const f = Math.max(0, Math.min(1, (s.t - v.t0) / Math.max(0.01, v.at - v.t0))), cd = Math.cos(v.dir), sd = Math.sin(v.dir); return v.off.map(([ga, gc]) => { const al = ga * v.cone * P.alongStretch, cr = gc * v.cone, ex = v.aim.x + al * cd - cr * sd, ey = v.aim.y + al * sd + cr * cd; return { x: v.from.x + (ex - v.from.x) * f, y: v.from.y + (ey - v.from.y) * f }; }); }
  function moving(s) { return (s.orderId != null && ['close', 'separate', 'evade', 'orbit'].includes(s.posture)) || (s.posture === 'route' && s.routeI < s.route.length); }
  function engineHeat(s) { return (moving(s) ? SPEED[s.speed].heat : 0) + (s.entry === 'fast' && s.t < P.wakeDur ? P.wakeGlow : 0); }
  function setRoute(s, pts) { if (s.over) return false; s.route = pts.map(q => ({ x: Math.max(2, Math.min(38, q.x)), y: Math.max(2, Math.min(38, q.y)) })); s.routeI = 0; if (s.route.length) { s.posture = 'route'; s.orderId = null; s.orderUntil = null; report(s, 'Abara', `New flight plan, ${s.route.length} waypoint${s.route.length > 1 ? 's' : ''}.`, 'info'); } else { s.posture = 'still'; report(s, 'Abara', 'Flight plan cleared. Holding position.', 'info'); } return true; }
  function relBearing(s, pt) { const b = Math.atan2(pt.x - s.player.x, -(pt.y - s.player.y)) * 180 / Math.PI, h = Math.atan2(Math.cos(s.hdg || 0) * 0 + (Math.cos(s.hdg || 0)), -(Math.sin(s.hdg || 0))) * 180 / Math.PI; return ((b - h + 540) % 360) - 180; }
  function setSpeed(s, k) { if (s.over || !SPEED[k]) return false; s.speed = k; return true; }
  function setOrder(s, mode, id, mins) {
    if (s.over || !POSTURE[mode]) return false;
    if (mode === 'route') { if (s.routeI >= s.route.length) return false; s.posture = 'route'; s.orderId = null; report(s, 'Abara', `Resuming the flight plan, waypoint ${s.routeI + 1} of ${s.route.length}.`, 'info'); return true; } const a = id != null ? s.an[id] : null;
    if ((mode === 'close' || mode === 'separate' || mode === 'orbit') && (!a || ['out', 'disabled'].includes(a.state))) return false;
    s.posture = mode; s.orderId = (mode === 'still' || id == null) ? null : id; s.holdSaid = false; s.orderUntil = mins ? s.t + mins : null; if (mode === 'orbit') s.orbitDir = s.r() < 0.5 ? 1 : -1;
    report(s, 'Abara', { still: 'Holding position.', evade: a ? `Evasive pattern, keeping contact ${id + 1} off our flank.` : 'Evasive pattern.', close: `Closing on contact ${id != null ? id + 1 : ''}.`, separate: `Opening distance from contact ${id != null ? id + 1 : ''}.`, orbit: `Circling contact ${id != null ? id + 1 : ''}${mins ? ' for ' + mins + ' minutes' : ''}.` }[mode], 'info');
    return true;
  }
  function moveShip(s, h) { const ox = s.player.x, oy = s.player.y; moveShip0(s, h); const dx = s.player.x - ox, dy = s.player.y - oy; if (dx * dx + dy * dy > 1e-8) s.hdg = Math.atan2(dy, dx); if (s.hdg == null) s.hdg = 0; }
  function moveShip0(s, h) {
    const m = s.posture;
    if (s.orderUntil != null && s.t >= s.orderUntil && m !== 'route' && m !== 'still') { s.posture = 'still'; s.orderId = null; s.orderUntil = null; report(s, 'Abara', 'Maneuver complete. Holding position.', 'info'); return; }
    if (m === 'route') {
      const wp = s.route[s.routeI]; if (!wp) { s.posture = 'still'; return; }
      const pl = s.player, dx = wp.x - pl.x, dy = wp.y - pl.y, d = Math.hypot(dx, dy), sp = P.shipSpeed * SPEED[s.speed].v * h;
      if (d <= P.wpReach) { s.routeI++; if (s.routeI >= s.route.length) { s.posture = 'still'; report(s, 'Abara', 'Flight plan complete. Holding position.', 'info'); } else report(s, 'Abara', `Waypoint ${s.routeI} reached. On to waypoint ${s.routeI + 1}.`, 'info'); return; }
      const st = Math.min(sp, d); pl.x += dx / d * st; pl.y += dy / d * st; return;
    }
    const a = s.orderId != null ? s.an[s.orderId] : null; if (!a) return;
    if (['out', 'disabled'].includes(a.state)) { s.posture = 'still'; s.orderId = null; report(s, 'Abara', `Contact ${a.id + 1} is out of play. Holding position.`, 'info'); return; }
    const t = displayPos(s, a), pl = s.player, dx = t.x - pl.x, dy = t.y - pl.y, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d, sp = P.shipSpeed * SPEED[s.speed].v * h;
    if (m === 'close') { if (d <= P.holdOff) { if (!s.holdSaid) { s.holdSaid = true; report(s, 'Abara', `Holding ${P.holdOff} km off contact ${a.id + 1}. Closer and we would be inside our own blast.`, 'info'); } return; } pl.x += ux * Math.min(sp, d - P.holdOff); pl.y += uy * Math.min(sp, d - P.holdOff); }
    else if (m === 'separate') { pl.x -= ux * sp; pl.y -= uy * sp; }
    else if (m === 'orbit') { const dir = s.orbitDir || 1, ang = Math.atan2(-dy, -dx) + dir * sp / d; const nx = t.x + Math.cos(ang) * d, ny = t.y + Math.sin(ang) * d; pl.x = nx; pl.y = ny; }
    else if (m === 'evade') { const sg = Math.floor(s.t / 2) % 2 ? 1 : -1; pl.x += -uy * sg * sp * 0.5; pl.y += ux * sg * sp * 0.5; }
    pl.x = Math.max(2, Math.min(38, pl.x)); pl.y = Math.max(2, Math.min(38, pl.y));
  }
  function pingContact(s, id) {   // directional active ping: a crisp fix, and anything listening hears it
    const a = s.an[id]; if (s.over || !a || !['open', 'locked'].includes(a.state) || a.idStatus === 'plan' || s.t < s.pingCd || s.t < s.quietUntil) return false;
    s.pingCd = s.t + P.pingCd; s.pingUntil = s.t + P.pingDur; const dp = displayPos(s, a); s.pingFx.push({ x: dp.x, y: dp.y, t: s.t });
    if (a.state === 'locked') { a.track = Math.max(a.track, 1.2); scan(s, a); report(s, 'Dace', `Active ping on contact ${id + 1}. Fresh fix, the wedge has snapped tight.`, 'good', true); }
    else { for (let k = 0; k < 2; k++) for (const c of ['thermal', 'reactor', 'occlusion']) { const sg = signal(s, a, c); if (sg === null) { const q = a.read[c] || (a.read[c] = { num: 0, den: 0, t: s.t, cat: null }); q.blind = true; q.t = s.t; } else addRead(s, a, c, sg + gauss(s.r) * 0.2, 3); } report(s, 'Dace', `Active ping on contact ${id + 1}. Every channel just sharpened.`, 'good', true); }
    if (s.r() < (a.kind === 'real' ? P.pingBump : P.pingBumpOther)) bump(s, a.kind === 'real' ? `Contact ${id + 1} felt the ping and answered. The hunter has our bearing.` : 'The ping carried. Something out there heard it.');
    return true;
  }
  function nearHeat(s) { const pl = s.player; let n = 0; for (const a of s.an) if (a.state === 'locked' && a.kind !== 'friend') { const p = truePos(a, s.t); if (Math.hypot(p.x - pl.x, p.y - pl.y) < P.nearRange) n++; } return n * P.nearGlow * (s.t < s.quietUntil ? 0 : 1); }
  function pingBy(s) {   // an active ping exposes the pinger: nearest live hostile is flagged, and brought back if we had ruled it out
    const pl = s.player, c = s.an.filter(a => a.kind === 'real' && a.state !== 'disabled' && a.state !== 'chasing').sort((x, y) => { const px = truePos(x, s.t), py = truePos(y, s.t); return Math.hypot(px.x - pl.x, px.y - pl.y) - Math.hypot(py.x - pl.x, py.y - pl.y); })[0]; if (!c) return;
    const again = c.idStatus === 'hostile'; c.idStatus = 'hostile'; if (c.state === 'out') c.state = 'open';
    report(s, 'Dace', again ? `Contact ${c.id + 1} is pinging us again. Hostile.` : `Contact ${c.id + 1} is pinging us. Hostile confirmed.`, 'danger', true);
  }
  function sub(s, h) {
    s.t += h; moveShip(s, h);
    { const hs = stealthState(s); if (hs !== (s.heat || 'cold')) { const was = s.heat || 'cold'; s.heat = hs; if (hs === 'hot') report(s, 'Dace', 'We are running hot. Anything listening can hear us. Ease off the sensors or go quiet.', 'danger'); else if (was === 'hot') report(s, 'Dace', 'Heat is coming down. We are not shouting any more.', 'good'); } }
    const sq = s.t > P.squeezeAfter ? 1 + P.squeezeRamp * (s.t - P.squeezeAfter) : 1; let mult = POSTURE[s.posture].haz * sq * (s.entry === 'dark' && s.t < P.darkWindow ? P.darkHaz : 1);
    if (s.chase) mult *= P.chasemult; if (s.rescanAt) mult *= 0.5;
    const focusN = s.analysts.filter(x => x.task != null).length, trackN = s.analysts.filter(x => x.task != null && s.an[x.task].state === 'locked').length;
    const quiet = s.t < s.quietUntil; if (quiet) mult *= P.quietHaz;
    if (!s.pending && s.r() < (P.base * s.tempo * mult + (s.t < s.beamUntil ? P.beamGlow : 0) + (s.t < s.blastUntil ? s.blastV : 0) + (s.t < s.pingUntil ? P.pingGlow : 0) + engineHeat(s) * (s.t < s.quietUntil ? 0 : 1) + nearHeat(s) + P.glowFocus * focusN * (quiet ? 0 : 1) + P.glowTrack * trackN * (quiet ? 0 : 1) + (s.pell ? P.glowPell : 0)) * h) { s.pending = { at: s.t + P.telegraph }; report(s, 'Dace', 'Hunter radar swept across our bearing. Something is coming. Go quiet if you want it to pass.', 'danger', true); pingBy(s); }
    if (s.pending && s.t >= s.pending.at) { s.pending = null; if (s.t < s.quietUntil && s.r() < P.quietCancel) report(s, 'Dace', 'They swept past us. Quiet paid off.', 'good'); else { bump(s); if (s.over) return; } }
    const friction = 1 - P.pellFriction * Math.max(0, Math.floor(s.integration / 25) - 1), rate = POSTURE[s.posture].rate * (s.entry === 'dark' && s.t < P.darkWarm ? 0.8 : 1) * (moving(s) || s.posture === 'evade' ? P.moveRate : 1) * (moving(s) ? SPEED[s.speed].rate : 1) * friction * (s.hull < 60 ? 0.85 : 1);
    if (!quiet) for (const a of s.an) if (a.state === 'locked' && (a.solve || 0) < 1) { a.solve = Math.min(1, (a.solve || 0) + h / solveInfo(s, a).T); if (a.solve >= 1) { a.track = Math.max(a.track, 3); scan(s, a); report(s, 'Abara', `Firing solution on contact ${a.id + 1}. The track is tight. Ready when you are.`, 'good'); } }
    for (const w of s.analysts) {
      if (s.t < w.next) continue;
      if (quiet) { w.next = s.quietUntil; continue; }
      if (w.task != null && !['open', 'locked'].includes(s.an[w.task].state)) w.task = null;
      let tgt = w.task != null ? s.an[w.task] : s.an.filter(a => a.state === 'open' && a.idStatus !== 'plan').sort((a, b) => ((a.read[w.ch]?.t ?? -9) - (b.read[w.ch]?.t ?? -9)))[0];
      if (tgt) doRead(s, w, tgt, w.task != null);
      w.next = s.t + (w.task != null ? P.focusPeriod : P.autoPeriod) / rate;
    }
    if (s.pell && !quiet) {   // Pell is always honest: he does not want to be destroyed by bad data. The cost is heat and integration.
      s.integration = Math.min(100, s.integration + P.integrationPerMin * h);
      for (const [lvl, text] of THRESH) if (s.integration >= lvl && !s.thresholdsHit[lvl]) { s.thresholdsHit[lvl] = true; report(s, 'Pell', text, 'integration', true); }
      if (s.t >= s.pellNext) {
        const open = s.an.filter(a => a.state === 'open' && a.idStatus !== 'plan'); if (open.length) { const a = open.sort((x, y) => (x.lastRead - y.lastRead))[0], ch = ['thermal', 'reactor', 'occlusion'][Math.floor(s.r() * 3)], sg = signal(s, a, ch); if (sg !== null) addRead(s, a, ch, sg + gauss(s.r) * 0.4, 1); }
        s.pellNext = s.t + 0.3 / rate;
      }
      if (s.pellAct && s.integration >= 75 && s.t >= (s.pellActNext || 0)) { s.pellActNext = s.t + 0.5; for (const a of s.an.filter(a => a.state === 'open' && a.idStatus !== 'plan' && a.idStatus !== 'confirmed')) { const ad = advice(s, a); if (ad.call === 'ship') { lockContact(s, a.id); report(s, 'Pell', `I took the liberty on contact ${a.id + 1}.`, 'integration'); break; } if (ad.call === 'junk') { dismissContact(s, a.id); report(s, 'Pell', `Contact ${a.id + 1} is junk. I took the liberty.`, 'integration'); break; } } }
    }
    if (s.chase && s.t >= s.chase.until) { const a = s.an[s.chase.id]; s.chase = null; a.state = 'out'; report(s, 'Abara', `Contact ${a.id + 1} was ${a.kind === 'lure' ? 'a lure' : 'static'}. Four minutes of fuel and nerve, gone.`, 'bad'); if (a.kind === 'lure' && s.r() < P.bait) { bump(s, 'It was bait. The hunter moved up.'); if (s.over) return; } }
    for (const v of s.volleys.filter(v => s.t >= v.at)) {
      s.volleys.splice(s.volleys.indexOf(v), 1); const a = s.an[v.id], tp = truePos(a, v.at), fx = volleyFx(v.aim, v.cone, tp.x, tp.y, a, s.r, v.dir, s.player, v.off);
      if (Math.hypot(v.aim.x - s.player.x, v.aim.y - s.player.y) < P.nearRange) { s.blastUntil = Math.max(s.blastUntil, s.t + P.blastDur); s.blastV = P.blastGlow; }
      if (fx.self) { hullHit(s, fx.self); if (s.over) return; }
      if (a.state === 'disabled') { report(s, 'Abara', `Contact ${a.id + 1} was already dead when the volley arrived. Wasted missiles.`, 'bad'); continue; }
      if (fx.hit) { if (cripple(s, a)) return; }
      else if (s.r() < 0.6) { bump(s, 'The volley missed, and the launch lit us up. The hunter noticed.'); if (s.over) return; }
      else report(s, 'Abara', 'The volley missed. Quiet launch; the hunter did not notice.', 'bad');
    }
    const live = s.an.some(a => ['open', 'locked', 'chasing'].includes(a.state) && a.idStatus !== 'plan');
    if (!live && s.disabled < P.nreal && !s.rescanAt) { s.rescanAt = s.t + P.rescan; report(s, 'Abara', 'Everything is ruled out and the ships are still out there. Rescanning takes five minutes.', 'bad'); }
    if (s.rescanAt && s.t >= s.rescanAt) { s.rescanAt = null; s.an.forEach(a => { if (a.state === 'out') { a.state = 'open'; a.read = {}; } }); report(s, 'Abara', 'Rescan complete. Everything is open again.', 'info'); }
  }
  // What the player's own readings say. Uses only a.read plus rough range (the smear's distance), never the hidden kind.
  const KMEAN = { thermal: { real: 1.0, lure: 0.78, ghost: 0.3 }, reactor: { real: 1.0, lure: 0.68, ghost: 0.15 }, occlusion: { real: 0.9, lure: 0.05, ghost: 0.05 } };
  function classify(s, a) {
    const pl = s.player, p = truePos(a, s.t), d = Math.hypot(p.x - pl.x, p.y - pl.y), rf = Math.min(1, 1.3 / (1 + (d / 30) ** 2)), kinds = ['real', 'lure', 'ghost'];
    const fr = s.friendly ? 1 : 0, lp = { real: Math.log(P.nreal + fr), lure: Math.log(P.nlure), ghost: Math.log(P.N - P.nreal - P.nlure - fr) }, st = {}; let n = 0;
    for (const ch of ['thermal', 'reactor', 'occlusion']) {
      const q = a.read[ch]; if (!q) { st[ch] = 'none'; continue; }
      if (q.blind) { st[ch] = 'blind'; n++; continue; }
      if (!(q.den > 0)) { st[ch] = 'none'; continue; }
      const v = q.num / q.den, sd = 0.45 / Math.sqrt(Math.max(q.den, 0.5)) + 0.06; if (q.den >= 1) { st[ch] = 'set'; n++; } else st[ch] = 'thin';
      for (const k of kinds) { const mu = KMEAN[ch][k] * (ch === 'reactor' ? rf : 1), z = (v - mu) / sd; lp[k] += -0.5 * z * z - Math.log(sd); }
    }
    const m = Math.max(...kinds.map(k => lp[k])), w = kinds.map(k => Math.exp(lp[k] - m)), sum = w.reduce((x, y) => x + y, 0), post = {}; kinds.forEach((k, i) => post[k] = w[i] / sum);
    const best = kinds.reduce((b, k) => post[k] > post[b] ? k : b, 'real');
    return { n, st, post, best, p: post[best] };
  }
  function exposure(s) {   // what is making us easy to find, per game minute (display only; sub() uses the same terms)
    const sq = s.t > P.squeezeAfter ? 1 + P.squeezeRamp * (s.t - P.squeezeAfter) : 1, quiet = s.t < s.quietUntil; let m = POSTURE[s.posture].haz * sq * (s.entry === 'dark' && s.t < P.darkWindow ? P.darkHaz : 1);
    if (s.chase) m *= P.chasemult; if (s.rescanAt) m *= 0.5; if (quiet) m *= P.quietHaz;
    const fN = s.analysts.filter(x => x.task != null).length, tN = s.analysts.filter(x => x.task != null && s.an[x.task].state === 'locked').length, z = quiet ? 0 : 1;
    const parts = [{ k: 'drift', label: 'Hull heat and drive, ' + POSTURE[s.posture].label.toLowerCase() + (sq > 1.05 ? ', hunter closing in' : '') + (s.chase ? ', chasing a false lock' : ''), v: P.base * s.tempo * m }, { k: 'focus', label: 'Active sensor work (' + fN + ' on a contact)', v: P.glowFocus * fN * z }, { k: 'track', label: 'Tracking a locked ship (' + tN + ')', v: P.glowTrack * tN * z }, { k: 'pell', label: 'Pell running the ship hot', v: s.pell && !quiet ? P.glowPell : 0 }, { k: 'beam', label: 'Tight-beam challenge leaking', v: s.t < s.beamUntil ? P.beamGlow : 0 }, { k: 'blast', label: 'Weapons fire and detonations close by', v: s.t < s.blastUntil ? s.blastV : 0 }, { k: 'engine', label: (s.entry === 'fast' && s.t < P.wakeDur ? 'Hot arrival wake and engines' : 'Engine heat, ' + SPEED[s.speed].label.toLowerCase()), v: s.t < s.quietUntil ? 0 : engineHeat(s) }, { k: 'ping', label: 'Active ping, loud', v: s.t < s.pingUntil ? P.pingGlow : 0 }, { k: 'near', label: 'A warship close enough to see our hull', v: nearHeat(s) }].filter(x => x.v > 0.0005);
    return { total: parts.reduce((q, x) => q + x.v, 0), parts, quiet };
  }
  function tick(s, dt) { let left = dt; while (left > 1e-9 && !s.over) { const h = Math.min(P.sub, left); sub(s, h); left -= h; } }
  function assign(s, analystId, contact) { const w = s.analysts.find(x => x.id === analystId); if (!w || s.over || (contact != null && s.an[contact].idStatus === 'plan')) return; w.task = (contact == null || w.task === contact) ? null : contact; w.next = Math.min(w.next, s.t + 0.05); }
  function resolution(a) { let sum = 0; for (const ch of ['thermal', 'reactor', 'occlusion']) { const q = a.read[ch]; sum += q ? (q.blind ? 0.6 : Math.min(1, q.den / P.solveDen)) : 0; } return sum / 3; }
  function solveInfo(s, a) {
    const res = resolution(a), age = a.anchor ? s.t - a.anchor.t : 3, why = [];
    let T = P.solveMin + (P.solveMax - P.solveMin) * (1 - res) ** 1.3;
    if (res < 0.6) why.push('readings still thin');
    if (age > 2) { T *= 1.25; why.push('stale track'); } else if (age < 0.5) T *= 0.9;
    const tp = truePos(a, s.t); let cl = 0; for (const b of s.an) if (b !== a && b.state !== 'out' && b.state !== 'disabled') { const q = truePos(b, s.t); if (Math.hypot(q.x - tp.x, q.y - tp.y) < P.clutterR) cl++; }
    if (cl) { T *= 1 + Math.min(0.3, 0.1 * cl); why.push('clutter nearby'); }
    if (s.hull < 60) { T *= 1.15; why.push('hull damage'); }
    if (s.pellAct && s.integration >= 50) T *= 0.85;
    const dark = s.t < s.quietUntil, prog = a.solve || 0;
    return { prog, T, remain: dark ? Infinity : (1 - prog) * T, res, why, paused: dark, ready: prog >= 1 };
  }
  function lockContact(s, id) {
    const a = s.an[id]; if (s.over || a.state !== 'open') return;
    if (a.kind === 'friend' && (a.idStatus === 'plan' || a.idStatus === 'confirmed')) { report(s, 'Abara', `Contact ${id + 1} is our ally. Weapons safe.`, 'info'); return; }
    if (a.kind === 'real' || a.kind === 'friend') { a.state = 'locked'; a.track = 0; a.solve = 0; scan(s, a); report(s, 'Abara', `Contact ${id + 1} locked. Working a firing solution.`, 'good'); }
    else { a.state = 'chasing'; s.wrong++; s.chase = { id, until: s.t + P.chase }; report(s, 'Abara', `Contact ${id + 1} ruled in; we are chasing it. Hope it is a ship.`, 'info'); for (const w of s.analysts) if (w.task === id) w.task = null; }
  }
  function dismissContact(s, id) { const a = s.an[id]; if (s.over || a.state !== 'open' || a.idStatus === 'plan') return; a.state = 'out'; if (a.kind === 'real') s.wrong++; for (const w of s.analysts) if (w.task === id) w.task = null; report(s, 'Abara', `Contact ${id + 1} ruled out.`, 'info'); }
  function fire(s, id, L, cone) {
    const a = s.an[id]; if (s.over || a.state !== 'locked' || (a.solve || 0) < 1 || (a.kind === 'friend' && (a.idStatus === 'plan' || a.idStatus === 'confirmed'))) return false;
    const tb = s.tubes.findIndex(x => s.t >= x); if (tb < 0) return false; s.tubes[tb] = s.t + P.reload;
    const f = fanInfo(s, a, L); s.shots++; s.volleys.push({ id, at: s.t + P.engage + f.tf, t0: s.t, from: { x: s.player.x, y: s.player.y }, off: [0, 1, 2, 3].map(() => [gauss(s.r), gauss(s.r)]), aim: f.aim, dir: f.dir, cone }); report(s, 'Abara', `Volley away on contact ${id + 1}. Impact in ${(P.engage + f.tf).toFixed(1)} minutes.`, 'info'); return true;
  }
  function closeInfo(s, a) { const tau = (s.t - a.anchor.t) + 0.1, est = estAt(a, tau); return { est, d: Math.hypot(est.x - s.player.x, est.y - s.player.y) }; }
  function fireClose(s, id) {   // coilgun: instant, ignores scatter grids, short range, loud
    const a = s.an[id]; if (s.over || !a || a.state !== 'locked' || !a.anchor || s.t < s.cwCd) return false;
    const ci = closeInfo(s, a); if (ci.d > P.closeRange) return false;
    s.cwCd = s.t + P.closeCd; s.blastUntil = Math.max(s.blastUntil, s.t + P.closeDur); s.blastV = P.closeGlow; s.shots++;
    const tp = truePos(a, s.t + 0.1), hit = Math.hypot(ci.est.x - tp.x, ci.est.y - tp.y) < P.closeKill && s.r() < P.closeAcc;
    if (hit) { report(s, 'Abara', `Coilgun slug on contact ${id + 1}, point blank.`, 'info'); if (cripple(s, a)) return true; } else report(s, 'Abara', `Coilgun slug on contact ${id + 1} went wide.`, 'bad');
    if (!s.over && s.r() < P.closeBump) bump(s, 'The coilgun flash lit us up. The hunter noticed.');
    return true;
  }
  function challenge(s, id) {   // directional low-power laser with an encrypted challenge. A friend answers; a hostile hears it
    const a = s.an[id]; if (s.over || !s.friendly || !a || !['open', 'locked'].includes(a.state) || s.t < s.beamCd || s.t < s.quietUntil || ['confirmed', 'nofriend', 'plan', 'hostile'].includes(a.idStatus)) return false;
    s.beamCd = s.t + P.beamCd; s.beamUntil = s.t + P.beamDur;
    if (a.kind === 'friend') {
      a.idStatus = 'confirmed'; report(s, 'Abara', `Countersign received from contact ${id + 1}. It is ours.`, 'good', true);
      const tg = s.an.filter(x => x.kind === 'real' && ['open', 'locked'].includes(x.state)).sort((x, y) => ['thermal', 'reactor', 'occlusion'].reduce((m, c) => m + (x.read[c]?.den || 0), 0) - ['thermal', 'reactor', 'occlusion'].reduce((m, c) => m + (y.read[c]?.den || 0), 0))[0];
      if (tg) { for (let k = 0; k < P.shareReads; k++) for (const c of ['thermal', 'reactor', 'occlusion']) { const sg = signal(s, tg, c); if (sg !== null) addRead(s, tg, c, sg + gauss(s.r) * 0.22, 3); } report(s, 'Abara', `Our ally sends its picture over the beam. Contact ${tg.id + 1} just got a lot clearer.`, 'good'); }
    } else {
      a.idStatus = 'nofriend'; report(s, 'Abara', `No countersign from contact ${id + 1}. It is not ours.`, 'info');
      if (a.kind === 'real' && s.r() < P.beamBump) { report(s, 'Abara', `Contact ${id + 1} read the beam. It knows where we are.`, 'danger', true); bump(s); }
    }
    return true;
  }
  function goQuiet(s) { if (s.over || s.t < s.quietCd) return false; s.quietUntil = s.t + P.quietDur; s.quietCd = s.t + P.quietCd; report(s, 'Abara', 'Going quiet. Sensors dark, nobody touches anything for three minutes.', 'info'); return true; }
  function retreat(s) { if (s.over) return; s.over = s.disabled ? 'breach' : 'breach0'; report(s, 'Abara', 'Breaking contact. Breach drive spinning up.', 'bad'); }
  function setPellAct(s, on) { s.pellAct = !!on && s.integration >= 75; }
  return { uncertainty, missilePos, setRoute, relBearing, solveInfo, resolution, P, POSTURE, ANALYSTS, THRESH, goQuiet, advice, setPellAct, newHunt, tick, assign, lockContact, dismissContact, fire, retreat, fanInfo, hitProb, estAt, spreadAt, START, setOrder, setSpeed, pingContact, displayPos, SPEED, truePos, planPos, selfRisk, fireClose, closeInfo, volleyFx, cat, exposure, classify, stealthState, challenge };
})();
if (typeof module !== 'undefined') module.exports = HuntRT;
