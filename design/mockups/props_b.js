'use strict';
// ---- B-set props (built from the Gemini B sheets) ----
function smooth(geo){const g=geo.clone();g.deleteAttribute('normal');g.deleteAttribute('uv');const p=g.attributes.position,map=new Map(),np=[],rm=new Array(p.count);
 for(let i=0;i<p.count;i++){const k=Math.round(p.getX(i)*1e3)+','+Math.round(p.getY(i)*1e3)+','+Math.round(p.getZ(i)*1e3);let j=map.get(k);if(j===undefined){j=np.length/3;map.set(k,j);np.push(p.getX(i),p.getY(i),p.getZ(i));}rm[i]=j;}
 const idx=g.index?Array.from(g.index.array).map(i=>rm[i]):rm;const o=new THREE.BufferGeometry();o.setAttribute('position',new THREE.Float32BufferAttribute(np,3));o.setIndex(idx);o.computeVertexNormals();return o}
function arcSlab(r0,r1,span,h,col,parent,y,bev){const a0=Math.PI/2-span/2,a1=Math.PI/2+span/2;const sh=new THREE.Shape();sh.moveTo(r0*Math.cos(a0),r0*Math.sin(a0));sh.absarc(0,0,r1,a0,a1,false);sh.lineTo(r0*Math.cos(a1),r0*Math.sin(a1));sh.absarc(0,0,r0,a1,a0,true);
 const b=bev==null?.02:bev;const g=new THREE.ExtrudeGeometry(sh,{depth:h-2*b,bevelEnabled:true,bevelThickness:b,bevelSize:b,bevelSegments:2,curveSegments:28});g.rotateX(-Math.PI/2);g.translate(0,b,0);
 return M(g,col,parent,0,y||0,0,smooth(g))}
function arcTube(r,span,y,rad,col,parent){const pts=[];for(let i=0;i<=40;i++){const f=-span/2+span*i/40;pts.push(new THREE.Vector3(r*Math.sin(f),y,-r*Math.cos(f)));}const g=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),60,rad,8);return M(g,col,parent)}
function onArc(parent,obj,r,phi,y){obj.position.set(r*Math.sin(phi),y,-r*Math.cos(phi));obj.rotation.y=-phi;parent.add(obj);return obj}   // obj faces +z (towards the officer at origin)
// B2 CRT housing, front faces +z, screen texture on the glass
function crt(w,h,tex){const g=new THREE.Group();M(RB(w*.86,h*.86,.34,.05),K.steel,g,0,0,-.2);M(RB(w*.6,h*.6,.2,.04),K.olive,g,0,0,-.42);
 for(const s of[-1,1]){const n=M(RB(.07,.07,.2,.03),K.brass,g,s*(w*.28),-h*.12,-.6);}
 const ft=.075;M(RB(w,ft,.1,.02),K.olive,g,0,h/2-ft/2,0);M(RB(w,ft,.1,.02),K.olive,g,0,-h/2+ft/2,0);M(RB(ft,h,.1,.02),K.olive,g,-w/2+ft/2,0,0);M(RB(ft*1.9,h,.1,.02),K.olive,g,w/2-ft*.95,0,0);
 M(RB(w+.02,.02,.105,.008,1),K.brass,g,0,h/2,0);M(RB(w+.02,.02,.105,.008,1),K.brass,g,0,-h/2,0);
 const sc=new THREE.Mesh(new THREE.PlaneGeometry(w-ft*3.1,h-ft*2),new THREE.MeshBasicMaterial({map:tex}));sc.position.set(-ft*.45,0,.034);g.add(sc);
 for(let i=0;i<4;i++)M(RB(.03,.04,.02,.008,1),i<2?K.orange:K.brass,g,w/2-ft*.95,h*.25-i*.075,.055);
 M(CYL(.025,.025,.03,10),K.brass,g,w/2-ft*.95,-h*.3,.06).rotation.x=Math.PI/2;return g}
