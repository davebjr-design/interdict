/* Storylet picker and player (docs/generative_pipeline.md). No DOM, no network, no clock: every choice is a pure function of
 * (storylet data, game state, ctx, seed, history), so a seed plus the same inputs replays the same game and tests can pin it.
 *
 *   const P = Storylets.create({ storylets, defaults, seed: 7 });           // storylets: array of data/narrative/storylets/*.json entries
 *   const play = P.pick({ kind: 'banter', speaker: 'abara', station: 'control' }, state);   // null when nothing is eligible
 *   P.commit(play, state);                                                  // record use (cooldowns, recency, once, group)
 *   const s = P.start(play, state);                                         // step through lines and choices:
 *   for (let st = s.next(); !st.done; st = s.next()) { say(st.lines); if (st.choices) s.choose(ui(st.choices)); }
 *   Storylets.applyEffects(state, play.effects.concat(s.effects), play.id, defs);   // the engine owns state; this is the one writer
 *
 * ctx: { kind, speaker, station, trigger, leg, now, avoidSpeakers[], salt }.   state: flat dotted keys ({'trust.abara': 40}) or nested
 * objects ({trust:{abara:40}, seen:{'shakedown.debrief': true}}); missing names fall back to `defaults`, then to false/0.
 * Condition grammar and semantics mirror tools/storylet_lib.py (shared vectors in tests/storylet_conditions.json).
 */
