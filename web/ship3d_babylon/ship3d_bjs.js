'use strict';
/* Interdict 3D ship spine on Babylon.js. Same data as web/ship3d (spec room schedule). Units: 1 = 1 m, Y up = toward the bow.
   Right-handed coordinates so positions match the three.js version. GLB slots come from assets_manifest.json. */
(function () {
  const B = BABYLON, HULL_L = 140, CELL_R = 5, SKIN_R = 7, yOf = x => HULL_L - x;
  const R = [];
  const bay = (id, a, names, radii, extra) => names.forEach((n, k) => R.push(Object.assign({ id: id + (k + 1), name: n, bay: id, xf: a + 1.2 + 3.2 * (k + 1) - 0.3, r: radii[k], h: 2.9 }, extra && extra[k])));
  bay('A', 12, ['Control room (CIC)', "Officer berths + captain's pod", 'Array hall'], [4.8, 5, 3.8], [{ kind: 'cic' }, { kind: 'berths' }, { kind: 'array' }]);
  bay('B', 25.5, ['Mess and galley', 'Junction (airlock off dorsal wall)', 'Utility'], [4.8, 4.0, 3.8], [{ kind: 'mess' }, { kind: 'junction' }, { kind: 'utility' }]);
  R.push({ id: 'T', name: 'Missile hall (bay T)', bay: 'T', xf: 71.6, r: 5, h: 31, kind: 'tubes' });
  bay('C', 74.5, ['Thermal control', 'Sink machinery hall', 'Valve gallery'], [4.8, 4.8, 3.8], [{ kind: 'thermal' }, { kind: 'sink' }, { kind: 'valve' }]);
  R.push({ id: 'D1', name: 'Engineering upper', bay: 'D', xf: 95.8, r: 5, h: 6.0, kind: 'reactor' });
  R.push({ id: 'D2', name: 'Engineering lower', bay: 'D', xf: 101, r: 5, h: 5.6, kind: 'reactor2' });
  R.forEach(r => { r.y = yOf(r.xf); });

  const cv = document.getElementById('c'), eng = new B.Engine(cv, true, { preserveDrawingBuffer: true }), sc = new B.Scene(eng);
  sc.useRightHandedSystem = true; sc.clearColor = new B.Color4(.047, .09, .094, 1);
  const hl = new B.HemisphericLight('h', new B.Vector3(0, 1, 0), sc); hl.intensity = .9; hl.groundColor = new B.Color3(.1, .16, .19);
  const dl = new B.DirectionalLight('d', new B.Vector3(-.4, -1, -.5), sc); dl.intensity = .55;
  const pbr = (c, o) => { const m = new B.PBRMaterial('m', sc); m.albedoColor = B.Color3.FromHexString(c); m.metallic = (o && o.metal) || .2; m.roughness = (o && o.rough) || .75; if (o && o.emit) { m.emissiveColor = B.Color3.FromHexString(o.emit); m.emissiveIntensity = o.ei || .3; } if (o && o.alpha) { m.alpha = o.alpha; m.backFaceCulling = false; } return m; };
  const floorM = pbr('#2a4757'), wallM = pbr('#1d3340'), brass = pbr('#c9a24a', { metal: .7, rough: .4 }), steel = pbr('#5d7f90', { metal: .5 }), ringM = pbr('#8fb0bd');
  
  const cyl = (n, d, h, m, par, x, y, z) => { const c = B.MeshBuilder.CreateCylinder(n, { diameter: d, height: h, tessellation: 48 }, sc); c.material = m; c.parent = par || null; c.position.set(x || 0, y || 0, z || 0); return c; };
  const box = (n, w, h, d, m, par, x, y, z) => { const c = B.MeshBuilder.CreateBox(n, { width: w, height: h, depth: d }, sc); c.material = m; c.parent = par || null; c.position.set(x || 0, y || 0, z || 0); return c; };

  // ---- GLB slots: a procedural placeholder stands until a GLB listed in the manifest exists, then it is swapped in at real size.
  // Each GLB file is loaded once (AssetContainer) and instantiated per slot. opts: { id, ry (yaw), ground (sit on y=0), size (override) }
  let manifest = window.SHIP_MANIFEST || {}; if (!window.SHIP_MANIFEST) try { const xr = new XMLHttpRequest(); xr.open('GET', 'assets_manifest.json', false); xr.send(); manifest = JSON.parse(xr.responseText); } catch (e) { }
  const slots = {}, conts = {};
  function container(file) {
    if (conts[file]) return conts[file];
    const D = window.GLB_DATA && window.GLB_DATA[file];   // hosted page: models are embedded as base64 in script files (no .glb hosting there)
    if (D) { const bin = atob(D), u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i); return conts[file] = B.SceneLoader.LoadAssetContainerAsync(new File([u8], file), undefined, sc); }
    return conts[file] = B.SceneLoader.LoadAssetContainerAsync('glb/', file, sc);
  }
  function slot(key, makeFallback, parent, x, y, z, opts) {
    opts = opts || {}; const id = opts.id || key, root = new B.TransformNode('slot:' + id, sc); root.parent = parent; root.position.set(x || 0, y || 0, z || 0);
    const fb = makeFallback(root); slots[id] = { root, fb, glb: false, key };
    const m = manifest[key]; if (!m) return root;
    container(m.file).then(c => {
      const inst = c.instantiateModelsToScene(n => n, false), top = inst.rootNodes[0], holder = new B.TransformNode('glb:' + id, sc); holder.parent = root; top.parent = holder;
      holder.rotation.y = (opts.ry || 0) + (m.ry || 0);
      const bb = holder.getHierarchyBoundingVectors(true), ext = bb.max.subtract(bb.min), k = (opts.size || m.size_m) / Math.max(ext.x, ext.y, ext.z, 1e-6);
      holder.scaling.setAll(k); const b2 = holder.getHierarchyBoundingVectors(true), cx = (b2.min.x + b2.max.x) / 2 - root.getAbsolutePosition().x, cz = (b2.min.z + b2.max.z) / 2 - root.getAbsolutePosition().z;
      holder.position.x -= cx; holder.position.z -= cz; holder.position.y -= opts.ground ? b2.min.y - root.getAbsolutePosition().y : ((b2.min.y + b2.max.y) / 2 - root.getAbsolutePosition().y);
      fb.setEnabled(false); slots[id].glb = true; hud();
    }).catch(e => console.warn('slot ' + id, e));
    return root;
  }
  window.SHIP_BJS = { R, slots, B, sc };

  // ---- hull and shafts
  const hullM = pbr('#05080a', { alpha: .16 }), hull = cyl('hull', SKIN_R * 2, 104, hullM, null, 0, yOf(64), 0);
  const nose = B.MeshBuilder.CreateSphere('nose', { diameter: SKIN_R * 2, slice: .5, segments: 32 }, sc); nose.material = hullM; nose.position.set(0, yOf(12), 0);
  for (const sx of [-1, 1]) cyl('shaft', 1.4, 90, pbr('#7f95a1', { alpha: .5 }), null, sx * CELL_R, yOf(57), 0);
  slot('engine_bell', root => cyl('bellfb', 3.2, 4, pbr('#33566a'), root, 0, 0, 0), null, 0, yOf(141), 0);

  const roomG = {};
  function prop(kind, g, r, h) {
    if (kind === 'cic') { for (let i = 0; i < 4; i++) { const a = -.9 + i * .6, x = Math.sin(a) * 3.2, z = -Math.cos(a) * 3.2; const t = slot('couch', rt => { const c = box('couch', 1.6, .5, .9, pbr('#4a4f7a'), rt, 0, .25, 0); return c; }, g, x, 0, z, { id: 'couch' + i, ry: -a, ground: true }); } box('table', 2, .12, 1.2, steel, g, 0, .9, 0); }
    else if (kind === 'berths') { for (let i = 0; i < 3; i++) { const a = i * 2.094 + .5; for (const k of [0, 1]) { const b = box('bunk', 2.2, .5, .9, steel, g, Math.cos(a) * 3.2, .5 + k * 1.1, Math.sin(a) * 3.2); b.rotation.y = -a; } } cyl('pod', 3.4, 2.4, pbr('#3b5a6b'), g, 0, 1.2, 0); }
    else if (kind === 'mess') { const t = B.MeshBuilder.CreateTorus('tbl', { diameter: 5.2, thickness: .9, tessellation: 40 }, sc); t.material = steel; t.parent = g; t.position.y = .85; for (let i = 0; i < 14; i++) { const a = i / 14 * 6.283; cyl('stool', .44, .5, brass, g, Math.cos(a) * 3.5, .3, Math.sin(a) * 3.5); } }
    else if (kind === 'junction') { for (const a of [0, 1.571, 3.142, 4.712]) { const t = B.MeshBuilder.CreateTorus('hatch', { diameter: 1.2, thickness: .12 }, sc); t.material = brass; t.parent = g; t.position.set(Math.cos(a) * (r - .1), 1.2, Math.sin(a) * (r - .1)); t.rotation.z = Math.PI / 2; t.rotation.y = a; } cyl('hub', 1, 2.9, steel, g, 0, 1.45, 0); }
    else if (kind === 'array') cyl('tower', 2, 2.2, steel, g, 0, 1.1, 0);
    else if (kind === 'thermal') { cyl('tower', 2.8, 2.9, steel, g, 0, 1.45, 0); for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283; cyl('pump', .5, 1.2, brass, g, Math.cos(a) * 2.8, .6, Math.sin(a) * 2.8); } }
    else if (kind === 'sink' || kind === 'valve') for (let i = 0; i < 5; i++) { const a = i / 5 * 6.283; cyl('tank', .6, 2, pbr('#c9822b'), g, Math.cos(a) * 3.4, 1, Math.sin(a) * 3.4); }
    else if (kind === 'reactor') { cyl('core', 6, h + 6, pbr('#b5543a'), g, 0, (h + 6) / 2 - 6.6, 0); cyl('well', 8.4, .2, pbr('#4a2a24'), g, 0, .1, 0); }
    else if (kind === 'tubes') {
      const cols = ['#3ec8e0', '#e0a020', '#e0a020', '#e0a020', '#e0a020', '#4a7cff', '#e8d23a', '#e8d23a', '#e8d23a', '#e8d23a', '#e8d23a', '#e8d23a'];
      for (let i = 0; i < 12; i++) for (const sz of [-1, 1]) { const t = cyl('tube', 2.3, 8.6, pbr('#33566a', { emit: cols[i], ei: .6 }), g, -2.7, h - 2.35 - 2.45 * i, sz * 2.2); t.rotation.z = Math.PI / 2; }
      box('gallery', 1, 29.4, 3, pbr('#2e5a4a'), g, 4.2, h - 1.2 - 14.7, 0);
      for (const sz of [-1, 1]) slot('tubebase', rt => cyl('tbfb', 2.3, 2, pbr('#33566a'), rt, 0, 0, 0), g, 2.4, h - 2.35 - 2.45 * 1, sz * 2.2, { id: 'tubebase' + (sz < 0 ? 'p' : 's'), ry: Math.PI / 2 });
    }
  }
  R.forEach(r => {
    const g = new B.TransformNode('room:' + r.id, sc); g.position.y = r.y; g.metadata = { room: r }; roomG[r.id] = g;
    const fl = cyl('floor:' + r.id, r.r * 2, .3, floorM, g, 0, -.15, 0); fl.metadata = { floor: r.id };
    const wl = B.MeshBuilder.CreateCylinder('wall', { diameter: r.r * 2, height: r.h, tessellation: 56, sideOrientation: B.Mesh.BACKSIDE }, sc); wl.material = wallM; wl.parent = g; wl.position.y = r.h / 2; wl.isPickable = false;
    for (const rr of [r.r * .35, r.r * .7, r.r - .2]) { const t = B.MeshBuilder.CreateTorus('ring', { diameter: rr * 2, thickness: .04, tessellation: 64 }, sc); t.material = ringM; t.parent = g; t.position.y = .04; t.isPickable = false; }
    for (const sx of [-1, 1]) { slot('hatch', rt => { const d = B.MeshBuilder.CreateTorus('door', { diameter: 1.2, thickness: .12 }, sc); d.material = brass; d.parent = rt; d.rotation.z = Math.PI / 2; d.isPickable = false; return d; }, g, sx * (r.r - .05), 1.0, 0, { id: 'hatch:' + r.id + (sx < 0 ? 'p' : 's'), ry: sx < 0 ? Math.PI / 2 : -Math.PI / 2 }); }
    prop(r.kind, g, r.r, r.h);
  });

  // ---- character, camera, interaction
  const who = B.MeshBuilder.CreateCapsule('who', { radius: .3, height: 1.7 }, sc); who.material = pbr('#c9a24a', { emit: '#3a2c08', ei: 1 }); who.isPickable = false;
  const cam = new B.ArcRotateCamera('cam', .6, 1.0, 11, new B.Vector3(0, 120, 0), sc); cam.lowerRadiusLimit = 3; cam.upperRadiusLimit = 220; cam.upperBetaLimit = 1.5; cam.lowerBetaLimit = .1; cam.minZ = .1; cam.maxZ = 500; cam.wheelPrecision = 12; cam.attachControl(cv, true);
  const st = { room: 'A1', mode: 'room', tgt: new B.Vector3(0, 120, 0) }, tween = [];
  const hudEl = document.getElementById('hud'), decks = document.getElementById('decks');
  function hud() { const r = roomG[st.room].metadata.room, n = Object.values(slots).filter(s => s.glb).length; hudEl.innerHTML = '<b>INTERDICT 3D ship spine (Babylon.js)</b><br>' + r.id + ': ' + r.name + '<br>floor ' + (r.r * 2).toFixed(1) + ' m across, ' + r.h + ' m clear<br>' + (st.mode === 'ship' ? 'Ship view (140 m)' : 'Room view') + '<br>GLB slots filled: ' + n + ' / ' + Object.keys(slots).length; decks.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.id === st.room)); }
  R.forEach(r => { const b = document.createElement('button'); b.textContent = r.id + '  ' + r.name; b.dataset.id = r.id; b.onclick = () => goTo(r.id); decks.appendChild(b); });
  function place(id, x, z) { const r = roomG[id].metadata.room; st.room = id; who.position.set(x, r.y + .95, z); }
  function enter(id) { st.mode = 'room'; st.room = id; const r = roomG[id].metadata.room; st.tgt.set(0, r.y + (r.kind === 'tubes' ? 12 : 1.2), 0); cam.radius = r.kind === 'tubes' ? 30 : 11; cam.beta = r.kind === 'tubes' ? 1.3 : .8; hud(); }
  const walkTo = (x, z, done) => tween.push({ k: 'walk', x, z, done });
  function goTo(id) { if (id === st.room && st.mode === 'room') return; const from = roomG[st.room].metadata.room; tween.length = 0; st.mode = 'room'; walkTo(-(from.r - .7), 0, () => tween.push({ k: 'climb', id, done: () => { const to = roomG[id].metadata.room; place(id, -(to.r - .7), 0); enter(id); } })); }
  document.getElementById('shipbtn').onclick = () => { if (st.mode === 'ship') enter(st.room); else { st.mode = 'ship'; st.tgt.set(0, yOf(70), 0); cam.radius = 150; cam.beta = 1.4; hud(); } };
  sc.onPointerObservable.add(pi => { if (pi.type !== B.PointerEventTypes.POINTERTAP) return; const p = pi.pickInfo; if (!p || !p.hit || !p.pickedMesh.metadata || !p.pickedMesh.metadata.floor) return; const id = p.pickedMesh.metadata.floor;
    if (st.mode === 'ship') { st.mode = 'room'; place(id, 0, 0); enter(id); return; } if (id !== st.room) { goTo(id); return; }
    const g = roomG[id], rr = g.metadata.room, lx = p.pickedPoint.x - g.position.x, lz = p.pickedPoint.z - g.position.z, d = Math.hypot(lx, lz), k = Math.min(1, (rr.r - .6) / Math.max(d, 1e-3)); tween.length = 0; walkTo(lx * k, lz * k); });
  function step(dt) {
    const t = tween[0]; if (!t) return; const g = roomG[st.room], rr = g.metadata.room;
    if (t.k === 'walk') { const tx = g.position.x + t.x, tz = g.position.z + t.z, dx = tx - who.position.x, dz = tz - who.position.z, d = Math.hypot(dx, dz), s = 3.2 * dt; if (d <= s) { who.position.x = tx; who.position.z = tz; tween.shift(); t.done && t.done(); } else { who.position.x += dx / d * s; who.position.z += dz / d * s; } }
    else if (t.k === 'climb') { const to = roomG[t.id].metadata.room, ty = to.y + .95, dy = ty - who.position.y, s = 6 * dt; who.position.x = -CELL_R; if (Math.abs(dy) <= s) { who.position.y = ty; tween.shift(); t.done && t.done(); } else { who.position.y += Math.sign(dy) * s; st.tgt.y += (who.position.y - st.tgt.y) * .1; } }
  }
  sc.onBeforeRenderObservable.add(() => { step(Math.min(.05, eng.getDeltaTime() / 1000)); cam.target = B.Vector3.Lerp(cam.target, st.tgt, .12); hull.isVisible = nose.isVisible = st.mode === 'ship'; });
  eng.runRenderLoop(() => sc.render()); addEventListener('resize', () => eng.resize());
  place('A1', 0, 2.5); enter('A1'); cam.target = st.tgt.clone(); hud();
  window.SHIP_BJS.api = { st, goTo, enter, place, step, roomG, loadManifest: () => fetch('assets_manifest.json').then(r => r.json()).then(m => { manifest = m; return m; }) };
})();
