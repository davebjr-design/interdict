#!/usr/bin/env node
/* Dock inspection roll in the walk demo (docs/detection_model.md "Dock inspections"). Run: node tests/dock_inspect.js */
const { chromium } = require('playwright');
const FILE = 'file://' + require('path').resolve(__dirname, '../design/proto_iso.html');
let bad = 0; const chk = (m, c) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) bad++; };
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto(FILE); await pg.waitForTimeout(1200); await pg.click('#reset');
  chk('no dock step on the Tern', await pg.evaluate(() => document.getElementById('dock').hidden));
  await pg.click('#skip'); await pg.waitForTimeout(200);
  chk('dock step on Corvane\'s ship', await pg.evaluate(() => !document.getElementById('dock').hidden));
  const p0 = await pg.evaluate(() => __iso.inspectP()); chk('clean ship: low chance (' + p0.toFixed(3) + ')', p0 > 0.02 && p0 < 0.05);
  const set = (trace, link, style, band) => pg.evaluate(([trace, link, style, band]) => DemoState.update(s => { s.tally.trace = trace; s.pell.link_recent = link; s.command.style = style; s.command.band = band; }), [trace, link, style, band]);
  await set(16, 2, 50, 'neutral'); const p1 = await pg.evaluate(() => __iso.inspectP());
  chk('trace and link use raise it (' + p1.toFixed(3) + ')', Math.abs(p1 - 0.222) < 1e-9);
  await set(16, 2, 70, 'loose'); const p2 = await pg.evaluate(() => __iso.inspectP()); await set(16, 2, 30, 'tight'); const p3 = await pg.evaluate(() => __iso.inspectP());
  chk('loose ship harder, tight easier', p2 > p1 && p3 < p1);
  await set(16, 2, 50, 'neutral');
  const run = async r => { const res = await pg.evaluate(r => __iso.dockStep(r), r); const tx = await pg.textContent('#tx'); await pg.evaluate(() => __iso.dockStep()); return { res, tx, st: await pg.evaluate(() => DemoState.load()) }; };
  let o = await run(0.1); chk('roll under p: found, audit_pending flag', o.res === 'found' && o.st.flags.inspection_found && o.st.flags.audit_pending && /Tally/.test(o.tx));
  chk('docking resets recent link use', o.st.pell.link_recent === 0);
  await set(16, 2, 50, 'neutral'); o = await run(0.3); chk('roll under 2p: questions, noticed flag', o.res === 'questions' && o.st.flags.inspection_noticed);
  await set(16, 2, 50, 'neutral'); o = await run(0.9); chk('otherwise clean', o.res === 'clean' && o.st.dock.last === 'clean' && o.st.dock.count === 3);
  chk('outcome text never shows the odds or the trace', !/\d+\s*%|trace/i.test(o.tx));
  chk('no page errors', !errs.length); if (errs.length) console.log(errs);
  await b.close(); console.log(bad ? 'FAILED' : 'ALL OK'); process.exit(bad ? 1 : 0);
})();
