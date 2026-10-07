// Wahrzeichen je Epoche: ein Prachtbau pro Welt (Bauplatz 20 × 20 m, Mitte = Ursprung, Eingang Richtung +z).
// Grundsätze: Dächer als geschlossene Prismen (keine Spalten), Öffnungen als echte Aussparungen (Shape mit Loch),
// Bauteile liegen bündig aneinander. Kollisionen als [x,z,halbeBreite,halbeTiefe,oben,unten] in g.colliders.
import * as THREE from 'three';
const V=(x,y,z)=>new THREE.Vector3(x,y,z);
const MAT=new Map(),M=(c,o={})=>{const k=c+JSON.stringify(o);if(!MAT.has(k))MAT.set(k,new THREE.MeshStandardMaterial({color:c,roughness:.85,...o}));return MAT.get(k)};
const DS=m=>{const k='ds'+m.uuid;if(!MAT.has(k)){const c=m.clone();c.side=THREE.DoubleSide;MAT.set(k,c)}return MAT.get(k)};
function kit(g){const add=(geo,m,x=0,y=0,z=0)=>{const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;g.add(o);return o};
 const K={add,
  box:(w,h,d,m,x,y,z)=>add(new THREE.BoxGeometry(w,h,d),m,x,y,z),
  cyl:(r1,r2,h,m,x,y,z,s=16)=>add(new THREE.CylinderGeometry(r1,r2,h,s),m,x,y,z),
  col:(x,z,hw,hd,top,bot=0)=>g.colliders.push([x,z,hw,hd,top,bot]),
  rod:(a,b,r,m,s=6)=>{const A=V(...a),B=V(...b),d=B.clone().sub(A),o=add(new THREE.CylinderGeometry(r,r,d.length(),s),m);o.position.copy(A).addScaledVector(d,.5);o.quaternion.setFromUnitVectors(V(0,1,0),d.normalize());return o},
  tube:(pts,r,m,closed=false,seg=6)=>add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p=>V(...p)),closed),Math.max(12,pts.length*4),r,seg,closed),m),
  // Satteldach als geschlossenes Prisma: First entlang x, Breite d (z), Höhe h, mit Überstand o
  gable:(len,d,h,m,x,y,z,o=.4,ry=0)=>{const s=new THREE.Shape();s.moveTo(-d/2-o,0);s.lineTo(d/2+o,0);s.lineTo(0,h);s.closePath();const geo=new THREE.ExtrudeGeometry(s,{depth:len+2*o,bevelEnabled:false});geo.translate(0,0,-(len+2*o)/2);geo.rotateY(Math.PI/2);const r=add(geo,m,x,y,z);r.rotation.y=ry;return r},
  // Wand mit Rundbogen-Öffnungen (echte Löcher): Breite w, Höhe h, Tiefe t; holes=[[x,breite,kämpferhöhe,unterkante]]
  arched:(w,h,t,holes,m,x,y,z,ry=0)=>{const s=new THREE.Shape();s.moveTo(-w/2,0);s.lineTo(w/2,0);s.lineTo(w/2,h);s.lineTo(-w/2,h);s.closePath();
   for(const [hx,hw,sp,b=0]of holes){const p=new THREE.Path();p.moveTo(hx-hw/2,b);p.lineTo(hx+hw/2,b);p.lineTo(hx+hw/2,sp);p.absarc(hx,sp,hw/2,0,Math.PI,false);p.lineTo(hx-hw/2,b);s.holes.push(p)}
   const geo=new THREE.ExtrudeGeometry(s,{depth:t,bevelEnabled:false,curveSegments:10});geo.translate(0,0,-t/2);const o=add(geo,m,x,y,z);o.rotation.y=ry;return o}};
 return K}

