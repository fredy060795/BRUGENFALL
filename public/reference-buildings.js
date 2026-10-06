import * as T from 'three';
import {addDoor,doorTop} from './doors.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {forestTree} from './world.js';

// Material tiles are copied into independent canvases: no atlas-neighbour bleeding.
const atlasCache=new Map(),COLM=new Map();
function atlasTile(file,index,fallback,linear=false){
 const c=document.createElement('canvas');c.width=c.height=2;const ctx=c.getContext('2d');ctx.fillStyle=fallback;ctx.fillRect(0,0,2,2);
 const texture=new T.CanvasTexture(c);texture.colorSpace=linear?T.NoColorSpace:T.SRGBColorSpace;texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.anisotropy=8;   // Kacheln sind jetzt nahtlos -> kein Spiegeln mehr
 let promise=atlasCache.get(file);if(!promise){promise=new Promise(resolve=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>resolve(null);image.src='/textures/stronghold/'+file;});atlasCache.set(file,promise)}
 promise.then(image=>{if(!image)return;const w=Math.floor(image.width/2),h=Math.floor(image.height/2);c.width=w;c.height=h;ctx.drawImage(image,(index%2)*w,Math.floor(index/2)*h,w,h,0,0,w,h);texture.needsUpdate=true;});return texture;
}
// Verwitterung im Shader: großflächige Farbschwankung gegen Kachelwiederholung, feuchter/schmutziger Sockel, Moos auf oben liegenden Flächen
let ROSE=null;function roseGlass(){if(ROSE)return ROSE;const S=256,c=document.createElement('canvas');c.width=c.height=S;const x=c.getContext('2d'),C=['#2a4a9a','#9a2a2a','#c8a030','#2a7a5a','#6a2a8a'];
 x.fillStyle='#1a1a1a';x.fillRect(0,0,S,S);for(let ring=0;ring<4;ring++)for(let q=0;q<12+ring*6;q++){const n=12+ring*6,a0=q/n*Math.PI*2,a1=(q+1)/n*Math.PI*2,r0=20+ring*27,r1=r0+25;
  x.fillStyle=C[(q+ring)%C.length];x.beginPath();x.arc(S/2,S/2,r1,a0,a1);x.arc(S/2,S/2,r0,a1,a0,true);x.closePath();x.fill();x.strokeStyle='#111';x.lineWidth=3;x.stroke()}
 x.fillStyle='#c8a030';x.beginPath();x.arc(S/2,S/2,18,0,7);x.fill();const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;
 return ROSE=new T.MeshStandardMaterial({map:t,emissive:0xffffff,emissiveMap:t,emissiveIntensity:.35,roughness:.3,side:T.DoubleSide})}
