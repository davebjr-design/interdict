// Station model tests (docs/systems_contract.md s8). node tests/station_model_test.js
const S = require('../web/station_model.js'), E = require('../web/hunt_rt_engine.js');
let bad = 0; const chk = (m, c) => { console.log(c ? 'ok   ' : 'FAIL ', m); if (!c) bad++; };
const run = (M, secs, step = 0.25) => { for (let t = 0; t < secs; t += step) M.tick(step); };

// 1 default and expiry, with a recorded cost
{ const M = S.create({ seed: 1 }); const c = M.raise('X1', { n: 2 }); run(M, 1);
  chk('urgent call is raised and pending', M.pending().includes(c) && c.expiresAt - c.raisedAt > 10 && c.expiresAt - c.raisedAt < 25);
  run(M, 20); chk('unanswered urgent call runs its default and keeps its cost', c.state === 'defaulted' && c.choice === 0 && c.cost.length > 0 && M.orders.some(o => o.callId === c.id && o.by === 'default')); }

// 2 priority order, stand-by once, critical shortens others
{ const M = S.create({ seed: 2 }); const a = M.raise('S6', { n: 1 }), b = M.raise('W5', { eta: '45 seconds' }); run(M, 1);
  chk('critical call comes first', M.next().id === b.id);
  const t0 = a.expiresAt; chk('critical call shortens other timers', a.expiresAt <= M.now + 6.5);
  const M2 = S.create({ seed: 2 }); const c = M2.raise('E1', {}); run(M2, 1); const e0 = c.expiresAt; chk('stand by extends once', M2.standBy(c.id) && c.expiresAt === e0 + 12 && !M2.standBy(c.id));
  const M3 = S.create({ seed: 2 }); const d = M3.raise('W5', {}); run(M3, 1); chk('critical calls cannot be stood by', !M3.standBy(d.id)); }

// 3 one officer, one call at a time (Abara bottleneck)
{ const M = S.create({ seed: 3 }); const a = M.raise('W2', { n: 1 }), b = M.raise('H1', {}); run(M, 0.25);
  chk('second Abara call waits for the first to be spoken', a.state === 'raised' && b.state === 'queued' && b.readyAt > a.raisedAt);
  const M2 = S.create({ seed: 3 }); const x = M2.raise('W2', { n: 1 }), y = M2.raise('E1', {}); run(M2, 0.25); chk('different officers do not wait', x.state === 'raised' && y.state === 'raised'); }

// 4 autonomy
{ const A = S.create({ seed: 4 }), B = S.create({ seed: 4, autonomy: { sensors: 'supervised' } }), H = S.create({ seed: 4, autonomy: { sensors: 'hands-on' } });
  for (const M of [A, B, H]) { M.raise('S1', { n: 3 }); M.raise('S2', { text: 'Contact 3: no reactor signature.' }); run(M, 1); }
  chk('Auto settles a routine sensor decision by doctrine and logs readings', A.pending().length === 0 && A.calls.some(c => c.row === 'S1' && c.state === 'settled'));
  chk('Supervised raises it as a recommendation', B.pending().some(c => c.row === 'S1'));
  chk('Hands-on routes it to the player and does not auto-default', H.pending().some(c => c.row === 'S1' && c.route === 'player') && (run(H, 60), H.pending().some(c => c.row === 'S1')));
  const O = S.create({ seed: 4 }); O.raise('S8', { n: 1 }); run(O, 1); chk('Auto still raises open decisions (ping offer)', O.pending().some(c => c.row === 'S8')); }

// 5 order lifecycle with a named officer
{ const M = S.create({ seed: 5, command: 'tight' }), stages = []; M.on(e => { if (e.type === 'order') stages.push(e.stage); });
  const c = M.raise('E1', {}); run(M, 1); const o = M.answer(c.id, 1); run(M, 8);
  chk('order goes issued, acked, executing, reported', stages.join() === 'issued,acked,executing,reported');
  chk('right officer and verb', o.officer === 'Dace' && o.verb === 'vent' && o.by === 'co');
  const L = S.create({ seed: 5, command: 'loose' }), T = S.create({ seed: 5, command: 'tight' });
  const lo = (M2 => { const x = M2.raise('E1', {}); run(M2, 1); return M2.answer(x.id, 0); }); const l = lo(L), t = lo(T);
  chk('loose crews ack later than tight crews', l.ackAt - l.issuedAt > t.ackAt - t.issuedAt); }

