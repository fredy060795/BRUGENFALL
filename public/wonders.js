// Wahrzeichen je Epoche: ein Prachtbau pro Welt (Bauplatz 20 × 20 m, Mitte = Ursprung, Eingang Richtung +z).
// Jede Funktion baut in eine Gruppe; Kollisionen als [x,z,halbeBreite,halbeTiefe,oben,unten] in g.colliders.
import * as THREE from 'three';

const MAT=new Map(),M=(c,o={})=>{const k=c+JSON.stringify(o);if(!MAT.has(k))MAT.set(k,new THREE.MeshStandardMaterial({color:c,roughness:.85,...o}));return MAT.get(k)};
function kit(g){const add=(geo,m,x=0,y=0,z=0)=>{const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;g.add(o);return o};
 return{add,box:(w,h,d,m,x,y,z)=>add(new THREE.BoxGeometry(w,h,d),m,x,y,z),cyl:(r1,r2,h,m,x,y,z,s=16)=>add(new THREE.CylinderGeometry(r1,r2,h,s),m,x,y,z),
  col:(x,z,hw,hd,top,bot=0)=>g.colliders.push([x,z,hw,hd,top,bot])}}

// Steinzeit: Stonehenge – äußerer Kreis aus Trilithen mit Deckstein-Ring, innere Hufeisen-Trilithen, Altarstein
function stonehenge(g,H){const {box,add,col}=kit(g),sand=M(0x9a9282,{flatShading:true}),blue=M(0x6a7280,{flatShading:true});
 add(new THREE.CylinderGeometry(9.6,9.8,.08,48),M(0x6f8a4a),0,.04,0);
 const N=24,R=7.2;for(let i=0;i<N;i++){const a=i/N*Math.PI*2,x=Math.sin(a)*R,z=Math.cos(a)*R,s=box(1.0,4.1,.7,sand,x,2.05,z);s.rotation.y=a;col(x,z,.5,.5,4.1);
  const L=box(2*R*Math.sin(Math.PI/N)+.15,.55,.75,sand,Math.sin(a+Math.PI/N)*R*Math.cos(Math.PI/N),4.37,Math.cos(a+Math.PI/N)*R*Math.cos(Math.PI/N));L.rotation.y=a+Math.PI/N}
 for(let i=0;i<14;i++){const a=i/14*Math.PI*2,b=box(.45,1.8,.35,blue,Math.sin(a)*5.4,.9,Math.cos(a)*5.4);b.rotation.y=a}
 for(let i=0;i<5;i++){const a=(-.9+i*.45)*Math.PI*.55-Math.PI,r=3.4,x=Math.sin(a)*r,z=Math.cos(a)*r,h=5+(i===2?1.6:i%2?0:.8);
  for(const o of[-.65,.65]){const s=box(1.0,h,.8,sand,x+Math.cos(a)*o,h/2,z-Math.sin(a)*o);s.rotation.y=a}const t=box(2.4,.6,.85,sand,x,h+.3,z);t.rotation.y=a;col(x,z,1.3,.6,h+.6)}
 box(2.2,.35,.9,blue,0,.18,-.6);const heel=box(1.2,3.2,1.0,sand,0,1.6,11);heel.rotation.z=.12}   // Altarstein, Fersenstein vor dem Eingang

