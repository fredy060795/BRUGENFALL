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
 // ---- Fluss als freier Pfad (beliebige Richtung, beliebig viele Punkte) oder kein Fluss ----
 const RC=new Map();
 function riverPath(map){const m=map||worldConfig;if(!m||m.noRiver)return null;if(Array.isArray(m.rpath)&&m.rpath.length>=2)return m.rpath;const r=Array.isArray(m.river)&&m.river.length===5?m.river:BASE_MAP.river,sc=m.scale||1;return r.map((x,i)=>({x:clamp(+x||0,-140,140)*sc,z:RIVER_Z[i]*sc}))}
 function half(map){const m=map||worldConfig;return WORLD_HALF*((m&&m.scale)||1)}
 // geglättete Stützpunkte (Catmull-Rom), an den Enden bis weit über den Kartenrand verlängert
 // Enden nahe am Kartenrand fließen gerade zum Rand hinaus; Enden im Inneren sind Quelle bzw. Mündung (Fluss läuft schmal aus)
 function riverSamples(map){const P=riverPath(map);if(!P)return null;const Hh=half(map),key=Hh+'|'+P.map(p=>p.x+','+p.z).join(';');if(RC.has(key))return RC.get(key);
  const pts=[],n=P.length,g=i=>P[Math.max(0,Math.min(n-1,i))];
  for(let i=0;i<n-1;i++){const p0=g(i-1),p1=g(i),p2=g(i+1),p3=g(i+2);for(let k=0;k<12;k++){const t=k/12,t2=t*t,t3=t2*t,f=(a,b,c,d)=>.5*(2*b+(-a+c)*t+(2*a-5*b+4*c-d)*t2+(-a+3*b-3*c+d)*t3);pts.push({x:f(p0.x,p1.x,p2.x,p3.x),z:f(p0.z,p1.z,p2.z,p3.z)})}}
  pts.push({...P[n-1]});const EDGE=Math.max(30,Hh*.12),edgeOut=p=>{const dx=Hh-Math.abs(p.x),dz=Hh-Math.abs(p.z);if(Math.min(dx,dz)>EDGE)return null;return dx<dz?{x:Math.sign(p.x||1)*Hh*1.6,z:p.z}:{x:p.x,z:Math.sign(p.z||1)*Hh*1.6}};
  const e0=edgeOut(P[0]),e1=edgeOut(P[n-1]);if(e0)pts.unshift(e0);if(e1)pts.push(e1);
  let L=0;pts[0].s=0;for(let i=1;i<pts.length;i++){L+=Math.hypot(pts[i].x-pts[i-1].x,pts[i].z-pts[i-1].z);pts[i].s=L}
  const TAP=40,tap=s=>Math.min(e0?1:Math.min(1,s/TAP),e1?1:Math.min(1,(L-s)/TAP));for(const q of pts)q.w=tap(q.s);pts.L=L;pts.open=[!e0,!e1];
  if(RC.size>32)RC.clear();RC.set(key,pts);return pts}
 // Abstand zum Fluss; an offenen Enden wirkt der Fluss schmaler (effektiver Abstand wächst)
 function riverDist(x,z,map){const S=riverSamples(map);if(!S)return 1e9;let best=1e9,bw=1;for(let i=0;i<S.length-1;i++){const a=S[i],b=S[i+1],dx=b.x-a.x,dz=b.z-a.z,L2=dx*dx+dz*dz||1,t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/L2)),ex=a.x+dx*t-x,ez=a.z+dz*t-z,d=ex*ex+ez*ez;if(d<best){best=d;bw=a.w+(b.w-a.w)*t}}return Math.sqrt(best)/Math.max(.25,bw)+(1-bw)*9}
 // läuft der Fluss durchgehend von Süd nach Nord? (nur dann fahren Handelsschiffe)
 function riverNS(map){const S=riverSamples(map);if(!S||S.open[0]||S.open[1])return false;for(let i=1;i<S.length;i++)if(S[i].z<=S[i-1].z)return false;return true}
 function riverX(z,map){const S=riverSamples(map);if(!S)return 1e6;let bx=S[0].x,bd=1e9;for(let i=0;i<S.length-1;i++){const a=S[i],b=S[i+1];if((z-a.z)*(z-b.z)<=0&&a.z!==b.z){const t=(z-a.z)/(b.z-a.z);return a.x+(b.x-a.x)*t}const d=Math.abs(a.z-z);if(d<bd){bd=d;bx=a.x}}return bx}
 function height(x,z,map){let h=smooth(Math.hypot(x,z),24,70)*(Math.sin(x*.042)*Math.cos(z*.037)*2.5+Math.sin(z*.077+x*.023)*1.1);const d=riverDist(x,z,map);return h*smooth(d,6,22)-(1-smooth(d,3,7.5))*2.6}
 const local=(b,x,z)=>{const a=(b.r||0)*Math.PI/2,c=Math.cos(a),s=Math.sin(a),dx=x-b.x,dz=z-b.z;return [dx*c-dz*s,dx*s+dz*c]};
 const world=(b,x,z)=>{const a=(b.r||0)*Math.PI/2,c=Math.cos(a),s=Math.sin(a);return [b.x+x*c+z*s,b.z-x*s+z*c]};
 function base(t,x,z,r,catalog,map){if(t==='bridge')return 0;if(t==='moat')return height(x,z,map);const d=catalog[t]||catalog;if(!d)return height(x,z,map);let h=-Infinity;const b={x,z,r};for(let i=0;i<=4;i++)for(let j=0;j<=4;j++){const p=world(b,(i/4-.5)*d.w,(j/4-.5)*d.d);h=Math.max(h,height(...p,map))}return h+.02}
 const NOSNAP=['field','hopfield','orchard','moat','bridge','fire','bed','road','path'];
 // Häuserzeilen: gleich ausgerichtete Gebäude rasten bündig aneinander (Front an Front ausgerichtet) oder Rücken an Rücken
 function snapTown(t,x,z,r,buildings,catalog,maxDist){const own=catalog[t];if(!own)return null;const[w,d]=dims(catalog,t,r);let best=null,bd=maxDist;
  for(const b of buildings||[]){if(!b||!b.t||modular.includes(b.t)||NOSNAP.includes(b.t)||((b.r||0)&3)!==(r&3))continue;const other=catalog[b.t];if(!other)continue;const[w2,d2]=dims(catalog,b.t,b.r||0);
   const rr=r&3,fx=rr===1?1:rr===3?-1:0,fz=rr===0?1:rr===2?-1:0,c=[];
   if(fz){const zf=b.z+fz*(d2-d)/2;c.push({x:b.x+(w+w2)/2,z:zf},{x:b.x-(w+w2)/2,z:zf},{x:b.x,z:b.z-fz*(d+d2)/2})}
   else{const xf=b.x+fx*(w2-w)/2;c.push({x:xf,z:b.z+(d+d2)/2},{x:xf,z:b.z-(d+d2)/2},{x:b.x-fx*(w+w2)/2,z:b.z})}
   for(const q of c){const dd=Math.hypot(q.x-x,q.z-z);if(dd<bd){bd=dd;best=q}}}
  return best?{x:best.x,z:best.z,snapped:true}:null}
 function snapPlacement(t,x,z,r,buildings,catalog,maxDist=1.6){
  if(!(modular.includes(t)||t==='moat')){if(NOSNAP.includes(t))return{x,z,snapped:false};return snapTown(t,x,z,r,buildings,catalog,Math.max(maxDist,2.4))||{x,z,snapped:false}}
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
 function sanitizeMap(raw, allowEmpty=false){
  const baseMap=BASE_MAP,src=raw&&typeof raw==='object'?raw:{},sc=clamp(Math.round(+src.scale||1),1,5),ML=MAP_LIMIT*sc;
  const map={name:String(src.name||baseMap.name||'Karte').slice(0,32),river:(Array.isArray(src.river)?src.river:baseMap.river).slice(0,5),towns:[],ores:[],forests:[],rocks:[]};
  while(map.river.length<5)map.river.push(allowEmpty?0:(baseMap.river[map.river.length]||0));
  map.river=map.river.map((v,i)=>clamp(Number.isFinite(+v)?+v:(allowEmpty?0:baseMap.river[i]),-140,140));
  if(sc>1)map.scale=sc;if(src.noRiver)map.noRiver=true;if(Array.isArray(src.rpath)&&src.rpath.length>=2)map.rpath=src.rpath.slice(0,24).map(p=>({x:clamp(Math.round(+p.x||0),-190*sc,190*sc),z:clamp(Math.round(+p.z||0),-190*sc,190*sc)}));
  const fixPoint=(o,r=16)=>({x:clamp(Math.round(+o.x||0),-ML,ML),z:clamp(Math.round(+o.z||0),-ML,ML),r:clamp(Math.round(+o.r||r),8,34),d:clamp(Math.round(+o.d||24),8,48)});
  // Explizit übergebene Arrays respektieren (auch wenn leer) – nur Defaults nutzen wenn nichts übergeben wurde
  if(Array.isArray(src.towns)){
    for(const t of src.towns){if(!t)continue;map.towns.push({n:String(t.n||((t.k==='enemy')?'Banditenlager':'Dorf')).slice(0,24),x:clamp(Math.round(+t.x||0),-ML,ML),z:clamp(Math.round(+t.z||0),-ML,ML),k:t.k==='enemy'?'enemy':'friend'})}
  }else if(!allowEmpty){
    for(const t of baseMap.towns){if(!t)continue;map.towns.push({n:String(t.n||((t.k==='enemy')?'Banditenlager':'Dorf')).slice(0,24),x:clamp(Math.round(+t.x||0),-ML,ML),z:clamp(Math.round(+t.z||0),-ML,ML),k:t.k==='enemy'?'enemy':'friend'})}
  }
  if(Array.isArray(src.ores)){
    for(const o of src.ores){if(!o)continue;map.ores.push({k:o.k==='copper'?'copper':'iron',x:clamp(Math.round(+o.x||0),-ML,ML),z:clamp(Math.round(+o.z||0),-ML,ML)})}
  }else if(!allowEmpty){
    for(const o of baseMap.ores){if(!o)continue;map.ores.push({k:o.k==='copper'?'copper':'iron',x:clamp(Math.round(+o.x||0),-ML,ML),z:clamp(Math.round(+o.z||0),-ML,ML)})}
  }
  if(Array.isArray(src.forests)){
    for(const f of src.forests){if(f)map.forests.push(fixPoint(f,20))}
  }else if(!allowEmpty){
    for(const f of baseMap.forests){if(f)map.forests.push(fixPoint(f,20))}
  }
  if(Array.isArray(src.rocks)){
    for(const r of src.rocks){if(r)map.rocks.push(fixPoint(r,10))}
  }else if(!allowEmpty){
    for(const r of baseMap.rocks){if(r)map.rocks.push(fixPoint(r,10))}
  }
  // Mindest-Füllung nur wenn allowEmpty=false
  if(!allowEmpty){
    // Dörfer und Banditenlager sind optional – nichts mehr nachfüllen
    if(map.ores.filter(o=>o.k==='iron').length<2)map.ores.push(...baseMap.ores.filter(o=>o.k==='iron').slice(0,2-map.ores.filter(o=>o.k==='iron').length).map(o=>({...o})));
    if(map.ores.filter(o=>o.k==='copper').length<2)map.ores.push(...baseMap.ores.filter(o=>o.k==='copper').slice(0,2-map.ores.filter(o=>o.k==='copper').length).map(o=>({...o})));
    if(!map.forests.length)map.forests=baseMap.forests.map(f=>({...f}));
    if(!map.rocks.length)map.rocks=baseMap.rocks.map(r=>({...r}));
  }
  return JSON.parse(JSON.stringify(map))
 }
 const cloneMap=map=>sanitizeMap(map);
 const defaultMap=()=>cloneMap(BASE_MAP);
 const emptyMap=(name='Leere Karte')=>sanitizeMap({name,river:[0,0,0,0,0],towns:[],ores:[],forests:[],rocks:[]},true);
 let worldConfig=defaultMap();
 const setWorldConfig=map=>worldConfig=sanitizeMap(map);
 const getWorldConfig=()=>cloneMap(worldConfig);
 function scaleMap(src,s){s=clamp(Math.round(+s||1),1,5);const m=sanitizeMap(src,true),old=m.scale||1,f=s/old;if(f===1)return m;
  const rnd=makeRng(hashSeed('scale:'+s+':'+(m.name||''))),ML=MAP_LIMIT*s,mv=o=>({...o,x:Math.round(o.x*f),z:Math.round(o.z*f)});
  const out={...m,scale:s,towns:m.towns.map(mv),ores:m.ores.map(mv),forests:m.forests.map(mv),rocks:m.rocks.map(mv)};
  if(m.rpath)out.rpath=m.rpath.map(mv);else if(!m.noRiver)out.rpath=riverPath(m).map(mv);
  const tmp={...out},ok=(x,z,pad)=>riverDist(x,z,tmp)>pad&&!out.towns.some(t=>Math.hypot(t.x-x,t.z-z)<40);
  const fill=(arr,n,make)=>{for(let k=0,tries=0;k<n&&tries<n*40;tries++){const x=Math.round((rnd()*2-1)*ML),z=Math.round((rnd()*2-1)*ML);if(!ok(x,z,18))continue;arr.push(make(x,z));k++}};
  const extra=Math.round(f*f-1);fill(out.forests,Math.max(4,m.forests.length*extra),(x,z)=>{const b=m.forests[Math.floor(rnd()*m.forests.length)]||{r:20,d:24};return{x,z,r:b.r,d:b.d}});
  fill(out.rocks,Math.max(2,m.rocks.length*extra),(x,z)=>{const b=m.rocks[Math.floor(rnd()*m.rocks.length)]||{r:12,d:16};return{x,z,r:b.r,d:b.d}});
  fill(out.ores,Math.max(2,Math.round(m.ores.length*(f-1)*1.5)),(x,z)=>({k:rnd()<.5?'iron':'copper',x,z}));
  return sanitizeMap(out,true)}
 const api={WORLD_HALF,half,scaleMap,RIVER_Z,modular,passOverlap,height,riverX,riverDist,riverSamples,riverPath,riverNS,local,world,base,snapPlacement,drawbridge,separate,defaultMap,emptyMap,presetMaps,generatePreset,sanitizeMap,cloneMap,setWorldConfig,getWorldConfig};
 if(typeof module!=='undefined')module.exports=api;else root.BFRules=api;
})(typeof globalThis!=='undefined'?globalThis:this);