// ---------- Steinzeit: Großer Steinkreis (Stonehenge) ----------
function stonehenge(g){const K=kit(g),sand=M(0x9a9282,{flatShading:true}),blue=M(0x6a7280,{flatShading:true}),grass=M(0x6f8a4a),bank=M(0x7a8a50);
 K.add(new THREE.CylinderGeometry(9.7,9.9,.08,56),grass,0,.04,0);const b=K.add(new THREE.TorusGeometry(9.5,.35,6,56),bank,0,.05,0);b.rotation.x=Math.PI/2;b.scale.z=.6;   // Wall und Graben
 const N=24,R=7.2,rot=i=>((i*7919)%13-6)*.004;
 for(let i=0;i<N;i++){const a=i/N*Math.PI*2,x=Math.sin(a)*R,z=Math.cos(a)*R;if(i===0)continue;   // Lücke als Eingang
  const s=K.box(1.05,4.1,.75,sand,x,2.05,z);s.rotation.set(rot(i),a,rot(i+3));K.col(x,z,.55,.55,4.1)}
 for(let i=0;i<N;i++){if(i===0||i===N-1)continue;const a0=i/N*Math.PI*2,a1=(i+1)/N*Math.PI*2,am=(a0+a1)/2,ch=2*R*Math.sin(Math.PI/N);
  const L=K.box(ch+.9,.55,.8,sand,Math.sin(am)*R*Math.cos(Math.PI/N),4.37,Math.cos(am)*R*Math.cos(Math.PI/N));L.rotation.y=am}   // Decksteine liegen bündig auf
 for(let i=0;i<16;i++){const a=i/16*Math.PI*2;if(Math.cos(a)>.92)continue;const s=K.box(.45,1.7+(i%3)*.2,.35,blue,Math.sin(a)*5.4,.9,Math.cos(a)*5.4);s.rotation.y=a}
 const H=[[-.95,5.2],[-.48,5.9],[0,6.8],[.48,5.9],[.95,5.2]];for(const [k,h]of H){const a=Math.PI+k,r=3.5,x=Math.sin(a)*r,z=Math.cos(a)*r;
  for(const o of[-.6,.6]){const s=K.box(1.0,h,.85,sand,x+Math.cos(a)*o,h/2,z-Math.sin(a)*o);s.rotation.y=a}const t=K.box(2.3,.65,.9,sand,x,h+.32,z);t.rotation.y=a;K.col(x,z,1.2,.6,h+.6)}
 K.box(2.2,.35,.9,blue,0,.18,-.6);const heel=K.box(1.2,3.4,1.0,sand,0,1.65,11.2);heel.rotation.z=.12;for(const sx of[-1,1])K.box(.25,.6,.25,sand,sx*1.4,.3,9.3)}

// ---------- Hallstatt: Fürstengrabhügel mit Steinkranz, Grabkammer-Eingang, Prozessionsweg und Kriegerstatue ----------
function burialMound(g){const K=kit(g),earth=M(0x5f7a3a),stone=M(0x8a8478,{flatShading:true}),statue=M(0xb0a48a,{flatShading:true}),wood=M(0x5a4430);
 const m=new THREE.SphereGeometry(7,40,16,0,Math.PI*2,0,Math.PI/2);m.scale(1,.55,1);K.add(m,earth,0,0,-1.5);K.col(0,-1.5,5.2,5.2,3.8);
 for(let i=0;i<44;i++){const a=i/44*Math.PI*2,s=K.add(new THREE.DodecahedronGeometry(.45,0),stone,Math.sin(a)*7.1,.28,-1.5+Math.cos(a)*7.1);s.rotation.set(i,i*2,0)}
 // Steinerner Eingang zur Grabkammer (Dromos) an der Vorderseite
 for(const sx of[-1,1])K.box(.5,1.6,1.8,stone,sx*.9,.8,4.7);K.box(2.4,.45,2,stone,0,1.82,4.7);K.box(1.3,1.6,.1,M(0x1e1a14),0,.8,3.9);
 for(const sx of[-1,1])for(let i=0;i<8;i++){const z=6.3+i*.5;K.add(new THREE.DodecahedronGeometry(.22,0),stone,sx*1.3,.15,z)}   // Prozessionsweg
 K.box(1.2,.5,1.2,stone,0,.25,9.4);const f=new THREE.Group();f.position.set(0,.5,9.4);g.add(f);const k2=kit(f);   // Kriegerstatue mit Blattkrone und Schild
 k2.cyl(.3,.38,1.2,statue,0,.6,0,10);k2.cyl(.36,.3,.85,statue,0,1.62,0,10);k2.add(new THREE.SphereGeometry(.22,12,10),statue,0,2.25,0);
 for(const sx of[-1,1])k2.add(new THREE.SphereGeometry(.24,10,8),statue,sx*.2,2.55,0).scale.set(.7,1.2,.25);k2.cyl(.34,.34,.06,statue,-.42,1.35,.16,14).rotation.x=Math.PI/2;K.col(0,9.4,.6,.6,3.2);
 for(const sx of[-1,1]){K.cyl(.12,.14,3,wood,sx*2.4,1.5,9.4,8);K.add(new THREE.ConeGeometry(.16,.4,8),wood,sx*2.4,3.2,9.4)}}

