// Burgenfall – Tiere: modellierte Körper mit Anatomie, Fellmustern und individuellen Varianten.
// Schnittstelle wie das alte quad(): g.isQuad, g.body, g.neck, g.head, g.ears[], g.tail, g.legs[{up,lo,ank}], g.gz, g.ph
import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
const ssm=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t)};
const lerp=(a,b,t)=>a+(b-a)*t;
function rnd(seed){let a=seed|0;return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
// Catmull-Rom über Stützstellen [s, v1, v2, ...]
function prof(P,s,k){const n=P.length;if(s<=P[0][0])return P[0][k];if(s>=P[n-1][0])return P[n-1][k];let i=0;while(s>P[i+1][0])i++;
 const p0=P[Math.max(i-1,0)],p1=P[i],p2=P[i+1],p3=P[Math.min(i+2,n-1)],t=(s-p1[0])/(p2[0]-p1[0]),a=p0[k],b=p1[k],c=p2[k],d=p3[k];return b+.5*t*(c-a+t*(2*a-5*b+4*c-d+t*(3*(b-c)+d-a)))}
// Gitterfläche F(u,v)->[x,y,z,r,g,b]
function grid(F,nu,nv){const pos=[],col=[],idx=[];for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){const p=F(i/nu,j/nv);pos.push(p[0],p[1],p[2]);col.push(p[3]??1,p[4]??1,p[5]??1)}
 for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){const A=j*(nu+1)+i,B=A+1,C=A+nu+1,D=C+1;idx.push(A,C,B,B,C,D)}
 // Wicklung selbst prüfen: Normalen müssen nach außen zeigen, sonst ist die Fläche von außen unsichtbar (Körper wirkt durchsichtig)
 let cx=0,cy=0,cz=0;const n=pos.length/3;for(let i=0;i<pos.length;i+=3){cx+=pos[i];cy+=pos[i+1];cz+=pos[i+2]}cx/=n;cy/=n;cz/=n;let out=0,tot=0;
 for(let t=0;t<idx.length;t+=3){const a=idx[t]*3,b=idx[t+1]*3,c=idx[t+2]*3,ux=pos[b]-pos[a],uy=pos[b+1]-pos[a+1],uz=pos[b+2]-pos[a+2],vx=pos[c]-pos[a],vy=pos[c+1]-pos[a+1],vz=pos[c+2]-pos[a+2],nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx,d=nx*(pos[a]-cx)+ny*(pos[a+1]-cy)+nz*(pos[a+2]-cz);if(d>0)out++;if(d)tot++}
 if(out<tot/2)for(let t=0;t<idx.length;t+=3){const q=idx[t+1];idx[t+1]=idx[t+2];idx[t+2]=q}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.setIndex(idx);g.computeVertexNormals();return g}
const add=(par,geo,mat,p=[0,0,0],s)=>{const m=new T.Mesh(geo,mat);m.position.set(...p);if(s)m.scale.set(...s);m.castShadow=true;m.receiveShadow=true;par.add(m);return m};
const sph=new T.SphereGeometry(1,12,8);
// sich verjüngendes Rohr entlang einer Kurve (Hörner, Schwanz, Riemen)
function taper(pts,r0,r1,col=[1,1,1],seg=7,n=16){const cv=new T.CatmullRomCurve3(pts.map(p=>new T.Vector3(...p)));const fr=cv.computeFrenetFrames(n,false);
 return grid((u,v)=>{const i=Math.round(v*n),t=i/n,p=cv.getPointAt(t),N=fr.normals[i],B=fr.binormals[i],a=u*2*Math.PI,r=lerp(r0,r1,t);return[p.x+r*(Math.cos(a)*N.x+Math.sin(a)*B.x),p.y+r*(Math.cos(a)*N.y+Math.sin(a)*B.y),p.z+r*(Math.cos(a)*N.z+Math.sin(a)*B.z),...col]},seg,n)}
