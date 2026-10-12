// Eisenbahn (Neuzeit): Bahnhof im Gründerzeitstil mit Bahnsteig und Gleis, Gleisstrecke zum Kartenrand, Dampfzug (Lok, Tender, Wagen).
import * as T from 'three';
const MAT=new Map(),M=(c,o={})=>{const k=c+JSON.stringify(o);if(!MAT.has(k))MAT.set(k,new T.MeshStandardMaterial({color:c,roughness:.75,...o}));return MAT.get(k)};
function add(g,geo,m,x,y,z){const o=new T.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;g.add(o);return o}
const box=(g,w,h,d,m,x,y,z)=>add(g,new T.BoxGeometry(w,h,d),m,x,y,z);
const cyl=(g,r1,r2,h,m,x,y,z,s=14)=>add(g,new T.CylinderGeometry(r1,r2,h,s),m,x,y,z);
// Gleisstück entlang x: Schotterbett, Schwellen, zwei Schienen (Spur 1,435 m)
export function track(len,g=new T.Group(),x0=0){const ballast=M(0x8a8478,{roughness:1}),sleeper=M(0x4a3a2a,{roughness:.9}),rail=M(0x6a6a70,{metalness:.7,roughness:.35});
 box(g,len,.18,2.6,ballast,x0+len/2,.09,0);for(let x=.3;x<len;x+=.65)box(g,.22,.1,2.2,sleeper,x0+x,.22,0);for(const z of[-.72,.72])box(g,len,.12,.08,rail,x0+len/2,.33,z);return g}
export const TRACK_Z_SHIFT=2.4;
export function stationMesh(H={}){const g=new T.Group(),wall=M(0xe8d8b0),trim=M(0xf4eee0),roof=H.slate||M(0x5a5e64),stone=M(0x9a948a),win=M(0x2a3440,{roughness:.2,metalness:.3}),iron=M(0x2a2e30,{metalness:.5,roughness:.5}),glass=M(0x9ab0b8,{transparent:true,opacity:.45,roughness:.1});
 g.colliders=[];g.walkAreas=[];
 // Gleis durch den ganzen Bauplatz (Bahnsteigseite +z)
 track(14,g,-7);
 // Bahnsteig mit Kante
 box(g,13,.5,2.4,stone,0,.25,2.6);box(g,13,.08,.3,trim,0,.52,1.5);g.walkAreas.push([0,2.6,6.5,1.2,.5]);
 // Empfangsgebäude: Mittelbau mit Uhrgiebel, zwei Flügel, Rundbogenfenster, Gesimse
 const bz=4.9;box(g,9,4.2,2.6,wall,0,2.1,bz);g.colliders.push([0,bz,4.5,1.3,4.2,0]);box(g,9.2,.25,2.8,trim,0,4.25,bz);box(g,9.2,.35,2.8,stone,0,.17,bz);
 box(g,3,1.6,2.7,wall,0,5.1,bz);const tri=new T.Shape();tri.moveTo(-1.6,0);tri.lineTo(1.6,0);tri.lineTo(0,1);tri.closePath();const tg=new T.ExtrudeGeometry(tri,{depth:2.7,bevelEnabled:false});tg.translate(0,5.9,bz-1.35);add(g,tg,trim,0,0,0);
 const clk=add(g,new T.CircleGeometry(.45,24),M(0xf2ecd8),0,5.2,bz-1.36);clk.rotation.y=Math.PI;box(g,.04,.35,.02,iron,0,5.32,bz-1.38);
 for(const x of[-3.6,-2.2,-.8,.8,2.2,3.6]){box(g,.7,1.5,.06,win,x,2.3,bz-1.31);box(g,.85,.12,.1,trim,x,3.12,bz-1.33);box(g,.7,1.5,.06,win,x,2.3,bz+1.31)}
 box(g,1.2,2.4,.08,M(0x4a3020),0,1.2,bz+1.32);
 const rg=new T.ExtrudeGeometry((()=>{const s=new T.Shape();s.moveTo(-1.5,0);s.lineTo(1.5,0);s.lineTo(.4,1.1);s.lineTo(-.4,1.1);s.closePath();return s})(),{depth:9.4,bevelEnabled:false});rg.translate(0,0,-4.7);rg.rotateY(Math.PI/2);add(g,rg,roof,0,4.35,bz);
 // Bahnsteigdach: gusseiserne Säulen, Glasdach
 for(const x of[-5.5,-2.75,0,2.75,5.5]){cyl(g,.08,.1,3,iron,x,2,2.9);box(g,.5,.08,.08,iron,x,3.45,2.6)}box(g,12.4,.1,2.6,iron,0,3.55,2.6);box(g,12.4,.04,2.5,glass,0,3.62,2.6);
 // Laternen, Bank, Bahnhofsschild
 for(const x of[-4,4]){cyl(g,.05,.06,2.2,iron,x,1.6,1.8,8);box(g,.25,.3,.25,M(0xf2e6b0,{emissive:0xffc860,emissiveIntensity:.6}),x,2.85,1.8)}
 box(g,1.4,.08,.4,M(0x6a4a2c),-2,.95,3.4);box(g,3,.45,.06,M(0x1e3a2a),0,3.3,bz-1.34);
 for(const c of g.children)c.position.z-=TRACK_Z_SHIFT;for(const c of g.colliders)c[1]-=TRACK_Z_SHIFT;for(const w of g.walkAreas)w[1]-=TRACK_Z_SHIFT;   // Bauplatz mittig: Gleis bei z = −2,4
 g.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true}});return g}
