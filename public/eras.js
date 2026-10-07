// Epochen-Edition: Optik je Zeitalter – Wand- und Dachtexturen, Kleidung der Bewohner, eigene Bauten (Tempel, Steinkreis)
import * as T from 'three';

// ---- Prozedurale Texturen (Canvas, nahtlos kachelbar) ----
const TEX={};
function canvasTex(key,draw,size=512){if(TEX[key])return TEX[key];const c=document.createElement('canvas');c.width=c.height=size;const g=c.getContext('2d');let sd=key.length*977+13;const r=()=>(sd=(sd*16807)%2147483647)/2147483647;draw(g,size,r);
 const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.colorSpace=T.SRGBColorSpace;t.anisotropy=8;return TEX[key]=t}
// Lehm-Flechtwerk: Lehmputz mit Strohfasern, darunter schimmern Flechtruten durch
const daub=()=>canvasTex('daub',(g,N,r)=>{g.fillStyle='#a88c66';g.fillRect(0,0,N,N);for(let i=0;i<900;i++){const s=6+r()*30,l=120+r()*60|0;g.fillStyle=`rgba(${l},${l-24|0},${l-58|0},.18)`;g.beginPath();g.ellipse(r()*N,r()*N,s,s*.6,r()*3,0,6.3);g.fill()}
 g.strokeStyle='rgba(90,66,40,.22)';g.lineWidth=7;for(let y=16;y<N;y+=40){g.beginPath();for(let x=0;x<=N;x+=16)g.lineTo(x,y+Math.sin(x*.05+y)*6);g.stroke()}
 g.strokeStyle='rgba(220,200,140,.35)';g.lineWidth=1;for(let i=0;i<700;i++){const x=r()*N,y=r()*N,a=r()*6.3,l=4+r()*10;g.beginPath();g.moveTo(x,y);g.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l);g.stroke()}});
// Römische Dachziegel: flache Leistenziegel (Tegulae) mit runden Deckziegeln (Imbrices) dazwischen
const terracotta=()=>canvasTex('terracotta',(g,N,r)=>{g.fillStyle='#7a3a22';g.fillRect(0,0,N,N);const cols=8,rows=6,w=N/cols,h=N/rows;
 for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const l=.85+r()*.3;g.fillStyle=`rgb(${176*l|0},${86*l|0},${52*l|0})`;g.fillRect(x*w+4,y*h+2,w-8,h-4);g.fillStyle='rgba(60,25,12,.35)';g.fillRect(x*w+4,y*h+h-10,w-8,8)}
 for(let x=0;x<=cols;x++){const gr=g.createLinearGradient(x*w-9,0,x*w+9,0);gr.addColorStop(0,'#6a2c18');gr.addColorStop(.45,'#c8724a');gr.addColorStop(1,'#5a2414');g.fillStyle=gr;g.fillRect(x*w-9,0,18,N)}
 for(let i=0;i<400;i++){g.fillStyle=`rgba(40,30,20,${r()*.12})`;g.fillRect(r()*N,r()*N,3+r()*8,3+r()*8)}});
// Backstein im Kreuzverband mit hellen Mörtelfugen
const brick=()=>canvasTex('brick',(g,N,r)=>{g.fillStyle='#b8ac98';g.fillRect(0,0,N,N);const rows=16,h=N/rows,w=N/8;
 for(let y=0;y<rows;y++){const off=y%2?w/2:0;for(let x=-1;x<9;x++){const l=.8+r()*.35;g.fillStyle=`rgb(${150*l|0},${62*l|0},${44*l|0})`;g.fillRect(x*w+off+2,y*h+2,w-4,h-4);if(r()<.2){g.fillStyle='rgba(30,20,15,.25)';g.fillRect(x*w+off+2,y*h+2,w-4,h-4)}}}});
// Marmor für Tempel: weiß mit feinen grauen Adern
const marble=()=>canvasTex('marble',(g,N,r)=>{g.fillStyle='#e8e4dc';g.fillRect(0,0,N,N);g.lineWidth=1.2;for(let k=0;k<14;k++){g.strokeStyle=`rgba(120,118,112,${.15+r()*.25})`;g.beginPath();let x=r()*N,y=0;g.moveTo(x,y);while(y<N){x+=(r()-.5)*28;y+=12+r()*20;g.lineTo(x,y)}g.stroke()}
 for(let i=0;i<300;i++){g.fillStyle=`rgba(200,196,188,${r()*.3})`;g.fillRect(r()*N,r()*N,6,6)}});

