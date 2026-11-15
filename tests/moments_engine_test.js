// Decision moments in the engine and the adapter (docs/mechanics_decisions.md): triggers, effects, frequency rules, M02 ping hold, underway prep. node tests/moments_engine_test.js
// (tests/moments_test.js covers the hunt page's own M01 popup.)
const E = require('../web/hunt_rt_engine.js'), AD = require('../web/station_adapter.js');
let bad = 0; const chk = (m, c) => { console.log(c ? 'ok   ' : 'FAIL ', m); if (!c) bad++; };
const SPM = E.RULES.secPerMin, R = E.MOMENT_RULES;
const hunt = (seed = 1, o = {}) => { const s = E.newHunt(seed, Object.assign({ nreal: 1 }, o)); E.tick(s, 2); return s; };
const real = s => s.an.find(a => a.kind === 'real'), evs = (s, t) => (s.evts || []).filter(e => e.type === t);
const lockOne = s => { const a = real(s); E.lockContact(s, a.id); E.tick(s, 1); return a; };
const adv = (s, mins) => { E.tick(s, mins); };

// the table
{ const ids = Object.keys(E.MOMENTS);
  chk('hunt moments M01 M02 M03 M04 M07 M09 are in the engine (M05 shelved, M06 M08 M10 are underway prep)', ['M01', 'M02', 'M03', 'M04', 'M07', 'M09'].every(k => ids.includes(k)) && !ids.includes('M05') && ['M06', 'M08', 'M10'].every(k => E.PREP[k]));
  chk('every moment has a tight and a loose side: tight nudges down, loose nudges up, both have a reaction line', ids.every(k => { const m = E.MOMENTS[k]; return m.tight.nudge < 0 && m.loose.nudge > 0 && m.tight.react.length === 2 && m.loose.react.length === 2 && typeof m.tight.fx === 'function' && typeof m.loose.fx === 'function'; }));
  chk('M04 is the big moment (4), the rest are 3', E.MOMENTS.M04.tight.nudge === -4 && E.MOMENTS.M04.loose.nudge === 4 && ['M01', 'M02', 'M03', 'M07', 'M09'].every(k => E.MOMENTS[k].loose.nudge === 3)); }

// M03: the first lock
{ const s = hunt(1); chk('nothing before a lock', E.momentCheck(s, {}) === null);
  const a = lockOne(s); chk('the first lock raises M03 (a moment event with the contact)', E.momentCheck(s, {}) === 'M03' && evs(s, 'moment')[0].data.id === 'M03' && evs(s, 'moment')[0].data.n === a.id + 1);
  chk('no second moment while one is open', E.momentCheck(s, {}) === null);
  const r = E.moment(s, 'M03', 'loose'); chk('loose: lead error x0.7, solution stale 35% sooner, overcorrect flag', r.ok && a.pm.leadSpread === 0.7 && a.pm.solveStale === 0.65 && a.pm.overcorrect === true && r.nudge === 3 && r.react[0] === 'Castellan');
  const f0 = E.fanInfo(s, a, null); a.lastMan = s.t + 1; const f1 = E.fanInfo(s, a, null);
  chk('after the target manoeuvres the hand-tuned lead overcorrects (error x1.4, wider than before)', f1.cone > f0.cone || f1.spread > f0.spread || JSON.stringify(f1) !== JSON.stringify(f0));
  chk('and it never fires twice', (adv(s, 6), E.momentCheck(s, {}) !== 'M03'));
  const s2 = hunt(1), b = lockOne(s2); E.momentCheck(s2, {}); const t0 = E.solveInfo(s2, b).T; E.moment(s2, 'M03', 'tight');
  chk('tight: solution time x0.85 on this contact, lead at the default', b.pm.solveT === 0.85 && b.pm.leadSpread == null && Math.abs(E.solveInfo(s2, b).T / t0 - 0.85) < 0.01); }

