/* Linked constructions: validated references, acyclic resolution and recoverable degeneracy. */
(function(global){
 const MI=global.FZI.MathIllustration;
 const freeze=v=>{if(v&&typeof v==='object'){Object.values(v).forEach(freeze);Object.freeze(v);}return v;};
 const failure=(code,message)=>{const error=new Error(message);error.code=code;throw error;};
 const recipes={circleByCenterPoint:['circle',['point','point']],circleCircleIntersection:['point',['circle','circle']],lineCircleIntersection:['point',['line','circle']],lineIntersection:['point',['line','line']],lineBetweenPoints:['line',['point','point']],pointOnSegment:['point',['segment']],pointOnCircle:['point',['circle']],perimeter:['text',['figure']],area:['text',['figure']],midpoint:['point',['point','point']],perpendicular:['straight',['line','point']],parallel:['straight',['line','point']],perpendicularBisector:['straight',['point','point']],bisector:['ray',['point','point','point']],tangent:['straight',['circle','point']]};
 const fields={circle:['cx','cy','r'],line:['x1','y1','x2','y2'],point:['x','y'],text:['x','y','text'],straight:['x1','y1','x2','y2'],ray:['x1','y1','x2','y2']};
 const definitions=freeze(Object.fromEntries(Object.entries(recipes).map(([kind,[resultType,sourceRoles]])=>[kind,{kind,resultType,sourceRoles,branches:['tangent','lineCircleIntersection','circleCircleIntersection'].includes(kind)?[0,1]:[],computedFields:fields[resultType]}])));
 const kinds=Object.fromEntries(Object.entries(definitions).map(([kind,d])=>[kind,d.sourceRoles.length]));
 function contract(kind){if(!Object.prototype.hasOwnProperty.call(definitions,kind))failure('INVALID_CONSTRUCTION_KIND','Onbekende constructie.');return definitions[kind];}
 function accepts(object,ref,role){
  if(role==='segment')return (ref.part==='edge'&&object.type==='polygon'&&Number.isInteger(ref.index)&&ref.index>=0&&ref.index<object.vertices.length)||(ref.part==null&&ref.index==null&&['line','vector','dimension'].includes(object.type));
  if(ref.index!=null&&!['vertex','edge'].includes(ref.part))return false;
  if(role==='point'){if(ref.part==null)return object.type==='point';if(['start','end'].includes(ref.part))return MI.LinearGeometry.isLinear(object);return ref.part==='vertex'&&['polygon','angle'].includes(object.type)&&Array.isArray(object.vertices)&&Number.isInteger(ref.index)&&ref.index>=0&&ref.index<object.vertices.length;}
  if(role==='line'){if(ref.part==null)return MI.LinearGeometry.isLinear(object);return ref.part==='edge'&&object.type==='polygon'&&Number.isInteger(ref.index)&&ref.index>=0&&ref.index<object.vertices.length;}
  return ref.part==null&&(role==='circle'?object.type==='circle':['circle','polygon'].includes(object.type));
 }
 const pathKind=kind=>['pointOnSegment','pointOnCircle'].includes(kind);
 const schema2=kind=>pathKind(kind)||['lineBetweenPoints','lineIntersection','lineCircleIntersection','circleCircleIntersection','circleByCenterPoint'].includes(kind);
 function normaliseParameter(kind,value=0){if(!pathKind(kind)){if(value!==0)failure('INVALID_PARAMETER','Deze constructie heeft geen padparameter.');return undefined;}if(typeof value!=='number'||!Number.isFinite(value))failure('INVALID_PARAMETER','De padpositie moet eindig zijn.');if(kind==='pointOnSegment')return Math.max(0,Math.min(1,value));const t=value%1;return t<0?t+1:t===0?0:t;}
 function referencesForRole(o,role){const refs=referenceOptions(o);return role==='segment'?refs.line.filter(ref=>accepts(o,ref,'segment')):refs[role]||[];}
 function projectParameter(kind,o,ref,p){if(kind==='pointOnCircle')return normaliseParameter(kind,Math.atan2(p.y-o.cy,p.x-o.cx)/(2*Math.PI));const l=line(o,ref),dx=l.x2-l.x1,dy=l.y2-l.y1,n=dx*dx+dy*dy;return normaliseParameter(kind,n?((p.x-l.x1)*dx+(p.y-l.y1)*dy)/n:0);}
 function validateReferences(c,objects){validate(c);const d=contract(c.kind);c.sources.forEach((ref,i)=>{const o=objects.get(ref.objectId);if(!o)failure('MISSING_REFERENCE','Constructiebron ontbreekt: '+ref.objectId);if(!accepts(o,ref,d.sourceRoles[i]))failure('INVALID_REFERENCE','Deze bron of dit onderdeel past niet bij de constructie.');});}
 function referenceOptions(o){const refs={point:[],line:[],circle:[],figure:[]};if(!o)return freeze(refs);const whole={objectId:o.id};if(o.type==='point')refs.point.push(whole);if(MI.LinearGeometry.isLinear(o)){refs.point.push({objectId:o.id,part:'start'},{objectId:o.id,part:'end'});refs.line.push(whole);}if(['polygon','angle'].includes(o.type))o.vertices.forEach((p,index)=>{refs.point.push({objectId:o.id,part:'vertex',index});if(o.type==='polygon')refs.line.push({objectId:o.id,part:'edge',index});});if(o.type==='circle')refs.circle.push(whole);if(['circle','polygon'].includes(o.type))refs.figure.push(whole);return freeze(refs);}
 function validateUpdate(objects,current,patch){
  if(current.construction&&Object.prototype.hasOwnProperty.call(patch,'construction')&&!patch.construction)failure('CONSTRUCTION_LINK_MANAGED','Gebruik Constructie losmaken om de koppeling te verwijderen.');
  if(current.construction)for(const key of contract(current.construction.kind).computedFields)if(key in patch&&JSON.stringify(patch[key])!==JSON.stringify(current[key]))failure('COMPUTED_FIELD','Deze waarde wordt berekend. Maak de constructie eerst los om ze vrij te bewerken.');
  if(current.vertices&&Array.isArray(patch.vertices)&&patch.vertices.length!==current.vertices.length&&objects.some(o=>o.construction?.sources.some(ref=>ref.objectId===current.id&&['vertex','edge'].includes(ref.part))))failure('TOPOLOGY_REFERENCED','Dit object heeft gekoppelde hoekpunten of zijden; het aantal hoekpunten kan niet worden gewijzigd.');
 }
 function lineIntersection(c,source){
  const lines=source.map((o,i)=>({...line(o,c.sources[i]),type:c.sources[i].part==='edge'?'line':o.type}));
  const [a,b]=lines,ax=a.x2-a.x1,ay=a.y2-a.y1,bx=b.x2-b.x1,by=b.y2-b.y1,al=Math.hypot(ax,ay),bl=Math.hypot(bx,by);
  const invalid=reasonCode=>({geometry:null,reasonCode});if(al<=1e-9||bl<=1e-9)return invalid('DEGENERATE_DIRECTION');
  const ux=ax/al,uy=ay/al,vx=bx/bl,vy=by/bl,cross=ux*vy-uy*vx,qx=b.x1-a.x1,qy=b.y1-a.y1;
  if(Math.abs(cross)<=1e-12)return invalid(Math.abs(qx*uy-qy*ux)<=1e-9?'COINCIDENT_LINES':'PARALLEL_LINES');
  const distance=(qx*vy-qy*vx)/cross,other=(qx*uy-qy*ux)/cross;
  if(!MI.LinearGeometry.accepts(a,distance/al)||!MI.LinearGeometry.accepts(b,other/bl))return invalid('OUTSIDE_DOMAINS');
  return {geometry:{type:'point',x:a.x1+distance*ux,y:a.y1+distance*uy},reasonCode:'VALID'};
 }
 function lineCircleIntersection(c,source){
  const l={...line(source[0],c.sources[0]),type:c.sources[0].part==='edge'?'line':source[0].type},circle=source[1],dx=l.x2-l.x1,dy=l.y2-l.y1,len=Math.hypot(dx,dy),invalid=reasonCode=>({geometry:null,reasonCode});
  if(circle.r<=0)return invalid('ZERO_RADIUS');if(len<=1e-9)return invalid('DEGENERATE_DIRECTION');
  const ux=dx/len,uy=dy/len,qx=circle.cx-l.x1,qy=circle.cy-l.y1,along=qx*ux+qy*uy,distance=Math.abs(qx*uy-qy*ux),r=circle.r,tolerance=1e-9*Math.max(1,r,distance);
  if(distance>r+tolerance)return invalid('NO_REAL_INTERSECTION');
  const tangent=Math.abs(distance-r)<=tolerance;if(tangent&&c.branch===1)return invalid('MERGED_INTERSECTION');
  const offset=tangent?0:Math.sqrt(Math.max(0,(r-distance)*(r+distance))),position=along+(c.branch===1?offset:-offset);
  if(!MI.LinearGeometry.accepts(l,position/len))return invalid('OUTSIDE_DOMAINS');
  return {geometry:{type:'point',x:l.x1+position*ux,y:l.y1+position*uy},reasonCode:'VALID'};
 }
 function circleCircleIntersection(c,source){
  const [a,b]=source,dx=b.cx-a.cx,dy=b.cy-a.cy,d=Math.hypot(dx,dy),r=a.r,s=b.r,invalid=reasonCode=>({geometry:null,reasonCode}),tolerance=1e-9*Math.max(1,r,s,d);
  if(r<=0||s<=0)return invalid('ZERO_RADIUS');
  if(d<=1e-9)return invalid(Math.abs(r-s)<=tolerance?'COINCIDENT_CIRCLES':'CONCENTRIC_CIRCLES');
  if(d>r+s+tolerance)return invalid('SEPARATE_CIRCLES');
  if(d<Math.abs(r-s)-tolerance)return invalid('CONTAINED_CIRCLES');
  const tangent=Math.abs(d-r-s)<=tolerance||Math.abs(d-Math.abs(r-s))<=tolerance;
  if(tangent&&c.branch===1)return invalid('MERGED_INTERSECTION');
  const scale=Math.max(r,s,d),rn=r/scale,sn=s/scale,dn=d/scale,along=(dn*dn+(rn-sn)*(rn+sn))/(2*dn),heightSquared=rn*rn-along*along;
  if(!tangent&&heightSquared<0)return invalid('CONTAINED_CIRCLES');
  const h=tangent?0:scale*Math.sqrt(Math.max(0,heightSquared)),offset=along*scale,ux=dx/d,uy=dy/d,sign=c.branch===1?-1:1;
  return {geometry:{type:'point',x:a.cx+offset*ux-sign*h*uy,y:a.cy+offset*uy+sign*h*ux},reasonCode:'VALID'};
 }
 function evaluate(c,objects){
  validateReferences(c,objects);const source=c.sources.map(ref=>objects.get(ref.objectId));if(source.some(o=>o.construction&&o.constructionValid===false))return {valid:false,reasonCode:'SOURCE_INVALID',geometry:null};
  const geometry=calculate(c,objects);let reasonCode='VALID';
  if(!geometry){reasonCode=c.kind==='circleCircleIntersection'?circleCircleIntersection(c,source).reasonCode:c.kind==='lineCircleIntersection'?lineCircleIntersection(c,source).reasonCode:c.kind==='lineIntersection'?lineIntersection(c,source).reasonCode:['perpendicularBisector','lineBetweenPoints','pointOnSegment','circleByCenterPoint'].includes(c.kind)?'COINCIDENT_POINTS':c.kind==='pointOnCircle'?'ZERO_RADIUS':['parallel','perpendicular'].includes(c.kind)?'DEGENERATE_DIRECTION':c.kind==='bisector'?'DEGENERATE_ARM':c.kind==='tangent'?(source[0].r<=0?'ZERO_RADIUS':'POINT_INSIDE_CIRCLE'):'NON_FINITE_RESULT';}
  else for(const [key,value] of Object.entries(geometry))if(['x','y','x1','y1','x2','y2','cx','cy','r'].includes(key)){if(!Number.isFinite(value)){reasonCode='NON_FINITE_RESULT';break;}if(Math.abs(value)>1e12){reasonCode='COORDINATE_LIMIT';break;}}
  return {valid:reasonCode==='VALID',reasonCode,geometry:reasonCode==='VALID'?geometry:null};
 }
 function describe(objects,id){const o=objects.find(o=>o.id===id);if(!o)return null;const linked=!!o.construction,result=linked?evaluate(o.construction,new Map(objects.map(o=>[o.id,o]))):{valid:true,reasonCode:'FREE'};return freeze({id,mode:linked?'linked':'free',kind:linked?o.construction.kind:null,...(linked&&contract(o.construction.kind).branches.length?{branch:o.construction.branch??0}:{}),valid:result.valid,reasonCode:result.reasonCode,geometryEditable:!linked&&!o.locked,canDetach:linked&&result.valid&&!o.locked,computedFields:linked?contract(o.construction.kind).computedFields.slice():[],sources:linked?o.construction.sources.map(r=>({objectId:r.objectId,...(r.part!=null?{part:r.part}:{}),...(r.index!=null?{index:r.index}:{})})):[],dependents:objects.filter(child=>child.construction?.sources.some(r=>r.objectId===id)).map(child=>child.id)});}
 function validate(c){if(pathKind(c?.kind)&&(typeof c.parameter!=='number'||!Number.isFinite(c.parameter)||c.parameter<0||c.parameter>1||(c.kind==='pointOnCircle'&&c.parameter===1)))failure('INVALID_PARAMETER','Ongeldige opgeslagen padpositie.');if(!c||!Object.prototype.hasOwnProperty.call(kinds,c.kind)||!Array.isArray(c.sources)||c.sources.length!==kinds[c.kind])throw Error('Ongeldige constructie.');for(const s of c.sources){if(!s||typeof s.objectId!=='string'||!s.objectId||s.part!=null&&!['start','end','vertex','edge'].includes(s.part)||['vertex','edge'].includes(s.part)&&(!Number.isInteger(s.index)||s.index<0))throw Error('Ongeldige constructiebron.');}if(contract(c.kind).branches.length&&!contract(c.kind).branches.includes(c.branch??0))throw Error('Ongeldige raaklijntak.');}
 function point(o,s){if(s.part==='vertex'){if(!o.vertices||!o.vertices[s.index])throw Error('Hoekpunt bestaat niet.');return o.vertices[s.index];}if(['start','end'].includes(s.part)&&MI.LinearGeometry.isLinear(o))return s.part==='start'?{x:o.x1,y:o.y1}:{x:o.x2,y:o.y2};if(o.type==='point')return {x:o.x,y:o.y};throw Error('Selecteer een punt of een eindpunt.');}
 function line(o,s){if(s.part==='edge'&&o.type==='polygon'){const a=o.vertices[s.index],b=o.vertices[(s.index+1)%o.vertices.length];if(!a)throw Error('Zijde bestaat niet.');return {x1:a.x,y1:a.y,x2:b.x,y2:b.y};}if(MI.LinearGeometry.isLinear(o))return o;throw Error('Selecteer een lijn of een zijde.');}
 const unit=(x,y)=>{const l=Math.hypot(x,y);return l<1e-9?null:{x:x/l,y:y/l};};
 const linear=(type,p,d)=>d?{type,x1:p.x,y1:p.y,x2:p.x+d.x,y2:p.y+d.y}:null;
 function calculate(c,objects){validateReferences(c,objects);const source=c.sources.map(s=>objects.get(s.objectId));
  if(source.some(o=>o.construction && o.constructionValid===false))return null;
  if(['perimeter','area'].includes(c.kind)) {
   const o=source[0];if(!['circle','polygon'].includes(o.type))throw Error('Kies een cirkel, driehoek of veelhoek.');
   let amount,anchor;
   if(o.type==='circle'){amount=c.kind==='area'?Math.PI*o.r*o.r:2*Math.PI*o.r;anchor={x:o.cx,y:o.cy};}
   else {const vs=o.vertices;amount=c.kind==='area'?Math.abs(vs.reduce((sum,p,i)=>{const q=vs[(i+1)%vs.length];return sum+(p.x-vs[0].x)*(q.y-vs[0].y)-(q.x-vs[0].x)*(p.y-vs[0].y);},0))/2:vs.reduce((sum,p,i)=>{const q=vs[(i+1)%vs.length];return sum+Math.hypot(q.x-p.x,q.y-p.y);},0);anchor=MI.PolygonGeometry.anchor(o);}
   if(!Number.isFinite(amount))return null;return {type:'text',...anchor,text:(c.kind==='area'?'Oppervlakte = ':'Omtrek = ')+Number(amount.toFixed(2))};
  }
  if(c.kind==='pointOnCircle'){const o=source[0];return o.r>0?{type:'point',x:o.cx+o.r*Math.cos(2*Math.PI*c.parameter),y:o.cy+o.r*Math.sin(2*Math.PI*c.parameter)}:null;}
  if(c.kind==='pointOnSegment'){const l=line(source[0],c.sources[0]);return Math.hypot(l.x2-l.x1,l.y2-l.y1)>1e-9?{type:'point',x:l.x1+c.parameter*(l.x2-l.x1),y:l.y1+c.parameter*(l.y2-l.y1)}:null;}
  if(c.kind==='circleCircleIntersection')return circleCircleIntersection(c,source).geometry;
  if(c.kind==='lineCircleIntersection')return lineCircleIntersection(c,source).geometry;
  if(c.kind==='lineIntersection')return lineIntersection(c,source).geometry;
  const ps=()=>source.map((o,i)=>point(o,c.sources[i]));
  if(c.kind==='circleByCenterPoint'){const [center,p]=ps(),r=Math.hypot(p.x-center.x,p.y-center.y);return r>1e-9?{type:'circle',cx:center.x,cy:center.y,r}:null;}
  if(c.kind==='lineBetweenPoints'){const [a,b]=ps();return Math.hypot(b.x-a.x,b.y-a.y)>1e-9?{type:'line',x1:a.x,y1:a.y,x2:b.x,y2:b.y}:null;}
  if(c.kind==='midpoint'||c.kind==='perpendicularBisector'){const [a,b]=ps(),p={x:(a.x+b.x)/2,y:(a.y+b.y)/2};return c.kind==='midpoint'?{type:'point',...p}:linear('straight',p,unit(-(b.y-a.y),b.x-a.x));}
  if(c.kind==='parallel'||c.kind==='perpendicular'){const l=line(source[0],c.sources[0]),p=point(source[1],c.sources[1]),dx=l.x2-l.x1,dy=l.y2-l.y1;return linear('straight',p,c.kind==='parallel'?unit(dx,dy):unit(-dy,dx));}
  if(c.kind==='bisector'){const [a,v,b]=ps(),u=unit(a.x-v.x,a.y-v.y),w=unit(b.x-v.x,b.y-v.y);if(!u||!w)return null;return linear('ray',v,unit(u.x+w.x,u.y+w.y)||{x:-u.y,y:u.x});}
  const circle=source[0],p=point(source[1],c.sources[1]);if(circle.type!=='circle')throw Error('Selecteer een cirkel.');const dx=p.x-circle.cx,dy=p.y-circle.cy,d=Math.hypot(dx,dy),r=circle.r,tolerance=1e-9*Math.max(1,d,r);if(r<=0||d<r-tolerance||d<1e-9)return null;
  if(Math.abs(d-r)<=tolerance)return linear('straight',p,unit(-dy,dx));
  const k=r*r/(d*d),h=r*Math.sqrt(Math.max(0,d*d-r*r))/(d*d),sign=c.branch===1?-1:1,q={x:circle.cx+k*dx-sign*h*dy,y:circle.cy+k*dy+sign*h*dx};return {type:'straight',x1:p.x,y1:p.y,x2:q.x,y2:q.y};
 }
 function resolve(input){if(!input.some(o=>o.construction))return input;const map=new Map(input.map(o=>[o.id,JSON.parse(JSON.stringify(o))])),state=new Map();
  // Iterative postorder avoids stack overflows in deeply nested imported chains.
  for(const id of map.keys()){const stack=[{id,exit:false}];while(stack.length){const task=stack.pop(),o=map.get(task.id);if(!o)throw Error('Constructiebron ontbreekt: '+task.id);if(task.exit){const g=evaluate(o.construction,map).geometry;if(g&&g.type!==o.type)throw Error('Constructietype past niet bij object.');Object.assign(o,g||{}, {constructionValid:!!g});state.set(task.id,2);continue;}if(state.get(task.id)===2)continue;if(state.get(task.id)===1)throw Error('Cyclische constructie.');state.set(task.id,1);if(!o.construction){state.set(task.id,2);continue;}validate(o.construction);if(o.type!==contract(o.construction.kind).resultType)throw Error('Constructietype past niet bij object.');stack.push({id:task.id,exit:true});for(const s of [...o.construction.sources].reverse())stack.push({id:s.objectId,exit:false});}}
  return input.map(o=>map.get(o.id));
 }
 function descendants(objects,ids){const removed=new Set(ids);let changed=true;while(changed){changed=false;for(const o of objects)if(!removed.has(o.id)&&o.construction&&o.construction.sources.some(s=>removed.has(s.objectId))){removed.add(o.id);changed=true;}}return removed;}
 MI.ConstructionService=Object.freeze({kinds:Object.freeze(kinds),definitions,contract,referenceOptions,referencesForRole,pathKind,schema2,normaliseParameter,projectParameter,validateReferences,validateUpdate,evaluate,describe,validate,point,line,calculate,resolve,descendants});
})(window);