// ---- Materialien je Epoche: Wände (plaster), Stein, Holz, Dächer ----
// roof: welches Dachmaterial ALLE Dächer bekommen (thatch | shingle | slate | redRoof | terracotta | null = wie gebaut)
export const ERA_LOOK={
 steinzeit:{wall:'daub',wallCol:0xb39470,stone:0x8e8a82,wood:0x4a3a2a,roof:'thatch'},
 hallstatt:{wall:'daub',wallCol:0xc4a27a,stone:0x9a9488,wood:0x55432f,roof:'thatch'},
 roemer:{wallCol:0xfff6e6,stone:0xe2dacb,wood:0x6a5440,roof:'terracotta'},
 fruehmittelalter:{wall:'daub',wallCol:0xd0b890,stone:0x9a9284,wood:0x4e3e2c,roof:'shingle'},
 hochmittelalter:{},
 spaetmittelalter:{wallCol:0xf2e8d6,roof:'redRoof'},
 renaissance:{wallCol:0xf0d49a,stone:0xd8ccb0,roof:'terracotta'},
 barock:{wallCol:0xf4d8c8,stone:0xe0d6c4,roof:'slate'},
 napoleon:{wallCol:0xe4ddcc,stone:0xc8c0b0,roof:'slate'},
 neuzeit:{wall:'brick',wallCol:0xffffff,stone:0x8a8478,wood:0x3a2e24,roof:'slate'}};
const ORIG=new WeakMap(),keep=m=>{if(!ORIG.has(m))ORIG.set(m,{map:m.map,normalMap:m.normalMap,roughnessMap:m.roughnessMap,color:m.color.getHex()});return ORIG.get(m)};
export function applyEraMaterials(HD,era){const L=ERA_LOOK[era]||{};
 const set=(m,map,col,src)=>{const o=keep(m);m.map=map||o.map;m.normalMap=src?src.normalMap:o.normalMap;m.roughnessMap=src?src.roughnessMap:o.roughnessMap;m.color.setHex(col??o.color);m.needsUpdate=true};
 const wallTex={daub,brick}[L.wall];set(HD.plaster,wallTex&&wallTex(),L.wallCol,null);
 if(HD.stone)set(HD.stone,null,L.stone,null);if(HD.wood)set(HD.wood,null,L.wood,null);
 // Dächer: Vorlage nehmen (Originalzustand), dann auf alle Dachmaterialien übertragen
 const roofs=['thatch','shingle','slate','redRoof'].filter(k=>HD[k]);roofs.forEach(k=>keep(HD[k]));
 for(const k of roofs){if(!L.roof){set(HD[k],null,null,null);continue}
  if(L.roof==='terracotta'){const o=ORIG.get(HD.redRoof);set(HD[k],terracotta(),0xffffff,{normalMap:o.normalMap,roughnessMap:o.roughnessMap});continue}
  const o=ORIG.get(HD[L.roof]);set(HD[k],o.map,o.color,{normalMap:o.normalMap,roughnessMap:o.roughnessMap})}}

