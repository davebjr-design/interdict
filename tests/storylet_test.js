// Storylet picker tests (web/storylets.js) against the real batch in data/narrative/storylets. Run: node tests/storylet_test.js
const fs = require('fs'), path = require('path');
let fails = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };
const S = require('../web/storylets.js');
const ROOT = path.join(__dirname, '..'), SL = path.join(ROOT, 'data', 'narrative', 'storylets');
const state = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'narrative', 'state.json'), 'utf8'));
const defaults = {}, defs = {}; for (const k in state.vars) { const v = state.vars[k]; if ('default' in v) defaults[k] = v.default; defs[k] = v; }
const all = []; for (const f of fs.readdirSync(SL).filter((f) => f.endsWith('.json') && f[0] !== '_')) all.push(...JSON.parse(fs.readFileSync(path.join(SL, f), 'utf8')).storylets);
const live = all.filter((s) => (s.status || 'draft') !== 'rejected');
const mk = (extra, list) => S.create(Object.assign({ storylets: list || live, defaults, defs, seed: 11 }, extra || {}));
const clone = (o) => JSON.parse(JSON.stringify(o));

// ---- 1. shared condition vectors (the Python side runs the same file)
const V = JSON.parse(fs.readFileSync(path.join(__dirname, 'storylet_conditions.json'), 'utf8'));
let bad = 0;
for (const r of V.eval) { const got = S.evalCond(r.expr, r.state); if (got !== r.expect) { bad++; console.log('  vector', JSON.stringify(r.expr), JSON.stringify(r.state), '->', got); } }
for (const e of V.errors) { try { S.parse(e); bad++; console.log('  should not parse:', e); } catch (x) { /* expected */ } }
ok(bad === 0, 'shared condition vectors (' + (V.eval.length + V.errors.length) + ')');

// ---- 2. data sanity
ok(live.length >= 100, 'batch loaded: ' + live.length + ' storylets');
let parseFail = 0; for (const s of live) { try { S.parse(s.needs); (s.variants || []).forEach((v) => S.parse(v.needs)); } catch (e) { parseFail++; console.log('  ', s.id, e.message); } }
ok(parseFail === 0, 'every needs expression parses');
let bundleCount = null; try { bundleCount = require('../web/storylets_data.js').count; } catch (e) { /* not generated */ }
ok(bundleCount === live.length, 'web/storylets_data.js is in sync (run tools/storylet_bundle.py): ' + bundleCount + ' vs ' + live.length);

// ---- helper worlds
const W = (extra) => Object.assign({ act: 1, leg: 2, hunts: 2, corvane: 'killed', murdered: false, ames: 'wounded', quiet_hour: 'kept_captain', 'command.band': 'neutral', 'trust.abara': 40, 'trust.quill': 40, 'trust.dace': 40, 'trust.castellan': 50, 'trust.fenwick': 55, 'pell.trust': 40, 'seen.shakedown.debrief': true, 'knows.decoy_turned': true, 'last_hunt.hull': 50 }, extra || {});

// ---- 3. determinism
function run(seed, st, n, ctx) { const P = mk({ seed }); const ids = []; for (let i = 0; i < n; i++) { const p = P.take(ctx, st); ids.push(p ? p.id : null); } return ids; }
const ctxA = { kind: 'banter', speaker: 'abara', station: 'control' };
ok(run(5, W(), 14, ctxA).join() === run(5, W(), 14, ctxA).join(), 'same seed, same state, same sequence');
ok(run(5, W(), 14, ctxA).join() !== run(6, W(), 14, ctxA).join(), 'a different seed gives a different sequence');