// ---------- Römer: Kolosseum ----------
function colosseum(g){const K=kit(g),trav=M(0xd8ccb0),trav2=M(0xc8bc9e),sandM=M(0xd8c090),A=9.3,B=7.6,LH=2.4,N=32,LV=3;
 const P=a=>[Math.sin(a)*A,Math.cos(a)*B];
 for(let lv=0;lv<LV;lv++){const y0=lv*LH;
  for(let i=0;i<N;i++){const a0=i/N*Math.PI*2,a1=(i+1)/N*Math.PI*2,[x0,z0]=P(a0),[x1,z1]=P(a1),cx=(x0+x1)/2,cz=(z0+z1)/2,len=Math.hypot(x1-x0,z1-z0);
   let nx=z1-z0,nz=-(x1-x0);if(nx*cx+nz*cz<0){nx=-nx;nz=-nz}const ry=Math.atan2(nx,nz),ow=len*.58;
   K.arched(len+.08,LH,.9,[[0,ow,LH*.58,lv?.45:0]],trav,cx,y0,cz,ry);   // Wandfeld mit echtem Bogen
   if(lv)K.arched(ow,.45,.1,[],trav2,cx-Math.sin(ry)*.42,y0,cz-Math.cos(ry)*.42,ry);    // Brüstung im Bogen (obere Ränge)
   const c=K.cyl(.2,.22,LH,trav2,x0*1.012,y0+LH/2,z0*1.012,10)}                          // Halbsäulen über den Fugen
  const cor=new THREE.CylinderGeometry(1,1,.28,72,1,true);cor.scale(A+.32,1,B+.32);K.add(cor,DS(trav2),0,y0+LH-.14,0)}
 const at=new THREE.CylinderGeometry(1,1,1.6,72,1,true);at.scale(A,1,B);K.add(at,DS(trav),0,LV*LH+.8,0);
 const at2=new THREE.CylinderGeometry(1,1,1.6,72,1,true);at2.scale(A-.8,1,B-.8);K.add(at2,DS(trav),0,LV*LH+.8,0);
 const top=new THREE.RingGeometry(1,1.1,72);top.rotateX(-Math.PI/2);top.scale(A-.8,1,B-.8);const tr=K.add(top,DS(trav2),0,LV*LH+1.6,0);tr.scale.set(1,1,1);
 for(let i=0;i<N;i+=2){const a=(i+.5)/N*Math.PI*2,[x,z]=P(a);const w=K.box(.5,.55,.95,M(0x3a3028),x,LV*LH+.8,z);w.rotation.y=Math.atan2(x/A/A,z/B/B)}   // Fenster der Attika
 // Zuschauerränge als gestufter Ring (Lathe, elliptisch skaliert), Arena mit Sand
 const prof=[[.44,0],[.44,1.3]];for(let k=0;k<10;k++){const r=.46+k*.051,y=1.3+k*.6;prof.push([r,y],[r+.051,y]);if(k<9)prof.push([r+.051,y+.6])}prof.push([.97,7.4],[.97,0]);
 const sea=new THREE.LatheGeometry(prof.map(([r,y])=>new THREE.Vector2(r,y)),72);sea.scale(A,1,B);K.add(sea,DS(trav),0,0,0);
 const ar=new THREE.CircleGeometry(1,48);ar.rotateX(-Math.PI/2);ar.scale(A*.44,1,B*.44);K.add(ar,sandM,0,.05,0);
 for(let i=0;i<N;i++){const a=(i+.5)/N*Math.PI*2,[x,z]=P(a);if(Math.cos(a)>.93)continue;K.col(x,z,.9,.9,8.6)}}