// ---------------- Arten: Rumpf [s, Rückenlinie, Bauchlinie, halbe Breite], Beine, Hals, Kopf ----------------
const SP={
 horse:{L:1.7,body:[[0,1.36,1.16,.04],[.05,1.5,1.05,.2],[.18,1.6,.98,.27],[.35,1.58,.94,.28],[.55,1.56,.92,.27],[.75,1.62,.96,.27],[.88,1.62,1.03,.23],[.97,1.5,1.12,.15],[1,1.4,1.2,.05]],
  fl:{y:1.12,z:.6,seg:[.42,.36,.2],r:[.075,.05,.042,.035],hoof:'solid'},hl:{y:1.18,z:-.62,seg:[.5,.38,.2],r:[.1,.055,.042,.035],hoof:'solid'},
  neck:{y:1.48,z:.72,len:.74,w:[.17,.13,.1],d:[.34,.24,.17],crest:.1,rest:.75},head:{len:.6,prof:[[0,.1,-.1,.1],[.25,.11,-.12,.105],[.55,.06,-.1,.075],[.85,.02,-.09,.07],[1,-.01,-.07,.045]],ear:[.05,.14],eyeZ:.18},
  tail:{y:1.4,len:.75,hair:1},cols:[[0x6b4a2b,'bay'],[0x8a5a30,'chestnut'],[0x3a2a20,'black'],[0x9a9a96,'grey'],[0xb08a5a,'dun'],[0x5a3a24,'bay']]},
 cow:{L:1.6,body:[[0,1.3,.95,.05],[.05,1.38,.82,.24],[.2,1.4,.7,.31],[.45,1.38,.62,.34],[.65,1.38,.66,.32],[.82,1.42,.74,.28],[.95,1.32,.85,.18],[1,1.22,.95,.05]],
  fl:{y:.9,z:.56,seg:[.34,.3,.14],r:[.085,.055,.045,.04],hoof:'cloven'},hl:{y:.98,z:-.58,seg:[.4,.32,.14],r:[.1,.06,.045,.04],hoof:'cloven'},
  neck:{y:1.2,z:.7,len:.42,w:[.2,.17,.14],d:[.36,.28,.22],crest:.02,rest:1.1,dew:1},head:{len:.48,prof:[[0,.12,-.12,.13],[.3,.1,-.14,.13],[.7,.04,-.12,.1],[1,0,-.08,.1]],ear:[.08,.07],eyeZ:.12,horn:1},
  tail:{y:1.32,len:.75,tuft:1},cols:[[0x8a6a48,'patch'],[0x3a2a22,'patch'],[0x9a5a30,'solid'],[0x6a4a30,'patch'],[0xc8b090,'solid']]},
 pig:{L:1.05,body:[[0,.7,.42,.06],[.06,.76,.3,.22],[.25,.8,.24,.27],[.5,.79,.22,.27],[.75,.78,.26,.25],[.92,.72,.32,.2],[1,.64,.4,.08]],
  fl:{y:.34,z:.36,seg:[.16,.12,.07],r:[.07,.04,.033,.03],hoof:'cloven'},hl:{y:.38,z:-.36,seg:[.2,.12,.07],r:[.08,.045,.035,.03],hoof:'cloven'},
  neck:{y:.6,z:.5,len:.12,w:[.18,.16,.15],d:[.3,.28,.26],crest:0,rest:1.35},head:{len:.36,prof:[[0,.14,-.14,.15],[.35,.1,-.12,.12],[.75,.03,-.07,.07],[1,.02,-.05,.07]],ear:[.09,.11],eyeZ:.12,snout:1},
  tail:{y:.72,len:.14,curl:1},cols:[[0xe8b0a8,'pink'],[0xd89a90,'pink'],[0x3a2a26,'saddle'],[0xc08a70,'spots'],[0x6a4a3a,'wild']]},
 sheep:{L:.92,body:[[0,.74,.5,.08],[.06,.8,.42,.24],[.3,.84,.38,.27],[.6,.84,.38,.27],[.85,.82,.44,.24],[1,.72,.54,.1]],
  fl:{y:.48,z:.3,seg:[.2,.18,.08],r:[.045,.03,.025,.022],hoof:'cloven'},hl:{y:.52,z:-.32,seg:[.24,.2,.08],r:[.05,.03,.025,.022],hoof:'cloven'},
  neck:{y:.74,z:.4,len:.2,w:[.12,.1,.08],d:[.16,.13,.11],crest:0,rest:.85,wool:1},head:{len:.27,prof:[[0,.08,-.08,.08],[.4,.07,-.08,.07],[.8,.03,-.06,.045],[1,.01,-.04,.035]],ear:[.07,.04],eyeZ:.09,earSide:1},
  tail:{y:.74,len:.12},wool:1,cols:[[0xf0ece2,'white'],[0xe6dcc8,'white'],[0xd8ccb4,'blackface'],[0x5a4a3a,'brown'],[0xece6da,'blackface']]},
 deer:{L:1.05,body:[[0,1.0,.84,.04],[.06,1.06,.74,.15],[.3,1.08,.68,.19],[.6,1.06,.66,.19],[.85,1.12,.72,.17],[1,1.0,.84,.05]],
  fl:{y:.76,z:.38,seg:[.3,.28,.14],r:[.05,.03,.022,.02],hoof:'cloven'},hl:{y:.82,z:-.38,seg:[.36,.3,.14],r:[.065,.032,.022,.02],hoof:'cloven'},
  neck:{y:1.05,z:.46,len:.42,w:[.09,.07,.06],d:[.15,.11,.09],crest:.01,rest:.55},head:{len:.3,prof:[[0,.07,-.07,.075],[.4,.06,-.07,.06],[.8,.02,-.05,.035],[1,0,-.035,.025]],ear:[.06,.15],eyeZ:.1,antler:1},
  tail:{y:1.0,len:.14},cols:[[0x9a7048,'deer'],[0x8a6040,'deer']]},
 wolf:{L:1.0,body:[[0,.74,.6,.04],[.06,.78,.52,.13],[.3,.8,.48,.15],[.6,.82,.46,.17],[.85,.84,.52,.18],[1,.74,.6,.05]],
  fl:{y:.56,z:.36,seg:[.24,.22,.1],r:[.045,.03,.024,.03],hoof:'paw'},hl:{y:.6,z:-.36,seg:[.28,.22,.1],r:[.055,.03,.024,.03],hoof:'paw'},
  neck:{y:.78,z:.44,len:.24,w:[.1,.09,.08],d:[.16,.14,.12],crest:.01,rest:.95,ruff:1},head:{len:.32,prof:[[0,.08,-.07,.09],[.35,.07,-.06,.075],[.6,.02,-.04,.035],[1,0,-.025,.02]],ear:[.05,.09],eyeZ:.1,pointy:1},
  tail:{y:.76,len:.42,bushy:1},cols:[[0x3a3a42,'wolf'],[0x5a5450,'wolf'],[0x6a5a48,'wolf']]}};
