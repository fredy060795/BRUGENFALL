const Rules=require('./public/rules.js');
// Burgenfall – Koop-Server (HTTPS + WebSocket auf Port 5035)
const fs=require('fs'),path=require('path'),http=require('http'),https=require('https');
const {WebSocketServer}=require('ws');
const PORT=+process.env.PORT||5035,PUB=path.join(__dirname,'public');
const KF=process.env.KEY_FILE||path.join(__dirname,'certs/key.pem'),CF=process.env.CERT_FILE||path.join(__dirname,'certs/cert.pem');
const MIME={'.mp3':'audio/mpeg','.ogg':'audio/ogg','.wav':'audio/wav','.html':'text/html; charset=utf-8','.js':'text/javascript','.jpg':'image/jpeg','.png':'image/png','.glb':'model/gltf-binary','.gltf':'model/gltf+json','.json':'application/json'};
const handler=(q,s)=>{let u;try{u=decodeURIComponent(q.url.split('?')[0])}catch{s.writeHead(400);return s.end('Bad request')}
 if(u==='/')u='/index.html';

 if(u==='/audio/index.json'){const A={},base=path.join(PUB,'audio');try{for(const d of fs.readdirSync(base,{withFileTypes:true}))if(d.isDirectory()){const L=fs.readdirSync(path.join(base,d.name)).filter(f=>/\.(mp3|ogg|wav)$/i.test(f));if(L.length)A[d.name]=L.map(f=>'/audio/'+encodeURIComponent(d.name)+'/'+encodeURIComponent(f))}}catch(e){}s.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});return s.end(JSON.stringify(A))}
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
// Kartengröße je Welt (map.scale 1..5): alle Grenzen wachsen mit
const SC=r=>Math.max(1,Math.min(5,(r&&r.map&&r.map.scale)|0||1)),WH=r=>200*SC(r),BUILD_LIMIT_=r=>WH(r)-10,RESOURCE_LIMIT_=r=>WH(r)-10,DEER_LIMIT_=r=>WH(r)-15;
const rooms=new Map();let uid=1;
// Startpunkt: steht ein Bergfried, erscheint der Spieler vor dessen Tor (auch nach dem Neuladen)
const spawnOf=r=>{const k=(r.b||[]).find(b=>b.t==='keep');if(k){const P=fp(k,0,BD.keep.d/2+4);return{x:P.x,z:P.z}}return(r.map&&r.map.spawn)||Rules.spawnPoint(r.map)};
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
 apothecary:J(5,5,{wood:20,stone:10},400,{jobs:{healer:1},prod:{every:34,in:{herbs:3},out:{potions:1}}}),tavern:J(8,6,{wood:40,stone:20},600,{jobs:{keeper:1}}),chapel:J(6,8,{stone:40,wood:20},700,{jobs:{priest:1}}),
 market:J(6,4,{wood:25},300,{jobs:{trader:1}}),storage:J(6,5,{wood:30},350,{store:250}),cemetery:J(10,8,{wood:15,stone:10},300,{jobs:{gravedigger:1},graves:20}),
 bridge:J(24,4,{wood:60},700,{bridge:1}),bench:J(2,1,{stick:4,stone:2},100),bed:J(1.2,2.1,{wood:8},80),fire:J(1.6,1.6,{wood:5},60)};
const BN={wall:'Mauer',battle:'Zinnenmauer',palisade:'Palisade',tower:'Wachturm',gate:'Torhaus',watchpost:'Wachposten',house:'Wohnhaus',bighouse:'Großes Wohnhaus',keep:'Bergfried',garrison:'Garnison',dungeon:'Kerker',farm:'Bauernhof',field:'Weizenfeld',lumber:'Holzfällerhütte',quarry:'Steinbruchhütte',lodge:'Jägerhütte',bakery:'Bäckerei',dairy:'Käserei',sheep:'Schafstall',cow:'Kuhstall',weaver:'Weberei',fishery:'Fischerei',smithy:'Schmiede',apothecary:'Apotheke',tavern:'Taverne',chapel:'Kapelle',market:'Marktstand',storage:'Lagerhaus',cemetery:'Friedhof',bridge:'Brücke',bench:'Werkbank',bed:'Bett',fire:'Lagerfeuer'};
const JN={minter:'Münzer',farmer:'Bauer',wood:'Holzfäller',hunter:'Jäger',mason:'Steinmetz',cook:'Bäcker/Metzger',smith:'Schmied',priest:'Priester',healer:'Heiler',keeper:'Wirt',shepherd:'Hirte/Imker',weaver:'Weber',fisher:'Fischer',gravedigger:'Totengräber',trader:'Händler',miner:'Bergmann',tanner:'Gerber',miller:'Müller',hangman:'Henker'};
const JOBS=Object.keys(JN),GN={wood:'Holz',stone:'Stein',wheat:'Weizen',meat:'Fleisch',bread:'Brot',roast:'Braten',wool:'Wolle',cloth:'Tuch',gambeson:'Gambeson',milk:'Milch',cheese:'Käse',fish:'Fisch',weapons:'Waffen',armor:'Rüstungen',potions:'Heiltränke',flour:'Mehl',iron:'Eisen',copper:'Golderz',honey:'Honig',hides:'Felle',leather:'Leder',apples:'Äpfel',hops:'Hopfen',beer:'Bier',sausage:'Wurst',smoked:'Geräuchertes',herbs:'Kräuter',clothes:'Kleidung',helmet:'Helme',mail:'Kettenhemden',breast:'Brustpanzer',plate:'Plattenharnische',carcass:'Wildkadaver'},STOCK=Object.keys(GN);
// ===== Survival: Rezepte am Gebäude (Spieler arbeitet selbst), Tiere, Kleiderschrank =====
const RECIPE={potion:{at:'apothecary',in:{herbs:3},out:{potions:1},n:'Heiltrank (Alchemie)'},cloth:{at:'weaver',in:{wool:2},out:{cloth:1},n:'Tuch weben'},
 clothes:{at:'weaver',in:{cloth:2},out:{clothes:1},n:'Kleidung schneidern'},gambeson:{at:'weaver',in:{cloth:3,wool:1},out:{gambeson:1},n:'Gambeson steppen'},
 flour:{at:'mill',in:{wheat:3},out:{flour:3},n:'Mehl mahlen'},bread2:{at:'bakery',in:{flour:2},out:{bread:3},n:'Brot backen'},leather:{at:'tannery',in:{hides:2},out:{leather:1},n:'Leder gerben'},
 cheese:{at:'dairy',in:{milk:2},out:{cheese:1},n:'Käse machen'},weapons:{at:'smithy',in:{iron:2,wood:1},out:{weapons:1},n:'Waffe schmieden'},helmet:{at:'smithy',in:{iron:2},out:{helmet:1},n:'Helm schmieden'},
 mail:{at:'armorer',in:{iron:5},out:{mail:1},n:'Kettenhemd flechten'},breast:{at:'armorer',in:{iron:4},out:{breast:1},n:'Brustpanzer treiben'},plate:{at:'armorer',in:{iron:8,leather:2},out:{plate:1},n:'Plattenharnisch fertigen'}};
const ANIMAL={sheep:{max:6,cost:30,feed:1,out:{wool:1},n:'Schaf'},cow:{max:4,cost:55,feed:2,out:{milk:1},n:'Kuh'},pigsty:{max:6,cost:25,feed:1,out:{meat:.5},n:'Schwein'}};
const ARMOR_ITEMS=[{},{gambeson:1},{gambeson:1,mail:1},{gambeson:1,plate:1},{gambeson:1,breast:1},{gambeson:1,breast:1,mail:1},{gambeson:1,plate:1,cloth:1},{gambeson:1,mail:1,cloth:1}];
const inv=(r,k)=>r.inv[k]||0,give=(r,o,f=1)=>{for(const k in o)r.inv[k]=(r.inv[k]||0)+o[k]*f};
const FEED_MAX=30;
// Täglich: Bauern füllen die Krippen aus dem Lager nach, dann fressen die Tiere aus der Krippe
function animalDay(r){if(!r.surv)return;const farmers=r.n.some(n=>n.k==='farmer'&&n.hp>0);
 for(const b of r.b){const A=ANIMAL[b.t];if(!A)continue;b.feed=b.feed||0;
  if(farmers&&b.an)for(const g of['straw','wheat']){const want=Math.min(FEED_MAX-b.feed,Math.floor(inv(r,g)));if(want>0){r.inv[g]-=want;b.feed+=want}}
  if(!b.an)continue;const need=b.an*A.feed;
  if(b.feed>=need){b.feed-=need;for(const k in A.out){b.acc=(b.acc||0)+A.out[k]*b.an;const w=Math.floor(b.acc);if(w>0){r.inv[k]=(r.inv[k]||0)+w;b.acc-=w}}}
  else{b.feed=0;b.an=Math.max(0,b.an-1);say(r,'🥀 Futtermangel: Ein '+A.n+' im '+BN[b.t]+' ist verhungert ('+b.an+' übrig) – fülle die Futterkrippe mit Weizen!')}r.dirty=true}}
// Startausstattung im Survival: Bauernkleidung, Werkzeug Hacke
const farmerProf=c=>[c[0],c[1],c[2],c[3],c[4],0,1,7,c[0]?2:3,0,0,0];
Object.assign(BD,{well:J(2,2,{stone:10,wood:5},300,{well:1}),moat:J(4,4,{wood:2,stone:1},500,{moat:1}),
 ironmine:J(5,5,{wood:30,stone:10},500,{jobs:{miner:2},prod:{every:25,out:{iron:2}},ore:'iron'}),coppermine:J(5,5,{wood:30,stone:10},500,{jobs:{miner:2},prod:{every:25,out:{copper:2}},ore:'copper'}),
 pigsty:J(6,6,{wood:25},300,{jobs:{shepherd:1},prod:{annual:true,out:{meat:8}}}),apiary:J(4,4,{wood:15},250,{jobs:{shepherd:1},prod:{every:45,out:{honey:1}}}),
 butcher:J(5,4,{wood:20,stone:10},350,{jobs:{cook:1},prod:{every:30,in:{meat:2},out:{sausage:3}}}),tannery:J(5,4,{wood:25,stone:5},350,{jobs:{tanner:1},prod:{every:35,in:{hides:2},out:{leather:1}}}),
 orchard:J(8,8,{wood:20},300,{jobs:{farmer:2},prod:{every:35,out:{apples:2}}}),hopfield:J(4,4,{wood:8},150,{jobs:{farmer:1},prod:{every:40,out:{hops:1}}}),
 brewery:J(6,5,{wood:30,stone:10},400,{jobs:{cook:1},prod:{every:30,in:{hops:2,wheat:1},out:{beer:2}}}),smokehouse:J(4,4,{wood:15,stone:5},300,{jobs:{cook:1},prod:{every:30,in:{fish:2},out:{smoked:3}}}),
 cathedral:J(16,25,{stone:150,wood:60},3000,{jobs:{priest:3}}),torture:J(6,6,{stone:25,wood:10},800),portcullis:J(6,1.6,{stone:15,wood:15},1500,{post:{n:2,y:5}}),harbor:J(8,6,{wood:50,stone:20},800,{harbor:1})});
BD.smithy.prod={every:40,in:{iron:2,wood:1},out:{weapons:1}};
Object.assign(BD,{mill:J(4,4,{wood:30,stone:10},400,{jobs:{miller:1},prod:{every:14,in:{wheat:3},out:{flour:3}}})});
BD.bakery.prod={every:18,in:{flour:2},out:{bread:3}};BD.smithy.prod={every:36,in:{iron:2,wood:1},out:{weapons:1},dest:'garrison'};BD.torture.jobs={hangman:1};BD.keep.c={wood:60};BD.keep.post={n:2,y:9};BD.keep.w=13;BD.keep.d=11;BD.house.w=6;BD.chapel.w=12;BD.chapel.d=16;
BD.church=J(12,16,{stone:80,wood:40},1500,{jobs:{priest:2}});BD.stairs=J(2,6,{stone:30,wood:10},600,{});
Object.assign(BN,{church:'Kirche',stairs:'Treppe zum Wehrgang',mill:'Mühle',well:'Brunnen',moat:'Wassergraben',ironmine:'Eisenmine',coppermine:'Goldmine',pigsty:'Schweinestall',apiary:'Imkerei',butcher:'Metzgerei',tannery:'Gerberei',orchard:'Obstplantage',hopfield:'Hopfenfeld',brewery:'Brauerei',smokehouse:'Räucherei',cathedral:'Kathedrale',torture:'Folterkammer',portcullis:'Torhaus mit Fallgitter',harbor:'Hafen'});
BD.gate.w=BD.portcullis.w=8;BD.gate.d=BD.portcullis.d=4;BD.gate.post.y=BD.portcullis.post.y=4;BD.church.w=8;BD.church.d=12;BD.farm.w=18;BD.farm.d=16;
Object.assign(BD,{bower:J(5,5,{wood:25,stone:8},420,{jobs:{smith:1},prod:{every:45,in:{wood:3},out:{weapons:1},dest:'garrison'}}),armorer:J(5,5,{wood:25,stone:20,iron:5},600,{jobs:{smith:1}}),armory:J(6,5,{stone:30,wood:15},900,{store:150}),granary:J(6,5,{wood:30,stone:10},500,{store:250})});
BD.mint=J(6,5,{stone:45,wood:20,iron:6},900,{jobs:{minter:2},prod:{every:45,in:{copper:2},out:{}}});
Object.assign(BN,{mint:'Münzprägerei',bower:'Bogenbauer',armorer:'Rüstungsmacher',armory:'Waffenkammer',granary:'Nahrungsmittellager'});
Object.assign(BD,{pyre:J(3,3,{wood:20,stone:5},200),gallows:J(3,2,{wood:25},180),plaza:J(12,12,{stone:40,wood:15},500,{plaza:1})});
Object.assign(BN,{pyre:'Scheiterhaufen',gallows:'Galgen',plaza:'Marktplatz'});
// ===== Marktplatz in doppelter Länge: Fest- und Turniergelände (Jahrmarkt mit Ständen, Ritterturnier mit Tribünen) =====
BD.plaza.w=24;BD.plaza.d=12;BD.plaza.c={stone:70,wood:30};
const TNY_PASS=10,TNY_CLASH=4.2,TNY_INTRO=25,TNY_END=20,TNY_BET=25,TNY_HOST=150,FAIR_HOST=80;
const TNY_FIRST=['Konrad','Ulrich','Heinrich','Gottfried','Rudolf','Albrecht','Leopold','Wolfram','Dietrich','Hartmann','Eberhard','Otto','Friedrich','Walther'];
const TNY_HIT=['verfehlt','bricht die Lanze am Schild von','trifft den Helm von','wirft aus dem Sattel:'];
// Siegchance grob ∝ Geschick³ → Wettquote
function tnyOdds(T){const W=T.k.map(q=>Math.pow(q.s,3)),S=W.reduce((a,b)=>a+b,0);T.k.forEach((q,i)=>q.od=Math.max(1.3,Math.round(.9/(W[i]/S)*10)/10))}
function startTourney(r,why){const pick=a=>a.splice(Math.random()*a.length|0,1)[0],first=[...TNY_FIRST],orig=[...((r.map&&r.map.towns)||[]).map(t=>t.n),'Falkenau','Steinach','Wolfsegg','Rabenhorst','Greifenberg'],cols=[0,1,2,3,4,5,8,9];
 const k=[];while(k.length<4)k.push({n:'Ritter '+pick(first)+' von '+pick(orig),s:+(.42+Math.random()*.3).toFixed(2),c:pick(cols),a:Math.random()*8|0});
 r.tny={k,bets:{},ph:'intro',t:TNY_INTRO,m:0,pairs:[[0,1],[2,3]],pass:0,pt:0,o:[0,0],sc:[0,0],res:false,w:[],ch:-1};tnyOdds(r.tny);
 r.plazaEvent='tourney';r.plazaEventT=999;const pl=r.b.find(b=>b.t==='plaza');
 say(r,'🏇 '+(why||'Ritterturnier')+' auf dem Marktplatz! Es treten an: '+k.map(q=>q.n+' (Quote '+q.od+')').join(', ')+' – Wetten am Marktplatz, zu Pferd selbst antreten',pl)}
function tnyPass(T){const roll=s=>{if(Math.random()>s)return 0;const x=Math.random();return x<.12?3:x<.38?2:1},[a,b]=T.pairs[T.m];T.o=[roll(T.k[a].s),roll(T.k[b].s)];T.pt=0;T.res=false}
function tnyMatchEnd(r,T){const [a,b]=T.pairs[T.m];let w;if(T.o[0]===3&&T.o[1]!==3)w=a;else if(T.o[1]===3&&T.o[0]!==3)w=b;else if(T.sc[0]!==T.sc[1])w=T.sc[0]>T.sc[1]?a:b;else return false;
 T.w.push(w);const l=w===a?b:a;say(r,'🏆 '+T.k[w].n+' besiegt '+T.k[l].n+' ('+Math.max(...T.sc)+':'+Math.min(...T.sc)+')'); 
 T.m++;T.pass=0;T.sc=[0,0];if(T.m===2)T.pairs.push([T.w[0],T.w[1]]);if(T.m>2){tnyFinish(r,T,w);return true}tnyPass(T);return true}
function tnyFinish(r,T,w){T.ch=w;T.ph='end';T.t=TNY_END;const K=T.k[w],watch=r.n.filter(n=>n.vis&&n.vis.kind==='plaza').length,fee=30+watch*4;
 r.gold+=fee;r.fame=(r.fame||0)+4;(r.fests||(r.fests={})).tnyH=r.dy;let msg='👑 '+K.n+' gewinnt das Turnier! Eintritt & Zuschauer bringen '+fee+' Gold, Ansehen +4';
 if(K.pl){r.gold+=100;r.fame+=3;msg+=' – Siegprämie 100 Gold für die eigene Stadt!'}
 for(const nm in T.bets){const B=T.bets[nm];if(B===w){const win=Math.round(TNY_BET*K.od);r.gold+=win;msg+=' · '+nm+' gewinnt die Wette: +'+win+' Gold'}}
 say(r,msg);r.dirty=true}
function tourneyTick(r,dt){const T=r.tny;if(!T){if(r.plazaEvent==='tourney'){r.plazaEvent=0;r.plazaEventT=0}return}if(r.plazaEvent!=='tourney'||!r.b.some(b=>b.t==='plaza')){r.tny=null;if(r.plazaEvent==='tourney'){r.plazaEvent=0;r.plazaEventT=0}return}
 r.plazaEventT=999;
 if(T.ph==='intro'){T.t-=dt;if(T.t<=0){T.ph='joust';T.m=0;T.pass=0;T.sc=[0,0];const [a,b]=T.pairs[0];say(r,'📯 Der Herold ruft zum ersten Lanzengang: '+T.k[a].n+' gegen '+T.k[b].n);tnyPass(T)}return}
 if(T.ph==='end'){T.t-=dt;if(T.t<=0){r.tny=null;r.plazaEvent=0;r.plazaEventT=0}return}
 T.pt+=dt;const [a,b]=T.pairs[T.m];
 if(!T.res&&T.pt>=TNY_CLASH){T.res=true;T.sc[0]+=T.o[0];T.sc[1]+=T.o[1];const f=(x,y,v)=>v?T.k[x].n.split(' von ')[0]+' '+TNY_HIT[v]+' '+T.k[y].n.split(' von ')[0]:'';const s=[f(a,b,T.o[0]),f(b,a,T.o[1])].filter(Boolean);say(r,'⚔ '+(T.pass+1)+'. Lanzengang: '+(s.length?s.join(' · '):'beide verfehlen')+' – Punkte '+T.sc[0]+':'+T.sc[1])}
 if(T.pt>=TNY_PASS){const unh=T.o.includes(3);if(unh||T.pass>=2){if(tnyMatchEnd(r,T))return;if(T.pass>=4){T.sc[Math.random()<T.k[a].s/(T.k[a].s+T.k[b].s)?0:1]+=1;tnyMatchEnd(r,T);return}say(r,'🔁 Gleichstand – Stechen!')}
  if(T.ph==='joust'){T.pass++;tnyPass(T)}}}
function fairTick(r,dt){if(r.plazaEvent!=='circus'){if(r.fairOn){r.fairOn=0;(r.fests||(r.fests={})).fairH=r.dy;say(r,'🎪 Der Jahrmarkt ist vorbei – Standgebühren insgesamt: '+(r.fairG|0)+' Gold, die Leute reden noch lange davon')}return}
 if(!r.fairOn){r.fairOn=1;r.fairG=0;r.fairT=0}r.fairT+=dt;if(r.fairT>=15){r.fairT=0;const g=3+Math.min(6,r.n.filter(n=>n.vis&&n.vis.kind==='plaza').length);r.gold+=g;r.fairG+=g;r.dirty=true}}
// Zuschauerplätze (lokal): Turnier = hinter der Absperrung auf der Südseite, Jahrmarkt = Gasse zwischen den Ständen
function plazaSpot(r,n){const T=r.plazaEvent;if(T==='tourney'){const i=n.i|0,side=i%2?1:-1,col=(i>>1)%6;return{lx:side*(3.4+col*.85),lz:3.1+((i>>3)%2)*.8,fx:side*(3.4+col*.85),fz:0}}
 if(T==='circus'){const lx=(n.i%2?1:-1)*(2.6+Math.abs(Math.sin(n.i*2.1))*6.6),lz=Math.cos(n.i*1.7)*1.5;return{lx,lz,fx:lx,fz:lz>0?4.5:-4.5}}
 return null}
