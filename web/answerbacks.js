/* Answerbacks (Dave, 2026-11-24): after an order, the officer may ask the captain one short follow-up question that sets how the
 * order is carried out ("Fins are out. Pull them in at a quarter, or drain her all the way?"). The mechanic, docs/answerbacks.md:
 *
 *   TRIGGER   a reportable order just ran (the verb names are crew_reports.js verbs: vent, fire, ping, route, classify ...)
 *   WHEN      a condition on the live state; it returns the question's data, or null to stay quiet
 *   QUESTION  one line in the officer's own voice, one "Captain" at most, two options (three at most later)
 *   DEFAULT   what the officer does if the captain ignores it: always the sensible, drilled answer, with a stated cost
 *   ANSWER    each option is a verb that either acts now, or sets a STANDING ORDER that TICK carries out later
 *   LIMITS    once per hunt, or once per contact, so a question never nags
 *
 * An answerback is an ordinary call (station_model.js ROWS), so it shows in the call deck, expires to its default, and can be
 * put off with Wait. This file only adds the rows, the triggers and the verb handlers. To add one: append to DEFS.
 *
 *   const AB = Answerbacks.create();            // one per hunt, held by the station adapter (A.ab)
 *   AB.check(x)  -> [{ row, data }]             // x = { E, s, M, verb, d, id, doctrine } after an order; the adapter raises each
 *   AB.run(verb, x) -> true | false | null      // an option was chosen or defaulted: null means not an answerback verb
 *   AB.tick(x)   -> [{ officer, text }]         // standing orders: called every update; returns lines the officer should say
 */