// Hallstatt: Fürstengrabhügel mit Steinkranz, Prozessionsgraben, Kriegerstatue (Glauberg)
function burialMound(g,H){const {add,box,cyl,col}=kit(g),earth=M(0x5f7a3a),stone=M(0x8a8478,{flatShading:true}),statue=M(0xb0a48a,{flatShading:true});
 const m=new THREE.SphereGeometry(7,32,14,0,Math.PI*2,0,Math.PI/2);m.scale(1,.55,1);add(m,earth,0,0,-1);col(0,-1,5,5,3.6);
 for(let i=0;i<36;i++){const a=i/36*Math.PI*2,s=add(new THREE.DodecahedronGeometry(.42,0),stone,Math.sin(a)*7.2,.25,-1+Math.cos(a)*7.2);s.rotation.set(i,i*2,0)}
 for(const sx of[-1,1])for(let i=0;i<6;i++){const z=6.5+i*.6;add(new THREE.DodecahedronGeometry(.25,0),stone,sx*1.4,.15,z)}   // Prozessionsweg
 box(1.2,.5,1.2,stone,0,.25,7.6);const f=new THREE.Group();f.position.set(0,.5,7.6);g.add(f);const k2=kit(f);
 k2.cyl(.28,.35,1.1,statue,0,.55,0,10);k2.cyl(.34,.28,.8,statue,0,1.5,0,10);k2.add(new THREE.SphereGeometry(.2,12,10),statue,0,2.15,0);
 for(const sx of[-1,1])k2.add(new THREE.SphereGeometry(.22,10,8),statue,sx*.18,2.42,0).scale.set(.7,1.2,.25);   // Blattkrone
 k2.cyl(.32,.32,.06,statue,-.4,1.3,.15,14).rotation.x=Math.PI/2;col(0,7.6,.6,.6,3)}

// Römer: Kolosseum – elliptisches Amphitheater mit drei Bogenreihen und Attika, Sitzstufen, Arena
function colosseum(g,H){const {add,box,col}=kit(g),trav=M(0xd8ccb0),dark=M(0x3a3028),sandM=M(0xd8c090);
 const A=9.4,B=7.6,levels=3,LH=2.4,N=36;
 for(let lv=0;lv<levels;lv++)for(let i=0;i<N;i++){const a0=i/N*Math.PI*2,a1=(i+1)/N*Math.PI*2,am=(a0+a1)/2,x=Math.sin(am)*A,z=Math.cos(am)*B,len=Math.hypot(Math.sin(a1)*A-Math.sin(a0)*A,Math.cos(a1)*B-Math.cos(a0)*B),ry=Math.atan2(Math.cos(a1)*B-Math.cos(a0)*B,-(Math.sin(a1)*A-Math.sin(a0)*A))+Math.PI/2,y0=lv*LH;
  const p=box(.32,LH,.9,trav,x+Math.sin(a0)*0-(x-Math.sin(a0)*A)*0,y0+LH/2,z);p.position.set(Math.sin(a0)*A,y0+LH/2,Math.cos(a0)*B);p.rotation.y=ry;                // Pfeiler
  const lin=box(len,.3,.9,trav,x,y0+LH-.15,z);lin.rotation.y=ry;                                                                             // Gebälk
  const arch=new THREE.Mesh(new THREE.TorusGeometry(len*.36,.09,5,10,Math.PI),trav);arch.position.set(x,y0+LH-.5,z);arch.rotation.y=ry;g.add(arch);
  const hole=box(len*.7,LH*.55,.2,dark,x*.985,y0+LH*.38,z*.985);hole.rotation.y=ry}
 for(let i=0;i<N;i++){const a0=i/N*Math.PI*2,a1=(i+1)/N*Math.PI*2,am=(a0+a1)/2,len=Math.hypot(Math.sin(a1)*A-Math.sin(a0)*A,Math.cos(a1)*B-Math.cos(a0)*B),ry=Math.atan2(Math.cos(a1)*B-Math.cos(a0)*B,-(Math.sin(a1)*A-Math.sin(a0)*A))+Math.PI/2;
  const at=box(len+.05,1.4,.9,trav,Math.sin(am)*A,levels*LH+.7,Math.cos(am)*B);at.rotation.y=ry;if(i%3===0){const w=box(.4,.5,.95,dark,Math.sin(am)*A,levels*LH+.7,Math.cos(am)*B);w.rotation.y=ry}}
 for(let k=0;k<6;k++){const s=new THREE.CylinderGeometry(1,1,.5,48,1,true);s.scale(A-1-k*.8,1,B-1-k*.8);const m=add(s,trav,0,7.2-k*1.1,0);m.material=trav.clone();m.material.side=THREE.DoubleSide;
  const ring=new THREE.RingGeometry(1,1.12,48);ring.rotateX(-Math.PI/2);ring.scale(A-1.4-k*.8,1,B-1.4-k*.8);add(ring,M(0xc8bca0,{side:THREE.DoubleSide}),0,7.45-k*1.1,0)}
 const ar=new THREE.CircleGeometry(1,40);ar.rotateX(-Math.PI/2);ar.scale(A-5.4,1,B-5.4);add(ar,sandM,0,.06,0);
 for(let i=0;i<N;i++){const a=i/N*Math.PI*2;if(Math.abs(Math.sin(a))>.2||Math.cos(a)<0)col(Math.sin(a)*A,Math.cos(a)*B,.7,.7,8.6)}}   // Eingang auf der +z-Seite frei