BD.chapel.w=6;BD.chapel.d=8;BD.market.d=8;
// Kirchen haben einen eigenen Friedhof: Totengräber gehört dorthin
for(const k of['chapel','church','cathedral'])BD[k].jobs={...(BD[k].jobs||{}),gravedigger:1};BD.cemetery.graves=40;
const hasRoom=(b,k)=>b.t==='keep'&&!!((b.ext||0)&(k==='dungeon'?1:2))&&(k!=='torture'||b.st>=2);
const jobsOf=b=>hasRoom(b,'torture')?{hangman:1}:BD[b.t].jobs;
function migrateRooms(r){const keep=r.b.find(b=>b.t==='keep')||r.ru.find(b=>b.t==='keep');if(!keep)return;const old=r.b.filter(b=>['dungeon','torture'].includes(b.t));for(const b of old){keep.ext=(keep.ext||0)|(b.t==='dungeon'?1:2);if(b.t==='torture')keep.pendingTorture=true;for(const n of r.n)if(n.wb===b.id)n.wb=keep.id;}r.b=r.b.filter(b=>!old.includes(b));if(keep.pendingTorture&&keep.st<2){keep.ext&=~2;}else if(keep.pendingTorture){keep.ext|=2;delete keep.pendingTorture;}r.ru=r.ru.filter(b=>!['dungeon','torture'].includes(b.t));}
const CAT={};for(const k in BD)CAT[k]={w:BD[k].w,d:BD[k].d,c:BD[k].c,n:BN[k],j:BD[k].jobs,p:BD[k].prod?{i:BD[k].prod.in,o:BD[k].prod.out,e:BD[k].prod.every,annual:!!BD[k].prod.annual,d:BD[k].prod.dest}:undefined};
const DEFAULT_MAP=Rules.presetMaps()[0];
const hashSeed=s=>{let h=2166136261>>>0;for(const ch of String(s)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0};
const makeRng=s=>{let x=(s>>>0)||1;return()=>((x=Math.imul(x,1664525)+1013904223>>>0)/4294967296)};
const townsOf=r=>(r.map&&r.map.towns)||DEFAULT_MAP.towns,friendTowns=r=>townsOf(r).filter(t=>t.k==='friend'),enemyTown=r=>townsOf(r).find(t=>t.k==='enemy')||{n:'Banditenlager',x:25,z:-145,k:'enemy'},hasEnemy=r=>townsOf(r).some(t=>t.k==='enemy');
const riverAt=(r,z)=>Rules.riverX(z,r.map||DEFAULT_MAP),inRiver=(r,x,z,m=0)=>Rules.riverDist(x,z,r.map||DEFAULT_MAP)<6+m,shipRiver=r=>Rules.riverNS(r.map||DEFAULT_MAP);
function isBlankMap(src){
  if(!src||typeof src!=='object')return false;
  const noT=!Array.isArray(src.towns)||!src.towns.length;
  const noF=!Array.isArray(src.forests)||!src.forests.length;
  const noO=!Array.isArray(src.ores)||!src.ores.length;
  const noR=!Array.isArray(src.rocks)||!src.rocks.length;
  return noT&&noF&&noO&&noR;
}
function applyMap(r,map){
  const src=map||DEFAULT_MAP;
  const allowEmpty=isBlankMap(src);
  r.map=Rules.sanitizeMap(src,!!allowEmpty);
  r.tw=(r.map.towns||[]).map(t=>({...t}));
  r.or=(r.map.ores||[]).map(o=>({id:uid++,k:o.k,x:+o.x,z:+o.z}));
  r.tr=[];r.rk=[];
  const occupied=[];
  const free=(x,z,pad)=>Math.abs(x)<=155*SC(r)&&Math.abs(z)<=155*SC(r)&&!inRiver(r,x,z,5)&&!(r.tw||[]).some(t=>Math.hypot(t.x-x,t.z-z)<pad)&&!occupied.some(o=>Math.hypot(o.x-x,o.z-z)<1.4);
  for(const f of r.map.forests||[]){
    const rnd=makeRng(hashSeed('f:'+f.x+':'+f.z+':'+f.r+':'+f.d));
    let placed=0,want=f.d||20;
    for(let i=0;i<want*3&&placed<want;i++){
      const a=rnd()*6.283,d=Math.sqrt(rnd())*(f.r||20);
      const x=Math.round((f.x+Math.cos(a)*d)*100)/100,z=Math.round((f.z+Math.sin(a)*d)*100)/100;
      if(!free(x,z,12))continue;
      r.tr.push({id:uid++,x,z,hp:4,st:0});occupied.push({x,z});placed++;
    }
  }
  for(const k of r.map.rocks||[]){
    const rnd=makeRng(hashSeed('r:'+k.x+':'+k.z+':'+k.r+':'+k.d));
    let placed=0,want=k.d||10;
    for(let i=0;i<want*3&&placed<want;i++){
      const a=rnd()*6.283,d=Math.sqrt(rnd())*(k.r||10);
      const x=Math.round((k.x+Math.cos(a)*d)*100)/100,z=Math.round((k.z+Math.sin(a)*d)*100)/100;
      if(!free(x,z,8))continue;
      r.rk.push({id:uid++,x,z,hp:5});occupied.push({x,z});placed++;
    }
  }
  // Vorgebaute Stadt (z. B. Linz ANNO 1400): fertige Gebäude setzen, Bäume/Felsen in den Grundflächen entfernen, erste Bürger ansiedeln
  if(Array.isArray(r.map.pre)&&r.map.pre.length&&!r.b.length){for(const[t,x,z,rot,lv,v,st]of r.map.pre){if(!BD[t])continue;const b={id:uid++,t,x,z,r:rot,hp:1,st:st|0,lv:lv|0,v:v|0,tm:0};b.hp=mh(b);r.b.push(b)}
   const inB=(o,pad)=>r.b.some(b=>{const[lx,lz]=Rules.local(b,o.x,o.z);return Math.abs(lx)<BD[b.t].w/2+pad&&Math.abs(lz)<BD[b.t].d/2+pad});r.tr=r.tr.filter(o=>!inB(o,2));r.rk=r.rk.filter(o=>!inB(o,2));
   const kp=r.b.find(b=>b.t==='keep');if(kp){migrateRooms(r);r.next=(r.set?r.set.interval:120)*2;r.preTown=1}r.dirty=true}
  r.dr=[];for(let i=0;i<14;i++)r.dr.push(newDeer(r));
  r.dt=true;if(r.pl)seedLoose(r);
}
const NT={sword:{cost:50,hp:100,dmg:12,rng:2.2,cd:1,spd:3.4},archer:{cost:60,hp:60,dmg:9,rng:16,cd:1.5,spd:3},peasant:{cost:0,hp:50,dmg:0,rng:0,cd:1,spd:2.6,job:1},child:{cost:0,hp:30,dmg:0,rng:0,cd:1,spd:3.2}};
NT.watch={cost:0,hp:80,dmg:8,rng:2,cd:1,spd:2.2};
// weitere Kriegerklassen: Speer-/Lanzenträger, Armbrustschütze, Ritter zu Pferd
Object.assign(NT,{spear:{cost:45,hp:120,dmg:11,rng:3,cd:1.1,spd:3.2},crossbow:{cost:70,hp:70,dmg:16,rng:20,cd:2.6,spd:2.8},knight:{cost:150,hp:260,dmg:22,rng:2.8,cd:1.1,spd:5.4}});
const SOLDIER=['sword','archer','spear','crossbow','knight'],RANGED=['archer','crossbow'],SOLN={sword:'Schwertkämpfer',archer:'Bogenschützen',spear:'Lanzenträger',crossbow:'Armbrustschützen',knight:'Ritter zu Pferd'};for(const j of JOBS)NT[j]={cost:0,hp:60,dmg:0,rng:0,cd:1,spd:2.8,job:1};
// 0 gender,1 skin,2 hairStyle,3 hairColor,4 beard,5 outfit,6 cloth,7 belt,8 civHead,9 armor,10 armHead,11 cloak
const PMAX=[1,5,3,8,3,1,13,13,9,7,6,5],cleanProf=a=>Array.isArray(a)&&a.length===12&&a.every((v,i)=>Number.isInteger(v)&&v>=0&&v<=PMAX[i])?a:[0,2,0,2,1,0,0,9,0,0,0,0];
const rnd=(a,b)=>a+Math.random()*(b-a),dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z),r2=v=>Math.round(v*100)/100;
const dims=(t,rot)=>Rules.dims(BD,t,rot),reach=b=>Math.max(BD[b.t].w,BD[b.t].d)/2+1.5;
const costStr=c=>Object.entries(c).map(([k,n])=>n+' '+GN[k]).join(', '),afford=(r,c)=>Object.entries(c).every(([k,n])=>r.inv[k]>=n),pay=(r,c)=>{for(const k in c)r.inv[k]-=c[k]};
const frac=(c,f)=>Object.fromEntries(Object.entries(c).map(([k,n])=>[k,Math.max(1,Math.ceil(n*f))]));
function canPlace(r,t,x,z,rot){const B=BD[t],[w,d]=dims(t,rot);if(['dungeon','torture'].includes(t))return'Als Erweiterung im Bergfried einrichten';if(Math.abs(x)>BUILD_LIMIT_(r)||Math.abs(z)>BUILD_LIMIT_(r))return'Außerhalb der Karte';const wr=Rules.riverDist(x,z,r.map||DEFAULT_MAP);if(Rules.FARMS.includes(t)){const G=Rules.groundAt(x,z,r.map||DEFAULT_MAP);if(G.sand>.5||G.rock>.5)return'Auf Sand und Fels wächst nichts – auf Wiese anlegen'}
 if(B.bridge){if(Math.abs(Math.sin(rot*Math.PI/2))>.02)return'Brücke nur quer zum Fluss';if(wr>4)return'Die Brücke muss den Fluss kreuzen'}
 else{if(wr<6+w/2)return'Im Wasser kann nicht gebaut werden';if(B.water&&(wr<9||wr>20))return'Fischerei muss am Flussufer stehen';if(B.harbor&&(wr<9.5||wr>13.5))return'Der Hafen muss direkt am Ufer stehen'}
 if(B.ore&&!r.or.some(o=>o.k===B.ore&&Math.hypot(o.x-x,o.z-z)<9))return'Kein '+(B.ore==='iron'?'Eisen':'Gold')+'-Vorkommen in der Nähe (siehe Karte)'
 for(const o of[...r.b,...r.ru,...(r.cs||[])]){if(Rules.passOverlap(t,o.t))continue;const[w2,d2]=dims(o.t,o.r);if(Math.abs(x-o.x)<(w+w2)/2-.2&&Math.abs(z-o.z)<(d+d2)/2-.2)return'Hier ist kein Platz (anderes Gebäude oder Ruine)'}
 for(const o of r.tr)if(Math.abs(x-o.x)<w/2+.6&&Math.abs(z-o.z)<d/2+.6)return o.st?'Ein Wurzelstock steht im Weg – mit Axt oder Spitzhacke entfernen':'Ein Baum steht im Weg';
 if(t==='quarry'&&!r.rk.some(o=>{const [lx,lz]=Rules.local({x,z,r:rot},o.x,o.z);return Math.abs(lx)<=B.w/2&&Math.abs(lz)<=B.d/2}))return'Steinbruch muss auf einem Steinvorkommen stehen';
 for(const o of r.rk)if(t!=='quarry'&&(Math.abs(x-o.x)<w/2+1&&Math.abs(z-o.z)<d/2+1))return'Ein Fels steht im Weg';return null}
function seed(r){applyMap(r,r.map)}
function newDeer(r){let x,z,t=0;do{const a=rnd(0,6.28),d=rnd(25,90*SC(r));x=Math.cos(a)*d;z=Math.sin(a)*d;t++}while(inRiver(r,x,z,3)&&t<10);return{id:uid++,x,z,hp:2,ry:0,w:null,ag:DEER_GROW,fm:Math.random()<.55}}
// Wild: Ricken bekommen Kitze (wachsen in ~8 min heran, folgen der Mutter); erlegte Tiere fallen um und bleiben als Kadaver liegen
const DEER_GROW=480,deerYoung=d=>(d.ag??DEER_GROW)<DEER_GROW,deerMax=d=>deerYoung(d)?1:2;
function deerTick(r,dt){const cap=Math.min(120,14*SC(r)*SC(r)),minPop=Math.max(6,Math.round(5*SC(r)*SC(r)));
 for(const d of r.dr){if(d.fm===undefined){d.fm=Math.random()<.55;d.ag=DEER_GROW}if(deerYoung(d))d.ag+=dt}
 for(const d of r.dr)if(deerYoung(d)){const mo=r.dr.find(o=>o.id===d.mo);if(mo&&dist(d,mo)>3){d.w={x:mo.x+rnd(-1.5,1.5),z:mo.z+rnd(-1.5,1.5)}}}
 r.dbt=(r.dbt||0)+dt;if(r.dbt>=40){r.dbt=0;if(r.dr.length<cap){const ad=r.dr.filter(d=>!deerYoung(d));for(const f of ad)if(f.fm&&Math.random()<.22&&!r.dr.some(k=>k.mo===f.id&&deerYoung(k))&&ad.some(m=>!m.fm&&dist(m,f)<60)){r.dr.push({id:uid++,x:f.x+rnd(-1,1),z:f.z+rnd(-1,1),hp:1,ry:f.ry||0,w:null,ag:0,fm:Math.random()<.5,mo:f.id});if(r.dr.length>=cap)break}}}
 r.dmt=(r.dmt||0)+dt;if(r.dmt>=15){r.dmt=0;if(r.dr.length<minPop)for(let k=0;k<2;k++)for(let attempt=0;attempt<30;attempt++){const d=newDeer(r);d.fm=k===0;if(!r.b.some(b=>dist(d,b)<reach(b)+4)&&![...r.pl.values()].some(p=>dist(d,p)<25)){r.dr.push(d);break}}}}
function deerFall(r,d){r.lo.push({id:uid++,k:'carcass',n:1,x:r2(d.x),z:r2(d.z),ry:r2(d.ry||0),sc:deerYoung(d)?r2(.55+.45*d.ag/DEER_GROW):1});r.dl=true}
function room(code,map){let r=rooms.get(code);if(!r){const src=map||DEFAULT_MAP;const allowEmpty=isBlankMap(src);r={creative:false,map:Rules.sanitizeMap(src,!!allowEmpty),tw:[],paths:[],pathDirty:true,deerTimer:0,pl:new Map(),b:[],ru:[],n:[],e:[],w:[],co:[],gold:500,ar:[],an:[],pt:6,bt:40,bw:0,hr:+process.env.START_HOUR||8,dy:+process.env.START_DAY||0,wx:0,wt:60,tl:{axe:0,pick:0,hoe:0},
  inv:{wood:260,stone:130,wheat:14,meat:3,bread:0,roast:0,flour:0,wool:0,cloth:0,gambeson:0,milk:0,cheese:0,fish:0,weapons:2,armor:0,potions:0,iron:6,copper:0,honey:0,hides:0,leather:0,apples:0,hops:0,beer:0,sausage:0,smoked:0,straw:70,shingles:60,stick:0},or:[],ev:{on:1,every:240,fire:1,sick:1,omen:1,rats:1,thieves:1,ambush:1,cyc:1,sl:4},et:200,fires:[],cv:[],tt:150,cq:0,campOn:false,cr:5,omen:0,sup:10,pr:0,fame:0,gr:0,hap:50,dr:[],tr:[],rk:[],dt:true,set:{interval:120,max:6,autosave:30,wear:1},cs:[],ca:[],lo:[],sw:[],bags:{},tax:1,ration:1,next:120,dirty:true,tk:0,lastSave:0};
  rooms.set(code,r);applyMap(r,r.map)}return r}
const tx=(r,s)=>r.pl.forEach(p=>{if(p.ws.readyState===1)p.ws.send(s)});
const tell=(p,m)=>p.ws.send(JSON.stringify({t:'ev',m})),say=(r,m,pos)=>tx(r,JSON.stringify(pos?{t:'ev',m,x:r2(pos.x),z:r2(pos.z)}:{t:'ev',m}));
function raid(r){if(r.set.max<1||r.cq>0||!hasEnemy(r))return;const sol=r.n.filter(n=>SOLDIER.includes(n.k)).length,det=r.det||0,cap=Math.max(2,Math.floor(1.5*sol)),lim=Math.max(1,Math.min(r.set.max,Math.ceil(cap*(1-.5*det)))),n=1+Math.floor(Math.random()*lim),en=enemyTown(r),a=rnd(0,6.28);r.warned=false;
 for(let i=0;i<n;i++){const x=RD?Math.cos(a)*RD+rnd(-5,5):en.x+rnd(-8,8),z=RD?Math.sin(a)*RD+rnd(-5,5):en.z+rnd(-8,8);r.e.push({id:uid++,x,z,hp:70,cd:0,ry:0})}
 say(r,'⚠ Banditen aus '+en.n+' greifen an! ('+n+' Gegner, höchstens 1,5× deine Soldaten)');if(r.n.some(n=>n.m==='post'))say(r,'🔔 Wachposten sichten Banditen im Anmarsch!')}
function mv(o,x,z,sp,dt){const dx=x-o.x,dz=z-o.z,d=Math.hypot(dx,dz);if(d>.05){const s=Math.min(d,sp*dt);o.x+=dx/d*s;o.z+=dz/d*s;o.ry=Math.atan2(dx,dz)}return d}
function near(o,l,max){let b=null;for(const e of l){const d=dist(o,e);if(d<max){max=d;b=e}}return b}
const mkNpc=(r,k,x,z,o=0)=>{const n={id:uid++,k,o,x,z,ry:0,hp:NT[k].hp,cd:0,m:'guard',p:{x,z},i:rnd(0,6.28)};r.n.push(n);return n};
const WALLK=['wall','battle','palisade','tower','gate','portcullis','stairs'],postN=b=>b.t==='keep'&&(b.st|0)>=3?4:BD[b.t].post.n,postY=b=>b.t==='keep'?[8.15,9.3,11.3,11.3][b.st|0]:BD[b.t].post.y,
 fp=(b,lx,lz)=>{const t=(+b.r||0)*Math.PI/2,c=Math.cos(t),s=Math.sin(t);return{x:b.x+lx*c+lz*s,z:b.z-lx*s+lz*c}},
 UP2={chapel:{to:'church',c:{stone:100,wood:40}},church:{to:'cathedral',c:{stone:200,wood:60,iron:20}}},
 mh=b=>b.t==='keep'?[1200,2200,3500,5200][b.st|0]:BD[b.t].hp,capOf=b=>b.t==='house'?2+2*(b.lv|0):(BD[b.t].cap||0)+(b.t==='keep'?4*(b.st|0):0),HOUSEUP=[{wood:12,stone:4,shingles:10},{wood:15,stone:6,shingles:12}],HOUSEN=['Kleines Wohnhaus','Mittleres Wohnhaus','Großes Wohnhaus'],UPG=[{wood:30,stone:80},{stone:160,wood:40,iron:20},{stone:240,iron:60,wood:60}],UPN=['Holzhalle','Holzbergfried','Steinbergfried','Verstärkter Steinbergfried'];
const popCap=r=>4+r.b.reduce((s,b)=>s+capOf(b),0),food=r=>r.inv.wheat+r.inv.meat+r.inv.bread+r.inv.roast+r.inv.cheese+r.inv.fish+r.inv.honey+r.inv.apples+r.inv.sausage+r.inv.smoked;
const stockCap=r=>300+r.b.reduce((s,b)=>s+(b.t==='keep'?300+200*(b.st|0):0)+(BD[b.t].store||0),0);
function shoot(r,n,t,dmg){const d=dist(n,t),dur=Math.max(.25,d/22);r.ar.push({t:dur,tg:t,dmg});r.an.push([r2(n.x),r2(n.z),t.id||0,r2(t.x),r2(t.z),r2(dur),r2(n.el||0)])}
const season=r=>Math.floor((r.dy||0)/((r.ev&&r.ev.sl)||4))%4,FG=r=>[1,1.2,.8,0][season(r)]*(r.wx===1?1.5:1);
const BASEP={flour:25,wood:15,stone:25,wheat:20,bread:40,meat:30,cheese:50,wool:30,cloth:70,gambeson:95,fish:25,weapons:90,armor:140,potions:85,iron:35,copper:45,honey:40,leather:60,apples:15,beer:30,sausage:45,smoked:45};
const priceOf=(r,k)=>ecoPrice(r,k)*BASEP[k]*(['wheat','bread','meat','cheese','fish','apples','sausage','smoked','honey'].includes(k)?[1,.95,.85,1.35][season(r)]:k==='wood'?[1,1,1,1.3][season(r)]:1)*(1+.08*Math.sin((r.dy||0)*1.7+k.length*2.1));
const used=(r,b)=>r.n.filter(n=>n.wb===b.id&&n.hp>0).length;
const priestCap=b=>({chapel:6,church:12,cathedral:18}[b.t]||0),SICK_IMMUNE=new Set(['gravedigger','healer']);
const sickLimit=n=>[0,780,600,450][Math.max(1,Math.min(3,n.sk|0))]||600;
function diseaseName(n){return ['','leicht','mittelschwer','schwer'][Math.max(1,Math.min(3,n.sk|0))]}
function freeSlot(r,job,at){let best=null,bd=1e9;for(const b of r.b){const s=jobsOf(b)&&jobsOf(b)[job];if(!s||b.off||b.manual||used(r,b)>=s)continue;const d=at?dist(b,at):0;if(d<bd){bd=d;best=b}}return best}
// Kinder: spielen tagsüber Fangen oder toben am Dorfplatz, schlafen nachts zuhause, nach einem Jahr erwachsen
function play(r,n,dt){const year=4*((r.ev&&r.ev.sl)||4);if((r.dy|0)-(n.born|0)>=year){n.k='peasant';n.hp=NT.peasant.hp;n.w=null;n.chase=0;say(r,'🧑 Ein Kind ist erwachsen geworden und kann jetzt arbeiten');r.dirty=true;return}
 const home=homeOf(r,n)||r.b.find(b=>b.t==='keep');
 if((r.hr>=20||r.hr<6)&&home){enterBuilding(n,home,fp(home,0,-.5),dt);return}
 if(n.insideId){const old=r.b.find(b=>b.id===n.insideId);if(old&&!exitBuilding(n,old,dt))return}
 n.pt=(n.pt||0)-dt;const kids=r.n.filter(o=>o.k==='child'&&o!==n&&o.hp>0&&!o.sk);
 if(n.pt<=0||(!n.w&&!n.chase)){n.pt=rnd(3,7);const c=r.b.find(b=>b.t==='plaza')||r.b.find(b=>b.t==='keep')||{x:0,z:0};
  if(kids.length&&Math.random()<.6)n.chase=kids[Math.random()*kids.length|0].id;else{n.chase=0;n.w={x:c.x+rnd(-10,10),z:c.z+rnd(-4,12)}}}
 if(n.chase){const t=r.n.find(o=>o.id===n.chase);if(t){const a=n.i+(r.hr*60),d=mv(n,t.x+Math.sin(a)*1.1,t.z+Math.cos(a)*1.1,3.4,dt);if(d<1){n.chase=0;n.pt=Math.min(n.pt,1.5)}return}n.chase=0}
 if(n.w&&mv(n,n.w.x,n.w.z,2.8,dt)<.6)n.w=null}
function idle(r,n,dt){if(r.hr>=7&&r.hr<18&&gatherIdle(r,n,dt))return;const c=r.b.find(b=>b.t==='keep')||{x:0,z:6};if(n.pz>0){n.pz-=dt;return}if(!n.w||mv(n,n.w.x,n.w.z,1.6,dt)<.8){n.w={x:c.x+rnd(-9,9),z:c.z+rnd(-2,10)};n.pz=rnd(2,7)}}
function homeOf(r,n){let h=n.hid&&r.b.find(b=>b.id===n.hid);if(!h){let best=null,bs=9;for(const b of r.b){const c=capOf(b);if(!c)continue;const u=(r.res[b.id]||0)/c;if(u<1&&u<bs){bs=u;best=b}}if(best){n.hid=best.id;r.res[best.id]=(r.res[best.id]||0)+1}h=best}return h}
const WK={smith:2,miner:2,minter:2};
function storeAt(r,from){const s=near(from,r.b.filter(b=>b.t==='storage'),1e9)||r.b.find(b=>b.t==='keep')||from;return BD[s.t]?fp(s,0,BD[s.t].d/2+1.8):{x:s.x,z:s.z}}
const WORKSPOTS={mint:[[-1.5,-.9,Math.PI],[1.2,-.4,Math.PI/2]],smithy:[[-1.6,1.25,0]],bakery:[[1.35,.65,0]],bower:[[1.45,-.2,0]],armorer:[[1.3,-.45,0]],dairy:[[-1.5,.35,Math.PI]],butcher:[[-1.4,.3,Math.PI]],smokehouse:[[0,.2,Math.PI]],brewery:[[0,-.7,Math.PI]],tannery:[[0,-.6,Math.PI/2]],weaver:[[-1.1,.2,Math.PI]],tavern:[[0,-2.4,0]],apothecary:[[0,-.8,Math.PI]],mill:[[0,-.3,Math.PI/2]],keep:[[2.1,-1.7,Math.PI/2]],chapel:[[0,-2,Math.PI]],church:[[0,-4,Math.PI]],cathedral:[[0,-7.2,Math.PI]]};
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
  r.lastTax=taxGold;if(taxGold){r.gold+=taxGold;if(tax===2)say(r,'💰 Hohe Steuern: +'+taxGold+' Gold (Unzufriedenheit steigt)')}
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
  if(!Object.entries(P.in).every(([k,q])=>r.inv[k]>=q)){if(wb.t==='apothecary'&&herbGather(r,n,wb,dt))return;wb.msg='wartet auf '+MAT.filter(k=>r.inv[k]<P.in[k]).map(k=>GN[k]).join(' / ');if(dist(n,{x:X,z:Z})>1.5)mv(n,X,Z,2.8,dt);return}
  if(!exitBuilding(n,wb,dt))return;const S=storeAt(r,wb);if(dist(n,S)>1.6){mv(n,S.x,S.z,3,dt);return}for(const k in P.in)r.inv[k]-=P.in[k];c.st='work';c.t=0;c.carry=MAT[0]}
 if(c.st==='work'){wb.act=r.tk;if(!enterBuilding(n,wb,workPoint(r,wb,n),dt)){n.cr=c.carry||0;return}n.cr=0;wb.msg='stellt '+P.name+' her';n.work=WK[n.k]||1;c.t+=dt;if(n.work===2&&c.t%1.1<dt)n.cd=1;if(c.t>=P.every){c.st='deliver';c.out=Object.keys(P.out)[0]||0}return}
 if(c.st==='deliver'){n.cr=c.out;if(!exitBuilding(n,wb,dt))return;const A=near(n,r.b.filter(b=>b.t==='armory'),1e9),D=A?fp(A,0,BD.armory.d/2+1.8):storeAt(r,wb);if(dist(n,D)>1.6){mv(n,D.x,D.z,3,dt);return}for(const k in P.out)r.inv[k]=Math.min(stockCap(r),r.inv[k]+P.out[k]);n.cr=0;c.st='fetch';c.recipe=null;wb.msg='liefert '+P.name}}
const CARC={every:26,in:{carcass:1},out:{meat:4,hides:1}};
function cycle(r,n,wb,B,dt,X,Z){if(n.k==='hangman')return torment(r,n,wb,B,dt,X,Z);if(wb.t==='butcher'){const c0=n.cy||(n.cy={st:'fetch',t:0});if(c0.st==='fetch')c0.rc=(r.inv.carcass||0)>=1?'carc':''}const P=wb.t==='butcher'&&n.cy&&n.cy.rc==='carc'?CARC:B.prod,target=workPoint(r,wb,n);if(!P||P.annual){if(enterBuilding(n,wb,target,dt))n.work=P?.annual?1:0;return}
 if(wb.t==='armorer')return armorerCycle(r,n,wb,dt,X,Z);
 const c=n.cy||(n.cy={st:'fetch',t:0}),MAT=Object.keys(P.in||{});
 if(c.st==='fetch'){n.cr=0;if(!MAT.length){c.st='work';c.t=0}else{
  if(!Object.entries(P.in).every(([k,q])=>r.inv[k]>=q)){if(wb.t==='apothecary'&&herbGather(r,n,wb,dt))return;wb.msg='wartet auf '+MAT.filter(k=>r.inv[k]<P.in[k]).map(k=>GN[k]).join(' / ');if(dist(n,{x:X,z:Z})>1.5)mv(n,X,Z,2.8,dt);return}
  if(!exitBuilding(n,wb,dt))return;const S=storeAt(r,wb);if(dist(n,S)>1.6){mv(n,S.x,S.z,3,dt);return}for(const k in P.in)r.inv[k]-=P.in[k];c.st='work';c.t=0;c.carry=MAT[0]}}
 if(c.st==='work'){wb.act=r.tk;let tg=target,pose=0;const rr=(wb.r||0)*Math.PI/2;
  // Bäcker: Teig kneten → Brote mit dem Schieber in den Ofen → warten → fertige Brote herausholen → zum Tisch
  if(wb.t==='bakery'){const f=c.t/P.every,at=(x,z,ry)=>({...fp(wb,x,z),ry:ry+rr});if(f<.3)tg=at(1.4,.95,0);else if(f<.42){tg=at(-1.75,-.12,Math.PI);pose=9}else if(f<.78)tg=at(-.8,-.3,Math.PI);else if(f<.9){tg=at(-1.75,-.12,Math.PI);pose=11}else{tg=at(1.4,.95,0);pose=11}}
  if(wb.t==='butcher'&&c.rc==='carc')pose=10;   // Metzger zerteilt das Reh auf dem Tisch
  if(!enterBuilding(n,wb,tg,dt)){n.cr=c.carry||0;if(pose===11)n.ps=11;return}n.ry=tg.ry;n.cr=0;c.carry=0;wb.msg='stellt '+Object.keys(P.out||{}).map(k=>GN[k]).join(' / ');n.work=pose?0:(WK[n.k]||1);n.ps=pose||n.ps;if(wb.t==='bakery'&&c.t/P.every>=.3&&c.t/P.every<.78&&!pose)n.work=0;c.t+=dt;if(n.work===2&&c.t%1.1<dt)n.cd=1;if(c.t>=P.every){c.st='deliver';c.out=Object.keys(P.out)[0]}return}
 if(c.st==='deliver'&&wb.t==='mint'){const coin=20+Math.round(Math.random()*10);wb.chest=(wb.chest||0)+coin;wb.msg='prägt Taler und Groschen ('+(wb.chest|0)+' Gold in den Truhen)';c.st='fetch';return}
 if(c.st==='deliver'){n.cr=c.out;if(!exitBuilding(n,wb,dt))return;const g=P.dest==='garrison'?near(n,r.b.filter(b=>b.t==='garrison'),1e9):null,D=g?fp(g,0,BD.garrison.d/2+1.8):storeAt(r,wb);
  if(dist(n,D)>1.6){mv(n,D.x,D.z,3,dt);return}for(const k in P.out)r.inv[k]=Math.min(stockCap(r),r.inv[k]+P.out[k]);wb.msg='liefert '+Object.keys(P.out||{}).map(k=>GN[k]).join(' / ');n.cr=0;c.st='fetch'}}