function gaugeTex(label,v,warn){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');x.fillStyle='#161c1e';x.fillRect(0,0,128,128);x.strokeStyle='#d8c27a';x.lineWidth=2;for(let i=0;i<=10;i++){const a=Math.PI*(.8+1.4*i/10);x.beginPath();x.moveTo(64+Math.cos(a)*50,64+Math.sin(a)*50);x.lineTo(64+Math.cos(a)*(i%5?58:62),64+Math.sin(a)*(i%5?58:62));x.stroke();}
 x.strokeStyle='#e0432a';x.lineWidth=5;x.beginPath();x.arc(64,64,54,Math.PI*(.8+1.4*warn),Math.PI*2.2);x.stroke();x.fillStyle='#d8c27a';x.font='bold 13px monospace';x.textAlign='center';x.fillText(label,64,98);
 const a=Math.PI*(.8+1.4*v);x.strokeStyle='#e8e0c0';x.lineWidth=3;x.beginPath();x.moveTo(64,64);x.lineTo(64+Math.cos(a)*46,64+Math.sin(a)*46);x.stroke();x.fillStyle='#e8e0c0';x.beginPath();x.arc(64,64,5,0,6.3);x.fill();const t=new THREE.CanvasTexture(c);return t}
function gauge(label,v,warn,r){r=r||.1;const g=new THREE.Group();const b=M(CYL(r,r,.06,28),K.dark,g,0,0,0);b.rotation.x=Math.PI/2;const rg=M(new THREE.TorusGeometry(r,.016,8,28),K.brass,g,0,0,.03);
 const f=new THREE.Mesh(new THREE.CircleGeometry(r,28),new THREE.MeshBasicMaterial({map:gaugeTex(label,v,warn)}));f.position.z=.032;g.add(f);return g}
function toggles(n,guardIdx){const g=new THREE.Group();M(RB(.07*n+.05,.025,.1,.01),K.steel,g,0,0,0);for(let i=0;i<n;i++){const x=(i-(n-1)/2)*.07;const t=M(CYL(.008,.012,.06,8),K.grey,g,x,.04,0);t.rotation.x=(i%2?.35:-.3);if(guardIdx.includes(i))M(RB(.05,.012,.045,.006,1),K.brass,g,x,.06,.0).rotation.x=-.2;}return g}
function keypad(){const g=new THREE.Group();M(RB(.2,.03,.26,.012),K.steel,g,0,0,0);for(let r=0;r<5;r++)for(let c=0;c<4;c++)M(RB(.036,.022,.036,.008,1),(r==0&&c==0)||(r==4&&c==3)?K.orange:K.olive,g,(c-1.5)*.044,.026,(r-2)*.044);M(RB(.22,.006,.28,.003,1),K.brass,g,0,-.014,0);return g}
function trackball(){const g=new THREE.Group();M(RB(.22,.06,.22,.02),K.steel,g,0,0,0);const t=new THREE.Mesh(new THREE.TorusGeometry(.065,.014,8,24),new THREE.MeshToonMaterial({color:K.brass,gradientMap:grad}));t.rotation.x=Math.PI/2;t.position.y=.045;g.add(t);M(new THREE.SphereGeometry(.058,18,14),0x2d3a34,g,0,.04,0);for(let i=-1;i<=1;i++)M(RB(.045,.015,.025,.008,1),K.grey,g,i*.055,.032,.085);return g}
function joystick(){const g=new THREE.Group();M(RB(.2,.05,.2,.02),K.steel,g,0,0,0);M(CYL(.035,.055,.07,14),K.black,g,0,.06,0);const gr=M(RB(.06,.14,.075,.025),K.dark,g,0,.17,0);gr.rotation.x=-.2;M(RB(.012,.04,.02,.005,1),K.orange,g,0,.2,.045);for(const x of[-.015,.015])M(CYL(.01,.01,.015,8),K.brass,g,x,.25,0);return g}
function rotary(){const g=new THREE.Group();M(RB(.18,.016,.18,.01),K.steel,g,0,0,0);M(CYL(.075,.075,.014,28),K.brass,g,0,.014,0);const k=M(CYL(.04,.044,.05,20),K.black,g,0,.045,0);M(RB(.012,.012,.045,.004,1),K.brass,g,0,.075,-.012);return g}
function fireBox(){const g=new THREE.Group();M(RB(.24,.1,.3,.03),K.steel,g,0,.05,0);M(CYL(.045,.055,.05,20),0xd0302a,g,0,.12,.0);
 const gd=new THREE.MeshToonMaterial({color:0xe3c92a,gradientMap:grad,transparent:true,opacity:.62});const gm=new THREE.Mesh(RB(.23,.07,.29,.025),gd);gm.position.set(0,.145,0);g.add(gm);gm.add(new THREE.Mesh(RB(.23,.07,.29,.025),OUT));
 for(let i=0;i<4;i++)M(RB(.04,.008,.22,.003,1),K.dark,g,-.075+i*.05,.185,0);M(CYL(.012,.012,.008,8),0x6a8f34,g,-.07,.1,-.12);M(CYL(.012,.012,.008,8),0xd0602a,g,.07,.1,-.12);return g}
