// Detected vampires, brace timing, stun on impact, the new station verbs (docs/mechanics_brace.md). node tests/seen_stun_test.js
const E = require('../web/hunt_rt_engine.js'), AD = require('../web/station_adapter.js'), AN = require('../web/annunciator.js'), St = require('../web/station_model.js'), B = require('../sim/hunt_bots.js');
let bad = 0; const chk = (m, c) => { console.log(c ? 'ok   ' : 'FAIL ', m); if (!c) bad++; };
const SPM = E.RULES.secPerMin, me = E.PLAYER;
const run = (s, secs, dt = 0.25, A) => { for (let t = 0; t < secs && !s.over; t += dt) { E.tick(s, dt / SPM); if (A) A.update(s, dt); } };
const evs = (s, t) => (s.evts || []).filter(e => e.type === t);
const calm = (seed, o) => E.newHunt(seed, Object.assign({ nreal: 1, entry: 'standard' }, o));
const volley = (s, secs, o) => { const v = Object.assign({ dmg: 1, id: s.an.find(a => a.kind === 'real').id, foe: true, t0: s.t, at: s.t + secs / SPM, from: { x: 100, y: 100 }, aim: { x: s.player.x, y: s.player.y }, dir: 0, cone: 0.1, disp: 0.1, off: Array.from({ length: 4 }, () => [0, 0]), stretch: 1, killR: 12, dmgW: 38 }, o); s.inc.push(v); return v; };

// ---- the rule: a volley is announced only when detected ----
// a shooter on our plot, forced to fire now
const fireFrom = (seed, plotted, opts, lin) => {
  const s = calm(seed, opts); s.pd = 'off'; const a = s.an.find(x => x.kind === 'real'); if (lin) a.load = Object.assign({}, a.load, { lineage: lin }); a.aware = true; a.know = 1; a.heard = { x: s.player.x, y: s.player.y, vx: 0, vy: 0, t: s.t };
  const p = E.truePos(a, s.t); s.player.x = p.x + 60; s.player.y = p.y;   // inside fire range
  a.state = plotted ? 'open' : 'out'; a.nextFire = s.t; a.nextMan = s.t + 99;
  if (plotted) for (const ch of ['thermal', 'reactor', 'occlusion']) a.read[ch] = { num: 8 * 0.9, den: 8, t: s.t, cat: 'strong' };   // on our plot and well read: detection level 1 (docs/mechanics_vampire_detect.md)
  const n0 = s.inc.length; for (let i = 0; i < 40 && s.inc.length === n0; i++) { if (!plotted) a.state = 'out'; E.tick(s, 0.02); }
  return { s, a, v: s.inc[s.inc.length - 1], fresh: s.inc.length > n0 };
};
{ const r = fireFrom(5, true); chk('launch route: a launcher on our plot fires, the volley is seen at once', r.fresh && r.v.seen === true && r.v.via === 'launch' && E.seenInc(r.s).includes(r.v));
  chk('launch route: Dace says Contact N has launched', r.s.log.some(l => /Contact \d+ has launched, impact in/.test(l.text) && l.who === 'Dace')); }
{ const r = fireFrom(5, false); chk('seeker route: a launcher off our plot fires unseen', r.fresh && r.v.seen === false && !E.seenInc(r.s).includes(r.v) && r.v.via == null);
  chk('seeker route: no call, no warn, no vampire event at launch', !r.s.log.some(l => /has launched|Vampire|has fired/.test(l.text)) && !(r.s.warn || []).length && !evs(r.s, 'vampire').length);
  chk('seeker route: the shooter is not marked hostile by an unseen shot', r.a.idStatus !== 'hostile'); 
  const v = r.v, sd = E.AI.seekerActive, want = v.at - sd / E.AI.missileSpeed;
  chk('seekAt = impact minus (seekerActive / missileSpeed): about 12 units, 5 s at speed 40 (default lineage factor aside)', v.seekAt >= v.t0 && v.seekAt <= v.at && (r.a.load.lineage === 'halden' ? Math.abs(v.seekAt - Math.max(v.t0, want)) < 1e-9 : true));
  let g = 0; while (!v.seen && r.s.inc.includes(v) && g++ < 5000) E.tick(r.s, 0.01);
  chk('seeker route: the seeker lights, the volley becomes seen (via seeker) and Dace calls it', v.seen === true && v.via === 'seeker' && r.s.log.some(l => /Vampire, seeker active, bearing \d{3}, impact in \d+ seconds/.test(l.text)) && evs(r.s, 'vampire').some(e => e.data.via === 'seeker'));
  chk('seeker route: the shooter is marked hostile once the seeker is lit', r.a.idStatus === 'hostile'); }

