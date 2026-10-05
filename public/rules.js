/* Shared deterministic rules, used by server and browser. */
(function(root){
 const modular=['wall','battle','palisade','tower','gate','portcullis','stairs'];
 const passOverlap=(a,b)=>(modular.includes(a)&&modular.includes(b))||(a==='moat'&&['moat','gate','portcullis','bridge'].includes(b))||(b==='moat'&&['gate','portcullis','bridge'].includes(a));
 const smooth=(x,a,b)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)};
 const riverX=z=>-58+9*Math.sin(z*.028)+5*Math.sin(z*.07);
 function height(x,z){let h=smooth(Math.hypot(x,z),24,70)*(Math.sin(x*.042)*Math.cos(z*.037)*2.5+Math.sin(z*.077+x*.023)*1.1);const d=Math.abs(x-riverX(z));return h*smooth(d,6,22)-(1-smooth(d,3,7.5))*2.6}
 function local(b,x,z){const a=(b.r||0)*Math.PI/2,c=Math.cos(a),s=Math.sin(a),dx=x-b.x,dz=z-b.z;return [dx*c-dz*s,dx*s+dz*c]}
 function world(b,x,z){const a=(b.r||0)*Math.PI/2,c=Math.cos(a),s=Math.sin(a);return [b.x+x*c+z*s,b.z-x*s+z*c]}
 function base(t,x,z,r,catalog){if(t==='bridge')return 0;if(t==='moat')return height(x,z);const d=catalog[t];if(!d)return height(x,z);let h=-Infinity;const b={x,z,r};for(let i=0;i<=4;i++)for(let j=0;j<=4;j++){const p=world(b,(i/4-.5)*d.w,(j/4-.5)*d.d);h=Math.max(h,height(...p))}return h+.02}
 function drawbridge(b,buildings){return buildings.some(m=>{if(m.t!=='moat')return false;const [x,z]=local(b,m.x,m.z);return Math.abs(x)<3.5&&z>=0&&z<8})}
 function separate(actors,passes=8){const size=2.5;for(let pass=0;pass<passes;pass++){const grid=new Map();for(const a of actors){const key=Math.floor(a.x/size)+','+Math.floor(a.z/size);if(!grid.has(key))grid.set(key,[]);grid.get(key).push(a)}for(const a of actors){const ix=Math.floor(a.x/size),iz=Math.floor(a.z/size);for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++)for(const b of grid.get((ix+dx)+','+(iz+dz))||[]){if(a.id>=b.id||Math.abs((a.el||0)-(b.el||0))>1.5)continue;let x=b.x-a.x,z=b.z-a.z,d=Math.hypot(x,z),r=(a.radius||.42)+(b.radius||.42);if(d>=r)continue;if(d<1e-7){const angle=(a.id*2.399+b.id*1.618)%6.283;x=Math.cos(angle);z=Math.sin(angle);d=1e-7}const l=Math.hypot(x,z);x/=l;z/=l;const push=(r-d)/2;a.x-=x*push;a.z-=z*push;b.x+=x*push;b.z+=z*push}}}}
 const api={modular,passOverlap,height,riverX,local,world,base,drawbridge,separate};if(typeof module!=='undefined')module.exports=api;else root.BFRules=api;
})(typeof globalThis!=='undefined'?globalThis:this);
