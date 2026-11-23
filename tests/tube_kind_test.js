// Tube loads: missile tubes and probe tubes (Dave, 2026-11-23)
const E = require('../web/hunt_rt_engine.js'); E.P.secPerMin = 16;
let fails = 0; const chk = (n, ok) => { console.log((ok ? 'ok    ' : 'FAIL  ') + n); if (!ok) fails++; };
const mk = () => E.newHunt(5, { nreal: 1, nlure: 0, entry: 'standard' });
let s = mk(); chk('flag off: every tube is a missile tube and decoys still launch', E.tubeKind(s, 2) === 'msl' && E.launchDecoy(s, 30));
E.RULES.tubeKinds = 1; s = mk();
chk('default load is missile, missile, probe', [0, 1, 2].map(i => E.tubeKind(s, i)).join() === 'msl,msl,prb');
chk('a decoy goes down the probe tube and keeps it busy', E.launchDecoy(s, 30) && s.tubes[2] > s.t && E.tubeKind(s, 2) === 'prb');
chk('a second decoy waits for the probe tube', E.launchDecoy(s, 30) === false);
s = mk(); chk('retooling a missile tube for probes works', E.setTubeKind(s, 1, 'prb') && E.tubeKind(s, 1) === 'prb' && s.tubes[1] > s.t);
chk('the last missile tube cannot be retooled away', E.setTubeKind(s, 0, 'prb') === false && E.tubeKind(s, 0) === 'msl');
chk('a tube that is cycling cannot be retooled', E.setTubeKind(s, 1, 'msl') === false);
s = mk(); E.setTubeKind(s, 2, 'msl'); for (let i = 0; i < 40; i++) E.tick(s, 0.1 / 16); E.setTubeKind(s, 2, 'msl');
s = mk(); E.setTubeKind(s, 2, 'msl'); s.t += 1; E.setTubeKind(s, 2, 'msl'); chk('no probe tube: decoy refuses', (() => { const q = mk(); q.tubeKind = ['msl', 'msl', 'msl']; return E.launchDecoy(q, 30) === false; })());
{ const g = mk(); E.RULES.precharge = 1; g.me.launch = 'rail'; E.lockContact(g, 0); for (let i = 0; i < 30; i++) E.tick(g, 0.1 / 16); g.an[0].solve = 1; E.fire(g, 0, null, 6);
  const c = E.capOf(g); chk('charging only readies missile tubes, never the probe tube', c.t[0].on || c.t[1].on, c.t[2].on === false);
  for (let i = 0; i < 300; i++) E.tick(g, 0.1 / 16); chk('the queued shot fires through a missile tube', g.volleys.length >= 1 && g.tubes[2] <= g.t); E.RULES.precharge = 0; }
E.RULES.tubeKinds = 0;
console.log(fails ? 'TUBE KIND FAILED' : 'ALL OK (tube kinds)'); process.exit(fails ? 1 : 0);
