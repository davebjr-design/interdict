/* Station adapter: connects the hunt engine (HuntRT) to the station model (Stations). No DOM. docs/systems_contract.md s1.
 *
 *   const A = StationAdapter.create({ engine: HuntRT, seed: 1, autonomy: {...}, command: 'tight', preset: 'ambush' });
 *   const out = A.update(s, dtRealSeconds);   // feeds new s.evts and s.log lines into the model, ticks it, runs orders; returns UI events
 *   A.model                                   // the Stations instance (pending(), answer(), standBy(), ...)
 *   A.order(station, verb, label, data)       // a proactive CO order (radial menu): same lifecycle as a chip
 *   A.setPreset(id) / A.salvo                 // the current salvo preset (web/salvo_presets.js)
 * Orders reach the engine when their stage becomes 'executing'. Verbs the engine cannot do yet are logged no-ops (A.noops) with a TODO.
 *
 * Brace (docs/mechanics_brace.md): A.order('helm', 'brace', 'Brace', { on: true|false }) strap in / release. A hard burn, a hard evasion or the jump spool
 *   ordered while the crew are free is held and raised as call H4 ("Crew not secure": Brace first / Go now / Cancel; default Brace first after 8 s); doctrine.brace:
 *   'ask' (default: H4 gate; the crew brace on their own for a vampire), 'auto' (the crew brace before any hard order, no call) or 'manual' (only on order).
 *   A.handsOnBlocked(station) is true while the crew are braced and that station is Hands-on: A.order() then returns null (an out event {type:'blocked'}).
 * Decision moments (docs/mechanics_decisions.md): A.update() polls HuntRT.momentCheck(); a moment arrives as a call (rows M01-M09, answers m_tight / m_loose).
 *   cfg.moments = ['M02', ...] chooses which are live (default: M02 M03 M04 M07 M09; M01 stays the hunt page's own popup); cfg.moments = false turns them off.
 *   Out events {type:'moment', id, side, nudge, who, react, trust} carry the hidden command-style nudge (A.style.total, capped at 8 a hunt) and the reaction line.
 */
