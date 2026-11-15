'use strict';
// ---- C-set: interactive versions of the B props (loaded after props_b.js; these redefine the same globals) ----
// Every prop returns a Group whose userData carries what the interaction layer needs:
//   hit meshes (invisible boxes, userData.part = id), animated nodes (levers, knob, guard pivot) and a setter for live dials.
const HITM = new THREE.MeshBasicMaterial({ visible: false });
function hitBox(parent, w, h, d, x, y, z, part) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), HITM); m.position.set(x, y, z); m.userData.part = part; parent.add(m); return m; }
function labelTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); draw(g, w, h); const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return { c, g, t, redraw(fn) { fn(g, w, h); t.needsUpdate = true; } }; }
// a flat engraved plate lying on the bench top, facing up
function plate3(w, d, texObj, parent, x, y, z) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: texObj.t, transparent: true })); m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); parent.add(m); return m; }

function crt(w, h, tex) { const g = new THREE.Group(); M(RB(w * .86, h * .86, .34, .05), K.steel, g, 0, 0, -.2); M(RB(w * .6, h * .6, .2, .04), K.olive, g, 0, 0, -.42);
  for (const s of [-1, 1]) { M(RB(.07, .07, .2, .03), K.brass, g, s * (w * .28), -h * .12, -.6); }
  const ft = .075; M(RB(w, ft, .1, .02), K.olive, g, 0, h / 2 - ft / 2, 0); M(RB(w, ft, .1, .02), K.olive, g, 0, -h / 2 + ft / 2, 0); M(RB(ft, h, .1, .02), K.olive, g, -w / 2 + ft / 2, 0, 0); M(RB(ft * 1.9, h, .1, .02), K.olive, g, w / 2 - ft * .95, 0, 0);
  M(RB(w + .02, .02, .105, .008, 1), K.brass, g, 0, h / 2, 0); M(RB(w + .02, .02, .105, .008, 1), K.brass, g, 0, -h / 2, 0);
  const sc = new THREE.Mesh(new THREE.PlaneGeometry(w - ft * 3.1, h - ft * 2), new THREE.MeshBasicMaterial({ map: tex })); sc.position.set(-ft * .45, 0, .034); sc.userData.screenPlane = true; g.add(sc); g.userData.screen = sc;
  for (let i = 0; i < 4; i++) M(RB(.03, .04, .02, .008, 1), i < 2 ? K.orange : K.brass, g, w / 2 - ft * .95, h * .25 - i * .075, .055);
  M(CYL(.025, .025, .03, 10), K.brass, g, w / 2 - ft * .95, -h * .3, .06).rotation.x = Math.PI / 2; return g; }

// live dial: g.userData.set(v 0..1)
function gaugeFace(label, warn) { return (x, v) => { x.fillStyle = '#161c1e'; x.fillRect(0, 0, 128, 128); x.strokeStyle = '#d8c27a'; x.lineWidth = 2; for (let i = 0; i <= 10; i++) { const a = Math.PI * (.8 + 1.4 * i / 10); x.beginPath(); x.moveTo(64 + Math.cos(a) * 50, 64 + Math.sin(a) * 50); x.lineTo(64 + Math.cos(a) * (i % 5 ? 58 : 62), 64 + Math.sin(a) * (i % 5 ? 58 : 62)); x.stroke(); }
  x.strokeStyle = '#e0432a'; x.lineWidth = 5; x.beginPath(); x.arc(64, 64, 54, Math.PI * (.8 + 1.4 * warn), Math.PI * 2.2); x.stroke(); x.fillStyle = '#d8c27a'; x.font = 'bold 15px monospace'; x.textAlign = 'center'; x.fillText(label, 64, 100);
  const a = Math.PI * (.8 + 1.4 * Math.max(0, Math.min(1, v))); x.strokeStyle = '#e8e0c0'; x.lineWidth = 3; x.beginPath(); x.moveTo(64, 64); x.lineTo(64 + Math.cos(a) * 46, 64 + Math.sin(a) * 46); x.stroke(); x.fillStyle = '#e8e0c0'; x.beginPath(); x.arc(64, 64, 5, 0, 6.3); x.fill(); }; }
function gauge(label, v, warn, r) { r = r || .1; const g = new THREE.Group(); const b = M(CYL(r, r, .06, 28), K.dark, g, 0, 0, 0); b.rotation.x = Math.PI / 2; M(new THREE.TorusGeometry(r, .016, 8, 28), K.brass, g, 0, 0, .03);
  const face = gaugeFace(label, warn), T = labelTex(128, 128, (x) => face(x, v)); const f = new THREE.Mesh(new THREE.CircleGeometry(r, 28), new THREE.MeshBasicMaterial({ map: T.t })); f.position.z = .032; g.add(f);
  let last = v; g.userData.set = nv => { nv = Math.max(0, Math.min(1, nv)); if (Math.abs(nv - last) < .008) return; last = nv; T.redraw(x => face(x, nv)); }; g.userData.label = label;
  hitBox(g, r * 2, r * 2, .1, 0, 0, .04, 'dial'); return g; }

