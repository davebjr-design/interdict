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
    g.fillStyle = '#4a6471'; g.fillRect(0, 0, w, h); speckle(g, w, h, 2500, .06);
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { const x = i * 256, y = j * 256; g.fillStyle = (i + j) % 2 ? '#3d5764' : '#587583'; g.fillRect(x + 4, y + 4, 248, 248);
      g.fillStyle = 'rgba(0,0,0,.22)'; for (let a = 0; a < 7; a++) for (let b = 0; b < 7; b++) { g.beginPath(); g.arc(x + 36 + a * 30, y + 36 + b * 30, 3, 0, 6.3); g.fill(); } }
    g.strokeStyle = '#1b2d36'; g.lineWidth = 6; g.strokeRect(0, 0, w, h); g.beginPath(); g.moveTo(256, 0); g.lineTo(256, h); g.moveTo(0, 256); g.lineTo(w, 256); g.stroke();
    g.fillStyle = '#c9a24a'; for (const [x, y] of [[8, 8], [248, 8], [8, 248], [248, 248], [264, 8], [504, 8], [8, 264], [248, 264], [264, 248], [504, 248], [264, 264], [504, 264], [264, 504], [504, 504], [8, 504], [248, 504]]) g.fillRect(x - 2, y - 2, 5, 5); }, 3, 3);
  const wallTex = ptex('wallTex', 512, 512, (g, w, h) => {
    g.fillStyle = '#2d4753'; g.fillRect(0, 0, w, h * .62); g.fillStyle = '#4a5636'; g.fillRect(0, h * .62, w, h * .38); speckle(g, w, h, 6000, .1);
    g.strokeStyle = '#13212a'; g.lineWidth = 4; g.strokeRect(0, 0, w, h); g.beginPath(); g.moveTo(0, h * .62); g.lineTo(w, h * .62); g.moveTo(w / 2, 0); g.lineTo(w / 2, h); g.stroke();
    g.fillStyle = '#8fa3ad'; for (let x = 20; x < w; x += 48) for (const y of [14, h * .62 - 14, h - 14]) { g.beginPath(); g.arc(x, y, 3, 0, 6.3); g.fill(); }
    g.fillStyle = '#c9a24a'; g.fillRect(0, h * .62 - 3, w, 4); g.fillStyle = 'rgba(230,200,60,.9)'; for (let x = 0; x < w; x += 32) g.fillRect(x, h - 10, 16, 8); }, 14, 1);
  // height canvas -> normal map (so plates, seams, rivets and ribs catch the light)
  function normalTex(name, w, h, draw, us, vs, k) {
    const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); draw(g, w, h); const src = g.getImageData(0, 0, w, h).data;
    const t = new B.DynamicTexture(name, { width: w, height: h }, sc, true), tg = t.getContext(), out = tg.createImageData(w, h), H = (x, y) => src[(((y + h) % h) * w + ((x + w) % w)) * 4] / 255;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const dx = (H(x + 1, y) - H(x - 1, y)) * k, dy = (H(x, y + 1) - H(x, y - 1)) * k, l = Math.hypot(dx, dy, 1), o = (y * w + x) * 4; out.data[o] = (-dx / l * .5 + .5) * 255; out.data[o + 1] = (dy / l * .5 + .5) * 255; out.data[o + 2] = (1 / l * .5 + .5) * 255; out.data[o + 3] = 255; }
    tg.putImageData(out, 0, 0); t.update(); t.wrapU = t.wrapV = B.Texture.WRAP_ADDRESSMODE; t.uScale = us; t.vScale = vs; return t;
  }
  const RIV = [[8, 8], [248, 8], [8, 248], [248, 248], [264, 8], [504, 8], [8, 264], [248, 264], [264, 248], [504, 248], [264, 264], [504, 264], [264, 504], [504, 504], [8, 504], [248, 504]];
  const floorBump = normalTex('floorN', 512, 512, (g, w, h) => {
    g.fillStyle = '#808080'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { const x = i * 256, y = j * 256; g.fillStyle = '#909090'; g.fillRect(x + 6, y + 6, 244, 244);
      if ((i + j) % 2) { g.save(); g.beginPath(); g.rect(x + 14, y + 14, 228, 228); g.clip(); g.strokeStyle = '#c8c8c8'; g.lineWidth = 5; for (let d = -256; d < 512; d += 20) { g.beginPath(); g.moveTo(x + d, y); g.lineTo(x + d + 256, y + 256); g.stroke(); g.beginPath(); g.moveTo(x + d + 256, y); g.lineTo(x + d, y + 256); g.stroke(); } g.restore(); }
      else { g.fillStyle = '#505050'; for (let a = 0; a < 7; a++) for (let b = 0; b < 7; b++) { g.beginPath(); g.arc(x + 36 + a * 30, y + 36 + b * 30, 4, 0, 6.3); g.fill(); } }
      g.strokeStyle = '#2a2a2a'; g.lineWidth = 7; g.strokeRect(x, y, 256, 256); g.strokeStyle = '#b4b4b4'; g.lineWidth = 3; g.strokeRect(x + 9, y + 9, 238, 238); }
    g.fillStyle = '#d8d8d8'; for (const [x, y] of RIV) { g.beginPath(); g.arc(x, y, 5, 0, 6.3); g.fill(); } }, 3, 3, 1.6);
  const WW = 440, WH = 1024, wallTex2 = ptex('wallTex2', WW, WH, (g, w, h) => {
    g.fillStyle = '#2d4753'; g.fillRect(0, 0, w, h * .62); g.fillStyle = '#4a5636'; g.fillRect(0, h * .62, w, h * .38); speckle(g, w, h, 9000, .1);
    g.fillStyle = 'rgba(0,0,0,.22)'; g.fillRect(46, 70, w - 92, h * .62 - 150); g.fillStyle = 'rgba(0,0,0,.5)'; for (let k = 0; k < 8; k++) g.fillRect(70, h * .18 + k * 30, w - 140, 9);
    g.strokeStyle = '#13212a'; g.lineWidth = 6; g.strokeRect(0, 0, w, h); g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 3; for (let x = 110; x < w; x += 110) { g.beginPath(); g.moveTo(x, h * .62 + 14); g.lineTo(x, h - 40); g.stroke(); }
    g.fillStyle = '#8fa3ad'; for (let y = 24; y < h; y += 70) for (const x of [14, w - 14]) { g.beginPath(); g.arc(x, y, 4, 0, 6.3); g.fill(); }
    g.fillStyle = '#c9a24a'; g.fillRect(0, h * .62 - 5, w, 10); g.fillStyle = 'rgba(230,200,60,.9)'; for (let x = 0; x < w; x += 40) g.fillRect(x, h - 26, 20, 12); }, 1, 1);
  const wallBump = normalTex('wallN', WW, WH, (g, w, h) => {
    g.fillStyle = '#808080'; g.fillRect(0, 0, w, h); g.fillStyle = '#6a6a6a'; g.fillRect(46, 70, w - 92, h * .62 - 150); g.strokeStyle = '#b0b0b0'; g.lineWidth = 4; g.strokeRect(46, 70, w - 92, h * .62 - 150);
    g.fillStyle = '#383838'; for (let k = 0; k < 8; k++) g.fillRect(70, h * .18 + k * 30, w - 140, 9);
    g.strokeStyle = '#303030'; g.lineWidth = 9; g.strokeRect(0, 0, w, h); g.fillStyle = '#b8b8b8'; g.fillRect(0, h * .62 - 5, w, 10); g.strokeStyle = '#555'; g.lineWidth = 5; for (let x = 110; x < w; x += 110) { g.beginPath(); g.moveTo(x, h * .62 + 14); g.lineTo(x, h - 40); g.stroke(); }
    g.fillStyle = '#f0f0f0'; for (let y = 24; y < h; y += 70) for (const x of [14, w - 14]) { g.beginPath(); g.arc(x, y, 5, 0, 6.3); g.fill(); } }, 1, 1, 2.2);
  const floorM = pbr('#ffffff'), wallM = pbr('#ffffff'), brass = pbr('#c9a24a', { metal: .7, rough: .4 }), steel = pbr('#5d7f90', { metal: .5 }), ringM = pbr('#8fb0bd');
  floorM.albedoTexture = floorTex; floorM.bumpTexture = floorBump; floorM.roughness = .92; floorM.metallic = .06; floorM.bumpTexture.level = .55; for (const t of [floorTex, floorBump, wallTex2, wallBump]) t.anisotropicFilteringLevel = 8; wallM.albedoTexture = wallTex2; wallM.bumpTexture = wallBump; wallM.roughness = .75; wallM.metallic = .3;
  
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
  const LOCK_LEN = 4.2, LK = window.AIRLOCK ? AIRLOCK.create() : null; let LKV = null;   // spec: 2.8 m round chamber, 4.2 m long, lying radially from the junction wall through the annulus to the dorsal collar (x about 31)
  // ---- collision: solid props register a room-local box (y relative to the room floor); the player is a .32 m disc. Used by keyboard walking, click-to-walk (A* path planner) and spawn.
  const SOLID = new Set(['console', 'couch', 'messtable', 'reactor', 'pumptower', 'bunk', 'tubebase', 'galley_range', 'galley_fridge', 'suit_locker', 'captain_bunk', 'captain_desk', 'med_cot', 'head_unit', 'shower_pod', 'washer', 'command_chair', 'dc_locker', 'supply_crate', 'warhead']);
  const SOLIDN = /^(ctframe|pellbase|dais_none|table|hub|lockbench|partition|pump|tank|tube|gallery|tower|net|board|crate|post)$/, PR = .32;
  function addObs(node, hint, isMesh) {
    let n = hint; while (n && !(n.metadata && n.metadata.room)) n = n.parent; if (!n) return; let mn, mx;
    if (isMesh) { node.computeWorldMatrix(true); const bb = node.getBoundingInfo().boundingBox; mn = bb.minimumWorld; mx = bb.maximumWorld; } else { const bb = node.getHierarchyBoundingVectors(true); mn = bb.min; mx = bb.max; }
    const p = n.getAbsolutePosition(), r = n.metadata.room, o = { x0: mn.x - p.x, x1: mx.x - p.x, z0: mn.z - p.z, z1: mx.z - p.z, y0: mn.y - p.y, y1: mx.y - p.y };
    if (o.y1 < .25 || !isFinite(o.x0 + o.x1 + o.z0 + o.z1)) return;
    for (const sx of [-1, 1]) { const dx = sx * (r.r - .7); if (dx > o.x0 - PR - .1 && dx < o.x1 + PR + .1 && 0 > o.z0 - PR - .1 && 0 < o.z1 + PR + .1) { (window.OBS_SKIP = window.OBS_SKIP || []).push(r.id + ':' + (node.name || '?')); return; } }   // never block the shaft door stand-points
    (r.obs = r.obs || []).push(o);
  }
  function slot(key, makeFallback, parent, x, y, z, opts) {
    opts = opts || {}; const id = opts.id || key, root = new B.TransformNode('slot:' + id, sc); root.parent = parent; root.position.set(x || 0, y || 0, z || 0);
    const fb = makeFallback(root); slots[id] = { root, fb, glb: false, key };
    const m = manifest[key]; if (!m) return root;
    container(m.file).then(c => {
      const inst = c.instantiateModelsToScene(n => n, false), top = inst.rootNodes[0], holder = new B.TransformNode('glb:' + id, sc); holder.parent = root; top.parent = holder;
      holder.rotation.y = (opts.ry || 0) + (m.ry || 0); if (opts.rz) holder.rotation.z = opts.rz; if (opts.rx) holder.rotation.x = opts.rx;
      const bb = holder.getHierarchyBoundingVectors(true), ext = bb.max.subtract(bb.min), k = (opts.size || m.size_m) / Math.max(ext.x, ext.y, ext.z, 1e-6);
      holder.scaling.setAll(k); const b2 = holder.getHierarchyBoundingVectors(true), cx = (b2.min.x + b2.max.x) / 2 - root.getAbsolutePosition().x, cz = (b2.min.z + b2.max.z) / 2 - root.getAbsolutePosition().z;
      holder.position.x -= cx; holder.position.z -= cz; holder.position.y -= opts.ground ? b2.min.y - root.getAbsolutePosition().y : ((b2.min.y + b2.max.y) / 2 - root.getAbsolutePosition().y);
      holder.position.y += opts.lift || 0; holder.getChildMeshes().forEach(m => { m.isPickable = false; }); fb.setEnabled(false); slots[id].glb = true; slots[id].holder = holder; if (SOLID.has(key)) addObs(holder, root, false); if (opts.onload) opts.onload(holder, root); hud();
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
    const E = HuntRT; E.P.secPerMin = 16; E.RULES.visTier = 1; /* visibility tiers on in the 3D build */ HS.E = E; HS.S = E.newHunt(7, { entry: 'standard', friendly: true }); HS.A = StationAdapter.create({ engine: E, seed: 7, command: 'tight', preset: 'ambush' }); HS.A.update(HS.S, 0); HS.ANN = Annunciator.create();
    LS.ctx.S = HS.S; LS.ctx.E = E; LS.ctx.A = HS.A; LS.ctx.sel = null; window.CTL_HOST = { E, S: () => HS.S, A: () => HS.A, ANN: () => HS.ANN }; window.CTL_INIT(); HS.ok = true; if (window.AUD) AUD.attach(); if (window.SHIPSYS) { HS.Y = SHIPSYS.create(); if (window.PS) Object.assign(PS.ctx, { S: HS.S, E, A: HS.A, Y: HS.Y, ann: HS.ANN.update({ s: HS.S, model: HS.A.model, E }) }); }
  } catch (e) { console.warn('hunt init', e); }
  const scrTex = n => HS.tex[n] || (HS.tex[n] = (() => { const o = LS.make(n), tex = new B.DynamicTexture('scr_' + n, o.c, sc, true, B.Texture.TRILINEAR_SAMPLINGMODE, B.Engine.TEXTUREFORMAT_RGBA, false); o.paint(performance.now()); tex.update(false); const m = new B.StandardMaterial('scrM_' + n, sc); m.disableLighting = true; m.emissiveTexture = tex; m.backFaceCulling = false; return { o, tex, m }; })());
  const polar = (g, a, rad, ry0) => { const n = new B.TransformNode('fx', sc); n.parent = g; n.position.set(Math.cos(a) * rad, 0, Math.sin(a) * rad); n.rotation.y = -a + Math.PI / 2 + (ry0 || 0); return n; };   // local z = radial outward, x = tangent
  const SCRN = [['contacts', 'waterfall'], ['tid', 'tma'], ['engage', 'payload'], ['thermal', 'damage'], ['comms', 'nav']];   // the five CIC stations, left to right
  const SCR_W = .76, SCR_H = .57;   // crewed-station screens: 46% larger than the first pass (.52 x .39)
  function mkScreens(i, top) {
    if (!HS.ok || !top) return;
    SCRN[i].forEach((n, j) => { const t = scrTex(n), p = B.MeshBuilder.CreatePlane('scr:' + n, { width: SCR_W, height: SCR_H, sideOrientation: B.Mesh.DOUBLESIDE }, sc); p.material = t.m; p.parent = top; p.position.set(j ? .2 : -.58, window.SCR_Y == null ? .3 : window.SCR_Y, window.SCR_Z == null ? .06 : window.SCR_Z); p.rotation.set(window.SCR_RX == null ? .17 : window.SCR_RX, Math.PI + (j ? .1 : -.1), Math.PI); p.metadata = { screen: n, station: i, sh: SCR_H }; p.isPickable = true; });
  }
  // passive monitors: read-only wall screens fed by PS painters (annunciator, helm, power, stores, crew, probes)
  const pTex = n => HS.tex[n] || (HS.tex[n] = (() => { const o = PS.make(n), tex = new B.DynamicTexture('pscr_' + n, o.c, sc, true, B.Texture.TRILINEAR_SAMPLINGMODE, B.Engine.TEXTUREFORMAT_RGBA, false); o.paint(performance.now()); tex.update(false); const m = new B.StandardMaterial('pscrM_' + n, sc); m.disableLighting = true; m.emissiveTexture = tex; m.backFaceCulling = false; return { o, tex, m, passive: true }; })());
  function mkPassive(g, n, a, rad, y, w) {
    const nd = polar(g, a, rad), h = w * .75, fr = box('pbezel', w + .1, h + .1, .06, pbr('#0c1418', { metal: .6, rough: .4 }), nd, 0, y, .06); fr.isPickable = false;
    const p = B.MeshBuilder.CreatePlane('pscr:' + n, { width: w, height: h, sideOrientation: B.Mesh.DOUBLESIDE }, sc); p.material = pTex(n).m; p.parent = nd; p.position.set(0, y, -.01); p.rotation.set(0, 0, Math.PI); p.metadata = { screen: n, passive: true, station: -1, sh: h }; p.isPickable = true;
    g.metadata.segAdd(a, [fr, p]); }
  // the Command view wall (docs/command_experience.md): a round overview scope with the six station tiles under it, centred on the front wall of the control room
  function mkOverview(g) {
    const a = Math.PI / 2, nd = polar(g, a, 4.62), ringMat = pbr('#0c1418', { metal: .7, rough: .35 });
    const bz = B.MeshBuilder.CreateTorus('obezel', { diameter: 2.0, thickness: .09, tessellation: 64 }, sc); bz.material = ringMat; bz.parent = nd; bz.position.set(0, 1.78, .06); bz.rotation.x = Math.PI / 2; bz.isPickable = false;
    const gl = B.MeshBuilder.CreateTorus('oglow', { diameter: 2.12, thickness: .03, tessellation: 64 }, sc); gl.material = pbr('#101010', { emit: '#3ddbd0', ei: 1.2 }); gl.parent = nd; gl.position.set(0, 1.78, .05); gl.rotation.x = Math.PI / 2; gl.isPickable = false; life.glow.push({ m: gl.material, lo: .5, hi: 1.3, sp: .9 });
    const d = B.MeshBuilder.CreateDisc('pscr:overview', { radius: .96, tessellation: 64, sideOrientation: B.Mesh.DOUBLESIDE }, sc); d.material = pTex('overview').m; d.parent = nd; d.position.set(0, 1.78, -.01); d.rotation.set(0, 0, 0); d.scaling.x = -1; d.metadata = { screen: 'overview', passive: true, station: -1, sh: 1.92, fit: 1.3 }; d.isPickable = true;
    const tb = box('tbezel', 3.1, .55, .06, ringMat, nd, 0, .44, .06); tb.isPickable = false;
    const tl = B.MeshBuilder.CreatePlane('pscr:tiles', { width: 3.0, height: .5, sideOrientation: B.Mesh.DOUBLESIDE }, sc); tl.material = pTex('tiles').m; tl.parent = nd; tl.position.set(0, .44, -.01); tl.rotation.set(0, 0, Math.PI); tl.metadata = { screen: 'tiles', passive: true, station: -1, sh: .5 }; tl.isPickable = true;
    g.metadata.segAdd(a, [bz, gl, d, tb, tl]); }
  const roomG = {};
  const crewSlot = (g, id, x, z, ry, lift) => slot('crew', rt => B.MeshBuilder.CreateCapsule('cfb', { radius: .22, height: 1.2 }, sc), g, x, 0, z, { id, ry, ground: true, lift: lift || 0, onload: h => life.crew.push({ h, ph: Math.random() * 6.3 }) });
  // ---- set dressing helpers (all cosmetic): ladders, netted supply shelves, bunk pods, head fixtures
  const matC = {}, cm = (c, o) => matC[c + (o ? JSON.stringify(o) : '')] || (matC[c + (o ? JSON.stringify(o) : '')] = pbr(c, o));
  const netTex = ptex('netTex', 128, 128, (g, w, h) => { g.clearRect(0, 0, w, h); g.strokeStyle = 'rgba(190,205,200,.85)'; g.lineWidth = 3; for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(i * 16, 0); g.lineTo(i * 16, h); g.moveTo(0, i * 16); g.lineTo(w, i * 16); g.stroke(); } }, 6, 4);
  netTex.hasAlpha = true;
  const netM = new B.StandardMaterial('netM', sc); netM.diffuseTexture = netTex; netM.useAlphaFromDiffuseTexture = true; netM.emissiveColor = new B.Color3(.45, .5, .48); netM.backFaceCulling = false; netM.specularColor = B.Color3.Black();
  const CRATE = ['#6b7a3a', '#8a6a3a', '#4f6f86', '#b5543a', '#7d8a8f', '#c9a24a'];
  function ladder(g, x, y0, z, L, ry) {   // vertical ladder, rails along local y, rungs along z; yaw ry
    const ms = [], rm = cm('#b9c2c6', { metal: .8, rough: .35 });
    for (const s of [-1, 1]) { const r = B.MeshBuilder.CreateBox('rail', { width: .05, height: L, depth: .05 }, sc); r.position.set(0, L / 2, s * .28); ms.push(r); }
    for (let y = .25; y < L; y += .3) { const r = B.MeshBuilder.CreateBox('rung', { width: .04, height: .04, depth: .56 }, sc); r.position.set(0, y, 0); ms.push(r); }
    const m = B.Mesh.MergeMeshes(ms, true); m.name = 'ladder'; m.material = rm; m.parent = g; m.position.set(x, y0, z); m.rotation.y = ry || 0; m.isPickable = false; return m;
  }
  function shelf(g, cx, cy, cz, rot) {   // netted supply rack: 4 posts, 4 boards, crates, netting over the open face (+local x)
    const n = new B.TransformNode('shelf', sc); n.parent = g; n.position.set(cx, cy, cz); n.rotation.y = rot || 0; const L = 3.0, W = 1.5, H = 2.4, fm = cm('#8f9ea6', { metal: .7, rough: .4 });
    for (const a of [-1, 1]) for (const b of [-1, 1]) box('post', .06, H, .06, fm, n, a * L / 2, 0, b * W / 2).isPickable = false;
    for (let k = 0; k < 4; k++) { const y = -H / 2 + k * (H / 3); box('board', L, .05, W, fm, n, 0, y, 0).isPickable = false;
      if (k < 3) for (let q = 0; q < 3; q++) { const w = .55 + rnd() * .35, hh = .3 + rnd() * .3, d = .5 + rnd() * .5; box('crate', w, hh, d, cm(CRATE[(k * 3 + q + Math.abs(cx * 7 | 0)) % 6], { rough: .8, metal: .1 }), n, -L / 2 + .55 + q * 1.0, y + .025 + hh / 2, (rnd() - .5) * (W - d)).isPickable = false; } }
    const net = B.MeshBuilder.CreatePlane('net', { width: W, height: H, sideOrientation: B.Mesh.DOUBLESIDE }, sc); net.material = netM; net.parent = n; net.position.x = L / 2 + .02; net.rotation.y = Math.PI / 2; net.isPickable = false;
  }
  const bunkPod = (g, wx, cy, wz) => {   // 8 racks: 4 high x 2 columns (rack length runs fore-aft in the hall), mattress slab in a steel frame, curtain on the aisle side
    const n = new B.TransformNode('pod', sc); n.parent = g; n.position.set(wx, cy, wz); n.rotation.y = -Math.PI / 2; const s = wx > 0 ? 1 : -1, fm = cm('#8f9ea6', { metal: .7, rough: .4 });
    for (let c = 0; c < 2; c++) for (let k = 0; k < 4; k++) { const x = (c ? 1 : -1) * .97, y = k * .8;
      box('rackframe', 1.9, .06, .8, fm, n, x, y, 0).isPickable = false;
      box('mattress', 1.8, .14, .7, cm(['#3b5a6b', '#6b4a3a', '#4a5636'][(c + k) % 3], { rough: .95, metal: 0 }), n, x, y + .1, 0).isPickable = false;
      box('curtain', 1.9, .5, .03, cm('#2f3a40', { rough: .95, metal: 0 }), n, x, y + .38, s * .4).isPickable = false; }
    for (const px of [-1.95, 0, 1.95]) box('rackpost', .06, 3.3, .06, fm, n, px, 1.45, -s * .4).isPickable = false;
  };
  const face = a => Math.atan2(-Math.cos(a), -Math.sin(a));   // yaw that turns a +z-facing model toward the room centre from polar angle a
  const lockM = pbr('#2d4753', { metal: .3, rough: .7, alpha: .22 }); lockM.backFaceCulling = false;
  function galley(g) {   // the galley crescent along the forward wall of the mess: cold stores, ranges, a prep counter and a crate stack
    [['galley_fridge', .85, 1.9, 'gfridge0'], ['galley_fridge', 1.12, 1.9, 'gfridge1'], ['galley_range', 1.45, 1.5, 'grange0'], ['galley_range', 1.85, 1.5, 'grange1'], ['galley_range', 2.25, 1.5, 'gprep'], ['supply_crate', 2.6, 1.0, 'gcrate']]
      .forEach(([k, a, size, id]) => slot(k, rt => box('gfb', size * .7, k === 'galley_fridge' ? 1.9 : 1.0, .7, steel, rt, 0, k === 'galley_fridge' ? .95 : .5, 0), g, Math.cos(a) * 4.3, 0, Math.sin(a) * 4.3, { id, ry: face(a), ground: true, size })); }
  function airlock(g, r) {   // boarding lock off the dorsal (-z) wall: 2.8 m round chamber lying radially through the annulus to the collar, six suit lockers, bench, inner and outer iris doors, status lamps, soft-dock tube
    const len = LOCK_LEN, zc = -(r + len / 2), zo = -(r + len), tub = B.MeshBuilder.CreateCylinder('lock', { diameter: 2.8, height: len, tessellation: 40, sideOrientation: B.Mesh.DOUBLESIDE }, sc);
    tub.material = lockM; tub.parent = g; tub.position.set(0, 1.0, zc); tub.rotation.x = Math.PI / 2; tub.isPickable = false;
    const dk = box('lockdeck', 1.96, .1, len, floorM, g, 0, -.05, zc); dk.metadata = { floor: 'B2' };
    for (let k = 0; k < 3; k++) for (const sx of [-1, 1]) slot('suit_locker', rt => box('lkfb', .6, 2.0, .6, pbr('#5d7f90'), rt, 0, 1.0, 0), g, sx * .74, 0, -(r + .7 + k * .85), { id: 'suit' + k + (sx < 0 ? 'p' : 's'), ry: sx < 0 ? Math.PI / 2 : -Math.PI / 2, ground: true, size: 2.0 });
    box('lockbench', 1.2, .45, .4, steel, g, 0, .22, zo + .45).isPickable = false;
    const gate = B.MeshBuilder.CreateTorus('lockgate', { diameter: 2.0, thickness: .12, tessellation: 40 }, sc); gate.material = brass; gate.parent = g; gate.position.set(0, 1.0, -(r - .02)); gate.rotation.x = Math.PI / 2; gate.isPickable = false;
    const disc = (nm, d, z, m) => { const q = B.MeshBuilder.CreateCylinder(nm, { diameter: d, height: .1, tessellation: 40 }, sc); q.material = m; q.parent = g; q.position.set(0, 1.0, z); q.rotation.x = Math.PI / 2; q.isPickable = false; return q; };
    const idoor = disc('lockidoor', 1.88, -(r - .02), pbr('#3c4f59', { metal: .6, rough: .45 })), odoor = disc('lockodoor', 1.22, zo + .1, pbr('#2c3a42', { metal: .6, rough: .5 }));
    slot('airlock_door', rt => { const d = B.MeshBuilder.CreateTorus('door', { diameter: 1.3, thickness: .12 }, sc); d.material = brass; d.parent = rt; d.rotation.x = Math.PI / 2; return d; }, g, 0, 1.0, zo + .05, { id: 'lockouter', ry: 0, size: 1.3 });
    // dorsal collar: fairing neck through the skin, 2.2 m yellow-black hazard ring, brass bolts
    const fair = B.MeshBuilder.CreateCylinder('lockfair', { diameter: 3.2, height: 1.4, tessellation: 32 }, sc); fair.material = pbr('#222e35', { metal: .6, rough: .45 }); fair.parent = g; fair.rotation.x = Math.PI / 2; fair.position.set(0, 1.0, zo + .7); fair.isPickable = false;
    const hazT = ptex('haz', 256, 32, (c, w, h) => { c.fillStyle = '#e0b020'; c.fillRect(0, 0, w, h); c.fillStyle = '#16181a'; for (let x = -h; x < w; x += 32) { c.beginPath(); c.moveTo(x, h); c.lineTo(x + 16, h); c.lineTo(x + 16 + h, 0); c.lineTo(x + h, 0); c.fill(); } }), hazM = new B.StandardMaterial('hazM', sc); hazM.diffuseTexture = hazT; hazM.specularColor = new B.Color3(.1, .1, .1);
    const col = B.MeshBuilder.CreateTorus('lockcollar', { diameter: 2.4, thickness: .3, tessellation: 48 }, sc); col.material = hazM; col.parent = g; col.rotation.x = Math.PI / 2; col.position.set(0, 1.0, zo - .02); col.isPickable = false;
    for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283, bolt = B.MeshBuilder.CreateCylinder('colbolt', { diameter: .09, height: .06, tessellation: 8 }, sc); bolt.material = brass; bolt.parent = g; bolt.rotation.x = Math.PI / 2; bolt.position.set(Math.cos(a) * 1.2, 1.0 + Math.sin(a) * 1.2, zo - .18); bolt.isPickable = false; }
    // status lamps over the inner gate (inner, cycle, outer)
    const lamp = x => { const q = B.MeshBuilder.CreateBox('locklamp', { width: .16, height: .16, depth: .05 }, sc); const m = new B.StandardMaterial('lockLampM', sc); m.disableLighting = true; m.emissiveColor = new B.Color3(.1, .1, .1); q.material = m; q.parent = g; q.position.set(x, 2.25, -(r + .1)); q.isPickable = false; return m; };
    // soft-dock tube (telescopes out along -z) and the mated hull
    const tubeN = new B.TransformNode('locktube', sc); tubeN.parent = g; tubeN.position.set(0, 1.0, zo); const tm = pbr('#3a4a52', { metal: .5, rough: .6 });
    const tcy = B.MeshBuilder.CreateCylinder('lockbellows', { diameter: 1.9, height: 6, tessellation: 32, sideOrientation: B.Mesh.DOUBLESIDE }, sc); tcy.material = tm; tcy.parent = tubeN; tcy.rotation.x = Math.PI / 2; tcy.position.z = -3; tcy.isPickable = false;
    for (let i = 1; i <= 6; i++) { const rg = B.MeshBuilder.CreateTorus('lockrib', { diameter: 1.95, thickness: .07, tessellation: 32 }, sc); rg.material = brass; rg.parent = tubeN; rg.rotation.x = Math.PI / 2; rg.position.z = -i + .5; rg.isPickable = false; }
    tubeN.scaling.z = .001;
    const vesN = new B.TransformNode('lockvessel', sc); vesN.parent = g; const vm = pbr('#44525c', { metal: .6, rough: .5 }); const hullV = B.MeshBuilder.CreateCylinder('vhull', { diameter: 4.6, height: 12, tessellation: 32 }, sc); hullV.material = vm; hullV.parent = vesN; hullV.rotation.z = Math.PI / 2; hullV.position.z = -2.3; hullV.isPickable = false;
    const vcol = B.MeshBuilder.CreateTorus('vcollar', { diameter: 2.4, thickness: .3, tessellation: 40 }, sc); vcol.material = hazM; vcol.parent = vesN; vcol.rotation.x = Math.PI / 2; vcol.isPickable = false; vesN.setEnabled(false);
    for (const i of [17, 18]) g.metadata.segs[i].items.forEach(m => { m.isVisible = false; });   // open the bulkhead where the lock joins
    LKV = { idoor, odoor, tubeN, vesN, vm, lI: lamp(-.3), lC: lamp(0), lO: lamp(.3), r, ci: 1, co: 1 };
  }
  // ---- control room fit-out (pass 3): ceiling collar, command dais, chart table with Abara's locked drawer, Pell's pedestal, brace points (rails, belts, handholds) tagged for the brace system
  const hazTex = ptex('hazTex', 128, 32, (g, w, h) => { g.fillStyle = '#e8c23a'; g.fillRect(0, 0, w, h); g.fillStyle = '#141414'; for (let x = -h; x < w; x += 32) { g.beginPath(); g.moveTo(x, h); g.lineTo(x + 16, h); g.lineTo(x + 16 + h, 0); g.lineTo(x + h, 0); g.closePath(); g.fill(); } }, 1, 1);
  const hazM = new B.StandardMaterial('hazM', sc); hazM.diffuseTexture = hazTex; hazM.emissiveColor = new B.Color3(.18, .15, .03); hazM.specularColor = B.Color3.Black();
  const chartTex = ptex('chartTex', 512, 320, (g, w, h) => { g.fillStyle = '#cfc7a8'; g.fillRect(0, 0, w, h); speckle(g, w, h, 1800, .06); g.strokeStyle = 'rgba(40,60,70,.35)'; g.lineWidth = 1; for (let x = 0; x < w; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } for (let y = 0; y < h; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    g.strokeStyle = 'rgba(30,50,60,.6)'; g.lineWidth = 2; for (let i = 1; i < 6; i++) { g.beginPath(); g.arc(150, 170, i * 46, 0, 7); g.stroke(); } g.strokeStyle = '#a8321f'; g.lineWidth = 3; g.beginPath(); g.moveTo(150, 170); g.lineTo(330, 80); g.lineTo(440, 120); g.stroke(); g.fillStyle = '#a8321f'; for (const [x, y] of [[330, 80], [440, 120]]) { g.beginPath(); g.arc(x, y, 6, 0, 7); g.fill(); } g.fillStyle = '#1b3a52'; g.font = 'bold 14px monospace'; g.fillText('DRIFT 1.4', 20, 24); g.fillText('SECTOR CHART', 360, 300); }, 1, 1);
  const chartM = new B.StandardMaterial('chartM', sc); chartM.diffuseTexture = chartTex; chartM.specularColor = B.Color3.Black(); chartM.emissiveColor = new B.Color3(.12, .12, .1);
  const ceilTex = ptex('ceilTex', 256, 256, (g, w, h) => { g.fillStyle = '#26363e'; g.fillRect(0, 0, w, h); speckle(g, w, h, 1500, .08); g.strokeStyle = '#0e171c'; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6); g.fillStyle = '#c9a24a'; for (const [x, y] of [[14, 14], [w - 14, 14], [14, h - 14], [w - 14, h - 14]]) g.fillRect(x - 3, y - 3, 6, 6); }, 1, 1);
  const ceilM = pbr('#ffffff', { metal: .3, rough: .7 }); ceilM.albedoTexture = ceilTex;
  const lampM = pbr('#101010', { emit: '#bfe6ff', ei: .9 });
  function cicDress(g, r, h) {
    const BP = g.metadata.brace = [];   // brace points: { x, z, y, type, seat? } in room-local metres
    // ceiling collar: 24 panels between the console ring and the wall, each tied to its wall segment so it fades with it; a lamp strip in each
    for (let i = 0; i < 24; i++) { const a = (i + .5) * 2 * Math.PI / 24, rr = r - .75, pn = box('ceil', 1.15, .08, 1.5, ceilM, g, Math.cos(a) * rr, h - .05, Math.sin(a) * rr); pn.rotation.y = -a + Math.PI / 2; pn.isPickable = false;
      const ln = box('ceillamp', .7, .03, .12, lampM, g, Math.cos(a) * (rr - .1), h - .1, Math.sin(a) * (rr - .1)); ln.rotation.y = -a + Math.PI / 2; ln.isPickable = false; (g.metadata.ceil = g.metadata.ceil || []).push(pn, ln); }
    life.glow.push({ m: lampM, lo: .7, hi: 1.0, sp: .3 });
    // pipe and cable runs high on the wall
    for (const [yy, d, c] of [[2.62, .07, '#7f95a1'], [2.74, .05, '#a8321f'], [2.5, .045, '#c9a24a']]) { const t = B.MeshBuilder.CreateTorus('pipe', { diameter: (r - .12) * 2, thickness: d, tessellation: 72 }, sc); t.material = pbr(c, { metal: .6, rough: .4 }); t.parent = g; t.position.y = yy; t.isPickable = false; }
    // command dais under the chair: a low round step with a compass inlay and a lit edge
    { const dm = pbr('#ffffff', { metal: .35, rough: .6 }); dm.albedoTexture = ptex('daisTex', 256, 256, (q, w, hh) => { q.fillStyle = '#2b3f49'; q.fillRect(0, 0, w, hh); speckle(q, w, hh, 2000, .1); q.strokeStyle = '#c9a24a'; q.lineWidth = 3; q.beginPath(); q.arc(128, 128, 112, 0, 7); q.stroke(); q.beginPath(); q.arc(128, 128, 70, 0, 7); q.stroke(); for (let d = 0; d < 360; d += 30) { const an = d * Math.PI / 180; q.beginPath(); q.moveTo(128 + Math.cos(an) * 70, 128 + Math.sin(an) * 70); q.lineTo(128 + Math.cos(an) * 112, 128 + Math.sin(an) * 112); q.stroke(); } q.fillStyle = '#c9a24a'; q.beginPath(); q.moveTo(128, 8); q.lineTo(138, 40); q.lineTo(118, 40); q.closePath(); q.fill(); }, 1, 1);
      const dais = cyl('dais', 3.0, .14, dm, g, 0, .07, -.9); dais.isPickable = false; const edge = B.MeshBuilder.CreateTorus('daisedge', { diameter: 3.0, thickness: .04, tessellation: 64 }, sc); edge.material = pbr('#101010', { emit: '#e0a020', ei: .9 }); edge.parent = g; edge.position.set(0, .14, -.9); edge.isPickable = false; }
    // chart table: legs, a slightly tilted chart top with a lamp, a locked drawer (newer lock than the table)
    { const tx = -2.2, tz = .9, tm = pbr('#3b4a52', { metal: .5, rough: .5 }); const top = box('ctable', 1.6, .08, 1.0, chartM, g, tx, .86, tz); top.rotation.x = .06; const fr = box('ctframe', 1.7, .06, 1.1, tm, g, tx, .8, tz);
      for (const [dx, dz] of [[-.75, -.45], [.75, -.45], [-.75, .45], [.75, .45]]) box('ctleg', .08, .8, .08, tm, g, tx + dx, .4, tz + dz);
      const dr = box('ctdrawer', .9, .2, .06, pbr('#4a5a62', { metal: .6, rough: .4 }), g, tx, .64, tz + .53); const lk = box('ctlock', .1, .08, .03, pbr('#d9d9d9', { metal: .9, rough: .25 }), g, tx + .3, .64, tz + .57);
      const lamp = box('ctlamp', .06, .5, .06, tm, g, tx + .6, 1.1, tz - .3), lh = box('ctlamph', .25, .06, .15, pbr('#101010', { emit: '#ffd9a0', ei: 1.2 }), g, tx + .6, 1.36, tz - .3); life.glow.push({ m: lh.material, lo: .9, hi: 1.2, sp: .5 });
      for (const q of [top, fr, dr, lk, lamp, lh]) q.isPickable = false;
      for (const [dx, dz] of [[-.82, 0], [.82, 0], [0, -.55], [0, .55]]) BP.push({ x: tx + dx, z: tz + dz, y: 1, type: 'rail' });
      const rl = pbr('#e8c23a', { metal: .4, rough: .5 }); for (const [dx, dz, w2, d2] of [[0, -.6, 1.8, .04], [0, .6, 1.8, .04], [-.86, 0, .04, 1.2], [.86, 0, .04, 1.2]]) { const rr2 = box('ctrail', w2, .04, d2, rl, g, tx + dx, 1.0, tz + dz); rr2.isPickable = false; } }
    // Pell's pedestal (the red key slot, dead): beside the command dais
    { const px = 1.9, pz = -.6, pm = pbr('#2a3a42', { metal: .6, rough: .4 }); cyl('pellbase', .6, .9, pm, g, px, .45, pz).isPickable = false; const top2 = cyl('pelltop', .72, .08, pm, g, px, .94, pz); top2.isPickable = false;
      const core = B.MeshBuilder.CreateTorus('pellcore', { diameter: .46, thickness: .035, tessellation: 40 }, sc); core.material = pbr('#101010', { emit: '#e8a030', ei: 1 }); core.parent = g; core.position.set(px, .99, pz); core.isPickable = false; life.glow.push({ m: core.material, lo: .3, hi: 1.4, sp: .7 });
      const slot2 = box('pellslot', .16, .02, .05, pbr('#050505'), g, px, .99, pz); slot2.isPickable = false; box('pellkey', .1, .02, .035, pbr('#101010', { emit: '#7a1410', ei: .4 }), g, px, 1.0, pz).isPickable = false; }
    // brace points: belts at each station couch and the command chair, handholds flanking each console and locker, grab bars by the hatches
    const belt = (x, y, z, ry, tag) => { const b1 = box('belt', .06, .5, .02, hazM, g, x, y, z), b2 = box('belt', .06, .5, .02, hazM, g, x, y, z); b1.rotation.set(0, ry, .5); b2.rotation.set(0, ry, -.5); b1.isPickable = b2.isPickable = false; BP.push({ x, z, y, type: 'belt', tag }); };
    for (let i = 0; i < 5; i++) { const a = -1.2 + i * .6, sx = Math.sin(a) * 3.15, sz = -Math.cos(a) * 3.15; belt(sx, .62, sz, -a + Math.PI, 'station' + i); }
    belt(0, .62, -.9 + .25, 0, 'command');
    for (let i = 0; i < 10; i++) { const a = -1.5 + i * .33 - (i > 4 ? 0 : 0), hx = Math.sin(a) * (r - .25), hz = -Math.cos(a) * (r - .25); const bar = box('handhold', .05, .55, .05, pbr('#e8c23a', { metal: .4, rough: .5 }), g, hx, 1.2, hz); bar.isPickable = false; BP.push({ x: hx, z: hz, y: 1.2, type: 'handhold' }); }
    for (const sx of [-1, 1]) { const bar = box('hatchbar', .05, .9, .05, pbr('#e8c23a', { metal: .4, rough: .5 }), g, sx * (r - .3), 1.0, .85); bar.isPickable = false; BP.push({ x: sx * (r - .3), z: .85, y: 1.0, type: 'handhold' }); }
    window.BRACE_POINTS = window.BRACE_POINTS || {}; window.BRACE_POINTS.A1 = BP;
    // one soft cyan fill from the scope so the front of the room reads
    const L = new B.PointLight('scopeFill', new B.Vector3(0, 2.0, 3.5), sc); L.parent = g; L.diffuse = B.Color3.FromHexString('#7fe8ff'); L.intensity = .5; L.range = 7;
  }
  function prop(kind, g, r, h) {
    if (kind === 'cic') {
      // five stations on the aft arc: a console on the wall, a seat and a crew member in front of it facing the screens
      for (let i = 0; i < 5; i++) { const a = -1.2 + i * .6, s = Math.sin(a), c = -Math.cos(a);
        slot('console', rt => box('consfb', 2, .9, .7, steel, rt, 0, .45, 0), g, s * 4.15, 0, c * 4.15, { id: 'console' + i, ry: -a, ground: true, onload: h => mkScreens(i, h.getChildren()[0]) });
        slot('couch', rt => box('couch', 1.2, .5, .6, pbr('#4a4f7a'), rt, 0, .25, 0), g, s * 3.15, 0, c * 3.15, { id: 'couch' + i, ry: -a + Math.PI, ground: true, size: 1.15 });
        crewSlot(g, 'crew' + i, s * 3.33, c * 3.33, Math.PI - a, 0); }
      cicDress(g, r, h);
      slot('abara', rt => B.MeshBuilder.CreateCapsule('abfb', { radius: .24, height: 1.7 }, sc), g, -2.2, 0, 1.95, { id: 'abara', ry: Math.PI, ground: true });   // Abara stands at the chart table, glasses on, looking down at the plot
      slot('command_chair', rt => box('chairfb', .7, .9, .7, pbr('#4a4f7a'), rt, 0, .45, 0), g, 0, 0, -.9, { id: 'cochair', ry: 0, ground: true, size: 1.2 });
      if (HS.ok) { mkOverview(g); [['annun', -.72, 2.05], ['helm', -.72, 1.0], ['power', -1.08, 2.05], ['crew', .72, 2.05], ['stores', .72, 1.0], ['probes', 1.08, 2.05]].forEach(([n, d, y]) => mkPassive(g, n, Math.PI / 2 + d, 4.62, y, 1.15)); }
      for (const a of [.5, 2.65]) slot('dc_locker', rt => box('dcfb', .8, 1.6, .4, pbr('#8a2a22'), rt, 0, .8, 0), g, Math.cos(a) * 4.5, 0, Math.sin(a) * 4.5, { id: 'dclocker' + (a < 1 ? 0 : 1), ry: face(a), ground: true, size: 1.2 }); }
    else if (kind === 'berths') {
      for (let i = 0; i < 3; i++) { const a = i * 2.094 + .5; slot('bunk', rt => box('bunk', 2.2, 1.6, .9, steel, rt, 0, .8, 0), g, Math.cos(a) * 3.3, 0, Math.sin(a) * 3.3, { id: 'bunk' + i, ry: -a - Math.PI / 2, ground: true, size: 2.2 }); }
      crewSlot(g, 'crewB', 2.4, -2.1, 2.4, 0);
      // the captain's stateroom: a closed 3.4 m round pod under the CIC floor hatch, with the only door on the ship that closes
      const pm = pbr('#34505c', { metal: .3, rough: .7 }); pm.backFaceCulling = false; const NP = 16, DP = 2 * Math.PI / NP, walls = [];
      for (let i = 0; i < NP; i++) { if (i === 3 || i === 4) continue; const w = B.MeshBuilder.CreateCylinder('podwall' + i, { diameter: 3.4, height: 2.3, tessellation: 4, arc: 1 / NP, sideOrientation: B.Mesh.DOUBLESIDE }, sc); w.material = pm; w.parent = g; w.position.y = 1.15; w.rotation.y = -((i + 1.5) * DP); w.isPickable = false; walls.push(w); }
      const pf = cyl('podfloor', 3.4, .08, floorM, g, 0, .04, 0); pf.isPickable = false; g.metadata.pod = { walls, r: 1.7 };
      slot('captain_bunk', rt => box('cbfb', 2.1, .6, .9, steel, rt, 0, .3, 0), g, 0, 0, -.95, { id: 'cobunk', ry: face(-Math.PI / 2), ground: true, size: 2.1 });
      slot('captain_desk', rt => box('cdfb', 1.6, .8, .6, steel, rt, 0, .4, 0), g, Math.cos(2.45) * 1.0, 0, Math.sin(2.45) * 1.0, { id: 'codesk', ry: face(2.45), ground: true, size: 1.5 });
      slot('airlock_door', rt => { const d = B.MeshBuilder.CreateTorus('door', { diameter: 1.2, thickness: .1 }, sc); d.material = brass; d.parent = rt; d.rotation.x = Math.PI / 2; return d; }, g, 0, 1.0, 1.66, { id: 'stateroomdoor', ry: Math.PI, size: 1.25 }); }
    else if (kind === 'mess') { slot('messtable', rt => { const t = B.MeshBuilder.CreateTorus('tbl', { diameter: 5.2, thickness: .9, tessellation: 40 }, sc); t.material = steel; t.parent = rt; t.position.y = .85; return t; }, g, 0, 0, 0, { id: 'messtable', ground: true, size: 4.4 }); crewSlot(g, 'crewM1', 1.7, 0, -1.57, 0); crewSlot(g, 'crewM2', -1.2, 1.2, 2.4, 0); for (const [k, a] of [[3, 1.2], [4, 3.9], [5, 5.2]]) crewSlot(g, 'crewM' + k, Math.cos(a) * 1.7, Math.sin(a) * 1.7, -a - Math.PI / 2, 0); galley(g); }
    else if (kind === 'junction') { for (const a of [0, 1.571, 3.142, 4.712]) { const t = B.MeshBuilder.CreateTorus('hatch', { diameter: 1.2, thickness: .12 }, sc); t.material = brass; t.parent = g; t.position.set(Math.cos(a) * (r - .1), 1.2, Math.sin(a) * (r - .1)); t.rotation.z = Math.PI / 2; t.rotation.y = a; } cyl('hub', 1, 2.9, steel, g, 0, 1.45, 0); airlock(g, r); }
    else if (kind === 'utility') {   // the head: 3 toilet stalls, 2 shower pods, 2 washers, sickbay cot and medical locker (spec: heads, showers, laundry, sickbay)
      const wh = cm('#d7dcdc', { rough: .5, metal: .2 }), pan = cm('#3a4c56', { rough: .6, metal: .4 }), blue = cm('#4f86a8', { rough: .2, metal: .1, alpha: .35 }), chrome = cm('#b9c2c6', { metal: .9, rough: .25 });
      [1.3, 1.6, 1.9].forEach((a, k) => { const n = polar(g, a, 3.35);
        box('stalldoor', .9, 1.7, .04, pan, n, 0, 1.0, -.62).isPickable = false;
        for (const sx of [-.47, .47]) box('partition', .04, 1.9, 1.3, pan, n, sx, .95, -.05).isPickable = false;
        slot('head_unit', rt => { const q = new B.TransformNode('headfb', sc); q.parent = rt; cyl('bowl', .38, .34, wh, q, 0, .17, 0); box('tank', .4, .45, .16, wh, q, 0, .55, .25); return q; }, n, 0, 0, .3, { id: 'head' + k, ry: Math.PI, ground: true, size: 1.0 });
        box('stallmark', .12, .12, .02, cm('#101010', { emit: '#3fd38a', ei: 1 }), n, 0, 1.75, -.64).isPickable = false; });
      [4.75, 5.25].forEach((a, k) => { const n = polar(g, a, 3.1); slot('shower_pod', rt => { cyl('shower', 1.0, 2.2, blue, rt, 0, 1.1, 0); return rt.getChildren()[0]; }, n, 0, 0, 0, { id: 'shower' + k, ry: Math.PI, ground: true, size: 1.7 }); });
      [3.8, 4.15].forEach((a, k) => { const n = polar(g, a, 3.25); slot('washer', rt => { box('washer', .85, .95, .75, wh, rt, 0, .48, 0); return rt.getChildren()[0]; }, n, 0, 0, 0, { id: 'washer' + k, ry: Math.PI, ground: true, size: .95 }); });
      { const n = polar(g, .75, 2.7); slot('med_cot', rt => { box('cot', .8, .45, 2.0, wh, rt, 0, .45, 0); return rt.getChildren()[0]; }, n, 0, 0, 0, { id: 'medcot', ry: Math.PI, ground: true, size: 2.0 }); }
      { const n = polar(g, .4, 3.7); slot('dc_locker', rt => { box('medcab', .9, 1.6, .4, wh, rt, 0, 1.0, 0); return rt.getChildren()[0]; }, n, 0, 0, 0, { id: 'medlocker', ry: Math.PI, ground: true, size: 1.2 }); }
    }
    else if (kind === 'array') cyl('tower', 2, 2.2, steel, g, 0, 1.1, 0);
    else if (kind === 'thermal') { slot('pumptower', rt => cyl('tower', 2.8, 2.9, steel, rt, 0, 1.45, 0), g, 0, 0, 0, { id: 'pumptower', ground: true, size: 2.85 }); for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283; cyl('pump', .5, 1.2, brass, g, Math.cos(a) * 2.8, .6, Math.sin(a) * 2.8); } }
    else if (kind === 'sink' || kind === 'valve') for (let i = 0; i < 5; i++) { const a = i / 5 * 6.283; cyl('tank', .6, 2, pbr('#c9822b'), g, Math.cos(a) * 3.4, 1, Math.sin(a) * 3.4); }
    else if (kind === 'reactor') { slot('reactor', rt => cyl('core', 6, h + 6, pbr('#b5543a'), rt, 0, 0, 0), g, 0, 0, 0, { id: 'reactor', ground: true, size: 5.6 }); cyl('well', 8.4, .2, pbr('#4a2a24'), g, 0, .1, 0); const core = pbr('#ff7a2a', { emit: '#ff6a1a', ei: 1 }); const gl = B.MeshBuilder.CreateTorus('coreglow', { diameter: 5.6, thickness: .12, tessellation: 48 }, sc); gl.material = core; gl.parent = g; gl.position.y = 1.2; life.glow.push({ m: core, lo: .5, hi: 1.6, sp: 1.3 }); }
    else if (kind === 'tubes') {
      // axes (spec): dorsal is -z (the 24 tube caps sit on the dorsal line), port and starboard are -x/+x (the stair shafts), the ventral gallery is +z. Local y runs aft to forward.
      const cols = ['#3ec8e0', '#e0a020', '#e0a020', '#e0a020', '#e0a020', '#4a7cff', '#e8d23a', '#e8d23a', '#e8d23a', '#e8d23a', '#e8d23a', '#e8d23a'];
      for (let i = 0; i < 12; i++) for (const sx of [-1, 1]) { const tm = pbr('#33566a', { emit: cols[i], ei: .6 }); life.glow.push({ m: tm, lo: .25, hi: .9, sp: .6 + i * .07, ph: i * .5 + (sx > 0 ? 1.7 : 0) }); const t = cyl('tube', 2.3, 8.6, tm, g, sx * 2.2, h - 2.35 - 2.45 * i, -2.7); t.rotation.x = Math.PI / 2; }
      box('gallery', 3, 29.4, 1, pbr('#2e5a4a'), g, 0, h - 1.2 - 14.7, 4.2);
      // netted supply shelves in the aisle between the two tube columns, each with a crate stack; ladders up the hall; crew pods on the flanks; spares on the gallery
      for (const i of [1, 3, 5, 7, 9, 11]) { const y = h - 2.35 - 2.45 * i + .6; shelf(g, 0, y, -3.2, -Math.PI / 2); slot('supply_crate', rt => box('cratefb', .8, .7, .8, cm('#6b7a3a'), rt, 0, .35, 0), g, 0, y - .4 + .025, -2.7, { id: 'stack' + i, ry: 0, ground: true, size: .9 }); }
      ladder(g, 0, 1.0, -0.3, h - 2.0, -Math.PI / 2); ladder(g, 0, 1.0, 2.9, h - 2.0, -Math.PI / 2);
      { const lm = pbr('#51606a', { metal: .6, rough: .5 }); for (const lv of [5, 15, 25]) { box('landing', 2.0, .12, 4.7, lm, g, 0, lv - .06, 1.15); for (const [bx, bz, bw, bd] of [[-1, 1.15, .04, 4.7], [1, 1.15, .04, 4.7], [0, 3.5, 2, .04], [0, -1.2, 2, .04]]) box('lrail', bw, .9, bd, lm, g, bx, lv + .45, bz); } }   // catwalk landings at the ladder (5, 15, 25 m)
      [[5.5, -1], [15.5, 1], [25.5, -1]].forEach(([y, s]) => bunkPod(g, s * 3.95, y, 0));
      for (let i = 0; i < 9; i++) slot('warhead', rt => cyl('spare', .5, 2.2, cm(['#b5543a', '#6b7a3a', '#c9a24a'][i % 3], { rough: .6, metal: .4 }), rt, 0, 0, 0), g, (i % 2 ? .7 : -.7), 3 + i * 3.0, 3.55, { id: 'spare' + i, rz: Math.PI / 2, size: 2.3 });
      for (const sx of [-1, 1]) slot('tubebase', rt => cyl('tbfb', 2.3, 2, pbr('#33566a'), rt, 0, 0, 0), g, sx * 2.2, h - 2.35 - 2.45 * 1, 2.4, { id: 'tubebase' + (sx < 0 ? 'p' : 's'), ry: 0 });
    }
  }
  R.forEach(r => {
    const g = new B.TransformNode('room:' + r.id, sc); g.position.y = r.y; g.metadata = { room: r }; roomG[r.id] = g;
    const fl = cyl('floor:' + r.id, r.r * 2, .3, floorM, g, 0, -.15, 0); fl.metadata = { floor: r.id };
    // wall = 24 arc panels (each its own mesh so the ones between the camera and the character can fade), with ribs between them
    const NS = 24, DA = 2 * Math.PI / NS; g.metadata.segs = []; for (let i = 0; i < NS; i++) g.metadata.segs.push({ items: [], vis: 1, a: i * DA + DA / 2 });
    const segOf = a => Math.floor((((a % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) / DA), segAdd = (a, ms) => { const sg = g.metadata.segs[segOf(a)]; ms.forEach(m => { if (m && m.material !== undefined) sg.items.push(m); }); };
    g.metadata.segAdd = segAdd;
    for (let i = 0; i < NS; i++) { const w = B.MeshBuilder.CreateCylinder('wall' + i, { diameter: r.r * 2, height: r.h, tessellation: 4, arc: 1 / NS, sideOrientation: B.Mesh.BACKSIDE }, sc); w.material = wallM; w.parent = g; w.position.y = r.h / 2; w.rotation.y = -((i + 1.5) * DA); w.isPickable = false; g.metadata.segs[i].items.push(w);
      const rb = box('rib', .14, r.h, .16, steel, g, Math.cos(i * DA) * (r.r - .07), r.h / 2, Math.sin(i * DA) * (r.r - .07)); rb.rotation.y = -i * DA + Math.PI / 2; rb.isPickable = false; g.metadata.segs[i].items.push(rb); }
    for (const yy of [.12, r.h - .06]) { const t = B.MeshBuilder.CreateTorus('trim', { diameter: r.r * 2 - .3, thickness: yy < 1 ? .16 : .1, tessellation: 64 }, sc); t.material = brass; t.parent = g; t.position.y = yy; t.isPickable = false; }
    for (const rr of [r.r * .35, r.r * .7, r.r - .2]) { const t = B.MeshBuilder.CreateTorus('ring', { diameter: rr * 2, thickness: .04, tessellation: 64 }, sc); t.material = ringM; t.parent = g; t.position.y = .04; t.isPickable = false; }
    for (const sx of [-1, 1]) { slot('hatch', rt => { const d = B.MeshBuilder.CreateTorus('door', { diameter: 1.2, thickness: .12 }, sc); d.material = brass; d.parent = rt; d.rotation.z = Math.PI / 2; d.isPickable = false; return d; }, g, sx * (r.r - .05), 1.0, 0, { id: 'hatch:' + r.id + (sx < 0 ? 'p' : 's'), ry: sx < 0 ? Math.PI / 2 : -Math.PI / 2, onload: h => segAdd(sx < 0 ? Math.PI : 0, h.getChildMeshes()) }); segAdd(sx < 0 ? Math.PI : 0, [slots['hatch:' + r.id + (sx < 0 ? 'p' : 's')].fb]); }
    prop(r.kind, g, r.r, r.h);
    // wall annunciator strips: a dark plate with three LEDs (per-LED blink phase), at the panel seams, skipping the two door positions
    const hs = r.kind === 'tubes' ? [2, 8, 14, 20, 26] : [1.9], step = r.kind === 'tubes' ? 4 : 2;
    for (let i = 1; i < NS; i += step) { const a = (i + .5) * DA; if (Math.abs(Math.sin(a)) < .28) continue; if (r.kind === 'junction' && Math.abs(Math.cos(a)) < .5 && Math.sin(a) < 0) continue; for (const y of hs) { const px = Math.cos(a) * (r.r - .05), pz = Math.sin(a) * (r.r - .05), ms = [];
      const pl = box('strip', .56, .2, .04, pbr('#0e1417', { metal: .5, rough: .5 }), g, px, y, pz); pl.rotation.y = -a + Math.PI / 2; pl.isPickable = false; ms.push(pl);
      for (let q = -1; q <= 1; q++) { const k = (i * 5 + q * 3 + y * 2 + r.id.length) & 7, l = box('led', .09, .09, .03, ledM[k], g, px + Math.sin(a) * q * .17 * -1 * -1 - Math.sin(a) * 0, y, pz); l.position.x = px - Math.sin(a) * q * .17; l.position.z = pz + Math.cos(a) * q * .17; l.position.x += -Math.cos(a) * .02; l.position.z += -Math.sin(a) * .02; l.rotation.y = -a + Math.PI / 2; l.isPickable = false; ms.push(l); }
      segAdd(a, ms); } }
  });

  Object.values(roomG).forEach(g => g.getChildMeshes().forEach(m => { if (SOLIDN.test(m.name.replace(/\d+$/, ''))) addObs(m, m, true); }));
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

  // ---- exterior: a submarine-like teardrop. Blunt rounded bow, tapered stern with a shroud ring and cruciform tail planes, and broad flank sponsons
  // (port/starboard) that hold the main heat-sink tanks and the four radiator-blade channels. Only drawn in ship view. Press V to run the blades out.
  const extG = new B.TransformNode('ext', sc), plate = pbr('#222e35', { metal: .6, rough: .45 }), bone = pbr('#d8d4c4', { rough: .6 }), amberM = pbr('#101010', { emit: '#ff8a3a', ei: 1 });
  const TC = ['#3ec8e0', '#e0a020', '#e0a020', '#e0a020', '#e0a020', '#4a7cff', '#e8d23a', '#e8d23a', '#e8d23a', '#e8d23a', '#e8d23a', '#e8d23a'];
  for (const x of [15, 21, 112, 118]) cyl('band', SKIN_R * 2 + .3, 1.3, bone, extG, 0, yOf(x), 0);
  nose.scaling.y = 1.9;   // blunt ellipsoid bow (the translucent hull dome follows)
  { const bow = B.MeshBuilder.CreateSphere('bow', { diameter: SKIN_R * 2, slice: .5, segments: 32 }, sc); bow.material = plate; bow.parent = extG; bow.position.y = yOf(12); bow.scaling.y = 1.9;
    const dock = B.MeshBuilder.CreateTorus('dock', { diameter: 2.6, thickness: .4, tessellation: 32 }, sc); dock.material = brass; dock.parent = extG; dock.position.y = yOf(12) + 13.2;
    const dome = B.MeshBuilder.CreateSphere('dome', { diameter: 2.4, slice: .5 }, sc); dome.material = pbr('#6f8fa0', { metal: .7, rough: .25 }); dome.parent = extG; dome.position.set(0, yOf(12) + 2, 5.4); dome.rotation.x = Math.PI / 2; }
  { const tp = B.MeshBuilder.CreateCylinder('taper', { diameterTop: 14.3, diameterBottom: 5.6, height: 22, tessellation: 48 }, sc); tp.material = plate; tp.parent = extG; tp.position.y = 13;
    const sh = B.MeshBuilder.CreateTorus('shroud', { diameter: 5.8, thickness: .9, tessellation: 40 }, sc); sh.material = steel; sh.parent = extG; sh.position.y = 2.2;
    for (let i = 0; i < 4; i++) { const f = box('tailplane', .25, 9, 5.2, plate, extG, 0, 10, 0); const pv = new B.TransformNode('tp', sc); pv.parent = extG; pv.rotation.y = i * Math.PI / 2 + Math.PI / 4; f.parent = pv; f.position.set(0, 10, 0); f.position.z = 6.4; f.rotation.x = .0; }
    const fl = B.MeshBuilder.CreateCylinder('plume0', { diameterTop: 2.6, diameterBottom: .2, height: 6, tessellation: 16 }, sc); fl.material = amberM; fl.parent = extG; fl.position.set(0, -5, 0); life.glow.push({ m: amberM, lo: .5, hi: 1.7, sp: 3.1 }); }
  // flank sponsons: long ellipsoids, translucent like the hull so the sink tanks inside show; beam over both comes to about 23 m
  const SP0 = yOf(118), SP1 = yOf(30), SPL = SP1 - SP0, SPC = (SP0 + SP1) / 2, ZS = 8.6, sponM = pbr('#10171b', { metal: .5, rough: .55, alpha: .3 }), tankM = [];
  const bladeM = pbr('#1a1f23', { metal: .4, rough: .5, emit: '#e0702a', ei: .1 }), slotM = pbr('#05080a'), hinges = [];
  for (const sz of [-1, 1]) {
    const sp = B.MeshBuilder.CreateSphere('sponson', { diameter: 1, segments: 28 }, sc); sp.material = sponM; sp.parent = extG; sp.position.set(sz * ZS, SPC, 0); sp.scaling.set(6.2, SPL, 7.5);
    [3, 4.2, 4.6, 4.2, 3].forEach((d, k) => { const tm = pbr('#aab4b8', { metal: .8, rough: .35, emit: '#ff7a2a', ei: .15 }); life.glow.push({ m: tm, lo: .1, hi: .6, sp: .35, ph: k * .9 + sz }); const tk = B.MeshBuilder.CreateCapsule('sinktank', { radius: d / 2, height: 14, tessellation: 20 }, sc); tk.material = tm; tk.parent = extG; tk.position.set(sz * ZS, SPC + (k - 2) * 15.5, 0); });
    for (const sx of [-1, 1]) { const xs = sz * (ZS + 6.2 / 2 * Math.sqrt(1 - Math.pow(1.6 / 3.75, 2))), z = sx * 1.6;
      box('channel', .3, SPL * .82, .5, slotM, extG, xs - sz * .1, SPC, z);
      for (const o of [-18.5, 18.5]) { const hg = new B.TransformNode('hinge', sc); hg.parent = extG; hg.position.set(xs, SPC + o, z); hg.scaling.x = .02; hinges.push(hg); const bl = box('blade', 6, 36, .14, bladeM, hg, sz * 3, 0, 0); bl.isPickable = false; } }
    const nav = pbr('#101010', { emit: sz < 0 ? '#ff3030' : '#30ff60', ei: 1.5 }), nl = B.MeshBuilder.CreateSphere('nav', { diameter: .6 }, sc); nl.material = nav; nl.parent = extG; nl.position.set(sz * (ZS + 3.2), SP1 - 4, 0); life.glow.push({ m: nav, lo: .1, hi: 2.4, sp: 2.2, strobe: 1, ph: sz }); }
  const FINS = { v: 0, to: 0, hinges, bladeM };
  // dorsal tube deck caps: 12 per side, glowing the tube's colour cue
  for (let i = 0; i < 12; i++) for (const sz of [-1, 1]) { const cm = pbr('#1a2328', { emit: TC[i], ei: .5, metal: .6 }); life.glow.push({ m: cm, lo: .2, hi: .8, sp: .6 + i * .07, ph: i * .5 + (sz > 0 ? 1.7 : 0) });
    const cap = cyl('cap', 1.7, .35, cm, extG, sz * 2.2, roomG['T'].position.y + 31 - 2.35 - 2.45 * i, -SKIN_R - .1); cap.rotation.x = Math.PI / 2; }
  extG.getChildMeshes().forEach(m => { m.isPickable = false; });
  // ---- dust motes drifting in the current room
  const dustT = ptex('dustT', 32, 32, g => { const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); }, 1, 1);
  const dust = new B.ParticleSystem('dust', 160, sc); dust.particleTexture = dustT; dust.emitter = new B.Vector3(0, 0, 0); dust.minEmitBox = new B.Vector3(-4, .2, -4); dust.maxEmitBox = new B.Vector3(4, 2.7, 4);
  dust.color1 = new B.Color4(.8, .9, 1, .35); dust.color2 = new B.Color4(1, .9, .7, .2); dust.colorDead = new B.Color4(1, 1, 1, 0); dust.minSize = .006; dust.maxSize = .02; dust.minLifeTime = 6; dust.maxLifeTime = 12; dust.emitRate = 20;
  dust.direction1 = new B.Vector3(-.06, -.015, -.06); dust.direction2 = new B.Vector3(.06, .05, .06); dust.minEmitPower = .3; dust.maxEmitPower = 1; dust.preWarmCycles = 80; dust.preWarmStepOffset = 5; 

  // ---- character, camera, interaction
  const who = B.MeshBuilder.CreateCapsule('who', { radius: .3, height: 1.7 }, sc); who.material = pbr('#c9a24a', { emit: '#3a2c08', ei: 1 }); who.isPickable = false;
  let plR = null; const plRoot = slot('player', rt => B.MeshBuilder.CreateBox('plfb', { size: .01 }, sc), who, 0, -.95, 0, { id: 'player', ground: true, onload: (h, root) => { plR = root; who.visibility = 0; } });   // the standing crewman replaces the gold capsule once the GLB is in
  const faceMove = (dx, dz) => { if (plR && Math.hypot(dx, dz) > 1e-4) { const t = Math.atan2(dx, dz); let d = t - plR.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); plR.rotation.y += d * .25; } };
  const cam = new B.ArcRotateCamera('cam', .6, 1.0, 11, new B.Vector3(0, 120, 0), sc); cam.lowerRadiusLimit = 3; cam.upperRadiusLimit = 220; cam.upperBetaLimit = 1.5; cam.lowerBetaLimit = .1; cam.minZ = .1; cam.maxZ = 2500; cam.wheelPrecision = 12; cam.attachControl(cv, true);
  // first-person and room-centre cameras: a free-look camera (drag to look, wheel = zoom) at eye height 1.6 m. 'room' sits on the axis; reactor rooms
  // have the reactor on the axis, so 'room' falls back to first person there.
  const fp = new B.UniversalCamera('fp', new B.Vector3(0, 120, 0), sc); fp.minZ = .05; fp.maxZ = 2500; fp.fov = 1.1; fp.angularSensibility = 2200; fp.inertia = .55; fp.speed = 0; fp.inputs.removeByType('FreeCameraKeyboardMoveInput'); fp.rotation.y = Math.PI;
  const NOCENTER = { reactor: 1, reactor2: 1 };
  const st = { room: 'A1', mode: 'room', cam: 'orbit', tgt: new B.Vector3(0, 120, 0), lvl: 0 }, tween = [];
  const hudEl = document.getElementById('hud'), decks = document.getElementById('decks');
  // collapsible HUD help and deck list (Dave, 2026-11-23): both remembered per viewer
  const pref = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : v === '1'; } catch (e) { return d; } }, setPref = (k, v) => { try { localStorage.setItem(k, v ? '1' : '0'); } catch (e) { } };
  let HINTS = pref('hudHints', true), DECKS = pref('hudDecks', false);
  hudEl.addEventListener('click', e => { if (e.target && e.target.id === 'hintbtn') { HINTS = !HINTS; setPref('hudHints', HINTS); hud(); } });
  const decksTog = document.createElement('button'); decksTog.type = 'button'; decksTog.style.cssText = 'background:#1d3340;color:#d7e3ea;border:1px solid #3c6074;border-radius:4px;padding:4px 8px;font:12px inherit;cursor:pointer;text-align:left'; decks.appendChild(decksTog);
  decksTog.onclick = () => { DECKS = !DECKS; setPref('hudDecks', DECKS); decksBtnSync(); };
  function decksBtnSync() { decksTog.textContent = (DECKS ? '\u25BE ' : '\u25B8 ') + 'DECKS' + (DECKS ? '' : ' \u00B7 ' + st.room); decks.querySelectorAll('button[data-id]').forEach(b => { b.style.display = DECKS ? '' : 'none'; }); }
  // two player cameras: 'orbit' (drag to orbit the room or ship) and 'shoulder' (orbit camera locked behind the character, offset to one side).
  // 'fp' is internal: the screen-zoom camera.
  function setCam(m, keep) {
    if (!keep) unzoom();
    if (st.mode === 'ship') { st.mode = 'room'; enter(st.room); }
    st.cam = m; const old = sc.activeCamera; if (old) old.detachControl();
    if (m === 'cmd') { if (st.room !== 'A1') { goTo('A1'); setTimeout(() => setCam('cmd'), 900); return; } sc.activeCamera = fp; fp.attachControl(cv, true); who.isVisible = false; plRoot.setEnabled(false); const g = roomG.A1, d = g.getAbsolutePosition(); fp.position.set(d.x, d.y + 1.3, d.z - .9); fp.fov = .95; fp.setTarget(new B.Vector3(d.x, d.y + 1.5, d.z + 4)); st.zoom = null; }
    else if (m === 'fp') { sc.activeCamera = fp; fp.attachControl(cv, true); who.isVisible = false; plRoot.setEnabled(false); }
    else { sc.activeCamera = cam; cam.attachControl(cv, true); who.isVisible = true; plRoot.setEnabled(true);
      if (m === 'shoulder') { cam.lowerRadiusLimit = 1.4; cam.radius = 4.4; cam.beta = 1.15; cam.targetScreenOffset.set(-.3, -.06); }
      else { cam.lowerRadiusLimit = 3; cam.targetScreenOffset.set(0, 0); enter(st.room); } }
    camBtns.forEach(b => b.classList.toggle('on', b.dataset.cam === st.cam)); hud();
  }
  const camBox = document.createElement('div'); camBox.id = 'cams'; camBox.style.cssText = 'position:fixed;left:max(16px,env(safe-area-inset-left,0px));top:calc(170px + env(safe-area-inset-top,0px));display:flex;flex-direction:column;gap:3px';
  const camBtns = [['orbit', '6  Orbit view'], ['shoulder', '7  Over the shoulder'], ['cmd', '9  Command view']].map(([k, t]) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = t; b.dataset.cam = k; b.onclick = () => setCam(k); camBox.appendChild(b); return b; }); document.body.appendChild(camBox);
  const ladBox = document.createElement('div'); ladBox.style.cssText = 'position:fixed;left:max(16px,env(safe-area-inset-left,0px));top:calc(242px + env(safe-area-inset-top,0px));display:none;flex-direction:column;gap:3px'; [['▲  Climb up (R)', 1], ['▼  Climb down (F)', -1]].forEach(([t, d]) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = t; b.onclick = () => climbStep(d); ladBox.appendChild(b); }); document.body.appendChild(ladBox);
  cv.addEventListener('wheel', e => { if (st.cam === 'fp') { fp.fov = Math.max(.5, Math.min(1.7, fp.fov * (1 + Math.sign(e.deltaY) * .06))); e.preventDefault(); } }, { passive: false });
  function hud() { ladBox.style.display = st.room === 'T' && st.mode === 'room' ? 'flex' : 'none'; const r = roomG[st.room].metadata.room, n = Object.values(slots).filter(s => s.glb).length; const vw = ({ orbit: 'Orbit view', shoulder: 'Over the shoulder', fp: 'Screen', cmd: 'Command view' })[st.cam]; const tg = '<button id="hintbtn" type="button" style="pointer-events:auto;margin-left:8px;background:#1d3340;color:#d7e3ea;border:1px solid #3c6074;border-radius:3px;padding:1px 7px;font:11px inherit;cursor:pointer">' + (HINTS ? '\u25BE hints' : '\u25B8 hints') + '</button>'; { const sb = document.getElementById('stbox'); if (sb) sb.style.display = HINTS ? '' : 'none'; } { const tp = document.getElementById('tip'); if (tp) tp.style.display = HINTS ? '' : 'none'; }
    if (!HINTS) { hudEl.innerHTML = '<b>INTERDICT</b> \u00B7 ' + r.id + ' ' + r.name + ' \u00B7 ' + (st.zoom ? 'SCREEN ' + st.zoom.mesh.metadata.screen.toUpperCase() : vw) + tg; decksBtnSync(); return; }
    hudEl.innerHTML = '<b>INTERDICT 3D ship spine (Babylon.js)</b>' + tg + '<br>' + ({ orbit: 'Orbit view', shoulder: 'Over the shoulder', fp: 'Screen', cmd: 'Command view' })[st.cam] + '<br>' + r.id + ': ' + r.name + '<br>floor ' + (r.r * 2).toFixed(1) + ' m across, ' + r.h + ' m clear<br>' + (st.mode === 'ship' ? 'Ship view (140 m)' : 'Room view') + (st.zoom ? '<br><b>SCREEN ' + st.zoom.mesh.metadata.screen.toUpperCase() + '</b>: click its soft keys · Esc steps back' : '') + '<br><span style="opacity:.7">6 orbit · 7 shoulder · 8 ship · 9 command · F1-F8 stations (tap = go/back, hold = radial, Shift = peek) · ` radial · V vent fins · WASD walk · Shift run · Q/E deck down/up · R/F ladder (tube hall)</span><br>GLB slots filled: ' + n + ' / ' + Object.keys(slots).length; decks.querySelectorAll('button[data-id]').forEach(b => b.classList.toggle('on', b.dataset.id === st.room)); decksBtnSync(); }
  R.forEach(r => { const b = document.createElement('button'); b.textContent = r.id + '  ' + r.name; b.dataset.id = r.id; b.onclick = () => goTo(r.id); decks.appendChild(b); });
  function place(id, x, z) { const r = roomG[id].metadata.room; st.room = id; st.lvl = 0; const q = pushOut(r, x, z, 0); who.position.set(q[0], r.y + .95, q[1]); }
  function enter(id) { st.mode = 'room'; st.room = id; const r = roomG[id].metadata.room; dust.emitter = roomG[id].getAbsolutePosition().clone(); dust.maxEmitBox.setAll(r.r * .85); dust.minEmitBox.set(-r.r * .85, .2, -r.r * .85); dust.maxEmitBox.y = Math.min(r.h, 6) - .3; st.tgt.set(0, r.y + (r.kind === 'tubes' ? 12 : 1.2), 0); cam.radius = r.kind === 'tubes' ? 30 : r.id === 'A1' ? 11 : 7.5; cam.beta = r.kind === 'tubes' ? 1.3 : r.id === 'A1' ? .8 : 1.3; hud(); }
  const feetOf = rr => who.position.y - .95 - roomG[rr.id].position.y;
  function pushOut(rr, nx, nz, feet) { if (!rr.obs) return [nx, nz]; for (let it = 0; it < 3; it++) { let hit = false; for (const o of rr.obs) { if (o.y1 < feet + .15 || o.y0 > feet + 1.7) continue; const x0 = o.x0 - PR, x1 = o.x1 + PR, z0 = o.z0 - PR, z1 = o.z1 + PR; if (nx > x0 && nx < x1 && nz > z0 && nz < z1) { const dl = nx - x0, dr = x1 - nx, dt = nz - z0, db = z1 - nz, m = Math.min(dl, dr, dt, db); if (m === dl) nx = x0; else if (m === dr) nx = x1; else if (m === dt) nz = z0; else nz = z1; hit = true; } } if (!hit) break; } return [nx, nz]; }
  const solidAt = (rr, x, z, feet) => { if (rr.obs) for (const o of rr.obs) { if (o.y1 < feet + .15 || o.y0 > feet + 1.7) continue; if (x > o.x0 - PR && x < o.x1 + PR && z > o.z0 - PR && z < o.z1 + PR) return true; } return false; };
  const walkable = (rr, x, z, feet) => ((Math.hypot(x, z) <= rr.r - .6) || (rr.kind === 'junction' && Math.abs(x) <= .4 && z < 0 && z >= -(rr.r + LOCK_LEN - .7))) && !solidAt(rr, x, z, feet);
  const clampIn = (rr, nx, nz) => { [nx, nz] = pushOut(rr, nx, nz, feetOf(rr)); const m = Math.hypot(nx, nz), lim = rr.r - .6;
    if (rr.kind === 'junction' && m > lim && Math.abs(nx) < .8 && nz < 0) return [Math.max(-.4, Math.min(.4, nx)), Math.max(nz, -(rr.r + LOCK_LEN - .7))];   // the boarding lock off the dorsal wall
    return m > lim ? [nx * lim / m, nz * lim / m] : [nx, nz]; };
  // A* path planner on a .25 m grid, then string-pulled: click-to-walk routes around props instead of through them
  function plan(rr, sx, sz, tx, tz, feet) {
    const cs = .25, X0 = -(rr.r + .3), Z0 = -(rr.r + LOCK_LEN + .3), NX = Math.ceil((2 * rr.r + .6) / cs) + 1, NZ = Math.ceil((2 * rr.r + LOCK_LEN + .7) / cs) + 1, idx = (i, j) => j * NX + i;
    const cx = x => Math.round((x - X0) / cs), cz = z => Math.round((z - Z0) / cs), wx = i => X0 + i * cs, wz = j => Z0 + j * cs, free = (i, j) => i >= 0 && j >= 0 && i < NX && j < NZ && walkable(rr, wx(i), wz(j), feet);
    const los = (ax, az, bx, bz) => { const n = Math.ceil(Math.hypot(bx - ax, bz - az) / .12); for (let k = 1; k < n; k++) { const t = k / n; if (!walkable(rr, ax + (bx - ax) * t, az + (bz - az) * t, feet)) return false; } return true; };
    const nearest = (i, j) => { if (free(i, j)) return [i, j]; let best = null, bd = 1e9; for (let di = -14; di <= 14; di++) for (let dj = -14; dj <= 14; dj++) if (free(i + di, j + dj)) { const d = di * di + dj * dj; if (d < bd) { bd = d; best = [i + di, j + dj]; } } return best; };
    let gg = nearest(cx(tx), cz(tz)); if (!gg) return [{ x: tx, z: tz }]; const [gi, gj] = gg; tx = wx(gi); tz = wz(gj);
    if (los(sx, sz, tx, tz)) return [{ x: tx, z: tz }];
    const ss = nearest(cx(sx), cz(sz)); if (!ss) return [{ x: tx, z: tz }]; const [si, sj] = ss, G = new Float32Array(NX * NZ).fill(1e9), from = new Int32Array(NX * NZ).fill(-1), open = [[0, idx(si, sj)]]; G[idx(si, sj)] = 0; let found = false;
    while (open.length) { let bi = 0; for (let k = 1; k < open.length; k++) if (open[k][0] < open[bi][0]) bi = k; const c = open.splice(bi, 1)[0][1], ci = c % NX, cj = (c - ci) / NX; if (ci === gi && cj === gj) { found = true; break; }
      for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) { if (!di && !dj) continue; const ni = ci + di, nj = cj + dj; if (!free(ni, nj) || (di && dj && (!free(ci + di, cj) || !free(ci, cj + dj)))) continue; const nc = G[c] + Math.hypot(di, dj), n = idx(ni, nj); if (nc < G[n]) { G[n] = nc; from[n] = c; open.push([nc + Math.hypot(ni - gi, nj - gj), n]); } } }
    if (!found) return [{ x: tx, z: tz }];
    const pts = []; for (let c = idx(gi, gj); c !== -1; c = from[c]) { const i = c % NX; pts.unshift({ x: wx(i), z: wz((c - i) / NX) }); }
    const out = []; let a = { x: sx, z: sz }, k = 0; while (k < pts.length) { let far = k; for (let m = pts.length - 1; m >= k; m--) if (los(a.x, a.z, pts[m].x, pts[m].z)) { far = m; break; } out.push(pts[far]); a = pts[far]; k = far + 1; } out[out.length - 1] = { x: tx, z: tz }; return out;
  }
  // tube-hall ladders: two ladders (local z) and catwalk landings at 0 / 5 / 15 / 25 m; R/F or the on-screen arrows climb one landing
  const LAD = { z: [-.3, 2.9], lv: [0, 5, 15, 25] };
  function ladTo(lv, done) {
    if (st.room !== 'T' || st.mode !== 'room') return; const g = roomG.T, base = g.getAbsolutePosition(), px = who.position.x - base.x, pz = who.position.z - base.z, lz = LAD.z.reduce((b, z) => Math.abs(z - pz) < Math.abs(b - pz) ? z : b);
    tween.length = 0; const go = () => tween.push({ k: 'lad', lv, lz, done: () => { st.lvl = lv; if (st.cam === 'shoulder') { cam.alpha = lz < 1 ? Math.PI / 2 : -Math.PI / 2; cam.beta = lv ? 1.3 : 1.15; cam.radius = lv ? 1.7 : 4.4; } hud(); done && done(); } });   // the tube columns fill both flanks, so on a landing the shoulder camera sits in the aisle looking ventral
    if (Math.hypot(px, pz - lz) > .7) walkTo(0, lz, go); else go(); }
  function climbStep(dir) { const to = Math.max(0, Math.min(LAD.lv.length - 1, st.lvl + dir)); if (st.room === 'T' && to !== st.lvl) ladTo(to); }
  const walkTo = (x, z, done) => tween.push({ k: 'walk', x, z, done });
  function goTo(id) { if (id === st.room && st.mode === 'room') return; if (st.lvl && st.room === 'T') { ladTo(0, () => goTo(id)); return; } const from = roomG[st.room].metadata.room; tween.length = 0; st.mode = 'room'; walkTo(-(from.r - .7), 0, () => tween.push({ k: 'climb', id, done: () => { const to = roomG[id].metadata.room; place(id, -(to.r - .7), 0); enter(id); } })); }
  document.getElementById('shipbtn').onclick = () => { if (st.mode === 'ship') enter(st.room); else { if (st.cam !== 'orbit') setCam('orbit'); st.mode = 'ship'; st.tgt.set(0, yOf(70), 0); cam.radius = 150; cam.beta = 1.4; hud(); } };
  sc.onPointerObservable.add(pi => { if (pi.type !== B.PointerEventTypes.POINTERTAP) return; const p = pi.pickInfo; if (!p || !p.hit || !p.pickedMesh.metadata || !p.pickedMesh.metadata.floor) return; const id = p.pickedMesh.metadata.floor; unzoom(); if (st.lvl && st.mode !== 'ship') return;
    if (st.mode === 'ship') { st.mode = 'room'; place(id, 0, 0); enter(id); return; } if (id !== st.room) { goTo(id); return; }
    const g = roomG[id], rr = g.metadata.room, [cx, cz] = clampIn(rr, p.pickedPoint.x - g.position.x, p.pickedPoint.z - g.position.z); tween.length = 0; walkTo(cx, cz); });
  // ---- screen zoom: tap a station screen to step up to it; then its soft keys are live (CTL.activate)
  function unzoom() { if (!st.zoom) return; (st.zoomHid || []).forEach(n => n.setEnabled(true)); st.zoomHid = []; const prev = st.zoom.prev; st.zoom = null; fp.fov = 1.1; cv.style.cursor = ''; LS.ctx.hover = { scr: null, id: null }; setCam(prev === 'fp' ? 'shoulder' : prev, true); }
  const zHist = []; let zNoPush = false;   // screens visited, most recent last: BACK steps through them
  function zoomTo(mesh) {
    if (!zNoPush && st.zoom && st.zoom.mesh !== mesh) { if (zHist[zHist.length - 1] !== st.zoom.mesh) zHist.push(st.zoom.mesh); if (zHist.length > 8) zHist.shift(); }
    const prev = st.zoom ? st.zoom.prev : st.cam; setCam('fp', true); mesh.computeWorldMatrix(true); const c = mesh.getAbsolutePosition().clone(), n = B.Vector3.TransformNormal(new B.Vector3(0, 0, 1), mesh.getWorldMatrix()).normalize();
    if (B.Vector3.Dot(n, roomG[st.room].getAbsolutePosition().subtract(c)) < 0) n.scaleInPlace(-1);
    const hW = B.Vector3.TransformNormal(new B.Vector3(0, mesh.metadata.sh || .5, 0), mesh.getWorldMatrix()).length(), dist = Math.max(.45, hW / 2 / Math.tan(.425) * 1.04 * (mesh.metadata.fit || 1));   // fov .85 rad: distance at which the screen height fills the view
    st.zoom = { mesh, prev, pos: c.add(n.scale(dist)), tgt: c, zt: fp.getFrontPosition(1) }; st.zoomHid = ['crew', 'couch'].map(k => slots[k + mesh.metadata.station]).filter(Boolean).flatMap(s => [s.root, s.holder]).filter(Boolean); st.zoomHid.forEach(n => n.setEnabled(false));
    hud();
  }
  function zoomStep() { const z = st.zoom; fp.position = B.Vector3.Lerp(fp.position, z.pos, .12); z.zt = B.Vector3.Lerp(z.zt, z.tgt, .15); fp.setTarget(z.zt); fp.fov += (.85 - fp.fov) * .12; }
  const scrHit = () => { const p = sc.pick(sc.pointerX, sc.pointerY, m => !!(m.metadata && m.metadata.screen)); if (!p || !p.hit || !p.pickedMesh || !p.pickedMesh.metadata || !p.pickedMesh.metadata.screen) return null; const uv = p.getTextureCoordinates(); if (!uv) return null; const x = uv.x * LS.W, y = uv.y * LS.H; return { n: p.pickedMesh.metadata.screen, mesh: p.pickedMesh, x, y, reg: p.pickedMesh.metadata.passive ? (window.PS && PS.hit ? (() => { const sz = PS.SZ(p.pickedMesh.metadata.screen); return PS.hit(p.pickedMesh.metadata.screen, uv.x * sz[0], uv.y * sz[1]); })() : null) : LS.hit(p.pickedMesh.metadata.screen, x, y) }; };
  sc.onPointerObservable.add(pi => { if (!HS.ok) return;
    if (pi.type === B.PointerEventTypes.POINTERMOVE) { if (!st.zoom) return; const h = scrHit(pi); LS.ctx.hover = h && h.mesh === st.zoom.mesh && h.reg ? { scr: h.n, id: h.reg.id } : { scr: null, id: null }; cv.style.cursor = LS.ctx.hover.id ? 'pointer' : ''; return; }
    if (pi.type !== B.PointerEventTypes.POINTERTAP) return; const h = scrHit(pi); if (!h) return; if (!st.zoom || st.zoom.mesh !== h.mesh) zoomTo(h.mesh); else if (h.reg) CTL.activate(h.reg.id, { x: h.x, y: h.y }); });
  // screen-to-screen navigation (Dave, 2026-11-20): contact icon -> main scope with 3 flashes, ID likelihood -> Target ID
  window.SHIPNAV = { go(name) { if (st.room !== 'A1') { tt('Stations are in the control room (key 9)', 'w'); return; } const m = name === 'scope' ? sc.getMeshByName('pscr:overview') : sc.getMeshByName('scr:' + name); if (m && (!st.zoom || st.zoom.mesh !== m)) zoomTo(m); },
    back() { const m = zHist.pop(); if (!m) { tt('Nothing to go back to', 'w'); return; } zNoPush = true; try { zoomTo(m); } finally { zNoPush = false; } },
    trail() { return zHist.slice(-3).map(m => String(m.metadata.screen || '').toUpperCase()).join(' \u203a '); },
    scope(id) { LS.ctx.flash = { id, t0: performance.now() }; this.go('scope'); } };
  const selBar = document.createElement('div'); selBar.style.cssText = 'display:none;position:fixed;left:50%;bottom:calc(12px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);gap:4px;align-items:center;padding:4px 8px;background:rgba(12,22,24,.88);border:1px solid #2a4452;border-radius:4px;color:#d7e3ea;font:12px system-ui,sans-serif;z-index:5';
  selBar.innerHTML = [['nav:back', '⟲ Back'], ['sel:prev', '◂'], ['', ''], ['sel:next', '▸'], ['nav:contacts', 'Contacts'], ['nav:scope', 'Scope'], ['nav:tid', 'Target ID'], ['nav:nav', 'Nav'], ['fire', 'FIRE']].map(([id, t]) => id ? '<button type="button" data-id="' + id + '" style="padding:4px 9px' + (id === 'fire' ? ';background:#7a2a22;border-color:#ff5a4d;font-weight:700' : '') + '">' + t + '</button>' : '<span data-lab style="min-width:130px;text-align:center"></span>').join('');
  document.body.appendChild(selBar); selBar.addEventListener('click', e => { const b = e.target.closest('button'); if (b && typeof CTL !== 'undefined') { CTL.activate(b.dataset.id); e.stopPropagation(); } });
  let selBarT = 0; setInterval(() => { try { const bb = selBar.querySelector('button[data-id="nav:back"]'); if (bb) { const tr = window.SHIPNAV.trail(); bb.title = tr ? 'Back (Backspace): ' + tr : 'Back (Backspace)'; bb.style.opacity = tr ? 1 : .5; } const on = HS.ok && typeof CTL !== 'undefined' && st.room === 'A1'; selBar.style.display = on ? 'flex' : 'none'; if (!on) return; const a = LS.ctx.sel != null && LS.ctx.S && LS.ctx.S.an[LS.ctx.sel]; selBar.querySelector('[data-lab]').textContent = a ? 'S' + (a.id + 1) + ' selected' : 'no contact  ([ ] Tab)'; } catch (e) { } }, 300);
  const almEl = document.createElement('div'); almEl.style.cssText = 'display:none;position:fixed;left:50%;top:calc(10px + env(safe-area-inset-top,0px));transform:translateX(-50%);max-width:70vw;padding:6px 12px;background:rgba(12,22,24,.88);border:1px solid #f0ab3a;border-radius:4px;color:#d7e3ea;font:12px system-ui,sans-serif;z-index:5;pointer-events:none'; document.body.appendChild(almEl);
  // ---- ported from cic3d: adapter events (calls, voice, toasts), the call card, brace / time / mute status, camera shake, keys and the radial menu
  const cv2 = cv, FX = { sh: 0 }; window.SHIPFX = { shake(a) { FX.sh = Math.max(FX.sh, Math.min(1, a || .3)); } };
  const tt = (t, k) => { try { window.UI && UI.toast(t, k); } catch (e) { } }, snd2 = n => { try { window.AUD && AUD.play(n); } catch (e) { } }, say2 = (w, t, p) => { try { window.AUD && AUD.say(w, t, p); } catch (e) { } };
  function onEvents(evs) { for (const ev of evs) {
    if (ev.type === 'raise') { const c = ev.call; say2(c.officer, c.line, c.pri); snd2(c.pri >= 4 ? 'klaxon' : c.pri === 3 ? 'caution' : 'chime'); if (c.pri >= 3) tt(String(c.officer).toUpperCase() + ': ' + c.line, c.pri >= 4 ? 'w' : 'w'); }
    else if (ev.type === 'order' && ev.order.by === 'co' && !ev.order.instant) { if (window.Stations) { if (ev.stage === 'issued') say2('Captain', Stations.captainLine(ev.order.label), 3); else if (ev.stage === 'acked') say2(ev.order.officer, Stations.ackLine(ev.order.label), 3); } }
    else if (ev.type === 'default') { const c = ev.call, o = c.opts && c.opts[c.choice]; tt(String(c.officer).toUpperCase() + ': no answer, crew default' + (o ? ': ' + o.label : ''), 'w'); }
    else if (ev.type === 'noop') tt('NOT YET SIMULATED: ' + ev.order.label, 'w');
    else if (ev.type === 'executed' && !ev.ok && ev.order.by === 'co') tt(String(ev.order.officer).toUpperCase() + ': unable (' + ev.order.label + ')', 'w'); } }
  const callBox = document.createElement('div'), stBox = document.createElement('div');
  callBox.style.cssText = 'display:none;position:fixed;left:50%;top:calc(52px + env(safe-area-inset-top,0px));transform:translateX(-50%);width:min(520px,86vw);padding:8px 12px;background:rgba(12,22,24,.92);border:1px solid #f0ab3a;border-radius:4px;color:#d7e3ea;font:13px system-ui,sans-serif;z-index:6';
  stBox.style.cssText = 'position:fixed;left:max(16px,env(safe-area-inset-left,0px));bottom:calc(48px + env(safe-area-inset-bottom,0px));padding:3px 8px;background:rgba(12,22,24,.75);border:1px solid #2a4452;border-radius:3px;color:#9fb5c0;font:11px ui-monospace,monospace;z-index:4;pointer-events:none';
  stBox.id = 'stbox'; document.body.appendChild(callBox); document.body.appendChild(stBox);
  callBox.addEventListener('click', e => { const b = e.target.closest('button'); if (b && b.dataset.wait != null && typeof CTL !== 'undefined') { CTL.activate('call:wait'); return; } if (b && b.dataset.i != null && typeof CTL !== 'undefined') { CTL.activate('callopt:' + b.dataset.i); snd2('click'); callKey = ''; } });
  let callKey = '', stT = 0;
  function callTick(dt) {
    if (FX.sh > .01) { FX.sh *= Math.pow(.02, dt); cv2.style.transform = 'translate(' + ((Math.random() - .5) * 18 * FX.sh).toFixed(1) + 'px,' + ((Math.random() - .5) * 18 * FX.sh).toFixed(1) + 'px)'; } else if (FX.sh) { FX.sh = 0; cv2.style.transform = ''; }
    stT += dt; if (stT < .25) return; stT = 0; if (typeof CTL === 'undefined') return;
    const c = CTL.topCall && CTL.topCall(), key = c ? c.id + ':' + c.state : ''; if (key !== callKey) { callKey = key; if (!c) callBox.style.display = 'none'; else { callBox.style.display = 'block'; callBox.innerHTML = '<b style="color:#f0ab3a">' + String(c.officer).toUpperCase() + ' · ' + String(c.station || '').toUpperCase() + '</b><div style="margin:4px 0">' + c.line + '</div>' + (c.opts || []).map((o, i) => '<button type="button" data-i="' + i + '" style="margin:2px 4px 0 0">' + (i + 1) + '  ' + o.label + '</button>').join('') + (c.state === 'raised' ? '<button type="button" data-wait="1" style="margin:2px 4px 0 0;opacity:.85">0  Wait</button>' : '') + '<div style="opacity:.6;font-size:11px;margin-top:3px">1-5 answer · 0 wait (they will ask again) · no answer: the crew takes its default</div>'; } }
    stBox.textContent = 'BRACE ' + CIC.braceState().toUpperCase() + ' · TIME x' + CIC.tscale + ' · SOUND ' + (window.AUD && AUD.muted ? 'OFF' : 'ON') + '  |  B brace · T time · Space ack · K mute' + (st.zoom ? ' · C L P O X R M U Y H Z F G [ ] Tab' : '');
  }
  // radial menu on a right-click of a contact on a zoomed screen
  const radEl = document.createElement('div'); radEl.style.cssText = 'position:fixed;display:none;z-index:25;width:0;height:0'; document.body.appendChild(radEl);
  // ---- radial menus (docs/command_experience.md): a marking menu. Hold a key (or right-click), flick toward an item, release. Two levels at most. Time runs at 25% while one is open.
  const RADIAL = window.RADIAL = { open: false, items: null, cx: 0, cy: 0, sticky: false, sel: -1, by: null }, ptr = { x: 0, y: 0 };
  addEventListener('pointermove', e => { ptr.x = e.clientX; ptr.y = e.clientY; if (RADIAL.open && !RADIAL.sticky) radHover(); }, true);
  const radClose = () => { radEl.style.display = 'none'; RADIAL.open = false; RADIAL.items = null; RADIAL.by = null; };
  const idItem = (id, lab) => ({ lab, id, off: typeof CTL !== 'undefined' && CTL.can(id).ok === false });
  function radIndex() { const n = RADIAL.items.length, dx = ptr.x - RADIAL.cx, dy = ptr.y - RADIAL.cy; if (Math.hypot(dx, dy) < 34) return -1; const a = Math.atan2(dy, dx) + Math.PI / 2, st2 = 2 * Math.PI / n; return Math.round(((a % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI)) / st2) % n; }
  function radHover() { const k = radIndex(); if (k !== RADIAL.sel) { RADIAL.sel = k; [...radEl.querySelectorAll('button')].forEach((b, i) => { b.style.background = i === k ? '#3a2d0c' : '#08201c'; b.style.borderColor = i === k ? '#f0ab3a' : '#7a5a1d'; }); if (k >= 0) snd2('tick'); } }
  function radialOpen(items, x, y, title, opts) {
    opts = opts || {}; radEl.innerHTML = ''; radEl.style.left = x + 'px'; radEl.style.top = y + 'px'; radEl.style.display = 'block'; Object.assign(RADIAL, { open: true, items, cx: x, cy: y, sticky: !!opts.sticky, sel: -1, by: opts.by || null });
    const core = document.createElement('div'); core.textContent = title || ''; core.style.cssText = 'position:absolute;transform:translate(-50%,-50%);color:#c4dcd2;font:bold 12px monospace;background:#08201c;border:1px solid #1d4a42;border-radius:12px;padding:4px 8px;white-space:nowrap'; radEl.appendChild(core);
    items.forEach((it, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / items.length, b = document.createElement('button'); b.type = 'button'; b.textContent = it.lab + (it.kids ? ' ›' : ''); b.style.cssText = 'position:absolute;transform:translate(-50%,-50%);width:96px;font:bold 12px monospace;padding:8px 2px;background:#08201c;color:#f0ab3a;border:2px solid #7a5a1d;border-radius:20px;cursor:pointer;opacity:' + (it.off ? .4 : 1) + ';left:' + Math.round(Math.cos(a) * 96) + 'px;top:' + Math.round(Math.sin(a) * 96) + 'px'; b.onclick = e => { e.stopPropagation(); radPick(i); }; radEl.appendChild(b); });
    snd2('tick'); }
  function radPick(i) { const it = RADIAL.items && RADIAL.items[i]; if (!it) { radClose(); return; } if (it.kids) { const x = RADIAL.cx, y = RADIAL.cy; radialOpen(it.kids, x, y, it.lab, { sticky: true }); return; } radClose(); if (it.off) { tt('Not available right now', 'w'); return; } try { it.fn ? it.fn() : CTL.activate(it.id); } catch (e) { console.warn('radial', e); } }
  function radRelease(by) { if (!RADIAL.open || RADIAL.sticky || (by && RADIAL.by && RADIAL.by !== by)) return; const k = radIndex(); if (k < 0) { radClose(); return; } radPick(k); }
  // Ask verbs: the officer answers in words (a spoken line and a toast), straight from the live state
  function askText(stn) { try { const S = HS.S, E = HS.E, an = (S.an || []).filter(a => a.state !== 'out'), sel = LS.ctx.sel != null ? S.an[LS.ctx.sel] : null, hos = an.filter(a => a.idStatus === 'hostile').length;
    switch (stn) {
      case 'sensors': return an.length + ' contacts, ' + hos + ' hostile' + (sel ? '. Selected S' + (sel.id + 1) + ', ' + (sel.state === 'locked' ? 'locked' : 'open') : '. Nothing selected.') + '.';
      case 'fire': { if (!sel) return 'No contact selected.'; const si = E.solveInfo(S, sel); return 'S' + (sel.id + 1) + ' ' + (sel.state !== 'locked' ? 'not locked' : si.ready ? 'solution ready' : 'solution ' + Math.round(100 * si.prog) + ' percent') + '.'; }
      case 'weapons': return 'Magazine ' + (S.mag ? S.mag.total : 0) + ' of ' + (S.mag ? S.mag.max : 0) + '. Point defence ' + (S.pd || 'cold') + '.';
      case 'helm': return 'Speed ' + String(S.speed || 'v1').toUpperCase() + ', heading ' + Math.round(((S.hdg || 0) * 180 / Math.PI % 360 + 360) % 360) + '. Posture ' + (POSTURE.current) + '.';
      case 'engineering': return 'Drive ' + Math.round((S.thrust || 0) * 100) + ' percent, water ' + Math.round(S.water || 0) + ' tonnes, load ' + (S.gNow || 0).toFixed(2) + ' g.';
      case 'thermal': return 'Sink at ' + Math.round((S.sink ? S.sink.h : 0) * 100) + ' percent. Fins ' + (S.vent && S.vent.on ? 'out' : 'stowed') + '.';
      case 'damage': { const hurt = Object.keys(S.crew || {}).filter(k => S.crew[k].inj); return 'Hull ' + Math.round(S.hull == null ? 100 : S.hull) + ' percent. ' + (hurt.length ? hurt.join(' and ') + ' hurt.' : 'Crew fit.'); }
      case 'comms': { const c = CTL.topCall && CTL.topCall(); return c ? String(c.officer) + ' is waiting on you.' : 'No calls waiting. Link quiet.'; }
    } } catch (e) { } return 'Standing by.'; }
  const OFFR = { sensors: 'Quill', fire: 'Abara', weapons: 'Abara', helm: 'Abara', engineering: 'Castellan', thermal: 'Dace', damage: 'Fenwick', comms: 'Pell' };
  const askItem = stn => ({ lab: 'REPORT', fn: () => { const t = askText(stn); say2(OFFR[stn], t, 2); tt(OFFR[stn].toUpperCase() + ': ' + t, 'g'); } });
  // ship posture presets (not brace: that is the crew's body state and has its own order)
  const POSTURE = window.POSTURE = { current: 'cruise', PRE: { silent: ['spd:v1', 'act:quiet', 'pd:cold'], cruise: ['spd:v3', 'pd:cold'], combat: ['spd:v4'], evade: ['spd:v5', 'post:evade'] }, LAB: { silent: 'Silent run', cruise: 'Cruise', combat: 'Combat', evade: 'Evade' },
    set(name) { if (!this.PRE[name] || typeof CTL === 'undefined') return false; const done = [], skipped = []; for (const id of this.PRE[name]) { if (CTL.can(id).ok === false) { skipped.push(id); continue; } try { CTL.activate(id); done.push(id); } catch (e) { skipped.push(id); } } this.current = name; tt('POSTURE: ' + this.LAB[name].toUpperCase() + (skipped.length ? '  (' + skipped.length + ' not available now)' : ''), 'g'); say2('Abara', this.LAB[name] + ', aye.', 2); return { done, skipped }; } };
  const mkSTN = () => ({ sensors: [askItem('sensors'), idItem('act:classify', 'CLASSIFY'), idItem('act:ping', 'PING'), idItem('act:quiet', 'QUIET'), idItem('act:rule', 'RULE OUT'), idItem('act:rescan', 'RESCAN')],
    fire: [askItem('fire'), idItem('act:lock', 'LOCK'), idItem('act:refresh', 'REFRESH')],
    weapons: [askItem('weapons'), idItem('act:probe', 'PROBE'), idItem('fire', 'FIRE'), idItem('pd:toggle', 'PD'), idItem('act:mark', 'MARK')],
    helm: [askItem('helm'), idItem('spd:v1', 'SLOW 20'), idItem('spd:v3', 'CRUISE 60'), idItem('spd:v5', 'FAST 100'), idItem('post:still', 'HOLD'), idItem('post:evade', 'EVADE')],
    engineering: [askItem('engineering'), idItem('spd:ab', 'REDLINE'), idItem('brace', 'BRACE')],
    thermal: [askItem('thermal'), idItem('vent', 'VENT'), idItem('spd:cut', 'CUT SPEED')],
    damage: [askItem('damage'), idItem('brace', 'BRACE')], comms: [askItem('comms'), idItem('ack', 'ACK ALARMS')] });
  const callTree = () => { const STN = mkSTN(); return [{ lab: 'QUILL', kids: STN.sensors }, { lab: 'ABARA', kids: [askItem('fire'), idItem('act:lock', 'LOCK'), idItem('fire', 'FIRE'), idItem('act:probe', 'PROBE'), idItem('post:evade', 'EVADE'), idItem('spd:v3', 'CRUISE')] }, { lab: 'CASTELLAN', kids: STN.engineering }, { lab: 'DACE', kids: STN.thermal },
    { lab: 'FENWICK', kids: STN.damage }, { lab: 'PELL', kids: STN.comms }, { lab: 'POSTURE', kids: Object.keys(POSTURE.LAB).map(k => ({ lab: POSTURE.LAB[k].toUpperCase(), fn: () => POSTURE.set(k) })) }]; };
  // Readiness (docs/ship_conditions.md): how the crew is posted. Separate from POSTURE (how the ship moves and emits). Lamp shape plus colour so colour is never the only cue. Pell sounds the alert.
  const READY = window.READINESS = { current: 'watch', LAB: { watch: 'Standing Watch', alert: 'Alert', battle: 'Battle Stations' }, SHORT: { watch: 'WATCH', alert: 'ALERT', battle: 'BATTLE' }, SHAPE: { watch: '●', alert: '▲', battle: '■' }, COL: { watch: '#4cd98a', alert: '#ffb43c', battle: '#ff5a4d' },
    PELL: { watch: 'Standing watch. All stations on auto.', alert: 'Alert. All hands to stations.', battle: 'Battle stations. Battle stations.' },
    set(name) { if (!this.LAB[name] || this.current === name) return false; this.current = name; tt('READINESS: ' + this.SHAPE[name] + ' ' + this.LAB[name].toUpperCase(), name === 'watch' ? 'g' : 'w'); say2('Pell', this.PELL[name], 3); snd2(name === 'battle' ? 'alarm' : 'tick'); lampUpdate(); return true; } };
  const lamp = document.createElement('div'); lamp.style.cssText = 'position:fixed;right:12px;bottom:12px;z-index:30;pointer-events:none;font:bold 13px monospace;background:#08201cd9;border:1px solid #1d4a42;border-radius:14px;padding:5px 12px;color:#c4dcd2'; document.body.appendChild(lamp);
  function lampUpdate() { lamp.innerHTML = '<span style="color:' + READY.COL[READY.current] + '">' + READY.SHAPE[READY.current] + '</span> ' + READY.LAB[READY.current].toUpperCase() + ' · ' + (POSTURE.LAB[POSTURE.current] || '').toUpperCase(); }
  lampUpdate(); setInterval(lampUpdate, 1000);
  // C: the ship radial (middle mouse, from the nearest intercom). D: the contact radial (click a target).
  const shipTree = () => [{ lab: 'POSTURE', kids: Object.keys(POSTURE.LAB).map(k => ({ lab: POSTURE.LAB[k].toUpperCase() + (POSTURE.current === k ? ' •' : ''), fn: () => POSTURE.set(k) })) },
    { lab: 'READINESS', kids: Object.keys(READY.LAB).map(k => ({ lab: READY.SHAPE[k] + ' ' + READY.SHORT[k] + (READY.current === k ? ' •' : ''), fn: () => READY.set(k) })) },
    idItem('brace', 'BRACE'), { lab: 'DAMAGE CTRL', off: true }];
  const contactTree = () => [idItem('act:classify', 'WATCH'), idItem('act:challenge', 'CHALLENGE'), idItem('act:hail', 'HAIL'), idItem('act:ping', 'PING'), idItem('act:mark', 'HOSTILE'), idItem('act:rule', 'RULE OUT')];
  function toIntercom(done) {   // the player goes to the nearest intercom to give ship-wide orders (four per room, on the wall at the compass points)
    if (st.mode !== 'room' || st.room === 'T' || st.lvl || st.zoom) return done(); const g = roomG[st.room]; if (!g) return done();
    const rr = g.metadata.room, base = g.getAbsolutePosition(), lx = who.position.x - base.x, lz = who.position.z - base.z, d = rr.r - .9; let best = null, bd = 1e9;
    for (const [ux, uz] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) { const dd = Math.hypot(ux * d - lx, uz * d - lz); if (dd < bd) { bd = dd; best = [ux * d, uz * d]; } }
    if (bd < 1.6) return done(); const q = pushOut(rr, best[0], best[1], feetOf(rr)); tween.length = 0; tt('To the intercom...', 'g'); walkTo(q[0], q[1], done); }
  (function mkIntercoms() { const m = new B.StandardMaterial('icomM', sc); m.diffuseColor = new B.Color3(.08, .12, .12); m.emissiveColor = new B.Color3(.08, .5, .42);
    R.forEach(r => { const g = roomG[r.id]; if (!g || !g.metadata || !g.metadata.room || g.metadata.room.kind === 'tubes') return; const rm = g.metadata.room; [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([ux, uz], i) => { const b = B.MeshBuilder.CreateBox('icom_' + r.id + '_' + i, { width: .26, height: .18, depth: .05 }, sc); b.material = m; b.parent = g; b.position.set(ux * (rm.r - .12), rm.y + 1.4, uz * (rm.r - .12)); b.rotation.y = Math.atan2(ux, uz); b.isPickable = false; }); }); })();

  // ---- brace behaviour (docs/ship_animation_and_sandbox.md section 5). On a brace order Abara walks to the nearest brace point and stand-easy sends her back. A knocked-out officer slumps. The avatar is thrown by a hit, a jump or a loaded burn unless braced: next to a belt or seat, or holding a rail or handhold while the crew are braced.
  const BRC = window.BRACING = { S: null, seen: 0, thrown: null, ab: { ko: false, home: null }, SPEED: 1.7,
    pts(id) { const g = roomG[id || st.room]; return (g && g.metadata && g.metadata.brace) || []; },
    nearest(x, z, list) { let b = null, bd = 1e9; (list || []).forEach(p => { const d = Math.hypot(p.x - x, p.z - z); if (d < bd) { bd = d; b = p; } }); return { p: b, d: bd }; },
    braced() { if (st.mode !== 'room' || !HS.ok) return false; const g = roomG[st.room]; if (!g) return false; const base = g.getAbsolutePosition(), n = this.nearest(who.position.x - base.x, who.position.z - base.z, this.pts()); if (!n.p || n.d > 1.1) return false; return n.p.type === 'belt' || n.p.type === 'seat' || HS.S.brace !== 'free'; },
    throwAvatar(k, why) { if (this.thrown || st.mode !== 'room' || st.room === 'T' || this.braced()) return false; const h = Math.abs(Math.sin((HS.S.t + 1) * 12.9898) * 43758.5453) % 1, a = h * 6.283; this.thrown = { t: 0, dur: 1.0 + 1.4 * k, vx: Math.cos(a) * 3.2 * k, vz: Math.sin(a) * 3.2 * k, k }; tween.length = 0; tt('THROWN (' + why + '): hold a rail or sit and brace', 'w'); snd2('thud'); window.SHIPFX && SHIPFX.shake(.4 + .5 * k); return true; },
    events(S) { if (this.S !== S) { this.S = S; this.seen = 0; } const ev = S.evts || [];
      for (; this.seen < ev.length; this.seen++) { const e = ev[this.seen], d = e.data || {};
        if (e.type === 'impact' && d.dmg >= 6) this.throwAvatar(Math.min(1, d.dmg / 40), 'hit');
        else if (e.type === 'jump') this.throwAvatar(.9, 'jump');
        else if (e.type === 'unsecure') this.throwAvatar(.35, 'hard burn');
        else if (e.type === 'brace_plan') tt('BRACE: ' + d.g.toFixed(1) + ' g ' + (d.kind === 'rotate' ? 'turn' : 'burn') + ' ahead, crew are strapping in', 'w');
        else if (e.type === 'g_tired') tt(String(d.officer).toUpperCase() + ' is tiring under the load', 'w');
        else if (e.type === 'ko' && d.cause === 'blackout') { tt(String(d.officer).toUpperCase() + ' BLACKED OUT (g-force)', 'w'); if (d.officer === 'Abara') this.ab.ko = true; }
        else if (e.type === 'ko' && d.officer === 'Abara') this.ab.ko = true;
        else if (e.type === 'woke' && d.officer === 'Abara') this.ab.ko = false; } },
    update(S, dt) { this.events(S); dt = Math.min(dt, .1);
      const T = this.thrown; if (T) { T.t += dt; const g = roomG[st.room], rr = g.metadata.room, base = g.getAbsolutePosition(), f = Math.pow(Math.max(0, 1 - T.t / T.dur), 2), [cx, cz] = clampIn(rr, who.position.x - base.x + T.vx * f * dt, who.position.z - base.z + T.vz * f * dt); who.position.x = base.x + cx; who.position.z = base.z + cz; who.rotation.z = Math.sin(Math.min(1, T.t / T.dur) * Math.PI) * 1.3; if (T.t >= T.dur) { this.thrown = null; who.rotation.z = 0; } }
      const sl = slots.abara, root = sl && sl.root; if (!root) return; const ab = this.ab; if (!ab.home) ab.home = { x: root.position.x, z: root.position.z, y: root.position.y };
      if (ab.ko) { root.rotation.z += (1.45 - root.rotation.z) * Math.min(1, dt * 5); root.position.y = ab.home.y + .22; return; }
      if (root.rotation.z > .01) { root.rotation.z *= Math.max(0, 1 - dt * 4); root.position.y = ab.home.y; }
      let tx = ab.home.x, tz = ab.home.z, face = null;
      if (S.brace !== 'free') { if (!ab.bp) { const n = this.nearest(root.position.x, root.position.z, this.pts('A1').filter(p => p.type !== 'seat')); ab.bp = n.p; } if (ab.bp) { tx = ab.bp.x; tz = ab.bp.z; face = Math.atan2(-tx, -tz); } } else ab.bp = null;
      const dx = tx - root.position.x, dz = tz - root.position.z, dist = Math.hypot(dx, dz), step = this.SPEED * dt;
      if (dist > step) { root.position.x += dx / dist * step; root.position.z += dz / dist * step; root.rotation.y = Math.atan2(dx, dz); } else { root.position.x = tx; root.position.z = tz; root.rotation.y = face != null ? face : 0; } } };
  // the other rooms have no brace points yet: eight grab rails round the wall, so the avatar can brace anywhere
  R.forEach(r => { const g = roomG[r.id]; if (!g || !g.metadata || !g.metadata.room || g.metadata.room.kind === 'tubes' || g.metadata.brace) return; const rm = g.metadata.room, rm2 = new B.StandardMaterial('railM' + r.id, sc); rm2.diffuseColor = new B.Color3(.9, .76, .2); g.metadata.brace = [];
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + Math.PI / 8, x = Math.cos(a) * (rm.r - .45), z = Math.sin(a) * (rm.r - .45), bar = B.MeshBuilder.CreateBox('handhold_' + r.id + '_' + i, { width: .05, height: .55, depth: .05 }, sc); bar.material = rm2; bar.parent = g; bar.position.set(x, rm.y + 1.2, z); bar.isPickable = false; g.metadata.brace.push({ x, z, y: 1.2, type: 'handhold' }); } });
  function radOpen(x, y, label) { radialOpen(contactTree(), x, y, label, { sticky: true }); }
  cv.addEventListener('mousedown', e => { if (e.button !== 1) return; e.preventDefault(); radClose(); if (!HS.ok || typeof CTL === 'undefined') return; const x = e.clientX, y = e.clientY; toIntercom(() => radialOpen(shipTree(), x, y, 'SHIP', { sticky: true })); });
  cv.addEventListener('auxclick', e => { if (e.button === 1) e.preventDefault(); });
  cv.addEventListener('contextmenu', e => { e.preventDefault(); radClose(); if (!HS.ok || typeof CTL === 'undefined') return; ptr.x = e.clientX; ptr.y = e.clientY; if (st.zoom) { sc.pointerX = e.offsetX; sc.pointerY = e.offsetY; const h = scrHit(); if (h && h.reg && /^sel:\d+$/.test(h.reg.id)) { CTL.select(+h.reg.id.slice(4)); radOpen(e.clientX, e.clientY, 'CONTACT ' + h.reg.id.slice(4)); return; } } radialOpen(callTree(), e.clientX, e.clientY, 'CALL', { sticky: true }); });
  addEventListener('pointerdown', e => { if (!radEl.contains(e.target) && !RADIAL.by) radClose(); });
  // station keys: F1-F8. Tap = go to that screen, tap again = back to the command view. Hold = that station's radial. Shift + key = peek (back on release).
  const SKEY = { F1: { m: 'pscr:overview', call: true }, F2: { st: 0, stn: 'sensors' }, F3: { st: 1, stn: 'fire' }, F4: { st: 2, stn: 'weapons' }, F5: { st: 3, stn: 'thermal' }, F6: { st: 4, stn: 'comms' }, F7: { m: 'scr:nav', stn: 'helm' }, F8: { m: 'pscr:power', stn: 'engineering' } };
  const skMesh = d => sc.meshes.find(m => m.metadata && m.metadata.screen && (d.m ? m.name === d.m : (m.metadata.station === d.st && !m.metadata.passive)));
  const skDown = {}, bq = { timer: 0, held: false };
  function stationDown(e, k) { const d = SKEY[k]; if (!d || !HS.ok) return false; e.preventDefault(); if (skDown[k]) return true; if (st.room !== 'A1') { tt('Stations are in the control room (key 9)', 'w'); return true; }
    const o = skDown[k] = { t: performance.now(), peek: e.shiftKey, held: false };
    if (!e.shiftKey) o.timer = setTimeout(() => { o.held = true; radialOpen(d.call ? callTree() : mkSTN()[d.stn], innerWidth / 2, innerHeight / 2, d.call ? 'CALL' : (OFFR[d.stn] || '').toUpperCase(), { by: k }); }, 250);
    else { const m = skMesh(d); if (m) zoomTo(m); }
    return true; }
  function stationUp(k) { const o = skDown[k], d = SKEY[k]; if (!o) return; delete skDown[k]; clearTimeout(o.timer);
    if (o.peek) { if (st.zoom) unzoom(); return; } if (o.held) { radRelease(k); return; }
    const m = skMesh(d); if (!m) return; if (st.zoom && st.zoom.mesh === m) unzoom(); else zoomTo(m); }
  const ZKEY = { KeyC: 'act:classify', KeyL: 'act:lock', KeyP: 'act:ping', KeyO: 'act:probe', KeyX: 'act:rule', KeyR: 'act:refresh', KeyM: 'act:mark', KeyU: 'act:quiet', KeyY: 'pd:toggle', KeyH: 'post:still', KeyZ: 'post:evade', KeyF: 'fire', KeyG: 'guard' };
  function ctlKeys(e, k) {
    if (!HS.ok || typeof CTL === 'undefined') return false;
    const c = CTL.topCall && CTL.topCall(); if (c && k === 'Digit0') { CTL.activate('call:wait'); return true; } if (c && /^Digit[1-5]$/.test(k) && c.opts && c.opts[+k.slice(5) - 1]) { CTL.activate('callopt:' + (+k.slice(5) - 1)); snd2('click'); callKey = ''; return true; }
    if (k === 'KeyB') { CTL.activate('brace'); return true; } if (k === 'KeyT') { CTL.activate('time'); return true; } if (k === 'Space') { e.preventDefault(); CTL.activate('ack'); return true; }
    if (k === 'KeyK') { if (window.AUD) { AUD.mute(!AUD.muted); tt(AUD.muted ? 'MUTED' : 'SOUND ON'); } return true; }
    if (k === 'Tab') { e.preventDefault(); CTL.selStep(e.shiftKey ? -1 : 1); return true; }
    if (k === 'Escape') { radClose(); return false; }
    if (st.zoom) { if (ZKEY[k]) { CTL.activate(ZKEY[k]); return true; } if (k === 'BracketLeft' || k === 'BracketRight') { const L = ['v1', 'v2', 'v3', 'v4', 'v5'], i = Math.max(0, L.indexOf(HS.S.speed)), j = Math.max(0, Math.min(4, i + (k === 'BracketRight' ? 1 : -1))); CTL.activate('spd:' + L[j]); return true; } }
    return false; }
  function hunt(dt) {
    if (!HS.ok) return; const S = HS.S, E = HS.E; const ts = (window.CIC ? CIC.tscale : 1) * (window.RADIAL && RADIAL.open ? .25 : 1); if (!S.over && !S.hold) E.tick(S, dt / E.P.secPerMin * ts); const evs = HS.A.update(S, S.over || S.hold ? 0 : dt * ts); if (evs && evs.length) onEvents(evs); LS.ctx.annOut = HS.ANN.update({ s: S, model: HS.A.model, E }); if (window.CIC) CIC.fire('frame', dt); callTick(dt); BRC.update(S, dt); if (HS.Y && LK) HS.Y.lock = LK; if (HS.Y && window.SHIPSYS) { SHIPSYS.update(HS.Y, S, S.over || S.hold ? 0 : dt / E.P.secPerMin); if (window.PS) Object.assign(PS.ctx, { S, E, A: HS.A, Y: HS.Y, ann: LS.ctx.annOut }); }
    FINS.to = S.vent && S.vent.on ? 1 : 0; st.hunting = !S.over; { const bad = [], ao = LS.ctx.annOut || { lamps: {} }; for (const id in ao.lamps) { const l = ao.lamps[id]; if (l.state === 'warning' || l.state === 'caution') bad.push([l.state, id.toUpperCase().replace(/_/g, ' ')]); }
      if (HS.Y && window.SHIPSYS) SHIPSYS.lamps(HS.Y, S).forEach(l => { if (l.state === 'warning' || l.state === 'caution') bad.push([l.state, l.label]); });
      const w = bad.some(b => b[0] === 'warning'), key = bad.map(b => b[1]).join('|') + w; st.alarm = w ? 2 : bad.length ? 1 : 0;
      if (almEl._k !== key) { almEl._k = key; almEl.style.display = bad.length ? 'block' : 'none'; almEl.style.borderColor = w ? '#ff4a3d' : '#f0ab3a'; almEl.innerHTML = '<b style="color:' + (w ? '#ff7a6d' : '#f0ab3a') + '">' + (w ? 'WARNING' : 'CAUTION') + '</b> ' + bad.slice(0, 6).map(b => b[1]).join(' · ') + (bad.length > 6 ? ' +' + (bad.length - 6) : '') + ' <span style="opacity:.6">(see annunciator in the CIC)</span>'; } }
    if (!LS.ctx.sel && S.an.length) LS.ctx.sel = (S.an.find(a => a.state !== 'out') || S.an[0]).id;
    if (st.room !== 'A1' || st.mode !== 'room') return; const now = performance.now();
    for (const n in HS.tex) { const per = st.zoom && st.zoom.mesh.metadata.screen === n ? 110 : HS.tex[n].passive ? 700 : 450; if (now - (HS.last[n] || 0) < per) continue; HS.last[n] = now; HS.tex[n].o.paint(now); HS.tex[n].tex.update(false); } }
  const keys = {};
  addEventListener('keydown', e => { keys[e.code] = 1; if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return; const k = e.code; if (k === 'Backspace' && st.zoom && HS.ok) { e.preventDefault(); window.SHIPNAV.back(); return; } if (stationDown(e, k)) return; if (k === 'Backquote') { e.preventDefault(); bq.timer = setTimeout(() => { bq.held = true; radialOpen(callTree(), innerWidth / 2, innerHeight / 2, 'CALL', { by: 'bq' }); }, 200); return; } if (ctlKeys(e, k)) return; if (k === 'Escape') unzoom();
    if (k === 'Digit6') setCam('orbit'); else if (k === 'Digit7') setCam('shoulder'); else if (k === 'Digit9') setCam('cmd'); else if (k === 'KeyV') { if (HS.ok && typeof CTL !== "undefined") { CTL.activate('vent'); return; } FINS.to = FINS.to ? 0 : 1; if (window.UI) UI.toast(FINS.to ? 'VENT: radiator blades running out' : 'Blades retracting (silent running)', FINS.to ? 'w' : 'g'); }
    else if (k === 'KeyR' || k === 'PageUp') climbStep(1); else if (k === 'KeyF' || k === 'PageDown') climbStep(-1);
    else if (lkShown && (k === 'KeyH' || k === 'KeyJ' || k === 'KeyC')) lkAct(k === 'KeyH' ? 'inner' : k === 'KeyJ' ? 'outer' : 'cycle');
    else if (k === 'Digit8') document.getElementById('shipbtn').click();
    else if (k === 'KeyQ' || k === 'KeyE') { const i = R.findIndex(r => r.id === st.room), j = Math.max(0, Math.min(R.length - 1, i + (k === 'KeyQ' ? 1 : -1))); if (j !== i) goTo(R[j].id); } });
  addEventListener('keyup', e => { delete keys[e.code]; if (SKEY[e.code]) stationUp(e.code); if (e.code === 'Backquote') { clearTimeout(bq.timer); if (bq.held) radRelease('bq'); bq.held = false; } }); addEventListener('blur', () => { for (const k in keys) delete keys[k]; });
  // keyboard walking: relative to wherever the active camera looks (fp, room centre or orbit), clamped inside the room
  function drive(dt) {
    if (BRC.thrown) return;   // thrown: no control until you land
    const dx = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0), dz = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0); if ((!dx && !dz) || st.mode === 'ship') return; unzoom();
    const d = sc.activeCamera.getForwardRay().direction, f = new B.Vector3(d.x, 0, d.z); if (f.length() < 1e-3) return; f.normalize(); const v = f.scale(dz).add(new B.Vector3(-f.z, 0, f.x).scale(dx)); v.normalize();
    const t0 = tween[0]; if (t0 && (t0.k === 'climb' || t0.k === 'lad')) return; tween.length = 0; const g = roomG[st.room], rr = g.metadata.room, s = (keys.ShiftLeft || keys.ShiftRight ? 5.5 : 3.2) * dt;
    if (st.lvl && st.room === 'T') { const bs = g.getAbsolutePosition(), lx = Math.max(-.9, Math.min(.9, who.position.x + v.x * s - bs.x)), lz = Math.max(-1.0, Math.min(3.3, who.position.z + v.z * s - bs.z)); faceMove(bs.x + lx - who.position.x, bs.z + lz - who.position.z); who.position.x = bs.x + lx; who.position.z = bs.z + lz; return; }   // standing on a catwalk landing
    const [nx, nz] = clampIn(rr, who.position.x + v.x * s - g.position.x, who.position.z + v.z * s - g.position.z); faceMove(g.position.x + nx - who.position.x, g.position.z + nz - who.position.z); who.position.x = g.position.x + nx; who.position.z = g.position.z + nz; }
  // ---- airlock: animation of the 3D parts from the state machine, the contextual panel near the lock, and the mission API
  const lkBox = document.createElement('div'); lkBox.style.cssText = 'display:none;position:fixed;left:max(16px,env(safe-area-inset-left,0px));top:calc(300px + env(safe-area-inset-top,0px));width:236px;padding:8px 10px;background:rgba(12,22,24,.9);border:1px solid #3c6074;border-radius:4px;color:#d7e3ea;font:12px system-ui,sans-serif;z-index:5'; document.body.appendChild(lkBox);
  const lsnd = n => { try { window.AUD && AUD.play(n); } catch (e) { } };
  function lkAct(a, o) { if (!LK) return; const r = AIRLOCK.act(LK, a, o); if (!r.ok && r.why && window.UI) UI.toast(r.why, 'w'); else lsnd('click'); lkKey = ''; return r; }
  let lkKey = '', lkShown = false;
  function lockTick(dt) {
    if (!LK || !LKV) return; AIRLOCK.update(LK, dt); const V = LKV, e = (a, b, k) => a + (b - a) * Math.min(1, k);
    V.ci = e(V.ci, 1 - LK.hatchI, dt * 8); V.co = e(V.co, 1 - LK.hatchO, dt * 8); const si = Math.max(.001, V.ci), so = Math.max(.001, V.co);
    V.idoor.scaling.set(si, 1, si); V.idoor.setEnabled(V.ci > .01); V.odoor.scaling.set(so, 1, so); V.odoor.setEnabled(V.co > .01);
    V.tubeN.scaling.z = Math.max(.001, LK.tube); const dockOn = LK.tube > .02 && LK.outside.id; V.tubeN.setEnabled(LK.tube > .02); V.vesN.setEnabled(!!dockOn);
    if (dockOn) { V.vesN.position.set(0, 1.0, -(V.r + LOCK_LEN + 6 * LK.tube + .15)); V.vm.albedoColor = LK.outside.p >= .9 ? new B.Color3(.2, .3, .38) : LK.outside.p > 0 ? new B.Color3(.3, .24, .18) : new B.Color3(.18, .15, .15); }
    const t = performance.now() / 1000, col = (m, r, g, b) => m.emissiveColor.set(r, g, b), blink = Math.sin(t * 8) > 0;
    LK.inner === 'open' || LK.hatchI > 0 ? col(V.lI, 1, .65, .1) : col(V.lI, .1, .8, .4); LK.busy && LK.busy.k === 'cycle' ? (blink ? col(V.lC, 1, .65, .1) : col(V.lC, .15, .1, .02)) : col(V.lC, .1, .1, .1);
    LK.outer === 'open' || LK.hatchO > 0 ? col(V.lO, 1, .2, .15) : col(V.lO, .1, .8, .4);
    // panel: only when standing at the lock mouth or inside it
    const g = roomG.B2, rr = g.metadata.room, px = who.position.x - g.position.x, pz = who.position.z - g.position.z, near = st.room === 'B2' && st.mode === 'room' && !st.zoom && pz < -(rr.r - 1.6) && Math.abs(px) < 1.4;
    if (!near) { if (lkShown) { lkBox.style.display = 'none'; lkShown = false; } return; }
    const key = AIRLOCK.status(LK) + (LK.busy ? 'b' + LK.busy.k : '') + (LK.mission ? LK.mission.id + LK.boarded : '') + (LK.busy ? Math.round(LK.p * 100) : '');
    if (key === lkKey && lkShown) return; lkKey = key; lkShown = true; lkBox.style.display = 'block'; lkBox.innerHTML = '';
    const line = (txt, css) => { const d = document.createElement('div'); d.style.cssText = css || ''; d.innerHTML = txt; lkBox.appendChild(d); return d; };
    const btn = (label, fn, ok) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = label; b.style.cssText = 'display:block;width:100%;margin:3px 0 0;text-align:left;opacity:' + (ok === false ? .5 : 1); b.onclick = fn; lkBox.appendChild(b); return b; };
    line('<b style="color:#c9a24a">BOARDING AIRLOCK</b>', 'margin-bottom:3px'); line(AIRLOCK.status(LK), 'font:11px ui-monospace,monospace;opacity:.85;margin-bottom:4px');
    const c = a => AIRLOCK.can(LK, a).ok, tgt = AIRLOCK.target(LK), toOut = Math.abs(LK.p - tgt) > .05 && LK.p > .5 * (1 + tgt);
    btn((LK.inner === 'open' ? 'Close' : 'Open') + ' inner hatch  [H]', () => lkAct('inner'), c('inner'));
    btn(toOut ? 'Cycle lock to outside (' + AIRLOCK.pct(tgt) + ' kPa)  [C]' : 'Repressurise lock to cabin  [C]', () => lkAct('cycle'), c('cycle'));
    btn((LK.outer === 'open' ? 'Close' : 'Open') + ' outer hatch  [J]', () => lkAct('outer'), c('outer'));
    btn(LK.suited ? 'Stow suit' : 'Suit up (locker)', () => lkAct('suit'), true);
    if (LK.mission && LK.docked && LK.outer === 'open') { line('<b>' + (LK.mission.label || LK.mission.id) + '</b>', 'margin-top:6px'); (LK.mission.prompt || ['Begin boarding', 'Look around first']).forEach((p, i) => btn(p, () => { AIRLOCK.choose(LK, i); lkKey = ''; if (window.UI) UI.toast(i ? 'You look around first.' : 'Boarding ' + (LK.mission.label || ''), 'g'); }, true)); }
    line('Test: mate the soft-dock tube', 'margin-top:7px;opacity:.7;font-size:11px');
    [['Friendly ship (101 kPa)', { id: 'tern', label: 'the Tern', p: 1 }], ['Derelict (30 kPa)', { id: 'hulk', label: 'derelict hulk', p: .3 }], ['Vented wreck (0 kPa)', { id: 'wreck', label: 'vented wreck', p: 0 }]].forEach(([t, h]) => btn(t, () => { const r = AIRLOCK.dock(LK, h); if (!r.ok && window.UI) UI.toast(r.why, 'w'); lkKey = ''; }, c('extend')));
    btn('Retract tube / undock', () => { const r = AIRLOCK.undock(LK); if (!r.ok && window.UI) UI.toast(r.why, 'w'); lkKey = ''; }, c('retract'));
  }
  function step(dt) {
    drive(dt); hunt(dt); lockTick(dt);
    const t = tween[0]; if (!t) return; const g = roomG[st.room], rr = g.metadata.room;
    if (t.k === 'walk') { const base = g.getAbsolutePosition(); if (!t.path) t.path = plan(rr, who.position.x - base.x, who.position.z - base.z, t.x, t.z, feetOf(rr)); const wp = t.path[0]; if (!wp) { tween.shift(); t.done && t.done(); return; }
      const tx = base.x + wp.x, tz = base.z + wp.z, dx = tx - who.position.x, dz = tz - who.position.z, d = Math.hypot(dx, dz), s = 3.2 * dt;
      if (d <= s) { who.position.x = tx; who.position.z = tz; t.path.shift(); if (!t.path.length) { tween.shift(); t.done && t.done(); } } else { faceMove(dx, dz); who.position.x += dx / d * s; who.position.z += dz / d * s; } }
    else if (t.k === 'lad') { const base = g.getAbsolutePosition(), ty = g.position.y + LAD.lv[t.lv] + .95, dy = ty - who.position.y, s = 2.6 * dt; who.position.x = base.x; who.position.z = base.z + t.lz; if (Math.abs(dy) <= s) { who.position.y = ty; tween.shift(); t.done && t.done(); } else who.position.y += Math.sign(dy) * s; }
    else if (t.k === 'climb') { const to = roomG[t.id].metadata.room, ty = to.y + .95, dy = ty - who.position.y, near = Math.min(...R.map(q => Math.abs(q.y - (who.position.y - .95)))), s = 6 * dt * (.35 + .65 * Math.min(1, near / 1.5)); who.position.x = -CELL_R; if (Math.abs(dy) <= s) { who.position.y = ty; tween.shift(); t.done && t.done(); } else { who.position.y += Math.sign(dy) * s; st.tgt.y += (who.position.y - st.tgt.y) * .1; } }
  }
  sc.onBeforeRenderObservable.add(() => { step(Math.min(.05, eng.getDeltaTime() / 1000)); if (!(st.cam === 'shoulder' && st.mode === 'room')) cam.target.copyFrom(B.Vector3.Lerp(cam.target, st.tgt, .12));   // setTarget re-derives alpha/beta/radius from the old position, so the target is always changed in place: the orbit camera then travels WITH its target to the new deck instead of staying at the old deck and just turning to look at it
    if (st.mode === 'room' && st.cam !== 'fp' && st.room !== 'A1') { const rr = roomG[st.room].metadata.room, ceil = rr.y + rr.h - .3, dy = ceil - cam.target.y;   // a deck sits over every room but the control room: keep the camera under that ceiling (so it looks across the deck from the rim instead of down through the deck above)
      const need = dy > 0 ? Math.acos(Math.max(-1, Math.min(1, dy / cam.radius))) : 1.5; if (cam.beta < need) cam.beta = Math.min(1.5, need); }
    fadeWalls();
    if (st.cam === 'fp') { if (st.zoom) zoomStep(); else fp.position.set(who.position.x, who.position.y + .65, who.position.z); }
    if (st.cam === 'shoulder' && st.mode === 'room') { st.tgt.set(who.position.x, who.position.y + .35, who.position.z); cam.target.copyFrom(st.tgt); }
    hull.isVisible = nose.isVisible = st.mode === 'ship'; extG.setEnabled(st.mode === 'ship'); planet.setEnabled(st.mode === 'ship'); sun.setEnabled(st.mode === 'ship'); if (st.mode === 'ship') cam.alpha += .0006; animate(performance.now() / 1000); });
  // walls fade out where they sit between the camera and the character (current room only)
  function fadeWalls() {
    const cp = sc.activeCamera.position, W = who.position;
    for (const id in roomG) { const gm = roomG[id].metadata; if (gm.ceil) { const show = cp.y < roomG[id].position.y + gm.room.h - .1 || st.mode === 'ship'; gm.ceil.forEach(m => { if (m.isVisible !== show) m.isVisible = show; }); } }   // ceilings are only drawn when the camera is under them
    for (const id in roomG) { const g = roomG[id], r = g.metadata.room, on = id === st.room && st.mode === 'room' && st.cam !== 'fp', ax = g.position.x, az = g.position.z, top = g.position.y + r.h + .3, outside = Math.hypot(cp.x - ax, cp.z - az) > r.r - .3;
      if (g.metadata.pod) { const pd = g.metadata.pod, inside = Math.hypot(W.x - ax, W.z - az) < pd.r - .15 && id === st.room, camIn = Math.hypot(cp.x - ax, cp.z - az) < pd.r - .1, tvp = inside && !camIn && on ? .1 : 1; pd.vis = (pd.vis == null ? 1 : pd.vis) + (tvp - (pd.vis == null ? 1 : pd.vis)) * .18; pd.walls.forEach(m => { m.visibility = pd.vis > .985 ? 1 : pd.vis; }); }
      for (const sg of g.metadata.segs) { let tv = 1;
        if (on && outside) { const ca = sg.a, cx = ax + Math.cos(ca) * r.r, cz = az + Math.sin(ca) * r.r, tx = -Math.sin(ca) * r.r * Math.sin(Math.PI / 24) * 2.6, tz = Math.cos(ca) * r.r * Math.sin(Math.PI / 24) * 2.6;   // chord, widened a little so neighbours soften the edge
          for (const o of [-.9, 0, .9]) { const dx = W.x - cp.x, dz = W.z - cp.z, l = Math.hypot(dx, dz) || 1, wx = W.x - dz / l * o, wz = W.z + dx / l * o, d1x = wx - cp.x, d1z = wz - cp.z, d2x = 2 * tx, d2z = 2 * tz, den = d1x * d2z - d1z * d2x; if (Math.abs(den) < 1e-6) continue;
            const qx = (cx - tx) - cp.x, qz = (cz - tz) - cp.z, u = (qx * d2z - qz * d2x) / den, v = (qx * d1z - qz * d1x) / den; if (u > 0 && u < 1 && v > 0 && v < 1 && cp.y + u * (W.y - cp.y) < top) { tv = .1; break; } } }
        sg.vis += (tv - sg.vis) * .18; if (Math.abs(sg.vis - (sg._v || 1)) > .01 || tv === 1 && sg.vis > .99) { sg._v = sg.vis; for (const m of sg.items) { m.visibility = sg.vis > .985 ? 1 : sg.vis; } } } } }
  function animate(t) {
    FINS.v += (FINS.to - FINS.v) * .025; FINS.hinges.forEach(h => { h.scaling.x = .02 + .98 * FINS.v; }); FINS.bladeM.emissiveIntensity = .1 + .8 * FINS.v;
    const ls = st.alarm || 0; for (const b of life.blink) b.m.emissiveIntensity = b.c === 0 ? (ls === 0 ? .8 + .2 * Math.sin(t * 2.1 + b.ph) : .08) : b.c === 1 ? (ls === 1 ? (Math.sin(t * 3 + b.ph) > -.3 ? 1.4 : .3) : .06) : b.c === 2 ? (ls === 2 ? (Math.sin(t * 8) > 0 ? 1.8 : .15) : .05) : (st.hunting ? .6 : .08);   // wall LEDs: green = all normal, amber = caution lamp lit, red = warning lamp lit, cyan = hunt running
    for (const o of life.glow) { const s = Math.sin(t * o.sp * (o.strobe ? 3 : 1) + (o.ph || 0)); o.m.emissiveIntensity = o.strobe ? (s > .85 ? o.hi : o.lo) : o.lo + (o.hi - o.lo) * (.5 + .5 * s); }
    ringM.emissiveColor = B.Color3.FromHexString('#3ddbd0'); ringM.emissiveIntensity = .12 + .1 * Math.sin(t * 1.4);
    for (const c of life.crew) { if (c.y0 === undefined) { c.y0 = c.h.position.y; c.r0 = c.h.rotation.y; } c.h.position.y = c.y0 + .008 * Math.sin(t * 1.7 + c.ph); c.h.rotation.y = c.r0 + .05 * Math.sin(t * .35 + c.ph); } }
  eng.runRenderLoop(() => sc.render()); addEventListener('resize', () => eng.resize());
  place('A1', 0, 2.5); enter('A1'); cam.target = st.tgt.clone(); setCam('shoulder');
  window.SHIP_BJS.api = { radial: { open: radialOpen, close: radClose, tree: callTree, pick: radPick, state: RADIAL, stations: mkSTN }, posture: POSTURE, readiness: READY, bracing: BRC, shipTree, contactTree, toIntercom, stationDown, stationUp, airlock: LK && { L: LK, act: lkAct, dock: h => AIRLOCK.dock(LK, h), undock: () => AIRLOCK.undock(LK), arm: m => AIRLOCK.arm(LK, m), choose: i => AIRLOCK.choose(LK, i), status: () => AIRLOCK.status(LK), toLock: () => { goTo('B2'); } }, zoomTo, unzoom, scrTex, who, walkTo, cam, setCam, fp, st, goTo, enter, place, step, roomG, loadManifest: () => fetch('assets_manifest.json').then(r => r.json()).then(m => { manifest = m; return m; }) };
})();
