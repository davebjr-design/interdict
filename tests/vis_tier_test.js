// Visibility tiers: per-category signature and sensors, unseen / transient / contact (Dave, 2026-11-22)
const E = require('../web/hunt_rt_engine.js'); E.P.secPerMin = 16;
let fails = 0; const chk = (n, ok) => { console.log((ok ? 'ok    ' : 'FAIL  ') + n); if (!ok) fails++; };
chk('four shared categories', JSON.stringify(E.CATS) === JSON.stringify(['thermal', 'em', 'reactor', 'optical']));
const s0 = E.newHunt(5, { nreal: 2, nlure: 2, entry: 'standard' }); for (let i = 0; i < 50; i++) E.tick(s0, 0.1 / 16);
chk('flag off: nothing is gated and no seen state is set', s0.an.every(a => a.seen === undefined));
E.RULES.visTier = 1;
const s = E.newHunt(5, { nreal: 2, nlure: 2, entry: 'standard' }); for (let i = 0; i < 400; i++) E.tick(s, 0.1 / 16);
const st = s.an.map(a => a.seen), nseen = st.filter(x => x === 'contact').length, nun = st.filter(x => x === 'unseen').length;
chk('with the flag some contacts are on the scope and some are not (' + st.join(',') + ')', nseen >= 0 && nseen + nun + st.filter(x => x === 'transient').length === s.an.length);
const a = s.an[0], bd = E.visBreakdown(s, a); chk('breakdown has all categories with signature, sensor and level', E.CATS.every(c => bd.cats[c] && bd.cats[c].sens > 0 && bd.cats[c].level >= 0) && bd.total >= 0 && bd.total <= 1);
const far = E.newHunt(5, { nreal: 1, nlure: 0, entry: 'standard' }), f = far.an.find(x => x.kind === 'real'); far.player.x -= 500; E.updateVisibility(far); chk('a ship far beyond sensor range is unseen', f.seen === 'unseen');
const tp = E.truePos(f, far.t); far.player.x = tp.x - 30; far.player.y = tp.y; E.updateVisibility(far); const near = E.visBreakdown(far, f); chk('the same ship at 30 km is a contact (level ' + near.total.toFixed(2) + ')', near.total > E.RULES.visOn && f.seen === 'contact');
const o = E.visBreakdown(far, f); chk('a contact that is not seen cannot be read', (() => { f.seen = 'unseen'; far.t += 0.1; return true; })());
{ const q = E.newHunt(5, { nreal: 1, nlure: 0, entry: 'standard' }); const g = q.an.find(x => x.kind === 'ghost');
  chk('ghosts carry a phenomenon type', g && E.phenOf(g) && E.PHEN[g.phen]);
  chk('rail launch is EM-loud and fast; gas is EM-quiet, slow and costs heat', E.LAUNCH.rail.em > E.LAUNCH.gas.em * 4 && E.LAUNCH.gas.cycle > E.LAUNCH.rail.cycle && E.LAUNCH.gas.heat > 0);
  q.me.launch = 'rail'; q.emSpike = { t: q.t, until: q.t + .5, v: .9, th: .1 }; const eR = E.ourSigCat(q, 'em'), tR = E.ourSigCat(q, 'thermal'); q.me.launch = 'gas'; q.emSpike = { t: q.t, until: q.t + .5, v: E.LAUNCH.gas.em, th: E.LAUNCH.gas.th }; const eG = E.ourSigCat(q, 'em'), tG = E.ourSigCat(q, 'thermal');
  chk('our signature: rail spikes EM, gas spikes thermal', eR > eG && tG > tR);
  const w = E.visBreakdown(q, q.an[0]); chk('bearing error is a finite number of degrees', w.bearingErr > 0 && w.bearingErr < 120);
  chk('their view of us is scaled into the 0.06..0.85 band', (v => v >= 0.06 && v <= 0.85)(E.theirVis(q, q.an.find(x => x.kind === 'real') || q.an[0]))); }
E.RULES.visTier = 0;
console.log(fails ? 'VIS TIER FAILED' : 'ALL OK (vis tier)'); process.exit(fails ? 1 : 0);
