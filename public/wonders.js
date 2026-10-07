// Wahrzeichen je Epoche: ein Prachtbau pro Welt (Bauplatz 20 × 20 m, Mitte = Ursprung, Eingang Richtung +z).
// Gestaltung wie die übrigen Gebäude: Spieltexturen (Stein, Putz, Schiefer, Ziegel mit Normal-Maps und Verwitterung),
// abgerundete Kanten (RoundedBox, Fasen an Extrusionen), geschlossene Dächer, echte Bogenöffnungen, viel Bauschmuck.
// Nach dem Bau werden alle Teile weltbezogen texturiert (UV je Fläche) und nach Material zu wenigen Meshes zusammengeführt.
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {createAnimal} from './animals.js';
const V=(x,y,z)=>new THREE.Vector3(x,y,z),PI=Math.PI;

// ---------- Materialien: Spielmaterialien getönt (Shader-Verwitterung bleibt erhalten) + eigene Canvas-Texturen ----------
const CACHE=new Map();
function tint(base,col,key,o={}){const k='t:'+key+(base?base.uuid:'');if(CACHE.has(k))return CACHE.get(k);let m;
 if(base){m=base.clone();m.onBeforeCompile=base.onBeforeCompile;m.customProgramCacheKey=base.customProgramCacheKey;if(col!=null)m.color.set(col);Object.assign(m,o)}
 else m=new THREE.MeshStandardMaterial({color:col,roughness:.85,...o});m.userData.uvs=o.uvs||2.4;CACHE.set(k,m);return m}
function canvasMat(key,w,h,draw,o={}){if(CACHE.has(key))return CACHE.get(key);const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);
 const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;const m=new THREE.MeshStandardMaterial({map:t,roughness:.85,...o});m.userData.uvs=o.uvs||2;CACHE.set(key,m);return m}
const rnd=(s=>()=>(s=(s*16807)%2147483647)/2147483647)(12345);
const brickTex=(key,base,dark,glaze)=>canvasMat(key,256,256,(x,W,H)=>{x.fillStyle='#5a4a40';x.fillRect(0,0,W,H);const bh=16,bw=48;
 for(let r=0;r<H/bh;r++)for(let c=-1;c<W/bw+1;c++){const o=(r%2)*bw/2,v=.82+rnd()*.3,hdr=glaze&&r%6===0;const [R,G,B]=hdr?[30,28,30]:base;x.fillStyle=`rgb(${R*v|0},${G*v|0},${B*v|0})`;x.fillRect(c*bw+o+1.5,r*bh+1.5,bw-3,bh-3);
  if(!hdr&&rnd()<.15){x.fillStyle=`rgba(${dark[0]},${dark[1]},${dark[2]},.5)`;x.fillRect(c*bw+o+1.5,r*bh+1.5,bw-3,bh-3)}}},{roughness:.9,uvs:1.6});
const marbleInlay=()=>canvasMat('inlay',256,256,(x,W,H)=>{x.fillStyle='#efeadf';x.fillRect(0,0,W,H);for(let i=0;i<300;i++){x.strokeStyle=`rgba(150,140,125,${rnd()*.15})`;x.beginPath();x.moveTo(rnd()*W,rnd()*H);x.lineTo(rnd()*W,rnd()*H);x.stroke()}
 x.strokeStyle='#3e5e46';x.lineWidth=10;x.strokeRect(14,14,W-28,H-28);x.lineWidth=5;x.strokeRect(46,46,W-92,H-92);x.fillStyle='#c98f86';x.fillRect(56,56,W-112,H-112);x.fillStyle='#3e5e46';x.beginPath();x.arc(W/2,H/2,26,0,7);x.fill()},{roughness:.4,uvs:3});
const textMat=(key,txt,bg,fg,w=1024,h=96)=>canvasMat(key,w,h,(x,W,H)=>{x.fillStyle=bg;x.fillRect(0,0,W,H);x.fillStyle=fg;x.font=`bold ${H*.62}px serif`;x.textAlign='center';x.textBaseline='middle';x.fillText(txt,W/2,H/2+2)},{roughness:.6,uvs:1});
const reliefMat=(key,bg,fg)=>canvasMat(key,256,160,(x,W,H)=>{x.fillStyle=bg;x.fillRect(0,0,W,H);x.strokeStyle='rgba(0,0,0,.35)';x.lineWidth=6;x.strokeRect(4,4,W-8,H-8);x.fillStyle=fg;
 for(let i=0;i<5;i++){const cx=28+i*50,b=H-18;x.beginPath();x.ellipse(cx,b-82,9,11,0,0,7);x.fill();x.beginPath();x.moveTo(cx-14,b-68);x.lineTo(cx+14,b-68);x.lineTo(cx+(i%2?18:10),b);x.lineTo(cx-(i%2?10:18),b);x.closePath();x.fill();
  x.fillRect(cx+(i%2?12:-22),b-66,10,4);if(i===2){x.beginPath();x.moveTo(cx,b-110);x.lineTo(cx+30,b-90);x.lineTo(cx,b-96);x.fill()}}},{roughness:.8,uvs:1});

function mats(H){const S=H.stone,P=H.plaster;return{
 stone:tint(S,null,'stone'),stoneD:tint(S,0x8e8270,'stoneD'),trav:tint(P,0xfff8ea,'trav',{uvs:3.2}),travD:tint(P,0xeee2c8,'travD',{uvs:3.2}),
 marble:tint(P,0xf4efe4,'marble',{roughness:.5}),white:tint(P,0xfaf6ee,'white'),ochre:tint(P,0xf0cf86,'ochre'),plaster:tint(P,0xe8dcc4,'plaster'),
 slate:tint(H.slate,null,'slate'),copper:tint(H.slate,0x6fa58e,'copper',{roughness:.5,metalness:.2}),tiles:tint(H.redRoof,null,'tiles'),wood:tint(H.wood,null,'wood'),floor:tint(H.floor,null,'floor'),
 grass:tint(H.thatch,0x4f6a30,'grassmound'),gravel:tint(H.floor,0xd6c8a6,'gravel'),
 brick:brickTex('brick',[150,58,40],[60,30,20],true),brickPlain:brickTex('brickP',[140,62,44],[70,34,24],false),
 iron:tint(null,0x5e4b3c,'iron',{metalness:.6,roughness:.45}),ironD:tint(null,0x3a2e24,'ironD',{metalness:.6,roughness:.5}),
 gold:tint(null,0xd4a838,'gold',{metalness:.8,roughness:.28}),bronze:tint(null,0x4a7a62,'bronzeP',{metalness:.55,roughness:.45}),dark:tint(null,0x1c1814,'dk',{roughness:.9}),
 glass:tint(null,0x26343c,'glass',{metalness:.4,roughness:.15}),door:tint(H.wood,0x6a4428,'door'),hedge:tint(H.thatch,0x2d5226,'hedge'),
 water:tint(null,0x4f8aa0,'water',{roughness:.08,metalness:.3,transparent:true,opacity:.85}),spray:tint(null,0xe6f2fa,'spray',{transparent:true,opacity:.55,roughness:.2})}}

