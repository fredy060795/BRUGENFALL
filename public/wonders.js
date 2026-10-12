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
const textMat=(key,txt,bg,fg,w=1024,h=96)=>canvasMat(key,w,h,(x,W,H)=>{x.fillStyle=bg;x.fillRect(0,0,W,H);x.fillStyle=fg;x.font=`bold ${H*.62}px serif`;x.textAlign='center';x.textBaseline='middle';x.fillText(txt,W/2,H/2+2)},{roughness:.6,uvs:1});
const reliefMat=(key,bg,fg)=>canvasMat(key,256,160,(x,W,H)=>{x.fillStyle=bg;x.fillRect(0,0,W,H);x.strokeStyle='rgba(0,0,0,.35)';x.lineWidth=6;x.strokeRect(4,4,W-8,H-8);x.fillStyle=fg;
 for(let i=0;i<5;i++){const cx=28+i*50,b=H-18;x.beginPath();x.ellipse(cx,b-82,9,11,0,0,7);x.fill();x.beginPath();x.moveTo(cx-14,b-68);x.lineTo(cx+14,b-68);x.lineTo(cx+(i%2?18:10),b);x.lineTo(cx-(i%2?10:18),b);x.closePath();x.fill();
  x.fillRect(cx+(i%2?12:-22),b-66,10,4);if(i===2){x.beginPath();x.moveTo(cx,b-110);x.lineTo(cx+30,b-90);x.lineTo(cx,b-96);x.fill()}}},{roughness:.8,uvs:1});

// Bodenflächen: feine Sprenkel-Textur ohne Fugen, damit Kies- und Rasenflächen an das Gelände anschließen
function groundTex(key,hue,sat,lit,pebbles=false){return canvasMat(key,256,256,(x,W,H)=>{const r=()=>Math.random();x.fillStyle=`hsl(${(hue[0]+hue[1])/2},${(sat[0]+sat[1])/2}%,${(lit[0]+lit[1])/2}%)`;x.fillRect(0,0,W,H);
 for(let i=0;i<(pebbles?3200:2600);i++){x.fillStyle=`hsl(${hue[0]+r()*(hue[1]-hue[0])},${sat[0]+r()*(sat[1]-sat[0])}%,${lit[0]+r()*(lit[1]-lit[0])}%)`;const s=pebbles?2+r()*4:3+r()*3;if(pebbles){x.beginPath();x.ellipse(r()*W,r()*H,s/2,s/2*(.6+r()*.4),r()*3,0,7);x.fill()}else x.fillRect(r()*W,r()*H,s,s)}},{roughness:1,uvs:4})}
