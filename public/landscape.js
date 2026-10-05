import * as T from 'three';
const Rules=globalThis.BFRules;
export class Landscape {
 constructor(scene,terrain,stone,water,soil){this.scene=scene;this.terrain=terrain;this.stone=stone;this.water=water;this.soil=soil;this.moatGroup=new T.Group();this.pathGroup=new T.Group();scene.add(this.moatGroup,this.pathGroup);this.cells=new Map();this.signature='';this.paths=[];this.pathSignature=''}
 clear(group){for(const child of [...group.children]){group.remove(child);child.geometry?.dispose()}}
 update(buildings){const moats=buildings.filter(b=>b.t==='moat');const sig=moats.map(b=>[b.id,b.x,b.z].join(',')).sort().join(';');if(sig===this.signature)return;this.signature=sig;this.clear(this.moatGroup);this.cells.clear();
 // Raster union: each quarter-metre cell is emitted exactly once, including overlaps.
 for(const b of moats)for(let x=Math.round((b.x-2)*4);x<Math.round((b.x+2)*4);x++)for(let z=Math.round((b.z-2)*4);z<Math.round((b.z+2)*4);z++)this.cells.set(x+','+z,{x,z});
 const pending=new Set(this.cells.keys());while(pending.size){const key=pending.values().next().value,queue=[key],part=[];pending.delete(key);let level=Infinity;for(let i=0;i<queue.length;i++){const c=this.cells.get(queue[i]);part.push(c);level=Math.min(level,Rules.height((c.x+.5)/4,(c.z+.5)/4)-.28);for(const [dx,dz]of[[1,0],[-1,0],[0,1],[0,-1]]){const k=(c.x+dx)+','+(c.z+dz);if(pending.delete(k))queue.push(k)}}
 const positions=[],sides=[];for(const c of part){c.level=level;const x=c.x/4,z=c.z/4,a=.25;positions.push(x,level,z,x,level,z+a,x+a,level,z,x+a,level,z,x,level,z+a,x+a,level,z+a);
 // Vertikale Seitenwände, damit man nicht seitlich unter die Wasserfläche blickt (optische Tiefe).
 for(const [dx,dz,nx,nz] of [[1,0,1,0],[-1,0,-1,0],[0,1,0,1],[0,-1,0,-1]]){const nk=(c.x+dx)+','+(c.z+dz);if(this.cells.has(nk))continue;const x0=x+(dx>0?a:0),z0=z+(dz>0?a:0),x1=x0+(dz?a:0),z1=z0+(dx?a:0),bot=level-1.15;
 sides.push(x0,level,z0,x1,level,z1,x0,bot,z0, x1,level,z1,x1,bot,z1,x0,bot,z0);}}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.computeVertexNormals();const mesh=new T.Mesh(geo,this.water);mesh.receiveShadow=true;this.moatGroup.add(mesh);
 if(sides.length){const sg=new T.BufferGeometry();sg.setAttribute('position',new T.Float32BufferAttribute(sides,3));sg.computeVertexNormals();const sm=new T.Mesh(sg,this.water);sm.receiveShadow=true;this.moatGroup.add(sm)}}
 // Excavate only the moat footprints and blend the banks over one terrain cell.
 const p=this.terrain.geometry.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),cell=this.cell(x,z);let h=Rules.height(x,z);if(cell)h=Math.min(h,cell.level-1.25);else{let near=null;for(const [dx,dz]of[[.7,0],[-.7,0],[0,.7],[0,-.7]])near=near||this.cell(x+dx,z+dz);if(near)h=Math.min(h,near.level-.1)}p.setY(i,h)}p.needsUpdate=true;this.terrain.geometry.computeVertexNormals();this.terrain.geometry.computeBoundingSphere();this.updatePaths(this.paths,true);
 }
 cell(x,z){return this.cells.get(Math.floor(x*4)+','+Math.floor(z*4))}
 updatePaths(paths,force=false){const sig=JSON.stringify(paths);if(!force&&sig===this.pathSignature)return;this.pathSignature=sig;this.paths=paths;this.clear(this.pathGroup);const occupied=new Set();
 for(const p of paths){const d=Math.hypot(p.x-p.ax,p.z-p.az),steps=Math.max(1,Math.ceil(d/.25));for(let i=0;i<=steps;i++){const x=p.ax+(p.x-p.ax)*i/steps,z=p.az+(p.z-p.az)*i/steps;for(let dx=-3;dx<=3;dx++)for(let dz=-3;dz<=3;dz++)if(dx*dx+dz*dz<=10)occupied.add((Math.round(x*4)+dx)+','+(Math.round(z*4)+dz))}}
 const v=[],uv=[];for(const key of occupied){const [ix,iz]=key.split(',').map(Number),x=ix/4,z=iz/4,a=.25;if(this.cell(x,z))continue;for(const [px,pz]of[[x,z],[x,z+a],[x+a,z],[x+a,z],[x,z+a],[x+a,z+a]]){v.push(px,Rules.height(px,pz)+.04,pz);uv.push(px*.4,pz*.4)}}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(v,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.computeVertexNormals();const mesh=new T.Mesh(geo,this.soil);mesh.receiveShadow=true;mesh.renderOrder=2;this.pathGroup.add(mesh);
 }
 foundation(object,u,catalog){const C=catalog[u.t];if(!C||['bridge','moat'].includes(u.t))return;
 if(object.terrainConform||['field','hopfield','orchard','cemetery','fire','bed','bench'].includes(u.t)){const key=[u.t,u.x,u.z,u.r].join();if(object.conformKey===key)return;object.conformKey=key;object.terrainConform=true;const base=object.position.y;if(object.colliders){object.originalGroundColliders=object.originalGroundColliders||object.colliders.map(q=>q.slice());object.colliders=object.originalGroundColliders.map(q=>{const p=q.slice(),[x,z]=Rules.world(u,q[0],q[1]),dy=Rules.height(x,z)-base;p[4]+=dy;p[5]=(p[5]||0)+dy;return p})}for(const door of object.doors||[]){const [x,z]=Rules.world(u,door.root.position.x,door.root.position.z);door.root.position.y=.08+Rules.height(x,z)-base;}for(const animal of object.animals||[]){const [ax,az]=Rules.world(u,animal.position.x,animal.position.z);animal.position.y=Rules.height(ax,az)-base;}object.updateMatrixWorld(true);object.traverse(o=>{if(!o.isMesh)return;for(let parent=o.parent;parent&&parent!==object;parent=parent.parent)if(parent.isQuad||parent.userData.rigidDoor)return;if(!o.userData.groundOriginal){o.geometry=o.geometry.clone();o.userData.groundOriginal=o.geometry.attributes.position.array.slice()}const p=o.geometry.attributes.position,orig=o.userData.groundOriginal,inverse=o.matrixWorld.clone().invert();for(let i=0;i<p.count;i++){const v=new T.Vector3(orig[i*3],orig[i*3+1],orig[i*3+2]).applyMatrix4(o.matrixWorld);v.y+=Rules.height(v.x,v.z)-base;v.applyMatrix4(inverse);p.setXYZ(i,v.x,v.y,v.z)}p.needsUpdate=true;o.geometry.computeVertexNormals();o.geometry.computeBoundingSphere()});return;}
 const key=[u.t,u.x,u.z,u.r,C.w,C.d].join();if(object.foundationKey===key)return;object.foundationKey=key;
 if(object.foundation){object.remove(object.foundation);this.clear(object.foundation)}const g=new T.Group();object.foundation=g;object.add(g);const base=Rules.base(u.t,u.x,u.z,u.r,catalog),w=C.w,d=C.d;
 const open=['gate','portcullis','wall','battle','palisade','stairs','watchpost'].includes(u.t);
 const patches=open?(object.colliders||[]).filter(q=>(q[5]||0)<.2).map(q=>[q[0],q[1],q[2]*2,q[3]*2]):[[0,0,w,d]];
 if(open&&!patches.length)for(const m of object.children)if(m.isMesh){m.geometry.computeBoundingBox();const b=m.geometry.boundingBox;if(b.min.y+m.position.y<.2)patches.push([m.position.x,m.position.z,b.max.x-b.min.x,b.max.z-b.min.z])}
 for(const [cx,cz,pw,pd]of patches){if(!open){const slab=new T.Mesh(new T.BoxGeometry(pw,.12,pd),this.stone);slab.position.set(cx,-.04,cz);slab.receiveShadow=true;g.add(slab)}
 for(const [horizontal,side]of[[true,-1],[true,1],[false,-1],[false,1]]){const len=horizontal?pw:pd,n=Math.max(1,Math.ceil(len/.4));for(let i=0;i<n;i++){const t=-len/2+(i+.5)*len/n,lx=cx+(horizontal?t:side*pw/2),lz=cz+(horizontal?side*pd/2:t),[x,z]=Rules.world(u,lx,lz),depth=Math.max(.08,base-Rules.height(x,z)+.12);const m=new T.Mesh(new T.BoxGeometry(horizontal?len/n:.15,depth,horizontal?.15:len/n),this.stone);m.position.set(lx,-depth/2,lz);m.receiveShadow=true;g.add(m)}}}

 }
 floor(object,x,z){const u=object.userData,C=object.catalogEntry;if(!C||object.terrainConform||['gate','portcullis','wall','battle','palisade','stairs','watchpost'].includes(u.t))return null;const [lx,lz]=Rules.local(u,x,z),base=object.position.y;if(object.foundation&&Math.abs(lx)<=C.w/2&&Math.abs(lz)<=C.d/2)return base+.1;

 return null;
 }
}
