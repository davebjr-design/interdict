/* Trim balance check: a simple bot plays the same seeds with no trim and with each trim.
 * Run: node tools/trim_bot.js [hunts]   Policy: analysts on the least-known open contacts, lock likely ships,
 * dismiss likely junk, fire when the solution is ready, vent when the sink passes 85%, retreat under 35 hull. */
const E = require('../web/hunt_rt_engine.js'), T = require('../web/trims.js');
const N = +process.argv[2] || 60;
function play(seed, trims, opts) {
  T.applyP(E.P, trims); const s = E.newHunt(seed, opts); T.applyShip(s, trims); let spooled = false;
  for (let step = 0; step < 1400 && !s.over; step++) {
    if (s.sink.h > 0.85 && !s.vent.on) E.startVent(s); else if (s.vent.on && !s.vent.forced && s.sink.h < 0.3) E.stopVent(s);
    if (s.hull < 35 && !spooled) { E.retreat && E.retreat(s); spooled = true; }
    const open = s.an.filter(a => a.state === 'open');
    for (const a of open) { const c = E.classify(s, a); if (c.n >= 2 && c.post.real > 0.8) E.lockContact(s, a.id); else if (c.n >= 2 && c.post.real < 0.06) E.dismissContact(s, a.id); }
    for (const [wi, w] of s.analysts.entries()) if (w.task == null || !['open', 'locked'].includes(s.an[w.task].state)) {
      const cands = s.an.filter(a => a.state === 'open' || (a.state === 'locked' && (a.solve || 0) < 1));
      if (cands.length) { const pick = cands[(wi + step) % cands.length]; E.assign(s, w.id, pick.id); }
    }
    for (const a of s.an) if (a.state === 'locked' && a.stale && (s.pingCd || 0) <= s.t) { E.pingContact ? E.pingContact(s, a.id) : null; }
    for (const a of s.an) if (a.state === 'locked' && (a.solve || 0) >= 1) E.fire(s, a.id, null, 8);
    if (opts.dog && !spooled && s.an.filter(a => a.kind === 'real' && a.state !== 'disabled').length === 0) { E.retreat(s); spooled = true; }
    if (opts.dog && !spooled && step > 200) { E.retreat(s); spooled = true; }
    if (opts.burn && step % 60 === 5) E.redlineBurn(s);
    E.tick(s, 0.1);
  }
  return { over: s.over || 'timeout', hull: s.hull, t: s.t, wrong: s.wrong || 0 };
}
function run(trims) {
  let win = 0, hull = 0, t = 0, wrong = 0; const per = { 1: [0, 0], 2: [0, 0] };
  for (let i = 0; i < N; i++) { const nreal = 1 + (i % 2), kind = i % 3; const r = play(5000 + i, trims, kind === 2 ? { nreal, dog: true, warn: 0.5 } : kind === 1 ? { nreal, burn: true } : { nreal }); const w = r.over === 'win' || r.over === 'jump'; win += w; hull += r.hull; t += r.t; wrong += r.wrong; per[nreal][0] += w; per[nreal][1]++; }
  return { win: win / N, hull: hull / N, t: t / N, wrong: wrong / N, w1: per[1][0] / per[1][1], w2: per[2][0] / per[2][1] };
}
const base = run([]); const rows = [['(none)', base]];
for (const id of Object.keys(T.T)) if (T.T[id].hunt !== false && !T.T[id].salvo) rows.push([id, run([id])]);
T.applyP(E.P, []);
const f = x => (x * 100).toFixed(0).padStart(4);
console.log('trim                       win  1-ship 2-ship  hull   time  wrong   verdict');
for (const [id, r] of rows) {
  const better = r.win >= base.win && r.hull >= base.hull && r.t <= base.t && r.wrong <= base.wrong, worse = r.win <= base.win && r.hull <= base.hull && r.t >= base.t;
  console.log(id.padEnd(25), f(r.win), f(r.w1), '  ', f(r.w2), '  ', r.hull.toFixed(0).padStart(4), r.t.toFixed(1).padStart(6), r.wrong.toFixed(2).padStart(6), '  ', id === '(none)' ? '' : better ? 'STRICTLY BETTER' : worse ? 'strictly worse' : 'trade');
}
