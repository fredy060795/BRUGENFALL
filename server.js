const Rules=require('./public/rules.js');
// Burgenfall – Koop-Server (HTTPS + WebSocket auf Port 5035)
const fs=require('fs'),path=require('path'),http=require('http'),https=require('https');
const {WebSocketServer}=require('ws');
const PORT=+process.env.PORT||5035,PUB=path.join(__dirname,'public');
const KF=process.env.KEY_FILE||path.join(__dirname,'certs/key.pem'),CF=process.env.CERT_FILE||path.join(__dirname,'certs/cert.pem');
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript','.jpg':'image/jpeg','.png':'image/png','.glb':'model/gltf-binary','.gltf':'model/gltf+json','.json':'application/json'};
const handler=(q,s)=>{let u;try{u=decodeURIComponent(q.url.split('?')[0])}catch{s.writeHead(400);return s.end('Bad request')}
 if(u==='/')u='/index.html';

 if(u==='/health'){s.writeHead(200,{'Content-Type':'application/json'});return s.end('{"ok":true}')}
 if(u==='/saves'){const L=[...rooms].map(([code,r])=>({code,name:r.nm||'',day:(r.dy|0)+1,pop:r.n.length,build:r.b.length,gold:r.gold,saved:r.sv||0,online:r.pl.size,keep:r.b.some(b=>b.t==='keep')}));s.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});return s.end(JSON.stringify(L.sort((a,b)=>b.saved-a.saved)))}
 if(u==='/saves/delete'&&q.method==='POST'){let d='';q.on('data',c=>{d+=c;if(d.length>2000)q.destroy()});q.on('end',()=>{try{const{code}=JSON.parse(d),r=rooms.get(code);if(!r||r.pl.size){s.writeHead(409,{'Content-Type':'application/json'});return s.end('{"ok":false,"why":"Welt ist in Benutzung oder unbekannt"}')}rooms.delete(code);deletedAny=true;save();s.writeHead(200,{'Content-Type':'application/json'});s.end('{"ok":true}')}catch(e){s.writeHead(400);s.end('{"ok":false}')}});return}
 let root=PUB,rel=u.slice(1);
 if(u.startsWith('/three/')){root=path.join(__dirname,'node_modules/three/build');rel=u.slice(7)}
 else if(u.startsWith('/addons/')){root=path.join(__dirname,'node_modules/three/examples/jsm');rel=u.slice(8)}
 const f=path.resolve(root,rel);
 if(!f.startsWith(root+path.sep)||!fs.existsSync(f)||!fs.statSync(f).isFile()){s.writeHead(404);return s.end('404')}
 s.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream','Cache-Control':'no-cache'});fs.createReadStream(f).on('error',()=>s.destroy()).pipe(s)};

let srv;
try{if(process.env.HTTP)throw new Error('HTTP erzwungen');srv=https.createServer({key:fs.readFileSync(KF),cert:fs.readFileSync(CF)},handler);console.log('HTTPS aktiv: https://<domain>:'+PORT)}
catch(e){console.log(process.env.HTTP?'HTTP-Testmodus: http://localhost:'+PORT:'! Keine Zertifikate gefunden ('+KF+') -> unverschlüsseltes HTTP. Siehe README.');srv=http.createServer(handler)}
const wss=new WebSocketServer({server:srv});srv.listen(PORT,process.env.HOST||'0.0.0.0');

// ---------- Spiellogik ----------
const RD=+process.env.RAID_DIST||0;
const WORLD_HALF=200,BUILD_LIMIT=190,RESOURCE_LIMIT=190,DEER_LIMIT=185;
const rooms=new Map();let uid=1;
const J=(w,d,c,hp,x={})=>({w,d,c,hp,...x});
const BD={wall:J(4,1,{stone:6},800),battle:J(4,1,{stone:8},900),palisade:J(4,.6,{wood:6},300),
 tower:J(4.6,4.6,{stone:20,wood:5},1500,{post:{n:2,y:11}}),gate:J(6,1.6,{stone:15,wood:15},1500,{post:{n:2,y:5}}),watchpost:J(3,3,{wood:15},500,{post:{n:1,y:6.1}}),
 house:J(6,6,{wood:15,stone:4},400,{cap:4}),bighouse:J(8,6,{wood:35,stone:15},600,{cap:8}),keep:J(10,8,{wood:40,stone:40},2500,{cap:8}),
 garrison:J(8,6,{wood:30,stone:25},1000),dungeon:J(6,6,{stone:18,wood:6},900),
 farm:J(8,6,{wood:30,stone:5},400,{jobs:{farmer:3}}),field:J(4,4,{wood:4},150),
 lumber:J(5,4,{wood:20},300,{jobs:{wood:2}}),quarry:J(5,4,{wood:20,stone:5},300,{jobs:{mason:2}}),lodge:J(5,4,{wood:25},300,{jobs:{hunter:2}}),
 bakery:J(6,5,{wood:20,stone:15},400,{jobs:{cook:1},prod:{every:20,in:{wheat:3},out:{bread:2}}}),
 dairy:J(5,5,{wood:20,stone:10},400,{jobs:{cook:1},prod:{every:35,in:{milk:2},out:{cheese:1}}}),
 sheep:J(6,6,{wood:25},300,{jobs:{shepherd:1},prod:{every:30,out:{wool:1}}}),cow:J(7,6,{wood:30},350,{jobs:{shepherd:1},prod:{every:42,out:{milk:1,hides:1}}}),
 weaver:J(5,5,{wood:20,stone:5},350,{jobs:{weaver:1},prod:{every:40,in:{wool:2},out:{cloth:1}}}),
 fishery:J(5,4,{wood:25},300,{jobs:{fisher:1},prod:{every:25,out:{fish:1}},water:1}),
 smithy:J(6,5,{wood:20,stone:30},500,{jobs:{smith:1},prod:{every:60,in:{stone:4,wood:2},out:{weapons:1}}}),
 apothecary:J(5,5,{wood:20,stone:10},400,{jobs:{healer:1},prod:{every:34,in:{honey:1,apples:1},out:{potions:1}}}),tavern:J(8,6,{wood:40,stone:20},600,{jobs:{keeper:1}}),chapel:J(6,8,{stone:40,wood:20},700,{jobs:{priest:1}}),
 market:J(6,4,{wood:25},300,{jobs:{trader:1}}),storage:J(6,5,{wood:30},350,{store:250}),cemetery:J(10,8,{wood:15,stone:10},300,{jobs:{gravedigger:1},graves:20}),
 bridge:J(24,4,{wood:50,stone:15},700,{bridge:1}),bench:J(2,1,{wood:10},100),bed:J(1.2,2.1,{wood:8},80),fire:J(1.6,1.6,{wood:5},60)};
const BN={wall:'Mauer',battle:'Zinnenmauer',palisade:'Palisade',tower:'Wachturm',gate:'Torhaus',watchpost:'Wachposten',house:'Wohnhaus',bighouse:'Großes Wohnhaus',keep:'Bergfried',garrison:'Garnison',dungeon:'Kerker',farm:'Bauernhof',field:'Weizenfeld',lumber:'Holzfällerhütte',quarry:'Steinbruchhütte',lodge:'Jägerhütte',bakery:'Bäckerei',dairy:'Käserei',sheep:'Schafstall',cow:'Kuhstall',weaver:'Weberei',fishery:'Fischerei',smithy:'Schmiede',apothecary:'Apotheke',tavern:'Taverne',chapel:'Kapelle',market:'Marktstand',storage:'Lagerhaus',cemetery:'Friedhof',bridge:'Brücke',bench:'Werkbank',bed:'Bett',fire:'Lagerfeuer'};
const JN={farmer:'Bauer',wood:'Holzfäller',hunter:'Jäger',mason:'Steinmetz',cook:'Bäcker/Metzger',smith:'Schmied',priest:'Priester',healer:'Heiler',keeper:'Wirt',shepherd:'Hirte/Imker',weaver:'Weber',fisher:'Fischer',gravedigger:'Totengräber',trader:'Händler',miner:'Bergmann',tanner:'Gerber',miller:'Müller',hangman:'Henker'};
const JOBS=Object.keys(JN),GN={wood:'Holz',stone:'Stein',wheat:'Weizen',meat:'Fleisch',bread:'Brot',roast:'Braten',wool:'Wolle',cloth:'Tuch',gambeson:'Gambeson',milk:'Milch',cheese:'Käse',fish:'Fisch',weapons:'Waffen',armor:'Rüstungen',potions:'Heiltränke',flour:'Mehl',iron:'Eisen',copper:'Kupfer',honey:'Honig',hides:'Felle',leather:'Leder',apples:'Äpfel',hops:'Hopfen',beer:'Bier',sausage:'Wurst',smoked:'Geräuchertes'},STOCK=Object.keys(GN);
Object.assign(BD,{well:J(2,2,{stone:10,wood:5},300,{well:1}),moat:J(4,4,{wood:2,stone:1},500,{moat:1}),
 ironmine:J(5,5,{wood:30,stone:10},500,{jobs:{miner:2},prod:{every:25,out:{iron:2}},ore:'iron'}),coppermine:J(5,5,{wood:30,stone:10},500,{jobs:{miner:2},prod:{every:25,out:{copper:2}},ore:'copper'}),
 pigsty:J(6,6,{wood:25},300,{jobs:{shepherd:1},prod:{annual:true,out:{meat:8}}}),apiary:J(4,4,{wood:15},250,{jobs:{shepherd:1},prod:{every:45,out:{honey:1}}}),
 butcher:J(5,4,{wood:20,stone:10},350,{jobs:{cook:1},prod:{every:30,in:{meat:2},out:{sausage:3}}}),tannery:J(5,4,{wood:25,stone:5},350,{jobs:{tanner:1},prod:{every:35,in:{hides:2},out:{leather:1}}}),
 orchard:J(8,8,{wood:20},300,{jobs:{farmer:2},prod:{every:35,out:{apples:2}}}),hopfield:J(4,4,{wood:8},150,{jobs:{farmer:1},prod:{every:40,out:{hops:1}}}),
 brewery:J(6,5,{wood:30,stone:10},400,{jobs:{cook:1},prod:{every:30,in:{hops:2,wheat:1},out:{beer:2}}}),smokehouse:J(4,4,{wood:15,stone:5},300,{jobs:{cook:1},prod:{every:30,in:{fish:2},out:{smoked:3}}}),
 cathedral:J(12,16,{stone:150,wood:60},3000,{jobs:{priest:3}}),torture:J(6,6,{stone:25,wood:10},800),portcullis:J(6,1.6,{stone:15,wood:15},1500,{post:{n:2,y:5}}),harbor:J(8,6,{wood:50,stone:20},800,{harbor:1})});