// ---------- Frühmittelalter: Pfalzkapelle (Aachen) ----------
function palaceChapel(g){const K=kit(g),wall=M(0xd8cfb8),stone=M(0x9a8a72),roof=M(0x4a5a5e,{metalness:.3}),gold=M(0xd4a838,{metalness:.7,roughness:.3}),dk=M(0x2a2420);
 K.add(new THREE.CylinderGeometry(7.2,7.2,5,16),wall,0,2.5,-1);K.col(0,-1,6.4,6.4,6);
 K.add(new THREE.CylinderGeometry(4.75,7.6,1.6,16),roof,0,5.8,-1);                                      // Pultdach über dem Umgang, schließt an den Tambour an
 for(let i=0;i<16;i++){const a=i/16*Math.PI*2+Math.PI/16,w=K.arched(1,1.8,.3,[[0,.7,1.3]],wall,Math.sin(a)*7.1,1.7,-1+Math.cos(a)*7.1,a);K.box(.7,1.4,.05,dk,Math.sin(a)*7.0,2.4,-1+Math.cos(a)*7.0).rotation.y=a}
 K.add(new THREE.CylinderGeometry(4.6,4.6,4.6,8),wall,0,8.8,-1);for(let i=0;i<8;i++){const a=i/8*Math.PI*2+Math.PI/8,w=K.box(.9,1.9,.12,dk,Math.sin(a)*4.3,9,-1+Math.cos(a)*4.3);w.rotation.y=a}
 const d=new THREE.SphereGeometry(4.7,8,10,0,Math.PI*2,0,Math.PI/2);d.scale(1,.8,1);K.add(d,roof,0,11.1,-1);K.cyl(.12,.12,1.6,gold,0,15.6,-1,8);K.box(.8,.12,.12,gold,0,16,-1);
 K.box(6,12,3.4,wall,0,6,7.1);K.box(6.4,.5,3.8,stone,0,12.25,7.1);K.gable(6,3.4,1.6,roof,0,12.5,7.1,.3,Math.PI/2);
 for(const sx of[-1,1]){K.cyl(1.3,1.3,14,wall,sx*3.3,7,7.1,14);K.add(new THREE.ConeGeometry(1.5,3,14),roof,sx*3.3,15.5,7.1);for(let y=3;y<13;y+=3)K.box(.25,.8,.1,dk,sx*3.3,y,8.38)}
 K.arched(2.6,3.6,.3,[[0,1.6,2.6]],stone,0,0,8.85);K.box(1.6,3.2,.1,M(0x5a3a24),0,1.6,8.7);K.col(0,7.1,3,1.7,12);for(const sx of[-1,1])K.col(sx*3.3,7.1,1.3,1.3,14)}

