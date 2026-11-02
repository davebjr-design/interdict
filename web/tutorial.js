/* P2: the tutorial hunt on the Tern (?tutorial=tern&return=<page>). Scripted director on top of the real engine:
 * fixed seed, one target (Corvane, running quiet in a Shade-class hull), few decoys, Ostrow's step-by-step orders with the
 * matching console control highlighted. Fixed outcome: after two volleys land on her (or her hull or ours drops far enough), Corvane
 * signals surrender by low-power laser and the page returns to the walk demo at the airlock mini-mission. Speaker names are the Tern's
 * crew; the Tern has no AI, so Pell's controls are hidden. The template's TUT flag (set before this file runs) already keeps trims,
 * saved integration, decision moments and localStorage writes out of the tutorial. See docs/scenes/p2_tutorial_hunt.md.
 *
 * Tutorial-only guarantees (none of this reaches a normal hunt; the engine reads s.tut, which only this file sets):
 *  - s.tut.keep: a locked solution never goes stale or bleeds and is never cut by a maneuver; it pauses only while no analyst is on her.
 *  - s.tut.solveT: lock to ready in about SOLVE_T game minutes (about 35 real seconds at 1x; EVASIVE about 10% faster).
 *  - Corvane drifts slowly, never maneuvers, and holds her fire until our first volley has landed. She can't be dismissed.
 *  - Once she's locked, an analyst stays on her: if the player pulls them all off, the director puts Riggs back.
 *  - Every step completes on the player's action; if the player waits too long, or presses Skip step, Ostrow does it. Nothing can fail. */
