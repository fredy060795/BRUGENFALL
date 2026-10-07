// Burgenfall – Handelsschiff (Kogge): geklinkerter Rumpf mit Sprung, Kastelle, Rahsegel mit Bauch, Takelage, Ladung.
// Maße wie zuvor: Länge 9,2 m (z), Breite 3,2 m (x), Masttopp < 5,8 m (Brückendurchfahrt).
import * as T from 'three';
function grid(F,nu,nv,flip=false){const pos=[],col=[],idx=[];for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){const p=F(i/nu,j/nv);pos.push(p[0],p[1],p[2]);const s=p[3]??1;col.push(...(Array.isArray(s)?s:[s,s,s]))}
 for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){const A=j*(nu+1)+i,B=A+1,C=A+nu+1,D=C+1;flip?idx.push(A,B,C,B,D,C):idx.push(A,C,B,B,C,D)}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.setIndex(idx);g.computeVertexNormals();return g}
const mesh=(par,geo,mat,p=[0,0,0])=>{const m=new T.Mesh(geo,mat);m.position.set(...p);m.castShadow=true;m.receiveShadow=true;par.add(m);return m};
const box=(par,w,h,d,mat,x,y,z)=>mesh(par,new T.BoxGeometry(w,h,d),mat,[x,y,z]);
function rod(par,a,b,r,mat){const A=new T.Vector3(...a),B=new T.Vector3(...b),d=B.clone().sub(A),m=new T.Mesh(new T.CylinderGeometry(r,r,d.length(),5),mat);m.position.copy(A).addScaledVector(d,.5);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());par.add(m);return m}
const L=9.2,B=1.6;
const beam=t=>B*Math.pow(Math.sin(Math.PI*Math.min(.999,Math.max(.001,t))),.42);       // halbe Breite entlang der Länge
const sheer=t=>1.3+.45*Math.pow(Math.abs(2*t-1),2.2);                                // Sprung: Enden höher
export function createCog({sail=[0xe8e0c8,0x9a2a24],flag=0x9a2a24,seed=1}={}){let sd=seed*48271+7;const rr=()=>(sd=(sd*16807)%2147483647)/2147483647;
 const g=new T.Group();g.isShip=true;
 const hullM=new T.MeshStandardMaterial({color:0x6a4a2c,roughness:.85,vertexColors:true,side:T.DoubleSide}),deckM=new T.MeshStandardMaterial({color:0x9a7a52,roughness:.9,vertexColors:true}),
  wood=new T.MeshStandardMaterial({color:0x5a3e26,roughness:.85}),dark=new T.MeshStandardMaterial({color:0x2a2018,roughness:.8}),iron=new T.MeshStandardMaterial({color:0x3a3c3e,metalness:.6,roughness:.5}),
  rope=new T.MeshStandardMaterial({color:0xb09a6a,roughness:1}),sailM=new T.MeshStandardMaterial({vertexColors:true,roughness:.95,side:T.DoubleSide});
 const c0=new T.Color(sail[0]),c1=new T.Color(sail[1]);
 // Rumpf: Spanten von Backbord-Deckskante über den Kiel zur Steuerbord-Deckskante; Klinkerplanken als Schattierung
 mesh(g,grid((u,v)=>{const t=v,z=-L/2+t*L,th=-Math.PI/2+u*Math.PI,b=beam(t),top=sheer(t),bot=-.35+.25*Math.pow(Math.abs(2*t-1),3),ct=Math.cos(th);
  const x=b*Math.sin(th)*(.55+.45*Math.pow(ct,.25)),y=top-(top-bot)*Math.pow(ct,.7),pl=(u*14)%1,sh=.68+.32*(pl<.82?pl/.82:1)-(y<.25?.12:0);return[x,y,z,[sh*.95,sh*.82,sh*.7]]},22,40),hullM);
 // Deck
 mesh(g,grid((u,v)=>{const t=.06+v*.88,z=-L/2+t*L,b=beam(t)*.94,x=(u*2-1)*b,pl=(Math.abs(x)*5)%1;return[x,Math.min(sheer(t),1.45)-.12,z,.8+.2*(pl<.9?1:.4)]},10,30,true),deckM);
 // Scheuerleiste und Reling
 for(const s of[-1,1]){const pts=[];for(let i=0;i<=24;i++){const t=.03+i/24*.94;pts.push(new T.Vector3(s*beam(t)*1.01,sheer(t)+.02,-L/2+t*L))}mesh(g,new T.TubeGeometry(new T.CatmullRomCurve3(pts),48,.06,5,false),wood);
  const pr=[];for(let i=0;i<=24;i++){const t=.03+i/24*.94;pr.push(new T.Vector3(s*beam(t)*.97,sheer(t)+.42,-L/2+t*L))}mesh(g,new T.TubeGeometry(new T.CatmullRomCurve3(pr),48,.04,5,false),wood);
  for(let i=1;i<12;i++){const t=.05+i/12*.9;rod(g,[s*beam(t)*.97,sheer(t),-L/2+t*L],[s*beam(t)*.97,sheer(t)+.42,-L/2+t*L],.03,wood)}}
 // Achterkastell (Plattform mit Brüstung) und kleines Vorderkastell
 const cast=(t0,t1,y)=>{const z0=-L/2+t0*L,z1=-L/2+t1*L,b=beam((t0+t1)/2)*.95;box(g,b*2,.12,z1-z0,wood,0,y,(z0+z1)/2);for(const x of[-b,b])for(const z of[z0,z1])box(g,.12,.9,.12,wood,x,y-.45,z);
  for(const x of[-b,b])box(g,.06,.45,z1-z0,dark,x,y+.25,(z0+z1)/2);box(g,b*2,.45,.06,dark,0,y+.25,t0<.5?z1:z0)};
 cast(.02,.24,2.35);cast(.84,.97,2.25);
 // Ruder, Bugspriet, Anker
 box(g,.12,1.9,.75,wood,0,.6,-L/2-.25);rod(g,[0,1.9,-L/2+.1],[0,2.1,-L/2+1.0],.05,wood);
 rod(g,[0,1.8,L/2-.3],[0,2.5,L/2+1.6],.08,wood);mesh(g,new T.TorusGeometry(.25,.05,5,12),iron,[.9,1.2,L/2-.6]).rotation.y=Math.PI/2;
 // Mast, Rah, Rahsegel mit Bauch und Streifen, Mastkorb
 const mz=.4;rod(g,[0,.9,mz],[0,5.75,mz],.13,wood);rod(g,[-1.85,5.25,mz+.12],[1.85,5.25,mz+.12],.07,wood);mesh(g,new T.CylinderGeometry(.35,.3,.3,10,1,true),wood,[0,5.35,mz]);
 mesh(g,grid((u,v)=>{const x=-1.75+3.5*u,y=5.18-2.85*v,belly=.5*Math.sin(Math.PI*u)*Math.sin(Math.PI*(.15+.85*v)),stripe=Math.floor(u*6)%2?c1:c0;return[x,y,mz+.18+belly,[stripe.r,stripe.g,stripe.b]]},18,10),sailM);
 rod(g,[-1.75,2.33,mz+.2],[1.75,2.33,mz+.2],.025,wood);
 // Takelage: Wanten, Vorstag, Achterstag, Schoten
 for(const s of[-1,1])for(const t of[.42,.5,.58])rod(g,[0,5.6,mz],[s*beam(t)*.98,sheer(t)+.05,-L/2+t*L],.016,rope);
 rod(g,[0,5.6,mz],[0,2.45,L/2+1.5],.016,rope);rod(g,[0,5.6,mz],[0,2.6,-L/2+.6],.016,rope);for(const s of[-1,1])rod(g,[s*1.75,2.33,mz+.2],[s*beam(.3)*.95,1.85,-L/2+.3*L],.012,rope);
 // Wimpel
 mesh(g,grid((u,v)=>[0,5.85-v*.35,mz-.02-u*1.1,(()=>{const c=new T.Color(flag);return[c.r,c.g,c.b]})()],6,1),new T.MeshStandardMaterial({vertexColors:true,side:T.DoubleSide,roughness:1}));
 // Ladung: Fässer, Kisten, Säcke
 for(let i=0;i<5;i++){const z=-1.6+i*.75+(rr()-.5)*.2,x=(i%2?.6:-.6);mesh(g,new T.CylinderGeometry(.28,.28,.55,10),wood,[x,1.55,z])}
 for(let i=0;i<3;i++)box(g,.6,.5,.6,wood,(i-1)*.7,1.6,2.0);mesh(g,new T.SphereGeometry(.3,8,6),new T.MeshStandardMaterial({color:0xc8b890,roughness:1}),[.7,1.55,-2.6]).scale.set(1,.7,1.2);
 return g}

