// The flight model inside the engine (docs/mechanics_flight.md, stage B2): the player ship flies the plan, velocity and heading are real, g and heat follow the thrust.
const E = require('../web/hunt_rt_engine.js'), AD = require('../web/station_adapter.js');
let bad = 0; const chk = (m, c) => { console.log(c ? 'ok   ' : 'FAIL ', m); if (!c) bad++; };
const SPM = E.RULES.secPerMin, run = (s, secs, dt = 0.25) => { for (let t = 0; t < secs && !s.over; t += dt) E.tick(s, dt / SPM); };
const fresh = (seed = 3, o = {}) => { const s = E.newHunt(seed, Object.assign({ nreal: 1, braceAuto: 'off' }, o)); s.bodies = []; return s; };
const untilPhase = (s, ph, max = 400) => { for (let t = 0; t < max && s.phase !== ph && !s.over; t += 0.25) E.tick(s, 0.25 / SPM); return s.phase === ph; };

// a two-point route: the plan's own numbers match what the ship does
{ const s = fresh(); s.player.x = 60; s.player.y = 60; E.setSpeed(s, 'v3'); E.setRoute(s, [{ x: 110, y: 60 }, { x: 110, y: 110 }]); run(s, 1);
  const pi = E.planInfo(s), kinds = pi.segs.map(g => g.kind);
  chk('the plan is rotate/burn/coast, a corner, then a flip, a brake and a settle: ' + kinds.join(' '), kinds.includes('burn') && kinds.includes('coast') && kinds.includes('brake') && kinds.includes('turnburn'));
  chk(`planned time ${Math.round(pi.timeSec)} s, delta-v ${pi.dv.toFixed(0)} m/s, propellant ${(pi.propT).toFixed(1)} t (water)`, pi.timeSec > 1000 && pi.dv > 100 && pi.propT > 5 && pi.propT < 250);
  let maxg = 0, sawBurn = false, sawCoast = false, hotBurn = 0, hotCoast = 0;
  for (let t = 0; t < 3000 && s.posture === 'route' && !s.over; t += 0.5) { E.tick(s, 0.5 / SPM); maxg = Math.max(maxg, s.gNow); const h = E.exposure(s).parts.find(p => p.k === 'engine'); if (s.phase === 'burn') { sawBurn = true; hotBurn = h ? h.v : 0; } if (s.phase === 'coast') { sawCoast = true; hotCoast = h ? h.v : 0; } }
  chk(`the route completes (posture ${s.posture}) at the last point to within 0.5 km (${Math.hypot(s.player.x - 110, s.player.y - 110).toFixed(2)} km)`, Math.hypot(s.player.x - 110, s.player.y - 110) < 0.5);
  chk('peak g on the route is 0.15 (100 percent drive), never more', maxg > 0.14 && maxg < 0.16);
  chk('burn phases run the drive hot, a coast makes none', sawBurn && sawCoast && hotBurn > 0 && hotCoast === 0);
  chk('the ship ends at rest', Math.hypot(s.vel.vx, s.vel.vy) < 0.02); }

// the five rungs are cruise caps; the same drive thrust gets there
{ const peak = k => { const s = fresh(4); s.player.x = 30; s.player.y = 120; E.setSpeed(s, k); E.setRoute(s, [{ x: 200, y: 120 }]); let m = 0; for (let t = 0; t < 600 && !s.over; t += 0.5) { E.tick(s, 0.5 / SPM); m = Math.max(m, Math.hypot(s.vel.vx, s.vel.vy)); } return m; };
  const p1 = peak('v1'), p3 = peak('v3'), p5 = peak('v5'); chk(`peak speed follows the rung cap: v1 ${p1.toFixed(2)}, v3 ${p3.toFixed(2)}, v5 ${p5.toFixed(2)} km/gmin`, Math.abs(p1 - 1.2) < 0.05 && Math.abs(p3 - 3.6) < 0.1 && Math.abs(p5 - 6) < 0.1); }

// heading and the flip are visible state; the flip is free fall
{ const s = fresh(5); s.player.x = 60; s.player.y = 120; E.setSpeed(s, 'v3'); E.setRoute(s, [{ x: 200, y: 120 }]); run(s, 40); const h1 = s.hdg;
  chk('moving east the heading is east', Math.abs(Math.atan2(Math.sin(h1), Math.cos(h1))) < 0.05 || s.phase !== 'burn');
  E.setOrder(s, 'still', null); run(s, 1); chk('all stop begins with the flip: phase rotate, no thrust, no g', s.phase === 'rotate' && s.gNow === 0 && s.thrust === 0 && Math.abs(s.omega) > 0);
  run(s, 30); const dh = Math.abs(Math.atan2(Math.sin(s.hdg - h1), Math.cos(s.hdg - h1))); chk(`the flip turns the ship (${(dh * 57.3).toFixed(0)} degrees after 30 s)`, dh > 0.3);
  for (let t = 0; t < 1500 && Math.hypot(s.vel.vx, s.vel.vy) > 0.02 && !s.over; t += 0.5) E.tick(s, 0.5 / SPM); chk('and the ship brakes to rest', Math.hypot(s.vel.vx, s.vel.vy) < 0.05); }

// the adapter reports the plan
{ const s = fresh(6); const A = AD.create({ engine: E, seed: 6 }); A.update(s, 0); A.order('helm', 'route', 'Route', { pts: [{ x: s.player.x + 40, y: s.player.y, speed: 'v3' }, { x: s.player.x + 40, y: s.player.y + 40 }] });
  for (let i = 0; i < 100; i++) { E.tick(s, 1 / SPM); A.update(s, 1 / SPM); }
  const pl = A.plan(); chk('A.plan() gives segments, path samples, waypoints with times, delta-v and warnings', pl && pl.segs.length >= 4 && pl.path.length > 10 && pl.wps.length === 2 && pl.wps[0].t > s.nav.t0 && pl.dv > 0 && Array.isArray(pl.warn) && pl.now && pl.now.phase);
  chk('the route verb reaches the planner', s.posture === 'route' && s.route.length === 2 && A.errors.length === 0); }

// the planner's own warning on a short leg, and propellant is a mass of water
{ const s = fresh(7); s.player.x = 100; s.player.y = 100; E.setSpeed(s, 'v5'); E.setRoute(s, [{ x: 100.5, y: 100 }]); run(s, 1); const pi = E.planInfo(s);
  chk('a half-kilometre stop leg at v5 is cut to a short hop, not refused (peak cut or a warning)', pi.warn.length > 0 || pi.cuts.length > 0 || pi.timeSec > 0);
  chk('propellant is reported in tonnes of water, under the 250 t tank', pi.propT >= 0 && pi.propT < 250); }

console.log(bad ? bad + ' FAILED' : 'ALL OK'); process.exit(bad ? 1 : 0);
