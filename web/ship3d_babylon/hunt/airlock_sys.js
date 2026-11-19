'use strict';
/* Boarding airlock state machine (rules only; the 3D parts and panel live in ship3d_bjs.js). No hunt feedback.
   Two hatches that cannot both be open; a pressure that only changes by cycling; a soft-dock tube that mates with another hull's collar.
   Mission scripts drive it:   const L = SHIP_BJS.api.airlock;
       L.dock({ id:'corvane', label:"Corvane's ship", p:1 })     // extend the tube and mate; p = that hull's pressure as a fraction of ours (1 = same air, .3 = thin, 0 = vented)
       L.arm({ id:'board_corvane', prompt:['Begin boarding','Look around first'] })   // shows the Act 0 prompt when the outer hatch is open on a mated tube
       addEventListener('airlock', e => e.detail)                // {type:'inner-open'|'inner-close'|'outer-open'|'outer-close'|'cycle-start'|'cycle-done'|'dock'|'undock'|'suit'|'board'|'look', ...}
   Numbers: hatch 1.6 s, cycle 6 s, tube 4 s (spec: 2.8 m x 4.2 m lock, 1.2 m inner hatch, ~6 m soft-dock tube, iris outer hatch). */
(function (root) {
  const HATCH_T = 1.6, CYC_T = 6, TUBE_T = 4, TOL = .05;
  function create() { return { inner: 'closed', outer: 'closed', p: 1, outside: { id: null, label: 'vacuum', p: 0 }, docked: false, tube: 0, tubeTo: 0, busy: null, suited: false, mission: null, boarded: false, ev: [], hatchI: 0, hatchO: 0 }; }
  const target = L => L.docked ? L.outside.p : 0;
  const emit = (L, type, d) => { const e = Object.assign({ type }, d || {}); L.ev.push(e); if (L.ev.length > 40) L.ev.shift(); try { root.dispatchEvent && root.dispatchEvent(new CustomEvent('airlock', { detail: e })); } catch (x) { } return e; };
  const pct = p => Math.round(p * 101.3);
  function can(L, a) {
    const ok = () => ({ ok: true }), no = why => ({ ok: false, why });
    if (L.busy) return no(L.busy.k === 'cycle' ? 'The lock is cycling.' : L.busy.k === 'tube' ? 'The soft-dock tube is moving.' : 'A hatch is moving.');
    switch (a) {
      case 'inner': if (L.inner === 'open') return L.outer === 'open' ? no('') : ok();
        if (L.outer === 'open') return no('Outer hatch is open. Close it first.'); if (Math.abs(L.p - 1) > TOL) return no('Lock is at ' + pct(L.p) + ' kPa, cabin is 101. Cycle the lock to cabin pressure first.'); return ok();
      case 'outer': if (L.outer === 'open') return ok();
        if (L.inner === 'open') return no('Inner hatch is open. Close it first.');
        if (L.docked && L.tube < 1) return no('The soft-dock tube is not sealed yet.');
        if (Math.abs(L.p - target(L)) > TOL) return no('Lock is at ' + pct(L.p) + ' kPa, outside is ' + pct(target(L)) + '. Cycle the lock first.');
        if (!L.docked && !L.suited) return no('Vacuum outside. Suit up first.'); return ok();
      case 'cycle': if (L.inner === 'open' || L.outer === 'open') return no('Close both hatches before cycling.'); return ok();
      case 'suit': return ok();
      case 'extend': if (L.docked) return no('Already mated.'); if (!L.outside.id) return no('No hull to mate with.'); if (L.outer === 'open') return no('Close the outer hatch.'); return ok();
      case 'retract': if (!L.docked && L.tube <= 0) return no('Nothing to retract.'); if (L.outer === 'open') return no('Close the outer hatch first.'); return ok();
    } return no('?');
  }
  function act(L, a, o) {
    const c = can(L, a); if (!c.ok) return c; o = o || {};
    if (a === 'inner') { L.busy = { k: 'hatch', w: 'inner', t: 0, dur: HATCH_T, to: L.inner === 'open' ? 'closed' : 'open' }; }
    else if (a === 'outer') { L.busy = { k: 'hatch', w: 'outer', t: 0, dur: HATCH_T, to: L.outer === 'open' ? 'closed' : 'open' }; }
    else if (a === 'cycle') { const to = o.to === 'cabin' ? 1 : o.to === 'outside' ? target(L) : (Math.abs(L.p - target(L)) > TOL && L.p > .5 * (1 + target(L)) ? target(L) : 1); if (Math.abs(L.p - to) < TOL) return { ok: false, why: 'Already at ' + pct(L.p) + ' kPa.' }; L.busy = { k: 'cycle', t: 0, dur: CYC_T, from: L.p, to }; emit(L, 'cycle-start', { to }); }
    else if (a === 'suit') { L.suited = !L.suited; emit(L, 'suit', { on: L.suited }); }
    else if (a === 'extend') L.busy = { k: 'tube', t: 0, dur: TUBE_T, from: L.tube, to: 1 };
    else if (a === 'retract') { if (L.docked) { L.docked = false; emit(L, 'undock', { id: L.outside.id }); } L.busy = { k: 'tube', t: 0, dur: TUBE_T, from: L.tube, to: 0, clear: true }; }
    return { ok: true };
  }
  function update(L, dt) {
    const b = L.busy; if (!b) return L; b.t += dt; const f = Math.min(1, b.t / b.dur), e = f * f * (3 - 2 * f);
    if (b.k === 'cycle') L.p = b.from + (b.to - b.from) * e;
    else if (b.k === 'tube') L.tube = b.from + (b.to - b.from) * e;
    else if (b.k === 'hatch') { const open = b.to === 'open'; L[b.w === 'inner' ? 'hatchI' : 'hatchO'] = open ? e : 1 - e; }
    if (f >= 1) {
      if (b.k === 'cycle') { L.p = b.to; emit(L, 'cycle-done', { p: L.p }); }
      else if (b.k === 'tube') { L.tube = b.to; if (b.to === 1) { L.docked = true; emit(L, 'dock', { id: L.outside.id, label: L.outside.label, p: L.outside.p }); } else if (b.clear) { L.outside = { id: null, label: 'vacuum', p: 0 }; L.boarded = false; } }
      else if (b.k === 'hatch') { L[b.w] = b.to; emit(L, b.w + '-' + (b.to === 'open' ? 'open' : 'close')); }
      L.busy = null;
    }
    return L;
  }
  // mission-facing helpers
  function dock(L, hull) { L.outside = { id: hull.id || 'hull', label: hull.label || 'other ship', p: hull.p == null ? 1 : hull.p }; return act(L, 'extend'); }
  function undock(L) { return act(L, 'retract'); }
  function arm(L, m) { L.mission = m; L.boarded = false; }
  function choose(L, i) { if (!L.mission || !L.docked || L.outer !== 'open') return { ok: false }; if (i === 0) { L.boarded = true; emit(L, 'board', { id: L.mission.id }); } else emit(L, 'look', { id: L.mission.id }); return { ok: true }; }
  function status(L) { return 'LOCK ' + pct(L.p) + ' kPa · inner ' + L.inner.toUpperCase() + ' · outer ' + L.outer.toUpperCase() + (L.docked ? ' · MATED ' + L.outside.label.toUpperCase() : L.tube > 0 ? ' · TUBE' : '') + (L.suited ? ' · SUITED' : ''); }
  root.AIRLOCK = { create, can, act, update, dock, undock, arm, choose, status, target, pct, HATCH_T, CYC_T, TUBE_T };
})(typeof window !== 'undefined' ? window : globalThis);
