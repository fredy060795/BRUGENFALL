import * as T from 'three';
import {surfaceTexture} from './materials.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
const Rules=globalThis.BFRules;
export const WORLD_HALF_SIZE=Rules.WORLD_HALF;
export const TERRAIN_SIZE=WORLD_HALF_SIZE*3.2;
export const WATER_HALF_LENGTH=WORLD_HALF_SIZE*1.6;
export const MINI_MAP_RANGE=WORLD_HALF_SIZE;
export const setWorldConfig=cfg=>Rules.setWorldConfig(cfg);
export const getWorldConfig=()=>Rules.getWorldConfig();
export const riverX=z=>Rules.riverX(z);
export function heightAt(x,z){return Rules.height(x,z)}
export function roadAt(x,z){const center=Math.sin(z*.025)*2;return Math.min(Math.abs(x-center),Math.abs(z+7)*1.2+Math.max(0,Math.abs(x)-14))}
export function makeTerrain(material){const geo=new T.PlaneGeometry(TERRAIN_SIZE,TERRAIN_SIZE,448,448);geo.rotateX(-Math.PI/2);const pos=geo.attributes.position,colors=[];for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getZ(i);pos.setY(i,heightAt(x,z));const n=.8+.16*Math.sin(x*.19)*Math.sin(z*.15);{const wv=Math.max(0,Math.min(1,-pos.getY(i)/1.4));colors.push(n*(1-.45*wv),n*(1-.5*wv),n*(.92-.55*wv))}}geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.computeVertexNormals();material.vertexColors=true;material.color.setHex(0xa9ac7b);
 material.onBeforeCompile=shader=>{shader.uniforms.soilMap={value:surfaceTexture('soil')};shader.uniforms.roadMap={value:surfaceTexture('road')};shader.vertexShader='varying vec3 vTerrain;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvTerrain=position;');shader.fragmentShader='uniform sampler2D soilMap; uniform sampler2D roadMap; varying vec3 vTerrain;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
 float road=min(abs(vTerrain.x-sin(vTerrain.z*.025)*2.),abs(vTerrain.z+7.)*1.2+max(0.,abs(vTerrain.x)-14.));
 vec3 soil=texture2D(soilMap,vTerrain.xz*.36).rgb;
 vec3 gravel=texture2D(roadMap,vTerrain.xz*.23).rgb;
 float path=1.-smoothstep(1.4,2.8,road+sin(vTerrain.z*1.7)*.16);
 diffuseColor.rgb=mix(diffuseColor.rgb,mix(soil*.72,gravel,.7),path*.96);
 `)};const m=new T.Mesh(geo,material);m.receiveShadow=true;return m}
let seed=931;const rnd=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
const prototypes=[];
export const leafMats=[];
export function forestTree(bark){if(!prototypes.length)for(let style=0;style<4;style++){
 const wood=[],leaves=[];const h=5+style*.7;
 function branch(a,b,r1,r2){const delta=b.clone().sub(a),geo=new T.CylinderGeometry(r2,r1,delta.length(),6);geo.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize()));geo.translate(...a.clone().add(b).multiplyScalar(.5).toArray());wood.push(geo)}
 branch(new T.Vector3(),new T.Vector3(.15,h,0),.3,.045);
 for(let j=0;j<13;j++){const angle=j*2.399,by=2+j*.27,reach=1.5+rnd()*1.5;const tip=new T.Vector3(Math.cos(angle)*reach,by+1.4,Math.sin(angle)*reach);branch(new T.Vector3(0,by,0),tip,.09,.018);
 for(let k=0;k<40;k++){const a=rnd()*Math.PI*2,d=Math.sqrt(rnd())*1.2;const p=tip.clone().add(new T.Vector3(Math.cos(a)*d,(rnd()-.4)*1.6,Math.sin(a)*d));const geo=new T.CircleGeometry(.18+rnd()*.16,5);geo.scale(1,.6,1);geo.rotateX(rnd()*Math.PI);geo.rotateY(rnd()*Math.PI);geo.translate(...p.toArray());const tint=new T.Color().setHSL(.19+rnd()*.08,.28+rnd()*.12,.19+rnd()*.14);const cs=[];for(let v=0;v<geo.attributes.position.count;v++)cs.push(tint.r,tint.g,tint.b);geo.setAttribute('color',new T.Float32BufferAttribute(cs,3));leaves.push(geo)}}
 const g=new T.Group();const wm=new T.Mesh(mergeGeometries(wood,false),bark);wm.castShadow=true;wm.receiveShadow=true;g.add(wm);
 const mat=new T.MeshStandardMaterial({vertexColors:true,side:T.DoubleSide,roughness:1});leafMats.push(mat);const lm=new T.Mesh(mergeGeometries(leaves,false),mat);lm.castShadow=true;lm.receiveShadow=true;g.add(lm);wood.concat(leaves).forEach(g=>g.dispose());prototypes.push(g)}
 const o=prototypes[Math.floor(rnd()*prototypes.length)].clone();const scale=.8+rnd()*.5;o.scale.setScalar(scale);o.rotation.y=rnd()*6.28;return o}
export function decorate(scene){const group=new T.Group();group.name='Meadow';scene.add(group);
 const sky=new T.Mesh(new T.SphereGeometry(WORLD_HALF_SIZE*1.9,24,12),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{k:{value:1}},vertexShader:'varying vec3 dir;void main(){dir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform float k;varying vec3 dir;void main(){vec3 d=normalize(dir);float h=max(0.,d.y);vec3 c=mix(vec3(.68,.73,.71),vec3(.24,.43,.57),pow(h,.55));float sun=pow(max(0.,dot(d,normalize(vec3(.45,.8,.3)))),180.);c+=vec3(.4,.29,.13)*sun;c=mix(vec3(.012,.018,.045)+vec3(.02,.03,.06)*pow(h,.5),c*(.4+.6*k),k);gl_FragColor=vec4(c,1.);}'}));sky.renderOrder=-2;scene.add(sky);
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute([-.08,0,0,.08,0,0,.03,.48,0,0,0,-.08,0,0,.08,0,.38,.02],3));geo.computeVertexNormals();const mat=new T.MeshStandardMaterial({color:0x7a8050,side:T.DoubleSide,roughness:1});const grass=new T.InstancedMesh(geo,mat,3600);const d=new T.Object3D();let count=0;
 for(let i=0;i<8400&&count<3600;i++){const x=(rnd()-.5)*WORLD_HALF_SIZE*2,z=(rnd()-.5)*WORLD_HALF_SIZE*2;if(roadAt(x,z)<3.1||Math.hypot(x,z)<18)continue;d.position.set(x,heightAt(x,z),z);d.rotation.y=rnd()*6.28;d.scale.setScalar(.5+rnd());d.updateMatrix();grass.setMatrixAt(count++,d.matrix)}grass.count=count;group.add(grass);
 const ridge=new T.Group();const mountain=new T.MeshStandardMaterial({color:0x718078,roughness:1});for(let i=0;i<28;i++){const a=i/28*Math.PI*2;const m=new T.Mesh(new T.ConeGeometry(25+rnd()*25,25+rnd()*45,7),mountain);m.position.set(Math.cos(a)*(WORLD_HALF_SIZE+55),3,Math.sin(a)*(WORLD_HALF_SIZE+55));m.scale.z=1.5;ridge.add(m)}scene.add(ridge);
 const c=document.createElement('canvas');c.width=c.height=64;const ctx=c.getContext('2d'),gradient=ctx.createRadialGradient(32,32,2,32,32,31);gradient.addColorStop(0,'rgba(0,0,0,0.34)');gradient.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);const shadowMat=new T.MeshBasicMaterial({map:new T.CanvasTexture(c),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});
 return {grass,ridge,shadowMat,sky};
}
export function contactShadow(material,size=1){const m=new T.Mesh(new T.PlaneGeometry(size,size),material);m.rotation.x=-Math.PI/2;m.position.y=.025;m.renderOrder=1;return m}
export function makeWater(){const pts=[];for(let z=-WATER_HALF_LENGTH;z<=WATER_HALF_LENGTH;z+=5){const x=riverX(z);pts.push(x-7.2,-.35,z,x+7.2,-.35,z)}const idx=[];for(let i=0;i<pts.length/6-1;i++){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2)}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pts,3));g.setIndex(idx);g.computeVertexNormals();
 const m=new T.Mesh(g,new T.MeshStandardMaterial({color:0x4a7f95,transparent:true,opacity:.8,roughness:.12,metalness:.25,side:T.DoubleSide}));m.renderOrder=1;return m}
