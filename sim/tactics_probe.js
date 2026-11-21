/* Tactics probe (2026-11-20): plays the scripted captains against the real engine and reports what the g mechanics cost and what the fights look like.
 *   node sim/tactics_probe.js [--n 90] [--bots steady,dodger,quiet,camper] [--seed 9000]
 * Per bot: win%, hull lost, game minutes, propellant used (t), peak g-fatigue, blackouts, volleys fired at us, volleys that hurt, dry tank %. */
const E = require(process.env.HUNT_ENGINE || '../web/hunt_rt_engine.js'), B = require('./hunt_bots.js');
const ROOTS = { player: E.PLAYER, ai: E.AI, rules: E.RULES };
const argv = process.argv.slice(2);
argv.forEach((x, i) => { if (x === '--set' && argv[i + 1]) { const [p, v] = argv[i + 1].split('='), q = p.split('.'); ROOTS[q[0]][q[1]] = +v; } });
const _unused = 0, opt = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const N = +opt('n', 90), SEED = +opt('seed', 9000), BOTS = opt('bots', 'steady,dodger,quiet,camper').split(','), STEP = 0.1, MAXT = 90;
function play(bot, i) {
  const nreal = 1 + (i % 3), seed = SEED + i; E.setDifficulty('normal');
  const s = E.newHunt(seed, { nreal, entry: 'standard' }), r = B.mkRand(seed * 7 + 3), mem = {}; let k = 0, fat = 0, blk = 0, vols = 0, hurt = 0, hull0 = 100, dry = false, braced = 0;
  
  while (!s.over && s.t < MAXT) {
    B.BOTS[bot](s, k++, r, mem); E.tick(s, STEP);
    for (const c of E.gState ? E.gState(s) : []) fat = Math.max(fat, c.fat || 0);
    s.events.splice(0); for (const ev of (s.evts || []).splice(0)) { if (ev.type === 'ko' && ev.data.cause === 'blackout') blk++; if (ev.type === 'vampire' && ev.data.n === undefined ? true : ev.type === 'vampire') vols++; if (ev.type === 'impact') hurt++; }
    if (s.water <= 0) dry = true;
  }
  return { win: s.over === 'win', hull: 100 - s.hull, t: s.t, water: (s.waterUsed || 0), fat, blk, vols, hurt, dry, dead: s.hull <= 0, timeout: !s.over };
}
const avg = (xs, f) => xs.reduce((a, x) => a + f(x), 0) / (xs.length || 1);
console.log('bot      win%  dead%  timeout%  min   hullLost  propT  peakFat  blackouts/hunt  volleys  impacts  dryTank%');
for (const bot of BOTS) { const R = []; for (let i = 0; i < N; i++) R.push(play(bot, i));
  console.log(bot.padEnd(8), (100 * avg(R, x => +x.win)).toFixed(0).padStart(4), (100 * avg(R, x => +x.dead)).toFixed(0).padStart(6), (100 * avg(R, x => +x.timeout)).toFixed(0).padStart(8), avg(R, x => x.t).toFixed(1).padStart(6), avg(R, x => x.hull).toFixed(0).padStart(8), avg(R, x => x.water).toFixed(0).padStart(6), avg(R, x => x.fat).toFixed(2).padStart(8), avg(R, x => x.blk).toFixed(2).padStart(14), avg(R, x => x.vols).toFixed(1).padStart(8), avg(R, x => x.hurt).toFixed(1).padStart(8), (100 * avg(R, x => +x.dry)).toFixed(0).padStart(8)); }
