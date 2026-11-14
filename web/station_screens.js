/* ===== Station screens (docs/station_screens.md): the multifunction console family over the hunt page. Inlined into hunt_rt.html after the call deck.
 * Normal hunts only (same switch as the call deck: never on the Tern tutorial, ?calldeck=0 turns it off). F1 stays the existing console.
 * Frame on every station screen F2-F8: top bar (station, officer, autonomy badge, clock, posture), left function tabs, windowed panels,
 * softkeys (Shift+F1..F8), message line (the last order's lifecycle), the call strip at the bottom. The annunciator strip is on every screen.
 * Autonomy (station model): Auto = a live read-only view of what the officer is doing; Supervised = the pending recommendation (approve it);
 * Hands-on = the controls are live. Anything the engine cannot do yet is a clearly marked NOT YET SIMULATED stub with no behaviour.
 */
var SCREENS = (() => {
  const on = typeof DECK !== 'undefined' && DECK.on;
  const AN = window.Annunciator;
  const VIEWS = {
    sen: { k: 'F2', name: 'SENSORS', st: ['sensors'], who: ['Quill'], ac: '#86a9cc', fn: 'CONTACT MANAGEMENT' },
    fc: { k: 'F3', name: 'FIRE CONTROL', st: ['fire'], who: ['Abara'], ac: '#c7a782', fn: 'TARGET MOTION ANALYSIS' },
    wpn: { k: 'F4', name: 'WEAPONS', st: ['weapons'], who: ['Abara'], ac: '#c4908a', fn: 'PAYLOAD CONTROL' },
    str: { k: 'F5', name: 'HELM', st: ['helm'], who: ['Abara'], ac: '#8fc4a4', fn: 'NAVIGATION' },
    eng: { k: 'F6', name: 'ENGINEERING', st: ['engineering', 'thermal'], who: ['Castellan', 'Dace'], ac: '#c4b886', fn: 'PLATFORM: POWER AND HEAT' },
    dmg: { k: 'F7', name: 'DAMAGE CONTROL', st: ['damage'], who: ['Fenwick'], ac: '#b394c7', fn: 'PLATFORM: HULL AND SYSTEMS' },
    com: { k: 'F8', name: 'COMMS', st: ['comms'], who: ['Pell'], ac: '#84c2c4', fn: 'REPORTS AND LINKS' }
  };
  const MODES = ['auto', 'supervised', 'hands-on'], MODE_TAG = { auto: 'AUTO', supervised: 'SUPV', 'hands-on': 'HANDS-ON' };
  const PAGES = {};            // view -> { tabs: [[id, label]], render(tab, ctx) -> html, soft(tab, ctx) -> [softkeys] }
  const tab = {};              // view -> current tab id
  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  let built = false, P = AN ? AN.create() : null, annOut = null, annT = 0, renT = 0, actx = null, toneT = 0, down = false, mainKey = '', curSoft = [];
  if (on) document.body.classList.add('ss-on');

  // ---------- helpers every page uses ----------
  const A = () => DECK.adapter, M = () => DECK.adapter && DECK.adapter.model;
  const modeOf = v => { const m = M(); if (!m || !VIEWS[v]) return 'auto'; const ms = VIEWS[v].st.map(k => m.autonomy[k] || 'auto'); return ms.sort((a, b) => MODES.indexOf(b) - MODES.indexOf(a))[0]; };
  const live = () => modeOf(view) === 'hands-on';
  // a control key: live only in Hands-on (data-c); a view key (data-v) works in every mode
  function key(o) {
    const ro = o.ctl !== false && !live(), dis = o.dis || ro;
    return `<button class="sk2${o.lit ? ' lit' : ''}${o.warn ? ' warn' : ''}${o.stub ? ' stub' : ''}${ro && !o.dis ? ' ro' : ''} ${o.cls || ''}" data-a="${o.act || ''}" data-arg="${esc(o.arg == null ? '' : o.arg)}" ${dis ? 'disabled' : ''} ${o.tip ? `title="${esc(o.tip)}"` : ''}><b>${o.t}</b>${o.s ? `<small>${o.s}</small>` : ''}</button>`;
  }
  const panel = (id, title, sub, body, cls) => `<section class="sp ${cls || ''}" id="sp-${id}"><header class="spt"><b>${title}</b>${sub ? `<em>${sub}</em>` : ''}</header><div class="spb">${body}</div></section>`;
  const stub = (t) => `<span class="nys">NOT YET SIMULATED${t ? ': ' + t : ''}</span>`;
  const pct = v => Math.round(v * 100) + '%';
  const brg = n => String(((Math.round(n) % 360) + 360) % 360).padStart(3, '0');
  function obsPos(a) { return a.idStatus === 'plan' ? E.truePos(a, S.t) : E.displayPos(S, a); }   // what we believe (the honest picture), never ground truth for a hostile or unknown
  function quality(a) {
    if (a.idStatus === 'plan') return 'ALLY';
    const c = E.classify(S, a); return a.idStatus === 'hostile' || a.idStatus === 'confirmed' ? 'AFFIRMED' : c.n >= 2 && c.p >= 0.8 ? 'PASSIVE' : 'SUSPECTED';
  }

  // ---------- build ----------
  function build() {
    if (!on || built) return; const st = $('stage'); if (!st) return; built = true;
    const tabsH = '<nav class="ss-tabs" id="ss-tabs"></nav>';
    st.insertAdjacentHTML('afterbegin', `<div id="ss" class="ss" data-vz="${Object.keys(VIEWS).join(' ')}">
      <div class="ss-hd" id="ss-hd"></div>${tabsH}<div class="ss-ban" id="ss-ban"></div><div class="ss-main" id="ss-main"></div>
      <div class="ss-sk" id="ss-sk"></div><div class="ss-msg" id="ss-msg"></div><div class="ss-cb"><span class="ss-cbl">CALLS</span><span class="ss-cbe" id="ss-cbe">NO CALL UP &middot; SPACE TAKES THE NEXT WAITING CALL</span></div></div>`);
    st.insertAdjacentHTML('beforeend', annHtml());
    // the strategic map is F5's main window in the frame; the console's side columns stay on F1 only
    document.querySelectorAll('#stage .cz[data-vz]').forEach(z => { const n = (z.dataset.z || '').split(' ')[0]; if (['SENSORS', 'CONTACTS', 'ORDERS', 'COMMS'].includes(n)) z.dataset.vz = 'tac'; if (n === 'LEGS') z.dataset.vz = 'none'; });
    document.querySelectorAll('#stage > .cz:not([data-vz])').forEach(z => { if (/^(HEAT|SIGNATURE|SHIP) /.test(z.dataset.z || '')) z.dataset.vz = 'tac tgt'; });   // the console's right column belongs to F1 (and the target view)
    cViews(view);
    $('ss').addEventListener('pointerdown', onDown); addEventListener('pointerup', () => { down = false; });
    $('ann').addEventListener('pointerdown', e => { const b = e.target.closest('[data-t],[data-m]'); if (!b) return; e.preventDefault(); unlockAudio();
      if (b.dataset.m) { P.ackLevel(b.dataset.m); annT = 0; return; }
      const t = AN.TILES.find(x => x.id === b.dataset.t); P.ack(t.id); annT = 0; DECK.station(t.key); });
    addEventListener('pointerdown', unlockAudio, true); addEventListener('keydown', unlockAudio, true);
    addEventListener('keydown', e => { if (!on || !S || briefing || e.ctrlKey || e.metaKey || e.altKey || (e.target && e.target.tagName === 'INPUT' && e.target.type === 'text')) return;
      if ((e.key === 'a' || e.key === 'A') && !e.repeat) { if (P) { P.ackAll(); annT = 0; } e.preventDefault(); } }, true);
  }
  function annHtml() {
    let h = '<div id="ann" class="ann" aria-label="Annunciator panel"><div class="ann-m"><button class="annM w" data-m="warning" id="ann-mw" title="Master warning: a warning lamp is unacknowledged. Click or press A to acknowledge."><b>MASTER</b>WARNING</button><button class="annM c" data-m="caution" id="ann-mc" title="Master caution: a caution lamp is unacknowledged. Click or press A to acknowledge."><b>MASTER</b>CAUTION</button></div>';
    for (const g of AN.GROUPS) {
      h += `<div class="ann-g"><div class="ann-gh"><kbd>${g.key}</kbd>${g.name}</div><div class="ann-gt">`;
      for (const t of AN.TILES.filter(x => x.st === g.st)) h += `<button class="annT off" data-t="${t.id}" id="ann-${t.id}" title="${esc(t.label + ': ' + t.tip + ' Click: acknowledge and go to ' + g.key + '.')}">${t.label}</button>`;
      h += '</div></div>';
    }
    return h + '<div class="ann-f">A &middot; ACK ALL</div></div>';
  }

  // ---------- annunciator ----------
  function annUpdate() {
    if (!P || !S) return; annOut = P.update({ s: S, model: M(), E });
    for (const t of AN.TILES) { const l = annOut.lamps[t.id], el = $('ann-' + t.id); if (!el) continue; const k = l.state + (l.flash ? ' fl' : ''); if (el.dataset.k !== k) { el.dataset.k = k; el.className = 'annT ' + k; } const tip = t.label + (l.why ? ' (' + l.why + ')' : '') + ': ' + t.tip; if (el.title.indexOf(tip) !== 0) el.title = tip + ' Click: acknowledge and go to ' + t.key + '.'; }
    const mw = annOut.master.warning, mc = annOut.master.caution;
    $('ann-mw').className = 'annM w' + (mw.flash ? ' fl' : mw.lit ? ' lit' : ''); $('ann-mc').className = 'annM c' + (mc.flash ? ' fl' : mc.lit ? ' lit' : '');
    sound(annOut);
  }
  function unlockAudio() { if (actx || !on) return; try { const C = window.AudioContext || window.webkitAudioContext; if (C) actx = new C(); } catch (e) { actx = null; } }
  function soundOn() { const c = DECK.cfg || {}; if (c.annSound === false) return 0; let vs = {}; try { vs = window.Voice ? Voice.state() : {}; } catch (e) {} if (vs.enabled === false) return 0; return vs.volume == null ? 1 : vs.volume; }
  function beep(freqs, dur, type, gain) {
    if (!actx || actx.state === 'suspended') { try { actx && actx.resume(); } catch (e) {} if (!actx || actx.state !== 'running') return false; }
    try { const t0 = actx.currentTime; freqs.forEach((f, i) => { const o = actx.createOscillator(), g = actx.createGain(), ts = t0 + i * dur; o.type = type; o.frequency.value = f; g.gain.setValueAtTime(0, ts); g.gain.linearRampToValueAtTime(gain, ts + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, ts + dur * 0.95); o.connect(g); g.connect(actx.destination); o.start(ts); o.stop(ts + dur); }); return true; } catch (e) { return false; }
  }
  function sound(o) {
    const v = soundOn(); if (!v) return; const now = performance.now();
    const w = o.onset.some(x => x.state === 'warning'), c = o.onset.some(x => x.state === 'caution');
    if (w || (o.master.warning.flash && now - toneT > 4500)) { toneT = now; beep([880, 660, 880, 660], 0.16, 'triangle', 0.05 * v); }   // warning: a quiet two-tone, repeated while unacknowledged
    else if (c) beep([1320, 990], 0.28, 'sine', 0.035 * v);                                                                             // caution: a single soft chime
  }

  // ---------- per-frame ----------
  function frame() {
    if (!on || !built || !S) return; const t = performance.now();
    if (t - annT > 150) { annT = t; annUpdate(); }
    if (!VIEWS[view] || down) return;
    if (t - renT > 250) { renT = t; render(); }
  }
  function render() {
    const v = view, V = VIEWS[v], pg = PAGES[v]; if (!V || !pg) return; const ss = $('ss'); ss.style.setProperty('--ac', V.ac); ss.dataset.v = v;
    if (!tab[v] || !pg.tabs.some(x => x[0] === tab[v])) tab[v] = pg.tabs[0][0];
    const T = tab[v], mode = modeOf(v), ctx = { v, mode, live: mode === 'hands-on' };
    set('ss-hd', header(v, V, mode, T));
    set('ss-tabs', pg.tabs.map(([id, lab], i) => `<button class="ss-tab${id === T ? ' on' : ''}" data-tab="${id}"><small>P${i + 1}</small>${lab}</button>`).join('') + `<div class="ss-tfn">${V.fn}</div>`);
    set('ss-ban', banner(v, V, mode));
    const body = pg.render(T, ctx); if (mainKey !== body) { mainKey = body; $('ss-main').innerHTML = body; $('ss-main').className = 'ss-main pg-' + v + '-' + T; if (pg.after) pg.after(T, ctx); } else if (pg.after) pg.after(T, ctx, true);
    curSoft = (pg.soft ? pg.soft(T, ctx) : []).slice(0, 7); while (curSoft.length < 7) curSoft.push(null);
    curSoft.push({ t: 'MODE ' + MODE_TAG[mode], s: 'CYCLE AUTONOMY', act: 'mode', ctl: false, tip: 'Cycle this station\'s autonomy: Auto (the officer runs it, the screen is read-only), Supervised (the officer recommends, you approve), Hands-on (the controls are yours).' });
    set('ss-sk', curSoft.map((o, i) => o ? softHtml(o, i) : `<div class="ss-sk0"><kbd>&#8679;F${i + 1}</kbd></div>`).join(''));
    set('ss-msg', msgLine(v));
    const cb = $('ss-cbe'); if (cb) { const n = M() ? M().pending().length : 0; const tx = DECK.cur ? '' : n ? n + ' CALL' + (n > 1 ? 'S' : '') + ' WAITING &middot; SPACE TAKES THE NEXT' : 'NO CALLS WAITING'; if (cb.innerHTML !== tx) cb.innerHTML = tx; }
  }
  function set(id, h) { const el = $(id); if (el && el.dataset.h !== h) { el.dataset.h = h; el.innerHTML = h; } }
  function softHtml(o, i) {
    const ro = o.ctl !== false && !live(), dis = o.dis || ro;
    return `<button class="ss-skb${o.lit ? ' lit' : ''}${o.stub ? ' stub' : ''}${ro && !o.dis ? ' ro' : ''}" data-a="${o.act || ''}" data-arg="${esc(o.arg == null ? '' : o.arg)}" data-sk="${i}" ${dis ? 'disabled' : ''} ${o.tip ? `title="${esc(o.tip)}"` : ''}><kbd>&#8679;F${i + 1}</kbd><b>${o.t}</b><small>${o.s || ''}</small></button>`;
  }
  function header(v, V, mode, T) {
    const who = V.who.map(n => crewName(n).toUpperCase()).join(' &middot; '), heat = (S.heat || 'cold').toUpperCase(), sp = E.SPEED[S.speed];
    const stance = { still: 'HOLDING', route: 'ON PLAN', evade: 'EVASIVE', close: 'CLOSING', separate: 'OPENING', orbit: 'CIRCLING' }[S.posture] || String(S.posture).toUpperCase();
    const sel = selId != null && S.an[selId] ? 'S' + (selId + 1) : '--', lab = (PAGES[v].tabs.find(x => x[0] === T) || ['', ''])[1];
    return `<div class="hd-k">${V.k}</div><div class="hd-n"><b>${V.name}</b><span>${who}</span></div><div class="hd-m m-${mode.replace('-', '')}" title="Autonomy: ${mode}">${MODE_TAG[mode]}</div><div class="hd-p">${lab}</div>`
      + `<div class="hd-f"><span>SEL</span><b>${sel}</b></div><div class="hd-f"><span>POSTURE</span><b class="pz-${S.heat || 'cold'}">${heat}</b><i>${stance} &middot; ${sp ? sp.label.toUpperCase() : ''}</i></div><div class="hd-f clk"><span>MISSION</span><b>${mmss(S.t)}</b></div>`;
  }
  function activity(v) {   // what the officer is doing right now (the Auto view's live line)
    const lk = S.an.filter(a => a.state === 'locked');
    if (v === 'sen') { const on = S.analysts.filter(w => w.task != null); const best = S.an.filter(a => a.state === 'open' && a.idStatus !== 'plan').map(a => ({ a, c: E.classify(S, a) })).filter(x => x.c.n > 0).sort((x, y) => y.c.p - x.c.p)[0];
      return (on.length ? on.map(w => crewName(w.name).toUpperCase() + ' ON S' + (w.task + 1)).join(', ') : 'SWEEPING ALL TRACKS') + (best ? ` &middot; S${best.a.id + 1} CLASSIFY ${pct(best.c.p)} ${({ real: 'WARSHIP', lure: 'DECOY', ghost: 'STATIC' })[best.c.best]}` : ''); }
    if (v === 'fc') return lk.length ? lk.map(a => { const si = E.solveInfo(S, a); return 'S' + (a.id + 1) + (si.ready ? ' SOLUTION READY' : si.stale ? ' STALE' : ' SOLVING ' + pct(si.prog)); }).join(' &middot; ') : 'NO LOCKS: NOTHING TO SOLVE';
    if (v === 'wpn') { const rd = S.tubes.filter(x => S.t >= x).length; return `${rd}/${S.tubes.length} TUBES READY &middot; MAG ${S.mag.total}/${S.mag.max} &middot; PRESET ${A().salvo.name.toUpperCase()} &middot; PD ${S.pd.toUpperCase()}`; }
    if (v === 'str') { const left = S.route.length - S.routeI; return (S.posture === 'route' && left ? `ON PLAN, ${left} WAYPOINT${left > 1 ? 'S' : ''} LEFT` : S.posture === 'still' ? 'HOLDING POSITION' : String(S.posture).toUpperCase()) + ' &middot; DRIVE ' + E.SPEED[S.speed].label.toUpperCase(); }
    if (v === 'eng') { const r = E.heatRate(S); return `SINK ${pct(S.sink.h)} ${S.vent.on ? 'VENTING' : r > 0.0003 ? 'FILLING' : r < -0.0003 ? 'DRAINING' : 'STEADY'} &middot; FINS ${S.vent.on ? 'OUT' : 'IN'} &middot; SIGNATURE ${(S.heat || 'cold').toUpperCase()}`; }
    if (v === 'dmg') return `HULL ${Math.round(S.hull)}% &middot; SYSTEMS ${pct(S.sysEff)} &middot; PRIORITY ${(S.dmgPriority || 'sink').toUpperCase()}`;
    return 'LISTENING &middot; NOTHING ON THE LINK';
  }
  function banner(v, V, mode) {
    const who = crewName(V.who[0]).toUpperCase();
    if (mode === 'auto') return `<b class="bm a">AUTO &middot; READ-ONLY</b><span>${who}: ${activity(v)}</span>`;
    if (mode === 'hands-on') return `<b class="bm h">HANDS-ON &middot; CONTROLS LIVE</b><span>${who} ACKS YOUR ORDERS &middot; ${activity(v)}</span>`;
    const c = M() ? M().pending().find(x => V.st.includes(x.station) && x.opts) : null;
    if (!c) return `<b class="bm s">SUPERVISED</b><span>${who}: NO RECOMMENDATION PENDING &middot; ${activity(v)}</span>`;
    const rec = M().defaultIndex(c);
    return `<b class="bm s">SUPERVISED &middot; ${who} RECOMMENDS</b><span class="rl">${esc(c.line)}</span>` + c.opts.slice(0, 4).map((o, i) => `<button class="bchip${i === rec ? ' rec' : ''}" data-a="answer" data-arg="${c.id}:${i}">${i === rec ? '&#10003; APPROVE: ' : ''}${esc(o.label)}</button>`).join('');
  }
  function msgLine(v) {
    const m = M(); if (!m) return ''; const V = VIEWS[v], os = m.orders; let o = null;
    for (let i = os.length - 1; i >= 0; i--) if (V.st.includes(os[i].station)) { o = os[i]; break; }
    if (!o) o = os[os.length - 1];
    if (!o) return '<span class="ml-k">ORDERS</span><span class="ml-t">NO ORDERS YET</span>';
    const who = crewName(o.officer).toUpperCase(), lab = esc(Stations.captainLine(o.label).replace(/\.$/, '')).toUpperCase(), stg = ['issued', 'acked', 'executing', 'reported'], si = stg.indexOf(o.stage);
    const by = o.by === 'co' ? 'CAPTAIN' : o.by === 'doctrine' ? 'DOCTRINE' : 'DEFAULT';
    const txt = si === 0 ? `${by} &rarr; ${who}: ${lab}` : si === 1 ? `${who}: AYE, ${lab}` : si === 2 ? `${who}: ${lab}, EXECUTING` : `${who}: ${lab}, DONE`;
    return `<span class="ml-k">LAST ORDER</span><span class="ml-t">${txt}</span><span class="ml-s">${['ISSUED', 'ACKED', 'EXEC', 'DONE'].map((x, i) => `<i class="${i < si ? 'p' : i === si ? 'c' : ''}">${x}</i>`).join('')}</span>`;
  }

  // ---------- input ----------
  function onDown(e) {
    const tb = e.target.closest('[data-tab]'); if (tb) { e.preventDefault(); tab[view] = tb.dataset.tab; mainKey = ''; render(); return; }
    const b = e.target.closest('button[data-a],[data-sel],button[data-dk]'); if (!b || b.disabled) { down = true; return; }
    e.preventDefault(); act(b);
  }
  function act(b) {
    if (!S || S.over) return;
    if (b.dataset.sel != null) { selId = +b.dataset.sel; mainKey = ''; uiUpdate(true); render(); return; }
    if (b.dataset.dk) { if (!live()) return; DECK.panelAct(b.dataset.dk, b.dataset.arg); mainKey = ''; render(); return; }
    const a = b.dataset.a, arg = b.dataset.arg;
    if (a === 'mode') { cycleMode(view); return; }
    if (a === 'answer') { const [id, i] = arg.split(':').map(Number); M() && M().answer(id, i); render(); return; }
    if (a === 'tab') { tab[view] = arg; mainKey = ''; render(); return; }
    const pg = PAGES[view]; if (pg && pg.act) { if (b.classList.contains('ro')) return; pg.act(a, arg, b); mainKey = ''; uiUpdate(true); render(); }
  }
  function cycleMode(v) {
    const m = M(); if (!m || !VIEWS[v]) return; const cur = modeOf(v), nx = MODES[(MODES.indexOf(cur) + 1) % 3];
    VIEWS[v].st.forEach(k => { m.setAutonomy(k, nx); if (DECK.cfg) DECK.cfg.autonomy[k] = nx; }); DECK.saveCfg && DECK.saveCfg(); mainKey = ''; render();
  }
  function softkey(i) { if (!on || !VIEWS[view]) return false; const o = curSoft[i]; if (!o) return false; const b = document.querySelector(`#ss-sk [data-sk="${i}"]`); if (b && !b.disabled) act(b); return true; }

  return { on, build, frame, softkey, render, cycleMode, PAGES, VIEWS, tab, helpers: { key, panel, stub, pct, brg, obsPos, quality, esc, live, modeOf },
    ackAll: () => { if (P) { P.ackAll(); annT = 0; } }, get ann() { return annOut; }, annUpdate, get audio() { return actx ? actx.state : 'none'; } };
})();
