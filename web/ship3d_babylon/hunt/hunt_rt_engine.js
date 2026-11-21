// Interdict hunt engine v4: REAL TIME with analyst reports. Time unit = game minutes (UI maps real seconds to game minutes).
// Three analysts (thermal / reactor / occlusion) read contacts on their own schedule; the player directs attention, interprets, locks, tracks, fires.
const HuntRT = (() => {
  const FL = (typeof Flight !== 'undefined' && Flight) || require('./flight_model.js');   // Newtonian flight (web/flight_model.js, docs/mechanics_flight.md): SI inside, km and game minutes out
  // RULES: the world, the same for every ship. Never trimmed, never scaled by difficulty.
  const RULES = { dmgExp: 2, sensRef: 40, visDiv: 0.2, visFloor: 0.06, visCap: 0.85, ventSig: 1, floorM: 0.12, blockM: 0.12, edge: 18, N: 8, nreal: 2, nlure: 3, arena: 240, sub: 0.05, secPerMin: 16, halfLife: 3, bait: 0.75, blastSat: 1.6, launchDetect: 1, launchSym: 1 };   // launchDetect 0: the off switch (docs/mechanics_vampire_detect.md): no launch is ever detected, every volley is first seen when its seeker lights, and our own launches use the old flat roll. launchSym 0: only our launches use the old flat roll
  // PLAYER: our ship and our actions. Copied into s.me for each hunt; trims, Pell assists and decision moments touch only s.me (applyPlayer).
  const PLAYER = { hailCd: 0.4, hailAlert: 0.04, hailReach: 1.2, meltHull: 3, meltSys: 0.15, forcedRetract: 0.8, readDone: 8, pingSolve: 0.6, pingGain: 0.4, pingWeight: 2, spoolMove: 0.3, spoolDog: 11.25, spool: 3, spoolVis: 0.9, spoolHeat: 0.06, homeWarned: 0.15, missQuiet: 0.08, homePull: 0.5, missiles: 6, dispMin: 0.8, dispK: 0.03, closeDmg: 32, empRecover: 0.02, symP: 0.8, classDen: 12, sinkK: 0.7, ventFull: 4, ventMin: 0.08, forcedStop: 0.25, sensR: 120, pingAlert: 0.3, launchAlert: 0.3, launchSeen: 0.35, pingFix: 0.7, hitFix: 0.75, salvoFix: 0.5, coilAlert: 0.2, solveStale: 3, uncDen: 20, uncMin: 2, uncMax: 16, solveMin: 0.8, solveMax: 3, solveDen: 8, clutterR: 18, base: 0.02, glowFocus: 0.01, glowTrack: 0.03, chase: 5, decoyStall: 0.55, rescan: 5, engage: 1, missileSpeed: 40, alongStretch: 1.5, autoPeriod: 0.8, focusPeriod: 0.45, killR: 7, glowPell: 0.012, integrationPerMin: 0.8, fixLo: 0.35, fixSpan: 0.4, driftK: 0.9, certReady: 0.6, certBleed: 0.5, manPen: 1.5, manWin: 3, manLoss: 0.35, spdK: 0.2, backK: 0.6, quietDur: 2.5, quietCd: 10, quietHaz: 0.2, suggestShort: 0.72, tubes: 3, reload: 4, darkWindow: 6, darkHaz: 0.5, darkWarm: 4, wakeDur: 3, wakeGlow: 0.1, wpReach: 2, moveRate: 1.1, shipSpeed: 1, holdOff: 5, pingCd: 4, pingDur: 1.5, pingGlow: 0.14, selfRadius: 7, closeRange: 18, closeCd: 2, closeKill: 8, closeAcc: 0.85, closeGlow: 0.12, closeDur: 2, blastGlow: 0.08, blastDur: 1.5, nearGlow: 0.025, nearRange: 24, closeBump: 0.5, beamGlow: 0.08, beamDur: 1, beamCd: 2, beamBump: 0.35, shareReads: 2, pellFriction: 0.08, classNoise: 1, pingRounds: 3, noRedline: 0, ventAfterglow: 0, leadSpread: 1, pingReach: 2, magTotal: 60, magSalvos: 10, magLow: 12, magHe: 54, magEmp: 3, magFlare: 3, pdGrid: 'light', pdArm: 0.125, pdDur: 0.6, pdGlow: 0.08, pdAlert: 0.08, pdCold: 0.3, probeR: 22, probeCd: 0.5,
    forceAt: 1, redHeat: 1, braceTime: 0.4, braceHold: 1, gThresh: 2, runSilent: 0.75, hunchP: 0.1, hunchRight: 0.7, decoyCount: 4, decoyLife: 3, decoyBelieve: 0.7, evadeOffKm: 3, evadeAheadKm: 6, evadeCruise: 60, gStrain: 2, gFatK: 0.0167, gFatJolt: 0.12, gFatEff: 0.5, gRecover: 0.0017, gBraceTol: 1.3, gBraceFat: 0.6, gSudden: 0.85, gTol: { Quill: 4.5, Abara: 6.5, Castellan: 5, Dace: 4.5, Fenwick: 4 }, injGate: 2, injK: 0.25, impactInj: 0.3, treatTime: 1, braceReact: 1.3, braceReactMoving: 1.6, rateSecure: 0.95, rateBracing: 0.9, rateLoaded: 0.75, stunP: 0.4, stunRef: 30, koDmg: 30, koP: 0.35, koRef: 50, koMin: 1.0, koSpan: 2.0, koMove: 0.25, koEff: 0.25, stunMin: 0.4, stunSpan: 0.35, injDmg: 20, hurtQuill: 0.8, hurtDace: 0.9, hurtAbara: 1.4, hurtVent: 0.8, hurtSpool: 1.3 };   // brace (docs/mechanics_brace.md); times in game minutes (0.4 = about 6 s)
  // AI: enemy warship defaults. Copied into a.ai per contact at spawn, scaled by its loadout and the difficulty. Nothing on the player side reads or writes it.
  const AI = { heatK: 1.4, sinkDiv: 3, ventFull: 4, empRecover: 0.15, litDecay: 0.15, sensR: 120, knowK: 0.4, knowDecay: 0.05, knowLose: 0.15, aimSigMax: 36, aimSigMin: 3.5, standoff: 60, fireCd0: 1.2, fireCd: 4.5, cone: 9, coneStill: 0.7, coneMove: 0.3, missileSpeed: 40, seekerActive: 12, manPatrol: [6,  9], manAware: [3,  5], missRate: 0.5, evadeV: 10, evadeMax: 36, dmgW: 38, missiles: 6, killR: 7, alongStretch: 1.5, dispMin: 0.8, dispK: 0.03, fireRange: 110, aimRange: 120, quietBlur: 4, searchStart: 7, searchRamp: 12, searchK: 0.05, searchDecay: 0.85, closeIn: 0.6, probeCd: 7, probeKnow: 0.12, probeGain: 0.22, blind: 0 };   // blind: chance that a volley fired at a stale fix (we are quiet) is a dark depth charge whose seekers never light (0 = never; mission data)
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
  // Tutorial hook (s.tut), set only by web/tutorial.js on the Tern (P2): { keep: true, solveT: game minutes }. keep: a locked solution never
  // goes stale, never bleeds for low certainty, is never cut by a target maneuver, and never pauses as too faint, but pauses while no analyst is on it; solveT: a fixed solve time
  // (divided by moveRate while moving or EVASIVE). sure: a contact id whose every volley from us lands (no cut, no miss), with bands: [[lo, hi], ...] the
  // hull fractions each successive hit leaves it in (dmgEst then reports a certain hit); foeSure: how many of that contact's volleys on us are
  // made to land, each for foeDmg: [min, max] hull points. Absent on every other hunt, bot and test, so normal balance is untouched.
  // Per-contact player modifiers (a.pm), set only by decision moments (web/hunt_rt_template.html, MOMENTS). They change how WE read and
  // hold one contact and nothing else; an absent a.pm (every headless test, every bot) leaves the engine exactly as before.
  //   readDone, classNoise, sensR: multipliers on our read threshold, guess noise and read range for this contact
  //   cap: ceiling on the shown and usable call certainty; confCap: ceiling on position confidence; trackCap: ceiling on a.track inside scan()
  const pmv = (a, k, d) => (a.pm && a.pm[k] != null ? a.pm[k] : d), staleT = (s, a) => s.me.solveStale * pmv(a, 'solveStale', 1);
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
  const SEEKER_LINEAGE = { orrin: 0.6, vask: 1.5, halden: 1 };   // x AI.seekerActive: an Orrin seeker lights up late (close in), a Vask seeker early
  const mins = m => { const r = Math.round(m * 10) / 10; return (r === 1 ? 'one minute' : (Number.isInteger(r) ? r : r.toFixed(1)) + ' minutes'); };   // crew always speak in game minutes
  const LOADOUTS = [   // the same fields rule our ship and theirs: sensor = how well it reads others, sig = how loud it is, crew = reaction and discipline, sink = heat capacity, spd = drive, dmg = warhead
    { id: 'cutter', cls: 'destroyer', name: 'Salvage cutter', sensor: 1.0, sig: 1.0, crew: 1.0, sink: 1.0, spd: 1.0, dmg: 1.0 },
    { id: 'picket', lineage: 'halden', cls: 'destroyer', name: 'Picket', sensor: 1.0, sig: 1.0, crew: 1.0, sink: 1.0, spd: 1.0, dmg: 1.0, blurb: 'Standard patrol ship.' },
    { id: 'hound', lineage: 'vask', cls: 'destroyer', name: 'Hound', sensor: 1.3, sig: 1.2, crew: 1.0, sink: 0.9, spd: 1.15, dmg: 1.0, blurb: 'Sharp sensors, loud drive.' },
    { id: 'shade', lineage: 'orrin', cls: 'cruiser', name: 'Shade', sensor: 0.9, sig: 0.72, crew: 1.0, sink: 0.9, spd: 0.9, dmg: 0.8, blurb: 'Stealthy, lightly armed.' },
    { id: 'veteran', lineage: 'vask', cls: 'cruiser', name: 'Veteran', sensor: 1.0, sig: 1.0, crew: 1.25, sink: 1.1, spd: 1.0, dmg: 1.1, blurb: 'Fast hands, vents only when it is safe.' },
    { id: 'green', lineage: 'halden', cls: 'destroyer', name: 'Green crew', sensor: 0.85, sig: 1.0, crew: 0.75, sink: 0.9, spd: 1.0, dmg: 1.0, blurb: 'Slow to react, careless about heat.' },
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
    const S0 = { nreal: NR, N: NN, nlure: NL, difficulty: D.name, get spoolMin() { return (this.dog ? this.me.spoolDog : this.me.spool) * (injOf(this, 'Castellan') ? this.me.hurtSpool : 1) * koSlow(this, 'Castellan'); }, rP: rng(seed ^ 0x9E3779B9), rFx: rng(seed ^ 0x85EBCA6B), dog: !!opts.dog, events: [], evN: 0, holdEvents: false, hold: false, sysEff: 1, bodies, me: makeMe(LOADOUTS[0]), sink: { h: opts.sink0 ?? 0.05 }, vent: { on: false, forced: false, t0: 0, n: 0, total: 0 }, sinkWarn: 0, entry, route: (opts.route || []).map(p => ({ x: p.x, y: p.y })), routeI: 0, speed: SPD_ALIAS[opts.speed] || opts.speed || 'v3', orderId: null, pingCd: 0, pingUntil: 0, pingFx: [], hull: 100, blastUntil: 0, blastV: 0, cwCd: 0, hullWarned: false, friendly: !!opts.friendly, beamCd: 0, beamUntil: 0, fratricide: 0, r, seed, t: 0, stage: 0, an, tempo, posture: (opts.route && opts.route.length) ? 'route' : 'still', pell: false, integration: opts.integration ?? 0, thresholdsHit: {}, pellAct: false, analysts: ANALYSTS.map((a, i) => ({ ...a, task: null, next: 0.15 + 0.12 * i })), pellNext: 0.5, pending: null, quietUntil: 0, quietCd: 0, volleys: [], inc: [], vel: { vx: 0, vy: 0 }, hdg: 0, thrust: 0, gNow: 0, tubes: Array(PLAYER.tubes).fill(0), rescanAt: null, log: [], beats: 0, over: null, disabled: 0, player: { x: start.x, y: start.y }, shots: 0, wrong: 0, evts: [], mag: newMag(opts.mag), pd: 'armed', pdUntil: 0, pdReadyAt: 0, probes: [], probeCd: 0, rPD: rng(seed ^ 0x165667B1), rDet: rng(seed ^ 0x3C6EF372),
      pset: newRack(opts.probeSets), seekerActive: opts.seekerActive, brace: 'free', braceBy: null, braceT0: 0, braceDone: 0, braceAuto: opts.braceAuto || 'vampire', braceRule: opts.brace !== false, gLoad: 0, unsecure: false, calmSince: 0, rBrace: rng(seed ^ 0x27D4EB2F), crew: Object.fromEntries(Object.keys(CREW).map(k => [k, { inj: false, at: 0, treatUntil: null, stunUntil: null }])) };
    if (opts.player) applyPlayer(S0, opts.player);   // underway prep (decision moments M06 M08 M10): player-only, through the one door
    return S0;
  }
  function newMag(o) {   // the magazine: 10 salvos of 6 = 60 missiles (decided); a total plus per-warhead-kind counts. opts.mag overrides for tests
    const pl = PLAYER, m = { total: pl.magTotal, max: pl.magTotal, salvos: pl.magSalvos, perSalvo: pl.missiles, byKind: { he: pl.magHe, emp: pl.magEmp, flare: pl.magFlare }, lowSaid: false };
    if (o) { if (o.byKind) m.byKind = Object.assign({}, o.byKind); m.total = o.total != null ? o.total : Object.values(m.byKind).reduce((a, b) => a + b, 0); m.max = Math.max(m.total, o.max || 0); }
    return m;
  }
  function spend(s, kind, n) {   // take n missiles of a kind from the magazine; returns how many were taken
    const m = s.mag; if (!m) return n; const k = m.byKind[kind] != null ? kind : 'he', got = Math.max(0, Math.min(n, m.byKind[k], m.total)); m.byKind[k] -= got; m.total -= got;
    if (!m.lowSaid && m.total <= P.player.magLow) { m.lowSaid = true; const sv = Math.floor(m.total / m.perSalvo); evt(s, 'mag_low', { total: m.total, salvos: sv }); report(s, 'Abara', `Magazine low: ${m.total} missiles left, ${sv} full salvo${sv === 1 ? '' : 's'}.`, 'bad'); }
    return got;
  }
  function report(s, who, text, kind = 'info', urgent = false) { s.beats++; s.log.push({ t: s.t, who, text, kind, urgent }); }
  // structured events for the station layer (docs/systems_contract.md s1): {type, data, t}. report() text stays as it is.
  function evt(s, type, data) { (s.evts || (s.evts = [])).push({ type, data: data || {}, t: s.t }); }
  const brgOf = (from, to) => Math.round(((Math.atan2(to.x - from.x, -(to.y - from.y)) * 180 / Math.PI) + 360) % 360);   // compass bearing, 0 = north (up), clockwise
  const fold = v => { const lo = 6, hi = P.arena - 1.5, w = hi - lo; let u = (v - lo) % (2 * w); if (u < 0) u += 2 * w; return lo + (u > w ? 2 * w - u : u); };
  // Enemy flight (docs/mechanics_flight.md, B3): a warship flies the same planner and limits as ours. a.navs is a list of plans [{t0, plan}] (the last with t0 <= t is in force; a plan coasts on past its end);
  // before its first manoeuvre a ship coasts on the straight line a.x0 + a.vx t. a.legs is the older piecewise-straight model, still read for ships that have no navs (tests, tutorial dummies).
  function navAt(a, t) { const N = a.navs; if (!N) return null; for (let i = N.length - 1; i >= 0; i--) if (N[i].t0 <= t) return N[i]; return null; }
  function enemyState(a, t) { const L = navAt(a, t); return L ? FL.stateAt(L.plan, (t - L.t0) * GM) : null; }
  function truePos(a, t) { const q = truePos0(a, t); return { x: fold(q.x), y: fold(q.y) }; }
  function truePos0(a, t) { const q = enemyState(a, t); if (q) return { x: q.p.x / KM, y: q.p.y / KM }; let L = null; if (a.legs) for (const g of a.legs) { if (g.t <= t) L = g; else break; } if (L) return { x: L.x + L.vx * (t - L.t), y: L.y + L.vy * (t - L.t) }; return { x: a.x0 + a.vx * t, y: a.y0 + a.vy * t }; }
  function legVel(a, t) { const q = enemyState(a, t); if (q) return { vx: q.v.x * KMGM, vy: q.v.y * KMGM }; let L = null; if (a.legs) for (const g of a.legs) { if (g.t <= t) L = g; else break; } return L ? { vx: L.vx, vy: L.vy } : { vx: a.vx, vy: a.vy }; }
  function enemyThrust(a, t) { const q = enemyState(a, t); return q ? q.thrust : 0; }   // drive level in units of 100 percent thrust: 0 when coasting or flipping
  function velAt(a, t) { const p1 = truePos(a, t - 0.05), p2 = truePos(a, t + 0.05); return { vx: (p2.x - p1.x) / 0.1, vy: (p2.y - p1.y) / 0.1 }; }
  function maneuver(s, a, dh, steer) {   // a warship changes course: a replan to a far waypoint on the new heading at its own cruise speed. It must turn (RCS flip rate) and burn (100 percent thrust) before the velocity changes.
    const p = truePos0(a, s.t), v = legVel(a, s.t), sp = Math.hypot(v.vx, v.vy), h0 = steer != null ? steer : Math.atan2(v.vy, v.vx) + dh;
    const cur = enemyState(a, s.t), st = cur ? { p: cur.p, v: cur.v, psi: cur.psi, omega: cur.w } : { p: toM(p), v: { x: v.vx * MS, y: v.vy * MS }, psi: sp > 0.05 ? Math.atan2(v.vy, v.vx) : h0, omega: 0 };
    const cr = Math.max(sp, a.cruise || 0.8 * (a.v || 2)), tgt = { p: { x: st.p.x + Math.cos(h0) * 400 * KM, y: st.p.y + Math.sin(h0) * 400 * KM }, kind: 'turn', cruise: cr * MS, thrust: 1 };
    const ship = a.shipP || (a.shipP = Object.assign({}, FL.SHIP, (a.ai && a.ai.ship) || {})), pl = FL.plan(st, [tgt], { cruise: cr * MS, thrust: 1, ship });
    (a.navs || (a.navs = [])).push({ t0: s.t, plan: pl }); if (!a.cruise) a.cruise = cr; a.lastMan = s.t;
    const b0 = pl.segs.find(g => g.thrust > 0 && (g.kind === 'burn' || g.kind === 'turnburn' || g.kind === 'brake')); a.manFx = { at: s.t + (b0 ? b0.t0 / GM : 0), sp };   // the track is spoilt when the velocity actually starts to change, not when the order is given
  }
  function manFx(s, a) {   // the velocity of a contact begins to change: our track on it is off
    const m = a.manFx; if (!m || s.t < m.at) return; a.manFx = null;
    if (a.state === 'locked' && m.sp > 0.5 && (a.solve || 0) > 0 && !(s.tut && s.tut.keep)) a.solve *= 1 - s.me.manLoss;
    if (a.state === 'locked' && m.sp > 0.5) report(s, 'Dace', `Contact ${a.id + 1} has changed course. Our track is off until we rescan it.`, 'bad');
  }
  function makeAware(s, a, text, know = 0.4) {   // know: how good a fix the event gave it (a hit or a ping points straight back at us)
    if (a.kind !== 'real' || a.state === 'disabled') return; a.know = Math.max(a.know || 0, know); if (a.aware) return; a.aware = true; a.nextFire = s.t + (a.ai.fireCd0 + a.r() * 1.5) / (a.load ? a.load.crew : 1); a.nextMan = Math.min(a.nextMan ?? 1e9, s.t + 1 + a.r() * 2);
    report(s, 'Dace', text || `Contact ${a.id + 1} has noticed us. Expect it to maneuver and shoot.`, 'danger', true);
  }
  const aimSigma = a => { const kq = clamp(((a.know || 0) - 0.33) / 0.67, 0, 1); return (a.ai.aimSigMax + (a.ai.aimSigMin - a.ai.aimSigMax) * kq) / Math.sqrt(a.load ? a.load.crew : 1); };
  function warnVampire(s, v, via) {   // the crew learn of a volley: at launch if the launcher is on our plot, otherwise when the seeker goes active
    v.seen = true; v.via = via; v.seenT = s.t; if (via === 'seeker' && s.an[v.id]) markHostile(s, s.an[v.id]); const eta = Math.max(0, v.at - s.t), f = v.from;
    (s.warn || (s.warn = [])).push({ id: v.id, t: s.t, lead: eta });
    if (via === 'launch') report(s, 'Dace', `Contact ${v.id + 1} has launched, impact in ${mins(eta)}. Move, or go quiet.`, 'danger', true);
    else report(s, 'Dace', `Vampire, seeker active, bearing ${String(Math.round(brgOf(s.player, f))).padStart(3, '0')}, impact in ${Math.max(1, Math.round(eta * P.secPerMin))} seconds.`, 'danger', true);
    evt(s, 'vampire', { n: via === 'launch' ? v.id + 1 : undefined, id: via === 'launch' ? v.id : null, bearing: brgOf(s.player, f), eta, etaSec: eta * P.secPerMin, at: v.at, count: v.count, via });
  }
  // Detection level (docs/mechanics_vampire_detect.md): how firmly the observer holds a ship, 0..1. A launch is detected with this probability.
  //   ours of them: the position confidence of the contact (uncertainty().conf): read evidence that decays with a 3 minute half life while it is open, the age and spread of the track while locked. Locked and fresh is about 1, never read is 0.
  //   theirs of us: their fix on us (a.know, capped at 1), the quantity that already decides how accurately they aim.
  function detectLevel(s, a) { return !a || a.state === 'disabled' ? 0 : clamp(uncertainty(s, a).conf, 0, 1); }
  const foeLevel = e => clamp(e.know || 0, 0, 1);
  function launchSeenBy(s, amt, reach = 1) {   // our launch is noticed by each live warship with the probability of its own detection level of us (the same rule as theirs): those that notice get the usual alert. Returns how many noticed. launchSym 0 / launchDetect 0: the old flat roll
    const legacy = s.rFx() < s.me.launchSeen; let n = 0;   // one rFx draw either way, so a paired sweep stays paired
    if (!RULES.launchDetect || !RULES.launchSym) { if (legacy) { alert(s, amt, reach); n = 1; } return n; }
    for (const e of s.an) if (e.kind === 'real' && e.state !== 'disabled') { const hit = s.rDet() < foeLevel(e); if (hit) { n++; const p = truePos(e, s.t); e.know = Math.min(1.2, (e.know || 0) + amt * rangeF(Math.hypot(p.x - s.player.x, p.y - s.player.y), e.ai.sensR * reach) * (blocked(s, p, s.player) ? P.blockM : 1)); } }
    return n;
  }
  const seenInc = s => s.inc.filter(v => v.seen !== false);   // what the crew know is in the air: volleys without a seen flag (tests, tutorial) count as seen
  function foes(s) {   // contacts move, maneuver, and the aware warships shoot back
    const rnd = (r, rr) => r[0] + rr() * (r[1] - r[0]);
    for (const a of s.an) {
      if (a.kind === 'friend' || a.state === 'disabled') continue;
      manFx(s, a);
      const p = truePos0(a, s.t), v = legVel(a, s.t), e = P.edge, A = P.arena, sp0 = Math.hypot(v.vx, v.vy), lead = (106 + 2 * sp0 * MS / FL.SHIP.a100) / GM, px = p.x + v.vx * lead, py = p.y + v.vy * lead, fresh = a.lastEdge != null && s.t - a.lastEdge < lead * 1.3;   // the lead: a turn-around takes a flip and a burn, so the ship must start before the edge or the planet is on it
      if (!fresh && ((px < e && v.vx < 0) || (px > A - e && v.vx > 0) || (py < e && v.vy < 0) || (py > A - e && v.vy > 0))) { a.lastEdge = s.t; maneuver(s, a, 0, Math.atan2(A / 2 - p.y, A / 2 - p.x) + (a.r() - 0.5) * 0.9); continue; }
      { const pb = fresh ? null : s.bodies.find(b => b.kind === 'planet' && Math.hypot(b.x - px, b.y - py) < b.r + 10 && ((b.x - p.x) * v.vx + (b.y - p.y) * v.vy) > 0); if (pb) { a.lastEdge = s.t; maneuver(s, a, 0, Math.atan2(p.y - pb.y, p.x - pb.x) + (a.r() - 0.5) * 0.8); continue; } }
      if (a.kind !== 'ghost') { const cr = a.load ? a.load.crew : 1; if (a.nextMan == null) a.nextMan = s.t + rnd(a.ai.manPatrol, a.r); if (s.t >= a.nextMan) {
        if (a.aware && a.kind === 'real' && a.r() < 0.65) { const sg = aimSigma(a), bx = s.player.x + gauss(a.r) * sg, by = s.player.y + gauss(a.r) * sg, dd = Math.hypot(bx - p.x, by - p.y), hd = Math.atan2(by - p.y, bx - p.x); maneuver(s, a, 0, dd > a.ai.standoff ? hd + (a.r() - 0.5) * 0.4 : hd + (a.r() < 0.5 ? 1 : -1) * (1.2 + a.r() * 0.5)); }
        else if (a.kind === 'real' && !a.aware && a.r() < searchLvl(s, a) * a.ai.closeIn) { const g = 30 + 60 * (1 - searchLvl(s, a)), bx = s.player.x + gauss(a.r) * g, by = s.player.y + gauss(a.r) * g; maneuver(s, a, 0, Math.atan2(by - p.y, bx - p.x)); }   // closing in on the area the noise came from
        else { const mag = (a.aware ? 0.6 + a.r() * 0.6 : 0.3 + a.r() * 0.4) * (a.r() < 0.5 ? -1 : 1); maneuver(s, a, mag); } a.nextMan = s.t + rnd(a.aware ? a.ai.manAware : a.ai.manPatrol, a.r) / cr; } }
      if (a.kind === 'real' && s.t >= a.nextFire && a.aware) {
        const quiet = s.t < s.quietUntil; if (a.quietRoll && s.t >= a.quietRoll.until) a.quietRoll = null;
        if (!quiet || !a.heard) a.heard = { x: s.player.x, y: s.player.y, vx: (s.vel || { vx: 0 }).vx, vy: (s.vel || { vy: 0 }).vy, t: s.t };   // while we make noise they follow us; when we go quiet they keep the last fix
        a.onDecoy = null; { const dc = decoyFor(s, a); if (dc) { a.heard = decoyPos(s, dc); a.onDecoy = dc; } }   // a lit decoy looks like us; they aim at it
        if (quiet && !a.quietRoll) a.quietRoll = { until: s.quietUntil, fire: a.r() < a.ai.cunning };
        if (quiet && !a.quietRoll.fire) { a.nextFire = s.quietUntil + 0.5; continue; }
        const f = truePos(a, s.t), hq = a.heard, dGo = Math.hypot(hq.x - f.x, hq.y - f.y);
        if (dGo > a.ai.fireRange) { a.nextFire = s.t + 1; continue; }   // out of reach: it closes first (aware maneuvers steer toward us)
        const blur = quiet ? a.ai.quietBlur * (s.t - hq.t) : 0, tf0 = dGo / a.ai.missileSpeed, lead = quiet ? 0.5 : 0.95;
        const sg = Math.hypot(aimSigma(a) * (0.5 + dGo / a.ai.aimRange) / Math.sqrt(perf(a)), blur), aim = { x: hq.x + hq.vx * (tf0 + (s.t - hq.t)) * lead + gauss(a.r) * sg, y: hq.y + hq.vy * (tf0 + (s.t - hq.t)) * lead + gauss(a.r) * sg }, tf = Math.hypot(aim.x - f.x, aim.y - f.y) / a.ai.missileSpeed;
        s.inc.push({ dmg: a.load.dmg, id: a.id, foe: true, t0: s.t, at: s.t + tf, from: { x: f.x, y: f.y }, aim, dir: Math.atan2(aim.y - f.y, aim.x - f.x), cone: a.ai.cone * (1.4 - 0.7 * clamp(((a.know || 0) - 0.33) / 0.67, 0, 1)) * a.ai.coneStill + a.ai.coneMove * Math.hypot(hq.vx, hq.vy) * tf0, disp: dispOf(a.ai, Math.hypot(aim.x - f.x, aim.y - f.y)), off: Array.from({ length: a.ai.missiles }, () => [gauss(a.r), gauss(a.r)]), stretch: a.ai.alongStretch, killR: a.ai.killR, dmgW: a.ai.dmgW });
        a.nextFire = s.t + a.ai.fireCd * (0.8 + 0.4 * a.r()) * (1.3 - 0.4 * clamp(((a.know || 0) - 0.33) / 0.67, 0, 1)) / (a.load.crew * perf(a));   // a firm fix on us means a faster rhythm
        a.lastFire = s.t; if (a.onDecoy) { a.onDecoy.spent = true; evt(s, 'decoy_taken', { id: a.id }); a.onDecoy = null; }
        const vq = s.inc[s.inc.length - 1], roll = s.rDet(), det = !!(s.tut || (RULES.launchDetect && a.idStatus !== 'plan' && roll < detectLevel(s, a))), blind = s.seekerActive === 0 || (a.ai.blind > 0 && quiet && s.rDet() < a.ai.blind), sd = (s.seekerActive ?? a.ai.seekerActive) * (SEEKER_LINEAGE[a.load.lineage] || 1);   // one roll per volley: it is seen at launch with the probability of our detection level of the launcher (detectLevel), so a firmly tracked ship is seen, an unseen one is not; a hidden launch is only noticed when the seeker lights up
        vq.seen = det; vq.seekAt = blind || !(sd > 0) ? Infinity : Math.max(vq.t0, vq.at - sd / a.ai.missileSpeed); vq.hot = false; vq.blind = blind || !(sd > 0); vq.level = detectLevel(s, a); vq.count = a.ai.missiles; vq.via = det ? 'launch' : null;
        if (det) { markHostile(s, a); warnVampire(s, vq, 'launch'); }   // an unseen shooter is marked hostile only when its seeker lights
      }
    }
    for (const v of s.inc) if (!v.hot && v.seekAt != null && s.t >= v.seekAt) { v.hot = true; if (v.seen === false) warnVampire(s, v, 'seeker'); }   // the seeker went from cold to hot: the volley is always seen from here (point defence can engage); one already seen at launch simply goes hot
    for (const v of s.inc.filter(v => s.t >= v.at)) {
      s.inc.splice(s.inc.indexOf(v), 1); const ls = landings(v), pl = s.player, R = v.killR; let f = 0, n = 0, cutN = 0;
      const tutFoe = !!(s.tut && s.tut.foeSure > 0 && v.id === s.tut.sure);   // tutorial only (web/tutorial.js): her answer lands once, for a fixed bite
      const pdP = tutFoe || v.seen === false ? 0 : pdIntercept(s, v.cone);   // our point defence: off 0, armed (cold) low, active full (own random stream, so other draws are unchanged)
      const L = ls.map(q => { const d = Math.hypot(q.x - pl.x, q.y - pl.y); if (d < R) { if (pdP > 0 && s.rPD() < pdP) { cutN++; return { dx: q.x - pl.x, dy: q.y - pl.y, d, cut: true }; } f += blastDmg(1, R, d); n++; } return { dx: q.x - pl.x, dy: q.y - pl.y, d }; });
      if (cutN) report(s, 'Abara', `Point defence cut ${cutN} incoming warhead${cutN > 1 ? 's' : ''} from contact ${v.id + 1}.`, 'good');
      if (s.pd === 'active') s.pdUntil = Math.max(s.pdUntil, s.t + s.me.pdDur);
      if (tutFoe && !n) { const i = L.reduce((b, x, j) => x.d < L[b].d ? j : b, 0), k = 0.5 * R / Math.max(1e-6, L[i].d); L[i] = { dx: L[i].dx * k, dy: L[i].dy * k, d: 0.5 * R }; f += blastDmg(1, R, 0.5 * R); n = 1; }
      let dmg = v.dmgW * (v.dmg || 1) * stack(f); const before = s.hull;
      if (tutFoe) { dmg = clamp(dmg, s.tut.foeDmg[0], s.tut.foeDmg[1]); s.tut.foeSure--; }
      if (n) hurtPlayer(s, dmg, `Contact ${v.id + 1} volley: ${n} of ${ls.length} detonated in range. ${dmg < 12 ? 'Light hull damage, plating only, no systems affected.' : dmg < 30 ? 'Moderate hull damage, possible systems damage.' : 'Heavy hull damage. That one hurt.'}`); else report(s, 'Abara', `Contact ${v.id + 1} volley: no damage. All warheads detonated clear of the hull.`, 'good');
      if (n && !s.over) impactInjury(s, dmg, v.id);
      emit(s, { kind: 'theirs', shooter: v.id, ammo: 'he', L, R, n, cut: cutN, dmg, before, after: s.hull, max: 100, result: s.hull <= 0 ? 'cripple' : n ? 'damaged' : 'miss', who: 'Us' });
      if (s.over) return;
    }
  }
  function alert(s, amt, reach = 1) {   // a noisy event: every live warship hears it, weighed by range. reach scales the hearer's detection radius (an active ping carries 2x)
    for (const e of s.an) if (e.kind === 'real' && e.state !== 'disabled') { const p = truePos(e, s.t); e.know = Math.min(1.2, (e.know || 0) + amt * rangeF(Math.hypot(p.x - s.player.x, p.y - s.player.y), e.ai.sensR * reach) * (blocked(s, p, s.player) ? P.blockM : 1)); }
  }
  function searchLvl(s, a) { return a.kind !== 'real' ? 0 : clamp((s.t - a.ai.searchStart) / a.ai.searchRamp, 0, 1) * a.ai.cunning / DIFFICULTY.normal.cunning; }   // 0..1 (more on hard): how widely an unaware hunter has spread its search
  function probe(s, a, p, d) {   // an enemy active ping: it learns where we are if nothing is in the way, and it gives itself away
    const bl = blocked(s, p, s.player), gain = bl ? 0 : a.ai.probeGain * rangeF(d, a.ai.sensR) * 1.5; a.know = Math.min(1.2, a.know + gain); a.lit = Math.min(1, (a.lit || 0) + 0.35); markHostile(s, a);
    report(s, 'Dace', bl ? `Contact ${a.id + 1} just pinged. The planet took it; it learned nothing. It is a warship, and it is hunting.` : `Contact ${a.id + 1} just pinged us. It is a warship, and now it has a rough idea where we are.`, 'danger', true);
    evt(s, 'ping_alert', { n: a.id + 1, id: a.id, bearing: brgOf(s.player, p), blocked: bl });
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
  function enemyAct(s, a, sp) { return (0.016 + 0.03 * Math.min(2, enemyThrust(a, s.t)) + (a.aware ? 0.02 : 0) + (s.t < (a.lastFire ?? -9) + 1.5 ? 0.1 : 0)) * (a.state === 'disabled' ? 0 : 1); }
  function enemyVis(s, a) { return Math.min(1, enemyVis0(s, a) + (a.lit || 0) * 0.6); }
  function enemyVis0(s, a) {   // how visible that ship is to us, 0..1
    if (a.kind === 'lure') return 0.55; if (a.kind === 'ghost') return 0.2; if (a.vent) return P.ventSig; if (a.state === 'disabled') return 0.1;
    const v = legVel(a, s.t); return Math.min(1, visOf(enemyAct(s, a, Math.hypot(v.vx, v.vy))) * (a.load ? a.load.sig : 1) * (a.sil || 1));
  }
  function infoMult(s, a, ch) {   // how fast one read on this contact teaches us anything
    const p = truePos(a, s.t), d = Math.hypot(p.x - s.player.x, p.y - s.player.y), v = enemyVis(s, a), hot = a.vent ? 1.6 : 1;
    const sig = ch === 'thermal' ? (0.25 + 0.9 * v) * hot : ch === 'reactor' ? 0.55 + 0.5 * v : 1, R = (ch === 'thermal' ? s.me.sensR : ch === 'reactor' ? s.me.sensR * 0.67 : s.me.sensR * 1.3) * pmv(a, 'sensR', 1);
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
  const TEXT = { thermal: { strong: 'thermal bloom, strong', faint: 'faint thermal, could be nothing', none: 'nothing thermal' }, reactor: { strong: 'neutrino line, steady', faint: 'faint neutrino flutter', none: 'no reactor signature' }, occlusion: { strong: 'eclipse profile solid, one hard-edged shadow the size of a hull', none: 'eclipse profile shows no shape, nothing hull-sized' } };   // the V read is a profile (how deep and solid the shadow is), not just 'it blocks light'
  function readIsDone(s, a, ch) { const q = a.read[ch]; return !!q && (q.den >= s.me.readDone * pmv(a, 'readDone', 1) || ((!!q.blind || !!q.said) && s.t - q.t < 6)); }   // a blind channel is retried every few minutes
  function doRead(s, who, a, focus) {
    const ch = who.ch, n = a.id + 1, o = obsRead(s, a, ch, focus ? 3 : 1, focus ? 0.22 : 0.45);
    if (o === null) { const q = a.read[ch]; q.t = s.t; if (!q.said) { q.said = true; report(s, who.name, `Contact ${n}: no bright screen behind that bearing. I cannot judge it by occlusion.`, 'info'); } return; }
    const q = a.read[ch], c = cat(o.v);
    if (ch === 'occlusion' && c === 'faint') return;
    if (q.cat !== c) { q.cat = c; const t = TEXT[ch][c === 'faint' && ch === 'occlusion' ? 'none' : c]; report(s, who.name, `Contact ${n}: ${t}.`, c === 'strong' ? 'good' : 'info'); }
    if (a.state === 'locked' && s.rP() < clamp((o.m - s.me.fixLo) / s.me.fixSpan, 0, 1)) { a.track += s.me.focusPeriod * Math.min(1, o.m); scan(s, a, o.m); }   // a read only yields a fix when the trace is strong enough
  }
  function scan(s, a, m = 1) {
    const q = 1 / Math.sqrt(clamp(m, 0.15, 1.5)), tk = Math.min(a.track, pmv(a, 'trackCap', Infinity)), hs = Math.max(0.05, 0.6 - 0.12 * tk) * q, ss = Math.max(0.06, 0.45 - 0.09 * tk) * q, p = truePos(a, s.t), vv = velAt(a, s.t);
    a.anchor = { x: p.x + gauss(s.rP) * 1.2 * q, y: p.y + gauss(s.rP) * 1.2 * q, pe: 1.2 * q, t: s.t, hdg: Math.atan2(vv.vy, vv.vx) + gauss(s.rP) * hs, spd: Math.hypot(vv.vx, vv.vy) * (1 + gauss(s.rP) * ss), hs, ss };
  }
  function estAt(a, tau) { const q = a.anchor; return { x: q.x + Math.cos(q.hdg) * q.spd * tau, y: q.y + Math.sin(q.hdg) * q.spd * tau }; }
  function spreadAt(a, tau, me = PLAYER) { const q = a.anchor; const fl = Math.max(1.5, 1.3 * (q.pe || 1.2)); return { along: Math.max(fl, q.spd * tau * q.ss), cross: Math.max(fl, q.spd * tau * q.hs, me.driftK * Math.pow(Math.max(0, tau), 1.5)) }; }
  // run-silent point (Dave, 2026-11-21): the fraction of the way to the target at which the missiles go active; default 3/4, so the seeker is lit for the last quarter.
  // Lit early (small fraction): longer in the target's point defence (act up), less blind flight (disp down). Lit late (large fraction): the reverse.
  const RS_MIN = 0.4, RS_MAX = 0.95, rsOf = (s, rs) => Math.max(RS_MIN, Math.min(RS_MAX, rs != null ? rs : (s.runSilent != null ? s.runSilent : s.me.runSilent)));
  const rsFx = (s, rs) => { const r = rsOf(s, rs); return { rs: r, act: (1 - r) / 0.25, disp: 1 + 1.2 * (r - 0.75) }; };
  function fanInfo(s, a, L) {
    const q = a.anchor, pl = s.player; let tau = (s.t - q.t) + s.me.engage + 2, aim;
    if (L == null) { for (let i = 0; i < 6; i++) { aim = estAt(a, tau); const tf = Math.hypot(aim.x - pl.x, aim.y - pl.y) / s.me.missileSpeed; tau = (s.t - q.t) + s.me.engage + tf; } L = q.spd * tau * s.me.suggestShort; }
    aim = { x: q.x + Math.cos(q.hdg) * L, y: q.y + Math.sin(q.hdg) * L };
    const tf = Math.hypot(aim.x - pl.x, aim.y - pl.y) / s.me.missileSpeed, tauImp = (s.t - q.t) + s.me.engage + tf, sp = spreadAt(a, tauImp, s.me), ls = s.me.leadSpread * (a.pm && a.pm.overcorrect && (a.lastMan || -9) > q.t ? 1.4 : pmv(a, 'leadSpread', 1));   // lead-table quality widens the aim, never our idea of where the contact is
    return { L, aim, tf, tauImp, along: sp.along * ls, cross: sp.cross * ls, bestL: q.spd * tauImp, dir: q.hdg, anchor: q, disp: dispOf(s.me, Math.hypot(aim.x - pl.x, aim.y - pl.y)) };
  }
  const GRID = { none: [0, 0.6], light: [1, 0.5], heavy: [2, 0.6] };
  function intercept(a, cone, act = 1) { const [ch, pk] = GRID[a.grid], dense = 1 + Math.max(0, 1 - cone / 6), hot = a.kind !== 'real' || a.aware ? 1 : 0.3; return Math.min(0.9, ch * dense * pk * hot / 4 * act); }   // a dense salvo is easier for a scatter grid to cut; a ship that has not noticed us has its grid cold
  function pdIntercept(s, cone) {   // our own point defence against one incoming warhead, from the same grid law as theirs
    if (!s.pd || s.pd === 'off') return 0; const [ch, pk] = GRID[s.me.pdGrid] || GRID.light, dense = 1 + Math.max(0, 1 - cone / 6), base = Math.min(0.9, ch * dense * pk / 4);
    return base * (s.pd === 'active' && s.t >= s.pdReadyAt ? 1 : s.me.pdCold);   // armed, or active but still spinning up: the cold factor (like an unaware ship's hot = 0.3)
  }
  function setPD(s, st) {   // 'off' | 'armed' | 'active'. Active is a visibility event: a bright emission (exposure) and a small alert to every hunter
    if (s.over || !['off', 'armed', 'active'].includes(st)) return false; const was = s.pd; if (st === was) { if (st === 'active') s.pdUntil = Math.max(s.pdUntil, s.t + s.me.pdDur); return true; }
    s.pd = st;
    if (st === 'active') { s.pdReadyAt = s.t + s.me.pdArm * (was === 'off' ? 2 : 1); s.pdUntil = s.t + s.me.pdDur; alert(s, s.me.pdAlert); report(s, 'Abara', 'Point defence active. Radars lit: anything looking can see us.', 'bad'); }
    else report(s, 'Abara', st === 'armed' ? 'Point defence armed and cold.' : 'Point defence off.', 'info');
    evt(s, 'pd', { state: st, was }); return true;
  }
  function enemyPD(s, b, lit = 0.25) {   // an enemy lights its point defence: an explicit, visible event (probe reactions; real volleys emit it without the glow bump)
    b.pdUntil = s.t + 0.6; if (lit) b.lit = Math.min(1, (b.lit || 0) + lit); evt(s, 'enemy_pd', { n: b.id + 1, id: b.id, lit: !!lit });
  }
  function probeSalvo(s, aim, n = 2, kind = 'he') {   // a feint: 1-2 real missiles at a point. No ping; a launch alert; an aware ship near the aim may react (W9)
    if (s.over || s.t < s.quietUntil || s.t < s.probeCd) return false;
    let id = null; if (typeof aim === 'number') { const a = s.an[aim]; if (!a || ['out', 'disabled'].includes(a.state) || a.idStatus === 'plan') return false; id = a.id; aim = displayPos(s, a); }
    if (!aim || !isFinite(aim.x) || !isFinite(aim.y)) return false;
    if (!s.mag || s.mag.total <= 0) { report(s, 'Abara', 'Magazine empty, Captain. Nothing left to probe with.', 'bad'); return false; }
    n = clamp(Math.round(n) || 1, 1, 2); if (!(s.mag.byKind[kind] > 0)) kind = Object.keys(s.mag.byKind).sort((x, y) => s.mag.byKind[y] - s.mag.byKind[x])[0];
    const got = spend(s, kind, n), d = Math.hypot(aim.x - s.player.x, aim.y - s.player.y), at = s.t + s.me.engage + d / s.me.missileSpeed;
    s.probeCd = s.t + s.me.probeCd; if (RULES.launchDetect && RULES.launchSym) launchSeenBy(s, s.me.launchAlert); else alert(s, s.me.launchAlert);
    s.probes.push({ id, aim: { x: aim.x, y: aim.y }, from: { x: s.player.x, y: s.player.y }, t0: s.t, at, n: got, kind });
    report(s, 'Abara', `Probe away: ${got} missile${got > 1 ? 's' : ''}, no ping${id != null ? ' toward contact ' + (id + 1) : ''}. Watch for a reaction in ${mins(at - s.t)}.`, 'info');
    return true;
  }
  function probeLand(s, pr) {   // who reacts to the probe: real, aware ships near the aim, unless the crew is cunning enough to sit tight
    let any = false;
    for (const b of s.an) {
      if (b.kind !== 'real' || b.state === 'disabled') continue; const p = truePos(b, s.t); if (Math.hypot(p.x - pr.aim.x, p.y - pr.aim.y) > s.me.probeR) continue;
      const aware = !!b.aware, pReact = clamp(1 - 0.75 * b.ai.cunning * (b.load ? b.load.crew : 1), 0.08, 0.95) * (aware ? 1 : 0.5);
      if (s.rPD() >= pReact) continue;
      const how = b.grid !== 'none' ? 'pd' : 'burn'; any = true;
      if (how === 'pd') enemyPD(s, b); else { b.lit = Math.min(1, (b.lit || 0) + 0.25); maneuver(s, b, (s.rPD() < 0.5 ? 1 : -1) * 0.8); }
      if (!aware) makeAware(s, b, `Contact ${b.id + 1} felt the probe land close. It knows something is out here.`, 0.3);
      report(s, 'Quill', how === 'pd' ? `Contact ${b.id + 1} lit its point defence at the probe. It is real.` : `Contact ${b.id + 1} burned hard when the probe landed. It is real.`, 'good', true);
      evt(s, 'probe_reaction', { n: b.id + 1, id: b.id, how, aware, aim: pr.aim });
    }
    if (!any) { report(s, 'Quill', 'Probe landed. No reaction: nothing there, or someone very steady.', 'info'); evt(s, 'probe_quiet', { id: pr.id, aim: pr.aim }); }
  }
  const blastDmg = (w, R, d) => d < R ? w * Math.pow(1 - d / R, P.dmgExp) : 0;   // one warhead law for every ship: ours on them, theirs on us, ours on us
  const stack = sum => P.blastSat * (1 - Math.exp(-sum / P.blastSat));   // detonations on one hull do not add up forever: a packed salvo overkills one point
  const dispOf = (wp, dist) => wp.dispMin + wp.dispK * dist;   // guidance scatter of each missile: grows with flight distance, so no salvo is ever a single point
  const scatter = (cone, disp, st) => ({ al: Math.hypot(cone * st, disp), cr: Math.hypot(cone, disp) });
  function volleyFx(aim, cone, tx, ty, a, r, dir, pl, offs, me = PLAYER, disp = 0, act = 1) {   // me.missiles missiles: do any reach the target, and do any land on us
    const cd = Math.cos(dir), sd = Math.sin(dir), pi = intercept(a, cone, act), sc = scatter(cone, disp, me.alongStretch); let hit = false, self = 0;
    for (let k = 0; k < me.missiles; k++) { const o = offs ? offs[k] : [gauss(r), gauss(r)], al = o[0] * sc.al, cr = o[1] * sc.cr, ax = aim.x + al * cd - cr * sd, ay = aim.y + al * sd + cr * cd; if (Math.hypot(ax - tx, ay - ty) < me.killR && r() >= pi) hit = true; if (pl && Math.hypot(ax - pl.x, ay - pl.y) < me.killR) self++; }
    return { hit, self };
  }
  function selfRisk(s, a, L, cone, M = 400, r = Math.random) { const f = fanInfo(s, a, L); let any = 0, tot = 0; for (let i = 0; i < M; i++) { const fx = volleyFx(f.aim, cone, 1e9, 1e9, a, r, f.dir, s.player, null, s.me, f.disp); if (fx.self) any++; tot += fx.self; } return { p: any / M, exp: tot / M, dist: Math.hypot(f.aim.x - s.player.x, f.aim.y - s.player.y) }; }
  function dmgEst(s, a, L, cone, kind = 'he', M = 400, r = Math.random, homing = false, rs = null) {   // chance a missile lands in range, and the expected effect: hull points (he), efficiency points (emp) or glare points (flare)
    if (s.tut && s.tut.sure === a.id && a.kind === 'real' && s.tut.bands && a.hpMax) { const bd = s.tut.bands[Math.min(s.tut.bands.length - 1, a.tutHits || 0)]; return { p: 1, exp: Math.max(0, a.hp - (bd[0] + bd[1]) / 2 * a.hpMax) }; }   // tutorial only: the hit is guaranteed, so the odds say so
    const f = fanInfo(s, a, L), cd = Math.cos(f.dir), sd = Math.sin(f.dir), m = estAt(a, f.tauImp), rx = rsFx(s, rs), pi = intercept(a, cone, rx.act), W = WARHEAD[kind], rd = a.kind === 'real' ? reactOf(s, a, homing, s.me.engage + f.tf) : { pw: 0, dev: 0 }, hv = legVel(a, s.t), hd = Math.atan2(hv.vy, hv.vx), sc = scatter(cone, f.disp * rx.disp, s.me.alongStretch); let any = 0, tot = 0;
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
    he: { name: 'Standard', w: 110, tip: 'High explosive. The workhorse: real hull damage, falling off with distance from each detonation.' },
    emp: { name: 'EMP', w: 14, emp: 0.8, tip: 'Pulse warhead. Light hull damage, but it cuts the target\'s system efficiency (slower fire, blinder sensors, slower to react) for a few minutes.' },
    flare: { name: 'Flare', w: 12, lit: 0.6, tip: 'Brilliant flare. Light hull damage, but it lights the target up: its signature jumps for a few minutes, so we read it faster and the solution comes quickly.' } };
  const HPMAX = { destroyer: 56, cruiser: 88, battleship: 144 };   // balance pass 2026-11-15 (docs/mechanics_balance.md): hulls x0.8 with HE w 46 -> 110, so a competent captain kills a ship in about 3 salvos and 10 salvos cover 2-3 ships
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
    if (a.state === 'locked' && a.anchor) { const sp = spreadAt(a, Math.max(0.01, s.t - a.anchor.t), s.me); const r = Math.max(s.me.uncMin, Math.min(s.me.uncMax, Math.max(sp.cross, sp.along * 0.6))); return { conf: Math.min(pmv(a, 'confCap', 1), 1 - (r - s.me.uncMin) / (s.me.uncMax - s.me.uncMin)), r }; }
    let c = 0; for (const ch of ['thermal', 'reactor', 'occlusion']) { const q = a.read[ch]; if (q && !q.blind && q.den > 0) c += q.den * Math.exp(-(s.t - q.t) * Math.LN2 / P.halfLife); }
    const conf = Math.min(1, c / s.me.uncDen); return { conf, r: s.me.uncMin + (s.me.uncMax - s.me.uncMin) * Math.pow(1 - conf, 1.2) };
  }
  function trackState(s, a) {   // how firmly we hold a locked contact: LOCK (fresh and tight), TRACK (dead reckoning), LAST (we have lost it and are guessing)
    if (a.state !== 'locked' || !a.anchor) return { state: 'none', cert: 0, age: 0 };
    const age = s.t - a.anchor.t, cert = uncertainty(s, a).conf;
    return { state: a.stale || age > staleT(s, a) || cert < 0.5 ? 'last' : cert >= 0.8 && age <= 2.0 ? 'lock' : 'track', cert, age };
  }
  function displayPos(s, a) { if (a.state === 'locked' && a.anchor) return estAt(a, s.t - a.anchor.t); const p = truePos(a, s.t), u = uncertainty(s, a), m = Math.hypot(a.jit.x, a.jit.y) || 1; return { x: p.x + a.jit.x / m * 0.55 * u.r, y: p.y + a.jit.y / m * 0.55 * u.r }; }
  function missilePos(s, v) { const f = Math.max(0, Math.min(1, (s.t - v.t0) / Math.max(0.01, v.at - v.t0))); return landings(v).map(e => ({ x: v.from.x + (e.x - v.from.x) * f, y: v.from.y + (e.y - v.from.y) * f })); }
  // ---- flight (docs/mechanics_flight.md): velocity, heading and thrust are real state; the ship follows a plan from the flight model ----
  const KM = 1000, GM = 60, KMGM = GM / KM, MS = KM / GM;   // metres per km, seconds per game minute, (m/s) -> (km/gmin), (km/gmin) -> (m/s)
  const toM = q => ({ x: q.x * KM, y: q.y * KM }), toKm = q => ({ x: q.x / KM, y: q.y / KM });
  const cruiseOf = (s, k) => SPEED[k].v * MS * (s.me.shipSpeed || 1) * (s.spool ? s.me.spoolMove : 1);   // the speed rung is the cruise cap of the planner, m/s
  const thrOf = k => k === 'ab' ? FL.SHIP.aRedline / FL.SHIP.a100 : 1;   // burns run at 100 percent; redline burns at 0.4 g
  const THRUST_HEAT = [[0, 0], [0.2, 0], [0.4, 0.012], [0.6, 0.04], [0.8, 0.12], [1, 0.3], [FL.SHIP.aRedline / FL.SHIP.a100, 0.9]];   // engine heat by thrust fraction (the old speed-rung table, read as the burn level)
  const THRUST_RATE = [[0, 1], [0.6, 1], [0.8, 0.9], [1, 0.8], [FL.SHIP.aRedline / FL.SHIP.a100, 0.6]];   // sensor rate by thrust fraction: a coasting ship hears best
  const lerpT = (tab, f) => { if (f <= tab[0][0]) return tab[0][1]; for (let i = 1; i < tab.length; i++) if (f <= tab[i][0]) return tab[i - 1][1] + (tab[i][1] - tab[i - 1][1]) * (f - tab[i - 1][0]) / (tab[i][0] - tab[i - 1][0]); return tab[tab.length - 1][1]; };
  const thrustHeat = f => lerpT(THRUST_HEAT, f), thrustRate = f => lerpT(THRUST_RATE, f);
  const speedNow = s => Math.hypot((s.vel || { vx: 0 }).vx, (s.vel || { vy: 0 }).vy);   // km per game minute
  function moving(s) { return speedNow(s) > 0.3 || (s.thrust || 0) > 0; }   // under way: the ship has velocity or the drive is burning
  function ownSpeed(s) { return speedNow(s); }   // slower targets let the enemy use a tighter cone
  function engineHeat(s) {   // by what the drive is doing now (burn phases emit by thrust, coast and rotate are quiet); a hover preview of a speed rung (own s.speed) shows that rung's burn level
    const prev = Object.prototype.hasOwnProperty.call(s, 'speed') && Object.getPrototypeOf(s) !== Object.prototype;
    const h = prev ? (s.posture !== 'still' || s.orderId != null ? SPEED[s.speed].heat : 0) * (s.speed === 'ab' ? s.me.redHeat : 1) : thrustHeat(s.thrust || 0) * ((s.thrust || 0) > 1.2 ? s.me.redHeat : 1);
    return h + (s.entry === 'fast' && s.t < s.me.wakeDur ? s.me.wakeGlow : 0);
  }
  function navStart(s) {   // the ship's state now, SI
    if (s.nav) { const q = FL.stateAt(s.nav.plan, (s.t - s.nav.t0) * GM); return { p: q.p, v: q.v, psi: q.psi, omega: q.w }; }
    return { p: toM(s.player), v: { x: s.vel.vx * MS, y: s.vel.vy * MS }, psi: s.hdg || 0, omega: 0 };
  }
  function navMake(s, plan, mode, extra) { s.nav = Object.assign({ plan, t0: s.t, mode, id: (s.navId = (s.navId || 0) + 1), made: s.t, last: { x: s.player.x, y: s.player.y }, dirty: false, base: 0 }, extra || {}); s.planInfoCache = null; return s.nav; }
  function navSet(s, wps, o = {}) {   // plan from where we are through km waypoints [{x, y, kind, speed}]; cruise is the set speed unless a waypoint carries its own
    const st = navStart(s), k0 = o.speed || s.speed, w = wps.map((q, i) => { const k = q.speed && SPEED[q.speed] ? q.speed : k0; return { p: toM(q), kind: q.kind || (i === wps.length - 1 ? 'stop' : 'turn'), cruise: o.cruise || cruiseOf(s, k), thrust: q.g > 0 ? q.g * FL.G0 / FL.SHIP.a100 : o.thrust != null ? o.thrust : thrOf(k), flip: q.flip > 0 ? q.flip : undefined }; });   // q.g is the burn g of the leg that ends at this waypoint, q.flip the flip g at its elbow
    const pl = FL.plan(st, w, { cruise: o.cruise || cruiseOf(s, k0), thrust: o.thrust != null ? o.thrust : thrOf(k0), ship: Object.assign({}, s.shipP, FL.maneuverShip(o.maneuver || s.maneuver || 'normal', s.shipP.crewR)) });
    return navMake(s, pl, o.mode || 'route', Object.assign({ wps: wps.map(q => ({ x: q.x, y: q.y, kind: q.kind, g: q.g, flip: q.flip })), goal: wps.length ? wps[wps.length - 1] : null }, o.extra));
  }
  // ---- plotted g (Dave, 2026-11-21): every leg has a burn g and every elbow a flip g, in half-g detents; Auto navigate fills them from a style ----
  const NAV_STYLES = { stealth: { g: 0.2, flip: 0.25, speed: 'v2', label: 'Stealth' }, standard: { g: 1, flip: 0.25, speed: 'v3', label: 'Standard' }, combat: { g: 3, flip: 3, speed: 'v5', label: 'Combat' }, emergency: { g: 6, flip: 6, speed: 'v5', label: 'Emergency' } };
  const G_DETENTS = [0.25, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6];
  const snapG = g => G_DETENTS.reduce((b, d) => Math.abs(d - g) < Math.abs(b - g) ? d : b, G_DETENTS[0]);
  const gBand = g => g <= 1 ? 'quiet' : g <= 2 ? 'firm' : g <= 3 ? 'combat' : 'emergency';
  function autoRoute(s, pt, style, via) {   // the navigator plots: straight to the point (through any via points) at the style's burn and flip g
    const st = NAV_STYLES[style] || NAV_STYLES.standard, pts = (via || []).concat([pt]);
    return pts.map((q, i) => ({ x: q.x, y: q.y, g: st.g, flip: st.flip, speed: st.speed, kind: i === pts.length - 1 ? 'stop' : 'turn' }));
  }
  function previewRoute(s, pts, o = {}) {   // what a route would cost, without committing to it: time, propellant, peak g, flips, strain-line crossings, fatigue estimate, warnings
    const sp = s.shipP || Object.assign({}, FL.SHIP, s.me.ship || {}); pts = pts.filter(q => !navBlocked(s, q.x, q.y)); if (!pts.length) return null;
    const st = navStart(s), k0 = pts[0].speed && SPEED[pts[0].speed] ? pts[0].speed : s.speed, w = pts.map((q, i) => { const k = q.speed && SPEED[q.speed] ? q.speed : k0; return { p: toM(q), kind: q.kind || (i === pts.length - 1 ? 'stop' : 'turn'), cruise: cruiseOf(s, k), thrust: q.g > 0 ? q.g * FL.G0 / FL.SHIP.a100 : thrOf(k), flip: q.flip > 0 ? q.flip : undefined }; });
    const pl = FL.plan(st, w, { cruise: cruiseOf(s, k0), thrust: w[0].thrust, ship: Object.assign({}, sp, FL.maneuverShip(o.maneuver || s.maneuver || 'normal', sp.crewR)) });
    let cross = 0, prev = 0, fat = 0, peak = 0; const flips = [];
    for (const sg of pl.segs) { const pr = sg.R || pl.ship, g = sg.kind === 'rotate' ? FL.rotG(pr.alpha, Math.min(pr.alpha * sg.dur / 2, pr.omegaMax), pr.crewR || FL.SHIP.crewR) : (sg.thrust || 0) * pl.ship.a100 / FL.G0;
      if (sg.kind === 'rotate') flips.push({ g, dur: sg.dur }); peak = Math.max(peak, g); if (g > s.me.gStrain && prev <= s.me.gStrain) { cross++; fat += s.me.gFatJolt; } if (g > s.me.gStrain) fat += s.me.gFatK * (g - s.me.gStrain) * sg.dur; prev = g; }
    return { timeSec: pl.stats.time, dv: pl.stats.dv, propT: pl.stats.propT, peakG: peak, flips, strainCrossings: cross, fatigue: Math.min(1, fat), warn: pl.warn, path: FL.sample(pl, 3).map(q => ({ x: q.p.x / KM, y: q.p.y / KM, kind: q.kind })), wps: pts.map((q, i) => ({ x: q.x, y: q.y, g: q.g, flip: q.flip, t: pl.wpT[i] })) };
  }
  function navHold(s) { const pl = FL.hold(navStart(s), { ship: Object.assign({}, s.shipP, FL.maneuverShip(s.maneuver || 'normal', s.shipP.crewR)) }); return navMake(s, pl, 'hold', { wps: [], goal: null }); }
  const navTau = s => (s.t - s.nav.t0) * GM;
  function navState(s, t) { return FL.stateAt(s.nav.plan, ((t == null ? s.t : t) - s.nav.t0) * GM); }
  function navClamp(s, x, y) { const m = 8; return { x: clamp(x, m, P.arena - m), y: clamp(y, m, P.arena - m) }; }
  function navPosture(s) {   // the posture controllers: every posture is a rule for choosing the next waypoint, and the planner does the flying
    const m = s.posture, pl = s.player, st = s.nav, age = s.t - st.made, A = P.arena;
    if (m === 'still') { if (st.mode !== 'hold') navHold(s); return; }
    if (m === 'route') { if (st.mode !== 'route' || st.dirty) navPlanRoute(s); return; }
    const a = s.orderId != null ? s.an[s.orderId] : null;
    if (m === 'evade') {   // a crazy Ivan (Dave, 2026-11-20): the tactical officer plots a dogleg, a detour waypoint off the line and a rejoin waypoint back on it; turn-and-burn at combat g, no speed cap but the g limit; a new leg when the last is flown
      const done = st.mode === 'evade' && s.t >= st.t0 + st.plan.stats.time / GM - 0.05;
      if (st.mode === 'evade' && !st.dirty && !done) return;
      const sg = st.mode === 'evade' ? -st.sg : (Math.floor(s.t / 2) % 2 ? 1 : -1), h = s.hdg || 0, fx = Math.cos(h), fy = Math.sin(h), lx = -fy * sg, ly = fx * sg, off = s.me.evadeOffKm, ah = s.me.evadeAheadKm;
      const A = navClamp(s, pl.x + fx * ah * 0.4 + lx * off, pl.y + fy * ah * 0.4 + ly * off), B = navClamp(s, pl.x + fx * ah, pl.y + fy * ah);
      navSet(s, [{ x: A.x, y: A.y, kind: 'turn' }, { x: B.x, y: B.y, kind: 'turn' }], { mode: 'evade', speed: 'v5', cruise: s.me.evadeCruise, thrust: FL.SHIP.aRedline / FL.SHIP.a100, maneuver: 'combat', extra: { sg } }); return;
    }
    if (!a || ['out', 'disabled'].includes(a.state)) return;
    const t = displayPos(s, a), dx = t.x - pl.x, dy = t.y - pl.y, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d;
    if (m === 'close') {
      if (d <= s.me.holdOff + 0.5) { if (st.mode !== 'hold') navHold(s); if (!s.holdSaid && speedNow(s) < 0.5) { s.holdSaid = true; report(s, 'Abara', `Holding ${s.me.holdOff} km off contact ${a.id + 1}. Closer and we would be inside our own blast.`, 'info'); } return; }
      const g = navClamp(s, t.x - ux * s.me.holdOff, t.y - uy * s.me.holdOff); if (st.mode === 'close' && !st.dirty && age < 2 && Math.hypot(g.x - st.goal.x, g.y - st.goal.y) < 4) return;
      navSet(s, [{ x: g.x, y: g.y, kind: 'stop' }], { mode: 'close' }); return;
    }
    if (m === 'separate') { const g = navClamp(s, pl.x - ux * 70, pl.y - uy * 70); if (st.mode === 'separate' && !st.dirty && age < 3 && Math.hypot(g.x - st.goal.x, g.y - st.goal.y) < 10) return; navSet(s, [{ x: g.x, y: g.y, kind: 'stop' }], { mode: 'separate' }); return; }
    if (m === 'orbit') {
      if (st.mode === 'orbit' && !st.dirty && age < 0.6) return;
      const dir = s.orbitDir || 1, arc = Math.max(3, speedNow(s) * 1.2, SPEED[s.speed].v * 0.6), th = Math.atan2(-dy, -dx) + dir * arc / d, g = navClamp(s, t.x + Math.cos(th) * d, t.y + Math.sin(th) * d);
      navSet(s, [{ x: g.x, y: g.y, kind: 'turn' }], { mode: 'orbit' }); return;
    }
  }
  function planInfo(s) {   // the plan as the console and the adapter show it, in km and game minutes: segments, path samples, waypoint times, delta-v, propellant (generic mass: water), warnings
    const nav = s.nav; if (!nav) return null;
    if (!s.planInfoCache || s.planInfoCache.id !== nav.id) {
      const pl = nav.plan, segs = pl.segs.map(g => ({ kind: g.kind, t0: nav.t0 + g.t0 / GM, dur: g.dur / GM, durSec: g.dur, p0: toKm(g.p0), psi0: g.psi0, dth: g.dth || 0, thrust: g.thrust, g: g.thrust * FL.SHIP.a100 / FL.G0 }));
      s.planInfoCache = { id: nav.id, mode: nav.mode, t0: nav.t0, segs, path: FL.sample(pl, 3).map(q => ({ t: nav.t0 + q.t / GM, x: q.p.x / KM, y: q.p.y / KM, psi: q.psi, kind: q.kind, thrust: q.thrust })), wps: (nav.wps || []).map((w, i) => ({ x: w.x, y: w.y, kind: w.kind || null, g: w.g, flip: w.flip, t: pl.wpT[i] != null ? nav.t0 + pl.wpT[i] / GM : null })), endT: nav.t0 + pl.stats.time / GM, timeSec: pl.stats.time, dv: pl.stats.dv, propT: pl.stats.propT, peakG: pl.stats.peakG, warn: pl.warn.slice(), cuts: pl.cuts.map(c => ({ i: c.i, cutKm: c.cut / KM })), end: toKm(pl.end.p) };
    }
    const q = navState(s), c = s.planInfoCache; c.now = { x: s.player.x, y: s.player.y, psi: q.psi, w: q.w, speed: speedNow(s), speedMs: speedNow(s) * MS, thrust: q.thrust, g: q.g, phase: q.kind, remainSec: Math.max(0, (c.endT - s.t) * GM) };
    return c;
  }
  function navPlanRoute(s) {   // fly s.route from s.routeI: intermediate points are turns, the last is a stop unless the point says otherwise
    const rest = s.route.slice(s.routeI); if (!rest.length) return navHold(s);
    const wps = rest.map((q, i) => ({ x: q.x, y: q.y, speed: q.speed, g: q.g, flip: q.flip, kind: q.kind || (i === rest.length - 1 ? 'stop' : 'turn') }));
    return navSet(s, wps, { mode: 'route', speed: rest[0].speed || s.speed, extra: { base: s.routeI } });
  }
  function navStep(s) {   // run every substep: choose waypoints for the posture, evaluate the plan at s.t, and publish position, velocity, heading, thrust
    if (!s.shipP) s.shipP = Object.assign({}, FL.SHIP, s.me.ship || {});
    if (!s.nav) navMake(s, FL.plan({ p: toM(s.player), v: { x: s.vel.vx * MS, y: s.vel.vy * MS }, psi: s.hdg || 0 }, [], { ship: s.shipP }), 'idle', { wps: [], goal: null });
    else if (Math.hypot(s.player.x - s.nav.last.x, s.player.y - s.nav.last.y) > 1e-6) { const q = navState(s, s.t), v = { x: q.v.x, y: q.v.y }; navMake(s, FL.plan({ p: toM(s.player), v, psi: q.psi }, [], { ship: s.shipP }), 'idle', { wps: [], goal: null }); }   // somebody moved us (a push out of a planet, a test): fly on from here
    if (s.water == null) { s.water = s.shipP.tank / 1000; s.waterReserve = 20; s.waterUsed = 0; s.navT = s.t; }   // propellant is water: the drive tanks (tonnes) and a locked crew reserve (not touched in this pass)
    if (s.water <= 0) { if (s.nav.mode !== 'dry') { const q0 = navState(s); navMake(s, FL.plan({ p: q0.p, v: q0.v, psi: q0.psi }, [], { ship: s.shipP }), 'dry', { wps: [], goal: null }); } }   // empty tanks: no change of velocity, the ship drifts
    else navPosture(s);
    let q = navState(s), pk = toKm(q.p);
    const c = { x: clamp(pk.x, 4, P.arena - 4), y: clamp(pk.y, 4, P.arena - 4) }, edge = Math.abs(c.x - pk.x) > 1e-9 || Math.abs(c.y - pk.y) > 1e-9;
    if (edge) { navMake(s, FL.plan({ p: toM(c), v: { x: 0, y: 0 }, psi: q.psi }, [], { ship: s.shipP }), 'idle', { wps: [], goal: null }); q = navState(s); pk = c; if (s.posture === 'route') { s.posture = 'still'; } if (!s.edgeSaid || s.t - s.edgeSaid > 4) { s.edgeSaid = s.t; report(s, 'Abara', 'We have reached the edge of the arena. Drive off, holding position.', 'info'); } }
    s.player.x = pk.x; s.player.y = pk.y; s.nav.last = { x: pk.x, y: pk.y };
    s.vel = { vx: q.v.x * KMGM, vy: q.v.y * KMGM }; s.hdg = q.psi; s.omega = q.w; s.thrust = q.thrust; s.phase = q.kind; s.gNow = q.g; { const sgR = q.i != null && s.nav.plan.segs[q.i] && s.nav.plan.segs[q.i].R, ps = sgR || s.nav.plan.ship || s.shipP; s.gSpin = q.kind === 'rotate' ? FL.rotG(ps.alpha, Math.abs(q.w), ps.crewR || FL.SHIP.crewR) : 0; }   // the felt g of a flip at the farthest crewed deck
    { const dt = Math.max(0, s.t - s.navT) * GM, used = q.thrust * s.shipP.a100 * s.shipP.mass / (s.shipP.isp * FL.G0) * dt / 1000; s.navT = s.t; s.water = Math.max(0, s.water - used); s.waterUsed += used; if (s.water <= 0 && !s.dryTold) { s.dryTold = true; evt(s, 'tanks_dry', {}); report(s, 'Castellan', 'Drive tanks are dry, Captain. We hold what velocity we have.', 'bad', true); } }
    if (s.posture === 'route') {   // waypoints are reached when the plan says so; the end of the plan is the end of the route
      const nav = s.nav, tau = navTau(s); let i = s.routeI - nav.base;
      while (nav.mode === 'route' && i < nav.plan.wpT.length && nav.plan.wpT[i] <= tau && s.routeI < s.route.length) { s.routeI++; i++; if (s.routeI >= s.route.length) { if (nav.plan.stats.time <= tau + 1e-6 || s.route[s.route.length - 1].kind !== 'turn') { s.posture = 'still'; report(s, 'Abara', 'Flight plan complete. Holding position.', 'info'); } else { s.posture = 'still'; report(s, 'Abara', 'Flight plan complete. Braking to hold position.', 'info'); } } else { const nx = s.route[s.routeI]; if (nx.speed && SPEED[nx.speed]) s.speed = nx.speed; report(s, 'Abara', `Waypoint ${s.routeI} reached. On to waypoint ${s.routeI + 1}.`, 'info'); } }
    }
  }
  const KEEP = { planet: 6, star: 16 };   // no courses into a planet's pull or into the star's glare
  function navBlocked(s, x, y) { for (const b of s.bodies) { const d = Math.hypot(b.x - x, b.y - y), k = KEEP[b.kind] ?? 0; if (k && d < b.r + k) return b.kind === 'star' ? 'Too close to the star: the glare and radiation would cook us.' : 'That is inside a planet\'s gravity well. We will not chart a course there.'; } return null; }
  function setRoute(s, pts) { if (s.over) return false; pts = pts.filter(q => !navBlocked(s, q.x, q.y)); s.route = pts.map(q => ({ x: clamp(q.x, 6, P.arena - 6), y: clamp(q.y, 6, P.arena - 6), speed: q.speed, kind: q.kind, g: q.g, flip: q.flip })); s.routeI = 0; if (s.nav) s.nav.dirty = true; if (s.route.length) { s.posture = 'route'; s.orderId = null; s.orderUntil = null; report(s, 'Abara', `New flight plan, ${s.route.length} waypoint${s.route.length > 1 ? 's' : ''}.`, 'info'); } else { s.posture = 'still'; report(s, 'Abara', 'Flight plan cleared. Holding position.', 'info'); } return true; }
  function relBearing(s, pt) { const b = Math.atan2(pt.x - s.player.x, -(pt.y - s.player.y)) * 180 / Math.PI, h = Math.atan2(Math.cos(s.hdg || 0) * 0 + (Math.cos(s.hdg || 0)), -(Math.sin(s.hdg || 0))) * 180 / Math.PI; return ((b - h + 540) % 360) - 180; }
  function setSpeed(s, k) { k = SPD_ALIAS[k] || k; if (s.over || !SPEED[k]) return false; s.burn = null; s.speed = k; if (s.posture === 'route' && s.route[s.routeI]) s.route[s.routeI].speed = k; if (s.nav) s.nav.dirty = true; return true; }
  function setOrder(s, mode, id, mins) {
    if (s.over || !POSTURE[mode]) return false;
    if (mode === 'route') { if (s.routeI >= s.route.length) return false; s.posture = 'route'; if (s.nav) s.nav.dirty = true; s.orderId = null; report(s, 'Abara', `Resuming the flight plan, waypoint ${s.routeI + 1} of ${s.route.length}.`, 'info'); return true; } const a = id != null ? s.an[id] : null;
    if ((mode === 'close' || mode === 'separate' || mode === 'orbit') && (!a || ['out', 'disabled'].includes(a.state))) return false;
    s.posture = mode; if (s.nav) s.nav.dirty = true; s.orderId = (mode === 'still' || id == null) ? null : id; s.holdSaid = false; s.orderUntil = mins ? s.t + mins : null; if (mode === 'orbit') s.orbitDir = s.rP() < 0.5 ? 1 : -1;
    report(s, 'Abara', { still: 'Holding position.', evade: a ? `Evasive pattern, keeping contact ${id + 1} off our flank.` : 'Evasive pattern.', close: `Closing on contact ${id != null ? id + 1 : ''}.`, separate: `Opening distance from contact ${id != null ? id + 1 : ''}.`, orbit: `Circling contact ${id != null ? id + 1 : ''}${mins ? ' for ' + mins + ' minutes' : ''}.` }[mode], 'info');
    return true;
  }
  function moveShip(s, h) {
    const m = s.posture;
    if (s.orderUntil != null && s.t >= s.orderUntil && m !== 'route' && m !== 'still') { s.posture = 'still'; s.orderId = null; s.orderUntil = null; report(s, 'Abara', 'Maneuver complete. Holding position.', 'info'); }
    else if (m !== 'route' && m !== 'still' && m !== 'evade') { const a = s.orderId != null ? s.an[s.orderId] : null; if (a && ['out', 'disabled'].includes(a.state)) { s.posture = 'still'; s.orderId = null; report(s, 'Abara', `Contact ${a.id + 1} is out of play. Holding position.`, 'info'); } }
    navStep(s);
    for (const b of s.bodies) if (b.kind === 'planet' || b.kind === 'star') { const dx = s.player.x - b.x, dy = s.player.y - b.y, d = Math.hypot(dx, dy) || 1, k = b.kind === 'star' ? 10 : 3; if (d < b.r + k) { s.player.x = b.x + dx / d * (b.r + k); s.player.y = b.y + dy / d * (b.r + k); } }
    if (s.hdg == null) s.hdg = 0;
  }
  function pingContact(s, id, mod) {   // mod (decision moment M02, narrow ping): { glow, alert, rounds, scan }   // directional active ping: a crisp fix, and anything listening hears it
    const a = s.an[id]; if (s.over || !a || !['open', 'locked'].includes(a.state) || a.idStatus === 'plan' || s.t < s.pingCd || s.t < s.quietUntil) return false;
    s.pingCd = s.t + s.me.pingCd; s.pingUntil = s.t + s.me.pingDur; s.pingMul = mod && mod.glow != null ? mod.glow : 1; const dp = displayPos(s, a); s.pingFx.push({ x: dp.x, y: dp.y, t: s.t });
    const bl = blocked(s, s.player, truePos(a, s.t));
    if (bl) report(s, 'Dace', `Active ping on contact ${id + 1} went into the planet. Nothing useful came back, but everyone heard it.`, 'bad', true);
    else if (a.state === 'locked') { a.track = Math.max(a.track, 2); scan(s, a, mod && mod.scan != null ? mod.scan : 1.2); a.pingSolve = s.t + s.me.pingSolve; a.stale = false; report(s, 'Dace', `Active ping on contact ${id + 1}. Fresh fix; it will firm up the solution in about ${mins(s.me.pingSolve)}.`, 'good', true); }
    else { for (let k = 0; k < (mod && mod.rounds != null ? mod.rounds : s.me.pingRounds); k++) for (const c of ['thermal', 'reactor', 'occlusion']) obsRead(s, a, c, s.me.pingWeight, 0.2, 1); report(s, 'Dace', `Active ping on contact ${id + 1}. Every channel just sharpened.`, 'good', true); }
    if (a.kind === 'real') makeAware(s, a, `Contact ${id + 1} felt our ping. It has turned toward us.`, s.me.pingFix);
    alert(s, s.me.pingAlert * (mod && mod.alert != null ? mod.alert : 1), s.me.pingReach);   // a ping carries twice the detection radius (contract s6)
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
    braceStep(s, h);
    probeStep(s, h);
    if (s.spool && s.t >= s.spool.at) { s.spool = null; evt(s, 'jump', { escaped: s.an.filter(a => a.kind === 'real' && a.state !== 'disabled').length }); s.escaped = s.an.filter(a => a.kind === 'real' && a.state !== 'disabled').length; s.over = s.dog ? 'jump' : s.disabled ? 'breach' : 'breach0'; report(s, 'Abara', s.dog && s.escaped ? 'Breach drive spooled. Jumping, with hostiles left behind. Expect them to warn the next sector.' : 'Breach drive spooled. Jumping.', s.dog && s.escaped ? 'danger' : 'bad'); return; }
    s.sysEff = Math.min(1, s.sysEff + s.me.empRecover * h);
    const quiet = s.t < s.quietUntil;
    const friction = 1 - s.me.pellFriction * Math.max(0, Math.floor(s.integration / 25) - 1), rate = POSTURE[s.posture].rate * (s.entry === 'dark' && s.t < s.me.darkWarm ? 0.8 : 1) * (moving(s) || s.posture === 'evade' ? s.me.moveRate : 1) * thrustRate(s.thrust || 0) * friction * (s.hull < 60 ? 0.85 : 1) * s.sysEff * bodyRate(s);
    for (const a of s.an) if (a.pingSolve && s.t >= a.pingSolve) { a.pingSolve = null; if (a.state === 'locked') { a.solve = Math.min(decoy(a) ? s.me.decoyStall : 1, (a.solve || 0) + s.me.pingGain); a.stale = false; scan(s, a, 1.2); if (a.solve >= 1) { a.track = Math.max(a.track, 3); report(s, 'Abara', `Ping fix on contact ${a.id + 1} closed the solution. Ready when you are.`, 'good', true); } else report(s, 'Abara', `Ping fix on contact ${a.id + 1}: solution ${Math.round(a.solve * 100)} percent.`, 'info'); } }
    const tutKeep = !!(s.tut && s.tut.keep);   // tutorial only (web/tutorial.js): the solution never goes stale or bleeds
    if (!tutKeep) for (const a of s.an) if (a.state === 'locked' && (a.solve || 0) >= 1 && a.anchor && s.t - a.anchor.t > staleT(s, a)) { a.solve = 0; a.stale = true; report(s, 'Abara', `The solution on contact ${a.id + 1} has gone stale. Refresh it when you want a new one; an analyst on the contact keeps the track fresh.`, 'bad'); }
    if (!tutKeep) for (const a of s.an) if (a.state === 'locked' && !a.stale && (a.solve || 0) > 0 && a.anchor && uncertainty(s, a).conf < s.me.certReady) a.solve = Math.max(0, a.solve - s.me.certBleed * h);
    if (!quiet && !stunned(s, 'Abara')) for (const a of s.an) if (a.state === 'locked' && !a.stale && (a.solve || 0) < 1) { { const si = solveInfo(s, a); if (!si.paused) a.solve = Math.min(decoy(a) ? s.me.decoyStall : 1, (a.solve || 0) + h / si.T); if (decoy(a) && a.solve >= s.me.decoyStall && !a.stallSaid) { a.stallSaid = true; report(s, 'Abara', `Contact ${a.id + 1}: the trace will not resolve. The solution has stalled.`, 'bad'); } } if (a.solve >= 1) { a.track = Math.max(a.track, 3); scan(s, a, 1); report(s, 'Abara', `Firing solution on contact ${a.id + 1}. The track is tight. Ready when you are.`, 'good'); } }
    for (const w of s.analysts) {
      if (s.t < w.next) continue;
      if (quiet) { w.next = s.quietUntil; continue; }
      if (stunned(s, w.name)) { w.next = s.crew[w.name].stunUntil; continue; }   // a stunned analyst reads nothing
      if (s.t < (s.cutUntil || 0)) { w.task = null; w.next = s.cutUntil; continue; }   // Dace has cut the stations (M09 loose)
      if (w.task != null && !['open', 'locked'].includes(s.an[w.task].state)) w.task = null;
      if (w.task != null && s.an[w.task].state === 'open' && readIsDone(s, s.an[w.task], w.ch)) { const a0 = s.an[w.task]; w.task = null; report(s, w.name, `Contact ${a0.id + 1}: ${w.role.toLowerCase()} read complete. Standing down on it.`, 'info'); }
      { const ta = w.task != null ? s.an[w.task] : null; if (ta && ta.state === 'locked' && (ta.solve || 0) >= 1 && ta.anchor && s.t - ta.anchor.t < staleT(s, ta) - 1.2) { if (!w.hold) { w.hold = true; } w.next = s.t + 0.4; continue; } w.hold = false; }
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
        const tp0 = truePos(b, v.at), pi = intercept(b, v.cone, v.rs != null ? rsFx(s, v.rs).act : 1), rf = s.rFx, sure = !!(s.tut && s.tut.sure === b.id && b.id === v.id && b.kind === 'real'); let tp = tp0, warned = false, sum = 0, n = 0;   // sure: tutorial only (web/tutorial.js), the volley always lands on her
        if (b.kind === 'real') { const rd = reactOf(s, b, v.homing, v.at - v.t0); if (rf() < rd.pw) { warned = true; const sg = rf() < 0.5 ? 1 : -1, dv = rd.dev * (0.6 + 0.4 * rf()); const hv = legVel(b, v.at), hd = Math.atan2(hv.vy, hv.vx); tp = { x: tp0.x - Math.sin(hd) * dv * sg, y: tp0.y + Math.cos(hd) * dv * sg }; makeAware(s, b, `Contact ${b.id + 1} detected the salvo and is now aware of us.`, s.me.salvoFix); if (b.grid !== 'none') enemyPD(s, b, 0); } }
        const pts = ls.map(q0 => { let q = q0; if (v.homing) { const hp = s.me.homePull * (warned ? s.me.homeWarned : 1), dd = Math.hypot(q0.x - tp.x, q0.y - tp.y); if (dd < R * 3) q = { x: tp.x + (q0.x - tp.x) * (1 - hp), y: tp.y + (q0.y - tp.y) * (1 - hp) }; } const d = Math.hypot(q.x - tp.x, q.y - tp.y), cut = d < R && !sure && rf() < pi; if (d < R && !cut) { sum += blastDmg(1, R, d); n++; } return { dx: q.x - tp.x, dy: q.y - tp.y, d, cut, hit: d < R && !cut }; });
        if (sure && !n) { const i = pts.reduce((m, x, j) => x.d < pts[m].d ? j : m, 0), k = 0.5 * R / Math.max(1e-6, pts[i].d); pts[i] = { dx: pts[i].dx * k, dy: pts[i].dy * k, d: 0.5 * R, cut: false, hit: true }; sum += blastDmg(1, R, 0.5 * R); n = 1; }
        if (warned && b.id === v.id) report(s, 'Dace', `Contact ${b.id + 1} detected the salvo and maneuvered off its line.`, 'bad');
        if (b.id !== v.id && !n) continue;
        sum = stack(sum); let dmg = W.w * sum, result = 'miss';
        if (n) {
          if (b.hpMax) { const h0 = b.hp; b.hp = Math.max(b.hpFloor || 0, b.hp - dmg);   // hpFloor: a scripted scene can keep a ship alive
            if (sure && s.tut.bands) { const bd = s.tut.bands[Math.min(s.tut.bands.length - 1, (b.tutHits = (b.tutHits || 0) + 1) - 1)]; b.hp = clamp(h0 - dmg, Math.min(h0, bd[0] * b.hpMax), Math.min(h0, bd[1] * b.hpMax)); dmg = h0 - b.hp; } }   // tutorial only: each hit lands her in a fixed band of hull
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
    if (s.pd === 'active' && !seenInc(s).length && s.t >= s.pdUntil) { s.pd = 'armed'; evt(s, 'pd', { state: 'armed', was: 'active' }); }   // nothing incoming: back to cold
    for (const pr of (s.probes || []).filter(q => s.t >= q.at)) { s.probes.splice(s.probes.indexOf(pr), 1); probeLand(s, pr); }
    for (const a of s.an) if (a.state === 'locked' && a.anchor) { const lost = trackState(s, a).state === 'last'; if (lost && !a.lostSaid) { a.lostSaid = true; evt(s, 'track_lost', { n: a.id + 1, id: a.id, ghost: true }); } else if (!lost) a.lostSaid = false; }
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
      const v = q.num / q.den, sd = (0.45 / Math.sqrt(Math.max(q.den, 0.5)) + 0.06) * s.me.classNoise * pmv(a, 'classNoise', 1); if (q.den >= 1) { st[ch] = 'set'; n++; } else st[ch] = 'thin';
      for (const k of kinds) { const mu = KMEAN[ch][k], z = (v - mu) / sd; lp[k] += -0.5 * z * z - Math.log(sd); }
    }
    const m = Math.max(...kinds.map(k => lp[k])), w = kinds.map(k => Math.exp(lp[k] - m)), sum = w.reduce((x, y) => x + y, 0), post = {}; kinds.forEach((k, i) => post[k] = w[i] / sum);
    const best = kinds.reduce((b, k) => post[k] > post[b] ? k : b, 'real');
    if (a.idStatus === 'hostile') return { n: Math.max(n, 1), st, post: { real: 1, lure: 0, ghost: 0 }, best: 'real', p: 1 };
    const cap = pmv(a, 'cap', 1); if (post[best] > cap) { const rest = 1 - post[best]; kinds.forEach(k => { post[k] = k === best ? cap : rest > 0 ? post[k] * (1 - cap) / rest : (1 - cap) / 2; }); }   // a hunch call: certainty can't pass the cap
    return { n, st, post, best, p: post[best], capped: cap < 1 };
  }
  function exposure(s) {   // what is making us easy to find, per game minute (display only; sub() uses the same terms)
    const sq = 1, quiet = s.t < s.quietUntil; let m = POSTURE[s.posture].haz * sq * (s.entry === 'dark' && s.t < s.me.darkWindow ? s.me.darkHaz : 1);
    if (s.rescanAt) m *= 0.5; if (quiet) m *= s.me.quietHaz;
    const fN = s.analysts.filter(x => x.task != null && !x.hold).length, tN = s.analysts.filter(x => x.task != null && !x.hold && s.an[x.task].state === 'locked').length, z = quiet ? 0 : 1;
    const parts = [{ k: 'drift', label: 'Hull heat and drive, ' + POSTURE[s.posture].label.toLowerCase(), v: s.me.base * s.tempo * m }, { k: 'focus', label: 'Active sensor work (' + fN + ' on a contact)', v: s.me.glowFocus * fN * z }, { k: 'track', label: 'Tracking a locked ship (' + tN + ')', v: s.me.glowTrack * tN * z }, { k: 'pell', label: 'Pell running the ship hot', v: s.pell && !quiet ? s.me.glowPell : 0 }, { k: 'beam', label: 'Tight-beam challenge leaking', v: s.t < s.beamUntil ? s.me.beamGlow : 0 }, { k: 'blast', label: 'Weapons fire and detonations close by', v: s.t < s.blastUntil ? s.blastV : 0 }, { k: 'engine', label: (s.entry === 'fast' && s.t < s.me.wakeDur ? 'Hot arrival wake and engines' : 'Engine heat, ' + SPEED[s.speed].label.toLowerCase()), v: engineHeat(s) }, { k: 'ping', label: 'Active ping, loud', v: s.t < s.pingUntil ? s.me.pingGlow * (s.pingMul == null ? 1 : s.pingMul) : 0 }, { k: 'near', label: 'A warship close enough to see our hull', v: nearHeat(s) }, { k: 'vent', label: 'Fins out, venting', v: s.vent.on ? P.visDiv : 0 }, { k: 'pd', label: 'Point defence active, radars lit', v: s.pd === 'active' ? s.me.pdGlow : 0 }, { k: 'probes', label: 'Probe radio links', v: probeGlow(s) }].filter(x => x.v > 0.0005);
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
    let T = (s.me.solveMin + (s.me.solveMax - s.me.solveMin) * (1 - res) ** 1.3) * pmv(a, 'solveT', 1) * (injOf(s, 'Abara') ? s.me.hurtAbara : 1) / gEff(s, 'Abara') * koSlow(s, 'Abara');
    if (res < 0.6) why.push('readings still thin');
    T *= clamp(0.7 / avgM, 0.75, 3); if (avgM < 0.4) why.push('trace is faint (cold or far)');
    if (age > 2) { T *= 1.25; why.push('stale track'); } else if (age < 0.5) T *= 0.9;
    const tp = truePos(a, s.t); let cl = 0; for (const b of s.an) if (b !== a && b.state !== 'out' && b.state !== 'disabled') { const q = truePos(b, s.t); if (Math.hypot(q.x - tp.x, q.y - tp.y) < s.me.clutterR) cl++; }
    if (cl) { T *= 1 + Math.min(0.3, 0.1 * cl); why.push('clutter nearby'); }
    { const vv = legVel(a, s.t), spd = Math.hypot(vv.vx, vv.vy); T *= 1 + s.me.spdK * spd; if (spd > 4.5) why.push('fast target'); if (backdrop(s, a)) T *= s.me.backK; if (a.lastMan != null && s.t - a.lastMan < s.me.manWin && spd > 0.5) { T *= s.me.manPen; why.push('target maneuvering'); } }
    if (s.pellAct && s.integration >= 50) T *= 0.85;
    if (s.tut && s.tut.solveT && !decoy(a)) { T = s.tut.solveT / (moving(s) || s.posture === 'evade' ? s.me.moveRate : 1); why.length = 0; }   // tutorial only: a fixed, short solve; moving or EVASIVE is about 10% faster, as with the analysts' reads
    const dark = s.t < s.quietUntil, prog = a.solve || 0;
    const stall = decoy(a) && prog >= s.me.decoyStall; if (stall) why.push('trace will not resolve'); const faint = (avgM < 0.22 && !(s.tut && s.tut.keep)) || stall; if (faint && !stall) why.push('trace too faint to work'); const cert = a.anchor ? uncertainty(s, a).conf : 0, unsure = !!a.anchor && cert < s.me.certReady && !(s.tut && s.tut.keep); if (unsure) why.push('position too uncertain'); const noEyes = !!(s.tut && s.tut.keep) && !decoy(a) && !s.analysts.some(w => w.task === a.id); if (noEyes) why.push('no analyst on it'); return { prog, T, remain: dark || faint || unsure || noEyes ? Infinity : (1 - prog) * T, res, why, paused: dark || faint || unsure || noEyes, dark, faint, unsure, noEyes, cert, ready: prog >= 1, stale: !!a.stale, rate: avgM };
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
  function fire(s, id, L, cone, kind = 'he', homing = false, rs = null) {
    if (!WARHEAD[kind]) kind = 'he';
    const a = s.an[id]; if (a && a.pm && a.pm.coneMin) cone = Math.max(cone, a.pm.coneMin);   // a hand-reused solution cannot be tightened below its default cone (M04)
    if (s.over || s.t < s.quietUntil || stunned(s, 'Abara') || a.state !== 'locked' || (a.solve || 0) < 1 || (a.kind === 'friend' && (a.idStatus === 'plan' || a.idStatus === 'confirmed'))) return false;
    const tb = s.tubes.findIndex(x => s.t >= x); if (tb < 0) return false;
    if (s.mag && (s.mag.total <= 0 || !(s.mag.byKind[kind] > 0))) { report(s, 'Abara', s.mag.total <= 0 ? 'Magazine empty, Captain. The tubes are dry.' : `No ${WARHEAD[kind].name} warheads left, Captain.`, 'bad'); evt(s, 'mag_empty', { kind, total: s.mag.total }); return false; }
    s.tubes[tb] = s.t + s.me.reload; const nm = spend(s, kind, s.me.missiles);   // a short salvo when fewer than six are left of that kind
    const f = fanInfo(s, a, L); s.shots++; if (launchSeenBy(s, s.me.launchAlert)) report(s, 'Abara', 'Launch signature detected out there. Anyone listening heard that.', 'bad'); s.volleys.push({ id, at: s.t + s.me.engage + f.tf, t0: s.t, from: { x: s.player.x, y: s.player.y }, off: Array.from({ length: s.me.missiles }, () => [gauss(s.rP), gauss(s.rP)]).slice(0, nm), aim: f.aim, dir: f.dir, cone, kind, homing: !!homing, stretch: s.me.alongStretch, killR: s.me.killR, disp: f.disp * rsFx(s, rs).disp, rs: rsFx(s, rs).rs, aboutFriend: a.kind === 'friend' }); report(s, 'Abara', `${homing ? 'Homing ' : ''}${WARHEAD[kind].name} volley away on contact ${id + 1}. Impact in ${mins(s.me.engage + f.tf)}.`, 'info'); return true;
  }
  // ---- the firing solution report (Dave, 2026-11-21): a hit-probability range, shown only once the solution is resolved; the officer's pick of run-silent point; a rare hunch ----
  function rng32(seed) { let t = seed >>> 0; return () => { t = (t + 0x6D2B79F5) >>> 0; let x = Math.imul(t ^ (t >>> 15), 1 | t); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; }
  function firingSolution(s, a, o = {}) {
    if (!a || a.state !== 'locked' || !a.anchor) return { ready: false, why: 'Not locked' };
    const si = solveInfo(s, a); if (!si.ready) return { ready: false, why: 'Solution not resolved yet' };
    const cone = o.cone != null ? o.cone : 6, rs = rsOf(s, o.rs), homing = !!o.homing, key = (a.id * 977 + Math.round(a.anchor.t * 100)) >>> 0, uncert = uncertainty(s, a);
    const draw = (rr) => { const ps = []; for (let k = 0; k < 7; k++) ps.push(dmgEst(s, a, null, cone, 'he', 160, rng32(key + k * 131 + Math.round(rr * 100)), homing, rr).p); return ps; };
    const ps = draw(rs), mean = ps.reduce((x, y) => x + y, 0) / ps.length, widen = (1 - uncert.conf) * 0.22, lo = Math.max(0, Math.min(...ps) - widen), hi = Math.min(1, Math.max(...ps) + widen * 0.5);
    let best = rs, bm = mean; for (const r of [0.5, 0.6, 0.7, 0.75, 0.8, 0.9]) { const m = draw(r).reduce((x, y) => x + y, 0) / 7; if (m > bm + 0.01) { bm = m; best = r; } }
    return { ready: true, lo, hi, mid: mean, rs, best, noEscape: lo >= 0.9, cone, conf: uncert.conf };
  }
  function hunchFor(s, a) {   // about one solution in ten, once per solution; drawn from the target's real state, right 70 percent of the time
    if (!a || a.state !== 'locked' || !a.anchor || a.kind !== 'real') return null; const key = a.id + ':' + Math.round(a.anchor.t * 100); s.hunchSeen = s.hunchSeen || {};
    if (s.hunchSeen[key] === undefined) { const r = rng32(((s.seed || 1) * 7919 + a.id * 104729 + Math.round(a.anchor.t * 100)) >>> 0); const has = r() < s.me.hunchP, right = r() < s.me.hunchRight; s.hunchSeen[key] = has ? { id: a.id, key, claim: (a.aware ? 'aware' : 'unaware') === (right ? (a.aware ? 'aware' : 'unaware') : (a.aware ? 'unaware' : 'aware')) ? (a.aware ? 'aware' : 'unaware') : (a.aware ? 'unaware' : 'aware'), right, state: 'open' } : false; if (has) report(s, 'Quill', `Captain, I have a hunch about contact ${a.id + 1}.`, 'caution'); }
    const h = s.hunchSeen[key]; return h && h.state === 'open' ? h : null;
  }
  function hunchAnswer(s, key, how) {   // 'take': fire as the hunch says (aware: a wider cone; unaware: it will not jink, tighten up); 'numbers' and 'wait' set it aside
    const h = s.hunchSeen && Object.values(s.hunchSeen).find(q => q && q.key === key && q.state === 'open'); if (!h) return false; h.state = how;
    if (how === 'take') { s.hunchCone = { id: h.id, delta: h.claim === 'aware' ? 3 : -2, until: s.t + 1.5 }; report(s, 'Quill', h.claim === 'aware' ? 'Wider spread, then. I think it has noticed us.' : 'Tight and quick. I think it has not seen us.', 'info'); }
    else if (how === 'wait') report(s, 'Quill', 'Holding for now, Captain.', 'info');
    evt(s, 'hunch', { id: h.id, how }); return true;
  }
  // ---- decoys (Dave, 2026-11-21): launched through the probe tube, keep our velocity, light up as a ship after a delay; hunters aim at a lit decoy ----
  function launchDecoy(s, delaySec) {
    if (s.over) return false; s.decoys = s.decoys || { left: s.me.decoyCount, list: [] };
    if (s.decoys.left <= 0) { report(s, 'Abara', 'No decoys left, Captain.', 'bad'); return false; }
    if (s.t < s.probeCd) { report(s, 'Abara', 'The probe tube is still reloading.', 'bad'); return false; }
    const d = Math.max(10, Math.min(180, delaySec || 60)); s.decoys.left--; s.probeCd = s.t + s.me.probeCd * 0.5;
    s.decoys.list.push({ id: (s.decoyN = (s.decoyN || 0) + 1), x: s.player.x, y: s.player.y, vx: s.vel.vx, vy: s.vel.vy, t0: s.t, lightAt: s.t + d / GM, until: s.t + d / GM + s.me.decoyLife, spent: false });
    report(s, 'Abara', `Decoy away. It lights in ${d} seconds on our present track.`, 'info'); evt(s, 'decoy_launch', { delay: d, left: s.decoys.left }); return true;
  }
  const decoyPos = (s, d) => ({ x: d.x + d.vx * (s.t - d.t0), y: d.y + d.vy * (s.t - d.t0), vx: d.vx, vy: d.vy, t: s.t });
  const decoyLit = (s, d) => !d.spent && s.t >= d.lightAt && s.t <= d.until;
  function decoyFor(s, b) {   // a lit decoy a hunting ship takes for us, or null
    if (!s.decoys) return null; for (const d of s.decoys.list) if (decoyLit(s, d)) { const age = (s.t - d.lightAt) / s.me.decoyLife; if (b.r() < s.me.decoyBelieve * (1 - age)) return d; } return null;
  }
  function commandDestruct(s) {   // a radio command: kills any of our volleys that have not yet gone active, and every hunter hears it
    const gone = []; for (const v of s.volleys.slice()) { const f = (s.t - v.t0) / Math.max(0.01, v.at - v.t0); if (f < (v.rs != null ? v.rs : s.me.runSilent)) { s.volleys.splice(s.volleys.indexOf(v), 1); gone.push(v); } }
    if (!gone.length) { report(s, 'Abara', 'Nothing in flight that we can still reach, Captain.', 'info'); return false; }
    if (typeof alert === 'function') alert(s, s.me.launchAlert * 2); report(s, 'Abara', `Command-destruct sent: ${gone.length} volley${gone.length > 1 ? 's' : ''} down. That was a radio call; anyone listening heard it.`, 'bad'); evt(s, 'destruct', { n: gone.length }); return true;
  }
  function closeInfo(s, a) { const tau = (s.t - a.anchor.t) + 0.1, est = estAt(a, tau); return { est, d: Math.hypot(est.x - s.player.x, est.y - s.player.y) }; }
  function fireClose(s, id) {   // coilgun: instant, ignores scatter grids, short range, loud
    const a = s.an[id]; if (s.over || s.t < s.quietUntil || stunned(s, 'Abara') || !a || a.state !== 'locked' || !a.anchor || s.t < s.cwCd) return false;
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

  // ---- Hailing (docs/hail_and_identification.md). A voice hail is soft information: the reply says who they claim to be, never proves it (the transponder challenge above is the proof). Replies are generic and context-dependent, in the style of X3: a line is chosen from role x mood, with overlays for a repeat hail, a hail while we hold a lock, and a damaged hull.
  // role: a.role if the arena set one (trader, salvager, patrol, pirate, civilian, warship, ally), else derived from the contact kind. mood: friendly, neutral, wary, hostile, or silent (no reply).
  const HAIL = {
    lines: {
      ally: { friendly: ['Read you, Salvage Crew. Good to hear a friendly voice out here.', 'Loud and clear. We are holding station. Go ahead.', 'Acknowledged. Stay on the beam and we will stay in step.'], wary: ['Say again, who is this? Use the countersign.'] },
      trader: { friendly: ['Salvage Crew, welcome. Prices are fair and the coffee is real.', 'Hello there. Cargo is clean, papers are in order, no trouble from us.'], neutral: ['Trader here. Just passing through. We would like to keep it that way.', 'We are hauling, not fighting. State your business.'], wary: ['Keep your distance, please. We have nothing worth taking.'], hostile: ['Back off or we call the patrol.'] },
      salvager: { friendly: ['Another crew on the wreck? Plenty to go round, friend.', 'Salvage Crew, is it? Good luck. The north side is picked clean.'], neutral: ['This wreck is claimed. We were here first.', 'Working a find. Do not crowd the line.'], wary: ['Stay off our tether. We know how to protect a claim.'], hostile: ['This is ours. Turn around or we will make you.'] },
      patrol: { friendly: ['Patrol vessel. Your transponder is clean. Carry on.'], neutral: ['Patrol vessel. State your vessel and purpose.', 'You are in a monitored lane. Keep your transponder on.'], wary: ['Hold your course. We are scanning you.'], hostile: ['Cut your drive and stand by to be boarded.'] },
      pirate: { neutral: ['Just a freighter, friend. Nothing to see.', 'Mining crew. Move along, nothing here for you.'], wary: ['Who is asking?'], hostile: ['You should not have called us.', 'Drop your cargo and we might let you leave.'] },
      civilian: { friendly: ['Oh! Hello. We are lost, a little. Can you spare a heading?', 'Survey ship. Glad to see anyone.'], wary: ['Please do not point anything at us.'] },
      warship: { neutral: ['This is a cargo hauler. Nothing to see here.'], wary: ['Identify yourself.'], hostile: ['Stand off. This is a restricted area.', 'You are being tracked. Break off.'] }
    },
    repeat: { friendly: ['Still here. Anything new?'], neutral: ['We already told you. Leave us alone.'], wary: ['Stop hailing us.'], hostile: ['That is the last warning.'] },
    locked: { friendly: ['You have a lock on us. Please drop it, we are friendly.'], neutral: ['You have a lock on us. Is that how you say hello?'], wary: ['You are tracking us. Explain.'], hostile: ['You have a lock on us. That is a mistake.'] },
    damaged: { friendly: ['You are venting air. Need a hand?'] },
    generic: ['Message received.']
  };
  function roleOf(a) { return a.role || ({ friend: 'ally', real: 'warship', lure: 'drone' }[a.kind] || 'unknown'); }
  function hailLine(role, mood, ctx, r) {   // pure: r is a function returning [0,1)
    const pick = arr => arr[Math.floor(r() * arr.length) % arr.length], L = HAIL.lines[role] || {}; ctx = ctx || {};
    if (ctx.repeat && HAIL.repeat[mood]) return pick(HAIL.repeat[mood]);
    if (ctx.locked && HAIL.locked[mood]) return pick(HAIL.locked[mood]);
    if (ctx.damaged && mood === 'friendly' && HAIL.damaged.friendly) return pick(HAIL.damaged.friendly);
    const arr = L[mood] || L.neutral || L.wary || HAIL.generic; return pick(arr);
  }
  function hailMood(s, a, role) {
    if (a.stance) return a.stance;   // an arena contact states its own stance
    if (a.kind === 'friend') return a.state === 'locked' ? 'wary' : 'friendly';
    if (a.kind === 'real') { const x = s.rFx(); return x < 0.55 ? 'silent' : x < 0.8 ? 'neutral' : 'hostile'; }   // a hunting warship stays quiet, bluffs, or warns us off
    return 'silent';   // a lure or drone has no one to answer
  }
  function hailContact(s, id) {   // Pell hails on the open channel. An emission, but a small one; the reply is soft evidence only
    const a = s.an[id]; if (s.over || !a || !['open', 'locked'].includes(a.state) || s.t < (s.hailCd || 0) || s.t < s.quietUntil || stunned(s, 'Pell')) return false;
    s.hailCd = s.t + s.me.hailCd; a.hailN = (a.hailN || 0) + 1; const role = roleOf(a), mood = hailMood(s, a, role), ctx = { repeat: a.hailN > 1, locked: a.state === 'locked', damaged: s.hull < 60 };
    const line = mood === 'silent' ? null : hailLine(role === 'warship' && mood === 'neutral' ? 'trader' : role, mood, ctx, s.rFx);   // a bluffing warship poses as a trader
    a.hail = { t: s.t, mood, line, role: mood === 'neutral' && role === 'warship' ? 'trader' : role };
    report(s, 'Pell', line ? `Hailed contact ${id + 1}. Reply: "${line}"` : `Hailed contact ${id + 1}. No reply.`, mood === 'hostile' ? 'bad' : 'info', mood === 'hostile');
    evt(s, 'hail', { id, role: a.hail.role, mood, line });
    if (a.kind === 'real') makeAware(s, a, `Contact ${id + 1} heard our hail.`, 0.3);
    alert(s, s.me.hailAlert, s.me.hailReach); return true;
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
    const ex = exposure(s).parts.reduce((q, x) => q + (x.k === 'vent' ? 0 : x.v), 0), k = s.sink; k.h = clamp(k.h + (s.me.sinkK * ex / s.me.sink - (s.vent.on ? (injOf(s, 'Dace') ? s.me.hurtVent : 1) * koRate(s, 'Dace') / s.me.ventFull : 0)) * h, 0, 1);
    if (k.h >= 0.995) {   // the sink is pegged: past its limit the ship starts to cook
      s.melt = (s.melt || 0) + h;
      if (!s.meltWarn && s.melt > 0.4) { s.meltWarn = 1; report(s, 'Castellan', 'Reactor housing is past its limit. Ease off the drive or we start losing systems.', 'danger', true); }
      if (s.melt >= (s.meltNext ?? 1)) { s.meltNext = s.melt + 1; s.hull = Math.max(1, s.hull - s.me.meltHull); s.sysEff = Math.max(0.3, s.sysEff - s.me.meltSys); report(s, 'Castellan', `Coolant lines are failing. Hull integrity ${Math.round(s.hull)} percent, systems at ${Math.round(s.sysEff * 100)} percent.`, 'danger', true); }
    } else if (k.h < 0.9 && s.melt) { s.melt = Math.max(0, s.melt - 0.5 * h); if (!s.melt) { s.meltWarn = 0; s.meltNext = 1; } }
    if (s.vent.on) { s.vent.total += h; if (k.h <= 0.02 || (s.vent.forced && k.h <= s.me.forcedStop)) { s.vent.on = false; s.ventOffT = s.t; s.sinkWarn = k.h > 0.6 ? 1 : 0; report(s, 'Abara', k.h <= 0.02 ? 'Sinks are empty. Fins retracted.' : 'Fins retracting. The sinks are down to a safe level.', 'good'); } }
    else { const lv = [[0.6, 'Heat sinks at 60 percent. Venting is how we shed it, and it shows us to everyone. Quiet only slows the fill.'], [0.8, 'Heat sinks at 80 percent. We will have to vent soon.'], [0.95, 'Heat sinks nearly full. Vent now, or the fins will open by themselves.']];
      for (let i = s.sinkWarn; i < 3; i++) if (k.h >= lv[i][0]) { s.sinkWarn = i + 1; report(s, 'Abara', lv[i][1], i ? 'danger' : 'bad', i > 0); }
      if (k.h >= s.me.forceAt && s.t >= (s.forceAfter || 0)) startVent(s, true); }
  }
  function goQuiet(s) { if (s.over || s.vent.on || s.t < s.quietCd) return false; s.quietUntil = s.t + s.me.quietDur; s.quietCd = s.t + s.me.quietCd; report(s, 'Abara', `Going quiet. Sensors dark, no launches, nobody touches anything for ${mins(s.me.quietDur)}. The drive still makes what heat it makes.`, 'info'); return true; }
  function retreat(s) {   // the breach drive has to spool before we can leave, and the spool makes us easy to see; pressing again cancels
    if (s.over) return; if (s.spool) { s.spool = null; if (s.nav) s.nav.dirty = true; report(s, 'Abara', 'Breach drive spool aborted. Venting the charge.', 'info'); return; }
    if (s.t < s.quietUntil) { report(s, 'Abara', 'Not while we are quiet, Captain. The spool would light us up.', 'info'); return; }
    s.spool = { at: s.t + s.spoolMin }; if (s.nav) s.nav.dirty = true; report(s, 'Abara', `Breach drive spooling. ${mins(s.spoolMin)} to jump, and the spool is bright on every sensor.`, 'danger', true);
  }
  // ---- brace: the crew's body state (docs/mechanics_brace.md). s.brace is 'free' | 'bracing' | 'secure'; the field name is stable (web/cic3d reads it). ----
  const GLOAD = { v1: FL.SHIP.a100 / FL.G0, v2: FL.SHIP.a100 / FL.G0, v3: FL.SHIP.a100 / FL.G0, v4: FL.SHIP.a100 / FL.G0, v5: FL.SHIP.a100 / FL.G0, ab: FL.SHIP.aRedline / FL.G0, evade: FL.SHIP.aRedline / FL.G0, spool: 2.5, impact: 2.5 };   // thrust-derived (Dave, 2026-11-20): every normal burn is 100 percent drive, 1 g; redline and an evasive burn 3 g; the flip is the spin load (docs/firing_solution_and_g_load.md) and every coast is free fall. Above gThresh (2 g) the crew must be braced.
  const CREW = { Quill: 'sensors', Abara: 'attack', Castellan: 'engineering', Dace: 'thermal', Fenwick: 'damage' };
  function loadNow(s) {
    let g = 0, why = null;
    if ((s.gNow || 0) > 0) { g = s.gNow; why = s.posture === 'evade' ? 'evade' : 'burn'; }
    if ((s.gSpin || 0) > g) { g = s.gSpin; why = 'flip'; }   // the real thrust-derived g of the burn in progress; coast and flip are weightless
    if (s.spool && GLOAD.spool > g) { g = GLOAD.spool; why = 'spool'; }
    if (s.gForce && s.t < s.gForce.until && s.gForce.g > g) { g = s.gForce.g; why = 'burn'; }   // a forced load: the sandbox and the tests hold the crew under g without flying a burn
    return { g, why };
  }
  function upcomingLoad(s, horizonGs) {   // the next planned segment (within horizonGs game-seconds) whose felt g would need a brace: { g, kind, inGs } or null. Turn points are known ahead, so the crew can brace for them
    if (!s.nav || !s.nav.plan) return null; const pl = s.nav.plan, ps = pl.ship || s.shipP, tau = (s.t - s.nav.t0) * GM;
    for (const g of pl.segs) { if (g.t0 + g.dur < tau) continue; if (g.t0 > tau + horizonGs) break;
      const pr = g.R || ps, gl = g.kind === 'rotate' ? FL.rotG(pr.alpha, Math.min(pr.alpha * g.dur / 2, pr.omegaMax), pr.crewR || FL.SHIP.crewR) : (g.thrust || 0) * ps.a100 / FL.G0;
      if (gl >= s.me.gThresh) return { g: gl, kind: g.kind, inGs: Math.max(0, g.t0 - tau) }; }
    return null;
  }
  function forceLoad(s, g, secs) { s.gForce = g > 0 ? { g, until: s.t + secs / P.secPerMin } : null; return s.gForce; }   // hold the crew under g for secs real seconds (0 g clears it)
  function braceNeeded(s, kind) {   // would this order put the crew under load while they are not secure? false, or { why, g } (the adapter raises call H4 on it)
    if (!s.braceRule || s.over || s.brace === 'secure') return false;
    const g = { redline: GLOAD.ab, burn: GLOAD.v5, evade: GLOAD.evade, spool: GLOAD.spool }[kind] || 0;
    return g >= s.me.gThresh ? { why: kind === 'redline' ? 'burn' : kind, g } : false;
  }
  function brace(s, on, who = 'co') {   // strap in (takes s.me.braceTime, about six seconds, a little longer or shorter by seed) or stand easy (instant)
    if (s.over) return false;
    if (on) {
      if (s.brace !== 'free') return true;
      s.brace = 'bracing'; s.braceBy = who; s.braceT0 = s.t; s.braceDone = s.t + s.me.braceTime * (0.85 + 0.3 * s.rBrace());
      evt(s, 'brace', { state: 'bracing', by: who, secureAt: s.braceDone }); report(s, 'Pell', 'All hands, brace.', 'info'); return true;
    }
    if (s.brace === 'free') return true;
    s.brace = 'free'; s.braceBy = null; evt(s, 'brace', { state: 'free', by: who }); report(s, 'Pell', 'Stand easy.', 'info'); return true;
  }
  function covered(s, who) { return s.captainAt === who; }   // the captain has taken a knocked-out officer's station
  function injOf(s, who) { const c = s.crew && s.crew[who]; return !!(c && c.inj && !c.ko); }   // (while knocked out the ko rules replace the injury penalties)
  function koSlow(s, who) { const c = s.crew && s.crew[who]; return c && c.ko && !covered(s, who) ? 1 / s.me.koEff : 1; }   // time multiplier at a knocked-out officer's station (4 at 25 percent)
  function koRate(s, who) { const c = s.crew && s.crew[who]; return c && c.ko && !covered(s, who) ? s.me.koEff : 1; }   // rate multiplier   // station penalties of an injury; they lapse while the captain is at the station
  // ---- g tolerance and fatigue (docs/firing_solution_and_g_load.md s2, 5): every officer has gTol, the g at which they black out. Above gStrain (2 g) they tire: gFat 0..1 lowers efficiency.
  // Braced crew (reclined, eyeballs in) tire at gBraceFat of the rate and black out at gBraceTol x the tolerance; a sudden jump of 2 g or more cuts tolerance by gSudden for a few seconds. Recovery is slow at 1 g or less, fast in free fall.
  const gEff = (s, who) => { const c = s.crew && s.crew[who]; return c && c.gFat ? 1 - s.me.gFatEff * c.gFat : 1; };
  const gPhysNow = s => { let g = Math.max(s.gNow || 0, s.gSpin || 0); if (s.gForce && s.t < s.gForce.until) g = Math.max(g, s.gForce.g); return g; };   // thrust and spin load; spool and impact are not sustained g
  function gTick(s, h) {
    const me = s.me, dgs = h * GM, g = gPhysNow(s), prev = s.gPrev || 0; s.gPrev = g; if (g - prev >= 2) s.gOnsetUntil = s.t + 3 / GM; const jolt = g > me.gStrain && prev <= me.gStrain;   // a jolt is each time the load climbs through the strain line: a hard burn or the peak of a flip
    const sudden = s.t < (s.gOnsetUntil || 0), bf = s.brace === 'secure' ? me.gBraceFat : s.brace === 'bracing' ? 0.7 : 1;
    for (const k in s.crew) { const c = s.crew[k]; if (c.gTol == null) c.gTol = (me.gTol && me.gTol[k]) || 5; if (c.gFat == null) { c.gFat = 0; c.gBlack = 0; }
      if (jolt) c.gFat = Math.min(1, (c.gFat || 0) + me.gFatJolt * bf);   // every hard onset (a 2 g jump) is a jolt of fatigue of its own, so how often you throw the ship about is what runs the crew down
      if (g > me.gStrain) c.gFat = Math.min(1, c.gFat + me.gFatK * (g - me.gStrain) * bf * dgs); else if (g <= 1) c.gFat = Math.max(0, c.gFat - me.gRecover * (g > 0.05 ? 1 : 3) * dgs);
      if (c.ko) { c.gBlack = 0; continue; }
      const tol = c.gTol * (s.brace === 'secure' ? me.gBraceTol : 1) * (sudden ? me.gSudden : 1), r = Math.max(0, Math.min(3, (g / tol - 0.85) / 0.15)) / 4;   // blackout comes in 4 s at the tolerance itself, faster above it, never below 85 percent of it
      c.gBlack = r > 0 ? c.gBlack + r * dgs : Math.max(0, c.gBlack - 0.5 * dgs); if (c.gBlack >= 1) { c.gBlack = 0; knockOut(s, k, 'blackout'); }
      if (c.gFat >= 0.3 && !c.gWarn) { c.gWarn = true; evt(s, 'g_tired', { officer: k, station: CREW[k], fat: c.gFat }); } else if (c.gFat < 0.15) c.gWarn = false; }
    // ship-wide strain calls (Dave, 2026-11-20): the crew say it aloud at 25, 50 and 75 percent average g-fatigue so the player feels the cost before the numbers show it
    const ks = Object.keys(s.crew), avg = ks.reduce((a, k) => a + (s.crew[k].gFat || 0), 0) / (ks.length || 1), T = [0.25, 0.5, 0.75], L = s.gTier || 0;
    if (L < 3 && avg >= T[L]) { s.gTier = L + 1; evt(s, 'g_strain', { level: s.gTier, avg });
      if (L === 0) report(s, 'Fenwick', 'The crew is feeling the strain, Captain.', 'caution');
      else if (L === 1) report(s, 'Abara', 'The physical toll is slowing us down, Captain. Plotting and sensor work are both lagging.', 'bad');
      else report(s, 'Pell', 'The crew is close to their limit, Captain. Another hard burn and somebody goes down.', 'danger'); }
    else if (L > 0 && avg < T[L - 1] - 0.1) { s.gTier = L - 1; if (s.gTier === 0) report(s, 'Fenwick', 'The crew has recovered, Captain.', 'info'); }
  }
  function gState(s) { return Object.keys(s.crew).map(k => { const c = s.crew[k]; return { officer: k, station: CREW[k], tol: c.gTol != null ? c.gTol : (s.me.gTol && s.me.gTol[k]) || 5, fat: c.gFat || 0, eff: gEff(s, k), ko: !!c.ko }; }); }   // for the screens
  function crewEff(s, who) { const c = s.crew && s.crew[who]; if (!c) return 1; if (c.ko && !covered(s, who)) return s.me.koEff; if (c.ko) return 1; return (c.inj ? 0.6 : 1) * gEff(s, who); }   // knocked out: the station runs at 25 percent unless the captain is there; injured: 60 percent; g-fatigue takes up to gFatEff (50 percent) more
  // Knocked out (Dave, 2026-11-19): a hit of 30+ or a fall on a crew who are not secure. Hurt too. Out for 1 to 3 game minutes (16 to 48 s).
  // The station runs at koEff (25 percent). The captain may take the station (E.captainTakes) but only once the officer has been moved to a free couch (E.moveKo, takes koMove min). Nobody dies in Act 1.
  function koOf(s, who) { const c = s.crew && s.crew[who]; return !!(c && c.ko); }
  function knockOut(s, who, cause) {
    const c = s.crew && s.crew[who]; if (!c || c.ko) return false; const dur = s.me.koMin + s.me.koSpan * s.rBrace(); c.ko = true; c.koCause = cause || null; c.koUntil = s.t + dur; c.moved = false; c.moveUntil = null; if (!c.inj) { c.inj = true; c.at = s.t; c.treatUntil = null; }
    evt(s, 'ko', { officer: who, station: CREW[who], until: c.koUntil, dur, cause }); report(s, 'Pell', `${who} is out cold at ${CREW[who]}.`, 'bad'); return true; }
  function moveKo(s, who) { const c = s.crew && s.crew[who]; if (!c || !c.ko || c.moved || c.moveUntil != null) return false; c.moveUntil = s.t + s.me.koMove; evt(s, 'ko_move', { officer: who, until: c.moveUntil }); report(s, 'Pell', `Carrying ${who} to a couch.`, 'info'); return true; }
  function captainTakes(s, who) { const c = s.crew && s.crew[who]; if (!c || !c.ko) return { ok: false, why: who + ' is not knocked out' }; if (!c.moved) return { ok: false, why: 'Move ' + who + ' to a couch first' }; s.captainAt = who; evt(s, 'captain_takes', { officer: who, station: CREW[who] }); report(s, 'Pell', `Captain has ${CREW[who]}.`, 'info'); return { ok: true }; }
  function captainLeaves(s) { if (!s.captainAt) return false; const w = s.captainAt; s.captainAt = null; evt(s, 'captain_leaves', { officer: w }); return true; }   // an injured officer works at 60 percent
  function bodyRate(s) {   // the crew's work rate: braced crew work from the couches, a crew under load that is not secure work badly, injuries add up
    if (!s.braceRule) return 1;
    const base = s.unsecure && s.gLoad >= s.me.gThresh ? s.me.rateLoaded : s.brace === 'secure' ? s.me.rateSecure : s.brace === 'bracing' ? s.me.rateBracing : 1;
    return base * (injOf(s, 'Quill') ? s.me.hurtQuill : 1) * koRate(s, 'Quill') * gEff(s, 'Quill') * (injOf(s, 'Dace') ? s.me.hurtDace : 1) * koRate(s, 'Dace') * gEff(s, 'Dace');
  }
  function injure(s, cause, n = 1) {
    const free = Object.keys(s.crew).filter(k => !s.crew[k].inj);
    for (let i = 0; i < n && free.length; i++) {
      const k = free.splice(Math.floor(s.rBrace() * free.length), 1)[0], c = s.crew[k]; c.inj = true; c.at = s.t; c.treatUntil = null;
      evt(s, 'injury', { officer: k, station: CREW[k], cause }); report(s, 'Pell', `${k} is hurt at ${CREW[k]}.`, 'bad');
    }
  }
  function stunned(s, who) { const c = s.crew && s.crew[who]; return !!(c && c.stunUntil != null && s.t < c.stunUntil); }   // a stunned officer's station is dead: Auto work stops, orders are held, Hands-on is locked out
  function stun(s, who, cause) {
    const c = s.crew[who], dur = s.me.stunMin + s.me.stunSpan * s.rBrace(), until = s.t + dur; if (c.stunUntil != null && c.stunUntil >= until) return;
    c.stunUntil = until; evt(s, 'stun', { officer: who, station: CREW[who], until, dur, cause }); report(s, 'Pell', `${who} is down, stunned, at ${CREW[who]}.`, 'bad');
  }
  function impactInjury(s, dmg, from) {
    evt(s, 'impact', { dmg, from, brace: s.brace });   // the ship moves the player avatar and the crew on this (thrown unless braced)   // a hit lands on a crew who are not secure: each officer may be stunned for a few seconds (chance scales with damage; bracing halves it, secure is spared); a big hit may also injure
    if (!s.braceRule || s.brace === 'secure') return;
    const me = s.me, k = s.brace === 'bracing' ? 0.5 : 1;
    for (const o in s.crew) if (s.rBrace() < Math.min(0.9, me.stunP * k * dmg / me.stunRef)) stun(s, o, 'impact');
    if (dmg >= me.injDmg && s.rBrace() < me.impactInj * k * Math.min(1, dmg / 40)) injure(s, 'impact', dmg >= 30 ? 2 : 1);
    if (dmg >= me.koDmg) for (const o in s.crew) if (!s.crew[o].ko && s.rBrace() < me.koP * k * Math.min(1, dmg / me.koRef)) knockOut(s, o, 'impact');
  }
  function treat(s, who) {   // Fenwick treats an officer (a minute; longer if he is hurt himself)
    const k = who && s.crew[who] && s.crew[who].inj ? who : Object.keys(s.crew).find(q => s.crew[q].inj && s.crew[q].treatUntil == null);
    if (!k || s.over || stunned(s, 'Fenwick')) return false;
    const c = s.crew[k]; if (c.treatUntil != null) return true;
    c.treatUntil = s.t + s.me.treatTime * (injOf(s, 'Fenwick') && k !== 'Fenwick' ? 1.6 : 1) * koSlow(s, 'Fenwick'); evt(s, 'treat', { officer: k, until: c.treatUntil }); return true;
  }
  function braceStep(s, h) {
    const me = s.me;
    for (const k in s.crew) { const c = s.crew[k]; if (c.inj && c.treatUntil != null && s.t >= c.treatUntil) { c.inj = false; c.treatUntil = null; evt(s, 'treated', { officer: k }); report(s, 'Pell', `${k} is back on station.`, 'info'); } }
    for (const k in s.crew) { const c = s.crew[k]; if (c.ko && c.moveUntil != null && s.t >= c.moveUntil) { c.moved = true; c.moveUntil = null; evt(s, 'ko_moved', { officer: k }); } if (c.ko && s.t >= c.koUntil) { c.ko = false; c.koUntil = null; c.moved = false; if (s.captainAt === k) { s.captainAt = null; evt(s, 'captain_leaves', { officer: k }); } evt(s, 'woke', { officer: k, station: CREW[k] }); report(s, 'Pell', `${k} is coming round.`, 'info'); } }
    for (const k in s.crew) { const c = s.crew[k]; if (c.stunUntil != null && s.t >= c.stunUntil) { c.stunUntil = null; evt(s, 'recovered', { officer: k, station: CREW[k] }); report(s, 'Pell', `${k} is back on the board.`, 'info'); } }
    if (s.brace === 'bracing' && s.t >= s.braceDone) { s.brace = 'secure'; evt(s, 'brace_complete', { by: s.braceBy }); }
    const L = loadNow(s), seen = seenInc(s), soon = seen.some(v => v.at - s.t < me.braceTime * 1.2), near = seen.some(v => v.at - s.t <= me.braceTime * 1.5), loaded = L.g >= me.gThresh, mode = s.braceAuto;   // only a SEEN volley counts: the crew cannot brace for what they have not detected
    const ahead = s.braceRule && s.t >= (s.noUnsecEvt || 0) && (mode === 'vampire' || mode === 'all') ? upcomingLoad(s, me.braceTime * 1.5 * GM) : null;   // a planned turn or burn that needs a brace
    if (s.brace === 'free' && s.braceRule) { if ((mode === 'vampire' || mode === 'all') && (near || ahead)) { if (ahead && !near) evt(s, 'brace_plan', { g: ahead.g, kind: ahead.kind, inGs: ahead.inGs }); brace(s, true, 'auto'); }   // a seen volley within braceTime x 1.5 of impact (about 10 s); one first seen late (the seeker route) braces at once
      else if (mode === 'all' && loaded) brace(s, true, 'auto'); }
    if (s.brace === 'secure' && s.braceBy === 'auto' && mode !== 'off') {   // the crew stand easy on their own once the load and the threat have gone
      if (loaded || seen.length || ahead) s.calmSince = s.t; else if (s.t - s.calmSince >= me.braceHold) brace(s, false, 'auto');
    } else s.calmSince = s.t;
    const uns = s.braceRule && s.brace !== 'secure' && (loaded || soon);
    s.gLoad = soon && s.brace !== 'secure' ? Math.max(L.g, GLOAD.impact) : L.g;
    if (uns && !s.unsecure && s.t >= (s.noUnsecEvt || 0) && s.t >= (s.unsecCd || 0)) { s.unsecCd = s.t + 2; evt(s, 'unsecure', { why: loaded ? L.why : 'incoming', g: s.gLoad }); }
    s.unsecure = uns;
    gTick(s, h);
    if (uns && L.g > me.injGate) { const p = 1 - Math.exp(-me.injK * (L.g - me.injGate) * h); if (s.rBrace() < p) injure(s, L.why); }
  }
  // ---- decision moments (docs/decision_moments.md, resolved in docs/mechanics_decisions.md) ----
  // The engine owns the trigger and the effects; the station layer owns the words (station_model rows M01..M09) and the answer (adapter verbs m_tight / m_loose).
  // Every effect is player-only: a per-contact modifier (a.pm: readDone classNoise sensR cap confCap trackCap solveT leadSpread solveStale coneMin overcorrect) or s.me through applyPlayer.
  // TIGHT is the drilled procedure (no ceiling, a small cost in speed or reach). LOOSE is a faster first answer with a ceiling you can see on the button.
  const MOMENT_RULES = { perHunt: 3, cooldown: 4, quietStart: 1.5, styleCap: 8, hunchRestart: 1.2, nudge: 3, nudgeBig: 4, hold: 1.2, ceilingVent: 0.92, ceilingCut: 0.85, cutDur: 1, prio: ['M07', 'M04', 'M02', 'M03', 'M01', 'M09'], defaultOn: ['M02', 'M03', 'M04', 'M07', 'M09'] };
  const CHN = ['thermal', 'reactor', 'occlusion'];
  const liveReal = s => s.an.filter(a => a.kind === 'real' && a.state !== 'disabled');
  const pmAdd = (a, o) => { a.pm = Object.assign(a.pm || {}, o); };
  const MOMENTS = {
    M01: { officer: 'Quill', key: 'sens.hunch_call',
      trigger(s) { if (s.t <= MOMENT_RULES.quietStart) return null; const open = s.an.filter(a => a.state === 'open' && a.idStatus !== 'plan' && a.idStatus !== 'hostile'); if (open.length < 3 || s.an.some(a => a.state === 'locked')) return null; const thr = s.me.readDone;
        const c = open.filter(a => !a.pm).map(a => { const d = CHN.map(ch => a.read[ch]).filter(q => q && !q.blind).map(q => q.den); return { a, top: Math.max(0, ...d), done: d.filter(x => x >= thr).length }; }).filter(o => o.top >= 0.6 * thr && o.done < 2 && classify(s, o.a).p < 0.85).sort((x, y) => y.top - x.top)[0];
        return c ? { id: c.a.id, n: c.a.id + 1 } : null; },
      tight: { nudge: -3, react: ['Quill', "Thank you, Captain. Ten minutes. You'll have a real one."], trust: 'quill', fx(s, c, o) { pmAdd(s.an[c.id], { classNoise: 0.85, readDone: o.drilled ? 0.85 : 1 }); } },
      loose: { nudge: 3, react: ['Castellan', "Atta girl. Gut's a sensor too."], look: "(Quill's pen stops.)", fx(s, c) { pmAdd(s.an[c.id], { readDone: 0.6, sensR: 1.15, cap: 0.7, classNoise: 1.5, confCap: 0.7, trackCap: 1.5, hunch: true }); } } },
    M02: { officer: 'Quill', key: 'sens.narrow_ping', trigger: () => null,   // raised by momentPing(), not by the clock
      tight: { nudge: -3, react: ['Abara', 'Loud and certain. I can work with certain.'], trust: 'quill', fx(s, c) { pingContact(s, c.id); } },
      loose: { nudge: 3, react: ['Dace', "A whisper. Lovely. Less heat in my sink, too, not that anyone asked."], look: "(Quill's pen stops.)", fx(s, c) { const a = s.an[c.id]; if (pingContact(s, c.id, { glow: 0.5, alert: 0.6, rounds: 2, scan: 0.6 }) && a.state === 'open') pmAdd(a, { cap: 0.7, pingCap: true, until: s.t + 2 }); } } },
    M03: { officer: 'Abara', key: 'tac.first_solution',
      trigger(s) { const a = s.an.find(x => x.state === 'locked' && ['real', 'friend', 'lure'].includes(x.kind)); return a ? { id: a.id, n: a.id + 1 } : null; },   // any first lock: the trigger must not leak what the contact really is
      tight: { nudge: -3, react: ['Quill', 'Checked numbers, Captain. I can check them again if you like.'], trust: 'quill', fx(s, c) { pmAdd(s.an[c.id], { solveT: 0.85 }); } },
      loose: { nudge: 3, react: ['Castellan', 'There she goes. Nobody leads like Abara when she\'s let off the leash.'], look: '(Quill glances at the ceiling.)', fx(s, c) { pmAdd(s.an[c.id], { leadSpread: 0.7, solveStale: 0.65, overcorrect: true }); } } },
    M04: { officer: 'Abara', key: 'tac.stale_solution', big: true,
      trigger(s) { if (!s.tubes.some(x => s.t >= x) || !s.mag || s.mag.total <= 0) return null; const a = s.an.find(x => x.state === 'locked' && x.stale && x.anchor && x.kind !== 'friend' && uncertainty(s, x).conf >= 0.5); return a ? { id: a.id, n: a.id + 1 } : null; },
      tight: { nudge: -4, react: ['Quill', "Good. I'll give her a fresh fix to work from."], trust: 'quill', fx(s, c) { pmAdd(s.an[c.id], { solveT: 0.85 }); refreshSolution(s, c.id); } },
      loose: { nudge: 4, react: ['Dace', "Oh, bold. I love it. I'm going to go stand somewhere sturdy."], look: '(Quill\'s pen stops.)', fx(s, c) { const a = s.an[c.id]; pmAdd(a, { solveStale: 1.5 * pmv(a, 'solveStale', 1), coneMin: 4 }); a.stale = false; a.solve = 1; report(s, 'Abara', `Old numbers on contact ${a.id + 1}. Tube is yours, Captain.`, 'info'); } } },
    M07: { officer: 'Dace', key: 'heat.vent_timing',
      trigger(s) { return !s.vent.on && s.sink.h >= 0.65 && !seenInc(s).length && !s.spool ? { n: 0 } : null; },
      tight: { nudge: -3, react: ['Quill', 'On schedule. Thank you. Schedules are how people stay alive.'], trust: 'quill', fx(s) { startVent(s); } },
      loose: { nudge: 3, react: ['Dace', "Oh, you won't regret this. You might. You won't."], look: '(Quill takes a long breath.)', fx(s) { s.mom.hold = { kind: 'vent', t0: s.t, last: s.t, calm: 0, know: liveReal(s).reduce((q, a) => q + (a.know || 0), 0) }; report(s, 'Dace', 'Holding the vent for a quiet moment. Say the word and I dump it now.', 'info'); } } },
    M09: { officer: 'Dace', key: 'heat.analyst_load',
      trigger(s) { const tasked = s.analysts.filter(w => w.task != null).length, prev = s.mom.sinkPrev; return s.sink.h >= 0.5 && prev != null && s.sink.h > prev && tasked >= 2 ? { n: 0 } : null; },
      tight: { nudge: -3, react: ['Quill', 'Slower reads. My reads. But steady ones. Acceptable.'], trust: 'quill', fx(s) { applyPlayer(s, { mul: { glowFocus: 0.8, glowTrack: 0.8, readDone: 1.15 } }); } },
      loose: { nudge: 3, react: ['Dace', "Flat out it is. Music's going on in the thermal bay. For morale. Mine."], look: '(Quill\'s pen stops.)', fx(s) { applyPlayer(s, { mul: { glowFocus: 1.25, glowTrack: 1.25, readDone: 0.9 } }); s.mom.cutArmed = true; } } }
  };
  // Underway moments (M06 bearings, M08 reserve tanks, M10 leg plot) are prep: the choice is made before the hunt and passed as newHunt(seed, { prep: { M06: 'loose' } }).
  const PREP = {
    M06: { tight: { mul: { redHeat: 0.8 } }, loose: { mul: { sig: 0.8, shipSpeed: 0.95 }, set: { noRedline: 1 } } },
    M08: { tight: { mul: { ventFull: 0.9 } }, loose: { mul: { sink: 1.2, ventFull: 1.2 }, set: { forceAt: 0.9 } } },
    M10: { tight: { mul: { darkHaz: 0.85 } }, loose: { mul: { darkWindow: 0.7 } } }
  };
  function mom(s) { return s.mom || (s.mom = { n: 0, fired: {}, by: {}, lastT: null, open: null, picks: [], pending: null, hold: null, sinkPrev: null, cutArmed: false, cutCd: 0 }); }
  function momAllowed(s, id) {
    const m = mom(s), d = MOMENTS[id]; if (!d || s.over || s.spool || s.tut || m.open) return false;
    if (m.n >= MOMENT_RULES.perHunt || m.fired[id] || (m.by[d.officer] || 0) >= (d.officer === 'Abara' ? 2 : 1)) return false;
    return s.t > MOMENT_RULES.quietStart && (m.lastT == null || s.t - m.lastT >= MOMENT_RULES.cooldown);
  }
  function momRaise(s, id, ctx) { const m = mom(s), d = MOMENTS[id]; m.open = { id, ctx, t: s.t }; m.fired[id] = true; m.n++; m.by[d.officer] = (m.by[d.officer] || 0) + 1; m.lastT = s.t; evt(s, 'moment', { id, n: ctx.n || 0, ctx }); return id; }
  function momentPing(s, id, o = {}) {   // the adapter asks before every ping: true means the ping is held while the captain chooses (M02)
    if (!(o.enabled || []).includes('M02') || !momAllowed(s, 'M02')) return false;
    const a = s.an[id]; if (!a || !['open', 'locked'].includes(a.state) || a.idStatus === 'plan' || s.t < s.pingCd || s.t < s.quietUntil) return false;
    if (!liveReal(s).some(b => (b.know || 0) >= 0.3)) return false;   // nobody is listening yet: a ping costs nothing extra to think about
    mom(s).pending = { id, t: s.t }; momRaise(s, 'M02', { id, n: id + 1 }); return true;
  }
  function momentCheck(s, o = {}) {   // run every frame by the adapter; returns the id it raised, if any
    if (s.over || s.tut) return null; const m = mom(s), en = o.enabled || MOMENT_RULES.defaultOn;
    for (const a of s.an) if (a.pm) {   // modifiers that lift or lapse
      if (a.pm.hunch && CHN.filter(ch => a.read[ch] && !a.read[ch].blind && a.read[ch].den >= s.me.readDone * MOMENT_RULES.hunchRestart).length >= 2) { a.pm = null; report(s, 'Quill', `Full processors on contact ${a.id + 1}. That's a reading now, not a guess. The cap is off.`, 'good'); }
      else if (a.pm.until != null && s.t >= a.pm.until) { if (a.pm.pingCap) { delete a.pm.cap; delete a.pm.pingCap; } delete a.pm.until; }
    }
    if (m.hold && m.hold.kind === 'vent') {   // M07 loose: hold the vent for a quiet moment, up to the ceiling
      const h = m.hold, know = liveReal(s).reduce((q, a) => q + (a.know || 0), 0), dt = s.t - h.last; h.last = s.t;
      if (s.vent.on) { m.hold = null; }
      else { h.calm = know > h.know + 0.005 || seenInc(s).length ? 0 : h.calm + dt; h.know = know;
        if (s.sink.h >= MOMENT_RULES.ceilingVent || h.calm >= 0.5 || s.t - h.t0 > 8) { const was = [s.me.ventFull, s.me.ventAfterglow]; applyPlayer(s, { mul: { ventFull: 0.75 }, set: { ventAfterglow: 0.8 } }); m.hold = null; if (startVent(s)) m.fast = { was }; else { s.me.ventFull = was[0]; s.me.ventAfterglow = was[1]; } } }
    }
    if (m.fast && !s.vent.on) { s.me.ventFull = m.fast.was[0]; s.me.ventAfterglow = m.fast.was[1]; m.fast = null; }   // the fast fins are for that one vent
    if (m.cutArmed && s.sink.h >= MOMENT_RULES.ceilingCut && s.t >= m.cutCd) { m.cutCd = s.t + 4; s.cutUntil = s.t + MOMENT_RULES.cutDur; for (const w of s.analysts) w.task = null; report(s, 'Dace', 'Sink is at eighty-five. Cutting the stations for a minute, Captain. Sorry. Not sorry.', 'danger', true); }
    m.sinkPrev = m.sinkLast ?? null; m.sinkLast = s.sink.h;   // M09 asks whether the sink is rising: this check against the one before
    if (m.pending && s.t - m.pending.t > MOMENT_RULES.hold && m.open) moment(s, 'M02', 'tight', {});   // nobody answered: the ping goes out as asked
    if (m.open) return null;
    const c = MOMENT_RULES.prio.filter(id => en.includes(id) && momAllowed(s, id)).map(id => ({ id, ctx: MOMENTS[id].trigger(s) })).find(x => x.ctx);
    return c ? momRaise(s, c.id, c.ctx) : null;
  }
  function moment(s, id, side, o = {}) {   // the captain's answer. Returns { ok, nudge, react: [who, line], look, trust, officer } or { ok: false }
    const m = mom(s), d = MOMENTS[id], op = d && d[side]; if (!op || !m.open || m.open.id !== id) return { ok: false };
    const c = m.open.ctx; m.open = null; if (o.id != null && c.id == null) c.id = o.id;
    op.fx(s, c, o); if (id === 'M02') m.pending = null; m.picks.push({ id, side, t: s.t });
    evt(s, 'moment_pick', { id, side });
    return { ok: true, nudge: op.nudge, react: op.react, look: op.look || null, trust: op.trust || null, officer: d.officer, side };
  }
  function prep(opts, picks) {   // underway moments: { M06: 'loose' } -> an opts block for newHunt (opts.player is applied through applyPlayer at the start)
    const mod = { mul: {}, set: {} }; let nudge = 0;
    for (const k in picks || {}) { const p = PREP[k] && PREP[k][picks[k]]; if (!p) continue; Object.assign(mod.mul, p.mul || {}); Object.assign(mod.set, p.set || {}); nudge += picks[k] === 'loose' ? MOMENT_RULES.nudge : -MOMENT_RULES.nudge; }
    return Object.assign({}, opts, { player: mod, prepNudge: nudge });
  }
  // ---- probe sets (docs/station_model.md s8.3-8.4, docs/mechanics_probes.md): a matched rack of two, a radio or a laser link back to the ship ----
  // A set is deployed against one contact and refines it on every pulse while its link is up. Radio works whatever the ship does and is an emission (glow, and an alert now and then:
  // it can be direction-found). Laser is silent but needs the ship to hold course and speed (a 5 percent speed change or 3 degrees of heading breaks it); the link comes back after the ship has
  // been steady for half a minute. Sets are never mixed, are not reloadable once out, and come back only by radio hail.
  const PSET = {
    orrin: { lineage: 'Orrin', name: 'Orrin recon array', size: 4, links: ['radio', 'laser'], range: 70, endurance: 7, loud: 0.35 },
    vask: { lineage: 'Vask', name: 'Vask line-fleet array', size: 6, links: ['radio'], range: 110, endurance: 12, loud: 1.0 },
    halden: { lineage: 'Halden', name: 'Halden utility array', size: 4, links: ['radio', 'laser'], range: 80, endurance: 10, loud: 0.6 }
  };
  const PRB = { launchAlert: 0.05, radioGlow: 0.014, radioAlert: 0.02, radioEvery: 1, pulse: 0.4, tolSpeed: 0.05, tolHdg: 3 * Math.PI / 180, reacq: 0.5, fixW: { 2: 0.4, 3: 0.7, 4: 1, 6: 1.2 }, recover: 1, hail: 0.1 };
  function newRack(spec) { return (spec || ['orrin', 'halden']).map((k, i) => Object.assign({ id: 'ABCD'[i], key: k, state: 'rack', link: null, target: null, t0: null, linkOk: false, v0: null, vref: null, steady: 0, lastPulse: 0, pulses: 0, alertAt: 0, recoverAt: null }, PSET[k])); }
  const vnow = s => s.vel || { vx: 0, vy: 0 };
  function probeOff(s, p) {   // has the ship changed velocity since this link was set? returns the cause or null
    const v = vnow(s), sp = Math.hypot(v.vx, v.vy), sp0 = Math.hypot(p.v0.vx, p.v0.vy);
    if (Math.abs(sp - sp0) > PRB.tolSpeed * Math.max(sp0, 1.2)) return 'speed';
    if (sp > 0.5 && sp0 > 0.5) { let dh = Math.atan2(v.vy, v.vx) - Math.atan2(p.v0.vy, p.v0.vx); dh = Math.abs(Math.atan2(Math.sin(dh), Math.cos(dh))); if (dh > PRB.tolHdg) return 'heading'; }
    return null;
  }
  function deployProbes(s, setId, contactId, link) {
    const p = s.pset.find(q => q.id === setId), a = s.an[contactId];
    if (s.over || !p || p.state !== 'rack' || !a || !['open', 'locked'].includes(a.state) || a.idStatus === 'plan') return false;
    const steady = s.posture !== 'evade' && !s.burn; link = link || (p.links.includes('laser') && steady ? 'laser' : 'radio'); if (!p.links.includes(link)) return false;
    const dp = displayPos(s, a), d = Math.hypot(dp.x - s.player.x, dp.y - s.player.y);
    if (d > p.range) { report(s, 'Quill', `Contact ${a.id + 1} is ${Math.round(d)} km out. The ${p.lineage} set reaches ${p.range}.`, 'bad'); return false; }
    Object.assign(p, { state: 'out', link, target: a.id, t0: s.t, lastPulse: s.t, steady: 0, pulses: 0, v0: Object.assign({}, vnow(s)), vref: null, linkOk: true, alertAt: s.t + PRB.radioEvery });
    alert(s, PRB.launchAlert); evt(s, 'probe_out', { set: p.id, n: a.id + 1, link, lineage: p.lineage, size: p.size });
    report(s, 'Quill', `${p.lineage} set ${p.id} away on contact ${a.id + 1}, ${link} link.`, 'info'); return true;
  }
  function setProbeLink(s, setId, link) {
    const p = s.pset.find(q => q.id === setId); if (s.over || !p || p.state !== 'out' || !p.links.includes(link) || p.link === link && p.linkOk) return false;
    p.link = link; p.linkOk = true; p.v0 = Object.assign({}, vnow(s)); p.steady = 0; evt(s, 'probe_link', { set: p.id, state: 'up', link }); report(s, 'Quill', `Set ${p.id} on ${link}.`, 'info'); return true;
  }
  function recoverProbes(s, setId) {
    const p = s.pset.find(q => q.id === setId); if (s.over || !p || p.state !== 'out') return false;
    p.state = 'recovering'; p.recoverAt = s.t + PRB.recover; alert(s, PRB.hail, 1.5); report(s, 'Quill', `Hailing set ${p.id} home. That is an emission, Captain.`, 'bad'); return true;
  }
  function linkNeeded(s, kind) {   // would this order break a laser link that is up? false, or { sets }
    if (s.over || !['evade', 'redline', 'burn', 'spool', 'turn'].includes(kind)) return false;
    const sets = s.pset.filter(p => p.state === 'out' && p.link === 'laser' && p.linkOk).map(p => p.id); return sets.length ? { sets } : false;
  }
  function probeGlow(s) { return s.pset.reduce((q, p) => q + (p.state === 'out' && p.link === 'radio' ? p.loud * PRB.radioGlow : 0), 0); }
  function probeStep(s, h) {
    for (const p of s.pset) {
      if (p.state === 'recovering') { if (s.t >= p.recoverAt) { p.state = 'recovered'; evt(s, 'probe_recovered', { set: p.id }); report(s, 'Quill', `Set ${p.id} is back aboard. It cannot be redeployed this hunt.`, 'good'); } continue; }
      if (p.state !== 'out') continue;
      if (s.t - p.t0 > p.endurance) { p.state = 'lost'; p.linkOk = false; evt(s, 'probe_lost', { set: p.id, cause: 'endurance' }); report(s, 'Quill', `Set ${p.id} has run out of battery. It is drifting.`, 'bad'); continue; }
      if (p.link === 'laser') {
        if (p.linkOk) { const why = probeOff(s, p); if (why) { p.linkOk = false; p.steady = 0; p.vref = Object.assign({}, vnow(s)); evt(s, 'probe_link', { set: p.id, state: 'broken', cause: why, link: 'laser' }); report(s, 'Quill', `Laser link on set ${p.id} broken: we changed ${why}. The picture is ageing.`, 'bad'); } }
        else { const v = vnow(s); if (Math.hypot(v.vx - p.vref.vx, v.vy - p.vref.vy) > 0.05 * Math.max(1.2, Math.hypot(p.vref.vx, p.vref.vy))) { p.vref = Object.assign({}, v); p.steady = 0; } else p.steady += h;
          if (p.steady >= PRB.reacq) { p.linkOk = true; p.v0 = Object.assign({}, v); p.steady = 0; evt(s, 'probe_link', { set: p.id, state: 'up', link: 'laser' }); report(s, 'Quill', `Laser link on set ${p.id} reacquired.`, 'good'); } }
      } else if (s.t >= p.alertAt) { alert(s, PRB.radioAlert * p.loud); p.alertAt = s.t + PRB.radioEvery; }
      const a = p.target != null ? s.an[p.target] : null;
      if (p.linkOk && a && ['open', 'locked'].includes(a.state) && s.t - p.lastPulse >= PRB.pulse) {
        p.lastPulse = s.t; p.pulses++; const w = PRB.fixW[p.size] || 1;
        if (a.state === 'locked' && a.anchor) { a.track = Math.max(a.track, 2); scan(s, a, 1.2 * w); a.probeAt = s.t; }
        else if (a.state === 'open') for (const c of CHN) obsRead(s, a, c, s.me.pingWeight * w, 0.2, 1);
        if (p.pulses === 1) { evt(s, 'probe_fix', { set: p.id, n: a.id + 1 }); report(s, 'Quill', `Probe fix on contact ${a.id + 1}.`, 'good'); }
      }
    }
  }
  function setPellAct(s, on) { s.pellAct = !!on && s.integration >= 75; }
  return { rsFx, firingSolution, hunchFor, hunchAnswer, launchDecoy, decoyPos, decoyLit, commandDestruct, NAV_STYLES, G_DETENTS, snapG, gBand, autoRoute, previewRoute, gPhys: gPhysNow, gState, upcomingLoad, forceLoad, knockOut, moveKo, captainTakes, captainLeaves, koOf, evt, brgOf, setPD, probe: probeSalvo, markHostile, pdIntercept, emit, setDifficulty, getDifficulty, DIFFICULTY, applyPlayer, RULES, PLAYER, AI, maneuver, trackState, redlineBurn, navBlocked, reanalyze, investigate, heatRate, visIf, arenaPlan, PARTS, MODULES, salvage, reactOf, WARHEAD, HPMAX, dmgEst, landings, perf, symbolFor, shipClass, LOADOUTS, startVent, stopVent, ourVis, enemyVis, infoMult, backdrop, blocked, rangeF, refreshSolution, uncertainty, missilePos, setRoute, relBearing, planInfo, navState, navStart, enemyThrust, enemyState, solveInfo, resolution, P, POSTURE, ANALYSTS, THRESH, goQuiet, advice, setPellAct, newHunt, tick, assign, lockContact, dismissContact, fire, retreat, fanInfo, estAt, spreadAt, START, setOrder, setSpeed, pingContact, displayPos, SPEED, truePos, selfRisk, fireClose, closeInfo, volleyFx, cat, exposure, classify, stealthState, challenge, hailContact, hailLine, HAIL, roleOf, PSET, deployProbes, setProbeLink, recoverProbes, linkNeeded, MOMENTS, MOMENT_RULES, PREP, momentCheck, momentPing, moment, prep, brace, stunned, seenInc, detectLevel, SEEKER_LINEAGE, setBrace: (s, on) => brace(s, on, 'co'), braceNeeded, crewEff, treat, GLOAD, CREW };
})();
if (typeof module !== 'undefined') module.exports = HuntRT;
