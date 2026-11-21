// Per-character g tolerance and fatigue (docs/firing_solution_and_g_load.md s2, s5). node tests/g_tolerance_test.js
const E = require('../web/hunt_rt_engine.js'); let bad = 0; const chk = (m, c) => { console.log(c ? 'ok   ' : 'FAIL ', m); if (!c) bad++; };
const SPM = E.RULES.secPerMin, me = E.PLAYER;
const run = (s, secs, dt = 0.25) => { for (let t = 0; t < secs && !s.over; t += dt) E.tick(s, dt / SPM); };
const calm = (seed, o) => { const s = E.newHunt(seed, Object.assign({ nreal: 1, entry: 'standard', braceAuto: 'off' }, o || {})); return s; };
const gs = s => Object.fromEntries(E.gState(s).map(x => [x.officer, x]));

chk('every officer has a tolerance; the tactical officer is the best trained', (g => Object.values(g).every(x => x.tol >= 3) && g.Abara.tol > g.Quill.tol)(gs(calm(1))));
{ const s = calm(2); s.player.x = 60; run(s, 20); chk('coasting in free fall: no fatigue', Object.values(gs(s)).every(x => x.fat === 0));
  E.forceLoad(s, 1, 60); run(s, 40); chk('1 g is comfortable: no fatigue, nobody out', Object.values(gs(s)).every(x => x.fat === 0 && !x.ko)); }
// note: the sim runs 3.75 game seconds per real second, so a 30 game-second redline burn is 8 real seconds
{ const free = calm(3), secure = calm(3); E.brace(secure, true); run(free, 8); run(secure, 8);
  E.forceLoad(free, 3, 8); E.forceLoad(secure, 3, 8); run(free, 8); run(secure, 8);
  const a = gs(free).Quill.fat, b = gs(secure).Quill.fat;
  chk(`a full 30 s redline burn at 3 g: unbraced crew tire (${a.toFixed(2)}), braced crew tire at about 60 percent of that (${b.toFixed(2)})`, a > 0.3 && a < 0.8 && b > 0 && b < a * 0.7);
  chk('3 g is under everyone\'s tolerance: nobody blacks out', Object.values(gs(free)).every(x => !x.ko));
  chk('fatigue lowers efficiency (crewEff below 1) and the adapter hook sees it', E.crewEff(free, 'Quill') < 1 && E.crewEff(free, 'Quill') >= 0.5 && E.crewEff(secure, 'Quill') > E.crewEff(free, 'Quill'));
  run(free, 5); const mid = gs(free).Quill.fat; run(free, 60); const c = gs(free).Quill.fat; chk(`free fall recovers (${a.toFixed(2)} to ${c.toFixed(2)} after a minute)`, c < a * 0.5 && mid <= a); }
{ const s = calm(4); E.forceLoad(s, 4.2, 8); run(s, 8); const g = gs(s);
  chk('4.2 g for 30 game-seconds: Quill, Dace and Fenwick (tolerance 4-4.5) black out (cause blackout); trained Abara and Castellan do not', g.Quill.ko && g.Dace.ko && g.Fenwick.ko && !g.Abara.ko && !g.Castellan.ko && (s.evts || []).some(e => e.type === 'ko' && e.data.cause === 'blackout')); }
{ const s = calm(5); E.brace(s, true); run(s, 8); E.forceLoad(s, 4.2, 8); run(s, 8); chk('the same 4.2 g with the crew braced (reclined, tolerance x1.3): nobody blacks out', Object.values(gs(s)).every(x => !x.ko)); }
{ const s = calm(6); E.forceLoad(s, 6, 1.4); run(s, 2); const g = gs(s); chk('a 6 g emergency burn (5 game-seconds) drops most of an unbraced crew', Object.values(g).filter(x => x.ko).length >= 3); }
{ const s = calm(7); E.forceLoad(s, 3.9, 8); run(s, 0.5); chk('a sudden jump of 2 g or more flags a sudden onset (tolerance x0.85 for a few seconds)', s.gOnsetUntil > s.t); }
{ const s = calm(8); E.forceLoad(s, 3, 8); run(s, 8); const ev = (s.evts || []).filter(e => e.type === 'g_tired'); chk('crew say so when the weight wears them down (g_tired events, one per officer)', ev.length > 0 && ev.length <= 5); }
if (bad) { console.log('G TOLERANCE FAILED'); process.exit(1); } console.log('ALL OK (g tolerance)');
