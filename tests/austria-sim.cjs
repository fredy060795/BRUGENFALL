// Server-Simulation: Karawane über den Fluss (nur über Brücke, Maut), Herrscherbesuch, Türkenbelagerung, Zug zum Bahnhof.
// Startet einen eigenen Server auf einem freien Port mit leerem Spielstand und steuert ihn über WebSocket.
const {spawn}=require('child_process'),path=require('path'),fs=require('fs'),os=require('os'),WebSocket=require('ws');
const Rules=require('../public/rules.js');
const PORT=5600+Math.floor(Math.random()*300),SAVE=path.join(os.tmpdir(),'zr-test-'+PORT+'.json');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let fails=0;const ok=(c,msg)=>{console.log((c?'  ✔ ':'  ✘ ')+msg);if(!c)fails++};
const srv=spawn(process.execPath,[path.join(__dirname,'..','server.js')],{env:{...process.env,PORT:String(PORT),SAVE_FILE:SAVE},stdio:['ignore','pipe','pipe']});
let srvErr='';srv.stderr.on('data',d=>srvErr+=d);
function client(code,era){return new Promise((res,rej)=>{const ws=new WebSocket('ws://localhost:'+PORT);const st={ev:[],snap:null,hi:null,ws};
 ws.on('message',buf=>{const m=JSON.parse(buf);if(m.t==='hi')st.hi=m;else if(m.t==='ev')st.ev.push(m.m);else if(m.t==='s'){const keep=st.snap||{};st.snap=m;for(const k of['b','cv','e'])if(!m[k]&&keep[k])m[k]=keep[k]}});   // Listen kommen nur bei Änderungen mit
 ws.on('open',()=>ws.send(JSON.stringify({t:'join',name:'Tester',code,create:true,era,ch:[0,2,0,2,1,0,0,9,0,0,0,0]})));ws.on('error',rej);
 st.send=o=>ws.send(JSON.stringify(o));const t0=Date.now();(function wait(){if(st.hi&&st.snap)return res(st);if(Date.now()-t0>15000)return rej(new Error('kein hi'));setTimeout(wait,100)})()})}