function autoAssign(r){const peas=r.n.filter(n=>n.k==='peasant'&&!n.tr&&!n.sk&&!n.manualIdle),kp=r.b.find(b=>b.t==='keep');let avail=peas.length-(r.b.some(b=>b.t==='garrison')?1:0);if(avail<=0||!kp)return;
 const ORD=['minter','farmer','wood','miller','cook','miner','mason','smith','hunter','shepherd','weaver','tanner','fisher','keeper','priest','healer','trader','gravedigger','hangman'],o=[...r.pl.keys()][0]||0;let did=true;
 while(avail>0&&did){did=false;for(const j of ORD){if(avail<=0)break;const wb=freeSlot(r,j,kp);if(!wb)continue;const pe=peas.shift();pe.hp=0;pe.conv=1;const n=mkNpc(r,j,pe.x,pe.z,o);n.wb=wb.id;n.ry=pe.ry;avail--;did=true}}}
function woodCycle(r,n,wb,B,dt,X,Z){const c=n.cy||(n.cy={st:'seek'}),blk=fp(wb,-2.4,B.d/2+.8);
 if(c.st==='seek'){n.cr=0;const t=near(n,r.tr.filter(o=>!o.st),80);if(!t){if(dist(n,{x:X,z:Z})>2.5)mv(n,X,Z,2.5,dt);return}c.t=t;c.st='chop';c.h=0}
 if(c.st==='chop'){const t=c.t;if(!r.tr.includes(t)||t.st){c.st='seek';return}if(dist(n,t)>2.2){mv(n,t.x,t.z,2.8,dt);return}n.ry=Math.atan2(t.x-n.x,t.z-n.z);c.h-=dt;if(c.h>0)return;c.h=1.4;n.cd=1;t.hp-=1+r.tl.axe;
  if(t.hp<=0){t.st=1;t.rg=0;t.hp=3;r.dt=true;c.n=4+r.tl.axe;c.st='haul'}return}
 if(c.st==='haul'){n.cr='logs';const P=fp(wb,1.4,B.d/2+1.2);if(dist(n,P)>1.4){mv(n,P.x,P.z,2.6,dt);return}wb.lg=(wb.lg||0)+c.n;c.k=c.n;c.st='split';c.t2=0;n.cr=0}
 if(c.st==='split'){wb.act=r.tk;if(dist(n,blk)>1.2){mv(n,blk.x,blk.z,2.8,dt);return}n.ry=Math.PI;n.work=2;c.t2+=dt;if(c.t2%1.1<dt)n.cd=1;if(c.t2>=2*c.k){wb.lg=Math.max(0,(wb.lg||0)-c.k);c.o=c.k;c.st='deliver'}return}
 if(c.st==='deliver'){n.cr='wood';const D=storeAt(r,wb);if(dist(n,D)>1.6){mv(n,D.x,D.z,3,dt);return}r.inv.wood=Math.min(stockCap(r),r.inv.wood+c.o);r.inv.shingles=Math.min(stockCap(r),(r.inv.shingles||0)+Math.floor(c.o*1.5));n.cr=0;c.st='seek'}}
// Pestdoktor: bei Krankheit im Ort macht der Heiler in Schnabelmaske Hausbesuche; besuchte Kranke genesen schneller
const sickHome=(r,o)=>r.b.find(b=>b.id===o.hid&&(b.t==='house'||b.t==='bighouse'))||r.b.find(b=>b.id===o.insideId);
function plagueVisit(r,n,dt){const sick=r.n.filter(o=>o.sk&&o.hp>0&&o!==n);if(!sick.length){if(n.pd){n.pd=0;n.visit=0;n.pv=null}return false}
 if(!n.pd){n.pd=1;say(r,'🩺 Krankheit im Ort – der Heiler legt die Pestdoktor-Tracht an und macht Hausbesuche',n)}
 const old=r.b.find(b=>b.id===n.insideId);if(old&&!exitBuilding(n,old,dt))return true;
 let tgt=n.pv&&r.b.find(b=>b.id===n.pv.b);
 if(!tgt||n.pv.t<=0||!sick.some(o=>sickHome(r,o)===tgt)){const H=[...new Set(sick.map(o=>sickHome(r,o)).filter(Boolean))].sort((a,b)=>dist(n,a)-dist(n,b));
  if(!H.length){const o=near(n,sick,1e9);n.visit=0;if(o&&dist(n,o)>1.6)mv(n,o.x,o.z,2.6,dt);return true}
  tgt=H.length>1&&n.pv&&H[0].id===n.pv.b?H[1]:H[0];n.pv={b:tgt.id,t:16}}
 const D=fp(tgt,0,BD[tgt.t].d/2+1.4);if(dist(n,D)>1.2){n.visit=0;mv(n,D.x,D.z,2.6,dt);return true}
 n.visit=tgt.id;n.pv.t-=dt;n.ry=Math.atan2(tgt.x-n.x,tgt.z-n.z);return true}
// Stadtmauer-Ring: Mittelpunkt, Radius und Patrouillenpunkte innen entlang der Mauer (gecacht)
function wallRing(r){if(r.wrT===r.tk)return r.wr;r.wrT=r.tk;if(r.tk%40&&r.wr!==undefined)return r.wr;const W=r.b.filter(b=>['wall','battle','palisade','tower','gate','portcullis'].includes(b.t));if(W.length<6){r.wr=null;return null}
 const C={x:W.reduce((a,b)=>a+b.x,0)/W.length,z:W.reduce((a,b)=>a+b.z,0)/W.length},R=W.reduce((a,b)=>a+dist(b,C),0)/W.length;if(R<8){r.wr=null;return null}
 const S=[...W].sort((a,b)=>Math.atan2(a.z-C.z,a.x-C.x)-Math.atan2(b.z-C.z,b.x-C.x)),step=Math.max(1,Math.floor(S.length/24)),pts=[];for(let i=0;i<S.length;i+=step){const b=S[i],d=dist(b,C)||1,k=Math.max(0,(d-3)/d);pts.push({x:C.x+(b.x-C.x)*k,z:C.z+(b.z-C.z)*k})}
 r.wr={C,R,pts};return r.wr}
// ---- Tagesablauf: abends Taverne oder Abendessen daheim, nachts über die Treppe ins eigene Bett, morgens wieder hinunter ----
const resIdx=(r,n,h)=>r.n.filter(o=>o.hid===h.id&&o.hp>0).sort((a,b)=>a.id-b.id).indexOf(n);
function pathStep(n,b,pts,i,dt){const tg=pts[i],W=fp(b,tg.x,tg.z),pv=i>0?pts[i-1]:null;
 if(pv){const PW=fp(b,pv.x,pv.z),L=Math.max(.01,dist(PW,W)),f=Math.max(0,Math.min(1,1-dist(n,W)/L));n.fl=pv.el+(tg.el-pv.el)*f}
 if(dist(n,W)>.12){mv(n,W.x,W.z,1.6,dt);return false}n.fl=tg.el;return true}
function wakeUp(r,n,dt){const h=r.b.find(b=>b.id===n.slp.b),BP=h&&(h.t==='house'||h.t==='bighouse')?Rules.bedPath(h.t,h.lv,n.slp.ri):null;
 if(!BP||!n.slp.up){n.slp=null;n.fl=0;return false}const R=[...BP.P].reverse();n.slp.dn=n.slp.dn||0;
 if(n.slp.dn<R.length){if(pathStep(n,h,R,n.slp.dn,dt))n.slp.dn++;return true}n.slp=null;n.fl=0;return false}
function lifeTick(r,n,dt){if(SOLDIER.includes(n.k)||['watch','trader','hangman','gravedigger'].includes(n.k)||n.tr||n.pd)return false;
 const hr=r.hr,sleep=hr>=22||hr<6,eve=hr>=18&&hr<22,T=NT[n.k];
 if(!sleep&&!eve){if(n.slp)return wakeUp(r,n,dt);return false}
 if(!(T.job||n.k==='peasant'||n.k==='child'))return false;
 const tvs=r.b.filter(b=>b.t==='tavern');
 if(n.k==='keeper'&&eve){const tv=r.b.find(b=>b.id===n.wb&&b.t==='tavern');if(tv){const I=Rules.interior('tavern'),rr=(tv.r||0)*Math.PI/2,kc=n.kc||(n.kc={s:'tap',t:0});
   // Wirt: am Fass zapfen → Krug zum Gast tragen → abstellen → zurück
   if(kc.s==='tap'){const P=fp(tv,-1.1,-2.05);if(enterBuilding(n,tv,{...P,ry:Math.PI+rr},dt)){n.ps=7;kc.t+=dt;if(kc.t>3.5){const g=r.n.filter(o=>o.evp==='tav'&&o.ps&&o.insideId===tv.id);if(g.length){const o=g[Math.random()*g.length|0],[lx,lz]=Rules.local(tv,o.x,o.z),T=I.tables.reduce((a,t)=>Math.hypot(t[0]-lx,t[1]-lz)<Math.hypot(a[0]-lx,a[1]-lz)?t:a);kc.s='go';kc.to=[T[0]-Math.sign(T[0]||1)*1.05,T[1]];kc.tb=T;kc.t=0}else kc.t=0}}return true}
   const P=fp(tv,kc.to[0],kc.to[1]);n.ps=8;if(dist(n,P)>.15){mv(n,P.x,P.z,1.8,dt);return true}{const Tw=fp(tv,kc.tb[0],kc.tb[1]);n.ry=Math.atan2(Tw.x-n.x,Tw.z-n.z)}kc.t+=dt;if(kc.t>2){kc.s='tap';kc.t=0;if(r.inv.beer>0&&Math.random()<.5){r.inv.beer--;r.gold+=2}}return true}}
 if(eve&&n.k!=='child'&&tvs.length){if(n.evd!==r.dy){n.evd=r.dy;n.evp=Math.random()<.55?'tav':'home'}
  if(n.evp==='tav'){const tv=near(n,tvs,1e9),I=Rules.interior('tavern'),g=r.n.filter(o=>o.evp==='tav'&&o.evd===r.dy&&o.hp>0&&!o.sk).sort((a,b)=>a.id-b.id),i=g.indexOf(n);
   if(i>=0&&i<I.seats.length){const S=I.seats[i],P=fp(tv,S[0],S[1]);if(n.insideId&&n.insideId!==tv.id){const old=r.b.find(b=>b.id===n.insideId);if(old&&!exitBuilding(n,old,dt))return true}
    if(enterBuilding(n,tv,{...P,ry:S[2]+(tv.r||0)*Math.PI/2},dt)){n.ps=n.id%3===0?4:3;if(Math.random()<dt*.008)r.gold+=1}return true}n.evp='home'}}
 const home=homeOf(r,n);if(!home)return false;n.home=home;
 if(n.insideId&&n.insideId!==home.id){const old=r.b.find(b=>b.id===n.insideId);if(old&&!exitBuilding(n,old,dt))return true}
 const isH=home.t==='house'||home.t==='bighouse',ri=Math.max(0,resIdx(r,n,home));
 if(!sleep){if(n.slp)return wakeUp(r,n,dt);if(isH&&ri<4){const S=Rules.interior(home.t,home.lv).seats[ri],P=fp(home,S[0],S[1]);if(enterBuilding(n,home,{...P,ry:S[2]+(home.r||0)*Math.PI/2},dt))n.ps=4;return true}
  enterBuilding(n,home,fp(home,((ri%3)-1)*.85,-.5),dt);return true}
 if(!isH){if(enterBuilding(n,home,{...fp(home,((ri%3)-1)*.9,-.6-Math.floor(ri/3)*.8),ry:(home.r||0)*Math.PI/2},dt))n.ps=1;return true}
 const BP=Rules.bedPath(home.t,home.lv,ri);if(!BP)return false;
 if(!n.slp||n.slp.b!==home.id||n.slp.ri!==ri){n.slp={b:home.id,ri,i:0}}
 if(!n.slp.in){const W=fp(home,BP.P[0].x,BP.P[0].z);if(!enterBuilding(n,home,{...W,ry:0},dt))return true;n.slp.in=1;n.slp.up=1}
 if(n.slp.i<BP.P.length){if(pathStep(n,home,BP.P,n.slp.i,dt))n.slp.i++;return true}
 n.ps=1;n.ry=(home.r||0)*Math.PI/2;n.fl=BP.bed[2]+.6;return true}
// Nur der dienstälteste Priester am Dom ist Bischof, die übrigen bleiben Priester
const bishopId=(r,wb)=>{const c=wb&&r.b.find(b=>b.id===wb);if(!c||c.t!=='cathedral')return -1;let m=-1;for(const o of r.n)if(o.k==='priest'&&o.wb===wb&&o.hp>0&&(m<0||o.id<m))m=o.id;return m};
// ---- Kirchliches Leben: Gottesdienst in den Bänken, Hochzeit vor dem Altar, Taufe am Taufbecken, Beerdigung am Grab, Prozession ----
const CH_T=['cathedral','church','chapel'],chapOf=r=>{for(const t of CH_T){const b=r.b.find(b=>b.t===t);if(b)return b}return null},
 priestOf=(r,c)=>c&&r.n.find(n=>n.k==='priest'&&n.wb===c.id&&n.hp>0&&!n.sk),layAdult=n=>n.hp>0&&!n.sk&&!n.tr&&n.k!=='child'&&!SOLDIER.includes(n.k)&&!['watch','priest','hangman','trader'].includes(n.k);
function pickAdults(r,k,ex=[]){return r.n.filter(n=>layAdult(n)&&!ex.includes(n.id)).sort(()=>Math.random()-.5).slice(0,k).map(n=>n.id)}
function startProc(r,c){const P=[fp(c,0,BD[c.t].d/2+3)];const stops=[...['plaza','market','keep','well','tavern'].map(t=>r.b.find(b=>b.t===t)).filter(Boolean)];let cur=P[0];
 while(stops.length){stops.sort((a,b)=>dist(cur,a)-dist(cur,b));const b=stops.shift();cur=fp(b,0,BD[b.t].d/2+3.5);P.push(cur)}P.push(P[0]);
 const pr=priestOf(r,c);if(!pr||P.length<3)return;r.ce={k:'proc',t:240,c:c.id,pts:P,i:1,lead:pr.id,m:pickAdults(r,8)};say(r,c.t==='cathedral'?'✝ Der Bischof zieht mit seinem Gefolge in einer Prozession durch die Stadt':'✝ Prozession: Der Priester zieht mit den Gläubigen durch das Dorf',c)}
function churchTick(r,dt){const c=chapOf(r);if(!c){r.ce=null;return}
 if(r.ce){r.ce.t-=dt;const e=r.ce;if(e.k==='proc'&&e.i>=e.pts.length)e.t=0;if(e.t<=0){r.ce=null;if(e.k==='wed')say(r,'💍 Das Brautpaar ist verheiratet – die Gäste gratulieren');if(e.k==='bap')say(r,'💧 Das Kind wurde getauft');if(e.k==='fun')say(r,'🕯 Die Trauernden verlassen das Grab');if(e.k==='proc')say(r,'✝ Die Prozession ist zurück in der Kirche')}}
 if(!r.ce&&r.pray<=0&&r.hr>=10.5&&r.hr<11&&r.prd!==r.dy&&r.dy%3===1&&priestOf(r,c)){r.prd=r.dy;startProc(r,c)}}
function banquetRole(r,n,dt){const B=r.banq;if(!B||n.sk)return false;const kp=r.b.find(b=>b.id===B.c);if(!kp)return false;const I=Rules.interior('keep',kp.st|0),rr=(kp.r||0)*Math.PI/2,gi=B.g.indexOf(n.id),si=B.s.indexOf(n.id);if(gi<0&&si<0)return false;
 if(n.insideId&&n.insideId!==kp.id){const old=r.b.find(b=>b.id===n.insideId);if(old&&!exitBuilding(n,old,dt))return true}
 if(gi>=0){const S=I.seats[gi];if(enterBuilding(n,kp,{...fp(kp,S[0],S[1]),ry:S[2]+rr},dt))n.ps=(gi%3===0)?3:4;return true}
 // Speisenträger: vom Kamin (Küche) mit Platte zur Tafel und zurück
 n.bqi=n.bqi||0;const pts=I.servePts,P=pts[n.bqi%pts.length],W=fp(kp,P[0]+(si?.0:.3),P[1]+(si?.5:0));if(!enterBuilding(n,kp,{...W,ry:0},dt)){n.ps=15;return true}n.ps=n.bqi%pts.length?15:0;n.bqw=(n.bqw||0)+dt;if(n.bqw>2.5){n.bqw=0;n.bqi++}return true}
function ceRole(r,n,dt){const e=r.ce;if(!e||n.sk)return false;const c=r.b.find(b=>b.id===e.c);if(!c)return false;const I=Rules.interior(c.t),rr=(c.r||0)*Math.PI/2,at=(x,z,ry)=>({...fp(c,x,z),ry:ry+rr}),pr=n.k==='priest'&&n.wb===c.id;
 const goIn=(P)=>{if(n.insideId&&n.insideId!==c.id){const old=r.b.find(b=>b.id===n.insideId);if(old&&!exitBuilding(n,old,dt))return false}return enterBuilding(n,c,P,dt)};
 if(e.k==='wed'||e.k==='bap'){const ri=[e.a,e.b,e.kid].indexOf(n.id);
  if(pr){const P=e.k==='wed'?at(I.altar[0],I.altar[1]+1.2,0):at(I.font[0]+1,I.font[1],-Math.PI/2);if(goIn(P))n.ps=13;return true}
  if(ri>=0){const P=e.k==='wed'?at(ri?.42:-.42,I.altar[1]+2.3,Math.PI):at(I.font[0]+[-.2,.2,0][ri],I.font[1]+[1,1,-.9][ri],[Math.PI,Math.PI,0][ri]);if(goIn(P))n.pr=1;return true}
  const gi=(e.g||[]).indexOf(n.id);if(gi>=0){const S=I.seats[gi%I.seats.length];if(goIn(at(S[0],S[1],S[2])))n.ps=12;return true}return false}
 if(e.k==='fun'){const mi=(e.m||[]).indexOf(n.id);if(!pr&&mi<0)return false;const A=e.at,ang=pr?0:(mi+1)/((e.m.length)+1)*Math.PI*1.6+Math.PI*.2,R=pr?1.2:1.7,P={x:A.x+Math.sin(ang)*R,z:A.z+Math.cos(ang)*R};
  if(n.insideId){const old=r.b.find(b=>b.id===n.insideId);if(old&&!exitBuilding(n,old,dt))return true}if(dist(n,P)>.15){mv(n,P.x,P.z,2.4,dt);return true}n.ry=Math.atan2(A.x-n.x,A.z-n.z);if(pr)n.ps=13;else if(mi%2)n.ps=5;else n.pr=1;return true}
 if(e.k==='proc'){const mi=e.m.indexOf(n.id);if(n.id!==e.lead&&mi<0)return false;if(n.insideId){const old=r.b.find(b=>b.id===n.insideId);if(old&&!exitBuilding(n,old,dt))return true}
  if(n.id===e.lead){const tg=e.pts[e.i];if(!tg)return true;if(mv(n,tg.x,tg.z,1.25,dt)<.4)e.i++;n.ps=13;return true}
  const ahead=mi===0?r.n.find(o=>o.id===e.lead):r.n.find(o=>o.id===e.m[mi-1]);if(ahead&&dist(n,ahead)>1.5)mv(n,ahead.x,ahead.z,1.45,dt);if(mi===0)n.ps=14;else n.pr=1;return true}
 return false}
function work(r,n,dt){if(n.k==='healer'&&r.hr>=6&&r.hr<22&&plagueVisit(r,n,dt))return;if(n.k==='healer'&&n.pd&&!r.n.some(o=>o.sk&&o.hp>0)){n.pd=0;n.visit=0}const eve=r.hr>=18||r.hr<6||(r.omen>0&&n.k!=='priest');
 if(eve){const old=r.b.find(b=>b.id===n.insideId);if(old&&old.id!==n.hid&&!exitBuilding(n,old,dt))return;const h=homeOf(r,n)||r.b.find(b=>b.t==='keep')||{x:0,z:6};n.home=h;if(h.id)enterBuilding(n,h,fp(h,0,-.5),dt);else mv(n,h.x,h.z,3.2,dt);return}n.home=null;
 if(n.tr){const g=near(n,r.b.filter(b=>b.t==='garrison'),1e9);if(!g){n.tr=null;return}
  const X=g.x,Z=g.z+5.5;if(dist(n,{x:X,z:Z})>1.2){mv(n,X,Z,2.8,dt);return}
  n.ry=0;n.tr.t+=dt;if(n.tr.t%1.2<dt)n.cd=NT[n.k].cd;
  if(n.tr.t>=10){const s=mkNpc(r,n.tr.k,n.x,n.z,n.tr.o);s.p={x:g.x+rnd(-3,3),z:g.z+6+rnd(0,2)};n.hp=0;n.conv=1;say(r,'⚔ Ein Dorfbewohner wurde ausgebildet: '+(SOLN[n.tr.k]||n.tr.k))}
  return}
 if(n.k==='peasant'){if(r.cs.length&&helpBuild(r,n,dt))return;return idle(r,n,dt)}
 let wb=n.wb&&r.b.find(b=>b.id===n.wb);if(!wb){n.wb=0;const f=freeSlot(r,n.k,n);if(f){n.wb=f.id;wb=f}}
 if(!wb)return idle(r,n,dt);if(n.k==='hangman'&&!hasRoom(wb,'torture')){n.wb=0;return idle(r,n,dt);}
 if(n.k==='priest'&&r.omen>0&&omenPriestCycle(r,n,dt))return;
 const old=r.b.find(b=>b.id===n.insideId&&b.id!==wb.id);if(old&&!exitBuilding(n,old,dt))return;const B=BD[wb.t],F0=workPoint(r,wb,n),X=F0.x,Z=F0.z;
 if(n.k==='gravedigger'){const c=near(n,r.co,1e9);if(!c){if(dist(n,{x:X,z:Z})>1.5)mv(n,X,Z,2.8,dt);return}
  if(dist(n,c)>1.4){mv(n,c.x,c.z,3,dt);return}n.bt=(n.bt||0)+dt;if(n.bt%1.2<dt)n.cd=1;
  if(n.bt>=3){n.bt=0;r.co=r.co.filter(o=>o!==c);r.gr++;say(r,'⚰ Ein Toter wurde beerdigt');const C=chapOf(r);if(C&&!r.ce&&r.hr>=7&&r.hr<19){r.ce={k:'fun',t:45,c:C.id,at:fp(C,-BD[C.t].w/2-3.2,-1+(r.gr%4)*1.4),m:pickAdults(r,5)};say(r,'🕯 Beerdigung: Der Priester spricht Gebete, die Trauernden stehen am Grab',C)}}return}
 if(!['farmer','wood','hunter','mason'].includes(n.k))return cycle(r,n,wb,B,dt,X,Z);
 if(n.k==='wood')return woodCycle(r,n,wb,B,dt,X,Z);
 let t,act;
 if(n.k==='farmer'){const F=r.b.filter(b=>b.t==='field');t=near(n,F.filter(f=>f.st===3),1e9);act='h';if(!t&&r.inv.wheat>=1&&season(r)!==3){t=near(n,F.filter(f=>f.st===0),1e9);act='s'}}
 else if(n.k==='hunter'){if(n.cr==='carcass'){const bu=near(n,r.b.filter(b=>b.t==='butcher'),1e9),D=bu||wb,P=fp(D,0,BD[D.t].d/2+1.2);if(dist(n,P)>1.3){mv(n,P.x,P.z,2.2,dt);return}if(bu)r.inv.carcass=(r.inv.carcass||0)+1;else{r.inv.meat+=2;r.inv.hides+=1}n.cr=0;wb.msg=bu?'Wildkadaver zum Metzger gebracht':'Wild selbst zerlegt (kein Metzger)';return}
  const cc=near(n,r.lo.filter(o=>o.k==='carcass'),90);if(cc&&![...r.pl.values()].some(p=>dist(p,cc)<4)){if(dist(n,cc)>1.4){mv(n,cc.x,cc.z,2.8,dt);return}r.lo=r.lo.filter(o=>o!==cc);r.dl=true;n.cr='carcass';return}
  t=near(n,r.dr.filter(d=>!deerYoung(d)),100);act='d'}else if(n.k==='mason'){t=near(n,r.rk.filter(o=>!o.ex),100);act='m'}else{t=near(n,r.tr,80);act='c'}
 if(!t){if(dist(n,{x:X,z:Z})>2.5)mv(n,X,Z,2.5,dt);return}
 {const dd=dist(n,t),need=n.k==='hunter'?11:(act==='c'?2.2:2.5);if(dd>need){mv(n,t.x,t.z,2.8,dt);return}if(n.k==='hunter')n.ry=Math.atan2(t.x-n.x,t.z-n.z)}
 if(act==='d')n.aim=Math.max(0,Math.min(1,1-(n.wk||0)/1.6));
 n.wk=(n.wk||0)-dt;if(n.wk>0)return;n.wk=act==='d'?1.6:1.4;n.cd=NT[n.k].cd;
 if(act==='h'){r.inv.wheat+=6+2*r.tl.hoe;r.inv.straw=Math.min(stockCap(r),(r.inv.straw||0)+3);t.st=0;r.dirty=true}
 else if(act==='s'){r.inv.wheat--;t.st=1;t.tm=0;t.pg=0;r.dirty=true}
 else if(act==='d')shoot(r,n,t,1)
 else if(act==='m'){t.hp-=1+r.tl.pick;r.inv.stone+=1+r.tl.pick;if(t.hp<=0){t.ex=1;t.rg=0;r.inv.stone+=5;r.dt=true}}
 else{t.hp-=1+r.tl.axe;r.inv.wood+=1+r.tl.axe;if(t.hp<=0){r.tr=r.tr.filter(o=>o!==t);r.inv.wood+=4;r.dt=true}}}
