/* Station adapter: connects the hunt engine (HuntRT) to the station model (Stations). No DOM. docs/systems_contract.md s1.
 *
 *   const A = StationAdapter.create({ engine: HuntRT, seed: 1, autonomy: {...}, command: 'tight', preset: 'ambush' });
 *   const out = A.update(s, dtRealSeconds);   // feeds new s.evts and s.log lines into the model, ticks it, runs orders; returns UI events
 *   A.model                                   // the Stations instance (pending(), answer(), standBy(), ...)
 *   A.order(station, verb, label, data)       // a proactive CO order (radial menu): same lifecycle as a chip
 *   A.setPreset(id) / A.salvo                 // the current salvo preset (web/salvo_presets.js)
 * Orders reach the engine when their stage becomes 'executing'. Verbs the engine cannot do yet are logged no-ops (A.noops) with a TODO.
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
    const A = { model: M, noops: [], done: [], errors: [], salvo: Presets.get(cfg.preset || 'ambush'), pdPending: null, seenLog: 0, seenEvt: 0, s: null };
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
    function execute(o) {
      const s = A.s; if (!s || s.over) return;
      const d = o.data || {}, id = idOf(s, d), row = rowOf(o); let ok = true;
      try {
        switch (o.verb) {
          case 'classify': if (live(s, id)) { if (!s.analysts.every(w => w.task === id)) E.investigate(s, id); } else ok = false; break;
          case 'track': if (live(s, id)) { if (s.an[id].state === 'open') E.lockContact(s, id); else { const w = s.analysts.find(x => x.task == null) || s.analysts[0]; if (w.task !== id) E.assign(s, w.id, id); } } else ok = false; break;
          case 'mark': case 'ignore': case 'wait': break;   // by design: nothing to do
          case 'quiet': ok = E.goQuiet(s); break;
          case 'evade': ok = E.setOrder(s, 'evade', live(s, id) ? id : null); break;
          case 'hold': if (HELM_HOLD[row] && o.by === 'co') ok = E.setOrder(s, 'still', null); break;   // a defaulted 'hold' keeps the course (a competent crew does not stop the ship on its own)
          case 'ping': ok = live(s, id) && E.pingContact(s, id); break;
          case 'probe': { const pp = Presets.get('probe'); ok = id != null ? E.probe(s, id, pp.count) : d.aim ? E.probe(s, d.aim, pp.count) : false; break; }
          case 'fire': ok = id != null && fireSalvo(s, id, A.salvo); break;
          case 'pd_active': { const at = d.at, lead = 12 / ((E.RULES && E.RULES.secPerMin) || 16); if (at != null && at - s.t > lead) { E.setPD(s, 'armed'); A.pdPending = { at: at - lead, until: at }; } else ok = E.setPD(s, 'active'); break; }   // doctrine: go active at eta <= 12 s
          case 'pd_cold': A.pdPending = null; ok = E.setPD(s, 'armed'); break;
          case 'vent': ok = E.startVent(s); break;
          case 'cut_thrust': { if (s.burn) ok = E.setSpeed(s, s.burn.prev); else { const i = SPD.indexOf(s.speed); ok = i > 0 ? E.setSpeed(s, SPD[Math.min(i - 1, 2)]) : true; } break; }
          case 'redline': ok = E.redlineBurn(s); break;
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
    }
    function update(s, dt) {
      if (A.s !== s) { A.s = s; A.seenLog = s.log.length; A.seenEvt = (s.evts || []).length; A.pdPending = null; }   // a new hunt: start reading from now
      const evts = s.evts || [];
      for (let i = A.seenEvt; i < evts.length; i++) { try { M.onEvent(evts[i]); } catch (e) { A.errors.push(String(e)); } }
      A.seenEvt = evts.length;
      if (s.log.length > A.seenLog) { try { M.ingest(s.log.slice(A.seenLog)); } catch (e) { A.errors.push(String(e)); } A.seenLog = s.log.length; }
      if (dt > 0) M.tick(dt);
      if (A.pdPending && !s.over) { if (s.t >= A.pdPending.until + 0.2) A.pdPending = null; else if (s.t >= A.pdPending.at) { E.setPD(s, 'active'); A.pdPending = null; } }
      const out = outQ; outQ = []; return out;
    }
    A.update = update;
    A.order = (station, verb, label, data) => M.command(station, verb, label, data);
    A.setPreset = id => { A.salvo = Presets.get(id); return A.salvo; };
    A.presets = Presets;
    return A;
  }
  const API = { create, TODO, HELM_HOLD };
  root.StationAdapter = API; if (typeof module !== 'undefined') module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