// ---------- Hochmittelalter: Kaiserpfalz – Königshalle (Palas) mit Arkadenfenstern, Freitreppe, Bergfried ----------
function imperialPalace(g){const K=kit(g),st=M(0xa89a82),st2=M(0x8a7e6a),roof=M(0x4a4a52),dark=M(0x2a2420),gold=M(0xd8b030);
 K.box(17,8,7,st,0,4,-3);K.col(0,-3,8.5,3.5,8);K.box(17.4,.4,7.4,st2,0,8.2,-3);K.gable(17,7,3.2,roof,0,8.4,-3,.45);   // geschlossenes Satteldach
 for(const sx of[-1,1]){const s=new THREE.Shape();s.moveTo(-3.5,0);s.lineTo(3.5,0);s.lineTo(0,3.2);s.closePath();const gg=new THREE.ExtrudeGeometry(s,{depth:.4,bevelEnabled:false});gg.rotateY(Math.PI/2);K.add(gg,st,sx*8.5-(sx>0?.4:0),8.4,-3)}   // Giebelwände
 // Arkadenfenster (Biforien) als echte Öffnungen in einer Vorsatzschale vor dunklem Raum
 for(let i=0;i<6;i++){const x=-6.25+i*2.5;K.arched(2.3,2.6,.35,[[-.45,.7,1.9],[.45,.7,1.9]],st,x,4.2,.68);K.box(1.9,2.2,.1,dark,x,5.3,.48);K.cyl(.09,.09,1.9,st2,x,5.15,.68,8)}
 K.box(17.1,.3,.5,st2,0,4.05,.6);for(let i=0;i<6;i++)K.box(.6,1.2,.15,dark,-6.25+i*2.5,1.8,.56);
 // Freitreppe zum Portal im Obergeschoss
 for(let i=0;i<9;i++)K.box(3.6,.45,.7,st2,0,.22+i*.45,4.6-i*.6+.0);K.box(3.6,.4,1.1,st2,0,4.0,.95);K.arched(3,3.6,.4,[[0,1.6,2.6]],st,0,4.2,.65);K.box(1.6,3.2,.1,M(0x5a3a24),0,5.8,.48);
 // Bergfried mit Zinnen und Fahne
 K.box(5,20,5,st,-6,10,5.5);K.col(-6,5.5,2.5,2.5,20);K.box(5.6,.5,5.6,st2,-6,20.25,5.5);
 for(let i=0;i<5;i++)for(const [dx,dz,rw,rd]of[[-2.6+i*1.3,-2.6,.65,.35],[-2.6+i*1.3,2.6,.65,.35],[-2.6,-2.6+i*1.3,.35,.65],[2.6,-2.6+i*1.3,.35,.65]])K.box(rw,.9,rd,st,-6+dx,20.95,5.5+dz);
 for(let y=4;y<18;y+=3.5)K.box(.4,1.2,.1,dark,-6,y,8.02);K.box(.08,4,.08,dark,-6,23,5.5);K.box(1.6,1,.04,gold,-5.2,24.3,5.5)}

// ---------- Spätmittelalter: Stadttor mit Doppeltürmen (Holstentor) ----------
function cityGate(g){const K=kit(g),brick=M(0x8a3a2a),brick2=M(0x6e2c20),roof=M(0x2e3a3a),glaze=M(0x1a1a1a);
 K.arched(7,10,6,[[0,3.6,3.2]],brick,0,0,0);K.col(-2.8,0,.7,3,10);K.col(2.8,0,.7,3,10);K.col(0,0,3.5,3,10,5);   // Torbau mit echter Durchfahrt
 K.box(3.4,.2,6.1,M(0x5a5048),0,.02,0);for(let y=1.6;y<10;y+=1.1)for(const sz of[-1,1])K.box(7.04,.14,.05,brick2,0,y,sz*3.02);
 for(const sz of[-1,1])for(const x of[-2,0,2])K.arched(1,1.6,.1,[[0,.5,1.1,.2]],brick2,x,6.6,sz*3.06);
 K.gable(7,6,4.2,roof,0,10,0,.35,Math.PI/2);                                                            // geschlossenes Dach, Giebel nach vorn und hinten
 for(const sz of[-1,1]){const s=new THREE.Shape();s.moveTo(-3.5,0);s.lineTo(3.5,0);for(let k=0;k<4;k++){s.lineTo(3.5-k*.875,1+k*.8);s.lineTo(3.5-(k+1)*.875,1+k*.8)}s.lineTo(0,4.6);s.lineTo(-3.5,0);
  const gg=new THREE.ExtrudeGeometry(s,{depth:.4,bevelEnabled:false});gg.translate(0,0,sz>0?3:-3.4);K.add(gg,brick,0,10,0)}               // Treppengiebel (Backsteingotik)
 for(const sx of[-1,1]){K.cyl(3,3.2,14,brick,sx*5.2,7,0,24);K.col(sx*5.2,0,2.9,2.9,14);K.add(new THREE.ConeGeometry(3.45,6.5,24),roof,sx*5.2,17.25,0);K.cyl(3.3,3.3,.35,brick2,sx*5.2,14,0,24);
  for(let y=3;y<13;y+=2.4)for(const a of[-.55,0,.55]){const w=K.box(.5,.9,.3,glaze,sx*5.2+Math.sin(a)*3.06,y,Math.cos(a)*3.06);w.rotation.y=a}}}

