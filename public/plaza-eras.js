// Marktplatz je Epoche: Boden, Wasserstelle in der Mitte (bleibt Löschwasser-Quelle) und Ausstattung.
// Hoch- und Spätmittelalter nutzen den bestehenden Laufbrunnen; alle anderen Epochen bekommen hier ihr eigenes Bild.
import * as THREE from 'three';

const MAT=new Map(),mat=(k,c,o={})=>MAT.get(k)||(MAT.set(k,new THREE.MeshStandardMaterial({color:c,roughness:.9,...o})),MAT.get(k));
function canvasTex(key,draw,rep){if(MAT.has(key))return MAT.get(key);const c=document.createElement('canvas');c.width=c.height=512;draw(c.getContext('2d'));const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rep[0],rep[1]);t.colorSpace=THREE.SRGBColorSpace;
 const m=new THREE.MeshStandardMaterial({map:t,roughness:.95});MAT.set(key,m);return m}
const rnd=(()=>{let s=7;return()=>(s=(s*16807)%2147483647)/2147483647})();
// Böden
const earth=(key,base,spots)=>canvasTex(key,x=>{x.fillStyle=base;x.fillRect(0,0,512,512);for(let i=0;i<2600;i++){x.fillStyle=spots[i%spots.length];const r=1+rnd()*3.5;x.globalAlpha=.25+rnd()*.4;x.beginPath();x.arc(rnd()*512,rnd()*512,r,0,7);x.fill()}x.globalAlpha=1},[6,3]);
const slabs=()=>canvasTex('travertine',x=>{x.fillStyle='#d9cfb8';x.fillRect(0,0,512,512);for(let r=0;r<4;r++)for(let q=0;q<2;q++){const o=r%2*128;x.fillStyle=['#ddd3bc','#d2c6ac','#e2d9c4','#cfc3a8'][(r+q)%4];x.fillRect(q*256+o-256*(o&&q===1?0:0),r*128,256,128)}
 for(let i=0;i<900;i++){x.fillStyle='rgba(150,135,105,.25)';x.fillRect(rnd()*512,rnd()*512,1+rnd()*3,1)}x.strokeStyle='#a89a7e';x.lineWidth=3;for(let r=0;r<=4;r++){x.beginPath();x.moveTo(0,r*128);x.lineTo(512,r*128);x.stroke()}
 for(let r=0;r<4;r++)for(let q=0;q<=2;q++){const X=q*256+(r%2)*128;x.beginPath();x.moveTo(X%512,r*128);x.lineTo(X%512,r*128+128);x.stroke()}},[6,3]);

// Wasserstrahlen: Liste von Düsen [x,y,z,richtungX,richtungZ,weite,fall]
function jets(g,list,ctx){const N=list.length*90,pos=new Float32Array(N*3),P=[];for(let i=0;i<N;i++)P.push({s:i%list.length,ph:rnd(),j:(rnd()-.5)*.04});
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));const sp=new THREE.Points(geo,ctx.spray);sp.frustumCulled=false;g.add(sp);
 return t=>{const fr=ctx.frozen();sp.visible=!fr;if(fr)return;const T=t*.001;for(let i=0;i<N;i++){const p=P[i],[x,y,z,dx,dz,w,f]=list[p.s],u=(T*.9+p.ph)%1;pos[i*3]=x+dx*w*u+p.j;pos[i*3+1]=y+.1*u-f*u*u+p.j;pos[i*3+2]=z+dz*w*u+p.j}geo.attributes.position.needsUpdate=true}}
function pool(g,r,y,ctx,seg=24){const m=new THREE.Mesh(new THREE.CircleGeometry(r,seg),ctx.water);m.rotation.x=-Math.PI/2;m.position.y=y;g.add(m);return m}
const lathe=(pts,seg,m)=>new THREE.Mesh(new THREE.LatheGeometry(pts.map(([a,b])=>new THREE.Vector2(a,b)),seg),m);
const put=(g,o,x,y,z)=>{o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;g.add(o);return o};
// Standbild (vereinfachte Figur) aus Bronze oder Stein
function statue(g,x,y,z,m,{arm=1,cloak=true}={}){const f=new THREE.Group();put(g,f,x,y,z);
 put(f,new THREE.Mesh(new THREE.CylinderGeometry(.22,.3,1.0,10),m),0,.5,0);put(f,new THREE.Mesh(new THREE.CylinderGeometry(.2,.22,.7,10),m),0,1.35,0);put(f,new THREE.Mesh(new THREE.SphereGeometry(.15,12,10),m),0,1.85,0);
 for(const s of[-1,1]){const a=put(f,new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,.65,8),m),s*.27,1.4,0);a.rotation.z=s*.2;if(s===arm){a.rotation.z=-2.6*s;a.position.set(s*.38,1.75,0)}}
 if(cloak)put(f,new THREE.Mesh(new THREE.CylinderGeometry(.24,.42,1.4,10,1,true,Math.PI*.6,Math.PI*.8),m),0,1.05,-.04);return f}