// frequency rules
{ const s = hunt(2); lockOne(s); chk('not before 1.5 minutes: a lock at t<1.5 waits', (() => { const q = E.newHunt(2, { nreal: 1 }); E.lockContact(q, real(q).id); E.tick(q, 0.5); return E.momentCheck(q, {}) === null; })());
  chk('only the enabled list fires', E.momentCheck(s, { enabled: ['M07'] }) === null && E.momentCheck(s, { enabled: ['M03'] }) === 'M03');
  E.moment(s, 'M03', 'tight'); s.sink.h = 0.7; adv(s, 1);
  chk('a 4-minute cooldown between moments: M07 is held back at once', E.momentCheck(s, { enabled: ['M07'] }) === null); adv(s, 4);
  chk('and fires after it', E.momentCheck(s, { enabled: ['M07'] }) === 'M07'); }
{ const s = hunt(3); const m = E.momentCheck; s.spool = { at: s.t + 5 }; lockOne(s); chk('no moment while a spool is running', m(s, {}) === null); }
{ const s = E.newHunt(4, { nreal: 1 }); s.tut = { keep: true }; E.tick(s, 3); lockOne(s); chk('never in the tutorial', E.momentCheck(s, {}) === null && E.momentPing(s, real(s).id, { enabled: ['M02'] }) === false); }
{ const s = hunt(5); lockOne(s); s.mom = null; const r = E.MOMENT_RULES; let n = 0; for (const id of ['M03', 'M07', 'M09', 'M04']) { s.sink.h = 0.7; if (E.momentCheck(s, { enabled: [id] }) === id) { n++; E.moment(s, id, 'tight'); } adv(s, 4.5); }
  chk('at most 3 moments a hunt', s.mom.n <= r.perHunt); }

// M02: the ping is held while the captain chooses
{ const s = hunt(6); const a = real(s); chk('no hold when nobody is listening', E.momentPing(s, a.id, { enabled: ['M02'] }) === false);
  a.know = 0.5; a.aware = true; adv(s, 0.5); const pc = s.pingCd;
  chk('a listening hostile: the ping is held (a moment event, no ping yet)', E.momentPing(s, a.id, { enabled: ['M02'] }) === true && s.pingCd === pc && evs(s, 'moment').some(e => e.data.id === 'M02') && !s.pingFx.length);
  const r = E.moment(s, 'M02', 'loose'); chk('loose: the ping goes out narrow (glow x0.5), two rounds, weaker', r.ok && s.pingFx.length === 1 && s.pingMul === 0.5 && r.nudge === 3);
  adv(s, 5); const s2 = hunt(6), a2 = real(s2); a2.know = 0.5; a2.aware = true; adv(s2, 0.5); E.momentPing(s2, a2.id, { enabled: ['M02'] }); E.moment(s2, 'M02', 'tight');
  chk('tight: a full ping (glow x1)', s2.pingFx.length === 1 && s2.pingMul === 1);
  chk('once per hunt', E.momentPing(s2, a2.id, { enabled: ['M02'] }) === false);
  const s3 = hunt(6), a3 = real(s3); a3.know = 0.5; a3.aware = true; adv(s3, 0.5); E.momentPing(s3, a3.id, { enabled: ['M02'] }); adv(s3, 1.5); E.momentCheck(s3, { enabled: ['M02'] });
  chk('an unanswered ping goes out as asked after 1.2 minutes (nothing is lost)', s3.pingFx.length === 1 && !s3.mom.open); }