// Epochen-Tiere: Auerochse und Wildpferd (Steinzeit/Hallstatt), Ziege (statt Schaf in der Vorzeit)
SP.aurochs={...SP.cow,cols:[[0x2a1e18,'solid'],[0x3a2418,'solid'],[0x4a2e1e,'solid']],big:1.3,base:'cow'};
SP.wildhorse={...SP.horse,cols:[[0xa88a5a,'dun'],[0x9a7a4a,'dun'],[0x8a6a40,'dun']],big:.85,base:'horse'};
SP.goat={...SP.sheep,wool:0,neck:{...SP.sheep.neck,wool:0},head:{...SP.sheep.head,horn:1,earSide:1},cols:[[0x8a6a48,'solid'],[0xe8e2d4,'solid'],[0x4a3a2c,'solid'],[0xa08060,'patch']],base:'sheep'};
// ---------------- Fellfarben & Muster ----------------
function coat(kind,r){const S=SP[kind],[base,pat]=S.cols[Math.floor(r()*S.cols.length)],c=new T.Color(base),ph=[r()*9,r()*9,r()*9,r()*9];
 const socks=[r()<.3,r()<.3,r()<.4,r()<.4],blaze=r()<.4,white=new T.Color(0xf0ece4),dark=c.clone().multiplyScalar(.35),pink=new T.Color(0xe8b0a8),tmp=new T.Color();
 const noise=(x,y,z,f)=>Math.sin(x*f+ph[0])*Math.sin(y*f*1.3+ph[1])+Math.sin(z*f*.9+ph[2])*Math.cos(x*f*.7+ph[3])+.5*Math.sin((x+z)*f*2.1+ph[1]);
 // part: 'body','leg','head','mane','belly'; liefert Farbe für einen Weltpunkt
 return{base:c,pat,fn(part,x,y,z,leg=-1,low=0){tmp.copy(c);
  if(kind==='horse'){if(pat==='grey'&&part!=='mane')tmp.lerp(white,ssm(.2,.9,noise(x,y,z,9))*.45);if(pat==='bay'&&(part==='mane'||(part==='leg'&&low>.35)))tmp.copy(dark);if(pat==='dun'&&part==='mane')tmp.copy(dark);
   if(part==='leg'&&leg>=0&&socks[leg]&&low>.7)tmp.copy(white);if(part==='head'&&blaze&&Math.abs(x)<.03&&z>.1)tmp.copy(white)}
  if(kind==='cow'&&pat==='patch'&&part!=='horn'&&noise(x,y,z,3.2)>.4)tmp.copy(white);
  if(kind==='cow'&&part==='head'&&pat==='patch'&&Math.abs(x)<.06&&z>.05)tmp.copy(white);
  if(kind==='pig'){if(pat==='saddle'&&part!=='head'&&Math.abs(z+.05)<.16&&y>.4)tmp.copy(pink);if(pat==='spots'&&noise(x,y,z,6)>.9)tmp.multiplyScalar(.4);if(pat==='wild')tmp.lerp(new T.Color(0x3a2a20),ssm(.5,.8,y))}
  if(kind==='sheep'){if(part==='head'||part==='leg'){tmp.copy(pat==='blackface'?new T.Color(0x2a2420):pat==='brown'?new T.Color(0x3a2a20):new T.Color(0xe8dcc8))}}
  if(kind==='deer'&&(part==='belly'||(part==='head'&&y<0)))tmp.lerp(white,.55);if(kind==='deer'&&part==='body'&&z<-.4&&y<.95)tmp.lerp(white,.7);
  if(kind==='wolf'){tmp.lerp(new T.Color(0xc8beb0),part==='belly'?.6:part==='head'&&y<0?.5:0);tmp.multiplyScalar(.85+.3*ssm(-1,1,noise(x,y,z,14)))}
  return tmp}}}