function centerpiece(era,ctx){const g=new THREE.Group(),S=ctx.stone,anim=[];
 if(era==='steinzeit'){                         // Quellteich: Findlinge um eine Quelle, Schilf
  pool(g,1.35,.08,ctx,20);for(let i=0;i<11;i++){const a=i/11*6.283,r=1.5+rnd()*.15,b=new THREE.Mesh(new THREE.DodecahedronGeometry(.32+rnd()*.18,0),mat('boulder',0x8a8478,{flatShading:true}));b.scale.y=.7;b.rotation.set(rnd()*3,rnd()*3,0);put(g,b,Math.cos(a)*r,.18,Math.sin(a)*r)}
  for(let i=0;i<14;i++){const a=rnd()*6.283,r=1.05+rnd()*.3,h=.5+rnd()*.5;const s=new THREE.Mesh(new THREE.CylinderGeometry(.012,.02,h,4),mat('reed',0x6a7a3a));put(g,s,Math.cos(a)*r,h/2,Math.sin(a)*r).rotation.z=(rnd()-.5)*.3}}
 else if(era==='hallstatt'){                    // Holztrog-Brunnen: ausgehöhlter Stamm, Pfosten mit Holzrinne
  const W=mat('logwood',0x6a4e32);put(g,new THREE.Mesh(new THREE.BoxGeometry(2.6,.12,1.0),W),0,.12,0);for(const z of[-.45,.45])put(g,new THREE.Mesh(new THREE.BoxGeometry(2.6,.6,.12),W),0,.42,z);for(const x of[-1.25,1.25])put(g,new THREE.Mesh(new THREE.BoxGeometry(.12,.6,1.0),W),x,.42,0);
  const w=new THREE.Mesh(new THREE.PlaneGeometry(2.4,.8),ctx.water);w.rotation.x=-Math.PI/2;put(g,w,0,.62,0);put(g,new THREE.Mesh(new THREE.CylinderGeometry(.14,.16,2.0,8),W),-.9,1.0,-.75);
  const ch=put(g,new THREE.Mesh(new THREE.BoxGeometry(.12,.08,.9),W),-.9,1.6,-.35);anim.push(jets(g,[[-.9,1.58,.1,0,1,.25,.9]],ctx));
  put(g,new THREE.Mesh(new THREE.CylinderGeometry(.5,.55,.08,10),mat('flagstone',0x8c8678,{flatShading:true})),1.6,.04,1.2)}
 else if(era==='roemer'){                       // Marmorbecken mit Säule und Bronzestandbild, vier Delfin-Speier
  const M=mat('marble',0xe8e2d4,{roughness:.5}),BZ=mat('bronzeR',0x8a6a3a,{metalness:.6,roughness:.45});
  put(g,lathe([[0,.1],[1.5,.1],[1.5,.7],[1.42,.72],[1.42,.82],[1.78,.82],[1.78,.7],[1.66,.66],[1.66,.2],[1.78,.16],[1.78,0],[0,0]],32,M),0,0,0);pool(g,1.48,.66,ctx,32);
  put(g,new THREE.Mesh(new THREE.BoxGeometry(.8,.5,.8),M),0,.9,0);put(g,new THREE.Mesh(new THREE.CylinderGeometry(.2,.24,1.5,16),M),0,1.9,0);put(g,new THREE.Mesh(new THREE.BoxGeometry(.6,.14,.6),M),0,2.72,0);
  statue(g,0,2.79,0,BZ,{arm:1});const L=[];for(let i=0;i<4;i++){const a=i*Math.PI/2;put(g,new THREE.Mesh(new THREE.SphereGeometry(.13,10,8),BZ),Math.sin(a)*.44,1.05,Math.cos(a)*.44);L.push([Math.sin(a)*.5,1.03,Math.cos(a)*.5,Math.sin(a),Math.cos(a),.75,.4])}anim.push(jets(g,L,ctx))}
 else if(era==='fruehmittelalter'){             // Ziehbrunnen: runder Steinschacht, Pfosten, Schindeldach, Haspel, Eimer
  const W=mat('wellwood',0x5e4630);put(g,lathe([[0,.05],[1.0,.05],[1.0,.9],[.82,.9],[.82,.1],[0,.1]],18,S),0,0,0);pool(g,.82,.55,ctx,18);
  for(const s of[-1,1])put(g,new THREE.Mesh(new THREE.BoxGeometry(.16,2.3,.16),W),s*.92,1.15,0);const ax=put(g,new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,1.9,10),W),0,1.75,0);ax.rotation.z=Math.PI/2;
  for(const s of[-1,1]){const r=put(g,new THREE.Mesh(new THREE.BoxGeometry(2.4,.06,1.1),mat('shingleW',0x4a3a2c)),0,2.55,s*.38);r.rotation.x=s*.62}
  put(g,new THREE.Mesh(new THREE.CylinderGeometry(.005,.005,.8,4),mat('rope',0xb8a070)),0,1.35,0);put(g,new THREE.Mesh(new THREE.CylinderGeometry(.13,.1,.22,10),W),0,.95,0)}
 else{                                           // Renaissance bis Neuzeit: Schalenbrunnen (Stein, im Barock mit Goldbekrönung, in der Neuzeit Gusseisen)
  const iron=era==='neuzeit',M=iron?mat('castiron',0x2e3e34,{metalness:.5,roughness:.5}):era==='renaissance'?S:mat('marbleB',0xe2dccc,{roughness:.55}),top=era==='barock'?mat('gilt',0xd4a838,{metalness:.8,roughness:.3}):M;
  put(g,lathe([[0,.1],[1.55,.1],[1.55,.62],[1.48,.64],[1.48,.74],[1.78,.74],[1.78,.6],[1.68,.56],[1.68,.18],[1.78,.14],[1.78,0],[0,0]],36,iron?S:M),0,0,0);pool(g,1.5,.58,ctx,36);
  put(g,lathe([[.36,0],[.3,.4],[.18,.9],[.2,1.3],[.28,1.36],[0,1.36]],16,M),0,.1,0);
  put(g,lathe([[0,1.42],[.95,1.5],[1.0,1.62],[.9,1.6],[0,1.56]],28,M),0,0,0);pool(g,.86,1.58,ctx,28);
  put(g,lathe([[.14,1.6],[.1,2.0],[.16,2.2],[0,2.2]],12,M),0,0,0);put(g,lathe([[0,2.22],[.52,2.28],[.55,2.36],[0,2.34]],22,M),0,0,0);
  put(g,new THREE.Mesh(new THREE.SphereGeometry(era==='barock'?.16:.1,12,10),top),0,2.52,0);if(era==='barock')put(g,new THREE.Mesh(new THREE.ConeGeometry(.08,.3,8),top),0,2.78,0);
  const L=[];for(let i=0;i<8;i++){const a=i/8*6.283;L.push([Math.sin(a)*.55,2.34,Math.cos(a)*.55,Math.sin(a),Math.cos(a),.38,.76]);L.push([Math.sin(a+.4)*1.0,1.6,Math.cos(a+.4)*1.0,Math.sin(a+.4),Math.cos(a+.4),.4,1.0])}anim.push(jets(g,L,ctx))}
 g.userData.anim=(dt,t)=>anim.forEach(f=>f(t));return g}