function weather(mat,{grime=1,moss=0,stain=[.32,.26,.2]}={}){mat.onBeforeCompile=sh=>{
 sh.vertexShader='varying vec3 vWPos;varying vec3 vWN;varying float vLY;\n'+sh.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvWPos=(modelMatrix*vec4(transformed,1.0)).xyz;vWN=normalize(mat3(modelMatrix)*objectNormal);vLY=transformed.y;');
 sh.fragmentShader='varying vec3 vWPos;varying vec3 vWN;varying float vLY;\nfloat wHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}\nfloat wNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(wHash(i),wHash(i+vec2(1,0)),f.x),mix(wHash(i+vec2(0,1)),wHash(i+vec2(1,1)),f.x),f.y);}\n'+
  sh.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
 vec2 wp=vWPos.xz+vWPos.y*.37;float n1=wNoise(wp*.09),n2=wNoise(wp*.31+7.3),n3=wNoise(wp*1.7);
 diffuseColor.rgb*=.84+.3*n1;                                         // Großflächige Variation
 float gr=(1.-smoothstep(0.,1.1,vLY))*${grime.toFixed(2)};diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(${stain.map(v=>v.toFixed(2)).join(',')})*2.2,gr*(.45+.35*n2));   // Spritzwasser/Erde am Sockel
 float ms=${moss.toFixed(2)}*(smoothstep(.45,.95,vWN.y)*.8+gr*.7)*smoothstep(.35,.75,n2*.7+n3*.3);diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.22,.29,.13)*(.8+.4*n3),clamp(ms,0.,.75));   // Moos
 `)};mat.customProgramCacheKey=()=>'weather'+grime+moss;return mat}
// Wandmalereien / Heiligenbilder: prozedural gemalte Leinwände (Nimbus, Gewand, Ornamentrahmen)
const FRESCO=new Map();
export function fresco(n=0,panel=false){const key=n%6+(panel?'p':'f');if(FRESCO.has(key))return FRESCO.get(key);const W=256,Hh=384,c=document.createElement('canvas');c.width=W;c.height=Hh;const x=c.getContext('2d');
 const robes=['#7a2430','#2c4a7a','#3a6a3a','#8a5a22','#5a3a6a','#9a7a2a'],bg=panel?'#c9a43a':['#3a5a8a','#b8a070','#6a7a8a','#a88a5a','#4a6a6a','#b89a7a'][n%6];
 x.fillStyle=bg;x.fillRect(0,0,W,Hh);if(!panel){for(let i=0;i<900;i++){x.fillStyle=`rgba(${200+Math.random()*55|0},${190+Math.random()*50|0},${160+Math.random()*40|0},${Math.random()*.08})`;x.fillRect(Math.random()*W,Math.random()*Hh,6,6)}}
 else{const gr=x.createLinearGradient(0,0,W,Hh);gr.addColorStop(0,'#e8c860');gr.addColorStop(.5,'#b8902a');gr.addColorStop(1,'#e0c050');x.fillStyle=gr;x.fillRect(0,0,W,Hh)}
 x.strokeStyle=panel?'#6a4a1a':'#7a2a1a';x.lineWidth=12;x.strokeRect(8,8,W-16,Hh-16);x.strokeStyle='#d8c890';x.lineWidth=3;x.strokeRect(20,20,W-40,Hh-40);
 for(let i=0;i<14;i++){x.fillStyle=i%2?'#7a2a1a':'#2a4a6a';x.fillRect(24+i*15.5,Hh-34,10,8)}
 const cx=W/2,hy=110;x.fillStyle='#e8c040';x.beginPath();x.arc(cx,hy,44,0,7);x.fill();x.strokeStyle='#8a6a1a';x.lineWidth=3;x.stroke();      // Nimbus
 x.fillStyle=robes[n%6];x.beginPath();x.moveTo(cx-30,hy+30);x.quadraticCurveTo(cx-78,hy+150,cx-70,Hh-50);x.lineTo(cx+70,Hh-50);x.quadraticCurveTo(cx+78,hy+150,cx+30,hy+30);x.closePath();x.fill();
 x.fillStyle='#e8dcc0';x.beginPath();x.moveTo(cx-18,hy+34);x.lineTo(cx+18,hy+34);x.lineTo(cx+44,Hh-50);x.lineTo(cx-44,Hh-50);x.closePath();x.globalAlpha=.35;x.fill();x.globalAlpha=1;
 x.strokeStyle='rgba(0,0,0,.35)';x.lineWidth=2;for(let i=-2;i<=2;i++){x.beginPath();x.moveTo(cx+i*12,hy+60);x.quadraticCurveTo(cx+i*16,hy+170,cx+i*22,Hh-52);x.stroke()}
 x.fillStyle='#e0b896';x.beginPath();x.ellipse(cx,hy,24,30,0,0,7);x.fill();x.fillStyle='#4a3020';x.beginPath();x.ellipse(cx,hy-14,25,17,0,Math.PI,0);x.fill();
 x.fillStyle='#2a1a10';x.fillRect(cx-11,hy-3,6,3);x.fillRect(cx+5,hy-3,6,3);x.fillRect(cx-5,hy+13,10,2);
 x.fillStyle='#e0b896';for(const s of[-1,1]){x.beginPath();x.ellipse(cx+s*22,hy+105,9,12,0,0,7);x.fill()}
 if(n%3===0){x.strokeStyle='#5a3a1a';x.lineWidth=6;x.beginPath();x.moveTo(cx+30,hy+40);x.lineTo(cx+30,Hh-60);x.moveTo(cx+18,hy+60);x.lineTo(cx+42,hy+60);x.stroke()}   // Kreuzstab
 if(n%3===1){x.fillStyle='#f0e8d0';x.fillRect(cx-22,hy+80,44,30);x.strokeStyle='#6a4a2a';x.strokeRect(cx-22,hy+80,44,30)}                                       // Buch
 if(n%3===2){x.fillStyle='#c8a030';x.beginPath();x.moveTo(cx-12,hy+92);x.lineTo(cx+12,hy+92);x.lineTo(cx+6,hy+118);x.lineTo(cx-6,hy+118);x.closePath();x.fill()}        // Kelch
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;const m=new T.MeshStandardMaterial({map:t,roughness:panel?.45:.95,metalness:panel?.25:0,side:T.DoubleSide});FRESCO.set(key,m);return m}
export function createMedievalMaterials(){
 const A='masonry-timber-plaster-thatch',B='roofs-and-floors',materials={};
 const W={stone:{grime:1,moss:.55},wood:{grime:1,moss:.15},plaster:{grime:.9,moss:0,stain:[.4,.33,.25]},thatch:{grime:.2,moss:.4},redRoof:{grime:.2,moss:.35},slate:{grime:.2,moss:.3},shingle:{grime:.2,moss:.4},floor:{grime:0,moss:0}};
 for(const [name,file,tile,color,nscale,rough]of[['stone',A,0,'#b6ab92',1.1,.92],['wood',A,1,'#544434',.8,.86],['plaster',A,2,'#d8c8a0',.45,.95],['thatch',A,3,'#a7955c',1.0,.98],['redRoof',B,0,'#9b4e34',1.0,.8],['slate',B,1,'#52606a',.9,.66],['shingle',B,2,'#938068',.9,.88],['floor',B,3,'#76644e',.7,.84]]){
  const map=atlasTile(file+'-hd.jpg',tile,color),normalMap=atlasTile(file+'-normal.jpg',tile,'#8080ff',true),roughnessMap=atlasTile(file+'-rough.jpg',tile,'#e0e0e0',true);
  materials[name]=weather(new T.MeshStandardMaterial({map,normalMap,normalScale:new T.Vector2(nscale,nscale),roughnessMap,roughness:rough}),W[name]);materials[name].name=name;}
 materials.win=new T.MeshStandardMaterial({color:0x2a2620,roughness:.35,emissive:0xffa848,emissiveIntensity:0});materials.win.name='windowGlow';
 materials.winDark=new T.MeshStandardMaterial({color:0x1e1c1a,roughness:.4});materials.iron=new T.MeshStandardMaterial({color:0x333639,metalness:.65,roughness:.57});materials.green=new T.MeshStandardMaterial({color:0x344f38,roughness:.9});materials.dark=new T.MeshStandardMaterial({color:0x272522,roughness:1});materials.brass=new T.MeshStandardMaterial({color:0xb19650,metalness:.55,roughness:.4});return materials;
}
export function boxUV(geo,scale=2){const p=geo.attributes.position,n=geo.attributes.normal,uv=geo.attributes.uv;for(let i=0;i<p.count;i++){const x=Math.abs(n.getX(i)),y=Math.abs(n.getY(i));uv.setXY(i,(x>.5?p.getZ(i):p.getX(i))/scale,(y>.5?p.getZ(i):p.getY(i))/scale)}uv.needsUpdate=true;return geo}
// Bleiglasfenster: Rand aus Rubin/Saphir, blauer Grund mit Rauten, drei Medaillons mit Figur, Kreuz bzw. Stern, Vierpass im Bogen
const GLASS=new Map();
function fineGlass(v=0){v=v%4;if(GLASS.has(v))return GLASS.get(v);const W=256,H=640,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
 const lead='#1d1b1a',ruby=['#9a1f2a','#b8323a'],blue=['#1f3f8a','#2b56a8','#16306e'],gold='#d9a83a',green='#2f7a4a',white='#e8e0c8',purple='#6a3a8a';
 x.fillStyle=lead;x.fillRect(0,0,W,H);
 // Grund: Rauten in Blautönen
 const g0=v%2?blue:[green,'#3a8a5a','#256a3c'];for(let r0=-1;r0<H/24+1;r0++)for(let c0=-1;c0<W/24+1;c0++){const cx=c0*24+(r0%2?12:0),cy=r0*24;x.beginPath();x.moveTo(cx,cy-12);x.lineTo(cx+12,cy);x.lineTo(cx,cy+12);x.lineTo(cx-12,cy);x.closePath();x.fillStyle=g0[(r0*3+c0*5+99)%3];x.fill();x.strokeStyle=lead;x.lineWidth=2.5;x.stroke()}
 // Randbordüre
 for(let y=0;y<H;y+=22)for(const bx0 of[0,W-22]){x.fillStyle=((y/22)|0)%2?ruby[0]:gold;x.fillRect(bx0+3,y+3,16,16);x.strokeStyle=lead;x.lineWidth=3;x.strokeRect(bx0+3,y+3,16,16)}
 // Medaillons
 const med=(cy,kind,col)=>{x.beginPath();x.arc(W/2,cy,70,0,7);x.fillStyle=gold;x.fill();x.lineWidth=5;x.strokeStyle=lead;x.stroke();x.beginPath();x.arc(W/2,cy,60,0,7);x.fillStyle=col;x.fill();x.stroke();
  x.fillStyle=white;x.strokeStyle=lead;x.lineWidth=3;
  if(kind==='fig'){x.beginPath();x.arc(W/2,cy-28,13,0,7);x.fill();x.stroke();x.beginPath();x.arc(W/2,cy-28,20,Math.PI*1.05,Math.PI*1.95);x.strokeStyle=gold;x.lineWidth=5;x.stroke();x.strokeStyle=lead;x.lineWidth=3;
   x.beginPath();x.moveTo(W/2-12,cy-14);x.lineTo(W/2+12,cy-14);x.lineTo(W/2+26,cy+42);x.lineTo(W/2-26,cy+42);x.closePath();x.fillStyle=v%2?ruby[1]:purple;x.fill();x.stroke()}
  else if(kind==='cross'){x.fillStyle=gold;x.fillRect(W/2-9,cy-42,18,84);x.fillRect(W/2-32,cy-18,64,18);x.strokeRect(W/2-9,cy-42,18,84);x.strokeRect(W/2-32,cy-18,64,18)}
  else{x.beginPath();for(let q=0;q<16;q++){const a=q/16*Math.PI*2,rr=q%2?18:44;x.lineTo(W/2+Math.cos(a)*rr,cy+Math.sin(a)*rr)}x.closePath();x.fillStyle=gold;x.fill();x.stroke()}};
 const order=[['fig','cross','star'],['star','fig','cross'],['cross','fig','fig'],['fig','star','fig']][v];
 med(H*.36,order[0],ruby[0]);med(H*.6,order[1],blue[1]);med(H*.84,order[2],ruby[1]);
 // Vierpass im Spitzbogen
 x.fillStyle=gold;for(const[dx,dy]of[[0,-22],[22,0],[0,22],[-22,0]]){x.beginPath();x.arc(W/2+dx,H*.12+dy,18,0,7);x.fill();x.strokeStyle=lead;x.lineWidth=3;x.stroke()}x.beginPath();x.arc(W/2,H*.12,12,0,7);x.fillStyle=ruby[1];x.fill();x.stroke();
 // senkrechte Windeisen
 x.strokeStyle=lead;x.lineWidth=6;for(const y of[H*.22,H*.48,H*.72])x.beginPath(),x.moveTo(0,y),x.lineTo(W,y),x.stroke();
 const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;map.anisotropy=8;const m=new T.MeshStandardMaterial({map,emissiveMap:map,emissive:0xffffff,emissiveIntensity:.32,roughness:.3,side:T.DoubleSide});m.name='stainedGlass'+v;GLASS.set(v,m);return m}
const TYPES=new Set(['cemetery','house','bighouse','apothecary','bakery','lumber','lodge','quarry','bower','armorer','armory','granary','market','storage','keep','garrison','gate','portcullis','tower','chapel','church','cathedral','cow','smithy','dairy','butcher','smokehouse','brewery','tannery','weaver','tavern','ironmine','coppermine','fishery','sheep','pigsty','mill','well','watchpost','palisade','apiary','harbor','orchard','farm','hopfield']);
export const referenceTypes=[...TYPES];
const PAINT=[0,0xf4f0e6,0xe8d9b0,0xd9b060,0xd8a8a0,0xb8c8d8,0xb8c8a0,0xb85a48,0xc8c0b0,0x9ab0c0,0xe0c890,0x8a9a70];
export const PAINT_N=['Standard','Weiß','Creme','Ocker','Rosé','Hellblau','Salbei','Ochsenblut','Grau','Taubenblau','Sand','Moos'];
function tintPlaster(H,c){const key='pl'+c;if(COLM.has(key))return COLM.get(key);const m=H.plaster.clone();m.color.set(c);m.onBeforeCompile=H.plaster.onBeforeCompile;m.customProgramCacheKey=H.plaster.customProgramCacheKey;COLM.set(key,m);return m}
export function buildReference(k,lv,{H,PT,MT,quad,weapon,v=0,attach=0,paint=0}){
 if(paint&&PAINT[paint])H={...H,plaster:tintPlaster(H,PAINT[paint])};
 if(!TYPES.has(k))return null;
 const V=(v|0)&3; // 4 Varianten 0..3
 const g=new T.Group();g.name='ReferenceBuilding:'+k+':'+lv+':v'+V;g.colliders=[];g.walkAreas=[];g.referenceModel=true;g.terrainConform=['cow','sheep','pigsty','apiary','orchard','farm'].includes(k);
 const batches=new Map();
 function staticMesh(geo,mat){if(geo.index){const old=geo;geo=geo.toNonIndexed();old.dispose()}if(!batches.has(mat))batches.set(mat,[]);batches.get(mat).push(geo)}
 function box(w,h,d,x,y,z,mat=H.stone,solid=false,rot=0){const geo=boxUV(new T.BoxGeometry(w,h,d));if(rot)geo.rotateZ(rot);geo.translate(x,y,z);staticMesh(geo,mat);if(solid)g.colliders.push([x,z,w/2,d/2,y+h/2,y-h/2]);}
 function cylinder(r,h,x,y,z,mat=H.wood,segments=12){const geo=new T.CylinderGeometry(r,r*1.04,h,segments);geo.translate(x,y,z);staticMesh(geo,mat)}
 function beam(a,b,r=.13,mat=H.wood){const A=new T.Vector3(...a),B=new T.Vector3(...b),delta=B.clone().sub(A),geo=boxUV(new T.BoxGeometry(r,delta.length(),r));geo.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize()));geo.translate(...A.add(B).multiplyScalar(.5).toArray());staticMesh(geo,mat)}
 function shell(w,d,h,mat=H.stone,door=2,side=false,x=0,z=0,bottom=0){const t=.35;const dbl=k==='keep'||k==='church'||k==='cathedral';if(!dbl&&door>1.5)door=1.5;g.doorWidth=door;if(!x&&!z&&!bottom)g._halfW=w/2;const gothic=bottom===0&&['chapel','church','cathedral'].includes(k),dh=gothic?(k==='chapel'?2.8:k==='church'?3.8:3.5):2.5;
 box(w,h,t,x,bottom+h/2,z-d/2+t/2,mat,true);box(t,h,d,x-w/2+t/2,bottom+h/2,z,mat,true);
 if(side){box(w,h,t,x,bottom+h/2,z+d/2-t/2,mat,true);const center=3.5,span=3+(gothic?.32:0);box(t,h,center-span/2+d/2,x+w/2-t/2,bottom+h/2,z+(-d/2+center-span/2)/2,mat,true);box(t,h,d/2-center-span/2,x+w/2-t/2,bottom+h/2,z+(d/2+center+span/2)/2,mat,true);if(!gothic)box(t,h-dh,span,x+w/2-t/2,bottom+(h+dh)/2,z+center,mat,false);}
 else{box(t,h,d,x+w/2-t/2,bottom+h/2,z,mat,true);const opening=door+(gothic?.32:0),wing=(w-opening)/2;for(const sign of[-1,1])box(wing,h,t,x+sign*(opening/2+wing/2),bottom+h/2,z+d/2-t/2,mat,true);if(h>dh&&!gothic)box(door,h-dh,t,x,bottom+(h+dh)/2,z+d/2-t/2,mat,false);}
 if(door>0&&bottom===0){const dw=side?3:door,dx=side?x+w/2:x,dz=side?z+3.5:z+d/2,angle=side?Math.PI/2:0;if(gothic){const sh=new T.Shape();const outer=dw+.32;sh.moveTo(-outer/2,h);sh.lineTo(outer/2,h);for(let i=0;i<=32;i++){const xx=outer/2-outer*i/32;sh.lineTo(xx,.08+doorTop(xx,outer,dh-.08+.16,true));}sh.closePath();const geo=new T.ExtrudeGeometry(sh,{depth:t,bevelEnabled:false});geo.translate(0,0,-t);geo.rotateY(angle);geo.translate(dx,0,dz);staticMesh(geo,mat);}
 const style=gothic?'gothic':['keep','garrison','armory','tower'].includes(k)?'fortified':['house','bighouse','farm'].includes(k)?'plain':'workshop';addDoor(g,H,{x:dx,z:gothic?dz:dz+.001,y:.08,width:gothic?dw:dw-.04,height:gothic?dh-.08:dh-.1,angle,gothic,style,double:dbl});if(!side)(g._doors=g._doors||[]).push({x:dx,z:dz,w:dw,h:dh});}
 box(w,.1,d,x,bottom+.03,z,H.floor,false);
 }
 function roof(w,d,eave,rise,mat=H.shingle,x=0,z=0,gable=H.wood){const W=w/2+.4,D=d/2+.4;const positions=[],uv=[];
 for(const side of[-1,1])for(const [px,py,pz]of[[0,rise,-D],[side*W,0,-D],[side*W,0,D],[0,rise,-D],[side*W,0,D],[0,rise,D]]){positions.push(px+x,py+eave,pz+z);uv.push((pz+D)/2,(py===rise?0:Math.hypot(W,rise))/2)}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.computeVertexNormals();const roofMat=mat.clone();roofMat.side=T.DoubleSide;staticMesh(geo,roofMat);
 for(const sign of[-1,1]){const geom=new T.BufferGeometry();geom.setAttribute('position',new T.Float32BufferAttribute([-w/2+x,eave,z+sign*d/2,w/2+x,eave,z+sign*d/2,x,eave+rise,z+sign*d/2],3));geom.setAttribute('uv',new T.Float32BufferAttribute([0,0,w/2,0,w/4,rise/2],2));geom.computeVertexNormals();const gm=gable.clone();gm.side=T.DoubleSide;staticMesh(geom,gm);beam([-w/2+x,eave,z+sign*(d/2+.07)],[x,eave+rise,z+sign*(d/2+.07)],.18);beam([x,eave+rise,z+sign*(d/2+.07)],[w/2+x,eave,z+sign*(d/2+.07)],.18)}beam([x,eave+rise+.08,z-D],[x,eave+rise+.08,z+D],.2);
 }
 function framing(w,d,h,x=0,z=0,two=false){(g._frames=g._frames||[]).push([w,d,h,x,z,two])}
 function framingNow(w,d,h,x=0,z=0,two=false){const opening=Math.max(.95,(g.doorWidth||1.5)/2+.2),levels=two?[.25,h/2,h]:[.25,h],W=g._wins||[];
 // Fachwerk spart Fenster aus: keine Pfosten, Streben oder Riegel quer über Glas
 const onFace=(ax,sign)=>W.filter(o=>ax==='z'?Math.abs(Math.sin(o.side))<.1&&Math.abs(o.z-(z+sign*d/2))<.35:Math.abs(Math.cos(o.side))<.1&&Math.abs(o.x-(x+sign*w/2))<.35).map(o=>{const c=ax==='z'?o.x:o.z;return{u0:c-o.w/2-.14,u1:c+o.w/2+.14,y0:o.y-o.h/2-.14,y1:o.y+o.h/2+.14}});
 const hit=(F,u0,u1,y0,y1)=>F.some(f=>u0<f.u1&&u1>f.u0&&y0<f.y1&&y1>f.y0);
 const run=(F,a,b,y,draw)=>{const cuts=F.filter(f=>y+.1>f.y0&&y-.1<f.y1).map(f=>[f.u0,f.u1]).sort((p,q)=>p[0]-q[0]);let cur=a;for(const[c0,c1]of cuts){if(c0>cur)draw(cur,Math.min(c0,b));cur=Math.max(cur,c1)}if(cur<b-.01)draw(cur,b)};
 for(const sign of[-1,1]){const Fz=onFace('z',sign),Fx=onFace('x',sign);
  for(const y of levels){const ex=sign===1&&y<2.6?[[x-w/2-.075,x-opening],[x+opening,x+w/2+.075]]:[[x-w/2-.075,x+w/2+.075]];
   for(const[a,b]of ex)run(Fz,a,b,y,(u0,u1)=>box(u1-u0,.2,.2,(u0+u1)/2,y,z+sign*d/2,H.wood));
   run(Fx,z-d/2-.075,z+d/2+.075,y,(u0,u1)=>box(.2,.2,u1-u0,x+sign*w/2,y,(u0+u1)/2,H.wood))}
  for(let q=-w/2;q<=w/2+.01;q+=w/4){if(sign===1&&Math.abs(q)<opening)continue;if(!hit(Fz,x+q-.09,x+q+.09,0,h))box(.18,h,.18,x+q,h/2,z+sign*d/2,H.wood);const end=q+(q>0?-1:1)*w/4;if(Math.abs(q)>w*.2&&(sign<0||Math.min(Math.abs(q),Math.abs(end))>opening)&&!hit(Fz,x+Math.min(q,end),x+Math.max(q,end),.45,h*.47))beam([x+q,.45,z+sign*(d/2+.02)],[x+end,h*.47,z+sign*(d/2+.02)],.15)}
  for(let q=-d/2;q<=d/2+.01;q+=d/3)if(!hit(Fx,z+q-.09,z+q+.09,0,h))box(.18,h,.18,x+sign*w/2,h/2,z+q,H.wood)}
 }
 function window(x,y,z,side=0,width=.85,height=1.1,stone=false){
 // Fenster nie im Türstock: auf der Türseite seitlich neben die Tür schieben (oder weglassen)
 if(Math.abs(Math.sin(side))<.01)for(const D of g._doors||[]){if(Math.abs(z-D.z)>.3||y-height/2>D.h+.15)continue;const need=D.w/2+.3+(stone?width/2:width);if(Math.abs(x-D.x)<need){const nx=D.x+(x>=D.x?1:-1)*need;if(g._halfW&&Math.abs(nx)+(stone?width/2:width)>g._halfW-.1)return;x=nx}}
 (g._wins=g._wins||[]).push({x,y,z,side,w:width,h:height});const group=new T.Group();group.position.set(x,y,z);group.rotation.y=side;const put=(w,h,d,mat,xx,yy,zz)=>{const mesh=new T.Mesh(boxUV(new T.BoxGeometry(w,h,d)),mat);mesh.position.set(xx,yy,zz);group.add(mesh)};put(width,height,.06,stone?H.dark:((Math.round(x*7+z*13+y*3)&3)===0?(H.winDark||H.dark):(H.win||H.dark)),0,0,0);for(const a of[-1,1])put(.1,height+.15,.12,stone?H.stone:H.wood,a*width/2,0,.04);for(const a of[-1,1])put(width+.15,.12,.14,stone?H.stone:H.wood,0,a*height/2,.04);put(.045,height,.13,H.wood,0,0,.09);put(width,.045,.13,H.wood,0,0,.09);if(!stone)for(const a of[-1,1])put(width*.4,height,.07,H.green,a*width*.8,0,0);g.add(group)}
 function chimney(x,z,y){box(.65,2.7,.7,x,y+1.35,z,H.stone);box(.8,.15,.85,x,y+2.7,z,H.stone);box(.45,.02,.5,x,y+2.79,z,H.dark)}
 function barrel(x,z,y=0){cylinder(.32,.72,x,y+.36,z,H.wood);for(const yy of[.15,.58]){const geo=new T.TorusGeometry(.327,.025,5,14);geo.rotateX(Math.PI/2);geo.translate(x,y+yy,z);staticMesh(geo,H.iron)}}
 function table(x,z){box(1.6,.12,.75,x,.86,z,H.wood);for(const xx of[-.65,.65])box(.12,.8,.55,x+xx,.4,z,H.wood,true)}
 function crate(x,z,y=.25,w=.75,h=.5,d=.55,mat=H.wood){box(w,h,d,x,y,z,mat,true);for(const xx of[-w/2+.06,w/2-.06])box(.05,h+.02,d+.02,x+xx,y,z,H.wood);for(const zz of[-d/2+.06,d/2-.06])box(w+.02,.05,.05,x,y+h/2-.04,z+zz,H.wood)}
 function basket(x,z,y=.2,w=.7,d=.46,fill){box(w,.05,d,x,y-.08,z,H.wood);for(const xx of[-w/2+.04,w/2-.04])box(.05,.22,d-.08,x+xx,y,z,H.wood);for(const zz of[-d/2+.04,d/2-.04])box(w-.08,.22,.05,x,y,z+zz,H.wood);if(fill)fill(x,y,z)}
 function sack(x,z,y=.32,col=0xd8cfb8){const sm=new T.MeshStandardMaterial({color:col,roughness:1});const geo=new T.SphereGeometry(.22,10,8);geo.scale(1,.7,.85);geo.translate(x,y,z);staticMesh(geo,sm);box(.1,.03,.1,x,y+.14,z,H.wood)}
 function bottle(x,z,y=.16,col=0x6fb6d9){const glass=new T.MeshStandardMaterial({color:col,roughness:.28,transparent:true,opacity:.85});cylinder(.07,.2,x,y,z,glass,10);cylinder(.03,.06,x,y+.12,z,H.iron,8)}
 function herbBundle(x,z,y=.28,col=0x4d7a3a){for(const dx of[-.06,0,.06])beam([x+dx,y-.12,z],[x+dx*.5,y+.1,z+.02],.018,new T.MeshStandardMaterial({color:col,roughness:1}));box(.1,.02,.06,x,y-.08,z,H.wood)}
 function plate(x,z,y=.98){cylinder(.12,.025,x,y,z,new T.MeshStandardMaterial({color:0xe6dcc0,roughness:.6}),14)}
 function mug(x,z,y=.99){cylinder(.08,.14,x,y,z,H.brass,12);beam([x+.08,y+.02,z],[x+.12,y+.02,z],.012,H.iron)}
 function orePile(x,z,count=5,mat=H.stone){for(let i=0;i<count;i++){const geo=new T.DodecahedronGeometry(.16+(i%3)*.03,0);geo.translate(x+(i%3-1)*.17,.16+Math.floor(i/3)*.1,z+((i*7)%3-1)*.12);staticMesh(geo,mat)}}
 function breadLoaves(x,z){for(let n=0;n<4;n++){const geo=new T.SphereGeometry(.16,8,6);geo.scale(1.4,.5,.65);geo.translate(x-.28+n*.18,1.03,z+((n&1)?.05:-.02));staticMesh(geo,H.thatch)}}
 function awning(w,d,y,x,z,mat=H.shingle){box(w,.13,d,x,y,z,mat);for(const a of[-1,1])box(.13,y,.13,x+a*(w/2-.1),y/2,z+d/2-.1,H.wood,true)}
 function crown(w,d,y,mat=H.stone,x=0,z=0){box(w,.4,.35,x,y+.2,z-d/2,mat);box(w,.4,.35,x,y+.2,z+d/2,mat);for(const a of[-1,1])box(.35,.4,d,x+a*w/2,y+.2,z,mat);const nw=Math.max(3,Math.round(w)),nd=Math.max(3,Math.round(d));for(let n=0;n<=nw;n++)for(const a of[-1,1])box(.52,.7,.5,x-w/2+n*w/nw,y+.75,z+a*d/2,mat);for(let n=1;n<nd;n++)for(const a of[-1,1])box(.5,.7,.52,x+a*w/2,y+.75,z-d/2+n*d/nd,mat)}
 function furniture(){for(const p of PT[k]||[])if(p[1]<1.9&&p[0]<=8&&p[2]<3&&p[4]<2&&p[6]!=='X')box(p[0],p[1],p[2],p[3],p[4],p[5],MT[p[6]]||H.wood,p[7]!==0)}
 function arch(x,y,z,width,height,side=0){const pts=[[-width/2,0],[-width/2,height*.6],[-width*.3,height*.87],[0,height],[width*.3,height*.87],[width/2,height*.6],[width/2,0]];const group=new T.Group();group.position.set(x,y,z);group.rotation.y=side;const curve=new T.CatmullRomCurve3(pts.map(p=>new T.Vector3(p[0],p[1],0)),false,'centripetal'),mesh=new T.Mesh(new T.TubeGeometry(curve,32,.11,6,false),H.stone);group.add(mesh);g.add(group)}
 function gothic(x,z,side,y=2.2,w=1.1,h=2.6){
 // Paired window surfaces sit outside both faces of the masonry.
 for(const inside of[false,true]){const inset=inside?-.41:0,xx=x+Math.sin(side)*inset,zz=z+Math.cos(side)*inset,group=new T.Group();group.name=inside?'StainedGlassInterior':'StainedGlassExterior';group.position.set(xx,y,zz);group.rotation.y=side;
 const sh=new T.Shape();sh.moveTo(-w/2,0);sh.lineTo(w/2,0);sh.lineTo(w/2,h*.65);sh.quadraticCurveTo(w*.4,h*.84,0,h);sh.quadraticCurveTo(-w*.4,h*.84,-w/2,h*.65);sh.closePath();const geo=new T.ShapeGeometry(sh,32),uv=geo.attributes.uv,pp=geo.attributes.position;for(let i=0;i<uv.count;i++)uv.setXY(i,pp.getX(i)/w+.5,pp.getY(i)/h);const glass=new T.Mesh(geo,fineGlass(g._gw=(g._gw||0)+(inside?0:1)));glass.userData.paneColumns=30;glass.userData.paneRows=67;group.add(glass);
 g.add(group);arch(xx,y,zz,w,h,side)}
 }
 function bell(x,y,z){const b=new T.Group(),mesh=new T.Mesh(new T.LatheGeometry([[.47,-.9],[.43,-.8],[.25,-.55],[.19,-.2],[.09,0]].map(p=>new T.Vector2(...p)),16),H.brass);b.add(mesh);const cl=new T.Mesh(new T.CylinderGeometry(.035,.05,.85,8),H.iron);cl.position.y=-.5;b.add(cl);b.position.set(x,y,z);g.add(b);g.bell=b;}
 function tip(x,y,z){if(!g.tipLights)g.tipLights=[];const mat=new T.MeshStandardMaterial({color:0xc9ac64,emissive:0xffbc56,emissiveIntensity:0});const orb=new T.Mesh(new T.SphereGeometry(.15,8,6),mat);orb.position.set(x,y,z);const light=new T.PointLight(0xffba68,0,8,2);light.position.set(x,y-.4,z);g.add(orb,light);g.tipLights.push({mat,light})}
 function gateMechanism(){g.bars=new T.Group();for(let n=0;n<10;n++){const m=new T.Mesh(new T.BoxGeometry(.075,3.35,.09),H.iron);m.position.set(-1.5+n/3,1.675,1.5);g.bars.add(m)}for(const y of[.6,1.6,2.7]){const m=new T.Mesh(new T.BoxGeometry(3.2,.1,.12),H.iron);m.position.set(0,y,1.5);g.bars.add(m)}g.add(g.bars);g.drawbridge=new T.Group();g.drawbridge.position.set(0,.16,2);const deck=new T.Mesh(boxUV(new T.BoxGeometry(3.3,.22,5)),H.floor);deck.position.z=2.5;g.drawbridge.add(deck);g.add(g.drawbridge);g.chains=[];for(const x of[-1.5,1.5]){const mesh=new T.Mesh(new T.CylinderGeometry(.027,.027,1,6),H.iron);g.add(mesh);g.chains.push({mesh,x})}}

 // ===== Eigene Grundmodelle: prägende Bauteile je Gewerbe (nur nach vorne/oben, seitlich bleibt die Baufläche frei) =====
 function features(k,w,d,h,rise,roofMat){const F=d/2,sx=a=>a,cm=(key,c)=>{if(!COLM.has(key))COLM.set(key,new T.MeshStandardMaterial({color:c,roughness:.9}));return COLM.get(key)};
  const pyr=(r,ht,x,y,z,m,sz=1)=>{const q=new T.ConeGeometry(r,ht,4);q.rotateY(Math.PI/4);q.scale(1,1,sz);q.translate(x,y,z);staticMesh(q,m)};
  const jetty=(m=H.plaster)=>{const y0=h*.5,y1=h,dz=.45;box(w,y1-y0,dz,0,(y0+y1)/2,F+dz/2,m);for(const y of[y0,y1])box(w+.1,.18,.2,0,y,F+dz+.02,H.wood);
   for(let q=-w/2;q<=w/2+.01;q+=w/4){box(.16,y1-y0,.16,q,(y0+y1)/2,F+dz+.03,H.wood);beam([q,y0-.55,F+.02],[q,y0,F+dz-.02],.08)}for(const x of[-w*.28,w*.28])window(x,(y0+y1)/2,F+dz+.05,0,.75,.95)};
  const dormer=xs=>{const x=xs*w/4,yA=h+rise*(1-Math.abs(x)/(w/2+.4));box(.9,.95,1.1,x,yA+.2,0,H.plaster);pyr(.82,.55,x,yA+.95,0,roofMat,1.2);window(x+xs*.46,yA+.2,0,xs*Math.PI/2,.55,.6)};
  const hoist=()=>{box(1,1.05,.06,0,h+.55,F+.05,H.dark);beam([0,h+rise-.45,F],[0,h+rise-.45,F+1.15],.09);beam([0,h+rise-.45,F+1.1],[0,h-.3,F+1.1],.012,H.iron);staticMesh((()=>{const q=new T.TorusGeometry(.12,.03,6,12);q.rotateY(Math.PI/2);q.translate(0,h+rise-.6,F+1.1);return q})(),H.iron)};
  const stoneBase=()=>{const dw=(g.doorWidth||2.2)/2+.1;for(const a of[-1,1]){const L=w/2-dw;box(L,1,.08,a*(dw+L/2),.5,F+.05,H.stone)}};
  const shutter=x=>{box(1.4,.07,.5,x,1.05,F+.27,H.wood);beam([x-.65,1.05,F+.5],[x-.65,1.7,F+.03],.012,H.iron);beam([x+.65,1.05,F+.5],[x+.65,1.7,F+.03],.012,H.iron)};
  const upperWin=()=>{if(h>=4.1)for(const x of[-w*.3,0,w*.3])window(x,h-1.15,F+.03,0,.7,.9)};
  const T3={
   tavern:()=>{jetty();for(const xs of[-1,1])dormer(xs);stoneBase()},
   bighouse:()=>{},
   apothecary:()=>{const oy=h*.66;box(1.6,1.3,.6,0,oy,F+.3,H.plaster);for(const x of[-.8,.8])box(.14,1.32,.14,x,oy,F+.6,H.wood);window(0,oy,F+.62,0,1.05,.8);for(const a of[-1,1])window(a*.81,oy,F+.3,a*Math.PI/2,.35,.7);
    pyr(1.2,.75,0,oy+1.0,F+.3,H.redRoof,.5);for(const x of[-.55,.55])beam([x,oy-1.2,F+.02],[x,oy-.65,F+.55],.07);
    box(1.5,.32,.7,w/2-.95,.16,F+.7,H.wood);for(let q=0;q<7;q++){const geo=new T.IcosahedronGeometry(.11+((q*7)%3)*.02,0);geo.translate(w/2-1.55+q*.2,.42,F+.6+(q%2)*.18);staticMesh(geo,cm('herbBed',[0x4f7a3a,0x6a8a4a,0x7a6a9a][q%3]))}},
   bakery:()=>{shutter(w*.25)},
   smithy:()=>{const cx=w/2-.8,cz=-F+.7,ch=h+rise+1.6;box(1.3,ch,1.1,cx,ch/2,cz,H.stone);box(1.5,.2,1.3,cx,ch,cz,H.stone);box(.9,.03,.7,cx,ch+.11,cz,H.dark)},
   weaver:()=>{upperWin();hoist()},storage:()=>{hoist()},
   brewery:()=>{upperWin();for(const[x,z]of[[-.55,-.55],[.55,-.55],[-.55,.55],[.55,.55]])box(.1,.9,.1,x,h+rise+.35,z,H.wood);for(let y=.15;y<.85;y+=.18)box(1.1,.04,1.1,0,h+rise+y,0,H.wood);pyr(.95,.7,0,h+rise+1.15,0,roofMat)},
   smokehouse:()=>{for(const a of[-1,1])box(.08,.6,1.4,a*.35,h+rise+.2,0,H.wood);box(.9,.06,1.6,0,h+rise+.55,0,H.shingle)},
   tannery:()=>{for(let y=h+.2;y<h+rise-.25;y+=.22){const wd=w*(1-(y-h)/rise);box(wd,.06,.05,0,y,F+.1,H.wood)}upperWin()},
   armorer:()=>{for(let q=0;q<5;q++)box(w*(1-q/5)+.1,rise/5+.02,.32,0,h+rise/5*(q+.5),F+.12,H.stone)},
   dairy:()=>{for(let y=h+.3;y<h+rise-.4;y+=.2){const wd=w*.5*(1-(y-h)/rise);box(wd,.05,.05,0,y,F+.08,H.wood)}},
   butcher:()=>{stoneBase();shutter(w*.25)},
   bower:()=>{for(const x of[-w*.3,w*.3]){staticMesh((()=>{const q=new T.CylinderGeometry(.45,.45,.25,16);q.rotateX(Math.PI/2);q.translate(x,.85,F+1.2);return q})(),H.thatch);box(.06,1.1,.06,x,.55,F+1.05,H.wood)}},
   lumber:()=>{},fishery:()=>{}};
  (T3[k]||(()=>{}))()}
 if(k==='house'||k==='bighouse'){
  // Mittelalterliche Erkerbauweise: Erdgeschoss + zwei vorkragende Obergeschosse (Giebel zur Straße).
  // Freie Seiten kragen aus, Seiten mit direktem Nachbarhaus bleiben bündig und geschlossen (Brandwand ohne Fenster).
  const big=k==='bighouse',w=big?8:6,d=6,h0=2.7,SH=2.3,OV=.42,mask=attach|0,free=[!(mask&1),!(mask&2),!(mask&4),!(mask&8)];   // links, rechts, hinten, vorne
  const roofs=big?[H.slate,H.shingle,H.slate,H.redRoof]:[H.thatch,H.shingle,H.thatch,H.slate],roofMat=roofs[V];
  const PC=big?[0xe9e2d0,0xd9b98a,0xe8d8c0,0xcfa48a]:[0xf0eadc,0xe6d2a8,0xdcc6b0,0xd8c9a0],plaster=paint&&PAINT[paint]?H.plaster:tintPlaster(H,PC[V]),storeys=k==='house'?Math.max(0,Math.min(2,lv|0)):2;
  const IN=globalThis.BFRules.interior(k,lv),hole=s=>{const st=IN.stairs.find(q=>Math.abs(q.e1-(s?IN.h0+(s-1)*IN.SH+.2:0))<.05);return st?[st.x-st.wd/2-.05,st.x+st.wd/2+.05,Math.min(st.z0,st.z1)-.15,Math.max(st.z0,st.z1)+.1]:null};
  // Decke/Boden mit Treppenöffnung
  const slab=(x0,x1,z0,z1,y,th,mat,hl)=>{if(!hl){box(x1-x0,th,z1-z0,(x0+x1)/2,y,(z0+z1)/2,mat);return}const[a0,a1,b0,b1]=hl;
   if(a0>x0)box(a0-x0,th,z1-z0,(x0+a0)/2,y,(z0+z1)/2,mat);if(x1>a1)box(x1-a1,th,z1-z0,(a1+x1)/2,y,(z0+z1)/2,mat);if(b0>z0)box(a1-a0,th,b0-z0,(a0+a1)/2,y,(z0+b0)/2,mat);if(z1>b1)box(a1-a0,th,z1-b1,(a0+a1)/2,y,(b1+z1)/2,mat)};
  shell(w,d,h0,big&&V%2?H.stone:plaster,1.4);if(!(big&&V%2))framing(w,d,h0);slab(-w/2+.2,w/2-.2,-d/2+.2,d/2-.2,h0-.05,.14,H.floor,storeys?hole(1):null);
  // Erdgeschoss-Fenster (Seitenfenster nur an freien Seiten)
  const gw=.8;window(-(.7+.3+gw),1.5,d/2+.04,0,gw,1);if(big)window(.7+.3+gw+.2,1.5,d/2+.04,0,gw,1);
  if(free[1])window(w/2+.04,1.5,V&1?-1:.6,Math.PI/2,gw,1);if(free[0])window(-w/2-.04,1.5,V&1?.6:-1,-Math.PI/2,gw,1);if(free[2])window(V&1?1:-1,1.5,-d/2-.04,Math.PI,gw,1);
  const pt=(ax,pos,u,y)=>ax==='z'?[u,y,pos]:[pos,y,u];
  let top={x0:-w/2,x1:w/2,z0:-d/2,z1:d/2,y:h0};
  for(let s=1;s<=storeys;s++){const o=OV*s,L=free[0]?o:0,Rr=free[1]?o:0,B=free[2]?o:0,F=free[3]?o:0,x0=-w/2-L,x1=w/2+Rr,z0=-d/2-B,z1=d/2+F,y0=h0+(s-1)*SH,y1=y0+SH,cx=(x0+x1)/2,cz=(z0+z1)/2;
   slab(x0-.03,x1+.03,z0-.03,z1+.03,y0+.1,.2,H.wood,hole(s));                                       // Stockwerksboden mit Treppenloch
   const t=.2;box(x1-x0,SH,t,cx,y0+SH/2,z1-t/2,plaster,false);box(x1-x0,SH,t,cx,y0+SH/2,z0+t/2,plaster,false);box(t,SH,z1-z0-2*t,x0+t/2,y0+SH/2,cz,plaster,false);box(t,SH,z1-z0-2*t,x1-t/2,y0+SH/2,cz,plaster,false);
   // Wandflächen: [Achse, Lage, Richtung, u0, u1, frei, Fensterseite]
   const faces=[['z',z1,1,x0,x1,free[3],0],['z',z0,-1,x0,x1,free[2],Math.PI],['x',x0,-1,z0,z1,free[0],-Math.PI/2],['x',x1,1,z0,z1,free[1],Math.PI/2]];
   for(const[ax,pos,sg,u0,u1,isFree,side]of faces){const len=u1-u0,P=(u,y)=>pt(ax,pos+sg*.06,u,y);
    // Fachwerk: Schwelle, Rähm, Eckständer
    beam(P(u0,y0+.12),P(u1,y0+.12),.16);beam(P(u0,y1-.1),P(u1,y1-.1),.16);for(const u of[u0+.09,u1-.09])beam(P(u,y0+.1),P(u,y1-.1),.17);
    if(!isFree){for(let u=u0+len/3;u<u1-.3;u+=len/3)beam(P(u,y0+.1),P(u,y1-.1),.15);continue}        // geschlossene Fassade zum Nachbarn
    const n=Math.max(1,Math.floor(len/(ax==='z'&&sg>0?2.05:2.5))),ww=ax==='z'&&sg>0?.72:.66,wh=1.05,wy=y0+1.22;
    for(let q=0;q<n;q++){const u=u0+len*(q+.5)/n;
     const wp=pt(ax,pos+sg*.1,u,wy);window(wp[0],wp[1],wp[2],side,ww,wh);
     for(const e of[-1,1])beam(P(u+e*(ww/2+.12),y0+.1),P(u+e*(ww/2+.12),y1-.1),.14);beam(P(u-ww/2-.12,wy-wh/2-.12),P(u+ww/2+.12,wy-wh/2-.12),.13);
     if(q<n-1){const m=u0+len*(q+1)/n;beam(P(m,y0+.1),P(m,y1-.1),.15);beam(P(m,y0+.3),P(m-.38,wy-wh/2-.2),.1);beam(P(m,y0+.3),P(m+.38,wy-wh/2-.2),.1)}}
    // Mann-Figur an den Ecken
    beam(P(u0+.12,y0+.25),P(u0+.55,y1-.2),.12);beam(P(u1-.12,y0+.25),P(u1-.55,y1-.2),.12);
    // Balkenköpfe und Knaggen unter der Auskragung
    const prevPos=ax==='z'?(sg>0?(s>1&&free[3]?z1-OV:d/2):(s>1&&free[2]?z0+OV:-d/2)):(sg>0?(s>1&&free[1]?x1-OV:w/2):(s>1&&free[0]?x0+OV:-w/2));
    if(Math.abs(prevPos-pos)>.05){for(let u=u0+.3;u<u1-.2;u+=.55){const a=pt(ax,prevPos,u,y0-.02),b=pt(ax,pos+sg*.05,u,y0-.02);beam(a,b,.13)}
     for(const u of[u0+.6,(u0+u1)/2,u1-.6])beam(pt(ax,prevPos+sg*.05,u,y0-.75),pt(ax,pos-sg*.05,u,y0-.04),.11)}
    // Blumenkästen unter den Erkerfenstern (nur Straßenseite)
    if(ax==='z'&&sg>0&&s===1)for(let q=0;q<n;q++){const u=u0+len*(q+.5)/n;box(ww+.1,.16,.2,u,wy-wh/2-.2,pos+.2,H.wood);for(let f=0;f<4;f++){const geo=new T.SphereGeometry(.06,6,5);geo.translate(u-ww/2+.12+f*(ww-.24)/3,wy-wh/2-.07,pos+.22);staticMesh(geo,COLM.get('fl'+f)||(COLM.set('fl'+f,new T.MeshStandardMaterial({color:[0xc83a3a,0xe8c040,0xd870a0,0xf0f0e8][f],roughness:.8})),COLM.get('fl'+f)))}}}
   top={x0,x1,z0,z1,y:y1}}
  const rw=top.x1-top.x0,rd=top.z1-top.z0,rx=(top.x0+top.x1)/2,rz=(top.z0+top.z1)/2,rise=big?3.6:storeys?3.2:2.7;
  roof(rw,rd,top.y,rise,roofMat,rx,rz,plaster);
  for(const sg of[-1,1]){const zz=rz+sg*(rd/2+.08);beam([rx,top.y+.15,zz],[rx,top.y+rise-.2,zz],.14);beam([rx-rw/4,top.y+.15,zz],[rx-rw/4,top.y+rise/2,zz],.12);beam([rx+rw/4,top.y+.15,zz],[rx+rw/4,top.y+rise/2,zz],.12);beam([rx-rw/2+.2,top.y+.6,zz],[rx+rw/2-.2,top.y+.6,zz],.12);
   window(rx,top.y+1.15,zz+sg*.03,sg>0?0:Math.PI,.55,.75)}                                   // Giebelfenster
  const chx=[-w*.25,w*.25,-w*.25,w*.25][V];chimney(chx,-.9,top.y+rise*(1-Math.abs(chx-rx)/(rw/2+.4))-1.5);
  if(V&1)barrel(w/2-.6,d/2+.45);
  // ===== Innenleben: Treppen, Betten, Esstisch mit Bänken, Herd, Truhen =====
  {const cm=(n,c)=>COLM.get(n)||(COLM.set(n,new T.MeshStandardMaterial({color:c,roughness:.95})),COLM.get(n)),lin=cm('ilin',0xe8e0cc),blk=[cm('ibl0',0x7a2e24),cm('ibl1',0x34506a),cm('ibl2',0x5a6a34),cm('ibl3',0x8a6a3a)];
   for(const st of IN.stairs){const run=st.z1-st.z0,rise=st.e1-st.e0,n=Math.ceil(rise/.2),dz=run/n;
    for(let q=0;q<n;q++)box(st.wd,.07,Math.abs(dz)+.02,st.x,st.e0+(q+1)*rise/n-.035,st.z0+(q+.5)*dz,H.wood);
    for(const sx of[-1,1])beam([st.x+sx*(st.wd/2-.03),st.e0,st.z0],[st.x+sx*(st.wd/2-.03),st.e1,st.z1],.06);                 // Wangen
    beam([st.x-st.wd/2-.02,st.e0+.95,st.z0],[st.x-st.wd/2-.02,st.e1+.95,st.z1],.035);beam([st.x-st.wd/2-.02,st.e1,st.z1],[st.x-st.wd/2-.02,st.e1+.95,st.z1],.04)}   // Handlauf
   IN.beds.forEach(([bx,bz,e],i)=>{if(e>0&&(e-.2-IN.h0)/IN.SH+1>storeys+.01)return;box(1.0,.32,1.95,bx,e+.16,bz,H.wood);box(.9,.13,1.82,bx,e+.38,bz,lin);box(.62,.1,.32,bx,e+.49,bz-.72,lin);box(.94,.06,1.15,bx,e+.47,bz+.32,blk[(i+V)%4]);box(1.0,.62,.07,bx,e+.31,bz-.99,H.wood);box(.7,.38,.4,bx,e+.19,bz+1.22,H.wood,true)});   // Bett, Matratze, Kissen, Decke, Kopfteil, Truhe
   {const[tx,tz]=IN.table;box(1.6,.08,.8,tx,.8,tz,H.wood);for(const lx of[-.65,.65])box(.1,.76,.6,tx+lx,.38,tz,H.wood);for(const bz of[tz-.65,tz+.65]){box(1.5,.06,.3,tx,.45,bz,H.wood);for(const lx of[-.6,.6])box(.07,.42,.24,tx+lx,.21,bz,H.wood)}
    plate(tx-.4,tz-.15,.86);plate(tx+.4,tz+.15,.86);mug(tx,tz,.87)}
   {const[hx,hz]=IN.hearth;box(1.3,.5,.75,hx,.25,hz,H.stone,true);box(1.3,.2,.8,hx,1.6,hz,H.stone);for(const sx of[-.6,.6])box(.12,1.1,.12,hx+sx,1.0,hz+.3,H.stone);cylinder(.18,.25,hx,.62,hz,cm('ifire',0x3a2a1a),8);
    const fl=new T.Mesh(new T.ConeGeometry(.14,.32,7),new T.MeshBasicMaterial({color:0xff9a3a}));fl.position.set(hx,.82,hz);g.add(fl);barrel(hx+1.1,hz+.1)}
   box(.9,1.6,.35,-w/2+.35,.8,d/2-1.2,H.wood,true);for(const y of[.5,1.0,1.45])box(.86,.04,.33,-w/2+.38,y,d/2-1.2,H.wood)}   // Regal
  furniture();
 }
 else if(k==='apothecary'||k==='market'||k==='granary'){
 const w=k==='apothecary'?5:6,d=k==='apothecary'?5:k==='granary'?5:6,h=k==='granary'?4.5:5.6;
 const roofs={apothecary:H.redRoof,bighouse:[H.slate,H.shingle,H.slate,H.redRoof][V],market:[H.thatch,H.shingle,H.thatch,H.slate][V],granary:[H.shingle,H.thatch,H.shingle,H.slate][V]};
 shell(w,d,h,H.plaster,k==='granary'?2.8:1.9);box(w,.8,.35,0,.4,-d/2,H.stone);framing(w,d,h,0,0,true);roof(w,d,h,2.7,roofs[k]||H.shingle,0,0,H.plaster);
 // Fenster-Layouts
 if(V===0){for(const x of[-w*.3,w*.3])window(x,3.95,d/2+.04,0,.8,1.05);for(const z of[-d*.25,d*.25])window(w/2+.04,3.95,z,Math.PI/2,.8,1.05)}
 else if(V===1){window(-w*.35,3.95,d/2+.04,0,.9,1.1);window(w*.2,3.95,d/2+.04,0,.7,.95);window(-w/2-.04,3.95,0,-Math.PI/2,.8,1.05);window(w/2+.04,3.95,d*.3,Math.PI/2,.8,1.05)}
 else if(V===2){for(const x of[-w*.35,0,w*.35])window(x,3.9,d/2+.04,0,.65,.95);window(w/2+.04,3.95,-d*.3,Math.PI/2,.8,1.05);window(-w/2-.04,3.95,d*.2,-Math.PI/2,.7,1)}
 else{window(0,4.0,d/2+.04,0,1.2,1.15);window(w/2+.04,3.95,-d*.25,Math.PI/2,.75,1);window(w/2+.04,3.95,d*.25,Math.PI/2,.75,1);window(-w/2-.04,3.95,0,-Math.PI/2,.8,1.05)}
 if(k==='apothecary'){const cx=[-w*.25,w*.25,-w*.3,w*.3][V],cz=[-d*.2,-d*.2,d*.15,-d*.25][V];chimney(cx,cz,h+1.3)}
 barrel(-w*.35+(V*.15),d/2+.45);if(V>=2)barrel(w*.3,d/2+.4);
 furniture();if(k==='apothecary')features(k,w,d,h,2.7,roofs[k]||H.shingle);
 if(k==='market'){awning(5,2,2.5,0,3.1,H.shingle);table(-1.4+(V%2)*.3,3.3);table(1.4-(V%2)*.3,3.3);for(const x of[-1.8,-1.4,-1,1,1.4,1.8])cylinder(.14,.15,x,1.02,3.3,((x<0)^(V&1))?H.green:H.thatch,8);
  basket(-1.45,3.25,.98,.72,.44,(x,y,z)=>{for(const dx of[-.14,0,.14]){const geo=new T.SphereGeometry(.1,8,6);geo.translate(x+dx,y+.02,z);staticMesh(geo,H.redRoof)}});basket(1.45,3.25,.98,.72,.44,(x,y,z)=>{for(const dx of[-.16,0,.16]){const geo=new T.SphereGeometry(.1,8,6);geo.translate(x+dx,y+.02,z);staticMesh(geo,H.green)}});
  sack(-2.25,2.75,.35,0xd8cfb8);sack(2.2,2.75,.35,0x9a8767);box(3.2,.08,.22,0,2.15,3.95,H.wood);for(const x of[-1.2,0,1.2])herbBundle(x,4.04,2.28,x?0x4d7a3a:0x7a5a2a);orePile(-2.4,3.55,3,H.brass)}
 if(k==='granary'){for(const x of[-2,-1,1,2])for(const z of[-1.6,-.8])if(((x+z+V)&1)===0)barrel(x,z);}
 }
 else if(['bakery','bower','armorer','smithy','lumber','storage','dairy','butcher','smokehouse','brewery','tannery','weaver','tavern','fishery'].includes(k)){
 const PX={tavern:{h:5.4,rise:2.6},weaver:{h:5,rise:2.4},storage:{h:4.6,rise:2.2},brewery:{h:4.2,rise:2.2},smokehouse:{h:4.4,rise:2.6,wall:H.wood},tannery:{h:3.8,rise:2.2},smithy:{h:3.4,wall:H.stone},armorer:{h:3.6,wall:H.stone},dairy:{wall:H.stone,rise:2.3},bower:{wall:H.wood},lumber:{wall:H.wood},fishery:{wall:H.wood},butcher:{h:3.3}}[k]||{};
 const w=k==='tavern'?8:k==='smokehouse'?4:['bakery','smithy','storage','brewery'].includes(k)?6:5,d=k==='tavern'?6:['lumber','butcher','tannery','smokehouse','fishery'].includes(k)?4:5,h=PX.h??3,rise=PX.rise||2,wall=PX.wall||H.plaster;
 const redRoof=['armorer','smithy','brewery','tavern'].includes(k),roofMat=redRoof?[H.redRoof,H.shingle,H.redRoof,H.slate][V]:[H.shingle,H.thatch,H.shingle,H.redRoof][V];
 shell(w,d,h,wall,2.2);if(wall!==H.stone)framing(w,d,h,0,0,h>=4.1);roof(w,d,h,rise,roofMat,0,0,wall===H.stone?H.stone:H.wood);if(!['tavern','bakery','storage'].includes(k))awning(w-1,1.8,2.3,0,d/2+.1,H.shingle);
 // Fenster-Varianten
 if(V===0)window(-w*.3,2.28,d/2+.02,0,.7,.9);
 else if(V===1){window(w*.3,2.28,d/2+.02,0,.7,.9);window(w/2+.02,1.75,0,Math.PI/2,.65,.85)}
 else if(V===2){window(-w*.35,2.28,d/2+.02,0,.6,.85);window(w*.25,2.28,d/2+.02,0,.6,.85)}
 else{window(-w*.28,2.34,d/2+.02,0,.72,.92);window(w*.28,2.34,d/2+.02,0,.72,.92);window(-w/2-.02,1.75,d*.2,-Math.PI/2,.6,.85)}
 if(V&1)barrel(w*.4,d/2+.5);if(V===3)barrel(-w*.4,d/2+.45);
 furniture();features(k,w,d,h,rise,roofMat);
 if(k==='bakery'){const ox=-1.75,oz=-1.45;box(1.7,.8,1.6,ox,.4,oz,H.stone,true);staticMesh((()=>{const q=new T.SphereGeometry(.8,16,8,0,Math.PI*2,0,Math.PI/2);q.scale(1,.85,1);q.translate(ox,.8,oz);return q})(),H.stone);{const sh=new T.Shape();sh.moveTo(-.28,0);sh.lineTo(.28,0);sh.lineTo(.28,.18);sh.absarc(0,.18,.28,0,Math.PI,false);sh.closePath();const q=new T.ShapeGeometry(sh,12);q.translate(ox,.82,oz+.81);staticMesh(q,H.dark)}box(.9,.08,.3,ox,.78,oz+.9,H.stone);cylinder(.16,3.4,ox+.3,2.8,oz-.35,H.stone,8);box(.42,.12,.42,ox+.3,4.5,oz-.35,H.stone);table(1.4,1.6);breadLoaves(1.35,1.58);sack(-2.15,1.3,.35,0xf0ece0);sack(-2.15,1.95,.35,0xd8cfb8)}
 if(k==='bower'){table(1.5,.7);for(const x of[-1.7,1.7]){const bow=weapon('bow');bow.position.set(x,1.25,2.65);bow.scale.setScalar(.7);g.add(bow)}const target=new T.Mesh(new T.CylinderGeometry(.57,.57,.12,20),H.thatch);target.rotation.x=Math.PI/2;target.position.set(-2.4,.8,2.1);g.add(target);for(const radius of[.18,.37]){const ring=new T.Mesh(new T.TorusGeometry(radius,.025,5,24),radius<.2?H.redRoof:H.iron);ring.position.set(-2.4,.8,2.18);g.add(ring)}}
 if(k==='armorer'){table(1.3,.5);for(const x of[-1.3,1.3]){box(.15,1.6,.15,x,.8,2.7,H.wood);const armor=new T.Mesh(new T.SphereGeometry(.35,12,8),H.iron);armor.scale.set(1,1.35,.5);armor.position.set(x,1.3,2.7);g.add(armor);const helm=new T.Mesh(new T.SphereGeometry(.2,10,8,0,Math.PI*2,0,Math.PI*.6),H.iron);helm.position.set(x,1.92,2.7);g.add(helm)}crate(-1.6,2.55,.25,.9,.5,.7,H.wood);box(.55,.24,.28,-1.6,.62,2.55,H.redRoof);box(.28,.22,.22,-1.3,.63,2.55,H.iron)}
 if(k==='smithy'){box(1.4,1.3,1.2,1.7,.65,-1.4,H.stone,true);box(.65,.4,.06,1.7,.55,-.77,MT.F);chimney(1.7,-1.4,2.3);box(.6,.5,.5,-1.6,.25,2,H.wood,true);box(.85,.22,.3,-1.6,.6,2,H.iron);orePile(-2.15,-1.55,5,H.iron);crate(-1.7,2.85,.25,.95,.45,.7,H.wood);for(const x of[-2.05,-1.8,-1.55])box(.05,.75,.04,x,.9,2.84,H.iron);box(.5,.08,.05,2.25,1.1,-.85,H.iron);beam([2.05,1.22,-.85],[2.35,1.42,-.85],.03,H.iron)}
 if(k==='lumber'){g.logs=new T.Group();for(let row=0;row<3;row++)for(let n=0;n<4-row;n++){const log=new T.Mesh(new T.CylinderGeometry(.18,.2,1.6,8),H.wood);log.rotation.z=Math.PI/2;log.position.set(1.5,.2+row*.35,1.5+n*.38);g.logs.add(log)}g.add(g.logs);g.setLogs=n=>g.logs.children.forEach((o,i)=>o.visible=i<n);cylinder(.35,.55,-1.7,.275,2.4,H.wood);}
 if(k==='dairy'){for(const x of[-1.6,1.6]){table(x,-.6);for(const z of[-1.1,-.6,-.1])cylinder(.23,.14,x,1,z,H.thatch)}barrel(-1.7,1.5);chimney(-1.5,-1.5,3.1);}
 if(k==='butcher'){table(-1.4,-.6);box(1.2,.12,.6,-1.4,.98,-.6,MT.Z);for(const x of[1.1,1.6]){beam([x,2.4,-1],[x,1.7,-1],.04,H.iron);cylinder(.12,.55,x,1.45,-1,MT.Z)}chimney(-1.5,-1.2,3.1);}
 if(k==='smokehouse'){chimney(1,-1,3.2);box(1.1,1.1,.8,-1,.55,-1,H.stone,true);for(const y of[1.3,1.8,2.3]){box(2,.08,.75,0,y,-1,H.iron);for(const x of[-.65,0,.65])cylinder(.12,.35,x,y+.2,-1,MT.Z)}}
 if(k==='brewery'){for(const x of[-2,2]){cylinder(.6,1.6,x,.8,-1,H.brass);barrel(x,1.4)}beam([-2,1.6,-1],[2,1.6,-1],.1,H.brass);chimney(-2,-1,3.4);}
 if(k==='tannery'){for(const x of[-1.5,1.5]){cylinder(.55,.6,x,.3,-.8,H.wood);cylinder(.47,.03,x,.62,-.8,H.dark);for(const xx of[x-.6,x+.6])box(.12,2,.12,xx,1,1,H.wood);box(1.1,.12,.1,x,1.95,1,H.wood);box(.9,1.25,.045,x,1.15,1,H.thatch)}}
 if(k==='weaver'){for(const x of[-1.8,-.5])box(.13,2,.13,x,1,-.8,H.wood);for(const y of[.4,1.8])box(1.5,.12,.14,-1.15,y,-.8,H.wood);for(let x=-1.7;x<-.55;x+=.08)beam([x,.45,-.8],[x,1.75,-.8],.015,H.plaster);table(1.5,-.8);box(1.3,.06,.6,1.5,.97,-.8,H.green);basket(1.55,-.12,.2,.65,.42,(x,y,z)=>{for(const dx of[-.12,.03,.18]){const geo=new T.SphereGeometry(.11,8,6);geo.translate(x+dx,y+.03,z+((dx*10)%2)*.03);staticMesh(geo,H.plaster)}});box(1.4,.03,.7,1.55,1.45,-.8,H.redRoof);box(1.4,.03,.7,1.55,1.23,-.74,H.green)}
 if(k==='tavern'){chimney(-2,-1.8,5.5);for(const x of[-2.6,2.6])window(x,4.1,3.03);{const TI=globalThis.BFRules.interior('tavern');for(const[x,z]of TI.tables){table(x,z);for(const bz of[z-.62,z+.62]){box(1.4,.07,.3,x,.45,bz,H.wood);for(const lx of[-.55,.55])box(.07,.42,.24,x+lx,.21,bz,H.wood)}plate(x-.4,z-.15);plate(x+.4,z+.15);mug(x-.2,z+.2);mug(x+.25,z-.2)}
  const[cx,cz,cw]=TI.counter;box(cw,1.05,.6,cx,.52,cz,H.wood,true);box(cw+.1,.06,.7,cx,1.07,cz,H.wood);for(const x of[-1,0,1])mug(cx+x*.5,cz,1.12);
  for(const x of[-1.1,1.1]){box(.8,.4,.6,x,.2,-2.6,H.wood);const geo=new T.CylinderGeometry(.3,.3,.65,12);geo.rotateZ(Math.PI/2);geo.translate(x,.72,-2.6);staticMesh(geo,H.wood);cylinder(.03,.12,x+.33,.62,-2.6,H.brass,6)}   // liegende Zapffässer
  barrel(-3.4,-2.4);barrel(3.4,-2.4);barrel(-3.4,-1.7);box(1.6,.04,.25,0,1.7,-2.88,H.wood);for(const x of[-.6,-.2,.2,.6])mug(x,-2.88,1.74)}
 box(1.2,.9,.12,2.5,2.3,3.15,H.wood);cylinder(.23,.35,2.5,2.3,3.3,H.brass);box(2.4,.08,.12,0,2.1,3.12,H.wood);for(const x of[-.8,0,.8])mug(x,3.14,2.1)}
 if(k==='fishery'){awning(2.2,1.8,2.1,-1.3,1.3,H.thatch);for(let x=-2;x<-.4;x+=.18)beam([x,.4,1.5],[x,1.8,1.5],.025,H.plaster);for(const y of[.5,.8,1.1,1.4,1.7])beam([-2,y,1.5],[-.4,y,1.5],.025,H.plaster);barrel(1.6,-1);}
 if(k==='storage')for(const x of[-2,-1,1,2])box(.75,.8,.75,x,.4,-1.4,H.wood,true);
 }
 else if(k==='lodge'){for(const [x,z]of[[-1.5,-1],[1.5,-1],[-1.5,1.3],[1.5,1.3]])box(.16,2.5,.16,x,1.25,z,H.wood,true);roof(3.5,3.6,2.1,1.5,H.thatch,0,-.2,H.wood);box(3.5,2.1,.2,0,1.05,-2,H.wood,true);table(0,.5);beam([-2,0,1.6],[-2,2,1.6]);beam([2,0,1.6],[2,2,1.6]);beam([-2,2,1.6],[2,2,1.6]);const hide=new T.Mesh(new T.SphereGeometry(1,10,8),H.wood);hide.scale.set(.5,.8,.07);hide.position.set(.5,1.05,1.6);g.add(hide);}
 else if(['quarry','ironmine','coppermine'].includes(k)){const ore=k==='ironmine'?H.iron:k==='coppermine'?H.brass:H.stone;box(4.8,.18,3.8,0,.09,0,H.floor);for(const x of[-1.8,1.8]){box(.28,4,.28,x,2,0,H.wood,true);beam([x,0,-1.5],[x,3.4,0],.2);beam([x,0,1.5],[x,3.4,0],.2)}beam([-2.1,3.8,0],[2.1,3.8,0],.35);beam([0,3.8,0],[0,1.1,0],.065,H.iron);box(1.3,1,1.1,0,.6,0,ore,true);for(const x of[-1.6,1.6])box(.8,.45,.6,x,.35,1.2,ore,true);const wheel=new T.Mesh(new T.TorusGeometry(.65,.09,6,20),H.wood);wheel.position.set(-1.8,1.6,.25);g.add(wheel);orePile(-1.55,-1.1,4,ore);orePile(1.55,-1.15,4,ore);crate(1.9,1.75,.25,.9,.45,.65,H.wood)}
 else if(k==='keep'){
 if(lv===0){shell(9,8,4.2,H.wood,2.4);framing(9,8,4.2);roof(9,8,4.2,3,H.thatch);box(2.6,8,2.6,4.1,4,-2.7,H.wood,true);box(3,.2,3,4.1,8.05,-2.7,H.floor);crown(3,3,8.15,H.wood,4.1,-2.7);g.walkAreas.push([4.1,-2.7,1.5,1.5,8.15]);}
 else{const y=lv===1?9.3:11.3,mat=lv===1?H.wood:H.stone;shell(10,8,y,mat,2.4);box(10,.2,8,0,y-.1,0,H.floor);crown(10,8,y,mat);g.walkAreas.push([0,0,5,4,y]);for(const x of[-4.7,4.7])for(const z of[-3.7,3.7]){box(.5,y+.3,.5,x,y/2,z,mat);if(lv>=3){cylinder(.7,y+1.2,x,(y+1.2)/2,z,H.stone);crown(1.6,1.6,y+1.2,H.stone,x,z)}}for(const yy of[3.3,6.3,8.6]){
  // Vorne (bleiben)
  window(-2.6,yy,4.03,0,.6,1.1,lv>1);window(2.6,yy,4.03,0,.6,1.1,lv>1);
  // Rechts mittig (bleibt)
  window(5.03,yy,0,Math.PI/2,.6,1.1,lv>1);
  // Links mittig (neu)
  window(-5.03,yy,0,-Math.PI/2,.6,1.1,lv>1);
  // Hinten (neu)
  window(-2.6,yy,-4.03,Math.PI,.6,1.1,lv>1);window(2.6,yy,-4.03,Math.PI,.6,1.1,lv>1);
 }if(lv===1)framing(10,8,y,0,0,true);}
 furniture();
 }
 else if(k==='garrison'){const mat=lv?H.stone:H.wood;shell(8,6,4,mat,2.2);box(8,.2,6,0,3.9,0,H.floor);crown(8,6,4,mat);g.walkAreas.push([0,0,4,3,4]);if(!lv)for(let x=-3.8;x<4;x+=.48)box(.2,4.7,.2,x,2.35,-2.95,H.wood);for(const x of[-3,3]){cylinder(.1,2.3,x,1.15,3.5,H.wood);const target=new T.Mesh(new T.CylinderGeometry(.42,.42,.12,16),H.thatch);target.rotation.x=Math.PI/2;target.position.set(x,1.5,3.5);g.add(target)}for(const x of[-2.2,0,2.2]){const sw=weapon(x?x<0?'sword':'bow':'sword');sw.position.set(x,.95,2.2);if(x>0)sw.rotation.y=.35;else sw.rotation.z=Math.PI;g.add(sw)}for(const x of[-1.8,1.8]){const shield=new T.Mesh(new T.CylinderGeometry(.22,.28,.12,16,1,true),x<0?H.redRoof:H.green);shield.position.set(x,1.05,-2.25);shield.rotation.z=Math.PI/2;g.add(shield)}furniture();}
 else if(k==='gate'||k==='portcullis'){const mat=lv?H.stone:H.wood;for(const x of[-2.85,2.85])box(2.3,4,4,x,2,0,mat,true);box(7.9,.65,3.9,0,3.675,0,lv?H.stone:H.floor);g.colliders.push([0,0,4,2,4,3.35]);crown(8,4,4,mat);g.walkAreas.push([0,0,4,2,4]);if(lv){for(const x of[-3.6,3.6])for(const z of[-1.6,1.6]){cylinder(.46,4.55,x,2.275,z,H.stone);crown(.95,.95,4.55,H.stone,x,z)}arch(0,0,2.02,3.2,3.35);const sh=new T.Shape();sh.moveTo(-1.7,3.7);sh.lineTo(1.7,3.7);sh.lineTo(1.7,2);sh.lineTo(1.6,2);sh.quadraticCurveTo(1,2.85,0,3.35);sh.quadraticCurveTo(-1,2.85,-1.6,2);sh.lineTo(-1.7,2);sh.closePath();for(const z of[-2,1.65]){const geo=new T.ExtrudeGeometry(sh,{depth:.35,bevelEnabled:false});geo.translate(0,0,z);staticMesh(geo,H.stone);}}else{for(const x of[-3.8,-1.7,1.7,3.8])for(const z of[-1.8,1.8])cylinder(.2,4.8,x,2.4,z,H.wood);beam([-3.8,4.15,2],[3.8,4.15,2],.35)}gateMechanism();}
 else if(k==='tower'){shell(4.6,4.6,11,H.stone,1.5);
 // Roof opening over the final quarter-turn, with four supported roof strips.
 for(const [x,z,w,d]of[[-1.15,0,2.3,4.6],[1.15,-1.15,2.3,2.3],[2.15,1.15,.3,2.3],[1.0,2.15,2,.3]]){box(w,.18,d,x,10.91,z,H.stone);g.walkAreas.push([x,z,w/2,d/2,11])}crown(4.6,4.6,11);
 cylinder(.22,11,0,5.5,0,H.stone);g.colliders.push([0,0,.22,.22,11,0]);g.walkWedges=[];
 for(let n=0;n<60;n++){const a=Math.PI/2+n*Math.PI/15,b=a+Math.PI/15+.008,y=(n+1)*11/60,sh=new T.Shape();sh.moveTo(.3*Math.cos(a),.3*Math.sin(a));sh.lineTo(1.85*Math.cos(a),1.85*Math.sin(a));sh.lineTo(1.85*Math.cos(b),1.85*Math.sin(b));sh.lineTo(.3*Math.cos(b),.3*Math.sin(b));sh.closePath();const geo=new T.ExtrudeGeometry(sh,{depth:.15,bevelEnabled:false});geo.rotateX(Math.PI/2);geo.translate(0,y,0);staticMesh(geo,H.stone);g.walkWedges.push({a:a%(Math.PI*2),span:Math.PI/15+.008,inner:.3,outer:1.85,y});if(n%3===0){const x=1.8*Math.cos(b),z=1.8*Math.sin(b);beam([x,y,z],[x,y+.9,z],.055,H.iron)}}
 for(const y of[3.5,6.5,9]){
  // Schießscharten auf allen vier Seiten
  window(0,y,2.32,0,.35,1.2,true);           // vorne
  window(0,y,-2.32,Math.PI,.35,1.2,true);     // hinten
  window(2.32,y,0,Math.PI/2,.35,1.2,true);    // rechts
  window(-2.32,y,0,-Math.PI/2,.35,1.2,true);  // links
 }}
 else if(k==='armory'){shell(6,5,4,H.stone,1.9);roof(6,5,4,1.8,H.slate,0,0,H.stone);for(const x of[-2.7,2.7])box(.45,4.3,.45,x,2.15,2.2,H.stone);for(const x of[-2,0,2]){box(1.3,1.6,.3,x,.8,-1.8,H.wood,true);for(let n=0;n<3;n++){const sw=weapon('sword');sw.position.set(x-.4+n*.4,1.1,-1.55);sw.rotation.z=Math.PI;g.add(sw)}}}
 else if(k==='chapel'){shell(6,8,3.6,H.stone,1.7);roof(6,8,3.6,2.3,H.shingle,0,0,H.stone);for(const side of[-1,1])for(const z of[-2,1])gothic(side*3.02,z,side*Math.PI/2,1.6,.8,1.7);box(.14,1,.14,0,6.4,3.4,H.stone);box(.65,.14,.14,0,6.55,3.4,H.stone);furniture();
  {const pl=new T.Mesh(new T.PlaneGeometry(1.5,2.1),fresco(1));pl.position.set(0,2.5,-3.64);g.add(pl);for(const a of[-1,1]){const p2=new T.Mesh(new T.PlaneGeometry(.9,1.4),fresco(a>0?2:5));p2.position.set(a*2.64,2.2,-.5);p2.rotation.y=-a*Math.PI/2;g.add(p2)}
   for(const x of[-.55,.55]){cylinder(.04,.28,x,1.14,-3.2,H.plaster,8);const f=new T.Mesh(new T.ConeGeometry(.028,.08,6),new T.MeshBasicMaterial({color:0xffc860}));f.position.set(x,1.32,-3.2);g.add(f)}}{const CI=globalThis.BFRules.interior(k),wm=COLM.get('water')||(COLM.set('water',new T.MeshStandardMaterial({color:0x3a6a8a,roughness:.1,metalness:.3})),COLM.get('water'));for(const z of CI.pews)for(const sx of[-1,1]){box(CI.bw,.45,.42,sx*CI.bx,.23,z,H.wood,true);box(CI.bw,.5,.08,sx*CI.bx,.75,z+.22,H.wood)}cylinder(.42,.75,CI.font[0],.38,CI.font[1],H.stone,10);cylinder(.35,.05,CI.font[0],.77,CI.font[1],wm,10)}}
 else if(k==='church'){shell(8,12,5.5,H.stone,2.4,true);roof(8,11.6,5.5,3.3,H.slate,0,-.2,H.stone);{const sh=new T.Shape();sh.moveTo(-4,0);sh.lineTo(4,0);sh.lineTo(0,3.3);sh.closePath();const q=new T.ExtrudeGeometry(sh,{depth:.35,bevelEnabled:false});q.translate(0,5.5,5.65);staticMesh(q,H.stone)}for(const a of[-1,1])for(const z of[-3.5,-.8,3.3]){if(a===1&&z>1)continue;gothic(a*4.02,z,a*Math.PI/2,2.1,1.05,2.7);box(.65,4.7,.55,a*4.15,2.35,z-1,H.stone)}box(2.8,8.85,2.8,0,4.425,5.4,H.stone,true);for(const y of[2.6,5.4])for(const a of[-1,1])window(a*1.42,y,5.4,a*Math.PI/2,.3,.9,true);g.bellTowerWalls=4;for(let face=0;face<4;face++){const angle=face*Math.PI/2,x=Math.sin(angle)*1.4,z=5.4+Math.cos(angle)*1.4,sh=new T.Shape();sh.moveTo(-1.4,0);sh.lineTo(1.4,0);sh.lineTo(1.4,2.5);sh.lineTo(-1.4,2.5);sh.closePath();const hole=new T.Path();hole.moveTo(-.55,.35);hole.lineTo(-.55,1.42);hole.quadraticCurveTo(-.44,1.74,0,2);hole.quadraticCurveTo(.44,1.74,.55,1.42);hole.lineTo(.55,.35);hole.closePath();sh.holes.push(hole);const geo=new T.ExtrudeGeometry(sh,{depth:.35,bevelEnabled:false});geo.translate(0,8.85,-.35);geo.rotateY(angle);geo.translate(x,0,z);staticMesh(geo,H.stone);gothic(x+Math.sin(angle)*.02,z+Math.cos(angle)*.02,angle,9.2,1.1,1.65);}box(2.8,.2,2.8,0,11.45,5.4,H.stone);crown(2.8,2.8,11.55,H.stone,0,5.4);bell(0,11.1,5.4);furniture();
  // Wandmalereien im Inneren, Altarbild, Kerzen
  for(const a of[-1,1])for(const [z,n]of[[-5.05,0],[-2.15,1],[1.25,2]]){const pl=new T.Mesh(new T.PlaneGeometry(1.25,1.9),fresco(n+(a>0?3:0)));pl.position.set(a*3.64,3.3,z);pl.rotation.y=-a*Math.PI/2;g.add(pl)}
  {const pl=new T.Mesh(new T.PlaneGeometry(2.4,3.2),fresco(4));pl.position.set(0,3.7,-5.62);g.add(pl);box(2.6,.12,.12,0,5.36,-5.6,H.brass);box(2.6,.12,.12,0,2.04,-5.6,H.brass)}
  for(const x of[-.8,.8]){cylinder(.045,.32,x,1.16,-5,H.plaster,8);const f=new T.Mesh(new T.ConeGeometry(.03,.09,6),new T.MeshBasicMaterial({color:0xffc860}));f.position.set(x,1.37,-5);g.add(f)}
  box(2.3,.5,.04,0,.72,-4.53,COLM.get('altarRed')||(COLM.set('altarRed',new T.MeshStandardMaterial({color:0x8a1e22,roughness:.9})),COLM.get('altarRed')));{const CI=globalThis.BFRules.interior(k),wm=COLM.get('water')||(COLM.set('water',new T.MeshStandardMaterial({color:0x3a6a8a,roughness:.1,metalness:.3})),COLM.get('water'));for(const z of CI.pews)for(const sx of[-1,1]){box(CI.bw,.45,.42,sx*CI.bx,.23,z,H.wood,true);box(CI.bw,.5,.08,sx*CI.bx,.75,z+.22,H.wood)}cylinder(.42,.75,CI.font[0],.38,CI.font[1],H.stone,10);cylinder(.35,.05,CI.font[0],.77,CI.font[1],wm,10)}}
 else if(k==='cathedral'){
  // ===== Dom: dreischiffige Basilika mit Querhaus (Kreuzform), Chor mit Apsis, Doppelturmfassade, Strebewerk und Ecktürmchen =====
  const st=H.stone,t=.35,FR=12.5,RM=H.slate,gold=H.brass;
  const wallZ=(x0,x1,z,y0,y1,solid=true)=>box(x1-x0,y1-y0,t,(x0+x1)/2,(y0+y1)/2,z,st,solid);
  const wallX=(z0,z1,x,y0,y1,solid=true)=>box(t,y1-y0,z1-z0,x,(y0+y1)/2,(z0+z1)/2,st,solid);
  const cone=(r,h,x,y,z,m=RM,seg=8)=>{const q=new T.ConeGeometry(r,h,seg);q.rotateY(Math.PI/seg);q.translate(x,y,z);staticMesh(q,m)};
  const crossT=(x,y,z,s2=1)=>{box(.14*s2,1.2*s2,.14*s2,x,y,z,gold);box(.66*s2,.14*s2,.14*s2,x,y+.2*s2,z,gold)};
  const turret=(x,z,h)=>{cylinder(.55,h,x,h/2,z,st,8);for(let y=3;y<h-1;y+=3.2)box(.12,.9,.12,x+.5,y,z,H.dark);cone(.72,2.8,x,h+1.4,z);staticMesh((()=>{const q=new T.SphereGeometry(.13,8,6);q.translate(x,h+2.9,z);return q})(),gold)};
  const gable=(x0,x1,z,y,rise)=>{const sh=new T.Shape();sh.moveTo(x0,0);sh.lineTo(x1,0);sh.lineTo((x0+x1)/2,rise);sh.closePath();const q=new T.ExtrudeGeometry(sh,{depth:t,bevelEnabled:false});q.translate(0,y,z-t/2);staticMesh(q,st)};
  const groofX=(x0,x1,z0,z1,y,rise,m)=>{const cz=(z0+z1)/2,D=(z1-z0)/2+.4,P=[],U=[];for(const sd of[-1,1])for(const[px,py,pz]of[[x0,rise,0],[x0,0,sd*D],[x1,0,sd*D],[x0,rise,0],[x1,0,sd*D],[x1,rise,0]]){P.push(px,py+y,cz+pz);U.push(px/2,(py?0:Math.hypot(D,rise))/2)}const q=new T.BufferGeometry();q.setAttribute('position',new T.Float32BufferAttribute(P,3));q.setAttribute('uv',new T.Float32BufferAttribute(U,2));q.computeVertexNormals();const mm=m.clone();mm.side=T.DoubleSide;staticMesh(q,mm)};
  // Boden
  box(12,.1,12.5,0,.03,2.75,H.floor);box(16,.1,4,0,.03,-5.5,H.floor);box(6,.1,2,0,.03,-8.5,H.floor);{const q=new T.CircleGeometry(2.9,12,0,Math.PI);q.rotateX(-Math.PI/2);q.translate(0,.08,-9.5);staticMesh(q,H.floor)}
  // Seitenschiffe (außen 6,5 m hoch) mit Maßwerkfenstern je Joch
  for(const a of[-1,1]){wallX(-3.5,9,a*(6-t/2),0,6.5);for(let zb=-2.25;zb<9;zb+=2.5)gothic(a*6.02,zb,a*Math.PI/2,1.6,1.2,3.6);
   // Pultdach der Seitenschiffe
   const run=3.4,riseA=2.6,len=Math.hypot(run,riseA);box(len,.16,13.3,a*4.55,6.5+riseA/2+.05,2.75,RM,false,-a*Math.atan2(riseA,run));box(3.1,.15,12.5,a*4.5,6.45,2.75,H.floor);
   // Strebepfeiler mit Fialen und Strebebögen
   for(let zb=-3.5;zb<=9.01;zb+=2.5){box(.7,7.4,.8,a*6.5,3.7,zb,st,true);cone(.42,1.8,a*6.5,8.3,zb,st,4);beam([a*6.5,7.1,zb],[a*3.35,10.6,zb],.32,st);beam([a*6.5,6.2,zb],[a*4.6,7.4,zb],.22,st)}}
  // Mittelschiff: Arkaden unten, Obergaden mit Fenstern
  for(const a of[-1,1]){const sh=new T.Shape(),L0=-3.5,L1=9;sh.moveTo(L0,0);sh.lineTo(L1,0);sh.lineTo(L1,6.5);sh.lineTo(L0,6.5);sh.closePath();
   for(let zb=-2.25;zb<9;zb+=2.5){const hw=.92,h0=4.1,ap=5.7,ho=new T.Path();ho.moveTo(zb-hw,0);ho.lineTo(zb+hw,0);ho.lineTo(zb+hw,h0);ho.quadraticCurveTo(zb+hw*.75,ap-.35,zb,ap);ho.quadraticCurveTo(zb-hw*.75,ap-.35,zb-hw,h0);ho.closePath();sh.holes.push(ho)}
   const q=new T.ExtrudeGeometry(sh,{depth:.45,bevelEnabled:false});q.rotateY(-Math.PI/2);q.translate(a*3+.225,0,0);staticMesh(q,st);
   for(let zb=-3.5;zb<=9.01;zb+=2.5){cylinder(.36,6.5,a*3,3.25,zb,st,12);g.colliders.push([a*3,zb,.38,.38,6.5,0]);cylinder(.08,5.4,a*2.72,9.2,zb,st,6)}   // Pfeiler + Dienste
   wallX(-3.5,9,a*3,6.5,12,false);for(let zb=-2.25;zb<9;zb+=2.5)gothic(a*(3+t/2+.03),zb,a*Math.PI/2,9.1,1.1,2.5)}
  box(6,.2,12.5,0,12,2.75,H.floor);
  // Kreuzrippengewölbe im Mittelschiff – mit verputzten Gewölbekappen zwischen den Rippen (Kreuzgratgewölbe: max zweier Tonnen)
  const vaultM=COLM.get('vault')||(COLM.set('vault',(()=>{const m=(H.plaster||st).clone();m.side=T.DoubleSide;return m})()),COLM.get('vault'));
  const webs=(x0,hw,zc,hz)=>{const N=22,P=[],U=[],I=[];for(let j=0;j<=N;j++)for(let i=0;i<=N;i++){const u=i/N*2-1,v=j/N*2-1,y=9.6+2.18*Math.max(Math.sqrt(Math.max(0,1-u*u)),Math.sqrt(Math.max(0,1-v*v)));P.push(x0+u*hw,y,zc+v*hz);U.push(u*hw/2,v*hz/2)}
   for(let j=0;j<N;j++)for(let i=0;i<N;i++){const a=j*(N+1)+i,b=a+1,c=a+N+1,d=c+1;I.push(a,c,b,b,c,d)}const q=new T.BufferGeometry();q.setAttribute('position',new T.Float32BufferAttribute(P,3));q.setAttribute('uv',new T.Float32BufferAttribute(U,2));q.setIndex(I);q.computeVertexNormals();staticMesh(q,vaultM)};
  for(let zb=-3.5;zb<9;zb+=2.5)webs(0,2.72,zb+1.25,1.25);webs(0,2.72,-5.5,2);
  const rib=(pts,r=.1)=>staticMesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(p=>new T.Vector3(...p))),20,r,6,false),st);
  for(let zb=-3.5;zb<9;zb+=2.5){const z1=zb+2.5,zm=zb+1.25;rib([[-2.72,9.6,zb],[0,11.75,zb],[2.72,9.6,zb]],.13);rib([[-2.72,9.6,zb],[-1.3,11.3,zb+.6],[0,11.85,zm],[1.3,11.3,z1-.6],[2.72,9.6,z1]]);rib([[2.72,9.6,zb],[1.3,11.3,zb+.6],[0,11.85,zm],[-1.3,11.3,z1-.6],[-2.72,9.6,z1]]);staticMesh((()=>{const q=new T.SphereGeometry(.2,10,8);q.translate(0,11.82,zm);return q})(),gold)}
  // Querhaus (16 m breit) mit Rosen-/Lanzettfenstern an den Stirnseiten
  for(const a of[-1,1]){wallX(-7.5,-3.5,a*(8-t/2),0,12);gothic(a*8.02,-5.5,a*Math.PI/2,2,1.8,6.5);wallZ(a>0?6:-8,a>0?8:-6,-3.5+t/2,0,12);wallZ(a>0?3:-6,a>0?6:-3,-3.5+t/2,6.5,12,false);wallZ(a>0?3:-8,a>0?8:-3,-7.5-t/2,0,12);
   {const sh=new T.Shape();sh.moveTo(-2.4,0);sh.lineTo(2.4,0);sh.lineTo(0,4.4);sh.closePath();const q=new T.ExtrudeGeometry(sh,{depth:t,bevelEnabled:false});q.rotateY(Math.PI/2);q.translate(a*(8-t/2)-t/2,12,-5.5);staticMesh(q,st)}
   gothic(a*5.4,-7.5-t-.02,Math.PI,2.2,1.2,4.2);turret(a*8.1,-3.4,13.5);turret(a*8.1,-7.6,13.5)}
  groofX(-8.4,8.4,-7.5,-3.5,12,4.4,RM);box(16,.2,4,0,12,-5.5,H.floor);
  // Vierungsgewölbe
  rib([[-2.72,9.6,-3.6],[0,11.85,-5.5],[2.72,9.6,-7.4]]);rib([[2.72,9.6,-3.6],[0,11.85,-5.5],[-2.72,9.6,-7.4]]);staticMesh((()=>{const q=new T.SphereGeometry(.3,12,8);q.translate(0,11.8,-5.5);return q})(),gold);
  // Chor mit polygonaler Apsis
  for(const a of[-1,1])wallX(-9.5,-7.5,a*(3-t/2),0,12);
  for(let q=0;q<4;q++){const a0=Math.PI+q*Math.PI/4,a1=a0+Math.PI/4,am=(a0+a1)/2,R0=2.9,x=Math.cos(am)*R0*Math.cos(Math.PI/8),z=-9.5+Math.sin(am)*R0*Math.cos(Math.PI/8),seg=2*R0*Math.sin(Math.PI/8)+.1;
   const geo=boxUV(new T.BoxGeometry(seg,12,t));geo.rotateY(-am+Math.PI/2);geo.translate(x,6,z);staticMesh(geo,st);g.colliders.push([x,z,seg*.36,seg*.36,12,0]);gothic(x*1.04,z+(z+9.5)*.04-.01,-am+Math.PI/2+Math.PI,3,.9,5.2)}
  roof(6,2.2,12,4.4,RM,0,-8.5,st);{const q=new T.ConeGeometry(3.4,4.4,8,1,true,Math.PI/2,Math.PI);q.translate(0,14.2,-9.5);const mm=RM.clone();mm.side=T.DoubleSide;staticMesh(q,mm)}
  // Langhausdach bis zur Fassade + Dachreiter über der Vierung
  roof(6,16,12,4.4,RM,0,1,st);
  {const ry=16.4;cylinder(.75,2.4,0,ry+1.2,-5.5,st,8);for(let q=0;q<8;q++){const a=q/8*Math.PI*2;box(.12,1.4,.12,Math.cos(a)*.78,ry+1.3,-5.5+Math.sin(a)*.78,H.dark)}cone(.95,5,0,ry+4.9,-5.5);crossT(0,ry+7.9,-5.5,.9)}
  // Doppelturmfassade
  for(const a of[-1,1]){const tx=a*4.75,tz=10.75;box(3.5,21,3.5,tx,10.5,tz,st,true);for(const y of[7,13,18.5])box(3.6,.3,3.6,tx,y,tz,st);
   for(const [fx,fz,ry]of[[0,1.78,0],[a*1.78,0,a*Math.PI/2],[0,-1.78,Math.PI]]){window(tx+fx,15.6,tz+fz,ry,.5,2.4,true);window(tx+fx,19.5,tz+fz,ry,.9,2.2,true)}
   for(const cx of[-1,1])for(const cz of[-1,1]){cylinder(.3,3.2,tx+cx*1.6,22.6,tz+cz*1.6,st,6);cone(.42,2.4,tx+cx*1.6,25.4,tz+cz*1.6,st,6)}       // Ecktürmchen der Türme
   crown(3.5,3.5,21,st,tx,tz);cone(1.9,10,tx,26,tz);staticMesh((()=>{const q=new T.SphereGeometry(.22,10,8);q.translate(tx,31.1,tz);return q})(),gold);crossT(tx,31.6,tz,1.3)}
  // Gefasste Heiligenfigur (bemalter Stein): gefaltetes Gewand, Mantel, Kopf mit Schleier/Haar, Hände mit Buch bzw. Schlüssel
  const cm=(k,c,o={})=>COLM.get(k)||(COLM.set(k,new T.MeshStandardMaterial({color:c,roughness:.85,...o})),COLM.get(k));
  const saint=(x,y0,z,v)=>{const robe=cm('sRobe'+v,v?0x7a2a24:0x2e3f6e),mant=cm('sMant'+v,v?0x2f4a32:0x8a2a22),skin=cm('sSkin',0xc9a081),hair=cm('sHair'+v,v?0x6a6056:0xe6e0d0),gd=cm('sGold',0xc9a84a,{metalness:.6,roughness:.4});
   const lathe=(pts,seg,ps,pl,mat,fold)=>{const q=new T.LatheGeometry(pts.map(([r,y])=>new T.Vector2(r,y)),seg,ps,pl),P=q.attributes.position;for(let i=0;i<P.count;i++){const px=P.getX(i),py=P.getY(i),pz=P.getZ(i),a=Math.atan2(px,pz),f=1+fold*Math.sin(a*9)*Math.max(0,1-py/1.35);P.setXYZ(i,px*f,py,pz*f)}q.computeVertexNormals();q.translate(x,y0,z);staticMesh(q,mat)};
   lathe([[0,0],[.29,0],[.3,.05],[.27,.35],[.23,.75],[.2,1.05],[.19,1.2],[.16,1.32],[.1,1.4],[.07,1.46],[0,1.47]],24,0,Math.PI*2,robe,.08);          // Gewand mit Falten
   lathe([[.31,.32],[.27,.7],[.24,1.0],[.22,1.18],[.19,1.33],[.12,1.42]],20,Math.PI*.55,Math.PI*.9,mant,.05);                                        // Mantel über dem Rücken
   {const q=new T.TorusGeometry(.3,.02,5,24);q.rotateX(Math.PI/2);q.translate(x,y0+.06,z);staticMesh(q,gd)}                                          // Goldsaum
   {const q=new T.SphereGeometry(.13,14,10);q.scale(.95,1.12,1);q.translate(x,y0+1.62,z+.02);staticMesh(q,skin)}                                       // Kopf
   {const q=new T.SphereGeometry(.145,14,10,Math.PI*.6,Math.PI*1.8,0,Math.PI*.62);q.scale(1,1.2,1);q.translate(x,y0+1.64,z);staticMesh(q,hair)}        // Schleier bzw. Haar
   if(v){const q=new T.SphereGeometry(.1,10,8,0,Math.PI*2,Math.PI*.45,Math.PI*.4);q.translate(x,y0+1.52,z+.06);staticMesh(q,hair)}                     // Bart
   for(const sd of[-1,1]){const q=new T.CylinderGeometry(.055,.06,.36,8);q.rotateX(Math.PI/2-.3);q.rotateY(sd*.35);q.translate(x+sd*.13,y0+1.05,z+.15);staticMesh(q,robe);const h=new T.SphereGeometry(.05,8,6);h.translate(x+sd*.07,y0+1.0,z+.3);staticMesh(h,skin)}
   if(v){const q=new T.BoxGeometry(.05,.28,.03);q.translate(x+.03,y0+1.08,z+.33);staticMesh(q,gd);const b=new T.TorusGeometry(.06,.015,5,12);b.translate(x+.03,y0+1.26,z+.33);staticMesh(b,gd)}   // Petrus: Schlüssel
   else{const q=new T.BoxGeometry(.2,.26,.06);q.rotateX(-.35);q.translate(x,y0+1.04,z+.32);staticMesh(q,cm('sBook',0x6a1e1a));const e=new T.BoxGeometry(.18,.24,.065);e.rotateX(-.35);e.translate(x,y0+1.04,z+.322);staticMesh(e,cm('sPage',0xe8e0c8))}};   // Maria/Heilige: Buch
  // Westwerk zwischen den Türmen: Portalwand mit Spitzbogenportal, Archivolten, Rosette, Wimperg
  {const outer=3.32,dh=4.6,sh=new T.Shape();sh.moveTo(-3,0);sh.lineTo(3,0);sh.lineTo(3,15);sh.lineTo(-3,15);sh.closePath();const ho=new T.Path();ho.moveTo(outer/2,0);for(let q=0;q<=32;q++){const xx=outer/2-outer*q/32;ho.lineTo(xx,.08+doorTop(xx,outer,dh+.08,true))}ho.lineTo(-outer/2,0);ho.closePath();sh.holes.push(ho);
   const rose=new T.Path();rose.absarc(0,10.2,1.75,0,Math.PI*2,true);sh.holes.push(rose);const q=new T.ExtrudeGeometry(sh,{depth:.5,bevelEnabled:false,curveSegments:24});q.translate(0,0,FR-.5);staticMesh(q,st);
   for(const zz of[FR-.48,FR+.02]){const c=new T.Mesh(new T.CircleGeometry(1.76,40),roseGlass());c.position.set(0,10.2,zz);g.add(c)}
   for(let r=0;r<3;r++){const q2=new T.TorusGeometry(1.85+r*.0,.16-r*.03,8,40);q2.translate(0,10.2,FR+.05+r*.02);staticMesh(q2,st)}for(let q2=0;q2<12;q2++){const a=q2/12*Math.PI*2;beam([Math.cos(a)*.45,10.2+Math.sin(a)*.45,FR+.06],[Math.cos(a)*1.7,10.2+Math.sin(a)*1.7,FR+.06],.06,st)}
   for(let r=0;r<3;r++)arch(0,0,FR+.12+r*.1,outer+.5+r*.5,dh+.55+r*.45);
   {const sh2=new T.Shape();sh2.moveTo(-2.6,0);sh2.lineTo(2.6,0);sh2.lineTo(0,2.6);sh2.closePath();const w2=new T.ExtrudeGeometry(sh2,{depth:.3,bevelEnabled:false});w2.translate(0,5.6,FR);staticMesh(w2,st);cone(.2,1,0,8.7,FR+.15,st,4)}   // Wimperg
   for(const x of[-2.35,2.35]){box(.8,.7,.6,x,.35,FR+.35,st,true);saint(x,.7,FR+.38,x<0?0:1);staticMesh((()=>{const q=new T.TorusGeometry(.2,.025,5,16);q.translate(x,2.42,FR+.22);return q})(),gold);box(.9,.12,.55,x,2.9,FR+.38,st)}
   gable(-3.4,3.4,FR-.2,15,3.4);crossT(0,18.9,FR-.2,1.2);
   addDoor(g,H,{x:0,z:FR-.25,y:.08,width:3,height:dh,gothic:true,style:'gothic',double:true});(g._doors=g._doors||[]).push({x:0,z:FR,w:3,h:dh})}
  // ===== Innenraum: Altar, Kruzifix, Retabel, Heiligenbilder, Kerzen, Kanzel, Bänke =====
  {const cloth=COLM.get('altarRed')||(COLM.set('altarRed',new T.MeshStandardMaterial({color:0x8a1e22,roughness:.9})),COLM.get('altarRed')),az=-8.6;
   box(3.4,.3,2.4,0,.15,az,st,true);box(2.6,1,1.1,0,.8,az,st,true);box(2.75,.08,1.25,0,1.33,az,H.plaster);box(2.8,.6,.04,0,1.05,az+.64,cloth);
   for(const x of[-1.05,-.55,.55,1.05]){cylinder(.045,.32,x,1.53,az+.1,H.plaster,8);const f=new T.Mesh(new T.ConeGeometry(.03,.09,6),new T.MeshBasicMaterial({color:0xffc860}));f.position.set(x,1.74,az+.1);g.add(f);cylinder(.08,.05,x,1.39,az+.1,gold,8)}
   box(.14,2.6,.14,0,2.7,az-.35,gold);box(1.3,.13,.13,0,3.4,az-.35,gold);staticMesh((()=>{const q=new T.TorusGeometry(.3,.03,6,20);q.translate(0,3.4,az-.32);return q})(),gold);       // Kruzifix
   // Retabel: Flügelaltar mit Heiligenbildern
   for(const [x,ry,n]of[[-1.15,.35,1],[0,0,0],[1.15,-.35,2]]){const pl=new T.Mesh(new T.PlaneGeometry(1.1,1.65),fresco(n,true));pl.position.set(x,2.55,az-.95+Math.abs(x)*.25);pl.rotation.y=ry;g.add(pl);box(1.2,.1,.1,x,3.42,az-.98+Math.abs(x)*.25,gold)}
   // Heiligenbilder an Querhaus und Chor
   const pic=(x,y,z,ry,n,w2=1.4,h2=2.1)=>{const pl=new T.Mesh(new T.PlaneGeometry(w2,h2),fresco(n));pl.position.set(x,y,z);pl.rotation.y=ry;g.add(pl);for(const e of[-1,1])box(.08,h2+.16,.08,x+Math.cos(ry)*e*(w2/2+.04),y,z-Math.sin(ry)*e*(w2/2+.04),gold)};
   for(const a of[-1,1]){pic(a*7.62,8.6,-5.5,-a*Math.PI/2,a>0?3:4,1.8,2.7);pic(a*2.79,4,-8.5,-a*Math.PI/2,a>0?5:2);pic(a*4.6,3.2,-7.29,0,a>0?1:0);pic(a*5.62,3.4,-3.5+.01+1.25,-a*Math.PI/2,a>0?2:5,1.1,1.6)}
   // Kanzel am Vierungspfeiler
   cylinder(.55,1,2.2,2.2,-3.1,H.wood,8);cylinder(.2,1.7,2.2,.85,-3.1,H.wood,8);box(.6,.1,.6,2.2,3.7,-3.1,H.wood);beam([2.2,3.7,-3.1],[2.2,2.7,-2.8],.05);
   // Bankreihen mit Mittelgang
   for(let z=-1.6;z<8.3;z+=1.15)for(const x of[-1.55,1.55]){box(2.2,.45,.42,x,.23,z,H.wood,true);box(2.2,.5,.08,x,.75,z+.22,H.wood)}
   // Taufbecken
   cylinder(.5,.8,-4.5,.4,7.5,st,10);cylinder(.42,.05,-4.5,.82,7.5,COLM.get('water')||(COLM.set('water',new T.MeshStandardMaterial({color:0x3a6a8a,roughness:.1,metalness:.3})),COLM.get('water')),10)}
  g.walkAreas.push([0,0,8,12.5,.08]);
 }
 else if(['cow','sheep','pigsty'].includes(k)){addDoor(g,H,{x:0,z:3,width:1.7,height:1.05,style:'gate'});for(const a of[-1,1])for(const y of[.5,.95]){if(a<0)box(7,.1,.12,0,y,a*3,H.wood,true);else for(const x of[-2.2,2.2])box(2.6,.1,.12,x,y,3,H.wood,true);box(.12,.1,6,a*3.5,y,0,H.wood,true)}for(const x of[-3.5,0,3.5])for(const z of[-3,3])if(x!==0||z<0)box(.13,1.25,.13,x,.625,z,H.wood,true);// Unterstand: vier Eckpfosten, Kopfbänder, Rückwand aus Brettern, Reetdach
  const sx=2.2,z0=-2.85,z1=-.55;for(const x of[-sx,sx])for(const z of[z0,z1])box(.2,2.45,.2,x,1.225,z,H.wood,true);
  for(const z of[z0,z1])box(sx*2+.3,.18,.2,0,2.4,z,H.wood);for(const x of[-sx,sx])box(.2,.18,z1-z0+.3,x,2.4,(z0+z1)/2,H.wood);
  for(const x of[-sx,sx])for(const z of[z0,z1])beam([x,1.85,z],[x+(x<0?.45:-.45),2.35,z],.07);
  for(let i=0;i<9;i++)box(.48,2.2,.05,-sx+.24+i*(sx*2/9),1.1,z0-.06,H.wood);roof(sx*2+.6,z1-z0+.9,2.5,1.3,H.thatch,0,(z0+z1)/2);
  for(let i=0;i<14;i++){const geo=new T.CylinderGeometry(.025,.025,.5,4);geo.rotateZ(Math.PI/2);geo.rotateY(i*1.3);geo.translate(-1.6+(i%7)*.55,.03,-2.4+Math.floor(i/7)*1.2);staticMesh(geo,H.thatch)}   // Streu
  // Futterkrippe auf Böcken; Füllung (g.feedMesh) zeigt den Füllstand
  {const tz=.15,tw=2.6;for(const x of[-tw/2+.1,tw/2-.1])for(const dz of[-.18,.18])beam([x,0,tz+dz*1.6],[x,.55,tz+dz*.6],.05);box(tw,.06,.5,0,.48,tz,H.wood);for(const dz of[-.25,.25])box(tw,.3,.05,0,.62,tz+dz,H.wood);for(const dx of[-tw/2,tw/2])box(.05,.3,.5,dx,.62,tz,H.wood);
   const feed=new T.Mesh(new T.BoxGeometry(tw-.1,.24,.42),H.thatch);feed.position.set(0,.51+.12,tz);feed.userData.base=.51;feed.scale.y=1;feed.receiveShadow=true;g.add(feed);g.feedMesh=feed}
  g.animals=[];const N=k==='cow'?4:6,SPOT=[[-2.3,1.3],[-.8,2.1],[.8,1.3],[2.3,2.1],[-1.6,2.5],[1.6,.95]];for(let n=0;n<N;n++){const a=quad(k==='pigsty'?'pig':k==='sheep'?'sheep':'cow');a.position.set(SPOT[n][0],0,SPOT[n][1]);a.rotation.y=(n*1.7)%6.28;a.visible=n<3;g.add(a);g.animals.push(a)}}
 else if(k==='cemetery'){
  // Friedhof: niedrige Bruchsteinmauer, Kiesweg, Hochkreuz, alter Baum, Bank; Gräber mit Grabsteinen (rund, Kreuz, Holzkreuz, Stele), teils schief und bemoost
  const W=10,D=8,t=.35,mh=.75,gravel=COLM.get('gravel')||(COLM.set('gravel',new T.MeshStandardMaterial({color:0xa49a86,roughness:1})),COLM.get('gravel')),earth=COLM.get('graveEarth')||(COLM.set('graveEarth',new T.MeshStandardMaterial({color:0x4a3a28,roughness:1})),COLM.get('graveEarth')),
   moss=COLM.get('mossStone')||(()=>{const m=H.stone.clone();m.color.set(0x8a9a78);m.onBeforeCompile=H.stone.onBeforeCompile;m.customProgramCacheKey=H.stone.customProgramCacheKey;COLM.set('mossStone',m);return m})(),dark=COLM.get('darkStone')||(()=>{const m=H.stone.clone();m.color.set(0x8a8478);m.onBeforeCompile=H.stone.onBeforeCompile;m.customProgramCacheKey=H.stone.customProgramCacheKey;COLM.set('darkStone',m);return m})();
  box(W,mh,t,0,mh/2,-D/2+t/2,H.stone,true);for(const a of[-1,1]){box(t,mh,D,a*(W/2-t/2),mh/2,0,H.stone,true);const L=W/2-.9;box(L,mh,t,a*(.9+L/2),mh/2,D/2-t/2,H.stone,true);box(.5,1.3,.5,a*.95,.65,D/2-t/2,H.stone,true);cylinder(.2,.25,a*.95,1.42,D/2-t/2,H.stone,8)}
  for(let q=0;q<26;q++){const a=q/26,x=-W/2+t/2+a*(W-t);box(.36,.1,.42,x,mh+.05,-D/2+t/2,H.stone)}
  addDoor(g,H,{x:0,z:D/2-t/2,width:1.5,height:1.05,style:'gate',double:true});
  box(1.2,.04,D-.6,0,.03,0,gravel);box(W-1,.03,.9,0,.025,-D/2+1.2,gravel);
  // Hochkreuz am Wegende
  box(1,.4,1,0,.2,-D/2+1.1,H.stone,true);box(.7,.3,.7,0,.55,-D/2+1.1,H.stone);box(.18,2.4,.18,0,1.85,-D/2+1.1,H.stone);box(1,.18,.18,0,2.5,-D/2+1.1,H.stone);
  {const tr=forestTree(H.wood);tr.scale.setScalar(.55);tr.position.set(W/2-1.3,0,-D/2+1.3);g.add(tr)}box(1.4,.08,.4,-W/2+1.4,.45,-D/2+1.2,H.wood);for(const e of[-.55,.55])box(.08,.42,.35,-W/2+1.4+e,.22,-D/2+1.2,H.wood);
  g.crosses=new T.Group();let sd=1234567;const rr=()=>(sd=(sd*16807)%2147483647)/2147483647;const slots=[];
  for(let row=0;row<5;row++)for(const sx of[-1,1])for(let c=0;c<4;c++)slots.push([sx*(1.35+c*.95),-2.1+row*1.25]);
  slots.sort((a,b)=>(a[1]-b[1])||(Math.abs(a[0])-Math.abs(b[0])));
  for(const[x,z]of slots){const gr=new T.Group();gr.position.set(x,0,z);const add2=(geo,m,px,py,pz,rx=0,rz=0)=>{const o=new T.Mesh(geo,m);o.position.set(px,py,pz);o.rotation.set(rx,0,rz);o.castShadow=o.receiveShadow=true;gr.add(o);return o};
   add2(new T.BoxGeometry(.55,.14,1),earth,0,.07,.15);const sm=rr()<.35?moss:rr()<.5?dark:H.stone,tl=rr()<.3?(rr()-.5)*.45:(rr()-.5)*.08,tx=rr()<.25?(rr()-.5)*.35:0,ty=rr(),kind=(rr()*4)|0,hz=-.38;
   const st=new T.Group();st.position.set(0,0,hz);st.scale.setScalar(1.3);st.rotation.set(tx,(rr()-.5)*.15,tl);gr.add(st);const put=(geo,m,px,py,pz,rx=0)=>{const o=new T.Mesh(geo,m);o.position.set(px,py,pz);o.rotation.x=rx;o.castShadow=true;st.add(o)};
   if(kind===0){const hh=.45+ty*.25;put(new T.BoxGeometry(.44,hh,.1),sm,0,hh/2,0);put(new T.CylinderGeometry(.22,.22,.1,14,1,false,Math.PI/2,Math.PI),sm,0,hh,0,Math.PI/2)}
   else if(kind===1){put(new T.BoxGeometry(.12,.85,.12),sm,0,.42,0);put(new T.BoxGeometry(.46,.12,.12),sm,0,.62,0);put(new T.BoxGeometry(.3,.12,.26),sm,0,.06,0)}
   else if(kind===2){put(new T.BoxGeometry(.07,.9,.07),H.wood,0,.45,0);put(new T.BoxGeometry(.42,.07,.07),H.wood,0,.66,0)}
   else{const hh=.7+ty*.35;put(new T.BoxGeometry(.32,hh,.14),sm,0,hh/2,0);put(new T.ConeGeometry(.23,.22,4),sm,0,hh+.1,0)}
   if(rr()<.4){const f=new T.Mesh(new T.SphereGeometry(.07,6,4),COLM.get('fl'+((rr()*4)|0))||H.green);f.position.set((rr()-.5)*.3,.18,.2);gr.add(f)}
   gr.visible=false;g.crosses.add(gr)}
  g.add(g.crosses);g.setGraves=m=>g.crosses.children.forEach((c,q)=>c.visible=q<m);
 }
 else if(k==='orchard'||k==='hopfield'){let sd=(V+1)*48271+(k==='orchard'?7:11);const rr=()=>(sd=(sd*16807)%2147483647)/2147483647;
  const mat=(key,c)=>{if(!COLM.has(key))COLM.set(key,new T.MeshStandardMaterial({color:c,roughness:.9}));return COLM.get(key)};
  const blob=(r,x,y,z,m,j=.18)=>{const geo=new T.IcosahedronGeometry(r,1),P=geo.attributes.position;for(let i=0;i<P.count;i++){const f=1+(rr()-.5)*j*2;P.setXYZ(i,P.getX(i)*f,P.getY(i)*f*.85,P.getZ(i)*f)}geo.computeVertexNormals();geo.translate(x,y,z);staticMesh(geo,m)};
  const sph=(r,x,y,z,m)=>{const geo=new T.SphereGeometry(r,7,5);geo.translate(x,y,z);staticMesh(geo,m)};
  if(k==='orchard'){const L1=mat('leafA',0x3f6a2e),L2=mat('leafB',0x56802f),RED=mat('apple',0xb8332a),YEL=mat('appleY',0xc8a03a),GR=mat('orchGrass',0x5a7a38),BK=mat('bark',0x4a3626);
   {const geo=new T.PlaneGeometry(7.6,7.6);geo.rotateX(-Math.PI/2);geo.translate(0,.025,0);staticMesh(geo,GR)}
   // kein Zaun: Plantagen lassen sich lückenlos aneinanderreihen
   // Obstbäume mit Ästen, unregelmäßigen Kronen, Früchten
   const TREES=[[-2.3,-2],[0,-2.4],[2.3,-2],[-2.3,1],[0,.7],[2.3,1]];
   // echte Bäume (wie im Wald), kleiner geschnitten, mit Früchten in der Krone und Fallobst
   TREES.forEach(([x,z],ti)=>{const tr=forestTree(H.wood);tr.scale.setScalar(.36+rr()*.06);tr.position.set(x,0,z);tr.rotation.y=rr()*6.28;g.add(tr);
    for(let q=0;q<14;q++){const a=rr()*6.28,R=.5+rr()*1.1;sph(.07,x+Math.cos(a)*R,1.7+rr()*1.2,z+Math.sin(a)*R,ti%3===1?YEL:RED)}
    for(let q=0;q<3;q++)sph(.06,x+(rr()-.5)*1.6,.06,z+(rr()-.5)*1.6,RED)});
   // Leiter am Baum und Erntekorb
   const [lx,lz]=TREES[4];beam([lx-.55,0,lz+.55],[lx-.18,1.9,lz+.18],.03,H.wood);beam([lx-.35,0,lz+.75],[lx+.02,1.9,lz+.38],.03,H.wood);for(let q=1;q<7;q++){const t=q/7;beam([lx-.55+.37*t,1.9*t,lz+.55-.37*t],[lx-.35+.37*t,1.9*t,lz+.75-.37*t],.018,H.wood)}
   {const geo=new T.CylinderGeometry(.25,.2,.28,12,1,true);geo.translate(lx+.6,.14,lz+.7);staticMesh(geo,H.thatch)}for(let q=0;q<6;q++)sph(.07,lx+.5+(q%3)*.09,.28,lz+.65+Math.floor(q/3)*.1,RED)}
  else{const POLE=mat('hopPole',0x6a5238),WIRE=mat('wire',0x2a2a2a),BINE=mat('bine',0x3d6a2a),LEAF=mat('hopLeaf',0x2f5a24),CONE=mat('hopCone',0x9ac860),SOIL=mat('hopSoil',0x5a4030);
   const P3=[-1.6,0,1.6];for(const x of P3)for(const z of P3)cylinder(.07,4.3,x,2.15,z,POLE,7);
   for(const q of P3){beam([-1.6,4.2,q],[1.6,4.2,q],.012,WIRE);beam([q,4.2,-1.6],[q,4.2,1.6],.012,WIRE)}
   for(const x of P3)for(const s2 of[-1,1])beam([x,4.25,s2*1.6],[x,0,s2*2.05],.01,WIRE);   // Abspannung
   // Pflanzen zwischen den Stangen: Hügel, Steigschnur, Ranke als Spirale, Blätter, Dolden
   for(const x of[-.8,.8])for(const z of[-1.6,-.55,.55,1.6]){const geo=new T.SphereGeometry(.28,8,5,0,6.283,0,1.4);geo.scale(1,.35,1);geo.translate(x,0,z);staticMesh(geo,SOIL);
    const tx=x+(rr()-.5)*.4,tz=z>0?z-.3:z+.3;beam([x,.05,z],[tx,4.2,tz],.006,WIRE);const pts=[],H2=3.4+rr()*.6;
    for(let q=0;q<=40;q++){const t=q/40,y=.05+t*H2,cx=x+(tx-x)*(y/4.2),cz=z+(tz-z)*(y/4.2),a=t*Math.PI*11+rr()*.2;pts.push(new T.Vector3(cx+Math.cos(a)*.045,y,cz+Math.sin(a)*.045))}
    staticMesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),60,.016,4,false),BINE);
    for(let q=2;q<38;q+=3){const p=pts[q],a=q*2.4,geo=new T.SphereGeometry(.11,6,4);geo.scale(1,.25,.8);geo.rotateY(a);geo.translate(p.x+Math.cos(a)*.1,p.y,p.z+Math.sin(a)*.1);staticMesh(geo,LEAF)}
    for(let q=24;q<40;q+=2){const p=pts[q],a=q*1.9,geo=new T.ConeGeometry(.04,.09,6);geo.rotateX(Math.PI);geo.translate(p.x+Math.cos(a)*.08,p.y-.05,p.z+Math.sin(a)*.08);staticMesh(geo,CONE)}}}
 }
 else if(k==='farm'){shell(8,6,3.2,H.plaster,2.4);framing(8,6,3.2);roof(8,6,3.2,2.6,H.thatch);window(-2.3,1.7,3.03);table(1.8,0);chimney(-2,-1.5,3.7);shell(4,5,3,H.wood,2,false,-6,-.5);roof(4,5,3,1.8,H.shingle,-6,-.5);for(const z of[-2,-1])barrel(-6,z);for(const y of[.45,.9]){box(18,.1,.12,0,y,-6,H.wood);for(const x of[-9,9])box(.12,.1,14,x,y,1,H.wood);for(const x of[-5.1,5.1])box(7.8,.1,.12,x,y,8,H.wood)}for(let x=-9;x<=9;x+=1.5)for(const z of[-6,8])if(z<0||Math.abs(x)>1.2)box(.12,1.15,.12,x,.575,z,H.wood);for(let z=-4.5;z<8;z+=1.5)for(const x of[-9,9])box(.12,1.15,.12,x,.575,z,H.wood);for(const x of[5,7])for(let z=-2;z<2;z+=.5){const geo=new T.IcosahedronGeometry(.23,0);geo.translate(x,.3,z);staticMesh(geo,H.green)}for(let x=-7;x<-1;x+=.55)for(let z=4;z<7;z+=.5)cylinder(.04,.75,x,.375,z,H.thatch,5);box(.12,2.2,.12,-4,1.1,5.5,H.wood);box(1.7,.12,.12,-4,1.6,5.5,H.wood);box(.55,.7,.35,-4,1.4,5.5,H.thatch);const head=new T.SphereGeometry(.23,8,6);head.translate(-4,2,5.5);staticMesh(head,H.thatch);}
 else if(k==='palisade'){for(let i=0;i<10;i++){const x=-1.8+i*.4;cylinder(.235,2.8,x,1.4,0,H.wood,8);const geo=new T.ConeGeometry(.235,.55,8);geo.translate(x,3.075,0);staticMesh(geo,H.wood)}for(const y of[.65,2.15])box(4,.2,.16,0,y,-.25,H.wood);g.colliders.push([0,0,2,.3,3.35,0]);}
 else if(k==='mill'){shell(4,4,4.3,H.plaster,1.7);framing(4,4,4.3);roof(4,4,4.3,2,H.shingle);g.blades=new T.Group();g.blades.position.set(0,4,2.55);for(let n=0;n<4;n++){const arm=new T.Group();arm.rotation.z=n*Math.PI/2;const mast=new T.Mesh(new T.BoxGeometry(.14,3.2,.16),H.wood);mast.position.y=1.5;const sail=new T.Mesh(new T.BoxGeometry(.7,2.5,.06),H.plaster);sail.position.set(.35,1.7,0);arm.add(mast,sail);g.blades.add(arm)}g.add(g.blades);cylinder(.75,.3,1,.3,-1,H.stone);}
 else if(k==='well'){const geo=new T.CylinderGeometry(.9,.9,1.1,20,1,true);geo.translate(0,.55,0);const mat=H.stone.clone();mat.side=T.DoubleSide;staticMesh(geo,mat);for(const x of[-.85,.85])box(.15,2.6,.15,x,1.3,0,H.wood);roof(2,2,2.6,.9,H.shingle);beam([0,2.5,0],[0,.5,0],.035,H.iron);
  // Wasser mit optischer Tiefe: innere Säule + dunkler Grund + Oberfläche
  const wMat=new T.MeshStandardMaterial({color:0x1a4a6a,roughness:.05,metalness:.25,transparent:true,opacity:.72,side:T.DoubleSide,depthWrite:false});
  const deep=new T.Mesh(new T.CylinderGeometry(.72,.65,1.35,20,1,true),wMat);deep.position.set(0,.15,0);deep.renderOrder=2;g.add(deep);
  const bottom=new T.Mesh(new T.CircleGeometry(.65,20),new T.MeshStandardMaterial({color:0x0a2030,roughness:.9}));bottom.rotation.x=-Math.PI/2;bottom.position.y=-.52;g.add(bottom);
  const surface=new T.Mesh(new T.CircleGeometry(.74,20),new T.MeshStandardMaterial({color:0x3a8ab0,roughness:.05,metalness:.35,transparent:true,opacity:.55,depthWrite:false}));surface.rotation.x=-Math.PI/2;surface.position.y=.82;surface.renderOrder=3;g.add(surface);}
 else if(k==='watchpost'){
  // Vier Eckpfosten
  for(const x of[-1.35,1.35])for(const z of[-1.35,1.35]){box(.28,6.2,.28,x,3.1,z,H.wood,true)}
  // Komplett mit Holz verplankt (kein offenes Gerüst)
  for(const [w,d,x,z] of [[3.1,.12,0,-1.5],[3.1,.12,0,1.5],[.12,3.1,-1.5,0],[.12,3.1,1.5,0]]){
    // untere Verplankung bis Plattform
    box(w,5.8,d===3.1?3.1:d,x,2.9,z,H.wood,true);
  }
  // Schießscharten / Sehschlitze in den Wänden
  for(const y of[1.8,3.6,5.0]){
    for(const [x,z,ry] of [[0,-1.52,0],[0,1.52,Math.PI],[1.52,0,Math.PI/2],[-1.52,0,-Math.PI/2]]){
      window(x,y,z,ry,.45,.55);
    }
  }
  // Plattform + Zinnen + Dach
  box(3.2,.18,3.2,0,6.0,0,H.floor);
  crown(3.2,3.2,6.1,H.wood);
  roof(3.2,3.2,7.3,1.25,H.shingle);
  // Innere Holztreppe (Steig)
  for(let n=0;n<10;n++){
    const y=.35+n*.58, z=-.9+n*.18;
    box(1.1,.12,.55,0,y,z,H.wood);
    if(n%2===0) box(.08,.55,.08,-.55,y+.25,z,H.wood);
  }
  // Geländer am Steig
  box(.08,5.5,.08,-.6,2.9,-.2,H.wood);box(.08,5.5,.08,.6,2.9,-.2,H.wood);
  g.walkAreas.push([0,0,1.4,1.4,6.1]);
  g.colliders.push([0,0,1.55,1.55,6.0,0]);
}
 else if(k==='apiary'){for(const x of[-1,1])for(const z of[-1,1]){box(1,.1,1,x,.65,z,H.wood);for(const xx of[-.38,.38])for(const zz of[-.35,.35])box(.09,.65,.09,x+xx,.325,z+zz,H.wood);const pts=[[.46,0],[.46,.3],[.42,.65],[.32,1],[.18,1.25],[.04,1.4]].map(p=>new T.Vector2(...p)),geo=new T.LatheGeometry(pts,16);geo.translate(x,.72,z);staticMesh(geo,H.thatch);for(let n=0;n<10;n++){const y=n*.12,radius=.46*(1-Math.pow(y/1.42,2))+.012,ring=new T.TorusGeometry(radius,.027,5,20);ring.rotateX(Math.PI/2);ring.translate(x,.74+y,z);staticMesh(ring,H.thatch)}box(.15,.18,.045,x,.81,z+.47,H.dark)}}
 else if(k==='harbor'){
  // Modernerer Hafen: steinerne Kaimauer, Holzsteg, Kräne, Fässer, Taue
  box(8.5,.35,6.5,0,.12,0,H.stone); // Kai-Plattform
  box(8.8,.5,.4,0,.25,-3.15,H.stone);box(8.8,.5,.4,0,.25,3.15,H.stone); // Kanten
  for(const x of[-3.8,-1.3,1.3,3.8])for(const z of[-2.9,2.9])cylinder(.18,1.5,x,.75,z,H.wood);
  // Ladekran
  // Warenhaus-Dach am Kai
  box(3.2,2.4,2.6,2.6,1.2,1.2,H.wood);roof(3.4,2.8,2.4,1.3,H.shingle,2.6,1.2);
  for(const x of[1.8,3.4])barrel(x,-1.8);barrel(2.6,-.6);barrel(.4,-1.9);
  // Poller
  for(const x of[-3.5,0,3.5]){cylinder(.12,.45,x,.35,-2.7,H.iron);cylinder(.12,.45,x,.35,2.7,H.iron)}
  // Seile (dünne Balken)
  beam([-3.5,.5,-2.7],[-3.0,1.2,-.2],.03,H.iron);beam([3.5,.5,2.7],[2.6,1.0,1.2],.03,H.iron);
  awning(2.2,2.2,2.4,2.2,1.1,H.shingle);
}
 for(const f of g._frames||[])framingNow(...f);g._frames=[];
 // Varianten-Details: kleine Unterschiede an jedem Gebäude (Fässer, Bretter, Schornstein-Rauchfang)
 if(!['wall','battle','palisade','moat','bridge','field','hopfield','stairs','bed','fire','bench','well','apiary','gate','portcullis','tower','watchpost','keep','harbor','chapel','church','cathedral','orchard','cemetery'].includes(k)){
  const C=g.colliders[0],bw=(C?C[2]*2:4),bd=(C?C[3]*2:4);
  if(V===1){const lean=new T.Mesh(boxUV(new T.BoxGeometry(.12,1.4,.8)),H.wood);lean.position.set(bw*.45,.7,bd*.45);lean.rotation.z=.15;g.add(lean)}
  if(V===2){const crate=new T.Mesh(boxUV(new T.BoxGeometry(.55,.4,.45)),H.wood);crate.position.set(-bw*.4,.2,bd*.42);g.add(crate)}
  if(V===3){const post=new T.Mesh(new T.CylinderGeometry(.06,.07,1.6,8),H.wood);post.position.set(bw*.48,.8,-bd*.35);g.add(post);const flag=new T.Mesh(new T.BoxGeometry(.02,.35,.5),H.thatch||H.plaster);flag.position.set(bw*.48,1.5,-bd*.35+.2);g.add(flag)}
 }

 // ===== Hafen-Ausbau: Tretradkran, Poller mit Tauen, Laufplanke, Laternen =====
 if(k==='harbor'){const st=H.stone,wd=H.wood,glowM=COLM.get('glow')||(COLM.set('glow',new T.MeshStandardMaterial({color:0xffd27a,emissive:0xffb040,emissiveIntensity:.9})),COLM.get('glow')),rope=COLM.get('rope')||(COLM.set('rope',new T.MeshStandardMaterial({color:0xb09a6a,roughness:1})),COLM.get('rope'));
  for(const z of[-3.0,3.0])for(let x=-3.5;x<=3.6;x+=1.75){cylinder(.16,.55,x,.6,z,st,10);cylinder(.2,.08,x,.9,z,st,10);staticMesh((()=>{const q=new T.TorusGeometry(.3,.05,5,14);q.rotateX(Math.PI/2);q.translate(x+.45,.4,z*.93);return q})(),rope)}
  // Tretradkran: beide Radkränze auf einer gemeinsamen Achse (x), Böcke außen, Mast mit Ausleger zum Wasser
  const wx=-2.7,wz=.1;for(const dx of[-.62,.62]){beam([wx+dx,.3,wz-.95],[wx+dx,1.55,wz],.09);beam([wx+dx,.3,wz+.95],[wx+dx,1.55,wz],.09);box(.14,.14,2,wx+dx,.32,wz,wd)}
  beam([wx-.75,1.5,wz],[wx+.75,1.5,wz],.1);
  for(const dx of[-.32,.32]){staticMesh((()=>{const q=new T.TorusGeometry(1.15,.07,6,24);q.rotateY(Math.PI/2);q.translate(wx+dx,1.5,wz);return q})(),wd);for(let q=0;q<8;q++){const a=q/8*Math.PI*2;beam([wx+dx,1.5,wz],[wx+dx,1.5+Math.sin(a)*1.12,wz+Math.cos(a)*1.12],.04)}}
  for(let q=0;q<16;q++){const a=q/16*Math.PI*2;box(.72,.05,.12,wx,1.5+Math.sin(a)*1.12,wz+Math.cos(a)*1.12,wd)}
  box(.22,3.2,.22,wx-.95,1.6,wz,wd,true);beam([wx-.95,3.0,wz],[wx-.95,4.6,wz+3.4],.11);beam([wx-.95,1.6,wz+.3],[wx-.95,2.6,wz+1.4],.07);beam([wx-.95,4.6,wz+3.4],[wx-.95,2.1,wz+3.4],.012,rope);box(.12,.3,.12,wx-.95,2.0,wz+3.4,H.iron);beam([wx,1.5,wz],[wx-.95,3.0,wz],.012,rope);g.colliders.push([wx,wz,.85,1,2.7,0]);
  {const geo=new T.BoxGeometry(.9,.06,2.4);geo.rotateX(-.28);geo.translate(-1.2,.55,3.9);staticMesh(geo,wd)}
  }
 // ===== Lebendige Details: Zunftschild, Laterne und Gewerbe-typische Gegenstände (Rückwand/linke Seite, Türen bleiben frei) =====
 if(!['palisade','well','watchpost','gate','portcullis','tower','harbor','orchard','apiary','hopfield','cemetery'].includes(k)){
  let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;for(const c of g.colliders){x0=Math.min(x0,c[0]-c[2]);x1=Math.max(x1,c[0]+c[2]);z0=Math.min(z0,c[1]-c[3]);z1=Math.max(z1,c[1]+c[3])}
  if(!g.colliders.length){x0=z0=-2;x1=z1=2}const bw=Math.min(14,Math.max(Math.abs(x0),Math.abs(x1))*2),bd=Math.min(14,Math.max(Math.abs(z0),Math.abs(z1))*2),R=(()=>{let a=(V+1)*9301+k.length*49297;return()=>((a=(a*1103515245+12345)&0x7fffffff)/0x7fffffff)})();
  const col=c=>{if(!COLM.has(c))COLM.set(c,new T.MeshStandardMaterial({color:c,roughness:.85}));return COLM.get(c)},glow=COLM.get('glow')||(COLM.set('glow',new T.MeshStandardMaterial({color:0xffd27a,emissive:0xffb040,emissiveIntensity:.9})),COLM.get('glow'));
  const geo=(gm,x,y,z,mat,rx=0,ry=0,rz=0,sx=1,sy=1,sz=1)=>{gm.scale(sx,sy,sz);gm.rotateX(rx);gm.rotateY(ry);gm.rotateZ(rz);gm.translate(x,y,z);staticMesh(gm,mat)};
  const back=-bd/2-.5,left=-bw/2-.5,front=bd/2;
  const log=(x,y,z,len=1,r=.12,ry=0)=>geo(new T.CylinderGeometry(r,r,len,9),x,y,z,H.wood,0,ry,Math.PI/2);
  const woodpile=(x,z,n=3,len=1.1)=>{for(let row=0;row<n;row++)for(let i=0;i<4-row;i++)log(x,.12+row*.21,z+(i-(3-row)/2)*.24,len,.11,Math.PI/2);geo(new T.BoxGeometry(.06,.9,.06),x-len/2-.05,.45,z,H.wood);geo(new T.BoxGeometry(.06,.9,.06),x+len/2+.05,.45,z,H.wood)};
  const hay=(x,z,ry=0)=>geo(new T.CylinderGeometry(.42,.42,.9,14),x,.42,z,H.thatch,0,ry,Math.PI/2);
  const cart=(x,z,ry=0)=>{const cg2=new T.Group();box(1.6,.12,1,x,.62,z,H.wood);for(const s of[-1,1])box(1.6,.32,.06,x,.84,z+s*.48,H.wood);for(const s of[-1,1])geo(new T.TorusGeometry(.36,.05,6,14),x,.38,z+s*.56,H.wood);beam([x+.8,.62,z],[x+1.9,.5,z],.08)};
  // Zunftschild am Ausleger über/neben der Tür
  const EMB={smithy:'anvil',armorer:'helmet',bower:'bow',bakery:'pretzel',tavern:'mug',brewery:'barrel',weaver:'spool',apothecary:'mortar',butcher:'cleaver',tannery:'hide',smokehouse:'fish',dairy:'cheese',lumber:'axe',mill:'sack',granary:'sack',storage:'sack',market:'coin',lodge:'antler',fishery:'fish',quarry:'pick',ironmine:'pick',coppermine:'pick'}[k];
  const SOLID=['house','bighouse','apothecary','bakery','smithy','armorer','armory','bower','weaver','tavern','butcher','dairy','brewery','tannery','smokehouse','granary','storage','keep','garrison','lodge','mill'].includes(k);
  if(EMB&&SOLID){const sx=bw/2-.12,sz=front+.06,sy=2.45;beam([sx,sy+.45,sz],[sx,sy+.45,sz+.75],.05,H.iron);beam([sx,sy+.2,sz],[sx,sy+.45,sz+.4],.04,H.iron);
   box(.06,.5,.62,sx,sy,sz+.45,H.wood);for(const dz of[.2,.7])beam([sx,sy+.25,sz+dz],[sx,sy+.45,sz+dz],.015,H.iron);
   for(const sd of[1,-1]){const ex=sx+sd*.045,ez=sz+.45,ey=sy,met=H.iron,gold=H.brass||met;   // Symbol auf beiden Seiten der Tafel
   if(EMB==='anvil'){box(.04,.1,.32,ex,ey-.05,ez,met);box(.04,.08,.14,ex,ey+.04,ez-.04,met);box(.04,.05,.1,ex,ey+.1,ez+.07,met)}
   if(EMB==='helmet')geo(new T.SphereGeometry(.13,12,8,0,Math.PI*2,0,Math.PI/2),ex,ey-.06,ez,met,0,0,Math.PI/2,.3,1,1);
   if(EMB==='bow')geo(new T.TorusGeometry(.18,.015,5,16,Math.PI),ex,ey-.05,ez,H.wood,0,Math.PI/2,Math.PI/2);
   if(EMB==='pretzel')geo(new T.TorusGeometry(.12,.035,6,16),ex,ey,ez,col(0x9a5a22),0,Math.PI/2,0,1,1,1);
   if(EMB==='mug'){geo(new T.CylinderGeometry(.09,.08,.2,10),ex,ey-.02,ez,col(0x8a6a3a));geo(new T.TorusGeometry(.06,.015,5,10),ex,ey,ez+.11,col(0x8a6a3a),0,Math.PI/2,0)}
   if(EMB==='barrel'||EMB==='cheese')geo(new T.CylinderGeometry(EMB==='cheese'?.14:.1,EMB==='cheese'?.14:.1,EMB==='cheese'?.06:.2,12),ex,ey-.03,ez,EMB==='cheese'?col(0xe0c050):H.wood,0,0,Math.PI/2);
   if(EMB==='spool'){geo(new T.CylinderGeometry(.08,.08,.18,10),ex,ey,ez,col(0xb83a2a));for(const d of[-.1,.1])geo(new T.CylinderGeometry(.11,.11,.02,10),ex,ey+d,ez,H.wood)}
   if(EMB==='mortar'){geo(new T.CylinderGeometry(.11,.07,.14,10),ex,ey-.06,ez,col(0x8a8478));beam([ex,ey,ez-.04],[ex,ey+.16,ez+.06],.025,H.wood)}
   if(EMB==='cleaver'||EMB==='axe'||EMB==='pick'){beam([ex,ey-.18,ez-.12],[ex,ey+.16,ez+.08],.03,H.wood);box(.03,EMB==='pick'?.05:.13,EMB==='pick'?.3:.12,ex,ey+.12,ez+.06,met)}
   if(EMB==='hide')geo(new T.CircleGeometry(.2,7),ex+sd*.005,ey,ez,col(0x8a6a48),0,sd*Math.PI/2,0,1,1.2,1);
   if(EMB==='fish')geo(new T.SphereGeometry(.1,10,6),ex,ey,ez,col(0x8a9aa8),0,0,0,.3,.55,1.6);
   if(EMB==='sack')geo(new T.SphereGeometry(.13,10,8),ex,ey-.03,ez,col(0xd8cfb8),0,0,0,.4,1.2,.9);
   if(EMB==='coin')geo(new T.CylinderGeometry(.12,.12,.02,14),ex,ey,ez,gold,0,0,Math.PI/2);
   if(EMB==='antler')for(const d of[-1,1])beam([ex,ey-.1,ez],[ex,ey+.15,ez+d*.14],.02,col(0xd8c8a8))}}
  // Laterne an der Front (leuchtet)
  // Gewerbe-typische Gegenstände
  const T2={
   smithy:()=>{box(.25,.35,.55,left,.47,-.4,H.iron);box(.5,.28,.22,left,.18,-.4,H.wood);geo(new T.CylinderGeometry(.35,.32,.5,14),left,.25,.6,H.wood);geo(new T.CylinderGeometry(.33,.33,.02,14),left,.47,.6,col(0x2a3a44));geo(new T.ConeGeometry(.45,.35,9),left+.1,.17,-1.4,col(0x1a1816))},
   armorer:()=>{for(const z of[-.8,.6]){beam([left,0,z],[left,1.35,z],.06);geo(new T.SphereGeometry(.17,10,8,0,Math.PI*2,0,Math.PI/2),left,1.4,z,H.iron);box(.42,.5,.24,left,1.05,z,H.iron)}},
   bower:()=>{for(let i=0;i<5;i++)beam([left,.05,-1+i*.25],[left+.1,1.6,-1+i*.25+.05],.03,H.wood);crate(left,1.1)},
   bakery:()=>{for(let i=0;i<4;i++)sack(left+(i%2)*.4-.2,-.9+Math.floor(i/2)*.5,.32+(i>1?0:0));woodpile(-bw/4,back,3,1.6)},
   tavern:()=>{for(const x of[-bw/4,bw/4]){box(1.2,.08,.6,x,.78,back-.4,H.wood);box(.08,.74,.5,x-.5,.37,back-.4,H.wood);box(.08,.74,.5,x+.5,.37,back-.4,H.wood);box(1.2,.06,.25,x,.45,back-.95,H.wood);box(1.2,.06,.25,x,.45,back+.15,H.wood)}barrel(left,-.5);barrel(left,.3);barrel(left,-.1,.82)},
   brewery:()=>{for(let i=0;i<3;i++)barrel(left,-.9+i*.75);barrel(left,-.5,.82);sack(-bw/4,back,.32,0x8a9a5a)},
   weaver:()=>{const lx=left,lz=-.2;for(const z of[-.6,.6])beam([lx,0,lz+z],[lx,1.5,lz+z],.07);beam([lx,1.5,lz-.6],[lx,1.5,lz+.6],.06);beam([lx,.8,lz-.6],[lx,.8,lz+.6],.05);box(.02,.65,1.1,lx,1.15,lz,col(0x9a3a2a));
    for(let i=0;i<3;i++)geo(new T.SphereGeometry(.26,10,8),-bw/4+i*.55,.26,back,col(0xe8e2d6),0,0,0,1,.85,1)},
   apothecary:()=>{beam([left,0,-.8],[left,1.6,-.8],.05);beam([left,0,.8],[left,1.6,.8],.05);beam([left,1.55,-.8],[left,1.55,.8],.04);
    for(let i=0;i<6;i++){geo(new T.ConeGeometry(.07,.32,6),left,1.35,-.65+i*.26,col([0x5a7a3a,0x7a8a4a,0x8a6a9a][i%3]),Math.PI)}for(let i=0;i<3;i++)geo(new T.CylinderGeometry(.13,.1,.28,10),-bw/4+i*.35,.14,back,col(0x8a5a3a))},
   butcher:()=>{beam([left,1.7,-.7],[left,1.7,.7],.05);for(const z of[-.5,0,.5]){beam([left,1.7,z],[left,1.45,z],.01,H.iron);geo(new T.SphereGeometry(.13,8,6),left,1.25,z,col(0x8a3a32),0,0,0,.7,1.4,.7)}box(.6,.5,.6,left+.1,.25,1.1,H.wood)},
   tannery:()=>{for(const z of[-.8,.5]){beam([left,0,z-.45],[left,1.6,z-.45],.05);beam([left,0,z+.45],[left,1.6,z+.45],.05);beam([left,1.55,z-.45],[left,1.55,z+.45],.04);geo(new T.PlaneGeometry(.8,1.1),left+.01,1.0,z,col(0x8a6a48),0,Math.PI/2)}geo(new T.CylinderGeometry(.45,.45,.45,14),-bw/4,.22,back-.2,H.wood)},
   smokehouse:()=>{woodpile(left,0,3,1.4);beam([-bw/4-.6,1.4,back],[-bw/4+.6,1.4,back],.03);for(let i=0;i<4;i++)geo(new T.SphereGeometry(.06,8,6),-bw/4-.45+i*.3,1.22,back,col(0x8a6a3a),0,0,0,.6,1.8,.4)},
   dairy:()=>{for(let i=0;i<3;i++)geo(new T.CylinderGeometry(.13,.15,.42,10),left,.21,-.6+i*.35,col(0x9aa0a4));for(let i=0;i<2;i++)geo(new T.CylinderGeometry(.18,.18,.1,12),-bw/4+i*.45,.05,back,col(0xe0c050))},
   lumber:()=>{woodpile(left,0,4,2.2);geo(new T.CylinderGeometry(.3,.34,.5,12),-bw/4,.25,back-.3,H.wood);beam([-bw/4,.48,back-.3],[-bw/4+.25,1.0,back-.15],.04);box(.03,.12,.16,-bw/4+.25,1.0,back-.08,H.iron)},
   lodge:()=>{beam([left,0,-.6],[left,1.7,-.6],.06);beam([left,0,.6],[left,1.7,.6],.06);beam([left,1.65,-.6],[left,1.65,.6],.05);geo(new T.PlaneGeometry(.9,.7),left+.02,1.1,0,col(0x7a5a3a),0,Math.PI/2);woodpile(-bw/4,back,3,1.2)},
   farm:()=>{hay(left,-1.2);hay(left,0);hay(left+.2,-.6,.4);cart(-bw/4-.8,back-.6)},
   cow:()=>{hay(left,-1.3);hay(left,-.3)},sheep:()=>{hay(left,-1.3)},pigsty:()=>{geo(new T.BoxGeometry(1.2,.25,.4),left,.13,0,H.wood)},
   granary:()=>{for(let i=0;i<5;i++)sack(left+(i%2)*.35,-1+i*.4);cart(-bw/4-.8,back-.6)},storage:()=>{crate(left,-.6);crate(left,.2);crate(left,-.2,.75);barrel(-bw/4,back)},
   market:()=>{crate(left,-.4);sack(left,.4);barrel(left+.1,1.1)},mill:()=>{for(let i=0;i<4;i++)sack(left,-.8+i*.42)},
   quarry:()=>{for(let i=0;i<6;i++)box(.5,.35,.4,left+(i%2)*.55,.18+Math.floor(i/4)*.35,-.6+(i%3)*.45,H.stone)},
   ironmine:()=>{for(let i=0;i<5;i++)geo(new T.DodecahedronGeometry(.22),left+(i%2)*.3,.15,-.6+i*.3,col(0x5a4a42))},coppermine:()=>{for(let i=0;i<5;i++)geo(new T.DodecahedronGeometry(.22),left+(i%2)*.3,.15,-.6+i*.3,col(0x7a5a3a))},
   fishery:()=>{beam([left,0,-.7],[left,1.5,-.7],.05);beam([left,0,.7],[left,1.5,.7],.05);beam([left,1.45,-.7],[left,1.45,.7],.04);geo(new T.PlaneGeometry(1.3,1.1),left+.02,.9,0,col(0x9a8a6a),0,Math.PI/2);barrel(-bw/4,back)},
   house:()=>{if(V%2===0)woodpile(left,0,3,1.4);else{beam([-bw/4-1,0,back],[-bw/4-1,1.8,back],.06);beam([bw/4+1,0,back],[bw/4+1,1.8,back],.06);beam([-bw/4-1,1.75,back],[bw/4+1,1.75,back],.012,H.iron);
    for(let i=0;i<4;i++)geo(new T.PlaneGeometry(.5,.6),-bw/4-.5+i*.75,1.42,back,col([0xe8e2d0,0x7a3a2a,0x3a4a6a,0xd8cfb8][(i+V)%4]))}},
   bighouse:()=>T2.house(),keep:()=>{woodpile(left,1.5,3,1.6);barrel(left,-1)},garrison:()=>{for(let i=0;i<4;i++)beam([left,0,-.9+i*.3],[left+.15,1.8,-.9+i*.3],.03,H.wood);box(.3,1,1.2,left,.5,.6,H.wood)},
   chapel:()=>T2.church(),
   church:()=>{const x0=-bw/2-3.6,x1=-bw/2-.35,z0=-bd/2+.6,z1=bd/2-.6;for(const[xa,za,xb,zb]of[[x0,z0,x1,z0],[x0,z1,x1,z1],[x0,z0,x0,z1]]){const L=Math.hypot(xb-xa,zb-za);geo(new T.BoxGeometry(xa===xb?.3:L,.55,xa===xb?L:.3),(xa+xb)/2,.27,(za+zb)/2,H.stone)}
    for(let row=0;row<Math.floor((z1-z0-.8)/1.3);row++)for(let c=0;c<2;c++){const x=x0+.9+c*1.4,z=z0+1+row*1.3;if(R()<.55){const tl=R()<.35?(R()-.5)*.5:(R()-.5)*.1,tz2=(R()-.5)*.25;geo(new T.BoxGeometry(.42,.6,.1),x,.3,z,H.stone,tz2,0,tl);geo(new T.CylinderGeometry(.21,.21,.1,12,1,false,Math.PI/2,Math.PI),x-Math.sin(tl)*.3,.6*Math.cos(tl),z,H.stone,Math.PI/2+tz2,0,tl)}
     else{beam([x,0,z],[x,.85,z],.035,H.wood);beam([x-.22,.62,z],[x+.22,.62,z],.03,H.wood)}geo(new T.BoxGeometry(.5,.08,1),x,.04,z+.55,COLM.get('grave')||(COLM.set('grave',new T.MeshStandardMaterial({color:0x3a4a2a,roughness:1})),COLM.get('grave')))}
    // Friedhofsbaum: echter Baum wie im Wald, darunter eine Bank
    {const tx=x0+1.1,tz=z1-1.1,tr=forestTree(H.wood);tr.scale.setScalar(.6);tr.position.set(tx,0,tz);g.add(tr);box(1.4,.08,.4,tx+1.4,.45,tz,H.wood);for(const e of[-.55,.55])box(.08,.42,.35,tx+1.4+e,.22,tz,H.wood)}},
   cathedral:()=>T2.church()};
  // ===== Kirchliche Atmosphäre: Rosette, Turmhelm, Giebelkreuze, Dachreiter, Portallichter, Heiligenfiguren =====
  if(k==='chapel'||k==='church'||k==='cathedral'){const cross=(x,y,z,s2=1,m=H.stone)=>{box(.14*s2,1.1*s2,.14*s2,x,y,z,m);box(.62*s2,.14*s2,.14*s2,x,y+.18*s2,z,m)};
   const plight=()=>{};   // keine Deko-Lampen außen
   if(k==='chapel'){for(const x of[-.55,.55])box(.14,1.1,.14,x,6.35,-3.6,H.wood);box(1.3,.14,.6,0,6.95,-3.6,H.shingle);
    geo(new T.CylinderGeometry(.14,.26,.36,10,1,true),0,6.25,-3.6,H.brass);cross(0,-0+7.45,-3.6,.8,H.wood);for(const x of[-1.25,1.25])plight(x,2.3,4.0)}
   if(k==='church'){// Turmhelm sitzt innerhalb der Zinnen (Turm 2,8 m breit), nicht darüber hinaus
    geo(new T.ConeGeometry(1.15,5.6,8),0,14.35,5.4,H.slate,0,Math.PI/8);for(const cx of[-1,1])for(const cz of[-1,1])geo(new T.ConeGeometry(.16,.9,6),cx*1.18,12.75,5.4+cz*1.18,H.slate)
    cross(0,17.45,5.4,1.2,H.brass);geo(new T.SphereGeometry(.16,10,8),0,17.1,5.4,H.brass);cross(0,9.4,-6.05,1);for(const x of[-1.05,1.05])plight(x,2.5,5.95)}
  }
  const snap=new Map([...batches].map(([m,l])=>[m,l.length]));(T2[k]||(()=>{if(R()<.5)woodpile(left,0,3,1.2)}))();
  // Bodengegenstände als eigene Gruppe: der Client blendet sie aus, wenn ein Nachbargebäude direkt angrenzt
  const pg=new T.Group();pg.name='props';for(const[m,l]of batches){const n0=snap.get(m)||0;if(l.length>n0){const part=l.splice(n0);const mesh=new T.Mesh(mergeGeometries(part,false),m);pg.add(mesh);part.forEach(q=>q.dispose())}}g.add(pg);g.props=pg;
 }
 // Static parts merge by material. Detail-rich buildings stay cheap to draw.
 for(const [material,geos]of batches){if(!geos.length)continue;const geometry=mergeGeometries(geos,false),mesh=new T.Mesh(geometry,material);mesh.castShadow=true;mesh.receiveShadow=true;g.add(mesh);geos.forEach(geo=>geo.dispose())}
 g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});return g;
}

// Optional rooms remain part of the keep, including their collision geometry.
export function installKeepRooms(g,flags,H,makePrisoner){if(g.keepRooms){g.remove(g.keepRooms);g.keepRooms.traverse(o=>{o.geometry?.dispose()})}g.keepRooms=new T.Group();g.keepRooms.name='Bergfried-Erweiterungen';g.pris=[];g.setPrisoners=n=>{if(!(flags&1)||!makePrisoner)return;while(g.pris.length<Math.min(4,n)){const i=g.pris.length,p=makePrisoner(i);p.position.set(-3.85+(i%2)*.8,0,-1.6-Math.floor(i/2)*.8);g.keepRooms.add(p);g.pris.push(p)}g.pris.forEach((p,i)=>p.visible=i<n)};g.add(g.keepRooms);g.baseColliders=g.baseColliders||g.colliders.slice();g.colliders=g.baseColliders.slice();
 const box=(w,h,d,x,y,z,mat,solid=true)=>{const m=new T.Mesh(boxUV(new T.BoxGeometry(w,h,d)),mat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;g.keepRooms.add(m);if(solid)g.colliders.push([x,z,w/2,d/2,y+h/2,y-h/2]);return m};
 if(flags&1){for(let x=-4.2;x<=-2.4;x+=.22)box(.065,2.3,.065,x,1.15,-1,H.iron);box(.1,2.3,2,-2.4,1.15,-2,H.iron);box(1.6,.35,.65,-3.3,.175,-2.5,H.wood);box(1.5,.1,.6,-3.3,.4,-2.5,H.thatch);}
 if(flags&2){box(1.3,.12,2,3.1,.9,-1.7,H.wood);for(const x of[2.6,3.6])box(.12,.85,1.5,x,.425,-1.7,H.wood);for(const z of[-2.3,-1.1])box(1.4,.055,.12,3.1,1,-1.7+(z+1.7),H.iron,false);box(.16,2.4,.16,3.7,1.2,-3,H.wood);box(1.2,.14,.16,3.3,2.2,-3,H.wood);}
}