// ---- 4. preconditions
{
  const P = mk(); const ids = (st, ctx) => P.candidates(ctx, st).map((c) => c.storylet.id);
  ok(!ids(W({ murdered: false }), ctxA).includes('banter.abara.control.guest_ate'), 'persuaded-only line is not eligible on the killed route');
  ok(ids(W({ corvane: 'persuaded', ames: 'dead' }), ctxA).includes('banter.abara.control.guest_ate'), '... and is on the persuaded route');
  ok(!ids(W({ 'command.band': 'neutral' }), ctxA).includes('banter.abara.control.tight_ship'), 'tight-ship line needs a tight band');
  ok(ids(W({ 'command.band': 'very_tight' }), ctxA).includes('banter.abara.control.tight_ship'), '... and fires on very_tight');
  // ambient kinds: priority is a soft weight, so specific lines are favoured but universals stay in rotation
  const st = W({ 'trust.abara': 70 }); const c = P.candidates(ctxA, st);
  const wOf = (id) => (c.find((x) => x.storylet.id === id) || {}).weight;
  ok(c.length >= 6 && wOf('banter.abara.control.kid_slip') > wOf('banter.abara.control.drawers'), 'soft priority: a specific line outweighs a universal, and the universal is still a candidate');
  // hard kinds: a call far below the best eligible call sits out
  const hard = S.create({ seed: 1, storylets: [
    { id: 'call.t.hi', kind: 'call', speaker: 't', priority: 80, lines: [{ who: 't', text: 'High.' }] },
    { id: 'call.t.lo', kind: 'call', speaker: 't', priority: 40, lines: [{ who: 't', text: 'Low.' }] }] });
  ok(hard.candidates({ kind: 'call', speaker: 't' }, {}).map((x) => x.storylet.id).join() === 'call.t.hi', 'priority band: hard kinds drop calls far below the best');
  ok(P.candidates({ kind: 'banter', speaker: 'abara', station: 'thermal' }, st).length === 0, 'station filter: Abara has nothing in the thermal bay');
  ok(P.candidates({ kind: 'call', speaker: 'pell' }, W({ corvane: 'killed', logs: 'sealed' })).some((x) => x.storylet.id === 'call.pell.logs'), 'call.pell.logs eligible: killed, logs sealed');
  ok(!P.candidates({ kind: 'call', speaker: 'pell' }, W({ corvane: 'killed', logs: 'opened' })).some((x) => x.storylet.id === 'call.pell.logs'), '... not once the logs are opened');
  ok(!P.candidates({ kind: 'call', speaker: 'pell' }, W({ corvane: 'persuaded', logs: 'sealed' })).some((x) => x.storylet.id === 'call.pell.logs'), '... and never on the persuaded route');
  ok(P.candidates({ kind: 'call', speaker: 'pell' }, W({ quiet_hour: 'ended' })).some((x) => x.storylet.id === 'call.pell.quiet_hour'), 'call.pell.quiet_hour eligible on the ended route');
  ok(!P.candidates({ kind: 'call', speaker: 'pell' }, W({ quiet_hour: 'ended', murdered: true })).some((x) => x.storylet.id === 'call.pell.quiet_hour'), '... not on the murder route');
  ok(!P.candidates({ kind: 'call', speaker: 'pell' }, W({ quiet_hour: 'ended', 'seen.call.pell.quiet_hour': true })).some((x) => x.storylet.id === 'call.pell.quiet_hour'), '... and stops once the hour was granted');
}

