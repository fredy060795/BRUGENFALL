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
 {const P=[[-hw*.85,-LS/2],[hw*.85,-LS/2],[hw,-LS/2+1.2],[hw,LS/2-3.2],[0,LS/2],[-hw,LS/2-3.2],[-hw,-LS/2+1.2]].map(([x,z])=>[x*.95,z*.97]),curve=new T.CatmullRomCurve3(P.map(([x,z])=>new T.Vector3(x,1.55,z)),true);   // Reling mit Stützen auf dem Schanzkleid
  mesh(g,new T.TubeGeometry(curve,60,.03,5,true),white);mesh(g,new T.TubeGeometry(new T.CatmullRomCurve3(curve.getPoints(60).map(v=>new T.Vector3(v.x,1.35,v.z)),true),60,.015,4,true),white);
  const N=40;for(let i=0;i<N;i++){const v=curve.getPointAt(i/N);mesh(g,new T.CylinderGeometry(.018,.022,.44,5),white,[v.x,1.34,v.z])}}
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
 // Flaggenstock am Heck (rot-weiß-rot wie die Donau-Dampfschiffe), Ladung auf dem Vordeck
 const fz=-LS/2+.5;rod(g,[0,1.1,fz],[0,3.2,fz],.03,wood);for(const[i,c]of[[0,0xb01e1e],[1,0xf0f0ea],[2,0xb01e1e]])box(g,.02,.2,.8,M(c),0,3.05-i*.2,fz-.42);
 for(let i=0;i<4;i++)box(g,.6,.5,.6,wood,(i%2?.45:-.45),1.33,2.4+Math.floor(i/2)*.7);mesh(g,new T.CylinderGeometry(.28,.28,.55,10),wood,[0,1.36,3.8]);
 // Rauch aus dem Schornstein
 const N=40,pos=new Float32Array(N*3),P=[];for(let i=0;i<N;i++)P.push({ph:i/N,j:Math.random()});const sg=new T.BufferGeometry();sg.setAttribute('position',new T.BufferAttribute(pos,3));
 const smoke=new T.Points(sg,new T.PointsMaterial({color:0x5a5a5a,size:.55,transparent:true,opacity:.55,depthWrite:false}));smoke.frustumCulled=false;g.add(smoke);let tt=0;
 g.shipAnim=dt=>{tt+=dt;for(const w of wheels)w.rotation.x+=dt*2.2;for(let i=0;i<N;i++){const p=P[i],u=(tt*.25+p.ph)%1;pos[i*3]=(p.j-.5)*.4*u;pos[i*3+1]=5.3+u*3.2;pos[i*3+2]=-1.6-u*2.4}sg.attributes.position.needsUpdate=true};
 return g}

// ---------- Weitere Schiffe je Epoche (Bug bei +z, Wasserlinie bei y≈0, Höhe unter 5,8 m) ----------
const MS=(c,o={})=>new T.MeshStandardMaterial({color:c,roughness:.85,...o});
// Bootsrumpf als Lathe-ähnliche Schale: Spanten entlang z, halbe Breite b(t), Höhe top(t)
function hullShell(g,L,B,top,bot,mat,pw=.42,stems=true){mesh(g,grid((u,v)=>{const t=v,z=-L/2+t*L,th=-Math.PI/2+u*Math.PI,b=t<=0||t>=1?0:B*Math.pow(Math.sin(Math.PI*t),pw),tp=top(t),ct=Math.cos(th);
 return[b*Math.sin(th)*(1-.45*Math.pow(ct,1.6)),tp-(tp-bot)*Math.pow(ct,.7),z,.75+.25*((u*10)%1<.85?1:.6)]},18,36),mat)
 if(stems)for(const t of[.012,.988]){const tp=top(t),h=tp-bot;const sm=mat.clone();sm.vertexColors=false;sm.color.multiplyScalar(.8);mesh(g,new T.BoxGeometry(.14,h,.5),sm,[0,bot+h/2,-L/2+t*L+(t<.5?.2:-.2)])}}   // Steven schließen Bug und Heck