// ---- Kleidung je Epoche (wird in look() vor dem Aufhellen der Farben angewendet) ----
const SOLDIER=['sword','archer','spear','crossbow','knight'],noArmor=o=>{o.breast=false;o.arms=0;o.legs=0;o.hands=o.hands&&'lea';o.mailHood=false;o.mailShirt=false;o.tabard=false;if(o.outfit==='gambeson')o.outfit='jerkin'};
const civHead=(o,r,list)=>{if(!SOLDIER.includes(o.role)&&!['priest','bishop'].includes(o.role))o.head=list[Math.floor(r()*list.length)]};
const pickC=(r,a)=>a[Math.floor(r()*a.length)];
export function eraClothes(o,era,r){if(!era||era==='hochmittelalter')return o;const sol=SOLDIER.includes(o.role);
 if(era==='steinzeit'){const FUR=[0x6a4e34,0x5a422c,0x7a5e40,0x4e3a28,0x8a7050];o.cloth=pickC(r,FUR);o.over=pickC(r,FUR);o.cloak=r()<.6?pickC(r,FUR):0;civHead(o,r,['none']);if(sol){noArmor(o);o.outfit='tunic';o.head='none'}o.apron=false;o.bag=r()<.3;if(!o.female)o.beard=pickC(r,['full','short','full'])}
 else if(era==='hallstatt'){const W=[0x5a6a32,0x7a3424,0xa07a34,0x3e4e5e,0x6a5a3a];o.cloth=pickC(r,W);o.over=pickC(r,W);o.cloak=r()<.5?pickC(r,W):0;civHead(o,r,['none','none','cap']);if(sol){noArmor(o);o.outfit='tunic';o.head='helmet';o.noCoif=true}}
 else if(era==='roemer'){o.cloth=pickC(r,[0xe2d8c2,0xd6caae,0xcab490]);o.over=pickC(r,[0xe2d8c2,0x8a2a22,0x3a5a8a,0xb88a40,0xd6caae]);civHead(o,r,['none','none','none','strawhat']);o.apron=o.apron&&r()<.5;
  if(sol){noArmor(o);o.outfit='tunic';o.breast=true;o.head='helmet';o.noCoif=true;o.cloak=0x8a2a22}}
 else if(era==='fruehmittelalter'){o.cloak=r()<.6?pickC(r,[0x5a4a3a,0x6a5a42,0x4a3a2e]):o.cloak;civHead(o,r,['none','cap','none']);if(sol){noArmor(o);o.mailShirt=true;o.head='helmet'}}
 else if(era==='spaetmittelalter'){o.over=pickC(r,[0x8a1f1f,0x1f3f7a,0x2f6a2a,0x7a5a1a,o.over]);civHead(o,r,['none','chaperon','cap','gugel','none']);if(sol){o.breast=true;o.arms=Math.max(o.arms||0,1);o.head=o.role==='knight'?'visored':pickC(r,['sallet','bascinet'])}}
 else if(era==='renaissance'){o.cloth=pickC(r,[0x2a2a2a,0x5a1a2a,0x1a2a4a,0x4a3a1a]);o.over=pickC(r,[0x8a1a1a,0x1a3a6a,0xc8a040,0x3a1a4a,0x1a4a2a]);civHead(o,r,['none','plume','plume','cap']);if(sol){o.legs=0;o.arms=Math.min(o.arms||0,1);o.head=r()<.5?'plume':'sallet'}}
 else if(era==='barock'){o.cloth=pickC(r,[0x2a3a6a,0x6a1a1a,0x3a4a2a,0x5a4a3a]);o.over=pickC(r,[0xe0d8c8,0xc8b890,o.cloth]);civHead(o,r,['none','hunterhat','hunterhat']);if(sol){noArmor(o);o.head='hunterhat'}}
 else if(era==='napoleon'){o.cloth=pickC(r,[0x2a2a2a,0x4a3a2a,0x2a3a4a,0x5a5048]);if(o.female)o.cloth=pickC(r,[0xd8c8e0,0xe8d8c0,0xc8d8e0]);civHead(o,r,['none','hunterhat','cap']);if(sol){noArmor(o);o.cloth=0xe8e4d8;o.head='cap';o.hatCol=0x141414;o.cloak=0}}
 else if(era==='neuzeit'){o.cloth=pickC(r,[0x2a2826,0x3a3632,0x4a4038,0x34302c]);o.over=pickC(r,[0x2a2826,0x4a4038,0x5a5048]);if(o.female)o.cloth=pickC(r,[0x3a2a3a,0x2a3a4a,0x5a4a3a]);civHead(o,r,['cap','cap','hunterhat','none']);if(sol){noArmor(o);o.cloth=0x2f3f2a;o.head='cap';o.hatCol=0x1e241c;o.cloak=0}}
 if(sol&&globalThis.BFRules){const u=globalThis.BFRules.eraOf(era).units;if(u&&u[o.role])o.eraTitle=u[o.role]}
 return o}

// ---- Eigene Bauten je Epoche: Römischer Tempel und Steinkreis statt Kapelle/Kirche/Dom ----
const SAC=['chapel','church','cathedral'];
export function eraPiece(k,era,ctx){if(!SAC.includes(k))return null;let g=null;
 if(era==='roemer')g=temple(k,ctx);else if(era==='steinzeit'||era==='hallstatt')g=stoneCircle(k,ctx,era);else if(era==='fruehmittelalter')g=woodChurch(k,ctx);else if(['renaissance','barock','napoleon'].includes(era))g=baroqueChurch(k,ctx,era);
 if(g&&era!=='steinzeit'&&era!=='hallstatt')pews(g,k,{...ctx,y0:era==='roemer'?.3:0});return g}