// ---- 5. once, cooldown, groups, no-repeat window
{
  const toy = [
    { id: 'banter.x.control.a', kind: 'banter', speaker: 'x', station: 'control', priority: 50, once: true, lines: [{ who: 'x', text: 'A.' }] },
    { id: 'banter.x.control.b', kind: 'banter', speaker: 'x', station: 'control', priority: 50, cooldown_legs: 2, lines: [{ who: 'x', text: 'B.' }] },
    { id: 'banter.x.control.c', kind: 'banter', speaker: 'x', station: 'control', priority: 50, group: 'g', lines: [{ who: 'x', text: 'C.' }] },
    { id: 'banter.x.control.d', kind: 'banter', speaker: 'x', station: 'control', priority: 50, group: 'g', lines: [{ who: 'x', text: 'D.' }] }];
  const P = S.create({ storylets: toy, seed: 3, config: { noRepeatWindow: 0 } }); const ctx = { kind: 'banter', speaker: 'x', station: 'control' };
  const a = S.create({ storylets: [toy[0]], seed: 1 }); a.take(ctx, {}); ok(a.pick(ctx, {}) === null, 'once: never again after the first play');
  const b = S.create({ storylets: [toy[1]], seed: 1, config: { noRepeatWindow: 0 } });
  b.take(Object.assign({ leg: 1 }, ctx), { leg: 1 }); ok(b.pick(Object.assign({ leg: 2 }, ctx), { leg: 2 }) === null, 'cooldown_legs: blocked one leg later');
  ok(b.pick(Object.assign({ leg: 3 }, ctx), { leg: 3 }) !== null, '... allowed two legs later');
  const g = S.create({ storylets: [toy[2], toy[3]], seed: 1, config: { noRepeatWindow: 0 } }); g.take(ctx, {});
  ok(g.pick(ctx, {}) === null, 'group: the other member of the group waits out the window');
  // no-repeat window on the real data: Abara's control banter never repeats inside the window
  const Q = mk({ seed: 21 }); const seq = []; let rep = 0;
  for (let i = 0; i < 60; i++) { const p = Q.take(ctxA, W()); if (!p) break; if (seq.slice(-S.DEFAULTS.noRepeatWindow).includes(p.id)) rep++; seq.push(p.id); }
  ok(rep === 0, 'no-repeat window: no id repeats within ' + S.DEFAULTS.noRepeatWindow + ' visits over 60');
}

// ---- 6. variants, line needs, tokens
{
  const P = mk({ seed: 2 });
  const m = P.pick({ kind: 'banter', speaker: 'abara', station: 'control', id: 'banter.abara.control.drawers' }, W({ murdered: true }));
  ok(m && m.variant === 0 && m.lines.some((l) => /Anything else, Captain/.test(l.text)), 'murdered variant replaces the base lines');
  const n = P.pick({ kind: 'banter', speaker: 'abara', station: 'control', id: 'banter.abara.control.drawers' }, W());
  ok(n && n.variant === -1 && n.lines.length === 2, 'base lines otherwise');
  const nick = P.pick({ kind: 'banter', speaker: 'pell', station: 'control', id: 'banter.pell.control.status' }, W({ 'pell.nick': 'Captain Patience' }));
  ok(/Captain Patience\./.test(nick.lines[0].text), 'token {pell.nick} rendered from state');
  const nick2 = P.pick({ kind: 'banter', speaker: 'pell', station: 'control', id: 'banter.pell.control.status' }, W());
  ok(/Captain\./.test(nick2.lines[0].text) && nick2.trace.warnings.length === 0, '{pell.nick} falls back to "Captain" with no warning');
  ok(S.renderText('at {clock.decision.spoken}', S.makeGetter({ 'clock.decision': '22:13' })) === 'at twenty-two-thirteen', 'spoken time token');
  ok(S.spokenTime('22:08') === 'twenty-two-oh-eight' && S.spokenTime('22:00') === 'twenty-two hundred', 'spokenTime matches tools/narr_check.py');
}