// Außenkante des Rumpfs (Höhe der Bordwand) an Position z – damit Schilde, Reling und Ruder am Rumpf anliegen
const edgeX=(L,B,z,pw=.42)=>{const t=Math.min(.999,Math.max(.001,(z+L/2)/L));return B*Math.pow(Math.sin(Math.PI*t),pw)};
function gunwale(g,L,B,top,mat,pw,r=.05){for(const s of[-1,1]){const pts=[];for(let i=0;i<=30;i++){const t=.03+i/30*.94,z=-L/2+t*L;pts.push(new T.Vector3(s*edgeX(L,B,z,pw)*1.02,top(t)+.02,z))}mesh(g,new T.TubeGeometry(new T.CatmullRomCurve3(pts),60,r,6,false),mat)}}
// Deck innerhalb des Rumpfs
function hullDeck(g,L,B,y,mat,pw=.42){mesh(g,grid((u,v)=>{const t=.06+v*.88,b=B*Math.pow(Math.sin(Math.PI*t),pw)*.94;return[(u*2-1)*b,y,-L/2+t*L,1]},8,28,true),(()=>{const m=mat.clone();m.side=T.DoubleSide;return m})())}
// Einbaum (Steinzeit), in der Hallstattzeit größer und mit Salzsäcken
export function createDugout({big=false}={}){const g=new T.Group();g.isShip=true;const L=big?7:5.5,B=big?.75:.55,wood=MS(0x6a4a2c,{vertexColors:true,side:T.DoubleSide});
 hullShell(g,L,B,t=>.55+.15*Math.pow(Math.abs(2*t-1),3),-.25,wood,.3);const inner=MS(0x4a3420);hullDeck(g,L,B,.32,inner,.3);
 for(const z of big?[-1.6,0,1.6]:[-1,1]){const p=new T.Group();p.position.set(0,.35,z);g.add(p);mesh(p,new T.CylinderGeometry(.035,.035,1.6,6),MS(0x8a6a44),[.3,.5,0]).rotation.z=-.6;mesh(p,new T.BoxGeometry(.18,.45,.04),MS(0x8a6a44),[.75,-.1,0]).rotation.z=-.6}   // Stechpaddel
 if(big)for(let i=0;i<4;i++)mesh(g,new T.SphereGeometry(.22,8,6),MS(0xe8e4dc),[(i%2-.5)*.4,.48,-.6+Math.floor(i/2)*.6]).scale.set(1,.7,1.3);
 else{mesh(g,new T.SphereGeometry(.25,8,6),MS(0x7a5e40),[0,.45,.3]).scale.set(1,.6,1.4)}   // Fellbündel
 return g}