BD.smithy.prod={every:40,in:{iron:2,wood:1},out:{weapons:1}};
Object.assign(BD,{mill:J(4,4,{wood:30,stone:10},400,{jobs:{miller:1},prod:{every:14,in:{wheat:3},out:{flour:3}}})});
BD.bakery.prod={every:18,in:{flour:2},out:{bread:3}};BD.smithy.prod={every:36,in:{iron:2,wood:1},out:{weapons:1},dest:'garrison'};BD.torture.jobs={hangman:1};BD.keep.c={wood:60};BD.keep.post={n:2,y:9};BD.keep.w=13;BD.keep.d=11;BD.house.w=8;BD.chapel.w=12;BD.chapel.d=16;
BD.church=J(12,16,{stone:80,wood:40},1500,{jobs:{priest:2}});BD.stairs=J(2,6,{stone:30,wood:10},600,{});
Object.assign(BN,{church:'Kirche',stairs:'Treppe zum Wehrgang',mill:'Mühle',well:'Brunnen',moat:'Wassergraben',ironmine:'Eisenmine',coppermine:'Kupfermine',pigsty:'Schweinestall',apiary:'Imkerei',butcher:'Metzgerei',tannery:'Gerberei',orchard:'Obstplantage',hopfield:'Hopfenfeld',brewery:'Brauerei',smokehouse:'Räucherei',cathedral:'Kathedrale',torture:'Folterkammer',portcullis:'Torhaus mit Fallgitter',harbor:'Hafen'});
BD.gate.w=BD.portcullis.w=8;BD.gate.d=BD.portcullis.d=4;BD.gate.post.y=BD.portcullis.post.y=4;BD.church.w=8;BD.church.d=12;BD.farm.w=18;BD.farm.d=16;
Object.assign(BD,{bower:J(5,5,{wood:25,stone:8},420,{jobs:{smith:1},prod:{every:45,in:{wood:3},out:{weapons:1},dest:'garrison'}}),armorer:J(5,5,{wood:25,stone:20,iron:5},600,{jobs:{smith:1}}),armory:J(6,5,{stone:30,wood:15},900,{store:150}),granary:J(6,5,{wood:30,stone:10},500,{store:250})});
Object.assign(BN,{bower:'Bogenbauer',armorer:'Rüstungsmacher',armory:'Waffenkammer',granary:'Nahrungsmittellager'});
Object.assign(BD,{pyre:J(3,3,{wood:20,stone:5},200),gallows:J(3,2,{wood:25},180),plaza:J(12,12,{stone:40,wood:15},500,{plaza:1})});
Object.assign(BN,{pyre:'Scheiterhaufen',gallows:'Galgen',plaza:'Marktplatz'});
BD.chapel.w=6;BD.chapel.d=8;BD.market.d=8;
const hasRoom=(b,k)=>b.t==='keep'&&!!((b.ext||0)&(k==='dungeon'?1:2))&&(k!=='torture'||b.st>=2);
const jobsOf=b=>hasRoom(b,'torture')?{hangman:1}:BD[b.t].jobs;
function migrateRooms(r){const keep=r.b.find(b=>b.t==='keep')||r.ru.find(b=>b.t==='keep');if(!keep)return;const old=r.b.filter(b=>['dungeon','torture'].includes(b.t));for(const b of old){keep.ext=(keep.ext||0)|(b.t==='dungeon'?1:2);if(b.t==='torture')keep.pendingTorture=true;for(const n of r.n)if(n.wb===b.id)n.wb=keep.id;}r.b=r.b.filter(b=>!old.includes(b));if(keep.pendingTorture&&keep.st<2){keep.ext&=~2;}else if(keep.pendingTorture){keep.ext|=2;delete keep.pendingTorture;}r.ru=r.ru.filter(b=>!['dungeon','torture'].includes(b.t));}
const CAT={};for(const k in BD)CAT[k]={w:BD[k].w,d:BD[k].d,c:BD[k].c,n:BN[k],j:BD[k].jobs,p:BD[k].prod?{i:BD[k].prod.in,o:BD[k].prod.out,e:BD[k].prod.every,annual:!!BD[k].prod.annual,d:BD[k].prod.dest}:undefined};
const DEFAULT_MAP=Rules.presetMaps()[0];
const hashSeed=s=>{let h=2166136261>>>0;for(const ch of String(s)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0};
const makeRng=s=>{let x=(s>>>0)||1;return()=>((x=Math.imul(x,1664525)+1013904223>>>0)/4294967296)};
const townsOf=r=>(r.map&&r.map.towns)||DEFAULT_MAP.towns,friendTowns=r=>townsOf(r).filter(t=>t.k==='friend'),enemyTown=r=>townsOf(r).find(t=>t.k==='enemy')||townsOf(r)[0]||{n:'Banditenlager',x:25,z:-145,k:'enemy'};
const riverAt=(r,z)=>Rules.riverX(z,r.map||DEFAULT_MAP),inRiver=(r,x,z,m=0)=>Math.abs(x-riverAt(r,z))<6+m;
function applyMap(r,map){r.map=Rules.sanitizeMap(map||DEFAULT_MAP);r.tw=r.map.towns.map(t=>({...t}));r.or=r.map.ores.map(o=>({id:uid++,k:o.k,x:o.x,z:o.z}));r.tr=[];r.rk=[];
 const occupied=[];const free=(x,z,pad)=>Math.abs(x)<=155&&Math.abs(z)<=155&&!inRiver(r,x,z,8)&&!townsOf(r).some(t=>Math.hypot(t.x-x,t.z-z)<pad)&&!occupied.some(o=>Math.hypot(o.x-x,o.z-z)<1.6);
 for(const f of r.map.forests){const rnd=makeRng(hashSeed('f:'+f.x+':'+f.z+':'+f.r+':'+f.d));for(let i=0;i<f.d;i++){const a=rnd()*6.283,d=Math.sqrt(rnd())*f.r,x=Math.round((f.x+Math.cos(a)*d)*100)/100,z=Math.round((f.z+Math.sin(a)*d)*100)/100;if(!free(x,z,18))continue;r.tr.push({id:uid++,x,z,hp:4,st:0});occupied.push({x,z})}}
 for(const k of r.map.rocks){const rnd=makeRng(hashSeed('r:'+k.x+':'+k.z+':'+k.r+':'+k.d));for(let i=0;i<k.d;i++){const a=rnd()*6.283,d=Math.sqrt(rnd())*k.r,x=Math.round((k.x+Math.cos(a)*d)*100)/100,z=Math.round((k.z+Math.sin(a)*d)*100)/100;if(!free(x,z,12))continue;r.rk.push({id:uid++,x,z,hp:5});occupied.push({x,z})}}
 r.dr=[];for(let i=0;i<14;i++)r.dr.push(newDeer(r));r.dt=true}
const NT={sword:{cost:50,hp:100,dmg:12,rng:2.2,cd:1,spd:3.4},archer:{cost:60,hp:60,dmg:9,rng:16,cd:1.5,spd:3},peasant:{cost:0,hp:50,dmg:0,rng:0,cd:1,spd:2.6,job:1}};
for(const j of JOBS)NT[j]={cost:0,hp:60,dmg:0,rng:0,cd:1,spd:2.8,job:1};
const PMAX=[1,5,3,8,3,1,13,13,3,3,2,5],cleanProf=a=>Array.isArray(a)&&a.length===12&&a.every((v,i)=>Number.isInteger(v)&&v>=0&&v<=PMAX[i])?a:[0,2,0,2,1,0,0,9,0,0,0,0];
const rnd=(a,b)=>a+Math.random()*(b-a),dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z),r2=v=>Math.round(v*100)/100;
const dims=(t,rot)=>rot&1?[BD[t].d,BD[t].w]:[BD[t].w,BD[t].d],reach=b=>Math.max(BD[b.t].w,BD[b.t].d)/2+1.5;
const costStr=c=>Object.entries(c).map(([k,n])=>n+' '+GN[k]).join(', '),afford=(r,c)=>Object.entries(c).every(([k,n])=>r.inv[k]>=n),pay=(r,c)=>{for(const k in c)r.inv[k]-=c[k]};
const frac=(c,f)=>Object.fromEntries(Object.entries(c).map(([k,n])=>[k,Math.max(1,Math.ceil(n*f))]));
function canPlace(r,t,x,z,rot){const B=BD[t],[w,d]=dims(t,rot);if(['dungeon','torture'].includes(t))return'Als Erweiterung im Bergfried einrichten';if(Math.abs(x)>BUILD_LIMIT||Math.abs(z)>BUILD_LIMIT)return'Außerhalb der Karte';const wr=Math.abs(x-riverAt(r,z));
 if(B.bridge){if(rot&1)return'Brücke nur quer zum Fluss';if(wr>4)return'Die Brücke muss den Fluss kreuzen'}
 else{if(wr<6+w/2)return'Im Wasser kann nicht gebaut werden';if(B.water&&(wr<9||wr>20))return'Fischerei muss am Flussufer stehen';if(B.harbor&&(wr<9.5||wr>13.5))return'Der Hafen muss direkt am Ufer stehen'}
 if(B.ore&&!r.or.some(o=>o.k===B.ore&&Math.hypot(o.x-x,o.z-z)<9))return'Kein '+(B.ore==='iron'?'Eisen':'Kupfer')+'-Vorkommen in der Nähe (siehe Karte)'
 for(const o of[...r.b,...r.ru]){if(Rules.passOverlap(t,o.t))continue;const[w2,d2]=dims(o.t,o.r);if(Math.abs(x-o.x)<(w+w2)/2-.2&&Math.abs(z-o.z)<(d+d2)/2-.2)return'Hier ist kein Platz (anderes Gebäude oder Ruine)'}
 for(const o of r.tr)if(Math.abs(x-o.x)<w/2+.6&&Math.abs(z-o.z)<d/2+.6)return o.st?'Ein Wurzelstock steht im Weg – mit Axt oder Spitzhacke entfernen':'Ein Baum steht im Weg';
 if(t==='quarry'&&!r.rk.some(o=>{const [lx,lz]=Rules.local({x,z,r:rot},o.x,o.z);return Math.abs(lx)<=B.w/2&&Math.abs(lz)<=B.d/2}))return'Steinbruch muss auf einem Steinvorkommen stehen';
 for(const o of r.rk)if(t!=='quarry'&&(Math.abs(x-o.x)<w/2+1&&Math.abs(z-o.z)<d/2+1))return'Ein Fels steht im Weg';return null}
function seed(r){applyMap(r,r.map)}
function newDeer(r){let x,z,t=0;do{const a=rnd(0,6.28),d=rnd(25,90);x=Math.cos(a)*d;z=Math.sin(a)*d;t++}while(inRiver(r,x,z,3)&&t<10);return{id:uid++,x,z,hp:2,ry:0,w:null}}
function room(code,map){let r=rooms.get(code);if(!r){r={creative:false,map:Rules.sanitizeMap(map||DEFAULT_MAP),tw:[],paths:[],pathDirty:true,deerTimer:0,pl:new Map(),b:[],ru:[],n:[],e:[],w:[],co:[],gold:500,ar:[],an:[],pt:6,bt:40,bw:0,hr:+process.env.START_HOUR||8,dy:+process.env.START_DAY||0,wx:0,wt:60,tl:{axe:0,pick:0,hoe:0},
  inv:{wood:260,stone:130,wheat:14,meat:3,bread:0,roast:0,flour:0,wool:0,cloth:0,gambeson:0,milk:0,cheese:0,fish:0,weapons:2,armor:0,potions:0,iron:6,copper:0,honey:0,hides:0,leather:0,apples:0,hops:0,beer:0,sausage:0,smoked:0},or:[],ev:{on:1,every:240,fire:1,sick:1,omen:1,rats:1,thieves:1,ambush:1,cyc:1,sl:4},et:200,fires:[],cv:[],tt:150,cq:0,campOn:false,cr:5,omen:0,sup:10,pr:0,fame:0,gr:0,hap:50,dr:[],tr:[],rk:[],dt:true,set:{interval:120,max:6,autosave:30},tax:1,ration:1,next:120,dirty:true,tk:0,lastSave:0};
  rooms.set(code,r);applyMap(r,r.map)}return r}
const tx=(r,s)=>r.pl.forEach(p=>{if(p.ws.readyState===1)p.ws.send(s)});
const tell=(p,m)=>p.ws.send(JSON.stringify({t:'ev',m})),say=(r,m)=>tx(r,JSON.stringify({t:'ev',m}));
function raid(r){if(r.set.max<1||r.cq>0)return;const sol=r.n.filter(n=>n.k==='sword'||n.k==='archer').length,det=r.det||0,cap=Math.max(2,Math.floor(1.5*sol)),lim=Math.max(1,Math.min(r.set.max,Math.ceil(cap*(1-.5*det)))),n=1+Math.floor(Math.random()*lim),en=enemyTown(r),a=rnd(0,6.28);r.warned=false;
 for(let i=0;i<n;i++){const x=RD?Math.cos(a)*RD+rnd(-5,5):en.x+rnd(-8,8),z=RD?Math.sin(a)*RD+rnd(-5,5):en.z+rnd(-8,8);r.e.push({id:uid++,x,z,hp:70,cd:0,ry:0})}
 say(r,'⚠ Banditen aus '+en.n+' greifen an! ('+n+' Gegner, höchstens 1,5× deine Soldaten)');if(r.n.some(n=>n.m==='post'))say(r,'🔔 Wachposten sichten Banditen im Anmarsch!')}
function mv(o,x,z,sp,dt){const dx=x-o.x,dz=z-o.z,d=Math.hypot(dx,dz);if(d>.05){const s=Math.min(d,sp*dt);o.x+=dx/d*s;o.z+=dz/d*s;o.ry=Math.atan2(dx,dz)}return d}
function near(o,l,max){let b=null;for(const e of l){const d=dist(o,e);if(d<max){max=d;b=e}}return b}
const mkNpc=(r,k,x,z,o=0)=>{const n={id:uid++,k,o,x,z,ry:0,hp:NT[k].hp,cd:0,m:'guard',p:{x,z},i:rnd(0,6.28)};r.n.push(n);return n};
const WALLK=['wall','battle','palisade','tower','gate','portcullis','stairs'],postN=b=>b.t==='keep'&&(b.st|0)>=3?4:BD[b.t].post.n,postY=b=>b.t==='keep'?[8.15,9.3,11.3,11.3][b.st|0]:BD[b.t].post.y,
 fp=(b,lx,lz)=>{const t=(b.r|0)*Math.PI/2,c=Math.cos(t),s=Math.sin(t);return{x:b.x+lx*c+lz*s,z:b.z-lx*s+lz*c}},
 UP2={house:{to:'bighouse',c:{wood:25,stone:10}},chapel:{to:'church',c:{stone:100,wood:40}},church:{to:'cathedral',c:{stone:200,wood:60,iron:20}}},
 mh=b=>b.t==='keep'?[1200,2200,3500,5200][b.st|0]:BD[b.t].hp,capOf=b=>(BD[b.t].cap||0)+(b.t==='keep'?4*(b.st|0):0),UPG=[{wood:30,stone:80},{stone:160,wood:40,iron:20},{stone:240,iron:60,wood:60}],UPN=['Holzhalle','Holzbergfried','Steinbergfried','Verstärkter Steinbergfried'];
const popCap=r=>4+r.b.reduce((s,b)=>s+capOf(b),0),food=r=>r.inv.wheat+r.inv.meat+r.inv.bread+r.inv.roast+r.inv.cheese+r.inv.fish+r.inv.honey+r.inv.apples+r.inv.sausage+r.inv.smoked;
const stockCap=r=>300+r.b.reduce((s,b)=>s+(b.t==='keep'?300+200*(b.st|0):0)+(BD[b.t].store||0),0);
function shoot(r,n,t,dmg){const d=dist(n,t),dur=Math.max(.25,d/22);r.ar.push({t:dur,tg:t,dmg});r.an.push([r2(n.x),r2(n.z),t.id||0,r2(t.x),r2(t.z),r2(dur),r2(n.el||0)])}
const season=r=>Math.floor((r.dy||0)/((r.ev&&r.ev.sl)||4))%4,FG=r=>[1,1.2,.8,0][season(r)]*(r.wx===1?1.5:1);
const BASEP={flour:25,wood:15,stone:25,wheat:20,bread:40,meat:30,cheese:50,wool:30,cloth:70,gambeson:95,fish:25,weapons:90,armor:140,potions:85,iron:35,copper:45,honey:40,leather:60,apples:15,beer:30,sausage:45,smoked:45};
const priceOf=(r,k)=>BASEP[k]*(['wheat','bread','meat','cheese','fish','apples','sausage','smoked','honey'].includes(k)?[1,.95,.85,1.35][season(r)]:k==='wood'?[1,1,1,1.3][season(r)]:1)*(1+.08*Math.sin((r.dy||0)*1.7+k.length*2.1));
const used=(r,b)=>r.n.filter(n=>n.wb===b.id&&n.hp>0).length;
const priestCap=b=>({chapel:6,church:12,cathedral:18}[b.t]||0),SICK_IMMUNE=new Set(['gravedigger','healer']);
const sickLimit=n=>[0,780,600,450][Math.max(1,Math.min(3,n.sk|0))]||600;
function diseaseName(n){return ['','leicht','mittelschwer','schwer'][Math.max(1,Math.min(3,n.sk|0))]}
function freeSlot(r,job,at){let best=null,bd=1e9;for(const b of r.b){const s=jobsOf(b)&&jobsOf(b)[job];if(!s||b.off||b.manual||used(r,b)>=s)continue;const d=at?dist(b,at):0;if(d<bd){bd=d;best=b}}return best}
function idle(r,n,dt){const c=r.b.find(b=>b.t==='keep')||{x:0,z:6};if(n.pz>0){n.pz-=dt;return}if(!n.w||mv(n,n.w.x,n.w.z,1.6,dt)<.8){n.w={x:c.x+rnd(-9,9),z:c.z+rnd(-2,10)};n.pz=rnd(2,7)}}
function homeOf(r,n){let h=n.hid&&r.b.find(b=>b.id===n.hid);if(!h){let best=null,bs=9;for(const b of r.b){const c=capOf(b);if(!c)continue;const u=(r.res[b.id]||0)/c;if(u<1&&u<bs){bs=u;best=b}}if(best){n.hid=best.id;r.res[best.id]=(r.res[best.id]||0)+1}h=best}return h}
const WK={smith:2,miner:2};
function storeAt(r,from){const s=near(from,r.b.filter(b=>b.t==='storage'),1e9)||r.b.find(b=>b.t==='keep')||from;return BD[s.t]?fp(s,0,BD[s.t].d/2+1.8):{x:s.x,z:s.z}}
const WORKSPOTS={smithy:[[-1.6,1.25,0]],bakery:[[1.35,.65,0]],bower:[[1.45,-.2,0]],armorer:[[1.3,-.45,0]],dairy:[[-1.5,.35,Math.PI]],butcher:[[-1.4,.3,Math.PI]],smokehouse:[[0,.2,Math.PI]],brewery:[[0,-.7,Math.PI]],tannery:[[0,-.6,Math.PI/2]],weaver:[[-1.1,.2,Math.PI]],tavern:[[0,-1.4,Math.PI/2]],apothecary:[[0,-.8,Math.PI]],mill:[[0,-.3,Math.PI/2]],keep:[[2.1,-1.7,Math.PI/2]],chapel:[[0,-2,Math.PI]],church:[[0,-4,Math.PI]],cathedral:[[0,-5,Math.PI]]};
function workPoint(r,b,n){const slots=WORKSPOTS[b.t]||[[0,0,Math.PI]],index=r.n.filter(o=>o.wb===b.id&&o.hp>0).findIndex(o=>o.id===n.id),q=slots[Math.max(0,index)%slots.length],p=fp(b,q[0]+(index>0?.85*index:0),q[1]);return {...p,ry:q[2]+(b.r||0)*Math.PI/2};}
function enterBuilding(n,b,target,dt){const [x,z]=Rules.local(b,n.x,n.z),B=BD[b.t],inside=Math.abs(x)<B.w/2-.25&&Math.abs(z)<B.d/2-.25;
 if(!inside){const side=b.t==='church',door=side?fp(b,4.8,3.5):fp(b,0,B.d/2+.7);if(!n.entry||n.entry!==b.id){if(dist(n,door)>.18){mv(n,door.x,door.z,2.8,dt);return false;}n.entry=b.id;}const threshold=side?fp(b,3.1,3.5):fp(b,0,B.d/2-.7);if(dist(n,threshold)>.15){mv(n,threshold.x,threshold.z,2.8,dt);return false;}}
 n.entry=null;n.insideId=b.id;if(dist(n,target)>.12){mv(n,target.x,target.z,2.8,dt);return false;}n.ry=target.ry??Math.PI;return true;}