// ---- 7. sessions: walk every path of every call, apply effects, no dead ends
{
  const calls = live.filter((s) => s.kind === 'call'); let paths = 0, throws = 0;
  function dfs(P, play, st, prefix) {
    // enumerate by replaying with a chooser that follows `prefix`, then branching one level beyond it
    const picks = []; let branchAt = null;
    const r = P.autoplay(play, clone(st), (choices, step) => { const k = picks.length < prefix.length ? prefix[picks.length] : 0; if (picks.length >= prefix.length && branchAt === null && choices.length > 1) branchAt = { depth: picks.length, n: choices.length }; picks.push(k); return k; });
    paths++; if (!r.lines.length) throws++;
    if (branchAt) for (let k = 1; k < branchAt.n; k++) dfs(P, play, st, picks.slice(0, branchAt.depth).concat([k]));
  }
  const worlds = [W({ corvane: 'persuaded', ames: 'dead', 'corvane.talked': false }), W({ corvane: 'killed', logs: 'sealed', 'clue.loyalist.0': false }), W({ corvane: 'killed', logs: 'deleted' }), W({ murdered: true, logs: 'sealed', quiet_hour: 'ended', 'player.background': 'unset' }), W({ quiet_hour: 'ended', 'player.background': 'unset', 'knows.unexplained_signals': true })];
  for (const c of calls) for (const w of worlds) { const P = mk({ seed: 1 }); const play = P.pick({ kind: 'call', id: c.id }, w); if (play) { try { dfs(P, play, w, []); } catch (e) { throws++; console.log('  ', c.id, e.message); } } }
  ok(paths >= 20 && throws === 0, 'every branch of the five return calls plays through (' + paths + ' paths, ' + throws + ' dead ends)');
  // effects land: take Corvane's cabin call, listen to everything, check state
  const st = W({ corvane: 'persuaded', ames: 'dead' }); const P = mk({ seed: 4 }); const play = P.pick({ kind: 'call', id: 'call.corvane.cabin' }, st);
  const run1 = P.autoplay(play, st, (ch) => ch.findIndex((c) => /listening|I'll tell her|Where is it|eleven minutes/.test(c.label)) >= 0 ? ch.findIndex((c) => /listening|I'll tell her|Where is it|eleven minutes/.test(c.label)) : 0);
  const log = S.applyEffects(st, run1.effects, play.id, defs, defaults);
  ok(st['corvane.talked'] === true && st['knows.quiet_hour_purpose'] === true && st['knows.station_walled_in_pell'] === true && st['knows.abara_grandfather_message'] === true, 'cabin call: the three facts land in state');
  ok(st['promise.abara_message'] === true && st['corvane.afraid'] === true && st['seen.call.corvane.cabin'] === true, 'cabin call: promise, fear and the seen flag land');
  ok(log.every((c) => c.id === 'call.corvane.cabin'), 'every state change is logged with its storylet id');
  const P2 = mk({ seed: 4 }); P2.commit(play, st);
  ok(P2.pick({ kind: 'call', id: 'call.corvane.cabin' }, st) === null, 'after listening, corvane.talked stops the call');
  // quiet-hour call: granting writes seen.call.pell.quiet_hour but declining does not
  const q = W({ quiet_hour: 'ended' }); const P3 = mk({ seed: 5 }); const qp = P3.pick({ kind: 'call', id: 'call.pell.quiet_hour' }, q);
  const decline = P3.autoplay(qp, clone(q), (ch) => ch.findIndex((c) => /Not tonight/.test(c.label)));
  ok(!qp.effects.includes('seen.call.pell.quiet_hour') && !decline.effects.includes('seen.call.pell.quiet_hour'), 'quiet-hour call: declining does not set the seen flag (autoseen false)');
  const grant = P3.autoplay(qp, clone(q), (ch) => ch.findIndex((c) => /One hour/.test(c.label)));
  ok(grant.effects.includes('seen.call.pell.quiet_hour') && grant.effects.includes('clue.pell.1'), '... granting does');
}

// ---- 8. applyEffects rules
{
  const st = { integration: 8, 'trust.abara': 98, seen: {}, trust: {} }; const d = { integration: { type: 'int', min: 0, max: 100, oneway: true }, 'trust.abara': { type: 'int', min: 0, max: 100 } };
  const l1 = S.applyEffects(st, ['integration+=5', 'integration-=20', 'trust.abara+=9', 'seen.x.y', 'play:aftermath.b1'], 't.id', d, {});
  ok(st.integration === 13, 'integration is one-way up'); ok(st['trust.abara'] === 100, 'clamped to the declared max');
  ok(st.seen['x.y'] === true, 'writes into an existing nested container'); ok(l1.play[0] === 'aftermath.b1', 'play: effects are handed back, not applied');
  ok(S.makeGetter({ trust: { abara: 7 }, seen: { 'shakedown.debrief': true } })('trust.abara') === 7 && S.makeGetter({ seen: { 'shakedown.debrief': true } })('seen.shakedown.debrief') === true, 'getter reads nested state');
}

