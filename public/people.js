// Eigene prozedurale Gesichter, Frisuren und Kleidung (keine Daten aus anderen Spielen)
import * as T from 'three';
import {surfaceMaterial} from './materials.js';
function rng(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const pick=(r,a)=>a[Math.floor(r()*a.length)];
const SKIN=[0xf0c8a8,0xe3b08d,0xd49a77,0xc08a68,0xa66e4f,0x8a5a3f],HAIR=[0x1c1410,0x2b1d12,0x4a3320,0x6b4a2a,0x8c6a3c,0xb08a4c,0xc9a45e,0x777067,0x9b4a24],EYE=[0x3a2a1c,0x5a4025,0x3c5a7a,0x4d6b47,0x6a6a60];
const WOOL=[0x8b7355,0x6b5a45,0x7a6a50,0x9a8767,0x5e5a4a,0x7b4b32,0x4d5a3a,0x5a4a3a,0x7a6a8a],DYE=[0x6a2a2a,0x2f4a6a,0x3d5a35,0x7a5a2a,0x5a3a5a];
const MALE=['Hakon','Magnus','Istvan','Pedro','Branko','Ivan','Erik','Markus','Kristian','Pjotr','Herik','Jan','Hans','Matthias','Ulrich','Konrad','Tomas','Wenzel'],FEMALE=['Helen','Elisabeth','Maria','Agnes','Katharina','Margit','Johanka','Sophie','Ludmila','Greta'];
const JR={cook:{head:'cap',apron:1,tool:'none',cloth:0xe8e2d0,title:'Bäcker'},smith:{head:'none',apron:1,tool:'hammer',cloth:0x4a403a,title:'Schmied',beard:'full'},minter:{head:'cap',apron:1,tool:'hammer',cloth:0x5a3a2a,title:'Münzer',beard:'short'},priest:{outfit:'dress',head:'none',tool:'none',cloth:0x3a2f28,title:'Priester'},
 watch:{head:'hood',tool:'none',cloth:0x3a3430,title:'Nachtwächter',beard:'full'},healer:{head:'scarf',outfit:'dress',tool:'none',cloth:0x6a7a4a,title:'Heilerin',female:1,bag:1},keeper:{head:'none',apron:1,tool:'none',title:'Wirt',beard:'short'},shepherd:{head:'strawhat',tool:'hoe',title:'Hirte'},
 weaver:{head:'scarf',outfit:'dress',tool:'none',title:'Weberin',female:1},fisher:{head:'cap',tool:'hoe',title:'Fischer',cloth:0x5a6a7a},gravedigger:{head:'hunterhat',tool:'hoe',cloth:0x3a3430,title:'Totengräber'},miner:{head:'cap',tool:'pickaxe',cloth:0x555555,title:'Bergmann'},miller:{head:'cap',apron:1,tool:'none',cloth:0xeeeeee,title:'Müller'},tanner:{head:'none',apron:1,tool:'none',cloth:0x6a4a2a,title:'Gerber'},hangman:{head:'hood',tool:'none',cloth:0x2a2420,cloak:0x1c1a18,mask:1,title:'Henker'},trader:{head:'hunterhat',tool:'none',cloak:0x6a2a2a,title:'Händler',bag:1}};
const TITLE={child:'Kind',peasant:'Dorfbewohner',sword:'Soldat',archer:'Bogenschütze',spear:'Lanzenträger',crossbow:'Armbrustschütze',knight:'Ritter',watch:'Nachtwächter',bandit:'Bandit',farmer:'Bauer',wood:'Holzfäller',hunter:'Jäger',mason:'Steinmetz',player:''};
// Fraktionsfarben (Spieler wählt beim Beitritt) – Grundfarbe der Kleidung und aller eigenen Soldaten
export const FACTIONS=[['Rot',0x8a2a24],['Blau',0x2a4a8a],['Grün',0x3a6a2a],['Gelb',0xc8a030],['Violett',0x5a2a6a],['Orange',0xc06a20],['Weiß',0xd8d4c8],['Schwarz',0x2a2826],['Türkis',0x2a7a7a],['Braun',0x6a4a2a],['Rosa',0xc87a8a],['Grau',0x7a7a7a]];
export const PAL=[0x8b7355,0x6b5a45,0x7a6a50,0x9a8767,0x5e5a4a,0x7b4b32,0x4d5a3a,0x5a4a3a,0x7a6a8a,0x6a2a2a,0x2f4a6a,0x3d5a35,0xd8cfb8,0x2b2622],CLOAKS=[0,0x6a2a2a,0x2f4a6a,0x3d5a35,0x2b2622,0x6a4a2a];
export const OPT={skin:['Sehr hell','Hell','Mittel','Gebräunt','Braun','Dunkel'],hair:['Schwarz','Dunkelbraun','Braun','Kastanie','Hellbraun','Blond','Goldblond','Grau','Rot'],
 hsM:[['short','Kurz'],['long','Lang'],['bald','Glatze'],['braid','Zopf']],hsF:[['long','Lang'],['braid','Zopf'],['bun','Dutt'],['short','Kurz']],
 beard:[['none','Rasiert'],['stubble','Dreitagebart'],['short','Kurzer Bart'],['full','Vollbart']],civ:['Tunika / Kleid','Wams'],
 civHead:['Keine','Kappe','Kopftuch','Strohhut','Chaperon','Federhut','Jägerhut','Gugel','Gugel mit langem Zipfel','Gugel (abgelegt, Zaddelkragen)'],
 pal:['Hellbraun','Braun','Sand','Beige','Graugrün','Rotbraun','Moosgrün','Dunkelbraun','Violett','Rot','Blau','Grün','Weiß','Schwarz'],
 armor:['Keine Rüstung','Gambeson','Kettenhemd','Plattenharnisch (Ritter)','Gambeson + Brustpanzer','Waffenrock, Brustplatte, Kettenzeug (Ritter)','Wappenrock über Plattenharnisch (Ritter)','Wappenrock über Kettenhemd'],
 armHead:['Kein Helm','Eisenhut','Kettenhaube','Schaller','Visierhelm (Klappvisier)','Hundsgugel (Klappvisier)','Nasalhelm'],
 cloak:['Kein Umhang','Rot','Blau','Grün','Schwarz','Braun']};
// Index: 0 gender,1 skin,2 hairStyle,3 hairColor,4 beard,5 outfit,6 cloth,7 belt,8 civHead,9 armor,10 armHead,11 cloak
export const PROF_MAX=[1,5,3,8,3,1,13,13,9,7,6,5];
export const defProf=g=>g?[1,1,0,5,0,0,5,10,2,0,0,0]:[0,2,0,2,1,0,0,9,0,0,0,0];
function playerLook(id,P,fc){const r=rng(id*7919+99),A=k=>Math.max(0,Math.min(PROF_MAX[k],P[k]|0)),f=!!A(0),hs=(f?OPT.hsF:OPT.hsM)[A(2)][0],bd=f?'none':OPT.beard[A(4)][0];
 const civHeads=['none','cap','scarf','strawhat','chaperon','plume','hunterhat','gugel','gugelL','gugelD'];
 let outfit=A(5)===1?'jerkin':(f?'dress':'tunic'),head=civHeads[A(8)]||'none';if(!f&&head==='scarf')head='cap';
 const ar=A(9);if(ar)outfit='gambeson';const knight=ar===3||ar===6;let hoodDown=false;if(head==='gugelD'){head='none';hoodDown=true}
 let mailHood=false;const armH=A(10);
 if(armH===1)head='helmet';else if(armH===2){head='hood';mailHood=true}else if(armH===3)head='sallet';else if(armH===4)head='visored';else if(armH===5)head='bascinet';else if(armH===6)head='nasal';
 const lt=h=>new T.Color(h).multiplyScalar(1.5).getHex();
 return{seed:id*31+7,role:'player',female:f,skin:SKIN[A(1)],hair:HAIR[A(3)],eye:pick(r,EYE),nose:.7+r()*.6,chin:r(),hairStyle:hs,beard:bd,cloth:lt(PAL[A(6)]),over:lt(PAL[A(7)]),outfit,head,cloak:A(11)?lt(CLOAKS[A(11)]):0,apron:false,mask:false,mailHood,bag:ar===0,rolled:ar===0,tool:'sword',name:'',title:'',mailShirt:ar===2||ar===5||ar===7,breast:[3,4,5,6].includes(ar),arms:knight?2:ar===5?1:0,legs:knight||ar===5?2:ar===7?1:0,hands:knight||ar===5?'hour':ar===7?'lea':0,rank:knight||ar===5?'veteran':undefined,tabard:ar===6||ar===7,hood:hoodDown?'cowl':undefined,dag:hoodDown,hoodCol:lt(PAL[A(7)]),...(FACTIONS[fc]?{cloth:FACTIONS[fc][1],over:ar?FACTIONS[fc][1]:lt(PAL[A(7)]),fac:FACTIONS[fc][1]}:{})}}
// ---------- Individuelle Looks je Beruf (eigener Zufallsstrom -> Namen bleiben stabil) ----------
const PW={brown:[0x6b5a45,0x5a4a3a,0x7a6a50,0x4a3d30],grey:[0x6a6660,0x7a7670,0x5a5650],nat:[0x9a8767,0x8b7d64,0xa89878],green:[0x4d5a3a,0x3d4a30,0x5a6a42],
 blue:[0x3a4a5a,0x2f4a6a,0x4a5a6a],red:[0x6a2a2a,0x7b4b32,0x5a2a24],white:[0xd8d2c4,0xe2dccb,0xcfc8b6],dark:[0x3a3430,0x2b2622,0x4a3d30,0x3a3a30]};
function style(o,r){const R=o.role,P=a=>a[Math.floor(r()*a.length)],ch=p=>r()<p,f=o.female,mix=(...k)=>k.flatMap(x=>PW[x]);
 Object.assign(o,{dirt:0,acc:[],shins:null,hood:null,build:ch(.15)?'stout':'normal',patches:0,sleeves:'full'});
 const wraps=p=>{if(ch(p)){o.shins='wraps';o.wrapCol=P(mix('nat','brown','grey'))}};
 switch(R){
 case'child':Object.assign(o,{outfit:f?'dress':'tunic',tool:'none',bag:false,beard:'none',apron:false,cloak:0,head:P(['none','none','coifL','cap']),hairStyle:f?P(['braid','long','bun']):P(['short','short','long']),
   cloth:P(mix('nat','red','blue','green')),rolled:ch(.4),dirt:.15,patches:Math.floor(r()*2),title:'Kind'});wraps(.3);break;
 case'priest':{const ord=P(['ben','fran','cist','dom']);Object.assign(o,{outfit:'robe',sleeves:'wide',tool:'none',bag:false,apron:false,head:'none',cloak:0,rolled:false,
   cloth:{ben:0x1e1c1a,fran:0x5a4632,cist:0xd8d2c4,dom:0xd8d2c4}[ord],scap:{ben:0x1e1c1a,fran:null,cist:0x1e1c1a,dom:0xd8d2c4}[ord],belt:ord==='fran'||ch(.5)?'rope':'leather',
   ropeCol:ord==='fran'?0xd8cfb8:0x2a2420,beltCol:0x2a2018,hoodCol:ord==='dom'?0x1e1c1a:null,build:ch(.3)?'stout':'normal',title:ord==='fran'?'Franziskaner':ord==='ben'?'Benediktiner':ord==='cist'?'Zisterzienser':'Dominikaner'});
  if(o.hoodCol==null)o.hoodCol=o.cloth;if(ch(.3))o.head='hood';else o.hood='cowl';if(!f){o.hairStyle=ch(.8)?'tonsure':'bald';o.beard=P(['none','none','short','full'])}
  if(ch(.75))o.acc.push('cross');if(ch(.6))o.acc.push('rosary');if(ch(.4))o.acc.push('book');break}
 case'cook':Object.assign(o,{outfit:f?'dress':'tunic',cloth:P(PW.white),apron:'bib',apronCol:P([0xe8e2d0,0xd8cfb8,0xf0ece0]),rolled:true,build:ch(.4)?'stout':'normal',
   head:f?P(['coifL','scarf']):P(['bakercap','bakercap','coifL','cap','none']),butcher:ch(.3),dirt:.08});if(o.butcher){o.apron='smith';o.apronCol=0x5a3e28;o.title='Metzger'}if(ch(.5))o.acc.push('towel');wraps(.3);break;
 case'fisher':Object.assign(o,{outfit:'smock',cloth:P([0x4a5a5a,0x5a5a3a,0x6a6040,0x3a4a5a]),shins:'waders',rolled:ch(.5),head:P(['southwester','southwester','cap','none']),hatCol:P([0x5a5a3a,0x6a5a2a,0x3a3a30]),dirt:.12});
  if(o.head!=='southwester'&&ch(.5)){o.hood='cowl';o.hoodCol=P(mix('brown','grey'))}o.acc.push('creel');if(ch(.6))o.acc.push('net');if(ch(.3))o.acc.push('rope');break;
 case'smith':Object.assign(o,{outfit:'tunic',cloth:P(mix('dark','grey')),apron:'smith',apronCol:0x4a3222,rolled:true,head:P(['none','skullcap','none','coifL']),capCol:P(PW.dark),dirt:.45,build:ch(.35)?'stout':'normal'});
  if(!f)o.beard=P(['full','short','full']);o.acc.push('tongs');break;
 case'healer':Object.assign(o,{outfit:'dress',cloth:P([0x5a6a4a,0x6a6a5a,0x4a5a6a,0x6a5a4a]),apron:'herb',apronCol:P([0x7a8a5a,0x8a8a6a,0xd8d2c4]),head:P(['wimple','wimple','coifL','scarf']),veil:P([0x2a2830,0x3a4a6a,0x5a4a3a])});
  o.acc.push('herbs');if(ch(.4))o.acc.push('rosary');break;
 case'hunter':Object.assign(o,{outfit:'jerkin',cloth:P(mix('brown','green')),over:P([0x4a5a3a,0x5a4a32,0x3d4a30,0x6a5236]),hoodCol:P(mix('green','brown')),liri:ch(.5),
   head:P(['hood','hunterhat','none','hood']),shins:ch(.5)?'boots':null,cloak:ch(.3)?P([0x4d5a3a,0x3d4a30]):0});if(o.head!=='hood'&&ch(.4))o.hood='cowl';if(!o.shins)wraps(1);
  if(ch(.4)){o.acc.push('pelt');o.furCol=P([0x5a4632,0x6a5a46,0x3a3028,0x7a6a5a])}break;
 case'wood':Object.assign(o,{outfit:ch(.6)?'vest':'tunic',cloth:P(mix('red','nat','brown')),vestCol:P([0x5a3e28,0x4a3a2a,0x6a4a32]),rolled:ch(.7),head:P(['cap','hood','none','coifL']),hoodCol:P(mix('brown','grey','green')),
   dirt:.22,patches:Math.floor(r()*3)});if(!f)o.beard=P(['full','short','full','stubble']);wraps(.9);if(ch(.5))o.acc.push('rope');break;
 case'mason':Object.assign(o,{outfit:'tunic',cloth:P(PW.grey),apron:'half',apronCol:0x5a3e28,head:P(['cap','coifL','none']),rolled:ch(.6),dirt:.32});wraps(.7);o.acc.push('chisel');break;
 case'miller':Object.assign(o,{outfit:'tunic',cloth:P(PW.white),apron:'half',apronCol:0xe8e2d0,head:P(['coifL','cap','bakercap']),dirt:.06,rolled:ch(.5)});wraps(.6);break;
 case'miner':Object.assign(o,{outfit:'jerkin',cloth:P(PW.dark),over:P([0x4a3a2a,0x3a2e24]),head:'hood',hoodCol:P(PW.dark),dirt:.55});wraps(.8);break;
 case'shepherd':Object.assign(o,{outfit:f?'dress':'tunic',cloth:P(PW.nat),cloak:ch(.7)?P([0x8b7d64,0x9a8767,0x6b5a45]):0,head:P(['strawhat','hood','none']),hoodCol:P(PW.nat),liri:ch(.3),bag:true});wraps(.8);break;
 case'weaver':Object.assign(o,{outfit:'dress',cloth:P([0x6a2a2a,0x2f4a6a,0x7a5a2a,0x5a3a5a,0x3d5a35]),apron:'half',apronCol:P([0xe8e2d0,0xd8cfb8]),head:P(['coifL','scarf','coifL'])});o.acc.push('spindle');break;
 case'tanner':Object.assign(o,{outfit:'tunic',cloth:P(PW.brown),apron:'smith',apronCol:0x5a3e28,rolled:true,dirt:.4,head:P(['none','cap','skullcap'])});wraps(.6);break;
 case'keeper':Object.assign(o,{outfit:f?'dress':'tunic',cloth:P(mix('nat','red','blue')),apron:'bib',apronCol:0xe8e2d0,build:ch(.6)?'stout':'normal',rolled:ch(.5),head:P(['none','cap','coifL'])});o.acc.push('keys');break;
 case'gravedigger':Object.assign(o,{outfit:'tunic',cloth:P(PW.dark),head:'hood',hoodCol:P(PW.dark),ragged:true,dirt:.6,patches:2+Math.floor(r()*2)});wraps(1);break;
 case'hangman':Object.assign(o,{outfit:'vest',cloth:0x1e1c1a,vestCol:0x2a2018,head:'exec',rolled:true,mask:false});break;
 case'trader':Object.assign(o,{outfit:'gown',cloth:P([0x6a2a2a,0x2f4a6a,0x3d5a35,0x5a3a5a,0x7a5a2a]),furCol:P([0x5a4632,0x3a2e24,0xd8cfb8]),head:P(['chaperon','plume','hunterhat']),build:ch(.5)?'stout':'normal',cloak:0,beltCol:0x3a2418});
  o.acc.push('purse');if(ch(.5))o.acc.push('keys');break;
 case'farmer':case'peasant':if(f){if(ch(.5)){o.apron='half';o.apronCol=P([0xe8e2d0,0xb0a080])}}else{o.patches=Math.floor(r()*3);o.rolled=ch(.5)}o.dirt=.2;wraps(.6);break;
 case'bandit':{const rk=r()<.15?'leader':P(['cutthroat','poacher','brute']);Object.assign(o,{rank:rk,rust:true,ragged:true,dirt:.45,patches:1+Math.floor(r()*3),cloth:P(PW.dark),over:P([0x2a2420,0x4a3a2a,0x3a3a30,0x4a3020]),
   outfit:P(['jerkin','vest','tunic']),vestCol:P([0x3a2a1e,0x4a3a2a]),cloak:ch(.5)?P([0x2b2622,0x3a3028,0x4a2a24]):0,mask:ch(.6),maskCol:P([0x2a2420,0x5a2a24,0x4a4a3a]),
   head:P(['hood','hood','none','skullcap']),hoodCol:P(PW.dark),liri:ch(.4),beard:P(['stubble','full','short','stubble']),bag:false,title:''});wraps(.6);if(ch(.25)){o.acc.push('pelt');o.furCol=P([0x3a3028,0x5a4632])}
  if(rk==='brute'){Object.assign(o,{outfit:'gambeson',over:P([0x4a3a2a,0x3a3430,0x5a4a32]),head:P(['helmet','nasal','hood']),mailHood:ch(.5),build:'stout',mask:false,hands:'lea'})}
  if(rk==='leader'){Object.assign(o,{outfit:'gambeson',over:P([0x4a2a24,0x2a2420]),breast:true,head:P(['nasal','helmet']),mailHood:true,cloak:0x5a2420,mask:false,hands:'lea',legs:ch(.5)?1:0})}
  if(rk==='poacher'){o.head='hood';o.liri=true;o.hoodCol=P(PW.green)}
  o.title={leader:'Bandenführer',brute:'Schläger',poacher:'Wilderer',cutthroat:'Halsabschneider'}[rk];break}}
 if(o.patches&&!['tunic','dress','jerkin','vest','smock'].includes(o.outfit))o.patches=0}
import {eraClothes} from './eras.js';
let ERA='hochmittelalter';export const setPeopleEra=e=>{ERA=e||'hochmittelalter'};
export function look(id,role,prof,fc){if(role==='player'&&prof)return playerLook(id,prof,fc);const r=rng(id*7919+13+role.length*101);
 const jr=JR[role],female=role==='farmer'||role==='peasant'||role==='child'?r()<.5:jr&&jr.female?true:(jr&&['cook','keeper','shepherd','fisher'].includes(role)?r()<.35:role==='player'?(id>0&&r()<.4):false);
 const o={seed:id*31+7,role,female,skin:pick(r,SKIN),hair:pick(r,HAIR),eye:pick(r,EYE),nose:.7+r()*.6,chin:r(),
  hairStyle:female?pick(r,['long','braid','bun']):pick(r,['short','short','bald','long']),beard:female?'none':pick(r,['none','stubble','stubble','short','full']),
  cloth:pick(r,WOOL),over:pick(r,DYE),outfit:'tunic',head:'none',cloak:0,apron:false,mask:false,bag:r()<.45,rolled:true,tool:'sword'};
 if(role==='sword'){Object.assign(o,{outfit:'gambeson',head:'helmet',over:pick(r,[0x7a2a2a,0x2f4a6a,0x8a7a5a]),rolled:false,beard:pick(r,['none','stubble','short']),hairStyle:'short',rank:pick(r,['militia','guard','veteran'])});
  const lv=o.rank==='militia'?0:o.rank==='guard'?1:2;Object.assign(o,{head:lv?'bascinet':'helmet',breast:true,arms:lv,legs:lv,hands:lv===2?'hour':'lea',bag:false})}
 if(role==='archer'){Object.assign(o,{tool:'bow',outfit:'jerkin',head:'helmet',cloth:0x4d5a3a,over:0x5a3d22,cloak:0x3d5a35,rank:pick(r,['scout','marksman'])});o.mailHood=o.rank==='marksman';o.noCoif=o.rank!=='marksman'}
 if(role==='spear'){Object.assign(o,{tool:'spear',outfit:'gambeson',head:'helmet',breast:pick(r,[true,false]),arms:1,legs:0,hands:'lea',bag:false,rolled:false,hairStyle:'short',beard:pick(r,['none','stubble','short'])})}
 if(role==='crossbow'){Object.assign(o,{tool:'crossbow',outfit:'gambeson',head:pick(r,['helmet','sallet']),cloak:0x4a4030,arms:0,legs:0,hands:'lea',bag:true,rolled:false,hairStyle:'short'})}
 if(role==='knight'){Object.assign(o,{tool:'lance',outfit:'gambeson',head:pick(r,['visored','bascinet','visored','sallet']),breast:true,arms:2,legs:2,hands:'hour',bag:false,rolled:false,hairStyle:'short',beard:'short',cloak:pick(r,[0x6a2a2a,0,0]),tabard:r()<.55,mailShirt:r()<.4})}
 if(role==='bandit'){Object.assign(o,{outfit:'jerkin',head:'hood',mask:true,cloth:0x3a3430,over:0x2a2420,cloak:0x2b2622,beard:'stubble'})}
 if(role==='peasant'){o.tool='none';o.outfit=female?'dress':'tunic';o.head=female?pick(r,['scarf','none','none']):pick(r,['none','cap','none'])}
 if(role==='farmer'){o.head=female?'scarf':'strawhat';o.outfit=female?'dress':'tunic';o.tool='hoe';if(female)o.cloth=pick(r,[0x7b4b32,0x6b5a45,0x7a6a50,0x5a4a3a])}
 if(role==='wood'){o.head='cap';o.tool='axe';o.beard=pick(r,['short','full','stubble'])}
 if(role==='hunter'){o.head='hunterhat';o.tool='bow';o.cloak=0x4d5a3a;o.cloth=0x5a4a3a}
 if(role==='mason'){o.head='cap';o.apron=true;o.tool='pickaxe';o.cloth=0x8a8a84}
 if(role==='player'){o.outfit='jerkin';o.cloth=0x8f7651;o.over=0x5a3d22;if(female){o.outfit='dress';o.head='none'}}
 if(jr){Object.assign(o,{outfit:jr.outfit||(female?'dress':'tunic'),head:jr.head,tool:jr.tool,apron:!!jr.apron,cloak:jr.cloak||0,mask:!!jr.mask});if(jr.bag)o.bag=true;if(jr.cloth)o.cloth=jr.cloth;if(jr.beard&&!female)o.beard=jr.beard}
 if(female&&role!=='farmer'&&o.outfit==='tunic')o.outfit='dress';
 style(o,rng(id*131+role.length*17+5));const stT=o.title;eraClothes(o,ERA,rng(id*577+role.length*13+3));if(female&&o.outfit==='tunic'&&role!=='farmer'&&role!=='peasant'&&role!=='bandit')o.outfit='dress';
 const lt=h=>new T.Color(h).multiplyScalar(1.5).getHex();o.cloth=lt(o.cloth);o.over=lt(o.over);if(o.cloak)o.cloak=lt(o.cloak);for(const k of['hoodCol','scap','apronCol','furCol','maskCol','vestCol','wrapCol','veil','capCol','hatCol','beltCol'])if(o[k]!=null)o[k]=lt(o[k]);
 o.name=(female?pick(r,FEMALE):pick(r,MALE));o.title=jr?(female&&!/in$/.test(jr.title)?(jr.title==='Hirte'?'Hirtin':jr.title+'in'):jr.title):(female&&(role==='farmer'||role==='peasant')?(role==='farmer'?'Bäuerin':'Dorfbewohnerin'):TITLE[role]);if(o.role==='sword'&&o.rank==='veteran')o.title='Ritter';if(stT)o.title=stT;
 if(o.eraTitle)o.title=o.eraTitle;
 const F=FACTIONS[fc];if(F){o.fac=F[1];if(['sword','spear','crossbow','knight'].includes(role))o.over=F[1];if(role==='knight')o.cloak=F[1];if(role==='archer'){o.cloth=F[1];o.cloak=new T.Color(F[1]).multiplyScalar(.75).getHex();if(o.hoodCol)o.hoodCol=F[1]}if(role==='player'){o.cloth=F[1];o.over=F[1];if(o.cloak)o.cloak=new T.Color(F[1]).multiplyScalar(.8).getHex()}}
 return o}
const ssm=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t)};
const G=(x,y,cx,cy,sx,sy)=>Math.exp(-(((x-cx)/sx)**2+((y-cy)/sy)**2));
function headGeo(o){const geo=new T.SphereGeometry(1,40,30),P=geo.attributes.position,N=P.count,col=new Float32Array(N*3);geo.setAttribute('u',P.clone());
 const sk=new T.Color(o.skin),hr=new T.Color(o.hair),rose=new T.Color(0xc4605a),lip=new T.Color(o.female?0xb85a5a:0xa5584f),shade=new T.Color(0x6a4030),c=new T.Color();
 for(let i=0;i<N;i++){const x=P.getX(i),y=P.getY(i),z=P.getZ(i),f=Math.max(0,z),jt=Math.max(0,(-y-.05)/.95);
  let X=x*.9*(1-jt*(o.female?.46:.34)),Y=y*1.16,Z=z*1.02*(1-jt*.12);
  Z+=f*(.22*o.nose*G(x,y,0,-.14,.12,.3)+.06*o.nose*G(x,y,0,-.34,.2,.07)+.07*G(x,y,0,.3,.6,.1)+.05*(G(x,y,.5,-.2,.25,.22)+G(x,y,-.5,-.2,.25,.22))+.04*G(x,y,0,-.55,.3,.08)+.07*o.chin*G(x,y,0,-.9,.28,.14)-.055*(G(x,y,.36,.14,.17,.09)+G(x,y,-.36,.14,.17,.09))-.025*G(x,y,0,-.46,.32,.025));
  P.setXYZ(i,X,Y,Z);
  c.copy(sk).lerp(rose,Math.min(.5,.28*(G(x,y,.5,-.2,.3,.22)+G(x,y,-.5,-.2,.3,.22))*f+.1*G(x,y,0,-.14,.1,.1)*f));
  c.lerp(shade,.3*(G(x,y,.36,.02,.2,.08)+G(x,y,-.36,.02,.2,.08))*f);c.lerp(lip,.9*G(x,y,0,-.52,.28,.085)*f);c.lerp(shade,.55*G(x,y,0,-.3,.15,.06)*f);
  if(o.beard!=='none')c.lerp(hr,(o.beard==='stubble'?.3:.5)*ssm(-.1,-.55,y)*ssm(-.3,.2,z)*(1-G(x,y,0,-.52,.3,.09))*(.8+.2*Math.sin(x*60+y*50)));
  col[i*3]=c.r;col[i*3+1]=c.g;col[i*3+2]=c.b}
 geo.setAttribute('color',new T.BufferAttribute(col,3));geo.computeVertexNormals();return geo}