// Frühmittelalter: Pfalzkapelle – achteckiger Zentralbau mit Kuppel, Umgang und Westwerk
function palaceChapel(g,H){const {add,box,cyl,col}=kit(g),wall=M(0xd8cfb8),stone=M(0x9a8a72),roof=M(0x4a5a5e,{metalness:.3}),gold=M(0xd4a838,{metalness:.7,roughness:.3});
 add(new THREE.CylinderGeometry(7.6,7.6,5,16),wall,0,2.5,0);add(new THREE.CylinderGeometry(8.1,7.6,.8,16),roof,0,5.4,0);col(0,0,6.6,6.6,6);
 add(new THREE.CylinderGeometry(4.6,4.6,4.5,8),wall,0,7.6,0);for(let i=0;i<8;i++){const a=i/8*Math.PI*2+Math.PI/8,w=box(.9,1.8,.2,M(0x2a2420),Math.sin(a)*4.6,8,Math.cos(a)*4.6);w.rotation.y=a}
 const d=new THREE.SphereGeometry(4.8,8,8,0,Math.PI*2,0,Math.PI/2);d.scale(1,.75,1);add(d,roof,0,9.85,0);cyl(.12,.12,1.6,gold,0,14.2,0,8);box(.8,.12,.12,gold,0,14.6,0);
 box(6,12,3.2,wall,0,6,8.4);box(6.4,.6,3.6,stone,0,12.3,8.4);for(const sx of[-1,1]){cyl(1.3,1.3,14,wall,sx*3.3,7,8.4,12);add(new THREE.ConeGeometry(1.5,3,12),roof,sx*3.3,15.5,8.4)}
 box(2.2,3.6,.3,M(0x3a2a1e),0,1.8,10.05);col(0,8.4,3,1.6,12)}

// Hochmittelalter: Kaiserpfalz – lange Königshalle mit Arkadenfenstern, Freitreppe, Bergfried
function imperialPalace(g,H){const {box,add,cyl,col}=kit(g),st=H.stone||M(0x9a9282),roof=H.slate||M(0x4a4a52),dark=M(0x2a2420);
 box(17,8,7,st,0,4,-2);col(0,-2,8.5,3.5,8);for(const sz of[-1,1]){const r=box(17.4,.4,4.6,roof,0,10.1,-2+sz*1.7);r.rotation.x=sz*.75}
 for(let i=0;i<7;i++){const x=-7+i*2.33;for(const dx of[-.35,.35])box(.45,1.6,.2,dark,x+dx,5.4,1.55);cyl(.09,.09,1.6,st,x,5.4,1.6,8)}   // Arkadenfenster (Biforien)
 for(let i=0;i<6;i++)box(5-i*.2,.4,.8,st,0,.2+i*.4,2.5+(5-i)*.75);box(2,3,.3,M(0x5a3a24),0,3.9,1.6);   // Freitreppe, Portal
 box(5,20,5,st,-6,10,6);col(-6,6,2.5,2.5,20);for(let i=0;i<8;i++){const a=i/8,x=-6+(a<.25?-2.5+a*20:a<.5?2.5:a<.75?2.5-(a-.5)*20:-2.5),z=6+(a<.25?2.5:a<.5?2.5-(a-.25)*20:a<.75?-2.5:-2.5+(a-.75)*20);box(.8,1,.8,st,x,20.5,z)}
 const fl=box(.06,3,.06,dark,-6,22,6);box(1.4,.9,.03,M(0xd8b030),-5.3,23,6)}

