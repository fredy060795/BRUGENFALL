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
const kindOf=t=>t==='pickaxe'?'pick':(SWK[t]?t:'sword'),FW=V(0,0,1);
function swingPose(kind,u){const K=SWK[kind];let i=1;while(i<K.length-1&&u>K[i][0])i++;const a=K[i-1],b=K[i],s=Math.max(0,Math.min(1,(u-a[0])/(b[0]-a[0]))),e=b[11]==='in'?s*s:b[11]==='out'?1-(1-s)*(1-s):s*s*(3-2*s),m=j=>a[j]+(b[j]-a[j])*e;
 return{h:V(m(1),m(2),m(3)),d:V(m(4),m(5),m(6)).normalize(),lean:m(7),tw:m(8),pz:m(9),pd:m(10)}}
function toolQ(d,hint){const y=d.clone().normalize(),x=hint.clone().addScaledVector(y,-hint.dot(y));if(x.lengthSq()<1e-4)x.set(1,0,0).addScaledVector(y,-y.x);x.normalize();const z=new T.Vector3().crossVectors(x,y);return new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(x,y,z))}
export function animateCharacter(g,dt,speed,attacking,mounted=false,fx={}){
 const pel=g.pelvis,up=g.upper;if(!pel)return;
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
 const br=Math.sin(g.t*1.7)*(1-k);
 let ux=.03+.08*run+.025*k+.006*br,uy=-.12*k*Math.cos(g.phase),uz=.012*Math.sin(g.t*.9)*(1-k),py=.06*k*Math.cos(g.phase),yawA=0;
 const none=type==='none',carry=type==='sword'||bow?.6:1,sw0=mounted?0:.65;
 let R=V(.29,.9+.012*br,.09+sw0*f0[0]*carry),Lh=V(-.29,.9+.012*br,.09+sw0*f1[0]),q=Eu(none?.05:.22,0,none?-.08:-.12),qL=null;
 if(fx.carry){R=V(.2,1.05,.4);Lh=V(-.2,1.05,.4);q=Eu(0,0,0)}
 else if(fx.pray){R=V(.1,1,.38);Lh=V(-.1,1,.38);q=Eu(0,0,0);ux+=.3}
 else if(fx.work===1||fx.work===3){const k2=Math.sin(g.t*(fx.work===3?3:7));R=V(.16,1,.42+.07*k2);Lh=V(-.16,1,.42-.07*k2);q=Eu(0,0,0);ux+=.18}
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
 if(fx.torch&&!two&&!bow&&!busy){Lh=V(-.3,1.15,.38);qL=Eu(.35,0,.15)}
 up.rotation.set(ux,uy-yawA,uz);pel.rotation.y=py-yawA*.45;up.scale.y=1+br*.004;
 if(yawA)q=Eu(0,yawA,0).multiply(q);
 const L=v=>{v=v.clone();if(yawA){const c=Math.cos(yawA),s=Math.sin(yawA);v.set(v.x*c+v.z*s,v.y,-v.x*s+v.z*c)}v.y-=.95;return v};
 solve(g.right,L(R),q);solve(g.left,L(Lh),qL||(two?q:new T.Quaternion()));
}