// Ausstattung am Rand (Alltag), je Epoche
function props(era,ctx){const g=new THREE.Group(),W=ctx.wood,S=ctx.stone,box=(w,h,d,m,x,y,z)=>put(g,new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m),x,y,z),cyl=(r,h,m,x,y,z,seg=10)=>put(g,new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,seg),m),x,y,z);
 const logBench=(x,z)=>{const l=cyl(.2,2.2,mat('log',0x6a4e34),x,.2,z);l.rotation.z=Math.PI/2};
 const bench=(x,z,m,legM=m)=>{box(2,.08,.45,m,x,.48,z);for(const s of[-.8,.8])box(.12,.44,.4,legM,x+s,.22,z)};
 if(era==='steinzeit'||era==='hallstatt'){for(const x of[-4,4])for(const z of[-5.4,5.4])logBench(x,z);
  if(era==='steinzeit'){const T=[0x8a3a24,0x2a4a5a,0xc8a050,0x3a2a1e];for(let i=0;i<5;i++){const c=cyl(.32-.02*i,.75,mat('totem'+i,T[i%4],{flatShading:true}),-10.5,.38+i*.75,0,8);c.rotation.y=i*.4}box(1.6,.16,.3,mat('totem0',T[0]),-10.5,3.7,0);
   for(let i=0;i<8;i++){const a=i/8*6.283,b=new THREE.Mesh(new THREE.DodecahedronGeometry(.16,0),mat('boulder',0x8a8478,{flatShading:true}));put(g,b,9.5+Math.cos(a)*.6,.1,-3.8+Math.sin(a)*.6)}cyl(.45,.06,mat('ash',0x2a2420),9.5,.03,-3.8,12);
   for(const a of[-.7,.7])box(.08,1.8,.08,W,10+a,.9,4);box(1.6,.07,.07,W,10,1.75,4);box(.62,.95,.03,mat('hide',0x9a7652),9.7,1.25,4.02);box(.55,.85,.03,mat('hide2',0x6a4e34),10.35,1.3,4.02)}
  else{const st=put(g,new THREE.Mesh(new THREE.BoxGeometry(.8,3.2,.5),mat('menhir',0x7e7a70,{flatShading:true})),-10.5,1.6,0);st.rotation.y=.3;for(let i=0;i<3;i++)put(g,new THREE.Mesh(new THREE.SphereGeometry(.28,10,8),mat('clay',0x9a5a36)),9.6+i*.6,.32,-4.8).scale.y=1.2;
   for(let i=0;i<3;i++)box(.6,.5,.5,mat('saltsack',0xe8e4dc),9.8+i*.65,.25,4.8)}}
 else if(era==='roemer'){const M=mat('marble',0xe8e2d4,{roughness:.5});                     // Säulenhalle (Porticus) an der Rückseite, Marmorbänke, Amphoren
  for(const z of[-6.3]){for(let x=-11;x<=11.01;x+=2.75){cyl(.2,3.2,M,x,1.6,z,14);box(.5,.16,.5,M,x,.08,z);box(.5,.16,.5,M,x,3.25,z)}box(22.6,.4,.6,M,0,3.53,z)}
  for(const x of[-4,4])for(const z of[-5.3,5.3])bench(x,z,M);for(const [x,z]of[[10.6,-4.9],[10.95,-4.4],[10.3,-4.4],[-10.4,5]]){put(g,new THREE.Mesh(new THREE.LatheGeometry([[0,0],[.08,.05],[.2,.3],[.2,.55],[.08,.78],[.07,.95],[.1,.98]].map(q=>new THREE.Vector2(q[0],q[1])),10),mat('amph',0xb06a40)),x,0,z)}}
 else if(era==='fruehmittelalter'){for(const x of[-4,4])for(const z of[-5.4,5.4])bench(x,z,W);                // Thingstätte: Gerichtsstein und Steinkreis
  box(1.6,.7,1.0,mat('thing',0x7a766c,{flatShading:true}),-10.3,.35,0);for(let i=0;i<7;i++){const a=i/7*6.283;box(.35,1.1,.3,mat('thing',0x7a766c,{flatShading:true}),-10.3+Math.cos(a)*1.8,.55,Math.sin(a)*1.8).rotation.y=a}
  for(const [x,z]of[[10.6,-5],[10.9,-4.2]])cyl(.32,.75,mat('barrel',0x6a4a2c),x,.38,z,12)}
 else{const iron=era==='neuzeit',BM=iron?mat('parkbench',0x2f5a3a):W,LM=iron?mat('castiron',0x2e3e34,{metalness:.5,roughness:.5}):W;for(const x of[-4,4])for(const z of[-5.4,5.4])bench(x,z,BM,LM);
  if(era==='renaissance'){for(const [x,z]of[[10.6,-5],[10.9,-4.2],[-7.5,5.1]])cyl(.32,.75,mat('barrel',0x6a4a2c),x,.38,z,12);box(.9,.6,.9,S,-10.5,.3,0);box(.5,1.4,.5,S,-10.5,1.3,0);box(.3,.9,.3,mat('pillory',0x5e4630),-10.5,2.45,0)}   // Marktsäule mit Pranger-Aufsatz
  if(era==='barock'){box(1.4,.5,1.4,S,-10.5,.25,0);box(1.0,1.0,1.0,S,-10.5,1.0,0);cyl(.22,3.4,mat('marbleB',0xe2dccc,{roughness:.55}),-10.5,3.2,0,16);for(let i=0;i<5;i++)put(g,new THREE.Mesh(new THREE.SphereGeometry(.38-i*.04,10,8),mat('cloud',0xeeeae0)),-10.5+Math.sin(i*2.4)*.4,1.8+i*.65,Math.cos(i*2.4)*.4);   // Pestsäule mit Wolken und goldener Madonna
   statue(g,-10.5,4.9,0,mat('gilt',0xd4a838,{metalness:.8,roughness:.3}),{arm:0});for(const [x,z]of[[10.6,-5],[10.9,-4.2]])cyl(.32,.75,mat('barrel',0x6a4a2c),x,.38,z,12)}
  if(era==='napoleon'){box(1.4,.6,1.4,S,-10.5,.3,0);const ob=put(g,new THREE.Mesh(new THREE.CylinderGeometry(.18,.42,4.4,4),S),-10.5,2.8,0);ob.rotation.y=Math.PI/4;put(g,new THREE.Mesh(new THREE.ConeGeometry(.2,.4,4),mat('gilt',0xd4a838,{metalness:.8,roughness:.3})),-10.5,5.2,0).rotation.y=Math.PI/4;   // Obelisk
   cyl(.06,7,LM,10.8,3.5,-4.8,8);for(const[i,c]of[[0,0xb01e1e],[1,0xeeeeee],[2,0xb01e1e]])box(1.5,.34,.03,mat('flagA'+i,c),11.6,6.74-i*.34,-4.8)}   // Fahnenmast mit Rot-Weiß-Rot (Österreich)
  if(iron){box(1.6,1.6,1.6,S,-10.5,.8,0);box(1.9,.2,1.9,S,-10.5,1.7,0);statue(g,-10.5,1.8,0,mat('patina',0x4a7a64,{metalness:.5,roughness:.5}),{arm:1});   // Denkmal mit Patina-Bronze
   cyl(.55,2.6,mat('litfass',0xd8cfb8),10.4,1.3,-4.6,18);put(g,new THREE.Mesh(new THREE.ConeGeometry(.62,.5,18),LM),10.4,2.85,-4.6);for(let i=0;i<5;i++){const a=i/5*6.283;box(.5,.7,.02,mat('poster'+i%3,[0xb8402a,0x2a5a8a,0xd8b040][i%3]),10.4+Math.sin(a)*.56,1.5,-4.6+Math.cos(a)*.56).rotation.y=a}}}   // Litfaßsäule
 return g}

