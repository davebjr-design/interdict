'use strict';
const K={olive:0x5b5a2c,steel:0x31505b,brass:0xa5862f,orange:0xd2582c,dark:0x1c2528,grey:0x8d9a9c,black:0x161b1d,yellow:0xb8981f};
const grad=(()=>{const d=new Uint8Array([80,150,220]);const t=new THREE.DataTexture(d,3,1,THREE.LuminanceFormat);t.minFilter=t.magFilter=THREE.NearestFilter;t.needsUpdate=true;return t})();
const OUT=new THREE.ShaderMaterial({side:THREE.BackSide,uniforms:{t:{value:.0042},asp:{value:16/9}},vertexShader:'uniform float t;uniform float asp;void main(){vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.);vec3 n=normalize(normalMatrix*normal);vec2 o=(projectionMatrix*vec4(n,0.)).xy;o=normalize(o+1e-6);p.xy+=vec2(o.x/asp,o.y)*t*p.w;gl_Position=p;}',fragmentShader:'void main(){gl_FragColor=vec4(.03,.045,.055,1.);}'});
function RB(w,h,d,r,seg){r=Math.min(r==null?.025:r,Math.min(w,h,d)/2-.001);seg=seg||3;const g=new THREE.BoxGeometry(w,h,d,seg*2,seg*2,seg*2),p=g.attributes.position,n=g.attributes.normal;const hx=w/2-r,hy=h/2-r,hz=d/2-r;
 for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);const ix=Math.max(-hx,Math.min(hx,x)),iy=Math.max(-hy,Math.min(hy,y)),iz=Math.max(-hz,Math.min(hz,z));let nx=x-ix,ny=y-iy,nz=z-iz;const l=Math.hypot(nx,ny,nz);if(l>1e-6){nx/=l;ny/=l;nz/=l;p.setXYZ(i,ix+nx*r,iy+ny*r,iz+nz*r);n.setXYZ(i,nx,ny,nz);}}
 return g;}
function M(geo,col,parent,x,y,z,og){const m=new THREE.Mesh(geo,new THREE.MeshToonMaterial({color:col,gradientMap:grad}));m.add(new THREE.Mesh(og||geo,OUT));if(parent)parent.add(m);m.position.set(x||0,y||0,z||0);return m}
const CYL=(a,b,h,s)=>new THREE.CylinderGeometry(a,b,h,s||28);
function strap(parent,a,b,w,col){const d=b.clone().sub(a),L=d.length();const m=M(RB(w,.014,L,.005,1),col||K.orange,parent);m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),d.normalize());return m}
function helix(a,b,turns,rad){const pts=[];const N=turns*14;for(let i=0;i<=N;i++){const t=i/N,ang=t*turns*Math.PI*2;const c=a.clone().lerp(b,t);pts.push(new THREE.Vector3(c.x+Math.cos(ang)*rad,c.y+Math.sin(ang)*rad,c.z));}return new THREE.CatmullRomCurve3(pts)}
function key(parent,x,y,z,col){M(RB(.016,.012,.024,.004,1),col||K.brass,parent,x,y,z)}

