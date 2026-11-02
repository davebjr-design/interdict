#!/usr/bin/env node
/* Pell gate (1.6b): hidden before the wiring scene, the red key object, the debug wiring panel and its state. Run: node tests/pell_gate.js */
const { chromium } = require('playwright');
let bad = 0; const chk = (m, c) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) bad++; };
(async () => { const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1400, height: 1000 } }); const pg = await ctx.newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  const R = 'file://' + require('path').resolve(__dirname, '..') + '/';
  const hunt = async () => { const h = await ctx.newPage(); h.on('pageerror', e => errs.push(e.message)); await h.goto(R + 'design/hunt.html'); await h.waitForTimeout(600); await h.click('#begin'); await h.waitForTimeout(400);
    const r = await h.evaluate(() => ({ ui: PELL_UI, key: PELL_KEY, vis: ['k-pell', 'g-integ'].map(i => getComputedStyle($(i)).visibility), dis: $('k-pell').classList.contains('dis'), sub: $('k-pell').textContent, integ: S.integration })); await h.close(); return r; };
  await pg.goto(R + 'design/proto_iso.html'); await pg.waitForTimeout(1200); await pg.click('#reset');
  let h = await hunt(); chk('before 1.6b: Pell hidden in a normal hunt', !h.ui && h.vis.every(v => v === 'hidden') && h.integ === 0);
  // red key in Corvane's control room, before the scene
  await pg.click('#skip'); await pg.waitForTimeout(300);
  const clickKey = async () => { const pt = await pg.evaluate(() => { const I = __iso, d = I.room.doors.find(x => x.id === 'redKey'), cv = document.getElementById('cv'), r = cv.getBoundingClientRect(), z = I.room.zoom || 1, c = I.cam; const wx = (d.rect[0] + d.rect[2]) / 2, wy = (d.rect[1] + d.rect[3]) / 2; return { x: r.left + (((wx - c.x) * z + 320) / 640) * r.width, y: r.top + (((wy - c.y) * z + 180) / 360) * r.height }; }); await pg.mouse.click(pt.x, pt.y); await pg.waitForTimeout(5000); };
  await pg.evaluate(() => { const b = [...document.querySelectorAll('#ch button')]; if (b[0]) b[0].click(); });
  await clickKey(); let tx = await pg.textContent('#tx'); chk('red key before 1.6b: dead switch line', /doesn't seem to do anything/.test(tx));
  const ch = async s => pg.evaluate(s => { const b = [...document.querySelectorAll('#ch button')].find(b => b.textContent.indexOf(s) === 0); if (b) b.click(); return !!b; }, s);
  chk('red key offers the debug scene', await ch('[Debug] Play the wiring'));
  await ch('Continue'); await ch('Continue');
  const opts = await pg.evaluate(() => [...document.querySelectorAll('#ch button')].map(b => b.textContent)); console.log('   choices', opts); chk('four choices', opts.length === 4);
  await ch('Seat it. Pell'); await ch("I'll tell you"); const fx = await pg.textContent('#fx'); await ch('Continue');
  let st = await pg.evaluate(() => JSON.parse(localStorage.getItem('interdict.state'))); console.log('   ', JSON.stringify(st.pell), JSON.stringify(st.tally), JSON.stringify(st.command));
  chk('option 1: wiring_seen, key live, trace 12, declared 0, style 52', st.pell.wiring_seen && st.pell.key === 'live' && st.tally.trace === 12 && st.tally.declared === 0 && st.command.style === 52);
  console.log('   fx:', fx); chk('trace never shown', !/trace|tally/i.test(fx) && !/\btrace\b|tally/i.test(await pg.evaluate(() => document.body.innerText)));
  chk('integration 10 saved', (await pg.evaluate(() => localStorage.getItem('interdict_integration'))) === '10');
  await clickKey(); tx = await pg.textContent('#tx'); chk('red key after: live line', /amber/.test(tx)); await ch('Continue');
  h = await hunt(); chk('after 1.6b (live): gauge and PELL ASSIST shown and enabled, integration 10', h.ui && h.vis.every(v => v !== 'hidden') && !h.dis && h.integ === 10);
  // option 4 (log) and option 3 (decline) through the debug button
  await pg.click('#dbgwire'); await ch('Continue'); await ch('Continue'); await ch('Seat it. And it goes'); await ch('Pell?'); await ch('Continue');
  st = await pg.evaluate(() => JSON.parse(localStorage.getItem('interdict.state'))); chk('option 4: trace 16, declared 0 (ruling a), key live', st.tally.trace === 16 && st.tally.declared === 0 && st.pell.key === 'live');
  await pg.click('#dbgwire'); await ch('Continue'); await ch('Continue'); await ch('Not tonight'); await ch('Continue');
  st = await pg.evaluate(() => JSON.parse(localStorage.getItem('interdict.state'))); chk('option 3: key dead, trace 10', st.pell.key === 'dead' && st.tally.trace === 10);
  h = await hunt(); chk('declined: gauge shown, PELL ASSIST disabled NOT TERMINATED', h.ui && h.dis && /NOT TERMINATED/.test(h.sub));
  await pg.click('#dbgwire'); await ch('Continue'); await ch('Continue'); await ch('Pell. It'); await ch('Continue');
  h = await hunt(); chk('asked: PELL ASSIST disabled ASK PELL', h.ui && h.dis && /ASK PELL/.test(h.sub));
  chk('no page errors', !errs.length); if (errs.length) console.log(errs);
  await b.close(); console.log(bad ? 'FAILED' : 'ALL OK'); process.exit(bad ? 1 : 0); })();