// Liefert für Epochen außerhalb des Hoch-/Spätmittelalters Boden, Mittelstück und Ausstattung
export function eraPlaza(era,ctx){if(!era||era==='hochmittelalter'||era==='spaetmittelalter')return null;
 const ground=era==='steinzeit'?earth('earthS','#7e6a4e',['#6a5840','#8e7a5a','#5a4a36','#9a8a6a']):era==='hallstatt'||era==='fruehmittelalter'?earth('earthH','#857560',['#9a8e7a','#6e6050','#a8a08c','#5e5244']):era==='roemer'?slabs():null;
 return{ground,center:centerpiece(era,ctx),props:props(era,ctx),edge:era==='roemer'?mat('marble',0xe8e2d4,{roughness:.5}):['steinzeit','hallstatt','fruehmittelalter'].includes(era)?mat('edgeWood',0x5a4430):null}}

// ---------- Fest-Aufbauten je Epoche: liefert {group, anim, replace} oder null (dann gilt der mittelalterliche Aufbau) ----------
function bonfire(g,x,z,s=1){const logs=mat('firelog',0x4a3420),fl=[0xff8a2a,0xffb84a,0xff6a1a].map(c=>new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:.85}));
 for(let i=0;i<10;i++){const a=i/10*Math.PI*2,l=put(g,new THREE.Mesh(new THREE.CylinderGeometry(.09*s,.12*s,2.4*s,6),logs),x+Math.cos(a)*.5*s,1.0*s,z+Math.sin(a)*.5*s);l.rotation.set(Math.sin(a)*.42,0,-Math.cos(a)*.42)}
 for(let i=0;i<12;i++){const a=i/12*Math.PI*2,b=new THREE.Mesh(new THREE.DodecahedronGeometry(.18*s,0),mat('boulder',0x8a8478,{flatShading:true}));put(g,b,x+Math.cos(a)*1.3*s,.1,z+Math.sin(a)*1.3*s)}
 const F=[0,1,2,3,4].map(i=>{const f=new THREE.Mesh(new THREE.ConeGeometry((.55-.08*i)*s,(1.6+.3*i)*s,7),fl[i%3]);f.position.set(x+(i%2-.5)*.2*s,(.9+.15*i)*s,z+((i>>1)%2-.5)*.2*s);g.add(f);return f});
 const L=new THREE.PointLight(0xff9a4a,30,16,2);L.position.set(x,2*s,z);g.add(L);
 return t=>{F.forEach((f,i)=>{const k=1+.18*Math.sin(t*.012+i*1.7)+.08*Math.sin(t*.031+i);f.scale.set(1,k,1);f.rotation.y=t*.001*(i%2?1:-1)});L.intensity=26+6*Math.sin(t*.02)}}