function shell(geo,test,off,noise=.03){const P=geo.attributes.position,U=geo.attributes.u,Nn=geo.attributes.normal,ix=geo.index.array,ok=new Uint8Array(P.count),pos=[],uv=[],idx=[],map=new Map();
 for(let i=0;i<P.count;i++)ok[i]=test(U.getX(i),U.getY(i),U.getZ(i))?1:0;
 const ang=i=>Math.atan2(U.getX(i),U.getZ(i));
 const get=(i,w)=>{const key=i*2+w;if(map.has(key))return map.get(key);const k=pos.length/3,x=U.getX(i),y=U.getY(i),z=U.getZ(i),n=off+noise*(Math.sin(x*23+y*7)*Math.cos(z*19+x*5)*.5+.5);
  pos.push(P.getX(i)+Nn.getX(i)*n,P.getY(i)+Nn.getY(i)*n,P.getZ(i)+Nn.getZ(i)*n);let a=ang(i);if(w&&a<0)a+=2*Math.PI;uv.push(a*1.4,y*1.62);map.set(key,k);return k};
 for(let t=0;t<ix.length;t+=3){const a=ix[t],b=ix[t+1],c=ix[t+2];if(!(ok[a]&&ok[b]&&ok[c]))continue;const A=[ang(a),ang(b),ang(c)],w=Math.max(...A)-Math.min(...A)>Math.PI?1:0;idx.push(get(a,w),get(b,w),get(c,w))}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('color',new T.Float32BufferAttribute(new Float32Array(pos.length).fill(1),3));g.setIndex(idx);g.computeVertexNormals();return g}
const mesh=(geo,mat,par,p=[0,0,0],s=[1,1,1])=>{const m=new T.Mesh(geo,mat);m.userData.pp=1;m.position.set(...p);m.scale.set(...s);par.add(m);return m};
const lathe=(par,mat,pts,s,p=[0,0,0])=>mesh(new T.LatheGeometry(pts.map(([r,y])=>new T.Vector2(r,y)),20),mat,par,p,s);
function canvasMat(kind,color){const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,64,64);
 if(kind==='quilt'){x.strokeStyle='rgba(60,40,30,.55)';x.lineWidth=2;for(let i=0;i<=64;i+=16){x.beginPath();x.moveTo(0,i);x.lineTo(64,i);x.stroke()}for(let i=-64;i<=64;i+=16){x.beginPath();x.moveTo(i,0);x.lineTo(i+64,64);x.stroke()}}
 else{x.fillStyle='#b4babd';x.fillRect(0,0,64,64);x.strokeStyle='#ffffff';x.lineWidth=1.4;for(let j=0;j<8;j++)for(let i=0;i<8;i++){x.beginPath();x.arc(i*8+(j%2)*4,j*8,3.2,0,6.3);x.stroke()}}
 const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(3,3);t.colorSpace=T.SRGBColorSpace;return new T.MeshStandardMaterial({map:t,color,roughness:kind==='mail'?.45:.95,metalness:kind==='mail'?.6:0})}
// ===================== GAMBESON: körperangepasstes, modelliertes Steppgewand =====================
// Eine durchgehende Oberfläche folgt dem Körperprofil. Jede Steppbahn ist als Wulst in die Geometrie
// modelliert (Naht = eingezogen, Bahn = aufgepolstert) – kein Abstand, keine losen Ringe.
// Feintuning: GB.ch = Bahnbreite, GB.amp = Polsterhöhe, GB_SLEEVE = Ärmelradien.
const GB={y0:.5,ch:.036,amp:.011,teeth:12,cols:96,dy:.0065};
const GB_SLEEVE={up:[.074,.064],low:[.063,.054],ch:.03,amp:.0065};
// Körperprofil: [Höhe y, Radius seitlich, Tiefenfaktor vorn/hinten]
const GBP=[[.40,.315,.8],[.55,.305,.8],[.72,.275,.8],[.88,.235,.79],[.97,.21,.74],[1.02,.196,.7],[1.15,.198,.68],[1.28,.218,.68],[1.36,.242,.68],[1.40,.245,.7],[1.44,.215,.74],[1.47,.15,.8],[1.49,.105,.9],[1.51,.093,.95],[1.60,.09,.95]];
const wrapA=a=>Math.atan2(Math.sin(a),Math.cos(a));
function gbProf(y){const P=GBP,n=P.length;if(y<=P[0][0])return[P[0][1],P[0][2]];if(y>=P[n-1][0])return[P[n-1][1],P[n-1][2]];
 let i=0;while(y>P[i+1][0])i++;const p0=P[Math.max(i-1,0)],p1=P[i],p2=P[i+1],p3=P[Math.min(i+2,n-1)],t=(y-p1[0])/(p2[0]-p1[0]);
 const cr=k=>{const a=p0[k],b=p1[k],c=p2[k],d=p3[k];return b+.5*t*(c-a+t*(2*a-5*b+4*c-d+t*(3*(b-c)+d-a)))};return[cr(1),cr(2)]}
// gezackter Saum (Zaddeln) unten, Stehkragen oben (vorn tiefer, damit das Kinn frei bleibt)
const gbHem=a=>{let f=((a/(2*Math.PI))*GB.teeth+.5)%1;if(f<0)f+=1;return .575-.07*(1-Math.abs(2*f-1))};
const gbTop=a=>1.56-.065*Math.max(0,Math.cos(a))**2;
function gbSurf(a,y){const[r,d]=gbProf(y),ca=Math.cos(a),sa=Math.sin(a),fr=Math.max(0,ca);
 const chest=1+.07*Math.exp(-(((y-1.26)/.09)**2))*fr*fr;                       // gepolsterte Brust
 const sd=c=>Math.exp(-((wrapA(a-c)/.055)**2)),seam=1-.8*Math.max(sd(Math.PI/2),sd(-Math.PI/2),sd(Math.PI)); // Seiten-/Rückennähte
 let t=((y-GB.y0)/GB.ch)%1;if(t<0)t+=1;const q=Math.pow(Math.sin(Math.PI*t),.5);  // Profil einer Steppbahn
 const amp=GB.amp*(y>1.47?.55:1),aa=Math.abs(a),pk=1-ssm(.085,.12,aa),pe=Math.exp(-(((aa-.1)/.012)**2)); // Knopfleiste vorn
 const disp=amp*q*seam*(1-pk)+.008*pk-.003*pe,shade=(.58+.42*q)*(.75+.25*seam)*(1-pk)+.97*pk-.25*pe;
 return[(r+disp)*sa,(r*d*chest+disp)*ca,Math.max(.3,shade)]}
function gridGeo(pos,col,uv,idx){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g}
let GBGEO=null,GBBTN=null,GBLIN=null;
function gbGeo(){if(GBGEO)return GBGEO;const C=GB.cols,y1=.5,y2=1.57,R=Math.ceil((y2-y1)/GB.dy),pos=[],col=[],uv=[],idx=[];
 for(let j=0;j<=R;j++){const yr=y1+j*(y2-y1)/R;for(let i=0;i<=C;i++){const a=-Math.PI+2*Math.PI*i/C,y=Math.min(Math.max(yr,gbHem(a)),gbTop(a)),[x,z,s]=gbSurf(a,y);pos.push(x,y,z);col.push(s,s,s);uv.push(i/C*6,y*6)}}
 for(let j=0;j<R;j++)for(let i=0;i<C;i++){const A=j*(C+1)+i,B=A+1,Cc=A+C+1,D=Cc+1;idx.push(A,B,Cc,B,D,Cc)}
 GBGEO=gridGeo(pos,col,uv,idx);const Rl=Math.ceil((.8-y1)/((y2-y1)/R)),n=(Rl+1)*(C+1);   // Futter nur am Rock (nur dort sichtbar)
 GBLIN=gridGeo(pos.slice(0,n*3),col.slice(0,n*3),uv.slice(0,n*2),idx.slice(0,Rl*C*6));GBBTN=[];
 for(let y=GB.y0+GB.ch*.5;y<gbTop(0)-.008;y+=GB.ch){if(y<gbHem(0)+.02)continue;GBBTN.push([0,y,gbSurf(0,y)[1]+.004])}  // ein Knopf pro Steppbahn
 return GBGEO}