// Römische Flussgaleere (navis lusoria): schlanker Rumpf, Ruderreihen, Rahsegel, Schildreihe, Heckzier
export function createGalley(){const g=new T.Group();g.isShip=true;const L=10,B=1.3,PW=.5,hull=MS(0x5a3a22,{vertexColors:true,side:T.DoubleSide}),red=MS(0x8a1e1a),wood=MS(0x6a4a2c),bronze=MS(0xb08a3c,{metalness:.6,roughness:.4}),deckM=MS(0x9a7a52);
 const gt=t=>1.25+.55*Math.pow(Math.abs(2*t-1),3)+.25*Math.pow(Math.max(0,.15-t)/.15,2);                                 // sanfter Sprung, Heck etwas höher
 hullShell(g,L,B,gt,-.3,hull,PW,false);hullDeck(g,L,B,.72,deckM,PW);gunwale(g,L,B,gt,red,PW,.06);
 // Bugsteven mit Rammsporn, Heckzier (Aplustre) als nach vorn gebogener Schwanenhals
 const tube=(pts,r,m)=>mesh(g,new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(p=>new T.Vector3(...p))),24,r,8,false),m);
 tube([[0,gt(1)+.1,L/2-.05],[0,1.1,L/2+.15],[0,.5,L/2+.3],[0,.12,L/2+.35]],.1,wood);mesh(g,new T.ConeGeometry(.15,.9,8),bronze,[0,.12,L/2+.75]).rotation.x=Math.PI/2;   // Rammsporn auf der Wasserlinie
 for(const y of[.35,.6])mesh(g,new T.BoxGeometry(.04,.06,.7),bronze,[0,y,L/2+.25]);
 tube([[0,gt(0)-.2,-L/2+.15],[0,gt(0)+.6,-L/2-.25],[0,gt(0)+1.4,-L/2-.15],[0,gt(0)+1.75,-L/2+.25],[0,gt(0)+1.55,-L/2+.55]],.09,wood);
 for(let i=0;i<5;i++){const a=i/4;tube([[0,gt(0)+.5,-L/2-.1],[(a-.5)*.7,gt(0)+1.0+a*.3,-L/2-.45],[(a-.5)*1.0,gt(0)+1.3+a*.2,-L/2-.5]],.03,bronze)}
 // Heckkabine mit Ziegeldach
 mesh(g,new T.BoxGeometry(1.3,.9,1.3),MS(0xd8cfb8),[0,1.17,-L/2+1.6]);for(const s of[-1,1]){const r=mesh(g,new T.BoxGeometry(.85,.06,1.45),MS(0xa8482c),[s*.36,1.72,-L/2+1.6]);r.rotation.z=-s*.45}
 // Riemenkasten (Ausleger) entlang beider Seiten, Riemen schräg ins Wasser; zwei Seitenruder am Heck
 g.userData.oars=[];for(const s of[-1,1]){const zs=[];for(let i=0;i<10;i++)zs.push(-3.0+i*.62);
  const ex=z=>edgeX(L,B,z,PW),y0=1.12;{const pts=zs.map(z=>new T.Vector3(s*(ex(z)+.12),y0,z));mesh(g,new T.TubeGeometry(new T.CatmullRomCurve3(pts),30,.07,6,false),red)}
  for(const z of zs){const o=new T.Group();o.position.set(s*(ex(z)+.12),y0,z);g.add(o);rod(o,[0,.25,0],[s*2.2,-1.3,0],.03,wood);mesh(o,new T.BoxGeometry(.04,.32,.14),wood,[s*2.25,-1.33,0]).rotation.z=s*1.03;g.userData.oars.push(o)}
  for(let i=0;i<5;i++){const z=-2.4+i*1.1,sh=mesh(g,new T.CylinderGeometry(.26,.26,.05,16),i%2?red:MS(0xc8a040),[s*(ex(z)+.05),gt((z+L/2)/L)+.08,z]);sh.rotation.z=Math.PI/2;mesh(g,new T.SphereGeometry(.06,8,6),bronze,[s*(ex(z)+.08),gt((z+L/2)/L)+.08,z])}
  const zr=-L/2+.9,xr=s*(ex(zr)+.1);rod(g,[xr,gt(.09)+.3,zr],[xr+s*.3,-.25,zr-.35],.05,wood);const bl=mesh(g,new T.BoxGeometry(.06,.9,.36),wood,[xr+s*.27,-.05,zr-.32]);bl.rotation.x=.3}
 // Mast mit Rah und gestreiftem Rahsegel
 mesh(g,new T.CylinderGeometry(.09,.1,4.4,8),wood,[0,2.9,.8]);mesh(g,new T.CylinderGeometry(.05,.05,3.2,6),wood,[0,5.0,.85]).rotation.z=Math.PI/2;
 mesh(g,grid((u,v)=>[-1.5+3*u,4.9-2.3*v,.95+.35*Math.sin(Math.PI*u)*Math.sin(Math.PI*v),(Math.floor(u*5)%2)?[.6,.12,.1]:[.92,.9,.84]],10,8),new T.MeshStandardMaterial({vertexColors:true,side:T.DoubleSide,roughness:.95}));
 for(const s of[-1,1])rod(g,[0,5.0,.8],[s*ex0(L,B,.6,PW),gt(.6),L*.1],.012,MS(0xb09a6a));
 g.shipAnim=dt=>{g.userData.t=(g.userData.t||0)+dt;const a=Math.sin(g.userData.t*2.4);for(const o of g.userData.oars)o.rotation.y=a*.3*Math.sign(o.position.x)};return g}
