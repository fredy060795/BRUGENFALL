import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {surfaceMaterial} from './materials.js';
import {buildPerson,dressArms,gear} from './people.js';
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
const steel=new T.MeshStandardMaterial({color:0x9aa7ad,metalness:.72,roughness:.43});
const dark=new T.MeshStandardMaterial({color:0x333735,metalness:.3,roughness:.7});
const leather=surfaceMaterial('leather',0x9f8c78);
const oak=new T.MeshStandardMaterial({color:0x745539,roughness:1});
function mesh(geo,mat,parent,p=[0,0,0]){const o=new T.Mesh(geo,mat);o.position.set(...p);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o}
function ell(parent,mat,s,p){const o=mesh(new T.SphereGeometry(1,12,8),mat,parent,p);o.scale.set(...s);return o}
function rod(parent,mat,a,b,r1,r2=r1){const va=V(...a),vb=V(...b),d=vb.clone().sub(va);const o=mesh(new T.CylinderGeometry(r2,r1,d.length(),10),mat,parent);o.position.copy(va.add(vb).multiplyScalar(.5));o.quaternion.setFromUnitVectors(V(0,1,0),d.normalize());return o}
function box(parent,mat,s,p){return mesh(new T.BoxGeometry(...s),mat,parent,p)}
function lathe(parent,mat,points,s,p){const o=mesh(new T.LatheGeometry(points.map(([r,y])=>new T.Vector2(r,y)),16),mat,parent,p);o.scale.set(...s);return o}
export function weapon(type){const g=new T.Group();g.name=type;g.userData.secondary=V(0,-.23,0);
 if(type==='none')return g;
 if(type==='spear'||type==='lance'){const L=type==='lance'?3.1:2.3;rod(g,oak,[0,-.9,0],[0,L-.9,0],.026,.02);
  if(type==='lance'){lathe(g,steel,[[.0,0],[.11,.02],[.035,.32],[.028,.34]],[1,1,1],[0,.05,0]);const tip=mesh(new T.ConeGeometry(.03,.22,6),steel,g,[0,L-.8,0]);ell(g,leather,[.05,.06,.05],[0,L-.98,0])}
  else{const s=new T.Shape();s.moveTo(-.04,0);s.lineTo(.04,0);s.lineTo(.01,.32);s.lineTo(0,.36);s.lineTo(-.01,.32);s.closePath();const h=mesh(new T.ExtrudeGeometry(s,{depth:.012,bevelEnabled:false}),steel,g,[0,L-.92,-.006]);box(g,steel,[.12,.025,.03],[0,L-.92,0])}
  return g}
 if(type==='crozier'){const gd=new T.MeshStandardMaterial({color:0xc9a84a,metalness:.6,roughness:.35});rod(g,gd,[0,-.95,0],[0,.95,0],.016,.014);const c=mesh(new T.TorusGeometry(.1,.016,6,16,Math.PI*1.4),gd,g,[.07,1.02,0]);c.rotation.z=-.3;ell(g,gd,[.035,.05,.035],[0,.9,0]);return g}   // Krummstab des Bischofs
 if(type==='pcross'){const gd=new T.MeshStandardMaterial({color:0xc9a84a,metalness:.6,roughness:.35});rod(g,oak,[0,-.9,0],[0,1.5,0],.02,.018);box(g,gd,[.04,.42,.03],[0,1.62,0]);box(g,gd,[.28,.04,.03],[0,1.7,0]);ell(g,gd,[.05,.05,.05],[0,1.5,0]);return g}   // Vortragekreuz
 if(type==='staff'){const dk=new T.MeshStandardMaterial({color:0x2a1e16,roughness:.8});rod(g,dk,[0,-.95,0],[0,.75,0],.013,.011);ell(g,dk,[.024,.03,.024],[0,.77,0]);return g}   // Zeigestab des Pestdoktors
 if(type==='crossbow'){   // Säule mit Kolben; Stahlbogen sitzt direkt am vorderen Schaftende (Wölbung nach vorn, Enden zur Sehne), Spannbügel davor, Nuss und Abzugsbügel
  box(g,oak,[.055,.62,.065],[0,.11,0]);box(g,oak,[.07,.26,.085],[0,-.27,-.005]);
  const p=mesh(new T.TorusGeometry(.7,.022,6,20,.96),steel,g,[0,-.28,0]);p.rotation.z=Math.PI/2-.48;
  box(g,steel,[.09,.07,.09],[0,.41,0]);for(const sx of[-1,1])mesh(new T.SphereGeometry(.022,6,5),steel,g,[sx*.325,.37,0]);
  rod(g,steel,[-.045,.44,0],[-.07,.56,0],.008);rod(g,steel,[.045,.44,0],[.07,.56,0],.008);rod(g,steel,[-.075,.56,0],[.075,.56,0],.009);   // Spannbügel
  const sm=new T.MeshStandardMaterial({color:0xe8e0c8,roughness:1});rod(g,sm,[-.325,.37,0],[0,.2,.036],.004);rod(g,sm,[.325,.37,0],[0,.2,.036],.004);
  mesh(new T.CylinderGeometry(.018,.018,.03,8),steel,g,[0,.2,.04]).rotation.z=Math.PI/2;rod(g,steel,[0,.12,-.035],[0,-.3,-.07],.007);return g}
 if(type==='torch'){rod(g,oak,[0,-.28,0],[0,.3,0],.022,.026);ell(g,dark,[.045,.06,.045],[0,.33,0]);const fm=[0xffc03a,0xff7a1a,0xfff0a0].map(c=>new T.MeshBasicMaterial({color:c}));g.userData.flames=[];
  for(let n=0;n<3;n++){const f=mesh(new T.ConeGeometry(.055-n*.012,.2+n*.05,6),fm[n],g,[(n-1)*.012,.47+n*.03,0]);f.castShadow=false;g.userData.flames.push(f)}
  const l=new T.PointLight(0xffaa55,20,13,2);l.position.y=.55;g.add(l);g.userData.light=l;return g}
 if(type==='sword'){
 rod(g,leather,[0,-.09,0],[0,.09,0],.023);ell(g,steel,[.035,.04,.027],[0,-.13,0]);box(g,steel,[.23,.035,.05],[0,.115,0]);
 const shape=new T.Shape();shape.moveTo(-.034,.14);shape.lineTo(.034,.14);shape.lineTo(.026,.82);shape.lineTo(0,.99);shape.lineTo(-.026,.82);shape.closePath();const blade=mesh(new T.ExtrudeGeometry(shape,{depth:.012,bevelEnabled:true,bevelThickness:.007,bevelSize:.006,bevelSegments:1,steps:1}),steel,g);blade.position.z=-.006;
 }else if(type==='bow'){
 const pts=[];for(let i=0;i<=20;i++){const y=-.58+i*.058;pts.push(V(0,y,.22*(1-(y/.58)**2)))}mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),20,.018,5,false),oak,g);
 const sm=new T.MeshStandardMaterial({color:0xe8e0c8,roughness:1});g.userData.str=[mesh(new T.CylinderGeometry(.0035,.0035,1,4),sm,g),mesh(new T.CylinderGeometry(.0035,.0035,1,4),sm,g)];
 const ar=new T.Group(),sh=mesh(new T.CylinderGeometry(.007,.007,.7,5),oak,ar);sh.rotation.x=Math.PI/2;const tp=mesh(new T.ConeGeometry(.02,.07,5),steel,ar,[0,0,.385]);tp.rotation.x=Math.PI/2;
 for(const a of[0,Math.PI/2])mesh(new T.BoxGeometry(.003,.05,.09),new T.MeshStandardMaterial({color:0xf0ecd8}),ar,[0,0,-.3]).rotation.z=a;
 g.add(ar);g.userData.arrow=ar;g.userData.secondary=V(0,.1,-.1);
 }else if(type==='hammer'){rod(g,oak,[0,-.2,0],[0,.46,0],.026);box(g,steel,[.17,.1,.1],[0,.5,0]);box(g,steel,[.06,.06,.05],[.1,.5,0])
 }else{
 rod(g,oak,[0,-.42,0],[0,type==='hoe'?1.0:.53,0],.027,.024);
 if(type==='axe'){
 const s=new T.Shape();s.moveTo(-.03,.4);s.lineTo(.22,.57);s.quadraticCurveTo(.31,.39,.23,.24);s.lineTo(-.03,.31);s.closePath();const a=mesh(new T.ExtrudeGeometry(s,{depth:.045,bevelEnabled:true,bevelThickness:.008,bevelSize:.007,bevelSegments:1}),steel,g);a.position.z=-.022;
 }else if(type==='pickaxe'){rod(g,dark,[-.3,.37,0],[0,.48,0],.008,.055);rod(g,steel,[0,.48,0],[.34,.35,0],.055,.008)}
 else{box(g,dark,[.29,.065,.22],[.11,.98,0])}
 }
 return g
}
function hand(parent,skin,side){const h=new T.Bone();h.name=side+'Hand';parent.add(h);
 ell(h,skin,[.042,.064,.033],[0,0,-.025]);
 // Four curled fingers enclose the 5 cm diameter handle at the palm origin.
 for(let i=0;i<4;i++){const finger=new T.Bone();finger.name=side+'Finger'+i;finger.position.y=-.047+i*.027;h.add(finger);rod(finger,skin,[-.035,0,-.015],[-.038,0,.025],.011);rod(finger,skin,[-.038,0,.025],[.018,0,.038],.011);ell(finger,skin,[.012,.011,.014],[.024,0,.025])}
 rod(h,skin,[.034,.046,-.028],[.04,.012,.019],.017);
 h.updateWorldMatrix(true,true);const inverse=h.matrixWorld.clone().invert(),parts=[],old=[];h.traverse(o=>{if(o.isMesh){parts.push(o.geometry.clone().applyMatrix4(inverse.clone().multiply(o.matrixWorld)));old.push(o)}});for(const o of old){o.removeFromParent();o.geometry.dispose()}mesh(mergeGeometries(parts,false),skin,h);parts.forEach(p=>p.dispose());return h}