// Ärmel: gesteppte Röhre entlang -y, optional mit Schulterkappe, unten Manschette
const TUBE=new Map();
function quiltTube(L,r0,r1,cap,ampO){const key=[L,r0,r1].map(v=>v.toFixed(3)).join()+cap+ampO;if(TUBE.has(key))return TUBE.get(key);
 const C=32,top=cap?.05:.015,bot=-L-.012,R=Math.ceil((top-bot)/.006),{ch}=GB_SLEEVE,amp=ampO??GB_SLEEVE.amp,pos=[],col=[],uv=[],idx=[];
 for(let j=0;j<=R;j++){const y=top-j*(top-bot)/R,u=Math.min(1,Math.max(0,-y/L));let r=r0+(r1-r0)*u;if(y>0&&cap)r*=Math.sqrt(Math.max(0,1-(y/top)**2));
  const cf=ssm(-L+.034,-L+.026,y);let t=((-y)/ch)%1;if(t<0)t+=1;const q=Math.pow(Math.sin(Math.PI*t),.5);
  for(let i=0;i<=C;i++){const a=Math.PI+2*Math.PI*i/C,sm=1-.7*Math.exp(-((wrapA(a-Math.PI)/.2)**2)),
   disp=(y>0?amp*.4:amp*q*sm)*(1-cf)+.005*cf,rr=r+disp,s=Math.max(.3,(.6+.4*q)*(.8+.2*sm)*(1-cf)+.95*cf);
   pos.push(rr*Math.sin(a),y,rr*Math.cos(a));col.push(s,s,s);uv.push(i/C*2,y*6)}}
 for(let j=0;j<R;j++)for(let i=0;i<C;i++){const A=j*(C+1)+i,B=A+1,Cc=A+C+1,D=Cc+1;idx.push(A,Cc,B,B,Cc,D)}
 const g=gridGeo(pos,col,uv,idx);TUBE.set(key,g);return g}
const QM=new Map(),BTN_GEO=new T.SphereGeometry(1,8,6),GB_LIN=new T.MeshStandardMaterial({color:0xe6dfcc,roughness:1,side:T.BackSide}),GB_BTN=new T.MeshStandardMaterial({color:0x1d1712,roughness:.55});
function quiltMat(c){if(!QM.has(c)){const m=surfaceMaterial('linen',c,[3,3]).clone();m.vertexColors=true;m.needsUpdate=true;QM.set(c,m)}return QM.get(c)}
function buildGambeson(g,o){const geo=gbGeo();mesh(geo,quiltMat(o.over),g);mesh(GBLIN,GB_LIN,g);  // Außenstoff + helles Futter innen
 const im=new T.InstancedMesh(BTN_GEO,GB_BTN,GBBTN.length),m4=new T.Matrix4(),q=new T.Quaternion(),sc=new T.Vector3(.0115,.0115,.007);
 GBBTN.forEach((p,k)=>im.setMatrixAt(k,m4.compose(new T.Vector3(...p),q,sc)));g.add(im)}
function gambesonSleeves(g,o){const m=quiltMat(o.over),v=new T.Vector3(),down=new T.Vector3(0,-1,0);g.updateMatrixWorld(true);
 const rel=(par,ch)=>{if(par&&ch){ch.getWorldPosition(v);par.worldToLocal(v);const l=v.length();if(l>.12&&l<.5)return v.clone()}return new T.Vector3(0,-.28,0)};
 for(const s0 of[g.right,g.left]){if(!s0||!s0.elbow)continue;const s=s0.shoulder||s0,{elbow:E0,wrist:W0}=s0;const side=Math.sign(s.position.x)||1,ue=rel(s,E0),fw=rel(E0,W0);
  const up=new T.Group();up.quaternion.setFromUnitVectors(down,ue.clone().normalize());s.add(up);mesh(quiltTube(ue.length()+.025,...GB_SLEEVE.up,true),m,up);
  const lo=new T.Group();lo.quaternion.setFromUnitVectors(down,fw.clone().normalize());E0.add(lo);const L=fw.length(),lg=quiltTube(L,...GB_SLEEVE.low,false);mesh(lg,m,lo);mesh(lg,GB_LIN,lo);
  for(let k=0;k<3;k++)mesh(BTN_GEO,GB_BTN,lo,[side*(GB_SLEEVE.low[1]+.009),-L+.012+k*.024,0],[.005,.008,.008])}}  // Knöpfe am Ärmelschlitz
function fittedBelt(g,o,M){const gb=o.outfit==='gambeson',P=gb?GBP:o.outfit==='dress'?DRP:TUP,y=gb?(o.breast?.78:.935):o.outfit==='dress'?.975:.945,
  ex=gb?GB.amp+.0045+(o.breast?.03:0):o.outfit==='jerkin'?.0175:.0065,h=o.outfit==='dress'?.018:.034,[r,d]=genProf(P,y),rx=r+ex,rz=r*d+ex,st=M.steel,
  bm=gb?M.leather:new T.MeshStandardMaterial({color:o.over,roughness:1,side:T.DoubleSide});
 mesh(new T.CylinderGeometry(1,1,h,56,1,true),bm,g,[0,y,0],[rx,1,rz]);
 mesh(new T.TorusGeometry(h*.5,.004,5,14),st,g,[0,y,rz+.006],[1.15,1,1]);
 if(!gb)return;for(let k=0;k<14;k++){const a=(k+.5)/14*2*Math.PI;if(Math.abs(wrapA(a))<.35)continue;mesh(BTN_GEO,st,g,[Math.sin(a)*(rx+.002),y,Math.cos(a)*(rz+.002)],[.006,.006,.006])}
 const yb=y-.2,[r2,d2]=gbProf(yb),a0=new T.Vector3(.02,y-.012,rz+.004),b0=new T.Vector3(.032,yb,r2*d2+ex+.004),dv=b0.clone().sub(a0);  // herabhängendes Riemenende
 const sp=mesh(new T.BoxGeometry(.026,dv.length(),.005),M.leather,g);sp.position.copy(a0.clone().add(b0).multiplyScalar(.5));sp.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),dv.clone().normalize());
 for(const f of[.3,.55,.8]){const p=a0.clone().lerp(b0,f);mesh(BTN_GEO,st,g,[p.x,p.y,p.z+.004],[.006,.006,.004])}}
// ===============================================================================================
// ===================== RÜSTUNG & KLEIDUNG v2 – alles körperangepasst, aus Einzelelementen =====================
const genProf=(P,y)=>{const n=P.length;if(y<=P[0][0])return[P[0][1],P[0][2]];if(y>=P[n-1][0])return[P[n-1][1],P[n-1][2]];
 let i=0;while(y>P[i+1][0])i++;const p0=P[Math.max(i-1,0)],p1=P[i],p2=P[i+1],p3=P[Math.min(i+2,n-1)],t=(y-p1[0])/(p2[0]-p1[0]);
 const cr=k=>{const a=p0[k],b=p1[k],c=p2[k],d=p3[k];return b+.5*t*(c-a+t*(2*a-5*b+4*c-d+t*(3*(b-c)+d-a)))};return[cr(1),cr(2)]};
const smax=(a,b,k)=>(a+b+Math.sqrt((a-b)**2+k*k))/2;
const SH_X=.255;   // seitliche Lage der Schultergelenke (für Kragen/Umhang, die über die Schultern fallen)
const shoulderEnv=(y,a)=>Math.abs(Math.sin(a))**3*(SH_X+.085)*(y<1.41?1:Math.sqrt(Math.max(0,1-((y-1.41)/.115)**2)));   // runde Schulterlinie
const GEO=new Map(),cg=(k,f)=>{if(!GEO.has(k))GEO.set(k,f());return GEO.get(k)};
// Parametrische Fläche F(u,v) -> [x,y,z,shade?]  (u nach rechts, v nach unten)
function paramGeo(F,nu,nv){const pos=[],col=[],uv=[],idx=[];
 for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){const p=F(i/nu,j/nv),s=p[3]??1;pos.push(p[0],p[1],p[2]);col.push(s,s,s);uv.push(i/nu,j/nv)}
 for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){const A=j*(nu+1)+i,B=A+1,C=A+nu+1,D=C+1;idx.push(A,C,B,B,C,D)}return gridGeo(pos,col,uv,idx)}
const ellP=(A,B,C,yc,th,ph,o=0)=>[(A+o)*Math.sin(th)*Math.sin(ph),yc+(B+o)*Math.cos(th),(C+o)*Math.sin(th)*Math.cos(ph)];
const projE=(p,A,B,C,yc)=>{const x=p[0],y=p[1]-yc,z=p[2],k=1/Math.sqrt((x/A)**2+(y/B)**2+(z/C)**2);return[x*k,yc+y*k,z*k]};
const RIV_GEO=new T.SphereGeometry(1,6,4);
function rivets(par,mat,pts,r,sc=[1,1,1]){const im=new T.InstancedMesh(RIV_GEO,mat,Math.max(1,pts.length)),m4=new T.Matrix4(),q=new T.Quaternion(),s=new T.Vector3(r*sc[0],r*sc[1],r*sc[2]);
 im.count=pts.length;pts.forEach((p,k)=>im.setMatrixAt(k,m4.compose(new T.Vector3(...p),q,s)));par.add(im);return im}
function tube(par,mat,pts,r,closed=false){const cv=new T.CatmullRomCurve3(pts.map(p=>new T.Vector3(p[0],p[1],p[2])),closed);return mesh(new T.TubeGeometry(cv,Math.max(8,pts.length*3),r,6,closed),mat,par)}
// Hutmaterialien: Strohgeflecht, Filz, Stoff, Federn, Gold
const HATM=new Map();function hatMat(kind,col){const key=kind+':'+(col|0);if(HATM.has(key))return HATM.get(key);let m;
 if(kind==='straw'){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');x.fillStyle='#c9a858';x.fillRect(0,0,128,128);for(let r=0;r<16;r++)for(let q=0;q<16;q++){const odd=(r+q)%2;x.fillStyle=odd?'#e0c070':'#b8963e';x.fillRect(q*8+(odd?0:1),r*8+(odd?1:0),odd?8:6,odd?6:8)}x.strokeStyle='rgba(90,60,20,.35)';for(let r=0;r<=16;r++){x.beginPath();x.moveTo(0,r*8);x.lineTo(128,r*8);x.stroke()}
  const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(10,3);t.colorSpace=T.SRGBColorSpace;m=new T.MeshStandardMaterial({map:t,roughness:1,side:T.DoubleSide})}
 else if(kind==='gold')m=new T.MeshStandardMaterial({color:0xc9a84a,roughness:.4,metalness:.6});
 else m=new T.MeshStandardMaterial({color:col,roughness:kind==='feather'?.8:.95,side:T.DoubleSide});HATM.set(key,m);return m}
const ring=(par,mat,r,y,tk=.06,sz=1)=>{const m=mesh(cg('ring'+tk,()=>new T.TorusGeometry(1,tk,5,24)),mat,par,[0,y,0],[r,r*sz,r]);m.rotation.x=Math.PI/2;return m};
// ---------- Kettengeflecht: tausende Einzelringe (4-in-1) als Textur + Relief ----------
const MAIL_T=.093;  // Weltgröße einer Texturkachel (16 Ringe) -> Ringdurchmesser ca. 6 mm
let MAILTEX=null;const MM=new Map();
function mailTex(){if(MAILTEX)return MAILTEX;const S=256,N=16,st=S/N,c=document.createElement('canvas');c.width=c.height=S;const x=c.getContext('2d');
 x.fillStyle='#121416';x.fillRect(0,0,S,S);
 for(let j=-1;j<=2*N+1;j++)for(let i=-1;i<=N;i++){const cx=(i+(j&1?.5:0))*st,cy=j*st*.5,rot=j&1?.38:-.38;
  x.save();x.translate(cx,cy);x.rotate(rot);
  x.lineWidth=st*.24;x.strokeStyle='#08090a';x.beginPath();x.ellipse(0,st*.03,st*.4,st*.3,0,0,6.283);x.stroke();
  x.lineWidth=st*.14;x.strokeStyle='#9aa1a5';x.beginPath();x.ellipse(0,0,st*.4,st*.3,0,0,6.283);x.stroke();
  x.lineWidth=st*.05;x.strokeStyle='#eef2f4';x.beginPath();x.ellipse(0,-st*.02,st*.4,st*.3,0,3.5,5.9);x.stroke();x.restore()}
 const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return MAILTEX=t}
function mailMat(rx=1,ry=1){const k=rx.toFixed(2)+'/'+ry.toFixed(2);if(!MM.has(k)){const t=mailTex().clone();t.repeat.set(rx,ry);t.needsUpdate=true;
 MM.set(k,new T.MeshStandardMaterial({map:t,bumpMap:t,bumpScale:1.2,color:0xc9cfd3,metalness:.75,roughness:.42,side:T.DoubleSide}))}return MM.get(k)}
// ---------- Materialien ----------
const AM=new WeakMap(),GM=new Map();
function armMats(M){if(AM.has(M))return AM.get(M);const ds=m=>{const c=m.clone();c.side=T.DoubleSide;return c};
 const st=ds(M.steel),st2=ds(M.steel);if(st2.color)st2.color.multiplyScalar(.62);
 const A={st,st2,brass:new T.MeshStandardMaterial({color:0xb48a3c,metalness:.85,roughness:.35,side:T.DoubleSide}),hole:new T.MeshBasicMaterial({color:0x070707,side:T.DoubleSide}),
  lea:ds(M.leather),mail:mailMat(1,1)};AM.set(M,A);return A}
function rustMats(M){const A=armMats(M);if(A.rust)return A.rust;const r=new T.MeshStandardMaterial({color:0x7a5a42,metalness:.45,roughness:.8,side:T.DoubleSide}),r2=new T.MeshStandardMaterial({color:0x4a3a2c,metalness:.4,roughness:.85,side:T.DoubleSide});
 A.rust={...A,st:r,st2:r2,mail:new T.MeshStandardMaterial({map:mailTex(),bumpMap:mailTex(),bumpScale:1.2,color:0x8a6a50,metalness:.5,roughness:.7,side:T.DoubleSide})};return A.rust}
function garMat(kind,c){const k=kind+c;if(!GM.has(k)){const m=surfaceMaterial(kind,c,[3,3]).clone();m.vertexColors=true;m.side=T.DoubleSide;m.needsUpdate=true;GM.set(k,m)}return GM.get(k)}
// ---------- Generischer Kleidungs-Generator: Fläche folgt dem Körperprofil ----------
const fr_=a=>Math.max(0,Math.cos(a));
function gPt(S,a,y){const[r,d]=genProf(S.P,y),fr=Math.max(0,Math.cos(a)),ch=1+(S.chest||0)*Math.exp(-(((y-1.26)/(S.chestW||.1))**2))*fr*fr;let[dp,sh]=S.disp(a,y);
 if(S.dirt)sh*=1-S.dirt*dirtN(a,y)*(.35+.65*ssm(1.2,.4,y));const bel=(S.belly||0)*Math.exp(-(((y-1.04)/.15)**2))*fr*fr;
 let rx=r+dp;const rz=r*d*ch+dp+bel;if(S.sh!=null)rx=smax(rx,shoulderEnv(y,a)+S.sh,.02);return[rx*Math.sin(a),y,rz*Math.cos(a),sh]}
function garment(key,S){return cg('gm'+key,()=>{const C=S.cols||96,a0=S.a0??-Math.PI,a1=S.a1??Math.PI,R=Math.ceil((S.y2-S.y1)/(S.dy||.006)),pos=[],col=[],uv=[],idx=[];
 for(let j=0;j<=R;j++){const yr=S.y2-j*(S.y2-S.y1)/R;for(let i=0;i<=C;i++){const a=a0+(a1-a0)*i/C,y=Math.min(Math.max(yr,S.hem(a)),S.top(a)),p=gPt(S,a,y);
  pos.push(p[0],p[1],p[2]);col.push(p[3],p[3],p[3]);uv.push((a+Math.PI)/(2*Math.PI)*6,y*6)}}
 for(let j=0;j<R;j++)for(let i=0;i<C;i++){const A=j*(C+1)+i,B=A+1,Cc=A+C+1,D=Cc+1;idx.push(A,Cc,B,B,Cc,D)}return gridGeo(pos,col,uv,idx)})}

// Körperprofile [y, Radius seitlich, Tiefenfaktor]
const TUP=[[.40,.32,.82],[.5,.30,.82],[.62,.285,.82],[.75,.265,.8],[.88,.235,.78],[.95,.212,.74],[1.0,.2,.7],[1.15,.198,.68],[1.28,.216,.68],[1.36,.24,.68],[1.4,.243,.7],[1.44,.212,.74],[1.47,.15,.8],[1.5,.1,.9],[1.56,.09,.95]];
const DRP=[[-.05,.37,.86],[.03,.36,.86],[.25,.33,.85],[.5,.285,.83],[.75,.24,.8],[.9,.215,.76],[.97,.2,.72],[1.02,.192,.69],[1.15,.198,.68],[1.28,.222,.70],[1.36,.24,.69],[1.4,.243,.7],[1.44,.212,.74],[1.47,.15,.8],[1.5,.1,.9],[1.56,.09,.95]];
// Tunika: Falten unter dem Gürtel, Stoff bauscht über dem Gürtel
const TUNIC={P:TUP,y1:.49,y2:1.5,chest:.03,dy:.009,cols:80,hem:a=>.52+.012*Math.sin(a*3+1),top:a=>1.475-.03*fr_(a)**3,
 disp:(a,y)=>{const fa=.011*ssm(.9,.55,y),f=Math.sin(a*13+Math.sin(a*4)*1.5+y*3),bl=.007*Math.exp(-(((y-.985)/.028)**2))*(.6+.4*Math.sin(a*9)),pn=Math.exp(-(((y-.94)/.012)**2));
  return[.004+fa*(.5+.5*f)+bl-.003*pn,1-.24*(fa/.011)*(.5-.5*f)-.18*pn]}};
// Wams: senkrecht gesteppt, Knopfleiste, ausgestellter Schoß
const JERK={P:TUP,y1:.7,y2:1.52,chest:.04,dy:.01,cols:112,hem:a=>.735+.01*Math.sin(a*2),top:a=>1.5-.03*fr_(a)**2,
 disp:(a,y)=>{let t=(((a+Math.PI)/(2*Math.PI))*28)%1;const q=Math.pow(Math.sin(Math.PI*t),.5),aa=Math.abs(a),pk=1-ssm(.05,.075,aa),pl=.022*ssm(.96,.74,y),sm=Math.exp(-(((y-.965)/.008)**2));
  return[.012+.0045*q*(1-pk)*(1-ssm(1.46,1.49,y))+pl+.003*pk-.003*sm,Math.max(.35,(.72+.28*q)*(1-pk)+.95*pk-.3*sm)]}};
