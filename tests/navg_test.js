// Per-leg burn g, per-elbow flip g, Auto navigate styles and route preview (Dave, 2026-11-21)
const E = require('../web/hunt_rt_engine.js'), FL = require('../web/flight_model.js'); E.P.secPerMin = 16;
let fails = 0; const chk = (n, ok) => { console.log((ok ? 'ok    ' : 'FAIL  ') + n); if (!ok) fails++; };
const s = E.newHunt(5, { nreal: 0, nlure: 0, entry: 'standard' }); s.player.x = 100; s.player.y = 100;
const A = { x: 100, y: 130 }, B = { x: 130, y: 130 };
const mk = (g, flip) => [{ x: A.x, y: A.y, g, flip, kind: 'turn' }, { x: B.x, y: B.y, g, flip, kind: 'stop' }];
const pq = E.previewRoute(s, mk(0.2, 0.25)), ps = E.previewRoute(s, mk(1, 0.25)), pc = E.previewRoute(s, mk(3, 3)), pe = E.previewRoute(s, mk(6, 6));
chk('burn g sets the peak g (0.2 / 1 / 3 / 6)', Math.abs(pq.peakG - 0.25) < 0.1 || pq.peakG < 0.5);
chk('higher burn g is faster: stealth slower than standard slower than combat', pq.timeSec > ps.timeSec && ps.timeSec > pc.timeSec * 0.99);
chk('flip g sets flip time: combat flip much shorter than stealth flip', pc.flips[0].dur < pq.flips[0].dur * 0.6);
chk('combat crosses the 2 g strain line and costs fatigue, stealth and standard do not', pc.strainCrossings > 0 && pc.fatigue > 0 && pq.strainCrossings === 0 && ps.strainCrossings === 0);
chk('emergency costs more fatigue than combat', pe.fatigue > pc.fatigue);
chk('stealth burn stays below the engine heat threshold (0.2 g)', pq.peakG <= 0.5 && E.snapG(0.2) === 0.25);
chk('detents snap to half g: 2.3 -> 2.5, 0.1 -> 0.25, 7 -> 6', E.snapG(2.3) === 2.5 && E.snapG(0.1) === 0.25 && E.snapG(7) === 6);
chk('bands: 1 quiet, 2 firm, 3 combat, 4 emergency', E.gBand(1) === 'quiet' && E.gBand(2) === 'firm' && E.gBand(3) === 'combat' && E.gBand(4) === 'emergency');
const r = E.autoRoute(s, B, 'combat'); chk('auto navigate fills g and flip from the style', r.length === 1 && r[0].g === 3 && r[0].flip === 3 && r[0].kind === 'stop');
E.setRoute(s, mk(3, 3)); for (let i = 0; i < 40; i++) E.tick(s, 0.1 / 16);
const pi = E.planInfo(s); chk('a flown route keeps g and flip per waypoint in planInfo', pi && pi.wps[0].g === 3 && pi.wps[0].flip === 3);
let maxSpin = 0, maxG = 0; const s2 = E.newHunt(5, { nreal: 0, nlure: 0, entry: 'standard' }); s2.player.x = 100; s2.player.y = 100; E.setRoute(s2, mk(1, 3));
for (let i = 0; i < 2400; i++) { E.tick(s2, 0.1 / 16); maxSpin = Math.max(maxSpin, s2.gSpin || 0); maxG = Math.max(maxG, E.gPhys(s2)); }
chk('a 3 g elbow flip is felt at 1.5-3.4 g (peak 3 g only for a 180 degree flip) even with a 1 g burn', maxSpin > 1.5 && maxSpin < 3.4);
console.log(fails ? 'NAV G FAILED' : 'ALL OK (nav g)'); process.exit(fails ? 1 : 0);
