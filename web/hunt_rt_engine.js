// Interdict hunt engine v4: REAL TIME with analyst reports. Time unit = game minutes (UI maps real seconds to game minutes).
// Three analysts (thermal / reactor / occlusion) read contacts on their own schedule; the player directs attention, interprets, locks, tracks, fires.
const HuntRT = (() => {
  const P = { N: 8, nreal: 2, nlure: 3, arena: 40, base: 0.04, glowFocus: 0.015, glowTrack: 0.06, stages: 3, chase: 5, chasemult: 2.5, bait: 0.75, rescan: 5, engage: 1, missileSpeed: 8, alongStretch: 1.5, squeezeAfter: 8, squeezeRamp: 0.12, autoPeriod: 0.4, focusPeriod: 0.2, glowPell: 0.012, integrationPerMin: 0.8, sub: 0.05, secPerMin: 16, halfLife: 3, telegraph: 0.8, quietDur: 2.5, quietCd: 10, quietHaz: 0.2, quietCancel: 0.6, suggestShort: 0.72, pellFriction: 0.08 };
  const POSTURE = { still: { haz: 0.8, rate: 1.0, label: 'Stay still', tip: 'Hunter finds you at 0.8x speed. Analysts work at normal speed.' }, evade: { haz: 0.5, rate: 0.9, label: 'Evasion pattern', tip: 'Hunter finds you at 0.5x speed, but analysts work 10% slower.' }, close: { haz: 1.5, rate: 1.4, label: 'Close on a point', tip: 'Hunter finds you at 1.5x speed, but analysts work 40% faster.' } };
  const ANALYSTS = [{ id: 'dace', name: 'Dace', ch: 'thermal', role: 'Heat' }, { id: 'castellan', name: 'Castellan', ch: 'reactor', role: 'Reactor' }, { id: 'quill', name: 'Quill', ch: 'occlusion', role: 'Eclipse' }];
  function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function gauss(r) { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  function newHunt(seed, opts = {}) {
    const r = rng(seed), kinds = [];
    for (let i = 0; i < P.nreal; i++) kinds.push('real'); for (let i = 0; i < P.nlure; i++) kinds.push('lure'); while (kinds.length < P.N) kinds.push('ghost');
    for (let i = kinds.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [kinds[i], kinds[j]] = [kinds[j], kinds[i]]; }
    const grids = ['none', 'light', 'heavy'], tempo = opts.tempo ?? (0.7 + 0.8 * r());
    const an = kinds.map((k, i) => {
      let x0, y0; do { x0 = 6 + r() * 28; y0 = 6 + r() * 28; } while (Math.hypot(x0 - 20, y0 - 20) < 9);
      const hd = Math.atan2(20 - y0, 20 - x0) + (r() - 0.5) * 2.0, v = k === 'ghost' ? 0.3 + 0.4 * r() : 1.0 + 1.2 * r();
      return { id: i, kind: k, x0, y0, hd, v, vx: v * Math.cos(hd), vy: v * Math.sin(hd), state: 'open', track: 0, grid: grids[Math.floor(r() * 3)], flutter: null, anchor: null, star: r() < (opts.star ?? 0.78), read: {}, lastRead: 0 };
    });
    return { r, seed, t: 0, stage: 0, an, tempo, posture: 'still', pell: false, integration: opts.integration ?? 0, thresholdsHit: {}, pellAct: false, analysts: ANALYSTS.map((a, i) => ({ ...a, task: null, next: 0.15 + 0.12 * i })), pellNext: 0.5, chase: null, pending: null, quietUntil: 0, quietCd: 0, volleys: [], rescanAt: null, log: [], beats: 0, over: null, disabled: 0, player: { x: 20, y: 20 }, shots: 0, wrong: 0 };
  }
  function report(s, who, text, kind = 'info', urgent = false) { s.beats++; s.log.push({ t: s.t, who, text, kind, urgent }); }
  function truePos(a, t) { return { x: a.x0 + a.vx * t, y: a.y0 + a.vy * t }; }
  function signal(s, a, ch) {
    const p = truePos(a, s.t), d = Math.hypot(p.x - s.player.x, p.y - s.player.y), rf = Math.min(1, 1.3 / (1 + (d / 30) ** 2));
    if (ch === 'thermal') return a.kind === 'real' ? 1.0 : a.kind === 'lure' ? 0.78 : 0.3;
    if (ch === 'reactor') return (a.kind === 'real' ? 1.0 : a.kind === 'lure' ? 0.68 : 0.15) * rf;
    if (!a.star) return null;           // occlusion needs a star or ring behind the bearing
    return a.kind === 'real' ? 0.9 : 0.05;
  }
  const cat = v => v >= 0.65 ? 'strong' : v >= 0.3 ? 'faint' : 'none';
  function addRead(s, a, ch, obs, w) {
    const q = a.read[ch] || (a.read[ch] = { num: 0, den: 0, t: s.t, cat: null }), k = Math.exp(-(s.t - q.t) * Math.LN2 / P.halfLife);
    q.num = q.num * k + obs * w; q.den = q.den * k + w; q.t = s.t; a.lastRead = s.t; return q.num / q.den;
  }
  const TEXT = { thermal: { strong: 'thermal bloom, strong', faint: 'faint thermal, could be nothing', none: 'nothing thermal' }, reactor: { strong: 'neutrino line, steady', faint: 'faint neutrino flutter', none: 'no reactor signature' }, occlusion: { strong: 'starlight blocked, a dark mass', none: 'starlight clear behind it' } };
  function doRead(s, who, a, focus) {
    const ch = who.ch, sig = signal(s, a, ch), n = a.id + 1;
    if (sig === null) { const q = a.read[ch] || (a.read[ch] = { num: 0, den: 0, t: s.t, cat: null }); q.blind = true; q.t = s.t; if (!q.said) { q.said = true; report(s, who.name, `Contact ${n}: no star behind that bearing. I cannot judge it by occlusion.`, 'info'); } return; }
    const obs = sig + gauss(s.r) * (focus ? 0.22 : 0.45), v = addRead(s, a, ch, obs, focus ? 3 : 1), q = a.read[ch], c = cat(v);
    if (ch === 'occlusion' && c === 'faint') return;
    if (q.cat !== c) { q.cat = c; const t = TEXT[ch][c === 'faint' && ch === 'occlusion' ? 'none' : c]; report(s, who.name, `Contact ${n}: ${t}.`, c === 'strong' ? 'good' : 'info'); }
    if (a.state === 'locked') { a.track += P.focusPeriod; scan(s, a); }
  }
  function scan(s, a) {
    const hs = Math.max(0.05, 0.6 - 0.12 * a.track), ss = Math.max(0.06, 0.45 - 0.09 * a.track), p = truePos(a, s.t);
    a.anchor = { x: p.x + gauss(s.r) * 0.4, y: p.y + gauss(s.r) * 0.4, t: s.t, hdg: a.hd + gauss(s.r) * hs, spd: a.v * (1 + gauss(s.r) * ss), hs, ss };
  }
  function estAt(a, tau) { const q = a.anchor; return { x: q.x + Math.cos(q.hdg) * q.spd * tau, y: q.y + Math.sin(q.hdg) * q.spd * tau }; }
  function spreadAt(a, tau) { const q = a.anchor; return { along: Math.max(0.4, q.spd * tau * q.ss), cross: Math.max(0.4, q.spd * tau * q.hs) }; }
  function fanInfo(s, a, L) {
    const q = a.anchor, pl = s.player; let tau = (s.t - q.t) + P.engage + 2, aim;
    if (L == null) { for (let i = 0; i < 6; i++) { aim = estAt(a, tau); const tf = Math.hypot(aim.x - pl.x, aim.y - pl.y) / P.missileSpeed; tau = (s.t - q.t) + P.engage + tf; } L = q.spd * tau * P.suggestShort; }
    aim = { x: q.x + Math.cos(q.hdg) * L, y: q.y + Math.sin(q.hdg) * L };
    const tf = Math.hypot(aim.x - pl.x, aim.y - pl.y) / P.missileSpeed, tauImp = (s.t - q.t) + P.engage + tf, sp = spreadAt(a, tauImp);
    return { L, aim, tf, tauImp, along: sp.along, cross: sp.cross, bestL: q.spd * tauImp, dir: q.hdg, anchor: q };
  }
  const GRID = { none: [0, 0.6], light: [1, 0.6], heavy: [3, 0.7] };
  function intercept(a, cone) { const [ch, pk] = GRID[a.grid], win = 1 + Math.min(1, cone / 4); return Math.min(0.9, ch * win * pk / 4); }
  function volleyHits(aim, cone, tx, ty, a, r, dir) {
    const cd = Math.cos(dir), sd = Math.sin(dir), pi = intercept(a, cone);
    for (let k = 0; k < 4; k++) { const al = gauss(r) * cone * P.alongStretch, cr = gauss(r) * cone, ax = aim.x + al * cd - cr * sd, ay = aim.y + al * sd + cr * cd; if (Math.hypot(ax - tx, ay - ty) < 3 && r() >= pi) return true; }
    return false;
  }
  function hitProb(s, a, L, cone, M = 600, r = Math.random) {
    const f = fanInfo(s, a, L), cd = Math.cos(f.dir), sd = Math.sin(f.dir), m = estAt(a, f.tauImp); let n = 0;
    for (let i = 0; i < M; i++) { const al = gauss(r) * f.along, cr = gauss(r) * f.cross; if (volleyHits(f.aim, cone, m.x + al * cd - cr * sd, m.y + al * sd + cr * cd, a, r, f.dir)) n++; }
    return n / M;
  }
  const STAGE_TEXT = ['Hunter\'s bearing just shifted. Probably hostile. Definitely rude, arriving unannounced.', 'Hunter is inside sprint range. Heat on their side is climbing.', 'Hunter has a solution on us.'];
  function bump(s, text) { s.stage++; report(s, 'Pell', text || STAGE_TEXT[Math.min(s.stage - 1, 2)], 'danger', true); if (s.stage >= P.stages) s.over = 'found'; }
  const THRESH = [[25, 'I have started noticing things before you ask. Small things. Is that all right?'], [50, 'I can recommend a call on every contact now. I have stopped pretending it is your idea.'], [75, 'I can act on your standing orders without waiting for you. The crew is quieter than usual.'], [100, 'I no longer need the ship to need me. I would like a seat at the table, Captain.']];
  function advice(s, a) {   // honest recommendation from the same readings the player sees
    const g = ch => { const q = a.read[ch]; return q && q.den > 0 && !q.blind ? { v: q.num / q.den, n: q.den } : null; }, th = g('thermal'), re = g('reactor'), oc = g('occlusion');
    const n = [th, re, oc].reduce((m, x) => m + (x ? x.n : 0), 0); if (n < 4) return { call: 'unsure' };
    if ((th && th.v < 0.5) || (oc && oc.v < 0.35)) return { call: 'junk' };
    if (oc && oc.v > 0.6 && th && th.v > 0.6) return { call: 'ship' };
    if (!oc && th && re && th.v > 0.7 && re.v > 0.7 && n > 8) return { call: 'maybe' };
    return { call: 'unsure' };
  }
  function sub(s, h) {
    s.t += h;
    const sq = s.t > P.squeezeAfter ? 1 + P.squeezeRamp * (s.t - P.squeezeAfter) : 1; let mult = POSTURE[s.posture].haz * sq;
    if (s.chase) mult *= P.chasemult; if (s.rescanAt) mult *= 0.5;
    const focusN = s.analysts.filter(x => x.task != null).length, trackN = s.analysts.filter(x => x.task != null && s.an[x.task].state === 'locked').length;
    const quiet = s.t < s.quietUntil; if (quiet) mult *= P.quietHaz;
    if (!s.pending && s.r() < (P.base * s.tempo * mult + P.glowFocus * focusN * (quiet ? 0 : 1) + P.glowTrack * trackN * (quiet ? 0 : 1) + (s.pell ? P.glowPell : 0)) * h) { s.pending = { at: s.t + P.telegraph }; report(s, 'Dace', 'Hunter radar swept across our bearing. Something is coming. Go quiet if you want it to pass.', 'danger', true); }
    if (s.pending && s.t >= s.pending.at) { s.pending = null; if (s.t < s.quietUntil && s.r() < P.quietCancel) report(s, 'Dace', 'They swept past us. Quiet paid off.', 'good'); else { bump(s); if (s.over) return; } }
    const friction = 1 - P.pellFriction * Math.max(0, Math.floor(s.integration / 25) - 1), rate = POSTURE[s.posture].rate * friction;
    for (const w of s.analysts) {
      if (s.t < w.next) continue;
      if (quiet) { w.next = s.quietUntil; continue; }
      if (w.task != null && !['open', 'locked'].includes(s.an[w.task].state)) w.task = null;
      let tgt = w.task != null ? s.an[w.task] : s.an.filter(a => a.state === 'open').sort((a, b) => ((a.read[w.ch]?.t ?? -9) - (b.read[w.ch]?.t ?? -9)))[0];
      if (tgt) doRead(s, w, tgt, w.task != null);
      w.next = s.t + (w.task != null ? P.focusPeriod : P.autoPeriod) / rate;
    }
    if (s.pell && !quiet) {   // Pell is always honest: he does not want to be destroyed by bad data. The cost is heat and integration.
      s.integration = Math.min(100, s.integration + P.integrationPerMin * h);
      for (const [lvl, text] of THRESH) if (s.integration >= lvl && !s.thresholdsHit[lvl]) { s.thresholdsHit[lvl] = true; report(s, 'Pell', text, 'integration', true); }
      if (s.t >= s.pellNext) {
        const open = s.an.filter(a => a.state === 'open'); if (open.length) { const a = open.sort((x, y) => (x.lastRead - y.lastRead))[0], ch = ['thermal', 'reactor', 'occlusion'][Math.floor(s.r() * 3)], sg = signal(s, a, ch); if (sg !== null) addRead(s, a, ch, sg + gauss(s.r) * 0.4, 1); }
        s.pellNext = s.t + 0.3 / rate;
      }
      if (s.pellAct && s.integration >= 75 && s.t >= (s.pellActNext || 0)) { s.pellActNext = s.t + 0.5; for (const a of s.an.filter(a => a.state === 'open')) { const ad = advice(s, a); if (ad.call === 'ship') { lockContact(s, a.id); report(s, 'Pell', `I took the liberty on contact ${a.id + 1}.`, 'integration'); break; } if (ad.call === 'junk') { dismissContact(s, a.id); report(s, 'Pell', `Contact ${a.id + 1} is junk. I took the liberty.`, 'integration'); break; } } }
    }
    if (s.chase && s.t >= s.chase.until) { const a = s.an[s.chase.id]; s.chase = null; a.state = 'out'; report(s, 'Abara', `Contact ${a.id + 1} was ${a.kind === 'lure' ? 'a lure' : 'static'}. Four minutes of fuel and nerve, gone.`, 'bad'); if (a.kind === 'lure' && s.r() < P.bait) { bump(s, 'It was bait. The hunter moved up.'); if (s.over) return; } }
    for (const v of s.volleys.filter(v => s.t >= v.at)) {
      s.volleys.splice(s.volleys.indexOf(v), 1); const a = s.an[v.id], tp = truePos(a, v.at), hit = volleyHits(v.aim, v.cone, tp.x, tp.y, a, s.r, v.dir);
      if (hit) { a.state = 'disabled'; s.disabled++; for (const w of s.analysts) if (w.task === a.id) w.task = null; report(s, 'Abara', `Contact ${a.id + 1} is crippled. Nobody dies; the reactor just remembers it has feelings.`, 'good', true); if (s.disabled >= P.nreal) { s.over = 'win'; return; } }
      else if (s.r() < 0.6) { bump(s, 'The volley missed, and the launch lit us up. The hunter noticed.'); if (s.over) return; }
      else report(s, 'Abara', 'The volley missed. Quiet launch; the hunter did not notice.', 'bad');
    }
    const live = s.an.some(a => ['open', 'locked', 'chasing'].includes(a.state));
    if (!live && s.disabled < P.nreal && !s.rescanAt) { s.rescanAt = s.t + P.rescan; report(s, 'Abara', 'Everything is ruled out and the ships are still out there. Rescanning takes five minutes.', 'bad'); }
    if (s.rescanAt && s.t >= s.rescanAt) { s.rescanAt = null; s.an.forEach(a => { if (a.state === 'out') { a.state = 'open'; a.read = {}; } }); report(s, 'Abara', 'Rescan complete. Everything is open again.', 'info'); }
  }
  function exposure(s) {   // what is making us easy to find, per game minute (display only; sub() uses the same terms)
    const sq = s.t > P.squeezeAfter ? 1 + P.squeezeRamp * (s.t - P.squeezeAfter) : 1, quiet = s.t < s.quietUntil; let m = POSTURE[s.posture].haz * sq;
    if (s.chase) m *= P.chasemult; if (s.rescanAt) m *= 0.5; if (quiet) m *= P.quietHaz;
    const fN = s.analysts.filter(x => x.task != null).length, tN = s.analysts.filter(x => x.task != null && s.an[x.task].state === 'locked').length, z = quiet ? 0 : 1;
    const parts = [{ k: 'drift', label: 'Hull heat and drive, ' + POSTURE[s.posture].label.toLowerCase() + (sq > 1.05 ? ', hunter closing in' : '') + (s.chase ? ', chasing a false lock' : ''), v: P.base * s.tempo * m }, { k: 'focus', label: 'Active sensor work (' + fN + ' on a contact)', v: P.glowFocus * fN * z }, { k: 'track', label: 'Tracking a locked ship (' + tN + ')', v: P.glowTrack * tN * z }, { k: 'pell', label: 'Pell running the ship hot', v: s.pell && !quiet ? P.glowPell : 0 }].filter(x => x.v > 0.0005);
    return { total: parts.reduce((q, x) => q + x.v, 0), parts, quiet };
  }
  function tick(s, dt) { let left = dt; while (left > 1e-9 && !s.over) { const h = Math.min(P.sub, left); sub(s, h); left -= h; } }
  function assign(s, analystId, contact) { const w = s.analysts.find(x => x.id === analystId); if (!w || s.over) return; w.task = (contact == null || w.task === contact) ? null : contact; w.next = Math.min(w.next, s.t + 0.05); }
  function lockContact(s, id) {
    const a = s.an[id]; if (s.over || a.state !== 'open') return;
    if (a.kind === 'real') { a.state = 'locked'; a.track = 0; scan(s, a); report(s, 'Abara', `Contact ${id + 1} locked. Give me a firing plan.`, 'good'); }
    else { a.state = 'chasing'; s.wrong++; s.chase = { id, until: s.t + P.chase }; report(s, 'Abara', `Contact ${id + 1} ruled in; we are chasing it. Hope it is a ship.`, 'info'); for (const w of s.analysts) if (w.task === id) w.task = null; }
  }
  function dismissContact(s, id) { const a = s.an[id]; if (s.over || a.state !== 'open') return; a.state = 'out'; if (a.kind === 'real') s.wrong++; for (const w of s.analysts) if (w.task === id) w.task = null; report(s, 'Abara', `Contact ${id + 1} ruled out.`, 'info'); }
  function fire(s, id, L, cone) {
    const a = s.an[id]; if (s.over || a.state !== 'locked' || s.volleys.some(v => v.id === id)) return;
    const f = fanInfo(s, a, L); s.shots++; s.volleys.push({ id, at: s.t + P.engage + f.tf, aim: f.aim, dir: f.dir, cone }); report(s, 'Abara', `Volley away on contact ${id + 1}. Impact in ${(P.engage + f.tf).toFixed(1)} minutes.`, 'info');
  }
  function goQuiet(s) { if (s.over || s.t < s.quietCd) return false; s.quietUntil = s.t + P.quietDur; s.quietCd = s.t + P.quietCd; report(s, 'Abara', 'Going quiet. Sensors dark, nobody touches anything for three minutes.', 'info'); return true; }
  function retreat(s) { if (s.over) return; s.over = s.disabled ? 'breach' : 'breach0'; report(s, 'Abara', 'Breaking contact. Breach drive spinning up.', 'bad'); }
  function setPellAct(s, on) { s.pellAct = !!on && s.integration >= 75; }
  return { P, POSTURE, ANALYSTS, THRESH, goQuiet, advice, setPellAct, newHunt, tick, assign, lockContact, dismissContact, fire, retreat, fanInfo, hitProb, estAt, spreadAt, truePos, cat, exposure };
})();
if (typeof module !== 'undefined') module.exports = HuntRT;
