/* Mini-mission trims (docs/mini_missions.md, data/mini_missions.json) mapped onto the hunt engine.
 * P and me: multipliers on our ship's profile for the hunt (s.me, built from HuntRT.PLAYER and our loadout); set: absolute values there.
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
    'sens.long_ears':       { label: 'Long ears', P: { sensR: 1.15, readDone: 1.12 } },   // scales the range of our three channels only (enemies use P.foeSensR)
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
  function active() {
    try { const q = new URLSearchParams(location.search).get('trims'); if (q) return q.split(',').filter(x => T[x]); } catch (e) {}
    try { const v = JSON.parse(localStorage.getItem('interdict.trims') || '[]'); return (Array.isArray(v) ? v : []).filter(x => T[x]); } catch (e) { return []; }
  }
  // Trims are player-only: they write into this hunt's player profile (s.me) and nowhere else. The shared rules (HuntRT.P) and every
  // enemy's behaviour block (a.ai) are out of reach, so a trim can never change the enemy. A key that is not in s.me is refused.
  function applyP(P, ids) { return P; }   // retired: trims no longer write to the shared P. Kept so old callers do not break.
  function applyShip(s, ids) {
    const bad = [];
    for (const id of ids) { const t = T[id]; if (!t) continue;
      for (const src of [t.P || {}, t.me || {}]) for (const k in src) { if (typeof s.me[k] === 'number') s.me[k] *= src[k]; else bad.push(id + ':' + k); }
      for (const k in t.set || {}) { if (k in s.me) s.me[k] = t.set[k]; else bad.push(id + ':' + k); } }
    if (bad.length && typeof console !== 'undefined') console.warn('trims: refused non-player keys', bad);
    s.trims = ids.slice(); return s;
  }
  return { T, active, applyP, applyShip, labels: ids => ids.map(id => T[id] ? T[id].label : id) };
})();
if (typeof module !== 'undefined') module.exports = HuntTrims;
