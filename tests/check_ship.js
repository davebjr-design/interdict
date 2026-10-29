#!/usr/bin/env node
/* Static checks on design/proto_iso.html's room graph. Run: node tests/check_ship.js
 *
 * Catches the three mistakes that are invisible until someone walks into them:
 *   1. A door's stand cell is not where its hatch is actually painted, so the captain
 *      steps out of blank wall and gets clipped by a doorway he is nowhere near.
 *   2. Both sides of a link use the same wall type, so the walk direction reverses
 *      across the transition and you appear to enter backwards.
 *   3. A door's stand or arrival cell is blocked, or the return trip lands somewhere else.
 * Plus per-room reachability with crew standing in position, since an NPC in a
 * one-cell lane is a wall.
 */
const { chromium } = require('playwright');
const FILE = 'file://' + require('path').resolve(__dirname, '../design/proto_iso.html');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('page error: ' + e.message));
  await page.goto(FILE);
  await page.waitForTimeout(1500);

  const problems = await page.evaluate(() => {
    const I = window.__iso, R = I.ROOMS, out = [];
    const lerp = (A, B, t) => [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t];

    for (const [n, r] of Object.entries(R)) {
      for (const d of r.doors) {
        const key = `${n}.${d.id}`;
        if (r.blocked.has(d.stand.join(','))) out.push(`${key}: stand cell ${d.stand} is blocked`);
        if (d.stand[0] >= r.Ni || d.stand[1] >= r.Nj) out.push(`${key}: stand cell ${d.stand} is outside the grid`);

        // the stand cell must be the one nearest the painted hatch
        if (d.wall) {
          const cx = (d.rc[0] + d.rc[2]) / 2, cy = (d.rc[1] + d.rc[3]) / 2;
          const N = d.wall === 'i' ? r.Nj : r.Ni, far = d.wall === 'i' ? r.l : r.r;
          let best = 0, bd = Infinity;
          for (let k = 0; k < N; k++) {
            const s = lerp(r.t, far, (k + 0.5) / N), dist = Math.hypot(s[0] - cx, s[1] - cy);
            if (dist < bd) { bd = dist; best = k; }
          }
          const cur = d.wall === 'i' ? d.stand[1] : d.stand[0];
          if (cur !== best) out.push(`${key}: stand is ${cur} along wall '${d.wall}' but the hatch is at ${best}`);
        }

        if (!d.to) continue;
        const t = R[d.to];
        if (!t) { out.push(`${key}: points at unknown room '${d.to}'`); continue; }
        if (t.blocked.has(d.arrive.join(','))) out.push(`${key}: arrival cell ${d.arrive} is blocked in ${d.to}`);
        const back = t.doors.find(x => x.stand[0] === d.arrive[0] && x.stand[1] === d.arrive[1]);
        if (!back) { out.push(`${key}: nothing in ${d.to} stands at ${d.arrive}`); continue; }
        if (back.to !== n) out.push(`${key}: return door ${d.to}.${back.id} goes to ${back.to}`);
        if (back.arrive[0] !== d.stand[0] || back.arrive[1] !== d.stand[1])
          out.push(`${key}: return lands at ${back.arrive}, not ${d.stand}`);
        if (!!d.wall !== !!back.wall) out.push(`${key}: wall tag mismatch with ${d.to}.${back.id}`);
        else if (d.wall && d.wall === back.wall)
          out.push(`${key}: both sides use wall '${d.wall}', so the walk direction reverses`);
      }
    }

    // reachability, with crew placed
    for (const [n, r] of Object.entries(R)) {
      let start = null;
      for (let i = 0; i < r.Ni && !start; i++) for (let j = 0; j < r.Nj && !start; j++)
        if (!r.blocked.has(i + ',' + j) && !r.npcs.some(c => c.cell[0] === i && c.cell[1] === j)) start = [i, j];
      if (!start) { out.push(`${n}: no free cell at all`); continue; }
      I.setRoom(n, start, 'se');
      const stuck = [];
      for (let i = 0; i < r.Ni; i++) for (let j = 0; j < r.Nj; j++) {
        if (r.blocked.has(i + ',' + j)) continue;
        if (I.npcs.some(c => c.i === i && c.j === j)) continue;
        if (!I.bfs(start, [i, j])) stuck.push(i + ',' + j);
      }
      if (stuck.length) out.push(`${n}: ${stuck.length} cell(s) walled off: ${stuck.join(' ')}`);
    }
    return out;
  });

  await browser.close();
  const all = errs.concat(problems);
  if (all.length) { console.error('FAIL\n  ' + all.join('\n  ')); process.exit(1); }
  console.log('OK: every door aligned, reciprocal and direction-consistent; every compartment fully reachable');
})();
