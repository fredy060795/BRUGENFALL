// Rundumtest aller Epochen im echten Browser-Client:
// startet einen Testserver, betritt eine Frei-Bau-Welt und baut in jeder der 10 Epochen
// jedes Gebäude des Katalogs (alle Ausbaustufen), alle Figurenrollen, Schiff, Marktplatz-Feste und Feuerwehr.
// Jeder Fehler (Exception, Konsolenfehler, Seitenfehler) wird gemeldet; Exitcode 1 bei Fehlern.
// Aufruf: node tests/eras-browser.cjs   (Chromium über Playwright; PW_CHROME setzt den Browserpfad)
const {spawn}=require('child_process'),path=require('path'),fs=require('fs'),os=require('os');
let chromium;try{({chromium}=require('playwright'))}catch(e){({chromium}=require('/opt/node-tools/node_modules/playwright'))}
const ROOT=path.join(__dirname,'..'),PORT=5300+Math.floor(Math.random()*400),SAVE=path.join(os.tmpdir(),'zeitreise-eratest-'+PORT+'.json');
const CHROME=process.env.PW_CHROME||(fs.existsSync('/opt/pw-browsers/chromium-1194/chrome-linux/chrome')?'/opt/pw-browsers/chromium-1194/chrome-linux/chrome':undefined);
const HOOK=`;window.__eraTest=async(eras)=>{const out={errors:[],counts:{}};const roles=['sword','spear','archer','crossbow','knight','peasant','farmer','trader','priest','bandit','hunter','smith','cook','child'];
 if(!Object.keys(CATd).length)out.errors.push('Gebäudekatalog leer – Beitritt fehlgeschlagen');
 for(const e of eras){ERA=e;setPeopleEra(e);setToolEra(e);try{applyEraMaterials(HD,e)}catch(x){out.errors.push(e+' Materialien: '+x.message)}let n=0;
  for(const k of Object.keys(CATd)){for(let lv=0;lv<=(k==='keep'?3:1);lv++){try{const g=piece(k,lv);if(!g)throw new Error('kein Modell');n++}catch(x){out.errors.push(e+' Gebäude '+k+' Stufe '+lv+': '+x.message)}}}
  for(const r of roles){try{man(0,'sword',r,7);n++}catch(x){out.errors.push(e+' Figur '+r+': '+x.message)}}
  try{const p=look(3,'player',[0,1,0,1,1,0,3,5,4,3,1,1],1);createCharacter(0,'sword',{person:p});n++}catch(x){out.errors.push(e+' Spielerfigur: '+x.message)}
  try{shipMesh();n++}catch(x){out.errors.push(e+' Schiff: '+x.message)}
  try{const pz=piece('plaza');for(const ev of['maypole','circus','tree','tourney','burn','hang',0]){pz.setPlaza&&pz.setPlaza(ev);n++}}catch(x){out.errors.push(e+' Marktplatz-Fest: '+x.message)}
  try{const F=fireBrigade(e,()=>0,FOUNT_SPRAY);F.update(.1,[0,0,0,1,4,4]);n++}catch(x){out.errors.push(e+' Feuerwehr: '+x.message)}
  out.counts[e]=n;await new Promise(r=>setTimeout(r,0))}
 return out};</script></body>`;
(async()=>{let srv,b,fail=0;
 try{srv=spawn(process.execPath,['server.js'],{cwd:ROOT,env:{...process.env,PORT:String(PORT),SAVE_FILE:SAVE},stdio:['ignore','pipe','pipe']});let slog='';srv.stdout.on('data',d=>slog+=d);srv.stderr.on('data',d=>slog+=d);
  await new Promise(r=>setTimeout(r,1500));
  // Welt per WebSocket anlegen (Frei-Bau), dann im Browser beitreten
  await new Promise((res,rej)=>{const WS=require(path.join(ROOT,'node_modules','ws')),ws=new WS('ws://localhost:'+PORT);let me=0;ws.on('error',rej);
   ws.on('open',()=>ws.send(JSON.stringify({t:'join',fc:1,coa:0,name:'Bau',code:'ERATEST',create:true,wname:'Epochentest'})));
   ws.on('message',d=>{const m=JSON.parse(d);if(m.id&&!me){me=1;ws.send(JSON.stringify({t:'creative',on:true}));ws.send(JSON.stringify({t:'save'}));setTimeout(()=>{ws.close();res()},600)}})});
  b=await chromium.launch({executablePath:CHROME,args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
  const p=await b.newPage({viewport:{width:800,height:500}}),errs=[];p.on('pageerror',e=>errs.push('Seitenfehler: '+String(e)));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|GL Driver|GPU stall|WebGL/.test(m.text()))errs.push('Konsole: '+m.text())});
  await p.route('**/',async r=>{const res=await r.fetch();let t=await res.text();t=t.replace(/<\/script>\s*<\/body>/,HOOK);await r.fulfill({response:res,body:t,headers:{...res.headers(),'content-type':'text/html'}})});
  await p.goto('http://localhost:'+PORT+'/');await p.waitForTimeout(1500);
  await p.evaluate(()=>{document.getElementById('gm').click();document.getElementById('name').value='Test';document.getElementById('code').value='ERATEST';document.getElementById('jn').click()});
  await p.waitForFunction(()=>document.getElementById('hud')&&document.getElementById('hud').textContent.includes('Code'),null,{timeout:60000}).catch(()=>{});
  await p.waitForTimeout(4000);
  const eras=JSON.parse(require('child_process').execFileSync(process.execPath,['-e',"console.log(JSON.stringify(require('./public/rules.js').ERAS.map(e=>e.id)))"],{cwd:ROOT}).toString());
  const res=await p.evaluate(e=>window.__eraTest(e),eras);
  for(const e of eras)console.log(('  '+e).padEnd(20),String(res.counts[e]||0).padStart(4),'Modelle gebaut');
  const all=[...res.errors,...errs];if(/Error|TypeError/.test(slog))all.push('Server: '+slog.split('\n').filter(l=>/Error/.test(l)).slice(0,3).join(' | '));
  if(all.length){fail=1;console.log('\nFEHLER ('+all.length+'):');for(const x of all.slice(0,40))console.log(' - '+x)}else console.log('\nAlle Epochen fehlerfrei.')}
 catch(e){fail=1;console.log('Testabbruch:',e.message)}
 finally{if(b)await b.close();if(srv)srv.kill();try{fs.unlinkSync(SAVE)}catch(e){}process.exit(fail)}})();
