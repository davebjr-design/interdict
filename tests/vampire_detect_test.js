// Vampire detection rule (docs/mechanics_vampire_detect.md): a launch is seen with the probability of the observer's detection level of the launcher,
// a seeker that goes hot is always seen, a blind volley (seeker never hot) whose launch roll failed is never called, and point defence engages only seen volleys.
// node tests/vampire_detect_test.js
const E = require('../web/hunt_rt_engine.js'), fs = require('fs'), path = require('path');
let bad = 0; const chk = (m, c) => { console.log(c ? 'ok   ' : 'FAIL ', m); if (!c) bad++; };
const SPM = E.RULES.secPerMin;
const calm = (seed, o) => E.newHunt(seed, Object.assign({ nreal: 1, entry: 'standard' }, o));
const readTo = (s, a, level) => { a.read = {}; if (level > 0) a.read.thermal = { num: 0.9 * level * 20, den: level * 20, t: s.t, cat: 'strong' }; };   // position confidence = level (den / uncDen)
// force the one warship to fire now; its detection level by us is `level`; returns the volley it fired
const shoot = (seed, level, opts, mod) => {
  const s = calm(seed, opts); s.pd = 'off'; const a = s.an.find(x => x.kind === 'real'); a.aware = true; a.know = 1;
  const p = E.truePos(a, s.t); s.player.x = p.x + 60; s.player.y = p.y; E.tick(s, 1e-6); s.vel = { vx: 0, vy: 0 };   // place us 60 km off (a pre-tick lets the engine push us out of any planet first)
  a.heard = { x: s.player.x, y: s.player.y, vx: 0, vy: 0, t: s.t }; a.state = 'open'; a.nextFire = s.t; a.nextMan = s.t + 99; readTo(s, a, level >= 1 ? 3 : level); if (mod) mod(s, a);   // level 1 is read evidence 3x over, so the tiny decay before the shot cannot take it under 1
  const t0 = s.t, n0 = s.inc.length; for (let i = 0; i < 40 && s.inc.length === n0; i++) E.tick(s, 0.02);
  const v = s.inc.length > n0 ? s.inc[s.inc.length - 1] : null; return { s, a, v: v && v.t0 - t0 < 0.05 ? v : null };   // only a shot fired on the first tick counts: the analysts have not touched the read yet
};
const vampLog = s => s.log.filter(l => /has launched|Vampire/.test(l.text));

// ---- the quantity: detection level ----
{ const s = calm(1); const a = s.an.find(x => x.kind === 'real');
  chk('detectLevel is exported', typeof E.detectLevel === 'function');
  chk('never read: level 0', E.detectLevel(s, a) === 0);
  readTo(s, a, 0.5); chk('open, read evidence 10 of 20: level 0.5', Math.abs(E.detectLevel(s, a) - 0.5) < 1e-9);
  readTo(s, a, 3); chk('capped at 1', E.detectLevel(s, a) === 1);
  readTo(s, a, 1.2); s.t += 3; chk('the evidence decays with the 3 minute half life (24 -> 12 of 20 -> 0.6)', Math.abs(E.detectLevel(s, a) - 0.6) < 0.01); s.t -= 3;
  E.lockContact(s, a.id); a.read = {}; chk('locked and fresh: about 1', E.detectLevel(s, a) > 0.95);
  s.t += 5; chk('locked but the track is old: level falls', E.detectLevel(s, a) < 0.8);
  a.state = 'disabled'; chk('a wreck: 0', E.detectLevel(s, a) === 0); }

// ---- statistical: the launch is seen with probability = level ----
{ const N = 400, rows = [];
  for (const L of [0, 0.25, 0.5, 0.75, 1]) { let seen = 0, mean = 0, n = 0; for (let i = 0; i < N; i++) { const r = shoot(5000 + i, L); if (!r.v) continue; n++; mean += r.v.level; if (r.v.seen) seen++; if (r.v.seen && r.v.via !== 'launch') seen = -1e9; } rows.push({ L, n, f: seen / n, lv: mean / n }); }
  for (const r of rows) chk(`level ${r.L}: launch seen ${(r.f * 100).toFixed(1)}% of ${r.n} volleys (mean level ${r.lv.toFixed(3)})`, r.n > N * 0.95 && Math.abs(r.f - r.lv) < (r.L === 0 || r.L === 1 ? 0.0001 : 0.09));
  chk('seen at launch rises with the level', rows.every((r, i) => !i || r.f > rows[i - 1].f)); }
{ const a = shoot(5100, 1), b = shoot(5100, 1); chk('same seed, same roll', a.v.seen === b.v.seen && a.v.level === b.v.level); }

