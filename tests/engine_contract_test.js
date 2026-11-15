// Engine contract tests (docs/systems_contract.md s7 items 1-5). node tests/engine_contract_test.js
const E = require('../web/hunt_rt_engine.js'), S = require('../web/station_model.js');
let bad = 0; const chk = (m, c) => { console.log(c ? 'ok   ' : 'FAIL ', m); if (!c) bad++; };
const reals = s => s.an.filter(a => a.kind === 'real');
const dist = (s, a) => { const p = E.truePos(a, s.t); return Math.hypot(p.x - s.player.x, p.y - s.player.y); };

// 1. enemy launches are announced only when DETECTED: either the launcher is on our plot at launch, or the seeker goes active (v.seen, v.via)
{ const found = { launch: null, seeker: null };
  for (let seed = 1; seed <= 80 && !(found.launch && found.seeker); seed++) {
    const s = E.newHunt(seed, { nreal: 2 });
    for (let i = 0; i < 1200 && !s.over; i++) {
      const n0 = s.inc.length, l0 = s.log.length, e0 = s.evts.length;
      if (seed % 2 === 0) for (const a of s.an) if (a.kind === 'real' && a.aware && s.t >= a.nextFire - 0.06 && a.state === 'open') a.state = 'out';   // half the hunts: the shooter is off our plot when it fires
      else for (const a of s.an) if (a.kind === 'real' && a.aware && s.t >= a.nextFire - 0.06 && a.state === 'open') for (const ch of ['thermal', 'reactor', 'occlusion']) a.read[ch] = { num: 0.9 * 8, den: 8, t: s.t, cat: 'strong' };   // the other half: the shooter is well read (detection level 1 at launch)
      E.tick(s, 0.05);
      if (s.inc.length > n0) { const v = s.inc[s.inc.length - 1], k = v.seen ? 'launch' : 'seeker'; if (!found[k]) { found[k] = { s, v, log: s.log.slice(l0), evts: s.evts.slice(e0), l0, e0 }; break; } }   // freeze this hunt at the find (the next volley's seeker call must not land in the slice)
    }
  }
  chk('an enemy fired on a plotted launcher within 80 seeded hunts', !!found.launch); chk('an enemy fired from the dark within 80 seeded hunts', !!found.seeker);
  if (found.seeker) { const { s, v } = found.seeker;
    chk('seeker route: the volley is unseen at launch (v.seen false, no warn, no Dace line)', v.seen === false && !(s.warn || []).some(w => w.id === v.id && Math.abs(w.t - v.t0) < 1e-6) && !found.seeker.log.some(l => /has launched|Vampire/.test(l.text)));
    chk('seeker route: seekAt is before impact and after launch', v.seekAt >= v.t0 && v.seekAt <= v.at && v.via == null);
    const l1 = s.log.length, e1 = s.evts.length; let guard = 0; while (v.seen === false && s.inc.includes(v) && guard++ < 4000 && !s.over) E.tick(s, 0.02);
    if (s.inc.includes(v) || v.seen) { chk('seeker route: it lights up (seen, via seeker) before it lands', v.seen === true && v.via === 'seeker');
      const ve = s.evts.slice(e1).find(e => e.type === 'vampire'); chk('seeker route: vampire event says via seeker, no contact number', ve && ve.data.via === 'seeker' && ve.data.n == null && ve.data.etaSec > 0 && ve.data.etaSec < 9);
      chk('seeker route: Dace calls it ("Vampire, seeker active, bearing NNN, impact in S seconds")', s.log.slice(l1).some(l => /Vampire, seeker active, bearing \d{3}, impact in \d+ seconds/.test(l.text) && l.urgent && l.who === 'Dace'));
      const M = S.create({ seed: 1 }); const c = M.onEvent(ve); chk('seeker route: the station model maps it to W5 with an eta', c && c.row === 'W5' && /\d+ seconds/.test(c.line)); } }
  if (found.launch) { const { s, v, log, evts } = found.launch, ve = evts.find(e => e.type === 'vampire');
    chk('launch route: v.seen true, v.via launch', v.seen === true && v.via === 'launch');
    chk('s.warn gets an entry for the launch', (s.warn || []).some(w => w.id === v.id && Math.abs(w.t - v.t0) < 1e-6));
    chk('a log line announces it (Dace, urgent, "Contact N has launched, impact in")', log.some(l => /Contact \d+ has launched, impact in/.test(l.text) && l.urgent && l.who === 'Dace'));
    chk('a vampire event carries bearing and eta', ve && ve.data.id === v.id && ve.data.bearing >= 0 && ve.data.bearing < 360 && Math.abs(ve.data.at - v.at) < 1e-6 && ve.data.etaSec > 0);
    chk('the shooter is marked hostile', s.an[v.id].idStatus === 'hostile');
    const M = S.create({ seed: 1 }); const c = M.onEvent(ve); chk('the station model maps the vampire event to W5 (priority 4) with an eta', c && c.row === 'W5' && c.pri === 4 && /Impact in \d+ seconds/.test(c.line)); } }

