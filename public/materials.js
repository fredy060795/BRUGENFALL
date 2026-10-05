import * as T from 'three';
const atlas=new Image();const ready=new Promise(resolve=>{atlas.onload=()=>resolve(true);atlas.onerror=()=>resolve(false)});atlas.src='/textures/detail-atlas.png';
const cache={};
export function surfaceTexture(name){if(cache[name])return cache[name];const c=document.createElement('canvas');c.width=c.height=4;const ctx=c.getContext('2d');ctx.fillStyle='#b6a88e';ctx.fillRect(0,0,4,4);const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.anisotropy=4;cache[name]=tex;
 ready.then(ok=>{if(!ok)return;const i={plaster:0,leather:1,linen:2,soil:3}[name];c.width=atlas.width/2;c.height=atlas.height/2;ctx.drawImage(atlas,(i%2)*c.width,Math.floor(i/2)*c.height,c.width,c.height,0,0,c.width,c.height);tex.needsUpdate=true});return tex}
export function surfaceMaterial(name,color=0xffffff,repeat=[1,1]){const source=surfaceTexture(name),tex=source.clone();tex.repeat.set(...repeat);ready.then(()=>{tex.image=source.image;tex.needsUpdate=true});return new T.MeshStandardMaterial({map:tex,color,roughness:.94})}
