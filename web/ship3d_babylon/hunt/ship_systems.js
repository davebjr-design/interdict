'use strict';
/* Ship systems the hunt engine does not model by itself, derived each tick from engine state so every system on the ship has a
   number somewhere in the CIC. DISPLAY-ONLY (no feedback into the hunt). Formulas are marked [proposal] where they are mine, not the spec's.
   window.SHIPSYS.create() -> Y;  SHIPSYS.update(Y, S, dtMin) ;  SHIPSYS.lamps(Y, S) -> [{id,label,state,why}]  (state: off|normal|advisory|caution|warning)
   Spec numbers used: 8 fuel cassettes, one per 21 min of 100% drive (resources-model); 250 t drive water + 20 t crew reserve; lithium loop 454 K liquid, 500 K swing. */
(function (root) {
  const SOULS = 31;   // 24 crew racks + 6 officer racks + the captain's stateroom (hull spec)
  const PODS = 4;     // engine pods (exterior model)
  const FISSION_MW = 20, HOTEL_MW = 6;   // [proposal] standing plant and hotel load
  function create() { return { cass: 8, cassUsed: 0, spoolPaid: false, o2: 20.9, co2: 400, press: 101.3, leakKpaMin: 0, bus: { load: 0, cap: FISSION_MW, parts: [] }, pods: [0, 0, 0, 0], liK: 454, t: null }; }
  function update(Y, S, dtMin) {
    if (!S) return Y; const thr = Math.max(0, S.thrust || 0), dt = Math.max(0, dtMin || 0);
    Y.pods = Y.pods.map((v, i) => v + ((thr * 100) - v) * Math.min(1, dt * 6));   // pods spool toward commanded output
    Y.cassUsed += thr * dt / 21; Y.cass = Math.max(0, 8 - Y.cassUsed - (Y.spoolPaid ? 1 : 0));
    if (S.spool && !Y.spoolPaid) { Y.spoolPaid = true; Y.cass = Math.max(0, Y.cass - 1); }   // one cassette per breach-drive spool (resources-model)
    const pinging = S.pingUntil > S.t, pdMW = S.pd === 'active' ? 8 : S.pd === 'armed' ? 1 : 0, pumps = S.vent && S.vent.on ? 5 : 1.5;
    const parts = [['HOTEL', HOTEL_MW], ['SENSORS', 3], ['ACTIVE PING', pinging ? 4 : 0], ['POINT DEFENCE', pdMW], ['SINK PUMPS', pumps], ['DRIVE AUX', thr * 12], ['COIL BANK', 2]];
    Y.bus.parts = parts; Y.bus.load = parts.reduce((a, p) => a + p[1], 0); Y.bus.cap = FISSION_MW + Y.pods.reduce((a, v) => a + v / 100 * 10, 0);   // [proposal] each pod adds up to 10 MW to the bus
    Y.liK = 454 + Math.min(1.2, S.sink ? S.sink.h : 0) * 500;   // lithium loop temperature
    const hullLoss = S.hull < 40 ? (40 - S.hull) / 40 : 0; Y.leakKpaMin = hullLoss * 1.2;   // [proposal] a holed hull leaks air
    Y.press = Math.max(0, Y.press - Y.leakKpaMin * dt + Math.min(.5, (101.3 - Y.press)) * dt * .3 * (hullLoss ? 0 : 1)); Y.o2 = 20.9 * Y.press / 101.3;
    Y.co2 = Math.max(400, Y.co2 + (S.brace === 'secure' ? 40 : 15) * dt * (Y.press < 80 ? 4 : 1) - (Y.co2 - 400) * .25 * dt);   // scrubbers hold it near 400 ppm
    return Y;
  }
  function lamps(Y, S) {
    const waterPct = S.water != null && S.shipP ? S.water / (S.shipP.tank / 1000) : 1, out = [];
    const L = (id, label, state, why) => out.push({ id, label, state, why });
    L('cass', 'CASSETTE', Y.cass <= 0 ? 'warning' : Y.cass <= 2 ? 'caution' : Y.cass <= 4 ? 'advisory' : 'normal', Y.cass.toFixed(1) + ' of 8 fusion cassettes left');
    L('water', 'WATER', S.water <= 0 ? 'warning' : waterPct < .2 ? 'caution' : waterPct < .4 ? 'advisory' : 'normal', (S.water || 0).toFixed(0) + ' t drive water (reserve 20 t locked)');
    L('bus', 'BUS OVLD', Y.bus.load > Y.bus.cap ? 'caution' : Y.bus.load > Y.bus.cap * .85 ? 'advisory' : 'normal', Y.bus.load.toFixed(0) + ' MW load on ' + Y.bus.cap.toFixed(0) + ' MW');
    L('lihot', 'LI LOOP', Y.liK > 930 ? 'warning' : Y.liK > 850 ? 'caution' : 'normal', Y.liK.toFixed(0) + ' K lithium loop (liquid 454-1615 K)');
    L('air', 'CABIN AIR', Y.press < 70 ? 'warning' : Y.press < 95 ? 'caution' : 'normal', Y.press.toFixed(0) + ' kPa, O2 ' + Y.o2.toFixed(1) + '%');
    L('co2', 'CO2', Y.co2 > 5000 ? 'warning' : Y.co2 > 1500 ? 'caution' : 'normal', Y.co2.toFixed(0) + ' ppm');
    L('spool', 'BREACH DRV', S.spool ? 'warning' : 'off', S.spool ? 'Breach drive spooling' : 'idle');
    L('fission', 'FISSION', S.hull < 15 ? 'caution' : 'normal', 'standing plant ' + FISSION_MW + ' MW');
    return out;
  }
  root.SHIPSYS = { create, update, lamps, SOULS, PODS, FISSION_MW };
})(typeof window !== 'undefined' ? window : globalThis);
