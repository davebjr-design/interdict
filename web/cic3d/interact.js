/* Hands-on interaction for the 3D CIC: raycast hotspots (hardware, CRT regions, annunciator, hologram blips, benches), the action dispatcher that maps every
 * control to a station-adapter order, hover tooltips, the order bar, radial menu, keyboard, and the per-station Auto / Supervised / Hands-on switch.
 * Rule: a control on a station the crew run (AUTO / SUPERVISED) is an ORDER to that officer (adapter order, spoken, acked after the officer's reaction time);
 * on a HANDS-ON station it is direct (the order is fast-forwarded so it executes on the next tick). Verbs the adapter has no case for yet
 * (rule out, set speed, hold still, retract fins) run through a small local queue with the same delay (TODO: adapter verbs set_speed / set_posture / dismiss / stop_vent).
 * Requires cic3d.js (CIC), live_screens.js (LS), ui.js (UI); audio.js (AUD) is optional. */
'use strict';
(function () {
  const C = CIC, E = C.E, LX = LS.ctx, TH = C.THREE, UI_ = window.UI, snd = n => { try { window.AUD && AUD.play(n); } catch (e) { } }, say = (w, t, p) => { try { window.AUD && AUD.say(w, t, p); } catch (e) { } };
  const S = () => C.S, A = () => C.A, M = () => C.A.model, OFF = Stations.OFFICER;
  const selA = () => { const s = S(); const a = LX.sel != null ? s.an[LX.sel] : null; return a && a.state !== 'out' ? a : null; };
  const tag = a => 'S' + (a.id + 1), live = a => a && (a.state === 'open' || a.state === 'locked') && a.idStatus !== 'plan';
  const modeOf = k => M().autonomy[k], now = () => performance.now();
  // ---------- selection ----------
  function select(id) { if (id == null || !S().an[id] || S().an[id].state === 'out') return; if (LX.sel !== id) snd('tick'); LX.sel = id; }
  function selStep(d) { const l = S().an.filter(a => a.state !== 'out'); if (!l.length) return; let i = l.findIndex(a => a.id === LX.sel); i = i < 0 ? 0 : (i + d + l.length) % l.length; select(l[i].id); }
  // ---------- which station handles which action ----------
  const ST = { 'act:classify': 'sensors', 'act:lock': 'fire', 'act:ping': 'sensors', 'act:probe': 'weapons', 'act:rule': 'sensors', 'act:rescan': 'sensors', 'act:refresh': 'fire', 'act:mark': 'weapons', 'act:quiet': 'sensors', fire: 'weapons', 'pd:active': 'weapons', 'pd:cold': 'weapons', 'pd:toggle': 'weapons', vent: 'thermal', 'spd:cut': 'thermal', 'spd:ab': 'engineering', 'post:still': 'helm', 'post:evade': 'helm', 'prio:save_sink': 'damage', 'prio:save_drive': 'damage' };
  ['v1', 'v2', 'v3', 'v4', 'v5'].forEach(k => ST['spd:' + k] = 'helm');
  const DESC = { 'act:classify': ['CLASSIFY', 'Put every analyst on the selected contact. Heat, reactor and eclipse readings firm up.'], 'act:lock': ['LOCK / TRACK', 'Lock the selected contact and start a firing solution (locking a decoy wastes time and draws a chase). On a locked contact: put an analyst on it, the solution needs eyes.'], 'act:ping': ['ACTIVE PING', 'A crisp fix on the selected contact. Everything within reach hears it, and a warship learns where we are. Guarded.'], 'act:probe': ['PROBE SALVO', 'A feint: two real missiles at the contact\'s position, no ping. Watch who lights up.'], 'act:rule': ['RULE OUT', 'Dismiss the selected contact as junk. Ruling out a real ship loses it. Guarded.'], 'act:rescan': ['RESCAN', 'Put an analyst back on the selected contact.'], 'act:refresh': ['REFRESH SOLUTION', 'Rebuild a stale firing solution on the locked contact.'], 'act:mark': ['MARK HOSTILE', 'Mark the contact as a confirmed hostile (red).'], 'act:quiet': ['GO QUIET', 'Sensors dark and no launches for a while: slows how fast anyone finds us.'], fire: ['FIRE SALVO', 'Launch the current salvo preset at the selected, locked contact. Lift the guard first.'], 'pd:active': ['POINT DEFENCE ACTIVE', 'Radars lit. A visibility event: everything can see us. Only when a vampire is inbound.'], 'pd:cold': ['POINT DEFENCE ARMED', 'Armed and cold: slow to react, nearly silent.'], 'pd:toggle': ['POINT DEFENCE', 'Switch between armed (cold) and active (radars lit). Guarded.'], vent: ['VENT HEAT', 'Fins out: dump heat from the sink. We are fully visible until they retract.'], 'spd:cut': ['CUT THRUST', 'Drop the drive down a notch (or end a redline burn).'], 'spd:ab': ['REDLINE', 'Far faster, but the sink fills in seconds. Short bursts only. Guarded.'], 'post:still': ['HOLD STILL', 'Drive off: the quietest we can be.'], 'post:evade': ['EVASIVE', 'Weave: analysts read ~10% faster, but we are about 20% louder.'], brace: ['BRACE', 'Strap in. Any hard burn or incoming impact needs the crew secure.'], 'prio:save_sink': ['SAVE THE SINK', 'Damage control repairs the heat sink first.'], 'prio:save_drive': ['SAVE THE DRIVE', 'Damage control repairs the drive first.'] };
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
  const OLOG = [], later = [];
  function toast(t, k) { UI_.toast(t, k); }
  function deny(why) { snd('deny'); toast(why, 'w'); }
  function order(stn, verb, label, data, note) {
    const o = A().order(stn, verb, label, data), m = M(); if (!o) { if (A().handsOnBlocked && A().handsOnBlocked(stn)) toast('CREW BRACED: hands-on orders are blocked at ' + OFF[stn] + '. Stand easy (B) or set the station to Auto.', 'w'); return null; } const hands = modeOf(stn) === 'hands-on';
    if (hands) { o.ackAt = o.execAt = m.now; o.doneAt = m.now + .6; o.instant = true; }
    toast((hands ? 'DIRECT: ' : 'ORDER: ') + (note || label) + (hands ? '' : '  → ' + OFF[stn]), 'g'); return o;
  }
  function custom(stn, label, fn) {   // a control the adapter has no verb for yet
    const m = M(), hands = modeOf(stn) === 'hands-on'; if (hands) { fn(); toast('DIRECT: ' + label, 'g'); return; }
    const react = 1.0 + Math.random() * .8; later.push({ at: m.now + react, fn, label, officer: OFF[stn] }); toast('ORDER: ' + label + '  → ' + OFF[stn], 'g'); say('Captain', Stations.captainLine(label), 3);
  }
  const speedOf = k => ({ v1: 20, v2: 40, v3: 60, v4: 80, v5: 100, ab: 'Redline' }[k]);
  function run(id) {
    const s = S(), a = selA(), d = a ? { id: a.id } : {}, lab = a ? ' ' + tag(a) : '';
    switch (id) {
      case 'act:classify': order('sensors', 'classify', 'Classify' + lab, d); snd('click'); break;
      case 'act:lock': order('fire', 'track', 'Lock' + lab, d); snd('lock'); break;
      case 'act:ping': order('sensors', 'ping', 'Ping' + lab, d); snd('click'); break;
      case 'act:probe': order('weapons', 'probe', 'Probe' + lab, d); snd('click'); break;
      case 'act:rule': { const id2 = a.id; custom('sensors', 'Rule out' + lab, () => E.dismissContact(S(), id2)); snd('click'); break; }
      case 'act:rescan': order('sensors', 'rescan', 'Rescan' + lab, d); snd('click'); break;
      case 'act:refresh': order('fire', 'refresh', 'Refresh solution' + lab, d); snd('click'); break;
      case 'act:mark': order('weapons', 'mark_hostile', 'Mark hostile' + lab, d); snd('click'); break;
      case 'act:quiet': order('sensors', 'quiet', 'Go quiet'); snd('click'); break;
      case 'fire': order('weapons', 'fire', 'Fire' + lab, d); closeGuard(); snd('fire'); C.shake(.3); break;
      case 'pd:active': order('weapons', 'pd_active', 'Go active'); snd('click'); break;
      case 'pd:cold': order('weapons', 'pd_cold', 'Stay cold'); snd('click'); break;
      case 'pd:toggle': return run(s.pd === 'active' ? 'pd:cold' : 'pd:active');
      case 'vent': if (s.vent.on) custom('thermal', 'Retract fins', () => E.stopVent(S())); else order('thermal', 'vent', 'Vent now'); snd('click'); break;
      case 'spd:cut': order('thermal', 'cut_thrust', 'Cut thrust'); snd('click'); break;
      case 'spd:ab': order('engineering', 'redline', 'Redline'); snd('click'); break;
      case 'post:still': custom('helm', 'Hold still', () => E.setOrder(S(), 'still', null)); snd('click'); break;
      case 'post:evade': if (s.posture === 'evade') return run('post:still'); order('helm', 'evade', 'Evasive', d); snd('click'); break;
      case 'prio:save_sink': order('damage', 'save_sink', 'Save the sink'); break;
      case 'prio:save_drive': order('damage', 'save_drive', 'Save the drive'); break;
      case 'brace': C.setBrace(C.braceState() === 'free'); snd('click'); toast(C.braceState() === 'free' ? 'BRACE ordered' : 'Standing down from brace', 'w'); break;
      case 'ack': { const n = C.ANN.ackAll(); snd('click'); if (n) toast('Alarms acknowledged'); break; }
      case 'time': { const n = C.tscale === 1 ? 2 : C.tscale === 2 ? 4 : 1; C.setTime(n); toast('Time x' + n); break; }
      case 'sel:next': selStep(1); break;
      case 'sel:prev': selStep(-1); break;
      case 'guard': toggleGuard(); break;
      default:
        if (/^spd:v\d$/.test(id)) { const k = id.slice(4); custom('helm', 'Speed ' + speedOf(k) + '%', () => E.setSpeed(S(), k)); snd('click'); }
        else if (id.startsWith('sel:')) select(+id.slice(4));
        else if (id.startsWith('preset:')) { const p = A().setPreset(id.slice(7)); toast('SALVO PRESET: ' + p.name.toUpperCase() + '  (' + p.pattern + ', cone ' + p.cone + ')', 'g'); snd('toggle'); }
        else if (id.startsWith('auto:')) { const [, k, m] = id.split(':'); M().setAutonomy(k, m); toast(k.toUpperCase() + ': ' + m.toUpperCase() + (m === 'hands-on' ? '  (your orders here are instant)' : ''), m === 'hands-on' ? 'w' : 'g'); snd('toggle'); }
        else if (id.startsWith('ans:')) { const [, cid, i] = id.split(':'); const o = M().answer(+cid, +i); if (o) snd('click'); }
        else if (id.startsWith('callopt:')) { const c = topCall(); if (c) { const o = M().answer(c.id, +id.slice(8)); if (o) snd('click'); } }
    }
    return { ok: true };
  }
  function activate(id, opt) {
    opt = opt || {};
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
  const TG = {
    'sensors.tg': ['act:classify', 'act:rule', 'act:ping', 'act:quiet', 'act:rescan', 'sel:next'],
    'attack.tg': ['act:probe', 'pd:toggle', 'act:lock', 'act:refresh', 'act:mark'],
    'systems.tg': ['vent', 'spd:cut', 'post:still', 'spd:ab', 'post:evade', 'brace'] };
  const TGGUARD = { 'sensors.tg': { 1: 1, 2: 1 }, 'attack.tg': { 1: 1 }, 'systems.tg': { 0: 1, 3: 1 } };
  DESC['sel:next'] = ['NEXT CONTACT', 'Step the selection to the next live contact (Tab).'];
  const GROUP = { 'sensors.auto': ['sensors'], 'attack.auto': ['fire', 'weapons', 'helm'], 'systems.auto': ['engineering', 'thermal', 'damage', 'comms'] };
  const MODES = ['auto', 'supervised', 'hands-on'];
  const ROT = {
    'attack.preset': { n: 4, get: () => Math.max(0, A().presets.ids.indexOf(A().salvo.id)), set: i => activate('preset:' + A().presets.ids[i]), lab: () => ['SALVO', A().salvo.name.toUpperCase()], t: 'SALVO PRESET', d: 'Pattern, spread and homing for the next FIRE. Click = next, right-click = previous.' },
    'systems.speed': { n: 5, get: () => { const k = S().speed; return k === 'ab' ? 4 : Math.max(0, ['v1', 'v2', 'v3', 'v4', 'v5'].indexOf(k)); }, set: i => activate('spd:v' + (i + 1)), lab: () => ['SPEED', S().speed === 'ab' ? 'REDLINE' : speedOf(S().speed) + '%'], t: 'DRIVE SPEED', d: 'Engine speed. Faster is louder and hotter. Redline is the guarded toggle.' },
    'systems.time': { n: 3, get: () => [1, 2, 4].indexOf(C.tscale), set: i => { C.setTime([1, 2, 4][i]); }, lab: () => ['TIME', 'x' + C.tscale], t: 'TIME COMPRESSION', d: 'Run the hunt faster through quiet stretches (T).' } };
  for (const k in GROUP) ROT[k] = { n: 3, get: () => MODES.indexOf(modeOf(GROUP[k][0])), set: i => GROUP[k].forEach(st => { M().setAutonomy(st, MODES[i]); }), lab: () => ['CREW', modeOf(GROUP[k][0]) === 'hands-on' ? 'HANDS-ON' : modeOf(GROUP[k][0]).toUpperCase()], t: 'WHO IS DRIVING', d: 'Auto: the crew run it. Supervised: they propose, you approve. Hands-on: you do it, instantly.', after: i => { toast(GROUP[k].join(' / ').toUpperCase() + ': ' + MODES[i].toUpperCase(), i === 2 ? 'w' : 'g'); } };
  ['sensors.rot1', 'sensors.rot2', 'attack.rot2'].forEach(k => { let v = 0; ROT[k] = { n: 5, get: () => v, set: i => { v = i; }, lab: () => [HW(k).userData.title, 'n/a'], t: HW(k).userData.title, d: 'Not simulated yet.', deco: true }; });
  function HW(name) { return C.HW[name].children[0]; }
  const GAUGE = { 'sensors.g0': () => ['SINK', Math.round(S().sink.h * 100) + '% of capacity. Venting sheds it.'], 'sensors.g1': () => ['SENSOR EFFICIENCY', Math.round(100 * (S().sysEff || 1)) + '%'], 'attack.g0': () => ['HULL', Math.round(S().hull) + '%'], 'attack.g1': () => ['MAGAZINE', (S().mag ? S().mag.total : 0) + ' of 60 missiles'], 'systems.g0': () => ['HEAT SINK', Math.round(S().sink.h * 100) + '%'], 'systems.g1': () => ['VENT', S().vent.on ? 'fins out' : 'fins in'] };
  // ---------- pick (raycast) ----------
  const ray = new TH.Raycaster(), mouse = new TH.Vector2(), tmp = new TH.Vector3(); let targets = [], mdirty = false, mx = 0, my = 0, hover = null, rclick = false;
  function gather() { targets.length = 0; C.scene.traverse(o => { const u = o.userData; if (u && (u.part || u.nav || u.screenPlane || u.annPlane || u.contact !== undefined)) targets.push(o); }); }
  function hwRoot(o) { while (o && !(o.userData && o.userData.hw)) o = o.parent; return o; }
  function pick() {
    mouse.set(mx / innerWidth * 2 - 1, -(my / innerHeight) * 2 + 1); ray.setFromCamera(mouse, C.cam); const hs = ray.intersectObjects(targets, false); let nav = null;
    for (const h of hs) { const o = h.object, u = o.userData;
      if (u.nav) { if (!nav) nav = { kind: 'nav', name: u.nav }; continue; }
      if (u.contact !== undefined) { const b = C.blips[u.contact]; if (!b || !b.visible) continue; return { kind: 'blip', i: u.contact, a: S().an[u.contact] }; }
      if (u.screenPlane) { const sc = u.scr; if (!sc) continue; const x = h.uv.x * LS.W, y = (1 - h.uv.y) * LS.H; return { kind: 'scr', name: sc, sec: u.sec, idx: u.idx, x, y, reg: LS.hit(sc, x, y) }; }
      if (u.annPlane) { const x = h.uv.x * 1536, y = (1 - h.uv.y) * 220, t = C.annTiles.find(q => x >= q.x && x <= q.x + q.w && y >= q.y && y <= q.y + q.h); return { kind: 'ann', tile: t || null }; }
      if (u.part) { const r = hwRoot(o); if (!r) continue; const name = r.userData.hw; let part = u.part;
        if (/^t\d$/.test(part)) { const i = +part[1], gu = TGGUARD[name] && TGGUARD[name][i]; if (gu && !(tgUp[name + i] > now())) part = 'g' + i; }   // lever under a closed guard: the guard takes the click
        return { kind: 'hw', name, part, obj: o, point: h.point }; } }
    return nav;
  }
  // ---------- hover tooltips ----------
  const routeNote = id => { const st = ST[id]; if (!st) return ''; const m = modeOf(st); return m === 'hands-on' ? 'HANDS-ON: instant' : 'via ' + OFF[st] + ' (' + m.toUpperCase() + '): acked in about 1-2 s'; };
  function actTip(id) { const c = can(id), d = DESC[id] || [id, '']; return { t: d[0], d: d[1], w: c.ok === false ? c.why : '', k: routeNote(id) + (GUARDED(id) ? ' · press twice' : '') }; }
  function describe(p) {
    if (!p) return null;
    if (p.kind === 'nav') { const k = { sensors: 'F2', attack: 'F3', systems: 'F4' }[p.name]; return { t: p.name.toUpperCase() + ' STATION', d: 'Click to go there (' + k + '). ' + (p.name === 'sensors' ? 'Quill: contacts, classify, ping.' : p.name === 'attack' ? 'Abara: lock, solution, salvo, point defence.' : 'Engineering, thermal, damage, command net.'), k: 'Crew: ' + (p.name === 'sensors' ? modeOf('sensors') : p.name === 'attack' ? modeOf('weapons') : modeOf('thermal')).toUpperCase() }; }
    if (p.kind === 'blip') { const a = p.a, st = LS.style(a), r = LS.rel(a); return { t: tag(a) + '  ' + st.lab, d: 'Bearing ' + String(Math.round(r.brg)).padStart(3, '0') + ', range ' + Math.round(r.rng) + 'k. Click to select, right-click for orders.' }; }
    if (p.kind === 'ann') { if (!p.tile) return { t: 'ANNUNCIATOR', d: 'Ship alert lamps. Click a lit lamp to acknowledge it and go to its station.' }; const q = p.tile.tile, L = C.annOut && C.annOut.lamps[q.id]; return { t: q.label + ' · ' + (L ? L.state.toUpperCase() : 'OFF'), d: q.tip, s: L && L.why ? L.why : '', k: q.key + ' · click: acknowledge and go' }; }
    if (p.kind === 'scr') { if (p.reg) { const id = p.reg.id; if (DESC[id]) return actTip(id); if (id.startsWith('sel:')) { const a = S().an[+id.slice(4)], st = LS.style(a); return { t: tag(a) + '  ' + st.lab, d: 'Click to select. Right-click for orders.' }; } if (id.startsWith('auto:')) { const [, k, m] = id.split(':'); return { t: k.toUpperCase() + ' · ' + m.toUpperCase(), d: p.reg.tip }; } if (id.startsWith('preset:')) return { t: id.slice(7).toUpperCase() + ' PRESET', d: p.reg.tip }; if (id === 'guard') return { t: 'FIRE GUARD', d: 'Lift the guard, then press FIRE.', k: 'G' }; return { t: id.toUpperCase(), d: p.reg.tip }; }
      return C.view === 'screen' ? null : { t: C.SCRN[p.sec][p.idx], d: 'Click to zoom in (' + 'QWE'[p.idx] + ').' }; }
    if (p.kind === 'hw') return hwTip(p);
    return null;
  }
  function hwTip(p) {
    const n = p.name, u = HW(n).userData, part = p.part;
    if (n.endsWith('.tg')) { const i = +part.slice(1), id = TG[n][i]; if (part[0] === 'g') return { t: 'GUARD', d: 'Lift to expose ' + (DESC[id] ? DESC[id][0] : id) + '.' }; const t = actTip(id); const lt = latch(id); if (lt !== undefined) t.s = lt ? 'ON' : 'OFF'; return t; }
    if (n === 'attack.fire') { const t = actTip('fire'); if (part === 'guard') return { t: 'FIRE GUARD', d: LX.guardUp ? 'Click to close the guard.' : 'Click to lift the guard.', k: 'G' }; return LX.guardUp ? t : { t: 'FIRE', d: 'Lift the guard first.' }; }
    if (ROT[n]) { const r = ROT[n], l = r.lab(); return { t: r.t, d: r.d, s: l[0] + ': ' + l[1], k: 'click = next · right-click = previous' }; }
    if (GAUGE[n]) { const g = GAUGE[n](); return { t: g[0], d: g[1] }; }
    if (n === 'sensors.ball') return { t: 'TRACKBALL', d: 'Step through contacts. Click = next, right-click = previous.', s: LX.sel != null ? 'Selected ' + 'S' + (LX.sel + 1) : '' };
    if (n === 'attack.stick') return { t: 'TARGET STICK', d: 'Click left of centre for the previous contact, right for the next.' };
    if (n.endsWith('.pad')) return { t: 'KEYPAD', d: 'Not simulated yet. Use Tab, the contact list, or the hologram to select.' };
    return { t: n, d: '' };
  }
  // ---------- hardware clicks ----------
  const flick = {}, knobAng = {}, gAngle = new Map();
  function hwClick(p, right) {
    const n = p.name, part = p.part, o = C.HW[n];
    if (n.endsWith('.tg')) { const i = +part.slice(1), id = TG[n][i], g = TGGUARD[n] && TGGUARD[n][i];
      if (part[0] === 'g') { tgUp[n + i] = tgUp[n + i] > now() ? 0 : now() + 6000; snd('guard'); return; }
      const r = activate(id, { armed: !!g }); flick[n + i] = now() + 260; snd('toggle'); if (g && r && r.ok !== false) tgUp[n + i] = 0; return; }
    if (n === 'attack.fire') { if (part === 'guard') toggleGuard(); else if (!LX.guardUp) { deny('Lift the guard first'); } else activate('fire'); return; }
    if (ROT[n]) { const r = ROT[n], i = (r.get() + (right ? -1 : 1) + r.n) % r.n; r.set(i); if (r.after) r.after(i); snd('toggle'); return; }
    if (n === 'sensors.ball') { selStep(right ? -1 : 1); const b = HW(n).userData.ball; if (b) b.rotation.x += .6; return; }
    if (n === 'attack.stick') { const lp = o.worldToLocal(tmp.copy(p.point)); selStep(right || lp.x < 0 ? -1 : 1); snd('tick'); return; }
    snd('tick');
  }
  function annClick(p) { if (!p.tile) return; if (p.tile.id) { C.ANN.ack(p.tile.id); const g = p.tile.tile.st; const sec = g === 'sen' ? 'sensors' : g === 'fc' || g === 'wpn' ? 'attack' : 'systems'; C.go(sec); snd('click'); } }
  // ---------- radial menu ----------
  let radialOpen = false;
  function openRadial(x, y) { const a = selA(); if (!a) return; const mk = (id, label) => ({ id, label, off: can(id).ok === false });
    const items = [mk('act:classify', 'CLASSIFY'), mk('act:lock', 'LOCK'), mk('act:ping', 'PING'), mk('act:probe', 'PROBE'), mk('act:rule', 'RULE OUT'), mk('fire', LX.guardUp ? 'FIRE' : 'ARM FIRE')]; items.title = tag(a); UI_.tip(false); UI_.radial(true, x, y, items); radialOpen = true; snd('tick'); }
  function closeRadial() { if (radialOpen) { UI_.radial(false); radialOpen = false; } }
  // ---------- pointer ----------
  const cv = C.R.domElement;
  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; mdirty = e.target === cv; if (e.target !== cv && e.target.id !== 'obar' && !e.target.closest('#obar')) { UI_.tip(false); setHover(null); } });
  function setHover(h) { const hv = h && h.kind === 'scr' && h.reg ? { scr: h.name, id: h.reg.id } : { scr: null, id: null }; if (hv.scr !== LX.hover.scr || hv.id !== LX.hover.id) { const was = LX.hover.scr; LX.hover = hv; if (was) C.SCR[was].paint(now()); if (hv.scr) C.SCR[hv.scr].paint(now()); } hover = h; cv.style.cursor = h && (h.kind === 'hw' || h.kind === 'blip' || h.kind === 'ann' || (h.kind === 'scr' && h.reg) || h.kind === 'nav' || h.kind === 'scr') ? 'pointer' : 'default'; }
  cv.addEventListener('click', e => { closeRadial(); mx = e.clientX; my = e.clientY; const p = pick(); handle(p, false, e); });
  cv.addEventListener('contextmenu', e => { e.preventDefault(); mx = e.clientX; my = e.clientY; const p = pick(); handle(p, true, e); });
  function handle(p, right, e) {
    if (!p) { if (right) C.out(); return; }
    if (p.kind === 'nav') { if (C.view === 'room') C.go(p.name); return; }
    if (p.kind === 'blip') { select(p.i); if (right) openRadial(e.clientX, e.clientY); return; }
    if (p.kind === 'ann') { annClick(p); return; }
    if (p.kind === 'hw') { hwClick(p, right); return; }
    if (p.kind === 'scr') {
      if (C.view === 'room') { C.go(p.sec); return; }
      if (p.reg) { const id = p.reg.id; if (right && id.startsWith('sel:')) { select(+id.slice(4)); openRadial(e.clientX, e.clientY); return; } if (id.startsWith('sel:')) { select(+id.slice(4)); return; } activate(id); return; }
      if (right) { C.out(); return; } if (C.view === 'section') C.go(p.sec, p.idx); }
  }
  addEventListener('wheel', e => { if (e.target !== cv) return; if (e.deltaY > 0) C.out(); else if (C.view === 'room') C.go('sensors'); else if (C.view === 'section') C.go(C.sec, 1); }, { passive: true });
  // ---------- keyboard ----------
  const KEY = { c: 'act:classify', l: 'act:lock', p: 'act:ping', o: 'act:probe', x: 'act:rule', r: 'act:refresh', m: 'act:mark', u: 'act:quiet', d: 'pd:toggle', v: 'vent', h: 'post:still', z: 'post:evade' };
  function topCall() { const p = M().pending(); return p.find(x => x.pri >= 3) || p[0] || null; }
  addEventListener('keydown', e => { if (e.ctrlKey || e.metaKey || e.altKey) return; const k = e.key, lk = k.toLowerCase();
    if (/^F[1-4]$/.test(k)) { e.preventDefault(); closeRadial(); C.go(['room', 'sensors', 'attack', 'systems'][+k[1] - 1]); }
    else if ((lk === 'q' || lk === 'w' || lk === 'e') && C.sec) C.go(C.sec, 'qwe'.indexOf(lk)); else if (k === 'Escape') { if (radialOpen) closeRadial(); else C.out(); }
    else if (lk === 'b') activate('brace'); else if (lk === 't') activate('time'); else if (k === ' ') { e.preventDefault(); activate('ack'); }
    else if (k === 'Backspace') { e.preventDefault(); const c = topCall(); if (c) { const ok = M().standBy(c.id); toast(ok ? OFF_N(c) + ': STANDING BY' : 'Cannot stand by on this call'); if (ok) say(c.officer, 'Standing by.', 2); } }
    else if (/^[1-3]$/.test(k) && topCall() && topCall().opts && topCall().opts[+k - 1]) { activate('callopt:' + (+k - 1)); }
    else if (k === 'Tab') { e.preventDefault(); selStep(e.shiftKey ? -1 : 1); }
    else if (lk === 'f') activate('fire'); else if (lk === 'g') activate('guard');
    else if (k === '[' || k === ']') { const L = ['v1', 'v2', 'v3', 'v4', 'v5'], i = Math.max(0, L.indexOf(S().speed)); const j = Math.max(0, Math.min(4, i + (k === ']' ? 1 : -1))); activate('spd:' + L[j]); }
    else if (lk === 'k') { if (window.AUD) { AUD.mute(!AUD.muted); toast(AUD.muted ? 'MUTED' : 'SOUND ON'); } }
    else if (k === '?') document.getElementById('keysb').click();
    else if (KEY[lk]) activate(KEY[lk]); });
  const OFF_N = c => String(c.officer).toUpperCase();
  UI_.onAct = id => { if (id === 'ack') run('ack'); else activate(id); };
  UI_.onAuto = (k, m) => activate('auto:' + k + ':' + m);
  // ---------- adapter events: voice, toasts ----------
  C.on('events', evs => { for (const ev of evs) {
    if (ev.type === 'raise') { const c = ev.call; say(c.officer, c.line, c.pri); snd(c.pri >= 4 ? 'klaxon' : c.pri === 3 ? 'caution' : 'chime'); if (c.pri >= 3) toast(String(c.officer).toUpperCase() + ': ' + c.line, c.pri >= 4 ? 'e' : 'w'); }
    else if (ev.type === 'order' && ev.order.by === 'co' && !ev.order.instant) { if (ev.stage === 'issued') say('Captain', Stations.captainLine(ev.order.label), 3); else if (ev.stage === 'acked') say(ev.order.officer, Stations.ackLine(ev.order.label), 3); }
    else if (ev.type === 'default') { const c = ev.call, o = c.opts && c.opts[c.choice]; toast(OFF_N(c) + ': no answer, crew default' + (o ? ': ' + o.label : ''), 'w'); if (o) say(c.officer, Stations.ackLine(o.label), 2); }
    else if (ev.type === 'noop') toast('NOT YET SIMULATED: ' + ev.order.label, 'w');
    else if (ev.type === 'executed' && !ev.ok && ev.order.by === 'co') toast(OFF_N(ev.order) + ': unable (' + ev.order.label + ')', 'e'); } });
  // ---------- per-frame: pick, guards, latching switches, bars ----------
  let obT = 0, hudT = 0, lastCall = null;
  const SEC_TITLE = () => C.tier;
  C.on('begin', () => { LX.armed = {}; LX.guardUp = false; later.length = 0; });
  C.on('view', v => { closeRadial(); UI_.tip(false); });
  function buildBar() {
    const a = selA(), st = a ? LS.style(a) : null, r = a ? LS.rel(a) : null, B = (id, label, key, cls, o) => { const c = can(id); o = o || {}; return { id, label, key, cls, off: c.ok === false, on: !!o.on, armed: !!o.armed || (LX.armed[id] || 0) > now(), confirm: o.confirm, tip: c.ok === false ? c.why : (DESC[id] ? DESC[id][1] : '') }; };
    return { sum: a ? tag(a) + ' · <span style="color:' + st.col + '">' + st.lab + '</span> <em>BRG ' + String(Math.round(r.brg)).padStart(3, '0') + '° · RNG ' + Math.round(r.rng) + 'k · Tab: next contact · right-click a contact for the radial menu</em>' : 'NO CONTACT SELECTED <em>click one on a screen or the hologram, or press Tab</em>',
      contact: [B('act:classify', 'CLASSIFY', 'C', 'c1'), B('act:lock', a && a.state === 'locked' ? 'TRACK' : 'LOCK', 'L', 'c2'), B('act:ping', 'PING', 'P', 'c2', { confirm: 'CONFIRM' }), B('act:probe', 'PROBE', 'O', 'c1'), B('act:rule', 'RULE OUT', 'X', '', { confirm: 'CONFIRM' }), Object.assign(B('fire', LX.guardUp ? 'FIRE' : 'LIFT GUARD', 'F', 'c3', { armed: LX.guardUp, confirm: 'FIRE' }), { off: can('fire').ok === false && LX.guardUp, tip: can('fire').ok === false ? can('fire').why : 'Lift the guard, then press FIRE' })],
      global: [B('pd:toggle', S().pd === 'active' ? 'PD ACTIVE' : 'PD COLD', 'D', 'c4', { on: S().pd === 'active' }), B('vent', S().vent.on ? 'RETRACT' : 'VENT', 'V', 'c4', { on: S().vent.on, confirm: 'CONFIRM' }), B('post:still', 'STILL', 'H', 'c4', { on: S().posture === 'still' }), B('post:evade', 'EVADE', 'Z', 'c4', { on: S().posture === 'evade' }), B('act:quiet', 'QUIET', 'U', 'c4', { on: S().t < S().quietUntil }), B('brace', 'BRACE', 'B', 'c3', { on: C.braceState() !== 'free' })] };
  }
  C.on('frame', (dt, t) => { const s = S(), tNow = now();
    if (!gather.done || t - gather.t > 3) { gather(); gather.done = true; gather.t = t; }
    if (mdirty) { mdirty = false; if (!radialOpen) { const p = pick(); setHover(p); const d = describe(p); if (d) UI_.tip(true, mx, my, d); else UI_.tip(false); } }
    // custom later-queue (model time)
    for (let i = later.length - 1; i >= 0; i--) if (M().now >= later[i].at) { const q = later.splice(i, 1)[0]; try { q.fn(); } catch (e) { console.error(e); } say(q.officer, 'Aye. ' + q.label + '.', 3); }
    if (LX.guardUp && tNow > guardT) closeGuard();
    for (const k in LX.armed) if (LX.armed[k] < tNow) delete LX.armed[k];
    // fire box guard + toggle guards + lever states + rotary labels
    { const fb = HW('attack.fire').userData; if (fb.guardPivot) { const cur = fb.guardPivot.rotation.x, tg = LX.guardUp ? -1.35 : 0; fb.guardPivot.rotation.x = cur + (tg - cur) * Math.min(1, dt * 12); } }
    for (const n in TG) { const u = HW(n).userData; TG[n].forEach((id, i) => { const l = latch(id), f = flick[n + i] > tNow; if (u.set) u.set(i, l !== undefined ? l : f); if (u.grd[i]) { const pv = u.grd[i], tg = tgUp[n + i] > tNow ? -1.35 : 0; pv.rotation.x += (tg - pv.rotation.x) * Math.min(1, dt * 12); } }); }
    for (const n in ROT) { const r = ROT[n], u = HW(n).userData, i = r.get(), a = -(-1.1 + i * 2.2 / (r.n - 1)), kn = u.knob; kn.rotation.y += (a - kn.rotation.y) * Math.min(1, dt * 10); const l = r.lab(), key = l.join('|'); if (u.lastLab !== key) { u.lastLab = key; u.setLabel(l[0], l[1]); } }
    // bars and overlays
    if (tNow - obT > 160) { obT = tNow; UI_.obar(buildBar()); UI_.auto(M().autonomy); const ao = C.annOut; if (ao) UI_.master(ao.master.warning, ao.master.caution);
      const c = topCall(); if (c) { const frac = c.expiresAt != null && c.route !== 'player' ? Math.max(0, Math.min(1, (c.expiresAt - M().now) / Math.max(.1, c.expiresAt - c.raisedAt))) : 0; UI_.call(c, { def: M().defaultIndex(c), frac }); } else UI_.call(null); }
    if (tNow - hudT > 300) { hudT = tNow; const tm = Math.round(s.t * 60), over = s.over ? (typeof s.over === 'string' ? s.over : (s.over.why || s.over.text || 'ended')) : ''; UI_.hud({ title: C.view === 'room' ? 'ROOM' : C.tier, t: Math.floor(tm / 60) + ':' + String(tm % 60).padStart(2, '0'), hull: Math.round(s.hull), sink: Math.round(s.sink.h * 100), mag: s.mag ? s.mag.total : '--', ts: C.tscale, brace: C.braceState(), over, line2: 'SEL ' + (selA() ? tag(selA()) : '--') + ' · PRESET ' + A().salvo.name.toUpperCase() + ' · PD ' + String(s.pd).toUpperCase() }); }
    UI_.flash(C.flashA); });
  // test helpers: pixel position of a CRT canvas point / a hardware part
  const _v = new TH.Vector3();
  function toPx(v) { v.project(C.cam); return { x: Math.round((v.x + 1) / 2 * innerWidth), y: Math.round((1 - v.y) / 2 * innerHeight), vis: v.z < 1 }; }
  C.screenPx = (name, x, y) => { const m = C.SCRMESH[name], g = m.geometry.parameters; m.updateWorldMatrix(true, false); _v.set((x / LS.W - .5) * g.width, (.5 - y / LS.H) * g.height, 0); m.localToWorld(_v); return toPx(_v); };
  C.regionPx = (name, id) => { const r = (LS.regs[name] || []).find(q => q.id === id); return r ? C.screenPx(name, r.x + r.w / 2, r.y + r.h / 2) : null; };
  C.hwPx = (name, part) => { let found = null; C.HW[name].traverse(o => { if (o.userData && o.userData.part === part) found = o; }); if (!found) return null; found.updateWorldMatrix(true, false); return toPx(found.getWorldPosition(_v)); };
  C.blipPx = i => toPx(C.blips[i].getWorldPosition(_v));
  window.CIC.act = activate; window.CIC.can = can; window.CIC.select = select; window.CIC.pick = pick; window.CIC.describe = describe; window.CIC.guard = () => LX.guardUp; window.CIC.toast = toast;
})();
