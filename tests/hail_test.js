// Hail and transponder challenge (docs/hail_and_identification.md). node tests/hail_test.js
const E = require('../web/hunt_rt_engine.js'), AD = require('../web/station_adapter.js');
let bad = 0; const chk = (m, c) => { console.log(c ? 'ok   ' : 'FAIL ', m); if (!c) bad++; };
const SPM = E.RULES.secPerMin, run = (s, secs, A) => { for (let t = 0; t < secs && !s.over; t += 0.25) { E.tick(s, 0.25 / SPM); if (A) A.update(s, 0.25); } };
const rr = seed => { let x = seed >>> 0; return () => ((x = (x * 1664525 + 1013904223) >>> 0) / 4294967296); };
// pure line picker
{ chk('every role and mood returns a non-empty string', Object.keys(E.HAIL.lines).every(role => Object.keys(E.HAIL.lines[role]).every(m => { const l = E.hailLine(role, m, {}, rr(1)); return typeof l === 'string' && l.length > 0; })));
  chk('a repeat hail uses the repeat overlay', E.HAIL.repeat.neutral.includes(E.hailLine('trader', 'neutral', { repeat: true }, rr(2))));
  chk('a hail while we hold a lock uses the locked overlay', E.HAIL.locked.hostile.includes(E.hailLine('pirate', 'hostile', { locked: true }, rr(3))));
  chk('an unknown role falls back to a generic line', E.hailLine('nothing', 'neutral', {}, rr(4)) === E.HAIL.generic[0]);
  chk('same seed, same line', E.hailLine('patrol', 'neutral', {}, rr(9)) === E.hailLine('patrol', 'neutral', {}, rr(9))); }
// engine verb
{ const s = E.newHunt(5, { nreal: 2, entry: 'standard', friendly: true }); run(s, 40);
  const fr = s.an.find(a => a.kind === 'friend'), re = s.an.find(a => a.kind === 'real'), lu = s.an.find(a => a.kind === 'lure');
  chk('the hunt has a friend, a hostile and a lure to hail', !!(fr && re));
  fr.state = 'open'; const idBefore = fr.idStatus; const n0 = s.log.length, a0 = s.alertTotal || 0;
  chk('hailing a friend works', E.hailContact(s, fr.id) && fr.hail.mood === 'friendly' && fr.hail.line);
  chk('the reply is logged by Pell and raises a hail event', s.log.slice(n0).some(l => l.who === 'Pell' && /Reply/.test(l.text)) && (s.evts || []).some(e => e.type === 'hail'));
  chk('a hail does not change the identification status', fr.idStatus === idBefore);
  chk('a hail is rate limited', !E.hailContact(s, fr.id));
  run(s, 60); chk('after the cooldown a second hail is a repeat', E.hailContact(s, fr.id) && fr.hailN === 2);
  if (lu) { lu.state = 'open'; run(s, 60); E.hailContact(s, lu.id); chk('a lure never answers', lu.hail.mood === 'silent' && lu.hail.line === null); }
  re.state = 'open'; run(s, 60); const ok = E.hailContact(s, re.id); chk('a hostile warship hail is possible and does not confirm anything', ok && re.idStatus !== 'confirmed' && ['silent', 'neutral', 'hostile'].includes(re.hail.mood));
  chk('a bluffing warship poses as a trader', re.hail.mood !== 'neutral' || re.hail.role === 'trader');
  const q = E.newHunt(6, { nreal: 1, entry: 'standard' }); run(q, 5); E.goQuiet(q); const c0 = q.an[0]; c0.state = 'open'; chk('no hail while running quiet', !E.hailContact(q, c0.id)); }
// through the adapter (the path the ship UI uses)
{ const s = E.newHunt(7, { nreal: 1, entry: 'standard', friendly: true }), A = AD.create({ engine: E, seed: 7 }); A.update(s, 0); run(s, 30, A);
  const fr = s.an.find(a => a.kind === 'friend'); fr.state = 'open'; A.order('comms', 'hail', 'Hail', { id: fr.id }); run(s, 20, A); chk('the hail verb runs through the adapter', !!fr.hail);
  const h = s.an.find(a => a.kind === 'friend'); h.hail = null; h.state = 'open'; h.idStatus = 'unknown'; s.beamCd = 0; run(s, 60, A); A.order('comms', 'challenge', 'Challenge', { id: h.id }); run(s, 20, A); chk('the challenge verb runs through the adapter and confirms a friend', h.idStatus === 'confirmed'); }
console.log(bad ? bad + ' FAILED' : 'ALL OK'); process.exit(bad ? 1 : 0);