// Spätmittelalter: Stadttor mit zwei Rundtürmen (Holstentor) in Backstein mit Spitzhelmen
function cityGate(g,H){const {box,add,cyl,col}=kit(g),brick=M(0x8a3a2a),dark=M(0x2a1a14),roof=M(0x2e3a3a),glaze=M(0x1a1a1a);
 box(7,10,6,brick,0,5,0);col(0,0,3.5,3,10,4.5);col(-3.2,0,.3,3,4.5);col(3.2,0,.3,3,4.5);
 const arch=new THREE.Shape();arch.moveTo(-2,0);arch.lineTo(2,0);arch.lineTo(2,3);arch.quadraticCurveTo(0,5.2,-2,3);arch.lineTo(-2,0);const ag=new THREE.ExtrudeGeometry(arch,{depth:6.2,bevelEnabled:false});ag.translate(0,0,-3.1);add(ag,dark);
 for(const sx of[-1,1]){cyl(3,3.2,14,brick,sx*5.2,7,0,20);col(sx*5.2,0,3,3,14);add(new THREE.ConeGeometry(3.4,6,20),roof,sx*5.2,17,0);for(let y=3;y<13;y+=2.4)for(const a of[-.5,.5])add(new THREE.BoxGeometry(.5,.9,.3),glaze,sx*5.2+Math.sin(a)*3.05,y,Math.cos(a)*3.05)}
 for(let y=6;y<10;y+=1.6)for(const x of[-2,0,2])box(.6,.9,.2,glaze,x,y,3.05);for(let y=1.5;y<10;y+=.9)box(7.05,.12,6.05,M(0x1e1e1e),0,y,0);
 const gab=new THREE.Shape();gab.moveTo(-3.5,0);gab.lineTo(3.5,0);gab.lineTo(0,4);gab.closePath();const gg=new THREE.ExtrudeGeometry(gab,{depth:.6,bevelEnabled:false});gg.translate(0,10,2.6);add(gg,brick);box(7.2,.3,6.2,roof,0,10.1,0)}

// Renaissance: Kuppeldom – Langhaus, achteckiger Tambour, Doppelschalenkuppel mit Rippen und Laterne
function domeCathedral(g,H){const {box,add,cyl,col}=kit(g),marble=M(0xece6d8),green=M(0x4a6a4a),red=M(0xb0503a),rib=M(0xf0ece2);
 box(8,9,10,marble,0,4.5,4);col(0,4,4,5,9);for(const x of[-4.02,4.02])for(let z=0;z<10;z+=2.5)box(.05,9,.18,green,x,4.5,z-1);
 add(new THREE.CylinderGeometry(6,6,8,8),marble,0,4,-4);col(0,-4,5.5,5.5,8);add(new THREE.CylinderGeometry(4.6,4.6,3.2,8),marble,0,9.6,-4);
 for(let i=0;i<8;i++){const a=i/8*Math.PI*2+Math.PI/8,w=add(new THREE.CircleGeometry(.6,16),M(0x2a2a2a),Math.sin(a)*4.62,9.7,-4+Math.cos(a)*4.62);w.rotation.y=a}
 const d=new THREE.LatheGeometry([[4.6,0],[4.5,1.8],[4,3.6],[3,5.2],[1.6,6.4],[.7,6.8],[0,6.9]].map(p=>new THREE.Vector2(p[0],p[1])),8);d.translate(0,11.2,-4);add(d,red);
 for(let i=0;i<8;i++){const a=i/8*Math.PI*2,pts=[[4.6,0],[4.5,1.8],[4,3.6],[3,5.2],[1.6,6.4],[.7,6.8]].map(([r,y])=>new THREE.Vector3(Math.sin(a)*r*1.01,11.2+y,-4+Math.cos(a)*r*1.01));add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),12,.12,5,false),rib)}
 cyl(.7,.8,1.6,marble,0,18.8,-4,8);add(new THREE.ConeGeometry(.8,1.4,8),marble,0,20.3,-4);add(new THREE.SphereGeometry(.3,10,8),M(0xd4a838,{metalness:.7}),0,21.2,-4);
 const tri=new THREE.Shape();tri.moveTo(-4,0);tri.lineTo(4,0);tri.lineTo(0,2.4);tri.closePath();const tg=new THREE.ExtrudeGeometry(tri,{depth:.4,bevelEnabled:false});tg.translate(0,9,8.8);add(tg,marble);add(new THREE.CircleGeometry(1,20),M(0x2a2a2a),0,6.5,9.05)}