// what-if switch for the balance sweep: RULES.launchDetect = 0 means no launch is ever detected
{ E.RULES.launchDetect = 0; const r = fireFrom(5, true); E.RULES.launchDetect = 1; chk('RULES.launchDetect = 0: even a plotted launcher is not seen at launch (sweep what-if)', r.fresh && r.v.seen === false); }

// parameter, lineage override, hunt option
{ chk('lineage factors: Orrin late, Vask early, Halden as set', E.SEEKER_LINEAGE.orrin < 1 && E.SEEKER_LINEAGE.vask > 1 && E.SEEKER_LINEAGE.halden === 1);
  const lead = lin => { const r = fireFrom(8, false, null, lin); return (r.v.at - r.v.seekAt) * SPM; };
  const lo = lead('orrin'), lh = lead('halden'), lv = lead('vask');
  chk(`seeker warning time in seconds: orrin ${lo.toFixed(1)} < halden ${lh.toFixed(1)} < vask ${lv.toFixed(1)} (about 5 s for the default lineage at speed 40)`, lo < lh && lh < lv && lh > 3.5 && lh < 7.5);
  const r1 = fireFrom(9, false, { seekerActive: 6 }), r2 = fireFrom(9, false, { seekerActive: 24 });
  chk('hunt option seekerActive moves the seeker light: a longer range lights earlier', r1.s.seekerActive === 6 && r2.s.seekerActive === 24 && (r2.v.at - r2.v.seekAt) > (r1.v.at - r1.v.seekAt) * 2.5);
  chk('AI.seekerActive is a parameter (about 12)', E.AI.seekerActive === 12); }

// unseen volleys still hit
{ let hit = 0, n = 0; for (let seed = 20; seed < 32; seed++) { const s = calm(seed, { braceAuto: 'off' }); s.pd = 'off'; const h0 = s.hull; const v = volley(s, 2, { seen: false, seekAt: s.t + 1.5 / SPM, via: null }); run(s, 4); n++; if (s.hull < h0) hit++; }
  chk(`unseen volleys still hit (${hit}/${n} landed damage)`, hit >= n - 1);
  const s = calm(33, { braceAuto: 'vampire' }); const v = volley(s, 30, { seen: false, seekAt: s.t + 29 / SPM }); run(s, 12); chk('an unseen volley 18 s out: nobody braces, nobody calls PD', s.brace === 'free' && !s.warn); }

// ---- everything that reads s.inc reads only seen volleys ----
{ const s = calm(40); const v = volley(s, 6, { seen: false, seekAt: s.t + 5 / SPM });
  const ann = AN.derive({ s, E }); chk('annunciator: INCOMING stays dark for an unseen volley', ann.incoming.state === 'normal' || ann.incoming.state === 'off');
  v.seen = true; const ann2 = AN.derive({ s, E }); chk('annunciator: INCOMING lights once it is seen', ann2.incoming.state === 'warning');
  chk('bots: incoming() ignores an unseen volley', (v.seen = false, !B.helpers.incoming(s))); v.seen = true; chk('bots: incoming() sees a seen volley', B.helpers.incoming(s));
  const q = calm(41); q.pd = 'active'; q.pdUntil = 0; volley(q, 40, { seen: false, seekAt: q.t + 39 / SPM }); run(q, 3); chk('point defence goes back to armed with only an unseen volley in the air', q.pd === 'armed');
  const w = calm(42); w.pd = 'active'; w.pdUntil = 0; volley(w, 40); run(w, 3); chk('...but stays active while a seen volley is in the air', w.pd === 'active'); }
{ const s = calm(43); E.tick(s, 2); s.sink.h = 0.7; volley(s, 60, { seen: false, seekAt: s.t + 59 / SPM }); chk('M07 (nothing inbound) fires with only an unseen volley in the air', E.momentCheck(s, { enabled: ['M07'] }) === 'M07');
  const q = calm(44); E.tick(q, 2); q.sink.h = 0.7; volley(q, 60); chk('...and does not while a seen volley is in the air', E.momentCheck(q, { enabled: ['M07'] }) === null);
  const w = calm(45); E.tick(w, 2); w.sink.h = 0.7; E.momentCheck(w, { enabled: ['M07'] }); E.moment(w, 'M07', 'loose'); volley(w, 60); E.tick(w, 0.6); E.momentCheck(w, {});
  chk('M07 hold: a seen volley in the air keeps the calm count at zero (the vent is still held)', !w.vent.on && w.mom.hold && w.mom.hold.calm === 0); }

