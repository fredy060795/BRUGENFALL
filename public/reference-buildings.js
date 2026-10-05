import * as T from 'three';
import {addDoor,doorTop} from './doors.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Material tiles are copied into independent canvases: no atlas-neighbour bleeding.
const atlasCache=new Map();
function atlasTile(file,index,fallback){
 const c=document.createElement('canvas');c.width=c.height=2;const ctx=c.getContext('2d');ctx.fillStyle=fallback;ctx.fillRect(0,0,2,2);
 const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;texture.wrapS=texture.wrapT=T.MirroredRepeatWrapping;texture.anisotropy=8;
 let promise=atlasCache.get(file);if(!promise){promise=new Promise(resolve=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>resolve(null);image.src='/textures/stronghold/'+file;});atlasCache.set(file,promise)}
 promise.then(image=>{if(!image)return;const w=Math.floor(image.width/2),h=Math.floor(image.height/2);c.width=w;c.height=h;ctx.drawImage(image,(index%2)*w,Math.floor(index/2)*h,w,h,0,0,w,h);texture.needsUpdate=true;});return texture;
}
export function createMedievalMaterials(){
 const A='masonry-timber-plaster-thatch.png',B='roofs-and-floors.png',materials={};
 for(const [name,file,tile,color,bump]of[['stone',A,0,'#b6ab92',.055],['wood',A,1,'#544434',.035],['plaster',A,2,'#d8c8a0',.018],['thatch',A,3,'#a7955c',.045],['redRoof',B,0,'#9b4e34',.045],['slate',B,1,'#52606a',.035],['shingle',B,2,'#938068',.035],['floor',B,3,'#76644e',.025]]){
 const map=atlasTile(file,tile,color),height=map.clone();height.colorSpace=T.NoColorSpace;atlasCache.get(file).then(()=>{height.image=map.image;height.needsUpdate=true});materials[name]=new T.MeshStandardMaterial({map,bumpMap:height,bumpScale:bump,roughness:.91});materials[name].name=name;}
 materials.iron=new T.MeshStandardMaterial({color:0x333639,metalness:.65,roughness:.57});materials.green=new T.MeshStandardMaterial({color:0x344f38,roughness:.9});materials.dark=new T.MeshStandardMaterial({color:0x272522,roughness:1});materials.brass=new T.MeshStandardMaterial({color:0xb19650,metalness:.55,roughness:.4});return materials;
}
export function boxUV(geo,scale=2){const p=geo.attributes.position,n=geo.attributes.normal,uv=geo.attributes.uv;for(let i=0;i<p.count;i++){const x=Math.abs(n.getX(i)),y=Math.abs(n.getY(i));uv.setXY(i,(x>.5?p.getZ(i):p.getX(i))/scale,(y>.5?p.getZ(i):p.getY(i))/scale)}uv.needsUpdate=true;return geo}
let stainedMaterial;
function fineGlass(){if(stainedMaterial)return stainedMaterial;const canvas=document.createElement('canvas');canvas.width=960;canvas.height=2010;const ctx=canvas.getContext('2d'),sx=32,sy=30,palette=['#912d43','#bc974d','#386958','#3d6391','#78618e','#ab7c3f'];ctx.fillStyle='#29303a';ctx.fillRect(0,0,960,2010);for(let row=-1;row<135;row++)for(let col=-1;col<32;col++){const x=col*sx+(row%2?sx/2:0),y=row*sy/2;ctx.beginPath();ctx.moveTo(x,y-sy/2);ctx.lineTo(x+sx/2,y);ctx.lineTo(x,y+sy/2);ctx.lineTo(x-sx/2,y);ctx.closePath();ctx.fillStyle=palette[((row*7+col*11)%6+6)%6];ctx.fill();ctx.strokeStyle='#252a30';ctx.lineWidth=1.3;ctx.stroke();}const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;map.anisotropy=8;stainedMaterial=new T.MeshStandardMaterial({map,emissiveMap:map,emissive:0xffffff,emissiveIntensity:.28,roughness:.3,side:T.DoubleSide});stainedMaterial.name='fineStainedGlass';return stainedMaterial;}
const TYPES=new Set(['house','bighouse','apothecary','bakery','lumber','lodge','quarry','bower','armorer','armory','granary','market','storage','keep','garrison','gate','portcullis','tower','chapel','church','cathedral','cow','smithy','dairy','butcher','smokehouse','brewery','tannery','weaver','tavern','ironmine','coppermine','fishery','sheep','pigsty','mill','well','watchpost','palisade','apiary','harbor','orchard','farm']);
export const referenceTypes=[...TYPES];
export function buildReference(k,lv,{H,PT,MT,quad,weapon,v=0}){
 if(!TYPES.has(k))return null;
 const V=(v|0)&3; // 4 Varianten 0..3
 const g=new T.Group();g.name='ReferenceBuilding:'+k+':'+lv+':v'+V;g.colliders=[];g.walkAreas=[];g.referenceModel=true;g.terrainConform=['cow','sheep','pigsty','apiary','orchard','farm'].includes(k);
 const batches=new Map();
 function staticMesh(geo,mat){if(geo.index){const old=geo;geo=geo.toNonIndexed();old.dispose()}if(!batches.has(mat))batches.set(mat,[]);batches.get(mat).push(geo)}
 function box(w,h,d,x,y,z,mat=H.stone,solid=false,rot=0){const geo=boxUV(new T.BoxGeometry(w,h,d));if(rot)geo.rotateZ(rot);geo.translate(x,y,z);staticMesh(geo,mat);if(solid)g.colliders.push([x,z,w/2,d/2,y+h/2,y-h/2]);}
 function cylinder(r,h,x,y,z,mat=H.wood,segments=12){const geo=new T.CylinderGeometry(r,r*1.04,h,segments);geo.translate(x,y,z);staticMesh(geo,mat)}
 function beam(a,b,r=.13,mat=H.wood){const A=new T.Vector3(...a),B=new T.Vector3(...b),delta=B.clone().sub(A),geo=boxUV(new T.BoxGeometry(r,delta.length(),r));geo.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize()));geo.translate(...A.add(B).multiplyScalar(.5).toArray());staticMesh(geo,mat)}
 function shell(w,d,h,mat=H.stone,door=2,side=false,x=0,z=0,bottom=0){const t=.35;g.doorWidth=door;const gothic=bottom===0&&['chapel','church','cathedral'].includes(k),dh=gothic?(k==='chapel'?2.8:k==='church'?3.8:3.5):2.5;
 box(w,h,t,x,bottom+h/2,z-d/2+t/2,mat,true);box(t,h,d,x-w/2+t/2,bottom+h/2,z,mat,true);
 if(side){box(w,h,t,x,bottom+h/2,z+d/2-t/2,mat,true);const center=3.5,span=3+(gothic?.32:0);box(t,h,center-span/2+d/2,x+w/2-t/2,bottom+h/2,z+(-d/2+center-span/2)/2,mat,true);box(t,h,d/2-center-span/2,x+w/2-t/2,bottom+h/2,z+(d/2+center+span/2)/2,mat,true);if(!gothic)box(t,h-dh,span,x+w/2-t/2,bottom+(h+dh)/2,z+center,mat,false);}
 else{box(t,h,d,x+w/2-t/2,bottom+h/2,z,mat,true);const opening=door+(gothic?.32:0),wing=(w-opening)/2;for(const sign of[-1,1])box(wing,h,t,x+sign*(opening/2+wing/2),bottom+h/2,z+d/2-t/2,mat,true);if(h>dh&&!gothic)box(door,h-dh,t,x,bottom+(h+dh)/2,z+d/2-t/2,mat,false);}
 if(door>0&&bottom===0){const dw=side?3:door,dx=side?x+w/2:x,dz=side?z+3.5:z+d/2,angle=side?Math.PI/2:0;if(gothic){const sh=new T.Shape();const outer=dw+.32;sh.moveTo(-outer/2,h);sh.lineTo(outer/2,h);for(let i=0;i<=32;i++){const xx=outer/2-outer*i/32;sh.lineTo(xx,.08+doorTop(xx,outer,dh-.08+.16,true));}sh.closePath();const geo=new T.ExtrudeGeometry(sh,{depth:t,bevelEnabled:false});geo.translate(0,0,-t);geo.rotateY(angle);geo.translate(dx,0,dz);staticMesh(geo,mat);}
 const style=gothic?'gothic':['keep','garrison','armory','tower'].includes(k)?'fortified':['house','bighouse','farm'].includes(k)?'plain':'workshop';addDoor(g,H,{x:dx,z:gothic?dz:dz+.001,y:.08,width:gothic?dw:dw-.04,height:gothic?dh-.08:dh-.1,angle,gothic,style});}
 box(w,.1,d,x,bottom+.03,z,H.floor,false);
 }
 function roof(w,d,eave,rise,mat=H.shingle,x=0,z=0,gable=H.wood){const W=w/2+.4,D=d/2+.4;const positions=[],uv=[];
 for(const side of[-1,1])for(const [px,py,pz]of[[0,rise,-D],[side*W,0,-D],[side*W,0,D],[0,rise,-D],[side*W,0,D],[0,rise,D]]){positions.push(px+x,py+eave,pz+z);uv.push((pz+D)/2,(py===rise?0:Math.hypot(W,rise))/2)}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.computeVertexNormals();const roofMat=mat.clone();roofMat.side=T.DoubleSide;staticMesh(geo,roofMat);
 for(const sign of[-1,1]){const geom=new T.BufferGeometry();geom.setAttribute('position',new T.Float32BufferAttribute([-w/2+x,eave,z+sign*d/2,w/2+x,eave,z+sign*d/2,x,eave+rise,z+sign*d/2],3));geom.setAttribute('uv',new T.Float32BufferAttribute([0,0,w/2,0,w/4,rise/2],2));geom.computeVertexNormals();const gm=gable.clone();gm.side=T.DoubleSide;staticMesh(geom,gm);beam([-w/2+x,eave,z+sign*(d/2+.07)],[x,eave+rise,z+sign*(d/2+.07)],.18);beam([x,eave+rise,z+sign*(d/2+.07)],[w/2+x,eave,z+sign*(d/2+.07)],.18)}beam([x,eave+rise+.08,z-D],[x,eave+rise+.08,z+D],.2);
 }
 function framing(w,d,h,x=0,z=0,two=false){const opening=Math.max(1.2,(g.doorWidth||2.2)/2+.12),levels=two?[.25,h/2,h]:[.25,h];
 for(const y of levels)for(const sign of[-1,1]){if(sign===1&&y<2.6){const wing=w/2-opening;for(const a of[-1,1])box(wing,.2,.2,x+a*(opening+wing/2),y,z+d/2,H.wood)}else box(w+.15,.2,.2,x,y,z+sign*d/2,H.wood);box(.2,.2,d+.15,x+sign*w/2,y,z,H.wood)}
 for(const sign of[-1,1]){for(let q=-w/2;q<=w/2+.01;q+=w/4){if(sign===1&&Math.abs(q)<opening)continue;box(.18,h,.18,x+q,h/2,z+sign*d/2,H.wood);const end=q+(q>0?-1:1)*w/4;if(Math.abs(q)>w*.2&&(sign<0||Math.min(Math.abs(q),Math.abs(end))>opening))beam([x+q,.45,z+sign*(d/2+.02)],[x+end,h*.47,z+sign*(d/2+.02)],.15)}for(let q=-d/2;q<=d/2+.01;q+=d/3)box(.18,h,.18,x+sign*w/2,h/2,z+q,H.wood)}
 }
 function window(x,y,z,side=0,width=.85,height=1.1,stone=false){const group=new T.Group();group.position.set(x,y,z);group.rotation.y=side;const put=(w,h,d,mat,xx,yy,zz)=>{const mesh=new T.Mesh(boxUV(new T.BoxGeometry(w,h,d)),mat);mesh.position.set(xx,yy,zz);group.add(mesh)};put(width,height,.06,H.dark,0,0,0);for(const a of[-1,1])put(.1,height+.15,.12,stone?H.stone:H.wood,a*width/2,0,.04);for(const a of[-1,1])put(width+.15,.12,.14,stone?H.stone:H.wood,0,a*height/2,.04);put(.045,height,.13,H.wood,0,0,.09);put(width,.045,.13,H.wood,0,0,.09);if(!stone)for(const a of[-1,1])put(width*.4,height,.07,H.green,a*width*.8,0,0);g.add(group)}
 function chimney(x,z,y){box(.65,2.7,.7,x,y+1.35,z,H.stone);box(.8,.15,.85,x,y+2.7,z,H.stone);box(.45,.02,.5,x,y+2.79,z,H.dark)}
 function barrel(x,z,y=0){cylinder(.32,.72,x,y+.36,z,H.wood);for(const yy of[.15,.58]){const geo=new T.TorusGeometry(.327,.025,5,14);geo.rotateX(Math.PI/2);geo.translate(x,y+yy,z);staticMesh(geo,H.iron)}}
 function table(x,z){box(1.6,.12,.75,x,.86,z,H.wood);for(const xx of[-.65,.65])box(.12,.8,.55,x+xx,.4,z,H.wood,true)}
 function awning(w,d,y,x,z,mat=H.shingle){box(w,.13,d,x,y,z,mat);for(const a of[-1,1])box(.13,y,.13,x+a*(w/2-.1),y/2,z+d/2-.1,H.wood,true)}
 function crown(w,d,y,mat=H.stone,x=0,z=0){box(w,.4,.35,x,y+.2,z-d/2,mat);box(w,.4,.35,x,y+.2,z+d/2,mat);for(const a of[-1,1])box(.35,.4,d,x+a*w/2,y+.2,z,mat);const nw=Math.max(3,Math.round(w)),nd=Math.max(3,Math.round(d));for(let n=0;n<=nw;n++)for(const a of[-1,1])box(.52,.7,.5,x-w/2+n*w/nw,y+.75,z+a*d/2,mat);for(let n=1;n<nd;n++)for(const a of[-1,1])box(.5,.7,.52,x+a*w/2,y+.75,z-d/2+n*d/nd,mat)}
 function furniture(){for(const p of PT[k]||[])if(p[1]<1.9&&p[0]<=8&&p[2]<3&&p[4]<2&&p[6]!=='X')box(p[0],p[1],p[2],p[3],p[4],p[5],MT[p[6]]||H.wood,p[7]!==0)}
 function arch(x,y,z,width,height,side=0){const pts=[[-width/2,0],[-width/2,height*.6],[-width*.3,height*.87],[0,height],[width*.3,height*.87],[width/2,height*.6],[width/2,0]];const group=new T.Group();group.position.set(x,y,z);group.rotation.y=side;const curve=new T.CatmullRomCurve3(pts.map(p=>new T.Vector3(p[0],p[1],0)),false,'centripetal'),mesh=new T.Mesh(new T.TubeGeometry(curve,32,.11,6,false),H.stone);group.add(mesh);g.add(group)}
 function gothic(x,z,side,y=2.2,w=1.1,h=2.6){
 // Paired window surfaces sit outside both faces of the masonry.
 for(const inside of[false,true]){const inset=inside?-.41:0,xx=x+Math.sin(side)*inset,zz=z+Math.cos(side)*inset,group=new T.Group();group.name=inside?'StainedGlassInterior':'StainedGlassExterior';group.position.set(xx,y,zz);group.rotation.y=side;
 const sh=new T.Shape();sh.moveTo(-w/2,0);sh.lineTo(w/2,0);sh.lineTo(w/2,h*.65);sh.quadraticCurveTo(w*.4,h*.84,0,h);sh.quadraticCurveTo(-w*.4,h*.84,-w/2,h*.65);sh.closePath();const geo=new T.ShapeGeometry(sh,32),uv=geo.attributes.uv,pp=geo.attributes.position;for(let i=0;i<uv.count;i++)uv.setXY(i,pp.getX(i)/w+.5,pp.getY(i)/h);const glass=new T.Mesh(geo,fineGlass());glass.userData.paneColumns=30;glass.userData.paneRows=67;group.add(glass);
 g.add(group);arch(xx,y,zz,w,h,side)}
 }
 function bell(x,y,z){const b=new T.Group(),mesh=new T.Mesh(new T.LatheGeometry([[.47,-.9],[.43,-.8],[.25,-.55],[.19,-.2],[.09,0]].map(p=>new T.Vector2(...p)),16),H.brass);b.add(mesh);const cl=new T.Mesh(new T.CylinderGeometry(.035,.05,.85,8),H.iron);cl.position.y=-.5;b.add(cl);b.position.set(x,y,z);g.add(b);g.bell=b;}
 function tip(x,y,z){if(!g.tipLights)g.tipLights=[];const mat=new T.MeshStandardMaterial({color:0xc9ac64,emissive:0xffbc56,emissiveIntensity:0});const orb=new T.Mesh(new T.SphereGeometry(.15,8,6),mat);orb.position.set(x,y,z);const light=new T.PointLight(0xffba68,0,8,2);light.position.set(x,y-.4,z);g.add(orb,light);g.tipLights.push({mat,light})}
 function gateMechanism(){g.bars=new T.Group();for(let n=0;n<10;n++){const m=new T.Mesh(new T.BoxGeometry(.075,3.35,.09),H.iron);m.position.set(-1.5+n/3,1.675,1.5);g.bars.add(m)}for(const y of[.6,1.6,2.7]){const m=new T.Mesh(new T.BoxGeometry(3.2,.1,.12),H.iron);m.position.set(0,y,1.5);g.bars.add(m)}g.add(g.bars);g.drawbridge=new T.Group();g.drawbridge.position.set(0,.16,2);const deck=new T.Mesh(boxUV(new T.BoxGeometry(3.3,.22,5)),H.floor);deck.position.z=2.5;g.drawbridge.add(deck);g.add(g.drawbridge);g.chains=[];for(const x of[-1.5,1.5]){const mesh=new T.Mesh(new T.CylinderGeometry(.027,.027,1,6),H.iron);g.add(mesh);g.chains.push({mesh,x})}}

 if(k==='house'){
  const roofs=[H.thatch,H.shingle,H.thatch,H.slate],chim=[[-2.2,-1.8],[2.2,-1.8],[-2.2,1.8],[2.2,1.8]][V];
  shell(6,6,2.65,H.plaster,1.7);framing(6,6,2.65);roof(6,6,2.7,2.7,roofs[V],0,0,H.wood);
  for(const z of[-2,0,2])beam([-3.35,2.85,z],[0,5.55,z],.24);
  // Fenster je Variante anders
  if(V===0){window(-1.9,1.5,3.03);window(3.04,1.5,0,Math.PI/2)}
  else if(V===1){window(1.7,1.5,3.03);window(-3.04,1.5,0,-Math.PI/2);window(3.04,1.5,-1.2,Math.PI/2)}
  else if(V===2){window(-1.5,1.5,3.03);window(1.5,1.5,3.03);window(-3.04,1.5,1.5,-Math.PI/2)}
  else{window(0,1.55,3.03,0,1.1,1.2);window(3.04,1.5,1.2,Math.PI/2);window(3.04,1.5,-1.2,Math.PI/2)}
  chimney(chim[0],chim[1],3.8);
  if(V&1)barrel(2.4,3.2);if(V===2||V===3)barrel(-2.5,3.1);
  furniture();
 }
 else if(k==='bighouse'||k==='apothecary'||k==='market'||k==='granary'){
 const w=k==='apothecary'?5:k==='bighouse'?8:6,d=k==='apothecary'?5:k==='granary'?5:6,h=k==='granary'?4.5:5.6;
 const roofs={apothecary:H.redRoof,bighouse:[H.slate,H.shingle,H.slate,H.redRoof][V],market:[H.thatch,H.shingle,H.thatch,H.slate][V],granary:[H.shingle,H.thatch,H.shingle,H.slate][V]};
 shell(w,d,h,H.plaster,k==='granary'?2.8:1.9);box(w,.8,.35,0,.4,-d/2,H.stone);framing(w,d,h,0,0,true);roof(w,d,h,2.7,roofs[k]||H.shingle,0,0,H.plaster);
 // Fenster-Layouts
 if(V===0){for(const x of[-w*.3,w*.3])window(x,3.95,d/2+.04,0,.8,1.05);for(const z of[-d*.25,d*.25])window(w/2+.04,3.95,z,Math.PI/2,.8,1.05)}
 else if(V===1){window(-w*.35,3.95,d/2+.04,0,.9,1.1);window(w*.2,3.95,d/2+.04,0,.7,.95);window(-w/2-.04,3.95,0,-Math.PI/2,.8,1.05);window(w/2+.04,3.95,d*.3,Math.PI/2,.8,1.05)}
 else if(V===2){for(const x of[-w*.35,0,w*.35])window(x,3.9,d/2+.04,0,.65,.95);window(w/2+.04,3.95,-d*.3,Math.PI/2,.8,1.05);window(-w/2-.04,3.95,d*.2,-Math.PI/2,.7,1)}
 else{window(0,4.0,d/2+.04,0,1.2,1.15);window(w/2+.04,3.95,-d*.25,Math.PI/2,.75,1);window(w/2+.04,3.95,d*.25,Math.PI/2,.75,1);window(-w/2-.04,3.95,0,-Math.PI/2,.8,1.05)}
 if(k==='apothecary'||k==='bighouse'){const cx=[-w*.25,w*.25,-w*.3,w*.3][V],cz=[-d*.2,-d*.2,d*.15,-d*.25][V];chimney(cx,cz,h+1.3)}
 barrel(-w*.35+(V*.15),d/2+.45);if(V>=2)barrel(w*.3,d/2+.4);
 furniture();
 if(k==='market'){awning(5,2,2.5,0,3.1,H.shingle);table(-1.4+(V%2)*.3,3.3);table(1.4-(V%2)*.3,3.3);for(const x of[-1.8,-1.4,-1,1,1.4,1.8])cylinder(.14,.15,x,1.02,3.3,((x<0)^(V&1))?H.green:H.thatch,8);}
 if(k==='granary'){for(const x of[-2,-1,1,2])for(const z of[-1.6,-.8])if(((x+z+V)&1)===0)barrel(x,z);}
 }
 else if(['bakery','bower','armorer','smithy','lumber','storage','dairy','butcher','smokehouse','brewery','tannery','weaver','tavern','fishery'].includes(k)){
 const w=k==='tavern'?8:k==='smokehouse'?4:['bakery','smithy','storage','brewery'].includes(k)?6:5,d=k==='tavern'?6:['lumber','butcher','tannery','smokehouse','fishery'].includes(k)?4:5,h=k==='tavern'?5.4:3;
 const redRoof=['armorer','smithy','brewery','tavern'].includes(k),roofMat=redRoof?[H.redRoof,H.shingle,H.redRoof,H.slate][V]:[H.shingle,H.thatch,H.shingle,H.redRoof][V];
 shell(w,d,h,H.plaster,2.2);framing(w,d,h,0,0,k==='tavern');roof(w,d,h,2,roofMat,0,0,H.wood);awning(w-1,1.8,2.3,0,d/2+.1,H.shingle);
 // Fenster-Varianten
 if(V===0)window(-w*.3,1.75,d/2+.02,0,.7,.9);
 else if(V===1){window(w*.3,1.75,d/2+.02,0,.7,.9);window(w/2+.02,1.75,0,Math.PI/2,.65,.85)}
 else if(V===2){window(-w*.35,1.75,d/2+.02,0,.6,.85);window(w*.25,1.75,d/2+.02,0,.6,.85)}
 else{window(0,1.8,d/2+.02,0,1.0,1.0);window(-w/2-.02,1.75,d*.2,-Math.PI/2,.6,.85)}
 if(V&1)barrel(w*.4,d/2+.5);if(V===3)barrel(-w*.4,d/2+.45);
 furniture();
 if(k==='bakery'){box(1.4,1.4,1.3,-1.9,.7,-1.5,H.stone,true);box(.8,.5,.04,-1.9,.65,-.83,H.dark);chimney(-1.9,-1.5,2.4);table(1.4,1.6);for(let n=0;n<5;n++){const geo=new T.SphereGeometry(.16,8,6);geo.scale(1.4,.5,.65);geo.translate(.85+n*.27,1.03,1.6);staticMesh(geo,H.thatch)}}
 if(k==='bower'){table(1.5,.7);for(const x of[-1.7,1.7]){const bow=weapon('bow');bow.position.set(x,1.25,2.65);bow.scale.setScalar(.7);g.add(bow)}const target=new T.Mesh(new T.CylinderGeometry(.57,.57,.12,20),H.thatch);target.rotation.x=Math.PI/2;target.position.set(-2.4,.8,2.1);g.add(target);for(const radius of[.18,.37]){const ring=new T.Mesh(new T.TorusGeometry(radius,.025,5,24),radius<.2?H.redRoof:H.iron);ring.position.set(-2.4,.8,2.18);g.add(ring)}}
 if(k==='armorer'){table(1.3,.5);for(const x of[-1.3,1.3]){box(.15,1.6,.15,x,.8,2.7,H.wood);const armor=new T.Mesh(new T.SphereGeometry(.35,12,8),H.iron);armor.scale.set(1,1.35,.5);armor.position.set(x,1.3,2.7);g.add(armor);const helm=new T.Mesh(new T.SphereGeometry(.2,10,8,0,Math.PI*2,0,Math.PI*.6),H.iron);helm.position.set(x,1.92,2.7);g.add(helm)}}
 if(k==='smithy'){box(1.4,1.3,1.2,1.7,.65,-1.4,H.stone,true);box(.65,.4,.06,1.7,.55,-.77,MT.F);chimney(1.7,-1.4,2.3);box(.6,.5,.5,-1.6,.25,2,H.wood,true);box(.85,.22,.3,-1.6,.6,2,H.iron);}
 if(k==='lumber'){g.logs=new T.Group();for(let row=0;row<3;row++)for(let n=0;n<4-row;n++){const log=new T.Mesh(new T.CylinderGeometry(.18,.2,1.6,8),H.wood);log.rotation.z=Math.PI/2;log.position.set(1.5,.2+row*.35,1.5+n*.38);g.logs.add(log)}g.add(g.logs);g.setLogs=n=>g.logs.children.forEach((o,i)=>o.visible=i<n);cylinder(.35,.55,-1.7,.275,2.4,H.wood);}
 if(k==='dairy'){for(const x of[-1.6,1.6]){table(x,-.6);for(const z of[-1.1,-.6,-.1])cylinder(.23,.14,x,1,z,H.thatch)}barrel(-1.7,1.5);chimney(-1.5,-1.5,3.1);}
 if(k==='butcher'){table(-1.4,-.6);box(1.2,.12,.6,-1.4,.98,-.6,MT.Z);for(const x of[1.1,1.6]){beam([x,2.4,-1],[x,1.7,-1],.04,H.iron);cylinder(.12,.55,x,1.45,-1,MT.Z)}chimney(-1.5,-1.2,3.1);}
 if(k==='smokehouse'){chimney(1,-1,3.2);box(1.1,1.1,.8,-1,.55,-1,H.stone,true);for(const y of[1.3,1.8,2.3]){box(2,.08,.75,0,y,-1,H.iron);for(const x of[-.65,0,.65])cylinder(.12,.35,x,y+.2,-1,MT.Z)}}
 if(k==='brewery'){for(const x of[-2,2]){cylinder(.6,1.6,x,.8,-1,H.brass);barrel(x,1.4)}beam([-2,1.6,-1],[2,1.6,-1],.1,H.brass);chimney(-2,-1,3.4);}
 if(k==='tannery'){for(const x of[-1.5,1.5]){cylinder(.55,.6,x,.3,-.8,H.wood);cylinder(.47,.03,x,.62,-.8,H.dark);for(const xx of[x-.6,x+.6])box(.12,2,.12,xx,1,1,H.wood);box(1.1,.12,.1,x,1.95,1,H.wood);box(.9,1.25,.045,x,1.15,1,H.thatch)}}
 if(k==='weaver'){for(const x of[-1.8,-.5])box(.13,2,.13,x,1,-.8,H.wood);for(const y of[.4,1.8])box(1.5,.12,.14,-1.15,y,-.8,H.wood);for(let x=-1.7;x<-.55;x+=.08)beam([x,.45,-.8],[x,1.75,-.8],.015,H.plaster);table(1.5,-.8);box(1.3,.06,.6,1.5,.97,-.8,H.green);}
 if(k==='tavern'){chimney(-2,-1.8,5.5);for(const x of[-2.6,2.6])window(x,4.1,3.03);for(const x of[-2.3,2.3]){table(x,.3);barrel(x,-2)}box(1.2,.9,.12,2.5,2.3,3.15,H.wood);cylinder(.23,.35,2.5,2.3,3.3,H.brass);}
 if(k==='fishery'){awning(2.2,1.8,2.1,-1.3,1.3,H.thatch);for(let x=-2;x<-.4;x+=.18)beam([x,.4,1.5],[x,1.8,1.5],.025,H.plaster);for(const y of[.5,.8,1.1,1.4,1.7])beam([-2,y,1.5],[-.4,y,1.5],.025,H.plaster);barrel(1.6,-1);}
 if(k==='storage')for(const x of[-2,-1,1,2])box(.75,.8,.75,x,.4,-1.4,H.wood,true);
 }
 else if(k==='lodge'){for(const [x,z]of[[-1.5,-1],[1.5,-1],[-1.5,1.3],[1.5,1.3]])box(.16,2.5,.16,x,1.25,z,H.wood,true);roof(3.5,3.6,2.1,1.5,H.thatch,0,-.2,H.wood);box(3.5,2.1,.2,0,1.05,-2,H.wood,true);table(0,.5);beam([-2,0,1.6],[-2,2,1.6]);beam([2,0,1.6],[2,2,1.6]);beam([-2,2,1.6],[2,2,1.6]);const hide=new T.Mesh(new T.SphereGeometry(1,10,8),H.wood);hide.scale.set(.5,.8,.07);hide.position.set(.5,1.05,1.6);g.add(hide);}
 else if(['quarry','ironmine','coppermine'].includes(k)){const ore=k==='ironmine'?H.iron:k==='coppermine'?H.brass:H.stone;box(4.8,.18,3.8,0,.09,0,H.floor);for(const x of[-1.8,1.8]){box(.28,4,.28,x,2,0,H.wood,true);beam([x,0,-1.5],[x,3.4,0],.2);beam([x,0,1.5],[x,3.4,0],.2)}beam([-2.1,3.8,0],[2.1,3.8,0],.35);beam([0,3.8,0],[0,1.1,0],.065,H.iron);box(1.3,1,1.1,0,.6,0,ore,true);for(const x of[-1.6,1.6])box(.8,.45,.6,x,.35,1.2,ore,true);const wheel=new T.Mesh(new T.TorusGeometry(.65,.09,6,20),H.wood);wheel.position.set(-1.8,1.6,.25);g.add(wheel);}
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
 else if(k==='garrison'){const mat=lv?H.stone:H.wood;shell(8,6,4,mat,2.2);box(8,.2,6,0,3.9,0,H.floor);crown(8,6,4,mat);g.walkAreas.push([0,0,4,3,4]);if(!lv)for(let x=-3.8;x<4;x+=.48)box(.2,4.7,.2,x,2.35,-2.95,H.wood);for(const x of[-3,3]){cylinder(.1,2.3,x,1.15,3.5,H.wood);const target=new T.Mesh(new T.CylinderGeometry(.42,.42,.12,16),H.thatch);target.rotation.x=Math.PI/2;target.position.set(x,1.5,3.5);g.add(target)}furniture();}
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
 else if(k==='chapel'){shell(6,8,3.6,H.stone,1.7);roof(6,8,3.6,2.3,H.shingle,0,0,H.stone);for(const side of[-1,1])for(const z of[-2,1])gothic(side*3.02,z,side*Math.PI/2,1.6,.8,1.7);box(.14,1,.14,0,6.4,3.4,H.stone);box(.65,.14,.14,0,6.55,3.4,H.stone);furniture();}
 else if(k==='church'){shell(8,12,5.5,H.stone,2.4,true);roof(8,12,5.5,3.3,H.slate,0,0,H.stone);for(const a of[-1,1])for(const z of[-3.5,-.8,3.3]){if(a===1&&z>1)continue;gothic(a*4.02,z,a*Math.PI/2,2.1,1.05,2.7);box(.65,4.7,.55,a*4.15,2.35,z-1,H.stone)}box(2.8,3.8,2.8,0,6.95,4.6,H.stone);g.bellTowerWalls=4;for(let face=0;face<4;face++){const angle=face*Math.PI/2,x=Math.sin(angle)*1.4,z=4.6+Math.cos(angle)*1.4,sh=new T.Shape();sh.moveTo(-1.4,0);sh.lineTo(1.4,0);sh.lineTo(1.4,2.5);sh.lineTo(-1.4,2.5);sh.closePath();const hole=new T.Path();hole.moveTo(-.55,.35);hole.lineTo(-.55,1.42);hole.quadraticCurveTo(-.44,1.74,0,2);hole.quadraticCurveTo(.44,1.74,.55,1.42);hole.lineTo(.55,.35);hole.closePath();sh.holes.push(hole);const geo=new T.ExtrudeGeometry(sh,{depth:.35,bevelEnabled:false});geo.translate(0,8.85,-.35);geo.rotateY(angle);geo.translate(x,0,z);staticMesh(geo,H.stone);gothic(x+Math.sin(angle)*.02,z+Math.cos(angle)*.02,angle,9.2,1.1,1.65);}box(2.8,.2,2.8,0,11.45,4.6,H.stone);crown(2.8,2.8,11.55,H.stone,0,4.6);bell(0,11.1,4.6);furniture();}
 else if(k==='cathedral'){shell(12,16,7.6,H.stone,3);roof(12,16,7.6,3.7,H.redRoof,0,0,H.stone);g.naveRoofCount=1;for(const a of[-1,1])for(const z of[-5.5,-2,2,5.5]){gothic(a*6.02,z,a*Math.PI/2,2.1,1.5,4.4);box(.7,6.8,.75,a*6.12,3.4,z-1.2,H.stone)}gothic(0,8.03,0,4.1,2.7,3.2);shell(5.3,5.3,6,H.stone,0,false,0,-1,9);box(5.3,.2,5.3,0,14.9,-1,H.floor);crown(5.3,5.3,15,H.stone,0,-1);for(const x of[-2.65,2.65])for(const z of[-3.65,1.65]){box(.5,7,.5,x,12.5,z,H.stone);tip(x,16.1,z)}for(const x of[-1.4,1.4])gothic(x,1.67,0,10.2,1,3.2);box(.16,1.3,.16,0,11.9,-6,H.brass);box(.8,.16,.16,0,12.1,-6,H.brass);furniture();}
 else if(['cow','sheep','pigsty'].includes(k)){addDoor(g,H,{x:0,z:3,width:1.7,height:1.05,style:'plain'});for(const a of[-1,1])for(const y of[.5,.95]){if(a<0)box(7,.1,.12,0,y,a*3,H.wood,true);else for(const x of[-2.2,2.2])box(2.6,.1,.12,x,y,3,H.wood,true);box(.12,.1,6,a*3.5,y,0,H.wood,true)}for(const x of[-3.5,0,3.5])for(const z of[-3,3])if(x!==0||z<0)box(.13,1.25,.13,x,.625,z,H.wood,true);for(const x of[-1.7,1.7])box(.18,2.5,.18,x,1.25,-1.5,H.wood,true);roof(4,2.8,2.5,1.6,H.thatch,0,-1.6);box(3.5,.5,.7,0,.25,-1.5,H.wood,true);g.animals=[];for(const x of[-1.8,0,1.8]){const a=quad(k==='pigsty'?'pig':k==='sheep'?'sheep':'cow');a.position.set(x,0,.7);a.rotation.y=x*.7;g.add(a);g.animals.push(a)}}
 else if(k==='orchard'){for(const x of[-2.5,0,2.5])for(const z of[-2.5,0,2.5]){cylinder(.12,2,x,1,z,H.wood);for(const a of[-1,1])beam([x,1.1,z],[x+a*.6,2,z+.2],.09);for(const [dx,dy,dz]of[[0,2.4,0],[-.55,2.1,0],[.55,2.2,.2],[0,2,-.5]]){const geo=new T.IcosahedronGeometry(.75,1);geo.translate(x+dx,dy,z+dz);staticMesh(geo,H.green)}for(const [dx,dy,dz]of[[.55,2.5,.35],[-.6,2.1,.4],[.2,1.8,.5]]){const geo=new T.SphereGeometry(.1,8,6);geo.translate(x+dx,dy,z+dz);staticMesh(geo,H.redRoof)}}}
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
  box(.28,5.2,.28,-3.0,2.7,-.2,H.wood,true);
  beam([-3.0,5.1,-.2],[1.2,5.1,-.2],.22);
  beam([1.0,5.1,-.2],[1.0,1.2,-.2],.05,H.iron);
  const hook=new T.Mesh(new T.TetrahedronGeometry(.18),H.iron);hook.position.set(1.0,1.15,-.2);g.add(hook);
  // Warenhaus-Dach am Kai
  box(3.2,2.4,2.6,2.6,1.2,1.2,H.wood);roof(3.4,2.8,2.4,1.3,H.shingle,2.6,1.2);
  for(const x of[1.8,3.4])barrel(x,-1.8);barrel(2.6,-.6);barrel(-2.2,1.5);
  // Poller
  for(const x of[-3.5,0,3.5]){cylinder(.12,.45,x,.35,-2.7,H.iron);cylinder(.12,.45,x,.35,2.7,H.iron)}
  // Seile (dünne Balken)
  beam([-3.5,.5,-2.7],[-3.0,1.2,-.2],.03,H.iron);beam([3.5,.5,2.7],[2.6,1.0,1.2],.03,H.iron);
  awning(2.2,2.2,2.4,2.2,1.1,H.shingle);
}
 // Varianten-Details: kleine Unterschiede an jedem Gebäude (Fässer, Bretter, Schornstein-Rauchfang)
 if(!['wall','battle','palisade','moat','bridge','field','hopfield','stairs','bed','fire','bench'].includes(k)){
  const C=g.colliders[0],bw=(C?C[2]*2:4),bd=(C?C[3]*2:4);
  if(V===1){const lean=new T.Mesh(boxUV(new T.BoxGeometry(.12,1.4,.8)),H.wood);lean.position.set(bw*.45,.7,bd*.45);lean.rotation.z=.15;g.add(lean)}
  if(V===2){const crate=new T.Mesh(boxUV(new T.BoxGeometry(.55,.4,.45)),H.wood);crate.position.set(-bw*.4,.2,bd*.42);g.add(crate)}
  if(V===3){const post=new T.Mesh(new T.CylinderGeometry(.06,.07,1.6,8),H.wood);post.position.set(bw*.48,.8,-bd*.35);g.add(post);const flag=new T.Mesh(new T.BoxGeometry(.02,.35,.5),H.thatch||H.plaster);flag.position.set(bw*.48,1.5,-bd*.35+.2);g.add(flag)}
 }
 // Static parts merge by material. Detail-rich buildings stay cheap to draw.
 for(const [material,geos]of batches){const geometry=mergeGeometries(geos,false),mesh=new T.Mesh(geometry,material);mesh.castShadow=true;mesh.receiveShadow=true;g.add(mesh);geos.forEach(geo=>geo.dispose())}
 g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});return g;
}

