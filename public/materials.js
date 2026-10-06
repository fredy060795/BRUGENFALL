import * as T from 'three';
const atlas=new Image();const ready=new Promise(resolve=>{atlas.onload=()=>resolve(true);atlas.onerror=()=>resolve(false)});atlas.src='/textures/detail-atlas-hd.jpg';
const cache={};
function fallbackTexture(name,ctx,size){
 if(name==='road'){
  ctx.fillStyle='#756858';ctx.fillRect(0,0,size,size);
  for(let y=0;y<8;y++)for(let x=0;x<8;x++){
   const ox=x*size/8,oy=y*size/8,w=size/8-3,h=size/8-4,tone=92+((x+y)%3)*14;
   ctx.fillStyle=`rgb(${tone+18},${tone+11},${tone})`;ctx.fillRect(ox+1+(y%2)*2,oy+1,w,h);
   ctx.strokeStyle='rgba(60,48,38,.5)';ctx.strokeRect(ox+1+(y%2)*2,oy+1,w,h);
  }
  return;
 }
 const fills={plaster:'#d7c8ae',leather:'#7a5b3d',linen:'#d7d0bf',soil:'#9a8262'};
 ctx.fillStyle=fills[name]||'#b6a88e';ctx.fillRect(0,0,size,size);
 if(name==='soil')for(let i=0;i<160;i++){const s=2+Math.random()*5;ctx.fillStyle=`rgba(${105+Math.random()*40|0},${80+Math.random()*30|0},${52+Math.random()*20|0},.35)`;ctx.fillRect(Math.random()*size,Math.random()*size,s,s)}
}
export function surfaceTexture(name){if(cache[name])return cache[name];const c=document.createElement('canvas');c.width=c.height=96;const ctx=c.getContext('2d');fallbackTexture(name,ctx,96);const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.anisotropy=4;cache[name]=tex;
 ready.then(ok=>{const i={plaster:0,leather:1,linen:2,soil:3}[name];if(!ok||i===undefined){tex.needsUpdate=true;return}c.width=atlas.width/2;c.height=atlas.height/2;ctx.clearRect(0,0,c.width,c.height);ctx.drawImage(atlas,(i%2)*c.width,Math.floor(i/2)*c.height,c.width,c.height,0,0,c.width,c.height);tex.needsUpdate=true});return tex}
export function surfaceMaterial(name,color=0xffffff,repeat=[1,1]){const source=surfaceTexture(name),tex=source.clone();tex.repeat.set(...repeat);ready.then(()=>{tex.image=source.image;tex.needsUpdate=true});return new T.MeshStandardMaterial({map:tex,color,roughness:.94})}