const ex0=(L,B,t,pw)=>B*Math.pow(Math.sin(Math.PI*t),pw);
// Wikinger-Langschiff (Frühmittelalter): Klinkerrumpf mit hohem Steven, Drachenkopf, Schildreihe, rot-weiß gestreiftes Segel
export function createLongship(){const g=new T.Group();g.isShip=true;const L=10,B=1.5,hull=MS(0x5e4228,{vertexColors:true,side:T.DoubleSide}),wood=MS(0x6a4a2c),cols=[0xb8201c,0xd8c070,0x2a4a7a,0xe8e2d0];
 hullShell(g,L,B,t=>1.05+1.1*Math.pow(Math.abs(2*t-1),6),-.3,hull,.45);hullDeck(g,L,B,.9,MS(0x8a6a44),.45);
 for(const sgn of[-1,1]){const pts=[];for(let i=0;i<=8;i++){const t=i/8;pts.push(new T.Vector3(0,1.1+t*1.3+Math.sin(t*2.6)*.2,sgn*(L/2-.2+t*.6)-sgn*Math.sin(t*3)*.3))}mesh(g,new T.TubeGeometry(new T.CatmullRomCurve3(pts),16,.09,6,false),wood)}
 const head=mesh(g,new T.ConeGeometry(.16,.6,6),MS(0x8a1e1a),[0,2.55,L/2+.15]);head.rotation.x=Math.PI/2+.4;                                           // Drachenkopf
 const lt=t=>1.05+1.1*Math.pow(Math.abs(2*t-1),6);gunwale(g,L,B,lt,wood,.45,.06);   // Schildreihe folgt der Bordwand, Schilde hängen an der Reling
 for(const s of[-1,1])for(let i=0;i<8;i++){const z=-2.8+i*.8,t=(z+L/2)/L,sh=mesh(g,new T.CylinderGeometry(.27,.27,.04,14),MS(cols[(i+(s>0?1:0))%4]),[s*(edgeX(L,B,z,.45)+.03),lt(t)-.12,z]);sh.rotation.z=Math.PI/2;mesh(g,new T.SphereGeometry(.06,8,6),MS(0x8a8478,{metalness:.5}),[s*(edgeX(L,B,z,.45)+.06),lt(t)-.12,z])}
 mesh(g,new T.CylinderGeometry(.1,.12,4.6,8),wood,[0,3.2,0]);mesh(g,new T.CylinderGeometry(.05,.05,3.6,6),wood,[0,5.2,.1]).rotation.z=Math.PI/2;
 mesh(g,grid((u,v)=>[-1.7+3.4*u,5.1-2.9*v,.2+.4*Math.sin(Math.PI*u)*Math.sin(Math.PI*v),(Math.floor(u*7)%2)?[.72,.12,.1]:[.93,.9,.84]],14,8),new T.MeshStandardMaterial({vertexColors:true,side:T.DoubleSide,roughness:.95}));
 {const z=-L/2+1.3,x=edgeX(L,B,z,.45)+.08,rud=new T.Group();rud.position.set(x,1.25,z);g.add(rud);mesh(rud,new T.CylinderGeometry(.05,.05,1.6,8),wood,[0,-.5,0]);mesh(rud,new T.BoxGeometry(.06,.9,.38),wood,[0,-1.15,.08]);mesh(rud,new T.BoxGeometry(.5,.05,.05),wood,[-.25,.25,0]);rud.rotation.x=.25}   // Seitenruder an Steuerbord
 return g}
// Plätte / Zille (Barock, Napoleon): flacher Donau-Lastkahn mit Hütte, Ruderbalken (Steuerruder) und Fässern
export function createBarge(){const g=new T.Group();g.isShip=true;const L=10,W=3,wood=MS(0x7a5a38),dark=MS(0x4a3420),roof=MS(0x5a4a3a);
 const plan=new T.Shape();plan.moveTo(-W/2,-L/2);plan.lineTo(W/2,-L/2);plan.lineTo(W/2,L/2-2.5);plan.quadraticCurveTo(W*.35,L/2,0,L/2+.2);plan.quadraticCurveTo(-W*.35,L/2,-W/2,L/2-2.5);plan.closePath();
 const geo=new T.ExtrudeGeometry(plan,{depth:1.0,bevelEnabled:false});geo.rotateX(Math.PI/2);geo.translate(0,.75,0);mesh(g,geo,dark);
 {const d=new T.ShapeGeometry(plan);d.rotateX(Math.PI/2);d.scale(.95,1,.97);d.translate(0,.78,0);const m=mesh(g,d,wood);m.material=wood.clone();m.material.side=T.DoubleSide}
 box(g,2.2,1.4,2.8,wood,0,1.5,-2.6);const r1=box(g,1.4,.08,3.1,roof,-.58,2.45,-2.6);r1.rotation.z=.6;const r2=box(g,1.4,.08,3.1,roof,.58,2.45,-2.6);r2.rotation.z=-.6;   // Hütte
 rod(g,[0,1.0,-L/2],[0,1.6,-L/2-2.2],.06,wood);box(g,.08,.9,1.2,wood,0,1.2,-L/2-2.0);                                                                     // langes Heckruder
 for(let i=0;i<6;i++){const m=mesh(g,new T.CylinderGeometry(.3,.3,.65,10),MS(0x6a4a2c),[(i%3-1)*.75,1.1,.4+Math.floor(i/3)*.8]);m.rotation.z=Math.PI/2}for(let i=0;i<3;i++)box(g,.6,.5,.6,MS(0x8a6a44),(i-1)*.7,1.05,2.4);
 return g}