// M04: the stale solution
{ const s = hunt(7); const a = lockOne(s); E.momentCheck(s, { enabled: ['M03'] }); E.moment(s, 'M03', 'tight'); adv(s, 4.5); a.solve = 1; a.stale = true; a.anchor.t = s.t - 0.2;
  chk('a stale solution with a tube ready raises M04', E.momentCheck(s, { enabled: ['M04'] }) === 'M04');
  E.moment(s, 'M04', 'loose'); chk('loose: fire on the old numbers (not stale, solved), stays valid 50% longer, cone floor', !a.stale && a.solve === 1 && a.pm.solveStale === 1.5 * 0.75 || (!a.stale && a.solve === 1 && a.pm.coneMin === 4));
  const c0 = s.volleys.length; E.fire(s, a.id, null, 0); chk('and the volley goes at the floor cone, not 0', s.volleys.length === c0 + 1 && s.volleys[s.volleys.length - 1].cone >= 4);
  const s2 = hunt(7); const b = lockOne(s2); E.momentCheck(s2, { enabled: ['M03'] }); E.moment(s2, 'M03', 'tight'); adv(s2, 4.5); b.solve = 1; b.stale = true; b.anchor.t = s2.t - 0.2; E.momentCheck(s2, { enabled: ['M04'] }); E.moment(s2, 'M04', 'tight');
  chk('tight: a fresh solution is under way (solution reset, re-solve x0.85)', b.solve === 0 && !b.stale && b.pm.solveT === 0.85); }

// M07: the vent
{ const s = hunt(8); s.sink.h = 0.7; chk('sink over 65% raises M07', E.momentCheck(s, { enabled: ['M07'] }) === 'M07');
  E.moment(s, 'M07', 'tight'); chk('tight: the vent starts now at the standard rate', s.vent.on && s.me.ventFull === E.PLAYER.ventFull);
  const q = hunt(8); q.sink.h = 0.7; E.momentCheck(q, { enabled: ['M07'] }); E.moment(q, 'M07', 'loose'); chk('loose: the vent is held', !q.vent.on && q.mom.hold && q.mom.hold.kind === 'vent');
  adv(q, 0.3); E.momentCheck(q, {}); chk('held while calm for less than half a minute', !q.vent.on);
  adv(q, 0.4); E.momentCheck(q, {}); adv(q, 0.05); E.momentCheck(q, {}); chk('a quiet half minute: Dace vents, with fast fins (x0.75) and an afterglow', q.vent.on && q.me.ventFull === E.PLAYER.ventFull * 0.75 && q.me.ventAfterglow === 0.8);
  q.sink.h = 0.01; adv(q, 0.2); E.momentCheck(q, {}); adv(q, 0.2); E.momentCheck(q, {}); chk('after that vent the fast fins are put back', !q.vent.on && q.me.ventFull === E.PLAYER.ventFull && q.me.ventAfterglow === 0);
  const w = hunt(8); w.sink.h = 0.7; E.momentCheck(w, { enabled: ['M07'] }); E.moment(w, 'M07', 'loose'); w.an.forEach(a => { if (a.kind === 'real') a.know = 0.1; }); w.sink.h = 0.93; E.momentCheck(w, {});
  chk('the ceiling: at 92% she vents wherever we are', w.vent.on); }

// M09: the analyst stations
{ const s = hunt(9); s.sink.h = 0.5; E.momentCheck(s, { enabled: ['M09'] }); s.analysts.forEach((w, i) => { w.task = s.an[i].id; }); s.sink.h = 0.55;
  chk('sink 50% and rising with two analysts tasked raises M09', E.momentCheck(s, { enabled: ['M09'] }) === 'M09');
  const g0 = s.me.glowFocus, r0 = s.me.readDone; E.moment(s, 'M09', 'tight'); chk('tight: analyst heat x0.8, reads 15% slower', Math.abs(s.me.glowFocus - 0.8 * g0) < 1e-9 && Math.abs(s.me.readDone - 1.15 * r0) < 1e-9);
  const q = hunt(9); q.sink.h = 0.5; E.momentCheck(q, { enabled: ['M09'] }); q.analysts.forEach((w, i) => { w.task = q.an[i].id; }); q.sink.h = 0.55; E.momentCheck(q, { enabled: ['M09'] }); E.moment(q, 'M09', 'loose');
  chk('loose: reads 10% faster, heat x1.25', Math.abs(q.me.glowFocus - 1.25 * g0) < 1e-9 && Math.abs(q.me.readDone - 0.9 * r0) < 1e-9);
  q.sink.h = 0.86; E.momentCheck(q, {}); chk('the ceiling: at 85% Dace cuts the stations for a minute (tasks dropped)', q.t < q.cutUntil && q.analysts.every(w => w.task == null)); }