// Wasserstellen zum Löschen: Brunnen und der Springbrunnen in der Mitte des Marktplatzes (Schöpfstelle am Beckenrand)
const waterPts=r=>r.b.filter(b=>b.t==='well').concat(r.b.filter(b=>b.t==='plaza').map(b=>({...fp(b,0,2.1),id:b.id,t:'plaza'})));
const FLAM=b=>!['wall','battle','tower','gate','portcullis','keep','cathedral','garrison','dungeon','torture','well','bridge','moat','chapel','quarry','ironmine','coppermine','plaza','field','cemetery'].includes(b.t);
function ignite(r,b,why){if(b.fire>0||!FLAM(b))return false;b.fire=100;b.sp=0;r.dirty=true;say(r,'🔥 '+(why||'Feuer!')+' '+BN[b.t]+' brennt!'+(r.wells>0?'':' – ohne Brunnen kann niemand löschen'),b);return true}
function events(r,dt,bm,stf){r.wells=waterPts(r).length;r.fires=r.b.filter(b=>b.fire>0);
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
 const sk=r.n.filter(n=>n.sk);for(const a of sk)for(const o of r.n)if(!o.sk&&!((o.imm|0)>r.dy)&&!SICK_IMMUNE.has(o.k)&&dist(a,o)<4&&Math.random()<.015*dt*(r.bl===r.dy?.3:1)){o.sk=Math.min(2,Math.max(1,a.sk|0));o.sickStage=0;say(r,'🤒 Ein weiterer Bewohner ist erkrankt')}
 r.et-=dt;if(r.ev.on&&r.ev.every>0&&r.et<=0){r.et=r.ev.every*rnd(.7,1.3);const kinds=['fire','sick','omen','rats','thieves','ambush'].filter(k=>r.ev[k]);if(kinds.length)trigger(r,kinds[Math.random()*kinds.length|0])}
 // Marktplatz-Saison / Events
 tourneyTick(r,dt);fairTick(r,dt);
 if(r.plazaEventT>0){r.plazaEventT-=dt;if(r.plazaEventT<=0){r.plazaEvent=0;r.plazaEventT=0}}
 else if(r.b.some(b=>b.t==='plaza')){
   const se=season(r); // 0 Frühling 1 Sommer 2 Herbst 3 Winter
   // Feste nur einmal im Jahr: Maibaum im Frühling, Jahrmarkt mit Gauklern im Sommer, Weihnachtsbaum im Winter
   const yr=Math.floor((r.dy||0)/(4*((r.ev&&r.ev.sl)||4))),F=r.fests||(r.fests={}),pl=r.b.find(b=>b.t==='plaza'),once=k=>F[k]!==yr;
   if(se===0&&once('maypole')&&r.hr>10&&r.hr<14&&Math.random()<.004){F.maypole=yr;r.plazaEvent='maypole';r.plazaEventT=120;say(r,'🌳 Maibaum auf dem Marktplatz – die Dorfbewohner tanzen!',pl)}
   else if(se===1&&once('circus')&&r.hr>9&&r.hr<16&&Math.random()<.004){F.circus=yr;r.plazaEvent='circus';r.plazaEventT=240;say(r,'🎪 Jahrmarkt! Gaukler und Zirkus besuchen den Marktplatz (einmal im Jahr)',pl)}
   else if(se===2&&once('tourney')&&r.hr>9&&r.hr<14&&Math.random()<.004){F.tourney=yr;startTourney(r,'Herbstturnier')}
   else if(se===3&&once('tree')&&r.hr>14&&r.hr<18&&Math.random()<.004){F.tree=yr;r.plazaEvent='tree';r.plazaEventT=160;say(r,'🎄 Weihnachtsbaum auf dem Marktplatz',pl)}
 }
}
function trigger(r,k){if(k==='fire'){const L=r.b.filter(FLAM);if(L.length)ignite(r,L[Math.random()*L.length|0],'Ein Funke!')}
 else if(k==='sick'){const L=r.n.filter(n=>!n.sk&&!SICK_IMMUNE.has(n.k)&&!((n.imm|0)>r.dy));if(!L.length)return;const c=Math.max(1,Math.floor(L.length*.25));for(let i=0;i<c&&L.length;i++){const n=L.splice(Math.random()*L.length|0,1)[0];n.sk=1+(Math.random()<Math.max(.15,(r.sup||0)/160)?1:0);n.sickStage=0}say(r,'🤒 Krankheit! '+c+' Bewohner sind erkrankt'+(r.b.some(b=>b.t==='apothecary')?'':' – eine Apotheke mit Heiler fehlt'))}
 else if(k==='rats'){const pool=['wheat','bread','cheese','sausage','smoked','apples'].filter(g=>r.inv[g]>0);if(!pool.length)return;const protectedStore=r.b.some(b=>b.t==='granary'||b.t==='storage');say(r,'🐀 Ratten im Vorratslager! '+(protectedStore?'Das Lagerhaus begrenzt den Schaden.':'Ein Teil der Nahrung wird verdorben.'));for(let i=0;i<Math.min(2,pool.length);i++){const g=pool[i],loss=Math.min(r.inv[g],(protectedStore?1:3)+Math.ceil((r.sup||0)/24));r.inv[g]-=loss}r.dirty=true}
 else if(k==='thieves'){const guard=r.n.filter(n=>SOLDIER.includes(n.k)).length+r.b.filter(b=>b.t==='watchpost'||b.t==='garrison').length,loss=Math.max(12,30-guard*3);r.gold=Math.max(0,r.gold-loss);say(r,'🕵️ Diebe in Schatzkammer und Lager! '+loss+' Gold fehlen.');}
 else if(k==='ambush'){const c=r.cv.find(c=>c.kind==='caravan'&&c.st!=='leave')||r.cv.find(c=>c.kind==='ship'&&c.st!=='leave');if(c){c.st='leave';c.t=0;const goods=['honey','cloth','potions','weapons','armor'].find(g=>r.inv[g]>0);if(goods)r.inv[goods]=Math.max(0,r.inv[goods]-1);say(r,'⚔ Handelsroute überfallen – '+c.from+' kehrt um und der Handel stockt.')}else{r.tt+=80;say(r,'⚔ Räuber bedrohen die Handelsroute – die nächsten Händler verspäten sich.')}} 
 else if(k==='omen'){const holy=r.b.some(b=>(b.t==='chapel'||b.t==='church'||b.t==='cathedral')&&!b.off),crowd=r.n.filter(n=>n.hp>0&&!n.sk&&!['priest','healer'].includes(n.k)&&(NT[n.k].job||n.k==='peasant'));
  if(!crowd.length)return;for(const n of crowd){n.om=1;n.omT=0}r.omen=Math.max(r.omen||0,120);r.omenRise=0;r.plazaEvent=0;r.plazaEventT=0;
  if(holy)say(r,'👻 Aberglaube: Böse Vorzeichen! Die Bewohner verstecken sich zuhause, Priester gehen von Haus zu Haus.');
  else say(r,'👻 Aberglaube: Böse Vorzeichen! Die Bewohner verstecken sich zuhause – ohne Priester eskaliert der Wahn.')}} 
function sickTick(r,n,dt,stf){if(n.hp<=0)return;if(SICK_IMMUNE.has(n.k)){n.sk=0;n.sickTime=0;n.sickStage=0;n.cu=0;return}if(!n.sk)return;n.sk=Math.max(1,Math.min(3,n.sk|0));n.sickTime=(n.sickTime||0)+dt;n.sickStage=(n.sickStage||0)+dt;
 if(n.sickStage>=110&&n.sk<3){n.sickStage=0;n.sk++;say(r,'🤢 Eine Krankheit verschlimmert sich zu '+diseaseName(n)+'em Verlauf')}
 if(n.sickTime>=sickLimit(n)){n.hp=0;n.work=0;n.cr=0;say(r,'⚰ Ein Bewohner ist an einer '+diseaseName(n)+'en Krankheit gestorben',n);return;}
 n.work=0;n.cr=0;n.aim=0;n.cd=0;n.vis=null;n.pr=0;n.el=0;const home=homeOf(r,n)||r.b.find(b=>b.t==='keep');if(!home)return;const old=r.b.find(b=>b.id===n.insideId&&b.id!==home.id);if(old&&!exitBuilding(n,old,dt))return;n.home=home;const slot=r.n.filter(o=>o.hid===home.id&&o.hp>0).findIndex(o=>o.id===n.id),target=fp(home,((Math.max(0,slot)%3)-1)*.85,-.5-Math.floor(Math.max(0,slot)/3)*.7);if(!enterBuilding(n,home,target,dt))return;
 const ap=near(n,(r.healers||[]).filter(h=>h.cap>0).map(h=>h.b),1e9),healer=ap&&(r.healers||[]).find(h=>h.b===ap&&h.cap>0),pr=(r.priests||[]).find(p=>p.cap>0);
 if(pr){pr.cap--;n.sickTime=Math.max(0,n.sickTime-dt*.22);if(n.sk===1&&Math.random()<.012*dt)n.sickStage=Math.max(0,n.sickStage-dt*2)}
 const doc=r.n.some(h=>h.k==='healer'&&h.hp>0&&h.visit&&h.visit===home.id);if(healer||doc){if(healer)healer.cap--;const med=r.inv.potions>0?'potion':(r.inv.herbs|0)>=1?'herbs':'care';n.cu=(n.cu||0)+dt*(pr?1.25:1)*(doc?2.5:1)*(med==='potion'?1:med==='herbs'?.6:.3);n.sickStage=Math.max(0,n.sickStage-dt*.5);
  if(n.cu>=10+n.sk*4){n.cu=0;n.sickStage=0;if(med==='potion')r.inv.potions--;else if(med==='herbs')r.inv.herbs--;
   if(n.sk>1){n.sk--;n.sickTime=Math.max(0,n.sickTime-90);say(r,'💊 Ein Bewohner wurde versorgt – der Zustand bessert sich')}
   else{n.sk=0;n.sickTime=0;n.imm=r.dy+6;n.hp=Math.min(NT[n.k].hp,n.hp+20);say(r,{potion:'💊 Ein Bewohner wurde mit Heiltrank geheilt',herbs:'🌿 Ein Bewohner wurde mit Kräutern geheilt',care:'🤲 Ein Bewohner wurde gesund gepflegt'}[med]+' (6 Tage immun)')}}}
 else n.cu=Math.max(0,(n.cu||0)-dt*.2);
 if(n.sk===1&&n.sickTime>240&&Math.random()<.004*dt){n.sk=0;n.sickTime=0;n.sickStage=0;n.cu=0;n.imm=r.dy+6;say(r,'🙂 Ein Bewohner hat eine leichte Krankheit überstanden (6 Tage immun)')}}
function spawnCamp(r){if(!hasEnemy(r))return;const en=enemyTown(r);for(let i=0;i<10;i++){const x=en.x+rnd(-7,7),z=en.z+rnd(-7,7);r.e.push({id:uid++,x,z,hp:80,cd:0,ry:0,camp:1,hx:x,hz:z})}r.campOn=true}
function campTick(r,dt){if(!hasEnemy(r))return;const en=enemyTown(r);
 if(r.cq>0){r.cq-=dt;if(r.cq<=0){say(r,'⚔ '+en.n+' hat sich neu formiert');r.cr=3}return}
 const alive=r.e.some(e=>e.camp);
 if(!alive&&!r.campOn){r.cr-=dt;if(r.cr<=0)spawnCamp(r);return}
 if(!alive&&r.campOn&&r.n.some(n=>n.m==='attack'&&Math.hypot(n.x-en.x,n.z-en.z)<18)){r.campOn=false;r.cq=600;r.gold+=300;r.fame+=5;r.inv.iron+=20;r.inv.copper+=10;r.inv.weapons+=3;
  say(r,'🏴 '+en.n+' wurde erobert! Beute: 300 Gold, Eisen, Golderz, Waffen. Überfälle ruhen 10 Minuten.');for(const n of r.n)if(n.m==='attack'){n.m='follow'}}
 else if(!alive&&r.campOn){r.campOn=false;r.cr=30}}
function tradeTick(r,dt){for(const c of r.cv){c.t-=dt;
  if(c.kind==='caravan'){const m=r.b.find(b=>b.t==='market');if(c.st==='go'){if(!m){c.st='leave'}else if(mv(c,m.x,m.z+BD.market.d/2+3.5,3.6,dt)<2){c.st='wait';c.t=75;say(r,'🛒 Handelskarawane aus '+c.from+' ist am Marktstand eingetroffen (75 s, bessere Preise)');ecoArrive(r,c.from)}}
   else if(c.st==='wait'&&c.t<=0)c.st='leave';else if(c.st==='leave'){const T0=townsOf(r).find(t=>t.n===c.from)||friendTowns(r)[0];if(!T0||mv(c,T0.x,T0.z,3.6,dt)<4)c.gone=1}}
  else{const h=r.b.find(b=>b.t==='harbor');if(c.st==='go'){if(!h){c.st='leave'}else{c.z-=6*dt;c.x=riverAt(r,c.z);c.ry=Math.atan2(riverAt(r,c.z-1)-riverAt(r,c.z),-1);if(c.z<=h.z){c.st='wait';c.t=80;{const rx=riverAt(r,h.z),side=Math.sign(h.x-rx)||1;c.x=rx+side*Math.min(4.2,Math.abs(h.x-rx));c.ry=Math.PI}say(r,'⚓ Ein Handelsschiff aus '+c.from+' hat im Hafen angelegt (80 s, beste Preise)');ecoArrive(r,c.from)}}}
  else if(c.st==='wait'&&c.t<=0)c.st='leave';else if(c.st==='leave'){c.z+=6*dt;c.x=riverAt(r,c.z);c.ry=Math.atan2(riverAt(r,c.z+1)-riverAt(r,c.z),1);if(c.z>WH(r))c.gone=1}}}
 r.cv=r.cv.filter(c=>!c.gone);r.tt-=dt;
 if(r.tt<=0){r.tt=rnd(170,260);spawnTrade(r)}}