function arm(parent,cloth,skin,side){const shoulder=new T.Bone();shoulder.name=side+'Shoulder';shoulder.position.set(side==='right'?.255:-.255,1.43,0);parent.add(shoulder);
 const elbow=new T.Bone();elbow.name=side+'Elbow';elbow.position.y=-.285;shoulder.add(elbow);const wrist=hand(elbow,skin,side);wrist.position.y=-.28;
 lathe(shoulder,cloth,[[.052,-.285],[.065,-.22],[.085,-.08],[.075,0]],[1,1,1],[0,0,0]);ell(shoulder,cloth,[.083,.09,.082],[0,-.025,0]);
 lathe(elbow,cloth,[[.043,-.28],[.053,-.23],[.062,-.06],[.053,0]],[1,1,1],[0,0,0]);ell(elbow,cloth,[.058,.06,.058],[0,0,0]);rod(elbow,leather,[0,-.23,0],[0,-.19,0],.056);
 return {shoulder,elbow,wrist};
}
function solve(a,target,q){const start=a.shoulder.position.clone(),delta=target.clone().sub(start),distance=delta.length(),len=Math.min(.564,Math.max(.02,distance)),dir=delta.normalize(),l1=.285,l2=.28;
 const along=(l1*l1-l2*l2+len*len)/(2*len),out=Math.sqrt(Math.max(0,l1*l1-along*along));
 const bend=V(a.shoulder.position.x>0?.8:-.8,-.65,-.35);bend.addScaledVector(dir,-bend.dot(dir)).normalize();
 const end=start.clone().addScaledVector(dir,len),mid=start.clone().addScaledVector(dir,along).addScaledVector(bend,out);
 const qa=new T.Quaternion().setFromUnitVectors(V(0,-1,0),mid.clone().sub(start).normalize());const qb=new T.Quaternion().setFromUnitVectors(V(0,-1,0),end.clone().sub(mid).normalize());a.shoulder.quaternion.copy(qa);a.elbow.quaternion.copy(qa.clone().invert().multiply(qb));a.wrist.quaternion.copy(qb.clone().invert().multiply(q));
 a.wrist.userData.target=target.clone();
}

