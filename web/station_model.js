/* Station model: crew, calls, orders, doctrine, autonomy. No DOM, no engine imports (docs/systems_contract.md).
 *
 *   const M = Stations.create({ secPerMin: 16, command: 'tight', seed: 1, autonomy: { sensors: 'auto' } });
 *   M.ingest(s.log.slice(seen));        // engine report() lines -> calls (classify); or M.raise('W5', {n:2, eta:45})
 *   M.tick(dtSeconds);                  // real seconds: readiness, expiry -> defaults, order stages
 *   M.pending()  -> calls the CO should see now (priority order);   M.answer(id, i);  M.standBy(id);  M.next()
 *   M.on(fn)     -> fn({type:'raise'|'default'|'order'|'info', call?, order?, stage?})
 * Times are real seconds. A person (officer) can only do one thing at a time: calls wait for a busy officer
 * (critical calls cut in), so Abara, who holds fire control, weapons and helm, is a bottleneck by design.
 */
(function (root) {
  'use strict';
  const OFFICER = { sensors: 'Quill', fire: 'Abara', weapons: 'Abara', helm: 'Abara', engineering: 'Castellan', thermal: 'Dace', damage: 'Fenwick', comms: 'Pell' };
  const SKILL = { Quill: [1.0, 1.8], Abara: [0.8, 1.6], Castellan: [1.4, 2.4], Dace: [1.0, 2.0], Fenwick: [1.6, 2.6], Pell: [0.3, 0.6] };   // reaction seconds
  const TIMEOUT = { 2: 45, 3: 16, 4: 7 };                                                      // seconds until the default runs
  const sierra = n => 'Sierra ' + n;
  const O = (...a) => a.map(([label, verb]) => ({ label, verb }));
  const OM = (tight, loose) => [Object.assign({ side: 'tight', verb: 'm_tight' }, tight), Object.assign({ side: 'loose', verb: 'm_loose' }, loose)];   // a decision moment: TIGHT left, LOOSE right, each with its effects in plain words
  // the catalog (docs/systems_contract.md s3). open: Auto still raises it at priority 2 because doctrine does not settle it.
  const ROWS = {
    S1: { st: 'sensors', pri: 2, line: d => `New thermal return, ${sierra(d.n)}.`, batch: c => `${c} new thermal returns.`, opts: O(['Isolate and classify', 'classify'], ['Mark and continue', 'mark'], ['Ignore', 'ignore']), def: 1, cost: 'slower identification' },
    S2: { st: 'sensors', pri: 1, line: d => d.text },
    S3: { st: 'sensors', pri: 2, line: d => d.text },
    S4: { st: 'sensors', pri: 2, line: d => `Lost her bearing, ${sierra(d.n)}. Rescan?`, opts: O(['Rescan', 'rescan'], ['Hold', 'hold']), def: 1, cost: 'stale solution' },
    S5: { st: 'sensors', pri: 2, line: d => `Lost contact on ${sierra(d.n)}, marking as thermal ghost.` },
    S6: { st: 'sensors', pri: 3, line: d => `${sierra(d.n)} just pinged. She is hunting.`, opts: O(['Go quiet', 'quiet'], ['Run', 'evade'], ['Hold', 'hold']), def: 2, cost: 'higher exposure' },
    S7: { st: 'sensors', pri: 2, line: d => d.text },
    S8: { st: 'sensors', pri: 3, open: true, line: d => `I can ping ${sierra(d.n)}. She will know.`, opts: O(['Ping', 'ping'], ['Probe salvo', 'probe'], ['Not yet', 'hold']), def: 2, cost: 'slower fix' },
    W1: { st: 'fire', pri: 2, open: true, line: d => `Bearing only on ${sierra(d.n)}. I need a leg to range her.`, opts: O(['Give a baseline', 'baseline'], ['Hold silent', 'hold'], ['Wait', 'wait']), def: 1, cost: 'fuzzy range, no shot' },
    W2: { st: 'weapons', pri: 3, open: true, line: d => `Solution good on ${sierra(d.n)}. Tubes ready.`, opts: O(['Fire (preset)', 'fire'], ['Probe', 'probe'], ['Hold', 'hold']), def: 2, cost: 'solution may go stale' },
    W3: { st: 'fire', pri: 2, line: d => `Solution on ${sierra(d.n)} is going stale.`, opts: O(['Refresh', 'refresh'], ['Hold', 'hold']), def: 1, cost: 'poor odds' },
    W4: { st: 'weapons', pri: 1, line: d => d.text },
    W5: { st: 'weapons', pri: 4, line: d => `${d.via === 'seeker' ? 'Vampire, seeker active.' : d.n ? 'Contact ' + d.n + ' has launched. Vampire.' : 'Vampire, vampire.'}${d.eta ? ' Impact in ' + d.eta + '.' : ''}`, opts: O(['Go active', 'pd_active'], ['Stay cold', 'pd_cold']), def: (ctx) => ctx.doctrine.pd === 'active-on-vampire' ? 0 : 1, cost: 'a false go-active reveals us; a late one is a hit' },
    W6: { st: 'weapons', pri: 2, line: d => d.text },
    W7: { st: 'damage', pri: 3, line: d => d.text },
    W8: { st: 'weapons', pri: 2, line: d => d.text },
    W9: { st: 'weapons', pri: 2, line: d => d.how === 'burn' ? `${sierra(d.n)} burned at the probe. She is real.` : `${sierra(d.n)} lit her point defence. She is real.`, opts: O(['Mark hostile', 'mark_hostile'], ['Keep probing', 'probe']), def: 0, cost: 'none' },
    H1: { st: 'helm', pri: 3, line: d => 'Burn runs hot. Recommend shorter.', opts: O(['Shorter burn', 'burn_short'], ['Burn as ordered', 'burn'], ['Abort', 'abort']), def: 0, cost: 'less delta-v' },
    H2: { st: 'helm', pri: 3, line: d => 'Turning now cuts the wire.', opts: O(['Hold course', 'hold'], ['Turn anyway', 'turn']), def: 0, cost: 'delay' },
    H3: { st: 'helm', pri: 1, line: d => d.text },
    E1: { st: 'thermal', pri: 3, line: d => 'Running hot. Anything listening can hear us.', opts: O(['Cut thrust', 'cut_thrust'], ['Vent now', 'vent'], ['Hold', 'hold']), def: 0, cost: 'lost speed' },
    E2: { st: 'thermal', pri: 3, line: d => 'Forced vent coming.', opts: O(['Vent now', 'vent'], ['Hold', 'hold']), def: 0, cost: 'none' },
    E3: { st: 'thermal', pri: 1, line: d => d.text },
    E4: { st: 'engineering', pri: 2, line: d => 'Redline available.', opts: O(['No', 'hold'], ['Redline', 'redline']), def: 0, cost: 'none' },
    // brace (docs/mechanics_brace.md): the body state of the crew is a game rule. H4 gates a hard burn or jump on the crew being SECURE.
    H4: { st: 'helm', pri: 3, to: 8, noBucket: true, line: d => ({ burn: 'Crew not secure for the burn. Brace first?', spool: 'Crew not secure for the jump. Brace first?', evade: 'Crew not secure for hard manoeuvring. Brace first?', load: 'We are under load and the crew is not secure. Brace?' }[d.why] || 'Crew not secure. Brace first?'),
      opts: O(['Brace first', 'brace_first'], ['Go now', 'go_now'], ['Cancel', 'cancel']), def: 0, cost: 'delay (about six seconds)' },
    H2P: { st: 'helm', pri: 3, to: 10, noBucket: true, line: d => 'Turning now breaks the probe link.', opts: O(['Hold course', 'cancel'], ['Turn anyway', 'go_now'], ['Switch probes to radio', 'probes_radio_go']), def: 0, cost: 'delay' },   // probe sets (docs/mechanics_probes.md)
    S10: { st: 'sensors', pri: 3, to: 14, noBucket: true, line: d => d.state === 'lost' ? `Set ${d.set} is lost.` : `The laser link to set ${d.set} is broken. Our ${d.cause} change did it.`, opts: O(['Wait for it', 'hold'], ['Switch to radio', 'probes_radio'], ['Recover the set', 'probes_recover']), def: 0, cost: 'the picture ages' },
    H5: { st: 'helm', pri: 1, line: d => d.text || 'Brace complete. Crew secure.' },
    D4: { st: 'damage', pri: 3, to: 14, line: d => `${d.officer || 'Someone'} is hurt${d.station ? ' at ' + d.station : ''}.`, opts: O(['Send Fenwick', 'treat'], ['Carry on', 'hold']), def: 0, cost: 'Fenwick leaves his post for a minute' },
    D1: { st: 'damage', pri: 3, line: d => d.text, opts: O(['Save the sink', 'save_sink'], ['Save the drive', 'save_drive'], ['Seal and sacrifice', 'seal']), def: 0, cost: 'drive degraded' },
    D2: { st: 'damage', pri: 4, line: d => 'Fire in stores and a breach aft. Which first?', opts: O(['Save the sink', 'save_sink'], ['Save the drive', 'save_drive']), def: 0, cost: 'the other burns' },
    D3: { st: 'damage', pri: 4, line: d => d.text },
    C1: { st: 'comms', pri: 2, open: true, line: d => 'An ally offers a link. It is an emission.', opts: O(['Decline', 'decline'], ['Accept', 'accept']), def: 0, cost: 'none' },
    C3: { st: 'comms', pri: 2, open: true, line: d => 'I can run the sensors. It would be seen.', opts: O(['Not yet', 'hold'], ['Do it', 'pell_take']), def: 0, cost: 'none' },
    // decision moments (docs/decision_moments.md, resolved in docs/mechanics_decisions.md): a call with a TIGHT and a LOOSE option.
    // The engine owns the trigger and the effects (HuntRT.MOMENTS, momentCheck, moment); this table is the words. The default is TIGHT: it is the drilled procedure.
    M01: { st: 'sensors', pri: 3, to: 14, noBucket: true, moment: 'M01', line: d => `Captain. ${sierra(d.n)} is shaping into something. I could give you a call now. It would be a guess with good manners. Or I run the full processors and give you a reading.`,
      opts: OM({ label: 'Run the full processors', eff: 'The call comes when two channels finish. Certainty uncapped. Guess noise x0.85.' }, { label: 'Best guess now', eff: 'The call comes about 40% sooner, reads reach 15% farther. Certainty capped at 70%, guess noise x1.5, a lock on it is a hunch lock.', risk: 'A wrong guess becomes a chase, and the full reading takes 20% longer.' }), def: 0, cost: 'none' },
    M02: { st: 'sensors', pri: 3, to: 14, noBucket: true, moment: 'M02', line: d => 'Before you ping, Captain. Something out there is already listening, I think. A full ping answers every question we have and tells them exactly where we are. I can narrow it.',
      opts: OM({ label: 'Full ping', eff: 'Three read rounds, a full fix. Standard heat and alert.' }, { label: 'Narrow it', eff: 'Ping heat halved, alert x0.6, two read rounds. Certainty from the ping capped at 70%; a fix on a locked contact is weaker.', risk: 'You may need a second ping, and the second one is full size.' }), def: 0, cost: 'none' },
    M03: { st: 'fire', pri: 3, to: 14, noBucket: true, moment: 'M03', line: d => 'Locked. Now, I can work this solution by the book, which is fast and a bit dumb. Or I hand-tune the lead, which is better until it isn\'t. Your ship, kid. Captain.',
      opts: OM({ label: 'By the book', eff: 'Solution time x0.85 on this contact. The lead stays at the default.' }, { label: 'Hand-tune the lead', eff: 'Lead error x0.7. The solution goes stale 35% sooner.', risk: 'If the target manoeuvres after the solution is built, the lead overcorrects (error x1.4 until refreshed).' }), def: 0, cost: 'none' },
    M04: { st: 'fire', pri: 3, to: 14, noBucket: true, moment: 'M04', line: d => `Solution on ${sierra(d.n)} just went stale. I can rework it, two minutes give or take. Or we put a volley on the old numbers right now and hope she's kept her course. She usually has. Usually.`,
      opts: OM({ label: 'Rework it', eff: 'A fresh solution; re-solve time x0.85.' }, { label: 'Fire on the old numbers', eff: 'The solution stays valid 50% longer, so you can fire now. The cone cannot be tightened below its default.', risk: 'A miss costs a tube for the reload and lights you up with the blast glow.' }), def: 0, cost: 'none' },
    M07: { st: 'thermal', pri: 3, to: 14, noBucket: true, moment: 'M07', line: d => 'Sink\'s at sixty-five, Captain. By the book we vent now. Fins out, every sensor sees them, done in a couple of minutes. Or you let me pick the moment, somewhere nobody\'s looking, and I dump it fast. I\'m very good at picking moments.',
      opts: OM({ label: 'Vent now, by the schedule', eff: 'Vent starts now at the standard rate. Fins visible the whole time.' }, { label: 'Pick your moment', eff: 'Dace holds until nobody\'s picture of us is improving, up to a hard ceiling at 92% sink, then vents with fast fins (x0.75 time, 0.8 minute of afterglow).', risk: 'A spike past 100% during the hold forces an emergency vent.' }), def: 0, cost: 'none' },
    M09: { st: 'thermal', pri: 3, to: 14, noBucket: true, moment: 'M09', line: d => 'The analyst stations are cooking us, Captain. I can throttle them, thirty percent cooler, slower reads. Or I let them run flat out and keep an eye on it. I\'ll be watching anyway. I\'m always watching.',
      opts: OM({ label: 'Throttle them', eff: 'For the rest of the hunt: analyst heat x0.8, reads 15% slower.' }, { label: 'Let them run flat out', eff: 'Reads 10% faster, analyst heat x1.25. At 85% sink Dace cuts the stations for a minute.', risk: 'The cut lands mid-read and costs you the fresh fixes.' }), def: 0, cost: 'none' },
    X1: { st: 'sensors', pri: 3, line: d => `${sierra(d.n)} has noticed us.`, opts: O(['Go quiet', 'quiet'], ['Evade', 'evade'], ['Hold', 'hold']), def: 0, cost: 'lost initiative' },
    X2: { st: 'sensors', pri: 3, line: d => `${sierra(d.n)} is closing. Her fix on us is tightening.`, opts: O(['Evade', 'evade'], ['Hold', 'hold'], ['Ready salvo', 'ready']), def: 0, cost: 'closer to a shot' },
    X3: { st: 'sensors', pri: 4, line: d => `${sierra(d.n)} has a firm solution on us.`, opts: O(['Evade', 'evade'], ['Fire first', 'fire'], ['Hold', 'hold']), def: 0, cost: 'lost initiative' },
    X4: { st: 'sensors', pri: 2, line: d => `${sierra(d.n)} seems to have lost us.` },
    X5: { st: 'sensors', pri: 2, line: d => `${sierra(d.n)} vented.`, opts: O(['Mark hostile', 'mark_hostile']), def: 0, cost: 'none' }
  };
  // engine report() text -> catalog row. First match wins.
  const MAP = [
    [/Vampire|has launched|has fired on us/i, 'W5'], [/noticed us/i, 'X1'], [/closing in/i, 'X2'], [/firm solution on us/i, 'X3'], [/lost us/i, 'X4'],
    [/just pinged us/i, 'S6'], [/Active ping/i, 'S7'], [/changed course/i, 'S4'],
    [/folded its fins|thermal blaze|has vented|just vented/i, 'X5'],
    [/running hot/i, 'E1'], [/Venting|vent (started|ended)|fins/i, 'E3'],
    [/Hull integrity failed|Emergency breach|Hull is gone/i, 'D3'], [/fouling the sensor/i, 'D1'], [/hull destroyed|derelict/i, 'W6'],
    [/Friendly fire|Hull integrity \d+ percent/i, 'W7'], [/Redline/i, 'E4'],
    [/Contact \d+: (thermal bloom|faint thermal)/i, 'S1'], [/Contact \d+:/i, 'S2'],
    [/Maneuver complete|Flight plan|Waypoint|Holding|Resuming|Burn (off|complete|latched)|Extending|Closing on|Evasive/i, 'H3']
  ];
  // engine structured events (evt(s, type, data) in web/hunt_rt_engine.js) -> catalog rows and call data
  const NUMW = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
  const nw = n => NUMW[n] || String(n);
  const EVT = {
    vampire: d => ['W5', { n: d.n, via: d.via, id: d.id, bearing: d.bearing, at: d.at, eta: d.etaSec != null ? Math.max(5, Math.round(d.etaSec / 5) * 5) + ' seconds' : '' }],
    ping_alert: d => ['S6', { n: d.n, id: d.id, bearing: d.bearing }],
    probe_reaction: d => ['W9', { n: d.n, id: d.id, how: d.how }],
    probe_quiet: d => ['W4', { text: 'Probe landed. No reaction.' }],
    mag_low: d => ['W8', { text: `Magazine low. ${nw(d.salvos)} salvo${d.salvos === 1 ? '' : 's'} left.` }],
    mag_empty: d => ['W8', { text: 'Magazine empty.' }],
    track_lost: d => ['S5', { n: d.n, id: d.id, ghost: d.ghost }],
    brace_complete: d => ['H5', { text: d.by === 'auto' ? 'Crew secure. The crew braced on their own.' : 'Brace complete. Crew secure.' }],
    unsecure: d => ['H4', { why: d.why, g: d.g }],
    injury: d => ['D4', { officer: d.officer, station: d.station, cause: d.cause }],
    probe_link: d => d.state === 'broken' ? ['S10', { set: d.set, cause: d.cause }] : null,
    probe_lost: d => ['S10', { set: d.set, state: 'lost' }],
    moment: d => [d.id, Object.assign({ n: d.n }, d.ctx || {})]
  };
  // speech helpers shared by the call deck and tools/tts/catalog_lines.js, so a rendered clip is found by its exact words
  const spoken = t => String(t || '').replace(/Sierra (\d+)/g, (m, n) => 'Sierra ' + nw(+n)).replace(/\s+/g, ' ').trim();
  const plain = l => String(l).replace(/\s*\([^)]*\)/g, '').trim();
  const CAP = { 'Fire (preset)': 'Fire.', 'Give a baseline': 'Give me a baseline.', 'Ignore': 'Ignore it.', 'Mark and continue': 'Mark it and continue.', 'Track her': 'Track her.', 'Isolate and classify': 'Isolate and classify.', 'No': 'No redline.', 'Do it': 'Do it.', 'Track': 'Track her.', 'Probe': 'Probe her.', 'Classify': 'Classify her.' };
  const ACK = { 'Hold': 'Aye. Holding.', 'No': 'Aye. No redline.', 'Not yet': 'Aye. Not yet.', 'Wait': 'Aye. Waiting.', 'Ignore': 'Aye. Ignoring.', 'Do it': 'Aye. Taking the sensors.', 'Fire (preset)': 'Aye. Firing.', 'Fire': 'Aye. Firing.', 'Track': 'Aye. Tracking.', 'Probe': 'Aye. Probe away.', 'Classify': 'Aye. Classifying.' };
  const captainLine = label => CAP[label] || plain(label) + '.';
  const ackLine = label => ACK[label] || 'Aye. ' + plain(label) + '.';
  function clipId(who, text) {   // stable id for a rendered line: FNV-1a of who|words. The captain's id gets _m or _f in web/voice.js
    let h = 0x811c9dc5; const k = (who === 'Captain' ? 'Captain' : who) + '|' + spoken(text);
    for (let i = 0; i < k.length; i++) { h ^= k.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return (who === 'Captain' ? 'cap_' : 'ln_') + h.toString(16).padStart(8, '0');
  }
  const DOCTRINE = { roe: 'hold-fire', pd: 'active-on-vampire', ping: 'ask', vent: 'at-90', damage: 'sink', reporting: 'standard' };

  function create(cfg) {
    cfg = cfg || {};
    let seed = (cfg.seed || 1) >>> 0;
    const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
    const st = { now: 0, nextId: 1, calls: [], orders: [], history: [], raised: [], listeners: [], last: {}, tokens: 2, tokT: 0, suppressed: 0 };
    const COOL = { 1: 0, 2: 20, 3: 25, 4: 15 };            // seconds before the same row about the same contact can raise again
    const BUCKET = { cap: 2, every: 20 };                  // attention budget: urgent calls refill one per 20 s, so the rhythm target holds by construction
    const autonomy = Object.assign({ sensors: 'auto', fire: 'auto', weapons: 'auto', helm: 'auto', engineering: 'auto', thermal: 'auto', damage: 'auto', comms: 'auto' }, cfg.autonomy);
    const doctrine = Object.assign({}, DOCTRINE, cfg.doctrine);
    const officers = {}; for (const k in SKILL) officers[k] = { busyUntil: 0 };
    const cmdMul = cfg.command === 'loose' ? 1.3 : cfg.command === 'tight' ? 0.8 : 1;
    const stun = {};                                       // officer -> model time (s) until which he is stunned by an impact: his station is dead (nothing is said, nothing is ordered, Hands-on is locked out)
    const stunned = o => stun[o] != null && stun[o] > st.now;
    const body = {};                                       // officer -> reaction multiplier from the body: braced crew work from the couches (slower), an injured officer is slower still (docs/mechanics_brace.md)
    const patience = cfg.command === 'loose' ? 6 : 12;
    const secPerMin = cfg.secPerMin || 16;
    const emit = ev => { for (const f of st.listeners) try { f(ev); } catch (e) {} };
    const speakSecs = t => 0.35 * String(t).trim().split(/\s+/).length + 0.4;
    const desig = text => { const m = /Contact (\d+)/i.exec(text || ''); return m ? +m[1] : 0; };

    function raise(rowId, d) {
      const row = ROWS[rowId]; if (!row) return null;
      d = d || {};
      const officer = OFFICER[row.st], mode = autonomy[row.st];
      const hasOpts = !!(row.opts && row.opts.length);
      // batching: same row, same station, still unspoken, within 4 s
      const prior = st.calls.find(c => c.row === rowId && c.state === 'queued' && st.now - c.at < 4 && row.batch);
      if (prior) { prior.count++; prior.line = row.batch(prior.count); return prior; }
      let pri = row.pri;
      const key = rowId + ':' + (d.n || 0);
      if (pri > 1 && st.last[key] != null && st.now - st.last[key] < COOL[pri]) { st.suppressed = (st.suppressed || 0) + 1; return null; }   // same news again: say it once
      st.last[key] = st.now;
      if (pri >= 3 && !row.noBucket) {                       // spend attention (decision moments and the brace gate have their own caps and skip it); with none left a priority 3 call is a notice, not an interruption
        st.tokens = Math.min(BUCKET.cap, st.tokens + (st.now - st.tokT) / BUCKET.every); st.tokT = st.now;
        if (pri === 4) st.tokens = Math.max(0, st.tokens - 1);   // a critical call always gets through, but it uses up attention too
        else if (st.tokens >= 1) st.tokens -= 1; else pri = 2;
      }
      // what reaches the CO: Auto settles routine decisions by doctrine; Supervised asks; Hands-on routes to the player's screen
      let raiseIt = true, settled = false;
      if (pri === 1) raiseIt = false;
      else if (mode === 'auto' && pri === 2 && hasOpts && !row.open) { raiseIt = false; settled = true; }
      else if (mode === 'supervised' && !hasOpts && pri === 2) raiseIt = true;
      const call = { id: st.nextId++, row: rowId, station: row.st, officer, pri, demoted: pri !== row.pri, at: st.now, readyAt: st.now, state: raiseIt ? 'queued' : 'logged', count: 1,
        line: row.line(d) || d.text || '', data: d, opts: row.opts || null, def: row.def, cost: row.cost, to: row.to || null, moment: row.moment || null, route: mode === 'hands-on' ? 'player' : 'co', expiresAt: null, stood: false, settled };
      st.calls.push(call);
      if (!raiseIt) { if (settled) defaultOutcome(call, 'doctrine'); else call.state = 'logged'; st.history.push(call); emit({ type: 'info', call }); return call; }
      // the officer must be free (a critical call cuts in)
      const off = officers[officer];
      if (pri < 4) { let free = Math.max(st.now, off.busyUntil); for (const q of st.calls) if (q !== call && q.officer === officer && q.state === 'queued') free = Math.max(free, q.readyAt + speakSecs(q.line)); call.readyAt = free; }
      if (stunned(officer)) call.readyAt = Math.max(call.readyAt, stun[officer]);
      st.history.push(call);
      return call;
    }

    function defaultIndex(call) {
      if (!call.opts) return -1;
      const d = call.def; const i = typeof d === 'function' ? d({ doctrine, call }) : d;
      return i == null ? 0 : i;
    }
    function defaultOutcome(call, by) {
      const i = defaultIndex(call);
      call.by = by; call.state = by === 'doctrine' ? 'settled' : 'defaulted';
      if (i >= 0) { call.choice = i; issue(call, i, by); }
      if (by !== 'doctrine') emit({ type: 'default', call });
    }

    function issue(call, i, by) {
      const opt = call.opts[i], officer = call.officer, off = officers[officer];
      const [lo, hi] = SKILL[officer] || [1, 2];
      const react = (lo + rnd() * (hi - lo)) * cmdMul * (body[officer] || 1);
      const start = Math.max(st.now, off.busyUntil, stunned(officer) ? stun[officer] : 0);   // a stunned officer's orders are held until he is back
      const o = { id: st.orders.length + 1, callId: call.id, station: call.station, officer, verb: opt.verb, label: opt.label, data: call.data, by, issuedAt: st.now,
        ackAt: start + react, execAt: start + react + 0.6, doneAt: start + react + 0.6 + 1.5, stage: 'issued' };
      off.busyUntil = Math.max(off.busyUntil, o.ackAt + 0.5);
      st.orders.push(o); emit({ type: 'order', order: o, stage: 'issued' });
      return o;
    }

    function pending() {
      return st.calls.filter(c => c.state === 'raised').sort((a, b) => b.pri - a.pri || a.readyAt - b.readyAt);
    }
    function next() { const p = pending(); return p.length ? p[0] : null; }
    function answer(id, i) {
      const c = st.calls.find(x => x.id === id); if (!c || c.state !== 'raised' || !c.opts || !c.opts[i]) return null;
      if (stunned(c.officer) && autonomy[c.station] === 'hands-on') return null;   // Hands-on is locked out while the officer is down
      c.state = 'answered'; c.choice = i; c.by = 'co'; return issue(c, i, 'co');
    }
    // a proactive order from the CO (radial menu, hold-V report): same lifecycle as a chip (issued, acked, executing, reported)
    function command(station, verb, label, data) {
      const officer = OFFICER[station] || 'Abara';
      const call = { id: st.nextId++, row: 'CO', station, officer, pri: 2, at: st.now, readyAt: st.now, raisedAt: st.now, state: 'answered', count: 1, line: label || verb, data: data || {}, opts: [{ label: label || verb, verb }], def: 0, by: 'co', choice: 0, route: 'co', proactive: true };
      st.calls.push(call); st.history.push(call);
      return issue(call, 0, 'co');
    }
    // a status report on demand ("Sensors, report"): a priority 2 information call from that station's officer
    function report(station, text) {
      const officer = OFFICER[station] || 'Abara', row = { sensors: 'S2', fire: 'W4', weapons: 'W4', helm: 'H3', engineering: 'E3', thermal: 'E3', damage: 'W7', comms: 'S2' }[station] || 'S2';
      const call = { id: st.nextId++, row, station, officer, pri: 2, at: st.now, readyAt: Math.max(st.now, officers[officer].busyUntil), state: 'queued', count: 1, line: text, data: { text }, opts: null, route: 'co', report: true };
      st.calls.push(call); st.history.push(call); return call;
    }
    function dismiss(id) { const c = st.calls.find(x => x.id === id); if (!c || c.state !== 'raised' || c.pri > 2) return false; c.state = 'dismissed'; return true; }
    function standBy(id) {
      const c = st.calls.find(x => x.id === id); if (!c || c.state !== 'raised') return false;   // always available (Dave, 2026-11-20): "wait" is never refused. Each wait buys a little less time, and a critical call buys half
      c.waits = (c.waits || 0) + 1; c.stood = true; if (c.expiresAt != null) c.expiresAt += patience * Math.pow(0.6, c.waits - 1) * (c.pri >= 4 ? 0.5 : 1); return true;
    }
    function tick(dt) {
      st.now += dt;
      for (const c of st.calls) {
        if (c.state === 'queued' && c.readyAt <= st.now) {            // officer is free: say it
          c.state = c.opts || c.pri >= 2 ? 'raised' : 'logged';
          c.raisedAt = st.now; c.expiresAt = st.now + (c.to || TIMEOUT[c.pri] || 45);
          officers[c.officer].busyUntil = Math.max(officers[c.officer].busyUntil, st.now + speakSecs(c.line));
          if (c.pri === 4) { for (const o of st.calls) if (o !== c && o.state === 'raised' && o.expiresAt) o.expiresAt = Math.min(o.expiresAt, st.now + 6); }   // a critical call shortens the others
          st.raised.push({ t: st.now, pri: c.pri, id: c.id, row: c.row });
          if (!c.opts) c.state = 'reported';                          // information only: nothing to answer
          emit({ type: 'raise', call: c });
        }
        if (c.state === 'raised' && c.expiresAt != null && st.now >= c.expiresAt && c.route !== 'player') defaultOutcome(c, 'default');
      }
      for (const o of st.orders) {
        if (o.stage === 'issued' && st.now >= o.ackAt) { o.stage = 'acked'; emit({ type: 'order', order: o, stage: 'acked' }); }
        if (o.stage === 'acked' && st.now >= o.execAt) { o.stage = 'executing'; emit({ type: 'order', order: o, stage: 'executing' }); }
        if (o.stage === 'executing' && st.now >= o.doneAt) { o.stage = 'reported'; emit({ type: 'order', order: o, stage: 'reported' }); }
      }
    }

    // engine log -> calls. entries: {t, who, text, kind, urgent}
    function ingest(entries) {
      const made = [];
      for (const e of entries || []) {
        let id = null;
        for (const [re, r] of MAP) if (re.test(e.text)) { id = r; break; }
        if (!id) id = e.urgent ? 'S6' : null;
        if (!id) continue;
        const n = desig(e.text), eta = /Impact in ([\w .]+?)\./i.exec(e.text);
        const c = raise(id, { n, text: e.text, eta: eta ? eta[1] : '', kind: e.kind });
        if (c) made.push(c);
      }
      return made;
    }
    // engine structured event -> call. Takes {type, data} (engine form) or a flat {type, ...}
    function onEvent(e) {
      if (!e || !EVT[e.type]) return null;
      const d = e.data || Object.assign({}, e); delete d.type;
      const r = EVT[e.type](d); if (!r) return null; const [row, cd] = r;
      return raise(row, cd);
    }
    function stats(winSec) {
      const w = winSec || 20, own = r => !!(ROWS[r.row] && ROWS[r.row].noBucket), big = st.raised.filter(r => r.pri >= 3 && !own(r)), span = Math.max(1, st.now);   // decision moments and the brace gate have their own caps: they are not part of the rhythm budget
      let burst = 0; for (const r of st.raised) burst = Math.max(burst, st.raised.filter(q => q.t >= r.t && q.t < r.t + 5).length);
      return { seconds: st.now, raised: st.raised.length, urgent: big.length, own: st.raised.filter(own).length, urgentPer20s: big.length / (span / w), maxBurst5s: burst,
        suppressed: st.suppressed, defaults: st.calls.filter(c => c.state === 'defaulted').length, settled: st.calls.filter(c => c.state === 'settled').length, logged: st.calls.filter(c => c.state === 'logged').length };
    }
    return { raise, ingest, onEvent, command, report, dismiss, defaultIndex, tick, pending, next, answer, standBy, stats, on: f => st.listeners.push(f), setAutonomy: (k, m) => { autonomy[k] = m; }, setStun: (o, until) => { if (until == null) delete stun[o]; else stun[o] = until; }, stunned, setBody: (o, m) => { if (m == null) delete body[o]; else body[o] = m; }, body, autonomy, doctrine, setDoctrine: o => Object.assign(doctrine, o),
      get now() { return st.now; }, get calls() { return st.calls; }, get orders() { return st.orders; }, officers, secPerMin };
  }
  const API = { create, ROWS, MAP, EVT, OFFICER, DOCTRINE, spoken, captainLine, ackLine, clipId, numWord: nw };
  root.Stations = API; if (typeof module !== 'undefined') module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