function exitBuilding(n,b,dt){if(!WORKSPOTS[b.t]&&!['house','bighouse'].includes(b.t))return true;const B=BD[b.t],[x,z]=Rules.local(b,n.x,n.z);if(Math.abs(x)>B.w/2+.2||z>B.d/2+.5||z< -B.d/2-.2){n.insideId=0;return true;}const door=fp(b,0,B.d/2+.7);if(Math.abs(x)>.15&&z<B.d/2-.65){const mid=fp(b,0,B.d/2-.7);mv(n,mid.x,mid.z,2.8,dt);return false;}mv(n,door.x,door.z,2.8,dt);return false;}
function villageDay(r,day){if(!r.creative){
  const tax=r.tax??1,ration=r.ration??1;
  // Steuern: Gold vom Volk
  const pop=r.n.filter(n=>n.hp>0&&!n.conv).length;
  const taxGold=[1,3,6][tax]*Math.max(0,Math.floor(pop/4));
  if(taxGold){r.gold+=taxGold;if(tax===2)say(r,'💰 Hohe Steuern: +'+taxGold+' Gold (Unzufriedenheit steigt)')}
  // Rationen: großzügig 1.5x, normal 1x, hungern 0.5x
  let need=Math.ceil(pop*[1.5,1,.5][ration]);const want=need;
  for(const k of ['bread','roast','smoked','sausage','cheese','fish','apples','honey','meat','wheat']){const take=Math.min(need,Math.floor(r.inv[k]||0));r.inv[k]-=take;need-=take;}
  r.foodShortage=need;const winter=Math.floor(day/((r.ev&&r.ev.sl)||4))%4===3,heat=winter?Math.ceil(pop/2):0;const burn=Math.min(heat,Math.floor(r.inv.wood||0));r.inv.wood-=burn;r.heatShortage=heat-burn;
  if(need)say(r,'🍞 Es fehlen '+need+' Tagesrationen für die Einwohner');if(heat>burn)say(r,'🪵 Es fehlt Heizholz: '+(heat-burn));
}
 const yearDays=4*((r.ev&&r.ev.sl)||4);if(day>0&&day%yearDays===0)for(const b of r.b)if(b.t==='pigsty'&&!b.off&&b.lastMeatDay!==day){b.lastMeatDay=day;if(r.n.some(n=>n.wb===b.id&&n.hp>0&&!n.sk)){r.inv.meat=Math.min(stockCap(r),r.inv.meat+8);say(r,'🐖 Jährliche Schlachtung: +8 Fleisch aus dem Schweinestall');}}}
function settleJob(r,n){const b=r.b.find(b=>b.id===n.wb),P=b&&BD[b.t].prod,c=n.cy;let goods=null;
 if(b?.t==='armorer'&&c)goods=c.st==='deliver'?Object.fromEntries([[c.out,1]]):c.st==='work'?(c.recipe||armorerRecipe(r)).in:null;
 else if(P&&c)goods=c.st==='deliver'?P.out:c.st==='work'?P.in:null;
 for(const [k,v]of Object.entries(goods||{}))r.inv[k]=Math.min(stockCap(r),r.inv[k]+v);
 n.cy=null;n.cr=0;n.work=0;n.entry=null;}
function torment(r,n,wb,B,dt,X,Z){const c=n.cy||(n.cy={t:0});if(dist(n,{x:X,z:Z})>1.5){mv(n,X,Z,2.8,dt);return}n.ry=Math.PI;
 if(r.pr<1){wb.msg='';c.t=0;return}wb.msg='foltert';wb.act=r.tk;n.work=3;c.t+=dt;
 if(c.t>=25){c.t=0;r.det=Math.min(.6,(r.det||0)+.12);r.gold+=10;const dead=Math.random()<.2;if(dead)r.pr--;say(r,'🗝 Der Henker verhört einen Gefangenen'+(dead?' – er überlebt es nicht':'')+' – Abschreckung '+Math.round(r.det*100)+' %')}}
function armorerRecipe(r){
 const needGambeson=(r.inv.gambeson||0)<Math.max(2,Math.ceil(popCap(r)/6));
 if(needGambeson)return {name:'Gambeson',every:34,in:{cloth:2},out:{gambeson:1},dest:'armory'};
 return {name:'Rüstung',every:52,in:{gambeson:1,leather:1,iron:2},out:{armor:1},dest:'armory'};
}
function omenChoice(r){
 const hasPyre=r.b.some(b=>b.t==='pyre'),hasGal=r.b.some(b=>b.t==='gallows');
 let mode=hasPyre?'burn':hasGal?'hang':(Math.random()<.5?'burn':'hang');
 if(mode==='burn'&&!hasPyre&&hasGal)mode='hang';if(mode==='hang'&&!hasGal&&hasPyre)mode='burn';
 return mode;
}
function omenTargets(r){return r.n.filter(n=>n.hp>0&&n.om&&(NT[n.k].job||n.k==='peasant'))}
function triggerOmenVictim(r){
 const victims=omenTargets(r).filter(n=>n.k==='peasant'||n.k==='farmer'||n.k==='wood'||n.k==='mason'||n.k==='hunter');
 if(!victims.length)return false;
 const v=victims[Math.random()*victims.length|0],mode=omenChoice(r);
 v.hp=0;v.conv=1;v.om=0;v.omT=0;r.omenVictims=(r.omenVictims||0)+1;r.omen=Math.min(240,Math.max(r.omen||0,60)+30);r.sup=Math.min(100,(r.sup||0)+10);
 r.plazaEvent=mode;r.plazaEventT=Math.max(r.plazaEventT||0,45);
 if(mode==='burn')say(r,'🔥 Aberglaube eskaliert! '+(v.k==='peasant'?'Ein Dorfbewohner':'Ein Bewohner')+' wird auf dem Scheiterhaufen geopfert.');
 else say(r,'🪢 Aberglaube eskaliert! '+(v.k==='peasant'?'Ein Dorfbewohner':'Ein Bewohner')+' wird am Galgen geopfert.');
 return true;
}
function omenPriestCycle(r,n,dt){
 const targets=omenTargets(r).filter(o=>o.id!==n.id);
 if(!targets.length){n.omc=0;return false}
 let target=targets[0],best=1e9;
 for(const o of targets){const h=homeOf(r,o)||r.b.find(b=>b.t==='keep')||o,d=dist(n,h);if(d<best){best=d;target=o}}
 const home=homeOf(r,target)||r.b.find(b=>b.t==='keep');if(!home)return false;
 const old=r.b.find(b=>b.id===n.insideId&&b.id!==home.id);if(old&&!exitBuilding(n,old,dt))return true;
 const door=fp(home,0,BD[home.t].d/2+.8);if(dist(n,door)>1.2){mv(n,door.x,door.z,3,dt);return true}
 n.ry=Math.atan2(home.x-n.x,home.z-n.z);n.pr=1;n.omc=(n.omc||0)+dt;
 if(n.omc>=8){n.omc=0;let soothed=0;for(const o of r.n){if(!o.om||o.hp<=0)continue;if(o.hid===home.id||o.home===home||o.insideId===home.id){o.om=0;o.omT=0;soothed++;if(soothed>=2)break}}if(soothed){r.omen=Math.max(0,(r.omen||0)-18);r.sup=Math.max(0,(r.sup||0)-4);say(r,'🙏 Ein Priester besucht ein Haus und beruhigt verängstigte Bewohner.')}}
 return true;
}
function armorerCycle(r,n,wb,dt,X,Z){
 const c=n.cy||(n.cy={st:'fetch',t:0,recipe:null});
 const P=c.recipe&&c.st!=='fetch'?c.recipe:(c.recipe=armorerRecipe(r)),MAT=Object.keys(P.in||{});
 if(c.st==='fetch'){n.cr=0;
  if(!Object.entries(P.in).every(([k,q])=>r.inv[k]>=q)){wb.msg='wartet auf '+MAT.filter(k=>r.inv[k]<P.in[k]).map(k=>GN[k]).join(' / ');if(dist(n,{x:X,z:Z})>1.5)mv(n,X,Z,2.8,dt);return}
  if(!exitBuilding(n,wb,dt))return;const S=storeAt(r,wb);if(dist(n,S)>1.6){mv(n,S.x,S.z,3,dt);return}for(const k in P.in)r.inv[k]-=P.in[k];c.st='work';c.t=0;c.carry=MAT[0]}
 if(c.st==='work'){wb.act=r.tk;if(!enterBuilding(n,wb,workPoint(r,wb,n),dt)){n.cr=c.carry||0;return}n.cr=0;wb.msg='stellt '+P.name+' her';n.work=WK[n.k]||1;c.t+=dt;if(n.work===2&&c.t%1.1<dt)n.cd=1;if(c.t>=P.every){c.st='deliver';c.out=Object.keys(P.out)[0]}return}
 if(c.st==='deliver'){n.cr=c.out;if(!exitBuilding(n,wb,dt))return;const A=near(n,r.b.filter(b=>b.t==='armory'),1e9),D=A?fp(A,0,BD.armory.d/2+1.8):storeAt(r,wb);if(dist(n,D)>1.6){mv(n,D.x,D.z,3,dt);return}for(const k in P.out)r.inv[k]=Math.min(stockCap(r),r.inv[k]+P.out[k]);n.cr=0;c.st='fetch';c.recipe=null;wb.msg='liefert '+P.name}}
function cycle(r,n,wb,B,dt,X,Z){if(n.k==='hangman')return torment(r,n,wb,B,dt,X,Z);const P=B.prod,target=workPoint(r,wb,n);if(!P||P.annual){if(enterBuilding(n,wb,target,dt))n.work=P?.annual?1:0;return}
 if(wb.t==='armorer')return armorerCycle(r,n,wb,dt,X,Z);
 const c=n.cy||(n.cy={st:'fetch',t:0}),MAT=Object.keys(P.in||{});
 if(c.st==='fetch'){n.cr=0;if(!MAT.length){c.st='work';c.t=0}else{
  if(!Object.entries(P.in).every(([k,q])=>r.inv[k]>=q)){wb.msg='wartet auf '+MAT.filter(k=>r.inv[k]<P.in[k]).map(k=>GN[k]).join(' / ');if(dist(n,{x:X,z:Z})>1.5)mv(n,X,Z,2.8,dt);return}
  if(!exitBuilding(n,wb,dt))return;const S=storeAt(r,wb);if(dist(n,S)>1.6){mv(n,S.x,S.z,3,dt);return}for(const k in P.in)r.inv[k]-=P.in[k];c.st='work';c.t=0;c.carry=MAT[0]}}
 if(c.st==='work'){wb.act=r.tk;if(!enterBuilding(n,wb,target,dt)){n.cr=c.carry||0;return}n.ry=target.ry;n.cr=0;c.carry=0;wb.msg='stellt '+Object.keys(P.out||{}).map(k=>GN[k]).join(' / ');n.work=WK[n.k]||1;c.t+=dt;if(n.work===2&&c.t%1.1<dt)n.cd=1;if(c.t>=P.every){c.st='deliver';c.out=Object.keys(P.out)[0]}return}
 if(c.st==='deliver'){n.cr=c.out;if(!exitBuilding(n,wb,dt))return;const g=P.dest==='garrison'?near(n,r.b.filter(b=>b.t==='garrison'),1e9):null,D=g?fp(g,0,BD.garrison.d/2+1.8):storeAt(r,wb);
  if(dist(n,D)>1.6){mv(n,D.x,D.z,3,dt);return}for(const k in P.out)r.inv[k]=Math.min(stockCap(r),r.inv[k]+P.out[k]);wb.msg='liefert '+Object.keys(P.out||{}).map(k=>GN[k]).join(' / ');n.cr=0;c.st='fetch'}}
function autoAssign(r){const peas=r.n.filter(n=>n.k==='peasant'&&!n.tr&&!n.sk&&!n.manualIdle),kp=r.b.find(b=>b.t==='keep');let avail=peas.length-(r.b.some(b=>b.t==='garrison')?1:0);if(avail<=0||!kp)return;
 const ORD=['farmer','wood','miller','cook','miner','mason','smith','hunter','shepherd','weaver','tanner','fisher','keeper','priest','healer','trader','gravedigger','hangman'],o=[...r.pl.keys()][0]||0;let did=true;
 while(avail>0&&did){did=false;for(const j of ORD){if(avail<=0)break;const wb=freeSlot(r,j,kp);if(!wb)continue;const pe=peas.shift();pe.hp=0;pe.conv=1;const n=mkNpc(r,j,pe.x,pe.z,o);n.wb=wb.id;n.ry=pe.ry;avail--;did=true}}}
function woodCycle(r,n,wb,B,dt,X,Z){const c=n.cy||(n.cy={st:'seek'}),blk=fp(wb,-2.4,B.d/2+.8);
 if(c.st==='seek'){n.cr=0;const t=near(n,r.tr.filter(o=>!o.st),80);if(!t){if(dist(n,{x:X,z:Z})>2.5)mv(n,X,Z,2.5,dt);return}c.t=t;c.st='chop';c.h=0}
 if(c.st==='chop'){const t=c.t;if(!r.tr.includes(t)||t.st){c.st='seek';return}if(dist(n,t)>2.2){mv(n,t.x,t.z,2.8,dt);return}n.ry=Math.atan2(t.x-n.x,t.z-n.z);c.h-=dt;if(c.h>0)return;c.h=1.4;n.cd=1;t.hp-=1+r.tl.axe;
  if(t.hp<=0){t.st=1;t.rg=0;t.hp=3;r.dt=true;c.n=4+r.tl.axe;c.st='haul'}return}
 if(c.st==='haul'){n.cr='logs';const P=fp(wb,1.4,B.d/2+1.2);if(dist(n,P)>1.4){mv(n,P.x,P.z,2.6,dt);return}wb.lg=(wb.lg||0)+c.n;c.k=c.n;c.st='split';c.t2=0;n.cr=0}
 if(c.st==='split'){wb.act=r.tk;if(dist(n,blk)>1.2){mv(n,blk.x,blk.z,2.8,dt);return}n.ry=Math.PI;n.work=2;c.t2+=dt;if(c.t2%1.1<dt)n.cd=1;if(c.t2>=2*c.k){wb.lg=Math.max(0,(wb.lg||0)-c.k);c.o=c.k;c.st='deliver'}return}
 if(c.st==='deliver'){n.cr='wood';const D=storeAt(r,wb);if(dist(n,D)>1.6){mv(n,D.x,D.z,3,dt);return}r.inv.wood=Math.min(stockCap(r),r.inv.wood+c.o);n.cr=0;c.st='seek'}}