export function createCharacter(color=0x756952,kind='sword',opts={}){
 const g=new T.Group();g.name='ArticulatedCharacter';g.isCharacter=true;
 g.role=opts.person?.role||kind;
 const P=opts.person;g.eyeHeight=P?1.6758:1.68;const cloth=surfaceMaterial('linen',P?P.cloth:color,[2,2]);const skin=new T.MeshStandardMaterial({color:P?P.skin:0xb98d70,roughness:.92});
 lathe(g,cloth,[[.18,.82],[.165,1.02],[.2,1.28],[.23,1.39],[.115,1.46]],[1,1,.67],[0,0,0]);
 lathe(g,cloth,[[.235,.71],[.225,.78],[.18,1.02]],[1,1,.73],[0,0,0]);
 lathe(g,leather,[[.183,.97],[.18,1.015]],[1,1,.7],[0,0,.002]);box(g,steel,[.062,.047,.017],[0,.992,.132]);
 if(P)buildPerson(g,P,{cloth,skin,leather,steel,dark});else{rod(g,skin,[0,1.43,0],[0,1.55,0],.063);
 lathe(g,skin,[[.045,1.51],[.078,1.54],[.104,1.62],[.106,1.71],[.085,1.77],[.01,1.795]],[1,1,.88],[0,0,0]);
 // Nase detaillierter
 ell(g,skin,[.022,.038,.045],[0,1.64,.095]);
 ell(g,skin,[.016,.02,.02],[0,1.62,.115]);
 // Augen: Weiß + Iris + Pupille
 for(const x of[-.052,.052]){
  ell(g,new T.MeshStandardMaterial({color:0xf0ebe4,roughness:.5}),[.018,.012,.008],[x,1.685,.092]);
  ell(g,new T.MeshStandardMaterial({color:0x4a3a28,roughness:.4}),[.011,.01,.007],[x,1.685,.098]);
  ell(g,dark,[.005,.005,.004],[x,1.685,.102]);
  // Braue
  ell(g,dark,[.02,.006,.005],[x,1.705,.088]);
  // Ohr
  ell(g,skin,[.016,.032,.014],[Math.sign(x)*.11,1.65,0]);
 }
 // Mund
 ell(g,new T.MeshStandardMaterial({color:0xa07068,roughness:.8}),[.02,.006,.008],[0,1.60,.1]);
 const helmet=mesh(new T.SphereGeometry(.122,16,10,0,Math.PI*2,0,Math.PI*.55),steel,g,[0,1.695,0]);helmet.scale.z=.91;
 const brim=mesh(new T.CylinderGeometry(.158,.16,.022,16),dark,g,[0,1.7,0]);brim.scale.z=.87;
 box(g,steel,[.02,.135,.022],[0,1.66,.108]);}
 // Padded collar and shoulder guards follow the body.
 for(const x of[-.205,.205])ell(g,leather,[.073,.035,.105],[x,1.425,0]);
 g.legs=[];for(const x of[-.105,.105]){
  const hip=new T.Bone();hip.position.set(x,.84,0);g.add(hip);
  // Oberschenkel: weichere Form mit mehreren Ringen
  lathe(hip,cloth,[[.055,-.38],[.07,-.28],[.082,-.14],[.09,-.04],[.085,0]],[1,1,1],[0,0,0]);
  ell(hip,cloth,[.09,.08,.09],[0,-.08,0]); // Hüftvolumen
  const knee=new T.Bone();knee.position.y=-.39;hip.add(knee);
  // Unterschenkel + Wade
  rod(knee,leather,[0,0,0],[0,-.36,0],.055,.042);
  lathe(knee,leather,[[.048,-.36],[.06,-.22],[.055,-.08],[.05,0]],[1,1,1],[0,0,0]);
  ell(knee,leather,[.06,.055,.06],[0,-.05,0]); // Knie
  // Fuß detaillierter
  ell(knee,leather,[.055,.04,.11],[0,-.385,.05]);
  ell(knee,leather,[.045,.03,.06],[0,-.4,.1]); // Zehenbereich
  g.legs.push({hip,knee})
}
 g.right=arm(g,cloth,skin,'right');g.left=arm(g,cloth,skin,'left');if(P){dressArms(g,P,{skin,leather,steel,dark});gear(g,P,{skin,leather,steel,dark})}g.toolType='';g.tool=null;g.equipmentCache={};g.stowed={};g.kind=kind;g.phase=0;g.attackPhase=0;
 g.sheath=box(g,leather,[.065,.65,.035],[-.24,.57,0]);g.sheath.rotation.z=-.12;
 for(const type of['sword','axe','pickaxe']){const item=weapon(type);item.scale.setScalar(.7);if(type==='sword'){item.position.set(-.25,.94,-.03);item.rotation.z=Math.PI+.12}else{item.position.set(type==='axe'?-.1:.1,1.23,-.19);item.rotation.z=type==='axe'?.5:-.5}g.add(item);g.stowed[type]=item}
 const pelvis=new T.Group(),upper=new T.Group();upper.position.y=.95;
 for(const ch of[...g.children]){if(g.legs.some(l=>l.hip===ch))pelvis.add(ch);else{ch.position.y-=.95;upper.add(ch)}}
 pelvis.add(upper);g.add(pelvis);g.pelvis=pelvis;g.upper=upper;g.sw=-1;g.sp=0;g.t=0;
 g.noStow=!!P&&P.role!=='player';g.noSheath=!!P&&['peasant','farmer','wood','hunter','mason'].includes(P.role);
 setTool(g,P&&P.tool?P.tool:(kind==='archer'?'bow':'sword'));return g;
}
export function setTool(g,type){if(!g.isCharacter||g.toolType===type)return;g.tool&&g.right.wrist.remove(g.tool);g.toolType=type;g.tool=g.equipmentCache[type]||(g.equipmentCache[type]=weapon(type));g.right.wrist.add(g.tool);for(const [k,v]of Object.entries(g.stowed))v.visible=k!==type&&g.kind!=='archer'&&!g.noStow&&type!=='none';g.sheath.visible=!g.noSheath&&type!=='none'}
const ease=t=>t<=0?0:t>=1?1:t*t*(3-2*t);
const Eu=(x,y,z)=>new T.Quaternion().setFromEuler(new T.Euler(x,y,z));
const L1=.39,L2=.385;
function legIK(leg,zA,yA){const d=Math.min(L1+L2-.002,Math.max(.25,Math.hypot(zA,yA))),
 K=Math.acos(Math.max(-1,Math.min(1,(L1*L1+L2*L2-d*d)/(2*L1*L2)))),B=Math.acos(Math.max(-1,Math.min(1,(L1*L1+d*d-L2*L2)/(2*L1*d))));
 leg.hip.rotation.x=Math.atan2(-zA,-yA)-B;leg.knee.rotation.x=Math.PI-K}
function seg(m,a,b){const d=b.clone().sub(a),l=d.length();m.position.copy(a).addScaledVector(d,.5);m.scale.set(1,l,1);m.quaternion.setFromUnitVectors(V(0,1,0),d.divideScalar(l||1))}
function bowString(bow,d){const s=bow.userData.str;if(!s)return;seg(s[0],V(0,-.58,0),V(0,0,-d));seg(s[1],V(0,0,-d),V(0,.58,0));const a=bow.userData.arrow;a.visible=d>.1;a.position.z=-d+.35}
function pose3(P,u,t1,t2){let a,b,s;if(u<t1){a=0;b=1;s=ease(u/t1)}else if(u<t2){a=1;b=2;s=Math.pow(ease((u-t1)/(t2-t1)),.8)}else{a=2;b=0;s=ease((u-t2)/(1-t2))}
 const A=P[a],B=P[b];return{pos:V(A[0]+(B[0]-A[0])*s,A[1]+(B[1]-A[1])*s,A[2]+(B[2]-A[2])*s),q:Eu(A[3],A[4],A[5]).slerp(Eu(B[3],B[4],B[5]),s)}}
