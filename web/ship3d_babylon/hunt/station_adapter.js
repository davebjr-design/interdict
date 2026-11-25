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
 * Stun (docs/mechanics_brace.md): a hit on a crew who are not secure can stun an officer for 6 to 12 s. The station model holds his orders and calls until he is back
 *   (Auto/Supervised), Hands-on is locked out (A.order returns null, out event {type:'blocked'}; A.stunned(station)). Out events {type:'stun'|'recovered', officer, station}.
 * Station verbs added: speed {speed:'v1'..'v5'|'ab'}, dismiss {id}, still, vent_stop, evade (as before). Each runs through the usual order timing (A.order or a chip).
 *   A.handsOnBlocked(station) is true while the crew are braced and that station is Hands-on: A.order() then returns null (an out event {type:'blocked'}).
 * Decision moments (docs/mechanics_decisions.md): A.update() polls HuntRT.momentCheck(); a moment arrives as a call (rows M01-M09, answers m_tight / m_loose).
 *   cfg.moments = ['M02', ...] chooses which are live (default: M02 M03 M04 M07 M09; M01 stays the hunt page's own popup); cfg.moments = false turns them off.
 *   Out events {type:'moment', id, side, nudge, who, react, trust} carry the hidden command-style nudge (A.style.total, capped at 8 a hunt) and the reaction line.
 */
(function (root) {
  'use strict';
  const req = n => (typeof require !== 'undefined' ? require(n) : null);
  const Stations = root.Stations || req('./station_model.js'), Presets = root.SalvoPresets || req('./salvo_presets.js'), AB = root.Answerbacks || req('./answerbacks.js');   // answerbacks: an officer's follow-up question after an order (docs/answerbacks.md)
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
    const A = { model: M, noops: [], done: [], errors: [], salvo: Presets.get(cfg.preset || 'ambush'), pdPending: null, seenLog: 0, seenEvt: 0, s: null, braceWait: [], blocked: [], ab: AB ? AB.create() : null, style: { total: 0, picks: [] }, moments: cfg.moments === false ? [] : (cfg.moments || ['M02', 'M03', 'M04', 'M07', 'M09']) };
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
      const f = Presets.toFire(p); let n = 0; const hc = s.hunchCone && s.hunchCone.id === id && s.t < s.hunchCone.until ? s.hunchCone.delta : 0, cone = Math.max(2, f.cone + hc);   // a taken hunch bends the cone
      for (let k = 0; k < f.tubes; k++) if (E.fire(s, id, null, cone, f.kind, f.homing)) n++;
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
      const d = o.data || {}, id = idOf(s, d), row = rowOf(o); let ok = true; const CR = root.CrewReports, before = CR ? CR.snap(E, s) : null, q0 = E.capOf ? E.capOf(s).queue.length : 0, vol0 = s.volleys ? s.volleys.length : 0;
      if (o.forced) s.noUnsecEvt = s.t + 3;   // a 'Go now': the crew know, do not raise H4 again for the same burn
      try {
        switch (o.verb) {
          case 'classify': if (live(s, id)) { if (!s.analysts.every(w => w.task === id)) E.investigate(s, id); } else ok = false; break;
          case 'track': if (live(s, id)) { if (s.an[id].state === 'open') E.lockContact(s, id); else { const w = s.analysts.find(x => x.task == null) || s.analysts[0]; if (w.task !== id) E.assign(s, w.id, id); } } else ok = false; break;
          case 'speed': { const k = d.speed || d.k; if (k === 'ab') return execute(Object.assign({}, o, { verb: 'redline' })); ok = SPD.includes(k) && E.setSpeed(s, k); break; }   // drive level v1..v5 (ab goes through the redline gate)
          case 'dismiss': { const a = id != null ? s.an[id] : null; if (a && a.state === 'open' && a.idStatus !== 'hostile' && a.idStatus !== 'plan') E.dismissContact(s, id); else ok = false; break; }   // rule a contact out
          case 'still': case 'stop_here': ok = E.setOrder(s, 'still', null); break;   // all stop: flip, brake, hold (stop_here is the planner's name for it)
          case 'route': ok = !!(d.pts && d.pts.length) && E.setRoute(s, d.pts); break;   // waypoints [{x, y, speed?, kind?: 'turn'|'stop'}] through the flight planner   // all stop, hold position (always; 'hold' only does it on helm rows)
          case 'vent_stop': ok = E.stopVent(s); break;   // pull the fins in by hand
          case 'mark': case 'ignore': case 'wait': break;   // by design: nothing to do
          case 'quiet': ok = E.goQuiet(s); break;
          case 'evade': { const need = !o.forced && E.braceNeeded && E.braceNeeded(s, 'evade'); if (need) { ok = gate(o, need); break; } { const ln = !o.forced && E.linkNeeded && E.linkNeeded(s, 'evade'); if (ln) { ok = linkGate(o, ln); break; } } ok = E.setOrder(s, 'evade', live(s, id) ? id : null); break; }
          case 'hold': if (HELM_HOLD[row] && o.by === 'co') ok = E.setOrder(s, 'still', null); break;   // a defaulted 'hold' keeps the course (a competent crew does not stop the ship on its own)
          case 'ping': if (!live(s, id)) { ok = false; break; } if (!o.forced && A.moments.length && E.momentPing && E.momentPing(s, id, { enabled: A.moments })) { ok = true; break; } ok = E.pingContact(s, id); break;   // M02 may hold the ping for a decision
          case 'hail': ok = id != null && E.hailContact(s, id); break;   // voice hail on the open channel (soft information)
          case 'challenge': ok = id != null && live(s, id) && E.challenge(s, id); break;   // transponder challenge (friend or foe proof)
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
          default: { const r = A.ab ? A.ab.run(o.verb, { E, s, M, doctrine: M.doctrine, id, d }) : null; if (r !== null) { ok = r; if (!r) noop(o, 'answerback could not be carried out'); } else { ok = noop(o, TODO[o.verb] || 'TODO: no engine call for verb ' + o.verb); if (o.verb === 'seal') s.dmgPriority = 'seal'; } }
        }
      } catch (e) { ok = false; A.errors.push(String(e && e.stack || e)); }
      if (CR && before && o.verb === 'fire' && ok === false && E.capOf && E.capOf(s).queue.length > q0) ok = true;   // a fire order to cold tubes is queued, not refused: the tubes ready and it goes when they are hot
      if (CR && before) { try { const r = reportOf(o, s, before, ok !== false, id, q0, vol0); if (r) outQ.push({ type: 'report', order: o, officer: r.officer, text: r.text, parts: r.parts, tier: r.tier, level: r.level, conf: r.conf }); } catch (e) { A.errors.push(String(e && e.stack || e)); } }
      if (A.ab && ok !== false && (o.by === 'co' || o.by === 'player') && REPORT_VERB[o.verb]) { try { for (const r of A.ab.check({ E, s, M, doctrine: M.doctrine, verb: REPORT_VERB[o.verb], d, id })) { const c = M.raise(r.row, r.data); if (c) outQ.push({ type: 'answerback', row: r.row, call: c }); } } catch (e) { A.errors.push(String(e && e.stack || e)); } }   // an answerback: the officer asks one follow-up (web/answerbacks.js)
      A.done.push({ t: s.t, verb: o.verb, row, by: o.by, ok: ok !== false });
      outQ.push({ type: 'executed', order: o, ok: ok !== false });
      return ok !== false;
    }
    // the officer's four-part answer to an order: action, what changes, where we stand, what it means (web/crew_reports.js)
    const REPORT_VERB = { classify: 'classify', rescan: 'rescan', track: 'lock', refresh: 'refresh', fire: 'fire', probe: 'probe', speed: 'speed', still: 'still', stop_here: 'still', evade: 'evade', route: 'route', vent: 'vent', vent_stop: 'ventstop', quiet: 'quiet', ping: 'ping', hail: 'hail', challenge: 'challenge', dismiss: 'rule', mark_hostile: 'mark', pd_active: 'pdon', pd_cold: 'pdoff', redline: 'redline', cut_thrust: 'cut', brace: 'brace' };
    function reportOf(o, s, before, ok, id, q0, vol0) {
      const CR = root.CrewReports; let verb = REPORT_VERB[o.verb]; if (!verb || !ok || o.by !== 'co' && o.by !== 'player') return null; if (o.verb === 'brace' && (o.data || {}).on === false) return null;
      const rs = (E.P && E.P.secPerMin) || 16, a = id != null ? s.an[id] : null, d = { t: a ? 'S' + (a.id + 1) : '' };
      if (verb === 'fire') { const q = E.capOf ? E.capOf(s).queue.length : 0; if (q > q0 && (!s.volleys || s.volleys.length === vol0)) { verb = 'firequeue'; d.secs = (E.RULES.capTime || 0.5) * rs; } else { const v = s.volleys[s.volleys.length - 1]; d.count = v && v.off ? v.off.length : 1; d.eta = v ? (v.at - s.t) * rs : 0; } }
      if (verb === 'lock' || verb === 'refresh') { const si = a && a.state === 'locked' ? E.solveInfo(s, a) : null, ts = a && a.state === 'locked' ? E.trackState(s, a) : null; d.secs = si && isFinite(si.remain) ? si.remain * rs : 40; d.track = ts ? ts.state : 'passive'; d.conf0 = ts && ts.state === 'lock' ? 'sure' : ts && ts.state === 'track' ? 'likely' : 'guess'; }
      if (verb === 'classify' || verb === 'rescan') { try { const cl = a ? E.classify(s, a) : null, p = cl && cl.post ? Math.max(cl.post.real, cl.post.lure, cl.post.ghost) : 0; d.conf0 = p >= 0.9 ? 'sure' : p >= 0.6 ? 'likely' : 'guess'; d.conf = p >= 0.9 ? 'a firm call' : p >= 0.6 ? 'a probable call' : 'no call yet'; } catch (e) { d.conf0 = 'guess'; d.conf = 'no call yet'; } }
      if (verb === 'probe') { d.left = s.mag ? s.mag.total : 0; d.eta = a ? (E.closeInfo ? 90 : 90) : 90; }
      if (verb === 'quiet') d.secs = s.me.quietDur * rs;
      if (verb === 'redline') { const rate = E.heatRate(s) / 1; d.secs = rate > 0 ? Math.max(1, (1 - s.sink.h) / rate * rs) : 99; }
      if (verb === 'brace') d.secs = 6;
      if (verb === 'route') { const pts = (o.data || {}).pts || [], pi = E.previewRoute && pts.length ? E.previewRoute(s, pts) : null; if (pi) { d.legs = pts.length; d.mins = Math.max(1, Math.round(pi.timeSec / 60)); d.g = pi.peakG; d.prop = (+pi.propT).toFixed(1); d.flip = pi.firstFlipT != null ? Math.max(1, Math.round(pi.firstFlipT * rs)) : ''; } else return null; }   // the numbers come from a fresh preview of the plotted route: the live plan is only rebuilt on the next tick, so it still shows the old route here
      return CR.report({ E, s, verb, before, d, mode: M.autonomy[o.station] || 'supervised' });
    }
    function syncBody(s) {   // the crew's bodies: braced crew work from the couches, an injured officer is slower still; the doctrine sets how the crew brace on their own
      if (!E.crewEff) return;
      for (const k in M.officers) { const c = s.crew && s.crew[k]; M.setStun(k, c && E.stunned && E.stunned(s, k) ? M.now + (c.stunUntil - s.t) * M.secPerMin : null); }   // a stunned officer's station is dead: the model holds his orders and calls until he is back
      s.braceAuto = M.doctrine.brace === 'auto' ? 'all' : M.doctrine.brace === 'manual' ? 'off' : 'vampire';
      const mul = s.brace === 'secure' ? (s.me.braceReact || 1.3) : s.brace === 'bracing' ? (s.me.braceReactMoving || 1.6) : 1;
      for (const k in M.officers) { const e = E.crewEff(s, k), v = mul / Math.max(0.25, e); M.setBody(k, Math.abs(v - 1) < 1e-9 ? null : v); }
    }
    function update(s, dt) {
      if (A.s !== s) { A.s = s; A.seenLog = s.log.length; A.seenEvt = (s.evts || []).length; A.pdPending = null; A.braceWait = []; A.style = { total: 0, picks: [] }; if (AB) A.ab = AB.create(); }   // a new hunt: start reading from now
      syncBody(s);
      if (E.planInfo) { const pi = s.nav && s.nav.id !== A.planId ? E.planInfo(s) : null; if (pi) { A.planId = s.nav.id; outQ.push({ type: 'plan', id: pi.id, mode: pi.mode, endT: pi.endT, timeSec: pi.timeSec, dv: pi.dv, propT: pi.propT, peakG: pi.peakG, warn: pi.warn }); } }   // the flight plan changed: a summary for the console (the full path is A.plan())
      if (A.moments.length && E.momentCheck && !s.over) { try { E.momentCheck(s, { enabled: A.moments, drilled: cfg.command === 'tight' }); } catch (e) { A.errors.push(String(e && e.stack || e)); } }
      const evts = s.evts || [];
      for (let i = A.seenEvt; i < evts.length; i++) { const ev = evts[i]; if (ev.type === 'stun' || ev.type === 'recovered') outQ.push({ type: ev.type, officer: ev.data.officer, station: ev.data.station, until: ev.data.until }); try { M.onEvent(evts[i]); } catch (e) { A.errors.push(String(e)); } }
      A.seenEvt = evts.length;
      if (s.log.length > A.seenLog) { try { M.ingest(s.log.slice(A.seenLog)); } catch (e) { A.errors.push(String(e)); } A.seenLog = s.log.length; }
      if (dt > 0) M.tick(dt);
      if (A.ab && !s.over) { try { for (const r of A.ab.tick({ E, s, M })) outQ.push({ type: 'report', order: null, officer: r.officer, text: r.text, parts: [r.text], tier: 0, level: null, conf: null }); } catch (e) { A.errors.push(String(e && e.stack || e)); } }   // standing orders from answerbacks
      if (A.braceWait.length && !s.over) {   // orders held for the crew to be secure
        const keep = [];
        for (const w of A.braceWait) { if (s.brace === 'secure') execute(Object.assign({}, w.o, { forced: true })); else if (s.brace === 'free' || s.t - w.at > 1.5) outQ.push({ type: 'noop', order: w.o, why: 'brace order dropped: the crew are not bracing' }); else keep.push(w); }
        A.braceWait = keep;
      }
      if (A.pdPending && !s.over) { if (s.t >= A.pdPending.until + 0.2) A.pdPending = null; else if (s.t >= A.pdPending.at) { E.setPD(s, 'active'); A.pdPending = null; } }
      const out = outQ; outQ = []; return out;
    }
    A.REPORT_VERB = REPORT_VERB; A.update = update;
    A.stunned = station => !!(A.s && E.stunned && Stations.OFFICER[station] && E.stunned(A.s, Stations.OFFICER[station]));   // the officer at this station is down from an impact
    A.handsOnBlocked = station => !!(A.s && A.s.brace && A.s.brace !== 'free' && station !== 'helm-brace' && M.autonomy[station] === 'hands-on') || (M.autonomy[station] === 'hands-on' && A.stunned(station));
    A.order = (station, verb, label, data) => {
      if (verb !== 'brace' && A.handsOnBlocked(station)) { A.blocked.push({ t: A.s.t, station, verb }); outQ.push({ type: 'blocked', station, verb, why: 'braced: unstrap first (A.order helm brace {on:false})' }); return null; }   // a strapped-in officer cannot work the controls by hand
      if (A.stunned(station) && M.autonomy[station] === 'hands-on') { outQ.push({ type: 'blocked', station, verb, why: 'stunned: ' + Stations.OFFICER[station] + ' is down' }); return null; }   // an Auto or Supervised order is simply held by the model until he is back
      return M.command(station, verb, label, data);
    };
    A.plan = () => A.s && E.planInfo ? E.planInfo(A.s) : null;   // the live flight plan: segments, path samples, waypoints with times, delta-v, propellant (water, generic mass), warnings, and where the ship is in it
    A.setPreset = id => { A.salvo = Presets.get(id); return A.salvo; };
    A.presets = Presets;
    return A;
  }
  const API = { create, TODO, HELM_HOLD };
  root.StationAdapter = API; if (typeof module !== 'undefined') module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