// Optional rooms remain part of the keep, including their collision geometry.
export function installKeepRooms(g,flags,H,makePrisoner){if(g.keepRooms){g.remove(g.keepRooms);g.keepRooms.traverse(o=>{o.geometry?.dispose()})}g.keepRooms=new T.Group();g.keepRooms.name='Bergfried-Erweiterungen';g.pris=[];g.setPrisoners=n=>{if(!(flags&1)||!makePrisoner)return;while(g.pris.length<Math.min(4,n)){const i=g.pris.length,p=makePrisoner(i);p.position.set(-3.85+(i%2)*.8,0,-1.6-Math.floor(i/2)*.8);g.keepRooms.add(p);g.pris.push(p)}g.pris.forEach((p,i)=>p.visible=i<n)};g.add(g.keepRooms);g.baseColliders=g.baseColliders||g.colliders.slice();g.colliders=g.baseColliders.slice();
 const box=(w,h,d,x,y,z,mat,solid=true)=>{const m=new T.Mesh(boxUV(new T.BoxGeometry(w,h,d)),mat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;g.keepRooms.add(m);if(solid)g.colliders.push([x,z,w/2,d/2,y+h/2,y-h/2]);return m};
 if(flags&1){for(let x=-4.2;x<=-2.4;x+=.22)box(.065,2.3,.065,x,1.15,-1,H.iron);box(.1,2.3,2,-2.4,1.15,-2,H.iron);box(1.6,.35,.65,-3.3,.175,-2.5,H.wood);box(1.5,.1,.6,-3.3,.4,-2.5,H.thatch);}
 if(flags&2){box(1.3,.12,2,3.1,.9,-1.7,H.wood);for(const x of[2.6,3.6])box(.12,.85,1.5,x,.425,-1.7,H.wood);for(const z of[-2.3,-1.1])box(1.4,.055,.12,3.1,1,-1.7+(z+1.7),H.iron,false);box(.16,2.4,.16,3.7,1.2,-3,H.wood);box(1.2,.14,.16,3.3,2.2,-3,H.wood);}
}