// ---------- Renaissance: Kuppeldom (Florenz) ----------
function domeCathedral(g){const K=kit(g),marble=M(0xece6d8),green=M(0x4a6a4a),red=M(0xb0503a),rib=M(0xf0ece2),dk=M(0x2a2a2a);
 K.box(8,9,9,marble,0,4.5,4.5);K.col(0,4.5,4,4.5,9);K.gable(9,8,2.6,red,0,9,4.5,.3,Math.PI/2);
 for(const x of[-4.02,4.02])for(let z=0;z<9;z+=2.25)K.box(.06,9,.2,green,x,4.5,z+1.1);for(let y=2;y<9;y+=3.2)for(const x of[-4.02,4.02])K.box(.06,.18,9,green,x,y,4.5);
 const s=new THREE.Shape();s.moveTo(-4,0);s.lineTo(4,0);s.lineTo(0,2.6);s.closePath();const fg=new THREE.ExtrudeGeometry(s,{depth:.3,bevelEnabled:false});fg.translate(0,9,9);K.add(fg,marble);
 K.add(new THREE.CircleGeometry(1.1,24),dk,0,6.6,9.03);const rr=K.add(new THREE.TorusGeometry(1.15,.12,6,24),green,0,6.6,9.05);K.arched(2.6,3.8,.3,[[0,1.6,2.6]],marble,0,0,9.1);K.box(1.6,3.4,.1,M(0x5a3a24),0,1.7,9);
 K.add(new THREE.CylinderGeometry(6,6,8,8),marble,0,4,-4);K.col(0,-4,5.6,5.6,8);K.add(new THREE.CylinderGeometry(6.3,6.3,.4,8),green,0,8.2,-4);
 K.add(new THREE.CylinderGeometry(4.6,4.6,3.2,8),marble,0,10,-4);for(let i=0;i<8;i++){const a=i/8*Math.PI*2+Math.PI/8,w=K.add(new THREE.CircleGeometry(.6,16),dk,Math.sin(a)*4.3,10,-4+Math.cos(a)*4.3);w.rotation.y=a}
 const prof=[[4.6,0],[4.5,1.8],[4,3.6],[3,5.2],[1.6,6.4],[.75,6.8],[0,6.85]];const d=new THREE.LatheGeometry(prof.map(p=>new THREE.Vector2(p[0],p[1])),8);d.rotateY(Math.PI/8);d.translate(0,11.6,-4);K.add(d,red);
 for(let i=0;i<8;i++){const a=i/8*Math.PI*2,rad=Math.cos(Math.PI/8);K.tube(prof.slice(0,6).map(([r,y])=>[Math.sin(a)*r*rad*1.01,11.6+y,-4+Math.cos(a)*r*rad*1.01]),.13,rib)}
 K.cyl(.75,.85,1.6,marble,0,19.2,-4,8);K.add(new THREE.ConeGeometry(.85,1.5,8),marble,0,20.75,-4);K.add(new THREE.SphereGeometry(.3,10,8),M(0xd4a838,{metalness:.7}),0,21.7,-4)}

