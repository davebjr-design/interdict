#!/usr/bin/env node
/* Decision moment M01 (docs/decision_moments.md) in the hunt page: fires once in a typical hunt, holds the hunt, applies its
 * per-contact effects and the hidden style nudge, and never fires in the tutorial. Run: node tests/moments_test.js */
const { chromium } = require('playwright');
const R = 'file://' + require('path').resolve(__dirname, '..') + '/';
let bad = 0; const chk = (m, c) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) bad++; };
async function hunt(ctx, seed, nreal, pick) {
  const pg = await ctx.newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto(R + 'web/hunt_rt.html'); await pg.waitForTimeout(500);
  await pg.evaluate(([seed, nreal]) => { brief.seed = seed; brief.nreal = nreal; }, [seed, nreal]); await pg.click('#begin'); await pg.waitForTimeout(200);
  let pops = 0, info = null, heldOk = true;
  for (let i = 0; i < 1400; i++) {
    const st = await pg.evaluate(() => { const P_ = window.__bot || (window.__bot = { id: null, t0: 0 }), cur = P_.id != null ? S.an[P_.id] : null;   // a typical player: INVESTIGATE one contact at a time, DISMISS junk, LOCK a ship, move on after 6 minutes
      if (cur && cur.state === 'open') { const c = E.classify(S, cur); if (c.n >= 2 && c.p >= 0.9) { if (c.best === 'real') E.lockContact(S, cur.id); else E.dismissContact(S, cur.id); P_.id = null; } else if (S.t - P_.t0 > 6) P_.id = null; } else P_.id = null;
      if (P_.id == null) { const open = S.an.filter(a => a.state === 'open' && a.idStatus !== 'plan'); const c = open[Math.floor(S.t) % Math.max(1, open.length)]; if (c) { E.investigate(S, c.id); P_.id = c.id; P_.t0 = S.t; } }
      if (S.sink.h > 0.8 && !S.vent.on) E.startVent(S); if (S.vent.on && S.sink.h < 0.3) E.stopVent(S); stepGame(0.05); return { t: S.t, over: S.over, open: !$('moment').hidden, hold: S.hold }; });
    if (st.open) {
      pops++; const t0 = st.t; await pg.waitForTimeout(250); const t1 = await pg.evaluate(() => { stepGame(0.5); return S.t; }); heldOk = heldOk && t1 === t0 && st.hold;   // the hunt does not move while the popup is up
      info = await pg.evaluate(() => ({ head: $('mh').textContent, line: $('ml').textContent, opts: [...document.querySelectorAll('#mopts .mopt')].map(b => b.querySelector('b').textContent + ': ' + b.querySelector('.q').textContent), effs: [...document.querySelectorAll('#mopts .mopt .e')].map(e => e.textContent), id: MOMENTS.book.open.ctx.id, t: S.t }));
      await pg.click(`#mopts .mopt.${pick === 'tight' ? 't' : 'l'}`); await pg.waitForTimeout(100);
      info.pm = await pg.evaluate(id => S.an[id].pm, info.id); info.hold = await pg.evaluate(() => S.hold);
    }
    if (st.over || st.t >= 60) break;
  }
  const end = await pg.evaluate(() => ({ n: MOMENTS.book.n, t: S.t, style: DemoState.load().command.style, trust: DemoState.load().trust }));
  await pg.close(); return { pops, info, end, heldOk, errs };
}
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1600, height: 900 } });
  let fired = 0; const runs = [[9101, 1, 'tight'], [9102, 2, 'loose'], [9103, 3, 'tight']];
  for (const [seed, n, pick] of runs) {
    const r = await hunt(ctx, seed, n, pick); if (r.pops === 1) fired++;
    console.log(`   seed ${seed}: ${r.pops} popup(s) at t=${r.info ? r.info.t.toFixed(2) : '-'}; hunt ran to t=${r.end.t.toFixed(1)}; style ${r.end.style}`);
    chk(`seed ${seed}: at most one M01 per hunt`, r.pops <= 1 && r.end.n <= 1);
    chk(`seed ${seed}: no page errors`, !r.errs.length); if (r.errs.length) console.log(r.errs.slice(0, 3));
    if (!r.info) continue;
    chk(`seed ${seed}: the hunt is held while the popup is up, and resumes after`, r.heldOk && !r.info.hold);
    chk(`seed ${seed}: Quill, sensors, two labeled options with stat effects`, /Quill/.test(r.info.head) && r.info.opts.length >= 2 && /^TIGHT/.test(r.info.opts[0]) && /^LOOSE/.test(r.info.opts[1]) && r.info.effs.every(e => /\d/.test(e)));
    chk(`seed ${seed}: no meter number on the popup`, !r.info.effs.some(e => /style|meter/i.test(e)));
    if (pick === 'loose') chk(`seed ${seed}: loose = hunch call on that contact (cap 70%, read 0.6, range 1.15)`, r.info.pm && r.info.pm.cap === 0.7 && r.info.pm.readDone === 0.6 && r.info.pm.sensR === 1.15);
    else chk(`seed ${seed}: tight = full processors (noise 0.85, uncapped)`, r.info.pm && r.info.pm.classNoise === 0.85 && !r.info.pm.cap);
  }
  chk('fires in a typical hunt (' + fired + ' of ' + runs.length + ')', fired >= 2);
  // hidden style nudge with the 8-per-hunt cap and hysteresis bands, and the loose cap on certainty
  const pg = await ctx.newPage(); await pg.goto(R + 'web/hunt_rt.html'); await pg.waitForTimeout(400);
  const s1 = await pg.evaluate(() => { localStorage.removeItem('interdict.state'); const r = []; let st = DemoState.load(); for (const d of [-3, -3, -3, -3, -3, -3]) { DemoState.nudgeStyle(st, d); r.push(st.command.style + ':' + st.command.band); } for (const d of [3, 3, 3, 3, 3]) { DemoState.nudgeStyle(st, d); r.push(st.command.style + ':' + st.command.band); } return r; });
  console.log('   bands', s1.join(' '));
  chk('hysteresis: tight entered at 35, held through 41, left above 43', s1[4] === '35:tight' && s1[8] === '41:tight' && s1[10] === '47:neutral' && s1[3] === '38:neutral');
  const cap = await pg.evaluate(() => { brief.seed = 9102; brief.nreal = 2; $('begin').click(); const a = S.an.find(x => x.kind === 'real'); for (let i = 0; i < 40; i++) E.tick(S, 0.5); const p0 = E.classify(S, a).p; a.pm = { cap: 0.7 }; return { p0, p1: E.classify(S, a).p, capped: E.classify(S, a).capped }; });
  chk(`hunch cap holds certainty at 70% (raw ${(cap.p0 * 100).toFixed(0)}%)`, cap.p1 <= 0.7 + 1e-9 && cap.capped);
  const cap8 = await pg.evaluate(() => { localStorage.removeItem('interdict.state'); MOMENTS.reset(S); const H = MOMENTS.book; H.moved = 6; const a = S.an[0]; H.open = { k: 'M01', m: MOMENTS.CAT.M01, ctx: { id: a.id }, opts: MOMENTS.CAT.M01.options({ id: a.id }) }; MOMENTS.choose(1); return DemoState.load().command.style; });
  chk('style moves at most 8 points per hunt (6 used, loose +3 gives +2)', cap8 === 52);
  await pg.close();
  // the tutorial: no moments at all
  const tp = await ctx.newPage(); await tp.goto(R + 'design/hunt.html?tutorial=tern&return=proto_iso.html'); await tp.waitForTimeout(1200);
  let tut = null;
  for (let i = 0; i < 500; i++) {
    tut = await tp.evaluate(() => { if (paused) togglePause(); const C = S.an.find(a => a.kind === 'real');   // the tutorial starts paused (step 1: start the clock) if (C.state === 'open') { S.analysts.forEach(w => { if (w.task !== C.id) E.assign(S, w.id, C.id); }); if (E.classify(S, C).n >= 2 && S.t > 6) E.lockContact(S, C.id); }
      if (C.state === 'locked') { if (C.stale) E.refreshSolution(S, C.id); if (C.solve >= 1) E.fire(S, C.id, null, 6); } const b = document.getElementById('tutnext'); if (b) b.click(); stepGame(0.05);
      return { done: !!document.getElementById('tutdone'), n: MOMENTS.book.n, open: !$('moment').hidden, holdEv: S.holdEvents, t: S.t }; });
    if (tut.done || tut.open) break;
  }
  console.log('   tutorial', tut);
  chk('tutorial: no decision moment fires', tut.n === 0 && !tut.open && !tut.holdEv && tut.t > 2);
  await b.close(); console.log(bad ? 'FAILED' : 'ALL OK'); process.exit(bad ? 1 : 0);
})();