function mats(H){const S=H.stone,P=H.plaster;return{
 stone:tint(S,null,'stone'),stoneD:tint(S,0x8e8270,'stoneD'),trav:tint(P,0xfff8ea,'trav',{uvs:3.2}),travD:tint(P,0xeee2c8,'travD',{uvs:3.2}),
 marble:tint(P,0xf4efe4,'marble',{roughness:.5}),white:tint(P,0xfaf6ee,'white'),ochre:tint(P,0xf0cf86,'ochre'),plaster:tint(P,0xe8dcc4,'plaster'),
 slate:tint(H.slate,null,'slate'),copper:tint(H.slate,0x6fa58e,'copper',{roughness:.5,metalness:.2}),tiles:tint(H.redRoof,null,'tiles'),wood:tint(H.wood,null,'wood'),floor:tint(H.floor,null,'floor'),
 grass:groundTex('gGrass',[85,115],[42,52],[26,40]),gravel:groundTex('gGravel',[30,45],[10,22],[48,70],true),   // Boden wie die Landschaft: Grasflecken bzw. Kies statt Dielen-/Strohmuster
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
 for(const o of keep){const m=new THREE.Matrix4().multiplyMatrices(inv,o.matrixWorld);o.removeFromParent();m.decompose(o.position,o.quaternion,o.scale);out.add(o)}   // Lage relativ zum Wahrzeichen übernehmen (nicht doppelt verschieben)
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
 const ar=new THREE.CircleGeometry(1,64);ar.rotateX(-PI/2);ar.scale(A*.42,1,B*.42);K.add(ar,groundTex('gSand',[36,46],[30,45],[58,72],true),0,.06,0);
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
 // Banner der Babenberger: Bindenschild Rot-Weiß-Rot mit Zaddeln
 const eagle=canvasMat('binden',128,256,(x,W,H)=>{x.fillStyle='#b01e1e';x.fillRect(0,0,W,H);x.fillStyle='#f2eee4';x.fillRect(0,H*.36,W,H*.26);x.strokeStyle='#d8b030';x.lineWidth=6;x.strokeRect(3,3,W-6,H-30);
  for(let i=0;i<6;i++){x.beginPath();x.moveTo(i*21,H-24);x.lineTo(i*21+10,H);x.lineTo(i*21+21,H-24);x.fillStyle='#8a1616';x.fill()}},{roughness:.95,side:THREE.DoubleSide,uvs:1});
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

// ================= Spätmittelalter: Stephansdom – Zickzack-Ziegeldach, Südturm mit Spitzhelm, Nordturm mit Renaissance-Haube, Riesentor, Heidentürme =================
function stephansdom(g,M){const K=kit(g),st=tint(M.stone,0xd6cbb0,'sdst'),stD=tint(M.stone,0xb4a78c,'sdstD'),gl=M.glass,dk=M.dark;
 const roofM=canvasMat('sdroof',256,256,(x,W,H)=>{const C=['#2e6a4a','#d8b030','#ece4cc','#1c1c1c','#8a3a24'],s=16;x.fillStyle='#3a2a20';x.fillRect(0,0,W,H);
  for(let r=0;r<H/s;r++)for(let c=0;c<W/s;c++){const band=Math.floor((r+Math.abs((c%8)-4))/2);x.fillStyle=C[band%5];x.fillRect(c*s+1,r*s+1,s-2,s-2)}},{roughness:.45,uvs:6});
 K.box(23.6,.05,27.6,M.gravel,0,.03,0,0);
 // Langhaus (Hallenkirche) mit Strebepfeilern, Fialen und Maßwerkfenstern
 const z0=-8.5,z1=6.5,L=z1-z0,zc=(z0+z1)/2;K.box(10,11,L,st,0,5.5,zc,.05);K.col(0,zc,5,L/2,11);K.box(10.4,.5,L+.4,stD,0,.25,zc,.04);
 for(let z=z0+1.3;z<z1-.5;z+=2.5)for(const sx of[-1,1]){if(sx>0&&Math.abs(z+1)<3.2||sx<0&&Math.abs(z+1)<3.2)continue;K.box(.08,5.2,1.1,gl,sx*5.03,5.6,z+1.25,0);K.add(new THREE.CircleGeometry(.55,12,0,PI),gl,sx*5.04,8.2,z+1.25).rotation.y=sx*PI/2;
  K.box(.9,9.5,.9,stD,sx*5.45,4.75,z,.04);K.add(new THREE.ConeGeometry(.38,1.8,4).rotateY(PI/4),stD,sx*5.45,10.4,z)}
 K.gable(L,10,11,roofM,0,11,zc,.45,PI/2,stD);
 // Chor mit polygonalem Abschluss
 K.add(new THREE.CylinderGeometry(4.6,4.6,10,8,1,false,PI/2,PI),st,0,5,z0);K.add(new THREE.ConeGeometry(5.0,7,8,1,false,PI/2,PI),roofM,0,13.5,z0);K.col(0,z0-2.3,4.6,2.3,10);
 for(let i=0;i<4;i++){const a=PI/2+PI/8+i*PI/4,x=Math.sin(a)*4.62,z=z0+Math.cos(a)*4.62;K.box(.9,4.6,.08,gl,x,5.4,z,0).rotation.y=a}
 // Westfassade: Riesentor mit Archivolten, Wimperg, Heidentürme
 K.box(10.6,12,1.2,st,0,6,z1+.4,.05);K.arched(4.6,6.2,1.4,[[0,2.6,3.6]],stD,0,0,z1+1.2);K.box(2.4,3.4,.1,M.door,0,1.7,z1+.6,0);for(const r of[1.6,1.9,2.2])K.archi(r,.1,st,0,3.6,z1+1.9,0,.15);
 const wg=new THREE.Shape();wg.moveTo(-2.4,0);wg.lineTo(2.4,0);wg.lineTo(0,2.6);wg.closePath();const wgg=new THREE.ExtrudeGeometry(wg,{depth:.3,bevelEnabled:false});wgg.translate(0,6.1,z1+1.75);K.add(wgg,stD);
 K.add(new THREE.CircleGeometry(1.3,24),gl,0,9.2,z1+1.02);K.add(new THREE.TorusGeometry(1.35,.14,6,24),stD,0,9.2,z1+1.05);
 for(const sx of[-1,1]){K.cyl(1.05,1.15,15,st,sx*4.4,7.5,z1+.9,8);K.add(new THREE.ConeGeometry(1.15,3.4,8),stD,sx*4.4,16.7,z1+.9);K.add(new THREE.SphereGeometry(.18,8,6),M.gold,sx*4.4,18.5,z1+.9);for(let y=3;y<14;y+=3)K.box(.25,1.1,.1,dk,sx*4.4,y,z1+2.0,0)}
 // Südturm „Steffl“: quadratischer Unterbau, verjüngte Geschosse mit Fialen, achteckiger Helm mit Krabbenringen
 const tx=8.3,tz=-1;K.box(5.2,14,5.2,st,tx,7,tz,.05);K.col(tx,tz,2.6,2.6,40);K.box(4.4,8,4.4,st,tx,18,tz,.05);K.box(5.4,.4,5.4,stD,tx,14.1,tz,.04);
 for(const[dx,dz]of[[-1,-1],[1,-1],[-1,1],[1,1]]){K.add(new THREE.ConeGeometry(.35,2.4,4).rotateY(PI/4),stD,tx+dx*2.4,15.4,tz+dz*2.4);K.add(new THREE.ConeGeometry(.3,2.2,4).rotateY(PI/4),stD,tx+dx*2.05,23.1,tz+dz*2.05)}
 for(const[dx,dz,ry]of[[0,2.63,0],[2.63,0,PI/2],[0,-2.63,PI],[-2.63,0,-PI/2]])for(const y of[4,9]){K.box(.9,3,.06,dk,tx+dx,y,tz+dz,0).rotation.y=ry}
 for(const[dx,dz,ry]of[[0,2.23,0],[2.23,0,PI/2],[0,-2.23,PI],[-2.23,0,-PI/2]]){K.box(1.1,4.6,.06,dk,tx+dx,18.4,tz+dz,0).rotation.y=ry}
 K.cyl(1.75,2.15,5,st,tx,24.5,tz,8);K.add(new THREE.ConeGeometry(1.8,14,8),st,tx,34,tz);for(let k=1;k<5;k++)K.cyl(1.8*(1-k/5)+.06,1.8*(1-k/5)+.06,.18,stD,tx,27+k*2.8,tz,8);
 K.add(new THREE.SphereGeometry(.32,12,10),M.gold,tx,41.2,tz);K.box(.08,1,.08,M.gold,tx,41.9,tz,0);K.box(.7,.08,.08,M.gold,tx,42.0,tz,0);
 // Nordturm: unvollendet, mit Renaissance-Haube (Kupfer)
 const nx=-8.3;K.box(5.2,14,5.2,st,nx,7,tz,.05);K.col(nx,tz,2.6,2.6,20);K.box(4.6,4,4.6,st,nx,16,tz,.05);K.box(5,.35,5,stD,nx,18.1,tz,.03);
 K.lathe([[2.2,0],[2.1,.7],[1.5,1.5],[.7,2.2],[.55,2.8],[.75,3.3],[.4,3.9],[.2,4.4],[0,4.6]],M.copper,nx,18.2,tz,8);K.add(new THREE.SphereGeometry(.22,10,8),M.gold,nx,22.9,tz);
 for(const[dx,dz,ry]of[[0,2.63,0],[2.63,0,PI/2],[0,-2.63,PI],[-2.63,0,-PI/2]])K.box(.9,3,.06,dk,nx+dx,8,tz+dz,0).rotation.y=ry}

// ================= Renaissance: Arkadenhof (Landhaus Linz / Schallaburg) – zweigeschossige Loggien, Sgraffito-Diamantquader, Turm mit Zwiebelhelm, Planetenbrunnen =================
function arkadenhof(g,M){const K=kit(g),pl=stucco('rnplaster','#efe2c4'),terr=tint(null,0xb8673a,'terracotta',{roughness:.7}),roof=M.tiles,col=tint(null,0xe6dcc8,'rncol',{roughness:.6});
 const sgr=canvasMat('sgraffito',128,128,(x,W,H)=>{x.fillStyle='#e9dcc0';x.fillRect(0,0,W,H);x.strokeStyle='#8a8070';x.lineWidth=3;for(let r=0;r<4;r++)for(let c=0;c<2;c++){const ox=c*64+(r%2)*32,oy=r*32;x.beginPath();x.moveTo(ox,oy+16);x.lineTo(ox+32,oy);x.lineTo(ox+64,oy+16);x.lineTo(ox+32,oy+32);x.closePath();x.stroke();x.fillStyle='rgba(120,110,95,.25)';x.beginPath();x.moveTo(ox+32,oy);x.lineTo(ox+64,oy+16);x.lineTo(ox+32,oy+16);x.closePath();x.fill()}},{roughness:.85,uvs:2});
 K.box(23.6,.05,27.6,M.gravel,0,.03,0,0);
 const ZB=-10,ZF=7,XW=9.5,T=3.6,H1=4,H2=8;
 // Flügel: hinten und seitlich geschlossen (Sgraffito außen), Satteldächer
 K.box(2*XW,H2,T,sgr,0,H2/2,ZB+T/2,.05);K.col(0,ZB+T/2,XW,T/2,H2);K.gable(2*XW,T,2.4,roof,0,H2,ZB+T/2,.35,0);
 for(const sx of[-1,1]){const L=ZF-ZB-T,zc=(ZF+ZB+T)/2;K.box(T,H2,L,sgr,sx*(XW-T/2),H2/2,zc,.05);K.col(sx*(XW-T/2),zc,T/2,L/2,H2);K.gable(L,T,2.4,roof,sx*(XW-T/2),H2,zc,.35,PI/2)}
  // Fenster außen mit Terrakotta-Gewänden
 const win=(x,y,z,ry)=>{const w=K.box(.9,1.4,.08,M.glass,x,y,z,0);w.rotation.y=ry;const f=K.box(1.15,1.65,.06,terr,x-Math.sin(ry)*.02,y,z-Math.cos(ry)*.02,0);f.rotation.y=ry};
 for(let x=-8;x<=8.01;x+=2)for(const y of[2,6])win(x,y,ZB-.06,PI);for(const sx of[-1,1])for(let z=ZB+T+1;z<ZF-.5;z+=2.2)for(const y of[2,6])win(sx*(XW+.06),y,z,sx*PI/2);
 // Innenhof: Arkaden an allen Seiten, zwei Geschosse (Säulen, Bögen, Brüstung)
 const IW=XW-T,arc=(len,n,x,z,ry)=>{for(const y0 of[0,H1]){const holes=[];for(let i=0;i<n;i++)holes.push([-len/2+len/n*(i+.5),len/n*.66,y0?2.3:2.4,y0?.9:0]);K.arched(len,H1,.4,holes,pl,x,y0,z,ry);
   for(let i=1;i<n;i++){const t=-len/2+len/n*i,cx=x+Math.cos(ry)*t,cz=z-Math.sin(ry)*t;K.cyl(.16,.18,y0?2.8:2.9,col,cx+Math.sin(ry)*.3,y0+(y0?2.3:1.45),cz+Math.cos(ry)*.3,10)}
   if(y0){const b=K.box(len,.12,.2,terr,x+Math.sin(ry)*.3,y0+.95,z+Math.cos(ry)*.3,0);b.rotation.y=ry}}};
 arc(2*IW,6,0,ZB+T+.2,0);for(const sx of[-1,1])arc(ZF-ZB-T,6,sx*(IW-.2),(ZF+ZB+T)/2,sx*PI/2);
 // Vorderer Flügel: offene Loggia zur Stadt (zeigt die Arkaden), darüber Altane, Mittelportal mit Wappen
 arc(2*IW,6,0,ZF-.3,PI);K.box(2*IW,.3,2.2,pl,0,H1+.15,ZF-1.2,.03);K.box(2*IW,.3,2.2,pl,0,H2+.15,ZF-1.2,.03);K.gable(2*IW,2.4,1.4,roof,0,H2+.3,ZF-1.2,.3,0);
 K.box(1.2,1.2,.2,terr,0,H2-.9,ZF+.05,.03);K.add(new THREE.CircleGeometry(.4,16),M.gold,0,H2-.9,ZF+.17);
 // Turm mit Zwiebelhelm in der hinteren Ecke
 const tx=-XW+1.6,tz=ZB+1.6;K.box(3.6,14,3.6,sgr,tx,7,tz,.05);K.col(tx,tz,1.8,1.8,14);K.box(3.9,.3,3.9,terr,tx,14.1,tz,.03);for(const[dx,dz,ry]of[[0,1.83,0],[1.83,0,PI/2],[0,-1.83,PI],[-1.83,0,-PI/2]])K.box(.7,1.2,.05,M.dark,tx+dx,12,tz+dz,0).rotation.y=ry;
 K.lathe([[1.8,0],[1.9,.4],[1.5,1.1],[.6,1.7],[.45,2.1],[.7,2.6],[.35,3.2],[.12,3.8],[0,4.2]],M.copper,tx,14.25,tz,12);K.add(new THREE.SphereGeometry(.2,10,8),M.gold,tx,18.6,tz);
 // Planetenbrunnen im Hof
 const fz=(ZF+ZB+T)/2-.5;K.lathe([[0,0],[1.6,0],[1.75,.15],[1.75,.55],[1.6,.6],[1.5,.2],[0,.2]],col,0,0,fz,24);K.col(0,fz,1.7,1.7,.6);K.add(new THREE.CircleGeometry(1.5,24).rotateX(-PI/2),M.water,0,.5,fz);
 K.cyl(.14,.18,2.2,col,0,1.3,fz,10);K.lathe([[.1,0],[.7,.15],[.75,.3],[0,.25]],col,0,2.3,fz,16);K.add(new THREE.SphereGeometry(.22,12,10),M.gold,0,2.8,fz)}

// ================= Barock: Stift Melk – Felsen über der Donau, Doppelturmfassade, Kuppel, lange Klostertrakte, Altane mit Bogenfenster =================
function stiftMelk(g,M){const K=kit(g),yel=stucco('melkgelb','#e9bd55'),wh=stucco('melkweiss','#f4efe4'),roof=tint(M.slate,0x7a6a5a,'melkroof'),cop=M.copper,gold=M.gold,B=2.4;
 // Felsplateau mit Freitreppe
 K.rock(23.4,B,22,tint(M.stone,0x948a76,'melkrock'),0,B/2,-3,5,.1);K.col(0,-3,11.6,11,B);g.walkAreas.push([0,-3,11.5,10.9,B]);
 for(let i=0;i<8;i++)K.box(6,B/8*(i+1),.6,wh,0,B/16*(i+1),12.4-i*.6,.02);K.box(23.6,.05,6,M.gravel,0,.03,11,0);
 // Klostertrakte links und rechts, Prälatenhof dazwischen
 for(const sx of[-1,1]){const x=sx*8.6;K.box(5.4,9,19,yel,x,B+4.5,-3.2,.05);K.col(x,-3.2,2.7,9.5,B+9);K.box(5.6,.35,19.2,wh,x,B+9,-3.2,.03);K.gable(19,5.4,2.6,roof,x,B+9.15,-3.2,.35,PI/2);
  for(let z=-11.5;z<5.6;z+=1.6)for(const y of[2.2,5,7.6]){const xi=x-sx*2.73;K.box(.08,1.3,.7,M.glass,xi,B+y,z,0);K.box(.06,1.5,.9,wh,xi+sx*.02,B+y,z,0)}
  for(let x2=-2;x2<=2;x2+=2)for(const y of[2.2,5,7.6]){K.box(.7,1.3,.08,M.glass,x+x2*.9,B+y,6.33,0)}
  for(const z of[-12,5.8])K.box(.4,9,.4,wh,x+sx*2.6,B+4.5,z,.02)}
 // Stiftskirche: Langhaus, Fassade mit Pilastern und Volutengiebel, Doppeltürme mit Barockhelmen, Kuppel über der Vierung
 K.box(7,12,12,yel,0,B+6,-5,.05);K.col(0,-5,3.5,6,B+12);K.gable(12,7,3,roof,0,B+12,-5,.3,PI/2);
 const FZ=1.4;K.box(8.6,13,1.2,yel,0,B+6.5,FZ,.05);for(const x of[-3.1,-1.2,1.2,3.1])K.box(.45,12.6,.25,wh,x,B+6.3,FZ+.7,.02);
 K.arched(2.4,4,.3,[[0,1.4,2.5]],wh,0,B,FZ+.7);K.box(1.6,3.2,.08,M.door,0,B+1.6,FZ+.62,0);K.box(1.6,2.6,.08,M.glass,0,B+7.2,FZ+.62,0);K.archi(.85,.1,wh,0,B+8.5,FZ+.7,0,.15);
 const vg=new THREE.Shape();vg.moveTo(-3,0);vg.lineTo(3,0);vg.quadraticCurveTo(2.6,1.4,1.2,1.6);vg.quadraticCurveTo(.4,2.6,0,2.8);vg.quadraticCurveTo(-.4,2.6,-1.2,1.6);vg.quadraticCurveTo(-2.6,1.4,-3,0);const vgg=new THREE.ExtrudeGeometry(vg,{depth:1,bevelEnabled:true,bevelSize:.05,bevelThickness:.05,bevelSegments:1});vgg.translate(0,B+13,FZ-.4);K.add(vgg,yel);K.statue(wh,0,B+15.7,FZ,.6);
 for(const sx of[-1,1]){const x=sx*4.1;K.box(2.8,17,2.8,yel,x,B+8.5,FZ,.05);K.col(x,FZ,1.4,1.4,B+26);K.box(3,.35,3,wh,x,B+17.1,FZ,.03);K.box(2.4,3,2.4,wh,x,B+18.7,FZ,.04);
  for(const[dx,dz,ry]of[[0,1.21,0],[1.21,0,PI/2],[0,-1.21,PI],[-1.21,0,-PI/2]]){K.box(.8,1.8,.06,M.dark,x+dx,B+18.8,FZ+dz,0).rotation.y=ry;K.box(.5,.5,.05,tint(null,0xf2ecd8,'melkclock'),x+dx*1.17,B+15.6,FZ+dz*1.17,0).rotation.y=ry}
  K.lathe([[1.45,0],[1.55,.5],[1.05,1.3],[.5,1.7],[.85,2.3],[.65,2.9],[.25,3.3],[.38,3.75],[.12,4.4],[0,4.9]],cop,x,B+20.2,FZ,12);K.add(new THREE.SphereGeometry(.18,10,8),gold,x,B+25.2,FZ);K.box(.06,.7,.06,gold,x,B+25.7,FZ,0);K.box(.4,.06,.06,gold,x,B+25.8,FZ,0)}
 K.cyl(2.7,2.7,3,yel,0,B+13.5,-8,16);K.cyl(2.9,2.9,.3,wh,0,B+15.1,-8,16);for(let i=0;i<8;i++){const a=i/8*PI*2;K.box(.6,1.4,.06,M.glass,Math.sin(a)*2.72,B+13.5,-8+Math.cos(a)*2.72,0).rotation.y=a}
 K.lathe([[2.8,0],[2.6,1.2],[2.0,2.2],[1.0,2.9],[.5,3.05],[0,3.1]],cop,0,B+15.2,-8,24);K.cyl(.5,.55,1.2,wh,0,B+18.8,-8,10);K.lathe([[.6,0],[.35,.6],[.12,1],[0,1.2]],cop,0,B+19.4,-8,10);K.add(new THREE.SphereGeometry(.15,8,6),gold,0,B+20.7,-8);
 // Altane: niedriger Verbindungstrakt mit großem Bogenfenster und Balustrade, Blick auf die Kirche
 K.arched(11.8,5,1.6,[[0,3.2,3.4,.6]],yel,0,B,8.2);K.col(-4.1,8.2,1.8,.8,B+5);K.col(4.1,8.2,1.8,.8,B+5);K.box(12,.3,1.8,wh,0,B+5.1,8.2,.03);
 for(let i=0;i<28;i++)K.lathe([[.07,0],[.1,.18],[.06,.36],[.09,.46],[0,.46]],wh,-5.6+i*.415,B+5.25,8.9,8);K.box(12,.1,.2,wh,0,B+5.75,8.9,0);
 for(const sx of[-1,1])K.box(1.4,5.6,1.8,yel,sx*6.6,B+2.8,8.2,.04)}

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

const stucco=(key,col)=>canvasMat(key,128,128,(x,W,H)=>{x.fillStyle=col;x.fillRect(0,0,W,H);for(let i=0;i<900;i++){const v=Math.random();x.fillStyle=`rgba(${v<.5?0:255},${v<.5?0:255},${v<.5?0:255},${.015+Math.random()*.02})`;x.fillRect(Math.random()*W,Math.random()*H,2,2)}},{roughness:.85,uvs:3});   // glatter Putz unabhängig von der Epochen-Wandtextur
function schoenbrunn(g,M){const K=kit(g),yel=stucco('sbgelb2','#f3d683'),wh=stucco('sbweiss','#f4f0e6'),roof=tint(M.slate,0x70757a,'sbroof'),shut=tint(null,0x2f5e36,'sbgreen',{roughness:.7}),st=stucco('sbsockel','#e6dcc4'),hedge=M.hedge,lawn=tint(M.grass,0x5f8a34,'sblawn');
 const Z=-2.5,FR=Z+2.3,FM=Z+2.9;   // Schloss in der Mitte: vorne Ehrenhof mit Tor, hinten Garten mit Neptunbrunnen und Gloriette
 // Corps de logis mit Sockel, Mittel- und Eckrisaliten
 K.box(19.2,.6,5.2,st,0,.3,Z,.05);K.box(18.8,7.2,4.6,yel,0,4.2,Z,.05);K.col(0,Z,9.4,2.6,8);
 K.box(7,8.4,5.8,yel,0,4.8,Z+.1,.05);for(const sx of[-1,1])K.box(2.6,7.6,5.1,yel,sx*8.1,4.4,Z,.05);
 K.box(19,.35,4.9,wh,0,7.95,Z,.04);K.box(7.2,.35,6,wh,0,9.15,Z+.1,.04);for(const sx of[-1,1])K.box(2.8,.35,5.3,wh,sx*8.1,8.35,Z,.04);
 K.box(19,.25,.3,wh,0,3.6,FR+.15,.02);
 // Fenster: weiße Faschen, Verdachungen, grüne Läden – zwei Geschosse
 const win=(x,y,z,big,dir=1)=>{const h=big?1.9:1.5;K.box(.78,h+.15,.08,wh,x,y,z+dir*.04,0);K.box(.58,h-.1,.06,M.glass,x,y,z+dir*.08,0);K.box(.92,.14,.16,wh,x,y+h/2+.16,z+dir*.08,0);for(const s of[-1,1])K.box(.26,h-.1,.05,shut,x+s*.55,y,z+dir*.08,0)};
 for(let x=-8.8;x<=8.81;x+=1.35){if(Math.abs(x)<3.6)continue;const z=Math.abs(x)>6.7?Z+2.55:FR;win(x,2.2,z,false);win(x,5.5,z,true)}
 for(const x of[-2.4,-.8,.8,2.4]){win(x,5.6,FM,true);win(x,2.2,FM,false)}
 for(let x=-8.8;x<=8.81;x+=1.35){const z=Math.abs(x)>6.7?Z-2.55:Math.abs(x)<3.6?Z-2.8:Z-2.3;win(x,2.2,z,false,-1);win(x,5.5,z,true,-1)}   // Gartenfassade
 // Mittelrisalit: Pilaster, Uhr, Balkon auf Säulen über der Durchfahrt, Attika mit Trophäen
 for(const x of[-3.3,-1.6,0,1.6,3.3]){if(x)K.box(.35,7.6,.2,wh,x,4.4,FM+.1,.02)}
 K.add(new THREE.CircleGeometry(.55,24),tint(null,0xf2ecd8,'sbclock'),0,8.4,FM+.12);K.box(.05,.4,.02,M.dark,0,8.55,FM+.14,0);
 K.box(5.6,.25,1.8,wh,0,3.75,FM+.9,.03);for(const x of[-2.5,-.9,.9,2.5])K.cyl(.17,.2,3.5,wh,x,1.95,FM+1.55,12);for(let i=0;i<14;i++)K.lathe([[.06,0],[.09,.15],[.05,.3],[.08,.4],[0,.4]],wh,-2.6+i*.4,3.88,FM+1.72,8);K.box(5.6,.1,.18,wh,0,4.33,FM+1.72,0);
 K.arched(2.2,3.2,.3,[[0,1.4,2.2]],wh,0,0,FM+.05);K.box(1.5,2.9,.06,M.door,0,1.45,FM-.05,0);
 for(const x of[-3.2,3.2])K.statue(tint(M.stone,0xe8e2d4,'sbstat'),x,9.3,FM-.3,.55);
 // Walmdach mit Gauben und Kaminen
 const rs=new THREE.Shape();rs.moveTo(-2.45,0);rs.lineTo(2.45,0);rs.lineTo(1.0,1.5);rs.lineTo(-1.0,1.5);rs.closePath();const rg=new THREE.ExtrudeGeometry(rs,{depth:18.4,bevelEnabled:true,bevelSize:.04,bevelThickness:.04,bevelSegments:1});rg.translate(0,0,-9.2);rg.rotateY(PI/2);K.add(rg,roof,0,8.1,Z);
 for(const x of[-6,-4.6,4.6,6]){K.box(.7,.8,.6,wh,x,8.75,Z+1.6,.03);K.box(.4,.5,.05,M.glass,x,8.75,Z+1.92,0);K.gable(.6,.7,.35,roof,x,9.15,Z+1.6,.06,PI/2)}
 for(const x of[-7.5,-3.8,3.8,7.5])K.box(.45,1.1,.45,wh,x,9.5,Z-.6,.03);
 // Habsburger Fahne (Schwarz-Gelb) auf dem Mittelrisalit
 K.box(.8,.5,.8,wh,0,9.45,Z-.4,.03);K.cyl(.09,.11,4,wh,0,11.6,Z-.4,10);K.add(new THREE.SphereGeometry(.16,10,8),M.gold,0,13.7,Z-.4);for(const[i,c]of[[0,0x141414],[1,0xe8c020]])K.box(1.6,.45,.04,tint(null,c,'sbflag'+i,{side:THREE.DoubleSide}),.89,13.1-i*.45,Z-.4,0).userData.keep=1;   // Fahnenmast auf Sockel am First, Fahne direkt am Mast
 // Hufeisentreppe: zwei Rampen aus dem Hof hinauf zum Balkon, Wangenmauern mit Brüstung
 for(const sx of[-1,1]){const tri=new THREE.Shape();tri.moveTo(sx*2.8,0);tri.lineTo(sx*8.2,0);tri.lineTo(sx*2.8,3.6);tri.closePath();const tg=new THREE.ExtrudeGeometry(tri,{depth:1.4,bevelEnabled:false});tg.translate(0,0,-.7);K.add(tg,st,0,0,FM+1.2);
  const L=Math.hypot(5.4,3.6),a=Math.atan2(3.6,5.4),r1=K.box(L,.2,1.5,wh,sx*5.5,1.9,FM+1.2,.02);r1.rotation.z=-sx*a;const r2=K.box(L,.5,.14,wh,sx*5.5,2.25,FM+1.9,.02);r2.rotation.z=-sx*a}
 // Ehrenhof (vorne): Kies, zwei Brunnen, Haupttor mit Obelisken und vergoldeten Adlern, schmiedeeisernes Gitter
 const ZG=13.4;K.box(23.6,.05,ZG-FM-1,M.gravel,0,.03,(ZG+FM+1)/2,0);
 for(const sx of[-1,1]){K.lathe([[0,0],[1.3,0],[1.4,.15],[1.4,.45],[1.25,.5],[1.2,.18],[0,.18]],wh,sx*6.5,0,9,32);K.col(sx*6.5,9,1.3,1.3,.5);K.add(new THREE.CircleGeometry(1.2,32).rotateX(-PI/2),M.water,sx*6.5,.42,9);K.statue(tint(M.stone,0xe8e2d4,'sbstat'),sx*6.5,.3,9,.6);K.cyl(.03,.08,1.6,M.spray,sx*6.5,1.6,9.35,6)}
 for(const sx of[-1,1]){K.box(1.1,.8,1.1,st,sx*2.2,.4,ZG-.2,.04);K.add(new THREE.CylinderGeometry(.18,.42,4.2,4).rotateY(PI/4),wh,sx*2.2,2.9,ZG-.2);K.add(new THREE.SphereGeometry(.32,12,10),M.gold,sx*2.2,5.25,ZG-.2);
  for(let x=sx*3;Math.abs(x)<11.8;x+=sx*.3)K.box(.04,1.5,.04,M.ironD,x,.75,ZG,0);K.box(8.8,.06,.06,M.ironD,sx*7.4,1.4,ZG,0);K.box(8.8,.06,.06,M.ironD,sx*7.4,.2,ZG,0);for(let x=sx*3.3;Math.abs(x)<11.9;x+=sx*2.15)K.box(.35,1.7,.35,st,x,.85,ZG,.03)}
 for(let x=-1.6;x<=1.6;x+=.2)K.box(.04,2.1,.04,M.ironD,x,1.05,ZG,0);K.box(3.4,.07,.07,M.ironD,0,2.0,ZG,0);K.box(.5,.5,.06,M.gold,0,2.3,ZG,0);
 // Schlosspark (hinten): Parterres mit Broderie und Eiben, Neptunbrunnen, Gloriette auf dem Hügel
 const ZB=Z-2.6;K.box(23.6,.05,14+ZB,M.gravel,0,.03,(ZB-14)/2,0);
 for(const sx of[-1,1]){const cx=sx*5.6,cz=ZB-2.6;K.box(5.2,.3,4.2,hedge,cx,.16,cz,.06);K.box(4.7,.32,3.7,lawn,cx,.17,cz,0);
  for(let k=0;k<2;k++)K.tube(Array.from({length:13},(_,i)=>{const t=i/12*PI*2;return[cx+Math.cos(t)*(1.7-k*.7),.36,cz+Math.sin(t*2)*(1.4-k*.5)]}),.1,hedge,true);
  for(const z of[cz-2.4,cz+2.4])K.add(new THREE.ConeGeometry(.42,2,12),hedge,cx+sx*2.9,1,z)}
 const NZ=ZB-6.4;K.lathe([[0,0],[2.4,0],[2.55,.2],[2.55,.5],[2.4,.56],[2.3,.56],[2.3,.18],[0,.18]],wh,0,0,NZ,40);K.col(0,NZ,2.4,2.4,.6);K.add(new THREE.CircleGeometry(2.3,40).rotateX(-PI/2),M.water,0,.48,NZ);
 K.rock(2.2,1.2,1.4,tint(M.stone,0xa8a296,'sbrock'),0,.9,NZ-.3,3,.12);const nep=K.statue(tint(M.stone,0xe8e2d4,'sbstat'),0,1.5,NZ-.3,.75);nep.rotation.y=PI;for(const sx of[-1,1])K.tube([[sx*.6,1.3,NZ-.8],[sx*1.3,1.1,NZ-1.1],[sx*1.8,.5,NZ-1.3]],.04,M.spray);
 const GZ=-12.4;K.box(16,1.6,3.2,lawn,0,.8,GZ,.3);K.col(0,GZ,8,1.6,1.6);for(let i=0;i<5;i++)K.box(3,.2,.5,st,0,.1+i*.32,GZ+1.6+(4-i)*.5,.02);
 K.arched(10,3.2,.5,[[-3.6,1.2,2.2],[-1.8,1.2,2.2],[0,1.35,2.35],[1.8,1.2,2.2],[3.6,1.2,2.2]],wh,0,1.6,GZ);K.box(10.3,.35,.75,wh,0,4.95,GZ,.03);
 for(let i=0;i<6;i++)K.cyl(.12,.14,3.2,wh,-4.5+i*1.8,3.2,GZ+.42,10);K.box(3.6,1.1,.65,wh,0,5.65,GZ,.03);K.add(new THREE.SphereGeometry(.3,12,10),M.gold,0,6.5,GZ);K.box(1.1,.6,.08,M.gold,0,6.9,GZ,0);
 for(const sx of[-1,1]){K.arched(2.2,2.4,.45,[[0,.9,1.6]],wh,sx*6.3,1.6,GZ);K.box(2.3,.3,.65,wh,sx*6.3,4.1,GZ,.03);K.lathe([[0,0],[.25,.1],[.3,.4],[.12,.55],[.18,.7],[0,.75]],wh,sx*4.9,5.15,GZ,12)}}

const BUILD={steinzeit:stonehenge,hallstatt:burialMound,roemer:colosseum,fruehmittelalter:palaceChapel,hochmittelalter:imperialPalace,spaetmittelalter:stephansdom,renaissance:arkadenhof,barock:stiftMelk,napoleon:triumphArch,neuzeit:schoenbrunn};

export function buildWonder(era,H={}){for(const k of[...CACHE.keys()])if(k.startsWith('t:'))CACHE.delete(k);   // Spielmaterialien ändern sich je Epoche – Tönungen neu ableiten
 const g=new THREE.Group();g.colliders=[];g.walkAreas=[];const Mt=mats(H);(BUILD[era]||imperialPalace)(g,Mt);
 const out=finalize(g);out.isWonder=true;return out}
