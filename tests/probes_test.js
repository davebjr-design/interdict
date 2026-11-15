// Probe sets (docs/mechanics_probes.md): a matched rack of two, radio versus laser link. node tests/probes_test.js
const E = require('../web/hunt_rt_engine.js'), AD = require('../web/station_adapter.js'), AN = require('../web/annunciator.js');
let bad = 0; const chk = (m, c) => { console.log(c ? 'ok   ' : 'FAIL ', m); if (!c) bad++; };
const SPM = E.RULES.secPerMin, evs = (s, t) => (s.evts || []).filter(e => e.type === t);
const run = (s, secs, dt = 0.25, A) => { for (let t = 0; t < secs && !s.over; t += dt) { E.tick(s, dt / SPM); if (A) A.update(s, dt); } };
const mk = (seed = 1, o = {}) => { const s = E.newHunt(seed, Object.assign({ nreal: 1, braceAuto: 'off' }, o)); const a = s.an.find(x => x.kind === 'real'); a.x0 = 60; a.y0 = 120; a.vx = a.vy = 0; a.v = 0; return { s, a }; };
const near = (s, a) => { s.player.x = 70; s.player.y = 120; a.x0 = 100; a.y0 = 120; };   // inside the 70 km reach of an Orrin set
// real flight: a burn starts only once the ship has turned onto its heading, so wait for it
const untilBurn = (s, max = 200) => { for (let t = 0; t < max && s.gNow <= 0 && !s.over; t += 0.25) E.tick(s, 0.25 / SPM); };
const dens = a => Object.values(a.read).reduce((m, q) => m + (q.den || 0), 0);

// the rack
{ const { s } = mk(1);
  chk('the ship carries a rack of two matched sets (Orrin and Halden by default), in the rack', s.pset.length === 2 && s.pset.every(p => p.state === 'rack') && s.pset[0].lineage === 'Orrin' && s.pset[1].lineage === 'Halden');
  chk('sets carry their lineage traits: Orrin quiet and laser-capable but short-lived, Vask rugged, long-range, loud and radio-only', E.PSET.orrin.loud < E.PSET.halden.loud && E.PSET.halden.loud < E.PSET.vask.loud && E.PSET.orrin.links.includes('laser') && !E.PSET.vask.links.includes('laser') && E.PSET.orrin.endurance < E.PSET.halden.endurance && E.PSET.vask.range > E.PSET.orrin.range);
  const v = E.newHunt(1, { probeSets: ['vask', 'vask'] }); chk('opts.probeSets chooses the loadout', v.pset.map(p => p.key).join() === 'vask,vask' && v.pset[0].size === 6); }

// deploying
{ const { s, a } = mk(2); near(s, a); run(s, 1);
  chk('a laser set deploys on a contact in reach (probe_out event, set out, link laser)', E.deployProbes(s, 'A', a.id) && s.pset[0].state === 'out' && s.pset[0].link === 'laser' && evs(s, 'probe_out').length === 1);
  chk('a set cannot be deployed twice, and sets are never mixed: B is separate', !E.deployProbes(s, 'A', a.id) && s.pset[1].state === 'rack');
  chk('a Vask set cannot take a laser link', (() => { const q = E.newHunt(2, { nreal: 1, probeSets: ['vask'] }), t = q.an.find(x => x.kind === 'real'); q.player.x = 70; q.player.y = 120; t.x0 = 100; t.y0 = 120; t.vx = t.vy = 0; return E.deployProbes(q, 'A', t.id, 'laser') === false && E.deployProbes(q, 'A', t.id, 'radio') === true; })());
  const far = mk(2); far.s.player.x = 10; far.a.x0 = 200; far.a.y0 = 200; chk('out of reach: refused, set stays in the rack', E.deployProbes(far.s, 'A', far.a.id) === false && far.s.pset[0].state === 'rack'); }