function saturnalia(g){const W=mat('tablewood',0x6a4a2c),cloth=mat('tcloth',0xe8e0cc),gold=mat('gilt',0xd4a838,{metalness:.8,roughness:.3}),fire=new THREE.MeshBasicMaterial({color:0xffc860});
 put(g,new THREE.Mesh(new THREE.BoxGeometry(5.6,.1,1.4),W),0,.82,0);put(g,new THREE.Mesh(new THREE.BoxGeometry(5.7,.02,1.5),cloth),0,.88,0);for(const x of[-2.6,0,2.6])for(const z of[-.55,.55])put(g,new THREE.Mesh(new THREE.BoxGeometry(.12,.8,.12),W),x,.4,z);
 for(const z of[-1.3,1.3])put(g,new THREE.Mesh(new THREE.BoxGeometry(5.2,.45,.8),mat('kline',0x8a2a22)),0,.25,z);                                     // Liegen (Klinen)
 for(let i=0;i<7;i++){const x=-2.4+i*.8;put(g,new THREE.Mesh(new THREE.CylinderGeometry(.2,.2,.03,14),gold),x,.9,0);put(g,new THREE.Mesh(new THREE.SphereGeometry(.09,8,6),mat('fruit'+i%3,[0xb02a20,0x6a8a2a,0x8a3a6a][i%3])),x,.98,0);
  if(i%2){put(g,new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,.22,8),mat('candle',0xf0ead8)),x+.3,1.0,.4);const f=new THREE.Mesh(new THREE.ConeGeometry(.025,.07,6),fire);f.position.set(x+.3,1.15,.4);g.add(f)}}
 put(g,new THREE.Mesh(new THREE.SphereGeometry(.35,12,10),mat('roast',0xa0582a)),0,1.05,0).scale.set(1.5,.8,.9);                                       // Spanferkel
 for(const x of[-3.1,3.1]){const a=put(g,new THREE.Mesh(new THREE.LatheGeometry([[0,0],[.12,.08],[.28,.45],[.28,.8],[.1,1.15],[.09,1.35],[.13,1.4]].map(q=>new THREE.Vector2(q[0],q[1])),12),mat('amph',0xb06a40)),x,0,0)}
 const L=new THREE.PointLight(0xffc070,12,10,2);L.position.set(0,2,0);g.add(L);return null}
