// Feuerwehr: von Hand gezogene Handdruckspritze mit vierköpfiger Mannschaft (Barock, Napoleon, Neuzeit).
// Der Server schickt [x,z,ry,status,zielX,zielZ]; status 0 = Anfahrt, 1 = Pumpen/Spritzen, 2 = Rückfahrt, 3 = geparkt am Spritzenhaus.
import * as THREE from 'three';
import {createCharacter,setTool,animateCharacter} from './characters.js';
import {look} from './people.js';

const M=(c,o={})=>new THREE.MeshStandardMaterial({color:c,roughness:.7,...o});
function add(g,geo,mat,x,y,z){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;g.add(m);return m}

// Spritzenwagen: Kasten (Wasserbehälter) auf zwei großen Speichenrädern, Windkessel, Druckbaum mit Griffen, Schlauchrolle, Deichsel
function engine(era){const g=new THREE.Group(),neu=era==='neuzeit',wheel=M(neu?0xa8281e:0x6a4a2c),box=M(neu?0x22261e:0x5a3e26),brass=M(0xc09a40,{metalness:.7,roughness:.3}),iron=M(0x2a2a2a,{metalness:.5,roughness:.5}),hoseM=M(0x5a3a22,{roughness:.9});
 for(const sx of[-1,1]){const w=new THREE.Group();w.position.set(sx*.68,.55,-.15);g.add(w);const rim=add(w,new THREE.TorusGeometry(.52,.04,6,24),wheel,0,0,0);rim.rotation.y=Math.PI/2;
  for(let i=0;i<12;i++){const sp=add(w,new THREE.BoxGeometry(.03,.98,.035),wheel,0,0,0);sp.rotation.x=i/12*Math.PI}add(w,new THREE.CylinderGeometry(.09,.09,.16,10),iron,0,0,0).rotation.z=Math.PI/2;g.userData['w'+sx]=w}
 add(g,new THREE.CylinderGeometry(.035,.035,1.5,8),iron,0,.55,-.15).rotation.z=Math.PI/2;                                          // Achse
 if(era==='roemer'){const b=add(g,new THREE.CylinderGeometry(.42,.42,1.2,14),box,0,.95,-.1);b.rotation.x=Math.PI/2;for(const z of[-.55,-.1,.35])add(g,new THREE.TorusGeometry(.43,.025,5,16),brass,0,.95,z-.1+.1)}   // Wasserfass (Vigiles)
 else{add(g,new THREE.BoxGeometry(.95,.62,1.25),box,0,.95,-.1);add(g,new THREE.BoxGeometry(1.0,.05,1.3),brass,0,1.28,-.1)}                 // Wasserkasten mit Messingkante
 if(neu){const lab=add(g,new THREE.PlaneGeometry(.6,.22),M(0xd8c890),0,.98,.53);}                                                     // Aufschrift-Feld
 add(g,new THREE.CylinderGeometry(.13,.13,.5,12),brass,0,1.55,-.35);add(g,new THREE.SphereGeometry(.13,12,8),brass,0,1.8,-.35);        // Windkessel
 const lever=new THREE.Group();lever.position.set(0,1.62,-.05);g.add(lever);add(lever,new THREE.BoxGeometry(2.5,.07,.08),M(0x6a4a2c),0,0,0);for(const sx of[-1,1])add(lever,new THREE.CylinderGeometry(.03,.03,.5,8),M(0x8a6a44),sx*1.25,0,0).rotation.x=Math.PI/2;
 add(g,new THREE.BoxGeometry(.1,.4,.1),iron,0,1.42,-.05);g.userData.lever=lever;                                                      // Druckbaum auf Bock
 const coil=add(g,new THREE.TorusGeometry(.26,.06,8,20),hoseM,0,1.1,-.85);coil.rotation.y=Math.PI/2;                                 // Schlauchrolle hinten
 for(const sx of[-1,1])add(g,new THREE.BoxGeometry(.05,.05,1.9),M(0x6a4a2c),sx*.32,.7,1.3).rotation.x=.18;add(g,new THREE.BoxGeometry(.75,.05,.05),M(0x6a4a2c),0,.53,2.2);   // Deichsel
 add(g,new THREE.BoxGeometry(.06,.5,.06),iron,0,.3,-.8);                                                                               // Stütze
 return g}

