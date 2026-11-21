// flip aggressiveness: node tests/maneuver_test.js
// ---- maneuver aggressiveness (flip g) ----
{
  const FL = require('../web/flight_model.js'); let bad = 0; const eq = (n, a, b, tol) => { if (Math.abs(a - b) > tol) { bad++; console.log('FAIL ' + n + ': ' + a + ' vs ' + b); } else console.log('ok    ' + n); };
  for (const [m, r, T] of [['normal', 50, 29.1], ['normal', 70, 34.4], ['firm', 50, 14.5], ['combat', 50, 8.4], ['combat', 70, 9.9], ['emergency', 50, 5.9]]) eq('180 deg flip ' + m + ' r=' + r, FL.rotTime(Math.PI, FL.maneuverShip(m, r)), T, 0.15);
  const S = FL.maneuverShip('combat', 57), T = FL.rotTime(Math.PI, S), w = Math.sqrt(Math.PI * S.alpha);
  eq('peak felt g at mid flip = target', FL.rotG(S.alpha, w, 57), 3, 0.01);
  eq('centripetal about pi times spin-up', (w * w * 57) / (S.alpha * 57), Math.PI, 1e-6);
  const a = FL.rotAt(Math.PI, T, T / 2, Object.assign({}, FL.SHIP, S)); eq('rate at mid flip matches', a.w, w, 1e-6);
  eq('flip time scales with sqrt(r)', FL.rotTime(Math.PI, FL.maneuverShip('combat', 10)) / FL.rotTime(Math.PI, FL.maneuverShip('combat', 40)), 0.5, 1e-6);
  let threw = false; try { FL.maneuverShip('bogus'); } catch (e) { threw = true; } if (!threw) { bad++; console.log('FAIL bogus maneuver should throw'); } else console.log('ok    unknown maneuver throws');
  if (bad) { console.log('MANEUVER FAILED'); process.exit(1); } console.log('ALL OK (maneuver)');
}

// ---- auto-brace ahead of a planned turn (docs/firing_solution_and_g_load.md s1a) ----
{
  const E = require('../web/hunt_rt_engine.js'), SPM = E.RULES.secPerMin; let bad = 0; const chk = (m, c) => { console.log(c ? 'ok   ' : 'FAIL ', m); if (!c) bad++; };
  const mk = mode => { const s = E.newHunt(31, { nreal: 1, entry: 'standard' }); s.maneuver = mode; s.player.x = 60; s.player.y = 60; E.setSpeed(s, 'v3'); E.setRoute(s, [{ x: 75, y: 60 }, { x: 75, y: 75 }]); return s; };   // short legs so the corner comes within the run, before the hunt's first volley
  for (const [mode, expectBrace] of [['normal', false], ['combat', true]]) {
    const s = mk(mode); let braced = false, planned = null; for (let t = 0; t < 250 && !s.over; t += 0.25) { E.tick(s, 0.25 / SPM); if (s.brace !== 'free') braced = true; const ev = (s.evts || []).find(e => e.type === 'brace_plan'); if (ev && !planned) planned = ev; }
    chk(`${mode} maneuvers: crew ${expectBrace ? 'brace by themselves ahead of the turns' : 'do not need to brace'} (braced ${braced})`, braced === expectBrace);
    if (expectBrace) chk('the brace_plan event names the load and how soon', planned && planned.data.g >= E.PLAYER.gThresh && planned.data.inGs > 0);
  }
  { const s = mk('combat'); E.tick(s, 0.05); const u = E.upcomingLoad(s, 1e6); chk('upcomingLoad sees the first flip', u && u.kind === 'rotate' && u.g > 2 && u.g < 3.1); }
  if (bad) { console.log('AUTOBRACE FAILED'); process.exit(1); } console.log('ALL OK (auto-brace)');
}