// Bänke und Altar nach dem Innenraum-Plan (Rules.interior), damit Gottesdienst-Sitzplätze wieder auf Bänken liegen
function pews(g,k,{H,y0=0}){const I=globalThis.BFRules.interior(k),wood=H?H.wood:new T.MeshStandardMaterial({color:0x6a4a30}),b=(w,h,d,x,y,z,m)=>{const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y0+y,z);o.castShadow=o.receiveShadow=true;g.add(o)};
 for(const z of I.pews)for(const sx of[-1,1]){const cx=sx*I.bx;b(I.bw,.06,.42,cx,.45,z,wood);b(I.bw,.5,.06,cx,.72,z+.22,wood);for(const e of[-1,1])b(.06,.45,.4,cx+e*(I.bw/2-.05),.22,z,wood)}
 const[ax,az]=I.altar;b(1.8,1.0,.8,ax,.5,az,H?H.stone:wood);b(2.0,.08,.9,ax,1.04,az,new T.MeshStandardMaterial({color:0xece4d4,roughness:.8}));b(1.4,1.6,.12,ax,1.9,az-.42,new T.MeshStandardMaterial({color:0xc8a040,metalness:.6,roughness:.35}))}
const shellWalls=(g,w,d,h,mat,dw,dh,t=.4)=>{const b=(bw,bh,bd,x,y,z)=>{const o=new T.Mesh(new T.BoxGeometry(bw,bh,bd),mat);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;g.add(o)};
 b(w,h,t,0,h/2,-d/2+t/2);b(t,h,d,-w/2+t/2,h/2,0);b(t,h,d,w/2-t/2,h/2,0);const wing=(w-dw)/2;b(wing,h,t,-(dw+wing)/2,h/2,d/2-t/2);b(wing,h,t,(dw+wing)/2,h/2,d/2-t/2);b(dw,h-dh,t,0,(h+dh)/2,d/2-t/2);
 g.colliders=[[0,-d/2+t/2,w/2,t/2,h,0],[-w/2+t/2,0,t/2,d/2,h,0],[w/2-t/2,0,t/2,d/2,h,0],[-(dw+wing)/2,d/2-t/2,wing/2,t/2,h,0],[(dw+wing)/2,d/2-t/2,wing/2,t/2,h,0]]};
const gable=(g,w,d,y,rise,mat,endMat,over=.5)=>{const W=w/2+over,L=Math.hypot(W,rise),a=Math.atan2(rise,W);for(const s of[-1,1]){const p=new T.Mesh(new T.BoxGeometry(L+.1,.14,d+2*over),mat);p.position.set(s*W/2,y+rise/2,0);p.rotation.z=-s*a;p.castShadow=true;g.add(p)}
 const tri=new T.Shape();tri.moveTo(-w/2,0);tri.lineTo(w/2,0);tri.lineTo(0,rise*(w/2)/W);tri.closePath();for(const s of[-1,1]){const m=new T.Mesh(new T.ShapeGeometry(tri),endMat);m.position.set(0,y,s*(d/2-.01));m.material=endMat.clone();m.material.side=T.DoubleSide;g.add(m)}};
