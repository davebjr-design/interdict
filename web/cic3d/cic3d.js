/* 3D CIC core: scene, props, live wiring, tiers (ROOM / SECTION / SCREEN), camera polish, brace. Requires THREE, props*.js, live_screens.js, HuntRT,
 * Stations, StationAdapter, Annunciator. Exposes window.CIC (for ui.js / interact.js / audio.js / tutorial3d.js) and window.CIC3D (tests, console).
 * CIC.on('frame'|'events'|'view'|'begin', fn) registers hooks. Interaction, DOM overlays and audio live in the other modules. */
'use strict';
(function () {
  const Q = new URLSearchParams(location.search), E = HuntRT, SEED = +(Q.get('seed') || 7) | 0, SHOT = Q.get('shot') || '';
  const RW = innerWidth, RH = innerHeight;
  const R = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); const FIXSCALE = Q.get('scale') ? Math.max(.25, Math.min(2, +Q.get('scale'))) : 0; let rscale = FIXSCALE || 1; R.setSize(RW, RH); R.setPixelRatio(Math.min(devicePixelRatio || 1, 2) * rscale); document.body.appendChild(R.domElement); OUT.uniforms.asp.value = RW / RH;
  const S3 = new THREE.Scene(), cam = new THREE.PerspectiveCamera(42, RW / RH, .1, 60); R.setClearColor(0x0c1618);
  const toon = (c, o) => new THREE.MeshToonMaterial(Object.assign({ color: c, gradientMap: grad }, o || {}));
  const V = (x, y, z) => new THREE.Vector3(x, y, z), ph = Math.PI / 180;
  const hooks = { frame: [], events: [], view: [], begin: [], shake: [] }, fire = (k, a, b) => { for (const f of hooks[k]) { try { f(a, b); } catch (e) { console.error('hook ' + k, e); } } };

  // ---------- asset slot registry: procedural fallback now, Meshy GLB later (assets/props/glb/manifest.json) ----------
  const Slots = { manifest: {}, loader: typeof THREE.GLTFLoader === 'function' ? new THREE.GLTFLoader() : null, used: {},
    make(key, fallback) { const g = new THREE.Group(); g.name = 'slot:' + key; g.userData.slot = key; const f = fallback(); g.add(f); (this.used[key] = this.used[key] || []).push(g); if (this.manifest[key]) this.swap(g, key, f); return g; },
    swap(g, key, f) { if (!this.loader) return; const m = this.manifest[key], box = new THREE.Box3().setFromObject(f), sz = box.getSize(new THREE.Vector3());
      this.loader.load('../assets/props/glb/' + (m.file || key + '.glb'), gl => { const o = gl.scene, b = new THREE.Box3().setFromObject(o), s = b.getSize(new THREE.Vector3()); const k = (m.scale || 1) * (sz.y > 0 && s.y > 0 ? sz.y / s.y : 1); o.scale.setScalar(k); const c = new THREE.Box3().setFromObject(o);
        o.position.y += box.min.y - c.min.y + (m.y || 0); o.position.x += (box.min.x + sz.x / 2) - (c.min.x + (c.max.x - c.min.x) / 2); o.position.z += (box.min.z + sz.z / 2) - (c.min.z + (c.max.z - c.min.z) / 2); if (m.rot) o.rotation.y = m.rot;
        [...f.children].forEach(ch => { if (ch.userData && ch.userData.part && !ch.userData.moves) g.add(ch); });   // keep the invisible hit boxes of static parts (hotspots survive the swap)
        g.remove(f); g.add(o); g.userData.glb = true; }, undefined, () => { }); },
    load() { return fetch('../assets/props/glb/manifest.json').then(r => r.ok ? r.json() : {}).then(m => { this.manifest = m || {}; }).catch(() => { }); } };
  window.Slots = Slots;

  // ---------- live hunt + crew ----------
  const P = E.P; P.secPerMin = 16; let S = null, A = null, ANN = null, annOut = null, tscale = 1;
  const MAXB = 16;
  function begin(seed, opts) { S = E.newHunt(seed == null ? SEED : seed, Object.assign({ entry: Q.get('entry') || 'standard', friendly: true }, opts || {})); A = StationAdapter.create({ engine: E, seed: seed == null ? SEED : seed, command: 'tight', preset: 'ambush' }); A.update(S, 0); ANN = Annunciator.create(); LS.ctx.S = S; LS.ctx.E = E; LS.ctx.A = A; LS.ctx.sel = null; LS.ctx.hist = null; fire('begin', S); }
  begin();

  // ---------- room ----------
  { const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d'); x.fillStyle = '#2b3b3f'; x.fillRect(0, 0, 512, 512); x.strokeStyle = '#18262a'; x.lineWidth = 3; for (let r = 0; r < 9; r++) for (let q = 0; q < 7; q++) { const ox = (r % 2) * 36; x.strokeRect(q * 72 + ox, r * 58, 72, 58); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2.6, 2.6); const f = new THREE.Mesh(new THREE.CylinderGeometry(5.9, 5.9, .2, 64), toon(0xffffff, { map: t })); f.position.y = -.1; S3.add(f);
    for (const r of [1.7, 3.0, 4.9]) { const rg = new THREE.Mesh(new THREE.TorusGeometry(r, .02, 6, 96), new THREE.MeshBasicMaterial({ color: 0xb8cfcc })); rg.rotation.x = Math.PI / 2; rg.position.y = .005; S3.add(rg); }
    const wl = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 3.6, 64, 1, true, Math.PI * .62, Math.PI * .76), toon(0x23353a, { side: THREE.DoubleSide })); wl.position.y = 1.8; S3.add(wl);
    for (let i = 0; i < 13; i++) { const a = Math.PI * .62 + i * (Math.PI * .76) / 12; const rb = M(RB(.22, 3.6, .16, .05), K.steel, S3, 6 * Math.sin(a), 1.8, 6 * Math.cos(a)); rb.rotation.y = a; }
    for (const y of [.55, 3.4]) { const pts = []; for (let i = 0; i <= 30; i++) { const a = Math.PI * .62 + i * (Math.PI * .76) / 30; pts.push(V(5.9 * Math.sin(a), y, 5.9 * Math.cos(a))); } M(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, .05, 8), K.brass, S3); }
    const r1 = Slots.make('rack', () => rack(true)); r1.position.set(-1.7, 0, -5.4); S3.add(r1); const r2 = Slots.make('rack', () => rack(false)); r2.position.set(1.7, 0, -5.4); S3.add(r2); const b = Slots.make('breaker', () => breaker()); b.position.set(3.7, 1.5, -4.6); b.rotation.y = -.6; S3.add(b); }

  // ---------- annunciator hardware: painted from the live lamp states; tile rects kept for hover and click ----------
  const annC = document.createElement('canvas'); annC.width = 1536; annC.height = 220; const annG = annC.getContext('2d'), annT = new THREE.CanvasTexture(annC);
  const LAMP = { warning: ['#ff3a2a', '#fff'], caution: ['#f0a830', '#210'], advisory: ['#7fe0e8', '#012'], normal: ['#18452d', '#6fa'], off: ['#0b1514', '#244'] };
  const annTiles = Annunciator.TILES.map((tl, i) => ({ id: tl.id, x: 12 + (i % 10) * 152, y: 10 + Math.floor(i / 10) * 68, w: 144, h: 62, tile: tl }));
  function paintAnn(t) { const g = annG; g.fillStyle = '#060d0c'; g.fillRect(0, 0, 1536, 220); g.textAlign = 'center'; g.textBaseline = 'middle';
    for (const q of annTiles) { const L = annOut && annOut.lamps[q.id], st = L ? L.state : 'off', flash = L && L.flash && !L.acked && ((t * 3) | 0) % 2 === 0, c = LAMP[st] || LAMP.off; g.fillStyle = flash ? '#000' : c[0]; g.fillRect(q.x, q.y, q.w, q.h); g.fillStyle = flash ? c[0] : c[1]; g.font = 'bold 22px monospace'; g.fillText(q.tile.label, q.x + q.w / 2, q.y + q.h / 2); }
    g.textAlign = 'left'; annT.needsUpdate = true; }
  const annObj = Slots.make('annunciator', () => annHW(annT)); annObj.position.set(0, 3.0, -5.0); annObj.rotation.x = -.6; S3.add(annObj); const annFB = annObj.children[0];

  // ---------- couches: a FREE and a BRACE variant per seat, swapped by the brace state ----------
  const couches = [];
  function seatPair(parent, opt, rotY) { const free = Slots.make('couch_' + (opt.co ? 'co' : 'crew'), () => couch(Object.assign({ recline: opt.co ? .15 : .2, gimbal: 0, leg: .45, harness: 'open' }, opt))), br = couch(Object.assign({ recline: 1.05, gimbal: .5, leg: 1.15, harness: 'on' }, opt)); [free, br].forEach(c => { c.rotation.y = rotY; parent.add(c); }); br.visible = false; couches.push({ free, br }); return { free, br }; }
  const BENCH = {}, HW = {}, SCRMESH = {};
  function station(name, phi, def, occ, deskFn) { const dir = V(Math.sin(phi), 0, -Math.cos(phi)); const g = new THREE.Group(); g.position.copy(dir.clone().multiplyScalar(3.1)); g.rotation.y = Math.atan2(-dir.x, -dir.z); S3.add(g); const slot = Slots.make('bench_' + name, () => bench(def)); g.add(slot); g.userData.crts = slot.children[0].userData.crts; deskFn && deskFn(g); BENCH[name] = g; if (occ !== null) seatPair(g, { occ }, Math.PI); return g; }
  const SCR = {}; ['contacts', 'waterfall', 'tid', 'tma', 'engage', 'payload', 'thermal', 'damage', 'comms'].forEach(n => SCR[n] = LS.make(n));
  const SECT = { sensors: ['contacts', 'waterfall', 'tid'], attack: ['tma', 'engage', 'payload'], systems: ['thermal', 'damage', 'comms'] };
  const onA = (g, name, key, f, r, p, y) => { const o = onArc(g, Slots.make(key, f), r, p, y); o.userData.hw = name; HW[name] = o; return o; };
  station('sensors', -58 * ph, { span: 1.75, screens: [SCR.contacts.t, SCR.waterfall.t, SCR.tid.t], gap: .95 }, 0x4a4f7a, g => {
    onA(g, 'sensors.pad', 'keypad', keypad, 1.25, .5, .95); onA(g, 'sensors.ball', 'trackball', trackball, 1.25, -.45, .95);
    onA(g, 'sensors.auto', 'rotary', () => rotary('SENSORS'), 1.15, -.9, .95); onA(g, 'sensors.rot1', 'rotary', () => rotary('GAIN'), 1.15, -.73, .95); onA(g, 'sensors.rot2', 'rotary', () => rotary('FILTER'), 1.15, -.56, .95);
    onA(g, 'sensors.tg', 'toggles', () => toggles(6, [1, 2], ['CLS', 'RUL', 'PNG', 'QUT', 'RSC', 'TRK']), 1.4, .9, .96);
    onA(g, 'sensors.g0', 'gauge', () => gauge('SINK', .45, .7), 1.72, -1.05, 1.3); onA(g, 'sensors.g1', 'gauge', () => gauge('SENS', .6, .8), 1.72, 1.05, 1.3); });
  station('attack', 58 * ph, { span: 1.45, tall: true, screens: [SCR.tma.t, SCR.engage.t, SCR.payload.t], gap: .95 }, 0x2f6a5e, g => {
    onA(g, 'attack.fire', 'fire_box', fireBox, 1.22, 0, .96); onA(g, 'attack.stick', 'joystick', joystick, 1.2, -.5, .96); onA(g, 'attack.pad', 'keypad', keypad, 1.25, .5, .95);
    onA(g, 'attack.preset', 'rotary', () => rotary('SALVO'), 1.1, -.95, .95); onA(g, 'attack.auto', 'rotary', () => rotary('CREW'), 1.1, -.78, .95); onA(g, 'attack.rot2', 'rotary', () => rotary('CONE'), 1.1, -.61, .95);
    onA(g, 'attack.tg', 'toggles', () => toggles(5, [1], ['PRB', 'PD', 'LCK', 'RFR', 'MRK']), 1.5, .68, .96);
    onA(g, 'attack.g0', 'gauge', () => gauge('HULL', .7, .8), 1.72, -.65, 1.42); onA(g, 'attack.g1', 'gauge', () => gauge('MAG', .9, .95), 1.72, .65, 1.42); });
  station('systems', 0, { span: 1.75, screens: [SCR.thermal.t, SCR.damage.t, SCR.comms.t], gap: .95 }, null, g => {
    onA(g, 'systems.tg', 'toggles', () => toggles(6, [0, 3], ['VNT', 'CUT', 'STL', 'RED', 'EVD', 'BRC']), 1.3, -.62, .96);
    onA(g, 'systems.speed', 'rotary', () => rotary('SPEED'), 1.12, -.08, .95); onA(g, 'systems.auto', 'rotary', () => rotary('CREW'), 1.12, .1, .95); onA(g, 'systems.time', 'rotary', () => rotary('TIME'), 1.12, .28, .95);
    onA(g, 'systems.pad', 'keypad', keypad, 1.25, .62, .95); onA(g, 'systems.g0', 'gauge', () => gauge('SINK', .8, .7), 1.72, -1.0, 1.3); onA(g, 'systems.g1', 'gauge', () => gauge('VENT', .3, .8), 1.72, 1.0, 1.3); });
  // station name plates floating over each bench (who is driving, drawn from the model)
  const PLATE = {}; const plateDef = { sensors: ['SENSORS', 'QUILL'], attack: ['FIRE CTL / WEAPONS', 'ABARA'], systems: ['ENG / THERMAL / DMG', 'CASTELLAN · DACE · FENWICK'] };
  for (const n in plateDef) { BENCH[n].updateMatrixWorld(true); const c = document.createElement('canvas'); c.width = 512; c.height = 128; const t = new THREE.CanvasTexture(c); t.anisotropy = 4; const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false })); sp.scale.set(1.6, .4, 1); sp.renderOrder = 10; sp.position.copy(BENCH[n].localToWorld(V(0, 2.25, -1.6))); S3.add(sp); PLATE[n] = { c, g: c.getContext('2d'), t, sp, key: '' }; }
  function paintPlate(n, mode) { const p = PLATE[n], g = p.g, d = plateDef[n]; const col = mode === 'hands-on' ? '#f5cf3a' : mode === 'supervised' ? '#f0ab3a' : '#3fd38a', lab = mode === 'hands-on' ? 'HANDS-ON' : mode === 'supervised' ? 'SUPERVISED' : 'AUTO'; g.clearRect(0, 0, 512, 128); g.fillStyle = 'rgba(4,16,13,.82)'; g.fillRect(0, 0, 512, 128); g.strokeStyle = col; g.lineWidth = 4; g.strokeRect(2, 2, 508, 124);
    g.fillStyle = '#c4dcd2'; g.font = 'bold 34px monospace'; g.textBaseline = 'middle'; g.fillText(d[0], 18, 38); g.fillStyle = '#6a9a8d'; g.font = '24px monospace'; g.fillText(d[1], 18, 76); g.fillStyle = col; g.fillRect(18, 92, 476, 26); g.fillStyle = '#04100d'; g.font = 'bold 22px monospace'; g.textAlign = 'center'; g.fillText(mode === 'hands-on' ? 'YOU ARE DRIVING' : 'CREW: ' + lab, 256, 106); g.textAlign = 'left'; p.t.needsUpdate = true; }
  // map table + hologram of live contacts
  const holo = new THREE.Group(), blips = [], holoHits = [];
  { const t = new THREE.Group(); S3.add(t); M(CYL(.58, .82, .82, 40), K.steel, t, 0, .41, 0); M(CYL(1.05, 1.05, .1, 48), K.steel, t, 0, .86, 0); M(CYL(.92, .92, .03, 48), 0x0d1c1e, t, 0, .92, 0);
    const rm = new THREE.Mesh(new THREE.TorusGeometry(1.1, .045, 10, 64), toon(K.brass)); rm.rotation.x = Math.PI / 2; rm.position.y = .93; t.add(rm); rm.add(new THREE.Mesh(rm.geometry, OUT));
    holo.position.y = 1.5; t.add(holo); const bm = (c, o, w) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, wireframe: !!w }); holo.add(new THREE.Mesh(new THREE.SphereGeometry(.5, 22, 14), bm(0x4fe0d0, .3, true))); holo.add(new THREE.Mesh(new THREE.SphereGeometry(.5, 22, 14), bm(0x0c5a52, .12)));
    const me = new THREE.Mesh(new THREE.OctahedronGeometry(.035), bm(0xe8a33a, 1)); holo.add(me);
    for (let i = 0; i < MAXB; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(.026, 10, 8), new THREE.MeshBasicMaterial({ color: 0x4a78f0 })); const h = new THREE.Mesh(new THREE.SphereGeometry(.07, 8, 6), HITM); h.userData.contact = i; m.add(h); m.visible = false; holo.add(m); blips.push(m); holoHits.push(h); }
    var selRing = new THREE.Mesh(new THREE.TorusGeometry(.05, .006, 6, 24), new THREE.MeshBasicMaterial({ color: 0xffffff })); selRing.visible = false; holo.add(selRing);
    const L = new THREE.PointLight(0x4fe0d0, .9, 5); L.position.set(0, 1.6, 0); S3.add(L); }
  const coSeat = seatPair(S3, { co: true, occ: 0x6a4a2a }, Math.PI); [coSeat.free, coSeat.br].forEach(c => c.position.set(0, 0, 2.4));
  S3.add(new THREE.AmbientLight(0xb8d8d4, .5)); const dl = new THREE.DirectionalLight(0xfff0d0, .4); dl.position.set(3, 7, 5); S3.add(dl); const pl = new THREE.PointLight(0xffd9a0, 1.0, 12); pl.position.set(0, 3.2, 0); S3.add(pl); const alarm = new THREE.PointLight(0xff3a20, 0, 9); alarm.position.set(-3, 2.5, -2); S3.add(alarm);
  // invisible navigation zones: click a bench in the room to cut to its section
  const NAV = {}; for (const n of ['sensors', 'attack', 'systems']) { const m = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.2, 1.5), HITM); m.position.set(0, 1.1, -1.4); m.userData.nav = n; BENCH[n].add(m); NAV[n] = m; }
  S3.updateMatrixWorld(true);
  // the CRT glass planes (raycast targets): SCRMESH[name] = mesh
  for (const sec in SECT) SECT[sec].forEach((nm, i) => { const sc = BENCH[sec === 'attack' ? 'attack' : sec].userData.crts[i].userData.screen; sc.userData.scr = nm; sc.userData.sec = sec; sc.userData.idx = i; SCRMESH[nm] = sc; });

  // ---------- tiers ----------
  const w = (n, v) => BENCH[n].localToWorld(V(...v));
  const VIEWS = { room: { p: V(.6, 4.4, 9.6), a: V(0, 1.0, -1.2), f: 42, t: 'ROOM' },
    sensors: { p: w('sensors', [1.05, 1.75, .7]), a: w('sensors', [-.3, 1.2, -1.6]), f: 56, t: 'SECTION · SENSORS' }, attack: { p: w('attack', [-1.05, 1.75, .7]), a: w('attack', [.3, 1.2, -1.6]), f: 56, t: 'SECTION · ATTACK' }, systems: { p: w('systems', [0, 1.9, 1.0]), a: w('systems', [0, 1.2, -1.6]), f: 58, t: 'SECTION · SYSTEMS' } };
  const upY = V(0, 1, 0); VIEWS.room.up = VIEWS.sensors.up = VIEWS.attack.up = VIEWS.systems.up = upY;
  const SCRN = { sensors: ['CONTACTS', 'FUSION', 'TARGET ID'], attack: ['TRACK / TMA', 'ENGAGE', 'PAYLOAD'], systems: ['THERMAL', 'DAMAGE', 'COMMAND NET'] };
  const _c = V(0, 0, 0), _n = V(0, 0, 1), _u = V(0, 1, 0), _q = new THREE.Quaternion();
  function viewScreen(sec, i) { const m = SCRMESH[SECT[sec][i]]; m.updateWorldMatrix(true, false); m.getWorldPosition(_c); m.getWorldQuaternion(_q); _n.set(0, 0, 1).applyQuaternion(_q); _u.set(0, 1, 0).applyQuaternion(_q);
    const visH = .47 / .74, fov = 32, dist = visH / 2 / Math.tan(fov * ph / 2), off = -.02 * visH; return { p: _c.clone().addScaledVector(_n, dist).addScaledVector(_u, off), a: _c.clone().addScaledVector(_u, off), up: _u.clone(), f: fov, t: 'SCREEN · ' + sec.toUpperCase() + ' · ' + SCRN[sec][i] }; }
  let view = 'room', sec = null, scr = null, tgt = VIEWS.room, cur = { p: VIEWS.room.p.clone(), a: VIEWS.room.a.clone(), up: V(0, 1, 0), f: VIEWS.room.f };
  function go(name, i) { const was = view + sec + scr; if (name === 'room') { view = 'room'; sec = scr = null; tgt = VIEWS.room; } else if (i != null) { view = 'screen'; sec = name; scr = i; tgt = viewScreen(name, i); } else { view = 'section'; sec = name; scr = null; tgt = VIEWS[name]; } if (was !== view + sec + scr) fire('view', { view, sec, scr, title: tgt.t }); }
  function out() { if (view === 'screen') go(sec); else go('room'); }
  function snap() { cur.p.copy(tgt.p); cur.a.copy(tgt.a); cur.up.copy(tgt.up); cur.f = tgt.f; }

  // ---------- brace: FREE -> BRACING (2.5 s, klaxon) -> SECURE; the engine's s.brace wins when it exists ----------
  let braceLocal = 'free', braceT = 0, brVisT = 0, brVis = false;
  function braceState() { const b = S && S.brace; if (b === undefined || b === null) return braceLocal; if (typeof b === 'string') return b.toLowerCase(); if (typeof b === 'object') return String(b.state || b.co || 'free').toLowerCase(); return b ? 'secure' : 'free'; }
  function setBrace(on) { if (typeof E.setBrace === 'function' && S && 'brace' in S) { try { E.setBrace(S, !!on); } catch (e) { } return; } if (on && braceLocal === 'free') { braceLocal = 'bracing'; braceT = 0; } else if (!on && braceLocal !== 'free') braceLocal = 'free'; }

  // ---------- loop ----------
  const stats = { frames: 0, paints: 0, ema: .016, scale: () => rscale }; let govT = 0, last = performance.now(), paintT = 0, secPaint = {}, lastHull = 100, lastShots = 0, lastBlast = 0, lastVol = 0, shakeA = 0, flashA = 0, sway = 1, tm = 0;
  const camP = V(0, 0, 0), camA = V(0, 0, 0), tmpV = V(0, 0, 0), _o = V(0, 0, 0);
  const noise = t => Math.sin(t * 47.3) * .5 + Math.sin(t * 31.1 + 1.7) * .3 + Math.sin(t * 83.7 + .4) * .2;
  function shake(a) { shakeA = Math.min(1.2, Math.max(shakeA, a)); fire('shake', a); }
  const ease = (a, b, k) => a + (b - a) * k;
  function paintScreens(now) { const vs = view === 'room' ? null : sec;
    for (const n in SCR) { const isSec = vs && SECT[vs].indexOf(n) >= 0, period = isSec ? 110 : 450; if (now - (secPaint[n] || 0) < period) continue; secPaint[n] = now; SCR[n].paint(now); stats.paints++; } }
  function frame(now) { const dt = Math.min(.25, (now - last) / 1000); last = now; const t = now / 1000; tm = t; stats.frames++; stats.ema += ((now - (stats.prev || now)) / 1000 - stats.ema) * .1; stats.prev = now;
    if (!FIXSCALE && now - govT > 2500) { govT = now; if (stats.ema > .05 && rscale > .5) { rscale = Math.max(.5, rscale * .75); R.setPixelRatio(Math.min(devicePixelRatio || 1, 2) * rscale); R.setSize(innerWidth, innerHeight); } else if (stats.ema < .02 && rscale < 1) { rscale = Math.min(1, rscale / .85); R.setPixelRatio(Math.min(devicePixelRatio || 1, 2) * rscale); R.setSize(innerWidth, innerHeight); } }
    const run = !S.over && !S.hold; if (run) E.tick(S, dt / P.secPerMin * tscale); const evs = A.update(S, S.over || S.hold ? 0 : dt * tscale); if (evs.length) fire('events', evs); annOut = ANN.update({ s: S, model: A.model, E }); LS.ctx.annOut = annOut;
    // brace
    const bs = braceState(); if (braceLocal === 'bracing') { braceT += dt; if (braceT > 2.5) braceLocal = 'secure'; }
    if (bs !== 'free') { brVisT += dt; if (brVisT > 1.0 && !brVis) { brVis = true; couches.forEach(c => { c.free.visible = false; c.br.visible = true; }); } } else { brVisT = 0; if (brVis) { brVis = false; couches.forEach(c => { c.free.visible = true; c.br.visible = false; }); } }
    // events that shake the room
    if (S.hull < lastHull - .01) { const d = lastHull - S.hull; shake(Math.min(1.2, .35 + d / 14)); flashA = Math.min(.55, .2 + d / 40); } lastHull = S.hull;
    if (S.shots > lastShots) shake(.28); lastShots = S.shots; if (S.blastUntil > lastBlast + .001) shake(.5); lastBlast = S.blastUntil; const vl = (S.volleys || []).length; if (vl < lastVol) shake(.12); lastVol = vl;
    shakeA *= Math.exp(-dt * 3.2); flashA *= Math.exp(-dt * 2.2);
    const wl = annOut && annOut.master && annOut.master.warning, cl = annOut && annOut.master && annOut.master.caution, flash2 = ((t * 2) | 0) % 2;
    alarm.intensity = bs === 'bracing' ? 1.5 * (((t * 4) | 0) % 2) : wl && wl.flash ? .9 * flash2 : 0;
    { const u = annFB.userData; if (u.lampW) { u.lampW.material.color.setHex(wl && wl.lit ? (wl.flash && !flash2 ? 0x601008 : 0xff3a2a) : 0x3a0f0c); u.lampC.material.color.setHex(cl && cl.lit ? (cl.flash && !flash2 ? 0x584008 : 0xf0b030) : 0x3a2c0c); } }
    if (!LS.ctx.sel && S.an.length) LS.ctx.sel = (S.an.find(a => a.state !== 'out') || S.an[0]).id;
    if (now - paintT > 130) { paintT = now; paintAnn(t); for (const n in PLATE) { const k = A.model.autonomy; const mode = n === 'sensors' ? k.sensors : n === 'attack' ? k.weapons : k.engineering; const key = mode; if (PLATE[n].key !== key) { PLATE[n].key = key; paintPlate(n, mode); } } }
    for (const n in PLATE) PLATE[n].sp.material.opacity = ease(PLATE[n].sp.material.opacity, view === 'room' ? 1 : 0, Math.min(1, dt * 6));
    paintScreens(now);
    // holographic contacts
    { const me = S.player, sc = .5 / (P.arena * .42 || 60); for (let i = 0; i < MAXB; i++) { const m = blips[i], a = S.an[i]; if (!a || a.state === 'out') { m.visible = false; continue; } m.visible = true; const p = a.idStatus === 'plan' ? E.truePos(a, S.t) : E.displayPos(S, a); m.position.set((p.x - me.x) * sc, 0, (p.y - me.y) * sc); if (m.position.length() > .5) m.position.setLength(.5);
        const st = LS.style(a); m.material.color.set(st.col); m.material.wireframe = st.fill === 'dotted' || st.fill === 'hollow'; m.scale.setScalar(st.fill === 'halo' ? 1.5 + .3 * Math.sin(t * 8) : st.fill === 'solid' ? 1.2 : 1); if (LS.ctx.sel === a.id) { selRing.visible = true; selRing.position.copy(m.position); selRing.rotation.x = Math.PI / 2; selRing.scale.setScalar(1 + .12 * Math.sin(t * 6)); } }
      if (!S.an[LS.ctx.sel] || S.an[LS.ctx.sel].state === 'out') selRing.visible = false; }
    holo.rotation.y = t * .08;
    // gauges
    if (!frame.g || now - frame.g > 200) { frame.g = now; const ss = S.sink.h, hull = S.hull / 100, mag = S.mag ? S.mag.total / 60 : 0, vent = S.vent.on ? 1 : S.sink.h * .3; const gs = { 'sensors.g0': ss, 'sensors.g1': S.sysEff || 1, 'attack.g0': hull, 'attack.g1': mag, 'systems.g0': ss, 'systems.g1': vent }; for (const k in gs) { const f = HW[k].children[0]; if (f.userData.set) f.userData.set(gs[k]); } }
    // camera: critically damped glide to the tier, plus head sway and shake
    const k = 1 - Math.exp(-dt * 5.2); cur.p.lerp(tgt.p, k); cur.a.lerp(tgt.a, k); cur.up.lerp(tgt.up, k); cur.f = ease(cur.f, tgt.f, k);
    const sw = (view === 'screen' ? .35 : 1) * sway, bsx = bs === 'bracing' ? .35 : 0, amp = Math.min(1.2, shakeA + bsx + (bs === 'secure' && (S.speed === 'v5' || S.speed === 'ab') ? .06 : 0));
    camP.copy(cur.p); camA.copy(cur.a); const dist = camP.distanceTo(camA);
    camP.x += Math.sin(t * .55) * .006 * sw + noise(t) * .028 * amp; camP.y += Math.sin(t * .43 + 1) * .005 * sw + noise(t + 9.1) * .028 * amp; camP.z += Math.sin(t * .37 + 2) * .004 * sw;
    camA.x += Math.sin(t * .31) * .004 * dist * sw + noise(t + 3.3) * .02 * dist * amp; camA.y += Math.sin(t * .27 + 1.3) * .003 * dist * sw + noise(t + 5.7) * .02 * dist * amp;
    cam.position.copy(camP); cam.up.copy(cur.up); cam.lookAt(camA); cam.fov = cur.f + amp * 1.2; cam.updateProjectionMatrix();
    fire('frame', dt, t);
    R.render(S3, cam); requestAnimationFrame(frame); window.__ready = true; }
  addEventListener('resize', () => { R.setSize(innerWidth, innerHeight); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); OUT.uniforms.asp.value = cam.aspect; });
  window.CIC = { stats, E, P, THREE, scene: S3, cam, R, Slots, HW, BENCH, SCR, SECT, SCRN, SCRMESH, NAV, holoHits, blips, holo, annObj, annFB, annTiles, couches, VIEWS, PLATE,
    get S() { return S; }, get A() { return A; }, get ANN() { return ANN; }, get annOut() { return annOut; }, get view() { return view; }, get sec() { return sec; }, get scr() { return scr; }, get tier() { return tgt.t; }, get tscale() { return tscale; }, get shakeA() { return shakeA; }, get flashA() { return flashA; }, get time() { return tm; },
    go, out, snap, setBrace, braceState, begin, shake, setTime(n) { tscale = n; }, on(k, f) { hooks[k].push(f); }, fire, paintAnn, set sway(v) { sway = v; } };
  window.CIC3D = { go, setBrace, S: () => S, A: () => A, E, Slots, view: () => view, brace: () => braceState(), step(n, dtReal) { for (let i = 0; i < n; i++) { E.tick(S, (dtReal || .1) / P.secPerMin * tscale); A.update(S, dtReal || .1); } annOut = ANN.update({ s: S, model: A.model, E }); } };
  Slots.load().then(() => { requestAnimationFrame(frame); });
  if (SHOT) { const [v, i] = SHOT.split(':'); if (v === 'brace') { setBrace(true); } if (['sensors', 'attack', 'systems'].includes(v)) go(v, i != null ? +i : null); window.__shot = SHOT; snap(); }
})();