// ---------------- Bauteile ----------------
function bodyGeo(S,C,kind){const L=S.L,P=S.body,wool=S.wool;
 return grid((u,v)=>{const s=1-v,z=-L/2+s*L,top=prof(P,s,1),bot=prof(P,s,2),w=prof(P,s,3),th=u*2*Math.PI,st=Math.sin(th),ct=Math.cos(th),e=.75;
  const yc=(top+bot)/2,hy=(top-bot)/2,end=Math.sqrt(Math.max(0,Math.min(1,s/.04,(1-s)/.04)));
  let x=w*Math.sign(st)*Math.abs(st)**e,y=yc+hy*Math.sign(ct)*Math.abs(ct)**e;
  // Muskulatur: Schulter & Keule, Rippen, Rückgrat
  const mus=.035*Math.exp(-(((s-.82)/.08)**2))+.04*Math.exp(-(((s-.14)/.1)**2));x*=1+mus*2*(ct<0?.4:1);x*=end<1?.2+.8*end:1;
  if(ct>.95)y+=.006;let wd=0;if(wool){const n=Math.sin(u*60)*Math.sin(v*40)+Math.sin(u*37+v*23);wd=.03+.012*n;x+=Math.sign(st)*wd*Math.abs(st);y+=wd*ct*(ct>0?1:.5)}
  const part=ct<-.6?'belly':'body',col=C.fn(part,x,y,z),ao=.72+.28*ssm(bot,top,y)*(wool?.9+.1*Math.sin(u*90)*Math.sin(v*60):1);return[x,y,z,col.r*ao,col.g*ao,col.b*ao]},28,36)}
function neckGeo(S,C){const N=S.neck,woolE=N.wool?.03:0;return grid((u,v)=>{const t=v,a=u*2*Math.PI,w=prof([[0,N.w[0]],[.5,N.w[1]],[1,N.w[2]]],t,1)+woolE,d=prof([[0,N.d[0]],[.5,N.d[1]],[1,N.d[2]]],t,1)+woolE;
  let x=w*Math.sin(a),z=d*.5*Math.cos(a)+(Math.cos(a)<0?-N.crest*Math.sin(Math.PI*t)*-Math.cos(a):0);const y=t*N.len;if(N.dew&&Math.cos(a)>.5)z+=.06*Math.sin(Math.PI*t)*Math.cos(a);
  if(N.ruff)x*=1+.25*Math.sin(Math.PI*t)**2;const col=C.fn(N.wool?'body':'body',x,y+N.y,z+N.z);return[x,y,z,col.r,col.g,col.b]},18,10)}
function headGeo(S,C){const H=S.head,P=H.prof,Lh=H.len;return grid((u,v)=>{const t=1-v,a=u*2*Math.PI,top=prof(P,t,1),bot=prof(P,t,2),w=prof(P,t,3),end=Math.sqrt(Math.max(0,Math.min(1,t/.06,(1-t)/.04)));
  const yc=(top+bot)/2,hy=(top-bot)/2,st=Math.sin(a),ct=Math.cos(a);let x=w*Math.sign(st)*Math.abs(st)**.8*(.25+.75*end),y=yc+hy*Math.sign(ct)*Math.abs(ct)**.8*(.3+.7*end),z=-.12*Lh+t*Lh;
  if(H.snout&&t>.95)y=y;const col=C.fn('head',x,y,z),dk=t>.88&&!H.snout?.55:1;return[x,y,z,col.r*dk,col.g*dk,col.b*dk]},20,16)}
