/* Linked constructions: validated references, acyclic resolution and recoverable degeneracy. */
(function(global){
 const MI=global.FZI.MathIllustration,kinds={perimeter:1,area:1,midpoint:2,perpendicular:2,parallel:2,perpendicularBisector:2,bisector:3,tangent:2};
 function validate(c){if(!c||!Object.prototype.hasOwnProperty.call(kinds,c.kind)||!Array.isArray(c.sources)||c.sources.length!==kinds[c.kind])throw Error('Ongeldige constructie.');for(const s of c.sources){if(!s||typeof s.objectId!=='string'||!s.objectId||s.part!=null&&!['start','end','vertex','edge'].includes(s.part)||['vertex','edge'].includes(s.part)&&(!Number.isInteger(s.index)||s.index<0))throw Error('Ongeldige constructiebron.');}if(c.kind==='tangent'&&![0,1].includes(c.branch??0))throw Error('Ongeldige raaklijntak.');}
 function point(o,s){if(s.part==='vertex'){if(!o.vertices||!o.vertices[s.index])throw Error('Hoekpunt bestaat niet.');return o.vertices[s.index];}if(['start','end'].includes(s.part)&&MI.LinearGeometry.isLinear(o))return s.part==='start'?{x:o.x1,y:o.y1}:{x:o.x2,y:o.y2};if(o.type==='point')return {x:o.x,y:o.y};throw Error('Selecteer een punt of een eindpunt.');}
 function line(o,s){if(s.part==='edge'&&o.type==='polygon'){const a=o.vertices[s.index],b=o.vertices[(s.index+1)%o.vertices.length];if(!a)throw Error('Zijde bestaat niet.');return {x1:a.x,y1:a.y,x2:b.x,y2:b.y};}if(MI.LinearGeometry.isLinear(o))return o;throw Error('Selecteer een lijn of een zijde.');}
 const unit=(x,y)=>{const l=Math.hypot(x,y);return l<1e-9?null:{x:x/l,y:y/l};};
 const linear=(type,p,d)=>d?{type,x1:p.x,y1:p.y,x2:p.x+d.x,y2:p.y+d.y}:null;
 function calculate(c,objects){validate(c);const source=c.sources.map(s=>{const o=objects.get(s.objectId);if(!o)throw Error('Constructiebron ontbreekt: '+s.objectId);return o;});
  if(source.some(o=>o.construction && o.constructionValid===false))return null;
  if(['perimeter','area'].includes(c.kind)) {
   const o=source[0];if(!['circle','polygon'].includes(o.type))throw Error('Kies een cirkel, driehoek of veelhoek.');
   let amount,anchor;
   if(o.type==='circle'){amount=c.kind==='area'?Math.PI*o.r*o.r:2*Math.PI*o.r;anchor={x:o.cx,y:o.cy};}
   else {const vs=o.vertices;amount=c.kind==='area'?Math.abs(vs.reduce((sum,p,i)=>{const q=vs[(i+1)%vs.length];return sum+(p.x-vs[0].x)*(q.y-vs[0].y)-(q.x-vs[0].x)*(p.y-vs[0].y);},0))/2:vs.reduce((sum,p,i)=>{const q=vs[(i+1)%vs.length];return sum+Math.hypot(q.x-p.x,q.y-p.y);},0);anchor=MI.PolygonGeometry.anchor(o);}
   if(!Number.isFinite(amount))return null;return {type:'text',...anchor,text:(c.kind==='area'?'Oppervlakte = ':'Omtrek = ')+Number(amount.toFixed(2))};
  }
  const ps=()=>source.map((o,i)=>point(o,c.sources[i]));
  if(c.kind==='midpoint'||c.kind==='perpendicularBisector'){const [a,b]=ps(),p={x:(a.x+b.x)/2,y:(a.y+b.y)/2};return c.kind==='midpoint'?{type:'point',...p}:linear('straight',p,unit(-(b.y-a.y),b.x-a.x));}
  if(c.kind==='parallel'||c.kind==='perpendicular'){const l=line(source[0],c.sources[0]),p=point(source[1],c.sources[1]),dx=l.x2-l.x1,dy=l.y2-l.y1;return linear('straight',p,c.kind==='parallel'?unit(dx,dy):unit(-dy,dx));}
  if(c.kind==='bisector'){const [a,v,b]=ps(),u=unit(a.x-v.x,a.y-v.y),w=unit(b.x-v.x,b.y-v.y);if(!u||!w)return null;return linear('ray',v,unit(u.x+w.x,u.y+w.y)||{x:-u.y,y:u.x});}
  const circle=source[0],p=point(source[1],c.sources[1]);if(circle.type!=='circle')throw Error('Selecteer een cirkel.');const dx=p.x-circle.cx,dy=p.y-circle.cy,d=Math.hypot(dx,dy),r=circle.r,tolerance=1e-9*Math.max(1,d,r);if(r<=0||d<r-tolerance||d<1e-9)return null;
  if(Math.abs(d-r)<=tolerance)return linear('straight',p,unit(-dy,dx));
  const k=r*r/(d*d),h=r*Math.sqrt(Math.max(0,d*d-r*r))/(d*d),sign=c.branch===1?-1:1,q={x:circle.cx+k*dx-sign*h*dy,y:circle.cy+k*dy+sign*h*dx};return {type:'straight',x1:p.x,y1:p.y,x2:q.x,y2:q.y};
 }
 function resolve(input){if(!input.some(o=>o.construction))return input;const map=new Map(input.map(o=>[o.id,JSON.parse(JSON.stringify(o))])),state=new Map();
  // Iterative postorder avoids stack overflows in deeply nested imported chains.
  for(const id of map.keys()){const stack=[{id,exit:false}];while(stack.length){const task=stack.pop(),o=map.get(task.id);if(!o)throw Error('Constructiebron ontbreekt: '+task.id);if(task.exit){let g=calculate(o.construction,map);if(g&&Object.entries(g).some(([k,v])=>['x','y','x1','y1','x2','y2'].includes(k)&&(!Number.isFinite(v)||Math.abs(v)>1e12)))g=null;if(g&&g.type!==o.type)throw Error('Constructietype past niet bij object.');Object.assign(o,g||{}, {constructionValid:!!g});state.set(task.id,2);continue;}if(state.get(task.id)===2)continue;if(state.get(task.id)===1)throw Error('Cyclische constructie.');state.set(task.id,1);if(!o.construction){state.set(task.id,2);continue;}validate(o.construction);if(o.type!==(['area','perimeter'].includes(o.construction.kind)?'text':o.construction.kind==='midpoint'?'point':o.construction.kind==='bisector'?'ray':'straight'))throw Error('Constructietype past niet bij object.');stack.push({id:task.id,exit:true});for(const s of [...o.construction.sources].reverse())stack.push({id:s.objectId,exit:false});}}
  return input.map(o=>map.get(o.id));
 }
 function descendants(objects,ids){const removed=new Set(ids);let changed=true;while(changed){changed=false;for(const o of objects)if(!removed.has(o.id)&&o.construction&&o.construction.sources.some(s=>removed.has(s.objectId))){removed.add(o.id);changed=true;}}return removed;}
 MI.ConstructionService={kinds,validate,point,line,calculate,resolve,descendants};
})(window);