// 2. structured events beside report(); station model takes them
{ const s = E.newHunt(5); chk('newHunt creates s.evts', Array.isArray(s.evts) && s.evts.length === 0);
  E.evt(s, 'test', { a: 1 }); chk('evt pushes {type, data, t}', s.evts[0].type === 'test' && s.evts[0].data.a === 1 && s.evts[0].t === s.t);
  const M = S.create({ seed: 2, autonomy: { weapons: 'supervised', sensors: 'supervised' } });
  const rows = ['ping_alert', 'probe_reaction', 'mag_low', 'track_lost'].map(type => { const c = M.onEvent({ type, data: { n: 2, id: 1, total: 12, salvos: 2, how: 'pd' } }); return c && c.row; });
  chk('onEvent maps ping_alert, probe_reaction, mag_low, track_lost to S6, W9, W8, S5: ' + rows, rows.join() === 'S6,W9,W8,S5');
  chk('onEvent accepts the flat form {type, ...}', (S.create({ seed: 3 }).onEvent({ type: 'ping_alert', n: 4 }) || {}).row === 'S6');
  chk('unknown events are ignored', S.create({ seed: 3 }).onEvent({ type: 'nothing' }) === null);
  // an enemy ping produces ping_alert
  let pa = null; for (let seed = 1; seed <= 30 && !pa; seed++) { const h = E.newHunt(seed); for (let m = 0; m < 40 && !h.over && !pa; m++) { E.tick(h, 1); pa = h.evts.find(e => e.type === 'ping_alert'); } }
  chk('an enemy ping produces a ping_alert event with a bearing', pa && pa.data.n >= 1 && pa.data.bearing >= 0); }

// 3. active ping alert reach = 2x the hearer's detection radius
{ let done = false;
  for (let seed = 1; seed <= 60 && !done; seed++) {
    const s = E.newHunt(seed, { nreal: 1 }), a = reals(s)[0], tgt = s.an.find(x => x.kind !== 'real' && x.kind !== 'friend');
    if (E.blocked(s, E.truePos(a, s.t), s.player) || !tgt) continue;
    const d = dist(s, a), k0 = a.know || 0; E.pingContact(s, tgt.id); const gain = a.know - k0;
    const want = E.PLAYER.pingAlert * E.rangeF(d, a.ai.sensR * 2), old = E.PLAYER.pingAlert * E.rangeF(d, a.ai.sensR);
    chk(`ping alert on an untargeted warship at ${d.toFixed(0)} km uses 2x its detection radius (${gain.toFixed(3)} vs ${want.toFixed(3)}; 1x would be ${old.toFixed(3)})`, Math.abs(gain - Math.min(1.2, want + k0) + k0) < 1e-9 && gain > old);
    done = true;
  }
  chk('found an unblocked ping case', done); }