function legGeo(len,r0,r1,C,leg,partLow,cfn){return grid((u,v)=>{const y=-v*len,a=u*2*Math.PI,r=lerp(r0,r1,v)*(1+.12*Math.exp(-(((v-.05)/.12)**2)));const x=r*Math.sin(a),z=r*1.08*Math.cos(a),col=cfn(x,y,z,lerp(partLow[0],partLow[1],v));return[x,y,z,col.r,col.g,col.b]},12,6)}
// ---------------- Zusammenbau ----------------
export function createAnimal(kind='cow',opts={}){const S=SP[kind]||SP.cow,r=rnd(opts.seed??(Math.random()*1e9|0)),C=coat(kind,r),mat=new T.MeshStandardMaterial({vertexColors:true,roughness:S.wool?1:.85}),
 dk=new T.MeshStandardMaterial({color:kind==='horse'?0x2a2218:0x2a2420,roughness:.7}),eyeM=new T.MeshStandardMaterial({color:0x140e0a,roughness:.15,metalness:.1}),hornM=new T.MeshStandardMaterial({color:0xd8ccb0,roughness:.5,vertexColors:true});
 const g=new T.Group();g.isQuad=true;g.kind=kind;kind=S.base||kind;   // Epochen-Tiere nutzen Bauplan und Details der Grundart
 const sc=(opts.scale??(.9+r()*.2))*(S.big||1);g.scale.setScalar(sc);
 g.body=new T.Group();g.add(g.body);add(g.body,bodyGeo(S,C,kind),mat);
 // Beine: up (Oberarm/Keule) -> lo (Röhre) -> ank (Fessel + Huf)
 g.legs=[];[[-1,1],[1,1],[-1,-1],[1,-1]].forEach(([sx,sz],li)=>{const Lg=sz>0?S.fl:S.hl,w=prof(S.body,sz>0?.82:.15,3),hip=new T.Group();hip.position.set(sx*w*.62,Lg.y,Lg.z);
  const kk=Lg.y/(Lg.seg[0]+Lg.seg[1]+Lg.seg[2]),[a,b,c]=Lg.seg.map(x=>x*kk),cf=(x,y,z,low)=>C.fn('leg',x,y,z,li,low),hind=sz<0;
  add(hip,legGeo(a,Lg.r[0],Lg.r[1],C,li,[0,.4],cf),mat,[0,0,0]);add(hip,sph,mat,[0,-a*.04,0],[Lg.r[0]*1.04,Lg.r[0]*1.15,Lg.r[0]*1.1]);
  const kn=new T.Group();kn.position.set(0,-a,hind?-.03:.0);hip.add(kn);add(kn,sph,mat,[0,0,0],[Lg.r[1]*1.02,Lg.r[1]*1.05,Lg.r[1]*1.1]);
  add(kn,legGeo(b,Lg.r[1],Lg.r[2],C,li,[.4,.8],cf),mat);
  const an=new T.Group();an.position.set(0,-b,0);kn.add(an);add(an,sph,mat,[0,0,.005],[Lg.r[2]*1.05,Lg.r[2]*1.05,Lg.r[2]*1.12]);
  const pz=.025;add(an,legGeo(c*.7,Lg.r[2],Lg.r[3],C,li,[.8,1],cf),mat,[0,0,pz*.3]);
  // Hufe: einteilig (Pferd), Paarhuf (Rind, Schwein, Schaf, Hirsch) oder Pfote (Wolf)
  if(Lg.hoof==='solid')add(an,new T.CylinderGeometry(Lg.r[3]*1.05,Lg.r[3]*1.35,c*.3,14),dk,[0,-c*.85,pz]);
  else if(Lg.hoof==='paw'){add(an,sph,mat,[0,-c*.9,pz+.02],[Lg.r[3]*1.3,Lg.r[3]*.7,Lg.r[3]*1.8]);for(const t of[-1,0,1])add(an,sph,dk,[t*Lg.r[3]*.5,-c*.96,pz+.02+Lg.r[3]*1.5],[.008,.006,.01])}
  else for(const t of[-1,1]){const h=add(an,new T.CylinderGeometry(Lg.r[3]*.45,Lg.r[3]*.7,c*.32,8),dk,[t*Lg.r[3]*.42,-c*.86,pz]);h.scale.z=1.4}
  g.body.add(hip);g.legs.push({up:hip,lo:kn,ank:an})});
 // Hals + Kopf
 const N=S.neck;g.neck=new T.Group();g.neck.position.set(0,N.y,N.z);g.body.add(g.neck);add(g.neck,neckGeo(S,C),mat);
 if(kind==='horse'){const mc=C.fn('mane',0,0,0).clone().multiplyScalar(.55),mm=new T.MeshStandardMaterial({color:mc,roughness:.9,side:T.DoubleSide});         // Mähne: Haarsträhnen entlang des Kamms
  // markante Mähne: dichter Kamm auf dem Mähnenkamm, lange Strähnen fallen zur Seite, Schopf zwischen den Ohren
  const dz=t=>t<.5?lerp(N.d[0],N.d[1],t*2):lerp(N.d[1],N.d[2],(t-.5)*2);
  add(g.neck,grid((u,v)=>{const t=.02+.98*v,y=t*N.len,zc=-dz(t)*.5-.06,a=(u-.5)*2.4;return[Math.sin(a)*.06,y+Math.cos(a)*.05,zc-.07*Math.cos(a),.85,.85,.85]},10,24),mm);
  for(const s of[1,-1])add(g.neck,grid((u,v)=>{const t=.03+.95*v,len=(s>0?.2:.15)+.07*Math.abs(Math.sin(v*37)),y=t*N.len,zc=-dz(t)*.5-.07,c=.75+.25*Math.sin(v*61+u*3);return[s*(.05+u*len*.6),y+.03-u*len*.85,zc-u*.035,c,c,c]},3,30),mm);
  g.maneMat=mm}
 g.head=new T.Group();g.head.position.set(0,N.len,.02);g.neck.add(g.head);add(g.head,headGeo(S,C),mat);
 if(kind==='horse'&&g.maneMat)for(let q=0;q<5;q++){const x=(q-2)*.018;add(g.head,taper([[x,.12,-.05],[x*1.4,.1,.04],[x*1.8,.02,.1]],.018,.004,[.9,.9,.9],5,6),g.maneMat)}   // Stirnschopf
 const H=S.head,Lh=H.len,hp=t=>[prof(H.prof,t,1),prof(H.prof,t,2),prof(H.prof,t,3)],ez=-.12*Lh+H.eyeZ/Lh*Lh;
 for(const s of[-1,1]){const[tp,,w]=hp(H.eyeZ/Lh);const e=add(g.head,sph,eyeM,[s*w*.92,tp*.35,ez+.0],[.022,.02,.024]);add(g.head,sph,mat,[s*w*.93,tp*.35+.016,ez],[.026,.01,.028])}   // Augen + Lid
 if(H.snout){const tip=-.12*Lh+Lh;add(g.head,new T.CylinderGeometry(.07,.075,.04,16),new T.MeshStandardMaterial({color:C.base.clone().multiplyScalar(.8),roughness:.6}),[0,-.015,tip],[1,1,.85]).rotation.x=Math.PI/2;
  for(const s of[-1,1])add(g.head,sph,dk,[s*.024,-.015,tip+.021],[.012,.016,.005])}
 else{const tip=-.12*Lh+Lh*.98,[,,w]=hp(.97);for(const s of[-1,1])add(g.head,sph,dk,[s*w*.55,-.005,tip],[.014,.01,.008])}                        // Nüstern
 g.ears=[];for(const s of[-1,1]){const ear=new T.Group(),[tp,,w]=hp(.08);ear.position.set(s*w*.7,tp*.85,-.08*Lh);ear.rotation.z=-s*(H.earSide?1.3:kind==='pig'?.5:.35);ear.rotation.x=kind==='pig'?.7:-.2;
  add(ear,new T.SphereGeometry(1,10,8,0,Math.PI*2,0,Math.PI*.55),mat,[0,H.ear[1]*.5,0],[H.ear[0]*.55,H.ear[1]*.6,H.ear[0]*.28]);
  add(ear,sph,new T.MeshStandardMaterial({color:0x6a4a40,roughness:1}),[0,H.ear[1]*.5,.012],[H.ear[0]*.3,H.ear[1]*.42,.006]);g.head.add(ear);g.ears.push(ear)}
 if(H.horn)for(const s of[-1,1]){const[tp,,w]=hp(.06),hl=.12+r()*.08;add(g.head,taper([[s*w*.6,tp*.8,-.04],[s*(w*.6+hl*.6),tp*.9+hl*.25,-.05],[s*(w*.6+hl*.9),tp*.8+hl*.55,0]],.026,.006,[.85,.8,.7]),hornM)}
 if(H.antler&&r()<.75)for(const s of[-1,1]){const[tp,,w]=hp(.06),b=[s*w*.4,tp*.9,-.03];add(g.head,taper([b,[b[0]+s*.06,b[1]+.15,b[2]-.04],[b[0]+s*.12,b[1]+.3,b[2]-.02],[b[0]+s*.1,b[1]+.42,b[2]+.04]],.016,.006,[.55,.45,.35]),hornM);
  for(const k of[.12,.24,.33])add(g.head,taper([[b[0]+s*k*.6,b[1]+k*1.05,b[2]-.03],[b[0]+s*(k*.6+.02),b[1]+k*1.05+.08,b[2]+.04]],.009,.004,[.55,.45,.35],5,6),hornM)}
 if(N.wool){add(g.head,sph,new T.MeshStandardMaterial({color:C.base,roughness:1}),[0,.075,-.02],[.08,.05,.07])}                                 // Wollschopf
 // Schwanz
 const Tl=S.tail;g.tail=new T.Group();g.tail.position.set(0,Tl.y,-S.L/2+.02);g.body.add(g.tail);
 if(Tl.hair){const tc=C.fn('mane',0,0,0),hm=new T.MeshStandardMaterial({color:tc,roughness:.9});add(g.tail,taper([[0,0,0],[0,-.05,-.08]],.04,.035,[1,1,1],8,3),mat);
  for(let k=0;k<6;k++){const a=k/6*2*Math.PI;add(g.tail,taper([[0,-.03,-.06],[Math.sin(a)*.03,-Tl.len*.4,-.13+Math.cos(a)*.03],[Math.sin(a)*.04,-Tl.len,-.1+Math.cos(a)*.04]],.028,.006,[1,1,1],6,10),hm)}}
 else if(Tl.curl){const pts=[];for(let i=0;i<=16;i++){const t=i/16,a=t*Math.PI*3;pts.push([.025*Math.sin(a),.02*t+.025*Math.cos(a)-.025,-t*.07])}add(g.tail,taper(pts,.012,.006,[C.base.r,C.base.g,C.base.b],6,24),mat)}
 else{const tc=C.fn('body',0,Tl.y,-S.L/2);add(g.tail,taper([[0,0,0],[0,-Tl.len*.5,-.04],[0,-Tl.len,-.02]],Tl.bushy?.05:.025,Tl.bushy?.03:.012,[tc.r,tc.g,tc.b],7,8),mat);
  if(Tl.tuft)add(g.tail,sph,new T.MeshStandardMaterial({color:C.base.clone().multiplyScalar(.5),roughness:1}),[0,-Tl.len-.04,-.02],[.04,.08,.04])}
 g.tail.rotation.x=kind==='horse'?.25:.15;
 // Euter (Kuh)
 if(kind==='cow'&&r()<.8){const um=new T.MeshStandardMaterial({color:0xe0a8a0,roughness:.7});add(g.body,sph,um,[0,prof(S.body,.2,2)-.04,-.38],[.13,.1,.15]);for(const x of[-.05,.05])for(const z of[-.42,-.32])add(g.body,new T.CylinderGeometry(.012,.01,.06,6),um,[x,prof(S.body,.2,2)-.12,z])}
 // Sattel & Zaumzeug für Reitpferde
 if(kind==='horse'&&opts.tack)tack(g,S,opts.tackColor??0x6a2a2a);
 g.neck.rotation.x=N.rest;g.head.rotation.x=-N.rest*.9;g.gz=r()*4;g.ph=r()*6;
 optimize(g,C.base);return g}