// ---------- Barock: Lustschloss mit Orangerie, Kuppelpavillon, Parterre und Fontäne ----------
function pleasurePalace(g){const K=kit(g),ochre=M(0xe0c890),white=M(0xf0ece2),roof=M(0x5a6a6e),hedge=M(0x2f5a2a),gravel=M(0xd8c8a0),water=M(0x4f8aa0,{roughness:.1,metalness:.3,transparent:true,opacity:.85});
 // Flügel mit echten Rundbogenfenstern (Fensterglas dahinter), Mansarddach als Prisma
 K.arched(18,6,.5,[...[-7.5,-5.5,-3.5,3.5,5.5,7.5].map(x=>[x,1.2,3.6,1])],ochre,0,0,-4.75);K.box(18,6,3.4,ochre,0,3,-6.7);K.box(17.6,4.4,.05,M(0x2a3a44),0,3,-5.05);K.col(0,-6.2,9,2.2,6);
 for(const x of[-8.5,-6.5,-4.5,4.5,6.5,8.5])K.box(.3,6,.6,white,x,3,-4.7);K.box(18.4,.5,4.6,white,0,6.25,-6.2);K.gable(18,4.4,2,roof,0,6.5,-6.2,.2);
 // Mittelpavillon mit Portal, Dreiecksgiebel und Kuppel
 K.box(4.4,9,5.2,ochre,0,4.5,-5.9);K.arched(3,4.6,.3,[[0,1.6,3.2]],white,0,0,-3.2);K.box(1.6,4,.1,M(0x5a3a24),0,2,-3.4);
 const tri=new THREE.Shape();tri.moveTo(-2.4,0);tri.lineTo(2.4,0);tri.lineTo(0,1.3);tri.closePath();const tg=new THREE.ExtrudeGeometry(tri,{depth:.4,bevelEnabled:false});tg.translate(0,9,-3.5);K.add(tg,white);
 K.cyl(2.3,2.3,1.2,white,0,9.6,-5.9,24);const d=new THREE.SphereGeometry(2.3,24,12,0,Math.PI*2,0,Math.PI/2);d.scale(1,1.2,1);K.add(d,roof,0,10.2,-5.9);K.cyl(.15,.15,1.4,M(0xd4a838,{metalness:.7}),0,13.6,-5.9,8);
 // Parterre und Fontäne mit Wasserstrahl
 for(const sx of[-1,1]){K.box(5,.5,6,hedge,sx*5.5,.25,2.6);K.box(3.8,.52,4.8,gravel,sx*5.5,.26,2.6);K.box(.3,.54,4.8,hedge,sx*5.5,.27,2.6)}
 K.add(new THREE.CylinderGeometry(3.2,3.4,.6,40),white,0,.3,3);K.col(0,3,3.2,3.2,.6);K.add(new THREE.CircleGeometry(3,40).rotateX(-Math.PI/2),water,0,.56,3);
 K.cyl(.4,.6,1.6,white,0,1.2,3,12);K.add(new THREE.SphereGeometry(.5,12,8),white,0,2.1,3);K.add(new THREE.CylinderGeometry(.05,.16,4.2,8),M(0xd8eef8,{transparent:true,opacity:.6}),0,4.6,3);
 for(const sx of[-1,1])for(const z of[-1.6,8])K.add(new THREE.ConeGeometry(.5,2.2,10),hedge,sx*8.4,1.1,z)}

// ---------- Napoleon: Triumphbogen mit drei echten Durchgängen ----------
function triumphArch(g){const K=kit(g),st=M(0xe2d8c0),st2=M(0xcabea4),rel=M(0xb8ac90);
 K.arched(15,13,6,[[0,5,6.5],[-5.4,2.2,4.2],[5.4,2.2,4.2]],st,0,0,0);
 for(const x of[-7.3,-3.2,3.2,7.3])K.col(x,0,.5,3,13);K.col(0,0,7.5,3,13,9);
 for(const sz of[-1,1]){for(const x of[-6.9,-3.6,3.6,6.9]){K.cyl(.35,.38,8.6,st2,x,4.3,sz*3.25,14);K.box(.9,.4,.9,st2,x,.2,sz*3.25);K.box(1,.5,1,st2,x,8.85,sz*3.25)}   // Säulen vor den Pfeilern
  for(const x of[-5.4,5.4])K.box(2.4,2.2,.15,rel,x,7,sz*3.08);K.box(4.4,1.6,.15,rel,0,11.4,sz*3.08)}                                    // Reliefs
 K.box(15.6,.6,6.6,st2,0,13.3,0);K.box(15,3,6,st,0,15.1,0);K.box(13,1,.12,rel,0,15.2,3.06);K.box(13,1,.12,rel,0,15.2,-3.06);K.box(15.8,.5,6.8,st2,0,16.85,0);
 const q=new THREE.Group();q.position.set(0,17.1,0);g.add(q);const kq=kit(q),bz=M(0x4a6a5a,{metalness:.5,roughness:.5});kq.box(3.2,1,1.6,bz,0,.5,0);for(let i=0;i<4;i++){kq.box(.4,1.3,1.1,bz,-1.2+i*.8,1.55,.2)}kq.box(.5,1.6,.5,bz,0,2,-.3)}   // Quadriga-Andeutung

