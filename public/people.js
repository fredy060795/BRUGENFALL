// Eigene prozedurale Gesichter, Frisuren und Kleidung (keine Daten aus anderen Spielen)
import * as T from 'three';
import {surfaceMaterial} from './materials.js';
function rng(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const pick=(r,a)=>a[Math.floor(r()*a.length)];
const SKIN=[0xf0c8a8,0xe3b08d,0xd49a77,0xc08a68,0xa66e4f,0x8a5a3f],HAIR=[0x1c1410,0x2b1d12,0x4a3320,0x6b4a2a,0x8c6a3c,0xb08a4c,0xc9a45e,0x777067,0x9b4a24],EYE=[0x3a2a1c,0x5a4025,0x3c5a7a,0x4d6b47,0x6a6a60];
const WOOL=[0x8b7355,0x6b5a45,0x7a6a50,0x9a8767,0x5e5a4a,0x7b4b32,0x4d5a3a,0x5a4a3a,0x7a6a8a],DYE=[0x6a2a2a,0x2f4a6a,0x3d5a35,0x7a5a2a,0x5a3a5a];
const MALE=['Hakon','Magnus','Istvan','Pedro','Branko','Ivan','Erik','Markus','Kristian','Pjotr','Herik','Jan','Hans','Matthias','Ulrich','Konrad','Tomas','Wenzel'],FEMALE=['Helen','Elisabeth','Maria','Agnes','Katharina','Margit','Johanka','Sophie','Ludmila','Greta'];
const JR={cook:{head:'cap',apron:1,tool:'none',cloth:0xe8e2d0,title:'Bäcker'},smith:{head:'none',apron:1,tool:'hammer',cloth:0x4a403a,title:'Schmied',beard:'full'},priest:{outfit:'dress',head:'none',tool:'none',cloth:0x3a2f28,title:'Priester'},
 healer:{head:'scarf',outfit:'dress',tool:'none',cloth:0x6a7a4a,title:'Heilerin',female:1,bag:1},keeper:{head:'none',apron:1,tool:'none',title:'Wirt',beard:'short'},shepherd:{head:'strawhat',tool:'hoe',title:'Hirte'},
 weaver:{head:'scarf',outfit:'dress',tool:'none',title:'Weberin',female:1},fisher:{head:'cap',tool:'hoe',title:'Fischer',cloth:0x5a6a7a},gravedigger:{head:'hunterhat',tool:'hoe',cloth:0x3a3430,title:'Totengräber'},miner:{head:'cap',tool:'pickaxe',cloth:0x555555,title:'Bergmann'},miller:{head:'cap',apron:1,tool:'none',cloth:0xeeeeee,title:'Müller'},tanner:{head:'none',apron:1,tool:'none',cloth:0x6a4a2a,title:'Gerber'},hangman:{head:'hood',tool:'none',cloth:0x2a2420,cloak:0x1c1a18,mask:1,title:'Henker'},trader:{head:'hunterhat',tool:'none',cloak:0x6a2a2a,title:'Händler',bag:1}};
const TITLE={peasant:'Dorfbewohner',sword:'Soldat',archer:'Bogenschütze',bandit:'Bandit',farmer:'Bauer',wood:'Holzfäller',hunter:'Jäger',mason:'Steinmetz',player:''};
export const PAL=[0x8b7355,0x6b5a45,0x7a6a50,0x9a8767,0x5e5a4a,0x7b4b32,0x4d5a3a,0x5a4a3a,0x7a6a8a,0x6a2a2a,0x2f4a6a,0x3d5a35,0xd8cfb8,0x2b2622],CLOAKS=[0,0x6a2a2a,0x2f4a6a,0x3d5a35,0x2b2622,0x6a4a2a];
export const OPT={skin:['Sehr hell','Hell','Mittel','Gebräunt','Braun','Dunkel'],hair:['Schwarz','Dunkelbraun','Braun','Kastanie','Hellbraun','Blond','Goldblond','Grau','Rot'],
 hsM:[['short','Kurz'],['long','Lang'],['bald','Glatze'],['braid','Zopf']],hsF:[['long','Lang'],['braid','Zopf'],['bun','Dutt'],['short','Kurz']],
 beard:[['none','Rasiert'],['stubble','Dreitagebart'],['short','Kurzer Bart'],['full','Vollbart']],civ:['Tunika / Kleid','Wams'],civHead:['Keine','Kappe','Kopftuch','Strohhut'],
 pal:['Hellbraun','Braun','Sand','Beige','Graugrün','Rotbraun','Moosgrün','Dunkelbraun','Violett','Rot','Blau','Grün','Weiß','Schwarz'],
 armor:['Keine Rüstung','Gambeson','Kettenhemd','Plattenharnisch'],armHead:['Kein Helm','Eisenhelm','Kettenhaube'],cloak:['Kein Umhang','Rot','Blau','Grün','Schwarz','Braun']};
export const PROF_MAX=[1,5,3,8,3,1,13,13,3,3,2,5];
export const defProf=g=>g?[1,1,0,5,0,0,5,10,2,0,0,0]:[0,2,0,2,1,0,0,9,0,0,0,0];
function playerLook(id,P){const r=rng(id*7919+99),A=k=>Math.max(0,Math.min(PROF_MAX[k],P[k]|0)),f=!!A(0),hs=(f?OPT.hsF:OPT.hsM)[A(2)][0],bd=f?'none':OPT.beard[A(4)][0];
 let outfit=A(5)===1?'jerkin':(f?'dress':'tunic'),head=['none','cap','scarf','strawhat'][A(8)];if(!f&&head==='scarf')head='cap';
 const ar=A(9);if(ar===1)outfit='gambeson';else if(ar===2)outfit='mail';else if(ar===3)outfit='plate';let mailHood=false;if(A(10)===1)head='helmet';else if(A(10)===2){head='hood';mailHood=true}
 const lt=h=>new T.Color(h).multiplyScalar(1.5).getHex();
 return{seed:id*31+7,role:'player',female:f,skin:SKIN[A(1)],hair:HAIR[A(3)],eye:pick(r,EYE),nose:.7+r()*.6,chin:r(),hairStyle:hs,beard:bd,cloth:lt(PAL[A(6)]),over:lt(PAL[A(7)]),outfit,head,cloak:A(11)?lt(CLOAKS[A(11)]):0,apron:false,mask:false,mailHood,bag:ar===0,rolled:ar===0,tool:'sword',name:'',title:''}}
export function look(id,role,prof){if(role==='player'&&prof)return playerLook(id,prof);const r=rng(id*7919+13+role.length*101);
 const jr=JR[role],female=role==='farmer'||role==='peasant'?r()<.5:jr&&jr.female?true:(jr&&['cook','keeper','shepherd','fisher'].includes(role)?r()<.35:role==='player'?(id>0&&r()<.4):false);
 const o={seed:id*31+7,role,female,skin:pick(r,SKIN),hair:pick(r,HAIR),eye:pick(r,EYE),nose:.7+r()*.6,chin:r(),
  hairStyle:female?pick(r,['long','braid','bun']):pick(r,['short','short','bald','long']),beard:female?'none':pick(r,['none','stubble','stubble','short','full']),
  cloth:pick(r,WOOL),over:pick(r,DYE),outfit:'tunic',head:'none',cloak:0,apron:false,mask:false,bag:r()<.45,rolled:true,tool:'sword'};
 if(role==='sword'){Object.assign(o,{outfit:'gambeson',head:'helmet',over:pick(r,[0x7a2a2a,0x2f4a6a,0x8a7a5a]),rolled:false,beard:pick(r,['none','stubble','short']),hairStyle:'short',rank:pick(r,['militia','guard','veteran'])})}
 if(role==='archer'){Object.assign(o,{tool:'bow',outfit:'jerkin',head:'hood',cloth:0x4d5a3a,over:0x5a3d22,cloak:0x3d5a35,rank:pick(r,['scout','marksman'])})}
 if(role==='bandit'){Object.assign(o,{outfit:'jerkin',head:'hood',mask:true,cloth:0x3a3430,over:0x2a2420,cloak:0x2b2622,beard:'stubble'})}
 if(role==='peasant'){o.tool='none';o.outfit=female?'dress':'tunic';o.head=female?pick(r,['scarf','none','none']):pick(r,['none','cap','none'])}
 if(role==='farmer'){o.head=female?'scarf':'strawhat';o.outfit=female?'dress':'tunic';o.tool='hoe';if(female)o.cloth=pick(r,[0x7b4b32,0x6b5a45,0x7a6a50,0x5a4a3a])}
 if(role==='wood'){o.head='cap';o.tool='axe';o.beard=pick(r,['short','full','stubble'])}
 if(role==='hunter'){o.head='hunterhat';o.tool='bow';o.cloak=0x4d5a3a;o.cloth=0x5a4a3a}
 if(role==='mason'){o.head='cap';o.apron=true;o.tool='pickaxe';o.cloth=0x8a8a84}
 if(role==='player'){o.outfit='jerkin';o.cloth=0x8f7651;o.over=0x5a3d22;if(female){o.outfit='dress';o.head='none'}}
 if(jr){Object.assign(o,{outfit:jr.outfit||(female?'dress':'tunic'),head:jr.head,tool:jr.tool,apron:!!jr.apron,cloak:jr.cloak||0,mask:!!jr.mask});if(jr.bag)o.bag=true;if(jr.cloth)o.cloth=jr.cloth;if(jr.beard&&!female)o.beard=jr.beard}
 if(female&&role!=='farmer'&&o.outfit==='tunic')o.outfit='dress';
 const lt=h=>new T.Color(h).multiplyScalar(1.5).getHex();o.cloth=lt(o.cloth);o.over=lt(o.over);if(o.cloak)o.cloak=lt(o.cloak);
 o.name=(female?pick(r,FEMALE):pick(r,MALE));o.title=jr?(female&&!/in$/.test(jr.title)?(jr.title==='Hirte'?'Hirtin':jr.title+'in'):jr.title):(female&&(role==='farmer'||role==='peasant')?(role==='farmer'?'Bäuerin':'Dorfbewohnerin'):TITLE[role]);return o}
const ssm=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t)};
const G=(x,y,cx,cy,sx,sy)=>Math.exp(-(((x-cx)/sx)**2+((y-cy)/sy)**2));
function headGeo(o){const geo=new T.SphereGeometry(1,40,30),P=geo.attributes.position,N=P.count,col=new Float32Array(N*3);geo.setAttribute('u',P.clone());
 const sk=new T.Color(o.skin),hr=new T.Color(o.hair),rose=new T.Color(0xc4605a),lip=new T.Color(o.female?0xb85a5a:0xa5584f),shade=new T.Color(0x6a4030),c=new T.Color();
 for(let i=0;i<N;i++){const x=P.getX(i),y=P.getY(i),z=P.getZ(i),f=Math.max(0,z),jt=Math.max(0,(-y-.05)/.95);
  let X=x*.9*(1-jt*(o.female?.46:.34)),Y=y*1.16,Z=z*1.02*(1-jt*.12);
  Z+=f*(.22*o.nose*G(x,y,0,-.14,.12,.3)+.06*o.nose*G(x,y,0,-.34,.2,.07)+.07*G(x,y,0,.3,.6,.1)+.05*(G(x,y,.5,-.2,.25,.22)+G(x,y,-.5,-.2,.25,.22))+.04*G(x,y,0,-.55,.3,.08)+.07*o.chin*G(x,y,0,-.9,.28,.14)-.055*(G(x,y,.36,.14,.17,.09)+G(x,y,-.36,.14,.17,.09))-.025*G(x,y,0,-.46,.32,.025));
  P.setXYZ(i,X,Y,Z);
  c.copy(sk).lerp(rose,Math.min(.5,.28*(G(x,y,.5,-.2,.3,.22)+G(x,y,-.5,-.2,.3,.22))*f+.1*G(x,y,0,-.14,.1,.1)*f));
  c.lerp(shade,.3*(G(x,y,.36,.02,.2,.08)+G(x,y,-.36,.02,.2,.08))*f);c.lerp(lip,.9*G(x,y,0,-.52,.28,.085)*f);c.lerp(shade,.55*G(x,y,0,-.3,.15,.06)*f);
  if(o.beard!=='none')c.lerp(hr,(o.beard==='stubble'?.3:.5)*ssm(-.1,-.55,y)*ssm(-.3,.2,z)*(1-G(x,y,0,-.52,.3,.09))*(.8+.2*Math.sin(x*60+y*50)));
  col[i*3]=c.r;col[i*3+1]=c.g;col[i*3+2]=c.b}
 geo.setAttribute('color',new T.BufferAttribute(col,3));geo.computeVertexNormals();return geo}
