#!/usr/bin/env node
/* ASCII walk map: node tools/room_ascii.js <room> ; # blocked, . free, D door stand, N npc. Columns are i, rows are j. */
const { chromium } = require('playwright'); const path = require('path');
(async () => { const b = await chromium.launch({ args: ['--allow-file-access-from-files'] }), p = await b.newPage();
  await p.goto('file://' + path.resolve(__dirname, '../design/proto_iso.html')); await p.waitForTimeout(1200);
  for (const n of process.argv.slice(2)) {
    const t = await p.evaluate(n => { const r = window.__iso.ROOMS[n]; let o = n + ' ' + r.Ni + 'x' + r.Nj + ' k=' + r.k.toFixed(3) + ' zoom=' + r.zoom.toFixed(2) + '\n   ' + [...Array(r.Ni).keys()].map(i => String(i % 10)).join('') + '\n';
      for (let j = 0; j < r.Nj; j++) { o += String(j).padStart(2) + ' '; for (let i = 0; i < r.Ni; i++) { const k = i + ',' + j; o += r.doors.some(d => d.stand[0] === i && d.stand[1] === j) ? 'D' : r.npcs.some(x => x.cell[0] === i && x.cell[1] === j) ? 'N' : r.blocked.has(k) ? '#' : '.'; } o += '\n'; }
      return o + r.doors.map(d => d.id + ' stand=' + d.stand + ' arrive=' + d.arrive).join('\n'); }, n);
    console.log(t); }
  await b.close(); })();