// Schwungbahnen: [t, Handx,y,z, Werkzeugrichtung x,y,z, Vorbeuge, Drehung, Becken z, Becken y, Easing der Strecke zum Key]
const SWK={
 sword:[[0,.29,.95,.12,.12,.95,.3,0,0,0,0,'io'],[.3,.42,1.62,-.18,.1,.75,-.65,-.05,.55,-.06,-.02,'io'],[.42,.1,1.45,.5,0,.1,1,.1,.1,.02,-.03,'in'],[.52,-.28,.95,.55,-.45,-.35,.8,.28,-.6,.1,-.05,'out'],[.64,-.38,.85,.45,-.7,-.4,.6,.3,-.75,.12,-.06,'io'],[1,.29,.95,.12,.12,.95,.3,0,0,0,0,'io']],
 axe:[[0,.2,1.1,.22,.5,.85,.1,.03,0,0,0,'io'],[.35,.15,1.78,-.12,0,.5,-.86,-.12,.35,-.05,-.04,'io'],[.52,.1,1.1,.5,0,-.55,.84,.45,-.25,.12,-.1,'in'],[.62,.1,1.05,.52,0,-.7,.7,.5,-.25,.13,-.11,'out'],[.78,.15,1.2,.3,.2,.3,.9,.2,0,.04,-.03,'io'],[1,.2,1.1,.22,.5,.85,.1,.03,0,0,0,'io']],
 pick:[[0,.2,1.1,.22,.5,.85,.1,.03,0,0,0,'io'],[.38,.12,1.9,-.05,0,.8,-.6,-.1,.2,-.04,-.05,'io'],[.54,.1,.95,.42,0,-.85,.5,.55,-.2,.12,-.12,'in'],[.64,.1,.9,.45,0,-.9,.4,.58,-.2,.13,-.13,'out'],[.8,.15,1.2,.3,.2,.3,.9,.2,0,.04,-.03,'io'],[1,.2,1.1,.22,.5,.85,.1,.03,0,0,0,'io']],
 hoe:[[0,.18,1.1,.3,.3,.9,.3,.03,0,0,0,'io'],[.3,.15,1.7,0,0,.7,-.7,-.1,.2,-.04,-.03,'io'],[.46,.1,.9,.55,0,-.4,.9,.5,-.1,.1,-.1,'in'],[.7,.1,.85,.25,0,-.6,.8,.58,0,0,-.12,'io'],[1,.18,1.1,.3,.3,.9,.3,.03,0,0,0,'io']],
 hammer:[[0,.29,.95,.12,.12,.95,.3,0,0,0,0,'io'],[.3,.3,1.6,-.05,0,.8,-.6,-.05,.3,-.03,-.02,'io'],[.45,.1,1.05,.5,0,-.1,1,.3,-.2,.08,-.05,'in'],[.6,.1,1,.52,0,-.2,1,.32,-.2,.08,-.05,'out'],[1,.29,.95,.12,.12,.95,.3,0,0,0,0,'io']]};
export const SWING={sword:.75,axe:.95,pickaxe:1.05,hoe:1,hammer:.55,none:.75},IMPACT={sword:.52,axe:.52,pickaxe:.54,hoe:.46,hammer:.45,none:.52};
const kindOf=t=>t==='pickaxe'?'pick':(t==='spear'||t==='lance')?'hammer':(SWK[t]?t:'sword'),FW=V(0,0,1);
function swingPose(kind,u){const K=SWK[kind];let i=1;while(i<K.length-1&&u>K[i][0])i++;const a=K[i-1],b=K[i],s=Math.max(0,Math.min(1,(u-a[0])/(b[0]-a[0]))),e=b[11]==='in'?s*s:b[11]==='out'?1-(1-s)*(1-s):s*s*(3-2*s),m=j=>a[j]+(b[j]-a[j])*e;
 return{h:V(m(1),m(2),m(3)),d:V(m(4),m(5),m(6)).normalize(),lean:m(7),tw:m(8),pz:m(9),pd:m(10)}}