// Zeitreise – Raddampfer (Neuzeit): flacher Flussrumpf, Seitenschaufelräder in Radkästen, Deckshaus, Steuerhaus, Schornstein mit Rauch.
// Gleiche Größenordnung wie die Kogge (Länge ~10 m entlang z, Bug bei +z), Schornsteinkappe unter 5,8 m (Brückendurchfahrt).
export function createSteamer({seed=1}={}){const g=new T.Group();g.isShip=true;const LS=10.4,BS=1.7;
 const M=(c,o={})=>new T.MeshStandardMaterial({color:c,roughness:.7,...o});
 const hullM=new T.MeshStandardMaterial({vertexColors:true,roughness:.7,side:T.DoubleSide}),white=M(0xeeeae0),black=M(0x1a1a1a),red=M(0x9a1e1a),wood=M(0x8a6a44),deck=M(0xb09670,{roughness:.9}),glass=M(0x2a3a44,{roughness:.2,metalness:.3}),brass=M(0xc09a40,{metalness:.7,roughness:.3});
 // Rumpf aus dem Grundriss: eckiges Heck, spitzer Bug; unten schwarz, rote Wasserlinie, oben weiß, Holzdeck
 const plan=new T.Shape(),hw=BS*.92;plan.moveTo(-hw*.85,-LS/2);plan.lineTo(hw*.85,-LS/2);plan.quadraticCurveTo(hw,-LS/2+.4,hw,-LS/2+1.2);plan.lineTo(hw,LS/2-3.2);plan.quadraticCurveTo(hw*.85,LS/2-.8,0,LS/2);
 plan.quadraticCurveTo(-hw*.85,LS/2-.8,-hw,LS/2-3.2);plan.lineTo(-hw,-LS/2+1.2);plan.quadraticCurveTo(-hw,-LS/2+.4,-hw*.85,-LS/2);
 const layer=(y0,h,m,sc=1)=>{const geo=new T.ExtrudeGeometry(plan,{depth:h,bevelEnabled:false});geo.rotateX(Math.PI/2);geo.scale(sc,1,1);geo.translate(0,y0+h,0);mesh(g,geo,m)};
 layer(-.35,.95,black,.94);layer(.6,.12,red);layer(.72,.4,white);
 {const dg=new T.ShapeGeometry(plan);dg.rotateX(Math.PI/2);dg.scale(.96,1,.98);dg.translate(0,1.13,0);const dm=mesh(g,dg,deck);dm.material=deck.clone();dm.material.side=T.DoubleSide}
 {const pr=[];for(const [x,z]of[[-hw*.85,-LS/2],[hw*.85,-LS/2],[hw,-LS/2+1.2],[hw,LS/2-3.2],[0,LS/2],[-hw,LS/2-3.2],[-hw,-LS/2+1.2]])pr.push(new T.Vector3(x*.97,1.55,z*.98));mesh(g,new T.TubeGeometry(new T.CatmullRomCurve3(pr,true),60,.03,5,true),white)}
 // Deckshaus mit Fenstern, Steuerhaus darüber
 box(g,2.4,1.1,4.2,white,0,1.65,-1.2);for(const s of[-1,1])for(let i=0;i<5;i++)box(g,.04,.42,.5,glass,s*1.21,1.75,-3.0+i*.85);box(g,2.7,.08,4.6,black,0,2.24,-1.2);
 box(g,1.5,.9,1.3,white,0,2.7,.2);box(g,1.52,.36,1.32,glass,0,2.85,.2);box(g,1.7,.08,1.5,black,0,3.18,.2);
 // Schornstein (schwarz mit rotem Band), Dampfpfeife
 mesh(g,new T.CylinderGeometry(.3,.34,2.9,14),black,[0,3.65,-1.6]);mesh(g,new T.CylinderGeometry(.31,.31,.35,14),red,[0,4.45,-1.6]);mesh(g,new T.CylinderGeometry(.36,.3,.18,14),black,[0,5.15,-1.6]);mesh(g,new T.CylinderGeometry(.05,.05,.5,8),brass,[.45,3.1,-1.6]);
 // Schaufelräder in halbrunden Radkästen
 const wheels=[];for(const s of[-1,1]){const w=new T.Group();w.position.set(s*(BS+.35),.75,-.3);g.add(w);wheels.push(w);
  for(const r of[.95,.55]){const ring=new T.Mesh(new T.TorusGeometry(r,.035,5,24),red);ring.rotation.y=Math.PI/2;for(const dx of[-.22,.22]){const rr2=ring.clone();rr2.position.x=dx;w.add(rr2)}}
  for(let i=0;i<10;i++){const a=i/10*Math.PI*2,p=new T.Mesh(new T.BoxGeometry(.5,.08,.42),wood);p.position.set(0,Math.sin(a)*.8,Math.cos(a)*.8);p.rotation.x=-a;w.add(p)}
  mesh(w,new T.CylinderGeometry(.12,.12,.6,10),black).rotation.z=Math.PI/2;
  const hb=new T.Mesh(new T.CylinderGeometry(1.15,1.15,.62,20,1,false,0,Math.PI),white);hb.rotation.z=Math.PI/2;hb.position.set(s*(BS+.35),.8,-.3);hb.material=white.clone();hb.material.side=T.DoubleSide;g.add(hb)}
 // Flaggenstock am Heck (schwarz-weiß-rot), Ladung auf dem Vordeck
 const fz=-LS/2+.5;rod(g,[0,1.1,fz],[0,3.2,fz],.03,wood);for(const[i,c]of[[0,0x141414],[1,0xf0f0ea],[2,0xb8201c]])box(g,.02,.2,.8,M(c),0,3.05-i*.2,fz-.42);
 for(let i=0;i<4;i++)box(g,.6,.5,.6,wood,(i%2?.45:-.45),1.33,2.4+Math.floor(i/2)*.7);mesh(g,new T.CylinderGeometry(.28,.28,.55,10),wood,[0,1.36,3.8]);
 // Rauch aus dem Schornstein
 const N=40,pos=new Float32Array(N*3),P=[];for(let i=0;i<N;i++)P.push({ph:i/N,j:Math.random()});const sg=new T.BufferGeometry();sg.setAttribute('position',new T.BufferAttribute(pos,3));
 const smoke=new T.Points(sg,new T.PointsMaterial({color:0x5a5a5a,size:.55,transparent:true,opacity:.55,depthWrite:false}));smoke.frustumCulled=false;g.add(smoke);let tt=0;
 g.shipAnim=dt=>{tt+=dt;for(const w of wheels)w.rotation.x+=dt*2.2;for(let i=0;i<N;i++){const p=P[i],u=(tt*.25+p.ph)%1;pos[i*3]=(p.j-.5)*.4*u;pos[i*3+1]=5.3+u*3.2;pos[i*3+2]=-1.6-u*2.4}sg.attributes.position.needsUpdate=true};
 return g}
