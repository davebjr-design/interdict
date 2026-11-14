/* ===== Call deck (docs/station_model.md s3): the hear-and-respond layer over the hunt console. Inlined into hunt_rt.html by build_hunt_rt.sh.
 * Normal hunts only: never on the Tern tutorial (TUT), and ?calldeck=0 turns it off. No pause in normal play: Stand by and the call rail pace it.
 * Audio first: a raised call is spoken (pre-rendered clip, else browser speech, else timed text); its answer chips appear when the line ends.
 * Keys: 1-4 answer, Enter = the crew's recommendation, Space = take the next waiting call, Backspace = Stand by, R = say again,
 * Esc = dismiss a priority 1-2 call to the log, F1-F8 = station screens, hold V + S/F/W/H/E/D/C = ask that station for a report (a V tap still vents).
 * Click a contact (scope or slip): radial menu Classify / Track / Probe / Fire (C T P F); the order runs the same lifecycle as a chip.
 */
var DECK = (() => {   // var, not const: the console code checks typeof DECK before this line has run
  const on = !TUT && QS.get('calldeck') !== '0';
  if (!TUT) { const kp = $('k-pause'); if (kp) kp.dataset.tip = on ? 'Crew settings: autonomy per station (Auto, Supervised, Hands-on), the captain\'s voice, voice volume, time compression. There is no pause in a hunt: Stand by (Backspace) holds a call.' : 'There is no pause in a hunt.'; }
  const STN = [   // F-key stations: view to show, the catalog stations they hold
    { k: 'F1', id: 'conn', name: 'CONN', view: 'tac', st: [] }, { k: 'F2', id: 'sen', name: 'SENSORS', view: 'sen', st: ['sensors'] },
    { k: 'F3', id: 'fc', name: 'FIRE CTL', view: 'fc', st: ['fire'] }, { k: 'F4', id: 'wpn', name: 'WEAPONS', view: 'wpn', st: ['weapons'] },
    { k: 'F5', id: 'helm', name: 'HELM', view: 'str', st: ['helm'] }, { k: 'F6', id: 'eng', name: 'ENGINEER', view: 'eng', st: ['engineering', 'thermal'] },
    { k: 'F7', id: 'dmg', name: 'DAMAGE', view: 'dmg', st: ['damage'] }, { k: 'F8', id: 'com', name: 'COMMS', view: 'com', st: ['comms'] }];
  const NEWV = ['sen', 'fc', 'wpn', 'eng', 'dmg', 'com'];
  const AUT = [['sensors', 'Sensors', 'Quill'], ['fire', 'Fire control', 'Abara'], ['weapons', 'Weapons', 'Abara'], ['helm', 'Helm', 'Abara'], ['engineering', 'Engineering', 'Castellan'], ['thermal', 'Thermal', 'Dace'], ['damage', 'Damage control', 'Fenwick'], ['comms', 'Comms', 'Pell']];
  const REPORT_KEY = { s: 'sensors', f: 'fire', w: 'weapons', h: 'helm', e: 'engineering', d: 'damage', c: 'comms' };
  const PCOL = { 1: '#566b62', 2: '#6fc3d0', 3: '#ffb454', 4: '#ff6b5a' }, FACE = { Quill: '#b79cff', Abara: '#ffb454', Castellan: '#6fc3d0', Dace: '#ff8a4c', Fenwick: '#8fd694', Pell: '#c58cff', Captain: '#cfe3da' };
  const RAD = [['classify', 'Classify', 'C', 'sensors'], ['track', 'Track', 'T', 'sensors'], ['probe', 'Probe', 'P', 'weapons'], ['fire', 'Fire', 'F', 'weapons']];
  const W = typeof window !== 'undefined' ? window : {};
  let cfg = { autonomy: {}, preset: 'ambush', compress: 1 };
  try { Object.assign(cfg, JSON.parse(localStorage.getItem('interdict.deck') || '{}')); } catch (e) {}
  const saveCfg = () => { try { localStorage.setItem('interdict.deck', JSON.stringify(cfg)); } catch (e) {} };
  let A = null, cur = null, chips = false, last = null, toastT = 0, vHeld = false, vUsed = false, radial = null, flash = {}, panelT = 0, speakTok = 0;
  const Sx = W.Stations, VO = W.Voice;
  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const fstation = st => STN.find(x => x.st.includes(st)) || STN[0];

  // ---------- voice ----------
  function clipBase() { return /\/design\//.test(location.pathname) ? '../web/voice_clips/' : 'voice_clips/'; }
  if (on && VO) { try { VO.loadClips(W.VOICE_MANIFEST || {}, clipBase()); } catch (e) {} }
  function say(who, text, pri) {   // returns a promise that resolves when the line has ended
    if (!VO) return new Promise(r => setTimeout(() => r(false), 600));
    const words = Sx.spoken(text), id = Sx.clipId(who, words), m = W.VOICE_MANIFEST || {};
    const has = who === 'Captain' ? !!m[id + '_m'] : !!m[id];
    return VO.speak({ id: has ? id : undefined, who, text: words, priority: pri || 2 });
  }

  // ---------- DOM ----------
  function build() {
    const st = $('stage'); if (!st || $('deck')) return;
    st.insertAdjacentHTML('beforeend', `<div id="deck" class="dk" hidden><div class="dk-face" id="dk-face"><svg viewBox="0 0 40 40"><circle class="dk-rbg" cx="20" cy="20" r="18"/><circle class="dk-ring" id="dk-ring" cx="20" cy="20" r="18"/></svg><b id="dk-ini">Q</b></div>
      <div class="dk-body"><div class="dk-tag" id="dk-tag"></div><div class="dk-line" id="dk-line"></div><div class="dk-chips" id="dk-chips"></div></div><div class="dk-keys" id="dk-keys">SPACE NEXT &middot; &#9003; STAND BY &middot; R SAY AGAIN</div></div>
      <div id="dk-rail" class="dk-rail"></div><div id="dk-stn" class="dk-stn">${STN.map(s => `<button data-f="${s.k}" id="dkf-${s.id}" title="${s.name}: station screen (${s.k})"><kbd>${s.k}</kbd><span>${s.name}</span></button>`).join('')}</div>
      <div id="dk-toast" class="dk-toast" hidden></div><div id="dk-vhint" class="dk-toast dk-v" hidden>REPORT: <b>S</b>ENSORS <b>F</b>IRE <b>W</b>EAPONS <b>H</b>ELM <b>E</b>NGINEERING <b>D</b>AMAGE <b>C</b>OMMS</div>
      <div id="dk-drawer" class="dk-drawer" hidden></div>`);
    // station panels: new flat panels where nothing exists; the left column and the bottom row stay (they are the widgets every station reuses)
    let p = '';
    p += czone('STN-SEN', 36, 8, 76, 66, 'SENSORS', 'Quill &middot; tracks, quality, who is reading what', '<div class="dk-pan" id="dkp-sen"></div>', { vz: 'sen' });
    p += czone('STN-FC', 36, 8, 76, 66, 'FIRE CONTROL', 'Abara &middot; solutions and baseline', '<div class="dk-pan" id="dkp-fc"></div>', { vz: 'fc' });
    p += czone('STN-WPN', 36, 8, 76, 66, 'WEAPONS', 'Abara &middot; magazine, salvo presets, point defence', '<div class="dk-pan" id="dkp-wpn"></div>', { vz: 'wpn' });
    p += czone('STN-ENG', 36, 8, 76, 66, 'ENGINEERING', 'Castellan, Dace &middot; heat, drive, vents', '<div class="dk-pan" id="dkp-eng"></div>', { vz: 'eng' });
    p += czone('STN-DMG', 36, 8, 76, 66, 'DAMAGE CONTROL', 'Fenwick &middot; hull and systems', '<div class="dk-pan" id="dkp-dmg"></div>', { vz: 'dmg' });
    p += czone('STN-COM', 36, 8, 76, 66, 'COMMS', 'calls and the log', '<div class="dk-pan" id="dkp-com"></div>', { vz: 'com' });
    st.insertAdjacentHTML('afterbegin', p);
    document.querySelectorAll('#stage [data-vz]').forEach(z => { if (/^(SENSORS|CONTACTS|ORDERS|WEAPONS|COMMS) /.test(z.dataset.z || '')) z.dataset.vz += ' ' + NEWV.join(' '); });
    // the F-key station keys take the place of the three view keys and the caution plate in the top rail; MENU moves left
    ['kv-tac', 'kv-str', 'kv-tgt'].forEach(id => { const el = $(id); if (el) el.style.display = 'none'; });
    document.querySelectorAll('#stage .cplate').forEach(el => { if (/MASTER CAUTION/.test(el.textContent)) el.style.display = 'none'; });
    { const m = $('k-menu'); if (m) m.style.setProperty('--x', 99); }
    document.body.insertAdjacentHTML('beforeend', '<div id="dk-radial" class="dk-radial" hidden></div>');
    $('dk-stn').addEventListener('click', e => { const b = e.target.closest('button'); if (b) station(b.dataset.f); });
    $('dk-chips').addEventListener('click', e => { const b = e.target.closest('button'); if (b && cur) answer(+b.dataset.i); });
    $('dk-rail').addEventListener('click', e => { const b = e.target.closest('[data-id]'); if (b) take(+b.dataset.id); });
    $('dk-radial').addEventListener('click', e => { const b = e.target.closest('button'); if (b && !b.disabled) radialPick(b.dataset.v); });
    $('dk-drawer').addEventListener('change', drawerChange); $('dk-drawer').addEventListener('input', drawerChange);
    $('dk-drawer').addEventListener('click', e => { const b = e.target.closest('[data-x]'); if (b && b.dataset.x === 'close') drawer(false); });
    document.querySelectorAll('.dk-pan').forEach(el => el.addEventListener('click', e => { const b = e.target.closest('[data-dk]'); if (b) panelAct(b.dataset.dk, b.dataset.arg); }));
  }

  // ---------- hunt lifecycle ----------
  function begin() {
    if (!on) return; build();
    A = StationAdapter.create({ engine: E, seed: (S.seed >>> 0) || 1, command: 'tight', autonomy: cfg.autonomy, preset: cfg.preset });
    A.update(S, 0); cur = null; chips = false; last = null; radialClose(); $('deck').hidden = true; rail(); drawerFill();
    try { VO && VO.cancel(); } catch (e) {}
  }
  function frame(dtReal, running) {
    if (!on || !A || !S) return;
    const evs = A.update(S, running ? dtReal : 0);
    for (const ev of evs) handle(ev);
    if (cur && (cur.state !== 'raised' && cur.state !== 'reported')) clear('resolved');
    if (cur && cur.state === 'reported' && cur._end && performance.now() > cur._end) clear('read');
    if (!cur) { const nx = A.model.pending().find(c => c.pri >= 3); if (nx) show(nx); }
    ring(); if (toastT && performance.now() > toastT) { $('dk-toast').hidden = true; toastT = 0; }
    if (performance.now() - panelT > 250) { panelT = performance.now(); rail(); panels(); stnBar(); }
  }
  function handle(ev) {
    if (ev.type === 'raise') {
      const c = ev.call; flash[fstation(c.station).id] = performance.now() + 4000;
      if (c.pri >= 3 && tscale > 1) setTime(1);   // time compression drops to 1x on any priority 3+ call
      if (!cur) show(c); else if (c.pri === 4 && cur.pri < 4) show(c);   // a critical call cuts in; the other waits on the rail
    } else if (ev.type === 'order' && ev.order.by === 'co') {
      const o = ev.order;
      if (ev.stage === 'issued') say('Captain', Sx.captainLine(o.label), 3);
      else if (ev.stage === 'acked') say(o.officer, Sx.ackLine(o.label), 3);
    } else if (ev.type === 'default') {
      const c = ev.call, o = c.opts && c.opts[c.choice];
      toast(`${crewName(c.officer).toUpperCase()}: no answer, crew default: ${o ? o.label : '-'}${c.cost && c.cost !== 'none' ? ' (' + c.cost + ')' : ''}`);
      if (o) say(c.officer, Sx.ackLine(o.label), 2);
      if (cur === c) clear('default');
    } else if (ev.type === 'noop') toast('NOT YET SIMULATED: ' + ev.order.label + '. ' + ev.why);
    else if (ev.type === 'executed' && !ev.ok && ev.order.by === 'co') toast(`${crewName(ev.order.officer).toUpperCase()}: unable (${ev.order.label})`);
  }
  // ---------- the current call ----------
  function show(c) {
    if (!c) return; cur = c; chips = false; last = c; const tok = ++speakTok;
    const n = c.data && c.data.n ? 'SIERRA ' + c.data.n : '', stn = fstation(c.station);
    $('deck').hidden = false; $('deck').dataset.pri = c.pri; $('dk-face').style.setProperty('--fc', FACE[c.officer] || '#cfe3da');
    $('dk-ini').textContent = (crewName(c.officer) || '?')[0];
    $('dk-tag').innerHTML = `<b>${esc(crewName(c.officer).toUpperCase())}</b><span>${stn.name} &middot; ${stn.k}${n ? ' &middot; ' + n : ''}</span><em style="color:${PCOL[c.pri]}">${['', 'ROUTINE', 'NOTABLE', 'URGENT', 'CRITICAL'][c.pri]}</em>`;
    $('dk-line').textContent = c.line; $('dk-chips').innerHTML = ''; $('dk-chips').dataset.n = 0; $('deck').classList.remove('chips');
    say(c.officer, c.line, c.pri).then(() => { if (cur !== c || tok !== speakTok) return; chipsUp(c); });
  }
  function chipsUp(c) {
    chips = true; const rec = A.model.defaultIndex(c);
    if (!c.opts || c.state !== 'raised') { c._end = performance.now() + 3500; return; }
    $('dk-chips').innerHTML = c.opts.slice(0, 4).map((o, i) => `<button class="dk-chip${i === rec ? ' rec' : ''}" data-i="${i}"><kbd>${i + 1}</kbd><span>${esc(o.label)}</span>${i === rec ? '<i title="The crew recommends this. Enter.">&#10003; &#9166;</i>' : ''}</button>`).join('');
    $('dk-chips').dataset.n = c.opts.length; $('deck').classList.add('chips');
  }
  function clear(why) { cur = null; chips = false; $('deck').hidden = true; $('deck').classList.remove('chips'); }
  function answer(i) { if (!cur || !chips || !cur.opts || !cur.opts[i]) return false; const c = cur; const o = A.model.answer(c.id, i); if (o) clear('answered'); return !!o; }
  function take(id) {   // Space or a rail click: the highest priority waiting call (or that one)
    const p = A.model.pending().filter(c => c !== cur); const c = id != null ? p.find(x => x.id === id) : p[0];
    if (c) show(c); return !!c;
  }
  function standBy() { if (!cur) return false; const ok = A.model.standBy(cur.id); toast(ok ? `${crewName(cur.officer).toUpperCase()}: STANDING BY` : cur.stood ? 'ALREADY STOOD BY ONCE' : 'CANNOT STAND BY ON A CRITICAL CALL'); if (ok) say(cur.officer, 'Standing by.', 2); return ok; }
  function sayAgain() { const c = cur || last; if (!c) return false; if (!cur && (c.state === 'raised' || c.state === 'reported')) show(c); else say(c.officer, c.line, Math.max(2, c.pri)); return true; }
  function dismiss() { if (!cur || cur.pri > 2) return false; A.model.dismiss(cur.id); clear('dismissed'); return true; }
  function ring() {
    const r = $('dk-ring'); if (!r || !cur) return; const c = cur, vis = c.pri >= 3 && c.state === 'raised' && c.expiresAt != null;
    r.style.display = vis ? '' : 'none'; if (!vis) return; const f = Math.max(0, Math.min(1, (c.expiresAt - A.model.now) / Math.max(0.1, c.expiresAt - c.raisedAt)));
    r.style.strokeDashoffset = (113.1 * (1 - f)).toFixed(1); r.style.stroke = c.pri === 4 ? '#ff6b5a' : '#ffb454';
  }
  function rail() {
    const el = $('dk-rail'); if (!el) return; const p = A ? A.model.pending().filter(c => c !== cur) : [];
    const k = p.map(c => c.id + ':' + c.pri).join(); if (el.dataset.k === k) return; el.dataset.k = k;
    el.innerHTML = p.slice(0, 8).map(c => `<div class="dk-ri" data-id="${c.id}" style="--pc:${PCOL[c.pri]}" title="${esc(crewName(c.officer) + ': ' + c.line)}"><b>${esc((crewName(c.officer) || '?')[0])}</b><i>${c.pri}</i></div>`).join('') + (p.length > 8 ? `<div class="dk-more">+${p.length - 8}</div>` : '');
  }
  function stnBar() { const t = performance.now(); STN.forEach(s => { const b = $('dkf-' + s.id); if (!b) return; b.classList.toggle('fl', (flash[s.id] || 0) > t); b.classList.toggle('on', view === s.view); }); }
  function toast(t) { const el = $('dk-toast'); if (!el) return; el.textContent = t; el.hidden = false; toastT = performance.now() + 3200; }

  // ---------- stations ----------
  function station(k) { const s = STN.find(x => x.k === k); if (!s || !S) return; radialClose(); if (s.view === 'tgt' && !S.an.some(a => a.state === 'locked')) return; setView(s.view); panelT = 0; }
  function report(stKey) {
    if (!A || !S) return; const rp = statusText(stKey); A.model.report(stKey, rp); toast(`${stKey.toUpperCase()}, REPORT`);
  }
  function statusText(k) {
    const lk = S.an.filter(a => a.state === 'locked'), open = S.an.filter(a => a.state === 'open' && a.idStatus !== 'plan');
    if (k === 'sensors') { const host = S.an.filter(a => a.idStatus === 'hostile' && a.state !== 'disabled').length; return `${open.length} contacts open, ${lk.length} locked${host ? ', ' + host + ' hostile' : ''}.`; }
    if (k === 'fire') return lk.length ? lk.map(a => { const si = E.solveInfo(S, a); return `Sierra ${a.id + 1} ${si.ready ? 'solution ready' : si.stale ? 'stale' : 'solving, ' + Math.round(si.prog * 100) + ' percent'}`; }).join('. ') + '.' : 'No locks. Nothing to solve.';
    if (k === 'weapons') { const rd = S.tubes.filter(x => S.t >= x).length; return `Magazine ${S.mag.total} of ${S.mag.max}. ${rd} of ${S.tubes.length} tubes ready. Point defence ${S.pd}. Preset ${A.salvo.name}.`; }
    if (k === 'helm') return `Drive ${E.SPEED[S.speed].label}, ${S.posture === 'route' ? 'on the flight plan' : S.posture === 'still' ? 'holding position' : S.posture}.`;
    if (k === 'engineering') return `Heat sink at ${Math.round(S.sink.h * 100)} percent${S.vent.on ? ', venting' : ''}.`;
    if (k === 'damage') return `Hull ${Math.round(S.hull)} percent. Systems ${Math.round(S.sysEff * 100)} percent.${S.hull < 60 ? ' Sensor mounts fouled.' : ''}`;
    return 'Nothing on the link.';
  }
  const row = (cells, cls) => `<tr class="${cls || ''}">${cells.map(c => `<td>${c}</td>`).join('')}</tr>`;
  const key = (dk, arg, t, s, lit, dis) => `<button class="dk-k${lit ? ' lit' : ''}" data-dk="${dk}" data-arg="${arg == null ? '' : arg}" ${dis ? 'disabled' : ''}><b>${t}</b><small>${s || ''}</small></button>`;
  function panels() {
    if (!S || !NEWV.includes(view)) return; const el = $('dkp-' + view); if (!el) return; let h = '';
    if (view === 'sen') {
      h = '<table class="dk-t"><tr><th>TRACK</th><th>STATE</th><th>QUALITY</th><th>CALL</th><th>H R V</th><th>LAST READ</th><th>ANALYSTS</th></tr>' + S.an.map(a => {
        const c = E.classify(S, a), q = a.idStatus === 'hostile' || a.idStatus === 'plan' ? 'AFFIRMED' : c.n >= 2 && c.p >= 0.8 ? 'PASSIVE' : 'SUSPECTED', on = S.analysts.filter(w => w.task === a.id).map(w => crewName(w.name)).join(' ');
        const ch = ['thermal', 'reactor', 'occlusion'].map(k => { const r = a.read[k]; return r ? (r.blind ? 'x' : r.den >= ME().readDone ? '&#9679;' : '&#9675;') : '-'; }).join(' ');
        return row(['S' + (a.id + 1), a.state.toUpperCase(), q, esc(clsLabel(a)), ch, a.lastRead ? fmtMin(S.t - a.lastRead) + ' AGO' : '--', on || 'SWEEP'], a.id === selId ? 'sel' : q === 'AFFIRMED' ? 'aff' : '');
      }).join('') + '</table><div class="dk-note">Quality: AFFIRMED (fired, pinged, vented or an ally: known) &middot; PASSIVE (the readings say so, 80%+) &middot; SUSPECTED. Click a contact on the scope or a slip for orders.</div>';
    } else if (view === 'fc') {
      const lk = S.an.filter(a => a.state === 'locked');
      h = '<table class="dk-t"><tr><th>TRACK</th><th>SOLUTION</th><th>TRACK STATE</th><th>CERTAINTY</th><th>WHY SLOW</th></tr>' + (lk.length ? lk.map(a => { const si = E.solveInfo(S, a), ts = E.trackState(S, a); return row(['S' + (a.id + 1), si.ready ? 'READY' : si.stale ? 'STALE' : Math.round(si.prog * 100) + '%', ts.state.toUpperCase(), Math.round(ts.cert * 100) + '%', esc(si.why.join(', ') || '-')], si.ready ? 'aff' : ''); }).join('') : row(['--', 'NO LOCKS', '', '', ''])) + '</table>';
      h += `<div class="dk-box"><b>BASELINE (TMA)</b><span>Bearing-only ranging needs a leg: a velocity change of 0.5 km/s over 10 s halves the range uncertainty. <em>Not simulated yet (Newtonian phase).</em></span>${key('baseline', null, 'GIVE A BASELINE', 'NOT YET SIMULATED', false, true)}</div>`;
      h += `<div class="dk-row">${key('target', null, 'TARGET VIEW', 'PLAN THE VOLLEY', !!lk.length, !lk.length)}${lk.map(a => key('refresh', a.id, 'REFRESH S' + (a.id + 1), 'NEW SOLUTION')).join('')}</div>`;
    } else if (view === 'wpn') {
      const m = S.mag, p = A.salvo, rd = S.tubes.filter(x => S.t >= x).length;
      h = `<div class="dk-big">MAGAZINE <b>${m.total}</b>/${m.max}<small>${Math.floor(m.total / m.perSalvo)} FULL SALVOS &middot; HE ${m.byKind.he} &middot; EMP ${m.byKind.emp} &middot; FLARE ${m.byKind.flare}</small></div>`;
      h += `<div class="dk-sub">TUBES ${rd}/${S.tubes.length} READY</div>`;
      h += `<div class="dk-sub">POINT DEFENCE <em>doctrine: active on vampire</em></div><div class="dk-row">${['off', 'armed', 'active'].map(k => key('pd', k, k.toUpperCase(), k === 'active' ? 'LIT: SEEN BY ALL' : k === 'armed' ? 'COLD, SLOW' : 'NO INTERCEPTS', S.pd === k)).join('')}</div>`;
      h += `<div class="dk-sub">SALVO PRESET</div><div class="dk-row">${SalvoPresets.ids.map(id => key('preset', id, SalvoPresets.PRESETS[id].name.toUpperCase(), SalvoPresets.PRESETS[id].count + ' MSL', p.id === id)).join('')}</div>`;
      h += '<table class="dk-t">' + [['PATTERN', p.pattern, 1], ['RUN TO ENABLE', p.rte + ' S', 1], ['HOMING', p.homing ? 'ON' : 'OFF', 0], ['WIRE', p.wire ? 'ON' : 'OFF', 1], ['WARHEAD', p.warhead.toUpperCase(), 0], ['CONE', p.cone + ' KM', 0], ['COUNT', p.count + (p.probe ? ' (PROBE)' : ' (' + Math.ceil(p.count / 6) + ' TUBE' + (p.count > 6 ? 'S' : '') + ')'), 0]].map(([a, b, ns]) => row([a, b.toString().toUpperCase(), ns ? '<em>NOT YET SIMULATED</em>' : 'SIMULATED'])).join('') + '</table>';
    } else if (view === 'eng') {
      const xp = E.exposure(S), rate = E.heatRate(S);
      h = `<div class="dk-big">SINK <b>${Math.round(S.sink.h * 100)}%</b><small>${S.vent.on ? 'VENTING' : rate > 0.0003 ? 'FILLING, FULL IN ' + fmtMin((1 - S.sink.h) / rate) : rate < -0.0003 ? 'DRAINING' : 'STEADY'} &middot; DRIVE ${E.SPEED[S.speed].label} &middot; ${S.posture.toUpperCase()}</small></div>`;
      h += '<table class="dk-t"><tr><th>HEAT SOURCE</th><th>% OF SINK / MIN</th></tr>' + (xp.parts.length ? xp.parts.slice().sort((a, b) => b.v - a.v).map(p0 => row([esc(p0.label), (p0.v * ME().sinkK / S.me.sink * 100).toFixed(1)])).join('') : row(['Running dark', '0'])) + '</table>';
      h += `<div class="dk-row">${key('vent', null, S.vent.on ? 'RETRACT FINS' : 'VENT', 'FINS OUT: VISIBLE', S.vent.on)}${key('quiet', null, 'GO QUIET', 'SENSORS DARK', S.t < S.quietUntil)}${key('redline', null, 'REDLINE', 'SHORT BURSTS', !!S.burn)}${key('cut', null, 'CUT THRUST', 'ONE STEP DOWN')}</div>`;
    } else if (view === 'dmg') {
      const fouled = S.hull < 60;
      h = '<table class="dk-t"><tr><th>SYSTEM</th><th>STATUS</th></tr>' + [['HULL', Math.round(S.hull) + '%', S.hull < 40 ? 'bad' : S.hull < 70 ? 'warn' : ''], ['SENSOR MOUNTS', fouled ? 'FOULED: READS SLOWER' : 'OK', fouled ? 'warn' : ''], ['SYSTEMS', Math.round(S.sysEff * 100) + '%', S.sysEff < 0.9 ? 'warn' : ''], ['COOLANT', S.melt ? 'FAILING' : 'OK', S.melt ? 'bad' : ''], ['HEAT SINK', Math.round(S.sink.h * 100) + '%', S.sink.h > 0.8 ? 'warn' : ''], ['BREACH DRIVE', S.spool ? 'SPOOLING' : 'READY', S.spool ? 'warn' : ''], ['DAMAGE PRIORITY', (S.dmgPriority || 'sink').toUpperCase(), '']].map(([a, b, c]) => row([a, b], c)).join('') + '</table>';
      h += `<div class="dk-row">${key('dmg', 'sink', 'SAVE THE SINK', 'PRIORITY', (S.dmgPriority || 'sink') === 'sink')}${key('dmg', 'drive', 'SAVE THE DRIVE', 'PRIORITY', S.dmgPriority === 'drive')}</div><div class="dk-note">Damage priority is a flag for now: the compartment and repair model is a later phase.</div>`;
    } else if (view === 'com') {
      const cs = A.model.calls.filter(c => c.state !== 'logged').slice(-12).reverse();
      h = '<div class="dk-sub">CALLS</div><table class="dk-t">' + cs.map(c => row([fmtMin(c.at / P.secPerMin), esc(crewName(c.officer)), esc(c.line), (c.state === 'answered' ? 'ANSWERED: ' : c.state === 'defaulted' ? 'DEFAULT: ' : c.state === 'settled' ? 'DOCTRINE: ' : '') + (c.opts && c.choice != null ? esc(c.opts[c.choice].label) : c.state.toUpperCase())])).join('') + '</table>';
      h += '<div class="dk-sub">LOG</div><table class="dk-t">' + S.log.slice(-10).reverse().map(l => row([fmtMin(l.t), esc(crewName(l.who)), esc(l.text)], l.kind)).join('') + '</table>';
    }
    if (el.dataset.h !== h) { el.dataset.h = h; el.innerHTML = h; }
  }
  function panelAct(k, arg) {
    if (!S || S.over) return;
    if (k === 'pd') E.setPD(S, arg); else if (k === 'preset') { A.setPreset(arg); cfg.preset = arg; saveCfg(); } else if (k === 'target') ACT.target(); else if (k === 'refresh') E.refreshSolution(S, +arg);
    else if (k === 'vent') ventToggle(); else if (k === 'quiet') E.goQuiet(S); else if (k === 'redline') E.redlineBurn(S); else if (k === 'cut') A.order('engineering', 'cut_thrust', 'Cut thrust', {});
    else if (k === 'dmg') S.dmgPriority = arg;
    panelT = 0; uiUpdate(true);
  }

  // ---------- radial menu ----------
  function radialAt(id, px, py) {
    if (!on || !S || S.over) return; const a = S.an[id]; if (!a || a.state === 'disabled' || a.idStatus === 'plan') return;
    const live = ['open', 'locked'].includes(a.state), si = a.state === 'locked' ? E.solveInfo(S, a) : null, dark = S.t < S.quietUntil;
    const dis = { classify: !live, track: !live, probe: dark || S.mag.total <= 0 || a.state === 'out', fire: !(si && si.ready && !si.stale) || dark };
    const why = { classify: live ? 'All analysts on her' : 'Ruled out', track: a.state === 'locked' ? 'Keep an analyst on her' : 'Lock on: work a solution', probe: dark ? 'Not while quiet' : 'Two real missiles, no ping', fire: si && si.ready ? 'Preset: ' + A.salvo.name : 'Needs a ready solution' };
    radial = { id }; const el = $('dk-radial');
    el.innerHTML = `<div class="dk-rc">S${id + 1}</div>` + RAD.map(([v, t, k], i) => `<button class="dk-rb r${i}" data-v="${v}" ${dis[v] ? 'disabled' : ''}><kbd>${k}</kbd>${t}<small>${why[v]}</small></button>`).join('');
    el.hidden = false; const w = el.offsetWidth, h = el.offsetHeight; el.style.left = Math.max(4, Math.min(innerWidth - w - 4, px - w / 2)) + 'px'; el.style.top = Math.max(4, Math.min(innerHeight - h - 4, py - h / 2)) + 'px';
    selId = id;
  }
  function radialPick(v) {
    if (!radial || !A) return; const r = RAD.find(x => x[0] === v), id = radial.id; radialClose(); if (!r) return;
    const b = [...document.querySelectorAll('#dk-radial button')]; void b;
    A.order(r[3], v, r[1], { id, n: id + 1 }); toast(`ORDER: ${r[1].toUpperCase()} SIERRA ${id + 1}`);
  }
  function radialClose() { radial = null; const el = $('dk-radial'); if (el) el.hidden = true; }

  // ---------- settings drawer ----------
  function drawer(show) { const el = $('dk-drawer'); if (!el) return; if (show == null) show = el.hidden; el.hidden = !show; if (show) drawerFill(); }
  function drawerFill() {
    const el = $('dk-drawer'); if (!el) return; const vs = VO ? VO.state() : {}, cap = (VO && JSON.parse(localStorage.getItem('interdict.voice') || '{}').captain) || 'm';
    el.innerHTML = `<div class="dk-dh">CREW SETTINGS<button data-x="close">CLOSE &#10005;</button></div><div class="dk-sub">AUTONOMY <em>Auto: only urgent calls and open decisions reach you</em></div>
      <table class="dk-t dk-aut">${AUT.map(([k, lab, who]) => { const m = (A ? A.model.autonomy[k] : cfg.autonomy[k]) || 'auto'; return `<tr><td>${lab}<small>${crewName(who)}</small></td>${['auto', 'supervised', 'hands-on'].map(x => `<td><label class="${m === x ? 'on' : ''}"><input type="radio" name="aut-${k}" data-aut="${k}" value="${x}" ${m === x ? 'checked' : ''}>${x === 'supervised' ? 'SUPERVISED' : x.toUpperCase()}</label></td>`).join('')}</tr>`; }).join('')}</table>
      <div class="dk-sub">CAPTAIN'S VOICE</div><div class="dk-row">${['m', 'f'].map(g => `<label class="dk-opt ${cap === g ? 'on' : ''}"><input type="radio" name="dk-cap" data-cap="${g}" ${cap === g ? 'checked' : ''}>${g === 'm' ? 'MALE' : 'FEMALE'}</label>`).join('')}</div>
      <div class="dk-sub">VOICE VOLUME</div><div class="dk-row"><input type="range" min="0" max="100" value="${Math.round((vs.volume == null ? 1 : vs.volume) * 100)}" data-vol="1"><label class="dk-opt ${vs.enabled === false ? 'on' : ''}"><input type="checkbox" data-mute="1" ${vs.enabled === false ? 'checked' : ''}>MUTE (TEXT ONLY)</label></div>
      <div class="dk-sub">TIME COMPRESSION <em>drops to 1x on any urgent call</em></div><div class="dk-row">${[1, 2].map(x => `<label class="dk-opt ${tscale === x ? 'on' : ''}"><input type="radio" name="dk-tc" data-tc="${x}" ${tscale === x ? 'checked' : ''}>${x}X</label>`).join('')}</div>
      <div class="dk-note">No pause in a hunt. Stand by (Backspace) holds a call; the rail keeps the queue. Keys: 1-4 answer, Enter recommended, Space next, R say again, Esc dismiss, F1-F8 stations, hold V + letter for a report.</div>`;
  }
  function drawerChange(e) {
    const t = e.target;
    if (t.dataset.aut) { cfg.autonomy[t.dataset.aut] = t.value; if (A) A.model.setAutonomy(t.dataset.aut, t.value); saveCfg(); drawerFill(); }
    else if (t.dataset.cap) { VO && VO.set({ captain: t.dataset.cap }); drawerFill(); }
    else if (t.dataset.vol) { VO && VO.set({ volume: +t.value / 100 }); }
    else if (t.dataset.mute) { VO && VO.set({ enabled: !t.checked }); drawerFill(); }
    else if (t.dataset.tc) { setTime(+t.dataset.tc); drawerFill(); }
  }

  // ---------- keys ----------
  function blocked(e) { return !on || !S || briefing || !A || ($('manual') && !$('manual').hidden) || ($('moment') && !$('moment').hidden) || (e.target && e.target.tagName === 'INPUT' && e.target.type !== 'radio' && e.target.type !== 'checkbox') || e.ctrlKey || e.metaKey || e.altKey; }
  function keydown(e) {
    if (blocked(e)) return; const k = e.key, lk = k.length === 1 ? k.toLowerCase() : k;
    const eat = () => { e.preventDefault(); e.stopImmediatePropagation(); };
    if (/^F[1-8]$/.test(k)) { eat(); station(k); return; }
    if (radial) { const r = RAD.find(x => x[2].toLowerCase() === lk) || ({ 1: RAD[0], 2: RAD[1], 3: RAD[2], 4: RAD[3] })[k]; if (r) { eat(); const b = document.querySelector(`#dk-radial button[data-v="${r[0]}"]`); if (b && !b.disabled) radialPick(r[0]); return; } if (k === 'Escape') { eat(); radialClose(); return; } }
    if (k === 'Escape' && !$('dk-drawer').hidden) { eat(); drawer(false); return; }
    if (lk === 'v') { eat(); if (!e.repeat && !vHeld) { vHeld = true; vUsed = false; $('dk-vhint').hidden = false; } return; }
    if (vHeld && REPORT_KEY[lk]) { eat(); vUsed = true; report(REPORT_KEY[lk]); return; }
    if (fxOn) return;
    if (/^[1-4]$/.test(k) && cur && chips && cur.opts) { eat(); answer(+k - 1); return; }
    if (k === 'Enter' && cur && chips && cur.opts) { eat(); answer(A.model.defaultIndex(cur)); return; }
    if (k === ' ') { eat(); take(); return; }
    if (k === 'Backspace') { eat(); standBy(); return; }
    if (lk === 'r' && (cur || last)) { eat(); sayAgain(); return; }
    if (k === 'Escape' && cur && cur.pri <= 2) { eat(); dismiss(); return; }
    if (lk === 'p') { eat(); toast('NO PAUSE IN A HUNT: STAND BY (BACKSPACE) HOLDS A CALL'); return; }
  }
  function keyup(e) {
    if (!on) return; const lk = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (lk === 'v' && vHeld) { vHeld = false; const el = $('dk-vhint'); if (el) el.hidden = true; if (!vUsed && S && !briefing) ventToggle(); e.preventDefault(); e.stopImmediatePropagation(); }
  }
  if (on) {
    addEventListener('keydown', keydown, true); addEventListener('keyup', keyup, true);
    addEventListener('blur', () => { vHeld = false; const el = $('dk-vhint'); if (el) el.hidden = true; });
    document.addEventListener('mousedown', e => { if (radial && !e.target.closest('#dk-radial')) radialClose(); }, true);
    // left click on a contact in the scope: the radial menu (right click keeps the full contact menu)
    const sb = $('scopebox'); if (sb) sb.addEventListener('click', e => {
      if (!S || dragged || e.target.id !== 'cv') return; const r = cv.getBoundingClientRect(), x = ((e.clientX - r.left) * cv.width / r.width - VX) / VZ, y = ((e.clientY - r.top) * cv.height / r.height - VY) / VZ, k = cv.width / P.arena; let best = null, bd = 44 * cv.width / r.width / VZ;
      S.an.forEach(a => { if (a.state === 'out' || a.state === 'disabled' || a.idStatus === 'plan') return; const p = E.displayPos(S, a), d = Math.hypot(p.x * k - x, p.y * k - y); if (d < bd) { bd = d; best = a.id; } });
      if (best != null) { e.stopPropagation(); radialAt(best, e.clientX, e.clientY); }
    }, true);
    const slip0 = ACT.slip; ACT.slip = el => { slip0(el); const r = el.getBoundingClientRect(); radialAt(+el.dataset.arg, r.right + 140, r.top + r.height / 2); };
  }
  return { on, begin, frame, show, answer, take, standBy, sayAgain, dismiss, station, report, radialAt, radialPick, radialClose, drawer, statusText,
    get adapter() { return A; }, get cur() { return cur; }, get chipsShown() { return chips; }, get radialOpen() { return !!radial; }, STN };
})();
