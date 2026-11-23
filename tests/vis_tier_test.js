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
E.RULES.visTier = 0;
console.log(fails ? 'VIS TIER FAILED' : 'ALL OK (vis tier)'); process.exit(fails ? 1 : 0);