// ---------- Neuzeit: Eiserner Aussichtsturm ----------
function ironTower(g){const K=kit(g),iron=M(0x6a5240,{metalness:.55,roughness:.5}),dk=M(0x3a2e24,{metalness:.6}),glass=M(0x9ab0c0,{metalness:.3,roughness:.2});
 const H=28,S=t=>.75+6.3*Math.pow(1-t,2.2),W=t=>.18+.62*(1-t);       // Abstand der Beinmitte, halbe Beinbreite
 const legs=[[-1,-1],[1,-1],[1,1],[-1,1]],T=[0,.08,.16,.25,.34,.43,.52,.61,.7,.8,.9,1];
 for(const [sx,sz]of legs){K.col(sx*S(0),sz*S(0),1,1,6);K.box(2.2,.6,2.2,M(0x8a8478),sx*S(0),.3,sz*S(0));                               // Steinsockel
  const C=(t,cx,cz)=>[sx*S(t)+cx*W(t),t*H+.6,sz*S(t)+cz*W(t)],cs=[[-1,-1],[1,-1],[1,1],[-1,1]];
  for(const [cx,cz]of cs)K.tube(T.map(t=>C(t,cx,cz)),.09,iron);                                                                         // vier Eckstiele je Bein
  for(let i=0;i<T.length-1;i++)for(let f=0;f<4;f++){const [ax,az]=cs[f],[bx,bz]=cs[(f+1)%4];K.rod(C(T[i],ax,az),C(T[i+1],bx,bz),.04,dk,4);K.rod(C(T[i+1],ax,az),C(T[i],bx,bz),.04,dk,4)}}   // Andreaskreuze
 // Zierbögen zwischen den Beinen (jede Seite)
 for(let f=0;f<4;f++){const [ax,az]=legs[f],[bx,bz]=legs[(f+1)%4],pts=[];for(let i=0;i<=16;i++){const u=i/16,y=1.2+Math.sin(u*Math.PI)*3.6,t=(y-.6)/H,s=S(t);pts.push([(ax+(bx-ax)*u)*s,y,(az+(bz-az)*u)*s])}K.tube(pts,.2,iron)}
 for(const t of[.2,.5]){const y=t*H+.6,w=S(t)+W(t)+.5;K.box(2*w,.35,2*w,dk,0,y,0);for(const s of[-1,1]){K.box(2*w,.08,.06,iron,0,y+1,s*w);K.box(.06,.08,2*w,iron,s*w,y+1,0);for(let k=0;k<=8;k++){const u=-w+k*w/4;K.box(.06,1,.06,iron,u,y+.5,s*w);K.box(.06,1,.06,iron,s*w,y+.5,u)}}
  if(t===.2)for(const s of[-1,1])K.box(2*w-.6,1.6,.05,glass,0,y+1,s*(w-.3))}   // Restaurant auf der ersten Plattform
 const y3=H+.6;K.box(2.6,1.8,2.6,dk,0,y3+.9,0);K.box(2.65,.9,2.65,glass,0,y3+1.1,0);K.box(3,.2,3,iron,0,y3+1.9,0);K.add(new THREE.ConeGeometry(.6,3.6,8),iron,0,y3+3.8,0);
 K.box(.05,2,.05,dk,0,y3+6.3,0);K.box(1.2,.7,.03,M(0xb8201c),.6,y3+6.9,0)}

const BUILD={steinzeit:stonehenge,hallstatt:burialMound,roemer:colosseum,fruehmittelalter:palaceChapel,hochmittelalter:imperialPalace,spaetmittelalter:cityGate,renaissance:domeCathedral,barock:pleasurePalace,napoleon:triumphArch,neuzeit:ironTower};
export function buildWonder(era,H={}){const g=new THREE.Group();g.colliders=[];g.walkAreas=[];(BUILD[era]||imperialPalace)(g,H);g.isWonder=true;return g}