function limbC(parent,a,b,r,col){const d=b.clone().sub(a),L=d.length();const m=M(CYL(r,r,L,12),col,parent);m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return m}
function couch(o){
 const g=new THREE.Group();
 M(CYL(.52,.58,.07,48),K.steel,g,0,.035,0);M(CYL(.22,.3,.36,32),K.steel,g,0,.25,0);
 const ring=M(new THREE.TorusGeometry(.27,.045,10,40),K.brass,g,0,.46,0);ring.rotation.x=Math.PI/2;
 const cab=new THREE.CatmullRomCurve3([new THREE.Vector3(.0,.52,.0)]);
 { const pts=[];const A=new THREE.Vector3(.24,.1,.32),B=new THREE.Vector3(.2,.5,.22);for(let i=0;i<=160;i++){const t=i/160,a=t*Math.PI*2*10;const c=A.clone().lerp(B,t);pts.push(new THREE.Vector3(c.x+Math.cos(a)*.035,c.y+Math.sin(a)*.035,c.z));} M(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),240,.014,6),K.black,g); }
 const seat=new THREE.Group();seat.position.set(0,.62,0);seat.rotation.x=-(o.gimbal||0);g.add(seat);
 M(RB(.58,.13,.58,.03),K.olive,seat,0,.065,0);M(RB(.5,.03,.5,.01),K.steel,seat,0,-.01,0);
 for(const s of[-1,1]){M(RB(.06,.24,.62,.025),K.steel,seat,s*.33,.1,0);M(RB(.022,.024,.64,.008,1),K.brass,seat,s*.33,.225,0);
  M(RB(.1,.08,.5,.03),K.olive,seat,s*.37,.27,.04);M(RB(.05,.2,.07,.02),K.steel,seat,s*.37,.15,.08);
  const kp=M(RB(.09,.02,.17,.006,1),K.dark,seat,s*.37,.318,.13);for(let r=0;r<4;r++)for(let c=0;c<2;c++)key(kp,(c-.5)*.028,.014,(r-1.5)*.034,(s<0&&r==3&&c==1)||(s>0&&r==3&&c==1)?K.orange:K.brass);}
 if(o.co){M(RB(.06,.16,.09,.02),K.steel,seat,-.45,.17,.08);const hs=M(RB(.04,.12,.05,.015),K.dark,seat,-.45,.23,.08);M(RB(.02,.02,.02,.005,1),K.orange,seat,-.45,.28,.11);
  const pts=[];for(let i=0;i<=80;i++){const t=i/80,a=t*Math.PI*2*6;pts.push(new THREE.Vector3(-.45+Math.cos(a)*.02,.1-t*.38+Math.sin(a)*.02,.1));}M(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),120,.007,5),K.black,seat);}
 const back=new THREE.Group();back.position.set(0,.1,-.27);back.rotation.x=-(o.recline||.2);seat.add(back);
 M(RB(.54,.84,.13,.035),K.olive,back,0,.42,0);for(const s of[-1,1])M(RB(.026,.84,.15,.01,1),K.brass,back,s*.285,.42,0);
 M(RB(.46,.74,.04,.02),K.steel,back,0,.42,-.085);M(RB(.3,.2,.11,.045),K.olive,back,0,.95,.0);for(const s of[-1,1])M(CYL(.014,.014,.1,10),K.grey,back,s*.09,.85,0);
 if(o.co)M(RB(.2,.075,.014,.006,1),K.brass,back,0,.95,-.066);
 const leg=new THREE.Group();leg.position.set(0,.04,.3);leg.rotation.x=-(o.leg==null?.45:o.leg);seat.add(leg);
 M(RB(.48,.1,.44,.035),K.olive,leg,0,-.26,0);for(const s of[-1,1])M(CYL(.014,.014,.34,10),K.grey,leg,s*.18,-.2,-.1);
 const fp=M(RB(.46,.035,.22,.012),K.steel,leg,0,-.52,.08);fp.rotation.x=.9;
 seat.updateMatrixWorld(true);g.updateMatrixWorld(true);
 if(o.harness){const bk=back,toS=v=>seat.worldToLocal(bk.localToWorld(v.clone()));const V=(x,y,z)=>new THREE.Vector3(x,y,z);const buck=V(0,.14,.02);
  if(o.harness==='on'){for(const s of[-1,1]){strap(seat,toS(V(s*.15,.86,.08)),buck,.05);strap(seat,V(s*.3,.14,-.22),buck,.05);}strap(seat,buck,V(0,.14,.3),.05);
   const b=M(CYL(.045,.045,.03,20),K.brass,seat,0,.15,.02);const r=M(new THREE.TorusGeometry(.045,.01,6,20),K.dark,b);r.rotation.x=Math.PI/2;}
  else{for(const s of[-1,1]){strap(seat,toS(V(s*.15,.86,.08)),toS(V(s*.3,.42,.1)),.05);strap(seat,V(s*.3,.14,-.22),V(s*.46,-.14,-.15),.05);M(RB(.05,.04,.03,.01,1),K.brass,seat,s*.46,-.15,-.15);}}}

 if(o.occ){const skin=0xc79a78,suit=o.occ;const V=(x,y,z)=>new THREE.Vector3(x,y,z);const toSe=v=>seat.worldToLocal(back.localToWorld(v.clone()));
  M(RB(.42,.52,.22,.07),suit,back,0,.40,.18);M(RB(.46,.14,.24,.06),suit,back,0,.68,.17);M(new THREE.SphereGeometry(.115,20,16),skin,back,0,.85,.19);
  const hr=M(new THREE.SphereGeometry(.12,16,12,0,6.3,0,1.5),0x3a2a20,back,0,.87,.18);
  for(const s of[-1,1]){limbC(seat,toSe(V(s*.25,.62,.17)),V(s*.36,.36,.0),.045,suit);limbC(seat,V(s*.36,.36,.0),V(s*.37,.36,.2),.04,suit);
   limbC(seat,V(s*.12,.17,-.08),V(s*.12,.2,.34),.075,suit);limbC(leg,V(s*.12,-.02,.04),V(s*.12,-.42,.06),.06,suit);M(RB(.1,.07,.2,.03),K.black,leg,s*.12,-.47,.12);}}
 return g}