const darkWin=new T.MeshStandardMaterial({color:0x1a1814,roughness:.4}),gold=new T.MeshStandardMaterial({color:0xd4a838,metalness:.7,roughness:.3});
function cross(g,x,y,z,s=1){for(const[w,h]of[[.08*s,1*s],[.55*s,.08*s]]){const m=new T.Mesh(new T.BoxGeometry(w,h,.08*s),gold);m.position.set(x,y+(h<.5*s?.18*s:0),z);g.add(m)}}
// Frühmittelalterliche Holzkirche: Bohlenwände, steiles Schindeldach, Dachreiter mit Glocke
function woodChurch(k,{w,d,H}){const g=new T.Group(),h={chapel:3.4,church:4.2,cathedral:6}[k],rise=w*.85;shellWalls(g,w,d,h,H.wood,2,2.6);
 for(let x=-w/2+.6;x<w/2;x+=.55)for(const z of[-d/2-.02,d/2+.02]){if(z>0&&Math.abs(x)<1.2)continue;const o=new T.Mesh(new T.BoxGeometry(.06,h,.04),H.floor||H.wood);o.position.set(x,h/2,z);g.add(o)}
 gable(g,w,d,h,rise,H.shingle,H.wood,.6);const ty=h+rise*.75,tz=d/2-1.2;for(const sx of[-.5,.5])for(const sz of[-.5,.5]){const p=new T.Mesh(new T.BoxGeometry(.14,2,.14),H.wood);p.position.set(sx,ty+1,tz+sz);g.add(p)}
 const pyr=new T.Mesh(new T.ConeGeometry(.95,1.6,4),H.shingle);pyr.rotation.y=Math.PI/4;pyr.position.set(0,ty+2.8,tz);g.add(pyr);cross(g,0,ty+3.9,tz,.9);
 for(const z of[-d/4,d/6])for(const s of[-1,1]){const wn=new T.Mesh(new T.BoxGeometry(.06,.6,.35),darkWin);wn.position.set(s*(w/2+.02),h*.7,z);g.add(wn)}g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});return g}
// Barockkirche (auch Renaissance/Klassizismus): Putzbau, Schweifgiebel-Fassade, Fassadenturm mit Zwiebelhaube (Renaissance: Kuppel, Napoleonik: Spitzhelm)
function baroqueChurch(k,{w,d,H},era){const g=new T.Group(),h={chapel:5,church:7,cathedral:11}[k],pl=H.plaster,st=H.stone;shellWalls(g,w,d,h,pl,2.4,Math.min(3.8,h-.8),.45);
 gable(g,w,d,h,w*.4,H.slate,pl,.3);
 const b=(bw,bh,bd,x,y,z,m)=>{const o=new T.Mesh(new T.BoxGeometry(bw,bh,bd),m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;g.add(o);return o};
 // Fassade: höher als das Schiff, Gesimse, Pilaster, geschweifter Giebel mit Voluten
 const fz=d/2+.12,fh=h+w*.4+1.2;b(w+.3,.3,.5,0,h,fz,st);for(const x of[-w/2+.2,-w/6,w/6,w/2-.2])b(.4,h,.2,x,h/2,fz+.12,st);
 const fw=w*.62;b(fw,fh-h,.5,0,h+(fh-h)/2,fz,pl);for(const s of[-1,1]){const v=new T.Mesh(new T.TorusGeometry(.55,.16,8,16,Math.PI),st);v.position.set(s*(fw/2+.4),h+.55,fz);v.rotation.z=s>0?0:Math.PI/2;g.add(v)}
 const tri=new T.Shape();tri.moveTo(-fw/2-.2,0);tri.lineTo(fw/2+.2,0);tri.lineTo(0,1.1);tri.closePath();const pg=new T.Mesh(new T.ExtrudeGeometry(tri,{depth:.5,bevelEnabled:false}),st);pg.position.set(0,fh,fz-.25);g.add(pg);
 const ow=new T.Mesh(new T.CircleGeometry(.55,20),darkWin);ow.position.set(0,h+(fh-h)*.55,fz+.26);g.add(ow);
 // hohe Rundbogenfenster an den Seiten
 for(let z=-d/2+2;z<d/2-1.5;z+=2.4)for(const s of[-1,1]){b(.06,h*.45,.8,s*(w/2+.02),h*.55,z,darkWin);const a=new T.Mesh(new T.CircleGeometry(.4,12,0,Math.PI),darkWin);a.position.set(s*(w/2+.03),h*.55+h*.225,z);a.rotation.y=s*Math.PI/2;g.add(a)}
 // Turm über dem Westgiebel (bei der Kapelle Dachreiter)
 const big=k!=='chapel',tw=big?Math.min(3.2,w*.4):1.2,tz=big?d/2-tw/2-.2:d/4,ty0=big?0:h+w*.3,th=big?fh+3.5:1.6;b(tw,th,tw,0,ty0+th/2,tz,pl);b(tw+.25,.25,tw+.25,0,ty0+th,tz,st);
 for(const[x,z,ry]of[[0,tw/2+.02,0],[0,-tw/2-.02,Math.PI],[tw/2+.02,0,Math.PI/2],[-tw/2-.02,0,-Math.PI/2]])if(big){const sl=b(.5,1.2,.05,x,ty0+th-1.2,tz+z,darkWin);sl.rotation.y=ry}
 const R=tw*.55,top=ty0+th+.12;let prof;if(era==='napoleon')prof=[[R,0],[R*.8,.6],[.05,R*3.2],[0,R*3.3]];else if(era==='renaissance')prof=[[R,0],[R*.98,R*.4],[R*.75,R*.85],[R*.35,R*1.05],[.12,R*1.1],[.12,R*1.5],[0,R*1.55]];
 else prof=[[R*.9,0],[R*1.15,R*.5],[R*.95,R*1.05],[R*.3,R*1.5],[.12,R*1.7],[.2,R*2],[.12,R*2.3],[.06,R*2.9],[0,R*3]];
 const dome=new T.Mesh(new T.LatheGeometry(prof.map(q=>new T.Vector2(q[0],q[1])),18),era==='renaissance'?new T.MeshStandardMaterial({color:0x6a8a78,roughness:.5,metalness:.4}):H.slate);dome.position.set(0,top,tz);dome.castShadow=true;g.add(dome);
 cross(g,0,top+prof.at(-1)[1]+.5,tz,big?1.2:.8);g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});return g}