function work(r,n,dt){const eve=r.hr>=18||r.hr<6||(r.omen>0&&n.k!=='priest');
 if(eve){const old=r.b.find(b=>b.id===n.insideId);if(old&&old.id!==n.hid&&!exitBuilding(n,old,dt))return;const h=homeOf(r,n)||r.b.find(b=>b.t==='keep')||{x:0,z:6};n.home=h;if(h.id)enterBuilding(n,h,fp(h,0,-.5),dt);else mv(n,h.x,h.z,3.2,dt);return}n.home=null;
 if(n.tr){const g=near(n,r.b.filter(b=>b.t==='garrison'),1e9);if(!g){n.tr=null;return}
  const X=g.x,Z=g.z+5.5;if(dist(n,{x:X,z:Z})>1.2){mv(n,X,Z,2.8,dt);return}
  n.ry=0;n.tr.t+=dt;if(n.tr.t%1.2<dt)n.cd=NT[n.k].cd;
  if(n.tr.t>=10){const s=mkNpc(r,n.tr.k,n.x,n.z,n.tr.o);s.p={x:g.x+rnd(-3,3),z:g.z+6+rnd(0,2)};n.hp=0;n.conv=1;say(r,'⚔ Ein Dorfbewohner wurde zum '+(n.tr.k==='sword'?'Schwertkämpfer':'Bogenschützen')+' ausgebildet')}
  return}
 if(n.k==='peasant')return idle(r,n,dt);
 let wb=n.wb&&r.b.find(b=>b.id===n.wb);if(!wb){n.wb=0;const f=freeSlot(r,n.k,n);if(f){n.wb=f.id;wb=f}}
 if(!wb)return idle(r,n,dt);if(n.k==='hangman'&&!hasRoom(wb,'torture')){n.wb=0;return idle(r,n,dt);}
 if(n.k==='priest'&&r.omen>0&&omenPriestCycle(r,n,dt))return;
 const old=r.b.find(b=>b.id===n.insideId&&b.id!==wb.id);if(old&&!exitBuilding(n,old,dt))return;const B=BD[wb.t],F0=workPoint(r,wb,n),X=F0.x,Z=F0.z;
 if(n.k==='gravedigger'){const c=near(n,r.co,1e9);if(!c){if(dist(n,{x:X,z:Z})>1.5)mv(n,X,Z,2.8,dt);return}
  if(dist(n,c)>1.4){mv(n,c.x,c.z,3,dt);return}n.bt=(n.bt||0)+dt;if(n.bt%1.2<dt)n.cd=1;
  if(n.bt>=3){n.bt=0;r.co=r.co.filter(o=>o!==c);r.gr++;say(r,'⚰ Ein Toter wurde beerdigt')}return}
 if(!['farmer','wood','hunter','mason'].includes(n.k))return cycle(r,n,wb,B,dt,X,Z);
 if(n.k==='wood')return woodCycle(r,n,wb,B,dt,X,Z);
 let t,act;
 if(n.k==='farmer'){const F=r.b.filter(b=>b.t==='field');t=near(n,F.filter(f=>f.st===3),1e9);act='h';if(!t&&r.inv.wheat>=1&&season(r)!==3){t=near(n,F.filter(f=>f.st===0),1e9);act='s'}}
 else if(n.k==='hunter'){t=near(n,r.dr,100);act='d'}else if(n.k==='mason'){t=near(n,r.rk.filter(o=>!o.ex),100);act='m'}else{t=near(n,r.tr,80);act='c'}
 if(!t){if(dist(n,{x:X,z:Z})>2.5)mv(n,X,Z,2.5,dt);return}
 {const dd=dist(n,t),need=n.k==='hunter'?11:(act==='c'?2.2:2.5);if(dd>need){mv(n,t.x,t.z,2.8,dt);return}if(n.k==='hunter')n.ry=Math.atan2(t.x-n.x,t.z-n.z)}
 if(act==='d')n.aim=Math.max(0,Math.min(1,1-(n.wk||0)/1.6));
 n.wk=(n.wk||0)-dt;if(n.wk>0)return;n.wk=act==='d'?1.6:1.4;n.cd=NT[n.k].cd;
 if(act==='h'){r.inv.wheat+=6+2*r.tl.hoe;t.st=0;r.dirty=true}
 else if(act==='s'){r.inv.wheat--;t.st=1;t.tm=0;t.pg=0;r.dirty=true}
 else if(act==='d')shoot(r,n,t,1)
 else if(act==='m'){t.hp-=1+r.tl.pick;r.inv.stone+=1+r.tl.pick;if(t.hp<=0){t.ex=1;t.rg=0;r.inv.stone+=5;r.dt=true}}
 else{t.hp-=1+r.tl.axe;r.inv.wood+=1+r.tl.axe;if(t.hp<=0){r.tr=r.tr.filter(o=>o!==t);r.inv.wood+=4;r.dt=true}}}
const FLAM=b=>!['wall','battle','tower','gate','portcullis','keep','cathedral','garrison','dungeon','torture','well','bridge','moat','chapel','quarry','ironmine','coppermine'].includes(b.t);
function ignite(r,b,why){if(b.fire>0||!FLAM(b))return false;b.fire=100;b.sp=0;r.dirty=true;say(r,'🔥 '+(why||'Feuer!')+' '+BN[b.t]+' brennt!'+(r.wells>0?'':' – ohne Brunnen kann niemand löschen'));return true}
function events(r,dt,bm,stf){r.wells=r.b.filter(b=>b.t==='well').length;r.fires=r.b.filter(b=>b.fire>0);
 if(r.omen>0){r.omen-=dt;const targets=omenTargets(r);for(const n of targets)n.omT=(n.omT||0)+dt;
  if(r.omen<=0){for(const n of r.n){n.om=0;n.omT=0}r.omen=0;r.omenRise=0;r.plazaEvent=0;r.plazaEventT=0;say(r,'🙏 Die Menschen beruhigen sich wieder')}
  else if(targets.length){r.omenRise=(r.omenRise||0)+dt*(r.holy?.45:1);if(r.omenRise>=30){r.omenRise=0;triggerOmenVictim(r)}}
  else{r.omen=0;r.omenRise=0;r.plazaEvent=0;r.plazaEventT=0;say(r,'🙏 Die Menschen beruhigen sich wieder')}}
 for(const b of r.fires){b.hp-=5*dt;r.under=true;
  // Regen bremst nur leicht – löschen geht NUR mit Brunnen (Eimerkette / Hammer)
  if(r.wx===1)b.fire-=(r.wells>0?4:0.4)*dt;
  b.sp=(b.sp||0)+dt;
  if(b.sp>3){b.sp=0;for(const o of r.b)if(o!==b&&!o.fire&&FLAM(o)&&dist(o,b)<7&&Math.random()<.22)ignite(r,o,'Das Feuer greift über!')}
  if(b.fire<=0){b.fire=0;r.dirty=true;say(r,'💧 Das Feuer am '+BN[b.t]+' ist gelöscht')}}
 const sk=r.n.filter(n=>n.sk);for(const a of sk)for(const o of r.n)if(!o.sk&&dist(a,o)<4&&Math.random()<.03*dt*(r.bl===r.dy?.3:1)){o.sk=Math.min(2,Math.max(1,a.sk|0));o.sickStage=0;say(r,'🤒 Ein weiterer Bewohner ist erkrankt')}
 r.et-=dt;if(r.ev.on&&r.ev.every>0&&r.et<=0){r.et=r.ev.every*rnd(.7,1.3);const kinds=['fire','sick','omen','rats','thieves','ambush'].filter(k=>r.ev[k]);if(kinds.length)trigger(r,kinds[Math.random()*kinds.length|0])}
 // Marktplatz-Saison / Events
 if(r.plazaEventT>0){r.plazaEventT-=dt;if(r.plazaEventT<=0){r.plazaEvent=0;r.plazaEventT=0}}
 else if(r.b.some(b=>b.t==='plaza')){
   const se=season(r); // 0 Frühling 1 Sommer 2 Herbst 3 Winter
   if(se===0&&r.hr>10&&r.hr<14&&Math.random()<.002){r.plazaEvent='maypole';r.plazaEventT=90;say(r,'🌳 Maibaum auf dem Marktplatz – die Dorfbewohner tanzen!')}
   else if(se===3&&r.hr>14&&r.hr<18&&Math.random()<.002){r.plazaEvent='tree';r.plazaEventT=120;say(r,'🎄 Weihnachtsbaum auf dem Marktplatz')}
   else if(Math.random()<.0008){r.plazaEvent='circus';r.plazaEventT=100;say(r,'🎪 Gaukler und Zirkus besuchen den Marktplatz!')}
 }
}
function trigger(r,k){if(k==='fire'){const L=r.b.filter(FLAM);if(L.length)ignite(r,L[Math.random()*L.length|0],'Ein Funke!')}
 else if(k==='sick'){const L=r.n.filter(n=>!n.sk&&!SICK_IMMUNE.has(n.k));if(!L.length)return;const c=Math.max(1,Math.floor(L.length*.25));for(let i=0;i<c&&L.length;i++){const n=L.splice(Math.random()*L.length|0,1)[0];n.sk=1+(Math.random()<Math.max(.15,(r.sup||0)/160)?1:0);n.sickStage=0}say(r,'🤒 Krankheit! '+c+' Bewohner sind erkrankt'+(r.b.some(b=>b.t==='apothecary')?'':' – eine Apotheke mit Heiler fehlt'))}
 else if(k==='rats'){const pool=['wheat','bread','cheese','sausage','smoked','apples'].filter(g=>r.inv[g]>0);if(!pool.length)return;const protectedStore=r.b.some(b=>b.t==='granary'||b.t==='storage');say(r,'🐀 Ratten im Vorratslager! '+(protectedStore?'Das Lagerhaus begrenzt den Schaden.':'Ein Teil der Nahrung wird verdorben.'));for(let i=0;i<Math.min(2,pool.length);i++){const g=pool[i],loss=Math.min(r.inv[g],(protectedStore?1:3)+Math.ceil((r.sup||0)/24));r.inv[g]-=loss}r.dirty=true}
 else if(k==='thieves'){const guard=r.n.filter(n=>['sword','archer'].includes(n.k)).length+r.b.filter(b=>b.t==='watchpost'||b.t==='garrison').length,loss=Math.max(12,30-guard*3);r.gold=Math.max(0,r.gold-loss);say(r,'🕵️ Diebe in Schatzkammer und Lager! '+loss+' Gold fehlen.');}
 else if(k==='ambush'){const c=r.cv.find(c=>c.kind==='caravan'&&c.st!=='leave')||r.cv.find(c=>c.kind==='ship'&&c.st!=='leave');if(c){c.st='leave';c.t=0;const goods=['honey','cloth','potions','weapons','armor'].find(g=>r.inv[g]>0);if(goods)r.inv[goods]=Math.max(0,r.inv[goods]-1);say(r,'⚔ Handelsroute überfallen – '+c.from+' kehrt um und der Handel stockt.')}else{r.tt+=80;say(r,'⚔ Räuber bedrohen die Handelsroute – die nächsten Händler verspäten sich.')}} 
 else if(k==='omen'){const holy=r.b.some(b=>(b.t==='chapel'||b.t==='church'||b.t==='cathedral')&&!b.off),crowd=r.n.filter(n=>n.hp>0&&!n.sk&&!['priest','healer'].includes(n.k)&&(NT[n.k].job||n.k==='peasant'));
  if(!crowd.length)return;for(const n of crowd){n.om=1;n.omT=0}r.omen=Math.max(r.omen||0,120);r.omenRise=0;r.plazaEvent=0;r.plazaEventT=0;
  if(holy)say(r,'👻 Aberglaube: Böse Vorzeichen! Die Bewohner verstecken sich zuhause, Priester gehen von Haus zu Haus.');
  else say(r,'👻 Aberglaube: Böse Vorzeichen! Die Bewohner verstecken sich zuhause – ohne Priester eskaliert der Wahn.')}} 
function sickTick(r,n,dt,stf){if(n.hp<=0)return;if(SICK_IMMUNE.has(n.k)){n.sk=0;n.sickTime=0;n.sickStage=0;n.cu=0;return}if(!n.sk)return;n.sk=Math.max(1,Math.min(3,n.sk|0));n.sickTime=(n.sickTime||0)+dt;n.sickStage=(n.sickStage||0)+dt;
 if(n.sickStage>=110&&n.sk<3){n.sickStage=0;n.sk++;say(r,'🤢 Eine Krankheit verschlimmert sich zu '+diseaseName(n)+'em Verlauf')}
 if(n.sickTime>=sickLimit(n)){n.hp=0;n.work=0;n.cr=0;say(r,'⚰ Ein Bewohner ist an einer '+diseaseName(n)+'en Krankheit gestorben');return;}
 n.work=0;n.cr=0;n.aim=0;n.cd=0;n.vis=null;n.pr=0;n.el=0;const home=homeOf(r,n)||r.b.find(b=>b.t==='keep');if(!home)return;const old=r.b.find(b=>b.id===n.insideId&&b.id!==home.id);if(old&&!exitBuilding(n,old,dt))return;n.home=home;const slot=r.n.filter(o=>o.hid===home.id&&o.hp>0).findIndex(o=>o.id===n.id),target=fp(home,((Math.max(0,slot)%3)-1)*.85,-.5-Math.floor(Math.max(0,slot)/3)*.7);if(!enterBuilding(n,home,target,dt))return;
 const ap=near(n,(r.healers||[]).filter(h=>h.cap>0).map(h=>h.b),1e9),healer=ap&&(r.healers||[]).find(h=>h.b===ap&&h.cap>0),pr=(r.priests||[]).find(p=>p.cap>0);
 if(pr){pr.cap--;n.sickTime=Math.max(0,n.sickTime-dt*.22);if(n.sk===1&&Math.random()<.012*dt)n.sickStage=Math.max(0,n.sickStage-dt*2)}
 if(healer&&r.inv.potions>0){healer.cap--;n.cu=(n.cu||0)+dt*(pr?1.25:1);if(n.cu>=10+n.sk*4){r.inv.potions--;n.cu=0;n.sickStage=0;if(n.sk>1){n.sk--;n.sickTime=Math.max(0,n.sickTime-90);say(r,'💊 Ein Bewohner wurde versorgt – der Zustand bessert sich')}else{n.sk=0;n.sickTime=0;n.hp=Math.min(NT[n.k].hp,n.hp+20);say(r,'💊 Ein Bewohner wurde zuhause mit Heiltrank geheilt')}}}
 else n.cu=0;}
function spawnCamp(r){const en=enemyTown(r);for(let i=0;i<10;i++){const x=en.x+rnd(-7,7),z=en.z+rnd(-7,7);r.e.push({id:uid++,x,z,hp:80,cd:0,ry:0,camp:1,hx:x,hz:z})}r.campOn=true}
function campTick(r,dt){const en=enemyTown(r);
 if(r.cq>0){r.cq-=dt;if(r.cq<=0){say(r,'⚔ '+en.n+' hat sich neu formiert');r.cr=3}return}
 const alive=r.e.some(e=>e.camp);
 if(!alive&&!r.campOn){r.cr-=dt;if(r.cr<=0)spawnCamp(r);return}
 if(!alive&&r.campOn&&r.n.some(n=>n.m==='attack'&&Math.hypot(n.x-en.x,n.z-en.z)<18)){r.campOn=false;r.cq=600;r.gold+=300;r.fame+=5;r.inv.iron+=20;r.inv.copper+=10;r.inv.weapons+=3;
  say(r,'🏴 '+en.n+' wurde erobert! Beute: 300 Gold, Eisen, Kupfer, Waffen. Überfälle ruhen 10 Minuten.');for(const n of r.n)if(n.m==='attack'){n.m='follow'}}
 else if(!alive&&r.campOn){r.campOn=false;r.cr=30}}