// ---- seeker hot: always seen ----
{ let ok = 0, n = 0, lateOk = 0;
  for (let i = 0; i < 100; i++) { const r = shoot(6000 + i, 0); if (!r.v || r.v.seen) continue; n++; const v = r.v; let g = 0; while (r.s.inc.includes(v) && g++ < 4000 && !r.s.over) E.tick(r.s, 0.01);
    if (v.seen === true && v.via === 'seeker' && v.hot === true && v.seenT >= v.seekAt - 1e-9 && v.seenT < v.at) ok++; }
  chk(`unseen at launch, then seen when the seeker goes hot, ${ok} of ${n} (via seeker, before impact)`, n >= 90 && ok === n);
  const r = shoot(6200, 1), v = r.v; let g = 0; while (r.s.inc.includes(v) && g++ < 4000 && !r.s.over) E.tick(r.s, 0.01);
  chk('seen at launch: it goes hot later (v.hot) and keeps via launch', v.seen === true && v.via === 'launch' && v.hot === true); }

// ---- blind volley: seeker never goes hot ----
{ let miss = 0, n = 0, callsOK = 0, hits = 0;
  for (let i = 0; i < 60; i++) { const r = shoot(7000 + i, 0, { seekerActive: 0, braceAuto: 'off' }); if (!r.v) continue; n++; const v = r.v; const h0 = r.s.hull, e0 = (r.s.evts || []).length;
    if (v.seen === false && v.blind === true && v.seekAt === Infinity) miss++; let g = 0; while (r.s.inc.includes(v) && g++ < 4000 && !r.s.over) E.tick(r.s, 0.01);
    if (v.seen === false && v.via == null && !vampLog(r.s).length && !(r.s.warn || []).length && !(r.s.evts || []).some(e => e.type === 'vampire')) callsOK++;
    if (r.s.events.some(e => e.kind === 'theirs')) hits++; }
  chk(`blind volley, launch roll failed: never seen (${miss} of ${n} blind), never called (${callsOK} of ${n}), and it still lands (${hits} of ${n} resolved)`, n >= 55 && miss === n && callsOK === n && hits === n);
  const r = shoot(7200, 1, { seekerActive: 0 }); chk('a blind volley whose launch roll succeeded is called at launch (and only then)', r.v.seen === true && r.v.via === 'launch' && r.v.blind === true);
  const q = shoot(7300, 0, { braceAuto: 'vampire', seekerActive: 0 }); let br = false; for (let i = 0; i < 4000 && q.s.inc.includes(q.v) && !q.s.over; i++) { E.tick(q.s, 0.01); if (q.s.brace !== 'free') br = true; }
  chk('...and the crew do not auto-brace for a volley they never saw', q.v.seen === false && br === false); }
{ const dflt = E.AI.blind; chk('AI.blind defaults to 0 (no change to normal hunts)', dflt === 0);
  let bl = 0, n = 0; for (let i = 0; i < 80; i++) { const r = shoot(7400 + i, 0, null, (s, a) => { a.ai.blind = 0.5; s.quietUntil = s.t + 10; a.quietRoll = { until: s.quietUntil, fire: true }; a.cdone = 1; }); if (!r.v) continue; n++; if (r.v.blind) bl++; }
  chk(`AI.blind 0.5 while we are quiet: about half the volleys are dark (${bl} of ${n})`, n > 40 && bl > n * 0.3 && bl < n * 0.7);
  let bl2 = 0, n2 = 0; for (let i = 0; i < 40; i++) { const r = shoot(7500 + i, 0, null, (s, a) => { a.ai.blind = 1; }); if (!r.v) continue; n2++; if (r.v.blind) bl2++; }
  chk('AI.blind only applies to a volley fired at a stale fix (we are not quiet: none are dark)', n2 > 30 && bl2 === 0); }