// 6 mapping real engine lines onto the catalog
{ const M = S.create({ seed: 6 }); const map = (text, kind = 'info', urgent = false) => { const c = M.ingest([{ text, kind, urgent }])[0]; return c && c.row; };
  chk('maps new contact line to S1', map('Contact 3: thermal bloom, strong.') === 'S1');
  chk('maps a reading to S2', map('Contact 1: no reactor signature.') === 'S2');
  chk('maps "just pinged us" to S6', map('Contact 2 just pinged us. It is a warship, and now it hunts.', 'danger', true) === 'S6');
  chk('maps "noticed us" to X1', map('Contact 2 has noticed us. Expect it to maneuver and shoot.', 'danger', true) === 'X1');
  chk('maps "firm solution on us" to X3', map('Contact 2 has a firm solution on us. Expect accurate fire.', 'danger', true) === 'X3');
  chk('maps "has fired on us" to the vampire call', map('Contact 2 has fired on us. Impact in 40 seconds. Move, or go quiet.', 'danger', true) === 'W5');
  chk('maps running hot to E1', map('We are running hot. Anything listening can hear us.', 'bad') === 'E1');
  chk('maps hull failure to D3', map('Hull integrity failed. Emergency breach drive engaged.', 'danger', true) === 'D3');
  chk('maps maneuver complete to H3 (log only)', map('Maneuver complete. Holding position.') === 'H3'); }

// 7 batching
{ const M = S.create({ seed: 7, autonomy: { sensors: 'supervised' } }); M.raise('S1', { n: 3 }); M.raise('S1', { n: 4 }); M.raise('S1', { n: 5 }); run(M, 1);
  chk('three new returns in a burst become one call', M.calls.filter(c => c.row === 'S1').length === 1 && /3 new/.test(M.calls[0].line)); }

// 7b cooldown and attention budget
{ const M = S.create({ seed: 8 }); M.raise('E1', {}); const again = M.raise('E1', {}); chk('same news about the same thing inside the cooldown is said once', again === null);
  const B = S.create({ seed: 8 }); const cs = [1, 2, 3, 4].map(n => B.raise('X1', { n })); run(B, 1);
  chk('with no attention left, further urgent calls become notices (priority 2)', cs[0].pri === 3 && cs[1].pri === 3 && cs[2].pri === 2 && cs[2].demoted);
  chk('critical calls always get through', B.raise('W5', {}).pri === 4); }

// 8 rhythm: real engine hunts, all-Auto crew, nobody answering
{ let worst = 0, flood = 0, tot = 0, n = 0; const rows = {};
  for (const seed of [11, 12, 13, 14, 15, 16]) {
    const s = E.newHunt(seed, { nreal: 2 }); const M = S.create({ seed, secPerMin: E.RULES.secPerMin, command: 'tight' }); let seen = 0;
    const reals = s.an.filter(a => a.kind === 'real');
    for (const a of reals) E.lockContact(s, a.id);
    E.setRoute(s, [{ x: reals[0].x0, y: reals[0].y0 }]);
    for (let m = 0; m < 24 && !s.over; m++) {
      if (m === 6 || m === 12) E.pingContact(s, reals[0].id);
      E.tick(s, 1); M.ingest(s.log.slice(seen)); seen = s.log.length; run(M, E.RULES.secPerMin, 0.5);
    }
    const st = M.stats(); worst = Math.max(worst, st.urgentPer20s); flood = Math.max(flood, st.maxBurst5s); tot += st.raised; n++;
    for (const c of M.calls) rows[c.row] = (rows[c.row] || 0) + 1;
  }
  console.log('     rhythm: worst urgent/20s ' + worst.toFixed(2) + ', max calls in 5s ' + flood + ', mean raised/hunt ' + (tot / n).toFixed(1) + ', rows ' + JSON.stringify(rows));
  chk('all-Auto hunts stay at or under one urgent call per 20 s', worst <= 1.0);
  chk('no flood: at most 4 raised calls in any 5 s', flood <= 4); }
console.log(bad ? 'FAILED' : 'ALL OK'); process.exit(bad ? 1 : 0);