// 4. magazine: 60 = 10 x 6, spent by fire and probe, refuses when empty, mag_low at <= 12
{ const s = E.newHunt(7, { nreal: 1 }); const a = reals(s)[0];
  chk('magazine starts at 60 = 10 salvos of 6', s.mag.total === 60 && s.mag.salvos === 10 && s.mag.perSalvo === 6 && Object.values(s.mag.byKind).reduce((x, y) => x + y, 0) === 60);
  E.lockContact(s, a.id); a.solve = 1; const he0 = s.mag.byKind.he;
  chk('a salvo fires', E.fire(s, a.id, null, 6)); chk('fire spends six of that warhead kind', s.mag.total === 54 && s.mag.byKind.he === he0 - 6);
  const s2 = E.newHunt(7, { nreal: 1, mag: { byKind: { he: 14, emp: 0, flare: 0 } } }), b = reals(s2)[0]; E.lockContact(s2, b.id); b.solve = 1;
  E.fire(s2, b.id, null, 6); const low = s2.evts.find(e => e.type === 'mag_low');
  chk('mag_low fires once the stock is at or under 12', low && low.data.total === 8 && s2.mag.lowSaid);
  s2.tubes = s2.tubes.map(() => 0); E.fire(s2, b.id, null, 6); s2.tubes = s2.tubes.map(() => 0); E.fire(s2, b.id, null, 6); chk('a short salvo uses what is left (2 missiles)', s2.mag.total === 0 && s2.volleys[s2.volleys.length - 1].off.length === 2);
  s2.tubes = s2.tubes.map(() => 0); const l0 = s2.log.length;
  chk('fire refuses when the magazine is empty', E.fire(s2, b.id, null, 6) === false && s2.volleys.length === 3);
  chk('with an Abara log line', s2.log.slice(l0).some(l => l.who === 'Abara' && /Magazine empty/.test(l.text)));
  chk('and the tube is not used', s2.tubes.every(x => x === 0));
  const s3 = E.newHunt(7, { nreal: 1 }); const c = reals(s3)[0]; E.lockContact(s3, c.id); c.solve = 1;
  chk('fire refuses a warhead kind that has run out', (s3.mag.byKind.emp = 0, E.fire(s3, c.id, null, 6, 'emp')) === false && s3.log.some(l => /No EMP warheads left/.test(l.text)));
  const s4 = E.newHunt(8); E.probe(s4, { x: s4.player.x + 60, y: s4.player.y }, 2); chk('a probe spends 2 real missiles', s4.mag.total === 58 && s4.probes.length === 1); }

