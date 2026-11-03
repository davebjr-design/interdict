/* P2: the tutorial hunt on the Tern (?tutorial=tern&return=<page>). Scripted director on top of the real engine:
 * fixed seed, one target (Corvane, running quiet in a Shade-class hull), few decoys, Ostrow's step-by-step orders with the
 * matching console control highlighted. Fixed outcome: after two volleys land on her (or her hull or ours drops far enough), Corvane
 * signals surrender by low-power laser and the page returns to the walk demo at the airlock mini-mission. Speaker names are the Tern's
 * crew; the Tern has no AI, so Pell's controls are hidden. The template's TUT flag (set before this file runs) already keeps trims,
 * saved integration, decision moments and localStorage writes out of the tutorial. See docs/scenes/p2_tutorial_hunt.md.
 *
 * Cadence (2026-11-02, Dave's playtest): PAUSE WHILE READING. The hunt starts paused (step 1 is starting the clock). Every order from
 * Ostrow, and every commentary beat with something to read, freezes the engine (s.hold + __tutHold, and E.tick itself does nothing)
 * until the player presses Understood; that resumes exactly the clock state from before (paused stays paused, the speed is kept).
 * The step then completes when the player does it. There is no idle timer anywhere: nothing is done for the player unless they press
 * Skip step (a tester convenience: Ostrow does the step, or waits for what it needs, such as readings or a ready solution).
 *
 * Order (2026-11-03, Dave): Ostrow walks the board in contact order, 1, 2, 3, 4, all the way through: nothing is fired on until every
 * contact has been read. Each contact gets its own read, then is ruled out on its own readings or, for the real one, identified and locked.
 * Contacts after Corvane are read while Dunne works the solution, with one analyst left on her.
 *
 * Identification: Corvane's contact is a contact like any other until the engine's own readings say otherwise (E.advice calls it a ship, or
 * E.classify is 90% sure it is real on two or more channels). Only then does Ostrow call it a ship and name Corvane, and only then is
 * LOCK ON highlighted. Decoys are ruled out on their own readings: Ostrow's line is built from what the H, R and V channels show.
 *
 * Tutorial-only guarantees (none of this reaches a normal hunt; the engine reads s.tut, which only this file sets):
 *  - s.tut.keep: a locked solution never goes stale or bleeds and is never cut by a maneuver; it pauses only while no analyst is on her.
 *  - s.tut.solveT: lock to ready in about SOLVE_T game minutes (about 35 real seconds at 1x; EVASIVE about 10% faster).
 *  - s.tut.sure / bands: every volley of ours on her lands (the Target view says 100%), the first leaves her at 58-68% hull, the second at
 *    38-42%, then she surrenders. She is never destroyed. s.tut.foeSure / foeDmg: her one answer lands, for 8-12 hull points.
 *  - Corvane drifts slowly, never maneuvers, and holds her fire until our first volley has landed; then she fires once. She can't be dismissed.
 *  - Once she's locked, an analyst stays on her: if the player pulls them all off for a quarter of a game minute, Riggs goes back.
 *  - No breach, no running quiet. Nothing can fail. */