function shell(geo,test,off,noise=.03){const P=geo.attributes.position,U=geo.attributes.u,Nn=geo.attributes.normal,ix=geo.index.array,ok=new Uint8Array(P.count),pos=[],idx=[],map=new Map();
 for(let i=0;i<P.count;i++)ok[i]=test(U.getX(i),U.getY(i),U.getZ(i))?1:0;
 const get=i=>{if(map.has(i))return map.get(i);const k=pos.length/3,x=U.getX(i),y=U.getY(i),z=U.getZ(i),n=off+noise*(Math.sin(x*23+y*7)*Math.cos(z*19+x*5)*.5+.5);pos.push(P.getX(i)+Nn.getX(i)*n,P.getY(i)+Nn.getY(i)*n,P.getZ(i)+Nn.getZ(i)*n);map.set(i,k);return k};
 for(let t=0;t<ix.length;t+=3)if(ok[ix[t]]&&ok[ix[t+1]]&&ok[ix[t+2]])idx.push(get(ix[t]),get(ix[t+1]),get(ix[t+2]));
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();return g}
const mesh=(geo,mat,par,p=[0,0,0],s=[1,1,1])=>{const m=new T.Mesh(geo,mat);m.position.set(...p);m.scale.set(...s);par.add(m);return m};
const lathe=(par,mat,pts,s,p=[0,0,0])=>mesh(new T.LatheGeometry(pts.map(([r,y])=>new T.Vector2(r,y)),20),mat,par,p,s);
function canvasMat(kind,color){const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,64,64);
 if(kind==='quilt'){x.strokeStyle='rgba(60,40,30,.55)';x.lineWidth=2;for(let i=0;i<=64;i+=16){x.beginPath();x.moveTo(0,i);x.lineTo(64,i);x.stroke()}for(let i=-64;i<=64;i+=16){x.beginPath();x.moveTo(i,0);x.lineTo(i+64,64);x.stroke()}}
 else{x.fillStyle='#b4babd';x.fillRect(0,0,64,64);x.strokeStyle='#ffffff';x.lineWidth=1.4;for(let j=0;j<8;j++)for(let i=0;i<8;i++){x.beginPath();x.arc(i*8+(j%2)*4,j*8,3.2,0,6.3);x.stroke()}}
 const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(3,3);t.colorSpace=T.SRGBColorSpace;return new T.MeshStandardMaterial({map:t,color,roughness:kind==='mail'?.45:.95,metalness:kind==='mail'?.6:0})}
