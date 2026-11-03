#!/usr/bin/env node
/* P0 opening (docs/scenes/p0_opening.md): black, fade-up on the Tern's crew bunks, the call, the name, walk to the CIC, briefing. Run: node tests/opening.js */
const { chromium } = require('playwright');
const FILE = 'file://' + require('path').resolve(__dirname, '../design/proto_iso.html');
let bad = 0; const chk = (m, c) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) bad++; };
const txt = pg => pg.evaluate(() => ({ nm: __iso.said().nm, tx: __iso.said().tx, ch: [...document.querySelectorAll('.ch button')].map(b => b.textContent), job: document.getElementById('jobk').textContent + ' | ' + document.getElementById('jobt').textContent, jobHidden: document.getElementById('job').hidden, done: document.getElementById('job').classList.contains('done'), room: __iso.room.id }));
const clickChoice = (pg, s) => pg.evaluate(s => { const b = [...document.querySelectorAll('.ch button')].find(b => b.textContent.indexOf(s) === 0); if (!b) return false; b.click(); return true; }, s);
const cur = pg => pg.evaluate(() => { const c = document.getElementById('curtain'); return { ph: c.dataset.phase, op: +getComputedStyle(c).opacity }; });
async function clickDoor(pg, id) {
  const pt = await pg.evaluate(id => { const I = __iso, d = I.room.doors.find(x => x.id === id), cv = document.getElementById('cv'), r = cv.getBoundingClientRect(), z = I.room.zoom || 1, c = I.cam;
    const wx = (d.rect[0] + d.rect[2]) / 2, wy = (d.rect[1] + d.rect[3]) / 2; return { x: r.left + (((wx - c.x) * z + 320) / 640) * r.width, y: r.top + (((wy - c.y) * z + 180) / 360) * r.height }; }, id);
  await pg.mouse.click(pt.x, pt.y);
}
const waitRoom = async (pg, id, ms) => { for (let t = 0; t < ms; t += 200) { if ((await pg.evaluate(() => __iso.room.id)) === id && !(await pg.evaluate(() => __iso.me.steps.length))) return true; await pg.waitForTimeout(200); } return false; };
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1400, height: 1000 } }); const errs = [];
  pg.on('pageerror', e => errs.push(e.message));
  await pg.goto(FILE); await pg.waitForTimeout(250);
  let c = await cur(pg), s = await txt(pg);
  chk('black first (opacity 1, phase black)', c.ph === 'black' && c.op === 1);
  chk('starts in the Tern crew bunks, job hidden, no dialogue yet', s.room === 'tern_bunks' && s.jobHidden && !s.ch.length);
  chk('standing next to a bunk (start cell)', await pg.evaluate(() => __iso.me.i === __iso.ROOMS.tern_bunks.start[0] && __iso.me.j === __iso.ROOMS.tern_bunks.start[1]));
  await pg.waitForTimeout(1550); c = await cur(pg);
  chk('fading up after 1 s (opacity between 0 and 1)', c.ph === 'fade' && c.op > 0.05 && c.op < 0.95);
  s = await txt(pg); chk('no call during the fade', !s.ch.length);
  await pg.waitForTimeout(1300); c = await cur(pg); s = await txt(pg);
  chk('lights up: curtain gone', c.ph === 'up' && c.op === 0);
  chk('the call: "New guy, report to the CIC."', s.nm === 'Ostrow' && /New guy, report to the CIC\./.test(s.tx));
  await clickChoice(pg, 'On my way'); s = await txt(pg);
  chk('"What\'s your name again?" with a text entry', /What's your name again\?/.test(s.tx) && await pg.$('#nameIn') !== null);
  chk('entry limited to 12 characters', await pg.evaluate(() => document.getElementById('nameIn').maxLength === 12));
  await pg.click('#nameIn'); await pg.keyboard.press('Control+A'); await pg.keyboard.type('Vasquez<b>-Ochoa!!');
  const typed = await pg.inputValue('#nameIn'); chk('typing stops at 12 (' + typed + ')', typed.length === 12);
  await pg.keyboard.press('Enter'); s = await txt(pg);
  const nm = await pg.evaluate(() => ({ me: __iso.me.name, ls: localStorage.getItem('interdict.pname') }));
  chk('name sanitized and saved (' + nm.me + ')', nm.me === 'Vasquezb-O' && nm.ls === 'Vasquezb-O' && s.tx.indexOf('Vasquezb-O.') === 0);
  chk('no Cptn. prefix on the Tern', nm.me.indexOf('Cptn.') !== 0);
  await clickChoice(pg, 'Continue'); s = await txt(pg);
  chk('job tracker: Report to the CIC', !s.jobHidden && /FIRST JOB \| Report to the CIC/.test(s.job) && !s.done);
  // walk: bunks -> junction -> control (CIC)
  await clickDoor(pg, 'toJct'); chk('walked to the junction', await waitRoom(pg, 'tern_junction', 20000));
  s = await txt(pg); chk('no briefing in the junction', s.nm === 'Ship log');
  await clickDoor(pg, 'toControl'); chk('walked to the CIC', await waitRoom(pg, 'tern_control', 20000));
  s = await txt(pg);
  chk('arrival in the CIC starts the P1 briefing', s.nm === 'Ostrow' && /You're late\. Sit\./.test(s.tx) && s.ch.includes("That's enough."));
  chk('job ticked off', /Report to the CIC/.test(s.job) && s.done);
  await clickChoice(pg, "That's enough."); s = await txt(pg); chk('briefing ends into the hunt job', /HUNT/.test(s.job) && s.ch.includes('Begin the hunt'));
  // Cptn. prefix at handover still works
  await clickChoice(pg, 'Skip the hunt'); await pg.click('#skip'); await pg.waitForTimeout(200);
  chk('Cptn. prefix on Corvane\'s ship', (await pg.evaluate(() => __iso.me.name)) === 'Cptn. Vasquezb-O');
  // Restart replays the opening
  await pg.click('#reset'); await pg.waitForTimeout(200); c = await cur(pg); s = await txt(pg);
  chk('Restart replays the opening (black, bunks)', c.ph === 'black' && s.room === 'tern_bunks' && (await pg.evaluate(() => __iso.me.name)) === 'Vasquezb-O');
  await pg.waitForTimeout(2800); await clickChoice(pg, 'On my way');
  chk('name entry prefilled with the saved name', (await pg.inputValue('#nameIn')) === 'Vasquezb-O');
  await pg.fill('#nameIn', '   '); await clickChoice(pg, "That's me");
  chk('blank entry defaults to Rookie', (await pg.evaluate(() => [__iso.me.name, localStorage.getItem('interdict.pname')])).join() === 'Rookie,Rookie');
  // Skip opening: straight to the briefing in the control room, saved name
  await pg.click('#reset'); await pg.waitForTimeout(100); await pg.click('#skipop'); await pg.waitForTimeout(300); c = await cur(pg); s = await txt(pg);
  chk('Skip opening: CIC, briefing, curtain up', s.room === 'tern_control' && c.ph === 'up' && /You're late/.test(s.tx) && !s.jobHidden);
  await pg.waitForTimeout(3000); s = await txt(pg); chk('skipped opening does not come back', s.room === 'tern_control' && /You're late/.test(s.tx));
  chk('no page errors', !errs.length); if (errs.length) console.log(errs);
  await b.close(); console.log(bad ? 'FAILED' : 'ALL OK'); process.exit(bad ? 1 : 0);
})();
