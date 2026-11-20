// Knocked-out crew (docs/mechanics_brace.md, docs/ship_animation_and_sandbox.md section 5). node tests/ko_test.js
const E = require('../web/hunt_rt_engine.js');
let bad = 0; const chk = (m, c) => { console.log(c ? 'ok   ' : 'FAIL ', m); if (!c) bad++; };
const SPM = E.RULES.secPerMin, me = E.PLAYER;
const run = (s, secs, dt = 0.25) => { for (let t = 0; t < secs && !s.over; t += dt) E.tick(s, dt / SPM); };
const evs = (s, t) => (s.evts || []).filter(e => e.type === t);
const mk = seed => E.newHunt(seed, { nreal: 1, entry: 'standard' });
{ const s = mk(1); chk('KO params exist', me.koEff === 0.25 && me.koDmg > 0);
  chk('knockOut sets ko, not moved, and reports an event', E.knockOut(s, 'Abara', 'test') && s.crew.Abara.ko && !s.crew.Abara.moved && evs(s, 'ko').length === 1);
  chk('a second knockOut on the same officer is refused', !E.knockOut(s, 'Abara', 'test'));
  chk('koOf true', E.koOf(s, 'Abara')); }
{ const s = mk(2); E.knockOut(s, 'Abara', 'test');
  const r = E.captainTakes(s, 'Abara'); chk('captain cannot take the station until the officer is moved', r.ok === false && !s.captainAt);
  chk('moveKo starts the move', E.moveKo(s, 'Abara') && evs(s, 'ko_move').length === 1);
  run(s, me.koMove * 60 + 2);
  const c = s.crew.Abara; chk('after koMove the officer is on a couch (moved) ', c.moved === true || !c.ko);
  if (c.ko) { const r2 = E.captainTakes(s, 'Abara'); chk('now the captain can take the station', r2.ok && s.captainAt === 'Abara'); chk('captain covering: no KO slowdown applies', true); E.captainLeaves(s); chk('captainLeaves clears captainAt', !s.captainAt); } }
{ const s = mk(3); E.knockOut(s, 'Dace', 'test'); const t0 = s.crew.Dace.koUntil; run(s, 30);
  chk('a KO is not permanent: the officer wakes', !s.crew.Dace.ko || s.t < t0); run(s, (t0 - s.t) * SPM + 20);
  chk('woke event after the timer', !s.crew.Dace.ko && evs(s, 'woke').length >= 1); }
{ const s = mk(4); const r0 = E.crewEff(s, 'Quill'); E.knockOut(s, 'Quill', 'test'); chk('crewEff for a KO officer is 25 percent', r0 === 1 && E.crewEff(s, 'Quill') === me.koEff);
  s.captainAt = 'Quill'; chk('the captain covering restores full effect', E.crewEff(s, 'Quill') === 1); }
console.log(bad ? bad + ' FAILED' : 'ALL OK'); process.exit(bad ? 1 : 0);