export function buildPerson(g,o,M){const hairM=new T.MeshStandardMaterial({color:o.hair,roughness:.85}),faceM=new T.MeshStandardMaterial({vertexColors:true,roughness:.7,emissive:0x45302a}),
  white=new T.MeshStandardMaterial({color:0xe9e4da,roughness:.35}),clothM=surfaceMaterial('linen',o.cloth,[2,2]),overM=surfaceMaterial('leather',o.over,[2,2]);
 mesh(new T.CylinderGeometry(.062,.07,.16,12),M.skin,g,[0,1.5,0]);
 const geo=headGeo(o),H=new T.Group();H.position.set(0,1.655,.005);H.scale.setScalar(.13);g.add(H);mesh(geo,faceM,H);
 const ball=new T.SphereGeometry(1,14,10),dk=new T.MeshStandardMaterial({color:o.eye,roughness:.3}),blk=new T.MeshBasicMaterial({color:0x050505}),sp=new T.MeshBasicMaterial({color:0xffffff});
 for(const s of[-1,1]){const e=new T.Group();e.position.set(s*.325,.16,.835);H.add(e);mesh(ball,white,e,[0,0,0],[.155,.12,.085]);mesh(ball,dk,e,[0,0,.07],[.09,.09,.03]);mesh(ball,blk,e,[0,0,.088],[.045,.045,.016]);mesh(ball,sp,e,[s*.02,.02,.1],[.011,.011,.008]);
  mesh(new T.SphereGeometry(1,14,8,0,6.283,0,1.5),M.skin,e,[0,.035,-.005],[.17,.13,.098]);
  mesh(new T.BoxGeometry(.38,o.female?.05:.085,.07),hairM,H,[s*.3,.43,.93]).rotation.z=-s*.16;
  mesh(ball,M.skin,H,[s*.88,0,-.02],[.1,.26,.17]).rotation.y=s*.3}
 mesh(new T.BoxGeometry(.28,.032,.045),new T.MeshStandardMaterial({color:0x4a1f1f}),H,[0,-.535,.93]);
 const hat=o.head,hidden=hat==='helmet'||hat==='hood'||hat==='scarf';
 if(!hidden&&o.hairStyle!=='bald'){const L=o.hairStyle==='long'||o.hairStyle==='braid';
  mesh(shell(geo,(x,y,z)=>y>.5||(z<.12&&y>(L?-.95:-.15)),.07,.05),hairM,H);
  if(L)mesh(new T.CylinderGeometry(.95,.8,2.4,20,1,true,Math.PI*.55,Math.PI*.9),new T.MeshStandardMaterial({color:o.hair,roughness:.85,side:T.DoubleSide}),H,[0,-1.25,-.12]);
  if(o.hairStyle==='bun')mesh(ball,hairM,H,[0,.75,-.8],[.38,.34,.34]);
  if(o.hairStyle==='braid')for(let i=0;i<7;i++)mesh(ball,hairM,H,[.25,-.7-i*.42,-.95-i*.03],[.24-i*.012,.28,.2]);}
 if(o.beard!=='none'&&o.beard!=='stubble'&&hat!=='hood'&&!o.mask){const full=o.beard==='full';mesh(shell(geo,(x,y,z)=>y<(full?-.12:-.25)&&z>-.05&&!((x/.34)**2+((y+.52)/.11)**2<1),.075,full?.12:.05),hairM,H)}
 const cm=hat==='hood'?((o.role==='sword'||o.mailHood)?canvasMat('mail',0xa9b0b4):surfaceMaterial('linen',o.cloak||o.cloth,[2,2])):null;
 if(hat==='hood'){mesh(shell(geo,(x,y,z)=>!(z>.35&&y>-.62&&y<.62&&Math.abs(x)<.62),.13,.03),cm,H);lathe(g,cm,[[.1,1.44],[.16,1.5],[.22,1.4],[.26,1.33]],[1,1,.8])}
 if(hat==='scarf')mesh(shell(geo,(x,y,z)=>y>-.15&&!(z>.3&&y>-.45&&y<.5&&Math.abs(x)<.72),.1,.03),surfaceMaterial('linen',0xd8cfb8,[2,2]),H);
 if(hat==='cap')mesh(shell(geo,(x,y,z)=>y>.3||(z<-.2&&y>-.2),.12,.02),overM,H);
 if(o.mask)mesh(shell(geo,(x,y,z)=>y<-.2&&z>-.2,.12,.03),new T.MeshStandardMaterial({color:0x2a2420,roughness:1}),H);
 if(hat==='helmet'){const st=M.steel,mail=canvasMat('mail',0xa9b0b4);mesh(shell(geo,(x,y,z)=>!(z>.35&&y>-.62&&y<.62&&Math.abs(x)<.62),.1,.02),mail,H);lathe(g,mail,[[.1,1.44],[.16,1.5],[.22,1.4],[.26,1.33]],[1,1,.8]);
  mesh(new T.SphereGeometry(1.17,24,14,0,6.283,0,1.12),st,H,[0,.12,0],[1,1.05,1.02]);mesh(new T.CylinderGeometry(1.5,1.55,.08,28),st,H,[0,.62,0])}
 if(hat==='strawhat'){const sm=new T.MeshStandardMaterial({color:0xc9a850,roughness:1});mesh(new T.CylinderGeometry(1.95,1.95,.07,28),sm,H,[0,.78,0]);mesh(new T.CylinderGeometry(.95,1.05,.62,22),sm,H,[0,1.08,0]);mesh(new T.CylinderGeometry(1.06,1.07,.14,22),M.leather,H,[0,.9,0])}
 if(hat==='hunterhat'){const gm=new T.MeshStandardMaterial({color:0x3d5a35,roughness:1});mesh(new T.CylinderGeometry(.55,1.05,.8,22),gm,H,[0,1.0,0]);mesh(new T.CylinderGeometry(1.45,1.45,.06,26),gm,H,[0,.62,0]);mesh(new T.BoxGeometry(.08,.9,.3),new T.MeshStandardMaterial({color:0xcc3a2a}),H,[.7,1.2,-.1]).rotation.z=-.5}
 // Körperkleidung
 if(o.outfit==='gambeson'){const q=canvasMat('quilt',o.over);lathe(g,q,[[.195,.8],[.18,1.02],[.213,1.28],[.243,1.39],[.125,1.47]],[1,1,.68]);lathe(g,q,[[.3,.55],[.27,.72],[.23,.88],[.2,.97]],[1,1,.8])}
 if(o.outfit==='mail'){const mm=canvasMat('mail',0xb4bbbf);lathe(g,mm,[[.2,.8],[.185,1.02],[.218,1.28],[.25,1.38],[.13,1.46]],[1,1,.68]);lathe(g,mm,[[.3,.55],[.27,.72],[.23,.88],[.2,.97]],[1,1,.8])}
 if(o.outfit==='plate'){const st=M.steel;lathe(g,st,[[.2,.86],[.18,1.02],[.222,1.28],[.255,1.38],[.14,1.45]],[1,1,.7]);lathe(g,st,[[.3,.62],[.27,.74],[.23,.88],[.2,.97]],[1,1,.8]);for(const s of[-1,1]){const pd=mesh(new T.SphereGeometry(1,14,8,0,6.283,0,1.5),st,g,[s*.275,1.44,0],[.115,.08,.125]);pd.rotation.z=-s*.25}}
 if(o.outfit==='jerkin'){lathe(g,overM,[[.195,.86],[.18,1.02],[.213,1.28],[.235,1.37],[.14,1.43]],[1,1,.68]);lathe(g,clothM,[[.29,.56],[.26,.74],[.22,.9],[.2,.97]],[1,1,.8])}
 if(o.outfit==='tunic')lathe(g,clothM,[[.29,.54],[.26,.74],[.22,.9],[.2,.97]],[1,1,.8]);
 if(o.outfit==='dress'){const sk=new T.LatheGeometry([[.34,.03],[.31,.25],[.27,.5],[.23,.75],[.2,.95]].map(([r,y])=>new T.Vector2(r,y)),28),P=sk.attributes.position;
  for(let i=0;i<P.count;i++){const x=P.getX(i),z=P.getZ(i),y=P.getY(i),a=Math.atan2(z,x),k=1+.06*Math.sin(a*11)*(1-y);P.setX(i,x*k);P.setZ(i,z*k*.86)}sk.computeVertexNormals();mesh(sk,clothM,g);
  lathe(g,clothM,[[.195,.9],[.18,1.02],[.213,1.28],[.243,1.39],[.125,1.47]],[1,1,.68]);mesh(new T.TorusGeometry(.3,.012,6,28),M.leather,g,[0,.06,0],[1,.86,1]).rotation.x=Math.PI/2}
 if(o.cloak){const cl=new T.MeshStandardMaterial({color:o.cloak,roughness:1,side:T.DoubleSide});mesh(new T.CylinderGeometry(.3,.4,1.15,18,1,true,Math.PI*.62,Math.PI*.76),cl,g,[0,.95,-.02]);mesh(new T.SphereGeometry(.025,8,6),M.steel,g,[0,1.38,.12])}
 if(o.apron)mesh(new T.BoxGeometry(.3,.56,.02),M.leather,g,[0,.82,.15]);
 if(o.bag&&o.outfit!=='gambeson'){const a=new T.Vector3(.14,1.38,.14),b=new T.Vector3(-.17,.93,.15),d=b.clone().sub(a),s=mesh(new T.CylinderGeometry(.014,.014,d.length(),6),M.leather,g);s.position.copy(a.clone().add(b).multiplyScalar(.5));s.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());mesh(new T.BoxGeometry(.15,.17,.07),M.leather,g,[-.21,.86,.07])}
 mesh(new T.BoxGeometry(.08,.1,.05),M.leather,g,[.13,.92,.13])}
