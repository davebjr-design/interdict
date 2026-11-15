// The brace mechanic (docs/mechanics_brace.md): engine state machine, load, penalties, injuries, auto-brace, adapter, annunciator. node tests/brace_test.js
const E = require('../web/hunt_rt_engine.js'), AD = require('../web/station_adapter.js'), AN = require('../web/annunciator.js'), St = require('../web/station_model.js');
let bad = 0; const chk = (m, c) => { console.log(c ? 'ok   ' : 'FAIL ', m); if (!c) bad++; };
const SPM = E.RULES.secPerMin, me = E.PLAYER;
const run = (s, secs, dt = 0.25, A) => { for (let t = 0; t < secs && !s.over; t += dt) { E.tick(s, dt / SPM); if (A) A.update(s, dt); } };
const evs = (s, t) => (s.evts || []).filter(e => e.type === t);
const calm = seed => E.newHunt(seed, { nreal: 1, entry: 'standard' });

// state machine
{ const s = calm(1); chk('a hunt starts free, unloaded, uninjured', s.brace === 'free' && s.gLoad === 0 && !s.unsecure && Object.values(s.crew).every(c => !c.inj));
  chk('brace(on) starts bracing at once', E.brace(s, true, 'co') && s.brace === 'bracing');
  run(s, 3); chk('still bracing after 3 s', s.brace === 'bracing');
  run(s, 6); chk('secure about six seconds after the order', s.brace === 'secure' && (d => d < 7.5 / SPM && d > 5 / SPM)(evs(s, 'brace_complete')[0].t - s.braceT0));
  chk('events: brace (bracing) then brace_complete', evs(s, 'brace')[0].data.state === 'bracing' && evs(s, 'brace_complete').length === 1);
  chk('brace(off) stands easy at once', E.brace(s, false, 'co') && s.brace === 'free' && evs(s, 'brace').pop().data.state === 'free');
  chk('setBrace(s,on) is the cic3d entry point', (E.setBrace(s, true), s.brace === 'bracing')); }

// what needs a brace
{ const s = calm(2);
  chk('redline, hard evasion and the jump spool need a brace; a light burn does not', E.braceNeeded(s, 'redline') && E.braceNeeded(s, 'evade') && E.braceNeeded(s, 'spool') && !E.braceNeeded(s, 'creep'));
  E.brace(s, true); run(s, 8); chk('nothing needs a brace once the crew are secure', s.brace === 'secure' && !E.braceNeeded(s, 'redline')); }

// load and the unsecure state
{ const s = calm(3); E.setOrder(s, 'close', s.an[0].id); E.setSpeed(s, 'v2'); run(s, 2);
  chk('40% drive is a light load: not unsecure', s.gLoad < me.gThresh && !s.unsecure);
  E.setSpeed(s, 'v5'); run(s, 1); chk('full drive is over the threshold: unsecure, an unsecure event', s.gLoad >= me.gThresh && s.unsecure && evs(s, 'unsecure').length === 1 && evs(s, 'unsecure')[0].data.why === 'burn');
  E.brace(s, true); run(s, 8); chk('secure: no longer unsecure under the same load', s.brace === 'secure' && !s.unsecure && s.gLoad >= me.gThresh); }

// the work rate: free 1, loaded and unsecure 0.75, secure 0.95
{ const rate = (setup) => { const s = calm(4); setup(s); run(s, 1); let n = 0; const a = s.an.find(x => x.kind === 'real'); E.assign(s, 'dace', a.id); const d0 = s.analysts.length; const r0 = Object.values(a.read).reduce((m, q) => m + (q.den || 0), 0); run(s, 40); return Object.values(a.read).reduce((m, q) => m + (q.den || 0), 0) - r0; };
  const free = rate(s => { }), secure = rate(s => { E.brace(s, true); }), loaded = rate(s => { E.setOrder(s, 'close', s.an[0].id); E.setSpeed(s, 'v5'); });
  chk(`reading rate: free ${free.toFixed(1)}, secure ${secure.toFixed(1)}, loaded and unsecure ${loaded.toFixed(1)}`, free > secure && secure > 0 && free > loaded); }

// injuries: redline unsecure hurts people; secure does not; the rule can be switched off
{ let hurtFree = 0, hurtSec = 0, hurtOff = 0;
  for (let i = 0; i < 40; i++) {
    for (const [mode, tag] of [['free', 'a'], ['secure', 'b'], ['off', 'c']]) {
      const s = E.newHunt(500 + i, { nreal: 1, brace: mode !== 'off', braceAuto: 'off' }); E.setOrder(s, 'close', s.an[0].id); E.setSpeed(s, 'v3'); if (mode === 'secure') { E.brace(s, true); run(s, 8); }
      E.redlineBurn(s); run(s, 25); const n = Object.values(s.crew).filter(c => c.inj).length;
      if (tag === 'a') hurtFree += n; else if (tag === 'b') hurtSec += n; else hurtOff += n;
    } }
  chk(`40 redline burns of 25 s: crew hurt unsecure ${hurtFree}, secure ${hurtSec}, rule off ${hurtOff}`, hurtFree >= 3 && hurtSec === 0 && hurtOff === 0); }