function tradeTick(r,dt){for(const c of r.cv){c.t-=dt;
  if(c.kind==='caravan'){const m=r.b.find(b=>b.t==='market');if(c.st==='go'){if(!m){c.st='leave'}else if(mv(c,m.x,m.z+BD.market.d/2+3.5,3.6,dt)<2){c.st='wait';c.t=75;say(r,'🛒 Handelskarawane aus '+c.from+' ist am Marktstand eingetroffen (75 s, bessere Preise)')}}
   else if(c.st==='wait'&&c.t<=0)c.st='leave';else if(c.st==='leave'){const T0=townsOf(r).find(t=>t.n===c.from)||friendTowns(r)[0]||enemyTown(r);if(mv(c,T0.x,T0.z,3.6,dt)<4)c.gone=1}}
  else{const h=r.b.find(b=>b.t==='harbor');if(c.st==='go'){if(!h){c.st='leave'}else{c.z-=6*dt;c.x=riverAt(r,c.z);c.ry=Math.atan2(riverAt(r,c.z-1)-riverAt(r,c.z),-1);if(c.z<=h.z){c.st='wait';c.t=80;say(r,'⚓ Ein Handelsschiff aus '+c.from+' hat im Hafen angelegt (80 s, beste Preise)')}}}
  else if(c.st==='wait'&&c.t<=0)c.st='leave';else if(c.st==='leave'){c.z+=6*dt;c.x=riverAt(r,c.z);c.ry=Math.atan2(riverAt(r,c.z+1)-riverAt(r,c.z),1);if(c.z>WORLD_HALF)c.gone=1}}}
 r.cv=r.cv.filter(c=>!c.gone);r.tt-=dt;
 if(r.tt<=0){r.tt=rnd(170,260);spawnTrade(r)}}
function spawnTrade(r,force){const fr=friendTowns(r),f=fr[Math.random()*Math.max(1,fr.length)|0]||enemyTown(r),h=r.b.find(b=>b.t==='harbor'),m=r.b.find(b=>b.t==='market');
 if(h&&(!m||Math.random()<.5||force==='ship')){r.cv.push({id:uid++,kind:'ship',x:riverAt(r,WORLD_HALF-20),z:WORLD_HALF-20,ry:0,st:'go',t:0,from:f.n});say(r,'⚓ Ein Handelsschiff aus '+f.n+' nähert sich dem Hafen')}
 else if(m){r.cv.push({id:uid++,kind:'caravan',x:f.x,z:f.z,ry:0,st:'go',t:0,from:f.n});say(r,'🛒 Eine Handelskarawane aus '+f.n+' ist unterwegs')}}
function demolish(r,b,ruin){const B=BD[b.t],rf=Object.fromEntries(Object.entries(B.c).map(([k,n])=>[k,Math.floor(n*(ruin?.25:.5))]));for(const k in rf)r.inv[k]=Math.min(stockCap(r),r.inv[k]+rf[k]);
 if(ruin)r.ru=r.ru.filter(o=>o!==b);else{r.b=r.b.filter(o=>o!==b);for(const n of r.n){if(n.wb===b.id&&n.hp>0){n.hp=0;n.conv=1;const q=mkNpc(r,'peasant',n.x,n.z,n.o);q.ry=n.ry}if(n.hid===b.id)n.hid=0}}
 r.dirty=true;const t=costStr(Object.fromEntries(Object.entries(rf).filter(([,n])=>n>0)));say(r,'🔨 '+BN[b.t]+(ruin?'-Ruine geräumt':' abgerissen')+(t?' – zurück: '+t:''))}
const yearSec=r=>+process.env.YEAR_SEC||4*((r.ev&&r.ev.sl)||4)*1440;
function regrow(r,secs){const k=secs/yearSec(r);let ch=false;for(const t of r.tr)if(t.st===1){t.rg=(t.rg||0)+k;if(t.rg>=1){t.st=0;t.rg=0;t.hp=4;ch=true}}
 for(const t of r.rk)if(t.ex){t.rg=(t.rg||0)+k;if(t.rg>=1){t.ex=0;t.rg=0;t.hp=5;ch=true}}if(ch)r.dt=true}