// ---------- Bau-Werkzeuge ----------
function kit(g){const add=(geo,m,x=0,y=0,z=0)=>{const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);g.add(o);return o};
 const K={add,
  box:(w,h,d,m,x,y,z,r=.05)=>add(r>0&&Math.min(w,h,d)>.28?new RoundedBoxGeometry(w,h,d,1,r):new THREE.BoxGeometry(w,h,d),m,x,y,z),   // weiche Kanten an tragenden Teilen, kleine Teile kantig (Leistung)
  cyl:(r1,r2,h,m,x,y,z,s=20)=>add(new THREE.CylinderGeometry(r1,r2,h,s),m,x,y,z),
  col:(x,z,hw,hd,top,bot=0)=>g.colliders.push([x,z,hw,hd,top,bot]),
  rod:(a,b,r,m,s=6)=>{const A=V(...a),B=V(...b),d=B.clone().sub(A),o=add(new THREE.CylinderGeometry(r,r,d.length(),s),m);o.position.copy(A).addScaledVector(d,.5);o.quaternion.setFromUnitVectors(V(0,1,0),d.normalize());return o},
  tube:(pts,r,m,closed=false,seg=8)=>add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p=>V(...p)),closed),Math.max(16,pts.length*5),r,seg,closed),m),
  lathe:(prof,m,x,y,z,seg=32)=>add(new THREE.LatheGeometry(prof.map(([a,b])=>new THREE.Vector2(a,b)),seg),m,x,y,z),
  // Satteldach als geschlossenes Prisma (First entlang x), mit Firstrolle
  gable:(len,d,h,m,x,y,z,o=.45,ry=0,ridge=null)=>{const s=new THREE.Shape();s.moveTo(-d/2-o,-.05);s.lineTo(d/2+o,-.05);s.lineTo(0,h);s.closePath();const geo=new THREE.ExtrudeGeometry(s,{depth:len+2*o,bevelEnabled:true,bevelSize:.04,bevelThickness:.04,bevelSegments:1});geo.translate(0,0,-(len+2*o)/2);geo.rotateY(PI/2);const r=add(geo,m,x,y,z);r.rotation.y=ry;
   if(ridge){const rg=add(new THREE.CylinderGeometry(.13,.13,len+2*o,10),ridge,x,y+h,z);rg.rotation.z=PI/2;rg.rotation.y=ry}return r},
  // Wand mit Rundbogen-Öffnungen (echte Löcher, gefaste Kanten)
  arched:(w,h,t,holes,m,x,y,z,ry=0,bev=.04)=>{const s=new THREE.Shape();s.moveTo(-w/2,0);s.lineTo(w/2,0);s.lineTo(w/2,h);s.lineTo(-w/2,h);s.closePath();
   for(const [hx,hw,sp,b=0]of holes){const p=new THREE.Path();p.moveTo(hx-hw/2,b);p.lineTo(hx+hw/2,b);p.lineTo(hx+hw/2,sp);p.absarc(hx,sp,hw/2,0,PI,false);p.lineTo(hx-hw/2,b);s.holes.push(p)}
   const geo=new THREE.ExtrudeGeometry(s,{depth:t,bevelEnabled:bev>0,bevelSize:bev,bevelThickness:bev,bevelSegments:1,curveSegments:10});geo.translate(0,0,-t/2);const o=add(geo,m,x,y,z);o.rotation.y=ry;return o},
  // Bogenlaibung/Archivolte: Halbring (Torus-Segment) als Rahmen um einen Bogen
  archi:(r,th,m,x,y,z,ry=0,dep=.2)=>{const o=add(new THREE.TorusGeometry(r,th,4,14,PI),m,x,y,z);o.rotation.y=ry;o.scale.z=dep/th;return o},
  rock:(w,h,d,m,x,y,z,seed=1,amp=.08)=>{const geo=new THREE.BoxGeometry(w,h,d,3,6,2),p=geo.attributes.position;for(let i=0;i<p.count;i++){const X=p.getX(i),Y=p.getY(i),Z=p.getZ(i),k=Math.sin(X*7.1+seed)*Math.cos(Y*5.3+seed*2)+Math.sin(Z*6.7+Y*3+seed);
   const top=Y>h/2-.01?.85:1,ss=1+amp*k*(Y<-h/2+.01?0:1);p.setXYZ(i,X*ss,Y+(Y>h/2-.01?amp*.6*Math.sin(X*4+Z*3+seed):0),Z*ss*top)}geo.computeVertexNormals();return add(geo,m,x,y,z)},
  statue:(m,x,y,z,s=1,arm=1)=>{const f=new THREE.Group();f.position.set(x,y,z);f.scale.setScalar(s);g.add(f);const k=kit(f);k.cyl(.22,.32,.9,m,0,.45,0,12);k.cyl(.2,.22,.65,m,0,1.22,0,12);k.add(new THREE.SphereGeometry(.15,14,10),m,0,1.7,0);
   const a=k.cyl(.06,.06,.6,m,arm*.3,1.4,0,8);a.rotation.z=arm*-2.4;k.cyl(.07,.06,.55,m,-arm*.26,1.2,0,8);k.box(.55,.12,.4,m,0,.06,0,.02);return f}};
 return K}

// ---------- Nachbearbeitung: weltbezogene UVs je Fläche und Zusammenführen nach Material ----------
function finalize(g){g.updateMatrixWorld(true);const inv=new THREE.Matrix4().copy(g.matrixWorld).invert(),groups=new Map(),keep=[];
 g.traverse(o=>{if(!o.isMesh)return;if(o.userData.keep){keep.push(o);return}let geo=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();
  geo.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv,o.matrixWorld));for(const k of Object.keys(geo.attributes))if(!['position','normal','uv'].includes(k))geo.deleteAttribute(k);
  if(!geo.attributes.normal)geo.computeVertexNormals();const p=geo.attributes.position,n=geo.attributes.normal,sc=o.material.userData.uvs||2.4,uv=new Float32Array(p.count*2);
  for(let i=0;i<p.count;i++){const ax=Math.abs(n.getX(i)),ay=Math.abs(n.getY(i)),az=Math.abs(n.getZ(i));let u,v;if(ay>=ax&&ay>=az){u=p.getX(i);v=p.getZ(i)}else if(ax>=az){u=p.getZ(i);v=p.getY(i)}else{u=p.getX(i);v=p.getY(i)}uv[i*2]=u/sc;uv[i*2+1]=v/sc}
  geo.setAttribute('uv',new THREE.BufferAttribute(uv,2));if(!groups.has(o.material))groups.set(o.material,[]);groups.get(o.material).push(geo)});
 const out=new THREE.Group();out.colliders=g.colliders;out.walkAreas=g.walkAreas;
 for(const [m,list]of groups){const merged=mergeGeometries(list,false);if(!merged)continue;const mesh=new THREE.Mesh(merged,m);mesh.castShadow=!m.transparent;mesh.receiveShadow=true;out.add(mesh)}
 for(const o of keep){o.removeFromParent();o.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv,o.matrixWorld));out.add(o)}
 return out}

// ================= Steinzeit: Großer Steinkreis (Stonehenge) =================
function stonehenge(g,M){const K=kit(g),sar=M.stoneD,blue=tint(M.stone,0x6f7884,'blue');
 K.cyl(10,10,.06,M.grass,0,.03,0,64);K.add(new THREE.TorusGeometry(9.5,.45,8,64),M.grass,0,.02,0).rotation.x=PI/2;   // Wall
 for(let i=0;i<10;i++)K.rock(1.6,.06,1.2,M.gravel,0,.06,8.6+i*1.2,i,.15);                                                // Prozessionsweg (Avenue)
 const N=30,R=7.2;let s=1;
 for(let i=0;i<N;i++){if(i===0)continue;const a=i/N*PI*2,x=Math.sin(a)*R,z=Math.cos(a)*R,h=4.1+((i*37)%5)*.05;const st=K.rock(1.1,h,.8,sar,x,h/2,z,s++);st.rotation.y=a;st.rotation.z=((i*13)%7-3)*.006;K.col(x,z,.55,.55,h)}
 for(let i=1;i<N-1;i++){const a0=i/N*PI*2,a1=(i+1)/N*PI*2,am=(a0+a1)/2,ch=2*R*Math.sin(PI/N);const L=K.rock(ch+.85,.6,.85,sar,Math.sin(am)*R*Math.cos(PI/N),4.45,Math.cos(am)*R*Math.cos(PI/N),s++,.05);L.rotation.y=am}
 for(let i=0;i<20;i++){const a=i/20*PI*2;if(Math.cos(a)>.93)continue;const b=K.rock(.5,1.6+(i%3)*.25,.38,blue,Math.sin(a)*5.4,.85,Math.cos(a)*5.4,s++,.12);b.rotation.y=a}
 for(const [k,h]of[[-1.0,5.3],[-.5,6.0],[0,7.0],[.5,6.0],[1.0,5.3]]){const a=PI+k,r=3.4,x=Math.sin(a)*r,z=Math.cos(a)*r;for(const o of[-.62,.62]){const st=K.rock(1.05,h,.9,sar,x+Math.cos(a)*o,h/2,z-Math.sin(a)*o,s++);st.rotation.y=a}
  const t=K.rock(2.4,.7,.95,sar,x,h+.33,z,s++,.05);t.rotation.y=a;K.col(x,z,1.3,.6,h+.7)}
 for(let i=0;i<9;i++){const a=PI*.45+i/8*PI*1.1,b=K.rock(.45,1.4,.35,blue,Math.sin(a)*2.2,.7,-.3+Math.cos(a)*2.2,s++,.1);b.rotation.y=a}
 K.rock(2.4,.4,1,blue,0,.2,-.6,s++,.05);const heel=K.rock(1.3,3.5,1.1,sar,0,1.7,11.4,s++,.12);heel.rotation.z=.13;
 for(const [x,z]of[[-1.4,9.4],[1.4,9.4],[-4,10.5],[4.5,-9.5]]){const r=K.rock(.4+rnd()*.3,.5,.4,sar,x,.2,z,s++,.15);r.rotation.z=PI/2.3}   // umgestürzte Steine
 // Feuerstelle mit Opfergaben
 for(let i=0;i<8;i++){const a=i/8*PI*2;K.rock(.25,.2,.25,M.stoneD,Math.sin(a)*.5,.1,3+Math.cos(a)*.5,s++,.2)}K.cyl(.38,.38,.05,M.dark,0,.04,3,12)}

