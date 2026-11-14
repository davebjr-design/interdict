/* Voice: spoken crew calls for the hunt (text to speech via the browser's Web Speech API).
 *
 * Rule from the design (docs/stations_and_command_ui.md s5.1): audio first, then the picture.
 * speak() returns a promise that resolves when the line has FINISHED (or its timed fallback has), so the UI
 * can show a track, chip or subtitle after the line. If speech is unavailable, muted, or stalls, a timed
 * fallback (about 0.33 s per word) stands in, so the game never depends on audio working.
 *
 *   Voice.speak({who:'Quill', text:'New thermal, bearing two-eight-zero.', priority:2}).then(...)
 *   Voice.cancel(); Voice.set({enabled:false, rate:1.1, volume:0.8}); Voice.who -> profiles
 *
 * Priority: 1 routine (dropped if the queue is backed up), 2 notable, 3 urgent (jumps the queue),
 *           4 critical (interrupts the line being spoken). Equal priority is first in, first out.
 * Limits: the Web Speech API cannot add radio filtering, and available voices differ by device, so each crew
 * member is a profile (voice preference + pitch + rate) that maps onto whatever voices exist. Swap in recorded
 * lines or a cloud voice later by replacing speakNow(); the queue and callbacks stay the same.
 */
(function (root) {
  'use strict';
  const S = { enabled: true, rate: 1, volume: 1, maxQueue: 6, subtitle: null };
  // pitch 0.1-2, rate 0.1-10 (kept near 1). prefer: substrings of voice names, tried in order; gender is a soft hint.
  const WHO = {
    Quill:     { pitch: 1.25, rate: 1.08, gender: 'f', prefer: ['Samantha', 'Google UK English Female', 'Zira', 'Aria'] },
    Abara:     { pitch: 0.95, rate: 1.00, gender: 'f', prefer: ['Karen', 'Google US English', 'Jenny', 'Hazel'] },
    Castellan: { pitch: 0.70, rate: 0.90, gender: 'm', prefer: ['Daniel', 'Google UK English Male', 'Guy', 'Ryan'] },
    Dace:      { pitch: 1.00, rate: 1.12, gender: 'm', prefer: ['Alex', 'David', 'Mark', 'Davis'] },
    Fenwick:   { pitch: 0.85, rate: 0.92, gender: 'm', prefer: ['Fred', 'Tom', 'James'] },
    Pell:      { pitch: 0.55, rate: 0.85, gender: 'f', prefer: ['Moira', 'Tessa', 'Libby', 'Susan'] },
    Ostrow:    { pitch: 0.80, rate: 0.95, gender: 'm', prefer: ['Daniel', 'Oliver', 'George'] },
    Ames:      { pitch: 1.10, rate: 1.05, gender: 'm', prefer: ['Aaron', 'Evan', 'Nathan'] },
    Dunne:     { pitch: 1.05, rate: 1.00, gender: 'f', prefer: ['Victoria', 'Allison', 'Ava'] },
    default:   { pitch: 1.00, rate: 1.00, gender: '',  prefer: [] }
  };
  const q = [];            // {job, pri, seq}
  let cur = null, seq = 0, timer = null, watchdog = null;

  function load() {
    try { const v = JSON.parse(localStorage.getItem('interdict.voice') || 'null'); if (v && typeof v === 'object') Object.assign(S, v); } catch (e) {}
  }
  function save() {
    try { localStorage.setItem('interdict.voice', JSON.stringify({ enabled: S.enabled, rate: S.rate, volume: S.volume })); } catch (e) {}
  }
  function synth() { return root.speechSynthesis && root.SpeechSynthesisUtterance ? root.speechSynthesis : null; }
  function words(t) { return String(t).trim().split(/\s+/).filter(Boolean).length; }
  function estMs(t, rate) { return Math.max(700, (words(t) * 330 + 250) / Math.max(0.5, rate || 1)); }

  function pickVoice(p) {
    const sy = synth(); if (!sy) return null;
    const vs = (sy.getVoices && sy.getVoices()) || []; if (!vs.length) return null;
    const en = vs.filter(v => /^en/i.test(v.lang || ''));
    const pool = en.length ? en : vs;
    for (const name of p.prefer) { const m = pool.find(v => (v.name || '').indexOf(name) >= 0); if (m) return m; }
    // soft gender hint by common name fragments; otherwise a stable pick by name so each crew member differs
    const fem = /female|samantha|karen|zira|aria|jenny|hazel|moira|tessa|libby|susan|victoria|allison|ava/i;
    const mal = /\bmale\b|daniel|guy|ryan|alex|david|mark|davis|fred|tom|james|oliver|george|aaron|evan|nathan/i;
    if (p.gender) { const m = pool.find(v => (p.gender === 'f' ? fem : mal).test(v.name || '') && !(p.gender === 'm' && /female/i.test(v.name || ''))); if (m) return m; }
    return pool[0];
  }

  function finish(job, ok) {
    if (!cur || cur.job !== job) return;
    clearTimeout(timer); clearTimeout(watchdog); timer = watchdog = null;
    const c = cur; cur = null;
    try { job.onEnd && job.onEnd(ok); } catch (e) {}
    c.resolve(ok);
    next();
  }

  function speakNow(job) {
    const sy = synth();
    const rate = (job.profile.rate || 1) * S.rate;
    try { job.onStart && job.onStart(); } catch (e) {}
    if (S.subtitle) try { S.subtitle(job); } catch (e) {}
    if (!S.enabled || !sy || S.volume <= 0) {            // timed fallback: the line "plays" silently for its natural length
      timer = setTimeout(() => finish(job, false), estMs(job.text, rate));
      return;
    }
    let done = false;
    const end = ok => { if (!done) { done = true; finish(job, ok); } };
    try {
      const u = new root.SpeechSynthesisUtterance(job.text);
      const v = pickVoice(job.profile); if (v) u.voice = v;
      u.pitch = job.profile.pitch || 1; u.rate = rate; u.volume = S.volume;
      u.onend = () => end(true); u.onerror = () => end(false);
      sy.speak(u);
      watchdog = setTimeout(() => { try { sy.cancel(); } catch (e) {} end(false); }, estMs(job.text, rate) * 2.5 + 1500); // some browsers never fire onend
    } catch (e) { end(false); }
  }

  function next() {
    if (cur || !q.length) return;
    q.sort((a, b) => b.pri - a.pri || a.seq - b.seq);
    const n = q.shift();
    cur = { job: n.job, pri: n.pri, resolve: n.resolve };
    speakNow(n.job);
  }

  function interrupt() {
    if (!cur) return;
    const sy = synth(); try { sy && sy.cancel(); } catch (e) {}
    const c = cur; clearTimeout(timer); clearTimeout(watchdog); cur = null;
    try { c.job.onEnd && c.job.onEnd(false); } catch (e) {} c.resolve(false);
  }

  function speak(o) {
    const pri = Math.max(1, Math.min(4, o.priority || 2));
    const profile = WHO[o.who] || WHO.default;
    const job = { who: o.who || 'default', text: String(o.text || ''), priority: pri, profile, onStart: o.onStart, onEnd: o.onEnd };
    if (!job.text) return Promise.resolve(false);
    return new Promise(resolve => {
      // a backed-up queue drops routine chatter rather than falling behind events
      if (pri === 1 && q.length >= S.maxQueue) { resolve(false); return; }
      q.push({ job, pri, seq: seq++, resolve });
      if (pri >= 4 && cur && cur.pri < 4) interrupt();     // critical calls cut in
      next();
    });
  }

  function cancel() {
    const sy = synth(); try { sy && sy.cancel(); } catch (e) {}
    while (q.length) { const n = q.shift(); n.resolve(false); }
    if (cur) { const c = cur; clearTimeout(timer); clearTimeout(watchdog); cur = null; c.resolve(false); }
  }
  function set(o) { Object.assign(S, o || {}); save(); }
  function state() { return { enabled: S.enabled, rate: S.rate, volume: S.volume, speaking: !!cur, queued: q.length, available: !!synth() }; }

  load();
  root.Voice = { speak, cancel, set, state, who: WHO, _estMs: estMs, _pickVoice: pickVoice };
  if (typeof module !== 'undefined') module.exports = root.Voice;
})(typeof window !== 'undefined' ? window : globalThis);
