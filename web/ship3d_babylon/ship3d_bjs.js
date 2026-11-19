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
  // procedural interior textures (spec palette: dark teal-grey and olive painted steel, warm brass), drawn once on canvases
  function ptex(name, w, h, draw, us, vs) { const t = new B.DynamicTexture(name, { width: w, height: h }, sc, true), g = t.getContext(); draw(g, w, h); t.update(); t.wrapU = t.wrapV = B.Texture.WRAP_ADDRESSMODE; t.uScale = us; t.vScale = vs; return t; }
  const rnd = (() => { let q = 7; return () => (q = (q * 16807) % 2147483647) / 2147483647; })();
  const speckle = (g, w, h, n, a) => { for (let i = 0; i < n; i++) { const v = rnd() < .5 ? 0 : 255; g.fillStyle = 'rgba(' + v + ',' + v + ',' + v + ',' + a * rnd() + ')'; g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2, 1 + rnd() * 2); } };
  const floorTex = ptex('floorTex', 512, 512, (g, w, h) => {
    g.fillStyle = '#35505e'; g.fillRect(0, 0, w, h); speckle(g, w, h, 5000, .12);
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { const x = i * 256, y = j * 256; g.fillStyle = (i + j) % 2 ? '#324c59' : '#38535f'; g.fillRect(x + 4, y + 4, 248, 248);
      g.fillStyle = 'rgba(0,0,0,.35)'; for (let a = 0; a < 7; a++) for (let b = 0; b < 7; b++) { g.beginPath(); g.arc(x + 36 + a * 30, y + 36 + b * 30, 3, 0, 6.3); g.fill(); } }
    g.strokeStyle = '#142229'; g.lineWidth = 5; g.strokeRect(0, 0, w, h); g.beginPath(); g.moveTo(256, 0); g.lineTo(256, h); g.moveTo(0, 256); g.lineTo(w, 256); g.stroke();
    g.fillStyle = '#c9a24a'; for (const [x, y] of [[8, 8], [248, 8], [8, 248], [248, 248], [264, 8], [504, 8], [8, 264], [248, 264], [264, 248], [504, 248], [264, 264], [504, 264], [264, 504], [504, 504], [8, 504], [248, 504]]) g.fillRect(x - 2, y - 2, 5, 5); }, 3, 3);
  const wallTex = ptex('wallTex', 512, 512, (g, w, h) => {
    g.fillStyle = '#2d4753'; g.fillRect(0, 0, w, h * .62); g.fillStyle = '#4a5636'; g.fillRect(0, h * .62, w, h * .38); speckle(g, w, h, 6000, .1);
    g.strokeStyle = '#13212a'; g.lineWidth = 4; g.strokeRect(0, 0, w, h); g.beginPath(); g.moveTo(0, h * .62); g.lineTo(w, h * .62); g.moveTo(w / 2, 0); g.lineTo(w / 2, h); g.stroke();
    g.fillStyle = '#8fa3ad'; for (let x = 20; x < w; x += 48) for (const y of [14, h * .62 - 14, h - 14]) { g.beginPath(); g.arc(x, y, 3, 0, 6.3); g.fill(); }
    g.fillStyle = '#c9a24a'; g.fillRect(0, h * .62 - 3, w, 4); g.fillStyle = 'rgba(230,200,60,.9)'; for (let x = 0; x < w; x += 32) g.fillRect(x, h - 10, 16, 8); }, 14, 1);
  const floorM = pbr('#ffffff'), wallM = pbr('#ffffff'), brass = pbr('#c9a24a', { metal: .7, rough: .4 }), steel = pbr('#5d7f90', { metal: .5 }), ringM = pbr('#8fb0bd');
  floorM.albedoTexture = floorTex; wallM.albedoTexture = wallTex; floorM.roughness = .85; wallM.roughness = .8;
  
  const cyl = (n, d, h, m, par, x, y, z) => { const c = B.MeshBuilder.CreateCylinder(n, { diameter: d, height: h, tessellation: 48 }, sc); c.material = m; c.parent = par || null; c.position.set(x || 0, y || 0, z || 0); return c; };
  const box = (n, w, h, d, m, par, x, y, z) => { const c = B.MeshBuilder.CreateBox(n, { width: w, height: h, depth: d }, sc); c.material = m; c.parent = par || null; c.position.set(x || 0, y || 0, z || 0); return c; };

  // ---- GLB slots: a procedural placeholder stands until a GLB listed in the manifest exists, then it is swapped in at real size.
  // Each GLB file is loaded once (AssetContainer) and instantiated per slot. opts: { id, ry (yaw), ground (sit on y=0), size (override) }
  let manifest = window.SHIP_MANIFEST || {}; if (!window.SHIP_MANIFEST) try { const xr = new XMLHttpRequest(); xr.open('GET', 'assets_manifest.json', false); xr.send(); manifest = JSON.parse(xr.responseText); } catch (e) { }
  const slots = {}, conts = {};
  function container(file) {
    if (conts[file]) return conts[file];
    const D = window.GLB_DATA && window.GLB_DATA[file];   // hosted page: models are embedded as base64 in script files (no .glb hosting there)
    if (D) { const bin = atob(D), u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i); return conts[file] = B.SceneLoader.LoadAssetContainerAsync('file:', new File([u8], file), sc); }
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
      holder.position.y += opts.lift || 0; holder.getChildMeshes().forEach(m => { m.isPickable = false; }); fb.setEnabled(false); slots[id].glb = true; slots[id].holder = holder; if (opts.onload) opts.onload(holder, root); hud();
    }).catch(e => console.warn('slot ' + id, e));
    return root;
  }
  window.SHIP_BJS = { R, slots, B, sc };

  // ---- hull and shafts
  const hullM = pbr('#05080a', { alpha: .16 }), hull = cyl('hull', SKIN_R * 2, 104, hullM, null, 0, yOf(64), 0);
  const nose = B.MeshBuilder.CreateSphere('nose', { diameter: SKIN_R * 2, slice: .5, segments: 32 }, sc); nose.material = hullM; nose.position.set(0, yOf(12), 0);
  for (const sx of [-1, 1]) cyl('shaft', 1.4, 90, pbr('#7f95a1', { alpha: .5 }), null, sx * CELL_R, yOf(57), 0);
  slot('engine_bell', root => cyl('bellfb', 3.2, 4, pbr('#33566a'), root, 0, 0, 0), null, 0, yOf(141), 0);

  const life = { crew: [], blink: [], pulse: [], glow: [] };   // things animated in the render loop
  const ledM = ['#3fd38a', '#3fd38a', '#f0ab3a', '#f0ab3a', '#ff4a3d', '#ff4a3d', '#3ddbd0', '#3ddbd0'].map((c, k) => { const m = pbr('#101010', { emit: c, ei: 1 }); life.blink.push({ m, c: k >> 1, ph: (k & 1) * 1.9 + k * .37 }); return m; });
  // ---- live hunt behind the station screens: the web/cic3d painters and the hunt engine, with THREE stubbed (see hunt/ctl_bjs.js for the controls)
  const HS = { ok: false, tex: {}, last: {} };
  if (typeof HuntRT !== 'undefined' && window.LS && window.StationAdapter && window.Annunciator) try {
    window.THREE = window.THREE || { CanvasTexture: function (c) { this.image = c; } };
    const E = HuntRT; E.P.secPerMin = 16; HS.E = E; HS.S = E.newHunt(7, { entry: 'standard', friendly: true }); HS.A = StationAdapter.create({ engine: E, seed: 7, command: 'tight', preset: 'ambush' }); HS.A.update(HS.S, 0); HS.ANN = Annunciator.create();
    LS.ctx.S = HS.S; LS.ctx.E = E; LS.ctx.A = HS.A; LS.ctx.sel = null; window.CTL_HOST = { E, S: () => HS.S, A: () => HS.A, ANN: () => HS.ANN }; window.CTL_INIT(); HS.ok = true;
  } catch (e) { console.warn('hunt init', e); }
  const scrTex = n => HS.tex[n] || (HS.tex[n] = (() => { const o = LS.make(n), tex = new B.DynamicTexture('scr_' + n, o.c, sc, true, B.Texture.TRILINEAR_SAMPLINGMODE, B.Engine.TEXTUREFORMAT_RGBA, false); o.paint(performance.now()); tex.update(false); const m = new B.StandardMaterial('scrM_' + n, sc); m.disableLighting = true; m.emissiveTexture = tex; m.backFaceCulling = false; return { o, tex, m }; })());
  const SCRN = [['contacts', 'waterfall'], ['tid', 'tma'], ['engage', 'payload'], ['thermal', 'damage'], ['comms', 'contacts']];   // the five CIC stations, left to right
  function mkScreens(i, top) {
    if (!HS.ok || !top) return;
    SCRN[i].forEach((n, j) => { const t = scrTex(n), p = B.MeshBuilder.CreatePlane('scr:' + n, { width: .52, height: .39, sideOrientation: B.Mesh.DOUBLESIDE }, sc); p.material = t.m; p.parent = top; p.position.set(j ? .12 : -.49, .22, window.SCR_Z == null ? -.02 : window.SCR_Z); p.rotation.set(window.SCR_RX == null ? .17 : window.SCR_RX, Math.PI + (j ? .1 : -.1), Math.PI); p.metadata = { screen: n, station: i }; p.isPickable = true; });
  }
  const roomG = {};
  const crewSlot = (g, id, x, z, ry, lift) => slot('crew', rt => B.MeshBuilder.CreateCapsule('cfb', { radius: .22, height: 1.2 }, sc), g, x, 0, z, { id, ry, ground: true, lift: lift || 0, onload: h => life.crew.push({ h, ph: Math.random() * 6.3 }) });
  function prop(kind, g, r, h) {
    if (kind === 'cic') {
      // five stations on the aft arc: a console on the wall, a seat and a crew member in front of it facing the screens
      for (let i = 0; i < 5; i++) { const a = -1.2 + i * .6, s = Math.sin(a), c = -Math.cos(a);
        slot('console', rt => box('consfb', 2, .9, .7, steel, rt, 0, .45, 0), g, s * 4.15, 0, c * 4.15, { id: 'console' + i, ry: -a, ground: true, onload: h => mkScreens(i, h.getChildren()[0]) });
        slot('couch', rt => box('couch', 1.2, .5, .6, pbr('#4a4f7a'), rt, 0, .25, 0), g, s * 3.15, 0, c * 3.15, { id: 'couch' + i, ry: -a + Math.PI, ground: true, size: 1.15 });
        crewSlot(g, 'crew' + i, s * 3.15, c * 3.15, Math.PI - a, .32); }
      box('table', 1.6, .1, 1, steel, g, 0, .8, 0); }
    else if (kind === 'berths') { for (let i = 0; i < 3; i++) { const a = i * 2.094 + .5; slot('bunk', rt => box('bunk', 2.2, 1.6, .9, steel, rt, 0, .8, 0), g, Math.cos(a) * 3.3, 0, Math.sin(a) * 3.3, { id: 'bunk' + i, ry: -a - Math.PI / 2, ground: true, size: 2.2 }); } cyl('pod', 3.4, 2.4, pbr('#3b5a6b'), g, 0, 1.2, 0); crewSlot(g, 'crewB', 1.0, 1.2, 2.4, 0); }
    else if (kind === 'mess') { slot('messtable', rt => { const t = B.MeshBuilder.CreateTorus('tbl', { diameter: 5.2, thickness: .9, tessellation: 40 }, sc); t.material = steel; t.parent = rt; t.position.y = .85; return t; }, g, 0, 0, 0, { id: 'messtable', ground: true, size: 4.4 }); crewSlot(g, 'crewM1', 1.7, 0, -1.57, .38); crewSlot(g, 'crewM2', -1.2, 1.2, 2.4, .38); }
    else if (kind === 'junction') { for (const a of [0, 1.571, 3.142, 4.712]) { const t = B.MeshBuilder.CreateTorus('hatch', { diameter: 1.2, thickness: .12 }, sc); t.material = brass; t.parent = g; t.position.set(Math.cos(a) * (r - .1), 1.2, Math.sin(a) * (r - .1)); t.rotation.z = Math.PI / 2; t.rotation.y = a; } cyl('hub', 1, 2.9, steel, g, 0, 1.45, 0); }
    else if (kind === 'array') cyl('tower', 2, 2.2, steel, g, 0, 1.1, 0);
    else if (kind === 'thermal') { slot('pumptower', rt => cyl('tower', 2.8, 2.9, steel, rt, 0, 1.45, 0), g, 0, 0, 0, { id: 'pumptower', ground: true, size: 2.85 }); for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283; cyl('pump', .5, 1.2, brass, g, Math.cos(a) * 2.8, .6, Math.sin(a) * 2.8); } }
    else if (kind === 'sink' || kind === 'valve') for (let i = 0; i < 5; i++) { const a = i / 5 * 6.283; cyl('tank', .6, 2, pbr('#c9822b'), g, Math.cos(a) * 3.4, 1, Math.sin(a) * 3.4); }
    else if (kind === 'reactor') { slot('reactor', rt => cyl('core', 6, h + 6, pbr('#b5543a'), rt, 0, 0, 0), g, 0, 0, 0, { id: 'reactor', ground: true, size: 5.6 }); cyl('well', 8.4, .2, pbr('#4a2a24'), g, 0, .1, 0); const core = pbr('#ff7a2a', { emit: '#ff6a1a', ei: 1 }); const gl = B.MeshBuilder.CreateTorus('coreglow', { diameter: 5.6, thickness: .12, tessellation: 48 }, sc); gl.material = core; gl.parent = g; gl.position.y = 1.2; life.glow.push({ m: core, lo: .5, hi: 1.6, sp: 1.3 }); }
    else if (kind === 'tubes') {
      const cols = ['#3ec8e0', '#e0a020', '#e0a020', '#e0a020', '#e0a020', '#4a7cff', '#e8d23a', '#e8d23a', '#e8d23a', '#e8d23a', '#e8d23a', '#e8d23a'];
      for (let i = 0; i < 12; i++) for (const sz of [-1, 1]) { const tm = pbr('#33566a', { emit: cols[i], ei: .6 }); life.glow.push({ m: tm, lo: .25, hi: .9, sp: .6 + i * .07, ph: i * .5 + (sz > 0 ? 1.7 : 0) }); const t = cyl('tube', 2.3, 8.6, tm, g, -2.7, h - 2.35 - 2.45 * i, sz * 2.2); t.rotation.z = Math.PI / 2; }
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
    // wall status lights: small LED boxes at 2 heights, skipping the two door positions; each LED has its own blink phase
    const n = Math.round(r.r * 5); for (let i = 0; i < n; i++) { const a = i / n * 6.283; if (Math.abs(Math.sin(a)) < .3 && r.kind !== 'tubes') continue; if (r.kind === 'tubes' && i % 3) continue; const k = (i * 5 + r.id.length) % 8, y = r.kind === 'tubes' ? 2 + (i % 5) * 6 : 1.7 + (i % 2) * .5;
      const l = box('led', .12, .07, .03, ledM[k], g, Math.cos(a) * (r.r - .06), y, Math.sin(a) * (r.r - .06)); l.rotation.y = -a + Math.PI / 2; l.isPickable = false; l.metadata = { k }; }
  });

  // ---- starfield, planet and sun behind the hull
  const skyM = new B.StandardMaterial('skyM', sc); skyM.backFaceCulling = false; skyM.disableLighting = true;
  skyM.emissiveTexture = ptex('stars', 2048, 1024, (g, w, h) => {
    g.fillStyle = '#01030a'; g.fillRect(0, 0, w, h);
    for (const [x, y, rr, c] of [[500, 380, 520, '40,60,130'], [1500, 640, 600, '90,40,90'], [1000, 200, 400, '30,90,110']]) { const gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, 'rgba(' + c + ',.22)'); gr.addColorStop(1, 'rgba(' + c + ',0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }
    for (let i = 0; i < 2600; i++) { const b = rnd() ** 3, c = rnd() < .15 ? '255,200,150' : rnd() < .3 ? '170,200,255' : '255,255,255'; g.fillStyle = 'rgba(' + c + ',' + (.25 + .75 * b) + ')'; const s = .8 + 2.2 * b; g.fillRect(rnd() * w, rnd() * h, s, s); } }, 1, 1);
  const sky = B.MeshBuilder.CreateSphere('sky', { diameter: 1800, segments: 24 }, sc); sky.material = skyM; sky.infiniteDistance = true; sky.isPickable = false;
  const planetM = new B.StandardMaterial('planetM', sc); planetM.disableLighting = true;
  planetM.emissiveTexture = ptex('planet', 512, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); [['#3a5a6e', 0], ['#7a9aa6', .2], ['#4d6c7a', .35], ['#9fb5a8', .5], ['#566f7e', .7], ['#2c4655', 1]].forEach(([c, o]) => gr.addColorStop(o, c)); g.fillStyle = gr; g.fillRect(0, 0, w, h); for (let i = 0; i < 90; i++) { g.fillStyle = 'rgba(255,255,255,' + rnd() * .08 + ')'; g.fillRect(0, rnd() * h, w, 1 + rnd() * 5); } }, 1, 1);
  const planet = B.MeshBuilder.CreateSphere('planet', { diameter: 340, segments: 48 }, sc); planet.material = planetM; planet.position.set(-420, -90, -560); planet.isPickable = false;
  const sun = B.MeshBuilder.CreateSphere('sun', { diameter: 26 }, sc); sun.material = pbr('#fff6dc', { emit: '#fff1c0', ei: 2 }); sun.position.set(380, 620, 330); sun.isPickable = false;

  // ---- exterior nod to spaceship form: only drawn in ship view (hull is translucent there). Spec positions are schematic.
  const extG = new B.TransformNode('ext', sc), plate = pbr('#222e35', { metal: .6, rough: .45 }), bone = pbr('#d8d4c4', { rough: .6 }), amberM = pbr('#101010', { emit: '#ff8a3a', ei: 1 });
  const TC = ['#3ec8e0', '#e0a020', '#e0a020', '#e0a020', '#e0a020', '#4a7cff', '#e8d23a', '#e8d23a', '#e8d23a', '#e8d23a', '#e8d23a', '#e8d23a'];
  for (const x of [15, 21, 112, 118]) cyl('band', SKIN_R * 2 + .3, 1.3, bone, extG, 0, yOf(x), 0);
  { const cone = B.MeshBuilder.CreateCylinder('bow', { diameterTop: 1.4, diameterBottom: 14, height: 15, tessellation: 48 }, sc); cone.material = plate; cone.parent = extG; cone.position.y = yOf(12) + 7.5;
    cyl('mast', .25, 11, brass, extG, 0, yOf(12) + 20.5, 0); const dock = B.MeshBuilder.CreateTorus('dock', { diameter: 3.4, thickness: .5, tessellation: 32 }, sc); dock.material = brass; dock.parent = extG; dock.position.y = yOf(12) + 14.6;
    const dome = B.MeshBuilder.CreateSphere('dome', { diameter: 2.4, slice: .5 }, sc); dome.material = pbr('#6f8fa0', { metal: .7, rough: .25 }); dome.parent = extG; dome.position.set(0, yOf(12) + 2, 5.4); dome.rotation.x = Math.PI / 2; }
  { const tp = B.MeshBuilder.CreateCylinder('taper', { diameterTop: 14.3, diameterBottom: 8, height: 14, tessellation: 48 }, sc); tp.material = plate; tp.parent = extG; tp.position.y = 17; }
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4, px = Math.cos(a) * 4.6, pz = Math.sin(a) * 4.6;
    cyl('pod', 2, 8, plate, extG, px, 5, pz); const bell = B.MeshBuilder.CreateCylinder('podbell', { diameterTop: 1.8, diameterBottom: 3.2, height: 2.6, tessellation: 24 }, sc); bell.material = steel; bell.parent = extG; bell.position.set(px, -.8, pz);
    const fl = B.MeshBuilder.CreateCylinder('plume', { diameterTop: 2.2, diameterBottom: .2, height: 5, tessellation: 16 }, sc); fl.material = amberM; fl.parent = extG; fl.position.set(px, -4.1, pz); }
  { const fl = B.MeshBuilder.CreateCylinder('plume0', { diameterTop: 2.8, diameterBottom: .2, height: 6.5, tessellation: 16 }, sc); fl.material = amberM; fl.parent = extG; fl.position.set(0, -5.6, 0); life.glow.push({ m: amberM, lo: .5, hi: 1.7, sp: 3.1 }); }
  // radiator wings (port and starboard) with thermal stripes and nav lights
  const radM = pbr('#2b3a42', { metal: .5, rough: .5 }), stripeM = pbr('#101010', { emit: '#e0702a', ei: .5 }); life.glow.push({ m: stripeM, lo: .2, hi: .9, sp: .4 });
  for (const sz of [-1, 1]) { for (let i = 0; i < 4; i++) { const y0 = yOf(52 + i * 14.5); box('rad', .15, 13.5, 11, radM, extG, 0, y0 - 6.7, 0).position.z = sz * 12.5; box('radstripe', .17, 13.5, .3, stripeM, extG, 0, y0 - 6.7, 0).position.z = sz * 18; }
    cyl('strut', .3, 60, plate, extG, 0, yOf(80), sz * 8).rotation.set(0, 0, 0); const nav = pbr('#101010', { emit: sz < 0 ? '#ff3030' : '#30ff60', ei: 1.5 }); const nl = B.MeshBuilder.CreateSphere('nav', { diameter: .6 }, sc); nl.material = nav; nl.parent = extG; nl.position.set(0, yOf(50), sz * 18.2); life.glow.push({ m: nav, lo: .1, hi: 2.4, sp: 2.2, strobe: 1, ph: sz }); }
  // dorsal tube deck caps: 12 per side, glowing the tube's colour cue
  for (let i = 0; i < 12; i++) for (const sz of [-1, 1]) { const cm = pbr('#1a2328', { emit: TC[i], ei: .5, metal: .6 }); life.glow.push({ m: cm, lo: .2, hi: .8, sp: .6 + i * .07, ph: i * .5 + (sz > 0 ? 1.7 : 0) });
    const cap = cyl('cap', 1.7, .35, cm, extG, -SKIN_R - .1, roomG['T'].position.y + 31 - 2.35 - 2.45 * i, sz * 2.2); cap.rotation.z = Math.PI / 2; }
  extG.getChildMeshes().forEach(m => { m.isPickable = false; });
  // ---- dust motes drifting in the current room
  const dustT = ptex('dustT', 32, 32, g => { const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); }, 1, 1);
  const dust = new B.ParticleSystem('dust', 160, sc); dust.particleTexture = dustT; dust.emitter = new B.Vector3(0, 0, 0); dust.minEmitBox = new B.Vector3(-4, .2, -4); dust.maxEmitBox = new B.Vector3(4, 2.7, 4);
  dust.color1 = new B.Color4(.8, .9, 1, .35); dust.color2 = new B.Color4(1, .9, .7, .2); dust.colorDead = new B.Color4(1, 1, 1, 0); dust.minSize = .006; dust.maxSize = .02; dust.minLifeTime = 6; dust.maxLifeTime = 12; dust.emitRate = 20;
  dust.direction1 = new B.Vector3(-.06, -.015, -.06); dust.direction2 = new B.Vector3(.06, .05, .06); dust.minEmitPower = .3; dust.maxEmitPower = 1; dust.preWarmCycles = 80; dust.preWarmStepOffset = 5; dust.start();

  // ---- character, camera, interaction
  const who = B.MeshBuilder.CreateCapsule('who', { radius: .3, height: 1.7 }, sc); who.material = pbr('#c9a24a', { emit: '#3a2c08', ei: 1 }); who.isPickable = false;
  const cam = new B.ArcRotateCamera('cam', .6, 1.0, 11, new B.Vector3(0, 120, 0), sc); cam.lowerRadiusLimit = 3; cam.upperRadiusLimit = 220; cam.upperBetaLimit = 1.5; cam.lowerBetaLimit = .1; cam.minZ = .1; cam.maxZ = 2500; cam.wheelPrecision = 12; cam.attachControl(cv, true);
  // first-person and room-centre cameras: a free-look camera (drag to look, wheel = zoom) at eye height 1.6 m. 'room' sits on the axis; reactor rooms
  // have the reactor on the axis, so 'room' falls back to first person there.
  const fp = new B.UniversalCamera('fp', new B.Vector3(0, 120, 0), sc); fp.minZ = .05; fp.maxZ = 2500; fp.fov = 1.1; fp.angularSensibility = 2200; fp.inertia = .55; fp.speed = 0; fp.inputs.removeByType('FreeCameraKeyboardMoveInput'); fp.rotation.y = Math.PI;
  const NOCENTER = { reactor: 1, reactor2: 1 };
  const st = { room: 'A1', mode: 'room', cam: 'orbit', tgt: new B.Vector3(0, 120, 0) }, tween = [];
  const hudEl = document.getElementById('hud'), decks = document.getElementById('decks');
  // two player cameras: 'orbit' (drag to orbit the room or ship) and 'shoulder' (orbit camera locked behind the character, offset to one side).
  // 'fp' is internal: the screen-zoom camera.
  function setCam(m, keep) {
    if (!keep) unzoom();
    if (st.mode === 'ship') { st.mode = 'room'; enter(st.room); }
    st.cam = m; const old = sc.activeCamera; if (old) old.detachControl();
    if (m === 'fp') { sc.activeCamera = fp; fp.attachControl(cv, true); who.isVisible = false; }
    else { sc.activeCamera = cam; cam.attachControl(cv, true); who.isVisible = true;
      if (m === 'shoulder') { cam.lowerRadiusLimit = 1.4; cam.radius = 4.4; cam.beta = 1.15; cam.targetScreenOffset.set(-.3, -.06); }
      else { cam.lowerRadiusLimit = 3; cam.targetScreenOffset.set(0, 0); enter(st.room); } }
    camBtns.forEach(b => b.classList.toggle('on', b.dataset.cam === st.cam)); hud();
  }
  const camBox = document.createElement('div'); camBox.id = 'cams'; camBox.style.cssText = 'position:fixed;left:max(16px,env(safe-area-inset-left,0px));top:calc(170px + env(safe-area-inset-top,0px));display:flex;flex-direction:column;gap:3px';
  const camBtns = [['orbit', '1  Orbit view'], ['shoulder', '2  Over the shoulder']].map(([k, t]) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = t; b.dataset.cam = k; b.onclick = () => setCam(k); camBox.appendChild(b); return b; }); document.body.appendChild(camBox);
  cv.addEventListener('wheel', e => { if (st.cam === 'fp') { fp.fov = Math.max(.5, Math.min(1.7, fp.fov * (1 + Math.sign(e.deltaY) * .06))); e.preventDefault(); } }, { passive: false });
  function hud() { const r = roomG[st.room].metadata.room, n = Object.values(slots).filter(s => s.glb).length; hudEl.innerHTML = '<b>INTERDICT 3D ship spine (Babylon.js)</b><br>' + ({ orbit: 'Orbit view', shoulder: 'Over the shoulder', fp: 'Screen' })[st.cam] + '<br>' + r.id + ': ' + r.name + '<br>floor ' + (r.r * 2).toFixed(1) + ' m across, ' + r.h + ' m clear<br>' + (st.mode === 'ship' ? 'Ship view (140 m)' : 'Room view') + (st.zoom ? '<br><b>SCREEN ' + st.zoom.mesh.metadata.screen.toUpperCase() + '</b>: click its soft keys · Esc steps back' : '') + '<br><span style="opacity:.7">1 orbit · 2 over the shoulder · 3 ship view · WASD walk · Shift run · Q/E deck down/up</span><br>GLB slots filled: ' + n + ' / ' + Object.keys(slots).length; decks.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.id === st.room)); }
  R.forEach(r => { const b = document.createElement('button'); b.textContent = r.id + '  ' + r.name; b.dataset.id = r.id; b.onclick = () => goTo(r.id); decks.appendChild(b); });
  function place(id, x, z) { const r = roomG[id].metadata.room; st.room = id; who.position.set(x, r.y + .95, z); }
  function enter(id) { st.mode = 'room'; st.room = id; const r = roomG[id].metadata.room; dust.emitter = roomG[id].getAbsolutePosition().clone(); dust.maxEmitBox.setAll(r.r * .85); dust.minEmitBox.set(-r.r * .85, .2, -r.r * .85); dust.maxEmitBox.y = Math.min(r.h, 6) - .3; st.tgt.set(0, r.y + (r.kind === 'tubes' ? 12 : 1.2), 0); cam.radius = r.kind === 'tubes' ? 30 : 11; cam.beta = r.kind === 'tubes' ? 1.3 : .8; hud(); }
  const walkTo = (x, z, done) => tween.push({ k: 'walk', x, z, done });
  function goTo(id) { if (id === st.room && st.mode === 'room') return; const from = roomG[st.room].metadata.room; tween.length = 0; st.mode = 'room'; walkTo(-(from.r - .7), 0, () => tween.push({ k: 'climb', id, done: () => { const to = roomG[id].metadata.room; place(id, -(to.r - .7), 0); enter(id); } })); }
  document.getElementById('shipbtn').onclick = () => { if (st.mode === 'ship') enter(st.room); else { if (st.cam !== 'orbit') setCam('orbit'); st.mode = 'ship'; st.tgt.set(0, yOf(70), 0); cam.radius = 150; cam.beta = 1.4; hud(); } };
  sc.onPointerObservable.add(pi => { if (pi.type !== B.PointerEventTypes.POINTERTAP) return; const p = pi.pickInfo; if (!p || !p.hit || !p.pickedMesh.metadata || !p.pickedMesh.metadata.floor) return; const id = p.pickedMesh.metadata.floor; unzoom();
    if (st.mode === 'ship') { st.mode = 'room'; place(id, 0, 0); enter(id); return; } if (id !== st.room) { goTo(id); return; }
    const g = roomG[id], rr = g.metadata.room, lx = p.pickedPoint.x - g.position.x, lz = p.pickedPoint.z - g.position.z, d = Math.hypot(lx, lz), k = Math.min(1, (rr.r - .6) / Math.max(d, 1e-3)); tween.length = 0; walkTo(lx * k, lz * k); });
  // ---- screen zoom: tap a station screen to step up to it; then its soft keys are live (CTL.activate)
  function unzoom() { if (!st.zoom) return; (st.zoomHid || []).forEach(n => n.setEnabled(true)); st.zoomHid = []; const prev = st.zoom.prev; st.zoom = null; fp.fov = 1.1; cv.style.cursor = ''; LS.ctx.hover = { scr: null, id: null }; setCam(prev === 'fp' ? 'shoulder' : prev, true); }
  function zoomTo(mesh) {
    const prev = st.zoom ? st.zoom.prev : st.cam; setCam('fp', true); mesh.computeWorldMatrix(true); const c = mesh.getAbsolutePosition().clone(), n = B.Vector3.TransformNormal(new B.Vector3(0, 0, 1), mesh.getWorldMatrix()).normalize();
    if (B.Vector3.Dot(n, roomG[st.room].getAbsolutePosition().subtract(c)) < 0) n.scaleInPlace(-1);
    st.zoom = { mesh, prev, pos: c.add(n.scale(.62)), tgt: c, zt: fp.getFrontPosition(1) }; st.zoomHid = ['crew', 'couch'].map(k => slots[k + mesh.metadata.station]).filter(Boolean).map(s => s.root); st.zoomHid.forEach(n => n.setEnabled(false)); hud();
  }
  function zoomStep() { const z = st.zoom; fp.position = B.Vector3.Lerp(fp.position, z.pos, .12); z.zt = B.Vector3.Lerp(z.zt, z.tgt, .15); fp.setTarget(z.zt); fp.fov += (.85 - fp.fov) * .12; }
  const scrHit = () => { const p = sc.pick(sc.pointerX, sc.pointerY, m => !!(m.metadata && m.metadata.screen)); if (!p || !p.hit || !p.pickedMesh || !p.pickedMesh.metadata || !p.pickedMesh.metadata.screen) return null; const uv = p.getTextureCoordinates(); if (!uv) return null; const x = uv.x * LS.W, y = uv.y * LS.H; return { n: p.pickedMesh.metadata.screen, mesh: p.pickedMesh, x, y, reg: LS.hit(p.pickedMesh.metadata.screen, x, y) }; };
  sc.onPointerObservable.add(pi => { if (!HS.ok) return;
    if (pi.type === B.PointerEventTypes.POINTERMOVE) { if (!st.zoom) return; const h = scrHit(pi); LS.ctx.hover = h && h.mesh === st.zoom.mesh && h.reg ? { scr: h.n, id: h.reg.id } : { scr: null, id: null }; cv.style.cursor = LS.ctx.hover.id ? 'pointer' : ''; return; }
    if (pi.type !== B.PointerEventTypes.POINTERTAP) return; const h = scrHit(pi); if (!h) return; if (!st.zoom || st.zoom.mesh !== h.mesh) zoomTo(h.mesh); else if (h.reg) CTL.activate(h.reg.id); });
  function hunt(dt) {
    if (!HS.ok) return; const S = HS.S, E = HS.E; if (!S.over && !S.hold) E.tick(S, dt / E.P.secPerMin); HS.A.update(S, S.over || S.hold ? 0 : dt); LS.ctx.annOut = HS.ANN.update({ s: S, model: HS.A.model, E });
    if (!LS.ctx.sel && S.an.length) LS.ctx.sel = (S.an.find(a => a.state !== 'out') || S.an[0]).id;
    if (st.room !== 'A1' || st.mode !== 'room') return; const now = performance.now();
    for (const n in HS.tex) { const per = st.zoom && st.zoom.mesh.metadata.screen === n ? 110 : 450; if (now - (HS.last[n] || 0) < per) continue; HS.last[n] = now; HS.tex[n].o.paint(now); HS.tex[n].tex.update(false); } }
  const keys = {};
  addEventListener('keydown', e => { keys[e.code] = 1; if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return; const k = e.code; if (k === 'Escape') unzoom();
    if (k === 'Digit1') setCam('orbit'); else if (k === 'Digit2') setCam('shoulder');
    else if (k === 'Digit3') document.getElementById('shipbtn').click();
    else if (k === 'KeyQ' || k === 'KeyE') { const i = R.findIndex(r => r.id === st.room), j = Math.max(0, Math.min(R.length - 1, i + (k === 'KeyQ' ? 1 : -1))); if (j !== i) goTo(R[j].id); } });
  addEventListener('keyup', e => { delete keys[e.code]; }); addEventListener('blur', () => { for (const k in keys) delete keys[k]; });
  // keyboard walking: relative to wherever the active camera looks (fp, room centre or orbit), clamped inside the room
  function drive(dt) {
    const dx = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0), dz = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0); if ((!dx && !dz) || st.mode === 'ship') return; unzoom();
    const d = sc.activeCamera.getForwardRay().direction, f = new B.Vector3(d.x, 0, d.z); if (f.length() < 1e-3) return; f.normalize(); const v = f.scale(dz).add(new B.Vector3(-f.z, 0, f.x).scale(dx)); v.normalize();
    const t0 = tween[0]; if (t0 && t0.k === 'climb') return; tween.length = 0; const g = roomG[st.room], rr = g.metadata.room, s = (keys.ShiftLeft || keys.ShiftRight ? 5.5 : 3.2) * dt;
    let nx = who.position.x + v.x * s - g.position.x, nz = who.position.z + v.z * s - g.position.z; const m = Math.hypot(nx, nz), lim = rr.r - .6; if (m > lim) { nx *= lim / m; nz *= lim / m; } who.position.x = g.position.x + nx; who.position.z = g.position.z + nz; }
  function step(dt) {
    drive(dt); hunt(dt);
    const t = tween[0]; if (!t) return; const g = roomG[st.room], rr = g.metadata.room;
    if (t.k === 'walk') { const tx = g.position.x + t.x, tz = g.position.z + t.z, dx = tx - who.position.x, dz = tz - who.position.z, d = Math.hypot(dx, dz), s = 3.2 * dt; if (d <= s) { who.position.x = tx; who.position.z = tz; tween.shift(); t.done && t.done(); } else { who.position.x += dx / d * s; who.position.z += dz / d * s; } }
    else if (t.k === 'climb') { const to = roomG[t.id].metadata.room, ty = to.y + .95, dy = ty - who.position.y, s = 6 * dt; who.position.x = -CELL_R; if (Math.abs(dy) <= s) { who.position.y = ty; tween.shift(); t.done && t.done(); } else { who.position.y += Math.sign(dy) * s; st.tgt.y += (who.position.y - st.tgt.y) * .1; } }
  }
  sc.onBeforeRenderObservable.add(() => { step(Math.min(.05, eng.getDeltaTime() / 1000)); cam.target = B.Vector3.Lerp(cam.target, st.tgt, .12);
    if (st.cam === 'fp') { if (st.zoom) zoomStep(); else fp.position.set(who.position.x, who.position.y + .65, who.position.z); }
    if (st.cam === 'shoulder' && st.mode === 'room') { st.tgt.set(who.position.x, who.position.y + .35, who.position.z); cam.target.copyFrom(st.tgt); }
    hull.isVisible = nose.isVisible = st.mode === 'ship'; extG.setEnabled(st.mode === 'ship'); planet.setEnabled(st.mode === 'ship'); sun.setEnabled(st.mode === 'ship'); if (st.mode === 'ship') cam.alpha += .0006; animate(performance.now() / 1000); });
  function animate(t) {
    for (const b of life.blink) b.m.emissiveIntensity = b.c === 0 ? .75 + .25 * Math.sin(t * 2.1 + b.ph) : b.c === 1 ? (Math.sin(t * .9 + b.ph) > .1 ? 1.1 : .12) : b.c === 2 ? ((t * .7 + b.ph) % 4 < .25 ? 1.6 : .08) : .55 + .45 * Math.sin(t * 3.3 + b.ph);
    for (const o of life.glow) { const s = Math.sin(t * o.sp * (o.strobe ? 3 : 1) + (o.ph || 0)); o.m.emissiveIntensity = o.strobe ? (s > .85 ? o.hi : o.lo) : o.lo + (o.hi - o.lo) * (.5 + .5 * s); }
    ringM.emissiveColor = B.Color3.FromHexString('#3ddbd0'); ringM.emissiveIntensity = .12 + .1 * Math.sin(t * 1.4);
    for (const c of life.crew) { if (c.y0 === undefined) { c.y0 = c.h.position.y; c.r0 = c.h.rotation.y; } c.h.position.y = c.y0 + .008 * Math.sin(t * 1.7 + c.ph); c.h.rotation.y = c.r0 + .05 * Math.sin(t * .35 + c.ph); } }
  eng.runRenderLoop(() => sc.render()); addEventListener('resize', () => eng.resize());
  place('A1', 0, 2.5); enter('A1'); cam.target = st.tgt.clone(); setCam('shoulder');
  window.SHIP_BJS.api = { who, walkTo, cam, setCam, fp, st, goTo, enter, place, step, roomG, loadManifest: () => fetch('assets_manifest.json').then(r => r.json()).then(m => { manifest = m; return m; }) };
})();