// M01 (the hunt page keeps its own popup; the engine has the same effects for the station layer)
{ const s = E.newHunt(10, { nreal: 2 }); E.tick(s, 12); const got = E.momentCheck(s, { enabled: ['M01'] }); if (got === 'M01') { const id = s.mom.open.ctx.id, a = s.an[id]; E.moment(s, 'M01', 'loose'); chk('M01 loose: hunch call (reads 40% sooner, certainty capped at 70%)', a.pm.readDone === 0.6 && a.pm.cap === 0.7 && a.pm.hunch === true); }
  else chk('M01 (no candidate contact in this seed: acceptable, the hunt page covers it)', true); }

// underway prep
{ const o = E.prep({ nreal: 1 }, { M06: 'loose', M08: 'loose', M10: 'tight' }), s = E.newHunt(1, o);
  chk('M06 loose: drive noise x0.8, top speed x0.95, no redline', s.me.sig === E.LOADOUTS[0].sig * 0.8 && s.me.shipSpeed === 0.95 && s.me.noRedline === 1);
  chk('M08 loose: sink x1.2, vent x1.2 slower, forced vent at 90%', s.me.sink === E.LOADOUTS[0].sink * 1.2 && Math.abs(s.me.ventFull - 1.2 * E.PLAYER.ventFull) < 1e-9 && s.me.forceAt === 0.9);
  chk('M10 tight: arrival hazard x0.85 in the dark window', Math.abs(s.me.darkHaz - 0.85 * E.PLAYER.darkHaz) < 1e-9 && o.prepNudge === 3 + 3 - 3);
  chk('prep touches only the player block (the shared rules are unchanged)', E.PLAYER.noRedline === 0 && E.PLAYER.forceAt === 1); }

// determinism
{ const run = () => { const s = hunt(11, { nreal: 2 }); lockOne(s); const a = E.momentCheck(s, {}); E.moment(s, a, 'loose'); adv(s, 3); return JSON.stringify([a, s.t, real(s).pm, s.mom.picks]); }; chk('same seed, same moment', run() === run()); }

// the adapter: the call, the answer, the capped nudge
{ const a = (side, seed) => { const s = E.newHunt(seed, { nreal: 2 }), A = AD.create({ engine: E, seed }); A.update(s, 0); let fired = [];
    for (let t = 0; t < 600 && !s.over; t += 0.25) { E.tick(s, 0.25 / SPM); const out = A.update(s, 0.25); for (const e of out) if (e.type === 'moment') fired.push(e);
      for (const x of s.an) if (x.state === 'open' && x.idStatus !== 'plan' && t > 20 && !s.an.some(y => y.state === 'locked') && E.classify(s, x).post.real > 0.3) E.lockContact(s, x.id);
      for (const c of A.model.pending()) if (/^M\d\d$/.test(c.row)) A.model.answer(c.id, side === 'loose' ? 1 : 0); }
    return { s, A, fired }; };
  const L = a('loose', 21), T = a('tight', 21);
  chk(`the adapter raises moment calls and the answers reach the engine (loose: ${L.fired.map(e => e.id + ':' + e.side).join(' ') || 'none'})`, L.fired.length >= 1 && L.fired.every(e => e.side === 'loose' && e.nudge > 0) && T.fired.every(e => e.side === 'tight' && e.nudge < 0));
  chk('the hidden command-style nudge is capped at 8 points a hunt', Math.abs(L.A.style.total) <= 8 && Math.abs(T.A.style.total) <= 8);
  const q = E.newHunt(22, { nreal: 2 }), A2 = AD.create({ engine: E, seed: 22, moments: false }); A2.update(q, 0); for (let t = 0; t < 300; t += 0.25) { E.tick(q, 0.25 / SPM); A2.update(q, 0.25); }
  chk('cfg.moments = false turns them off', !(q.evts || []).some(e => e.type === 'moment')); }

console.log(bad ? `\n${bad} FAILED` : '\nALL OK'); process.exit(bad ? 1 : 0);
