import * as T from 'three';
import {surfaceTexture} from './materials.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
const Rules=globalThis.BFRules;
export let WORLD_HALF_SIZE=Rules.WORLD_HALF;
export let TERRAIN_SIZE=WORLD_HALF_SIZE*3.2;
export let WATER_HALF_LENGTH=WORLD_HALF_SIZE*1.6;
export let MINI_MAP_RANGE=WORLD_HALF_SIZE
// Kartengröße der aktuellen Welt übernehmen (vor dem Neuaufbau aufrufen)
export function applyWorldSize(){WORLD_HALF_SIZE=Rules.half();TERRAIN_SIZE=Math.max(WORLD_HALF_SIZE*3.2,(WORLD_HALF_SIZE+360)*2);WATER_HALF_LENGTH=WORLD_HALF_SIZE*1.6;MINI_MAP_RANGE=WORLD_HALF_SIZE};
export const setWorldConfig=cfg=>Rules.setWorldConfig(cfg);
export const getWorldConfig=()=>Rules.getWorldConfig();
export const riverX=z=>Rules.riverX(z);
export function heightAt(x,z){return Rules.height(x,z)}
// Keine vorgegebene Straße mehr – Wege zeichnet der Spieler selbst (Wegewerkzeug)
export function roadAt(x,z){return 99}
// Gelände in Kacheln: nur in Sichtweite vorhanden, nah fein, fern grob (große Karten bis 5x)
export function makeTerrain(material){const TILE=64,SEG=[48,24,10],g=new T.Group();g.name='TerrainTiles';g.hmod=null;const N=Math.ceil(TERRAIN_SIZE/TILE),off=-N*TILE/2,tiles=[];
 for(let i=0;i<N;i++)for(let j=0;j<N;j++)tiles.push({cx:off+(i+.5)*TILE,cz:off+(j+.5)*TILE,lod:-1,mesh:null,geo:[null,null,null]});
 const H=(x,z)=>g.hmod?g.hmod(x,z):heightAt(x,z);
 function build(t,seg){const n=seg+1,S=n+2,step=TILE/seg,x0=t.cx-TILE/2,z0=t.cz-TILE/2,pos=new Float32Array(S*S*3),nor=new Float32Array(S*S*3),col=new Float32Array(S*S*3),e=Math.max(.6,step*.5);
  for(let jj=0;jj<S;jj++)for(let ii=0;ii<S;ii++){const ci=Math.min(n-1,Math.max(0,ii-1)),cj=Math.min(n-1,Math.max(0,jj-1)),x=x0+ci*step,z=z0+cj*step,ring=ii===0||jj===0||ii===S-1||jj===S-1,h=H(x,z),k=(jj*S+ii)*3;
   pos[k]=x;pos[k+1]=ring?h-3:h;pos[k+2]=z;let nx=H(x-e,z)-H(x+e,z),nz=H(x,z-e)-H(x,z+e),ny=2*e;const l=Math.hypot(nx,ny,nz);nor[k]=nx/l;nor[k+1]=ny/l;nor[k+2]=nz/l;
   const nn=.8+.16*Math.sin(x*.19)*Math.sin(z*.15),wv=Math.max(0,Math.min(1,-h/1.4));col[k]=nn*(1-.45*wv);col[k+1]=nn*(1-.5*wv);col[k+2]=nn*(.92-.55*wv)}
  const idx=[];for(let jj=0;jj<S-1;jj++)for(let ii=0;ii<S-1;ii++){const a=jj*S+ii,b=a+1,c=a+S,d=c+1;idx.push(a,c,b,b,c,d)}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(pos,3));geo.setAttribute('normal',new T.BufferAttribute(nor,3));geo.setAttribute('color',new T.BufferAttribute(col,3));geo.setIndex(idx);geo.computeBoundingSphere();return geo}
 g.update=(px,pz,budget=6)=>{for(const t of tiles){const d=Math.max(Math.abs(px-t.cx),Math.abs(pz-t.cz))-TILE/2,lod=d>330?-1:d<110?0:d<210?1:2;
   if(lod===-1&&d>460){for(let q=0;q<3;q++)if(t.geo[q]){t.geo[q].dispose();t.geo[q]=null}}
   if(lod===t.lod)continue;if(lod>=0&&!t.geo[lod]){if(budget<=0)continue;budget--;t.geo[lod]=build(t,SEG[lod])}
   if(t.mesh){g.remove(t.mesh);t.mesh=null}if(lod>=0){t.mesh=new T.Mesh(t.geo[lod],material);t.mesh.receiveShadow=true;g.add(t.mesh)}t.lod=lod}};
 // nach Höhenänderungen (Burggraben) alle Kacheln neu erzeugen
 g.refresh=()=>{for(const t of tiles){for(let q=0;q<3;q++)if(t.geo[q]){t.geo[q].dispose();t.geo[q]=null}if(t.mesh){g.remove(t.mesh);t.mesh=null}t.lod=-1}g.update(g.lx||0,g.lz||0,1e9)};
 const up=g.update;g.update=(px,pz,b)=>{g.lx=px;g.lz=pz;up(px,pz,b)};
 material.vertexColors=true;material.color.setHex(0xa9ac7b);
 const grassTex=new T.TextureLoader().load('/textures/Grass_BaseColor.png');grassTex.wrapS=grassTex.wrapT=T.RepeatWrapping;grassTex.colorSpace=T.SRGBColorSpace;grassTex.anisotropy=8;material.map=null;
 material.onBeforeCompile=shader=>{shader.uniforms.grassMap={value:grassTex};shader.uniforms.soilMap={value:surfaceTexture('soil')};shader.uniforms.roadMap={value:surfaceTexture('road')};shader.vertexShader='varying vec3 vTerrain;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvTerrain=position;');shader.fragmentShader='uniform sampler2D grassMap; uniform sampler2D soilMap; uniform sampler2D roadMap; varying vec3 vTerrain;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
 { vec2 wp=vTerrain.xz; vec3 g1=texture2D(grassMap,wp/3.6).rgb; vec3 g2=texture2D(grassMap,mat2(.8,-.6,.6,.8)*wp/9.7+vec2(.37,.11)).rgb;
   float big=texture2D(grassMap,wp/173.).g; vec3 av=textureLod(grassMap,vec2(.5),12.).rgb; float al=max(.02,dot(av,vec3(.3,.5,.2)));
   vec3 gc=mix(g1,g2,.35+.3*smoothstep(.2,.6,big))/al; gc=mix(gc,gc*vec3(.92,1.08,.85),.5); diffuseColor.rgb*=clamp(gc,0.,2.2)*.9; }
 // Standardstraße entfernt
 `)};g.update(0,0,1e9);return g}
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
 const sky=new T.Mesh(new T.SphereGeometry(280,24,12),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{k:{value:1}},vertexShader:'varying vec3 dir;void main(){dir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform float k;varying vec3 dir;void main(){vec3 d=normalize(dir);float h=max(0.,d.y);vec3 c=mix(vec3(.68,.73,.71),vec3(.24,.43,.57),pow(h,.55));float sun=pow(max(0.,dot(d,normalize(vec3(.45,.8,.3)))),180.);c+=vec3(.4,.29,.13)*sun;c=mix(vec3(.012,.018,.045)+vec3(.02,.03,.06)*pow(h,.5),c*(.4+.6*k),k);gl_FragColor=vec4(c,1.);}'}));sky.renderOrder=-2;scene.add(sky);
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute([-.08,0,0,.08,0,0,.03,.48,0,0,0,-.08,0,0,.08,0,.38,.02],3));geo.computeVertexNormals();const mat=new T.MeshStandardMaterial({color:0x7a8050,side:T.DoubleSide,roughness:1});const grass=new T.InstancedMesh(geo,mat,3600);const d=new T.Object3D();
 grass.around=(cx,cz)=>{let count=0;for(let i=0;i<8400&&count<3600;i++){const x=cx+(rnd()-.5)*240,z=cz+(rnd()-.5)*240;if(Math.abs(x)>WORLD_HALF_SIZE+40||Math.abs(z)>WORLD_HALF_SIZE+40)continue;const h=heightAt(x,z);if(h<-.6)continue;d.position.set(x,h,z);d.rotation.y=rnd()*6.28;d.scale.setScalar(.5+rnd());d.updateMatrix();grass.setMatrixAt(count++,d.matrix)}grass.count=count;grass.instanceMatrix.needsUpdate=true;grass.cx=cx;grass.cz=cz};grass.around(0,0);group.add(grass);
 const ridge=new T.Group();const mountain=new T.MeshStandardMaterial({vertexColors:true,roughness:1,metalness:0});mountain.onBeforeCompile=sh=>{sh.vertexShader='varying float vMH;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvMH=position.y;');sh.fragmentShader='varying float vMH;\n'+sh.fragmentShader.replace('#include <fog_fragment>','#ifdef USE_FOG\n float mdd=length(vViewPosition),mfd=max(smoothstep(80.,900.,mdd)*.8,(1.-smoothstep(0.,55.,vMH))*smoothstep(fogNear,fogFar,mdd));gl_FragColor.rgb=mix(gl_FragColor.rgb,fogColor,mfd);\n#endif')};ridge.place=()=>{ridge.clear();
  // Gebirgskette rund um die Karte: zusammenhängendes Höhenfeld mit Graten, Fels an Steilhängen, Schneegipfeln, grünen Vorbergen
  const R0=WORLD_HALF_SIZE+45,R1=WORLD_HALF_SIZE+330,NA=Math.round(260*Math.max(1,WORLD_HALF_SIZE/200)),NR=34,F=[];let sw=0;for(let k=0;k<10;k++){const w=.55/(1+k*.55);sw+=w;F.push([2+Math.floor(rnd()*(5+k*7)),rnd()*6.283,(rnd()-.5)*4,w])}
  const pos=[],col=[],idx=[],H=[],ss=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)};
  for(let j=0;j<=NR;j++){const t=j/NR,r=R0+(R1-R0)*t;for(let i=0;i<=NA;i++){const a=i/NA*Math.PI*2;let n=0;for(const[k,ph,b,w]of F)n+=w*Math.pow(1-Math.abs(Math.sin(k*a+ph+t*b)),1.5);n/=sw;
    const prof=ss(0,.55,t)*(1-.25*ss(.8,1,t)),h=prof*(8+170*Math.pow(n,1.7))+ss(0,.3,t)*6*Math.sin(a*37+t*9);const jit=Math.sin(a*91+t*23)*6;H.push(h);pos.push(Math.cos(a)*(r+jit),h-1,Math.sin(a)*(r+jit))}}
  for(let j=0;j<NR;j++)for(let i=0;i<NA;i++){const A=j*(NA+1)+i,B=A+1,C=A+NA+1,D=C+1;idx.push(A,B,C,B,D,C)}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();const nr=g.attributes.normal.array,c=new T.Color(),grass=new T.Color(0x56683f),rock=new T.Color(0x6f6a62),rock2=new T.Color(0x8a8072),snow=new T.Color(0xeef2f6);
  for(let q=0;q<H.length;q++){const h=H[q],ny=nr[q*3+1],x=pos[q*3],z=pos[q*3+2],nz=.5+.5*Math.sin(x*.11+z*.07)*Math.sin(z*.13-x*.05);
    c.copy(grass).lerp(rock,ss(18,55,h+nz*14)).lerp(rock2,ss(.35,.7,1-ny)*ss(30,60,h)*.8);if(ny<.72)c.lerp(rock,.5);c.lerp(snow,ss(105,135,h+nz*25)*ss(.45,.75,ny));col.push(c.r,c.g,c.b)}
  g.setAttribute('color',new T.Float32BufferAttribute(col,3));const m=new T.Mesh(g,mountain);m.receiveShadow=false;ridge.add(m)};ridge.place();scene.add(ridge);
 const c=document.createElement('canvas');c.width=c.height=64;const ctx=c.getContext('2d'),gradient=ctx.createRadialGradient(32,32,2,32,32,31);gradient.addColorStop(0,'rgba(0,0,0,0.34)');gradient.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);const shadowMat=new T.MeshBasicMaterial({map:new T.CanvasTexture(c),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});
 return {grass,ridge,shadowMat,sky};
}
export function contactShadow(material,size=1){const m=new T.Mesh(new T.PlaneGeometry(size,size),material);m.rotation.x=-Math.PI/2;m.position.y=.025;m.renderOrder=1;return m}
export function makeWater(){const pts=[],S=Rules.riverSamples();if(S)for(let i=0;i<S.length;i++){const a=S[Math.max(0,i-1)],b=S[Math.min(S.length-1,i+1)],dx=b.x-a.x,dz=b.z-a.z,l=Math.hypot(dx,dz)||1,nx=-dz/l*7.2*S[i].w,nz=dx/l*7.2*S[i].w,p=S[i];pts.push(p.x+nx,-.35,p.z+nz,p.x-nx,-.35,p.z-nz)}const idx=[];for(let i=0;i<pts.length/6-1;i++){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2)}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pts,3));g.setIndex(idx);g.computeVertexNormals();
 const m=new T.Mesh(g,new T.MeshStandardMaterial({color:0x4a7f95,transparent:true,opacity:.8,roughness:.12,metalness:.25,side:T.DoubleSide}));m.renderOrder=1;return m}