function rail(){const g=new THREE.Group();const bar=M(CYL(.028,.028,.7,16),K.brass,g,0,0,.13);for(const s of[-1,1]){const st=M(CYL(.028,.028,.13,16),K.brass,g,0,s*.35,.065);st.rotation.x=Math.PI/2;M(CYL(.07,.07,.025,24),K.steel,g,0,s*.35,0).rotation.x=Math.PI/2;for(let k=0;k<4;k++){const a=k*Math.PI/2;M(CYL(.01,.01,.03,8),K.grey,g,Math.cos(a)*.052,s*.35+Math.sin(a)*.052,.012).rotation.x=Math.PI/2;}}return g}
function footLoop(){const g=new THREE.Group();const t=M(new THREE.TorusGeometry(.17,.026,10,28,Math.PI),K.steel,g,0,.0,0);t.rotation.z=0;M(new THREE.TorusGeometry(.17,.012,6,28,Math.PI),K.brass,g,0,0,0).position.z=.0;for(const s of[-1,1]){M(RB(.12,.05,.16,.02),K.steel,g,s*.17,-.015,0);}return g}
function woven(){const g=new THREE.Group();M(RB(.14,.1,.1,.02),K.steel,g,0,.5,0);const L=M(new THREE.TorusGeometry(.12,.025,8,28),K.olive,g,0,.27,0);L.scale.set(.7,2.0,.5);M(new THREE.TorusGeometry(.04,.012,6,16),K.brass,g,0,.46,.0);return g}
function plate(){const g=new THREE.Group();M(RB(.62,.05,.38,.02),K.steel,g,0,.025,0);const [c,x]=[document.createElement('canvas')].map(c=>[c,c.getContext('2d')]).map(a=>a)[0];c.width=c.height=256;x.fillStyle='#c9a52c';x.fillRect(0,0,256,256);x.fillStyle='#1c2528';for(let i=-4;i<10;i++){x.beginPath();x.moveTo(i*40,0);x.lineTo(i*40+20,0);x.lineTo(i*40+20+256,256);x.lineTo(i*40+256,256);x.fill();}const tx=new THREE.CanvasTexture(c);
 const top=new THREE.Mesh(new THREE.PlaneGeometry(.58,.34),new THREE.MeshToonMaterial({map:tx,gradientMap:grad}));top.rotation.x=-Math.PI/2;top.position.y=.052;g.add(top);M(RB(.4,.01,.2,.004,1),K.dark,g,0,.056,0);for(const sx of[-1,1])for(const sz of[-1,1])M(CYL(.014,.014,.012,6),K.grey,g,sx*.28,.054,sz*.16);return g}
function tether(){const g=new THREE.Group();const pts=[];for(let i=0;i<=120;i++){const t=i/120,a=t*Math.PI*2*9;pts.push(new THREE.Vector3(Math.cos(a)*.05,t*.5,Math.sin(a)*.05));}M(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),200,.022,6),K.dark,g);M(CYL(.035,.035,.05,12),K.grey,g,0,.53,0);M(CYL(.035,.035,.05,12),K.grey,g,0,-.02,0);
 for(const [y,fl] of[[.64,1],[-.12,-1]]){const c=M(new THREE.TorusGeometry(.06,.014,8,20),K.brass,g,0,y,0);c.scale.set(.7,1.3,1);}return g}