function spawnTrade(r,force){const fr=friendTowns(r);if(!fr.length)return;const f=fr[Math.random()*fr.length|0],h=r.b.find(b=>b.t==='harbor'),m=r.b.find(b=>b.t==='market');
 if(h&&shipRiver(r)&&(!m||Math.random()<.5||force==='ship')){r.cv.push({id:uid++,kind:'ship',x:riverAt(r,WH(r)-20),z:WH(r)-20,ry:0,st:'go',t:0,from:f.n});say(r,'⚓ Ein Handelsschiff aus '+f.n+' nähert sich dem Hafen')}
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
 churchTick(r,dt);if(r.banq){r.banq.t-=dt;if(r.banq.t<=0){r.banq=null;r.dirty=true;say(r,'🍖 Das Bankett ist zu Ende – die Gäste gehen satt und zufrieden nach Hause')}}if(r.pray>0){r.pray-=dt;if(r.pray<=0){r.bl=r.dy;say(r,'🙏 Der Priester spendet den Segen – die Bewohner fühlen sich gestärkt')}}
 r.mk=(r.mk===undefined?rnd(25,50):r.mk)-dt;if(r.mk<=0){r.mk=rnd(100,260);const mkb=r.b.find(b=>b.t==='market'),plaza=r.b.find(b=>b.t==='plaza');if((mkb||plaza)&&r.hr>=7&&r.hr<18){const L=r.n.filter(n=>!n.sk&&!n.vis&&(NT[n.k].job||n.k==='peasant')),count=plaza&&r.plazaEvent?6:3;for(let i=0;i<count&&L.length;i++)L.splice(Math.random()*L.length|0,1)[0].vis={t:plaza&&r.plazaEvent?50:35,kind:plaza&&r.plazaEvent?'plaza':'market'}}}events(r,dt,bm,stf);tradeTick(r,dt);campTick(r,dt);
 for(const b of r.b){const B=BD[b.t];
  if(b.t==='tavern'&&stf[b.id]){b.pt=(b.pt||0)+dt;if(b.pt>=40){b.pt=0;const f=['bread','cheese','meat','fish','roast','sausage','smoked'].find(k=>r.inv[k]>=1);if(f)r.inv[f]--;r.beer=r.inv.beer>=1;if(r.beer)r.inv.beer--}}
  if(b.t==='apothecary'&&stf[b.id]){for(const p of r.pl.values())if(dist(b,p)<14)p.hp=Math.min(100,p.hp+3*dt);for(const n of r.n)if(dist(b,n)<14)n.hp=Math.min(NT[n.k].hp,n.hp+3*dt)}}
 const cap=stockCap(r);for(const k of STOCK)if(r.inv[k]>cap)r.inv[k]=cap;
 for(const c of r.co)c.t+=dt;corpsePlague(r,dt);
 // Beliebtheit wie in Stronghold: jeder Faktor einzeln (fürs Stadtbuch), Wert pendelt langsam auf das Ziel
 const HF=[['Grundstimmung',40]],hf=(l,v)=>{if(v)HF.push([l,Math.round(v)])};let tv=0,rel=0;for(const b of r.b){if(b.t==='tavern'&&stf[b.id]&&food(r)>=1)tv=Math.max(tv,25+(r.beer?10:0));if(stf[b.id])rel=Math.max(rel,{chapel:20,church:25,cathedral:30}[b.t]||0)}
 hf('Taverne',tv);hf('Glaube (Kirche mit Priester)',rel);hf('Brunnen',Math.min(8,2*r.b.filter(b=>b.t==='well').length));hf('Marktplatz',r.b.some(b=>b.t==='plaza')?5:0);hf('Segen nach dem Gebet',r.bl===r.dy?8:0);hf('Bankett im Bergfried',r.bqd!=null&&r.dy-r.bqd<=1?18:0);{const F=r.fests||{};hf('Ritterturnier',F.tnyH!=null&&r.dy-F.tnyH<=1?15:0);hf('Jahrmarkt',r.plazaEvent==='circus'||(F.fairH!=null&&r.dy-F.fairH<=1)?10:0)}
 hf('Kranke',-Math.min(15,3*r.n.filter(n=>n.sk).length));hf('Böse Omen ohne Kirche',r.omen>0&&!r.holy?-15:0);hf('Unbestattete Tote',-Math.min(25,5*r.co.filter(c=>c.t>30).length));
 hf('Nahrungsvorrat knapp',food(r)<4?-20:0);hf('Fehlende Rationen',-Math.min(20,(r.foodShortage||0)*2));hf('Fehlendes Heizholz',-Math.min(15,(r.heatShortage||0)*3));hf('Ansehen',Math.min(10,r.fame*.5));
 hf('Steuern ('+['niedrig','mittel','hoch'][r.tax??1]+')',[12,0,-18][r.tax??1]);hf('Rationen ('+['großzügig','normal','hungern'][r.ration??1]+')',[15,0,-20][r.ration??1]);
 const target=Math.max(0,Math.min(100,HF.reduce((a,[,v])=>a+v,0)));r.hapF=HF;r.hapT=target;r.hap=r.hap===undefined?target:r.hap+(target-r.hap)*Math.min(1,dt*.05);
 r.sup=Math.max(0,Math.min(100,(r.sup||0)+((r.n.filter(n=>n.sk).length*1.8+r.co.length*3+(food(r)<4?3:0)+((!r.holy&&r.hap<45)?2.5:0))-1.3)*dt*.1));if(r.holy)r.sup=Math.max(0,r.sup-dt*.35);
 // Zuzug, Hochzeit, Geburt
 const kp0=r.b.find(b=>b.t==='keep');r.aa=(r.aa||0)-dt;if(r.aa<=0){r.aa=3;autoAssign(r)}
 r.pt-=dt;if(kp0&&r.pt<=0){r.pt=18;const pop=r.n.filter(n=>n.k!=='watch').length;r.immWhy=r.noImm?'Zuzug gesperrt (Bergfried)':pop>=popCap(r)?'Kein Wohnraum – Wohnhäuser bauen oder ausbauen':food(r)<4?'Zu wenig Nahrung im Lager':r.hap<30?'Beliebtheit unter 30 %':'';if(!r.immWhy){mkNpc(r,'peasant',kp0.x+rnd(-3,3),kp0.z-55);say(r,'🏠 Ein neuer Dorfbewohner ist angekommen ('+(pop+1)+'/'+popCap(r)+')')}}
 if(chap&&r.n.length<popCap(r)&&r.hap>=40&&food(r)>=6){r.bt-=dt;if(r.bt<=0){r.bt=70;r.bw=70;const C=chapOf(r);if(C&&!r.ce&&r.hr>=8&&r.hr<17){const cp=pickAdults(r,2);if(cp.length===2){r.ce={k:'wed',t:50,c:C.id,a:cp[0],b:cp[1],g:pickAdults(r,8,cp)};say(r,'💒 Hochzeit in der '+(C.t==='chapel'?'Kapelle':C.t==='church'?'Kirche':'Kathedrale')+' – das Brautpaar tritt vor den Altar',C)}}else say(r,'💒 In der Kapelle wurde eine Hochzeit gefeiert')}}
 if(r.bw>0){r.bw-=dt;if(r.bw<=0&&chap&&!r.noImm){const kid=mkNpc(r,'child',chap.x,chap.z+5);kid.born=r.dy|0;say(r,'👶 Ein Kind wurde geboren – in einem Jahr ist es erwachsen');const C=chapOf(r);if(C&&!r.ce){const pa=pickAdults(r,2);r.ce={k:'bap',t:40,c:C.id,a:pa[0],b:pa[1],kid:kid.id,g:pickAdults(r,6,pa)};say(r,'💧 Taufe am Taufbecken',C)}}}
 for(const a of r.ar){a.t-=dt;if(a.t<=0){if(a.tg.hp>0)a.tg.hp-=a.dmg;a.done=1}}r.ar=r.ar.filter(a=>!a.done);
 const dk=r.dr.filter(d=>d.hp<=0);if(dk.length){for(const d of dk)deerFall(r,d);r.dr=r.dr.filter(d=>d.hp>0)}
 const h0=r.hr;r.hr=(r.hr+(r.ev&&r.ev.cyc===0?0:dt*(24/1440)))%24;if(r.hr<h0)r.dy++;if(r.surv&&r.anDay!==r.dy){if(r.anDay!==undefined)animalDay(r);r.anDay=r.dy}
 // Wetter: saisonabhängige Intervalle (weniger hektisch, Winter länger Schnee)
r.wt-=dt;if(r.wt<=0){
  const se=season(r);
  const dryMin=[120,180,90,100][se],dryMax=[280,360,200,220][se];
  const wetMin=[40,25,70,90][se],wetMax=[110,70,160,200][se];
  const pWet=[.28,.12,.42,.55][se];
  if(r.wx){r.wx=0;r.wt=rnd(dryMin,dryMax)}
  else{r.wx=Math.random()<pWet?1:0;r.wt=r.wx?rnd(wetMin,wetMax):rnd(dryMin,dryMax)}
}
 const ps=[...r.pl.values()];
 if(ps.length&&ps.every(p=>p.sl)){const skip=((6-r.hr)+24)%24;if(r.hr>=19)r.dy++;r.hr=6;const sec=skip*60;
  fieldGrow(r,sec);regrow(r,sec);
  for(const p of ps){p.sl=false;p.food=Math.max(15,p.food-(r.creative?0:skip*.5));p.hp=100}say(r,'☀ Guten Morgen! Ein neuer Tag beginnt')}
 for(let day=dayBefore+1;day<=r.dy;day++)villageDay(r,day);
 const night=r.hr>=20||r.hr<5;
 if(!night)r.w=[];else if(r.pl.size&&r.w.length<3+2*r.pl.size&&Math.random()<dt*.2){const P=[...r.pl.values()],q=P[Math.random()*P.length|0],a=rnd(0,6.28),d=rnd(30,42);r.w.push({id:uid++,x:q.x+Math.cos(a)*d,z:q.z+Math.sin(a)*d,hp:40,cd:0,ry:0})}
 const fires=r.b.filter(b=>b.t==='fire'),safe=o=>o.torch||o.insideId||fires.some(f=>dist(f,o)<8),ground=r.n.filter(n=>!n.el);
 // Wölfe: nachts um jeden, der draußen ist (Spieler und Bewohner außerhalb der Häuser); bei geschlossener Stadtmauer bleiben sie draußen
 if(night&&r.w.length<3+2*r.pl.size&&Math.random()<dt*.08){const out=r.n.filter(n=>n.hp>0&&!n.insideId&&!n.el&&!n.torch);if(out.length){const q=out[Math.random()*out.length|0],a=rnd(0,6.28),d=rnd(28,40);r.w.push({id:uid++,x:q.x+Math.cos(a)*d,z:q.z+Math.sin(a)*d,hp:40,cd:0,ry:0})}}
 {const WR=wallRing(r),closed=WR&&r.b.some(b=>(b.t==='gate'||b.t==='portcullis'))&&r.b.filter(b=>b.t==='gate'||b.t==='portcullis').every(b=>b.st);if(WR&&closed)for(const w of r.w){const d=dist(w,WR.C);if(d<WR.R+1.5){const k=(WR.R+1.5)/(d||1);w.x=WR.C.x+(w.x-WR.C.x)*k;w.z=WR.C.z+(w.z-WR.C.z)*k}}}
 for(const w of r.w){w.cd-=dt;const t=near(w,[...r.pl.values(),...ground].filter(o=>!safe(o)),22);if(!t)continue;if(dist(w,t)>1.6)mv(w,t.x,t.z,4.2,dt);else if(w.cd<=0){t.hp-=6;w.cd=1}}
 for(const d of r.dr)if(!d.w||mv(d,d.w.x,d.w.z,1.5,dt)<1)d.w={x:d.x+rnd(-15,15),z:d.z+rnd(-15,15)};
 r.deerTimer=(r.deerTimer||0)+dt;if(r.deerTimer>=60){r.deerTimer=0;if(r.dr.length<Math.min(120,14*SC(r)*SC(r))){for(let attempt=0;attempt<30;attempt++){const d=newDeer(r);if(!r.b.some(b=>dist(d,b)<reach(b)+4)&&![...r.pl.values()].some(p=>dist(d,p)<18)){r.dr.push(d);break}}}}
 deerTick(r,dt);for(const d of r.dr){if(d.hp<deerMax(d)&&![...r.pl.values(),...r.n.filter(n=>n.k==='hunter')].some(p=>dist(p,d)<18)){d.rest=(d.rest||0)+dt;if(d.rest>=30){d.hp=deerMax(d);d.rest=0}}else d.rest=0;d.x=Math.max(-DEER_LIMIT_(r),Math.min(DEER_LIMIT_(r),d.x));d.z=Math.max(-DEER_LIMIT_(r),Math.min(DEER_LIMIT_(r),d.z));if(inRiver(r,d.x,d.z,3)){d.w=null;const rx=d.x;d.x=rx+(Math.random()<.5?-10:10)}}
 fieldGrow(r,dt);regrow(r,dt);looseTick(r,dt);cartTick(r,dt);ecoTick(r,dt);herbTick(r,dt);watchSpawn(r);
 if(kp0&&r.set.interval>0&&r.set.max>0){r.rt=(r.rt===undefined?240:r.rt)-dt;if(r.rt<=0&&Math.random()<dt/r.set.interval*(1-(r.det||0))){raid(r);r.rt=90}}
 for(const p of r.pl.values()){p.food=Math.max(0,p.food-(r.creative?0:dt/24)*(season(r)===3?1.3:1));if(p.sl&&!(r.hr>=19||r.hr<5))p.sl=false;playerSick(r,p,dt);p.hp=p.food>0?(p.sk?p.hp-dt*(p.sk===2?.12:0):Math.min(100,p.hp+dt)):p.hp-dt*2;if(p.hp<=0){p.hp=100;p.food=100;p.sk=0;p.bd=1;const sp=spawnOf(r);p.x=sp.x;p.z=sp.z;p.ws.send(JSON.stringify({t:'rs'}));say(r,p.name+' wurde niedergestreckt',p)}}
 for(const n of r.n){const T=NT[n.k];n.cd-=dt;n.aim=0;n.work=0;if(!T.job)n.cr=0;
  n.pr=0;n.ps=0;if(n.sk){sickTick(r,n,dt,stf);continue}
  if(banquetRole(r,n,dt))continue;
  if(lifeTick(r,n,dt))continue;
  if(ceRole(r,n,dt))continue;
  if(n.k==='child'){play(r,n,dt);continue}
  if(n.k==='watch'){watchTick(r,n,dt);continue}
  if(r.pray>0&&chap&&(T.job||n.k==='peasant')){const C=chapOf(r)||chap,I=Rules.interior(C.t),rr=(C.r||0)*Math.PI/2;
   if(n.k==='priest'&&n.wb===C.id){if(enterBuilding(n,C,{...fp(C,I.altar[0],I.altar[1]+1.2),ry:rr},dt))n.ps=13;continue}
   const att=r.n.filter(o=>(NT[o.k].job||o.k==='peasant')&&!o.sk&&o.hp>0&&!(o.k==='priest'&&o.wb===C.id)).sort((a,b)=>a.id-b.id),si=att.indexOf(n);
   if(n.insideId&&n.insideId!==C.id){const old=r.b.find(b=>b.id===n.insideId);if(old&&!exitBuilding(n,old,dt))continue}
   if(si<I.seats.length){const S=I.seats[si];if(enterBuilding(n,C,{...fp(C,S[0],S[1]),ry:S[2]+rr},dt))n.ps=12;continue}
   const k=si-I.seats.length,P=fp(C,((k%6)-2.5)*.95,BD[C.t].d/2+2.2+Math.floor(k/6)*.95);if(dist(n,P)>.15)mv(n,P.x,P.z,3,dt);else{n.ry=Math.PI+rr;n.pr=1}continue}
  if(n.vis&&(T.job||n.k==='peasant')){const plaza=n.vis.kind==='plaza'&&r.plazaEvent?r.b.find(b=>b.t==='plaza'):null,mk=r.b.find(b=>b.t==='market'),spot=plaza||mk;if(!spot||r.hr<7||r.hr>18)n.vis=null;else{const Q=plaza&&plazaSpot(r,n),P=Q?fp(spot,Q.lx,Q.lz):plaza?fp(spot,Math.sin(n.i*2.1)*3.4,Math.cos(n.i*1.7)*3.2):fp(spot,((n.i*7)%5)-2,BD.market.d/2+1.5+(n.i%2));if(dist(n,P)>1.2)mv(n,P.x,P.z,2.6,dt);else{if(Q){const F2=fp(spot,Q.fx,Q.fz);n.ry=Math.atan2(F2.x-n.x,F2.z-n.z)}else n.ry=plaza?((r.tk+n.id)%2?Math.PI*.5:-Math.PI*.5):Math.PI;n.pr=plaza&&r.plazaEvent==='maypole'?1:0;n.vis.t-=dt;if(n.vis.t<=0){n.vis=null;r.gold+=plaza?1:3}}continue}}
  if((T.job||n.k==='peasant')&&r.fires.length&&r.wells>0&&!n.tr){
    // Eimerkette: zum Brunnen → Wasser holen → zum Brand → löschen → wiederholen
    const fb=near(n,r.fires,90),wells=waterPts(r);
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
  if(SOLDIER.includes(n.k))n.torch=0;
  const patrolCharge=(n.m==='patrol'&&SOLDIER.includes(n.k));
  const rngE=T.rng+(n.el?8:0)+(patrolCharge?28:0),e=near(n,[...r.e,...r.w],rngE+(RANGED.includes(n.k)?0:10)+(patrolCharge?40:0));
  if(e){if(dist(n,e)>T.rng+(n.el?8:0)){if(!n.el)mv(n,e.x,e.z,T.spd*(patrolCharge?1.25:1),dt)}else{n.ry=Math.atan2(e.x-n.x,e.z-n.z);if(RANGED.includes(n.k))n.aim=Math.max(0,Math.min(1,1-n.cd/(T.cd-.25)));if(n.cd<=0){if(RANGED.includes(n.k))shoot(r,n,e,T.dmg);else e.hp-=T.dmg;n.cd=T.cd}}continue}
  if(n.m==='attack'){if(!hasEnemy(r)){n.m='guard'}else{const en=enemyTown(r);mv(n,en.x,en.z+8,T.spd,dt);continue}}
  if(n.m==='post'){const b=bm.get(n.pb);if(!b||!BD[b.t].post){n.m='guard';n.el=0;n.p={x:n.x,z:n.z}}else{const pos=fp(b,b.t==='keep'&&(b.st|0)===0?4.1+((n.sl||1)%2?-.6:.6):((n.sl||1)%2?-.8:.8),b.t==='keep'&&(b.st|0)===0?-2.7:((n.sl||1)>2?.8:0)),px=pos.x;if(n.el){n.x=px;n.z=pos.z}else{const X=b.x,Z=b.z+BD[b.t].d/2+1.5;if(dist(n,{x:X,z:Z})>1.5)mv(n,X,Z,T.spd,dt);else{n.x=px;n.z=pos.z;n.el=postY(b)+Rules.base(b.t,b.x,b.z,b.r,BD,r.map)-Rules.height(n.x,n.z,r.map)}}}continue}
  const o=r.pl.get(n.o);
  if(n.m==='follow'&&!o){n.m='guard';n.p={x:n.x,z:n.z}}
  if(n.m==='follow'){const X=o.x+Math.cos(n.i)*3,Z=o.z+Math.sin(n.i)*3;if(Math.hypot(X-n.x,Z-n.z)>1.2)mv(n,X,Z,T.spd*1.3,dt)}
  else if(n.m==='guard'&&(r.hr>=20||r.hr<6)&&wallRing(r)){const W=wallRing(r).pts;if(n.npw===undefined){let bi=0,bd=1e9;W.forEach((q,i)=>{const d=dist(n,q);if(d<bd){bd=d;bi=i}});n.npw=bi}const q=W[n.npw%W.length];n.torch=1;if(mv(n,q.x,q.z,T.spd*.5,dt)<.8)n.npw=(n.npw+(n.id%2?1:W.length-1))%W.length}
  else if(n.m==='guard'){n.npw=undefined;if(dist(n,n.p)>.8)mv(n,n.p.x,n.p.z,T.spd,dt)}
  else if(mv(n,n.w.x,n.w.z,T.spd*.7,dt)<1){if(n.a.town){const kp=r.b.find(b=>b.t==='keep')||{x:0,z:0},L=r.b.filter(b=>!['field','moat','bridge','bed','fire','hopfield'].includes(b.t)&&Math.hypot(b.x-kp.x,b.z-kp.z)<200);const b=L[Math.random()*L.length|0]||kp;n.w={x:b.x+rnd(-4,4),z:b.z+BD[b.t||'house'].d/2+2+rnd(0,3)}}else{const a=rnd(0,6.28),d=rnd(0,n.a.r);n.w={x:n.a.x+Math.cos(a)*d,z:n.a.z+Math.sin(a)*d}}}}
 const moats=r.b.filter(b=>b.t==='moat');const alert=r.e.some(e=>!e.camp),ngt=r.hr>=20||r.hr<6,gates=r.b.filter(b=>b.t==='gate'||b.t==='portcullis');
 if(r.gNight!==ngt){r.gNight=ngt;for(const b of gates)delete b.man;if(gates.length)say(r,ngt?'🌙 Die Stadttore werden für die Nacht geschlossen – nur Soldaten passieren':'🌅 Die Stadttore werden geöffnet')}
 for(const b of gates){let w=(b.man===undefined?(alert||ngt):!!b.man)?1:0;if(w&&!alert&&r.n.some(n=>SOLDIER.includes(n.k)&&n.hp>0&&!n.el&&dist(n,b)<6))w=0;if((b.st|0)!==w){b.st=w;r.dirty=true}}
 for(const e of r.e){e.cd-=dt;
  if(e.camp){const t=near(e,[...ground,...r.pl.values()],16);if(t&&dist(e,{x:e.hx,z:e.hz})<26){if(dist(e,t)>1.8)mv(e,t.x,t.z,2.8,dt);else if(e.cd<=0){t.hp-=8;e.cd=1}}else if(dist(e,{x:e.hx,z:e.hz})>1.5)mv(e,e.hx,e.hz,2.4,dt);continue}const t=near(e,[...ground,...r.pl.values()],8)||near(e,r.b.filter(b=>b.t!=='moat'&&b.t!=='bridge'),1e9);if(!t)continue;
  if(dist(e,t)>(t.t?reach(t):1.8))mv(e,t.x,t.z,2.6*(moats.some(m=>Math.abs(e.x-m.x)<2.4&&Math.abs(e.z-m.z)<2.4)?.4:1),dt);else if(e.cd<=0){t.hp-=t.t?2.5:8;e.cd=t.t?1.4:1;if(t.t)r.under=true}}
 const kw=r.w.length;r.w=r.w.filter(w=>w.hp>0);r.inv.meat+=kw-r.w.length;
 for(const e of r.e)if(e.hp<=0){const dcap=4*r.b.filter(b=>hasRoom(b,'dungeon')).length;if(dcap&&r.pr<dcap&&Math.random()<.4){r.pr++;say(r,'⛓ Ein Bandit wurde gefangen genommen ('+r.pr+')')}else r.gold+=10}
 r.e=r.e.filter(e=>e.hp>0);
 // Leichen mit Abstand vor dem Haus ablegen (kein Stapeln)
for(const n of r.n){if(n.hp<=0&&!n.conv){
  let cx=n.x,cz=n.z;
  const home=n.home||r.b.find(b=>b.id===n.hid)||r.b.find(b=>b.id===n.insideId);
  if(home){
    const door=fp(home,0,BD[home.t].d/2+1.4);
    cx=door.x;cz=door.z;
    // freien Platz suchen: Raster vor der Tür, mind. 1.4 m Abstand zu anderen Leichen
    const ang=(home.r||0)*Math.PI/2,fx=Math.sin(ang),fz=Math.cos(ang),sx=Math.cos(ang),sz=-Math.sin(ang);
    let placed=false;
    for(let row=0;row<4&&!placed;row++)for(let col=-3;col<=3&&!placed;col++){
      const tx=door.x+fx*(row*1.5)+sx*(col*1.35);
      const tz=door.z+fz*(row*1.5)+sz*(col*1.35);
      if(inRiver(r,tx,tz,4))continue;
      if(r.co.some(c=>Math.hypot(c.x-tx,c.z-tz)<1.35))continue;
      if(r.b.some(b=>{const[lx,lz]=Rules.local(b,tx,tz);return Math.abs(lx)<BD[b.t].w/2+.3&&Math.abs(lz)<BD[b.t].d/2+.3}))continue;
      cx=tx;cz=tz;placed=true;
    }
  }
  r.co.push({id:uid++,x:r2(cx),z:r2(cz),t:0});
  if(n.sk||n.sickTime)say(r,'💀 Ein Kranker ist gestorben – der Leichnam liegt vor dem Haus (Totengräber nötig)',{x:cx,z:cz});
}}
r.n=r.n.filter(n=>n.hp>0);for(const c of r.co)c.t=(c.t||0)+dt;
// Bestehende Leichen-Stapel auseinanderdrücken
for(let i=0;i<r.co.length;i++)for(let j=i+1;j<r.co.length;j++){
  const a=r.co[i],b=r.co[j],dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz)||1e-6;
  if(d<1.35){const push=(1.35-d)/2,nx=dx/d,nz=dz/d;a.x-=nx*push;a.z-=nz*push;b.x+=nx*push;b.z+=nz*push}
}
 for(const b of r.b)if(b.hp<=0&&BD[b.t].hp>=150){r.ru.push({id:b.id,t:b.t,x:b.x,z:b.z,r:b.r,st:b.st|0,lv:b.lv||0,ext:b.ext||0,pendingTorture:!!b.pendingTorture});say(r,'💥 '+BN[b.t]+' wurde zerstört – mit dem Hammer reparieren',b)}
 for(const b of r.b)if(b.hp<=0)b.fire=0;const nb=r.b.length;r.b=r.b.filter(b=>b.hp>0);if(nb!==r.b.length)r.dirty=true;
 r.hpt=(r.hpt||0)-dt;if(r.under&&r.hpt<=0){r.dirty=true;r.under=false;r.hpt=1.5}
 for(const n of r.n)if(n.insideId){const b=r.b.find(b=>b.id===n.insideId);if(b&&WORKSPOTS[b.t]||b&&['house','bighouse'].includes(b.t)){const [x,z]=Rules.local(b,n.x,n.z);n.el=Math.abs(x)<BD[b.t].w/2&&Math.abs(z)<BD[b.t].d/2?Math.max(0,Rules.base(b.t,b.x,b.z,b.r,CAT,r.map)+.1-Rules.height(n.x,n.z,r.map))+(n.fl||0):0;}else n.fl=0}
 const actors=[...r.pl.values(),...r.n.filter(n=>n.hp>0&&!n.ps&&!n.pr&&!n.slp),...r.e.filter(n=>n.hp>0),...r.dr,...r.w];const before=new Map([...r.pl.values()].map(p=>[p.id,[p.x,p.z]]));for(const actor of actors)actor.radius=actor.mt?.75:(r.dr.includes(actor)||r.w.includes(actor))?.6:.42;Rules.separate(actors);for(const p of r.pl.values()){const q=before.get(p.id);p.push=[r2(p.x-q[0]),r2(p.z-q[1])]}
 const m={t:'s',creative:!!r.creative,p:[...r.pl.values()].map(p=>[p.id,p.x,p.z,p.ry,p.name,Math.round(p.hp),Math.min(Date.now()-p.lt,Date.now()-(p.sw||0))<350?1:0,p.mt?1:0,Math.round(p.food),p.torch?1:0,p.sl?1:0,p.tool||'sword',p.ch,p.push,p.el||0,p.fc||0,p.tool==='sword'&&p.sh&&p.shields[p.sh]?p.sh:'',p.coa|0]),
  n:r.n.map(n=>[n.id,n.k,r2(n.x),r2(n.z),r2(n.ry),n.m,n.o,n.cd>NT[n.k].cd-.4?1:0,r2(n.aim||0),r2(n.el||0),n.sk||0,n.work||0,n.cr||0,n.wb||0,n.pr?1:0,n.pd?1:0,n.ps||0,n.k==='priest'&&n.id===bishopId(r,n.wb)?1:0,n.torch&&SOLDIER.includes(n.k)?1:0]),
  e:r.e.map(e=>[e.id,r2(e.x),r2(e.z),r2(e.ry),e.cd>.6?1:0]),g:r.gold,i:r.inv,h:r.hr,tl:r.tl,ar:r.an,pp:[r.n.filter(n=>n.k!=='watch').length,popCap(r),r.n.filter(n=>n.k==='peasant'&&!n.tr&&!n.sk).length],se:season(r),dy:r.dy,wx:r.wx,
  w:r.w.map(w=>[w.id,r2(w.x),r2(w.z),r2(w.ry||0)]),d:r.dr.map(d=>[d.id,r2(d.x),r2(d.z),r2(d.ry||0),deerYoung(d)?r2(.55+.45*d.ag/DEER_GROW):1]),co:r.co.map(c=>[c.id,r2(c.x),r2(c.z)]),s:r.set,x:Math.round(r.next),
  evs:r.ev,cq:r.cq>0?1:0,omen:r.omen>0?1:0,sup:Math.round(r.sup||0),tp:r.cv.some(c=>c.st==='wait')?1:0,cv:r.cv.map(c=>[c.id,c.kind,r2(c.x),r2(c.z),r2(c.ry),c.st==='wait'?1:0,c.from]),det:Math.round((r.det||0)*100),pry:r.pray>0?1:0,pr:r.pr,fame:r.fame,tny:r.tny?{k:r.tny.k.map(q=>[q.n,q.c,q.od,q.pl?1:0,q.a]),ph:r.tny.ph,t:Math.round(r.tny.t),pr:r.tny.pairs[Math.min(r.tny.m,r.tny.pairs.length-1)],p:r.tny.pass,pt:+r.tny.pt.toFixed(2),o:r.tny.o,sc:r.tny.sc,ch:r.tny.ch,b:r.tny.bets}:0,fair:r.plazaEvent==='circus'?r.fairG|0:-1,sl:(r.ev&&r.ev.sl)||4,cyc:r.ev&&r.ev.cyc===0?0:1,bq:r.banq?1:0,hap:Math.round(r.hap),cap,gr:r.gr,tax:r.tax??1,ration:r.ration??1,imm:r.noImm?0:1,surv:r.surv?1:0,sickHouses:r.b.filter(b=>(b.t==='house'||b.t==='bighouse')&&r.n.some(n=>n.sk&&n.hp>0&&(n.hid===b.id||n.home===b||n.insideId===b.id))).map(b=>b.id),plazaEv:r.plazaEvent||0,plazaT:r.plazaEventT||0};
 if(r.tk%10===1){m.act=r.b.filter(b=>b.act&&r.tk-b.act<25).map(b=>b.id);m.lg={};for(const b of r.b)if(b.lg)m.lg[b.id]=b.lg}
 if(r.tk%10===1){m.hapF=r.hapF||[];m.hapT=Math.round(r.hapT||0);m.imm2=r.immWhy||'';m.tax2=r.lastTax||0;m.food2=Math.round(food(r))}
 if(r.tk%20===1||r.decoT){r.decoT=false;m.eco=friendTowns(r).map(t=>{const e=ecoAt(r,t.n)||{st:{},pop:0,sp:0};return[t.n,e.pop,Math.round((e.sick||0)*100),e.omen?1:0,Math.round(e.st.food||0),SPEC[e.sp][0],Math.round(e.mood||0)]})}
 if(r.tk%20===1){m.bs={};for(const b of r.b)if(b.msg)m.bs[b.id]=b.msg;m.px={};for(const k in BASEP)m.px[k]=Math.round(priceOf(r,k))}
 if(r.pathDirty){m.paths=r.paths||[];r.pathDirty=false}
 if(r.dirty){m.b=r.b.map(b=>[b.id,b.t,b.x,b.z,b.r,b.st|0,Math.round(100*b.hp/mh(b)),b.fire>0?1:0,b.off?1:0,b.lv||0,b.ext||0,b.manual?1:0,b.v|0,r.surv&&ANIMAL[b.t]?(b.an|0):-1,r.surv&&ANIMAL[b.t]?Math.round(b.feed||0):-1,b.col|0]);m.ru=r.ru.map(b=>[b.id,b.t,b.x,b.z,b.r]);r.dirty=false}
 r.an=[];
 if(r.dcs){m.cs=r.cs.map(c=>{const S=c.S[c.i]||{n:3};return[c.id,c.t,c.x,c.z,c.r,c.v,S.n,Math.round(c.pr*100),siteMissing(c),c.i,c.S.length,c.got]});r.dcs=false}
 if(r.dl){m.lo=r.lo.map(o=>[o.id,o.k,o.x,o.z,o.n,o.ry||0,o.sc||1]);r.dl=false}if(r.dhb&&r.hb){m.hb=r.hb.map(o=>[o.id,o.x,o.z,o.g,o.k]);r.dhb=false}if(r.dsw){m.sw=r.sw.map(o=>[o.id,o.x,o.z,o.g]);r.dsw=false}
 m.ca=r.ca.map(c=>[c.id,r2(c.x),r2(c.z),r2(c.ry),Object.values(c.load).some(v=>v>0)?1:0]);if(r.tc)m.ca.push([r.tc.id,r2(r.tc.x),r2(r.tc.z),r2(r.tc.ry),r.tc.amt>0?1:0,1]);
 for(const p of r.pl.values())if(p.bd)sendMe(p);
 // Ressourcen immer mitsenden (Bäume/Felsen/Erze), damit Clients sie zuverlässig sehen
// Ressourcen nur bei Änderung (und gelegentlich zur Sicherheit) senden – spart Bandbreite und Rechenzeit
if(r.dt||r.tk%50===1){m.or=r.or.map(o=>[o.id,o.k,o.x,o.z]);
m.tr=r.tr.map(t=>[t.id,r2(t.x),r2(t.z),t.st|0]);
m.rk=r.rk.map(t=>[t.id,r2(t.x),r2(t.z),t.ex|0]);}
r.dt=false;
 tx(r,JSON.stringify(m))}
// ===================== 8.27: Rucksack, Bodenfunde, Stroh, Werkzeuge, Baustellen =====================
// Gewicht je Einheit (kg) – der Rucksack trägt höchstens BAG_MAX kg
const WT={carcass:20,wood:4,stone:3,stick:.4,straw:.5,shingles:.25,iron:2.5,copper:2.5,weapons:3,armor:8,mail:7,plate:12,breast:6,gambeson:3,helmet:2,clothes:1,cloth:.6,wool:.5,leather:1,hides:2,herbs:.1,potions:.5,meat:1,fish:.8,bread:.4,roast:.6,wheat:.5,flour:.5,apples:.2,honey:.5,milk:1,cheese:.6,beer:1,sausage:.4,smoked:.4,hops:.2};
const CONTAINERS=['keep','storage','granary','armory','smithy'];
function pickUp(r,p,id){let o=id?r.lo.find(o=>o.id===id&&dist(o,p)<3.2):null;if(!o){let bd=2.6;for(const q of r.lo){const d=dist(q,p);if(d<bd){bd=d;o=q}}}
 if(o){const n=bagAdd(r,p,o.k,o.n);if(n>0){o.n-=n;if(o.n<=0)r.lo=r.lo.filter(q=>q!==o);r.dl=true;tell(p,'✋ +'+n+' '+GN[o.k])}return}
 if(pickHerb(r,p))return;let sw=null,bs=2.8;for(const q of r.sw){const d=dist(q,p);if(q.g&&d<bs){bs=d;sw=q}}if(sw){sw.g=0;sw.rg=0;r.dsw=true;bagAdd(r,p,'straw',3);tell(p,'🌾 Stroh geschnitten (+3)');return}tell(p,'Hier liegt nichts zum Aufheben')}
const BAG_MAX=50,wt=k=>WT[k]??1,bagW=p=>Object.entries(p.bag||{}).reduce((s,[k,n])=>s+wt(k)*n,0),roomFor=(p,k)=>Math.max(0,Math.floor((BAG_MAX-bagW(p)+1e-6)/wt(k)));
Object.assign(GN,{stick:'Stöcke',straw:'Stroh',shingles:'Holzschindeln'});
function drop(r,k,n,x,z){if(n<=0)return;const o=r.lo.find(o=>o.k===k&&Math.hypot(o.x-x,o.z-z)<1);if(o)o.n+=n;else r.lo.push({id:uid++,k,n,x:r2(x),z:r2(z)});r.dl=true}
function bagAdd(r,p,k,n){n=Math.floor(n);if(n<=0)return 0;const fit=Math.min(n,roomFor(p,k));if(fit>0)p.bag[k]=(p.bag[k]||0)+fit;if(n>fit){drop(r,k,n-fit,p.x+Math.sin(p.ry||0)*.8,p.z+Math.cos(p.ry||0)*.8);tell(p,'🎒 Zu schwer ('+Math.round(bagW(p))+'/'+BAG_MAX+' kg) – '+(n-fit)+' '+GN[k]+' liegen am Boden')}p.bd=1;return fit}
const have=(r,p,k)=>(p.bag[k]||0)+(r.inv[k]||0);
function takeGoods(r,p,goods){for(const[k,n0]of Object.entries(goods)){let n=n0;const b=Math.min(n,p.bag[k]||0);if(b){p.bag[k]-=b;n-=b;if(!p.bag[k])delete p.bag[k];p.bd=1}if(n)r.inv[k]=(r.inv[k]||0)-n}}
const haveAll=(r,p,goods)=>Object.entries(goods).every(([k,n])=>have(r,p,k)>=n);
// ---- Werkzeuge: Material bestimmt Haltbarkeit und Wirkung ----
const TOOLN={sword:'Schwert',axe:'Axt',pickaxe:'Spitzhacke',hoe:'Feldhacke',bow:'Bogen',hammer:'Hammer'},MATN={wood:'Holz',stone:'Stein',iron:'Eisen'},DUR={wood:60,stone:140,iron:320},EFF={wood:.6,stone:1,iron:1.6};
const SHIELDN={round:'Rundschild',heater:'Wappenschild',kite:'Normannenschild'};
const TOOLR={hammer_wood:{tool:'hammer',m:'wood',in:{stick:3},at:null,n:'Holzhammer'},hammer_stone:{tool:'hammer',m:'stone',in:{stick:2,stone:2},at:'bench',n:'Steinhammer'},
 axe_stone:{tool:'axe',m:'stone',in:{stick:2,stone:2},at:'bench',n:'Steinaxt'},pickaxe_stone:{tool:'pickaxe',m:'stone',in:{stick:2,stone:3},at:'bench',n:'Steinspitzhacke'},hoe_stone:{tool:'hoe',m:'stone',in:{stick:2,stone:2},at:'bench',n:'Steinhacke'},
 bow_wood:{tool:'bow',m:'wood',in:{stick:2,wood:1,wool:1},at:'bench',n:'Jagdbogen'},
 sword_iron:{tool:'sword',m:'iron',in:{iron:3,wood:1},at:'smithy',n:'Eisenschwert'},axe_iron:{tool:'axe',m:'iron',in:{iron:2,wood:1},at:'smithy',n:'Eisenaxt'},pickaxe_iron:{tool:'pickaxe',m:'iron',in:{iron:3,wood:1},at:'smithy',n:'Eisenspitzhacke'},hoe_iron:{tool:'hoe',m:'iron',in:{iron:2,wood:1},at:'smithy',n:'Eisenhacke'},hammer_iron:{tool:'hammer',m:'iron',in:{iron:2,wood:1},at:'smithy',n:'Schmiedehammer'},
 sh_round:{shield:'round',in:{wood:4},at:'bench',n:'Rundschild'},sh_kite:{shield:'kite',in:{wood:4,leather:1},at:'bench',n:'Normannenschild'},sh_heater:{shield:'heater',in:{wood:3,leather:1,iron:1},at:'smithy',n:'Wappenschild'},
 shingles:{good:'shingles',out:8,in:{wood:2},at:'bench',n:'Holzschindeln spalten'}};