// Teile je Gelenkgruppe und Material zusammenfassen (weniger Draw-Calls); fehlende Vertexfarben = Fellfarbe
function optimize(root,base){const nodes=[];root.traverse(o=>{if(!o.isMesh)nodes.push(o)});
 for(const n of nodes){const groups=new Map();for(const m of n.children)if(m.isMesh){if(!groups.has(m.material))groups.set(m.material,[]);groups.get(m.material).push(m)}
  for(const[mat,list]of groups){if(list.length<2&&!(mat.vertexColors&&!list[0].geometry.attributes.color))continue;
   const geos=list.map(m=>{m.updateMatrix();const gg=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();gg.applyMatrix4(m.matrix);if(gg.attributes.uv)gg.deleteAttribute('uv');if(!gg.attributes.normal)gg.computeVertexNormals();
    if(!gg.attributes.color){const c=new Float32Array(gg.attributes.position.count*3);for(let i=0;i<c.length;i+=3){c[i]=base.r;c[i+1]=base.g;c[i+2]=base.b}gg.setAttribute('color',new T.BufferAttribute(c,3))}return gg});
   const merged=mergeGeometries(geos,false);if(!merged)continue;list.forEach(m=>n.remove(m));const mm=new T.Mesh(merged,mat);mm.castShadow=mm.receiveShadow=true;n.add(mm)}}}