(function (root) {
  'use strict';
  const req = n => (typeof require !== 'undefined' ? require(n) : null);
  const Stations = root.Stations || req('./station_model.js'), Presets = root.SalvoPresets || req('./salvo_presets.js');
  const HELM_HOLD = { S6: 1, X1: 1, X2: 1, X3: 1 };   // on these rows 'Hold' means hold still (the quietest stance); elsewhere it means hold fire / hold off
  const SPD = ['v1', 'v2', 'v3', 'v4', 'v5', 'ab'];
  const TODO = {   // verbs the engine cannot do yet: logged no-ops
    baseline: 'TODO(Newtonian): a TMA baseline leg needs Newtonian motion and anisotropic range (contract s7 item 6)',
    turn: 'TODO(Newtonian): wire-cutting turns need the helm rework (contract s7 item 7)',
    burn: 'Burn as ordered: nothing to change (the burn preview H1 is a Newtonian-phase call)',
    ready: 'TODO: "ready salvo" has no engine state yet (tubes are always loaded when not reloading)',
    accept: 'TODO: ally data links are not in the engine yet (C1)',
    decline: 'Declined: nothing to do',
    pell_take: 'TODO: Pell taking a station is not in the engine yet (C3)',
    seal: 'TODO: damage control is a flag only until the compartment model exists'
  };
  function create(cfg) {
    cfg = cfg || {};
    const E = cfg.engine || root.HuntRT || req('./hunt_rt_engine.js');
    const M = Stations.create({ secPerMin: (E && E.RULES && E.RULES.secPerMin) || 16, command: cfg.command || 'tight', seed: cfg.seed || 1, autonomy: cfg.autonomy, doctrine: cfg.doctrine });
    const A = { model: M, noops: [], done: [], errors: [], salvo: Presets.get(cfg.preset || 'ambush'), pdPending: null, seenLog: 0, seenEvt: 0, s: null, braceWait: [], blocked: [], style: { total: 0, picks: [] }, moments: cfg.moments === false ? [] : (cfg.moments || ['M02', 'M03', 'M04', 'M07', 'M09']) };
    if (cfg.brace) M.setDoctrine({ brace: cfg.brace });
    let outQ = [];
    M.on(ev => { outQ.push(ev); if (ev.type === 'order' && ev.stage === 'executing') execute(ev.order); });
    const idOf = (s, d) => { const id = d && d.id != null ? d.id : d && d.n ? d.n - 1 : null; return id != null && s.an[id] ? id : null; };
    const live = (s, id) => id != null && ['open', 'locked'].includes(s.an[id].state) && s.an[id].idStatus !== 'plan';
    function noop(o, why) { const r = { t: A.s ? A.s.t : 0, verb: o.verb, row: rowOf(o), why }; A.noops.push(r); outQ.push({ type: 'noop', order: o, why }); return false; }
    const rowOf = o => { const c = M.calls.find(x => x.id === o.callId); return c ? c.row : null; };
    function fireSalvo(s, id, p) {
      const a = s.an[id]; if (!a) return false;
      if (a.state === 'open') { E.lockContact(s, id); return false; }   // first lock it; the crew will call when the solution is good
      const f = Presets.toFire(p); let n = 0;
      for (let k = 0; k < f.tubes; k++) if (E.fire(s, id, null, f.cone, f.kind, f.homing)) n++;
      return n > 0;
    }
    function linkGate(o, need) {   // a manoeuvre that would break a laser probe link: ask first (call H2P: Hold course / Turn anyway / Switch probes to radio)
      const c = M.raise('H2P', { sets: need.sets, pending: { verb: o.verb, data: o.data, by: o.by, callId: o.callId, station: o.station, officer: o.officer, label: o.label } });
      if (!c) { execute(Object.assign({}, o, { forced: true })); return true; }
      outQ.push({ type: 'gated', verb: o.verb, why: 'probe link', call: c }); return true;
    }
    function gate(o, need) {   // hold a hard order until the crew are secure (call H4), or run it once they are
      const s = A.s;
      if (s.brace === 'secure') { execute(Object.assign({}, o, { forced: true })); return true; }
      if (s.brace === 'bracing') { A.braceWait.push({ o, at: s.t }); return true; }
      if (M.doctrine.brace === 'auto') { E.brace(s, true, 'auto'); A.braceWait.push({ o, at: s.t }); return true; }
      const c = M.raise('H4', { why: need.why, g: need.g, pending: { verb: o.verb, data: o.data, by: o.by, callId: o.callId, station: o.station, officer: o.officer, label: o.label } });
      if (!c) { execute(Object.assign({}, o, { forced: true })); return true; }   // a cooldown swallowed the call: do not lose the order
      outQ.push({ type: 'gated', verb: o.verb, why: need.why, call: c }); return true;
    }
    function applyMoment(o, side, row, d, id) {
      const s = A.s, r = E.moment(s, row, side, { id, drilled: cfg.command === 'tight' }); if (!r || !r.ok) return false;
      const cap = (E.MOMENT_RULES && E.MOMENT_RULES.styleCap) || 8, room = cap - Math.abs(A.style.total), nudge = Math.sign(r.nudge) * Math.max(0, Math.min(Math.abs(r.nudge), room));
      A.style.total += nudge; A.style.picks.push({ t: s.t, id: row, side, nudge });
      outQ.push({ type: 'moment', id: row, side, nudge, who: r.react && r.react[0], react: r.react && r.react[1], look: r.look || null, trust: r.trust || null, officer: r.officer }); return true;
    }
    function execute(o) {
      const s = A.s; if (!s || s.over) return;
      const d = o.data || {}, id = idOf(s, d), row = rowOf(o); let ok = true;
      if (o.forced) s.noUnsecEvt = s.t + 3;   // a 'Go now': the crew know, do not raise H4 again for the same burn
      try {
        switch (o.verb) {
          case 'classify': if (live(s, id)) { if (!s.analysts.every(w => w.task === id)) E.investigate(s, id); } else ok = false; break;
          case 'track': if (live(s, id)) { if (s.an[id].state === 'open') E.lockContact(s, id); else { const w = s.analysts.find(x => x.task == null) || s.analysts[0]; if (w.task !== id) E.assign(s, w.id, id); } } else ok = false; break;
          case 'mark': case 'ignore': case 'wait': break;   // by design: nothing to do
          case 'quiet': ok = E.goQuiet(s); break;
          case 'evade': { const need = !o.forced && E.braceNeeded && E.braceNeeded(s, 'evade'); if (need) { ok = gate(o, need); break; } { const ln = !o.forced && E.linkNeeded && E.linkNeeded(s, 'evade'); if (ln) { ok = linkGate(o, ln); break; } } ok = E.setOrder(s, 'evade', live(s, id) ? id : null); break; }
          case 'hold': if (HELM_HOLD[row] && o.by === 'co') ok = E.setOrder(s, 'still', null); break;   // a defaulted 'hold' keeps the course (a competent crew does not stop the ship on its own)
          case 'ping': if (!live(s, id)) { ok = false; break; } if (!o.forced && A.moments.length && E.momentPing && E.momentPing(s, id, { enabled: A.moments })) { ok = true; break; } ok = E.pingContact(s, id); break;   // M02 may hold the ping for a decision
          case 'probe': { const pp = Presets.get('probe'); ok = id != null ? E.probe(s, id, pp.count) : d.aim ? E.probe(s, d.aim, pp.count) : false; break; }
          case 'fire': ok = id != null && fireSalvo(s, id, A.salvo); break;
          case 'pd_active': { const at = d.at, lead = 12 / ((E.RULES && E.RULES.secPerMin) || 16); if (at != null && at - s.t > lead) { E.setPD(s, 'armed'); A.pdPending = { at: at - lead, until: at }; } else ok = E.setPD(s, 'active'); break; }   // doctrine: go active at eta <= 12 s
          case 'pd_cold': A.pdPending = null; ok = E.setPD(s, 'armed'); break;
          case 'vent': ok = E.startVent(s); break;
          case 'cut_thrust': { if (s.burn) ok = E.setSpeed(s, s.burn.prev); else { const i = SPD.indexOf(s.speed); ok = i > 0 ? E.setSpeed(s, SPD[Math.min(i - 1, 2)]) : true; } break; }
          case 'redline': { const need = !o.forced && E.braceNeeded && E.braceNeeded(s, 'redline'); if (need) { ok = gate(o, need); break; } { const ln = !o.forced && E.linkNeeded && E.linkNeeded(s, 'redline'); if (ln) { ok = linkGate(o, ln); break; } } ok = E.redlineBurn(s); break; }
          case 'spool': { const need = !o.forced && E.braceNeeded && E.braceNeeded(s, 'spool'); if (need) { ok = gate(o, need); break; } { const ln = !o.forced && E.linkNeeded && E.linkNeeded(s, 'spool'); if (ln) { ok = linkGate(o, ln); break; } } ok = E.retreat(s) !== false; break; }
          case 'brace': ok = E.brace(s, d.on !== false, 'co'); break;
          case 'brace_first': { ok = E.brace(s, true, 'co'); if (d.pending) A.braceWait.push({ o: d.pending, at: s.t }); break; }
          case 'go_now': if (d.pending) ok = execute(Object.assign({}, d.pending, { forced: true })) !== false; break;
          case 'cancel': if (!d.pending) { if (s.burn) E.setSpeed(s, s.burn.prev); else { const i = SPD.indexOf(s.speed); if (i > 2) E.setSpeed(s, 'v3'); } if (s.spool) E.retreat(s); } break;   // an engine-raised H4 has nothing pending: cancel eases off
          case 'probes_deploy': ok = E.deployProbes && E.deployProbes(s, d.set || (s.pset.find(p => p.state === 'rack') || {}).id, id, d.link); break;
          case 'probes_radio': ok = E.setProbeLink && s.pset.filter(p => p.state === 'out' && p.link === 'laser').map(p => E.setProbeLink(s, p.id, 'radio')).some(Boolean); break;
          case 'probes_radio_go': { if (E.setProbeLink) for (const p of s.pset) if (p.state === 'out' && p.link === 'laser') E.setProbeLink(s, p.id, 'radio'); if (d.pending) ok = execute(Object.assign({}, d.pending, { forced: true })) !== false; break; }
          case 'probes_recover': ok = E.recoverProbes && s.pset.filter(p => p.state === 'out').map(p => E.recoverProbes(s, p.id)).some(Boolean); break;
          case 'treat': ok = E.treat ? E.treat(s, d.officer) : false; break;
          case 'm_tight': case 'm_loose': ok = applyMoment(o, o.verb === 'm_tight' ? 'tight' : 'loose', row, d, id); break;
          case 'burn_short': case 'abort': if (s.burn) ok = E.setSpeed(s, s.burn.prev); break;
          case 'rescan': if (id == null) ok = false; else if (s.an[id].state === 'out') ok = E.reanalyze(s, id); else if (s.an[id].state === 'locked') { const w = s.analysts.find(x => x.task == null) || s.analysts[0]; if (w.task !== id) E.assign(s, w.id, id); } else if (live(s, id)) ok = E.investigate(s, id); break;
          case 'refresh': ok = id != null && E.refreshSolution(s, id); break;
          case 'save_sink': case 'save_drive': s.dmgPriority = o.verb === 'save_sink' ? 'sink' : 'drive'; break;   // a flag only (no compartment model yet)
          case 'mark_hostile': if (id != null) E.markHostile(s, s.an[id]); break;
          case 'set_preset': A.setPreset(d.preset); break;
          default: ok = noop(o, TODO[o.verb] || 'TODO: no engine call for verb ' + o.verb); if (o.verb === 'seal') s.dmgPriority = 'seal';
        }
      } catch (e) { ok = false; A.errors.push(String(e && e.stack || e)); }
      A.done.push({ t: s.t, verb: o.verb, row, by: o.by, ok: ok !== false });
      outQ.push({ type: 'executed', order: o, ok: ok !== false });
      return ok !== false;
    }
    function syncBody(s) {   // the crew's bodies: braced crew work from the couches, an injured officer is slower still; the doctrine sets how the crew brace on their own
      if (!E.crewEff) return;
      s.braceAuto = M.doctrine.brace === 'auto' ? 'all' : M.doctrine.brace === 'manual' ? 'off' : 'vampire';
      const mul = s.brace === 'secure' ? (s.me.braceReact || 1.3) : s.brace === 'bracing' ? (s.me.braceReactMoving || 1.6) : 1;
      for (const k in M.officers) { const e = E.crewEff(s, k), v = mul / Math.max(0.25, e); M.setBody(k, Math.abs(v - 1) < 1e-9 ? null : v); }
    }
    function update(s, dt) {
      if (A.s !== s) { A.s = s; A.seenLog = s.log.length; A.seenEvt = (s.evts || []).length; A.pdPending = null; A.braceWait = []; A.style = { total: 0, picks: [] }; }   // a new hunt: start reading from now
      syncBody(s);
      if (A.moments.length && E.momentCheck && !s.over) { try { E.momentCheck(s, { enabled: A.moments, drilled: cfg.command === 'tight' }); } catch (e) { A.errors.push(String(e && e.stack || e)); } }
      const evts = s.evts || [];
      for (let i = A.seenEvt; i < evts.length; i++) { try { M.onEvent(evts[i]); } catch (e) { A.errors.push(String(e)); } }
      A.seenEvt = evts.length;
      if (s.log.length > A.seenLog) { try { M.ingest(s.log.slice(A.seenLog)); } catch (e) { A.errors.push(String(e)); } A.seenLog = s.log.length; }
      if (dt > 0) M.tick(dt);
      if (A.braceWait.length && !s.over) {   // orders held for the crew to be secure
        const keep = [];
        for (const w of A.braceWait) { if (s.brace === 'secure') execute(Object.assign({}, w.o, { forced: true })); else if (s.brace === 'free' || s.t - w.at > 1.5) outQ.push({ type: 'noop', order: w.o, why: 'brace order dropped: the crew are not bracing' }); else keep.push(w); }
        A.braceWait = keep;
      }
      if (A.pdPending && !s.over) { if (s.t >= A.pdPending.until + 0.2) A.pdPending = null; else if (s.t >= A.pdPending.at) { E.setPD(s, 'active'); A.pdPending = null; } }
      const out = outQ; outQ = []; return out;
    }
    A.update = update;
    A.handsOnBlocked = station => !!(A.s && A.s.brace && A.s.brace !== 'free' && station !== 'helm-brace' && M.autonomy[station] === 'hands-on');
    A.order = (station, verb, label, data) => {
      if (verb !== 'brace' && A.handsOnBlocked(station)) { A.blocked.push({ t: A.s.t, station, verb }); outQ.push({ type: 'blocked', station, verb, why: 'braced: unstrap first (A.order helm brace {on:false})' }); return null; }   // a strapped-in officer cannot work the controls by hand
      return M.command(station, verb, label, data);
    };
    A.setPreset = id => { A.salvo = Presets.get(id); return A.salvo; };
    A.presets = Presets;
    return A;
  }
  const API = { create, TODO, HELM_HOLD };
  root.StationAdapter = API; if (typeof module !== 'undefined') module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
