/* Balance check: five scripted captains play the same paired seeds.
 * Run: node tools/balance_bot.js [hunts=240] [difficulty=normal|easy|hard|all] [--trims] [--json]
 *   camper   never moves, never tasks an analyst; waits for a vent to mark a ship hostile, locks, fires at the tightest cone.
 *   pingfire patient like the camper, then pings the locked contact to hurry the solution and fires tight.
 *   pinger   aggressive: redline toward the nearest contact, pings everything, locks on thin odds, fires tight, coilgun in range.
 *   reader   cautious: all analysts on one contact at a time, locks only with confidence, keeps an analyst on the lock,
 *            picks lead and cone from the planner's own estimate, vents when nobody is looking, dodges incoming fire.
 *   random   a baseline that presses buttons with no plan.
 * --trims adds the old trim_bot table (cautious reader, each trim against no trim, same seeds).
 * Seeds are paired: hunt i uses seed 9000+i and 1 + i%3 warships for every strategy, so differences are the strategy's. */
const E = require('../web/hunt_rt_engine.js'), T = require('../web/trims.js');
const args = process.argv.slice(2), N = +args.find(a => /^\d+$/.test(a)) || 240, DIFF = args.find(a => /^(easy|normal|hard|all)$/.test(a)) || 'normal';
const MAXT = 90, STEP = 0.1;   // game minutes: a hunt that runs past 90 minutes counts as a loss (timeout)
const CONES = [0, 2, 4, 6, 9, 12];

