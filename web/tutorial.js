/* P2: the tutorial hunt on the Tern (?tutorial=tern&return=<page>). Scripted director on top of the real engine:
 * fixed seed, one target (Corvane, running quiet in a Shade-class hull), few decoys, Ostrow's step-by-step orders with the
 * matching control highlighted. Fixed outcome: after a few volleys land (or if our hull drops), Corvane signals surrender
 * by low-power laser and the page returns to the walk demo at the airlock mini-mission. Speaker names are the Tern's crew;
 * the Tern has no AI, so Pell's controls are hidden. See docs/scenes/p2_tutorial_hunt.md. */
(function () {
  let q; try { q = new URLSearchParams(location.search); } catch (e) { return; }
  if (q.get('tutorial') !== 'tern') return;
  const RET = q.get('return') || 'index.html';
  const NAMES = { Dace: 'Riggs', Castellan: 'Okafor', Quill: 'Sato', Abara: 'Dunne', Pell: 'Plot' };
  E.ANALYSTS.forEach(w => { if (NAMES[w.name]) w.name = NAMES[w.name]; });
  P.N = 4; P.nlure = 1;
  const oNew = E.newHunt, oTick = E.tick; let C = null, done = false;
  E.newHunt = (seed, opts) => {
    const s = oNew(4242, Object.assign({}, opts, { nreal: 1, friendly: false }));
    s.analysts.forEach(w => { if (NAMES[w.name]) w.name = NAMES[w.name]; });
    C = s.an.find(a => a.kind === 'real'); C.load = Object.assign({}, E.LOADOUTS.find(l => l.id === 'shade'), { dmg: 0.35 }); C.hpMax = C.hp = 110; C.corvane = true;
    step = 0; shown = -1; return s;
  };
  E.tick = (s, dt) => { oTick(s, dt); remap(s); director(s); };
  function remap(s) { for (let i = s._rm || 0; i < s.log.length; i++) { const l = s.log[i]; if (NAMES[l.who]) l.who = NAMES[l.who]; l.text = l.text.replace(/\bPell\b/g, 'the plot').replace(/\bAbara\b/g, 'Dunne'); } s._rm = s.log.length; }
  ['pell', 'pellact', 'integ', 'integtxt'].forEach(id => { const el = document.getElementById(id); if (el) (el.closest('label') || el).style.display = 'none'; });

  // ---------- Ostrow's orders ----------
  const cid = () => (C ? C.id + 1 : '?');
  const STEPS = [
    { say: () => "Clockwork and patience: that's the Tern. Corvane is somewhere in this field, running quiet. Every dot on the scope is a maybe. We find out which maybe is her.", btn: 'Understood' },
    { say: () => 'Put someone on a contact. Pick a dot on the scope and give it an analyst: Riggs reads heat, Okafor reads reactors, Sato watches for a silhouette against the bright stuff.', hi: 'analysts', done: s => s.analysts.some(w => w.task != null) },
    { say: () => "Readings build under the contact while they work. Junk reads cold and dead; a ship doesn't. Let them work. Rule out anything that's plainly junk.", done: s => E.classify(s, C).n >= 2 || s.an.some(a => a.state === 'out') },
    { say: () => `Contact ${cid()}. Warm, quiet, keeping to the dark. That's her. Lock it.`, done: s => C.state === 'locked' },
    { say: () => "Dunne's working a firing solution. When the Fire button lights, put a volley on her. We're not here to kill her. We're here to make her stop.", hi: 'fire', done: s => s.shots >= 1 },
    { say: () => "Watch your heat. Everything we do warms the sinks. Past three quarters, open the fins and vent. She'll see us while they're out, so don't leave them out long.", hi: 'sinkc', done: s => s.vent.total > 0 || s.t > (s._shotT || (s._shotT = s.t)) + 3 },
    { say: () => "Again. She'll shoot back now. Watch the hull, keep moving if you have to, and keep the pressure on.", hi: 'fire', done: s => C.hp <= C.hpMax * 0.6 || s.hull < 45 || s.shots >= 6 }
  ];
  let step = 0, shown = -1;
  const box = document.createElement('div'); box.id = 'tutbox';
  box.style.cssText = 'position:fixed;left:50%;top:10px;transform:translateX(-50%);z-index:80;max-width:min(640px,92vw);background:rgba(8,16,13,.95);border:1px solid #9fb7c8;color:#cfe3d8;font:13px/1.45 IBM Plex Mono,monospace;padding:10px 14px;box-shadow:0 6px 24px rgba(0,0,0,.5)';
  document.body.appendChild(box);
  const css = document.createElement('style'); css.textContent = '.tut-hi{outline:2px solid #ffb454!important;outline-offset:3px;animation:tutp 1.2s ease-in-out infinite}@keyframes tutp{50%{outline-color:rgba(255,180,84,.25)}}'; document.head.appendChild(css);
  function render() {
    document.querySelectorAll('.tut-hi').forEach(e => e.classList.remove('tut-hi'));
    const st = STEPS[step]; if (!st) return;
    if (st.hi) { const el = document.getElementById(st.hi); if (el) el.classList.add('tut-hi'); }
    box.innerHTML = '<div style="font:700 11px Chakra Petch,sans-serif;letter-spacing:.16em;color:#9fb7c8;margin-bottom:4px">CAPTAIN OSTROW &middot; ' + (step + 1) + ' / ' + STEPS.length + '</div><div>' + st.say() + '</div>' +
      '<div style="margin-top:8px;display:flex;gap:8px;justify-content:flex-end">' + (st.btn ? '<button id="tutnext" type="button">' + st.btn + '</button>' : '') + '<button id="tutskip" type="button" style="opacity:.6">Skip step</button></div>';
    const n = document.getElementById('tutnext'); if (n) n.onclick = () => { step++; render(); };
    document.getElementById('tutskip').onclick = () => { step++; render(); };
    shown = step;
  }
  function director(s) {
    if (done || !C) return;
    if (s.over || C.hp <= C.hpMax * 0.6 || s.hull < 45) { surrender(s); return; }
    const st = STEPS[step]; if (st && st.done && st.done(s)) { step++; }
    if (step !== shown) render();
  }
  function surrender(s) {
    done = true; try { paused = true; } catch (e) {} document.querySelectorAll('.tut-hi').forEach(e => e.classList.remove('tut-hi'));
    box.style.top = '50%'; box.style.transform = 'translate(-50%,-50%)';
    box.innerHTML = '<div style="font:700 11px Chakra Petch,sans-serif;letter-spacing:.16em;color:#5fd0e0;margin-bottom:6px">SATO &middot; SENSORS</div><div>Laser on us, Captain. Low power, pulsed. It\'s not a weapon. It\'s a message.</div>' +
      '<div style="font:700 11px Chakra Petch,sans-serif;letter-spacing:.16em;color:#b69cf0;margin:12px 0 6px">CORVANE &middot; BY LASER</div><div style="font-style:italic">Hold your fire, Ostrow. I\'ll take visitors. Send me the new one.</div>' +
      '<div style="font:700 11px Chakra Petch,sans-serif;letter-spacing:.16em;color:#9fb7c8;margin:12px 0 6px">CAPTAIN OSTROW</div><div>...She asked for you. Get to the airlock.</div>' +
      '<div style="margin-top:12px;display:flex;justify-content:flex-end"><button id="tutdone" type="button">Report to the airlock</button></div>';
    document.getElementById('tutdone').onclick = () => { location.href = RET + '#after_hunt'; };
  }
  function hidePell() {   // the Tern runs on clockwork: no AI controls
    document.querySelectorAll('div,span,b,i').forEach(el => { const tx = (el.textContent || '').trim(); if ((el.childElementCount === 0 && /^(PELL ASSIST|PELL ACTS|INTEGRATION|PELL)$/.test(tx)) || (el.id === 'integ' || el.id === 'integtxt')) { const c = el.parentElement; if (c) c.style.visibility = 'hidden'; } });
  }
  // skip the briefing screen and start straight away
  setTimeout(() => { try { brief.seed = 4242; brief.nreal = 1; brief.ally = false; brief.entry = 'standard'; brief.speed = 'v2'; brief.route = []; document.getElementById('brief').hidden = true; briefing = false; begin(); render(); hidePell(); setTimeout(hidePell, 400); } catch (e) { console.error(e); } }, 60);
})();