(function () {
  if (!TUT) return;
  const RET = QS.get('return') || 'index.html';
  const NAMES = { Dace: 'Riggs', Castellan: 'Okafor', Quill: 'Sato', Abara: 'Dunne', Pell: 'the plot' };
  const SOLVE_T = 2.2;   // game minutes from lock to ready with an analyst on her (P.secPerMin = 16: about 35 real seconds at 1x)
  Object.assign(CREW_NAMES, NAMES);   // console labels (FOLLOW DUNNE, the aim marker, the manual) read crewName()
  E.ANALYSTS.forEach(w => { if (NAMES[w.name]) w.name = NAMES[w.name]; });
  const oNew = E.newHunt, oTick = E.tick, oDismiss = E.dismissContact, oFire = E.fire;
  let C = null, G = null, done = false, S0 = null;
  let step = 0, shown = -1, hiKey = '', t0 = 0, r0 = 0, note = '', nudge = false, forced = false, acked = false, vols = [], eyesOff = null, loose = false, finalT = null, collapsed = false;
  const st0 = () => { step = 0; shown = -1; hiKey = ''; note = ''; nudge = false; forced = false; acked = false; vols = []; eyesOff = null; loose = false; finalT = null; collapsed = false; done = false; };
  E.newHunt = (seed, opts) => {
    const s = oNew(4242, Object.assign({}, opts, { nreal: 1, friendly: false, N: 4, nlure: 1, integration: 0 }));   // the field is set per hunt, never on the shared rules
    s.analysts.forEach(w => { if (NAMES[w.name]) w.name = NAMES[w.name]; });
    C = s.an.find(a => a.kind === 'real'); C.load = Object.assign({}, E.LOADOUTS.find(l => l.id === 'shade'), { dmg: 0.35 }); C.hpMax = C.hp = 110; C.hpFloor = 0.4 * C.hpMax; C.corvane = true;   // she surrenders at 60%; the floor keeps a lucky volley from crippling her first
    { const h = Math.atan2(C.vy, C.vx), v = 1.2; C.v = v; C.vx = Math.cos(h) * v; C.vy = Math.sin(h) * v; }   // she drifts, keeping to the dark; she doesn't run
    const d = a => { const p = E.truePos(a, 0); return Math.hypot(p.x - s.player.x, p.y - s.player.y); };
    G = s.an.filter(a => a.kind === 'ghost').sort((a, b) => d(a) - d(b))[0];   // the decoy Ostrow names: the nearest piece of junk
    s.tut = { keep: true, solveT: SOLVE_T };
    S0 = s; st0(); return s;
  };
  E.tick = (s, dt) => { if (C && !done) pre(s); oTick(s, dt); remap(s); director(s); };
  E.retreat = () => {};   // Ostrow doesn't run: no breach drive on the Tern tonight (the key is hidden too)
  E.goQuiet = () => {};   // and no running quiet (Q key and the hidden GO QUIET key)
  E.dismissContact = (s, id) => { if (C && id === C.id && s.tut) { say('Not her. That one reads warm.'); return; } return oDismiss(s, id); };
  E.fire = function (s, id) { const ok = oFire.apply(null, arguments); if (ok && C && id === C.id && s.tut) vols.push(s.volleys[s.volleys.length - 1]); return ok; };
  function remap(s) { for (let i = s._rm || 0; i < s.log.length; i++) { const l = s.log[i]; if (NAMES[l.who]) l.who = NAMES[l.who]; l.text = l.text.replace(/\bPell\b/g, 'the plot').replace(/\bAbara\b/g, 'Dunne'); } s._rm = s.log.length; }
  function pre(s) {   // before each engine tick: she holds course and holds fire until our first volley has landed
    C.nextMan = s.t + 99;
    if (!loose) { if (vols.some(v => s.t >= v.at)) { loose = true; C.nextFire = s.t + 0.8; } else C.nextFire = s.t + 99; }
  }

  // ---------- Ostrow's orders ----------
  // hi: console selectors to outline (every visible match is outlined). tests/hunt_pages.py checks each resolves to a visible control.
  // done: the state that completes the step (cumulative, so doing things early counts). wait: real seconds at 1x before Ostrow re-prompts
  // (at 60%) and then does it himself (auto). Skip step runs auto at once. hold: game time is held while the step shows (up to 45 s).
  const cid = () => (C ? C.id + 1 : '?'), gid = () => (G ? G.id + 1 : '?');
  const eyes = s => s.analysts.some(w => w.task === C.id);
  const sec = s => (step === shown ? (s.t - t0) * P.secPerMin : 0);
  const ready = s => C.state === 'locked' && (C.solve || 0) >= 1;
  const tacOnly = list => (view === 'tac' ? list : ['#kv-tac']);
  const fireHi = () => (view === 'tgt' ? ['#k-fire'] : ['#kv-tgt', '#k-tgt']);
  const landed = s => vols.length >= 2 && s.t >= vols[1].at + 0.05;
  const STEPS = [
    { id: 'board', title: 'Read the board', hold: true, btn: 'Understood', wait: 45,
      say: () => 'Four contacts on the board, left. Every one is a maybe. Three analysts above them: Riggs reads heat (H), Okafor reactors (R), Sato watches for an eclipse (V). Corvane is one of the four.',
      hi: () => ['#an0', '#an1', '#an2', '#ct .cslip'], done: s => acked || s.analysts.some(w => w.task != null) || C.state !== 'open' },
    { id: 'investigate', title: 'Investigate', wait: 35, auto: s => E.investigate(s, G.id), autoSay: () => `I'll start you off. Riggs, Okafor, Sato: contact ${gid()}.`,
      say: () => `Put them to work. Select contact ${gid()}, then press INVESTIGATE. All three read it at once.`,
      hi: () => ['#sl' + G.id, '#k-inv'], done: s => s.analysts.some(w => w.task != null) || C.state !== 'open' },
    { id: 'dismiss', title: 'Dismiss the decoy', wait: 45, auto: s => { if (G.state === 'open') oDismiss(s, G.id); }, autoSay: () => `Contact ${gid()} is junk. Dunne, rule it out.`,
      say: () => `Readings fill in under the slip. Contact ${gid()} reads cold and dead: junk. Select it and press DISMISS.`,
      hi: () => (G.state === 'open' ? ['#sl' + G.id, '#k-dis'] : ['#k-dis']), done: s => s.an.some(a => a !== C && a.state === 'out') },
    { id: 'lock', title: 'Lock on', wait: 40, auto: s => { if (C.state === 'open') E.lockContact(s, C.id); }, autoSay: () => `That's her. Dunne, lock contact ${cid()}.`,
      say: () => `Contact ${cid()}. Warm, quiet, keeping to the dark. That's her. Select her slip and press LOCK ON.`,
      hi: () => ['#sl' + C.id, '#k-lock'], done: s => C.state === 'locked' },
    { id: 'track', title: 'Hold the track', wait: 20, btn: 'Understood', auto: s => { if (!eyes(s)) E.assign(s, 'dace', C.id); }, autoSay: () => 'Riggs, stay on her.',
      say: s => (eyes(s) ? 'Dunne solves from a live track. Your analysts are on her: keep at least one there. No eyes, no solution. Watch the bar below.' : 'Dunne solves from a live track. Keep eyes on her: press INVESTIGATE with her slip selected, or click one H / R / V cell on it. No eyes, no solution.'),
      hi: s => (eyes(s) ? ['#sl' + C.id, '#tsl'] : ['#k-inv', '#sl' + C.id + ' [data-act=chan]', '#tsl [data-act=chan]']), done: s => eyes(s) && (acked || sec(s) > 8) },
    { id: 'course', title: 'Set a course', wait: 35, auto: s => { const p = s.player; E.setRoute(s, [{ x: p.x + 12, y: p.y + (p.y < P.arena / 2 ? 24 : -24), speed: 'v2' }]); E.setSpeed(s, 'v2'); }, autoSay: () => 'Helm, give us a short leg.',
      say: () => (view === 'tac' ? "While Dunne works, the helm. Right-click open space on the scope and pick Go here. That's a course leg." : view === 'str' ? "While Dunne works, the helm. Right-click open space on the map and pick Go here. That's a course leg." : 'While Dunne works, the helm. Back to TACTICAL first: the TACTICAL key at the top, or press 1.'),
      hi: () => (view === 'tac' ? ['#cv'] : view === 'str' ? ['#map'] : ['#kv-tac']), done: s => s.route.length > 0 || ['route', 'close', 'separate', 'orbit', 'evade'].includes(s.posture) },
    { id: 'evade', title: 'Try EVASIVE', wait: 30, auto: s => E.setOrder(s, 'evade', null), autoSay: () => 'Helm, evasive.',
      say: () => 'Press EVASIVE. We weave, the analysts get new angles: reads and Dunne\'s solve run about ten percent faster. The price: we\'re about twenty percent louder.',
      hi: () => tacOnly(['#k-evade']), done: s => (s._tutEv = s._tutEv || s.posture === 'evade') },
    { id: 'still', title: 'HOLD STILL', wait: 25, auto: s => E.setOrder(s, 'still', null), autoSay: () => 'Helm, hold still.',
      say: () => 'Now HOLD STILL. Drive off: the quietest we can be, and the sinks fill slowest. Faster or quieter: that trade is every hunt.',
      hi: () => tacOnly(['#k-hold']), done: s => s._tutEv && s.posture === 'still' },
    { id: 'fire', title: 'Fire', wait: 40, canAuto: ready, auto: s => oFireAt(s), autoSay: () => 'Dunne, fire.',
      say: s => (!ready(s) ? 'Dunne needs the solution first: watch the bar. When it reads ready, open the Target view: TARGET at the top, or press 3.' : view === 'tgt' ? "FIRE SALVO has a guard. Click once to lift it, then again to fire. We're here to make her stop, not to kill her." : 'Solution ready. Open the Target view: TARGET at the top, or press 3.'),
      hi: s => (ready(s) ? fireHi() : ['#kv-tgt']), done: s => vols.length >= 1 },
    { id: 'vent', title: 'Vent', wait: 30, auto: s => E.startVent(s), autoSay: () => 'Fins out. Dumping heat.', enter: s => { s.sink.h = Math.max(s.sink.h, 0.3); },   // the launch warmed the sinks: there is heat to dump
      say: () => "Launch heat's in the sinks. Press VENT to open the fins and dump it. Fins out, we're lit up, so don't leave them out long. VENT again pulls them in.",
      hi: () => ['#k-vent'], done: s => s.vent.n > 0 },
    { id: 'again', title: 'Fire again', wait: 40, canAuto: s => ready(s) && vols.length < 2 && s.tubes.some(x => s.t >= x), auto: s => oFireAt(s), autoSay: () => 'Dunne, again.',
      say: () => (view === 'tgt' ? "Lift the guard and fire. She'll shoot back now. Keep the pressure on." : "Again: TARGET, lift the guard, fire. She'll shoot back now. Keep the pressure on."),
      hi: fireHi, done: s => vols.length >= 2 }
  ];
  function oFireAt(s) { if (ready(s)) E.fire(s, C.id, null, 6); }
  const box = document.createElement('div'); box.id = 'tutbox';
  box.style.cssText = 'position:fixed;left:50%;top:10px;transform:translateX(-50%);z-index:80;width:min(640px,92vw);box-sizing:border-box;overflow:hidden auto;background:rgba(8,16,13,.96);border:1px solid #9fb7c8;color:#cfe3d8;font:12px/1.4 IBM Plex Mono,monospace;padding:5px 9px;box-shadow:0 6px 24px rgba(0,0,0,.5)';
  document.body.appendChild(box);
  const css = document.createElement('style'); css.textContent = '.tut-hi{outline:3px solid #ffb454!important;outline-offset:2px;animation:tutp 1.2s ease-in-out infinite;z-index:5}@keyframes tutp{50%{outline-color:rgba(255,180,84,.25)}}' +
    '#tutbox button{font:inherit;font-size:.92em;padding:1px 8px;background:#13251e;color:#cfe3d8;border:1px solid #4d6b5e;cursor:pointer}#tutbox button:hover{border-color:#ffb454}#tutbox .th{display:flex;align-items:center;gap:6px;font:700 .86em Chakra Petch,sans-serif;letter-spacing:.12em;color:#9fb7c8}#tutbox .th span{flex:1}' +
    '#tutbox .tn{color:#ffb454;margin-top:2px}#tutbox .ts{display:flex;align-items:center;gap:8px;margin-top:3px}#tutbox .tb{flex:1;height:6px;background:#1b2b25;position:relative}#tutbox .tb i{position:absolute;left:0;top:0;bottom:0;background:#ffb454}#tutbox .tl{font-size:.86em;color:#9fb7c8;white-space:nowrap}#tutbox.nudge{border-color:#ffb454;animation:tutb 1.2s ease-in-out infinite}@keyframes tutb{50%{border-color:#4d6b5e}}';
  document.head.appendChild(css);
  function place() {   // docked over the SHIP zone's bottom row, which the Tern hides (breach, spool, Pell): it covers no live control in any view
    if (done) return; const sg = $('stage'), h = $('g-hull'), z = $('z-heat'); if (!sg || !h || !z) return;
    const rs = sg.getBoundingClientRect(), rh = h.getBoundingClientRect(), rz = z.getBoundingClientRect(); if (!rz.width || !rh.height) return; const k = rs.width / 1366;
    Object.assign(box.style, { left: rz.left + 'px', top: (rh.bottom + 2 * k) + 'px', width: rz.width + 'px', height: Math.max(40, rs.bottom - rh.bottom - 2 * k) + 'px', transform: 'none', fontSize: (11.5 * k) + 'px', maxWidth: 'none' });
  }
  addEventListener('resize', () => { place(); });
  const visible = el => { if (el.closest('[hidden]') || el.closest('#legacy')) return false; const r = el.getBoundingClientRect(), cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
  const hiOf = st => {   // if none of a step's controls is on screen (another view is open), point at the TACTICAL key instead
    const l = st && st.hi && C ? st.hi(S0) : []; if (!l.length || l.some(q => [...document.querySelectorAll(q)].some(visible))) return l; return view === 'tac' ? l : ['#kv-tac'];
  };
  function highlight() {   // re-applied every tick: the slips and the Target view are rebuilt as play goes on
    const sels = done || collapsed ? [] : hiOf(STEPS[step]);
    const els = sels.flatMap(q => [...document.querySelectorAll(q)]).filter(visible), key = sels.join('|') + ':' + els.length;
    if (key === hiKey && els.every(e => e.classList.contains('tut-hi'))) return;
    hiKey = key; document.querySelectorAll('.tut-hi').forEach(e => e.classList.remove('tut-hi')); els.forEach(e => e.classList.add('tut-hi'));
  }
  function say(t) { note = t; shown = -2; }   // a one-off line from Ostrow under the current order (re-renders)
  function solveLine(s) {
    if (!C || C.state !== 'locked') return '';
    const si = E.solveInfo(s, C), p = Math.round(Math.min(1, si.prog) * 100);
    const t = si.ready ? 'DUNNE: SOLUTION READY' : 'DUNNE: SOLVING ' + p + '%' + (si.paused ? ' (PAUSED: ' + (si.noEyes ? 'NO ANALYST ON HER' : 'SENSORS DARK') + ')' : ', ABOUT ' + Math.max(1, Math.round(si.remain * P.secPerMin)) + ' S');
    return '<div class="ts"><span class="tl" id="tutsolt">' + t + '</span><div class="tb"><i id="tutsolb" style="width:' + p + '%;background:' + (si.ready ? '#8fd694' : si.paused ? '#ff6a4a' : '#ffb454') + '"></i></div></div>';
  }
  function solveUpd(s) {   // refresh the solution bar in place; re-render when it should appear or go
    const b = document.getElementById('tutsolb'), on = C.state === 'locked'; if (!!b !== on) { render(); return; } if (!b) return;
    const tmp = document.createElement('div'); tmp.innerHTML = solveLine(s); const nb = tmp.querySelector('#tutsolb');
    b.style.width = nb.style.width; b.style.background = nb.style.background; document.getElementById('tutsolt').textContent = tmp.querySelector('#tutsolt').textContent;
  }
  window.__tut = { get step() { return step; }, get id() { return STEPS[step] ? STEPS[step].id : 'end'; }, steps: STEPS.length, ids: STEPS.map(x => x.id), hiTargets: () => (done || collapsed ? [] : hiOf(STEPS[step])), visible,
    get corvane() { return C ? C.id : null; }, get decoy() { return G ? G.id : null; }, get done() { return done; }, get vols() { return vols.length; }, autos: [], skips: [] };
  function render() {
    const s = S0, st = STEPS[step]; place();
    if (!st) { collapsed = true; box.classList.remove('nudge'); box.innerHTML = '<div class="th"><span>CAPTAIN OSTROW &middot; ALL ORDERS GIVEN</span></div><div>Volleys away. Watch them land.</div>' + solveLine(s); highlight(); shown = step; return; }
    box.classList.toggle('nudge', nudge);
    box.innerHTML = '<div class="th"><span>OSTROW &middot; STEP ' + (step + 1) + ' OF ' + STEPS.length + ' &middot; ' + st.title.toUpperCase() + (st.hold && window.__tutHold ? ' &middot; CLOCK HELD' : '') + '</span>' +
      (st.btn ? '<button id="tutnext" type="button">' + st.btn + '</button>' : '') + '<button id="tutskip" type="button" title="Ostrow does this step for you">Skip step</button></div>' +
      '<div>' + st.say(s) + '</div>' + (note ? '<div class="tn">' + note + '</div>' : nudge ? '<div class="tn">Your call. Or press Skip step and I\'ll do it.</div>' : '') + solveLine(s);
    const n = document.getElementById('tutnext'); if (n) n.onclick = () => { acked = true; director(s); };
    document.getElementById('tutskip').onclick = () => { forced = true; __tut.skips.push(st.id); director(s); };
    shown = step; hiKey = ''; highlight();
  }
  function enter(s) { t0 = s.t; r0 = performance.now(); nudge = false; forced = false; acked = false; const st = STEPS[step]; if (st && st.enter) st.enter(s); window.__tutHold = !!(st && st.hold); }
  function director(s) {
    if (done || !C || s !== S0) return;
    if (s.over || C.hp <= C.hpMax * 0.6 || s.hull < 45 || landed(s) || (finalT != null && s.t - finalT > 4)) { surrender(s); return; }   // the tutorial cannot be failed
    // standing guarantees
    if (C.state === 'locked' && step > 4) { if (eyes(s)) eyesOff = null; else if (eyesOff == null) eyesOff = performance.now(); else if (performance.now() - eyesOff > 4000) { E.assign(s, 'dace', C.id); eyesOff = null; say('Riggs. Back on her. No eyes, no solution.'); } }
    if (s.vent.on && !s.vent.forced && s.t - s.vent.t0 > 1.2 && step >= 9) { E.stopVent(s); if (step === 9 || step === 10) say('Fins in. That\'s long enough out.'); }
    if (step === STEPS.length - 1 && finalT == null) finalT = s.t;   // safety: four game minutes after the last order she gives up anyway
    let st = STEPS[step], moved = false;
    for (let guard = 0; st && guard < STEPS.length; guard++) {
      if (st.done(s)) { step++; st = STEPS[step]; moved = true; note = ''; enter(s); continue; }
      const el = st.hold ? (performance.now() - r0) / 1000 : (st.canAuto && !st.canAuto(s) ? 0 : sec(s));
      if (st.hold && window.__tutHold && el > st.wait) { window.__tutHold = false; shown = -2; }   // never hold the clock for long
      if (!nudge && el > st.wait * 0.6 && !st.hold) { nudge = true; shown = -2; }
      if (forced || (!st.hold && el > st.wait && (!st.canAuto || st.canAuto(s)))) {
        if (st.hold || (st.btn && !st.auto)) { step++; st = STEPS[step]; moved = true; note = ''; enter(s); continue; }
        if (!st.canAuto || st.canAuto(s)) { const was = forced; st.auto(s); __tut.autos.push(st.id + (was ? ':skip' : ':idle')); step++; const line = st.autoSay ? st.autoSay(s) : ''; st = STEPS[step]; moved = true; enter(s); note = line; continue; }
        if (forced && !note) say('Dunne fires the moment the solution is ready.');
      }
      break;
    }
    if (moved || step !== shown) render(); else { highlight(); solveUpd(s); }
  }
  function surrender(s) {
    done = true; window.__tutHold = false; try { paused = true; } catch (e) {} document.querySelectorAll('.tut-hi').forEach(e => e.classList.remove('tut-hi'));
    const line = vols.length ? "Hold your fire, Ostrow. I'll take visitors. Send me the new one." : 'Enough, Ostrow. Nobody needs to die tonight. Send me the new one.';   // she stops it before we have fired a shot only if our hull went first
    box.classList.remove('nudge'); Object.assign(box.style, { left: '50%', top: '50%', width: 'min(640px,92vw)', height: 'auto', transform: 'translate(-50%,-50%)', fontSize: '13px', padding: '12px 16px' });
    box.innerHTML = '<div style="font:700 11px Chakra Petch,sans-serif;letter-spacing:.16em;color:#5fd0e0;margin-bottom:6px">SATO &middot; SENSORS</div><div>Laser on us, Captain. Low power, pulsed. It\'s not a weapon. It\'s a message.</div>' +
      '<div style="font:700 11px Chakra Petch,sans-serif;letter-spacing:.16em;color:#b69cf0;margin:12px 0 6px">CORVANE &middot; BY LASER</div><div style="font-style:italic">' + line + '</div>' +
      '<div style="font:700 11px Chakra Petch,sans-serif;letter-spacing:.16em;color:#9fb7c8;margin:12px 0 6px">CAPTAIN OSTROW</div><div>...She asked for you. Get to the airlock.</div>' +
      '<div style="margin-top:12px;display:flex;justify-content:flex-end"><button id="tutdone" type="button">Report to the airlock</button></div>';
    document.getElementById('tutdone').onclick = () => { location.href = RET + '#after_hunt'; };
  }
  function hideEscapes() {   // no breach drive and no running quiet in the tutorial: the keys are hidden (the engine calls are stubbed above)
    ['brk', 'quiet', 'k-breach', 'k-quiet', 'r-eta', 'g-spool', 'ln-jump', 'ln-dog', 'r-qcd'].forEach(id => { const el = document.getElementById(id); if (el) el.style.visibility = 'hidden'; });
  }
  // the clock stays held on step 1 until the player is ready (or 45 s pass); keep the box text fresh when it releases
  setInterval(() => { if (!done && S0 && STEPS[step] && STEPS[step].hold) director(S0); }, 500);
  // skip the briefing screen and start straight away
  setTimeout(() => { try { brief.seed = 4242; brief.nreal = 1; brief.ally = false; brief.entry = 'standard'; brief.speed = 'v2'; brief.route = []; document.getElementById('brief').hidden = true; briefing = false; begin(); hideEscapes(); enter(S); render(); } catch (e) { console.error(e); } }, 60);
})();