// ================= Hallstatt: Fürstengrabhügel (Glauberg/Hochdorf) =================
function burialMound(g,M){const K=kit(g),earth=M.grass,stone=M.stoneD,statue=tint(M.stone,0xc8b996,'sandstone'),wood=M.wood;
 const m=new THREE.SphereGeometry(7,48,18,0,PI*2,0,PI/2);m.scale(1,.55,1);K.add(m,earth,0,0,-1.5);K.col(0,-1.5,5.2,5.2,3.8);
 K.add(new THREE.TorusGeometry(8.4,.35,6,64),M.grass,0,-.1,-1.5).rotation.x=PI/2;                                           // Kreisgraben-Wall
 for(let i=0;i<56;i++){const a=i/56*PI*2;K.rock(.7,.55,.5,stone,Math.sin(a)*7.1,.27,-1.5+Math.cos(a)*7.1,i,.15).rotation.y=a}
 // Grabkammer-Eingang: Trockenmauer, Deckstein, Holztür
 for(const sx of[-1,1])for(let r=0;r<4;r++)K.rock(.6,.42,1.9,stone,sx*.95,.21+r*.42,4.6,r+sx*7,.06);K.rock(2.6,.5,2.2,stone,0,1.93,4.6,99,.05);K.box(1.2,1.6,.12,M.door,0,.8,3.75);
 for(let i=0;i<5;i++)K.box(.08,1.5,.14,M.ironD,-.48+i*.24,.8,3.82,0);
 // Prozessionsweg mit Pfostenreihen und Graben
 for(const sx of[-1,1])for(let i=0;i<7;i++){K.cyl(.11,.13,1.6,wood,sx*1.8,.8,6.4+i*.8,8);K.add(new THREE.ConeGeometry(.13,.25,8),wood,sx*1.8,1.72,6.4+i*.8)}
 for(let i=0;i<8;i++)K.rock(2.4,.05,.7,M.gravel,0,.04,6.3+i*.75,i,.1);
 // Kriegerstatue mit Blattkrone, Schild, Halsring
 K.rock(1.3,.6,1.3,stone,0,.3,9.6,5,.05);const f=K.statue(statue,0,.6,9.6,1.35,0);const kf=kit(f);for(const sx of[-1,1])kf.add(new THREE.SphereGeometry(.17,12,8),statue,sx*.15,1.92,0).scale.set(.7,1.3,.25);
 kf.add(new THREE.TorusGeometry(.14,.03,6,16),M.gold,0,1.55,0).rotation.x=PI/2;kf.cyl(.32,.32,.06,statue,-.35,1.15,.18,16).rotation.x=PI/2;K.col(0,9.6,.7,.7,3.2);
 // Opferfeuer in Bronzeschalen
 for(const sx of[-1,1]){K.cyl(.08,.1,1,M.bronze,sx*3,.5,8,8);K.lathe([[0,0],[.35,.05],[.45,.25],[.42,.28]],M.bronze,sx*3,1,8,16);const fl=K.add(new THREE.ConeGeometry(.22,.5,8),tint(null,0xff9a3a,'flame',{emissive:0xff7a20,emissiveIntensity:.8}),sx*3,1.5,8);fl.userData.keep=1}}

// ================= Römer: Kolosseum =================
function colosseum(g,M){const K=kit(g),tr=M.trav,trD=M.travD,mar=M.marble,A=9.3,B=7.6,LH=2.45,N=32,LV=3;
 const P=a=>[Math.sin(a)*A,Math.cos(a)*B];
 for(let lv=0;lv<LV;lv++){const y0=.3+lv*LH;
  for(let i=0;i<N;i++){const a0=i/N*PI*2,a1=(i+1)/N*PI*2,[x0,z0]=P(a0),[x1,z1]=P(a1),cx=(x0+x1)/2,cz=(z0+z1)/2,len=Math.hypot(x1-x0,z1-z0);
   let nx=z1-z0,nz=-(x1-x0);if(nx*cx+nz*cz<0){nx=-nx;nz=-nz}const ry=Math.atan2(nx,nz),ow=len*.56,sp=LH*.56,ox=Math.sin(ry),oz=Math.cos(ry);
   K.arched(len+.1,LH,.9,[[0,ow,sp,lv?.5:0]],tr,cx,y0,cz,ry);
   K.archi(ow/2+.09,.08,trD,cx+ox*.47,y0+sp,cz+oz*.47,ry,.1);K.box(.22,.32,.16,trD,cx+ox*.5,y0+sp+ow/2+.08,cz+oz*.5,.03).rotation.y=ry;         // Archivolte, Schlussstein
   if(lv){K.box(ow,.5,.12,trD,cx-ox*.36,y0+.25,cz-oz*.36,.03).rotation.y=ry;if(i%2===0)K.statue(mar,cx-ox*.2,y0+.5,cz-oz*.2,.75)}             // Brüstung, Statuen in den Bögen
   // Halbsäule über der Fuge: Basis, Schaft, Kapitell je Ordnung (toskanisch, ionisch, korinthisch)
   const px=x0*1.03,pz=z0*1.03;K.box(.6,.2,.6,trD,px,y0+.1,pz,.03);K.cyl(.21,.23,LH-.6,tr,px,y0+LH/2-.05,pz,14);
   if(lv===0)K.box(.55,.18,.55,trD,px,y0+LH-.45,pz,.03);else if(lv===1){const v=K.add(new THREE.TorusGeometry(.14,.06,6,12),trD,px,y0+LH-.42,pz);v.rotation.y=ry}else K.lathe([[.2,0],[.32,.22],[.36,.3],[0,.3]],trD,px,y0+LH-.6,pz,12)}
  const cor=new THREE.CylinderGeometry(1,1,.3,96,1,true);cor.scale(A+.38,1,B+.38);K.add(cor,trD,0,y0+LH-.12,0);const cor2=new THREE.CylinderGeometry(1,1,.12,96,1,true);cor2.scale(A+.48,1,B+.48);K.add(cor2,trD,0,y0+LH+.02,0)}
 // Attika: geschlossene Wand mit Pilastern, Fenstern, Konsolen und Velarium-Masten
 const yA=.3+LV*LH;for(const [s,m]of[[0,tr],[-.9,trD]]){const at=new THREE.CylinderGeometry(1,1,2,96,1,true);at.scale(A+s,1,B+s);K.add(at,m,0,yA+1,0)}
 const ring=new THREE.RingGeometry(1,1.11,96);ring.rotateX(-PI/2);ring.scale(A-.9,1,B-.9);K.add(ring,trD,0,yA+2,0);
 for(let i=0;i<N;i++){const a=i/N*PI*2,[x,z]=P(a),ry=Math.atan2(x/A/A,z/B/B);K.box(.5,1.9,.18,trD,x*1.01,yA+.95,z*1.01,.03).rotation.y=ry;
  if(i%2){const am=(i+.5)/N*PI*2,[wx,wz]=P(am),wr=Math.atan2(wx/A/A,wz/B/B);K.arched(.95,1.05,.22,[[0,.5,.75,.18]],trD,wx*1.012,yA+.5,wz*1.012,wr);K.box(.5,.55,.05,M.dark,wx*.998,yA+.95,wz*.998,0).rotation.y=wr}   // Attikafenster mit Rahmen
  K.box(.25,.25,.4,trD,x*1.02,yA+1.85,z*1.02,.03).rotation.y=ry;if(i%2===0)K.box(.16,.5,.16,trD,x*.995,yA+2.25,z*.995,0)}   // Konsolen der Sonnensegel-Masten
 // Zuschauerränge (gestufter Ring), Rangmauern, Mundlöcher (Vomitorien), Podium mit Marmor, Arena mit Hypogäum-Gittern
 const prof=[[.42,0],[.42,1.6]];for(let k=0;k<11;k++){const r=.45+k*.048,y=1.6+k*.58;prof.push([r,y],[r+.048,y]);if(k<10)prof.push([r+.048,y+.58])}prof.push([.9,8.0],[.9,0]);
 {const cor=new THREE.CylinderGeometry(1,1,7.7,96,1,true);cor.scale(A*.915,1,B*.915);K.add(cor,tint(null,0x2e2620,'corridor',{side:THREE.DoubleSide,roughness:1}),0,4.15,0);   // dunkle Umgänge hinter den Arkaden
  for(let lv=1;lv<LV;lv++){const fl=new THREE.RingGeometry(.915,.99,96);fl.rotateX(-PI/2);fl.scale(A,1,B);K.add(fl,trD,0,.3+lv*LH+.02,0)}}
 const sea=new THREE.LatheGeometry(prof.map(([r,y])=>new THREE.Vector2(r,y)),96);sea.scale(A,1,B);K.add(sea,tint(tr,null,'seatDS',{side:THREE.DoubleSide}),0,0,0);
 for(const k of[3,7]){const w=new THREE.CylinderGeometry(1,1,.7,96,1,true);const r=.45+k*.048;w.scale(A*r,1,B*r);K.add(w,mar,0,1.6+k*.58+.35,0)}
 for(let i=0;i<16;i++){const a=(i+.5)/16*PI*2;for(const k of[2,6]){const r=.47+k*.048;const v=K.box(.7,.55,.3,M.dark,Math.sin(a)*A*r,1.6+k*.58+.3,Math.cos(a)*B*r,0);v.rotation.y=Math.atan2(Math.sin(a)/A,Math.cos(a)/B)}}
 const pod=new THREE.CylinderGeometry(1,1,1.6,96,1,true);pod.scale(A*.425,1,B*.425);K.add(pod,mar,0,.8,0);
 const ar=new THREE.CircleGeometry(1,64);ar.rotateX(-PI/2);ar.scale(A*.42,1,B*.42);K.add(ar,tint(M.floor,0xd8c090,'sand'),0,.06,0);
 for(const x of[-2,0,2])for(let k=0;k<4;k++)K.box(.06,.04,2,M.wood,x+(k-1.5)*.18,.08,0,0);
 // Haupteingang (+z) mit Marmorrahmen und Inschrift
 K.box(3.2,.5,.3,mar,0,LH+.55,B+.5,.04);K.box(3.0,.4,.06,textMat('colIns','IMP·CAESAR·VESPASIANVS','#e6dcc4','#5a4a30',512,64),0,LH+.55,B+.66,0);
 for(let i=0;i<N;i++){const a=(i+.5)/N*PI*2,[x,z]=P(a);if(Math.cos(a)>.93)continue;K.col(x,z,.9,.9,9)}}

