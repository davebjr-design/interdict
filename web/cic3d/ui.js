/* DOM overlays for the 3D CIC: HUD, master warning / caution, crew autonomy panel, call card, order bar, tooltip, radial menu, toasts, vignette.
 * No game logic here: interact.js feeds it state and handles clicks through UI.onAct(id) / UI.onAuto(stationKey, mode). */
'use strict';
(function () {
  const css = `
  html,body{margin:0;background:#0c1618;overflow:hidden;font:14px 'Arial Narrow',Arial,sans-serif;color:#dfe9e6;user-select:none;-webkit-user-select:none}canvas{display:block}
  .b{position:fixed;background:rgba(6,16,16,.84);border:1px solid #3a5a60;box-sizing:border-box}
  #hud{pointer-events:none;right:12px;top:12px;padding:7px 12px;text-align:right;min-width:260px}#hud b{color:#f0ab3a;letter-spacing:.1em;font-size:15px}#hud div{color:#9ab;margin-top:2px}.br{color:#ff5a3a;font-weight:bold}.ok{color:#3fd38a}.am{color:#f0ab3a}.rd{color:#ff5a3a}
  #master{left:50%;top:12px;transform:translateX(-50%);display:flex;gap:8px;border:0;background:none}
  .mbtn{font:bold 14px monospace;letter-spacing:.08em;padding:8px 14px;border:2px solid #333;background:#140c0a;color:#5a3a34;cursor:pointer;min-width:150px}
  .mbtn.w.on{background:#b01a10;color:#fff;border-color:#ff5a3a}.mbtn.c.on{background:#a8700c;color:#1a0e00;border-color:#f0ab3a}.mbtn.fl{animation:fl .5s steps(2) infinite}@keyframes fl{50%{filter:brightness(.35)}}
  #auto{left:12px;top:12px;width:236px;padding:6px 8px 8px}#auto h4{margin:0 0 4px;font:bold 12px monospace;letter-spacing:.14em;color:#f0ab3a;display:flex;justify-content:space-between;cursor:pointer}
  .ar{display:flex;align-items:center;gap:4px;margin-top:3px}.ar span{flex:0 0 70px;font:bold 11px monospace;color:#c4dcd2;line-height:1.1}.ar span i{display:block;font:10px monospace;color:#6a9a8d;font-style:normal}
  .am3{display:flex;flex:1;gap:2px}.am3 button{flex:1;font:bold 10px monospace;padding:4px 0;border:1px solid #1d4a42;background:#0c1f1b;color:#6a9a8d;cursor:pointer}.am3 button.on.auto{background:#3fd38a;color:#04100d}.am3 button.on.supervised{background:#f0ab3a;color:#04100d}.am3 button.on.hands-on{background:#f5cf3a;color:#04100d;box-shadow:0 0 8px #f5cf3a}.am3 button:hover{border-color:#fff}
  #auto.min .ar{display:none}
  #call{display:none;left:12px;bottom:112px;width:272px;padding:8px 10px;border-color:#7a5a1d}#call b{color:#f0ab3a;letter-spacing:.06em}#call small{color:#6a9a8d;margin-left:8px}#call .l{font-size:18px;margin:4px 0;line-height:1.25}
  #call .o{display:flex;flex-direction:column;gap:5px;margin-top:6px}#call .o button{text-align:left;font:bold 14px monospace;padding:8px 8px;background:#0c1f1b;color:#f0ab3a;border:1px solid #7a5a1d;cursor:pointer}#call .o button.def{border-color:#3fd38a;color:#3fd38a}#call .o button:hover{background:#1a3a33}
  #call .bar{height:4px;background:#222;margin-top:6px}#call .bar i{display:block;height:100%;background:#f0ab3a}
  #obar{left:50%;transform:translateX(-50%);bottom:8px;padding:6px 8px;display:flex;flex-direction:column;gap:5px;max-width:1240px}#obar .sum{font:bold 15px monospace;color:#c4dcd2;white-space:nowrap}#obar .sum em{font-style:normal;margin-left:10px;font-weight:normal;color:#6a9a8d}
  #obar .row{display:flex;gap:5px;flex-wrap:nowrap}#obar .grp{display:flex;gap:4px}#obar .sep{width:10px}
  .ob{font:bold 13px monospace;padding:6px 9px;background:#0c1f1b;color:#f0ab3a;border:1px solid #7a5a1d;cursor:pointer;white-space:nowrap;position:relative}.ob kbd{font:10px monospace;color:#6a9a8d;margin-left:5px}.ob:hover:not(.off){background:#1a3a33;border-color:#fff}.ob.off{opacity:.38;cursor:not-allowed}.ob.on{background:#f0ab3a;color:#04100d}.ob.on kbd{color:#04100d}
  .ob.armed{background:#c01c10;color:#fff;border-color:#fff;animation:fl .4s steps(2) infinite}.ob.c1{color:#3ddbd0;border-color:#1d6a64}.ob.c2{color:#f5cf3a;border-color:#7a6a1d}.ob.c3{color:#ff6a58;border-color:#7a2a20}.ob.c4{color:#4fe08a;border-color:#1d6a3a}
  #tip{display:none;pointer-events:none;z-index:20;max-width:340px;padding:7px 10px;border-color:#f0ab3a}#tip b{color:#f0ab3a;font:bold 13px monospace;letter-spacing:.06em}#tip div{margin-top:3px;font-size:13px;color:#cfe0da}#tip .s{color:#7fe0e8}#tip .w{color:#ff9a8a}#tip .k{color:#6a9a8d;font:11px monospace}
  #radial{position:fixed;display:none;z-index:25;width:0;height:0}#radial button{position:absolute;transform:translate(-50%,-50%);width:92px;font:bold 12px monospace;padding:8px 2px;background:#08201c;color:#f0ab3a;border:2px solid #7a5a1d;border-radius:20px;cursor:pointer}#radial button:hover:not(.off){background:#1a3a33;border-color:#fff}#radial button.off{opacity:.35}#radial .core{position:absolute;transform:translate(-50%,-50%);width:54px;height:54px;border-radius:50%;border:2px solid #3a5a60;background:rgba(6,16,16,.9);color:#c4dcd2;font:bold 14px monospace;display:flex;align-items:center;justify-content:center}
  #toasts{right:12px;bottom:112px;display:flex;flex-direction:column;gap:3px;align-items:flex-end;pointer-events:none;border:0;background:none}#toasts div{background:rgba(6,16,16,.88);border-left:3px solid #3ddbd0;padding:4px 9px;font:13px monospace;color:#cfe0da;max-width:420px}#toasts .w{border-color:#f0ab3a}#toasts .e{border-color:#ff4a3d;color:#ffb0a4}#toasts .g{border-color:#3fd38a}
  #keys{left:12px;bottom:10px;font:11px monospace;color:#8aa;padding:4px 8px;max-width:420px;line-height:1.5;display:none}#keysb{left:12px;bottom:8px;font:11px monospace;color:#8aa;padding:3px 8px;cursor:pointer}
  #vig{position:fixed;inset:0;pointer-events:none;background:radial-gradient(ellipse at center,rgba(0,0,0,0) 55%,rgba(0,0,0,.55) 100%)}#flash{position:fixed;inset:0;pointer-events:none;background:radial-gradient(ellipse at center,rgba(255,40,20,0) 35%,rgba(255,40,20,.85) 100%);opacity:0}
  #tut{right:12px;top:78px;width:330px;padding:9px 12px;border-color:#3ddbd0;display:none}#tut h5{margin:0 0 4px;font:bold 12px monospace;letter-spacing:.14em;color:#3ddbd0}#tut .t{font-size:15px;line-height:1.35}#tut .n{margin-top:6px;color:#6a9a8d;font:11px monospace}#tut button{margin-top:6px;font:bold 12px monospace;padding:5px 10px;background:#0c1f1b;color:#3ddbd0;border:1px solid #1d6a64;cursor:pointer}
  #sub{pointer-events:none;left:50%;transform:translateX(-50%);top:62px;max-width:640px;font-size:16px;color:#cfe0da;background:rgba(6,16,16,.7);padding:4px 12px;border:0;display:none;text-align:center}
  `;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  const el = (id, cls) => { const d = document.createElement('div'); d.id = id; d.className = cls || ''; document.body.appendChild(d); return d; };
  const hud = el('hud', 'b'), master = el('master', 'b'), auto = el('auto', 'b'), call = el('call', 'b'), obar = el('obar', 'b'), tip = el('tip', 'b'), radial = el('radial'), toasts = el('toasts', 'b'), keys = el('keys', 'b'), keysb = el('keysb', 'b'), tut = el('tut', 'b'), sub = el('sub', 'b');
  el('vig'); const flash = el('flash');
  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const UI = { onAct() { }, onAuto() { }, els: { hud, master, auto, call, obar, tip, radial, toasts, tut, sub }, esc };
  master.innerHTML = '<button class="mbtn w" data-m="w">MASTER WARNING</button><button class="mbtn c" data-m="c">MASTER CAUTION</button>'; master.onclick = e => { if (e.target.dataset.m) UI.onAct('ack'); };
  // ---- keys help
  keysb.textContent = '? KEYS'; keys.innerHTML = 'F1 room · F2/F3/F4 sensors/attack/systems · Q W E screens · Esc out<br>Tab next contact · C classify · L lock · P ping (x2) · O probe · X rule out (x2) · R refresh · M mark hostile<br>G lift guard \u00b7 F fire · D point defence · V vent · H hold still · Z evasive · [ ] speed · Q quiet (screens off)<br>1-3 answer call · Bksp stand by · Space ack alarms · B brace · T time · K mute · right-click contact: radial';
  keysb.onclick = () => { const o = keys.style.display === 'block'; keys.style.display = o ? 'none' : 'block'; keysb.style.display = o ? 'block' : 'none'; }; keys.onclick = keysb.onclick;
  // ---- autonomy panel
  const STN = [['sensors', 'SENSORS', 'Quill'], ['fire', 'FIRE CTL', 'Abara'], ['weapons', 'WEAPONS', 'Abara'], ['helm', 'HELM', 'Abara'], ['engineering', 'ENGINEER', 'Castellan'], ['thermal', 'THERMAL', 'Dace'], ['damage', 'DAMAGE', 'Fenwick'], ['comms', 'COMMS', 'Pell']];
  let autoKey = '';
  UI.auto = function (aut) { const k = STN.map(s => aut[s[0]]).join(); if (k === autoKey) return; autoKey = k; const mins = auto.classList.contains('min');
    auto.innerHTML = '<h4 id="autoh"><span>WHO IS DRIVING</span><span>' + (mins ? '+' : '−') + '</span></h4>' + STN.map(([key, nm, off]) => '<div class="ar"><span>' + nm + '<i>' + off + '</i></span><div class="am3">' + [['auto', 'AUTO'], ['supervised', 'SUPV'], ['hands-on', 'HANDS']].map(([m, l]) => '<button class="' + m + (aut[key] === m ? ' on' : '') + '" data-s="' + key + '" data-m="' + m + '" title="' + (m === 'auto' ? 'Crew run it and report by exception' : m === 'supervised' ? 'Crew propose, you approve' : 'You do it yourself: your orders are instant') + '">' + l + '</button>').join('') + '</div></div>').join('');
    auto.querySelector('#autoh').onclick = () => { auto.classList.toggle('min'); autoKey = ''; UI.auto(aut); }; };
  auto.onclick = e => { const b = e.target.closest('button'); if (b && b.dataset.s) { UI.onAuto(b.dataset.s, b.dataset.m); autoKey = ''; } };
  // ---- hud
  UI.hud = function (h) { hud.innerHTML = '<b>' + esc(h.title) + '</b>' + (h.brace && h.brace !== 'free' ? ' · <span class="br">' + h.brace.toUpperCase() + '</span>' : '') + '<div>T+' + h.t + ' · HULL <span class="' + (h.hull < 40 ? 'rd' : h.hull < 70 ? 'am' : 'ok') + '">' + h.hull + '%</span> · SINK <span class="' + (h.sink > 80 ? 'rd' : h.sink > 60 ? 'am' : 'ok') + '">' + h.sink + '%</span> · MAG ' + h.mag + ' · x' + h.ts + (h.over ? ' · <span class="br">HUNT OVER: ' + esc(h.over) + '</span>' : '') + '</div><div>' + esc(h.line2 || '') + '</div>'; };
  UI.master = function (w, c) { const bw = master.children[0], bc = master.children[1]; bw.classList.toggle('on', !!(w && w.lit)); bw.classList.toggle('fl', !!(w && w.flash)); bc.classList.toggle('on', !!(c && c.lit)); bc.classList.toggle('fl', !!(c && c.flash)); };
  // ---- call card
  let callKey = '';
  UI.call = function (c, o) { if (!c) { call.style.display = 'none'; callKey = ''; return; } const k = c.id + ':' + c.state + ':' + (o.def); call.style.display = 'block';
    if (k !== callKey) { callKey = k; call.innerHTML = '<b>' + esc(String(c.officer).toUpperCase()) + ' · ' + esc(String(c.station).toUpperCase()) + '</b><small>' + ['', 'ROUTINE', 'NOTABLE', 'URGENT', 'CRITICAL'][c.pri] + (c.route === 'player' ? ' · YOURS (HANDS-ON)' : '') + '</small><div class="l">' + esc(c.line) + '</div>' + (c.opts ? '<div class="o">' + c.opts.map((op, i) => '<button data-i="' + i + '" class="' + (i === o.def ? 'def' : '') + '" title="' + esc(c.cost && c.cost !== 'none' && i === o.def ? 'cost: ' + c.cost : '') + '">' + (i + 1) + '  ' + esc(op.label) + (i === o.def ? '  ✓' : '') + '</button>').join('') + '</div>' : '') + '<div class="bar"><i></i></div>'; }
    const bar = call.querySelector('.bar i'); if (bar) bar.style.width = (o.frac == null ? 0 : Math.round(o.frac * 100)) + '%'; };
  call.onclick = e => { const b = e.target.closest('button'); if (b) UI.onAct('callopt:' + b.dataset.i); };
  // ---- order bar
  let obKey = '';
  UI.obar = function (o) { const k = JSON.stringify(o); if (k === obKey) return; obKey = k; const B = b => '<button class="ob ' + (b.cls || '') + (b.off ? ' off' : '') + (b.on ? ' on' : '') + (b.armed ? ' armed' : '') + '" data-id="' + b.id + '" data-tip="' + esc(b.tip || '') + '">' + esc(b.armed ? (b.confirm || 'CONFIRM') : b.label) + (b.key ? '<kbd>' + b.key + '</kbd>' : '') + '</button>';
    obar.innerHTML = '<div class="sum">' + o.sum + '</div><div class="row"><div class="grp">' + o.contact.map(B).join('') + '</div><div class="sep"></div><div class="grp">' + o.global.map(B).join('') + '</div></div>'; };
  obar.onclick = e => { const b = e.target.closest('button'); if (b && !b.classList.contains('off')) UI.onAct(b.dataset.id); else if (b) UI.onAct(b.dataset.id); };
  obar.onmousemove = e => { const b = e.target.closest('button'); if (b && b.dataset.tip) UI.tip(true, e.clientX, e.clientY, { t: b.textContent.replace(/\[.\]|CONFIRM/g, '').trim(), d: b.dataset.tip }); else UI.tip(false); };
  obar.onmouseleave = () => UI.tip(false);
  // ---- tooltip
  UI.tip = function (show, x, y, o) { if (!show || !o) { tip.style.display = 'none'; return; } tip.innerHTML = '<b>' + esc(o.t) + '</b>' + (o.d ? '<div>' + esc(o.d) + '</div>' : '') + (o.s ? '<div class="s">' + esc(o.s) + '</div>' : '') + (o.w ? '<div class="w">' + esc(o.w) + '</div>' : '') + (o.k ? '<div class="k">' + esc(o.k) + '</div>' : ''); tip.style.display = 'block';
    const r = tip.getBoundingClientRect(); let px = x + 16, py = y + 18; if (px + r.width > innerWidth - 6) px = x - r.width - 12; if (py + r.height > innerHeight - 6) py = y - r.height - 12; tip.style.left = Math.max(4, px) + 'px'; tip.style.top = Math.max(4, py) + 'px'; };
  // ---- radial
  UI.radial = function (open, x, y, items) { if (!open) { radial.style.display = 'none'; return; } radial.style.display = 'block'; radial.style.left = x + 'px'; radial.style.top = y + 'px'; const n = items.length, R = 92;
    radial.innerHTML = '<div class="core">' + esc(items.title || '') + '</div>' + items.map((it, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / n; return '<button class="' + (it.off ? 'off' : '') + '" data-id="' + it.id + '" style="left:' + Math.round(Math.cos(a) * R) + 'px;top:' + Math.round(Math.sin(a) * R) + 'px">' + esc(it.label) + '</button>'; }).join(''); };
  radial.onclick = e => { const b = e.target.closest('button'); if (b) { UI.onAct(b.dataset.id); } UI.radial(false); e.stopPropagation(); };
  // ---- toasts, subtitles, flash, tutorial
  UI.toast = function (txt, kind) { const d = document.createElement('div'); d.textContent = txt; if (kind) d.className = kind; toasts.appendChild(d); while (toasts.children.length > 5) toasts.removeChild(toasts.firstChild); setTimeout(() => { if (d.parentNode) d.parentNode.removeChild(d); }, 4200); };
  let subT = 0; UI.sub = function (who, txt, ms) { sub.innerHTML = '<b style="color:#f0ab3a">' + esc(who) + '</b>  ' + esc(txt); sub.style.display = 'block'; clearTimeout(subT); subT = setTimeout(() => { sub.style.display = 'none'; }, ms || 3500); };
  UI.flash = a => { flash.style.opacity = Math.min(1, a) + ''; };
  window.UI = UI;
})();
