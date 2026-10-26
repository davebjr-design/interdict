document.body.dataset.view = 'tac';
/* ===== Console v2 (inlined into hunt_rt.html by build_hunt_rt.sh). Builds the fixed 160x90u stage and drives it from the engine state. ===== */
const CC = { amber: '#ffb454', cyan: '#6fc3d0', red: '#ff6b5a', green: '#8fd694', violet: '#b79cff', orange: '#ff8a4c' };
const CHK = { thermal: ['H', 'HEAT', '#ff8a4c'], reactor: ['R', 'REACT', '#6fc3d0'], occlusion: ['V', 'VISUAL', '#b79cff'] };
const cesc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
// ---------- tiny HTML builders (widget classes: lamp S 6x4, key K 12x4, ro T 12x4, g gauge, l dial, plate, slip parts) ----------
function cwid(kind, x, y, w, h, inner, o = {}) {
  return `<div class="cw c${kind} ${o.cls || ''}" ${o.id ? `id="${o.id}"` : ''} ${o.act ? `data-act="${o.act}"` : ''} ${o.arg != null ? `data-arg="${o.arg}"` : ''} data-size="${o.tag || kind + ' ' + w + 'x' + h + 'u'}" ${o.tip ? `data-tip="${cesc(o.tip)}"` : ''} ${o.heat ? `data-heat='${JSON.stringify(o.heat)}'` : ''} style="--x:${x};--y:${y};--w:${w};--h:${h};${o.style || ''}"><div class="cf">${inner}</div></div>`;
}
const clampW = (id, x, y, label, o = {}) => cwid('lamp', x, y, o.w || 6, o.h || 4, `<i class="cled"></i><span class="clg">${label}</span>`, Object.assign({ id }, o));
const ckeyW = (id, x, y, w, h, title, sub, color, o = {}) => cwid('key', x, y, w, h, `<i class="ckl"></i><span class="ckt" ${title.length > 8 ? 'style="font-size:calc(var(--u)*1.15);letter-spacing:.02em"' : ''}>${title}</span><span class="cks">${sub || ''}</span>`, Object.assign({ id, style: color ? `--kc:${color};` : '' }, o, { style: (color ? `--kc:${color};` : '') + (o.style || '') }));
const croW = (id, x, y, label, ghost, w = 12, h = 4, o = {}) => cwid('ro', x, y, w, h, `<span class="clg">${label}</span><div class="cv"><u>${ghost}</u><span></span></div>`, Object.assign({ id }, o));
const cplate = (x, y, w, h, txt, o = {}) => cwid('plate', x, y, w, h, txt, o);
const cgauge = (id, x, y, w, h, o = {}) => cwid('g', x, y, w, h, '', Object.assign({ id }, o));
const cdial = (id, x, y, w, h, o = {}) => cwid('l', x, y, w, h, '', Object.assign({ id }, o));
function czone(name, x, y, w, h, title, sub, body, o = {}) {
  return `<div class="cz ${o.cls || ''}" ${o.id ? `id="${o.id}"` : ''} ${o.vz ? `data-vz="${o.vz}"` : ''} data-z="${name} ${w}x${h}u" style="--x:${x};--y:${y};--w:${w};--h:${h}">${title ? `<div class="czt">${title}<em>${sub || ''}</em></div>` : ''}${body}</div>`;
}
// ---------- SVG toolkit (viewBox = 10 units per u) ----------
const cpol = (cx, cy, r, a) => { const t = (a - 90) * Math.PI / 180; return [cx + r * Math.cos(t), cy + r * Math.sin(t)]; };
const carc = (cx, cy, r, a0, a1) => { const [x0, y0] = cpol(cx, cy, r, a0), [x1, y1] = cpol(cx, cy, r, a1); return `M${x0.toFixed(1)} ${y0.toFixed(1)}A${r} ${r} 0 ${Math.abs(a1 - a0) > 180 ? 1 : 0} ${a1 > a0 ? 1 : 0} ${x1.toFixed(1)} ${y1.toFixed(1)}`; };
function cdialSvg(vang, zones, ticks, readout, label, unit, ghost, rcol, sub) {
  const cx = 120, cy = 82, r = 42; let s = `<svg viewBox="0 0 240 160" preserveAspectRatio="xMidYMid meet"><circle cx="${cx}" cy="${cy}" r="${r + 28}" fill="#0b1210" stroke="#22322d" stroke-width="3"/>`;
  zones.forEach(([a0, a1, col]) => { s += `<path d="${carc(cx, cy, r, a0, a1)}" stroke="${col}" stroke-width="7" fill="none" opacity=".85"/>`; });
  ticks.forEach(([a, lab, major]) => { const [x0, y0] = cpol(cx, cy, r + 5, a), [x1, y1] = cpol(cx, cy, r + (major ? 11 : 8), a); s += `<line x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}" stroke="#7d948a" stroke-width="${major ? 2 : 1}"/>`; if (lab) { const [tx, ty] = cpol(cx, cy, r + 19, a); s += `<text x="${tx.toFixed(1)}" y="${(ty + 3.5).toFixed(1)}" text-anchor="middle" font-size="10" fill="#8fa89d">${lab}</text>`; } });
  if (ghost != null) { const [gx, gy] = cpol(cx, cy, r + 4, ghost); s += `<line x1="${cx}" y1="${cy}" x2="${gx.toFixed(1)}" y2="${gy.toFixed(1)}" stroke="#6fc3d0" stroke-width="3" stroke-dasharray="5 4"/>`; }
  const [nx, ny] = cpol(cx, cy, r + 4, vang);
  s += `<line x1="${cx}" y1="${cy}" x2="${nx.toFixed(1)}" y2="${ny.toFixed(1)}" stroke="#ffb454" stroke-width="4" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="6" fill="#1b2622" stroke="#4a5d56" stroke-width="2"/>`;
  s += `<rect x="${cx - 34}" y="${cy + 16}" width="68" height="24" rx="3" fill="#050908" stroke="#22322d"/><text class="m" x="${cx}" y="${cy + 34}" text-anchor="middle" font-size="16" font-weight="700" fill="${rcol}">${readout}</text>`;
  if (unit) s += `<text x="${cx}" y="${cy + 53}" text-anchor="middle" font-size="9" fill="#566b62">${unit}</text>`;
  s += `<text x="10" y="18" font-size="12" font-weight="700" fill="#9db4a9">${label}</text>`;
  if (sub) s += `<text x="230" y="18" text-anchor="end" font-size="9" fill="#566b62">${sub}</text>`;
  return s + '</svg>';
}
function crateDialSvg(rate, ghost) {   // log scale: left drains (vent), right fills. rate in % of sink per real minute
  const ang = v => v ? 120 * Math.sign(v) * Math.log1p(Math.min(250, Math.abs(v))) / Math.log1p(250) : 0;
  const zones = [[-120, -2, '#2c6f66'], [2, ang(40), '#7c6a2a'], [ang(40), ang(100), '#a8681f'], [ang(100), 120, '#a1362a']];
  const ticks = [[-120, '', true], [ang(-30), '', false], [0, '0', true], [ang(15), '15', true], [ang(40), '', false], [ang(80), '80', true], [120, '', true]];
  const col = rate > 100 ? '#ff6b5a' : rate > 0 ? '#ffb454' : '#6fc3d0';
  return cdialSvg(ang(rate), zones, ticks, (rate >= 0 ? '+' : '') + Math.round(rate), 'HEAT RATE', '% of sink per minute', ghost == null ? null : ang(ghost), col, 'LOG SCALE').replace('</svg>', '<text x="10" y="150" font-size="10" font-weight="700" fill="#2c8f9c">&#9664; VENT</text><text x="230" y="150" text-anchor="end" font-size="10" font-weight="700" fill="#d8806f">REDLINE &#9654;</text></svg>');
}
function ctankSvg(pct, ghost, lock) {
  const h = 240, y0 = 52, Y = p => y0 + h * (1 - p / 100), amber = '#ffb454';
  let s = `<svg viewBox="0 0 120 320"><text x="12" y="18" font-size="13" font-weight="700" fill="#9db4a9">HEAT SINK</text><text class="m" x="12" y="40" font-size="22" font-weight="700" fill="${pct >= 95 ? '#ff6b5a' : pct >= 80 ? '#ff8a4c' : amber}">${Math.round(pct)}%</text>`;
  s += `<rect x="14" y="${y0 - 6}" width="40" height="${h + 12}" rx="10" fill="#050908" stroke="#2b3c36" stroke-width="3"/><defs><linearGradient id="hg" gradientUnits="userSpaceOnUse" x1="0" y1="${y0 + h}" x2="0" y2="${y0}"><stop offset="0" stop-color="#2c8f9c"/><stop offset=".6" stop-color="#d79a3a"/><stop offset="1" stop-color="#ff6b5a"/></linearGradient><clipPath id="tc"><rect x="18" y="${y0 - 2}" width="32" height="${h + 4}" rx="6"/></clipPath></defs>`;
  if (ghost != null) s += `<g clip-path="url(#tc)"><rect x="18" y="${Y(ghost).toFixed(1)}" width="32" height="${(h * ghost / 100).toFixed(1)}" fill="#6fc3d0" opacity=".35"/></g><line x1="14" y1="${Y(ghost).toFixed(1)}" x2="54" y2="${Y(ghost).toFixed(1)}" stroke="#6fc3d0" stroke-width="3" stroke-dasharray="4 3"/><text class="m" x="66" y="${(Y(ghost) + 4).toFixed(1)}" font-size="11" fill="#6fc3d0">+1M ${Math.round(ghost)}</text>`;
  s += `<g clip-path="url(#tc)"><rect x="18" y="${Y(pct).toFixed(1)}" width="32" height="${(h * pct / 100 + 4).toFixed(1)}" fill="url(#hg)" opacity=".92"/><rect x="18" y="${Y(pct).toFixed(1)}" width="32" height="3" fill="#fff" opacity=".5"/></g>`;
  [[60, '#d79a3a'], [80, '#ff8a4c'], [95, '#ff6b5a']].forEach(([p, col]) => { const yy = Y(p); s += `<line x1="10" y1="${yy.toFixed(1)}" x2="62" y2="${yy.toFixed(1)}" stroke="${col}" stroke-width="2"/><text class="m" x="66" y="${(yy + 4).toFixed(1)}" font-size="11" fill="${col}">${p}</text>`; });
  [0, 25, 50, 75, 100].forEach(p => { const yy = Y(p); s += `<line x1="54" y1="${yy.toFixed(1)}" x2="60" y2="${yy.toFixed(1)}" stroke="#566b62"/>`; });
  s += `<text x="66" y="${(Y(0) + 4).toFixed(1)}" font-size="11" fill="#8fa89d">0</text><text x="74" y="${(Y(25) + 4).toFixed(1)}" font-size="10" fill="#2c8f9c">SAFE</text>`;
  if (lock) s += `<text x="66" y="${(Y(lock) - 6).toFixed(1)}" font-size="10" fill="#ff8a4c">LOCKED</text>`;
  return s + '</svg>';
}
function ctrendSvg(hist, now, h, r, rg) {   // -5..+5 real minutes, NOW in the middle, with projection
  const x0 = 16, x1 = 228, y0 = 30, y1 = 138, X = m => x0 + (x1 - x0) * (m + 5) / 10, Y = p => y1 - (y1 - y0) * p / 100, rm = P.secPerMin / 60, amber = '#ffb454';
  let s = '<svg viewBox="0 0 240 160"><text x="14" y="16" font-size="13" font-weight="700" fill="#9db4a9">SINK TREND</text><text x="226" y="16" text-anchor="end" font-size="10" fill="#566b62">-5M . NOW . +5M</text>';
  [25, 50, 75, 100].forEach(p => { s += `<line x1="${x0}" y1="${Y(p).toFixed(1)}" x2="${x1}" y2="${Y(p).toFixed(1)}" stroke="#1d2b26"/>`; });
  [[60, '#6a5522'], [80, '#7a3d1a'], [95, '#7a2a1c']].forEach(([p, c]) => { s += `<line x1="${x0}" y1="${Y(p).toFixed(1)}" x2="${x1}" y2="${Y(p).toFixed(1)}" stroke="${c}" stroke-dasharray="3 3"/>`; });
  s += `<line x1="${X(0)}" y1="${y0}" x2="${X(0)}" y2="${y1}" stroke="#cfe3da" stroke-width="1.5"/>`;
  const pts = hist.filter(q => (now - q.t) * rm <= 5).map(q => [X(-(now - q.t) * rm), Y(q.h * 100)]); pts.push([X(0), Y(h * 100)]);
  const pl = pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  s += `<polygon points="${pts[0][0].toFixed(1)},${y1} ${pl} ${X(0)},${y1}" fill="${amber}" opacity=".12"/><polyline points="${pl}" fill="none" stroke="${amber}" stroke-width="3"/>`;
  const proj = (rr, col, tag) => {   // rr per game minute
    const slope = rr / rm;   // fraction per real minute
    let endM = 5, endH = h + slope * 5, hit = '';
    if (slope > 1e-4 && h + slope * 5 >= 1) { endM = (1 - h) / slope; endH = 1; hit = fmtMin((1 - h) / rr); }
    else if (slope < -1e-4 && h + slope * 5 <= 0) { endM = h / -slope; endH = 0; hit = ''; }
    s += `<line x1="${X(0)}" y1="${Y(h * 100).toFixed(1)}" x2="${X(endM).toFixed(1)}" y2="${Y(endH * 100).toFixed(1)}" stroke="${col}" stroke-width="2.5" stroke-dasharray="6 4"/>`;
    if (hit) s += `<circle cx="${X(endM).toFixed(1)}" cy="${Y(100).toFixed(1)}" r="4" fill="${tag}"/><text class="m" x="${(X(endM) - 6).toFixed(1)}" y="${(Y(100) + 14).toFixed(1)}" text-anchor="end" font-size="11" fill="${tag}">${hit}</text>`;
  };
  if (Math.abs(r) > 1e-5) proj(r, amber, '#ff6b5a');
  if (rg != null && Math.abs(rg) > 1e-5) proj(rg, '#6fc3d0', '#6fc3d0');
  return s + '</svg>';
}
function cbandSvg(label, val, w, h, zones, numtxt, sub, ghostVal) {
  const VW = w * 10, VH = h * 10; let s = `<svg viewBox="0 0 ${VW} ${VH}"><text x="10" y="18" font-size="13" font-weight="700" fill="#9db4a9">${label}</text>`;
  if (sub) s += `<text x="${VW - 10}" y="18" text-anchor="end" font-size="10" fill="#566b62">${sub}</text>`;
  const bx = 10, bw = VW - 20, by = 36, bh = 18; let x = bx;
  zones.forEach(([name, pct, col]) => { const ww = bw * pct / 100; s += `<rect x="${x.toFixed(1)}" y="${by}" width="${ww.toFixed(1)}" height="${bh}" fill="${col}"/><text x="${(x + ww / 2).toFixed(1)}" y="${by + bh + 14}" text-anchor="middle" font-size="10" fill="#566b62">${name}</text>`; x += ww; });
  const mx = bx + bw * Math.max(0, Math.min(100, val)) / 100;
  s += `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="none" stroke="#2b3c36" stroke-width="2"/>`;
  if (ghostVal != null) { const gx = bx + bw * Math.max(0, Math.min(100, ghostVal)) / 100; s += `<polygon points="${gx - 7},${by - 6} ${gx + 7},${by - 6} ${gx},${by + 4}" fill="#6fc3d0"/><line x1="${gx}" y1="${by}" x2="${gx}" y2="${by + bh}" stroke="#6fc3d0" stroke-width="3" stroke-dasharray="4 3"/>`; }
  s += `<polygon points="${(mx - 7).toFixed(1)},${by - 6} ${(mx + 7).toFixed(1)},${by - 6} ${mx.toFixed(1)},${by + 4}" fill="#ffb454"/><line x1="${mx.toFixed(1)}" y1="${by}" x2="${mx.toFixed(1)}" y2="${by + bh}" stroke="#ffb454" stroke-width="3"/>`;
  s += `<text class="m" x="${VW - 10}" y="20" text-anchor="end" font-size="19" font-weight="700" fill="#ffb454">${numtxt}</text>`;
  return s + '</svg>';
}
function csegSvg(label, frac, color, txt, w, h, marks = [], segs = 10, sub = '') {
  const VW = w * 10, VH = h * 10; let s = `<svg viewBox="0 0 ${VW} ${VH}">`;
  if (label) s += `<text x="8" y="18" font-size="13" font-weight="700" fill="#9db4a9">${label}</text>`;
  if (sub) s += `<text x="${VW - 8}" y="18" text-anchor="end" font-size="10" fill="#566b62">${sub}</text>`;
  const bx = 8, bw = VW - 16, by = label ? 28 : 8, bh = VH - (label ? 52 : 36), sw = bw / segs;
  for (let i = 0; i < segs; i++) { const on = (i + 1) / segs <= frac + 1e-6; s += `<rect x="${(bx + i * sw + 1).toFixed(1)}" y="${by}" width="${(sw - 2).toFixed(1)}" height="${bh}" fill="${on ? color : '#101917'}" opacity="${on ? .95 : 1}" stroke="#22322d"/>`; }
  marks.forEach(m => { s += `<line x1="${(bx + bw * m).toFixed(1)}" y1="${by - 3}" x2="${(bx + bw * m).toFixed(1)}" y2="${by + bh + 3}" stroke="#cfe3da" stroke-width="2"/>`; });
  return s + `<text class="m" x="${VW / 2}" y="${VH - 8}" text-anchor="middle" font-size="${h <= 4 ? 14 : 17}" font-weight="700" fill="${color}">${txt}</text></svg>`;
}
function ccompassSvg(hdg, bug) {
  const cx = 120, cy = 82, r = 54; let s = `<svg viewBox="0 0 240 160"><circle cx="${cx}" cy="${cy}" r="${r + 10}" fill="#0b1210" stroke="#22322d" stroke-width="3"/>`;
  for (let a = 0; a < 360; a += 10) { const mj = a % 30 === 0, [x0, y0] = cpol(cx, cy, r - (mj ? 9 : 5), a), [x1, y1] = cpol(cx, cy, r, a); s += `<line x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}" stroke="#7d948a" stroke-width="${mj ? 2 : 1}"/>`; }
  [[0, 'N'], [90, 'E'], [180, 'S'], [270, 'W']].forEach(([a, t]) => { const [x, y] = cpol(cx, cy, r - 19, a); s += `<text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="middle" font-size="12" font-weight="700" fill="${t === 'N' ? '#ff6b5a' : '#9db4a9'}">${t}</text>`; });
  if (bug != null) { const [bx, by] = cpol(cx, cy, r + 2, bug), [p1x, p1y] = cpol(cx, cy, r + 11, bug - 5), [p2x, p2y] = cpol(cx, cy, r + 11, bug + 5); s += `<polygon points="${bx.toFixed(1)},${by.toFixed(1)} ${p1x.toFixed(1)},${p1y.toFixed(1)} ${p2x.toFixed(1)},${p2y.toFixed(1)}" fill="#6fc3d0"/>`; }
  s += `<g transform="rotate(${hdg} ${cx} ${cy})"><polygon points="${cx},${cy - 30} ${cx + 11},${cy + 14} ${cx},${cy + 7} ${cx - 11},${cy + 14}" fill="#ffb454"/></g>`;
  s += `<rect x="${cx - 26}" y="${cy + 22}" width="52" height="20" rx="3" fill="#050908" stroke="#22322d"/><text class="m" x="${cx}" y="${cy + 37}" text-anchor="middle" font-size="15" font-weight="700" fill="#ffb454">${String(Math.round(hdg) % 360).padStart(3, '0')}</text>`;
  s += '<text x="10" y="18" font-size="12" font-weight="700" fill="#9db4a9">HEADING</text><text x="230" y="18" text-anchor="end" font-size="9" fill="#566b62">BUG = NEXT WAYPOINT</text></svg>';
  return s;
}
function cglyph(kind, col = '#8fa89d') {
  if (kind === 'ship') return `<svg viewBox="0 0 40 40"><polygon points="8,31 20,7 32,31 20,25" fill="${col}"/></svg>`;
  if (kind === 'decoy') return `<svg viewBox="0 0 40 40"><polygon points="20,6 34,20 20,34 6,20" fill="none" stroke="${col}" stroke-width="3.5"/><circle cx="20" cy="20" r="2.5" fill="${col}"/></svg>`;
  if (kind === 'static') return `<svg viewBox="0 0 40 40" fill="${col}"><circle cx="11" cy="24" r="3"/><circle cx="21" cy="13" r="3"/><circle cx="29" cy="27" r="3"/><circle cx="20" cy="30" r="2"/></svg>`;
  if (kind === 'ally') return `<svg viewBox="0 0 40 40"><polygon points="20,6 34,20 20,34 6,20" fill="#8fd694"/></svg>`;
  if (kind === 'wreck') return `<svg viewBox="0 0 40 40"><g stroke="${col}" stroke-width="3" fill="none"><path d="M8 30L18 12L22 20L30 8"/><path d="M12 34L32 34"/></g></svg>`;
  return `<svg viewBox="0 0 40 40"><text x="20" y="29" text-anchor="middle" font-size="26" font-weight="700" fill="${col}" font-family="monospace">?</text></svg>`;
}
// ---------- build the static stage ----------
const SPDK = ['v1', 'v2', 'v3', 'v4', 'v5', 'ab'], SPDC = { v1: '#6fc3d0', v2: '#8fd694', v3: '#9ad06b', v4: '#ffb454', v5: '#ff8a4c', ab: '#ff6b5a' };
function cShell() {   // rail + heat + signature + ship: identical in every view
  let r = croW('r-clk', 1, 2, 'MISSION', '88:88', 14, 5, { tag: 'T 14x5u' });
  r += ckeyW('k-pause', 15.5, 2, 10, 5, 'PAUSE', 'P', null, { act: 'pause', tip: 'Stop time. The scope and contact displays go dark while paused, so pausing is a breather, not a way to study. Key: P' });
  [['&frac12;', 0.5], ['1&times;', 1], ['2&times;', 2]].forEach(([t, v], i) => { r += ckeyW('k-t' + i, 27 + i * 6, 2, 6, 5, t, '', CC.cyan, { act: 'speed', arg: v, tag: 'K 6x5u', tip: 'Game speed. Keys [ and ]' }); });
  [['lMaster', 'MASTER', 'r', 'Master caution: a hull, heat or fire emergency is active.'], ['lInc', 'INCOMING', 'r', 'Enemy missiles are in flight toward us.'], ['lFins', 'FINS OUT', 'o', 'Cooling fins are extended: everyone can see us.'], ['lQuiet', 'QUIET', 'c', 'Sensors are dark and our signature is collapsed.'], ['lSpool', 'SPOOL', 'a', 'The breach drive is spooling. We are very visible.'], ['lSol', 'SOLUTION', 'a', 'A locked contact has a firing solution ready.']].forEach(([id, lab, col, tip], i) => { r += clampW(id, 50 + i * 8, 2, lab, { w: 8, h: 5, tag: 'S 8x5u', tip }); });
  r += cplate(99, 2, 12, 5, 'MASTER CAUTION<br>EVENTS ONLY', { tag: 'plate 12x5u' });
  r += ckeyW('k-menu', 112.5, 2, 6, 5, '&#9776;', 'MENU', null, { act: 'menu', tag: 'K 6x5u', tip: 'Field manual and new hunt.' });
  [['tac', 'TACTICAL', '1'], ['str', 'STRATEGIC', '2'], ['tgt', 'TARGET', '3']].forEach(([v, t, k], i) => { r += ckeyW('kv-' + v, 120 + i * 13.3, 2, 13, 5, t, k, CC.amber, { act: 'view', arg: v, tag: 'K 13x5u' }); });
  let out = czone('RAIL', 0, 0, 160, 8, '', '', r);
  // HEAT
  let g = cgauge('g-tank', 0, 3, 12, 32, { cls: '', tag: 'M-tall 12x32u', tip: 'Heat sink. Everything we do fills it; venting or going quiet slows or empties it. Sensors shut off at 100%.' });
  g += cdial('d-rate', 12, 3, 24, 16, { tag: 'L 24x16u', tip: 'How fast the heat sink is filling (right) or draining (left), as a percent of the sink per real minute. Hover over any key that changes our heat to see a ghost needle.' });
  g += cgauge('g-trend', 12, 19, 24, 16, { tag: 'L 24x16u', tip: 'The last five minutes of the sink and a projection five minutes ahead at the current rate.' });
  g += croW('r-full', 36, 3, 'FULL IN', '88:88', 12, 4, { heat: null });
  g += ckeyW('k-vent', 36, 7, 12, 8, 'VENT', 'FINS OUT &middot; V', CC.red, { act: 'vent', tag: 'K 12x8u', heat: { ventOn: true } });
  g += ckeyW('k-quiet', 36, 15, 12, 4, 'GO QUIET', 'Q', CC.cyan, { act: 'quiet', tag: 'K 12x4u', heat: { quiet: 1 }, tip: 'Sensors dark for about 40 seconds: nobody works, our signature collapses, enemy fire is delayed and they lose the trace on us. It only slows the sink fill; it never empties it. Key: Q' });
  [['lh-fins', 'FINS', 'Cooling fins out.'], ['lh-peg', 'PEG', 'Sink at 100%: sensors are off until it drains.'], ['lh-60', '60', 'Sink over 60%.'], ['lh-80', '80', 'Sink over 80%: enemy ships can see the heat.'], ['lh-95', '95', 'Sink over 95%: about to peg.'], ['lh-melt', 'MELT', 'Pegged for too long: systems are melting.']].forEach(([id, lab, tip], i) => { g += clampW(id, 36 + (i % 2) * 6, 19 + (i >> 1) * 4, lab, { tip }); });
  g += croW('r-qcd', 36, 31, 'QUIET CD', 'READY', 12, 4, { tag: 'T 12x4u' });
  [['ls-drive', 'DRIVE', 'o', 'Engine heat.'], ['ls-sense', 'SENSE', 'c', 'Active sensor work: analysts focused on contacts and tracking locks.'], ['ls-ping', 'PING', 'a', 'Active ping is leaking.'], ['ls-pell', 'PELL', 'v', 'Pell is running the ship hot.'], ['ls-spool', 'SPOOL', 'a', 'Breach drive spooling.'], ['ls-blast', 'BLAST', 'r', 'Weapons fire and detonations nearby.']].forEach(([id, lab, c, tip], i) => { g += clampW(id, i * 6, 35, lab, { tip }); });
  g += cplate(36, 35, 12, 4, 'HEAT SOURCES<br>BRIGHT = BIGGEST', { tag: 'plate 12x4u' });
  out += czone('HEAT', 112, 8, 48, 40, 'HEAT', 'sink &middot; rate &middot; clock', g, { id: 'z-heat' });
  // SIGNATURE
  let sg = cgauge('g-seen', 0, 3, 24, 8, { tag: 'M 24x8u', tip: 'How well enemy sensors see us right now: cold is hard to find, hot is easy.' });
  sg += cwid('lamp', 24, 3, 24, 8, `<span class="clg" style="color:#9db4a9;font-weight:700;font-size:calc(var(--u)*1.3)">ENEMY FIX</span><div id="pipsrow" style="display:flex"><i class="cled" style="margin:0 calc(var(--u)*.6)"></i><i class="cled" style="margin:0 calc(var(--u)*.6)"></i><i class="cled" style="margin:0 calc(var(--u)*.6)"></i></div><span class="clg" style="font-size:calc(var(--u)*1)">AWARE &middot; CLOSING &middot; FIRM</span>`, { id: 'p-fix', tag: 'M 24x8u', tip: 'How well the best-informed enemy ship knows where we are. One pip: it has a bearing and will hunt us. Three: a firm solution and accurate fire. It slips back if we stay cold and they lose the trace.' });
  [['la-calm', 'CALM', 'Hunters in this arena are relaxed and not running silent.'], ['la-alert', 'ALERT', 'Hunters here know something is out there. Expect them to be listening.'], ['la-sil', 'SILENT', 'Hunters here are running silent, which makes them harder to read.']].forEach(([id, lab, tip], i) => { sg += clampW(id, i * 6, 11, lab, { tip }); });
  sg += cplate(18, 11, 30, 4, 'HUNTER ATTITUDE (THIS ARENA)', { tag: 'plate 30x4u' });
  out += czone('SIGNATURE', 112, 48, 48, 17, 'SIGNATURE', 'what they see of us', sg);
  // SHIP & AI
  let sh = cgauge('g-hull', 0, 3, 12, 8, { tag: 'M 12x8u', tip: 'Hull integrity. Below 60% the analysts slow down and the firing solution takes longer.' });
  [['ln-sens', 'SENS', 'Sensors at full efficiency.'], ['ln-drive', 'DRIVE', 'Drive at full efficiency.'], ['ln-weap', 'WEAPON', 'Weapons at full efficiency.'], ['ln-breach', 'BREACH', 'Breach drive ready.']].forEach(([id, lab, tip], i) => { sh += clampW(id, 12 + (i % 2) * 6, 3 + (i >> 1) * 4, lab, { tip }); });
  sh += ckeyW('k-pell', 24, 3, 12, 4, 'PELL ASSIST', 'RUNS HOT', CC.violet, { act: 'pell', tag: 'K 12x4u', heat: { pell: true }, tip: "Pell assists: he speeds the analysts and the solution, runs the ship hot, and grows more integrated while he helps. Integration carries between hunts." });
  sh += ckeyW('k-pellact', 24, 7, 12, 4, 'PELL ACTS', 'NO ASKING', CC.violet, { act: 'pellact', tag: 'K 12x4u', tip: 'Let Pell act on standing orders without asking. Unlocks at 75% integration.' });
  sh += cgauge('g-integ', 36, 3, 12, 8, { tag: 'M 12x8u', tip: 'Pell integration. Rises while he assists and stays between hunts.' });
  sh += cgauge('g-spool', 0, 11, 24, 8, { tag: 'M 24x8u', tip: 'Breach drive spool. The drive must spool before we can leave, and the spool makes us very visible.' });
  sh += ckeyW('k-breach', 24, 11, 12, 8, 'BREACH', 'BREAK CONTACT', CC.red, { act: 'breach', tag: 'K 12x8u', heat: { spoolOn: 1 }, cls: 'guard', tip: 'Calm option: leave now with what we have. The breach drive spools for several minutes and we are very visible while it does. Press again to cancel.' });
  sh += croW('r-eta', 36, 11, 'SPOOL ETA', '88:88', 12, 4);
  sh += clampW('ln-jump', 36, 15, 'JUMP RDY', { tip: 'The breach drive is idle and ready.' }) + clampW('ln-dog', 42, 15, 'DOGLEG', { tip: 'This arena is part of a chain: the breach spool takes longer.' });
  out += czone('SHIP', 112, 65, 48, 25, 'SHIP &amp; AI', 'hull &middot; systems &middot; Pell &middot; breach', sh);
  return out;
}
function cTactical() {
  let o = '';
  // SENSORS (analysts)
  let a = '';
  E.ANALYSTS.forEach((w, i) => { const col = CHK[w.ch][2]; a += cwid('an', i * 12, 3, 12, 8, `<div style="position:absolute;left:7%;top:8%;font-weight:700;font-size:calc(var(--u)*1.25);color:${col};letter-spacing:.06em">${w.name}</div><div style="position:absolute;left:7%;top:36%;font-size:calc(var(--u)*1.05);color:#566b62">${w.role}</div><div id="an-t${i}" style="position:absolute;right:7%;bottom:6%;font-family:'DejaVu Sans Mono','IBM Plex Mono',monospace;font-weight:700;font-size:calc(var(--u)*2.7);line-height:1;color:#33423c">--</div><div style="position:absolute;left:7%;bottom:10%;display:flex;gap:calc(var(--u)*.5);align-items:center"><i id="an-l${i}" class="cled" style="width:calc(var(--u)*1.2);height:calc(var(--u)*1.2)"></i><span id="an-s${i}" class="clg" style="color:#cfe3da">SWEEP</span></div>`, { id: 'an' + i, act: 'analyst', arg: w.id, tag: 'M 12x8u', style: 'cursor:pointer', tip: `${w.name} reads ${w.role.toLowerCase()} signals. Sweeping, ${w.name} works through the contacts one at a time. Click a channel bar on a contact slip to point ${w.name} at it; click here to release.` }); });
  o += czone('SENSORS', 0, 8, 36, 12, 'ANALYSTS', 'who is looking at what', a, { cls: 'blank', vz: 'tac str' });
  o += czone('CONTACTS', 0, 20, 36, 56, 'CONTACTS', 'numbers match the scope', '<div id="ct" style="position:absolute;inset:0"></div>', { cls: 'blank', vz: 'tac str' });
  // ORDERS
  let b = '';
  [['k-inv', 0, 3, 'INVESTIGATE', 'ALL 3 ANALYSTS', CC.cyan, 'invest'], ['k-ping', 12, 3, 'ACTIVE PING', 'LOUD &middot; HEAT', CC.amber, 'ping'], ['k-lock', 24, 3, 'LOCK ON', '', CC.amber, 'lock'], ['k-dis', 0, 7, 'DISMISS', 'RULE OUT', CC.green, 'dismiss'], ['k-re', 12, 7, 'RE-ANALYZE', 'RULED OUT ONLY', CC.cyan, 'reanalyze'], ['k-rel', 24, 7, 'RELEASE', 'ANALYSTS', CC.cyan, 'release']].forEach(([id, x, y, t, s, c, act]) => { b += ckeyW(id, x, y, 12, 4, t, s, c, { act, tag: 'K 12x4u', heat: act === 'ping' ? { ping: 1 } : null }); });
  b += cwid('evd', 0, 11, 36, 3, '<div id="evd"></div>', { id: 'z-evd', tag: 'LCD 36x3u' });
  o += czone('ORDERS', 0, 76, 36, 14, '<span id="ord-t">ORDERS</span>', '', b, { vz: 'tac str' });
  // SCOPE and HELM (scope glass 56u, helm column 20u)
  let s = cwid('beacon', 0, 0.2, 56, 2.8, '<i id="bc-led" class="cled a fl"></i><b>NEXT</b><span id="bc-t"></span>', { id: 'beacon', act: 'beacon', tag: 'beacon 56x3u', style: 'cursor:pointer' });
  s += cwid('glass', 0, 3, 56, 56, '<canvas id="cv" width="640" height="640" aria-label="Radar display"></canvas><div class="cmark" id="cmark"></div>', { cls: 'cglass', id: 'scopebox', tag: 'XL 56x56u', style: 'padding:calc(var(--u)*.3)' });
  s += croW('r-zoom', 0, 59, 'ZOOM', '8.8&times;', 10, 4, { tag: 'T 10x4u' }) + croW('r-ring', 10, 59, 'RING', '88', 10, 4, { tag: 'T 10x4u' });
  s += ckeyW('zin', 20, 59, 6, 4, '+', '', null, { tag: 'K 6x4u', tip: 'Zoom in. The mouse wheel zooms too; drag pans.' }) + ckeyW('zout', 26, 59, 6, 4, '&minus;', '', null, { tag: 'K 6x4u', tip: 'Zoom out.' });
  s += ckeyW('zfollow', 32, 59, 12, 4, 'FOLLOW', 'SHIP', CC.cyan, { tag: 'K 12x4u', tip: 'Keep the view centered on our ship.' }) + ckeyW('zfit', 44, 59, 12, 4, 'FIT', 'WHOLE ARENA', null, { tag: 'K 12x4u', tip: 'Show the whole arena.' });
  s += cdial('d-comp', 56, 3, 20, 14, { tag: 'L 20x14u' });
  s += croW('r-spd', 56, 17, 'SPEED', '8.8', 10, 4, { tag: 'T 10x4u' }) + croW('r-leg', 66, 17, 'LEG', '88:88', 10, 4, { tag: 'T 10x4u' });
  SPDK.forEach((k, i) => { const sp = E.SPEED[k]; s += ckeyW('kd-' + k, 56 + (i % 2) * 10, 21 + (i >> 1) * 4, 10, 4, sp.label.toUpperCase(), sp.v + ' KM/M', SPDC[k], { act: 'drive', arg: k, tag: 'K 10x4u', heat: { speed: k }, cls: k === 'ab' ? 'guard' : '', tip: sp.tip }); });
  s += ckeyW('k-hold', 56, 33, 10, 4, 'HOLD STILL', 'STANCE', CC.green, { act: 'hold', tag: 'K 10x4u', heat: { still: 1 }, tip: 'Stay put. The quietest stance: the drive is off and heat fills slowly.' }) + ckeyW('k-evade', 66, 33, 10, 4, 'EVASIVE', 'STANCE', CC.amber, { act: 'evade', tag: 'K 10x4u', tip: 'Weaving gives the analysts new angles: they read about 10% faster. The drive makes us about 20% louder than holding still.' });
  s += ckeyW('k-clear', 56, 37, 10, 4, 'CLEAR PLAN', '', null, { act: 'clearplan', tag: 'K 10x4u', tip: 'Drop the flight plan and hold position.' }) + ckeyW('k-edit', 66, 37, 10, 4, 'EDIT PLAN', 'STRATEGIC MAP', null, { act: 'editplan', tag: 'K 10x4u', tip: 'Open the strategic map to draw waypoints.' });
  s += cplate(56, 41, 20, 4, 'RIGHT-CLICK: GO HERE<br>SHIFT: QUEUE A WAYPOINT', { tag: 'plate 20x4u' });
  for (let i = 0; i < 4; i++) s += clampW('lw' + i, 56 + i * 5, 45, 'WPT ' + (i + 1), { w: 5, tag: 'S 5x4u' });
  s += clampW('l-back', 56, 49, 'BACKLIT', { w: 10, tip: 'The selected contact is backlit by a star, so the Visual channel can work on it.' }) + clampW('l-plan', 66, 49, 'ON PLAN', { w: 10, tip: 'We are flying a flight plan.' });
  s += cplate(56, 53, 20, 4, 'COURSE LEGS COLORED BY DRIVE SETTING', { tag: 'plate 20x4u' });
  o += czone('SCOPE', 36, 8, 76, 66, 'SCOPE &amp; HELM', 'who is where, and how we move', s, { cls: 'blank', vz: 'tac' });
  // WEAPONS and COMMS
  let w = ''; for (let i = 0; i < 3; i++) w += cgauge('g-tube' + i, i * 12, 3, 12, 8, { tag: 'M 12x8u', tip: 'Missile tube. Each takes about ' + P.reload + ' minutes to reload after firing.' });
  w += cgauge('g-coil', 36, 3, 12, 8, { tag: 'M 12x8u', tip: 'Point-blank coilgun: instant, ignores scatter, only inside ' + P.closeRange + ' km, and the flash is loud.' });
  w += croW('r-fly', 0, 11, 'IN FLIGHT', '88:88', 12, 4);
  w += ckeyW('k-tgt', 12, 11, 12, 4, 'TARGET &#9656;', '', CC.amber, { act: 'target', tag: 'K 12x4u', tip: 'Open the fire solution view for a locked contact. Fire from there.' });
  w += clampW('lw-live', 24, 11, 'LIVE', { tip: 'The locked contact is being observed now.' }) + clampW('lw-stale', 30, 11, 'STALE', { tip: 'The firing solution is stale: refresh it in the Target view.' }) + clampW('lw-rng', 36, 11, 'IN RNG', { tip: 'A contact is inside coilgun range.' }) + clampW('lw-fr', 42, 11, 'FRIEND', { tip: 'An ally is near the aim point: weapons safe.' });
  o += czone('WEAPONS', 36, 74, 48, 16, 'WEAPONS', 'tubes &middot; coilgun', w, { vz: 'tac' });
  let c = cwid('log', 0, 3, 28, 9, '<div id="feed" class="feed"></div>', { tag: 'LOG 28x9u' });
  c += ckeyW('k-voice', 0, 12, 14, 4, 'VOICE', 'OFF', CC.green, { act: 'voice', tag: 'K 14x4u', tip: 'Officers speak the important calls aloud using your browser voices. Cycle: off, slow, normal, fast.' }) + ckeyW('k-rall', 14, 12, 14, 4, 'KEY CALLS', 'KEY', null, { act: 'rall', tag: 'K 14x4u', tip: 'Key calls only, or every report line.' });
  o += czone('COMMS', 84, 74, 28, 16, 'COMMS', 'mostly voiced', c, { vz: 'tac str' });
  return o;
}
function cViews(v) { document.querySelectorAll('#stage [data-vz]').forEach(z => { z.hidden = !z.dataset.vz.split(' ').includes(v); }); }
function cBuild() { $('stage').insertAdjacentHTML('afterbegin', cShell() + cTactical() + cStrategic() + cTarget()); cViews('tac'); }
/* ---------- live state -> widgets ---------- */
let selId = null, hbuf = [], hbufS = null, cCache = {}, errN = 0;
const cOn = (id, f) => { const el = $(id); if (el) f(el); };
function csvg(id, html) { const el = $(id); if (!el || cCache[id] === html) return; cCache[id] = html; el.firstChild.innerHTML = html; }
const LCOL = { lMaster: 'r', lInc: 'r', lFins: 'o', lQuiet: 'c', lSpool: 'a', lSol: 'a', 'lh-fins': 'c', 'lh-peg': 'r', 'lh-60': 'a', 'lh-80': 'o', 'lh-95': 'r', 'lh-melt': 'r', 'ls-drive': 'o', 'ls-sense': 'c', 'ls-ping': 'a', 'ls-pell': 'v', 'ls-spool': 'a', 'ls-blast': 'r', 'la-calm': 'g', 'la-alert': 'a', 'la-sil': 'r', 'ln-sens': 'g', 'ln-drive': 'g', 'ln-weap': 'g', 'ln-breach': 'g', 'ln-jump': 'g', 'ln-dog': 'a', 'l-back': 'v', 'l-plan': 'c', 'lw-live': 'r', 'lw-stale': 'a', 'lw-rng': 'a', 'lw-fr': 'g' };
function clampSet(id, on, o = {}) {
  const el = $(id); if (!el) return; const col = o.col || LCOL[id] || 'a', k = (on ? col : '-') + (o.fl ? 'f' : '') + (o.dim ? 'd' : ''); if (el.dataset.k === k) return; el.dataset.k = k;
  el.querySelector('.cled').className = 'cled ' + (on ? col : '') + (on && o.fl ? ' fl' : '') + (on && o.dim ? ' dim' : ''); el.classList.toggle('on', !!on);
}
function ckeySet(id, o) {   // o: { t, s, lit, dis, rec, hot, heat }
  const el = $(id); if (!el) return; const k = JSON.stringify(o); if (el.dataset.k === k) return; el.dataset.k = k;
  if (o.t != null) el.querySelector('.ckt').innerHTML = o.t; if (o.s != null) el.querySelector('.cks').innerHTML = o.s;
  el.classList.toggle('lit', !!o.lit); el.classList.toggle('dis', !!o.dis); el.classList.toggle('rec', !!o.rec); el.classList.toggle('hot', !!o.hot); el.classList.toggle('on', !!o.lit); if (o.guard !== undefined) el.classList.toggle('guard', !!o.guard);
  if (o.heat !== undefined) { if (o.heat) el.dataset.heat = JSON.stringify(o.heat); else delete el.dataset.heat; }
}
function croSet(id, v, col, label) {
  const el = $(id); if (!el) return; const k = v + '|' + col + '|' + label; if (el.dataset.k === k) return; el.dataset.k = k;
  el.querySelector('.cv span').innerHTML = v; if (col) el.querySelector('.cv').style.setProperty('--vc', col); if (label) el.querySelector('.clg').textContent = label;
}
const mmss = gm => { const t = Math.min(5999, Math.max(0, Math.round(gm * P.secPerMin))); return String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0'); };
const hcol = h => h >= 0.95 ? CC.red : h >= 0.8 ? CC.orange : h >= 0.6 ? CC.amber : CC.cyan;
// ----- rail -----
function cRail() {
  croSet('r-clk', mmss(S.t), CC.green);
  ckeySet('k-pause', { t: paused ? 'RESUME' : 'PAUSE', s: 'P', lit: paused });
  [0.5, 1, 2].forEach((v, i) => ckeySet('k-t' + i, { lit: tscale === v }));
  clampSet('lMaster', S.hull < 40 || (S.melt || 0) > 0.4 || (S.vent.on && S.vent.forced) || S.inc.length > 0, { fl: true });
  clampSet('lInc', S.inc.length > 0, { fl: true }); clampSet('lFins', !!S.vent.on); clampSet('lQuiet', S.t < S.quietUntil);
  clampSet('lSpool', !!S.spool, { fl: true }); clampSet('lSol', S.an.some(a => a.state === 'locked' && E.solveInfo(S, a).ready), { fl: true });
  const lk = S.an.filter(a => a.state === 'locked');
  [['tac', 'TACTICAL', '1'], ['str', 'STRATEGIC', '2'], ['tgt', engageId != null ? 'TARGET ' + (engageId + 1) : 'TARGET', '3']].forEach(([v, t, k]) => ckeySet('kv-' + v, { t, s: k, lit: view === v, dis: v === 'tgt' && !lk.length && engageId == null }));
}
// ----- heat -----
function cHeat() {
  const h = S.sink.h, r = E.heatRate(S), q = heatHover ? E.heatRate(S, heatHover) : null, rp = r * R * 100, qp = q == null ? null : q * R * 100;
  if (hbufS !== S) { hbufS = S; hbuf = []; }
  if (!hbuf.length || S.t - hbuf[hbuf.length - 1].t >= 0.4) { hbuf.push({ t: S.t, h }); while (hbuf.length > 60 && (S.t - hbuf[0].t) * P.secPerMin / 60 > 5.5) hbuf.shift(); }
  csvg('g-tank', ctankSvg(h * 100, q == null ? null : Math.max(0, Math.min(100, (h + q * R) * 100)), S.vent.on && S.vent.forced && h >= P.forcedRetract ? P.forcedRetract * 100 : null));
  csvg('d-rate', crateDialSvg(rp, qp));
  csvg('g-trend', ctrendSvg(hbuf, S.t, h, r, q));
  const clk = (rr) => rr > 0.0003 ? ['FULL IN', mmss((1 - h) / rr)] : rr < -0.0003 ? ['EMPTY IN', mmss(h / -rr)] : ['STEADY', '--:--'];
  const c0 = clk(r), c1 = q == null ? null : clk(q), show = c1 || c0;
  croSet('r-full', show[1], c1 ? CC.cyan : (r > 0.0003 ? (h + 0.0 > 0.8 ? CC.red : CC.amber) : r < -0.0003 ? CC.cyan : CC.green), show[0]);
  const forcedLock = S.vent.on && S.vent.forced && h >= P.forcedRetract;
  ckeySet('k-vent', S.vent.on ? { t: forcedLock ? 'VENTING' : 'RETRACT', s: forcedLock ? 'LOCKED UNTIL ' + Math.round(P.forcedRetract * 100) + '%' : 'FINS IN &middot; V', hot: true, dis: forcedLock, heat: { ventOn: false } } : { t: 'VENT', s: h < P.ventMin ? 'SINK LOW' : 'FINS OUT &middot; V', dis: h < P.ventMin || !!S.over, heat: { ventOn: true } });
  const qa = S.t < S.quietUntil, cd = Math.max(0, S.quietCd - S.t);
  ckeySet('k-quiet', qa ? { t: 'QUIET', s: (S.quietUntil - S.t).toFixed(1) + ' MIN LEFT', lit: true } : { t: 'GO QUIET', s: S.vent.on ? 'NOT WITH FINS OUT' : cd > 0 ? 'READY IN ' + fmtMin(cd) : 'Q', dis: cd > 0 || !!S.vent.on || !!S.over, heat: { quiet: 1 } });
  croSet('r-qcd', cd > 0 ? mmss(cd) : 'READY', cd > 0 ? CC.amber : CC.green);
  clampSet('lh-fins', !!S.vent.on); clampSet('lh-peg', h >= 1); clampSet('lh-60', h >= 0.6); clampSet('lh-80', h >= 0.8); clampSet('lh-95', h >= 0.95, { fl: true }); clampSet('lh-melt', (S.melt || 0) > 0.05, { fl: true });
  const xp = E.exposure(S), grp = { 'ls-drive': ['drift', 'engine'], 'ls-sense': ['focus', 'track'], 'ls-ping': ['ping', 'beam'], 'ls-pell': ['pell'], 'ls-spool': ['spool'], 'ls-blast': ['blast', 'near'] }, sums = {};
  Object.entries(grp).forEach(([id, ks]) => { sums[id] = xp.quiet ? 0 : xp.parts.filter(p => ks.includes(p.k)).reduce((m, p) => m + p.v, 0); });
  const big = Math.max(1e-9, ...Object.values(sums));
  Object.entries(sums).forEach(([id, v]) => clampSet(id, v > 0.0005, { dim: v < big * 0.5 }));
}
// ----- signature and ship -----
function cSig() {
  const xp = E.exposure(S), vis = E.ourVis(S) * 100, gv = heatHover ? E.visIf(S, heatHover) * 100 : null;
  csvg('g-seen', cbandSvg('SEEN BY ENEMY', vis, 24, 8, [['COLD', 30, '#1d4f55'], ['WARM', 30, '#6a5522'], ['HOT', 40, '#7a2a1c']], Math.round(vis) + '%', xp.quiet ? 'DARK' : S.vent.on ? 'FINS OUT' : '', gv));
  const pr = $('pipsrow'); if (pr) [...pr.children].forEach((p, i) => { const k = i < S.stage ? ['a', 'o', 'r'][i] : ''; if (p.dataset.k !== k) { p.dataset.k = k; p.className = 'cled ' + k; } });
  const hs = S.an.filter(a => a.kind === 'real' && a.state !== 'disabled'), dog = S.dog && hs.length;
  clampSet('la-calm', !!dog && hs.every(a => (a.sil || 1) > 1)); clampSet('la-sil', !!dog && hs.some(a => (a.sil || 1) < 1)); clampSet('la-alert', !!dog && (S.stage > 0 || hs.some(a => (a.know || 0) > 0.3)));
}
function cShip() {
  const hp = Math.max(0, S.hull) / 100; csvg('g-hull', csegSvg('HULL', hp, hp < 0.4 ? CC.red : hp < 0.7 ? CC.amber : CC.green, Math.round(S.hull) + '%', 12, 8, [], 10));
  const eff = S.sysEff == null ? 1 : S.sysEff, col = eff < 0.5 ? 'r' : eff < 0.9 ? 'a' : 'g', hm = S.hull < 60;
  clampSet('ln-sens', true, { col: hm || eff < 0.9 ? (eff < 0.5 ? 'r' : 'a') : 'g' }); clampSet('ln-drive', true, { col }); clampSet('ln-weap', true, { col }); clampSet('ln-breach', true, { col: S.spool ? 'a' : 'g', fl: !!S.spool });
  ckeySet('k-pell', { t: 'PELL ASSIST', s: 'RUNS HOT', lit: !!S.pell }); ckeySet('k-pellact', { t: 'PELL ACTS', s: S.integration >= 75 ? 'NO ASKING' : 'AT 75%', lit: !!S.pellAct, dis: S.integration < 75 });
  csvg('g-integ', csegSvg('INTEGRATION', S.integration / 100, CC.violet, Math.round(S.integration) + '%', 12, 8, [.25, .5, .75], 10));
  const sp = S.spool, left = sp ? Math.max(0, sp.at - S.t) : 0, tot = S.spoolMin || P.spool;
  csvg('g-spool', csegSvg('BREACH SPOOL', sp ? 1 - left / tot : 0, CC.amber, sp ? mmss(left) : 'IDLE', 24, 8, S.dog ? [P.spool / tot] : [], 20));
  ckeySet('k-breach', sp ? { t: 'CANCEL', s: 'SPOOLING', lit: true, hot: false, dis: !!S.over, heat: null } : { t: 'BREACH', s: 'BREAK CONTACT', dis: !!S.over, heat: { spoolOn: 1 } });
  croSet('r-eta', sp ? mmss(left) : '--:--', sp ? CC.amber : CC.green); clampSet('ln-jump', !sp); clampSet('ln-dog', !!S.dog);
}
// ----- contact slips -----
const LEDW = { 'DECISION': ['a', 1], 'NOT READ': ['', 0], 'UNRESOLVED': ['c', 0] };
function slipVM(a) {
  const isF = a.idStatus === 'plan', isH = a.idStatus === 'hostile', c = E.classify(S, a), nread = ['thermal', 'reactor', 'occlusion'].reduce((m, ch) => m + (a.read[ch]?.den || 0), 0);
  const rdy = !isF && !isH && a.state === 'open' && E.advice(S, a).call !== 'unsure';
  let word = '', led = '', fl = 0, tier = 'c';
  if (isF) word = 'FRIENDLY', led = 'g'; else if (a.state === 'disabled') word = a.kind === 'friend' ? 'DISABLED' : 'CRIPPLED'; else if (a.state === 'out') word = 'RULED OUT';
  else if (a.state === 'chasing') word = 'CHASING', led = 'r', fl = 1, tier = 'f';
  else if (a.state === 'locked') { const si = E.solveInfo(S, a); tier = 'f'; if (si.ready) word = 'SOLUTION READY', led = 'g', fl = 1; else if (si.stale) word = 'STALE', led = 'a', fl = 1; else word = 'SOLVING ' + Math.round(si.prog * 100) + '%', led = 'r'; }
  else if (isH) word = 'HOSTILE', led = 'r', fl = 1, tier = 'f';
  else if (rdy) word = 'DECISION', led = 'a', fl = 1, tier = 'f'; else if (nread < 1) word = 'NOT READ'; else word = 'UNRESOLVED', led = 'c', tier = 'f';
  const venting = a.vent && a.ventSeen && a.state !== 'disabled';
  if (venting && !['locked'].includes(a.state)) { led = 'o'; if (tier === 'c') word = word; }
  let kind = '?', gcol = '#8fa89d';
  if (isF) kind = 'ally'; else if (a.state === 'disabled') kind = 'wreck'; else if (isH) kind = 'ship', gcol = CC.amber; else if (c.n >= 1 && c.p >= 0.5) { kind = { real: 'ship', lure: 'decoy', ghost: 'static' }[c.best]; gcol = { real: CC.amber, lure: CC.cyan, ghost: '#8aa196' }[c.best]; }
  const odds = isF || a.state === 'disabled' ? '' : isH ? '100%' : c.n >= 1 ? Math.min(99, Math.round(c.p * 100)) + '%' : '--';
  const pos = isF ? E.truePos(a, S.t) : a.state === 'locked' && a.anchor ? E.estAt(a, S.t - a.anchor.t) : E.displayPos(S, a), rng = Math.round(Math.hypot(pos.x - S.player.x, pos.y - S.player.y));
  const chans = ['thermal', 'reactor', 'occlusion'].map(ch => {
    const q = a.read[ch], blind = !!(q && q.blind), has = q && !q.blind && q.den > 0, w = S.analysts.find(x => x.id === E.ANALYSTS.find(z => z.ch === ch).id);
    const v = has ? Math.max(0, q.num / q.den) : 0, pr = has ? Math.min(1, q.den / P.readDone) : 0;
    return { ch, off: blind || isF, sig: has ? Math.max(2, Math.min(100, v * 100)) : 0, prog: pr * 100, done: pr >= 1, hold: w.task === a.id && (a.state === 'open' || a.state === 'locked'), op: has ? 0.3 + 0.7 * ago(q) : 1, n: blind ? '--' : pr >= 1 ? '&#10003;' : has ? Math.round(Math.min(99, v * 100)) : '?' };
  });
  return { n: a.id + 1, word, led, fl, tier, kind, gcol, odds, rng, chans, venting, c, isF, isH, rdy, nread };
}
function slipHtml(a, vm, full, y, sel) {
  const lkc = a.state === 'locked' ? ' lk' : '', cls = (sel ? ' sel' : '') + lkc + (vm.isF ? ' ally' : '') + (a.state === 'out' ? ' out' : '');
  let inner = '<div class="cf"></div>';
  inner += cwid('id', 0, 0, 4, 4, vm.n, { tag: 'id 4x4u' });
  if (full) {
    inner += cwid('st', 4, 0, 14, 4, `<i class="cled ${vm.led}${vm.fl ? ' fl' : ''}"></i><b style="color:${{ g: CC.green, a: CC.amber, r: CC.red, c: CC.cyan, o: CC.orange, '': '#6f877d' }[vm.led]}">${vm.word}</b>`, { tag: 'st 14x4u' });
    inner += cwid('cls', 18, 0, 4, 4, cglyph(vm.kind, vm.gcol), { tag: 'cls 4x4u' });
    inner += cwid('od', 22, 0, 6, 4, `<b>${vm.odds}</b><span class="clg">ODDS</span>`, { tag: 'od 6x4u' });
    inner += cwid('rng', 28, 0, 8, 4, `${vm.rng}<small style="font-size:.7em;margin-left:.2em">km</small>`, { tag: 'rng 8x4u' });
    vm.chans.forEach((c, i) => { const k = CHK[c.ch]; inner += cwid('ch', i * 12, 4, 12, 4, `<b>${k[0]}</b><div class="cbar"><i style="width:${c.sig}%;opacity:${c.op.toFixed(2)}"></i><u style="width:${c.prog}%"></u><s></s></div><span class="cn">${c.n}</span>`, { cls: (c.done && !c.off ? 'done ' : '') + (c.off ? 'off ' : '') + (c.hold ? 'hold ' : '') + (c.done && !c.off ? 'on' : ''), act: 'chan', arg: a.id + ':' + c.ch, style: `--cc:${k[2]}`, tag: 'ch 12x4u', tip: `${k[1]}: ${a.read[c.ch]?.blind ? (c.ch === 'occlusion' ? 'not backlit, no visual read' : 'blind') : 'strength bar, collection line underneath'}. Click to point ${E.ANALYSTS.find(z => z.ch === c.ch).name} at this contact: faster, cleaner reads, but it adds heat.` }); });
  } else {
    inner += cwid('st', 4, 0, 5, 4, `<i class="cled ${vm.led}${vm.fl ? ' fl' : ''}"></i>`, { tag: 'S 5x4u' });
    inner += cwid('cls', 9, 0, 4, 4, cglyph(vm.kind, vm.gcol), { tag: 'cls 4x4u' });
    inner += cwid('micro', 13, 0, 14, 4, vm.chans.map(c => `<i class="${c.off ? 'off' : ''}" style="--cc:${CHK[c.ch][2]}"><b style="width:${c.sig}%"></b></i>`).join(''), { tag: 'micro 14x4u' });
    inner += cwid('rng', 27, 0, 9, 4, (vm.venting ? `<span style="color:${CC.orange};margin-right:.6em">VENT</span>` : vm.word === 'RULED OUT' ? `<span style="color:#566b62;margin-right:.6em">OUT</span>` : '') + vm.rng, { tag: 'rng 9x4u' });
  }
  return { cls, html: inner };
}
function cEvidence(a) {   // short certainty line and the evidence behind it
  if (!a) return 'NO CONTACT SELECTED. CLICK A SLIP OR A CONTACT ON THE SCOPE.';
  const vm = slipVM(a), c = vm.c, nm = CH;
  if (vm.isF) return 'FRIENDLY: ARRIVED WITH US. WEAPONS SAFE.'; if (a.state === 'disabled') return 'DEAD IN THE WATER. DRIVE OUT, NO HEAT, REACTOR LINE GONE.'; if (a.state === 'out') return 'RULED OUT. PRESS RE-ANALYZE FOR A SECOND LOOK.';
  if (vm.isH && a.state === 'open') return '<b>HOSTILE 100%</b> IT PINGED US. LOCK IT AND GO AFTER IT.';
  if (a.state === 'locked') return '<b>WARSHIP</b> ' + solTxt(a).toUpperCase();
  if (c.n < 1 && vm.nread < 1) return 'NO READINGS YET. INVESTIGATE TO PUT ALL THREE ANALYSTS ON IT.';
  const ev = ['thermal', 'reactor', 'occlusion'].map(ch => { const q = a.read[ch], w = nm[ch].n.toUpperCase(); if (!q || (!q.blind && !(q.den > 0))) return w + ' ?'; if (q.blind) return w + (ch === 'occlusion' ? ' NOT BACKLIT' : ' BLIND'); const k = E.cat(Math.max(0, q.num / q.den)); return w + ' ' + (k === 'none' ? 'CLEAR' : k.toUpperCase()); }).join(' &middot; ');
  const head = c.p >= 0.5 ? `<b>MOST LIKELY ${{ real: 'A WARSHIP', lure: 'A DECOY', ghost: 'STATIC' }[c.best]}, ${Math.min(99, Math.round(c.p * 100))}% CERTAIN</b>` : '<b>NOT SURE YET</b>';
  return head + ' &middot; ' + ev;
}
function cSlips() {
  const host = $('ct'); if (!host) return;
  if (!host.dataset.built) { host.dataset.built = S.seed; host.innerHTML = ''; cCache.slips = {}; }
  const vms = S.an.map(a => ({ a, vm: slipVM(a) }));
  if (selId == null || !S.an[selId] || S.an[selId].state === 'disabled' && false) { const d = vms.find(x => x.vm.word === 'DECISION') || vms.find(x => x.vm.tier === 'f') || vms[0]; selId = d ? d.a.id : null; }
  let nf = 0; vms.forEach(x => { x.full = x.vm.tier === 'f' && nf < 6 || x.a.id === selId && x.vm.tier === 'f' ? (nf++, true) : false; });
  const order = vms.slice().sort((p, q) => (q.full - p.full) || (p.a.id - q.a.id)); let y = 3;
  order.forEach(({ a, vm, full }) => {
    const sl = slipHtml(a, vm, full, y, a.id === selId); let el = $('sl' + a.id);
    if (!el) { host.insertAdjacentHTML('beforeend', `<div class="cw cslip" id="sl${a.id}" data-act="slip" data-arg="${a.id}" style="--x:0;--y:${y};--w:36;--h:${full ? 8 : 4};transition:top .22s"></div>`); el = $('sl' + a.id); }
    const key = (full ? 'F' : 'C') + sl.cls + sl.html; if (el.dataset.k !== key) { el.dataset.k = key; el.className = 'cw cslip' + sl.cls; el.innerHTML = sl.html; }
    el.style.setProperty('--y', y); el.style.setProperty('--h', full ? 8 : 4); el.dataset.tip = cEvidence(a).replace(/<[^>]+>/g, '');
    y += full ? 8.5 : 4.5;
  });
}
// ----- orders bank, beacon -----
function nextStep() {
  if (S.over) return { t: S.over === 'win' ? 'BOTH SHIPS CRIPPLED' : 'HUNT OVER', led: 'g' };
  if (S.inc.length) return { t: 'INCOMING FIRE: MOVE OFF THE AIM POINT OR <em>GO QUIET</em>', led: 'r', key: 'k-quiet' };
  const h = S.sink.h;
  if (S.vent.on && S.vent.forced) return { t: 'SINK FULL: FINS HOLD OUT UNTIL ' + Math.round(P.forcedStop * 100) + '%', led: 'r' };
  if (h >= 0.95 && !S.vent.on) return { t: 'SINK PEGGED: <em>VENT</em> NOW', led: 'r', key: 'k-vent' };
  if (h >= 0.8 && !S.vent.on && S.t >= S.quietUntil) return { t: 'SINK ' + Math.round(h * 100) + '%: <em>VENT</em> OR EASE OFF THE DRIVE', led: 'o', key: 'k-vent' };
  for (const a of S.an) if (a.state === 'locked') { const si = E.solveInfo(S, a); if (si.ready) return { t: 'C' + (a.id + 1) + ': SOLUTION READY, <em>TARGET</em> IT', led: 'a', key: 'k-tgt', id: a.id }; if (si.stale) return { t: 'C' + (a.id + 1) + ': SOLUTION STALE, REFRESH IT IN THE <em>TARGET</em> VIEW', led: 'a', key: 'k-tgt', id: a.id }; }
  const vms = S.an.map(a => ({ a, vm: slipVM(a) })), dec = vms.find(x => x.vm.word === 'DECISION');
  if (dec) return { t: 'C' + dec.vm.n + ': ' + Math.max(2, dec.vm.c.n) + ' SENSORS AGREE, <em>' + 'LOCK ON</em> OR <em>DISMISS</em>', led: 'a', key: E.advice(S, dec.a).call === 'junk' ? 'k-dis' : 'k-lock', id: dec.a.id };
  const hos = vms.find(x => x.vm.isH && x.a.state === 'open'); if (hos) return { t: 'C' + hos.vm.n + ' PINGED US: <em>LOCK ON</em>', led: 'r', key: 'k-lock', id: hos.a.id };
  const unr = vms.find(x => x.a.state === 'open' && !x.vm.isF && x.vm.nread >= 1 && !S.analysts.some(w => w.task === x.a.id));
  if (unr) return { t: 'C' + unr.vm.n + ': ' + Math.round(unr.vm.c.p * 100) + '% CERTAIN. <em>INVESTIGATE</em> TO RAISE IT', led: 'c', key: 'k-inv', id: unr.a.id };
  const nr = vms.find(x => x.a.state === 'open' && !x.vm.isF && x.vm.nread < 1); if (nr) return { t: 'C' + nr.vm.n + ': NOT READ YET. <em>INVESTIGATE</em>', led: 'c', key: 'k-inv', id: nr.a.id };
  if (S.spool) return { t: 'BREACH DRIVE SPOOLING: ' + fmtMin(Math.max(0, S.spool.at - S.t)), led: 'a' };
  if (S.posture === 'still' && S.orderId == null && S.routeI >= S.route.length) return { t: 'NO ORDERS: <em>RIGHT-CLICK</em> THE SCOPE TO GO SOMEWHERE', led: 'c' };
  return { t: 'ALL QUIET: KEEP SWEEPING', led: 'c' };
}
function cOrders() {
  const a = selId != null ? S.an[selId] : null, id = a ? a.id : -1, vm = a ? slipVM(a) : null, ok = a && !vm.isF && ['open', 'locked'].includes(a.state) && !S.over;
  cOn('ord-t', el => { el.textContent = a ? 'ORDERS FOR C' + (a.id + 1) : 'ORDERS'; });
  const on = a ? S.analysts.filter(w => w.task === id) : [], all = a && on.length === S.analysts.length, dark = S.t < S.quietUntil, cdp = Math.max(0, S.pingCd - S.t), nx = nextStep();
  ckeySet('k-inv', { t: 'INVESTIGATE', s: all ? 'STAND DOWN' : 'ALL 3 ANALYSTS', dis: !ok, lit: !!all, rec: nx.key === 'k-inv' && nx.id === id });
  ckeySet('k-ping', { t: 'ACTIVE PING', s: dark ? 'NOT WHEN QUIET' : cdp > 0 ? 'READY IN ' + fmtMin(cdp) : 'LOUD &middot; HEAT', dis: !ok || dark || cdp > 0, heat: { ping: 1 } });
  const lockd = a && a.state === 'locked';
  ckeySet('k-lock', lockd ? { t: 'TARGET &#9656;', s: vm.word, dis: !ok, lit: true, rec: nx.key === 'k-tgt' && nx.id === id } : { t: 'LOCK ON', s: a && a.state === 'open' && vm.rdy ? 'RECOMMENDED' : 'RULE IT IN', dis: !(ok && a.state === 'open'), rec: nx.key === 'k-lock' && nx.id === id });
  ckeySet('k-dis', { t: 'DISMISS', s: 'RULE OUT', dis: !(ok && a.state === 'open'), rec: nx.key === 'k-dis' && nx.id === id });
  ckeySet('k-re', { t: 'RE-ANALYZE', s: 'RULED OUT ONLY', dis: !(a && a.state === 'out' && !S.over) });
  ckeySet('k-rel', { t: 'RELEASE', s: 'ANALYSTS', dis: !on.length });
  const ev = cEvidence(a), e = $('evd'); if (e && e.dataset.k !== ev) { e.dataset.k = ev; e.innerHTML = ev; }
}
function cBeacon() {
  const n = nextStep(); S._nx = n; cOn('bc-t', el => { if (el.dataset.k !== n.t) { el.dataset.k = n.t; el.innerHTML = n.t; } }); cOn('bc-led', el => { const k = 'cled ' + n.led + ' fl'; if (el.className !== k) el.className = k; });
  ['k-lock', 'k-dis', 'k-inv', 'k-quiet', 'k-vent', 'k-tgt'].forEach(k => { const el = $(k); if (!el) return; if (k === 'k-vent' || k === 'k-quiet' || k === 'k-tgt') { el.classList.toggle('rec', n.key === k && !el.classList.contains('dis') && !(k === 'k-tgt' && n.id == null)); } });
}
// ----- helm -----
function cHelm() {
  const deg = ((Math.atan2(Math.cos(S.hdg || 0), -Math.sin(S.hdg || 0)) * 180 / Math.PI) + 360) % 360, nxw = S.route[S.routeI];
  let bug = null; if (nxw && S.posture === 'route') { const h2 = Math.atan2(nxw.y - S.player.y, nxw.x - S.player.x); bug = ((Math.atan2(Math.cos(h2), -Math.sin(h2)) * 180 / Math.PI) + 360) % 360; }
  csvg('d-comp', ccompassSvg(deg, bug));
  const moving = !(S.posture === 'still' && S.orderId == null), sp = E.SPEED[S.speed];
  croSet('r-spd', moving ? sp.v.toFixed(1) : '0.0', moving ? CC.cyan : '#6f877d'); cOn('r-spd', el => { const sm = el.querySelector('.cv small'); });
  if (S.posture === 'route' && nxw) { const d = Math.hypot(nxw.x - S.player.x, nxw.y - S.player.y), v = E.SPEED[nxw.speed || S.speed].v; croSet('r-leg', mmss(d / v), CC.cyan, 'LEG ' + (S.routeI + 1) + '/' + S.route.length); } else croSet('r-leg', '--:--', '#6f877d', 'LEG');
  SPDK.forEach(k => ckeySet('kd-' + k, { lit: S.speed === k, s: E.SPEED[k].v + ' KM/M', heat: moving ? { speed: k } : { speed: k, posture: 'route', route: [{ x: Math.round(S.player.x) + 20, y: Math.round(S.player.y) }], routeI: 0, orderId: null } }));
  const still = S.posture === 'still' && S.orderId == null;
  ckeySet('k-hold', { lit: still && S.routeI >= S.route.length || (still && S.route.length > S.routeI) }); ckeySet('k-evade', { lit: S.posture === 'evade' && S.orderId == null });
  const left = S.route.length - S.routeI, ck = $('k-clear');
  if (left > 0) { const act = S.posture === 'route' ? 'clearplan' : 'resume'; if (ck.dataset.act !== act) ck.dataset.act = act; ckeySet('k-clear', { t: act === 'clearplan' ? 'CLEAR PLAN' : 'RESUME PLAN', s: left + ' WAYPOINT' + (left > 1 ? 'S' : '') + (act === 'resume' ? ' LEFT' : ''), lit: act === 'resume' }); }
  else { ckeySet('k-clear', { t: 'NO PLAN', s: 'GO SOMEWHERE', dis: true }); }
  const lc = { v1: 'c', v2: 'g', v3: 'g', v4: 'a', v5: 'o', ab: 'r' };
  for (let i = 0; i < 4; i++) { const w = S.route[S.routeI + i]; clampSet('lw' + i, !!w, { col: w ? lc[w.speed || S.speed] : 'a' }); }
  clampSet('l-plan', S.posture === 'route'); const sa = selId != null ? S.an[selId] : null; clampSet('l-back', !!(sa && sa.read.occlusion && !sa.read.occlusion.blind && sa.read.occlusion.den > 0));
  croSet('r-zoom', VZ.toFixed(1) + '&times;', CC.cyan); croSet('r-ring', ringKm(), CC.cyan); ckeySet('zfollow', { lit: follow });
}
// ----- weapons and comms -----
function cWeapons() {
  S.tubes.forEach((x, i) => { const rdy = S.t >= x, p = rdy ? 1 : 1 - (x - S.t) / P.reload; csvg('g-tube' + i, csegSvg('SALVO ' + (i + 1), p, rdy ? CC.green : CC.amber, rdy ? 'READY' : 'RELOAD ' + fmtMin(x - S.t), 12, 8, [], 8)); });
  const cwr = S.t >= S.cwCd; csvg('g-coil', csegSvg('COILGUN', cwr ? 1 : 0.3, cwr ? CC.green : CC.amber, cwr ? 'READY' : fmtMin(S.cwCd - S.t), 12, 8, [], 8));
  const vo = S.volleys.length ? Math.min(...S.volleys.map(v => v.at - S.t)) : null; croSet('r-fly', vo == null ? '--:--' : mmss(Math.max(0, vo)), vo == null ? '#6f877d' : CC.amber);
  const lk = S.an.filter(a => a.state === 'locked'), rd = lk.find(a => E.solveInfo(S, a).ready), t0 = rd || lk[0], si = t0 && E.solveInfo(S, t0);
  ckeySet('k-tgt', { t: 'TARGET &#9656;', s: t0 ? 'C' + (t0.id + 1) + (si.ready ? ' READY' : si.stale ? ' STALE' : ' SOLVING') : 'NO LOCK', dis: !lk.length, lit: !!lk.length });
  clampSet('lw-live', lk.some(a => a.anchor && S.t - a.anchor.t < 0.8), { fl: true }); clampSet('lw-stale', lk.some(a => E.solveInfo(S, a).stale)); clampSet('lw-rng', lk.some(a => a.anchor && E.closeInfo(S, a).d <= P.closeRange));
  clampSet('lw-fr', S.an.some(a => a.idStatus === 'plan' && a.state !== 'disabled'));
  ckeySet('k-voice', { t: 'VOICE', s: VRATES[vIdx][0].toUpperCase(), lit: vIdx > 0 }); ckeySet('k-rall', { t: allReports ? 'ALL CALLS' : 'KEY CALLS', s: allReports ? 'ALL' : 'KEY', lit: allReports });
}
function cSensors() {
  E.ANALYSTS.forEach((def, i) => {
    const w = S.analysts.find(x => x.id === def.id), tid = w.task, tgt = tid != null ? S.an[tid] : null; let word = 'SWEEP', led = 'g', num = '--', ncol = '#33423c';
    if (S.sink.h >= 1) { word = 'OFF'; led = 'r'; } else if (S.t < S.quietUntil) { word = 'DARK'; led = ''; }
    else if (tgt) { const q = tgt.read[def.ch]; num = 'C' + (tid + 1); ncol = CC.amber; if (q && q.blind) { word = 'BLIND'; led = 'a'; } else if (tgt.state === 'locked') { word = 'TRACK'; led = 'a'; } else { word = 'FOCUS'; led = 'c'; } }
    else { let best = null, bt = -1; S.an.forEach(a => { const q = a.read[def.ch]; if (q && q.den > 0 && q.t > bt) { bt = q.t; best = a; } }); if (best) { num = 'C' + (best.id + 1); ncol = '#6f877d'; } }
    const t = $('an-t' + i), s = $('an-s' + i), l = $('an-l' + i), k = num + word + led; if (t.dataset.k !== k) { t.dataset.k = k; t.textContent = num; t.style.color = ncol; s.textContent = word; l.className = 'cled ' + led; }
  });
}
function cUpdate() {
  const secs = [cRail, cHeat, cSig, cShip, cSensors, cSlips, cOrders, cBeacon, cHelm, cWeapons];
  secs.forEach(f => { try { f(); } catch (e) { if (errN++ < 6) console.error('console ' + f.name, e); } });
  document.body.classList.toggle('sweep', !!S.pending);
}
/* ---------- actions, hover previews, keys ---------- */
const ACT = {
  pause() { $('pause').click(); }, speed(el) { setTime(+el.dataset.arg); }, menu() { $('manbtn').click(); },
  view(el) { if (!el.classList.contains('dis')) setView(el.dataset.arg); },
  vent() { ventToggle(); }, quiet() { E.goQuiet(S); uiUpdate(true); }, breach() { E.retreat(S); uiUpdate(true); },
  pell() { S.pell = !S.pell; uiUpdate(true); }, pellact() { E.setPellAct(S, !S.pellAct); uiUpdate(true); },
  voice() { $('vcyc').click(); cWeapons(); }, rall() { $('rall').click(); cWeapons(); },
  drive(el) { E.setSpeed(S, el.dataset.arg); uiUpdate(true); }, hold() { E.setOrder(S, 'still', null); uiUpdate(true); }, evade() { E.setOrder(S, 'evade', null); uiUpdate(true); },
  clearplan() { E.setOrder(S, 'still', null); E.setRoute(S, []); uiUpdate(true); }, resume() { E.setOrder(S, 'route', null); uiUpdate(true); }, editplan() { planEdit = true; setView('str'); },
  slip(el) { selId = +el.dataset.arg; uiUpdate(true); },
  chan(el) { const [id, ch] = el.dataset.arg.split(':'), a = S.an[+id]; if (['open', 'locked'].includes(a.state) && a.idStatus !== 'plan') E.assign(S, E.ANALYSTS.find(w => w.ch === ch).id, a.id); selId = a.id; uiUpdate(true); },
  analyst(el) { const w = S.analysts.find(x => x.id === el.dataset.arg); if (w && w.task != null) E.assign(S, w.id, w.task); uiUpdate(true); },
  invest() { if (selId != null) E.investigate(S, selId); uiUpdate(true); }, ping() { if (selId != null) E.pingContact(S, selId); uiUpdate(true); },
  lock() { const a = S.an[selId]; if (!a) return; if (a.state === 'open') E.lockContact(S, a.id); else if (a.state === 'locked') openTarget(a.id); uiUpdate(true); },
  dismiss() { if (selId != null) E.dismissContact(S, selId); uiUpdate(true); }, reanalyze() { if (selId != null) E.reanalyze(S, selId); uiUpdate(true); },
  release() { S.analysts.filter(w => w.task === selId).forEach(w => E.assign(S, w.id, selId)); uiUpdate(true); },
  target() { const lk = S.an.filter(a => a.state === 'locked'); if (lk.length) openTarget((lk.find(a => E.solveInfo(S, a).ready) || lk[0]).id); },
  beacon() { const n = S._nx; if (n && n.id != null) { selId = n.id; uiUpdate(true); } },
};
document.addEventListener('click', e => { const el = e.target.closest && e.target.closest('#stage [data-act]'); if (!el || !S || el.classList.contains('dis') || el.id === 'stage') return; if (ACT[el.dataset.act]) { ACT[el.dataset.act](el); hideTip(); } });
document.addEventListener('contextmenu', e => { const el = e.target.closest && e.target.closest('#ct .cslip'); if (el && S) { e.preventDefault(); selId = +el.dataset.arg; openMenu(selId, e.clientX, e.clientY); } });
let tipEl = null;
function hideTip() { tipEl = null; const t = $('ctip'); if (t) t.hidden = true; }
function tipHtml(el) {
  let h = ''; const key = el.querySelector && el.querySelector('.ckt'); if (key && !el.classList.contains('cslip')) h += `<b>${key.textContent}</b><br>`;
  if (el.dataset.tip) h += `<span class="${el.dataset.heat ? 'dm' : ''}">${cesc(el.dataset.tip).replace(/&quot;/g, '"')}</span>`;
  if (el.dataset.heat && S) {
    const mod = JSON.parse(el.dataset.heat), r0 = E.heatRate(S), r1 = E.heatRate(S, mod), h0 = S.sink.h, f = v => (v >= 0 ? '+' : '') + Math.round(v * R * 100), clk = rr => rr > 0.0003 ? mmss((1 - h0) / rr) : rr < -0.0003 ? 'EMPTY ' + mmss(h0 / -rr) : 'STEADY', v0 = Math.round(E.ourVis(S) * 100), v1 = Math.round(E.visIf(S, mod) * 100);
    h += `${h ? '<br><br>' : ''}<b>HOVER PREVIEW${mod.route ? ' (IF UNDER WAY)' : ''}</b><br>HEAT RATE <em>${f(r0)}</em> &rarr; <em>${f(r1)}</em> %/MIN<br>FILL CLOCK <em>${clk(r0)}</em> &rarr; <em>${clk(r1)}</em><br>SEEN BY ENEMY <em>${v0}</em> &rarr; <em>${v1}</em>%<br><span class="dm">Nothing is committed until you click.</span>`;
  }
  return h;
}
document.addEventListener('mouseover', e => {
  const el = e.target.closest && e.target.closest('#stage [data-tip],#stage [data-heat]'); if (!el) { if (tipEl) hideTip(); return; } if (el === tipEl) return; tipEl = el;
  if (!S) { hideTip(); return; } const h = tipHtml(el), t = $('ctip'); if (!h) { hideTip(); return; } t.innerHTML = h; t.hidden = false;
  const r = el.getBoundingClientRect(), tw = t.offsetWidth, th = t.offsetHeight; let x = r.right + 8, y = r.top; if (x + tw > innerWidth - 6) x = Math.max(6, r.left - tw - 8); if (y + th > innerHeight - 6) y = innerHeight - th - 6; t.style.left = x + 'px'; t.style.top = Math.max(6, y) + 'px';
});
document.addEventListener('mouseleave', hideTip); addEventListener('blur', hideTip);
document.addEventListener('keydown', e => {   // orders bank keys and selection cycling (tactical view only)
  if (!S || briefing || paused || view !== 'tac' || !$('manual').hidden || e.ctrlKey || e.metaKey || e.altKey || (e.target.tagName === 'INPUT' && e.target.type === 'text')) return; const k = e.key.toLowerCase();
  const m = { i: 'invest', g: 'ping', l: 'lock', d: 'dismiss', r: 'reanalyze' }[k];
  if (m) { const btn = { invest: 'k-inv', ping: 'k-ping', lock: 'k-lock', dismiss: 'k-dis', reanalyze: 'k-re' }[m]; if (!$(btn).classList.contains('dis')) ACT[m](); e.preventDefault(); }
  else if (e.key === 'Tab') { e.preventDefault(); const live = S.an.filter(a => a.state !== 'out' || true), i = live.findIndex(a => a.id === selId); selId = live[(i + (e.shiftKey ? live.length - 1 : 1)) % live.length].id; uiUpdate(true); }
});
/* ---------- Strategic and Target views (same shell) ---------- */
function clin(vmin, vmax, val, ticks, label, unit, fmt, zones, ghost, rcol, sub, unc, mark) {
  const a = v => -120 + 240 * (Math.max(vmin, Math.min(vmax, v)) - vmin) / (vmax - vmin);
  const zs = (zones || [[null, null, '#2b6b66']]).map(([f0, f1, c]) => [f0 == null ? a(vmin) : a(f0), f1 == null ? a(vmax) : a(f1), c]);
  let s = cdialSvg(a(val), zs, ticks.map(t => [a(t), typeof t === 'string' ? t : fmt(t), true]), fmt(val), label, unit, ghost == null ? null : a(ghost), rcol, sub);
  let ex = '';
  if (unc) ex += `<path d="${carc(120, 82, 50, a(val - unc), a(val + unc))}" stroke="#ffb454" stroke-width="3" fill="none" opacity=".9"/>`;
  if (mark != null) { const [x0, y0] = cpol(120, 82, 36, a(mark)), [x1, y1] = cpol(120, 82, 54, a(mark)); ex += `<line x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}" stroke="#6fc3d0" stroke-width="3" stroke-dasharray="3 2"/>`; }
  return s.replace('</svg>', ex + '</svg>');
}
function cStrategic() {
  let m = cwid('glass', 0, 3, 62, 62, '<canvas id="map" aria-label="Strategic map"></canvas>', { cls: 'cglass', id: 'mapbox', tag: 'XL 62x62u', tip: 'The whole arena: our trail, the flight plan, and what we think is where. Wheel zooms, drag pans. In edit mode click to add a waypoint and click a waypoint to remove it. Right-click anywhere to go there.' });
  m += cplate(62, 3, 14, 4, 'FLIGHT PLAN', { tag: 'plate 14x4u' });
  m += ckeyW('k-pedit', 62, 7, 14, 6, 'EDIT PLAN', 'CLICK THE MAP', CC.amber, { act: 'pedit', tag: 'K 14x6u', tip: 'Click the map to add waypoints; click a waypoint to remove it. Each new leg flies at the current drive setting.' });
  m += ckeyW('k-pclear', 62, 13, 14, 4, 'CLEAR PLAN', '', null, { act: 'clearplan', tag: 'K 14x4u' }) + ckeyW('k-presume', 62, 17, 14, 4, 'RESUME PLAN', '', CC.green, { act: 'resume', tag: 'K 14x4u' });
  m += ckeyW('mzin', 62, 21, 7, 4, '+', '', null, { tag: 'K 7x4u' }) + ckeyW('mzout', 69, 21, 7, 4, '&minus;', '', null, { tag: 'K 7x4u' }) + ckeyW('mzfit', 62, 25, 14, 4, 'FIT', 'WHOLE ARENA', null, { tag: 'K 14x4u' });
  m += croW('r-plen', 62, 29, 'PLAN LENGTH', '888', 14, 4, { tag: 'T 14x4u' }) + croW('r-peta', 62, 33, 'PLAN ETA', '88:88', 14, 4, { tag: 'T 14x4u' });
  m += cplate(62, 37, 14, 8, 'CLICK MAP:<br>ADD WAYPOINT<br>CLICK A POINT:<br>REMOVE IT', { tag: 'plate 14x8u' }) + cplate(62, 45, 14, 8, 'RIGHT-CLICK:<br>GO HERE<br>SHIFT: QUEUE<br>A WAYPOINT', { tag: 'plate 14x8u' }) + cplate(62, 53, 14, 8, 'LEG COLOR =<br>DRIVE SETTING<br>CYAN SLOW<br>RED REDLINE', { tag: 'plate 14x8u' });
  let o = czone('MAP', 36, 8, 76, 66, 'ARENA', 'your plan, your trail, what we think is where', m, { vz: 'str', cls: 'blank' });
  let l = ''; for (let i = 0; i < 4; i++) l += cgauge('g-leg' + i, i * 12, 3, 12, 8, { tag: 'M 12x8u' });
  l += cplate(0, 11, 48, 4, 'LEG COLORS FOLLOW THE DRIVE SETTING WHEN THE LEG WAS ADDED', { tag: 'plate 48x4u' });
  o += czone('LEGS', 36, 74, 48, 16, 'LEGS', 'flight plan, per leg', l, { vz: 'str' });
  return o;
}
function cPlanUI() {
  const left = S.route.length - S.routeI, rest = S.route.slice(S.routeI); let L = 0, T = 0, px = S.player.x, py = S.player.y;
  rest.forEach(w => { const d = Math.hypot(w.x - px, w.y - py); L += d; T += d / E.SPEED[w.speed || S.speed].v; px = w.x; py = w.y; });
  ckeySet('k-pedit', { t: planEdit ? 'DONE' : 'EDIT PLAN', s: planEdit ? 'CLICK THE MAP' : 'ADD WAYPOINTS', lit: planEdit });
  ckeySet('k-pclear', { t: 'CLEAR PLAN', s: '', dis: !left }); ckeySet('k-presume', { t: 'RESUME PLAN', s: left ? left + ' LEFT' : '', dis: !left || S.posture === 'route', rec: left > 0 && S.posture !== 'route' });
  croSet('r-plen', Math.round(L), left ? CC.cyan : '#6f877d'); croSet('r-peta', left ? mmss(T) : '--:--', left ? CC.cyan : '#6f877d');
  for (let i = 0; i < 4; i++) { const w = rest[i]; if (!w) { csvg('g-leg' + i, csegSvg(i === 0 ? 'NO PLAN' : '', 0, '#33423c', i === 0 ? 'RIGHT-CLICK' : '--', 12, 8, [], 6)); continue; } const k = w.speed || S.speed, prev = i ? rest[i - 1] : S.player, d = Math.hypot(w.x - prev.x, w.y - prev.y); csvg('g-leg' + i, csegSvg('LEG ' + (S.routeI + i + 1) + ' &middot; ' + E.SPEED[k].label.toUpperCase(), 1, SPDC[k], mmss(d / E.SPEED[k].v) + (i === 3 && rest.length > 4 ? ' +' + (rest.length - 4) : ''), 12, 8, [], 6)); }
}
function cTarget() {
  let t = `<div class="cw cslip lk" id="tsl" style="--x:0;--y:1;--w:36;--h:8"></div>`;
  [['tl-ready', 'READY', 'g'], ['tl-solv', 'SOLVING', 'a'], ['tl-stale', 'STALE', 'r'], ['tl-pause', 'PAUSED', 'c']].forEach(([id, lab], i) => { t += clampW(id, 37 + i * 6, 1, lab, { tip: { READY: 'The firing solution is ready.', SOLVING: 'The crew is still working the solution.', STALE: 'The scan is too old. Refresh the solution or keep an analyst tracking it.', PAUSED: 'Sensors are dark, so the solution is paused.' }[lab] }); });
  t += cgauge('g-tsol', 37, 5, 24, 4, { tag: 'M 24x4u', tip: 'Firing solution progress. It speeds up with better readings, a fresh track, and Pell; hull damage, clutter and target maneuvers slow it.' });
  t += croW('r-tage', 62, 1, 'SCAN AGE', '88:88', 12, 4, { tag: 'T 12x4u' });
  t += ckeyW('k-trefresh', 62, 5, 12, 4, 'REFRESH', 'NEW SOLUTION', CC.amber, { act: 'trefresh', tag: 'K 12x4u', tip: 'Throw out this solution and work a fresh one. Pointing analysts at the contact keeps the track fresh without this.' });
  t += clampW('tl-live', 75, 1, 'LIVE', { tip: 'The contact is being observed right now: the bracket is solid.' }) + clampW('tl-proj', 81, 1, 'PROJ', { tip: 'The bracket is projected from the last scan: dashed.' });
  t += cplate(75, 5, 12, 4, 'SOLID = LIVE<br>DASHED = PROJECTED', { tag: 'plate 12x4u' });
  t += ckeyW('k-tnext', 88, 1, 12, 8, 'NEXT LOCK', 'CYCLE TARGET', CC.cyan, { act: 'tnext', tag: 'K 12x8u' }) + ckeyW('k-tback', 100, 1, 12, 8, 'BACK', 'ESC', null, { act: 'tback', tag: 'K 12x8u' });
  let o = czone('SOLUTION', 0, 8, 112, 10, '', '', t, { vz: 'tgt' });
  let p = cwid('glass', 0, 3, 64, 64, '<canvas id="plot"></canvas>', { cls: 'cglass', id: 'plotbox', tag: 'XL 64x64u' });
  p += croW('r-taim', 0, 67, 'AIM POINT', '888', 12, 4, { tag: 'T 12x4u' }) + croW('r-tarr', 12, 67, 'ARRIVE', '88:88', 12, 4, { tag: 'T 12x4u' }) + croW('r-tspd', 24, 67, 'TGT 1 MIN', '8.8', 12, 4, { tag: 'T 12x4u' });
  [['tp-grid', 'GRID', 'Grid read: whether the target is flying a pattern.'], ['tp-dng', 'DANGER', 'Our own missiles could land on us.'], ['tp-coil', 'COIL', 'The target is inside coilgun range.'], ['tp-fr', 'FRIEND', 'An ally is near the aim point.']].forEach(([id, lab, tip], i) => { p += clampW(id, 36 + i * 6, 67, lab, { tip }); });
  o += czone('PLOT', 0, 18, 64, 72, 'FIRE SOLUTION', '<span id="tgt-sub">contact</span>', p, { vz: 'tgt', cls: 'blank' });
  let d = '';
  [['d-brg', 0, 3], ['d-rng', 24, 3], ['d-bow', 0, 19], ['d-tspd', 24, 19], ['d-lead', 0, 35], ['d-cone', 24, 35]].forEach(([id, x, y]) => { d += cdial(id, x, y, 24, 16, { tag: 'L 24x16u' }); });
  d += ckeyW('k-tauto', 0, 51, 12, 4, 'FOLLOW ABARA', 'AUTO LEAD', CC.green, { act: 'tauto', tag: 'K 12x4u', tip: "Aim where Abara suggests. He tends to under-lead, so drag the aim point further along the track if the target is fast." });
  d += ckeyW('k-thom', 12, 51, 12, 4, 'HOMING', 'EASY TO SPOT', CC.amber, { act: 'thom', tag: 'K 12x4u', tip: 'Homing seekers: tighter landings, but easy to spot, so the target is more likely to maneuver off its line.' });
  [['he', 'HE', 'STANDARD'], ['emp', 'EMP', ''], ['flare', 'FLARE', '']].forEach(([k, t, s], i) => { d += ckeyW('k-am-' + k, 24 + i * 8, 51, 8, 4, t, s, CC.amber, { act: 'tammo', arg: k, tag: 'K 8x4u' }); });
  d += cgauge('g-hit', 0, 55, 24, 8, { tag: 'M 24x8u', tip: 'Chance that a missile gets close enough to do something, from 400 trial volleys at the current aim point and cone.' });
  [['tf-s0', 'SALVO 1'], ['tf-s1', 'SALVO 2'], ['tf-s2', 'SALVO 3'], ['tf-coil', 'COIL']].forEach(([id, lab], i) => { d += clampW(id, 24 + i * 6, 55, lab, { tip: id === 'tf-coil' ? 'Coilgun ready and the target is inside its range.' : 'This missile tube is loaded.' }); });
  [['tf-heat', 'DET HEAT', 'Detonations this close will light us up.'], ['tf-aware', 'AWARE', 'The target has noticed us and may maneuver.'], ['tf-near', 'NEAR US', 'Danger close: our own missiles could land on us.'], ['tf-grid', 'GRID', 'We have a grid read on this target.']].forEach(([id, lab, tip], i) => { d += clampW(id, 24 + i * 6, 59, lab, { tip }); });
  d += ckeyW('k-fire', 0, 63, 36, 8, 'FIRE SALVO', 'NEEDS A READY SOLUTION', CC.red, { act: 'tfire', tag: 'K-XL 36x8u', cls: 'guard' }) + ckeyW('k-coilg', 36, 63, 12, 8, 'COILGUN', 'UNDER 18 KM', CC.amber, { act: 'tcoil', tag: 'K 12x8u', tip: 'Point-blank kinetic round. Instant, ignores scatter grids, only inside 18 km, and the flash is loud.' });
  o += czone('AIM', 64, 18, 48, 72, 'AIM &amp; FIRE', '', d, { vz: 'tgt' });
  return o;
}
let hitNow = null;
function cTgtUpdate(T) {
  const { a, f, sug, q, rg, rel, aob, sp, si, rd } = T, vm = slipVM(a), sl = slipHtml(a, vm, true, 0, false), el = $('tsl'), key = sl.cls + sl.html;
  if (el.dataset.k !== key) { el.dataset.k = key; el.innerHTML = sl.html; }
  cOn('tgt-sub', e => { e.textContent = 'contact ' + (a.id + 1); });
  clampSet('tl-ready', si.ready, { fl: true }); clampSet('tl-solv', !si.ready && !si.stale && !si.paused); clampSet('tl-stale', si.stale, { fl: true }); clampSet('tl-pause', si.paused && !si.ready);
  csvg('g-tsol', csegSvg('', si.ready ? 1 : si.prog, si.ready ? CC.green : CC.amber, si.ready ? 'SOLUTION READY' : si.stale ? 'STALE: REFRESH' : si.paused ? 'PAUSED: SENSORS DARK' : Math.round(si.prog * 100) + '% &middot; ' + fmtMin(si.remain) + ' LEFT', 24, 4, [], 24));
  const age = S.t - q.t, live = age < 0.8 || (a.vent && a.ventSeen);
  croSet('r-tage', mmss(age), age > P.solveStale * 0.66 ? CC.amber : CC.green); clampSet('tl-live', live, { fl: true }); clampSet('tl-proj', !live);
  ckeySet('k-trefresh', { t: 'REFRESH', s: si.stale ? 'STALE: DO IT' : 'NEW SOLUTION', rec: si.stale }); const lk = S.an.filter(x => x.state === 'locked'); ckeySet('k-tnext', { t: 'NEXT LOCK', s: lk.length > 1 ? lk.length + ' LOCKED' : 'ONLY ONE', dis: lk.length < 2 });
  const nb = n => String(Math.round(n)).padStart(3, '0');
  csvg('d-brg', clin(0, 360, rel, [0, 90, 180, 270], 'BEARING', 'degrees off our bow', v => nb(v), [[null, null, '#2b6b66']], null, CC.cyan, '', Math.min(25, Math.atan2(sp.cross, rg) * 57.3)).replace(/>0</, '>AHD<').replace('>90<', '>STB<').replace('>180<', '>AST<').replace('>270<', '>PRT<'));
  csvg('d-rng', clin(0, 240, rg, [0, 60, 120, 180, 240], 'RANGE', 'km', v => String(Math.round(v)), [[null, P.closeRange, '#a8681f'], [P.closeRange, null, '#2b6b66']], null, CC.cyan, 'COILGUN ' + P.closeRange));
  csvg('d-bow', clin(-180, 180, aob, [-180, -90, 0, 90, 180], 'BOW ANGLE', aob < 0 ? 'degrees, crossing left' : 'degrees, crossing right', v => Math.abs(Math.round(v)) + '', [[null, null, '#2b6b66']], null, CC.cyan, '0 = HEAD ON', q.hs * 57.3));
  csvg('d-tspd', clin(0, 12, q.spd, [0, 3, 6, 9, 12], 'TARGET SPEED', 'km per minute', v => (v % 1 ? v.toFixed(1) : String(v)), [[null, 6, '#2b6b66'], [6, null, '#a8681f']], null, CC.cyan, '', q.spd * q.ss));
  csvg('d-lead', clin(0, 240, f.L, [0, 60, 120, 180, 240], 'AIM LEAD', 'km along path', v => String(Math.round(v)), [[null, null, '#a8681f']], null, CC.amber, 'DRAG THE PLOT', 0, sug));
  csvg('d-cone', clin(0, 24, cone, [0, 6, 12, 18, 24], 'CONE WIDTH', 'km spread', v => String(Math.round(v)), [[null, null, '#a8681f']], null, CC.amber, 'WHEEL ON PLOT'));
  croSet('r-taim', Math.round(f.L), CC.amber); croSet('r-tarr', mmss(P.engage + f.tf), CC.amber); croSet('r-tspd', q.spd.toFixed(1), CC.cyan);
  const sr = selfCache, ci = E.closeInfo(S, a), inR = ci.d <= P.closeRange, cwr = S.t >= S.cwCd, dang = sr.p >= 0.03;
  clampSet('tp-grid', !!a.flutter); clampSet('tp-dng', dang, { fl: true, col: 'r' }); clampSet('tp-coil', inR); clampSet('tp-fr', S.an.some(x => x.idStatus === 'plan' && x.state !== 'disabled' && Math.hypot(E.truePos(x, S.t).x - f.aim.x, E.truePos(x, S.t).y - f.aim.y) < P.killR * 2));
  cOn('r-tarr', e => { e.dataset.tip = $('eninfo').textContent; }); cOn('tp-dng', e => { e.dataset.tip = $('selfwarn').textContent; }); cOn('plotbox', e => { e.dataset.tip = $('scale').textContent; });
  ckeySet('k-tauto', { t: 'FOLLOW ABARA', s: 'AUTO LEAD', lit: aimL == null }); ckeySet('k-thom', { t: 'HOMING', s: 'EASY TO SPOT', lit: !!homing });
  ['he', 'emp', 'flare'].forEach(k => { ckeySet('k-am-' + k, { t: k.toUpperCase(), s: { he: 'STANDARD', emp: 'DISABLES', flare: 'BLINDS' }[k], lit: ammo === k }); cOn('k-am-' + k, e => { e.dataset.tip = E.WARHEAD[k].tip; }); });
  if (hitNow) { const hv = hitNow.hv; csvg('g-hit', csegSvg('HIT CHANCE', hv / 100, hv < 25 ? CC.red : hv < 55 ? CC.amber : CC.green, hv + '%', 24, 8, [], 20)); cOn('g-hit', e => { e.dataset.tip = $('ammotip').textContent; }); }
  S.tubes.forEach((x, i) => clampSet('tf-s' + i, S.t >= x, { col: 'g' })); clampSet('tf-coil', inR && cwr, { col: 'g' });
  clampSet('tf-heat', sr.dist < 24); clampSet('tf-aware', !!a.aware); clampSet('tf-near', dang, { fl: true, col: 'r' }); clampSet('tf-grid', !!a.flutter, { col: 'c' });
  const fb = $('fire'), kf = $('k-fire'); { const fireable = si.ready && rd && !si.stale; kf.classList.toggle('gd', fireable); if (!fireable) kf.classList.remove('armed'); }
  if (si.stale) ckeySet('k-fire', { t: 'REFRESH', s: 'SOLUTION IS STALE', guard: false, hot: false, dis: false, lit: true });
  else if (!si.ready) ckeySet('k-fire', { t: 'SOLVING', s: si.paused ? 'PAUSED' : fmtMin(si.remain) + ' LEFT', dis: true, guard: true });
  else if (!rd) ckeySet('k-fire', { t: 'RELOADING', s: fmtMin(Math.min(...S.tubes.map(x => x - S.t))), dis: true, guard: true });
  else ckeySet('k-fire', { t: 'FIRE SALVO', s: (hitNow ? hitNow.hv + '% HIT CHANCE' : 'READY') + (dang ? ' &middot; DANGER CLOSE' : ''), hot: true, guard: false, dis: false });
  ckeySet('k-coilg', { t: 'COILGUN', s: cwr ? (inR ? 'READY' : 'UNDER ' + P.closeRange + ' KM') : fmtMin(S.cwCd - S.t), dis: !inR || !cwr, hot: inR && cwr });
}
Object.assign(ACT, {
  pedit() { planEdit = !planEdit; if (view === 'str') drawMap(); uiUpdate(true); }, trefresh() { if (engageId != null) E.refreshSolution(S, engageId); engUpdate(true); },
  tnext() { const lk = S.an.filter(x => x.state === 'locked'); if (lk.length > 1) { const i = lk.findIndex(x => x.id === engageId); engageId = lk[(i + 1) % lk.length].id; aimL = null; buildEngage(); } },
  tback() { setView('tac'); }, tauto() { $('auto').click(); engUpdate(true); }, thom() { $('homing').click(); },
  tammo(el) { ammo = el.dataset.arg; [...$('ammo').children].forEach(c => c.classList.toggle('on', c.dataset.k === ammo)); engUpdate(true); },
  tfire(el) { const k = $('k-fire'); if (k.classList.contains('gd') && !k.classList.contains('armed')) { k.classList.add('armed'); clearTimeout(k._gt); k._gt = setTimeout(() => k.classList.remove('armed'), 4000); return; } k.classList.remove('armed'); clearTimeout(k._gt); $('fire').click(); }, tcoil() { $('cwb').click(); engUpdate(true); },
});
cBuild();
$('k-fire').insertAdjacentHTML('beforeend', '<div class="cguard"><b>LIFT GUARD</b><small>THEN PRESS TO FIRE</small></div>');