// n toggle switches on a plate; guardIdx = indices that wear a lift-up guard. userData: lev[], grd[] pivots, set(i,on), guard(i,up), label(i,txt)
function toggles(n, guardIdx, labels) { const g = new THREE.Group(); g.userData.n = n; g.userData.lev = []; g.userData.grd = [];
  M(RB(.07 * n + .05, .025, .1, .01), K.steel, g, 0, 0, 0);
  for (let i = 0; i < n; i++) { const x = (i - (n - 1) / 2) * .07; const t = M(CYL(.008, .012, .06, 8), K.grey, g, x, .04, 0); t.rotation.x = -.3; g.userData.lev.push(t);
    const gi = guardIdx.indexOf(i) >= 0; if (gi) { const pv = new THREE.Group(); pv.position.set(x, .062, -.03); g.add(pv); M(RB(.05, .012, .06, .006, 1), K.brass, pv, 0, 0, .03); pv.rotation.x = 0; g.userData.grd[i] = pv; hitBox(pv, .06, .03, .08, 0, 0, .03, 'g' + i); }
    hitBox(g, .062, .12, .1, x, .06, 0, 't' + i); }
  if (labels) { const T = labelTex(64 * n, 32, (x, w, h) => { x.fillStyle = '#0d1517'; x.fillRect(0, 0, w, h); x.fillStyle = '#e8d9a0'; x.font = 'bold 19px monospace'; x.textAlign = 'center'; x.textBaseline = 'middle'; labels.forEach((l, i) => x.fillText(l, 32 + i * 64, 17)); }); plate3(.07 * n, .032, T, g, 0, .014, .085); }
  g.userData.set = (i, on) => { const l = g.userData.lev[i]; if (l) l.rotation.x = on ? .45 : -.3; }; g.userData.guard = (i, up) => { const p = g.userData.grd[i]; if (p) p.rotation.x = up ? -1.35 : 0; }; return g; }
function keypad() { const g = new THREE.Group(); M(RB(.2, .03, .26, .012), K.steel, g, 0, 0, 0); for (let r = 0; r < 5; r++) for (let c = 0; c < 4; c++) M(RB(.036, .022, .036, .008, 1), (r == 0 && c == 0) || (r == 4 && c == 3) ? K.orange : K.olive, g, (c - 1.5) * .044, .026, (r - 2) * .044); M(RB(.22, .006, .28, .003, 1), K.brass, g, 0, -.014, 0); hitBox(g, .22, .06, .28, 0, .02, 0, 'pad'); return g; }
function trackball() { const g = new THREE.Group(); M(RB(.22, .06, .22, .02), K.steel, g, 0, 0, 0); const t = new THREE.Mesh(new THREE.TorusGeometry(.065, .014, 8, 24), new THREE.MeshToonMaterial({ color: K.brass, gradientMap: grad })); t.rotation.x = Math.PI / 2; t.position.y = .045; g.add(t); const ball = M(new THREE.SphereGeometry(.058, 18, 14), 0x2d3a34, g, 0, .04, 0); g.userData.ball = ball; for (let i = -1; i <= 1; i++) M(RB(.045, .015, .025, .008, 1), K.grey, g, i * .055, .032, .085); hitBox(g, .22, .14, .22, 0, .05, 0, 'ball'); return g; }
function joystick() { const g = new THREE.Group(); M(RB(.2, .05, .2, .02), K.steel, g, 0, 0, 0); M(CYL(.035, .055, .07, 14), K.black, g, 0, .06, 0); const st = new THREE.Group(); st.position.set(0, .085, 0); g.add(st); g.userData.stick = st; const gr = M(RB(.06, .14, .075, .025), K.dark, st, 0, .09, 0); gr.rotation.x = -.2; M(RB(.012, .04, .02, .005, 1), K.orange, st, 0, .12, .045); for (const x of [-.015, .015]) M(CYL(.01, .01, .015, 8), K.brass, st, x, .17, 0); hitBox(g, .2, .3, .2, 0, .15, 0, 'stick'); return g; }
function rotary(title) { const g = new THREE.Group(); M(RB(.18, .016, .18, .01), K.steel, g, 0, 0, 0); M(CYL(.075, .075, .014, 28), K.brass, g, 0, .014, 0); const kn = new THREE.Group(); kn.position.y = .0; g.add(kn); M(CYL(.04, .044, .05, 20), K.black, kn, 0, .045, 0); M(RB(.012, .012, .045, .004, 1), K.brass, kn, 0, .075, -.012); g.userData.knob = kn;
  const T = labelTex(256, 64, () => { }); g.userData.title = title || ''; g.userData.setLabel = (a, b) => T.redraw((x, w, h) => { x.fillStyle = '#0d1517'; x.fillRect(0, 0, w, h); x.fillStyle = '#e8d9a0'; x.font = 'bold 22px monospace'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(a, w / 2, 17); x.fillStyle = '#7fe0e8'; x.font = 'bold 26px monospace'; x.fillText(b || '', w / 2, 46); }); g.userData.setLabel(title || '', ''); plate3(.2, .05, T, g, 0, .012, .12);
  hitBox(g, .18, .1, .18, 0, .045, 0, 'knob'); return g; }