// ================= Frühmittelalter: Pfalzkapelle (Aachen) =================
function palaceChapel(g,M){const K=kit(g),wall=M.plaster,st=M.stone,stD=M.stoneD,roof=M.slate,lead=M.copper,red=tint(M.stone,0xa0503a,'redstone');
 // Sechzehneck-Umgang
 K.cyl(7.2,7.4,.6,stD,0,.3,-1,16);K.add(new THREE.CylinderGeometry(7.15,7.15,5,16),wall,0,3.1,-1);K.col(0,-1,6.4,6.4,6);
 K.add(new THREE.CylinderGeometry(4.75,7.65,1.7,16),roof,0,6.45,-1);K.cyl(7.35,7.35,.3,st,0,5.55,-1,16);
 for(let i=0;i<16;i++){const a=i/16*PI*2+PI/16,x=Math.sin(a)*7.08,z=-1+Math.cos(a)*7.08;K.box(.5,5,.25,st,Math.sin(a-PI/16)*7.2,3.1,-1+Math.cos(a-PI/16)*7.2,.04).rotation.y=a-PI/16;
  const w=K.box(.9,1.7,.3,M.glass,x,3.2,z,0);w.rotation.y=a;for(let v=0;v<7;v++){const b=v/6*PI,vb=K.box(.2,.18,.32,v%2?red:st,x+Math.cos(a)*Math.cos(b)*.6,4.05+Math.sin(b)*.6,z-Math.sin(a)*Math.cos(b)*.6,.02);vb.rotation.y=a;vb.rotation.z=-b+PI/2}}   // rot-weiße Bogensteine
 // Achteck-Tambour mit Fenstern, Gesims, Faltkuppel mit Rippen
 K.add(new THREE.CylinderGeometry(4.6,4.6,4.8,8),wall,0,9.6,-1);K.cyl(4.85,4.85,.35,st,0,12.1,-1,8);K.cyl(4.7,4.7,.3,st,0,7.3,-1,8);
 for(let i=0;i<8;i++){const a=i/8*PI*2+PI/8;K.arched(1.4,2.4,.3,[[0,.8,1.6,.2]],st,Math.sin(a)*4.55,8.3,-1+Math.cos(a)*4.55,a);K.box(.8,2,.1,M.glass,Math.sin(a)*4.45,9.3,-1+Math.cos(a)*4.45,0).rotation.y=a;
  K.box(.3,4.8,.3,st,Math.sin(a-PI/8)*4.7,9.6,-1+Math.cos(a-PI/8)*4.7,.04)}
 const d=new THREE.SphereGeometry(4.7,8,12,0,PI*2,0,PI/2);d.rotateY(PI/8);d.scale(1,.82,1);K.add(d,lead,0,12.25,-1);
 for(let i=0;i<8;i++){const a=i/8*PI*2,pts=[];for(let k=0;k<=8;k++){const t=k/8*PI/2;pts.push([Math.sin(a)*Math.cos(t)*4.75*Math.cos(PI/8),12.25+Math.sin(t)*4.7*.82,-1+Math.cos(a)*Math.cos(t)*4.75*Math.cos(PI/8)])}K.tube(pts,.09,st)}
 K.cyl(.45,.55,.8,st,0,16.4,-1,8);K.add(new THREE.SphereGeometry(.35,12,10),M.gold,0,17.1,-1);K.cyl(.07,.07,1.4,M.gold,0,17.9,-1,6);K.box(.7,.1,.1,M.gold,0,18.2,-1,0);
 // Westwerk mit Treppentürmen, Nische mit Thron-Fenster, Bronzetüren
 K.box(6.2,12,3.4,wall,0,6,7.1,.06);K.box(6.6,.6,3.8,st,0,.3,7.1);K.box(6.5,.45,3.7,st,0,12.2,7.1);K.gable(6,3.4,1.8,roof,0,12.4,7.1,.3,PI/2,lead);
 const nich=K.arched(4.4,9.5,.4,[[0,3,7.5,.6]],st,0,0,8.95);K.box(3,8.4,.1,tint(M.plaster,0xc8bca0,'niche'),0,4.8,8.6,0);K.box(1.6,2.4,.1,M.glass,0,8.6,8.7,0);
 K.box(2,3.2,.14,M.bronze,0,2.2,8.75,.02);for(let r=0;r<3;r++)for(let c=0;c<2;c++)K.box(.7,.8,.05,tint(null,0x6a9a7e,'bronzeL',{metalness:.6,roughness:.4}),-.45+c*.9,1.2+r*1,8.85,.02);
 for(const sx of[-1,1]){K.cyl(1.3,1.35,14,wall,sx*3.35,7,7.1,20);K.cyl(1.45,1.45,.35,st,sx*3.35,14,7.1,20);K.add(new THREE.ConeGeometry(1.6,3.4,20),roof,sx*3.35,15.9,7.1);K.add(new THREE.SphereGeometry(.15,10,8),M.gold,sx*3.35,17.7,7.1);
  for(let y=2.5;y<13;y+=2.6)K.arched(.6,1,.2,[[0,.3,.6]],st,sx*3.35,y,8.4)}
 K.col(0,7.1,3.1,1.7,12);for(const sx of[-1,1])K.col(sx*3.35,7.1,1.35,1.35,14)}

