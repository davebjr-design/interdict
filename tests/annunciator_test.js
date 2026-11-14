// Annunciator derivation and acknowledgement (docs/station_screens.md s1). node tests/annunciator_test.js
const A = require('../web/annunciator.js'), E = require('../web/hunt_rt_engine.js'), St = require('../web/station_model.js');
let bad = 0; const chk = (m, c) => { console.log(c ? 'ok   ' : 'FAIL ', m); if (!c) bad++; };
const hunt = () => { const s = E.newHunt(3, { nreal: 2 }); E.tick(s, 0.05); return s; };

// 0 fixed panel: 8-char labels, every tile in a group, stubs dark
chk('labels are at most 8 characters', A.TILES.every(t => t.label.length <= 8));
chk('about two dozen tiles, every one in a station group', A.TILES.length >= 24 && A.TILES.every(t => A.GROUPS.some(g => g.st === t.st)));
{ const L = A.derive({ s: hunt(), model: St.create({ seed: 1 }), E });
  chk('a fresh hunt: no warnings or cautions', Object.values(L).every(l => l.state !== 'warning' && l.state !== 'caution'));
  chk('not-yet-simulated tiles are off (dark)', A.TILES.filter(t => t.stub).every(t => L[t.id].state === 'off'));
  chk('a healthy simulated tile is normal (dim green)', L.hull.state === 'normal' && L.sinkhi.state === 'normal'); }

// 1 vampire: INCOMING warning, master warning flashing; ack stops the flash but keeps the lamp; clears with the condition
{ const s = hunt(), P = A.create(); P.update({ s, E });
  E.evt(s, 'vampire', { n: 2, id: 1, bearing: 90, eta: 0.6, at: s.t + 0.6 }); s.inc.push({ foe: true, id: 1, t0: s.t, at: s.t + 0.6 });
  let o = P.update({ s, E });
  chk('vampire: INCOMING is a warning', o.lamps.incoming.state === 'warning');
  chk('vampire: master WARNING flashes', o.master.warning.lit && o.master.warning.flash && o.lamps.incoming.flash);
  chk('vampire: onset reported once (for the audio tone)', o.onset.some(x => x.id === 'incoming' && x.state === 'warning') && !P.update({ s, E }).onset.length);
  P.ack('incoming'); o = P.update({ s, E });
  chk('ack stops the flash but the lamp stays lit (steady)', o.lamps.incoming.state === 'warning' && !o.lamps.incoming.flash && o.lamps.incoming.acked && !o.master.warning.flash);
  s.inc.length = 0; s.evts.length = 0; s.t += 1;
  o = P.update({ s, E });
  chk('condition clears: the lamp clears', o.lamps.incoming.state === 'normal' && !o.master.warning.lit);
  E.evt(s, 'vampire', { n: 2, id: 1 }); o = P.update({ s, E });
  chk('a new vampire after it cleared flashes again', o.lamps.incoming.flash && o.master.warning.flash); }

// 2 magazine low: caution, master caution; empty is a warning
{ const s = hunt(), P = A.create(); s.mag.total = 10; let o = P.update({ s, E });
  chk('mag low: MAG LOW caution, master CAUTION flashing', o.lamps.maglow.state === 'caution' && o.master.caution.flash && !o.master.warning.lit);
  P.ackAll(); o = P.update({ s, E }); chk('ack all (key A): no flash, still lit', !o.master.caution.flash && o.lamps.maglow.state === 'caution');
  s.mag.total = 0; o = P.update({ s, E }); chk('magazine empty escalates to a warning and flashes again', o.lamps.maglow.state === 'warning' && o.lamps.maglow.flash); }

// 3 calls: a priority 3 call lights its own station's caution; a priority 4 call a warning
{ const M = St.create({ seed: 5 }); M.raise('E1', {}); M.tick(1);
  const L = A.derive({ s: hunt(), model: M, E });
  chk('priority 3 thermal call (E1 running hot) lights RUN HOT (ENG/THERM) caution', L.runhot.state === 'caution' && A.TILES.find(t => t.id === 'runhot').st === 'eng');
  const others = A.TILES.filter(t => t.st !== 'eng' && L[t.id].state === 'caution'); chk('and no other station lights', others.length === 0);
  const M2 = St.create({ seed: 5 }); M2.raise('H1', {}); M2.tick(1); const L2 = A.derive({ model: M2 });
  chk('priority 3 helm call (H1) lights BURN (HELM) caution', L2.burn.state === 'caution');
  const M3 = St.create({ seed: 5 }); M3.raise('D2', {}); M3.tick(1); const L3 = A.derive({ model: M3 });
  chk('priority 4 damage call (D2) lights FIRE warning', L3.fire.state === 'warning');
  const P = A.create(); const o = P.update({ model: M3 }); chk('... and the master warning', o.master.warning.flash);
  const c = M.calls[0]; M.answer(c.id, 0); M.tick(1); chk('answered call: the lamp clears', A.derive({ s: hunt(), model: M, E }).runhot.state !== 'caution'); }

// 4 engine-state lamps
{ const s = hunt(); s.heat = 'hot'; s.sink.h = 0.96; s.vent.on = true; s.vent.forced = true; s.hull = 35; s.pd = 'active'; s.stage = 1;
  const L = A.derive({ s, E });
  chk('RUN HOT from s.heat', L.runhot.state === 'caution'); chk('SINK HI warning at 95%+', L.sinkhi.state === 'warning');
  chk('forced vent is a caution', L.venting.state === 'caution'); chk('hull 35%: HULL warning and SENS FLD caution', L.hull.state === 'warning' && L.sensfld.state === 'caution');
  chk('PD active: PD ACTV caution, PD ARMED not lit', L.pdact.state === 'caution' && L.pdarm.state === 'normal'); chk('enemy fix one pip: DETECTED caution', L.detect.state === 'caution');
  const s2 = hunt(); chk('PD armed at the start: advisory', A.derive({ s: s2, E }).pdarm.state === 'advisory'); }

console.log(bad ? `\n${bad} FAILED` : '\nall annunciator tests passed'); process.exit(bad ? 1 : 0);