// ---- point defence engages only seen volleys ----
{ const cutsFor = seen => { let cuts = 0, lands = 0; for (let i = 0; i < 120; i++) { const s = calm(8000 + i, { braceAuto: 'off' }); s.pd = 'active'; s.pdReadyAt = 0; s.pdUntil = s.t + 99; const a = s.an.find(x => x.kind === 'real');
      s.inc.push({ dmg: 1, id: a.id, foe: true, t0: s.t, at: s.t + 3 / SPM, from: { x: 100, y: 100 }, aim: { x: s.player.x, y: s.player.y }, dir: 0, cone: 0.1, disp: 0.1, off: Array.from({ length: 6 }, () => [0, 0]), stretch: 1, killR: 12, dmgW: 5, seen, seekAt: seen ? s.t : Infinity, hot: !!seen });
      for (let t = 0; t < 6 && s.inc.length; t += 0.25) E.tick(s, 0.25 / SPM); cuts += s.log.filter(l => /Point defence cut/.test(l.text)).length; if (s.events.some(e => e.kind === 'theirs')) lands++; } return { cuts, lands }; };
  const u = cutsFor(false), sn = cutsFor(true);
  chk(`PD with an unseen volley: no engagement in 120 volleys (cuts ${u.cuts}, resolved ${u.lands})`, u.cuts === 0 && u.lands === 120);
  chk(`PD with the same volley seen: it cuts warheads (${sn.cuts} cuts in 120)`, sn.cuts > 20);
  chk('pdIntercept itself is unchanged (the gate is the volley, not the grid)', E.pdIntercept({ pd: 'active', pdReadyAt: 0, t: 1, me: E.PLAYER }, 0.1) > 0); }

// ---- the off switch ----
{ E.RULES.launchDetect = 0; let any = 0; for (let i = 0; i < 60; i++) { const r = shoot(9000 + i, 1); if (r.v && r.v.seen) any++; } E.RULES.launchDetect = 1; chk(`RULES.launchDetect = 0: even a level-1 launcher is not seen at launch (${any} of 60)`, any === 0); }

// ---- the symmetric case: their detection of our launches ----
const ourShot = (seed, know, mod) => { const s = calm(seed, { nreal: 1 }); s.pd = 'off'; const a = s.an.find(x => x.kind === 'real'); a.know = know; E.lockContact(s, a.id); a.solve = 1; a.stale = false; scanFix(s, a); if (mod) mod(s, a); const k0 = a.know; const ok = E.fire(s, a.id, null, 4, 'he', false); return { s, a, ok, d: a.know - k0 }; };
const scanFix = (s, a) => { a.anchor = { x: E.truePos(a, s.t).x, y: E.truePos(a, s.t).y, pe: 1, t: s.t, hdg: 0, spd: 0.1, hs: 0.1, ss: 0.1 }; };
{ for (const K of [0, 0.5, 1]) { let hit = 0, n = 0; for (let i = 0; i < 300; i++) { const r = ourShot(10000 + i, K); if (!r.ok) continue; n++; if (r.d > 1e-9) hit++; }
    chk(`their detection level ${K}: our launch is noticed by ${(hit / n * 100).toFixed(0)}% of ${n} volleys`, n > 280 && (K === 0 ? hit === 0 : K === 1 ? hit === n : Math.abs(hit / n - 0.5) < 0.09)); }
  E.RULES.launchSym = 0; let hit = 0, n = 0; for (let i = 0; i < 300; i++) { const r = ourShot(10000 + i, 0); if (!r.ok) continue; n++; if (r.d > 1e-9) hit++; } E.RULES.launchSym = 1;
  chk(`RULES.launchSym = 0: the old flat launchSeen roll (${(hit / n * 100).toFixed(0)}%, about ${E.PLAYER.launchSeen * 100}%) whatever they know`, Math.abs(hit / n - E.PLAYER.launchSeen) < 0.09);
  const q = ourShot(10500, 1); chk('a noticed launch gets Abara\'s line', q.s.log.some(l => /Launch signature detected/.test(l.text)));
  const z = ourShot(10501, 0); chk('an unnoticed launch does not', !z.s.log.some(l => /Launch signature detected/.test(l.text))); }

// ---- the 2D pages read only seen volleys ----
{ const root = path.join(__dirname, '..', 'web'), bare = /\bS\.inc\b(?!\s*=)/, files = ['hunt_console.js', 'hunt_rt_template.html'];
  for (const f of files) { const src = fs.readFileSync(path.join(root, f), 'utf8'); const hits = src.split('\n').map((l, i) => [i + 1, l]).filter(([, l]) => bare.test(l)); chk(`${f}: no unfiltered S.inc read${hits.length ? ' (lines ' + hits.map(h => h[0]).join(', ') + ')' : ''}`, hits.length === 0); }
  const built = fs.readFileSync(path.join(root, 'hunt_rt.html'), 'utf8'); chk('web/hunt_rt.html (built from them) has none either', !built.split('\n').some(l => bare.test(l) && !/S\.inc\.length > n0/.test(l))); }
console.log(bad ? bad + ' FAILED' : 'ALL OK'); process.exit(bad ? 1 : 0);