// the picture: reads on an open contact firm up faster with a set out
{ const run1 = withSet => { const { s, a } = mk(3); near(s, a); if (withSet) E.deployProbes(s, 'A', a.id); run(s, 40); return dens(a); };
  const w = run1(true), wo = run1(false); chk(`probe pulses add readings on the contact (den ${w.toFixed(1)} with a set out, ${wo.toFixed(1)} without)`, w > wo + 3); }

// the links
{ const { s, a } = mk(4); near(s, a); E.deployProbes(s, 'A', a.id, 'laser'); E.deployProbes(s, 'B', a.id, 'radio'); run(s, 2);
  const parts = E.exposure(s).parts; chk('radio is an emission (a probes part in the exposure), laser is silent', parts.some(p => p.k === 'probes' && p.v > 0) && Math.abs(parts.find(p => p.k === 'probes').v - E.PSET.halden.loud * 0.014) < 1e-9);
  const p0 = s.pset[0].pulses; run(s, 10); chk('with both links up the pulses keep coming', s.pset[0].pulses > p0 && s.pset[1].pulses > 0);
  chk('a laser link is up while the ship coasts; linkNeeded names the set', s.pset[0].linkOk && E.linkNeeded(s, 'evade').sets.join() === 'A'); }
{ const { s, a } = mk(5); near(s, a); E.deployProbes(s, 'A', a.id, 'laser'); run(s, 1); E.setOrder(s, 'close', a.id); E.setSpeed(s, 'v3'); untilBurn(s); run(s, 3);
  chk('the ship starts moving: the laser link breaks (speed), a probe_link broken event', !s.pset[0].linkOk && evs(s, 'probe_link').some(e => e.data.state === 'broken' && e.data.cause === 'speed'));
  const n = s.pset[0].pulses; run(s, 5); chk('no pulses while the link is broken', s.pset[0].pulses === n);
  E.setOrder(s, 'still', null); for (let t = 0; t < 300 && !s.pset[0].linkOk; t += 0.25) E.tick(s, 0.25 / SPM); chk('stopping again (flip and brake, then steady): the link returns once the ship holds its velocity half a game minute', s.pset[0].linkOk && evs(s, 'probe_link').some(e => e.data.state === 'up')); }
{ const { s, a } = mk(6); near(s, a); s.player.x = 50; s.player.y = 40; a.x0 = 90; a.y0 = 60; s.bodies = []; E.setSpeed(s, 'v3'); E.setRoute(s, [{ x: 100, y: 40, speed: 'v3' }, { x: 100, y: 150, speed: 'v3' }]);
  for (let t = 0; t < 200 && !(s.phase === 'coast' && s.nav.mode === 'route'); t += 0.25) E.tick(s, 0.25 / SPM);   // up to speed and coasting on the leg
  E.deployProbes(s, 'A', a.id, 'laser'); run(s, 3); const ok0 = s.pset[0].linkOk; run(s, 20); const ok1 = s.pset[0].linkOk; E.setOrder(s, 'evade', a.id);   // a jink burn changes the velocity
  for (let t = 0; t < 120 && s.pset[0].linkOk && !s.over; t += 0.25) E.tick(s, 0.25 / SPM);
  chk('a steady course (coasting) keeps the laser link; a burn that changes the velocity breaks it (heading or speed)', ok0 && ok1 && evs(s, 'probe_link').some(e => e.data.state === 'broken' && ['heading', 'speed'].includes(e.data.cause))); }
{ const { s, a } = mk(7); near(s, a); E.deployProbes(s, 'A', a.id, 'laser'); E.setOrder(s, 'close', a.id); E.setSpeed(s, 'v3'); untilBurn(s); run(s, 3);
  chk('switching to radio keeps the picture (link up at once) and costs exposure', E.setProbeLink(s, 'A', 'radio') && s.pset[0].linkOk && s.pset[0].link === 'radio' && E.exposure(s).parts.some(p => p.k === 'probes')); }