// ================= Hochmittelalter: Kaiserpfalz – Palas mit Rundbogenfries, Freitreppe, Kapelle, Bergfried =================
function imperialPalace(g,M){const K=kit(g),st=M.stone,stD=M.stoneD,roof=M.slate,dark=M.dark;
 // Palas: Sockel, Mauerwerk, Eckquader, Gesimse, Lisenen mit Rundbogenfries
 K.box(17.6,.9,7.6,stD,0,.45,-3,.06);K.box(17,7.4,7,st,0,4.6,-3,.08);K.col(0,-3,8.5,3.5,8.3);K.box(17.3,.3,7.3,stD,0,4.1,-3,.05);
 for(const sx of[-1,1])for(const sz of[-1,1])for(let y=1.2;y<8.2;y+=.7)K.box(y%1.4<.7?1:.7,.55,y%1.4<.7?.7:1,stD,sx*8.4,y,-3+sz*3.4,.05);
 for(const sz of[-1,1]){for(let i=0;i<=8;i++)K.box(.45,7.1,.18,stD,-8+i*2,4.75,-3+sz*3.55,.04);
  for(let i=0;i<32;i++){const x=-7.75+i*.5;K.archi(.2,.05,stD,x,7.75,-3+sz*3.56,0,.12);K.box(.08,.25,.12,stD,x-.25,7.6,-3+sz*3.56,0)}K.box(17.4,.3,.35,stD,0,8.15,-3+sz*3.5,.04)}
 K.gable(17,7,3.3,roof,0,8.3,-3,.5,0,stD);
 for(const sx of[-1,1]){const s=new THREE.Shape();s.moveTo(-3.6,0);s.lineTo(3.6,0);s.lineTo(0,3.4);s.closePath();const gg=new THREE.ExtrudeGeometry(s,{depth:.45,bevelEnabled:true,bevelSize:.04,bevelThickness:.04,bevelSegments:1});gg.rotateY(PI/2);K.add(gg,st,sx*8.5-(sx>0?.45:0),8.3,-3);
  K.archi(.5,.08,stD,sx*8.55,9.3,-3,PI/2,.1);K.box(.12,.8,.6,M.glass,sx*8.56,9.1,-3,0)}
 for(const x of[-5,3])K.box(.8,2.4,.8,stD,x,11.4,-3,.05);                                                                     // Kamine
 // Obergeschoss: Biforien mit Säule, Kapitell, Entlastungsbogen
 for(let i=0;i<6;i++){const x=-6.25+i*2.5;K.arched(2.3,2.6,.4,[[-.45,.68,1.85],[.45,.68,1.85]],st,x,4.3,.66);K.box(1.9,2.2,.08,M.glass,x,5.35,.42,0);
  K.cyl(.09,.1,1.75,stD,x,5.18,.66,10);K.box(.32,.2,.32,stD,x,6.12,.66,.03);K.archi(1.05,.08,stD,x,6.15,.86,0,.12);K.box(2.3,.16,.32,stD,x,4.35,.86,.03)}
 for(let i=0;i<6;i++){const x=-6.25+i*2.5;K.arched(.9,1.4,.15,[[0,.45,.9,.1]],stD,x,1.5,.58);K.box(.45,1.1,.06,M.glass,x,2.05,.5,0)}
 // Banner mit Reichsadler
 const eagle=canvasMat('eagle',128,256,(x,W,H)=>{x.fillStyle='#d8b030';x.fillRect(0,0,W,H);x.fillStyle='#1a1a1a';x.beginPath();x.ellipse(64,110,18,34,0,0,7);x.fill();x.beginPath();x.moveTo(64,90);x.lineTo(8,70);x.lineTo(20,120);x.lineTo(64,115);x.lineTo(108,120);x.lineTo(120,70);x.closePath();x.fill();x.beginPath();x.arc(64,66,12,0,7);x.fill();x.fillRect(48,140,10,40);x.fillRect(70,140,10,40);
  for(let i=0;i<6;i++){x.beginPath();x.moveTo(i*21,H);x.lineTo(i*21+10,H-24);x.lineTo(i*21+21,H);x.fillStyle='#b01e1e';x.fill()}},{roughness:.95,side:THREE.DoubleSide,uvs:1});
 for(const x of[-3.75,3.75]){const b=K.box(1,2.2,.03,eagle,x,5.5,.75,0);b.userData.keep=1}
 // Freitreppe mit Wangenmauern, Stufenportal mit drei Archivolten
 for(let i=0;i<9;i++)K.box(3.6,.45,.7,stD,0,.22+i*.45,4.7-i*.6,.04);for(const sx of[-1,1]){const s=new THREE.Shape();s.moveTo(0,0);s.lineTo(4.8,0);s.lineTo(4.8,4.75);s.lineTo(0,.5);s.closePath();const sg=new THREE.ExtrudeGeometry(s,{depth:.35,bevelEnabled:true,bevelSize:.03,bevelThickness:.03,bevelSegments:1});sg.rotateY(PI/2);sg.translate(sx>0?1.8:-2.15,0,5.4);K.add(sg,st);K.box(.45,.18,.45,stD,sx*1.97,.6,5.3,.03)}   // Treppenwangen
 K.box(3.6,.4,1.1,stD,0,4.05,.95,.04);K.arched(3.4,3.8,.5,[[0,1.6,2.5]],st,0,4.25,.7);for(const [r,dz]of[[.95,.95],[1.15,1.0],[1.35,1.05]])K.archi(r,.1,stD,0,6.75,dz,0,.14);
 for(const sx of[-1,1])for(const dx of[.95,1.15,1.35])K.cyl(.09,.09,2.5,stD,sx*dx,5.5,.98,10);K.box(1.6,2.9,.12,M.door,0,5.7,.5,.02);
 for(const sx of[-1,1]){K.box(.1,.6,.1,M.ironD,sx*2.2,6.5,.85,0);const fl=K.add(new THREE.ConeGeometry(.12,.35,8),tint(null,0xffa040,'torch',{emissive:0xff8020,emissiveIntensity:.9}),sx*2.2,7,.9);fl.userData.keep=1}
 // Kapelle (Apsis) an der Ostseite
 K.cyl(2.2,2.2,6.5,st,9.4,3.25,-3,20).scale.z=1;K.add(new THREE.SphereGeometry(2.3,20,10,0,PI*2,0,PI/2),M.tiles,9.4,6.5,-3);K.col(9.4,-3,2.2,2.2,6.5);for(let i=0;i<3;i++){const a=-PI/3+i*PI/3+PI/2;K.box(.4,1.4,.1,M.glass,9.4+Math.sin(a)*2.22,4,-3+Math.cos(a)*2.22,0).rotation.y=a}
 // Bergfried mit Buckelquadern, Konsolenfries, Zinnen, Schlitzfenstern
 K.box(5.6,1,5.6,stD,-6,.5,5.5,.06);K.box(5,20,5,st,-6,10.5,5.5,.08);K.col(-6,5.5,2.5,2.5,21);for(let y=2;y<20;y+=5)K.box(5.15,.25,5.15,stD,-6,y,5.5,.04);
 for(const sx of[-1,1])for(const sz of[-1,1])for(let y=1.4;y<20;y+=.8)K.box(y%1.6<.8?.9:.6,.65,y%1.6<.8?.6:.9,stD,-6+sx*2.4,y,5.5+sz*2.4,.06);
 for(let i=0;i<14;i++){const t=i/14;for(const [dx,dz]of[[-2.5+t*5,-2.62],[-2.5+t*5,2.62],[-2.62,-2.5+t*5],[2.62,-2.5+t*5]])K.box(.22,.45,.22,stD,-6+dx,20.6,5.5+dz,.03)}
 K.box(5.8,.5,5.8,st,-6,21.05,5.5,.05);for(let i=0;i<5;i++)for(const [dx,dz,rw,rd]of[[-2.6+i*1.3,-2.6,.7,.4],[-2.6+i*1.3,2.6,.7,.4],[-2.6,-2.6+i*1.3,.4,.7],[2.6,-2.6+i*1.3,.4,.7]])K.box(rw,1,rd,st,-6+dx,21.8,5.5+dz,.05);
 for(let y=4;y<19;y+=3.5){K.box(.18,1.1,.1,dark,-6,y,8.04,0);K.box(.18,1.1,.1,dark,-3.46,y,5.5,0)}
 K.cyl(.06,.06,4.5,M.wood,-6,23.6,5.5,6);const fb=K.box(1.8,1.1,.03,eagle,-5.05,25,5.5,0);fb.userData.keep=1}

// ================= Spätmittelalter: Stadttor mit Doppeltürmen (Holstentor) =================
function cityGate(g,M){const K=kit(g),br=M.brick,brP=M.brickPlain,roof=M.slate,terra=tint(M.redRoof||M.tiles,0xb0603a,'terra'),glaze=tint(null,0x141414,'glaze',{roughness:.25,metalness:.1});
 const ins=textMat('holsten','CONCORDIA DOMI FORIS PAX','#1a1a1a','#d8b040',1024,80);
 K.arched(7.2,10,6,[[0,3.6,3.3]],br,0,0,0,0,.05);K.col(-2.9,0,.7,3,10);K.col(2.9,0,.7,3,10);K.col(0,0,3.6,3,10,5.2);
 for(const sz of[-1,1]){const zz=sz*3.08;for(const r of[2.0,2.2,2.4])K.archi(r,.1,glaze,0,3.3,zz,0,.1);K.box(4.6,.6,.08,ins,0,9.1,zz,0);
  for(let i=0;i<3;i++){const x=-2+i*2;K.arched(1.1,1.8,.14,[[0,.55,1.25,.2]],brP,x,5.7,zz);K.box(.55,1.4,.06,M.glass,x,6.55,zz-sz*.04,0);K.box(1.2,.35,.1,terra,x,7.8,zz+sz*.02,.02)}
  for(let y=1.4;y<10;y+=1.6)K.box(7.25,.16,.05,glaze,0,y,sz*3.04,0)}
 K.box(3.4,.08,6.2,M.gravel,0,.04,0,0);for(let i=0;i<9;i++)K.box(.1,.5,.1,M.ironD,-1.6+i*.4,6.05,0,0);                                           // Fallgitter-Zähne in der Durchfahrt
 K.gable(7.2,6,4.4,roof,0,10,0,.35,PI/2,M.ironD);
 for(const sz of[-1,1]){const s=new THREE.Shape();s.moveTo(-3.6,0);s.lineTo(3.6,0);for(let k=0;k<4;k++){s.lineTo(3.6-k*.9,1+k*.85);s.lineTo(3.6-(k+1)*.9,1+k*.85)}s.lineTo(0,4.8);s.lineTo(-3.6,0);
  const gg=new THREE.ExtrudeGeometry(s,{depth:.45,bevelEnabled:true,bevelSize:.03,bevelThickness:.03,bevelSegments:1});gg.translate(0,0,sz>0?2.95:-3.4);K.add(gg,br,0,10,0);for(let k=0;k<4;k++)for(const sx of[-1,1])K.box(.3,.8,.3,brP,sx*(3.6-k*.9-.45),10+1+k*.85+.3,sz*3.2,.03)}
 for(const sx of[-1,1]){const tx=sx*5.3;K.cyl(3.05,3.25,14,br,tx,7,0,32);K.col(tx,0,2.9,2.9,14);K.cyl(3.35,3.35,.4,brP,tx,14.1,0,32);K.cyl(3.25,3.25,.3,glaze,tx,10,0,32);K.cyl(3.25,3.25,.3,glaze,tx,4.8,0,32);
  const cone=K.add(new THREE.ConeGeometry(3.5,6.8,32),roof,tx,17.6,0);K.add(new THREE.SphereGeometry(.22,12,10),M.gold,tx,21.1,0);K.cyl(.05,.05,.8,M.ironD,tx,21.5,0,6);
  for(const a of[-.9,-.3,.3,.9])for(let y=2.6;y<13;y+=2.6){const w=K.arched(.7,1.2,.2,[[0,.36,.75,.15]],brP,tx+Math.sin(a)*3.12,y,Math.cos(a)*3.12,a);K.box(.36,.85,.05,M.dark,tx+Math.sin(a)*3.06,y+.55,Math.cos(a)*3.06,0).rotation.y=a}
  for(const a of[-.5,.5]){const dm=K.box(.8,.9,.9,roof,tx+Math.sin(a)*2.6,15.3,Math.cos(a)*2.6,.04);dm.rotation.y=a;K.box(.4,.5,.05,M.dark,tx+Math.sin(a)*3.06,15.3,Math.cos(a)*3.06,0).rotation.y=a}}
 for(let i=0;i<10;i++)K.box(4,.06,.9,M.gravel,0,.03,4+i*.9,0)}

