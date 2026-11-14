/* ===== Station pages (docs/station_screens.md s3): what each F-key screen shows inside the frame of web/station_screens.js.
 * Each page: { tabs: [[id, label]], render(tab, ctx) -> html, soft(tab, ctx) -> softkeys, act(action, arg) }. Inlined after station_screens.js.
 * Engine calls only through what exists (E.* and the station adapter); anything not simulated is a NOT YET SIMULATED stub with no behaviour.
 */
(() => {
  if (typeof SCREENS === 'undefined' || !SCREENS.on) return;
  const { PAGES, VIEWS } = SCREENS, H = SCREENS.helpers, { key, panel, stub, pct, brg, obsPos, quality, esc } = H;
  const CHN = [['thermal', 'HEAT', '#ff8a4c'], ['reactor', 'REACTOR', '#6fc3d0'], ['occlusion', 'ECLIPSE', '#b79cff']];
  const A = () => DECK.adapter;
  const sel = () => (selId != null && S.an[selId] ? S.an[selId] : null);
  const liveT = a => a && ['open', 'locked'].includes(a.state) && a.idStatus !== 'plan';
  const tracks = () => S.an.filter(a => a.state !== 'out');
  function selStep(d) { const L = tracks(); if (!L.length) return; const i = L.findIndex(a => a.id === selId); selId = L[((i < 0 ? 0 : i + d) + L.length) % L.length].id; }
  const rangeBand = a => { const p = obsPos(a), d = Math.hypot(p.x - S.player.x, p.y - S.player.y), r = a.idStatus === 'plan' ? 0 : E.uncertainty(S, a).r; return { d, r, lo: Math.max(0, d - r), hi: d + r }; };
  const qcls = q => ({ AFFIRMED: 'qa', PASSIVE: 'qp', SUSPECTED: 'qs', ALLY: 'qf' })[q];
  const mini = (v, col, p) => `<span class="mb"><i style="width:${Math.round(v)}%;background:${col}"></i>${p != null ? `<u style="width:${Math.round(p)}%"></u>` : ''}</span>`;
  const segs = (n, max, col, cells) => { let h = '<span class="seg">'; const k = cells || max; for (let i = 0; i < k; i++) h += `<i style="${i < Math.round(n / max * k) ? 'background:' + col : ''}"></i>`; return h + '</span>'; };

  // ======================= F2 SENSORS =======================
  function senTracks() {
    const rows = tracks().map(a => {
      const q = quality(a), b = rangeBand(a), vm = slipVM(a), on = S.analysts.filter(w => w.task === a.id).map(w => crewName(w.name).toUpperCase().slice(0, 3)).join(' ');
      const st = a.state === 'disabled' ? 'DERELICT' : a.state === 'locked' ? 'LOCKED' : a.state === 'chasing' ? 'CHASING' : 'OPEN';
      const rd = vm.chans.map((c, i) => mini(c.off ? 0 : c.sig, CHN[i][2], c.prog)).join('');
      return `<tr class="${qcls(q)}${a.id === selId ? ' sel' : ''}${a.state === 'disabled' ? ' dim' : ''}" data-sel="${a.id}"><td class="tk">S${a.id + 1}</td><td><span class="ql">${q}</span></td><td>${brg(E.brgOf(S.player, obsPos(a)))}</td><td>${a.lastRead ? fmtMin(S.t - a.lastRead) : '--:--'}</td><td>${b.r ? Math.round(b.lo) + '&ndash;' + Math.round(b.hi) : Math.round(b.d)}</td><td class="cl">${esc(clsLabel(a))}</td><td class="rd">${rd}</td><td>${st}</td><td>${on || '<span class="dm">SWEEP</span>'}</td></tr>`;
    }).join('');
    return panel('trk', 'TRACK TABLE', 'BRG AND RANGE ARE OUR ESTIMATE, NOT TRUTH &middot; CLICK A ROW TO SELECT EVERYWHERE',
      `<table class="tt"><thead><tr><th>TRK</th><th>QUALITY</th><th>BRG</th><th>AGE</th><th>RANGE KM</th><th>CLASS GUESS</th><th>H &middot; R &middot; V</th><th>STATE</th><th>ON IT</th></tr></thead><tbody>${rows}</tbody></table>
       <div class="legend"><span class="qa">AFFIRMED</span> fired, pinged, vented, or answered: known <span class="qp">PASSIVE</span> the readings say so (80%+) <span class="qs">SUSPECTED</span> not yet <span class="qf">ALLY</span> flagged at entry</div>`, 'g-trk');
  }
  function senChannels() {
    const a = sel();
    if (!a) return panel('chn', 'CHANNELS', 'NO TRACK SELECTED', '<div class="empty">SELECT A TRACK IN THE TABLE</div>', 'g-chn');
    const vm = slipVM(a), b = rangeBand(a);
    const strips = vm.chans.map((c, i) => {
      const [ch, lab, col] = CHN[i], w = E.ANALYSTS.find(x => x.ch === ch), q = a.read[ch], held = S.analysts.find(x => x.id === w.id).task === a.id;
      const state = c.off ? (q && q.blind ? (ch === 'occlusion' ? 'NOT BACKLIT' : 'BLIND') : 'N/A') : c.done ? 'READ' : q && q.den > 0 ? 'READING' : 'NOT READ';
      return `<div class="cs"><div class="cs-h"><b style="color:${col}">${lab}</b><span>${crewName(w.name).toUpperCase()}</span><em>${held ? 'HELD' : 'SWEEP'}</em></div>
        <div class="cs-b"><span class="cs-bar"><i style="width:${c.off ? 0 : c.sig}%;background:${col}"></i><s style="left:50%"></s><s style="left:80%"></s></span><b class="num">${c.off ? '--' : c.done ? 'OK' : c.n}</b></div>
        <div class="cs-f"><span class="cs-p"><i style="width:${c.prog}%"></i></span><span>${state}</span><span>${q && q.t != null && !q.blind ? fmtMin(S.t - q.t) + ' AGO' : ''}</span>${key({ act: 'assign', arg: w.id + ':' + a.id, t: held ? 'RELEASE' : 'HOLD ON S' + (a.id + 1), dis: !liveT(a), cls: 'mini' })}</div></div>`;
    }).join('');
    return panel('chn', 'CHANNELS S' + (a.id + 1), `${esc(clsLabel(a))} &middot; BRG ${brg(E.brgOf(S.player, obsPos(a)))} &middot; ${b.r ? Math.round(b.lo) + '&ndash;' + Math.round(b.hi) : Math.round(b.d)} KM`, strips + '<div class="note">BAR: HOW MUCH IT LOOKS LIKE A WARSHIP ON THAT SIGNAL &middot; UNDERLINE: READS TOWARD A FIRM CALL</div>', 'g-chn');
  }
  function senAnalysts() {
    const a = sel(), rows = S.analysts.map(w => {
      const d = E.ANALYSTS.find(x => x.id === w.id), col = CHN.find(c => c[0] === d.ch)[2];
      return `<tr><td><b style="color:${col}">${crewName(w.name).toUpperCase()}</b></td><td class="dm">${d.ch === 'occlusion' ? 'ECLIPSE' : d.ch.toUpperCase()}</td><td>${w.task != null ? 'ON S' + (w.task + 1) : '<span class="dm">SWEEPING</span>'}</td><td>${key({ act: 'assign', arg: w.id + ':' + (a ? a.id : ''), t: a && w.task === a.id ? 'RELEASE' : 'ON SEL', dis: !liveT(a), cls: 'mini' })}</td></tr>`;
    }).join('');
    const all = a && S.analysts.every(w => w.task === a.id);
    return panel('ana', 'ANALYST ASSIGNMENTS', 'ONE CHANNEL EACH &middot; FOCUS READS 2X, ADDS HEAT', `<table class="tt tc">${rows}</table><div class="krow">${key({ act: 'invest', t: all ? 'RELEASE ALL' : 'INVESTIGATE', s: a ? 'ALL THREE ON S' + (a.id + 1) : 'SELECT A TRACK', dis: !liveT(a) })}</div>`, 'g-ana');
  }
  function senPing() {
    const a = sel(), dark = S.t < S.quietUntil, cd = Math.max(0, S.pingCd - S.t), ok = liveT(a) && !dark && cd <= 0;
    return panel('png', 'ACTIVE PING', 'DIRECTIONAL &middot; LOUD', `<div class="pg-row">${key({ act: 'ping', t: 'PING' + (a ? ' S' + (a.id + 1) : ''), s: dark ? 'NOT WHILE QUIET' : cd > 0 ? 'READY IN ' + fmtMin(cd) : 'CRISP FIX', dis: !ok, warn: ok, cls: 'wide' })}
      <div class="pg-t"><span class="lmp ${cd > 0 ? 'a' : dark ? 'c' : 'g'}"></span>${cd > 0 ? 'RECHARGING ' + fmtMin(cd) : dark ? 'SENSORS DARK' : 'READY'}<br><span class="dm">EVERY HUNTER WITHIN TWICE ITS RANGE HEARS IT; A REAL SHIP TURNS TOWARD US</span></div></div>`, 'g-png');
  }
  function senGhosts() {
    const out = S.an.filter(a => a.state === 'out'), lost = (S.evts || []).filter(e => e.type === 'track_lost').slice(-12).reverse();
    const r1 = out.length ? out.map(a => `<tr class="${a.id === selId ? 'sel' : ''}" data-sel="${a.id}"><td class="tk">S${a.id + 1}</td><td>RULED OUT</td><td>${brg(E.brgOf(S.player, obsPos(a)))}</td><td>${a.lastRead ? fmtMin(S.t - a.lastRead) : '--:--'}</td><td>${key({ act: 'reanalyze', arg: a.id, t: 'RE-ANALYZE', cls: 'mini' })}</td></tr>`).join('') : '<tr><td colspan="5" class="dm">NOTHING RULED OUT</td></tr>';
    const r2 = lost.length ? lost.map(e => `<tr><td class="tk">S${(e.data.id || 0) + 1}</td><td>THERMAL GHOST</td><td>${fmtMin(e.t)}</td><td class="dm">${e.data.ghost ? 'MARKED AT LAST BEARING' : 'TRACK WENT LAST'}</td></tr>`).join('') : '<tr><td colspan="4" class="dm">NO LOST TRACKS</td></tr>';
    return panel('gho', 'RULED OUT', 'DISMISSED CONTACTS &middot; A REAL SHIP DISMISSED IS A SHIP LOST', `<table class="tt"><thead><tr><th>TRK</th><th>STATE</th><th>BRG</th><th>AGE</th><th></th></tr></thead><tbody>${r1}</tbody></table>`, 'g-gho1')
      + panel('gh2', 'GHOST LIST', 'LOCKED TRACKS THAT WENT LAST (TRACK LOST EVENTS)', `<table class="tt"><thead><tr><th>TRK</th><th>MARK</th><th>AT</th><th></th></tr></thead><tbody>${r2}</tbody></table>`, 'g-gho2');
  }
  PAGES.sen = {
    tabs: [['trk', 'TRACKS'], ['gho', 'GHOSTS']],
    render: t => t === 'gho' ? senGhosts() : senTracks() + senChannels() + senAnalysts() + senPing(),
    soft: t => { const a = sel(); return [{ t: 'PREV TRK', s: '&#9650;', act: 'prev', ctl: false }, { t: 'NEXT TRK', s: '&#9660;', act: 'next', ctl: false },
      { t: 'INVESTIGATE', s: 'ALL ANALYSTS', act: 'invest', dis: !liveT(a) }, { t: 'ACTIVE PING', s: 'LOUD', act: 'ping', dis: !liveT(a) || S.t < S.pingCd || S.t < S.quietUntil },
      { t: 'LOCK ON', s: 'TO FIRE CONTROL', act: 'lock', dis: !a || a.state !== 'open' || a.idStatus === 'plan' }, { t: 'DISMISS', s: 'RULE OUT', act: 'dismiss', dis: !a || a.state !== 'open' || a.idStatus === 'hostile' || a.idStatus === 'plan' },
      { t: 'RE-ANALYZE', s: 'RULED OUT ONLY', act: 'reanalyze', arg: a ? a.id : '', dis: !a || a.state !== 'out' }]; },
    act: (k, arg) => {
      const a = sel();
      if (k === 'prev') selStep(-1); else if (k === 'next') selStep(1);
      else if (k === 'assign') { const [w, id] = arg.split(':'); if (id !== '') E.assign(S, w, +id); }
      else if (k === 'invest' && a) E.investigate(S, a.id); else if (k === 'ping' && a) E.pingContact(S, a.id);
      else if (k === 'lock' && a) E.lockContact(S, a.id); else if (k === 'dismiss' && a) E.dismissContact(S, a.id);
      else if (k === 'reanalyze') { const id = arg !== '' ? +arg : a && a.id; if (id != null) { E.reanalyze(S, id); selId = id; } }
    }
  };

  // ======================= F4 WEAPONS (payload control) =======================
  let armed = null;   // the launch-control ARM state: the track id the salvo is armed for (a UI interlock, not an engine state)
  const wpnTarget = () => { const a = sel(); if (a && a.state === 'locked') return a; const lk = S.an.filter(x => x.state === 'locked'); return lk.find(x => E.solveInfo(S, x).ready) || lk[0] || null; };
  function launchState() {
    const a = wpnTarget(), si = a ? E.solveInfo(S, a) : null, tube = S.tubes.some(x => S.t >= x), dark = S.t < S.quietUntil, mag = S.mag.total > 0, p = A().salvo;
    const kindOk = p.probe ? mag : S.mag.byKind[p.warhead] > 0;
    const ready = !!(a && si.ready && !si.stale && tube && !dark && kindOk && !p.probe);
    if (armed != null && (!a || armed !== a.id || !ready)) armed = null;
    const why = !a ? 'NO LOCKED TRACK' : p.probe ? 'PROBE PRESET: USE PROBE SALVO' : !si.ready ? 'SOLUTION ' + pct(si.prog) : si.stale ? 'SOLUTION STALE' : !tube ? 'TUBES RELOADING' : dark ? 'QUIET: NO LAUNCHES' : !kindOk ? 'NO ' + p.warhead.toUpperCase() + ' LEFT' : 'READY';
    return { a, si, ready, why };
  }
  function wpnMag() {
    const m = S.mag, K = [['he', 'HE', '#d7c9a0', 'STANDARD: HULL DAMAGE'], ['emp', 'EMP', '#9cc7d6', 'CUTS SYSTEMS'], ['flare', 'FLARE', '#e0b07a', 'LIGHTS THE TARGET']];
    const max0 = { he: P.player.magHe, emp: P.player.magEmp, flare: P.player.magFlare };
    const rows = K.map(([k, l, c, d]) => `<div class="mg"><b>${l}</b>${segs(m.byKind[k], Math.max(1, max0[k] || m.byKind[k]), c, Math.min(24, Math.max(6, max0[k] || 6)))}<span class="num">${String(m.byKind[k]).padStart(2, '0')}</span><em>${d}</em></div>`).join('');
    const low = m.total <= P.player.magLow;
    return panel('mag', 'MAGAZINE', `${Math.floor(m.total / m.perSalvo)} FULL SALVOS &middot; ${m.perSalvo} PER TUBE`, `<div class="bigr"><span class="num ${m.total <= 0 ? 'r' : low ? 'a' : ''}">${m.total}</span><small>/ ${m.max} ROUNDS</small></div>${rows}`, 'g-mag');
  }
  function wpnTubes() {
    const rel = S.me.reload, h = S.tubes.map((x, i) => { const left = Math.max(0, x - S.t), f = left > 0 ? 1 - left / rel : 1; return `<div class="tb ${left > 0 ? 'ld' : 'rdy'}"><b>TUBE ${i + 1}</b><span class="tb-bar"><i style="width:${Math.round(f * 100)}%"></i></span><span class="num">${left > 0 ? mmss(left) : 'READY'}</span></div>`; }).join('');
    const fly = (S.volleys || []).length, pr = (S.probes || []).length;
    return panel('tub', 'TUBES', `${S.tubes.filter(x => S.t >= x).length}/${S.tubes.length} READY &middot; IN FLIGHT ${fly + pr}`, h, 'g-tub');
  }
  function timeline(p, tfSec) {   // run-to-enable timeline: launch, dark run (RTE), seeker wakes, impact
    const W = 560, x0 = 20, x1 = W - 20, T = Math.max(p.rte + 4, tfSec || p.rte * 2.2), X = s => x0 + (x1 - x0) * Math.min(1, s / T);
    let s = `<svg class="tl" viewBox="0 0 ${W} 74"><line x1="${x0}" y1="40" x2="${x1}" y2="40" stroke="#2e423b" stroke-width="2"/>`;
    s += `<rect x="${x0}" y="31" width="${(X(p.rte) - x0).toFixed(1)}" height="18" fill="#1f2b38" stroke="#4b6a86"/><text x="${((x0 + X(p.rte)) / 2).toFixed(1)}" y="44" text-anchor="middle" font-size="12" fill="#a9c3dc" font-family="IBM Plex Mono,monospace">DARK RUN ${p.rte} S${tfSec && tfSec < p.rte ? ' (LONGER THAN THE FLIGHT)' : ''}</text>`;
    s += `<rect x="${X(p.rte).toFixed(1)}" y="31" width="${(x1 - X(p.rte)).toFixed(1)}" height="18" fill="${p.homing ? '#2a2414' : '#151b19'}" stroke="${p.homing ? '#8c7440' : '#33453e'}"/><text x="${((X(p.rte) + x1) / 2).toFixed(1)}" y="44" text-anchor="middle" font-size="12" fill="${p.homing ? '#d9c08a' : '#7d958b'}" font-family="IBM Plex Mono,monospace">${x1 - X(p.rte) < 110 ? '' : p.homing ? 'SEEKER HOMING' : 'BALLISTIC'}</text>`;
    s += `<line x1="${x0}" y1="22" x2="${x0}" y2="58" stroke="#cfe3da" stroke-width="2"/><text x="${x0}" y="16" font-size="11" fill="#9fb4ad" font-family="IBM Plex Mono,monospace">LAUNCH</text>`;
    s += `<line x1="${X(p.rte).toFixed(1)}" y1="24" x2="${X(p.rte).toFixed(1)}" y2="56" stroke="#8fb7d8" stroke-dasharray="3 3"/><text x="${X(p.rte).toFixed(1)}" y="68" text-anchor="middle" font-size="11" fill="#8fb7d8" font-family="IBM Plex Mono,monospace">ENABLE</text>`;
    s += `<line x1="${x1}" y1="22" x2="${x1}" y2="58" stroke="#e8a08f" stroke-width="2"/><text x="${x1}" y="16" text-anchor="end" font-size="11" fill="#e8a08f" font-family="IBM Plex Mono,monospace">${tfSec ? 'IMPACT ~' + Math.round(tfSec) + ' S' : 'IMPACT'}</text>`;
    if (p.wire) s += `<line x1="${x0}" y1="54" x2="${X(p.rte).toFixed(1)}" y2="54" stroke="#6fa0c8" stroke-width="2" stroke-dasharray="1 4"/><text x="${x0 + 4}" y="68" font-size="10" fill="#6fa0c8" font-family="IBM Plex Mono,monospace">WIRE</text>`;
    return s + '</svg>';
  }
  function wpnSalvo() {
    const p = A().salvo, ns = SalvoPresets.NOT_SIMULATED, L = launchState();
    let tf = null; try { if (L.a && L.a.anchor) { const f = E.fanInfo(S, L.a, null); tf = f && f.tf ? f.tf * P.secPerMin : null; } } catch (e) { tf = null; }
    const pres = SalvoPresets.ids.map(id => { const q = SalvoPresets.PRESETS[id]; return key({ act: 'preset', arg: id, t: q.name, s: q.count + ' MSL &middot; ' + q.key, lit: p.id === id, tip: q.tip, cls: 'pre' }); }).join('');
    const prm = [['PATTERN', p.pattern, 'pattern'], ['RUN TO ENABLE', p.rte + ' S', 'rte'], ['HOMING', p.homing ? 'ON' : 'OFF', 'homing'], ['WIRE', p.wire ? 'ON' : 'OFF', 'wire'], ['WARHEAD', p.warhead, 'warhead'], ['CONE', p.cone + ' KM', 'cone'], ['COUNT', p.count + (p.probe ? ' PROBE' : ' / ' + Math.ceil(p.count / 6) + ' TUBE' + (p.count > 6 ? 'S' : '')), 'count']]
      .map(([l, v, k]) => `<tr><td class="dm">${l}</td><td class="pv">${esc(String(v).toUpperCase())}</td><td>${ns.includes(k) ? stub() : '<span class="sim">SIMULATED</span>'}</td></tr>`).join('');
    return panel('slv', 'SALVO PLANNER', 'A SALVO IS A PLAN, NOT A TRIGGER', `<div class="krow pres">${pres}</div><div class="slv-g"><table class="tt tp">${prm}</table><div class="slv-t"><div class="lbl2">RUN-TO-ENABLE TIMELINE ${ns.includes('rte') ? stub('DARK RUN') : ''}</div>${timeline(p, tf)}<div class="note">${esc(p.tip)}</div></div></div>`, 'g-slv');
  }
  function wpnLaunch() {
    const L = launchState(), p = A().salvo, a = L.a;
    const lamp = (on, lab, c) => `<div class="lc"><span class="lmp ${on ? c : ''}"></span><b>${lab}</b></div>`;
    return panel('lch', 'LAUNCH CONTROL', a ? 'TARGET S' + (a.id + 1) + ' &middot; ' + esc(clsLabel(a)) : 'NO TARGET', `<div class="lch-g"><div class="lch-l">${lamp(L.ready, 'READY', 'g')}${lamp(armed != null, 'ARMED', 'a')}${lamp((S.volleys || []).length > 0, 'AWAY', 'c')}</div>
      <div class="lch-k">${key({ act: 'arm', t: armed != null ? 'SAFE' : 'ARM', s: armed != null ? 'DISARM' : L.why, dis: !L.ready && armed == null, lit: armed != null })}${key({ act: 'fire', t: 'FIRE', s: armed != null ? p.name.toUpperCase() + ' &middot; ' + p.count + ' MSL' : 'ARM FIRST', dis: armed == null, warn: armed != null, cls: 'fire' })}${key({ act: 'probe', t: 'PROBE SALVO', s: '2 MSL, NO PING', dis: !(S.an[selId] && S.an[selId].state !== 'out' && S.an[selId].idStatus !== 'plan') || S.t < S.quietUntil || S.mag.total <= 0 })}</div></div>
      <div class="note">FIRE GOES TO ABARA AS AN ORDER (ISSUED, ACKED, EXECUTING) &middot; SOLUTION ${a ? (L.si.ready ? 'READY' : L.si.stale ? 'STALE' : pct(L.si.prog)) : '--'}</div>`, 'g-lch');
  }
  function wpnPD() {
    const ic = E.pdIntercept(S, 9), st = S.pd;
    const ks = [['off', 'OFF', 'NO INTERCEPTS'], ['armed', 'ARMED', 'COLD, SLOW'], ['active', 'ACTIVE', 'LIT: SEEN BY ALL']].map(([k, t, s]) => key({ act: 'pd', arg: k, t, s, lit: st === k, warn: k === 'active' && st === 'active' })).join('');
    return panel('pd', 'POINT DEFENCE', 'DOCTRINE: ACTIVE ON VAMPIRE', `<div class="krow">${ks}</div><div class="pd-r"><span>STATE <b class="${st === 'active' ? 'a' : st === 'armed' ? 'c' : 'dm'}">${st.toUpperCase()}</b></span><span>INTERCEPT PER WARHEAD <b class="num">${pct(ic)}</b></span><span>INBOUND <b class="num ${S.inc.length ? 'r' : ''}">${S.inc.length}</b></span></div>`, 'g-pd');
  }
  const PROBESETS = [   // placeholders (docs/station_model.md s8.4): the rack holds two sets; sets come off hulls and carry their lineage's traits
    { id: 'A', lin: 'ORRIN', n: 3, link: 'LASER + RADIO', tr: 'QUIET, PASSIVE, LASER-CAPABLE &middot; FRAGILE, SHORT-LIVED' },
    { id: 'B', lin: 'VASK', n: 6, link: 'RADIO', tr: 'RUGGED, LONG-RANGE &middot; LOUD, RADIO-HEAVY' }];
  function wpnProbes() {
    const card = ps => `<div class="psc"><div class="psc-h"><b>SET ${ps.id}</b><span>${ps.lin}</span><em>STOWED</em></div><div class="psc-n">${'<i></i>'.repeat(ps.n)}<span>${ps.n} PROBES</span></div><div class="psc-r"><span class="dm">LINK</span> ${ps.link}</div><div class="psc-r dm">${ps.tr}</div>
      <div class="krow">${key({ act: 'nys', t: 'DEPLOY', s: 'NOT YET SIMULATED', dis: true, stub: true, ctl: false })}${key({ act: 'nys', t: 'RECOVER', s: 'RADIO HAIL', dis: true, stub: true, ctl: false })}</div></div>`;
    return panel('prb', 'PROBE SETS', 'RACK OF TWO &middot; ' + stub(), `<div class="psg">${PROBESETS.map(card).join('')}</div><div class="note">LINEAGES: ORRIN (NEVER BE FOUND) &middot; VASK (LINE FLEET) &middot; HALDEN (LOGISTICS: REPAIRABLE, LONG-LIVED). NOT RELOADABLE IN BATTLE; RECOVERY BY RADIO HAIL ONLY.</div>`, 'g-prb');
  }
  function wpnCM() {
    return panel('cm', 'COUNTERMEASURES', stub(), `<div class="krow">${key({ act: 'nys', t: 'DECOY', s: 'NOT YET SIMULATED', dis: true, stub: true, ctl: false })}${key({ act: 'nys', t: 'JAMMER', s: 'NOT YET SIMULATED', dis: true, stub: true, ctl: false })}</div>`, 'g-cm');
  }
  function wpnPresets() {
    const ns = SalvoPresets.NOT_SIMULATED, F = ['pattern', 'rte', 'homing', 'wire', 'warhead', 'cone', 'count'];
    const rows = F.map(f => `<tr><td class="dm">${f === 'rte' ? 'RUN TO ENABLE' : f.toUpperCase()}${ns.includes(f) ? ' ' + stub() : ''}</td>${SalvoPresets.ids.map(id => { const v = SalvoPresets.PRESETS[id][f]; return `<td class="${A().salvo.id === id ? 'cur' : ''}">${typeof v === 'boolean' ? (v ? 'ON' : 'OFF') : String(v).toUpperCase()}${f === 'rte' ? ' S' : f === 'cone' ? ' KM' : ''}</td>`; }).join('')}</tr>`).join('');
    return panel('pre', 'PRESETS COMPARED', 'CHOOSE ONE ON P1 OR WITH SHIFT+F1-F4', `<table class="tt"><thead><tr><th></th>${SalvoPresets.ids.map(id => `<th>${SalvoPresets.PRESETS[id].name.toUpperCase()}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table><div class="pre-tips">${SalvoPresets.ids.map(id => `<p><b>${SalvoPresets.PRESETS[id].name.toUpperCase()}</b> ${esc(SalvoPresets.PRESETS[id].tip)}</p>`).join('')}</div>`, 'g-pre');
  }
  PAGES.wpn = {
    tabs: [['lch', 'LAUNCH'], ['pre', 'PRESETS']],
    render: t => t === 'pre' ? wpnPresets() : wpnMag() + wpnTubes() + wpnCM() + wpnSalvo() + wpnLaunch() + wpnPD() + wpnProbes(),
    soft: () => { const L = launchState(), p = A().salvo; return SalvoPresets.ids.map(id => ({ t: SalvoPresets.PRESETS[id].name, s: 'PRESET', act: 'preset', arg: id, lit: p.id === id }))
      .concat([{ t: armed != null ? 'SAFE' : 'ARM', s: L.why, act: 'arm', dis: !L.ready && armed == null, lit: armed != null }, { t: 'FIRE', s: armed != null ? 'ARMED' : 'ARM FIRST', act: 'fire', dis: armed == null },
        { t: 'PD ' + (S.pd === 'active' ? 'ARMED' : 'ACTIVE'), s: 'POINT DEFENCE', act: 'pd', arg: S.pd === 'active' ? 'armed' : 'active' }]); },
    act: (k, arg) => {
      const L = launchState();
      if (k === 'preset') { A().setPreset(arg); DECK.cfg.preset = arg; DECK.saveCfg(); }
      else if (k === 'arm') armed = armed != null ? null : L.ready ? L.a.id : null;
      else if (k === 'fire') { if (armed != null && L.ready && L.a.id === armed) { A().order('weapons', 'fire', 'Fire (preset)', { id: armed, n: armed + 1 }); armed = null; } }
      else if (k === 'probe') { const a = S.an[selId]; if (a) A().order('weapons', 'probe', 'Probe', { id: a.id, n: a.id + 1 }); }
      else if (k === 'pd') E.setPD(S, arg);
    }
  };

  // ======================= F3 FIRE CONTROL (target motion analysis) =======================
  // bearing history: what we observed (E.displayPos: the estimate with its noise and drift), never ground truth. Sampled every 0.1 game minutes.
  const BT = { s: null, t: -1, h: {} };
  SCREENS.ticks.push(() => {
    if (BT.s !== S) { BT.s = S; BT.t = -1; BT.h = {}; }
    if (S.t - BT.t < 0.1) return; BT.t = S.t;
    for (const a of S.an) {
      if (a.state === 'out' || a.state === 'disabled' || a.idStatus === 'plan') continue;
      const p = E.displayPos(S, a), d = Math.max(0.5, Math.hypot(p.x - S.player.x, p.y - S.player.y)), r = E.uncertainty(S, a).r;
      const L = BT.h[a.id] || (BT.h[a.id] = []); L.push({ t: S.t, b: E.brgOf(S.player, p), w: Math.min(60, Math.atan2(r, d) * 180 / Math.PI), d });
      while (L.length && S.t - L[0].t > 8) L.shift();
    }
  });
  const unwrap = (b, ref) => { let x = b; while (x - ref > 180) x -= 360; while (x - ref < -180) x += 360; return x; };
  function btPlot(a) {
    const W = 640, Hh = 420, x0 = 54, x1 = W - 14, y0 = 26, y1 = Hh - 30, span = 6, L = (BT.h[a.id] || []).filter(q => S.t - q.t <= span);
    let s = `<svg class="bt" viewBox="0 0 ${W} ${Hh}" preserveAspectRatio="none">`;
    if (!L.length) return s + `<text x="${W / 2}" y="${Hh / 2}" text-anchor="middle" fill="#3f534b" font-size="16" letter-spacing="3">NO BEARINGS YET</text></svg>`;
    const ref = L[L.length - 1].b, xs = L.map(q => unwrap(q.b, ref)), half = Math.max(8, ...L.map((q, i) => Math.abs(xs[i] - ref) + q.w * 0.6)) * 1.1;
    const lo = ref - half, hi = ref + half, X = b => x0 + (x1 - x0) * (b - lo) / (hi - lo), Y = t => y0 + (y1 - y0) * (S.t - t) / span;
    const step = half > 40 ? 20 : half > 20 ? 10 : 5;
    for (let b = Math.ceil(lo / step) * step; b <= hi; b += step) s += `<line x1="${X(b).toFixed(1)}" y1="${y0}" x2="${X(b).toFixed(1)}" y2="${y1}" stroke="#16211e"/><text x="${X(b).toFixed(1)}" y="${y0 - 8}" text-anchor="middle" font-size="12" fill="#6f877d" font-family="IBM Plex Mono,monospace">${brg(b)}</text>`;
    for (let m = 0; m <= span; m++) s += `<line x1="${x0}" y1="${Y(S.t - m).toFixed(1)}" x2="${x1}" y2="${Y(S.t - m).toFixed(1)}" stroke="${m ? '#16211e' : '#2e423b'}"/><text x="${x0 - 8}" y="${(Y(S.t - m) + 4).toFixed(1)}" text-anchor="end" font-size="12" fill="#6f877d" font-family="IBM Plex Mono,monospace">${m ? '-' + fmtMin(m) : 'NOW'}</text>`;
    let band = '', bandB = '';
    L.forEach((q, i) => { const y = Y(q.t).toFixed(1); band += `${X(xs[i] - q.w).toFixed(1)},${y} `; bandB = `${X(xs[i] + q.w).toFixed(1)},${y} ` + bandB; });
    s += `<polygon points="${band}${bandB}" fill="var(--ac)" fill-opacity=".16" stroke="var(--ac)" stroke-opacity=".25"/>`;
    s += `<polyline points="${L.map((q, i) => X(xs[i]).toFixed(1) + ',' + Y(q.t).toFixed(1)).join(' ')}" fill="none" stroke="var(--ac)" stroke-width="2"/>`;
    L.forEach((q, i) => { if (i % 2 === 0 || i === L.length - 1) s += `<circle cx="${X(xs[i]).toFixed(1)}" cy="${Y(q.t).toFixed(1)}" r="${i === L.length - 1 ? 5 : 2.4}" fill="${i === L.length - 1 ? '#f1fbf6' : 'var(--ac)'}"/>`; });
    const rate = L.length > 3 ? (xs[xs.length - 1] - xs[0]) / Math.max(0.1, L[L.length - 1].t - L[0].t) : 0;
    s += `<text x="${x1}" y="${y1 + 22}" text-anchor="end" font-size="12" fill="#9fb4ad" font-family="IBM Plex Mono,monospace">BEARING RATE ${(rate / P.secPerMin * 60).toFixed(1)}&#176;/MIN &#183; BAND = BEARING UNCERTAINTY</text>`;
    return s + '</svg>';
  }
  function rangeBar(a) {   // the range uncertainty drawn ALONG the bearing: own ship at the left, the band where she could be
    const b = rangeBand(a), max = Math.max(40, Math.ceil((b.hi * 1.15) / 20) * 20), W = 420, x0 = 26, x1 = W - 16, X = d => x0 + (x1 - x0) * d / max;
    let s = `<svg class="rb" viewBox="0 0 ${W} 74" preserveAspectRatio="none"><line x1="${x0}" y1="34" x2="${x1}" y2="34" stroke="#2e423b" stroke-width="2"/>`;
    for (let d = 0; d <= max; d += max > 120 ? 40 : 20) s += `<line x1="${X(d).toFixed(1)}" y1="30" x2="${X(d).toFixed(1)}" y2="38" stroke="#4a5d56"/><text x="${X(d).toFixed(1)}" y="56" text-anchor="middle" font-size="11" fill="#6f877d" font-family="IBM Plex Mono,monospace">${d}</text>`;
    s += `<polygon points="${x0 - 12},26 ${x0 + 2},34 ${x0 - 12},42" fill="#6fc3d0"/><text x="${x0 - 14}" y="70" font-size="10" fill="#6fc3d0" font-family="IBM Plex Mono,monospace">OWN</text>`;
    s += `<rect x="${X(b.lo).toFixed(1)}" y="25" width="${Math.max(3, X(b.hi) - X(b.lo)).toFixed(1)}" height="18" fill="var(--ac)" fill-opacity=".3" stroke="var(--ac)"/>`;
    s += `<line x1="${X(b.d).toFixed(1)}" y1="18" x2="${X(b.d).toFixed(1)}" y2="50" stroke="#f1fbf6" stroke-width="2"/><text x="${X(b.d).toFixed(1)}" y="14" text-anchor="middle" font-size="12" fill="#f1fbf6" font-family="IBM Plex Mono,monospace">${Math.round(b.d)} KM</text>`;
    return s + `<text x="${x1}" y="70" text-anchor="end" font-size="10" fill="#6f877d" font-family="IBM Plex Mono,monospace">KM ALONG BRG ${brg(E.brgOf(S.player, obsPos(a)))}</text></svg>`;
  }
  function fcList() {
    const L = S.an.filter(a => a.state !== 'out' && a.state !== 'disabled' && a.idStatus !== 'plan').sort((x, y) => (y.state === 'locked') - (x.state === 'locked') || x.id - y.id);
    const rows = L.map(a => { const si = a.state === 'locked' ? E.solveInfo(S, a) : null, q = quality(a);
      return `<tr class="${qcls(q)}${a.id === selId ? ' sel' : ''}" data-sel="${a.id}"><td class="tk">S${a.id + 1}</td><td>${a.state === 'locked' ? 'LOCK' : 'OPEN'}</td><td>${si ? (si.ready ? '<b class="c">READY</b>' : si.stale ? '<b class="a">STALE</b>' : pct(si.prog)) : '<span class="dm">--</span>'}</td></tr>`; }).join('');
    return panel('fl', 'TRACKS', 'LOCKED FIRST', `<table class="tt"><thead><tr><th>TRK</th><th>STATE</th><th>SOL</th></tr></thead><tbody>${rows}</tbody></table>`, 'g-fl');
  }
  function fcSolution(a) {
    if (!a) return panel('sol', 'SOLUTION', '', '<div class="empty">SELECT A TRACK</div>', 'g-sol');
    const u = E.uncertainty(S, a), lk = a.state === 'locked', si = lk ? E.solveInfo(S, a) : null, ts = lk ? E.trackState(S, a) : null, b = rangeBand(a);
    const age = lk && a.anchor ? S.t - a.anchor.t : a.lastRead ? S.t - a.lastRead : null;
    const st = !lk ? 'NOT LOCKED' : si.ready ? 'SOLUTION READY' : si.stale ? 'STALE' : 'SOLVING';
    const cell = (l, v, c) => `<div class="sc"><span>${l}</span><b class="num ${c || ''}">${v}</b></div>`;
    return panel('sol', 'SOLUTION S' + (a.id + 1), esc(clsLabel(a)), `<div class="sol-st ${!lk ? 'n' : si.ready ? 'g' : si.stale ? 'a' : 'w'}">${st}${lk && !si.ready && !si.stale ? ' ' + pct(si.prog) : ''}</div>
      ${lk ? `<div class="sol-bar"><i style="width:${Math.round((si.ready ? 1 : si.prog) * 100)}%"></i></div>` : ''}
      <div class="scg">${cell('CONFIDENCE', pct(u.conf), u.conf >= 0.8 ? 'c' : u.conf < 0.5 ? 'a' : '')}${cell('AGE', age != null ? fmtMin(age) : '--:--', age > 2 ? 'a' : '')}${cell('TRACK', ts ? ts.state.toUpperCase() : '--', ts && ts.state === 'last' ? 'a' : '')}${cell('RANGE &plusmn;', Math.round(b.r) + ' KM')}</div>
      <div class="lbl2">RANGE UNCERTAINTY ALONG THE BEARING</div>${rangeBar(a)}
      <div class="note">${lk ? (si.why.length ? 'SLOW: ' + esc(si.why.join(', ')).toUpperCase() : 'NOTHING SLOWING IT') : 'LOCK HER TO START A SOLUTION'}</div>
      <div class="krow">${key({ act: 'lock', t: lk ? 'TARGET VIEW' : 'LOCK ON', s: lk ? 'PLAN THE VOLLEY' : 'START A SOLUTION', dis: !(a.state === 'open' || lk) })}${key({ act: 'refresh', t: 'RE-SOLVE', s: 'REFRESH', dis: !lk })}${key({ act: 'release', t: 'RELEASE', s: 'ANALYSTS OFF HER', dis: !S.analysts.some(w => w.task === a.id) })}${key({ act: 'reanalyze', t: 'RE-ANALYZE', s: 'RULED OUT ONLY', dis: a.state !== 'out' })}</div>`, 'g-sol');
  }
  function fcBaseline() {
    return panel('bas', 'BASELINE (TMA LEG)', stub('NEWTONIAN PHASE'), `<div class="bas-g"><div class="note" style="margin:0">BEARING-ONLY RANGING NEEDS A LEG: A VELOCITY CHANGE OF ABOUT 0.5 KM/S HELD FOR 10 S HALVES THE RANGE BAND. THE ENGINE DOES NOT MOVE US THAT WAY YET, SO THE BAND ABOVE SHRINKS ONLY WITH READINGS AND PINGS.</div>
      <div class="krow">${key({ act: 'nys', t: 'LEG LEFT', s: 'NOT YET SIMULATED', dis: true, stub: true, ctl: false })}${key({ act: 'nys', t: 'LEG RIGHT', s: 'NOT YET SIMULATED', dis: true, stub: true, ctl: false })}${key({ act: 'nys', t: 'GIVE A BASELINE', s: 'NOT YET SIMULATED', dis: true, stub: true, ctl: false })}</div></div>`, 'g-bas');
  }
  PAGES.fc = {
    tabs: [['tma', 'TMA'], ['all', 'ALL SOLUTIONS']],
    render: t => {
      const a = sel();
      if (t === 'all') { const lk = S.an.filter(x => x.state === 'locked');
        return panel('all', 'ALL SOLUTIONS', lk.length + ' LOCKED', `<table class="tt"><thead><tr><th>TRK</th><th>SOLUTION</th><th>TRACK</th><th>CONFIDENCE</th><th>RANGE KM</th><th>WHY SLOW</th></tr></thead><tbody>${lk.length ? lk.map(x => { const si = E.solveInfo(S, x), ts = E.trackState(S, x), b = rangeBand(x); return `<tr class="${x.id === selId ? 'sel' : ''}" data-sel="${x.id}"><td class="tk">S${x.id + 1}</td><td>${si.ready ? 'READY' : si.stale ? 'STALE' : pct(si.prog)}</td><td>${ts.state.toUpperCase()}</td><td>${pct(ts.cert)}</td><td>${Math.round(b.lo)}&ndash;${Math.round(b.hi)}</td><td class="cl">${esc(si.why.join(', ') || '-')}</td></tr>`; }).join('') : '<tr><td colspan="6" class="dm">NO LOCKS</td></tr>'}</tbody></table>`, 'g-all'); }
      return fcList() + panel('bt', 'BEARING-TIME HISTORY' + (a ? ' S' + (a.id + 1) : ''), 'OBSERVED BEARINGS (OUR ESTIMATE, WITH ITS NOISE) &middot; LAST 6 MINUTES', a ? btPlot(a) : '<div class="empty">SELECT A TRACK</div>', 'g-bt') + fcSolution(a) + fcBaseline();
    },
    soft: () => { const a = sel(), lk = a && a.state === 'locked'; return [{ t: 'PREV TRK', s: '&#9650;', act: 'prev', ctl: false }, { t: 'NEXT TRK', s: '&#9660;', act: 'next', ctl: false },
      { t: lk ? 'TARGET VIEW' : 'LOCK ON', s: lk ? 'PLAN THE VOLLEY' : 'SOLVE', act: 'lock', dis: !a || !(a.state === 'open' || lk) || a.idStatus === 'plan' }, { t: 'RE-SOLVE', s: 'REFRESH', act: 'refresh', dis: !lk },
      { t: 'RELEASE', s: 'ANALYSTS', act: 'release', dis: !a || !S.analysts.some(w => w.task === a.id) }, { t: 'RE-ANALYZE', s: 'RULED OUT', act: 'reanalyze', dis: !a || a.state !== 'out' },
      { t: 'BASELINE', s: 'NOT YET SIMULATED', act: 'nys', dis: true, stub: true, ctl: false }]; },
    act: k => {
      const a = sel(); if (k === 'prev') return selStep(-1); if (k === 'next') return selStep(1); if (!a) return;
      if (k === 'lock') { if (a.state === 'open') E.lockContact(S, a.id); else if (a.state === 'locked') openTarget(a.id); }
      else if (k === 'refresh') E.refreshSolution(S, a.id); else if (k === 'release') S.analysts.filter(w => w.task === a.id).forEach(w => E.assign(S, w.id, a.id)); else if (k === 'reanalyze') E.reanalyze(S, a.id);
    }
  };

  // ======================= F5 HELM (the strategic map is the main window, unchanged) =======================
  const hdgDeg = () => ((Math.atan2(Math.cos(S.hdg || 0), -Math.sin(S.hdg || 0)) * 180 / Math.PI) + 360) % 360;
  const SPDKEYS = ['v1', 'v2', 'v3', 'v4', 'v5'];
  function helmRoute() {
    const rest = S.route.slice(S.routeI); let px = S.player.x, py = S.player.y, L = 0, T = 0;
    const rows = rest.slice(0, 6).map((w, i) => { const d = Math.hypot(w.x - px, w.y - py), v = E.SPEED[w.speed || S.speed].v; L += d; T += d / v; px = w.x; py = w.y; return `<tr><td class="tk">WPT ${S.routeI + i + 1}</td><td>${Math.round(d)} KM</td><td>${E.SPEED[w.speed || S.speed].label.toUpperCase()}</td><td>${mmss(T)}</td></tr>`; }).join('');
    rest.slice(6).forEach(w => { const d = Math.hypot(w.x - px, w.y - py); L += d; T += d / E.SPEED[w.speed || S.speed].v; px = w.x; py = w.y; });
    const left = rest.length;
    return panel('rte', 'ROUTE AND WAYPOINTS', left ? `${left} LEFT &middot; ${Math.round(L)} KM &middot; ETA ${mmss(T)}` : 'NO PLAN',
      `<table class="tt"><thead><tr><th>LEG</th><th>DIST</th><th>DRIVE</th><th>ETA</th></tr></thead><tbody>${rows || '<tr><td colspan="4" class="dm wr">NO WAYPOINTS: EDIT PLAN AND CLICK THE MAP, OR RIGHT-CLICK IT</td></tr>'}</tbody></table>
       <div class="krow">${key({ act: 'resume', t: 'RESUME PLAN', dis: !left || S.posture === 'route' })}${key({ act: 'hold', t: 'HOLD STILL', s: 'QUIETEST', lit: S.posture === 'still' })}${key({ act: 'evade', t: 'EVASIVE', s: 'WEAVE', lit: S.posture === 'evade' })}${key({ act: 'clear', t: 'CLEAR PLAN', dis: !left })}</div>`, 'g-rte');
  }
  function helmDrive() {
    const ks = SPDKEYS.map(k => key({ act: 'speed', arg: k, t: E.SPEED[k].label, s: E.SPEED[k].v + ' KM/M', lit: S.speed === k, cls: 'spd' })).join('');
    return panel('drv', 'DRIVE AND HEADING', `HDG ${brg(hdgDeg())} &middot; ${E.SPEED[S.speed].label.toUpperCase()}`, `<div class="drv-g"><div class="drv-c">${ccompassSvg(hdgDeg(), null)}</div><div class="drv-k">${ks}${key({ act: 'redline', t: 'REDLINE', s: S.burn ? 'BURNING' : 'SHORT BURSTS', lit: !!S.burn, warn: true })}</div></div>`, 'g-drv');
  }
  function helmBurn() {
    const mv = (S.orderId != null && ['close', 'separate', 'evade', 'orbit'].includes(S.posture)) || (S.posture === 'route' && S.routeI < S.route.length), mod = k => mv ? { speed: k } : { speed: k, posture: 'route', route: [{ x: Math.round(S.player.x) + 20, y: Math.round(S.player.y) }], routeI: 0, orderId: null };   // holding still: preview as if under way
    const r0 = E.heatRate(S), rows = SPDKEYS.map(k => { const r = E.heatRate(S, mod(k)), v = E.visIf(S, mod(k)), full = r > 0.0003 ? mmss((1 - S.sink.h) / r) : '--:--';
      return `<tr class="${S.speed === k ? 'sel' : ''}"><td class="tk">${E.SPEED[k].label.toUpperCase()}</td><td>${(r * 100 * 60 / P.secPerMin).toFixed(1)}</td><td>${full}</td><td>${pct(v)}</td></tr>`; }).join('');
    return panel('brn', 'BURN PREVIEW', mv ? 'HEAT AND SIGNATURE AT EACH DRIVE SETTING' : 'IF WE GOT UNDER WAY AT EACH SETTING', `<table class="tt"><thead><tr><th>DRIVE</th><th>SINK %/MIN</th><th>FULL IN</th><th>SEEN</th></tr></thead><tbody>${rows}</tbody></table><div class="note">NOW: ${(r0 * 100 * 60 / P.secPerMin).toFixed(1)} %/MIN &middot; BURN NODES AND FLARE CONES ARE A NEWTONIAN-PHASE FEATURE ${stub()}</div>`, 'g-brn');
  }
  function helmLink() {
    const g = (lab, tol) => `<div class="lt"><span>${lab}</span><span class="lt-bar"><s></s><i></i></span><b class="num dm">&plusmn;${tol}</b></div>`;
    return panel('lnk', 'LINK TOLERANCE', stub(), `${g('HEADING', '3&#176;')}${g('SPEED', '5%')}<div class="note">LASER PROBE LINKS AND MISSILE WIRES HOLD ONLY WHILE COURSE AND SPEED HOLD. NO LINKS ARE UP: PROBES AND WIRES ARE NOT YET SIMULATED, SO THIS SHOWS NOTHING LIVE.</div>`, 'g-lnk');
  }
  PAGES.str = {
    tabs: [['plan', 'ROUTE']],
    render: () => '<div class="g-map"></div>' + helmRoute() + helmDrive() + helmBurn() + helmLink(),
    soft: () => [{ t: 'EDIT PLAN', s: planEdit ? 'CLICK THE MAP' : 'ADD WAYPOINTS', act: 'edit', lit: planEdit }, { t: 'RESUME', s: 'PLAN', act: 'resume', dis: !(S.route.length - S.routeI) || S.posture === 'route' },
      { t: 'HOLD STILL', s: 'STANCE', act: 'hold', lit: S.posture === 'still' }, { t: 'EVASIVE', s: 'STANCE', act: 'evade', lit: S.posture === 'evade' },
      { t: 'SLOWER', s: 'DRIVE', act: 'slower', dis: SPDKEYS.indexOf(S.speed) <= 0 }, { t: 'FASTER', s: 'DRIVE', act: 'faster', dis: SPDKEYS.indexOf(S.speed) >= 4 }, { t: 'FIT MAP', s: 'WHOLE ARENA', act: 'fit', ctl: false }],
    act: (k, arg) => {
      const i = SPDKEYS.indexOf(S.speed);
      if (k === 'speed') E.setSpeed(S, arg); else if (k === 'slower' && i > 0) E.setSpeed(S, SPDKEYS[i - 1]); else if (k === 'faster' && i >= 0 && i < 4) E.setSpeed(S, SPDKEYS[i + 1]);
      else if (k === 'resume') E.setOrder(S, 'route', null); else if (k === 'hold') E.setOrder(S, 'still', null); else if (k === 'evade') E.setOrder(S, 'evade', null);
      else if (k === 'clear') { E.setOrder(S, 'still', null); E.setRoute(S, []); } else if (k === 'redline') E.redlineBurn(S);
      else if (k === 'edit') { planEdit = !planEdit; } else if (k === 'fit') { const b = $('mzfit'); if (b) b.click(); }
      drawMap();
    }
  };

  // ======================= F6 ENGINEERING AND THERMAL =======================
  function engSink() {
    const h = S.sink.h, r = E.heatRate(S), clk = r > 0.0003 ? ['FULL IN', mmss((1 - h) / r)] : r < -0.0003 ? ['EMPTY IN', mmss(h / -r)] : ['STEADY', '--:--'];
    return panel('snk', 'HEAT SINK', `${clk[0]} ${clk[1]}`, `<div class="eng-t">${ctankSvg(h * 100, null, null)}</div>`, 'g-snk');
  }
  function engRate() { return panel('rat', 'HEAT RATE', '% OF SINK PER REAL MINUTE', `<div class="eng-d">${crateDialSvg(E.heatRate(S) * R * 100, null)}</div>`, 'g-rat'); }
  function engTrend() { return panel('trd', 'SINK TREND', 'LAST 5 MIN AND 5 MIN AHEAD', `<div class="eng-d">${ctrendSvg(hbuf, S.t, S.sink.h, E.heatRate(S), null)}</div>`, 'g-trd'); }
  function engSources() {
    const xp = E.exposure(S), rows = xp.parts.length ? xp.parts.slice().sort((a, b) => b.v - a.v).map(p => { const v = p.v * ME().sinkK / S.me.sink * 100; return `<tr><td class="cl">${esc(p.label)}</td><td><span class="mb wide"><i style="width:${Math.min(100, v * 25)}%;background:#c4b886"></i></span></td><td>${v.toFixed(1)}</td></tr>`; }).join('') : '<tr><td colspan="3" class="dm">RUNNING DARK</td></tr>';
    return panel('src', 'HEAT SOURCES', '% OF SINK PER GAME MINUTE', `<table class="tt">${rows}</table>`, 'g-src');
  }
  function engCtl() {
    const h = S.sink.h, forced = S.vent.on && S.vent.forced && h >= ME().forcedRetract, qa = S.t < S.quietUntil, cd = Math.max(0, S.quietCd - S.t);
    return panel('ctl', 'VENTS, QUIET AND REDLINE', `SIGNATURE ${(S.heat || 'cold').toUpperCase()} &middot; SEEN ${pct(E.ourVis(S))}`, `<div class="krow ctlk">${key({ act: 'vent', t: S.vent.on ? (forced ? 'VENTING' : 'RETRACT FINS') : 'VENT', s: S.vent.on ? (forced ? 'LOCKED UNTIL ' + Math.round(ME().forcedRetract * 100) + '%' : 'BACK TO STEALTH') : h < ME().ventMin ? 'SINK LOW' : 'FINS OUT: VISIBLE', lit: S.vent.on, warn: !S.vent.on && h >= 0.8, dis: forced || (!S.vent.on && h < ME().ventMin) })}
      ${key({ act: 'quiet', t: qa ? 'QUIET' : 'GO QUIET', s: qa ? fmtMin(S.quietUntil - S.t) + ' LEFT' : cd > 0 ? 'READY IN ' + fmtMin(cd) : 'SENSORS DARK', lit: qa, dis: qa || cd > 0 || S.vent.on })}
      ${key({ act: 'redline', t: 'REDLINE', s: S.burn ? 'BURNING' : 'SHORT BURSTS', lit: !!S.burn, warn: true })}${key({ act: 'cut', t: 'CUT THRUST', s: 'ONE STEP DOWN' })}</div>
      <div class="eng-l"><span><i class="lmp ${S.vent.on ? 'a' : ''}"></i>FINS</span><span><i class="lmp ${h >= 0.8 ? 'a' : ''}"></i>80%</span><span><i class="lmp ${h >= 0.95 ? 'r' : ''}"></i>95%</span><span><i class="lmp ${(S.melt || 0) > 0.05 ? 'r' : ''}"></i>MELT</span><span><i class="lmp ${qa ? 'c' : ''}"></i>QUIET</span></div>`, 'g-ctl');
  }
  function engPower() {
    return panel('pwr', 'POWER ALLOCATION', stub(), `<div class="pw">${['SENSORS', 'DRIVE', 'WEAPONS', 'LIFE'].map((l, i) => `<div><span>${l}</span><span class="cs-bar"><i style="width:${[30, 35, 25, 10][i] * 2}%;background:#4a5d56"></i></span></div>`).join('')}</div><div class="note">SHOWN AT DEFAULT SPLIT. POWER IS NOT A SIMULATED RESOURCE YET.</div>`, 'g-pwr');
  }
  PAGES.eng = {
    tabs: [['heat', 'HEAT'], ['pwr', 'POWER']],
    render: t => t === 'pwr' ? engPower() + engSources() : engSink() + engRate() + engTrend() + engSources() + engCtl(),
    soft: () => [{ t: S.vent.on ? 'RETRACT' : 'VENT', s: 'FINS', act: 'vent' }, { t: 'GO QUIET', s: 'SENSORS DARK', act: 'quiet', dis: S.t < S.quietUntil || S.t < S.quietCd || S.vent.on }, { t: 'REDLINE', s: 'SHORT BURSTS', act: 'redline', lit: !!S.burn }, { t: 'CUT THRUST', s: 'ONE STEP DOWN', act: 'cut' }],
    act: k => { if (k === 'vent') ventToggle(); else if (k === 'quiet') E.goQuiet(S); else if (k === 'redline') E.redlineBurn(S); else if (k === 'cut') A().order('engineering', 'cut_thrust', 'Cut thrust', {}); }
  };

  // ======================= F7 DAMAGE CONTROL =======================
  function dmgState() {
    const melt = S.melt || 0, h = S.sink.h;
    return [
      ['SENSORS', S.hull < 60 ? ['amb', 'FOULED: READS SLOWER'] : ['ok', 'OK']],
      ['C&amp;C', S.hull < 25 ? ['red', 'BREACH RISK'] : ['ok', 'OK']],
      ['WEAPONS', S.sysEff < 0.9 ? ['amb', pct(S.sysEff) + ' EFFICIENCY'] : ['ok', 'OK']],
      ['HEAT SINK', melt > 0.05 ? ['red', 'COOLANT FAILING'] : h >= 0.8 ? ['amb', pct(h) + ' FULL'] : ['ok', pct(h)]],
      ['REACTOR', melt > 0.4 ? ['red', 'PAST LIMIT'] : ['ok', 'OK']],
      ['DRIVE', S.burn ? ['amb', 'REDLINE BURN'] : S.sysEff < 0.9 ? ['amb', pct(S.sysEff)] : ['ok', 'OK']],
      ['BREACH DRIVE', S.spool ? ['amb', 'SPOOLING'] : ['ok', 'READY']]];
  }
  function dmgSchematic() {
    const st = dmgState(), C = { ok: ['#12241a', '#4f9a62'], amb: ['#33240c', '#ffb02e'], red: ['#3a120d', '#ff4936'] };
    const comp = [[60, 'SENSORS', 0], [170, 'C&amp;C', 1], [270, 'WEAPONS', 2], [370, 'HEAT SINK', 3], [470, 'REACTOR', 4], [570, 'DRIVE', 5]];
    let s = '<svg class="sch" viewBox="0 0 720 230"><path d="M30 115 L90 50 L640 50 L690 80 L690 150 L640 180 L90 180 Z" fill="#070b0a" stroke="#4a5d56" stroke-width="3"/>';
    comp.forEach(([x, l, i], k) => { const [bg, fg] = C[st[i][1][0]], w = k === 0 ? 74 : 96, x0 = k === 0 ? 100 : x + 10;
      s += `<rect x="${x0}" y="60" width="${w}" height="110" fill="${bg}" stroke="${fg}" stroke-width="2"/><text x="${x0 + w / 2}" y="108" text-anchor="middle" font-size="${k === 0 ? 12 : 14}" font-weight="700" fill="${fg}" font-family="Bahnschrift,Arial Narrow,sans-serif" letter-spacing="1">${l}</text><text x="${x0 + w / 2}" y="130" text-anchor="middle" font-size="11" fill="${fg}" font-family="IBM Plex Mono,monospace">${st[i][1][0] === 'ok' ? 'OK' : st[i][1][0] === 'amb' ? 'DEGRADED' : 'CRITICAL'}</text>`; });
    s += `<text x="30" y="215" font-size="12" fill="#6f877d" font-family="IBM Plex Mono,monospace">BOW</text><text x="690" y="215" text-anchor="end" font-size="12" fill="#6f877d" font-family="IBM Plex Mono,monospace">STERN</text>`;
    return panel('sch', 'COMPARTMENTS AND SYSTEMS', 'STATUS FROM HULL, HEAT AND EFFICIENCY &middot; COMPARTMENT DAMAGE ' + stub(), s + '</svg>', 'g-sch');
  }
  function dmgHull() {
    const h = S.hull, col = h < 40 ? '#ff4936' : h < 70 ? '#ffb02e' : '#6fbf7b';
    return panel('hul', 'HULL', `SYSTEMS ${pct(S.sysEff)}`, `<div class="bigr"><span class="num" style="color:${col}">${Math.round(h)}%</span><small>INTEGRITY</small></div>${segs(h, 100, col, 20)}<div class="note">BELOW 60% THE SENSOR MOUNTS FOUL AND EVERY READ SLOWS; BELOW 40% IT IS A WARNING.</div>`, 'g-hul');
  }
  function dmgTable() {
    return panel('sys', 'SYSTEM STATUS', '', `<table class="tt">${dmgState().map(([l, [c, t]]) => `<tr class="${c === 'red' ? 'bad' : c === 'amb' ? 'warn' : ''}"><td class="tk">${l}</td><td><span class="lmp ${c === 'red' ? 'r' : c === 'amb' ? 'a' : 'g'}"></span>${t}</td></tr>`).join('')}</table>`, 'g-sys');
  }
  function dmgPri() {
    const p = S.dmgPriority || 'sink';
    return panel('pri', 'REPAIR PRIORITY (DOCTRINE)', 'A FLAG FOR FENWICK', `<div class="krow">${key({ act: 'pri', arg: 'sink', t: 'SAVE THE SINK', s: 'PRIORITY', lit: p === 'sink' })}${key({ act: 'pri', arg: 'drive', t: 'SAVE THE DRIVE', s: 'PRIORITY', lit: p === 'drive' })}</div>
      <div class="lbl2" style="margin-top:calc(var(--u)*.8)">REPAIR QUEUE ${stub()}</div><div class="note">THE COMPARTMENT AND REPAIR MODEL IS A LATER PHASE: THE PRIORITY IS STORED AND SHOWN, NOTHING IS REPAIRED YET.</div>`, 'g-pri');
  }
  PAGES.dmg = {
    tabs: [['sys', 'SYSTEMS']],
    render: () => dmgSchematic() + dmgHull() + dmgTable() + dmgPri(),
    soft: () => [{ t: 'SAVE SINK', s: 'PRIORITY', act: 'pri', arg: 'sink', lit: (S.dmgPriority || 'sink') === 'sink' }, { t: 'SAVE DRIVE', s: 'PRIORITY', act: 'pri', arg: 'drive', lit: S.dmgPriority === 'drive' }],
    act: (k, arg) => { if (k === 'pri') S.dmgPriority = arg; }
  };

  // ======================= F8 COMMS AND REPORTS =======================
  const callState = c => (c.state === 'answered' ? 'ANSWERED: ' : c.state === 'defaulted' ? 'DEFAULT: ' : c.state === 'settled' ? 'DOCTRINE: ' : '') + (c.opts && c.choice != null ? esc(c.opts[c.choice].label).toUpperCase() : c.state.toUpperCase());
  function comCalls() {
    const cs = A().model.calls.filter(c => c.state !== 'logged').slice(-14).reverse();
    return panel('cal', 'COMMS LOG: CALLS', 'NEWEST FIRST', `<table class="tt lg"><thead><tr><th>T</th><th>WHO</th><th>CALL</th><th>OUTCOME</th></tr></thead><tbody>${cs.map(c => `<tr class="p${c.pri}"><td>${fmtMin(c.at / P.secPerMin)}</td><td class="tk">${esc(crewName(c.officer)).toUpperCase()}</td><td class="tx">${esc(c.line)}</td><td class="cl">${callState(c)}</td></tr>`).join('') || '<tr><td colspan="4" class="dm">NO CALLS YET</td></tr>'}</tbody></table>`, 'g-cal');
  }
  function comLinks() {
    const offers = A().model.pending().filter(c => c.row === 'C1' || c.row === 'C3');
    return panel('lnk2', 'LINK OFFERS AND STATUS', '', `${offers.length ? offers.map(c => `<div class="lo"><b>${esc(c.line)}</b>${c.opts.map((o, i) => `<button class="bchip${i === A().model.defaultIndex(c) ? ' rec' : ''}" data-a="answer" data-arg="${c.id}:${i}">${esc(o.label)}</button>`).join('')}</div>`).join('') : '<div class="dm">NO OFFERS ON THE LINK</div>'}
      <table class="tt"><tr><td class="dm">ALLY DATA LINK</td><td>${S.friendly ? 'ALLY PRESENT' : 'NO ALLY'}</td><td>${stub()}</td></tr><tr><td class="dm">PROBE LINKS</td><td>NONE UP</td><td>${stub()}</td></tr><tr><td class="dm">PATRON TASKING</td><td>NONE</td><td>${stub()}</td></tr></table>`, 'g-lnk2');
  }
  function comLog() {
    return panel('log', 'EVENT LOG', 'EVERYTHING THE CREW SAID', `<table class="tt lg">${S.log.slice(-16).reverse().map(l => `<tr class="${l.kind}"><td>${fmtMin(l.t)}</td><td class="tk">${esc(crewName(l.who)).toUpperCase()}</td><td class="tx">${esc(l.text)}</td></tr>`).join('')}</table>`, 'g-log');
  }
  function comAAR() {
    const st = A().model.stats(), lk = S.an.filter(a => a.state === 'locked').length, dis = S.an.filter(a => a.state === 'disabled' && a.kind === 'real').length, host = S.an.filter(a => a.idStatus === 'hostile').length;
    const row = (l, v) => `<tr><td class="dm">${l}</td><td class="num">${v}</td></tr>`;
    return panel('aar', 'AFTER-ACTION (SO FAR)', 'THE REPORT AT THE END WILL SAY MORE', `<table class="tt">${row('MISSION TIME', mmss(S.t))}${row('HOSTILES AFFIRMED', host)}${row('LOCKS NOW', lk)}${row('CRIPPLED', dis)}${row('SALVOS FIRED', S.shots || 0)}${row('MISSILES LEFT', S.mag.total + ' / ' + S.mag.max)}${row('HULL', Math.round(S.hull) + '%')}${row('WRONG CALLS', S.wrong || 0)}${row('CALLS RAISED', st.raised)}${row('URGENT CALLS', st.urgent)}${row('CREW DEFAULTS', st.defaults)}${row('SETTLED BY DOCTRINE', st.settled)}</table>`, 'g-aar');
  }
  PAGES.com = {
    tabs: [['log', 'COMMS'], ['rep', 'REPORTS']],
    render: t => t === 'rep' ? comLog() + comAAR() : comCalls() + comLinks(),
    soft: () => [{ t: 'COMMS', s: 'CALLS, LINKS', act: 'tab', arg: 'log', ctl: false, lit: SCREENS.tab.com !== 'rep' }, { t: 'REPORTS', s: 'LOG, AFTER-ACTION', act: 'tab', arg: 'rep', ctl: false, lit: SCREENS.tab.com === 'rep' }],
    act: () => {}
  };
})();