function toolQ(d,hint){const y=d.clone().normalize(),x=hint.clone().addScaledVector(y,-hint.dot(y));if(x.lengthSq()<1e-4)x.set(1,0,0).addScaledVector(y,-y.x);x.normalize();const z=new T.Vector3().crossVectors(x,y);return new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(x,y,z))}
function workPose(role,t,type){
 const s=Math.sin(t*6),c=Math.cos(t*5);
 if(role==='minter')role='smith';
 if(role==='smith')return{R:V(.18,1.18,.35+.06*s),Lh:V(.03,1.02,.18-.03*s),q:Eu(.55,.1,-.28),ux:.28,uy:-.08,py:.02};
 if(role==='weaver')return{R:V(.3,1.03,.38+.09*s),Lh:V(-.32,.98,.28-.07*s),q:Eu(.02,.08,.04),ux:.16,uy:.03*s,py:0};
 if(role==='healer')return{R:V(.16,1.06,.34+.03*s),Lh:V(-.12,.95,.24-.04*c),q:Eu(.22,-.12,.18),ux:.19,uy:.05,py:-.03};
 if(role==='keeper')return{R:V(.18,1.08,.38+.05*s),Lh:V(-.22,.96,.26),q:Eu(.34,.08,-.18),ux:.17,uy:-.02,py:.02};
 if(role==='miner')return{R:V(.14,1.46,.18+.04*c),Lh:V(.12,1.22,-.02),q:toolQ(V(.18,-.95,-.24),V(.7,0,.2)),ux:.34,uy:-.18,py:.08};
 return null
}
export function animateCharacter(g,dt,speed,attacking,mounted=false,fx={}){
 const pel=g.pelvis,up=g.upper;if(!pel)return;
 // Klappvisier: im Kampf geschlossen, sonst offen (Spieler: g.visorUp per Taste)
 if(g._vp===undefined){g._vp=null;g.traverse(c=>{if(c.userData&&c.userData.visorPivot)g._vp=c})}
 if(g._vp){g._va=attacking?2.5:Math.max(0,(g._va||0)-dt);const open=g.visorUp!=null?g.visorUp:g._va<=0&&!fx.closeVisor,tg=open?-1.3:0;g._vp.rotation.x+=(tg-g._vp.rotation.x)*Math.min(1,dt*6)}
 g.t+=dt;g.sp+=(speed-g.sp)*(1-Math.exp(-dt*9));
 const sp=mounted?0:g.sp,k=Math.min(1,sp/3.2),run=Math.max(0,Math.min(1,(sp-4)/3)),type=g.toolType,bow=type==='bow',two=type==='axe'||type==='pickaxe'||type==='hoe',kind=kindOf(type);
 if(sp>.2)g.phase+=dt*sp*1.75;
 if(attacking&&g.sw<0)g.sw=0;
 if(g.sw>=0){g.sw+=dt/(bow?.8:(SWING[type]||.75));if(g.sw>=1)g.sw=attacking?0:-1}
 const u=g.sw,A=Math.min(.5,sp*.095),lift=.14*k,busy=!!(fx.carry||fx.work===1||fx.work===3||fx.pray),SW=(u>=0&&!bow&&!busy)?swingPose(kind,u):null,pz=SW?SW.pz:0;
 const foot=i=>{const w=(((g.phase/6.2832+(i?.5:0))%1)+1)%1;if(w<.6)return[A*(1-2*w/.6),0];const s=(w-.6)/.4;return[-A+2*A*(1-Math.cos(Math.PI*s))/2,lift*Math.sin(Math.PI*s)]};
 const f0=foot(0),f1=foot(1),dy=(mounted?0:-.05*k+.035*k*Math.cos(2*(g.phase-.6*Math.PI)))+(SW?SW.pd:0);
 if(mounted){g.legs.forEach(({hip,knee},i)=>{hip.rotation.set(-1.05,0,i?-.22:.22);knee.rotation.x=.85});pel.position.set(0,0,0)}
 else{pel.position.set(-.02*k*Math.cos(g.phase-.6*Math.PI),dy,pz);[f0,f1].forEach((f,i)=>{legIK(g.legs[i],f[0]-pz,f[1]+.067-.84-dy);g.legs[i].hip.rotation.z=0})}
 // Posen: 1 liegen, 2 sitzen, 3 sitzen+trinken, 4 sitzen+essen, 5 knien, 6 jubeln, 7 Bier zapfen
 const ps=fx.pose|0;
 if(ps===2||ps===3||ps===4||ps===12){pel.position.set(0,-.44,.04);g.legs.forEach(({hip,knee})=>{hip.rotation.set(-1.52,0,0);knee.rotation.x=1.52})}
 else if(ps===5){pel.position.set(0,-.4,-.05);g.legs.forEach(({hip,knee},i)=>{hip.rotation.set(i?-.05:-1.45,0,0);knee.rotation.x=i?1.55:1.45})}
 else if(ps===1){pel.position.set(0,0,0);g.legs.forEach(({hip,knee})=>{hip.rotation.set(0,0,0);knee.rotation.x=.05})}
 if(ps&&!g._props){g._props=1;const wd=new T.MeshStandardMaterial({color:0x7a5230,roughness:.9}),hoop=new T.MeshStandardMaterial({color:0x444444,metalness:.5,roughness:.5});
  g._mug=new T.Group();const m=new T.Mesh(new T.CylinderGeometry(.045,.05,.13,10),wd);m.position.set(0,-.07,.05);g._mug.add(m);const fo=new T.Mesh(new T.CylinderGeometry(.04,.04,.01,10),new T.MeshStandardMaterial({color:0xf0e6c8,roughness:1}));fo.position.set(0,-.005,.05);g._mug.add(fo);const hd=new T.Mesh(new T.TorusGeometry(.035,.009,4,8,Math.PI),hoop);hd.rotation.z=-Math.PI/2;hd.position.set(.05,-.07,.05);g._mug.add(hd);g.right.wrist.add(g._mug);
  g._bowl=new T.Mesh(new T.SphereGeometry(.09,12,6,0,Math.PI*2,Math.PI/2,Math.PI/2),wd);g._bowl.material=wd.clone();g._bowl.material.side=T.DoubleSide;g._bowl.position.set(0,-.06,.06);g.left.wrist.add(g._bowl);
  g._spoon=new T.Mesh(new T.BoxGeometry(.015,.16,.012),wd);g._spoon.position.set(0,-.1,.04);g.right.wrist.add(g._spoon);
  // Brotschieber mit Laiben, Hackbeil
  g._peel=new T.Group();const pr=new T.Mesh(new T.CylinderGeometry(.015,.015,1.5,6),wd);pr.position.y=.55;g._peel.add(pr);const pb=new T.Mesh(new T.BoxGeometry(.32,.3,.02),wd);pb.position.y=1.42;g._peel.add(pb);
  g._loaves=new T.Group();for(const dx of[-.08,.08]){const l=new T.Mesh(new T.SphereGeometry(.07,10,7),new T.MeshStandardMaterial({color:0xb07838,roughness:.9}));l.scale.set(1,1.3,.6);l.position.set(dx,1.42,.04);g._loaves.add(l)}g._peel.add(g._loaves);g._peel.position.set(0,-.06,.03);g.right.wrist.add(g._peel);
  g._clv=new T.Group();const ch=new T.Mesh(new T.CylinderGeometry(.014,.016,.16,6),wd);ch.position.y=-.04;g._clv.add(ch);const cb=new T.Mesh(new T.BoxGeometry(.11,.09,.008),hoop);cb.position.set(.04,.07,0);g._clv.add(cb);g._clv.position.set(0,-.06,.03);g.right.wrist.add(g._clv);g._pcross=weapon('pcross');g.right.wrist.add(g._pcross);
  g._platter=new T.Group();const pl=new T.Mesh(new T.CylinderGeometry(.24,.24,.025,16),new T.MeshStandardMaterial({color:0xd8d0c0,roughness:.6}));g._platter.add(pl);const pk=new T.Mesh(new T.SphereGeometry(.12,12,8),new T.MeshStandardMaterial({color:0xa0582a,roughness:.5}));pk.scale.set(1.6,.85,.9);pk.position.y=.09;g._platter.add(pk);const ap=new T.Mesh(new T.SphereGeometry(.035,8,6),new T.MeshStandardMaterial({color:0xb02a20}));ap.position.set(.2,.1,0);g._platter.add(ap);g._platter.position.set(-.17,-.02,.12);g._platter.rotation.x=Math.PI/2;g.right.wrist.add(g._platter)}
 if(g._props){g._mug.visible=ps===3||ps===7||ps===8;g._bowl.visible=ps===4;g._spoon.visible=ps===4;g._peel.visible=ps===9||ps===11;g._loaves.visible=ps===9||ps===11;g._clv.visible=ps===10;g._pcross.visible=ps===14;g._platter.visible=ps===15}
 if(g.tool)g.tool.visible=!((ps>=1&&ps<=12&&ps!==6)||ps===15);
 const br=Math.sin(g.t*1.7)*(1-k);
 let ux=.03+.08*run+.025*k+.006*br,uy=-.12*k*Math.cos(g.phase),uz=.012*Math.sin(g.t*.9)*(1-k),py=.06*k*Math.cos(g.phase),yawA=0;
 const none=type==='none',carry=type==='sword'||bow?.6:1,sw0=mounted?0:.65;
 let R=V(.29,.9+.012*br,.09+sw0*f0[0]*carry),Lh=V(-.29,.9+.012*br,.09+sw0*f1[0]),q=Eu(none?.05:.22,0,none?-.08:-.12),qL=null;
 if(ps===1){R=V(.27,.72,.02);Lh=V(-.27,.72,.02);q=Eu(0,0,0);ux=0;uy=0}
 else if(ps===3){const ph=g.t*.8+(g.id||0),lf=Math.pow(Math.max(0,Math.sin(ph)),3);R=V(.2,1.0,.4).lerp(V(.08,1.43,.24),lf);q=Eu(-1.1*lf,0,0);Lh=V(-.22,.98,.38);ux=.06-.05*lf}
 else if(ps===4){const ph=g.t*1.9+(g.id||0),lf=Math.pow(Math.max(0,Math.sin(ph)),2);R=V(.1,1.02,.44).lerp(V(.06,1.4,.24),lf);q=Eu(-.6*lf,0,0);Lh=V(-.1,1.0,.4);ux=.14}
 else if(ps===2){R=V(.2,.98,.36);Lh=V(-.2,.98,.36);q=Eu(0,0,0)}
 else if(ps===5){R=V(.06,1.12,.32);Lh=V(-.06,1.12,.32);q=Eu(0,0,0);ux+=.1}
 else if(ps===6){const w=Math.sin(g.t*6);R=V(.28,1.75+.05*w,.12);Lh=V(-.28,1.75-.05*w,.12);q=Eu(0,0,0)}
 else if(ps===7){const ph=g.t*.7,tl=Math.max(0,Math.sin(ph));R=V(.18,1.12,.42);q=Eu(0,0,-1.1*tl);Lh=V(-.12,.98,.46)}
 else if(ps===8){R=V(.16,1.12,.4);q=Eu(0,0,0);Lh=V(-.2,.95,.3)}
 else if(ps===15){R=V(.17,1.12,.42);Lh=V(-.17,1.12,.42);q=Eu(-Math.PI/2,0,0)}
 else if(ps===12){R=V(.06,1.12,.32);Lh=V(-.06,1.12,.32);q=Eu(0,0,0);ux+=.12}
 else if(ps===13){const w=Math.sin(g.t*1.3);R=V(.24,1.35+.12*w,.32);q=Eu(-.3,0,0);Lh=V(-.18,1.08,.36);ux-=.03}
 else if(ps===14){R=V(.08,1.3,.25);Lh=V(.0,1.0,.25);q=Eu(0,0,0)}
 else if(ps===9||ps===11){const ph=(g.t*(ps===9?1.2:.9))%1,push=ps===9?Math.sin(ph*Math.PI):1-Math.sin(ph*Math.PI);R=V(.14,1.0,.35+.25*push);Lh=V(-.04,1.06,.12+.25*push);q=Eu(Math.PI/2-.12,0,0);ux+=.1+.12*push}
 else if(ps===10){const ch=Math.pow(Math.abs(Math.sin(g.t*4.2)),.6);R=V(.14,1.0+.38*ch,.42-.1*ch);q=Eu(.9-1.4*ch,0,0);Lh=V(-.16,.99,.46);ux+=.2}
 else if(fx.carry){R=V(.2,1.05,.4);Lh=V(-.2,1.05,.4);q=Eu(0,0,0)}
 else if(fx.pray){R=V(.1,1,.38);Lh=V(-.1,1,.38);q=Eu(0,0,0);ux+=.3}
 else if(fx.work===1||fx.work===3){const pose=workPose(g.role,g.t*(fx.work===3?.65:1),type),k2=Math.sin(g.t*(fx.work===3?3:7));if(pose){R=pose.R;Lh=pose.Lh;q=pose.q;ux+=pose.ux||0;uy+=pose.uy||0;py+=pose.py||0}else{R=V(.16,1,.42+.07*k2);Lh=V(-.16,1,.42-.07*k2);q=Eu(0,0,0);ux+=.18}}
 else if(bow){let draw;const a=fx.aim;
  if(a!==undefined){g.dr=(g.dr||0)+(a-(g.dr||0))*(1-Math.exp(-dt*12));draw=g.dr;if(attacking&&!g.wa)g.rl=.28;g.wa=attacking;if(g.rl>0){g.rl-=dt;draw=0;g.dr=0}}
  else draw=u>=0?(u<.62?ease(u/.58):0):0;
  const rec=(g.rl>0||(a===undefined&&u>=.62&&u<.8))?1:0,e=ease(Math.min(1,draw*2.2)),pull=.08+.42*draw;
  R=V(.18,1.2,.3).lerp(V(.16,1.5,.55),e);R.z-=.05*rec;q=Eu(.2,0,-.15).slerp(Eu(-.04,0,0),e);yawA=.75*e;
  bowString(g.tool,draw>.02?pull:0);
  Lh=V(-.15,1.1,.25).lerp(V(0,0,-pull).applyQuaternion(q).add(R),ease(Math.min(1,draw*2.5)))}
 else if(two||SW){let h,d,tan;
  if(SW){h=SW.h;d=SW.d;const a=swingPose(kind,Math.max(0,u-.03)),b=swingPose(kind,Math.min(1,u+.03));tan=b.h.clone().sub(a.h);if(tan.lengthSq()<1e-6)tan=FW.clone();ux+=SW.lean;uy+=SW.tw;py-=SW.tw*.5}
  else{const K0=SWK[kind][0];h=V(K0[1],K0[2],K0[3]);d=V(K0[4],K0[5],K0[6]).normalize();tan=FW.clone()}
  R=h.clone();q=toolQ(d,tan);Lh=two?R.clone().addScaledVector(d,-.25):V(-.3,1,.25)}
 if(fx.firstPerson&&!SW&&!bow&&!busy){R.y=Math.max(R.y,1.2);R.z=Math.max(R.z,.45);Lh.y=Math.max(Lh.y,1.15);Lh.z=Math.max(Lh.z,.4)}
 if(fx.shield&&!two&&!bow&&!busy){Lh=fx.firstPerson?V(-.32,1.28,.5+(SW?.08:0)):V(-.24,1.12,.36+(SW?.08:0));qL=Eu(0,fx.firstPerson?.5:.25,0)}
 else if(fx.torch&&!two&&!bow&&!busy){Lh=V(-.3,1.15,.38);qL=Eu(.35,0,.15)}
 up.rotation.set(ux,uy-yawA,uz);pel.rotation.y=py-yawA*.45;up.scale.y=1+br*.004;
 if(yawA)q=Eu(0,yawA,0).multiply(q);
 const L=v=>{v=v.clone();if(yawA){const c=Math.cos(yawA),s=Math.sin(yawA);v.set(v.x*c+v.z*s,v.y,-v.x*s+v.z*c)}v.y-=.95;return v};
 solve(g.right,L(R),q);solve(g.left,L(Lh),qL||(two?q:new T.Quaternion()));
}