// guarded FIRE box: the guard hinges at the back; lifting it exposes the red button
function fireBox() { const g = new THREE.Group(); M(RB(.24, .1, .3, .03), K.steel, g, 0, .05, 0); const btn = M(CYL(.045, .055, .05, 20), 0xd0302a, g, 0, .12, .0); g.userData.btn = btn;
  const pv = new THREE.Group(); pv.position.set(0, .17, -.145); g.add(pv); g.userData.guardPivot = pv; const gd = new THREE.MeshToonMaterial({ color: 0xe3c92a, gradientMap: grad, transparent: true, opacity: .62 }); const gm = new THREE.Mesh(RB(.23, .07, .29, .025), gd); gm.position.set(0, -.025, .145); pv.add(gm); gm.add(new THREE.Mesh(RB(.23, .07, .29, .025), OUT));
  for (let i = 0; i < 4; i++) M(RB(.04, .008, .22, .003, 1), K.dark, pv, -.075 + i * .05, .015, .145); M(CYL(.012, .012, .008, 8), 0x6a8f34, g, -.07, .1, -.12); M(CYL(.012, .012, .008, 8), 0xd0602a, g, .07, .1, -.12);
  hitBox(pv, .25, .1, .3, 0, -.02, .145, 'guard'); hitBox(g, .1, .1, .1, 0, .13, 0, 'btn');
  const T = labelTex(256, 48, (x, w, h) => { x.fillStyle = '#0d1517'; x.fillRect(0, 0, w, h); x.fillStyle = '#ff6a58'; x.font = 'bold 30px monospace'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('SALVO FIRE', w / 2, 25); }); plate3(.2, .04, T, g, 0, .102, .19);
  g.userData.setGuard = up => { pv.rotation.x = up ? -1.35 : 0; }; return g; }
function annHW(tex) { const g = new THREE.Group(); M(RB(1.9, .34, .16, .03), K.steel, g, 0, 0, 0); const f = new THREE.Mesh(new THREE.PlaneGeometry(1.7, .25), new THREE.MeshBasicMaterial({ map: tex })); f.position.set(.07, 0, .082); f.userData.annPlane = true; g.add(f); g.userData.plane = f;
  g.userData.lampW = M(new THREE.SphereGeometry(.05, 14, 10), 0xd0302a, g, -.86, .07, .09); g.userData.lampC = M(new THREE.SphereGeometry(.05, 14, 10), 0xdca02a, g, -.86, -.04, .09); g.userData.ack = M(RB(.07, .05, .04, .01), K.yellow, g, -.86, -.115, .09);
  hitBox(g, .16, .3, .1, -.86, -.02, .1, 'ack'); for (const s of [-1, 1]) M(RB(.04, .04, .2, .01), K.brass, g, s * .7, .14, -.05); return g; }
function bench(o) { const g = new THREE.Group(); const sp = o.span; g.userData.crts = [];
  arcSlab(1.0, 1.78, sp, .1, K.steel, g, .86); arcSlab(1.2, 1.74, sp - .12, .84, K.steel, g, .0); arcSlab(1.24, 1.7, sp - .2, .64, K.olive, g, .1, .012);
  arcSlab(1.62, 1.8, sp, o.tall ? .78 : .6, K.steel, g, .96); arcTube(.97, sp, .93, .026, K.brass, g); arcTube(1.8, sp, .96 + (o.tall ? .78 : .6), .024, K.brass, g);
  const n = o.screens.length, gap = o.gap || .78, base = 1.25 + (o.tall ? .1 : 0);
  for (let i = 0; i < n; i++) { const phi = (i - (n - 1) / 2) * gap / 1.55 * (o.spread || 1); const c = crt(o.sw || .86, o.sh || .62, o.screens[i]); onArc(g, c, 1.5, phi, base + .35); c.rotation.x = -.2; g.userData.crts.push(c); }
  return g; }