(function (root) {
  'use strict';

  // ------------------------------------------------------------------ conditions
  const TOK = /\s*(?:(==|!=|>=|<=|>|<|=)|(-?\d+)(?![\w.])|("[^"]*")|([A-Za-z_][\w.]*)|([(),!]))/y;
  const cache = new Map();

  function tokenize(src) {
    const out = []; TOK.lastIndex = 0; let pos = 0; const s = String(src).trim();
    while (pos < s.length) {
      TOK.lastIndex = pos; const m = TOK.exec(s);
      if (!m) throw new Error('cannot read condition: ' + src);
      pos = TOK.lastIndex;
      if (m[1]) out.push(['op', m[1]]); else if (m[2] !== undefined) out.push(['num', m[2]]); else if (m[3]) out.push(['str', m[3]]);
      else if (m[4]) out.push([m[4] === 'and' || m[4] === 'or' || m[4] === 'not' ? 'kw' : 'name', m[4]]); else out.push(['p', m[5]]);
    }
    return out;
  }

  function parse(src) {
    if (src == null || !String(src).trim()) return { t: 'true' };
    const key = String(src); if (cache.has(key)) return cache.get(key);
    const toks = tokenize(key); let i = 0;
    const peek = () => toks[i] || [null, null];
    const eat = () => toks[i++];
    const isP = (v) => peek()[0] === 'p' && peek()[1] === v;
    const isK = (v) => peek()[0] === 'kw' && peek()[1] === v;
    function pOr() { const a = [pAnd()]; while (isK('or')) { eat(); a.push(pAnd()); } return a.length === 1 ? a[0] : { t: 'or', a }; }
    function pAnd() { const a = [pNot()]; while (isK('and') || isP(',')) { eat(); a.push(pNot()); } return a.length === 1 ? a[0] : { t: 'and', a }; }
    function pNot() { if (isK('not') || isP('!')) { eat(); return { t: 'not', x: pNot() }; } return pAtom(); }
    function pAtom() {
      if (isP('(')) { eat(); const e = pOr(); if (!isP(')')) throw new Error('missing ) in ' + key); eat(); return e; }
      const [k, v] = peek(); if (k !== 'name') throw new Error('expected a name in ' + key + ', got ' + v);
      eat(); const name = v;
      if (peek()[0] === 'op') {
        const op = eat()[1] === '=' ? '==' : toks[i - 1][1]; const [k3, v3] = peek();
        if (k3 === 'num') { eat(); return { t: 'cmp', name, op, val: parseInt(v3, 10), vk: 'int' }; }
        if (k3 === 'str') { eat(); return { t: 'cmp', name, op, val: v3.slice(1, -1), vk: 'str' }; }
        if (k3 === 'name') { eat(); return { t: 'cmp', name, op, val: v3, vk: 'name' }; }
        throw new Error('expected a value in ' + key);
      }
      return { t: 'cmp', name, op: null, val: null, vk: null };
    }
    const ast = pOr(); if (i !== toks.length) throw new Error('unexpected ' + toks[i][1] + ' in ' + key);
    cache.set(key, ast); return ast;
  }

  const truthy = (v) => !(v === undefined || v === null || v === false || v === 0 || v === '' || v === 'unset');
  function num(v) {
    if (typeof v === 'boolean') return v ? 1 : 0; if (typeof v === 'number') return v;
    if (typeof v === 'string') { const m = /^(\d+):(\d+)$/.exec(v); if (m) return +m[1] * 60 + +m[2]; const f = parseFloat(v); return isNaN(f) ? 0 : f; }
    return 0;
  }
  function looseEq(a, b) {
    if (a === undefined || a === null) a = typeof b === 'boolean' ? false : typeof b === 'string' ? 'unset' : 0;
    if (typeof a === 'boolean' || typeof b === 'boolean') return truthy(a) === truthy(b);
    if (typeof a === 'number' && typeof b === 'number') return a === b;
    return String(a) === String(b);
  }
  function evalAst(n, get) {
    switch (n.t) {
      case 'true': return true;
      case 'and': return n.a.every((x) => evalAst(x, get));
      case 'or': return n.a.some((x) => evalAst(x, get));
      case 'not': return !evalAst(n.x, get);
    }
    const cur = get(n.name); if (n.op === null) return truthy(cur);
    let rhs = n.val; if (n.vk === 'name') { const o = get(n.val); rhs = (o !== undefined && o !== null) ? o : n.val; }
    if (typeof rhs === 'string' && /^-?\d+$/.test(rhs)) rhs = parseInt(rhs, 10);
    if (n.op === '==') return looseEq(cur, rhs); if (n.op === '!=') return !looseEq(cur, rhs);
    const a = num(cur), b = num(rhs);
    return n.op === '>=' ? a >= b : n.op === '<=' ? a <= b : n.op === '>' ? a > b : a < b;
  }
  function specificity(n) { return n.t === 'true' ? 0 : n.t === 'and' || n.t === 'or' ? n.a.reduce((s, x) => s + specificity(x), 0) : n.t === 'not' ? specificity(n.x) : 1; }
  function names(n, acc) { acc = acc || []; if (n.t === 'and' || n.t === 'or') n.a.forEach((x) => names(x, acc)); else if (n.t === 'not') names(n.x, acc); else if (n.t === 'cmp') acc.push(n.name); return acc; }

  // ------------------------------------------------------------------ state access
  /** get(name) over flat or nested state, falling back to defaults. */
  function makeGetter(state, defaults) {
    if (typeof state === 'function') return state;
    defaults = defaults || {};
    function walk(obj, path) {
      if (obj == null || typeof obj !== 'object') return undefined;
      if (Object.prototype.hasOwnProperty.call(obj, path)) return obj[path];
      const parts = path.split('.');
      for (let i = 1; i < parts.length; i++) {
        const head = parts.slice(0, i).join('.');
        if (Object.prototype.hasOwnProperty.call(obj, head) && obj[head] && typeof obj[head] === 'object') { const r = walk(obj[head], parts.slice(i).join('.')); if (r !== undefined) return r; }
      }
      return undefined;
    }
    return (name) => { const v = walk(state, name); if (v !== undefined) return v; if (name in defaults) return defaults[name]; return undefined; };
  }

  function writeState(state, name, value) {
    if (Object.prototype.hasOwnProperty.call(state, name) || !name.includes('.')) { state[name] = value; return; }
    const parts = name.split('.');
    for (let i = parts.length - 1; i >= 1; i--) {   // prefer an existing nested container (state.seen['x.y'], state.trust.abara)
      const head = parts.slice(0, i).join('.');
      if (state[head] && typeof state[head] === 'object') { state[head][parts.slice(i).join('.')] = value; return; }
    }
    state[name] = value;
  }

  // ------------------------------------------------------------------ rng
  function hash32(str) { let h = 2166136261 >>> 0; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h >>> 0; }
  function mulberry32(a) { return function () { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  // ------------------------------------------------------------------ text
  const ONES = 'zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen'.split(' ');
  const TENS = { 2: 'twenty', 3: 'thirty', 4: 'forty', 5: 'fifty' };
  const w = (x) => (x < 20 ? ONES[x] : TENS[Math.floor(x / 10)] + (x % 10 ? '-' + ONES[x % 10] : ''));
  /** '22:13' -> 'twenty-two-thirteen' (hour words, 'oh-' under ten, 'hundred' on the hour); same as tools/narr_check.py. */
  function spokenTime(hm) {
    const m = /^(\d+):(\d+)$/.exec(String(hm)); if (!m) return String(hm);
    const h = +m[1], mi = +m[2];
    return w(h) + (mi === 0 ? ' hundred' : mi < 10 ? '-oh-' + ONES[mi] : '-' + w(mi));
  }
  function renderText(text, get, warn) {
    return String(text).replace(/\{([^}]+)\}/g, (all, tok) => {
      const spoken = /\.spoken$/.test(tok); const name = spoken ? tok.slice(0, -7) : tok;
      let v = get(name);
      if (v === undefined || v === null || v === '' || v === 'unset') { if (name === 'pell.nick') return 'Captain'; if (warn) warn('token ' + tok + ' has no value'); return ''; }
      return spoken ? spokenTime(v) : String(v);
    });
  }

  // ------------------------------------------------------------------ effects
  /** Parse 'trust.abara+=3' | 'logs=opened' | 'seen.x' | 'play:scene.id'. */
  function parseEffect(s) {
    s = String(s).trim();
    if (s.startsWith('play:')) return { name: 'play', op: ':', val: s.slice(5).trim() };
    const m = /^([A-Za-z_][\w.]*)\s*(?:(\+=|-=|=)\s*("[^"]*"|-?\w[\w.]*))?$/.exec(s);
    if (!m) throw new Error('cannot read effect ' + s);
    if (!m[2]) return { name: m[1], op: '=', val: true };
    let v = m[3]; if (v[0] === '"') v = v.slice(1, -1); else if (/^-?\d+$/.test(v)) v = parseInt(v, 10); else if (v === 'true') v = true; else if (v === 'false') v = false;
    return { name: m[1], op: m[2], val: v };
  }
  /** The one writer: applies effects to a flat-or-nested state with clamping from `defs` (state.json vars). Returns a change log
   * [{id, name, from, to}] (the state model says every change is logged with its storylet id). play: effects are returned in `.play`. */
  function applyEffects(state, effects, sourceId, defs, defaults) {
    const get = makeGetter(state, defaults); const log = []; const play = [];
    for (const e of effects || []) {
      const p = parseEffect(e);
      if (p.name === 'play') { play.push(p.val); continue; }
      const def = defs && defs[p.name]; const cur = get(p.name); let nv = p.val;
      if (p.op === '+=' || p.op === '-=') { const base = typeof cur === 'number' ? cur : 0; nv = base + (p.op === '+=' ? p.val : -p.val); }
      if (def && def.type === 'int') { if (def.oneway && typeof cur === 'number' && nv < cur) nv = cur; if (def.min !== undefined) nv = Math.max(def.min, nv); if (def.max !== undefined) nv = Math.min(def.max, nv); }
      if (nv !== cur) { writeState(state, p.name, nv); log.push({ id: sourceId, name: p.name, from: cur === undefined ? null : cur, to: nv }); }
    }
    log.play = play; return log;
  }

  // ------------------------------------------------------------------ picker
  const DEFAULTS = {
    statuses: ['approved', 'draft'],   // rejected is never played
    priorityBand: 12,                   // hard kinds (call, vig, pitch): only candidates within this many points of the best priority compete
    hardKinds: ['call', 'vig', 'pitch'],
    priorityHalfLife: 14,               // soft kinds (banter, chatter, react, dress): weight halves for every this many points below the best
    specBonus: 0.15,                    // weight multiplier per condition term (most specific line wins more often)
    noveltyBoost: 1.5,                  // never-used storylets are favoured
    recencyHorizon: 12,                 // picks until a used storylet is back at full weight
    recencyFloor: 0.25,
    noRepeatWindow: 4,                  // last N picks for the same (kind, speaker, station) are excluded (relaxed if nothing else is left)
    groupWindow: 6,                     // picks (across the picker) before another storylet of the same group may play
    maxSpeakerRun: 2,                   // same speaker this many times in a row for a kind: heavy penalty
    speakerRunPenalty: 0.2,
    avoidPenalty: 0.15,                 // ctx.avoidSpeakers
    allowRepeatFallback: true
  };

  function create(opts) {
    const cfg = Object.assign({}, DEFAULTS, opts.config || {});
    const defaults = opts.defaults || {}; const defs = opts.defs || null;
    const seed = (opts.seed === undefined ? 1 : opts.seed) >>> 0;
    const pool = (opts.storylets || []).filter((s) => cfg.statuses.indexOf(s.status || 'draft') >= 0);
    const byId = new Map(pool.map((s) => [s.id, s]));
    let H = { pickCount: 0, uses: {}, groupLast: {}, recent: {}, lastSpeaker: {} };
    if (opts.history) H = JSON.parse(JSON.stringify(opts.history));
    const keyOf = (ctx) => [ctx.kind || '*', ctx.speaker || '*', ctx.station || '*'].join('|');
    const needsAst = (s) => parse(s.needs);

    function eligible(s, ctx, get, leg, relax) {
      if (ctx.kind && s.kind !== ctx.kind) return false;
      if (ctx.speaker && s.speaker !== ctx.speaker) return false;
      if (ctx.station && s.station && s.station !== 'any' && s.station !== ctx.station) return false;
      if (ctx.trigger && s.trigger !== ctx.trigger) return false;
      if (ctx.id && s.id !== ctx.id) return false;
      if (!evalAst(needsAst(s), get)) return false;
      const u = H.uses[s.id];
      if (s.once && u && u.n > 0) return false;
      if (u && s.cooldown_legs && leg !== undefined && u.lastLeg !== undefined && leg - u.lastLeg < s.cooldown_legs) return false;
      if (u && s.cooldown_s && ctx.now !== undefined && u.lastAt !== undefined && ctx.now - u.lastAt < s.cooldown_s * 1000) return false;
      if (s.group && H.groupLast[s.group] !== undefined && H.pickCount - H.groupLast[s.group] <= cfg.groupWindow) return false;
      if (s.variants && s.variants.length === 0 && !s.lines) return false;
      return true;
    }

    /** All eligible storylets with weights and reasons, best first. Pure: does not record anything. */
    function candidates(ctx, state) {
      ctx = ctx || {}; const get = makeGetter(state, defaults);
      const leg = ctx.leg !== undefined ? ctx.leg : (typeof get('leg') === 'number' ? get('leg') : undefined);
      let el = pool.filter((s) => eligible(s, ctx, get, leg)).sort((a, b) => (a.id < b.id ? -1 : 1));
      const key = keyOf(ctx); const recent = H.recent[key] || [];
      let note = '';
      if (cfg.noRepeatWindow > 0 && recent.length) {
        const win = recent.slice(-cfg.noRepeatWindow); const fresh = el.filter((s) => win.indexOf(s.id) < 0);
        if (fresh.length) el = fresh;
        else if (cfg.allowRepeatFallback) { const last = recent[recent.length - 1]; const f2 = el.filter((s) => s.id !== last); if (f2.length) el = f2; note = 'window relaxed'; }
        else el = [];
      }
      if (!el.length) return [];
      const prio = (s) => (s.priority === undefined ? 50 : s.priority);
      const isHard = (s) => cfg.hardKinds.indexOf(s.kind) >= 0;
      const top = Math.max.apply(null, el.map(prio));
      el = el.filter((s) => !isHard(s) || prio(s) >= top - cfg.priorityBand);
      const avoid = ctx.avoidSpeakers || [];
      const ls = H.lastSpeaker[ctx.kind || '*'];
      return el.map((s) => {
        let wt = s.weight === undefined ? 1 : s.weight; const why = [];
        if (!isHard(s) && prio(s) < top) { wt *= Math.pow(2, (prio(s) - top) / cfg.priorityHalfLife); why.push('prio' + (prio(s) - top)); }
        const spec = specificity(needsAst(s)); if (spec) { wt *= 1 + cfg.specBonus * spec; why.push('spec' + spec); }
        const u = H.uses[s.id];
        if (!u) { wt *= cfg.noveltyBoost; why.push('new'); }
        else { const since = H.pickCount - u.lastPick; const f = Math.min(1, cfg.recencyFloor + (1 - cfg.recencyFloor) * since / cfg.recencyHorizon); wt *= f; why.push('recency' + f.toFixed(2)); }
        if (avoid.indexOf(s.speaker) >= 0) { wt *= cfg.avoidPenalty; why.push('avoid'); }
        if (ls && ls.speaker === s.speaker && ls.run >= cfg.maxSpeakerRun) { wt *= cfg.speakerRunPenalty; why.push('run'); }
        return { storylet: s, weight: wt, why: why.join(','), note };
      }).sort((a, b) => b.weight - a.weight || (a.storylet.id < b.storylet.id ? -1 : 1));
    }

    function pick(ctx, state) {
      ctx = ctx || {}; const c = candidates(ctx, state); if (!c.length) return null;
      const rng = mulberry32(hash32(String(seed) + '|' + (ctx.salt === undefined ? H.pickCount : ctx.salt) + '|' + keyOf(ctx)));
      const total = c.reduce((s, x) => s + x.weight, 0); let r = rng() * total, chosen = c[c.length - 1];
      for (const x of c) { r -= x.weight; if (r <= 0) { chosen = x; break; } }
      return build(chosen.storylet, ctx, state, rng, { considered: c.length, weight: chosen.weight, why: chosen.why, note: chosen.note });
    }

    function build(s, ctx, state, rng, trace) {
      const get = makeGetter(state, defaults);
      let lines = s.lines, effects = (s.effects || []).slice(), variant = -1;
      if (s.variants && s.variants.length) {   // the most specific matching variant replaces the base lines; ties by rng
        let best = [], bs = -1;
        s.variants.forEach((v, i) => { if (evalAst(parse(v.needs), get)) { const sp = specificity(parse(v.needs)); if (sp > bs) { bs = sp; best = [i]; } else if (sp === bs) best.push(i); } });
        if (best.length) { variant = best[Math.floor(rng() * best.length)]; lines = s.variants[variant].lines; effects = effects.concat(s.variants[variant].effects || []); }
      }
      if (!lines) return null;
      const warns = []; const warn = (m) => warns.push(m);
      const out = { id: s.id, kind: s.kind, speaker: s.speaker, station: s.station, storylet: s, variant, lines: renderLines(lines, get, warn), effects: autoSeen(s, effects), trace: Object.assign({ warnings: warns }, trace), ctx };
      return out;
    }
    const autoSeen = (s, effects) => (s.autoseen === false ? effects : effects.concat(['seen.' + s.id]));
    function renderLines(lines, get, warn) {
      return (lines || []).filter((l) => evalAst(parse(l.needs), get)).map((l) => ({ who: l.who, text: renderText(l.text, get, warn) }));
    }

    function commit(play, state) {
      if (!play) return null; const s = play.storylet; const get = makeGetter(state, defaults); const ctx = play.ctx || {};
      const leg = ctx.leg !== undefined ? ctx.leg : (typeof get('leg') === 'number' ? get('leg') : undefined);
      const u = H.uses[s.id] || { n: 0 }; u.n++; u.lastPick = H.pickCount; if (leg !== undefined) u.lastLeg = leg; if (ctx.now !== undefined) u.lastAt = ctx.now; H.uses[s.id] = u;
      if (s.group) H.groupLast[s.group] = H.pickCount;
      const key = keyOf(ctx); (H.recent[key] = H.recent[key] || []).push(s.id); if (H.recent[key].length > 32) H.recent[key].shift();
      const kk = ctx.kind || '*'; const ls = H.lastSpeaker[kk]; H.lastSpeaker[kk] = { speaker: s.speaker, run: ls && ls.speaker === s.speaker ? ls.run + 1 : 1 };
      H.pickCount++; return play;
    }

    /** pick + commit in one call (what a banter hook usually wants). */
    function take(ctx, state) { const p = pick(ctx, state); return p ? commit(p, state) : null; }

    // ---- stepping through a storylet: lines, choices, gathers (`after`) ----
    function start(play, state) {
      const get = makeGetter(state, defaults); const rng = mulberry32(hash32(seed + '|session|' + play.id + '|' + H.pickCount));
      const stack = []; let pending = null; let first = true; const allEffects = [];
      function enter(node, isRoot) {
        if (node.after) stack.push(node.after);
        const lines = isRoot ? play.lines : renderLines(node.lines, get, null);
        const eff = isRoot ? [] : (node.effects || []).slice(); allEffects.push.apply(allEffects, eff);
        const ch = (node.choices || []).map((c, i) => ({ c, i })).filter((x) => evalAst(parse(x.c.needs), get));
        pending = ch.length ? ch : null;
        return { lines, effects: eff, choices: pending ? pending.map((x, k) => ({ index: k, label: x.c.label })) : null, done: false };
      }
      let cur = null;
      return {
        effects: allEffects,
        next() {
          if (first) { first = false; cur = enter(play.storylet, true); return cur; }
          if (pending) throw new Error('choose() before next(): ' + play.id + ' is waiting on a choice');
          if (stack.length) { cur = enter(stack.pop(), false); return cur; }
          return { lines: [], effects: [], choices: null, done: true };
        },
        choose(k) {
          if (!pending || !pending[k]) throw new Error('no such choice ' + k + ' in ' + play.id);
          const node = pending[k].c; pending = null; cur = enter(node, false); return cur;
        }
      };
    }

    /** Run a whole storylet with a chooser (tests, bots, previews). chooser(choices, step) -> index. Returns the transcript. */
    function autoplay(play, state, chooser) {
      const s = start(play, state); const lines = [], picked = []; let st = s.next();
      for (let guard = 0; guard < 200; guard++) {
        lines.push.apply(lines, st.lines);
        if (st.done) break;
        if (st.choices) { const k = chooser ? chooser(st.choices, st) : 0; picked.push(st.choices[k].label); st = s.choose(k); } else st = s.next();
      }
      return { lines, picked, effects: play.effects.concat(s.effects) };
    }

    return {
      pick, take, commit, candidates, start, autoplay, byId: (id) => byId.get(id), size: () => pool.length,
      save: () => JSON.parse(JSON.stringify(H)), restore: (h) => { H = JSON.parse(JSON.stringify(h)); },
      count: () => H.pickCount, uses: (id) => (H.uses[id] ? H.uses[id].n : 0), config: cfg
    };
  }

  /** Build a picker from the generated bundle (web/storylets_data.js: {storylets, defaults, defs}). */
  function fromBundle(b, opts) { return create(Object.assign({ storylets: b.storylets, defaults: b.defaults, defs: b.defs }, opts || {})); }

  const API = { create, fromBundle, parse, evalAst, specificity, names, makeGetter, applyEffects, parseEffect, renderText, spokenTime, mulberry32, hash32, truthy,
    evalCond: (src, state, defaults) => evalAst(parse(src), makeGetter(state, defaults)), DEFAULTS };
  root.Storylets = API; if (typeof module !== 'undefined') module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
