#!/usr/bin/env node
/* Walk demo (design/proto_iso.html) flow checks. Run: node tests/walk_demo.js */
// Walk-demo checks: one click on a hatch object, the boarding prompt after Ames, the WALK THE SHIP tracker, restart clears state.
const { chromium } = require('playwright');
const FILE = 'file://' + require('path').resolve(__dirname, '../design/proto_iso.html');
let bad = 0; const chk = (m, c) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) bad++; };
async function clickObj(pg, roomDoorId) {   // click the centre of a door's rect on the canvas, once
  const pt = await pg.evaluate(id => { const I = __iso, d = I.room.doors.find(x => x.id === id), cv = document.getElementById('cv'), r = cv.getBoundingClientRect(), z = I.room.zoom || 1, c = I.cam;
    const wx = (d.rect[0] + d.rect[2]) / 2, wy = (d.rect[1] + d.rect[3]) / 2; return { x: r.left + (((wx - c.x) * z + 320) / 640) * r.width, y: r.top + (((wy - c.y) * z + 180) / 360) * r.height }; }, roomDoorId);
  await pg.mouse.click(pt.x, pt.y);
}
const txt = pg => pg.evaluate(() => ({ nm: __iso.said().nm, tx: __iso.said().tx, ch: [...document.querySelectorAll('.ch button')].map(b => b.textContent), job: document.getElementById('jobk').textContent + ' | ' + document.getElementById('jobt').textContent, done: document.getElementById('job').classList.contains('done') }));
const clickChoice = (pg, s) => pg.evaluate(s => { const b = [...document.querySelectorAll('.ch button')].find(b => b.textContent.indexOf(s) === 0); if (!b) return false; b.click(); return true; }, s);
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1400, height: 1000 } }); const errs = [];
  pg.on('pageerror', e => errs.push(e.message));
  await pg.goto(FILE + '#after_hunt'); await pg.waitForTimeout(1500);
  let s = await txt(pg); chk('after_hunt lands on the airlock entry', /airlock/i.test(s.job));
  await clickChoice(pg, 'Continue');
  // locked door: one click walks there and answers
  await pg.evaluate(() => __iso.setRoom('tern_junction', __iso.ROOMS.tern_junction.doors[0].stand)); await pg.waitForTimeout(300);
  await clickObj(pg, 'downToMess'); await pg.waitForTimeout(4000); s = await txt(pg);
  chk('locked ladder answers on the first click', /Not now/.test(s.tx));
  await clickChoice(pg, 'Continue');
  // junction <-> crew bunks (the opening room) both ways
  await clickObj(pg, 'toBunks'); for (let t = 0; t < 40 && (await pg.evaluate(() => __iso.room.id)) !== 'tern_bunks'; t++) await pg.waitForTimeout(250);
  chk('junction aft hatch leads to the crew bunks', (await pg.evaluate(() => __iso.room.id)) === 'tern_bunks');
  await pg.waitForTimeout(1500); await clickObj(pg, 'toJct'); for (let t = 0; t < 40 && (await pg.evaluate(() => __iso.room.id)) !== 'tern_junction'; t++) await pg.waitForTimeout(250);
  chk('bunks hatch leads back to the junction', (await pg.evaluate(() => __iso.room.id)) === 'tern_junction');
  await pg.waitForTimeout(1500);
  s = await txt(pg);
  chk('Ames catches you in the junction after the hunt', s.nm === 'Ames' && /hands shake/.test(s.tx));
  await clickChoice(pg, 'Keep them busy'); await clickChoice(pg, 'Continue');
  // outer hatch: one click, then the boarding prompt (Ames already spoke)
  await pg.evaluate(() => __iso.setRoom('tern_airlock', [3, 6])); await pg.waitForTimeout(300);
  await clickObj(pg, 'board'); await pg.waitForTimeout(5000); s = await txt(pg);
  chk('outer hatch answers on the first click', s.ch.includes('Begin boarding'));
  chk('boarding prompt shown after Ames', s.ch.includes('Begin boarding') && s.ch.includes('Look around first'));
  await clickChoice(pg, 'Look around first'); await clickChoice(pg, 'Continue');
  await clickObj(pg, 'board'); await pg.waitForTimeout(800); s = await txt(pg);
  chk('second visit goes straight to the prompt', s.ch.includes('Begin boarding'));
  await clickChoice(pg, 'Begin boarding'); await clickChoice(pg, 'Continue'); s = await txt(pg);
  chk('tracker: WALK THE SHIP 1 of 12', /WALK THE SHIP/.test(s.job) && /1 of 12/.test(s.job) && !s.done);
  chk('name gets Cptn. on Corvane\'s ship', await pg.evaluate(() => __iso.me.name.indexOf('Cptn.') === 0));
  const rooms = await pg.evaluate(() => Object.keys(__iso.ROOMS).filter(k => !__iso.ROOMS[k].ship));
  for (const r of rooms) { await pg.evaluate(r => __iso.setRoom(r, __iso.ROOMS[r].doors[0].stand), r); }
  s = await txt(pg); chk('tracker completes after all twelve', /12 of 12/.test(s.job) && s.done);
  // restart clears state
  await pg.evaluate(() => { localStorage.setItem('interdict.trims', '["x"]'); localStorage.setItem('interdict_integration', '22'); localStorage.setItem('interdict.state', '{"pell":{"wiring_seen":true}}'); });
  await pg.click('#reset'); await pg.waitForTimeout(200);
  const ls = await pg.evaluate(() => ({ t: localStorage.getItem('interdict.trims'), i: localStorage.getItem('interdict_integration'), s: localStorage.getItem('interdict.state'), h: location.hash, name: __iso.me.name }));
  chk('restart clears trims, integration, state and hash', !ls.t && !ls.i && !ls.s && !ls.h);
  chk('restart: name without Cptn.', ls.name.indexOf('Cptn.') !== 0);
  chk('PITCHES_LIVE off: no trim line', (await pg.textContent('#trimline')) === '');
  // CIC briefing staging (docs/scenes/p1_briefing.md): nobody stands inside furniture; Ames sits in the far-end chair; the player sits in the chair at the near end
  await pg.click('#skipop'); await pg.waitForTimeout(300);
  const stg = await pg.evaluate(() => { const r = __iso.ROOMS.tern_control, inP = (p, pg) => { let c = false; for (let a = 0, b = pg.length - 1; a < pg.length; b = a++) { const xi = pg[a][0], yi = pg[a][1], xj = pg[b][0], yj = pg[b][1]; if ((yi > p[1]) !== (yj > p[1]) && p[0] < (xj - xi) * (p[1] - yi) / (yj - yi) + xi) c = !c; } return c; };
    const inside = n => r.props.filter(pr => inP([n.x, n.y], pr.poly)).map(pr => pr.name);
    return { npcs: __iso.npcs.map(n => ({ name: n.name, seated: !!n.seated, dir: n.dir, inside: inside(n) })), seat: r.seat }; });
  const by = Object.fromEntries(stg.npcs.map(n => [n.name, n]));
  chk('Ostrow and Dunne stand clear of every solid (' + JSON.stringify(stg.npcs.filter(n => !n.seated).map(n => n.inside)) + ')', !by.Ostrow.seated && !by.Dunne.seated && !by.Ostrow.inside.length && !by.Dunne.inside.length);
  chk('Ames sits in chairA at the far end, facing the table', by.Ames.seated && by.Ames.inside.join() === 'chairA' && by.Ames.dir === 'se');
  for (let t = 0; t < 40 && !(await pg.evaluate(() => __iso.seated)); t++) await pg.waitForTimeout(250);
  chk('player sits in chairB for the briefing', await pg.evaluate(() => { const r = __iso.ROOMS.tern_control, pr = r.props.find(p => p.name === 'chairB'), p = [__iso.me.x, __iso.me.y]; let c = false; for (let a = 0, b = pr.poly.length - 1; a < pr.poly.length; b = a++) { const [xi, yi] = pr.poly[a], [xj, yj] = pr.poly[b]; if ((yi > p[1]) !== (yj > p[1]) && p[0] < (xj - xi) * (p[1] - yi) / (yj - yi) + xi) c = !c; } return __iso.seated && c; }));
  chk('movement blocked while seated (dialogue up)', await pg.evaluate(() => __iso.dlg));
  await clickChoice(pg, 'Continue'); await clickChoice(pg, 'Skip the hunt'); await clickChoice(pg, 'Continue');
  chk('briefing over: the player stands', await pg.evaluate(() => !__iso.seated && !__iso.holdSeat && !__iso.dlg));
  chk('walking resumes after the briefing', await pg.evaluate(() => __iso.go([12, 2])));
  chk('no page errors', !errs.length); if (errs.length) console.log(errs);
  await b.close(); console.log(bad ? 'FAILED' : 'ALL OK'); process.exit(bad ? 1 : 0);
})();
