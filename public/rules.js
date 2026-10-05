/* Shared deterministic rules and map helpers, used by server and browser. */
(function(root){
 const modular=['wall','battle','palisade','tower','gate','portcullis','stairs'];
 const WORLD_HALF=200,RIVER_Z=[-200,-100,0,100,200],MAP_LIMIT=165;
 const BASE_MAP={name:'Talgrund',river:[-64,-72,-58,-46,-60],towns:[{n:'Ostmark',x:122,z:42,k:'friend'},{n:'Eichenfurt',x:-112,z:-118,k:'friend'},{n:'Rabenstein',x:36,z:-144,k:'enemy'}],ores:[{k:'iron',x:-24,z:88},{k:'iron',x:96,z:-32},{k:'iron',x:-102,z:34},{k:'copper',x:64,z:118},{k:'copper',x:-76,z:-54},{k:'copper',x:18,z:-96}],forests:[{x:-106,z:74,r:24,d:34},{x:-18,z:132,r:22,d:28},{x:108,z:86,r:20,d:26},{x:120,z:-28,r:20,d:24},{x:-126,z:-22,r:22,d:28},{x:-38,z:-108,r:24,d:32},{x:54,z:-124,r:22,d:30},{x:38,z:32,r:18,d:18}],rocks:[{x:-82,z:102,r:10,d:11},{x:84,z:58,r:9,d:10},{x:-36,z:-58,r:11,d:12},{x:58,z:-88,r:9,d:10}]};
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const smooth=(x,a,b)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)};
 const hashSeed=s=>{let h=2166136261>>>0;for(const ch of String(s)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0};
 const makeRng=s=>{let x=(s>>>0)||1;return()=>((x=Math.imul(x,1664525)+1013904223>>>0)/4294967296)};
 function lerpRiver(points,z){const p=(Array.isArray(points)&&points.length===5?points:BASE_MAP.river).map(v=>clamp(+v||0,-140,140));const t=clamp((z+WORLD_HALF)/(WORLD_HALF*2),0,1)*(p.length-1),i=Math.min(p.length-2,Math.floor(t)),f=t-i,s=smooth(f,0,1);return p[i]+(p[i+1]-p[i])*s}
 function riverX(z,map){return lerpRiver((map&&map.river)||worldConfig.river,z)}
 function height(x,z,map){let h=smooth(Math.hypot(x,z),24,70)*(Math.sin(x*.042)*Math.cos(z*.037)*2.5+Math.sin(z*.077+x*.023)*1.1);const d=Math.abs(x-riverX(z,map));return h*smooth(d,6,22)-(1-smooth(d,3,7.5))*2.6}
 const local=(b,x,z)=>{const a=(b.r||0)*Math.PI/2,c=Math.cos(a),s=Math.sin(a),dx=x-b.x,dz=z-b.z;return [dx*c-dz*s,dx*s+dz*c]};
 const world=(b,x,z)=>{const a=(b.r||0)*Math.PI/2,c=Math.cos(a),s=Math.sin(a);return [b.x+x*c+z*s,b.z-x*s+z*c]};
 function base(t,x,z,r,catalog,map){if(t==='bridge')return 0;if(t==='moat')return height(x,z,map);const d=catalog[t]||catalog;if(!d)return height(x,z,map);let h=-Infinity;const b={x,z,r};for(let i=0;i<=4;i++)for(let j=0;j<=4;j++){const p=world(b,(i/4-.5)*d.w,(j/4-.5)*d.d);h=Math.max(h,height(...p,map))}return h+.02}
 function snapPlacement(t,x,z,r,buildings,catalog,maxDist=1.6){
  if(!(modular.includes(t)||t==='moat'))return{x,z,snapped:false};
  const own=catalog[t];if(!own)return{x,z,snapped:false};const [w,d]=dims(catalog,t,r);let best=null,bd=maxDist;
  for(const b of buildings||[]){
   if(!b||!b.t||!(modular.includes(b.t)||b.t==='moat'))continue;
   const other=catalog[b.t];if(!other)continue;const [w2,d2]=dims(catalog,b.t,b.r||0);
   for(const candidate of[
    {x:b.x+(w+w2)/2,z:b.z},{x:b.x-(w+w2)/2,z:b.z},
    {x:b.x,z:b.z+(d+d2)/2},{x:b.x,z:b.z-(d+d2)/2}
   ]){
    const dist=Math.hypot(candidate.x-x,candidate.z-z);
    if(dist<bd){bd=dist;best=candidate;}
   }
  }
  return best?{x:best.x,z:best.z,snapped:true}:{x,z,snapped:false};
 }
 const passOverlap=(a,b)=>(modular.includes(a)&&modular.includes(b))||(a==='moat'&&['moat','gate','portcullis','bridge'].includes(b))||(b==='moat'&&['gate','portcullis','bridge'].includes(a));
 const dims=(catalog,t,r)=>{const d=catalog[t]||catalog;return (r&1)?[d.d,d.w]:[d.w,d.d]};
 const drawbridge=(b,buildings)=>buildings.some(m=>{if(m.t!=='moat')return false;const [x,z]=local(b,m.x,m.z);return Math.abs(x)<3.5&&z>=0&&z<8});
 function separate(actors,passes=8){const size=2.5;for(let pass=0;pass<passes;pass++){const grid=new Map();for(const a of actors){const key=Math.floor(a.x/size)+','+Math.floor(a.z/size);if(!grid.has(key))grid.set(key,[]);grid.get(key).push(a)}for(const a of actors){const ix=Math.floor(a.x/size),iz=Math.floor(a.z/size);for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++)for(const b of grid.get((ix+dx)+','+(iz+dz))||[]){if(a.id>=b.id||Math.abs((a.el||0)-(b.el||0))>1.5)continue;let x=b.x-a.x,z=b.z-a.z,d=Math.hypot(x,z),r=(a.radius||.42)+(b.radius||.42);if(d>=r)continue;if(d<1e-7){const angle=(a.id*2.399+b.id*1.618)%6.283;x=Math.cos(angle);z=Math.sin(angle);d=1e-7}const l=Math.hypot(x,z);x/=l;z/=l;const push=(r-d)/2;a.x-=x*push;a.z-=z*push;b.x+=x*push;b.z+=z*push}}}}
 
 function generatePreset(seed,name){const rnd=makeRng(hashSeed('preset:'+seed)),river=[0,1,2,3,4].map((_,i)=>clamp(-70+rnd()*40+(i===2?8:0),-120,120));const towns=[];const takeSpot=(kind,label,minR)=>{for(let tries=0;tries<200;tries++){const a=rnd()*Math.PI*2,d=minR+rnd()*55,x=Math.cos(a)*d,z=Math.sin(a)*d;if(Math.abs(x)>MAP_LIMIT||Math.abs(z)>MAP_LIMIT)continue;if(Math.abs(x-lerpRiver(river,z))<20)continue;if(towns.some(t=>Math.hypot(t.x-x,t.z-z)<38))continue;towns.push({n:label,x:Math.round(x),z:Math.round(z),k:kind});return}};
  takeSpot('friend','Dorf A',108);takeSpot('friend','Dorf B',108);takeSpot('enemy','Banditenlager',128);
  const ores=[];for(const k of['iron','iron','iron','copper','copper','copper'])for(let tries=0;tries<120;tries++){const a=rnd()*Math.PI*2,d=42+rnd()*88,x=Math.cos(a)*d,z=Math.sin(a)*d;if(Math.abs(x-lerpRiver(river,z))<18)continue;if(towns.some(t=>Math.hypot(t.x-x,t.z-z)<26)||ores.some(o=>Math.hypot(o.x-x,o.z-z)<20))continue;ores.push({k,x:Math.round(x),z:Math.round(z)});break}
  const forests=[];for(let i=0;i<8;i++)for(let tries=0;tries<80;tries++){const a=rnd()*Math.PI*2,d=35+rnd()*110,x=Math.cos(a)*d,z=Math.sin(a)*d;if(Math.abs(x-lerpRiver(river,z))<16)continue;if(towns.some(t=>Math.hypot(t.x-x,t.z-z)<30))continue;forests.push({x:Math.round(x),z:Math.round(z),r:18+(rnd()*10|0),d:18+(rnd()*18|0)});break}
  const rocks=[];for(let i=0;i<4;i++)for(let tries=0;tries<80;tries++){const a=rnd()*Math.PI*2,d=44+rnd()*95,x=Math.cos(a)*d,z=Math.sin(a)*d;if(Math.abs(x-lerpRiver(river,z))<14)continue;if(towns.some(t=>Math.hypot(t.x-x,t.z-z)<24))continue;rocks.push({x:Math.round(x),z:Math.round(z),r:8+(rnd()*4|0),d:8+(rnd()*5|0)});break}
  return sanitizeMap({name,river,towns,ores,forests,rocks})
 }
 function presetMaps(){return [generatePreset('northvale','Nordtal'),generatePreset('meadowreach','Wiesenfurt'),generatePreset('ironpass','Eisenfurt'),generatePreset('redmoor','Rotmoor')]}
 function sanitizeMap(raw){
  const baseMap=BASE_MAP,src=raw&&typeof raw==='object'?raw:{};
 const hasTowns=Array.isArray(src.towns),hasOres=Array.isArray(src.ores),hasForests=Array.isArray(src.forests),hasRocks=Array.isArray(src.rocks);
 const map={name:String(src.name||baseMap.name||'Karte').slice(0,32),river:(Array.isArray(src.river)?src.river:baseMap.river).slice(0,5),towns:[],ores:[],forests:[],rocks:[]};
 while(map.river.length<5)map.river.push(baseMap.river[map.river.length]||0);
 map.river=map.river.map((v,i)=>clamp(Number.isFinite(+v)?+v:baseMap.river[i],-140,140));
 const fixPoint=(o,r=16)=>({x:clamp(Math.round(+o.x||0),-MAP_LIMIT,MAP_LIMIT),z:clamp(Math.round(+o.z||0),-MAP_LIMIT,MAP_LIMIT),r:clamp(Math.round(+o.r||r),8,34),d:clamp(Math.round(+o.d||24),8,48)});
 for(const t of hasTowns?src.towns:baseMap.towns){if(!t)continue;map.towns.push({n:String(t.n||((t.k==='enemy')?'Banditenlager':'Dorf')).slice(0,24),x:clamp(Math.round(+t.x||0),-MAP_LIMIT,MAP_LIMIT),z:clamp(Math.round(+t.z||0),-MAP_LIMIT,MAP_LIMIT),k:t.k==='enemy'?'enemy':'friend'})}
 for(const o of hasOres?src.ores:baseMap.ores){if(!o)continue;map.ores.push({k:o.k==='copper'?'copper':'iron',x:clamp(Math.round(+o.x||0),-MAP_LIMIT,MAP_LIMIT),z:clamp(Math.round(+o.z||0),-MAP_LIMIT,MAP_LIMIT)})}
 for(const f of hasForests?src.forests:baseMap.forests){if(f)map.forests.push(fixPoint(f,20))}
 for(const r of hasRocks?src.rocks:baseMap.rocks){if(r)map.rocks.push(fixPoint(r,10))}
 const counts={friend:0,enemy:0};for(const t of map.towns)counts[t.k]++;
 if(!hasTowns&& !map.towns.length)map.towns=baseMap.towns.map(t=>({...t}));
 if(!hasTowns&&counts.friend<2)for(const t of baseMap.towns.filter(t=>t.k==='friend'))if(counts.friend<2){map.towns.push({...t});counts.friend++}
 if(!hasTowns&&counts.enemy<1)map.towns.push({...baseMap.towns.find(t=>t.k==='enemy')});
 if(!hasOres&&map.ores.filter(o=>o.k==='iron').length<2)map.ores.push(...baseMap.ores.filter(o=>o.k==='iron').slice(0,2-map.ores.filter(o=>o.k==='iron').length).map(o=>({...o})));
 if(!hasOres&&map.ores.filter(o=>o.k==='copper').length<2)map.ores.push(...baseMap.ores.filter(o=>o.k==='copper').slice(0,2-map.ores.filter(o=>o.k==='copper').length).map(o=>({...o})));
 if(!hasForests&& !map.forests.length)map.forests=baseMap.forests.map(f=>({...f}));
 if(!hasRocks&& !map.rocks.length)map.rocks=baseMap.rocks.map(r=>({...r}));
 return JSON.parse(JSON.stringify(map))
 }
 const blankMap=(name='Eigene Karte')=>sanitizeMap({name,river:[...BASE_MAP.river],towns:[],ores:[],forests:[],rocks:[]});
 const cloneMap=map=>sanitizeMap(map);
 const defaultMap=()=>cloneMap(BASE_MAP);
 let worldConfig=defaultMap();
 const setWorldConfig=map=>worldConfig=sanitizeMap(map);
 const getWorldConfig=()=>cloneMap(worldConfig);
 const api={WORLD_HALF,RIVER_Z,modular,passOverlap,height,riverX,local,world,base,snapPlacement,drawbridge,separate,blankMap,defaultMap,presetMaps,generatePreset,sanitizeMap,cloneMap,setWorldConfig,getWorldConfig};
 if(typeof module!=='undefined')module.exports=api;else root.BFRules=api;
})(typeof globalThis!=='undefined'?globalThis:this);