// Schilde für die linke Hand: Rundschild, Wappenschild, Normannenschild (Fläche zeigt nach vorn, +z)
const SHM=new Map();function shm(c,o={}){const k=c+JSON.stringify(o);if(!SHM.has(k))SHM.set(k,new T.MeshStandardMaterial({color:c,roughness:.75,side:T.DoubleSide,...o}));return SHM.get(k)}
// Wappenschild: geviert in Fraktionsfarbe und Silber, goldene Kreuzbänder mit Nieten, Löwen, Burgen und Doppeladler
const HERALD=new Map();
export const COA_N=['Löwen & Burgen','Adler','Kreuz','Lilien','Schach','Hirsch','Schrägbalken','Turm'];
function heraldTex(col,coa=0){const key=col+':'+coa;if(HERALD.has(key))return HERALD.get(key);const W=256,H=340,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d'),hex='#'+new T.Color(col).getHexString(),dk='#'+new T.Color(col).multiplyScalar(.7).getHexString(),SIL='#e4e2dc',SILD='#c8c6c0',GOLD='#e8c040';
 const grain=(c1,c2,x0,y0,w,h)=>{x.fillStyle=c1;x.fillRect(x0,y0,w,h);for(let i=0;i<500;i++){x.fillStyle=Math.random()<.5?c2:'rgba(255,255,255,.08)';x.fillRect(x0+Math.random()*w,y0+Math.random()*h,2,2)}};
 const lion=(cx,cy,s,fill='#5a5a58')=>{x.save();x.translate(cx,cy);x.scale(s,s);x.fillStyle=fill;x.strokeStyle='#2a2a28';x.lineWidth=2;x.beginPath();
  x.moveTo(-14,26);x.lineTo(-10,6);x.lineTo(-20,-4);x.lineTo(-12,-8);x.lineTo(-6,-24);x.lineTo(4,-30);x.lineTo(12,-24);x.lineTo(8,-16);x.lineTo(16,-12);x.lineTo(8,-6);x.lineTo(14,4);x.lineTo(22,0);x.lineTo(18,12);x.lineTo(8,10);x.lineTo(10,26);x.lineTo(2,26);x.lineTo(0,12);x.lineTo(-6,26);x.closePath();x.fill();x.stroke();
  x.beginPath();x.moveTo(-14,10);x.quadraticCurveTo(-30,0,-22,-14);x.stroke();x.restore()};
 const castle=(cx,cy,s,fill='#7a7468')=>{x.save();x.translate(cx,cy);x.scale(s,s);x.fillStyle=fill;x.strokeStyle='#2a2a28';x.lineWidth=2;x.fillRect(-22,-4,44,30);x.strokeRect(-22,-4,44,30);x.fillRect(-10,-26,20,22);x.strokeRect(-10,-26,20,22);
  for(const[bx,by,bw]of[[-22,-10,8],[-8,-10,8],[14,-10,8],[-10,-32,6],[4,-32,6]]){x.fillRect(bx,by,bw,6);x.strokeRect(bx,by,bw,6)}x.fillStyle='#2a2420';x.beginPath();x.moveTo(-6,26);x.lineTo(-6,12);x.arc(0,12,6,Math.PI,0);x.lineTo(6,26);x.fill();x.restore()};
 const eagle=(cx,cy,s,fill,two=false)=>{x.save();x.translate(cx,cy);x.scale(s,s);x.fillStyle=fill;x.strokeStyle='#1a1a18';x.lineWidth=2;for(const sd of[-1,1]){x.beginPath();x.moveTo(0,-6);x.lineTo(sd*34,-26);x.lineTo(sd*30,-14);x.lineTo(sd*40,-12);x.lineTo(sd*30,-2);x.lineTo(sd*36,4);x.lineTo(sd*16,6);x.closePath();x.fill();x.stroke();if(two){x.beginPath();x.arc(sd*9,-24,6,0,7);x.fill();x.stroke()}}
  if(!two){x.beginPath();x.arc(0,-24,7,0,7);x.fill();x.stroke()}x.beginPath();x.ellipse(0,4,12,20,0,0,7);x.fill();x.stroke();x.beginPath();x.moveTo(-8,22);x.lineTo(0,36);x.lineTo(8,22);x.fill();x.restore()};
 const lily=(cx,cy,s,fill)=>{x.save();x.translate(cx,cy);x.scale(s,s);x.fillStyle=fill;x.strokeStyle='#4a3a10';x.lineWidth=2;x.beginPath();x.moveTo(0,-30);x.quadraticCurveTo(10,-12,0,6);x.quadraticCurveTo(-10,-12,0,-30);x.fill();x.stroke();for(const sd of[-1,1]){x.beginPath();x.moveTo(sd*3,4);x.quadraticCurveTo(sd*26,-14,sd*18,-22);x.quadraticCurveTo(sd*22,0,sd*4,10);x.fill();x.stroke()}x.fillRect(-14,6,28,6);x.strokeRect(-14,6,28,6);x.beginPath();x.moveTo(-6,12);x.lineTo(0,26);x.lineTo(6,12);x.fill();x.restore()};
 const stag=(cx,cy,s,fill)=>{x.save();x.translate(cx,cy);x.scale(s,s);x.strokeStyle=fill;x.lineCap='round';x.lineWidth=6;for(const sd of[-1,1]){x.beginPath();x.moveTo(sd*6,-8);x.lineTo(sd*20,-34);x.lineTo(sd*30,-40);x.moveTo(sd*14,-22);x.lineTo(sd*30,-24);x.moveTo(sd*18,-30);x.lineTo(sd*10,-44);x.stroke()}x.fillStyle=fill;x.beginPath();x.ellipse(0,10,14,20,0,0,7);x.fill();x.restore()};
 const star=(cx,cy,R0,fill)=>{x.fillStyle=fill;x.beginPath();for(let q=0;q<10;q++){const a=q/10*Math.PI*2-Math.PI/2,rr=q%2?R0*.4:R0;x.lineTo(cx+Math.cos(a)*rr,cy+Math.sin(a)*rr)}x.closePath();x.fill()};
 if(coa===1){grain(hex,dk,0,0,W,H);eagle(W/2,H*.42,2.4,GOLD)}
 else if(coa===2){grain(SIL,SILD,0,0,W,H);x.fillStyle=hex;x.fillRect(W/2-26,0,52,H);x.fillRect(0,H*.38-26,W,52)}
 else if(coa===3){grain(hex,dk,0,0,W,H);for(const[cx,cy]of[[W*.3,H*.22],[W*.7,H*.22],[W/2,H*.55]])lily(cx,cy,1.6,GOLD)}
 else if(coa===4){for(let r0=0;r0<8;r0++)for(let c0=0;c0<6;c0++){x.fillStyle=(r0+c0)%2?hex:SIL;x.fillRect(c0*W/6,r0*H/8,W/6+1,H/8+1)}}
 else if(coa===5){grain(SIL,SILD,0,0,W,H);stag(W/2,H*.45,2.2,hex)}
 else if(coa===6){grain(hex,dk,0,0,W,H);x.save();x.translate(W/2,H/2);x.rotate(-.75);x.fillStyle=SIL;x.fillRect(-W,-32,W*2,64);x.restore();star(W*.25,H*.72,22,GOLD);star(W*.75,H*.2,22,GOLD)}
 else if(coa===7){grain(hex,dk,0,0,W,H);castle(W/2,H*.42,2.6,'#d8d2c0')}
 else{grain(SIL,SILD,0,0,W/2,H*.45);grain(hex,dk,W/2,0,W/2,H*.45);grain(hex,dk,0,H*.45,W/2,H*.55);grain(SIL,SILD,W/2,H*.45,W/2,H*.55);
  lion(W*.27,H*.24,1.6);castle(W*.73,H*.24,1.5);castle(W*.27,H*.72,1.5);lion(W*.73,H*.72,1.6);
  const gold=x.createLinearGradient(0,0,W,0);gold.addColorStop(0,'#a07818');gold.addColorStop(.5,'#f0d070');gold.addColorStop(1,'#a07818');x.fillStyle=gold;x.fillRect(W/2-9,0,18,H);x.fillRect(0,H*.45-9,W,18);
  x.fillStyle='#fff2b0';for(let y=12;y<H;y+=26){x.beginPath();x.arc(W/2,y,2.6,0,7);x.fill()}for(let X=12;X<W;X+=26){x.beginPath();x.arc(X,H*.45,2.6,0,7);x.fill()}
  eagle(W/2,H*.45,1,'#4a4a48',true)}
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;const m=new T.MeshStandardMaterial({map:t,roughness:.55,metalness:.15});HERALD.set(key,m);return m}
export function shieldMesh(kind,col=0x8a2a22,coa=0){const g=new T.Group();g.name='Shield:'+kind;
 if(kind==='heater'){const sh=new T.Shape();sh.moveTo(-.31,.42);sh.quadraticCurveTo(0,.34,.31,.42);sh.lineTo(.3,.06);sh.quadraticCurveTo(.27,-.28,0,-.46);sh.quadraticCurveTo(-.27,-.28,-.3,.06);sh.closePath();
  const back=new T.ExtrudeGeometry(sh,{depth:.035,bevelEnabled:false});back.translate(0,0,-.035);mesh(back,shm(0x5a4028),g);
  const face=new T.ShapeGeometry(sh,24),uv=face.attributes.uv,pp=face.attributes.position;for(let i=0;i<uv.count;i++)uv.setXY(i,(pp.getX(i)+.31)/.62,(pp.getY(i)+.46)/.88);mesh(face,heraldTex(col,coa|0),g,[0,0,.002]);
  const goldM=shm(0xc8a040,{metalness:.75,roughness:.3}),pts=sh.getPoints(48).map(p=>V(p.x,p.y,.004));mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts,true),80,.016,6,true),goldM,g);
  for(let i=0;i<pts.length;i+=3){const p=pts[i];mesh(new T.SphereGeometry(.009,6,4),goldM,g,[p.x*.94,p.y*.95,.012])}
  g.traverse(o=>{if(o.isMesh)o.castShadow=true});return g}
