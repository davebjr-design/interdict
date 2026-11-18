'use strict';
/* Interdict 3D ship spine. Procedural rooms from docs/ship_interior_hull_spec.md. Units: 1 unit = 1 m. Y is up = toward the bow
   (ship stands on its tail). A room's floor is its aft face. */
(function () {
  const HULL_L = 140, CELL_R = 5, ANN = 2, SKIN_R = 7;
  const yOf = x => HULL_L - x;                       // metres from bow -> world Y
  // ---- room data (spec "Room schedule"); xf = metres from bow of the floor (aft face), r = floor radius, h = clear height
  const R = [];
  const bay = (id, a, names, radii, extra) => names.forEach((n, k) => R.push(Object.assign({ id: id + (k + 1), name: n, bay: id, xf: a + 1.2 + 3.2 * (k + 1) - 0.3, r: radii[k], h: 2.9 }, extra && extra[k])));
  bay('A', 12, ['Control room (CIC)', "Officer berths + captain's pod", 'Array hall'], [4.8, 5, 3.8], [{ dome: 2.0, kind: 'cic' }, { kind: 'berths' }, { kind: 'array' }]);
  bay('B', 25.5, ['Mess and galley', 'Junction (airlock off dorsal wall)', 'Utility'], [4.8, 4.0, 3.8], [{ kind: 'mess' }, { kind: 'junction' }, { kind: 'utility' }]);
  R.push({ id: 'T', name: 'Missile hall (bay T)', bay: 'T', xf: 71.6, r: 5, h: 31, kind: 'tubes' });
  bay('C', 74.5, ['Thermal control', 'Sink machinery hall', 'Valve gallery'], [4.8, 4.8, 3.8], [{ kind: 'thermal' }, { kind: 'sink' }, { kind: 'valve' }]);
  R.push({ id: 'D1', name: 'Engineering upper', bay: 'D', xf: 88 + 1.6 + 6.2, r: 5, h: 6.0, kind: 'reactor' });
  R.push({ id: 'D2', name: 'Engineering lower', bay: 'D', xf: 102 - 1.0, r: 5, h: 5.6, kind: 'reactor2' });
  R.forEach(r => { r.y = yOf(r.xf); });
  window.SHIP_ROOMS = R;

  const W = innerWidth, H = innerHeight, rd = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  rd.setPixelRatio(Math.min(devicePixelRatio, 2)); rd.setSize(W, H); rd.setClearColor(0x0c1618); document.body.appendChild(rd.domElement);
  const sc = new THREE.Scene(), cam = new THREE.PerspectiveCamera(50, W / H, .1, 400);
  sc.add(new THREE.HemisphereLight(0xcfe4ee, 0x1a2a30, .9)); const dl = new THREE.DirectionalLight(0xffffff, .6); dl.position.set(8, 30, 12); sc.add(dl);
  const mat = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: .8, metalness: .15 }, o || {}));
  const M = (g, m, p) => { const o = new THREE.Mesh(g, m); if (p) o.position.set(p[0], p[1], p[2]); return o; };
  const C = (rt, rb, h, m, p, seg) => M(new THREE.CylinderGeometry(rt, rb, h, seg || 40), m, p);

  // ---- hull + shafts
  const hull = C(SKIN_R, SKIN_R, 104, mat(0x05080a, { transparent: true, opacity: .16, side: THREE.DoubleSide }), [0, yOf(64), 0], 64); sc.add(hull);
  const nose = M(new THREE.SphereGeometry(SKIN_R, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), hull.material, [0, yOf(12), 0]); sc.add(nose);
  for (const sx of [-1, 1]) { const sh = C(.7, .7, 90, mat(0x7f95a1, { transparent: true, opacity: .5 }), [sx * CELL_R, yOf(57), 0], 16); sc.add(sh); }
  const roomG = {}, deckY = id => roomG[id].userData.floorY;
  const floorMat = mat(0x2a4757), wallMat = mat(0x1d3340, { side: THREE.BackSide }), brass = mat(0xc9a24a), steel = mat(0x5d7f90), dark = mat(0x16262f);
  function prop(kind, g, r, h) {
    const add = (o) => { g.add(o); return o; };
    if (kind === 'cic') { for (let i = 0; i < 7; i++) { const a = -1.1 + i * .37; add(M(new THREE.BoxGeometry(.9, .5, .9), mat(0x4a4f7a), [Math.sin(a) * 3.1, .45, -Math.cos(a) * 3.1])).rotation.y = a; } add(M(new THREE.BoxGeometry(2, .12, 1.2), steel, [0, .9, 0])); const d = M(new THREE.SphereGeometry(r, 32, 12, 0, 6.283, 0, .5), wallMat, [0, h, 0]); g.add(d); }
    else if (kind === 'berths') { for (let i = 0; i < 3; i++) { const a = i * 2.094 + .5; for (const k of [0, 1]) add(M(new THREE.BoxGeometry(2.2, .5, .9), steel, [Math.cos(a) * 3.2, .5 + k * 1.1, Math.sin(a) * 3.2])).rotation.y = -a; } add(C(1.7, 1.7, 2.4, mat(0x3b5a6b), [0, 1.2, 0], 24)); }
    else if (kind === 'mess') { add(M(new THREE.TorusGeometry(2.6, .45, 8, 40), steel, [0, .85, 0])).rotation.x = Math.PI / 2; for (let i = 0; i < 14; i++) { const a = i / 14 * 6.283; add(C(.22, .22, .5, brass, [Math.cos(a) * 3.5, .3, Math.sin(a) * 3.5], 8)); } }
    else if (kind === 'junction') { for (const a of [0, 1.571, 3.142, 4.712]) { const t = add(M(new THREE.TorusGeometry(.6, .08, 8, 20), brass, [Math.cos(a) * (r - .1), 1.2, Math.sin(a) * (r - .1)])); t.rotation.y = a + 1.571; } add(C(.5, .5, 2.9, steel, [0, 1.45, 0], 16)); }
    else if (kind === 'array') { add(C(.9, 1.2, 2.2, steel, [0, 1.1, 0], 16)); }
    else if (kind === 'thermal') { add(C(1.4, 1.4, 2.9, steel, [0, 1.45, 0], 24)); for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283; add(C(.25, .25, 1.2, brass, [Math.cos(a) * 2.8, .6, Math.sin(a) * 2.8], 10)); } }
    else if (kind === 'sink' || kind === 'valve') { for (let i = 0; i < 5; i++) { const a = i / 5 * 6.283; add(C(.3, .3, 2.0, mat(0xc9822b), [Math.cos(a) * 3.4, 1, Math.sin(a) * 3.4], 10)); } }
    else if (kind === 'reactor') { add(C(3, 3, h + 6, mat(0xb5543a), [0, (h + 6) / 2 - 6.6, 0], 40)); add(C(4.2, 4.2, .2, mat(0x4a2a24), [0, .1, 0], 48)); }
    else if (kind === 'tubes') {
      const cols = [0x3ec8e0, 0xe0a020, 0xe0a020, 0xe0a020, 0xe0a020, 0x4a7cff, 0xe8d23a, 0xe8d23a, 0xe8d23a, 0xe8d23a, 0xe8d23a, 0xe8d23a];
      for (let i = 0; i < 12; i++) for (const sz of [-1, 1]) { const t = add(C(1.15, 1.15, 8.6, mat(0x33566a, { emissive: cols[i], emissiveIntensity: .25 }), [-7 + 4.3, h - 1.2 - 1.15 - 2.45 * i, sz * 2.2], 24)); t.rotation.z = Math.PI / 2; }
      add(M(new THREE.BoxGeometry(1.0, 29.4, 3.0), mat(0x2e5a4a), [4.2, h - 1.2 - 14.7, 0]));
    }
  }
  R.forEach(r => {
    const g = new THREE.Group(); g.position.y = r.y; g.userData = { floorY: r.y, room: r }; sc.add(g); roomG[r.id] = g;
    const fl = C(r.r, r.r, .3, floorMat, [0, -.15, 0], 56); fl.userData.floor = r.id; g.add(fl);
    const wl = C(r.r, r.r, r.h, wallMat, [0, r.h / 2, 0], 56); wl.material = wallMat; g.add(wl);
    for (const rr of [r.r * .35, r.r * .7, r.r - .2]) { const t = M(new THREE.TorusGeometry(rr, .02, 6, 64), mat(0x8fb0bd), [0, .04, 0]); t.rotation.x = Math.PI / 2; g.add(t); }
    for (const sx of [-1, 1]) { const dr = M(new THREE.TorusGeometry(.6, .06, 8, 24), brass, [sx * (r.r - .02), 1.0, 0]); dr.rotation.y = Math.PI / 2; g.add(dr); }
    prop(r.kind, g, r.r, r.h);
  });
  // ---- character + camera state
  const who = M(new THREE.CylinderGeometry(.3, .3, 1.7, 12), mat(0xc9a24a, { emissive: 0x3a2c08 }), [0, 0, 0]); sc.add(who);
  const st = { room: 'A1', mode: 'room', tx: 0, tz: 0, path: null, az: .6, el: .85, dist: 11, ty: 0, camT: new THREE.Vector3() };
  const hud = document.getElementById('hud'), decks = document.getElementById('decks'), ray = new THREE.Raycaster(), v2 = new THREE.Vector2();
  function place(id, x, z) { const r = roomG[id].userData.room; st.room = id; who.position.set(x, r.y + .95, z); }
  function showHud() { const r = roomG[st.room].userData.room; hud.innerHTML = '<b>INTERDICT 3D ship spine</b><br>' + r.id + ': ' + r.name + '<br>floor ' + (r.r * 2).toFixed(1) + ' m across, ' + r.h + ' m clear<br>' + (st.mode === 'ship' ? 'Ship view (140 m)' : 'Room view'); decks.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.id === st.room)); }
  R.forEach(r => { const b = document.createElement('button'); b.textContent = r.id + '  ' + r.name; b.dataset.id = r.id; b.onclick = () => goTo(r.id); decks.appendChild(b); });
  function enter(id) { st.mode = 'room'; st.room = id; const r = roomG[id].userData.room; st.ty = r.y + (r.kind === 'tubes' ? 12 : 1.2); st.dist = r.kind === 'tubes' ? 30 : 11; st.el = r.kind === 'tubes' ? .3 : .85; showHud(); }
  // click-to-move inside a room; going to another deck = walk to port door, climb the shaft, step out
  const tween = [];
  function walkTo(x, z, done) { tween.push({ k: 'walk', x, z, done }); }
  function goTo(id) {
    if (id === st.room && st.mode === 'room') return; const from = roomG[st.room].userData.room;
    const doorX = -(from.r - .7); tween.length = 0; st.mode = 'room';
    walkTo(doorX, 0, () => { tween.push({ k: 'climb', id, done: () => { const to = roomG[id].userData.room; place(id, -(to.r - .7), 0); enter(id); } }); });
  }
  document.getElementById('shipbtn').onclick = () => { st.mode = st.mode === 'ship' ? 'room' : 'ship'; if (st.mode === 'room') enter(st.room); else { st.ty = yOf(70); st.dist = 150; st.el = .15; showHud(); } };
  const cv = rd.domElement; let drag = null;
  cv.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, moved: false }; });
  addEventListener('pointerup', e => { if (drag && !drag.moved) click(e); drag = null; });
  addEventListener('pointermove', e => { if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true; if (drag.moved) { st.az -= dx * .006; st.el = Math.max(.12, Math.min(1.45, st.el + dy * .005)); drag.x = e.clientX; drag.y = e.clientY; } });
  cv.addEventListener('wheel', e => { st.dist = Math.max(3, Math.min(st.mode === 'ship' ? 220 : 40, st.dist * (1 + Math.sign(e.deltaY) * .08))); e.preventDefault(); }, { passive: false });
  function click(e) {
    v2.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(v2, cam);
    const fl = []; scene_floors().forEach(f => fl.push(f)); const hit = ray.intersectObjects(fl, false)[0]; if (!hit) return;
    const id = hit.object.userData.floor; if (st.mode === 'ship') { st.mode = 'room'; place(id, 0, 0); enter(id); return; }
    if (id !== st.room) { goTo(id); return; } const g = roomG[id], rr = g.userData.room, p = g.worldToLocal(hit.point.clone()), d = Math.hypot(p.x, p.z), k = Math.min(1, (rr.r - .6) / Math.max(d, .001));
    tween.length = 0; walkTo(p.x * k, p.z * k);
  }
  const _f = []; function scene_floors() { if (!_f.length) R.forEach(r => roomG[r.id].children.forEach(c => { if (c.userData.floor) _f.push(c); })); return _f; }
  function step(dt) {
    const t = tween[0]; if (!t) return; const g = roomG[st.room], rr = g.userData.room;
    if (t.k === 'walk') { const tx = g.position.x + t.x, tz = g.position.z + t.z, dx = tx - who.position.x, dz = tz - who.position.z, d = Math.hypot(dx, dz), s = 3.2 * dt; if (d <= s) { who.position.x = tx; who.position.z = tz; tween.shift(); t.done && t.done(); } else { who.position.x += dx / d * s; who.position.z += dz / d * s; } }
    else if (t.k === 'climb') { const to = roomG[t.id].userData.room, ty = to.y + .95, dy = ty - who.position.y, s = 6 * dt; who.position.x = -(rr.r - .7) * 0 - CELL_R; if (Math.abs(dy) <= s) { who.position.y = ty; tween.shift(); t.done && t.done(); } else { who.position.y += Math.sign(dy) * s; st.ty += (who.position.y - st.ty) * .1; } }
  }
  addEventListener('resize', () => { cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); rd.setSize(innerWidth, innerHeight); });
  let last = performance.now(); function loop(now) { const dt = Math.min(.05, (now - last) / 1000); last = now; step(dt);
    const f = st.mode === 'ship' ? new THREE.Vector3(0, yOf(70), 0) : new THREE.Vector3(0, st.ty, 0); st.camT.lerp(f, .12);
    cam.position.set(st.camT.x + st.dist * Math.cos(st.el) * Math.sin(st.az), st.camT.y + st.dist * Math.sin(st.el), st.camT.z + st.dist * Math.cos(st.el) * Math.cos(st.az)); cam.lookAt(st.camT);
    hull.visible = nose.visible = st.mode === 'ship'; rd.render(sc, cam); requestAnimationFrame(loop); }
  place('A1', 0, 2.5); enter('A1'); st.camT.set(0, st.ty, 0); showHud(); requestAnimationFrame(loop);
  window.SHIP3D = { st, goTo, enter, place, roomG, R, step, setMode: m => { st.mode = m; } };
})();