// Kleid: Mieder mit Schnürung, weiter Rock mit Falten bis zum Boden
const DRESS={P:DRP,y1:.0,y2:1.5,chest:.05,dy:.01,cols:72,hem:a=>.035+.008*Math.sin(a*5),top:a=>1.468-.05*fr_(a)**2-.012*Math.max(0,-Math.cos(a))**2,
 disp:(a,y)=>{const fa=.02*ssm(.95,.15,y),f=Math.sin(a*11+Math.sin(a*3)*1.2),sm=Math.exp(-(((y-.97)/.012)**2)),hm=ssm(.09,.05,y);
  return[.004+fa*(.5+.5*f),Math.max(.35,1-.28*(fa/.02)*(.5-.5*f)-.15*sm-.18*hm)]}};
// Kettenhemd: liegt auf den Steppbahnen des Gambesons, gezackter Saum
const MAILS={P:GBP,y1:.55,y2:1.5,chest:.07,chestW:.09,dy:.008,cols:90,hem:a=>{let f=((a/(2*Math.PI))*20+.5)%1;if(f<0)f+=1;return .615-.032*(1-Math.abs(2*f-1))},top:a=>1.476,
 disp:(a,y)=>{let t=((y-GB.y0)/GB.ch)%1;if(t<0)t+=1;return[.0095+GB.amp*.55*Math.pow(Math.sin(Math.PI*t),.5),1]}};
const cloakSpec=(ex,rag)=>({P:GBP,y1:.3,y2:1.48,a0:Math.PI-1.22,a1:Math.PI+1.22,cols:64,dy:.008,sh:.012+ex,hem:a=>.32+.015*Math.sin(a*5)+(rag?.12*Math.abs(Math.sin(a*17)*Math.sin(a*5.3)):0),top:a=>1.47,
 disp:(a,y)=>{const fl=.08*ssm(1.32,.35,y)**1.3,fa=.016*ssm(1.25,.4,y),f=Math.sin(a*9+Math.sin(a*3)*1.4);return[GB.amp+.012+ex*(1-ssm(1.36,1.42,y))+fl+fa*(.5+.5*f),1-.3*(fa/.016)*(.5-.5*f)]}});
const apronSpec=dr=>({P:dr?DRP:TUP,y1:dr?.2:.45,y2:1.0,a0:-.85,a1:.85,cols:32,hem:a=>dr?.25:.48,top:a=>.99,
 disp:(a,y)=>[(dr?.027:.02)+.004*Math.sin(a*7)*ssm(.95,.5,y),.9+.1*Math.sin(a*7)]});
function dressUp(g,o,A){const S=DRESS;mesh(garment('dress',S),garMat('linen',o.cloth),g);
 const lace=new T.MeshStandardMaterial({color:0x2a2018,roughness:1});            // Schnürung vorne
 for(const s of[1,-1]){const pts=[];for(let k=0;k<=7;k++){const a=(k%2?.05:-.05)*s,y=1.0+k*.045,p=gPt(S,a,y);pts.push([p[0],y,p[2]+.004])}tube(g,lace,pts,.0024)}}
function jerkinUp(g,o,A){mesh(garment('jerkin',JERK),garMat('leather',o.over),g);const pts=[];for(let y=.78;y<1.46;y+=.045){const p=gPt(JERK,0,y);pts.push([0,y,p[2]+.004])}rivets(g,A.brass,pts,.007,[1,1,.6])}
function cloakUp(g,o,A){const h=o.head,cape=h==='helmet'||h==='hood'||h==='gugel'||h==='gugelL'||h==='bascinet'||h==='visored'||(h==='nasal'&&o.mailHood),ex=(o.breast?.024:0)+(cape?.022:0)+(o.outfit==='robe'||o.outfit==='gown'?.02:0),S=cloakSpec(ex,o.ragged),m=garMat('linen',o.cloak);mesh(garment('cloak'+ex+!!o.ragged,S),m,g);
 const pl=gPt(S,-1.92,1.43),pr=gPt(S,1.92,1.43),cord=new T.MeshStandardMaterial({color:0x2a2018,roughness:1});         // Schließkordel über der Brust
 tube(g,cord,[pl,gPt(S,-.7,1.41),gPt(S,0,1.395),gPt(S,.7,1.41),pr].map(p=>[p[0],p[1],p[2]+.004]),.0035);rivets(g,A.brass,[pl,pr],.012)}
// ---------- Kettenhaube / Helmbrünne / Stoffkapuze ----------
function capeGeo(o,{top1=1.585,top0=1.52,topR=.1,teeth=18,hem0=1.31,off=0,ragged=0,leaf=0}={}){const ex=o.breast?.024:0;
 return cg(['cape',top1,top0,topR,teeth,hem0,off,ex,ragged,leaf].join(),()=>{const C=leaf?192:96,y1=Math.min(1.15,hem0-.13),y2=top1+.01,R=Math.ceil((y2-y1)/.006),pos=[],col=[],uv=[],idx=[];
  const hem=a=>{const c=Math.cos(a);let tz=0;if(teeth){let f=((a/(2*Math.PI))*teeth+.5)%1;if(f<0)f+=1;tz=leaf?.085*Math.pow(Math.max(0,Math.sin(Math.PI*Math.min(1,f*1.12))),.55):.042*(1-Math.abs(2*f-1))}if(ragged)tz+=.05*Math.abs(Math.sin(a*23.7)*Math.sin(a*7.1+1));return hem0-tz-.045*Math.max(0,c)**2-.03*Math.max(0,-c)**2};
  const top=a=>top1-(top1-top0)*Math.max(0,Math.cos(a))**2;
  for(let j=0;j<=R;j++){const yr=y2-j*(y2-y1)/R;for(let i=0;i<=C;i++){const a=-Math.PI+2*Math.PI*i/C,y=Math.min(Math.max(yr,hem(a)),top(a)),[r,d]=gbProf(y),fr=fr_(a),
   ch=1+.07*Math.exp(-(((y-1.26)/.09)**2))*fr*fr,tw=ssm(1.44,1.52,y),e=(GB.amp+.007)*(1-tw)+ex*(1-ssm(1.37,1.43,y))+off;
   let rx=smax(r+e,topR,.02);rx=smax(rx,shoulderEnv(y,a)+.008+off,.02);const rz=smax(r*d*ch+e,topR*(1-.22*fr),.02);
   pos.push(rx*Math.sin(a),y,rz*Math.cos(a)+.012*tw);col.push(1,1,1);uv.push(a*(rx+rz)*.5/MAIL_T,y/MAIL_T)}}
  for(let j=0;j<R;j++)for(let i=0;i<C;i++){const A=j*(C+1)+i,B=A+1,Cc=A+C+1,D=Cc+1;idx.push(A,Cc,B,B,Cc,D)}return gridGeo(pos,col,uv,idx)})}
function buildCoif(g,H,geo,o,mat,opt={}){mesh(shell(geo,(x,y,z)=>!(z>.15&&(x/.68)**2+((y+.06)/.74)**2<1),opt.shellOff||.1,.012),mat,H);mesh(capeGeo(o,opt),mat,g)}
// ---------- Eisenhut: Kalotte, angewinkelte Krempe mit Rollkante, Kreuzverstärkung, Nietband ----------
function kettleHat(H,A){const DA=1.12,DB=1.14,DC=1.22,yc=.18,o=.035,bw=.72,drop=.34,yb=yc-.04,th0=Math.PI/2;
 mesh(cg('kd',()=>paramGeo((u,v)=>ellP(DA,DB,DC,yc,v*(th0+.06),u*2*Math.PI),44,16)),A.st,H);
 const brim=(ph,t,oo=0)=>[(DA+.03+t*bw)*Math.sin(ph),yb-t*drop+oo,(DC+.03+t*bw)*Math.cos(ph)];
 mesh(cg('kb',()=>paramGeo((u,v)=>brim(u*2*Math.PI,v),56,6)),A.st,H);
 mesh(cg('kr',()=>new T.TorusGeometry(1,.028,6,56)),A.st,H,[0,yb-drop,0],[DA+.03+bw,DC+.03+bw,1]).rotation.x=Math.PI/2;      // Rollkante
 mesh(cg('kband',()=>paramGeo((u,v)=>ellP(DA,DB,DC,yc,th0-.15+v*.2,u*2*Math.PI,o),48,2)),A.st2,H);                       // Nietband
 const rv=[];for(let k=0;k<18;k++)rv.push(ellP(DA,DB,DC,yc,th0-.05,(k+.5)/18*2*Math.PI,o+.03));
 for(const p0 of[0,Math.PI/2]){const n=[Math.cos(p0),0,-Math.sin(p0)],w=.24;                                             // Kreuzspangen über die Kalotte
  mesh(cg('ks'+p0,()=>paramGeo((u,v)=>{const t=-1+2*v,ph=t<0?p0+Math.PI:p0,p=ellP(DA,DB,DC,yc,Math.abs(t)*(th0-.02),ph,o),s=(u-.5)*w;return projE([p[0]+n[0]*s,p[1],p[2]+n[2]*s],DA+o,DB+o,DC+o,yc)},2,40)),A.st2,H);
  for(const t of[-.85,-.5,.5,.85])rv.push(ellP(DA,DB,DC,yc,Math.abs(t)*th0,t<0?p0+Math.PI:p0,o+.035));
  for(const pe of[p0,p0+Math.PI]){mesh(cg('kbs'+pe,()=>paramGeo((u,v)=>{const ph=pe+(u-.5)*w/(DA+.03+v*bw);return brim(ph,v*.96,.03)},2,6)),A.st2,H);
   for(const t of[.45,.85])rv.push(brim(pe,t,.055))}}
 rivets(H,A.st,rv,.05)}
// ---------- Nasalhelm: spitze Glocke mit Grat, Randreif, Kreuzbeschlag und Nasal ----------
function nasalHelm(H,A){const y0=.06,Hh=1.6,R0=1.13,sx=.94,sz=1.06,rr=y=>R0*(1-Math.min(1,Math.max(0,(y-y0)/Hh))**2.2);
 const P=(ph,y,o=0)=>{const h=(y-y0)/Hh,cr=.05*Math.exp(-((Math.sin(ph)/.07)**2))*Math.max(0,h*(1-h))*4,r=rr(y)+cr+o;return[r*sx*Math.sin(ph),y,r*sz*Math.cos(ph)]};
 mesh(cg('nh',()=>paramGeo((u,v)=>P(u*2*Math.PI,y0+Hh*(1-v)),56,30)),A.st,H);
 mesh(cg('nr',()=>paramGeo((u,v)=>P(u*2*Math.PI,y0+.17-v*.17,.035),56,2)),A.st2,H);                                       // Randreif
 mesh(cg('nv',()=>paramGeo((u,v)=>{const y=.8-v*(.8-y0),wt=.2*Math.min(1,(.8-y)/.12);return P((u-.5)*wt/(rr(y)*sz),y,.045)},2,16)),A.st2,H);   // Kreuz senkrecht
 mesh(cg('nq',()=>paramGeo((u,v)=>{const ph=-.95+1.9*u,e=1-Math.abs(ph)/.95,w=.2*Math.min(1,e/.12);return P(ph,y0+.1+(.5-v)*w,.06)},26,2)),A.st2,H); // Kreuz waagrecht
 const cv=new T.CatmullRomCurve3([[0,y0+.12,1.25],[0,y0-.05,1.28],[0,-.2,1.4],[0,-.47,1.42]].map(p=>new T.Vector3(...p)));          // Nasal
 mesh(cg('nn',()=>paramGeo((u,v)=>{const p=cv.getPoint(v),w=.2+.06*v*v;return[(u-.5)*w,p.y,p.z]},2,12)),A.st2,H);
 const rv=[P(0,.68,.08),P(.82,y0+.1,.09),P(-.82,y0+.1,.09),P(0,y0+.1,.09),P(.45,y0+.1,.09),P(-.45,y0+.1,.09),[0,-.36,1.44]];
 for(let k=0;k<14;k++){const ph=1.05+(k+.5)/14*(2*Math.PI-2.1);rv.push(P(ph,y0+.085,.06))}rivets(H,A.st,rv,.045)}
// ---------- Beckenhaube (Hundsgugel): Spitzkalotte, Schnauzenvisier, Sehschlitze, Atemlöcher, Drehbolzen ----------
function bascinet(H,A,rounded){const SA=1.1,SB=1.32,SC=1.2,tmax=ph=>1.25+1.2*ssm(.9,1.55,Math.abs(ph));
 const SP=(th,ph,o=0)=>{const t=Math.max(0,Math.cos(th)),cr=.035*Math.exp(-((Math.sin(ph)/.12)**2))*t,p=ellP(SA,SB,SC,0,th,ph,o+cr);p[1]+=.24*t**6;p[2]-=.3*t**4;return p};
 mesh(cg('bs',()=>paramGeo((u,v)=>{const ph=-Math.PI+2*Math.PI*u;return SP(v*tmax(ph),ph)},60,28)),A.st,H);
 const S=rounded?.38:.85,VP=(ph,y,o=0)=>{const k=1-.24*ssm(-.3,-1.05,y),sn=rounded?S*Math.max(0,1-(Math.sin(ph)/.95)**2-((y+.2)/.95)**2):S*Math.max(0,1-Math.abs(Math.sin(ph))/.72-Math.abs(y+.32)/.82),
  br=.05*ssm(.25,.31,y),rx=1.2*k+br+o,rz=1.3*k+br+o;return[rx*Math.sin(ph),y,rz*Math.cos(ph)+sn,sn]};
 // Klappvisier: dreht an den beiden Drehbolzen nach oben (userData.visorPivot, gesteuert in animateCharacter)
 const pv=VP(1.6,.36,.03),VG=new T.Group();VG.position.set(0,pv[1],pv[2]);VG.userData.visorPivot=1;H.add(VG);const V=new T.Group();V.position.set(0,-pv[1],-pv[2]);VG.add(V);
 mesh(cg('bv'+rounded,()=>paramGeo((u,v)=>VP(-1.62+3.24*u,.54-1.62*v),56,48)),A.st,V);
 for(const s of[-1,1]){mesh(cg('bsl'+s+rounded,()=>paramGeo((u,v)=>VP(s*(.1+.95*u),.245-.065*v,.02),16,1)),A.hole,V);                // Sehschlitze
  const p=VP(s*1.6,.36,.03);mesh(BTN_GEO,A.st,H,p,[.05,.15,.15]);mesh(BTN_GEO,A.brass,H,[p[0]+s*.05,p[1],p[2]],[.03,.05,.05])}   // Drehbolzen
 tube(V,A.st,Array.from({length:17},(_,i)=>VP(-1.6+3.2*i/16,.54,.02)),.03);tube(V,A.st,Array.from({length:17},(_,i)=>VP(-1.6+3.2*i/16,-1.08,.02)),.03);
 mesh(cg('bvlift',()=>new T.BoxGeometry(.08,.22,.06)),A.st,V,VP(.55,-.35,.06));   // Hebeknauf
 const holes=[];for(const s of[-1,1])for(let ph=.16;ph<.66;ph+=.09)for(let y=-.08;y>-.75;y-=.1){const p=VP(s*ph,y,.006);if(p[3]>.1)holes.push(p)}rivets(V,A.hole,holes,.042); // Atemlöcher
 const rv=[];for(let k=0;k<26;k++){const ph=-Math.PI+(k+.5)/26*2*Math.PI;if(Math.abs(ph)<1.55)continue;rv.push(SP(tmax(ph)-.08,ph,.04))}rivets(H,A.brass,rv,.045)}  // Vervellen-Nieten
// ---------- Schaller mit Kinnreff ----------
function salletHelm(H,A){const SA=1.1,SB=1.2,SC=1.22,yc=.1,tm=ph=>2.0+.12*Math.max(0,-Math.cos(ph));
 const SP=(th,ph,o=0)=>{const bk=Math.max(0,-Math.cos(ph))**1.5,fl=.5*ssm(1.45,2.1,th)*bk,fv=.3*fr_(ph)**2*ssm(1.2,1.6,th),cr=.04*Math.exp(-((Math.sin(ph)/.1)**2))*Math.max(0,Math.cos(th));return ellP(SA+fl,SB,SC+fl,yc,th,ph,o+cr+fv)};
 mesh(cg('sk',()=>paramGeo((u,v)=>{const ph=-Math.PI+2*Math.PI*u;return SP(v*tm(ph),ph)},56,26)),A.st,H);
 mesh(cg('ss',()=>paramGeo((u,v)=>SP(1.46+.07*v,-1.1+2.2*u,.02),24,1)),A.hole,H);
 mesh(cg('sb',()=>paramGeo((u,v)=>{const ph=-1.5+3*u,y=-.3-1.25*v,k=1.12-.25*ssm(-.6,-1.5,y);return[k*1.05*Math.sin(ph),y,k*1.25*Math.cos(ph)+.1]},32,18)),A.st,H);   // Kinnreff
 for(const y of[-.85,-1.2]){const k=1.12-.25*ssm(-.6,-1.5,y);tube(H,A.st,Array.from({length:13},(_,i)=>{const ph=-1.5+3*i/12;return[k*1.07*Math.sin(ph),y,k*1.27*Math.cos(ph)+.1]}),.025)}
 const rv=[];for(let k=0;k<20;k++){const ph=-Math.PI+(k+.5)/20*2*Math.PI;if(Math.abs(ph)<1.2)continue;rv.push(SP(1.35,ph,.04))}rivets(H,A.st,rv,.045)}
// ---------- Brustpanzer + Rückenplatte + Bauchreifen, direkt auf dem Gambeson ----------
function bpSurf(a,y,o=0,back=false){const[r,d]=gbProf(y),fr=fr_(a),rr=Math.max(r,.205),ch=back?1:1+.085*Math.exp(-(((y-1.2)/.15)**2))*fr*fr,
 keel=back?0:.013*Math.exp(-((wrapA(a)/.07)**2))*ssm(.88,1.05,y)*(1-ssm(1.3,1.37,y)),e=GB.amp+.012+o;return[(rr+e)*Math.sin(a),y,(rr*d*ch+e+keel)*Math.cos(a)]}