function annHW(tex){const g=new THREE.Group();M(RB(1.9,.34,.16,.03),K.steel,g,0,0,0);const f=new THREE.Mesh(new THREE.PlaneGeometry(1.7,.25),new THREE.MeshBasicMaterial({map:tex}));f.position.set(.07,0,.082);g.add(f);
 M(new THREE.SphereGeometry(.05,14,10),0xd0302a,g,-.86,.07,.09);M(new THREE.SphereGeometry(.05,14,10),0xdca02a,g,-.86,-.04,.09);M(RB(.07,.05,.04,.01),K.yellow,g,-.86,-.115,.09);
 for(const s of[-1,1])M(RB(.04,.04,.2,.01),K.brass,g,s*.7,.14,-.05);return g}
function rack(open){const g=new THREE.Group();M(RB(.78,2.1,.7,.05),K.steel,g,0,1.05,0);M(RB(.84,.06,.76,.02),K.dark,g,0,.03,0);
 if(!open){M(RB(.66,1.9,.05,.02),K.steel,g,0,1.05,.37);for(let i=0;i<14;i++)M(RB(.5,.03,.03,.01,1),K.dark,g,0,.35+i*.11,.4);M(RB(.03,.35,.04,.012),K.brass,g,.28,1.05,.42);}
 else{M(RB(.66,1.9,.04,.02),K.dark,g,0,1.05,.34);for(let i=0;i<7;i++){const y=.28+i*.26;M(RB(.64,.22,.06,.02),i%3==1?K.steel:K.olive,g,0,y,.37);for(let k=0;k<4;k++)M(CYL(.025,.025,.03,12),K.black,g,-.22+k*.1,y+.02,.42).rotation.x=Math.PI/2;for(let k=0;k<6;k++)M(RB(.022,.022,.02,.006,1),(k+i)%3?0xe3a22a:0x6ac04a,g,-.24+k*.05,y-.07,.41);M(RB(.025,.14,.04,.01),K.brass,g,-.29,y,.41);M(RB(.025,.14,.04,.01),K.brass,g,.29,y,.41);}
  const door=new THREE.Group();door.position.set(.36,1.05,.38);door.rotation.y=-1.9;g.add(door);M(RB(.7,1.9,.05,.02),K.steel,door,-.35,0,0);for(let i=0;i<12;i++)M(RB(.5,.03,.03,.01,1),K.dark,door,-.35,-.8+i*.14,.03);M(RB(.03,.35,.04,.012),K.brass,door,-.6,0,.04);}
 return g}
function breaker(){const g=new THREE.Group();M(RB(.34,.52,.14,.03),K.steel,g,0,0,0);M(RB(.24,.12,.015,.006,1),K.grey,g,-.02,.14,.08);M(RB(.2,.1,.015,.006,1),K.grey,g,0,-.12,.08);M(RB(.1,.18,.025,.008),K.brass,g,.13,0,.08);const h=M(RB(.04,.15,.04,.012),0xcc2a26,g,.13,.02,.12);h.rotation.z=.25;M(CYL(.02,.02,.2,10),K.grey,g,-.08,.36,0);M(CYL(.02,.02,.2,10),K.grey,g,.08,.36,0);return g}
function bench(o){ // o:{span, screens:[tex], sw,sh, tall}. Officer origin; bench arc in -z. Returns group
 const g=new THREE.Group();const sp=o.span;
 arcSlab(1.0,1.78,sp,.1,K.steel,g,.86);arcSlab(1.2,1.74,sp-.12,.84,K.steel,g,.0);arcSlab(1.24,1.7,sp-.2,.64,K.olive,g,.1,.012);
 arcSlab(1.62,1.8,sp,o.tall?.78:.6,K.steel,g,.96);arcTube(.97,sp,.93,.026,K.brass,g);arcTube(1.8,sp,.96+(o.tall?.78:.6),.024,K.brass,g);
 const n=o.screens.length;const gap=o.gap||.78;const base=1.25+(o.tall?.1:0);
 for(let i=0;i<n;i++){const phi=(i-(n-1)/2)*gap/1.55*(o.spread||1);const c=crt(o.sw||.86,o.sh||.62,o.screens[i]);c.rotation.x=-.17;onArc(g,c,1.5,phi,base+.35);c.rotation.x=-.2;}
 return g}
