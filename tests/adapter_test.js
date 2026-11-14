// Station adapter + salvo presets (web/station_adapter.js, web/salvo_presets.js). node tests/adapter_test.js
const E = require('../web/hunt_rt_engine.js'), AD = require('../web/station_adapter.js'), SP = require('../web/salvo_presets.js');
let bad = 0; const chk = (m, c) => { console.log(c ? 'ok   ' : 'FAIL ', m); if (!c) bad++; };
const SPM = E.RULES.secPerMin;
const step = (A, s, secs, dt = 0.25) => { for (let t = 0; t < secs && !s.over; t += dt) { E.tick(s, dt / SPM); A.update(s, dt); } };
const reals = s => s.an.filter(a => a.kind === 'real');

// presets
{ chk('four presets: Ambush, Snap shot, Probe, Saturation', ['Ambush', 'Snap shot', 'Probe', 'Saturation'].every(n => Object.values(SP.PRESETS).some(p => p.name === n)));
  chk('every preset has pattern, RTE 3-30 s, homing, wire, warhead, cone, count', Object.values(SP.PRESETS).every(p => SP.PATTERNS.includes(p.pattern) && p.rte >= 3 && p.rte <= 30 && typeof p.homing === 'boolean' && typeof p.wire === 'boolean' && p.warhead && p.cone >= 0 && p.count >= 1));
  const f = SP.toFire(SP.get('saturation')); chk('saturation maps to two tubes and a wide cone', f.tubes === 2 && f.cone >= 12);
  chk('probe preset is 1-2 missiles through E.probe', SP.toFire(SP.get('probe')).probe === 2 && SP.toFire(SP.get('probe')).tubes === 0);
  chk('pattern, RTE and wire are flagged as not yet simulated', SP.unsimulated().join() === 'pattern,rte,wire');
  chk('make() clamps RTE and cone', (p => p.rte === 30 && p.cone === 24)(SP.make('snap', { rte: 99, cone: 99 }))); }

// an answered 'quiet' call makes the ship quiet
{ const s = E.newHunt(31, { nreal: 2 }), A = AD.create({ engine: E, seed: 31 }); A.update(s, 0);
  const c = A.model.raise('X1', { n: reals(s)[0].id + 1 }); step(A, s, 1);
  chk('X1 raised to the CO', A.model.pending().some(x => x.id === c.id));
  A.model.answer(c.id, 0); step(A, s, 5);
  chk('answered Go quiet reaches the engine (s.quietUntil in the future)', s.t < s.quietUntil && A.done.some(d => d.verb === 'quiet' && d.ok && d.by === 'co')); }

// a vampire call's default sets point defence
{ const s = E.newHunt(32, { nreal: 2 }), A = AD.create({ engine: E, seed: 32 }); A.update(s, 0);
  E.evt(s, 'vampire', { n: 1, id: reals(s)[0].id, bearing: 90, eta: 10 / SPM, etaSec: 10, at: s.t + 10 / SPM }); step(A, s, 10);
  chk('an unanswered vampire call defaults to Go active (doctrine active-on-vampire) and the engine PD goes active', A.done.some(d => d.verb === 'pd_active' && d.by === 'default') && (s.pd === 'active' || s.evts.some(e => e.type === 'pd' && e.data.state === 'active')));
  const s2 = E.newHunt(33, { nreal: 2 }), A2 = AD.create({ engine: E, seed: 33 }); A2.update(s2, 0);
  E.evt(s2, 'vampire', { n: 1, id: reals(s2)[0].id, bearing: 90, eta: 60 / SPM, etaSec: 60, at: s2.t + 60 / SPM }); step(A2, s2, 10);
  chk('with a long eta the crew holds PD cold and waits for eta <= 12 s', s2.pd === 'armed' && A2.pdPending);
  step(A2, s2, 45); chk('then goes active before impact', s2.evts.some(e => e.type === 'pd' && e.data.state === 'active')); }