function tradeCamp(g,era){const hide=mat('tenthide',era==='steinzeit'?0x8a6a48:0x9a8a6a),pole=mat('tentpole',0x5a4430);
 for(const [x,z]of[[-8.5,-3.6],[-4.5,3.8],[3.5,-3.8],[8,3.6]]){put(g,new THREE.Mesh(new THREE.ConeGeometry(1.5,2.6,9,1,true),hide),x,1.3,z).material.side=THREE.DoubleSide;for(let i=0;i<4;i++){const a=i/4*Math.PI*2+.3,p=put(g,new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,3.1,5),pole),x+Math.cos(a)*.2,1.5,z+Math.sin(a)*.2);p.rotation.set(Math.sin(a)*.12,0,-Math.cos(a)*.12)}
  for(let i=0;i<3;i++)put(g,new THREE.Mesh(new THREE.BoxGeometry(.9,.06,.6),mat('pelt'+i,[0x6a4e34,0x9a8a6a,0x3a2e24][i])),x+1.7,.06+i*.07,z+(i-1)*.15);
  for(let i=0;i<3;i++)put(g,new THREE.Mesh(new THREE.SphereGeometry(.2,8,6),mat('clay',0x9a5a36)),x-1.6,.25,z-.4+i*.4).scale.y=1.2;
  if(era==='hallstatt')for(let i=0;i<2;i++)put(g,new THREE.Mesh(new THREE.SphereGeometry(.25,8,6),mat('saltsack',0xe8e4dc)),x+1.5,.25,z-.8+i*.5).scale.set(1,.8,1.3);
  else for(let i=0;i<5;i++)put(g,new THREE.Mesh(new THREE.DodecahedronGeometry(.08,0),mat('flint',0x3a3a40,{flatShading:true})),x+1.4+(i%3)*.15,.06,z-.8+Math.floor(i/3)*.15)}}
