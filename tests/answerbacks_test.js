// Answerbacks: an officer's follow-up question after an order (web/answerbacks.js, docs/answerbacks.md). node tests/answerbacks_test.js
const E = require('../web/hunt_rt_engine.js'); E.P.secPerMin = 16; E.RULES.visTier = 1; E.RULES.precharge = 1; E.RULES.tubeKinds = 1;
const CR = require('../web/crew_reports.js'); const AD = require('../web/station_adapter.js'), AB = require('../web/answerbacks.js');
let bad = 0; const chk = (m, c, x) => { console.log(c ? 'ok   ' : 'FAIL ', m + (c ? '' : '  ' + (x || ''))); if (!c) bad++; };
const SPM = E.RULES.secPerMin, run = (s, secs, A, out) => { for (let t = 0; t < secs && !s.over; t += 0.25) { E.tick(s, 0.25 / SPM); if (A) { const o = A.update(s, 0.25); if (out) out.push(...o); } } };
const start = (seed, opt) => { const s = E.newHunt(seed, Object.assign({ nreal: 1, entry: 'standard' }, opt)); const A = AD.create({ engine: E, seed, moments: false }); A.update(s, 0); run(s, 30, A); return { s, A }; };
const asked = (A, row) => A.model.pending().find(c => c.row === row);
const answer = (A, call, verb) => { const i = call.opts.findIndex(o => o.verb === verb); return A.model.answer(call.id, i); };

// the table itself
chk('five answerbacks, each with a question, two options, a default and a cost', AB.DEFS.length === 5 && AB.DEFS.every(D => D.opts.length >= 2 && D.def >= 0 && D.def < D.opts.length && D.cost && D.line));
chk('every option verb is handled, either here or by the adapter', AB.DEFS.every(D => D.opts.every(o => AB.VERB[o.verb] || ['rescan'].includes(o.verb))));
chk('every row is registered with the station model', AB.DEFS.every(D => require('../web/station_model.js').ROWS[D.id]));
chk('the default is always the drilled, no-surprise answer (the second option)', AB.DEFS.every(D => D.def === 1));

// AB1 Dace: fins out
{ const { s, A } = start(11); s.sink.h = 0.8; const o = []; A.order('thermal', 'vent', 'Vent', {}); run(s, 6, A, o);
  const c = asked(A, 'AB1'); chk('AB1: venting from a full sink makes Dace ask about the fins', !!c && c.officer === 'Dace' && /sink at 8\d percent/.test(c.line), c && c.line);
  chk('AB1: one Captain at most', c && (c.line.match(/Captain/g) || []).length <= 1);
  answer(A, c, 'ab_fins_quarter'); let hOff = null; for (let t = 0; t < 400 && hOff == null; t += 0.25) { const was = s.vent.on; run(s, 0.25, A, o); if (was && !s.vent.on) hOff = s.sink.h; }
  chk('AB1: "pull in at a quarter" retracts the fins before the sink is empty', hOff != null && hOff > 0.2 && hOff <= 0.27, 'h at retract=' + hOff);
  chk('AB1: Dace says so', o.some(x => x.type === 'report' && x.officer === 'Dace' && /Fins in/.test(x.text)));
  const q = start(11); q.s.sink.h = 0.8; q.A.order('thermal', 'vent', 'Vent', {}); run(q.s, 6, q.A); const c2 = asked(q.A, 'AB1'); answer(q.A, c2, 'ab_fins_drain'); let hq = null; for (let t = 0; t < 400 && hq == null; t += 0.25) { const was = q.s.vent.on; run(q.s, 0.25, q.A); if (was && !q.s.vent.on) hq = q.s.sink.h; }
  chk('AB1: "drain fully" lets the engine empty the sink', hq != null && hq <= 0.03, 'h at retract=' + hq);
  const z = start(11); z.s.sink.h = 0.15; z.A.order('thermal', 'vent', 'Vent', {}); run(z.s, 6, z.A); chk('AB1: no question when there is little to dump', !asked(z.A, 'AB1')); }