const bpTop=a=>1.385-.075*Math.exp(-((a/.42)**2))-.19*ssm(.85,1.25,Math.abs(a)),bpBot=a=>.905-.02*Math.cos(a);
const bkTop=a=>{const b=Math.abs(wrapA(a-Math.PI));return 1.4-.05*Math.exp(-((b/.4)**2))-.18*ssm(.8,1.15,b)};
function breastplate(g,A){const fa=u=>-1.36+2.72*u,ba=u=>Math.PI-1.2+2.4*u;
 mesh(cg('bp',()=>paramGeo((u,v)=>{const a=fa(u);return bpSurf(a,bpTop(a)+(bpBot(a)-bpTop(a))*v)},64,40)),A.st,g);
 mesh(cg('bk',()=>paramGeo((u,v)=>{const a=ba(u);return bpSurf(a,bkTop(a)+(.92-bkTop(a))*v,0,true)},48,30)),A.st,g);
 const edge=(f,top,n,back)=>Array.from({length:n+1},(_,i)=>{const a=f(i/n);return bpSurf(a,top(a),.003,back)});
 tube(g,A.st,edge(fa,bpTop,40),.0045);tube(g,A.st,edge(fa,bpBot,30),.0045);tube(g,A.st,edge(ba,bkTop,30,1),.0045);
 for(const s of[-1,1])tube(g,A.st,Array.from({length:9},(_,i)=>{const t=i/8;return bpSurf(s*.36*(1-t),1.335-.12*t,.005)}),.0042);   // Stoppkante (V)
 for(let k=0;k<2;k++){const y0=.905-.058*k+.012,P=(a,y)=>{const[r,d]=gbProf(y),e=GB.amp+.017+.011*(y0-y)/.07;return[(r+e)*Math.sin(a),y,(r*d+e)*Math.cos(a)]};   // Bauchreifen
  mesh(cg('fl'+k,()=>paramGeo((u,v)=>P(-1.25+2.5*u,y0-.07*v),40,4)),A.st,g);
  if(k)tube(g,A.st,Array.from({length:21},(_,i)=>P(-1.25+2.5*i/20,y0-.07)),.004);rivets(g,A.st,[P(-1.15,y0-.03),P(1.15,y0-.03),P(0,y0-.015)],.005)}
 const rv=[];for(const s of[-1,1]){for(const y of[1.1,1.0,.94])rv.push(bpSurf(s*1.28,y,.004));rv.push(bpSurf(s*.62,bpTop(s*.62)-.014,.004),bpSurf(s*.36,1.335,.007));
  for(const a of[.3,.9])rv.push(bpSurf(s*a,bpBot(s*a)+.016,.004))}rv.push(bpSurf(0,1.215,.007));rivets(g,A.st,rv,.005);
 for(const s of[-1,1]){const f=bpSurf(s*.62,bpTop(s*.62)-.006,.006),b=bpSurf(Math.PI-s*.62,bkTop(Math.PI-s*.62)-.006,.006,true);   // Lederriemen über die Schulter
  tube(g,A.lea,[f,[s*.19,1.45,.07],[s*.185,1.478,0],[s*.19,1.45,-.07],b],.0065)}}
// ---------- Armzeug: Armröhren, Ellbogenkachel mit Muschel, Oberarmröhre, Schulter-Lamellen ----------
const _v=new T.Vector3();
function limbVec(par,ch,def){if(par&&ch){ch.getWorldPosition(_v);par.worldToLocal(_v);const l=_v.length();if(l>.12&&l<.6)return _v.clone()}return new T.Vector3(...def)}
function axisGroup(par,v){const gr=new T.Group();gr.quaternion.setFromUnitVectors(new T.Vector3(0,-1,0),v.clone().normalize());par.add(gr);return gr}
const outSide=o3=>{o3.getWorldPosition(_v);return Math.sign(_v.x)||1};
const plateTube=(y0,y1,r0,r1,ov=1.06)=>cg('pt'+[y0,y1,r0,r1,ov].map(v=>v.toFixed(3)).join(),()=>paramGeo((u,v)=>{const r=r0+(r1-r0)*v,ph=2*Math.PI*u;return[r*Math.sin(ph),-(y0+(y1-y0)*v),r*ov*Math.cos(ph)]},24,3));
function couter(par,A,side,y,back){const z=back?-1:1;
 mesh(cg('cop',()=>new T.SphereGeometry(1,16,10,0,2*Math.PI,0,1.35)),A.st,par,[0,y,z*.035],[.08,.085,.068]).rotation.x=z*Math.PI/2;
 mesh(cg('disk',()=>new T.CircleGeometry(1,22)),A.st,par,[side*.092,y,z*.005],[.075,.09,1]).rotation.y=Math.PI/2;
 rivets(par,A.brass,[[side*.095,y,z*.005]],.008);
 for(const dy of[.062,-.062])mesh(cg('cl',()=>new T.CylinderGeometry(.088,.09,.032,18,1,true,-1.4,2.8)),A.st,par,[0,y+dy,0]).rotation.y=back?Math.PI:0}
function armArmor(g,o,M,lvl){const A=g.userData.rust?rustMats(M):armMats(M);g.updateMatrixWorld(true);
 for(const s0 of[g.right,g.left]){if(!s0||!s0.elbow)continue;const s=s0.shoulder||s0,{elbow:E0,wrist:W0}=s0;const side=outSide(s),ue=limbVec(s,E0,[0,-.28,0]),fw=limbVec(E0,W0,[0,-.27,0]),Lu=ue.length(),Lf=fw.length();
  const lo=axisGroup(E0,fw);mesh(plateTube(.035,Lf-.1,.086,.077),A.st,lo);
  for(const[y,r]of[[-.035,.087],[-(Lf-.1),.078]])ring(lo,A.st,r,y,.06,1.06);ring(lo,A.lea,.088,-(Lf*.5),.08,1.06);
  rivets(lo,A.st,[[side*.089,-.06,0],[side*.08,-(Lf-.12),0]],.006);
  if(lvl<2)continue;couter(lo,A,side,0,true);
  const up=axisGroup(s,ue);mesh(plateTube(.12,Lu-.06,.102,.09),A.st,up);ring(up,A.st,.092,-(Lu-.06),.06,1.06);
  for(let k=0;k<4;k++){const y=.04-k*.045,rT=.118-k*.004;                                                                    // Schulter-Lamellen
   mesh(new T.CylinderGeometry(rT,rT+.009,.058,20,1,true,side*Math.PI/2-1.75,3.5),A.st,up,[0,y,0]);rivets(up,A.st,[[side*(rT+.008),y-.015,0]],.006)}
  mesh(cg('spc',()=>new T.SphereGeometry(1,16,8,0,2*Math.PI,0,1.15)),A.st,up,[0,.05,0],[.118,.08,.118])}}
// ---------- Stundenglashandschuh: taillierter Stulp mit Messingkanten, Handplatte, Knöchelreif, Fingerlamellen ----------
function handShell(w,mat,brass,lames){mesh(cg('hbk',()=>new T.SphereGeometry(1,16,10,Math.PI,Math.PI)),mat,w,[0,0,-.027],[.05,.073,.042]);   // Handrücken
 for(let k=0;k<4;k++)mesh(cg('hfl'+lames,()=>new T.CylinderGeometry(.05,.052,lames?.026:.11,18,1,true,Math.PI-.35,Math.PI+.6)),k%2&&brass?brass:mat,w,[0,lames?-.047+k*.027:-.004,0]).visible=lames||k===0}
function gauntlets(g,M){const A=armMats(M);for(const s of[g.right,g.left]){const w=s&&s.wrist,e=s&&s.elbow;if(!w||!e)continue;    // Stundenglas: Stulp am Unterarmende
 mesh(cg('gcf',()=>new T.LatheGeometry([[.074,-.292],[.072,-.27],[.076,-.24],[.088,-.2],[.098,-.165],[.1,-.158]].map(([r,y])=>new T.Vector2(r,y)),26)),A.st,e);
 ring(e,A.brass,.1,-.158,.06);ring(e,A.brass,.074,-.29,.08);
 rivets(e,A.brass,Array.from({length:10},(_,k)=>{const a=k/10*2*Math.PI;return[.077*Math.sin(a),-.275,.077*Math.cos(a)]}),.005);
 handShell(w,A.st,A.brass,true)}}
function leatherGloves(g,M,only){const A=armMats(M);for(const s of only?[only]:[g.right,g.left]){const w=s&&s.wrist,e=s&&s.elbow;if(!w)continue;
 handShell(w,A.lea,null,false);mesh(cg('glc',()=>new T.LatheGeometry([[.062,-.292],[.06,-.27],[.068,-.23],[.072,-.215]].map(([r,y])=>new T.Vector2(r,y)),18)),A.lea,e)}}
// ---------- Beinzeug: Beinröhre mit Fußausschnitt, Kniebuckel mit Muschel und Lamellen, Diechling ----------
const GRP=[[-.035,.074,1],[-.12,.078,1],[-.22,.076,1],[-.3,.068,1],[-.36,.064,1],[-.38,.068,1]];
function legArmor(g,M,lvl){const A=g.userData.rust?rustMats(M):armMats(M);g.updateMatrixWorld(true);
 const GP=(ph,v,o=0)=>{const fr=fr_(ph),y=-.035-(.345-.035*fr*fr)*v,r=genProf(GRP,y)[0]+o,rid=.008*Math.exp(-((Math.sin(ph)/.12)**2))*fr;return[r*.95*Math.sin(ph),y,(r*1.05+rid)*Math.cos(ph)]};
 for(const L of g.legs||[]){const k=L.knee;if(!k)continue;const side=outSide(k);
  mesh(cg('grv',()=>paramGeo((u,v)=>GP(2*Math.PI*u,v),28,36)),A.st,k);
  for(const v of[0,1])tube(k,A.st,Array.from({length:25},(_,i)=>GP(2*Math.PI*i/24,v,.003)),.004,true);
  for(const y of[-.11,-.29]){const r=genProf(GRP,y)[0]+.004;ring(k,A.lea,r,y,.1,1.1);mesh(cg('bkl',()=>new T.BoxGeometry(.006,.024,.02)),A.st,k,[side*(r*.95+.006),y,-.01])}
  mesh(cg('pcop',()=>new T.SphereGeometry(1,16,10,0,2*Math.PI,0,1.35)),A.st,k,[0,-.03,.058],[.076,.082,.06]).rotation.x=Math.PI/2;
  for(const dy of[.068,-.062])mesh(cg('pl',()=>new T.CylinderGeometry(.085,.088,.034,18,1,true,-1.4,2.8)),A.st,k,[0,dy-.03,0]);
  rivets(k,A.st,[[.0,.068,.085],[0,-.062,.085]],.006);
  if(lvl<2)continue;
  mesh(cg('disk',()=>new T.CircleGeometry(1,22)),A.st,k,[side*.088,-.03,.01],[.075,.095,1]).rotation.y=Math.PI/2;rivets(k,A.brass,[[side*.091,-.03,.01]],.008);
  const hip=L.isObject3D?L:(L.hip||L.thigh);if(hip&&hip.isObject3D){const tv=limbVec(hip,k,[0,-.42,0]),gr=axisGroup(hip,tv),ln=tv.length();
   mesh(cg('cu'+ln.toFixed(3),()=>paramGeo((u,v)=>{const ph=-1.9+3.8*u,y=-(.1+(ln-.19)*v),r=.106-.016*v;return[r*Math.sin(ph),y,r*1.05*Math.cos(ph)]},20,10)),A.st,gr);
   for(let j=0;j<2;j++)mesh(new T.CylinderGeometry(.09+j*.002,.094+j*.002,.03,18,1,true,-1.6,3.2),A.st,gr,[0,-(ln-.09+j*.025),0])}}}
function mailSleeves(g,o){const m=mailMat(2.7,1.79);for(const s0 of[g.right,g.left]){if(!s0||!s0.elbow)continue;const s=s0.shoulder||s0,{elbow:E0,wrist:W0}=s0;const ue=limbVec(s,E0,[0,-.285,0]);mesh(sleeveGeo('mail',SLU,.075,-(ue.length()*.9),{cap:true,off:.019}),m,axisGroup(s,ue))}}
// ===================== STÄNDE & BERUFE: Gewandungen, Kopfbedeckungen, Zubehör =====================
const dirtN=(a,y)=>.5+.5*(Math.sin(a*7.3+y*11)*.5+Math.sin(a*13.1-y*17)*.3+Math.sin(a*3+y*29)*.2);
// Profile: Habit (bodenlang) und Houppelande (weit, mit Stehkragen)
const RBP=[[-.05,.335,.86],[.08,.325,.86],[.3,.3,.84],[.55,.272,.82],[.75,.248,.8],[.9,.226,.76],[1.0,.213,.72],[1.15,.205,.69],[1.28,.22,.69],[1.36,.242,.69],[1.4,.245,.7],[1.44,.214,.74],[1.47,.15,.8],[1.5,.1,.9],[1.56,.09,.95]];
const GWP=[[-.05,.4,.86],[.1,.37,.85],[.35,.32,.83],[.6,.28,.81],[.8,.25,.78],[.95,.23,.75],[1.02,.218,.72],[1.15,.21,.69],[1.28,.225,.69],[1.36,.246,.69],[1.4,.249,.7],[1.44,.218,.74],[1.47,.155,.8],[1.5,.105,.9],[1.56,.098,.95]];
const KEY=(n,o)=>n+JSON.stringify(o);
function tunicS(o={}){const hem=o.hem??.52;return{P:TUP,y1:hem-.03,y2:1.5,chest:.03,dy:.009,cols:80,belly:o.belly||0,dirt:o.dirt||0,hem:a=>hem+.012*Math.sin(a*3+1),top:a=>1.475-.03*fr_(a)**3,disp:TUNIC.disp}}
function jerkS(o={}){return{...JERK,belly:o.belly||0,dirt:o.dirt||0}}
function dressS(o={}){return{...DRESS,belly:o.belly||0,dirt:o.dirt||0}}
function robeS(o={}){const gw=!!o.gown;return{P:gw?GWP:RBP,y1:.04,y2:gw?1.56:1.5,chest:.03,dy:.012,cols:gw?96:80,belly:o.belly||0,dirt:o.dirt||0,
 hem:a=>(gw?.09:.1)+.012*Math.sin(a*4+.5),top:a=>gw?1.555-.05*fr_(a)**2:1.47-.02*fr_(a)**2,
 disp:(a,y)=>{if(gw){const pl=ssm(1.25,.95,y),f=Math.sin(a*16),fa=.014*pl*(.4+.6*ssm(1,.2,y));return[.006+fa*(.5+.5*f),1-.3*pl*(.5-.5*f)*(fa/.014||0)]}
  const fa=.02*ssm(.92,.25,y),f=Math.sin(a*10+Math.sin(a*3)*1.3+y*2),bl=.008*Math.exp(-(((y-.995)/.03)**2)),pn=Math.exp(-(((y-.95)/.012)**2));return[.005+fa*(.5+.5*f)+bl-.003*pn,1-.3*(fa/.02)*(.5-.5*f)-.2*pn]}}}
// Wappenrock über Rüstung: Brust/Rücken-Bahnen, Armausschnitte; trim=true: gezaddelter Saumstreifen
const tabardS=(ex,trim)=>({P:TUP,y1:trim?.5:.66,y2:trim?.74:1.5,cols:trim?192:96,dy:.008,hem:a=>trim?.6-.07*Math.pow(Math.max(0,Math.sin(Math.PI*((((a+Math.PI)/(2*Math.PI))*22)%1))),.6):.7,
 top:a=>trim?.74:1.48-.17*Math.exp(-(((Math.abs(wrapA(a))-Math.PI/2)/.36)**2)),disp:(a,y)=>{const f=Math.sin(a*11+y*4);return[GB.amp+.03+ex+(trim?.004:0)+.004*f*ssm(1.1,.7,y),.88+.12*f]},chest:.09,chestW:.15});
// Skapulier (Ordensüberwurf): vorne und hinten bis fast zum Boden
const scapS=(back,o={})=>({P:RBP,y1:.12,y2:1.48,a0:back?Math.PI-.32:-.32,a1:back?Math.PI+.32:.32,cols:14,dy:.015,belly:o.belly||0,hem:a=>.14,top:a=>1.47,disp:(a,y)=>[.03+.003*Math.sin(a*9),.92+.08*Math.sin(a*9)]});
// Offene Lederweste mit Armausschnitten
const vestS=(o={})=>({P:TUP,y1:.76,y2:1.5,a0:.3,a1:2*Math.PI-.3,cols:60,dy:.01,belly:o.belly||0,dirt:o.dirt||0,hem:a=>.79+.01*Math.sin(a*3),
 top:a=>1.48-.15*Math.exp(-(((Math.abs(wrapA(a))-Math.PI/2)/.33)**2)),disp:(a,y)=>[.022+.002*Math.sin(a*11+y*7),.85+.15*Math.sin(a*11+y*7)]});
// Schürzen: Latz (Bäcker/Wirt), Schmiedeschurz (Leder, lang), Halbschurz, Kräuterschurz
function apronS(kind,P,o={}){const k={bib:[.95,.42,.34,.5,.38],smith:[1.05,.32,.37,.55,.42],half:[1,.52,0,1,1],herb:[.9,.55,0,1,1]}[kind];
 return{P,y1:k[1]-.02,y2:1.38,a0:-k[0],a1:k[0],cols:32,dy:.012,belly:o.belly||0,dirt:o.dirt||0,hem:a=>k[1]+.008*Math.sin(a*5),top:a=>k[2]?.99+k[2]*ssm(k[3],k[4],Math.abs(a)):.99,
  disp:(a,y)=>{const b=(P===TUP?.03:.035)+(kind==='smith'?.005:0),base=.012+(b-.012)*ssm(1.02,.92,y),f=Math.sin(a*7)*ssm(.95,.5,y);return[base+.004*f,.9+.1*f]}}}
// Gewand-Schichten merken, damit Gürtel und Zubehör immer auf der äußersten Lage sitzen
function addLayer(g,S,opt={}){(g.userData.layers||(g.userData.layers=[])).push({S,...opt})}
function outerPt(g,a,y){let best=null,br=0;for(const L of g.userData.layers||[]){if(L.ymin!=null&&(y<L.ymin||y>L.ymax))continue;
  if(L.S.a0!=null){const da=wrapA(a-(L.S.a0+L.S.a1)/2);if(Math.abs(da)>(L.S.a1-L.S.a0)/2)continue}
  const p=gPt(L.S,a,y),rr=Math.hypot(p[0],p[2])+(L.add||0);if(rr>br){br=rr;best=p.slice(0,3);if(L.add){const k=rr/Math.hypot(p[0],p[2]);best[0]*=k;best[2]*=k}}}
 return best||[.2*Math.sin(a),y,.15*Math.cos(a)]}