const evHas=(st,re)=>st.ev.some(m=>re.test(m));
(async()=>{try{
 for(let i=0;i<60;i++){try{await new Promise((res,rej)=>{const w=new WebSocket('ws://localhost:'+PORT);w.on('open',()=>{w.close();res()});w.on('error',rej)});break}catch(e){await sleep(250)}}
 console.log('Karawane und Brücke (Barock)');
 const A=await client('TSTA','barock');const map=A.hi.map;Rules.setWorldConfig(map);A.send({t:'creative',on:1});await sleep(400);
 const towns=(map.towns||[]).filter(t=>t.k==='friend');ok(towns.length>0,'Welt hat befreundete Orte');
 const wetCount=(a,b)=>{const L=Math.hypot(b.x-a.x,b.z-a.z),n=Math.max(2,Math.ceil(L/2));let c=0,inW=false;for(let i=1;i<n;i++){const t=i/n,w=Rules.riverDist(a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t,map)<6;if(w&&!inW)c++;inW=w}return c};
 // Marktplatz suchen, den genau ein Handelsort nur über eine Flussquerung erreicht
 const spots=[];for(let zb=-140;zb<=140;zb+=4){const xb=Rules.riverX(zb,map);if(Rules.riverDist(xb,zb,map)<=4&&Rules.riverDist(xb-14,zb,map)>6&&Rules.riverDist(xb+14,zb,map)>6)spots.push({xb,zb})}
 const viaBridge=(T,M)=>spots.some(({xb,zb})=>{const e1={x:xb-14,z:zb},e2={x:xb+14,z:zb},[p,q]=Math.hypot(T.x-e1.x,T.z-e1.z)<Math.hypot(T.x-e2.x,T.z-e2.z)?[e1,e2]:[e2,e1];return wetCount(T,p)===0&&wetCount(q,M)===0});
 const cands=[];for(let x=-120;x<=120;x+=20)for(let z=-120;z<=120;z+=20){if(Rules.riverDist(x,z,map)<14)continue;const M={x,z:z+A.hi.bd.market.d/2+3.5},t=towns.find(t=>wetCount(t,M)>0&&viaBridge(t,M));if(t)cands.push({x,z,t})}
 ok(cands.length>0,'Kandidaten für einen Markt jenseits des Flusses gefunden ('+cands.length+')');
 let placed=null;A.send({t:'build',k:'keep',x:cands[0]?cands[0].x+18:0,z:cands[0]?cands[0].z+18:0,r:0});await sleep(400);
 for(const c of cands.slice(0,25)){A.send({t:'build',k:'market',x:c.x,z:c.z,r:0});await sleep(300);const mk=(A.snap.b||[]).find(d=>d[1]==='market');if(mk){placed=c;break}}
 if(!placed)console.log('   Meldungen:',A.ev.slice(-4).join(' | '));ok(!!placed,'Markt jenseits des Flusses gebaut (Handelsort '+(placed?placed.t.n:'-')+')');
 if(placed){const mk=(A.snap.b||[]).find(d=>d[1]==='market'),mpt={x:mk[2],z:mk[3]+A.hi.bd.market.d/2+3.5},
   crosses=(a,b)=>{const L=Math.hypot(b.x-a.x,b.z-a.z),n=Math.max(2,Math.ceil(L/2));for(let i=1;i<n;i++){const t=i/n;if(Rules.riverDist(a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t,map)<6)return true}return false},
   needs=nm=>{const t=towns.find(t=>t.n===nm);return t?wetCount(t,mpt)>0:false},townOf=m=>{const r=m.match(/aus (.+?) (ist unterwegs|kommen nicht)/);return r?r[1]:''},
   watch=async(ms,br)=>{let wet=0,onB=0,seen=0;const t0=Date.now();while(Date.now()-t0<ms){await sleep(200);for(const c of(A.snap.cv||[]).filter(c=>c[1]==='caravan')){seen++;const d=Rules.riverDist(c[2],c[3],map),inB=br&&Math.abs(c[2]-br[2])<=12.6&&Math.abs(c[3]-br[3])<=2.6;if(d<6&&!inB)wet++;if(inB)onB++}if(evHas(A,/eingetroffen/))break}return{wet,onB,seen}};
  if(process.env.DBG)console.log('   DBG markt',mpt,towns.map(t=>t.n+'('+t.x+','+t.z+')='+needs(t.n)).join(' '),'rd(markt)',Rules.riverDist(mpt.x,mpt.z,map).toFixed(1));
  ok(towns.some(t=>needs(t.n)),'mindestens ein Handelsort liegt jenseits des Flusses');
  // ohne Brücke: Orte jenseits des Flusses schicken keine Karawane, sondern melden „Brücke bauen“
  let wrong=0,blocked=0,falseBlock=0;for(let i=0;i<10;i++){A.ev.length=0;A.send({t:'evnow',k:'caravan'});await sleep(250);const m=A.ev.find(m=>/Handelskarawane aus|nicht über den Fluss/.test(m))||'',n=townOf(m);
   if(/nicht über den Fluss/.test(m)){blocked++;if(!needs(n)){falseBlock++;if(process.env.DBG){const t=towns.find(t=>t.n===n);let mn=1e9;for(let k=0;k<=100;k++){const x=t.x+(mpt.x-t.x)*k/100,z=t.z+(mpt.z-t.z)*k/100;mn=Math.min(mn,Rules.riverDist(x,z,map))}console.log('   DBG blockiert',n,'minDist',mn.toFixed(2),'markets',JSON.stringify((A.snap.b||[]).filter(d=>d[1]==='market').map(d=>[d[2],d[3]])))}}}else if(n&&needs(n))wrong++}
  ok(wrong===0,'ohne Brücke kommt keine Karawane über den Fluss');ok(falseBlock===0,'Orte auf derselben Seite werden nicht blockiert');ok(blocked>0,'Hinweis „Brücke bauen“ erscheint');
  const w0=await watch(3000);ok(w0.wet===0,'Karawanen bleiben ohne Brücke an Land');
  A.ev.length=0;let br=null;{const T=placed.t,opts=[];for(let zb=-140;zb<=140;zb+=2){const xb=Rules.riverX(zb,map);if(Rules.riverDist(xb,zb,map)>4)continue;const e1={x:xb-14,z:zb},e2={x:xb+14,z:zb},[p,q]=Math.hypot(T.x-e1.x,T.z-e1.z)<Math.hypot(T.x-e2.x,T.z-e2.z)?[e1,e2]:[e2,e1];
    if(wetCount(T,p)===0&&wetCount(q,mpt)===0)opts.push({xb,zb,L:Math.hypot(T.x-p.x,T.z-p.z)+Math.hypot(q.x-mpt.x,q.z-mpt.z)})}opts.sort((a,b)=>a.L-b.L);if(process.env.DBG)console.log('   DBG Brückenorte',opts.length,JSON.stringify(opts.slice(0,3)),'Ort',T.n,T.x,T.z,'Markt',mpt);
   for(const o of opts.slice(0,12)){A.send({t:'build',k:'bridge',x:o.xb,z:o.zb,r:0});await sleep(350);br=(A.snap.b||[]).find(d=>d[1]==='bridge');if(br)break}}
  if(!br&&process.env.DBG)console.log('   DBG',A.ev.slice(-3).join(' | '));ok(!!br,'Brücke über den Fluss gebaut');
  if(br){let res={wet:0,onB:0,seen:0},crossed=0,toll=0,arr=0;for(let i=0;i<12&&!crossed;i++){A.ev.length=0;A.send({t:'evnow',k:'caravan'});await sleep(250);const m=A.ev.find(m=>/Handelskarawane aus|nicht über den Fluss/.test(m))||'';if(process.env.DBG)console.log('   DBG nach Brücke:',m,'Brücke',br[2],br[3],br[4]);if(!/über die Brücke/.test(m)){await watch(1500,br);continue}
     const r2=await watch(60000,br);res.wet+=r2.wet;res.onB+=r2.onB;res.seen+=r2.seen;crossed++;if(evHas(A,/Brückenmaut/))toll++;if(evHas(A,/eingetroffen/))arr++}
   ok(crossed>0,'Karawane von jenseits des Flusses nimmt die Brücke (Route angekündigt)');ok(res.wet===0,'Karawane nie im Wasser außerhalb der Brücke ('+res.wet+' von '+res.seen+')');ok(res.onB>0,'Karawane fährt sichtbar über die Brücke');ok(toll>0,'Brückenmaut wird gezahlt');ok(arr>0,'Karawane erreicht den Markt')}}
 console.log('Herrscherbesuch und Türkenbelagerung');
 A.ev.length=0;A.send({t:'evnow',k:'visit'});await sleep(500);ok(evHas(A,/Maria Theresia besucht/),'Kaiserin Maria Theresia besucht die Stadt');
 const e0=(A.snap.e||[]).length;A.send({t:'evnow',k:'siege'});await sleep(800);ok(evHas(A,/1683/),'Türkenbelagerung 1683 wird ausgerufen');ok((A.snap.e||[]).length>=e0+8,'Osmanisches Heer greift mit mindestens 8 Gegnern an');
 A.ws.close();
 console.log('Eisenbahn (Neuzeit)');
 const B=await client('TSTB','neuzeit');B.send({t:'creative',on:1});await sleep(300);const bm=B.hi.map;Rules.setWorldConfig(bm);let st=null;
 for(const z of[-60,-30,30,60,0]){const x=Rules.riverX(z,bm)-40;B.send({t:'build',k:'keep',x:x-20,z:z+25,r:0});await sleep(250);B.send({t:'build',k:'station',x,z,r:0});await sleep(350);st=(B.snap.b||[]).find(d=>d[1]==='station');if(st)break}
 ok(!!st,'Bahnhof gebaut');if(st){B.ev.length=0;B.send({t:'evnow',k:'train'});let arrived=false;const t0=Date.now();while(Date.now()-t0<60000){await sleep(250);if(evHas(B,/im Bahnhof eingefahren/)){arrived=true;break}}
  ok(arrived,'Zug fährt im Bahnhof ein');const tr=(B.snap.cv||[]).find(c=>c[1]==='train');ok(!!tr&&Math.hypot(tr[2]-st[2],tr[3]-st[3])<4,'Zug hält am Bahnsteig')}
 B.ws.close();
}catch(e){console.error(e);fails++}
 srv.kill();try{fs.unlinkSync(SAVE)}catch(e){}if(srvErr.trim())console.log('Server-Fehlerausgabe:\n'+srvErr.slice(0,800));
 console.log(fails?'\n'+fails+' Prüfung(en) fehlgeschlagen.':'\nAlle Österreich-/Handelsprüfungen bestanden.');process.exit(fails?1:0)})();
