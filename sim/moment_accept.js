/* Decision-moment acceptance test (docs/decision_moments.md s1.8.6, docs/mechanics_decisions.md): for each moment, a bot that always answers TIGHT and one that always
 * answers LOOSE play the same paired seeds; the moment passes if the mean win rate is within 2 points, loose has the higher win rate or the worse worst decile.
 *
 *   node sim/moment_accept.js [--n 240] [--only M03,M07] [--diff normal] [--bot steady]
 *
 * The bot plays through sim/hunt_bots.js. Moments are answered the instant they are raised (the adapter would take a few seconds; the engine effect is the same).
 * M02 only fires on a ping, so its bot is pingfire (the passive-patient pinger) and E.pingContact is wrapped to ask E.momentPing first.
 * Deterministic: seeds 9000+i, 1 + i % 3 warships, entries cycling standard / dark / fast. */
const E = require(process.env.HUNT_ENGINE || '../web/hunt_rt_engine.js'), B = require('./hunt_bots.js');
const argv = process.argv.slice(2), opt = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : d; };
const N = +opt('n', 240), DIFF = opt('diff', 'normal'), ONLY = opt('only', 'M01,M02,M03,M04,M07,M09').split(','), BOT = opt('bot', null), ENTRIES = ['standard', 'dark', 'fast'];
const ping0 = E.pingContact; let ENABLED = [];
E.pingContact = (s, id, mod) => (!mod && ENABLED.includes('M02') && E.momentPing(s, id, { enabled: ENABLED })) ? true : ping0(s, id, mod);
function play(ids, side, i, bot) {
  ENABLED = side ? ids : []; E.setDifficulty(DIFF);
  const seed = 9000 + i, s = E.newHunt(seed, { nreal: 1 + (i % 3), entry: ENTRIES[Math.floor(i / 3) % 3] }), r = B.mkRand(seed * 7 + 3), mem = {}; let k = 0, fired = 0;
  while (!s.over && s.t < 90) {
    if (side) { const got = E.momentCheck(s, { enabled: ids }); if (got || (s.mom && s.mom.open)) { const id = s.mom.open.id; if (E.moment(s, id, side).ok) fired++; } }
    B.BOTS[bot](s, k++, r, mem); E.tick(s, 0.1); s.events.splice(0);
    if (side && s.mom && s.mom.open && s.mom.open.id === 'M02') { E.moment(s, 'M02', side); fired++; }   // a held ping: answer it on the spot
  }
  return { win: s.over === 'win', hull: s.hull, fired };
}
const pct = (a, f) => a.length ? 100 * a.filter(f).length / a.length : 0, mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
function sum(rs) { const hulls = rs.filter(r => r.win).map(r => r.hull).sort((x, y) => x - y); return { win: pct(rs, r => r.win), hull: mean(hulls), p10: hulls.length ? Math.round(hulls[Math.floor(hulls.length * 0.1)]) : 0, fired: pct(rs, r => r.fired > 0) }; }   // p10: the worst decile of hull among the wins
console.log(`moment acceptance: ${N} paired hunts, ${DIFF}\nmoment  bot       side    win%   hull(wins)  p10  fired%`);
const out = {};
for (const id of ONLY) {
  const bot = BOT || (id === 'M02' ? 'pingfire' : 'steady'); const row = {};
  for (const side of [null, 'tight', 'loose']) { const rs = []; for (let i = 0; i < N; i++) rs.push(play([id], side, i, bot)); row[side || 'none'] = sum(rs); const q = row[side || 'none']; console.log(`${id.padEnd(7)} ${bot.padEnd(9)} ${(side || 'off').padEnd(6)} ${q.win.toFixed(1).padStart(5)} ${q.hull.toFixed(0).padStart(9)} ${String(q.p10).padStart(6)} ${q.fired.toFixed(0).padStart(7)}`); }
  const dm = row.loose.win - row.tight.win, mean2 = (row.loose.win + row.tight.win) / 2 - row.none.win, dh = (row.loose.hull + row.tight.hull) / 2 - row.none.hull;
  const okMean = Math.abs(mean2) <= 2 && Math.abs(dh) <= 2, okOrder = dm >= 0 && dm <= 8, okSpread = row.loose.p10 <= row.tight.p10;   // spec: mean within 2 points, loose the higher win rate (about 2-6), loose the worse worst decile
  console.log(`        loose - tight win ${dm.toFixed(1)} points, hull(wins) p10 ${row.loose.p10} vs ${row.tight.p10}; mean of the two vs no moment: win ${mean2.toFixed(1)}, hull ${dh.toFixed(1)}  [mean ${okMean ? 'ok' : 'OFF'}, loose wins more ${okOrder ? 'ok' : 'NO'}, loose worse spread ${okSpread ? 'ok' : 'NO'}]`); out[id] = row;
}
if (argv.includes('--json')) console.log(JSON.stringify(out));