function onBody(g,a,y,off=0){const p=outerPt(g,a,y),r=Math.hypot(p[0],p[2])||1;return[p[0]*(1+off/r),y,p[2]*(1+off/r)]}
function beltOn(g,y,h,mat,ex=.006){mesh(paramGeo((u,v)=>{const a=-Math.PI+2*Math.PI*u,p=onBody(g,a,y+(.5-v)*h,ex);return p},48,1),mat,g)}
// Band entlang einer Kurve auf dem Körper (Riemen, Handtuch, Netz)
function ribbon(par,mat,pts,w,n=24){const cv=new T.CatmullRomCurve3(pts.map(p=>new T.Vector3(...p)));return mesh(paramGeo((u,v)=>{const t=Math.min(.999,Math.max(.001,v)),p=cv.getPoint(t),tg=cv.getTangent(t),rad=new T.Vector3(p.x,0,p.z).normalize(),sd=new T.Vector3().crossVectors(tg,rad).normalize();
 return[p.x+sd.x*(u-.5)*w,p.y+sd.y*(u-.5)*w,p.z+sd.z*(u-.5)*w]},2,n),mat,par)}
// Flicken mit Stichen
function patches(g,S,n,col,rs){const pm=new T.MeshStandardMaterial({color:col,roughness:1,side:T.DoubleSide}),pm2=new T.MeshStandardMaterial({color:new T.Color(col).multiplyScalar(.6),roughness:1,side:T.DoubleSide}),st=[];
 for(let k=0;k<n;k++){const a=-Math.PI+rs()*2*Math.PI,y=.62+rs()*.62,w=.06+rs()*.05,h=.05+rs()*.05,mat=rs()<.5?pm:pm2;
  mesh(paramGeo((u,v)=>{const aa=a+(u-.5)*w/.22,yy=y+(.5-v)*h,p=gPt(S,aa,yy),r=Math.hypot(p[0],p[2]);return[p[0]*(1+.004/r),yy,p[2]*(1+.004/r)]},4,4),mat,g);
  for(let s=0;s<10;s++){const t=s/10*2*Math.PI,aa=a+Math.cos(t)*w/.22*.5,yy=y+Math.sin(t)*h*.5,p=gPt(S,aa,yy),r=Math.hypot(p[0],p[2]);st.push([p[0]*(1+.006/r),yy,p[2]*(1+.006/r)])}}
 if(st.length)rivets(g,new T.MeshStandardMaterial({color:0x1a1612,roughness:1}),st,.0028)}
// Fell: Textur aus Haarsträhnen
let FURTEX=null;const FM=new Map();
function furTex(){if(FURTEX)return FURTEX;const S=128,c=document.createElement('canvas');c.width=c.height=S;const x=c.getContext('2d');x.fillStyle='#777';x.fillRect(0,0,S,S);
 for(let i=0;i<900;i++){const px=Math.random()*S,py=Math.random()*S,l=6+Math.random()*10,v=90+Math.random()*120|0;x.strokeStyle=`rgb(${v},${v},${v})`;x.lineWidth=1+Math.random()*1.5;x.beginPath();x.moveTo(px,py);x.quadraticCurveTo(px+2,py+l*.5,px+(Math.random()-.5)*4,py+l);x.stroke()}
 const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(4,4);return FURTEX=t}
function furMat(col){if(!FM.has(col))FM.set(col,new T.MeshStandardMaterial({color:col,map:furTex(),bumpMap:furTex(),bumpScale:2,roughness:1,side:T.DoubleSide}));return FM.get(col)}
function furTube(par,col,pts,r,closed=false){const geo=new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(p=>new T.Vector3(...p)),closed),Math.max(16,pts.length*5),r,7,closed),P=geo.attributes.position,N=geo.attributes.normal;
 for(let i=0;i<P.count;i++){const k=(Math.sin(i*12.9898)*43758.5453%1+1)%1*.7*r;P.setXYZ(i,P.getX(i)+N.getX(i)*k,P.getY(i)+N.getY(i)*k,P.getZ(i)+N.getZ(i)*k)}geo.computeVertexNormals();return mesh(geo,furMat(col),par)}
// Netz (durchsichtig)
let NETM=null;function netMat(){if(NETM)return NETM;const S=64,c=document.createElement('canvas');c.width=c.height=S;const x=c.getContext('2d');x.clearRect(0,0,S,S);x.strokeStyle='#cbb88e';x.lineWidth=3;
 x.beginPath();x.moveTo(0,0);x.lineTo(S,S);x.moveTo(S,0);x.lineTo(0,S);x.stroke();const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(4,8);
 return NETM=new T.MeshStandardMaterial({map:t,alphaTest:.4,transparent:false,roughness:1,side:T.DoubleSide})}
// Geflecht (Körbe)
const WICK=new T.MeshStandardMaterial({color:0xb08a52,roughness:1,vertexColors:true,side:T.DoubleSide});
const wickerGeo=(rx,rz,h)=>cg(KEY('wk',[rx,rz,h]),()=>paramGeo((u,v)=>{const a=u*2*Math.PI,y=h*(1-v),r=1+.06*v,s=.72+.28*(Math.sin(u*90)*Math.sin(v*30)>0?1:0);return[rx*r*Math.sin(a),y,rz*r*Math.cos(a),s]},48,12));
// Kapuze unten (Gugel / Kutte): Kragen über den Schultern + Kapuzenbeutel im Nacken
function cowlDown(g,o,mat){mesh(capeGeo(o,o.dag?{top1:1.53,top0:1.49,topR:.105,teeth:13,leaf:1,hem0:1.25,off:.012}:{top1:1.53,top0:1.49,topR:.105,teeth:0,hem0:1.3,off:.012}),mat,g);
 mesh(cg('hoodbag',()=>paramGeo((u,v)=>{const ph=Math.PI/2+Math.PI*u,th=v*Math.PI*.92,f=1+.1*Math.sin(ph*6)*Math.sin(th);const p=ellP(.13*f,.105,.085*f,0,th,ph);return[p[0],p[1]+1.43,p[2]-.15,.85+.15*Math.sin(ph*6)]},20,12)),mat,g)}
// ---------- Kopfbedeckungen ----------
function headwear(g,H,geo,o,AR,M){const h=o.head,lin=garMat('linen',o.coifCol||0xe6e0d0);
 if(h==='coifL'){mesh(shell(geo,(x,y,z)=>y>-.1&&!(z>.42&&y<.62&&Math.abs(x)<.8),.085,.015),lin,H);           // Bundhaube mit Kinnband
  for(const s of[-1,1])tube(g,lin,[[s*.112,1.635,.0],[s*.09,1.555,.04],[s*.03,1.51,.07],[0,1.505,.072]],.005)}
 if(h==='wimple'){buildCoif(g,H,geo,o,lin,{shellOff:.09,teeth:0,hem0:1.38,top1:1.6,top0:1.52,topR:.1});              // Gebende + Schleier
  const vm=garMat('linen',o.veil||0x2a2830);mesh(shell(geo,(x,y,z)=>z<.38&&y>-.35,.16,.02),vm,H);
  mesh(cg('veil',()=>paramGeo((u,v)=>{const ph=Math.PI/2+Math.PI*u,y=1.66-.3*v,r=.125+.05*v+.006*Math.sin(ph*9)*v;return[r*Math.sin(ph),y,r*.95*Math.cos(ph)-.01,.85+.15*Math.sin(ph*9)]},20,8)),vm,g)}
 if(h==='bakercap'){const m=garMat('linen',0xeeeae0);mesh(cg('bkc',()=>new T.SphereGeometry(1,22,12)),m,H,[0,.82,-.05],[1.12,.52,1.12]);ring(H,m,1.0,.58,.09,1.04)}
 if(h==='skullcap')mesh(shell(geo,(x,y,z)=>y>.3,.09,.008),garMat('linen',o.capCol||0x3a3430),H);
 if(h==='southwester'){const m=garMat('leather',o.hatCol||0x5a5a3a);
  mesh(cg('swd',()=>paramGeo((u,v)=>{const p=ellP(1.08,.95,1.13,.25,v*1.62,u*2*Math.PI);return p},28,10)),m,H);
  mesh(cg('swb',()=>paramGeo((u,v)=>{const ph=u*2*Math.PI,bk=Math.max(0,-Math.cos(ph)),L=.45+.5*bk;return[(1.08+v*L)*Math.sin(ph),.24-v*(.25+.25*bk),(1.13+v*L)*Math.cos(ph)]},40,3)),m,H)}
 if(h==='exec'){const bm=garMat('linen',0x141212);mesh(shell(geo,()=>true,.09,.01),bm,H);                       // Henkerhaube mit Augenlöchern
  for(const s of[-1,1])mesh(BTN_GEO,AR.hole,H,[s*.33,.17,.97],[.15,.09,.05]);mesh(capeGeo(o,{top1:1.56,top0:1.52,topR:.1,teeth:0,hem0:1.32}),bm,g)}
 if(h==='gugel'||h==='gugelL'){const m=garMat('linen',o.hoodCol||o.over||o.cloth);buildCoif(g,H,geo,o,m,{shellOff:.16,teeth:12,leaf:1,hem0:1.24,top1:1.6,top0:1.53,topR:.105});   // Gugel mit Zaddelkragen und Zipfel
  const L=h==='gugelL';tube(g,m,L?[[0,1.8,-.05],[0,1.78,-.15],[.02,1.64,-.21],[.03,1.4,-.23],[.03,1.12,-.22],[.02,.86,-.21]]:[[0,1.8,-.05],[0,1.76,-.15],[.01,1.66,-.2],[.02,1.55,-.21]],L?.024:.03)}
 if(h==='hood'&&o.liri){const m=garMat('linen',o.hoodCol||o.cloak||o.cloth);tube(g,m,[[0,1.79,-.06],[0,1.76,-.15],[.02,1.62,-.2],[.03,1.42,-.22],[.02,1.18,-.21]],.022)}}   // Gugel-Zipfel
// ---------- Zubehör am Körper ----------
function accessories(g,o,M,AR){const acc=o.acc||[],lea=AR.lea,wd=new T.MeshStandardMaterial({color:0x6a4a2c,roughness:1}),cord=new T.MeshStandardMaterial({color:0x2a2018,roughness:1});
 const has=k=>acc.includes(k),at=(a,y,off)=>onBody(g,a,y,off);
 if(has('cross')){const c0=at(0,1.3,.008),pts=[c0,at(.6,1.41,.004),[.09,1.5,0],[0,1.52,-.08],[-.09,1.5,0],at(-.6,1.41,.004),c0];tube(g,cord,pts,.0022);
  const cr=new T.Group();cr.position.set(c0[0],c0[1]-.045,c0[2]+.008);g.add(cr);mesh(cg('crv',()=>new T.BoxGeometry(.012,.07,.008)),wd,cr);mesh(cg('crh',()=>new T.BoxGeometry(.045,.012,.008)),wd,cr,[0,.012,0])}
 if(has('rosary')){const p0=at(.55,.95,.012),pts=[];for(let k=0;k<=28;k++){const t=k/28*2*Math.PI,y=.95-.2*(1-Math.cos(t))/2,a=.55+.12*Math.sin(t);pts.push(at(a,y,.012+.008*Math.sin(t/2)))}
  rivets(g,new T.MeshStandardMaterial({color:0x3a2418,roughness:.6}),pts,.007);const e=at(.55,.73,.014);mesh(cg('rsc',()=>new T.BoxGeometry(.008,.04,.006)),wd,g,[e[0],.72,e[2]])}
 if(has('book')){const p=at(-1.15,.9,.03);mesh(cg('book',()=>new T.BoxGeometry(.035,.12,.09)),lea,g,p).rotation.y=-1.15}
 if(has('keys')){const p=at(-.95,.89,.02);ring(g,AR.st,.022,p[1],.12).position.set(p[0],p[1],p[2]);for(let k=0;k<3;k++){const q=mesh(cg('key',()=>new T.BoxGeometry(.006,.06,.012)),AR.st2,g,[p[0]+(k-1)*.012,p[1]-.045,p[2]+.004]);q.rotation.z=(k-1)*.25}}
 if(has('purse')){const p=at(.85,.86,.035);mesh(BTN_GEO,lea,g,p,[.045,.055,.035]);ring(g,cord,.022,p[1]+.045,.2).position.set(p[0],p[1]+.045,p[2])}
 if(has('tongs')){const p=at(1.45,.83,.02);for(const s of[-1,1]){const t=mesh(cg('tg',()=>new T.BoxGeometry(.008,.32,.008)),AR.st2,g,[p[0],p[1],p[2]+s*.008]);t.rotation.z=s*.05}}
 if(has('herbs')){for(let k=0;k<3;k++){const p=at(-.95-k*.22,.86,.025),hb=new T.Group();hb.position.set(...p);g.add(hb);mesh(cg('hst',()=>new T.CylinderGeometry(.012,.006,.13,6)),new T.MeshStandardMaterial({color:[0x5a7a3a,0x7a8a4a,0x6a6a3a][k],roughness:1}),hb,[0,-.04,0]);
  mesh(BTN_GEO,new T.MeshStandardMaterial({color:[0xb08ad8,0xe8d860,0xf0f0e0][k],roughness:1}),hb,[0,-.11,0],[.02,.02,.02]);ring(hb,cord,.013,.01,.2)}}
 if(has('towel')){const m=garMat('linen',0xe8e4d8);ribbon(g,m,[at(-.5,1.12,.008),at(-.55,1.32,.006),[-.19,1.485,.02],[-.19,1.48,-.04],at(Math.PI+.55,1.32,.006),at(Math.PI+.5,1.15,.008)],.09)}
 if(has('creel')){const b=new T.Group(),p=at(1.85,.97,.1);b.position.set(...p);b.rotation.y=1.85;g.add(b);mesh(wickerGeo(.11,.075,.2),WICK,b,[0,-.12,0]);mesh(cg('crl',()=>new T.CylinderGeometry(.115,.115,.015,20)),WICK,b,[0,.085,0],[1,1,.7]);
  ribbon(g,lea,[p,at(1.4,1.25,.01),[.19,1.48,.0],at(-.6,1.32,.008),at(-1.2,1.0,.01)],.03)}
 if(has('net')){ribbon(g,netMat(),[at(.5,1.05,.012),at(.45,1.3,.012),[.2,1.49,.01],at(Math.PI-.45,1.3,.012),at(Math.PI-.5,1.0,.014)],.24,30);
  const fl=[];for(let k=0;k<6;k++)fl.push(at(.62-k*.04+(k>2?Math.PI-1.2:0),1.02+(k%3)*.06,.02));rivets(g,new T.MeshStandardMaterial({color:0xa0703a,roughness:1}),fl,.014)}
 if(has('rope')){const p=at(1.55,.96,.04);mesh(new T.TorusGeometry(.075,.014,6,18),new T.MeshStandardMaterial({color:0xa08a5a,roughness:1}),g,p,[1,.8,1]).rotation.y=Math.PI/2+1.55}
 if(has('spindle')){const p=at(-1.2,.9,.02);mesh(cg('spn',()=>new T.CylinderGeometry(.005,.005,.22,5)),wd,g,p);mesh(cg('spw',()=>new T.CylinderGeometry(.025,.025,.01,10)),wd,g,[p[0],p[1]-.08,p[2]])}
 if(has('chisel')){const p=at(-1.4,.84,.02);mesh(cg('chs',()=>new T.BoxGeometry(.016,.17,.012)),AR.st2,g,p).rotation.z=.1}
 if(has('pelt')){const fc=o.furCol||0x5a4632;mesh(capeGeo(o,{top1:1.5,top0:1.47,topR:.11,teeth:9,hem0:1.27,off:.02,ragged:1}),furMat(fc),g)}
 if(o.patches&&o.patchS)patches(g,o.patchS,o.patches,new T.Color(o.cloth).offsetHSL(0,-.1,(o.seed%3-1)*.06).getHex(),rng(o.seed+99))}
// ---------- Beine: Wickelgamaschen, Wattstiefel, hohe Stiefel ----------
const SHIN=[[0,.056,1],[-.08,.058,1],[-.22,.062,1],[-.33,.052,1],[-.37,.05,1]];
function legWear(g,o,AR){const k=o.shins;if(!k)return;for(const L of g.legs||[]){const kn=L.knee;if(!kn)continue;
 if(k==='wraps'){const m=new T.MeshStandardMaterial({color:o.wrapCol||0x8a7a5a,roughness:1}),pts=[];for(let i=0;i<=84;i++){const t=i/84,y=-.05-.29*t,a=t*2*Math.PI*9,r=genProf(SHIN,y)[0]+.007;pts.push([r*Math.sin(a),y+.008*Math.sin(a),r*Math.cos(a)])}
  mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(p=>new T.Vector3(...p))),220,.0085,5,false),m,kn)}
 else{const wd=k==='waders',m=new T.MeshStandardMaterial({color:wd?0x2a241e:0x4a3420,roughness:.75,side:T.DoubleSide});
  mesh(cg('bt'+k,()=>new T.LatheGeometry((wd?[[.07,-.38],[.072,-.3],[.075,-.15],[.074,-.02],[.08,.04],[.088,.07]]:[[.07,-.38],[.072,-.3],[.074,-.16],[.08,-.1],[.086,-.07]]).map(([r,y])=>new T.Vector2(r,y)),20)),m,kn);
  if(wd&&L.hip)mesh(cg('wdt',()=>new T.LatheGeometry([[.088,-.39],[.1,-.33],[.104,-.27]].map(([r,y])=>new T.Vector2(r,y)),20)),m,L.hip);
  ring(kn,new T.MeshStandardMaterial({color:0x2a2018}),wd?.08:.082,wd?.045:-.09,.12)}}}