function mkRand(seed) { let a = (seed * 2654435761) >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const live = s => s.an.filter(a => a.kind === 'real' && a.state !== 'disabled');
const incoming = s => (s.inc || []).length > 0;
const anyAware = s => s.an.some(a => a.kind === 'real' && a.aware && a.state !== 'disabled');
const dist = (s, a) => { const p = E.displayPos(s, a); return Math.hypot(p.x - s.player.x, p.y - s.player.y); };
function sinkCare(s, cautious) {
  if (s.vent.on) { if (!s.vent.forced && s.sink.h < (cautious ? 0.25 : 0.3)) E.stopVent(s); if (cautious && !s.vent.forced && (incoming(s) || anyAware(s)) && s.sink.h < 0.7) E.stopVent(s); return; }
  if (cautious) { if (s.sink.h > 0.92 || (s.sink.h > 0.7 && !anyAware(s) && !incoming(s))) E.startVent(s); }
  else if (s.sink.h > 0.85) E.startVent(s);
}
function bestCone(s, a, r) { let best = null; for (const c of CONES) { const d = E.dmgEst(s, a, null, c, 'he', 120, r); if (!best || d.exp > best.exp) best = { c, exp: d.exp, p: d.p }; } return best; }
function fireReady(s, a) { return a.state === 'locked' && (a.solve || 0) >= 1 && !a.stale; }

const STRATS = {
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
  reader(s, k, r, mem) {
    sinkCare(s, true);
    if (s.hull < 25 && !s.spool) { E.retreat(s); return; }
    if (incoming(s)) { if (s.posture !== 'evade') { const v = s.inc[0]; E.setOrder(s, 'evade', v.id); E.setSpeed(s, 'v4'); mem.evadeUntil = s.t + 1.5; } }
    else if (s.posture === 'evade' && s.t > (mem.evadeUntil || 0)) { E.setOrder(s, 'still', null); E.setSpeed(s, 'v2'); }
    // decide
    for (const a of s.an) if (a.state === 'open') { const c = E.classify(s, a); if (a.idStatus === 'hostile' || (c.n >= 2 && c.post.real > 0.9)) E.lockContact(s, a.id); else if (c.n >= 2 && c.post.real < 0.04 && c.p > 0.9) E.dismissContact(s, a.id); }
    // analysts: keep one on each lock that is not ready, the rest work the most promising open contact
    const locked = s.an.filter(a => a.state === 'locked'), open = s.an.filter(a => a.state === 'open' && a.idStatus !== 'plan');
    const need = locked.filter(a => !fireReady(s, a) || E.trackState(s, a).state !== 'lock');
    const focus = open.map(a => ({ a, c: E.classify(s, a) })).sort((x, y) => (y.c.post.real - x.c.post.real) || (x.c.n - y.c.n))[0];
    s.analysts.forEach((w, i) => {
      let want = null;
      if (need.length && (i === 0 || !focus)) want = need[i % need.length].id;
      else if (focus) want = focus.a.id; else if (locked.length) want = locked[i % locked.length].id;
      if (w.task !== want) { if (w.task != null) E.assign(s, w.id, w.task); if (want != null) E.assign(s, w.id, want); }
    });
    for (const a of locked) {
      if (a.stale) { E.refreshSolution(s, a.id); continue; }
      if (fireReady(s, a) && !s.vent.on) { const st = E.trackState(s, a).state; if (st === 'last') continue; const b = bestCone(s, a, r); if (b.p > 0.35) E.fire(s, a.id, null, b.c); }
    }
  },
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

function play(strat, seed, nreal, diff, trims = []) {
  if (E.setDifficulty) E.setDifficulty(diff);
  if (!E.setDifficulty) T.applyP(E.P, trims);   // the old engine had no per-ship profile: trims went into the global P
  const s = E.newHunt(seed, { nreal }); T.applyShip(s, trims);
  const r = mkRand(seed * 7 + 3), mem = {}; let k = 0;
  while (!s.over && s.t < MAXT) { STRATS[strat](s, k++, r, mem); E.tick(s, STEP); }
  const win = s.over === 'win';
  return { win, over: s.over || 'timeout', hull: s.hull, t: s.t, kills: s.disabled || 0, nreal, found: s.an.some(a => a.kind === 'real' && (a.aware || a.lastFire != null)) };
}
function run(strat, diff, trims) {
  const R = { n: 0, win: 0, hullW: 0, t: 0, timeout: 0, dead: 0, spool: 0, per: { 1: [0, 0], 2: [0, 0], 3: [0, 0] }, hulls: [] };
  for (let i = 0; i < N; i++) {
    const nreal = 1 + (i % 3), q = play(strat, 9000 + i, nreal, diff, trims);
    R.n++; R.t += q.t; R.per[nreal][1]++; R.hulls.push(q.hull);
    if (q.win) { R.win++; R.hullW += q.hull; R.per[nreal][0]++; }
    else if (q.over === 'timeout') R.timeout++; else if (q.hull <= 0) R.dead++; else R.spool++;
  }
  R.hulls.sort((a, b) => a - b);
  return { strat, diff, win: R.win / R.n, hullW: R.win ? R.hullW / R.win : 0, t: R.t / R.n, timeout: R.timeout / R.n, dead: R.dead / R.n, spool: R.spool / R.n, w1: R.per[1][0] / R.per[1][1], w2: R.per[2][0] / R.per[2][1], w3: R.per[3][0] / R.per[3][1], p10: R.hulls[Math.floor(R.n / 10)] };
}
const TARGET = { camper: [0, 25], pingfire: [0, 60], pinger: [0, 45], reader: [65, 85], random: [0, 20] };
const pc = x => (x * 100).toFixed(0).padStart(4);
function table(diff) {
  const rows = Object.keys(STRATS).map(k => run(k, diff));
  console.log(`\n[${diff}] ${N} hunts per strategy (1-3 warships, paired seeds)`);
  console.log('strategy   win%  1-ship 2-ship 3-ship  hull(wins)  hull p10  dead%  timeout%  min   target');
  for (const r of rows) {
    const tg = TARGET[r.strat], ok = diff !== 'normal' ? '' : (r.win * 100 >= tg[0] && r.win * 100 < tg[1] + (tg[0] ? 0.0001 : 0) && (r.strat !== 'reader' || (r.hullW >= 40 && r.hullW <= 75))) ? 'ok' : 'MISS';
    console.log(r.strat.padEnd(9), pc(r.win), '  ', pc(r.w1), '  ', pc(r.w2), '  ', pc(r.w3), '      ', r.hullW.toFixed(0).padStart(3), '       ', String(Math.round(r.p10)).padStart(3), '  ', pc(r.dead), '   ', pc(r.timeout), '  ', r.t.toFixed(1).padStart(5), ' ', (tg[0] ? tg[0] + '-' + tg[1] : '<' + tg[1]).padEnd(6), ok);
  }
  return rows;
}
const out = {};
for (const d of DIFF === 'all' ? ['easy', 'normal', 'hard'] : [DIFF]) out[d] = table(d);
if (args.includes('--trims')) {
  const base = run('reader', 'normal', []); console.log('\ntrim (cautious reader, normal)  win  hull(wins)  min    vs none');
  for (const id of Object.keys(T.T)) if (T.T[id].hunt !== false && !T.T[id].salvo) { const q = run('reader', 'normal', [id]); console.log(id.padEnd(30), pc(q.win), '   ', q.hullW.toFixed(0).padStart(3), '   ', q.t.toFixed(1).padStart(5), '  ', ((q.win - base.win) * 100).toFixed(1).padStart(5), 'pts'); }
  if (E.setDifficulty) E.setDifficulty('normal'); else T.applyP(E.P, []);
}
if (args.includes('--json')) console.log(JSON.stringify(out));
