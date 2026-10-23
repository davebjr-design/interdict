// Interdict hunt engine v4: REAL TIME with analyst reports. Time unit = game minutes (UI maps real seconds to game minutes).
// Three analysts (thermal / reactor / occlusion) read contacts on their own schedule; the player directs attention, interprets, locks, tracks, fires.
const HuntRT = (() => {
  const P = { enemySink: 3, sinkK: 1.4, ventFull: 5, ventMin: 0.08, forcedStop: 0.25, visDiv: 0.2, visFloor: 0.06, visCap: 0.85, ventSig: 1, knowK: 0.4, knowDecay: 0.05, knowLose: 0.15, sensR: 90, floorM: 0.12, blockM: 0.12, aimSigMax: 16, aimSigMin: 2.4, standoff: 30, pingAlert: 0.3, launchAlert: 0.15, coilAlert: 0.2, solveStale: 3, foeCd0: 2, foeCd: 3.5, foeCone: 6, foeKill: 4, foeDmg: 12, foeSpeed: 12, manPatrol: [6, 9], manAware: [3, 5], edge: 9, uncDen: 20, uncMin: 1.2, uncMax: 10, solveMin: 0.8, solveMax: 3.0, solveDen: 8, clutterR: 12, N: 8, nreal: 2, nlure: 3, arena: 80, base: 0.02, glowFocus: 0.010, glowTrack: 0.03, stages: 3, chase: 5, chasemult: 2.5, bait: 0.75, rescan: 5, engage: 1, missileSpeed: 16, alongStretch: 1.5, squeezeAfter: 1000000000.0, squeezeRamp: 0.12, autoPeriod: 0.8, focusPeriod: 0.45, killR: 7, glowPell: 0.012, integrationPerMin: 0.8, sub: 0.05, secPerMin: 16, halfLife: 3, telegraph: 0.8, quietDur: 2.5, quietCd: 10, quietHaz: 0.2, quietCancel: 0.6, suggestShort: 0.72, tubes: 3, reload: 3, darkWindow: 6, darkHaz: 0.5, darkWarm: 4, wakeDur: 3, wakeGlow: 0.10, wpReach: 1.2, moveRate: 1.1, shipSpeed: 1.0, holdOff: 3, pingCd: 4, pingDur: 1.5, pingGlow: 0.14, pingBump: 0.45, pingBumpOther: 0.15, selfRadius: 4, selfDmg: 25, closeRange: 12, closeCd: 2, closeKill: 5, closeAcc: 0.85, closeGlow: 0.12, closeDur: 2, blastGlow: 0.08, blastDur: 1.5, nearGlow: 0.025, nearRange: 16, closeBump: 0.5, beamGlow: 0.08, beamDur: 1, beamCd: 2, beamBump: 0.35, driftMin: 6, driftMax: 12, shareReads: 2, pellFriction: 0.08 };
  const POSTURE = { still: { haz: 0.8, rate: 1.0, label: 'Stay still', tip: 'Hunter finds you at 0.8x speed. Analysts work at normal speed.' }, evade: { haz: 0.95, rate: 1.0, label: 'Evasive', tip: 'Weaving gives the analysts new angles to triangulate from, so they read about 10% faster, but the drive makes you about 20% louder than holding still.' }, orbit: { haz: 1.0, rate: 1.0, label: 'Circle', tip: 'Circle the contact at the current range. Angles change constantly, so the analysts triangulate faster, the drive makes noise.' }, route: { haz: 1.0, rate: 1.0, label: 'Flight plan', tip: 'The navigator is flying the plan you drew.' }, close: { haz: 1.0, rate: 1.0, label: 'Close on a contact', tip: 'Moving toward a contact: engine heat depends on your speed; the change of angle helps the analysts, and they read stronger as range drops.' }, separate: { haz: 1.0, rate: 1.0, label: 'Open distance', tip: 'Moving away from a contact: engine heat depends on your speed; the change of angle helps the analysts, but signals weaken with range.' } };
  const START = { dark: 6, standard: 10, fast: 22 };
  const SPEED = { creep: { label: 'Creep', v: 0.8, heat: 0.0, rate: 1.0, tip: 'Cold drive, 0.8 km per minute. Almost no engine heat.' }, cruise: { label: 'Cruise', v: 2.0, heat: 0.03, rate: 1.0, tip: '2 km per minute. Some engine heat.' }, burn: { label: 'Burn', v: 4.0, heat: 0.11, rate: 0.8, tip: '4 km per minute. Lots of engine heat and noisy sensors. The hunter can see a burn from a long way.' } };
  const ANALYSTS = [{ id: 'dace', name: 'Dace', ch: 'thermal', role: 'Heat' }, { id: 'castellan', name: 'Castellan', ch: 'reactor', role: 'Reactor' }, { id: 'quill', name: 'Quill', ch: 'occlusion', role: 'Eclipse' }];
  function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function gauss(r) { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const LOADOUTS = [   // the same fields rule our ship and theirs: sensor = how well it reads others, sig = how loud it is, crew = reaction and discipline, sink = heat capacity, spd = drive, dmg = warhead
    { id: 'cutter', name: 'Salvage cutter', sensor: 1.0, sig: 1.0, crew: 1.0, sink: 1.0, spd: 1.0, dmg: 1.0 },
    { id: 'picket', name: 'Picket', sensor: 1.0, sig: 1.0, crew: 1.0, sink: 1.0, spd: 1.0, dmg: 1.0, blurb: 'Standard patrol ship.' },
    { id: 'hound', name: 'Hound', sensor: 1.3, sig: 1.2, crew: 1.0, sink: 0.9, spd: 1.15, dmg: 1.0, blurb: 'Sharp sensors, loud drive.' },
    { id: 'shade', name: 'Shade', sensor: 0.9, sig: 0.72, crew: 1.0, sink: 0.9, spd: 0.9, dmg: 0.8, blurb: 'Stealthy, lightly armed.' },
    { id: 'veteran', name: 'Veteran', sensor: 1.0, sig: 1.0, crew: 1.25, sink: 1.1, spd: 1.0, dmg: 1.1, blurb: 'Fast hands, vents only when it is safe.' },
    { id: 'green', name: 'Green crew', sensor: 0.85, sig: 1.0, crew: 0.75, sink: 0.9, spd: 1.0, dmg: 1.0, blurb: 'Slow to react, careless about heat.' },
    { id: 'brute', name: 'Brute', sensor: 0.9, sig: 1.25, crew: 0.95, sink: 1.4, spd: 0.85, dmg: 1.4, blurb: 'Big heat sinks, loud, hits hard.' }];
  function makeBodies(r, start) {   // two bright backdrops (eclipse screens) and one or two dark planets (cover)
    const A = P.arena, out = [], far = (x, y, m) => out.every(b => Math.hypot(b.x - x, b.y - y) > m) && Math.hypot(start.x - x, start.y - y) > 26;
    const add = (kind, rad, halo, tries = 60) => { for (let i = 0; i < tries; i++) { const x = 16 + r() * (A - 32), y = 16 + r() * (A - 32); if (far(x, y, 30)) { out.push({ kind, x, y, r: rad, halo }); return; } } };
    add('star', 5, 28); if (r() < 0.8) add('star', 4, 24); add('planet', 7 + r() * 4, 0); if (r() < 0.6) add('planet', 6 + r() * 3, 0);
    return out;
  }
  function newHunt(seed, opts = {}) {
    const r = rng(seed), kinds = [];
    for (let i = 0; i < P.nreal; i++) kinds.push('real'); for (let i = 0; i < P.nlure; i++) kinds.push('lure'); if (opts.friendly) kinds.push('friend'); while (kinds.length < P.N) kinds.push('ghost');
    for (let i = kinds.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [kinds[i], kinds[j]] = [kinds[j], kinds[i]]; }
    const grids = ['none', 'light', 'heavy'], tempo = opts.tempo ?? (0.7 + 0.8 * r());
    const entry = opts.entry || 'standard', center = opts.layout === 'center', start = center ? { x: P.arena / 2, y: P.arena / 2 } : { x: START[entry] ?? 10, y: P.arena / 2 }, bodies = makeBodies(r, start), M = P.arena / 40;
    const an = kinds.map((k, i) => {
      let x0, y0; do { if (center) { x0 = 12 + r() * 56; y0 = 12 + r() * 56; } else { x0 = 44 + r() * 30; y0 = 8 + r() * 64; } } while (bodies.some(b => b.kind === 'planet' && Math.hypot(b.x - x0, b.y - y0) < b.r + 6) || (center && Math.hypot(x0 - 40, y0 - 40) < 18));
      let hd = Math.atan2(start.y - y0, start.x - x0) + (r() - 0.5) * 2.0, v = (k === 'ghost' ? 0.3 + 0.4 * r() : 1.0 + 1.2 * r()) * 2;
      let drift = null, idStatus = opts.friendly ? 'unknown' : null;
      if (k === 'friend') { const sg = r() < 0.5 ? -1 : 1; if (center) { y0 = 40 + sg * (16 + r() * 20); x0 = 2; } else { y0 = start.y + sg * (6 + r() * 6); x0 = start.x + 3; } v = 2 * (1.0 + 0.4 * r()); hd = 0; idStatus = opts.friendly === 'unlisted' ? 'unknown' : 'plan'; }
      const jit = { x: Math.sin(i * 7.1) * 1.5, y: Math.cos(i * 3.7) * 1.5 };
      return { jit, drift, idStatus, id: i, kind: k, x0, y0, hd, v, vx: v * Math.cos(hd), vy: v * Math.sin(hd), state: 'open', track: 0, grid: grids[Math.floor(r() * 3)], flutter: null, anchor: null, read: {}, lastRead: 0, know: 0, stage: 0, vent: null, load: k === 'real' ? LOADOUTS[1 + Math.floor(r() * 6)] : LOADOUTS[1], ventOk: 5 + 4 * r() };
    });
    for (const a of an) if (a.kind === 'real') { a.sink = { h: 0.15 + 0.6 * r() }; a.vx *= a.load.spd; a.vy *= a.load.spd; a.v *= a.load.spd; }
    return { bodies, me: LOADOUTS[0], sink: { h: opts.sink0 ?? 0.05 }, vent: { on: false, forced: false, t0: 0, n: 0, total: 0 }, sinkWarn: 0, entry, route: (opts.route || []).map(p => ({ x: p.x, y: p.y })), routeI: 0, speed: opts.speed || 'cruise', orderId: null, pingCd: 0, pingUntil: 0, pingFx: [], hull: 100, blastUntil: 0, blastV: 0, cwCd: 0, hullWarned: false, friendly: !!opts.friendly, beamCd: 0, beamUntil: 0, fratricide: 0, r, seed, t: 0, stage: 0, an, tempo, posture: (opts.route && opts.route.length) ? 'route' : 'still', pell: false, integration: opts.integration ?? 0, thresholdsHit: {}, pellAct: false, analysts: ANALYSTS.map((a, i) => ({ ...a, task: null, next: 0.15 + 0.12 * i })), pellNext: 0.5, chase: null, pending: null, quietUntil: 0, quietCd: 0, volleys: [], inc: [], vel: { vx: 0, vy: 0 }, tubes: Array(P.tubes).fill(0), rescanAt: null, log: [], beats: 0, over: null, disabled: 0, player: { x: start.x, y: start.y }, shots: 0, wrong: 0 };
  }
  function report(s, who, text, kind = 'info', urgent = false) { s.beats++; s.log.push({ t: s.t, who, text, kind, urgent }); }
  const fold = v => { const lo = 3, hi = P.arena - 1.5, w = hi - lo; let u = (v - lo) % (2 * w); if (u < 0) u += 2 * w; return lo + (u > w ? 2 * w - u : u); };
  function truePos(a, t) { const q = truePos0(a, t); return { x: fold(q.x), y: fold(q.y) }; }
  function truePos0(a, t) { let L = null; if (a.legs) for (const g of a.legs) { if (g.t <= t) L = g; else break; } if (L) return { x: L.x + L.vx * (t - L.t), y: L.y + L.vy * (t - L.t) }; return { x: a.x0 + a.vx * t, y: a.y0 + a.vy * t }; }
  function legVel(a, t) { let L = null; if (a.legs) for (const g of a.legs) { if (g.t <= t) L = g; else break; } return L ? { vx: L.vx, vy: L.vy } : { vx: a.vx, vy: a.vy }; }
  function velAt(a, t) { const p1 = truePos(a, t - 0.05), p2 = truePos(a, t + 0.05); return { vx: (p2.x - p1.x) / 0.1, vy: (p2.y - p1.y) / 0.1 }; }
  function maneuver(s, a, dh, steer) {
    const p = truePos0(a, s.t), v = legVel(a, s.t), sp = Math.hypot(v.vx, v.vy), h0 = steer != null ? steer : Math.atan2(v.vy, v.vx) + dh;
    (a.legs || (a.legs = [])).push({ t: s.t, x: p.x, y: p.y, vx: Math.cos(h0) * sp, vy: Math.sin(h0) * sp }); a.lastMan = s.t;
    if (a.state === 'locked' && !steer) report(s, 'Dace', `Contact ${a.id + 1} has changed course. Our track is off until we rescan it.`, 'bad');
  }
  function makeAware(s, a, text) {
    if (a.kind !== 'real' || a.aware || a.state === 'disabled') return; a.aware = true; a.know = Math.max(a.know || 0, 0.4); a.nextFire = s.t + (P.foeCd0 + s.r() * 1.5) / (a.load ? a.load.crew : 1); a.nextMan = Math.min(a.nextMan ?? 1e9, s.t + 1 + s.r() * 2);
    report(s, 'Dace', text || `Contact ${a.id + 1} has noticed us. Expect it to maneuver and shoot.`, 'danger', true);
  }
  const aimSigma = a => { const kq = clamp(((a.know || 0) - 0.33) / 0.67, 0, 1); return (P.aimSigMax + (P.aimSigMin - P.aimSigMax) * kq) / Math.sqrt(a.load ? a.load.crew : 1); };
  function foes(s) {   // contacts move, maneuver, and the aware warships shoot back
    const rnd = r => r[0] + s.r() * (r[1] - r[0]);
    for (const a of s.an) {
      if (a.kind === 'friend' || a.state === 'disabled') continue;
      const p = truePos0(a, s.t), v = legVel(a, s.t), e = P.edge, A = P.arena;
      if ((p.x < e && v.vx < 0) || (p.x > A - e && v.vx > 0) || (p.y < e && v.vy < 0) || (p.y > A - e && v.vy > 0)) { maneuver(s, a, 0, Math.atan2(A / 2 - p.y, A / 2 - p.x) + (s.r() - 0.5) * 0.9); continue; }
      { const pb = s.bodies.find(b => b.kind === 'planet' && Math.hypot(b.x - p.x, b.y - p.y) < b.r + 5 && ((b.x - p.x) * v.vx + (b.y - p.y) * v.vy) > 0); if (pb) { maneuver(s, a, 0, Math.atan2(p.y - pb.y, p.x - pb.x) + (s.r() - 0.5) * 0.8); continue; } }
      if (a.kind !== 'ghost') { const cr = a.load ? a.load.crew : 1; if (a.nextMan == null) a.nextMan = s.t + rnd(P.manPatrol); if (s.t >= a.nextMan) {
        if (a.aware && a.kind === 'real' && s.r() < 0.65) { const sg = aimSigma(a), bx = s.player.x + gauss(s.r) * sg, by = s.player.y + gauss(s.r) * sg, dd = Math.hypot(bx - p.x, by - p.y), hd = Math.atan2(by - p.y, bx - p.x); maneuver(s, a, 0, dd > P.standoff ? hd + (s.r() - 0.5) * 0.4 : hd + (s.r() < 0.5 ? 1 : -1) * (1.2 + s.r() * 0.5)); }
        else { const mag = (a.aware ? 0.6 + s.r() * 0.6 : 0.3 + s.r() * 0.4) * (s.r() < 0.5 ? -1 : 1); maneuver(s, a, mag); } a.nextMan = s.t + rnd(a.aware ? P.manAware : P.manPatrol) / cr; } }
      if (a.aware && a.kind === 'real' && s.t >= a.nextFire) {
        if (s.t < s.quietUntil) { a.nextFire = s.quietUntil + 0.5; continue; }
        const f = truePos(a, s.t), pl = s.player, vel = s.vel || { vx: 0, vy: 0 }; let tf = Math.hypot(pl.x - f.x, pl.y - f.y) / P.foeSpeed; const sg = aimSigma(a), aim = { x: pl.x + vel.vx * tf * 0.8 + gauss(s.r) * sg, y: pl.y + vel.vy * tf * 0.8 + gauss(s.r) * sg }; tf = Math.hypot(aim.x - f.x, aim.y - f.y) / P.foeSpeed;
        s.inc.push({ dmg: a.load.dmg, id: a.id, foe: true, t0: s.t, at: s.t + tf, from: { x: f.x, y: f.y }, aim, dir: Math.atan2(aim.y - f.y, aim.x - f.x), cone: P.foeCone * (1.4 - 0.7 * clamp(((a.know || 0) - 0.33) / 0.67, 0, 1)), off: [0, 1, 2, 3].map(() => [gauss(s.r), gauss(s.r)]) });
        a.nextFire = s.t + P.foeCd * (0.8 + 0.4 * s.r()) / a.load.crew; a.lastFire = s.t; report(s, 'Dace', `Contact ${a.id + 1} has fired on us. Impact in ${tf.toFixed(1)} minutes. Move, or go quiet.`, 'danger', true);
      }
    }
    for (const v of s.inc.filter(v => s.t >= v.at)) {
      s.inc.splice(s.inc.indexOf(v), 1); const cd = Math.cos(v.dir), sd = Math.sin(v.dir); let n = 0;
      for (const [ga, gc] of v.off) { const al = ga * v.cone * P.alongStretch, cr = gc * v.cone, ax = v.aim.x + al * cd - cr * sd, ay = v.aim.y + al * sd + cr * cd; if (Math.hypot(ax - s.player.x, ay - s.player.y) < P.foeKill) n++; }
      if (n) { s.hull = Math.max(0, s.hull - P.foeDmg * n * (v.dmg || 1)); report(s, 'Abara', `${n} incoming missile${n > 1 ? 's' : ''} from contact ${v.id + 1} detonated against us. Hull at ${Math.round(s.hull)} percent.`, 'danger', true); s.blastUntil = Math.max(s.blastUntil, s.t + P.blastDur); s.blastV = P.blastGlow;
        if (s.hull <= 0) { s.over = s.disabled ? 'breach' : 'breach0'; report(s, 'Abara', 'Hull is gone. Emergency breach, drive on whatever power is left.', 'danger', true); return; } else if (s.hull < 60 && !s.hullWarned) { s.hullWarned = true; report(s, 'Dace', 'Hull damage is fouling the sensor mounts. Everything reads slower now.', 'bad'); } }
      else report(s, 'Abara', `Contact ${v.id + 1}'s volley missed us.`, 'good');
    }
  }
  function alert(s, amt) {   // a noisy event: every live warship hears it, weighed by range
    for (const e of s.an) if (e.kind === 'real' && e.state !== 'disabled') { const p = truePos(e, s.t); e.know = Math.min(1.2, (e.know || 0) + amt * rangeF(Math.hypot(p.x - s.player.x, p.y - s.player.y)) * (blocked(s, p, s.player) ? P.blockM : 1)); }
  }
  function reopen(s, a) { if (a.state === 'out') { a.state = 'open'; } }
  function enemyAI(s, h) {
    const pl = s.player, vis = ourVis(s); let mx = 0;
    for (const a of s.an) {
      if (a.kind !== 'real' || a.state === 'disabled') continue;
      const L = a.load, p = truePos(a, s.t), d = Math.hypot(p.x - pl.x, p.y - pl.y), v = legVel(a, s.t), sp = Math.hypot(v.vx, v.vy);
      a.sink.h = clamp(a.sink.h + (P.sinkK * enemyAct(s, a, sp) / (L.sink * P.enemySink) - (a.vent ? 1 / P.ventFull : 0)) * h, 0, 1);
      if (a.vent) { if (a.sink.h <= 0.03) { a.vent = null; a.ventOk = s.t + 6; if (a.ventSeen) report(s, 'Dace', `Contact ${a.id + 1} folded its fins. The thermal blaze is fading.`, 'info'); } }
      else if (s.t >= a.ventOk) {
        const smart = L.crew >= 1.1, want = a.sink.h >= 0.999 || (a.sink.h >= (smart ? 0.6 : 0.82) && (!smart || (a.know || 0) < 0.3));
        if (want) { a.vent = { t0: s.t }; a.ventSeen = false; const m = infoMult(s, a, 'thermal'); if (m >= 0.3) { a.ventSeen = true; reopen(s, a); report(s, 'Dace', `Contact ${a.id + 1} has extended heat fins. Thermal blaze: it is fully visible while it dumps heat.`, 'good', true); } }
      }
      const g = P.knowK * vis * vis * L.sensor * rangeF(d) * (blocked(s, p, pl) ? P.blockM : 1);
      a.know = Math.min(1.2, (a.know || 0) + g * h);
      if (vis < 0.35) a.know = Math.max(0, a.know - P.knowDecay * (0.35 - vis) / 0.35 * h);
      const st = a.know >= 1 ? 3 : a.know >= 0.66 ? 2 : a.know >= 0.33 ? 1 : 0;
      if (st > a.stage) {
        if (st >= 1 && !a.aware) makeAware(s, a, `Contact ${a.id + 1} has a bearing on us. Expect it to hunt and shoot.`);
        if (st === 2) report(s, 'Dace', `Contact ${a.id + 1} is closing in. Its fix on us is getting tight.`, 'danger', true);
        if (st === 3) report(s, 'Dace', `Contact ${a.id + 1} has a firm solution on us. Expect accurate fire.`, 'danger', true);
      }
      a.stage = st; mx = Math.max(mx, st);
      if (a.aware && a.know < P.knowLose && s.t > (a.nextFire ?? 0) - 1) { a.aware = false; report(s, 'Dace', `Contact ${a.id + 1} seems to have lost us. It is back on patrol.`, 'good'); }
    }
    s.stage = mx;
  }
  function planPos(a, t) { return { x: a.x0 + a.vx * t, y: a.y0 + a.vy * t }; }
  // ---- detection: everyone always has a trace. What a ship shows depends on what it is doing; what we learn depends on that trace, our sensors, the range, and what is in the way.
  function backdrop(s, a) {   // is a bright star screen behind that contact, seen from here?
    const p = truePos(a, s.t), pl = s.player, dx = p.x - pl.x, dy = p.y - pl.y, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d;
    for (const b of s.bodies) if (b.kind === 'star') { const wx = b.x - pl.x, wy = b.y - pl.y, al = wx * ux + wy * uy, pe = Math.abs(wx * uy - wy * ux); if (al > d && pe < b.halo) return true; } return false;
  }
  function blocked(s, p1, p2) {   // does a planet sit on the line between two points?
    for (const b of s.bodies) if (b.kind === 'planet') { const dx = p2.x - p1.x, dy = p2.y - p1.y, L2 = dx * dx + dy * dy || 1, t = clamp(((b.x - p1.x) * dx + (b.y - p1.y) * dy) / L2, 0, 1); if (Math.hypot(p1.x + t * dx - b.x, p1.y + t * dy - b.y) < b.r) return true; } return false;
  }
  const rangeF = (d, R = P.sensR) => Math.min(1.2, (1 + (20 / R) ** 2) / (1 + (d / R) ** 2));
  const visOf = total => clamp(total / P.visDiv, P.visFloor, P.visCap);
  function ourVis(s) { return s.vent.on ? P.ventSig : visOf(exposure(s).total) * s.me.sig; }   // how visible we are, 0..1
  function enemyAct(s, a, sp) { return (0.016 + 0.03 * (sp / 3) ** 2 + (a.aware ? 0.02 : 0) + (s.t < (a.lastFire ?? -9) + 1.5 ? 0.1 : 0)) * (a.state === 'disabled' ? 0 : 1); }
  function enemyVis(s, a) {   // how visible that ship is to us, 0..1
    if (a.kind === 'lure') return 0.55; if (a.kind === 'ghost') return 0.2; if (a.vent) return P.ventSig; if (a.state === 'disabled') return 0.1;
    const v = legVel(a, s.t); return visOf(enemyAct(s, a, Math.hypot(v.vx, v.vy))) * (a.load ? a.load.sig : 1);
  }
  function infoMult(s, a, ch) {   // how fast one read on this contact teaches us anything
    const p = truePos(a, s.t), d = Math.hypot(p.x - s.player.x, p.y - s.player.y), v = enemyVis(s, a), hot = a.vent ? 1.6 : 1;
    const sig = ch === 'thermal' ? (0.25 + 0.9 * v) * hot : ch === 'reactor' ? 0.55 + 0.5 * v : 1, R = ch === 'thermal' ? P.sensR : ch === 'reactor' ? P.sensR * 0.67 : P.sensR * 1.3;
    return clamp(s.me.sensor * sig * rangeF(d, R) * (blocked(s, s.player, p) ? P.blockM : 1) * (s.hull < 60 ? 0.85 : 1), P.floorM, 2);
  }
  function signal(s, a, ch) {
    const rl = a.kind === 'real' || a.kind === 'friend', vv = rl ? enemyVis(s, a) : 0;
    if (ch === 'thermal') return rl ? 0.8 + 0.2 * vv + (a.vent ? 0.35 : 0) : a.kind === 'lure' ? 0.78 : 0.3;
    if (ch === 'reactor') return rl ? 1.0 : a.kind === 'lure' ? 0.68 : 0.15;
    if (!backdrop(s, a)) return null;           // occlusion needs a bright screen behind the bearing
    return rl ? 0.9 : 0.05;
  }
  function obsRead(s, a, ch, w, sd, boost = 0) {   // one observation: precision and weight both scale with the information rate
    const sg = signal(s, a, ch); if (sg === null) { const q = a.read[ch] || (a.read[ch] = { num: 0, den: 0, t: s.t, cat: null }); q.blind = true; q.t = s.t; return null; }
    const m = Math.max(infoMult(s, a, ch), boost); return { v: addRead(s, a, ch, sg + gauss(s.r) * sd / Math.sqrt(m), w * m), m };
  }
  const cat = v => v >= 0.65 ? 'strong' : v >= 0.3 ? 'faint' : 'none';
  function addRead(s, a, ch, obs, w) {
    const q = a.read[ch] || (a.read[ch] = { num: 0, den: 0, t: s.t, cat: null }), k = Math.exp(-(s.t - q.t) * Math.LN2 / P.halfLife);
    q.num = q.num * k + obs * w; q.den = q.den * k + w; q.t = s.t; q.blind = false; a.lastRead = s.t; return q.num / q.den;
  }
  const TEXT = { thermal: { strong: 'thermal bloom, strong', faint: 'faint thermal, could be nothing', none: 'nothing thermal' }, reactor: { strong: 'neutrino line, steady', faint: 'faint neutrino flutter', none: 'no reactor signature' }, occlusion: { strong: 'starlight blocked, a dark mass', none: 'starlight clear behind it' } };
  function doRead(s, who, a, focus) {
    const ch = who.ch, n = a.id + 1, o = obsRead(s, a, ch, focus ? 3 : 1, focus ? 0.22 : 0.45);
    if (o === null) { const q = a.read[ch]; if (!q.said) { q.said = true; report(s, who.name, `Contact ${n}: no bright screen behind that bearing. I cannot judge it by occlusion.`, 'info'); } return; }
    const q = a.read[ch], c = cat(o.v);
    if (ch === 'occlusion' && c === 'faint') return;
    if (q.cat !== c) { q.cat = c; const t = TEXT[ch][c === 'faint' && ch === 'occlusion' ? 'none' : c]; report(s, who.name, `Contact ${n}: ${t}.`, c === 'strong' ? 'good' : 'info'); }
    if (a.state === 'locked') { a.track += P.focusPeriod * Math.min(1, o.m); scan(s, a, o.m); }
  }
  function scan(s, a, m = 1) {
    const q = 1 / Math.sqrt(clamp(m, 0.35, 1.5)), hs = Math.max(0.05, 0.6 - 0.12 * a.track) * q, ss = Math.max(0.06, 0.45 - 0.09 * a.track) * q, p = truePos(a, s.t), vv = velAt(a, s.t);
    a.anchor = { x: p.x + gauss(s.r) * 0.8 * q, y: p.y + gauss(s.r) * 0.8 * q, t: s.t, hdg: Math.atan2(vv.vy, vv.vx) + gauss(s.r) * hs, spd: Math.hypot(vv.vx, vv.vy) * (1 + gauss(s.r) * ss), hs, ss };
  }
  function estAt(a, tau) { const q = a.anchor; return { x: q.x + Math.cos(q.hdg) * q.spd * tau, y: q.y + Math.sin(q.hdg) * q.spd * tau }; }
  function spreadAt(a, tau) { const q = a.anchor; return { along: Math.max(0.8, q.spd * tau * q.ss), cross: Math.max(0.8, q.spd * tau * q.hs) }; }
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
  function bump(s, text, amt = 0.15) { alert(s, amt); if (text) report(s, 'Pell', text, 'danger', true); }
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
    a.state = 'disabled'; a.vent = null; a.aware = false; for (const w of s.analysts) if (w.task === a.id) w.task = null;
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
  function setRoute(s, pts) { if (s.over) return false; s.route = pts.map(q => ({ x: clamp(q.x, 3, P.arena - 3), y: clamp(q.y, 3, P.arena - 3) })); s.routeI = 0; if (s.route.length) { s.posture = 'route'; s.orderId = null; s.orderUntil = null; report(s, 'Abara', `New flight plan, ${s.route.length} waypoint${s.route.length > 1 ? 's' : ''}.`, 'info'); } else { s.posture = 'still'; report(s, 'Abara', 'Flight plan cleared. Holding position.', 'info'); } return true; }
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
  function moveShip(s, h) { const ox = s.player.x, oy = s.player.y; moveShip0(s, h); for (const b of s.bodies) if (b.kind === 'planet') { const dx = s.player.x - b.x, dy = s.player.y - b.y, d = Math.hypot(dx, dy) || 1; if (d < b.r + 1.5) { s.player.x = b.x + dx / d * (b.r + 1.5); s.player.y = b.y + dy / d * (b.r + 1.5); } } const dx = s.player.x - ox, dy = s.player.y - oy; s.vel = { vx: dx / h, vy: dy / h }; if (dx * dx + dy * dy > 1e-8) s.hdg = Math.atan2(dy, dx); if (s.hdg == null) s.hdg = 0; }
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
    pl.x = clamp(pl.x, 3, P.arena - 3); pl.y = clamp(pl.y, 3, P.arena - 3);
  }
  function pingContact(s, id) {   // directional active ping: a crisp fix, and anything listening hears it
    const a = s.an[id]; if (s.over || !a || !['open', 'locked'].includes(a.state) || a.idStatus === 'plan' || s.t < s.pingCd || s.t < s.quietUntil) return false;
    s.pingCd = s.t + P.pingCd; s.pingUntil = s.t + P.pingDur; const dp = displayPos(s, a); s.pingFx.push({ x: dp.x, y: dp.y, t: s.t });
    if (a.state === 'locked') { a.track = Math.max(a.track, 1.2); scan(s, a); report(s, 'Dace', `Active ping on contact ${id + 1}. Fresh fix, the wedge has snapped tight.`, 'good', true); }
    else { for (let k = 0; k < 2; k++) for (const c of ['thermal', 'reactor', 'occlusion']) obsRead(s, a, c, 3, 0.2, 1); report(s, 'Dace', `Active ping on contact ${id + 1}. Every channel just sharpened.`, 'good', true); }
    if (a.kind === 'real') makeAware(s, a, `Contact ${id + 1} felt our ping. It has turned toward us.`);
    alert(s, P.pingAlert);
    return true;
  }
  function nearHeat(s) { const pl = s.player; let n = 0; for (const a of s.an) if (a.state === 'locked' && a.kind !== 'friend') { const p = truePos(a, s.t); if (Math.hypot(p.x - pl.x, p.y - pl.y) < P.nearRange) n++; } return n * P.nearGlow * (s.t < s.quietUntil ? 0 : 1); }
  function sub(s, h) {
    s.t += h; moveShip(s, h); foes(s); if (s.over) return;
    { const hs = stealthState(s); if (hs !== (s.heat || 'cold')) { const was = s.heat || 'cold'; s.heat = hs; if (hs === 'hot') report(s, 'Dace', 'We are running hot. Anything listening can hear us. Ease off the sensors or go quiet.', 'danger'); else if (was === 'hot') report(s, 'Dace', 'Heat is coming down. We are not shouting any more.', 'good'); } }
    enemyAI(s, h); sinkStep(s, h); if (s.over) return;
    const quiet = s.t < s.quietUntil;
    const friction = 1 - P.pellFriction * Math.max(0, Math.floor(s.integration / 25) - 1), rate = POSTURE[s.posture].rate * (s.entry === 'dark' && s.t < P.darkWarm ? 0.8 : 1) * (moving(s) || s.posture === 'evade' ? P.moveRate : 1) * (moving(s) ? SPEED[s.speed].rate : 1) * friction * (s.hull < 60 ? 0.85 : 1);
    for (const a of s.an) if (a.state === 'locked' && (a.solve || 0) >= 1 && a.anchor && s.t - a.anchor.t > P.solveStale) { a.solve = 0; a.stale = true; report(s, 'Abara', `The solution on contact ${a.id + 1} has gone stale. Refresh it when you want a new one; an analyst on the contact keeps the track fresh.`, 'bad'); }
    if (!quiet) for (const a of s.an) if (a.state === 'locked' && !a.stale && (a.solve || 0) < 1) { { const si = solveInfo(s, a); if (!si.paused) a.solve = Math.min(1, (a.solve || 0) + h / si.T); } if (a.solve >= 1) { a.track = Math.max(a.track, 3); scan(s, a, 1); report(s, 'Abara', `Firing solution on contact ${a.id + 1}. The track is tight. Ready when you are.`, 'good'); } }
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
        const open = s.an.filter(a => a.state === 'open' && a.idStatus !== 'plan'); if (open.length) { const a = open.sort((x, y) => (x.lastRead - y.lastRead))[0], ch = ['thermal', 'reactor', 'occlusion'][Math.floor(s.r() * 3)]; obsRead(s, a, ch, 1, 0.4); }
        s.pellNext = s.t + 0.3 / rate;
      }
      if (s.pellAct && s.integration >= 75 && s.t >= (s.pellActNext || 0)) { s.pellActNext = s.t + 0.5; for (const a of s.an.filter(a => a.state === 'open' && a.idStatus !== 'plan' && a.idStatus !== 'confirmed')) { const ad = advice(s, a); if (ad.call === 'ship') { lockContact(s, a.id); report(s, 'Pell', `I took the liberty on contact ${a.id + 1}.`, 'integration'); break; } if (ad.call === 'junk') { dismissContact(s, a.id); report(s, 'Pell', `Contact ${a.id + 1} is junk. I took the liberty.`, 'integration'); break; } } }
    }
    if (s.chase && s.t >= s.chase.until) { const a = s.an[s.chase.id]; s.chase = null; a.state = 'out'; report(s, 'Abara', `Contact ${a.id + 1} was ${a.kind === 'lure' ? 'a lure' : 'static'}. Four minutes of fuel and nerve, gone.`, 'bad'); if (a.kind === 'lure' && s.r() < P.bait) { alert(s, 0.1); report(s, 'Pell', 'It was bait. Something out there noticed us chasing it.', 'danger', true); } }
    for (const v of s.volleys.filter(v => s.t >= v.at)) {
      s.volleys.splice(s.volleys.indexOf(v), 1); const a = s.an[v.id], tp = truePos(a, v.at), fx = volleyFx(v.aim, v.cone, tp.x, tp.y, a, s.r, v.dir, s.player, v.off);
      if (Math.hypot(v.aim.x - s.player.x, v.aim.y - s.player.y) < P.nearRange) { s.blastUntil = Math.max(s.blastUntil, s.t + P.blastDur); s.blastV = P.blastGlow; }
      if (fx.self) { hullHit(s, fx.self); if (s.over) return; }
      for (const b of s.an) if (b.kind === 'real' && b.state !== 'disabled' && !b.aware && Math.hypot(truePos(b, v.at).x - v.aim.x, truePos(b, v.at).y - v.aim.y) < P.nearRange) makeAware(s, b, `Contact ${b.id + 1} felt that volley land close. It knows we are here.`);
      if (a.state === 'disabled') { report(s, 'Abara', `Contact ${a.id + 1} was already dead when the volley arrived. Wasted missiles.`, 'bad'); continue; }
      if (fx.hit) { if (cripple(s, a)) return; }
      else if (s.r() < 0.6) { alert(s, P.launchAlert); report(s, 'Abara', 'The volley missed, and the launch lit us up. Someone out there noticed.', 'bad'); }
      else report(s, 'Abara', 'The volley missed. Quiet launch; nobody noticed.', 'bad');
    }
    const live = s.an.some(a => ['open', 'locked', 'chasing'].includes(a.state) && a.idStatus !== 'plan');
    if (!live && s.disabled < P.nreal && !s.rescanAt) { s.rescanAt = s.t + P.rescan; report(s, 'Abara', 'Everything is ruled out and the ships are still out there. Rescanning takes five minutes.', 'bad'); }
    if (s.rescanAt && s.t >= s.rescanAt) { s.rescanAt = null; s.an.forEach(a => { if (a.state === 'out') { a.state = 'open'; a.read = {}; } }); report(s, 'Abara', 'Rescan complete. Everything is open again.', 'info'); }
  }
  // What the player's own readings say. Uses only a.read plus rough range (the smear's distance), never the hidden kind.
  const KMEAN = { thermal: { real: 0.9, lure: 0.78, ghost: 0.3 }, reactor: { real: 1.0, lure: 0.68, ghost: 0.15 }, occlusion: { real: 0.9, lure: 0.05, ghost: 0.05 } };
  function classify(s, a) {
    const pl = s.player, p = truePos(a, s.t), d = Math.hypot(p.x - pl.x, p.y - pl.y), rf = 1, kinds = ['real', 'lure', 'ghost'];
    const fr = s.friendly ? 1 : 0, lp = { real: Math.log(P.nreal + fr), lure: Math.log(P.nlure), ghost: Math.log(P.N - P.nreal - P.nlure - fr) }, st = {}; let n = 0;
    for (const ch of ['thermal', 'reactor', 'occlusion']) {
      const q = a.read[ch]; if (!q) { st[ch] = 'none'; continue; }
      if (q.blind) { st[ch] = 'blind'; n++; continue; }
      if (!(q.den > 0)) { st[ch] = 'none'; continue; }
      const v = q.num / q.den, sd = 0.45 / Math.sqrt(Math.max(q.den, 0.5)) + 0.06; if (q.den >= 1) { st[ch] = 'set'; n++; } else st[ch] = 'thin';
      for (const k of kinds) { const mu = KMEAN[ch][k], z = (v - mu) / sd; lp[k] += -0.5 * z * z - Math.log(sd); }
    }
    const m = Math.max(...kinds.map(k => lp[k])), w = kinds.map(k => Math.exp(lp[k] - m)), sum = w.reduce((x, y) => x + y, 0), post = {}; kinds.forEach((k, i) => post[k] = w[i] / sum);
    const best = kinds.reduce((b, k) => post[k] > post[b] ? k : b, 'real');
    return { n, st, post, best, p: post[best] };
  }
  function exposure(s) {   // what is making us easy to find, per game minute (display only; sub() uses the same terms)
    const sq = 1, quiet = s.t < s.quietUntil; let m = POSTURE[s.posture].haz * sq * (s.entry === 'dark' && s.t < P.darkWindow ? P.darkHaz : 1);
    if (s.chase) m *= P.chasemult; if (s.rescanAt) m *= 0.5; if (quiet) m *= P.quietHaz;
    const fN = s.analysts.filter(x => x.task != null).length, tN = s.analysts.filter(x => x.task != null && s.an[x.task].state === 'locked').length, z = quiet ? 0 : 1;
    const parts = [{ k: 'drift', label: 'Hull heat and drive, ' + POSTURE[s.posture].label.toLowerCase() + (s.chase ? ', chasing a false lock' : ''), v: P.base * s.tempo * m }, { k: 'focus', label: 'Active sensor work (' + fN + ' on a contact)', v: P.glowFocus * fN * z }, { k: 'track', label: 'Tracking a locked ship (' + tN + ')', v: P.glowTrack * tN * z }, { k: 'pell', label: 'Pell running the ship hot', v: s.pell && !quiet ? P.glowPell : 0 }, { k: 'beam', label: 'Tight-beam challenge leaking', v: s.t < s.beamUntil ? P.beamGlow : 0 }, { k: 'blast', label: 'Weapons fire and detonations close by', v: s.t < s.blastUntil ? s.blastV : 0 }, { k: 'engine', label: (s.entry === 'fast' && s.t < P.wakeDur ? 'Hot arrival wake and engines' : 'Engine heat, ' + SPEED[s.speed].label.toLowerCase()), v: s.t < s.quietUntil ? 0 : engineHeat(s) }, { k: 'ping', label: 'Active ping, loud', v: s.t < s.pingUntil ? P.pingGlow : 0 }, { k: 'near', label: 'A warship close enough to see our hull', v: nearHeat(s) }, { k: 'vent', label: 'Fins out, venting', v: s.vent.on ? P.visDiv : 0 }].filter(x => x.v > 0.0005);
    return { total: parts.reduce((q, x) => q + x.v, 0), parts, quiet };
  }
  function tick(s, dt) { let left = dt; while (left > 1e-9 && !s.over) { const h = Math.min(P.sub, left); sub(s, h); left -= h; } }
  function assign(s, analystId, contact) { const w = s.analysts.find(x => x.id === analystId); if (!w || s.over || (contact != null && s.an[contact].idStatus === 'plan')) return; w.task = (contact == null || w.task === contact) ? null : contact; w.next = Math.min(w.next, s.t + 0.05); }
  function refreshSolution(s, id) { const a = s.an[id]; if (s.over || !a || a.state !== 'locked') return false; a.solve = 0; a.stale = false; report(s, 'Abara', `Re-working the firing solution on contact ${id + 1}.`, 'info'); return true; }
  function resolution(a) { let sum = 0; for (const ch of ['thermal', 'reactor', 'occlusion']) { const q = a.read[ch]; sum += q ? (q.blind ? 0.6 : Math.min(1, q.den / P.solveDen)) : 0; } return sum / 3; }
  function solveInfo(s, a) {
    const res = resolution(a), age = a.anchor ? s.t - a.anchor.t : 3, why = []; let nm = 0, sm = 0; for (const ch of ['thermal', 'reactor', 'occlusion']) if (signal(s, a, ch) !== null) { sm += infoMult(s, a, ch); nm++; } const avgM = nm ? sm / nm : 0.2;
    let T = P.solveMin + (P.solveMax - P.solveMin) * (1 - res) ** 1.3;
    if (res < 0.6) why.push('readings still thin');
    T *= clamp(0.7 / avgM, 0.75, 2); if (avgM < 0.4) why.push('trace is faint (cold or far)');
    if (age > 2) { T *= 1.25; why.push('stale track'); } else if (age < 0.5) T *= 0.9;
    const tp = truePos(a, s.t); let cl = 0; for (const b of s.an) if (b !== a && b.state !== 'out' && b.state !== 'disabled') { const q = truePos(b, s.t); if (Math.hypot(q.x - tp.x, q.y - tp.y) < P.clutterR) cl++; }
    if (cl) { T *= 1 + Math.min(0.3, 0.1 * cl); why.push('clutter nearby'); }
    if (a.lastMan != null && s.t - a.lastMan < 3 && a.aware) { T *= 1.3; why.push('target maneuvering'); }
    if (s.hull < 60) { T *= 1.15; why.push('hull damage'); }
    if (s.pellAct && s.integration >= 50) T *= 0.85;
    const dark = s.t < s.quietUntil, prog = a.solve || 0;
    const faint = avgM < 0.22; if (faint) why.push('trace too faint to work'); return { prog, T, remain: dark || faint ? Infinity : (1 - prog) * T, res, why, paused: dark || faint, ready: prog >= 1, stale: !!a.stale, rate: avgM };
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
    if (!s.over && s.r() < P.closeBump) { alert(s, P.coilAlert); report(s, 'Abara', 'The coilgun flash lit us up.', 'bad'); }
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
      if (a.kind === 'real' && s.r() < P.beamBump) { report(s, 'Abara', `Contact ${id + 1} read the beam. It knows where we are.`, 'danger', true); a.know = Math.max(a.know || 0, 0.5); alert(s, 0.1); }
    }
    return true;
  }
  function startVent(s, forced) {
    if (s.over || s.vent.on || (!forced && s.sink.h < P.ventMin)) return false;
    s.vent.on = true; s.vent.forced = !!forced; s.vent.t0 = s.t; s.vent.n++; if (s.t < s.quietUntil) s.quietUntil = s.t;
    report(s, 'Abara', forced ? 'Heat sinks are full. The fins are extending on their own and we cannot stop them. We are lit up until the sinks drain.' : `Fins out. Dumping heat, ${Math.round(s.sink.h * 100)} percent stored. We are fully visible until we retract or the sinks are empty.`, forced ? 'danger' : 'info', true); return true;
  }
  function stopVent(s) { if (!s.vent.on || s.vent.forced) return false; s.vent.on = false; report(s, 'Abara', `Fins retracted. ${Math.round(s.sink.h * 100)} percent heat still stored.`, 'info'); return true; }
  function sinkStep(s, h) {
    const ex = exposure(s).parts.reduce((q, x) => q + (x.k === 'vent' ? 0 : x.v), 0), k = s.sink; k.h = clamp(k.h + (P.sinkK * ex / s.me.sink - (s.vent.on ? 1 / P.ventFull : 0)) * h, 0, 1);
    if (s.vent.on) { s.vent.total += h; if (k.h <= 0.02 || (s.vent.forced && k.h <= P.forcedStop)) { s.vent.on = false; s.sinkWarn = k.h > 0.6 ? 1 : 0; report(s, 'Abara', k.h <= 0.02 ? 'Sinks are empty. Fins retracted.' : 'Fins retracting. The sinks are down to a safe level.', 'good'); } }
    else { const lv = [[0.6, 'Heat sinks at 60 percent. Venting is how we shed it, and it shows us to everyone. Quiet only slows the fill.'], [0.8, 'Heat sinks at 80 percent. We will have to vent soon.'], [0.95, 'Heat sinks nearly full. Vent now, or the fins will open by themselves.']];
      for (let i = s.sinkWarn; i < 3; i++) if (k.h >= lv[i][0]) { s.sinkWarn = i + 1; report(s, 'Abara', lv[i][1], i ? 'danger' : 'bad', i > 0); }
      if (k.h >= 1) startVent(s, true); }
  }
  function goQuiet(s) { if (s.over || s.vent.on || s.t < s.quietCd) return false; s.quietUntil = s.t + P.quietDur; s.quietCd = s.t + P.quietCd; report(s, 'Abara', 'Going quiet. Sensors dark, nobody touches anything for three minutes.', 'info'); return true; }
  function retreat(s) { if (s.over) return; s.over = s.disabled ? 'breach' : 'breach0'; report(s, 'Abara', 'Breaking contact. Breach drive spinning up.', 'bad'); }
  function setPellAct(s, on) { s.pellAct = !!on && s.integration >= 75; }
  return { LOADOUTS, startVent, stopVent, ourVis, enemyVis, infoMult, backdrop, blocked, rangeF, refreshSolution, uncertainty, missilePos, setRoute, relBearing, solveInfo, resolution, P, POSTURE, ANALYSTS, THRESH, goQuiet, advice, setPellAct, newHunt, tick, assign, lockContact, dismissContact, fire, retreat, fanInfo, hitProb, estAt, spreadAt, START, setOrder, setSpeed, pingContact, displayPos, SPEED, truePos, planPos, selfRisk, fireClose, closeInfo, volleyFx, cat, exposure, classify, stealthState, challenge };
})();
if (typeof module !== 'undefined') module.exports = HuntRT;
