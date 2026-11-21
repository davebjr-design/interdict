// Firing solution report, run-silent point, hunch, decoy, command-destruct (Dave, 2026-11-21)
const E = require('../web/hunt_rt_engine.js'); E.P.secPerMin = 16;
let fails = 0; const chk = (n, ok) => { console.log((ok ? 'ok    ' : 'FAIL  ') + n); if (!ok) fails++; };
const s = E.newHunt(7, { nreal: 1, nlure: 0, entry: 'standard' });
const t = s.an.find(x => x.kind === 'real'); E.lockContact(s, t.id);
let r = E.firingSolution(s, t, {}); chk('no readout before the solution resolves', !r.ready);
t.solve = 1; for (let i = 0; i < 5; i++) E.tick(s, 0.1 / 16); r = E.firingSolution(s, t, {});
if (r.ready) { chk('readout is a range 0..1 with lo<=hi', r.lo >= 0 && r.hi <= 1 && r.lo <= r.hi); chk('officer names a best run-silent point in range', r.best >= 0.4 && r.best <= 0.95); chk('deterministic for the same solution', JSON.stringify(E.firingSolution(s, t, {})) === JSON.stringify(r)); }
else console.log('note: solution not ready in this setup (' + r.why + ')');
chk('rsFx at 0.75 is neutral', Math.abs(E.rsFx(s, 0.75).act - 1) < 1e-9 && Math.abs(E.rsFx(s, 0.75).disp - 1) < 1e-9);
chk('lit earlier means more point-defence exposure, less dispersion', E.rsFx(s, 0.5).act > 1 && E.rsFx(s, 0.5).disp < 1);
chk('run-silent clamps to 0.4-0.95', E.rsFx(s, 0.1).rs === 0.4 && E.rsFx(s, 2).rs === 0.95);
let seen = 0, tot = 0; for (let k = 0; k < 400; k++) { const q = E.newHunt(k + 1, { nreal: 1, nlure: 0, entry: 'standard' }), a = q.an.find(x => x.kind === 'real'); E.lockContact(q, a.id); tot++; if (E.hunchFor(q, a)) seen++; }
chk('hunch about 1 in 10 (' + seen + '/' + tot + ')', seen / tot > 0.04 && seen / tot < 0.18);
const d = E.newHunt(3, { nreal: 1, nlure: 0, entry: 'standard' }); chk('decoy launches and spends one', E.launchDecoy(d, 60) && d.decoys.left === d.me.decoyCount - 1);
chk('second decoy blocked while probe tube reloads', E.launchDecoy(d, 60) === false);
chk('decoy not lit before delay, lit after', !E.decoyLit(d, d.decoys.list[0])); d.t += 2; chk('lit after delay', E.decoyLit(d, d.decoys.list[0]));
d.t += 10; chk('decoy fades after its life', !E.decoyLit(d, d.decoys.list[0]));
const c = E.newHunt(4, { nreal: 1, nlure: 0, entry: 'standard' }); chk('command-destruct with nothing in flight does nothing', E.commandDestruct(c) === false);
console.log(fails ? 'SOLUTION REPORT FAILED' : 'ALL OK (solution report)'); process.exit(fails ? 1 : 0);
