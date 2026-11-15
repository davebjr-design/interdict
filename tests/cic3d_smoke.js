// Smoke test: serve the repo, load web/hunt3d.html, run the live hunt, fail on page errors. Usage: node tests/cic3d_smoke.js  (needs playwright)
const { chromium } = require('playwright'), http = require('http'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), types = { '.js': 'text/javascript', '.html': 'text/html', '.json': 'application/json' };
const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); r.end(d); } }); }).listen(0, async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] }), p = await b.newPage({ viewport: { width: 1280, height: 720 } }), errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/404/.test(m.text())) errs.push(m.text()); });
  await p.goto('http://localhost:' + srv.address().port + '/web/hunt3d.html'); await p.waitForFunction(() => window.__ready, { timeout: 20000 });
  const r = await p.evaluate(() => { CIC3D.step(3000, .1); CIC3D.go('attack', 1); CIC3D.setBrace(true); const S = CIC3D.S(); return { t: S.t, an: S.an.length, errs: CIC3D.A().errors.length, view: CIC3D.view() }; });
  await b.close(); srv.close(); if (errs.length || r.errs || r.view !== 'screen' || !(r.t > 5)) { console.error('FAIL', errs, r); process.exit(1); } console.log('ok', r);
});