function fieldGrow(r,secs){for(const b of r.b)if(b.t==='field'&&b.st>0&&b.st<3){b.pg=(b.pg||0)+secs*FG(r)/(((r.ev&&r.ev.sl)||4)*1440);const st=b.pg>=1?3:b.pg>=.5?2:1;if(st!==b.st){b.st=st;r.dirty=true}}}
function tick(r,dt){Rules.setWorldConfig(r.map||DEFAULT_MAP);const dayBefore=r.dy||0;r.tk++;
 const bm=new Map(r.b.map(b=>[b.id,b]));r.res={};for(const n of r.n)if(n.hid)r.res[n.hid]=(r.res[n.hid]||0)+1;
 const stf={};for(const n of r.n)if(n.wb&&n.hp>0&&!n.sk){const b=bm.get(n.wb);if(b&&!b.off&&(['farmer','wood','hunter','mason'].includes(n.k)||dist(n,workPoint(r,b,n))<1.5))stf[b.id]=(stf[b.id]||0)+1}
 // Produktion und Wirkung der Gebäude
 const chap=r.b.find(b=>(b.t==='chapel'||b.t==='church'||b.t==='cathedral')&&stf[b.id]);r.holy=!!chap;r.healers=r.b.filter(b=>b.t==='apothecary'&&stf[b.id]).map(b=>({b,cap:4}));r.priests=r.b.filter(b=>(b.t==='chapel'||b.t==='church'||b.t==='cathedral')&&stf[b.id]).map(b=>({b,cap:priestCap(b)}));{const tf=r.b.some(b=>hasRoom(b,'torture')&&stf[b.id]);r.det=Math.max(tf?.15:0,(r.det||0)-.0015*dt)}
 if(chap&&r.hr>=9&&r.hr<9.4&&r.pd!==r.dy){r.pd=r.dy;r.pray=90;say(r,'🔔 Die Glocken läuten – alle Bewohner gehen zum Gebet')}
 if(r.pray>0){r.pray-=dt;if(r.pray<=0){r.bl=r.dy;say(r,'🙏 Der Priester spendet den Segen – die Bewohner fühlen sich gestärkt')}}
 r.mk=(r.mk===undefined?rnd(25,50):r.mk)-dt;if(r.mk<=0){r.mk=rnd(100,260);const mkb=r.b.find(b=>b.t==='market'),plaza=r.b.find(b=>b.t==='plaza');if((mkb||plaza)&&r.hr>=7&&r.hr<18){const L=r.n.filter(n=>!n.sk&&!n.vis&&(NT[n.k].job||n.k==='peasant')),count=plaza&&r.plazaEvent?6:3;for(let i=0;i<count&&L.length;i++)L.splice(Math.random()*L.length|0,1)[0].vis={t:plaza&&r.plazaEvent?50:35,kind:plaza&&r.plazaEvent?'plaza':'market'}}}events(r,dt,bm,stf);tradeTick(r,dt);campTick(r,dt);
 for(const b of r.b){const B=BD[b.t];
  if(b.t==='tavern'&&stf[b.id]){b.pt=(b.pt||0)+dt;if(b.pt>=40){b.pt=0;const f=['bread','cheese','meat','fish','roast','sausage','smoked'].find(k=>r.inv[k]>=1);if(f)r.inv[f]--;r.beer=r.inv.beer>=1;if(r.beer)r.inv.beer--}}
  if(b.t==='apothecary'&&stf[b.id]){for(const p of r.pl.values())if(dist(b,p)<14)p.hp=Math.min(100,p.hp+3*dt);for(const n of r.n)if(dist(b,n)<14)n.hp=Math.min(NT[n.k].hp,n.hp+3*dt)}}
 const cap=stockCap(r);for(const k of STOCK)if(r.inv[k]>cap)r.inv[k]=cap;
 for(const c of r.co)c.t+=dt;r.co=r.co.filter(c=>c.t<500);
 let hap=40;for(const b of r.b){if(b.t==='tavern'&&stf[b.id]&&food(r)>=1)hap+=25+(r.beer?10:0);if(b.t==='chapel'&&stf[b.id])hap+=20;if(b.t==='church'&&stf[b.id])hap+=25;if(b.t==='cathedral'&&stf[b.id])hap+=30;if(b.t==='well')hap+=2;if(b.t==='plaza')hap+=5}
 if(r.bl===r.dy)hap+=8;hap-=Math.min(15,3*r.n.filter(n=>n.sk).length)+(r.omen>0&&!r.holy?15:0);
 hap-=Math.min(30,6*r.co.filter(c=>c.t>60).length);if(food(r)<4)hap-=20;hap-=Math.min(20,(r.foodShortage||0)*2)+Math.min(15,(r.heatShortage||0)*3);hap+=Math.min(10,r.fame*.5);
 // Steuern & Rationen
 hap+=[12,0,-18][r.tax??1];hap+=[15,0,-20][r.ration??1];
 // Leichen ohne Totengräber
 hap-=Math.min(25,r.co.length*4);
 r.hap=Math.max(0,Math.min(100,hap));
 r.sup=Math.max(0,Math.min(100,(r.sup||0)+((r.n.filter(n=>n.sk).length*1.8+r.co.length*3+(food(r)<4?3:0)+((!r.holy&&r.hap<45)?2.5:0))-1.3)*dt*.1));if(r.holy)r.sup=Math.max(0,r.sup-dt*.35);
 // Zuzug, Hochzeit, Geburt
 const kp0=r.b.find(b=>b.t==='keep');r.aa=(r.aa||0)-dt;if(r.aa<=0){r.aa=3;autoAssign(r)}
 r.pt-=dt;if(kp0&&r.pt<=0){r.pt=18;const pop=r.n.length;if(pop<popCap(r)&&food(r)>=4&&r.hap>=30){mkNpc(r,'peasant',kp0.x+rnd(-3,3),kp0.z-55);say(r,'🏠 Ein neuer Dorfbewohner ist angekommen ('+(pop+1)+'/'+popCap(r)+')')}}
 if(chap&&r.n.length<popCap(r)&&r.hap>=40&&food(r)>=6){r.bt-=dt;if(r.bt<=0){r.bt=70;r.bw=25;say(r,'💒 In der Kapelle wurde eine Hochzeit gefeiert')}}
 if(r.bw>0){r.bw-=dt;if(r.bw<=0&&chap){mkNpc(r,'peasant',chap.x,chap.z+5);say(r,'👶 Ein Kind wurde geboren')}}
 for(const a of r.ar){a.t-=dt;if(a.t<=0){if(a.tg.hp>0)a.tg.hp-=a.dmg;a.done=1}}r.ar=r.ar.filter(a=>!a.done);
 const dk=r.dr.filter(d=>d.hp<=0);if(dk.length){r.inv.meat+=2*dk.length;r.inv.hides+=dk.length;r.dr=r.dr.filter(d=>d.hp>0)}
 const h0=r.hr;r.hr=(r.hr+(r.ev&&r.ev.cyc===0?0:dt*(24/1440)))%24;if(r.hr<h0)r.dy++;
 r.wt-=dt;if(r.wt<=0){r.wt=rnd(90,200);r.wx=Math.random()<[.3,.15,.4,.35][season(r)]?1:0}
 const ps=[...r.pl.values()];
 if(ps.length&&ps.every(p=>p.sl)){const skip=((6-r.hr)+24)%24;if(r.hr>=19)r.dy++;r.hr=6;const sec=skip*60;
  fieldGrow(r,sec);regrow(r,sec);
  for(const p of ps){p.sl=false;p.food=Math.max(15,p.food-(r.creative?0:skip*.5));p.hp=100}say(r,'☀ Guten Morgen! Ein neuer Tag beginnt')}
 for(let day=dayBefore+1;day<=r.dy;day++)villageDay(r,day);
 const night=r.hr>=20||r.hr<5;
 if(!night)r.w=[];else if(r.pl.size&&r.w.length<3+2*r.pl.size&&Math.random()<dt*.2){const P=[...r.pl.values()],q=P[Math.random()*P.length|0],a=rnd(0,6.28),d=rnd(30,42);r.w.push({id:uid++,x:q.x+Math.cos(a)*d,z:q.z+Math.sin(a)*d,hp:40,cd:0,ry:0})}
 const fires=r.b.filter(b=>b.t==='fire'),safe=o=>o.torch||(o.home&&dist(o,o.home)<3)||fires.some(f=>dist(f,o)<8),ground=r.n.filter(n=>!n.el);
 for(const w of r.w){w.cd-=dt;const t=near(w,[...r.pl.values(),...ground].filter(o=>!safe(o)),22);if(!t)continue;if(dist(w,t)>1.6)mv(w,t.x,t.z,4.2,dt);else if(w.cd<=0){t.hp-=6;w.cd=1}}
 for(const d of r.dr)if(!d.w||mv(d,d.w.x,d.w.z,1.5,dt)<1)d.w={x:d.x+rnd(-15,15),z:d.z+rnd(-15,15)};
 r.deerTimer=(r.deerTimer||0)+dt;if(r.deerTimer>=60){r.deerTimer=0;if(r.dr.length<14){for(let attempt=0;attempt<30;attempt++){const d=newDeer(r);if(!r.b.some(b=>dist(d,b)<reach(b)+4)&&![...r.pl.values()].some(p=>dist(d,p)<18)){r.dr.push(d);break}}}}
 for(const d of r.dr){if(d.hp<2&&![...r.pl.values(),...r.n.filter(n=>n.k==='hunter')].some(p=>dist(p,d)<18)){d.rest=(d.rest||0)+dt;if(d.rest>=30){d.hp=2;d.rest=0}}else d.rest=0;d.x=Math.max(-DEER_LIMIT,Math.min(DEER_LIMIT,d.x));d.z=Math.max(-DEER_LIMIT,Math.min(DEER_LIMIT,d.z));if(inRiver(r,d.x,d.z,3)){d.w=null;const rx=riverAt(r,d.z);d.x=rx+(d.x<rx?-10:10)}}
 fieldGrow(r,dt);regrow(r,dt);
 if(kp0&&r.set.interval>0&&r.set.max>0){r.rt=(r.rt===undefined?240:r.rt)-dt;if(r.rt<=0&&Math.random()<dt/r.set.interval*(1-(r.det||0))){raid(r);r.rt=90}}
 for(const p of r.pl.values()){p.food=Math.max(0,p.food-(r.creative?0:dt/24)*(season(r)===3?1.3:1));if(p.sl&&!(r.hr>=19||r.hr<5))p.sl=false;p.hp=p.food>0?Math.min(100,p.hp+dt):p.hp-dt*2;if(p.hp<=0){p.hp=100;p.food=100;p.x=0;p.z=12;p.ws.send(JSON.stringify({t:'rs'}));say(r,p.name+' wurde niedergestreckt')}}
 for(const n of r.n){const T=NT[n.k];n.cd-=dt;n.aim=0;n.work=0;if(!T.job)n.cr=0;
  n.pr=0;if(n.sk){sickTick(r,n,dt,stf);continue}
  if(r.pray>0&&chap&&(T.job||n.k==='peasant')){const P=fp(chap,((n.i*3.7)%6)-3,BD[chap.t].d/2+2.2+((n.i*2.3)%3));if(dist(n,P)>.9)mv(n,P.x,P.z,3,dt);else{n.ry=Math.PI;n.pr=1}continue}
  if(n.vis&&(T.job||n.k==='peasant')){const plaza=n.vis.kind==='plaza'&&r.plazaEvent?r.b.find(b=>b.t==='plaza'):null,mk=r.b.find(b=>b.t==='market'),spot=plaza||mk;if(!spot||r.hr<7||r.hr>18)n.vis=null;else{const P=plaza?fp(spot,Math.sin(n.i*2.1)*3.4,Math.cos(n.i*1.7)*3.2):fp(spot,((n.i*7)%5)-2,BD.market.d/2+1.5+(n.i%2));if(dist(n,P)>1.2)mv(n,P.x,P.z,2.6,dt);else{n.ry=plaza?((r.tk+n.id)%2?Math.PI*.5:-Math.PI*.5):Math.PI;n.pr=plaza&&r.plazaEvent==='maypole'?1:0;n.vis.t-=dt;if(n.vis.t<=0){n.vis=null;r.gold+=plaza?1:3}}continue}}
  if((T.job||n.k==='peasant')&&r.fires.length&&r.wells>0&&!n.tr){
    // Eimerkette: zum Brunnen → Wasser holen → zum Brand → löschen → wiederholen
    const fb=near(n,r.fires,90),wells=r.b.filter(b=>b.t==='well');
    if(fb&&wells.length){
      if(!n.bucket){ // leer: zum nächsten Brunnen
        const w=near(n,wells,1e9);
        if(dist(n,w)>1.6){mv(n,w.x,w.z,3.2,dt);continue}
        n.bucket=1;n.cd=.4; // Eimer gefüllt
        continue;
      }
      // voll: zum Brand
      if(dist(n,fb)>reach(fb)-.6){mv(n,fb.x,fb.z,3.2,dt);continue}
      n.ry=Math.atan2(fb.x-n.x,fb.z-n.z);
      if(n.cd<=0){n.cd=.55;fb.fire-=8;n.bucket=0;r.dirty=true} // gießen, dann neu holen
      continue;
    }
  }
  if(T.job){work(r,n,dt);continue}
  // Patrouille: Soldaten stürmen Banditen aktiv entgegen (größere Suchreichweite)
  const patrolCharge=(n.m==='patrol'&&(n.k==='sword'||n.k==='archer'));
  const rngE=T.rng+(n.el?8:0)+(patrolCharge?28:0),e=near(n,[...r.e,...r.w],rngE+(n.k==='sword'?10:0)+(patrolCharge?40:0));
  if(e){if(dist(n,e)>T.rng+(n.el?8:0)){if(!n.el)mv(n,e.x,e.z,T.spd*(patrolCharge?1.25:1),dt)}else{n.ry=Math.atan2(e.x-n.x,e.z-n.z);if(n.k==='archer')n.aim=Math.max(0,Math.min(1,1-n.cd/(T.cd-.25)));if(n.cd<=0){if(n.k==='archer')shoot(r,n,e,T.dmg);else e.hp-=T.dmg;n.cd=T.cd}}continue}
  if(n.m==='attack'){const en=enemyTown(r);mv(n,en.x,en.z+8,T.spd,dt);continue}
  if(n.m==='post'){const b=bm.get(n.pb);if(!b||!BD[b.t].post){n.m='guard';n.el=0;n.p={x:n.x,z:n.z}}else{const pos=fp(b,b.t==='keep'&&(b.st|0)===0?4.1+((n.sl||1)%2?-.6:.6):((n.sl||1)%2?-.8:.8),b.t==='keep'&&(b.st|0)===0?-2.7:((n.sl||1)>2?.8:0)),px=pos.x;if(n.el){n.x=px;n.z=pos.z}else{const X=b.x,Z=b.z+BD[b.t].d/2+1.5;if(dist(n,{x:X,z:Z})>1.5)mv(n,X,Z,T.spd,dt);else{n.x=px;n.z=pos.z;n.el=postY(b)+Rules.base(b.t,b.x,b.z,b.r,BD,r.map)-Rules.height(n.x,n.z,r.map)}}}continue}
  const o=r.pl.get(n.o);
  if(n.m==='follow'&&!o){n.m='guard';n.p={x:n.x,z:n.z}}
  if(n.m==='follow'){const X=o.x+Math.cos(n.i)*3,Z=o.z+Math.sin(n.i)*3;if(Math.hypot(X-n.x,Z-n.z)>1.2)mv(n,X,Z,T.spd*1.3,dt)}
  else if(n.m==='guard'){if(dist(n,n.p)>.8)mv(n,n.p.x,n.p.z,T.spd,dt)}
  else if(mv(n,n.w.x,n.w.z,T.spd*.7,dt)<1){if(n.a.town){const kp=r.b.find(b=>b.t==='keep')||{x:0,z:0},L=r.b.filter(b=>!['field','moat','bridge','bed','fire','hopfield'].includes(b.t)&&Math.hypot(b.x-kp.x,b.z-kp.z)<200);const b=L[Math.random()*L.length|0]||kp;n.w={x:b.x+rnd(-4,4),z:b.z+BD[b.t||'house'].d/2+2+rnd(0,3)}}else{const a=rnd(0,6.28),d=rnd(0,n.a.r);n.w={x:n.a.x+Math.cos(a)*d,z:n.a.z+Math.sin(a)*d}}}}
 const moats=r.b.filter(b=>b.t==='moat');const alert=r.e.some(e=>!e.camp);for(const b of r.b)if(b.t==='gate'||b.t==='portcullis'){const w=(b.man===undefined?alert:!!b.man)?1:0;if((b.st|0)!==w){b.st=w;r.dirty=true}}
 for(const e of r.e){e.cd-=dt;
  if(e.camp){const t=near(e,[...ground,...r.pl.values()],16);if(t&&dist(e,{x:e.hx,z:e.hz})<26){if(dist(e,t)>1.8)mv(e,t.x,t.z,2.8,dt);else if(e.cd<=0){t.hp-=8;e.cd=1}}else if(dist(e,{x:e.hx,z:e.hz})>1.5)mv(e,e.hx,e.hz,2.4,dt);continue}const t=near(e,[...ground,...r.pl.values()],8)||near(e,r.b.filter(b=>b.t!=='moat'&&b.t!=='bridge'),1e9);if(!t)continue;
  if(dist(e,t)>(t.t?reach(t):1.8))mv(e,t.x,t.z,2.6*(moats.some(m=>Math.abs(e.x-m.x)<2.4&&Math.abs(e.z-m.z)<2.4)?.4:1),dt);else if(e.cd<=0){t.hp-=t.t?2.5:8;e.cd=t.t?1.4:1;if(t.t)r.under=true}}
 const kw=r.w.length;r.w=r.w.filter(w=>w.hp>0);r.inv.meat+=kw-r.w.length;
 for(const e of r.e)if(e.hp<=0){const dcap=4*r.b.filter(b=>hasRoom(b,'dungeon')).length;if(dcap&&r.pr<dcap&&Math.random()<.4){r.pr++;say(r,'⛓ Ein Bandit wurde gefangen genommen ('+r.pr+')')}else r.gold+=10}
 r.e=r.e.filter(e=>e.hp>0);
 for(const n of r.n)for(const n of r.n){if(n.hp<=0&&!n.conv){let cx=n.x,cz=n.z;const home=n.home||r.b.find(b=>b.id===n.hid)||r.b.find(b=>b.id===n.insideId);if(home){const door=fp(home,0,BD[home.t].d/2+1.2);cx=door.x;cz=door.z}r.co.push({id:uid++,x:cx,z:cz,t:0});if(n.sk||n.sickTime)say(r,'💀 Ein Kranker ist gestorben – der Leichnam liegt vor dem Haus (Totengräber nötig)')}}r.n=r.n.filter(n=>n.hp>0);for(const c of r.co)c.t=(c.t||0)+dt;
 for(const b of r.b)if(b.hp<=0&&BD[b.t].hp>=150){r.ru.push({id:b.id,t:b.t,x:b.x,z:b.z,r:b.r,st:b.st|0,lv:b.lv||0,ext:b.ext||0,pendingTorture:!!b.pendingTorture});say(r,'💥 '+BN[b.t]+' wurde zerstört – mit dem Hammer reparieren')}
 for(const b of r.b)if(b.hp<=0)b.fire=0;const nb=r.b.length;r.b=r.b.filter(b=>b.hp>0);if(nb!==r.b.length)r.dirty=true;
 r.hpt=(r.hpt||0)-dt;if(r.under&&r.hpt<=0){r.dirty=true;r.under=false;r.hpt=1.5}
 for(const n of r.n)if(n.insideId){const b=r.b.find(b=>b.id===n.insideId);if(b&&WORKSPOTS[b.t]||b&&['house','bighouse'].includes(b.t)){const [x,z]=Rules.local(b,n.x,n.z);n.el=Math.abs(x)<BD[b.t].w/2&&Math.abs(z)<BD[b.t].d/2?Math.max(0,Rules.base(b.t,b.x,b.z,b.r,CAT,r.map)+.1-Rules.height(n.x,n.z,r.map)):0;}}
 const actors=[...r.pl.values(),...r.n.filter(n=>n.hp>0),...r.e.filter(n=>n.hp>0),...r.dr,...r.w];const before=new Map([...r.pl.values()].map(p=>[p.id,[p.x,p.z]]));for(const actor of actors)actor.radius=actor.mt?.75:(r.dr.includes(actor)||r.w.includes(actor))?.6:.42;Rules.separate(actors);for(const p of r.pl.values()){const q=before.get(p.id);p.push=[r2(p.x-q[0]),r2(p.z-q[1])]}
 const m={t:'s',creative:!!r.creative,p:[...r.pl.values()].map(p=>[p.id,p.x,p.z,p.ry,p.name,Math.round(p.hp),Math.min(Date.now()-p.lt,Date.now()-(p.sw||0))<350?1:0,p.mt?1:0,Math.round(p.food),p.torch?1:0,p.sl?1:0,p.tool||'sword',p.ch,p.push,p.el||0]),
  n:r.n.map(n=>[n.id,n.k,r2(n.x),r2(n.z),r2(n.ry),n.m,n.o,n.cd>NT[n.k].cd-.4?1:0,r2(n.aim||0),r2(n.el||0),n.sk||0,n.work||0,n.cr||0,n.wb||0,n.pr?1:0]),
  e:r.e.map(e=>[e.id,r2(e.x),r2(e.z),r2(e.ry),e.cd>.6?1:0]),g:r.gold,i:r.inv,h:r.hr,tl:r.tl,ar:r.an,pp:[r.n.length,popCap(r),r.n.filter(n=>n.k==='peasant'&&!n.tr&&!n.sk).length],se:season(r),dy:r.dy,wx:r.wx,
  w:r.w.map(w=>[w.id,r2(w.x),r2(w.z),r2(w.ry||0)]),d:r.dr.map(d=>[d.id,r2(d.x),r2(d.z),r2(d.ry||0)]),co:r.co.map(c=>[c.id,r2(c.x),r2(c.z)]),s:r.set,x:Math.round(r.next),
  evs:r.ev,cq:r.cq>0?1:0,omen:r.omen>0?1:0,sup:Math.round(r.sup||0),tp:r.cv.some(c=>c.st==='wait')?1:0,cv:r.cv.map(c=>[c.id,c.kind,r2(c.x),r2(c.z),r2(c.ry),c.st==='wait'?1:0,c.from]),det:Math.round((r.det||0)*100),pry:r.pray>0?1:0,pr:r.pr,fame:r.fame,sl:(r.ev&&r.ev.sl)||4,cyc:r.ev&&r.ev.cyc===0?0:1,hap:Math.round(r.hap),cap,gr:r.gr,tax:r.tax??1,ration:r.ration??1,sickHouses:r.b.filter(b=>(b.t==='house'||b.t==='bighouse')&&r.n.some(n=>n.sk&&n.hp>0&&(n.hid===b.id||n.home===b||n.insideId===b.id))).map(b=>b.id),plazaEv:r.plazaEvent||0,plazaT:r.plazaEventT||0};
 if(r.tk%10===1){m.act=r.b.filter(b=>b.act&&r.tk-b.act<25).map(b=>b.id);m.lg={};for(const b of r.b)if(b.lg)m.lg[b.id]=b.lg}
 if(r.tk%20===1){m.bs={};for(const b of r.b)if(b.msg)m.bs[b.id]=b.msg;m.px={};for(const k in BASEP)m.px[k]=Math.round(priceOf(r,k))}
 if(r.pathDirty){m.paths=r.paths||[];r.pathDirty=false}
 if(r.dirty){m.b=r.b.map(b=>[b.id,b.t,b.x,b.z,b.r,b.st|0,Math.round(100*b.hp/mh(b)),b.fire>0?1:0,b.off?1:0,b.lv||0,b.ext||0,b.manual?1:0,b.v|0]);m.ru=r.ru.map(b=>[b.id,b.t,b.x,b.z,b.r]);r.dirty=false}
 r.an=[];
 if(r.dt){m.or=r.or.map(o=>[o.id,o.k,o.x,o.z]);m.tr=r.tr.map(t=>[t.id,r2(t.x),r2(t.z),t.st|0]);m.rk=r.rk.map(t=>[t.id,r2(t.x),r2(t.z),t.ex|0]);r.dt=false}
 tx(r,JSON.stringify(m))}
// ---- Speichern (saves/welt.json, alle 30 s, bei Verlassen und beim Beenden) ----
const SAVE=process.env.SAVE_FILE||path.join(__dirname,'saves','welt.json');
let deletedAny=false;
function save(){if(!rooms.size&&!deletedAny)return false;const o={};rooms.forEach((r,k)=>o[k]={creative:!!r.creative,map:r.map,paths:r.paths||[],deerTimer:r.deerTimer||0,foodShortage:r.foodShortage||0,heatShortage:r.heatShortage||0,nm:r.nm,sv:(r.sv=Date.now()),b:r.b,ru:r.ru,n:r.n,co:r.co,gold:r.gold,inv:r.inv,tl:r.tl,hr:r.hr,dy:r.dy,set:r.set,tax:r.tax??1,ration:r.ration??1,next:r.next,tr:r.tr,rk:r.rk,dr:r.dr,pr:r.pr,fame:r.fame,gr:r.gr,sup:r.sup||0,or:r.or,ev:r.ev,cq:r.cq});
 try{fs.mkdirSync(path.dirname(SAVE),{recursive:true});fs.writeFileSync(SAVE+'.tmp',JSON.stringify(o));fs.renameSync(SAVE+'.tmp',SAVE);return true}catch(e){console.log('Speichern fehlgeschlagen',e.message);return false}}