// endurance, recovery
{ const { s, a } = mk(8); near(s, a); E.deployProbes(s, 'A', a.id, 'laser'); run(s, E.PSET.orrin.endurance * SPM + 6);
  chk('a set runs out of battery: lost, a probe_lost event, the lamp lights', s.pset[0].state === 'lost' && evs(s, 'probe_lost').length === 1 && AN.derive({ s, E }).prblost.state === 'caution'); }
{ const { s, a } = mk(9); near(s, a); E.deployProbes(s, 'B', a.id, 'radio'); run(s, 3); const al = s.t;
  chk('recovery is by radio hail (an emission) and takes a minute', E.recoverProbes(s, 'B') && s.pset[1].state === 'recovering'); run(s, 20);
  chk('then the set is back aboard but cannot be redeployed this hunt', s.pset[1].state === 'recovered' && !E.deployProbes(s, 'B', a.id) && evs(s, 'probe_recovered').length === 1); }

// the lamps
{ const { s, a } = mk(10); near(s, a); let L = AN.derive({ s, E }); chk('all dark with the rack full', L.prbout.state === 'normal' && L.prblink.state === 'normal');
  E.deployProbes(s, 'A', a.id, 'laser'); run(s, 1); L = AN.derive({ s, E }); chk('PRB OUT advisory with a set out', L.prbout.state === 'advisory');
  E.setOrder(s, 'close', a.id); E.setSpeed(s, 'v3'); untilBurn(s); run(s, 3); L = AN.derive({ s, E }); chk('PRB LINK caution when the laser link is broken', L.prblink.state === 'caution'); }

// the station layer: deploy by order, H2P before a manoeuvre, S10 when the link breaks
{ const { s, a } = mk(11); near(s, a); const A = AD.create({ engine: E, seed: 11 }); A.update(s, 0);
  A.order('sensors', 'probes_deploy', 'Probes', { id: a.id }); run(s, 6, 0.25, A); chk('A.order(sensors, probes_deploy) puts a set out', s.pset[0].state === 'out' && s.pset[0].link === 'laser');
  E.brace(s, true); run(s, 8, 0.25, A); A.order('helm', 'evade', 'Evade', { id: a.id }); run(s, 6, 0.25, A);
  const h = A.model.calls.find(c => c.row === 'H2P'); chk('an evasion order with a laser link up is held and raised as H2P (Hold course / Turn anyway / Switch probes to radio)', !!h && h.opts.length === 3 && s.posture !== 'evade' && s.pset[0].linkOk);
  if (h) { A.model.answer(h.id, 2); run(s, 6, 0.25, A); chk('"Switch probes to radio": the set goes to radio and the order runs', s.pset[0].link === 'radio' && s.posture === 'evade'); } }
{ const { s, a } = mk(12); near(s, a); const A = AD.create({ engine: E, seed: 12 }); A.update(s, 0); E.deployProbes(s, 'A', a.id, 'laser'); run(s, 1, 0.25, A); E.setOrder(s, 'close', a.id); E.setSpeed(s, 'v3'); untilBurn(s); run(s, 4, 0.25, A);
  chk('a broken laser link raises S10 (Wait / Switch to radio / Recover) with the cause', A.model.calls.some(c => c.row === 'S10' && c.opts.length === 3 && /speed/.test(c.line))); }

// determinism
{ const go = () => { const { s, a } = mk(13); near(s, a); E.deployProbes(s, 'A', a.id); E.setOrder(s, 'close', a.id); E.setSpeed(s, 'v3'); run(s, 30); return JSON.stringify([s.pset.map(p => [p.state, p.link, p.linkOk, p.pulses]), dens(a)]); }; chk('same seed, same probe history', go() === go()); }

console.log(bad ? `\n${bad} FAILED` : '\nALL OK'); process.exit(bad ? 1 : 0);