const toolEff=p=>{const t=p.tools[p.tool];return t?EFF[t.m]:1};
function wear(r,p){const t=p.tools[p.tool];if(!t||r.set.wear===0)return;t.d-=1;p.bd=1;if(t.d<=0){delete p.tools[p.tool];tell(p,'💥 '+MATN[t.m]+'-'+TOOLN[p.tool]+' ist zerbrochen – stelle ein neues Werkzeug her');p.tool='none'}else if(t.d===10)tell(p,'⚠ '+TOOLN[p.tool]+' ist fast abgenutzt')}
function startKit(r){if(r.surv)return{bag:{},tools:{hoe:{m:'stone',d:DUR.stone}},shields:{}};const T={};for(const k of['sword','axe','pickaxe','hoe','hammer'])T[k]={m:'iron',d:DUR.iron};T.bow={m:'wood',d:DUR.wood*2};return{bag:{},tools:T,shields:{heater:1,round:1},sh:'heater'}}
function sendMe(p){try{p.ws.send(JSON.stringify({t:'me',bag:p.bag,w:Math.round(bagW(p)*10)/10,max:BAG_MAX,tools:p.tools,shields:p.shields,sh:p.sh||'',tool:p.tool,sk:p.sk|0}))}catch(e){}p.bd=0}
// ---- Bodenfunde (Stöcke, Steine) und Stroh am Fluss ----
function seedLoose(r){r.lo=[];r.sw=[];const rnd0=makeRng(hashSeed('lo:'+(r.map&&r.map.name)+':'+SC(r)));
 for(const t of r.tr)if(rnd0()<.35){const a=rnd0()*6.28,d=1.2+rnd0()*2.5;r.lo.push({id:uid++,k:'stick',n:1+(rnd0()*3|0),x:r2(t.x+Math.cos(a)*d),z:r2(t.z+Math.sin(a)*d)})}
 for(const k of r.rk)for(let i=0;i<2;i++){const a=rnd0()*6.28,d=1.5+rnd0()*3;r.lo.push({id:uid++,k:'stone',n:1+(rnd0()*2|0),x:r2(k.x+Math.cos(a)*d),z:r2(k.z+Math.sin(a)*d)})}
 const H=WH(r)-15;for(let i=0;i<140*SC(r)*SC(r);i++){const x=(rnd0()*2-1)*H,z=(rnd0()*2-1)*H;if(inRiver(r,x,z,3))continue;r.lo.push({id:uid++,k:rnd0()<.55?'stick':'stone',n:1+(rnd0()*2|0),x:r2(x),z:r2(z)})}
 const S=Rules.riverSamples(r.map||DEFAULT_MAP);if(S)for(let i=0;i<S.length-1;i++){const a=S[i],b=S[i+1],L=Math.hypot(b.x-a.x,b.z-a.z);if(a.w<.6)continue;for(let s=0;s<L;s+=5)for(const side of[-1,1]){if(rnd0()<.35)continue;const t=s/L,x=a.x+(b.x-a.x)*t,z=a.z+(b.z-a.z)*t,nx=-(b.z-a.z)/L,nz=(b.x-a.x)/L,o=9+rnd0()*4,px=x+nx*side*o,pz=z+nz*side*o;if(Math.abs(px)>H||Math.abs(pz)>H||inRiver(r,px,pz,1.5))continue;r.sw.push({id:uid++,x:r2(px),z:r2(pz),g:1,rg:0})}}
 r.dl=true;r.dsw=true}
function looseTick(r,dt){r.lt2=(r.lt2||0)+dt;if(r.lt2<8)return;r.lt2=0;const want=Math.round((r.tr.length*.5+r.rk.length*3+90*SC(r)*SC(r)));
 if(r.lo.length<want){const src=Math.random()<.6&&r.tr.length?r.tr[Math.random()*r.tr.length|0]:r.rk[Math.random()*r.rk.length|0];if(src){const a=Math.random()*6.28,d=1.5+Math.random()*3,x=src.x+Math.cos(a)*d,z=src.z+Math.sin(a)*d;if(![...r.pl.values()].some(p=>dist(p,{x,z})<20)&&!inRiver(r,x,z,2)){r.lo.push({id:uid++,k:r.tr.includes(src)?'stick':'stone',n:1+(Math.random()*2|0),x:r2(x),z:r2(z)});r.dl=true}}}
 const k=20/(yearSec(r)/8);for(const s of r.sw)if(!s.g){s.rg+=k;if(s.rg>=1&&season(r)!==3){s.g=1;s.rg=0;r.dsw=true}}}
// ---- Baustellen: Fundament (Stein) → Holzrahmen → Wände → Dach (Stroh oder Holzschindeln) ----
const INSTANT=['field','fire','bed','bench','moat'],NOFOUND=['palisade','orchard','hopfield','apiary','cow','sheep','pigsty','bridge','cemetery','pyre','gallows','watchpost'];
const STAGEN=['Fundament','Holzrahmen','Wände','Dach'];
function stagesOf(t,v){const B=BD[t],c=B.c,area=B.w*B.d,st=c.stone||0,wd=c.wood||0,S=[];
 const fund=NOFOUND.includes(t)?{}:{stone:Math.max(2,st?Math.ceil(st*.5):Math.ceil(area/12))};
 const frame=wd?{wood:Math.ceil(wd*.6)}:{};const walls={};if(wd-(frame.wood||0)>0)walls.wood=wd-(frame.wood||0);const rest=st-(fund.stone||0);if(rest>0)walls.stone=rest;for(const k in c)if(k!=='wood'&&k!=='stone')walls[k]=c[k];
 const rk=Rules.roofKind(t,v),roof=rk?{[rk]:Math.min(120,Math.ceil(area/(rk==='straw'?3:2)))}:null;
 S.push({n:0,need:fund},{n:1,need:frame},{n:2,need:walls});if(roof)S.push({n:3,need:roof});return S.filter(x=>Object.keys(x.need).length||x.n===1)}
const hitsOf=t=>Math.max(4,Math.min(30,Math.round(Math.sqrt(BD[t].w*BD[t].d)*1.3)));
function siteMissing(cs){const S=cs.S[cs.i];if(!S)return{};const m={};for(const k in S.need){const d=S.need[k]-(cs.got[k]||0);if(d>0)m[k]=d}return m}
function siteFeed(r,cs,p){const miss=siteMissing(cs);let any=false;for(const k in miss){let n=miss[k];if(p){const b=Math.min(n,p.bag[k]||0);if(b){p.bag[k]-=b;if(!p.bag[k])delete p.bag[k];p.bd=1;cs.got[k]=(cs.got[k]||0)+b;n-=b;any=true}}
  if(n&&cs.t==='keep'&&(r.inv[k]||0)>0){const q=Math.min(n,r.inv[k]);r.inv[k]-=q;cs.got[k]=(cs.got[k]||0)+q;any=true}}if(any)r.dcs=true;return any}
function siteHit(r,cs,amount,p){const miss=siteMissing(cs);if(Object.keys(miss).length){if(p)tell(p,'🧱 '+STAGEN[cs.S[cs.i].n]+': es fehlen '+costStr(miss)+(r.b.some(b=>b.t==='storage')?' – der Holzkarren bringt sie aus dem Lagerhaus':' – im Rucksack herbringen (Taste I: am Bergfried aus der Truhe nehmen)'));return false}
 cs.pr+=amount/hitsOf(cs.t);r.dcs=true;if(cs.pr>=1){cs.pr=0;cs.got={};cs.i++;if(cs.i>=cs.S.length){finishSite(r,cs);return true}say(r,'🔨 '+BN[cs.t]+': '+STAGEN[cs.S[cs.i-1].n]+' fertig – jetzt '+STAGEN[cs.S[cs.i].n],cs)}return true}
function placeBuilding(r,t,x,z,rot,v,id){const B=BD[t];r.b.push({id:id||uid++,t,x,z,r:rot,hp:t==='keep'?1200:B.hp,st:0,lv:0,v,tm:0});r.dirty=true;
 if(t==='keep'){migrateRooms(r);r.next=r.set.interval*2;if(!r.surv)for(let i=0;i<3;i++)mkNpc(r,'peasant',x+rnd(-5,5),z+B.d/2+rnd(3,8));say(r,'🏰 Dein Bergfried steht! Die ersten Siedler sind eingetroffen. Weitere kommen, wenn Häuser, Essen und Zufriedenheit stimmen.')}}
function finishSite(r,cs){r.cs=r.cs.filter(o=>o!==cs);r.dcs=true;placeBuilding(r,cs.t,cs.x,cs.z,cs.r,cs.v,cs.id);if(cs.t!=='keep')say(r,'🏠 '+BN[cs.t]+' ist fertig gebaut',cs)}
// Holzkarren: bringt fehlendes Baumaterial vom Lagerhaus zur Baustelle
// Schatzkarren: täglich um 10 Uhr fährt ein Karren mit vier Wachen vom Bergfried zur Münzprägerei, lädt die Truhen und bringt das Gold zurück
function treasureTick(r,dt){const kp=r.b.find(b=>b.t==='keep');if(!kp){r.tc=null;return}
 if(!r.tc&&r.hr>=10&&r.hr<10.5&&r.tcd!==r.dy){const mints=r.b.filter(b=>b.t==='mint'&&(b.chest|0)>0);if(mints.length){r.tcd=r.dy;const P=fp(kp,0,BD.keep.d/2+3);r.tc={id:uid++,x:P.x,z:P.z,ry:0,st:'go',q:mints.map(b=>b.id),amt:0};say(r,'💰 Der Schatzkarren verlässt mit vier Wachen den Bergfried, um die Münzen abzuholen',kp)}}
 const c=r.tc;if(!c)return;
 if(c.st==='go'){const b=r.b.find(b=>b.id===c.q[0]);if(!b){c.q.shift();if(!c.q.length)c.st='back';return}const D=fp(b,0,BD[b.t].d/2+3.2);if(mv(c,D.x,D.z,2.4,dt)<.6){c.st='load';c.t=4}return}
 if(c.st==='load'){c.t-=dt;if(c.t<=0){const b=r.b.find(b=>b.id===c.q[0]);if(b){c.amt+=b.chest|0;b.chest=0}c.q.shift();c.st=c.q.length?'go':'back'}return}
 if(c.st==='back'){const D=fp(kp,0,BD.keep.d/2+3);if(mv(c,D.x,D.z,2.4,dt)<.6){r.gold+=c.amt;r.dirty=true;say(r,'💰 Der Schatzkarren ist zurück: '+c.amt+' Gold in die Schatzkammer des Bergfrieds',kp);r.tc=null}}}
function cartTick(r,dt){treasureTick(r,dt);r.ca=r.ca||[];const stores=r.b.filter(b=>b.t==='storage');
 if(stores.length&&(r.ct=(r.ct||0)-dt)<=0){r.ct=3;for(const cs of r.cs){if(r.ca.some(c=>c.to===cs.id)||r.ca.length>=stores.length*2)continue;const miss=siteMissing(cs),load={};let cap=40;for(const k in miss){const q=Math.min(miss[k],Math.floor(r.inv[k]||0),cap);if(q>0){load[k]=q;cap-=q}}if(!Object.keys(load).length)continue;
  const s=near(cs,stores,1e9),P=fp(s,0,BD.storage.d/2+2);for(const k in load)r.inv[k]-=load[k];r.ca.push({id:uid++,x:P.x,z:P.z,ry:0,to:cs.id,home:s.id,load,st:'go'});say(r,'🐴 Ein Holzkarren bringt '+costStr(load)+' zur Baustelle ('+BN[cs.t]+')',s)}}
 for(const c of r.ca){const cs=r.cs.find(o=>o.id===c.to),home=r.b.find(b=>b.id===c.home);
  if(c.st==='go'){if(!cs){c.st='back';continue}const T0=fp(cs,BD[cs.t].w/2+2,BD[cs.t].d/2+1.5);if(mv(c,T0.x,T0.z,3.4,dt)<1.2){for(const k in c.load){const m=siteMissing(cs)[k]||0,q=Math.min(m,c.load[k]);cs.got[k]=(cs.got[k]||0)+q;c.load[k]-=q;if(c.load[k]>0)r.inv[k]=(r.inv[k]||0)+c.load[k]}c.load={};r.dcs=true;c.st='back'}}
  else{if(!home){c.gone=1;continue}const P=fp(home,0,BD.storage.d/2+2);if(mv(c,P.x,P.z,3.8,dt)<1.2){for(const k in c.load)r.inv[k]=(r.inv[k]||0)+c.load[k];c.gone=1}}}
 r.ca=r.ca.filter(c=>!c.gone)}
// Arbeitslose Dorfbewohner helfen auf Baustellen mit, sobald das Material da ist
function helpBuild(r,n,dt){const cs=near(n,r.cs.filter(c=>!Object.keys(siteMissing(c)).length),140);if(!cs)return false;const B=BD[cs.t],a=(n.i||0)%6.283,P={x:cs.x+Math.cos(a)*(Math.max(B.w,B.d)/2+.8),z:cs.z+Math.sin(a)*(Math.max(B.w,B.d)/2+.8)};
 if(dist(n,P)>1){mv(n,P.x,P.z,2.8,dt);return true}n.ry=Math.atan2(cs.x-n.x,cs.z-n.z);n.bh=(n.bh||0)+dt;if(n.bh>=1.6){n.bh=0;n.cd=1;siteHit(r,cs,.5,null)}return true}
// ===================== Ökosystem der Nachbarorte: Versorgung, Handel untereinander, Krankheiten, Aberglaube =====================
const SPEC=[['Ackerbau',{food:3}],['Holzfäller',{wood:3}],['Steinbrecher',{stone:2}],['Weber',{cloth:2}],['Erzgräber',{iron:2}]],ECOG=['food','wood','stone','cloth','iron'];
function ecoInit(r){r.eco=r.eco||{};for(const t of friendTowns(r)){if(r.eco[t.n])continue;const h=hashSeed('eco:'+t.n),sp=h%SPEC.length;r.eco[t.n]={pop:18+h%14,sp,st:{food:40,wood:30,stone:20,cloth:10,iron:6},sick:0,omen:0,mood:60}}}
const ecoAt=(r,n)=>r.eco&&r.eco[n];
function ecoTick(r,dt){if(!friendTowns(r).length)return;ecoInit(r);r.et2=(r.et2||0)+dt;if(r.et2<30)return;r.et2=0;const T=friendTowns(r),win=season(r)===3;
 for(const t of T){const e=r.eco[t.n],[sn,prod]=SPEC[e.sp];for(const k in prod)e.st[k]=Math.min(400,e.st[k]+prod[k]*(k==='food'&&win?.3:1)*(1-e.sick*.8));e.st.food=Math.min(400,e.st.food+(win?.4:1.2));
  const eat=e.pop*.08;e.st.food-=eat;e.st.wood-=win?e.pop*.05:e.pop*.02;for(const k of ECOG)e.st[k]=Math.max(0,e.st[k]);
  e.mood+=(e.st.food>20?1:-4)+(e.sick>.2?-3:0)+(e.omen?-2:0);e.mood=Math.max(0,Math.min(100,e.mood));
  if(e.st.food<=0&&e.pop>6){e.pop--;if(Math.random()<.3)say(r,'🥀 Hungersnot in '+t.n+' – die Bevölkerung schrumpft ('+e.pop+')')}else if(e.mood>70&&e.st.food>60&&e.pop<45&&Math.random()<.15)e.pop++;
  // Krankheit: bricht zufällig aus, heilt langsam, verbreitet sich über Handelswege
  if(!e.sick&&Math.random()<.012*(e.st.food<15?3:1)){e.sick=.15;say(r,'🦠 In '+t.n+' ist eine Krankheit ausgebrochen – Händler von dort könnten sie einschleppen')}
  else if(e.sick){e.sick=Math.max(0,Math.min(.8,e.sick+(Math.random()<.5?.05:-.07)));if(e.sick<.02){e.sick=0;say(r,'🙂 Die Krankheit in '+t.n+' ist abgeklungen')}else if(Math.random()<.04&&e.pop>8){e.pop--}}
  // Aberglaube: Gerüchte und böse Omen wandern von Ort zu Ort
  if(e.omen>0)e.omen--;else if(Math.random()<.01){e.omen=6;say(r,'👻 In '+t.n+' geht ein böses Omen um – die Leute sind verängstigt')}}
 // Handel der Orte untereinander: Überschuss wandert zum Mangel, Krankheit und Aberglaube reisen mit
 for(const a of T)for(const b of T){if(a===b)continue;const A=r.eco[a.n],B=r.eco[b.n];for(const k of ECOG){if(A.st[k]>60&&B.st[k]<25){const q=Math.min(15,A.st[k]-60);A.st[k]-=q;B.st[k]+=q;if(A.sick>.25&&!B.sick&&Math.random()<.25){B.sick=.1;say(r,'🦠 Händler aus '+a.n+' haben die Krankheit nach '+b.n+' getragen')}if(A.omen&&!B.omen&&Math.random()<.2)B.omen=4}}}
 r.decoT=true}
// Ankunft eines Händlers im eigenen Dorf: Ansteckung / Aberglaube aus dem Herkunftsort, Bedarf fließt in die Preise
function ecoArrive(r,from){const e=ecoAt(r,from);if(!e)return;
 if(e.sick>.2&&r.ev.sick&&Math.random()<e.sick){const L=r.n.filter(n=>!n.sk&&!SICK_IMMUNE.has(n.k)&&!((n.imm|0)>r.dy));if(L.length){const n=L[Math.random()*L.length|0];n.sk=1;n.sickStage=0;say(r,'🤒 Händler aus '+from+' haben eine Krankheit eingeschleppt')}}
 if(e.omen&&r.ev.omen){r.sup=Math.min(100,(r.sup||0)+8);say(r,'👻 Die Händler aus '+from+' erzählen von bösen Omen – der Aberglaube im Dorf wächst')}}
// Preisfaktor: was im Umland knapp ist, wird teurer (gilt für Nahrung, Holz, Stein, Tuch, Eisen)
const ECOMAP={wheat:'food',bread:'food',meat:'food',cheese:'food',fish:'food',apples:'food',sausage:'food',smoked:'food',flour:'food',wood:'wood',stone:'stone',cloth:'cloth',wool:'cloth',gambeson:'cloth',iron:'iron',weapons:'iron'};
function ecoPrice(r,k){const g=ECOMAP[k];if(!g||!r.eco)return 1;const T=friendTowns(r);if(!T.length)return 1;let s=0;for(const t of T)s+=(r.eco[t.n]||{st:{}}).st[g]||0;const avg=s/T.length;return Math.max(.75,Math.min(1.45,1.3-avg/200))}
// ===================== Heilkräuter: wachsen auf Wiesen und am Waldrand; heilen leichte Krankheiten (Spieler und Bewohner) =====================
function seedHerbs(r){r.hb=[];const rnd0=makeRng(hashSeed('hb:'+(r.map&&r.map.name)+':'+SC(r))),H=WH(r)-15;
 for(const t of r.tr)if(rnd0()<.25){const a=rnd0()*6.28,d=3+rnd0()*4,x=t.x+Math.cos(a)*d,z=t.z+Math.sin(a)*d;if(!inRiver(r,x,z,3))r.hb.push({id:uid++,x:r2(x),z:r2(z),g:1,rg:0,k:(rnd0()*3)|0})}
 for(let i=0;i<110*SC(r)*SC(r);i++){const x=(rnd0()*2-1)*H,z=(rnd0()*2-1)*H;if(!inRiver(r,x,z,4))r.hb.push({id:uid++,x:r2(x),z:r2(z),g:1,rg:0,k:(rnd0()*3)|0})}r.dhb=true}
function herbTick(r,dt){if(!r.hb)seedHerbs(r);const k=dt/(yearSec(r)/20);for(const h of r.hb)if(!h.g){h.rg+=k;if(h.rg>=1&&season(r)!==3){h.g=1;h.rg=0;r.dhb=true}}}
function pickHerb(r,p){let h=null,bd=2.6;for(const q of r.hb||[]){const d=dist(q,p);if(q.g&&d<bd){bd=d;h=q}}if(!h)return false;h.g=0;h.rg=0;r.dhb=true;bagAdd(r,p,'herbs',2);tell(p,'🌿 Heilkräuter gepflückt (+2) – im Inventar benutzen, um eine leichte Krankheit zu heilen');return true}
// Kräuter heilen nur einen leichten Verlauf; schwere Fälle brauchen einen Heiltrank aus der Apotheke
function useHerb(r,p,id){const n=id?r.n.find(o=>o.id===id&&o.hp>0&&dist(o,p)<3.5):null,who=n||p,sk=who.sk|0;
 if(!sk)return tell(p,n?'Dieser Bewohner ist nicht krank':'Du bist gesund');
 if(sk===1&&have(r,p,'herbs')>=2){takeGoods(r,p,{herbs:2});who.sk=0;who.sickTime=0;who.sickStage=0;who.cu=0;who.skT=0;if(n){n.imm=r.dy+6;say(r,'🌿 '+p.name+' hat einen Bewohner mit Kräutern geheilt',n)}else tell(p,'🌿 Kräutertee getrunken – die leichte Krankheit ist überstanden');p.bd=1;return}
 if(have(r,p,'potions')>=1){takeGoods(r,p,{potions:1});if(sk>1){who.sk=sk-1;if(n)n.sickTime=Math.max(0,(n.sickTime||0)-120);tell(p,'💊 Heiltrank gegeben – der Zustand bessert sich')}else{who.sk=0;who.skT=0;if(n)n.imm=r.dy+6;tell(p,'💊 Mit Heiltrank geheilt')}p.bd=1;return}
 tell(p,sk>1?'Schwerer Verlauf: Kräuter helfen nicht mehr – ein Heiltrank (Apotheke) ist nötig':'Du brauchst 2 Heilkräuter (Wiesen, Waldrand – mit E pflücken)')}
// Spieler können sich bei Kranken anstecken
function playerSick(r,p,dt){if(!r.ev.sick)return;if(!p.sk){if(r.n.some(n=>n.sk&&n.hp>0&&dist(n,p)<3)&&Math.random()<.004*dt){p.sk=1;p.skT=0;p.bd=1;tell(p,'🤒 Du hast dich angesteckt – leichte Krankheit. 2 Heilkräuter heilen dich (Inventar I → Heilkräuter)')}return}
 p.skT=(p.skT||0)+dt;if(p.sk===1&&p.skT>300){p.sk=2;p.bd=1;tell(p,'🤢 Deine Krankheit verschlimmert sich – jetzt hilft nur noch ein Heiltrank')}p.food=Math.max(0,p.food-dt*.02*p.sk)}
// Heiler sammeln selbst Kräuter, wenn die Apotheke keine mehr hat
function herbGather(r,n,wb,dt){const h=near(n,(r.hb||[]).filter(q=>q.g),140);if(!h)return false;if(!exitBuilding(n,wb,dt))return true;if(dist(n,h)>1.3){mv(n,h.x,h.z,2.8,dt);wb.msg='sammelt Heilkräuter';return true}h.g=0;h.rg=0;r.dhb=true;r.inv.herbs=(r.inv.herbs||0)+2;n.cd=1;return true}
// Unbestattete Leichen verschwinden nicht von selbst – nach einiger Zeit lösen sie Seuchen aus
function corpsePlague(r,dt){r.cpT=(r.cpT||0)+dt;if(r.cpT<20)return;r.cpT=0;if(!r.ev.sick)return;let hit=0;
 for(const c of r.co){if(c.t<120)continue;if(Math.random()>Math.min(.6,.15+c.t/1200))continue;const L=r.n.filter(n=>n.hp>0&&!n.sk&&!SICK_IMMUNE.has(n.k)&&!((n.imm|0)>r.dy)&&dist(n,c)<35);if(!L.length)continue;const n=L[Math.random()*L.length|0];n.sk=c.t>400?2:1;n.sickStage=0;hit++}
 if(hit&&(!r.cpMsg||r.tk-r.cpMsg>600)){r.cpMsg=r.tk;say(r,'☠ Unbestattete Leichen verbreiten eine Seuche – '+hit+' Bewohner erkrankt. Totengräber einsetzen oder mit der Hacke begraben!',r.co[0])}}
// Arbeitslose sammeln tagsüber Stöcke, Steine und Heilkräuter in der Umgebung und bringen sie ins Lager
function gatherIdle(r,n,dt){const kp=r.b.find(b=>b.t==='keep');if(!kp)return false;let t=n.gt&&(r.lo.find(o=>o.id===n.gt)||(r.hb||[]).find(o=>o.id===n.gt&&o.g));
 if(!t){n.gt=0;if((n.gw=(n.gw||0)-dt)>0)return false;n.gw=4;let best=null,bd=60;for(const o of r.lo){if(!['stick','stone'].includes(o.k)||r.n.some(q=>q!==n&&q.gt===o.id))continue;const d=Math.hypot(o.x-kp.x,o.z-kp.z);if(d<bd){bd=d;best=o}}
  if(!best)for(const h of r.hb||[]){if(!h.g||r.n.some(q=>q!==n&&q.gt===h.id))continue;const d=Math.hypot(h.x-kp.x,h.z-kp.z);if(d<bd){bd=d;best=h}}if(!best)return false;n.gt=best.id;t=best}
 if(n.insideId){const old=r.b.find(b=>b.id===n.insideId);if(old&&!exitBuilding(n,old,dt))return true}
 if(dist(n,t)>1.1){mv(n,t.x,t.z,2.6,dt);return true}n.cd=1;if(t.k&&r.lo.includes(t)){r.inv[t.k]=(r.inv[t.k]||0)+t.n;r.lo=r.lo.filter(o=>o!==t);r.dl=true}else if(t.g!==undefined){t.g=0;t.rg=0;r.dhb=true;r.inv.herbs=(r.inv.herbs||0)+2}n.gt=0;return true}