try{const o=JSON.parse(fs.readFileSync(SAVE));for(const k in o){const r=o[k];Object.assign(r,{pl:new Map(),map:Rules.sanitizeMap(r.map||DEFAULT_MAP),tw:[],pathDirty:true,paths:r.paths||[],e:[],w:[],ar:[],an:[],pt:10,bt:40,bw:0,dirty:true,dt:true,hr:r.hr||8,dy:r.dy||0,wx:0,wt:60,tk:0,hap:50,ru:r.ru||[],co:r.co||[],pr:r.pr||0,fame:r.fame||0,gr:r.gr||0,sup:r.sup||10,tl:r.tl||{axe:0,pick:0,hoe:0},or:r.or||[],ev:r.ev||{on:1,every:240,fire:1,sick:1,omen:1,rats:1,thieves:1,ambush:1,cyc:1,sl:4},et:200,fires:[],cv:[],tt:150,cq:r.cq||0,campOn:false,cr:5,omen:0});r.tw=r.map.towns.map(t=>({...t}));if(r.set){r.set.autosave=r.set.autosave!==undefined?r.set.autosave:30}else r.set={interval:120,max:6,autosave:30};r.tax=r.tax??1;r.ration=r.ration??1;Object.assign(r.inv,{gambeson:r.inv.gambeson||0,armor:r.inv.armor||0,potions:r.inv.potions||0});if(!r.ev.rats&&r.ev.rats!==0)Object.assign(r.ev,{rats:1,thieves:1,ambush:1});if(!r.or.length){const q=()=>Math.random();for(const k of['iron','iron','copper','copper']){const a=q()*6.28,d=50+q()*70;r.or.push({id:uid+=1,k,x:Math.cos(a)*d,z:Math.sin(a)*d})}}
 migrateRooms(r);for(const b of r.b)if(b.lv===undefined&&['gate','portcullis','garrison'].includes(b.t))b.lv=1;for(const b of r.b)if(b.v===undefined)b.v=((b.id*7)^(Math.round(b.x*4)*3)^(Math.round(b.z*4)*5))&3;
 for(const s of STOCK)r.inv[s]=r.inv[s]||(s==='weapons'?4:0);for(const b of r.b)if(BD[b.t]&&BD[b.t].hp>BD[b.t].hp*1)b.hp=BD[b.t].hp;rooms.set(k,r);
 uid=Math.max(uid,1+Math.max(1,...[...r.b,...r.ru,...r.n,...r.tr,...r.rk,...r.dr,...r.co,...r.or].map(x=>x.id)))}console.log('Spielstand geladen:',rooms.size,'Welt(en)')}catch(e){}
// Auto-Speichern: Zyklus pro Raum (0 = aus), Standard 30 s; bei Verlassen und Server-Stop immer speichern
setInterval(()=>{
  let due=false;
  rooms.forEach(r=>{
    if(!r.pl.size)return;
    const sec=r.set&&r.set.autosave!==undefined?+r.set.autosave:30;
    if(sec<=0)return;
    const now=Date.now();
    if(!r.lastSave||now-r.lastSave>=sec*1000){r.lastSave=now;due=true}
  });
  if(due)save();
},5000);
for(const sg of['SIGINT','SIGTERM'])process.on(sg,()=>{save();process.exit()});
setInterval(()=>rooms.forEach(r=>{if(r.pl.size)tick(r,.1)}),100);