// an injured officer: annunciator, effectiveness, Fenwick treats
{ let s = null; for (let i = 0; i < 60 && !s; i++) { const q = E.newHunt(700 + i, { nreal: 1, braceAuto: 'off' }); E.setOrder(q, 'close', q.an[0].id); E.setSpeed(q, 'v3'); E.redlineBurn(q); run(q, 30); if (Object.values(q.crew).some(c => c.inj)) s = q; }
  chk('some hunt produced an injury', !!s);
  if (s) { const k = Object.keys(s.crew).find(x => s.crew[x].inj), inj = evs(s, 'injury')[0];
    chk('injury event names the officer, station and cause', inj && inj.data.officer && inj.data.station && inj.data.cause === 'burn');
    chk('an injured officer works at 60 percent', E.crewEff(s, k) === 0.6 && E.crewEff(s, 'Quill') === (s.crew.Quill.inj ? 0.6 : 1));
    const L = AN.derive({ s, E }); chk('annunciator: CREW INJ lit while someone is hurt', L.crewinj && L.crewinj.state !== 'off' && L.crewinj.state !== undefined);
    E.setSpeed(s, 'v2'); E.treat(s, k); run(s, 8); chk('treatment takes a game minute (16 s): still hurt at 8 s', s.crew[k].inj); run(s, 14); chk('then back on station (treated event)', !s.crew[k].inj && evs(s, 'treated').length >= 1); } }

// what a hurt officer costs
{ const s = calm(18); E.tick(s, 2); const a = s.an.find(x => x.kind === 'real'); E.lockContact(s, a.id); E.tick(s, 1);
  const T0 = E.solveInfo(s, a).T, sp0 = s.spoolMin, r0 = E.PLAYER.hurtAbara;
  s.crew.Abara.inj = true; s.crew.Castellan.inj = true; s.crew.Dace.inj = true;
  chk('Abara hurt: firing solutions take x1.4 as long', Math.abs(E.solveInfo(s, a).T / T0 - E.PLAYER.hurtAbara) < 1e-9);
  chk('Castellan hurt: the jump spool takes x1.3 as long', Math.abs(s.spoolMin / sp0 - E.PLAYER.hurtSpool) < 1e-9);
  const v = E.newHunt(18, { nreal: 1 }); v.sink.h = 0.8; E.startVent(v); const w = E.newHunt(18, { nreal: 1 }); w.sink.h = 0.8; w.crew.Dace.inj = true; E.startVent(w); E.tick(v, 1); E.tick(w, 1);
  chk('Dace hurt: a vent drains slower', w.sink.h > v.sink.h); }

// auto-brace for a vampire, and the doctrine
{ const s = calm(5); s.inc.push({ id: s.an.find(a => a.kind === 'real').id, foe: true, t0: s.t, at: s.t + 25 / SPM, from: { x: 100, y: 100 }, aim: { x: s.player.x, y: s.player.y }, dir: 0, cone: 4, disp: 1, off: [], stretch: 1, killR: 7, dmgW: 38 });
  run(s, 1); chk('a seen vampire 24 s out: nobody braces yet (the CO calls it at braceTime x 1.5, about 10 s out)', s.brace === 'free'); run(s, 15); chk('about 10 s before impact the crew brace on their own (default doctrine)', s.brace === 'bracing' && s.braceBy === 'auto'); run(s, 8); chk('and are secure before a 25 s impact', s.brace === 'secure' && evs(s, 'brace_complete')[0].data.by === 'auto');
  s.inc.length = 0; run(s, 24); chk('they stand easy about a game minute (16 s) after the threat has gone', s.brace === 'free');
  const q = E.newHunt(5, { nreal: 1, braceAuto: 'off' }); q.inc.push({ id: 0, foe: true, t0: 0, at: 25 / SPM, from: { x: 100, y: 100 }, aim: { x: q.player.x, y: q.player.y }, dir: 0, cone: 4, disp: 1, off: [], stretch: 1, killR: 7, dmgW: 38 }); run(q, 5); chk("braceAuto 'off': nobody braces on their own", q.brace === 'free'); }

// surprise: a hit with no time to brace hurts; a secure crew are spared
{ let free = 0, sec = 0, n = 40;
  for (let i = 0; i < n; i++) for (const mode of ['free', 'secure']) {
    const s = E.newHunt(900 + i, { nreal: 1, braceAuto: 'off' }); s.pd = 'off'; if (mode === 'secure') { E.brace(s, true); run(s, 8); }
    s.inc.push({ dmg: 1, id: s.an.find(a => a.kind === 'real').id, foe: true, t0: s.t, at: s.t + 1 / SPM, from: { x: 100, y: 100 }, aim: { x: s.player.x, y: s.player.y }, dir: 0, cone: 0.1, disp: 0.1, off: Array.from({ length: 4 }, () => [0, 0]), stretch: 1, killR: 12, dmgW: 38 }); run(s, 3);
    const hurt = Object.values(s.crew).filter(c => c.inj).length; if (mode === 'free') free += hurt; else sec += hurt; }
  chk(`40 point-blank hits: crew hurt free ${free}, secure ${sec}`, free >= 8 && sec === 0); }

