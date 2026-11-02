// Combat rules from the 2026-10-31 audit: no instant ping solutions, quiet keeps drive heat, coilgun respects hit points,
// a zero cone is not always best, idle players get found, lock never reveals the contact's kind.
const E = require('../web/hunt_rt_engine.js');
let bad = 0; const chk = (m, c) => { console.log(c ? 'ok  ' : 'FAIL', m); if (!c) bad++; };
function lone(seed, o = {}) {
  const s = E.newHunt(seed, { layout: 'center' }); s.bodies = []; s.player = { x: 120, y: 120 };
  const a = s.an.find(x => x.kind === 'real'); a.state = 'open'; a.legs = null; a.x0 = 120 + (o.d || 40); a.y0 = 120; a.vx = 0; a.vy = o.v ?? 3; a.ventOk = 1e9;
  return { s, a };
}
{ const { s, a } = lone(3); E.lockContact(s, a.id); E.pingContact(s, a.id); E.tick(s, E.PLAYER.pingSolve + 0.05);
  chk('a ping on a fresh lock adds part of a solution, not all of it (' + a.solve.toFixed(2) + ')', a.solve > 0.3 && a.solve < 1); }
{ const { s } = lone(4); E.setRoute(s, [{ x: 220, y: 120 }]); E.setSpeed(s, 'v4'); const before = E.exposure(s).parts.find(p => p.k === 'engine').v; E.goQuiet(s);
  const q = E.exposure(s).parts.find(p => p.k === 'engine'); chk('going quiet keeps the engine heat of the chosen speed', q && Math.abs(q.v - before) < 1e-9);
  const t = s.an.find(x => x.kind === 'real'); E.lockContact(s, t.id); t.solve = 1; chk('no launches while quiet', E.fire(s, t.id, null, 4) === false); }
{ const { s, a } = lone(5, { d: 8, v: 0 }); a.hp = a.hpMax = 180; E.lockContact(s, a.id); for (const w of s.analysts) E.assign(s, w.id, a.id); E.tick(s, 0.5); s.rFx = () => 0;
  E.fireClose(s, a.id); chk('a coilgun slug damages but does not one-shot a battleship', a.state !== 'disabled' && a.hp < 180); }
{ const out = {}; for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) { const { s, a } = lone(seed, { d: 60, v: 3.6 }); a.aware = true; a.grid = 'heavy'; E.lockContact(s, a.id); a.track = 3; a.anchor.t = s.t - 3;
    let b = null; for (const c of [0, 2, 4, 6, 9]) { const d = E.dmgEst(s, a, null, c, 'he', 400, (k => () => (k = (k * 16807) % 2147483647) / 2147483647)(seed * 99 + 7)); if (!b || d.exp > b.exp) b = { c, exp: d.exp }; } out[b.c] = (out[b.c] || 0) + 1; }
  chk('on an old track against an alert, gridded ship, a wider cone is often better (' + JSON.stringify(out) + ')', (out[0] || 0) < 8); }
{ let found = 0; for (let seed = 1; seed <= 20; seed++) { const s = E.newHunt(500 + seed, { nreal: 2 }); E.tick(s, 30); if (s.an.some(a => a.kind === 'real' && a.aware) || s.over) found++; }
  let early = 0; for (let seed = 1; seed <= 20; seed++) { const s = E.newHunt(500 + seed, { nreal: 2 }); E.tick(s, 4); if (s.an.some(a => a.kind === 'real' && a.aware)) early++; }
  chk('an idle player is usually found within 30 game minutes (' + found + '/20)', found >= 14); chk('but a few minutes of watching is safe (' + early + '/20 found by minute 4)', early <= 2); }
{ const s = E.newHunt(9, {}); const said = []; for (const a of s.an.filter(x => x.kind !== 'friend')) { const n = s.log.length; E.lockContact(s, a.id); said.push(s.log.slice(n).map(l => l.text.replace(/\d+/g, '#')).join('|')); }
  chk('a lock reads the same whatever the contact is', new Set(said).size === 1); }
console.log(bad ? 'FAILED' : 'ALL OK'); process.exit(bad ? 1 : 0);
