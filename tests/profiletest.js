// Player/enemy separation: trims and player-only effects touch s.me only; difficulty touches a.ai only; RNG streams are paired.
const E = require('../web/hunt_rt_engine.js'), T = require('../web/trims.js');
let bad = 0; const chk = (m, c) => { console.log(c ? 'ok  ' : 'FAIL', m); if (!c) bad++; };
const snap = o => JSON.stringify(o);
const allTrims = Object.keys(T.T).filter(id => T.T[id].hunt !== false && !T.T[id].salvo);
{ // every trim at once: the enemy blocks and the shared rules are untouched
  E.setDifficulty('normal');
  const P0 = snap(E.P), a0 = E.newHunt(11, { nreal: 3 }), b0 = E.newHunt(11, { nreal: 3 });
  T.applyP(E.P, allTrims); T.applyShip(b0, allTrims);
  chk('trims leave the shared rules alone', snap(E.P) === P0);
  chk('trims leave every enemy AI block alone', b0.an.every((a, i) => snap(a.ai) === snap(a0.an[i].ai) && snap(a.load) === snap(a0.an[i].load)));
  chk('trims do change our profile', b0.me.ventFull !== a0.me.ventFull && b0.me.sensR !== a0.me.sensR);
  chk('applyPlayer refuses keys that are not ours', E.applyPlayer(b0, { mul: { knowK: 2, heatK: 2 } }).length === 2 && b0.an.every(a => a.ai.knowK === a0.an[0].ai.knowK));
  chk('each hunt gets a fresh player profile', E.newHunt(11, {}).me.ventFull === E.PLAYER.ventFull);
  chk('loadouts are copies, not shared references', a0.an.filter(a => a.kind !== 'real').every((a, i, xs) => a.load !== E.LOADOUTS[1] && (i === 0 || a.load !== xs[0].load)));
}
{ // difficulty
  const def = E.newHunt(12, { nreal: 2 }); E.setDifficulty('normal'); const nor = E.newHunt(12, { nreal: 2 });
  chk('the default is the normal preset', snap(def.an.map(a => a.ai)) === snap(nor.an.map(a => a.ai)) && def.difficulty === 'normal');
  E.setDifficulty('hard'); const hard = E.newHunt(12, { nreal: 2 }); E.setDifficulty('easy'); const easy = E.newHunt(12, { nreal: 2 }); E.setDifficulty('normal');
  const r = s => s.an.find(a => a.kind === 'real').ai;
  chk('hard enemies notice faster, aim tighter, fire sooner, hit harder', r(hard).knowK > r(nor).knowK && r(hard).aimSigMax < r(nor).aimSigMax && r(hard).fireCd < r(nor).fireCd && r(hard).dmgW > r(nor).dmgW);
  chk('easy enemies are the other way round', r(easy).knowK < r(nor).knowK && r(easy).aimSigMax > r(nor).aimSigMax && r(easy).fireCd > r(nor).fireCd && r(easy).dmgW < r(nor).dmgW);
  chk('difficulty never touches our profile or the field', snap(hard.me) === snap(nor.me) && snap(easy.me) === snap(nor.me) && snap(hard.bodies) === snap(nor.bodies) && hard.an.every((a, i) => a.kind === nor.an[i].kind && a.x0 === nor.an[i].x0));
  chk('unknown preset is refused', E.setDifficulty('nightmare') === false && E.getDifficulty().name === 'normal');
  chk('opts.difficulty overrides for one hunt', E.newHunt(12, { difficulty: 'hard' }).difficulty === 'hard' && E.getDifficulty().name === 'normal');
}
{ // paired RNG: what the player does with analysts does not move an unaware enemy's own choices
  const legs = busy => { const s = E.newHunt(21, { nreal: 2, layout: 'center' }); s.an.forEach(a => { a.ventOk = 1e9; });
    for (let i = 0; i < 100; i++) { if (busy) s.analysts.forEach((w, k) => { if (w.task == null) E.assign(s, w.id, (i + k) % s.an.length); }); E.tick(s, 0.1); }
    return { legs: snap(s.an.map(a => (a.legs || []).map(g => [g.t.toFixed(2), g.vx.toFixed(3)]))), aware: s.an.some(a => a.aware) }; };
  const quiet = legs(false), busy = legs(true);
  chk('enemy maneuvers are identical whether or not our analysts work (while nobody is aware)', quiet.aware || busy.aware || quiet.legs === busy.legs);
}
console.log(bad ? 'FAILED' : 'ALL OK'); process.exit(bad ? 1 : 0);
