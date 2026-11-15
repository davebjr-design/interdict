// Screenshot helper: node tests/cic3d_shots.js outprefix "js to run before shot" [query] ...  Usage example in docs/cic3d_interaction.md
const { chromium } = require('playwright'), http = require('http'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), types = { '.js': 'text/javascript', '.html': 'text/html', '.json': 'application/json', '.mp3': 'audio/mpeg', '.glb': 'model/gltf-binary' };
const jobs = JSON.parse(process.argv[2]);   // [{name, q, pre: 'js', wait: ms, w, h}]
const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); r.end(d); } }); }).listen(0, async () => {
  for (const j of jobs) {
    const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
    const p = await b.newPage({ viewport: { width: j.w || 1280, height: j.h || 720 } }), errs = [];
    p.on('pageerror', e => errs.push('PAGEERR ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/404/.test(m.text())) errs.push('CONSOLE ' + m.text()); });
    await p.goto('http://localhost:' + srv.address().port + '/web/hunt3d.html' + (j.q ? '?' + j.q : '')); await p.waitForFunction(() => window.__ready, { timeout: 30000 });
    if (j.pre) await p.evaluate(j.pre); await p.waitForTimeout(j.wait || 1500);
    const out = path.join(__dirname, 'shots', j.name + '.png'); await p.screenshot({ path: out }); console.log(out, errs.length ? errs : '');
    await b.close();
  }
  srv.close();
});
