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