(function (root) {
  'use strict';
  const req = n => (typeof require !== 'undefined' ? require(n) : null);
  const ST = root.Stations || req('./station_model.js');
  const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'];
  const word = n => WORDS[n] || String(n);
  const sierra = n => 'Sierra ' + (Number.isInteger(+n) ? word(+n) : n);
  const O = (...a) => a.map(([label, verb]) => ({ label, verb }));

  // The table. Each entry: id (the call row), st (the station that asks), after (crew_reports verbs), once ('hunt' | 'contact'),
  // when(x) -> data | null, line(data) -> the spoken question, opts, def (index the officer takes if ignored), cost, to (seconds to answer),
  // run: { verb: x -> true | false } (false = could not do it), tick(x, st) -> lines (optional, for a standing order).
  const DEFS = [
    { id: 'AB1', st: 'thermal', after: ['vent'], once: 'hunt', to: 25,
      when: x => { const s = x.s; return s.vent.on && !s.vent.forced && s.sink.h > 0.3 ? { pct: Math.round(s.sink.h * 100) } : null; },
      line: d => `Fins are out and she is dumping fast, sink at ${d.pct} percent! I can pull them in at a quarter, so we stop shining sooner but keep that heat, or drain her all the way. Your call, Captain.`,
      opts: O(['Pull in at a quarter', 'ab_fins_quarter'], ['Drain fully', 'ab_fins_drain']), def: 1, cost: 'a longer shine, but an empty sink',
      run: { ab_fins_quarter: (x, st) => { st.finsAt = 0.25; return true; }, ab_fins_drain: (x, st) => { st.finsAt = null; return true; } },
      tick: (x, st) => {   // standing order: retract the fins when the sink falls to the chosen level
        if (st.finsAt == null) return [];
        const s = x.s; if (!s.vent.on) { st.finsAt = null; return []; }
        if (!s.vent.forced && s.sink.h <= st.finsAt && x.E.stopVent(s)) { st.finsAt = null; return [{ officer: 'Dace', text: 'Quarter left in the sink. Fins in, Captain, and we are dimming already.' }]; }
        return [];
      } },
    { id: 'AB2', st: 'weapons', after: ['fire'], once: 'hunt', to: 20,
      when: x => { const cap = x.E.capOf && x.E.capOf(x.s), hot = cap ? cap.t.filter((u, i) => x.E.tubeKind(x.s, i) === 'msl' && u.q >= 0.999).length : 0; return hot >= 1 ? { hot } : null; },
      line: d => `Salvo away. ${d.hot === 1 ? 'One tube is' : word(d.hot) + ' tubes are'} still charged, and that is not free. Bleed ${d.hot === 1 ? 'it' : 'them'}, or hold for a follow-up, Captain?`,
      opts: O(['Bleed them', 'ab_bleed'], ['Keep them hot', 'ab_keep']), def: 1, cost: 'hot tubes keep our EM signature up',
      run: { ab_bleed: x => x.E.setCharge(x.s, false) !== false, ab_keep: () => true } },
    { id: 'AB3', st: 'sensors', after: ['ping'], once: 'hunt', to: 20,
      when: x => { const s = x.s; return !s.vent.on && s.t >= s.quietCd && s.t >= s.quietUntil ? {} : null; },
      line: () => 'That ping is out, Captain, and everyone listening heard it. I can go quiet now and let the glow settle, or stay loud and work the fix while it is fresh.',
      opts: O(['Go quiet', 'ab_quiet'], ['Stay loud', 'ab_loud']), def: 1, cost: 'a longer glow',
      run: { ab_quiet: x => x.E.goQuiet(x.s), ab_loud: () => true } },
    { id: 'AB4', st: 'helm', after: ['route'], once: 'hunt', to: 25,
      when: x => { const pts = (x.d && x.d.pts) || [], pi = pts.length && x.E.previewRoute ? x.E.previewRoute(x.s, pts) : null; return pi && pi.peakG > x.s.me.gStrain ? { g: (+pi.peakG).toFixed(1).replace(/\.0$/, '') } : null; },   // a fresh preview: the live plan is rebuilt on the next tick
      line: d => `That plan peaks at ${d.g} g, over the strain line. I will call each flip five seconds out. Shall the crew brace on my call, or will you call the brace, Captain?`,
      opts: O(['Crew brace on my call', 'ab_flip_auto'], ['I will call the brace', 'ab_flip_manual']), def: ctx => ctx.doctrine.flipBrace === 'manual' ? 1 : 0, cost: 'on my call the crew leave their hands-on controls for the flip; if you call it yourself and are late, they take the load unbraced',
      run: { ab_flip_auto: x => { x.M.setDoctrine({ flipBrace: 'auto' }); return true; }, ab_flip_manual: x => { x.M.setDoctrine({ flipBrace: 'manual' }); return true; } } },
    { id: 'AB5', st: 'sensors', after: ['classify'], once: 'contact', to: 25,
      when: x => {
        const a = x.id != null ? x.s.an[x.id] : null; if (!a) return null;
        let p = 0; try { const cl = x.E.classify(x.s, a); p = cl && cl.post ? Math.max(cl.post.real, cl.post.lure, cl.post.ghost) : 0; } catch (e) { return null; }
        return p >= 0.6 && p < 0.9 ? { n: a.id + 1, id: a.id, pct: Math.round(p * 100) } : null;
      },
      line: d => `${sierra(d.n)} reads as probable, not firm, Captain. About ${d.pct} percent. I can take another rescan for a firm call, or you can work with what we have.`,
      opts: O(['Rescan', 'rescan'], ['Work with it', 'ab_accept']), def: 1, cost: 'a probable call can be wrong',
      run: { ab_accept: () => true } }   // 'rescan' is the ordinary rescan verb, which the adapter already runs
  ];

  // register the rows with the station model so the call deck, the expiry and Wait all work unchanged
  for (const D of DEFS) ST.ROWS[D.id] = { st: D.st, pri: 2, open: true, noBucket: true, to: D.to, line: d => d.line, opts: D.opts, def: D.def, cost: D.cost };
  const BY_ROW = {}; for (const D of DEFS) BY_ROW[D.id] = D;
  const VERB = {}; for (const D of DEFS) for (const v in D.run) VERB[v] = D;

  function create() {
    const st = { fired: {}, finsAt: null };   // st.fired: once-per-hunt / once-per-contact guard; st.finsAt: the standing fins order
    return {
      st,
      check(x) {
        const out = [];
        for (const D of DEFS) {
          if (!D.after.includes(x.verb)) continue;
          const key = D.once === 'contact' ? D.id + ':' + (x.id != null ? x.id : '') : D.id;
          if (st.fired[key]) continue;
          let d = null; try { d = D.when(x); } catch (e) { d = null; }
          if (!d) continue;
          st.fired[key] = true; d.line = D.line(d); out.push({ row: D.id, data: d });
        }
        return out;
      },
      run(verb, x) { const D = VERB[verb]; if (!D) return null; try { return D.run[verb](x, st) !== false; } catch (e) { return false; } },
      tick(x) { const out = []; for (const D of DEFS) if (D.tick) { try { out.push(...D.tick(x, st)); } catch (e) {} } return out; }
    };
  }
  const API = { create, DEFS, BY_ROW, VERB };
  root.Answerbacks = API; if (typeof module !== 'undefined') module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