function carousel(g,x,z){const c=new THREE.Group();c.position.set(x,0,z);g.add(c);const rot=new THREE.Group();c.add(rot);const CL=[0xb8201c,0xf0e6c8,0x2a5a9a,0xd8b040];
 put(rot,new THREE.Mesh(new THREE.CylinderGeometry(2.2,2.2,.25,24),mat('carfloor',0x8a6a44)),0,.3,0);put(c,new THREE.Mesh(new THREE.CylinderGeometry(.18,.18,3.6,10),mat('carpole',0xd8b040,{metalness:.5})),0,1.8,0);
 for(let i=0;i<12;i++){const seg=new THREE.Mesh(new THREE.ConeGeometry(2.6,1.1,12,1,true,i/12*Math.PI*2,Math.PI*2/12),mat('carroof'+i%2,CL[i%2]));seg.material.side=THREE.DoubleSide;put(rot,seg,0,3.75,0)}
 const horses=[];for(let i=0;i<6;i++){const a=i/6*Math.PI*2,h=new THREE.Group();h.position.set(Math.cos(a)*1.6,1,Math.sin(a)*1.6);h.rotation.y=-a;rot.add(h);put(rot,new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,2.9,6),mat('carpole',0xd8b040,{metalness:.5})),Math.cos(a)*1.6,1.75,Math.sin(a)*1.6);
  const hm=mat('horse'+i%3,[0xf0ead8,0x6a4a2c,0x2a2420][i%3]);put(h,new THREE.Mesh(new THREE.BoxGeometry(.3,.35,.9),hm),0,0,0);put(h,new THREE.Mesh(new THREE.BoxGeometry(.2,.45,.22),hm),0,.3,.45).rotation.x=-.4;for(const lx of[-.1,.1])for(const lz of[-.3,.3])put(h,new THREE.Mesh(new THREE.BoxGeometry(.06,.4,.06),hm),lx,-.3,lz);
  put(h,new THREE.Mesh(new THREE.BoxGeometry(.32,.06,.35),mat('saddle',CL[(i+2)%4])),0,.2,0);horses.push(h)}
 return t=>{rot.rotation.y=t*.0006;horses.forEach((h,i)=>h.position.y=1+.18*Math.sin(t*.004+i*1.1))}}
export function eraFest(era,ev){if(!era||['hochmittelalter','spaetmittelalter'].includes(era))return null;const g=new THREE.Group();let anim=null,replace=true,x=0;
 if(ev==='tree'){if(['steinzeit','hallstatt'].includes(era))anim=bonfire(g,0,0,1.2);else if(era==='roemer')saturnalia(g);else if(era==='fruehmittelalter'){anim=bonfire(g,2.6,0,.8)}else return null;
  if(era==='fruehmittelalter')replace=false;}
 else if(ev==='circus'){if(['steinzeit','hallstatt'].includes(era)){tradeCamp(g,era);anim=bonfire(g,-5.5,0,.6)}else if(era==='neuzeit'){anim=carousel(g,-7.5,0);replace=false}else return null}
 else return null;
 return{group:g,anim:anim?((dt,t)=>anim(t)):null,replace}}