function temple(k,{w,d,stone,plaster}){const g=new T.Group(),sz={chapel:[.2,3.6],church:[.26,4.6],cathedral:[.42,8]}[k],R=sz[0],H=sz[1],P=.3;
 const marbleM=new T.MeshStandardMaterial({map:marble(),roughness:.55}),tile=new T.MeshStandardMaterial({map:terracotta(),roughness:.8}),cellaM=plaster||stone;
 const box=(bw,bh,bd,m,x,y,z)=>{const o=new T.Mesh(new T.BoxGeometry(bw,bh,bd),m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;g.add(o);return o};
 // Podium mit Freitreppe an der Front (+z)
 box(w,P,d-1.2,marbleM,0,P/2,-.6);for(let s=0;s<3;s++)box(w*.7,P/3*(s+1),.4,marbleM,0,P/6*(s+1),d/2-.2-s*.4);
 // Säulenumgang (Peripteros) mit Basis und Kapitell
 const nx=Math.max(4,Math.round(w/1.6)),nz=Math.max(5,Math.round((d-1.2)/1.7)),col=(x,z)=>{const c=new T.Mesh(new T.CylinderGeometry(R*.85,R,H,14),marbleM);c.position.set(x,P+H/2,z);c.castShadow=true;g.add(c);box(R*2.6,.14,R*2.6,marbleM,x,P+.07,z);box(R*2.8,.16,R*2.8,marbleM,x,P+H-.08,z)};
 const x0=-w/2+R+.25,x1=w/2-R-.25,z0=-(d-1.2)/2-.6+R+.25,z1=(d-1.2)/2-.6-R-.25;
 for(let i=0;i<nx;i++){const x=x0+(x1-x0)*i/(nx-1);col(x,z0);col(x,z1)}for(let j=1;j<nz-1;j++){const z=z0+(z1-z0)*j/(nz-1);col(x0,z);col(x1,z)}
 // Cella mit Portal an der Front
 const cw=w-2.4*R-2.2,cd=(z1-z0)-2.2,cz=(z0+z1)/2,ch=H*.92,dw=Math.min(2.2,cw*.4);
 box(cw,ch,.3,cellaM,0,P+ch/2,cz-cd/2);box(.3,ch,cd,cellaM,-cw/2,P+ch/2,cz);box(.3,ch,cd,cellaM,cw/2,P+ch/2,cz);
 box((cw-dw)/2,ch,.3,cellaM,-(cw+dw)/4,P+ch/2,cz+cd/2);box((cw-dw)/2,ch,.3,cellaM,(cw+dw)/4,P+ch/2,cz+cd/2);box(dw,ch*.3,.3,cellaM,0,P+ch*.85,cz+cd/2);
 // Gebälk, Satteldach mit Ziegeln, Giebeldreiecke
 const eY=P+H,ew=x1-x0+R*3,ed=z1-z0+R*3,ez=(z0+z1)/2;box(ew,.45,ed,marbleM,0,eY+.22,ez);
 const rh=ew*.22,slope=Math.hypot(ew/2,rh),ang=Math.atan2(rh,ew/2);for(const s of[-1,1]){const p=box(slope+.2,.12,ed+.4,tile,s*ew/4,eY+.45+rh/2,ez);p.rotation.z=-s*ang}
 const tri=new T.Shape();tri.moveTo(-ew/2,0);tri.lineTo(ew/2,0);tri.lineTo(0,rh);tri.closePath();for(const s of[-1,1]){const m=new T.Mesh(new T.ExtrudeGeometry(tri,{depth:.2,bevelEnabled:false}),marbleM);m.position.set(0,eY+.45,ez+s*(ed/2-.1)-.1);m.castShadow=true;g.add(m)}
 const cs=.15;g.colliders=[[0,cz-cd/2,cw/2,cs,ch],[-cw/2,cz,cs,cd/2,ch],[cw/2,cz,cs,cd/2,ch],[-(cw+dw)/4,cz+cd/2,(cw-dw)/4,cs,ch],[(cw+dw)/4,cz+cd/2,(cw-dw)/4,cs,ch]];
 g.walkAreas=[[0,-.6,w/2-.1,(d-1.2)/2-.1,P]];return g}
function stoneCircle(k,{w,d},era){const g=new T.Group(),rx=w/2-.6,rz=d/2-.6,n={chapel:10,church:14,cathedral:24}[k],big=k==='cathedral';let sd=k.length*31+era.length;const r=()=>(sd=(sd*16807)%2147483647)/2147483647;
 const rock=new T.MeshStandardMaterial({color:0x8a8780,roughness:1,flatShading:true}),moss=new T.MeshStandardMaterial({color:0x6a7258,roughness:1,flatShading:true});g.colliders=[];g.terrainConform=true;
 const stone=(x,z,h,wd,a)=>{const geo=new T.BoxGeometry(wd,h,.55,1,3,1),P=geo.attributes.position;for(let i=0;i<P.count;i++){P.setX(i,P.getX(i)*(1-.18*(P.getY(i)/h+.5)**2)+(r()-.5)*.06);P.setZ(i,P.getZ(i)+(r()-.5)*.06)}geo.computeVertexNormals();
  const m=new T.Mesh(geo,r()<.3?moss:rock);m.position.set(x,h/2-.05,z);m.rotation.set((r()-.5)*.08,a,(r()-.5)*.08);m.castShadow=m.receiveShadow=true;g.add(m);g.colliders.push([x,z,.35,.35,h])};
 for(let i=0;i<n;i++){if(i===0)continue;const a=i/n*Math.PI*2+Math.PI/2,x=Math.cos(a)*rx,z=Math.sin(a)*rz,h=(big?3.4:2.2)+r()*1.1;stone(x,z,h,.9+r()*.5,-a+Math.PI/2);
  if(big&&i%2===0&&i+1<n){const a2=(i+1)/n*Math.PI*2+Math.PI/2,lx=(x+Math.cos(a2)*rx)/2,lz=(z+Math.sin(a2)*rz)/2,L=new T.Mesh(new T.BoxGeometry(2.4,.5,.6),rock);L.position.set(lx,h+.2,lz);L.rotation.y=-(a+a2)/2+Math.PI/2;L.castShadow=true;g.add(L)}}
 // Opferstein in der Mitte, Feuerschale am Eingang (Lücke vorn bei +z)
 const alt=new T.Mesh(new T.BoxGeometry(1.6,.55,.9),rock);alt.position.set(0,.27,-rz*.45);alt.castShadow=alt.receiveShadow=true;g.add(alt);g.colliders.push([0,-rz*.45,.8,.45,.55]);
 const ring=new T.Mesh(new T.TorusGeometry(.45,.12,6,12),rock);ring.rotation.x=Math.PI/2;ring.position.set(0,.12,rz*.15);g.add(ring);return g}

// ---- Bauweise je Epoche für alle Gebäude (wird in buildReference angewendet) ----
// timber: Fachwerk · ov: Vorkragung der Obergeschosse · roof: gable | hip | mansard · rise: Dachhöhe-Faktor · over: Dachüberstand
// drop: Traufe tiefer als die Wand (tief heruntergezogene Strohdächer) · win: none | hole | std | arch | tall · chimney: none | stone | brick · extras: Anbauten
export const ERA_BUILD={
 steinzeit:{timber:false,ov:0,roof:'hip',rise:1.5,over:.9,drop:.9,win:'none',chimney:'none',extras:'stone'},
 hallstatt:{timber:false,ov:0,roof:'hip',rise:1.35,over:.7,drop:.6,win:'hole',chimney:'none',extras:'iron'},
 roemer:{timber:false,ov:0,roof:'hip',rise:.5,over:.35,drop:0,win:'arch',chimney:'none',extras:'roman'},
 fruehmittelalter:{timber:true,ov:0,roof:'gable',rise:1.15,over:.4,drop:0,win:'hole',chimney:'stone',extras:'early'},
 hochmittelalter:{timber:true,ov:.42,roof:'gable',rise:1,over:.4,drop:0,win:'std',chimney:'stone',extras:''},
 spaetmittelalter:{timber:true,ov:.42,roof:'gable',rise:1.25,over:.4,drop:0,win:'std',chimney:'stone',extras:'late'},
 renaissance:{timber:false,ov:0,roof:'hip',rise:.6,over:.45,drop:0,win:'tall',chimney:'stone',extras:'cornice'},
 barock:{timber:false,ov:0,roof:'mansard',rise:.9,over:.3,drop:0,win:'tall',chimney:'stone',extras:'baroque'},
 napoleon:{timber:false,ov:0,roof:'hip',rise:.7,over:.35,drop:0,win:'tall',chimney:'stone',extras:'cornice'},
 neuzeit:{timber:false,ov:0,roof:'gable',rise:.75,over:.3,drop:0,win:'tall',chimney:'brick',extras:'industry'}};
export const eraBuild=e=>ERA_BUILD[e]||ERA_BUILD.hochmittelalter;

// ---- Waffen, Schilde und Geschosse der Truppen je Epoche ----
// w: Waffe je Truppengattung · sh: Schild (null = keiner, undefined = wie Hochmittelalter) · shot: arrow | bullet
export const ERA_ARMS={
 steinzeit:{w:{sword:'club',spear:'stonespear',archer:'bow',crossbow:'sling',knight:'stonespear'},sh:{sword:'hide',spear:'hide',knight:'hide'},shot:'arrow'},
 hallstatt:{w:{sword:'sword',spear:'spear',archer:'bow',crossbow:'sling',knight:'spear'},sh:{sword:'oval',spear:'oval',knight:'oval'},shot:'arrow'},
 roemer:{w:{sword:'gladius',spear:'pilum',archer:'bow',crossbow:'sling',knight:'spear'},sh:{sword:'scutum',spear:'scutum',knight:'oval'},shot:'arrow'},
 fruehmittelalter:{w:{sword:'sword',spear:'spear',archer:'bow',crossbow:'crossbow',knight:'lance'},sh:{sword:'round',spear:'round',knight:'kite'},shot:'arrow'},
 hochmittelalter:{w:{},sh:{},shot:'arrow'},
 spaetmittelalter:{w:{sword:'sword',spear:'halberd',archer:'bow',crossbow:'arquebus',knight:'lance'},sh:{sword:'heater',spear:null,knight:'heater'},shot:'arrow'},
 renaissance:{w:{sword:'sword',spear:'pike',archer:'arquebus',crossbow:'crossbow',knight:'saber'},sh:{sword:null,spear:null,knight:null},shot:'bullet'},
 barock:{w:{sword:'musket',spear:'pike',archer:'musket',crossbow:'musket',knight:'saber'},sh:{sword:null,spear:null,knight:null},shot:'bullet'},
 napoleon:{w:{sword:'musket',spear:'musket',archer:'rifle',crossbow:'rifle',knight:'saber'},sh:{sword:null,spear:null,knight:null},shot:'bullet'},
 neuzeit:{w:{sword:'saber',spear:'rifle',archer:'rifle',crossbow:'rifle',knight:'saber'},sh:{sword:null,spear:null,knight:null},shot:'bullet'}};
const SOLD=['sword','archer','spear','crossbow','knight'];
export const eraWeapon=(era,role,tool)=>{const A=ERA_ARMS[era];if(!A||!SOLD.includes(role))return tool;return A.w[role]||tool};
export const eraShield=(era,role,def)=>{const A=ERA_ARMS[era];if(!A||!(role in A.sh))return def;return A.sh[role]};
export const eraShot=era=>(ERA_ARMS[era]||{}).shot||'arrow';
export const MELEE=['sword','lance','spear','club','stonespear','gladius','pilum','pike','halberd','saber','musket','rifle','arquebus'];