// a radial (proactive) order goes through the lifecycle and reaches the engine
{ const s = E.newHunt(34, { nreal: 2 }), A = AD.create({ engine: E, seed: 34 }); A.update(s, 0); const stages = [];
  const tgt = s.an.find(a => a.state === 'open' && a.idStatus !== 'plan');
  const o1 = A.order('sensors', 'classify', 'Classify', { id: tgt.id }); A.model.on(e => { if (e.type === 'order' && e.order === o1) stages.push(e.stage); }); stages.push(o1.stage); step(A, s, 6);
  chk('radial Classify: issued, acked, executing, reported', stages.join() === 'issued,acked,executing,reported');
  chk('and all analysts are on that contact', s.analysts.every(w => w.task === tgt.id));
  const mag0 = s.mag.total; A.order('weapons', 'probe', 'Probe', { id: tgt.id }); step(A, s, 6);
  chk('radial Probe spends real missiles through E.probe', s.mag.total === mag0 - 2 && (s.probes.length === 1 || s.evts.some(e => /probe_/.test(e.type))));
  const r = reals(s)[0]; E.lockContact(s, r.id); r.solve = 1; A.setPreset('saturation'); const v0 = s.volleys.length;
  A.order('weapons', 'fire', 'Fire', { id: r.id }); step(A, s, 6);
  chk('Fire with the Saturation preset fires two tubes', s.volleys.length === v0 + 2 && s.volleys.slice(-2).every(v => v.cone === 16 && v.homing));
  A.order('helm', 'baseline', 'Give a baseline', {}); step(A, s, 6);
  chk('a verb the engine cannot do yet is a logged no-op with a TODO', A.noops.some(n => n.verb === 'baseline' && /TODO/.test(n.why))); }

// headless hunts: all-Auto crew, and a scripted CO bot that answers calls
function hunt(seed, bot) {
  const s = E.newHunt(seed, { nreal: 2 }), A = AD.create({ engine: E, seed, command: 'tight' }); A.update(s, 0);
  const rs = reals(s); for (const a of rs) E.lockContact(s, a.id); E.setRoute(s, [{ x: rs[0].x0, y: rs[0].y0 }]);
  let err = null, answered = 0; const seen = {};
  try {
    for (let t = 0, dt = 0.5; t < 24 * SPM && !s.over; t += dt) {
      if (t === 6 * SPM || t === 12 * SPM) E.pingContact(s, rs[0].id);
      E.tick(s, dt / SPM); A.update(s, dt);
      if (bot) for (const c of A.model.pending()) { seen[c.id] = seen[c.id] || t; if (t - seen[c.id] >= 2 && c.opts) { const i = c.row === 'W2' ? 0 : (seed + c.id) % c.opts.length; if (A.model.answer(c.id, i)) answered++; } }
    }
  } catch (e) { err = e; }
  return { s, A, err, answered, st: A.model.stats() };
}
{ let worst = 0, flood = 0, errs = 0, ans = 0, execd = 0, orders = {};
  for (const bot of [false, true]) for (const seed of [11, 12, 13, 14, 15, 16]) {
    const r = hunt(seed, bot); if (r.err || r.A.errors.length) { errs++; console.log('     error', seed, bot, r.err || r.A.errors[0]); }
    worst = Math.max(worst, r.st.urgentPer20s); flood = Math.max(flood, r.st.maxBurst5s); ans += r.answered; execd += r.A.done.length;
    for (const d of r.A.done) orders[d.verb] = (orders[d.verb] || 0) + 1;
  }
  console.log(`     12 hunts: worst urgent/20s ${worst.toFixed(2)}, max calls in 5 s ${flood}, CO answers ${ans}, orders executed ${execd} ${JSON.stringify(orders)}`);
  chk('no exceptions over 6 seeded 24-minute hunts, all-Auto and with a CO bot', errs === 0);
  chk('rhythm holds with the adapter running: worst urgent per 20 s <= 1.0', worst <= 1.0);
  chk('no flood: at most 4 raised calls in any 5 s', flood <= 4);
  chk('the CO bot answered calls and orders reached the engine', ans > 10 && execd > 20); }
console.log(bad ? 'FAILED' : 'ALL OK'); process.exit(bad ? 1 : 0);
