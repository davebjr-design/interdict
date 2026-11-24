// Crew reports: four-part answers built from engine readings (Dave, 2026-11-24)
const E = require('../web/hunt_rt_engine.js'); E.P.secPerMin = 16; E.RULES.visTier = 1; E.RULES.precharge = 1; E.RULES.tubeKinds = 1;
const CR = require('../web/crew_reports.js');
let fails = 0; const chk = (n, ok, x) => { console.log((ok ? 'ok    ' : 'FAIL  ') + n + (ok ? '' : '  ' + (x || ''))); if (!ok) fails++; };
const mk = () => { const s = E.newHunt(5, { nreal: 1, nlure: 0, entry: 'standard' }); return s; };
chk('every interaction has five patterns of four parts', Object.keys(CR.PATTERNS).every(o => Object.entries(CR.PATTERNS[o]).every(([v, a]) => a.length === 5 && a.every(p => p.split('|').length === 4))), 'pattern shape');
chk('every officer who speaks has a ladder phrase for each level', Object.keys(CR.LV).every(o => CR.LV[o].to.length === 5 && CR.LV[o].hold.length === 5 && CR.LV[o].to.every(a => a.length >= 3) && CR.LV[o].hold.every(a => a.length >= 2)));
const run = (verb, act, d, mode, extra) => { const s = mk(); const before = CR.snap(E, s); if (act) act(s); const r = CR.report(Object.assign({ E, s, verb, before, d: d || {}, mode: mode || 'supervised' }, extra || {})); return r; };
const cases = {
  arm: [s => E.setCharge(s, true, 0), { n: 1 }], armall: [s => E.setCharge(s, true), {}], bleed: [s => { E.setCharge(s, true); E.setCharge(s, false, 0); }, { n: 1 }], bleedall: [s => E.setCharge(s, false), {}], kind: [s => E.setTubeKind(s, 1, 'prb'), { n: 2, kind: 'PROBE', secs: 4.8 }],
  fire: [null, { t: 'S1', count: 4, eta: 40 }], firequeue: [null, { t: 'S1', secs: 8 }], probe: [null, { t: 'S1', left: 3, eta: 90 }], decoy: [null, { left: 3, secs: 60 }], destruct: [null, { n: 2 }],
  lock: [null, { t: 'S1', secs: 40, track: 'passive', conf0: 'likely' }], refresh: [null, { t: 'S1', secs: 30 }], mark: [null, { t: 'S1' }], pdon: [s => E.setPD(s, 'active'), {}], pdoff: [null, {}], launch: [s => E.setLaunch(s, 'gas'), {}],
  speed: [s => E.setSpeed(s, 'v4'), {}], still: [s => E.setOrder(s, 'still', null), {}], evade: [null, {}], route: [null, { legs: 3, mins: 5, g: 1.5, flip: 40, prop: 2.1 }], brace: [null, { secs: 6 }],
  classify: [null, { t: 'S1', conf0: 'guess' }], rescan: [null, { t: 'S1' }], ping: [s => E.pingContact(s, 0), { t: 'S1' }], quiet: [s => E.goQuiet(s), { secs: 30 }], rule: [null, { t: 'S1' }],
  vent: [s => { s.sink.h = 0.7; E.startVent(s); }, {}], ventstop: [null, {}], cut: [null, {}], redline: [null, { secs: 40 }], hail: [null, { t: 'S1' }], challenge: [null, { t: 'S1' }] };
const seen = {};
for (const [verb, [act, d]] of Object.entries(cases)) { const outs = new Set(); let bad = null;
  for (let i = 0; i < 40; i++) { const r = run(verb, act, d, 'supervised', { rnd: Math.random, noLevel: false }); if (!r) { bad = 'null'; break; } if (/[{}]|undefined|NaN/.test(r.text)) { bad = r.text; break; } outs.add(r.parts[0]); seen[verb] = r; }
  chk(verb + ': clean text and at least four distinct openings', !bad && outs.size >= 4, bad || [...outs].join(' / ')); }
// tiers and modes
{ const r1 = run('arm', s => E.setCharge(s, true, 0), { n: 1 }, 'hands-on'), r1b = run('arm', s => E.setCharge(s, true, 0), { n: 1 }, 'supervised'); chk('hands-on is never chattier than supervised', r1.tier <= r1b.tier, r1.tier + ' vs ' + r1b.tier); const r1c = run('mark', null, { t: 'S1' }, 'hands-on'); chk('a harmless order is curt', r1c.tier === 0 && r1c.parts[0] === r1c.text, JSON.stringify(r1c));
  const r2 = run('pdon', s => E.setPD(s, 'active'), {}, 'supervised'); chk('going active is a full four-part answer', r2.tier === 2 && r2.level === 'lit', JSON.stringify(r2));
  const r3 = run('fire', null, { t: 'S1', count: 4, eta: 40 }, 'supervised'); chk('firing is conspicuous or worse and full', r3.level === 'lit' || r3.level === 'conspicuous', JSON.stringify(r3));
  const r4 = run('lock', null, { t: 'S1', secs: 40, track: 'passive', conf0: 'guess' }, 'supervised'); chk('a guess is hedged in the officer\'s words', CR.HEDGE.Abara.guess.some(h => r4.text.includes(h)) || r4.tier === 0, r4.text); }
console.log('\nSamples:'); for (const k of ['arm', 'fire', 'pdon', 'quiet', 'vent', 'speed', 'route', 'ping', 'lock', 'redline']) if (seen[k]) console.log(' ' + k.padEnd(8), '[' + seen[k].tier + ',' + seen[k].level + ',' + seen[k].conf + '] ' + seen[k].officer + ': ' + seen[k].text);
console.log(fails ? 'CREW REPORTS FAILED' : 'ALL OK (crew reports)'); process.exit(fails ? 1 : 0);