export function dressArms(g,o,M){if(!o.rolled)return;const lin=new T.MeshStandardMaterial({color:0xe2dccb,roughness:1});
 for(const s of[g.right,g.left]){const e=s.elbow;lathe(e,M.skin,[[.046,-.28],[.05,-.2],[.054,-.13]],[1,1,1]);mesh(new T.CylinderGeometry(.064,.06,.045,14),lin,e,[0,-.115,0])}}

const cy=(par,mat,r1,r2,h,pos,rot=[0,0,0],seg=10)=>{const m=mesh(new T.CylinderGeometry(r1,r2,h,seg),mat,par,pos);m.rotation.set(...rot);return m};
export function gear(g,o,M){const R=o.role,st=M.steel,lea=M.leather,wd=new T.MeshStandardMaterial({color:0x6a4a2c,roughness:1}),cl=c=>new T.MeshStandardMaterial({color:c,roughness:1,side:T.DoubleSide});
 const bx=(w,h,d,mat,pos,rot=[0,0,0])=>{const m=mesh(new T.BoxGeometry(w,h,d),mat,g,pos);m.rotation.set(...rot);return m};
 const dagger=(x,z,rz=.06)=>{const d=new T.Group();d.position.set(x,.88,z);d.rotation.z=rz;g.add(d);cy(d,lea,.014,.014,.09,[0,.045,0]);mesh(new T.BoxGeometry(.065,.012,.02),st,d,[0,-.002,0]);mesh(new T.BoxGeometry(.028,.17,.007),st,d,[0,-.09,0])};
 const quiver=()=>{cy(g,lea,.062,.05,.5,[-.1,1.12,-.19],[0,0,.22]);for(let i=0;i<6;i++){const x=-.156+(i-2.5)*.011,z=-.19+((i%3)-1)*.018;cy(g,wd,.006,.006,.26,[x,1.46,z],[0,0,.22],5);mesh(new T.BoxGeometry(.03,.07,.004),new T.MeshStandardMaterial({color:i%2?0xf0ecd8:0xb83a2a}),g,[x-.012,1.57,z]).rotation.z=.22}};
 const hammer=(x,z)=>{const h=new T.Group();h.position.set(x,.84,z);h.rotation.z=-.08;g.add(h);cy(h,wd,.014,.014,.3,[0,0,0]);mesh(new T.BoxGeometry(.11,.06,.055),st,h,[0,.15,0])};
 const belt=(col=o.over)=>{const bm=new T.MeshStandardMaterial({color:col,roughness:1});mesh(new T.TorusGeometry(.2,.018,6,22),bm,g,[0,.94,.015]).rotation.x=Math.PI/2;bx(.06,.05,.02,st,[0,.94,.16])};
 const hipBag=(x,col=0x6a4a2a)=>bx(.12,.16,.07,new T.MeshStandardMaterial({color:col,roughness:1}),[x,.83,.1],[0,0,x<0?.18:-.18]);
 const shoulders=(mat=lea,wide=.11)=>{for(const s of[-1,1]){const pad=mesh(new T.SphereGeometry(1,12,8,0,6.283,0,1.45),mat,g,[s*.24,1.44,.02],[wide,.08,.12]);pad.rotation.z=-s*.28}}
 const gloves=(mat=lea)=>{for(const arm of[g.right.wrist,g.left.wrist])cy(arm,mat,.03,.026,.09,[0,.015,-.005])};
 const boots=(mat=lea,high=false)=>{for(const{knee}of g.legs){cy(knee,mat,.06,.055,high?.18:.1,[0,-.28,.02]);if(high)mesh(new T.TorusGeometry(.058,.01,5,14),mat,knee,[0,-.2,.01]).rotation.x=Math.PI/2}};
 const flask=(x,y,z,col=0x6fb6d9)=>{const fm=new T.MeshStandardMaterial({color:col,roughness:.35,transparent:true,opacity:.85});cy(g,fm,.05,.04,.16,[x,y,z]);cy(g,st,.015,.015,.04,[x,y+.1,z])};
 const coil=(x,y,z)=>mesh(new T.TorusGeometry(.08,.016,6,18),lea,g,[x,y,z],[1,.8,1]).rotation.x=Math.PI/2;
 belt();boots(lea,R==='sword'||R==='archer'||R==='hunter');
 if(R==='sword'){for(const s of[-1,1]){const pd=mesh(new T.SphereGeometry(1,14,8,0,6.283,0,1.5),st,g,[s*.275,1.44,0],[.115,.08,.125]);pd.rotation.z=-s*.25}
  const tab=o.over;for(const z of[.222,-.2]){bx(.27,.4,.016,cl(tab),[0,.79,z]);bx(.045,.4,.018,cl(0xece6d6),[0,.79,z+Math.sign(z)*.002])}
  mesh(new T.TorusGeometry(.12,.03,8,16),st,g,[0,1.41,0],[1,1,.8]).rotation.x=Math.PI/2;
  for(const e of[g.right.elbow,g.left.elbow])cy(e,st,.052,.046,.2,[0,-.17,0]);
  for(const{knee}of g.legs){cy(knee,st,.066,.053,.3,[0,-.2,0]);mesh(new T.SphereGeometry(.07,10,8),st,knee,[0,-.005,.05])}
  shoulders(st,o.rank==='veteran'?.14:.11);gloves(st);if(o.rank!=='militia'){const sh=mesh(new T.CylinderGeometry(.18,.24,.1,18,1,true),cl(o.rank==='guard'?0x7a2a2a:0x2f4a6a),g,[-.33,1.03,.07],[1.05,1,.18]);sh.rotation.z=Math.PI/2;mesh(new T.TorusGeometry(.19,.018,5,18),st,g,[-.38,1.03,.07]).rotation.y=Math.PI/2}}
 if(R==='archer'){quiver();cy(g.left.elbow,lea,.054,.05,.13,[0,-.2,0]);dagger(-.22,.05);shoulders(lea,.09);if(o.rank==='marksman')hipBag(.22,0x4d5a3a)}
 if(R==='bandit'){for(let i=0;i<5;i++){const L=.18+((i*37)%10)/55;bx(.07,L,.012,cl(i%2?0x2b2622:0x4a3a30),[-.17+i*.085,.88-L/2+.02,.215],[0,0,(i-2)*.05])}dagger(.22,.03,-.08);mesh(new T.SphereGeometry(.15,10,8),cl(0x6a5a46),g,[.07,1.08,-.2],[1,1.15,.7]);cy(g,lea,.012,.012,.2,[.07,1.28,-.2],[0,0,.9])}
 if(R==='farmer'){const s=new T.Group();s.position.set(-.22,.9,.03);s.rotation.z=.1;g.add(s);cy(s,wd,.013,.013,.12,[0,.06,0]);const bl=mesh(new T.TorusGeometry(.085,.009,6,16,Math.PI*1.25),st,s,[.05,-.05,0]);bl.rotation.z=1.6;
  mesh(new T.CylinderGeometry(.15,.11,.2,14,1,true),new T.MeshStandardMaterial({color:0x9a7a42,roughness:1,side:T.DoubleSide}),g,[0,1.06,-.2]);for(let i=0;i<7;i++)cy(g,new T.MeshStandardMaterial({color:0xd9b84a}),.006,.006,.28,[-.08+i*.027,1.27,-.2+((i%2)-.5)*.04],[(i%3-1)*.12,0,(i-3)*.06],4);
  if(o.outfit==='dress')bx(.33,.62,.02,cl(0xece6d6),[0,.62,.215],[-.2,0,0])}
 if(R==='wood'){const v=lathe(g,lea,[[.2,.88],[.19,1.02],[.222,1.28],[.245,1.37]],[1,1,.7]);v.scale.z=.71;mesh(new T.TorusGeometry(.13,.025,8,18),new T.MeshStandardMaterial({color:0xb09a68,roughness:1}),g,[-.19,1.4,.02],[1,1,1]).rotation.set(1.2,0,.3);coil(.22,.96,-.05);
  const h=new T.Group();h.position.set(.23,.84,.0);h.rotation.z=-.1;g.add(h);cy(h,wd,.014,.014,.3,[0,0,0]);mesh(new T.BoxGeometry(.11,.075,.018),st,h,[.04,.13,0]);dagger(-.22,.03)}
 if(R==='hunter'){quiver();mesh(new T.TorusGeometry(.19,.065,8,18),new T.MeshStandardMaterial({color:0x6a5236,roughness:1}),g,[0,1.4,0],[1,1,.85]).rotation.x=Math.PI/2;
  const hn=mesh(new T.TorusGeometry(.085,.021,8,16,Math.PI),new T.MeshStandardMaterial({color:0xe6dcc0,roughness:.5}),g,[.22,.9,.05]);hn.rotation.set(0,1.2,0);dagger(-.22,.05)}
 if(R==='mason'){hammer(.23,.02);bx(.016,.17,.012,st,[-.2,.82,.1],[0,0,.1]);bx(.1,.13,.05,lea,[-.23,.85,0]);hipBag(.22,0x8a8a84)}
 if(R==='smith'){gloves(st);shoulders(lea,.085);hammer(.23,.03);hipBag(-.22,0x4a403a)}
 if(R==='miner'){gloves(st);shoulders(lea,.08);hipBag(.22,0x555555);mesh(new T.CylinderGeometry(.09,.07,.16,12),new T.MeshStandardMaterial({color:0xf3c55a,emissive:0xffd36a,emissiveIntensity:.2}),g,[.2,1.0,-.16])}
 if(R==='healer'){hipBag(.23,0x6a7a4a);flask(.18,1.08,-.16);flask(.08,1.02,-.18,0xb08a4c);mesh(new T.TorusGeometry(.09,.014,5,16),new T.MeshStandardMaterial({color:0x5a7a3a,roughness:1}),g,[.2,1.2,-.08]).rotation.x=.8}
 if(R==='weaver'){hipBag(-.2,0x7a6a50);for(const x of[-.1,.02,.14])mesh(new T.SphereGeometry(.045,10,8),new T.MeshStandardMaterial({color:x<0?0xeeeeee:0xd8cfb8,roughness:1}),g,[x,1.02,-.18])}
 if(R==='keeper'){hipBag(-.22,0x6a4a2a);cy(g,new T.MeshStandardMaterial({color:0xb19650,metalness:.35,roughness:.45}),.04,.05,.12,[.2,.98,.18]);mesh(new T.TorusGeometry(.05,.008,5,14),st,g,[.2,1.03,.18]).rotation.x=Math.PI/2}
 if(R==='trader'){hipBag(-.22,0x6a2a2a);hipBag(.22,0x6a4a2a)}
 if(R==='gravedigger'){bx(.12,.42,.02,cl(0x2b2622),[0,.82,-.18],[-.18,0,0])}}