// 5. point defence: state, visibility, intercept law, enemy PD as an event, probes
{ const s = E.newHunt(9, { nreal: 2 });
  chk('player point defence starts armed', s.pd === 'armed');
  const p0 = E.pdIntercept(s, 9); s.pd = 'off'; const pOff = E.pdIntercept(s, 9); s.pd = 'armed';
  const ex0 = E.exposure(s).total, k0 = reals(s).map(a => a.know || 0);
  chk('setPD active', E.setPD(s, 'active') && s.pd === 'active');
  const pSpin = E.pdIntercept(s, 9); s.t += E.PLAYER.pdArm + 0.001; const pAct = E.pdIntercept(s, 9);
  chk(`intercept: off 0, armed low (cold factor), active full after the 2 s arm time (${pOff}, ${p0.toFixed(3)}, ${pSpin.toFixed(3)}, ${pAct.toFixed(3)})`, pOff === 0 && p0 > 0 && Math.abs(p0 - pAct * E.PLAYER.pdCold) < 1e-12 && Math.abs(pSpin - p0) < 1e-12 && pAct > p0);
  chk('active point defence adds to our exposure (a visibility event)', E.exposure(s).parts.some(x => x.k === 'pd') && E.exposure(s).total > ex0);
  chk('going active alerts the hunters a little', reals(s).every((a, i) => a.know >= k0[i]) && reals(s).some((a, i) => a.know > k0[i]));
  chk('a pd event was emitted', s.evts.some(e => e.type === 'pd' && e.data.state === 'active'));
  E.tick(s, E.PLAYER.pdDur + 0.2); chk('with nothing incoming it drops back to armed', s.pd === 'armed' || s.inc.length > 0);
  // intercepts actually happen against incoming volleys
  let cutOn = 0, cutOff = 0, landed = 0;
  for (let seed = 100; seed < 160; seed++) for (const mode of ['off', 'active']) {
    const h = E.newHunt(seed, { nreal: 1 }); const a = reals(h)[0]; E.setPD(h, mode); h.t += 0.2;
    const v = { dmg: 1, id: a.id, foe: true, t0: h.t, at: h.t + 0.001, from: { x: 0, y: 0 }, aim: { x: h.player.x, y: h.player.y }, dir: 0, cone: 1, disp: 1, off: Array.from({ length: 6 }, (_, i) => [Math.sin(i * 7.3 + seed) * 0.5, Math.cos(i * 3.1 + seed) * 0.5]), stretch: 1.5, killR: 7, dmgW: 31 };
    h.inc.push(v); h.events.length = 0; E.tick(h, 0.05); const ev = h.events.find(e => e.kind === 'theirs'); if (!ev) continue; landed++;
    if (mode === 'active') cutOn += ev.cut || 0; else cutOff += ev.cut || 0;
  }
  chk(`point defence cuts incoming warheads when active and never when off (active ${cutOn}, off ${cutOff}, ${landed} volleys)`, cutOn > 0 && cutOff === 0);
  // probe salvo: no ping, a launch alert, a reaction from an aware real ship; a decoy gives nothing; cunning crews react less
  const tryProbe = (seed, diff, aware, aimAt) => {
    const h = E.newHunt(seed, { nreal: 1, difficulty: diff }); const a = reals(h)[0]; a.grid = 'light';
    if (aware) { a.aware = true; a.know = 0.5; a.nextFire = 1e9; } a.nextMan = 1e9;
    const tgt = aimAt === 'decoy' ? h.an.find(x => x.kind === 'lure' || x.kind === 'ghost') : a; const pc0 = h.pingCd, kn = a.know; tgt.nextMan = 1e9;
    let tf = 1; for (let i = 0; i < 5; i++) { const q = E.truePos(tgt, h.t + tf); tf = E.PLAYER.engage + Math.hypot(q.x - h.player.x, q.y - h.player.y) / E.PLAYER.missileSpeed; }   // aim where it will be
    const ok = E.probe(h, E.truePos(tgt, h.t + tf), 1); const e0 = h.evts.length, kn1 = a.know;
    for (let i = 0; i < 200 && h.probes.length; i++) { a.nextFire = 1e9; E.tick(h, 0.05); }
    const ev = h.evts.slice(e0); return { ok, h, a, kn, kn1, react: ev.find(e => e.type === 'probe_reaction'), quiet: ev.find(e => e.type === 'probe_quiet'), pinged: h.pingCd !== pc0 || h.pingUntil > 0 };
  };
  const one = tryProbe(21, 'easy', true, 'ship');
  chk('a probe launches, makes no ping, and raises a launch alert', one.ok && !one.pinged && one.kn1 > one.kn);
  let reE = 0, reH = 0, decoyQ = 0, decoyR = 0;
  for (let seed = 200; seed < 260; seed++) { if (tryProbe(seed, 'easy', true, 'ship').react) reE++; if (tryProbe(seed, 'hard', true, 'ship').react) reH++; const d = tryProbe(seed, 'normal', true, 'decoy'); if (d.quiet) decoyQ++; if (d.react && Math.hypot(E.truePos(d.a, d.h.t).x - d.react.data.aim.x, E.truePos(d.a, d.h.t).y - d.react.data.aim.y) > 40) decoyR++; }
  console.log(`     probe reactions: green-ish (easy) ${reE}/60, veteran-ish (hard) ${reH}/60, quiet on decoys ${decoyQ}/60`);
  chk('aware ships on easy react to probes most of the time', reE >= 30);
  chk('cunning (hard) crews often do not take the bait', reH < reE && reH < 40);
  chk('a probe at a decoy far from any warship draws no reaction', decoyR === 0 && decoyQ > 20);
  const r = tryProbe(21, 'easy', true, 'ship'); chk('a reaction lights the enemy point defence (enemy_pd event) and reports it', !r.react || (r.h.evts.some(e => e.type === 'enemy_pd') || r.react.data.how === 'burn') && r.h.log.some(l => /point defence at the probe|burned hard/.test(l.text))); }
console.log(bad ? 'FAILED' : 'ALL OK'); process.exit(bad ? 1 : 0);