// Dampfzug: Lok mit Kessel, Schornstein, Führerhaus; Tender; zwei Personenwagen. Fahrtrichtung +z.
export function trainMesh(){const g=new T.Group(),blk=M(0x1e1e22,{metalness:.4,roughness:.5}),red=M(0x8a1e1a),grn=M(0x2a4a32),brass=M(0xc09a40,{metalness:.7,roughness:.3}),wheel=M(0x6a1a14),win=M(0xd8e0e4,{roughness:.2});
 const wheels=(z,n=2,r=.42)=>{for(const sx of[-1,1])for(let i=0;i<n;i++){const w=cyl(g,r,r,.1,wheel,sx*.72,r,z+i*1.1-(n-1)*.55,16);w.rotation.z=Math.PI/2}};
 // Lok (vorn bei +z)
 box(g,1.7,.3,5.2,blk,0,.75,3.2);const kessel=cyl(g,.62,.62,3.4,blk,0,1.55,3.9,18);kessel.rotation.x=Math.PI/2;cyl(g,.64,.64,.12,brass,0,1.55,3.0,18).rotation.x=Math.PI/2;
 cyl(g,.18,.3,1.1,blk,0,2.65,5.1,12);cyl(g,.32,.2,.25,blk,0,3.25,5.1,12);cyl(g,.2,.2,.35,brass,0,2.35,4.1,12);box(g,1.9,1.6,1.6,red,0,2.0,1.5);box(g,2.0,.12,1.8,blk,0,2.85,1.5);box(g,1.0,.6,.06,win,0,2.3,2.32);
 cyl(g,.62,.62,.2,blk,0,1.55,5.65,18).rotation.x=Math.PI/2;box(g,1.8,.15,.4,red,0,.6,5.9);wheels(3.4,3,.5);
 // Tender
 box(g,1.8,1.2,2.4,blk,0,1.3,-.6);box(g,1.6,.3,2.2,M(0x1a1a1a,{roughness:1}),0,1.95,-.6);wheels(-.6,2,.38);
 // Personenwagen
 for(const z of[-4.6,-9.0]){box(g,2.0,1.7,4,grn,0,1.6,z);box(g,2.1,.15,4.1,blk,0,2.5,z);for(let i=0;i<4;i++)for(const sx of[-1,1])box(g,.04,.6,.6,win,sx*1.01,1.9,z-1.4+i*.95);wheels(z,2,.38);box(g,1.5,.2,.5,blk,0,.75,z+2.25)}
 // Rauch
 const smoke=new T.Group();g.add(smoke);for(let i=0;i<8;i++){const s=new T.Mesh(new T.SphereGeometry(.3+i*.06,8,6),new T.MeshStandardMaterial({color:0xcfcfcf,transparent:true,opacity:.5,depthWrite:false}));smoke.add(s)}
 g.userData.smoke=smoke;g.anim=(dt,t)=>{smoke.children.forEach((s,i)=>{const u=((t*.6+i/8)%1);s.position.set(Math.sin(i*2)*.2*u,3.3+u*3,5.1-u*2.5);s.scale.setScalar(.6+u*1.8);s.material.opacity=.5*(1-u)})};
 g.traverse(o=>{if(o.isMesh)o.castShadow=true});return g}
