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
    g.fillStyle = '#f0f0f0'; for (const [x, y] of RIV) { g.beginPath(); g.arc(x, y, 6, 0, 6.3); g.fill(); } }, 3, 3, 2.2);
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
  floorM.albedoTexture = floorTex; floorM.bumpTexture = floorBump; floorM.roughness = .8; floorM.metallic = .35; wallM.albedoTexture = wallTex2; wallM.bumpTexture = wallBump; wallM.roughness = .75; wallM.metallic = .3;
  
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
  // ---- collision: solid props register a room-local box (y relative to the room floor); the player is a .32 m disc. Used by keyboard walking, click-to-walk (A* path planner) and spawn.
  const SOLID = new Set(['console', 'couch', 'messtable', 'reactor', 'pumptower', 'bunk', 'tubebase', 'galley_range', 'galley_fridge', 'suit_locker', 'captain_bunk', 'captain_desk', 'med_cot', 'head_unit', 'shower_pod', 'washer', 'command_chair', 'dc_locker', 'supply_crate', 'warhead']);
  const SOLIDN = /^(table|hub|lockbench|partition|pump|tank|tube|gallery|tower|net|board|crate|post)$/, PR = .32;
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
    const E = HuntRT; E.P.secPerMin = 16; HS.E = E; HS.S = E.newHunt(7, { entry: 'standard', friendly: true }); HS.A = StationAdapter.create({ engine: E, seed: 7, command: 'tight', preset: 'ambush' }); HS.A.update(HS.S, 0); HS.ANN = Annunciator.create();
    LS.ctx.S = HS.S; LS.ctx.E = E; LS.ctx.A = HS.A; LS.ctx.sel = null; window.CTL_HOST = { E, S: () => HS.S, A: () => HS.A, ANN: () => HS.ANN }; window.CTL_INIT(); HS.ok = true; if (window.SHIPSYS) { HS.Y = SHIPSYS.create(); if (window.PS) Object.assign(PS.ctx, { S: HS.S, E, A: HS.A, Y: HS.Y, ann: HS.ANN.update({ s: HS.S, model: HS.A.model, E }) }); }
  } catch (e) { console.warn('hunt init', e); }
  const scrTex = n => HS.tex[n] || (HS.tex[n] = (() => { const o = LS.make(n), tex = new B.DynamicTexture('scr_' + n, o.c, sc, true, B.Texture.TRILINEAR_SAMPLINGMODE, B.Engine.TEXTUREFORMAT_RGBA, false); o.paint(performance.now()); tex.update(false); const m = new B.StandardMaterial('scrM_' + n, sc); m.disableLighting = true; m.emissiveTexture = tex; m.backFaceCulling = false; return { o, tex, m }; })());
  const polar = (g, a, rad, ry0) => { const n = new B.TransformNode('fx', sc); n.parent = g; n.position.set(Math.cos(a) * rad, 0, Math.sin(a) * rad); n.rotation.y = -a + Math.PI / 2 + (ry0 || 0); return n; };   // local z = radial outward, x = tangent
  const SCRN = [['contacts', 'waterfall'], ['tid', 'tma'], ['engage', 'payload'], ['thermal', 'damage'], ['comms', 'contacts']];   // the five CIC stations, left to right
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
  function airlock(g, r) {   // boarding lock off the dorsal (-z) wall: 2.8 m round chamber lying radially through the annulus, six suit lockers, bench, brass inner gate, outer hatch
    const len = 3.0, zc = -(r + len / 2), tub = B.MeshBuilder.CreateCylinder('lock', { diameter: 2.8, height: len, tessellation: 40, sideOrientation: B.Mesh.DOUBLESIDE }, sc);
    tub.material = lockM; tub.parent = g; tub.position.set(0, 1.0, zc); tub.rotation.x = Math.PI / 2; tub.isPickable = false;
    const dk = box('lockdeck', 1.96, .1, len, floorM, g, 0, -.05, zc); dk.metadata = { floor: 'B2' };
    for (let k = 0; k < 3; k++) for (const sx of [-1, 1]) slot('suit_locker', rt => box('lkfb', .6, 2.0, .6, pbr('#5d7f90'), rt, 0, 1.0, 0), g, sx * .74, 0, -(r + .7 + k * .85), { id: 'suit' + k + (sx < 0 ? 'p' : 's'), ry: sx < 0 ? Math.PI / 2 : -Math.PI / 2, ground: true, size: 2.0 });
    box('lockbench', 1.2, .45, .4, steel, g, 0, .22, -(r + len - .45)).isPickable = false;
    const gate = B.MeshBuilder.CreateTorus('lockgate', { diameter: 2.0, thickness: .12, tessellation: 40 }, sc); gate.material = brass; gate.parent = g; gate.position.set(0, 1.0, -(r - .02)); gate.rotation.x = Math.PI / 2; gate.isPickable = false;
    slot('airlock_door', rt => { const d = B.MeshBuilder.CreateTorus('door', { diameter: 1.3, thickness: .12 }, sc); d.material = brass; d.parent = rt; d.rotation.x = Math.PI / 2; return d; }, g, 0, 1.0, -(r + len - .05), { id: 'lockouter', ry: 0, size: 1.3 });
    for (const i of [17, 18]) g.metadata.segs[i].items.forEach(m => { m.isVisible = false; });   // open the bulkhead where the lock joins
  }
  function prop(kind, g, r, h) {
    if (kind === 'cic') {
      // five stations on the aft arc: a console on the wall, a seat and a crew member in front of it facing the screens
      for (let i = 0; i < 5; i++) { const a = -1.2 + i * .6, s = Math.sin(a), c = -Math.cos(a);
        slot('console', rt => box('consfb', 2, .9, .7, steel, rt, 0, .45, 0), g, s * 4.15, 0, c * 4.15, { id: 'console' + i, ry: -a, ground: true, onload: h => mkScreens(i, h.getChildren()[0]) });
        slot('couch', rt => box('couch', 1.2, .5, .6, pbr('#4a4f7a'), rt, 0, .25, 0), g, s * 3.15, 0, c * 3.15, { id: 'couch' + i, ry: -a + Math.PI, ground: true, size: 1.15 });
        crewSlot(g, 'crew' + i, s * 3.33, c * 3.33, Math.PI - a, 0); }
      box('table', 1.6, .1, 1, steel, g, 0, .8, .45);
      slot('command_chair', rt => box('chairfb', .7, .9, .7, pbr('#4a4f7a'), rt, 0, .45, 0), g, 0, 0, -.9, { id: 'cochair', ry: 0, ground: true, size: 1.2 });
      if (HS.ok) [['helm', 'annun', 'power'], ['stores', 'crew', 'probes']].forEach((row, ri) => row.forEach((n, ci) => mkPassive(g, n, Math.PI / 2 + (ci - 1) * .44, 4.62, ri ? .92 : 2.1, 1.5)));
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
  dust.direction1 = new B.Vector3(-.06, -.015, -.06); dust.direction2 = new B.Vector3(.06, .05, .06); dust.minEmitPower = .3; dust.maxEmitPower = 1; dust.preWarmCycles = 80; dust.preWarmStepOffset = 5; dust.start();

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
  // two player cameras: 'orbit' (drag to orbit the room or ship) and 'shoulder' (orbit camera locked behind the character, offset to one side).
  // 'fp' is internal: the screen-zoom camera.
  function setCam(m, keep) {
    if (!keep) unzoom();
    if (st.mode === 'ship') { st.mode = 'room'; enter(st.room); }
    st.cam = m; const old = sc.activeCamera; if (old) old.detachControl();
    if (m === 'fp') { sc.activeCamera = fp; fp.attachControl(cv, true); who.isVisible = false; plRoot.setEnabled(false); }
    else { sc.activeCamera = cam; cam.attachControl(cv, true); who.isVisible = true; plRoot.setEnabled(true);
      if (m === 'shoulder') { cam.lowerRadiusLimit = 1.4; cam.radius = 4.4; cam.beta = 1.15; cam.targetScreenOffset.set(-.3, -.06); }
      else { cam.lowerRadiusLimit = 3; cam.targetScreenOffset.set(0, 0); enter(st.room); } }
    camBtns.forEach(b => b.classList.toggle('on', b.dataset.cam === st.cam)); hud();
  }
  const camBox = document.createElement('div'); camBox.id = 'cams'; camBox.style.cssText = 'position:fixed;left:max(16px,env(safe-area-inset-left,0px));top:calc(170px + env(safe-area-inset-top,0px));display:flex;flex-direction:column;gap:3px';
  const camBtns = [['orbit', '1  Orbit view'], ['shoulder', '2  Over the shoulder']].map(([k, t]) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = t; b.dataset.cam = k; b.onclick = () => setCam(k); camBox.appendChild(b); return b; }); document.body.appendChild(camBox);
  const ladBox = document.createElement('div'); ladBox.style.cssText = 'position:fixed;left:max(16px,env(safe-area-inset-left,0px));top:calc(242px + env(safe-area-inset-top,0px));display:none;flex-direction:column;gap:3px'; [['▲  Climb up (R)', 1], ['▼  Climb down (F)', -1]].forEach(([t, d]) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = t; b.onclick = () => climbStep(d); ladBox.appendChild(b); }); document.body.appendChild(ladBox);
  cv.addEventListener('wheel', e => { if (st.cam === 'fp') { fp.fov = Math.max(.5, Math.min(1.7, fp.fov * (1 + Math.sign(e.deltaY) * .06))); e.preventDefault(); } }, { passive: false });
  function hud() { ladBox.style.display = st.room === 'T' && st.mode === 'room' ? 'flex' : 'none'; const r = roomG[st.room].metadata.room, n = Object.values(slots).filter(s => s.glb).length; hudEl.innerHTML = '<b>INTERDICT 3D ship spine (Babylon.js)</b><br>' + ({ orbit: 'Orbit view', shoulder: 'Over the shoulder', fp: 'Screen' })[st.cam] + '<br>' + r.id + ': ' + r.name + '<br>floor ' + (r.r * 2).toFixed(1) + ' m across, ' + r.h + ' m clear<br>' + (st.mode === 'ship' ? 'Ship view (140 m)' : 'Room view') + (st.zoom ? '<br><b>SCREEN ' + st.zoom.mesh.metadata.screen.toUpperCase() + '</b>: click its soft keys · Esc steps back' : '') + '<br><span style="opacity:.7">1 orbit · 2 over the shoulder · 3 ship view · V vent fins · WASD walk · Shift run · Q/E deck down/up · R/F ladder (tube hall)</span><br>GLB slots filled: ' + n + ' / ' + Object.keys(slots).length; decks.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.id === st.room)); }
  R.forEach(r => { const b = document.createElement('button'); b.textContent = r.id + '  ' + r.name; b.dataset.id = r.id; b.onclick = () => goTo(r.id); decks.appendChild(b); });
  function place(id, x, z) { const r = roomG[id].metadata.room; st.room = id; st.lvl = 0; const q = pushOut(r, x, z, 0); who.position.set(q[0], r.y + .95, q[1]); }
  function enter(id) { st.mode = 'room'; st.room = id; const r = roomG[id].metadata.room; dust.emitter = roomG[id].getAbsolutePosition().clone(); dust.maxEmitBox.setAll(r.r * .85); dust.minEmitBox.set(-r.r * .85, .2, -r.r * .85); dust.maxEmitBox.y = Math.min(r.h, 6) - .3; st.tgt.set(0, r.y + (r.kind === 'tubes' ? 12 : 1.2), 0); cam.radius = r.kind === 'tubes' ? 30 : 11; cam.beta = r.kind === 'tubes' ? 1.3 : .8; hud(); }
  const feetOf = rr => who.position.y - .95 - roomG[rr.id].position.y;
  function pushOut(rr, nx, nz, feet) { if (!rr.obs) return [nx, nz]; for (let it = 0; it < 3; it++) { let hit = false; for (const o of rr.obs) { if (o.y1 < feet + .15 || o.y0 > feet + 1.7) continue; const x0 = o.x0 - PR, x1 = o.x1 + PR, z0 = o.z0 - PR, z1 = o.z1 + PR; if (nx > x0 && nx < x1 && nz > z0 && nz < z1) { const dl = nx - x0, dr = x1 - nx, dt = nz - z0, db = z1 - nz, m = Math.min(dl, dr, dt, db); if (m === dl) nx = x0; else if (m === dr) nx = x1; else if (m === dt) nz = z0; else nz = z1; hit = true; } } if (!hit) break; } return [nx, nz]; }
  const solidAt = (rr, x, z, feet) => { if (rr.obs) for (const o of rr.obs) { if (o.y1 < feet + .15 || o.y0 > feet + 1.7) continue; if (x > o.x0 - PR && x < o.x1 + PR && z > o.z0 - PR && z < o.z1 + PR) return true; } return false; };
  const walkable = (rr, x, z, feet) => ((Math.hypot(x, z) <= rr.r - .6) || (rr.kind === 'junction' && Math.abs(x) <= .4 && z < 0 && z >= -(rr.r + 2.3))) && !solidAt(rr, x, z, feet);
  const clampIn = (rr, nx, nz) => { [nx, nz] = pushOut(rr, nx, nz, feetOf(rr)); const m = Math.hypot(nx, nz), lim = rr.r - .6;
    if (rr.kind === 'junction' && m > lim && Math.abs(nx) < .8 && nz < 0) return [Math.max(-.4, Math.min(.4, nx)), Math.max(nz, -(rr.r + 3.0 - .7))];   // the boarding lock off the dorsal wall
    return m > lim ? [nx * lim / m, nz * lim / m] : [nx, nz]; };
  // A* path planner on a .25 m grid, then string-pulled: click-to-walk routes around props instead of through them
  function plan(rr, sx, sz, tx, tz, feet) {
    const cs = .25, X0 = -(rr.r + .3), Z0 = -(rr.r + 3.4), NX = Math.ceil((2 * rr.r + .6) / cs) + 1, NZ = Math.ceil((2 * rr.r + 3.8) / cs) + 1, idx = (i, j) => j * NX + i;
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
  function zoomTo(mesh) {
    const prev = st.zoom ? st.zoom.prev : st.cam; setCam('fp', true); mesh.computeWorldMatrix(true); const c = mesh.getAbsolutePosition().clone(), n = B.Vector3.TransformNormal(new B.Vector3(0, 0, 1), mesh.getWorldMatrix()).normalize();
    if (B.Vector3.Dot(n, roomG[st.room].getAbsolutePosition().subtract(c)) < 0) n.scaleInPlace(-1);
    const hW = B.Vector3.TransformNormal(new B.Vector3(0, mesh.metadata.sh || .5, 0), mesh.getWorldMatrix()).length(), dist = Math.max(.45, hW / 2 / Math.tan(.425) * 1.04);   // fov .85 rad: distance at which the screen height fills the view
    st.zoom = { mesh, prev, pos: c.add(n.scale(dist)), tgt: c, zt: fp.getFrontPosition(1) }; st.zoomHid = ['crew', 'couch'].map(k => slots[k + mesh.metadata.station]).filter(Boolean).flatMap(s => [s.root, s.holder]).filter(Boolean); st.zoomHid.forEach(n => n.setEnabled(false));
    hud();
  }
  function zoomStep() { const z = st.zoom; fp.position = B.Vector3.Lerp(fp.position, z.pos, .12); z.zt = B.Vector3.Lerp(z.zt, z.tgt, .15); fp.setTarget(z.zt); fp.fov += (.85 - fp.fov) * .12; }
  const scrHit = () => { const p = sc.pick(sc.pointerX, sc.pointerY, m => !!(m.metadata && m.metadata.screen)); if (!p || !p.hit || !p.pickedMesh || !p.pickedMesh.metadata || !p.pickedMesh.metadata.screen) return null; const uv = p.getTextureCoordinates(); if (!uv) return null; const x = uv.x * LS.W, y = uv.y * LS.H; return { n: p.pickedMesh.metadata.screen, mesh: p.pickedMesh, x, y, reg: p.pickedMesh.metadata.passive ? null : LS.hit(p.pickedMesh.metadata.screen, x, y) }; };
  sc.onPointerObservable.add(pi => { if (!HS.ok) return;
    if (pi.type === B.PointerEventTypes.POINTERMOVE) { if (!st.zoom) return; const h = scrHit(pi); LS.ctx.hover = h && h.mesh === st.zoom.mesh && h.reg ? { scr: h.n, id: h.reg.id } : { scr: null, id: null }; cv.style.cursor = LS.ctx.hover.id ? 'pointer' : ''; return; }
    if (pi.type !== B.PointerEventTypes.POINTERTAP) return; const h = scrHit(pi); if (!h) return; if (!st.zoom || st.zoom.mesh !== h.mesh) zoomTo(h.mesh); else if (h.reg) CTL.activate(h.reg.id); });
  const almEl = document.createElement('div'); almEl.style.cssText = 'display:none;position:fixed;left:50%;top:calc(10px + env(safe-area-inset-top,0px));transform:translateX(-50%);max-width:70vw;padding:6px 12px;background:rgba(12,22,24,.88);border:1px solid #f0ab3a;border-radius:4px;color:#d7e3ea;font:12px system-ui,sans-serif;z-index:5;pointer-events:none'; document.body.appendChild(almEl);
  function hunt(dt) {
    if (!HS.ok) return; const S = HS.S, E = HS.E; if (!S.over && !S.hold) E.tick(S, dt / E.P.secPerMin); HS.A.update(S, S.over || S.hold ? 0 : dt); LS.ctx.annOut = HS.ANN.update({ s: S, model: HS.A.model, E }); if (HS.Y && window.SHIPSYS) { SHIPSYS.update(HS.Y, S, S.over || S.hold ? 0 : dt / E.P.secPerMin); if (window.PS) Object.assign(PS.ctx, { S, E, A: HS.A, Y: HS.Y, ann: LS.ctx.annOut }); }
    FINS.to = S.vent && S.vent.on ? 1 : 0; st.hunting = !S.over; { const bad = [], ao = LS.ctx.annOut || { lamps: {} }; for (const id in ao.lamps) { const l = ao.lamps[id]; if (l.state === 'warning' || l.state === 'caution') bad.push([l.state, id.toUpperCase().replace(/_/g, ' ')]); }
      if (HS.Y && window.SHIPSYS) SHIPSYS.lamps(HS.Y, S).forEach(l => { if (l.state === 'warning' || l.state === 'caution') bad.push([l.state, l.label]); });
      const w = bad.some(b => b[0] === 'warning'), key = bad.map(b => b[1]).join('|') + w; st.alarm = w ? 2 : bad.length ? 1 : 0;
      if (almEl._k !== key) { almEl._k = key; almEl.style.display = bad.length ? 'block' : 'none'; almEl.style.borderColor = w ? '#ff4a3d' : '#f0ab3a'; almEl.innerHTML = '<b style="color:' + (w ? '#ff7a6d' : '#f0ab3a') + '">' + (w ? 'WARNING' : 'CAUTION') + '</b> ' + bad.slice(0, 6).map(b => b[1]).join(' · ') + (bad.length > 6 ? ' +' + (bad.length - 6) : '') + ' <span style="opacity:.6">(see annunciator in the CIC)</span>'; } }
    if (!LS.ctx.sel && S.an.length) LS.ctx.sel = (S.an.find(a => a.state !== 'out') || S.an[0]).id;
    if (st.room !== 'A1' || st.mode !== 'room') return; const now = performance.now();
    for (const n in HS.tex) { const per = st.zoom && st.zoom.mesh.metadata.screen === n ? 110 : HS.tex[n].passive ? 700 : 450; if (now - (HS.last[n] || 0) < per) continue; HS.last[n] = now; HS.tex[n].o.paint(now); HS.tex[n].tex.update(false); } }
  const keys = {};
  addEventListener('keydown', e => { keys[e.code] = 1; if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return; const k = e.code; if (k === 'Escape') unzoom();
    if (k === 'Digit1') setCam('orbit'); else if (k === 'Digit2') setCam('shoulder'); else if (k === 'KeyV') { if (HS.ok && typeof CTL !== "undefined") { CTL.activate('vent'); return; } FINS.to = FINS.to ? 0 : 1; if (window.UI) UI.toast(FINS.to ? 'VENT: radiator blades running out' : 'Blades retracting (silent running)', FINS.to ? 'w' : 'g'); }
    else if (k === 'KeyR' || k === 'PageUp') climbStep(1); else if (k === 'KeyF' || k === 'PageDown') climbStep(-1);
    else if (k === 'Digit3') document.getElementById('shipbtn').click();
    else if (k === 'KeyQ' || k === 'KeyE') { const i = R.findIndex(r => r.id === st.room), j = Math.max(0, Math.min(R.length - 1, i + (k === 'KeyQ' ? 1 : -1))); if (j !== i) goTo(R[j].id); } });
  addEventListener('keyup', e => { delete keys[e.code]; }); addEventListener('blur', () => { for (const k in keys) delete keys[k]; });
  // keyboard walking: relative to wherever the active camera looks (fp, room centre or orbit), clamped inside the room
  function drive(dt) {
    const dx = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0), dz = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0); if ((!dx && !dz) || st.mode === 'ship') return; unzoom();
    const d = sc.activeCamera.getForwardRay().direction, f = new B.Vector3(d.x, 0, d.z); if (f.length() < 1e-3) return; f.normalize(); const v = f.scale(dz).add(new B.Vector3(-f.z, 0, f.x).scale(dx)); v.normalize();
    const t0 = tween[0]; if (t0 && (t0.k === 'climb' || t0.k === 'lad')) return; tween.length = 0; const g = roomG[st.room], rr = g.metadata.room, s = (keys.ShiftLeft || keys.ShiftRight ? 5.5 : 3.2) * dt;
    if (st.lvl && st.room === 'T') { const bs = g.getAbsolutePosition(), lx = Math.max(-.9, Math.min(.9, who.position.x + v.x * s - bs.x)), lz = Math.max(-1.0, Math.min(3.3, who.position.z + v.z * s - bs.z)); faceMove(bs.x + lx - who.position.x, bs.z + lz - who.position.z); who.position.x = bs.x + lx; who.position.z = bs.z + lz; return; }   // standing on a catwalk landing
    const [nx, nz] = clampIn(rr, who.position.x + v.x * s - g.position.x, who.position.z + v.z * s - g.position.z); faceMove(g.position.x + nx - who.position.x, g.position.z + nz - who.position.z); who.position.x = g.position.x + nx; who.position.z = g.position.z + nz; }
  function step(dt) {
    drive(dt); hunt(dt);
    const t = tween[0]; if (!t) return; const g = roomG[st.room], rr = g.metadata.room;
    if (t.k === 'walk') { const base = g.getAbsolutePosition(); if (!t.path) t.path = plan(rr, who.position.x - base.x, who.position.z - base.z, t.x, t.z, feetOf(rr)); const wp = t.path[0]; if (!wp) { tween.shift(); t.done && t.done(); return; }
      const tx = base.x + wp.x, tz = base.z + wp.z, dx = tx - who.position.x, dz = tz - who.position.z, d = Math.hypot(dx, dz), s = 3.2 * dt;
      if (d <= s) { who.position.x = tx; who.position.z = tz; t.path.shift(); if (!t.path.length) { tween.shift(); t.done && t.done(); } } else { faceMove(dx, dz); who.position.x += dx / d * s; who.position.z += dz / d * s; } }
    else if (t.k === 'lad') { const base = g.getAbsolutePosition(), ty = g.position.y + LAD.lv[t.lv] + .95, dy = ty - who.position.y, s = 2.6 * dt; who.position.x = base.x; who.position.z = base.z + t.lz; if (Math.abs(dy) <= s) { who.position.y = ty; tween.shift(); t.done && t.done(); } else who.position.y += Math.sign(dy) * s; }
    else if (t.k === 'climb') { const to = roomG[t.id].metadata.room, ty = to.y + .95, dy = ty - who.position.y, near = Math.min(...R.map(q => Math.abs(q.y - (who.position.y - .95)))), s = 6 * dt * (.35 + .65 * Math.min(1, near / 1.5)); who.position.x = -CELL_R; if (Math.abs(dy) <= s) { who.position.y = ty; tween.shift(); t.done && t.done(); } else { who.position.y += Math.sign(dy) * s; st.tgt.y += (who.position.y - st.tgt.y) * .1; } }
  }
  sc.onBeforeRenderObservable.add(() => { step(Math.min(.05, eng.getDeltaTime() / 1000)); if (!(st.cam === 'shoulder' && st.mode === 'room')) cam.target = B.Vector3.Lerp(cam.target, st.tgt, .12);   // setTarget re-derives alpha/beta/radius from the old position, so the shoulder cam (which copies its target in place below) must not go through it
    fadeWalls();
    if (st.cam === 'fp') { if (st.zoom) zoomStep(); else fp.position.set(who.position.x, who.position.y + .65, who.position.z); }
    if (st.cam === 'shoulder' && st.mode === 'room') { st.tgt.set(who.position.x, who.position.y + .35, who.position.z); cam.target.copyFrom(st.tgt); }
    hull.isVisible = nose.isVisible = st.mode === 'ship'; extG.setEnabled(st.mode === 'ship'); planet.setEnabled(st.mode === 'ship'); sun.setEnabled(st.mode === 'ship'); if (st.mode === 'ship') cam.alpha += .0006; animate(performance.now() / 1000); });
  // walls fade out where they sit between the camera and the character (current room only)
  function fadeWalls() {
    const cp = sc.activeCamera.position, W = who.position;
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
  window.SHIP_BJS.api = { zoomTo, unzoom, scrTex, who, walkTo, cam, setCam, fp, st, goTo, enter, place, step, roomG, loadManifest: () => fetch('assets_manifest.json').then(r => r.json()).then(m => { manifest = m; return m; }) };
})();