// Nachtwächter: zieht nachts mit Fackel durch die Stadt, verscheucht Wölfe
function watchSpawn(r){const night=r.hr>=20||r.hr<6,kp=r.b.find(b=>b.t==='keep'),w=r.n.find(n=>n.k==='watch');
 if(night&&kp&&!w&&r.b.length>=4){const n=mkNpc(r,'watch',kp.x,kp.z+BD.keep.d/2+2,[...r.pl.keys()][0]||0);n.torch=1;say(r,'🏮 Der Nachtwächter beginnt seine Runde',n)}
 if(!night&&w){r.n=r.n.filter(n=>n!==w)}}
function watchTick(r,n,dt){n.torch=1;if(!n.w||mv(n,n.w.x,n.w.z,1.7,dt)<1){const L=r.b.filter(b=>!['field','moat','bridge','orchard','hopfield','fire','bed','bench'].includes(b.t));const b=L[Math.random()*L.length|0];if(b){const P=fp(b,0,BD[b.t].d/2+2.5);n.w={x:P.x,z:P.z}}}
 const wf=near(n,r.w,10);if(wf){if(dist(n,wf)>1.8)mv(n,wf.x,wf.z,3,dt);else if(n.cd<=0){wf.hp-=8;n.cd=1}}}
// ---- Speichern (saves/welt.json, alle 30 s, bei Verlassen und beim Beenden) ----
const SAVE=process.env.SAVE_FILE||path.join(__dirname,'saves','welt.json');
let deletedAny=false;
function save(){if(!rooms.size&&!deletedAny)return false;const o={};rooms.forEach((r,k)=>o[k]={creative:!!r.creative,map:r.map,paths:r.paths||[],deerTimer:r.deerTimer||0,foodShortage:r.foodShortage||0,heatShortage:r.heatShortage||0,nm:r.nm,sv:(r.sv=Date.now()),b:r.b,ru:r.ru,n:r.n,co:r.co,gold:r.gold,inv:r.inv,tl:r.tl,hr:r.hr,dy:r.dy,set:r.set,tax:r.tax??1,ration:r.ration??1,imm:r.noImm?0:1,surv:r.surv?1:0,next:r.next,tr:r.tr,rk:r.rk,dr:r.dr,pr:r.pr,fame:r.fame,gr:r.gr,sup:r.sup||0,or:r.or,ev:r.ev,cq:r.cq,hb:r.hb||[],eco:r.eco||{},fests:r.fests||{},v827:1,v830:1,cs:r.cs,lo:r.lo,sw:r.sw,ca:r.ca||[],bags:(()=>{for(const p of r.pl.values())r.bags[p.name]={bag:p.bag,tools:p.tools,shields:p.shields,sh:p.sh};return r.bags})()});
 try{fs.mkdirSync(path.dirname(SAVE),{recursive:true});fs.writeFileSync(SAVE+'.tmp',JSON.stringify(o));fs.renameSync(SAVE+'.tmp',SAVE);return true}catch(e){console.log('Speichern fehlgeschlagen',e.message);return false}}