// Barock: Lustschloss – Orangerie mit Rundbogenfenstern, Mittelpavillon mit Kuppel, Parterre mit großer Fontäne
function pleasurePalace(g,H){const {box,add,cyl,col}=kit(g),ochre=M(0xe0c890),white=M(0xf0ece2),roof=M(0x5a6a6e),hedge=M(0x2f5a2a),water=M(0x4f8aa0,{roughness:.1,metalness:.3,transparent:true,opacity:.85});
 box(18,6,4,ochre,0,3,-7);col(0,-7,9,2,6);box(18.4,.5,4.4,white,0,6.2,-7);for(const sz of[-1,1]){const r=box(18.4,.3,2.6,roof,0,7.1,-7+sz*1.1);r.rotation.x=sz*.7}
 for(let i=0;i<9;i++){const x=-8+i*2;if(Math.abs(x)<1)continue;box(1.1,3,.2,M(0x2a3a44),x,3,-4.95);add(new THREE.CircleGeometry(.55,12,0,Math.PI),M(0x2a3a44),x,4.5,-4.94);box(.25,6,.25,white,x+1,3,-4.95)}
 box(4,9,5,ochre,0,4.5,-6.5);const d=new THREE.SphereGeometry(2.2,16,10,0,Math.PI*2,0,Math.PI/2);d.scale(1,1.2,1);add(d,roof,0,9,-6.5);cyl(.15,.15,1.4,M(0xd4a838,{metalness:.7}),0,12.2,-6.5,8);
 for(const [x,z,w,dd]of[[-5.5,1,5,6],[5.5,1,5,6]]){box(w,.6,dd,hedge,x,.3,z);box(w-1.2,.65,dd-1.2,M(0xd8c8a0),x,.3,z)}   // Parterre mit Kieswegen
 add(new THREE.CylinderGeometry(3.2,3.4,.6,32),white,0,.3,3);col(0,3,3.2,3.2,.6);add(new THREE.CircleGeometry(3,32).rotateX(-Math.PI/2),water,0,.55,3);
 cyl(.4,.6,1.6,white,0,1.2,3,12);add(new THREE.SphereGeometry(.5,12,8),white,0,2.1,3);const jet=add(new THREE.CylinderGeometry(.06,.18,4.5,8),M(0xd8eef8,{transparent:true,opacity:.6}),0,4.5,3);
 for(const sx of[-1,1])for(const z of[-2,8])add(new THREE.ConeGeometry(.5,2,8),hedge,sx*8,1,z)}

// Napoleon: Triumphbogen – Hauptbogen, Seitendurchgänge, Attika mit Inschriftband, Reliefgruppen
function triumphArch(g,H){const {box,add,col}=kit(g),st=M(0xe2d8c0),dark=M(0x2a2420),rel=M(0xc8bca0);
 for(const sx of[-1,1]){box(5,13,6,st,sx*5,6.5,0);col(sx*5,0,2.5,3,13);const side=new THREE.Shape();side.moveTo(-1,0);side.lineTo(1,0);side.lineTo(1,3.5);side.absarc(0,3.5,1,0,Math.PI,false);side.closePath();const sg=new THREE.ExtrudeGeometry(side,{depth:5.2,bevelEnabled:false});sg.rotateY(Math.PI/2);sg.translate(sx*5-2.6,0,0);add(sg,dark);
  for(const sz of[-1,1]){const r=box(3,4,.4,rel,sx*5,5,sz*3.1);for(let i=0;i<3;i++)add(new THREE.CylinderGeometry(.22,.26,1.6,8),rel,sx*5-.9+i*.9,5,sz*3.3)}}
 box(5,4,6,st,0,11,0);col(0,0,2.5,3,13,9);const arch=new THREE.Shape();arch.moveTo(-2.5,0);arch.lineTo(2.5,0);arch.lineTo(2.5,6.5);arch.absarc(0,6.5,2.5,0,Math.PI,false);arch.closePath();const ag=new THREE.ExtrudeGeometry(arch,{depth:6.2,bevelEnabled:false});ag.translate(0,0,-3.1);add(ag,dark);
 box(15.4,.6,6.4,st,0,13.3,0);box(15,3,6,st,0,15.1,0);box(14,.9,.1,rel,0,15.2,3.05);box(15.6,.5,6.6,st,0,16.8,0);for(let i=0;i<14;i++)add(new THREE.SphereGeometry(.18,8,6),rel,-6.5+i,14.2,3.1)}

