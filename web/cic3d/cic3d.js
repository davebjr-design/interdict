/* 3D CIC shell: scene + tiers + brace + live wiring. Requires THREE, props.js, props_b.js, live_screens.js, HuntRT, Stations, StationAdapter, Annunciator. */
'use strict';
(function () {
  const Q = new URLSearchParams(location.search), E = HuntRT, SEED = +(Q.get('seed') || 7) | 0, SHOT = Q.get('shot') || '';
  const RW = innerWidth, RH = innerHeight;
  const R = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); R.setSize(RW, RH); R.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); document.body.appendChild(R.domElement); OUT.uniforms.asp.value = RW / RH;
  const S3 = new THREE.Scene(), cam = new THREE.PerspectiveCamera(42, RW / RH, .1, 60); R.setClearColor(0x0c1618);
  const toon = (c, o) => new THREE.MeshToonMaterial(Object.assign({ color: c, gradientMap: grad }, o || {}));

  // ---------- asset slot registry: procedural fallback now, Meshy GLB later (assets/props/glb/manifest.json) ----------
  const Slots = { manifest: {}, loader: typeof THREE.GLTFLoader === 'function' ? new THREE.GLTFLoader() : null, used: {},
    make(key, fallback, size) { const g = new THREE.Group(); g.name = 'slot:' + key; g.userData.slot = key; const f = fallback(); g.add(f); (this.used[key] = this.used[key] || []).push(g); if (this.manifest[key]) this.swap(g, key, f); return g; },
    swap(g, key, f) { if (!this.loader) return; const m = this.manifest[key], box = new THREE.Box3().setFromObject(f), sz = box.getSize(new THREE.Vector3()); this.loader.load('../assets/props/glb/' + (m.file || key + '.glb'), gl => { const o = gl.scene, b = new THREE.Box3().setFromObject(o), s = b.getSize(new THREE.Vector3()); const k = (m.scale || 1) * (sz.y > 0 && s.y > 0 ? sz.y / s.y : 1); o.scale.setScalar(k); const c = new THREE.Box3().setFromObject(o); o.position.y += box.min.y - c.min.y + (m.y || 0); o.position.x += (box.min.x + sz.x / 2) - (c.min.x + (c.max.x - c.min.x) / 2); o.position.z += (box.min.z + sz.z / 2) - (c.min.z + (c.max.z - c.min.z) / 2); if (m.rot) o.rotation.y = m.rot; g.remove(f); g.add(o); g.userData.glb = true; }, undefined, () => { }); },
    load() { return fetch('../assets/props/glb/manifest.json').then(r => r.ok ? r.json() : {}).then(m => { this.manifest = m || {}; }).catch(() => { }); } };
  window.Slots = Slots;

  // ---------- live hunt + crew ----------
  const P = E.P; P.secPerMin = 16; let S = null, A = null, ANN = null, annOut = null, tscale = 1, held = false;
  function begin() { S = E.newHunt(SEED, { entry: Q.get('entry') || 'standard', friendly: true }); A = StationAdapter.create({ engine: E, seed: SEED, command: 'tight', preset: 'ambush' }); A.update(S, 0); ANN = Annunciator.create(); LS.ctx.S = S; LS.ctx.E = E; LS.ctx.A = A; LS.ctx.sel = null; }
  begin();

  // ---------- room ----------
  { const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d'); x.fillStyle = '#2b3b3f'; x.fillRect(0, 0, 512, 512); x.strokeStyle = '#18262a'; x.lineWidth = 3; for (let r = 0; r < 9; r++) for (let q = 0; q < 7; q++) { const ox = (r % 2) * 36; x.strokeRect(q * 72 + ox, r * 58, 72, 58); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2.6, 2.6); const f = new THREE.Mesh(new THREE.CylinderGeometry(5.9, 5.9, .2, 64), toon(0xffffff, { map: t })); f.position.y = -.1; S3.add(f);
    for (const r of [1.7, 3.0, 4.9]) { const rg = new THREE.Mesh(new THREE.TorusGeometry(r, .02, 6, 96), new THREE.MeshBasicMaterial({ color: 0xb8cfcc })); rg.rotation.x = Math.PI / 2; rg.position.y = .005; S3.add(rg); }
    const wl = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 3.6, 64, 1, true, Math.PI * .62, Math.PI * .76), toon(0x23353a, { side: THREE.DoubleSide })); wl.position.y = 1.8; S3.add(wl);
    for (let i = 0; i < 13; i++) { const a = Math.PI * .62 + i * (Math.PI * .76) / 12; const rb = M(RB(.22, 3.6, .16, .05), K.steel, S3, 6 * Math.sin(a), 1.8, 6 * Math.cos(a)); rb.rotation.y = a; }
    for (const y of [.55, 3.4]) { const pts = []; for (let i = 0; i <= 30; i++) { const a = Math.PI * .62 + i * (Math.PI * .76) / 30; pts.push(new THREE.Vector3(5.9 * Math.sin(a), y, 5.9 * Math.cos(a))); } M(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, .05, 8), K.brass, S3); }
    const r1 = Slots.make('rack', () => rack(true)); r1.position.set(-1.7, 0, -5.4); S3.add(r1); const r2 = Slots.make('rack', () => rack(false)); r2.position.set(1.7, 0, -5.4); S3.add(r2); const b = Slots.make('breaker', () => breaker()); b.position.set(3.7, 1.5, -4.6); b.rotation.y = -.6; S3.add(b); }

  // ---------- annunciator hardware: painted from the live lamp states ----------
  const annC = document.createElement('canvas'); annC.width = 1536; annC.height = 220; const annG = annC.getContext('2d'), annT = new THREE.CanvasTexture(annC); annT.encoding = THREE.sRGBEncoding;
  const LAMP = { warning: ['#ff3a2a', '#fff'], caution: ['#f0a830', '#210'], advisory: ['#7fe0e8', '#012'], normal: ['#18452d', '#6fa'], off: ['#0b1514', '#244'] };
  function paintAnn(t) { const g = annG; g.fillStyle = '#060d0c'; g.fillRect(0, 0, 1536, 220); const T = Annunciator.TILES, cols = 10, w = 150, h = 62; T.forEach((tl, i) => { const L = annOut && annOut.lamps[tl.id], st = L ? L.state : 'off', flash = L && L.flash && !L.acked && ((t * 3) | 0) % 2 === 0; const c = LAMP[st] || LAMP.off, x = 12 + (i % cols) * (w + 2), y = 10 + Math.floor(i / cols) * (h + 6); g.fillStyle = flash ? '#000' : c[0]; g.fillRect(x, y, w - 6, h); g.fillStyle = flash ? c[0] : c[1]; g.font = 'bold 19px monospace'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(tl.label, x + (w - 6) / 2, y + h / 2); }); g.textAlign = 'left'; annT.needsUpdate = true; }
  { const a = Slots.make('annunciator', () => annHW(annT)); a.position.set(0, 3.0, -5.0); a.rotation.x = -.6; S3.add(a); }

  // ---------- couches: a FREE and a BRACE variant per seat, swapped by the brace state ----------
  const couches = [];
  function seatPair(parent, opt, rotY) { const free = Slots.make('couch_' + (opt.co ? 'co' : 'crew'), () => couch(Object.assign({ recline: opt.co ? .15 : .2, gimbal: 0, leg: .45, harness: 'open' }, opt))), br = couch(Object.assign({ recline: 1.05, gimbal: .5, leg: 1.15, harness: 'on' }, opt)); [free, br].forEach(c => { c.rotation.y = rotY; parent.add(c); }); br.visible = false; couches.push({ free, br }); return { free, br }; }
  const BENCH = {}, HOT = {};
  function station(name, phi, def, occ, deskFn) { const dir = new THREE.Vector3(Math.sin(phi), 0, -Math.cos(phi)); const g = new THREE.Group(); g.position.copy(dir.clone().multiplyScalar(3.1)); g.rotation.y = Math.atan2(-dir.x, -dir.z); S3.add(g); g.add(Slots.make('bench_' + name, () => bench(def))); deskFn && deskFn(g); BENCH[name] = g; if (occ !== null) seatPair(g, { occ }, Math.PI); return g; }
  const mkScr = n => LS.make(n), SCR = {}; ['contacts', 'waterfall', 'tid', 'tma', 'engage', 'payload', 'thermal', 'damage', 'comms'].forEach(n => SCR[n] = mkScr(n));
  const ph = Math.PI / 180, onA = (g, key, f, r, p, y) => onArc(g, Slots.make(key, f), r, p, y);
  station('sensors', -58 * ph, { span: 1.75, screens: [SCR.contacts.t, SCR.waterfall.t, SCR.tid.t], gap: .95 }, 0x4a4f7a, g => { onA(g, 'keypad', keypad, 1.25, .5, .95); onA(g, 'trackball', trackball, 1.25, -.45, .95); for (let i = 0; i < 3; i++) onA(g, 'rotary', rotary, 1.15, -.9 + i * .17, .95); onA(g, 'toggles', () => toggles(6, [0, 2]), 1.4, .9, .96); onA(g, 'gauge', () => gauge('SINK', .45, .7), 1.72, -1.05, 1.3); onA(g, 'gauge', () => gauge('PWR', .6, .8), 1.72, 1.05, 1.3); });
  station('attack', 58 * ph, { span: 1.45, tall: true, screens: [SCR.tma.t, SCR.engage.t, SCR.payload.t], gap: .95, sh: .66 }, 0x2f6a5e, g => { onA(g, 'fire_box', fireBox, 1.22, 0, .96); onA(g, 'joystick', joystick, 1.2, -.55, .96); onA(g, 'keypad', keypad, 1.25, .55, .95); for (let i = 0; i < 3; i++) onA(g, 'rotary', rotary, 1.1, -.95 + i * .17, .95); onA(g, 'toggles', () => toggles(5, [1, 3]), 1.45, .85, .96); onA(g, 'gauge', () => gauge('HULL', .7, .8), 1.72, -.8, 1.42); onA(g, 'gauge', () => gauge('MAG', .9, .95), 1.72, .8, 1.42); });
  station('systems', 0, { span: 1.75, screens: [SCR.thermal.t, SCR.damage.t, SCR.comms.t], gap: .95 }, null, g => { onA(g, 'toggles', () => toggles(6, [1, 4]), 1.3, -.6, .96); onA(g, 'keypad', keypad, 1.25, .5, .95); onA(g, 'gauge', () => gauge('SINK', .8, .7), 1.72, -1.0, 1.3); onA(g, 'gauge', () => gauge('VENT', .3, .8), 1.72, 1.0, 1.3); });
  // map table + hologram of live contacts
  const holo = new THREE.Group(), blips = [];
  { const t = new THREE.Group(); S3.add(t); M(CYL(.58, .82, .82, 40), K.steel, t, 0, .41, 0); M(CYL(1.05, 1.05, .1, 48), K.steel, t, 0, .86, 0); M(CYL(.92, .92, .03, 48), 0x0d1c1e, t, 0, .92, 0);
    const rm = new THREE.Mesh(new THREE.TorusGeometry(1.1, .045, 10, 64), toon(K.brass)); rm.rotation.x = Math.PI / 2; rm.position.y = .93; t.add(rm); rm.add(new THREE.Mesh(rm.geometry, OUT));
    holo.position.y = 1.5; t.add(holo); const bm = (c, o, w) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, wireframe: !!w }); holo.add(new THREE.Mesh(new THREE.SphereGeometry(.5, 22, 14), bm(0x4fe0d0, .3, true))); holo.add(new THREE.Mesh(new THREE.SphereGeometry(.5, 22, 14), bm(0x0c5a52, .12)));
    const me = new THREE.Mesh(new THREE.OctahedronGeometry(.035), bm(0xe8a33a, 1)); holo.add(me);
    S.an.forEach(a => { const m = new THREE.Mesh(new THREE.SphereGeometry(.026, 10, 8), bm(0x4a78f0, 1)); holo.add(m); blips.push(m); });
    const L = new THREE.PointLight(0x4fe0d0, .9, 5); L.position.set(0, 1.6, 0); S3.add(L); }
  const coSeat = seatPair(S3, { co: true, occ: 0x6a4a2a }, Math.PI); [coSeat.free, coSeat.br].forEach(c => c.position.set(0, 0, 2.4));
  S3.add(new THREE.AmbientLight(0xb8d8d4, .5)); const dl = new THREE.DirectionalLight(0xfff0d0, .4); dl.position.set(3, 7, 5); S3.add(dl); const pl = new THREE.PointLight(0xffd9a0, 1.0, 12); pl.position.set(0, 3.2, 0); S3.add(pl); const alarm = new THREE.PointLight(0xff3a20, 0, 9); alarm.position.set(-3, 2.5, -2); S3.add(alarm);
  S3.updateMatrixWorld(true);

  // ---------- tiers ----------
  const w = (n, v) => BENCH[n].localToWorld(new THREE.Vector3(...v)), V = (x, y, z) => new THREE.Vector3(x, y, z);
  const VIEWS = { room: { p: V(.6, 4.4, 9.6), a: V(0, 1.0, -1.2), f: 42, t: 'ROOM' },
    sensors: { p: w('sensors', [1.05, 1.75, .7]), a: w('sensors', [-.3, 1.2, -1.6]), f: 56, t: 'SECTION · SENSORS' }, attack: { p: w('attack', [-1.05, 1.75, .7]), a: w('attack', [.3, 1.2, -1.6]), f: 56, t: 'SECTION · ATTACK' }, systems: { p: w('systems', [0, 1.9, 1.0]), a: w('systems', [0, 1.2, -1.6]), f: 58, t: 'SECTION · SYSTEMS' } };
  const SCRPOS = { sensors: [[-.95, .0], [0, 0], [.95, 0]], attack: [[-.95, 0], [0, 0], [.95, 0]], systems: [[-.95, 0], [0, 0], [.95, 0]] };
  let view = 'room', sec = null, scr = null, tgt = VIEWS.room, cur = { p: VIEWS.room.p.clone(), a: VIEWS.room.a.clone(), f: VIEWS.room.f };
  function viewScreen(s, i) { const g = BENCH[s], off = SCRPOS[s][i][0]; return { p: w(s, [off * .85, 1.62, -.4]), a: w(s, [off, 1.62, -1.5]), f: 36, t: 'SCREEN · ' + s.toUpperCase() + ' ' + (i + 1) }; }
  function go(name, i) { if (name === 'room') { view = 'room'; sec = scr = null; tgt = VIEWS.room; } else if (i != null) { view = 'screen'; sec = name; scr = i; tgt = viewScreen(name, i); } else { view = 'section'; sec = name; scr = null; tgt = VIEWS[name]; } hud(); }
  function out() { if (view === 'screen') go(sec); else go('room'); }

  // ---------- brace: FREE -> BRACING (2.5 s, klaxon) -> SECURE; back with B ----------
  let brace = 'free', braceT = 0;
  function setBrace(on) { if (on && brace === 'free') { brace = 'bracing'; braceT = 0; } else if (!on && brace !== 'free') { brace = 'free'; couches.forEach(c => { c.free.visible = true; c.br.visible = false; }); } hud(); }

  // ---------- HUD ----------
  const hudEl = document.getElementById('hud'), callEl = document.getElementById('call'), keysEl = document.getElementById('keys');
  const crew = n => String(n || '').replace(/^./, c => c.toUpperCase());
  function hud() { const s = S; hudEl.innerHTML = '<b>' + (view === 'room' ? VIEWS.room.t : tgt.t) + '</b>' + (brace !== 'free' ? ' · <span class="br">' + brace.toUpperCase() + '</span>' : '') + '<div>T+' + Math.floor(s.t) + ' · HULL ' + Math.round(s.hull) + '% · SINK ' + Math.round(s.sink.h * 100) + '% · MAG ' + (s.mag ? s.mag.total : '--') + ' · x' + tscale + (s.over ? ' · <span class="br">HUNT OVER</span>' : '') + '</div>'; }
  keysEl.innerHTML = 'F1 room · F2 sensors · F3 attack · F4 systems · Q/W/E screens · Esc out · 1-3 answer · Bksp stand by · B brace · Space ack · T speed';
  let curCall = null;
  function callUI() { const p = A.model.pending(); const c = p.find(x => x.pri >= 3) || p[0] || null; curCall = c; if (!c) { callEl.style.display = 'none'; return; } callEl.style.display = 'block'; callEl.innerHTML = '<b>' + crew(c.officer).toUpperCase() + ' · ' + String(c.station).toUpperCase() + '</b><div class="l">' + (c.line || '') + '</div>' + (c.opts ? '<div class="o">' + c.opts.map((o, i) => (i + 1) + ' ' + o.label + (i === c.def ? ' ✓' : '')).join('   ') + '</div>' : ''); }
  addEventListener('keydown', e => { const k = e.key; if (/^F[1-4]$/.test(k)) { e.preventDefault(); go(['room', 'sensors', 'attack', 'systems'][+k[1] - 1]); }
    else if ((k === 'q' || k === 'w' || k === 'e') && sec) go(sec, 'qwe'.indexOf(k)); else if (k === 'Escape') out(); else if (k === 'b' || k === 'B') setBrace(brace === 'free'); else if (k === 't' || k === 'T') { tscale = tscale === 1 ? 2 : tscale === 2 ? 4 : 1; hud(); }
    else if (k === ' ') { e.preventDefault(); if (annOut) ANN.ackAll(); } else if (k === 'Backspace') { e.preventDefault(); if (curCall) A.model.standBy(curCall.id); } else if (/^[1-3]$/.test(k) && curCall && curCall.opts && curCall.opts[+k - 1]) A.model.answer(curCall.id, +k - 1);
    else if (k === 'Tab') { e.preventDefault(); const live = S.an.filter(a => a.state !== 'out'); if (live.length) { const i = live.findIndex(a => a.id === LS.ctx.sel); LS.ctx.sel = live[(i + 1) % live.length].id; } } });
  addEventListener('wheel', e => { if (e.deltaY > 0) out(); else if (view === 'room') go('sensors'); else if (view === 'section') go(sec, 1); }, { passive: true });

  // ---------- loop ----------
  let last = performance.now(), paintT = 0, hudT = 0; const ease = (a, b, k) => a + (b - a) * k;
  function frame(now) { const dt = Math.min(.25, (now - last) / 1000); last = now; const t = now / 1000;
    if (!S.over && !S.hold) { E.tick(S, dt / P.secPerMin * tscale); } A.update(S, S.over || S.hold ? 0 : dt * tscale); annOut = ANN.update({ s: S, model: A.model, E });
    if (brace === 'bracing') { braceT += dt; if (braceT > 1.2 && !couches[0].br.visible) couches.forEach(c => { c.free.visible = false; c.br.visible = true; }); if (braceT > 2.5) { brace = 'secure'; hud(); } }
    alarm.intensity = brace === 'bracing' ? 1.5 * (((t * 4) | 0) % 2) : annOut && annOut.master && annOut.master.warning ? .9 * (((t * 2) | 0) % 2) : 0;
    if (!LS.ctx.sel && S.an.length) LS.ctx.sel = (S.an.find(a => a.state !== 'out') || S.an[0]).id;
    if (now - paintT > 150) { paintT = now; for (const n in SCR) SCR[n].paint(); paintAnn(t); callUI(); }
    if (now - hudT > 400) { hudT = now; hud(); }
    S.an.forEach((a, i) => { const m = blips[i]; if (!m) return; if (a.state === 'out') { m.visible = false; return; } m.visible = true; const p = a.idStatus === 'plan' ? E.truePos(a, S.t) : E.displayPos(S, a), me = S.player, sc = .5 / (P.arena * .42 || 60); m.position.set((p.x - me.x) * sc, 0, (p.y - me.y) * sc); if (m.position.length() > .5) m.position.setLength(.5); m.material.color.set(a.state === 'locked' ? 0xf2d03b : 0x4a78f0); });
    holo.rotation.y = t * .08;
    const k = Math.min(1, dt * 4); cur.p.lerp(tgt.p, k); cur.a.lerp(tgt.a, k); cur.f = ease(cur.f, tgt.f, k); cam.position.copy(cur.p); cam.lookAt(cur.a); cam.fov = cur.f; cam.updateProjectionMatrix();
    R.render(S3, cam); requestAnimationFrame(frame); window.__ready = true; }
  addEventListener('resize', () => { R.setSize(innerWidth, innerHeight); cam.aspect = innerWidth / innerHeight; OUT.uniforms.asp.value = cam.aspect; });
  window.CIC3D = { go, setBrace, S: () => S, A: () => A, E, Slots, view: () => view, brace: () => brace, step(n, dtReal) { for (let i = 0; i < n; i++) { E.tick(S, (dtReal || .1) / P.secPerMin * tscale); A.update(S, dtReal || .1); } annOut = ANN.update({ s: S, model: A.model, E }); } };
  Slots.load().then(() => { if (SHOT) { const [v, i] = SHOT.split(':'); if (/brace/.test(v)) setBrace(true); } requestAnimationFrame(frame); });
  if (SHOT) { const [v, i] = SHOT.split(':'); if (v === 'brace') { setBrace(true); } if (['sensors', 'attack', 'systems'].includes(v)) go(v, i != null ? +i : null); window.__shot = SHOT; cur.p.copy(tgt.p); cur.a.copy(tgt.a); cur.f = tgt.f; }
  hud();
})();
