/* Annunciator (docs/station_screens.md s1): the standard alert and caution light panel. No DOM, no engine import.
 *
 *   Annunciator.derive({ s, model, E })   -> { id: { state, why } }   pure: lamp states from engine state and station-model calls
 *   const P = Annunciator.create();  P.update({ s, model, E }) -> { lamps: { id: { state, flash, acked, why } }, master: { warning, caution }, onset: [...] }
 *   P.ack(id) / P.ackAll()                 acknowledging stops the flash, not the condition; the lamp clears when the condition does
 * States: warning (red) > caution (amber) > advisory (white-cyan) > normal (dim green) > off (dark, not simulated / not applicable).
 * Ship-systems colours, never contact colours (contact symbols keep reds/yellows = affirmed, blues/greens = suspected).
 * E (HuntRT) is optional: with it the fire-control lamps use E.solveInfo / E.trackState; without it they read the raw fields.
 */
(function (root) {
  'use strict';
  const GROUPS = [
    { st: 'sen', key: 'F2', name: 'SENSORS' }, { st: 'fc', key: 'F3', name: 'FIRE CTL' }, { st: 'wpn', key: 'F4', name: 'WEAPONS' },
    { st: 'helm', key: 'F5', name: 'HELM' }, { st: 'eng', key: 'F6', name: 'ENG/THERM' }, { st: 'dmg', key: 'F7', name: 'DAMAGE' }, { st: 'com', key: 'F8', name: 'COMMS/PRB' }];
  // fixed positions: the order here is the order on every screen. stub: not simulated yet, so the lamp stays dark (off)
  const TILES = [
    ['newtrk', 'NEW TRK', 'sen', 'A new thermal return was called in the last few seconds.'],
    ['pinghrd', 'PING HRD', 'sen', 'An enemy active ping reached us: she is hunting.'],
    ['trklost', 'TRK LOST', 'sen', 'A locked track was lost (marked as a thermal ghost) or a bearing slipped.'],
    ['sensfld', 'SENS FLD', 'sen', 'Sensors fouled: hull damage below 60% slows every read (advisory: sensors dark while quiet).'],
    ['detect', 'DETECTED', 'sen', 'An enemy has a fix on us: one pip caution, three pips (a firm solution) warning.'],
    ['solrdy', 'SOL RDY', 'fc', 'A firing solution is ready on a locked track.'],
    ['solstl', 'STALE', 'fc', 'A firing solution has gone stale: refresh it.'],
    ['brgonly', 'BRG ONLY', 'fc', 'A locked track is down to a bearing and a guess (track state LAST).'],
    ['incoming', 'INCOMING', 'wpn', 'Enemy missiles in flight toward us. Vampire.'],
    ['maglow', 'MAG LOW', 'wpn', 'Twelve missiles or fewer left (warning: empty).'],
    ['pdarm', 'PD ARMED', 'wpn', 'Point defence armed and cold.'],
    ['pdact', 'PD ACTV', 'wpn', 'Point defence active: radars lit, anything looking can see us.'],
    ['salvo', 'MSL AWAY', 'wpn', 'Our salvo or probe missiles are in flight.'],
    ['burn', 'BURN', 'helm', 'The drive is at full burn (100%) or a burn call is open.'],
    ['linkbrk', 'LINK BRK', 'helm', 'Laser or wire link broken by a manoeuvre. Not yet simulated.', true],
    ['crschg', 'CRS CHG', 'helm', 'Course or stance changed in the last few seconds.'],
    ['runhot', 'RUN HOT', 'eng', 'Our signature is HOT: anything listening can hear us.'],
    ['sinkhi', 'SINK HI', 'eng', 'Heat sink at 80% or more (warning at 95%).'],
    ['venting', 'VENTING', 'eng', 'Cooling fins are out: we are fully visible (caution when the vent was forced).'],
    ['redline', 'REDLINE', 'eng', 'Redline burn running: the sink fills in seconds.'],
    ['hull', 'HULL', 'dmg', 'Hull integrity below 70% (warning below 40%).'],
    ['fire', 'FIRE', 'dmg', 'Coolant failing or a fire aboard: the sink is pegged and systems are cooking.'],
    ['breach', 'BREACH', 'dmg', 'Hull breach: integrity below 25% or a breach call.'],
    ['linkofr', 'LINK OFR', 'com', 'An ally offers a data link (an emission), or Pell offers to take a station.'],
    ['prblink', 'PRB LINK', 'com', 'Probe link state. Probe sets are not yet simulated.', true],
    ['prbout', 'PRB OUT', 'com', 'Probe sets deployed. Not yet simulated.', true],
    ['prblost', 'PRB LOST', 'com', 'Probe set lost or link dropped. Not yet simulated.', true]
  ].map(([id, label, st, tip, stub]) => ({ id, label, st, tip, stub: !!stub, key: GROUPS.find(g => g.st === st).key }));
  const RANK = { off: 0, normal: 1, advisory: 2, caution: 3, warning: 4 };
  // catalog row -> tile (every row lands in its own station's group)
  const ROW_TILE = { S1: 'newtrk', S8: 'newtrk', S6: 'pinghrd', S4: 'trklost', S5: 'trklost', X1: 'detect', X2: 'detect', X3: 'detect', X4: 'detect', X5: 'newtrk',
    W1: 'brgonly', W3: 'solstl', W2: 'solrdy', W5: 'incoming', W8: 'maglow', W9: 'salvo', W4: 'salvo', W6: 'salvo', W7: 'hull',
    H1: 'burn', H2: 'linkbrk', H3: 'crschg', E1: 'runhot', E2: 'venting', E3: 'venting', E4: 'redline', D1: 'hull', D2: 'fire', D3: 'breach', C1: 'linkofr', C3: 'linkofr' };
  const STATION_TILE = { sensors: 'newtrk', fire: 'solrdy', weapons: 'incoming', helm: 'crschg', engineering: 'redline', thermal: 'runhot', damage: 'hull', comms: 'linkofr' };
  const STATION_GROUP = { sensors: 'sen', fire: 'fc', weapons: 'wpn', helm: 'helm', engineering: 'eng', thermal: 'eng', damage: 'dmg', comms: 'com' };
  const MAG_LOW = 12;

  function derive(inp) {
    const s = inp && inp.s, model = inp && inp.model, E = inp && inp.E, L = {};
    for (const t of TILES) L[t.id] = { state: t.stub ? 'off' : 'normal', why: '' };
    const lift = (id, st, why) => { const l = L[id]; if (l && RANK[st] > RANK[l.state]) { l.state = st; l.why = why || ''; } };
    if (s) {
      const t = s.t || 0, evts = s.evts || [], recent = (type, win) => evts.some(e => e.type === type && t - e.t <= win);
      // sensors
      if (recent('ping_alert', 1)) lift('pinghrd', 'caution', 'enemy ping');
      if (recent('track_lost', 1.5)) lift('trklost', 'caution', 'track lost');
      if (s.hull < 60) lift('sensfld', 'caution', 'sensor mounts fouled'); else if (t < (s.quietUntil || 0)) lift('sensfld', 'advisory', 'sensors dark (quiet)');
      if (s.stage >= 3) lift('detect', 'warning', 'firm enemy solution'); else if (s.stage >= 1) lift('detect', 'caution', 'enemy fix ' + s.stage);
      // fire control
      for (const a of s.an || []) {
        if (a.state !== 'locked') continue;
        const si = E ? E.solveInfo(s, a) : { ready: (a.solve || 0) >= 1 && !a.stale, stale: !!a.stale };
        const ts = E ? E.trackState(s, a) : { state: a.stale ? 'last' : 'track' };
        if (si.ready && !si.stale) lift('solrdy', 'advisory', 'S' + (a.id + 1));
        if (si.stale || a.stale) lift('solstl', 'caution', 'S' + (a.id + 1));
        if (ts.state === 'last') lift('brgonly', 'caution', 'S' + (a.id + 1));
      }
      // weapons
      const inc = (s.inc || []).filter(v => v.foe !== false).length, warned = (s.warn || []).some(w => t >= w.t && t < w.t + (w.lead || 0));
      if (inc || warned || recent('vampire', 0.5)) lift('incoming', 'warning', inc ? inc + ' inbound' : 'vampire');
      if (s.mag) { if (s.mag.total <= 0) lift('maglow', 'warning', 'magazine empty'); else if (s.mag.total <= MAG_LOW) lift('maglow', 'caution', s.mag.total + ' left'); }
      if (s.pd === 'armed') lift('pdarm', 'advisory', 'armed, cold'); else if (s.pd === 'active') lift('pdact', 'caution', 'radars lit');
      if ((s.volleys || []).length || (s.probes || []).length) lift('salvo', 'advisory', ((s.volleys || []).length + (s.probes || []).length) + ' in flight');
      // helm
      if (s.speed === 'v5' && ['route', 'close', 'separate', 'evade', 'orbit'].includes(s.posture)) lift('burn', 'advisory', 'full burn');
      // engineering and thermal
      if (s.heat === 'hot') lift('runhot', 'caution', 'signature hot');
      const h = s.sink ? s.sink.h : 0; if (h >= 0.95) lift('sinkhi', 'warning', Math.round(h * 100) + '%'); else if (h >= 0.8) lift('sinkhi', 'caution', Math.round(h * 100) + '%');
      if (s.vent && s.vent.on) lift('venting', s.vent.forced ? 'caution' : 'advisory', s.vent.forced ? 'forced vent' : 'fins out');
      if (s.burn) lift('redline', 'caution', 'redline burn');
      // damage
      if (s.hull < 40) lift('hull', 'warning', Math.round(s.hull) + '%'); else if (s.hull < 70) lift('hull', 'caution', Math.round(s.hull) + '%');
      if ((s.melt || 0) > 0.05) lift('fire', 'warning', 'coolant failing');
      if (s.hull < 25) lift('breach', 'warning', 'hull ' + Math.round(s.hull) + '%');
    }
    if (model) {   // calls: a priority 3 call lights its station's caution, a priority 4 call a warning; a waiting priority 2 call an advisory
      const now = model.now || 0;
      for (const c of model.calls || []) {
        const id = ROW_TILE[c.row] || STATION_TILE[c.station]; if (!id) continue;
        const open = c.state === 'raised' || c.state === 'queued', fresh = now - (c.raisedAt != null ? c.raisedAt : c.at) <= 8;
        if (open && c.pri >= 4) lift(id, 'warning', 'call: ' + c.line);
        else if (open && c.pri === 3) lift(id, 'caution', 'call: ' + c.line);
        else if ((open && c.pri === 2 && c.state === 'raised') || (fresh && (c.state === 'reported' || c.state === 'logged' || c.state === 'settled') && c.row !== 'CO' && !c.report)) lift(id, 'advisory', c.line);
      }
    }
    return L;
  }

  function create() {
    const mem = {};   // id -> { state, acked }
    let last = null;
    function update(inp) {
      const L = derive(inp), out = { lamps: {}, master: { warning: { lit: false, flash: false }, caution: { lit: false, flash: false } }, onset: [] };
      for (const t of TILES) {
        const st = L[t.id].state, m = mem[t.id] || (mem[t.id] = { state: 'normal', acked: true });
        const alarm = st === 'warning' || st === 'caution';
        if (alarm && RANK[st] > RANK[m.state]) { m.acked = false; out.onset.push({ id: t.id, state: st }); }   // a new or worse alarm flashes until acknowledged
        if (!alarm) m.acked = true;
        m.state = st;
        const flash = alarm && !m.acked;
        out.lamps[t.id] = { state: st, flash, acked: alarm && m.acked, why: L[t.id].why };
        if (st === 'warning') { out.master.warning.lit = true; if (flash) out.master.warning.flash = true; }
        if (st === 'caution') { out.master.caution.lit = true; if (flash) out.master.caution.flash = true; }
      }
      last = out; return out;
    }
    function ack(id) { const m = mem[id]; if (!m) return false; const was = !m.acked; m.acked = true; if (last && last.lamps[id]) last.lamps[id].flash = false; return was; }
    function ackAll() { let n = 0; for (const id in mem) if (!mem[id].acked) { mem[id].acked = true; n++; } return n; }
    function ackLevel(level) { let n = 0; for (const id in mem) if (!mem[id].acked && mem[id].state === level) { mem[id].acked = true; n++; } return n; }
    return { update, ack, ackAll, ackLevel, get last() { return last; } };
  }
  const API = { TILES, GROUPS, RANK, ROW_TILE, STATION_TILE, STATION_GROUP, derive, create };
  root.Annunciator = API; if (typeof module !== 'undefined') module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
