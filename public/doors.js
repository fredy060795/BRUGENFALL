import * as T from 'three';
// The same arch profile defines door leaves, frame and the opening in the masonry.
export function doorTop(x,w,h,gothic){if(!gothic)return h;const u=Math.min(1,Math.abs(2*x/w));return h*(.6+.4*Math.sqrt(Math.max(0,1-u)));}
export function addDoor(building,H,{x=0,z=0,y=.08,width=2,height=2.42,angle=0,gothic=false,style='plain',double=width>1.85}){
 const root=new T.Group();root.name='Door:'+style;root.userData.rigidDoor=true;root.position.set(x,y,z);root.rotation.y=angle;building.add(root);
 const wood=H.wood.clone();wood.color.setHex(style==='gothic'?0x92734f:style==='fortified'?0x807362:style==='workshop'?0xb9a17f:0xcfba94);
 const door={root,width,height,gothic,style,leaves:[],amount:0,hold:0};building.doors=building.doors||[];building.doors.push(door);
 const box=(w,h,d,x,y,z,mat,parent=root)=>{const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;parent.add(m);return m};
 // Jambs remain outside the clear opening. No crossbar traverses the doorway.
 const frame=style==='gothic'||style==='fortified'?H.stone:H.wood;
 if(gothic){const border=.16,sh=new T.Shape();sh.moveTo(-width/2-border,0);for(let i=0;i<=32;i++){const x=-(width+2*border)/2+(width+2*border)*i/32;sh.lineTo(x,doorTop(x,width+2*border,height+border,true));}sh.lineTo(width/2+border,0);sh.lineTo(width/2,0);for(let i=0;i<=32;i++){const x=width/2-width*i/32;sh.lineTo(x,doorTop(x,width,height,true));}sh.lineTo(-width/2,0);sh.closePath();const geo=new T.ExtrudeGeometry(sh,{depth:.39,bevelEnabled:false});geo.translate(0,0,-.35);const mesh=new T.Mesh(geo,frame);mesh.name='GothicPortalFrame';mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);}
 else if(style==='gate'){for(const sign of[-1,1])box(.14,height+.2,.14,sign*(width/2+.07),(height+.2)*.5,0,frame);}   // Weidetor: nur Torpfosten, kein Querbalken auf Hüfthöhe
 else{for(const sign of[-1,1])box(.13,height,.19,sign*(width/2+.07),height*.5,0,frame);box(width+.27,.13,.19,0,height+.06,0,frame);}
 const count=double?2:1;
 for(let n=0;n<count;n++){const left=-width/2+n*width/count+.035,right=-width/2+(n+1)*width/count-.035,hinge=n===0?left:right,pivot=new T.Group();pivot.position.x=hinge;root.add(pivot);
 const shape=new T.Shape();shape.moveTo(left-hinge,0);shape.lineTo(right-hinge,0);for(let i=0;i<=24;i++){const xx=right-(right-left)*i/24;shape.lineTo(xx-hinge,Math.max(.1,doorTop(xx,width,height,gothic)-.045));}shape.closePath();
 const geometry=new T.ExtrudeGeometry(shape,{depth:.09,bevelEnabled:false});geometry.translate(0,0,-.045);const uv=geometry.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)/1.5,uv.getY(i)/1.5);
 const leaf=new T.Mesh(geometry,wood);leaf.name='DoorLeaf';leaf.castShadow=leaf.receiveShadow=true;pivot.add(leaf);
 for(const yy of style==='gate'?[height*.2,height*.55,height*.9]:[height*.23,height*.53])box(right-left-.06,.065,.13,(left+right)/2-hinge,yy,0,style==='plain'||style==='gate'?H.wood:H.iron,pivot);
 const handleX=(n===0?right-.16:left+.16)-hinge;
 for(const side of[-1,1]){const handle=new T.Mesh(new T.TorusGeometry(.075,.017,6,12),gothic?H.brass:H.iron);handle.position.set(handleX,Math.min(1.15,height*.55),side*.075);pivot.add(handle);}
 if(style==='fortified'||gothic)for(let xx=left+.12;xx<right-.05;xx+=.22)for(const yy of[height*.23,height*.53])box(.025,.025,.15,xx-hinge,yy,0,H.iron,pivot);
 door.leaves.push({pivot,sign:n===0?1:-1});
 }
 return door;
}
export function updateDoors(building,actors,dt){if(!building.doors)return;building.updateMatrixWorld(true);for(const door of building.doors){const at=door.root.getWorldPosition(new T.Vector3());const near=actors.some(p=>Math.hypot(p.x-at.x,p.z-at.z)<3.8&&Math.abs((p.y??at.y)-at.y)<3);if(near)door.hold=1.8;else door.hold=Math.max(0,door.hold-dt);const target=door.hold>0?1:0;door.amount+=(target-door.amount)*Math.min(1,dt*12);if(Math.abs(target-door.amount)<.001)door.amount=target;for(const leaf of door.leaves)leaf.pivot.rotation.y=leaf.sign*door.amount*Math.PI*.53;}}