// determinism
{ const go = () => { const s = E.newHunt(77, { nreal: 2 }); E.setOrder(s, 'close', s.an[0].id); E.setSpeed(s, 'v3'); E.redlineBurn(s); run(s, 40); return JSON.stringify([s.brace, s.gLoad, s.t, s.hull, Object.entries(s.crew).map(([k, c]) => [k, c.inj])]); };
  chk('same seed, same brace history', go() === go()); }

// adapter: order, gate H4, hands-on block, auto doctrine
{ const s = E.newHunt(11, { nreal: 2 }), A = AD.create({ engine: E, seed: 11 }); A.update(s, 0);
  A.order('helm', 'brace', 'Brace', { on: true }); run(s, 4, 0.25, A); chk('A.order(helm, brace) starts the brace', s.brace === 'bracing'); run(s, 8, 0.25, A); chk('and the crew are secure; the H5 "brace complete" call was raised', s.brace === 'secure' && A.model.calls.some(c => c.row === 'H5'));
  A.order('helm', 'brace', 'Release', { on: false }); run(s, 3, 0.25, A); chk('A.order(helm, brace, {on:false}) releases', s.brace === 'free'); }
{ const s = E.newHunt(12, { nreal: 2 }), A = AD.create({ engine: E, seed: 12 }); A.update(s, 0); E.setOrder(s, 'close', s.an[0].id); E.setSpeed(s, 'v3');
  A.order('helm', 'redline', 'Redline'); run(s, 6, 0.25, A);
  const h4 = A.model.calls.find(c => c.row === 'H4');
  chk('a redline order with the crew free is held and raised as H4', !!h4 && !s.burn && s.speed !== 'ab');
  if (h4) { A.model.answer(h4.id, 0); run(s, 14, 0.25, A); chk('"Brace first": the crew brace, then the burn runs', s.brace === 'secure' && (s.burn || s.speed === 'ab')); } }
{ const s = E.newHunt(13, { nreal: 2 }), A = AD.create({ engine: E, seed: 13 }); A.update(s, 0); E.setOrder(s, 'close', s.an[0].id); E.setSpeed(s, 'v3');
  A.order('helm', 'redline', 'Redline'); run(s, 6, 0.25, A); const h4 = A.model.calls.find(c => c.row === 'H4'); A.model.answer(h4.id, 1); run(s, 4, 0.25, A);
  chk('"Go now": the burn runs at once with the crew unsecure (injury risk), no second H4', (s.burn || s.speed === 'ab') && s.brace === 'free' && A.model.calls.filter(c => c.row === 'H4').length === 1); }
{ const s = E.newHunt(14, { nreal: 2 }), A = AD.create({ engine: E, seed: 14, brace: 'auto' }); A.update(s, 0); E.setOrder(s, 'close', s.an[0].id); E.setSpeed(s, 'v3');
  A.order('helm', 'redline', 'Redline'); run(s, 14, 0.25, A); chk("doctrine brace 'auto': the crew brace first, no H4, the burn runs", !A.model.calls.some(c => c.row === 'H4') && s.brace === 'secure' && (s.burn || s.speed === 'ab')); }
{ const s = E.newHunt(15, { nreal: 2 }), A = AD.create({ engine: E, seed: 15 }); A.update(s, 0); A.model.setAutonomy('sensors', 'hands-on'); E.brace(s, true); run(s, 8, 0.25, A);
  chk('braced and Hands-on: A.handsOnBlocked says so', A.handsOnBlocked('sensors') && !A.handsOnBlocked('fire'));
  const o = A.order('sensors', 'classify', 'Classify', { id: 0 }); const out = A.update(s, 0); chk('a Hands-on station refuses an order while braced (out event blocked)', o === null && out.some(e => e.type === 'blocked'));
  chk('Auto crew keep working while braced (analysts still read)', (() => { const den = () => s.an.reduce((m, a) => m + Object.values(a.read).reduce((x, q) => x + (q.den || 0), 0), 0), d0 = den(); run(s, 30, 0.25, A); return den() > d0 + 1; })()); }

// annunciator lamps
{ const s = calm(16); let L = AN.derive({ s, E }); chk('BRACE lamp off when free', L.brace.state === 'normal');
  E.brace(s, true); L = AN.derive({ s, E }); chk('BRACE lamp advisory while bracing', L.brace.state === 'advisory');
  run(s, 8); L = AN.derive({ s, E }); chk('BRACE lamp advisory while secure', L.brace.state === 'advisory');
  const q = calm(17); E.setOrder(q, 'close', q.an[0].id); E.setSpeed(q, 'v5'); run(q, 1); chk('UNSECURE lamp (caution) under load with the crew free', AN.derive({ s: q, E }).unsecure.state === 'caution'); }

console.log(bad ? `\n${bad} FAILED` : '\nALL OK'); process.exit(bad ? 1 : 0);