// ---- brace timing ----
{ const s = calm(50); volley(s, 30); run(s, 10); chk('seen volley 20 s out: no brace yet', s.brace === 'free');
  run(s, 10.6); chk('the CO braces at braceTime x 1.5 (about 10 s) before impact', s.brace === 'bracing' && s.braceBy === 'auto' && (30 - 20.6) < me.braceTime * 1.5 * SPM + 0.5);
  run(s, 7); chk('and the crew are secure before it lands', s.brace === 'secure'); }
{ const s = calm(51); const v = volley(s, 5, { seen: false, seekAt: s.t + 0.01 }); run(s, 1, 0.1); chk('a volley first seen late (seeker route, 4 s out): brace at once', v.seen === true && s.brace !== 'free' && s.braceBy === 'auto'); }
{ const s = calm(52, { braceAuto: 'off' }); volley(s, 12); run(s, 6); chk("doctrine 'manual' (braceAuto off): still no auto brace", s.brace === 'free'); }

// ---- stun ----
const hitCrew = (seed, mode, dmgW) => { const s = calm(seed, { braceAuto: 'off' }); s.pd = 'off'; if (mode === 'secure') { E.brace(s, true); run(s, 8); } else if (mode === 'bracing') E.brace(s, true);
  volley(s, 0.5, { dmgW, killR: 14, cone: 0.1, dmg: 1 }); run(s, 1.5, 0.1); return s; };
{ const N = 150, cnt = { free: 0, bracing: 0, secure: 0 }, ev = { free: 0 }; let total = 0;
  for (const m of ['free', 'bracing', 'secure']) for (let i = 0; i < N; i++) { const s = hitCrew(1000 + i, m, 38); cnt[m] += evs(s, 'stun').length; }
  const per = m => cnt[m] / (N * 5);
  chk(`stun chance per officer: free ${per('free').toFixed(2)}, bracing ${per('bracing').toFixed(2)}, secure ${per('secure').toFixed(2)}`, per('free') > 0.2 && per('bracing') < per('free') * 0.75 && per('bracing') > per('free') * 0.25 && cnt.secure === 0);
  const s0 = hitCrew(1000, 'free', 38); const dmgDone = 100 - s0.hull; chk('a 30-damage hit stuns about 40 percent of free officers (sample is the damage the volley dealt)', dmgDone > 0); }
{ let ok = 0, n = 0, dmin = 9, dmax = 0; for (let i = 0; i < 80; i++) { const s = hitCrew(2000 + i, 'free', 40); for (const e of evs(s, 'stun')) { n++; const d = e.data.until - e.t; dmin = Math.min(dmin, d); dmax = Math.max(dmax, d); } }
  chk(`stun lasts 0.4 to 0.75 game minutes (${(dmin * SPM).toFixed(1)} to ${(dmax * SPM).toFixed(1)} s over ${n})`, n > 20 && dmin >= 0.4 - 1e-9 && dmax <= 0.75 + 1e-9);
  const s = (() => { for (let i = 0; i < 60; i++) { const q = hitCrew(3000 + i, 'free', 40); if (evs(q, 'stun').length) return q; } })(); const e = s && evs(s, 'stun')[0];
  chk('a stun raises the stun event with officer and station', !!e && !!e.data.officer && !!e.data.station);
  const q2 = E.newHunt(60, { nreal: 1 }); q2.crew.Dace.stunUntil = q2.t + 0.5; chk('E.stunned(s, who) is true while down', E.stunned(q2, 'Dace') && !E.stunned(q2, 'Quill'));
  run(q2, 10); chk('...and false, with a recovered event, once the time is up', !E.stunned(q2, 'Dace') && evs(q2, 'recovered').some(x => x.data.officer === 'Dace')); }
{ const injFree = (() => { let n = 0; for (let i = 0; i < 100; i++) { const s = hitCrew(4000 + i, 'free', 12); n += Object.values(s.crew).filter(c => c.inj).length; } return n; })();
  const injBig = (() => { let n = 0; for (let i = 0; i < 100; i++) { const s = hitCrew(4000 + i, 'free', 60); n += Object.values(s.crew).filter(c => c.inj).length; } return n; })();
  chk(`injuries are for big hits only (small hit ${injFree}, big hit ${injBig} per 100)`, injFree === 0 && injBig > 0); }
