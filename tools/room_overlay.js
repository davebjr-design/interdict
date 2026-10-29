#!/usr/bin/env node
/* Render the fitting overlay for rooms: node tools/room_overlay.js <outdir> [room ...]
 * Reads design/rooms_spec.js through the page (run tools/build_rooms.py first). */
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
(async () => {
  const [out, ...only] = process.argv.slice(2); fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] }), p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.resolve(__dirname, '../design/proto_iso.html')); await p.waitForTimeout(1500);
  const names = await p.evaluate(() => Object.keys(window.__iso.ROOMS));
  for (const n of names) { if (only.length && !only.includes(n)) continue;
    const url = await p.evaluate(n => window.__iso.devRender(n), n);
    fs.writeFileSync(path.join(out, n + '.png'), Buffer.from(url.split(',')[1], 'base64')); }
  if (errs.length) console.log(errs.join('\n')); await b.close();
})();
