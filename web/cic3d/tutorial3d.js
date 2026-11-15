/* Simplified P2 tutorial hunt for the 3D CIC (?tutorial=1[&return=page]). A guided step box (Ostrow) on top of the real engine and the normal 3D controls: select, read, pick out the
 * quiet hull, lock, wait for the solution, lift the guard, fire. Fixed seed 4242, one real contact, a few decoys, the engine's own tutorial guarantees (s.tut: the solution is kept, never goes stale).
 * The full scripted director (web/tutorial.js) drives the 2D console and is not ported: this file only watches state and highlights the order-bar key for the current step.
 * The clock is held while a box is being read (press Understood). Skip step is a tester convenience. Nothing can fail: the hull and sink are topped up each frame. */
'use strict';
(function () {
  const Q = new URLSearchParams(location.search); if (!Q.get('tutorial') || !window.CIC) return;
  const C0 = CIC, E = C0.E, RET = Q.get('return') || '', box = UI.els.tut;
  const st = document.createElement('style'); st.textContent = '#obar button.tuthi{outline:2px solid #3ddbd0;box-shadow:0 0 14px #3ddbd0;animation:tp 1s infinite alternate}@keyframes tp{from{box-shadow:0 0 4px #3ddbd0}to{box-shadow:0 0 18px #3ddbd0}}#tut .prog{float:right;color:#6a9a8d;font:11px monospace}#tut button+button{margin-left:6px;color:#6a9a8d;border-color:#264a44}'; document.head.appendChild(st);
  C0.begin(4242, { nreal: 1, friendly: false, N: 4, nlure: 1, integration: 0 });
  const S = () => C0.S, real = () => S().an.find(a => a.kind === 'real'), tag = a => 'S' + (a.id + 1), sel = () => (window.LS && LS.ctx.sel != null) ? LS.ctx.sel : null;
  let picked = false, base = null, s = S(), C = real(), i = 0, gate = true, vols = [], hi = '', fin = false;
  s.tut = { keep: true, solveT: 2.2, sure: C.id, bands: [[.58, .68], [.38, .42]], foeSure: 1, foeDmg: [8, 12] }; s.hold = true;
  C.load = Object.assign({}, (E.LOADOUTS || []).find(l => l.id === 'shade') || C.load, { dmg: .35 }); C.hpMax = C.hp = 110; C.hpFloor = .38 * C.hpMax; C.ai.fireRange = 999; C.ai.missileSpeed = 60;
  ['sensors', 'fire', 'weapons'].forEach(w => { try { CIC.A.model.setAutonomy(w, 'hands-on'); } catch (e) { } });
  const oFire = E.fire; E.fire = function (ss, id) { const ok = oFire.apply(null, arguments); if (ok && C && id === C.id) vols.push(ss.volleys[ss.volleys.length - 1]); return ok; };
  const STEPS = [
    { t: 'Captain, this is the drill: one hull out there, running quiet, and a few pieces of junk to confuse you. You are driving the sensors and the fire box yourself tonight, so every order you give happens at once. The clock is stopped while you read these.', b: 'Understood', go: 1 },
    { t: () => 'Pick a contact. Click a blip on the hologram table, click a row on the CONTACTS screen, or press Tab. Right-click a blip for the order menu.', ok: () => picked || sel() !== base },
    { t: () => 'Read it: press C (or CLASSIFY) and let the clock run (the 4x key on the HUD, or the time keys). Sato will report what the heat, reactor and star-dimming channels say. Junk and decoys read cold, thin or wrong.', hi: 'act:classify', ok: () => { const a = S().an[sel()]; return a && a.read && Object.keys(a.read).length > 0 || CIC.A.done.some(d => d.verb === 'classify' && d.by === 'co'); }, tm: 4 },
    { t: () => 'Contact ' + tag(C) + ' is the hull: it dims the star behind it solidly and keeps its reactor in the dark. Select it (Tab cycles, or click it).', ok: () => sel() === C.id },
    { t: () => 'Lock ' + tag(C) + ' (L or the LOCK key). An analyst goes on it and starts building the firing solution.', hi: 'act:lock', ok: () => C.state === 'locked' },
    { t: () => 'Wait for the solution. Open the TMA screen (F2 then W) and watch the ETA and hit chance. Hold still (H) helps the track. Speed the clock up if you like.', hi: 'post:still', ok: () => { const si = E.solveInfo(S(), C); return si && si.ready; }, tm: 4 },
    { t: () => 'Solution ready. Go to the fire control bench (F3) and lift the guard on the FIRE box, or press F. The guard stops accidents: it closes again after a few seconds.', hi: 'fire', ok: () => CIC.guard() || S().shots >= 1 },
    { t: () => 'Now press FIRE (the red button under the guard, or the FIRE key on the bar).', hi: 'fire', ok: () => S().shots >= 1 },
    { t: () => 'Salvo away. Let it run. Point defence (D) is armed and the screens show the weapons running.', ok: () => vols.length > 0 && (S().t >= Math.max.apply(null, vols.map(v => v.at)) || C.hp < C.hpMax), tm: 4 },
    { t: 'Hit confirmed. She is signalling surrender by low-power laser. That is the drill, Captain: select, read, lock, solve, guard, fire. In a real hunt you can leave the stations on Auto and watch the call deck, or take any of them hands-on again.', b: RET ? 'Return' : 'Finish', end: 1 }
  ];
  function render() {
    const p = STEPS[i], t = typeof p.t === 'function' ? p.t() : p.t; box.style.display = 'block';
    box.innerHTML = '<h5>OSTROW <span class="prog">' + (i + 1) + '/' + STEPS.length + '</span></h5><div class="t">' + UI.esc(t) + '</div>' + (p.b ? '<button id="tutok">' + p.b + '</button>' : '<button id="tutskip">Skip step</button>');
    const ok = document.getElementById('tutok'), sk = document.getElementById('tutskip');
    if (ok) ok.onclick = () => { if (p.end) { if (RET) location.href = RET; else { box.style.display = 'none'; fin = true; } return; } gate = false; S().hold = false; base = sel(); adv(); };
    if (sk) sk.onclick = () => skip();
    hi = p.hi || '';
  }
  function adv() { i = Math.min(STEPS.length - 1, i + 1); if (STEPS[i].tm) CIC.setTime(STEPS[i].tm); render(); }
  function skip() { const p = STEPS[i]; if (!p.ok) return; if (i === 1) CIC.select(C.id); if (i === 2) CIC.act('act:classify'); if (i === 3) CIC.select(C.id); if (i === 4) { CIC.select(C.id); CIC.act('act:lock'); } if (i === 6 || i === 7) { CIC.act('fire'); if (CIC.guard()) CIC.act('fire'); } adv(); }
  addEventListener('pointerdown', () => { if (i === 1 && !gate) setTimeout(() => { picked = true; }, 50); }); addEventListener('keydown', e => { if (i === 1 && e.key === 'Tab') setTimeout(() => { picked = true; }, 50); });
  render();
  CIC.on('frame', () => {
    if (fin) return; const ss = S(); if (ss !== s) return;
    ss.hull = Math.max(ss.hull, 60); C.nextMan = ss.t + 99; if (!vols.length) C.nextFire = ss.t + 99;
    if (i === 0) { ss.hold = true; }
    const p = STEPS[i]; if (p.ok && p.ok() && i < STEPS.length - 1) { adv(); }
    const bs = UI.els.obar.querySelectorAll('button'); for (let k = 0; k < bs.length; k++) { const on = hi && bs[k].dataset.id === hi; if (on !== bs[k].classList.contains('tuthi')) bs[k].classList.toggle('tuthi', !!on); }
  });
  window.TUT3D = { step: () => i, skip };
})();