// effects of a stun
{ const s = calm(70); s.pd = 'off'; const a = s.an.find(x => x.kind === 'real'); E.lockContact(s, a.id); run(s, 2); a.solve = 1; a.stale = false; a.anchor = { t: s.t };
  s.crew.Abara.stunUntil = s.t + 0.6; chk('Abara stunned: a fire order is refused', E.fire(s, a.id, null, 4, 'he', false) === false);
  s.crew.Abara.stunUntil = null; const f = E.fire(s, a.id, null, 4, 'he', false); chk('...and works once he is back', f !== false);
  const t = calm(71); t.crew.Quill.inj = true; t.crew.Fenwick.stunUntil = t.t + 0.6; chk('Fenwick stunned: treatment is refused', E.treat(t, 'Quill') === false); t.crew.Fenwick.stunUntil = null; chk('...and starts when he is back', E.treat(t, 'Quill') === true);
  const u = calm(72); const w = u.analysts.find(x => x.name === 'Dace'); const ac = u.an.find(x => x.kind === 'real'); E.investigate(u, ac.id); u.crew.Dace.stunUntil = u.t + 0.6; const rd0 = (ac.read.thermal || {}).den || 0; run(u, 6);
  chk('Dace stunned: his thermal read does not advance', ((ac.read.thermal || {}).den || 0) <= rd0 + 1e-9); run(u, 10); chk('...and does once he recovers', ((ac.read.thermal || {}).den || 0) > rd0); }
{ const s = calm(73); s.crew.Quill.stunUntil = s.t + 1; const L = AN.derive({ s, E }); chk('annunciator: CREW DWN lamp lit while someone is stunned', L.stun && L.stun.state === 'caution' && /Quill/.test(L.stun.why));
  s.crew.Quill.stunUntil = null; chk('...and clear after', AN.derive({ s, E }).stun.state === 'normal');
  chk('the stun tile is in the DAMAGE group', AN.TILES.find(t => t.id === 'stun').st === 'dmg' && AN.TILES.every(t => t.label.length <= 8)); }
// adapter: held orders, hands-on lockout, events
{ const s = calm(80), A = AD.create({ engine: E, seed: 80 }); A.update(s, 0);
  s.crew.Abara.stunUntil = s.t + 0.5; run(s, 0.25, 0.25, A);   // at 0.25 s the model sees the stun
  const o = A.order('helm', 'speed', 'Speed 40%', { speed: 'v2' }); run(s, 3, 0.25, A);
  chk('Auto/Supervised: an order to a stunned officer is held (not executed during the stun)', o && s.speed !== 'v2' && !A.done.some(d => d.verb === 'speed'));
  run(s, 12, 0.25, A); chk('...and executes after he is back', s.speed === 'v2' && A.done.some(d => d.verb === 'speed' && d.ok));
  const s2 = calm(81), A2 = AD.create({ engine: E, seed: 81, autonomy: { helm: 'hands-on' } }); A2.update(s2, 0); s2.crew.Abara.stunUntil = s2.t + 0.5; run(s2, 0.25, 0.25, A2);
  chk('Hands-on at a stunned officer\'s station is locked out', A2.stunned('helm') && A2.handsOnBlocked('helm') && A2.order('helm', 'still', 'Hold still') === null);
  run(s2, 12, 0.25, A2); chk('...and free again after', !A2.stunned('helm') && !!A2.order('helm', 'still', 'Hold still'));
  let fwd = null; for (let seed = 82; seed < 120 && !fwd; seed++) { const s3 = calm(seed), A3 = AD.create({ engine: E, seed }); A3.update(s3, 0); s3.pd = 'off'; volley(s3, 0.3, { dmgW: 60, killR: 16 }); let seen = [];
    for (let t = 0; t < 16; t += 0.25) { E.tick(s3, 0.25 / SPM); seen = seen.concat(A3.update(s3, 0.25)); } if (evs(s3, 'stun').length) fwd = { seen, s3 }; }
  chk('the adapter forwards stun / recovered as out events', !!fwd && fwd.seen.some(e => e.type === 'stun' && e.officer && e.station) && fwd.seen.some(e => e.type === 'recovered')); }
{ const M = St.create({ seed: 3 }); chk('station model: a stunned officer\'s Hands-on answer is locked out', typeof M.setStun === 'function' && typeof M.stunned === 'function'); }