// ================= Renaissance: Kuppeldom (Florenz) mit Campanile =================
function domeCathedral(g,M){const K=kit(g),inlay=marbleInlay(),mar=M.marble,green=tint(null,0x3e5e46,'verde',{roughness:.4}),red=M.tiles,rib=M.white,dk=M.dark;
 // Langhaus mit Inkrustation, Pilastern, Rundfenstern, Satteldach
 K.box(8,9,9,inlay,0,4.5,4.5,.06);K.box(8.3,.5,9.3,green,0,.25,4.5,.04);K.box(8.4,.4,9.4,mar,0,9.1,4.5,.04);K.col(0,4.5,4,4.5,9);K.gable(9,8,2.6,red,0,9.3,4.5,.35,PI/2,mar);
 for(const sx of[-1,1])for(let i=0;i<5;i++){const z=.6+i*2;K.box(.35,9,.4,mar,sx*4.05,4.5,z,.04);if(i<4){K.add(new THREE.CircleGeometry(.5,20),dk,sx*4.07,6.6,z+1).rotation.y=sx*PI/2;K.add(new THREE.TorusGeometry(.56,.08,6,20),mar,sx*4.1,6.6,z+1).rotation.y=PI/2}}
 // Fassade: drei Portale mit Giebeln, Rosette, Statuennischen, Dreiecksgiebel
 K.box(8.6,9.6,.5,inlay,0,4.8,9.2,.05);const s=new THREE.Shape();s.moveTo(-4.3,0);s.lineTo(4.3,0);s.lineTo(0,2.9);s.closePath();const fg=new THREE.ExtrudeGeometry(s,{depth:.5,bevelEnabled:true,bevelSize:.04,bevelThickness:.04,bevelSegments:1});fg.translate(0,9.6,8.95);K.add(fg,mar);
 K.add(new THREE.CircleGeometry(1.2,32),M.glass,0,6.8,9.47);K.add(new THREE.TorusGeometry(1.25,.16,8,32),mar,0,6.8,9.47);for(let i=0;i<8;i++){const a=i/8*PI*2;K.rod([Math.sin(a)*.2,6.8+Math.cos(a)*.2,9.48],[Math.sin(a)*1.15,6.8+Math.cos(a)*1.15,9.48],.04,mar)}
 for(const [x,w]of[[0,1.8],[-2.9,1.1],[2.9,1.1]]){K.arched(w+.9,w*1.9+.5,.3,[[0,w,w*1.25]],mar,x,0,9.55);K.box(w,w*1.7,.08,M.door,x,w*.85,9.42,0);const t=new THREE.Shape();t.moveTo(-w/2-.5,0);t.lineTo(w/2+.5,0);t.lineTo(0,.8);t.closePath();const tg=new THREE.ExtrudeGeometry(t,{depth:.3,bevelEnabled:false});tg.translate(x,w*1.9+.5,9.45);K.add(tg,mar)}
 for(const x of[-1.7,1.7]){K.arched(.8,1.6,.2,[[0,.5,.95,.15]],mar,x,4.3,9.55);K.statue(rib,x,4.45,9.4,.6)}
 // Vierung: Oktogon mit Exedren, Tambour mit Ochsenaugen, Doppelschalenkuppel mit Rippen, Laterne
 K.add(new THREE.CylinderGeometry(6,6,8.5,8),inlay,0,4.25,-4);K.col(0,-4,5.6,5.6,8.5);K.cyl(6.35,6.35,.45,green,0,8.6,-4,8);
 for(let i=0;i<4;i++){const a=PI/4+i*PI/2,x=Math.sin(a)*6.3,z=-4+Math.cos(a)*6.3;if(Math.cos(a)>.5)continue;K.cyl(2,2,4.5,inlay,x,2.25,z,16);K.add(new THREE.SphereGeometry(2.05,16,8,0,PI*2,0,PI/2),red,x,4.5,z);K.statue(rib,x,6.6,z,.7)}
 K.add(new THREE.CylinderGeometry(4.65,4.65,3.4,8),inlay,0,10.5,-4);K.cyl(4.9,4.9,.35,mar,0,12.3,-4,8);
 for(let i=0;i<8;i++){const a=i/8*PI*2+PI/8,x=Math.sin(a)*4.35,z=-4+Math.cos(a)*4.35;K.add(new THREE.CircleGeometry(.6,20),dk,x,10.5,z).rotation.y=a;const r=K.add(new THREE.TorusGeometry(.66,.12,8,20),mar,x,10.5,z);r.rotation.y=a}
 const prof=[[4.6,0],[4.5,1.8],[4,3.6],[3,5.2],[1.6,6.4],[.75,6.85],[0,6.9]];const d=new THREE.LatheGeometry(prof.map(p=>new THREE.Vector2(p[0],p[1])),8);d.rotateY(PI/8);d.translate(0,12.45,-4);K.add(d,red);
 for(let i=0;i<8;i++){const a=i/8*PI*2,c=Math.cos(PI/8);K.tube(prof.slice(0,6).map(([r,y])=>[Math.sin(a)*r*c*1.01,12.45+y,-4+Math.cos(a)*r*c*1.01]),.15,rib)}
 for(let k=1;k<3;k++){const y=12.45+k*1.8,r=prof[k][0]*Math.cos(PI/8)*1.005;K.add(new THREE.TorusGeometry(r,.05,4,8),rib,0,y,-4).rotation.x=PI/2}
 K.cyl(.85,.95,.3,mar,0,19.4,-4,8);for(let i=0;i<8;i++){const a=i/8*PI*2;K.cyl(.07,.07,1.3,mar,Math.sin(a)*.7,20.2,-4+Math.cos(a)*.7,8)}K.cyl(.85,.85,.25,mar,0,20.95,-4,8);K.add(new THREE.ConeGeometry(.85,1.5,8),mar,0,21.8,-4);K.add(new THREE.SphereGeometry(.32,14,10),M.gold,0,22.8,-4);K.box(.06,.9,.06,M.gold,0,23.5,-4,0);
 // Campanile
 const cx=6.3,cz=7.5;K.box(3.2,22,3.2,inlay,cx,11,cz,.05);K.col(cx,cz,1.6,1.6,22);for(let y=5;y<22;y+=5.4)K.box(3.4,.3,3.4,mar,cx,y,cz,.04);
 for(let y=6.5;y<21;y+=5.4)for(const [dx,dz,ry]of[[0,1.62,0],[1.62,0,PI/2],[0,-1.62,PI],[-1.62,0,-PI/2]]){K.arched(2.2,3.2,.15,[[-.4,.55,2],[.4,.55,2]],mar,cx+dx,y,cz+dz,ry);K.box(1.6,2.8,.05,dk,cx+dx*.97,y+1.4,cz+dz*.97,0).rotation.y=ry}
 K.box(3.6,.5,3.6,mar,cx,22.25,cz,.05)}

