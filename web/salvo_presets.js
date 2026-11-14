/* Salvo presets (docs/stations_and_command_ui.md s4.1): a salvo is a plan, not a trigger. No DOM, no engine import.
 *
 *   SalvoPresets.get('ambush') -> { id, name, pattern, rte, homing, wire, warhead, cone, count, ... }
 *   SalvoPresets.toFire(p)     -> { cone, kind, homing, tubes } the part the engine can express today (E.fire arguments; count 12 = two tubes)
 *   SalvoPresets.unsimulated(p)-> ['pattern', 'rte', 'wire'] the parameters stored and shown, but not yet simulated
 * pattern: spread | snake | circle | line. rte: run to enable, seconds of dark run (3-30). count: missiles (6 per tube; the Probe preset is 1-2, fired with E.probe).
 */
(function (root) {
  'use strict';
  const PATTERNS = ['spread', 'snake', 'circle', 'line'];
  const NOT_SIMULATED = ['pattern', 'rte', 'wire'];   // TODO(engine): patterns, run-to-enable and the wire need the missile model rework (Newtonian phase)
  const PRESETS = {
    ambush:     { id: 'ambush', name: 'Ambush', key: 'A', pattern: 'spread', rte: 22, homing: true, wire: true, warhead: 'he', cone: 3, count: 6, tip: 'Long dark run, tight spread, the seeker wakes late. For a target that has not seen us.' },
    snap:       { id: 'snap', name: 'Snap shot', key: 'S', pattern: 'spread', rte: 5, homing: false, wire: false, warhead: 'he', cone: 10, count: 6, tip: 'Short run, wide spread, fast. For a target that is already moving.' },
    probe:      { id: 'probe', name: 'Probe', key: 'P', pattern: 'line', rte: 3, homing: false, wire: false, warhead: 'he', cone: 0, count: 2, probe: true, tip: 'A feint: two real missiles at a point, no ping. Watch who lights up.' },
    saturation: { id: 'saturation', name: 'Saturation', key: 'X', pattern: 'circle', rte: 12, homing: true, wire: false, warhead: 'he', cone: 16, count: 12, tip: 'Two tubes, a wide circle. Spends the magazine fast.' }
  };
  const clampN = (v, a, b) => Math.max(a, Math.min(b, v));
  function get(id) { const p = PRESETS[id] || PRESETS.ambush; return Object.assign({}, p); }
  function make(base, over) {   // a custom salvo from a preset, values kept in range
    const p = Object.assign(get(base), over || {});
    if (!PATTERNS.includes(p.pattern)) p.pattern = 'spread';
    p.rte = clampN(+p.rte || 3, 3, 30); p.cone = clampN(+p.cone || 0, 0, 24); p.count = clampN(Math.round(+p.count || 1), 1, p.probe ? 2 : 18);
    if (!['he', 'emp', 'flare'].includes(p.warhead)) p.warhead = 'he'; p.homing = !!p.homing; p.wire = !!p.wire;
    return p;
  }
  function toFire(p) { return { cone: p.cone, kind: p.warhead, homing: !!p.homing, tubes: p.probe ? 0 : Math.max(1, Math.ceil(p.count / 6)), probe: p.probe ? Math.min(2, p.count) : 0 }; }
  function unsimulated() { return NOT_SIMULATED.slice(); }
  function label(p) { return `${p.name}: ${p.pattern}, RTE ${p.rte} s, ${p.homing ? 'homing' : 'ballistic'}, ${p.wire ? 'wire' : 'no wire'}, ${p.warhead.toUpperCase()}, cone ${p.cone}, ${p.count} missiles`; }
  const API = { PRESETS, PATTERNS, NOT_SIMULATED, get, make, toFire, unsimulated, label, ids: Object.keys(PRESETS) };
  root.SalvoPresets = API; if (typeof module !== 'undefined') module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