const wood=shm(0x7a5a3a),iron=shm(0x55595c,{metalness:.6,roughness:.45}),paint=shm(col),light=shm(0xe8dcc0);
 if(kind==='round'){const d=mesh(new T.CylinderGeometry(.34,.34,.035,28),wood,g);d.rotation.x=Math.PI/2;for(let i=0;i<6;i++){const s=mesh(new T.BoxGeometry(.025,.66,.01),i%2?paint:wood,g,[-.28+i*.112,0,.02]);s.scale.y=Math.sqrt(Math.max(.05,1-((-.28+i*.112)/.34)**2))}
  const rim=mesh(new T.TorusGeometry(.34,.016,6,32),iron,g,[0,0,.012]);const boss=mesh(new T.SphereGeometry(.075,14,8,0,Math.PI*2,0,Math.PI/2),iron,g,[0,0,.02]);boss.rotation.x=Math.PI/2}
 else{const sh=new T.Shape();if(kind==='heater'){sh.moveTo(-.27,.3);sh.lineTo(.27,.3);sh.lineTo(.27,.05);sh.quadraticCurveTo(.25,-.22,0,-.38);sh.quadraticCurveTo(-.25,-.22,-.27,.05);sh.closePath()}
  else{sh.moveTo(0,.42);sh.quadraticCurveTo(.27,.4,.27,.2);sh.quadraticCurveTo(.22,-.3,0,-.62);sh.quadraticCurveTo(-.22,-.3,-.27,.2);sh.quadraticCurveTo(-.27,.4,0,.42)}
  const geo=new T.ExtrudeGeometry(sh,{depth:.03,bevelEnabled:true,bevelThickness:.008,bevelSize:.012,bevelSegments:1});geo.translate(0,0,-.015);mesh(geo,paint,g);
  const pts=sh.getPoints(40).map(p=>V(p.x,p.y,.025));mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts,true),60,.012,5,true),iron,g);

  {for(const a of[0,1,2,3]){const b=mesh(new T.BoxGeometry(.03,.42,.01),light,g,[0,-.05,.028]);b.rotation.z=a*Math.PI/4}mesh(new T.SphereGeometry(.05,10,6),iron,g,[0,-.05,.03])}}
 g.traverse(o=>{if(o.isMesh)o.castShadow=true});return g}
export function setShield(c,kind,col,coa=0){if(!c.isCharacter)return;if(c.shieldKind===kind&&c.shieldCol===col&&c.shieldCoa===coa)return;c.shieldCoa=coa;if(c.shield){c.shield.removeFromParent();c.shield=null}c.shieldKind=kind;c.shieldCol=col;if(!kind)return;c.shield=shieldMesh(kind,col,coa);c.shield.position.set(-.02,-.05,.07);c.left.wrist.add(c.shield)}