function tack(g,S,col){const lea=new T.MeshStandardMaterial({color:0x4a2e1a,roughness:.7,side:T.DoubleSide}),cloth=new T.MeshStandardMaterial({color:col,roughness:1,side:T.DoubleSide}),st=new T.MeshStandardMaterial({color:0xa9b0b4,metalness:.75,roughness:.35});
 const L=S.L,surf=(s,a,off)=>{const z=-L/2+s*L,top=prof(S.body,s,1),bot=prof(S.body,s,2),w=prof(S.body,s,3),yc=(top+bot)/2,hy=(top-bot)/2,st2=Math.sin(a),ct=Math.cos(a);
  return[(w+off)*Math.sign(st2)*Math.abs(st2)**.75,yc+(hy+off)*Math.sign(ct)*Math.abs(ct)**.75,z]};
 add(g.body,grid((u,v)=>{const s=.4+.26*v,a=(u-.5)*2.2,p=surf(s,a,.012);return[...p,1,1,1]},16,10),cloth);                                            // Satteldecke
 add(g.body,grid((u,v)=>{const s=.45+.16*v,a=(u-.5)*1.5,p=surf(s,a,.03),cant=.06*ssm(.52,.45,s)+.035*ssm(.55,.61,s);return[p[0],p[1]+cant*Math.cos(a),p[2],1,1,1]},12,10),lea);   // Sattel mit Zwiesel & Hinterzwiesel
 add(g.body,grid((u,v)=>{const s=.54+.02*u,a=v*2*Math.PI,p=surf(s,a,.015);return[...p,1,1,1]},2,24),lea);                                           // Sattelgurt
 {const pf=surf(.62,0,.03),pb=surf(.44,0,.03);add(g.body,new T.SphereGeometry(.09,12,8,0,Math.PI*2,0,Math.PI/2),lea,[pf[0],pf[1]+.02,pf[2]],[1.2,1.1,.8]);add(g.body,new T.CylinderGeometry(.03,.04,.1,8),lea,[pf[0],pf[1]+.1,pf[2]+.01]);                // Sattelknauf (Zwiesel)
  const cant=new T.Mesh(new T.TorusGeometry(.13,.035,6,14,Math.PI),lea);cant.position.set(pb[0],pb[1]+.02,pb[2]);cant.castShadow=true;g.body.add(cant);                                                                                   // Hinterzwiesel
  for(const sd of[-1,1]){const p=surf(.53,sd*1.2,.04);add(g.body,new T.BoxGeometry(.015,.26,.3),lea,[p[0]+sd*.01,p[1]-.06,p[2]]).rotation.z=sd*.35}}                                                                                // Sattelblätter
 for(const sd of[-1,1]){const p=surf(.53,sd*1.57,.04);add(g.body,new T.BoxGeometry(.014,.44,.026),lea,[p[0]+sd*.01,p[1]-.16,p[2]]);const sr=add(g.body,new T.TorusGeometry(.05,.009,5,12),st,[p[0]+sd*.02,p[1]-.4,p[2]]);sr.rotation.y=Math.PI/2;add(g.body,new T.BoxGeometry(.03,.012,.1),st,[p[0]+sd*.02,p[1]-.45,p[2]])}
 const H=S.head,Lh=H.len;for(const t of[.12,.7]){const tp=prof(H.prof,t,1),bt=prof(H.prof,t,2),w=prof(H.prof,t,3),z=-.12*Lh+t*Lh;add(g.head,grid((u,v)=>{const a=u*2*Math.PI;return[(w+.01)*Math.sin(a),(tp+bt)/2+((tp-bt)/2+.01)*Math.cos(a),z+(v-.5)*.025,1,1,1]},18,1),lea)}
 const bt=-.12*Lh+Lh*.85;for(const s of[-1,1])add(g.head,new T.TorusGeometry(.025,.005,5,12),st,[s*.06,-.05,bt]).rotation.y=Math.PI/2;
 const rp=[[.06,-.05,bt],[.08,-.1,bt-.2],[.12,-.2,bt-.4]];add(g.head,taper(rp,.005,.005,[1,1,1],5,8),lea);add(g.head,taper(rp.map(p=>[-p[0],p[1],p[2]]),.005,.005,[1,1,1],5,8),lea)}
export function animalKinds(){return Object.keys(SP)}