// AB2 Abara: after a salvo
{ const { s, A } = start(12); const a = s.an.find(x => x.kind === 'real'); E.lockContact(s, a.id); a.solve = 1; E.setCharge(s, true); run(s, 40, A); a.solve = 1;
  A.order('weapons', 'fire', 'Fire', { id: a.id }); run(s, 8, A); const c = asked(A, 'AB2');
  if (!c) { const cap = E.capOf(s); chk('AB2: a salvo with tubes still hot makes Abara ask', false, 'no call; hot=' + cap.t.map(u => u.q.toFixed(2)).join(',') + ' vol=' + s.volleys.length); }
  else { chk('AB2: a salvo with tubes still hot makes Abara ask', c.officer === 'Abara' && /still charged/.test(c.line), c.line); answer(A, c, 'ab_bleed'); run(s, 8, A); const cap = E.capOf(s); chk('AB2: "bleed them" stands the tubes down', cap.t.every(u => !u.on), JSON.stringify(cap.t.map(u => u.on))); } }

// AB3 Quill: after a ping
{ const { s, A } = start(13); const a = s.an[0]; a.state = 'open'; A.order('sensors', 'ping', 'Ping', { id: a.id }); run(s, 6, A); const c = asked(A, 'AB3');
  chk('AB3: a ping makes Quill ask about going quiet', !!c && c.officer === 'Quill' && /go quiet/.test(c.line), c && c.line);
  if (c) { answer(A, c, 'ab_quiet'); run(s, 15, A); chk('AB3: "go quiet" starts quiet running', s.t < s.quietUntil, 'quietUntil=' + s.quietUntil + ' t=' + s.t); } }

// AB4 Abara: a route over the strain line
{ const { s, A } = start(14); const pts = [{ x: 60, y: 60, g: 3, flip: 3, speed: 'v5', kind: 'stop' }];
  A.order('helm', 'route', 'Route', { pts }); run(s, 8, A); const c = asked(A, 'AB4');
  chk('AB4: a 3 g plan makes Abara ask about bracing', !!c && c.officer === 'Abara' && /strain line/.test(c.line) && /3 g/.test(c.line), c && c.line);
  if (c) { answer(A, c, 'ab_brace_auto'); run(s, 15, A); chk('AB4: "brace on their own" sets the brace doctrine to auto', A.model.doctrine.brace === 'auto'); }
  const q = start(14); q.A.order('helm', 'route', 'Route', { pts: [{ x: 100, y: 100, g: 1, flip: 0.25, speed: 'v3', kind: 'stop' }] }); run(q.s, 8, q.A); chk('AB4: a gentle plan is not asked about', !asked(q.A, 'AB4')); }

// AB5 Quill: a probable classification
{ const { s, A } = start(15); const a = s.an.find(x => x.kind === 'real'); a.state = 'open';
  let found = null; const orig = E.classify; E.classify = (ss, aa) => { const r = orig(ss, aa); return aa === a ? Object.assign({}, r, { post: { real: 0.72, lure: 0.2, ghost: 0.08 } }) : r; };
  A.order('sensors', 'classify', 'Classify', { id: a.id }); run(s, 6, A); const c = asked(A, 'AB5'); E.classify = orig;
  chk('AB5: a probable but not firm reading makes Quill offer a rescan', !!c && c.officer === 'Quill' && /72 percent/.test(c.line) && /Sierra \w+ reads/.test(c.line), c && c.line);
  if (c) { const o = answer(A, c, 'rescan'); run(s, 15, A); chk('AB5: "Rescan" runs the ordinary rescan', !!o && A.done.some(d => d.verb === 'rescan'), JSON.stringify(A.done.map(d => d.verb))); chk('AB5: and does not ask again for the same contact', !asked(A, 'AB5')); } }

// ignoring a question takes the default and never blocks anything
{ const { s, A } = start(16); s.sink.h = 0.8; A.order('thermal', 'vent', 'Vent', {}); run(s, 6, A); const c = asked(A, 'AB1'); run(s, 40, A);
  chk('an ignored answerback defaults after its timeout', c && (c.state === 'defaulted' || c.state === 'answered'), c && c.state);
  chk('the adapter reported no errors', A.errors.length === 0, A.errors.join(' | ')); }
console.log(bad ? bad + ' FAILED' : 'ALL OK'); process.exit(bad ? 1 : 0);