wss.on('connection',ws=>{let r,p;
 ws.on('message',d=>{let m;try{m=JSON.parse(d)}catch{return}
  if(m.t==='join'){if(p)return;const code=String(m.code||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,8)||'DEMO';
   if(!rooms.has(code)&&!m.create)return ws.send(JSON.stringify({t:'err',m:'Diese Welt gibt es nicht. Lade eine gespeicherte Welt aus der Liste oder gründe eine neue.'}));
   r=room(code,m.map);if(m.wname&&!r.nm)r.nm=String(m.wname).slice(0,24);p={id:uid++,name:String(m.name||'Spieler').slice(0,16),x:0,z:0,ry:0,ws,hp:100,lt:0,food:100,tool:'sword',ch:cleanProf(m.ch)};r.pl.set(p.id,p);if(m.create)save();for(const n of r.n)if(!n.o)n.o=p.id;r.dirty=true;r.dt=true;r.pathDirty=true;
   ws.send(JSON.stringify({t:'hi',id:p.id,code,bd:CAT,tw:townsOf(r),map:r.map,jn:JN,gn:GN}));say(r,p.name+' ist beigetreten');return}
  if(!p)return;
  if(m.t==='mv'){if(![m.x,m.z,m.ry].every(Number.isFinite))return;p.x=Math.max(-WORLD_HALF,Math.min(WORLD_HALF,m.x));p.z=Math.max(-WORLD_HALF,Math.min(WORLD_HALF,m.z));p.ry=m.ry;p.el=Math.max(0,Math.min(25,+m.el||0))}
  else if(m.t==='creative'){r.creative=!!m.on;say(r,r.creative?'Frei-Bau aktiviert: kostenlose Gebäude und Ressourcenpflanzung':'Survival-Bau aktiviert')}
  else if(m.t==='plant'){
   if(!r.creative)return tell(p,'Ressourcen pflanzen geht nur im Frei-Bau-Modus');
   const kinds=['tree','stump','rock','iron','copper','deer'];if(!kinds.includes(m.k)||![m.x,m.z].every(Number.isFinite))return;
   const x=r2(m.x),z=r2(m.z);if(Math.abs(x)>RESOURCE_LIMIT||Math.abs(z)>RESOURCE_LIMIT||inRiver(r,x,z,8))return tell(p,'Hier kann nicht gepflanzt werden');
   if(r.tr.length+r.rk.length+r.or.length+r.dr.length>=1600)return tell(p,'Ressourcenlimit erreicht');
   if(r.b.some(b=>{const [lx,lz]=Rules.local(b,x,z);return Math.abs(lx)<BD[b.t].w/2+1&&Math.abs(lz)<BD[b.t].d/2+1})||[...r.tr,...r.rk,...r.or,...r.dr].some(o=>Math.hypot(o.x-x,o.z-z)<1.5))return tell(p,'Zu nahe an einem Gebäude oder einer Ressource');
   const o={id:uid++,x,z};if(m.k==='tree'||m.k==='stump')r.tr.push({...o,hp:m.k==='stump'?3:4,st:m.k==='stump'?1:0,rg:0});else if(m.k==='rock')r.rk.push({...o,hp:5});else if(m.k==='deer')r.dr.push({...o,hp:2,ry:0,w:null});else r.or.push({...o,k:m.k});r.dt=true;
  }
  else if(m.t==='path'){
   if(![m.x,m.z].every(Number.isFinite)||Math.abs(m.x)>RESOURCE_LIMIT||Math.abs(m.z)>RESOURCE_LIMIT||inRiver(r,m.x,m.z,8))return;
   if(!r.b.some(b=>b.t==='keep'))return tell(p,'Zuerst den Bergfried platzieren');
   if(Date.now()-(p.pathAt||0)<65)return;p.pathAt=Date.now();r.paths=r.paths||[];
   if(r.paths.length>=5000)return tell(p,'Wegelimit erreicht');const last=p.pathLast;
   const point={x:r2(m.x),z:r2(m.z)};
   if(!m.start&&last&&dist(last,point)<.35)return;
   r.paths.push({x:point.x,z:point.z,ax:!m.start&&last&&dist(last,point)<12?last.x:point.x,az:!m.start&&last&&dist(last,point)<12?last.z:point.z});p.pathLast=point;r.pathDirty=true;
  }
  else if(m.t==='pathUndo'){if(r.paths&&r.paths.length){r.paths.pop();r.pathDirty=true;p.pathLast=null}}
  else if(m.t==='build'){const B=BD[m.k];if(!B)return;let x=Math.round(Number(m.x)*4)/4,z=Math.round(Number(m.z)*4)/4;const rot=m.r&3;if(!Number.isFinite(x)||!Number.isFinite(z))return;
   if(Rules.modular.includes(m.k)||m.k==='moat'){const snapped=Rules.snapPlacement(m.k,x,z,rot,r.b,BD,1.8);x=Math.round(snapped.x*4)/4;z=Math.round(snapped.z*4)/4}
   const why=canPlace(r,m.k,x,z,rot);if(why)return tell(p,why);
   if(m.k==='keep'&&(r.b.some(b=>b.t==='keep')||r.ru.some(b=>b.t==='keep')))return tell(p,'Es kann nur einen Bergfried geben');
   if(m.k!=='keep'&&!r.b.some(b=>b.t==='keep'))return tell(p,'Zuerst den Bergfried platzieren – er ist das Herz deiner Siedlung');
   if(r.b.length>=600)return tell(p,'Zu viele Gebäude');if(!r.creative&&!afford(r,B.c))return tell(p,'Zu wenig Material: '+costStr(B.c));if(!r.creative)pay(r,B.c);r.b.push({id:uid++,t:m.k,x,z,r:rot,hp:m.k==='keep'?1200:B.hp,st:0,lv:0,v:(Math.random()*4)|0,tm:0});r.dirty=true;
   if(m.k==='keep'){migrateRooms(r);r.next=r.set.interval*2;for(let i=0;i<3;i++)mkNpc(r,'peasant',x+rnd(-5,5),z+B.d/2+rnd(3,8));say(r,'🏰 Dein Bergfried steht! Die ersten Siedler sind eingetroffen. Weitere kommen, wenn Häuser, Essen und Zufriedenheit stimmen.')}}
  else if(m.t==='recruit')tell(p,'Neue Bewohner kommen von selbst, wenn Häuser, Essen und Zufriedenheit stimmen. Menü: Zuweisen oder Ausbilden.');
  else if(m.t==='staffMode'){const b=r.b.find(b=>b.id===m.b);if(!b||!jobsOf(b))return;b.manual=!!m.manual;r.dirty=true;}
  else if(m.t==='unassign'){const n=r.n.find(n=>n.id===m.n&&n.wb===m.b&&n.hp>0);if(!n||n.sk)return;settleJob(r,n);n.k='peasant';n.wb=0;n.manualIdle=true;r.dirty=true;}
  else if(m.t==='assign'){if(!JOBS.includes(m.k))return;const pe=m.n?r.n.find(n=>n.id===m.n&&n.hp>0&&!n.sk&&!n.tr&&NT[n.k].job):r.n.find(n=>n.k==='peasant'&&!n.tr&&!n.sk&&n.hp>0);if(!pe)return tell(p,'Kein gesunder verfügbarer Dorfbewohner');
   const wb=m.b?r.b.find(b=>b.id===m.b):freeSlot(r,m.k,p),slots=wb&&jobsOf(wb)?.[m.k];if(!wb||!slots||wb.off||used(r,wb)-(pe.wb===wb.id?1:0)>=slots)return tell(p,'Kein freier Arbeitsplatz in diesem Gebäude');settleJob(r,pe);pe.k=m.k;pe.wb=wb.id;pe.manualIdle=false;pe.hp=Math.min(pe.hp,NT[m.k].hp);if(m.b)wb.manual=true;r.dirty=true;say(r,JN[m.k]+' zu '+BN[wb.t]+' zugewiesen');}
  else if(m.t==='train'){if(!['sword','archer'].includes(m.k))return;const cost=m.k==='sword'?40:50;
   if(!r.b.some(b=>b.t==='garrison'&&dist(b,p)<14))return tell(p,'Geh zur Garnison (14 m) und verwalte sie mit E, um Soldaten auszubilden');if(r.n.filter(n=>n.tr).length>=5)return tell(p,'Die Garnison ist voll (5 gleichzeitig)');
   const pe=r.n.find(n=>n.k==='peasant'&&!n.tr&&!n.sk);if(!pe)return tell(p,'Kein arbeitsloser Dorfbewohner vorhanden');if(r.inv.weapons<1)return tell(p,'Keine Waffen im Lager – Schmiede bauen und besetzen');if(r.gold<cost)return tell(p,'Zu wenig Gold ('+cost+')');
   r.gold-=cost;r.inv.weapons--;pe.tr={k:m.k,t:0,o:p.id}}
  else if(m.t==='post'){const cand=r.b.filter(b=>BD[b.t].post&&dist(b,p)<20).sort((a,b)=>dist(a,p)-dist(b,p));let c=0;
   for(const b of cand){let free=postN(b)-r.n.filter(n=>n.pb===b.id&&n.m==='post').length;while(free>0){const a=r.n.filter(n=>n.k==='archer'&&n.o===p.id&&n.m!=='post').sort((x,y)=>dist(x,b)-dist(y,b))[0];if(!a)break;a.m='post';a.pb=b.id;a.sl=free;free--;c++}}
   if(!c)tell(p,'Kein freier Posten (Turm, Torhaus, Wachposten) oder keine freien Bogenschützen im Umkreis von 20 m');else say(r,'🏹 '+c+' Bogenschützen besetzen die Wachposten')}
  else if(m.t==='demolish'){const b=r.b.find(b=>b.id===m.b);if(!b||dist(b,p)>20+Math.max(BD[b.t].w,BD[b.t].d)/2)return tell(p,'Zu weit entfernt');if(b.t==='keep')return tell(p,'Der Bergfried kann nicht abgerissen werden');demolish(r,b,false)}
  else if(m.t==='brepair'){const b=r.b.find(b=>b.id===m.b);if(!b||b.hp>=mh(b))return;if(dist(b,p)>20+Math.max(BD[b.t].w,BD[b.t].d)/2)return tell(p,'Zu weit entfernt');const cost=frac(BD[b.t].c,.3*(1-b.hp/mh(b)));if(!afford(r,cost))return tell(p,'Material fehlt: '+costStr(cost));pay(r,cost);b.hp=mh(b);b.fire=0;r.dirty=true;say(r,'🔨 '+BN[b.t]+' repariert')}
  else if(m.t==='look'){if(!r.b.some(b=>(b.t==='keep'||b.t==='garrison')&&dist(b,p)<22))return tell(p,'Aussehen und Rüstung wechselst du im Bergfried (Kleiderschrank) oder in der Garnison (Rüstkammer)');if(!(Array.isArray(m.ch)&&m.ch.length===12&&m.ch.every((v,i)=>Number.isInteger(v)&&v>=0&&v<=PMAX[i])))return tell(p,'Ungültige Auswahl');p.ch=m.ch}
  else if(m.t==='bstaff'){const b=r.b.find(b=>b.id===m.b);if(!b||!jobsOf(b))return;b.off=m.on?0:1;r.dirty=true;if(b.off){for(const n of r.n)if(n.wb===b.id&&n.hp>0){n.hp=0;n.conv=1;const q=mkNpc(r,'peasant',n.x,n.z,n.o);q.ry=n.ry}say(r,'Besetzung von '+BN[b.t]+' abgeschaltet – Arbeiter sind wieder frei')}else say(r,'Besetzung von '+BN[b.t]+' automatisch')}
  else if(m.t==='keepRoom'){const b=r.b.find(b=>b.id===m.b&&b.t==='keep');if(!b||dist(b,p)>26||!['dungeon','torture'].includes(m.k))return;const bit=m.k==='dungeon'?1:2;if((b.ext||0)&bit)return;if(bit===2&&b.st<2)return tell(p,'Folterkammer erst ab Stufe 3 (Steinbergfried)');const cost=BD[m.k].c;if(!r.creative&&!afford(r,cost))return tell(p,'Material fehlt: '+costStr(cost));if(!r.creative)pay(r,cost);b.ext=(b.ext||0)|bit;r.dirty=true;say(r,BN[m.k]+' im Bergfried eingerichtet');}
  else if(m.t==='upgrade'){const k=(m.b&&r.b.find(b=>b.id===m.b))||r.b.find(b=>b.t==='keep'&&dist(b,p)<16);if(!k||dist(k,p)>20+Math.max(BD[k.t].w,BD[k.t].d)/2)return tell(p,'Geh näher an das Gebäude (E)');
   if(['garrison','gate','portcullis'].includes(k.t)){if(k.lv)return tell(p,'Bereits zum Steinbau ausgebaut');const c={stone:45,wood:15};if(!r.creative&&!afford(r,c))return tell(p,'Zu wenig Material: '+costStr(c));if(!r.creative)pay(r,c);k.lv=1;k.hp=mh(k);r.dirty=true;say(r,'Steinausbau abgeschlossen: '+BN[k.t]);}
   else if(k.t==='keep'){const lv=k.st|0;if(lv>=3)return tell(p,'Der Bergfried ist voll ausgebaut');if(!r.creative&&!afford(r,UPG[lv]))return tell(p,'Zu wenig Material: '+costStr(UPG[lv]));if(!r.creative)pay(r,UPG[lv]);k.st=lv+1;migrateRooms(r);k.hp=mh(k);r.dirty=true;say(r,'🏰 Bergfried ausgebaut: '+UPN[lv+1]+(lv+1===3?' – vier Türme und Eisentor':' (mehr Einwohner, Lager und Leben)'))}
   else{const u=UP2[k.t];if(!u)return tell(p,'Dieses Gebäude kann nicht ausgebaut werden');if(!afford(r,u.c))return tell(p,'Zu wenig Material: '+costStr(u.c));pay(r,u.c);k.t=u.to;k.hp=BD[u.to].hp;k.pt=0;r.dirty=true;say(r,'🏗 '+BN[u.to]+' ausgebaut')}}
  else if(m.t==='unpost'){for(const n of r.n)if(n.m==='post'&&n.o===p.id){n.m='guard';n.el=0;n.p={x:n.x,z:n.z}}}
  else if(m.t==='evset'){if(m.k==='on')r.ev.on=m.v?1:0;else if(m.k==='every')r.ev.every=Math.max(0,Math.min(1800,+m.v||0));else if(m.k==='cyc'){r.ev.cyc=m.v?1:0;if(!m.v)r.hr=12}else if(m.k==='sl')r.ev.sl=Math.max(1,Math.min(30,+m.v||4));else if(['fire','sick','omen','rats','thieves','ambush'].includes(m.k))r.ev[m.k]=m.v?1:0;r.et=Math.min(r.et,r.ev.every||1e9)}
  else if(m.t==='evnow'){if(m.k==='prisoner'){const dc=4*r.b.filter(b=>hasRoom(b,'dungeon')).length;if(!dc)tell(p,'Kein Kerker vorhanden');else r.pr=Math.min(dc,r.pr+1)}else if(m.k==='pray'){if(r.holy){r.pray=90;r.pd=r.dy;say(r,'🔔 Die Glocken läuten – alle Bewohner gehen zum Gebet')}else tell(p,'Kapelle/Kirche mit Priester nötig')}else if(['fire','sick','omen','rats','thieves','ambush'].includes(m.k))trigger(r,m.k);else if(m.k==='trade')spawnTrade(r,m.v)}
  else if(m.t==='expedition'){const en=enemyTown(r);if(m.c==='attack'){if(r.cq>0)return tell(p,en.n+' ist erobert – es gibt dort nichts mehr zu tun');const S=r.n.filter(n=>n.o===p.id&&(n.k==='sword'||n.k==='archer')&&n.m!=='post'&&!n.tr);if(S.length<4)return tell(p,'Zu wenige Soldaten für einen Feldzug (mindestens 4)');for(const n of S){n.m='attack';n.el=0}say(r,'⚔ Feldzug gegen '+en.n+' beginnt ('+S.length+' Soldaten)')}else for(const n of r.n)if(n.o===p.id&&n.m==='attack')n.m='follow'}
  else if(m.t==='gate'){const g=r.b.filter(b=>(b.t==='gate'||b.t==='portcullis')&&dist(b,p)<12);if(!g.length)return tell(p,'Kein Torhaus in der Nähe (12 m)');for(const b of g)b.man=b.st?0:1;say(r,g[0].man?'🚪 Das Tor wurde verriegelt':'🚪 Das Tor wurde geöffnet')}
  else if(m.t==='interrogate'){if(!r.b.some(b=>hasRoom(b,'torture')))return tell(p,'Du brauchst eine Folterkammer');if(r.pr<1)return tell(p,'Keine Gefangenen');r.pr--;r.gold+=30;r.fame=Math.max(0,r.fame-1);const t=Math.round(r.next);say(r,'🗝 Der Gefangene verrät: Der nächste Überfall kommt in etwa '+t+' s (+30 Gold, Ansehen -1)')}
  else if(m.t==='order'){for(const n of r.n)if(n.o===p.id&&!NT[n.k].job){
   if(m.c==='follow'){n.m='follow';n.el=0}
   else if(m.c==='guard'){n.m='guard';n.p={x:n.x,z:n.z};n.el=0}
   else if(m.c==='patrol'){n.m='patrol';n.a=m.rad==='town'?{town:1}:{x:p.x,z:p.z,r:Math.max(10,Math.min(200,+m.rad||30))};n.w={x:n.x,z:n.z};n.el=0}}}
  else if(m.t==='set'){if(m.interval!==undefined)r.set.interval=Math.max(0,Math.min(600,+m.interval||0));if(m.max!==undefined)r.set.max=Math.max(0,Math.min(30,+m.max||0));if(m.autosave!==undefined)r.set.autosave=Math.max(0,Math.min(600,+m.autosave||0));r.next=Math.min(r.next,r.set.interval||1e9)}
  else if(m.t==='policy'){if(m.tax!==undefined){r.tax=Math.max(0,Math.min(2,+m.tax|0));say(r,'📜 Steuern: '+['niedrig','mittel','hoch'][r.tax])}if(m.ration!==undefined){r.ration=Math.max(0,Math.min(2,+m.ration|0));say(r,'🍞 Rationen: '+['großzügig','normal','hungern'][r.ration])}r.dirty=true}
  else if(m.t==='swing')p.sw=Date.now();
  else if(m.t==='hit'){const T=Date.now();if(T-p.lt>550){p.lt=T;p.hm=m.hm==='demolish'?'demolish':'repair';const fx=Math.sin(p.ry),fz=Math.cos(p.ry);
   const f=(l,mx)=>{let b=null;for(const e of l){const dx=e.x-p.x,dz=e.z-p.z,d=Math.hypot(dx,dz);if(d<mx&&dx*fx+dz*fz>0){mx=d;b=e}}return b};
   const nearB=l=>{let b=null,bd=3.2;for(const o of l){const e=dist(o,p)-Math.max(BD[o.t].w,BD[o.t].d)/2;if(e<bd){bd=e;b=o}}return b};let t;
   if(p.tool==='bow'){let b=null,ba=.35;for(const e of[...r.e,...r.w,...r.dr]){const dx=e.x-p.x,dz=e.z-p.z,d=Math.hypot(dx,dz);if(d>32||d<1)continue;const an=Math.acos(Math.max(-1,Math.min(1,(dx*fx+dz*fz)/d)));if(an<ba){ba=an;b=e}}
    if(b)shoot(r,p,b,18);else shoot(r,p,{id:0,x:p.x+fx*24,z:p.z+fz*24,hp:0},0)}
   else if(p.tool==='hammer'&&p.hm==='demolish'){const ru=nearB(r.ru),bb=ru||nearB(r.b);if(!bb)tell(p,'Nichts zum Abreißen in der Nähe');else if(bb.t==='keep'&&!ru)tell(p,'Der Bergfried kann nicht abgerissen werden');else{bb.dm=(bb.dm||0)+1;if(bb.dm>=4)demolish(r,bb,!!ru);else tell(p,'Abriss '+bb.dm+'/4 …')}}
   else if(p.tool==='hammer'&&r.wells>0&&nearB(r.fires)){const fb=nearB(r.fires);fb.fire-=30;r.dirty=true}
   else if(p.tool==='hammer'){const ru=nearB(r.ru),bb=ru||nearB(r.b.filter(b=>b.hp<mh(b)));
    if(!bb)tell(p,'Nichts zu reparieren in der Nähe (Hammer: Ruinen und beschädigte Gebäude)');
    else{const B=BD[bb.t],cost=frac(B.c,ru?.3:.06);if(!afford(r,cost))tell(p,'Material fehlt: '+costStr(cost));
     else{pay(r,cost);if(ru){r.ru=r.ru.filter(o=>o!==bb);r.b.push({id:bb.id,t:bb.t,x:bb.x,z:bb.z,r:bb.r,hp:Math.round(mh({t:bb.t,st:bb.st})*.4),st:bb.st||0,lv:bb.lv||0,ext:bb.ext||0,v:bb.v|0,pendingTorture:!!bb.pendingTorture,tm:0});say(r,'🔨 '+BN[bb.t]+' wurde wieder aufgebaut')}else bb.hp=Math.min(mh(bb),bb.hp+mh(bb)*.15);r.dirty=true}}}
   else if(p.tool==='sword'&&(t=f(r.e,2.8)||f(r.w,2.8)))t.hp-=22;
   else if(p.tool==='axe'&&(t=f(r.tr.filter(o=>o.st),3))){t.hp-=1+r.tl.axe;if(t.hp<=0){r.tr=r.tr.filter(o=>o!==t);r.inv.wood+=2;r.dt=true;tell(p,'Wurzelstock mit der Axt entfernt (+2 Holz)')}}
   else if(p.tool==='axe'&&(t=f(r.tr.filter(o=>!o.st),3))){t.hp-=1+r.tl.axe;if(t.hp<=0){t.st=1;t.rg=0;t.hp=3;r.inv.wood+=4;r.dt=true}r.inv.wood+=1+r.tl.axe}
   else if(p.tool==='pickaxe'&&(t=f(r.tr.filter(o=>o.st),2.8))){t.hp-=1+r.tl.pick;if(t.hp<=0){r.tr=r.tr.filter(o=>o!==t);r.dt=true;tell(p,'Wurzelstock ausgegraben – hier wächst nie wieder ein Baum')}}
   else if(p.tool==='pickaxe'&&(t=f(r.rk,3))){if(t.ex)tell(p,'Dieses Vorkommen ist erschöpft – es erholt sich im Lauf eines Jahres');else{t.hp-=1+r.tl.pick;if(t.hp<=0){t.ex=1;t.rg=0;r.inv.stone+=5;r.dt=true}r.inv.stone+=1+r.tl.pick}}
   else if(p.tool==='sword'&&(t=f(r.dr,3))){if(--t.hp<=0){r.dr=r.dr.filter(o=>o!==t);r.inv.meat+=2;r.inv.hides++}}
   else if(p.tool==='hoe'&&(t=f(r.b.filter(b=>b.t==='field'),4))){if(t.st===0&&season(r)===3)tell(p,'Im Winter wächst nichts');else if(t.st===0&&r.inv.wheat>=1){r.inv.wheat--;t.st=1;t.tm=0;t.pg=0;r.dirty=true}else if(t.st===3){r.inv.wheat+=6+2*r.tl.hoe;t.st=0;r.dirty=true}}}}
  else if(m.t==='mount'){if(!p.horse){if(r.gold<80)return;r.gold-=80;p.horse=1;say(r,p.name+' hat ein Pferd gekauft')}p.mt=!p.mt}
  else if(m.t==='eat'){const E=[['roast',50],['smoked',40],['bread',35],['sausage',35],['cheese',30],['meat',25],['honey',25],['fish',20],['apples',15]].find(([k])=>r.inv[k]>=1);if(E){r.inv[E[0]]--;p.food=Math.min(100,p.food+E[1])}else if(r.inv.wheat>=2){r.inv.wheat-=2;p.food=Math.min(100,p.food+40)}}
  else if(m.t==='craft'){const C={axe:{wood:8,stone:4},pick:{wood:8,stone:6},hoe:{wood:6,stone:3},bread:{wheat:3},roast:{meat:1}}[m.k];if(!C)return;
   {const nd=m.k==='roast'?'fire':'bench';if(!r.b.some(b=>b.t===nd&&dist(b,p)<8))return tell(p,'Du brauchst '+(nd==='fire'?'ein Lagerfeuer':'eine Werkbank')+' in der Nähe')}
   const br=m.k==='bread'||m.k==='roast',L=br?0:r.tl[m.k];if(L>=3)return tell(p,'Maximale Stufe erreicht');
   if(!Object.entries(C).every(([k,n])=>r.inv[k]>=n*(1+L)))return tell(p,'Zu wenig Material (Kosten x'+(1+L)+')');
   for(const k in C)r.inv[k]-=C[k]*(1+L);if(m.k==='bread')r.inv.bread+=2;else if(m.k==='roast')r.inv.roast+=1;else{r.tl[m.k]++;say(r,p.name+' hat ein Werkzeug verbessert')}}
  else if(m.t==='sleep'){if(p.sl)p.sl=false;else if((r.hr>=19||r.hr<5)&&(r.b.some(b=>b.t==='bed'&&dist(b,p)<5)||r.b.some(b=>b.t==='keep'&&dist(b,p)<14)))p.sl=true;else tell(p,'Schlafen geht nachts im Bergfried (14 m) oder neben einem Bett')}
  else if(m.t==='torch')p.torch=!p.torch;
  else if(m.t==='buy'||m.t==='sell'){if(!BASEP[m.k])return;if(!r.b.some(b=>b.t==='market'))return tell(p,'Du brauchst einen Marktstand für den Handel');const q=10,pr=priceOf(r,m.k)/10*q,sh=r.cv.some(c=>c.st==='wait'&&c.kind==='ship'),ca=r.cv.some(c=>c.st==='wait'),PS=sh?1.4:ca?1.25:1,PB=sh?.8:ca?.85:1;
   if(m.t==='buy'){const c=Math.ceil(pr*1.25*PB*(1-Math.min(.2,r.fame*.005)));if(r.gold<c)return tell(p,'Zu wenig Gold ('+c+')');if(r.inv[m.k]+q>stockCap(r))return tell(p,'Lager voll – Lagerhaus bauen');r.gold-=c;r.inv[m.k]+=q}
   else{if(r.inv[m.k]<q)return tell(p,'Zu wenig '+GN[m.k]+' im Lager');r.inv[m.k]-=q;r.gold+=Math.floor(pr*.8*PS*(1+Math.min(.25,r.fame*.01)))}}
  else if(m.t==='ransom'){if(r.pr<1)return tell(p,'Keine Gefangenen');r.pr--;r.gold+=40;say(r,'💰 Lösegeld für einen Gefangenen erhalten (+40 Gold)')}
  else if(m.t==='release'){if(r.pr<1)return tell(p,'Keine Gefangenen');r.pr--;r.fame++;say(r,'🕊 Ein Gefangener wurde freigelassen (Ansehen '+r.fame+')')}
  else if(m.t==='save'){r.lastSave=Date.now();say(r,save()?'💾 Spielstand gespeichert':'Speichern fehlgeschlagen')}
  else if(m.t==='equip'){if(['sword','axe','pickaxe','hoe','bow','hammer'].includes(m.tool))p.tool=m.tool}
  else if(m.t==='raidnow')raid(r)});
 ws.on('close',()=>{if(r&&p){r.pl.delete(p.id);for(const n of r.n)if(n.o===p.id){n.o=0;if(!NT[n.k].job){n.m='guard';n.p={x:n.x,z:n.z}}}save();say(r,p.name+' hat das Spiel verlassen')}})});
