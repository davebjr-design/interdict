/* Hunt balance harness: scripted captains (sim/hunt_bots.js) play paired seeds against the real engine.
 *
 *   node sim/balance_hunt.js [--n 240] [--diff normal|easy|hard|all] [--entry standard|dark|fast|mix] [--bots steady,camper,...]
 *                            [--seed 9000] [--set player.missiles=6 --set warhead.he.w=60 ...] [--diag] [--json] [--workers 2]
 *   node sim/balance_hunt.js --dog [--n 200] [--sus 0.5]      dog-leg arenas: spool at once versus clear the contacts first
 *
 * Seeds are paired: hunt i uses seed (seed + i) and 1 + i % 3 warships for every bot, and with --entry mix the entry
 * (standard, dark, fast) cycles with i too. Only 'win' (every warship crippled) counts; a breach-drive escape, a death
 * and a timeout (90 game minutes) are losses. --set overrides engine constants for what-if runs:
 *   player.* / ai.* / rules.* (E.PLAYER, E.AI, E.RULES), warhead.he.w, hp.destroyer, diff.normal.punch.
 * Runs on child processes (default 2) and is deterministic for a given seed block. Used by docs/mechanics_balance.md. */
const path = require('path'), cp = require('child_process');
const E = require(process.env.HUNT_ENGINE || '../web/hunt_rt_engine.js'), B = require('./hunt_bots.js');   // HUNT_ENGINE=/path/to/frozen_engine.js runs a what-if against a snapshot
const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : d; };
const flag = k => argv.includes('--' + k);
const N = +opt('n', 240), DIFF = opt('diff', 'normal'), ENTRY = opt('entry', 'standard'), SEED = +opt('seed', 9000), WORKERS = +opt('workers', 2);
const BOTLIST = opt('bots', 'camper,pingfire,pinger,reader,steady,random').split(',');
const MAXT = 90, STEP = 0.1;
const SETS = argv.reduce((a, x, i) => (x === '--set' && argv[i + 1] ? a.concat(argv[i + 1]) : a), []);
const ROOTS = { player: E.PLAYER, ai: E.AI, rules: E.RULES, warhead: E.WARHEAD, hp: E.HPMAX, diff: E.DIFFICULTY };
function applySets(sets) {
  for (const kv of sets) { const [p, v] = kv.split('='), parts = p.split('.'); let o = ROOTS[parts[0]]; if (!o) throw new Error('bad --set root ' + p);
    if (p === 'hp.scale') { for (const k of Object.keys(E.HPMAX)) E.HPMAX[k] = Math.round(E.HPMAX[k] * +v); continue; }   // hp.scale=0.8 multiplies every class's hull points
    for (let i = 1; i < parts.length - 1; i++) o = o[parts[i]]; o[parts[parts.length - 1]] = isNaN(+v) ? v : +v; }
}
applySets(SETS);
const ENTRIES = ['standard', 'dark', 'fast'];
const entryFor = i => ENTRY === 'mix' ? ENTRIES[Math.floor(i / 3) % 3] : ENTRY;
const avg = xs => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;

