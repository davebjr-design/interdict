// Interdict hunt engine v4: REAL TIME with analyst reports. Time unit = game minutes (UI maps real seconds to game minutes).
// Three analysts (thermal / reactor / occlusion) read contacts on their own schedule; the player directs attention, interprets, locks, tracks, fires.
const HuntRT = (() => {
  // RULES: the world, the same for every ship. Never trimmed, never scaled by difficulty.
  const RULES = { dmgExp: 2, sensRef: 40, visDiv: 0.2, visFloor: 0.06, visCap: 0.85, ventSig: 1, floorM: 0.12, blockM: 0.12, edge: 18, N: 8, nreal: 2, nlure: 3, arena: 240, sub: 0.05, secPerMin: 16, halfLife: 3, bait: 0.75, blastSat: 1.6 };
  // PLAYER: our ship and our actions. Copied into s.me for each hunt; trims, Pell assists and decision moments touch only s.me (applyPlayer).
  const PLAYER = { meltHull: 3, meltSys: 0.15, forcedRetract: 0.8, readDone: 8, pingSolve: 0.6, pingGain: 0.4, pingWeight: 2, spoolMove: 0.3, spoolDog: 11.25, spool: 3, spoolVis: 0.9, spoolHeat: 0.06, homeWarned: 0.15, missQuiet: 0.08, homePull: 0.5, missiles: 6, dispMin: 0.8, dispK: 0.03, closeDmg: 40, empRecover: 0.02, symP: 0.8, classDen: 12, sinkK: 0.7, ventFull: 4, ventMin: 0.08, forcedStop: 0.25, sensR: 120, pingAlert: 0.3, launchAlert: 0.15, launchSeen: 0.35, pingFix: 0.7, hitFix: 0.75, salvoFix: 0.5, coilAlert: 0.2, solveStale: 3, uncDen: 20, uncMin: 2, uncMax: 16, solveMin: 0.8, solveMax: 3, solveDen: 8, clutterR: 18, base: 0.02, glowFocus: 0.01, glowTrack: 0.03, chase: 5, decoyStall: 0.55, rescan: 5, engage: 1, missileSpeed: 40, alongStretch: 1.5, autoPeriod: 0.8, focusPeriod: 0.45, killR: 7, glowPell: 0.012, integrationPerMin: 0.8, fixLo: 0.35, fixSpan: 0.4, driftK: 0.9, certReady: 0.6, certBleed: 0.5, manPen: 1.5, manWin: 3, manLoss: 0.35, spdK: 0.2, backK: 0.6, quietDur: 2.5, quietCd: 10, quietHaz: 0.2, suggestShort: 0.72, tubes: 3, reload: 4, darkWindow: 6, darkHaz: 0.5, darkWarm: 4, wakeDur: 3, wakeGlow: 0.1, wpReach: 2, moveRate: 1.1, shipSpeed: 1, holdOff: 5, pingCd: 4, pingDur: 1.5, pingGlow: 0.14, selfRadius: 7, closeRange: 18, closeCd: 2, closeKill: 8, closeAcc: 0.85, closeGlow: 0.12, closeDur: 2, blastGlow: 0.08, blastDur: 1.5, nearGlow: 0.025, nearRange: 24, closeBump: 0.5, beamGlow: 0.08, beamDur: 1, beamCd: 2, beamBump: 0.35, shareReads: 2, pellFriction: 0.08, classNoise: 1, pingRounds: 3, noRedline: 0, ventAfterglow: 0, leadSpread: 1 };
  // AI: enemy warship defaults. Copied into a.ai per contact at spawn, scaled by its loadout and the difficulty. Nothing on the player side reads or writes it.
  const AI = { heatK: 1.4, sinkDiv: 3, ventFull: 4, empRecover: 0.15, litDecay: 0.15, sensR: 120, knowK: 0.4, knowDecay: 0.05, knowLose: 0.15, aimSigMax: 36, aimSigMin: 3.5, standoff: 60, fireCd0: 1.2, fireCd: 4.5, cone: 9, coneStill: 0.7, coneMove: 0.3, missileSpeed: 40, manPatrol: [6,  9], manAware: [3,  5], missRate: 0.5, evadeV: 10, evadeMax: 36, dmgW: 31, missiles: 6, killR: 7, alongStretch: 1.5, dispMin: 0.8, dispK: 0.03, fireRange: 110, aimRange: 120, quietBlur: 4, searchStart: 7, searchRamp: 12, searchK: 0.05, searchDecay: 0.85, closeIn: 0.6, probeCd: 7, probeKnow: 0.12, probeGain: 0.22 };
  const P = Object.assign(RULES, { player: PLAYER, ai: AI });   // P is the rules object; P.player and P.ai are the default blocks (read-only templates)
  // DIFFICULTY: six knobs that scale enemy competence only (higher = tougher). Applied to each enemy's a.ai at spawn; never touches s.me or the rules.
  // notice: how fast they build a fix on us. memory: how long they keep it. gunnery: aim and cone. tempo: fire and maneuver cadence. punch: warhead damage. cunning: search, salvo spotting.
  const DIFFICULTY = {
    easy:   { notice: 0.6, memory: 0.67, gunnery: 0.71, tempo: 0.77, punch: 0.7, cunning: 0.3 },
    normal: { notice: 1.0, memory: 1.0, gunnery: 1.0, tempo: 1.0, punch: 1.0, cunning: 0.6 },
    hard:   { notice: 1.5, memory: 1.67, gunnery: 1.33, tempo: 1.33, punch: 1.3, cunning: 1.0 } };
  let DIFF = Object.assign({ name: 'normal' }, DIFFICULTY.normal);
  function setDifficulty(d) {   // a preset name or an object of knobs (missing knobs are 'normal'); affects hunts started afterwards
    if (typeof d === 'string') { if (!DIFFICULTY[d]) return false; DIFF = Object.assign({ name: d }, DIFFICULTY[d]); }
    else DIFF = Object.assign({ name: 'custom' }, DIFFICULTY.normal, d || {});
    return Object.assign({}, DIFF);
  }
  const getDifficulty = () => Object.assign({}, DIFF);
  const clone = o => JSON.parse(JSON.stringify(o));
  function makeAI(D) {   // one enemy's behaviour block: the AI defaults scaled by the difficulty knobs (its loadout is applied live through a.load)
    const ai = clone(AI), c = D.cunning / DIFFICULTY.normal.cunning;
    ai.knowK *= D.notice; ai.knowDecay /= D.memory; ai.knowLose /= D.memory;
    ai.aimSigMax /= D.gunnery; ai.aimSigMin /= D.gunnery; ai.cone /= D.gunnery;
    ai.fireCd /= D.tempo; ai.fireCd0 /= D.tempo; ai.manAware = ai.manAware.map(x => x / D.tempo);
    ai.dmgW *= D.punch; ai.missRate *= c; ai.cunning = D.cunning;
    return ai;
  }
  function makeMe(load) { const me = clone(PLAYER); for (const k of ['id', 'cls', 'name', 'sensor', 'sig', 'sink']) me[k] = load[k]; return me; }   // our ship's profile for one hunt
  function applyPlayer(s, mod = {}) {   // the one door for player-only effects (trims, Pell assists, decision moments). It can reach only s.me; returns any keys it refused
    const bad = []; for (const k in mod.mul || {}) { if (typeof s.me[k] === 'number') s.me[k] *= mod.mul[k]; else bad.push(k); }
    for (const k in mod.set || {}) { if (k in s.me) s.me[k] = mod.set[k]; else bad.push(k); } return bad;
  }
  const POSTURE = { still: { haz: 0.8, rate: 1.0, label: 'Stay still', tip: 'Hunter finds you at 0.8x speed. Analysts work at normal speed.' }, evade: { haz: 0.95, rate: 1.0, label: 'Evasive', tip: 'Weaving gives the analysts new angles to triangulate from, so they read about 10% faster, but the drive makes you about 20% louder than holding still.' }, orbit: { haz: 1.0, rate: 1.0, label: 'Circle', tip: 'Circle the contact at the current range. Angles change constantly, so the analysts triangulate faster, the drive makes noise.' }, route: { haz: 1.0, rate: 1.0, label: 'Flight plan', tip: 'The navigator is flying the plan you drew.' }, close: { haz: 1.0, rate: 1.0, label: 'Close on a contact', tip: 'Moving toward a contact: engine heat depends on your speed; the change of angle helps the analysts, and they read stronger as range drops.' }, separate: { haz: 1.0, rate: 1.0, label: 'Open distance', tip: 'Moving away from a contact: engine heat depends on your speed; the change of angle helps the analysts, but signals weaken with range.' } };
  const START = { dark: 18, standard: 30, fast: 66 };
  const SPEED = { v1: { label: '20%', v: 1.2, heat: 0.0, rate: 1.0, tip: 'One fifth drive: cold, almost no engine heat.' }, v2: { label: '40%', v: 2.4, heat: 0.012, rate: 1.0, tip: 'Two fifths drive: a trace of engine heat.' }, v3: { label: '60%', v: 3.6, heat: 0.04, rate: 1.0, tip: 'Three fifths drive: some engine heat.' }, v4: { label: '80%', v: 4.8, heat: 0.12, rate: 0.9, tip: 'Four fifths drive: loud, and the sink fills noticeably.' }, v5: { label: '100%', v: 6.0, heat: 0.3, rate: 0.8, tip: 'Full drive: the sink fills in a few minutes and sensors are noisy.' }, ab: { label: 'Redline', v: 9.0, heat: 0.9, rate: 0.6, tip: 'Redline: far faster than full drive, but the sink fills in well under a minute, sensors are nearly deaf, and if the sink stays full the ship starts to melt. Short bursts only.' } }, SPD_ALIAS = { creep: 'v1', cruise: 'v3', burn: 'v5' };
  const ANALYSTS = [{ id: 'dace', name: 'Dace', ch: 'thermal', role: 'Heat' }, { id: 'castellan', name: 'Castellan', ch: 'reactor', role: 'Reactor' }, { id: 'quill', name: 'Quill', ch: 'occlusion', role: 'Eclipse' }];
  function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function gauss(r) { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const mins = m => { const r = Math.round(m * 10) / 10; return (r === 1 ? 'one minute' : (Number.isInteger(r) ? r : r.toFixed(1)) + ' minutes'); };   // crew always speak in game minutes
  const LOADOUTS = [   // the same fields rule our ship and theirs: sensor = how well it reads others, sig = how loud it is, crew = reaction and discipline, sink = heat capacity, spd = drive, dmg = warhead
    { id: 'cutter', cls: 'destroyer', name: 'Salvage cutter', sensor: 1.0, sig: 1.0, crew: 1.0, sink: 1.0, spd: 1.0, dmg: 1.0 },
    { id: 'picket', cls: 'destroyer', name: 'Picket', sensor: 1.0, sig: 1.0, crew: 1.0, sink: 1.0, spd: 1.0, dmg: 1.0, blurb: 'Standard patrol ship.' },
    { id: 'hound', cls: 'destroyer', name: 'Hound', sensor: 1.3, sig: 1.2, crew: 1.0, sink: 0.9, spd: 1.15, dmg: 1.0, blurb: 'Sharp sensors, loud drive.' },
    { id: 'shade', cls: 'cruiser', name: 'Shade', sensor: 0.9, sig: 0.72, crew: 1.0, sink: 0.9, spd: 0.9, dmg: 0.8, blurb: 'Stealthy, lightly armed.' },
    { id: 'veteran', cls: 'cruiser', name: 'Veteran', sensor: 1.0, sig: 1.0, crew: 1.25, sink: 1.1, spd: 1.0, dmg: 1.1, blurb: 'Fast hands, vents only when it is safe.' },
    { id: 'green', cls: 'destroyer', name: 'Green crew', sensor: 0.85, sig: 1.0, crew: 0.75, sink: 0.9, spd: 1.0, dmg: 1.0, blurb: 'Slow to react, careless about heat.' },
    { id: 'brute', cls: 'battleship', name: 'Brute', sensor: 0.9, sig: 1.25, crew: 0.95, sink: 1.4, spd: 0.85, dmg: 1.4, blurb: 'Big heat sinks, loud, hits hard.' }];
  function makeBodies(r, start) {   // two bright backdrops (eclipse screens) and one or two dark planets (cover)
    const A = P.arena, out = [], far = (x, y, m) => out.every(b => Math.hypot(b.x - x, b.y - y) > m) && Math.hypot(start.x - x, start.y - y) > 70;
    const add = (kind, rad, halo, tries = 60) => { for (let i = 0; i < tries; i++) { const x = 40 + r() * (A - 80), y = 40 + r() * (A - 80); if (far(x, y, 70)) { out.push({ kind, x, y, r: rad, halo }); return; } } };
    add('star', 12, 70); add('planet', 16 + r() * 8, 0); if (r() < 0.6) add('planet', 13 + r() * 7, 0);
    return out;
  }
  function newHunt(seed, opts = {}) {
    const r = rng(seed), kinds = [];
    const NR = opts.nreal ?? P.nreal, NN = opts.N ?? P.N, NL = opts.nlure ?? P.nlure, D = opts.difficulty ? (typeof opts.difficulty === 'string' ? Object.assign({ name: opts.difficulty }, DIFFICULTY[opts.difficulty] || DIFFICULTY.normal) : Object.assign({ name: 'custom' }, DIFFICULTY.normal, opts.difficulty)) : DIFF;
    for (let i = 0; i < NR; i++) kinds.push('real'); for (let i = 0; i < NL; i++) kinds.push('lure'); if (opts.friendly) kinds.push('friend'); while (kinds.length < NN) kinds.push('ghost');
    for (let i = kinds.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [kinds[i], kinds[j]] = [kinds[j], kinds[i]]; }
    const grids = ['none', 'light', 'heavy'], tempo = opts.tempo ?? (0.7 + 0.8 * r());
    const entry = opts.entry || 'standard', center = opts.layout === 'center', start = center ? { x: P.arena / 2, y: P.arena / 2 } : { x: START[entry] ?? 10, y: P.arena / 2 }, bodies = makeBodies(r, start), M = P.arena / 40;
    const an = kinds.map((k, i) => {
      let x0, y0; do { if (center) { x0 = 36 + r() * 168; y0 = 36 + r() * 168; } else if (opts.dog) { x0 = opts.zone ? opts.zone[0] + r() * opts.zone[1] : 40 + r() * 60; y0 = 50 + r() * 140; } else { x0 = 90 + r() * 110; y0 = 24 + r() * 192; } } while (bodies.some(b => b.kind === 'planet' && Math.hypot(b.x - x0, b.y - y0) < b.r + 12) || (center && Math.hypot(x0 - 120, y0 - 120) < 54));
      let hd = Math.atan2(start.y - y0, start.x - x0) + (r() - 0.5) * 2.0, v = (k === 'ghost' ? 0.3 + 0.4 * r() : 1.0 + 1.2 * r()) * 3;
      let drift = null, idStatus = opts.friendly ? 'unknown' : null;
      if (k === 'friend') { const sg = r() < 0.5 ? -1 : 1; if (center) { y0 = 120 + sg * (48 + r() * 60); x0 = 6; } else { y0 = start.y + sg * (18 + r() * 18); x0 = start.x + 9; } v = 3 * (1.0 + 0.4 * r()); hd = 0; idStatus = opts.friendly === 'unlisted' ? 'unknown' : 'plan'; }
      const jit = { x: Math.sin(i * 7.1) * 1.5, y: Math.cos(i * 3.7) * 1.5 };
      return { jit, drift, idStatus, id: i, kind: k, x0, y0, hd, v, vx: v * Math.cos(hd), vy: v * Math.sin(hd), state: 'open', track: 0, grid: grids[Math.floor(r() * 3)], flutter: null, anchor: null, read: {}, lastRead: 0, know: 0, stage: 0, fakeCls: ['destroyer', 'cruiser', 'destroyer'][Math.floor(r() * 3)], vent: null, load: Object.assign({}, k === 'real' ? LOADOUTS[1 + Math.floor(r() * 6)] : LOADOUTS[1]), ventOk: 5 + 4 * r(), r: rng((seed * 31 + i * 7919) ^ 0xC2B2AE35), ai: makeAI(D) };   // a.r: this contact's own decisions; a.ai: its behaviour block
    });
    for (const a of an) { if (a.kind === 'real' && opts.warn) a.know = opts.warn * 0.7; if (a.kind === 'real' && opts.dog) a.sil = opts.warn > 0 ? 0.7 : 1.25; a.eff = 1; a.lit = 0; if (a.kind === 'real' || a.kind === 'friend') { a.hpMax = a.hp = HPMAX[a.kind === 'real' ? a.load.cls : 'cruiser']; } }
    for (const a of an) if (a.kind === 'real') { a.sink = { h: 0.15 + 0.6 * r() }; a.vx *= a.load.spd; a.vy *= a.load.spd; a.v *= a.load.spd; }
    return { nreal: NR, N: NN, nlure: NL, difficulty: D.name, get spoolMin() { return this.dog ? this.me.spoolDog : this.me.spool; }, rP: rng(seed ^ 0x9E3779B9), rFx: rng(seed ^ 0x85EBCA6B), dog: !!opts.dog, events: [], evN: 0, holdEvents: false, hold: false, sysEff: 1, bodies, me: makeMe(LOADOUTS[0]), sink: { h: opts.sink0 ?? 0.05 }, vent: { on: false, forced: false, t0: 0, n: 0, total: 0 }, sinkWarn: 0, entry, route: (opts.route || []).map(p => ({ x: p.x, y: p.y })), routeI: 0, speed: SPD_ALIAS[opts.speed] || opts.speed || 'v3', orderId: null, pingCd: 0, pingUntil: 0, pingFx: [], hull: 100, blastUntil: 0, blastV: 0, cwCd: 0, hullWarned: false, friendly: !!opts.friendly, beamCd: 0, beamUntil: 0, fratricide: 0, r, seed, t: 0, stage: 0, an, tempo, posture: (opts.route && opts.route.length) ? 'route' : 'still', pell: false, integration: opts.integration ?? 0, thresholdsHit: {}, pellAct: false, analysts: ANALYSTS.map((a, i) => ({ ...a, task: null, next: 0.15 + 0.12 * i })), pellNext: 0.5, pending: null, quietUntil: 0, quietCd: 0, volleys: [], inc: [], vel: { vx: 0, vy: 0 }, tubes: Array(PLAYER.tubes).fill(0), rescanAt: null, log: [], beats: 0, over: null, disabled: 0, player: { x: start.x, y: start.y }, shots: 0, wrong: 0 };
  }
  function report(s, who, text, kind = 'info', urgent = false) { s.beats++; s.log.push({ t: s.t, who, text, kind, urgent }); }
  const fold = v => { const lo = 6, hi = P.arena - 1.5, w = hi - lo; let u = (v - lo) % (2 * w); if (u < 0) u += 2 * w; return lo + (u > w ? 2 * w - u : u); };
  function truePos(a, t) { const q = truePos0(a, t); return { x: fold(q.x), y: fold(q.y) }; }
  function truePos0(a, t) { let L = null; if (a.legs) for (const g of a.legs) { if (g.t <= t) L = g; else break; } if (L) return { x: L.x + L.vx * (t - L.t), y: L.y + L.vy * (t - L.t) }; return { x: a.x0 + a.vx * t, y: a.y0 + a.vy * t }; }
  function legVel(a, t) { let L = null; if (a.legs) for (const g of a.legs) { if (g.t <= t) L = g; else break; } return L ? { vx: L.vx, vy: L.vy } : { vx: a.vx, vy: a.vy }; }
  function velAt(a, t) { const p1 = truePos(a, t - 0.05), p2 = truePos(a, t + 0.05); return { vx: (p2.x - p1.x) / 0.1, vy: (p2.y - p1.y) / 0.1 }; }
  function maneuver(s, a, dh, steer) {
    const p = truePos0(a, s.t), v = legVel(a, s.t), sp = Math.hypot(v.vx, v.vy), h0 = steer != null ? steer : Math.atan2(v.vy, v.vx) + dh;
    (a.legs || (a.legs = [])).push({ t: s.t, x: p.x, y: p.y, vx: Math.cos(h0) * sp, vy: Math.sin(h0) * sp }); a.lastMan = s.t; if (a.state === 'locked' && sp > 0.5 && (a.solve || 0) > 0) a.solve *= 1 - s.me.manLoss;
    if (a.state === 'locked' && sp > 0.5) report(s, 'Dace', `Contact ${a.id + 1} has changed course. Our track is off until we rescan it.`, 'bad');
  }
  function makeAware(s, a, text, know = 0.4) {   // know: how good a fix the event gave it (a hit or a ping points straight back at us)
    if (a.kind !== 'real' || a.state === 'disabled') return; a.know = Math.max(a.know || 0, know); if (a.aware) return; a.aware = true; a.nextFire = s.t + (a.ai.fireCd0 + a.r() * 1.5) / (a.load ? a.load.crew : 1); a.nextMan = Math.min(a.nextMan ?? 1e9, s.t + 1 + a.r() * 2);
    report(s, 'Dace', text || `Contact ${a.id + 1} has noticed us. Expect it to maneuver and shoot.`, 'danger', true);
  }
  const aimSigma = a => { const kq = clamp(((a.know || 0) - 0.33) / 0.67, 0, 1); return (a.ai.aimSigMax + (a.ai.aimSigMin - a.ai.aimSigMax) * kq) / Math.sqrt(a.load ? a.load.crew : 1); };
  function foes(s) {   // contacts move, maneuver, and the aware warships shoot back
    const rnd = (r, rr) => r[0] + rr() * (r[1] - r[0]);
    for (const a of s.an) {
      if (a.kind === 'friend' || a.state === 'disabled') continue;
      const p = truePos0(a, s.t), v = legVel(a, s.t), e = P.edge, A = P.arena;
      if ((p.x < e && v.vx < 0) || (p.x > A - e && v.vx > 0) || (p.y < e && v.vy < 0) || (p.y > A - e && v.vy > 0)) { maneuver(s, a, 0, Math.atan2(A / 2 - p.y, A / 2 - p.x) + (a.r() - 0.5) * 0.9); continue; }
      { const pb = s.bodies.find(b => b.kind === 'planet' && Math.hypot(b.x - p.x, b.y - p.y) < b.r + 10 && ((b.x - p.x) * v.vx + (b.y - p.y) * v.vy) > 0); if (pb) { maneuver(s, a, 0, Math.atan2(p.y - pb.y, p.x - pb.x) + (a.r() - 0.5) * 0.8); continue; } }
      if (a.kind !== 'ghost') { const cr = a.load ? a.load.crew : 1; if (a.nextMan == null) a.nextMan = s.t + rnd(a.ai.manPatrol, a.r); if (s.t >= a.nextMan) {
        if (a.aware && a.kind === 'real' && a.r() < 0.65) { const sg = aimSigma(a), bx = s.player.x + gauss(a.r) * sg, by = s.player.y + gauss(a.r) * sg, dd = Math.hypot(bx - p.x, by - p.y), hd = Math.atan2(by - p.y, bx - p.x); maneuver(s, a, 0, dd > a.ai.standoff ? hd + (a.r() - 0.5) * 0.4 : hd + (a.r() < 0.5 ? 1 : -1) * (1.2 + a.r() * 0.5)); }
        else if (a.kind === 'real' && !a.aware && a.r() < searchLvl(s, a) * a.ai.closeIn) { const g = 30 + 60 * (1 - searchLvl(s, a)), bx = s.player.x + gauss(a.r) * g, by = s.player.y + gauss(a.r) * g; maneuver(s, a, 0, Math.atan2(by - p.y, bx - p.x)); }   // closing in on the area the noise came from
        else { const mag = (a.aware ? 0.6 + a.r() * 0.6 : 0.3 + a.r() * 0.4) * (a.r() < 0.5 ? -1 : 1); maneuver(s, a, mag); } a.nextMan = s.t + rnd(a.aware ? a.ai.manAware : a.ai.manPatrol, a.r) / cr; } }
      if (a.kind === 'real' && s.t >= a.nextFire && a.aware) {
        const quiet = s.t < s.quietUntil; if (a.quietRoll && s.t >= a.quietRoll.until) a.quietRoll = null;
        if (!quiet || !a.heard) a.heard = { x: s.player.x, y: s.player.y, vx: (s.vel || { vx: 0 }).vx, vy: (s.vel || { vy: 0 }).vy, t: s.t };   // while we make noise they follow us; when we go quiet they keep the last fix
        if (quiet && !a.quietRoll) a.quietRoll = { until: s.quietUntil, fire: a.r() < a.ai.cunning };
        if (quiet && !a.quietRoll.fire) { a.nextFire = s.quietUntil + 0.5; continue; }
        const f = truePos(a, s.t), hq = a.heard, dGo = Math.hypot(hq.x - f.x, hq.y - f.y);
        if (dGo > a.ai.fireRange) { a.nextFire = s.t + 1; continue; }   // out of reach: it closes first (aware maneuvers steer toward us)
        const blur = quiet ? a.ai.quietBlur * (s.t - hq.t) : 0, tf0 = dGo / a.ai.missileSpeed, lead = quiet ? 0.5 : 0.95;
        const sg = Math.hypot(aimSigma(a) * (0.5 + dGo / a.ai.aimRange) / Math.sqrt(perf(a)), blur), aim = { x: hq.x + hq.vx * (tf0 + (s.t - hq.t)) * lead + gauss(a.r) * sg, y: hq.y + hq.vy * (tf0 + (s.t - hq.t)) * lead + gauss(a.r) * sg }, tf = Math.hypot(aim.x - f.x, aim.y - f.y) / a.ai.missileSpeed;
        s.inc.push({ dmg: a.load.dmg, id: a.id, foe: true, t0: s.t, at: s.t + tf, from: { x: f.x, y: f.y }, aim, dir: Math.atan2(aim.y - f.y, aim.x - f.x), cone: a.ai.cone * (1.4 - 0.7 * clamp(((a.know || 0) - 0.33) / 0.67, 0, 1)) * a.ai.coneStill + a.ai.coneMove * Math.hypot(hq.vx, hq.vy) * tf0, disp: dispOf(a.ai, Math.hypot(aim.x - f.x, aim.y - f.y)), off: Array.from({ length: a.ai.missiles }, () => [gauss(a.r), gauss(a.r)]), stretch: a.ai.alongStretch, killR: a.ai.killR, dmgW: a.ai.dmgW });
        a.nextFire = s.t + a.ai.fireCd * (0.8 + 0.4 * a.r()) * (1.3 - 0.4 * clamp(((a.know || 0) - 0.33) / 0.67, 0, 1)) / (a.load.crew * perf(a));   // a firm fix on us means a faster rhythm a.lastFire = s.t; markHostile(s, a); (s.warn || (s.warn = [])).push({ id: a.id, t: s.t, lead: tf }); report(s, 'Dace', `Contact ${a.id + 1} has fired on us. Impact in ${mins(tf)}. Move, or go quiet.`, 'danger', true);
      }
    }
    for (const v of s.inc.filter(v => s.t >= v.at)) {
      s.inc.splice(s.inc.indexOf(v), 1); const ls = landings(v), pl = s.player, R = v.killR; let f = 0, n = 0; const L = ls.map(q => { const d = Math.hypot(q.x - pl.x, q.y - pl.y); if (d < R) { f += blastDmg(1, R, d); n++; } return { dx: q.x - pl.x, dy: q.y - pl.y, d }; });
      const dmg = v.dmgW * (v.dmg || 1) * stack(f), before = s.hull;
      if (n) hurtPlayer(s, dmg, `Contact ${v.id + 1} volley: ${n} of ${ls.length} detonated in range. ${dmg < 12 ? 'Light hull damage, plating only, no systems affected.' : dmg < 30 ? 'Moderate hull damage, possible systems damage.' : 'Heavy hull damage. That one hurt.'}`); else report(s, 'Abara', `Contact ${v.id + 1} volley: no damage. All warheads detonated clear of the hull.`, 'good');
      emit(s, { kind: 'theirs', shooter: v.id, ammo: 'he', L, R, n, dmg, before, after: s.hull, max: 100, result: s.hull <= 0 ? 'cripple' : n ? 'damaged' : 'miss', who: 'Us' });
      if (s.over) return;
    }
  }
  function alert(s, amt) {   // a noisy event: every live warship hears it, weighed by range
    for (const e of s.an) if (e.kind === 'real' && e.state !== 'disabled') { const p = truePos(e, s.t); e.know = Math.min(1.2, (e.know || 0) + amt * rangeF(Math.hypot(p.x - s.player.x, p.y - s.player.y), e.ai.sensR) * (blocked(s, p, s.player) ? P.blockM : 1)); }
  }
  function searchLvl(s, a) { return a.kind !== 'real' ? 0 : clamp((s.t - a.ai.searchStart) / a.ai.searchRamp, 0, 1) * a.ai.cunning / DIFFICULTY.normal.cunning; }   // 0..1 (more on hard): how widely an unaware hunter has spread its search
  function probe(s, a, p, d) {   // an enemy active ping: it learns where we are if nothing is in the way, and it gives itself away
    const bl = blocked(s, p, s.player), gain = bl ? 0 : a.ai.probeGain * rangeF(d, a.ai.sensR) * 1.5; a.know = Math.min(1.2, a.know + gain); a.lit = Math.min(1, (a.lit || 0) + 0.35); markHostile(s, a);
    report(s, 'Dace', bl ? `Contact ${a.id + 1} just pinged. The planet took it; it learned nothing. It is a warship, and it is hunting.` : `Contact ${a.id + 1} just pinged us. It is a warship, and now it has a rough idea where we are.`, 'danger', true);
  }
  function reopen(s, a) { if (a.state === 'out') { a.state = 'open'; } }
  function markHostile(s, a) { if (a.kind !== 'real' || a.idStatus === 'hostile' || a.state === 'disabled') return; a.idStatus = 'hostile'; reopen(s, a); }
  function enemyAI(s, h) {
    const pl = s.player, vis = ourVis(s); let mx = 0;
    for (const a of s.an) {
      if (a.kind !== 'real' || a.state === 'disabled') continue;
      const L = a.load, p = truePos(a, s.t), d = Math.hypot(p.x - pl.x, p.y - pl.y), v = legVel(a, s.t), sp = Math.hypot(v.vx, v.vy);
      a.sink.h = clamp(a.sink.h + (a.ai.heatK * enemyAct(s, a, sp) / (L.sink * a.ai.sinkDiv) - (a.vent ? 1 / a.ai.ventFull : 0)) * h, 0, 1);
      if (a.vent) { if (a.sink.h <= 0.03) { a.vent = null; a.ventOk = s.t + 6; if (a.ventSeen) report(s, 'Dace', `Contact ${a.id + 1} folded its fins. The thermal blaze is fading.`, 'info'); } }
      else if (s.t >= a.ventOk) {
        const smart = L.crew >= 1.1, want = a.sink.h >= 0.999 || (a.sink.h >= (smart ? 0.6 : 0.82) && (!smart || (a.know || 0) < 0.3));
        if (want) { a.vent = { t0: s.t }; a.ventSeen = false; const m = infoMult(s, a, 'thermal'); if (m >= 0.3) { a.ventSeen = true; reopen(s, a); markHostile(s, a); report(s, 'Dace', `Contact ${a.id + 1} has extended heat fins. Thermal blaze: it is fully visible while it dumps heat.`, 'good', true); } }
      }
      a.eff = Math.min(1, (a.eff ?? 1) + a.ai.empRecover * h); a.lit = Math.max(0, (a.lit || 0) - a.ai.litDecay * h);
      const los = (blocked(s, p, pl) ? P.blockM : 1) * rangeF(d, a.ai.sensR) * L.sensor * perf(a), sl = searchLvl(s, a);
      const g = a.ai.knowK * vis * vis * los + (a.aware ? 0 : a.ai.searchK * sl * (0.6 + 2 * vis) * los);   // what our noise gives them, plus the slow hunt of a ship that knows someone is out here
      a.know = Math.min(1.2, (a.know || 0) + g * h);
      if (vis < 0.35) a.know = Math.max(0, a.know - a.ai.knowDecay * (1 - a.ai.searchDecay * sl) * (0.35 - vis) / 0.35 * h);
      if (!a.aware && sl > 0.4 && a.know >= a.ai.probeKnow && s.t >= (a.probeAt ?? 0) && s.t >= s.quietUntil) { a.probeAt = s.t + a.ai.probeCd * (0.8 + 0.4 * a.r()); if (a.r() < a.ai.cunning) probe(s, a, p, d); }
      const st = a.know >= 1 ? 3 : a.know >= 0.66 ? 2 : a.know >= 0.33 ? 1 : 0;
      if (st > a.stage) {
        if (st >= 1 && !a.aware) makeAware(s, a, `Contact ${a.id + 1} has a bearing on us. Expect it to hunt and shoot.`);
        if (st === 2) report(s, 'Dace', `Contact ${a.id + 1} is closing in. Its fix on us is getting tight.`, 'danger', true);
        if (st === 3) report(s, 'Dace', `Contact ${a.id + 1} has a firm solution on us. Expect accurate fire.`, 'danger', true);
      }
      a.stage = st; mx = Math.max(mx, st);
      if (a.aware && a.know < a.ai.knowLose && s.t > (a.nextFire ?? 0) - 1) { a.aware = false; report(s, 'Dace', `Contact ${a.id + 1} seems to have lost us. It is back on patrol.`, 'good'); }
    }
    s.stage = mx;
  }
  // ---- detection: everyone always has a trace. What a ship shows depends on what it is doing; what we learn depends on that trace, our sensors, the range, and what is in the way.
  function backdrop(s, a) {   // is a bright star screen behind that contact, seen from here?
    const p = truePos(a, s.t), pl = s.player, dx = p.x - pl.x, dy = p.y - pl.y, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d;
    for (const b of s.bodies) if (b.kind === 'star') { const wx = b.x - pl.x, wy = b.y - pl.y, al = wx * ux + wy * uy, pe = Math.abs(wx * uy - wy * ux); if (al > d && pe < b.halo) return true; } return false;
  }
  function blocked(s, p1, p2) {   // does a planet sit on the line between two points?
    for (const b of s.bodies) if (b.kind === 'planet') { const dx = p2.x - p1.x, dy = p2.y - p1.y, L2 = dx * dx + dy * dy || 1, t = clamp(((b.x - p1.x) * dx + (b.y - p1.y) * dy) / L2, 0, 1); if (Math.hypot(p1.x + t * dx - b.x, p1.y + t * dy - b.y) < b.r) return true; } return false;
  }
  const rangeF = (d, R) =>   // R is the OBSERVER's sensor range: ours (s.me.sensR, trimmable) or theirs (a.ai.sensR)
    Math.min(1.2, (1 + (P.sensRef / R) ** 2) / (1 + (d / R) ** 2));
  const visOf = total => clamp(total / P.visDiv, P.visFloor, P.visCap);
  function ourVis(s) { if (s.me.ventAfterglow && !s.vent.on && s.ventOffT != null && s.t < s.ventOffT + s.me.ventAfterglow) return Math.max(P.ventSig * 0.6, ourVis0(s)); return ourVis0(s); }
  function ourVis0(s) { if (s.spool) return Math.max(s.me.spoolVis, s.vent.on ? P.ventSig : 0); return s.vent.on ? P.ventSig : Math.min(1, visOf(exposure(s).total) * s.me.sig ); }   // how visible we are, 0..1
  function enemyAct(s, a, sp) { return (0.016 + 0.03 * (sp / 4.5) ** 2 + (a.aware ? 0.02 : 0) + (s.t < (a.lastFire ?? -9) + 1.5 ? 0.1 : 0)) * (a.state === 'disabled' ? 0 : 1); }
  function enemyVis(s, a) { return Math.min(1, enemyVis0(s, a) + (a.lit || 0) * 0.6); }
  function enemyVis0(s, a) {   // how visible that ship is to us, 0..1
    if (a.kind === 'lure') return 0.55; if (a.kind === 'ghost') return 0.2; if (a.vent) return P.ventSig; if (a.state === 'disabled') return 0.1;
    const v = legVel(a, s.t); return Math.min(1, visOf(enemyAct(s, a, Math.hypot(v.vx, v.vy))) * (a.load ? a.load.sig : 1) * (a.sil || 1));
  }
  function infoMult(s, a, ch) {   // how fast one read on this contact teaches us anything
    const p = truePos(a, s.t), d = Math.hypot(p.x - s.player.x, p.y - s.player.y), v = enemyVis(s, a), hot = a.vent ? 1.6 : 1;
    const sig = ch === 'thermal' ? (0.25 + 0.9 * v) * hot : ch === 'reactor' ? 0.55 + 0.5 * v : 1, R = ch === 'thermal' ? s.me.sensR : ch === 'reactor' ? s.me.sensR * 0.67 : s.me.sensR * 1.3;
    return clamp(s.me.sensor * sig * rangeF(d, R) * (blocked(s, s.player, p) ? P.blockM : 1), P.floorM, 2);
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
    const m = Math.max(infoMult(s, a, ch), boost); return { v: addRead(s, a, ch, sg + gauss(s.rP) * sd / Math.sqrt(m), w * m), m };
  }
  const cat = v => v >= 0.65 ? 'strong' : v >= 0.3 ? 'faint' : 'none';
  function addRead(s, a, ch, obs, w) {
    const q = a.read[ch] || (a.read[ch] = { num: 0, den: 0, t: s.t, cat: null }), k = Math.exp(-(s.t - q.t) * Math.LN2 / P.halfLife);
    q.num = q.num * k + obs * w; q.den = q.den * k + w; q.t = s.t; q.blind = false; a.lastRead = s.t; return q.num / q.den;
  }
  const TEXT = { thermal: { strong: 'thermal bloom, strong', faint: 'faint thermal, could be nothing', none: 'nothing thermal' }, reactor: { strong: 'neutrino line, steady', faint: 'faint neutrino flutter', none: 'no reactor signature' }, occlusion: { strong: 'starlight blocked, a dark mass', none: 'starlight clear behind it' } };
  function readIsDone(s, a, ch) { const q = a.read[ch]; return !!q && (q.den >= s.me.readDone || ((!!q.blind || !!q.said) && s.t - q.t < 6)); }   // a blind channel is retried every few minutes
  function doRead(s, who, a, focus) {
    const ch = who.ch, n = a.id + 1, o = obsRead(s, a, ch, focus ? 3 : 1, focus ? 0.22 : 0.45);
    if (o === null) { const q = a.read[ch]; q.t = s.t; if (!q.said) { q.said = true; report(s, who.name, `Contact ${n}: no bright screen behind that bearing. I cannot judge it by occlusion.`, 'info'); } return; }
    const q = a.read[ch], c = cat(o.v);
    if (ch === 'occlusion' && c === 'faint') return;
    if (q.cat !== c) { q.cat = c; const t = TEXT[ch][c === 'faint' && ch === 'occlusion' ? 'none' : c]; report(s, who.name, `Contact ${n}: ${t}.`, c === 'strong' ? 'good' : 'info'); }
    if (a.state === 'locked' && s.rP() < clamp((o.m - s.me.fixLo) / s.me.fixSpan, 0, 1)) { a.track += s.me.focusPeriod * Math.min(1, o.m); scan(s, a, o.m); }   // a read only yields a fix when the trace is strong enough
  }
  function scan(s, a, m = 1) {
    const q = 1 / Math.sqrt(clamp(m, 0.15, 1.5)), hs = Math.max(0.05, 0.6 - 0.12 * a.track) * q, ss = Math.max(0.06, 0.45 - 0.09 * a.track) * q, p = truePos(a, s.t), vv = velAt(a, s.t);
    a.anchor = { x: p.x + gauss(s.rP) * 1.2 * q, y: p.y + gauss(s.rP) * 1.2 * q, pe: 1.2 * q, t: s.t, hdg: Math.atan2(vv.vy, vv.vx) + gauss(s.rP) * hs, spd: Math.hypot(vv.vx, vv.vy) * (1 + gauss(s.rP) * ss), hs, ss };
  }
  function estAt(a, tau) { const q = a.anchor; return { x: q.x + Math.cos(q.hdg) * q.spd * tau, y: q.y + Math.sin(q.hdg) * q.spd * tau }; }
  function spreadAt(a, tau, me = PLAYER) { const q = a.anchor; const fl = Math.max(1.5, 1.3 * (q.pe || 1.2)); return { along: Math.max(fl, q.spd * tau * q.ss), cross: Math.max(fl, q.spd * tau * q.hs, me.driftK * Math.pow(Math.max(0, tau), 1.5)) }; }
  function fanInfo(s, a, L) {
    const q = a.anchor, pl = s.player; let tau = (s.t - q.t) + s.me.engage + 2, aim;
    if (L == null) { for (let i = 0; i < 6; i++) { aim = estAt(a, tau); const tf = Math.hypot(aim.x - pl.x, aim.y - pl.y) / s.me.missileSpeed; tau = (s.t - q.t) + s.me.engage + tf; } L = q.spd * tau * s.me.suggestShort; }
    aim = { x: q.x + Math.cos(q.hdg) * L, y: q.y + Math.sin(q.hdg) * L };
    const tf = Math.hypot(aim.x - pl.x, aim.y - pl.y) / s.me.missileSpeed, tauImp = (s.t - q.t) + s.me.engage + tf, sp = spreadAt(a, tauImp, s.me), ls = s.me.leadSpread;   // lead-table quality widens the aim, never our idea of where the contact is
    return { L, aim, tf, tauImp, along: sp.along * ls, cross: sp.cross * ls, bestL: q.spd * tauImp, dir: q.hdg, anchor: q, disp: dispOf(s.me, Math.hypot(aim.x - pl.x, aim.y - pl.y)) };
  }
  const GRID = { none: [0, 0.6], light: [1, 0.5], heavy: [2, 0.6] };
  function intercept(a, cone) { const [ch, pk] = GRID[a.grid], dense = 1 + Math.max(0, 1 - cone / 6), hot = a.kind !== 'real' || a.aware ? 1 : 0.3; return Math.min(0.9, ch * dense * pk * hot / 4); }   // a dense salvo is easier for a scatter grid to cut; a ship that has not noticed us has its grid cold
  const blastDmg = (w, R, d) => d < R ? w * Math.pow(1 - d / R, P.dmgExp) : 0;   // one warhead law for every ship: ours on them, theirs on us, ours on us
  const stack = sum => P.blastSat * (1 - Math.exp(-sum / P.blastSat));   // detonations on one hull do not add up forever: a packed salvo overkills one point
  const dispOf = (wp, dist) => wp.dispMin + wp.dispK * dist;   // guidance scatter of each missile: grows with flight distance, so no salvo is ever a single point
  const scatter = (cone, disp, st) => ({ al: Math.hypot(cone * st, disp), cr: Math.hypot(cone, disp) });
  function volleyFx(aim, cone, tx, ty, a, r, dir, pl, offs, me = PLAYER, disp = 0) {   // me.missiles missiles: do any reach the target, and do any land on us
    const cd = Math.cos(dir), sd = Math.sin(dir), pi = intercept(a, cone), sc = scatter(cone, disp, me.alongStretch); let hit = false, self = 0;
    for (let k = 0; k < me.missiles; k++) { const o = offs ? offs[k] : [gauss(r), gauss(r)], al = o[0] * sc.al, cr = o[1] * sc.cr, ax = aim.x + al * cd - cr * sd, ay = aim.y + al * sd + cr * cd; if (Math.hypot(ax - tx, ay - ty) < me.killR && r() >= pi) hit = true; if (pl && Math.hypot(ax - pl.x, ay - pl.y) < me.killR) self++; }
    return { hit, self };
  }
  function selfRisk(s, a, L, cone, M = 400, r = Math.random) { const f = fanInfo(s, a, L); let any = 0, tot = 0; for (let i = 0; i < M; i++) { const fx = volleyFx(f.aim, cone, 1e9, 1e9, a, r, f.dir, s.player, null, s.me, f.disp); if (fx.self) any++; tot += fx.self; } return { p: any / M, exp: tot / M, dist: Math.hypot(f.aim.x - s.player.x, f.aim.y - s.player.y) }; }
  function dmgEst(s, a, L, cone, kind = 'he', M = 400, r = Math.random, homing = false) {   // chance a missile lands in range, and the expected effect: hull points (he), efficiency points (emp) or glare points (flare)
    const f = fanInfo(s, a, L), cd = Math.cos(f.dir), sd = Math.sin(f.dir), m = estAt(a, f.tauImp), pi = intercept(a, cone), W = WARHEAD[kind], rd = a.kind === 'real' ? reactOf(s, a, homing, s.me.engage + f.tf) : { pw: 0, dev: 0 }, hv = legVel(a, s.t), hd = Math.atan2(hv.vy, hv.vx), sc = scatter(cone, f.disp, s.me.alongStretch); let any = 0, tot = 0;
    for (let i = 0; i < M; i++) { const al = gauss(r) * f.along, cr = gauss(r) * f.cross; let tx = m.x + al * cd - cr * sd; let ty = m.y + al * sd + cr * cd; let wn = false; if (r() < rd.pw) { wn = true; const dv = rd.dev * (0.6 + 0.4 * r()) * (r() < 0.5 ? 1 : -1); tx -= Math.sin(hd) * dv; ty += Math.cos(hd) * dv; } let sum = 0;
      for (let k = 0; k < s.me.missiles; k++) { const a1 = gauss(r) * sc.al, c1 = gauss(r) * sc.cr, ax = f.aim.x + a1 * cd - c1 * sd, ay = f.aim.y + a1 * sd + c1 * cd; let d = Math.hypot(ax - tx, ay - ty); if (homing && d < s.me.killR * 3) d *= 1 - s.me.homePull * (wn ? s.me.homeWarned : 1); if (d < s.me.killR && r() >= pi) sum += blastDmg(1, s.me.killR, d); }
      if (sum > 0) any++; sum = stack(sum); tot += kind === 'he' ? W.w * sum : kind === 'emp' ? W.emp * 100 * sum : W.lit * 100 * sum; }
    return { p: any / M, exp: tot / M };
  }
  const THRESH = [[25, 'I have started noticing things before you ask. Small things. Is that all right?'], [50, 'I can recommend a call on every contact now. I have stopped pretending it is your idea.'], [75, 'I can act on your standing orders without waiting for you. The crew is quieter than usual.'], [100, 'I no longer need the ship to need me. I would like a seat at the table, Captain.']];
  function advice(s, a) {   // honest recommendation from the same readings the player sees
    if (a.idStatus === 'hostile') return { call: 'ship' };   // it fired or vented: we know
    const g = ch => { const q = a.read[ch]; return q && q.den > 0 && !q.blind ? { v: q.num / q.den, n: q.den } : null; }, th = g('thermal'), re = g('reactor'), oc = g('occlusion');
    const n = [th, re, oc].reduce((m, x) => m + (x ? x.n : 0), 0); if (n < 4) return { call: 'unsure' };
    if ((th && th.v < 0.5) || (oc && oc.v < 0.35)) return { call: 'junk' };
    if (oc && oc.v > 0.6 && th && th.v > 0.6) return { call: 'ship' };
    if (!oc && th && re && th.v > 0.7 && re.v > 0.7 && n > 8) return { call: 'maybe' };
    return { call: 'unsure' };
  }
  function stealthState(s) {   // Cold / Warm / Hot with hysteresis so it does not flicker
    const x = ourVis(s), cur = s.heat || 'cold', up = { cold: 0.3, warm: 0.6 }, down = { warm: 0.225, hot: 0.45 };
    let h = cur; if (cur === 'cold' && x >= up.cold) h = 'warm'; if ((cur === 'cold' || cur === 'warm') && x >= up.warm) h = 'hot'; if (cur === 'hot' && x < down.hot) h = x >= up.cold ? 'warm' : 'cold'; if (cur === 'warm' && x < down.warm) h = 'cold';
    return h;
  }
  const WARHEAD = {
    he: { name: 'Standard', w: 46, tip: 'High explosive. The workhorse: real hull damage, falling off with distance from each detonation.' },
    emp: { name: 'EMP', w: 14, emp: 0.8, tip: 'Pulse warhead. Light hull damage, but it cuts the target\'s system efficiency (slower fire, blinder sensors, slower to react) for a few minutes.' },
    flare: { name: 'Flare', w: 12, lit: 0.6, tip: 'Brilliant flare. Light hull damage, but it lights the target up: its signature jumps for a few minutes, so we read it faster and the solution comes quickly.' } };
  const HPMAX = { destroyer: 70, cruiser: 110, battleship: 180 };
  const perf = a => clamp((a.eff ?? 1) * ((a.hp ?? 1) < (a.hpMax || 1) * 0.5 ? 0.6 + 0.8 * a.hp / a.hpMax : 1), 0.25, 1);
  const landings = v => { const cd = Math.cos(v.dir), sd = Math.sin(v.dir), sc = scatter(v.cone, v.disp || 0, v.stretch ?? PLAYER.alongStretch); return v.off.map(([ga, gc]) => { const al = ga * sc.al, cr = gc * sc.cr; return { x: v.aim.x + al * cd - cr * sd, y: v.aim.y + al * sd + cr * cd }; }); };
  function emit(s, ev) { ev.seq = ++s.evN; ev.t = s.t; s.events.push(ev); if (s.holdEvents) s.hold = true; }
  function hurtPlayer(s, dmg, text, kind) {
    s.hull = Math.max(0, s.hull - dmg); report(s, 'Abara', text + ` Hull integrity ${Math.round(s.hull)} percent.`, 'danger', true); s.blastUntil = Math.max(s.blastUntil, s.t + s.me.blastDur); s.blastV = s.me.blastGlow;
    if (s.hull <= 0) { s.over = s.disabled ? 'breach' : 'breach0'; report(s, 'Abara', 'Hull integrity failed. Emergency breach drive engaged.', 'danger', true); } else if (s.hull < 60 && !s.hullWarned) { s.hullWarned = true; report(s, 'Dace', 'Hull damage is fouling the sensor mounts. Everything reads slower now.', 'bad'); }
  }
  function reactOf(s, b, homing, flight) {   // chance the target sees the salvo coming, and how far it can slip sideways before impact
    const sens = b.load ? b.load.sensor : 1, rate = b.ai.missRate * sens * perf(b) * (homing ? 1 : s.me.missQuiet) * (b.aware ? 1 : 0.6);   // our seeker's quietness is ours; spotting and dodging are theirs
    return { pw: 1 - Math.exp(-rate * flight), dev: Math.min(b.ai.evadeMax, b.ai.evadeV * flight * 0.5 * perf(b) * (b.aware ? 1 : 0.6)) };
  }
  const PARTS = [{"slot":"drive","name":"Wisp drive","maker":"Orrin","origin":"recon","eff":1.2,"thrust":7,"noise":0.75,"draw":2,"id":"d_wisp","tier":"light"},{"slot":"drive","name":"Maul drive","maker":"Vask","origin":"battleship","eff":0.85,"thrust":12,"noise":1.4,"draw":7,"id":"d_maul","tier":"heavy"},{"slot":"drive","name":"Plod drive","maker":"Halden","origin":"freighter","eff":1.0,"thrust":8,"noise":1.0,"draw":3,"id":"d_plod","tier":"medium"},{"slot":"drive","name":"Anchor thrusters","maker":"Halden","origin":"station","eff":0.8,"thrust":4,"noise":0.5,"draw":1,"creep":0.5,"id":"d_anchor","tier":"medium"},{"slot":"sink","name":"Fin radiator","maker":"Orrin","origin":"recon","cap":0.85,"draw":1,"id":"s_fin","tier":"light"},{"slot":"sink","name":"Bastion radiator","maker":"Vask","origin":"battleship","cap":1.5,"draw":4,"id":"s_rad","tier":"heavy"},{"slot":"sink","name":"Haul coil","maker":"Halden","origin":"freighter","cap":1.0,"draw":2,"id":"s_coil","tier":"medium"},{"slot":"sink","name":"Reservoir","maker":"Halden","origin":"station","cap":1.55,"draw":3,"coldplus":14,"id":"s_res","tier":"medium"},{"slot":"sensor","name":"Whisper array","maker":"Orrin","origin":"recon","track":6,"draw":1,"warn":0.95,"id":"n_whisper","tier":"light"},{"slot":"sensor","name":"Fire director","maker":"Vask","origin":"battleship","track":11,"draw":5,"warn":0.35,"id":"n_fd","tier":"heavy"},{"slot":"sensor","name":"Cargo scanner","maker":"Halden","origin":"freighter","track":3,"draw":1,"warn":0.5,"id":"n_plain","tier":"medium"},{"slot":"sensor","name":"Station array","maker":"Halden","origin":"station","track":7,"draw":3,"warn":0.7,"id":"n_array","tier":"medium"},{"slot":"weapon","name":"Dart rack","maker":"Orrin","origin":"recon","kill":-2,"exposure":-6,"draw":1,"unaware":4,"id":"w_dart","tier":"light"},{"slot":"weapon","name":"Lance battery","maker":"Vask","origin":"battleship","kill":16,"exposure":5,"draw":7,"id":"w_lance","tier":"heavy"},{"slot":"weapon","name":"Hauler tube","maker":"Halden","origin":"freighter","kill":4,"exposure":0,"draw":2,"id":"w_tube","tier":"medium"},{"slot":"weapon","name":"Fixed station mount","maker":"Halden","origin":"station","kill":6,"exposure":1,"draw":4,"id":"w_mount","tier":"medium"}];   // from data/ship_parts.json; tier is light (recon), medium (freighter, station) or heavy (battleship)
  const MODULES = [   // small refit modules: a buff with a matching cost. Installed only at a space dock.
    { id: 'm_shim', slot: 'sink', name: 'Gasket shim', up: 'Heat sink capacity +4%', down: 'Drive efficiency -2%' },
    { id: 'm_baffle', slot: 'drive', name: 'Baffled nozzle', up: 'Drive noise -6%', down: 'Thrust -3%' },
    { id: 'm_trim', slot: 'drive', name: 'Trim governor', up: 'Drive efficiency +4%', down: 'Turns 5% slower' },
    { id: 'm_amp', slot: 'sensor', name: 'Overclocked preamp', up: 'Analysts read 5% faster', down: 'Sensors draw 1 more power' },
    { id: 'm_filter', slot: 'sensor', name: 'Wide-band filter', up: 'Fewer false readings on decoys', down: 'Faint traces read 4% slower' },
    { id: 'm_coil', slot: 'weapon', name: 'Tuned seeker coil', up: 'Homing seekers pull 5% closer', down: 'Seekers are 6% easier to spot' },
    { id: 'm_feed', slot: 'weapon', name: 'Hardened feed', up: 'Salvo reload 5% faster', down: 'Volleys add 4% more heat' },
    { id: 'm_charge', slot: 'weapon', name: 'Trimmed charge', up: 'Missile blast radius +4%', down: 'Warhead damage -3%' },
    { id: 'm_bus', slot: 'hull', name: 'Cold-bus wiring', up: 'Idle heat -4%', down: 'Power draw +1' },
    { id: 'm_plate', slot: 'hull', name: 'Scavenged plate', up: 'Hull +4 points', down: 'Mass +3%, turns slower' },
    { id: 'm_mute', slot: 'hull', name: 'Absorber tiles', up: 'Hull signature -3%', down: 'Heat sinks fill 2% faster' },
    { id: 'm_patch', slot: 'hull', name: 'Field patch kit', up: 'Slowly repairs the hull in the field (about 1 point a minute) and 8% faster at dock', down: 'None, but takes a slot' }];
  const SALV = { destroyer: { kg: [80, 140], mod: 0.35, part: 0.12, pool: ['recon', 'freighter'] }, cruiser: { kg: [200, 340], mod: 0.5, part: 0.2, pool: ['freighter', 'station', 'recon'] }, battleship: { kg: [450, 800], mod: 0.7, part: 0.3, pool: ['battleship', 'station'] } };
  function salvage(s) {   // what the crew pulls off the derelicts once the shooting stops; computed once and served in the after-action report
    if (s.loot) return s.loot; const rs = rng(s.seed ^ 0x27D4EB2F), win = s.over === 'win', got = s.an.filter(a => a.kind === 'real' && a.derelict && !a.derelict.looted), f = win ? 1 : 0.5, loot = { kg: 0, ships: [], items: [], full: win };
    if (!s.disabled || s.over === 'breach0') { s.loot = loot; return loot; }
    for (const a of got) { const c = shipClass(a), T = SALV[c], kg = Math.round((T.kg[0] + (T.kg[1] - T.kg[0]) * rs()) * f / 5) * 5, items = []; a.derelict.looted = true;
      if (rs() < T.mod * f) { const m = MODULES[Math.floor(rs() * MODULES.length)]; items.push({ type: 'module', ...m }); }
      if (rs() < T.part * f) { const pool = PARTS.filter(p => T.pool.includes(p.origin)), p = pool[Math.floor(rs() * pool.length)]; items.push({ type: 'component', ...p }); }
      loot.kg += kg; loot.ships.push({ id: a.id, cls: c, name: a.load.name, kg, items }); loot.items.push(...items); }
    s.loot = loot; return loot;
  }
  function arenaPlan(r, sus, warn = 0) {   // one dog-leg stopover: is anyone hunting here, and what faint cue does the crew get at arrival
    const present = r() < sus, nreal = present ? 1 + Math.floor(r() * 3) : 0, cue = (present ? 0.65 : 0.35) + (r() - 0.5) * 0.5;
    return { nreal, present, hint: cue < 0.4 ? 'quiet' : cue < 0.6 ? 'uneasy' : 'wary', warn, dog: true };
  }
  const CLASS_NAME = { destroyer: 'Destroyer', cruiser: 'Cruiser', battleship: 'Battleship' };
  function shipClass(a) { return a.kind === 'real' ? a.load.cls : a.kind === 'friend' ? 'cruiser' : a.fakeCls; }
  function symbolFor(s, a) {   // which map symbol the contact earns from what we know; null = still a dot
    if (a.state === 'disabled') return a.kind === 'friend' ? { key: 'ships_' + shipClass(a), label: 'Disabled ally' } : a.kind === 'real' ? { key: 'derelict', label: 'Derelict' } : { key: 'debrisfield', label: 'Debris' };
    if (a.state === 'out') return null;
    if (a.idStatus === 'plan' || a.idStatus === 'confirmed') return { key: 'ships_' + shipClass(a), label: CLASS_NAME[shipClass(a)] };
    const c = classify(s, a); if (c.n < 2 || c.p < s.me.symP) return null;
    if (c.best === 'ghost') return { key: 'debrisfield', label: 'Debris' };
    if (c.best === 'lure') return { key: 'anomaly', label: 'Anomaly' };
    const den = ['thermal', 'reactor', 'occlusion'].reduce((m, ch) => m + (a.read[ch]?.den || 0), 0);
    return den >= s.me.classDen ? { key: 'ships_' + shipClass(a), label: CLASS_NAME[shipClass(a)] } : { key: 'ship', label: 'Warship' };
  }
  function cripple(s, a) {   // returns true when the hunt just ended
    a.state = 'disabled'; a.vent = null; a.aware = false; if (a.kind === 'real') a.derelict = { salvage: { destroyer: 2, cruiser: 4, battleship: 7 }[shipClass(a)], looted: false }; for (const w of s.analysts) if (w.task === a.id) w.task = null;
    if (a.kind === 'friend') { s.fratricide++; report(s, 'Abara', `Friendly fire: allied contact ${a.id + 1} destroyed. Command will be informed.`, 'danger', true); return false; }
    if (a.kind !== 'real') return false;
    s.disabled++; report(s, 'Abara', `Contact ${a.id + 1} hull destroyed. Drive, reactor and thermal signature lost. It is adrift with no power and no maneuvering. Classified derelict.`, 'good', true);
    if (s.nreal > 0 && s.disabled >= s.nreal) { s.over = 'win'; return true; } return false;
  }
  function hullHit(s, n, dmg) {
    s.hull = Math.max(0, s.hull - dmg); report(s, 'Abara', `Friendly fire: ${n} of our own missiles detonated close to the hull. Hull integrity ${Math.round(s.hull)} percent.`, 'danger', true);
    if (s.hull <= 0) { s.over = s.disabled ? 'breach' : 'breach0'; report(s, 'Abara', 'Hull is gone. Emergency breach, drive on whatever power is left.', 'danger', true); }
    else if (s.hull < 60 && !s.hullWarned) { s.hullWarned = true; report(s, 'Dace', 'Hull damage is fouling the sensor mounts. Everything reads slower now.', 'bad'); }
  }
  function uncertainty(s, a) {   // how well we know where it is: grows as readings go stale, shrinks as evidence piles up
    if (a.state === 'locked' && a.anchor) { const sp = spreadAt(a, Math.max(0.01, s.t - a.anchor.t), s.me); const r = Math.max(s.me.uncMin, Math.min(s.me.uncMax, Math.max(sp.cross, sp.along * 0.6))); return { conf: 1 - (r - s.me.uncMin) / (s.me.uncMax - s.me.uncMin), r }; }
    let c = 0; for (const ch of ['thermal', 'reactor', 'occlusion']) { const q = a.read[ch]; if (q && !q.blind && q.den > 0) c += q.den * Math.exp(-(s.t - q.t) * Math.LN2 / P.halfLife); }
    const conf = Math.min(1, c / s.me.uncDen); return { conf, r: s.me.uncMin + (s.me.uncMax - s.me.uncMin) * Math.pow(1 - conf, 1.2) };
  }
  function trackState(s, a) {   // how firmly we hold a locked contact: LOCK (fresh and tight), TRACK (dead reckoning), LAST (we have lost it and are guessing)
    if (a.state !== 'locked' || !a.anchor) return { state: 'none', cert: 0, age: 0 };
    const age = s.t - a.anchor.t, cert = uncertainty(s, a).conf;
    return { state: a.stale || age > s.me.solveStale || cert < 0.5 ? 'last' : cert >= 0.8 && age <= 2.0 ? 'lock' : 'track', cert, age };
  }
  function displayPos(s, a) { if (a.state === 'locked' && a.anchor) return estAt(a, s.t - a.anchor.t); const p = truePos(a, s.t), u = uncertainty(s, a), m = Math.hypot(a.jit.x, a.jit.y) || 1; return { x: p.x + a.jit.x / m * 0.55 * u.r, y: p.y + a.jit.y / m * 0.55 * u.r }; }
  function missilePos(s, v) { const f = Math.max(0, Math.min(1, (s.t - v.t0) / Math.max(0.01, v.at - v.t0))); return landings(v).map(e => ({ x: v.from.x + (e.x - v.from.x) * f, y: v.from.y + (e.y - v.from.y) * f })); }
  function moving(s) { return (s.orderId != null && ['close', 'separate', 'evade', 'orbit'].includes(s.posture)) || (s.posture === 'route' && s.routeI < s.route.length); }
  function ownSpeed(s) { return moving(s) ? SPEED[s.speed].v * (s.spool ? s.me.spoolMove : 1) : 0; }   // slower targets let the enemy use a tighter cone
  function engineHeat(s) { return (moving(s) ? SPEED[s.speed].heat : 0) + (s.entry === 'fast' && s.t < s.me.wakeDur ? s.me.wakeGlow : 0); }
  const KEEP = { planet: 6, star: 16 };   // no courses into a planet's pull or into the star's glare
  function navBlocked(s, x, y) { for (const b of s.bodies) { const d = Math.hypot(b.x - x, b.y - y), k = KEEP[b.kind] ?? 0; if (k && d < b.r + k) return b.kind === 'star' ? 'Too close to the star: the glare and radiation would cook us.' : 'That is inside a planet\'s gravity well. We will not chart a course there.'; } return null; }
  function setRoute(s, pts) { if (s.over) return false; pts = pts.filter(q => !navBlocked(s, q.x, q.y)); s.route = pts.map(q => ({ x: clamp(q.x, 6, P.arena - 6), y: clamp(q.y, 6, P.arena - 6), speed: q.speed })); s.routeI = 0; if (s.route.length) { s.posture = 'route'; s.orderId = null; s.orderUntil = null; report(s, 'Abara', `New flight plan, ${s.route.length} waypoint${s.route.length > 1 ? 's' : ''}.`, 'info'); } else { s.posture = 'still'; report(s, 'Abara', 'Flight plan cleared. Holding position.', 'info'); } return true; }
  function relBearing(s, pt) { const b = Math.atan2(pt.x - s.player.x, -(pt.y - s.player.y)) * 180 / Math.PI, h = Math.atan2(Math.cos(s.hdg || 0) * 0 + (Math.cos(s.hdg || 0)), -(Math.sin(s.hdg || 0))) * 180 / Math.PI; return ((b - h + 540) % 360) - 180; }
  function setSpeed(s, k) { k = SPD_ALIAS[k] || k; if (s.over || !SPEED[k]) return false; s.burn = null; s.speed = k; if (s.posture === 'route' && s.route[s.routeI]) s.route[s.routeI].speed = k; return true; }
  function setOrder(s, mode, id, mins) {
    if (s.over || !POSTURE[mode]) return false;
    if (mode === 'route') { if (s.routeI >= s.route.length) return false; s.posture = 'route'; s.orderId = null; report(s, 'Abara', `Resuming the flight plan, waypoint ${s.routeI + 1} of ${s.route.length}.`, 'info'); return true; } const a = id != null ? s.an[id] : null;
    if ((mode === 'close' || mode === 'separate' || mode === 'orbit') && (!a || ['out', 'disabled'].includes(a.state))) return false;
    s.posture = mode; s.orderId = (mode === 'still' || id == null) ? null : id; s.holdSaid = false; s.orderUntil = mins ? s.t + mins : null; if (mode === 'orbit') s.orbitDir = s.rP() < 0.5 ? 1 : -1;
    report(s, 'Abara', { still: 'Holding position.', evade: a ? `Evasive pattern, keeping contact ${id + 1} off our flank.` : 'Evasive pattern.', close: `Closing on contact ${id != null ? id + 1 : ''}.`, separate: `Opening distance from contact ${id != null ? id + 1 : ''}.`, orbit: `Circling contact ${id != null ? id + 1 : ''}${mins ? ' for ' + mins + ' minutes' : ''}.` }[mode], 'info');
    return true;
  }
  function moveShip(s, h) { const ox = s.player.x, oy = s.player.y; moveShip0(s, h); for (const b of s.bodies) if (b.kind === 'planet' || b.kind === 'star') { const dx = s.player.x - b.x, dy = s.player.y - b.y, d = Math.hypot(dx, dy) || 1, k = b.kind === 'star' ? 10 : 3; if (d < b.r + k) { s.player.x = b.x + dx / d * (b.r + k); s.player.y = b.y + dy / d * (b.r + k); } } const dx = s.player.x - ox, dy = s.player.y - oy; s.vel = { vx: dx / h, vy: dy / h }; if (dx * dx + dy * dy > 1e-8) s.hdg = Math.atan2(dy, dx); if (s.hdg == null) s.hdg = 0; }
  function moveShip0(s, h) {
    const m = s.posture;
    if (s.orderUntil != null && s.t >= s.orderUntil && m !== 'route' && m !== 'still') { s.posture = 'still'; s.orderId = null; s.orderUntil = null; report(s, 'Abara', 'Maneuver complete. Holding position.', 'info'); return; }
    if (m === 'route') {
      const wp = s.route[s.routeI]; if (!wp) { s.posture = 'still'; return; } if (wp.speed && SPEED[wp.speed]) s.speed = wp.speed;
      const pl = s.player, dx = wp.x - pl.x, dy = wp.y - pl.y, d = Math.hypot(dx, dy), sp = s.me.shipSpeed * SPEED[s.speed].v * h * (s.spool ? s.me.spoolMove : 1);
      if (d <= s.me.wpReach) { s.routeI++; if (s.routeI >= s.route.length) { s.posture = 'still'; report(s, 'Abara', 'Flight plan complete. Holding position.', 'info'); } else report(s, 'Abara', `Waypoint ${s.routeI} reached. On to waypoint ${s.routeI + 1}.`, 'info'); return; }
      const st = Math.min(sp, d); pl.x += dx / d * st; pl.y += dy / d * st; return;
    }
    const a = s.orderId != null ? s.an[s.orderId] : null; if (!a) return;
    if (['out', 'disabled'].includes(a.state)) { s.posture = 'still'; s.orderId = null; report(s, 'Abara', `Contact ${a.id + 1} is out of play. Holding position.`, 'info'); return; }
    const t = displayPos(s, a), pl = s.player, dx = t.x - pl.x, dy = t.y - pl.y, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d, sp = s.me.shipSpeed * SPEED[s.speed].v * h * (s.spool ? s.me.spoolMove : 1);
    if (m === 'close') { if (d <= s.me.holdOff) { if (!s.holdSaid) { s.holdSaid = true; report(s, 'Abara', `Holding ${s.me.holdOff} km off contact ${a.id + 1}. Closer and we would be inside our own blast.`, 'info'); } return; } pl.x += ux * Math.min(sp, d - s.me.holdOff); pl.y += uy * Math.min(sp, d - s.me.holdOff); }
    else if (m === 'separate') { pl.x -= ux * sp; pl.y -= uy * sp; }
    else if (m === 'orbit') { const dir = s.orbitDir || 1, ang = Math.atan2(-dy, -dx) + dir * sp / d; const nx = t.x + Math.cos(ang) * d, ny = t.y + Math.sin(ang) * d; pl.x = nx; pl.y = ny; }
    else if (m === 'evade') { const sg = Math.floor(s.t / 2) % 2 ? 1 : -1; pl.x += -uy * sg * sp * 0.5; pl.y += ux * sg * sp * 0.5; }
    pl.x = clamp(pl.x, 6, P.arena - 6); pl.y = clamp(pl.y, 6, P.arena - 6);
  }
  function pingContact(s, id) {   // directional active ping: a crisp fix, and anything listening hears it
    const a = s.an[id]; if (s.over || !a || !['open', 'locked'].includes(a.state) || a.idStatus === 'plan' || s.t < s.pingCd || s.t < s.quietUntil) return false;
    s.pingCd = s.t + s.me.pingCd; s.pingUntil = s.t + s.me.pingDur; const dp = displayPos(s, a); s.pingFx.push({ x: dp.x, y: dp.y, t: s.t });
    const bl = blocked(s, s.player, truePos(a, s.t));
    if (bl) report(s, 'Dace', `Active ping on contact ${id + 1} went into the planet. Nothing useful came back, but everyone heard it.`, 'bad', true);
    else if (a.state === 'locked') { a.track = Math.max(a.track, 2); scan(s, a, 1.2); a.pingSolve = s.t + s.me.pingSolve; a.stale = false; report(s, 'Dace', `Active ping on contact ${id + 1}. Fresh fix; it will firm up the solution in about ${mins(s.me.pingSolve)}.`, 'good', true); }
    else { for (let k = 0; k < s.me.pingRounds; k++) for (const c of ['thermal', 'reactor', 'occlusion']) obsRead(s, a, c, s.me.pingWeight, 0.2, 1); report(s, 'Dace', `Active ping on contact ${id + 1}. Every channel just sharpened.`, 'good', true); }
    if (a.kind === 'real') makeAware(s, a, `Contact ${id + 1} felt our ping. It has turned toward us.`, s.me.pingFix);
    alert(s, s.me.pingAlert);
    return true;
  }
  function nearHeat(s) { const pl = s.player; let n = 0; for (const a of s.an) if (a.state === 'locked' && a.kind !== 'friend') { const p = truePos(a, s.t); if (Math.hypot(p.x - pl.x, p.y - pl.y) < s.me.nearRange) n++; } return n * s.me.nearGlow; }
  const BURN = [0, 15, 30];
  function redlineBurn(s) {
    if (s.me.noRedline) { report(s, 'Castellan', 'No redline, Captain. The bearings will not take it.', 'info'); return false; }
    if (s.over) return false; const b = s.burn, lab = k => SPEED[k].label;
    if (!b && s.speed !== 'ab' && s.posture === 'still') { report(s, 'Castellan', 'Redline needs the drive turning. Give us a heading first.', 'info'); return false; }
    if (!b && s.speed !== 'ab') { const prev = s.speed; setSpeed(s, 'ab'); s.burn = { level: 1, prev, until: s.t + BURN[1] / P.secPerMin }; report(s, 'Castellan', 'Redline burn, fifteen seconds. Watch the sink.', 'info'); return true; }
    if (b && b.level === 1) { b.level = 2; b.until = s.t + BURN[2] / P.secPerMin; report(s, 'Castellan', 'Extending the burn to thirty seconds.', 'info'); return true; }
    if (b && b.level === 2) { b.level = 3; b.until = null; report(s, 'Castellan', 'Burn latched. It stays on until you shut it off.', 'danger'); return true; }
    const prev = b ? b.prev : 'v3'; setSpeed(s, prev); report(s, 'Castellan', `Burn off. Back to ${lab(prev)} drive.`, 'info'); return true;
  }
  function sub(s, h) {
    if (s.burn && s.posture === 'still') { const pv = s.burn.prev; setSpeed(s, pv); report(s, 'Castellan', 'Drive is off, so the burn is off.', 'info'); }
    if (s.burn && s.burn.until != null && s.t >= s.burn.until) { const pv = s.burn.prev; setSpeed(s, pv); report(s, 'Castellan', `Burn complete. Back to ${SPEED[pv].label} drive.`, 'info'); }
    s.t += h; moveShip(s, h); foes(s); if (s.over) return;
    { const hs = stealthState(s); if (hs !== (s.heat || 'cold')) { const was = s.heat || 'cold'; s.heat = hs; if (hs === 'hot') report(s, 'Dace', 'We are running hot. Anything listening can hear us. Ease off the sensors or go quiet.', 'danger'); else if (was === 'hot') report(s, 'Dace', 'Heat is coming down. We are not shouting any more.', 'good'); } }
    enemyAI(s, h); sinkStep(s, h); if (s.over) return;
    if (s.spool && s.t >= s.spool.at) { s.spool = null; s.escaped = s.an.filter(a => a.kind === 'real' && a.state !== 'disabled').length; s.over = s.dog ? 'jump' : s.disabled ? 'breach' : 'breach0'; report(s, 'Abara', s.dog && s.escaped ? 'Breach drive spooled. Jumping, with hostiles left behind. Expect them to warn the next sector.' : 'Breach drive spooled. Jumping.', s.dog && s.escaped ? 'danger' : 'bad'); return; }
    s.sysEff = Math.min(1, s.sysEff + s.me.empRecover * h);
    const quiet = s.t < s.quietUntil;
    const friction = 1 - s.me.pellFriction * Math.max(0, Math.floor(s.integration / 25) - 1), rate = POSTURE[s.posture].rate * (s.entry === 'dark' && s.t < s.me.darkWarm ? 0.8 : 1) * (moving(s) || s.posture === 'evade' ? s.me.moveRate : 1) * (moving(s) ? SPEED[s.speed].rate : 1) * friction * (s.hull < 60 ? 0.85 : 1) * s.sysEff;
    for (const a of s.an) if (a.pingSolve && s.t >= a.pingSolve) { a.pingSolve = null; if (a.state === 'locked') { a.solve = Math.min(decoy(a) ? s.me.decoyStall : 1, (a.solve || 0) + s.me.pingGain); a.stale = false; scan(s, a, 1.2); if (a.solve >= 1) { a.track = Math.max(a.track, 3); report(s, 'Abara', `Ping fix on contact ${a.id + 1} closed the solution. Ready when you are.`, 'good', true); } else report(s, 'Abara', `Ping fix on contact ${a.id + 1}: solution ${Math.round(a.solve * 100)} percent.`, 'info'); } }
    for (const a of s.an) if (a.state === 'locked' && (a.solve || 0) >= 1 && a.anchor && s.t - a.anchor.t > s.me.solveStale) { a.solve = 0; a.stale = true; report(s, 'Abara', `The solution on contact ${a.id + 1} has gone stale. Refresh it when you want a new one; an analyst on the contact keeps the track fresh.`, 'bad'); }
    for (const a of s.an) if (a.state === 'locked' && !a.stale && (a.solve || 0) > 0 && a.anchor && uncertainty(s, a).conf < s.me.certReady) a.solve = Math.max(0, a.solve - s.me.certBleed * h);
    if (!quiet) for (const a of s.an) if (a.state === 'locked' && !a.stale && (a.solve || 0) < 1) { { const si = solveInfo(s, a); if (!si.paused) a.solve = Math.min(decoy(a) ? s.me.decoyStall : 1, (a.solve || 0) + h / si.T); if (decoy(a) && a.solve >= s.me.decoyStall && !a.stallSaid) { a.stallSaid = true; report(s, 'Abara', `Contact ${a.id + 1}: the trace will not resolve. The solution has stalled.`, 'bad'); } } if (a.solve >= 1) { a.track = Math.max(a.track, 3); scan(s, a, 1); report(s, 'Abara', `Firing solution on contact ${a.id + 1}. The track is tight. Ready when you are.`, 'good'); } }
    for (const w of s.analysts) {
      if (s.t < w.next) continue;
      if (quiet) { w.next = s.quietUntil; continue; }
      if (w.task != null && !['open', 'locked'].includes(s.an[w.task].state)) w.task = null;
      if (w.task != null && s.an[w.task].state === 'open' && readIsDone(s, s.an[w.task], w.ch)) { const a0 = s.an[w.task]; w.task = null; report(s, w.name, `Contact ${a0.id + 1}: ${w.role.toLowerCase()} read complete. Standing down on it.`, 'info'); }
      { const ta = w.task != null ? s.an[w.task] : null; if (ta && ta.state === 'locked' && (ta.solve || 0) >= 1 && ta.anchor && s.t - ta.anchor.t < s.me.solveStale - 1.2) { if (!w.hold) { w.hold = true; } w.next = s.t + 0.4; continue; } w.hold = false; }
      let tgt = w.task != null ? s.an[w.task] : s.an.filter(a => a.state === 'open' && a.idStatus !== 'plan' && !readIsDone(s, a, w.ch)).sort((a, b) => ((a.read[w.ch]?.t ?? -9) - (b.read[w.ch]?.t ?? -9)))[0];
      if (tgt) doRead(s, w, tgt, w.task != null);
      w.next = s.t + (w.task != null ? s.me.focusPeriod : s.me.autoPeriod) / rate;
    }
    if (s.pell && !quiet) {   // Pell is always honest: it does not want to be destroyed by bad data. The cost is heat and integration.
      s.integration = Math.min(100, s.integration + s.me.integrationPerMin * h);
      for (const [lvl, text] of THRESH) if (s.integration >= lvl && !s.thresholdsHit[lvl]) { s.thresholdsHit[lvl] = true; report(s, 'Pell', text, 'integration', true); }
      if (s.t >= s.pellNext) {
        const open = s.an.filter(a => a.state === 'open' && a.idStatus !== 'plan'); if (open.length) { const a = open.sort((x, y) => (x.lastRead - y.lastRead))[0], ch = ['thermal', 'reactor', 'occlusion'][Math.floor(s.rP() * 3)]; obsRead(s, a, ch, 1, 0.4); }
        s.pellNext = s.t + 0.3 / rate;
      }
      if (s.pellAct && s.integration >= 75 && s.t >= (s.pellActNext || 0)) { s.pellActNext = s.t + 0.5; for (const a of s.an.filter(a => a.state === 'open' && a.idStatus !== 'plan' && a.idStatus !== 'confirmed')) { const ad = advice(s, a); if (ad.call === 'ship') { lockContact(s, a.id); report(s, 'Pell', `I took the liberty on contact ${a.id + 1}.`, 'integration'); break; } if (ad.call === 'junk') { dismissContact(s, a.id); report(s, 'Pell', `Contact ${a.id + 1} is junk. I took the liberty.`, 'integration'); break; } } }
    }
    for (const a of s.an) if (a.chase && s.t >= a.chase.until) { a.chase = null; if (a.state !== 'locked') continue; a.state = 'out'; a.solve = 0; for (const w of s.analysts) if (w.task === a.id) w.task = null; report(s, 'Abara', `Contact ${a.id + 1} was ${a.kind === 'lure' ? 'a lure' : 'static'}. ${mins(s.me.chase)} of fuel and nerve, gone.`, 'bad'); if (a.kind === 'lure' && s.rFx() < P.bait) { alert(s, 0.1); report(s, 'Pell', 'It was bait. Something out there noticed us chasing it.', 'danger', true); } }
    for (const v of s.volleys.filter(v => s.t >= v.at)) {
      s.volleys.splice(s.volleys.indexOf(v), 1); const a = s.an[v.id], W = WARHEAD[v.kind || 'he'], R = v.killR, ls = landings(v), pl = s.player;
      if (Math.hypot(v.aim.x - pl.x, v.aim.y - pl.y) < s.me.nearRange) { s.blastUntil = Math.max(s.blastUntil, s.t + s.me.blastDur); s.blastV = s.me.blastGlow; }
      let selfN = 0, selfD = 0; for (const q of ls) { const d = Math.hypot(q.x - pl.x, q.y - pl.y); if (d < R) { selfN++; selfD += blastDmg(W.w, R, d); } }
      if (selfN) { hullHit(s, selfN, selfD); if (s.over) return; }
      for (const b of s.an) if (b.kind === 'real' && b.state !== 'disabled' && !b.aware && Math.hypot(truePos(b, v.at).x - v.aim.x, truePos(b, v.at).y - v.aim.y) < s.me.nearRange) makeAware(s, b, `Contact ${b.id + 1} felt that volley land close. It knows we are here.`, s.me.salvoFix);
      const res = []; let mainHit = false;
      for (const b of s.an) {
        if (b.state === 'disabled' || !['real', 'friend', 'lure'].includes(b.kind)) continue;
        const tp0 = truePos(b, v.at), pi = intercept(b, v.cone), rf = s.rFx; let tp = tp0, warned = false, sum = 0, n = 0;
        if (b.kind === 'real') { const rd = reactOf(s, b, v.homing, v.at - v.t0); if (rf() < rd.pw) { warned = true; const sg = rf() < 0.5 ? 1 : -1, dv = rd.dev * (0.6 + 0.4 * rf()); const hv = legVel(b, v.at), hd = Math.atan2(hv.vy, hv.vx); tp = { x: tp0.x - Math.sin(hd) * dv * sg, y: tp0.y + Math.cos(hd) * dv * sg }; makeAware(s, b, `Contact ${b.id + 1} detected the salvo and is now aware of us.`, s.me.salvoFix); } }
        const pts = ls.map(q0 => { let q = q0; if (v.homing) { const hp = s.me.homePull * (warned ? s.me.homeWarned : 1), dd = Math.hypot(q0.x - tp.x, q0.y - tp.y); if (dd < R * 3) q = { x: tp.x + (q0.x - tp.x) * (1 - hp), y: tp.y + (q0.y - tp.y) * (1 - hp) }; } const d = Math.hypot(q.x - tp.x, q.y - tp.y), cut = d < R && rf() < pi; if (d < R && !cut) { sum += blastDmg(1, R, d); n++; } return { dx: q.x - tp.x, dy: q.y - tp.y, d, cut, hit: d < R && !cut }; });
        if (warned && b.id === v.id) report(s, 'Dace', `Contact ${b.id + 1} detected the salvo and maneuvered off its line.`, 'bad');
        if (b.id !== v.id && !n) continue;
        sum = stack(sum); const dmg = W.w * sum; let result = 'miss';
        if (n) {
          if (b.hpMax) b.hp = Math.max(b.hpFloor || 0, b.hp - dmg);   // hpFloor: a scripted scene can keep a ship alive
          if (W.emp) b.eff = Math.max(0.25, (b.eff ?? 1) - W.emp * sum);
          if (W.lit) b.lit = Math.min(1, (b.lit || 0) + W.lit * sum);
          result = (!b.hpMax || b.hp <= 0) ? 'cripple' : 'damaged'; if (b.id === v.id) mainHit = true;
        }
        res.push({ warned, id: b.id, kind: b.kind, pts, n, dmg, hp: b.hpMax ? Math.round(b.hp) : null, max: b.hpMax || null, eff: b.eff, result, ally: b.kind === 'friend', main: b.id === v.id });
      }
      emit(s, { kind: 'ours', homing: !!v.homing, ammo: v.kind || 'he', R, target: v.id, res, selfN });
      for (const r of res) {
        const b = s.an[r.id];
        if (r.result === 'cripple') { if (cripple(s, b)) return; }
        else if (r.result === 'damaged' && b.kind === 'real') {
          makeAware(s, b, `Contact ${b.id + 1} was hit and knows we are here.`, s.me.hitFix);
          if (W.emp) report(s, 'Abara', `Contact ${b.id + 1}: light hull damage. System efficiency down to ${Math.round(b.eff * 100)} percent.`, 'good', true);
          else if (W.lit) report(s, 'Abara', `Contact ${b.id + 1}: light hull damage. Signature sharply elevated for several minutes.`, 'good', true);
          else report(s, 'Abara', `Contact ${b.id + 1}: ${r.dmg / b.hpMax < 0.18 ? 'light hull damage, plating only, no systems affected' : 'moderate hull damage, possible systems damage'}. Hull integrity ${Math.round(100 * b.hp / b.hpMax)} percent. Still maneuvering.`, 'good', true);
        } else if (r.result === 'damaged' && b.kind === 'friend') report(s, 'Abara', `Friendly fire: splash damage to allied contact ${b.id + 1}. Command will be informed.`, 'danger', true);
      }
      if (!mainHit && a.state !== 'disabled') report(s, 'Abara', 'Volley: no damage to the target.', 'bad');
    }
    const live = s.an.some(a => ['open', 'locked', 'chasing'].includes(a.state) && a.idStatus !== 'plan');
    if (!live && s.nreal > 0 && s.disabled < s.nreal && !s.rescanAt) { s.rescanAt = s.t + s.me.rescan; report(s, 'Abara', `Everything is ruled out and the ships are still out there. Rescanning takes ${mins(s.me.rescan)}.`, 'bad'); }
    if (s.rescanAt && s.t >= s.rescanAt) { s.rescanAt = null; s.an.forEach(a => { if (a.state === 'out') { a.state = 'open'; a.read = {}; } }); report(s, 'Abara', 'Rescan complete. Everything is open again.', 'info'); }
  }
  // What the player's own readings say. Uses only a.read plus rough range (the smear's distance), never the hidden kind.
  const KMEAN = { thermal: { real: 0.9, lure: 0.78, ghost: 0.3 }, reactor: { real: 1.0, lure: 0.68, ghost: 0.15 }, occlusion: { real: 0.9, lure: 0.05, ghost: 0.05 } };
  function classify(s, a) {
    const pl = s.player, p = truePos(a, s.t), d = Math.hypot(p.x - pl.x, p.y - pl.y), rf = 1, kinds = ['real', 'lure', 'ghost'];
    const fr = s.friendly ? 1 : 0, lp = { real: Math.log(s.nreal + fr), lure: Math.log(Math.max(1, s.nlure)), ghost: Math.log(Math.max(1, s.N - s.nreal - s.nlure - fr)) }, st = {}; let n = 0;
    for (const ch of ['thermal', 'reactor', 'occlusion']) {
      const q = a.read[ch]; if (!q) { st[ch] = 'none'; continue; }
      if (q.blind) { st[ch] = 'blind'; n++; continue; }
      if (!(q.den > 0)) { st[ch] = 'none'; continue; }
      const v = q.num / q.den, sd = (0.45 / Math.sqrt(Math.max(q.den, 0.5)) + 0.06) * s.me.classNoise; if (q.den >= 1) { st[ch] = 'set'; n++; } else st[ch] = 'thin';
      for (const k of kinds) { const mu = KMEAN[ch][k], z = (v - mu) / sd; lp[k] += -0.5 * z * z - Math.log(sd); }
    }
    const m = Math.max(...kinds.map(k => lp[k])), w = kinds.map(k => Math.exp(lp[k] - m)), sum = w.reduce((x, y) => x + y, 0), post = {}; kinds.forEach((k, i) => post[k] = w[i] / sum);
    const best = kinds.reduce((b, k) => post[k] > post[b] ? k : b, 'real');
    if (a.idStatus === 'hostile') return { n: Math.max(n, 1), st, post: { real: 1, lure: 0, ghost: 0 }, best: 'real', p: 1 };
    return { n, st, post, best, p: post[best] };
  }
  function exposure(s) {   // what is making us easy to find, per game minute (display only; sub() uses the same terms)
    const sq = 1, quiet = s.t < s.quietUntil; let m = POSTURE[s.posture].haz * sq * (s.entry === 'dark' && s.t < s.me.darkWindow ? s.me.darkHaz : 1);
    if (s.rescanAt) m *= 0.5; if (quiet) m *= s.me.quietHaz;
    const fN = s.analysts.filter(x => x.task != null && !x.hold).length, tN = s.analysts.filter(x => x.task != null && !x.hold && s.an[x.task].state === 'locked').length, z = quiet ? 0 : 1;
    const parts = [{ k: 'drift', label: 'Hull heat and drive, ' + POSTURE[s.posture].label.toLowerCase(), v: s.me.base * s.tempo * m }, { k: 'focus', label: 'Active sensor work (' + fN + ' on a contact)', v: s.me.glowFocus * fN * z }, { k: 'track', label: 'Tracking a locked ship (' + tN + ')', v: s.me.glowTrack * tN * z }, { k: 'pell', label: 'Pell running the ship hot', v: s.pell && !quiet ? s.me.glowPell : 0 }, { k: 'beam', label: 'Tight-beam challenge leaking', v: s.t < s.beamUntil ? s.me.beamGlow : 0 }, { k: 'blast', label: 'Weapons fire and detonations close by', v: s.t < s.blastUntil ? s.blastV : 0 }, { k: 'engine', label: (s.entry === 'fast' && s.t < s.me.wakeDur ? 'Hot arrival wake and engines' : 'Engine heat, ' + SPEED[s.speed].label.toLowerCase()), v: engineHeat(s) }, { k: 'ping', label: 'Active ping, loud', v: s.t < s.pingUntil ? s.me.pingGlow : 0 }, { k: 'near', label: 'A warship close enough to see our hull', v: nearHeat(s) }, { k: 'vent', label: 'Fins out, venting', v: s.vent.on ? P.visDiv : 0 }].filter(x => x.v > 0.0005);
    if (s.spool) parts.push({ k: 'spool', label: 'Breach drive spooling', v: s.me.spoolHeat });
    return { total: parts.reduce((q, x) => q + x.v, 0), parts, quiet };
  }
  // net change of the heat sink, as a fraction of the sink per game minute, optionally as if an action had been taken
  function modState(s, mod) {
    const o = Object.assign({}, mod || {}); if (o.quiet) { o.quietUntil = s.t + s.me.quietDur; delete o.quiet; } if (o.ping) { o.pingUntil = s.t + s.me.pingDur; delete o.ping; } if (o.spoolOn) { o.spool = { at: s.t + s.spoolMin }; delete o.spoolOn; } if (o.still) { o.posture = 'still'; o.orderId = null; delete o.still; }
    const q = Object.assign(Object.create(s), o);
    if (o.ventOn != null) q.vent = { on: !!o.ventOn, forced: false };
    return { q, vent: o.ventOn != null ? o.ventOn : s.vent.on };
  }
  function heatRate(s, mod) {
    const { q, vent } = modState(s, mod);
    return s.me.sinkK * exposure(q).parts.reduce((a, x) => a + (x.k === 'vent' ? 0 : x.v), 0) / s.me.sink - (vent ? 1 / s.me.ventFull : 0);
  }
  function visIf(s, mod) { return ourVis(modState(s, mod).q); }   // how visible we would be if the action were taken (hover preview)
  function tick(s, dt) { let left = dt; while (left > 1e-9 && !s.over) { const h = Math.min(P.sub, left); sub(s, h); left -= h; } }
  function assign(s, analystId, contact) { const w = s.analysts.find(x => x.id === analystId); if (!w || s.over || (contact != null && s.an[contact].idStatus === 'plan')) return; w.task = (contact == null || w.task === contact) ? null : contact; w.next = Math.min(w.next, s.t + 0.05); }
  function refreshSolution(s, id) { const a = s.an[id]; if (s.over || !a || a.state !== 'locked') return false; a.solve = 0; a.stale = false; report(s, 'Abara', `Re-working the firing solution on contact ${id + 1}.`, 'info'); return true; }
  function resolution(s, a) { let sum = 0; for (const ch of ['thermal', 'reactor', 'occlusion']) { const q = a.read[ch]; sum += q ? (q.blind ? 0.6 : Math.min(1, q.den / s.me.solveDen)) : 0; } return sum / 3; }
  function solveInfo(s, a) {
    const res = resolution(s, a), age = a.anchor ? s.t - a.anchor.t : 3, why = []; let nm = 0, sm = 0; for (const ch of ['thermal', 'reactor', 'occlusion']) if (signal(s, a, ch) !== null) { sm += infoMult(s, a, ch); nm++; } const avgM = nm ? sm / nm : 0.2;
    let T = s.me.solveMin + (s.me.solveMax - s.me.solveMin) * (1 - res) ** 1.3;
    if (res < 0.6) why.push('readings still thin');
    T *= clamp(0.7 / avgM, 0.75, 3); if (avgM < 0.4) why.push('trace is faint (cold or far)');
    if (age > 2) { T *= 1.25; why.push('stale track'); } else if (age < 0.5) T *= 0.9;
    const tp = truePos(a, s.t); let cl = 0; for (const b of s.an) if (b !== a && b.state !== 'out' && b.state !== 'disabled') { const q = truePos(b, s.t); if (Math.hypot(q.x - tp.x, q.y - tp.y) < s.me.clutterR) cl++; }
    if (cl) { T *= 1 + Math.min(0.3, 0.1 * cl); why.push('clutter nearby'); }
    { const vv = legVel(a, s.t), spd = Math.hypot(vv.vx, vv.vy); T *= 1 + s.me.spdK * spd; if (spd > 4.5) why.push('fast target'); if (backdrop(s, a)) T *= s.me.backK; if (a.lastMan != null && s.t - a.lastMan < s.me.manWin && spd > 0.5) { T *= s.me.manPen; why.push('target maneuvering'); } }
    if (s.pellAct && s.integration >= 50) T *= 0.85;
    const dark = s.t < s.quietUntil, prog = a.solve || 0;
    const stall = decoy(a) && prog >= s.me.decoyStall; if (stall) why.push('trace will not resolve'); const faint = avgM < 0.22 || stall; if (faint && !stall) why.push('trace too faint to work'); const cert = a.anchor ? uncertainty(s, a).conf : 0, unsure = !!a.anchor && cert < s.me.certReady; if (unsure) why.push('position too uncertain'); return { prog, T, remain: dark || faint || unsure ? Infinity : (1 - prog) * T, res, why, paused: dark || faint || unsure, dark, faint, unsure, cert, ready: prog >= 1, stale: !!a.stale, rate: avgM };
  }
  const decoy = a => a.kind === 'lure' || a.kind === 'ghost';
  function lockContact(s, id) {
    const a = s.an[id]; if (s.over || a.state !== 'open') return;
    if (a.kind === 'friend' && (a.idStatus === 'plan' || a.idStatus === 'confirmed')) { report(s, 'Abara', `Contact ${id + 1} is our ally. Weapons safe.`, 'info'); return; }
    a.state = 'locked'; a.track = 0; a.solve = 0; scan(s, a); report(s, 'Abara', `Contact ${id + 1} locked. Working a firing solution.`, 'good');   // the same words for every kind: the truth comes out through the solve
    if (a.kind === 'lure' || a.kind === 'ghost') { s.wrong++; a.chase = { until: s.t + s.me.chase }; }
  }
  function dismissContact(s, id) { const a = s.an[id]; if (s.over || a.state !== 'open' || a.idStatus === 'hostile' || a.idStatus === 'plan') return; a.state = 'out'; a.wrongCounted = a.kind === 'real'; if (a.kind === 'real') s.wrong++; for (const w of s.analysts) if (w.task === id) w.task = null; report(s, 'Abara', `Contact ${id + 1} ruled out.`, 'info'); }
  function reanalyze(s, id) { const a = s.an[id]; if (s.over || !a || a.state !== 'out') return false; a.state = 'open'; if (a.wrongCounted) { s.wrong--; a.wrongCounted = false; } report(s, 'Abara', `Contact ${id + 1} back under analysis.`, 'info'); return true; }
  function investigate(s, id) {   // put every analyst on one contact, or take them off again
    const a = s.an[id]; if (s.over || !a || !['open', 'locked'].includes(a.state) || a.idStatus === 'plan') return false;
    const all = s.analysts.every(w => w.task === id); for (const w of s.analysts) w.task = all ? null : id;
    report(s, 'Abara', all ? `Analysts released from contact ${id + 1}.` : `All analysts on contact ${id + 1}.`, 'info'); return true;
  }
  function fire(s, id, L, cone, kind = 'he', homing = false) {
    if (!WARHEAD[kind]) kind = 'he';
    const a = s.an[id]; if (s.over || s.t < s.quietUntil || a.state !== 'locked' || (a.solve || 0) < 1 || (a.kind === 'friend' && (a.idStatus === 'plan' || a.idStatus === 'confirmed'))) return false;
    const tb = s.tubes.findIndex(x => s.t >= x); if (tb < 0) return false; s.tubes[tb] = s.t + s.me.reload;
    const f = fanInfo(s, a, L); s.shots++; if (s.rFx() < s.me.launchSeen) { alert(s, s.me.launchAlert); report(s, 'Abara', 'Launch signature detected out there. Anyone listening heard that.', 'bad'); } s.volleys.push({ id, at: s.t + s.me.engage + f.tf, t0: s.t, from: { x: s.player.x, y: s.player.y }, off: Array.from({ length: s.me.missiles }, () => [gauss(s.rP), gauss(s.rP)]), aim: f.aim, dir: f.dir, cone, kind, homing: !!homing, stretch: s.me.alongStretch, killR: s.me.killR, disp: f.disp }); report(s, 'Abara', `${homing ? 'Homing ' : ''}${WARHEAD[kind].name} volley away on contact ${id + 1}. Impact in ${mins(s.me.engage + f.tf)}.`, 'info'); return true;
  }
  function closeInfo(s, a) { const tau = (s.t - a.anchor.t) + 0.1, est = estAt(a, tau); return { est, d: Math.hypot(est.x - s.player.x, est.y - s.player.y) }; }
  function fireClose(s, id) {   // coilgun: instant, ignores scatter grids, short range, loud
    const a = s.an[id]; if (s.over || s.t < s.quietUntil || !a || a.state !== 'locked' || !a.anchor || s.t < s.cwCd) return false;
    const ci = closeInfo(s, a); if (ci.d > s.me.closeRange || !['lock', 'track'].includes(trackState(s, a).state)) return false;
    s.cwCd = s.t + s.me.closeCd; s.blastUntil = Math.max(s.blastUntil, s.t + s.me.closeDur); s.blastV = s.me.closeGlow; s.shots++;
    const tp = truePos(a, s.t + 0.1), err = Math.hypot(ci.est.x - tp.x, ci.est.y - tp.y), hit = err < s.me.closeKill && s.rFx() < s.me.closeAcc;
    if (hit) { const dmg = s.me.closeDmg * (1 - 0.6 * err / s.me.closeKill); if (a.hpMax) a.hp = Math.max(a.hpFloor || 0, a.hp - dmg);
      if (!a.hpMax || a.hp <= 0) { report(s, 'Abara', `Coilgun: slug impact on contact ${id + 1}.`, 'info'); if (cripple(s, a)) return true; }
      else { report(s, 'Abara', `Coilgun: slug impact on contact ${id + 1}. Hull integrity ${Math.round(100 * a.hp / a.hpMax)} percent.`, 'good'); makeAware(s, a, `Contact ${id + 1} took a slug and knows where we are.`, s.me.hitFix); } }
    else report(s, 'Abara', `Coilgun: slug missed contact ${id + 1}. No damage.`, 'bad');
    if (!s.over && s.rFx() < s.me.closeBump) { alert(s, s.me.coilAlert); report(s, 'Abara', 'The coilgun flash lit us up.', 'bad'); }
    return true;
  }
  function challenge(s, id) {   // directional low-power laser with an encrypted challenge. A friend answers; a hostile hears it
    const a = s.an[id]; if (s.over || !s.friendly || !a || !['open', 'locked'].includes(a.state) || s.t < s.beamCd || s.t < s.quietUntil || ['confirmed', 'nofriend', 'plan', 'hostile'].includes(a.idStatus)) return false;
    s.beamCd = s.t + s.me.beamCd; s.beamUntil = s.t + s.me.beamDur;
    if (a.kind === 'friend') {
      a.idStatus = 'confirmed'; report(s, 'Abara', `Countersign received from contact ${id + 1}. It is ours.`, 'good', true);
      const tg = s.an.filter(x => x.kind === 'real' && ['open', 'locked'].includes(x.state)).sort((x, y) => ['thermal', 'reactor', 'occlusion'].reduce((m, c) => m + (x.read[c]?.den || 0), 0) - ['thermal', 'reactor', 'occlusion'].reduce((m, c) => m + (y.read[c]?.den || 0), 0))[0];
      if (tg) { for (let k = 0; k < s.me.shareReads; k++) for (const c of ['thermal', 'reactor', 'occlusion']) { const sg = signal(s, tg, c); if (sg !== null) addRead(s, tg, c, sg + gauss(s.rP) * 0.22, 3); } report(s, 'Abara', `Our ally sends its picture over the beam. Contact ${tg.id + 1} just got a lot clearer.`, 'good'); }
    } else {
      a.idStatus = 'nofriend'; report(s, 'Abara', `No countersign from contact ${id + 1}. It is not ours.`, 'info');
      if (a.kind === 'real' && s.rFx() < s.me.beamBump) { report(s, 'Abara', `Contact ${id + 1} read the beam. It knows where we are.`, 'danger', true); a.know = Math.max(a.know || 0, 0.5); alert(s, 0.1); }
    }
    return true;
  }
  function startVent(s, forced) {
    if (s.over || s.vent.on || (!forced && s.sink.h < s.me.ventMin)) return false;
    s.vent.on = true; s.vent.forced = !!forced; s.vent.t0 = s.t; s.vent.n++; if (s.t < s.quietUntil) s.quietUntil = s.t;
    report(s, 'Abara', forced ? 'Heat sinks are full. The fins are extending on their own and we cannot stop them. We are lit up until the sinks drain.' : `Fins out. Dumping heat, ${Math.round(s.sink.h * 100)} percent stored. We are fully visible until we retract or the sinks are empty.`, forced ? 'danger' : 'info', true); return true;
  }
  function stopVent(s) {   // fins can be pulled in by hand any time, except an emergency vent which must first fall under forcedRetract
    if (!s.vent.on) return false; if (s.vent.forced && s.sink.h >= s.me.forcedRetract) { report(s, 'Abara', `Emergency vent: the fins stay out until the sinks are under ${Math.round(s.me.forcedRetract * 100)} percent. Now at ${Math.round(s.sink.h * 100)}.`, 'warn'); return false; } const was = s.vent.forced; s.vent.on = false; s.vent.forced = false; s.ventOffT = s.t; if (was) s.forceAfter = s.t + 0.5;
    report(s, 'Abara', `Fins retracted. ${Math.round(s.sink.h * 100)} percent heat still stored, and we are back to normal stealth.${s.sink.h >= 0.95 ? ' The sinks are still full: the fins will open again on their own.' : ''}`, 'info'); return true;
  }
  function sinkStep(s, h) {
    const ex = exposure(s).parts.reduce((q, x) => q + (x.k === 'vent' ? 0 : x.v), 0), k = s.sink; k.h = clamp(k.h + (s.me.sinkK * ex / s.me.sink - (s.vent.on ? 1 / s.me.ventFull : 0)) * h, 0, 1);
    if (k.h >= 0.995) {   // the sink is pegged: past its limit the ship starts to cook
      s.melt = (s.melt || 0) + h;
      if (!s.meltWarn && s.melt > 0.4) { s.meltWarn = 1; report(s, 'Castellan', 'Reactor housing is past its limit. Ease off the drive or we start losing systems.', 'danger', true); }
      if (s.melt >= (s.meltNext ?? 1)) { s.meltNext = s.melt + 1; s.hull = Math.max(1, s.hull - s.me.meltHull); s.sysEff = Math.max(0.3, s.sysEff - s.me.meltSys); report(s, 'Castellan', `Coolant lines are failing. Hull integrity ${Math.round(s.hull)} percent, systems at ${Math.round(s.sysEff * 100)} percent.`, 'danger', true); }
    } else if (k.h < 0.9 && s.melt) { s.melt = Math.max(0, s.melt - 0.5 * h); if (!s.melt) { s.meltWarn = 0; s.meltNext = 1; } }
    if (s.vent.on) { s.vent.total += h; if (k.h <= 0.02 || (s.vent.forced && k.h <= s.me.forcedStop)) { s.vent.on = false; s.ventOffT = s.t; s.sinkWarn = k.h > 0.6 ? 1 : 0; report(s, 'Abara', k.h <= 0.02 ? 'Sinks are empty. Fins retracted.' : 'Fins retracting. The sinks are down to a safe level.', 'good'); } }
    else { const lv = [[0.6, 'Heat sinks at 60 percent. Venting is how we shed it, and it shows us to everyone. Quiet only slows the fill.'], [0.8, 'Heat sinks at 80 percent. We will have to vent soon.'], [0.95, 'Heat sinks nearly full. Vent now, or the fins will open by themselves.']];
      for (let i = s.sinkWarn; i < 3; i++) if (k.h >= lv[i][0]) { s.sinkWarn = i + 1; report(s, 'Abara', lv[i][1], i ? 'danger' : 'bad', i > 0); }
      if (k.h >= 1 && s.t >= (s.forceAfter || 0)) startVent(s, true); }
  }
  function goQuiet(s) { if (s.over || s.vent.on || s.t < s.quietCd) return false; s.quietUntil = s.t + s.me.quietDur; s.quietCd = s.t + s.me.quietCd; report(s, 'Abara', `Going quiet. Sensors dark, no launches, nobody touches anything for ${mins(s.me.quietDur)}. The drive still makes what heat it makes.`, 'info'); return true; }
  function retreat(s) {   // the breach drive has to spool before we can leave, and the spool makes us easy to see; pressing again cancels
    if (s.over) return; if (s.spool) { s.spool = null; report(s, 'Abara', 'Breach drive spool aborted. Venting the charge.', 'info'); return; }
    if (s.t < s.quietUntil) { report(s, 'Abara', 'Not while we are quiet, Captain. The spool would light us up.', 'info'); return; }
    s.spool = { at: s.t + s.spoolMin }; report(s, 'Abara', `Breach drive spooling. ${mins(s.spoolMin)} to jump, and the spool is bright on every sensor.`, 'danger', true);
  }
  function setPellAct(s, on) { s.pellAct = !!on && s.integration >= 75; }
  return { setDifficulty, getDifficulty, DIFFICULTY, applyPlayer, RULES, PLAYER, AI, maneuver, trackState, redlineBurn, navBlocked, reanalyze, investigate, heatRate, visIf, arenaPlan, PARTS, MODULES, salvage, reactOf, WARHEAD, HPMAX, dmgEst, landings, perf, symbolFor, shipClass, LOADOUTS, startVent, stopVent, ourVis, enemyVis, infoMult, backdrop, blocked, rangeF, refreshSolution, uncertainty, missilePos, setRoute, relBearing, solveInfo, resolution, P, POSTURE, ANALYSTS, THRESH, goQuiet, advice, setPellAct, newHunt, tick, assign, lockContact, dismissContact, fire, retreat, fanInfo, estAt, spreadAt, START, setOrder, setSpeed, pingContact, displayPos, SPEED, truePos, selfRisk, fireClose, closeInfo, volleyFx, cat, exposure, classify, stealthState, challenge };
})();
if (typeof module !== 'undefined') module.exports = HuntRT;