// ---------- Ärmel: folgen dem Arm, glatt / gesteppt / weit / hochgekrempelt ----------
const SLU=[[.0,.08,1],[-.03,.084,1],[-.09,.082,1],[-.2,.07,1],[-.32,.06,1]],SLL=[[.04,.062,1],[0,.064,1],[-.07,.063,1],[-.18,.056,1],[-.25,.05,1],[-.3,.048,1]];
function sleeveGeo(key,P,yT,yB,o={}){return cg('sl'+key+JSON.stringify(o),()=>{const C=28,R=Math.ceil((yT-yB)/.006),pos=[],col=[],uv=[],idx=[],off=o.off||0,r0=genProf(P,0)[0]+off;
 for(let j=0;j<=R;j++){const y=yT-j*(yT-yB)/R;let r=y>0&&o.cap?r0*Math.sqrt(Math.max(0,1-(y/yT)**2)):genProf(P,y)[0]+off;
  const fl=(o.flare||0)*ssm(o.flareFrom??-.08,yB,y);r+=fl;const cf=o.cuff?ssm(yB+.035,yB+.025,y):0;let t=((-y)/(o.ch||.03))%1;if(t<0)t+=1;const q=Math.pow(Math.sin(Math.PI*t),.5);
  for(let i=0;i<=C;i++){const a=Math.PI+2*Math.PI*i/C,sm=1-.7*Math.exp(-((wrapA(a-Math.PI)/.2)**2));let d=0,s=1;
   if(o.amp){d=(y>0?o.amp*.4:o.amp*q*sm)*(1-cf);s=(.6+.4*q)*(.8+.2*sm)}
   if(o.folds){const f=Math.sin(a*5+y*9)*.5+Math.sin(a*3-y*14)*.5,ew=1+2*Math.exp(-(((y-yB)/.05)**2))*(o.flare?1:0);d+=o.folds*(.5+.5*f)*ew;s*=.86+.14*f}
   d+=.005*cf;if(cf)s=s*(1-cf)+.95*cf;const rr=r+d;pos.push(rr*Math.sin(a),y,rr*Math.cos(a));col.push(s,s,s);uv.push(i/C*2,y*6)}}
 for(let j=0;j<R;j++)for(let i=0;i<C;i++){const A=j*(C+1)+i,B=A+1,Cc=A+C+1,D=Cc+1;idx.push(A,Cc,B,B,Cc,D)}return gridGeo(pos,col,uv,idx)})}
function dressSleeves(g,o,M){g.updateMatrixWorld(true);const gb=o.outfit==='gambeson',wide=o.sleeves==='wide',gown=o.outfit==='gown';
 const mat=gb?quiltMat(o.over):garMat('linen',o.sleeveCol||o.cloth),so=gb?{amp:GB_SLEEVE.amp,ch:.03,off:.008}:{folds:gown?.004:.003,off:wide?.01:.004};
 for(const s0 of[g.right,g.left]){if(!s0||!s0.elbow)continue;const s=s0.shoulder||s0,{elbow:E0,wrist:W0}=s0;
  for(const c of[...s.children,...E0.children])if(c.isMesh&&!c.userData.pp)c.removeFromParent();          // Basis-Armstoff entfernen
  const side=outSide(s),ue=limbVec(s,E0,[0,-.285,0]),fw=limbVec(E0,W0,[0,-.28,0]),Lu=ue.length(),Lf=fw.length(),up=axisGroup(s,ue),lo=axisGroup(E0,fw);
  mesh(sleeveGeo('u',SLU,.07,-(Lu+.025),{...so,cap:true}),mat,up);mesh(cg('elb',()=>new T.SphereGeometry(1,12,8)),mat,E0,[0,0,0],[.066+(so.off||0),.066+(so.off||0),.066+(so.off||0)]);
  if(o.rolled&&!gb){mesh(sleeveGeo('lr',SLL,.04,-.085,so),mat,lo);ring(lo,mat,.07+so.off,-.085,.3);                      // hochgekrempelt
   mesh(cg('fa',()=>new T.LatheGeometry([[.044,-.275],[.047,-.24],[.054,-.16],[.056,-.09]].map(([r,y])=>new T.Vector2(r,y)),14)),M.skin,lo)}
  else{const lg=sleeveGeo('l'+(wide?'w':''),SLL,.04,-(Lf-.018),{...so,cuff:gb||o.outfit==='jerkin',flare:wide?.05:gown?.035:0,flareFrom:-.06});mesh(lg,mat,lo);mesh(lg,GB_LIN,lo);
   if(gb)for(let k=0;k<3;k++)mesh(BTN_GEO,GB_BTN,lo,[side*(.059),-Lf+.03+k*.024,0],[.005,.008,.008]);
   if(gown)furTube(lo,o.furCol||0x5a4632,Array.from({length:13},(_,i)=>{const a=i/12*2*Math.PI;return[.09*Math.sin(a),-(Lf-.02),.09*Math.cos(a)]}),.018,true)}}
 if(o.mailShirt)mailSleeves(g,o)}
// ===============================================================================================
// ---------- Optimierung: kleine Teile mit gleichem Material pro Gruppe zu einem Mesh zusammenfassen (weniger Draw-Calls) ----------
function mergeSmall(par){const groups=new Map();
 for(const m of par.children){if(!m.isMesh||!m.userData.pp||m.isInstancedMesh||m.isSkinnedMesh||m.children.length||m.userData.keep||Array.isArray(m.material)||m.geometry.attributes.position.count>3000)continue;
  if(!groups.has(m.material))groups.set(m.material,[]);groups.get(m.material).push(m)}
 for(const[mat,list]of groups){if(list.length<2)continue;const useUV=!!(mat.map||mat.bumpMap),useC=!!mat.vertexColors,P=[],N=[],U=[],C=[],I=[],v=new T.Vector3(),nm=new T.Matrix3();let base=0;
  for(const m of list){m.updateMatrix();const g=m.geometry,p=g.attributes.position;if(!g.attributes.normal)g.computeVertexNormals();const n=g.attributes.normal,u=g.attributes.uv,c=g.attributes.color;nm.getNormalMatrix(m.matrix);
   for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(m.matrix);P.push(v.x,v.y,v.z);v.fromBufferAttribute(n,i).applyMatrix3(nm).normalize();N.push(v.x,v.y,v.z);
    if(useUV)U.push(u?u.getX(i):0,u?u.getY(i):0);if(useC)C.push(c?c.getX(i):1,c?c.getY(i):1,c?c.getZ(i):1)}
   if(g.index)for(const ix of g.index.array)I.push(ix+base);else for(let i=0;i<p.count;i++)I.push(i+base);base+=p.count;par.remove(m)}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(P,3));geo.setAttribute('normal',new T.Float32BufferAttribute(N,3));
  if(useUV)geo.setAttribute('uv',new T.Float32BufferAttribute(U,2));if(useC)geo.setAttribute('color',new T.Float32BufferAttribute(C,3));geo.setIndex(I);
  const mm=new T.Mesh(geo,mat);mm.userData.pp=1;mm.castShadow=list[0].castShadow;mm.receiveShadow=list[0].receiveShadow;par.add(mm)}}
export function optimizePerson(root){const nodes=[];root.traverse(o=>{if(!o.isMesh)nodes.push(o)});nodes.forEach(mergeSmall)}
// ===============================================================================================
export function buildPerson(g,o,M){for(const c of[...g.children])if(c.isMesh&&!c.userData.pp)c.removeFromParent();g.userData.layers=[];g.userData.rust=!!o.rust;   // Basis-Rumpf aus characters.js liegt unter der Kleidung
 if(o.outfit==='mail'){o.outfit='gambeson';o.mailShirt=true}if(o.outfit==='plate'){o.outfit='gambeson';o.breast=true;o.arms=o.legs=2;o.hands='hour'}
 const AR=o.rust?rustMats(M):armMats(M),hairM=new T.MeshStandardMaterial({color:o.hair,roughness:.85}),faceM=new T.MeshStandardMaterial({vertexColors:true,roughness:.7,emissive:0x45302a}),
  white=new T.MeshStandardMaterial({color:0xe9e4da,roughness:.35}),clothM=surfaceMaterial('linen',o.cloth,[2,2]),overM=surfaceMaterial('leather',o.over,[2,2]);
 mesh(new T.CylinderGeometry(.062,.07,.16,12),M.skin,g,[0,1.5,0]);
 const geo=headGeo(o),H=new T.Group();H.position.set(0,1.655,.005);H.scale.setScalar(.13);g.add(H);mesh(geo,faceM,H);
 const ball=new T.SphereGeometry(1,14,10),dk=new T.MeshStandardMaterial({color:o.eye,roughness:.3}),blk=new T.MeshBasicMaterial({color:0x050505}),sp=new T.MeshBasicMaterial({color:0xffffff});
 for(const s of[-1,1]){const e=new T.Group();e.position.set(s*.325,.16,.835);H.add(e);mesh(ball,white,e,[0,0,0],[.155,.12,.085]);mesh(ball,dk,e,[0,0,.07],[.09,.09,.03]);mesh(ball,blk,e,[0,0,.088],[.045,.045,.016]);mesh(ball,sp,e,[s*.02,.02,.1],[.011,.011,.008]);
  mesh(new T.SphereGeometry(1,14,8,0,6.283,0,1.5),M.skin,e,[0,.035,-.005],[.17,.13,.098]);
  mesh(new T.BoxGeometry(.38,o.female?.05:.085,.07),hairM,H,[s*.3,.43,.93]).rotation.z=-s*.16;
  mesh(ball,M.skin,H,[s*.88,0,-.02],[.1,.26,.17]).rotation.y=s*.3}
 mesh(new T.BoxGeometry(.28,.032,.045),new T.MeshStandardMaterial({color:0x4a1f1f}),H,[0,-.535,.93]);
 const hat=o.head,closed=hat==='bascinet'||hat==='visored'||hat==='exec'||hat==='plague',hidden=['helmet','hood','scarf','sallet','coifL','wimple','skullcap','gugel','gugelL'].includes(hat)||closed||(hat==='nasal'&&o.mailHood);
 if(!hidden&&o.hairStyle!=='bald'){const L=o.hairStyle==='long'||o.hairStyle==='braid';
  mesh(shell(geo,o.hairStyle==='tonsure'?(x,y,z)=>(y>.1&&y<.62&&z<.5)||(z<.1&&y>-.15&&y<.62):(x,y,z)=>y>.5||(z<.12&&y>(L?-.95:-.15)),.07,.05),hairM,H);
  if(L)mesh(new T.CylinderGeometry(.95,.8,2.4,20,1,true,Math.PI*.55,Math.PI*.9),new T.MeshStandardMaterial({color:o.hair,roughness:.85,side:T.DoubleSide}),H,[0,-1.25,-.12]);
  if(o.hairStyle==='bun'&&hat!=='nasal')mesh(ball,hairM,H,[0,.75,-.8],[.38,.34,.34]);
  if(o.hairStyle==='braid')for(let i=0;i<7;i++)mesh(ball,hairM,H,[.25,-.7-i*.42,-.95-i*.03],[.24-i*.012,.28,.2]);}
 if(o.beard!=='none'&&o.beard!=='stubble'&&hat!=='hood'&&!closed&&!o.mask){const full=o.beard==='full';mesh(shell(geo,(x,y,z)=>y<(full?-.12:-.25)&&z>-.05&&!((x/.34)**2+((y+.52)/.11)**2<1),.075,full?.12:.05),hairM,H)}
 if(hat==='hood'){if(o.role==='sword'||o.mailHood)buildCoif(g,H,geo,o,AR.mail);else{const cl=garMat('linen',o.hoodCol||o.cloak||o.cloth);buildCoif(g,H,geo,o,cl,{shellOff:.13,teeth:o.ragged?9:0,hem0:1.33,ragged:o.ragged?1:0})}}
 headwear(g,H,geo,o,AR,M);
 if(hat==='scarf'){const sc=hatMat('cloth',o.hatCol||0xd8cfb8);mesh(shell(geo,(x,y,z)=>y>-.15&&!(z>.3&&y>-.45&&y<.5&&Math.abs(x)<.72),.1,.03),sc,H);mesh(cg('scknot',()=>new T.SphereGeometry(.28,10,8)),sc,H,[0,-.25,-1.05],[1,.8,.7]);for(const sd of[-1,1]){const e=mesh(cg('scend',()=>new T.ConeGeometry(.22,.9,6)),sc,H,[sd*.18,-.75,-1.05]);e.rotation.z=Math.PI+sd*.25}}
 if(hat==='cap'){mesh(shell(geo,(x,y,z)=>y>.15||(z<-.1&&y>-.35),.12,.02),hatMat('cloth',o.hatCol||0xd8cfb8),H);ring(H,hatMat('cloth',0xc8bea8),1.0,.2,.08,1.08);for(const sd of[-1,1]){const t=mesh(cg('capstr',()=>new T.CylinderGeometry(.04,.04,1.2,5)),hatMat('cloth',0xd8cfb8),H,[sd*.85,-.5,.1]);t.rotation.z=sd*.25}}
 if(o.mask)mesh(shell(geo,(x,y,z)=>y<-.2&&z>-.2,.12,.03),garMat('linen',o.maskCol||0x2a2420),H);
 if(hat==='helmet'){if(!o.noCoif)buildCoif(g,H,geo,o,AR.mail);kettleHat(H,AR)}                 // Eisenhut über Kettenhaube
 if(hat==='nasal'){if(o.mailHood)buildCoif(g,H,geo,o,AR.mail);nasalHelm(H,AR)}    // Nasalhelm (optional mit Kettenhaube)
 if(hat==='bascinet'||hat==='visored'){bascinet(H,AR,hat==='visored');mesh(capeGeo(o,{top1:1.548,top0:1.525,topR:.09,teeth:0,hem0:1.33}),AR.mail,g)}   // Beckenhaube + Helmbrünne
 if(hat==='sallet')salletHelm(H,AR);
 // ===== Zivile Kopfbedeckungen (neu modelliert) =====
 const lat=(pts,seg=28)=>new T.LatheGeometry(pts.map(([r,y])=>new T.Vector2(r,y)),seg);
 if(hat==='strawhat'){   // Strohhut: geflochtene Kalotte, breite, leicht hängende Krempe, Hutband
  const sm=hatMat('straw');mesh(cg('shat2',()=>lat([[0,1.62],[.42,1.6],[.78,1.5],[.98,1.28],[1.05,1.0],[1.08,.86],[1.4,.82],[1.8,.74],[2.1,.6],[2.18,.52],[2.12,.5],[1.78,.66],[1.38,.76],[1.06,.8],[1.0,.98],[.94,1.24],[.74,1.46],[.4,1.55],[0,1.57]],36)),sm,H);
  mesh(cg('shband',()=>lat([[1.07,.86],[1.07,1.12]],36)),hatMat('band',o.hatCol||0x6a3a22),H,[0,0,0],[1.005,1,1.005])}
 if(hat==='hunterhat'){  // Jägerhut aus Filz: hohe, eingedrückte Kalotte, hinten hochgeschlagene Krempe, lange Feder
  const fm=hatMat('felt',o.hatCol||0x3d5a35);mesh(cg('hhat2',()=>lat([[0,1.9],[.35,1.95],[.6,1.85],[.82,1.5],[.98,1.1],[1.04,.84],[.98,.86],[.92,1.1],[.78,1.48],[.55,1.8],[.3,1.86],[0,1.82]],26)),fm,H);
  mesh(cg('hbrim2',()=>paramGeo((u,v)=>{const a=u*2*Math.PI,r=1.02+v*.85,up=Math.max(0,-Math.cos(a))*.55*v*v;return[r*Math.sin(a),.82+up-.08*v*v*Math.max(0,Math.cos(a)),r*1.05*Math.cos(a),1]},40,4)),fm,H);
  ring(H,hatMat('band',0x2a2018),1.03,.95,.07,1.05);
  const feather=hatMat('feather',0xcc4a2a);mesh(cg('hfeath',()=>{const pts=[];for(let k=0;k<=12;k++){const t=k/12;pts.push(new T.Vector3(.9+.2*t,1.0+1.4*t,-.4-.9*t*t))}return new T.TubeGeometry(new T.CatmullRomCurve3(pts),16,.09,5,false)}),feather,H)}
 if(hat==='chaperon'){   // Chaperon: gepolsterter Wulst, seitlich fallender Stoffkamm (Sendelbinde) und langer Zipfel
  const cm=hatMat('cloth',o.cloak||o.hatCol||0x5a1e1e);mesh(cg('chroll',()=>new T.TorusGeometry(1.05,.32,10,26)),cm,H,[0,.95,0]).rotation.x=Math.PI/2;
  mesh(cg('chtop',()=>new T.SphereGeometry(1.0,18,10,0,Math.PI*2,0,1.3)),cm,H,[0,.95,0],[1,.75,1.05]);
  mesh(cg('chcomb',()=>paramGeo((u,v)=>{const a=-.4+u*1.6,y=1.25-v*(1.5+.38*Math.pow(Math.abs(Math.sin(u*Math.PI*6)),.6)),r=1.05+.35*v+.12*Math.sin(u*14)*v;return[r*Math.sin(a+Math.PI/2),y,r*Math.cos(a+Math.PI/2)*.6,.85+.15*Math.sin(u*14)]},18,8)),cm,H);
  mesh(cg('chtail',()=>{const pts=[];for(let k=0;k<=10;k++){const t=k/10;pts.push(new T.Vector3(-.3-.4*t,.9-2.6*t,-.95-.3*Math.sin(t*3)))}return new T.TubeGeometry(new T.CatmullRomCurve3(pts),14,.16,7,false)}),cm,H)}
 if(hat==='plume'){      // Barett mit Straußenfeder: weiche flache Kopfplatte, gefältelt, Brosche
  const bm=hatMat('cloth',o.hatCol||0x2a2a4a);mesh(cg('beret',()=>lat([[0,1.55],[.7,1.58],[1.25,1.42],[1.45,1.22],[1.32,1.05],[1.08,.92],[1.02,.85],[1.0,.95],[1.2,1.08],[1.05,1.32],[.6,1.45],[0,1.48]],30)),bm,H,[0,0,0],[1,1,1]).rotation.z=-.12;
  mesh(cg('brooch',()=>new T.SphereGeometry(.12,10,8)),hatMat('gold'),H,[.95,1.15,.55]);
  const fw=hatMat('feather',0xf0ece2);for(let f=0;f<3;f++)mesh(cg('plf'+f,()=>{const pts=[];for(let k=0;k<=14;k++){const t=k/14;pts.push(new T.Vector3(.95+.4*t+f*.06,1.2+1.0*t-.6*t*t,.5-1.6*t))}return new T.TubeGeometry(new T.CatmullRomCurve3(pts),18,.11-.02*f,6,false)}),f?hatMat('feather',0xd8c090):fw,H)}
 if(hat==='mitre'){      // Mitra: zwei spitze Schilde aus weißem Seidendamast mit Goldborten, Kreuz, herabhängende Bänder
  const wm=hatMat('cloth',0xf2eee2),gm=hatMat('gold');mesh(cg('mitb',()=>lat([[0,.98],[1.02,.98],[1.04,.8],[0,.8]],28)),gm,H);
  for(const zs of[1,-1]){const sh=new T.Shape();sh.moveTo(-.95,0);sh.lineTo(.95,0);sh.quadraticCurveTo(.9,1.2,0,2.1);sh.quadraticCurveTo(-.9,1.2,-.95,0);const q=new T.ExtrudeGeometry(sh,{depth:.06,bevelEnabled:false});q.translate(0,.95,zs*.42-(zs>0?0:.06));const m=mesh(q,wm,H);m.rotation.x=-zs*.12;
   const b=new T.Mesh(new T.BoxGeometry(.16,1.9,.07),gm);b.position.set(0,1.85,zs*.47);b.rotation.x=-zs*.12;H.add(b);const c=new T.Mesh(new T.BoxGeometry(.7,.14,.07),gm);c.position.set(0,2.25,zs*.5);c.rotation.x=-zs*.12;H.add(c)}
  for(const sx of[-.35,.35]){const t=new T.Mesh(new T.BoxGeometry(.22,1.4,.05),gm);t.position.set(sx,.2,-1.0);H.add(t)}}
 if(hat==='plague'){     // Pestdoktor: Lederkapuze, Schnabelmaske mit Glasaugen, breitkrempiger Hut
  const bk=garMat('leather',0x161412),bone=hatMat('cloth',0xe2d6b8),gl=new T.MeshStandardMaterial({color:0x1a2a2c,metalness:.5,roughness:.15}),br=hatMat('gold');
  buildCoif(g,H,geo,o,bk,{shellOff:.13,teeth:0,hem0:1.27,top1:1.6,top0:1.53,topR:.105});
  mesh(cg('pdface',()=>new T.SphereGeometry(1,22,16,Math.PI/2-1.4,2.8,.7,1.85)),bone,H,[0,-.02,.02],[1.13,1.12,1.15]);
  const bkM=mesh(cg('pdbeak',()=>new T.ConeGeometry(.42,2.1,16)),bone,H,[0,-.62,1.95]);bkM.rotation.x=Math.PI/2+.42;bkM.scale.set(1,1,.82);
  ring(H,hatMat('band',0x8a6a40),1.02,-.3,.06,1.0);
  for(const sd of[-1,1]){const e=mesh(cg('pdeye',()=>new T.CylinderGeometry(.24,.24,.1,18)),gl,H,[sd*.38,.2,1.08]);e.rotation.x=Math.PI/2;const rr=mesh(cg('pdrim',()=>new T.TorusGeometry(.25,.05,6,18)),br,H,[sd*.38,.2,1.13])}
  const hm=hatMat('felt',0x181614);mesh(cg('pdhat',()=>lat([[0,1.68],[.85,1.68],[1.02,1.5],[1.08,1.1],[1.1,.92],[2.25,.86],[2.35,.8],[2.2,.78],[1.08,.84],[0,.86]],32)),hm,H);
  ring(H,hatMat('band',0x3a2a1a),1.09,.98,.1,1.04)}
 // Körperkleidung – jede Lage liegt auf der darunterliegenden auf
 const bel=o.build==='stout'?.045:0,dirt=o.dirt||0,dz={belly:bel,dirt};let base=null;
 if(o.outfit==='gambeson'){buildGambeson(g,o);addLayer(g,{P:GBP,chest:.07,chestW:.09,disp:()=>[GB.amp,1]});if(o.mailShirt){mesh(garment('mail',MAILS),mailMat(2.24,1.79),g);addLayer(g,MAILS,{ymin:.6,ymax:1.48})}if(o.breast){breastplate(g,AR);addLayer(g,{P:GBP,chest:.085,chestW:.15,disp:()=>[GB.amp+.016,1]},{ymin:.86,ymax:1.39})}}
 if(o.tabard&&o.outfit==='gambeson'){const ex=(o.breast?.03:0)+(o.mailShirt?.012:0),tc=o.fac||o.over||0x2a4a8a,S=tabardS(ex,false),S2=tabardS(ex,true);   // Wappenrock: ärmellos, seitlich offen, gezaddelter Saum in Kontrastfarbe
  mesh(garment(KEY('tb',[ex]),S),garMat('linen',tc),g);mesh(garment(KEY('tb2',[ex]),S2),garMat('linen',o.tabTrim||0xd8b040),g);addLayer(g,S)}
 if(['tunic','jerkin','vest','smock'].includes(o.outfit)){base=tunicS({...dz,hem:o.outfit==='smock'?.6:o.hem||.52});mesh(garment(KEY('tu',[bel,dirt,o.outfit==='smock',o.hem]),base),garMat(o.outfit==='smock'?'leather':'linen',o.cloth),g);addLayer(g,base)}
 if(o.outfit==='jerkin'){const S=jerkS(dz);mesh(garment(KEY('je',[bel,dirt]),S),garMat('leather',o.over),g);addLayer(g,S);const pts=[];for(let y=.78;y<1.46;y+=.045){const p=gPt(S,0,y);pts.push([0,y,p[2]+.004])}rivets(g,AR.brass,pts,.007,[1,1,.6])}
 if(o.outfit==='vest'){const S=vestS(dz);mesh(garment(KEY('ve',[bel,dirt]),S),garMat('leather',o.vestCol||o.over),g);addLayer(g,S);
  for(const y of[1.0,1.12,1.24]){const l=gPt(S,.3,y),r=gPt(S,-.3,y);tube(g,new T.MeshStandardMaterial({color:0x2a2018,roughness:1}),[l,[0,y,(l[2]+r[2])/2+.006],r],.003)}}
 if(o.outfit==='dress'){base=dressS(dz);mesh(garment(KEY('dr',[bel,dirt]),base),garMat('linen',o.cloth),g);addLayer(g,base);
  const lace=new T.MeshStandardMaterial({color:0x2a2018,roughness:1});for(const s2 of[1,-1]){const pts=[];for(let k=0;k<=7;k++){const a=(k%2?.05:-.05)*s2,y=1.0+k*.045,p=gPt(base,a,y);pts.push([p[0],y,p[2]+.004])}tube(g,lace,pts,.0024)}}
 if(o.outfit==='robe'||o.outfit==='gown'){base=robeS({...dz,gown:o.outfit==='gown'});mesh(garment(KEY('rb',[bel,dirt,o.outfit]),base),garMat('linen',o.cloth),g);addLayer(g,base);
  if(o.scap!=null)for(const b of[0,1]){const S=scapS(b,dz);mesh(garment(KEY('sc',[b,bel]),S),garMat('linen',o.scap),g);addLayer(g,S)}
  if(o.outfit==='gown'){const fc=o.furCol||0x5a4632;furTube(g,fc,Array.from({length:33},(_,i)=>{const a=-Math.PI+i/32*2*Math.PI,p=gPt(base,a,.11);return[p[0]*1.02,.11,p[2]*1.02]}),.022,true);
   furTube(g,fc,Array.from({length:25},(_,i)=>{const a=-Math.PI+i/24*2*Math.PI,y=gbTop(a)-.005,p=gPt(base,a,Math.min(y,1.55));return[p[0]*1.06,p[1],p[2]*1.06]}),.024,true)}}
 if(o.apron&&base){const kind=o.apron===true?'half':o.apron,S=apronS(kind,base.P,dz),col=o.apronCol||(kind==='smith'||kind==='half'&&o.role!=='miller'?0x5a3e28:0xe8e2d0);
  mesh(garment(KEY('ap',[kind,base.P===TUP?0:base.P===DRP?1:2,bel,dirt]),S),garMat(kind==='smith'||col===0x5a3e28?'leather':'linen',col),g);addLayer(g,S,{add:.004});
  if(kind==='bib'||kind==='smith'){const m=garMat('leather',col);for(const s2 of[-1,1]){const p=gPt(S,s2*.4,S.top(s2*.4)-.01);tube(g,m,[[p[0],p[1],p[2]+.004],[s2*.08,1.47,.05],[s2*.07,1.5,-.03],[0,1.49,-.085]],.006)}}
  if(kind==='herb')for(const s2 of[-1,1])mesh(paramGeo((u,v)=>{const a=s2*.45+(u-.5)*.35,y=.8-.1*v,p=gPt(S,a,y),r=Math.hypot(p[0],p[2]);return[p[0]*(1+.008/r),y,p[2]*(1+.008/r)]},4,2),garMat('linen',new T.Color(col).multiplyScalar(.8).getHex()),g)}
 if(o.hood==='cowl')cowlDown(g,o,garMat('linen',o.hoodCol||o.cloth));
 if(o.cloak)cloakUp(g,o,AR);
 o.patchS=base;
 optimizePerson(g)}