function playHunt(bot, i, diff) {
  const nreal = 1 + (i % 3), seed = SEED + i, entry = entryFor(i);
  E.setDifficulty(diff);
  const s = E.newHunt(seed, { nreal, entry }), r = B.mkRand(seed * 7 + 3), mem = {}; let k = 0, vols = 0, conn = 0;
  while (!s.over && s.t < MAXT) {
    B.BOTS[bot](s, k++, r, mem); E.tick(s, STEP);
    for (const ev of s.events.splice(0)) if (ev.kind === 'ours' && ev.ammo === 'he') { vols++; const m = ev.res.find(q => q.main); if (m && m.n) conn++; }
  }
  const win = s.over === 'win', over = s.over || 'timeout';
  return { i, nreal, entry, win, over, hull: s.hull, t: s.t, kills: s.disabled || 0, shots: s.shots, vols, conn, magLeft: s.mag.total, heEmpty: s.mag.byKind.he <= 0, dead: s.hull <= 0 };
}
// dog-leg arenas: hunters present with chance sus. 'spool' presses the breach drive at once and weaves; 'clear' plays the steady bot, then spools when nothing is left.
function playDog(mode, i, diff, sus) {
  const seed = SEED + i, rp = B.mkRand(seed ^ 0x5bd1e995), plan = E.arenaPlan(rp, sus, 0);
  E.setDifficulty(diff);
  const s = E.newHunt(seed, { dog: true, nreal: plan.nreal, warn: plan.warn, entry: 'standard' }), r = B.mkRand(seed * 7 + 3), mem = {}; let k = 0, spooled = false;
  if (mode === 'spool') { E.retreat(s); E.setOrder(s, 'evade', null); E.setSpeed(s, 'v2'); }
  while (!s.over && s.t < 120) {
    if (mode === 'spool') { B.helpers.sinkCare(s, true); if (B.helpers.incoming(s) && s.speed !== 'v4') E.setSpeed(s, 'v4'); if (!s.spool && !s.over) E.retreat(s); }
    else { B.BOTS.steady(s, k++, r, mem); if (!spooled && !s.spool && s.nreal > 0 && s.disabled >= s.nreal) { E.retreat(s); spooled = true; } if (plan.nreal === 0 && !spooled && s.t > 6) { E.retreat(s); spooled = true; } if (s.hull < 15 && !s.spool) E.retreat(s); }
    E.tick(s, STEP); s.events.splice(0);
  }
  return { i, present: plan.present, nreal: plan.nreal, over: s.over || 'timeout', hull: s.hull, t: s.t, escaped: s.escaped || 0, killed: s.disabled || 0, dead: s.hull <= 0, close: s.hull < 60 };
}
function chunk(task) {   // runs one slice of hunts in this process
  const out = [];
  for (let i = task.from; i < task.to; i++) out.push(task.dog ? playDog(task.bot, i, task.diff, task.sus) : playHunt(task.bot, i, task.diff));
  return out;
}
function runParallel(tasks) {
  return new Promise(res => {
    const results = new Array(tasks.length); let done = 0, next = 0, running = 0;
    const launch = () => {
      while (running < WORKERS && next < tasks.length) {
        const idx = next++, c = cp.fork(__filename, ['--worker'].concat(argv.filter(a => a !== '--worker')), { silent: false }); running++;
        c.on('message', m => { results[idx] = m; }); c.on('exit', () => { running--; done++; if (done === tasks.length) res(results); else launch(); }); c.send(tasks[idx]);
      }
    };
    launch();
  });
}
const median = xs => { const v = xs.slice().sort((a, b) => a - b); return v[Math.floor(v.length / 2)] ?? 0; };
function summarise(bot, diff, rows) {
  const wins = rows.filter(x => x.win), per = n => { const q = rows.filter(x => x.nreal === n); return q.length ? q.filter(x => x.win).length / q.length : 0; };
  const hulls = rows.map(x => x.hull).sort((a, b) => a - b);
  return { bot, diff, n: rows.length, win: wins.length / rows.length, w1: per(1), w2: per(2), w3: per(3), hullW: avg(wins.map(x => x.hull)), p10: hulls[Math.floor(hulls.length / 10)], dead: rows.filter(x => !x.win && x.dead).length / rows.length, timeout: rows.filter(x => x.over === 'timeout').length / rows.length,
    spool: rows.filter(x => !x.win && !x.dead && x.over !== 'timeout').length / rows.length, t: avg(rows.map(x => x.t)), salvosPerWin: avg(wins.map(x => x.vols)), medSalvosWin: median(wins.map(x => x.vols)), magLeftWin: avg(wins.map(x => x.magLeft)), dryLoss: rows.filter(x => !x.win && x.heEmpty).length / rows.length, connect: rows.reduce((a, x) => a + x.conn, 0) / Math.max(1, rows.reduce((a, x) => a + x.vols, 0)),
    byEntry: ENTRIES.reduce((o, e) => { const q = rows.filter(x => x.entry === e); if (q.length) o[e] = q.filter(x => x.win).length / q.length; return o; }, {}) };
}
const TARGET = { camper: [0, 25], pingfire: [0, 40], pinger: [0, 45], reader: [0, 100], steady: [60, 70], random: [0, 20] };
const pc = x => (x * 100).toFixed(0).padStart(4);
async function main() {
  if (flag('dog')) {
    const sus = +opt('sus', 0.5), tasks = []; const mk = (mode, diff) => { const half = Math.ceil(N / WORKERS); for (let f = 0; f < N; f += half) tasks.push({ dog: true, bot: mode, diff, sus, from: f, to: Math.min(N, f + half) }); };
    mk('spool', DIFF); mk('clear', DIFF);
    const res = await runParallel(tasks), by = { spool: [], clear: [] }; tasks.forEach((t, k) => by[t.bot].push(...res[k]));
    console.log(`dog-leg arenas, ${N} per strategy, hunters present with chance ${sus}, ${DIFF}`);
    console.log('strategy   present%  | when hunters present: hull   close%(hull<60)  dead%  jump%  hostiles left   min  | when absent: hull  min');
    for (const m of ['spool', 'clear']) { const all = by[m], pr = all.filter(x => x.present), ab = all.filter(x => !x.present);
      console.log(m.padEnd(9), pc(pr.length / all.length), '     |', '                    ', avg(pr.map(x => x.hull)).toFixed(0).padStart(3), '      ', pc(pr.filter(x => x.close).length / Math.max(1, pr.length)), '        ', pc(pr.filter(x => x.dead).length / Math.max(1, pr.length)), '  ', pc(pr.filter(x => x.over === 'jump').length / Math.max(1, pr.length)), '     ', avg(pr.map(x => x.escaped)).toFixed(2).padStart(5), '       ', avg(pr.map(x => x.t)).toFixed(1).padStart(5), ' |', '           ', avg(ab.map(x => x.hull)).toFixed(0).padStart(3), avg(ab.map(x => x.t)).toFixed(1).padStart(6)); }
    if (flag('json')) console.log(JSON.stringify(by.spool.map(x => x.over).length));
    return;
  }
  const diffs = DIFF === 'all' ? ['easy', 'normal', 'hard'] : [DIFF], out = {};
  for (const diff of diffs) {
    const tasks = []; for (const bot of BOTLIST) { const half = Math.ceil(N / WORKERS); for (let f = 0; f < N; f += half) tasks.push({ bot, diff, from: f, to: Math.min(N, f + half) }); }
    const res = await runParallel(tasks), rows = {}; tasks.forEach((t, k) => (rows[t.bot] = rows[t.bot] || []).push(...res[k]));
    out[diff] = BOTLIST.map(b => summarise(b, diff, rows[b]));
    console.log(`\n[${diff}] entry=${ENTRY} ${N} hunts per bot (1-3 warships, paired seeds ${SEED}+)${SETS.length ? '  sets: ' + SETS.join(' ') : ''}`);
    console.log('bot        win%  1-ship 2-ship 3-ship  hull(wins) p10  dead%  breach%  timeout%  dry-loss%  salvos/win  mag left  connect%  min   by entry (std/dark/fast)');
    for (const r of out[diff]) { const tg = TARGET[r.bot] || [0, 100], ok = diff !== 'normal' ? '' : (r.win * 100 >= tg[0] && r.win * 100 <= tg[1]) ? 'ok' : 'MISS';
      console.log(r.bot.padEnd(9), pc(r.win), '  ', pc(r.w1), '  ', pc(r.w2), '  ', pc(r.w3), '      ', r.hullW.toFixed(0).padStart(3), '  ', String(Math.round(r.p10)).padStart(3), '  ', pc(r.dead), '  ', pc(r.spool), '   ', pc(r.timeout), '    ', pc(r.dryLoss), '     ', r.salvosPerWin.toFixed(1).padStart(5), '    ', r.magLeftWin.toFixed(0).padStart(4), '    ', pc(r.connect), '  ', r.t.toFixed(1).padStart(5), '  ', ENTRIES.map(e => r.byEntry[e] != null ? pc(r.byEntry[e]).trim() : '-').join('/'), ' ', (tg[0] ? tg[0] + '-' + tg[1] : '<' + tg[1]).padEnd(6), ok); }
  }
  if (flag('json')) console.log(JSON.stringify(out));
}
if (process.argv.includes('--worker')) { process.on('message', task => { process.send(chunk(task), () => process.exit(0)); }); }
else main();