// ================= Barock: Lustschloss mit Orangerie, Kuppelpavillon, Broderie-Parterre und Fontänen =================
function pleasurePalace(g,M){const K=kit(g),oc=M.ochre,wh=M.white,roof=M.slate,cop=M.copper,hedge=M.hedge,grav=M.gravel,stat=tint(M.stone,0xe8e2d4,'statue');
 // Flügel: Sockel, Putz, Pilaster mit Kapitellen, Rundbogenfenster mit Faschen und Schlusssteinen, Gesims, Balustrade mit Vasen, Mansarddach mit Gauben
 K.box(18.4,.7,4.6,M.stone,0,.35,-6.5,.05);K.box(18,5.4,4.2,oc,0,3.4,-6.5,.06);K.col(0,-6.5,9,2.2,6);
 for(let i=0;i<10;i++){const x=-8.6+i*1.91;if(Math.abs(x)<2.4)continue;K.box(.4,5.2,.25,wh,x,3.3,-4.35,.03);K.box(.55,.25,.35,wh,x,5.95,-4.35,.03)}
 for(const x of[-7.6,-5.7,-3.8,3.8,5.7,7.6]){K.arched(1.5,3.6,.18,[[0,1.05,2.6,.3]],wh,x,.9,-4.37);K.box(1.05,3.2,.06,M.glass,x,2.65,-4.42,0);K.box(.22,.38,.25,wh,x,4.55,-4.3,.03);for(let k=0;k<4;k++)K.box(1.05,.04,.04,wh,x,1.6+k*.8,-4.37,0)}
 K.box(18.4,.45,4.6,wh,0,6.3,-6.5,.05);for(let i=0;i<46;i++){const x=-8.9+i*.395;if(Math.abs(x)<2.4)continue;K.lathe([[.09,0],[.13,.18],[.07,.36],[.11,.5],[0,.5]],wh,x,6.52,-4.3,8)}K.box(18.2,.14,.3,wh,0,7.08,-4.3,.03);
 for(const x of[-8,-5,5,8]){K.lathe([[0,0],[.25,.1],[.3,.4],[.12,.55],[.18,.7],[0,.75]],wh,x,7.15,-4.3,12)}
 const ms=new THREE.Shape();ms.moveTo(-2.2,0);ms.lineTo(2.2,0);ms.lineTo(1.6,1.6);ms.lineTo(.9,2.5);ms.lineTo(-.9,2.5);ms.lineTo(-1.6,1.6);ms.closePath();const mg=new THREE.ExtrudeGeometry(ms,{depth:18,bevelEnabled:true,bevelSize:.04,bevelThickness:.04,bevelSegments:1});mg.translate(0,0,-9);mg.rotateY(PI/2);K.add(mg,roof,0,6.5,-6.5);
 for(const x of[-7.6,-5.7,-3.8,3.8,5.7,7.6]){K.box(.8,1,.9,wh,x,7.5,-4.7,.04);K.box(.45,.6,.05,M.glass,x,7.5,-4.23,0);K.gable(.9,.8,.45,roof,x,8,-4.7,.08,PI/2)}
 // Mittelpavillon: Säulenportikus, Dreiecksgiebel mit Wappen, Tambour, Kuppel mit Laterne, Statuen
 K.box(5.2,9,5.6,oc,0,4.5,-6.2,.06);K.box(5.6,.7,6,M.stone,0,.35,-6.2,.05);for(const x of[-1.9,-.65,.65,1.9]){K.cyl(.26,.3,5.6,wh,x,3.4,-3.05,16);K.box(.7,.3,.7,wh,x,.75,-3.05,.04);K.lathe([[.28,0],[.42,.25],[.46,.35],[0,.35]],wh,x,6.2,-3.05,12)}
 K.box(5.2,.6,1,wh,0,6.85,-3.1,.05);const tri=new THREE.Shape();tri.moveTo(-2.7,0);tri.lineTo(2.7,0);tri.lineTo(0,1.4);tri.closePath();const tg=new THREE.ExtrudeGeometry(tri,{depth:1,bevelEnabled:true,bevelSize:.05,bevelThickness:.05,bevelSegments:1});tg.translate(0,7.15,-3.6);K.add(tg,wh);
 K.add(new THREE.CircleGeometry(.4,20),M.gold,0,7.6,-2.55);K.arched(2,3.6,.3,[[0,1.3,2.5]],wh,0,.7,-3.55);K.box(1.3,3.2,.08,M.door,0,2.3,-3.65,.02);
 K.cyl(2.3,2.3,1.4,oc,0,9.7,-6.2,32);K.cyl(2.45,2.45,.25,wh,0,10.45,-6.2,32);for(let i=0;i<8;i++){const a=i/8*PI*2;K.box(.4,.6,.06,M.glass,Math.sin(a)*2.3,9.7,-6.2+Math.cos(a)*2.3,0).rotation.y=a}
 const d=new THREE.LatheGeometry([[2.35,0],[2.2,.9],[1.7,1.8],[.9,2.4],[.4,2.6],[0,2.6]].map(p=>new THREE.Vector2(p[0],p[1])),32);d.translate(0,10.55,-6.2);K.add(d,cop);
 K.cyl(.4,.45,.8,wh,0,13.5,-6.2,12);K.add(new THREE.ConeGeometry(.45,.8,12),cop,0,14.3,-6.2);K.add(new THREE.SphereGeometry(.18,10,8),M.gold,0,14.8,-6.2);
 for(const x of[-2.2,2.2])K.statue(stat,x,9,-3.2,.7);
 // Parterre: Kieswege, Broderie-Hecken, Formschnitt, Orangenbäume in Kübeln, Statuen
 K.box(19,.05,11,grav,0,.03,2.8,0);for(const sx of[-1,1]){const cx=sx*5.4;K.box(5.6,.35,7,hedge,cx,.2,2.8,.08);K.box(5.0,.37,6.4,tint(M.grass,0x6a8a3a,'lawn'),cx,.2,2.8,0);
  for(let k=0;k<3;k++)K.tube(Array.from({length:13},(_,i)=>{const t=i/12*PI*2;return[cx+Math.cos(t)*(1.8-k*.5),.4,2.8+Math.sin(t*2)*(2.4-k*.6)]}),.12,hedge,true);
  for(const z of[-.5,6.1])for(const dx of[-2.6,2.6]){K.box(.6,.5,.6,wh,cx+dx,.25,z,.04);K.cyl(.05,.07,.8,M.wood,cx+dx,.9,z,6);K.add(new THREE.SphereGeometry(.45,12,10),hedge,cx+dx,1.5,z);for(let o=0;o<4;o++)K.add(new THREE.SphereGeometry(.07,6,5),tint(null,0xe89020,'orange'),cx+dx+Math.sin(o*1.6)*.38,1.5+Math.cos(o*2)*.2,z+Math.cos(o*1.6)*.38)}
  K.add(new THREE.ConeGeometry(.55,2.4,12),hedge,sx*8.8,1.2,-1.3);K.add(new THREE.ConeGeometry(.55,2.4,12),hedge,sx*8.8,1.2,8.6);K.box(.7,1,.7,wh,sx*2.6,.5,8.6,.04);K.statue(stat,sx*2.6,1,8.6,.8,sx)}
 // Fontäne: Becken mit Profil, Mittelschale, Wasserstrahlen
 K.lathe([[0,0],[3.2,0],[3.4,.2],[3.4,.55],[3.2,.62],[3.05,.62],[3.05,.2],[0,.2]],wh,0,0,3,48);K.col(0,3,3.2,3.2,.6);K.add(new THREE.CircleGeometry(3.05,48).rotateX(-PI/2),M.water,0,.52,3);
 K.lathe([[.5,0],[.35,.9],[.3,1.4],[1.3,1.6],[1.35,1.75],[0,1.7]],wh,0,.5,3,32);K.add(new THREE.CircleGeometry(1.25,32).rotateX(-PI/2),M.water,0,2.2,3);
 K.cyl(.05,.15,4,M.spray,0,4.2,3,8);for(let i=0;i<8;i++){const a=i/8*PI*2;K.tube([[Math.sin(a)*1.25,2.2,3+Math.cos(a)*1.25],[Math.sin(a)*1.9,2.0,3+Math.cos(a)*1.9],[Math.sin(a)*2.4,.6,3+Math.cos(a)*2.4]],.04,M.spray)}
 for(let i=0;i<6;i++){const a=i/6*PI*2;K.tube([[Math.sin(a)*3,.6,3+Math.cos(a)*3],[Math.sin(a)*2.3,2.1,3+Math.cos(a)*2.3],[Math.sin(a)*1.6,.6,3+Math.cos(a)*1.6]],.035,M.spray)}}

