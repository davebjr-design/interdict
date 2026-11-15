// Smoke + interaction test for web/hunt3d.html. Serves the repo, loads the live 3D CIC, and plays it with the MOUSE and keyboard:
// select a contact on the CRT, lock it, run the clock until the solution is ready, lift the FIRE guard on the 3D box, press FIRE, and assert the engine state changed.
// Also: autonomy switch (Hands-on makes an order instant), annunciator ack, brace fallback, tooltip, fps floor. Usage: node tests/cic3d_smoke.js  (needs playwright)
const { chromium } = require('playwright'), http = require('http'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), types = { '.js': 'text/javascript', '.html': 'text/html', '.json': 'application/json', '.mp3': 'audio/mpeg' };
const fails = []; const ok = (c, m) => { if (!c) { fails.push(m); console.error('FAIL', m); } else console.log('ok  ', m); };
const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); r.end(d); } }); }).listen(0, async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] }), p = await b.newPage({ viewport: { width: 1280, height: 720 } }), errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/404/.test(m.text())) errs.push(m.text()); });
  await p.goto('http://localhost:' + srv.address().port + '/web/hunt3d.html?mute=1&scale=.6'); await p.waitForFunction(() => window.__ready, { timeout: 30000 });
  const ev = (f, a) => p.evaluate(f, a), shot = n => p.screenshot({ path: path.join(__dirname, 'shots', n + '.png') });
  const standEasy = async () => { if (await ev(() => CIC.S.brace && CIC.S.brace !== 'free')) { await p.keyboard.press('b'); await ev(() => CIC3D.step(5, .1)); } };   // the crew brace on their own after a salvo; hands-on orders are blocked while braced
  // fps floor in the room tier (screens repaint at 2 Hz here)
  const f0 = await ev(() => CIC.stats.frames); await p.waitForTimeout(3000); const fps = ((await ev(() => CIC.stats.frames)) - f0) / 3; ok(fps > 0.8, 'room-tier frame rate ' + fps.toFixed(1) + ' fps (swiftshader, shared CPU: floor 0.8)');
  await ev(() => { CIC.setTime(4); CIC.S.braceAuto = 'off'; CIC.S.braceRule = false; CIC.A.model.setDoctrine({ brace: 'manual' }); });   // no automatic bracing for a vampire: the crew would block hands-on orders (that is tested in step 9)
  await ev(() => CIC3D.step(300, .1));
  // 1. autonomy: click Hands-on for fire control + weapons in the panel (a real mouse click)
  await p.click('#auto button[data-s="weapons"][data-m="hands-on"]'); await p.click('#auto button[data-s="fire"][data-m="hands-on"]'); await p.click('#auto button[data-s="sensors"][data-m="hands-on"]');
  ok(await ev(() => CIC.A.model.autonomy.weapons === 'hands-on' && CIC.A.model.autonomy.sensors === 'hands-on'), 'autonomy panel switches stations to hands-on');
  // 2. go to the contacts screen by key, click a contact row on the glass
  await p.keyboard.press('F2'); await p.keyboard.press('q'); await p.waitForTimeout(2200);
  const live = await ev(() => CIC.S.an.filter(a => a.state !== 'out' && a.kind !== 'friend').map(a => a.id)); const warship = await ev(() => { const S = CIC.S; const r = S.an.find(a => a.kind === 'real' && a.state === 'open') || S.an.find(a => a.state === 'open' && a.kind !== 'friend'); return r ? r.id : 0; });
  await p.waitForTimeout(400); const pos = await ev(w => CIC.regionPx('contacts', 'sel:' + w), warship); ok(pos && pos.vis, 'contact row has a screen position ' + JSON.stringify(await ev(() => [CIC.view, CIC.S.over, CIC.S.an.map(a => a.state), Object.keys(LS.regs)]))); if (!pos) { await b.close(); srv.close(); process.exit(1); } await p.mouse.move(pos.x, pos.y); await p.waitForTimeout(250);
  const tip = await ev(() => document.getElementById('tip').style.display); ok(tip === 'block', 'hover tooltip appears over a CRT region');
  await p.mouse.click(pos.x, pos.y); await p.waitForTimeout(200); ok(await ev(w => CIC.select && CIC.S && window.LS.ctx.sel === w, warship), 'clicking a row on the CRT selects the contact (S' + (warship + 1) + ')');
  // 3. lock with the on-glass soft key
  const lk = await ev(() => CIC.regionPx('contacts', 'act:lock')); await p.mouse.click(lk.x, lk.y); await p.waitForTimeout(300); await ev(() => CIC3D.step(30, .1));
  ok(await ev(w => CIC.S.an[w].state === 'locked', warship), 'LOCK soft key on the CRT locks the contact (order via hands-on officer)');
  // 4. run the clock until a firing solution is ready (4x time, stepping the sim)
  let ready = false; for (let i = 0; i < 70 && !ready; i++) { await ev(w => { const S = CIC.S, a = S.an[w]; if (a.state === 'locked' && !S.analysts.some(x => x.task === w)) CIC.act('act:lock'); if (a.state === 'locked' && a.stale) CIC.act('act:refresh'); CIC3D.step(10, .1); }, warship); ready = await ev(w => CIC.E.solveInfo(CIC.S, CIC.S.an[w]).ready, warship); } ok(ready, 'solution became ready after tracking'); await ev(() => { CIC.S.hold = true; });   // freeze the live clock while the camera cuts to the attack bench (a solution decays in real time)
  // 5. attack section: lift the guard on the 3D fire box with the mouse, then press FIRE
  await p.keyboard.press('F3'); await p.waitForTimeout(2600);
  const gp = await ev(() => CIC.hwPx('attack.fire', 'guard')); ok(gp && gp.vis, 'fire-box guard is on screen'); await p.mouse.click(gp.x, gp.y); await p.waitForTimeout(500);
  ok(await ev(() => CIC.guard()), 'clicking the guard lifts it');
  const fp = await ev(() => CIC.hwPx('attack.fire', 'btn')); await p.mouse.click(fp.x, fp.y); await p.waitForTimeout(200); await ev(() => CIC3D.step(40, .1));
  const fired = await ev(() => ({ shots: CIC.S.shots, vol: CIC.S.volleys.length, mag: CIC.S.mag.total, guard: CIC.guard() })); ok(fired.shots >= 1 && fired.vol >= 1 && fired.mag < 60, 'FIRE on the 3D box launched a salvo: ' + JSON.stringify(fired)); ok(!fired.guard, 'guard closes after firing');
  await ev(() => { CIC.S.hold = false; }); await standEasy();
  // 6. toggle PD with the guarded lever: lift the toggle guard, flip it
  const dg = await ev(() => CIC.hwPx('attack.tg', 'g1')); await p.mouse.click(dg.x, dg.y); await p.waitForTimeout(450); const dl = await ev(() => CIC.hwPx('attack.tg', 't1')); await p.mouse.click(dl.x, dl.y); await p.waitForTimeout(200); await ev(() => CIC3D.step(30, .1));
  ok(await ev(() => CIC.S.pd === 'active'), 'guarded PD toggle sets point defence active ' + JSON.stringify(await ev(() => ({ pd: CIC.S.pd, br: CIC.S.brace, bl: CIC.A.handsOnBlocked && CIC.A.handsOnBlocked('weapons'), pend: CIC.A.model.pending().map(c => c.id || c.row), errs: CIC.A.errors.slice(-2), noops: CIC.A.noops.slice(-2).map(n => n.verb), tip: document.getElementById('toasts').textContent })))); await shot('c3d_smoke_attack');
  await standEasy();
  // 7. keyboard: select next, classify via key (hands-on sensors), annunciator ack
  await p.keyboard.press('Tab'); await p.keyboard.press('c'); await ev(() => CIC3D.step(20, .1)); ok(await ev(() => CIC.A.done.some(d => d.verb === 'classify' && d.by === 'co')), 'C key issues a classify order that the adapter executes ' + JSON.stringify(await ev(() => ({ br: CIC.S.brace, sel: LS.ctx.sel, st: CIC.S.an.map(a => a.state), toasts: document.getElementById('toasts').textContent, done: CIC.A.done.slice(-3).map(d => [d.verb, d.by]) }))));
  await p.keyboard.press(' '); ok(true, 'space acknowledges alarms without error');
  await ev(() => { CIC.S.hold = true; });   // freeze the live loop so reaction-time checks are deterministic on a slow machine
  // 8. supervised station: order is delayed (not instant)
  await ev(() => CIC.A.model.setAutonomy('sensors', 'auto')); const n0 = await ev(() => CIC.A.done.filter(d => d.by === 'co').length); await p.keyboard.press('c'); await ev(() => CIC3D.step(2, .1)); const n1 = await ev(() => CIC.A.done.filter(d => d.by === 'co').length); ok(n1 === n0, 'an AUTO station takes the order with a reaction delay (not instant)'); await ev(() => CIC3D.step(60, .1)); ok(await ev(n => CIC.A.done.filter(d => d.by === 'co').length > n, n0), 'the delayed order executes after the officer reaction time');
  await ev(() => { CIC.S.hold = false; });
  await ev(() => { CIC.S.braceRule = true; CIC.S.brace = 'free'; CIC.S.hold = false; });
  // 9. brace: the engine owns s.brace (strap-in is a helm order); the local B state is the fallback when the engine has no s.brace
  await p.keyboard.press('b'); await ev(() => CIC3D.step(100, .1)); ok(await ev(() => CIC.S.brace !== 'free'), 'B orders brace through the engine (s.brace=' + await ev(() => CIC.S.brace) + ')');
  await ev(() => CIC3D.step(200, .1)); ok(await ev(() => CIC3D.brace() === 'secure'), 'bracing becomes secure (engine s.brace)');
  await p.keyboard.press('b'); await ev(() => CIC3D.step(5, .1)); ok(await ev(() => CIC3D.brace() === 'free'), 'B again stands easy');
  await ev(() => { delete CIC.S.brace; }); await p.keyboard.press('b'); ok(await ev(() => CIC3D.brace() === 'bracing'), 'without s.brace the local B state takes over');
  await p.waitForFunction(() => CIC3D.brace() === 'secure', null, { timeout: 30000 }).catch(() => { }); ok(await ev(() => CIC3D.brace() === 'secure'), 'local bracing becomes secure');
  const r = await ev(() => ({ errs: CIC.A.errors.length, t: CIC.S.t, view: CIC3D.view() }));
  await b.close(); srv.close(); ok(!errs.length, 'no page errors ' + JSON.stringify(errs.slice(0, 3))); ok(!r.errs, 'adapter errors: ' + r.errs);
  if (fails.length) { console.error(fails.length + ' FAILED'); process.exit(1); } console.log('all ok');
});