// ---- 9. save and restore
{
  const P = mk({ seed: 8 }); const st = W(); for (let i = 0; i < 6; i++) P.take(ctxA, st);
  const snap = P.save(); const next = []; for (let i = 0; i < 5; i++) next.push(P.take(ctxA, st).id);
  const Q = mk({ seed: 8, history: snap }); const again = []; for (let i = 0; i < 5; i++) again.push(Q.take(ctxA, st).id);
  ok(next.join() === again.join(), 'restore(history) resumes the same sequence');
}

// ---- 10. calls: speaker run penalty and avoidSpeakers
{
  const P = mk({ seed: 3 }); const st = W({ corvane: 'killed', logs: 'sealed', quiet_hour: 'ended', 'player.background': 'unset' });
  const base = P.candidates({ kind: 'call' }, st); const avoid = P.candidates({ kind: 'call', avoidSpeakers: ['pell'] }, st);
  ok(base.length >= 3 && avoid[0].storylet.speaker !== 'pell' || avoid.every((x) => x.storylet.speaker === 'pell'), 'avoidSpeakers pushes the same-speaker call down');
}

// ---- 11. a walk demo: visit each officer's station through the first week, across the four routes
{
  const routes = { persuaded: { corvane: 'persuaded', ames: 'dead', murdered: false }, shot_early: { corvane: 'killed', ames: 'wounded', murdered: false }, shot_late: { corvane: 'killed', ames: 'dead', murdered: false }, murdered: { corvane: 'killed', ames: 'unharmed', murdered: true } };
  const homes = { abara: 'control', quill: 'control', dace: 'thermal', castellan: 'eng_upper', fenwick: 'mess', pell: 'control' };
  let minDistinct = 99, immediate = 0, worst = '';
  for (const rn in routes) for (const band of ['tight', 'neutral', 'loose']) {
    const P = mk({ seed: 42 }); const st = W(Object.assign({ 'command.band': band }, routes[rn]));
    for (const who in homes) { const seen = new Set(); let last = null;
      for (let v = 0; v < 10; v++) { st.leg = 1 + Math.floor(v / 2); const p = P.take({ kind: 'banter', speaker: who, station: homes[who] }, st); if (!p) { minDistinct = 0; worst = rn + '/' + band + '/' + who + ' empty'; break; } if (p.id === last) immediate++; last = p.id; seen.add(p.id); }
      if (seen.size < minDistinct) { minDistinct = seen.size; worst = rn + '/' + band + '/' + who; } }
  }
  ok(immediate === 0, 'walk demo: no officer ever repeats a line on back-to-back visits');
  ok(minDistinct >= 5, 'walk demo: every officer shows at least 5 different lines in 10 visits on every route and band (worst ' + minDistinct + ' at ' + worst + ')');
  // state-awareness: on the murder route the officers are terse, and Fenwick is the one who plates and stays standing
  const P = mk({ seed: 1 }); const st = W(Object.assign({ 'command.band': 'neutral' }, routes.murdered)); const lines = [];
  for (let v = 0; v < 8; v++) { const p = P.take({ kind: 'banter', speaker: 'fenwick', station: 'mess' }, st); lines.push(p.lines.map((l) => l.text).join(' ')); }
  ok(lines.some((t) => /stays standing|Soup\./.test(t) || /soup/i.test(t)), 'murder route: Fenwick\'s banter is the quiet, feeding kind');
}

console.log(fails ? 'FAILED' : 'ALL OK'); process.exit(fails ? 1 : 0);