(function () {
  if (!TUT) return;
  const RET = QS.get('return') || 'index.html';
  const NAMES = { Dace: 'Riggs', Castellan: 'Okafor', Quill: 'Sato', Abara: 'Dunne', Pell: 'the plot' };
  const BANDS = [[0.58, 0.68], [0.38, 0.42]];   // hull fraction our first and second hit leave her at (tutorial only, s.tut.bands)
  const WIDE = 16;   // the cone Dunne sets for the shot (km); the console's default is 8
  const SOLVE_T = 2.2;   // game minutes from lock to ready with an analyst on her (P.secPerMin = 16: about 35 real seconds at 1x)
  Object.assign(CREW_NAMES, NAMES);   // console labels (FOLLOW DUNNE, the aim marker, the manual) read crewName()
  E.ANALYSTS.forEach(w => { if (NAMES[w.name]) w.name = NAMES[w.name]; });
  const oNew = E.newHunt, oTick = E.tick, oDismiss = E.dismissContact, oFire = E.fire;
  let C = null, G = null, L = null, done = false, S0 = null, ORD = [];
  let step = 0, hiKey = '', note = '', forced = false, autoDone = false, acked = false, ackTxt = '', vols = [], eyesOffT = null, loose = false, collapsed = false, beats = [], seen = {}, reading = false, rkey = '', fireTold = false;
  const st0 = () => { step = 0; hiKey = ''; note = ''; forced = false; autoDone = false; acked = false; ackTxt = ''; vols = []; eyesOffT = null; loose = false; collapsed = false; beats = []; seen = {}; reading = false; rkey = ''; fireTold = false; done = false; if (window.__tut) __tut.readOrder.length = 0; };
  E.newHunt = (seed, opts) => {
    const s = oNew(4242, Object.assign({}, opts, { nreal: 1, friendly: false, N: 4, nlure: 1, integration: 0 }));   // the field is set per hunt, never on the shared rules
    s.analysts.forEach(w => { if (NAMES[w.name]) w.name = NAMES[w.name]; });
    C = s.an.find(a => a.kind === 'real'); C.load = Object.assign({}, E.LOADOUTS.find(l => l.id === 'shade'), { dmg: 0.35 }); C.hpMax = C.hp = 110; C.hpFloor = BANDS[1][0] * C.hpMax; C.corvane = true;   // the bands set what each hit leaves her; the floor is a backstop
    C.ai.fireRange = 999; C.ai.missileSpeed = 60;   // her one answer always reaches us, in about 30 s of clock
    { const h = Math.atan2(C.vy, C.vx), v = 1.2; C.v = v; C.vx = Math.cos(h) * v; C.vy = Math.sin(h) * v; }   // she drifts, keeping to the dark; she doesn't run
    const d = a => { const p = E.truePos(a, 0); return Math.hypot(p.x - s.player.x, p.y - s.player.y); };
    G = s.an.filter(a => a.kind === 'ghost').sort((a, b) => d(a) - d(b))[0];   // first: the nearest piece of junk
    L = s.an.find(a => a.kind === 'lure');                                     // second: the decoy that runs warm but hides no hull
    ORD = s.an.slice().sort((a, b) => a.id - b.id);   // Ostrow reads the board in contact order
    s.tut = { keep: true, solveT: SOLVE_T, sure: C.id, bands: BANDS, foeSure: 1, foeDmg: [8, 12] };
    S0 = s; st0(); buildSteps(); return s;
  };
  // the engine does nothing while a box is being read or the clock is paused, even when called directly
  E.tick = (s, dt) => { if (C && !done && s === S0) { director(s); if (done || reading || paused) return; } if (C && !done) pre(s); oTick(s, dt); remap(s); director(s); };
  E.retreat = () => {};   // Ostrow doesn't run: no breach drive on the Tern tonight (the key is hidden too)
  E.goQuiet = () => {};   // and no running quiet (Q key and the hidden GO QUIET key)
  E.dismissContact = (s, id) => {
    if (C && id === C.id && s.tut) { beat('guard' + (s.evN + s.log.length), idf(s) ? "Not her. That one is a ship." : C.read.thermal || C.read.reactor ? 'Belay that. Contact ' + cid() + "'s readings aren't junk. Let them finish." : "Belay that. We haven't read contact " + cid() + ' yet.', ['#sl' + C.id], true); director(s); return; }
    return oDismiss(s, id);
  };
  E.fire = function (s, id) { const ok = oFire.apply(null, arguments); if (ok && C && id === C.id && s.tut) vols.push(s.volleys[s.volleys.length - 1]); return ok; };
  { const oSet = setTime; setTime = v => { oSet(v); if (!done && C && STEPS[step] && STEPS[step].id === 'clock' && paused) { togglePause(); director(S0); } }; }   // on step 1, choosing a speed also starts the clock
  function remap(s) { for (let i = s._rm || 0; i < s.log.length; i++) { const l = s.log[i]; if (NAMES[l.who]) l.who = NAMES[l.who]; l.text = l.text.replace(/\bPell\b/g, 'the plot').replace(/\bAbara\b/g, 'Dunne'); } s._rm = s.log.length; }
  function pre(s) {   // before each engine tick: she holds course and holds fire until our first volley has landed
    C.nextMan = s.t + 99;
    if (!loose) { if (vols.some(v => s.t >= v.at)) { loose = true; C.nextFire = s.t + 0.3; } else C.nextFire = s.t + 99; }
    else if (s.inc.some(v => v.id === C.id) || s.tut.foeSure <= 0) C.nextFire = s.t + 99;   // one answer, then she holds
  }

  // ---------- what the readings say (the engine's own evidence) ----------
  const val = (a, ch) => { const q = a.read[ch]; return !q ? null : q.blind ? 'blind' : q.den > 0 ? Math.max(0, q.num / q.den) : null; };
  const settled = a => a.state !== 'open' || E.advice(S0, a).call !== 'unsure' || (() => { const c = E.classify(S0, a); return c.n >= 2 && c.p >= 0.85; })();
  const idf = s => { if (!C) return false; if (C._idf || C.idStatus === 'hostile') return (C._idf = true); const ad = E.advice(s, C).call, c = E.classify(s, C); return (C._idf = ad === 'ship' || (c.best === 'real' && c.p >= 0.9 && c.n >= 2)); };   // once identified, she stays identified
  function interp(a) {   // Ostrow reads the three channels aloud
    const h = val(a, 'thermal'), r = val(a, 'reactor'), o = val(a, 'occlusion');
    const hs = h == null || h === 'blind' ? 'no heat read yet' : h >= 0.65 ? 'warm' : h >= 0.3 ? 'faint heat' : 'cold';
    const rs = r == null || r === 'blind' ? 'no reactor read yet' : r >= 0.65 ? 'a live reactor' : r >= 0.3 ? 'a faint reactor flutter' : 'no reactor';
    const os = o == null ? 'no eclipse read yet' : o === 'blind' ? 'nothing behind it to eclipse' : o >= 0.6 ? 'it blocks the stars' : 'Sato sees stars right through it';
    return 'Contact ' + (a.id + 1) + ': ' + hs + ', ' + rs + ', and ' + os + '.';
  }
  function concl(a) { const c = E.classify(S0, a), h = val(a, 'thermal');
    return c.best === 'ghost' ? (typeof h === 'number' && h >= 0.65 ? 'Sun-warmed, but nothing alive in it: junk.' : 'Cold and drifting: junk.') : c.best === 'lure' ? 'Heat with no hull behind it: a decoy, a hot can left to drift.' : 'Not junk. Leave it.'; }

  const cid = () => (C ? C.id + 1 : '?'), num = a => a.id + 1;
  const eyes = s => s.analysts.some(w => w.task === C.id);
  const on = (s, a) => s.analysts.some(w => w.task === a.id);
  const allOn = (s, a) => s.analysts.every(w => w.task === a.id);
  const ready = s => C.state === 'locked' && (C.solve || 0) >= 1;
  const tacOnly = list => (view === 'tac' ? list : ['#kv-tac']);
  const fireHi = () => (view === 'tgt' ? ['#k-fire'] : ['#kv-tgt', '#k-tgt']);
  const landed = s => vols.length >= 2 && s.t >= vols[1].at + 0.05;
  const answered = s => s.tut.foeSure <= 0 && !s.inc.some(v => v.id === C.id);   // her one answer has landed
  const invHi = (s, a) => (on(s, a) ? ['#sl' + a.id] : ['#sl' + a.id, '#k-inv']);
  const AN = { thermal: 'dace', reactor: 'castellan', occlusion: 'quill' }, AN_NAME = { thermal: 'Riggs', reactor: 'Okafor', occlusion: 'Sato' }, CH_KEY = { thermal: 'H', reactor: 'R', occlusion: 'V' };
  const keepCh = a => a._keep || (a._keep = a.read.occlusion && a.read.occlusion.blind ? 'occlusion' : 'reactor');   // fixed when first asked, so the order never changes under the player   // who stays on her while we read a contact after the lock: Sato if there's nothing to eclipse there, else Okafor
  const INTRO = "One contact at a time, in order, all the way through. We don't fire on anything until we know what everything out there is. ";
  // ---------- Ostrow's orders, built per hunt: the board in contact order ----------
  // hi: console selectors to outline (every visible match is outlined). tests/hunt_pages.py checks each resolves to a visible control.
  // done: the state that completes the step (cumulative, so doing things early counts). auto: what Skip step does (Ostrow does it; if the
  // step needs readings or a solution, it then completes when they arrive). Every order is read with the clock frozen (Understood).
  // kind / x: what the step does and to which contact (tests read these).
  const readStep = (X, first) => ({ id: 'read' + num(X), kind: 'read', x: X.id, title: 'Read contact ' + num(X), auto: s => { if (X.state === 'open' && !allOn(s, X)) E.investigate(s, X.id); },
    say: () => (first ? INTRO + 'Contact ' + num(X) + ': select its slip and press INVESTIGATE. All three analysts read it. Let the H, R and V bars settle; 2x if it\'s slow.' : 'Contact ' + num(X) + ' next. Select it, press INVESTIGATE, and let the bars settle.'),
    hi: s => (X.state === 'open' ? invHi(s, X) : ['#sl' + X.id]), done: () => X._tutOn && settled(X) });
  const ruleStep = X => ({ id: 'rule' + num(X), kind: 'rule', x: X.id, title: 'Rule out contact ' + num(X), auto: s => { if (X.state === 'open') oDismiss(s, X.id); }, autoSay: () => 'Contact ' + num(X) + ' is nothing. Dunne, rule it out.',
    say: () => (X.state !== 'open' ? 'Ruled out.' : !settled(X) ? 'Contact ' + num(X) + " hasn't settled. Let the bars fill." : interp(X) + ' ' + concl(X) + ' Select it and press DISMISS.'),
    key: () => X.state + settled(X), hi: () => (X.state === 'open' ? ['#sl' + X.id, '#k-dis'] : ['#k-dis']), done: () => X.state !== 'open' });
  const checkStep = (X, first) => ({ id: 'check' + num(X), kind: 'check', x: X.id, title: 'Check contact ' + num(X),
    auto: s => { if (X.state === 'open' && !on(s, X)) E.investigate(s, X.id); if (!eyes(s)) E.assign(s, AN[keepCh(X)], C.id); },
    say: s => { const k = keepCh(X);
      if (X.state === 'open' && !on(s, X)) return (first ? "Nobody's on to us, so we finish the board while Dunne solves. " : '') + 'Contact ' + num(X) + ': select it and press INVESTIGATE.';
      return eyes(s) ? 'Let contact ' + num(X) + "'s bars settle. Keep one analyst on her: the solve needs eyes." : 'That took all three off her, and the solve stops without eyes. Click her ' + CH_KEY[k] + ' cell: ' + AN_NAME[k] + ' goes back to her, the other two finish contact ' + num(X) + '.'; },
    key: s => (X.state === 'open' && !on(s, X) ? 'a' : 'b'),
    hi: s => (X.state === 'open' && !on(s, X) ? invHi(s, X) : !eyes(s) ? ['#sl' + C.id + ' [data-arg="' + C.id + ':' + keepCh(X) + '"]'] : ['#sl' + X.id]),
    done: s => X._tutOn && settled(X) && eyes(s) });
  function buildSteps() {
    STEPS.length = 0; const k = ORD.indexOf(C);
    STEPS.push(
      { id: 'clock', title: 'Start the clock', noAck: true, auto: () => { if (paused) togglePause(); },
        say: () => "We're stopped. PAUSE holds the clock, and orders still go in while it's held. The speed keys set the pace: 1x is real time, 2x for the quiet stretches. Press RESUME (or P) to start.",
        hi: () => ['#k-pause', '#k-t0', '#k-t1', '#k-t2', '#r-clk'], done: () => !paused },
      { id: 'board', title: 'Read the board',
        say: () => 'Four contacts on the board, left. Every slip reads ?: unknown. Above them, three analysts: Riggs reads heat (H), Okafor reactors (R), Sato watches for an eclipse (V). A solid hull blocks the stars behind it.',
        hi: () => ['#an0', '#an1', '#an2', '#ct .cslip'], done: () => acked });
    ORD.forEach((X, i) => {
      if (i < k) { STEPS.push(readStep(X, i === 0), ruleStep(X)); return; }
      if (X !== C) { STEPS.push(checkStep(X, i === k + 1), ruleStep(X)); return; }
      STEPS.push(
        { id: 'identify', kind: 'read', x: C.id, title: 'Read contact ' + num(C), auto: s => { if (C.state !== 'out' && !allOn(s, C)) E.investigate(s, C.id); },
          say: () => (i === 0 ? INTRO : '') + 'Now contact ' + cid() + '. Select it and press INVESTIGATE. The readings decide what it is, not a hunch.',
          hi: s => invHi(s, C), done: s => idf(s) },
        { id: 'lock', title: 'Lock on', auto: s => { if (C.state === 'open') E.lockContact(s, C.id); }, autoSay: () => 'Dunne, lock contact ' + cid() + '.',
          say: () => interp(C) + " Hot, live and solid: that's a ship. That'll be Corvane. Select her slip and press LOCK ON.",
          hi: () => ['#sl' + C.id, '#k-lock'], done: () => C.state === 'locked' },
        { id: 'track', title: 'Hold the track', auto: s => { if (!eyes(s)) E.assign(s, 'dace', C.id); }, autoSay: () => 'Riggs, stay on her.',
          say: s => (eyes(s) ? "Locked. Dunne solves from a live track: keep an analyst on her. The % on her slip is how sure we are of her: LOCK is fresh, TRACK ageing, LAST lost." : 'No eyes, no solution. Put an analyst back on her: INVESTIGATE with her slip selected, or click one H / R / V cell on it.'),
          key: s => eyes(s), hi: s => (eyes(s) ? ['#sl' + C.id + ' .cod', '#sl' + C.id] : ['#sl' + C.id, '#k-inv']), done: s => eyes(s) && acked });
    });
    STEPS.push(
      { id: 'course', title: 'Set a course', auto: s => { const p = s.player; E.setRoute(s, [{ x: p.x + 12, y: p.y + (p.y < P.arena / 2 ? 24 : -24), speed: 'v2' }]); E.setSpeed(s, 'v2'); }, autoSay: () => 'Helm, give us a short leg.',
        say: () => (view === 'tac' ? 'Now the helm. Right-click open space on the scope and pick Go here. That\'s a course leg.' : view === 'str' ? 'Now the helm. Right-click open space on the map and pick Go here. That\'s a course leg.' : 'Now the helm. Back to TACTICAL first: the TACTICAL key at the top, or press 1.'),
        key: () => view, hi: () => (view === 'tac' ? ['#cv'] : view === 'str' ? ['#map'] : ['#kv-tac']), done: s => s.route.length > 0 || ['route', 'close', 'separate', 'orbit', 'evade'].includes(s.posture) },
      { id: 'evade', title: 'Try EVASIVE', auto: s => E.setOrder(s, 'evade', null), autoSay: () => 'Helm, evasive.',
        say: s => 'Press EVASIVE. We weave and the analysts get new angles: reads' + (ready(s) ? '' : " and Dunne's solve") + ' run about ten percent faster. The price: we\'re louder and hotter.',
        hi: () => tacOnly(['#k-evade']), done: s => (s._tutEv = s._tutEv || s.posture === 'evade') },
      { id: 'still', title: 'HOLD STILL', auto: s => E.setOrder(s, 'still', null), autoSay: () => 'Helm, hold still.',
        say: () => 'Now HOLD STILL. Drive off: the quietest we can be, and the sink fills slowest. Faster or quieter: that trade is every hunt.',
        hi: () => tacOnly(['#k-hold']), done: s => s._tutEv && s.posture === 'still' },
      { id: 'fire', title: 'Fire', canAuto: ready, auto: s => oFireAt(s), autoSay: () => 'Dunne, fire.', enter: () => wide(),
        say: s => (!ready(s) ? 'Dunne needs the solution first: watch the bar below. When it reads ready, we fire.' : view === 'tgt' ? 'FIRE SALVO has a guard. Click once to lift it, then again to fire. HIT CHANCE reads 100%: the cone is wide enough that one of the six finds her.' : 'Solution ready. Open the Target view: TARGET at the top, or press 3.'),
        key: s => ready(s) + (view === 'tgt' ? 't' : ''), hi: s => (ready(s) ? fireHi() : ['#kv-tgt']), done: () => vols.length >= 1 },
      { id: 'vent', title: 'Vent', auto: s => E.startVent(s), autoSay: () => 'Fins out. Dumping heat.', enter: s => { s.sink.h = Math.max(s.sink.h, 0.3); },   // the launch warmed the sinks: there is heat to dump
        say: () => "That launch dumped heat in the sink: see the tank jump. Press VENT to open the fins and dump it. Fins out, we're lit up, so not for long. VENT again pulls them in.",
        hi: () => ['#k-vent', '#g-tank'], done: s => s.vent.n > 0 },
      { id: 'again', title: 'Fire again', canAuto: s => ready(s) && vols.length < 2 && s.tubes.some(x => s.t >= x), auto: s => oFireAt(s), autoSay: () => 'Dunne, again.',
        say: () => (view === 'tgt' ? "Lift the guard and fire again. Once she knows where we are, she'll answer. Don't give her time." : "Again: TARGET, lift the guard, fire. Once she knows where we are, she'll answer. Don't give her time."),
        key: () => view === 'tgt', hi: fireHi, done: () => vols.length >= 2 });
  }
  const STEPS = [];
  function wide() { try { cone = WIDE; const el = document.getElementById('cone'); if (el) el.value = WIDE; if (view === 'tgt') engUpdate(true); } catch (e) {} }   // Dunne's wide cone (the Target view's cone, shared with the console)
  function oFireAt(s) { if (ready(s)) { wide(); E.fire(s, C.id, null, WIDE); } }
  const IX = id => STEPS.findIndex(x => x.id === id);
  const FIRST_READ = 2;   // the first per-contact step
  const who = n => '<b style="color:#9fb7c8;letter-spacing:.08em">' + n + '</b> ';
  // ---------- commentary beats: what just changed and what it costs. Each freezes the clock until Understood and pulses its gauge. ----------
  function beat(id, text, hi, again) { if (seen[id] && !again) return; seen[id] = true; beats.push({ id, text, hi }); }
  function beatsCheck(s) {
    for (const a of ORD) if (!a._tutOn && on(s, a)) { a._tutOn = true; __tut.readOrder.push(a.id); }
    if (step >= FIRST_READ && s.analysts.some(w => w.task != null)) {
      beat('sensors', "Sensor work isn't free. SENSE just lit beside DRIVE and PING: those lamps show what's heating us. It all goes in the sink, the tall gauge. At the red line, we vent.", ['#ls-sense', '#ls-drive', '#ls-ping', '#g-tank']);
      beat('seen', 'And heat is noise. SEEN BY ENEMY is how loud we look to anyone out there. Cold is hard to find; hot is easy.', ['#g-seen']);
    }
    if (step >= FIRST_READ && step < IX('identify')) { const a = ORD.find(x => x !== C && x.state === 'open' && on(s, x) && typeof val(x, 'thermal') === 'number' && x.read.thermal.den >= 0.5);
      if (a) beat('heat', 'Riggs has a heat reading on contact ' + (a.id + 1) + ': the H bar. Long is warm, short is cold. Ships run warm; junk runs cold.', ['#sl' + a.id, '#sl' + a.id + ' [data-act=chan]']); }
    if (s.posture === 'evade') beat('evasive', "Feel the weave? SEEN BY ENEMY climbs and the heat rate needle swings right. Faster, and louder.", ['#g-seen', '#d-rate']);
    if (STEPS[step] && STEPS[step].id === 'fire' && ready(s) && view === 'tgt' && !vols.length) { wide();
      beat('cone', who('OSTROW') + "Wide cone. I'd rather not kill her if she might surrender. " + who('DUNNE') + "If she gets a good lock on us, we're open to a counterattack. So we hit once, hard enough to get her attention, and don't give her time.", ['#d-cone', '#g-hit']); }
    if (C.tutHits >= 1) beat('hit1', who('DUNNE') + 'Hit. Her hull is at ' + Math.round(100 * C.hp / C.hpMax) + " percent, and she knows we're here. She'll answer.", ['#sl' + C.id]);
    if (s.hull < 100) beat('answer', who('RIGGS') + "We're hit. Hull " + Math.round(s.hull) + ' percent, plating only.<br>' + who('OSTROW') + "That was her answer. We're still in this.", ['#g-hull']);
  }

  const box = document.createElement('div'); box.id = 'tutbox';
  box.style.cssText = 'position:fixed;left:50%;top:10px;transform:translateX(-50%);z-index:80;width:min(640px,92vw);box-sizing:border-box;overflow:hidden auto;background:rgba(8,16,13,.96);border:1px solid #9fb7c8;color:#cfe3d8;font:12px/1.4 IBM Plex Mono,monospace;padding:5px 9px;box-shadow:0 6px 24px rgba(0,0,0,.5)';
  document.body.appendChild(box);
  const css = document.createElement('style'); css.textContent = '.tut-hi{outline:3px solid #ffb454!important;outline-offset:2px;animation:tutp 1.2s ease-in-out infinite;z-index:5}@keyframes tutp{50%{outline-color:rgba(255,180,84,.25)}}' +
    '.tut-hi.tut-beat{outline-color:#5fd0e0!important;animation:tutq .6s ease-in-out infinite}@keyframes tutq{50%{outline-color:rgba(95,208,224,.2)}}' +
    '#tutbox button{font:inherit;font-size:.92em;padding:1px 8px;background:#13251e;color:#cfe3d8;border:1px solid #4d6b5e;cursor:pointer}#tutbox button:hover{border-color:#ffb454}#tutbox #tutnext{border-color:#ffb454;color:#ffb454}#tutbox .th{display:flex;align-items:center;gap:6px;font:700 .86em Chakra Petch,sans-serif;letter-spacing:.12em;color:#9fb7c8}#tutbox .th span{flex:1}#tutbox .th b{color:#5fd0e0;font-weight:700}' +
    '#tutbox .tn{color:#ffb454;margin-top:2px}#tutbox .ts{display:flex;align-items:center;gap:8px;margin-top:3px}#tutbox .tb{flex:1;height:6px;background:#1b2b25;position:relative}#tutbox .tb i{position:absolute;left:0;top:0;bottom:0;background:#ffb454}#tutbox .tl{font-size:.86em;color:#9fb7c8;white-space:nowrap}#tutbox.rd{border-color:#ffb454}';
  document.head.appendChild(css);
  function place() {   // docked over the SHIP zone's bottom row, which the Tern hides (breach, spool, Pell): it covers no live control in any view
    if (done) return; const sg = $('stage'), h = $('g-hull'), z = $('z-heat'); if (!sg || !h || !z) return;
    const rs = sg.getBoundingClientRect(), rh = h.getBoundingClientRect(), rz = z.getBoundingClientRect(); if (!rz.width || !rh.height) return; const k = rs.width / 1366;
    Object.assign(box.style, { left: rz.left + 'px', top: (rh.bottom + 2 * k) + 'px', width: rz.width + 'px', height: Math.max(40, rs.bottom - rh.bottom - 2 * k) + 'px', transform: 'none', fontSize: (11.5 * k) + 'px', maxWidth: 'none' });
  }
  addEventListener('resize', () => { place(); });
  const visible = el => { if (el.closest('[hidden]') || el.closest('#legacy')) return false; const r = el.getBoundingClientRect(), cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
  const curHi = () => { if (done || collapsed || !C) return []; if (beats.length) return beats[0].hi; const st = STEPS[step]; return st && st.hi ? st.hi(S0) : []; };
  const hiOf = () => {   // if none of the controls is on screen (another view is open), point at the TACTICAL key instead
    const l = curHi(); if (!l.length || l.some(q => [...document.querySelectorAll(q)].some(visible))) return l; return view === 'tac' ? l : ['#kv-tac'];
  };
  function highlight() {   // re-applied every pass: the slips and the Target view are rebuilt as play goes on
    const sels = hiOf(), bt = !!beats.length;
    const els = sels.flatMap(q => [...document.querySelectorAll(q)]).filter(visible), key = sels.join('|') + ':' + els.length + bt;
    if (key === hiKey && els.every(e => e.classList.contains('tut-hi'))) return;
    hiKey = key; document.querySelectorAll('.tut-hi').forEach(e => e.classList.remove('tut-hi', 'tut-beat')); els.forEach(e => { e.classList.add('tut-hi'); if (bt) e.classList.add('tut-beat'); });
  }
  function solveLine(s) {
    if (!C || C.state !== 'locked') return '';
    const si = E.solveInfo(s, C), p = Math.round(Math.min(1, si.prog) * 100);
    const t = si.ready ? 'DUNNE: SOLUTION READY' : 'DUNNE: SOLVING ' + p + '%' + (si.paused ? ' (PAUSED: ' + (si.noEyes ? 'NO ANALYST ON ' + (idf(s) ? 'HER' : 'IT') : 'SENSORS DARK') + ')' : ', ABOUT ' + Math.max(1, Math.round(si.remain * P.secPerMin)) + ' S');
    return '<div class="ts"><span class="tl" id="tutsolt">' + t + '</span><div class="tb"><i id="tutsolb" style="width:' + p + '%;background:' + (si.ready ? '#8fd694' : si.paused ? '#ff6a4a' : '#ffb454') + '"></i></div></div>';
  }
  function solveUpd(s) {   // refresh the solution bar in place
    const b = document.getElementById('tutsolb'); if (!b) return;
    const tmp = document.createElement('div'); tmp.innerHTML = solveLine(s); const nb = tmp.querySelector('#tutsolb'); if (!nb) return;
    b.style.width = nb.style.width; b.style.background = nb.style.background; document.getElementById('tutsolt').textContent = tmp.querySelector('#tutsolt').textContent;
  }
  window.__tut = { get step() { return step; }, get id() { return STEPS[step] ? STEPS[step].id : 'end'; }, get steps() { return STEPS.length; }, get ids() { return STEPS.map(x => x.id); }, get kind() { return STEPS[step] ? STEPS[step].kind || null : null; }, get x() { return STEPS[step] && STEPS[step].x != null ? STEPS[step].x : null; }, readOrder: [], hiTargets: () => hiOf(), visible,
    get corvane() { return C ? C.id : null; }, get decoy() { return G ? G.id : null; }, get lure() { return L ? L.id : null; }, get done() { return done; }, get vols() { return vols.length; },
    get reading() { return reading; }, get beat() { return beats.length ? beats[0].id : null; }, get identified() { return !!(C && S0 && idf(S0)); }, get text() { return box.textContent; },
    rawTick: (s, dt) => oTick(s, dt), autos: [], skips: [], beatsSeen: () => Object.keys(seen) };
  let txt = { k: null, t: '' };   // an order's words are fixed when it is given; they change only when its key does (then it is read again)
  const tkey = s => { const st = STEPS[step]; return step + ':' + (st && st.key ? st.key(s) : ''); };
  function say0(s) { const st = STEPS[step]; if (!st) return ''; const k = tkey(s); if (txt.k !== k) txt = { k, t: st.say(s) }; return txt.t; }
  function body(s) { return beats.length ? beats[0].text : say0(s); }
  function render(s) {
    const st = STEPS[step]; place();
    if (!st && !beats.length) { collapsed = true; box.classList.remove('rd'); box.innerHTML = '<div class="th"><span>CAPTAIN OSTROW &middot; ALL ORDERS GIVEN</span></div><div>' + (s.inc.some(v => v.id === C.id) ? 'Her answer is in the air. Brace.' : 'Volleys away. Watch them land.') + '</div>' + solveLine(s); highlight(); return; }
    const bt = beats.length > 0; collapsed = false;
    box.classList.toggle('rd', reading);
    box.innerHTML = '<div class="th"><span>OSTROW &middot; ' + (st ? 'STEP ' + (step + 1) + ' OF ' + STEPS.length : 'ALL ORDERS GIVEN') + ' &middot; ' + (bt ? 'NOTE' : st.title.toUpperCase()) + (reading || paused ? ' &middot; <b>CLOCK STOPPED</b>' : '') + '</span>' +
      (reading ? '<button id="tutnext" type="button" title="Resume the clock">Understood</button>' : '') + (bt ? '' : '<button id="tutskip" type="button" title="Ostrow does this step for you">Skip step</button>') + '</div>' +
      '<div>' + body(s) + '</div>' + (note && !bt ? '<div class="tn">' + note + '</div>' : '') + solveLine(s);
    const n = document.getElementById('tutnext'); if (n) n.onclick = () => { if (beats.length) beats.shift(); else { acked = true; ackTxt = tkey(S0); } director(S0); };
    const k = document.getElementById('tutskip'); if (k) k.onclick = () => { forced = true; acked = true; ackTxt = tkey(S0); __tut.skips.push(st.id); director(S0); };
    hiKey = ''; highlight();
  }
  function enter(s) { forced = false; autoDone = false; acked = false; ackTxt = ''; const st = STEPS[step]; if (st && st.enter) st.enter(s); }
  function setHold(s, on) { reading = on; window.__tutHold = on; s.hold = on; }   // the engine's hold: stepGame and the E.tick wrapper both stop
  function director(s) {
    if (done || !C || s !== S0) return;
    if (s.over || s.hull < 45 || (landed(s) && !beats.length && ((answered(s) && (seen.answer || s.hull >= 100)) || s.t > vols[1].at + 3))) { surrender(s); return; }   // both our hits and her answer have landed and been read (the tutorial cannot be failed)
    // standing guarantees (game time only: nothing here runs while the clock is stopped)
    if (C.state === 'locked' && step > IX('track')) { if (eyes(s)) eyesOffT = null; else if (eyesOffT == null) eyesOffT = s.t; else if (s.t - eyesOffT > 0.25) { E.assign(s, 'dace', C.id); eyesOffT = null; beat('riggs' + s.t.toFixed(2), 'Riggs. Back on her. No eyes, no solution.', ['#sl' + C.id], true); } }
    if (s.vent.on && !s.vent.forced && s.t - s.vent.t0 > 1.2 && step >= IX('vent')) { E.stopVent(s); beat('fins' + s.t.toFixed(2), "Fins in. That's long enough out: every second they're out, we're lit up.", ['#k-vent', '#g-seen'], true); }
    let st = STEPS[step];
    for (let guard = 0; st && guard < STEPS.length + 2; guard++) {
      if (forced && !autoDone && st.auto && (!st.canAuto || st.canAuto(s))) { st.auto(s); autoDone = true; __tut.autos.push(st.id + ':skip'); if (st.autoSay) note = st.autoSay(s); }
      if (st.done(s)) { const nt = autoDone && st.autoSay ? note : ''; step++; st = STEPS[step]; enter(s); note = st && st.kind === 'check' ? '' : nt; continue; }   // a check order is long: no carried note
      break;
    }
    beatsCheck(s);
    st = STEPS[step];
    if (st && acked && !st.noAck && tkey(s) !== ackTxt && !forced) acked = false;   // the order changed (readings came in, the solution is ready, another view): read it again
    const want = beats.length > 0 || (!!st && !st.noAck && !acked);
    if (want !== reading || s.hold !== want) setHold(s, want);
    const key = step + '|' + (beats[0] ? beats[0].id : '') + '|' + reading + '|' + paused + '|' + body(s) + '|' + note + '|' + (C.state === 'locked');
    if (key !== rkey) { rkey = key; render(s); } else { highlight(); solveUpd(s); }
  }
  function surrender(s) {
    done = true; setHold(s, false); try { paused = true; } catch (e) {} document.querySelectorAll('.tut-hi').forEach(e => e.classList.remove('tut-hi', 'tut-beat'));
    const line = vols.length ? "Enough, Ostrow. You've made your point, and I've made mine. Hold your fire. I'll take visitors. Send me the new one." : 'Enough, Ostrow. Nobody needs to die tonight. Send me the new one.';   // she stops it before we have fired a shot only if our hull went first
    box.classList.remove('rd'); Object.assign(box.style, { left: '50%', top: '50%', width: 'min(640px,92vw)', height: 'auto', transform: 'translate(-50%,-50%)', fontSize: '13px', padding: '12px 16px' });
    box.innerHTML = '<div style="font:700 11px Chakra Petch,sans-serif;letter-spacing:.16em;color:#5fd0e0;margin-bottom:6px">SATO &middot; SENSORS</div><div>Laser on us, Captain. Low power, pulsed. It\'s not a weapon. It\'s a message.</div>' +
      '<div style="font:700 11px Chakra Petch,sans-serif;letter-spacing:.16em;color:#b69cf0;margin:12px 0 6px">CORVANE &middot; BY LASER</div><div style="font-style:italic">' + line + '</div>' +
      '<div style="font:700 11px Chakra Petch,sans-serif;letter-spacing:.16em;color:#9fb7c8;margin:12px 0 6px">CAPTAIN OSTROW</div><div>...She asked for you. Get to the airlock.</div>' +
      '<div style="margin-top:12px;display:flex;justify-content:flex-end"><button id="tutdone" type="button">Report to the airlock</button></div>';
    document.getElementById('tutdone').onclick = () => { location.href = RET + '#after_hunt'; };
  }
  function hideEscapes() {   // no breach drive and no running quiet in the tutorial: the keys are hidden (the engine calls are stubbed above)
    ['brk', 'quiet', 'k-breach', 'k-quiet', 'r-eta', 'g-spool', 'ln-jump', 'ln-dog', 'r-qcd'].forEach(id => { const el = document.getElementById(id); if (el) el.style.visibility = 'hidden'; });
    const kp = document.getElementById('k-pause'); if (kp) kp.dataset.tip = 'Stop the clock. On the Tern the displays stay up and orders still go in while it is stopped. Key: P';
  }
  // the director also runs off the clock: orders given while the clock is stopped still complete steps, and Understood needs no tick
  setInterval(() => { if (!done && S0) director(S0); }, 200);
  (function hl() { if (!done && S0 && C) highlight(); requestAnimationFrame(hl); })();   // the console rebuilds slips and keys as it updates: keep the outline on every frame
  // skip the briefing screen and start straight away, paused: step 1 is starting the clock
  setTimeout(() => { try { brief.seed = 4242; brief.nreal = 1; brief.ally = false; brief.entry = 'standard'; brief.speed = 'v2'; brief.route = []; document.getElementById('brief').hidden = true; briefing = false; begin(); hideEscapes(); if (!paused) togglePause(); enter(S); director(S); } catch (e) { console.error(e); } }, 60);
})();