function crewLook(era,i){const L=look(900+i,'peasant');Object.assign(L,{outfit:'jerkin',uni:true,apron:false,bag:false,rolled:false,cloak:0,mask:false,female:false,hairStyle:'short',acc:[]});
 if(era==='neuzeit')Object.assign(L,{over:0x1c2030,cloth:0x1c2030,head:'pickel',pkBrass:true,beard:i%2?'none':'short',title:'Feuerwehrmann'});
 else if(era==='roemer')Object.assign(L,{outfit:'tunic',uni:false,cloth:0x8a6a4a,over:0x8a6a4a,head:'none',beard:'short',title:'Vigil'});
 else Object.assign(L,{over:0x6a4a2c,cloth:0x3a3430,head:i%2?'tricorne':'hunterhat',hatCol:0x2a2420,title:'Spritzenmann'});return L}

export function fireBrigade(era,heightAt,sprayMat){const root=new THREE.Group(),cart=engine(era);root.add(cart);
 const crew=[0,1,2,3].map(i=>{const c=createCharacter(0,'sword',{person:crewLook(era,i)});setTool(c,'none');root.add(c);return c});
 // Wasserstrahl aus dem Strahlrohr
 const N=160,pos=new Float32Array(N*3),geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));const jet=new THREE.Points(geo,sprayMat);jet.frustumCulled=false;jet.visible=false;root.add(jet);
 const hose=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0,1.1,-.6),new THREE.Vector3(.4,.1,.6),new THREE.Vector3(.3,.9,1.9)]),16,.035,6,false),M(0x5a3a22,{roughness:.9}));hose.visible=false;cart.add(hose);
 const st={x:0,z:0,ry:0,s:3,tx:0,tz:0,init:false,t:0};
 function update(dt,d){if(!d){root.visible=false;return}root.visible=true;const[x,z,ry,s,tx,tz]=d;
  if(!st.init){st.x=x;st.z=z;st.ry=ry;st.init=true}const k=Math.min(1,dt*4);const dx=x-st.x,dz=z-st.z,moving=Math.hypot(dx,dz)>.05&&s!==1&&s!==3;st.x+=dx*k;st.z+=dz*k;
  let dr=ry-st.ry;dr=Math.atan2(Math.sin(dr),Math.cos(dr));st.ry+=dr*k;st.s=s;st.tx=tx;st.tz=tz;st.t+=dt;
  root.position.set(st.x,heightAt(st.x,st.z),st.z);root.rotation.y=st.ry;
  const speed=moving?3:0;for(const sx of[-1,1])cart.userData['w'+sx].rotation.x-=speed*dt/.55;
  const lever=cart.userData.lever;lever.rotation.z=s===1?Math.sin(st.t*5)*.28:0;
  const crewOn=s!==3;const P=s===1?[[-1.25,0,0,Math.PI/2],[1.25,0,0,-Math.PI/2],[.3,0,2.0,0],[-.7,0,1.2,0]]:[[-.32,0,2.35,0],[.32,0,2.35,0],[-.45,0,-1.15,0],[.45,0,-1.15,0]];
  crew.forEach((c,i)=>{c.visible=crewOn;const p=P[i];c.position.set(p[0],s===1&&i<2?Math.max(0,-Math.sin(st.t*5+(i?Math.PI:0))*.08):0,p[2]);c.rotation.y=p[3];animateCharacter(c,dt,s===1?0:speed,false,false,{})});
  hose.visible=jet.visible=s===1;if(s===1){const lx=(tx-st.x),lz=(tz-st.z),c=Math.cos(-st.ry),sn=Math.sin(-st.ry),L=Math.hypot(lx,lz),fx=0,fz=Math.max(2,L-1.5);
   for(let i=0;i<N;i++){const u=((st.t*1.3+i/N)%1),jx=Math.sin(i*12.9)*.06,jz=Math.cos(i*7.3)*.06;pos[i*3]=.3+jx;pos[i*3+1]=1.2+u*2.2-u*u*1.4;pos[i*3+2]=2.1+u*(fz-1.6)+jz}geo.attributes.position.needsUpdate=true}}
 return{group:root,update}}