try{const o=JSON.parse(fs.readFileSync(SAVE));for(const k in o){const r=o[k];const src=r.map||DEFAULT_MAP;const allowEmpty=isBlankMap(src);r.noImm=r.imm===0;r.surv=!!r.surv;Object.assign(r,{pl:new Map(),map:Rules.sanitizeMap(src,!!allowEmpty),tw:[],pathDirty:true,paths:r.paths||[],e:[],w:[],ar:[],an:[],pt:10,bt:40,bw:0,dirty:true,dt:true,hr:r.hr||8,dy:r.dy||0,wx:0,wt:60,tk:0,hap:50,ru:r.ru||[],co:r.co||[],pr:r.pr||0,fame:r.fame||0,gr:r.gr||0,sup:r.sup||10,tl:r.tl||{axe:0,pick:0,hoe:0},or:r.or||[],tr:r.tr||[],rk:r.rk||[],ev:r.ev||{on:1,every:240,fire:1,sick:1,omen:1,rats:1,thieves:1,ambush:1,cyc:1,sl:4},et:200,fires:[],cv:[],tt:150,cq:r.cq||0,campOn:false,cr:5,omen:0});r.tw=r.map.towns.map(t=>({...t}));if(r.set){r.set.autosave=r.set.autosave!==undefined?r.set.autosave:30}else r.set={interval:120,max:6,autosave:30};r.tax=r.tax??1;r.ration=r.ration??1;Object.assign(r.inv,{gambeson:r.inv.gambeson||0,armor:r.inv.armor||0,potions:r.inv.potions||0});if(!r.ev.rats&&r.ev.rats!==0)Object.assign(r.ev,{rats:1,thieves:1,ambush:1});// Ressourcen aus Karte nachladen falls Save leer
if(!r.or.length&&(r.map.ores||[]).length)r.or=r.map.ores.map(o=>({id:uid++,k:o.k,x:+o.x,z:+o.z}));
if(!r.or.length){const q=()=>Math.random();for(const k of['iron','iron','copper','copper']){const a=q()*6.28,d=50+q()*70;r.or.push({id:uid+=1,k,x:Math.cos(a)*d,z:Math.sin(a)*d})}}
if((!r.tr||!r.tr.length)&&((r.map.forests||[]).length||(r.map.rocks||[]).length)){const tmp={map:r.map,tw:r.tw,or:r.or,tr:[],rk:[],dr:[]};applyMap(tmp,r.map);r.tr=tmp.tr;r.rk=tmp.rk;r.or=tmp.or.length?tmp.or:r.or}
 if(!r.v830){for(const b of r.b)if(b.t==='bridge'&&b.lv===undefined)b.lv=1;r.v830=1}if(!r.v827){for(const b of r.b)if(b.t==='house')b.lv=2;r.v827=1}r.cs=r.cs||[];r.ca=r.ca||[];r.bags=r.bags||{};if(r.set.wear===undefined)r.set.wear=1;for(const k of['straw','shingles','stick'])r.inv[k]=r.inv[k]||0;if(!Array.isArray(r.lo)||!Array.isArray(r.sw))seedLoose(r);r.dl=r.dsw=r.dcs=r.dhb=true;
 migrateRooms(r);for(const b of r.b)if(b.lv===undefined&&['gate','portcullis','garrison'].includes(b.t))b.lv=1;for(const b of r.b)if(b.v===undefined)b.v=((b.id*7)^(Math.round(b.x*4)*3)^(Math.round(b.z*4)*5))&3;
 for(const s of STOCK)r.inv[s]=r.inv[s]||(s==='weapons'?4:0);for(const b of r.b)if(BD[b.t]&&BD[b.t].hp>BD[b.t].hp*1)b.hp=BD[b.t].hp;rooms.set(k,r);
 uid=Math.max(uid,1+Math.max(1,...[...r.b,...r.ru,...r.n,...r.tr,...r.rk,...r.dr,...r.co,...r.or,...r.cs,...r.lo,...r.sw,...r.ca].map(x=>x.id)))}console.log('Spielstand geladen:',rooms.size,'Welt(en)')}catch(e){}
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
   const fresh=!rooms.has(code);r=room(code,m.map);if(m.wname&&!r.nm)r.nm=String(m.wname).slice(0,24);if(fresh&&m.create&&m.surv){r.surv=true;r.noImm=true;r.inv.weapons=0;r.inv.iron=0}if(fresh&&r.preTown&&!r.surv){const kp=r.b.find(b=>b.t==='keep');if(kp){const P=fp(kp,0,BD.keep.d/2+5);for(let i=0;i<14;i++)mkNpc(r,'peasant',P.x+rnd(-6,6),P.z+rnd(0,6))}r.gold+=500;for(const k of['wood','stone','bread','meat'])r.inv[k]=(r.inv[k]||0)+60}p={id:uid++,name:String(m.name||'Spieler').slice(0,16),x:spawnOf(r).x,z:spawnOf(r).z,ry:0,ws,hp:100,lt:0,food:100,tool:'sword',ch:cleanProf(m.ch),fc:Math.max(0,Math.min(11,+m.fc|0)),coa:Math.max(0,Math.min(7,+m.coa|0))};{p.sk=0;const kit=r.bags[p.name]||startKit(r);p.bag=kit.bag||{};p.tools=kit.tools||{};p.shields=kit.shields||{};p.sh=kit.sh||'';if(!p.tools.sword)p.tool=p.tools.hoe?'hoe':'none';setTimeout(()=>sendMe(p),350)}r.dl=r.dsw=r.dcs=true;if(r.surv){p.ch=farmerProf(p.ch);p.tool=p.tools.hoe?'hoe':'none';setTimeout(()=>{try{ws.send(JSON.stringify({t:'prof',ch:p.ch,m:'🌾 Survival: Du beginnst als Bauer. Kleidung und Rüstung musst du selbst herstellen.'}))}catch(e){}},300)}r.pl.set(p.id,p);if(m.create)save();for(const n of r.n)if(!n.o)n.o=p.id;r.dirty=true;r.dt=true;r.pathDirty=true;
   ws.send(JSON.stringify({t:'hi',id:p.id,pos:{x:p.x,z:p.z},code,bd:CAT,tw:townsOf(r),map:r.map,jn:JN,gn:GN}));say(r,p.name+' ist beigetreten');return}
  if(!p)return;
  if(m.t==='mv'){if(![m.x,m.z,m.ry].every(Number.isFinite))return;p.x=Math.max(-WH(r),Math.min(WH(r),m.x));p.z=Math.max(-WH(r),Math.min(WH(r),m.z));p.ry=m.ry;p.el=Math.max(0,Math.min(25,+m.el||0));const now=Date.now();if(m.run&&!r.creative)p.food=Math.max(0,p.food-Math.min(1,(now-(p.rt||now))/1000)*.07);p.rt=now}
  else if(m.t==='creative'){r.creative=!!m.on;say(r,r.creative?'Frei-Bau aktiviert: kostenlose Gebäude und Ressourcenpflanzung':'Survival-Bau aktiviert')}
  else if(m.t==='plant'){
   if(!r.creative)return tell(p,'Ressourcen pflanzen geht nur im Frei-Bau-Modus');
   const kinds=['tree','stump','rock','iron','copper','deer'];if(!kinds.includes(m.k)||![m.x,m.z].every(Number.isFinite))return;
   const x=r2(m.x),z=r2(m.z);if(Math.abs(x)>RESOURCE_LIMIT_(r)||Math.abs(z)>RESOURCE_LIMIT_(r)||inRiver(r,x,z,8))return tell(p,'Hier kann nicht gepflanzt werden');
   if(r.tr.length+r.rk.length+r.or.length+r.dr.length>=1600)return tell(p,'Ressourcenlimit erreicht');
   if(r.b.some(b=>{const [lx,lz]=Rules.local(b,x,z);return Math.abs(lx)<BD[b.t].w/2+1&&Math.abs(lz)<BD[b.t].d/2+1})||[...r.tr,...r.rk,...r.or,...r.dr].some(o=>Math.hypot(o.x-x,o.z-z)<1.5))return tell(p,'Zu nahe an einem Gebäude oder einer Ressource');
   const o={id:uid++,x,z};if(m.k==='tree'||m.k==='stump')r.tr.push({...o,hp:m.k==='stump'?3:4,st:m.k==='stump'?1:0,rg:0});else if(m.k==='rock')r.rk.push({...o,hp:5});else if(m.k==='deer')r.dr.push({...o,hp:2,ry:0,w:null});else r.or.push({...o,k:m.k});r.dt=true;
  }
  else if(m.t==='path'){
   if(![m.x,m.z].every(Number.isFinite)||Math.abs(m.x)>RESOURCE_LIMIT_(r)||Math.abs(m.z)>RESOURCE_LIMIT_(r)||inRiver(r,m.x,m.z,8))return;
   if(!r.b.some(b=>b.t==='keep'))return tell(p,'Zuerst den Bergfried platzieren');
   if(Date.now()-(p.pathAt||0)<65)return;p.pathAt=Date.now();r.paths=r.paths||[];
   if(r.paths.length>=5000)return tell(p,'Wegelimit erreicht');const last=p.pathLast;
   const point={x:r2(m.x),z:r2(m.z)};
   if(!m.start&&last&&dist(last,point)<.35)return;
   r.paths.push({x:point.x,z:point.z,ax:!m.start&&last&&dist(last,point)<12?last.x:point.x,az:!m.start&&last&&dist(last,point)<12?last.z:point.z});p.pathLast=point;r.pathDirty=true;
  }
  else if(m.t==='pathUndo'){if(r.paths&&r.paths.length){r.paths.pop();r.pathDirty=true;p.pathLast=null}}
  else if(m.t==='build'){const B=BD[m.k];if(!B)return;let x=Math.round(Number(m.x)*4)/4,z=Math.round(Number(m.z)*4)/4;const rot=((Math.round((+m.r||0)*18)/18)%4+4)%4;if(!Number.isFinite(x)||!Number.isFinite(z))return;
   {const snapped=Rules.snapPlacement(m.k,x,z,rot,[...r.b,...r.cs],BD,1.8);if(snapped.snapped){x=Math.round(snapped.x*4)/4;z=Math.round(snapped.z*4)/4}}
   const why=canPlace(r,m.k,x,z,rot);if(why)return tell(p,why);
   const keepAny=r.b.some(b=>b.t==='keep')||r.ru.some(b=>b.t==='keep')||r.cs.some(c=>c.t==='keep');
   if(m.k==='keep'&&keepAny)return tell(p,'Es kann nur einen Bergfried geben');
   if(m.k!=='keep'&&!r.b.some(b=>b.t==='keep'))return tell(p,r.cs.some(c=>c.t==='keep')?'Baue zuerst den Bergfried fertig (Hammer, Taste 6)':'Zuerst den Bergfried platzieren – er ist das Herz deiner Siedlung');
   if(r.b.length+r.cs.length>=600)return tell(p,'Zu viele Gebäude');const v=(Math.random()*4)|0;
   if(r.creative||INSTANT.includes(m.k)){if(!r.creative&&!haveAll(r,p,B.c))return tell(p,'Zu wenig Material (Rucksack + Lager): '+costStr(B.c));if(!r.creative)takeGoods(r,p,B.c);placeBuilding(r,m.k,x,z,rot,v);return}
   // Realistischer Bau: Baustelle abstecken, dann Stufe für Stufe mit dem Hammer errichten
   const S=stagesOf(m.k,v),cs={id:uid++,t:m.k,x,z,r:rot,v,S,i:0,pr:0,got:{}};r.cs.push(cs);r.dcs=true;
   say(r,'📐 Baustelle abgesteckt: '+BN[m.k]+' – '+S.map(q=>STAGEN[q.n]+(Object.keys(q.need).length?' ('+costStr(q.need)+')':'')).join(' → ')+'. Mit dem Hammer (6) errichten'+(r.b.some(b=>b.t==='storage')?'; ein Holzkarren bringt das Material':''),cs)}
  else if(m.t==='recruit')tell(p,'Neue Bewohner kommen von selbst, wenn Häuser, Essen und Zufriedenheit stimmen. Menü: Zuweisen oder Ausbilden.');
  else if(m.t==='staffMode'){const b=r.b.find(b=>b.id===m.b);if(!b||!jobsOf(b))return;b.manual=!!m.manual;r.dirty=true;}
  else if(m.t==='unassign'){const n=r.n.find(n=>n.id===m.n&&n.wb===m.b&&n.hp>0);if(!n||n.sk)return;settleJob(r,n);n.k='peasant';n.wb=0;n.manualIdle=true;r.dirty=true;}
  else if(m.t==='assign'){if(!JOBS.includes(m.k))return;const pe=m.n?r.n.find(n=>n.id===m.n&&n.hp>0&&!n.sk&&!n.tr&&NT[n.k].job):r.n.find(n=>n.k==='peasant'&&!n.tr&&!n.sk&&n.hp>0);if(!pe)return tell(p,'Kein gesunder verfügbarer Dorfbewohner');
   const wb=m.b?r.b.find(b=>b.id===m.b):freeSlot(r,m.k,p),slots=wb&&jobsOf(wb)?.[m.k];if(!wb||!slots||wb.off||used(r,wb)-(pe.wb===wb.id?1:0)>=slots)return tell(p,'Kein freier Arbeitsplatz in diesem Gebäude');settleJob(r,pe);pe.k=m.k;pe.wb=wb.id;pe.manualIdle=false;pe.hp=Math.min(pe.hp,NT[m.k].hp);if(m.b)wb.manual=true;r.dirty=true;say(r,JN[m.k]+' zu '+BN[wb.t]+' zugewiesen');}
  else if(m.t==='train'){if(!SOLDIER.includes(m.k))return;const cost={sword:40,archer:50,spear:45,crossbow:70,knight:150}[m.k];
   if(m.k==='knight'&&(r.inv.armor||0)<1)return tell(p,'Ein Ritter braucht eine Rüstung aus der Waffenkammer (Rüstungsmacher)');if(m.k==='crossbow'&&(r.inv.iron||0)<1)return tell(p,'Eine Armbrust braucht 1 Eisen');
   if(!r.b.some(b=>b.t==='garrison'&&dist(b,p)<14))return tell(p,'Geh zur Garnison (14 m) und verwalte sie mit E, um Soldaten auszubilden');if(r.n.filter(n=>n.tr).length>=5)return tell(p,'Die Garnison ist voll (5 gleichzeitig)');
   const pe=r.n.find(n=>n.k==='peasant'&&!n.tr&&!n.sk);if(!pe)return tell(p,'Kein arbeitsloser Dorfbewohner vorhanden');if(r.inv.weapons<1)return tell(p,'Keine Waffen im Lager – Schmiede bauen und besetzen');if(r.gold<cost)return tell(p,'Zu wenig Gold ('+cost+')');
   r.gold-=cost;r.inv.weapons--;if(m.k==='knight')r.inv.armor--;if(m.k==='crossbow')r.inv.iron--;pe.tr={k:m.k,t:0,o:p.id}}
  else if(m.t==='post'){const cand=r.b.filter(b=>BD[b.t].post&&dist(b,p)<20).sort((a,b)=>dist(a,p)-dist(b,p));let c=0;
   for(const b of cand){let free=postN(b)-r.n.filter(n=>n.pb===b.id&&n.m==='post').length;while(free>0){const a=r.n.filter(n=>RANGED.includes(n.k)&&n.o===p.id&&n.m!=='post').sort((x,y)=>dist(x,b)-dist(y,b))[0];if(!a)break;a.m='post';a.pb=b.id;a.sl=free;free--;c++}}
   if(!c)tell(p,'Kein freier Posten (Turm, Torhaus, Wachposten) oder keine freien Bogenschützen im Umkreis von 20 m');else say(r,'🏹 '+c+' Bogenschützen besetzen die Wachposten')}
  else if(m.t==='demolish'){const b=r.b.find(b=>b.id===m.b);if(!b||dist(b,p)>20+Math.max(BD[b.t].w,BD[b.t].d)/2)return tell(p,'Zu weit entfernt');demolish(r,b,false);if(b.t==='keep')say(r,'🏰 Der Bergfried wurde abgerissen – setze ihn an anderer Stelle neu (B)',b)}
  else if(m.t==='brepair'){const b=r.b.find(b=>b.id===m.b);if(!b||b.hp>=mh(b))return;if(dist(b,p)>20+Math.max(BD[b.t].w,BD[b.t].d)/2)return tell(p,'Zu weit entfernt');const cost=frac(BD[b.t].c,.3*(1-b.hp/mh(b)));if(!afford(r,cost))return tell(p,'Material fehlt: '+costStr(cost));pay(r,cost);b.hp=mh(b);b.fire=0;r.dirty=true;say(r,'🔨 '+BN[b.t]+' repariert')}
  else if(m.t==='look'){if(!r.b.some(b=>(b.t==='keep'||b.t==='garrison')&&dist(b,p)<22)){ws.send(JSON.stringify({t:'prof',ch:p.ch}));return tell(p,'Aussehen und Rüstung wechselst du im Bergfried (Kleiderschrank) oder in der Garnison (Rüstkammer)')}if(!(Array.isArray(m.ch)&&m.ch.length===12&&m.ch.every((v,i)=>Number.isInteger(v)&&v>=0&&v<=PMAX[i])))return tell(p,'Ungültige Auswahl');if(r.surv){const o=p.ch,nw=m.ch,civ=[5,6,7,8,11].some(k=>o[k]!==nw[k]),oa=ARMOR_ITEMS[o[9]]||{},na=ARMOR_ITEMS[nw[9]]||{},oh=o[10]?{helmet:1}:{},nh=nw[10]?{helmet:1}:{},need={};
   if(nw[9]!==o[9])for(const k in na)need[k]=(need[k]||0)+na[k];if(nw[10]!==o[10])for(const k in nh)need[k]=(need[k]||0)+nh[k];if(civ)need.clothes=(need.clothes||0)+1;
   if(nw[9]!==o[9])for(const k in oa)need[k]=(need[k]||0)-oa[k];if(nw[10]!==o[10])for(const k in oh)need[k]=(need[k]||0)-oh[k];
   const miss=Object.entries(need).filter(([k,n])=>n>0&&inv(r,k)<n);if(miss.length){ws.send(JSON.stringify({t:'prof',ch:p.ch}));return tell(p,'Noch nicht hergestellt: '+miss.map(([k,n])=>n+'× '+GN[k]).join(', ')+' – Weberei/Schmiede/Rüstungsmacher')}
   for(const k in need)r.inv[k]=(r.inv[k]||0)-need[k];r.dirty=true}p.ch=m.ch}
  else if(m.t==='bstaff'){const b=r.b.find(b=>b.id===m.b);if(!b||!jobsOf(b))return;b.off=m.on?0:1;r.dirty=true;if(b.off){for(const n of r.n)if(n.wb===b.id&&n.hp>0){n.hp=0;n.conv=1;const q=mkNpc(r,'peasant',n.x,n.z,n.o);q.ry=n.ry}say(r,'Besetzung von '+BN[b.t]+' abgeschaltet – Arbeiter sind wieder frei')}else say(r,'Besetzung von '+BN[b.t]+' automatisch')}
  else if(m.t==='tnyHost'||m.t==='fairHost'){const pl=r.b.find(b=>b.t==='plaza');if(!pl||dist(pl,p)>40)return tell(p,'Feste richtest du auf dem Marktplatz aus');if(r.plazaEvent)return tell(p,'Auf dem Marktplatz ist bereits etwas im Gange');if(r.hr<8||r.hr>16)return tell(p,'Feste beginnen nur tagsüber (8–16 Uhr)');
   const F=r.fests||(r.fests={}),fair=m.t==='fairHost',key=fair?'fairD':'tnyD',cost=fair?FAIR_HOST:TNY_HOST;if(F[key]!=null&&r.dy-F[key]<2)return tell(p,(fair?'Der letzte Jahrmarkt':'Das letzte Turnier')+' ist erst kurz her – frühestens in '+(2-(r.dy-F[key]))+' Tag(en) wieder');if(!r.creative&&r.gold<cost)return tell(p,(fair?'Ein Jahrmarkt':'Ein Turnier')+' kostet '+cost+' Gold');
   if(!r.creative)r.gold-=cost;F[key]=r.dy;r.dirty=true;if(fair){r.plazaEvent='circus';r.plazaEventT=240;say(r,'🎪 '+p.name+' lädt zum Jahrmarkt: Händler und Aussteller bauen ihre Stände auf dem Marktplatz auf!',pl)}else startTourney(r,p.name+' richtet ein Ritterturnier aus')}
  else if(m.t==='tnyBet'){const T=r.tny,i=m.i|0;if(!T||T.ph!=='intro')return tell(p,'Wetten nimmt der Herold nur vor dem ersten Lanzengang an');if(!T.k[i])return;if(T.bets[p.name]!=null)return tell(p,'Du hast bereits gewettet');if(!r.creative&&r.gold<TNY_BET)return tell(p,'Eine Wette kostet '+TNY_BET+' Gold');if(!r.creative)r.gold-=TNY_BET;T.bets[p.name]=i;r.dirty=true;say(r,'🪙 '+p.name+' wettet '+TNY_BET+' Gold auf '+T.k[i].n+' (Quote '+T.k[i].od+')')}
  else if(m.t==='tnyJoin'){const T=r.tny,pl=r.b.find(b=>b.t==='plaza');if(!T||T.ph!=='intro')return tell(p,'Anmelden kann man sich nur vor dem ersten Lanzengang');if(!p.mt)return tell(p,'Zum Tjost musst du zu Pferd sitzen');if(!pl||dist(pl,p)>40)return tell(p,'Melde dich beim Herold am Marktplatz an');if(T.k.some(q=>q.pl===p.name))return tell(p,'Du bist bereits angemeldet');const i=T.k.findIndex(q=>!q.pl);if(i<0)return tell(p,'Alle Plätze sind besetzt');
   const bag=p.bag||{},arm=(bag.plate?.12:0)+(bag.mail?.06:0)+(bag.breast?.05:0)+(bag.helmet?.03:0);T.k[i]={n:p.name,s:+Math.min(.85,.55+arm).toFixed(2),c:p.fc|0,a:p.coa|0,pl:p.name};tnyOdds(T);for(const nm in T.bets)if(T.bets[nm]===i)delete T.bets[nm];say(r,'🛡 '+p.name+' tritt selbst im Turnier an!');r.dirty=true}
  else if(m.t==='banquet'){const kp=r.b.find(b=>b.t==='keep');if(!kp||dist(kp,p)>30)return tell(p,'Ein Bankett richtest du im Bergfried aus');if(r.banq)return tell(p,'Das Bankett ist bereits im Gange');if(r.bqd!=null&&r.dy-r.bqd<2)return tell(p,'Das letzte Bankett ist erst kurz her – frühestens in '+(2-(r.dy-r.bqd))+' Tag(en) wieder');
   const FOOD=['roast','meat','bread','apples','sausage','smoked','cheese'],have=r.creative?99:FOOD.reduce((a,k)=>a+(r.inv[k]|0),0);if(!r.creative&&r.gold<120)return tell(p,'Ein Bankett kostet 120 Gold');if(have<8)return tell(p,'Für ein Bankett braucht es 8 Speisen im Lager (Braten, Fleisch, Brot, Äpfel, Wurst, Käse …)');
   if(!r.creative)r.gold-=120;let need=r.creative?0:8;for(const k of FOOD){if(!need)break;const t=Math.min(need,r.inv[k]|0);r.inv[k]-=t;need-=t}r.bqd=r.dy;r.fame=(r.fame||0)+3;
   const I=Rules.interior('keep',kp.st|0),guests=pickAdults(r,I.seats.length).filter(id=>{const n=r.n.find(o=>o.id===id);return n&&!['cook','keeper'].includes(n.k)}),pool=r.n.filter(n=>n.hp>0&&!n.sk&&['cook','keeper'].includes(n.k)).map(n=>n.id),serv=(pool.length?pool:pickAdults(r,2,guests)).slice(0,2);
   r.banq={t:150,g:guests,s:serv,c:kp.id};r.dirty=true;say(r,'🍖 Festbankett im Bergfried! Spanferkel, Äpfel und Wein werden aufgetragen – die Gäste feiern (Beliebtheit +18, Ansehen +3)',kp)}
  else if(m.t==='keepRoom'){const b=r.b.find(b=>b.id===m.b&&b.t==='keep');if(!b||dist(b,p)>26||!['dungeon','torture'].includes(m.k))return;const bit=m.k==='dungeon'?1:2;if((b.ext||0)&bit)return;if(bit===2&&b.st<2)return tell(p,'Folterkammer erst ab Stufe 3 (Steinbergfried)');const cost=BD[m.k].c;if(!r.creative&&!afford(r,cost))return tell(p,'Material fehlt: '+costStr(cost));if(!r.creative)pay(r,cost);b.ext=(b.ext||0)|bit;r.dirty=true;say(r,BN[m.k]+' im Bergfried eingerichtet');}
  else if(m.t==='upgrade'){const k=(m.b&&r.b.find(b=>b.id===m.b))||r.b.find(b=>b.t==='keep'&&dist(b,p)<16);if(!k||dist(k,p)>20+Math.max(BD[k.t].w,BD[k.t].d)/2)return tell(p,'Geh näher an das Gebäude (E)');
   if(['garrison','gate','portcullis','bridge'].includes(k.t)){if(k.lv)return tell(p,'Bereits zum Steinbau ausgebaut');const c=k.t==='bridge'?{stone:50,wood:10}:{stone:45,wood:15};if(!r.creative&&!afford(r,c))return tell(p,'Zu wenig Material: '+costStr(c));if(!r.creative)pay(r,c);k.lv=1;k.hp=mh(k);r.dirty=true;say(r,'Steinausbau abgeschlossen: '+BN[k.t]);}
   else if(k.t==='keep'){const lv=k.st|0;if(lv>=3)return tell(p,'Der Bergfried ist voll ausgebaut');if(!r.creative&&!afford(r,UPG[lv]))return tell(p,'Zu wenig Material: '+costStr(UPG[lv]));if(!r.creative)pay(r,UPG[lv]);k.st=lv+1;migrateRooms(r);k.hp=mh(k);r.dirty=true;say(r,'🏰 Bergfried ausgebaut: '+UPN[lv+1]+(lv+1===3?' – vier Türme und Eisentor':' (mehr Einwohner, Lager und Leben)'))}
   else if(k.t==='house'){const lv=k.lv|0;if(lv>=2)return tell(p,'Das Wohnhaus ist voll ausgebaut');const c={...HOUSEUP[lv]};if(Rules.roofKind('house',k.v)==='straw'){c.straw=c.shingles;delete c.shingles}if(!r.creative&&!haveAll(r,p,c))return tell(p,'Zu wenig Material: '+costStr(c));if(!r.creative)takeGoods(r,p,c);k.lv=lv+1;r.dirty=true;say(r,'🏗 Ausgebaut zum '+HOUSEN[lv+1]+' ('+capOf(k)+' Bewohner)',k)}
   else{const u=UP2[k.t];if(!u)return tell(p,'Dieses Gebäude kann nicht ausgebaut werden');if(!afford(r,u.c))return tell(p,'Zu wenig Material: '+costStr(u.c));pay(r,u.c);k.t=u.to;k.hp=BD[u.to].hp;k.pt=0;r.dirty=true;say(r,'🏗 '+BN[u.to]+' ausgebaut')}}
  else if(m.t==='unpost'){for(const n of r.n)if(n.m==='post'&&n.o===p.id){n.m='guard';n.el=0;n.p={x:n.x,z:n.z}}}
  else if(m.t==='evset'){if(m.k==='on')r.ev.on=m.v?1:0;else if(m.k==='every')r.ev.every=Math.max(0,Math.min(1800,+m.v||0));else if(m.k==='cyc'){r.ev.cyc=m.v?1:0;if(!m.v)r.hr=12}else if(m.k==='sl')r.ev.sl=Math.max(1,Math.min(30,+m.v||4));else if(['fire','sick','omen','rats','thieves','ambush'].includes(m.k))r.ev[m.k]=m.v?1:0;r.et=Math.min(r.et,r.ev.every||1e9)}
  else if(m.t==='evnow'){if(m.k==='prisoner'){const dc=4*r.b.filter(b=>hasRoom(b,'dungeon')).length;if(!dc)tell(p,'Kein Kerker vorhanden');else r.pr=Math.min(dc,r.pr+1)}else if(m.k==='pray'){if(r.holy){r.pray=90;r.pd=r.dy;say(r,'🔔 Die Glocken läuten – alle Bewohner gehen zum Gebet')}else tell(p,'Kapelle/Kirche mit Priester nötig')}else if(['fire','sick','omen','rats','thieves','ambush'].includes(m.k))trigger(r,m.k);else if(m.k==='trade')spawnTrade(r,m.v)}
  else if(m.t==='expedition'){if(!hasEnemy(r))return tell(p,'Auf dieser Karte gibt es kein Banditenlager');const en=enemyTown(r);if(m.c==='attack'){if(r.cq>0)return tell(p,en.n+' ist erobert – es gibt dort nichts mehr zu tun');const S=r.n.filter(n=>n.o===p.id&&SOLDIER.includes(n.k)&&n.m!=='post'&&!n.tr);if(S.length<4)return tell(p,'Zu wenige Soldaten für einen Feldzug (mindestens 4)');for(const n of S){n.m='attack';n.el=0}say(r,'⚔ Feldzug gegen '+en.n+' beginnt ('+S.length+' Soldaten)')}else for(const n of r.n)if(n.o===p.id&&n.m==='attack')n.m='follow'}
  else if(m.t==='gate'){const g=r.b.filter(b=>(b.t==='gate'||b.t==='portcullis')&&dist(b,p)<12);if(!g.length)return tell(p,'Kein Torhaus in der Nähe (12 m)');for(const b of g)b.man=b.st?0:1;say(r,g[0].man?'🚪 Das Tor wurde verriegelt':'🚪 Das Tor wurde geöffnet')}
  else if(m.t==='interrogate'){if(!r.b.some(b=>hasRoom(b,'torture')))return tell(p,'Du brauchst eine Folterkammer');if(r.pr<1)return tell(p,'Keine Gefangenen');r.pr--;r.gold+=30;r.fame=Math.max(0,r.fame-1);const t=Math.round(r.next);say(r,'🗝 Der Gefangene verrät: Der nächste Überfall kommt in etwa '+t+' s (+30 Gold, Ansehen -1)')}
  else if(m.t==='order'){for(const n of r.n)if(n.o===p.id&&!NT[n.k].job){
   if(m.c==='follow'){n.m='follow';n.el=0}
   else if(m.c==='guard'){n.m='guard';n.p={x:n.x,z:n.z};n.el=0}
   else if(m.c==='patrol'){n.m='patrol';n.a=m.rad==='town'?{town:1}:{x:p.x,z:p.z,r:Math.max(10,Math.min(200,+m.rad||30))};n.w={x:n.x,z:n.z};n.el=0}}}
  else if(m.t==='set'){if(m.interval!==undefined)r.set.interval=Math.max(0,Math.min(600,+m.interval||0));if(m.max!==undefined)r.set.max=Math.max(0,Math.min(30,+m.max||0));if(m.autosave!==undefined)r.set.autosave=Math.max(0,Math.min(600,+m.autosave||0));if(m.wear!==undefined)r.set.wear=m.wear?1:0;r.next=Math.min(r.next,r.set.interval||1e9)}
  else if(m.t==='policy'){if(m.tax!==undefined){r.tax=Math.max(0,Math.min(2,+m.tax|0));say(r,'📜 Steuern: '+['niedrig','mittel','hoch'][r.tax])}if(m.ration!==undefined){r.ration=Math.max(0,Math.min(2,+m.ration|0));say(r,'🍞 Rationen: '+['großzügig','normal','hungern'][r.ration])}if(m.imm!==undefined){r.noImm=!m.imm;say(r,r.noImm?'🚫 Kein Zuzug: Es kommen keine neuen Bewohner mehr':'🏠 Zuzug erlaubt')}r.dirty=true}
  else if(m.t==='swing'){const T0=Date.now();if(T0-(p.sw||0)<250)return;p.sw=T0;if(!r.creative)p.food=Math.max(0,p.food-({axe:.35,pickaxe:.35,hoe:.3,hammer:.25,bow:.2}[m.k]||.22))}
  else if(m.t==='hit'){const T=Date.now();if(T-p.lt>550){p.lt=T;p.hm=m.hm==='demolish'?'demolish':'repair';const fx=Math.sin(p.ry),fz=Math.cos(p.ry);
   const f=(l,mx)=>{let b=null;for(const e of l){const dx=e.x-p.x,dz=e.z-p.z,d=Math.hypot(dx,dz);if(d<mx&&dx*fx+dz*fz>0){mx=d;b=e}}return b};
   const nearB=(l,lim=3.2)=>{let b=null,bd=lim;for(const o of l){const e=dist(o,p)-Math.max(BD[o.t].w,BD[o.t].d)/2;if(e<bd){bd=e;b=o}}return b};let t;
   if(!['none','torch'].includes(p.tool)&&!p.tools[p.tool])return tell(p,'Du besitzt kein Werkzeug „'+(TOOLN[p.tool]||p.tool)+'“ – im Inventar (I) herstellen');
   const E=toolEff(p),gain=b=>Math.max(1,Math.round(b*E)),used=()=>wear(r,p);
   if(p.tool==='none'||p.tool==='torch'){const sn=f(r.n.filter(n=>n.sk&&n.hp>0),2.8);if(sn&&p.tool==='none'){useHerb(r,p,sn.id);return}pickUp(r,p);return}
   if(p.tool==='bow'){let b=null,ba=.35;for(const e of[...r.e,...r.w,...r.dr]){const dx=e.x-p.x,dz=e.z-p.z,d=Math.hypot(dx,dz);if(d>32||d<1)continue;const an=Math.acos(Math.max(-1,Math.min(1,(dx*fx+dz*fz)/d)));if(an<ba){ba=an;b=e}}
    if(b)shoot(r,p,b,Math.round(18*E));else shoot(r,p,{id:0,x:p.x+fx*24,z:p.z+fz*24,hp:0},0);used()}
   else if(p.tool==='hammer'&&p.hm==='demolish'&&(t=nearB(r.cs,5))){for(const k in t.got)r.inv[k]=(r.inv[k]||0)+t.got[k];for(let q=0;q<t.i;q++)for(const k in t.S[q].need)r.inv[k]=(r.inv[k]||0)+Math.floor(t.S[q].need[k]*.5);r.cs=r.cs.filter(o=>o!==t);r.dcs=true;r.ca=(r.ca||[]).map(c=>c.to===t.id?{...c,st:'back'}:c);say(r,'🔨 Baustelle '+BN[t.t]+' aufgegeben – Material zurück ins Lager',t)}
   else if(p.tool==='hammer'&&p.hm==='demolish'){const ru=nearB(r.ru),bb=ru||nearB(r.b);if(!bb)tell(p,'Nichts zum Abreißen in der Nähe');else{bb.dm=(bb.dm||0)+1;used();if(bb.dm>=4)demolish(r,bb,!!ru);else tell(p,'Abriss '+bb.dm+'/4 …')}}
   else if(p.tool==='hammer'&&(t=nearB(r.cs,5))){siteFeed(r,t,p);if(siteHit(r,t,E,p))used()}
   else if(p.tool==='hammer'&&r.wells>0&&nearB(r.fires)){const fb=nearB(r.fires);fb.fire-=30;r.dirty=true}
   else if(p.tool==='hammer'){const ru=nearB(r.ru),bb=ru||nearB(r.b.filter(b=>b.hp<mh(b)));
    if(!bb)tell(p,'Nichts zu bauen oder zu reparieren in der Nähe (Hammer: Baustellen, Ruinen, beschädigte Gebäude)');
    else{const B=BD[bb.t],cost=frac(B.c,ru?.3:.06);if(!haveAll(r,p,cost))tell(p,'Material fehlt: '+costStr(cost));
     else{takeGoods(r,p,cost);used();if(ru){r.ru=r.ru.filter(o=>o!==bb);r.b.push({id:bb.id,t:bb.t,x:bb.x,z:bb.z,r:bb.r,hp:Math.round(mh({t:bb.t,st:bb.st})*.4),st:bb.st||0,lv:bb.lv||0,ext:bb.ext||0,v:bb.v|0,pendingTorture:!!bb.pendingTorture,tm:0});say(r,'🔨 '+BN[bb.t]+' wurde wieder aufgebaut',bb)}else bb.hp=Math.min(mh(bb),bb.hp+mh(bb)*.15);r.dirty=true}}}
   else if(p.tool==='sword'&&(t=f(r.e,2.8)||f(r.w,2.8))){t.hp-=Math.round(22*E);used()}
   else if(p.tool==='axe'&&(t=f(r.tr.filter(o=>o.st),3))){t.hp-=E;used();if(t.hp<=0){r.tr=r.tr.filter(o=>o!==t);bagAdd(r,p,'wood',2);r.dt=true;tell(p,'Wurzelstock mit der Axt entfernt (+2 Holz)')}}
   else if(p.tool==='axe'&&(t=f(r.tr.filter(o=>!o.st),3))){t.hp-=E;used();bagAdd(r,p,'wood',gain(1));if(t.hp<=0){t.st=1;t.rg=0;t.hp=3;bagAdd(r,p,'wood',gain(3));if(Math.random()<.7)drop(r,'stick',2+(Math.random()*3|0),t.x+.8,t.z+.5);r.dt=true}}
   else if(p.tool==='pickaxe'&&(t=f(r.tr.filter(o=>o.st),2.8))){t.hp-=E;used();if(t.hp<=0){r.tr=r.tr.filter(o=>o!==t);r.dt=true;tell(p,'Wurzelstock ausgegraben – hier wächst nie wieder ein Baum')}}
   else if(p.tool==='pickaxe'&&(t=f(r.rk,3))){if(t.ex)tell(p,'Dieses Vorkommen ist erschöpft – es erholt sich im Lauf eines Jahres');else{const m0=(p.tools.pickaxe||{}).m;t.hp-=m0==='wood'?.4:E;used();bagAdd(r,p,'stone',m0==='wood'?(Math.random()<.4?1:0):gain(1));if(t.hp<=0){t.ex=1;t.rg=0;bagAdd(r,p,'stone',gain(3));r.dt=true}}}
   else if(p.tool==='sword'&&(t=f(r.dr,3))){used();if(--t.hp<=0){r.dr=r.dr.filter(o=>o!==t);deerFall(r,t);tell(p,'🦌 Das Tier ist gefallen – mit E aufheben (Wildkadaver, 20 kg), beim Metzger zerlegen lassen oder im Inventar selbst zerlegen')}}
   else if(p.tool==='pickaxe'&&(t=nearB(r.b.filter(b=>b.t==='ironmine'||b.t==='coppermine')))){const k=t.t==='ironmine'?'iron':'copper';used();if(Math.random()<.35+.1*E){bagAdd(r,p,k,1);tell(p,'⛏ +1 '+GN[k])}p.food=Math.max(0,p.food-.3)}
   else if(p.tool==='hoe'&&(t=f(r.co,3.2))){r.co=r.co.filter(o=>o!==t);r.gr++;used();tell(p,'⚰ Leichnam mit der Feldhacke begraben');say(r,p.name+' hat einen Toten begraben',t)}
   else if(p.tool==='hoe'&&(t=f(r.b.filter(b=>b.t==='field'),4))){used();if(t.st===0&&season(r)===3)tell(p,'Im Winter wächst nichts');else if(t.st===0&&have(r,p,'wheat')>=1){takeGoods(r,p,{wheat:1});t.st=1;t.tm=0;t.pg=0;r.dirty=true}else if(t.st===3){bagAdd(r,p,'wheat',Math.round((6+2*r.tl.hoe)*E));bagAdd(r,p,'straw',3);t.st=0;r.dirty=true}}
   else if(p.tool==='hoe'&&(t=f(r.sw.filter(o=>o.g),3))){used();t.g=0;t.rg=0;r.dsw=true;bagAdd(r,p,'straw',gain(4))}
   else if(p.tool==='hoe'){const tr=f(r.tr.filter(o=>!o.st),3.2),now=Date.now();used();if(tr){if(now-(tr.hb||0)<60000)tell(p,'An diesem Baum ist nichts mehr zu finden – versuch es später');else{tr.hb=now;const n=1+(Math.random()<.4?1:0);bagAdd(r,p,'herbs',n);tell(p,'🌿 Kräuter und Blüten unter dem Baum gesammelt (+'+n+')')}}
    else if(Math.random()<.25){bagAdd(r,p,'herbs',1);tell(p,'🌼 Wildkräuter gefunden (+1)')}}}}
  else if(m.t==='pick')pickUp(r,p,m.id);
  else if(m.t==='gut'){if(!(p.bag.carcass>0))return tell(p,'Kein Wildkadaver im Rucksack');p.bag.carcass--;if(!p.bag.carcass)delete p.bag.carcass;bagAdd(r,p,'meat',2);bagAdd(r,p,'hides',1);p.bd=1;tell(p,'🔪 Wild zerlegt: 2 Fleisch, 1 Fell (der Metzger holt mehr heraus: 4 Fleisch)')}
  else if(m.t==='paint'){const b=r.b.find(b=>b.id===m.b);if(!b||dist(b,p)>30)return;b.col=Math.max(0,Math.min(11,m.c|0));r.dirty=true}
  else if(m.t==='herb')useHerb(r,p,m.id);
  else if(m.t==='xfer'){const C=r.b.find(b=>CONTAINERS.includes(b.t)&&dist(b,p)<Math.max(BD[b.t].w,BD[b.t].d)/2+6);if(!C)return tell(p,'Keine Truhe/Lager in der Nähe (Bergfried, Lagerhaus, Kornspeicher, Waffenkammer, Schmiede)');
   if(m.all){let n=0;for(const k of Object.keys(p.bag)){const q=p.bag[k];if(!q)continue;r.inv[k]=Math.min(stockCap(r),(r.inv[k]||0)+q);n+=q;delete p.bag[k]}p.bd=1;r.dirty=true;return tell(p,'📦 '+n+' Gegenstände eingelagert ('+BN[C.t]+')')}
   const k=String(m.k),q=Math.max(1,Math.min(999,m.n|0));if(!(k in GN))return;
   if(m.dir==='put'){const n=Math.min(q,p.bag[k]||0);if(!n)return;p.bag[k]-=n;if(!p.bag[k])delete p.bag[k];r.inv[k]=(r.inv[k]||0)+n;p.bd=1}
   else{const n=Math.min(q,Math.floor(r.inv[k]||0),roomFor(p,k));if(n<=0)return tell(p,(r.inv[k]||0)<1?'Nichts davon im Lager':'🎒 Zu schwer – Rucksack ist voll ('+Math.round(bagW(p))+'/'+BAG_MAX+' kg)');r.inv[k]-=n;p.bag[k]=(p.bag[k]||0)+n;p.bd=1}}
  else if(m.t==='drop'){const k=String(m.k),n=Math.min(Math.max(1,m.n|0),p.bag[k]||0);if(!n)return;p.bag[k]-=n;if(!p.bag[k])delete p.bag[k];p.bd=1;const st0=r.b.find(b=>b.t==='storage');if(st0&&!m.ground){r.inv[k]=(r.inv[k]||0)+n;tell(p,'📦 '+n+' '+GN[k]+' ins Lagerhaus gebracht');return}drop(r,k,n,p.x+Math.sin(p.ry||0)*1.1,p.z+Math.cos(p.ry||0)*1.1);tell(p,'⬇ '+n+' '+GN[k]+' abgelegt – liegt vor dir am Boden')}
  else if(m.t==='tcraft'){const R0=TOOLR[m.k];if(!R0)return;if(R0.at&&!r.b.some(b=>(b.t===R0.at||(R0.at==='bench'&&b.t==='smithy'))&&dist(b,p)<Math.max(BD[b.t].w,BD[b.t].d)/2+5))return tell(p,'Dafür brauchst du '+(R0.at==='bench'?'eine Werkbank (oder Schmiede)':'eine Schmiede')+' in der Nähe');
   if(!haveAll(r,p,R0.in))return tell(p,'Zu wenig Material: '+costStr(R0.in)+' (Rucksack + Lager)');takeGoods(r,p,R0.in);
   if(R0.tool){const old=p.tools[R0.tool];p.tools[R0.tool]={m:R0.m,d:DUR[R0.m]};tell(p,'🛠 '+R0.n+' hergestellt'+(old?' (ersetzt '+MATN[old.m]+'-'+TOOLN[R0.tool]+')':''))}
   else if(R0.shield){p.shields[R0.shield]=1;p.sh=R0.shield;tell(p,'🛡 '+R0.n+' hergestellt – mit Taste 9 zum Schwert tragen')}
   else{bagAdd(r,p,R0.good,R0.out);tell(p,'🪵 +'+R0.out+' '+GN[R0.good])}p.bd=1}
  else if(m.t==='shield'){if(m.k&&!p.shields[m.k])return tell(p,'Diesen Schild besitzt du nicht');p.sh=m.k||'';p.bd=1}
  else if(m.t==='mount'){if(!p.horse){if(r.gold<80)return;r.gold-=80;p.horse=1;say(r,p.name+' hat ein Pferd gekauft')}p.mt=!p.mt}
  else if(m.t==='eat'){const E=[['roast',50],['smoked',40],['bread',35],['sausage',35],['cheese',30],['meat',25],['honey',25],['fish',20],['apples',15]].find(([k])=>have(r,p,k)>=1);if(E){takeGoods(r,p,{[E[0]]:1});p.food=Math.min(100,p.food+E[1])}else if(have(r,p,'wheat')>=2){takeGoods(r,p,{wheat:2});p.food=Math.min(100,p.food+40)}}
  else if(m.t==='craft'&&RECIPE[m.k]){const R=RECIPE[m.k];if(!r.b.some(b=>b.t===R.at&&!b.off&&dist(b,p)<BD[b.t].w/2+6))return tell(p,'Dafür brauchst du '+(BN[R.at]||R.at)+' in der Nähe');
   if(!Object.entries(R.in).every(([k,n])=>inv(r,k)>=n))return tell(p,'Zu wenig Material: '+Object.entries(R.in).map(([k,n])=>n+' '+(GN[k]||k)).join(', '));
   give(r,R.in,-1);give(r,R.out);p.food=Math.max(0,p.food-1.5);tell(p,'✔ '+R.n+': '+Object.entries(R.out).map(([k,n])=>'+'+n+' '+(GN[k]||k)).join(', '));r.dirty=true}
  else if(m.t==='feed'){const b=r.b.find(b=>b.id===m.id),A=b&&ANIMAL[b.t];if(!A)return;if(dist(b,p)>14)return tell(p,'Geh näher an den Stall');const g=have(r,p,'straw')>=1?'straw':'wheat',n=Math.min(FEED_MAX-(b.feed||0),have(r,p,g),Math.max(1,+m.n|0||10));if(n<=0)return tell(p,(b.feed||0)>=FEED_MAX?'Die Futterkrippe ist voll':'Kein Stroh oder Weizen (Rucksack/Lager)');takeGoods(r,p,{[g]:n});b.feed=(b.feed||0)+n;tell(p,'🌾 Futterkrippe gefüllt: +'+n+' '+GN[g]+' ('+b.feed+'/'+FEED_MAX+')');r.dirty=true}
  else if(m.t==='buyanimal'){const b=r.b.find(b=>b.id===m.id),A=b&&ANIMAL[b.t];if(!A)return;if(!r.surv)return tell(p,'Tiere kaufen gibt es im Survival-Modus');if((b.an|0)>=A.max)return tell(p,'Der Stall ist voll ('+A.max+')');
   if(r.gold<A.cost)return tell(p,'Zu wenig Gold ('+A.cost+')');r.gold-=A.cost;b.an=(b.an|0)+1;say(r,'🐑 '+p.name+' hat ein '+A.n+' gekauft ('+b.an+'/'+A.max+') – jedes Tier frisst '+A.feed+' Weizen pro Tag aus der Futterkrippe');r.dirty=true}
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
  else if(m.t==='equip'){if(['none','torch'].includes(m.tool)||(TOOLN[m.tool]&&p.tools[m.tool]))p.tool=m.tool;else if(TOOLN[m.tool])tell(p,'Du besitzt kein(e) '+TOOLN[m.tool]+' – im Inventar (I) herstellen');p.bd=1}
  else if(m.t==='raidnow')raid(r)});
 ws.on('close',()=>{if(r&&p){r.bags[p.name]={bag:p.bag,tools:p.tools,shields:p.shields,sh:p.sh};r.pl.delete(p.id);for(const n of r.n)if(n.o===p.id){n.o=0;if(!NT[n.k].job){n.m='guard';n.p={x:n.x,z:n.z}}}save();say(r,p.name+' hat das Spiel verlassen')}})});