export function dressArms(g,o,M){if(o.outfit==='mail'||o.outfit==='plate')o.outfit='gambeson';
 for(const c of[...g.children])if(c.isMesh&&!c.userData.pp&&c.geometry.type==='SphereGeometry'&&Math.abs(c.position.y-1.425)<.02)c.removeFromParent();   // Basis-Schulterpolster
 dressSleeves(g,o,M);optimizePerson(g)}

const cy=(par,mat,r1,r2,h,pos,rot=[0,0,0],seg=10)=>{const m=mesh(new T.CylinderGeometry(r1,r2,h,seg),mat,par,pos);m.rotation.set(...rot);return m};
export function gear(g,o,M){const R=o.role,AR=o.rust?rustMats(M):armMats(M),st=M.steel,lea=M.leather,wd=new T.MeshStandardMaterial({color:0x6a4a2c,roughness:1}),cl=c=>new T.MeshStandardMaterial({color:c,roughness:1,side:T.DoubleSide});
 const at=(a,y,off=0)=>onBody(g,a,y,off),grp=(a,y,off,rz=0)=>{const q=new T.Group();q.position.set(...at(a,y,off));q.rotation.set(0,a,rz);g.add(q);return q};
 const dagger=(a,rz=.08)=>{const d=grp(a,.9,.022,rz);cy(d,lea,.014,.014,.09,[0,.045,0]);mesh(cg('dgg',()=>new T.BoxGeometry(.065,.012,.02)),st,d,[0,-.002,0]);mesh(cg('dgs',()=>new T.BoxGeometry(.034,.15,.016)),lea,d,[0,-.085,0])};
 const quiver=()=>{const q=grp(Math.PI+.38,1.13,.07,.22);q.rotation.y=0;cy(q,lea,.062,.05,.5,[0,0,0]);ring(q,M.leather,.064,.24,.15);for(let i=0;i<6;i++){const x=(i-2.5)*.011,z=((i%3)-1)*.018;cy(q,wd,.006,.006,.26,[x,.34,z],[0,0,0],5);mesh(cg('fl',()=>new T.BoxGeometry(.03,.07,.004)),new T.MeshStandardMaterial({color:i%2?0xf0ecd8:0xb83a2a}),q,[x-.012,.45,z])}};
 const hammer=a=>{const h=grp(a,.84,.03,-.08);cy(h,wd,.014,.014,.3,[0,0,0]);mesh(cg('hmh',()=>new T.BoxGeometry(.11,.06,.055)),st,h,[0,.15,0])};
 const hatchet=a=>{const h=grp(a,.84,.03,-.1);cy(h,wd,.014,.014,.3,[0,0,0]);mesh(cg('hth',()=>new T.BoxGeometry(.11,.075,.018)),st,h,[.04,.13,0])};
 const hipBag=(a,col=0x6a4a2a)=>{const b=grp(a,.84,.04);mesh(cg('hbg',()=>new T.BoxGeometry(.13,.16,.065)),new T.MeshStandardMaterial({color:col,roughness:1}),b);mesh(cg('hbf',()=>new T.BoxGeometry(.135,.06,.07)),lea,b,[0,.06,.005])};
 const flask=(a,y,col=0x6fb6d9)=>{const p=at(a,y,.04),fm=new T.MeshStandardMaterial({color:col,roughness:.3,transparent:true,opacity:.85});cy(g,fm,.032,.028,.1,p);cy(g,wd,.01,.01,.03,[p[0],p[1]+.065,p[2]])};
 const shoulders=(mat=lea,wide=.11)=>{for(const s of[-1,1]){const pad=mesh(new T.SphereGeometry(1,12,8,0,6.283,0,1.45),mat,g,[s*.25,1.45,.0],[wide,.08,.13]);pad.rotation.z=-s*.28}};
 const boots=(high=false)=>{for(const{knee}of g.legs){cy(knee,lea,.064,.059,high?.18:.1,[0,-.28,.0]);if(high)ring(knee,lea,.064,-.19,.15)}};
 const bag=()=>{const a=at(.55,1.32,.008),b=at(-1.25,.9,.03);ribbon(g,lea,[a,[.17,1.485,.0],at(Math.PI-.6,1.3,.01),at(Math.PI+1.0,1.05,.012),b],.035);hipBag(-1.25,0x7a5a3a)};
 // Gürtel auf der äußersten Lage (Seil beim Mönch, Riemen sonst)
 if(o.outfit==='gambeson')fittedBelt(g,o,M);
 else if(o.belt==='rope'){const pts=[];for(let i=0;i<=32;i++){const a=-Math.PI+i/32*2*Math.PI;pts.push(at(a,.95,.007))}const rm=new T.MeshStandardMaterial({color:o.ropeCol||0xd8cfb8,roughness:1});tube(g,rm,pts,.008,true);
  const e=at(-.35,.95,.012);tube(g,rm,[e,[e[0]-.01,.8,e[2]+.01],[e[0]-.015,.6,e[2]+.012]],.007);rivets(g,rm,[[e[0]-.01,.82,e[2]+.01],[e[0]-.013,.72,e[2]+.012],[e[0]-.015,.62,e[2]+.013]],.014)}
 else{const y=o.outfit==='dress'?.975:.945,bm=new T.MeshStandardMaterial({color:o.beltCol||o.over,roughness:1,side:T.DoubleSide});beltOn(g,y,o.outfit==='dress'?.018:.032,bm);const p=at(0,y,.012);ring(g,st,.016,y,.15).position.set(...p)}
 boots(R==='archer'||R==='hunter'&&o.shins!=='boots'||R==='sword');
 if(o.bag&&o.outfit!=='gambeson')bag();
 if(R==='sword'&&o.rank!=='militia'){const sh=mesh(new T.CylinderGeometry(.18,.24,.1,18,1,true),cl(o.fac||(o.rank==='guard'?0x7a2a2a:0x2f4a6a)),g,[-.37,1.03,.07],[1.05,1,.18]);sh.rotation.z=Math.PI/2;mesh(new T.TorusGeometry(.19,.018,5,18),st,g,[-.42,1.03,.07]).rotation.y=Math.PI/2}
 if(R==='archer'){quiver();cy(g.left.elbow,lea,.068,.062,.13,[0,-.2,0]);dagger(-1.5);if(!o.mailHood)shoulders(lea,.1);if(o.rank==='marksman')hipBag(1.2,0x4d5a3a)}
 if(R==='bandit'){dagger(1.5,-.08);if(o.rank!=='brute')dagger(-1.45);hipBag(-1.2,0x3a2e24);if(o.rank==='poacher'){mesh(BTN_GEO,cl(0x6a5a46),g,at(Math.PI+.2,1.1,.13),[.15,.17,.11]);quiver()}
  if(o.rank==='leader')hipBag(1.15,0x5a2a24)}
 if(R==='farmer'){const s2=grp(-1.35,.9,.02,.1);cy(s2,wd,.013,.013,.12,[0,.06,0]);const bl=mesh(new T.TorusGeometry(.085,.009,6,16,Math.PI*1.25),st,s2,[.05,-.05,0]);bl.rotation.z=1.6;
  const bk=grp(Math.PI,1.06,.12);mesh(wickerGeo(.15,.1,.22),WICK,bk,[0,-.1,0]);for(let i=0;i<7;i++)cy(bk,new T.MeshStandardMaterial({color:0xd9b84a}),.006,.006,.28,[-.08+i*.027,.2,((i%2)-.5)*.04],[(i%3-1)*.12,0,(i-3)*.06],4)}
 if(R==='wood'){hatchet(1.45);dagger(-1.5)}
 if(R==='hunter'){quiver();const hn=mesh(new T.TorusGeometry(.085,.021,8,16,Math.PI),new T.MeshStandardMaterial({color:0xe6dcc0,roughness:.5}),g,at(1.25,.93,.04));hn.rotation.set(0,1.2,0);dagger(-1.5)}
 if(R==='mason'){hammer(1.35);hipBag(-1.3,0x8a8a84)}
 if(R==='smith'){leatherGloves(g,M,g.left);hammer(1.5);hipBag(-1.45,0x4a403a)}
 if(R==='tanner')leatherGloves(g,M);
 if(R==='miner'){leatherGloves(g,M);hipBag(1.3,0x555555);const l=grp(2.3,1.0,.05);mesh(cg('lmp',()=>new T.CylinderGeometry(.06,.05,.13,12)),new T.MeshStandardMaterial({color:0xf3c55a,emissive:0xffd36a,emissiveIntensity:.3}),l)}
 if(R==='healer'){hipBag(1.25,0x6a7a4a);flask(.95,.86);flask(1.12,.86,0xb08a4c)}
 if(R==='weaver'){const b=grp(1.5,.86,.06);mesh(wickerGeo(.07,.06,.09),WICK,b,[0,-.05,0]);for(const[x,c]of[[-.03,0xeeeeee],[.03,0xb83a2a]])mesh(BTN_GEO,new T.MeshStandardMaterial({color:c,roughness:1}),b,[x,.05,0],[.035,.035,.035])}
 if(R==='keeper'){hipBag(-1.3,0x6a4a2a);const p=at(.8,.92,.06);cy(g,new T.MeshStandardMaterial({color:0xb19650,metalness:.35,roughness:.45}),.04,.05,.12,p)}
 if(R==='trader'){hipBag(-1.3,0x6a2a2a);hipBag(1.3,0x6a4a2a)}
 if(R==='cook'&&o.butcher){const c=grp(1.4,.86,.03);mesh(cg('clv',()=>new T.BoxGeometry(.09,.06,.006)),st,c,[0,-.02,0]);cy(c,wd,.01,.01,.08,[0,.05,0])}
 if(R==='shepherd'&&!o.bag)bag();
 if(o.hands==='lea')leatherGloves(g,M);
 accessories(g,o,M,AR);legWear(g,o,AR);
 if(o.arms)armArmor(g,o,M,o.arms);if(o.legs)legArmor(g,M,o.legs);if(o.hands==='hour')gauntlets(g,M);
 optimizePerson(g)}