// ================= Napoleon: Triumphbogen mit Kassettengewölbe, Reliefs, Inschrift und Quadriga =================
function triumphArch(g,M){const K=kit(g),st=tint(M.white,0xece2c8,'arcst',{uvs:3}),stD=tint(M.white,0xd2c6aa,'arcstD',{uvs:3}),rel=reliefMat('relief','#cfc3a6','#8a7c62'),ins=textMat('arcIns','À LA GRANDE ARMÉE','#d8ccb0','#4a3c28',1024,96);
 K.box(16,.6,7,stD,0,.3,0,.06);K.arched(15,13,6,[[0,5,6.6],[-5.45,2.2,4.3],[5.45,2.2,4.3]],st,0,.6,0,0,.06);
 for(const x of[-7.3,-3.2,3.2,7.3])K.col(x,0,.5,3,13);K.col(0,0,7.5,3,13.6,9.6);
 // Kassettengewölbe in der Hauptdurchfahrt
 for(let i=0;i<=12;i++){const a=i/12*PI,x=Math.cos(a)*2.48,y=7.2+Math.sin(a)*2.48;for(let k=0;k<6;k++){const b=K.box(.42,.42,.08,stD,x*.98,y*.995+(y-7.2)*-.02,-2.5+k,0);b.rotation.z=a+PI/2;b.rotation.x=PI/2}}
 for(const sz of[-1,1]){const zz=sz*3.05;
  for(const x of[-6.9,-3.65,3.65,6.9]){K.box(1,.6,1,stD,x,.9,sz*3.3,.04);K.cyl(.36,.4,8.2,st,x,5.3,sz*3.3,18);for(let f=0;f<12;f++){const a=f/12*PI*2;K.box(.04,8.1,.04,stD,x+Math.sin(a)*.38,5.3,sz*3.3+Math.cos(a)*.38,0)}
   K.lathe([[.38,0],[.55,.35],[.62,.5],[0,.5]],stD,x,9.4,sz*3.3,14);K.box(1.2,.35,1.2,stD,x,10.05,sz*3.3,.04);K.statue(st,x,10.25,sz*3.3,.85,x>0?1:-1)}
  for(const x of[-5.45,5.45]){K.box(2.6,2.4,.12,rel,x,8.6,zz,0);K.box(2.8,.2,.25,stD,x,9.9,zz,.03)}K.box(4.6,1.8,.12,rel,0,11.6,zz,0);
  K.archi(2.6,.18,stD,0,7.2,zz,0,.2);K.box(.5,.7,.25,stD,0,9.8,zz,.04);for(const x of[-2.2,2.2]){const v=K.add(new THREE.TorusGeometry(.5,.12,6,12,PI*1.2),tint(null,0x4a7a3a,'garland'),x,8.8,zz+sz*.05);v.rotation.z=PI*.9}
  K.box(14,1.1,.1,ins,0,15.15,sz*3.06,0);for(let i=0;i<28;i++)K.box(.18,.3,.12,stD,-7.2+i*.533,13.75,sz*3.1,.02)}
 K.box(15.6,.6,6.6,stD,0,13.3,0,.06);K.box(15,3,6,st,0,15.1,0,.06);K.box(15.8,.5,6.8,stD,0,16.85,0,.06);
 // Quadriga: vier Bronzepferde, Wagen mit Lenker
 const bz=M.bronze,q=new THREE.Group();q.position.set(0,17.1,.5);g.add(q);const kq=kit(q);kq.box(5,.6,3,stD,0,.3,0,.05);
 for(let i=0;i<4;i++){const h=createAnimal('horse',{seed:i+3});h.position.set(-1.5+i,.6,.5);h.rotation.y=0;h.traverse(o=>{if(o.isMesh)o.material=bz});q.add(h)}
 kq.box(1.2,.8,.9,bz,0,1.2,-1,.05);for(const sx of[-1,1]){const w=kq.add(new THREE.TorusGeometry(.4,.06,6,16),bz,sx*.65,1,-1.1);w.rotation.y=PI/2}kq.statue(bz,0,1.4,-1.1,.9,1);
 for(const sx of[-1,1])K.statue(bz,sx*7,17.1,0,1.1,sx)}

// ================= Neuzeit: Eiserner Aussichtsturm =================
function ironTower(g,M){const K=kit(g),iron=M.iron,dk=M.ironD,glass=M.glass,gold=M.gold;
 const H=28,S=t=>.75+6.3*Math.pow(1-t,2.2),W=t=>.18+.62*(1-t),legs=[[-1,-1],[1,-1],[1,1],[-1,1]],T=[0,.06,.12,.19,.26,.34,.42,.5,.58,.66,.74,.82,.91,1];
 for(const [sx,sz]of legs){K.col(sx*S(0),sz*S(0),1,1,6);K.box(2.4,.8,2.4,M.stone,sx*S(0),.4,sz*S(0),.08);K.box(2.6,.15,2.6,M.stoneD,sx*S(0),.85,sz*S(0),.04);
  const C=(t,cx,cz)=>[sx*S(t)+cx*W(t),t*H+.9,sz*S(t)+cz*W(t)],cs=[[-1,-1],[1,-1],[1,1],[-1,1]];
  for(const [cx,cz]of cs)K.tube(T.map(t=>C(t,cx,cz)),.1,iron);
  for(let i=0;i<T.length-1;i++)for(let f=0;f<4;f++){const [ax,az]=cs[f],[bx,bz]=cs[(f+1)%4];K.rod(C(T[i],ax,az),C(T[i+1],bx,bz),.035,dk,4);K.rod(C(T[i+1],ax,az),C(T[i],bx,bz),.035,dk,4);K.rod(C(T[i],ax,az),C(T[i],bx,bz),.04,iron,4)}
  // Aufzugskabine am Bein
  const t=.12,p=C(t,0,0);K.box(.9,1.2,.9,tint(null,0xb8a060,'lift',{metalness:.4}),p[0]-sx*.9,p[1],p[2]-sz*.9,.06)}
 // Zierbögen auf allen vier Seiten
 for(let f=0;f<4;f++){const [ax,az]=legs[f],[bx,bz]=legs[(f+1)%4];for(const off of[0,.25]){const pts=[];for(let i=0;i<=20;i++){const u=i/20,y=1.3+Math.sin(u*PI)*(3.9+off),t=(y-.9)/H,s=S(t)+W(t)*.4;pts.push([(ax+(bx-ax)*u)*s,y,(az+(bz-az)*u)*s])}K.tube(pts,off?.07:.2,iron)}
  for(let i=1;i<8;i++){const u=i/8,y=1.3+Math.sin(u*PI)*3.9,s=S((y-.9)/H)+W(0)*.3;K.rod([(ax+(bx-ax)*u)*s,y,(az+(bz-az)*u)*s],[(ax+(bx-ax)*u)*s,y+.25+Math.sin(u*PI)*.0,(az+(bz-az)*u)*s],.03,dk,4)}}
 // Plattformen mit Galerie, Laternen, Restaurant
 for(const t of[.22,.52]){const y=t*H+.9,w=S(t)+W(t)+.6;K.box(2*w,.4,2*w,dk,0,y,0,.06);for(const s of[-1,1]){K.box(2*w,.08,.08,iron,0,y+1.1,s*w,0);K.box(.08,.08,2*w,iron,s*w,y+1.1,0,0);
   for(let k=0;k<=12;k++){const u=-w+k*w/6;K.box(.05,.9,.05,iron,u,y+.65,s*w,0);K.box(.05,.9,.05,iron,s*w,y+.65,u,0)}
   for(let k=0;k<10;k++){const u=-w+(k+.5)*w/5;K.add(new THREE.TorusGeometry(.18,.025,4,10,PI),dk,u,y-.2,s*w).rotation.x=PI;const r2=K.add(new THREE.TorusGeometry(.18,.025,4,10,PI),dk,s*w,y-.2,u);r2.rotation.set(PI,PI/2,0)}}
  if(t<.3){K.box(2*w-1.2,1.8,2*w-1.2,tint(null,0x8a7a5a,'resto'),0,y+1.1,0,.06);for(const s of[-1,1]){K.box(2*w-1.4,1.2,.05,glass,0,y+1.2,s*(w-.58),0);K.box(.05,1.2,2*w-1.4,glass,s*(w-.58),y+1.2,0,0)}K.box(2*w-1,.2,2*w-1,dk,0,y+2.1,0,.04)}
  for(const [sx,sz]of legs){K.cyl(.04,.04,1,dk,sx*w,y+.7,sz*w,6);const l=K.add(new THREE.SphereGeometry(.16,10,8),tint(null,0xfff0c0,'lamp',{emissive:0xffd080,emissiveIntensity:.6}),sx*w,y+1.3,sz*w);l.userData.keep=1}}
 const y3=H+.9;K.box(2.6,.3,2.6,dk,0,y3,0,.05);K.box(2.4,1.8,2.4,dk,0,y3+1,0,.05);for(const s of[-1,1]){K.box(2.2,1,.05,glass,0,y3+1.2,s*1.21,0);K.box(.05,1,2.2,glass,s*1.21,y3+1.2,0,0)}
 K.box(3,.2,3,iron,0,y3+2,0,.04);K.cyl(.9,1.1,.8,dk,0,y3+2.5,0,12);K.add(new THREE.ConeGeometry(.55,3.2,12),iron,0,y3+4.5,0);K.add(new THREE.SphereGeometry(.2,10,8),gold,0,y3+6.2,0);
 K.cyl(.03,.03,2,dk,0,y3+7.2,0,6);const fl=K.box(1.4,.8,.02,tint(null,0xb8201c,'flagR',{side:THREE.DoubleSide}),.72,y3+7.8,0,0);
 // Kassenhäuschen am Fuß
 for(const sx of[-1,1]){K.box(1.6,2.2,1.4,tint(M.plaster,0xe8dcc4,'kiosk'),sx*3,1.1,7.5,.05);K.add(new THREE.ConeGeometry(1.2,1,4),M.slate,sx*3,2.7,7.5).rotation.y=PI/4;K.box(.8,.6,.05,glass,sx*3,1.4,8.2,0)}}

const BUILD={steinzeit:stonehenge,hallstatt:burialMound,roemer:colosseum,fruehmittelalter:palaceChapel,hochmittelalter:imperialPalace,spaetmittelalter:cityGate,renaissance:domeCathedral,barock:pleasurePalace,napoleon:triumphArch,neuzeit:ironTower};
export function buildWonder(era,H={}){for(const k of[...CACHE.keys()])if(k.startsWith('t:'))CACHE.delete(k);   // Spielmaterialien ändern sich je Epoche – Tönungen neu ableiten
 const g=new THREE.Group();g.colliders=[];g.walkAreas=[];const Mt=mats(H);(BUILD[era]||imperialPalace)(g,Mt);
 const out=finalize(g);out.isWonder=true;return out}
