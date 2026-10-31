/* Mini-mission trims (docs/mini_missions.md, data/mini_missions.json) mapped onto the hunt engine.
 * P: multipliers on HuntRT.P; set: absolute values on P; me: multipliers on our ship's loadout (s.me).
 * Underway-only trims (navigation, quartermaster) have no hunt effect and are listed with hunt: false.
 * Active trims come from ?trims=a,b in the URL or localStorage 'interdict.trims' (JSON array). */
var HuntTrims = (function () {
  const T = {
    'eng.run_hot':          { label: 'Run her hot', P: { shipSpeed: 1.10, sinkK: 1.15 } },
    'eng.quiet_bearings':   { label: 'Quiet the bearings', me: { sig: 0.80 }, P: { shipSpeed: 0.95 }, set: { noRedline: 1 } },
    'eng.spool_tune':       { label: 'Tune the breach spool', P: { spoolDog: 0.75, spool: 0.75, spoolVis: 1.10, spoolHeat: 1.30 } },
    'heat.bigger_sink':     { label: 'Plumb the reserve tanks', me: { sink: 1.20 }, P: { ventFull: 1.20 } },
    'heat.fast_fins':       { label: 'Fast fins', P: { ventFull: 0.75 }, set: { ventAfterglow: 0.5 } },
    'heat.cold_analysts':   { label: 'Cold analysts', P: { glowFocus: 0.70, glowTrack: 0.70, readDone: 1.15 } },
    'sens.long_ears':       { label: 'Long ears', P: { sensRef: 1.15, readDone: 1.12 } },
    'sens.snap_classifier': { label: 'Snap classifier', P: { readDone: 0.80, classNoise: 1.5 } },
    'sens.narrow_ping':     { label: 'Narrow ping', P: { pingGlow: 0.5, pingAlert: 0.6 }, set: { pingRounds: 2 } },
    'tac.tight_drill':      { label: 'Drill the solution', P: { solveMin: 0.80, solveMax: 0.80, leadSpread: 1.15 } },
    'tac.judgment_lead':    { label: 'Lead from judgment', P: { leadSpread: 0.70, solveStale: 0.75 } },
    'tac.salvo_mix':        { label: 'Mix the salvo', salvo: { emp: 1, flare: 1, he: -2 } },
    'nav.quiet_approach':   { label: 'Quiet approaches', hunt: false },
    'nav.short_legs':       { label: 'Short legs', hunt: false },
    'qm.ration':            { label: 'Ration the galley', hunt: false },
    'qm.feast':             { label: 'Feast night', hunt: false },
    'qm.grey_trade':        { label: 'Trade at the buoy', hunt: false },
    'pell.assist_classifier': { label: 'Pell trims the classifier', P: { readDone: 0.80 } },
    'pell.assist_lead':     { label: 'Pell takes the lead tables', P: { leadSpread: 0.65 } },
    'pell.assist_heat':     { label: 'Pell runs the sink', P: { sinkK: 0.90 } }
  };
  let base = null;
  function active() {
    try { const q = new URLSearchParams(location.search).get('trims'); if (q) return q.split(',').filter(x => T[x]); } catch (e) {}
    try { const v = JSON.parse(localStorage.getItem('interdict.trims') || '[]'); return (Array.isArray(v) ? v : []).filter(x => T[x]); } catch (e) { return []; }
  }
  function applyP(P, ids) {   // reset to the untrimmed values, then apply each trim's multipliers and settings
    if (!base) base = Object.assign({}, P); Object.assign(P, base);
    for (const id of ids) { const t = T[id]; if (!t) continue; for (const k in t.P || {}) P[k] = P[k] * t.P[k]; for (const k in t.set || {}) P[k] = t.set[k]; }
  }
  function applyShip(s, ids) {   // our loadout is shared with LOADOUTS[0]; copy before changing it
    s.me = Object.assign({}, s.me); for (const id of ids) { const t = T[id]; if (!t) continue; for (const k in t.me || {}) s.me[k] = s.me[k] * t.me[k]; }
    s.trims = ids.slice(); return s;
  }
  return { T, active, applyP, applyShip, labels: ids => ids.map(id => T[id] ? T[id].label : id) };
})();
if (typeof module !== 'undefined') module.exports = HuntTrims;
