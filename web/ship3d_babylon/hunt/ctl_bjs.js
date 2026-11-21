/* THREE-free control layer for the Babylon ship: the action dispatcher (can / order / run / activate) lifted unchanged from web/cic3d/interact.js lines 9-104
 * (everything before the hardware tables), run against a small CIC shim. Requires HuntRT, Stations, StationAdapter, LS. Exposes window.CTL. */
window.CTL_INIT = function () {
  'use strict';
  const toastEl = document.createElement('div'); toastEl.style.cssText = 'position:fixed;left:50%;bottom:calc(64px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);max-width:80vw;padding:6px 12px;border-radius:6px;background:#0c1f1bee;color:#c4dcd2;border:1px solid #1d4a42;font:13px/1.3 monospace;opacity:0;transition:opacity .25s;pointer-events:none;z-index:5'; document.body.appendChild(toastEl); let tt = 0;
  window.UI = { toast(t, k) { toastEl.textContent = t; toastEl.style.borderColor = k === 'w' ? '#f0ab3a' : '#3fd38a'; toastEl.style.opacity = 1; clearTimeout(tt); tt = setTimeout(() => { toastEl.style.opacity = 0; }, 2800); } };
  const H = window.CTL_HOST;   // { E, S(), A(), ANN() } supplied by ship3d_bjs.js
  window.CIC = { E: H.E, get S() { return H.S(); }, get A() { return H.A(); }, get ANN() { return H.ANN(); }, THREE: null, tscale: 1, hooks: { shake: [], frame: [] }, on(k, f) { (this.hooks[k] = this.hooks[k] || []).push(f); }, fire(k, ...a) { (this.hooks[k] || []).forEach(f => f(...a)); }, get annOut() { return LS.ctx.annOut; },
    shake(a) { this.fire('shake', a); window.SHIPFX && window.SHIPFX.shake(a); },
    braceState() { const S = H.S(), b = S && S.brace; if (b === undefined || b === null) return 'free'; if (typeof b === 'string') return b.toLowerCase(); if (typeof b === 'object') return String(b.state || b.co || 'free').toLowerCase(); return b ? 'secure' : 'free'; },
    setBrace(on) { const S = H.S(), A = H.A(), E = H.E; if (S && typeof S.brace === 'string' && typeof E.brace === 'function') { try { if (on) { if (!(A && A.order('helm', 'brace', 'Brace', { on: true }))) E.brace(S, true, 'co'); } else E.brace(S, false, 'co'); } catch (e) { } } },
    setTime(n) { this.tscale = n; } };
  const C = CIC, E = C.E, LX = LS.ctx, TH = C.THREE, UI_ = window.UI, snd = n => { try { window.AUD && AUD.play(n); } catch (e) { } }, say = (w, t, p) => { try { window.AUD && AUD.say(w, t, p); } catch (e) { } };
  const S = () => C.S, A = () => C.A, M = () => C.A.model, OFF = Stations.OFFICER;
  const selA = () => { const s = S(); const a = LX.sel != null ? s.an[LX.sel] : null; return a && a.state !== 'out' ? a : null; };
  const tag = a => 'S' + (a.id + 1), live = a => a && (a.state === 'open' || a.state === 'locked') && a.idStatus !== 'plan';
  const modeOf = k => M().autonomy[k], now = () => performance.now();
  // ---------- selection ----------
  function select(id) { if (id == null || !S().an[id] || S().an[id].state === 'out') return; if (LX.sel !== id) snd('tick'); LX.sel = id; }
  function selStep(d) { const l = S().an.filter(a => a.state !== 'out'); if (!l.length) return; let i = l.findIndex(a => a.id === LX.sel); i = i < 0 ? 0 : (i + d + l.length) % l.length; select(l[i].id); }
  // ---------- which station handles which action ----------
  const ST = { 'act:classify': 'sensors', 'act:lock': 'fire', 'act:ping': 'sensors', 'act:probe': 'weapons', 'act:rule': 'sensors', 'act:rescan': 'sensors', 'act:refresh': 'fire', 'act:mark': 'weapons', 'act:quiet': 'sensors', 'act:hail': 'comms', 'act:challenge': 'comms', fire: 'weapons', 'pd:active': 'weapons', 'pd:cold': 'weapons', 'pd:toggle': 'weapons', vent: 'thermal', 'spd:cut': 'thermal', 'spd:ab': 'engineering', 'post:still': 'helm', 'post:evade': 'helm', 'prio:save_sink': 'damage', 'prio:save_drive': 'damage' };
  ['v1', 'v2', 'v3', 'v4', 'v5'].forEach(k => ST['spd:' + k] = 'helm');
  const DESC = { 'act:hail': ['HAIL', 'Pell hails the contact on the open channel. The reply is soft evidence only (anyone can lie on a radio), and the hail is a small emission.'], 'act:challenge': ['CHALLENGE', 'Transponder challenge by directional beam. A friend answers with the countersign; a hostile may notice the beam.'], 'act:classify': ['CLASSIFY', 'Put every analyst on the selected contact. Heat, reactor and eclipse readings firm up.'], 'act:lock': ['LOCK / TRACK', 'Lock the selected contact and start a firing solution (locking a decoy wastes time and draws a chase). On a locked contact: put an analyst on it, the solution needs eyes.'], 'act:ping': ['ACTIVE PING', 'A crisp fix on the selected contact. Everything within reach hears it, and a warship learns where we are. Guarded.'], 'act:probe': ['PROBE SALVO', 'A feint: two real missiles at the contact\'s position, no ping. Watch who lights up.'], 'act:rule': ['RULE OUT', 'Dismiss the selected contact as junk. Ruling out a real ship loses it. Guarded.'], 'act:rescan': ['RESCAN', 'Put an analyst back on the selected contact.'], 'act:refresh': ['REFRESH SOLUTION', 'Rebuild a stale firing solution on the locked contact.'], 'act:mark': ['MARK HOSTILE', 'Mark the contact as a confirmed hostile (red).'], 'act:quiet': ['GO QUIET', 'Sensors dark and no launches for a while: slows how fast anyone finds us.'], fire: ['FIRE SALVO', 'Launch the current salvo preset at the selected, locked contact. Lift the guard first.'], 'pd:active': ['POINT DEFENCE ACTIVE', 'Radars lit. A visibility event: everything can see us. Only when a vampire is inbound.'], 'pd:cold': ['POINT DEFENCE ARMED', 'Armed and cold: slow to react, nearly silent.'], 'pd:toggle': ['POINT DEFENCE', 'Switch between armed (cold) and active (radars lit). Guarded.'], vent: ['VENT HEAT', 'Fins out: dump heat from the sink. We are fully visible until they retract.'], 'spd:cut': ['CUT THRUST', 'Drop the drive down a notch (or end a redline burn).'], 'spd:ab': ['REDLINE', 'Far faster, but the sink fills in seconds. Short bursts only. Guarded.'], 'post:still': ['HOLD STILL', 'Drive off: the quietest we can be.'], 'post:evade': ['EVASIVE', 'Weave: analysts read ~10% faster, but we are about 20% louder.'], brace: ['BRACE', 'Strap in. Any hard burn or incoming impact needs the crew secure.'], 'prio:save_sink': ['SAVE THE SINK', 'Damage control repairs the heat sink first.'], 'prio:save_drive': ['SAVE THE DRIVE', 'Damage control repairs the drive first.'] };
  ['v1', 'v2', 'v3', 'v4', 'v5'].forEach((k, i) => DESC['spd:' + k] = ['SPEED ' + (i + 1) * 20 + '%', E.SPEED[k] ? E.SPEED[k].tip : '']);
  const GUARDED = id => id === 'act:ping' || id === 'act:rule' || id === 'spd:ab' || (id === 'pd:active' && S().pd !== 'active') || (id === 'pd:toggle' && S().pd !== 'active') || (id === 'vent' && !S().vent.on);
  const latch = id => { const s = S(); return { 'act:quiet': s.t < s.quietUntil, 'pd:toggle': s.pd === 'active', vent: s.vent.on, 'post:still': s.posture === 'still', 'post:evade': s.posture === 'evade', brace: C.braceState() !== 'free', 'spd:ab': s.speed === 'ab' }[id]; };
  // ---------- can: is the control usable right now? ----------
  function can(id) {
    const s = S(), a = selA(), no = why => ({ ok: false, why }), ok = { ok: true }; if (!s || (s.over && !/^(brace|time|ack|guard|sel:)/.test(id))) return no('The hunt is over');
    const needs = (f, nm) => !a ? no('Select a contact first') : !f ? no(nm) : ok;
    switch (id) {
      case 'act:classify': case 'act:rescan': case 'act:mark': return needs(live(a), 'Contact is not live');
      case 'act:lock': return !a ? no('Select a contact first') : a.state === 'open' ? ok : a.state === 'locked' ? (s.analysts.some(w => w.task === a.id) ? no('An analyst is already tracking it') : ok) : no('Contact is not live');
      case 'act:ping': { const n = needs(live(a), 'Contact is not live'); if (n.ok === false) return n; return s.t < s.quietUntil ? no('We are running quiet') : s.t < s.pingCd ? no('Ping is recharging') : ok; }
      case 'act:probe': { const n = needs(live(a), 'Contact is not live'); if (n.ok === false) return n; return s.t < s.quietUntil ? no('We are running quiet') : s.t < s.probeCd ? no('Probe tube is recharging') : !s.mag || s.mag.total <= 0 ? no('Magazine empty') : ok; }
      case 'act:hail': { if (!a) return no('Select a contact first'); if (!['open', 'locked'].includes(a.state)) return no('Contact is not live'); return s.t < s.quietUntil ? no('We are running quiet') : s.t < (s.hailCd || 0) ? no('Channel busy') : ok; }
      case 'act:challenge': { if (!a) return no('Select a contact first'); if (!['open', 'locked'].includes(a.state)) return no('Contact is not live'); return !s.friendly ? no('No friendly transponder expected here') : ['confirmed', 'nofriend', 'plan', 'hostile'].includes(a.idStatus) ? no('Already identified') : s.t < s.quietUntil ? no('We are running quiet') : s.t < s.beamCd ? no('Beam is recharging') : ok; }
      case 'act:rule': return !a ? no('Select a contact first') : a.state !== 'open' ? no(a.state === 'locked' ? 'Locked contacts cannot be ruled out' : 'Contact is not live') : a.idStatus === 'hostile' ? no('A hostile cannot be ruled out') : ok;
      case 'act:refresh': return needs(a && a.state === 'locked', 'Not locked');
      case 'act:quiet': return s.vent.on ? no('Fins are out') : s.t < s.quietCd ? no('Quiet is recharging') : ok;
      case 'fire': { if (!a) return no('Select a contact first'); if (a.state !== 'locked') return no(tag(a) + ' is not locked'); const si = E.solveInfo(s, a); if (!si.ready) return no('No firing solution yet: ' + Math.round(100 * si.prog) + '%'); if (si.stale) return no('Solution is stale: refresh it'); if (s.t < s.quietUntil) return no('We are running quiet'); if (!s.tubes.some(x => s.t >= x)) return no('Tubes are reloading'); if (!s.mag || s.mag.total <= 0) return no('Magazine empty'); return ok; }
      case 'vent': return s.vent.on ? ok : s.sink.h < s.me.ventMin ? no('Sink is below the venting minimum') : ok;
      case 'guard': return ok;
      default: return ok;
    }
  }
  LX.can = can;
  // ---------- orders ----------
  const OLOG = [];
  function toast(t, k) { UI_.toast(t, k); }
  function deny(why) { snd('deny'); toast(why, 'w'); }
  function order(stn, verb, label, data, note) {
    const o = A().order(stn, verb, label, data), m = M(); if (!o) { if (A().handsOnBlocked && A().handsOnBlocked(stn)) toast('CREW BRACED: hands-on orders are blocked at ' + OFF[stn] + '. Stand easy (B) or set the station to Auto.', 'w'); return null; } const hands = modeOf(stn) === 'hands-on';
    if (hands) { o.ackAt = o.execAt = m.now; o.doneAt = m.now + .6; o.instant = true; }
    toast((hands ? 'DIRECT: ' : 'ORDER: ') + (note || label) + (hands ? '' : '  → ' + OFF[stn]), 'g'); return o;
  }
  const speedOf = k => ({ v1: 20, v2: 40, v3: 60, v4: 80, v5: 100, ab: 'Redline' }[k]);
  function run(id) {
    const s = S(), a = selA(), d = a ? { id: a.id } : {}, lab = a ? ' ' + tag(a) : '';
    switch (id) {
      case 'act:classify': order('sensors', 'classify', 'Classify' + lab, d); snd('click'); break;
      case 'act:lock': order('fire', 'track', 'Lock' + lab, d); snd('lock'); break;
      case 'act:ping': order('sensors', 'ping', 'Ping' + lab, d); snd('click'); break;
      case 'act:probe': order('weapons', 'probe', 'Probe' + lab, d); snd('click'); break;
      case 'act:rule': { const id2 = a.id; order('sensors', 'dismiss', 'Rule out' + lab, { id: id2 }); snd('click'); break; }
      case 'act:hail': order('comms', 'hail', 'Hail' + lab, d); snd('click'); break;
      case 'act:challenge': order('comms', 'challenge', 'Challenge' + lab, d); snd('click'); break;
      case 'act:rescan': order('sensors', 'rescan', 'Rescan' + lab, d); snd('click'); break;
      case 'act:refresh': order('fire', 'refresh', 'Refresh solution' + lab, d); snd('click'); break;
      case 'act:mark': order('weapons', 'mark_hostile', 'Mark hostile' + lab, d); snd('click'); break;
      case 'act:quiet': order('sensors', 'quiet', 'Go quiet'); snd('click'); break;
      case 'fire': order('weapons', 'fire', 'Fire' + lab, d); closeGuard(); snd('fire'); C.shake(.3); break;
      case 'pd:active': order('weapons', 'pd_active', 'Go active'); snd('click'); break;
      case 'pd:cold': order('weapons', 'pd_cold', 'Stay cold'); snd('click'); break;
      case 'pd:toggle': return run(s.pd === 'active' ? 'pd:cold' : 'pd:active');
      case 'vent': if (s.vent.on) order('thermal', 'vent_stop', 'Retract fins'); else order('thermal', 'vent', 'Vent now'); snd('click'); break;
      case 'spd:cut': order('thermal', 'cut_thrust', 'Cut thrust'); snd('click'); break;
      case 'spd:ab': order('engineering', 'redline', 'Redline'); snd('click'); break;
      case 'post:still': order('helm', 'still', 'Hold still'); snd('click'); break;
      case 'post:evade': if (s.posture === 'evade') return run('post:still'); order('helm', 'evade', 'Evasive', d); snd('click'); break;
      case 'prio:save_sink': order('damage', 'save_sink', 'Save the sink'); break;
      case 'prio:save_drive': order('damage', 'save_drive', 'Save the drive'); break;
      case 'brace': C.setBrace(C.braceState() === 'free'); snd('click'); toast(C.braceState() === 'free' ? 'BRACE ordered' : 'Standing down from brace', 'w'); break;
      case 'ack': { const n = C.ANN.ackAll(); snd('click'); if (n) toast('Alarms acknowledged'); break; }
      case 'time': { const n = C.tscale === 1 ? 2 : C.tscale === 2 ? 4 : 1; C.setTime(n); toast('Time x' + n); break; }
      case 'call:wait': { const c = topCall(); if (c && c.state === 'raised' && M().standBy(c.id)) { snd('click'); toast(String(c.officer).toUpperCase() + ': standing by, Captain.', 'g'); say(c.officer, 'Standing by, Captain.', 2); } else toast('Nothing to wait on', 'w'); break; }
      case 'sel:next': selStep(1); break;
      case 'nav:scope': case 'nav:contacts': case 'nav:tid': if (window.SHIPNAV) window.SHIPNAV.go(id.slice(4)); break;
      case 'sel:prev': selStep(-1); break;
      case 'guard': toggleGuard(); break;
      default:
        if (/^spd:v\d$/.test(id)) { const k = id.slice(4); order('helm', 'speed', 'Speed ' + speedOf(k) + '%', { speed: k }); snd('click'); }
        else if (id.startsWith('sel:')) select(+id.slice(4));
        else if (/^scope:\d+$/.test(id)) { select(+id.slice(6)); if (window.SHIPNAV) window.SHIPNAV.scope(+id.slice(6)); }
        else if (/^tidgo:\d+$/.test(id)) { select(+id.slice(6)); if (window.SHIPNAV) window.SHIPNAV.go('tid'); }
        else if (/^stgo:\d+$/.test(id)) { const a = S().an[+id.slice(5)]; select(+id.slice(5)); if (window.SHIPNAV) window.SHIPNAV.go(a && a.state === 'locked' ? 'engage' : 'tid'); }   // state column and double-click: the next step for what the contact is now
        else if (/^wfgo:\d+$/.test(id)) { select(+id.slice(5)); if (window.SHIPNAV) window.SHIPNAV.go('waterfall'); }   // bearing, range and age are sensor readings: the scanning panel
        else if (id.startsWith('preset:')) { const p = A().setPreset(id.slice(7)); toast('SALVO PRESET: ' + p.name.toUpperCase() + '  (' + p.pattern + ', cone ' + p.cone + ')', 'g'); snd('toggle'); }
        else if (id.startsWith('auto:')) { const [, k, m] = id.split(':'); M().setAutonomy(k, m); toast(k.toUpperCase() + ': ' + m.toUpperCase() + (m === 'hands-on' ? '  (your orders here are instant)' : ''), m === 'hands-on' ? 'w' : 'g'); snd('toggle'); }
        else if (id.startsWith('ans:')) { const [, cid, i] = id.split(':'); const o = M().answer(+cid, +i); if (o) snd('click'); }
        else if (id.startsWith('callopt:')) { const c = topCall(); if (c) { const o = M().answer(c.id, +id.slice(8)); if (o) snd('click'); } }
    }
    return { ok: true };
  }
  function activate(id, opt) {
    opt = opt || {};
    if (/^sel:\d+$/.test(id)) { const t = now(), last = LX.lastSel; LX.lastSel = { id, t }; if (last && last.id === id && t - last.t < 450) { LX.lastSel = null; return activate('stgo:' + id.slice(4), opt); } }   // double-click a contact row: the next step for it
    if (id.startsWith('nav:') && window.NAVUI) { window.CTL_ORDER = order; window.CTL_TOAST = toast; return window.NAVUI.act(id, opt); }
    if (id === 'fire' && !LX.guardUp) { openGuard(); return { ok: true, armed: true }; }
    const c = can(id); if (c.ok === false) { deny(c.why); return c; }
    if (id === 'fire') return run('fire');
    if (GUARDED(id) && !opt.armed) { const t = now(); if ((LX.armed[id] || 0) > t) { delete LX.armed[id]; } else { LX.armed[id] = t + 3000; snd('guard'); toast('ARMED: press again to confirm ' + (DESC[id] ? DESC[id][0] : ''), 'w'); return { ok: true, armed: true }; } }
    return run(id);
  }
  // ---------- guards ----------
  let guardT = 0; const tgUp = {};
  function openGuard() { LX.guardUp = true; guardT = now() + 12000; snd('guard'); }
  function closeGuard() { LX.guardUp = false; }
  function toggleGuard() { if (LX.guardUp) { closeGuard(); snd('guard'); } else openGuard(); }
  // ---------- hardware tables ----------
  function topCall() { const p = M().pending(); return p.find(x => x.pri >= 3) || p[0] || null; }
  window.CTL = { activate, can, run, select, selStep, DESC, topCall };
};