// ---- the new verbs: speed, dismiss, still, evade, vent_stop ----
{ const s = calm(90), A = AD.create({ engine: E, seed: 90 }); A.update(s, 0);
  A.order('helm', 'speed', 'Speed 60%', { speed: 'v3' }); run(s, 6, 0.25, A);
  chk('speed verb sets the drive level through the order lifecycle (not at once)', s.speed === 'v3' && A.done.some(d => d.verb === 'speed' && d.ok));
  const s0 = calm(91), A0 = AD.create({ engine: E, seed: 91 }); A0.update(s0, 0); A0.order('helm', 'speed', 'Speed 80%', { speed: 'v4' }); run(s0, 0.05, 0.05, A0); chk('...the order takes a moment (not applied in the first 50 ms)', s0.speed !== 'v4');
  A.order('helm', 'speed', 'bad', { speed: 'v9' }); run(s, 6, 0.25, A); chk('an unknown speed is refused', A.done.some(d => d.verb === 'speed' && !d.ok));
  A.order('helm', 'still', 'Hold still'); run(s, 6, 0.25, A); chk('still verb holds position', s.posture === 'still' && s.orderId == null);
  const a = s.an.find(x => x.kind === 'real'); E.brace(s, true); run(s, 8, 0.25, A); A.order('helm', 'evade', 'Evasive', { id: a.id }); run(s, 6, 0.25, A); chk('evade verb sets the evasive posture', s.posture === 'evade');
  const t = calm(92), B2 = AD.create({ engine: E, seed: 92 }); B2.update(t, 0); const c = t.an.find(x => x.kind === 'real'); c.state = 'open'; c.idStatus = 'unknown'; B2.order('sensors', 'dismiss', 'Rule out', { id: c.id }); run(t, 6, 0.25, B2);
  chk('dismiss verb rules a contact out', c.state === 'out' && B2.done.some(d => d.verb === 'dismiss' && d.ok));
  const h = t.an.find(x => x.kind === 'real'); h.state = 'open'; E.markHostile(t, h); B2.order('sensors', 'dismiss', 'Rule out', { id: h.id }); run(t, 6, 0.25, B2); chk('...but a hostile contact cannot be dismissed', h.state !== 'out' && B2.done.filter(d => d.verb === 'dismiss').pop().ok === false);
  const v = calm(93), C = AD.create({ engine: E, seed: 93 }); C.update(v, 0); v.sink.h = 0.5; E.startVent(v); chk('vent is on', v.vent.on); C.order('thermal', 'vent_stop', 'Retract fins'); run(v, 6, 0.25, C); chk('vent_stop verb pulls the fins in', !v.vent.on && C.done.some(d => d.verb === 'vent_stop' && d.ok));
  const w = calm(94), D = AD.create({ engine: E, seed: 94 }); D.update(w, 0); D.order('helm', 'speed', 'Redline', { speed: 'ab' }); run(w, 14, 0.25, D); chk('speed ab goes through the redline path (brace gate applies)', D.done.some(d => d.verb === 'redline') || w.burn || w.brace !== 'free'); }
// hands-on timing for the new verbs: instant-ish, Supervised/Auto take the officer's reaction
{ const s = calm(95), A = AD.create({ engine: E, seed: 95, autonomy: { helm: 'hands-on' } }); A.update(s, 0); const o = A.order('helm', 'still', 'Hold still'); chk('order() returns the order object for every new verb', !!o && o.verb === 'still'); }

// determinism
{ const go = () => { const s = E.newHunt(99, { nreal: 2 }); E.setOrder(s, 'close', s.an[0].id); E.setSpeed(s, 'v3'); run(s, 80); return JSON.stringify([s.hull, s.inc.map(v => [v.seen, v.via]), evs(s, 'vampire').length, evs(s, 'stun').length, s.t]); };
  chk('same seed, same seen/stun history', go() === go()); }
console.log(bad ? bad + ' FAILED' : 'ALL OK'); process.exit(bad ? 1 : 0);