// Neuzeit: eiserner Aussichtsturm – vier geneigte Fachwerkbeine, Bögen, zwei Plattformen, Spitze mit Fahne
function ironTower(g,H){const {box,add,col}=kit(g),iron=M(0x5a4a3a,{metalness:.6,roughness:.5}),dk=M(0x3a2e24,{metalness:.6});
 const leg=(t)=>(1-t)**1.8*7+.6,Hh=30,lv=[0,9,18,27];
 for(const [sx,sz]of[[-1,-1],[1,-1],[1,1],[-1,1]]){const pts=[];for(let i=0;i<=12;i++){const t=i/12;pts.push(new THREE.Vector3(sx*leg(t),t*Hh,sz*leg(t)))}add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),24,.35,6,false),iron);col(sx*6.5,sz*6.5,.8,.8,6)
  for(let i=0;i<10;i++){const t0=i/10,t1=(i+1)/10;for(const s of[0,1]){const a=new THREE.Vector3(sx*leg(t0)*(s?1:1),t0*Hh,sz*leg(t0)),b=new THREE.Vector3(sx*leg(t1),t1*Hh,sz*leg(t1)*(s?-.0:1));}}}
 for(const t of[.08,.3,.6]){const y=t*Hh,w=leg(t);for(const [ax,az,rx,rz]of[[0,1,1,0],[0,-1,1,0],[1,0,0,1],[-1,0,0,1]]){const b=box(rx?2*w:.25,.25,rz?2*w:.25,dk,ax*w,y,az*w);
   for(let i=0;i<8;i++){const u=-1+i*2/8,d=add(new THREE.CylinderGeometry(.06,.06,Math.hypot(2*w/8,3.5),4),iron,ax*w+(rx?u*w+w/8:0),y+1.75,az*w+(rz?u*w+w/8:0));d.rotation[rx?'z':'x']=(i%2?1:-1)*Math.atan2(2*w/8,3.5)}}}
 for(const sx of[-1,1]){const a=new THREE.TorusGeometry(leg(.08)*.8,.25,6,24,Math.PI);a.translate(0,0,0);const m=add(a,iron,0,.8,sx*leg(.15));m.rotation.y=0}   // Zierbögen zwischen den Beinen
 for(const [t,w]of[[.3,leg(.3)+.9],[.6,leg(.6)+.6]]){box(2*w,.35,2*w,dk,0,t*Hh,0);for(const s of[-1,1]){box(2*w,.9,.06,iron,0,t*Hh+.6,s*w);box(.06,.9,2*w,iron,s*w,t*Hh+.6,0)}}
 box(2.4,1.6,2.4,dk,0,Hh+.6,0);add(new THREE.ConeGeometry(.5,4,8),iron,0,Hh+3.4,0);box(.05,2,.05,dk,0,Hh+5.6,0);box(1.2,.7,.03,M(0xb8201c),.6,Hh+6.2,0)}

const BUILD={steinzeit:stonehenge,hallstatt:burialMound,roemer:colosseum,fruehmittelalter:palaceChapel,hochmittelalter:imperialPalace,spaetmittelalter:cityGate,renaissance:domeCathedral,barock:pleasurePalace,napoleon:triumphArch,neuzeit:ironTower};
export function buildWonder(era,H={}){const g=new THREE.Group();g.colliders=[];g.walkAreas=[];(BUILD[era]||imperialPalace)(g,H);g.isWonder=true;return g}
