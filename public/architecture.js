import * as T from 'three';
// All structural parts also feed the player's collision shapes.
export function installArchitecture(PT,BLD,F){
 const {roomN,Ftab,Fbed,Fstool,Fbar,Fhearth,Fsack}=F;
 // Two 4 x 4 modules with a continuous four-metre-high wall walk.
 PT.gate=[[2.3,4,4,-2.85,2,0,'S'],[2.3,4,4,2.85,2,0,'S'],[8,.65,4,0,3.675,0,'S',0],
 [8,.45,.35,0,4.225,1.82,'S',0],...Array.from({length:8},(_,i)=>[.58,.9,.45,-3.5+i,4.9,1.8,'S',0])];
 PT.portcullis=PT.gate;
 PT.moat=[]; // One union surface is built for all connected moat tiles.
 // Side portal in the long east wall; solid short front facade.
 PT.church=roomN(8,12,5.5,.5,'S',0).filter((p,i)=>i!==2);
 PT.church.push([.5,5.5,8,3.75,2.75,-2,'S'],[.5,5.5,1,3.75,2.75,5.5,'S'],[.5,2.4,3,3.75,4.3,3.5,'S']);
 // Rebuild furnishings explicitly (altar remains at negative Z).
 for(const z of[-1.5,.2,1.9])for(const x of[-1.5,1.5])PT.church.push([2.2,.5,.5,x,.25,z,'W'],[2.2,.5,.1,x,.75,z+.25,'W',0]);
 PT.church.push([2.2,1,.9,0,.5,-5,'S'],[.1,1.5,.1,0,1.9,-5,'Z',0],[.7,.1,.1,0,2.3,-5,'Z',0]);
 // Farmhouse plus barn, herb beds, field and an enclosing fence.
 BLD.farm=[8,6,3.2,'P',2.6,2.4];PT.farm=roomN(8,6,3.2,.35,'P',2.4);
 PT.farm.push(...Ftab(1.7,.3,2),...Fstool(1.7,1.2),...Fbed(-2,-1.8),...Fhearth(2.8,-2.1),...Fbar(-3,1.5),...Fsack(-2.2,1.8));
 const barn=roomN(4,5,3,.3,'W',2);for(const p of barn){const q=p.slice();q[3]-=6;q[5]-=.5;PT.farm.push(q)}
 PT.farm.push([4.4,.2,5.5,-6,3.15,-.5,'R',0],...Fsack(-6,-2),...Fsack(-5,-2),[2,.9,1,-6,.45,.3,'Y']);
 for(const y of[.4,.85])PT.farm.push([18,.1,.1,0,y,-6,'W'],[.1,.1,14,-9,y,1,'W'],[.1,.1,14,9,y,1,'W'],[7.8,.1,.1,-5.1,y,8,'W'],[7.8,.1,.1,5.1,y,8,'W']);
 for(let x=-9;x<=9;x+=1.5)for(const z of[-6,8])if(z<0||Math.abs(x)>1.2)PT.farm.push([.12,1.15,.12,x,.575,z,'W']);
 for(let z=-4.5;z<8;z+=1.5)for(const x of[-9,9])PT.farm.push([.12,1.15,.12,x,.575,z,'W']);
 for(const x of[5.1,7.1]){PT.farm.push([1.5,.2,4,x,.1,-.2,'E',0]);for(let z=-1.7;z<=1.4;z+=.5)PT.farm.push([.45,.45,.4,x,.35,z,'G',0]);}
 PT.farm.push([6,.08,3.3,-4,.08,5.3,'E',0]);for(let x=-6.6;x<-1.4;x+=.55)for(let z=4;z<6.7;z+=.5)PT.farm.push([.06,.8,.06,x,.5,z,'Y',0]);
 PT.farm.push([.12,2.2,.12,-4,1.1,5.5,'W'],[1.7,.12,.12,-4,1.6,5.5,'W',0],[.55,.7,.35,-4,1.4,5.5,'Y',0],[.4,.4,.4,-4,2,5.5,'Y',0],[.7,.1,.65,-4,2.2,5.5,'W',0]);
}
export function details(g,k,{bx,MT,mS,mW,mR}){
 if(k==='church'||k==='cathedral'){
 const w=k==='church'?8:12,depth=k==='church'?12:16,h=k==='church'?5.5:8;
 // Gothic lancets with stone surrounds, tracery and coloured glass.
 for(const side of[-1,1])for(const z of[-depth/2+2.5,-depth/2+5.2,depth/2-2.7]){
 if(k==='church'&&side===1&&z>1)continue;
 const group=new T.Group();group.position.set(side*(w/2+.025),h*.48,z);group.rotation.y=side*Math.PI/2;
 const sh=new T.Shape();sh.moveTo(-.6,0);sh.lineTo(.6,0);sh.lineTo(.6,1.35);sh.quadraticCurveTo(.5,1.75,0,2.2);sh.quadraticCurveTo(-.5,1.75,-.6,1.35);sh.closePath();
 const glass=new T.Mesh(new T.ShapeGeometry(sh),new T.MeshStandardMaterial({color:0x415fa7,emissive:0x3559a0,emissiveIntensity:.35,side:T.DoubleSide,roughness:.3}));group.add(glass);
 const outline=sh.getPoints(18).map(p=>new T.Vector3(p.x,p.y,.035));const arch=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(outline,false,'centripetal'),48,.085,6,false),mS);group.add(arch);
 for(const x of[-.22,.22])for(let y=.2;y<1.4;y+=.3)group.add(bx(.3,.22,.04,y% .6<.3?MT.Z:MT.B,x,y,.04));group.add(bx(.06,1.6,.08,mS,0,.8,.08));g.add(group);
 g.add(bx(.7,h*.82,.65,mS,side*(w/2+.22),h*.41,z-1.1));
 }
 if(k==='church'){
 const portal=new T.Group();portal.position.set(4.05,0,3.5);portal.rotation.y=Math.PI/2;
 for(const x of[-1.5,1.5])portal.add(bx(.25,3.15,.45,mS,x,1.575,0));
 for(const sign of[-1,1]){const a=bx(.22,1.95,.45,mS,sign*.75,3.5,0);a.rotation.z=sign*.87;portal.add(a)}g.add(portal);
 // Open belfry with a suspended bronze bell.
 g.add(bx(2.1,3,2.1,mS,0,6.6,5.2));
 for(const x of[-.8,.8])for(const z of[4.4,6])g.add(bx(.3,2.6,.3,mS,x,9.3,z));g.add(bx(2.1,.25,2.1,mS,0,8,5.2),bx(2.1,.25,2.1,mS,0,10.6,5.2));
 const bell=new T.Group();bell.position.set(0,10.2,5.2);const bronze=new T.MeshStandardMaterial({color:0xa58038,metalness:.7,roughness:.35});const body=new T.Mesh(new T.LatheGeometry([[.52,-1],[.48,-.9],[.3,-.7],[.22,-.35],[.14,-.2]].map(p=>new T.Vector2(...p)),20),bronze);bell.add(body,bx(.07,.9,.07,MT.I,0,-.6,0));g.add(bell);g.bell=bell;
 }
 if(k==='cathedral'){g.tipLights=[];for(const x of[-4.4,4.4]){const mat=new T.MeshStandardMaterial({color:0xe8c36a,emissive:0xffbc56,emissiveIntensity:0});const tip=new T.Mesh(new T.SphereGeometry(.17,10,8),mat);tip.position.set(x,16.05,7);const light=new T.PointLight(0xffba68,0,9,2);light.position.set(x,14.8,7);g.add(tip,light);g.tipLights.push({mat,light});}}
 }
 if(k==='gate'||k==='portcullis'){
 g.bars=new T.Group();for(let i=0;i<10;i++)g.bars.add(bx(.08,3.4,.08,MT.I,-1.5+i/3,1.7,1.5));for(const y of[.6,1.6,2.8])g.bars.add(bx(3.2,.1,.12,MT.I,0,y,1.5));g.add(g.bars);
 g.drawbridge=new T.Group();g.drawbridge.position.set(0,.16,2);g.drawbridge.add(bx(3.3,.22,5,mW,0,0,2.5));for(let z=.1;z<5;z+=.4)g.drawbridge.add(bx(3.25,.025,.035,MT.I,0,.13,z));g.add(g.drawbridge);
 g.chains=[];for(const x of[-1.5,1.5]){const chain=new T.Mesh(new T.CylinderGeometry(.027,.027,1,6),MT.I);g.add(chain);g.chains.push({mesh:chain,x})}
 }
}
